'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  UserCircle,
  Users,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  UtensilsCrossed,
  Layers,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

const FeatureCard = ({ icon: Icon, title, description, href, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.8, ease: "easeOut" }}
  >
    <Link href={href} className="group block h-full">
      <div className="relative h-full bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-8 rounded-[2.5rem] hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 group-hover:-translate-y-2 overflow-hidden">
        {/* Hover Gradient Effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

        <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white mb-8 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-500`}>
          <Icon size={32} />
        </div>

        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-between">
          {title}
          <ChevronRight size={20} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
        </h3>

        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">
          {description}
        </p>

        <div className="mt-8 flex items-center gap-2 group-hover:gap-3 transition-all duration-300">
          <span className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Launch Portal</span>
          <ArrowRight size={14} className="text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>
    </Link>
  </motion.div>
);

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] selection:bg-indigo-500/30 font-outfit overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-600/10 blur-[150px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at center, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <nav className="relative z-50 px-8 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-2xl">
            <UtensilsCrossed size={20} className="text-black" />
          </div>
          <span className="text-xl font-black text-white italic tracking-tighter">RESTO<span className="text-indigo-500">SYNC</span></span>
        </div>
        <div className="flex gap-4">
          <div className="hidden sm:flex items-center gap-6 mr-8">
            <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Architecture</Link>
            <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Vitals</Link>
          </div>
          <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">v2.4 LTS</span>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-20 pb-40 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-24">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="inline-flex items-center gap-3 px-6 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-8"
            >
              <Sparkles size={16} className="text-indigo-400" />
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest leading-none">Next-Generation POS Ecosystem</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 1 }}
              className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter mb-8"
            >
              CRAFTING THE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-rose-400">
                FUTURE OF DINING.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="text-slate-400 text-lg md:text-2xl font-medium max-w-3xl mx-auto italic leading-relaxed"
            >
              An orchestrator of operational excellence. Coordinate menus, track inventory, and serve with unprecedented precision.
            </motion.p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              delay={0.6}
              icon={LayoutDashboard}
              title="Hotel Admin"
              description="Full-spectrum control of your establishment. Manage menu assets, floor layout, and staff performance."
              href="/admin/login"
              color="from-blue-600 to-indigo-600"
            />
            <FeatureCard
              delay={0.8}
              icon={Users}
              title="Staff Portal"
              description="The operational core. Specialized views for Kitchen Experts, Billing Leads, and Floor Managers."
              href="/staff/login"
              color="from-indigo-600 to-rose-600"
            />
            <FeatureCard
              delay={1}
              icon={UserCircle}
              title="Customer Hub"
              description="Search and synchronize your dining history across all partner locations with phone-based authentication."
              href="/customer"
              color="from-emerald-600 to-teal-600"
            />
          </div>

          {/* Vitals Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 1 }}
            className="mt-32 p-8 bg-white/5 border border-white/10 rounded-[3rem] backdrop-blur-md flex flex-wrap justify-between items-center gap-12"
          >
            {[
              { label: 'Real-time Latency', value: '< 24ms', icon: Zap },
              { label: 'Platform Stability', value: '99.99%', icon: ShieldCheck },
              { label: 'Active Sessions', value: 'Live Feed', icon: Clock },
              { label: 'Core Fragments', value: 'Micro-services', icon: Layers }
            ].map((vital, i) => (
              <div key={vital.label} className="flex-1 min-w-[200px] flex items-center gap-4">
                <div className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400">
                  <vital.icon size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{vital.label}</p>
                  <p className="text-lg font-bold text-white tracking-tight">{vital.value}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:row justify-between items-center gap-8">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
            © 2025 RESTOSYNC ENTERPRISE • ALL RIGHTS RESERVED
          </div>
          <div className="flex gap-8">
            <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Status</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
