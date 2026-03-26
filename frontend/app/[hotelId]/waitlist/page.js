'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { customerAPI } from '@/lib/api';
import { customerAuth } from '@/lib/auth';

import {
  Clock,
  Users,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { socketService } from '@/lib/socket';
import { toast } from 'react-hot-toast';

export default function WaitlistPage() {
  const params = useParams();
  const router = useRouter();
  const [myEntry, setMyEntry] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    numberOfGuests: 2,
    specialRequests: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [estimate, setEstimate] = useState(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [customer, setCustomer] = useState(null);

  const fetchEstimate = async (hotelId, numberOfGuests) => {
    if (!hotelId) return;
    setLoadingEstimate(true);
    try {
      const response = await customerAPI.getWaitlistEstimate(hotelId, numberOfGuests || 2);
      if (response.data.success) {
        setEstimate(response.data);
      }
    } catch (error) {
      console.error('Error fetching estimate:', error);
    } finally {
      setLoadingEstimate(false);
    }
  };

  useEffect(() => {
    if (!customerAuth.isValidSession(params.hotelId)) {
      router.push(`/${params.hotelId}/login`);
      return;
    }
    const customerData = customerAuth.getCustomer();
    setCustomer(customerData);
    setFormData(prev => ({
      ...prev,
      customerName: customerData.name,
      phone: customerData.phone
    }));

    fetchEstimate(customerData.hotelId, 2);
    checkMyStatus(customerData.hotelId, customerData.phone);

    // Socket listeners
    const socket = socketService.connect();
    socket.emit('join-hotel', customerData.hotelId);

    socket.on('waitlist-updated', (data) => {
      // Refresh estimate and status
      fetchEstimate(customerData.hotelId, formData.numberOfGuests);
      checkMyStatus(customerData.hotelId, customerData.phone);

      if (data.type === 'status_change' && data.customerPhone === customerData.phone) {
        if (data.status === 'notified') {
          toast.success('Your table is ready! Please proceed to the host desk.', { duration: 10000, icon: '🎉' });
        }
      }
    });

    return () => {
      socket.off('waitlist-updated');
    };
  }, [params.hotelId, router]);

  const checkMyStatus = async (hotelId, phone) => {
    try {
      const response = await customerAPI.getWaitlistStatus(hotelId, phone);
      if (response.data.success) {
        setMyEntry(response.data.entry);
      }
    } catch (error) {
      console.error('Error checking waitlist status:', error);
    }
  };

  useEffect(() => {
    if (customer && formData.numberOfGuests && !myEntry) {
      const timer = setTimeout(() => {
        fetchEstimate(customer.hotelId, formData.numberOfGuests);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.numberOfGuests, customer, myEntry]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const data = {
        hotelId: customer.hotelId,
        customerName: formData.customerName,
        phone: formData.phone,
        numberOfGuests: parseInt(formData.numberOfGuests),
        specialRequests: formData.specialRequests || undefined
      };

      const response = await customerAPI.addToWaitlist(data);
      if (response.data.success) {
        toast.success('Joined waitlist successfully');
        setMyEntry(response.data.waitlist);
        fetchEstimate(customer.hotelId, 2);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to join waitlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!customer) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 border-4 border-slate-200 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest"
          >
            <Sparkles size={12} /> Priority Queue Active
          </motion.div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight italic">
            Smart<span className="text-indigo-600 italic">Waitlist</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {myEntry ? 'Track your live position in the queue.' : 'Join the digital queue and enjoy your time elsewhere.'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {estimate && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                  <Clock size={20} />
                </div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Wait Time</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {loadingEstimate ? '...' : `${estimate.estimatedWaitTime || 0}m`}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                  <Users size={20} />
                </div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                  {myEntry ? 'Your Rank' : 'Queue Size'}
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {loadingEstimate ? '...' : myEntry ? `#${myEntry.position}` : `${estimate.positionInQueue || 1} Deep`}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {myEntry ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 sm:p-10 shadow-xl overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
              <Sparkles className="w-40 h-40" />
            </div>

            <div className="relative space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Registration</p>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{myEntry.customerName}</h2>
                </div>
                <div className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                  myEntry.status === 'notified'
                    ? "bg-emerald-50 border-emerald-100 text-emerald-600 animate-pulse"
                    : "bg-indigo-50 border-indigo-100 text-indigo-600"
                )}>
                  {myEntry.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 py-6 border-y border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Party Size</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{myEntry.numberOfGuests} Guests</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Joined At</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{new Date(myEntry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              {myEntry.status === 'notified' ? (
                <div className="p-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-3xl space-y-4">
                  <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={24} />
                    <p className="font-bold">Your Table is Ready!</p>
                  </div>
                  <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70 leading-relaxed font-medium">Please proceed to the entrance host station immediately. We'll hold your table for 10 minutes.</p>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] uppercase tracking-widest">
                    <Info size={14} /> Tracking Progress
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Relax! We'll notify you here and via SMS when it's your turn. Feel free to browse the menu in the meantime.</p>
                  <Link href={`/${params.hotelId}/menu`} className="inline-block mt-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b-2 border-indigo-600">Browse Menu While You Wait</Link>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 sm:p-10 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden transition-colors">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
              <Clock className="w-40 h-40" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
                  <input
                    type="text"
                    required
                    readOnly
                    value={formData.customerName}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all opacity-80"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">Phone Link</label>
                  <input
                    type="tel"
                    required
                    readOnly
                    value={formData.phone}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all opacity-80"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-widest flex items-center justify-between">
                  <span>Party Size</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{formData.numberOfGuests} Persons</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFormData({ ...formData, numberOfGuests: num })}
                      className={cn(
                        "flex-1 h-12 rounded-xl font-black text-sm transition-all border",
                        formData.numberOfGuests === num
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100/50"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-400"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">Contextual Requests</label>
                <textarea
                  value={formData.specialRequests}
                  onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all min-h-[120px] resize-none"
                  placeholder="Birthdays, preferences, table locations..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-800 dark:hover:bg-slate-100 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                ) : (
                  <>Join Waitlist <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 bg-slate-100 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] uppercase tracking-widest">
              <Info size={14} /> Smart Notifications
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">We will ping you via WhatsApp and SMS the moment your station is ready. Please arrive within 10 minutes.</p>
          </div>
          <div className="p-6 bg-slate-100 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] uppercase tracking-widest">
              <CheckCircle2 size={14} /> Live Sync
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Your position in the queue is updated in real-time. Keep this page open for live pulse updates.</p>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}

