'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminAPI } from '@/lib/api';
import {
    MessageSquare,
    Lightbulb,
    ThumbsUp,
    CheckCircle2,
    Clock,
    Search,
    User,
    Calendar,
    ChevronRight,
    Megaphone,
    ShieldAlert,
    X,
    MessageCircleMore
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function FeedbackPage() {
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);

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
            toast.error('Failed to load guest communication');
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id) => {
        const loadingToast = toast.loading('Syncing resolution...');
        try {
            await adminAPI.resolveFeedback(id);
            toast.success('Feedback resolved', { id: loadingToast });
            setSelectedItem(null);
            fetchFeedback();
        } catch (error) {
            toast.error('Operation failed', { id: loadingToast });
        }
    };

    const getTypeDetails = (type) => {
        switch (type) {
            case 'complaint':
                return {
                    label: 'Complaint',
                    icon: ShieldAlert,
                    color: 'text-rose-600 bg-rose-50 border-rose-100'
                };
            case 'suggestion':
                return {
                    label: 'Suggestion',
                    icon: Lightbulb,
                    color: 'text-blue-600 bg-blue-50 border-blue-100'
                };
            case 'compliment':
                return {
                    label: 'Compliment',
                    icon: ThumbsUp,
                    color: 'text-emerald-600 bg-emerald-50 border-emerald-100'
                };
            default:
                return {
                    label: 'General',
                    icon: MessageSquare,
                    color: 'text-slate-600 bg-slate-50 border-slate-100'
                };
        }
    };

    const filteredFeedback = feedback.filter(item => {
        const matchesType = filterType === 'all' || item.type === filterType;
        const matchesSearch = (item.customerId?.name || 'Anonymous').toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.message.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    const stats = {
        total: feedback.length,
        unresolved: feedback.filter(f => !f.isResolved).length,
        complaints: feedback.filter(f => f.type === 'complaint').length
    };

    if (loading && feedback.length === 0) {
        return (
            <AdminLayout>
                <div className="space-y-8 max-w-6xl mx-auto">
                    <div className="h-40 bg-white rounded-[3rem] border border-slate-200 animate-pulse" />
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white rounded-3xl border border-slate-200 animate-pulse" />)}
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8 max-w-6xl mx-auto font-outfit px-4 sm:px-0 pb-20">
                {/* Header & Metrics */}
                <div className="bg-white border border-slate-200 p-8 rounded-[3.5rem] shadow-sm flex flex-col lg:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-5">
                        <div className="h-16 w-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-100">
                            <Megaphone size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Advocacy Feed</h1>
                            <p className="text-slate-500 text-sm font-medium italic">Manage direct guest feedback and suggestions.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
                        <div className="px-8 py-5 bg-slate-50 rounded-[2rem] border border-slate-100 text-center min-w-[150px]">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Open Signals</p>
                            <p className="text-3xl font-bold text-slate-900">{stats.unresolved}</p>
                        </div>
                        <div className="px-8 py-5 bg-rose-50 rounded-[2rem] border border-rose-100 text-center min-w-[150px]">
                            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Alerts</p>
                            <p className="text-3xl font-bold text-rose-600">{stats.complaints}</p>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Find messages by keyword or guest..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none font-medium"
                        />
                    </div>
                    <div className="bg-white border border-slate-200 p-1.5 rounded-[1.5rem] flex gap-1 overflow-x-auto no-scrollbar">
                        {['all', 'complaint', 'suggestion', 'compliment'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={cn(
                                    "px-6 py-3 rounded-[1.25rem] text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                                    filterType === type ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-900"
                                )}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div className="space-y-4">
                    <AnimatePresence>
                        {filteredFeedback.map((item, index) => {
                            const details = getTypeDetails(item.type);
                            return (
                                <motion.div
                                    key={item._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={cn(
                                        "bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden cursor-pointer shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group",
                                        !item.isResolved && "border-l-4 border-l-slate-900"
                                    )}
                                    onClick={() => setSelectedItem(item)}
                                >
                                    <div className="flex flex-col md:flex-row items-center p-8 gap-8">
                                        <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                            <details.icon size={28} className={details.color.split(' ')[0]} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-4 mb-2">
                                                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight truncate max-w-[240px]">
                                                    {item.customerId?.name || 'Guest User'}
                                                </h3>
                                                <span className={cn("px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border", details.color)}>
                                                    {item.type}
                                                </span>
                                            </div>
                                            <p className="text-slate-500 text-sm font-medium italic truncate pr-10">"{item.message}"</p>
                                        </div>

                                        <div className="flex items-center gap-10 shrink-0">
                                            <div className="text-right">
                                                <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                                    <Calendar size={12} /> {new Date(item.createdAt).toLocaleDateString()}
                                                </div>
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                                                    item.isResolved ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                                                )}>
                                                    {item.isResolved ? 'Resolved' : 'Pending'}
                                                </div>
                                            </div>
                                            <ChevronRight className="text-slate-200 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {filteredFeedback.length === 0 && (
                    <div className="py-32 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-[4rem] text-center">
                        <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8">
                            <MessageCircleMore size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tighter">Quiet Channel</h2>
                        <p className="text-slate-400 text-sm mt-2 uppercase tracking-widest font-bold">No guest messages matching these scopes</p>
                    </div>
                )}

                {/* Modal */}
                <AnimatePresence>
                    {selectedItem && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedItem(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="relative bg-white rounded-[4rem] w-full max-w-xl shadow-2xl p-12 font-outfit overflow-hidden">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="flex items-center gap-6">
                                        <div className="h-20 w-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-slate-100">
                                            <User size={36} />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight leading-none mb-3">
                                                {selectedItem.customerId?.name || 'Guest'}
                                            </h2>
                                            <div className="flex items-center gap-3">
                                                <span className={cn("px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border", getTypeDetails(selectedItem.type).color)}>
                                                    {selectedItem.type}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                                    <Clock size={12} /> {new Date(selectedItem.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedItem(null)} className="p-3 hover:bg-slate-50 rounded-full transition-colors"><X size={24} /></button>
                                </div>

                                <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 italic text-lg text-slate-700 mb-12 leading-relaxed font-medium">
                                    "{selectedItem.message}"
                                </div>

                                {!selectedItem.isResolved ? (
                                    <div className="flex gap-4">
                                        <button onClick={() => setSelectedItem(null)} className="flex-1 py-5 font-bold text-slate-400 uppercase tracking-widest text-[11px] hover:bg-slate-50 rounded-2xl transition-colors">Keep Open</button>
                                        <button
                                            onClick={() => handleResolve(selectedItem._id)}
                                            className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
                                        >
                                            <CheckCircle2 size={18} /> Mark Resolved
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 bg-emerald-50 rounded-[3rem] border border-emerald-100 text-emerald-600">
                                        <CheckCircle2 size={48} className="mb-4" />
                                        <p className="font-bold uppercase tracking-widest text-xs">Successfully Reconciled</p>
                                        <p className="text-[10px] font-bold mt-1 opacity-70">This record has been officially consolidated.</p>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </AdminLayout>
    );
}

