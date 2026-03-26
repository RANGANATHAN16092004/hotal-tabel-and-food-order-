'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { customerAPI } from '@/lib/api';
import { customerAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/format';

import {
  Heart,
  Settings,
  Award,
  Trash2,
  ChefHat,
  AlertTriangle,
  Save,
  Search,
  ChevronRight,
  Share2,
  Copy,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function PreferencesPage() {
  const params = useParams();
  const router = useRouter();
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('favorites');
  const [dietaryPrefs, setDietaryPrefs] = useState([]);
  const [allergies, setAllergies] = useState('');
  const [saving, setSaving] = useState(false);

  const dietaryOptions = [
    { id: 'vegetarian', name: 'Vegetarian', icon: '🥗' },
    { id: 'vegan', name: 'Vegan', icon: '🌿' },
    { id: 'gluten-free', name: 'Gluten Free', icon: '🌾' },
    { id: 'dairy-free', name: 'Dairy Free', icon: '🥛' },
    { id: 'nut-free', name: 'Nut Free', icon: '🥜' },
    { id: 'halal', name: 'Halal', icon: '🌙' },
    { id: 'kosher', name: 'Kosher', icon: '🕎' }
  ];

  useEffect(() => {
    if (!customerAuth.isValidSession(params.hotelId)) {
      router.push(`/${params.hotelId}/login`);
      return;
    }
    const customer = customerAuth.getCustomer();
    fetchPreferences(customer.id);
  }, [params.hotelId]);

  const fetchPreferences = async (customerId) => {
    try {
      const response = await customerAPI.getPreferences(customerId);
      if (response.data.success) {
        const prefs = response.data.preferences;
        setPreferences(prefs);
        if (prefs) {
          setDietaryPrefs(prefs.dietaryPreferences || []);
          setAllergies((prefs.allergies || []).join(', '));
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDietaryToggle = (prefId) => {
    setDietaryPrefs(prev =>
      prev.includes(prefId)
        ? prev.filter(p => p !== prefId)
        : [...prev, prefId]
    );
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      const customer = customerAuth.getCustomer();
      await customerAPI.updatePreferences({
        customerId: customer.id,
        hotelId: customer.hotelId,
        dietaryPreferences: dietaryPrefs,
        allergies: allergies.split(',').map(a => a.trim()).filter(a => a)
      });
      toast.success('Preferences updated successfully!');
      fetchPreferences(customer.id);
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFavorite = async (menuItemId) => {
    try {
      const customer = customerAuth.getCustomer();
      await customerAPI.removeFavorite(customer.id, menuItemId);
      toast.success('Removed from favorites');
      fetchPreferences(customer.id);
    } catch (error) {
      toast.error('Failed to remove favorite');
    }
  };

  const copyReferral = () => {
    if (preferences?.referralCode) {
      navigator.clipboard.writeText(preferences.referralCode);
      toast.success('Code copied to clipboard');
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 border-4 border-slate-200 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      </CustomerLayout>
    );
  }

  const tabs = [
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'dietary', label: 'Kitchen Profile', icon: ChefHat },
    { id: 'loyalty', label: 'Loyalty', icon: Award }
  ];

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight italic">
              Member<span className="text-indigo-600 italic">Preferences</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium italic">Customize your dining experience.</p>
          </div>

          <div className="flex p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-x-auto no-scrollbar transition-colors">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                )}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'favorites' && (
            <motion.div
              key="favs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {preferences?.favoriteItems && preferences.favoriteItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {preferences.favoriteItems.map((item) => (
                    <motion.div
                      layout
                      key={item._id}
                      className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all duration-500"
                    >
                      <div className="h-48 relative overflow-hidden">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400'}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute top-4 right-4 h-10 w-10 bg-slate-950/40 backdrop-blur-md rounded-xl flex items-center justify-center text-white cursor-pointer hover:bg-rose-500 transition-colors"
                          onClick={() => handleRemoveFavorite(item._id)}>
                          <Trash2 size={16} />
                        </div>
                        <div className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-white/20">
                          <Zap size={10} /> {item.category}
                        </div>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="space-y-1">
                          <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-lg uppercase tracking-tight">{item.name}</h3>
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">{formatCurrency(item.price)}</p>
                        </div>
                        <Link
                          href={`/${params.hotelId}/menu`}
                          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all group/btn"
                        >
                          Order Now <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] transition-colors">
                  <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-slate-300 dark:text-slate-700 mx-auto mb-6">
                    <Heart size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white italic uppercase tracking-tight mb-2">No Favorites Yet</h3>
                  <p className="text-slate-500 dark:text-slate-500 text-sm font-medium mb-10 max-w-xs mx-auto italic">Explore our curated menu and save dishes that speak to your palate.</p>
                  <Link
                    href={`/${params.hotelId}/menu`}
                    className="inline-flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform"
                  >
                    Explore Menu <Search size={16} />
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {/* Dietary Profile */}
          {activeTab === 'dietary' && (
            <motion.div
              key="diet"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 sm:p-12 transition-colors">
                <div className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <ChefHat size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Dietary Architecture</h2>
                    <p className="text-xs text-slate-500 font-medium">Inform our kitchen of your molecular requirements.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
                  {dietaryOptions.map((option) => {
                    const isSelected = dietaryPrefs.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleDietaryToggle(option.id)}
                        className={cn(
                          "flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all duration-300 h-32",
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 dark:shadow-none"
                            : "bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700"
                        )}
                      >
                        <span className="text-2xl mb-2">{option.icon}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">{option.name}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1 text-[10px] font-black text-rose-500 uppercase tracking-widest">
                    <AlertTriangle size={14} /> Allergy Protocols
                  </div>
                  <textarea
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-rose-500/20 outline-none transition-all min-h-[120px] resize-none"
                    placeholder="Ex: Severe peanut allergy, Lactose sensitive, Shellfish..."
                  />
                  <p className="text-[10px] font-medium text-slate-400 italic">Separate multiple items with commas. Our executive chef reviews these live.</p>
                </div>

                <div className="mt-12 flex justify-end">
                  <button
                    onClick={handleSavePreferences}
                    disabled={saving}
                    className="inline-flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 shadow-xl"
                  >
                    {saving ? <div className="h-4 w-4 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" /> : <><Save size={16} /> Calibrate Profile</>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Loyalty Console */}
          {activeTab === 'loyalty' && (
            <motion.div
              key="loyalty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Loyalty Card Visualization */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[3rem] blur opacity-25 group-hover:opacity-40 transition" />
                <div className="relative bg-slate-950 rounded-[3rem] p-10 overflow-hidden border border-white/10">
                  {/* Abstract Shapes */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

                  <div className="relative flex flex-col md:flex-row justify-between gap-12">
                    <div className="space-y-8">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                          <Award className="text-indigo-400" size={32} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-1">DineSmart Elite</p>
                          <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">Membership ID</h2>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-400 uppercase tracking-widest leading-none">Available Credits</p>
                        <div className="flex items-end gap-3">
                          <span className="text-6xl font-black text-white tracking-tighter italic">{preferences?.loyaltyPoints || 0}</span>
                          <span className="text-indigo-400 font-bold mb-2 uppercase tracking-wide">PTS</span>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[9px] font-bold text-slate-300 uppercase tracking-widest">EST. 2024</div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 text-[9px] font-bold text-emerald-400 uppercase tracking-widest">ACTIVE STATUS</div>
                      </div>
                    </div>

                    <div className="md:w-64 space-y-6">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Referral Code</p>
                        <div className="flex items-center gap-3 p-4 bg-white/10 rounded-2xl border border-white/10 group/code">
                          <span className="font-mono text-xl font-bold text-white uppercase tracking-tighter flex-1">{preferences?.referralCode || 'DS-SYNC'}</span>
                          <button onClick={copyReferral} className="p-2 text-slate-400 hover:text-white transition-colors">
                            <Copy size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Membership Progress</p>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(((preferences?.loyaltyPoints || 0) / 1000) * 100, 100)}%` }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                          />
                        </div>
                        <p className="text-[9px] font-medium text-slate-500 italic text-right">Earn 1,000 pts for Premium Unlock</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { label: 'Network Expand', icon: Share2, desc: 'Invite nodes to the network and earn 50 credits per validation.' },
                  { label: 'Culinary Cycle', icon: Utensils, desc: 'Earn 1% credit volume on every molecular synthesis (Order).' },
                  { label: 'Token Burn', icon: Zap, desc: 'Burn available credits for fiscal discounts on checkout.' }
                ].map((perk, i) => (
                  <div key={i} className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-3 transition-colors">
                    <div className="h-10 w-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <perk.icon size={20} />
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-sm">{perk.label}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-500 font-medium leading-relaxed italic">{perk.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </CustomerLayout>
  );
}





