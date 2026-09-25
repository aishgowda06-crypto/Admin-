'use client';
import { useState, useEffect } from 'react';

export default function AdminAddFoodDish() {
  const [hotels, setHotels] = useState([]);
  const [formData, setFormData] = useState({
    kannadaName: '',
    englishName: '',
    category: 'Hotels',
    hotelId: '',
    hotelNameInput: '', // For manually typing a new hotel name
    hotelImage: '',     // Photo for the new hotel
    price: '',
    image: ''           // Photo for the food dish
  });
  const [message, setMessage] = useState('');
  const [uploadingFood, setUploadingFood] = useState(false);
  const [uploadingHotel, setUploadingHotel] = useState(false);

  // Fetch partner hotels directly from backend database
  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-ohea.onrender.com';

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
      alert('Failed to upload image to Cloudinary.');
      return null;
    }
  };

  // Handle food image upload directly to Cloudinary
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

  // Handle hotel image upload directly to Cloudinary
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let finalHotelName = 'Partner Hotel';
    let finalHotelId = formData.hotelId;
    let finalHotelImage = formData.hotelImage;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-ohea.onrender.com';

    try {
      // If a new hotel is typed, save it along with its specific photo to the database first
      if (formData.hotelId === 'new') {
        const newHotelName = formData.hotelNameInput.trim() || 'New Partner Hotel';
        
        const hotelRes = await fetch(`${API_URL}/api/foods/restaurants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: newHotelName, 
            address: 'Local Area',
            image: formData.hotelImage // Strictly sends the hotel logo/store image
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

      // Build a clean payload including hotel store image and food dish details
      const foodPayload = {
        kannadaName: formData.kannadaName,
        englishName: formData.englishName,
        category: formData.category,
        hotelId: finalHotelId,
        hotelName: finalHotelName,
        hotelImage: finalHotelImage, // 👈 Included to successfully save hotel store logo/image
        price: formData.price,
        image: formData.image // Strictly sends the food dish photo URL
      };

      // Submit food dish payload to backend
      const foodRes = await fetch(`${API_URL}/api/foods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(foodPayload)
      });
      
      const foodData = await foodRes.json();

      if (foodRes.ok && foodData.success) {
        setMessage(`✅ Food dish successfully added to "${finalHotelName}" menu!`);
        setFormData({ kannadaName: '', englishName: '', category: 'Hotels', hotelId: '', hotelNameInput: '', hotelImage: '', price: '', image: '' });
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
      <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm space-y-1">
        <h2 className="text-sm font-black text-slate-950">Add Food Dish & Hotel (ಹೊಸ ಆಹಾರ ಮತ್ತು ಹೋಟೆಲ್ ಸೇರಿಸಿ)</h2>
        <p className="text-[11px] text-slate-500">Select an existing hotel or type a new hotel name directly while adding your dish.</p>
      </div>

      {message && (
        <div className="bg-white border border-emerald-200 text-emerald-700 text-xs font-bold p-3 rounded-2xl text-center shadow-sm">
          {message}
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-3">
        
        {/* Hotel Selector / Creator */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-600 uppercase">Select or Add Hotel *</label>
          <select 
            value={formData.hotelId}
            onChange={(e) => setFormData({ ...formData, hotelId: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-bold cursor-pointer"
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

          {/* Input field and Hotel Photo upload appear only if 'Type New Hotel Name' is selected */}
          {formData.hotelId === 'new' && (
            <div className="space-y-3 pt-1 animate-fadeIn">
              <div>
                <input 
                  type="text"
                  placeholder="Enter new hotel name (e.g. Midari hotel)"
                  value={formData.hotelNameInput}
                  onChange={(e) => setFormData({ ...formData, hotelNameInput: e.target.value })}
                  className="w-full bg-emerald-50/50 border border-emerald-300 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-emerald-800">Hotel Logo / Store Image (ಹೋಟೆಲ್ ಚಿತ್ರ) *</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleHotelImageChange}
                  className="w-full bg-emerald-50/40 border border-emerald-200 text-slate-600 text-xs rounded-xl p-2 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                  required
                />
              </div>

              {uploadingHotel && (
                <p className="text-[10px] text-emerald-600 font-bold animate-pulse">Uploading hotel image to Cloudinary...</p>
              )}

              {formData.hotelImage && (
                <div className="relative w-full h-24 bg-slate-100 rounded-xl overflow-hidden border border-emerald-200">
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
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
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
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600">Category *</label>
            <select 
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 cursor-pointer"
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

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600">Base Price (₹) *</label>
            <input 
              type="number" 
              placeholder="250"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
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
            className="w-full bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-xl p-2 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
            required
          />
        </div>

        {uploadingFood && (
          <p className="text-[10px] text-emerald-600 font-bold animate-pulse">Uploading food image to Cloudinary...</p>
        )}

        {/* Food Image Preview Thumbnail */}
        {formData.image && (
          <div className="relative w-full h-32 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
            <img src={formData.image} alt="Food Preview" className="w-full h-full object-cover" />
          </div>
        )}

        <button 
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition mt-2 active:scale-95 cursor-pointer"
        >
          + Save & Assign Dish to Hotel ⚡
        </button>

      </form>

    </div>
  );
}