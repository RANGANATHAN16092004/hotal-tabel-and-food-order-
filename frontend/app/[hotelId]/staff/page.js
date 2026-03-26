'use client';

import { useEffect, useState } from 'react';
import { staffAuth } from '@/lib/staffAuth';
import { motion } from 'framer-motion';
import {
    UtensilsCrossed,
    Clock,
    AlertCircle,
    TrendingUp,
    Users,
    Calendar,
    Star,
    LayoutDashboard,
    Zap,
    ChevronRight,
    ArrowUpRight
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function StaffDashboard() {
    const { hotelId } = useParams();
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({
        activeOrders: 0,
        lowStockItems: 0,
        averageRating: 4.8,
        staffCount: 0
    });

    useEffect(() => {
        const staff = staffAuth.getStaff();
        setProfile(staff);
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [ordersRes, inventoryRes, staffRes, reviewsRes] = await Promise.all([
                adminAPI.getOrders({ status: 'pending' }),
                adminAPI.getInventory(),
                adminAPI.getStaff(),
                adminAPI.getReviews()
            ]);

            const reviews = reviewsRes.data.reviews || [];
            const avgRating = reviews.length > 0
                ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                : 4.8;

            setStats({
                activeOrders: ordersRes.data.count || 0,
                lowStockItems: inventoryRes.data.inventory?.filter(i => i.stockQuantity <= i.lowStockThreshold).length || 0,
                averageRating: avgRating,
                staffCount: staffRes.data.staff?.length || 0
            });
        } catch (error) {
            console.error('Stats fetch failed');
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, bg }) => (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm relative group overflow-hidden"
        >
            <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform", bg, color)}>
                <Icon size={24} />
            </div>
            <p className="text-4xl font-bold text-slate-900 mb-1 tracking-tighter">{value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        </motion.div>
    );

    return (
        <div className="space-y-10 font-outfit pb-20 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white border border-slate-200 p-10 rounded-[3.5rem] shadow-sm flex flex-col sm:row justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-100">
                        <Users size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                            {profile?.role === 'admin' ? 'System Administration' :
                                profile?.role === 'manager' ? 'Operations Command' :
                                    profile?.role === 'waiter' ? 'Service Dashboard' : 'Personnel Hub'}
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium italic">Welcome back, {profile?.name || 'Authorized Member'}. Your shift is active.</p>
                    </div>
                </div>
                <div className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                    <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-lg" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 italic">
                        <Zap size={12} className="text-amber-500 fill-amber-500" /> Platform Sync Online
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Live Orders"
                    value={stats.activeOrders}
                    icon={UtensilsCrossed}
                    bg="bg-blue-50"
                    color="text-blue-600"
                />
                <StatCard
                    title="Stock Alerts"
                    value={stats.lowStockItems}
                    icon={AlertCircle}
                    bg="bg-rose-50"
                    color="text-rose-600"
                />
                <StatCard
                    title="Service Score"
                    value={stats.averageRating}
                    icon={Star}
                    bg="bg-amber-50"
                    color="text-amber-500"
                />
                <StatCard
                    title="Shift Team"
                    value={stats.staffCount}
                    icon={Users}
                    bg="bg-indigo-50"
                    color="text-indigo-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Logs */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm">
                    <div className="flex items-center justify-between mb-10 px-2">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">System Logs</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time engagement activity</p>
                            </div>
                        </div>
                        <button className="p-3 hover:bg-slate-50 rounded-full transition-colors"><ChevronRight size={20} className="text-slate-300" /></button>
                    </div>

                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-6 p-6 rounded-[2rem] bg-slate-50/50 border border-slate-100 group hover:border-indigo-200 transition-all">
                                <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform shadow-sm">
                                    <Zap size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-900">Platform session synchronized</p>
                                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-1">Status: Stable • {i * 2} minutes ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Status Card */}
                <div className="bg-slate-900 rounded-[3rem] p-10 lg:p-12 relative overflow-hidden shadow-2xl flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-white opacity-[0.03] blur-[100px] rounded-full translate-x-1/2" />

                    <div className="relative z-10">
                        <h3 className="text-2xl font-bold text-white mb-8 tracking-tight uppercase">Duty Record</h3>
                        <div className="space-y-8">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-white/5 rounded-2xl text-slate-400 border border-white/5">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Shift Bound</p>
                                    <p className="text-xl font-bold text-white">23:00 (In 4h)</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-white/5 rounded-2xl text-slate-400 border border-white/5">
                                    <TrendingUp size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Uplink Status</p>
                                    <p className="text-xl font-bold text-emerald-400">Authenticated</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-12 bg-white/5 p-6 rounded-[2rem] border border-white/5">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic mb-2">Notice</p>
                        <p className="text-xs text-white/70 leading-relaxed font-medium">Ensure all terminal logs are closed before end-of-day synchronization.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
