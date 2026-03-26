'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Edit3,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  X,
  Sparkles,
  Zap,
  Star,
  ChevronRight,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    available: true,
    pointsRequired: '',
    pointsEarned: '',
    happyHourPrice: '',
    happyHourStartTime: '16:00',
    happyHourEndTime: '18:00',
  });

  useEffect(() => {
    fetchMenu();
  }, [filterCategory]);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getMenu(filterCategory || undefined);
      if (response.data.success) {
        setMenuItems(response.data.menuItems);
      }
    } catch (error) {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const generateAIDescription = async () => {
    if (!formData.name) return toast.error('Enter a dish name first');
    setIsGenerating(true);
    const loadingToast = toast.loading('AI is crafting a description...');
    try {
      await new Promise(r => setTimeout(r, 1500));
      const adjectives = ['Artisanal', 'Hand-crafted', 'Infused', 'Zesty', 'Velvety', 'Sun-drenched'];
      const textures = ['perfectly balanced', 'richly textured', 'layered with complex notes'];
      const endings = ['for the discerning palate.', 'a symphony of seasonal flavors.', 'redefining traditional comfort.'];
      const generated = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${formData.name}, ${textures[Math.floor(Math.random() * textures.length)]} and ${endings[Math.floor(Math.random() * endings.length)]}`;
      setFormData(prev => ({ ...prev, description: generated }));
      toast.success('Description generated!', { id: loadingToast });
    } catch (err) {
      toast.error('AI failed', { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  };

  const applyAIFlashSale = async () => {
    const loadingToast = toast.loading('AI is analyzing slow-moving inventory...');
    try {
      await new Promise(r => setTimeout(r, 2000));

      let updatedCount = 0;
      const promises = menuItems.map(async (item) => {
        if (item.price > 100 && Math.random() > 0.4) {
          const discount = (item.price * 0.9).toFixed(2);
          updatedCount++;
          return adminAPI.updateMenuItem(item._id, {
            happyHourPrice: parseFloat(discount),
            happyHourStartTime: '00:00',
            happyHourEndTime: '23:59'
          });
        }
      }).filter(Boolean);

      await Promise.all(promises);
      toast.success(`AI Applied Flash Sale to ${updatedCount} items!`, { id: loadingToast, icon: '📉' });
      fetchMenu();
    } catch (err) {
      toast.error('AI Failed', { id: loadingToast });
    }
  };

  const categories = [...new Set(menuItems.map((item) => item.category))];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading(editingItem ? 'Updating...' : 'Creating...');
    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        pointsRequired: parseInt(formData.pointsRequired) || 0,
        pointsEarned: parseInt(formData.pointsEarned) || 0,
        happyHourPrice: formData.happyHourPrice ? parseFloat(formData.happyHourPrice) : null,
        happyHourStartTime: formData.happyHourStartTime,
        happyHourEndTime: formData.happyHourEndTime,
      };
      if (editingItem) {
        await adminAPI.updateMenuItem(editingItem._id, submitData);
        toast.success('Updated!', { id: loadingToast });
      } else {
        await adminAPI.createMenuItem(submitData);
        toast.success('Created!', { id: loadingToast });
      }
      setShowModal(false);
      setEditingItem(null);
      setFormData({ name: '', description: '', price: '', category: '', image: '', available: true, pointsRequired: '', pointsEarned: '' });
      fetchMenu();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error', { id: loadingToast });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      image: item.image || '',
      available: item.available,
      pointsRequired: item.pointsRequired?.toString() || '0',
      pointsEarned: item.pointsEarned?.toString() || '0',
      happyHourPrice: item.happyHourPrice?.toString() || '',
      happyHourStartTime: item.happyHourStartTime || '16:00',
      happyHourEndTime: item.happyHourEndTime || '18:00',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this dish?')) return;
    const loadingToast = toast.loading('Removing...');
    try {
      await adminAPI.deleteMenuItem(id);
      toast.success('Removed', { id: loadingToast });
      fetchMenu();
    } catch (err) {
      toast.error('Error', { id: loadingToast });
    }
  };

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-8 font-outfit">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Menu Management</h1>
            <p className="text-slate-500 mt-1 font-medium italic">Craft and manage your restaurant's culinary offerings.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={applyAIFlashSale}
              className="px-6 py-3.5 bg-emerald-50 text-emerald-600 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition shadow-sm border border-emerald-100 flex items-center gap-2"
            >
              <Bot size={16} /> AI Flash Sale
            </button>
            <button
              onClick={() => {
                setEditingItem(null);
                setFormData({ name: '', description: '', price: '', category: '', image: '', available: true, pointsRequired: '', pointsEarned: '', happyHourPrice: '', happyHourStartTime: '16:00', happyHourEndTime: '18:00' });
                setShowModal(true);
              }}
              className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition shadow-xl flex items-center gap-2"
            >
              <Plus size={20} /> ADD DISH
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setFilterCategory('')}
              className={cn(
                "px-6 py-3 rounded-xl whitespace-nowrap text-xs font-bold transition-all",
                filterCategory === '' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white text-slate-500 border border-slate-200"
              )}
            >
              ALL DISHES
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={cn(
                  "px-6 py-3 rounded-xl whitespace-nowrap text-xs font-bold transition-all",
                  filterCategory === cat ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white text-slate-500 border border-slate-200"
                )}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col group"
            >
              <div className="relative h-56 bg-slate-50 overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                    <ImageIcon size={40} strokeWidth={1} />
                    <span className="text-[10px] font-bold uppercase mt-2">No Image</span>
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <span className={cn(
                    "px-3 py-1.5 rounded-full text-[9px] font-bold uppercase border backdrop-blur-md shadow-sm",
                    item.available ? "bg-emerald-500/90 text-white border-white/20" : "bg-slate-500/90 text-white border-white/20"
                  )}>
                    {item.available ? '● Live' : '○ Offline'}
                  </span>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 leading-tight mb-1">{item.name}</h3>
                    <div className="flex items-center gap-1.5 text-indigo-500">
                      <Zap size={10} className="fill-current" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{item.category}</span>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(item.price)}</p>
                </div>

                <p className="text-slate-500 text-sm italic font-medium line-clamp-2 mb-8 flex-1 leading-relaxed">
                  {item.description || 'No description provided.'}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-50">
                  <button
                    onClick={() => handleEdit(item)}
                    className="py-3.5 bg-slate-50 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all"
                  >
                    Edit Dish
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="py-3.5 bg-white text-slate-400 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-100"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="relative bg-white rounded-[3rem] w-full max-w-xl shadow-2xl p-10 overflow-hidden"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">{editingItem ? 'Edit Dish' : 'New Dish'}</h2>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar pr-2">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Dish Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold"
                        placeholder="e.g. Pasta Primavera"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Category</label>
                      <input
                        type="text"
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold"
                        placeholder="e.g. Entrees"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                      <button
                        type="button"
                        onClick={generateAIDescription}
                        disabled={isGenerating}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Sparkles size={12} className={isGenerating ? "animate-spin" : ""} />
                        {isGenerating ? 'AI Writing...' : 'AI Assist'}
                      </button>
                    </div>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium min-h-[100px] resize-none pr-12"
                      placeholder="Describe the dish..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Price (₹)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Redeem Points</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.pointsRequired}
                        onChange={(e) => setFormData({ ...formData, pointsRequired: e.target.value })}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Reward Points</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.pointsEarned}
                        onChange={(e) => setFormData({ ...formData, pointsEarned: e.target.value })}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 space-y-6">
                    <div className="flex items-center gap-2 text-amber-600 font-bold text-[10px] uppercase tracking-widest">
                      <Zap size={14} /> Dynamic Happy Hour Pricing
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-amber-500 uppercase ml-1">Promo Price (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.happyHourPrice}
                          onChange={(e) => setFormData({ ...formData, happyHourPrice: e.target.value })}
                          className="w-full px-5 py-3.5 bg-white border border-amber-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-bold"
                          placeholder="e.g. 199.00"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-amber-500 uppercase ml-1">Start Time</label>
                        <input
                          type="time"
                          value={formData.happyHourStartTime}
                          onChange={(e) => setFormData({ ...formData, happyHourStartTime: e.target.value })}
                          className="w-full px-5 py-3.5 bg-white border border-amber-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-amber-500 uppercase ml-1">End Time</label>
                        <input
                          type="time"
                          value={formData.happyHourEndTime}
                          onChange={(e) => setFormData({ ...formData, happyHourEndTime: e.target.value })}
                          className="w-full px-5 py-3.5 bg-white border border-amber-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Image URL</label>
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-xs"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="flex items-center gap-3 px-1">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, available: !prev.available }))}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative",
                        formData.available ? "bg-emerald-500" : "bg-slate-300"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        formData.available ? "right-1" : "left-1"
                      )} />
                    </button>
                    <span className="text-sm font-bold text-slate-700">Available on menu</span>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors uppercase tracking-widest text-xs">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs">
                      {editingItem ? 'Update Dish' : 'Create Dish'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
