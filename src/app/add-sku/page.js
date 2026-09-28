'use client';
import { useState, useEffect } from 'react';

export default function AdminAddFoodDish() {
  const [hotels, setHotels] = useState([]);
  const [formData, setFormData] = useState({
    kannadaName: '',
    englishName: '',
    category: 'Hotels',
    hotelId: '',
    hotelNameInput: '', 
    hotelImage: '',     
    price: '',
    image: '',          
    rating: '4.8',      // Food rating out of 5
    promoMedia: '',     // Promotional video/banner media URL
    mediaType: 'image'  // 'image' or 'video'
  });
  const [message, setMessage] = useState('');
  const [uploadingFood, setUploadingFood] = useState(false);
  const [uploadingHotel, setUploadingHotel] = useState(false);
  const [uploadingPromo, setUploadingPromo] = useState(false);

  // Fetch partner hotels directly from backend database
  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

    fetch(`${API_URL}/api/foods/restaurants`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setHotels(data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch hotels from backend:', err);
        setHotels([]);
      });
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
        setFormData(prev => ({ ...prev, image: secureUrl }));
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
        setFormData(prev => ({ ...prev, hotelImage: secureUrl }));
      }
      setUploadingHotel(false);
    }
  };

  const handlePromoMediaChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadingPromo(true);
      const secureUrl = await uploadDirectToCloudinary(file);
      if (secureUrl) {
        const isVid = file.type.includes('video') || secureUrl.endsWith('.mp4');
        setFormData(prev => ({ 
          ...prev, 
          promoMedia: secureUrl,
          mediaType: isVid ? 'video' : 'image'
        }));
      }
      setUploadingPromo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let finalHotelName = 'Partner Hotel';
    let finalHotelId = formData.hotelId;
    let finalHotelImage = formData.hotelImage;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

    try {
      if (formData.hotelId === 'new') {
        const newHotelName = formData.hotelNameInput.trim() || 'New Partner Hotel';
        
        const hotelRes = await fetch(`${API_URL}/api/foods/restaurants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: newHotelName, 
            address: 'Local Area',
            image: formData.hotelImage 
          })
        });
        const hotelData = await hotelRes.json();
        
        if (hotelData.success && hotelData.restaurant) {
          finalHotelName = hotelData.restaurant.name;
          finalHotelId = hotelData.restaurant._id;
          finalHotelImage = hotelData.restaurant.image || formData.hotelImage;
        } else {
          finalHotelName = newHotelName;
          finalHotelId = 'h-' + Date.now();
        }
      } else {
        const selectedHotelObj = hotels.find(h => h._id === formData.hotelId || h.id === formData.hotelId);
        if (selectedHotelObj) {
          finalHotelName = selectedHotelObj.name;
          finalHotelImage = selectedHotelObj.image || selectedHotelObj.hotelImage || '';
        }
      }

      const foodPayload = {
        kannadaName: formData.kannadaName,
        englishName: formData.englishName,
        category: formData.category,
        hotelId: finalHotelId,
        hotelName: finalHotelName,
        hotelImage: finalHotelImage, 
        price: formData.price,
        image: formData.image,
        rating: formData.rating
      };

      const foodRes = await fetch(`${API_URL}/api/foods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(foodPayload)
      });
      
      const foodData = await foodRes.json();

      // Submit promotional video or banner data to offers endpoint if provided
      if (formData.promoMedia) {
        await fetch(`${API_URL}/api/offers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `${finalHotelName} Special Promo`,
            subtitle: `Order ${formData.englishName} today!`,
            bgMedia: formData.promoMedia,
            mediaType: formData.mediaType,
            tag: 'FEATURED DEAL'
          })
        }).catch(() => {});
      }

      if (foodRes.ok && foodData.success) {
        setMessage(`✅ Food dish successfully added to "${finalHotelName}" menu!`);
        setFormData({ kannadaName: '', englishName: '', category: 'Hotels', hotelId: '', hotelNameInput: '', hotelImage: '', price: '', image: '', rating: '4.8', promoMedia: '', mediaType: 'image' });
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`❌ ${foodData.error || 'Failed to add dish to backend catalog.'}`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error('Failed to submit form:', err);
      setMessage('❌ Network error while saving dish.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-orange-100 p-4 rounded-3xl shadow-sm space-y-1">
        <h2 className="text-sm font-black text-slate-950">Add Food Dish & Promotions (ಹೊಸ ಆಹಾರ ಮತ್ತು ಪ್ರಚಾರ ಸೇರಿಸಿ)</h2>
        <p className="text-[11px] text-slate-500">Manage menu dishes, ratings, hotel logos, and promotional video/image banners.</p>
      </div>

      {message && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold p-3 rounded-2xl text-center shadow-sm">
          {message}
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white border border-orange-100 p-5 rounded-3xl shadow-sm space-y-3">
        
        {/* Hotel Selector / Creator */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-600 uppercase">Select or Add Hotel *</label>
          <select 
            value={formData.hotelId}
            onChange={(e) => setFormData({ ...formData, hotelId: e.target.value })}
            className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500 font-bold cursor-pointer"
            required
          >
            <option value="">-- Choose Existing Hotel --</option>
            {hotels.map(h => {
              const hId = h._id || h.id;
              const hName = h.name || h.hotelName || h.restaurantName || 'Midari hotel';
              return (
                <option key={hId} value={hId}>{hName}</option>
              );
            })}
            <option value="new">➕ Type New Hotel Name...</option>
          </select>

          {formData.hotelId === 'new' && (
            <div className="space-y-3 pt-1 animate-fadeIn">
              <div>
                <input 
                  type="text"
                  placeholder="Enter new hotel name (e.g. Midari hotel)"
                  value={formData.hotelNameInput}
                  onChange={(e) => setFormData({ ...formData, hotelNameInput: e.target.value })}
                  className="w-full bg-orange-50/50 border border-orange-300 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500 font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-orange-800">Hotel Logo / Store Image (ಹೋಟೆಲ್ ಚಿತ್ರ) *</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleHotelImageChange}
                  className="w-full bg-orange-50/40 border border-orange-200 text-slate-600 text-xs rounded-xl p-2 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-orange-500 file:text-white hover:file:bg-orange-600 cursor-pointer"
                  required
                />
              </div>

              {uploadingHotel && (
                <p className="text-[10px] text-orange-600 font-bold animate-pulse">Uploading hotel image to Cloudinary...</p>
              )}

              {formData.hotelImage && (
                <div className="relative w-full h-24 bg-slate-100 rounded-xl overflow-hidden border border-orange-200">
                  <img src={formData.hotelImage} alt="Hotel Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600">Kannada Name (ಕನ್ನಡ ಹೆಸರು) *</label>
          <input 
            type="text" 
            placeholder="ಉದಾ: ಮಸಾಲೆ ದೋಸೆ, ಚಿಕನ್ ಬಿರಿಯಾನಿ"
            value={formData.kannadaName}
            onChange={(e) => setFormData({ ...formData, kannadaName: e.target.value })}
            className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600">English Dish Name *</label>
          <input 
            type="text" 
            placeholder="e.g. Hyderabadi Chicken Biryani"
            value={formData.englishName}
            onChange={(e) => setFormData({ ...formData, englishName: e.target.value })}
            className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1 col-span-1">
            <label className="text-[10px] font-bold text-slate-600">Category *</label>
            <select 
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500 cursor-pointer"
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

          <div className="space-y-1 col-span-1">
            <label className="text-[10px] font-bold text-slate-600">Price (₹) *</label>
            <input 
              type="number" 
              placeholder="250"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          <div className="space-y-1 col-span-1">
            <label className="text-[10px] font-bold text-slate-600">Rating (/5) *</label>
            <input 
              type="number" 
              step="0.1" 
              max="5" 
              min="1"
              placeholder="4.8"
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
              className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500"
              required
            />
          </div>
        </div>

        {/* Food Dish Image Upload Option */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600">Food Dish Image Upload (ಆಹಾರದ ಚಿತ್ರ) *</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={handleFoodImageChange}
            className="w-full bg-orange-50/40 border border-orange-200 text-slate-600 text-xs rounded-xl p-2 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-orange-500 file:text-white hover:file:bg-orange-600 cursor-pointer"
            required
          />
        </div>

        {uploadingFood && (
          <p className="text-[10px] text-orange-600 font-bold animate-pulse">Uploading food image to Cloudinary...</p>
        )}

        {formData.image && (
          <div className="relative w-full h-32 bg-slate-100 rounded-xl overflow-hidden border border-orange-200">
            <img src={formData.image} alt="Food Preview" className="w-full h-full object-cover" />
          </div>
        )}

        {/* PROMOTIONAL VIDEO / BANNER SECTION */}
        <div className="space-y-2 pt-3 border-t border-orange-100">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-orange-900 uppercase">🎬 Promotional Video / Banner (Optional)</label>
            {formData.promoMedia && (
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, promoMedia: '' }))}
                className="text-[9px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 cursor-pointer"
              >
                Remove Promo
              </button>
            )}
          </div>
          <input 
            type="file" 
            accept="image/*,video/*"
            onChange={handlePromoMediaChange}
            className="w-full bg-orange-50/40 border border-orange-200 text-slate-600 text-xs rounded-xl p-2 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-slate-900 file:text-white hover:file:bg-black cursor-pointer"
          />
          <p className="text-[9px] text-slate-400">Upload a promotional video (.mp4) or banner image to showcase in the customer home feed.</p>
        </div>

        {uploadingPromo && (
          <p className="text-[10px] text-orange-600 font-bold animate-pulse">Uploading promotional media...</p>
        )}

        {formData.promoMedia && (
          <div className="relative w-full h-28 bg-slate-900 rounded-xl overflow-hidden border border-orange-200">
            {formData.mediaType === 'video' ? (
              <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                <source src={formData.promoMedia} />
              </video>
            ) : (
              <img src={formData.promoMedia} alt="Promo Preview" className="w-full h-full object-cover" />
            )}
          </div>
        )}

        <button 
          type="submit"
          className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-xs font-black py-3 rounded-xl shadow-lg shadow-orange-500/20 transition mt-2 active:scale-95 cursor-pointer"
        >
          + Save & Assign Dish to Hotel ⚡
        </button>

      </form>

    </div>
  );
}