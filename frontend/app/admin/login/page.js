'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminAPI } from '@/lib/api';
import { adminAuth } from '@/lib/auth';
import { LogIn, KeyRound, Mail, ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLogin() {
  const router = useRouter();
  const [view, setView] = useState('login'); // 'login', 'forgot', 'reset'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: '',
    newPassword: '',
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (adminAuth.isAuthenticated()) {
      router.push('/admin/dashboard');
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await adminAPI.login({
        email: formData.email,
        password: formData.password
      });
      if (response.data.success) {
        adminAuth.setToken(response.data.token);
        adminAuth.setAdmin(response.data.hotel);
        router.push('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await adminAPI.forgotPassword({ email: formData.email });
      if (response.data.success) {
        setSuccess('Security code sent to your email.');
        setView('reset');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No account found with this email');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await adminAPI.resetPassword({
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword
      });
      if (response.data.success) {
        setSuccess('Password updated! You can now log in.');
        setView('login');
        setFormData({ ...formData, password: '', otp: '', newPassword: '' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code or password requirements not met');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 font-outfit overflow-hidden relative selection:bg-indigo-500/30">
      {/* Cinematic Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05),transparent_70%)]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-xl w-full relative z-10"
      >
        <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[4rem] border border-white/10 shadow-[0_32px_120px_-15px_rgba(0,0,0,0.5)] p-12 sm:p-20 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          
          <div className="text-center mb-16 relative">
            <motion.div 
               whileHover={{ rotate: 12, scale: 1.1 }}
               className="h-24 w-24 bg-gradient-to-tr from-slate-800 to-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl border border-white/5 relative z-10"
            >
              <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20" />
              {view === 'login' && <KeyRound className="text-indigo-400 relative z-10" size={44} />}
              {view === 'forgot' && <Mail className="text-indigo-400 relative z-10" size={44} />}
              {view === 'reset' && <ShieldCheck className="text-indigo-400 relative z-10" size={44} />}
            </motion.div>
            
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none mb-4">
              {view === 'login' ? 'Portal HQ' : view === 'forgot' ? 'Recovery' : 'Identity'}
            </h1>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] italic">
               {view === 'login' ? 'Administrative Access Only' : view === 'forgot' ? 'Security Protocol Initiated' : 'Verify Secure Credentials'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-6 py-4 rounded-2xl mb-10 text-[10px] font-black text-center uppercase tracking-widest flex items-center justify-center gap-3"
              >
                <div className="h-1.5 w-1.5 bg-rose-500 rounded-full animate-pulse" />
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-6 py-4 rounded-2xl mb-10 text-[10px] font-black text-center uppercase tracking-widest flex items-center justify-center gap-3"
              >
                <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={view === 'login' ? handleLogin : view === 'forgot' ? handleForgot : handleReset} className="space-y-8">
            <AnimatePresence mode="wait">
              {view === 'login' && (
                <motion.div
                  key="login-fields"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-[0.3em] flex items-center gap-2 italic">
                       Professional Mail
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full h-18 px-8 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black"
                      placeholder="root@brand.com"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Access Key</label>
                       <button 
                         type="button"
                         onClick={() => setView('forgot')}
                         className="text-[10px] font-black text-indigo-400 hover:text-white transition-colors uppercase tracking-widest italic"
                       >
                         Lost Keys?
                       </button>
                    </div>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full h-18 px-8 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black"
                      placeholder="••••••••"
                    />
                  </div>
                </motion.div>
              )}

              {view === 'forgot' && (
                <motion.div
                  key="forgot-fields"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                   <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-[0.3em] italic">Registered Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full h-18 px-8 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black"
                      placeholder="admin@brand.com"
                    />
                  </div>
                </motion.div>
              )}

              {view === 'reset' && (
                <motion.div
                  key="reset-fields"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  <div className="space-y-4 text-center">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Security Passcode (OTP)</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={formData.otp}
                      onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                      className="w-full py-8 bg-slate-950/50 border border-white/10 rounded-[2.5rem] text-white text-center text-5xl tracking-[0.5em] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black shadow-inner"
                      placeholder="000000"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-[0.3em] italic">New Master Key</label>
                    <input
                      type="password"
                      required
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className="w-full h-18 px-8 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black"
                      placeholder="Security Strength: Strong"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-20 bg-white text-slate-900 rounded-[2rem] font-black transition-all shadow-3xl shadow-indigo-500/10 disabled:opacity-50 active:scale-95 mt-10 uppercase tracking-[0.4em] text-[11px] flex items-center justify-center gap-4 group"
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={24} />
              ) : (
                <>
                  {view === 'login' ? 'INITIALIZE SYSTEM' : view === 'forgot' ? 'SEND PROTOCOL' : 'SYCHRONIZE KEYS'}
                  <LogIn className="group-hover:translate-x-1 transition-transform" size={24} />
                </>
              )}
            </button>

            {view !== 'login' && (
              <button
                type="button"
                onClick={() => setView('login')}
                className="w-full py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:text-white transition-colors mt-4 italic"
              >
                <ArrowLeft size={16} strokeWidth={3} /> RETURN TO BASE
              </button>
            )}
          </form>

          {view === 'login' && (
            <div className="mt-16 pt-10 border-t border-white/5 text-center">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-loose">
                 New Establishment Deployment?
                 <Link href="/admin/register" className="text-white hover:text-indigo-400 font-black ml-2 transition-colors">
                   REGISTER HQ
                 </Link>
               </p>
            </div>
          )}
        </div>
        
        <div className="mt-12 text-center">
           <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] opacity-40">System Secured by Antigravity OS</p>
        </div>
      </motion.div>
    </div>
  );
}
