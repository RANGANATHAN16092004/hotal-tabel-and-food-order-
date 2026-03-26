'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '@/lib/api';
import { staffAuth } from '@/lib/staffAuth';
import { socketService } from '@/lib/socket';
import {
    ChefHat,
    AlertCircle,
    Timer,
    CheckCircle,
    Play,
    UtensilsCrossed,
    RefreshCw,
    CheckCircle2,
    LayoutGrid,
    BookOpen,
    Users,
    Search,
    Ban,
    CircleDashed,
    Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card'; // Assuming Card component exists or I'll use div

export default function StaffKitchenPage() {
    // Tabs: 'orders', 'tables', 'menu'
    const [activeTab, setActiveTab] = useState('orders');

    // Data States
    const [orders, setOrders] = useState([]);
    const [tables, setTables] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);

    // Loading States
    const [loading, setLoading] = useState(true);
    const [isAutoRefresh, setIsAutoRefresh] = useState(true);

    // Filter States
    const [menuSearch, setMenuSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // --- Fetchers ---

    const fetchOrders = useCallback(async () => {
        try {
            const response = await adminAPI.getKitchenOrders();
            if (response.data.success) {
                setOrders(response.data.orders);
            }
        } catch (error) {
            console.error('Orders fetch failed', error);
        }
    }, []);

    const fetchTables = useCallback(async () => {
        try {
            const response = await adminAPI.getTables();
            if (response.data.success) {
                setTables(response.data.tables);
            }
        } catch (error) {
            toast.error('Failed to load tables');
        }
    }, []);

    const fetchMenu = useCallback(async () => {
        try {
            // Fetch all items
            const response = await adminAPI.getMenu();
            if (response.data.success) {
                setMenuItems(response.data.menuItems);
                // Extract unique categories
                const cats = ['All', ...new Set(response.data.menuItems.map(item => item.category))];
                setCategories(cats);
            }
        } catch (error) {
            toast.error('Failed to load menu');
        }
    }, []);

    // --- Effects ---

    useEffect(() => {
        // Initial Fetch based on active tab
        setLoading(true);
        const load = async () => {
            if (activeTab === 'orders') await fetchOrders();
            if (activeTab === 'tables') await fetchTables();
            if (activeTab === 'menu') await fetchMenu();
            setLoading(false);
        };
        load();

        // Socket listeners
        const staff = staffAuth.getStaff();
        if (staff?.hotelId) {
            const socket = socketService.connect();
            socket.emit('join-hotel', staff.hotelId);

            socket.on('new-order', (data) => {
                if (activeTab === 'orders') {
                    fetchOrders();
                    toast.success('NEW ORDER RECEIVED!', {
                        icon: '🔔',
                        duration: 5000,
                        style: {
                            background: '#1e293b',
                            color: '#fff',
                            fontWeight: 'bold'
                        }
                    });
                    // Play notification sound
                    try {
                        const audio = new Audio('/notifications/new-order.mp3');
                        audio.play();
                    } catch (e) {
                        console.warn('Audio play failed', e);
                    }
                }
            });

            return () => {
                socket.off('new-order');
            };
        }
    }, [activeTab, fetchOrders, fetchTables, fetchMenu]);

    // Auto Refresh for Orders (Poll as fallback or supplementary)
    useEffect(() => {
        let interval;
        if (activeTab === 'orders' && isAutoRefresh) {
            interval = setInterval(fetchOrders, 30000);
        }
        return () => clearInterval(interval);
    }, [activeTab, isAutoRefresh, fetchOrders]);


    // --- Actions ---

    const handleItemStatus = async (orderId, itemId, status) => {
        // Optimistic update
        setOrders(prev => prev.map(order =>
            order._id === orderId
                ? { ...order, items: order.items.map(i => i._id === itemId ? { ...i, status } : i) }
                : order
        ));

        try {
            await adminAPI.updateKitchenItemStatus(orderId, itemId, status);
            if (status === 'completed') toast.success('Dish Prepared');
        } catch (error) {
            console.error('Update failed', error);
            const msg = error.response?.data?.message || 'Failed to update status';
            toast.error(msg);
            fetchOrders(); // Revert on fail
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        const loadingToast = toast.loading(`Updating order to ${newStatus}...`);
        try {
            await adminAPI.updateOrderStatus(orderId, newStatus);
            toast.success(`Order marked as ${newStatus}`, { id: loadingToast });
            // If completed or cancelled, remove from view? Or just update status?
            // KDS usually hides completed/cancelled orders to keep board clean
            if (['completed', 'cancelled'].includes(newStatus)) {
                setOrders(prev => prev.filter(o => o._id !== orderId));
            } else {
                setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
            }
        } catch (error) {
            console.error('Order update failed', error);
            const msg = error.response?.data?.message || 'Update failed';
            toast.error(msg, { id: loadingToast });
        }
    };

    const toggleTableStatus = async (table) => {
        // Cycle: available -> occupied -> dirty -> available
        // Note: Backend requires lowercase enum values
        const currentStatus = table.status.toLowerCase();

        const statusCycle = {
            'available': 'occupied',
            'occupied': 'dirty',
            'dirty': 'available',
            'reserved': 'available', // Reset reserved to available
        };
        const nextStatus = statusCycle[currentStatus] || 'available';

        try {
            await adminAPI.updateTable(table._id, { status: nextStatus });
            setTables(prev => prev.map(t => t._id === table._id ? { ...t, status: nextStatus } : t));
            toast.success(`Table ${table.tableNumber} is now ${nextStatus}`);
        } catch (error) {
            console.error('Update failed', error);
            toast.error('Failed to update table status');
        }
    };



    const toggleItemAvailability = async (item) => {
        try {
            // Using updateMenuItem, assuming 'isAvailable' field exists or similar. 
            // If backend doesn't explicitly support a toggle endpoint, we update the whole item.
            // Let's assume standard 'isAvailable' boolean.
            const newAvailability = !item.isAvailable;

            await adminAPI.updateMenuItem(item._id, { isAvailable: newAvailability });
            setMenuItems(prev => prev.map(i => i._id === item._id ? { ...i, isAvailable: newAvailability } : i));

            toast.success(`${item.name} is now ${newAvailability ? 'In Stock' : 'Out of Stock'}`);
        } catch (error) {
            toast.error('Failed to update menu item');
        }
    };

    // --- Helpers ---

    const getUrgencyColor = (orderDate) => {
        const mins = Math.floor((new Date() - new Date(orderDate)) / 60000);
        if (mins < 10) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (mins < 20) return 'bg-amber-50 text-amber-600 border-amber-100';
        return 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse';
    };

    const printKOT = (order) => {
        const printWindow = window.open('', '_blank');
        const html = `
            <html>
            <head>
                <title>KOT - Table ${order.tableId?.tableNumber || 'Takeaway'}</title>
                <style>
                    body { font-family: monospace; padding: 20px; font-size: 14px; color: #000; width: 300px; margin: 0 auto;}
                    h1 { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; font-size: 24px;}
                    .time { text-align: center; margin-bottom: 20px; font-weight: bold;}
                    .item { display: flex; align-items: flex-start; margin-bottom: 10px; border-bottom: 1px dashed #ccc; padding-bottom: 10px;}
                    .qty { font-weight: bold; width: 40px; font-size: 18px;}
                    .details { flex: 1; }
                    .name { font-weight: bold; font-size: 16px; margin-bottom: 4px;}
                    .notes { font-style: italic; font-size: 12px; }
                </style>
            </head>
            <body onload="window.print(); window.close();">
                <h1>KOT - TBL ${order.tableId?.tableNumber || '?'}</h1>
                <div class="time">${new Date().toLocaleTimeString()}</div>
                <div>
                    ${order.items.map(item => `
                        <div class="item">
                            <div class="qty">${item.quantity}x</div>
                            <div class="details">
                                <div class="name">${item.name}</div>
                                ${item.specialInstructions ? `<div class="notes">* ${item.specialInstructions}</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const sortedMenuItems = menuItems.filter(item =>
        (selectedCategory === 'All' || item.category === selectedCategory) &&
        item.name.toLowerCase().includes(menuSearch.toLowerCase())
    );

    // --- Render ---

    return (
        <div className="space-y-8 font-outfit pb-20 max-w-[1600px] mx-auto">
            {/* Header & Tabs */}
            <div className="bg-white border border-slate-200 p-4 rounded-[2rem] shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4 sticky top-4 z-30">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full lg:w-auto overflow-x-auto">
                    {[
                        { id: 'orders', label: 'Active Orders', icon: ChefHat },
                        { id: 'tables', label: 'Table Status', icon: LayoutGrid },
                        { id: 'menu', label: 'Pantry & Menu', icon: BookOpen },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap",
                                activeTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                            )}
                        >
                            <tab.icon size={20} className={activeTab === tab.id ? "text-indigo-600" : ""} />
                            {tab.label}
                            {tab.id === 'orders' && orders.length > 0 && (
                                <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full">{orders.length}</span>
                            )}
                        </button>
                    ))}
                </div>

                {activeTab === 'orders' && (
                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                        <button onClick={fetchOrders} className="p-2 hover:bg-white rounded-lg transition-colors"><RefreshCw size={18} className="text-slate-500" /></button>
                        <div className="h-4 w-px bg-slate-300" />
                        <span className="text-xs font-bold text-slate-500 px-2">{isAutoRefresh ? 'Live Updates On' : 'Live Updates Off'}</span>
                    </div>
                )}
            </div>

            {/* TAB CONTENT: ORDERS */}
            {activeTab === 'orders' && (
                <div className="min-h-[500px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                    ) : orders.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
                            <UtensilsCrossed size={64} className="text-slate-300 mb-4" />
                            <h2 className="text-2xl font-bold text-slate-400">All Caught Up!</h2>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            <AnimatePresence mode='popLayout'>
                                {orders.map((order) => (
                                    <motion.div
                                        key={order._id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden flex flex-col shadow-sm"
                                    >
                                        <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Table</p>
                                                <p className="text-3xl font-bold">{order.tableId?.tableNumber || '?'}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => printKOT(order)} className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-all">
                                                    <Printer size={14} />
                                                </button>
                                                <div className={cn("px-3 py-1.5 rounded-xl border flex items-center gap-2", getUrgencyColor(order.orderDate))}>
                                                    <Timer size={14} />
                                                    <span className="text-xs font-bold">{Math.floor((new Date() - new Date(order.orderDate)) / 60000)}m</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-5 flex-1 space-y-4 max-h-[400px] overflow-y-auto">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                                                    <div className="flex gap-3 mb-3">
                                                        <span className="h-6 w-6 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center font-bold text-sm shrink-0">{item.quantity}</span>
                                                        <div className="flex-1">
                                                            <p className={cn("font-medium leading-tight", item.status === 'completed' && "text-slate-400 line-through")}>{item.name}</p>
                                                            {item.specialInstructions && <p className="text-xs text-rose-500 italic mt-1">{item.specialInstructions}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleItemStatus(order._id, item._id, 'preparing')} disabled={['completed', 'preparing', 'cancelled'].includes(item.status)} className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all", item.status === 'preparing' ? "bg-amber-100 text-amber-700" : "bg-slate-50 text-slate-500 hover:bg-slate-100 disabled:opacity-50")}>Prep</button>
                                                        <button onClick={() => handleItemStatus(order._id, item._id, 'completed')} disabled={['completed', 'cancelled'].includes(item.status)} className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all", item.status === 'completed' ? "bg-emerald-100 text-emerald-700" : "bg-slate-50 text-slate-500 hover:bg-slate-100 disabled:opacity-50")}>Done</button>
                                                        <button onClick={() => handleItemStatus(order._id, item._id, 'cancelled')} disabled={['completed', 'cancelled'].includes(item.status)} className={cn("px-3 py-2 rounded-lg text-xs font-bold transition-all", item.status === 'cancelled' ? "bg-rose-100 text-rose-700" : "bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50")} title="Cancel Item"><Ban size={14} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                                            {order.status === 'pending' && (
                                                <button
                                                    onClick={() => updateOrderStatus(order._id, 'preparing')}
                                                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-wider shadow-lg shadow-amber-100"
                                                >
                                                    <UtensilsCrossed size={16} /> Prep
                                                </button>
                                            )}
                                            {order.status === 'preparing' && (
                                                <button
                                                    onClick={() => updateOrderStatus(order._id, 'ready')}
                                                    // Only allow marking Ready if at least one item is done? Optional logic, but user requested buttons.
                                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-wider shadow-lg shadow-emerald-100"
                                                >
                                                    <CheckCircle2 size={16} /> Ready
                                                </button>
                                            )}
                                            {order.status === 'ready' && (
                                                <button
                                                    onClick={() => updateOrderStatus(order._id, 'completed')}
                                                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-wider shadow-lg shadow-slate-200"
                                                >
                                                    <CheckCircle2 size={16} /> Complete
                                                </button>
                                            )}

                                            <button
                                                onClick={() => updateOrderStatus(order._id, 'cancelled')}
                                                className="px-4 py-3 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-all text-xs uppercase tracking-wider"
                                                title="Cancel Order"
                                            >
                                                <Ban size={16} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: TABLES */}
            {activeTab === 'tables' && (
                <div className="min-h-[500px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {tables.map(table => (
                                <motion.button
                                    key={table._id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => toggleTableStatus(table)}
                                    className={cn(
                                        "p-6 rounded-[1.5rem] border-2 flex flex-col items-center justify-center cursor-pointer transition-all aspect-square text-center gap-3 relative overflow-hidden",
                                        table.status === 'available' && "bg-emerald-50 border-emerald-200 text-emerald-800",
                                        table.status === 'occupied' && "bg-rose-50 border-rose-200 text-rose-800",
                                        table.status === 'dirty' && "bg-amber-50 border-amber-200 text-amber-800",
                                        table.status === 'reserved' && "bg-indigo-50 border-indigo-200 text-indigo-800",
                                    )}
                                >
                                    <div className="text-3xl font-black opacity-40">{table.tableNumber}</div>
                                    <div className="flex flex-col items-center gap-1 z-10">
                                        {table.status === 'available' && <CheckCircle2 size={32} />}
                                        {table.status === 'occupied' && <Users size={32} />}
                                        {table.status === 'dirty' && <RefreshCw size={32} />}
                                        {table.status === 'reserved' && <Timer size={32} />}
                                        <span className="font-bold text-sm uppercase tracking-wider">{table.status}</span>
                                    </div>
                                    <div className="absolute top-4 right-4 text-xs font-bold opacity-50 flex items-center gap-1">
                                        <Users size={12} /> {table.capacity}
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: MENU */}
            {activeTab === 'menu' && (
                <div className="min-h-[500px]">
                    <div className="flex gap-4 mb-6 sticky top-24 z-20 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                value={menuSearch}
                                onChange={(e) => setMenuSearch(e.target.value)}
                                placeholder="Search menu items..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-medium text-slate-700"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {sortedMenuItems.map(item => (
                                <div key={item._id} className={cn(
                                    "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                                    item.isAvailable ? "bg-white border-slate-200" : "bg-slate-50 border-slate-200 opacity-75"
                                )}>
                                    <div className={cn(
                                        "h-14 w-14 rounded-xl flex items-center justify-center shrink-0",
                                        item.isAvailable ? "bg-indigo-50 text-indigo-600" : "bg-slate-200 text-slate-400"
                                    )}>
                                        {item.isAvailable ? <UtensilsCrossed size={24} /> : <Ban size={24} />}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-900 leading-tight">{item.name}</h3>
                                        <p className="text-xs text-slate-500 font-medium">{item.category}</p>
                                    </div>
                                    <button
                                        onClick={() => toggleItemAvailability(item)}
                                        className={cn(
                                            "h-10 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                                            item.isAvailable
                                                ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                                                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                        )}
                                    >
                                        {item.isAvailable ? 'Disable' : 'Enable'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
