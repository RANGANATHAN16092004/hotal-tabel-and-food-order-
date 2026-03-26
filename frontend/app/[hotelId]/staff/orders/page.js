'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { adminAPI } from '@/lib/api';

import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingBag,
    Clock,
    CheckCircle2,
    Search,
    RefreshCcw,
    UtensilsCrossed,
    ArrowRight,
    Plus,
    X
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function StaffOrdersPage() {
    const { hotelId } = useParams();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // New Order State
    const [showNewOrderModal, setShowNewOrderModal] = useState(false);
    const [tables, setTables] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedTable, setSelectedTable] = useState('');
    const [staffCart, setStaffCart] = useState([]);
    const [menuSearch, setMenuSearch] = useState('');
    const [selectedMenuCategory, setSelectedMenuCategory] = useState('all');

    useEffect(() => {
        fetchOrders();
        fetchTables();
        fetchMenu();
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchTables = async () => {
        try {
            const response = await adminAPI.getTables();
            if (response.data.success) {
                setTables(response.data.tables.filter(t => t.status === 'available' || t.status === 'occupied'));
            }
        } catch (error) {
            console.error('Failed to fetch tables');
        }
    };

    const fetchMenu = async () => {
        try {
            const response = await adminAPI.getMenu();
            if (response.data.success) {
                setMenuItems(response.data.menuItems);
                // Extract unique categories
                const cats = ['all', ...new Set(response.data.menuItems.map(item => item.category))];
                setCategories(cats);
            }
        } catch (error) {
            console.error('Failed to fetch menu');
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await adminAPI.getOrders();
            if (response.data.success) {
                setOrders(response.data.orders);
            }
        } catch (error) {
            console.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        const loadingToast = toast.loading('Syncing order status...');
        try {
            await adminAPI.updateOrderStatus(id, status);
            toast.success(`Order ${status}`, { id: loadingToast });
            fetchOrders();
        } catch (error) {
            toast.error('Update failed', { id: loadingToast });
        }
    };

    const addToStaffCart = (item) => {
        const existing = staffCart.find(i => i.menuItemId === item._id);
        if (existing) {
            setStaffCart(staffCart.map(i => i.menuItemId === item._id ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setStaffCart([...staffCart, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1 }]);
        }
        toast.success(`${item.name} added`);
    };

    const removeFromStaffCart = (menuItemId) => {
        setStaffCart(staffCart.filter(i => i.menuItemId !== menuItemId));
    };

    const handleCreateOrder = async (e) => {
        e.preventDefault();
        if (!selectedTable) return toast.error('Selection point missing (Table ID)');
        if (staffCart.length === 0) return toast.error('Payload empty (Cart)');

        const loadingToast = toast.loading('Initializing manual order...');
        try {
            const orderData = {
                tableId: selectedTable,
                items: staffCart.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
                hotelId: hotelId
            };
            const response = await adminAPI.createOrder(orderData);
            if (response.data.success) {
                toast.success('Manual order confirmed!', { id: loadingToast });
                setShowNewOrderModal(false);
                setStaffCart([]);
                setSelectedTable('');
                fetchOrders();
            }
        } catch (error) {
            toast.error('Initialization failed', { id: loadingToast });
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.tableName?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 font-outfit pb-20 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white border border-slate-200 p-8 rounded-[3.5rem] shadow-sm flex flex-col sm:row justify-between items-center gap-6">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                        <UtensilsCrossed size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-tight">Interaction Queue</h1>
                        <p className="text-slate-500 text-sm font-medium italic">Manage lifecycle of incoming customer orders.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchOrders}
                        className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCcw size={20} className={loading ? 'animate-spin text-blue-600' : ''} />
                    </button>
                    <button
                        onClick={() => setShowNewOrderModal(true)}
                        className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl flex items-center gap-2"
                    >
                        <Plus size={18} /> Manual Entry
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Deconstruct orders by ID or table index..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none font-medium"
                    />
                </div>
                <div className="bg-white border border-slate-200 p-1.5 rounded-[1.5rem] flex gap-1 overflow-x-auto no-scrollbar">
                    {['all', 'pending', 'preparing', 'ready'].map(status => (
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
                    {filteredOrders.map((order) => (
                        <motion.div
                            key={order._id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm flex flex-col group hover:shadow-xl hover:shadow-blue-500/5 transition-all"
                        >
                            <div className="p-8 border-b-2 border-dashed border-slate-100 bg-slate-50/30 flex justify-between items-center relative">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{order.tableName || 'Carry-out'}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Clock size={12} className="text-slate-400" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Handled at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                                <span className={cn(
                                    "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                                    order.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                        order.status === 'preparing' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                            order.status === 'ready' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                "bg-slate-50 text-slate-500 border-slate-100"
                                )}>
                                    {order.status}
                                </span>
                            </div>

                            <div className="p-8 flex-1 space-y-4">
                                {order.items?.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                                        <div className="flex items-center gap-3">
                                            <span className="h-6 w-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-900">{item.quantity}</span>
                                            <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">{item.menuItemId?.name}</span>
                                        </div>
                                        {item.status === 'ready' && <CheckCircle2 size={16} className="text-emerald-500" />}
                                    </div>
                                ))}
                            </div>

                            <div className="p-8 pt-0">
                                <div className="flex justify-between items-center mb-8 pt-6 border-t border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aggregate total</span>
                                    <span className="text-2xl font-bold text-slate-900 tracking-tighter">{formatCurrency(order.totalAmount)}</span>
                                </div>

                                <div className="flex gap-3">
                                    {order.status === 'pending' && (
                                        <button
                                            onClick={() => handleStatusUpdate(order._id, 'preparing')}
                                            className="flex-1 py-4 bg-blue-600 text-white rounded-[1.25rem] font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            Commit Preparation <ArrowRight size={14} />
                                        </button>
                                    )}
                                    {order.status === 'preparing' && (
                                        <button
                                            onClick={() => handleStatusUpdate(order._id, 'ready')}
                                            className="flex-1 py-4 bg-emerald-600 text-white rounded-[1.25rem] font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            Execution Ready <CheckCircle2 size={14} />
                                        </button>
                                    )}
                                    {order.status === 'ready' && (
                                        <button
                                            onClick={() => handleStatusUpdate(order._id, 'completed')}
                                            className="flex-1 py-4 bg-slate-900 text-white rounded-[1.25rem] font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            Complete Cycle
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredOrders.length === 0 && !loading && (
                <div className="py-32 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-[4rem] text-center">
                    <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8">
                        <ShoppingBag size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tighter">Queue Exhausted</h2>
                    <p className="text-slate-400 text-sm mt-2 uppercase tracking-widest font-bold">No incoming interaction signals detected.</p>
                </div>
            )}

            {/* Manual Order Modal */}
            <AnimatePresence>
                {showNewOrderModal && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNewOrderModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="relative bg-white rounded-[3rem] w-full max-w-5xl h-[85vh] shadow-2xl overflow-hidden flex flex-col"
                        >
                            <div className="p-10 pb-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                                        <Plus size={24} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Terminal Order Initialization</h2>
                                </div>
                                <button onClick={() => setShowNewOrderModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24} /></button>
                            </div>

                            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                                {/* Menu Selection */}
                                <div className="lg:w-2/3 p-10 overflow-y-auto no-scrollbar border-r border-slate-100 bg-white">
                                    <div className="space-y-6 mb-8">
                                        <div className="relative">
                                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Search menu catalogue..."
                                                value={menuSearch}
                                                onChange={(e) => setMenuSearch(e.target.value)}
                                                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none font-bold text-sm"
                                            />
                                        </div>
                                        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                                            {categories.map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setSelectedMenuCategory(cat)}
                                                    className={cn(
                                                        "px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                                        selectedMenuCategory === cat ? "bg-blue-600 text-white shadow-lg" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                                    )}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {menuItems.filter(item => {
                                            const matchesCat = selectedMenuCategory === 'all' || item.category === selectedMenuCategory;
                                            const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase());
                                            return matchesCat && matchesSearch;
                                        }).map(item => (
                                            <div key={item._id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-[2rem] flex items-center justify-between group hover:bg-white hover:border-blue-200 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <img src={item.image} className="h-14 w-14 rounded-xl object-cover shadow-sm" alt="" />
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm leading-tight">{item.name}</p>
                                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">{formatCurrency(item.price)}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => addToStaffCart(item)}
                                                    className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Order Summary */}
                                <div className="lg:w-1/3 p-10 bg-slate-50/50 flex flex-col">
                                    <div className="space-y-8 flex-1">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Spatial Index (Table)</p>
                                            <select
                                                value={selectedTable}
                                                onChange={(e) => setSelectedTable(e.target.value)}
                                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-bold text-sm outline-none appearance-none shadow-sm"
                                            >
                                                <option value="">Select Target Table</option>
                                                {tables.map(t => (
                                                    <option key={t._id} value={t._id}>Table {t.tableNumber} ({t.status})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cart Manifest</p>
                                            <div className="space-y-3 max-h-[30vh] overflow-y-auto no-scrollbar pr-2">
                                                {staffCart.map(item => (
                                                    <div key={item.menuItemId} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            <span className="h-6 w-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black">{item.quantity}</span>
                                                            <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{item.name}</span>
                                                        </div>
                                                        <button onClick={() => removeFromStaffCart(item.menuItemId)} className="text-rose-400 hover:text-rose-600 p-1"><X size={16} /></button>
                                                    </div>
                                                ))}
                                                {staffCart.length === 0 && <p className="text-center py-10 text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">Payload Empty</p>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-10 pt-8 border-t border-slate-200 space-y-6">
                                        <div className="flex justify-between items-center px-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregate Total</p>
                                            <p className="text-3xl font-bold text-slate-900 tracking-tighter">
                                                {formatCurrency(staffCart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0))}
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleCreateOrder}
                                            disabled={!selectedTable || staffCart.length === 0}
                                            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-slate-800 disabled:opacity-30 transition-all active:scale-95"
                                        >
                                            Finalize Order Launch
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
