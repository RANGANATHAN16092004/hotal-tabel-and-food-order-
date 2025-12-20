'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { customerAuth } from '@/lib/auth';

export default function CustomerLayout({ children }) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const customerData = customerAuth.getCustomer();
    if (!customerData) {
      router.push(`/${params.hotelId}/login`);
      return;
    }
    setCustomer(customerData);
  }, [router, params.hotelId]);

  const handleLogout = () => {
    customerAuth.removeCustomer();
    router.push(`/${params.hotelId}/login`);
  };

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const navItems = [
    { href: `/${params.hotelId}/menu`, label: 'Menu' },
    { href: `/${params.hotelId}/tables`, label: 'Tables' },
    { href: `/${params.hotelId}/order`, label: 'Cart' },
    { href: `/${params.hotelId}/profile`, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Restaurant Menu</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname === item.href
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-indigo-700 font-semibold mr-4">{customer.name}</span>
              <button
                onClick={handleLogout}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

