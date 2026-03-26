'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { customerAPI } from '@/lib/api';
import {
    Clock,
    CheckCircle2,
    ChefHat,
    Flame,
    Utensils,
    Zap,
    ShieldCheck,
    Smartphone,
    ArrowLeft,
    RotateCcw,
    Table as TableIcon,
    DollarSign,
    QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import Link from 'next/link';

import socketService from '@/lib/socket';

export default function OrderPulsePage() {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOrder();

        // Initialize socket and join customer room
        const socket = socketService.connect();

        const handleStatusChange = (data) => {
            if (data.orderId === orderId) {
                console.log('Order status update received:', data);
                setOrder(prev => prev ? { ...prev, status: data.status } : null);
                // Optional: show a toast or play a sound
            }
        };

        socket.on('order-status-changed', handleStatusChange);

        return () => {
            socket.off('order-status-changed', handleStatusChange);
        };
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            const response = await customerAPI.getOrder(orderId);
            if (response.data.success) {
                setOrder(response.data.order);
                // Join customer room once we have customer ID
                if (response.data.order.customerId) {
                    socketService.joinCustomer(response.data.order.customerId._id || response.data.order.customerId);
                }
            }
        } catch (err) {
            setError('Order trajectory lost in the network');
        } finally {
            setLoading(false);
        }
    };

    const statusSteps = [
        { status: 'pending', label: 'Order Broadcasted', icon: Zap, desc: 'Your culinary request is entering our network.' },
        { status: 'preparing', label: 'Culinary Synthesis', icon: ChefHat, desc: 'Executive chefs are articulating your flavors.' },
        { status: 'ready', label: 'Quality Verified', icon: ShieldCheck, desc: 'Dish has passed final calibration.' },
        { status: 'delivered', label: 'Entity Received', icon: Utensils, desc: 'Mission accomplished. Enjoy your hospitality.' }
    ];

    const currentStatusIndex = statusSteps.findIndex(s => s.status === order?.status);

    if (loading && !order) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
                <div className="h-20 w-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-8" />
                <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.5em] animate-pulse">Acquiring Order Pulse...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-10 text-center">
                <div className="h-20 w-20 bg-rose-500/10 rounded-[2.5rem] flex items-center justify-center text-rose-500 mb-8 border border-rose-500/20">
                    <RotateCcw size={40} />
                </div>
                <h1 className="text-3xl font-outfit font-black text-white italic tracking-tight uppercase">Connection Failure</h1>
                <p className="text-slate-500 mt-2 font-medium max-w-sm mb-10">{error}</p>
                <button onClick={() => window.location.reload()} className="px-10 py-4 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">RETRY UPLINK</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30">
            {/* Dynamic Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_rgba(79,70,229,0.15),transparent_70%)]" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            </div>

            <div className="relative max-w-2xl mx-auto px-6 pt-10 pb-24">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <Link href="/" className="h-12 w-12 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="text-center">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-1">Live Order Pulse</p>
                        <h1 className="text-xl font-outfit font-black tracking-tighter uppercase italic text-white flex items-center gap-2">
                            <span className="opacity-40">#</span>{orderId.slice(-8).toUpperCase()}
                        </h1>
                    </div>
                    <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                        <Smartphone size={20} />
                    </div>
                </div>

                {/* Pulse Tracker Display */}
                <div className="relative mb-16 px-4">
                    {/* Progress Line */}
                    <div className="absolute left-[30px] top-4 bottom-4 w-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
                            className="w-full bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.5)]"
                        />
                    </div>

                    <div className="space-y-12">
                        {statusSteps.map((step, i) => {
                            const isCompleted = i <= currentStatusIndex;
                            const isActive = i === currentStatusIndex;
                            const Icon = step.icon;

                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className={cn(
                                        "flex gap-8 relative",
                                        !isCompleted && "opacity-30"
                                    )}
                                >
                                    <div className={cn(
                                        "h-[32px] w-[32px] rounded-full border-4 flex items-center justify-center z-10 transition-all duration-500",
                                        isCompleted ? "bg-indigo-600 border-slate-950 ring-4 ring-indigo-500/20" : "bg-slate-900 border-white/10"
                                    )}>
                                        {isCompleted ? <CheckCircle2 size={16} className="text-white" /> : <div className="h-2 w-2 rounded-full bg-white/20" />}
                                    </div>

                                    <div className="flex-1 -mt-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <Icon size={18} className={isCompleted ? "text-indigo-400" : "text-white/20"} />
                                            <h3 className={cn(
                                                "text-lg font-black uppercase tracking-tight italic",
                                                isActive ? "text-indigo-400" : "text-white"
                                            )}>
                                                {step.label}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-slate-400 font-medium leading-relaxed">{step.desc}</p>
                                        {isActive && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="mt-3 inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-400"
                                            >
                                                <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-ping" />
                                                In Progress
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Order Synthesis Breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 shadow-2xl"
                >
                    <div className="flex items-center justify-between mb-8 pb-8 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-400">
                                <TableIcon size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Station</p>
                                <p className="text-xl font-black text-white italic">Table #{order?.tableId?.tableNumber || '??'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiscal Value</p>
                            <p className="text-2xl font-black text-emerald-400 tracking-tighter">{formatCurrency(order?.totalAmount || 0)}</p>
                        </div>
                    </div>

                    <div className="space-y-6 mb-10">
                        {order?.items?.map((item, i) => (
                            <div key={i} className="flex justify-between items-center group">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-black text-indigo-400 border border-white/10 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        {item.quantity}x
                                    </div>
                                    <div>
                                        <p className="font-black text-white text-sm uppercase tracking-tight">{item.menuItemId?.name || 'Unknown Entity'}</p>
                                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Active Dish</p>
                                    </div>
                                </div>
                                <p className="font-bold text-white/50 text-sm">{formatCurrency(item.price * item.quantity)}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-white/10 flex items-center justify-center gap-2 transition-all"
                        >
                            <RotateCcw size={14} /> Refresh Node
                        </button>
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all">
                            <QrCode size={14} /> My Receipt
                        </button>
                    </div>
                </motion.div>

                {/* Footer Meta */}
                <div className="mt-12 text-center">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] italic">Proprietary Hospitality Pulse Link • Real-time Sync Active</p>
                </div>
            </div>
        </div>
    );
}
