import React, { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, RefreshCw, ChevronRight } from 'lucide-react';
import ArticleCard from '../components/ArticleCard';
import Sidebar from '../components/Sidebar';
import { NewsService } from '../services/newsService';
import { Article } from '../types';
import SEO from '../components/SEO';

interface NewsCategoryProps {
  title: string;
  topic: string; // The topic to pass to the AI (Politics, Media, General)
  description: string;
}

const NewsCategory: React.FC<NewsCategoryProps> = ({ title, topic, description }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await NewsService.getLatestNews(topic);
      setArticles(data);
    } catch (err: any) {
      console.error("Failed to load category news", err);
      setError("Failed to load news. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNews();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  // Determine OG Image based on topic
  const getOgImage = () => {
    switch (topic.toLowerCase()) {
      case 'politics':
        return 'https://images.unsplash.com/photo-1555848962-6e79363ec58f?q=80&w=1200&h=630&auto=format&fit=crop';
      case 'media':
        return 'https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=1200&h=630&auto=format&fit=crop';
      default:
        return 'https://images.unsplash.com/photo-1504465039710-0f49c0a47eb7?q=80&w=1200&h=630&auto=format&fit=crop';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-kph-light flex flex-col items-center justify-center">
        <SEO title={`${title} | KPH News`} description={description} />
        <Loader2 className="w-12 h-12 text-kph-red animate-spin mb-4" />
        <p className="text-kph-charcoal font-bold animate-pulse text-lg">Curating {title}...</p>
        <p className="text-gray-400 text-sm mt-2">Connecting to live feed</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-kph-light flex items-center justify-center p-4">
        <SEO title={`Error - ${title} | KPH News`} description="Failed to load content." />
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-kph-red" />
          </div>
          <h2 className="text-xl font-bold text-kph-charcoal mb-2">Unable to Load News</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={fetchNews}
            className="flex items-center justify-center gap-2 w-full bg-kph-red text-white font-bold py-3 rounded-lg hover:bg-red-900 transition-colors"
          >
            <RefreshCw size={18} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const featured = articles[0];
  const gridArticles = articles.slice(1);

  return (
    <div className="bg-kph-light min-h-screen pb-16 animate-fade-in">
      <SEO
        title={`${title} | KPH News`}
        description={description}
        image={getOgImage()}
        imageAlt={`${title} Updates`}
      />

      {/* Category Hero */}
      <div className="bg-kph-charcoal text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/10 to-transparent skew-x-12"></div>

        <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16 relative z-10">
          <div className="max-w-3xl">
            <span className="text-kph-red font-bold uppercase tracking-widest text-[10px] mb-2 block animate-slide-down">Category</span>
            <h1 className="text-3xl lg:text-4xl font-bold mb-4 font-serif animate-slide-up">{title}</h1>
            <p className="text-lg text-gray-300 leading-relaxed animate-slide-up" style={{ animationDelay: '100ms' }}>
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Content */}
          <div className="lg:col-span-8 space-y-10">

            {/* Featured in Category */}
            {featured && (
              <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-lg border border-gray-100 animate-slide-up">
                <div className="relative h-64 lg:h-80 rounded-xl overflow-hidden mb-5 group cursor-pointer">
                  <img
                    src={featured.imageUrl}
                    alt={featured.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute bottom-5 left-5 text-white">
                    <span className="bg-kph-red px-2 py-0.5 text-[10px] font-bold uppercase rounded mb-2 inline-block">Top Story</span>
                    <h2 className="text-xl lg:text-2xl font-bold leading-tight group-hover:underline decoration-kph-red decoration-2 underline-offset-4">{featured.title}</h2>
                  </div>
                </div>
                <p className="text-gray-600 text-base mb-5 leading-relaxed">{featured.excerpt}</p>
                <div className="flex items-center justify-between border-t border-gray-100 pt-5">
                  <div className="flex items-center space-x-3 text-xs text-gray-400">
                    <span className="font-bold text-kph-charcoal">{featured.author}</span>
                    <span>{featured.date}</span>
                  </div>
                  <a href={`#/article/${featured.id}`} className="text-kph-red text-sm font-bold flex items-center hover:text-red-900 transition-colors">
                    Read Full Story <ChevronRight size={14} className="ml-1" />
                  </a>
                </div>
              </div>
            )}

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {gridArticles.map((article, idx) => (
                <ArticleCard key={article.id} article={article} delay={idx * 100} />
              ))}
            </div>

            {gridArticles.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <p className="text-gray-500 font-medium">No additional articles found in this category at the moment.</p>
              </div>
            )}

          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <Sidebar />
          </div>

        </div>
      </div>

    </div>
  );
};

export default NewsCategory;