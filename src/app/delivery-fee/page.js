'use client';
import { useState, useEffect } from 'react';

export default function AdminDeliveryFeePage() {
  const [deliveryFee, setDeliveryFee] = useState('30');
  const [ratePerKm, setRatePerKm] = useState('5');
  const [message, setMessage] = useState('');

  // Restaurant operating hours states
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestId, setSelectedRestId] = useState('');
  const [schedule, setSchedule] = useState({
    autoMode: true,
    isManuallyOpen: true,
    operatingHours: {
      Monday: { open: '08:00', close: '22:00', closed: false },
      Tuesday: { open: '08:00', close: '22:00', closed: false },
      Wednesday: { open: '08:00', close: '22:00', closed: false },
      Thursday: { open: '08:00', close: '22:00', closed: false },
      Friday: { open: '08:00', close: '23:00', closed: false },
      Saturday: { open: '08:00', close: '23:00', closed: false },
      Sunday: { open: '08:00', close: '22:00', closed: false }
    }
  });

  // Fetch delivery fee and partner restaurants on mount[cite: 10]
  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

    fetch(`${API_URL}/api/settings/delivery-fee`)
      .then(res => res.json())
      .then(data => {
        if (data && data.deliveryFee !== undefined) {
          setDeliveryFee(String(data.deliveryFee));
        }
        if (data && data.ratePerKm !== undefined) {
          setRatePerKm(String(data.ratePerKm));
        }
      })
      .catch((err) => {
        console.error('Failed to fetch delivery fee from backend:', err);
      });

    fetch(`${API_URL}/api/foods/restaurants`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setRestaurants(data);
          setSelectedRestId(data[0]._id || data[0].id);
          if (data[0].operatingHours || data[0].autoMode !== undefined) {
            setSchedule({
              autoMode: data[0].autoMode ?? true,
              isManuallyOpen: data[0].isManuallyOpen ?? true,
              operatingHours: data[0].operatingHours || schedule.operatingHours
            });
          }
        }
      })
      .catch(err => console.error('Failed to fetch restaurants:', err));
  }, []);

  const handleSelectRestaurant = (id) => {
    setSelectedRestId(id);
    const rest = restaurants.find(r => (r._id || r.id) === id);
    if (rest) {
      setSchedule({
        autoMode: rest.autoMode ?? true,
        isManuallyOpen: rest.isManuallyOpen ?? true,
        operatingHours: rest.operatingHours || schedule.operatingHours
      });
    }
  };

  const handleDayChange = (day, field, value) => {
    setSchedule(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value
        }
      }
    }));
  };

  const handleSaveFee = (e) => {
    e.preventDefault();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

    fetch(`${API_URL}/api/settings/delivery-fee`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        deliveryFee: Number(deliveryFee),
        ratePerKm: Number(ratePerKm) 
      })
    })
      .then(res => res.json())
      .then(() => {
        setMessage('✅ Per-KM Delivery Fee updated & synced successfully!');
        setTimeout(() => setMessage(''), 3000);
      })
      .catch((err) => {
        console.error('Failed to update delivery fee on backend:', err);
        setMessage('❌ Failed to update delivery fee on server.');
        setTimeout(() => setMessage(''), 3000);
      });
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

    try {
      const res = await fetch(`${API_URL}/api/restaurants/${selectedRestId}/hours`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule)
      });
      if (res.ok) {
        setMessage('✅ Operating hours & status switch updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Failed to update hours.');
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ Network error.');
    }
  };

  return (
    <div className="space-y-4 pb-6">
      
      {/* Header */}
      <div className="bg-white border border-orange-100 p-4 rounded-3xl shadow-sm space-y-1">
        <h2 className="text-sm font-black text-slate-950">Delivery Fee & Store Hours Manager 🛵</h2>
        <p className="text-[11px] text-slate-500">Configure distance-based per-KM delivery fees and automatic or manual store timings.</p>
      </div>

      {message && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold p-3 rounded-2xl text-center shadow-sm">
          {message}
        </div>
      )}

      {/* Per-KM Delivery Fee Form */}
      <form onSubmit={handleSaveFee} className="bg-white border border-orange-100 p-5 rounded-3xl shadow-sm space-y-3">
        <h3 className="text-xs font-black text-slate-900 uppercase">Distance-Based Delivery Fee Configuration (Per KM)</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600 uppercase">Base / Minimum Delivery Fee (₹) *</label>
            <input 
              type="number"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500 font-bold"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600 uppercase">Rate Per KM (₹ / km) *</label>
            <input 
              type="number"
              value={ratePerKm}
              onChange={(e) => setRatePerKm(e.target.value)}
              className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500 font-bold"
              required
            />
          </div>
        </div>
        <p className="text-[10px] text-slate-500">Delivery charges will automatically calculate based on the distance between the hotel and customer coordinates multiplied by ₹{ratePerKm} per km.</p>

        <button 
          type="submit"
          className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-xs font-black py-3 rounded-xl shadow-lg shadow-orange-500/20 transition active:scale-95 cursor-pointer"
        >
          Save Per-KM Delivery Fee ⚡
        </button>
      </form>

      {/* Operating Hours & Store Switch Form[cite: 10] */}
      <form onSubmit={handleSaveSchedule} className="bg-white border border-orange-100 p-5 rounded-3xl space-y-4 shadow-sm">
        <h3 className="text-xs font-black text-slate-900 uppercase">Store Operating Hours & Status Switch</h3>
        
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600 uppercase">Select Restaurant *</label>
          <select
            value={selectedRestId}
            onChange={(e) => handleSelectRestaurant(e.target.value)}
            className="w-full bg-orange-50/40 border border-orange-200 text-xs rounded-xl p-3 font-bold cursor-pointer"
          >
            {restaurants.map(r => (
              <option key={r._id || r.id} value={r._id || r.id}>{r.name || r.hotelName}</option>
            ))}
          </select>
        </div>

        {/* Operating Switch: Automatic vs Manual Override[cite: 10] */}
        <div className="bg-orange-50/60 p-4 rounded-2xl border border-orange-200 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-black text-slate-900 block">Store Status Mode</span>
              <span className="text-[10px] text-slate-500">Choose automatic schedule or instant manual control</span>
            </div>
            <button
              type="button"
              onClick={() => setSchedule(prev => ({ ...prev, autoMode: !prev.autoMode }))}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                schedule.autoMode ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {schedule.autoMode ? '🤖 Automatic Schedule (ON)' : '⚙️ Manual Override (ON)'}
            </button>
          </div>

          {!schedule.autoMode && (
            <div className="flex items-center space-x-2 pt-2 border-t border-orange-200/60 animate-fadeIn">
              <span className="text-[11px] font-bold text-slate-700">Instant Switch:</span>
              <button
                type="button"
                onClick={() => setSchedule(prev => ({ ...prev, isManuallyOpen: true }))}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  schedule.isManuallyOpen ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Force Open 🟢
              </button>
              <button
                type="button"
                onClick={() => setSchedule(prev => ({ ...prev, isManuallyOpen: false }))}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  !schedule.isManuallyOpen ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Force Closed 🔴
              </button>
            </div>
          )}
        </div>

        {/* Weekly Timings Schedule[cite: 10] */}
        <div className="space-y-2 pt-2">
          <h4 className="text-[11px] font-black text-slate-900 uppercase">Weekly Operating Schedule</h4>
          {Object.keys(schedule.operatingHours).map(day => {
            const dayData = schedule.operatingHours[day];
            return (
              <div key={day} className="flex items-center justify-between bg-orange-50/30 p-2.5 rounded-xl border border-orange-100 text-xs">
                <span className="font-bold w-20 text-slate-800">{day}</span>
                <label className="flex items-center space-x-1 text-[10px] text-slate-500 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dayData.closed}
                    onChange={(e) => handleDayChange(day, 'closed', e.target.checked)}
                    className="accent-orange-600 cursor-pointer"
                  />
                  <span>Closed</span>
                </label>
                {!dayData.closed ? (
                  <div className="flex items-center space-x-1">
                    <input
                      type="time"
                      value={dayData.open}
                      onChange={(e) => handleDayChange(day, 'open', e.target.value)}
                      className="bg-white border border-orange-200 rounded-lg p-1 text-[11px] font-mono font-bold"
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={dayData.close}
                      onChange={(e) => handleDayChange(day, 'close', e.target.value)}
                      className="bg-white border border-orange-200 rounded-lg p-1 text-[11px] font-mono font-bold"
                    />
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-rose-600 italic">Day Off</span>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-xs font-black py-3.5 rounded-xl shadow-lg shadow-orange-500/20 transition active:scale-95 cursor-pointer"
        >
          Save Operating Schedule ⚡
        </button>
      </form>

    </div>
  );
}