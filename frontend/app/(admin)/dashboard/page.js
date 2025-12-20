'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminAPI } from '@/lib/api';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    tables: 0,
    menuItems: 0,
    pendingOrders: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [tablesRes, menuRes, ordersRes] = await Promise.all([
          adminAPI.getTables(),
          adminAPI.getMenu(),
          adminAPI.getOrders(),
        ]);

        const pendingOrders = ordersRes.data.orders.filter(
          (order) => order.status === 'pending' || order.status === 'preparing'
        ).length;

        setStats({
          tables: tablesRes.data.count || 0,
          menuItems: menuRes.data.count || 0,
          pendingOrders,
          totalOrders: ordersRes.data.count || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">Loading...</div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: 'Total Tables',
      value: stats.tables,
      link: '/admin/tables',
      color: 'bg-blue-500',
    },
    {
      title: 'Menu Items',
      value: stats.menuItems,
      link: '/admin/menu',
      color: 'bg-green-500',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      link: '/admin/orders?status=pending',
      color: 'bg-yellow-500',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      link: '/admin/orders',
      color: 'bg-purple-500',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => (
            <Link
              key={index}
              href={card.link}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`${card.color} rounded-full p-4`}>
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/tables"
              className="bg-primary-50 border-2 border-primary-200 rounded-lg p-4 hover:bg-primary-100 transition text-center"
            >
              <h3 className="font-semibold text-primary-900">Manage Tables</h3>
              <p className="text-sm text-primary-700 mt-1">Add or edit restaurant tables</p>
            </Link>
            <Link
              href="/admin/menu"
              className="bg-green-50 border-2 border-green-200 rounded-lg p-4 hover:bg-green-100 transition text-center"
            >
              <h3 className="font-semibold text-green-900">Manage Menu</h3>
              <p className="text-sm text-green-700 mt-1">Add or edit menu items</p>
            </Link>
            <Link
              href="/admin/orders"
              className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 hover:bg-yellow-100 transition text-center"
            >
              <h3 className="font-semibold text-yellow-900">View Orders</h3>
              <p className="text-sm text-yellow-700 mt-1">Manage customer orders</p>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


