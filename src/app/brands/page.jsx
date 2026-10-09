'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminBrandsPage() {
  const router = useRouter();
  const [brands, setBrands] = useState([]);
  const [brandName, setBrandName] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  
  // Brand Food Item Form States
  const [foodBrand, setFoodBrand] = useState('');
  const [foodName, setFoodName] = useState('');
  const [foodKannadaName, setFoodKannadaName] = useState('');
  const [foodPrice, setFoodPrice] = useState('');
  const [foodImage, setFoodImage] = useState('');
  const [foodCategory, setFoodCategory] = useState('Hotels');

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFoodImage, setUploadingFoodImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittingFood, setSubmittingFood] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

  const fetchBrands = async () => {
    try {
      const res = await fetch(`${API_URL}/api/brands`);
      const data = await res.json();
      if (Array.isArray(data)) setBrands(data);
    } catch (err) {
      console.error('Failed to load brands:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  // Helper function for Cloudinary upload (Matched exactly with offers page)
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

  // Handle Cloudinary Brand Logo Upload
  const handleCloudinaryUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadingImage(true);
      const secureUrl = await uploadDirectToCloudinary(file);
      if (secureUrl) {
        setBrandLogo(secureUrl);
        alert('Logo uploaded successfully to Cloudinary!');
      }
      setUploadingImage(false);
    }
  };

  // Handle Cloudinary Food Item Image Upload
  const handleFoodCloudinaryUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadingFoodImage(true);
      const secureUrl = await uploadDirectToCloudinary(file);
      if (secureUrl) {
        setFoodImage(secureUrl);
        alert('Food image uploaded successfully to Cloudinary!');
      }
      setUploadingFoodImage(false);
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    if (!brandName.trim()) {
      return alert('Please enter a brand name.');
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: brandName.trim(), logo: brandLogo.trim() })
      });

      if (res.ok) {
        alert('Brand added successfully!');
        setBrandName('');
        setBrandLogo('');
        fetchBrands();
      } else {
        alert('Failed to add brand.');
      }
    } catch (err) {
      console.error('Error adding brand:', err);
      alert('Network error while adding brand.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFoodToBrand = async (e) => {
    e.preventDefault();
    if (!foodBrand) {
      return alert('Please select a target brand.');
    }
    if (!foodName.trim() || !foodPrice) {
      return alert('Please enter food name and price.');
    }

    setSubmittingFood(true);
    const activeCity = typeof window !== 'undefined' ? (localStorage.getItem('shopmatries_city') || 'Shivamogga') : 'Shivamogga';

    try {
      const foodPayload = {
        englishName: foodName.trim(),
        kannadaName: foodKannadaName.trim(),
        name: foodName.trim(),
        price: Number(foodPrice),
        category: foodCategory,
        hotelName: foodBrand,
        brand: foodBrand,
        city: activeCity,
        image: foodImage.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
        rating: 4.8,
        available: true
      };

      const res = await fetch(`${API_URL}/api/foods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(foodPayload)
      });

      const data = await res.json();
      if (res.ok && (data.success || data.item)) {
        alert(`✅ Food item successfully added to brand "${foodBrand}" in ${activeCity}!`);
        setFoodName('');
        setFoodKannadaName('');
        setFoodPrice('');
        setFoodImage('');
      } else {
        alert(`❌ ${data.error || 'Failed to add food item to database.'}`);
      }
    } catch (err) {
      console.error('Error adding food item to brand:', err);
      alert('Network error while saving food item.');
    } finally {
      setSubmittingFood(false);
    }
  };

  const handleDeleteBrand = async (id) => {
    if (!confirm('Are you sure you want to delete this brand?')) return;

    try {
      const res = await fetch(`${API_URL}/api/brands/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert('Brand deleted successfully!');
        fetchBrands();
      } else {
        alert('Failed to delete brand.');
      }
    } catch (err) {
      console.error('Error deleting brand:', err);
    }
  };

  return (
    <main className="p-4 space-y-6 pb-28 bg-[#fffaf7] min-h-screen max-w-md mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-orange-100 pb-4">
        <div>
          <h1 className="text-base font-black text-slate-900">🏷️ Admin Brand & Food Management</h1>
          <p className="text-[10px] text-slate-500">Manage brands and assign food items directly to brand catalogs.</p>
        </div>
        <button 
          onClick={() => router.push('/')}
          className="text-xs font-bold bg-orange-50 text-orange-700 px-3 py-1.5 rounded-xl hover:bg-orange-100 transition cursor-pointer border border-orange-200"
        >
          ← Home
        </button>
      </div>

      {/* Add Brand Form */}
      <form onSubmit={handleAddBrand} className="bg-white border border-orange-200 rounded-3xl p-4 shadow-sm space-y-3">
        <h2 className="text-xs font-black text-slate-900">➕ Add New Brand</h2>
        
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600">Brand Name</label>
          <input
            type="text"
            placeholder="e.g. Nandini, Domino's, etc."
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            className="w-full px-3 py-2 bg-orange-50/50 border border-orange-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600">Brand Logo (Cloudinary Upload)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleCloudinaryUpload}
            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
          />
          {uploadingImage && <p className="text-[10px] text-orange-600 font-bold animate-pulse">Uploading image to Cloudinary...</p>}
          {brandLogo && (
            <div className="flex items-center space-x-2 mt-2 bg-orange-50 p-2 rounded-xl border border-orange-100">
              <img src={brandLogo} alt="Preview" className="w-10 h-10 rounded-lg object-cover" />
              <span className="text-[9px] text-slate-500 truncate">{brandLogo}</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || uploadingImage}
          className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-black text-xs py-3 rounded-xl shadow transition cursor-pointer active:scale-95 disabled:opacity-50"
        >
          {submitting ? 'Saving Brand...' : 'Save Brand ➔'}
        </button>
      </form>

      {/* Add Food Item Directly to Brand Form */}
      <form onSubmit={handleAddFoodToBrand} className="bg-white border border-orange-200 rounded-3xl p-4 shadow-sm space-y-3">
        <h2 className="text-xs font-black text-slate-900">🍔 Add Food Item to Brand Database</h2>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600">Select Target Brand *</label>
          <select
            value={foodBrand}
            onChange={(e) => setFoodBrand(e.target.value)}
            className="w-full px-3 py-2 bg-orange-50/50 border border-orange-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400 font-bold cursor-pointer"
            required
          >
            <option value="">-- Choose Brand --</option>
            {brands.map(b => {
              const bId = b._id || b.id;
              const bName = b.name || b.brandName;
              return <option key={bId} value={bName}>{bName}</option>;
            })}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600">English Dish Name *</label>
            <input
              type="text"
              placeholder="e.g. Special Burger"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              className="w-full px-3 py-2 bg-orange-50/50 border border-orange-200 rounded-xl text-xs text-slate-800"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600">Kannada Name</label>
            <input
              type="text"
              placeholder="ಉದಾ: ಬರ್ಗರ್"
              value={foodKannadaName}
              onChange={(e) => setFoodKannadaName(e.target.value)}
              className="w-full px-3 py-2 bg-orange-50/50 border border-orange-200 rounded-xl text-xs text-slate-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600">Price (₹) *</label>
            <input
              type="number"
              placeholder="199"
              value={foodPrice}
              onChange={(e) => setFoodPrice(e.target.value)}
              className="w-full px-3 py-2 bg-orange-50/50 border border-orange-200 rounded-xl text-xs text-slate-800"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600">Category</label>
            <select
              value={foodCategory}
              onChange={(e) => setFoodCategory(e.target.value)}
              className="w-full px-3 py-2 bg-orange-50/50 border border-orange-200 rounded-xl text-xs text-slate-800 cursor-pointer"
            >
              <option value="Hotels">Hotels</option>
              <option value="Fast Food">Fast Food</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Veg">Veg</option>
              <option value="Non-Veg">Non-Veg</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600">Food Image (Cloudinary Upload)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFoodCloudinaryUpload}
            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
          />
          {uploadingFoodImage && <p className="text-[10px] text-orange-600 font-bold animate-pulse">Uploading food image...</p>}
          {foodImage && (
            <div className="flex items-center space-x-2 mt-2 bg-orange-50 p-2 rounded-xl border border-orange-100">
              <img src={foodImage} alt="Food Preview" className="w-10 h-10 rounded-lg object-cover" />
              <span className="text-[9px] text-slate-500 truncate">{foodImage}</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submittingFood || uploadingFoodImage}
          className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-black text-xs py-3 rounded-xl shadow transition cursor-pointer active:scale-95 disabled:opacity-50"
        >
          {submittingFood ? 'Saving Food to Brand...' : 'Save Food Dish to Database ⚡'}
        </button>
      </form>

      {/* Brands List */}
      <div className="space-y-3">
        <h2 className="text-xs font-black text-slate-900">📋 Existing Brands ({brands.length})</h2>

        {loading ? (
          <div className="text-center py-12 text-xs font-bold text-orange-500 animate-pulse">Loading brands...</div>
        ) : brands.length === 0 ? (
          <div className="bg-white border border-orange-100 p-8 rounded-3xl text-center text-slate-400 text-xs font-bold">
            No brands added yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {brands.map((brand) => {
              const bId = brand._id || brand.id;
              const bName = brand.name || brand.brandName;
              const bLogo = brand.logo || brand.image;

              return (
                <div key={bId} className="bg-white border border-orange-200 rounded-2xl p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {bLogo ? (
                      <img src={bLogo} alt={bName} className="w-10 h-10 rounded-full object-cover border border-orange-200" />
                    ) : (
                      <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-black text-xs">🏷️</div>
                    )}
                    <div>
                      <h3 className="text-xs font-black text-slate-900">{bName}</h3>
                      <p className="text-[9px] text-emerald-700 font-bold">Active Brand</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteBrand(bId)}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] px-3 py-1.5 rounded-xl transition cursor-pointer border border-rose-200 active:scale-95"
                  >
                    Delete 🗑️
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </main>
  );
}