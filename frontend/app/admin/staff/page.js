'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminAPI } from '@/lib/api';
import {
    Users,
    UserPlus,
    Mail,
    Phone,
    Shield,
    Edit3,
    Trash2,
    X,
    UserCheck,
    Search,
    BadgeCheck,
    Lock,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function StaffPage() {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'chef',
        isActive: true
    });

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getStaff();
            if (response.data.success) {
                setStaffList(response.data.staff);
            }
        } catch (error) {
            toast.error('Failed to load team data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading(editingStaff ? 'Updating...' : 'Adding...');
        try {
            if (editingStaff) {
                await adminAPI.updateStaff(editingStaff._id, formData);
                toast.success('Personnel updated', { id: loadingToast });
            } else {
                await adminAPI.createStaff(formData);
                toast.success('Member onboarded', { id: loadingToast });
            }
            setShowModal(false);
            setEditingStaff(null);
            setFormData({ name: '', email: '', phone: '', password: '', role: 'chef', isActive: true });
            fetchStaff();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed', { id: loadingToast });
        }
    };

    const handleEdit = (staff) => {
        setEditingStaff(staff);
        setFormData({
            name: staff.name,
            email: staff.email,
            phone: staff.phone,
            password: '',
            role: staff.role,
            isActive: staff.isActive
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Permanently remove this access?')) return;
        const loadingToast = toast.loading('Removing...');
        try {
            await adminAPI.deleteStaff(id);
            toast.success('Record deleted', { id: loadingToast });
            fetchStaff();
        } catch (err) {
            toast.error('Action failed', { id: loadingToast });
        }
    };

    const getRoleStyles = (role) => {
        switch (role) {
            case 'admin': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'manager': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'chef': return 'bg-amber-50 text-amber-600 border-amber-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const filteredStaff = staffList.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && staffList.length === 0) {
        return (
            <AdminLayout>
                <div className="space-y-8 max-w-7xl mx-auto">
                    <div className="h-40 bg-white rounded-[3rem] border border-slate-200 animate-pulse" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white rounded-[2.5rem] border border-slate-200 animate-pulse" />)}
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8 max-w-7xl mx-auto font-outfit px-4 sm:px-0">
                {/* Header */}
                <div className="bg-white border border-slate-200 p-8 rounded-[3rem] shadow-sm flex flex-col sm:row justify-between items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <Users size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Team Hub</h1>
                            <p className="text-slate-500 text-sm font-medium italic">Oversee roles and digital identities.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setEditingStaff(null);
                            setFormData({ name: '', email: '', phone: '', password: '', role: 'chef', isActive: true });
                            setShowModal(true);
                        }}
                        className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-slate-200 flex items-center gap-3 active:scale-95 transition-all"
                    >
                        <UserPlus size={18} /> Add Personnel
                    </button>
                </div>

                {/* Filters */}
                <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search team by name, role or email identity..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-3xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none text-lg font-medium"
                    />
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
                    <AnimatePresence>
                        {filteredStaff.map((staff, index) => (
                            <motion.div
                                key={staff._id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-16 -mt-16" />

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="h-20 w-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center text-slate-900 font-bold text-3xl shadow-sm">
                                            {staff.name.charAt(0)}
                                        </div>
                                        <div className={cn(
                                            "h-3 w-3 rounded-full border-2 border-white shadow-lg",
                                            staff.isActive ? "bg-emerald-500" : "bg-slate-300"
                                        )} />
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight mb-2 leading-none">{staff.name}</h3>
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border mb-6",
                                        getRoleStyles(staff.role)
                                    )}>
                                        <BadgeCheck size={10} />
                                        {
                                            {
                                                'waiter': 'Service Crew',
                                                'chef': 'Kitchen Expert',
                                                'cashier': 'Billing Lead',
                                                'manager': 'Operations',
                                                'admin': 'System Admin'
                                            }[staff.role] || staff.role
                                        }
                                    </span>

                                    <div className="space-y-4 pt-6 border-t border-slate-50">
                                        <div className="flex items-center gap-4 text-slate-500 group/link cursor-pointer">
                                            <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center group-hover/link:bg-indigo-50 transition-colors">
                                                <Mail size={14} />
                                            </div>
                                            <span className="text-xs font-bold truncate group-hover/link:text-slate-900 transition-colors">{staff.email}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-slate-500">
                                            <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center">
                                                <Phone size={14} />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-widest">{staff.phone}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-8 pt-6 border-t border-slate-50">
                                        <button
                                            onClick={() => handleEdit(staff)}
                                            className="flex-1 px-4 py-3.5 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Edit3 size={14} /> Modify
                                        </button>
                                        <button
                                            onClick={() => handleDelete(staff._id)}
                                            className="px-4 py-3.5 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all border border-rose-100 flex items-center justify-center"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Modal */}
                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="relative bg-white rounded-[3.5rem] w-full max-w-xl shadow-2xl overflow-hidden font-outfit">
                                <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Personnel Registry</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure access & profile details</p>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="p-3 hover:bg-white rounded-full transition-colors shadow-sm bg-slate-50"><X size={20} /></button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Legal Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-sm"
                                                placeholder="Identity name"
                                            />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">System Label</label>
                                            <select
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-sm"
                                            >
                                                <option value="chef">Kitchen Expert</option>
                                                <option value="cashier">Billing Lead</option>
                                                <option value="admin">System Admin</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-sm"
                                            disabled={!!editingStaff}
                                            placeholder="work-email@hotel.com"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Phone Contact</label>
                                            <input
                                                type="tel"
                                                required
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-sm"
                                                placeholder="+91..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-1.5"><Lock size={10} /> Security Key</label>
                                            <input
                                                type="password"
                                                required={!editingStaff}
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-sm"
                                                placeholder={editingStaff ? "Restricted" : "Init password"}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                        <input
                                            type="checkbox"
                                            id="staff_active"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="w-6 h-6 rounded-lg text-slate-900 border-slate-200 focus:ring-slate-900"
                                        />
                                        <label htmlFor="staff_active" className="cursor-pointer">
                                            <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">Grant Full Platform Enrollment</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Identity will have active system access</p>
                                        </label>
                                    </div>

                                    <div className="flex gap-4 pt-6">
                                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 font-bold text-slate-400 uppercase tracking-widest text-[11px] hover:bg-slate-50 rounded-2xl transition-colors">Discard</button>
                                        <button type="submit" className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95 transition-all">
                                            {editingStaff ? 'Update record' : 'Onboard Now'} <ArrowRight size={18} />
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
