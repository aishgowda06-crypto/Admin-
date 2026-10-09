'use client';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export default function AdminLiveOrders() {
  const [orders, setOrders] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [hotelRevenues, setHotelRevenues] = useState({});
  const [selectedHotelFilter, setSelectedHotelFilter] = useState('all');

  const fetchOrders = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

    fetch(`${API_URL}/api/orders`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOrders(data);
          
          // Calculate overall revenue
          const totalRev = data.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
          setRevenue(totalRev);

          // Calculate per-hotel revenue breakdown using correct hotel/brand name
          const revMap = {};
          data.forEach(ord => {
            const resolvedHotel = ord.hotelName || ord.restaurant || ord.brand || (ord.items && ord.items[0]?.hotelName) || (ord.items && ord.items[0]?.restaurant) || (ord.items && ord.items[0]?.brand) || 'Partner Hotel';
            const ordTotal = ord.totalPrice || ord.estimatedPrice || 0;
            revMap[resolvedHotel] = (revMap[resolvedHotel] || 0) + ordTotal;
          });
          setHotelRevenues(revMap);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch orders from backend:', err);
        setOrders([]);
        setRevenue(0);
        setHotelRevenues({});
      });
  };

  useEffect(() => {
    fetchOrders();

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

    // Socket.io connection with polling fallback for stable connectivity
    const socket = io(API_URL, {
      transports: ['polling', 'websocket'],
      secure: true,
    });

    socket.on('orderStatusUpdated', () => {
      fetchOrders();
    });

    socket.on('newOrder', () => {
      fetchOrders();
    });

    socket.on('cateringOrderReceived', () => {
      fetchOrders();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleAcceptByPartner = (orderId, currentAcceptedBy) => {
    const deliveryPartnerName = localStorage.getItem('shopmatries_username') || localStorage.getItem('shopmatries_phone') || 'Delivery Partner';
    
    if (currentAcceptedBy && currentAcceptedBy !== deliveryPartnerName) {
      alert(`⚠️ This order has already been accepted by another delivery partner (${currentAcceptedBy}). First-come, first-served rule applies!`);
      return;
    }

    // Instant permanent optimistic update so it locks immediately without bouncing back
    setOrders(prev => prev.map(o => ((o._id === orderId || o.id === orderId) ? { ...o, acceptedBy: deliveryPartnerName, status: 'Accepted' } : o)));

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

    fetch(`${API_URL}/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acceptedBy: deliveryPartnerName, status: 'Accepted' })
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.success === false) {
          alert('⚠️ Failed to lock order on server. Please try again.');
          fetchOrders(); // Revert on actual server failure
        } else {
          fetchOrders();
        }
      })
      .catch((err) => {
        console.error('Failed to accept order:', err);
        fetchOrders();
      });
  };

  const handleCheckpointUpdate = (orderId, newStatus, newProgress, acceptedBy) => {
    if (!acceptedBy) {
      alert('⚠️ A delivery partner must accept this order first before updating delivery checkpoints!');
      return;
    }

    // Optimistic UI update for instant speed
    setOrders(prev => prev.map(o => ((o._id === orderId || o.id === orderId) ? { ...o, status: newStatus, progress: newProgress } : o)));

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

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
    // 10:00 PM onwards rule for everyone
    const currentHour = new Date().getHours();

    if (currentHour < 22) {
      alert('⚠️ Deletion Locked: Orders can only be deleted from 10:00 PM (22:00) onwards!');
      return;
    }

    // Optimistic UI filter for instant speed
    setOrders(prev => prev.filter(o => o._id !== orderId && o.id !== orderId));

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

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

  // Bulk delete all orders marked as delivered past 10 PM for everyone
  const handleClearDeliveredOrders = async () => {
    const currentHour = new Date().getHours();

    if (currentHour < 22) {
      alert('⚠️ Deletion Locked: Delivered orders can only be cleared from 10:00 PM (22:00) onwards!');
      return;
    }

    const deliveredOrders = orders.filter(o => o.progress === 100 || o.status === 'Delivered');
    if (deliveredOrders.length === 0) {
      alert('No delivered orders found to clear.');
      return;
    }

    if (!confirm(`Are you sure you want to remove all ${deliveredOrders.length} delivered orders from the database?`)) {
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

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
    const gpsMatch = addressString.match(/\[GPS:\s*([0-9.-]+),\s*([0-9.-]+)\]/);
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

  const formatOrderDateTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return timestamp;
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const deliveredCount = orders.filter(o => o.progress === 100 || o.status === 'Delivered').length;

  // Filter orders by selected hotel/brand if specified
  const filteredOrders = selectedHotelFilter === 'all' 
    ? orders 
    : orders.filter(o => {
        const hName = o.hotelName || o.restaurant || o.brand || (o.items && o.items[0]?.hotelName) || (o.items && o.items[0]?.restaurant) || (o.items && o.items[0]?.brand) || 'Partner Hotel';
        return hName.toLowerCase() === selectedHotelFilter.toLowerCase();
      });

  return (
    <div className="space-y-4 pb-6">
      
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white border border-orange-100 p-3 rounded-2xl shadow-sm space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Active Orders</p>
          <p className="text-xl font-black text-orange-600">{filteredOrders.length}</p>
        </div>
        <div className="bg-white border border-orange-100 p-3 rounded-2xl shadow-sm space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Sales Revenue</p>
          <p className="text-xl font-black text-orange-600">
            ₹{selectedHotelFilter === 'all' ? revenue : (hotelRevenues[selectedHotelFilter] || 0)}
          </p>
        </div>
      </div>

      {/* Hotel Revenue Breakdown Filter Selector */}
      {Object.keys(hotelRevenues).length > 0 && (
        <div className="bg-white border border-orange-100 p-3 rounded-2xl shadow-sm space-y-2">
          <p className="text-[10px] font-black text-slate-700 uppercase tracking-wider">🏨 Per-Hotel / Brand Revenue Breakdown</p>
          <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedHotelFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 border cursor-pointer ${
                selectedHotelFilter === 'all'
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white border-orange-500 shadow-sm'
                  : 'bg-orange-50 text-slate-700 border-orange-200 hover:bg-orange-100'
              }`}
            >
              All Hotels (₹{revenue})
            </button>
            {Object.entries(hotelRevenues).map(([hotelName, rev]) => (
              <button
                key={hotelName}
                onClick={() => setSelectedHotelFilter(hotelName)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 border cursor-pointer ${
                  selectedHotelFilter === hotelName
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white border-orange-500 shadow-sm'
                    : 'bg-orange-50 text-slate-700 border-orange-200 hover:bg-orange-100'
                }`}
              >
                {hotelName} (₹{rev})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dispatch Header & Clear Delivered Button */}
      <div className="flex justify-between items-center px-1">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
          <span>⚡ Live 1-Tap Checkpoint Dispatcher ({selectedHotelFilter === 'all' ? 'All Orders' : selectedHotelFilter})</span>
        </h2>
        {deliveredCount > 0 && (
          <button 
            onClick={handleClearDeliveredOrders}
            className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 px-2.5 py-1 rounded-xl transition cursor-pointer active:scale-95 shadow-sm"
          >
            🗑️ Clear Delivered ({deliveredCount}) [10 PM+]
          </button>
        )}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-orange-100 p-8 rounded-3xl text-center space-y-2 shadow-sm">
            <p className="text-2xl">🎉</p>
            <p className="text-xs font-bold text-slate-700">No active customer orders or catering requests found for this hotel/brand.</p>
          </div>
        ) : (
          filteredOrders.map((ord, idx) => {
            const orderId = ord._id || ord.id;
            const displayTime = formatOrderDateTime(ord.createdAt || ord.time);
            const isAlreadyAccepted = Boolean(ord.acceptedBy);
            const orderHotelName = ord.hotelName || ord.restaurant || ord.brand || (ord.items && ord.items[0]?.hotelName) || (ord.items && ord.items[0]?.restaurant) || (ord.items && ord.items[0]?.brand) || 'Partner Hotel';

            // Clean full address in English (stripping GPS coordinates block if present for readable view)
            const rawAddress = ord.address || ord.deliveryAddress || ord.location || 'Exact address not provided';
            const cleanAddressEnglish = rawAddress.replace(/\[GPS:[^\]]+\]/g, '').trim();

            return (
              <div key={orderId || idx} className="bg-white border border-orange-100 p-4 rounded-3xl shadow-sm space-y-3 relative">
                
                {/* Top row: Order ID, Hotel Name & Exact Date/Time */}
                <div className="flex justify-between items-center">
                  <div className="flex flex-col space-y-0.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-black font-mono text-orange-600">{orderId}</span>
                      <span className="bg-orange-100 text-orange-800 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                        🏨 {orderHotelName}
                      </span>
                      {ord.isCatering && (
                        <span className="bg-purple-100 text-purple-800 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                          Catering 🍲
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">📅 {displayTime}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-slate-400 mr-1">TOTAL</span>
                    <span className="text-sm font-black text-orange-600 font-mono">₹{ord.totalPrice || ord.estimatedPrice || 0}</span>
                  </div>
                </div>

                {/* First-Come, First-Served Acceptance Status Banner */}
                <div className={`p-2.5 rounded-xl border text-xs flex justify-between items-center ${isAlreadyAccepted ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                  <div>
                    <p className="font-extrabold text-[11px]">
                      {isAlreadyAccepted ? `✅ Accepted by: ${ord.acceptedBy}` : '⚡ Open Order (First-Come, First-Served)'}
                    </p>
                    <p className="text-[9px] opacity-80">
                      {isAlreadyAccepted ? 'Locked against deletion or re-assignment.' : 'Tap accept to lock this order exclusively for delivery.'}
                    </p>
                  </div>
                  {!isAlreadyAccepted ? (
                    <button
                      onClick={() => handleAcceptByPartner(orderId, ord.acceptedBy)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg shadow transition cursor-pointer active:scale-95 shrink-0"
                    >
                      Accept Order 🎯
                    </button>
                  ) : (
                    <span className="bg-emerald-200 text-emerald-900 text-[9px] font-black px-2 py-1 rounded-md uppercase">
                      Claimed 🔒
                    </span>
                  )}
                </div>

                {/* Customer Contact & Full English Address / GPS Map Tracking */}
                <div className="text-xs space-y-2 bg-orange-50/50 p-2.5 rounded-xl border border-orange-100">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">👤 {ord.customerName || ord.name || 'Valued Customer'}</span>
                    <a href={`tel:${ord.phone || ord.mobile}`} className="text-[10px] text-orange-700 font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                      📞 {ord.phone || ord.mobile || 'Not provided'}
                    </a>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-orange-200/50">
                    <p className="text-[11px] font-semibold text-slate-800">
                      📍 <span className="font-normal text-slate-600">{cleanAddressEnglish || 'Location address not specified'}</span>
                    </p>
                    {ord.area && (
                      <p className="text-[10px] font-medium text-slate-500">
                        🏙️ Locality / Area: <strong className="text-slate-700">{ord.area}</strong>
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleOpenGoogleMaps(rawAddress)}
                      className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg shadow-sm transition flex items-center space-x-1 shrink-0 active:scale-95 cursor-pointer"
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
                      onClick={() => handleCheckpointUpdate(orderId, 'Hub', 0, ord.acceptedBy)}
                      className={`py-2 px-3 rounded-xl text-[10px] font-bold border transition cursor-pointer active:scale-95 ${ord.progress === 0 ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'bg-orange-50/30 text-slate-700 border-orange-100 hover:bg-orange-50'}`}
                    >
                      1. Hub (0%)
                    </button>
                    <button 
                      onClick={() => handleCheckpointUpdate(orderId, 'Picked', 35, ord.acceptedBy)}
                      className={`py-2 px-3 rounded-xl text-[10px] font-bold border transition cursor-pointer active:scale-95 ${ord.progress === 35 ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'bg-orange-50/30 text-slate-700 border-orange-100 hover:bg-orange-50'}`}
                    >
                      2. Picked (35%)
                    </button>
                    <button 
                      onClick={() => handleCheckpointUpdate(orderId, 'Near Area', 70, ord.acceptedBy)}
                      className={`py-2 px-3 rounded-xl text-[10px] font-bold border transition cursor-pointer active:scale-95 ${ord.progress === 70 ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'bg-orange-50/30 text-slate-700 border-orange-100 hover:bg-orange-50'}`}
                    >
                      3. Near Area (70%)
                    </button>
                    <button 
                      onClick={() => handleCheckpointUpdate(orderId, 'Delivered', 100, ord.acceptedBy)}
                      className={`py-2 px-3 rounded-xl text-[10px] font-bold border transition cursor-pointer active:scale-95 ${ord.progress === 100 ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}`}
                    >
                      4. Delivered (100%)
                    </button>
                  </div>
                </div>

                {/* Ordered Items Breakdown & Complete Details for Admin */}
                <div className="space-y-1.5 pt-2 border-t border-orange-100">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Order & Delivery Breakdown</p>
                    {ord.ratePerKm !== undefined && (
                      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                        Rate: ₹{ord.ratePerKm}/km
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {ord.items?.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-xs bg-orange-50/30 p-2 rounded-lg border border-orange-100">
                        <span className="text-slate-800 font-medium">{item.name} <span className="text-slate-400 text-[10px]">({item.quantity || item.qty} qty)</span></span>
                        <span className="font-mono font-bold text-orange-600">₹{(item.price || 0) * (item.quantity || item.qty || 1)}</span>
                      </div>
                    ))}

                    {/* Delivery Partner Fee Row */}
                    <div className="flex justify-between items-center text-xs bg-orange-50/60 p-2 rounded-lg border border-orange-200">
                      <span className="text-orange-900 font-bold flex items-center space-x-1">
                        <span>🛵 Delivery Fee (Distance-Based)</span>
                      </span>
                      <span className="font-mono font-bold text-orange-700">₹{ord.deliveryFee || 30}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Payment Mode & 10 PM Time-Locked Delete Button for Everyone */}
                <div className="flex justify-between items-center pt-2 text-[11px] border-t border-orange-100">
                  <span className="text-slate-500 font-medium">Payment: <strong className="text-slate-900">{ord.paymentMode || 'Online'}</strong> ({ord.paymentStatus || 'Paid'})</span>
                  <button 
                    onClick={() => handleDeleteOrder(orderId)}
                    className="font-bold text-[10px] px-2.5 py-1 rounded-lg border transition bg-rose-50 text-rose-600 hover:text-rose-700 border-rose-200 active:scale-95 cursor-pointer"
                    title="Available from 10:00 PM onwards for everyone"
                  >
                    Remove from DB (10 PM+) ✕
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