'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { staffAuth } from '@/lib/staffAuth';
import { staffAPI } from '@/lib/api';
import {
    LayoutDashboard,
    UtensilsCrossed,
    ChefHat,
    Wallet,
    Users,
    Settings,
    LogOut,
    Bell,
    Menu as MenuIcon,
    X,
    User,
    Package,
    Calendar,
    Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function StaffLayout({ children }) {
    const router = useRouter();
    const params = useParams();
    const hotelId = params.hotelId;
    const pathname = usePathname();

    const [staff, setStaff] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        checkAuth();
    }, [hotelId]);

    const checkAuth = async () => {
        if (!staffAuth.isAuthenticated()) {
            if (!pathname.includes('/login')) {
                router.push(`/${hotelId}/staff/login`);
            }
            setLoading(false);
            return;
        }

        try {
            const response = await staffAPI.getProfile();
            if (response.data.success) {
                setStaff(response.data.staff);
                staffAuth.setStaff(response.data.staff);
            } else {
                staffAuth.removeToken();
                router.push(`/${hotelId}/staff/login`);
            }
        } catch (error) {
            console.error('Profile fetch failed');
            // If unauthorized, redirect to login
            if (error.response?.status === 401) {
                staffAuth.removeToken();
                router.push(`/${hotelId}/staff/login`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        staffAuth.removeToken();
        router.push(`/${hotelId}/staff/login`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    // If we are on login page, just render children
    if (pathname.includes('/staff/login')) {
        return <>{children}</>;
    }

    const roleNavItems = {
        waiter: [
            { name: 'Dashboard', icon: LayoutDashboard, path: `/${hotelId}/staff` },
            { name: 'Active Orders', icon: UtensilsCrossed, path: `/${hotelId}/staff/orders` },
            { name: 'Table Status', icon: Settings, path: `/${hotelId}/staff/tables` },
            { name: 'Reservations', icon: Calendar, path: `/${hotelId}/staff/reservations` },
        ],
        chef: [
            { name: 'Kitchen Feed', icon: ChefHat, path: `/${hotelId}/staff/kitchen` },
            { name: 'Inventory', icon: Package, path: `/${hotelId}/staff/inventory` },
            { name: 'Menu Editor', icon: UtensilsCrossed, path: `/${hotelId}/staff/menu` },
        ],
        cashier: [
            { name: 'Billing', icon: Wallet, path: `/${hotelId}/staff/billing` },
            { name: 'Order History', icon: LayoutDashboard, path: `/${hotelId}/staff/orders` },
            { name: 'Feedback', icon: Star, path: `/${hotelId}/staff/feedback` },
        ],
        manager: [
            { name: 'Dashboard', icon: LayoutDashboard, path: `/${hotelId}/staff` },
            { name: 'Analytics', icon: Bell, path: `/${hotelId}/staff/analytics` },
            { name: 'Staff Management', icon: Users, path: `/${hotelId}/staff/team` },
            { name: 'Inventory Pool', icon: Package, path: `/${hotelId}/staff/inventory` },
        ],
        admin: [
            // System admin has everything
        ]
    };

    const navItems = roleNavItems[staff?.role] || roleNavItems.waiter;

    return (
        <div className="min-h-screen bg-[#060b18] text-white font-outfit">
            {/* Sidebar Mobile Toggle */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-[60] bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-fuchsia-600 flex items-center justify-center p-0.5 shadow-lg shadow-indigo-600/20">
                        <div className="w-full h-full bg-[#0f172a] rounded-[0.55rem] flex items-center justify-center">
                            <LayoutDashboard size={20} className="text-white" />
                        </div>
                    </div>
                    <span className="font-black uppercase tracking-tighter text-lg italic">Staff Node</span>
                </div>
                <button onClick={() => setSidebarOpen(true)} className="p-2 bg-white/5 rounded-xl">
                    <MenuIcon size={24} />
                </button>
            </div>

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-[70] w-72 bg-[#0a1122] border-r border-white/5 transform transition-transform duration-300 lg:translate-x-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-full flex flex-col p-6">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-fuchsia-600 flex items-center justify-center p-0.5">
                                <div className="w-full h-full bg-[#0a1122] rounded-[0.9rem] flex items-center justify-center">
                                    <LayoutDashboard size={24} className="text-white" />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black uppercase tracking-tighter text-xl italic leading-none">Helix</span>
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Staff Core</span>
                            </div>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400">
                            <X size={24} />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.path}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group relative overflow-hidden",
                                    pathname === item.path
                                        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20"
                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                )}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <item.icon size={20} className={cn("transition-transform group-hover:scale-110", pathname === item.path ? "text-white" : "text-indigo-500")} />
                                <span className="font-bold text-sm uppercase tracking-widest">{item.name}</span>
                                {pathname === item.path && (
                                    <motion.div layoutId="nav-active" className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
                                )}
                            </Link>
                        ))}
                    </nav>

                    <div className="mt-auto pt-6 border-t border-white/5">
                        <div className="bg-slate-900/50 p-4 rounded-[2rem] border border-white/5 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-indigo-500 font-black text-xl border border-white/5 shadow-inner">
                                    {staff?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-xs uppercase tracking-tight truncate text-white">{staff?.name}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{staff?.role}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-colors group"
                        >
                            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                            <span className="font-bold text-xs uppercase tracking-[0.2em]">Terminate Session</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="lg:pl-72 pt-20 lg:pt-0 min-h-screen">
                {/* Header Overlay */}
                <div className="hidden lg:flex fixed top-0 right-0 left-72 z-40 h-20 bg-[#060b18]/50 backdrop-blur-md border-b border-white/5 items-center justify-end px-10 gap-6">
                    <div className="relative group">
                        <button className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-indigo-500 transition-all border border-white/5">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#060b18]" />
                        </button>
                    </div>
                    <div className="h-8 w-px bg-white/5" />
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs font-black uppercase tracking-widest text-white">{staff?.role}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 italic">Duty Status: Active</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-500 border border-white/5">
                            <User size={20} />
                        </div>
                    </div>
                </div>

                <div className="p-6 lg:p-10 lg:pt-28 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[65] lg:hidden"
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
