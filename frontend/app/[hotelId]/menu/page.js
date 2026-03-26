'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { customerAPI, aiAPI } from '@/lib/api';
import { customerAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/format';
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  X,
  SlidersHorizontal,
  Heart,
  Sparkles,
  Zap,
  Star,
  BrainCircuit,
  Flame,
  CheckCircle2,
  Mic,
  Table as TableIcon,
  Leaf,
  Box,
  Ticket,
  Vote,
  Gift,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import socketService from '@/lib/socket';

export default function MenuPage() {
  const [language, setLanguage] = useState('en');
  const { t } = useTranslation(language);
  const params = useParams();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [selectedItemForMods, setSelectedItemForMods] = useState(null);
  const [itemModifications, setItemModifications] = useState({
    specialInstructions: '',
    modifications: [],
    dietaryNotes: []
  });
  const [recommendations, setRecommendations] = useState([]);
  const [isHappyHour, setIsHappyHour] = useState(false);
  const [hotel, setHotel] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);
  const [pendingCartItem, setPendingCartItem] = useState(null);
  const [pendingModifications, setPendingModifications] = useState(null);
  const [activePoll, setActivePoll] = useState(null);
  const [showMysteryModal, setShowMysteryModal] = useState(false);
  const [mysteryBudget, setMysteryBudget] = useState(500);
  const [showGiftingModal, setShowGiftingModal] = useState(false);
  const [giftingData, setGiftingData] = useState({ toTable: '', itemId: null });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!customerAuth.isValidSession(params.hotelId)) {
      router.push(`/${params.hotelId}/login`);
      return;
    }
    const customerData = customerAuth.getCustomer();
    setCustomer(customerData);
    
    // Proactively show table modal only if definitely NO table and not already showing
    if (customerData && !customerData.tableId) {
      setShowTableModal(true);
    }
    
    fetchHotelDetails();
    fetchMenu(params.hotelId);
    loadCart();
    fetchFavorites(customerData.id);
    fetchRecommendations(customerData.id, customerData.hotelId);

    // Join table room for group ordering
    if (customerData.tableId) {
      const socket = socketService.connect();
      socket.emit('join-table', customerData.tableId);
      socket.emit('join-hotel', customerData.hotelId);

      // Listen for cart syncs from other table members
      socket.on('cart-synced', (data) => {
        if (data.updatedBy !== customerData.id) {
          setCart(data.cart);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`cart_${params.hotelId}`, JSON.stringify(data.cart));
          }
          toast('Table cart updated by another guest', { icon: '🤝' });
        }
      });

      // Listen for global hotel menu updates
      socket.on('menu-updated', () => {
        fetchMenu(customerData.hotelId);
        toast('Menu has been updated', { icon: '📜' });
      });

      // Socket: Poll Updates
      socket.on('poll-updated', (poll) => {
        setActivePoll(poll);
      });

      // Socket: Gifting
      socket.on('gift-received', (data) => {
        toast(`${data.fromTable} sent you a ${data.itemName}!`, { 
          icon: '🎁', 
          duration: 10000 
        });
      });

      return () => {
        socket.off('cart-synced');
        socket.off('menu-updated');
      };
    }

    checkHappyHour();
    fetchTables();
  }, [params.hotelId, router]);

  const fetchTables = async () => {
    try {
      const response = await customerAPI.getTables(params.hotelId);
      if (response.data.success) {
        setAvailableTables(response.data.tables);
      }
    } catch (err) {
      console.error('Table fetch error:', err);
    }
  };

  const handleTableSelect = async (tableId) => {
    try {
      setLoading(true);
      const updatedCustomer = { ...customer, tableId };
      customerAuth.setCustomer(updatedCustomer);
      setCustomer(updatedCustomer);
      
      setShowTableModal(false);
      
      if (pendingCartItem) {
        addToCart(pendingCartItem, pendingModifications);
        setPendingCartItem(null);
        setPendingModifications(null);
      }
      
      toast(`Table ${availableTables.find(t => t._id === tableId)?.tableNumber} selected!`, { icon: '🍽️' });
    } catch (err) {
      toast.error('Table selection failed');
    } finally {
      setLoading(false);
    }
  };

  const checkHappyHour = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    // Default happy hour 16:00 - 18:00
    if (currentTime >= "16:00" && currentTime <= "18:00") {
      setIsHappyHour(true);
    }
  };

  const isItemInHappyHour = (item) => {
    if (!item.happyHourPrice) return false;

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    const startTime = item.happyHourStartTime || "16:00";
    const endTime = item.happyHourEndTime || "18:00";

    return currentTime >= startTime && currentTime <= endTime;
  };

  const fetchRecommendations = async (customerId, hotelId) => {
    try {
      const response = await customerAPI.getRecommendations(customerId, hotelId);
      if (response.data.success) {
        setRecommendations(response.data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const fetchFavorites = async (customerId) => {
    try {
      const prefResponse = await customerAPI.getPreferences(customerId);
      if (prefResponse.data.success && prefResponse.data.preferences) {
        setFavorites(prefResponse.data.preferences.favoriteItems?.map(item => item._id || item) || []);
      }

      const custResponse = await customerAPI.getCustomer(customerId);
      if (custResponse.data.success) {
        setCustomer(custResponse.data.customer);
        customerAuth.setCustomer(custResponse.data.customer);
      }
    } catch (error) {
      console.error('Error fetching favorites/customer:', error);
    }
  };

  const toggleFavorite = async (e, itemId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const customer = customerAuth.getCustomer();
      if (favorites.includes(itemId)) {
        await customerAPI.removeFavorite(customer.id, itemId);
        setFavorites(prev => prev.filter(id => id !== itemId));
        toast.success('Removed from favorites');
      } else {
        await customerAPI.addFavorite(customer.id, itemId);
        setFavorites(prev => [...prev, itemId]);
        toast.success('Added to favorites');
      }
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  const fetchHotelDetails = async () => {
    try {
      const response = await customerAPI.getHotelByQR(params.hotelId);
      if (response.data.success) {
        setHotel(response.data.hotel);
        if (response.data.hotel.hourlyPoll?.isActive) {
          setActivePoll(response.data.hotel.hourlyPoll);
        }
      }
    } catch (error) {
      console.error('Error fetching hotel details:', error);
    }
  };

  const fetchMenu = async (id) => {
    setLoading(true);
    try {
      const response = await customerAPI.getMenu(id, selectedCategory || undefined);
      if (response.data.success) {
        setMenuItems(response.data.menuItems);
        setCategories(response.data.categories);
        
        // Auto-extract active poll from hotel data if available
        // (Assuming fetchHotelDetails sets the hotel state)
      }
    } catch (error) {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const handleMysteryOrder = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.createMysteryOrder({
        customerId: customer.id,
        hotelId: params.hotelId,
        tableId: customer.tableId,
        budget: mysteryBudget
      });
      if (response.data.success) {
        toast.success("Mystery Box Ordered! Check the Status tab.", { icon: '🎁' });
        setShowMysteryModal(false);
      }
    } catch (err) {
      toast.error("Budget check failed.");
    } finally {
      setLoading(false);
    }
  };

  const castVote = async (option) => {
    try {
      const resp = await customerAPI.castVote({ hotelId: params.hotelId, option });
      if (resp.data.success) {
        toast.success("Vote cast!", { icon: '🗳️' });
        setActivePoll(resp.data.poll);
      }
    } catch (e) {
      toast.error("Voting failed");
    }
  };

  const loadCart = () => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem(`cart_${params.hotelId}`);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    }
  };

  const saveCart = (newCart) => {
    setCart(newCart);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`cart_${params.hotelId}`, JSON.stringify(newCart));
      window.dispatchEvent(new Event('cart-updated'));
    }

    // Broadcast for Group Ordering
    const customer = customerAuth.getCustomer();
    if (customer && customer.tableId) {
      const socket = socketService.connect();
      socket.emit('update-cart', {
        tableId: customer.tableId,
        cart: newCart,
        userId: customer.id
      });
    }
  };

  const addToCart = (item, modifications = null) => {
    // Crucial: Re-read from session for the latest data to handle race conditions
    const latestCustomer = customerAuth.getCustomer();
    
    // If tableId exists in EITHER the latest session OR our current state, we are good to go.
    if (!latestCustomer?.tableId && !customer?.tableId) {
      setPendingCartItem(item);
      setPendingModifications(modifications);
      setShowTableModal(true);
      return;
    }

    const existingItemIndex = cart.findIndex((cartItem) =>
      cartItem.menuItemId === item._id &&
      JSON.stringify(cartItem.modifications) === JSON.stringify(modifications?.modifications || [])
    );

    let newCart;
    const cartItem = {
      menuItemId: item._id,
      name: item._name || item.name,
      price: modifications?.isRedeemed ? 0 : item.price,
      quantity: 1,
      image: item.image,
      isRedeemed: modifications?.isRedeemed || false,
      pointsRequired: item.pointsRequired || 0,
      specialInstructions: modifications?.specialInstructions || '',
      modifications: modifications?.modifications || [],
      dietaryNotes: modifications?.dietaryNotes || []
    };

    if (modifications?.isRedeemed) {
      cartItem.name = `${item.name} (Redeemed)`;
    }

    if (existingItemIndex > -1) {
      newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
    } else {
      newCart = [...cart, cartItem];
    }

    saveCart(newCart);
    setSelectedItemForMods(null);
    setItemModifications({ specialInstructions: '', modifications: [], dietaryNotes: [] });
    toast.success(`${item.name} added to cart`);
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
    saveCart(newCart);
  };

  const getCartCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const dietaryOptions = [
    { id: 'vegetarian', name: 'Veg', icon: '🥗' },
    { id: 'vegan', name: 'Vegan', icon: '🌿' },
    { id: 'non-veg', name: 'Non-Veg', icon: '🍗' },
    { id: 'gluten-free', name: 'Gluten Free', icon: '🌾' }
  ];
  const [selectedDietary, setSelectedDietary] = useState([]);

  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory && item.category !== selectedCategory) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!item.name.toLowerCase().includes(query) &&
        !item.description?.toLowerCase().includes(query) &&
        !item.category.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (showFavoritesOnly && !favorites.includes(item._id)) return false;

    // Dietary filtering
    if (selectedDietary.length > 0) {
      const itemDietary = (item.dietary || []).map(d => d.toLowerCase());
      // Handle special case for veg/non-veg
      if (selectedDietary.includes('vegetarian') && item.isVeg === false) return false;
      if (selectedDietary.includes('non-veg') && item.isVeg === true) return false;

      // Check other dietary tags
      const otherDietary = selectedDietary.filter(d => d !== 'vegetarian' && d !== 'non-veg');
      if (otherDietary.length > 0 && !otherDietary.some(d => itemDietary.includes(d))) return false;
    }

    return true;
  });

  const toggleDietary = (id) => {
    setSelectedDietary(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleVoiceOrder = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice ordering is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'en' ? 'en-US' : language === 'hi' ? 'hi-IN' : language === 'fr' ? 'fr-FR' : 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast.success('Listening... Speak your order!', { icon: '🎙️' });
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      const loadingToast = toast.loading('Processing voice order...', { icon: '🧠' });

      try {
        const response = await aiAPI.voiceOrder({ transcript, menuList: menuItems });
        if (response.data.success && response.data.items && response.data.items.length > 0) {
          let processedItems = 0;
          let newCart = [...cart]; // Use current cart state snapshot
          response.data.items.forEach(orderItem => {
            const item = menuItems.find(m => m._id === orderItem.menuItemId);
            if (item) {
              const existingItemIndex = newCart.findIndex((cartItem) => cartItem.menuItemId === item._id && cartItem.modifications.length === 0);
              if (existingItemIndex > -1) {
                newCart[existingItemIndex].quantity += (orderItem.quantity || 1);
              } else {
                newCart.push({
                  menuItemId: item._id,
                  name: item.name,
                  price: item.price,
                  quantity: orderItem.quantity || 1,
                  image: item.image,
                  isRedeemed: false,
                  pointsRequired: item.pointsRequired || 0,
                  specialInstructions: '',
                  modifications: [],
                  dietaryNotes: []
                });
              }
              processedItems += (orderItem.quantity || 1);
            }
          });
          saveCart(newCart);
          toast.success(`Added ${processedItems} items from voice command!`, { id: loadingToast });
        } else {
          toast.error("Couldn't match items to menu. Try again.", { id: loadingToast });
        }
      } catch (err) {
        toast.error("Voice processing failed.", { id: loadingToast });
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      toast.error('Voice input failed or timed out.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <CustomerLayout>
      <div className="space-y-10 font-outfit">
        {/* Hero Header */}
        <div className="relative h-48 lg:h-64 rounded-[3rem] overflow-hidden bg-slate-900 border border-slate-200 shadow-xl">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&auto=format&fit=crop&q=60')] bg-cover bg-center opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-transparent" />
          <div className="absolute inset-0 p-10 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight">
                {hotel?.name || (language === 'hi' ? 'स्वाद का अनुभव करें' : language === 'fr' ? 'Découvrez les Saveurs' : language === 'es' ? 'Descubre Sabores' : 'Experience Flavors')}
              </h1>
              <p className="text-slate-300 mt-2 font-medium italic">
                {hotel?.address ? `${hotel.address}` : (language === 'hi' ? 'आपके लिए हाथ से बनाए गए लजीज व्यंजन।' : 'Hand-crafted culinary delights for you.')}
              </p>
            </div>
            <div className="flex gap-4 items-center">
              {/* Language Switcher */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-2xl flex gap-1">
                {['en', 'hi', 'fr', 'es'].map(l => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    className={cn(
                      "w-10 h-10 rounded-xl text-[10px] font-bold uppercase transition-all",
                      language === l ? "bg-white text-indigo-600 shadow-lg" : "text-white/60 hover:text-white"
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {customer && (
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-[2rem] flex items-center gap-4 transition-all hover:bg-white/20">
                  <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-xl">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest leading-none mb-1">Loyalty Points</p>
                    <p className="text-2xl font-bold text-white leading-none">{customer.loyaltyPoints || 0}</p>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

        {/* Community Poll Banner */}
        <AnimatePresence>
          {activePoll && (
            <motion.div 
               initial={{ opacity: 0, y: -20 }} 
               animate={{ opacity: 1, y: 0 }} 
               className="bg-slate-900 border border-slate-700 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group"
            >
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500"><Vote size={80} /></div>
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div>
                     <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2 italic">
                        <Zap size={12} className="fill-current" /> Live Community Choice
                     </p>
                     <h2 className="text-3xl font-black text-white leading-tight mb-2 uppercase">Which Special Next?</h2>
                     <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest italic">Vote now! Winner gets 20% OFF next hour.</p>
                  </div>

                  <div className="flex gap-4 w-full md:w-auto">
                     {activePoll.options?.map((opt, i) => (
                        <button 
                          key={opt._id || i}
                          onClick={() => castVote(opt.name)}
                          className="flex-1 md:w-48 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 p-6 rounded-[2rem] text-center transition-all group/btn"
                        >
                           <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">{i === 0 ? 'DISH A' : 'DISH B'}</p>
                           <h4 className="text-white font-bold text-sm mb-4 line-clamp-1">{opt.name}</h4>
                           <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-2">
                              <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: `${(opt.votes / Math.max(1, activePoll.totalVotes)) * 100}%` }} 
                                className="h-full bg-indigo-500"
                              />
                           </div>
                           <p className="text-[10px] font-black text-indigo-400">{Math.round((opt.votes / Math.max(1, activePoll.totalVotes)) * 100)}% VOTED</p>
                        </button>
                     ))}
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gamification Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <button 
             onClick={() => setShowMysteryModal(true)}
             className="h-24 bg-gradient-to-r from-amber-400 to-amber-300 rounded-[2rem] p-6 flex items-center gap-4 group hover:shadow-xl transition-all"
           >
              <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-lg group-hover:scale-110 transition-transform">
                 <Box size={24} />
              </div>
              <div className="text-left">
                 <p className="text-[10px] font-black text-amber-900/50 uppercase tracking-widest leading-none mb-1">Surprise Me</p>
                 <p className="text-lg font-black text-amber-950 leading-none">MYSTERY BOX</p>
              </div>
           </button>

           <Link 
             href={`/${params.hotelId}/marketplace`}
             className="h-24 bg-indigo-600 rounded-[2rem] p-6 flex items-center gap-4 group hover:shadow-xl transition-all"
           >
              <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center text-white backdrop-blur-md group-hover:scale-110 transition-transform">
                 <Ticket size={24} />
              </div>
              <div className="text-left">
                 <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest leading-none mb-1">Loyalty Store</p>
                 <p className="text-lg font-black text-white leading-none">MARKETPLACE</p>
              </div>
           </Link>

           <div className="col-span-1 lg:col-span-2 bg-emerald-50 border border-emerald-100 rounded-[2rem] p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <Leaf size={24} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-emerald-600/50 uppercase tracking-widest leading-none mb-1">Eco Balance</p>
                    <p className="text-lg font-black text-emerald-950 leading-none">GO GREEN GOAL</p>
                 </div>
              </div>
              <div className="flex flex-col items-end">
                 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">450 / 1000 Pts</p>
                 <div className="h-2 w-32 bg-emerald-200 rounded-full overflow-hidden">
                    <div className="h-full w-[45%] bg-emerald-500" />
                 </div>
              </div>
           </div>
        </div>

        {/* AI Recommendations Section */}
        {recommendations.length > 0 && !selectedCategory && !searchQuery && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                <BrainCircuit size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t('personalized')}</h2>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar -mx-4 px-4">
              {recommendations.map((item) => (
                <motion.div
                  key={`rec-${item._id}`}
                  whileHover={{ y: -5 }}
                  className="min-w-[280px] bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all"
                >
                  <div className="relative h-40 rounded-[2rem] overflow-hidden mb-6">
                    <img src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                      <span className="text-white font-bold text-sm">{formatCurrency(item.price)}</span>
                      <button onClick={() => addToCart(item)} className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-900 shadow-xl">
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-900 leading-none mb-2">{item.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.category}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={cn(
          "sticky top-20 lg:top-28 z-40 transition-all duration-500",
          isScrolled ? "scale-95 -translate-y-2" : "scale-100"
        )}>
          <div className={cn(
            "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-xl transition-all duration-500 overflow-hidden",
            isScrolled ? "p-3 lg:p-4 space-y-3" : "p-4 lg:p-6 space-y-6"
          )}>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder={t('search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "w-full pl-12 pr-14 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-900 dark:text-white",
                    isScrolled ? "py-2.5 text-sm" : "py-3.5"
                  )}
                />
                <button
                  onClick={handleVoiceOrder}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl flex items-center justify-center transition-all",
                    isListening ? "bg-red-500 text-white animate-pulse" : "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100"
                  )}
                >
                  <Mic size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-4">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={cn("px-8 py-4 rounded-2xl flex items-center gap-3 font-bold transition-all shadow-lg", showFavoritesOnly ? "bg-rose-500 text-white shadow-rose-200" : "bg-white text-slate-900 border border-slate-100 hover:border-rose-500")}>
                  <Heart className={cn(showFavoritesOnly && "fill-current")} size={20} />
                  FAVORITES
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  onClick={() => setShowMysteryModal(true)} 
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl flex items-center gap-3 font-bold shadow-2xl hover:bg-slate-800 transition-all border border-slate-700"
                >
                  <Box className="text-yellow-400" size={20} />
                  MYSTERY BOX
                </motion.button>
              </div>
            </div>

            {/* Live Poll Banner Item (Dynamic) */}
            <AnimatePresence>
              {hotel?.hourlyPoll?.active && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-12 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-[2.5rem] p-8 lg:p-12 text-white relative shadow-2xl overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><Vote size={120} /></div>
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                       <div>
                         <div className="flex items-center gap-3 mb-4">
                           <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/30">LIVE COMMUNITY VOTE</span>
                           <span className="text-[10px] font-bold text-indigo-200 animate-pulse">ENDING SOON</span>
                         </div>
                         <h3 className="text-3xl font-black tracking-tight leading-tight">CHOOSE THE NEXT HOURLY SPECIAL</h3>
                         <p className="text-indigo-100 mt-2 font-medium">The winning dish gets a 30% discount for everyone!</p>
                       </div>
                       
                       <div className="flex items-center gap-6">
                         <button onClick={() => castVote('A')} className="group flex flex-col items-center gap-3 bg-white/10 hover:bg-white/20 p-6 rounded-[2rem] border border-white/20 transition-all w-48 relative overflow-hidden">
                           <span className="text-xs font-black uppercase mb-1">OPTION A</span>
                           <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${(hotel.hourlyPoll.votesA / (hotel.hourlyPoll.votesA + hotel.hourlyPoll.votesB + 0.1)) * 100}%` }} />
                           </div>
                           <span className="text-2xl font-black">Dish X</span>
                         </button>
                         <div className="text-white/40 font-black italic">VS</div>
                         <button onClick={() => castVote('B')} className="group flex flex-col items-center gap-3 bg-white/10 hover:bg-white/20 p-6 rounded-[2rem] border border-white/20 transition-all w-48 relative overflow-hidden">
                           <span className="text-xs font-black uppercase mb-1">OPTION B</span>
                           <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${(hotel.hourlyPoll.votesB / (hotel.hourlyPoll.votesA + hotel.hourlyPoll.votesB + 0.1)) * 100}%` }} />
                           </div>
                           <span className="text-2xl font-black">Dish Y</span>
                         </button>
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className={cn(
              "flex flex-col transition-all duration-500",
              isScrolled ? "gap-0" : "gap-4"
            )}>
              {/* Dietary Filters */}
              <AnimatePresence>
                {!isScrolled && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex gap-2 overflow-x-auto pb-1 no-scrollbar overflow-hidden"
                  >
                    {dietaryOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => toggleDietary(opt.id)}
                        className={cn(
                          "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                          selectedDietary.includes(opt.id)
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                        )}
                      >
                        <span>{opt.icon}</span>
                        {opt.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Category Tabs */}
              <div className={cn(
                "flex gap-2 overflow-x-auto pb-2 no-scrollbar transition-all",
                isScrolled ? "pt-0 border-none" : "border-t border-slate-100 dark:border-slate-800 pt-4"
              )}>
                <button
                  onClick={() => setSelectedCategory('')}
                  className={cn(
                    "whitespace-nowrap font-bold uppercase tracking-widest transition-all",
                    isScrolled ? "px-6 py-2 text-[10px] rounded-lg" : "px-8 py-3 text-xs rounded-xl",
                    selectedCategory === ''
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg"
                      : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                  )}
                >
                  {language === 'hi' ? 'सभी व्यंजन' : 'All Dishes'}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "whitespace-nowrap font-bold uppercase tracking-widest transition-all",
                      isScrolled ? "px-6 py-2 text-[10px] rounded-lg" : "px-8 py-3 text-xs rounded-xl",
                      selectedCategory === cat
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                        : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-80 bg-white rounded-[2.5rem] border border-slate-200 animate-pulse" />)}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No dishes found</h3>
            <p className="text-slate-500">Try adjusting your filters or search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
            {filteredItems.map((item, index) => {
              const cartItem = cart.find(c => c.menuItemId === item._id);
              const isFav = favorites.includes(item._id);

              return (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden flex flex-col group hover:shadow-2xl hover:shadow-indigo-500/5 transition-all"
                >
                  <div className="relative h-60 overflow-hidden">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <button
                      onClick={(e) => toggleFavorite(e, item._id)}
                      className={cn(
                        "absolute top-5 right-5 p-3 rounded-[1.25rem] backdrop-blur-md border transition-all",
                        isFav ? "bg-rose-500 border-white/20 text-white" : "bg-white/40 border-white/40 text-slate-900/60 hover:text-rose-500 hover:bg-white"
                      )}
                    >
                      <Heart size={18} fill={isFav ? "currentColor" : "none"} />
                    </button>
                    <div className="absolute top-5 left-5 flex flex-col gap-2">
                      <div className="px-4 py-1.5 bg-white/60 backdrop-blur-md rounded-full text-[10px] font-bold text-slate-800 uppercase tracking-widest border border-white/60">
                        {item.category}
                      </div>
                      {item.pointsRequired > 0 && (
                        <div className="px-4 py-1.5 bg-indigo-600/90 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-indigo-400/20 flex items-center gap-1.5 shadow-lg">
                          <Sparkles size={10} /> {item.pointsRequired} Pts
                        </div>
                      )}
                      {item.pointsEarned > 0 && (
                        <div className="px-4 py-1.5 bg-emerald-500/90 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-emerald-400/20 flex items-center gap-1.5 shadow-lg">
                          <CheckCircle2 size={10} /> +{item.pointsEarned} Points
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <h3 className="text-2xl font-black text-slate-900 line-clamp-1 tracking-tight group-hover:text-indigo-600 transition-colors uppercase">{item.name}</h3>
                          {item.ecoScore && (
                            <div className="flex items-center gap-1.5 mt-2">
                               <div className="h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-emerald-500" style={{ width: `${item.ecoScore}%` }} />
                               </div>
                               <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                 <Leaf size={10} /> Sustainable Choice
                               </span>
                            </div>
                          )}
                        </div>
                        <p className="text-2xl font-black text-slate-900 bg-slate-50 px-4 py-2 rounded-2xl shadow-sm border border-slate-100">{formatCurrency(item.price)}</p>
                      </div>

                    {isItemInHappyHour(item) && (
                      <div className="mb-4 inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg border border-emerald-100">
                        {/* Happy Hour content */}
                      </div>
                    )}
                    <p className="text-slate-500 text-sm italic font-medium line-clamp-2 leading-relaxed mb-10">
                      {item.description || 'No description available for this delicious dish.'}
                    </p>

                    <div className="mt-auto">
                      {cartItem ? (
                        <div className="bg-slate-50 rounded-2xl p-1.5 flex items-center justify-between border border-slate-100">
                          <button
                            onClick={() => updateQuantity(item._id, cartItem.quantity - 1)}
                            className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors shadow-sm"
                          >
                            <Minus size={18} />
                          </button>
                          <span className="font-bold text-slate-900 text-lg">{cartItem.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item._id, cartItem.quantity + 1)}
                            className="w-11 h-11 bg-slate-900 rounded-xl flex items-center justify-center text-white hover:bg-slate-800 transition-colors shadow-lg"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <button
                            onClick={() => addToCart(item)}
                            className="flex-1 h-14 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl flex items-center justify-center gap-3 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-700 transition-all shadow-xl shadow-slate-900/10 active:scale-95 group"
                          >
                            <ShoppingCart size={18} className="transition-transform group-hover:scale-110" />
                            ADD TO CART
                          </button>
                          <motion.button 
                            whileTap={{ scale: 0.9 }} 
                            onClick={() => { setGiftingData({ ...giftingData, itemId: item._id }); setShowGiftingModal(true); }} 
                            className="h-14 w-14 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl flex items-center justify-center hover:bg-indigo-100 transition-all"
                          >
                            <Gift size={20} />
                          </motion.button>
                        </div>
                      )}
                      
                      {!cartItem && (
                        <div className="flex gap-2 mt-3">
                          {(() => {
                            const pointCost = item.pointsRequired || (item.price * 10);
                            const canAfford = (customer?.loyaltyPoints || 0) >= pointCost;
                            return (
                              <button
                                onClick={() => canAfford && addToCart(item, { isRedeemed: true })}
                                disabled={!canAfford}
                                className={cn(
                                  "flex-1 py-3.5 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                  canAfford ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-50 text-slate-300 border border-slate-100"
                                )}
                              >
                                <Sparkles size={14} />
                                {canAfford ? `Buy with ${pointCost} Pts` : `${pointCost} Pts Needed`}
                              </button>
                            );
                          })()}
                          <button onClick={() => setSelectedItemForMods(item)} className="p-3.5 bg-slate-50 text-slate-500 border border-slate-100 rounded-2xl"><SlidersHorizontal size={20} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Modals & Floating UI ... */}
        <AnimatePresence>
          {selectedItemForMods && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedItemForMods(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-[3rem] w-full max-w-lg shadow-2xl p-10 overflow-hidden">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-2xl font-bold text-slate-900">Custom Order</h2>
                  <button onClick={() => setSelectedItemForMods(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <img src={selectedItemForMods.image} className="h-20 w-20 rounded-2xl object-cover shadow-md" alt="" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg mb-1">{selectedItemForMods.name}</h3>
                      <p className="text-indigo-600 font-bold">{formatCurrency(selectedItemForMods.price)}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Special Instructions</label>
                    <textarea
                      value={itemModifications.specialInstructions}
                      onChange={(e) => setItemModifications({ ...itemModifications, specialInstructions: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 font-medium italic min-h-[140px] resize-none"
                      placeholder="e.g. Extra spicy, no onions, gluten-free..."
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button onClick={() => setSelectedItemForMods(null)} className="flex-1 py-4 font-bold text-slate-500 rounded-2xl hover:bg-slate-50 uppercase tracking-widest text-[11px]">Discard</button>
                    <button onClick={() => addToCart(selectedItemForMods, itemModifications)} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl uppercase tracking-widest text-[11px]">Confirm Add</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showTableModal && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !loading && setShowTableModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative bg-white rounded-[4rem] w-full max-w-2xl shadow-3xl p-10 lg:p-14 overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">SELECT YOUR TABLE</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Essential for Digital Service Sync</p>
                  </div>
                  <button onClick={() => setShowTableModal(false)} className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"><X size={28} /></button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar pr-2 mb-10">
                  {availableTables.length === 0 ? (
                    <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                      <TableIcon size={48} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">No available tables found at this time.</p>
                      <p className="text-slate-500 font-medium text-xs mt-2 italic px-8 text-center leading-relaxed">Please ask our staff for assistance or wait for someone to check out.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                      {availableTables.map((table) => (
                        <button
                          key={table._id}
                          onClick={() => handleTableSelect(table._id)}
                          className="group relative bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] p-8 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all flex flex-col items-center gap-4 active:scale-95"
                        >
                          <div className="h-16 w-16 bg-white rounded-3xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors shadow-sm group-hover:shadow-indigo-200/50">
                            <TableIcon size={32} />
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Table</p>
                            <p className="text-3xl font-black text-slate-900">#{table.tableNumber}</p>
                            <p className="text-[9px] font-bold text-slate-500 mt-1">{table.capacity} Guests Max</p>
                          </div>
                          
                          <div className="absolute top-4 right-4 h-3 w-3 rounded-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-all scale-0 group-hover:scale-100 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-8 border-t border-slate-100 flex items-center justify-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <span className="flex items-center gap-2 px-4 py-2 bg-emerald-100/50 border border-emerald-200 rounded-xl text-emerald-600">
                    <CheckCircle2 size={14} /> LIVE STOCK SYNC
                  </span>
                  <span>TLS 1.3 SECURE DATA</span>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Mystery Box Modal */}
        <AnimatePresence>
          {showMysteryModal && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMysteryModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative bg-white rounded-[4rem] w-full max-w-xl shadow-3xl p-14 overflow-hidden flex flex-col text-center">
                 <div className="h-24 w-24 bg-yellow-50 rounded-[2.5rem] flex items-center justify-center text-yellow-500 mx-auto mb-10 shadow-lg shadow-yellow-100 border-2 border-yellow-100">
                   <Box size={40} />
                 </div>
                 <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-4 uppercase">AI MYSTERY BOX</h2>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-12 italic">Set your budget, We'll handle the rest.</p>
                 
                 <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 mb-12">
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Max Budget (INR)</p>
                   <div className="flex items-center justify-center gap-8">
                     <button onClick={() => setMysteryBudget(prev => Math.max(100, prev - 100))} className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all shadow-sm"><Minus /></button>
                     <span className="text-5xl font-black text-slate-900 leading-none min-w-[120px]">₹{mysteryBudget}</span>
                     <button onClick={() => setMysteryBudget(prev => prev + 100)} className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-all shadow-sm"><Plus /></button>
                   </div>
                 </div>

                 <div className="space-y-4">
                   <button onClick={handleMysteryOrder} className="w-full h-16 bg-slate-900 text-white rounded-[1.75rem] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all">GENERATE SURPRISE ORDER</button>
                   <button onClick={() => setShowMysteryModal(false)} className="w-full py-4 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-rose-500 transition-colors">MAYBE NEXT TIME</button>
                 </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Gifting Modal */}
        <AnimatePresence>
          {showGiftingModal && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowGiftingModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative bg-white rounded-[4rem] w-full max-w-xl shadow-3xl p-14 overflow-hidden flex flex-col items-center text-center">
                 <div className="h-24 w-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-500 mb-10 shadow-lg shadow-indigo-100 border-2 border-indigo-100">
                   <Gift size={40} />
                 </div>
                 <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-4 uppercase">GIFT TO ANOTHER TABLE</h2>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-12 italic">Spread some joy to a fellow diner.</p>
                 
                 <div className="w-full space-y-8 mb-12">
                   <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100">
                     <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Target Table Number</p>
                     <input 
                       type="text" 
                       value={giftingData.toTable} 
                       onChange={(e) => setGiftingData({ ...giftingData, toTable: e.target.value })} 
                       placeholder="e.g. 05" 
                       className="w-full h-16 bg-white rounded-[1.75rem] border border-slate-200 px-8 text-2xl font-black text-center text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-200"
                     />
                   </div>

                   <p className="text-[11px] font-bold text-slate-500 italic px-8">The meal will be delivered directly to the other table, but the bill will be added to your account.</p>
                 </div>

                 <div className="w-full space-y-4">
                   <button 
                     disabled={!giftingData.toTable}
                     onClick={async () => {
                       try {
                         setLoading(true);
                         const resp = await customerAPI.sendGift({
                           fromCustomerId: customer.id,
                           fromTableId: customer.tableId,
                           toTableNumber: giftingData.toTable,
                           menuItemId: giftingData.itemId,
                           hotelId: params.hotelId
                         });
                         if (resp.data.success) {
                           toast.success("Gift Sent! 🎁", { icon: '✨' });
                           setShowGiftingModal(false);
                         }
                       } catch (e) {
                         toast.error("Table not found or busy.");
                       } finally {
                         setLoading(false);
                       }
                     }} 
                     className="w-full h-16 bg-indigo-600 text-white rounded-[1.75rem] font-black uppercase tracking-widest shadow-2xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                   >
                     CONFIRM GIFT
                   </button>
                   <button onClick={() => setShowGiftingModal(false)} className="w-full py-4 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-rose-500 transition-colors">CANCEL</button>
                 </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </CustomerLayout>
  );
}
