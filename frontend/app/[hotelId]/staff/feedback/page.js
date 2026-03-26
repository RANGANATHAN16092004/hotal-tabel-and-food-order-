'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Star,
    MessageSquare,
    CheckCircle2,
    RefreshCcw,
    TrendingUp,
    Clock,
    User,
    ChevronRight,
    Zap,
    Quote
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function StaffFeedbackPage() {
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getFeedback();
            if (response.data.success) {
                setFeedback(response.data.feedback || []);
            }
        } catch (error) {
            console.error('Failed to fetch feedback');
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id) => {
        const loadingToast = toast.loading('Marking as resolved...');
        try {
            await adminAPI.resolveFeedback(id);
            toast.success('Feedback resolved', { id: loadingToast });
            fetchFeedback();
        } catch (error) {
            toast.error('Action failed', { id: loadingToast });
        }
    };

    const stats = {
        total: feedback.length,
        resolved: feedback.filter(f => f.status === 'resolved').length,
        pending: feedback.filter(f => f.status === 'pending').length,
        avgRating: feedback.length ? (feedback.reduce((acc, f) => acc + (f.rating || 0), 0) / feedback.length).toFixed(1) : '5.0'
    };

    return (
        <div className="space-y-10 font-outfit pb-20 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white border border-slate-200 p-8 rounded-[3.5rem] shadow-sm flex flex-col sm:row justify-between items-center gap-6">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-100">
                        <Star size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-tight">Sentiment Hub</h1>
                        <p className="text-slate-500 text-sm font-medium italic">Monitor and resolve guest feedback signals.</p>
                    </div>
                </div>
                <button
                    onClick={fetchFeedback}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                >
                    <RefreshCcw size={20} className={loading ? 'animate-spin text-amber-500' : ''} />
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Feedback', value: stats.total, icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Global Sat', value: stats.avgRating, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Attention Req', value: stats.pending, icon: Zap, color: 'text-rose-500', bg: 'bg-rose-50' }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm relative group"
                    >
                        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm", stat.bg, stat.color)}>
                            <stat.icon size={22} />
                        </div>
                        <p className="text-4xl font-bold text-slate-900 tracking-tighter mb-1">{stat.value}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Feedback Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <AnimatePresence mode='popLayout'>
                    {feedback.map((f, index) => (
                        <motion.div
                            key={f._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white border border-slate-200 rounded-[3.5rem] p-10 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/5 transition-all"
                        >
                            <Quote className="absolute -top-4 -right-4 w-32 h-32 text-slate-50 opacity-[0.03] rotate-12" />

                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-100 rotate-3">
                                        <User size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 tracking-tight uppercase">{f.customerName || 'Anonymous Guest'}</h3>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    size={12}
                                                    className={cn(star <= (f.rating || 0) ? "text-amber-400 fill-amber-400" : "text-slate-200")}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <span className={cn(
                                    "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                                    f.status === 'resolved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100 animate-pulse"
                                )}>
                                    {f.status}
                                </span>
                            </div>

                            <div className="bg-slate-50/50 rounded-[2rem] p-8 mb-8 border border-slate-100/50 relative z-10 italic text-slate-600 leading-relaxed min-h-[120px] flex flex-col justify-center">
                                <p className="text-lg font-medium">"{f.comment || 'No textual feedback provided.'}"</p>
                            </div>

                            <div className="flex items-center justify-between relative z-10 pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Clock size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">
                                        Received {new Date(f.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                {f.status === 'pending' && (
                                    <button
                                        onClick={() => handleResolve(f._id)}
                                        className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-xl shadow-slate-100"
                                    >
                                        Seal Issue <ChevronRight size={16} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {feedback.length === 0 && !loading && (
                <div className="py-32 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-[4rem] text-center shadow-sm">
                    <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8">
                        <MessageSquare size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tighter">Silence detected</h2>
                    <p className="text-slate-400 text-sm mt-2 uppercase tracking-widest font-bold">No guest sentiment signals received.</p>
                </div>
            )}
        </div>
    );
}
