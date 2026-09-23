'use client';
import { useState, useEffect } from 'react';

export default function AdminFoodCatalogManager() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');

  const fetchProducts = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-ohea.onrender.com';

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
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-ohea.onrender.com';

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
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-ohea.onrender.com';

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

  // Safe filtering with fallback to prevent undefined toLowerCase crashes
  const filteredProducts = products.filter(p => {
    const itemName = p.name || p.englishName || '';
    const query = searchQuery || '';
    return itemName.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="space-y-4 pb-6">
      
      {/* Header Info */}
      <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm space-y-1">
        <h2 className="text-sm font-black text-slate-950">Food Catalog & Price Manager 🍱</h2>
        <p className="text-[11px] text-slate-500">Edit dish prices directly and sync changes to customer view in real time.</p>
      </div>

      {message && (
        <div className="bg-white border border-emerald-200 text-emerald-700 text-xs font-bold p-3 rounded-2xl text-center shadow-sm">
          {message}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <input 
          type="text" 
          placeholder="Search food dishes..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-2xl p-3 pl-9 shadow-sm focus:outline-none focus:border-emerald-500"
        />
        <span className="absolute left-3 top-3.5 text-slate-400">🔍</span>
      </div>

      {/* Products List Feed */}
      <div className="space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center text-slate-400 text-xs font-bold">
            No food items found in the database. Add dishes from the &quot;Add Dish&quot; tab!
          </div>
        ) : (
          filteredProducts.map((prod) => {
            const itemId = prod._id || prod.id;
            const primaryName = prod.englishName || prod.name || 'Unnamed Dish';
            const secondaryName = prod.kannadaName || primaryName;

            return (
              <div key={itemId} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    {prod.image && (
                      <img src={prod.image} alt={primaryName} className="w-12 h-12 rounded-xl object-cover border border-slate-100" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-900">{primaryName}</p>
                      <p className="text-[10px] text-slate-500 font-medium">({secondaryName})</p>
                      {/* 🏨 Displaying Hotel Name */}
                      {prod.hotelName && (
                        <p className="text-[10px] font-extrabold text-emerald-600 mt-0.5">
                          🏨 {prod.hotelName}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[9px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                    {prod.category || 'Hotels'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 items-center border-t border-slate-100 pt-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Base Price (₹)</label>
                    <input 
                      type="number"
                      value={prod.price}
                      onChange={(e) => handlePriceChange(itemId, e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-emerald-600 font-mono font-bold text-xs rounded-xl p-2 mt-1 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-1.5 pt-4">
                    <button 
                      onClick={() => handleSavePrice(prod)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-3 py-2 rounded-xl shadow-sm transition active:scale-95"
                    >
                      💾 Save
                    </button>
                    <button 
                      onClick={() => handleRemoveItem(itemId)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[10px] font-bold px-2.5 py-2 rounded-xl transition"
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