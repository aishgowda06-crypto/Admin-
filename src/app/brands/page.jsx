'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminBrandsPage() {
  const router = useRouter();
  const [brands, setBrands] = useState([]);
  const [brandName, setBrandName] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  // Handle Cloudinary Image Upload
  const handleCloudinaryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'shopmatries_preset'); // Replace with your Cloudinary upload preset if different

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dlp0b686q/image/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.secure_url) {
        setBrandLogo(data.secure_url);
        alert('Logo uploaded successfully to Cloudinary!');
      } else {
        alert('Image upload failed.');
      }
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      alert('Error uploading image.');
    } finally {
      setUploadingImage(false);
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
          <h1 className="text-base font-black text-slate-900">🏷️ Admin Brand Management</h1>
          <p className="text-[10px] text-slate-500">Add or remove top featured partner brands with Cloudinary logos.</p>
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
          <div className="flex items-center space-x-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleCloudinaryUpload}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
            />
          </div>
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