'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeliveryPartnersAdminPage() {
  const router = useRouter();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');

  const fetchDeliveryPartners = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';
    try {
      const res = await fetch(`${API_URL}/api/delivery-partners`);
      const text = await res.text();
      if (text.trim().startsWith('<')) {
        setLoading(false);
        return;
      }
      
      const data = JSON.parse(text);
      if (data.success && Array.isArray(data.partners)) {
        setPartners(data.partners);
      } else if (Array.isArray(data)) {
        setPartners(data);
      }
    } catch (err) {
      console.error('Failed to fetch delivery partners:', err);
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryPartners();
    const interval = setInterval(fetchDeliveryPartners, 5000); // Live poll every 5s
    return () => clearInterval(interval);
  }, []);

  // Filter partners based on search query (Name, Phone, or Vehicle)
  const filteredPartners = partners.filter((p) => {
    const name = (p.name || '').toLowerCase();
    const phone = (p.phone || '').toLowerCase();
    const vehicle = (p.vehicleNumber || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    return name.includes(q) || phone.includes(q) || vehicle.includes(q);
  });

  // Calculate stats
  const totalPartners = partners.length;
  const onlinePartners = partners.filter(p => p.isOnline).length;
  const totalAccepted = partners.reduce((sum, p) => sum + (p.acceptedCount !== undefined ? p.acceptedCount : (p.ordersAccepted?.length || 0)), 0);
  const totalDelivered = partners.reduce((sum, p) => sum + (p.deliveredCount !== undefined ? p.deliveredCount : (p.ordersDelivered?.length || 0)), 0);

  return (
    <main className="space-y-6 pb-16 max-w-4xl mx-auto p-4 bg-[#fffaf7] min-h-screen">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-orange-200 p-5 rounded-3xl shadow-sm gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xl">🛵</span>
            <h1 className="text-base font-black text-slate-950 tracking-tight">Delivery Partners Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Monitor live operational status, contact metrics, and fulfillment performance.</p>
        </div>
        <button
          onClick={() => router.back()}
          className="bg-orange-100 hover:bg-orange-200 text-orange-800 font-extrabold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer shadow-sm"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-orange-200 p-3.5 rounded-2xl shadow-sm space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Riders</p>
          <p className="text-lg font-black text-slate-900">{totalPartners}</p>
        </div>
        <div className="bg-white border border-orange-200 p-3.5 rounded-2xl shadow-sm space-y-1">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Online Now</p>
          <p className="text-lg font-black text-emerald-600">{onlinePartners}</p>
        </div>
        <div className="bg-white border border-orange-200 p-3.5 rounded-2xl shadow-sm space-y-1">
          <p className="text-[10px] font-black text-orange-600 uppercase tracking-wider">Accepted Orders</p>
          <p className="text-lg font-black text-orange-600">{totalAccepted}</p>
        </div>
        <div className="bg-white border border-orange-200 p-3.5 rounded-2xl shadow-sm space-y-1">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Total Delivered</p>
          <p className="text-lg font-black text-blue-600">{totalDelivered}</p>
        </div>
      </div>

      {/* Search Bar & Filter Controls */}
      <div className="bg-white border border-orange-200 p-3 rounded-2xl shadow-sm flex items-center space-x-2">
        <span className="text-orange-500 pl-2">🔍</span>
        <input
          type="text"
          placeholder="Search by partner name, phone number, or vehicle..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent font-medium py-1"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {message && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold p-3 rounded-2xl text-center shadow-sm">
          {message}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-xs font-bold text-slate-500 animate-pulse">Loading verified delivery profiles...</div>
      ) : filteredPartners.length === 0 ? (
        <div className="bg-white border border-orange-200 rounded-3xl p-12 text-center space-y-2 shadow-sm">
          <p className="text-sm font-black text-slate-800">No delivery partners found</p>
          <p className="text-xs text-slate-400">Try adjusting your search query or check back when riders register.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPartners.map((partner) => {
            const pId = partner._id || partner.id;
            const pName = partner.name || 'Delivery Partner';
            const pPhone = partner.phone || 'N/A';
            const pVehicle = partner.vehicleNumber || 'Not Specified';
            const pAccepted = partner.acceptedCount !== undefined ? partner.acceptedCount : (partner.ordersAccepted?.length || 0);
            const pDelivered = partner.deliveredCount !== undefined ? partner.deliveredCount : (partner.ordersDelivered?.length || 0);
            const isOnline = partner.isOnline ?? false;

            return (
              <div key={pId} className="bg-white border border-orange-200 rounded-2xl p-4 shadow-sm space-y-3 relative overflow-hidden transition hover:shadow-md">
                <div className="flex justify-between items-start border-b border-orange-100 pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xs font-black text-slate-950 uppercase">{pName}</h3>
                    </div>
                    <p className="text-[11px] font-mono font-bold text-slate-700">📞 {pPhone}</p>
                    <p className="text-[10px] text-slate-500">🚗 Vehicle: <span className="font-semibold text-slate-700">{pVehicle}</span></p>
                  </div>
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide ${isOnline ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                    {isOnline ? '🟢 Online' : '⚪ Offline'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-center pt-1">
                  <div className="bg-orange-50/70 p-3 rounded-xl border border-orange-100/80">
                    <p className="text-[9px] font-black text-orange-800 uppercase tracking-wider">Accepted</p>
                    <p className="text-base font-black text-orange-600 mt-0.5">{pAccepted}</p>
                  </div>
                  <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100/80">
                    <p className="text-[9px] font-black text-emerald-800 uppercase tracking-wider">Delivered</p>
                    <p className="text-base font-black text-emerald-600 mt-0.5">{pDelivered}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}