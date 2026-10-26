'use client';
import { useState, useEffect } from 'react';

export default function AdminAddFoodDish() {
  const [hotels, setHotels] = useState([]);
  const [searchHotelQuery, setSearchHotelQuery] = useState('');
  
  // Separate states for Hotels and Foods with direct Cloudinary image persistence
  const [hotelFormData, setHotelFormData] = useState({
    hotelNameInput: '',
    hotelCity: 'Shivamogga',
    hotelImage: '',
    hotelLocation: '',
    manualLat: '13.9299',
    manualLng: '75.5681',
    isManuallyOpen: true
  });

  const [foodFormData, setFoodFormData] = useState({
    kannadaName: '',
    englishName: '',
    category: 'Hotels',
    hotelId: '',
    price: '',
    customPrice: '',
    image: '',
    rating: '4.8'
  });

  const [message, setMessage] = useState('');
  const [uploadingFood, setUploadingFood] = useState(false);
  const [uploadingHotel, setUploadingHotel] = useState(false);
  const [isPickingMap, setIsPickingMap] = useState(false);
  const [mapLat, setMapLat] = useState(13.9299);
  const [mapLng, setMapLng] = useState(75.5681);

  // Fetch partner hotels safely from backend database
  const loadData = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

    try {
      const res = await fetch(`${API_URL}/api/foods/restaurants`);
      const text = await res.text();
      if (text.trim().startsWith('<')) return; // Guard against HTML error pages
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        setHotels(data);
      } else if (data.restaurants) {
        setHotels(data.restaurants);
      }
    } catch (err) {
      console.error('Failed to fetch hotels from backend:', err);
      setHotels([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper function to upload files directly from frontend to Cloudinary
  const uploadDirectToCloudinary = async (file) => {
    const cloudName = 'divin440';
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'shopmatries_preset';

    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', uploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: 'POST',
        body: data,
      });
      const json = await res.json();
      if (json.secure_url) {
        return json.secure_url;
      } else {
        throw new Error(json.error?.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      alert('Failed to upload file to Cloudinary.');
      return null;
    }
  };

  const handleFoodImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadingFood(true);
      const secureUrl = await uploadDirectToCloudinary(file);
      if (secureUrl) {
        setFoodFormData(prev => ({ ...prev, image: secureUrl }));
      }
      setUploadingFood(false);
    }
  };

  const handleHotelImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadingHotel(true);
      const secureUrl = await uploadDirectToCloudinary(file);
      if (secureUrl) {
        setHotelFormData(prev => ({ ...prev, hotelImage: secureUrl }));
      }
      setUploadingHotel(false);
    }
  };

  const handleOpenMapPicker = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapLat(position.coords.latitude);
          setMapLng(position.coords.longitude);
          setIsPickingMap(true);
        },
        () => {
          setIsPickingMap(true);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setIsPickingMap(true);
    }
  };

  const handleConfirmMapLocation = () => {
    const coordsStr = `[GPS: ${mapLat.toFixed(6)}, ${mapLng.toFixed(6)}]`;
    setHotelFormData(prev => ({ 
      ...prev, 
      hotelLocation: coordsStr,
      manualLat: mapLat.toString(),
      manualLng: mapLng.toString()
    }));
    setIsPickingMap(false);
    alert(`✓ Hotel Location Confirmed & Saved: ${mapLat.toFixed(4)}, ${mapLng.toFixed(4)}`);
  };

  // Submit New Hotel/Restaurant
  const handleHotelSubmit = async (e) => {
    e.preventDefault();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';
    const newHotelName = hotelFormData.hotelNameInput.trim();

    if (!newHotelName) {
      setMessage('❌ Please enter a valid hotel name.');
      return;
    }

    try {
      const finalLoc = hotelFormData.hotelLocation || `[GPS: ${hotelFormData.manualLat}, ${hotelFormData.manualLng}]`;
      const hotelRes = await fetch(`${API_URL}/api/foods/restaurants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newHotelName, 
          restaurantName: newHotelName,
          hotelName: newHotelName,
          address: finalLoc,
          city: hotelFormData.hotelCity.trim() || 'Shivamogga',
          lat: parseFloat(hotelFormData.manualLat) || 13.9299,
          lng: parseFloat(hotelFormData.manualLng) || 75.5681,
          image: hotelFormData.hotelImage,
          hotelImage: hotelFormData.hotelImage,
          isManuallyOpen: hotelFormData.isManuallyOpen
        })
      });
      const text = await hotelRes.text();
      let hotelData = {};
      try { hotelData = JSON.parse(text); } catch(e) {}

      if (hotelRes.ok) {
        setMessage(`✅ Hotel "${newHotelName}" successfully added with logo!`);
        setHotelFormData({
          hotelNameInput: '',
          hotelCity: 'Shivamogga',
          hotelImage: '',
          hotelLocation: '',
          manualLat: '13.9299',
          manualLng: '75.5681',
          isManuallyOpen: true
        });
        loadData();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`❌ ${hotelData.error || hotelData.message || 'Failed to add hotel.'}`);
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (err) {
      console.error('Hotel submit error:', err);
      setMessage('❌ Network error while saving hotel.');
      setTimeout(() => setMessage(''), 4000);
    }
  };

  // Submit New Food Dish (automatically sets Customerprice equal to price or customPrice to satisfy backend Mongoose requirement)
  const handleFoodSubmit = async (e) => {
    e.preventDefault();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

    if (!foodFormData.hotelId) {
      setMessage('❌ Please select a partner hotel for this dish.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const selectedHotelObj = hotels.find(h => String(h._id || h.id) === String(foodFormData.hotelId));
    const finalHotelName = selectedHotelObj ? (selectedHotelObj.name || selectedHotelObj.hotelName || selectedHotelObj.restaurantName) : 'Partner Hotel';
    const finalHotelImage = selectedHotelObj ? (selectedHotelObj.image || selectedHotelObj.hotelImage || '') : '';
    const finalHotelCity = selectedHotelObj ? (selectedHotelObj.city || selectedHotelObj.locationHub || 'Shivamogga') : 'Shivamogga';
    const finalHotelAddress = selectedHotelObj ? (selectedHotelObj.address || '') : '';

    const parsedBasePrice = Number(foodFormData.price) || 0;
    const finalPriceVal = foodFormData.customPrice !== '' ? Number(foodFormData.customPrice) : parsedBasePrice;
    const dishName = foodFormData.englishName.trim();

    try {
      // Sending Customerprice equal to price so the backend Mongoose validation passes without failing
      const foodPayload = {
        name: dishName,
        englishName: dishName,
        kannadaName: foodFormData.kannadaName,
        category: foodFormData.category,
        hotelId: foodFormData.hotelId,
        restaurantId: foodFormData.hotelId,
        hotelName: finalHotelName,
        restaurant: finalHotelName,
        restaurantName: finalHotelName,
        hotelImage: finalHotelImage,
        restaurantImage: finalHotelImage,
        address: finalHotelAddress,
        city: finalHotelCity,
        price: parsedBasePrice,
        Customerprice: finalPriceVal, // Auto-satisfied to prevent backend 500 error
        customerPrice: finalPriceVal,
        sellingPrice: finalPriceVal,
        image: foodFormData.image,
        rating: Number(foodFormData.rating) || 4.8,
        isAvailable: true
      };

      const foodRes = await fetch(`${API_URL}/api/foods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(foodPayload)
      });
      
      const text = await foodRes.text();
      let foodData = {};
      try { foodData = JSON.parse(text); } catch(e) {}

      if (foodRes.ok && (foodData.success !== false)) {
        setMessage(`✅ Food dish "${dishName}" successfully added to "${finalHotelName}"!`);
        setFoodFormData({
          kannadaName: '',
          englishName: '',
          category: 'Hotels',
          hotelId: '',
          price: '',
          customPrice: '',
          image: '',
          rating: '4.8'
        });
        loadData();
        setTimeout(() => setMessage(''), 4000);
      } else {
        const serverErrMsg = foodData.error || foodData.message || foodData.details || text || 'Internal server error on backend.';
        setMessage(`❌ Server Error: ${serverErrMsg}`);
      }
    } catch (err) {
      console.error('Food submit error:', err);
      setMessage('❌ Network connection error while saving dish.');
    }
  };

  // Filter hotels for search
  const filteredHotels = hotels.filter(h => {
    const hName = h.name || h.hotelName || h.restaurantName || '';
    const hCity = h.city || h.locationHub || '';
    const q = searchHotelQuery.toLowerCase().trim();
    if (!q) return true;
    return hName.toLowerCase().includes(q) || hCity.toLowerCase().includes(q);
  });

  return (
    <main className="space-y-6 pb-12 max-w-2xl mx-auto">

      {/* Interactive Google Maps Picker Modal */}
      {isPickingMap && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-orange-200 rounded-3xl p-5 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-slate-950">🗺️ Pick Hotel Location on Google Maps</h3>
              <button onClick={() => setIsPickingMap(false)} className="text-slate-400 hover:text-slate-700 font-bold text-xs cursor-pointer">✕ Close</button>
            </div>
            
            <p className="text-xs text-slate-600">
              Drag or use the interactive map below to pinpoint the exact location of the hotel. Click confirm once pinned.
            </p>

            <div className="w-full h-64 rounded-2xl overflow-hidden border border-orange-200 relative shadow-inner">
              <iframe
                title="Google Maps Location Picker"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://maps.google.com/maps?q=${mapLat},${mapLng}&z=15&output=embed`}
              ></iframe>
            </div>

            <div className="bg-orange-50 p-3 rounded-xl border border-orange-200 text-xs font-mono font-bold text-orange-900 text-center">
              Pinned Coordinates: {mapLat.toFixed(5)}, {mapLng.toFixed(5)}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((pos) => {
                      setMapLat(pos.coords.latitude);
                      setMapLng(pos.coords.longitude);
                    });
                  }
                }}
                className="bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold py-3 rounded-xl transition cursor-pointer"
              >
                🛰️ Recenter to My GPS
              </button>
              <button
                type="button"
                onClick={handleConfirmMapLocation}
                className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-black py-3 rounded-xl shadow transition cursor-pointer active:scale-95"
              >
                Confirm Hotel Location ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-orange-100 p-4 rounded-3xl shadow-sm space-y-1">
        <h1 className="text-sm font-black text-slate-950">Admin Management Console</h1>
        <p className="text-[11px] text-slate-500">Manage partner hotels, map coordinates, menu dishes, and customer prices securely with Cloudinary image uploads.</p>
      </div>

      {message && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold p-3 rounded-2xl text-center shadow-sm">
          {message}
        </div>
      )}

      {/* SECTION 1: ADD NEW HOTEL / RESTAURANT */}
      <section className="bg-white border border-orange-200 p-5 rounded-3xl shadow-sm space-y-4">
        <div className="border-b border-orange-100 pb-3">
          <h2 className="text-xs font-black text-slate-950 uppercase tracking-wider">🏨 Step 1: Add New Hotel / Restaurant</h2>
          <p className="text-[10px] text-slate-500">Register a new partner restaurant with exact GPS coordinates and Cloudinary hotel logo.</p>
        </div>

        <form onSubmit={handleHotelSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] font-black text-slate-700 uppercase">Hotel Name *</label>
            <input 
              type="text"
              placeholder="e.g. Midari Hotel & Restaurant"
              value={hotelFormData.hotelNameInput}
              onChange={(e) => setHotelFormData({ ...hotelFormData, hotelNameInput: e.target.value })}
              className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500 font-bold mt-1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black text-slate-700 uppercase">City / Region Hub *</label>
              <input 
                type="text"
                placeholder="e.g. Shivamogga, Bengaluru"
                value={hotelFormData.hotelCity}
                onChange={(e) => setHotelFormData({ ...hotelFormData, hotelCity: e.target.value })}
                className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500 font-bold mt-1"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-700 uppercase">Store Status</label>
              <select
                value={hotelFormData.isManuallyOpen ? 'open' : 'closed'}
                onChange={(e) => setHotelFormData({ ...hotelFormData, isManuallyOpen: e.target.value === 'open' })}
                className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none font-bold mt-1 cursor-pointer"
              >
                <option value="open">🟢 Open (Accepting Orders)</option>
                <option value="closed">🔴 Closed (Temporarily Off)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-orange-50/50 p-3 rounded-2xl border border-orange-200">
            <div>
              <label className="text-[9px] font-bold text-slate-700 uppercase">Latitude</label>
              <input 
                type="text"
                value={hotelFormData.manualLat}
                onChange={(e) => setHotelFormData({ ...hotelFormData, manualLat: e.target.value })}
                className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl p-2 font-mono mt-0.5"
                required
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-700 uppercase">Longitude</label>
              <input 
                type="text"
                value={hotelFormData.manualLng}
                onChange={(e) => setHotelFormData({ ...hotelFormData, manualLng: e.target.value })}
                className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl p-2 font-mono mt-0.5"
                required
              />
            </div>
            <div className="flex items-end">
              <button 
                type="button"
                onClick={handleOpenMapPicker}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold py-2.5 rounded-xl transition cursor-pointer shadow active:scale-95"
              >
                🗺️ Pick Map
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-700 uppercase">Hotel Logo / Image Upload *</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleHotelImageChange}
              className="w-full bg-orange-50/40 border border-orange-200 text-slate-600 text-xs rounded-xl p-2 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-orange-500 file:text-white cursor-pointer"
              required
            />
            {uploadingHotel && <p className="text-[10px] text-orange-600 font-bold animate-pulse">Uploading hotel image to Cloudinary...</p>}
            {hotelFormData.hotelImage && (
              <div className="w-full h-24 rounded-xl overflow-hidden border border-orange-200 mt-2">
                <img src={hotelFormData.hotelImage} alt="Hotel Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-950 text-white text-xs font-black py-3 rounded-xl shadow transition active:scale-95 cursor-pointer mt-2"
          >
            + Register New Hotel 🏨
          </button>
        </form>
      </section>

      {/* SECTION 2: ADD FOOD DISH & CUSTOM PRICE */}
      <section className="bg-white border border-orange-200 p-5 rounded-3xl shadow-sm space-y-4">
        <div className="border-b border-orange-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-xs font-black text-slate-950 uppercase tracking-wider">🍽️ Step 2: Add Food Dish & Customer Price</h2>
            <p className="text-[10px] text-slate-500">Assign menu items with Cloudinary image upload and custom customer pricing.</p>
          </div>
          {/* Hotel Search Button & Input */}
          <div className="w-full sm:w-auto relative">
            <input 
              type="text"
              placeholder="🔍 Search hotels to assign..."
              value={searchHotelQuery}
              onChange={(e) => setSearchHotelQuery(e.target.value)}
              className="w-full sm:w-48 bg-orange-50/60 border border-orange-200 text-[11px] rounded-xl px-3 py-1.5 focus:outline-none font-bold"
            />
          </div>
        </div>

        <form onSubmit={handleFoodSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] font-black text-slate-700 uppercase">Select Partner Hotel *</label>
            <select 
              value={foodFormData.hotelId}
              onChange={(e) => setFoodFormData({ ...foodFormData, hotelId: e.target.value })}
              className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500 font-bold mt-1 cursor-pointer"
              required
            >
              <option value="">-- Choose Partner Hotel ({filteredHotels.length} available) --</option>
              {filteredHotels.map(h => {
                const hId = h._id || h.id;
                const hName = h.name || h.hotelName || h.restaurantName || 'Partner Hotel';
                const hCity = h.city || h.locationHub || 'Shivamogga';
                return (
                  <option key={hId} value={hId}>{hName} ({hCity})</option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black text-slate-700 uppercase">Kannada Dish Name (ಕನ್ನಡ) *</label>
              <input 
                type="text" 
                placeholder="ಉದಾ: ಮಸಾಲೆ ದೋಸೆ"
                value={foodFormData.kannadaName}
                onChange={(e) => setFoodFormData({ ...foodFormData, kannadaName: e.target.value })}
                className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none mt-1"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-700 uppercase">English Dish Name *</label>
              <input 
                type="text" 
                placeholder="e.g. Masala Dosa"
                value={foodFormData.englishName}
                onChange={(e) => setFoodFormData({ ...foodFormData, englishName: e.target.value })}
                className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none mt-1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-1">
              <label className="text-[10px] font-black text-slate-700 uppercase">Category</label>
              <select 
                value={foodFormData.category}
                onChange={(e) => setFoodFormData({ ...foodFormData, category: e.target.value })}
                className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none mt-1 cursor-pointer"
              >
                <option value="Hotels">Hotels</option>
                <option value="Breakfast">Breakfast</option>
                <option value="Veg">Veg</option>
                <option value="Non-Veg">Non-Veg</option>
                <option value="South">South</option>
                <option value="North">North</option>
                <option value="Chats">Chats</option>
              </select>
            </div>
            <div className="col-span-1">
              <label className="text-[10px] font-black text-slate-700 uppercase">Base Price (₹) *</label>
              <input 
                type="number" 
                placeholder="100"
                value={foodFormData.price}
                onChange={(e) => setFoodFormData({ ...foodFormData, price: e.target.value })}
                className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none mt-1"
                required
              />
            </div>
            <div className="col-span-1">
              <label className="text-[10px] font-black text-red-600 uppercase">Customer Price (₹) *</label>
              <input 
                type="number" 
                placeholder="120"
                value={foodFormData.customPrice}
                onChange={(e) => setFoodFormData({ ...foodFormData, customPrice: e.target.value })}
                className="w-full bg-red-50/50 border border-red-200 text-red-900 text-xs rounded-xl p-3 focus:outline-none mt-1 font-bold"
                required
              />
            </div>
            <div className="col-span-1">
              <label className="text-[10px] font-black text-slate-700 uppercase">Rating (/5)</label>
              <input 
                type="number" 
                step="0.1" 
                max="5" 
                min="1"
                value={foodFormData.rating}
                onChange={(e) => setFoodFormData({ ...foodFormData, rating: e.target.value })}
                className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none mt-1"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-700 uppercase">Food Dish Image Upload *</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFoodImageChange}
              className="w-full bg-orange-50/40 border border-orange-200 text-slate-600 text-xs rounded-xl p-2 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-orange-500 file:text-white cursor-pointer"
              required
            />
            {uploadingFood && <p className="text-[10px] text-orange-600 font-bold animate-pulse">Uploading food image to Cloudinary...</p>}
            {foodFormData.image && (
              <div className="w-full h-24 rounded-xl overflow-hidden border border-orange-200 mt-2">
                <img src={foodFormData.image} alt="Food Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-xs font-black py-3.5 rounded-xl shadow-lg transition active:scale-95 cursor-pointer mt-2"
          >
            + Save Food Dish & Customer Price ⚡
          </button>
        </form>
      </section>

    </main>
  );
}