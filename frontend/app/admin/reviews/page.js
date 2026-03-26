'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminAPI } from '@/lib/api';
import {
    Star,
    MessageSquare,
    Quote,
    Reply,
    Calendar,
    CheckCircle2,
    X,
    Filter,
    ArrowUpRight,
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function ReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showReplyModal, setShowReplyModal] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [filterRating, setFilterRating] = useState('all');

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getReviews();
            if (response.data.success) {
                setReviews(response.data.reviews);
            }
        } catch (error) {
            toast.error('Failed to load guest feedback');
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        const loadingToast = toast.loading('Syncing response...');
        try {
            await adminAPI.respondToReview(showReplyModal._id, replyText.trim());
            toast.success('Response shared', { id: loadingToast });
            setShowReplyModal(null);
            setReplyText('');
            fetchReviews();
        } catch (err) {
            toast.error('Operation failed', { id: loadingToast });
        }
    };

    const renderStars = (rating) => {
        return (
            <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        size={16}
                        className={cn(
                            i < rating ? "text-amber-400 fill-amber-400" : "text-slate-100 fill-slate-100"
                        )}
                    />
                ))}
            </div>
        );
    };

    const stats = {
        total: reviews.length,
        avg: reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0',
        pending: reviews.filter(r => !r.response).length
    };

    const filteredReviews = reviews.filter(r => filterRating === 'all' || r.rating.toString() === filterRating);

    if (loading && reviews.length === 0) {
        return (
            <AdminLayout>
                <div className="space-y-8 max-w-5xl mx-auto">
                    <div className="h-48 bg-white rounded-[3rem] border border-slate-200 animate-pulse" />
                    <div className="space-y-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white rounded-[3rem] border border-slate-200 animate-pulse" />)}
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8 max-w-5xl mx-auto font-outfit px-4 sm:px-0 pb-20">
                {/* Header & Stats */}
                <div className="bg-white border border-slate-200 p-8 rounded-[3.5rem] shadow-sm flex flex-col sm:row justify-between items-center gap-8">
                    <div className="flex items-center gap-5">
                        <div className="h-16 w-16 bg-amber-400 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-amber-100">
                            <Star size={32} fill="currentColor" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Guest Reviews</h1>
                            <p className="text-slate-500 text-sm font-medium italic">Monitor and engage with customer sentiment.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="px-8 py-4 bg-slate-50 rounded-[2rem] border border-slate-100 text-center min-w-[140px]">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Global Avg</p>
                            <p className="text-3xl font-bold text-slate-900">{stats.avg}<span className="text-slate-300 text-xl font-medium ml-1">/5</span></p>
                        </div>
                        <div className="px-8 py-4 bg-slate-900 rounded-[2rem] text-center min-w-[140px] shadow-xl shadow-slate-200">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unresponded</p>
                            <p className="text-3xl font-bold text-white">{stats.pending}</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 p-2 bg-white border border-slate-200 rounded-[2rem] w-full sm:w-fit">
                    <div className="px-6 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-r border-slate-100">
                        <Filter size={14} /> Scopes
                    </div>
                    {['all', '5', '4', '3', '2', '1'].map((score) => (
                        <button
                            key={score}
                            onClick={() => setFilterRating(score)}
                            className={cn(
                                "px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all",
                                filterRating === score
                                    ? "bg-slate-900 text-white shadow-lg"
                                    : "text-slate-400 hover:text-slate-900"
                            )}
                        >
                            {score === 'all' ? 'Everything' : `${score} Stars`}
                        </button>
                    ))}
                </div>

                {/* Reviews List */}
                <div className="space-y-8">
                    <AnimatePresence>
                        {filteredReviews.map((review, index) => (
                            <motion.div
                                key={review._id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden flex flex-col sm:flex-row group transition-all hover:shadow-xl hover:shadow-indigo-500/5"
                            >
                                <div className="sm:w-72 p-10 bg-slate-50/50 border-b sm:border-b-0 sm:border-r border-slate-100">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="h-14 w-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 font-bold text-2xl shadow-sm">
                                            {review.customerId?.name?.charAt(0) || 'G'}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 uppercase tracking-tight truncate max-w-[120px]">{review.customerId?.name || 'Guest'}</h3>
                                            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Verified</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 text-slate-400">
                                            <Calendar size={14} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Rating Score</p>
                                            {renderStars(review.rating)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 p-10 relative">
                                    <Quote size={40} className="absolute top-10 right-10 text-slate-50 opacity-50" />

                                    <div className="min-h-[100px] mb-10">
                                        <p className="text-slate-700 italic leading-relaxed text-lg font-medium pr-10">
                                            "{review.comment}"
                                        </p>
                                    </div>

                                    {review.response ? (
                                        <div className="bg-indigo-50/30 p-8 rounded-[2.5rem] border border-indigo-100/50 relative">
                                            <div className="absolute -top-3 left-8 px-4 py-1.5 bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-indigo-100">
                                                Official Rebuttal
                                            </div>
                                            <p className="text-sm text-indigo-900 font-medium leading-relaxed">
                                                {review.response}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => {
                                                    setShowReplyModal(review);
                                                    setReplyText('');
                                                }}
                                                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center gap-3"
                                            >
                                                <Reply size={16} /> Draft Response
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredReviews.length === 0 && (
                    <div className="py-32 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-[4rem] text-center">
                        <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8">
                            <Star size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tighter">No Feedback Found</h2>
                        <p className="text-slate-400 text-sm mt-2 uppercase tracking-widest font-bold">Try adjusting your star filters</p>
                    </div>
                )}

                {/* Reply Modal */}
                <AnimatePresence>
                    {showReplyModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReplyModal(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-[4rem] w-full max-w-xl shadow-2xl p-12 font-outfit">
                                <div className="flex justify-between items-center mb-10">
                                    <div>
                                        <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">Draft Response</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Responding to {showReplyModal.customerId?.name || 'Guest'}</p>
                                    </div>
                                    <button onClick={() => setShowReplyModal(null)} className="p-3 hover:bg-slate-50 rounded-full transition-colors"><X size={24} /></button>
                                </div>

                                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 italic text-sm text-slate-500 mb-10 leading-relaxed font-medium">
                                    "{showReplyModal.comment}"
                                </div>

                                <form onSubmit={handleRespond} className="space-y-10">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 ml-2">Official Message</label>
                                        <textarea
                                            required
                                            rows={5}
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none text-sm font-medium leading-relaxed resize-none"
                                            placeholder="Dear guest, thank you for your feedback..."
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <button type="button" onClick={() => setShowReplyModal(null)} className="flex-1 py-5 font-bold text-slate-400 uppercase tracking-widest text-[11px] hover:bg-slate-50 rounded-2xl transition-colors">Abort</button>
                                        <button type="submit" className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95 transition-all">
                                            Publish Response <ArrowUpRight size={18} />
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </AdminLayout>
    );
}
