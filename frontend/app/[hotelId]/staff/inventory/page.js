'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package,
    AlertCircle,
    Plus,
    Minus,
    Search,
    RefreshCcw,
    ChevronDown,
    Layers,
    TrendingUp,
    Star
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function StaffInventoryPage() {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
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
                setInventory(response.data.inventory || []);
            }
        } catch (error) {
            console.error('Failed to fetch inventory');
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityUpdate = async (id, delta) => {
        const item = inventory.find(i => i._id === id);
        if (!item) return;

        const newQuantity = (item.stockQuantity || 0) + delta;
        if (newQuantity < 0) return toast.error('Stock cannot be negative');

        const loadingToast = toast.loading('Syncing stock level...');
        try {
            await adminAPI.updateInventory(id, { stockQuantity: newQuantity });
            toast.success(`Inventory updated`, { id: loadingToast });
            fetchInventory();
        } catch (error) {
            toast.error('Sync failed', { id: loadingToast });
        }
    };

    const filtered = inventory.filter(item => {
        const matchesSearch = item.itemName?.toLowerCase().includes(searchQuery.toLowerCase());
        const isLow = item.stockQuantity <= item.lowStockThreshold;
        const matchesStatus = filterStatus === 'all' || (filterStatus === 'low' && isLow) || (filterStatus === 'healthy' && !isLow);
        return matchesSearch && matchesStatus;
    });

    const StatsCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm flex flex-col items-center text-center">
            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-4", color)}>
                <Icon size={24} className="text-white" />
            </div>
            <p className="text-4xl font-bold text-slate-900 tracking-tighter mb-1">{value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        </div>
    );

    return (
        <div className="space-y-8 font-outfit pb-20 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white border border-slate-200 p-8 rounded-[3.5rem] shadow-sm flex flex-col sm:row justify-between items-center gap-6">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                        <Package size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-tight">Supply Monitor</h1>
                        <p className="text-slate-500 text-sm font-medium italic">Track and optimize inventory asset levels.</p>
                    </div>
                </div>
                <button
                    onClick={fetchInventory}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                >
                    <RefreshCcw size={20} className={loading ? 'animate-spin text-blue-600' : ''} />
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    title="Total SKU Assets"
                    value={inventory.length}
                    icon={Layers}
                    color="bg-slate-900"
                />
                <StatsCard
                    title="Depleted Stocks"
                    value={inventory.filter(i => i.stockQuantity <= i.lowStockThreshold).length}
                    icon={AlertCircle}
                    color="bg-rose-500"
                />
                <StatsCard
                    title="Consumption Velocity"
                    value="Stable"
                    icon={TrendingUp}
                    color="bg-emerald-500"
                />
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Deconstruct supplies by name or SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none font-medium"
                    />
                </div>
                <div className="bg-white border border-slate-200 p-1.5 rounded-[1.5rem] flex gap-1">
                    {['all', 'low', 'healthy'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={cn(
                                "px-6 py-3 rounded-[1.25rem] text-[10px] font-bold uppercase tracking-widest transition-all",
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
                    {filtered.map((item) => (
                        <motion.div
                            key={item._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all flex flex-col group overflow-hidden relative"
                        >
                            {item.stockQuantity <= item.lowStockThreshold && (
                                <div className="absolute top-0 right-0 p-4">
                                    <div className="bg-rose-500 text-white p-2 rounded-xl animate-pulse">
                                        <AlertCircle size={16} />
                                    </div>
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight italic">{item.itemName}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.category || 'General Supply'}</p>
                            </div>

                            <div className="flex-1 flex flex-col justify-center py-8">
                                <div className="flex flex-col items-center">
                                    <span className={cn(
                                        "text-6xl font-black tracking-tighter mb-2",
                                        item.stockQuantity <= item.lowStockThreshold ? "text-rose-500" : "text-slate-900"
                                    )}>
                                        {item.stockQuantity}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">{item.unit || 'Units'}</span>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleQuantityUpdate(item._id, -1)}
                                        className="h-12 w-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all font-bold"
                                    >
                                        <Minus size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleQuantityUpdate(item._id, 1)}
                                        className="h-12 w-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all font-bold"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Safe Level</p>
                                    <p className="text-sm font-black text-slate-900">{item.lowStockThreshold} Units</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filtered.length === 0 && !loading && (
                <div className="py-32 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-[4rem] text-center">
                    <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8">
                        <Package size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tighter">Inventory Purged</h2>
                    <p className="text-slate-400 text-sm mt-2 uppercase tracking-widest font-bold">No asset signatures detected in the ledger.</p>
                </div>
            )}
        </div>
    );
}
