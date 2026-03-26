'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { customerAPI } from '@/lib/api';
import { customerAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CustomerLogin() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLoggedOut = searchParams.get('logout') === '1';
  // step: 'phone' | 'newname'
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [foundName, setFoundName] = useState(null); // name fetched from DB
  const [hotelId, setHotelId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already logged in for this hotel, skip login
    if (customerAuth.isValidSession(params.hotelId)) {
      router.push(`/${params.hotelId}/menu`);
      return;
    }

    // If we have saved phone from a previous hotel, try auto-login
    // BUT only if we didn't just explicitly logout
    const savedInfo = customerAuth.getLastCustomerInfo();
    if (!isLoggedOut && savedInfo?.contactInfo) {
      setPhone(savedInfo.contactInfo);
      performAutoLogin(savedInfo);
    }
  }, [params.hotelId, isLoggedOut]);

  const performAutoLogin = async (info) => {
    setLoading(true);
    try {
      const hotelRes = await customerAPI.getHotelByQR(params.hotelId);
      if (hotelRes.data.success) {
        const hId = hotelRes.data.hotel.id;
        const loginRes = await customerAPI.login({ ...info, hotelId: hId });
        if (loginRes.data.success) {
          saveAndRedirect(loginRes.data);
          return;
        }
      }
    } catch (err) {
      console.error('Auto-login failed:', err);
    }
    setLoading(false);
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Verify hotel
      const hotelRes = await customerAPI.getHotelByQR(params.hotelId);
      if (!hotelRes.data.success) {
        setError('Invalid QR. Please scan again.');
        setLoading(false);
        return;
      }
      const hId = hotelRes.data.hotel.id;
      setHotelId(hId);

      // 2. Check if this number exists locally or globally
      const checkRes = await customerAPI.checkContact({ contactInfo: phone, hotelId: hId });

      if (checkRes.data.exists) {
        // Known customer at this hotel → login directly, no name needed
        const loginRes = await customerAPI.login({ contactInfo: phone, hotelId: hId });
        if (loginRes.data.success) {
          saveAndRedirect(loginRes.data);
        }
      } else if (checkRes.data.name) {
        // Known at another hotel → auto-register here with their existing name
        setFoundName(checkRes.data.name);
        const loginRes = await customerAPI.login({
          contactInfo: phone,
          name: checkRes.data.name,
          hotelId: hId
        });
        if (loginRes.data.success) {
          saveAndRedirect(loginRes.data);
        }
      } else {
        // Brand new customer — need name
        setStep('newname');
        setLoading(false);
      }
    } catch (err) {
      setError('Connection problem. Please try again.');
      setLoading(false);
    }
  };

  const handleNewNameSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const hId = hotelId || (await customerAPI.getHotelByQR(params.hotelId)).data.hotel.id;
      const loginRes = await customerAPI.login({ contactInfo: phone, name, hotelId: hId });
      if (loginRes.data.success) {
        saveAndRedirect(loginRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register.');
      setLoading(false);
    }
  };

  const saveAndRedirect = (data) => {
    const customer = { ...data.customer, sessionQrCode: params.hotelId };
    customerAuth.setCustomer(customer);
    customerAuth.saveLastCustomerInfo({
      name: customer.name,
      contactInfo: customer.phone || customer.email || phone
    });
    if (data.token) customerAuth.setToken(data.token);
    toast.success(`Welcome, ${customer.name}! 🎉`);
    router.push(`/${params.hotelId}/menu`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden font-outfit selection:bg-indigo-500/30">
      {/* Cinematic Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05),transparent_70%)]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-xl w-full relative z-10"
      >
        <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-12 sm:p-20 shadow-[0_32px_120px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          
          <div className="absolute top-12 right-12 opacity-20 group-hover:opacity-40 transition-opacity">
            <Sparkles size={48} className="text-indigo-400 animate-pulse" />
          </div>

          <div className="text-center mb-16 relative">
            <motion.div 
               whileHover={{ rotate: 12, scale: 1.1 }}
               className="h-24 w-24 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[2rem] flex items-center justify-center text-white shadow-2xl mx-auto mb-10 relative z-10"
            >
              <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-40 animate-pulse" />
              {step === 'phone' ? <Smartphone size={44} className="relative z-10" /> : <User size={44} className="relative z-10" />}
            </motion.div>
            
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none mb-4">
              {step === 'phone' ? 'Identity' : 'Profile'}
            </h1>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] italic leading-relaxed">
              {step === 'phone' ? 'Enter your telecommunication link' : 'Initialize your culinary signature'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-6 py-4 rounded-2xl mb-12 text-[10px] font-black uppercase text-center tracking-widest flex items-center justify-center gap-3 italic"
              >
                <div className="h-1.5 w-1.5 bg-rose-500 rounded-full animate-pulse" />
                {error}
              </motion.div>
            )}

            {loading && step === 'phone' && foundName && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-6 py-4 rounded-2xl mb-12 text-[10px] font-black text-center uppercase tracking-widest flex items-center justify-center gap-3 animate-pulse"
              >
                <CheckCircle size={18} />
                Profile Synchronized | Logging In
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === 'phone' ? (
              <motion.form
                key="phone-step"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handlePhoneSubmit}
                className="space-y-10"
              >
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-[0.3em] italic">Telecommunication Node</label>
                  <div className="relative group">
                    <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={24} />
                    <input
                      type="tel"
                      required
                      autoFocus
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-20 px-16 bg-slate-950/50 border border-white/10 rounded-[2rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-white font-black text-xl tracking-[0.2em]"
                      placeholder="CONTACT_001"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-24 bg-white text-slate-950 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.5em] shadow-3xl shadow-indigo-500/10 hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 group"
                >
                  {loading ? 'SYNCHRONIZING...' : 'INITIALIZE'} <ArrowRight size={24} strokeWidth={3} className="group-hover:translate-x-2 transition-transform" />
                </button>

                <p className="text-center text-[9px] text-slate-600 font-black uppercase tracking-[0.4em] italic opacity-60">
                   Universal Cross-Establishment Recognition Protocol
                </p>
              </motion.form>
            ) : (
              <motion.form
                key="name-step"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleNewNameSubmit}
                className="space-y-10"
              >
                <div className="p-6 bg-indigo-500/5 border border-white/5 rounded-3xl mb-4 text-center">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Linked Identifier</p>
                  <p className="text-lg text-indigo-400 font-black tracking-widest leading-relaxed uppercase">{phone}</p>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-[0.3em] italic">Signature Name</label>
                  <div className="relative group">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={24} />
                    <input
                      type="text"
                      required
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-20 px-16 bg-slate-950/50 border border-white/10 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-white font-black text-lg"
                      placeholder="OPERATOR_NAME"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => { setStep('phone'); setError(''); }}
                    className="h-20 px-8 bg-slate-950 border border-white/10 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-white transition-all italic"
                  >
                    RETURN
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-20 bg-white text-slate-950 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-3xl hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {loading ? 'JOINING...' : 'START EXPERIENCE'} <ArrowRight size={20} strokeWidth={3} />
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="pt-12 border-t border-white/5 mt-16 flex items-center justify-center gap-4 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all">
            <ShieldCheck size={18} className="text-emerald-500" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Zero-Knowledge Session Protocol</span>
          </div>
        </div>
        
        <div className="mt-12 text-center">
           <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em] opacity-40">Gateway Node Alpha // Antigravity Core</p>
        </div>
      </motion.div>
    </div>
  );
}
