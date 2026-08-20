import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Search } from 'lucide-react';
import { NewsService } from '../services/newsService';
import { Article } from '../types';
import Logo from '../components/Logo';
import { motion, AnimatePresence } from 'motion/react';
import { useProfile } from '../hooks/useProfile';

import ArticleCard from '../components/ArticleCard';

const MobileHome: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const { initial } = useProfile();

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      const data = await NewsService.getLatestNews();
      setArticles(data);
      setLoading(false);
    };
    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  const topNews = articles.slice(0, 5);
  const verticalNews = articles.slice(5);

  return (
    <div className="bg-zinc-100 min-h-screen pb-24 font-sans selection:bg-kph-red/10 selection:text-kph-red">
      {/* Top Bar mimicking Nextdoor */}
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 flex items-center justify-between px-3 py-2.5 select-none gap-3">
        <div className="flex items-center">
          <Logo className="scale-[0.75] origin-left -ml-1" />
        </div>
        
        {/* Search Bar replacing Notification Bell */}
        <div className="flex-1 max-w-md">
          <div className="bg-zinc-100 rounded-full flex items-center px-3 py-1.5 border border-zinc-200/50">
            <Search size={16} className="text-zinc-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Search local news..." 
              className="bg-transparent border-none outline-none text-[13px] w-full ml-2 text-zinc-700 placeholder:text-zinc-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="text-zinc-600 p-1"><svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg></button>
          <Link to="/profile" className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm shrink-0 hover:bg-slate-300 transition-colors">
            {initial}
          </Link>
        </div>
      </header>

      {/* Main Feed Container */}
      <main className="max-w-xl mx-auto w-full pt-4 px-2 sm:px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-2">
          <h1 className="text-[22px] font-bold text-zinc-900 tracking-tight">Today's local news</h1>
          <button className="px-4 py-1.5 rounded-full bg-white border border-zinc-200 text-sm font-bold text-zinc-700 shadow-sm active:scale-95 transition-transform">
            See more
          </button>
        </div>

        {/* Horizontal Feed for Top News */}
        <AnimatePresence mode="wait">
          <motion.div 
            key="feed-horizontal"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-2 px-2 gap-4"
          >
            {topNews.map((article, index) => (
              <div key={article.id} className="snap-center shrink-0 w-[88vw] max-w-[340px] h-full flex flex-col">
                <ArticleCard article={article} variant="feed" delay={index * 50} />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Vertical Feed for the rest */}
        {verticalNews.length > 0 && (
          <div className="mt-2 flex flex-col px-2">
            <h2 className="text-lg font-bold text-zinc-900 mb-4 tracking-tight">More Stories</h2>
            <div className="flex flex-col gap-4 pb-8">
              {verticalNews.map((article, index) => (
                <ArticleCard key={article.id} article={article} variant="feed" delay={index * 50} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-2xl shadow-sm border border-zinc-100 mt-2 w-full">
            <p className="text-zinc-500 font-medium">No stories found.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default MobileHome;
