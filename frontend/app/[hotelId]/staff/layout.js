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
    Star,
    Layout,
    Clock,
    BarChart3,
    DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import AIAssistant from '@/components/AIAssistant';

export default function StaffLayout({ children }) {
    const router = useRouter();
    const params = useParams();
    const hotelId = params.hotelId;
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();

    const [staff, setStaff] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        checkAuth();
    }, [hotelId]);

    const checkAuth = async () => {
        if (pathname.includes('/staff/login')) {
            setLoading(false);
            return;
        }

        if (!staffAuth.isAuthenticated()) {
            router.push(`/${hotelId}/staff/login`);
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
        toast.success('Logged out successfully');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (pathname.includes('/staff/login')) {
        return <>{children}</>;
    }

    // Portal-Based Navigation Overrides
    // This allows the "Three Portals" concept to work regardless of the actual user role logged in.
    // If you are in the Kitchen "Room", you only see Kitchen tools.
    let navItems = [];

    if (pathname.includes('/kitchen')) {
        navItems = [
            { name: 'Kitchen Display', icon: ChefHat, path: `/${hotelId}/staff/kitchen` }
        ];
        // Optional: Add a 'Back' link for Admins/Managers? 
        // For now, keeping it strictly "Kitchen Portal" as requested (removing Overview/Analytics)
    } else if (pathname.includes('/payments') || pathname.includes('/funds')) {
        navItems = [
            { name: 'Payment Status', icon: Wallet, path: `/${hotelId}/staff/payments` },
            { name: 'Fund Logs', icon: DollarSign, path: `/${hotelId}/staff/funds` }
        ];
    } else {
        // Default to Role-Based Navigation for the "Main" Dashboard
        const roleNavItems = {
            waiter: [
                { name: 'Overview', icon: LayoutDashboard, path: `/${hotelId}/staff` },
                { name: 'Analytics', icon: BarChart3, path: `/${hotelId}/staff/analytics` },
                { name: 'Settings', icon: Settings, path: `/${hotelId}/staff/settings` }
            ],
            chef: [
                { name: 'Kitchen Display', icon: ChefHat, path: `/${hotelId}/staff/kitchen` },
                { name: 'Settings', icon: Settings, path: `/${hotelId}/staff/settings` }
            ],
            cashier: [
                { name: 'Payment Status', icon: Wallet, path: `/${hotelId}/staff/payments` },
                { name: 'Fund Logs', icon: DollarSign, path: `/${hotelId}/staff/funds` },
                { name: 'Settings', icon: Settings, path: `/${hotelId}/staff/settings` }
            ],
            manager: [
                { name: 'Ops Dashboard', icon: LayoutDashboard, path: `/${hotelId}/staff` },
                { name: 'Team Roster', icon: Users, path: `/${hotelId}/staff/team` },
                { name: 'Inventory Mgmt', icon: Package, path: `/${hotelId}/staff/inventory` },
                { name: 'Kitchen Display', icon: ChefHat, path: `/${hotelId}/staff/kitchen` },
                { name: 'Guest Feedback', icon: Star, path: `/${hotelId}/staff/feedback` },
                { name: 'Reservations', icon: Calendar, path: `/${hotelId}/staff/reservations` },
                { name: 'Settings', icon: Settings, path: `/${hotelId}/staff/settings` }
            ],
            admin: [
                { name: 'Overview', icon: LayoutDashboard, path: `/${hotelId}/staff` },
                { name: 'Analytics', icon: BarChart3, path: `/${hotelId}/staff/analytics` },
                { name: 'Staff Mgmt', icon: Users, path: `/${hotelId}/staff/team` },
                { name: 'Kitchen Display', icon: ChefHat, path: `/${hotelId}/staff/kitchen` },
                { name: 'Settings', icon: Settings, path: `/${hotelId}/staff/settings` }
            ]
        };
        navItems = roleNavItems[staff?.role] || roleNavItems.waiter;
    }

    const getRoleLabel = (role) => {
        switch (role) {
            case 'waiter': return 'Service Crew';
            case 'chef': return 'Kitchen Expert';
            case 'cashier': return 'Billing Lead';
            case 'manager': return 'Operations';
            case 'admin': return 'System Admin';
            default: return role;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-outfit transition-all duration-500">
            {/* Premium Sidebar Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-[60] bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-800 p-6 flex justify-between items-center transition-all">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/20">
                        <Users size={22} className="text-white" />
                    </div>
                    <div>
                      <span className="font-black text-lg uppercase tracking-tight block leading-none">Staff HQ</span>
                      <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1 italic italic">Active Session</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={toggleTheme} className="h-11 w-11 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700">
                        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                    </button>
                    <button onClick={() => setSidebarOpen(true)} className="h-11 w-11 flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl">
                        <MenuIcon size={20} />
                    </button>
                </div>
            </div>

            {/* Premium Vertical Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-[70] w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-500 lg:translate-x-0 outline-none transition-all shadow-3xl",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-full flex flex-col p-8">
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[1.25rem] bg-slate-900 dark:bg-white flex items-center justify-center shadow-2xl">
                                <Users size={24} className="text-white dark:text-slate-900" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-xl uppercase tracking-tighter leading-none dark:text-white">Staff Portal</span>
                              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-2 italic">Standardized UI</span>
                            </div>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden h-10 w-10 flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <X size={20} />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar py-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.path}
                                className={cn(
                                    "flex items-center gap-4 px-6 py-4 rounded-[1.75rem] transition-all duration-300 font-black text-[10px] uppercase tracking-[0.15em]",
                                    pathname === item.path
                                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl shadow-slate-500/10 scale-[1.02]"
                                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                                )}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <item.icon size={20} strokeWidth={pathname === item.path ? 3 : 2} />
                                <span className="truncate">{item.name}</span>
                                {pathname === item.path && (
                                  <motion.div layoutId="staffNav" className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full" />
                                )}
                            </Link>
                        ))}
                    </nav>

                    <div className="mt-auto pt-8 border-t border-slate-100 dark:border-slate-800 space-y-6">
                        <button
                            onClick={toggleTheme}
                            className="w-full h-16 flex items-center gap-4 px-6 rounded-[1.5rem] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-widest border border-transparent hover:border-slate-100 dark:hover:border-slate-700 shadow-sm"
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                            <span>{theme === 'light' ? 'Go Dark' : 'Go Light'}</span>
                        </button>

                        <div className="flex items-center gap-4 p-5 bg-slate-50/50 dark:bg-slate-800/30 rounded-[2rem] border border-slate-100/50 dark:border-slate-800">
                            <div className="w-12 h-12 rounded-[1.25rem] bg-white dark:bg-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-lg shadow-sm border border-slate-100 dark:border-slate-600">
                                {staff?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-xs uppercase tracking-tight truncate dark:text-white">{staff?.name}</p>
                                <div className="flex flex-col gap-1 mt-1">
                                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none italic">{getRoleLabel(staff?.role)}</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Outlet: {hotelId}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full h-16 flex items-center justify-center gap-4 px-6 rounded-[1.5rem] bg-rose-500 text-white shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all font-black text-[10px] uppercase tracking-widest active:scale-95"
                        >
                            <LogOut size={20} />
                            <span>Logout Session</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="lg:pl-80 min-h-screen pt-28 lg:pt-0 bg-slate-50/30 dark:bg-slate-950 transition-all">
                <header className="hidden lg:flex h-24 items-center justify-between px-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-all">
                   <div className="flex flex-col">
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                        {navItems.find(i => pathname === i.path)?.name || 'Dashboard'}
                      </h2>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic flex items-center gap-2">
                        <div className="h-1 w-1 bg-emerald-500 rounded-full animate-pulse" /> Live Operational Data
                      </p>
                   </div>
                   <div className="flex items-center gap-10">
                      <div className="flex flex-col text-right">
                         <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">System Status</p>
                         <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic leading-none mt-1">All Nodes Operational</p>
                      </div>
                      <div className="h-14 w-1 flex bg-slate-200 dark:bg-slate-800 rounded-full" />
                      <button onClick={toggleTheme} className="h-12 w-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 transition-all">
                         {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                      </button>
                   </div>
                </header>
                
                <div className="p-8 lg:p-14 max-w-7xl mx-auto pb-24 lg:pb-14">
                    {children}
                </div>
            </main>

            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[65] lg:hidden"
                    />
                )}
            </AnimatePresence>

            <AIAssistant context="staff" hotelId={hotelId} />
        </div>
    );
}

function Loader2(props) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    );
}
