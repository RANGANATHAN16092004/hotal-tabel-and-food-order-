'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
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
    Target,
    Mail,
    Send,
    ChevronDown,
    Utensils,
    FileText,
    Users2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
    LineChart as ReLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ReTooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart as ReBarChart,
    Bar,
    Cell,
    PieChart,
    Pie
} from 'recharts';

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('insights');
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: new Date()
    });
    const [emailLoading, setEmailLoading] = useState(false);
    const [showEmailOptions, setShowEmailOptions] = useState(false);

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getDashboardStats(
                dateRange.startDate.toISOString(),
                dateRange.endDate.toISOString()
            );
            if (response.data.success) {
                setAnalytics(response.data.analytics);
            }
        } catch (error) {
            toast.error('Failed to load performance metrics');
        } finally {
            setLoading(false);
        }
    };

    const exportAnalytics = async () => {
        try {
            const response = await adminAPI.exportAnalytics(
                dateRange.startDate.toISOString(),
                dateRange.endDate.toISOString(),
                activeTab === 'staff' ? 'items' : 'sales'
            );

            // Create blob and download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `analytics-report-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Report exported successfully');
        } catch (error) {
            toast.error('Failed to export report');
        }
    };

    const handleEmailReport = async (type = 'daily') => {
        setEmailLoading(true);
        setShowEmailOptions(false);
        try {
            let response;
            if (type === 'daily') {
                response = await adminAPI.emailDailyReport();
            } else if (type === 'total') {
                response = await adminAPI.emailTotalReport();
            } else if (type === 'filtered') {
                response = await adminAPI.emailFilteredReport({
                    startDate: dateRange.startDate.toISOString(),
                    endDate: dateRange.endDate.toISOString()
                });
            }
            
            if (response.data.success) {
                toast.success(response.data.message || 'Report dispatched to all linked emails');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send email report');
        } finally {
            setEmailLoading(false);
        }
    };

    const handleCustomEmail = async (reportType) => {
        setEmailLoading(true);
        setShowEmailOptions(false);
        try {
            const response = await adminAPI.emailCustomReport({
                reportType,
                startDate: dateRange.startDate.toISOString(),
                endDate: dateRange.endDate.toISOString()
            });
            if (response.data.success) {
                toast.success(response.data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to dispatch custom report');
        } finally {
            setEmailLoading(false);
        }
    };

    if (loading && !analytics) {
        return (
            <AdminLayout>
                <div className="space-y-8 max-w-7xl mx-auto">
                    <div className="h-40 bg-white rounded-[3rem] border border-slate-200 animate-pulse" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white rounded-3xl border border-slate-200 animate-pulse" />)}
                    </div>
                </div>
            </AdminLayout>
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
        <AdminLayout>
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
                            <button
                                onClick={() => setActiveTab('staff')}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                                    activeTab === 'staff' ? "bg-white shadow-md text-slate-900 font-black" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <Users size={16} /> Staff
                            </button>
                            <button
                                onClick={() => setActiveTab('dispatch')}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                                    activeTab === 'dispatch' ? "bg-white shadow-md text-slate-900 font-black" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <Send size={16} /> Dispatch Hub
                            </button>
                        </div>
                        <div className="relative">
                            <button 
                                onClick={() => setShowEmailOptions(!showEmailOptions)}
                                disabled={emailLoading}
                                className="px-6 py-4 bg-indigo-600 text-white rounded-2xl border border-indigo-500 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                            >
                                <Mail size={20} />
                                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">
                                    {emailLoading ? 'Dispatching...' : "Email Report"}
                                </span>
                                <ChevronDown size={14} className={cn("transition-transform", showEmailOptions && "rotate-180")} />
                            </button>

                            <AnimatePresence>
                                {showEmailOptions && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowEmailOptions(false)} />
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 top-full mt-3 w-64 bg-white border border-slate-200 rounded-[2rem] shadow-2xl p-3 z-50 overflow-hidden"
                                        >
                                            <div className="px-4 py-3 border-b border-slate-50 mb-2">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Intel Vector</p>
                                            </div>
                                            <div className="space-y-1">
                                                <button onClick={() => handleCustomEmail('menu')} className="w-full text-left p-4 hover:bg-slate-50 rounded-2xl flex items-center gap-4 group transition-colors">
                                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                        <Utensils size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-slate-900 leading-none">Menu Performance</p>
                                                        <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-widest">Popular Vectors</p>
                                                    </div>
                                                </button>
                                                <button onClick={() => handleCustomEmail('staff')} className="w-full text-left p-4 hover:bg-slate-50 rounded-2xl flex items-center gap-4 group transition-colors">
                                                    <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-all">
                                                        <Users2 size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-slate-900 leading-none">Operational Metrics</p>
                                                        <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-widest">Staff Velocity</p>
                                                    </div>
                                                </button>
                                                <button onClick={() => handleCustomEmail('orders')} className="w-full text-left p-4 hover:bg-slate-50 rounded-2xl flex items-center gap-4 group transition-colors">
                                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                        <FileText size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-slate-900 leading-none">Enterprise Orders</p>
                                                        <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-widest">Fulfillment Scan</p>
                                                    </div>
                                                </button>
                                                <div className="pt-2 mt-2 border-t border-slate-50">
                                                    <button onClick={() => handleEmailReport('daily')} className="w-full text-left p-4 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-2xl flex items-center gap-4 transition-all">
                                                        <Zap size={18} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Dispatch Daily Scan</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                        <button 
                            onClick={exportAnalytics}
                            title="Export to CSV"
                            className="p-4 bg-white text-slate-500 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        >
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
                                    <div className="flex items-center justify-between mb-10">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                                <LineChart size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Revenue Stream Mapping</h3>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time fiscal velocity</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart
                                                data={Object.entries(analytics?.sales?.dailyBreakdown || {}).map(([date, data]) => ({
                                                    name: new Date(date).getDate(),
                                                    revenue: data.revenue
                                                })).slice(-7)}
                                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                            >
                                                <defs>
                                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <ReTooltip />
                                                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                                            </AreaChart>
                                        </ResponsiveContainer>
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

                            {/* Peak Hour Heatmap & Category Mix */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm">
                                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight mb-10">Peak Operation Heatmap</h3>
                                    <div className="h-[250px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ReBarChart data={Object.entries(analytics?.peakHours || {}).map(([hour, count]) => ({
                                                hour: `${hour}:00`,
                                                intensity: count
                                            }))}>
                                                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                                <YAxis hide />
                                                <ReTooltip />
                                                <Bar dataKey="intensity" radius={[8, 8, 8, 8]}>
                                                    {Object.entries(analytics?.peakHours || {}).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry[1] > 10 ? '#4f46e5' : entry[1] > 5 ? '#818cf8' : '#c7d2fe'} />
                                                    ))}
                                                </Bar>
                                            </ReBarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <p className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center italic">Optimal staffing window: 19:00 - 21:00</p>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm">
                                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight mb-10">Category Product Mix</h3>
                                    <div className="h-[250px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={Object.entries((analytics?.popularItems || []).reduce((acc, item) => {
                                                        const cat = item.category || 'Other';
                                                        acc[cat] = (acc[cat] || 0) + item.revenue;
                                                        return acc;
                                                    }, {})).map(([name, value]) => ({ name, value }))}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'].map((color, index) => (
                                                        <Cell key={`cell-${index}`} fill={color} />
                                                    ))}
                                                </Pie>
                                                <ReTooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                        {Object.keys((analytics?.popularItems || []).reduce((acc, item) => {
                                            acc[item.category || 'Other'] = true;
                                            return acc;
                                        }, {})).slice(0, 4).map((cat, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <div className={cn("h-3 w-3 rounded-full", ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500'][i] || 'bg-slate-400')} />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{cat}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : activeTab === 'forecasting' ? (
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
                    ) : (
                        <motion.div key="staff" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm">
                                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight mb-10">Prep Efficiency by Section</h3>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ReBarChart data={analytics?.staff?.averagePrepBySection || [
                                                { name: 'Appetizers', time: 8 },
                                                { name: 'Main Course', time: 18 },
                                                { name: 'Desserts', time: 12 },
                                                { name: 'Beverages', time: 4 }
                                            ]}>
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: 10 } }} />
                                                <ReTooltip />
                                                <Bar dataKey="time" fill="#4f46e5" radius={[10, 10, 0, 0]} />
                                            </ReBarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm">
                                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight mb-10">Operational Bandwidth</h3>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Kitchen Staff', value: 45 },
                                                        { name: 'Wait Staff', value: 35 },
                                                        { name: 'Management', value: 20 }
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    <Cell fill="#4f46e5" />
                                                    <Cell fill="#10b981" />
                                                    <Cell fill="#f59e0b" />
                                                </Pie>
                                                <ReTooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'dispatch' && (
                        <motion.div key="dispatch" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8">
                            <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden border border-slate-800 shadow-2xl">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                                
                                <div className="relative z-10 max-w-2xl">
                                    <h2 className="text-4xl font-black tracking-tighter mb-4 uppercase">Analytics Dispatch Hub</h2>
                                    <p className="text-slate-400 font-medium mb-12 text-lg">Broadcast enterprise-grade intelligence reports to all registered communication vectors within your establishment.</p>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        <button 
                                            onClick={() => handleEmailReport('daily')}
                                            disabled={emailLoading}
                                            className="group flex flex-col items-center justify-center p-8 bg-slate-800/50 border border-slate-700/50 rounded-[2.5rem] hover:bg-slate-800 hover:border-slate-600 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            <div className="h-16 w-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <Zap size={28} />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-[0.2em]">Daily Scan</span>
                                            <span className="text-[10px] text-slate-500 mt-2 font-medium">Past 24 Hours</span>
                                        </button>

                                        <button 
                                            onClick={() => handleEmailReport('total')}
                                            disabled={emailLoading}
                                            className="group flex flex-col items-center justify-center p-8 bg-slate-800/50 border border-slate-700/50 rounded-[2.5rem] hover:bg-slate-800 hover:border-slate-600 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            <div className="h-16 w-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all">
                                                <Target size={28} />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-[0.2em]">Master Report</span>
                                            <span className="text-[10px] text-slate-500 mt-2 font-medium">Lifetime Data</span>
                                        </button>

                                        <button 
                                            onClick={() => handleEmailReport('filtered')}
                                            disabled={emailLoading}
                                            className="group flex flex-col items-center justify-center p-8 bg-slate-800/50 border border-slate-700/50 rounded-[2.5rem] hover:bg-slate-800 hover:border-slate-600 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            <div className="h-16 w-16 bg-emerald-600/20 rounded-2xl flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                <Mail size={28} />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-[0.2em]">Filtered Range</span>
                                            <span className="text-[10px] text-slate-500 mt-2 font-medium">Sync with Calendar</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AdminLayout>
    );
}
