'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { customerAuth } from '@/lib/auth';
import { useTheme } from '@/context/ThemeContext';
import {
  Utensils,
  Table,
  Calendar,
  ShoppingCart,
  User,
  LogOut,
  ChevronLeft,
  MessageSquare,
  Moon,
  Sun,
  Clock,
  Heart,
  Settings,
  Ticket,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import AIAssistant from '@/components/AIAssistant';

export default function CustomerLayout({ children }) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const [customer, setCustomer] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!customerAuth.isValidSession(params.hotelId)) {
      router.push(`/${params.hotelId}/login`);
      return;
    }
    setCustomer(customerAuth.getCustomer());

    const updateCartCount = () => {
      const savedCart = localStorage.getItem(`cart_${params.hotelId}`);
      if (savedCart) {
        try {
          const cart = JSON.parse(savedCart);
          const count = cart.reduce((total, item) => total + item.quantity, 0);
          setCartCount(count);
        } catch (e) {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    updateCartCount();

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    // Listen for storage changes (works across tabs or within same tab if manually triggered)
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('storage', updateCartCount);
    
    // Custom event for same-page updates
    window.addEventListener('cart-updated', updateCartCount);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cart-updated', updateCartCount);
    };
  }, [router, params.hotelId]);

  const handleLogout = () => {
    customerAuth.removeCustomer();
    router.push(`/${params.hotelId}/login?logout=1`);
  };

  if (!customer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 border-4 border-slate-200 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = [
    { href: `/${params.hotelId}/menu`, label: 'Menu', icon: Utensils },
    { href: `/${params.hotelId}/tables`, label: 'Tables', icon: Table },
    { href: `/${params.hotelId}/reserve`, label: 'Reserve', icon: Calendar },
    { href: `/${params.hotelId}/reviews`, label: 'Reviews', icon: Star },
    { href: `/${params.hotelId}/feedback`, label: 'Feedback', icon: MessageSquare },
    { href: `/${params.hotelId}/marketplace`, label: 'Market', icon: Ticket },
    { href: `/${params.hotelId}/order`, label: 'Cart', icon: ShoppingCart },
    { href: `/${params.hotelId}/profile`, label: 'Account', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-outfit transition-colors duration-500 overflow-x-hidden">
      {/* Navbar Desktop - Premium Glassmorphism */}
      <nav className={cn(
        "hidden lg:block fixed top-0 left-0 right-0 z-[100] transition-all duration-700 px-10 py-8",
        isScrolled ? "py-4" : "bg-transparent"
      )}>
        <div className={cn(
          "max-w-7xl mx-auto flex justify-between items-center p-4 rounded-[2.5rem] transition-all duration-500",
          isScrolled ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-slate-800/50 shadow-2xl shadow-indigo-500/5" : "bg-white/10 backdrop-blur-md border border-white/20"
        )}>
          <Link href={`/${params.hotelId}/menu`} className="flex items-center gap-4 group">
            <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 group-hover:rotate-6 transition-transform">
              <Utensils size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none">DineSmart</span>
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mt-1 italic">Premium Dining</span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 relative group overflow-hidden",
                    isActive
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl"
                      : "text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                  )}
                >
                  <item.icon size={14} className={isActive ? "" : "group-hover:scale-110 transition-transform"} />
                  {item.label}
                  {item.label === 'Cart' && cartCount > 0 && (
                    <span className="h-4 min-w-[1rem] px-1 bg-rose-500 text-white rounded-full flex items-center justify-center text-[8px] font-black border-2 border-white dark:border-slate-900">
                      {cartCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={toggleTheme}
              className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:rotate-12 transition-all shadow-sm"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div className="flex items-center gap-4 pl-4 border-l border-slate-200 dark:border-slate-700">
              <div className="text-right">
                <span className="block text-sm font-black text-slate-900 dark:text-white leading-none mb-1">{customer.name}</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{customer.loyaltyPoints || 0} PTS</span>
              </div>
              <button
                onClick={handleLogout}
                className="h-11 w-11 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Header - High End Glass */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-[150] px-6 h-24 flex items-center justify-between">
         <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border-b border-white/20 dark:border-slate-800/50" />
         <Link href={`/${params.hotelId}/menu`} className="relative flex items-center gap-3">
          <div className="h-10 w-10 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-slate-900 shadow-xl">
            <Utensils size={18} />
          </div>
          <span className="font-black text-xl text-slate-900 dark:text-white tracking-tighter uppercase">DineSmart</span>
        </Link>
        <div className="relative flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="h-11 w-11 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl text-slate-500 dark:text-slate-400 flex items-center justify-center border border-white/20"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <div className="text-right">
            <span className="block text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Balance</span>
            <span className="block text-lg font-black text-slate-900 dark:text-white leading-none">{customer.loyaltyPoints || 0} <span className="text-[10px] text-slate-400">Pts</span></span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 pt-32 lg:pt-48 pb-32 min-h-screen relative z-10">
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile Premium Bottom Nav */}
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 z-[200]">
        <div className="bg-slate-900/90 dark:bg-white/90 backdrop-blur-3xl border border-white/10 dark:border-slate-200/50 rounded-[2.5rem] p-2 shadow-2xl flex justify-between items-center shadow-indigo-500/20 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 min-w-[64px] py-3 rounded-[1.75rem] transition-all duration-500 flex-1 relative group",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 scale-105" 
                    : "text-slate-400 dark:text-slate-500"
                )}
              >
                <div className="relative z-10 transition-transform duration-300 group-hover:-translate-y-0.5">
                  <item.icon size={20} strokeWidth={isActive ? 3 : 2} />
                  {item.label === 'Cart' && cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[8px] font-black border-2 border-white dark:border-slate-900 shadow-lg">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[7px] font-black uppercase tracking-widest relative z-10",
                  isActive ? "opacity-100" : "opacity-0"
                )}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <Link
        href={`/${params.hotelId}/order`}
        className={cn(
          "fixed bottom-24 right-6 z-[100] h-16 w-16 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-900 dark:text-white shadow-2xl transition-all hover:scale-110 active:scale-95 group overflow-hidden",
          cartCount === 0 ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"
        )}
      >
        <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        <div className="relative z-10">
          <ShoppingCart size={24} className="group-hover:text-white transition-colors" />
          {cartCount > 0 && (
            <span className="absolute -top-3 -right-3 h-6 min-w-[1.5rem] px-1.5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white dark:border-slate-800 shadow-lg">
              {cartCount}
            </span>
          )}
        </div>
      </Link>

      <AIAssistant context="customer" hotelId={params.hotelId} customerId={customer?.id} />
    </div>
  );
}
