'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Save, Globe, ConciergeBell } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminSettings() {
    const [language, setLanguage] = useState('english');
    const [services, setServices] = useState({
        dineIn: true,
        takeaway: true,
        roomService: false,
        delivery: false,
    });

    useEffect(() => {
        const savedLang = localStorage.getItem('admin_language');
        const savedServices = localStorage.getItem('admin_services');
        if (savedLang) setLanguage(savedLang);
        if (savedServices) setServices(JSON.parse(savedServices));
    }, []);

    const handleSave = () => {
        const currentLang = localStorage.getItem('admin_language');
        localStorage.setItem('admin_language', language);
        localStorage.setItem('admin_services', JSON.stringify(services));
        toast.success('Settings saved successfully!');

        if (currentLang !== language) {
            setTimeout(() => window.location.reload(), 1000);
        }
    };

    const handleServiceToggle = (key) => {
        setServices(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-8 font-outfit pb-10">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Globe size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Language Preference</h2>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Select your preferred system language.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <button
                            onClick={() => setLanguage('english')}
                            className={`p-4 rounded-2xl border-2 transition-all text-left font-bold ${language === 'english'
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                                }`}
                        >
                            English
                        </button>
                        <button
                            onClick={() => setLanguage('tamil')}
                            className={`p-4 rounded-2xl border-2 transition-all text-left font-bold ${language === 'tamil'
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                                }`}
                        >
                            Tamil (தமிழ்)
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <ConciergeBell size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Active Services</h2>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Enable or disable services offered by your hotel.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { id: 'dineIn', label: 'Dine-In' },
                            { id: 'takeaway', label: 'Takeaway' },
                            { id: 'roomService', label: 'Room Service' },
                            { id: 'delivery', label: 'Home Delivery' }
                        ].map((srv) => (
                            <div
                                key={srv.id}
                                onClick={() => handleServiceToggle(srv.id)}
                                className={`p-6 rounded-2xl border-2 transition-all flex justify-between items-center cursor-pointer ${services[srv.id]
                                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10'
                                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                    }`}
                            >
                                <div className="font-bold text-slate-900 dark:text-white text-lg">{srv.label}</div>
                                <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${services[srv.id] ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                                    }`}>
                                    <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm uppercase tracking-widest transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2"
                    >
                        <Save size={18} />
                        Save Settings
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}
