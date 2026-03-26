'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { customerAPI } from '@/lib/api';
import { customerAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/format';
import { 
  ShoppingBag, 
  Sparkles, 
  Gift, 
  ArrowRight, 
  CheckCircle2, 
  Crown,
  Shirt,
  Ticket,
  ChevronLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function MarketplacePage() {
  const params = useParams();
  const router = useRouter();
  const [merchItems, setMerchItems] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerAuth.isValidSession(params.hotelId)) {
      router.push(`/${params.hotelId}/login`);
      return;
    }
    const customerData = customerAuth.getCustomer();
    setCustomer(customerData);
    fetchMerch();
  }, [params.hotelId, router]);

  const fetchMerch = async () => {
    try {
      // Mock data for VIP/Merch if none in DB
      const response = await customerAPI.getMenu(params.hotelId);
      const dbMerch = (response.data.menuItems || []).filter(i => i.isMerch);
      
      const staticMerch = [
        {
          _id: 'vip-pass',
          name: 'DineSmart Gold Pass',
          description: 'Unlock priority seating and free desserts for 30 days.',
          price: 0,
          pointsRequired: 2000,
          image: 'https://images.unsplash.com/photo-1590483736622-39da32506b3e?w=800',
          type: 'VIP'
        },
        {
          _id: 't-shirt',
          name: 'Classic Branded Tee',
          description: 'High-quality 100% cotton restaurant branded t-shirt.',
          price: 0,
          pointsRequired: 500,
          image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
          type: 'MERCH'
        }
      ];

      setMerchItems([...dbMerch, ...staticMerch]);
    } catch (e) {
      toast.error('Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (item) => {
    if ((customer?.loyaltyPoints || 0) < item.pointsRequired) {
      toast.error('Not enough points');
      return;
    }

    try {
      setLoading(true);
      // Logic would go here to create a 'merch order'
      toast.success(`Redeemed ${item.name}! Check your email for details.`, { icon: '🎁' });
      
      // Update local loyalty points
      const updated = { ...customer, loyaltyPoints: customer.loyaltyPoints - item.pointsRequired };
      customerAuth.setCustomer(updated);
      setCustomer(updated);
    } catch (e) {
      toast.error('Redemption failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerLayout>
      <div className="max-w-6xl mx-auto space-y-16 pb-32 font-outfit">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-10">
          <div className="flex items-center gap-6">
            <button onClick={() => router.back()} className="h-14 w-14 bg-white border border-slate-200 rounded-[1.75rem] flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
              <ChevronLeft size={28} />
            </button>
            <div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none uppercase">Dine Market</h1>
              <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic">Redeem items with your hard-earned points</p>
            </div>
          </div>
          <div className="bg-slate-900 text-white p-8 rounded-[3rem] flex items-center gap-8 shadow-3xl border border-slate-800 relative overflow-hidden group">
             <div className="absolute inset-0 bg-indigo-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700 opacity-20" />
             <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 relative z-10">
               <Sparkles size={28} />
             </div>
             <div className="relative z-10">
               <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] leading-none mb-2 italic">Current Balance</p>
               <p className="text-4xl font-black leading-none">{customer?.loyaltyPoints || 0} <span className="text-xs text-indigo-400/50">PTS</span></p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {merchItems.map((item, idx) => (
            <motion.div 
               key={item._id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: idx * 0.1 }}
               className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden flex flex-col group hover:shadow-3xl hover:shadow-indigo-500/10 transition-all h-full"
            >
               <div className="relative h-72 overflow-hidden">
                  <img src={item.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="absolute top-6 right-6">
                     <div className="px-5 py-2.5 bg-white/90 backdrop-blur-md text-slate-900 rounded-full text-[9px] font-black uppercase tracking-widest border border-white shadow-xl flex items-center gap-2">
                       {item.type === 'VIP' ? <Crown size={14} className="text-amber-500"/> : <Shirt size={14} className="text-indigo-500"/>} {item.type || 'ITEM'}
                     </div>
                  </div>
               </div>
               
               <div className="p-10 flex-1 flex flex-col">
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-3 group-hover:text-indigo-600 transition-colors primary-heading">{item.name}</h3>
                  <p className="text-slate-500 text-sm font-medium italic mb-12 flex-1 leading-relaxed opacity-70 italic">{item.description}</p>
                  
                  <div className="mt-auto space-y-6">
                     <div className="flex justify-between items-end border-t border-slate-50 pt-6">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 italic">COST TO REDEEM</p>
                          <p className="text-4xl font-black text-slate-900">{item.pointsRequired} <span className="text-[10px] text-slate-300 uppercase">Points</span></p>
                        </div>
                        {customer?.loyaltyPoints >= item.pointsRequired && (
                          <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-100 shadow-sm">
                             <CheckCircle2 size={24} />
                          </div>
                        )}
                     </div>

                     <button 
                       disabled={loading || (customer?.loyaltyPoints || 0) < item.pointsRequired}
                       onClick={() => handleRedeem(item)}
                       className={cn(
                        "w-full h-18 text-white rounded-[1.75rem] font-black uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 transition-all text-sm",
                        (customer?.loyaltyPoints || 0) >= item.pointsRequired 
                          ? "bg-slate-900 hover:bg-slate-800" 
                          : "bg-slate-100 text-slate-300 pointer-events-none"
                       )}
                     >
                       REDEEM NOW <Gift size={20} />
                     </button>
                  </div>
               </div>
            </motion.div>
          ))}
        </div>
      </div>
    </CustomerLayout>
  );
}
