import React from 'react';
import { Calendar, User, Clock, ArrowRight } from 'lucide-react';
import { Article } from '../types';
import { Link } from 'react-router-dom';

interface ArticleCardProps {
  article: Article;
  variant?: 'grid' | 'list' | 'compact';
  delay?: number;
  darkMode?: boolean;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, variant = 'grid', delay = 0, darkMode = false }) => {
  
  if (variant === 'list') {
    return (
      <div 
        className={`flex flex-col sm:flex-row gap-4 border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group animate-slide-up w-full max-w-full ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-zinc-100'
        }`}
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="w-full sm:w-1/3 h-40 sm:h-auto overflow-hidden relative shrink-0">
          <img 
            src={article.imageUrl} 
            alt={article.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300"></div>
        </div>
        <div className="p-4 flex flex-col justify-center flex-1 min-w-0">
          <span className="text-kph-red text-[9px] font-bold uppercase tracking-widest mb-1.5 flex items-center">
            {article.category}
          </span>
          <Link to={`/article/${article.id}`}>
            <h3 className={`text-sm sm:text-base md:text-lg font-bold hover:text-kph-red transition-colors mb-2 leading-tight break-words ${
              darkMode ? 'text-white' : 'text-zinc-800'
            }`}>
              {article.title}
            </h3>
          </Link>
          <p className={`text-[10px] sm:text-xs mb-3 line-clamp-2 leading-relaxed break-words ${
            darkMode ? 'text-gray-400' : 'text-zinc-500'
          }`}>
            {article.excerpt}
          </p>
          <div className={`flex flex-wrap items-center text-[8px] sm:text-[9px] font-bold uppercase tracking-wider gap-3 mt-auto ${
            darkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <span className="flex items-center truncate max-w-[100px]"><User size={10} className="mr-1 shrink-0"/> {article.author}</span>
            <span className="flex items-center"><Calendar size={10} className="mr-1 shrink-0"/> {article.date}</span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
     return (
        <div className={`flex space-x-3 items-start py-2.5 border-b last:border-0 group transition-colors duration-200 w-full max-w-full ${
           darkMode 
             ? 'border-gray-700 hover:bg-white/5' 
             : 'border-zinc-50 hover:bg-zinc-50'
        }`}>
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 relative border border-zinc-100">
             <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="flex-1 min-w-0">
            <Link to={`/article/${article.id}`}>
              <h4 className={`text-[10px] sm:text-[11px] font-bold group-hover:text-kph-red transition-colors line-clamp-2 leading-snug mb-1 break-words ${
                 darkMode ? 'text-white' : 'text-zinc-800'
              }`}>
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
      className={`border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-500 group h-full flex flex-col hover:-translate-y-1 animate-slide-up w-full max-w-full ${
         darkMode 
           ? 'bg-gray-800 border-gray-700 hover:shadow-black/50' 
           : 'bg-white border-zinc-100 hover:shadow-red-50/20'
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative h-36 sm:h-40 overflow-hidden shrink-0">
        <img 
          src={article.imageUrl} 
          alt={article.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-300"></div>
        
        <span className={`absolute top-2 left-2 text-[7px] sm:text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-widest rounded shadow-sm ${
           darkMode 
             ? 'bg-gray-900/90 text-white border-gray-700' 
             : 'bg-white/90 text-[#8B0000] border-zinc-100'
        } backdrop-blur-md border`}>
          {article.category}
        </span>
      </div>
      
      <div className={`p-3 sm:p-4 flex flex-col flex-1 relative z-10 min-w-0 ${
         darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="mb-2 flex flex-wrap items-center text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-widest gap-2">
            <span className="text-kph-red">{article.date}</span>
            <span className="w-1 h-1 bg-gray-200 rounded-full shrink-0"></span>
            <span>{article.readTime}</span>
        </div>
        
        <Link to={`/article/${article.id}`} className="group/title block">
           <h3 className={`text-sm sm:text-base font-bold mb-2 leading-tight group-hover/title:text-kph-red transition-colors duration-300 line-clamp-2 break-words ${
              darkMode ? 'text-white' : 'text-zinc-800'
           }`}>
            {article.title}
           </h3>
        </Link>
        
        <p className={`text-[10px] sm:text-[11px] mb-4 line-clamp-2 flex-1 leading-relaxed break-words ${
           darkMode ? 'text-gray-400' : 'text-zinc-500'
        }`}>
          {article.excerpt}
        </p>
        
        <div className={`flex items-center justify-between pt-3 mt-auto border-t ${
           darkMode ? 'border-gray-700' : 'border-zinc-50'
        }`}>
           <div className="flex items-center space-x-2 min-w-0">
              <div className={`w-4 h-4 sm:w-5 h-5 rounded-full flex items-center justify-center text-[7px] sm:text-[9px] font-bold uppercase shrink-0 ${
                 darkMode ? 'bg-gray-700 text-gray-300' : 'bg-zinc-100 text-zinc-500'
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