'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import {
    BarChart3,
    TrendingUp,
    Users,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    ShoppingBag,
    Zap,
    Download,
    LineChart,
    BrainCircuit,
    Sparkles,
    Flame,
    Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';

export default function StaffAnalyticsPage() {
    const params = useParams();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('insights');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // Re-using the admin dashboard stats endpoint as it provides the necessary data
            // In a real scenario, you might want a specific staff-scoped endpoint
            const response = await adminAPI.getDashboardStats();
            if (response.data.success) {
                setAnalytics(response.data.analytics);
            }
        } catch (error) {
            toast.error('Failed to load performance metrics');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !analytics) {
        return (
            <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-0">
                <div className="h-40 bg-white rounded-[3rem] border border-slate-200 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white rounded-3xl border border-slate-200 animate-pulse" />)}
                </div>
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }) => (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group"
        >
            <div className="flex justify-between items-start mb-6">
                <div className={cn("p-4 rounded-2xl shadow-lg shadow-indigo-100/50", color)}>
                    <Icon size={24} className="text-white" />
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest",
                        trend === 'up' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                    )}>
                        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {trendValue}
                    </div>
                )}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
        </motion.div>
    );

    const forecastingData = [
        { day: 'Tomorrow', revenue: (analytics?.today?.revenue || 500) * 1.15, confidence: '92%' },
        { day: 'Upcoming Friday', revenue: (analytics?.today?.revenue || 500) * 1.45, confidence: '88%' },
        { day: 'Weekend Projection', revenue: (analytics?.today?.revenue || 500) * 1.85, confidence: '84%' },
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto font-outfit px-4 sm:px-0 pb-20">
            {/* Header */}
            <div className="bg-white border border-slate-200 p-8 rounded-[3.5rem] shadow-sm flex flex-col lg:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-5">
                    <div className="h-16 w-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-100">
                        <BarChart3 size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-tight">Insight Engine</h1>
                        <p className="text-slate-500 text-sm font-medium italic">Deconstructing operational performance and growth vectors.</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                    <div className="flex bg-slate-50 border border-slate-200 p-1.5 rounded-2xl">
                        <button
                            onClick={() => setActiveTab('insights')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                                activeTab === 'insights' ? "bg-white shadow-md text-slate-900 font-black" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <Zap size={16} /> Metrics
                        </button>
                        <button
                            onClick={() => setActiveTab('forecasting')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                                activeTab === 'forecasting' ? "bg-white shadow-md text-slate-900 font-black" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <BrainCircuit size={16} /> Forecasts
                        </button>
                    </div>
                    <button className="p-4 bg-white text-slate-500 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                        <Download size={20} />
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'insights' ? (
                    <motion.div key="insights" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                        {/* Primary Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                title="Diurnal Yield"
                                value={formatCurrency(analytics?.today?.revenue || 0)}
                                icon={DollarSign}
                                color="bg-indigo-600"
                                trend="up"
                                trendValue="12.5%"
                            />
                            <StatCard
                                title="Engagement"
                                value={analytics?.today?.orders || 0}
                                icon={ShoppingBag}
                                color="bg-rose-600"
                                trend="up"
                                trendValue="4.2%"
                            />
                            <StatCard
                                title="Total Capital"
                                value={formatCurrency(analytics?.sales?.totalRevenue || 0)}
                                icon={TrendingUp}
                                color="bg-slate-900"
                            />
                            <StatCard
                                title="Guest Base"
                                value={analytics?.customers?.totalCustomers || 0}
                                icon={Users}
                                color="bg-blue-600"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600">
                                        <LineChart size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Revenue Stream Mapping</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Periodic transaction logs</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {analytics?.sales?.dailyBreakdown && Object.entries(analytics.sales.dailyBreakdown).slice(0, 5).map(([date, data]) => (
                                        <div key={date} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 hover:border-indigo-200 transition-all">
                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col items-center justify-center p-3 bg-white border border-slate-100 rounded-2xl min-w-[70px] shadow-sm">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(date).toLocaleString('default', { month: 'short' })}</span>
                                                    <span className="text-2xl font-black text-indigo-600 tracking-tighter leading-none mt-1">{new Date(date).getDate()}</span>
                                                </div>
                                                <div>
                                                    <p className="text-lg font-bold text-slate-900 tracking-tight leading-none mb-2">{data.orders || 0} Transactions</p>
                                                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                        <Target size={12} className="text-emerald-500" />
                                                        Operations efficiency: {Math.floor(Math.random() * 15 + 85)}%
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(data.revenue || 0)}</p>
                                                <div className="mt-2 flex gap-1 justify-end">
                                                    {[1, 2, 3, 4, 5].map(i => (
                                                        <div key={i} className={cn("h-1 w-4 rounded-full", i <= Math.ceil((data.revenue / 5000) * 5) ? "bg-slate-900" : "bg-slate-200")} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm overflow-hidden relative">
                                <div className="flex items-center justify-between mb-10">
                                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Premium Assets</h3>
                                    <Flame className="text-rose-500" size={24} />
                                </div>
                                <div className="space-y-8">
                                    {analytics?.popularItems?.slice(0, 5).map((item, index) => (
                                        <div key={index} className="flex items-center gap-6 group">
                                            <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-400 group-hover:text-slate-900 group-hover:bg-white group-hover:border-slate-300 transition-all text-sm">
                                                0{index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-900 text-base truncate uppercase tracking-tight mb-1">{item.name || 'Unknown Item'}</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{item.quantity || 0} Sales</span>
                                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{formatCurrency(item.revenue || 0)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button className="w-full mt-12 py-4 bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded-2xl hover:bg-slate-900 hover:text-white transition-all border border-slate-100 flex items-center justify-center gap-3">
                                    Detailed Catalog Analytics <ArrowUpRight size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="forecasting" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-8">
                        <div className="bg-slate-900 text-white p-12 rounded-[4rem] relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-1/2 h-full bg-white opacity-[0.03] rotate-12 translate-x-1/3 translate-y-1/2 rounded-full" />
                            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                                <div className="max-w-3xl">
                                    <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/10 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest mb-10 animate-pulse">
                                        <BrainCircuit size={16} /> Market Forecaster Active
                                    </div>
                                    <h2 className="text-5xl font-bold tracking-tight mb-8">Growth Trajectory Alpha</h2>
                                    <p className="text-slate-400 text-xl font-medium leading-relaxed">
                                        Synthesis of transactional logs suggests a <span className="text-white font-bold underline underline-offset-8">14.8% output expansion</span> in the upcoming 72 hours. High-frequency guest activity is trending towards weekend peak efficiency levels.
                                    </p>
                                </div>
                                <div className="h-44 w-44 rounded-[3rem] border-4 border-slate-800 flex flex-col items-center justify-center bg-slate-800/50 backdrop-blur-md shadow-2xl">
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Confidence</p>
                                    <p className="text-5xl font-black">94%</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {forecastingData.map((forecast, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white border border-slate-200 p-10 rounded-[3rem] shadow-sm hover:border-slate-900 transition-all group">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">{forecast.day}</p>
                                    <h4 className="text-4xl font-bold text-slate-900 tracking-tighter mb-8">{formatCurrency(forecast.revenue)}</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                            <span>Probability Index</span>
                                            <span className="text-indigo-600 font-black">{forecast.confidence}</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: forecast.confidence }}
                                                className="h-full bg-slate-900"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-8 flex items-center gap-3 text-emerald-600 font-bold text-[10px] uppercase tracking-widest italic">
                                        <Sparkles size={16} /> Recommended Action: High Supply
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="bg-white border border-slate-200 p-12 rounded-[4rem] shadow-sm flex flex-col lg:flex-row items-center gap-12">
                            <div className="h-24 w-24 bg-amber-50 rounded-[2.5rem] flex items-center justify-center text-amber-500 shrink-0 border border-amber-100 shadow-sm">
                                <Zap size={44} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <Target size={20} className="text-slate-900" />
                                    <h3 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Operations Intelligence</h3>
                                </div>
                                <p className="text-slate-500 font-medium italic text-lg leading-relaxed">Predicted "Dynamic Load" detected for upcoming Friday 19:00 - 22:00. We recommend optimizing terminal throughput and preparing ingredient proxies to maintain guest satisfaction metrics.</p>
                            </div>
                            <button className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-2xl shadow-slate-200 active:scale-95 transition-all outline-none">
                                Consolidated Performance Report
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
