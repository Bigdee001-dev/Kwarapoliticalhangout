import React, { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, RefreshCw, Trophy } from 'lucide-react';
import { NewsService } from '../services/newsService';
import { Article } from '../types';
import SEO from '../components/SEO';
import { Link } from 'react-router-dom';
import ArticleCard, { ArticleMedia } from '../components/ArticleCard';
import { motion, AnimatePresence } from 'motion/react';

const SportsPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await NewsService.fetchLiveSportsNews();
      if (data.length === 0) {
        throw new Error("No sports news found right now.");
      }
      setArticles(data);
    } catch (err: any) {
      console.error("Failed to load sports news", err);
      setError("Failed to fetch live sports data. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-100px)] bg-zinc-50 flex flex-col items-center justify-center pb-24">
        <SEO title="Live Sports | KPH News" description="The latest live sports updates and news." />
        <Loader2 className="w-10 h-10 text-kph-red animate-spin mb-4" />
        <p className="text-zinc-500 font-bold animate-pulse text-sm">Fetching Live Sports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-100px)] bg-zinc-50 flex items-center justify-center p-4 pb-24">
        <SEO title="Error - Sports | KPH News" description="Failed to load content." />
        <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] max-w-sm w-full text-center border border-zinc-100">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-kph-red" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2 font-serif">Connection Failed</h2>
          <p className="text-zinc-500 text-sm mb-8">{error}</p>
          <button
            onClick={fetchNews}
            className="flex items-center justify-center gap-2 w-full bg-zinc-900 text-white font-bold py-3.5 rounded-xl hover:bg-kph-red transition-all active:scale-95 text-sm uppercase tracking-wider"
          >
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  const topNews = articles.slice(0, 5);
  const verticalNews = articles.slice(5);

  return (
    <div className="bg-zinc-100 min-h-screen pb-24 font-sans selection:bg-kph-red/10 selection:text-kph-red">
      <SEO
        title="Live Sports | KPH News"
        description="The latest live sports updates and news."
      />

      {/* Dynamic Header */}
      <div className="bg-white px-4 py-4 border-b border-zinc-200 sticky top-0 z-40 bg-white/95 backdrop-blur-xl select-none flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-kph-red">
            <Trophy size={20} className="fill-kph-red/20" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight leading-none">Live Sports</h1>
            <p className="text-[11px] text-zinc-500 font-medium mt-1">Real-Time Global Coverage</p>
          </div>
        </div>
      </div>

      <main className="max-w-xl mx-auto w-full pt-4 px-2 sm:px-4">
        {/* Horizontal Feed for Top News */}
        <AnimatePresence mode="wait">
          <motion.div 
            key="feed-horizontal-sports"
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
            <h2 className="text-lg font-bold text-zinc-900 mb-4 tracking-tight">More Sports Stories</h2>
            <div className="flex flex-col gap-4 pb-8">
              {verticalNews.map((article, index) => (
                <ArticleCard key={article.id} article={article} variant="feed" delay={index * 50} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SportsPage;
