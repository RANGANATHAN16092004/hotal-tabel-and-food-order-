'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminAPI } from '@/lib/api';
import { socketService } from '@/lib/socket';
import {
    CalendarCheck,
    Users,
    Clock,
    Phone,
    User,
    CheckCircle2,
    XCircle,
    Search,
    Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function ReservationsPage() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchReservations();

        // Socket listeners
        const socket = socketService.connect();
        const adminData = JSON.parse(localStorage.getItem('admin_user') || '{}');
        const hotelId = adminData.hotelId || adminData.id;

        if (hotelId) {
            socket.emit('join-hotel', hotelId);

            socket.on('new-reservation', (data) => {
                fetchReservations();
                toast.success(`NEW BOOKING: ${data.contactName}`, {
                    icon: '📅',
                    duration: 5000
                });
            });

            socket.on('reservation-status-updated', () => {
                fetchReservations();
            });
        }

        return () => {
            socket.off('new-reservation');
            socket.off('reservation-status-updated');
        };
    }, []);

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getReservations({});
            if (response.data.success) {
                setReservations(response.data.reservations);
            }
        } catch (error) {
            toast.error('Failed to load reservations');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        const loadingToast = toast.loading('Updating...');
        try {
            await adminAPI.updateReservationStatus(id, status);
            toast.success(`Reservation ${status}`, { id: loadingToast });
            fetchReservations();
        } catch (error) {
            toast.error('Update failed', { id: loadingToast });
        }
    };

    const filteredReservations = reservations.filter(res => {
        const matchesSearch = res.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            res.contactPhone.includes(searchQuery);
        const matchesStatus = filterStatus === 'all' || res.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (loading && reservations.length === 0) {
        return (
            <AdminLayout>
                <div className="space-y-8 max-w-7xl mx-auto">
                    <div className="h-40 bg-white rounded-[3rem] animate-pulse border border-slate-200" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white rounded-[2.5rem] border border-slate-200 animate-pulse" />)}
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8 max-w-7xl mx-auto font-outfit px-4 sm:px-0">
                {/* Header */}
                <div className="bg-white border border-slate-200 p-8 rounded-[3rem] shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <CalendarCheck size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Bookings</h1>
                            <p className="text-slate-500 text-sm font-medium italic">Oversee guest reservations and table capacity.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-600 rounded-xl border border-slate-100 text-xs font-bold uppercase tracking-widest">
                        <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                        Real-time Monitoring
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Find guest by name or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium"
                        />
                    </div>
                    <div className="bg-white border border-slate-200 p-1 rounded-2xl flex gap-1 overflow-x-auto no-scrollbar">
                        {['all', 'pending', 'confirmed', 'cancelled'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={cn(
                                    "px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                                    filterStatus === status
                                        ? "bg-slate-900 text-white shadow-lg"
                                        : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                {filteredReservations.length === 0 ? (
                    <div className="py-32 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-[3rem] text-center">
                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                            <CalendarCheck size={40} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-widest text-xs">No entries found</h2>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
                        <AnimatePresence>
                            {filteredReservations.map((res, index) => (
                                <motion.div
                                    key={res._id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col"
                                >
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="flex gap-4">
                                            <div className="h-12 w-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-900 font-bold text-lg uppercase shadow-sm">
                                                {res.contactName.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-lg leading-tight uppercase tracking-tight">{res.contactName}</h3>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{res.contactPhone}</p>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                                            res.status === 'confirmed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                res.status === 'cancelled' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                    "bg-amber-50 text-amber-600 border-amber-100"
                                        )}>
                                            {res.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 pb-8 border-b border-slate-50">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><CalendarCheck size={10} /> Date</p>
                                            <p className="font-bold text-slate-900 text-sm">{new Date(res.reservationDate).toLocaleDateString()}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Timer size={10} /> Slot</p>
                                            <p className="font-bold text-slate-900 text-sm">{res.reservationTime}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Users size={10} /> Seats</p>
                                            <p className="font-bold text-slate-900 text-sm">{res.numberOfGuests} Guests</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><User size={10} /> Room</p>
                                            <p className="font-bold text-slate-900 text-sm">Table {res.tableId?.tableNumber || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="mt-8 grid grid-cols-2 gap-3 pt-4">
                                        <button
                                            onClick={() => handleStatusUpdate(res._id, 'confirmed')}
                                            disabled={res.status === 'confirmed'}
                                            className="px-4 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold uppercase tracking-widest text-[9px] border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-30"
                                        >
                                            Confirm Order
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(res._id, 'cancelled')}
                                            disabled={res.status === 'cancelled'}
                                            className="px-4 py-3 bg-rose-50 text-rose-600 rounded-xl font-bold uppercase tracking-widest text-[9px] border border-rose-100 hover:bg-rose-600 hover:text-white transition-all disabled:opacity-30"
                                        >
                                            Deny
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
