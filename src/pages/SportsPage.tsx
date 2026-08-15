import React, { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, RefreshCw, Trophy } from 'lucide-react';
import { NewsService } from '../services/newsService';
import { Article } from '../types';
import SEO from '../components/SEO';
import { Link } from 'react-router-dom';
import { ArticleMedia } from '../components/ArticleCard';
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

  const featured = articles[0];
  const feed = articles.slice(1);

  return (
    <div className="bg-zinc-50 min-h-screen pb-24 font-sans selection:bg-kph-red/10 selection:text-kph-red">
      <SEO
        title="Live Sports | KPH News"
        description="The latest live sports updates and news."
      />

      {/* Dynamic Header */}
      <div className="bg-white px-4 py-6 border-b border-zinc-100 sticky top-0 z-40 bg-white/95 backdrop-blur-xl select-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-kph-red">
            <Trophy size={20} className="fill-kph-red/20" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 font-serif leading-none">Live Sports</h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mt-1">Real-Time Global Coverage</p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* Featured Story */}
          {featured && (
            <section className="px-4 py-4">
              <Link to={`/sports/article/${featured.id}`} className="block relative rounded-[2rem] overflow-hidden shadow-2xl border border-zinc-100 aspect-[4/5] bg-black active:scale-[0.98] transition-transform group">
                <ArticleMedia article={featured} className="w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
                
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-red-500 text-white px-2.5 py-1 rounded-full shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  <span className="text-[9px] font-bold uppercase tracking-widest">Live</span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight font-serif drop-shadow-lg mb-3">
                    {featured.title}
                  </h2>
                  <p className="text-zinc-200 text-sm line-clamp-2 mb-4 font-medium leading-relaxed">
                    {featured.excerpt}
                  </p>
                  <div className="text-zinc-300 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <Trophy size={12} className="text-kph-red" />
                      {featured.sourceName}
                    </span>
                    <span>•</span>
                    <span>{new Date(featured.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {/* Vertical Feed */}
          <section className="px-4 mt-2">
            <h3 className="font-black text-lg text-zinc-900 mb-4 px-1 select-none font-serif">Latest Updates</h3>
            <div className="flex flex-col gap-4">
              {feed.map(article => (
                <Link key={article.id} to={`/sports/article/${article.id}`} className="flex gap-4 p-3.5 rounded-[1.5rem] bg-white border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] active:scale-[0.98] transition-all hover:shadow-[0_4px_25px_rgba(0,0,0,0.06)] group">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl overflow-hidden bg-zinc-100 shadow-inner relative">
                    <ArticleMedia article={article} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <span className="text-[9px] font-bold tracking-widest text-kph-red uppercase mb-1.5 block flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-kph-red animate-pulse"></span>
                        {article.sourceName}
                      </span>
                      <h4 className="text-[14px] sm:text-[15px] font-bold text-zinc-900 leading-snug line-clamp-3 font-serif">
                        {article.title}
                      </h4>
                    </div>
                    <div className="text-[10px] font-bold text-zinc-400 mt-3 uppercase tracking-wider">
                      {new Date(article.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SportsPage;
