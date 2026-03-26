'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  UtensilsCrossed, 
  LayoutGrid, 
  ShoppingBag, 
  User, 
  Ticket,
  Calendar,
  Star,
  MessageSquare
} from 'lucide-react';

export default function CustomerBottomNav({ hotelId }) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Menu', icon: UtensilsCrossed, href: `/${hotelId}/menu` },
    { label: 'Tables', icon: LayoutGrid, href: `/${hotelId}/tables` },
    { label: 'Reserve', icon: Calendar, href: `/${hotelId}/reserve` },
    { label: 'Reviews', icon: Star, href: `/${hotelId}/reviews` },
    { label: 'Feedback', icon: MessageSquare, href: `/${hotelId}/feedback` },
    { label: 'Market', icon: Ticket, href: `/${hotelId}/marketplace` },
    { label: 'Cart', icon: ShoppingBag, href: `/${hotelId}/order` },
    { label: 'Profile', icon: User, href: `/${hotelId}/profile` },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] p-4 bg-gradient-to-t from-slate-900/5 to-transparent pointer-events-none">
      <div className="bg-white/80 backdrop-blur-2xl border border-white/40 rounded-[2rem] shadow-2xl p-2 flex justify-between items-center pointer-events-auto shadow-indigo-500/10">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className="relative flex-1 group">
              <div className={cn(
                "flex flex-col items-center justify-center py-2 transition-all duration-300",
                isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
              )}>
                <div className={cn(
                  "p-2 rounded-2xl transition-all duration-500 mb-1 relative",
                  isActive ? "bg-indigo-50" : "bg-transparent"
                )}>
                  {isActive && (
                    <motion.div 
                      layoutId="activeNav"
                      className="absolute inset-0 bg-indigo-100/50 rounded-2xl -z-10"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-widest",
                  isActive ? "opacity-100" : "opacity-60"
                )}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
