'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { customerAPI } from '@/lib/api';
import { customerAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/format';
import {
  Trash2,
  Plus,
  Minus,
  ChevronLeft,
  CreditCard,
  Banknote,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  Users,
  Gift,
  Sparkles,
  ShoppingBag,
  RefreshCw,
  Trophy,
  Dices,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [splitCount, setSplitCount] = useState(1);
  const [showReward, setShowReward] = useState(false);
  const [rewardRevealed, setRewardRevealed] = useState(false);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [showRouletteModal, setShowRouletteModal] = useState(false);
  const [rouletteWinner, setRouletteWinner] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    if (!customerAuth.isValidSession(params.hotelId)) {
      router.push(`/${params.hotelId}/login`);
      return;
    }
    loadCart();
    loadSelectedTable();
  }, [params.hotelId, router]);

  const loadCart = () => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem(`cart_${params.hotelId}`);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    }
  };

  const loadSelectedTable = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`selectedTable_${params.hotelId}`);
      if (saved) {
        setSelectedTable(JSON.parse(saved));
      }
    }
  };

  const updateQuantity = (itemId, quantity) => {
    let newCart;
    if (quantity <= 0) {
      newCart = cart.filter((item) => item.menuItemId !== itemId);
    } else {
      newCart = cart.map((item) =>
        item.menuItemId === itemId ? { ...item, quantity } : item
      );
    }
    setCart(newCart);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`cart_${params.hotelId}`, JSON.stringify(newCart));
    }
  };

  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0);
  }, [cart]);

  const finalTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  const pointsEarned = useMemo(() => {
    return cart.reduce((total, item) => total + (item.isRedeemed ? 0 : item.quantity), 0);
  }, [cart]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return toast.error('Enter coupon code');
    setValidatingCoupon(true);
    try {
      const response = await customerAPI.validateCoupon(couponCode.trim(), subtotal, params.hotelId);
      if (response.data.success && response.data.valid) {
        setAppliedCoupon(response.data.coupon);
        setDiscountAmount(response.data.discountAmount || 0);
        toast.success('Coupon applied!');
      } else {
        toast.error('Invalid coupon');
      }
    } catch (err) {
      toast.error('Error validating coupon');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedTable) {
      toast.error('Select a table first');
      router.push(`/${params.hotelId}/tables`);
      return;
    }
    setLoading(true);
    const toastId = toast.loading('Placing order...');
    try {
      const customer = customerAuth.getCustomer();
      await customerAPI.createOrder({
        customerId: customer.id,
        tableId: selectedTable._id,
        items: cart.map(i => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          specialInstructions: i.specialInstructions,
          isRedeemed: i.isRedeemed
        })),

        couponCode: appliedCoupon?.code
      });
      localStorage.removeItem(`cart_${params.hotelId}`);
      localStorage.removeItem(`selectedTable_${params.hotelId}`);
      toast.success('Order placed!', { id: toastId });

      // Show gamified reward instead of immediate redirect
      setRewardPoints(Math.floor(Math.random() * 50) + 10);
      setShowReward(true);

    } catch (err) {
      toast.error('Order failed', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleBillRoulette = async () => {
    setIsSpinning(true);
    setShowRouletteModal(true);
    try {
      const response = await customerAPI.runBillRoulette({
        tableId: selectedTable._id,
        hotelId: params.hotelId
      });
      if (response.data.success) {
        setTimeout(() => {
          setRouletteWinner(response.data.winner);
          setIsSpinning(false);
          toast.success(`${response.data.winner.name} is paying!`, { icon: '🎲' });
        }, 3000);
      }
    } catch (err) {
      toast.error('Not enough participants for Roulette');
      setShowRouletteModal(false);
      setIsSpinning(false);
    }
  };

  if (cart.length === 0) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center py-20 font-outfit">
          <div className="h-20 w-20 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-400 mb-8 shadow-sm">
            <ShoppingBag size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Your cart is empty</h2>
          <p className="text-slate-500 mt-2 italic font-medium">Add some items from the menu to continue.</p>
          <Link href={`/${params.hotelId}/menu`} className="mt-10 px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition shadow-xl flex items-center gap-2">
            Browse Menu <ArrowRight size={18} />
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-6xl mx-auto space-y-12 font-outfit pb-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-10">
          <div className="flex items-center gap-6">
            <Link href={`/${params.hotelId}/menu`} className="h-14 w-14 rounded-[1.75rem] bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
              <ChevronLeft size={28} />
            </Link>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">Checkout</h1>
              <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic">Review your selection and pay</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-sm">
            <ShieldCheck size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">End-to-End Encrypted</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-slate-800 rounded-[3rem] p-4">
              {cart.map((item, idx) => (
                <motion.div 
                  key={item.menuItemId} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-6 flex items-center gap-8 border-b border-slate-50 last:border-none group"
                >
                  <div className="h-28 w-28 rounded-[2rem] overflow-hidden border border-slate-100/50 shrink-0 shadow-lg group-hover:rotate-2 transition-transform">
                    <img src={item.image} className="h-full w-full object-cover" alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col">
                        <h3 className="font-black text-slate-900 text-xl leading-none uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{item.item_name || item.name}</h3>
                        {item.isRedeemed && (
                          <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-tighter w-fit mt-2 border border-emerald-100 italic">Loyalty Reward</span>
                        )}
                      </div>
                      <p className="font-black text-2xl text-slate-900">{item.isRedeemed ? 'FREE' : formatCurrency(parseFloat(item.price) * item.quantity)}</p>
                    </div>
                    {item.specialInstructions && (
                      <p className="text-[11px] text-rose-500 italic mb-5 font-bold flex items-center gap-2">
                         <div className="h-1.5 w-1.5 bg-rose-500 rounded-full animate-pulse" />
                         Chef's Note: {item.specialInstructions}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-6 bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-inner">
                        <button onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-rose-500 hover:bg-rose-50 shadow-sm"><Minus size={16} /></button>
                        <span className="font-black text-slate-900 text-lg min-w-[24px] text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)} className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white hover:bg-slate-800 shadow-lg"><Plus size={16} /></button>
                      </div>
                      <button onClick={() => updateQuantity(item.menuItemId, 0)} className="h-12 w-12 rounded-2xl bg-white text-slate-200 hover:text-rose-500 hover:border-rose-100 border border-slate-100 flex items-center justify-center transition-all">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <Link href={`/${params.hotelId}/menu`} className="flex items-center justify-center gap-3 py-8 border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/10 transition-all font-black text-[10px] uppercase tracking-widest">
              <Plus size={20} /> Add more items from the menu
            </Link>
          </div>

          {/* Payment Summary */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-8 border-l-4 border-indigo-600 pl-4 uppercase tracking-widest text-xs">Order Summary</h2>

              <div className="mb-8">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Table Assigned</p>
                {selectedTable ? (
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-4">
                    <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl italic shadow-md shadow-indigo-100">{selectedTable.tableNumber}</div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 leading-tight">Table confirmed</p>
                      <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Dine-in Service</p>
                    </div>
                    <Link href={`/${params.hotelId}/tables`} className="text-[10px] font-bold text-indigo-600 underline uppercase tracking-widest">Change</Link>
                  </div>
                ) : (
                  <Link href={`/${params.hotelId}/tables`} className="w-full flex items-center justify-center py-4 bg-amber-50 border-2 border-dashed border-amber-200 rounded-2xl text-amber-600 font-bold text-xs uppercase tracking-widest">Select your table</Link>
                )}
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-slate-500 text-xs font-bold uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span className="text-slate-900">{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-rose-500 text-xs font-bold uppercase tracking-widest">
                    <span>Discount</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="pt-4 mt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Pay</span>
                    <span className="text-3xl font-bold text-slate-900">{formatCurrency(finalTotal)}</span>
                  </div>
                </div>

                {/* Smart Bill Splitter */}
                <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Users size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Split Bill</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSplitCount(Math.max(1, splitCount - 1))} className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-slate-500 hover:text-indigo-600 transition-colors"><Minus size={14} /></button>
                    <span className="font-bold text-slate-900 w-4 text-center">{splitCount}</span>
                    <button onClick={() => setSplitCount(Math.min(10, splitCount + 1))} className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-slate-500 hover:text-indigo-600 transition-colors"><Plus size={14} /></button>
                  </div>
                </div>

                <AnimatePresence>
                  {splitCount > 1 && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex justify-between items-center text-indigo-700">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Per Person ({splitCount})</span>
                        <span className="font-bold text-xl">{formatCurrency(finalTotal / splitCount)}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bill Roulette Trigger */}
                <div className="mt-8 p-6 bg-slate-900 text-white rounded-[2rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500"><Dices size={80} /></div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2 italic">
                       <Zap size={12} className="fill-current" /> Gamified Dining
                    </p>
                    <h3 className="text-xl font-black mb-4 leading-tight">BILL ROULETTE</h3>
                    <p className="text-white/60 text-[10px] font-medium leading-relaxed mb-6 uppercase tracking-wider">Group at the table? One person pays for everyone. Tap if you're feeling lucky!</p>
                    <button 
                      onClick={handleBillRoulette}
                      disabled={!selectedTable}
                      className="w-full py-4 bg-white text-slate-900 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      <RefreshCw size={16} className={cn(isSpinning && "animate-spin")} />
                      Start Roulette
                    </button>
                  </div>
                </div>
              </div>

              {/* Promo input */}
              <div className="flex gap-2 mb-8">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="PROMO CODE"
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-[10px] font-bold text-slate-900 uppercase tracking-widest"
                />
                <button onClick={handleApplyCoupon} className="px-5 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest">Apply</button>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Payment Type</p>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex flex-col items-center justify-center gap-1.5 py-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                    <Banknote size={24} />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Pay Cash</span>
                  </button>
                  <button disabled className="flex flex-col items-center justify-center gap-1.5 py-4 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 opacity-60">
                    <CreditCard size={24} />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Online</span>
                  </button>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading || !selectedTable}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
                >
                  Confirm Order <ArrowRight size={20} />
                </button>
              </div>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center px-6 leading-relaxed italic">By confirming, the order will be sent to the kitchen. Cash payment at table.</p>
          </div>
        </div>
      </div>

      {/* Gamified Reward Modal */}
      <AnimatePresence>
        {showReward && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 font-outfit">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.8, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="relative bg-white border border-slate-200 rounded-[3rem] p-10 max-w-sm w-full text-center shadow-2xl overflow-hidden">
              <div className="h-24 w-24 bg-gradient-to-tr from-amber-400 to-amber-200 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Gift size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 leading-tight mb-2">Mystery<br />Reward!</h2>
              <p className="text-slate-500 font-medium mb-8 text-sm italic">Tap below to reveal your bonus loyalty points for this order.</p>

              {!rewardRevealed ? (
                <button onClick={() => setRewardRevealed(true)} className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/30">
                  Reveal Reward
                </button>
              ) : (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <div className="text-5xl font-black text-emerald-500 mb-8 flex items-center justify-center gap-2">
                    +{rewardPoints} <Sparkles size={32} />
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        setLoading(true);
                        await customerAPI.claimRewardPoints({
                          customerId: customerAuth.getCustomer()?.id,
                          points: rewardPoints,
                          hotelId: params.hotelId
                        });
                        toast.success(`Success! Points added to your profile.`);
                        router.push(`/${params.hotelId}/profile`);
                      } catch (e) {
                        toast.error("Could not claim points.");
                      } finally {
                        setLoading(false);
                      }
                    }} 
                    className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm uppercase tracking-widest transition-all shadow-xl disabled:opacity-50"
                  >
                    Claim & Continue
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bill Roulette Spin Modal */}
      <AnimatePresence>
        {showRouletteModal && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 font-outfit">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-[4rem] p-14 max-w-lg w-full text-center shadow-3xl overflow-hidden">
                {isSpinning ? (
                  <div className="py-20 flex flex-col items-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-32 w-32 bg-slate-900 rounded-full flex items-center justify-center text-white mb-10 shadow-2xl">
                       <Dices size={64} />
                    </motion.div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Spinning the Wheel...</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-4 animate-pulse">Who's the lucky winner?</p>
                  </div>
                ) : (
                  <div className="py-10">
                    <div className="h-40 w-40 bg-indigo-600 rounded-full flex items-center justify-center text-white mx-auto mb-10 shadow-3xl shadow-indigo-200">
                       <Trophy size={80} />
                    </div>
                    <p className="text-indigo-600 font-black uppercase tracking-widest text-xs mb-4">The Result is in!</p>
                    <h2 className="text-5xl font-black text-slate-900 leading-tight mb-4">{rouletteWinner?.name}</h2>
                    <p className="text-slate-500 font-medium italic mb-12">congratulations, You're covering the table's joy tonight!</p>
                    <button onClick={() => setShowRouletteModal(false)} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all">Understood</button>
                  </div>
                )}
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </CustomerLayout>
  );
}
