'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { customerAPI } from '@/lib/api';
import { customerAuth } from '@/lib/auth';

export default function TablesPage() {
  const params = useParams();
  const router = useRouter();
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const customer = customerAuth.getCustomer();
    if (!customer) {
      router.push(`/${params.hotelId}/login`);
      return;
    }
    fetchTables(customer.hotelId);
    loadSelectedTable();
  }, [params.hotelId, router]);

  const fetchTables = async (hotelId) => {
    try {
      const response = await customerAPI.getTables(hotelId);
      if (response.data.success) {
        setTables(response.data.tables);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
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

  const handleSelectTable = (table) => {
    setSelectedTable(table);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`selectedTable_${params.hotelId}`, JSON.stringify(table));
    }
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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Select a Table</h1>

        {selectedTable && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-semibold">
              Selected: <span className="text-blue-700">Table {selectedTable.tableNumber}</span> (Capacity: <span className="text-purple-700">{selectedTable.capacity} guests</span>)
            </p>
          </div>
        )}

        {tables.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">No tables available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table) => (
              <div
                key={table._id}
                onClick={() => handleSelectTable(table)}
                className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition ${
                  selectedTable?._id === table._id
                    ? 'ring-4 ring-primary-500 border-2 border-primary-500'
                    : 'hover:shadow-lg'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">🪑</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Table {table.tableNumber}
                  </h3>
                  <p className="text-gray-600">Capacity: {table.capacity} guests</p>
                  {selectedTable?._id === table._id && (
                    <p className="text-primary-600 font-semibold mt-2">Selected</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTable && (
          <div className="text-center">
            <Link
              href={`/${params.hotelId}/order`}
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              Continue to Order
            </Link>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}

