'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminAPI } from '@/lib/api';
import {
    Bell,
    Check,
    Clock,
    Info,
    AlertCircle,
    CheckCircle2,
    MailOpen,
    BellOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getNotifications();
            if (response.data.success) {
                setNotifications(response.data.notifications || []);
            }
        } catch (error) {
            toast.error('Failed to load system alerts');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await adminAPI.markNotificationRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            toast.success('Cleared');
        } catch (error) {
            toast.error('Update failed');
        }
    };

    const handleMarkAllRead = async () => {
        const loadingToast = toast.loading('Clearing all notifications...');
        try {
            const unread = notifications.filter(n => !n.isRead);
            await Promise.all(unread.map(n => adminAPI.markNotificationRead(n._id)));
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success('Inbox cleared', { id: loadingToast });
        } catch (error) {
            toast.error('Action failed', { id: loadingToast });
        }
    };

    const filteredNotifications = notifications.filter(n => filter === 'all' || !n.isRead);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const getIcon = (type) => {
        switch (type) {
            case 'order': return <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm border border-indigo-100"><Bell size={20} /></div>;
            case 'success': return <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm border border-emerald-100"><CheckCircle2 size={20} /></div>;
            case 'alert': return <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-sm border border-amber-100"><AlertCircle size={20} /></div>;
            default: return <div className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0 shadow-sm border border-slate-100"><Info size={20} /></div>;
        }
    };

    if (loading && notifications.length === 0) {
        return (
            <AdminLayout>
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="h-40 bg-white rounded-[3rem] border border-slate-200 animate-pulse" />
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-3xl border border-slate-200 animate-pulse" />)}
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8 max-w-4xl mx-auto font-outfit px-4 sm:px-0 pb-20">
                {/* Header */}
                <div className="bg-white border border-slate-200 p-8 rounded-[3.5rem] shadow-sm flex flex-col sm:row justify-between items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <Bell size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Interaction Feed</h1>
                            <p className="text-slate-500 text-sm font-medium italic">Monitor real-time system and guest events.</p>
                        </div>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="px-6 py-3.5 bg-slate-50 text-slate-600 rounded-2xl font-bold uppercase tracking-widest text-[10px] border border-slate-100 hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-3"
                        >
                            <MailOpen size={16} /> Mark all read
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-white border border-slate-200 p-1.5 rounded-[2rem] w-fit">
                    <button
                        onClick={() => setFilter('all')}
                        className={cn(
                            "px-8 py-3 rounded-2xl text-[10px] font-bold transition-all uppercase tracking-widest flex items-center gap-2",
                            filter === 'all' ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-900"
                        )}
                    >
                        Timeline
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={cn(
                            "px-8 py-3 rounded-2xl text-[10px] font-bold transition-all uppercase tracking-widest flex items-center gap-2",
                            filter === 'unread' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-400 hover:text-slate-900"
                        )}
                    >
                        Unread
                        {unreadCount > 0 && <span className="h-5 w-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-black">{unreadCount}</span>}
                    </button>
                </div>

                {/* Notification List */}
                <div className="space-y-4">
                    <AnimatePresence>
                        {filteredNotifications.length === 0 ? (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-32 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-[4rem] text-center">
                                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8 transition-transform hover:scale-110">
                                    <BellOff size={40} />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tighter">Inbox is Empty</h2>
                                <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest font-bold font-outfit">Everything is up to date.</p>
                            </motion.div>
                        ) : (
                            filteredNotifications.map((notification, index) => (
                                <motion.div
                                    key={notification._id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={cn(
                                        "bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group hover:shadow-xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden",
                                        !notification.isRead && "border-l-4 border-l-indigo-600"
                                    )}
                                >
                                    <div className="flex gap-6">
                                        {getIcon(notification.type || 'info')}
                                        <div className="flex-1 pr-12">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className={cn("text-lg font-bold leading-none tracking-tight", !notification.isRead ? "text-slate-900" : "text-slate-400")}>
                                                    {notification.title}
                                                </h3>
                                                {!notification.isRead && <span className="h-2 w-2 bg-indigo-600 rounded-full animate-pulse shadow-lg" />}
                                            </div>
                                            <p className={cn("text-sm font-medium leading-relaxed mb-4", !notification.isRead ? "text-slate-600" : "text-slate-400")}>
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                <span className="flex items-center gap-2"><Clock size={12} /> {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span className="flex items-center gap-2">{new Date(notification.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {!notification.isRead && (
                                            <button
                                                onClick={() => handleMarkRead(notification._id)}
                                                className="absolute top-8 right-8 p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all shadow-sm bg-slate-50"
                                                title="Dismiss"
                                            >
                                                <Check size={20} />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                {filteredNotifications.length > 5 && (
                    <div className="pt-10 text-center">
                        <button className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:opacity-70 transition-opacity">
                            View archived events
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

