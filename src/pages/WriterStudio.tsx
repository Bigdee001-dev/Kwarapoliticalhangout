
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Cloud, Trash2, Bold, Italic, Underline, 
  Heading1, Heading2, Quote, Link, Image as ImageIcon, 
  List, ListOrdered, Brain, Sparkles, Wand2, SpellCheck, 
  Send as SendIcon, Save, Upload, X, Check, Info, Loader2,
  Video, Play, FileVideo
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { AdminService } from '../services/adminService';
import { toast } from 'sonner';
import { ImageUploadService } from '../services/imageUploadService';
import { VideoUploadService } from '../services/videoUploadService';

const WriterStudio: React.FC = () => {
    const navigate = useNavigate();
    const contentRef = useRef<HTMLDivElement>(null);
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("Politics");
    const [subCategory, setSubCategory] = useState("General");
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState("");
    const [wordCount, setWordCount] = useState(0);
    const [readingTime, setReadingTime] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
    const [featuredImage, setFeaturedImage] = useState<string | null>(null);
    const [aiProcessing, setAiProcessing] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [featuredVideo, setFeaturedVideo] = useState<string | null>(null);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const [videoUploadProgress, setVideoUploadProgress] = useState(0);
    const [videoFileName, setVideoFileName] = useState<string | null>(null);
    const [uploadStats, setUploadStats] = useState<{ speed: string; eta: string } | null>(null);
    const uploadStartTime = useRef<number>(0);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!session?.user) {
                navigate('/login');
                return;
            }
            try {
                const { data: userDoc } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                if (userDoc) {
                    setUserProfile(userDoc);
                }
            } catch (error) {
                console.error("Profile fetch error:", error);
            }
        });
        
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!session?.user) {
                navigate('/login');
                return;
            }
            try {
                const { data: userDoc } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                if (userDoc) {
                    setUserProfile(userDoc);
                }
            } catch (error) {
                console.error("Profile fetch error:", error);
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    const runAiAction = (action: string) => {
        setAiProcessing(action);
        setTimeout(() => {
            setAiProcessing(null);
            if (action === "strategic tags") {
                const suggested = ["Governance", "YouthVote", "IlorinWest"];
                const newTags = [...new Set([...tags, ...suggested])];
                setTags(newTags.slice(0, 5));
            }
        }, 2000);
    };

    // Helpers
    const updateMetrics = () => {
        if (!contentRef.current) return;
        const text = contentRef.current.innerText || "";
        const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        setWordCount(words);
        setReadingTime(Math.ceil(words / 200));
    };

    // Initial content
    useEffect(() => {
        if (contentRef.current && contentRef.current.innerHTML === "") {
            contentRef.current.innerHTML = "";
            updateMetrics();
        }
    }, []);

    const handleInput = () => {
        updateMetrics();
        // Debounced auto-save could go here
    };

    const handlePublish = async (status: 'draft' | 'pending') => {
        if (!title || !contentRef.current?.innerText) {
            toast.error("Please provide a title and content.");
            return;
        }

        if (status === 'pending') setIsSubmitting(true);
        else setIsSaving(true);

        try {
            await AdminService.publishArticle({
                title,
                content: contentRef.current.innerHTML,
                excerpt: contentRef.current.innerText.slice(0, 160) + '...',
                category,
                subCategory,
                tags,
                imageUrl: featuredImage,
                videoUrl: featuredVideo || undefined,
                status,
                wordCount,
                readTime: readingTime
            });
            
            toast.success(status === 'pending' ? 'Article submitted for certification!' : 'Draft saved successfully.');
            if (status === 'pending') {
                setTimeout(() => navigate('/dashboard'), 1500);
            }
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Failed to save article.");
        } finally {
            setIsSubmitting(false);
            setIsSaving(false);
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 2000);
        }
    };

    const addTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newTag.trim()) {
            if (!tags.includes(newTag.trim())) {
                setTags([...tags, newTag.trim()]);
            }
            setNewTag("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleFormat = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        contentRef.current?.focus();
    };

    const handleFeaturedImageUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
            const file = e.target.files[0];
            if (file) {
                setIsUploadingImage(true);
                const loadingToast = toast.loading('Uploading featured image...');
                try {
                    const url = await ImageUploadService.uploadImage(file, '/kph-articles');
                    setFeaturedImage(url);
                    toast.success('Featured image uploaded!', { id: loadingToast });
                } catch (error) {
                    toast.error('Failed to upload image.', { id: loadingToast });
                } finally {
                    setIsUploadingImage(false);
                }
            }
        };
        input.click();
    };

    const handleVideoUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo';
        input.onchange = async (e: any) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                VideoUploadService.validateVideo(file);
            } catch (err: any) {
                toast.error(err.message);
                return;
            }

            setIsUploadingVideo(true);
            setVideoUploadProgress(0);
            setVideoFileName(file.name);
            setUploadStats(null);
            uploadStartTime.current = Date.now();
            const loadingToast = toast.loading('Initiating secure video upload...');

            try {
                const url = await VideoUploadService.uploadVideo(file, '/kph-videos', (pct, loaded, total) => {
                    setVideoUploadProgress(pct);
                    
                    // Calculate speed and ETA
                    const now = Date.now();
                    const duration = (now - uploadStartTime.current) / 1000;
                    if (duration > 0.5) {
                        const bps = loaded / duration;
                        const kbps = bps / 1024;
                        const mbps = kbps / 1024;
                        
                        const speed = mbps > 1 ? `${mbps.toFixed(1)} MB/s` : `${kbps.toFixed(0)} KB/s`;
                        
                        const remainingBytes = total - loaded;
                        const remainingSeconds = remainingBytes / bps;
                        const eta = remainingSeconds > 60 
                            ? `${Math.floor(remainingSeconds / 60)}m ${Math.floor(remainingSeconds % 60)}s`
                            : `${Math.floor(remainingSeconds)}s`;
                            
                        setUploadStats({ speed, eta });
                    }
                });
                setFeaturedVideo(url);
                toast.success('Video uploaded successfully!', { id: loadingToast });
            } catch (error: any) {
                toast.error(`Video upload failed: ${error.message}`, { id: loadingToast });
                setVideoFileName(null);
            } finally {
                setIsUploadingVideo(false);
                setUploadStats(null);
            }
        };
        input.click();
    };

    const handleEditorImageUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
            const file = e.target.files[0];
            if (file) {
                const loadingToast = toast.loading('Uploading image...');
                try {
                    const url = await ImageUploadService.uploadImage(file, '/kph-articles');
                    handleFormat('insertImage', url);
                    toast.success('Image inserted!', { id: loadingToast });
                } catch (error) {
                    toast.error('Failed to upload image.', { id: loadingToast });
                }
            }
        };
        input.click();
    };

    return (
        <div className="bg-studio-background min-h-screen font-sans">
            {/* Top Navigation */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-studio-surface border-b border-studio-outline-variant">
                <div className="flex flex-row justify-between items-center w-full max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 text-studio-outline hover:text-studio-primary transition-colors group"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="font-semibold text-sm uppercase tracking-wider">Dashboard</span>
                        </button>
                        <div className="h-6 w-[1px] bg-studio-outline-variant mx-2"></div>
                        <h1 className="font-serif text-xl font-bold text-studio-primary">Editorial Studio</h1>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white border border-studio-outline-variant rounded-full">
                            <motion.div 
                                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-2 h-2 rounded-full bg-studio-secondary" 
                            />
                            <span className="text-xs font-semibold text-studio-outline uppercase tracking-tight">
                                {saveStatus === "saving" ? "Syncing..." : "Cloud Sync Active"}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 pl-4 border-l border-studio-outline-variant">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-studio-on-surface">Editorial Desk</p>
                                <p className="text-[10px] text-studio-outline uppercase tracking-widest font-bold">Senior Analyst</p>
                            </div>
                            <img 
                                alt="Author" 
                                className="w-9 h-9 rounded-full border border-studio-outline-variant shadow-sm" 
                                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&h=100&auto=format&fit=crop"
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-24 pb-32">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-12 gap-8 items-start">
                    
                    {/* Editor Surface */}
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        <div className="bg-white border border-studio-outline-variant shadow-sm p-8 md:p-12 min-h-screen">
                            {/* Title */}
                            <textarea 
                                className="w-full bg-transparent border-none focus:ring-0 font-serif text-4xl md:text-5xl font-bold p-0 resize-none overflow-hidden mb-12 placeholder:text-studio-outline-variant text-studio-primary leading-tight" 
                                placeholder="Enter article title..." 
                                rows={2}
                                value={title}
                                onChange={(e) => { setTitle(e.target.value); }}
                            />

                            {/* Toolbar */}
                            <div className="sticky top-20 z-40 flex flex-wrap items-center gap-1 p-2 mb-8 bg-[#fdfdfd] border border-studio-outline-variant rounded-xl shadow-sm">
                                <button onClick={() => handleFormat('bold')} className="p-2 hover:bg-studio-background rounded transition-colors text-studio-outline hover:text-studio-primary" title="Bold"><Bold size={18} /></button>
                                <button onClick={() => handleFormat('italic')} className="p-2 hover:bg-studio-background rounded transition-colors text-studio-outline hover:text-studio-primary" title="Italic"><Italic size={18} /></button>
                                <button onClick={() => handleFormat('underline')} className="p-2 hover:bg-studio-background rounded transition-colors text-studio-outline hover:text-studio-primary" title="Underline"><Underline size={18} /></button>
                                <div className="w-[1px] h-6 bg-studio-outline-variant mx-1"></div>
                                <button onClick={() => handleFormat('formatBlock', 'h1')} className="p-2 hover:bg-studio-background rounded transition-colors text-studio-outline hover:text-studio-primary" title="Heading 1"><Heading1 size={18} /></button>
                                <button onClick={() => handleFormat('formatBlock', 'h2')} className="p-2 hover:bg-studio-background rounded transition-colors text-studio-outline hover:text-studio-primary" title="Heading 2"><Heading2 size={18} /></button>
                                <div className="w-[1px] h-6 bg-studio-outline-variant mx-1"></div>
                                <button onClick={() => handleFormat('formatBlock', 'blockquote')} className="p-2 hover:bg-studio-background rounded transition-colors text-studio-outline hover:text-studio-primary" title="Quote"><Quote size={18} /></button>
                                <button onClick={() => handleFormat('createLink', prompt('URL:') || '')} className="p-2 hover:bg-studio-background rounded transition-colors text-studio-outline hover:text-studio-primary" title="Link"><Link size={18} /></button>
                                <button onClick={handleEditorImageUpload} className="p-2 hover:bg-studio-background rounded transition-colors text-studio-outline hover:text-studio-primary" title="Image"><ImageIcon size={18} /></button>
                                <div className="w-[1px] h-6 bg-studio-outline-variant mx-1"></div>
                                <button onClick={() => handleFormat('insertUnorderedList')} className="p-2 hover:bg-studio-background rounded transition-colors text-studio-outline hover:text-studio-primary" title="Bullet List"><List size={18} /></button>
                                <button onClick={() => handleFormat('insertOrderedList')} className="p-2 hover:bg-studio-background rounded transition-colors text-studio-outline hover:text-studio-primary" title="Ordered List"><ListOrdered size={18} /></button>
                                
                                <div className="ml-auto flex items-center pr-2">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-studio-outline">Rich Text Active</span>
                                </div>
                            </div>

                            {/* Editor */}
                            <div 
                                ref={contentRef}
                                className="outline-none min-h-[600px] font-serif text-xl leading-relaxed text-studio-on-surface" 
                                contentEditable="true"
                                onInput={handleInput}
                            />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <aside className="col-span-12 lg:col-span-4 space-y-6 sticky top-24">
                        {/* Metadata */}
                        <div className="bg-white border border-studio-outline-variant p-6 space-y-6 shadow-sm">
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-studio-outline flex items-center gap-2">
                                <Info size={14} /> Article Blueprint
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-studio-outline uppercase tracking-widest mb-2">Primary Sector</label>
                                    <select 
                                        className="w-full bg-studio-background border border-studio-outline-variant rounded-lg p-3 text-sm font-semibold focus:border-studio-primary focus:ring-0 outline-none transition-all"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                    >
                                        <option>Politics</option>
                                        <option>Governance</option>
                                        <option>Economy</option>
                                        <option>People</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-studio-outline uppercase tracking-widest mb-2">Legislative Sub-Sector</label>
                                    <select 
                                        className="w-full bg-studio-background border border-studio-outline-variant rounded-lg p-3 text-sm font-semibold focus:border-studio-primary focus:ring-0 outline-none transition-all"
                                        value={subCategory}
                                        onChange={(e) => setSubCategory(e.target.value)}
                                    >
                                        <option>State Assembly</option>
                                        <option>Local Government</option>
                                        <option>Electoral Reform</option>
                                        <option>Policy Analysis</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-studio-outline uppercase tracking-widest mb-2">Categorical Tags</label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {tags.map(tag => (
                                            <span key={tag} className="inline-flex items-center px-2 py-1 bg-studio-primary/5 text-studio-primary text-[10px] font-black rounded-lg border border-studio-primary/20">
                                                #{tag} 
                                                <button onClick={() => removeTag(tag)} className="ml-1.5 text-studio-outline hover:text-studio-tertiary transition-colors">
                                                    <X size={10} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <input 
                                        className="w-full bg-studio-background border border-studio-outline-variant rounded-lg p-3 text-sm font-semibold focus:border-studio-primary focus:ring-0 outline-none transition-all" 
                                        placeholder="Add a tag and press Enter..." 
                                        type="text"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onKeyDown={addTag}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Featured Image */}
                        <div className="bg-white border border-studio-outline-variant p-6 shadow-sm">
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-studio-outline mb-4">Featured Perspective</h2>
                            <div 
                                onClick={handleFeaturedImageUpload}
                                className="relative aspect-video bg-studio-background border-2 border-dashed border-studio-outline-variant flex flex-col items-center justify-center cursor-pointer hover:bg-studio-outline-variant/10 transition-all group overflow-hidden"
                            >
                                {featuredImage ? (
                                    <img src={featuredImage} className="absolute inset-0 w-full h-full object-cover" alt="Featured" />
                                ) : (
                                    <div className="relative z-10 flex flex-col items-center text-studio-outline group-hover:text-studio-primary transition-colors">
                                        <Upload size={32} className="mb-2" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-center">
                                            {isUploadingImage ? 'Uploading...' : 'Deploy Hero Asset'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Visual Strategy */}
                        <div className="bg-white border border-studio-outline-variant p-6 shadow-sm">
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-studio-outline mb-4 flex items-center gap-2">
                                <Sparkles size={14} className="text-studio-secondary" /> Editorial Strategy
                            </h2>
                            <div className="flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!tags.includes('VisualExclusive')) setTags([...tags, 'VisualExclusive']);
                                    }}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                        tags.includes('VisualExclusive') 
                                        ? 'bg-studio-primary text-white border-studio-primary shadow-md' 
                                        : 'bg-studio-background text-studio-outline border-studio-outline-variant hover:border-studio-primary'
                                    }`}
                                >
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase tracking-widest">Visual Exclusive</p>
                                        <p className="text-[8px] opacity-60 font-bold uppercase">Optimized for video playback</p>
                                    </div>
                                    <Video size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Featured Video Asset */}
                        <div className="bg-white border border-studio-outline-variant p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-studio-outline flex items-center gap-2">
                                    <FileVideo size={14} /> Video Intelligence
                                </h2>
                                {featuredVideo && (
                                    <span className="flex items-center gap-1 text-[8px] font-black text-studio-secondary uppercase tracking-widest">
                                        <Check size={10} /> Asset Ready
                                    </span>
                                )}
                            </div>

                            {featuredVideo ? (
                                <div className="space-y-4">
                                    <div className="relative aspect-video bg-zinc-950 rounded-xl overflow-hidden shadow-2xl group/vid">
                                        <video
                                            src={featuredVideo}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                            controls
                                        />
                                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 to-transparent"></div>
                                    </div>
                                    <div className="bg-studio-background p-3 rounded-lg border border-studio-outline-variant">
                                        <p className="text-[9px] text-studio-primary font-bold uppercase tracking-tight truncate mb-1">
                                            {videoFileName || 'Cinematic Asset Loaded'}
                                        </p>
                                        <p className="text-[8px] text-studio-outline font-medium uppercase tracking-widest flex items-center gap-2">
                                            <ShieldAlert size={10} /> Verified MP4 Stream
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setFeaturedVideo(null); setVideoFileName(null); }}
                                        className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100"
                                    >
                                        <Trash2 size={12} /> Purge Video Asset
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={!isUploadingVideo ? handleVideoUpload : undefined}
                                    className={`relative aspect-video bg-studio-background border-2 border-dashed border-studio-outline-variant flex flex-col items-center justify-center cursor-pointer hover:bg-studio-outline-variant/10 transition-all group overflow-hidden rounded-xl ${
                                        isUploadingVideo ? 'cursor-not-allowed opacity-80' : ''
                                    }`}
                                >
                                    {isUploadingVideo ? (
                                        <div className="flex flex-col items-center gap-4 w-full px-8">
                                            <div className="w-12 h-12 rounded-full bg-studio-primary/10 flex items-center justify-center shadow-inner">
                                                <Loader2 size={24} className="animate-spin text-studio-primary" />
                                            </div>
                                            <div className="w-full space-y-2">
                                                <div className="w-full bg-studio-outline-variant/30 rounded-full h-1.5 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${videoUploadProgress}%` }}
                                                        className="h-full bg-studio-primary shadow-[0_0_8px_rgba(47,79,79,0.3)]"
                                                    />
                                                </div>
                                                <div className="flex justify-between w-full text-[9px] font-black uppercase tracking-widest text-studio-primary">
                                                    <span>{videoUploadProgress}%</span>
                                                    {uploadStats && <span>{uploadStats.speed} · {uploadStats.eta}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-studio-outline group-hover:text-studio-primary transition-all duration-300">
                                            <div className="w-14 h-14 rounded-full bg-studio-background border border-studio-outline-variant flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-lg transition-all">
                                                <Video size={24} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-center">Deploy Video Asset</span>
                                            <span className="text-[8px] text-studio-outline/50 mt-2 text-center font-bold uppercase tracking-widest">MP4 / WEBM / MOV • MAX 100MB</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* AI Engine */}
                        <div className="bg-studio-primary p-6 rounded-2xl border-l-[6px] border-studio-secondary shadow-lg relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4 text-white">
                                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-studio-secondary">
                                        <Brain size={20} />
                                    </div>
                                    <h2 className="font-serif text-lg font-bold">Editorial AI</h2>
                                </div>
                                <p className="text-white/70 text-xs mb-6 leading-relaxed">Let our predictive engine help you sharpen your political analysis and reach.</p>
                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        { label: "Suggest Strategic Tags", icon: Sparkles, id: "strategic tags" },
                                        { label: "Optimize Headline Reach", icon: Wand2, id: "headline" },
                                        { label: "Semantic Integrity Check", icon: SpellCheck, id: "integrity" }
                                    ].map(item => (
                                        <button 
                                            key={item.label} 
                                            disabled={!!aiProcessing}
                                            onClick={() => runAiAction(item.id)}
                                            className="flex items-center justify-between w-full p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all group/btn disabled:opacity-50"
                                        >
                                            <span className="flex items-center gap-2">
                                                {aiProcessing === item.id && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Sparkles size={14} /></motion.div>}
                                                {item.label}
                                            </span>
                                            <item.icon size={14} className="opacity-0 group-hover/btn:opacity-100 transition-opacity text-studio-secondary" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-studio-secondary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        </div>
                    </aside>
                </div>
            </main>

            {/* Bottom Bar */}
            <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-studio-outline-variant shadow-lg">
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-8 text-studio-outline">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-studio-primary"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Quantified Intake:</span>
                            <span className="font-mono text-sm text-studio-primary font-bold">{wordCount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-studio-secondary"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Est. Engagement:</span>
                            <span className="font-mono text-sm text-studio-primary font-bold">{readingTime} min read</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button 
                            onClick={() => handlePublish('draft')}
                            disabled={isSaving || isSubmitting}
                            className="flex-1 md:flex-none px-8 py-3 font-semibold text-xs tracking-widest uppercase border border-studio-outline hover:bg-studio-background transition-all text-studio-primary disabled:opacity-50"
                        >
                            {isSaving ? (
                                <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Saving...</span>
                            ) : saveStatus === "saved" ? (
                                <span className="flex items-center gap-2"><Check size={14} /> Saved</span>
                            ) : (
                                <span className="flex items-center gap-2"><Save size={14} /> Save Draft</span>
                            )}
                        </button>
                        <button 
                            onClick={() => handlePublish('pending')}
                            disabled={isSaving || isSubmitting}
                            className="flex-1 md:flex-none px-10 py-3 font-semibold text-xs tracking-widest uppercase bg-studio-primary text-white hover:bg-studio-primary/90 transition-all flex items-center justify-center gap-3 shadow-lg hover:translate-y-[-2px] active:translate-y-0 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <Loader2 size={14} className="animate-spin text-studio-secondary" />
                            ) : (
                                <>
                                  Submit for Certification
                                  <SendIcon size={14} className="text-studio-secondary" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default WriterStudio;
