'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminAPI } from '@/lib/api';
import {
    Ticket,
    Plus,
    Search,
    X,
    Edit2,
    Trash2,
    CheckCircle2,
    ArrowRight,
    Zap,
    Gift,
    Settings2,
    Bot,
    Clock,
    UserCheck,
    Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';

export default function CouponsPage() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAutomation, setShowAutomation] = useState(false);

    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        minOrderAmount: '',
        maxDiscountAmount: '',
        validFrom: '',
        validUntil: '',
        usageLimit: '',
        isActive: true,
        automationType: 'none',
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getCoupons();
            if (response.data.success) {
                setCoupons(response.data.coupons);
            }
        } catch (error) {
            toast.error('Failed to load campaigns');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading(editingCoupon ? 'Updating...' : 'Launching...');

        try {
            const submitData = {
                ...formData,
                discountValue: parseFloat(formData.discountValue),
                minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
                maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined,
                usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
                validFrom: formData.validFrom || new Date().toISOString(),
                validUntil: formData.validUntil
            };

            if (editingCoupon) {
                await adminAPI.updateCoupon(editingCoupon._id, submitData);
                toast.success('Campaign synchronized', { id: loadingToast });
            } else {
                await adminAPI.createCoupon(submitData);
                toast.success('New promotion live!', { id: loadingToast });
            }
            setShowModal(false);
            setEditingCoupon(null);
            resetForm();
            fetchCoupons();
        } catch (err) {
            toast.error('Transaction failed', { id: loadingToast });
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            description: '',
            discountType: 'percentage',
            discountValue: '',
            minOrderAmount: '',
            maxDiscountAmount: '',
            validFrom: '',
            validUntil: '',
            usageLimit: '',
            isActive: true,
            automationType: 'none',
        });
    };

    const handleEdit = (coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            description: coupon.description || '',
            discountType: coupon.discountType,
            discountValue: coupon.discountValue.toString(),
            minOrderAmount: coupon.minOrderAmount.toString(),
            maxDiscountAmount: coupon.maxDiscountAmount ? coupon.maxDiscountAmount.toString() : '',
            validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : '',
            validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : '',
            usageLimit: coupon.usageLimit ? coupon.usageLimit.toString() : '',
            isActive: coupon.isActive,
            automationType: coupon.automationType || 'none',
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('End this campaign?')) return;
        const loadingToast = toast.loading('Ending...');
        try {
            await adminAPI.deleteCoupon(id);
            toast.success('Campaign archived', { id: loadingToast });
            fetchCoupons();
        } catch (err) {
            toast.error('Operation failed', { id: loadingToast });
        }
    };

    const filteredCoupons = coupons.filter(c =>
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const automationOptions = [
        { id: 'none', label: 'Manual Access', icon: Tag, desc: 'Requires code entry' },
        { id: 'vip', label: 'VIP Rewards', icon: UserCheck, desc: 'For high-frequency guests' },
        { id: 'happy_hour', label: 'Happy Hour', icon: Clock, desc: 'Off-peak time slots' },
        { id: 'recurring', label: 'Re-engagement', icon: Bot, desc: 'Inactive guest targets' },
    ];

    if (loading && coupons.length === 0) {
        return (
            <AdminLayout>
                <div className="space-y-8 max-w-7xl mx-auto">
                    <div className="h-40 bg-white rounded-[3rem] border border-slate-200 animate-pulse" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => <div key={i} className="h-96 bg-white rounded-[2.5rem] border border-slate-200 animate-pulse" />)}
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8 max-w-7xl mx-auto font-outfit px-4 sm:px-0">
                {/* Header */}
                <div className="bg-white border border-slate-200 p-8 rounded-[3rem] shadow-sm flex flex-col sm:row justify-between items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <Ticket size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Campaign Center</h1>
                            <p className="text-slate-500 text-sm font-medium italic">Configure discounts and reward systems.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setEditingCoupon(null);
                            resetForm();
                            setShowModal(true);
                        }}
                        className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-slate-200 flex items-center gap-3 active:scale-95 transition-all"
                    >
                        <Plus size={18} /> New Promotion
                    </button>
                </div>

                {/* Filters */}
                <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search active promotional codes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-3xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none text-lg font-medium"
                    />
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
                    <AnimatePresence>
                        {filteredCoupons.map((coupon, index) => (
                            <motion.div
                                key={coupon._id}
                                layout
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden flex flex-col relative group"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50 -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />

                                <div className="p-8 pb-6 border-b-2 border-dashed border-slate-100 relative">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
                                            <Gift size={24} />
                                        </div>
                                        <span className={cn(
                                            "inline-flex items-center px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest",
                                            coupon.isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-100"
                                        )}>
                                            {coupon.isActive ? 'Active' : 'Expired'}
                                        </span>
                                    </div>

                                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-1 italic">{coupon.code}</h2>
                                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}% Off Total` : `${formatCurrency(coupon.discountValue)} Discount`}
                                    </p>
                                </div>

                                <div className="p-8 flex-1 flex flex-col justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500 font-medium italic mb-6 leading-relaxed">
                                            {coupon.description || 'Global promotional offer for selected guests.'}
                                        </p>

                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Min Spend</p>
                                                <p className="font-bold text-slate-900">{formatCurrency(coupon.minOrderAmount)}</p>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Max Cap</p>
                                                <p className="font-bold text-slate-900">{coupon.maxDiscountAmount ? formatCurrency(coupon.maxDiscountAmount) : '∞'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                            <Clock size={12} /> Ends: {new Date(coupon.validUntil).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-8">
                                        <button
                                            onClick={() => handleEdit(coupon)}
                                            className="flex-1 py-3.5 bg-slate-50 text-slate-600 rounded-2xl font-bold uppercase tracking-widest text-[10px] border border-slate-100 hover:bg-slate-900 hover:text-white transition-all transition-colors active:scale-95"
                                        >
                                            Optimize
                                        </button>
                                        <button
                                            onClick={() => handleDelete(coupon._id)}
                                            className="px-4 py-3.5 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all border border-rose-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Modal */}
                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl overflow-hidden font-outfit">
                                <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                            <Zap size={24} />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">{editingCoupon ? 'Configure Promotion' : 'New Campaign'}</h2>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm bg-slate-50 border border-slate-100"><X size={20} /></button>
                                </div>

                                <div className="flex bg-slate-50/50 p-1.5 mx-10 mt-8 rounded-2xl border border-slate-100">
                                    <button
                                        onClick={() => setShowAutomation(false)}
                                        className={cn("flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", !showAutomation ? "bg-white shadow-md text-indigo-600 font-black" : "text-slate-400")}
                                    >
                                        Configuration
                                    </button>
                                    <button
                                        onClick={() => setShowAutomation(true)}
                                        className={cn("flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", showAutomation ? "bg-white shadow-md text-indigo-600 font-black" : "text-slate-400")}
                                    >
                                        Smart Triggers
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-10 pt-6">
                                    <AnimatePresence mode="wait">
                                        {!showAutomation ? (
                                            <motion.div key="specs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Promo Code</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={formData.code}
                                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none font-black text-indigo-600 tracking-widest uppercase"
                                                            placeholder="WELCOME10"
                                                            disabled={!!editingCoupon}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Reward Logic</label>
                                                        <select
                                                            value={formData.discountType}
                                                            onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none font-bold text-sm"
                                                        >
                                                            <option value="percentage">Percentage Off (%)</option>
                                                            <option value="fixed">Fixed Amount (₹)</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Tagline</label>
                                                    <input
                                                        type="text"
                                                        value={formData.description}
                                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none italic font-medium"
                                                        placeholder="Ex: Get 20% off on your first order..."
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Value</label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                required
                                                                value={formData.discountValue}
                                                                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                                                                className="w-full pl-6 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none font-bold text-lg"
                                                                placeholder="0.00"
                                                            />
                                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-indigo-600">{formData.discountType === 'percentage' ? '%' : '₹'}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Min. Purchase</label>
                                                        <input
                                                            type="number"
                                                            value={formData.minOrderAmount}
                                                            onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none font-bold text-lg"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Active From</label>
                                                        <input
                                                            type="date"
                                                            required
                                                            value={formData.validFrom}
                                                            onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none font-bold text-xs uppercase"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Expiry Date</label>
                                                        <input
                                                            type="date"
                                                            required
                                                            value={formData.validUntil}
                                                            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none font-bold text-xs uppercase"
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div key="automation" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                                                {automationOptions.map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, automationType: opt.id })}
                                                        className={cn(
                                                            "w-full flex items-center gap-5 p-5 rounded-[2rem] border-2 transition-all text-left",
                                                            formData.automationType === opt.id ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-100 hover:border-slate-200"
                                                        )}
                                                    >
                                                        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm", formData.automationType === opt.id ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-400")}>
                                                            <opt.icon size={24} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className={cn("text-xs font-bold uppercase tracking-widest", formData.automationType === opt.id ? "text-indigo-600" : "text-slate-900")}>{opt.label}</p>
                                                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">{opt.desc}</p>
                                                        </div>
                                                        {formData.automationType === opt.id && <CheckCircle2 size={20} className="text-indigo-600" />}
                                                    </button>
                                                ))}
                                                <div className="p-6 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 mt-6">
                                                    <div className="flex gap-4">
                                                        <Bot size={20} className="text-indigo-600 shrink-0" />
                                                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic uppercase tracking-widest">
                                                            Smart triggers automate benefits based on user behavior logs. Active automation can increase guest retention by up to 18%.
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="flex gap-4 mt-10">
                                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 font-bold text-slate-400 uppercase tracking-widest text-[11px] hover:bg-slate-50 rounded-2xl transition-colors">Discard</button>
                                        <button type="submit" className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95 transition-all">
                                            {editingCoupon ? 'Sync Campaign' : 'Publish Offer'} <ArrowRight size={18} />
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
