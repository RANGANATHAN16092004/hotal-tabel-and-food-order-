'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Shield,
    Mail,
    Phone,
    RefreshCcw,
    Search,
    ChevronRight,
    Star,
    BadgeCheck,
    Briefcase
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function StaffTeamPage() {
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getStaff();
            if (response.data.success) {
                setTeam(response.data.staff || []);
            }
        } catch (error) {
            console.error('Failed to fetch team');
        } finally {
            setLoading(false);
        }
    };

    const filtered = team.filter(member =>
        member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 font-outfit pb-20 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white border border-slate-200 p-8 rounded-[3.5rem] shadow-sm flex flex-col sm:row justify-between items-center gap-6">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-100">
                        <Users size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-tight">Personnel Directory</h1>
                        <p className="text-slate-500 text-sm font-medium italic">Monitor authorized staff members and shift roles.</p>
                    </div>
                </div>
                <button
                    onClick={fetchTeam}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                >
                    <RefreshCcw size={20} className={loading ? 'animate-spin text-slate-900' : ''} />
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search personnel by name or operational role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none font-medium text-lg leading-none"
                />
            </div>

            {/* Team Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode='popLayout'>
                    {filtered.map((member, index) => (
                        <motion.div
                            key={member._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm hover:shadow-xl hover:shadow-slate-500/5 transition-all group overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 p-8">
                                <span className={cn(
                                    "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                                    member.role === 'manager' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                                        member.role === 'chef' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                            "bg-blue-50 text-blue-600 border-blue-100"
                                )}>
                                    {member.role}
                                </span>
                            </div>

                            <div className="flex flex-col items-center text-center">
                                <div className="h-24 w-24 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl font-black text-slate-300 group-hover:scale-110 group-hover:bg-slate-900 group-hover:text-white transition-all cursor-default shadow-sm mb-6">
                                    {member.name?.charAt(0) || 'U'}
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 tracking-tight uppercase group-hover:text-slate-900 transition-colors">{member.name}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 mb-8 italic flex items-center gap-2">
                                    <BadgeCheck size={14} className="text-emerald-500" /> Authorized Personnel
                                </p>

                                <div className="w-full space-y-4">
                                    <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 group/item hover:bg-white transition-colors">
                                        <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover/item:text-slate-900 transition-colors">
                                            <Mail size={18} />
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Digital Terminal</p>
                                            <p className="text-sm font-bold text-slate-700 truncate">{member.email || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 bg-slate-100/50 rounded-2xl border border-slate-200/50 group/item hover:bg-white transition-colors">
                                        <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover/item:text-slate-900 transition-colors">
                                            <Briefcase size={18} />
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Shift Identifier</p>
                                            <p className="text-sm font-bold text-slate-700 truncate italic">Section {member.section || 'A-1'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button className="w-full mt-10 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-slate-900 hover:text-slate-900 transition-all flex items-center justify-center gap-3">
                                Communication Log <ChevronRight size={14} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filtered.length === 0 && !loading && (
                <div className="py-32 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-[4rem] text-center shadow-sm">
                    <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8">
                        <Users size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tighter">Directory Empty</h2>
                    <p className="text-slate-400 text-sm mt-2 uppercase tracking-widest font-bold">No active personnel signatures detected.</p>
                </div>
            )}
        </div>
    );
}
