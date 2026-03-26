'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminAPI } from '@/lib/api';
import { adminAuth } from '@/lib/auth';
import {
  Hotel,
  Mail,
  Phone,
  MapPin,
  QrCode,
  Edit3,
  Download,
  ShieldCheck,
  Camera,
  X,
  Copy,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const [hotel, setHotel] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    logo: '',
    coverImage: '',
    secondaryEmails: [],
  });

  useEffect(() => {
    fetchProfile();
    fetchQR();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await adminAPI.getProfile();
      if (response.data.success) {
        setHotel(response.data.hotel);
        adminAuth.setAdmin(response.data.hotel);
        setFormData({
          name: response.data.hotel.name,
          email: response.data.hotel.email,
          phone: response.data.hotel.phone,
          address: response.data.hotel.address || '',
          logo: response.data.hotel.logo || '',
          coverImage: response.data.hotel.coverImage || '',
          secondaryEmails: response.data.hotel.secondaryEmails || [],
        });
      }
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append('hotelLogo', file);

    setUploadingImage(true);
    const loadingToast = toast.loading('Uploading image...');

    try {
      const response = await adminAPI.uploadHotelImages(uploadFormData);
      if (response.data.success) {
        const newLogo = response.data.images.logo;
        setHotel(prev => ({ ...prev, logo: newLogo }));
        adminAuth.setAdmin({ ...hotel, logo: newLogo });
        toast.success('Profile image updated!', { id: loadingToast });
      }
    } catch (error) {
      toast.error('Failed to upload image', { id: loadingToast });
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchQR = async () => {
    try {
      const response = await adminAPI.getQR();
      if (response.data.success) {
        setQrData(response.data);
      }
    } catch (error) {
      console.error('QR fetch Error');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Saving changes...');
    try {
      const response = await adminAPI.updateProfile(formData);
      if (response.data.success) {
        setHotel(response.data.hotel);
        toast.success('Profile updated!', { id: loadingToast });
        setShowEditModal(false);
        fetchProfile();
      }
    } catch (err) {
      toast.error('Update failed', { id: loadingToast });
    }
  };

  const addSecondaryEmail = () => {
    setFormData(prev => ({
      ...prev,
      secondaryEmails: [...(prev.secondaryEmails || []), '']
    }));
  };

  const removeSecondaryEmail = (idx) => {
    setFormData(prev => ({
      ...prev,
      secondaryEmails: (prev.secondaryEmails || []).filter((_, i) => i !== idx)
    }));
  };

  const downloadQR = () => {
    if (!qrData?.qrImage) return;
    const link = document.createElement('a');
    link.href = qrData.qrImage;
    link.download = `Menu-QR-${hotel?.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !hotel) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-12 w-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Loading Profile...</p>
        </div>
      </AdminLayout>
    );
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_URL}${path}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-10 max-w-5xl mx-auto font-outfit">
        {/* Header / Hero */}
        <div className="relative bg-slate-900 border border-slate-200 rounded-[3rem] p-10 sm:p-14 shadow-sm overflow-hidden">
          {hotel?.coverImage ? (
            <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${hotel.coverImage})` }} />
          ) : (
            <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-50/10 -skew-x-12 translate-x-12" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-transparent" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-10">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative group">
                <div className="h-32 w-32 bg-slate-50 border-4 border-indigo-600 rounded-[2.5rem] flex items-center justify-center text-indigo-600 shadow-xl overflow-hidden relative">
                  {hotel?.logo ? (
                    <img
                      src={getImageUrl(hotel.logo)}
                      alt={hotel.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Hotel size={50} />
                  )}

                  {uploadingImage && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                      <div className="h-8 w-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => document.getElementById('profile-upload').click()}
                  className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 rounded-[2.5rem] transition-all flex items-center justify-center text-white"
                >
                  <Camera size={24} />
                </button>
                <input
                  id="profile-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-4xl font-bold text-white leading-tight">{hotel?.name}</h1>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 text-indigo-400">
                  <ShieldCheck size={18} />
                  <span className="text-xs font-bold uppercase tracking-widest">Verified Restaurant</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowEditModal(true)}
              className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition shadow-xl flex items-center gap-2"
            >
              <Edit3 size={16} /> Edit Profile
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Identity Details */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-8 border-l-4 border-indigo-600 pl-4 uppercase tracking-widest text-[14px]">Identity Specs</h2>

            <div className="space-y-6">
              <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-slate-400">
                  <Mail size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official Email</p>
                  <p className="text-base font-bold text-slate-700">{hotel?.email}</p>
                </div>
              </div>

              {hotel?.secondaryEmails?.length > 0 && (
                <div className="flex flex-col gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 italic">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-14">Additional Vectors</p>
                  <div className="space-y-3">
                    {hotel.secondaryEmails.map((email, idx) => (
                      <div key={idx} className="flex items-center gap-6">
                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-300">
                          <Mail size={18} />
                        </div>
                        <p className="text-sm font-bold text-slate-600">{email}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-slate-400">
                  <Phone size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Number</p>
                  <p className="text-base font-bold text-slate-700 uppercase tracking-widest">{hotel?.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-slate-400">
                  <QrCode size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hotel ID (Slug)</p>
                  <p className="text-base font-bold text-indigo-600 font-mono select-all cursor-pointer" onClick={() => {
                    navigator.clipboard.writeText(hotel?.qrCode || '');
                    toast.success('Slug copied to clipboard');
                  }}>{hotel?.qrCode || 'Not Generated'}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-slate-400">
                  <MapPin size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</p>
                  <p className="text-base font-bold text-slate-700">{hotel?.address || 'No address set.'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Master QR */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm flex flex-col">
            <h2 className="text-xl font-bold text-slate-900 mb-8 border-l-4 border-rose-500 pl-4 uppercase tracking-widest text-[14px]">Master Access QR</h2>

            <p className="text-sm text-slate-500 font-medium mb-10 italic leading-relaxed">
              Your master QR assets grants access to the digital menu. Customers can scan this to view your full menu.
            </p>

            <div className="flex-1 flex flex-col items-center justify-center space-y-10">
              <div className="p-8 bg-white rounded-[2.5rem] shadow-2xl border-2 border-slate-100 relative group transition-transform hover:scale-[1.02]">
                {qrData?.qrImage ? (
                  <img src={qrData.qrImage} alt="QR" className="w-52 h-52 sm:w-60 sm:h-60" />
                ) : (
                  <div className="w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center">
                    <div className="h-10 w-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                  </div>
                )}
              </div>

              <div className="w-full flex gap-4">
                <button
                  onClick={downloadQR}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all"
                >
                  <Download size={18} /> Download
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(qrData?.qrUrl || '');
                    toast.success('Link copied');
                  }}
                  className="px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all"
                >
                  <Copy size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showEditModal && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowEditModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="relative bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl p-8 max-h-[90vh] flex flex-col"
              >
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-indigo-600 rounded-full" />
                    <h2 className="text-xl font-bold text-slate-900 uppercase tracking-[0.2em] text-[12px]">Update Identity</h2>
                  </div>
                  <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleUpdate} className="space-y-5 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Establishment name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contact vector</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Primary email channel</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                    />
                  </div>

                  <div className="space-y-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Additional email vectors</label>
                       <button
                         type="button"
                         onClick={addSecondaryEmail}
                         className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest hover:underline"
                       >
                         + Add vector
                       </button>
                    </div>
                    <div className="space-y-2">
                      {(formData.secondaryEmails || []).map((email, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                              const newEmails = [...(formData.secondaryEmails || [])];
                              newEmails[idx] = e.target.value;
                              setFormData({ ...formData, secondaryEmails: newEmails });
                            }}
                            className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                            placeholder="secondary@example.com"
                          />
                          <button
                            type="button"
                            onClick={() => removeSecondaryEmail(idx)}
                            className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition-all shrink-0"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Geographic HQ</label>
                    <textarea
                      rows={2}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium resize-none text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Profile Image URL</label>
                      <input
                        type="url"
                        value={formData.logo}
                        onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                        placeholder="logo.jpg"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-[11px] font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cover Image URL</label>
                      <input
                        type="url"
                        value={formData.coverImage}
                        onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                        placeholder="cover.jpg"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-[11px] font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 shrink-0">
                    <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-3 font-bold text-slate-400 hover:bg-slate-50 rounded-xl transition-all uppercase tracking-widest text-[10px]">Back</button>
                    <button type="submit" className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]">
                      Synchronize <ArrowRight size={14} />
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
