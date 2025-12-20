'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { customerAPI } from '@/lib/api';
import { customerAuth } from '@/lib/auth';

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const customer = customerAuth.getCustomer();
    if (!customer) {
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
    if (quantity <= 0) {
      const newCart = cart.filter((item) => item.menuItemId !== itemId);
      setCart(newCart);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`cart_${params.hotelId}`, JSON.stringify(newCart));
      }
      return;
    }
    const newCart = cart.map((item) =>
      item.menuItemId === itemId ? { ...item, quantity } : item
    );
    setCart(newCart);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`cart_${params.hotelId}`, JSON.stringify(newCart));
    }
  };

  const removeFromCart = (itemId) => {
    const newCart = cart.filter((item) => item.menuItemId !== itemId);
    setCart(newCart);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`cart_${params.hotelId}`, JSON.stringify(newCart));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0);
  };

  const handlePlaceOrder = async () => {
    if (!selectedTable) {
      setError('Please select a table first');
      return;
    }

    if (cart.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const customer = customerAuth.getCustomer();
      const orderData = {
        customerId: customer.id,
        tableId: selectedTable._id,
        items: cart.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      };

      const response = await customerAPI.createOrder(orderData);
      if (response.data.success) {
        // Clear cart and selected table
        setCart([]);
        setSelectedTable(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`cart_${params.hotelId}`);
          localStorage.removeItem(`selectedTable_${params.hotelId}`);
        }
        router.push(`/${params.hotelId}/profile`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <CustomerLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">Your Cart</h1>
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 mb-4">Your cart is empty</p>
            <Link
              href={`/${params.hotelId}/menu`}
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              Browse Menu
            </Link>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">Your Order</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.menuItemId} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-green-600 font-medium">${parseFloat(item.price).toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                        className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="font-semibold w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                        className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xl font-bold text-blue-600 w-24 text-right">
                      ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.menuItemId)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-indigo-700 mb-4">Order Summary</h2>

              {selectedTable ? (
                <div className="mb-4 p-3 bg-green-50 rounded">
                  <p className="text-sm text-green-600 font-medium">Table</p>
                  <p className="font-semibold text-green-800">Table {selectedTable.tableNumber}</p>
                </div>
              ) : (
                <div className="mb-4">
                  <Link
                    href={`/${params.hotelId}/tables`}
                    className="block text-center bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg hover:bg-yellow-200 transition"
                  >
                    Select Table
                  </Link>
                </div>
              )}

              <div className="space-y-2 mb-4">
                {cart.map((item) => (
                  <div key={item.menuItemId} className="flex justify-between text-sm">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between text-xl font-bold">
                  <span className="text-gray-700">Total</span>
                  <span className="text-green-600">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading || !selectedTable}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}

