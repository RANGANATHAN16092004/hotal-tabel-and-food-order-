'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { customerAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Building2 } from 'lucide-react';

export default function GlobalStaffLoginPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [hotelId, setHotelId] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Verify hotel exists before redirecting
            const hotelRes = await customerAPI.getHotelByQR(hotelId);

            if (!hotelRes.data.success) {
                toast.error('Invalid Hotel Identifier');
                setLoading(false);
                return;
            }

            // Redirect to the Hotel-Specific Staff Portal
            toast.success('Hotel found! Redirecting...');
            router.push(`/${hotelId}/staff/login`);

        } catch (error) {
            toast.error('Hotel not found. Please check the ID.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 font-outfit overflow-hidden relative selection:bg-indigo-500/30">
            {/* Cinematic Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05),transparent_70%)]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-xl relative z-10"
            >
                <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[4rem] border border-white/10 shadow-[0_32px_120px_-15px_rgba(0,0,0,0.5)] p-12 sm:p-20 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                    
                    <div className="text-center mb-16 relative">
                        <motion.div 
                            whileHover={{ rotate: 12, scale: 1.1 }}
                            className="h-24 w-24 bg-gradient-to-tr from-indigo-600 to-indigo-700 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl border border-white/10 relative z-10"
                        >
                            <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-40 animate-pulse" />
                            <Building2 className="text-white relative z-10" size={44} />
                        </motion.div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none mb-4">
                            Staff Entry
                        </h1>
                        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] italic leading-relaxed">
                            Access your designated establishment workspace
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-[0.3em] italic">Hotel Identifier (Slug)</label>
                            <div className="relative group">
                                <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" size={24} />
                                <input
                                    type="text"
                                    required
                                    value={hotelId}
                                    onChange={(e) => setHotelId(e.target.value)}
                                    placeholder="e.g. majestic-palms"
                                    className="w-full h-20 bg-slate-950/50 border border-white/10 rounded-[2rem] py-3.5 pl-16 pr-8 text-white placeholder:text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-lg uppercase tracking-widest"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-24 bg-white text-slate-900 font-black rounded-[2.5rem] shadow-3xl shadow-indigo-500/10 flex items-center justify-center gap-4 transition-all active:scale-95 text-[12px] uppercase tracking-[0.5em] group"
                        >
                            {loading ? (
                                <Loader2 className="w-8 h-8 animate-spin" />
                            ) : (
                                <>
                                    Locate Portal <ArrowRight className="group-hover:translate-x-2 transition-transform" size={24} strokeWidth={3} />
                                </>
                            )}
                        </button>
                    </form>
                    
                    <div className="mt-16 pt-10 border-t border-white/5 text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-loose italic">
                            Authorized Personnel Only. Logged access required.
                        </p>
                    </div>
                </div>
                
                <div className="mt-12 text-center">
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] opacity-40">Gateway Protocol v3.1</p>
                </div>
            </motion.div>
        </div>
    );
}
