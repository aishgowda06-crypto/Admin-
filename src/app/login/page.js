'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (phone.length !== 10 || isNaN(phone)) {
      setError('Please enter a valid 10-digit mobile number.');
      setLoading(false);
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });
      const data = await res.json();

      if (res.ok && (data.success || data.token)) {
        if (data.isAdmin) {
          localStorage.setItem('shopmatries_admin_auth', 'true');
          localStorage.setItem('shopmatries_admin_token', data.token || 'admin_secure_session_active');
          localStorage.setItem('shopmatries_is_admin', 'true');
          localStorage.setItem('shopmatries_phone', phone);
          if (data.name) localStorage.setItem('shopmatries_username', data.name);
          
          window.location.href = '/';
        } else {
          setError('Access denied: This account does not have admin privileges.');
        }
      } else {
        setError(data.error || data.message || 'Invalid mobile number or password.');
      }
    } catch (err) {
      console.error('Database authentication error:', err);
      setError('Unable to connect to the server. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white border border-orange-200 p-6 rounded-3xl space-y-5 shadow-2xl">
      <div className="text-center space-y-1">
        <h1 className="text-lg font-black text-slate-900">🔐 Admin Portal Login</h1>
        <p className="text-xs text-slate-500">Enter your admin mobile number and password to access dashboard controls</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Mobile Number Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-wide">10-Digit Mobile Number</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-500 text-sm">📞</span>
            <input
              type="tel"
              maxLength={10}
              inputMode="numeric"
              placeholder="Enter admin mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-orange-50/30 border border-orange-200 rounded-xl px-3.5 py-2.5 pl-10 text-xs text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono font-bold"
              required
            />
          </div>
        </div>

        {/* Password Input with Toggle */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-wide">Password</label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-orange-500 text-sm z-10">🔒</span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-orange-50/30 border border-orange-200 rounded-xl px-3.5 py-2.5 pl-10 pr-10 text-xs text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none font-semibold"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 text-slate-400 hover:text-slate-600 text-xs cursor-pointer z-10"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {error && <p className="text-[11px] text-red-600 font-bold bg-red-50 p-2.5 rounded-xl border border-red-200 text-center">{error}</p>}
        
        <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-black text-xs py-3 rounded-xl transition shadow-lg cursor-pointer">
          {loading ? 'Verifying Database...' : 'Authenticate & Enter Admin ⚡'}
        </button>
      </form>
    </div>
  );
}