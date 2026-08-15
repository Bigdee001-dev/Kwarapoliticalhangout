import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { NewsService } from '../services/newsService';
import { Article } from '../types';
import Logo from '../components/Logo';
import { ArticleMedia } from '../components/ArticleCard';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = ['For You', 'Politics', 'Economy', 'Governance', 'Sports', 'Opinion'];

const MobileHome: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('For You');

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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-kph-red" />
      </div>
    );
  }

  const displayedArticles = activeCategory === 'For You' 
    ? articles 
    : articles.filter(a => a.category.toLowerCase() === activeCategory.toLowerCase());

  // Use the first article as featured, and the rest for the feed
  const featuredArticle = displayedArticles[0];
  const feedArticles = displayedArticles.slice(1);

  return (
    <div className="bg-white min-h-screen pb-24 font-sans selection:bg-kph-red/10 selection:text-kph-red">
      {/* Minimal Top Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-zinc-100 flex items-center justify-between px-4 py-3 select-none">
        <Logo className="scale-[0.85] origin-left" />
        <Link to="/search" className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 active:scale-95 transition-transform">
          <Search size={20} />
        </Link>
      </header>

      {/* Swipeable Category Tabs */}
      <div className="overflow-x-auto scrollbar-hide py-3 border-b border-zinc-50 bg-white select-none">
        <div className="flex px-4 gap-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                activeCategory === cat 
                  ? 'bg-kph-charcoal text-white' 
                  : 'bg-zinc-100 text-zinc-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Story & Feed with Animation */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeCategory}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {/* Featured Story */}
          {featuredArticle && (
            <section className="px-4 py-4">
              <Link to={`/article/${featuredArticle.id}`} className="block relative rounded-3xl overflow-hidden shadow-xl border border-zinc-100 aspect-[4/5] bg-black active:scale-[0.98] transition-transform">
                <ArticleMedia article={featuredArticle} className="w-full h-full object-cover opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <span className="inline-block font-black text-[10px] tracking-widest text-white bg-kph-red px-3 py-1.5 rounded-lg uppercase shadow-lg mb-3">
                    {featuredArticle.category}
                  </span>
                  <h2 className="text-2xl font-black text-white leading-tight font-serif drop-shadow-lg mb-2">
                    {featuredArticle.title}
                  </h2>
                  <div className="text-zinc-300 text-xs font-bold flex items-center gap-2">
                    <span>{featuredArticle.author}</span>
                    <span>•</span>
                    <span>{new Date(featuredArticle.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {/* Vertical Feed */}
          {feedArticles.length > 0 && (
            <section className="px-4 mt-2">
              <h3 className="font-black text-lg text-zinc-900 mb-4 px-1 select-none">Top Stories</h3>
              <div className="flex flex-col gap-4">
                {feedArticles.map(article => (
                  <Link key={article.id} to={`/article/${article.id}`} className="flex gap-4 p-3 rounded-2xl bg-white border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] active:scale-[0.98] transition-transform">
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <span className="text-[9px] font-bold tracking-widest text-kph-red uppercase mb-1 block">
                          {article.category}
                        </span>
                        <h4 className="text-[15px] font-bold text-zinc-900 leading-snug line-clamp-3">
                          {article.title}
                        </h4>
                      </div>
                      <div className="text-[10px] font-medium text-zinc-400 mt-2">
                        {new Date(article.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-zinc-100 shadow-sm">
                      <ArticleMedia article={article} className="w-full h-full object-cover" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Empty State for Category */}
          {!featuredArticle && feedArticles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <p className="text-zinc-500 font-medium">No stories found in this category.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default MobileHome;
