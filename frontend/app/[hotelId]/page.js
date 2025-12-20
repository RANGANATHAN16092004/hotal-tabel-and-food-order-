'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { customerAPI } from '@/lib/api';

export default function HotelLanding() {
  const params = useParams();
  const router = useRouter();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const qrCode = params.hotelId;
    if (qrCode) {
      fetchHotel(qrCode);
    }
  }, [params.hotelId]);

  const fetchHotel = async (qrCode) => {
    try {
      const response = await customerAPI.getHotelByQR(qrCode);
      if (response.data.success) {
        setHotel(response.data.hotel);
      }
    } catch (err) {
      setError('Hotel not found. Please check the QR code.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (hotel) {
      router.push(`/${params.hotelId}/login`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Hotel Not Found</h1>
          <p className="text-red-600 mb-6 font-medium">{error || 'Invalid QR code'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🍽️</div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">{hotel.name}</h1>
        {hotel.address && (
          <p className="text-blue-600 mb-2 font-medium">{hotel.address}</p>
        )}
        {hotel.phone && (
          <p className="text-green-600 mb-6 font-medium">{hotel.phone}</p>
        )}
        <p className="text-indigo-700 mb-6 font-medium">
          Welcome! Please continue to view our menu and place your order.
        </p>
        <button
          onClick={handleContinue}
          className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition text-lg"
        >
          Continue to Menu
        </button>
      </div>
    </div>
  );
}

