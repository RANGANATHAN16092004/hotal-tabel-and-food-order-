'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { adminAPI } from '@/lib/api';

import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Users,
    Clock,
    Search,
    RefreshCcw,
    CheckCircle2,
    X,
    Filter,
    ArrowRight,
    Plus
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function StaffReservationsPage() {
    const { hotelId } = useParams();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [tables, setTables] = useState([]);
    const [formData, setFormData] = useState({
        contactName: '',
        contactPhone: '',
        numberOfGuests: 1,
        reservationDate: new Date().toISOString().split('T')[0],
        reservationTime: '12:00',
        tableId: '',
        specialRequests: ''
    });

    useEffect(() => {
        fetchReservations();
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            const response = await adminAPI.getTables();
            if (response.data.success) {
                setTables(response.data.tables);
            }
        } catch (error) {
            console.error('Failed to fetch tables');
        }
    };

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getReservations();
            if (response.data.success) {
                setReservations(response.data.reservations || []);
            }
        } catch (error) {
            console.error('Failed to fetch reservations');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        const loadingToast = toast.loading('Syncing reservation...');
        try {
            await adminAPI.updateReservation(id, { status });
            toast.success(`Marked as ${status}`, { id: loadingToast });
            fetchReservations();
        } catch (error) {
            toast.error('Sync failed', { id: loadingToast });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading('Creating reservation...');
        try {
            const submitData = {
                ...formData,
                hotelId: hotelId,
                // Backend expects date as Date object
                reservationDate: new Date(formData.reservationDate)
            };
            // Reusing customer creator endpoint for simplicity if available, 
            // but usually we should have a staff creator. 
            // Assuming adminAPI will handle it if we add it.
            const response = await adminAPI.createReservation(submitData);
            if (response.data.success) {
                toast.success('Reservation created!', { id: loadingToast });
                setShowModal(false);
                setFormData({
                    contactName: '',
                    contactPhone: '',
                    numberOfGuests: 1,
                    reservationDate: new Date().toISOString().split('T')[0],
                    reservationTime: '12:00',
                    tableId: '',
                    specialRequests: ''
                });
                fetchReservations();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create reservation', { id: loadingToast });
        }
    };

    return (
        <div className="space-y-8 font-outfit pb-20 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white border border-slate-200 p-8 rounded-[3.5rem] shadow-sm flex flex-col sm:row justify-between items-center gap-6">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                        <Calendar size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-tight">Guest Timeline</h1>
                        <p className="text-slate-500 text-sm font-medium italic">Monitor and execute table reservations.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchReservations}
                        className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                    >
                        <RefreshCcw size={20} className={loading ? 'animate-spin text-indigo-600' : ''} />
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl flex items-center gap-2"
                    >
                        <Plus size={18} /> New Booking
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search guest names or contact signatures..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none font-medium"
                    />
                </div>
                <div className="bg-white border border-slate-200 p-1.5 rounded-[1.5rem] flex gap-1 overflow-x-auto no-scrollbar">
                    {['all', 'pending', 'confirmed', 'cancelled', 'completed'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={cn(
                                "px-6 py-3 rounded-[1.25rem] text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                                filterStatus === status ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-900"
                            )}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode='popLayout'>
                    {filtered.map((res) => (
                        <motion.div
                            key={res._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col group"
                        >
                            <div className="p-8 border-b-2 border-dashed border-slate-100 flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{res.customerName}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-4 flex items-center gap-2">
                                        <Clock size={12} className="text-indigo-500" /> {new Date(res.reservationDate).toLocaleDateString()} at {res.reservationTime}
                                    </p>
                                </div>
                                <span className={cn(
                                    "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                                    res.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                        res.status === 'confirmed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                            res.status === 'completed' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                "bg-rose-50 text-rose-600 border-rose-100"
                                )}>
                                    {res.status}
                                </span>
                            </div>

                            <div className="p-8 flex-1 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50/50 rounded-[1.5rem] border border-slate-100/50">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Guests</p>
                                        <p className="text-lg font-bold text-slate-900">{res.numberOfGuests} Persons</p>
                                    </div>
                                    <div className="p-4 bg-slate-50/50 rounded-[1.5rem] border border-slate-100/50">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Station</p>
                                        <p className="text-lg font-bold text-slate-900">{res.tableDetails?.tableNumber || 'Assigned'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-[1.5rem] bg-indigo-50/30">
                                    <Users size={20} className="text-indigo-600" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Contact Identity</p>
                                        <p className="text-sm font-bold text-slate-700 truncate">{res.customerPhone || 'Anonymous'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 pt-0">
                                <div className="flex gap-3">
                                    {res.status === 'pending' && (
                                        <button
                                            onClick={() => handleStatusUpdate(res._id, 'confirmed')}
                                            className="flex-1 py-4 bg-indigo-600 text-white rounded-[1.25rem] font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                                        >
                                            Confirm Slot <CheckCircle2 size={14} />
                                        </button>
                                    )}
                                    {res.status === 'confirmed' && (
                                        <button
                                            onClick={() => handleStatusUpdate(res._id, 'completed')}
                                            className="flex-1 py-4 bg-slate-900 text-white rounded-[1.25rem] font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                                        >
                                            Arrive Guest <ArrowRight size={14} />
                                        </button>
                                    )}
                                    {(res.status === 'pending' || res.status === 'confirmed') && (
                                        <button
                                            onClick={() => handleStatusUpdate(res._id, 'cancelled')}
                                            className="py-4 px-6 bg-white text-rose-600 border border-rose-100 rounded-[1.25rem] font-bold text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filtered.length === 0 && !loading && (
                <div className="py-32 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-[4rem] text-center">
                    <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8">
                        <Calendar size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tighter">Timeline Empty</h2>
                    <p className="text-slate-400 text-sm mt-2 uppercase tracking-widest font-bold">No active reservation cycles detected.</p>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="relative bg-white rounded-[3rem] w-full max-w-xl shadow-2xl p-10 overflow-hidden"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">New Reservation</h2>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar pr-2">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 text-xs">Guest Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.contactName}
                                            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-sm outline-none"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Details</label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.contactPhone}
                                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-sm outline-none"
                                            placeholder="+91 9999999999"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Execution Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.reservationDate}
                                            onChange={(e) => setFormData({ ...formData, reservationDate: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-sm outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Arrival Time</label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.reservationTime}
                                            onChange={(e) => setFormData({ ...formData, reservationTime: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-sm outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Spatial Index (Table)</label>
                                        <select
                                            required
                                            value={formData.tableId}
                                            onChange={(e) => setFormData({ ...formData, tableId: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-sm outline-none appearance-none"
                                        >
                                            <option value="">Select Table</option>
                                            {tables.map(t => (
                                                <option key={t._id} value={t._id}>Table {t.tableNumber} (Cap: {t.capacity})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Guest Payload (Qty)</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={formData.numberOfGuests}
                                            onChange={(e) => setFormData({ ...formData, numberOfGuests: parseInt(e.target.value) })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-sm outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Special Requirements</label>
                                    <textarea
                                        value={formData.specialRequests}
                                        onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-medium text-sm outline-none min-h-[100px] resize-none italic"
                                        placeholder="Add any specific requests..."
                                    />
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors uppercase tracking-widest text-[10px]">Abort</button>
                                    <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 uppercase tracking-widest text-[10px]">
                                        Confirm Booking
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
