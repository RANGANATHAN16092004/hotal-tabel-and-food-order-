'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { customerAPI } from '@/lib/api';
import { customerAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Smartphone,
  MapPin,
  Phone,
  ArrowRight,
  Lock,
  Unlock,
  Info,
  CheckCircle
} from 'lucide-react';

export default function HotelLanding() {
  const params = useParams();
  const router = useRouter();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const qrCode = params.hotelId;
    if (qrCode) {
      // If already logged in for this hotel/QR, jump straight to menu
      if (customerAuth.isValidSession(qrCode)) {
        router.push(`/${qrCode}/menu`);
        return;
      }
      fetchHotel(qrCode);
    }
  }, [params.hotelId]);

  const fetchHotel = async (qrCode) => {
    try {
      const response = await customerAPI.getHotelByQR(qrCode);
      if (response.data.success) {
        setHotel(response.data.hotel);
      }
    } catch (err) {
      setError('Hotel not found. Please check your QR code.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (hotel) {
      router.push(`/${params.hotelId}/login`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="h-16 w-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full"
          />
        </div>
        <p className="mt-6 text-indigo-400 font-bold text-xs uppercase tracking-widest animate-pulse">Loading Hotel Details...</p>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-10 text-center">
        <div className="h-20 w-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 mb-8 border border-rose-500/20">
          <Lock size={32} />
        </div>
        <h1 className="text-3xl font-outfit font-black text-white italic uppercase mb-4">Access Problem</h1>
        <p className="text-slate-500 font-medium max-w-sm mb-12 italic leading-relaxed">{error || 'Unable to connect to this establishment.'}</p>
        <button
          onClick={() => router.push('/')}
          className="px-10 py-4 bg-white text-slate-950 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl"
        >
          GO BACK
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-600/10 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-emerald-600/10 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-10 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl mb-8">
              <CheckCircle size={32} />
            </div>

            <h1 className="text-4xl font-outfit font-black text-white italic uppercase mb-2">{hotel.name}</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-10">Welcome to our restaurant</p>

            <div className="w-full space-y-4 mb-10">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <MapPin size={18} className="text-indigo-400 shrink-0" />
                <p className="text-sm font-medium text-slate-300 italic text-left">{hotel.address || 'Address not provided'}</p>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <Phone size={18} className="text-emerald-400 shrink-0" />
                <p className="text-sm font-medium text-slate-300 italic text-left">{hotel.phone || 'Phone not provided'}</p>
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="w-full group py-5 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-slate-50 active:scale-95 transition-all"
            >
              CONTINUE TO MENU <ArrowRight size={18} />
            </button>

            <p className="mt-10 text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em]">PROPRIETARY DINESMART SYSTEM</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
