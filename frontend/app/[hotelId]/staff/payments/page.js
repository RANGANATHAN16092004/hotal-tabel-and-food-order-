'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import {
    Wallet,
    CheckCircle2,
    Clock,
    DollarSign,
    RefreshCcw,
    CreditCard,
    Banknote,
    Smartphone,
    TrendingUp,
    Calendar,
    Download,
    Filter,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';

export default function StaffPaymentsPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unpaid, paid
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showPaymentModal, setShowPaymentModal] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getOrders();
            if (response.data.success) {
                setOrders(response.data.orders);
            }
        } catch (error) {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPaid = async (orderId, method) => {
        const loadingToast = toast.loading('Processing payment...');
        try {
            // Update order with payment info - pass method as third parameter
            await adminAPI.updateOrderStatus(orderId, 'completed', method);

            // Update local state with payment method
            setOrders(prev => prev.map(o =>
                o._id === orderId
                    ? { ...o, status: 'completed', paymentMethod: method, paidAt: new Date() }
                    : o
            ));

            toast.success(`Payment confirmed via ${method}`, { id: loadingToast });
            setShowPaymentModal(null);
        } catch (error) {
            toast.error('Failed to update payment', { id: loadingToast });
        }
    };

    // Filter orders
    const filteredOrders = orders.filter(order => {
        const matchesPaymentStatus =
            filter === 'unpaid' ? !['completed', 'cancelled'].includes(order.status) :
                filter === 'paid' ? order.status === 'completed' :
                    true;

        return matchesPaymentStatus;
    });

    // Filter orders by selected date
    const ordersForSelectedDate = orders.filter(order => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        return orderDate === selectedDate && order.status === 'completed';
    });

    // Calculate income stats for selected date
    const dailyStats = {
        total: ordersForSelectedDate.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        online: ordersForSelectedDate.filter(o => ['online', 'card', 'upi'].includes(o.paymentMethod)).reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        offline: ordersForSelectedDate.filter(o => ['cash', 'offline'].includes(o.paymentMethod)).reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        count: ordersForSelectedDate.length,
    };

    // Calculate overall stats
    const overallStats = {
        totalRevenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        pendingAmount: orders.filter(o => !['completed', 'cancelled'].includes(o.status)).reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        todayRevenue: orders.filter(o => {
            const today = new Date().toISOString().split('T')[0];
            const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
            return orderDate === today && o.status === 'completed';
        }).reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    };

    return (
        <div className="space-y-8 font-outfit pb-20 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 p-10 rounded-[3.5rem] shadow-2xl text-white">
                <div className="flex items-center gap-5 mb-8">
                    <div className="h-16 w-16 bg-white/10 backdrop-blur-xl rounded-[1.75rem] flex items-center justify-center shadow-xl border border-white/20">
                        <Wallet size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold leading-tight">Billing Lead Portal</h1>
                        <p className="text-slate-300 text-sm font-medium italic">Manage payments, track revenue, and monitor daily income</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                <TrendingUp size={20} className="text-emerald-400" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Revenue</span>
                        </div>
                        <p className="text-3xl font-black">{formatCurrency(overallStats.totalRevenue)}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                                <Clock size={20} className="text-amber-400" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending</span>
                        </div>
                        <p className="text-3xl font-black">{formatCurrency(overallStats.pendingAmount)}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                                <Calendar size={20} className="text-indigo-400" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Today's Revenue</span>
                        </div>
                        <p className="text-3xl font-black">{formatCurrency(overallStats.todayRevenue)}</p>
                    </div>
                </div>
            </div>

            {/* Day-by-Day Income Tracker */}
            <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                            <Calendar size={24} className="text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Daily Income Report</h2>
                            <p className="text-xs text-slate-500 font-medium">Select a date to view breakdown</p>
                        </div>
                    </div>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
                        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Total Income</p>
                        <p className="text-3xl font-black">{formatCurrency(dailyStats.total)}</p>
                        <p className="text-xs opacity-70 mt-2">{dailyStats.count} orders</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
                        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Online Payments</p>
                        <p className="text-3xl font-black">{formatCurrency(dailyStats.online)}</p>
                        <p className="text-xs opacity-70 mt-2">{Math.round((dailyStats.online / dailyStats.total) * 100) || 0}% of total</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
                        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Cash/Offline</p>
                        <p className="text-3xl font-black">{formatCurrency(dailyStats.offline)}</p>
                        <p className="text-xs opacity-70 mt-2">{Math.round((dailyStats.offline / dailyStats.total) * 100) || 0}% of total</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center">
                        <button className="flex flex-col items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors">
                            <Download size={24} />
                            <span className="text-xs font-bold uppercase tracking-widest">Export</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Payment Status Management */}
            <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Payment Status</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={cn("px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                                filter === 'all' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50")}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('unpaid')}
                            className={cn("px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                                filter === 'unpaid' ? "bg-rose-500 text-white border-rose-500" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50")}
                        >
                            Unpaid
                        </button>
                        <button
                            onClick={() => setFilter('paid')}
                            className={cn("px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                                filter === 'paid' ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50")}
                        >
                            Paid
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence>
                        {filteredOrders.map((order) => (
                            <motion.div
                                key={order._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-slate-50 border border-slate-200 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center gap-6 w-full md:w-auto">
                                    <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center shadow-sm">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Table</span>
                                        <span className="text-xl font-black text-slate-900">{order.tableId?.tableNumber || '#'}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-bold text-slate-900">#{order._id.slice(-6)}</h3>
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                                                order.status === 'completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                                            )}>
                                                {order.status}
                                            </span>
                                            {order.paymentMethod && (
                                                <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                    {order.paymentMethod}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-slate-500 text-sm font-medium">{new Date(order.createdAt).toLocaleString()} • {order.items?.length || 0} Items</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                                        <p className="text-2xl font-black text-slate-900">{formatCurrency(order.totalAmount || 0)}</p>
                                    </div>

                                    {order.status !== 'completed' && order.status !== 'cancelled' ? (
                                        <button
                                            onClick={() => setShowPaymentModal(order)}
                                            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg"
                                        >
                                            Mark Paid
                                        </button>
                                    ) : (
                                        <div className="px-8 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-bold text-[10px] uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                                            <CheckCircle2 size={16} /> Settled
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {filteredOrders.length === 0 && (
                        <div className="py-20 text-center text-slate-400">
                            <p className="font-bold uppercase tracking-widest text-sm">No orders found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Method Modal */}
            <AnimatePresence>
                {showPaymentModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPaymentModal(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900">Confirm Payment</h3>
                                    <p className="text-sm text-slate-500 mt-1">Order #{showPaymentModal._id.slice(-6)}</p>
                                </div>
                                <button onClick={() => setShowPaymentModal(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="text-center p-6 bg-slate-50 rounded-2xl">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Amount</p>
                                    <p className="text-4xl font-black text-slate-900">{formatCurrency(showPaymentModal.totalAmount)}</p>
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">Select Payment Method</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setPaymentMethod('cash')}
                                            className={cn(
                                                "p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                                                paymentMethod === 'cash' ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"
                                            )}
                                        >
                                            <Banknote size={32} className={paymentMethod === 'cash' ? "text-emerald-600" : "text-slate-400"} />
                                            <span className={cn("text-xs font-bold uppercase tracking-widest", paymentMethod === 'cash' ? "text-emerald-600" : "text-slate-600")}>Cash</span>
                                        </button>
                                        <button
                                            onClick={() => setPaymentMethod('card')}
                                            className={cn(
                                                "p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                                                paymentMethod === 'card' ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
                                            )}
                                        >
                                            <CreditCard size={32} className={paymentMethod === 'card' ? "text-indigo-600" : "text-slate-400"} />
                                            <span className={cn("text-xs font-bold uppercase tracking-widest", paymentMethod === 'card' ? "text-indigo-600" : "text-slate-600")}>Card</span>
                                        </button>
                                        <button
                                            onClick={() => setPaymentMethod('upi')}
                                            className={cn(
                                                "p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                                                paymentMethod === 'upi' ? "border-purple-500 bg-purple-50" : "border-slate-200 hover:border-slate-300"
                                            )}
                                        >
                                            <Smartphone size={32} className={paymentMethod === 'upi' ? "text-purple-600" : "text-slate-400"} />
                                            <span className={cn("text-xs font-bold uppercase tracking-widest", paymentMethod === 'upi' ? "text-purple-600" : "text-slate-600")}>UPI</span>
                                        </button>
                                        <button
                                            onClick={() => setPaymentMethod('online')}
                                            className={cn(
                                                "p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                                                paymentMethod === 'online' ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                                            )}
                                        >
                                            <Wallet size={32} className={paymentMethod === 'online' ? "text-blue-600" : "text-slate-400"} />
                                            <span className={cn("text-xs font-bold uppercase tracking-widest", paymentMethod === 'online' ? "text-blue-600" : "text-slate-600")}>Online</span>
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleMarkPaid(showPaymentModal._id, paymentMethod)}
                                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={20} /> Confirm Payment
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
