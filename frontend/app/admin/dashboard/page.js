'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminAPI } from '@/lib/api';
import { adminAuth } from '@/lib/auth';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  ChevronRight,
  Utensils,
  Zap,
  ArrowUpRight,
  Clock,
  LayoutDashboard
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    pendingOrders: 0,
    totalOrders: 0,
    totalTables: 0,
    totalMenuItems: 0
  });
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHotel(adminAuth.getAdmin());
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [ordersRes, tablesRes, menuRes] = await Promise.all([
        adminAPI.getOrders(),
        adminAPI.getTables(),
        adminAPI.getMenu()
      ]);

      const orders = ordersRes.data.orders || [];
      setStats({
        pendingOrders: orders.filter(o => o.status === 'pending' || o.status === 'preparing').length,
        totalOrders: orders.length,
        totalTables: (tablesRes.data.tables || []).length,
        totalMenuItems: (menuRes.data.menuItems || []).length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const QuickAction = ({ href, icon: Icon, label, description, color, textColor }) => (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -5 }}
        className="bg-white border border-slate-200 p-8 rounded-[2.5rem] hover:shadow-xl hover:shadow-indigo-500/5 transition-all group h-full relative overflow-hidden"
      >
        <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center mb-8 shadow-lg", color, textColor)}>
          <Icon size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center justify-between group-hover:text-indigo-600 transition-colors">
          {label}
          <ChevronRight size={18} className="text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
        </h3>
        <p className="text-sm text-slate-500 font-medium leading-relaxed italic">{description}</p>
      </motion.div>
    </Link>
  );

  return (
    <AdminLayout>
      <div className="space-y-10 font-outfit px-4 sm:px-0 pb-20 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white border border-slate-200 p-10 rounded-[3.5rem] shadow-sm flex flex-col sm:row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-100">
              <LayoutDashboard size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Overview</h1>
              <p className="text-slate-500 mt-1 font-medium italic">Monitor real-time operational efficiency and performance.</p>
            </div>
          </div>
          <div className="flex flex-col sm:items-end gap-3">
            <div className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
              <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-lg" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 italic">
                <Clock size={12} /> Live Monitoring Active
              </span>
            </div>
            {hotel?.qrCode && (
              <div className="px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full inline-flex items-center gap-2">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Portal Slug:</span>
                <span className="text-[10px] font-bold text-indigo-600 font-mono select-all cursor-copy" onClick={() => {
                  navigator.clipboard.writeText(hotel.qrCode);
                  toast.success('Slug copied');
                }}>{hotel.qrCode}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Live Orders', value: stats.pendingOrders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'History', value: stats.totalOrders, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Occupancy', value: stats.totalTables, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Catalog Assets', value: stats.totalMenuItems, icon: Utensils, color: 'text-rose-600', bg: 'bg-rose-50' }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-slate-200 p-8 rounded-[3rem] shadow-sm relative group overflow-hidden"
            >
              <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform", stat.bg, stat.color)}>
                <stat.icon size={24} />
              </div>
              <p className="text-4xl font-bold text-slate-900 mb-1 tracking-tighter">{stat.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-4">
            <Zap size={24} className="text-indigo-600 fill-indigo-600" />
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">Control Hub</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <QuickAction
              href="/admin/orders"
              icon={ShoppingBag}
              label="Order Queue"
              description="Monitor and manage all incoming food requests in real-time."
              color="bg-blue-50"
              textColor="text-blue-600"
            />
            <QuickAction
              href="/admin/menu"
              icon={Utensils}
              label="Asset Editor"
              description="Update your refined culinary offerings and price indices."
              color="bg-rose-50"
              textColor="text-rose-600"
            />
            <QuickAction
              href="/admin/tables"
              icon={Users}
              label="Spatial Layout"
              description="Manage floor occupancy and generate interaction points."
              color="bg-emerald-50"
              textColor="text-emerald-600"
            />
          </div>
        </div>

        {/* Analytics Snapshot */}
        <div className="bg-slate-900 rounded-[4rem] p-12 lg:p-16 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-white opacity-[0.03] blur-[100px] rounded-full translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-white opacity-[0.02] blur-[80px] rounded-full -translate-x-1/2" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
            <div className="max-w-xl">
              <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Performance Stream</h2>
              <p className="text-slate-400 text-lg font-medium leading-relaxed italic">Your establishment's growth metrics are showing positive velocity. Access high-fidelity data logs for strategic planning.</p>
            </div>
            <Link href="/admin/analytics" className="px-12 py-5 bg-white text-slate-900 rounded-2xl font-bold text-xs shadow-2xl flex items-center justify-center gap-3 hover:scale-105 transition-all w-full lg:w-auto uppercase tracking-widest outline-none">
              Full Strategy Engine <ArrowUpRight size={20} />
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
