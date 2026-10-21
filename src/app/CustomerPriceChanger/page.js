'use client';
import { useState, useEffect } from 'react';

export default function CustomerPriceChanger() {
  const [products, setProducts] = useState([]);
  const [customPrices, setCustomPrices] = useState({});
  const [selectedHotel, setSelectedHotel] = useState('ALL');
  const [hotelSearchQuery, setHotelSearchQuery] = useState('');
  const [message, setMessage] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, settingRes] = await Promise.all([
        fetch(`${API_URL}/api/foods`),
        fetch(`${API_URL}/api/settings/customer-prices`)
      ]);

      const prods = await prodRes.json();
      const settings = await settingRes.json();

      if (Array.isArray(prods)) setProducts(prods);
      if (settings && typeof settings === 'object') setCustomPrices(settings);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleInputChange = (id, val) => {
    setCustomPrices(prev => ({
      ...prev,
      [id]: val === '' ? '' : Number(val)
    }));
  };

  const handleSaveItemPrice = async (prod) => {
    const targetId = prod._id || prod.id;
    const updatedPrices = { ...customPrices };

    if (updatedPrices[targetId] !== undefined && updatedPrices[targetId] !== '') {
      updatedPrices[targetId] = Number(updatedPrices[targetId]);
    } else {
      delete updatedPrices[targetId];
    }

    try {
      const res = await fetch(`${API_URL}/api/settings/customer-prices`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices: updatedPrices })
      });
      
      if (res.ok) {
        setCustomPrices(updatedPrices);
        setMessage(`✅ Saved custom price for "${prod.englishName || prod.name}" globally!`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error('Failed to save:', err);
      setMessage('❌ Failed to save to server.');
    }
  };

  const uniqueHotels = ['ALL', ...Array.from(new Set(products.map(p => p.hotelName).filter(Boolean)))];
  const searchedHotels = uniqueHotels.filter(h => h === 'ALL' || h.toLowerCase().includes(hotelSearchQuery.toLowerCase()));

  const filteredProducts = products.filter(p => {
    const hotelMatch = selectedHotel === 'ALL' || p.hotelName === selectedHotel;
    return hotelMatch;
  });

  return (
    <div className="space-y-4 pb-6">
      <div className="bg-white border border-orange-100 p-5 rounded-3xl shadow-sm space-y-1">
        <h2 className="text-sm font-black text-slate-950">Global Customer Price Manager 🌍</h2>
        <p className="text-[11px] text-slate-500">Custom prices saved here instantly sync to your separate deployed customer app worldwide.</p>
      </div>

      {message && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold p-3 rounded-2xl text-center shadow-sm">
          {message}
        </div>
      )}

      {/* Hotel Filter Section */}
      <div className="bg-white border border-orange-100 p-4 rounded-3xl shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-black uppercase text-slate-400">Filter by Hotel / Brand</label>
          {selectedHotel !== 'ALL' && (
            <button onClick={() => setSelectedHotel('ALL')} className="text-[10px] font-bold text-orange-600 underline cursor-pointer">
              Show All Hotels
            </button>
          )}
        </div>
        <input 
          type="text" 
          placeholder="Search hotel name..." 
          value={hotelSearchQuery}
          onChange={(e) => setHotelSearchQuery(e.target.value)}
          className="w-full bg-orange-50/30 border border-orange-100 text-slate-900 text-xs rounded-2xl p-3 pl-9 shadow-sm focus:outline-none focus:border-orange-500"
        />
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {searchedHotels.map((hotel) => (
            <button
              key={hotel}
              onClick={() => setSelectedHotel(hotel)}
              className={`text-[11px] font-bold px-3 py-2 rounded-2xl border whitespace-nowrap transition cursor-pointer ${selectedHotel === hotel ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'bg-orange-50/50 text-slate-700 border-orange-100 hover:bg-orange-100'}`}
            >
              {hotel === 'ALL' ? '🏨 All Hotels' : `🏨 ${hotel}`}
            </button>
          ))}
        </div>
      </div>

      {/* Food Items List */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase text-slate-400 px-1">Set Custom Prices for Customer App</label>
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-orange-100 p-8 rounded-2xl text-center text-slate-400 text-xs font-bold">
            No food items found.
          </div>
        ) : (
          filteredProducts.map((prod) => {
            const itemId = prod._id || prod.id;
            const basePrice = prod.basePrice !== undefined ? Number(prod.basePrice) : Number(prod.price || 0);
            const currentVal = customPrices[itemId] !== undefined ? customPrices[itemId] : '';

            return (
              <div key={itemId} className="bg-white border border-orange-100 p-4 rounded-2xl shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{prod.englishName || prod.name}</p>
                    <p className="text-[10px] font-extrabold text-orange-600">🏨 {prod.hotelName || 'General'}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Original Menu Price: <span className="font-mono font-bold text-slate-700">₹{basePrice}</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-orange-100 items-center">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Customer App Final Price (₹)</label>
                    <input 
                      type="number"
                      placeholder={`Leave empty for ₹${basePrice}`}
                      value={currentVal}
                      onChange={(e) => handleInputChange(itemId, e.target.value)}
                      className="w-full bg-orange-50/40 border border-orange-200 text-orange-700 font-mono font-bold text-xs rounded-xl p-2.5 mt-1 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={() => handleSaveItemPrice(prod)}
                      className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-[10px] font-extrabold px-4 py-2.5 rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      💾 Save Globally
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}