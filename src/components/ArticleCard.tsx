import React, { useState, useEffect } from 'react';
import { Calendar, User, Clock, ArrowRight, Video, Play, Heart, MessageCircle, Share, MoreHorizontal, Sparkles, Bookmark } from 'lucide-react';
import { Article } from '../types';
import { Link } from 'react-router-dom';

interface ArticleCardProps {
  article: Article;
  variant?: 'grid' | 'list' | 'compact' | 'feed';
  delay?: number;
  darkMode?: boolean;
}

export const ArticleMedia: React.FC<{ article: Article; className: string }> = ({ article, className }) => {
  const isYouTube = article.videoUrl?.includes('youtube.com') || article.videoUrl?.includes('youtu.be');
  const hasImageUrl = article.imageUrl && article.imageUrl.trim() !== '';

  if (hasImageUrl) {
    return <img src={article.imageUrl} alt={article.title} className={className} />;
  }

  if (isYouTube) {
    const match = article.videoUrl?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#&?]{11})/);
    if (match) {
      return <img src={`https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`} alt={article.title} className={className} />;
    }
  }

  if (article.videoUrl) {
    return (
      <video
        src={article.videoUrl}
        autoPlay
        loop
        muted
        playsInline
        className={className}
      />
    );
  }

  return (
    <img
      src="https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=60"
      alt={article.title}
      className={className}
    />
  );
};

const ArticleCard: React.FC<ArticleCardProps> = ({ article, variant = 'grid', delay = 0, darkMode = false }) => {
  const hasVideo = !!article.videoUrl;
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedArticles') || '[]');
    setIsSaved(saved.some((a: any) => a.id === article.id));
  }, [article.id]);

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let saved = JSON.parse(localStorage.getItem('savedArticles') || '[]');
    if (isSaved) {
      saved = saved.filter((a: any) => a.id !== article.id);
    } else {
      saved.push(article);
    }
    localStorage.setItem('savedArticles', JSON.stringify(saved));
    setIsSaved(!isSaved);
  };

  if (variant === 'feed') {
    return (
      <div 
        className={`flex-1 flex flex-col bg-white rounded-3xl shadow-sm hover:shadow-xl transition-shadow duration-300 border border-zinc-100 overflow-hidden w-full max-w-full h-full`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-kph-red text-white flex items-center justify-center font-bold text-lg overflow-hidden relative shadow-sm">
               {article.author.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[15px] text-zinc-900 leading-none mb-1 flex items-center gap-1">
                {article.author}
                <svg className="w-[14px] h-[14px] text-blue-500 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              </span>
              <span className="text-[13px] text-zinc-500 leading-none">
                Local publisher &middot; {article.date}
              </span>
            </div>
          </div>
          <button className="text-zinc-400 p-2 hover:bg-zinc-50 rounded-full">
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Title */}
        <Link to={`/article/${article.id}`} className="px-4 pb-3 block">
          <h3 className="text-[19px] sm:text-[22px] font-bold text-zinc-900 leading-[1.3] font-sans">
            {article.title}
          </h3>
        </Link>

        {/* Image */}
        <Link to={`/article/${article.id}`} className="block w-full relative bg-zinc-100 aspect-video sm:aspect-[16/10] overflow-hidden group">
           <ArticleMedia article={article} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
           {hasVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <div className="w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center">
                <Play size={20} className="text-kph-red ml-1" />
              </div>
            </div>
           )}
           <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-zinc-700 shadow border border-zinc-200/50 uppercase tracking-widest">
             {article.category}
           </div>
        </Link>



        {/* Action Bar */}
        <div className="px-4 py-3 border-t border-zinc-50 flex items-center justify-between mt-auto">
           <div className="flex items-center gap-2">
             <button className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-50 hover:bg-zinc-100 text-zinc-600 transition-colors border border-zinc-100">
               <Heart size={18} />
               <span className="text-[13px] font-bold">2</span>
             </button>
             <button className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-50 hover:bg-zinc-100 text-zinc-600 transition-colors border border-zinc-100">
               <MessageCircle size={18} />
               <span className="text-[13px] font-bold">1</span>
             </button>
           </div>
           
           <div className="flex items-center gap-2">
             <button 
               onClick={toggleSave}
               className={`p-2 rounded-full transition-colors border flex items-center justify-center ${isSaved ? 'bg-kph-red/10 border-kph-red/20 text-kph-red' : 'bg-zinc-50 border-zinc-100 text-zinc-600 hover:bg-zinc-100'}`}
             >
               <Bookmark size={18} className={isSaved ? "fill-current" : ""} />
             </button>
             <button className="p-2 rounded-full bg-zinc-50 hover:bg-zinc-100 text-zinc-600 transition-colors border border-zinc-100 flex items-center justify-center">
               <Share size={18} />
             </button>
             <button className="p-2 rounded-full bg-zinc-50 hover:bg-zinc-100 text-zinc-600 transition-colors border border-zinc-100">
               <MoreHorizontal size={18} />
             </button>
           </div>
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div
        className={`flex flex-col sm:flex-row gap-4 border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group animate-slide-up w-full max-w-full ${darkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-zinc-100'
          }`}
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="w-full sm:w-1/3 aspect-[16/9] sm:aspect-auto overflow-hidden relative shrink-0">
          <ArticleMedia
            article={article}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300"></div>

          {hasVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-kph-red/90 backdrop-blur-sm text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Play size={20} fill="white" className="ml-0.5" />
              </div>
            </div>
          )}

          {hasVideo && (
            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-white/10">
              <Video size={10} />
              Video
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col justify-center flex-1 min-w-0">
          <span className="text-kph-red text-[9px] font-bold uppercase tracking-widest mb-1.5 flex items-center">
            {article.category}
          </span>
          <Link to={`/article/${article.id}`}>
            <h3 className={`text-sm sm:text-base md:text-lg font-bold hover:text-kph-red transition-colors mb-2 leading-tight break-words ${darkMode ? 'text-white' : 'text-zinc-800'
              }`}>
              {article.title}
            </h3>
          </Link>
          <p className={`text-[10px] sm:text-xs mb-3 line-clamp-2 leading-relaxed break-words ${darkMode ? 'text-gray-400' : 'text-zinc-500'
            }`}>
            {article.excerpt}
          </p>
          <div className={`flex flex-wrap items-center text-[8px] sm:text-[9px] font-bold uppercase tracking-wider gap-3 mt-auto ${darkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
            <span className="flex items-center truncate max-w-[100px]"><User size={10} className="mr-1 shrink-0" /> {article.author}</span>
            <span className="flex items-center"><Calendar size={10} className="mr-1 shrink-0" /> {article.date}</span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex space-x-3 items-start py-2.5 border-b last:border-0 group transition-colors duration-200 w-full max-w-full ${darkMode
        ? 'border-gray-700 hover:bg-white/5'
        : 'border-zinc-50 hover:bg-zinc-50'
        }`}>
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 relative border border-zinc-100 bg-black/5">
          <ArticleMedia article={article} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          {hasVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <Play size={12} fill="white" className="text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Link to={`/article/${article.id}`}>
            <h4 className={`text-[10px] sm:text-[11px] font-bold group-hover:text-kph-red transition-colors line-clamp-2 leading-snug mb-1 break-words ${darkMode ? 'text-white' : 'text-zinc-800'
              }`}>
              {hasVideo && <Video size={10} className="inline mr-1 text-kph-red" />}
              {article.title}
            </h4>
          </Link>
          <div className="flex items-center justify-between">
            <span className="text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase">{article.date}</span>
            <ArrowRight size={10} className="text-kph-red opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-300" />
          </div>
        </div>
      </div>
    );
  }

  // Default Grid Variant
  return (
    <div
      className={`border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-500 group h-full flex flex-col hover:-translate-y-1 animate-slide-up w-full max-w-full ${darkMode
        ? 'bg-gray-800 border-gray-700 hover:shadow-black/50'
        : 'bg-white border-zinc-100 hover:shadow-red-50/20'
        }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative h-36 sm:h-40 overflow-hidden shrink-0">
        <ArticleMedia
          article={article}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-300"></div>

        {hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center transform scale-90 group-hover:scale-100 group-hover:bg-kph-red transition-all duration-500">
              <Play size={16} fill="currentColor" className="text-white ml-0.5" />
            </div>
          </div>
        )}

        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className={`text-[7px] sm:text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-widest rounded shadow-sm ${darkMode
            ? 'bg-gray-900/90 text-white border-gray-700'
            : 'bg-white/90 text-[#8B0000] border-zinc-100'
            } backdrop-blur-md border`}>
            {article.category}
          </span>
          {hasVideo && (
            <span className="bg-kph-red text-white text-[7px] sm:text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
              <Video size={10} />
              Video
            </span>
          )}
        </div>
      </div>

      <div className={`p-3 sm:p-4 flex flex-col flex-1 relative z-10 min-w-0 ${darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
        <div className="mb-2 flex flex-wrap items-center text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-widest gap-2">
          <span className="text-kph-red">{article.date}</span>
          <span className="w-1 h-1 bg-gray-200 rounded-full shrink-0"></span>
          <span>{article.readTime}</span>
        </div>

        <Link to={`/article/${article.id}`} className="group/title block">
          <h3 className={`text-sm sm:text-base font-bold mb-2 leading-tight group-hover/title:text-kph-red transition-colors duration-300 line-clamp-2 break-words ${darkMode ? 'text-white' : 'text-zinc-800'
            }`}>
            {article.title}
          </h3>
        </Link>

        <p className={`text-[10px] sm:text-[11px] mb-4 line-clamp-2 flex-1 leading-relaxed break-words ${darkMode ? 'text-gray-400' : 'text-zinc-500'
          }`}>
          {article.excerpt}
        </p>

        <div className={`flex items-center justify-between pt-3 mt-auto border-t ${darkMode ? 'border-gray-700' : 'border-zinc-50'
          }`}>
          <div className="flex items-center space-x-2 min-w-0">
            <div className={`w-4 h-4 sm:w-5 h-5 rounded-full flex items-center justify-center text-[7px] sm:text-[9px] font-bold uppercase shrink-0 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-zinc-100 text-zinc-500'
              }`}>
              {article.author.charAt(0)}
            </div>
            <span className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-tighter truncate">{article.author}</span>
          </div>

          <span className="flex items-center text-[8px] sm:text-[9px] font-bold text-kph-red opacity-0 group-hover:opacity-100 transform translate-x-[-4px] group-hover:translate-x-0 transition-all duration-300 uppercase tracking-widest shrink-0">
            Read <ArrowRight size={10} className="ml-1" />
          </span>
        </div>
      </div>
    </div>
  );
};
export default ArticleCard;