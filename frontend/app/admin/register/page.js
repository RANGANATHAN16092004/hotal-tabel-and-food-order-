'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminAPI } from '@/lib/api';
import { adminAuth } from '@/lib/auth';
import { Camera, Hotel, Upload } from 'lucide-react';

export default function AdminRegister() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    logo: null
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (adminAuth.isAuthenticated()) {
      router.push('/admin/dashboard');
    }
  }, [router]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setFormData({ ...formData, logo: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('password', formData.password);
      data.append('phone', formData.phone);
      data.append('address', formData.address);
      if (formData.logo) {
        data.append('hotelLogo', formData.logo);
      }

      const response = await adminAPI.register(data);
      if (response.data.success) {
        adminAuth.setToken(response.data.token);
        router.push('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 font-outfit overflow-hidden relative selection:bg-emerald-500/30 py-20">
      {/* Cinematic Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05),transparent_70%)]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl w-full relative z-10"
      >
        <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[4rem] border border-white/10 shadow-[0_32px_120px_-15px_rgba(0,0,0,0.5)] p-12 sm:p-20 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
          
          <div className="text-center mb-16 relative">
            <div className="relative inline-block mb-10">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="h-32 w-32 bg-slate-950 rounded-[2.5rem] flex items-center justify-center mx-auto border-2 border-dashed border-white/10 hover:border-emerald-500/50 transition-all cursor-pointer overflow-hidden group relative shadow-2xl"
                onClick={() => document.getElementById('logo-upload').click()}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Logo preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center">
                    <Camera className="text-emerald-500 mx-auto mb-2 opacity-50" size={32} />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Upload Brand</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-emerald-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                  <Upload className="text-white" size={28} strokeWidth={3} />
                </div>
              </motion.div>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none mb-4">
              Onboard HQ
            </h1>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] italic leading-relaxed">
               Deploy your establishment cluster today
            </p>
          </div>

          {error && (
            <motion.div 
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-6 py-4 rounded-2xl mb-12 text-[10px] font-black text-center uppercase tracking-widest flex items-center justify-center gap-3 italic"
            >
              <div className="h-1.5 w-1.5 bg-rose-500 rounded-full animate-pulse" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-[0.3em] italic">Establishment Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-18 px-8 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-black"
                  placeholder="The Grand Palace"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-[0.3em] italic">Primary Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-18 px-8 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-black"
                  placeholder="owner@brand.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-[0.3em] italic">Communication Link</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full h-18 px-8 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-black"
                  placeholder="+1 (000) 000-0000"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-[0.3em] italic">Geographic Location</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full h-18 px-8 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-black"
                  placeholder="City, Province"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-[0.3em] italic">Secure Master Key</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full h-18 px-8 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-black"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-[0.3em] italic">Verify Key</label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full h-18 px-8 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-black"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-24 bg-white text-slate-900 rounded-[2.5rem] font-black transition-all shadow-3xl shadow-emerald-500/20 disabled:opacity-50 active:scale-95 mt-10 uppercase tracking-[0.4em] text-[12px] group"
            >
              {loading ? 'SYNCHRONIZING DATA...' : 'INITIALIZE REGISTRATION'}
            </button>
          </form>

          <div className="mt-16 pt-10 border-t border-white/5 text-center">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-loose italic">
                Existing Cluster Identity?
                <Link href="/admin/login" className="text-white hover:text-emerald-400 font-black ml-2 transition-colors not-italic">
                   AUTHENTICATE HERE
                </Link>
             </p>
          </div>
        </div>

        <div className="mt-12 text-center">
           <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] opacity-40">Security Protocol Alpha // Antigravity Core</p>
        </div>
      </motion.div>
    </div>
  );
}
