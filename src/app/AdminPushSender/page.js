'use client';

import { useState, useEffect } from 'react';

export default function AdminPushSender() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [city, setCity] = useState('ALL');
  const [imageUrl, setImageUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [registeredStats, setRegisteredStats] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

  const fetchTokenStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/stats`);
      if (res.ok) {
        const data = await res.json();
        setRegisteredStats(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchTokenStats();
  }, []);

  const handleSendPush = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setStatusMsg('');
    setIsError(false);

    try {
      const res = await fetch(`${API_URL}/api/notifications/send-broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          city,
          imageUrl: imageUrl.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.sentCount > 0) {
          setIsError(false);
          setStatusMsg(
            `Sent to ${data.sentCount} device(s)${data.failureCount ? ` (${data.failureCount} failed)` : ''}!`
          );
          setTitle('');
          setBody('');
          setImageUrl('');
        } else {
          setIsError(true);
          setStatusMsg(
            data.message || 'Sent to 0 devices — no registered tokens found in database yet.'
          );
        }
        fetchTokenStats();
      } else {
        setIsError(true);
        setStatusMsg(`Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setIsError(true);
      setStatusMsg('Network error sending push notification.');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSendPush} className="bg-white border border-orange-200 rounded-2xl p-4 space-y-3 shadow-sm max-w-md">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900">Send Push Notification (Android & Web)</h3>
        {registeredStats && (
          <span className="text-[10px] font-extrabold bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full">
            Devices: {registeredStats.total || 0} (Web: {registeredStats.web || 0}, Android: {registeredStats.android || 0})
          </span>
        )}
      </div>

      <input
        type="text"
        placeholder="Notification Title (e.g., Flat 50% OFF Today!)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
        required
      />

      <textarea
        placeholder="Message Body (e.g., Order Biryani now and earn 10 Gold Coins!)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
        required
      />

      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
      >
        <option value="ALL">All Cities</option>
        <option value="Shivamogga">Shivamogga</option>
        <option value="Bengaluru">Bengaluru</option>
        <option value="Mangaluru">Mangaluru</option>
        <option value="Mysuru">Mysuru</option>
      </select>

      <input
        type="url"
        placeholder="Optional Banner Image URL (https://...)"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
      />

      <button
        type="submit"
        disabled={sending}
        className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-black text-xs py-2.5 rounded-xl shadow cursor-pointer disabled:opacity-50"
      >
        {sending ? 'Sending...' : 'Send Push Notification'}
      </button>

      {statusMsg && (
        <p className={`text-xs font-bold ${isError ? 'text-rose-600' : 'text-emerald-700'}`}>
          {statusMsg}
        </p>
      )}
    </form>
  );
}