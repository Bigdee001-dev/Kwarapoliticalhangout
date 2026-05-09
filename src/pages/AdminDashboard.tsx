
import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Activity, Users, DollarSign, Layout, 
  Settings, LogOut, Save, AlertTriangle, CheckCircle, 
  Search, Trash2, Globe, Server, Power, Plus, X, Menu, Upload, Loader2, Bell,
  ExternalLink, TrendingUp, BarChart3, Eye, MessageSquare, Clock, Zap, ArrowUpRight, History,
  Image as ImageIcon, RefreshCcw, MousePointer2, ImagePlus, Lock, Key, ShieldCheck, Database, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { AdminService, AdConfig, User, GlobalAlert } from '../services/adminService';
import { ImageUploadService } from '../services/imageUploadService';
import { NewsService } from '../services/newsService';
import { Article } from '../types';
import Logo from '../components/Logo';

const PerformanceBar = ({ label, value, total, color = "bg-blue-500" }: { label: string, value: number, total: number, color?: string }) => {
  const percentage = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-900">{value.toLocaleString()}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${color} transition-all duration-1000`}
        />
      </div>
    </div>
  );
};

const LockScreen = ({ onUnlock }: { onUnlock: () => void }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') onUnlock();
    else { setError(true); setPin(''); }
  };

  return (
    <div className="min-h-screen bg-[#070708] flex items-center justify-center p-4 selection:bg-[#8B0000] selection:text-white overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(139,0,0,0.1),transparent_70%)] animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-[800px] h-[800px] border border-[#8B0000]/20 rounded-full flex items-center justify-center"
          >
            <div className="w-[600px] h-[600px] border border-[#8B0000]/10 rounded-full"></div>
          </motion.div>
        </div>
      </div>

      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-12">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-32 h-32 bg-white rounded-[3rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_80px_rgba(139,0,0,0.2)] border border-white/10 group overflow-hidden"
            >
               <Logo iconOnly className="scale-150 group-hover:scale-175 transition-transform" />
            </motion.div>
            <h2 className="text-5xl font-black text-white mb-2 tracking-tighter italic font-serif">PHOENIX <span className="text-[#8B0000]">CMD</span></h2>
            <p className="text-[#8B0000] text-[10px] font-black uppercase tracking-[0.5em] mt-4">Authorization Layer v4.2</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[4rem] border border-white/10 shadow-2xl">
          <form onSubmit={handleUnlock} className="space-y-10">
             <div className="relative">
               <div className="flex justify-center gap-4 mb-4">
                 {[...Array(4)].map((_, i) => (
                   <motion.div 
                     key={i}
                     animate={{ 
                      scale: pin.length > i ? 1.2 : 1,
                      backgroundColor: pin.length > i ? '#8B0000' : 'rgba(255,255,255,0.1)'
                     }}
                     className="w-3 h-3 rounded-full"
                   />
                 ))}
               </div>
               <input 
                type="password" value={pin} onChange={(e) => { setPin(e.target.value); setError(false); }}
                className={`w-full bg-transparent border-0 text-white text-center text-5xl tracking-[1.2em] focus:outline-none font-mono transition-all duration-300 placeholder-white/5`}
                placeholder="0000" maxLength={4} autoFocus inputMode="numeric"
               />
               <div className="h-[2px] w-full bg-white/10 mt-4 overflow-hidden">
                 <motion.div 
                   animate={{ width: `${(pin.length / 4) * 100}%` }}
                   className="h-full bg-[#8B0000]"
                 />
               </div>
               {error && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="absolute -bottom-10 left-0 right-0 flex items-center justify-center gap-2 text-red-500 text-[10px] font-black tracking-widest"
                 >
                   <ShieldAlert size={14} /> SECURITY BREACH: INVALID CREDENTIALS
                 </motion.div>
               )}
             </div>
             
             <button className="w-full bg-[#8B0000] text-white font-black py-6 rounded-3xl hover:bg-red-700 transition-all shadow-[0_10px_40px_rgba(139,0,0,0.4)] active:scale-[0.98] uppercase tracking-widest text-sm flex items-center justify-center gap-3">
               DECRYPT ACCESS <Zap size={18} />
             </button>
          </form>
        </div>

        <div className="mt-12 flex items-center justify-center gap-8 text-gray-600">
           <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest"><Lock size={12} /> Encrypted</div>
           <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest"><ShieldCheck size={12} /> Verified</div>
           <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest"><Database size={12} /> Local Persistence</div>
        </div>
      </motion.div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const [locked, setLocked] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [adConfig, setAdConfig] = useState<AdConfig | null>(null);
  const [globalAlert, setGlobalAlert] = useState<GlobalAlert | null>(null);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Writer' });
  const [toast, setToast] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<string | null>(null);

  // Hidden file inputs for live preview clicks
  const homeBannerInputRef = useRef<HTMLInputElement>(null);
  const sidebarAdInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      const [u, ads, alert, news] = await Promise.all([
        AdminService.getUsers(),
        AdminService.getAdConfig(),
        AdminService.getGlobalAlert(),
        NewsService.getLatestNews()
      ]);
      setUsers(u || []);
      setAdConfig(ads);
      setGlobalAlert(alert);
      setRecentArticles(news || []);
    } catch (e: any) {
      console.warn("Sync Interrupted. Command Console operating on local failover.");
      showToast("Network Unavailable. Local storage active.");
      if (!adConfig) setAdConfig(await AdminService.getAdConfig());
    }
  };

  useEffect(() => {
    if (!locked) {
      const timer = setTimeout(() => {
        loadData();
      }, 0);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'homeBanner' | 'sidebarAd') => {
    const file = e.target.files?.[0];
    if (!file || !adConfig) return;
    setIsUploading(target);
    try {
      const url = await ImageUploadService.uploadImage(file, '/kph-ads');
      const updatedConfig = { ...adConfig, [target]: { ...adConfig[target], imageUrl: url } };
      setAdConfig(updatedConfig);
      await AdminService.saveAdConfig(updatedConfig);
      showToast('Global asset deployed to edge network.');
    } catch (e) {
      console.error('Upload failed:', e);
      showToast('Media deployment failure.');
    } finally {
      setIsUploading(null);
    }
  };

  const handleSaveAds = async () => {
    if (adConfig) {
      await AdminService.saveAdConfig(adConfig);
      showToast('Global Ad Network synchronized.');
    }
  };

  const handleResetStats = async () => {
    if (confirm("Reset all click and impression data for this campaign?")) {
      await AdminService.resetAdStats();
      loadData();
      showToast("Metrics purged.");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Revoke system access for this member?')) {
        await AdminService.deleteUser(id);
        loadData();
        showToast('Member credentials purged.');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.name && newUser.email) {
        await AdminService.addUser(newUser as any);
        setShowAddUserModal(false);
        setNewUser({ name: '', email: '', role: 'Writer' });
        loadData();
        showToast('New system identity established.');
    }
  };

  const handleFeatureArticle = async (id: string) => {
    await AdminService.setFeaturedArticle(id);
    showToast('Homepage hero projection updated.');
    loadData();
  };

  const handleSaveAlert = async () => {
    await AdminService.setGlobalAlert(globalAlert);
    showToast('Emergency broadcast updated.');
  };

  const calculateCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return "0.00";
    return ((clicks / impressions) * 100).toFixed(2);
  };

  if (locked) return <LockScreen onUnlock={() => setLocked(false)} />;
  
  return (
    <div className="min-h-screen bg-[#fcfcfd] flex font-sans selection:bg-[#8B0000] selection:text-white">
      <AnimatePresence>
      {toast && (
        <motion.div 
          initial={{ y: 100, opacity: 0, x: "-50%" }}
          animate={{ y: 0, opacity: 1, x: "-50%" }}
          exit={{ y: 100, opacity: 0, x: "-50%" }}
          className="fixed bottom-10 left-1/2 z-[100] bg-gray-950 text-white px-10 py-5 rounded-[2rem] shadow-2xl flex items-center gap-5 border border-white/10 backdrop-blur-3xl"
        >
          <div className="w-10 h-10 bg-[#8B0000] rounded-full flex items-center justify-center shrink-0 shadow-lg">
             <CheckCircle size={22} className="text-white" /> 
          </div>
          <span className="text-sm font-black uppercase tracking-[0.2em]">{toast}</span>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Executive Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-gray-950 text-white flex flex-col transition-transform duration-500 shadow-[20px_0_40px_rgba(0,0,0,0.2)] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-32 flex items-center px-10 border-b border-white/5 relative group">
           <Logo variant="gold" className="scale-90 group-hover:scale-95 transition-transform duration-700" />
           <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#8B0000] to-transparent opacity-50"></div>
        </div>
        
        <nav className="flex-1 py-12 px-6 space-y-3">
           {[
             { id: 'dashboard', label: 'Newsroom Overview', icon: Globe },
             { id: 'content', label: 'Review Queue', icon: Activity },
             { id: 'users', label: 'Editorial Team', icon: Users },
             { id: 'ads', label: 'Campaign Engine', icon: DollarSign },
             { id: 'settings', label: 'Portal Config', icon: Settings },
           ].map(item => (
             <button 
               key={item.id}
               onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} 
               className={`w-full flex items-center px-6 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all relative group overflow-hidden ${activeTab === item.id ? 'text-[#8B0000]' : 'text-gray-500 hover:text-white'}`}
             >
                {activeTab === item.id && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-white shadow-2xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon size={18} className={`mr-4 relative z-10 transition-colors ${activeTab === item.id ? 'text-[#8B0000]' : 'text-gray-600 group-hover:text-white'}`} /> 
                <span className="relative z-10">{item.label}</span>
             </button>
           ))}
        </nav>

        <div className="p-10 border-t border-white/5 space-y-6">
           <div className="flex items-center gap-4 px-4">
              <div className="w-10 h-10 rounded-full bg-[#8B0000] flex items-center justify-center font-black text-xs shadow-lg">AD</div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">Admin Root</p>
                <div className="flex items-center gap-1.5 mt-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                   <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">System Online</p>
                </div>
              </div>
           </div>
           <button onClick={() => navigate('/login')} className="w-full flex items-center justify-center gap-3 py-4 text-gray-500 hover:text-red-500 font-black text-[10px] uppercase tracking-widest transition-all bg-white/5 rounded-[1.5rem] hover:bg-red-500/10 border border-transparent hover:border-red-500/20"><LogOut size={14} /> Kill Session</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/80 backdrop-blur-3xl border-b border-gray-100 h-28 px-12 flex items-center justify-between sticky top-0 z-40">
           <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="lg:hidden w-12 h-12 flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white transition-all"
              >
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter leading-none text-gray-950 italic font-serif flex items-center gap-3">
                  {activeTab.replace(/([A-Z])/g, ' $1').trim()}
                </h1>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                   <Lock size={12} className="text-[#8B0000]" /> High-Privilege Access Node / Phoenix v4.2
                </p>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end mr-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-mono">SYS_CLOCK</span>
                <span className="text-xs font-black text-gray-950 font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
             </div>
             <motion.button 
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               className="w-14 h-14 bg-gray-50 rounded-[1.25rem] flex items-center justify-center border border-gray-100 text-gray-400 hover:text-gray-950 hover:bg-white transition-all relative"
             >
                <Bell size={20} />
                <span className="absolute top-4 right-4 w-2 h-2 bg-[#8B0000] rounded-full border-2 border-white"></span>
             </motion.button>
             <button className="w-14 h-14 bg-gray-950 text-white rounded-[1.25rem] flex items-center justify-center shadow-xl hover:shadow-[#8B0000]/20 transition-all">
                <Power size={20} />
             </button>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#fafafb] p-12">
           <AnimatePresence mode="wait">
           {!adConfig ? (
             <motion.div 
               key="loading"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="h-full flex flex-col items-center justify-center space-y-6"
             >
                <Loader2 className="w-16 h-16 animate-spin text-[#8B0000] opacity-20" />
                <p className="font-black text-gray-400 uppercase tracking-[0.5em] text-[10px] animate-pulse">Initializing Newsroom Engine...</p>
             </motion.div>
           ) : (
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
               className="max-w-[1600px] mx-auto space-y-12"
             >
               {activeTab === 'dashboard' && (
                 <div className="space-y-12 pb-20">
                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                  {[
                    { label: 'Portal Readership', value: '42.8k', trend: '+12%', icon: Eye, color: 'text-[#002645]', bg: 'bg-[#d1e4ff]' },
                    { label: 'Authorized Authors', value: users.length, trend: 'Stable', icon: Users, color: 'text-[#795900]', bg: 'bg-[#ffdfa0]' },
                    { label: 'Campaign Reach', value: (adConfig.homeBanner.stats.impressions + adConfig.sidebarAd.stats.impressions).toLocaleString(), trend: 'Growing', icon: BarChart3, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Intelligence Eng', value: (adConfig.homeBanner.stats.clicks + adConfig.sidebarAd.stats.clicks).toLocaleString(), trend: 'High', icon: MousePointer2, color: 'text-[#ba1a1a]', bg: 'bg-red-50' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 group hover:shadow-2xl hover:shadow-gray-200/40 transition-all duration-700">
                      <div className={`w-16 h-16 ${stat.bg} ${stat.color} rounded-x2l flex items-center justify-center mb-8 transition-transform group-hover:scale-110 shadow-sm`}>
                        <stat.icon size={26} />
                      </div>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                      <div className="flex items-baseline gap-4">
                        <p className="text-5xl font-black text-[#002645] tracking-tighter">{stat.value}</p>
                        <span className={`text-[10px] font-black px-2 py-1 rounded-md ${stat.trend.includes('+') ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>{stat.trend}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                  <div className="xl:col-span-2 bg-white rounded-[3.5rem] shadow-sm border border-gray-100 p-12">
                    <div className="flex items-center justify-between mb-12">
                       <div className="space-y-1">
                          <h3 className="text-2xl font-black text-[#002645] uppercase tracking-tighter flex items-center gap-4">Editorial Audit Trail</h3>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Synchronized with Regional Nodes</p>
                       </div>
                       <button onClick={loadData} className="w-14 h-14 bg-gray-50 text-gray-400 hover:text-[#795900] rounded-2xl transition-all border border-gray-100 hover:border-[#795900]/20 flex items-center justify-center"><RefreshCcw size={20} /></button>
                    </div>
                    <div className="space-y-4">
                       {[] as any[]}
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-full">No recent audit trail logs available.</p>
                    </div>
                  </div>

                  <div className="space-y-12">
                     <div className="bg-[#002645] rounded-[3.5rem] shadow-2xl p-12 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#795900]/20 rounded-full -mr-32 -mt-32 blur-3xl transition-transform duration-1000 group-hover:scale-150"></div>
                        <h3 className="text-xl font-black uppercase tracking-tighter mb-10 flex items-center gap-4 relative z-10 italic"><Server size={22} className="text-[#ffc641]" /> System Integrity</h3>
                        <div className="space-y-10 relative z-10">
                           <div className="space-y-3">
                             <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em]">
                               <span className="text-gray-400">Node Latency</span>
                               <span className="text-[#ffc641]">2.4 MS</span>
                             </div>
                             <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                               <div className="w-[15%] h-full bg-[#ffc641] shadow-[0_0_15px_rgba(255,198,65,0.5)]"></div>
                             </div>
                           </div>
                           <div className="space-y-3">
                             <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em]">
                               <span className="text-gray-400">Memory Pressure</span>
                               <span className="text-green-500">OPTIMAL</span>
                             </div>
                             <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                               <div className="w-[8%] h-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
                             </div>
                           </div>
                           <div className="pt-10">
                             <div className="bg-white/5 rounded-[2rem] p-8 border border-white/5 hover:bg-white/10 transition-all cursor-default">
                                <div className="flex items-center justify-between mb-2">
                                   <p className="text-[11px] font-black text-[#ffc641] uppercase tracking-[0.4em]">Audit Heartbeat</p>
                                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                                </div>
                                <p className="text-2xl font-black text-white italic tracking-tighter">System Nominal</p>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">v4.2 PROD_READY</p>
                             </div>
                           </div>
                        </div>
                     </div>

                     <div className="bg-white rounded-[3.5rem] p-12 border border-gray-100 shadow-sm space-y-8">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Resource Priority</h4>
                        <div className="space-y-6">
                           {[
                              { label: 'Politics Analysis', val: 88, color: 'bg-[#002645]' },
                              { label: 'Fiscal Oversight', val: 62, color: 'bg-[#795900]' },
                              { label: 'Regional Safety', val: 45, color: 'bg-[#ba1a1a]' }
                           ].map((bar, i) => (
                              <div key={i} className="space-y-2">
                                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[#002645]">
                                    <span>{bar.label}</span>
                                    <span>{bar.val}%</span>
                                 </div>
                                 <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                    <div className={`h-full ${bar.color} transition-all duration-1000`} style={{ width: `${bar.val}%` }}></div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            )}


            {activeTab === 'ads' && adConfig && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 animate-fade-in">
                 <div className="xl:col-span-2 space-y-8">
                    {/* Home Banner Control */}
                    <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
                       <div className="flex justify-between items-center mb-8">
                          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3"><Globe size={22} className="text-kph-red" /> Headline Banner Unit</h3>
                          <div className="flex items-center gap-4">
                             <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 ${adConfig.homeBanner.imageUrl ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${adConfig.homeBanner.imageUrl ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                {adConfig.homeBanner.imageUrl ? 'Asset Configured' : 'No Asset Configured'}
                             </div>
                             <button 
                                onClick={() => setAdConfig(prev => prev ? ({...prev, homeBanner: {...prev.homeBanner, enabled: !prev.homeBanner.enabled}}) : null)} 
                                className={`w-14 h-7 rounded-full transition-all duration-300 ${(adConfig.homeBanner?.enabled) ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-gray-300'} relative`}
                             >
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${(adConfig.homeBanner?.enabled) ? 'left-8' : 'left-1'}`} />
                             </button>
                          </div>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Ad Title (Internal)</label>
                                <input 
                                   type="text" 
                                   value={adConfig.homeBanner.title || ''} 
                                   onChange={(e) => setAdConfig(prev => prev ? ({...prev, homeBanner: {...prev.homeBanner, title: e.target.value}}) : null)} 
                                   className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl px-8 py-4 text-sm font-bold focus:border-kph-red outline-none transition-all" 
                                   placeholder="e.g. November Election Promo" 
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Destination Link</label>
                                <input 
                                   type="text" 
                                   value={adConfig.homeBanner.linkUrl} 
                                   onChange={(e) => setAdConfig(prev => prev ? ({...prev, homeBanner: {...prev.homeBanner, linkUrl: e.target.value}}) : null)} 
                                   className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl px-8 py-4 text-sm font-bold focus:border-kph-red outline-none transition-all" 
                                   placeholder="https://..." 
                                />
                             </div>
                          </div>
                          <div className="space-y-6">
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Banner Creative</label>
                             <div 
                                onClick={() => homeBannerInputRef.current?.click()}
                                className="relative group aspect-video bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-kph-red/30 transition-all"
                             >
                                {isUploading === 'homeBanner' ? (
                                   <div className="flex flex-col items-center gap-2">
                                      <Loader2 className="animate-spin text-kph-red" />
                                      <span className="text-[10px] font-black uppercase text-gray-400">Deploying Asset...</span>
                                   </div>
                                ) : adConfig.homeBanner.imageUrl ? (
                                   <>
                                      <img src={adConfig.homeBanner.imageUrl} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                         <label className="bg-white text-gray-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-pointer hover:scale-105 transition-transform">Replace Creative</label>
                                      </div>
                                   </>
                                ) : (
                                   <div className="text-center group-hover:scale-110 transition-transform">
                                      <ImagePlus className="mx-auto text-gray-300 mb-2 group-hover:text-kph-red transition-colors" size={32} />
                                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-kph-charcoal">Deployment Pending</p>
                                   </div>
                                )}
                                <input ref={homeBannerInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'homeBanner')} />
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Sidebar Ad Control */}
                    <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
                       <div className="flex justify-between items-center mb-8">
                          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3"><Layout size={22} className="text-kph-red" /> Sidebar Intelligence Box</h3>
                          <div className="flex items-center gap-4">
                             <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 ${adConfig.sidebarAd.imageUrl ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${adConfig.sidebarAd.imageUrl ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                {adConfig.sidebarAd.imageUrl ? 'Asset Configured' : 'No Asset Configured'}
                             </div>
                             <button 
                                onClick={() => setAdConfig(prev => prev ? ({...prev, sidebarAd: {...prev.sidebarAd, enabled: !prev.sidebarAd.enabled}}) : null)} 
                                className={`w-14 h-7 rounded-full transition-all duration-300 ${(adConfig.sidebarAd?.enabled) ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-gray-300'} relative`}
                             >
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${(adConfig.sidebarAd?.enabled) ? 'left-8' : 'left-1'}`} />
                             </button>
                          </div>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Ad Title</label>
                                <input 
                                   type="text" 
                                   value={adConfig.sidebarAd.title || ''} 
                                   onChange={(e) => setAdConfig(prev => prev ? ({...prev, sidebarAd: {...prev.sidebarAd, title: e.target.value}}) : null)} 
                                   className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl px-8 py-4 text-sm font-bold focus:border-kph-red outline-none transition-all" 
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Destination Link</label>
                                <input 
                                   type="text" 
                                   value={adConfig.sidebarAd.linkUrl} 
                                   onChange={(e) => setAdConfig(prev => prev ? ({...prev, sidebarAd: {...prev.sidebarAd, linkUrl: e.target.value}}) : null)} 
                                   className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl px-8 py-4 text-sm font-bold focus:border-kph-red outline-none transition-all" 
                                />
                             </div>
                          </div>
                          <div className="space-y-6">
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Square Creative</label>
                             <div 
                                onClick={() => sidebarAdInputRef.current?.click()}
                                className="relative group aspect-square bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-kph-red/30 transition-all"
                             >
                                {isUploading === 'sidebarAd' ? (
                                   <div className="flex flex-col items-center gap-2">
                                      <Loader2 className="animate-spin text-kph-red" />
                                      <span className="text-[10px] font-black uppercase text-gray-400">Deploying...</span>
                                   </div>
                                ) : adConfig.sidebarAd.imageUrl ? (
                                   <>
                                      <img src={adConfig.sidebarAd.imageUrl} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                         <label className="bg-white text-gray-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-pointer hover:scale-105 transition-transform">Replace Creative</label>
                                      </div>
                                   </>
                                ) : (
                                   <div className="text-center group-hover:scale-110 transition-transform">
                                      <ImagePlus className="mx-auto text-gray-300 mb-2 group-hover:text-kph-red transition-colors" size={32} />
                                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-kph-charcoal">Deployment Pending</p>
                                   </div>
                                )}
                                <input ref={sidebarAdInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'sidebarAd')} />
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div className="bg-gray-950 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-kph-red opacity-10 blur-3xl rounded-full -mr-16 -mt-16"></div>
                       <h3 className="text-xl font-black uppercase tracking-tighter mb-10 flex items-center gap-3 relative z-10"><Activity size={22} className="text-kph-red" /> Live Deployment Hub</h3>
                       
                       <div className="space-y-10 relative z-10">
                          <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                             <div className="flex items-center justify-between mb-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Network Readiness</p>
                                <span className="text-[10px] font-black text-green-500 uppercase">Synchronized</span>
                             </div>
                             <div className="space-y-4">
                                <div className="flex items-center justify-between text-xs">
                                   <span className="text-gray-500">Headline Creative</span>
                                   <span className={adConfig.homeBanner.imageUrl ? 'text-green-500' : 'text-gray-600'}>
                                      {adConfig.homeBanner.imageUrl ? 'Image Configured' : 'No Image Configured'}
                                   </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                   <span className="text-gray-500">Sidebar Creative</span>
                                   <span className={adConfig.sidebarAd.imageUrl ? 'text-green-500' : 'text-gray-600'}>
                                      {adConfig.sidebarAd.imageUrl ? 'Image Configured' : 'No Image Configured'}
                                   </span>
                                </div>
                             </div>
                          </div>

                          <div className="space-y-4">
                             <div className="flex justify-between items-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Headline Stats</p>
                                <span className="text-[10px] font-black text-gray-300">CTR: {calculateCTR(adConfig.homeBanner.stats.clicks, adConfig.homeBanner.stats.impressions)}%</span>
                             </div>
                             <PerformanceBar label="Reach" value={adConfig.homeBanner.stats.impressions} total={adConfig.homeBanner.stats.impressions} />
                             <PerformanceBar label="Engagement" value={adConfig.homeBanner.stats.clicks} total={adConfig.homeBanner.stats.impressions} color="bg-kph-red" />
                          </div>
                          
                          <div className="space-y-4">
                             <div className="flex justify-between items-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Sidebar Stats</p>
                                <span className="text-[10px] font-black text-gray-300">CTR: {calculateCTR(adConfig.sidebarAd.stats.clicks, adConfig.sidebarAd.stats.impressions)}%</span>
                             </div>
                             <PerformanceBar label="Reach" value={adConfig.sidebarAd.stats.impressions} total={adConfig.sidebarAd.stats.impressions} />
                             <PerformanceBar label="Engagement" value={adConfig.sidebarAd.stats.clicks} total={adConfig.sidebarAd.stats.impressions} color="bg-kph-red" />
                          </div>
                          
                          <div className="pt-8 border-t border-white/10 space-y-4">
                             <button onClick={handleSaveAds} className="w-full bg-white text-gray-900 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95"><Save size={18} /> Push Config to Live</button>
                             <button onClick={handleResetStats} className="w-full bg-white/5 text-gray-400 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3 border border-white/5"><RefreshCcw size={18} /> Purge Analytics Data</button>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'users' && (
               <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
                  <div className="p-10 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-6 bg-gray-50/30">
                     <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Team Identity Management</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Authorized access points for KPH internal systems</p>
                     </div>
                     <button onClick={() => setShowAddUserModal(true)} className="bg-gray-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-all shadow-xl"><Plus size={18} /> Establish New Entry</button>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full border-collapse">
                        <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                           <tr>
                             <th className="px-10 py-6 text-left">Internal ID</th>
                             <th className="px-10 py-6 text-left">System Persona</th>
                             <th className="px-10 py-6 text-left">Level</th>
                             <th className="px-10 py-6 text-right">Security</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                           {users.map(u => (
                              <tr key={u.id} className="hover:bg-gray-50 transition-colors group">
                                 <td className="px-10 py-8">
                                    <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-400">
                                        {u.name.charAt(0)}
                                      </div>
                                      <div>
                                        <p className="text-sm font-black text-gray-900">{u.name}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{u.email}</p>
                                      </div>
                                    </div>
                                 </td>
                                 <td className="px-10 py-8">
                                    <div className="flex items-center gap-2">
                                       <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                       <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Active Connection</span>
                                    </div>
                                 </td>
                                 <td className="px-10 py-8">
                                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${u.role === 'Admin' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                      {u.role}
                                    </span>
                                 </td>
                                 <td className="px-10 py-8 text-right">
                                    <button onClick={() => handleDeleteUser(u.id)} className="text-gray-300 hover:text-red-600 p-3 rounded-xl hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={20} /></button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

            {activeTab === 'content' && (
               <div className="space-y-10 animate-fade-in">
                  <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
                     <div className="p-10 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-center bg-gray-50/30 gap-6">
                        <div className="space-y-1">
                           <h2 className="text-2xl font-black text-[#002645] uppercase tracking-tighter">Content Pipeline</h2>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Awaiting editorial certification</p>
                        </div>
                        <div className="flex gap-4">
                           <select className="bg-white border-2 border-gray-100 rounded-2xl px-6 py-3 font-black text-[10px] uppercase tracking-widest focus:border-[#795900] outline-none transition-all appearance-none pr-12 cursor-pointer shadow-sm relative">
                              <option>All Clusters</option>
                              <option>Politics</option>
                              <option>Economy</option>
                           </select>
                        </div>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                           <thead className="bg-[#fcf9f8] text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-100">
                              <tr>
                                 <th className="px-10 py-6 text-left">Narrative / Title</th>
                                 <th className="px-10 py-6 text-left">Identity</th>
                                 <th className="px-10 py-6 text-left">Sector</th>
                                 <th className="px-10 py-6 text-center">AI Audit Score</th>
                                 <th className="px-10 py-6 text-right">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-50">
                              {recentArticles.map((article) => (
                                 <tr key={article.id} className="hover:bg-gray-50 transition-all group">
                                    <td className="px-10 py-8 max-w-md">
                                       <div className="flex items-center gap-6">
                                          <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-gray-100 shadow-sm">
                                             <img src={article.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                          </div>
                                          <div>
                                             <p className="text-sm font-black text-[#002645] leading-snug group-hover:text-[#795900] transition-colors line-clamp-2">{article.title}</p>
                                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-2">{article.date}</p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-10 py-8">
                                       <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 bg-[#d1e4ff] text-[#002645] rounded-lg flex items-center justify-center font-black text-[10px] shadow-sm">
                                             {article.author.split(' ').map(n => n[0]).join('')}
                                          </div>
                                          <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{article.author}</span>
                                       </div>
                                    </td>
                                    <td className="px-10 py-8">
                                       <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-gray-200">{article.category}</span>
                                    </td>
                                    <td className="px-10 py-8">
                                       <div className="flex flex-col items-center gap-2">
                                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                             <div className="h-full bg-green-500" style={{ width: '88%' }}></div>
                                          </div>
                                          <span className="text-[10px] font-black text-green-600">88%</span>
                                       </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                       <button onClick={() => handleFeatureArticle(article.id)} className="bg-[#002645] text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 shadow-[#002645]/20">Audit & Certify</button>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
                  
                  <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm flex items-center justify-between">
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-[#fcf9f8] rounded-[2rem] flex items-center justify-center shadow-inner border border-gray-100">
                           <Layout className="text-[#002645]" size={24} />
                        </div>
                        <div>
                           <h4 className="text-xl font-black text-[#002645] uppercase tracking-tighter">Production Mirror Visualization</h4>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Real-time layout simulation for KPH Public Feed</p>
                        </div>
                     </div>
                     <button className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-all shadow-2xl active:scale-95"><ExternalLink size={18} /> Launch Public Mirror</button>
                  </div>
               </div>
            )}


            {activeTab === 'settings' && (
               <div className="max-w-3xl mx-auto space-y-12">
                  <div className="bg-white rounded-[4rem] shadow-xl border border-gray-100 overflow-hidden">
                     <div className="p-10 border-b border-gray-50 bg-red-50/20 flex items-center gap-6">
                        <div className="w-16 h-16 bg-white text-[#8B0000] rounded-[2rem] flex items-center justify-center shadow-2xl border border-red-50">
                           <AlertTriangle size={32} />
                        </div>
                        <div>
                           <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Emergency Broadcast Protocol</h3>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Instant global site-wide notification</p>
                        </div>
                     </div>
                     <div className="p-12 space-y-10">
                        <div className="flex items-center justify-between p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-inner">
                           <div>
                              <p className="font-black text-gray-900">Broadcast Status</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Real-time switch</p>
                           </div>
                           <button onClick={() => setGlobalAlert(prev => prev ? {...prev, enabled: !prev.enabled} : { enabled: true, message: '', type: 'critical' })} className={`w-16 h-8 rounded-full transition-all duration-300 ${globalAlert?.enabled ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-gray-300'} relative`}>
                              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${globalAlert?.enabled ? 'left-9' : 'left-1'}`} />
                           </button>
                        </div>
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-6">Alert Payload</label>
                           <textarea 
                              rows={4}
                              value={globalAlert?.message || ''} 
                              onChange={(e) => setGlobalAlert(prev => prev ? {...prev, message: e.target.value} : null)} 
                              placeholder="Enter broadcast content here..." 
                              className="w-full border-2 border-gray-100 rounded-[2.5rem] px-8 py-8 text-sm font-bold focus:border-[#8B0000] outline-none bg-gray-50 resize-none transition-all" 
                              disabled={!globalAlert?.enabled} 
                           />
                        </div>
                        <button onClick={handleSaveAlert} className="w-full bg-[#8B0000] text-white font-black py-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(139,0,0,0.3)] hover:bg-red-700 transition-all flex items-center justify-center gap-4 active:scale-[0.98] uppercase tracking-widest text-sm">
                           Initiate Broadcast <Power size={20} />
                        </button>
                     </div>
                  </div>
               </div>
            )}
           </motion.div>
          )}
          </AnimatePresence>
        </main>
      </div>

      {showAddUserModal && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-xl flex items-center justify-center z-[100] p-6">
          <div className="bg-white rounded-[3.5rem] shadow-2xl p-12 w-full max-w-lg border border-gray-100 animate-slide-up relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#8B0000] to-red-400"></div>
              <div className="flex items-center justify-between mb-10">
                 <div>
                   <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">System Entry</h3>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Assigning new identity token</p>
                 </div>
                 <button onClick={() => setShowAddUserModal(false)} className="w-12 h-12 bg-gray-100 hover:bg-gray-200 text-gray-400 rounded-2xl transition-all flex items-center justify-center"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddUser} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Full Identity Name</label>
                    <input type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl px-8 py-4 text-sm font-bold focus:border-[#8B0000] outline-none" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Digital Mail Point</label>
                    <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl px-8 py-4 text-sm font-bold focus:border-[#8B0000] outline-none" required />
                  </div>
                  <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setShowAddUserModal(false)} className="flex-1 bg-gray-100 text-gray-500 font-black py-5 rounded-[2rem] text-[10px] uppercase tracking-widest">Abort</button>
                    <button type="submit" className="flex-2 flex-[2] bg-gray-900 text-white font-black py-5 rounded-[2rem] text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl">Authorize Entry</button>
                  </div>
              </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
