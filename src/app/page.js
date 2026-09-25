'use client';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export default function AdminLiveOrders() {
  const [orders, setOrders] = useState([]);
  const [revenue, setRevenue] = useState(0);

  const fetchOrders = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-ohea.onrender.com';

    fetch(`${API_URL}/api/orders`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOrders(data);
          const totalRev = data.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
          setRevenue(totalRev);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch orders from backend:', err);
        setOrders([]);
        setRevenue(0);
      });
  };

  useEffect(() => {
    fetchOrders();

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-ohea.onrender.com';

    // Socket.io connection with polling fallback for stable connectivity
    const socket = io(API_URL, {
      transports: ['polling', 'websocket'],
      secure: true,
    });

    socket.on('orderStatusUpdated', () => {
      fetchOrders();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCheckpointUpdate = (orderId, newStatus, newProgress) => {
    // Optimistic UI update for instant speed
    setOrders(prev => prev.map(o => (o._id === orderId || o.id === orderId) ? { ...o, status: newStatus, progress: newProgress } : o));

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-ohea.onrender.com';

    fetch(`${API_URL}/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, progress: newProgress })
    })
      .then(() => fetchOrders())
      .catch((err) => {
        console.error('Failed to update checkpoint:', err);
        fetchOrders(); // Revert on failure
      });
  };

  const handleDeleteOrder = (orderId) => {
    // Optimistic UI filter for instant speed
    setOrders(prev => prev.filter(o => o._id !== orderId && o.id !== orderId));

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-ohea.onrender.com';

    fetch(`${API_URL}/api/orders/${orderId}`, {
      method: 'DELETE'
    })
      .then(() => {
        fetchOrders();
      })
      .catch((err) => {
        console.error('Failed to delete order:', err);
        fetchOrders();
      });
  };

  // Bulk delete all orders marked as delivered (progress === 100 or status === 'Delivered')
  const handleClearDeliveredOrders = async () => {
    const deliveredOrders = orders.filter(o => o.progress === 100 || o.status === 'Delivered');
    if (deliveredOrders.length === 0) {
      alert('No delivered orders found to clear.');
      return;
    }

    if (!confirm(`Are you sure you want to remove all ${deliveredOrders.length} delivered orders from the database?`)) {
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-ohea.onrender.com';

    try {
      await Promise.all(
        deliveredOrders.map(ord => {
          const ordId = ord._id || ord.id;
          return fetch(`${API_URL}/api/orders/${ordId}`, { method: 'DELETE' });
        })
      );
      fetchOrders();
    } catch (err) {
      console.error('Failed to clear delivered orders:', err);
      fetchOrders();
    }
  };

  const handleOpenGoogleMaps = (addressString) => {
    if (!addressString) return;
    const gpsMatch = addressString.match(/\[GPS:\s*([0-9.]+),\s*([0-9.]+)\]/);
    let mapsUrl = '';
    
    if (gpsMatch) {
      const lat = gpsMatch[1];
      const lng = gpsMatch[2];
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    } else {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressString)}`;
    }
    
    window.open(mapsUrl, '_blank');
  };

  // Helper function to format exact date and time from database timestamp
  const formatOrderDateTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return timestamp; // fallback if string
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const deliveredCount = orders.filter(o => o.progress === 100 || o.status === 'Delivered').length;

  return (
    <div className="space-y-4 pb-6">
      
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Active Orders</p>
          <p className="text-xl font-black text-emerald-600">{orders.length}</p>
        </div>
        <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Sales Revenue</p>
          <p className="text-xl font-black text-emerald-600">₹{revenue}</p>
        </div>
      </div>

      {/* Dispatch Header & Clear Delivered Button */}
      <div className="flex justify-between items-center px-1">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
          <span>⚡ Live 1-Tap Checkpoint Dispatcher</span>
        </h2>
        {deliveredCount > 0 && (
          <button 
            onClick={handleClearDeliveredOrders}
            className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 px-2.5 py-1 rounded-xl transition cursor-pointer active:scale-95 shadow-sm"
          >
            🗑️ Clear Delivered ({deliveredCount})
          </button>
        )}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white border border-slate-200 p-8 rounded-3xl text-center space-y-2 shadow-sm">
            <p className="text-2xl">🎉</p>
            <p className="text-xs font-bold text-slate-700">No active customer orders in the database right now.</p>
          </div>
        ) : (
          orders.map((ord, idx) => {
            const orderId = ord._id || ord.id;
            const displayTime = formatOrderDateTime(ord.createdAt || ord.time);

            return (
              <div key={orderId || idx} className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm space-y-3 relative">
                
                {/* Top row: Order ID & Exact Date/Time */}
                <div className="flex justify-between items-center">
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-xs font-black font-mono text-emerald-600">{orderId}</span>
                    <span className="text-[10px] font-bold text-slate-500">📅 {displayTime}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-slate-400 mr-1">TOTAL</span>
                    <span className="text-sm font-black text-emerald-600 font-mono">₹{ord.totalPrice}</span>
                  </div>
                </div>

                {/* Customer Contact & GPS / Live Map Tracking Button */}
                <div className="text-xs space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">👤 {ord.customerName || 'Valued Customer'}</span>
                    <a href={`tel:${ord.phone}`} className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      📞 {ord.phone || '9108626303'}
                    </a>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                    <p className="text-[11px] text-slate-600 truncate max-w-[210px]">📍 {ord.address || '[GPS Location]'}</p>
                    <button
                      onClick={() => handleOpenGoogleMaps(ord.address)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg shadow-sm transition flex items-center space-x-1 shrink-0 active:scale-95 cursor-pointer"
                    >
                      <span>🗺️ Track Live Map</span>
                    </button>
                  </div>
                </div>

                {/* 1-Tap Dispatch Checkpoints */}
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">1-Tap Dispatch Checkpoints:</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button 
                      onClick={() => handleCheckpointUpdate(orderId, 'Hub', 0)}
                      className={`py-2 px-3 rounded-xl text-[10px] font-bold border transition cursor-pointer active:scale-95 ${ord.progress === 0 ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                    >
                      1. Hub (0%)
                    </button>
                    <button 
                      onClick={() => handleCheckpointUpdate(orderId, 'Picked', 35)}
                      className={`py-2 px-3 rounded-xl text-[10px] font-bold border transition cursor-pointer active:scale-95 ${ord.progress === 35 ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                    >
                      2. Picked (35%)
                    </button>
                    <button 
                      onClick={() => handleCheckpointUpdate(orderId, 'Near Area', 70)}
                      className={`py-2 px-3 rounded-xl text-[10px] font-bold border transition cursor-pointer active:scale-95 ${ord.progress === 70 ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                    >
                      3. Near Area (70%)
                    </button>
                    <button 
                      onClick={() => handleCheckpointUpdate(orderId, 'Delivered', 100)}
                      className={`py-2 px-3 rounded-xl text-[10px] font-bold border transition cursor-pointer active:scale-95 ${ord.progress === 100 ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}`}
                    >
                      4. Delivered (100%)
                    </button>
                  </div>
                </div>

                {/* Ordered Items Breakdown & Delivery Fee Display */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Order & Delivery Breakdown</p>
                  
                  <div className="space-y-1">
                    {ord.items?.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-slate-800 font-medium">{item.name} <span className="text-slate-400 text-[10px]">({item.quantity} qty)</span></span>
                        <span className="font-mono font-bold text-emerald-600">₹{(item.price || 0) * (item.quantity || 1)}</span>
                      </div>
                    ))}

                    {/* Delivery Partner Fee Row */}
                    <div className="flex justify-between items-center text-xs bg-emerald-50/60 p-2 rounded-lg border border-emerald-200">
                      <span className="text-emerald-900 font-bold flex items-center space-x-1">
                        <span>🛵 Delivery Partner Fee (30 mins guarantee)</span>
                      </span>
                      <span className="font-mono font-bold text-emerald-700">₹{ord.deliveryFee || 30}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Payment Mode & Manual Delete Button */}
                <div className="flex justify-between items-center pt-2 text-[11px] border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Payment: <strong className="text-slate-900">{ord.paymentMode || 'COD'}</strong></span>
                  <button 
                    onClick={() => handleDeleteOrder(orderId)}
                    className="text-rose-600 hover:text-rose-700 font-bold text-[10px] bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 transition cursor-pointer active:scale-95"
                  >
                    Remove from DB ✕
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}