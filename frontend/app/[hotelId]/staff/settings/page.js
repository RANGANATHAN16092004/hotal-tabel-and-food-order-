'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { staffAPI } from '@/lib/api';
import { staffAuth } from '@/lib/staffAuth';
import {
    User,
    Mail,
    Phone,
    Shield,
    Save,
    Camera,
    CheckCircle2,
    Globe
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function StaffSettingsPage() {
    const { hotelId } = useParams();
    const [staff, setStaff] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [language, setLanguage] = useState('english');

    useEffect(() => {
        const data = staffAuth.getStaff();
        if (data) setStaff(data);

        const savedLang = localStorage.getItem('staff_language');
        if (savedLang) setLanguage(savedLang);

        setLoading(false);
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const loadingToast = toast.loading('Updating settings...');
        try {
            const currentLang = localStorage.getItem('staff_language');
            localStorage.setItem('staff_language', language);
            // Logic for updating staff profile if API exists
            // For now, optimistic update
            await new Promise(r => setTimeout(r, 1000));
            toast.success('Settings synchronized!', { id: loadingToast });

            if (currentLang !== language) {
                setTimeout(() => window.location.reload(), 1000);
            }
        } catch (error) {
            toast.error('Update failed', { id: loadingToast });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading || !staff) {
        return <div className="h-96 flex items-center justify-center font-bold text-slate-300">Synchronizing...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10 font-outfit pb-20">
            <div className="flex items-center gap-5">
                <div className="h-16 w-16 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-slate-100">
                    <User size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Personal Profile</h1>
                    <p className="text-slate-500 font-medium italic">Manage your digital identity and credentials.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white border border-slate-200 p-10 rounded-[3rem] shadow-sm">
                        <form onSubmit={handleSave} className="space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            defaultValue={staff.name}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="tel"
                                            defaultValue={staff.phone || '+91 9876543210'}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address (Locked)</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        type="email"
                                        value={staff.email}
                                        disabled
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-300 font-bold cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-slate-50">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Globe size={14} /> Terminal Language
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setLanguage('english')}
                                        className={`p-4 rounded-2xl border-2 transition-all text-center font-bold text-sm ${language === 'english'
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                                            : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                                            }`}
                                    >
                                        English
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLanguage('tamil')}
                                        className={`p-4 rounded-2xl border-2 transition-all text-center font-bold text-sm ${language === 'tamil'
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                                            : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                                            }`}
                                    >
                                        Tamil (தமிழ்)
                                    </button>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-50">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <Save size={18} /> {isSaving ? 'Processing...' : 'Apply Changes'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2.5rem] flex items-center gap-6">
                        <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-50">
                            <Key size={28} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-lg font-bold text-slate-900 leading-tight">Credential Management</h4>
                            <p className="text-slate-500 text-sm font-medium italic">Initiate a password reset via your registered email.</p>
                        </div>
                        <button className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-amber-100 hover:bg-amber-100 transition-all">
                            Reset Now
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white border border-slate-200 p-8 rounded-[3rem] shadow-sm text-center">
                        <div className="relative inline-block mb-6">
                            <div className="h-32 w-32 rounded-[2.5rem] bg-indigo-50 border-4 border-white shadow-xl flex items-center justify-center text-indigo-600 text-4xl font-black rotate-3">
                                {staff.name?.charAt(0)}
                            </div>
                            <button className="absolute -bottom-2 -right-2 h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg border-4 border-white">
                                <Camera size={18} />
                            </button>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{staff.name}</h3>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <Shield size={14} className="text-indigo-600" />
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">{staff.role} Rank</span>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl shadow-slate-200">
                        <div className="flex items-center gap-3 mb-6 opacity-40">
                            <CheckCircle2 size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Active Permissions</span>
                        </div>
                        <div className="space-y-4">
                            {['Order Management', 'Table Oversight', 'Live Dashboard', 'Shift Sync'].map((perm, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-sm font-medium text-slate-400">{perm}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
