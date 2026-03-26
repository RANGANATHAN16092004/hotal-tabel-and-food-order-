'use client';

import { useState, useEffect } from 'react';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { Save, Globe, ConciergeBell } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CustomerSettings() {
    const [language, setLanguage] = useState('english');
    const [preferredService, setPreferredService] = useState('dineIn');

    useEffect(() => {
        const savedLang = localStorage.getItem('customer_language');
        const savedService = localStorage.getItem('customer_service');
        if (savedLang) setLanguage(savedLang);
        if (savedService) setPreferredService(savedService);
    }, []);

    const handleSave = () => {
        const currentLang = localStorage.getItem('customer_language');
        localStorage.setItem('customer_language', language);
        localStorage.setItem('customer_service', preferredService);
        toast.success('Preferences saved successfully!');

        if (currentLang !== language) {
            setTimeout(() => window.location.reload(), 1000);
        }
    };

    return (
        <CustomerLayout>
            <div className="max-w-2xl mx-auto space-y-8 font-outfit pb-10">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight text-center sm:text-left">
                    App Settings
                </h1>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 sm:p-10 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Globe size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Language</h2>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Select your language</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={() => setLanguage('english')}
                            className={`p-5 rounded-2xl border-2 transition-all flex items-center justify-between font-bold ${language === 'english'
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 scale-[1.02]'
                                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01]'
                                }`}
                        >
                            English
                            {language === 'english' && <div className="h-3 w-3 bg-indigo-600 rounded-full shadow-sm" />}
                        </button>
                        <button
                            onClick={() => setLanguage('tamil')}
                            className={`p-5 rounded-2xl border-2 transition-all flex items-center justify-between font-bold ${language === 'tamil'
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 scale-[1.02]'
                                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01]'
                                }`}
                        >
                            Tamil (தமிழ்)
                            {language === 'tamil' && <div className="h-3 w-3 bg-indigo-600 rounded-full shadow-sm" />}
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 sm:p-10 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <ConciergeBell size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Default Service Mode</h2>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">How do you usually order?</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { id: 'dineIn', label: 'Dine-In' },
                            { id: 'takeaway', label: 'Takeaway' },
                            { id: 'roomService', label: 'Room Service' },
                        ].map((srv) => (
                            <button
                                key={srv.id}
                                onClick={() => setPreferredService(srv.id)}
                                className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between font-bold text-left ${preferredService === srv.id
                                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 scale-[1.02]'
                                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01]'
                                    }`}
                            >
                                {srv.label}
                                {preferredService === srv.id && <div className="h-2 w-10 mt-3 bg-emerald-500 rounded-full shadow-sm" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-center sm:justify-end pt-6">
                    <button
                        onClick={handleSave}
                        className="w-full sm:w-auto px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-bold text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/30 flex justify-center items-center gap-2"
                    >
                        <Save size={18} />
                        Save Preferences
                    </button>
                </div>
            </div>
        </CustomerLayout>
    );
}
