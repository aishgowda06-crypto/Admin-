'use client';
import { useState } from 'react';

export default function AdminLoginPage() {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-ohea.onrender.com';

    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Save token and redirect to dashboard
        localStorage.setItem('shopmatries_admin_auth', 'true');
        localStorage.setItem('shopmatries_admin_token', data.token || 'admin_secure_session_active');
        window.location.href = '/';
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Database authentication error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5 shadow-2xl">
      <div className="text-center space-y-1">
        <h1 className="text-lg font-black text-white">🔐 Admin Portal Login</h1>
        <p className="text-xs text-slate-400">Enter secure admin passcode to access control dashboard</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="password"
          placeholder="Admin passcode (e.g. )"
          value={passcode}
          onChange={(e) => { setPasscode(e.target.value); setError(false); }}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />
        {error && <p className="text-[10px] text-red-400 font-bold">Invalid passcode. Check backend/database records.</p>}
        <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl transition shadow-lg cursor-pointer">
          {loading ? 'Verifying...' : 'Authenticate & Enter'}
        </button>
      </form>
    </div>
  );
}