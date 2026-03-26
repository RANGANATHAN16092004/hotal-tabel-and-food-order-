'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ArrowRight, Loader2, CheckCircle2, AlertCircle, ShoppingBag, Calendar, MapPin, ClipboardList, TrendingUp, Mail, Send } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

export default function PhoneOrderLookup() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verified, setVerified] = useState(false);

  const sendOtp = async (e) => {
    e?.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
      } else {
        setError(data.message || 'Failed to send verification code');
      }
    } catch (err) {
      setError('Network synchronization failed');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e?.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otpCode })
      });
      const data = await res.json();
      if (res.ok) {
        setVerified(true);
        setOrders(data.orders || []);
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch (err) {
      setError('Verification sequence failed');
    } finally {
      setLoading(false);
    }
  };

  const sendReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/report/global`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Spending report has been sent to your registered email!');
      } else {
        setError(data.message || 'Failed to send report');
      }
    } catch (err) {
      setError('Failed to initiate report transmission');
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem]">
          <div className="h-12 w-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <CheckCircle2 size={24} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Authenticated</p>
            <p className="text-lg font-bold text-white tracking-tight">Identity Verified • {orders.length} Results Found</p>
          </div>
          <button
            onClick={sendReport}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
            Send Report
          </button>
        </div>

        <div className="space-y-6">
          {orders.map((order, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={order._id}
              className="group p-8 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/[0.08] transition-all"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight italic">{order.hotelId?.name || 'Partner Establishment'}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar size={12} /> {new Date(order.orderDate).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <MapPin size={12} /> Table {order.tableId?.tableNumber || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-2xl font-black text-white tracking-tighter mb-1 uppercase">{order.totalAmountFormatted || `₹${order.finalAmount}`}</p>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ClipboardList size={12} /> Order Snapshot
                  </p>
                  <ul className="space-y-2">
                    {order.items.slice(0, 3).map((item, i) => (
                      <li key={i} className="flex justify-between text-xs font-medium text-slate-300">
                        <span>{item.name} <span className="text-slate-500">x{item.quantity}</span></span>
                      </li>
                    ))}
                    {order.items.length > 3 && (
                      <li className="text-[10px] font-bold text-indigo-400 italic">+{order.items.length - 3} additional items</li>
                    )}
                  </ul>
                </div>
                <div className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                      <TrendingUp size={12} /> Growth Impact
                    </p>
                    <p className="text-xs font-bold text-slate-400">Earned {order.pointsEarned || 0} Vitality Points</p>
                  </div>
                  <Link
                    href={`/order-tracker/${order._id}`}
                    className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all mt-4"
                  >
                    Full Digital Receipt <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <button
          onClick={() => setVerified(false)}
          className="w-full py-4 border-2 border-dashed border-white/10 rounded-[2rem] text-[10px] font-black text-slate-500 uppercase tracking-widest hover:border-white/20 hover:text-white transition-all"
        >
          Reset Session & New Lookup
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={otpSent ? verifyOtp : sendOtp} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Digital Signature (Phone Number)</label>
        <div className="relative group">
          <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input
            autoFocus
            type="tel"
            required
            placeholder="+91 ••••• •••••"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={otpSent || loading}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-[1.5rem] py-5 pl-14 pr-6 text-white placeholder:text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-lg font-bold tracking-tight"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {otpSent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Verification Fragment (OTP Code)</label>
            <div className="grid grid-cols-2 gap-4">
              <input
                autoFocus
                type="text"
                required
                maxLength={6}
                placeholder="000 000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                disabled={loading}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-[1.5rem] py-5 px-8 text-white placeholder:text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-2xl font-black tracking-[0.5em] text-center"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] py-5 px-6 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>Sync <ArrowRight size={18} /></>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!otpSent && (
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] py-5 px-6 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>Transmit Verification Request <ArrowRight size={18} /></>
          )}
        </button>
      )}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-xs font-bold italic"
          >
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
