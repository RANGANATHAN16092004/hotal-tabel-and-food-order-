'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { socketService } from '@/lib/socket';
import {
  ShoppingBag,
  Search,
  Clock,
  ExternalLink,
  X,
  CheckCircle2,
  XCircle,
  ClipboardList,
  User,
  Table as TableIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

function OrdersContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();

    // Socket listeners
    const socket = socketService.connect();
    const adminData = JSON.parse(localStorage.getItem('admin_user') || '{}');
    const hotelId = adminData.hotelId || adminData.id;

    if (hotelId) {
      socket.emit('join-hotel', hotelId);

      socket.on('new-order', () => {
        fetchOrders();
        toast.success('New order received!', { icon: '🛍️' });
      });

      socket.on('order-updated', () => {
        fetchOrders();
      });
    }

    return () => {
      socket.off('new-order');
      socket.off('order-updated');
    };
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await adminAPI.getOrders(params);
      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    const loadingToast = toast.loading('Updating status...');
    try {
      await adminAPI.updateOrderStatus(orderId, newStatus);
      toast.success(`Marked as ${newStatus}`, { id: loadingToast });
      fetchOrders();
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      toast.error('Update failed', { id: loadingToast });
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'preparing': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'ready': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const filteredOrders = orders.filter(order =>
    order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.tableId?.tableNumber?.toString().includes(searchQuery)
  );

  return (
    <div className="space-y-8 font-outfit">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Orders</h1>
        <p className="text-slate-500 mt-1 font-medium italic">Monitor and manage restaurant orders in real-time.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setStatusFilter('')}
            className={cn(
              "px-6 py-2.5 rounded-xl whitespace-nowrap text-[10px] font-bold uppercase tracking-widest transition-all",
              statusFilter === '' ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
            )}
          >
            All
          </button>
          {['pending', 'preparing', 'ready', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-6 py-2.5 rounded-xl whitespace-nowrap text-[10px] font-bold uppercase tracking-widest transition-all",
                statusFilter === status ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">Order Info</th>
                <th className="px-8 py-5">Customer / Table</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-center">Items</th>
                <th className="px-8 py-5">Total</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.map((order, index) => (
                <motion.tr
                  key={order._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <ClipboardList size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">#{order._id.slice(-6).toUpperCase()}</p>
                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase">
                          <Clock size={10} /> {new Date(order.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-slate-900 leading-tight">{order.customerId?.name || 'Walk-in Guest'}</p>
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Table {order.tableId?.tableNumber || 'N/A'}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="relative group/status">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                        disabled={['completed', 'cancelled'].includes(order.status)}
                        className={cn(
                          "appearance-none px-4 py-2 pr-8 rounded-xl text-[10px] font-bold uppercase tracking-widest border cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500/20 transition-all w-full disabled:opacity-50 disabled:cursor-not-allowed",
                          getStatusStyles(order.status)
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {['pending', 'preparing', 'ready', 'completed', 'cancelled'].map(status => (
                          <option key={status} value={status} className="bg-white text-slate-900">
                            {status}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="inline-block px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">
                      {order.items?.length || 0}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-slate-900">{formatCurrency(order.totalAmount)}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      <ExternalLink size={20} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    <ShoppingBag size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Order Details</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">#{selectedOrder._id.toUpperCase()}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-2 gap-8 mb-10">
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">Customer</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{selectedOrder.customerId?.name || 'Walk-in Guest'}</p>
                        <p className="text-xs text-slate-500">{selectedOrder.customerId?.phone || 'No phone'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l-2 border-emerald-500 pl-3">Table Location</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                        <TableIcon size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">Table {selectedOrder.tableId?.tableNumber || 'N/A'}</p>
                        <p className="text-xs text-slate-500">Dine-in Service</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-4">Items Summary</p>
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex justify-between items-center group">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center font-bold text-indigo-600 border border-slate-100">
                          {item.quantity}×
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{formatCurrency(item.price)} per unit</p>
                        </div>
                      </div>
                      <p className="font-bold text-slate-900">
                        {formatCurrency(parseFloat(item.price) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-10 bg-slate-50 border-t border-slate-100">
                <div className="flex justify-between items-center mb-8">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Grand Total</span>
                  <span className="text-4xl font-bold text-indigo-600">
                    {formatCurrency(selectedOrder.totalAmount)}
                  </span>
                </div>

                {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleStatusUpdate(selectedOrder._id, 'completed')}
                      className="py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={18} /> Complete Order
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedOrder._id, 'cancelled')}
                      className="py-4 bg-white text-rose-600 rounded-2xl font-bold text-xs uppercase tracking-widest border border-rose-100 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle size={18} /> Cancel Order
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <AdminLayout>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-12 w-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Loading Orders...</p>
          </div>
        }
      >
        <OrdersContent />
      </Suspense>
    </AdminLayout>
  );
}
