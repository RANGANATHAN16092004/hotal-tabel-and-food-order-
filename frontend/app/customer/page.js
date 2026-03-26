'use client';

import PhoneOrderLookup from '@/components/customer/PhoneOrderLookup';
import { motion } from 'framer-motion';
import { ShieldCheck, Search, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function CustomerPage() {
  return (
    <main className="min-h-screen bg-[#050505] selection:bg-indigo-500/30 font-outfit overflow-hidden relative flex flex-col items-center justify-center p-6">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[150px] rounded-full" />
      </div>

      <div className="absolute top-8 left-8 z-50">
        <Link href="/" className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-full flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all">
          <ArrowLeft size={14} /> Back to Gateway
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="max-w-2xl w-full z-10"
      >
        <div className="bg-white/5 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 shadow-2xl p-8 sm:p-16 text-center relative overflow-hidden">
          {/* Subtle line background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 mb-10 text-indigo-400">
            <Search size={40} />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-6">
            <Sparkles size={12} className="text-indigo-400" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest">Enterprise Search Engine</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 leading-[0.9]">
            ORDER <span className="text-indigo-500">SYNCHRONIZER.</span>
          </h1>

          <p className="text-slate-400 text-lg font-medium mb-12 max-w-md mx-auto italic leading-relaxed">
            Aggregate and track your culinary history across our entire partner ecosystem instantly.
          </p>

          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 mb-10 text-left">
            <PhoneOrderLookup />
          </div>

          <div className="flex items-center justify-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <ShieldCheck size={14} /> Encrypted
            </div>
            <span>TLS 1.3 Secure Protocol</span>
          </div>
        </div>

        <p className="mt-10 text-center text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">
          RestoSync Global Data Mesh • Node v1.4.2
        </p>
      </motion.div>
    </main>
  );
}
