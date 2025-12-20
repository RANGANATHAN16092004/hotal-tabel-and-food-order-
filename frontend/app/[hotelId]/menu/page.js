'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { customerAPI } from '@/lib/api';
import { customerAuth } from '@/lib/auth';

export default function MenuPage() {
  const params = useParams();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hotelId, setHotelId] = useState(null);

  useEffect(() => {
    const customer = customerAuth.getCustomer();
    if (!customer) {
      router.push(`/${params.hotelId}/login`);
      return;
    }
    setHotelId(customer.hotelId);
    fetchMenu(customer.hotelId);
    loadCart();
  }, [params.hotelId, router]);

  const fetchMenu = async (id) => {
    try {
      const response = await customerAPI.getMenu(id, selectedCategory || undefined);
      if (response.data.success) {
        setMenuItems(response.data.menuItems);
        if (response.data.categories) {
          setCategories(response.data.categories);
        }
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
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
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find((cartItem) => cartItem.menuItemId === item._id);
    let newCart;

    if (existingItem) {
      newCart = cart.map((cartItem) =>
        cartItem.menuItemId === item._id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    } else {
      newCart = [...cart, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1 }];
    }

    saveCart(newCart);
  };

  const removeFromCart = (itemId) => {
    const newCart = cart.filter((item) => item.menuItemId !== itemId);
    saveCart(newCart);
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    const newCart = cart.map((item) =>
      item.menuItemId === itemId ? { ...item, quantity } : item
    );
    saveCart(newCart);
  };

  const getCartCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const filteredItems = selectedCategory
    ? menuItems.filter((item) => item.category === selectedCategory)
    : menuItems;

  if (loading) {
    return (
      <CustomerLayout>
        <div className="text-center py-12">Loading...</div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Menu</h1>
          <Link
            href={`/${params.hotelId}/order`}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition relative"
          >
            Cart ({getCartCount()})
          </Link>
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              selectedCategory === ''
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">No menu items available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const cartItem = cart.find((c) => c.menuItemId === item._id);
              return (
                <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.name}</h3>
                    <p className="text-sm text-blue-600 font-medium mb-2">{item.category}</p>
                    {item.description && (
                      <p className="text-gray-700 text-sm mb-3">{item.description}</p>
                    )}
                    <div className="flex justify-between items-center">
                      <p className="text-2xl font-bold text-green-600">
                        ${parseFloat(item.price).toFixed(2)}
                      </p>
                      {cartItem ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item._id, cartItem.quantity - 1)}
                            className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full hover:bg-gray-300"
                          >
                            -
                          </button>
                          <span className="font-semibold">{cartItem.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item._id, cartItem.quantity + 1)}
                            className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full hover:bg-gray-300"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                        >
                          Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}

