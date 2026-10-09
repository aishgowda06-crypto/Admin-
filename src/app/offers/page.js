'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminOffersPage() {
  const router = useRouter();
  const [offer, setOffer] = useState({
    tag: '',
    title: '',
    subtitle: '',
    Delivery: 'Free',
    bgMedia: '',
    mediaType: '' // 'image' or 'video'
  });
  const [saved, setSaved] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  // Brand states
  const [brandsList, setBrandsList] = useState([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

  const fetchData = () => {
    // Fetch banner/offer data
    fetch(`${API_URL}/api/offers`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setOffer(prev => ({ ...prev, ...data }));
        }
      })
      .catch(err => console.error('Failed to fetch offer banner data:', err));

    // Fetch brands list
    fetch(`${API_URL}/api/brands`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setBrandsList(data);
      })
      .catch(err => console.error('Failed to fetch brands:', err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper function for Cloudinary upload
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

  // Handle banner media upload
  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const isVideo = file.type.startsWith('video');
      setUploadingMedia(true);
      const secureUrl = await uploadDirectToCloudinary(file);
      if (secureUrl) {
        setOffer(prev => ({
          ...prev,
          bgMedia: secureUrl,
          mediaType: isVideo ? 'video' : 'image'
        }));
      }
      setUploadingMedia(false);
    }
  };

  // Save Banner Changes
  const handleSaveBanner = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/api/offers`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offer)
    })
      .then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      })
      .catch((err) => console.error('Failed to update offer banner:', err));
  };

  // Delete Brand
  const handleDeleteBrand = async (id) => {
    if (!confirm('Are you sure you want to delete this brand?')) return;
    try {
      const res = await fetch(`${API_URL}/api/brands/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Brand deleted successfully!');
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting brand:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Live Preview Banner */}
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live Customer Banner Preview</p>
        <div className="relative border border-orange-100 p-4 rounded-2xl shadow-xl flex justify-between items-center text-white overflow-hidden bg-slate-900 min-h-[90px]">
          {offer.bgMedia ? (
            offer.mediaType === 'video' ? (
              <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0 opacity-60">
                <source src={offer.bgMedia} />
              </video>
            ) : (
              <div className="absolute inset-0 w-full h-full bg-cover bg-center z-0 opacity-50" style={{ backgroundImage: `url(${offer.bgMedia})` }}></div>
            )
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-orange-950 to-slate-900 z-0"></div>
          )}
          <div className="absolute inset-0 bg-slate-950/40 z-0"></div>

          <div className="z-10 space-y-1">
            <span className="text-[9px] font-black uppercase bg-yellow-400 text-slate-950 px-2 py-0.5 rounded font-mono">{offer.tag || 'OFFER'}</span>
            <h3 className="text-sm font-black tracking-tight">{offer.title || 'Banner Title'}</h3>
            <p className="text-[10px] text-slate-200">{offer.subtitle || 'Subtitle here'}</p>
          </div>

          <div className="z-10 text-center bg-slate-900/80 border border-orange-500/30 p-2 rounded-xl backdrop-blur-md">
            <span className="text-[9px] font-bold text-orange-400 uppercase block">Delivery</span>
            <span className="text-xs font-black">{offer.Delivery}</span>
          </div>
        </div>
      </div>

      {saved && (
        <div className="bg-white border border-orange-200 text-orange-700 text-xs font-bold p-3 rounded-2xl text-center shadow-sm">
          ✅ Banner Offer Updated & Synced to Database Successfully!
        </div>
      )}

      {/* Edit Banner Form */}
      <form onSubmit={handleSaveBanner} className="bg-white border border-orange-100 p-4 rounded-3xl space-y-3 shadow-sm">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Edit Customer Banner Offer</h2>
        
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600">Offer Tag / Badge Text</label>
          <input 
            type="text"
            value={offer.tag}
            onChange={(e) => setOffer({ ...offer, tag: e.target.value })}
            className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600">Main Headline Offer Title *</label>
          <input 
            type="text"
            value={offer.title}
            onChange={(e) => setOffer({ ...offer, title: e.target.value })}
            className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600">Subtitle / Description *</label>
          <textarea 
            rows={2}
            value={offer.subtitle}
            onChange={(e) => setOffer({ ...offer, subtitle: e.target.value })}
            className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600">Upload Background Image or Video (From Device)</label>
          <input 
            type="file" 
            accept="image/*,video/*"
            onChange={handleMediaUpload}
            className="w-full bg-orange-50/40 border border-orange-200 text-slate-600 text-xs rounded-xl p-2 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-orange-500 file:text-white hover:file:bg-orange-600 cursor-pointer"
          />
        </div>
        {uploadingMedia && <p className="text-[10px] text-orange-600 font-bold animate-pulse">Uploading background media...</p>}

        <button 
          type="submit"
          className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-xs font-black py-3 rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
        >
          Save Banner Changes ⚡
        </button>
      </form>

      {/* Navigation Button to Brands Page */}
      <div className="bg-white border border-orange-100 p-4 rounded-3xl flex justify-between items-center shadow-sm">
        <div>
          <h3 className="text-xs font-black text-slate-900">🏷️ Brand Management</h3>
          <p className="text-[10px] text-slate-500">Manage brands and add food items directly.</p>
        </div>
        <button
          onClick={() => router.push('/brands')}
          className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow active:scale-95"
        >
          Go to Brands Page ➔
        </button>
      </div>

      {/* Existing Brands List with Delete option */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-black text-slate-900">📋 Existing Brands ({brandsList.length})</h3>
        {brandsList.map((brand) => {
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
                  <h4 className="text-xs font-black text-slate-900">{bName}</h4>
                  <p className="text-[9px] text-emerald-700 font-bold">Active in Slider</p>
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

    </div>
  );
}