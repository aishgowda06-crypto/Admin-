'use client';
import { useState, useEffect } from 'react';

export default function AdminDeliveryFeePage() {
  const [deliveryFee, setDeliveryFee] = useState('30');
  const [message, setMessage] = useState('');

  // Fetch current delivery fee from backend on mount
  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-ohea.onrender.com';

    fetch(`${API_URL}/api/settings/delivery-fee`)
      .then(res => res.json())
      .then(data => {
        if (data && data.deliveryFee !== undefined) {
          setDeliveryFee(String(data.deliveryFee));
        }
      })
      .catch((err) => {
        console.error('Failed to fetch delivery fee from backend:', err);
      });
  }, []);

  const handleSaveFee = (e) => {
    e.preventDefault();
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-ohea.onrender.com';

    fetch(`${API_URL}/api/settings/delivery-fee`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliveryFee: Number(deliveryFee) })
    })
      .then(res => res.json())
      .then(() => {
        setMessage('✅ Delivery Partner Fee updated & synced to database successfully!');
        setTimeout(() => setMessage(''), 3000);
      })
      .catch((err) => {
        console.error('Failed to update delivery fee on backend:', err);
        setMessage('❌ Failed to update delivery fee on server.');
        setTimeout(() => setMessage(''), 3000);
      });
  };

  return (
    <div className="space-y-4 pb-6">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm space-y-1">
        <h2 className="text-sm font-black text-slate-950">Delivery Partner Fee Manager 🛵</h2>
        <p className="text-[11px] text-slate-500">Configure the 30-minute delivery guarantee fee charged on customer orders.</p>
      </div>

      {message && (
        <div className="bg-white border border-emerald-200 text-emerald-700 text-xs font-bold p-3 rounded-2xl text-center shadow-sm">
          {message}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSaveFee} className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600 uppercase">Delivery Fee Amount (₹) *</label>
          <input 
            type="number"
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-bold"
            required
          />
        </div>

        <button 
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition active:scale-95"
        >
          Save Delivery Fee ⚡
        </button>
      </form>

    </div>
  );
}