'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import {
    DollarSign,
    TrendingUp,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Wallet
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';

export default function StaffFundsPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getDashboardStats();
            if (response.data.success) {
                setStats(response.data.analytics);
            }
        } catch (error) {
            toast.error('Failed to load fund logs');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white rounded-[2.5rem] border border-slate-200 animate-pulse" />)}
            </div>
        );
    }

    return (
        <div className="space-y-8 font-outfit pb-20 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white border border-slate-200 p-8 rounded-[3.5rem] shadow-sm flex flex-col sm:row justify-between items-center gap-6">
                <div className="flex items-center gap-5">
                    <div className="h-16 w-16 bg-slate-900 rounded-[1.75rem] flex items-center justify-center text-white shadow-xl shadow-slate-100">
                        <DollarSign size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-tight">Daily Fund collection</h1>
                        <p className="text-slate-500 text-sm font-medium italic">Monitoring daily revenue flow and settlement logs.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-500 text-white p-10 rounded-[3rem] shadow-xl shadow-emerald-200 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-20">
                        <TrendingUp size={100} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-emerald-100 font-bold uppercase tracking-widest text-sm mb-2">Today's Collection</p>
                        <h2 className="text-5xl font-black tracking-tighter mb-4">{formatCurrency(stats?.today?.revenue || 0)}</h2>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
                            <ArrowUpRight size={14} /> +12.5% vs Yesterday
                        </div>
                    </div>
                </motion.div>

                <div className="bg-white border border-slate-200 p-10 rounded-[3rem] shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                <Wallet size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Pending Settlements</h3>
                        </div>
                        <p className="text-4xl font-bold text-slate-900 tracking-tight mb-2">{stats?.today?.orders || 0}</p>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Active Transactions Today</p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 p-10 rounded-[3rem] shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                                <Calendar size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Month to Date</h3>
                        </div>
                        <p className="text-4xl font-bold text-slate-900 tracking-tight mb-2">{formatCurrency(stats?.sales?.totalRevenue || 0)}</p>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Cumulative Revenue</p>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Collection Logs</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Breakdown by sequential ordering</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Placeholder for detailed logs, normally we'd map orders here too, but just using sales DailyBreakdown if available or a simple list */}
                    {stats?.sales?.dailyBreakdown ? (
                        Object.entries(stats.sales.dailyBreakdown).slice(0, 5).map(([date, data]) => (
                            <div key={date} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <span className="font-bold text-slate-700">{new Date(date).toLocaleDateString()}</span>
                                <span className="font-black text-slate-900">{formatCurrency(data.revenue)}</span>
                            </div>
                        ))
                    ) : (
                        <div className="py-10 text-center text-slate-400 font-medium italic">No historical log data available</div>
                    )}
                </div>
            </div>
        </div>
    );
}
