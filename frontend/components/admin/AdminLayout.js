'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { adminAuth } from '@/lib/auth';
import { adminAPI } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import {
  LayoutDashboard,
  Table,
  UtensilsCrossed,
  ShoppingCart,
  ChefHat,
  CalendarCheck,
  UserPlus,
  Package,
  Users,
  TicketPercent,
  Star,
  Bell,
  MessageSquare,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sun,
  Moon,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import AIAssistant from '@/components/AIAssistant';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!adminAuth.isAuthenticated()) {
      router.push('/admin/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await adminAPI.getProfile();
        if (response.data.success) {
          setHotel(response.data.hotel);
          adminAuth.setAdmin(response.data.hotel);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          adminAuth.removeToken();
          router.push('/admin/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    adminAuth.removeToken();
    adminAuth.removeAdmin();
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-indigo-100 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="mt-4 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Portal Syncing...</div>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/tables', label: 'Tables', icon: Table },
    { href: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/admin/kitchen', label: 'Kitchen', icon: ChefHat },
    { href: '/admin/reservations', label: 'Reservations', icon: CalendarCheck },
    { href: '/admin/waitlist', label: 'Waitlist', icon: UserPlus },
    { href: '/admin/inventory', label: 'Inventory', icon: Package },
    { href: '/admin/staff', label: 'Staff', icon: Users },
    { href: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
    { href: '/admin/reviews', label: 'Reviews', icon: Star },
    { href: '/admin/notifications', label: 'Notifications', icon: Bell },
    { href: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
    { href: '/admin/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-outfit transition-all duration-500">
      {/* Premium Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-500 z-40 relative",
          isSidebarOpen ? "w-80" : "w-24"
        )}
      >
        <div className="h-24 flex items-center px-8 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="h-12 w-12 min-w-[48px] bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-slate-900 shadow-2xl">
              <UtensilsCrossed size={24} strokeWidth={2.5} />
            </div>
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col min-w-0"
              >
                <span className="font-black text-lg text-slate-900 dark:text-white truncate leading-none uppercase tracking-tight">
                  {hotel?.name || 'ADMIN HQ'}
                </span>
                <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.3em] mt-2 italic">
                  Enterprise v2.0
                </span>
              </motion.div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-10 px-6 space-y-2 no-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative font-black text-[10px] uppercase tracking-[0.15em]",
                  isActive
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-3xl shadow-slate-500/10 scale-[1.02]"
                    : "text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <div className={cn(
                  "shrink-0 transition-transform duration-300 group-hover:scale-110",
                  isActive ? "text-indigo-400 dark:text-indigo-600" : ""
                )}>
                  <item.icon size={20} strokeWidth={isActive ? 3 : 2} />
                </div>
                {isSidebarOpen && <span className="truncate">{item.label}</span>}
                {isActive && isSidebarOpen && (
                  <motion.div layoutId="activeNav" className="absolute left-0 w-1.5 h-6 bg-indigo-500 rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/30 dark:bg-slate-900/10">
          <button
            onClick={toggleTheme}
            className={cn(
              "flex items-center gap-4 w-full px-5 py-4 rounded-2xl text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all font-black text-[10px] uppercase tracking-widest border border-transparent hover:border-slate-100 dark:hover:border-slate-700",
              !isSidebarOpen && "justify-center"
            )}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            {isSidebarOpen && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-4 w-full px-5 py-4 rounded-2xl text-slate-400 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 transition-all font-black text-[10px] uppercase tracking-widest border border-transparent hover:border-rose-100 dark:hover:border-rose-500/20",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Secure Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Floating Premium Header */}
        <header className="h-24 flex items-center justify-between px-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-800 z-30 sticky top-0 transition-all">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 transition-all shadow-sm"
            >
              <Menu size={22} />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden h-12 w-12 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 transition-all"
            >
              <Menu size={22} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none group">
                {navItems.find(item => pathname === item.href)?.label || 'Overview'}
              </h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic flex items-center gap-2">
                 <div className="h-1 w-1 bg-indigo-500 rounded-full animate-pulse" /> Live Administration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col text-right items-end gap-1">
              <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{hotel?.ownerName || 'Hotel Admin'}</p>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic leading-none">Primary Master Access</p>
            </div>
            <div className="h-14 w-14 bg-white dark:bg-slate-800 rounded-[1.25rem] flex items-center justify-center text-slate-600 dark:text-slate-200 border border-slate-100 dark:border-slate-700 shadow-xl relative group cursor-pointer hover:border-indigo-200 transition-all">
              <User size={24} />
              <div className="absolute top-0 right-0 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="max-w-7xl mx-auto pb-24">
            {children}
          </div>
        </main>
      </div>

      {/* Optimized Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-4 left-4 w-80 bg-white dark:bg-slate-900 z-[110] lg:hidden flex flex-col shadow-3xl rounded-[3.5rem] overflow-hidden border border-white/10"
            >
              <div className="h-28 flex items-center justify-between px-8 border-b border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-slate-900">
                    <UtensilsCrossed size={22} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{hotel?.name || 'ADMIN HQ'}</span>
                    <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-1 italic">Enterprise</span>
                  </div>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="h-10 w-10 flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-10 px-8 space-y-2 no-scrollbar">
                {navItems.map((item) => {
                   const isActive = pathname === item.href;
                   return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest",
                        isActive
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl"
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      <item.icon size={20} strokeWidth={isActive ? 3 : 2} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="p-8 border-t border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <button onClick={handleLogout} className="flex items-center justify-center gap-4 w-full py-5 bg-rose-500 text-white rounded-[1.75rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-500/20 active:scale-95 transition-all">
                  <LogOut size={20} />
                  <span>Logout Device</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AIAssistant context="admin" />
    </div>
  );
}
