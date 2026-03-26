'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminAPI } from '@/lib/api';

export default function ProfilePage() {
  const [hotel, setHotel] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchQR();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await adminAPI.getProfile();
      if (response.data.success) {
        setHotel(response.data.hotel);
        setFormData({
          name: response.data.hotel.name,
          phone: response.data.hotel.phone,
          address: response.data.hotel.address || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQR = async () => {
    try {
      const response = await adminAPI.getQR();
      if (response.data.success) {
        setQrData(response.data);
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await adminAPI.updateProfile(formData);
      if (response.data.success) {
        setHotel(response.data.hotel);
        setShowEditModal(false);
        fetchProfile();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  const downloadQR = () => {
    if (!qrData?.qrImage) return;

    const link = document.createElement('a');
    link.href = qrData.qrImage;
    link.download = `qr-code-${hotel?.qrCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <button
            onClick={() => setShowEditModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
          >
            Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Hotel Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Hotel Name</p>
                <p className="text-lg font-semibold text-gray-900">{hotel?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-semibold text-gray-900">{hotel?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-lg font-semibold text-gray-900">{hotel?.phone}</p>
              </div>
              {hotel?.address && (
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="text-lg font-semibold text-gray-900">{hotel.address}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">QR Code</h2>
            <p className="text-sm text-gray-600 mb-4">
              Share this QR code with customers to access your restaurant menu and place orders.
            </p>
            {qrData?.qrImage ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={qrData.qrImage}
                    alt="QR Code"
                    className="w-64 h-64 border-4 border-gray-200 rounded-lg"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">QR Code ID: {qrData.qrCode}</p>
                  <p className="text-xs text-gray-500 mb-4 break-all">{qrData.qrUrl}</p>
                  <button
                    onClick={downloadQR}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                  >
                    Download QR Code
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">Loading QR code...</div>
            )}
          </div>
        </div>

        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Profile</h2>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hotel Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setError('');
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}













