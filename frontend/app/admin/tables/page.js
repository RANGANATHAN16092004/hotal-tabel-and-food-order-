'use client';

import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminAPI } from '@/lib/api';
import {
  Plus,
  Users,
  QrCode,
  Edit2,
  Trash2,
  X,
  LayoutGrid,
  Save,
  Grid3X3,
  Move,
  Info,
  Download,
  Printer,
  ScanLine
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { adminAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

export default function TablesPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(null);
  const [editingTable, setEditingTable] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'architect'
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: '',
    status: 'available',
  });

  const architectRef = useRef(null);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getTables();
      if (response.data.success) {
        setTables(response.data.tables);
      }
    } catch (error) {
      toast.error('Failed to load floor plan');
    } finally {
      setLoading(false);
    }
  };

  const handleTableDrag = (id, x, y) => {
    setTables(prev => prev.map(t =>
      t._id === id ? { ...t, x, y } : t
    ));
  };

  const saveFloorPlan = async () => {
    setIsSavingLayout(true);
    const loadingToast = toast.loading('Saving floor plan...');
    try {
      await Promise.all(tables.map(table =>
        adminAPI.updateTableLayout(table._id, { x: table.x || 0, y: table.y || 0 })
      ));
      toast.success('Floor plan saved', { id: loadingToast });
    } catch (error) {
      toast.error('Save failed', { id: loadingToast });
    } finally {
      setIsSavingLayout(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading(editingTable ? 'Updating table...' : 'Adding table...');
    try {
      if (editingTable) {
        await adminAPI.updateTable(editingTable._id, formData);
        toast.success('Table updated', { id: loadingToast });
      } else {
        await adminAPI.createTable(formData);
        toast.success('Table added', { id: loadingToast });
      }
      setShowModal(false);
      setEditingTable(null);
      setFormData({ tableNumber: '', capacity: '', status: 'available' });
      fetchTables();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed', { id: loadingToast });
    }
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData({
      tableNumber: table.tableNumber,
      capacity: table.capacity.toString(),
      status: table.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this table?')) return;
    const loadingToast = toast.loading('Removing table...');
    try {
      await adminAPI.deleteTable(id);
      toast.success('Table removed', { id: loadingToast });
      fetchTables();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed', { id: loadingToast });
    }
  };

  const getQRUrl = (table) => {
    const admin = adminAuth.getAdmin();
    const hotelId = admin?.id;
    if (!hotelId) return '';
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/${hotelId}/menu?table=${table.tableNumber}&tableId=${table._id}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(url)}&color=4f46e5&bgcolor=ffffff&margin=1`;
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'available': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'occupied': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'reserved': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 font-outfit">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tables</h1>
            <p className="text-slate-500 mt-1 font-medium italic">Manage your restaurant floor layout and QR codes.</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <div className="flex bg-white p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all",
                  viewMode === 'grid' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <Grid3X3 size={16} /> Grid
              </button>
              <button
                onClick={() => setViewMode('architect')}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all",
                  viewMode === 'architect' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <Move size={16} /> Layout
              </button>
            </div>

            {viewMode === 'architect' && (
              <button
                onClick={saveFloorPlan}
                disabled={isSavingLayout}
                className="px-8 py-3.5 bg-emerald-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg shadow-emerald-100 flex items-center gap-2"
              >
                <Save size={18} /> SAVE LAYOUT
              </button>
            )}

            <button
              onClick={() => {
                setEditingTable(null);
                setFormData({ tableNumber: '', capacity: '', status: 'available' });
                setShowModal(true);
              }}
              className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition shadow-xl flex items-center gap-2"
            >
              <Plus size={20} /> ADD TABLE
            </button>
          </div>
        </div>

        {/* View Content */}
        <AnimatePresence mode="wait">
          {viewMode === 'architect' ? (
            <motion.div
              key="architect"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative w-full aspect-[16/9] bg-slate-100 border-2 border-slate-200 rounded-[3rem] overflow-hidden"
              ref={architectRef}
            >
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:40px_40px]" />

              <div className="absolute top-6 left-6 flex items-center gap-3 bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600">
                <Info size={16} className="text-indigo-600" />
                Drag tables to position them on the floor map.
              </div>

              <div className="absolute inset-0 p-12">
                {tables.map((table) => (
                  <DraggableTable
                    key={table._id}
                    table={table}
                    onDrag={handleTableDrag}
                    containerRef={architectRef}
                    getStatusStyles={getStatusStyles}
                  />
                ))}
              </div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">RESATURANT ENTRANCE</div>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {tables.map((table, index) => (
                <motion.div
                  key={table._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm group hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Table</span>
                      <h3 className="text-2xl font-bold text-slate-900">#{table.tableNumber}</h3>
                    </div>
                    <span className={cn(
                      "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                      getStatusStyles(table.status)
                    )}>
                      {table.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
                    <Users size={18} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">{table.capacity} Guests Max</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-auto">
                    <button
                      onClick={() => setShowQRModal(table)}
                      className="py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                    >
                      <QrCode size={16} className="mx-auto mb-1" /> QR Code
                    </button>
                    <button
                      onClick={() => handleEdit(table)}
                      className="py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors"
                    >
                      <Edit2 size={16} className="mx-auto mb-1" /> Edit
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(table._id)}
                    className="mt-4 w-full py-3 bg-white text-slate-400 hover:text-rose-500 transition-colors text-[9px] font-black uppercase tracking-widest border-t border-slate-50"
                  >
                    Remove Table
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-10"
              >
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-2xl font-bold text-slate-900">{editingTable ? 'Edit Table' : 'Add Table'}</h2>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Table Designation</label>
                    <input
                      type="text"
                      required
                      value={formData.tableNumber}
                      onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold"
                      placeholder="e.g. 10, A-1, VIP-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Capacity</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold"
                      >
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="reserved">Reserved</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors uppercase tracking-widest text-xs">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs">
                      {editingTable ? 'Update' : 'Add Table'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {showQRModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowQRModal(null)}
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-white rounded-[3.5rem] w-full max-w-md shadow-2xl p-12 text-center"
              >
                <div className="flex justify-between items-center mb-10">
                  <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white rotate-12">
                    <ScanLine size={28} />
                  </div>
                  <button onClick={() => setShowQRModal(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={28} />
                  </button>
                </div>

                <h2 className="text-3xl font-bold text-slate-900 mb-2">Table #{showQRModal.tableNumber}</h2>
                <p className="text-slate-500 font-medium mb-10 italic">Digital Menu Access Asset</p>

                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm mb-10">
                  <img src={getQRUrl(showQRModal)} alt="QR Code" className="w-full aspect-square" />
                </div>

                <div className="flex gap-4">
                  <button onClick={() => window.print()} className="flex-1 flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl text-slate-600 hover:bg-slate-100 font-bold text-[10px] uppercase tracking-widest">
                    <Printer size={18} /> Print
                  </button>
                  <a href={getQRUrl(showQRModal)} download={`Table-${showQRModal.tableNumber}.png`} className="flex-1 flex flex-col items-center gap-2 p-4 bg-indigo-600 rounded-2xl text-white hover:bg-indigo-700 font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100">
                    <Download size={18} /> Export
                  </a>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}

function DraggableTable({ table, onDrag, containerRef, getStatusStyles }) {
  const [isDragging, setIsDragging] = useState(false);

  const initialX = table.x || 50;
  const initialY = table.y || 50;

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      onDrag(table._id, Math.max(5, Math.min(95, x)), Math.max(5, Math.min(95, y)));
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, containerRef, onDrag, table._id]);

  return (
    <div
      className={cn(
        "absolute cursor-move select-none transition-transform z-10",
        isDragging && "scale-110 z-50 transition-none"
      )}
      style={{ left: `${initialX}%`, top: `${initialY}%` }}
      onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
    >
      <div className={cn(
        "w-24 h-24 rounded-[2rem] border-4 bg-white flex flex-col items-center justify-center p-2 shadow-lg",
        getStatusStyles(table.status).split(' ')[2] // Border color
      )}>
        <span className="text-[10px] font-black text-slate-400">#{table.tableNumber}</span>
        <Users size={16} className="text-slate-600 my-1" />
        <span className="text-xs font-bold text-slate-900">{table.capacity}</span>
      </div>
    </div>
  );
}
