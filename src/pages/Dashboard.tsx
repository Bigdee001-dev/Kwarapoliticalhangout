
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, FileText, BarChart2, Settings, LogOut, Plus, Search, 
  Bell, Menu, Edit3, Trash2, Save, ArrowLeft, Check, X, ChevronDown, 
  Smartphone, Monitor, Loader2, Image as ImageIcon, Video, Globe, 
  Eye, MessageSquare, ThumbsUp, Calendar, Filter, MoreVertical, 
  CloudUpload, Sparkles, Send, TrendingUp, Newspaper, Clock, Zap, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { AdminService, WriterArticle } from '../services/adminService';
import { ImageUploadService } from '../services/imageUploadService';

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    'Published': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'Draft': 'bg-slate-50 text-slate-500 border-slate-100',
    'Review': 'bg-amber-50 text-amber-700 border-amber-100'
  };
  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles['Draft']}`}>
      {status}
    </span>
  );
};

import { supabase } from '../services/supabase';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('stories');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const navigate = useNavigate();
  const [articles, setArticles] = useState<WriterArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user;
      setCurrentUser(user || null);
      if (user) {
        try {
          const { data: userDoc } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (userDoc) {
            setUserProfile(userDoc);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUserProfile(null);
        navigate('/login');
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user;
      setCurrentUser(user || null);
      if (user) {
        try {
          const { data: userDoc } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (userDoc) {
            setUserProfile(userDoc);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);
  
  // Editor State
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newArticle, setNewArticle] = useState({ 
    title: '', 
    category: 'Politics', 
    content: '', 
    imageUrl: '',
    videoUrl: '',
    excerpt: '',
    status: 'Draft' as 'Published' | 'Draft'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const data = await AdminService.getWriterArticles();
      setArticles(data);
    } catch (e) {
      showToast("Sync Error: Using local cache");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadArticles();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const url = await ImageUploadService.uploadImage(file, '/kph-articles');
      
      if (file.type.startsWith('video/')) {
        setNewArticle(prev => ({ ...prev, videoUrl: url, imageUrl: '' }));
        showToast('Video deployed to edge network');
      } else {
        setNewArticle(prev => ({ ...prev, imageUrl: url, videoUrl: '' }));
        showToast('Image deployed to edge network');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      showToast('Media deployment failure');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublish = async (status: 'Published' | 'Draft' = 'Published') => {
    if (!newArticle.title.trim()) return showToast("Article title is mandatory");
    setIsPublishing(true);
    try {
      await AdminService.publishArticle({
        ...newArticle,
        id: editingId || undefined,
        author: 'Admin Writer', 
        status: status,
        date: new Date().toISOString()
      });
      showToast(status === 'Published' ? "LIVE: Visible to the Public" : "Saved to Drafts");
      setShowEditor(false);
      resetEditor();
      loadArticles();
    } catch (err) {
      showToast('Database synchronization error');
    } finally {
      setIsPublishing(false);
    }
  };

  const resetEditor = () => {
    setNewArticle({ title: '', category: 'Politics', content: '', imageUrl: '', videoUrl: '', excerpt: '', status: 'Draft' });
    setEditingId(null);
  };

  const handleEdit = (article: WriterArticle) => {
    setEditingId(article.id);
    setNewArticle({
      title: article.title,
      category: article.category,
      content: article.content,
      imageUrl: article.imageUrl,
      videoUrl: article.videoUrl || '',
      excerpt: article.excerpt || '',
      status: article.status
    });
    setShowEditor(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Permanent deletion cannot be undone. Proceed?")) {
      await AdminService.deleteArticle(id);
      showToast("Article purged from database");
      loadArticles();
    }
  };

  if (showEditor) {
    return (
      <div className="bg-[#fcfcfd] min-h-screen flex flex-col animate-fade-in font-sans selection:bg-[#8B0000] selection:text-white">
        {/* Pro Studio Toolbar */}
        <header className="border-b border-gray-100 px-10 h-24 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-3xl z-[60]">
           <div className="flex items-center gap-8">
              <button onClick={() => { setShowEditor(false); resetEditor(); }} className="w-14 h-14 flex items-center justify-center hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100 group"><ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /></button>
              <div className="h-8 w-[2px] bg-gray-100"></div>
              <div>
                <h2 className="font-black text-xl uppercase tracking-tighter leading-none text-gray-950">Editorial Studio</h2>
                <p className="text-[10px] font-black text-kph-red uppercase tracking-widest mt-1.5 flex items-center gap-2 animate-pulse"><Zap size={10} /> Local Persistence Active</p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <button 
                onClick={() => handlePublish('Draft')} 
                disabled={isPublishing}
                className="px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all border border-gray-100"
              >
                Save to Archive
              </button>
              <button 
                onClick={() => handlePublish('Published')} 
                disabled={isPublishing || isUploading} 
                className="bg-gray-950 text-white px-10 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-black transition-all shadow-2xl hover:shadow-gray-400/20 active:scale-95 disabled:opacity-50"
              >
                {isPublishing ? <Loader2 className="animate-spin" size={18} /> : <Globe size={18} />} 
                Commit to Public Feed
              </button>
           </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
           <main className="flex-1 overflow-y-auto bg-white p-10 lg:p-24 selection:bg-gray-900 selection:text-white">
              <div className="max-w-4xl mx-auto space-y-16">
                 <div className="space-y-6">
                    <input 
                      type="text" 
                      value={newArticle.title} 
                      onChange={e => setNewArticle({...newArticle, title: e.target.value})} 
                      placeholder="Craft a commanding headline..." 
                      className="w-full text-6xl lg:text-7xl font-black border-none outline-none placeholder-gray-100 tracking-tighter text-gray-950 focus:placeholder-gray-50 transition-all"
                    />
                    <div className="flex flex-wrap items-center gap-8 pb-10 border-b border-gray-50">
                       <div className="flex items-center gap-3 bg-gray-50 px-5 py-2.5 rounded-2xl border border-gray-100">
                         <StatusBadge status={newArticle.status} />
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Visibility State</span>
                       </div>
                       <div className="relative group">
                          <select 
                            value={newArticle.category} 
                            onChange={e => setNewArticle({...newArticle, category: e.target.value})} 
                            className="bg-white border-2 border-gray-100 rounded-2xl px-6 py-3 font-black text-[10px] uppercase tracking-widest focus:border-gray-950 outline-none transition-all appearance-none pr-12 cursor-pointer"
                          >
                             <option>Politics</option><option>Media</option><option>News</option><option>People</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-gray-950 transition-colors" size={14} />
                       </div>
                       <button 
                         onClick={() => fileInputRef.current?.click()}
                         className="flex items-center gap-3 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-gray-950 transition-all bg-gray-50 hover:bg-gray-100 px-6 py-3 rounded-2xl border border-transparent hover:border-gray-200"
                       >
                          <CloudUpload size={18} className="text-kph-red" /> {newArticle.imageUrl || newArticle.videoUrl ? 'Rotate Asset' : 'Embed Intelligent Media'}
                       </button>
                       <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*" onChange={handleMediaUpload} />
                    </div>
                 </div>
                 
                 {isUploading && (
                   <div className="w-full h-[500px] bg-gray-50 rounded-[4rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center gap-6">
                      <Loader2 className="animate-spin text-kph-red" size={50} />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Processing Secure Intelligence...</p>
                   </div>
                 )}

                 {(newArticle.imageUrl || newArticle.videoUrl) && !isUploading && (
                   <div className="relative group rounded-[4rem] overflow-hidden shadow-2xl border border-gray-100 group">
                      {newArticle.videoUrl ? (
                        <video src={newArticle.videoUrl} controls className="w-full h-auto bg-black" />
                      ) : (
                        <img src={newArticle.imageUrl} className="w-full h-[600px] object-cover group-hover:scale-105 transition-transform duration-[2s]" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                         <button 
                           onClick={() => setNewArticle(prev => ({...prev, imageUrl: '', videoUrl: ''}))}
                           className="bg-white/20 hover:bg-red-500 text-white p-5 rounded-full transition-all backdrop-blur-xl border border-white/20"
                         >
                           <X size={24} />
                         </button>
                      </div>
                   </div>
                 )}

                 <div className="relative">
                    <div className="absolute -left-16 top-0 hidden xl:flex flex-col gap-6 text-gray-300">
                       <button className="hover:text-gray-950 transition-all" title="Bold"><Sparkles size={20} /></button>
                       <button className="hover:text-gray-950 transition-all" title="Italic"><Zap size={20} /></button>
                    </div>
                    <textarea 
                      value={newArticle.content} 
                      onChange={e => setNewArticle({...newArticle, content: e.target.value})}
                      placeholder="The citizens are listening. Write with truth and authority..." 
                      className="w-full min-h-[900px] text-2xl border-none outline-none leading-[1.8] text-gray-800 placeholder-gray-100 resize-none font-serif pb-60 transition-all focus:placeholder-transparent"
                    />
                 </div>
              </div>
           </main>

           {/* Studio Config Workspace */}
           <aside className="hidden xl:flex w-96 border-l border-gray-100 bg-[#f8f9fb] flex-col p-10 space-y-10 overflow-y-auto">
              <div className="space-y-6">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2"><Settings size={12} /> Narrative Config</h4>
                 <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8 animate-fade-in">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-950 uppercase tracking-widest">Public Abstract</label>
                       <textarea 
                         rows={5}
                         value={newArticle.excerpt}
                         onChange={e => setNewArticle({...newArticle, excerpt: e.target.value})}
                         placeholder="Synthesize the story for the feed..."
                         className="w-full bg-gray-50 border border-transparent rounded-2xl p-5 text-sm font-medium outline-none focus:border-gray-200 focus:bg-white transition-all resize-none leading-relaxed"
                       />
                       <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest text-right">Character Limit: {newArticle.excerpt.length}/280</p>
                    </div>

                    <div className="pt-6 border-t border-gray-50 space-y-4">
                       <label className="text-[10px] font-black text-gray-950 uppercase tracking-widest">Publication Date</label>
                       <div className="w-full bg-gray-50 p-4 rounded-xl text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-3">
                          <Calendar size={14} className="text-kph-red" /> {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-gray-950 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute bottom-0 left-0 w-full h-1 bg-kph-red"></div>
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-3 text-kph-red"><Sparkles size={16} /> Intelligence Hub</h4>
                 <p className="text-xs text-gray-400 font-medium leading-[1.7] mb-8">Data suggests headlines containing <span className="text-white font-black italic">"Kwara"</span> or <span className="text-white font-black italic">"Governor"</span> yield 3.2x higher engagement index within local sectors.</p>
                 <button className="w-full bg-white/5 hover:bg-white hover:text-gray-950 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/10">Optimize Content</button>
              </div>
           </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans selection:bg-[#8B0000] selection:text-white overflow-hidden h-screen">
      {/* Refined Modern Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-20 flex items-center px-8 border-b border-slate-100">
           <Logo variant="dark" className="scale-75" />
        </div>
        
        <nav className="flex-1 py-8 px-4 space-y-1">
           {[
             { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
             { id: 'stories', label: 'My Stories', icon: FileText },
             { id: 'media', label: 'Library', icon: ImageIcon },
             { id: 'settings', label: 'Settings', icon: Settings },
           ].map(item => (
             <button 
               key={item.id}
               onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} 
               className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === item.id ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50'}`}
             >
                <item.icon size={18} className="mr-3" /> 
                <span>{item.label}</span>
             </button>
           ))}
        </nav>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#8B0000] flex items-center justify-center font-bold text-white text-sm">
                {(userProfile?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 truncate">{userProfile?.displayName || currentUser?.email?.split('@')[0]}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  {userProfile?.status === 'pending' ? 'Application Pending' : (userProfile?.role || 'Contributor')}
                </p>
              </div>
           </div>
           <button onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }} className="w-full flex items-center justify-center gap-2 py-2.5 text-slate-500 hover:text-[#8B0000] text-xs font-bold transition-all hover:bg-white rounded-lg border border-transparent hover:border-slate-200"><LogOut size={14} /> Sign out</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Minimal Tool Header */}
        <header className="bg-white border-b border-slate-200 h-20 px-8 flex items-center justify-between sticky top-0 z-40 shrink-0">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-lg font-bold text-slate-900 capitalize tracking-tight">
                {activeTab}
              </h1>
              {(['danielajibade50@gmail.com', 'abdulrahmanadebambo@gmail.com'].includes(currentUser?.email || '') || userProfile?.role === 'admin') && (
                <button 
                  onClick={() => navigate('/admin')}
                  className="hidden md:flex items-center gap-2 bg-slate-950 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-black transition-all ml-4"
                >
                  <ShieldCheck size={14} className="text-kph-red" /> Admin Console
                </button>
              )}
           </div>
           
           <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/writer-studio')}
                className="bg-[#8B0000] text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#a00000] transition-all shadow-sm active:scale-95"
              >
                <Plus size={18} /> New Post
              </button>
              <div className="w-10 h-10 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all cursor-pointer">
                 <Bell size={18} />
              </div>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50/30 p-8 scroll-smooth">
           <AnimatePresence mode="wait">
           {isLoading ? (
             <motion.div 
               key="loading"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="h-full flex flex-col items-center justify-center space-y-3"
             >
                <Loader2 className="animate-spin text-[#8B0000]" size={32} />
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Loading newsroom...</p>
             </motion.div>
           ) : (
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
               className="max-w-6xl mx-auto"
             >
                {activeTab === 'overview' && (
                  <div className="space-y-8 pb-10">
                     {userProfile?.status === 'pending' && (
                       <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                             <Clock size={24} />
                          </div>
                          <div>
                             <h4 className="font-bold text-amber-900">Application Under Review</h4>
                             <p className="text-sm text-amber-800 leading-relaxed">Thank you for joining Kwara Political Hangout. Our editorial board is currently reviewing your profile. You can still use the studio to draft articles in the meantime.</p>
                          </div>
                       </div>
                     )}

                     <header className="flex flex-col gap-1">
                        <h2 className="text-2xl font-bold text-slate-900 font-serif">Welcome back, {userProfile?.displayName?.split(' ')[0] || 'Writer'}</h2>
                        <p className="text-sm text-slate-500">Here's what's happening with your content today.</p>
                     </header>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                          { label: 'Published Stories', value: articles.filter(a => a.status === 'Published').length, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                          { label: 'Drafts', value: articles.filter(a => a.status === 'Draft').length, icon: Edit3, color: 'text-slate-600', bg: 'bg-slate-100' },
                          { label: 'Total Views', value: '0', icon: Eye, color: 'text-[#8B0000]', bg: 'bg-red-50' },
                          { label: 'Network Reach', value: '0%', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
                        ].map((stat, i) => (
                          <div 
                            key={i} 
                            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300"
                          >
                             <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                                <stat.icon size={20} />
                             </div>
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                             <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
                          </div>
                        ))}
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <section className="lg:col-span-2 space-y-6">
                           <div className="flex items-center justify-between">
                              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                 <Clock size={18} className="text-[#8B0000]" /> Recent Activity
                              </h3>
                              <button className="text-xs font-bold text-[#8B0000] hover:underline">View All</button>
                           </div>
                           
                           <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                              {articles.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                   {articles.slice(0, 5).map((article, i) => (
                                      <div key={i} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                         <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                                               <img src={article.imageUrl || 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?q=80&w=100&auto=format&fit=crop'} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="min-w-0">
                                               <h4 className="text-sm font-bold text-slate-900 truncate mb-1">{article.title}</h4>
                                               <div className="flex items-center gap-3">
                                                  <StatusBadge status={article.status} />
                                                  <span className="text-[10px] text-slate-400 font-semibold uppercase">{new Date(article.date).toLocaleDateString()}</span>
                                               </div>
                                            </div>
                                         </div>
                                         <button onClick={() => navigate('/writer-studio')} className="p-2 text-slate-400 hover:text-slate-900 transition-colors group-hover:bg-white rounded-lg border border-transparent hover:border-slate-200"><Edit3 size={16} /></button>
                                      </div>
                                   ))}
                                </div>
                              ) : (
                                <div className="p-12 text-center">
                                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                      <FileText size={32} />
                                   </div>
                                   <p className="text-slate-500 text-sm font-medium">No stories found. Start your first report today!</p>
                                </div>
                              )}
                           </div>
                        </section>

                        <aside className="space-y-6">
                           <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                              <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                              <h4 className="text-xs font-bold uppercase tracking-widest text-[#8B0000] mb-4 flex items-center gap-2"><TrendingUp size={14} /> Analytics Insight</h4>
                              <p className="text-sm text-slate-300 leading-relaxed mb-6 font-medium">Analytics currently unavailable.</p>
                              <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-all border border-white/10">View Detailed Analytics</button>
                           </div>

                           <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">Newsroom Feed</h4>
                              <div className="space-y-6">
                                 {[] as any[]}
                                 <p className="text-xs text-slate-400">No new notifications.</p>
                              </div>
                           </div>
                        </aside>
                     </div>
                  </div>
               )}

               {activeTab === 'stories' && (
                  <div className="space-y-6 animate-fade-in relative">
                     <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4">
                        <div className="flex items-center gap-2">
                           {['All', 'Published', 'Drafts'].map(f => (
                              <button key={f} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${f === 'All' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{f}</button>
                           ))}
                        </div>
                        <div className="relative w-full md:w-72">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                           <input 
                             type="text" 
                             placeholder="Search stories..." 
                             value={searchTerm}
                             onChange={e => setSearchTerm(e.target.value)}
                             className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm font-medium focus:bg-white transition-all outline-none focus:border-slate-400" 
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 gap-4">
                        {articles.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase())).map(article => (
                           <div 
                             key={article.id} 
                             className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-center group hover:bg-slate-50/50 transition-all duration-200"
                           >
                              <div className="flex items-center gap-6 w-full">
                                 <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-slate-100 bg-slate-50">
                                    {(article.imageUrl || article.videoUrl) ? (
                                       <img src={article.imageUrl || 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?q=80&w=200&auto=format&fit=crop'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                       <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={24} /></div>
                                    )}
                                 </div>
                                 <div className="space-y-1.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                       <StatusBadge status={article.status} />
                                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={12} /> {new Date(article.date).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-[#8B0000] transition-colors truncate">{article.title}</h3>
                                    <p className="text-slate-500 text-xs line-clamp-1 max-w-xl italic">"{article.excerpt || 'No summary leads the way yet.'}"</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2 mt-4 md:mt-0 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                 <button onClick={() => navigate('/writer-studio')} className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all" title="Edit Manuscript"><Edit3 size={18} /></button>
                                 <button onClick={() => handleDelete(article.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Purge Story"><Trash2 size={18} /></button>
                              </div>
                           </div>
                        ))}
                        {articles.length === 0 && (
                          <div className="py-24 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                             <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <Newspaper size={32} />
                             </div>
                             <h3 className="text-lg font-bold text-slate-900">Desk Empty</h3>
                             <p className="text-sm text-slate-400 mt-1">The citizens are waiting for your report. Create one to begin.</p>
                          </div>
                        )}
                     </div>
                  </div>
               )}

               {activeTab === 'settings' && (
                  <div className="max-w-2xl space-y-8 animate-fade-in pb-10">
                     <header>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Studio Settings</h2>
                        <p className="text-sm text-slate-500">Manage your writing environment and identity.</p>
                     </header>

                     <div className="space-y-6">
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="w-14 h-14 bg-slate-950 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                    {(userProfile?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
                                  </div>
                                 <div>
                                    <h4 className="font-bold text-slate-900">Writer Identity</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">Visible on all published reports</p>
                                 </div>
                              </div>
                              <button className="text-xs font-bold text-[#8B0000] hover:underline">Update Profile</button>
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Display Name</label>
                                 <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600">{userProfile?.displayName || 'Not Set'}</div>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                                 <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600">{currentUser?.email}</div>
                              </div>
                           </div>
                        </div>

                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                           <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2 px-1 text-sm uppercase tracking-wide">Studio Preferences</h4>
                           <div className="space-y-4">
                              {[
                                 { label: 'Auto-Save Manuscript', icon: Save, active: true },
                                 { label: 'Intelligence Suggestions', icon: Sparkles, active: true },
                                 { label: 'High Performance Sync', icon: Zap, active: true },
                              ].map((pref, i) => (
                                 <div key={i} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/50 rounded-xl border border-slate-100 transition-all">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 transform group-hover:scale-110 transition-transform"><pref.icon size={16} /></div>
                                       <span className="text-sm font-semibold text-slate-700">{pref.label}</span>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${pref.active ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                                       <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${pref.active ? 'left-6' : 'left-1'}`}></div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>

                        <div className="bg-red-50 p-8 rounded-2xl border border-red-100 space-y-4 relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-4 opacity-10"><LogOut size={64} /></div>
                           <h4 className="font-bold text-red-900 flex items-center gap-2">Danger Zone</h4>
                           <p className="text-xs text-red-700 font-medium leading-relaxed max-w-md">Invalidating your session will disconnect your local node and clear the secure cache.</p>
                           <button onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }} className="bg-white text-red-600 hover:bg-red-600 hover:text-white px-6 py-2.5 rounded-lg text-xs font-bold transition-all border border-red-200 shadow-sm active:scale-95">Disconnect Session</button>
                        </div>
                     </div>
                  </div>
               )}

                 {activeTab === 'media' && (
                  <div className="space-y-8 animate-fade-in pb-10">
                     <header className="flex items-center justify-between">
                        <div>
                           <h2 className="text-xl font-bold text-slate-900">Media Library</h2>
                           <p className="text-sm text-slate-500">Manage assets used across your stories.</p>
                        </div>
                        <button onClick={() => fileInputRef.current?.click()} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95"><CloudUpload size={18} /> Upload</button>
                     </header>
                     
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {articles.filter(a => a.imageUrl || a.videoUrl).map((article, i) => (
                           <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-200 group relative bg-white shadow-sm ring-inset hover:ring-2 hover:ring-[#8B0000] transition-all">
                              {article.videoUrl ? (
                                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                   <Video className="text-white opacity-20" size={32} />
                                   <video src={article.videoUrl} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-opacity" muted />
                                </div>
                              ) : (
                                <img src={article.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end p-4 text-center">
                                 <p className="text-white text-[10px] font-bold uppercase tracking-wider mb-3 line-clamp-1">{article.title}</p>
                                 <button className="w-full bg-white text-slate-900 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50">Reuse</button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
             </motion.div>
           )}
           </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
      {toast && (
        <motion.div 
          initial={{ y: 50, opacity: 0, x: "-50%" }}
          animate={{ y: 0, opacity: 1, x: "-50%" }}
          exit={{ y: 50, opacity: 0, x: "-50%" }}
          className="fixed bottom-8 left-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 backdrop-blur-md"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-bold uppercase tracking-wider">{toast}</span>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
