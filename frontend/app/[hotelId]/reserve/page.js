'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { customerAPI } from '@/lib/api';
import { customerAuth } from '@/lib/auth';
import {
    Calendar,
    Clock,
    Users,
    MessageSquare,
    ArrowRight,
    CheckCircle2,
    Table as TableIcon,
    ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ReservePage() {
    const params = useParams();
    const router = useRouter();
    const [formData, setFormData] = useState({
        date: '',
        time: '',
        guests: 2,
        specialRequests: ''
    });
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [customer, setCustomer] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);

    useEffect(() => {
        if (!customerAuth.isValidSession(params.hotelId)) {
            router.push(`/${params.hotelId}/login`);
            return;
        }
        const customerData = customerAuth.getCustomer();
        setCustomer(customerData);
        fetchTables(customerData.hotelId);
    }, [params.hotelId]);

    const fetchTables = async (hotelId) => {
        try {
            const response = await customerAPI.getTables(hotelId);
            if (response.data.success) {
                setTables(response.data.tables || []);
            }
        } catch (error) {
            console.error('Table fetch error');
        }
    };

    const fetchAvailableSlots = async (tableId, date) => {
        if (!tableId || !date) return;
        try {
            const response = await customerAPI.getDataAvailableSlots(tableId, date);
            if (response.data.success) {
                setAvailableSlots(response.data.availableSlots || []);
            }
        } catch (error) {
            console.error('Slots fetch error');
        }
    };

    useEffect(() => {
        if (selectedTable && formData.date) {
            fetchAvailableSlots(selectedTable, formData.date);
        }
    }, [selectedTable, formData.date]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTable || !formData.time) return toast.error('Complete all fields');
        setLoading(true);
        const toastId = toast.loading('Reserving table...');
        try {
            await customerAPI.createReservation({
                hotelId: customer.hotelId,
                customerId: customer.id,
                tableId: selectedTable,
                reservationDate: formData.date,
                reservationTime: formData.time,
                numberOfGuests: parseInt(formData.guests),
                specialRequests: formData.specialRequests || undefined,
                contactName: customer.name,
                contactPhone: customer.phone,
            });
            setSuccess(true);
            toast.success('Booked!', { id: toastId });
            setTimeout(() => router.push(`/${params.hotelId}/profile`), 3000);
        } catch (error) {
            toast.error('Booking failed', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <CustomerLayout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-8 font-outfit">
                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="h-28 w-28 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-100">
                        <CheckCircle2 size={50} />
                    </motion.div>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 border-b-4 border-emerald-500 pb-2 inline-block">Table Booked!</h2>
                        <p className="text-slate-500 mt-6 font-medium italic max-w-sm">We've secured your spot. You can track your booking in your profile.</p>
                    </div>
                    <button onClick={() => router.push(`/${params.hotelId}/profile`)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl">My Reservations</button>
                </div>
            </CustomerLayout>
        );
    }

    return (
        <CustomerLayout>
            <div className="max-w-4xl mx-auto space-y-10 font-outfit pb-20">
                <div className="flex items-center gap-4">
                    <Link href={`/${params.hotelId}/menu`} className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                        <ChevronLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Table Reservation</h1>
                        <p className="text-slate-500 mt-1 font-medium italic">Secure your dining experience in advance.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Calendar size={14} className="text-indigo-600" /> Dining Date
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 font-bold"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Users size={14} className="text-indigo-600" /> Guest Count
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 font-bold"
                                            value={formData.guests}
                                            onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) || 1 })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <TableIcon size={14} className="text-indigo-600" /> Pick your Table
                                    </label>
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                        {tables.filter(t => t.status !== 'occupied').map(table => {
                                            const isSelected = selectedTable === table._id;
                                            const isTooSmall = formData.guests > table.capacity;
                                            return (
                                                <button
                                                    key={table._id}
                                                    type="button"
                                                    disabled={isTooSmall}
                                                    onClick={() => setSelectedTable(table._id)}
                                                    className={cn(
                                                        "p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1",
                                                        isSelected
                                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                                                            : "bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                                    )}
                                                >
                                                    <span className="text-xl font-bold tracking-tight">{table.tableNumber}</span>
                                                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">{table.capacity}P</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {selectedTable && availableSlots.length > 0 && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-200">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Clock size={14} className="text-indigo-600" /> Select Time Slot
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {availableSlots.map((slot, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, time: slot })}
                                                        className={cn(
                                                            "px-5 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest",
                                                            formData.time === slot
                                                                ? "bg-slate-900 text-white shadow-md"
                                                                : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        {slot}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <MessageSquare size={14} className="text-indigo-600" /> Special Requests
                                    </label>
                                    <textarea
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[2rem] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 font-medium italic min-h-[120px] resize-none"
                                        value={formData.specialRequests}
                                        onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                                        placeholder="Dietary requirements, occasion, etc..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !selectedTable || !formData.date || !formData.time}
                                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                                >
                                    {loading ? 'Processing...' : 'Reserve Table'} <ArrowRight size={20} />
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
                            <h3 className="text-lg font-bold uppercase tracking-widest text-[12px] mb-4">Advance Booking</h3>
                            <p className="text-indigo-100 text-sm font-medium leading-relaxed opacity-90 italic">
                                Reserve your favorite spot to avoid waiting. Early bookings earn 50 bonus loyalty credits on check-in.
                            </p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 text-center shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed italic">
                                Note: Tables are held for 15 minutes past the booking time.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
