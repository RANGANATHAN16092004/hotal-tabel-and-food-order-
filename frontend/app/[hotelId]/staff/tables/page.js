'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    RefreshCcw,
    Layout,
    Zap,
    Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function StaffTablesPage() {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTables();
        const interval = setInterval(fetchTables, 15000);
        return () => clearInterval(interval);
    }, []);

    const fetchTables = async () => {
        try {
            const response = await adminAPI.getTables();
            if (response.data.success) {
                setTables(response.data.tables);
            }
        } catch (error) {
            console.error('Failed to fetch tables');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        const loadingToast = toast.loading('Syncing table status...');
        try {
            await adminAPI.updateTable(id, { status });
            toast.success(`Table updated to ${status}`, { id: loadingToast });
            fetchTables();
        } catch (error) {
            toast.error('Update failed', { id: loadingToast });
        }
    };

    return (
        <div className="space-y-8 font-outfit pb-20 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white border border-slate-200 p-8 rounded-[3.5rem] shadow-sm flex flex-col sm:row justify-between items-center gap-6">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                        <Layout size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-tight">Spatial Monitoring</h1>
                        <p className="text-slate-500 text-sm font-medium italic">Monitor and update real-time table occupancy.</p>
                    </div>
                </div>
                <button
                    onClick={fetchTables}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-95"
                >
                    <RefreshCcw size={20} className={loading ? 'animate-spin text-emerald-600' : ''} />
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                <AnimatePresence>
                    {tables.map((table, index) => (
                        <motion.div
                            key={table._id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -5 }}
                            className={cn(
                                "p-8 rounded-[2.5rem] border transition-all cursor-pointer flex flex-col items-center justify-center text-center shadow-sm relative group",
                                table.status === 'available' ? "bg-white border-slate-200 hover:border-emerald-500 hover:shadow-emerald-500/5" :
                                    table.status === 'occupied' ? "bg-rose-50 border-rose-100 hover:border-rose-300" :
                                        "bg-amber-50 border-amber-100 hover:border-amber-300"
                            )}
                            onClick={() => handleStatusUpdate(table._id, table.status === 'available' ? 'occupied' : 'available')}
                        >
                            <div className={cn(
                                "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform",
                                table.status === 'available' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                    table.status === 'occupied' ? "bg-white text-rose-600 border border-rose-100" :
                                        "bg-white text-amber-600 border border-amber-100"
                            )}>
                                <Layout size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tighter">Idx {table.tableNumber}</h3>
                            <div className={cn(
                                "mt-4 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                table.status === 'available' ? "bg-emerald-600 text-white border-emerald-700 shadow-lg shadow-emerald-100" :
                                    table.status === 'occupied' ? "bg-rose-600 text-white border-rose-700 shadow-lg shadow-rose-100" :
                                        "bg-amber-600 text-white border-amber-700 shadow-lg shadow-amber-100"
                            )}>
                                {table.status}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Legend */}
            <div className="bg-slate-900 rounded-[3rem] p-10 flex flex-col lg:flex-row items-center gap-10 justify-between shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-white opacity-[0.03] blur-[80px] rounded-full translate-x-1/2" />
                <div className="relative z-10 flex items-center gap-6">
                    <div className="h-16 w-16 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-slate-400">
                        <Info size={32} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white tracking-tight uppercase">Interaction Guide</h3>
                        <p className="text-slate-400 text-sm font-medium italic mt-1">Initialize state changes by engaging with individual table cards.</p>
                    </div>
                </div>

                <div className="relative z-10 flex flex-wrap gap-8 bg-white/5 p-6 rounded-[2rem] border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">Available</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                        <span className="text-[10px] font-bold text-rose-100 uppercase tracking-widest">Occupied</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                        <span className="text-[10px] font-bold text-amber-100 uppercase tracking-widest">Reserved</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
