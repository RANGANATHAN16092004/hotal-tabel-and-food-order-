'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminAPI } from '@/lib/api';
import { socketService } from '@/lib/socket';
import {
    Users,
    Clock,
    CheckCircle2,
    XCircle,
    UserPlus,
    Phone,
    Search,
    Timer,
    ChevronRight,
    ExternalLink,
    Armchair,
    MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function WaitlistPage() {
    const [waitlist, setWaitlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchWaitlist();

        // Socket listeners
        const socket = socketService.connect();
        const adminData = JSON.parse(localStorage.getItem('admin_user') || '{}');
        const hotelId = adminData.hotelId || adminData.id;

        if (hotelId) {
            socket.emit('join-hotel', hotelId);
            socket.on('waitlist-updated', () => {
                fetchWaitlist();
                toast.success('Waitlist updated', { icon: '🔄' });
            });
        }

        return () => {
            socket.off('waitlist-updated');
        };
    }, []);

    const fetchWaitlist = async () => {
        try {
            const response = await adminAPI.getWaitlist();
            if (response.data.success) {
                setWaitlist(response.data.waitlist || []);
            }
        } catch (error) {
            console.error('Waitlist sync failed');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        const loadingToast = toast.loading(`Updating status to ${status}...`);
        try {
            await adminAPI.updateWaitlistStatus(id, status);
            toast.success(`Entry marked as ${status}`, { id: loadingToast });
            fetchWaitlist();
        } catch (error) {
            toast.error('Status sync failed', { id: loadingToast });
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'waiting': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            case 'seated': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'cancelled': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
            default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
        }
    };

    const filteredWaitlist = waitlist.filter(item =>
        item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone?.includes(searchQuery)
    );

    const stats = {
        total: waitlist.filter(w => w.status === 'waiting').length,
        avgWait: waitlist.length > 0 ? Math.floor(waitlist.reduce((acc, item) => acc + (Math.floor((new Date() - new Date(item.createdAt)) / 60000)), 0) / waitlist.length) : 0
    };

    if (loading && waitlist.length === 0) {
        return (
            <AdminLayout>
                <div className="space-y-8 max-w-6xl mx-auto">
                    <div className="h-20 card-premium shimmer" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-64 card-premium shimmer" />)}
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8 max-w-6xl mx-auto">
                {/* Header & Stats */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-outfit font-black text-slate-800 dark:text-white flex items-center gap-3 italic">
                            <Users className="text-indigo-600" size={36} />
                            LOBBY QUEUE
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium">Manage walk-ins and seating priorities in real-time.</p>
                    </div>

                    <div className="flex gap-4 w-full lg:w-auto">
                        <div className="flex-1 lg:flex-none px-6 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">QUEUED PARTIES</p>
                            <p className="text-xl font-black text-slate-800 dark:text-white">{stats.total}</p>
                        </div>
                        <div className="flex-1 lg:flex-none px-6 py-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20">
                            <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-1">AVG WAIT TIME</p>
                            <p className="text-xl font-black">{stats.avgWait} <span className="text-xs font-medium">MINS</span></p>
                        </div>
                    </div>
                </div>

                {/* Sub Header / Filters */}
                <div className="bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100/50 dark:bg-emerald-950/20 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                        <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Live Feed Sync Active
                    </div>
                </div>

                {/* Grid View */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode='popLayout'>
                        {filteredWaitlist.map((item, index) => (
                            <motion.div
                                key={item._id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, x: -20 }}
                                transition={{ delay: index * 0.05 }}
                                className="card-premium h-full flex flex-col group relative"
                            >
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight leading-tight group-hover:text-indigo-600 transition-colors uppercase">{item.customerName}</h3>
                                            <p className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-2">
                                                <Phone size={12} /> {item.phone}
                                            </p>
                                        </div>
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                            getStatusStyles(item.status)
                                        )}>
                                            {item.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">PARTY SIZE</p>
                                            <div className="flex items-center gap-2 text-slate-800 dark:text-white">
                                                <Users size={16} className="text-indigo-500" />
                                                <span className="text-lg font-black">{item.numberOfGuests}</span>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ELAPSED</p>
                                            <div className="flex items-center gap-2 text-slate-800 dark:text-white">
                                                <Timer size={16} className="text-orange-500" />
                                                <span className="text-lg font-black">{item.createdAt ? Math.floor((new Date() - new Date(item.createdAt)) / 60000) : 0}m</span>
                                            </div>
                                        </div>
                                    </div>

                                    {item.status === 'waiting' ? (
                                        <div className="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-auto">
                                            <button
                                                onClick={() => handleStatusUpdate(item._id, 'seated')}
                                                className="flex-1 btn-primary py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest bg-indigo-600 shadow-indigo-600/20 active:scale-95 transition-all"
                                            >
                                                <Armchair size={16} /> SEAT PARTY
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(item._id, 'cancelled')}
                                                className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all border border-slate-100 dark:border-slate-800"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center p-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic border-t border-slate-50 dark:border-slate-800 mt-auto">
                                            Transaction Complete
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredWaitlist.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 card-premium border-2 border-dashed">
                        <div className="h-24 w-24 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 mb-6 rounded-full">
                            <Armchair size={48} />
                        </div>
                        <h3 className="text-2xl font-outfit font-black text-slate-800 dark:text-white uppercase tracking-tight">Queue Depleted</h3>
                        <p className="text-slate-500 mt-2 font-medium">All walk-in parties have been reconciled or seated.</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

