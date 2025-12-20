'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { customerAPI } from '@/lib/api';
import { customerAuth } from '@/lib/auth';

export default function CustomerProfile() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const customerData = customerAuth.getCustomer();
    if (!customerData) {
      router.push(`/${params.hotelId}/login`);
      return;
    }
    setCustomer(customerData);
    fetchOrders(customerData.id);
  }, [params.hotelId, router]);

  const fetchOrders = async (customerId) => {
    try {
      const response = await customerAPI.getOrders(customerId);
      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">My Profile</h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-purple-700 mb-4">Customer Information</h2>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-blue-600 font-medium">Name</p>
              <p className="text-lg font-semibold text-gray-900">{customer?.name}</p>
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">Phone</p>
              <p className="text-lg font-semibold text-gray-900">{customer?.phone}</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-4">Order History</h2>

          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 mb-4">No orders yet</p>
              <Link
                href={`/${params.hotelId}/menu`}
                className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
              >
                Browse Menu
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Order ID</p>
                      <p className="font-semibold text-blue-700">#{order._id.slice(-6)}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Table</p>
                      <p className="font-semibold text-green-700">
                        {order.tableId?.tableNumber || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-indigo-600 font-medium">Date</p>
                      <p className="font-semibold text-indigo-700">{formatDate(order.orderDate)}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-purple-600 font-medium mb-2">Items</p>
                    <div className="space-y-2">
                      {order.items?.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-2 bg-gray-50 rounded"
                        >
                          <span className="text-gray-800">
                            {item.name} × <span className="text-blue-600 font-semibold">{item.quantity}</span>
                          </span>
                          <span className="font-semibold text-green-600">
                            ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-700">Total</span>
                      <span className="text-xl font-bold text-green-600">
                        ${parseFloat(order.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}

