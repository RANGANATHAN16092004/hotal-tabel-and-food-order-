'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { customerAPI } from '@/lib/api';
import { customerAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/format';
import { socketService } from '@/lib/socket';
import { toast } from 'react-hot-toast';
import {
  Package,
  Calendar,
  Table as TableIcon,
  User,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  MapPin,
  Phone,
  Building2,
  ChevronDown,
  ChevronUp,
  Star,
  Clock,
  TrendingUp,
  Flame,
  Edit3,
  X,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function CustomerProfile() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [visitSummary, setVisitSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('visits');
  const [expandedHotel, setExpandedHotel] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    profileImage: '',
    coverImage: ''
  });

  useEffect(() => {
    if (!customerAuth.isValidSession(params.hotelId)) {
      router.push(`/${params.hotelId}/login`);
      return;
    }
    const customerData = customerAuth.getCustomer();
    setCustomer(customerData);
    fetchData(customerData.id, customerData.phone || customerData.email);

    // Socket listeners
    const socket = socketService.connect();
    socket.emit('join-customer', customerData.id);

    const handleStatusChange = (data) => {
      fetchData(customerData.id, customerData.phone || customerData.email);
      toast.success(`Order status updated to ${data.status.toUpperCase()}`, {
        icon: '🔥',
        style: {
          borderRadius: '20px',
          background: '#1e293b',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 'bold'
        }
      });
    };

    socket.on('order-status-changed', handleStatusChange);

    socket.on('reservation-status-updated', (data) => {
      fetchData(customerData.id, customerData.phone || customerData.email);
      toast.success(`Reservation status updated to ${data.status.toUpperCase()}`, {
        icon: '📅',
        style: {
          borderRadius: '20px',
          background: '#1e293b',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 'bold'
        }
      });
    });

    return () => {
      socket.off('order-status-changed', handleStatusChange);
      socket.off('reservation-status-updated');
    };
  }, [params.hotelId, router]);

  const fetchData = async (customerId, identifier) => {
    setLoading(true);
    try {
      const calls = [
        customerAPI.getOrders(customerId),
        customerAPI.getReservations(customerId),
        customerAPI.getCustomer(customerId)
      ];
      if (identifier) calls.push(customerAPI.getVisitSummary(identifier));

      const [ordersRes, reservationsRes, customerRes, visitRes] = await Promise.all(calls);

      if (ordersRes.data.success) setOrders(ordersRes.data.orders);
      if (reservationsRes.data.success) setReservations(reservationsRes.data.reservations || []);
      if (customerRes.data.success) {
        setCustomer(customerRes.data.customer);
        customerAuth.setCustomer(customerRes.data.customer);
        setFormData({
          name: customerRes.data.customer.name || '',
          email: customerRes.data.customer.email || '',
          profileImage: customerRes.data.customer.profileImage || '',
          coverImage: customerRes.data.customer.coverImage || ''
        });
      }
      if (visitRes?.data.success) setVisitSummary(visitRes.data.hotels || []);
    } catch (error) {
      console.error('Data load failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'preparing': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'plating': return 'bg-purple-50 text-purple-600 border-purple-200 animate-pulse';
      case 'ready': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  // Totals across all hotels
  const totalSpentAllHotels = visitSummary.reduce((s, h) => s + (h.totalSpent || 0), 0);
  const totalPointsAllHotels = visitSummary.reduce((s, h) => s + (h.loyaltyPoints || 0), 0);
  const totalOrdersAllHotels = visitSummary.reduce((s, h) => s + (h.orders?.length || 0), 0);

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center py-28 space-y-4">
          <div className="h-12 w-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading your history...</p>
        </div>
      </CustomerLayout>
    );
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Saving changes...');
    try {
      const response = await customerAPI.updateProfile(customer.id, formData);
      if (response.data.success) {
        setCustomer(response.data.customer);
        customerAuth.setCustomer(response.data.customer);
        toast.success('Profile updated!', { id: loadingToast });
        setShowEditModal(false);
      }
    } catch (err) {
      toast.error('Update failed', { id: loadingToast });
    }
  };
  const handleSendReport = async () => {
    const loadingToast = toast.loading('Generating your report...', {
      style: {
        borderRadius: '20px',
        background: '#1e293b',
        color: '#fff',
        fontSize: '12px',
        fontWeight: 'bold'
      }
    });

    try {
      const response = await customerAPI.sendGlobalSpendingReport({ 
        phone: customer.phone,
        email: customer.email 
      });

      if (response.data.success) {
        toast.success('Report sent to your email!', {
          id: loadingToast,
          icon: '📧',
          style: {
            borderRadius: '20px',
            background: '#1e293b',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 'bold'
          }
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send report', {
        id: loadingToast,
        style: {
          borderRadius: '20px',
          background: '#1e293b',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 'bold'
        }
      });
    }
  };

  return (
    <CustomerLayout>
      <div className="max-w-6xl mx-auto space-y-12 font-outfit pb-32 transition-all">
        {/* ── Profile Hero - Premium Cinema ── */}
        <div className="relative bg-slate-900 rounded-[4rem] p-12 overflow-hidden shadow-3xl group">
          {customer?.coverImage ? (
            <div className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-1000" style={{ backgroundImage: `url(${customer.coverImage})` }} />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(99,102,241,0.2),transparent_70%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
            <div className="relative group">
              <div className="h-40 w-40 bg-indigo-600 rounded-[3rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 overflow-hidden border-4 border-white/10 p-1">
                {customer?.profileImage ? (
                  <img src={customer.profileImage} alt={customer.name} className="h-full w-full object-cover rounded-[2.8rem]" />
                ) : (
                  <User size={60} />
                )}
              </div>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowEditModal(true)} 
                className="absolute -bottom-2 -right-2 h-14 w-14 bg-white text-slate-900 rounded-2xl flex items-center justify-center shadow-2xl border border-slate-100 hover:text-indigo-600 transition-colors"
              >
                <Edit3 size={24} />
              </motion.button>
            </div>

            <div className="text-center lg:text-left flex-1">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6 mb-6">
                <h1 className="text-5xl font-black text-white tracking-tight uppercase leading-none">{customer?.name}</h1>
                <div className="px-5 py-2 bg-emerald-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-400/20 shadow-xl flex items-center gap-2 w-fit mx-auto lg:mx-0">
                   <Sparkles size={12} /> Elite Member
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <div className="flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-[1.5rem] group hover:bg-white/10 transition-all">
                  <Building2 size={16} className="text-indigo-400" />
                  <span className="text-xs font-black text-white uppercase tracking-widest">{visitSummary.length} Hotels</span>
                </div>
                <div className="flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-[1.5rem] group hover:bg-white/10 transition-all">
                  <ShoppingBag size={16} className="text-emerald-400" />
                  <span className="text-xs font-black text-white uppercase tracking-widest">{totalOrdersAllHotels} Orders</span>
                </div>
                <button onClick={handleSendReport} className="flex items-center gap-3 px-8 py-3 bg-indigo-600 text-white rounded-[1.5rem] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 group">
                  <Mail size={16} className="group-hover:rotate-12 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Generate Spending Report</span>
                </button>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-10 min-w-[200px] text-center shadow-3xl">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 italic">Total Experience</p>
              <p className="text-5xl font-black text-white leading-none mb-2">{formatCurrency(totalSpentAllHotels)}</p>
              <div className="h-1 w-12 bg-indigo-500 mx-auto rounded-full mb-4" />
              <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest">Across All Partner Hotels</p>
            </div>
          </div>
        </div>

        {/* ── Premium Tab Navigation ── */}
        <div className="flex flex-wrap gap-3 bg-slate-100/50 p-2 rounded-[2.5rem] border border-slate-200/50 w-fit mx-auto lg:mx-0 shadow-inner">
          {[
            { id: 'visits', label: 'Global History', icon: Building2 },
            { id: 'orders', label: 'Local Orders', icon: ShoppingBag },
            { id: 'reservations', label: 'Bookings', icon: Calendar }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-3 px-8 py-4 rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 active:scale-95 shadow-sm',
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-2xl'
                  : 'text-slate-400 hover:text-slate-900 hover:bg-white'
              )}
            >
              <tab.icon size={16} strokeWidth={3} /> {tab.label}
            </button>
          ))}
        </div>

        {/* ── Visit History Tab ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'visits' && (
            <motion.div key="visits" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {visitSummary.length === 0 ? (
                <div className="py-24 text-center bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <Building2 size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No hotel visits found.</p>
                </div>
              ) : (
                visitSummary.map((hotel, i) => {
                  const isExpanded = expandedHotel === hotel.hotelId;
                  const isCurrentHotel = hotel.orders.some(o => orders.find(lo => lo._id === o._id));
                  return (
                    <motion.div
                      key={hotel.hotelId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        'bg-white border rounded-[2.5rem] overflow-hidden shadow-sm transition-all',
                        isCurrentHotel ? 'border-indigo-200' : 'border-slate-200'
                      )}
                    >
                      {/* Hotel header */}
                      <button
                        onClick={() => setExpandedHotel(isExpanded ? null : hotel.hotelId)}
                        className="w-full p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 text-left hover:bg-slate-50/50 transition-colors"
                      >
                        <div className={cn(
                          'h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md',
                          isCurrentHotel ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                        )}>
                          <Building2 size={24} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-black text-slate-900 truncate">{hotel.hotelName}</h3>
                            {isCurrentHotel && (
                              <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full border border-indigo-200 shrink-0">
                                Current
                              </span>
                            )}
                          </div>
                          {hotel.hotelAddress && (
                            <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                              <MapPin size={11} /> {hotel.hotelAddress}
                            </p>
                          )}
                          <div className="mt-3 flex flex-wrap gap-3">
                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                              <ShoppingBag size={11} /> {hotel.orders.length} order{hotel.orders.length !== 1 ? 's' : ''}
                            </span>
                            {hotel.lastVisit && (
                              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                                <Clock size={11} /> Last visit {formatDate(hotel.lastVisit)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Per-hotel stats */}
                        <div className="flex gap-4 shrink-0">
                          <div className="text-center px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Spent</p>
                            <p className="text-lg font-black text-slate-900">{formatCurrency(hotel.totalSpent)}</p>
                          </div>
                          <div className="text-center px-5 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
                            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5 flex items-center justify-center gap-1">
                              <Sparkles size={9} /> Credits
                            </p>
                            <p className="text-lg font-black text-indigo-600">{hotel.loyaltyPoints}</p>
                          </div>
                          <div className="flex items-center justify-center w-10 text-slate-300">
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </div>
                        </div>
                      </button>

                      {/* Expanded orders for this hotel */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-8 pb-8 border-t border-slate-100">
                              {hotel.orders.length === 0 ? (
                                <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest py-6">No orders recorded at this hotel.</p>
                              ) : (
                                <div className="mt-6 space-y-3">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Order History</p>
                                  {hotel.orders.map(order => (
                                    <Link
                                      key={order._id}
                                      href={`/order-tracker/${order._id}`}
                                      className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                                    >
                                      <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 group-hover:border-indigo-200 text-slate-400 group-hover:text-indigo-600 transition-colors">
                                          <Package size={18} />
                                        </div>
                                        <div>
                                          <p className="text-xs font-black text-slate-900">#{order._id.slice(-6).toUpperCase()}</p>
                                          <p className="text-[10px] font-bold text-slate-400">{formatDate(order.orderDate)}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <span className={cn('px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border', getStatusStyles(order.status))}>
                                          {order.status}
                                        </span>
                                        <p className="text-sm font-black text-slate-900">{formatCurrency(order.finalAmount || order.totalAmount)}</p>
                                        <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {/* ── Current Hotel Orders Tab ── */}
          {activeTab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {orders.length === 0 ? (
                  <div className="col-span-full py-24 text-center bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <ShoppingBag size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No orders at this hotel yet.</p>
                    <Link href={`/${params.hotelId}/menu`} className="mt-6 inline-flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
                      Browse Menu <ArrowRight size={14} />
                    </Link>
                  </div>
                ) : (
                  orders.map(order => (
                    <Link
                      key={order._id}
                      href={`/order-tracker/${order._id}`}
                      className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200 transition-all flex flex-col group"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors border border-slate-100">
                          <Package size={22} />
                        </div>
                        <span className={cn('px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest border', getStatusStyles(order.status))}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-end mt-auto pt-4 border-t border-slate-50">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Table #{order.tableId?.tableNumber || 'N/A'}</p>
                          <p className="text-2xl font-black text-indigo-600 mt-1">{formatCurrency(order.finalAmount || order.totalAmount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-500">{formatDate(order.orderDate)}</p>
                          <p className="text-[10px] font-bold text-slate-400">#{order._id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ── Reservations Tab ── */}
          {activeTab === 'reservations' && (
            <motion.div key="reservations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reservations.length === 0 ? (
                  <div className="col-span-full py-24 text-center bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <Calendar size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No bookings found.</p>
                    <Link href={`/${params.hotelId}/reserve`} className="mt-6 inline-flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
                      Book a Table <ArrowRight size={14} />
                    </Link>
                  </div>
                ) : (
                  reservations.map(res => (
                    <div key={res._id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                      <div className="flex justify-between items-start mb-8">
                        <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100">
                          <TableIcon size={22} />
                        </div>
                        <span className={cn('px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest border', getStatusStyles(res.status))}>
                          {res.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Table</p>
                          <p className="text-2xl font-black text-slate-900">{res.tableId?.tableNumber || '?'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Guests</p>
                          <p className="text-2xl font-black text-slate-900">{res.numberOfGuests}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-5 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Calendar size={13} />
                          <span className="text-xs font-bold">{formatDate(res.reservationDate)}</span>
                        </div>
                        <span className="text-xs font-black text-slate-900 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                          {res.reservationTime}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal */}
        <AnimatePresence>
          {showEditModal && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowEditModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="relative bg-white rounded-[3rem] w-full max-w-lg shadow-2xl p-10 sm:p-12 max-h-[90vh] overflow-y-auto no-scrollbar"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-widest text-sm">Edit Profile</h2>
                  <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Profile Image URL</label>
                    <input
                      type="url"
                      value={formData.profileImage}
                      onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                      placeholder="https://example.com/profile.jpg"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Cover Image URL</label>
                    <input
                      type="url"
                      value={formData.coverImage}
                      onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                      placeholder="https://example.com/cover.jpg"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-xs"
                    />
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all uppercase tracking-widest text-[11px]">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest text-[11px]">
                      Save Changes
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </CustomerLayout>
  );
}
