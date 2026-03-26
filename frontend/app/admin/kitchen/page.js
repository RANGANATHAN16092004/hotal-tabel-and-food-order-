'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminAPI } from '@/lib/api';
import socketService from '@/lib/socket';
import { adminAuth } from '@/lib/auth';
import {
    Clock,
    CheckCircle2,
    ChefHat,
    AlertCircle,
    Timer,
    CheckCircle,
    Play,
    Flame,
    UtensilsCrossed,
    RefreshCw,
    Signal,
    BellRing
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function KitchenPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAutoRefresh, setIsAutoRefresh] = useState(true);

    const fetchOrders = useCallback(async () => {
        try {
            const response = await adminAPI.getKitchenOrders();
            if (response.data.success) {
                setOrders(response.data.orders);
            }
        } catch (error) {
            toast.error('Kitchen connection failed');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();

        const hotel = adminAuth.getAdmin();
        if (hotel) {
            socketService.connect(hotel.id);

            socketService.on('new-order', (order) => {
                setOrders(prev => [order, ...prev]);
                toast.success('New Order Received!', {
                    icon: '🔥',
                    duration: 5000,
                });
                try { new Audio('/notification.mp3').play(); } catch (e) { }
            });

            socketService.on('order-updated', () => {
                fetchOrders();
            });
        }

        let refreshInterval;
        if (isAutoRefresh) {
            refreshInterval = setInterval(fetchOrders, 30000);
        }

        return () => {
            socketService.off('new-order');
            socketService.off('order-updated');
            if (refreshInterval) clearInterval(refreshInterval);
        };
    }, [fetchOrders, isAutoRefresh]);

    const handleItemStatus = async (orderId, itemId, status) => {
        try {
            await adminAPI.updateKitchenItemStatus(orderId, itemId, status);
            setOrders(prev => prev.map(order => {
                if (order._id === orderId) {
                    return {
                        ...order,
                        items: order.items.map(item =>
                            item._id === itemId ? { ...item, status } : item
                        )
                    };
                }
                return order;
            }));
            if (status === 'completed') toast.success('Dish Prepared');
        } catch (error) {
            toast.error('Failed to update status');
            fetchOrders();
        }
    };

    const markOrderReady = async (orderId) => {
        const loadingToast = toast.loading('Marking as ready...');
        try {
            await adminAPI.updateOrderStatus(orderId, 'ready');
            setOrders(prev => prev.filter(o => o._id !== orderId));
            toast.success('Order ready for pickup!', { id: loadingToast });
        } catch (error) {
            toast.error('Update failed', { id: loadingToast });
        }
    };

    const getRemainingTime = (orderDate, estimatedMins) => {
        const elapsed = Math.floor((new Date() - new Date(orderDate)) / 60000);
        return (estimatedMins || 20) - elapsed;
    };

    const getUrgencyColor = (orderDate, estimatedMins) => {
        const remaining = getRemainingTime(orderDate, estimatedMins);

        if (remaining > 10) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (remaining > 5) return 'bg-amber-50 text-amber-600 border-amber-100';
        if (remaining > 0) return 'bg-orange-50 text-orange-600 border-orange-100 animate-pulse';
        return 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse shadow-[0_0_15px_rgba(225,29,72,0.2)]';
    };

    if (loading && orders.length === 0) {
        return (
            <AdminLayout>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-80 bg-white rounded-[2.5rem] border border-slate-200 animate-pulse" />)}
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8 max-w-[1600px] mx-auto font-outfit">
                {/* Header Section */}
                <div className="bg-white border border-slate-200 p-8 rounded-[3rem] shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="h-16 w-16 bg-slate-900 rounded-[1.75rem] flex items-center justify-center text-white shadow-xl shadow-slate-200">
                            <ChefHat size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Kitchen Display</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">{orders.length} Active Orders</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={fetchOrders} className="p-4 bg-slate-50 text-slate-600 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all">
                            <RefreshCw size={20} />
                        </button>
                        <div className="bg-slate-50 p-1 rounded-2xl border border-slate-100 flex">
                            <button onClick={() => setIsAutoRefresh(true)} className={cn("px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", isAutoRefresh ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}>Auto</button>
                            <button onClick={() => setIsAutoRefresh(false)} className={cn("px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", !isAutoRefresh ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}>Off</button>
                        </div>
                    </div>
                </div>

                {/* Orders Grid */}
                {orders.length === 0 ? (
                    <div className="py-32 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-[3rem] text-center px-6">
                        <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                            <UtensilsCrossed size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Kitchen is Clean</h2>
                        <p className="text-slate-500 mt-2 font-medium">No pending orders at the moment. Good job!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        <AnimatePresence mode='popLayout'>
                            {orders.map((order) => (
                                <motion.div
                                    key={order._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all"
                                >
                                    {/* Order Header */}
                                    <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">TABLE</p>
                                            <p className="text-4xl font-bold leading-none">{order.tableId?.tableNumber || '??'}</p>
                                        </div>
                                        <div className={cn("px-4 py-2 rounded-2xl border font-bold flex items-center gap-2", getUrgencyColor(order.orderDate, order.estimatedPrepTime))}>
                                            <Timer size={16} />
                                            <span className="text-sm">
                                                {getRemainingTime(order.orderDate, order.estimatedPrepTime) > 0
                                                    ? `${getRemainingTime(order.orderDate, order.estimatedPrepTime)}m left`
                                                    : 'OVERDUE'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div className="p-6 flex-1 space-y-6 max-h-[450px] overflow-y-auto no-scrollbar">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="space-y-4 pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                                                <div className="flex gap-4">
                                                    <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 border border-indigo-100">
                                                        {item.quantity}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className={cn("font-bold text-lg leading-tight transition-all", item.status === 'completed' ? "text-slate-300 line-through" : "text-slate-900")}>{item.name}</p>
                                                        {item.specialInstructions && (
                                                            <div className="mt-3 p-3 bg-rose-50 rounded-xl border border-rose-100 flex gap-2">
                                                                <AlertCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                                                                <p className="text-[11px] text-rose-700 font-bold italic">"{item.specialInstructions}"</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleItemStatus(order._id, item._id, 'preparing')}
                                                        disabled={item.status === 'completed'}
                                                        className={cn(
                                                            "flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                                            item.status === 'preparing'
                                                                ? "bg-amber-500 text-white shadow-lg shadow-amber-100"
                                                                : "bg-slate-50 text-slate-400 hover:text-slate-600"
                                                        )}
                                                    >
                                                        <Play size={12} fill={item.status === 'preparing' ? "currentColor" : "none"} />
                                                        Start
                                                    </button>
                                                    <button
                                                        onClick={() => handleItemStatus(order._id, item._id, 'completed')}
                                                        className={cn(
                                                            "flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                                            item.status === 'completed'
                                                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100"
                                                                : "bg-slate-50 text-slate-400 hover:text-slate-600"
                                                        )}
                                                    >
                                                        <CheckCircle size={12} fill={item.status === 'completed' ? "currentColor" : "none"} />
                                                        Finish
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Ready Action */}
                                    <div className="p-6 bg-slate-50 border-t border-slate-100">
                                        <button
                                            onClick={() => markOrderReady(order._id)}
                                            disabled={!order.items.every(i => i.status === 'completed')}
                                            className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-bold uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 disabled:opacity-30 transition-all hover:bg-slate-800"
                                        >
                                            <CheckCircle2 size={20} /> dispatch order
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
