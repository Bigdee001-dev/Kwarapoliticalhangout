import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Share2, Sparkles, AlertCircle, Bookmark, ThumbsUp, 
  MessageSquare, Loader2, List, ExternalLink, Send, Check, 
  ChevronLeft, MoreHorizontal, ShieldAlert, Clock, User,
  Twitter, Facebook, Linkedin, Link as LinkIcon, Eye,
  ArrowRight, Heart, UserCircle2, MessageCircle
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Logo from '../components/Logo';
import { NewsService } from '../services/newsService';
import { Article, Comment } from '../types';
import SEO from '../components/SEO';
import { toast } from 'sonner';

const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  
  const [commentText, setCommentText] = useState('');
  const [commentName, setCommentName] = useState(localStorage.getItem('kph_commenter_name') || '');
  const [comments, setComments] = useState<Comment[]>([]);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setReadingProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadArticle = async () => {
      setPageLoading(true);
      if (id) {
        window.scrollTo(0, 0);
        const found = await NewsService.getArticleById(id);
        if (found) {
          setArticle(found);
          setLikes(found.likes || 0);
          
          // Check if liked in this session
          const likedInSession = sessionStorage.getItem(`liked_${id}`);
          if (likedInSession) setIsLiked(true);

          // Load comments
          const articleComments = await NewsService.getComments(id);
          setComments(articleComments);
          
          // Load related
          const all = await NewsService.getLatestNews(found.category);
          setRelatedArticles(all.filter(a => a.id !== id).slice(0, 3));
        }
      }
      setPageLoading(false);
    };
    loadArticle();
  }, [id]);

  const toggleLike = async () => {
    if (isLiked || !article) return;
    
    setIsLiked(true);
    setLikes(prev => prev + 1);
    sessionStorage.setItem(`liked_${article.id}`, 'true');
    
    try {
      const newLikes = await NewsService.likeArticle(article.id, likes);
      setLikes(newLikes);
    } catch (err) {
      console.error("Like failed", err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: article?.title,
                text: article?.excerpt,
                url: window.location.href,
            });
        } catch (err) {
            console.log('Share canceled');
        }
    } else {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article || !commentText.trim() || !commentName.trim()) {
      toast.error("Please provide both name and comment.");
      return;
    }

    setSubmittingComment(true);
    try {
      const newComment = await NewsService.addComment(article.id, commentName, commentText);
      if (newComment) {
        setComments([newComment, ...comments]);
        setCommentText('');
        localStorage.setItem('kph_commenter_name', commentName);
        toast.success("Comment posted successfully!");
      }
    } catch (err) {
      toast.error("Failed to post comment. Please try again.");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
         <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
         >
           <Loader2 className="w-10 h-10 text-kph-red" />
         </motion.div>
         <motion.p 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-400"
         >
           Loading Article
         </motion.p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle size={48} className="text-zinc-300 mb-6" />
        <h2 className="text-3xl font-bold text-zinc-900 mb-4 font-serif">Story Unavailable</h2>
        <p className="text-zinc-500 mb-8 max-w-md font-medium">The requested report could not be found in our current archives.</p>
        <Link to="/" className="bg-kph-red text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-900 transition-all shadow-lg active:scale-95">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen font-sans text-zinc-900 selection:bg-kph-red/10 selection:text-kph-red pb-32 relative overflow-x-hidden w-full">
        <SEO 
          title={`${article.title} | KPH News`} 
          description={article.excerpt}
          image={article.imageUrl}
          imageAlt={article.title}
          type="article"
          author={article.author}
          date={article.date}
          category={article.category}
        />

        {/* Reading Progress Bar Container */}
        <div className="fixed top-0 left-0 w-full h-[3px] z-[101] pointer-events-none">
           <motion.div 
             className="h-full bg-kph-red shadow-[0_0_10px_rgba(139,0,0,0.4)]" 
             style={{ width: `${readingProgress}%` }}
           />
        </div>
        
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-100 h-14 flex items-center px-4 md:px-8 transition-all duration-300 w-full overflow-hidden">
            <div className="max-w-7xl mx-auto w-full flex justify-between items-center gap-4">
                <div className="flex items-center gap-4 md:gap-8 shrink-0">
                    <Link to="/" className="scale-75 md:scale-90 transform-gpu origin-left">
                        <Logo />
                    </Link>
                    <nav className="hidden lg:flex items-center gap-6">
                        {['POLITICS', 'ECONOMY', 'GOVERNANCE'].map(cat => (
                            <Link 
                                key={cat} 
                                to={`/news?category=${cat}`} 
                                className={`text-[10px] font-bold tracking-widest uppercase transition-colors hover:text-kph-red ${cat === article.category.toUpperCase() ? 'text-kph-red' : 'text-zinc-500'}`}
                            >
                                {cat}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center gap-2 md:gap-4 text-zinc-400 shrink-0">
                    <button onClick={handleShare} className="p-1.5 md:p-2 hover:text-kph-red transition-colors active:scale-90"><Share2 size={18} /></button>
                    <button className="p-1.5 md:p-2 hover:text-kph-red transition-colors active:scale-90"><Bookmark size={18} /></button>
                    <div className="h-4 w-[1px] bg-zinc-200 mx-0.5 md:mx-1"></div>
                    <Link to="/news" className="bg-zinc-900 text-white px-3 md:px-4 py-1.5 rounded-lg text-[8px] md:text-[9px] font-bold uppercase tracking-widest hover:bg-kph-red transition-all whitespace-nowrap">LATEST</Link>
                </div>
            </div>
        </header>

        {/* Hero Section */}
        <section className="relative w-full h-[40vh] sm:h-[45vh] lg:h-[60vh] bg-zinc-900 overflow-hidden">
            <motion.img 
                initial={{ scale: 1.05, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.9 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                src={article.imageUrl} 
                alt={article.title} 
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
            
            <div className="absolute inset-0 flex items-end">
                <div className="container mx-auto px-4 md:px-12 pb-8 lg:pb-16 max-w-5xl">
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="w-full"
                    >
                        <div className="inline-block px-3 py-1 bg-kph-red text-white mb-4 sm:mb-6 rounded text-[8px] sm:text-[9px] font-bold uppercase tracking-widest">
                           {article.category}
                        </div>
                        <h1 className="font-serif text-xl sm:text-3xl md:text-5xl lg:text-6xl text-white leading-tight mb-6 sm:mb-8 font-bold tracking-tight break-words overflow-hidden">
                           {article.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-white/80">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 sm:w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center font-bold text-xs sm:text-sm text-white">
                                 {article.author.charAt(0)}
                              </div>
                              <div>
                                 <p className="text-[9px] sm:text-[10px] font-medium text-white/60 mb-0.5">By</p>
                                 <p className="text-xs sm:text-sm font-bold text-white whitespace-nowrap">{article.author}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-4 sm:gap-6 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white/60">
                              <span className="flex items-center gap-1.5"><Calendar size={12} className="text-kph-red shrink-0" /> {new Date(article.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                              <span className="flex items-center gap-1.5"><Clock size={12} className="text-kph-red shrink-0" /> {article.readTime}</span>
                           </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>

        <div className="container mx-auto px-4 md:px-12 max-w-7xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
                {/* Main Content Column */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="lg:col-span-8 py-8 lg:py-16 w-full max-w-full overflow-hidden"
                >
                    {/* Abstract */}
                    <div className="mb-10 border-l-3 border-kph-red pl-4 sm:pl-8 py-1">
                        <p className="font-serif text-base sm:text-lg md:text-xl text-zinc-700 leading-relaxed italic font-medium break-words whitespace-normal">
                           {article.excerpt}
                        </p>
                    </div>

                    {/* Article Content */}
                    <article className="text-sm sm:text-base md:text-lg text-zinc-800 space-y-6 sm:space-y-8 leading-relaxed sm:leading-[1.75] font-normal w-full max-w-full overflow-hidden">
                        <div 
                            className="prose prose-zinc prose-sm sm:prose-base md:prose-lg max-w-full overflow-hidden break-words whitespace-normal prose-p:mb-6 prose-headings:font-serif prose-headings:font-bold prose-headings:text-zinc-900 prose-a:text-kph-red prose-blockquote:border-l-kph-red prose-blockquote:font-serif prose-blockquote:italic prose-blockquote:bg-zinc-50 prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:rounded-lg prose-img:max-w-full prose-img:h-auto prose-img:rounded-xl" 
                            dangerouslySetInnerHTML={{ __html: article.content || '<p className="text-zinc-400 italic">Decoding report...</p>' }} 
                        />

                        {/* Pull Quote */}
                        <div className="my-12 sm:my-16 px-6 sm:px-8 py-8 sm:py-10 bg-zinc-50 rounded-2xl border border-zinc-100 relative overflow-hidden text-center">
                            <Sparkles className="text-kph-red/10 absolute -top-4 -left-4" size={64} />
                            <blockquote className="font-serif text-lg sm:text-2xl md:text-3xl italic font-bold leading-snug tracking-tight text-zinc-800 relative z-10 break-words">
                                "Our mission is to bring transparency to the corridors of power, ensuring every Kwaran is informed and empowered."
                            </blockquote>
                            <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-400 mt-6 relative z-10">KPH Editorial Directive</p>
                        </div>
                    </article>

                    {/* Engagement */}
                    <div className="mt-12 sm:mt-16 pt-8 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-6 sm:gap-8 w-full">
                        <div className="flex items-center gap-6 sm:gap-8">
                            <button 
                                onClick={toggleLike}
                                disabled={isLiked}
                                className={`flex items-center gap-3 transition-all transform active:scale-95 ${isLiked ? 'text-kph-red' : 'text-zinc-400 hover:text-zinc-900'}`}
                            >
                                <div className={`w-10 h-10 sm:w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${isLiked ? 'bg-kph-red border-kph-red text-white shadow-lg' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}>
                                   <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                                </div>
                                <span className="text-base sm:text-lg font-bold">{likes.toLocaleString()}</span>
                            </button>
                            <div className="flex items-center gap-3 text-zinc-400">
                                <div className="w-10 h-10 sm:w-11 h-11 rounded-xl flex items-center justify-center border border-zinc-200 bg-white">
                                   <MessageSquare size={18} />
                                </div>
                                <span className="text-base sm:text-lg font-bold">{comments.length}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mr-1">SHARE:</span>
                            <div className="flex gap-2">
                               {[
                                 { icon: Twitter, color: 'hover:text-black', link: `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.href)}` },
                                 { icon: Facebook, color: 'hover:text-[#1877F2]', link: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}` },
                                 { icon: MessageCircle, color: 'hover:text-[#25D366]', link: `https://wa.me/?text=${encodeURIComponent(article.title + ' ' + window.location.href)}` },
                                 { icon: Linkedin, color: 'hover:text-[#0A66C2]', link: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}` }
                               ].map((social, i) => (
                                 <a key={i} href={social.link} target="_blank" rel="noreferrer" className={`w-9 h-9 sm:w-10 h-10 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 hover:bg-zinc-50 transition-colors ${social.color}`}><social.icon size={14} /></a>
                               ))}
                               <button onClick={handleShare} className="w-9 h-9 sm:w-10 h-10 flex items-center justify-center rounded-lg bg-zinc-900 text-white hover:bg-kph-red transition-colors shadow-md"><Share2 size={14} /></button>
                            </div>
                        </div>
                    </div>

                    {/* Comments */}
                    <section id="comments" className="mt-20 sm:mt-24 w-full">
                        <div className="mb-8">
                            <h3 className="font-serif text-xl sm:text-2xl font-bold text-zinc-900 mb-2">Community Perspectives</h3>
                            <div className="h-1 w-10 bg-kph-red rounded-full"></div>
                        </div>
                        
                        <form onSubmit={handleSubmitComment} className="mb-12 sm:mb-16 bg-zinc-50 p-6 sm:p-8 rounded-2xl border border-zinc-100">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="space-y-2">
                                      <label className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Your Name</label>
                                      <input 
                                        type="text"
                                        value={commentName}
                                        onChange={(e) => setCommentName(e.target.value)}
                                        placeholder="Full Name"
                                        className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm outline-none focus:border-kph-red transition-all"
                                        required
                                      />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Comment</label>
                                    <textarea 
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Add your thoughts..."
                                        className="w-full bg-white border border-zinc-200 rounded-xl p-4 text-xs sm:text-sm outline-none focus:border-kph-red transition-all min-h-[100px] sm:min-h-[120px] resize-none"
                                        required
                                    />
                                </div>
                                
                                <div className="flex justify-end">
                                   <button 
                                      type="submit" 
                                      disabled={submittingComment}
                                      className="w-full sm:w-auto px-6 py-2.5 bg-zinc-900 text-white font-bold text-[9px] sm:text-[10px] uppercase tracking-widest rounded-lg hover:bg-kph-red transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                   >
                                       {submittingComment ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} 
                                       POST COMMENT
                                   </button>
                                </div>
                            </div>
                        </form>

                        <div className="space-y-8 sm:space-y-10">
                            <AnimatePresence>
                                {comments.length === 0 ? (
                                   <div className="text-center py-10 text-zinc-400">
                                      <p className="text-[10px] font-bold uppercase tracking-widest">No comments yet</p>
                                   </div>
                                ) : comments.map((comment, idx) => (
                                    <motion.div 
                                        key={comment.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex gap-3 sm:gap-4"
                                    >
                                        <div className="w-8 h-8 sm:w-10 h-10 rounded-full bg-zinc-100 flex-shrink-0 flex items-center justify-center text-zinc-600 font-bold text-xs sm:text-sm">
                                            {comment.author_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 space-y-2 min-w-0">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-xs sm:text-sm text-zinc-900 truncate">{comment.author_name}</span>
                                                <span className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-tighter shrink-0">{new Date(comment.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed break-words whitespace-normal">{comment.content}</p>
                                            <div className="flex gap-4 pt-1">
                                                <button className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase hover:text-kph-red transition-colors">Helpful</button>
                                                <button className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase hover:text-zinc-900 transition-colors">Reply</button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </section>
                </motion.div>

                {/* Sidebar Column */}
                <aside className="lg:col-span-4 py-8 lg:py-16 space-y-10 lg:space-y-12 w-full max-w-full overflow-hidden">
                    <div className="lg:sticky lg:top-24 space-y-10 lg:space-y-12">
                        <Sidebar />
                        
                        {/* Related Articles */}
                        <div className="space-y-6">
                            <h3 className="text-[9px] sm:text-[10px] font-bold text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-3">Related Stories</h3>
                            <div className="space-y-6">
                                {relatedArticles.map((rel, i) => (
                                    <Link to={`/article/${rel.id}`} key={i} className="group block flex gap-4 items-start w-full overflow-hidden">
                                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-100">
                                            <img 
                                                src={rel.imageUrl} 
                                                alt={rel.title} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                           <h4 className="font-serif text-xs sm:text-sm font-bold leading-tight group-hover:text-kph-red transition-colors line-clamp-2 break-words">
                                               {rel.title}
                                           </h4>
                                           <p className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase mt-2 tracking-tighter">{new Date(rel.date).toLocaleDateString()}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>

        {/* Floating Actions */}
        <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[60] flex flex-col gap-3">
            <motion.button 
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={toggleLike}
               disabled={isLiked}
               className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${isLiked ? 'bg-kph-red text-white' : 'bg-white text-zinc-400 border border-zinc-100'}`}
            >
               <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
            </motion.button>
            <motion.button 
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={handleShare}
               className="w-10 h-10 sm:w-12 sm:h-12 bg-zinc-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-kph-red transition-all"
            >
               <Share2 size={18} />
            </motion.button>
        </div>
    </div>
  );
};

export default ArticleDetail;
