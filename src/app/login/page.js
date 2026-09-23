'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode === 'admin123') {
      localStorage.setItem('shopmatries_admin_auth', 'true');
      router.push('/orders');
    } else {
      setError(true);
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
          placeholder="Admin passcode (e.g. admin123)"
          value={passcode}
          onChange={(e) => { setPasscode(e.target.value); setError(false); }}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />
        {error && <p className="text-[10px] text-red-400 font-bold">Invalid passcode. Try 'admin123'.</p>}
        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl transition shadow-lg">
          Authenticate & Enter
        </button>
      </form>
    </div>
  );
}