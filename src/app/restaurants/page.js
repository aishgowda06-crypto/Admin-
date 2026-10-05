'use client';
import { useState, useEffect } from 'react';

export default function AdminFoodCatalogManager() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHotel, setSelectedHotel] = useState('ALL');
  const [hotelSearchQuery, setHotelSearchQuery] = useState('');
  const [message, setMessage] = useState('');

  const fetchProducts = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

    fetch(`${API_URL}/api/foods`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch food catalog from backend:', err);
        setProducts([]); 
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handlePriceChange = (id, newPrice) => {
    setProducts(prev => prev.map(p => (p._id === id || p.id === id) ? { ...p, price: Number(newPrice) } : p));
  };

  // Save updated price directly to backend
  const handleSavePrice = (prod) => {
    const targetId = prod._id || prod.id;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

    fetch(`${API_URL}/api/foods/${targetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: prod.price })
    })
      .then(res => res.json())
      .then(() => {
        const displayName = prod.name || prod.englishName || 'Item';
        setMessage(`✅ Updated price for "${displayName}" successfully!`);
        setTimeout(() => setMessage(''), 3000);
      })
      .catch((err) => {
        console.error('Failed to update price:', err);
        setMessage(`❌ Failed to update price on backend.`);
        setTimeout(() => setMessage(''), 3000);
      });
  };

  const handleRemoveItem = (id) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

    fetch(`${API_URL}/api/foods/${id}`, {
      method: 'DELETE'
    })
      .then(() => {
        setProducts(prev => prev.filter(p => p._id !== id && p.id !== id));
        setMessage('🗑️ Food item removed from catalog.');
        setTimeout(() => setMessage(''), 3000);
      })
      .catch((err) => {
        console.error('Failed to delete item:', err);
        setMessage('❌ Failed to remove item from backend.');
        setTimeout(() => setMessage(''), 3000);
      });
  };

  // Extract unique hotels list for hotel selection pills / search
  const uniqueHotels = ['ALL', ...Array.from(new Set(products.map(p => p.hotelName).filter(Boolean)))];

  // Filtered hotels based on hotel search query
  const searchedHotels = uniqueHotels.filter(hotel => 
    hotel === 'ALL' || hotel.toLowerCase().includes(hotelSearchQuery.toLowerCase())
  );

  // Advanced filtering supporting both hotel selection AND search query matching food names or hotel names
  const filteredProducts = products.filter(p => {
    const itemName = p.name || p.englishName || '';
    const hotelName = p.hotelName || '';
    const query = searchQuery.toLowerCase().trim();

    const matchesHotelTab = selectedHotel === 'ALL' || hotelName === selectedHotel;
    const matchesSearchQuery = !query || itemName.toLowerCase().includes(query) || hotelName.toLowerCase().includes(query);

    return matchesHotelTab && matchesSearchQuery;
  });

  return (
    <div className="space-y-4 pb-6">
      
      {/* Header Info */}
      <div className="bg-white border border-orange-100 p-4 rounded-3xl shadow-sm space-y-1">
        <h2 className="text-sm font-black text-slate-950">Food Catalog & Price Manager 🍱</h2>
        <p className="text-[11px] text-slate-500">Search and select a hotel first, then manage its dishes instantly.</p>
      </div>

      {message && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold p-3 rounded-2xl text-center shadow-sm">
          {message}
        </div>
      )}

      {/* 🏨 Step 1: Search & Select Hotel */}
      <div className="bg-white border border-orange-100 p-4 rounded-3xl shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-black uppercase text-slate-400">Step 1: Search & Select Hotel</label>
          {selectedHotel !== 'ALL' && (
            <button
              onClick={() => setSelectedHotel('ALL')}
              className="text-[10px] font-bold text-orange-600 hover:text-orange-700 underline cursor-pointer"
            >
              Reset Selection (Show All)
            </button>
          )}
        </div>

        {/* Hotel Search Input */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="Type hotel name to search..." 
            value={hotelSearchQuery}
            onChange={(e) => setHotelSearchQuery(e.target.value)}
            className="w-full bg-orange-50/30 border border-orange-100 text-slate-900 text-xs rounded-2xl p-3 pl-9 shadow-sm focus:outline-none focus:border-orange-500"
          />
          <span className="absolute left-3 top-3.5 text-orange-400">🏨</span>
        </div>

        {/* Filtered Hotels List / Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {searchedHotels.length === 0 ? (
            <p className="text-[11px] text-slate-400 py-1">No hotels matching &quot;{hotelSearchQuery}&quot;</p>
          ) : (
            searchedHotels.map((hotel) => (
              <button
                key={hotel}
                onClick={() => setSelectedHotel(hotel)}
                className={`text-[11px] font-bold px-3 py-2 rounded-2xl border whitespace-nowrap transition cursor-pointer active:scale-95 ${selectedHotel === hotel ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'bg-orange-50/50 text-slate-700 border-orange-100 hover:bg-orange-100'}`}
              >
                {hotel === 'ALL' ? '🏨 All Hotels' : `🏨 ${hotel}`}
              </button>
            ))
          )}
        </div>
      </div>

      {/* 🔍 Step 2: Search Food Dishes */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase text-slate-400 px-1">Step 2: Search Food Dishes in {selectedHotel === 'ALL' ? 'All Hotels' : selectedHotel}</label>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search specific food dishes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-orange-100 text-slate-900 text-xs rounded-2xl p-3 pl-9 shadow-sm focus:outline-none focus:border-orange-500"
          />
          <span className="absolute left-3 top-3.5 text-orange-400">🔍</span>
        </div>
      </div>

      {/* Products List Feed */}
      <div className="space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-orange-100 p-8 rounded-2xl text-center text-slate-400 text-xs font-bold">
            No food items found matching your hotel selection or search query.
          </div>
        ) : (
          filteredProducts.map((prod) => {
            const itemId = prod._id || prod.id;
            const primaryName = prod.englishName || prod.name || 'Unnamed Dish';
            const secondaryName = prod.kannadaName || primaryName;

            return (
              <div key={itemId} className="bg-white border border-orange-100 p-4 rounded-2xl shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    {prod.image && (
                      <img src={prod.image} alt={primaryName} className="w-12 h-12 rounded-xl object-cover border border-orange-100" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-900">{primaryName}</p>
                      <p className="text-[10px] text-slate-500 font-medium">({secondaryName})</p>
                      {/* 🏨 Displaying Hotel Name */}
                      {prod.hotelName && (
                        <p className="text-[10px] font-extrabold text-orange-600 mt-0.5">
                          🏨 {prod.hotelName}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[9px] bg-orange-50 border border-orange-200 text-orange-700 px-2 py-0.5 rounded-full font-bold">
                    {prod.category || 'Hotels'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 items-center border-t border-orange-100 pt-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Base Price (₹)</label>
                    <input 
                      type="number"
                      value={prod.price}
                      onChange={(e) => handlePriceChange(itemId, e.target.value)}
                      className="w-full bg-orange-50/40 border border-orange-200 text-orange-600 font-mono font-bold text-xs rounded-xl p-2 mt-1 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-1.5 pt-4">
                    <button 
                      onClick={() => handleSavePrice(prod)}
                      className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-[10px] font-extrabold px-3 py-2 rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      💾 Save
                    </button>
                    <button 
                      onClick={() => handleRemoveItem(itemId)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[10px] font-bold px-2.5 py-2 rounded-xl transition cursor-pointer"
                    >
                      🗑️
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