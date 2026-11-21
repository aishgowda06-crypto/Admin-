'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const createEmptyOfferItem = () => ({
  tag: '',
  title: '',
  subtitle: '',
  Delivery: 'Free',
  bgMedia: '',
  mediaType: '', // 'image' or 'video'
  targetHotel: '', // Linked target hotel name or ID for offer navigation button
  targetFood: ''   // Linked target food item name for offer navigation button
});

export default function AdminOffersPage() {
  const router = useRouter();
  const [offer, setOffer] = useState(createEmptyOfferItem());
  const [offersList, setOffersList] = useState([]);
  const [activeOfferIdx, setActiveOfferIdx] = useState(0);
  const [saved, setSaved] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Brand & Hotels states for linking offers
  const [brandsList, setBrandsList] = useState([]);
  const [hotelsList, setHotelsList] = useState([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

  const normalizeOfferItem = (item = {}) => ({
    ...createEmptyOfferItem(),
    ...item,
    Delivery: item.Delivery ?? item.delivery ?? 'Free',
    bgMedia: item.bgMedia || item.image || '',
    mediaType:
      item.mediaType ||
      (typeof (item.bgMedia || item.image) === 'string' &&
      (item.bgMedia || item.image).match(/\.(mp4|webm|ogg|mov)(\?|$)/i)
        ? 'video'
        : (item.bgMedia || item.image)
        ? 'image'
        : ''),
    targetHotel: item.targetHotel || item.hotelName || '',
    targetFood: item.targetFood || item.foodName || ''
  });

  const fetchData = () => {
    // Fetch banner/offer data (supports single object or array of offers)
    fetch(`${API_URL}/api/offers`)
      .then(res => res.json())
      .then(data => {
        const rawList = Array.isArray(data)
          ? data
          : Array.isArray(data?.offers)
          ? data.offers
          : data && typeof data === 'object' && (data.title || data.tag || data.subtitle || data.bgMedia)
          ? [data]
          : [];

        const normalized = rawList.length > 0 ? rawList.map(normalizeOfferItem) : [createEmptyOfferItem()];
        setOffersList(normalized);
        setActiveOfferIdx(0);
        setOffer(normalized[0]);
      })
      .catch(err => console.error('Failed to fetch offer banner data:', err));

    // Fetch brands list
    fetch(`${API_URL}/api/brands`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setBrandsList(data);
      })
      .catch(err => console.error('Failed to fetch brands:', err));

    // Fetch restaurants / hotels list for target linking
    fetch(`${API_URL}/api/foods/restaurants`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setHotelsList(data);
      })
      .catch(err => console.error('Failed to fetch hotels:', err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper function for Cloudinary upload
  const uploadDirectToCloudinary = async (file) => {
    const cloudName = 'a18fmmhv';
    const uploadPreset = process.env.NEW_NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'buybrigg';

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

  // Sync current offer edits into offersList
  const syncOfferToList = (updatedOffer, targetIndex = activeOfferIdx) => {
    setOffersList(prev => {
      const base = prev.length > 0 ? [...prev] : [createEmptyOfferItem()];
      const safeIdx = Math.min(Math.max(targetIndex, 0), base.length - 1);
      base[safeIdx] = updatedOffer;
      return base;
    });
  };

  const handleOfferFieldChange = (patch) => {
    setOffer(prev => {
      const next = { ...prev, ...patch };
      syncOfferToList(next, activeOfferIdx);
      return next;
    });
  };

  // Handle single or multiple banner media uploads
  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingMedia(true);
    const uploadedItems = [];

    for (const file of files) {
      const isVideo = file.type.startsWith('video');
      const secureUrl = await uploadDirectToCloudinary(file);
      if (secureUrl) {
        uploadedItems.push({
          bgMedia: secureUrl,
          mediaType: isVideo ? 'video' : 'image'
        });
      }
    }

    if (uploadedItems.length > 0) {
      setOffer(prev => {
        const currentWithFirstMedia = {
          ...prev,
          bgMedia: uploadedItems[0].bgMedia,
          mediaType: uploadedItems[0].mediaType
        };

        setOffersList(prevList => {
          const base = prevList.length > 0 ? [...prevList] : [createEmptyOfferItem()];
          const safeIdx = Math.min(Math.max(activeOfferIdx, 0), base.length - 1);
          base[safeIdx] = currentWithFirstMedia;

          if (uploadedItems.length > 1) {
            const extraOffers = uploadedItems.slice(1).map((mediaObj, idx) => ({
              ...createEmptyOfferItem(),
              tag: prev.tag || '',
              title: prev.title ? `${prev.title} (${safeIdx + idx + 2})` : '',
              subtitle: prev.subtitle || '',
              Delivery: prev.Delivery || 'Free',
              targetHotel: prev.targetHotel || '',
              targetFood: prev.targetFood || '',
              bgMedia: mediaObj.bgMedia,
              mediaType: mediaObj.mediaType
            }));
            return [...base, ...extraOffers];
          }

          return base;
        });

        return currentWithFirstMedia;
      });
    }

    setUploadingMedia(false);
    e.target.value = '';
  };

  // Add a new offer slot to the list
  const handleAddNewOffer = () => {
    const freshOffer = createEmptyOfferItem();
    setOffersList(prev => {
      const currentSynced = prev.length > 0 ? [...prev] : [createEmptyOfferItem()];
      const safeIdx = Math.min(Math.max(activeOfferIdx, 0), currentSynced.length - 1);
      currentSynced[safeIdx] = offer;
      const nextList = [...currentSynced, freshOffer];
      setActiveOfferIdx(nextList.length - 1);
      return nextList;
    });
    setOffer(freshOffer);
  };

  // Switch between multiple offers
  const handleSelectOffer = (idx) => {
    setOffersList(prev => {
      const nextList = prev.length > 0 ? [...prev] : [createEmptyOfferItem()];
      const safeCurrentIdx = Math.min(Math.max(activeOfferIdx, 0), nextList.length - 1);
      nextList[safeCurrentIdx] = offer;
      const target = nextList[idx] || createEmptyOfferItem();
      setActiveOfferIdx(idx);
      setOffer(target);
      return nextList;
    });
  };

  // Remove an offer from the list
  const handleRemoveOffer = (idx) => {
    setOffersList(prev => {
      if (prev.length <= 1) {
        const resetSingle = createEmptyOfferItem();
        setActiveOfferIdx(0);
        setOffer(resetSingle);
        return [resetSingle];
      }
      const filtered = prev.filter((_, i) => i !== idx);
      const nextIdx = Math.min(activeOfferIdx, filtered.length - 1);
      setActiveOfferIdx(nextIdx);
      setOffer(filtered[nextIdx]);
      return filtered;
    });
  };

  // Save Banner Changes (sends active offer + all offers list)
  const handleSaveBanner = (e) => {
    e.preventDefault();
    const finalOffers = offersList.length > 0
      ? offersList.map((item, idx) => (idx === activeOfferIdx ? offer : item))
      : [offer];

    const payload = {
      ...offer,
      offers: finalOffers
    };

    fetch(`${API_URL}/api/offers`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(() => {
        setOffersList(finalOffers);
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

      {/* Multiple Offers Selector & Add Offer Bar */}
      <div className="bg-white border border-orange-100 p-3.5 rounded-2xl shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
            Offers & Banners ({offersList.length || 1})
          </span>
          <button
            type="button"
            onClick={handleAddNewOffer}
            className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black px-3 py-1 rounded-xl transition cursor-pointer active:scale-95"
          >
            + Add Offer
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(offersList.length > 0 ? offersList : [offer]).map((item, idx) => {
            const isSelected = idx === activeOfferIdx;
            return (
              <div
                key={idx}
                className={`flex items-center gap-1.5 shrink-0 rounded-xl border px-2.5 py-1.5 text-[10px] font-bold transition ${
                  isSelected
                    ? 'bg-orange-50 border-orange-400 text-orange-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectOffer(idx)}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  {item.bgMedia && item.mediaType !== 'video' && (
                    <img
                      src={item.bgMedia}
                      alt={item.title || `Offer ${idx + 1}`}
                      className="w-5 h-5 rounded-full object-cover border border-orange-200"
                    />
                  )}
                  <span>{item.title ? item.title : `Offer ${idx + 1}`}</span>
                </button>

                {offersList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOffer(idx)}
                    className="text-rose-600 hover:text-rose-800 font-black px-1 cursor-pointer"
                    title="Remove Offer"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

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
            {offer.targetHotel && (
              <span className="inline-block mt-1 bg-white/20 text-white text-[8px] font-extrabold px-2 py-0.5 rounded border border-white/30">
                Linked Hotel: {offer.targetHotel}
              </span>
            )}
            {offer.targetFood && (
              <span className="inline-block mt-1 ml-1 bg-white/20 text-white text-[8px] font-extrabold px-2 py-0.5 rounded border border-white/30">
                Linked Dish: {offer.targetFood}
              </span>
            )}
          </div>

          <div className="z-10 text-center bg-slate-900/80 border border-orange-500/30 p-2 rounded-xl backdrop-blur-md">
            <span className="text-[9px] font-bold text-orange-400 uppercase block">Delivery</span>
            <span className="text-xs font-black">₹{offer.Delivery}</span>
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
            onChange={(e) => handleOfferFieldChange({ tag: e.target.value })}
            className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600">Main Headline Offer Title *</label>
          <input
            type="text"
            value={offer.title}
            onChange={(e) => handleOfferFieldChange({ title: e.target.value })}
            className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600">Subtitle / Description *</label>
          <textarea
            rows={2}
            value={offer.subtitle}
            onChange={(e) => handleOfferFieldChange({ subtitle: e.target.value })}
            className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500"
            required
          />
        </div>

        {/* Target Hotel / Restaurant Direct Link Dropdown */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600">Link Target Hotel / Restaurant (Optional)</label>
          <select
            value={offer.targetHotel}
            onChange={(e) => handleOfferFieldChange({ targetHotel: e.target.value })}
            className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500"
          >
            <option value="">-- No Direct Hotel Link --</option>
            {hotelsList.map((h, idx) => {
              const hName = h.name || h.hotelName || h.restaurantName;
              return (
                <option key={idx} value={hName}>
                  🏨 {hName}
                </option>
              );
            })}
          </select>
          <p className="text-[9px] text-slate-400">When customers click the offer banner button, it will instantly open this hotel's menu.</p>
        </div>

        {/* Target Food Item Direct Link Input */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600">Link Target Food / Dish Name (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Masala Dosa or Coffee"
            value={offer.targetFood}
            onChange={(e) => handleOfferFieldChange({ targetFood: e.target.value })}
            className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500"
          />
          <p className="text-[9px] text-slate-400">When customers click the offer dish button, it will search and filter for this food item.</p>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600">Delivery Charge (₹)</label>
          <textarea
            rows={2}
            placeholder="e.g. ₹30 or Free"
            value={offer.Delivery}
            onChange={(e) => handleOfferFieldChange({ Delivery: e.target.value })}
            className="w-full bg-orange-50/40 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500 font-bold"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600">Upload Background Image(s) or Video (From Device)</label>
          <input
            type="file"
            multiple
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