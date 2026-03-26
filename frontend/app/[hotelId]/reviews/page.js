'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { customerAPI } from '@/lib/api';
import { customerAuth } from '@/lib/auth';
import {
    Star,
    MessageSquare,
    Send,
    User,
    Calendar,
    Quote,
    ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function CustomerReviewsPage() {
    const params = useParams();
    const router = useRouter();
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState({ rating: 0, comment: '' }); // Start with 0 stars
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [hoveredStar, setHoveredStar] = useState(0);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const response = await customerAPI.getReviews(params.hotelId);
            if (response.data.success) {
                setReviews(response.data.reviews || []);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newReview.rating === 0) return toast.error('Please select a star rating');
        setSubmitting(true);
        const loadingToast = toast.loading('Posting your review...');

        try {
            const customer = customerAuth.getCustomer();
            if (!customer) {
                toast.dismiss(loadingToast);
                router.push(`/${params.hotelId}/login`);
                return;
            }

            // Get the latest order for this customer to use as orderId
            const ordersResponse = await customerAPI.getOrders(customer.id);
            const latestOrder = ordersResponse.data.orders?.[0];

            if (!latestOrder) {
                toast.error('You need to place an order to review!', { id: loadingToast });
                setSubmitting(false);
                return;
            }

            const data = {
                orderId: latestOrder._id,
                rating: newReview.rating,
                comment: newReview.comment,
                type: 'restaurant'
            };
            await customerAPI.createReview(data);
            toast.success('Review posted! Thank you.', { id: loadingToast });
            setNewReview({ rating: 0, comment: '' });
            fetchReviews(); // Refresh list
        } catch (error) {
            toast.error('Failed to submit: ' + (error.response?.data?.message || error.message), { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <CustomerLayout>
            <div className="max-w-5xl mx-auto pb-20 font-outfit space-y-12">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={`/${params.hotelId}/menu`} className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                        <ChevronLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Reviews & Ratings</h1>
                        <p className="text-slate-500 mt-1 font-medium italic">Share your dining experience with us.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Write Review Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-indigo-50 border border-slate-100 sticky top-24">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                    <MessageSquare size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">Write a Review</h2>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Overall Rating</label>
                                    <div className="flex gap-2 justify-center py-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onMouseEnter={() => setHoveredStar(star)}
                                                onMouseLeave={() => setHoveredStar(0)}
                                                onClick={() => setNewReview({ ...newReview, rating: star })}
                                                className="transition-transform hover:scale-125 focus:outline-none"
                                            >
                                                <Star
                                                    size={32}
                                                    className={`transition-colors duration-200 ${star <= (hoveredStar || newReview.rating)
                                                            ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                                                            : "fill-slate-100 text-slate-200"
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-center text-xs font-bold text-indigo-600 h-4">
                                        {(hoveredStar || newReview.rating) === 1 ? "Disappointing" :
                                            (hoveredStar || newReview.rating) === 2 ? "Could be better" :
                                                (hoveredStar || newReview.rating) === 3 ? "It was okay" :
                                                    (hoveredStar || newReview.rating) === 4 ? "Good experience" :
                                                        (hoveredStar || newReview.rating) === 5 ? "Absolutely loved it!" : ""}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Your Feedback</label>
                                    <textarea
                                        required
                                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-700 font-medium min-h-[150px] resize-none shadow-sm placeholder:text-slate-300"
                                        placeholder="Tell us about the food, service, or ambiance..."
                                        value={newReview.comment}
                                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                    {submitting ? 'Posting...' : 'Post Review'} <Send size={16} />
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Reviews List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-lg font-bold text-slate-900">Recent Experiences</h3>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{reviews.length} reviews</span>
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-40 bg-slate-100 rounded-[2.5rem] animate-pulse" />
                                ))}
                            </div>
                        ) : reviews.length === 0 ? (
                            <div className="py-20 text-center bg-slate-50 rounded-[3rem] border border-slate-100">
                                <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6 shadow-sm">
                                    <MessageSquare size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">No Reviews Yet</h3>
                                <p className="text-slate-500 mt-2">Be the first to share your experience!</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <AnimatePresence>
                                    {reviews.map((review, i) => (
                                        <motion.div
                                            key={review._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden"
                                        >
                                            <div className="flex justify-between items-start mb-6 relative z-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-lg leading-tight">{review.customerId?.name || 'Verified Guest'}</h4>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                                                            <Calendar size={10} /> {new Date(review.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="px-4 py-1.5 bg-amber-50 border border-amber-100 rounded-full flex gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={14} className={i < review.rating ? "fill-amber-400 text-amber-400" : "fill-amber-100 text-amber-100"} />
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="relative z-10 pl-6 border-l-2 border-indigo-100">
                                                <Quote size={20} className="absolute -left-2.5 -top-2 text-indigo-200 bg-white p-0.5" />
                                                <p className="text-slate-600 font-medium leading-relaxed italic">
                                                    "{review.comment}"
                                                </p>
                                            </div>

                                            {review.response && (
                                                <div className="mt-6 ml-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 relative">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Response from Management</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 font-medium">
                                                        {review.response}
                                                    </p>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
