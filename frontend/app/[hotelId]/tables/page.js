'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Link from 'next/link';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { customerAPI } from '@/lib/api';
import { customerAuth } from '@/lib/auth';
import {
  CheckCircle2,
  Table as TableIcon,
  Users,
  ArrowRight,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function TablesPage() {
  const params = useParams();
  const router = useRouter();

  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerAuth.isValidSession(params.hotelId)) {
      router.push(`/${params.hotelId}/login`);
      return;
    }
    const customer = customerAuth.getCustomer();
    fetchTables(params.hotelId);
    loadSelectedTable();
  }, [params.hotelId]);

  const fetchTables = async (hotelId) => {
    try {
      const response = await customerAPI.getTables(hotelId);
      if (response.data.success) {
        setTables(response.data.tables);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedTable = () => {
    if (typeof window !== 'undefined') {
      const customer = customerAuth.getCustomer();
      if (customer?.tableId) {
        const table = tables.find(t => t._id === customer.tableId);
        if (table) setSelectedTable(table);
      }
      
      const saved = localStorage.getItem(`selectedTable_${params.hotelId}`);
      if (saved && !selectedTable) {
        setSelectedTable(JSON.parse(saved));
      }
    }
  };

  const handleSelectTable = (table) => {
    setSelectedTable(table);
    customerAuth.setCustomer({ tableId: table._id });
    if (typeof window !== 'undefined') {
      localStorage.setItem(`selectedTable_${params.hotelId}`, JSON.stringify(table));
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-10 w-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-6xl mx-auto space-y-12 font-outfit pb-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
          <div className="flex items-center gap-6">
            <Link href={`/${params.hotelId}/menu`} className="h-14 w-14 rounded-[1.75rem] bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
              <ChevronLeft size={28} />
            </Link>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">Select Table</h1>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 italic">Assign your table to start ordering</p>
            </div>
          </div>

          <div className="bg-slate-100/50 p-2 rounded-[2rem] border border-slate-200/50 flex">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm",
                viewMode === 'grid' ? "bg-slate-900 text-white shadow-xl" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={cn(
                "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm",
                viewMode === 'map' ? "bg-slate-900 text-white shadow-xl" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Floor Plan
            </button>
          </div>
        </div>

        {selectedTable && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-3xl shadow-indigo-500/10 flex flex-col sm:flex-row items-center justify-between gap-10 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
               <TableIcon size={120} />
            </div>
            <div className="flex items-center gap-8 relative z-10">
              <div className="h-24 w-24 bg-white rounded-3xl flex items-center justify-center text-indigo-600 font-black text-5xl shadow-2xl">
                {selectedTable.tableNumber}
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200 mb-2 italic">Current Assignment</p>
                <p className="text-3xl font-black leading-tight uppercase">Ready to Dine</p>
              </div>
            </div>

            <Link href={`/${params.hotelId}/menu`} className="px-10 py-5 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3 relative z-10 shadow-xl">
              Back to Menu <ArrowRight size={20} />
            </Link>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {viewMode === 'map' ? (
            <motion.div
              key="map"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative w-full aspect-[16/9] bg-slate-50 border border-slate-200 rounded-[3rem] overflow-hidden"
            >
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:30px_30px]" />
              <div className="absolute inset-0 p-8 sm:p-12">
                {tables.map((table) => {
                  const isSelected = selectedTable?._id === table._id;
                  const isAvailable = table.status === 'available';
                  return (
                    <motion.div
                      key={table._id}
                      onClick={() => isAvailable && handleSelectTable(table)}
                      className={cn(
                        "absolute cursor-pointer transition-all flex flex-col items-center justify-center p-2 group",
                        !isAvailable && "opacity-40 cursor-not-allowed grayscale"
                      )}
                      style={{
                        left: `${table.x || 50}%`,
                        top: `${table.y || 50}%`,
                        width: '80px',
                        height: '80px',
                        transform: 'translate(-50%, -50%)'
                      }}
                      whileHover={isAvailable ? { scale: 1.1 } : {}}
                    >
                      <div className={cn(
                        "w-full h-full rounded-[1.5rem] border-2 bg-white flex flex-col items-center justify-center p-2 shadow-sm transition-all",
                        isSelected ? "border-indigo-600 ring-4 ring-indigo-50" : "border-slate-100 group-hover:border-indigo-200"
                      )}>
                        <span className={cn("text-xs font-black", isSelected ? "text-indigo-600" : "text-slate-400")}>#{table.tableNumber}</span>
                        <Users size={12} className="text-slate-400 my-1" />
                        <span className="text-[10px] font-bold text-slate-900">{table.capacity}</span>
                      </div>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-indigo-600 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm">
                          <CheckCircle2 size={10} />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">ENTER HERE</div>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6"
            >
              {tables.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-slate-100 italic text-slate-400">
                  No tables are currently available for selection.
                </div>
              ) : (
                tables.map((table, index) => {
                  const isSelected = selectedTable?._id === table._id;
                  const isAvailable = table.status === 'available';
                  return (
                    <motion.div
                      key={table._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => isAvailable && handleSelectTable(table)}
                      className={cn(
                        "relative aspect-square rounded-[2rem] border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 p-4",
                        isSelected
                          ? "bg-white border-indigo-600 shadow-xl shadow-indigo-100 scale-105"
                          : "bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50/50",
                        !isAvailable && "opacity-40 grayscale cursor-not-allowed"
                      )}
                    >
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center transition-colors",
                        isSelected ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-400"
                      )}>
                        <TableIcon size={24} />
                      </div>
                      <span className={cn(
                        "text-2xl font-bold",
                        isSelected ? "text-slate-900" : "text-slate-700"
                      )}>
                        {table.tableNumber}
                      </span>
                      <div className="flex items-center gap-1.5 opacity-60">
                        <Users size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{table.capacity}</span>
                      </div>

                      {isSelected && (
                        <div className="absolute -top-3 -right-3 h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {selectedTable && (
          <div className="flex justify-center pt-10">
            <Link
              href={`/${params.hotelId}/order`}
              className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              Review Your Cart <ArrowRight size={20} />
            </Link>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
