'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { staffAPI, customerAPI } from '@/lib/api';
import { staffAuth } from '@/lib/staffAuth';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
    Lock, Mail, ArrowRight, Loader2, Users, Building2, BadgeCheck,
    ChefHat, Wallet, ShieldCheck, ChevronLeft
} from 'lucide-react';

export default function StaffLoginPage() {
    const router = useRouter();
    const params = useParams();
    const hotelId = params.hotelId;

    const [hotel, setHotel] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchingHotel, setFetchingHotel] = useState(true);
    const [selectedPortal, setSelectedPortal] = useState(null); // 'admin', 'chef', 'cashier'

    // Form data
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    useEffect(() => {
        fetchHotelDetails();
    }, [hotelId]);

    const fetchHotelDetails = async () => {
        try {
            const response = await customerAPI.getHotelByQR(hotelId);
            if (response.data.success) {
                setHotel(response.data.hotel);
            }
        } catch (error) {
            console.error('Failed to fetch hotel details');
        } finally {
            setFetchingHotel(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const role = selectedPortal || 'waiter'; // Default fallback
            const response = await staffAPI.login({
                ...formData,
                role: role, // Pass the role we are trying to login as
                hotelId: hotel?.id || hotelId
            });

            if (response.data.success) {
                // Verify strict role match if needed, or just redirect based on actual role returned
                // Ideally, we respect the portal they chose.

                staffAuth.setToken(response.data.token);
                staffAuth.setStaff(response.data.staff);
                toast.success(`Welcome back, ${response.data.staff.name}`);

                // Redirect based on the PORTAL selected (or the actual role if mismatch allowed)
                // We trust the portal selection for redirection intent
                if (selectedPortal === 'chef') {
                    router.push(`/${hotelId}/staff/kitchen`);
                } else if (selectedPortal === 'cashier') {
                    router.push(`/${hotelId}/staff/payments`);
                } else {
                    router.push(`/${hotelId}/staff`);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    if (fetchingHotel) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
        );
    }

    // Portal Selection View
    if (!selectedPortal) {
        return (
            <div className="min-h-screen bg-slate-950 p-8 font-outfit flex flex-col items-center justify-center relative overflow-hidden">
                {/* Cinematic BG */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
                
                <div className="text-center mb-20 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-indigo-500/10 border border-indigo-500/20 mb-10 shadow-3xl"
                    >
                        <Users className="text-indigo-500" size={44} />
                    </motion.div>
                    <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none">STAFF PORTALS</h1>
                    <p className="text-slate-500 mt-6 font-black text-[11px] uppercase tracking-[0.4em] italic leading-relaxed">
                        Authorized Environment: <span className="text-indigo-400">{hotel?.name || hotelId}</span>
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl w-full relative z-10">
                    {/* Admin Portal */}
                    <motion.button
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        whileHover={{ y: -10, scale: 1.02 }}
                        onClick={() => setSelectedPortal('admin')}
                        className="bg-slate-900/40 backdrop-blur-3xl p-12 rounded-[4rem] border border-white/5 shadow-3xl hover:border-indigo-500/30 transition-all text-left group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="h-20 w-20 bg-slate-950 rounded-[1.75rem] flex items-center justify-center text-white mb-10 group-hover:scale-110 transition-transform shadow-2xl border border-white/5">
                            <ShieldCheck size={36} />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">System Admin</h3>
                        <p className="text-sm text-slate-500 font-bold leading-relaxed uppercase tracking-wider italic opacity-60">Operations, Roster & Global HQ Analytics.</p>
                        <div className="mt-10 flex items-center gap-2 text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em] group-hover:gap-4 transition-all">
                           Select Node <ArrowRight size={14} />
                        </div>
                    </motion.button>

                    {/* Kitchen Portal */}
                    <motion.button
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ y: -10, scale: 1.02 }}
                        onClick={() => setSelectedPortal('chef')}
                        className="bg-slate-900/40 backdrop-blur-3xl p-12 rounded-[4rem] border border-white/5 shadow-3xl hover:border-white/20 transition-all text-left group relative overflow-hidden"
                    >
                        <div className="h-20 w-20 bg-white rounded-[1.75rem] flex items-center justify-center text-slate-950 mb-10 group-hover:rotate-12 transition-transform shadow-2xl">
                            <ChefHat size={36} />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight font-black">Kitchen Expert</h3>
                        <p className="text-sm text-slate-500 font-bold leading-relaxed uppercase tracking-wider italic opacity-60">KDS, Menu Logic & Preparation Flow.</p>
                        <div className="mt-10 flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-[0.3em] group-hover:gap-4 transition-all">
                           Select Node <ArrowRight size={14} />
                        </div>
                    </motion.button>

                    {/* Billing Portal */}
                    <motion.button
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ y: -10, scale: 1.02 }}
                        onClick={() => setSelectedPortal('cashier')}
                        className="bg-slate-900/40 backdrop-blur-3xl p-12 rounded-[4rem] border border-white/5 shadow-3xl hover:border-emerald-500/30 transition-all text-left group relative overflow-hidden"
                    >
                        <div className="h-20 w-20 bg-emerald-500 rounded-[1.75rem] flex items-center justify-center text-white mb-10 group-hover:scale-110 transition-transform shadow-2xl">
                            <Wallet size={36} />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">Billing Lead</h3>
                        <p className="text-sm text-slate-500 font-bold leading-relaxed uppercase tracking-wider italic opacity-60">Payments, Settlement & Fund Integrity.</p>
                        <div className="mt-10 flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em] group-hover:gap-4 transition-all">
                           Select Node <ArrowRight size={14} />
                        </div>
                    </motion.button>
                </div>

                <div className="mt-24 text-center">
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.6em] opacity-40">System Core v4.0.2 // Zero Trust Protocol</p>
                </div>
            </div>
        );
    }

    // Login Form View
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 font-outfit overflow-hidden relative selection:bg-indigo-500/30">
             {/* Cinematic Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
            
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-xl relative z-10"
            >
                <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[4rem] border border-white/10 shadow-[0_32px_120px_-15px_rgba(0,0,0,0.5)] p-12 sm:p-20 relative overflow-hidden group">
                    <button
                        onClick={() => setSelectedPortal(null)}
                        className="absolute top-12 left-12 h-14 w-14 flex items-center justify-center bg-slate-950 border border-white/10 text-slate-400 hover:text-white rounded-2xl transition-all shadow-xl"
                    >
                        <ChevronLeft size={28} strokeWidth={3} />
                    </button>

                    <div className="text-center mb-16 pt-8">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 mb-10 text-indigo-400 shadow-2xl relative">
                            <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20" />
                            {selectedPortal === 'admin' && <ShieldCheck className="relative z-10" size={44} />}
                            {selectedPortal === 'chef' && <ChefHat className="relative z-10" size={44} />}
                            {selectedPortal === 'cashier' && <Wallet className="relative z-10" size={44} />}
                        </div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-4">
                            {selectedPortal === 'admin' ? 'Managerial' :
                                selectedPortal === 'chef' ? 'Culinary' : 'Financial'} Node Login
                        </h1>
                        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] italic">
                            Authorized: {hotel?.name || 'Secure Portal'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-[0.3em] italic">Identity Mail</label>
                            <div className="relative group">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={24} />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="operator@system.com"
                                    className="w-full h-20 bg-slate-950/50 border border-white/10 rounded-2xl py-3.5 pl-16 pr-8 text-white placeholder:text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-lg"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-[0.3em] italic">Secure Passkey</label>
                            <div className="relative group">
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={24} />
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    className="w-full h-20 bg-slate-950/50 border border-white/10 rounded-2xl py-3.5 pl-16 pr-8 text-white placeholder:text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-lg"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-24 bg-white text-slate-900 font-black rounded-[2.5rem] shadow-3xl shadow-indigo-500/10 flex items-center justify-center gap-4 transition-all active:scale-95 text-[11px] uppercase tracking-[0.5em] group"
                        >
                            {loading ? (
                                <Loader2 className="w-8 h-8 animate-spin" />
                            ) : (
                                <>
                                    SYNC IDENTITY <ArrowRight className="group-hover:translate-x-2 transition-transform" size={24} strokeWidth={3} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
                
                <div className="mt-12 text-center">
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] opacity-40 italic">Identity Verification Required for Session Initialization</p>
                </div>
            </motion.div>
        </div>
    );
}
