'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminAPI } from '@/lib/api';
import {
    Package,
    AlertTriangle,
    Plus,
    RefreshCcw,
    Search,
    PackageCheck,
    PackageX,
    X,
    Utensils
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function InventoryPage() {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRestockModal, setShowRestockModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [restockQuantity, setRestockQuantity] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getInventory();
            if (response.data.success) {
                setInventory(response.data.inventory);
            }
        } catch (error) {
            toast.error('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    const handleRestockSubmit = async (e) => {
        e.preventDefault();
        if (!restockQuantity || parseFloat(restockQuantity) <= 0) {
            toast.error('Invalid quantity');
            return;
        }

        const loadingToast = toast.loading('Updating...');
        try {
            await adminAPI.restockInventory(selectedItem._id, {
                quantity: parseFloat(restockQuantity),
                unit: selectedItem.unit
            });
            setShowRestockModal(false);
            setSelectedItem(null);
            setRestockQuantity('');
            toast.success('Inventory synced', { id: loadingToast });
            fetchInventory();
        } catch (error) {
            toast.error('Restock failed', { id: loadingToast });
        }
    };

    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.menuItemId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const isLow = item.stockQuantity <= item.lowStockThreshold && item.stockQuantity > 0;
        const isOut = item.stockQuantity <= 0;

        if (!matchesSearch) return false;
        if (filterStatus === 'low') return isLow;
        if (filterStatus === 'out') return isOut;
        return true;
    });

    const stats = {
        total: inventory.length,
        lowStock: inventory.filter(i => i.stockQuantity <= i.lowStockThreshold && i.stockQuantity > 0).length,
        outOfStock: inventory.filter(i => i.stockQuantity <= 0).length
    };

    if (loading && inventory.length === 0) {
        return (
            <AdminLayout>
                <div className="space-y-8 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-[2.5rem] border border-slate-200 animate-pulse" />)}
                    </div>
                    <div className="h-96 bg-white rounded-[3rem] border border-slate-200 animate-pulse" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8 max-w-7xl mx-auto font-outfit px-4 sm:px-0">
                {/* Header */}
                <div className="bg-white border border-slate-200 p-8 rounded-[3rem] shadow-sm flex flex-col sm:row justify-between items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-100">
                            <Package size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Stock Control</h1>
                            <p className="text-slate-500 text-sm font-medium italic">Track levels for all your menu ingredients.</p>
                        </div>
                    </div>
                    <button onClick={fetchInventory} className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all font-bold text-[10px] uppercase tracking-widest leading-none">
                        <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tracked Assets</p>
                        <div className="flex items-end justify-between">
                            <h3 className="text-4xl font-bold text-slate-900">{stats.total}</h3>
                            <PackageCheck size={28} className="text-indigo-600 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2">Low Alerts</p>
                        <div className="flex items-end justify-between">
                            <h3 className="text-4xl font-bold text-amber-600">{stats.lowStock}</h3>
                            <AlertTriangle size={28} className="text-amber-500 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-2">Exhausted</p>
                        <div className="flex items-end justify-between">
                            <h3 className="text-4xl font-bold text-rose-600">{stats.outOfStock}</h3>
                            <PackageX size={28} className="text-rose-500 opacity-20" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Find inventory assets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-medium"
                        />
                    </div>
                    <div className="bg-white border border-slate-200 p-1.5 rounded-[1.25rem] flex gap-1">
                        {['all', 'low', 'out'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                                    filterStatus === status ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {status === 'all' ? 'Everything' : status === 'low' ? 'Low Stock' : 'Depleted'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <th className="px-10 py-5">Ingredient / Product</th>
                                    <th className="px-10 py-5">Current Stock</th>
                                    <th className="px-10 py-5">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredInventory.map((item) => {
                                    const isLow = item.stockQuantity <= item.lowStockThreshold && item.stockQuantity > 0;
                                    const isOut = item.stockQuantity <= 0;

                                    return (
                                        <tr key={item._id} className="group hover:bg-slate-50/30 transition-all">
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 shadow-sm group-hover:scale-110 transition-transform">
                                                        <Utensils size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-lg uppercase tracking-tight">{item.menuItemId?.name || 'Undefined Item'}</p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alarm Level: {item.lowStockThreshold} {item.unit}</p>
                                                            {isOut ? (
                                                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                                            ) : isLow ? (
                                                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                                                            ) : (
                                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex flex-col">
                                                    <span className={cn(
                                                        "text-2xl font-bold font-mono",
                                                        isOut ? "text-rose-600" : isLow ? "text-amber-600" : "text-slate-900"
                                                    )}>
                                                        {item.stockQuantity}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.unit} available</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <button
                                                    onClick={() => {
                                                        setSelectedItem(item);
                                                        setRestockQuantity('');
                                                        setShowRestockModal(true);
                                                    }}
                                                    className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold uppercase tracking-widest text-[10px] border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                                                >
                                                    Supply Restock
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Restock Modal */}
                <AnimatePresence>
                    {showRestockModal && selectedItem && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRestockModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-[3rem] w-full max-w-md shadow-2xl p-10 font-outfit">
                                <div className="flex justify-between items-center mb-10">
                                    <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Supplies Update</h2>
                                    <button onClick={() => setShowRestockModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
                                </div>

                                <form onSubmit={handleRestockSubmit} className="space-y-8">
                                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stock Item</p>
                                        <p className="text-xl font-bold text-slate-900 uppercase tracking-tight mb-4">{selectedItem.menuItemId?.name}</p>
                                        <div className="flex justify-between pt-4 border-t border-slate-200/50">
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">In Stock</p>
                                                <p className="font-bold text-slate-600">{selectedItem.stockQuantity} {selectedItem.unit}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Alarm Threshold</p>
                                                <p className="font-bold text-slate-600">{selectedItem.lowStockThreshold} {selectedItem.unit}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Quantity to Provision</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                required
                                                min="0.01"
                                                step="0.01"
                                                value={restockQuantity}
                                                onChange={(e) => setRestockQuantity(e.target.value)}
                                                className="w-full pl-6 pr-16 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-xl font-bold font-mono"
                                                placeholder="0.00"
                                            />
                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm uppercase tracking-widest">{selectedItem.unit}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button type="button" onClick={() => setShowRestockModal(false)} className="flex-1 py-4 font-bold text-slate-400 rounded-2xl hover:bg-slate-50 uppercase tracking-widest text-[11px]">Abort</button>
                                        <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl uppercase tracking-widest text-[11px] shadow-slate-200">Refill Stock</button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </AdminLayout>
    );
}
