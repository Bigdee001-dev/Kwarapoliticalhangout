
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ChevronRight, Loader2, AlertTriangle, RefreshCw, Zap, X, Play, Volume2, VolumeX, Video } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ArticleCard, { ArticleMedia } from '../components/ArticleCard';
import { NewsService } from '../services/newsService';
import { AdminService, GlobalAlert, AdConfig } from '../services/adminService';
import { Article } from '../types';
import SEO from '../components/SEO';
import { toast } from 'sonner';

interface GlobalAlertBannerProps {
  alert: GlobalAlert | null;
  onClose: () => void;
}

const GlobalAlertBanner = ({ alert, onClose }: GlobalAlertBannerProps) => {
  if (!alert) return null;
  const colors = { info: 'bg-blue-600', warning: 'bg-yellow-500', critical: 'bg-red-600' };

  return (
    <div className={`${colors[alert.type]} text-white px-4 py-3 flex items-center justify-center relative animate-slide-down shadow-lg z-50 border-b border-black/10`}>
      <div className="container mx-auto flex items-center justify-center gap-3">
        <AlertTriangle size={18} fill="white" className="text-transparent" />
        <span className="font-bold text-sm tracking-wide text-center">{alert.message}</span>
      </div>
      <button onClick={onClose} className="absolute right-4 text-white/80 hover:text-white p-1">
        <X size={18} />
      </button>
    </div>
  );
};

// ─── Hero Section ────────────────────────────────────────────────────────────

interface HeroSectionProps {
  featuredArticle: Article | undefined;
  subFeaturedArticles: Article[];
}



const HeroSection: React.FC<HeroSectionProps> = ({ featuredArticle, subFeaturedArticles }) => {
  return (
    <section className="hero-section relative overflow-hidden">
      {/* Animated background accents */}
      <div className="absolute inset-0 bg-kph-charcoal" />
      <div className="hero-accent-1" />
      <div className="hero-accent-2" />
      <div className="hero-grain" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-7" style={{ minHeight: '560px' }}>

          {/* ── Featured / Video card ─────────────────────────────────────── */}
          {featuredArticle && (
            <div className="lg:col-span-3 relative group overflow-hidden rounded-2xl sm:rounded-3xl h-[420px] sm:h-[480px] lg:h-auto shadow-2xl border border-white/[0.06] bg-black hero-card">
              {/* Cinematic Grain inside the card for more texture */}
              <div className="hero-grain opacity-10" />

              <ArticleMedia
                article={featuredArticle}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[2s] ease-out"
              />

              {/* Multi-layer cinematic overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent pointer-events-none" />

              {/* Top bar: badge + controls */}
              <div className="absolute top-0 left-0 right-0 p-4 sm:p-5 flex items-start justify-between z-20">
                {/* VIDEO badge */}
                {!!featuredArticle.videoUrl && (
                  <div className="flex items-center gap-2 bg-kph-red/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-red-400/20 shadow-lg">
                    <Video size={12} className="shrink-0" />
                    Video Report
                  </div>
                )}
              </div>

              {/* Text content */}
              <div className="absolute bottom-0 left-0 p-5 sm:p-7 lg:p-10 w-full hero-text-glass">
                <div className="flex flex-wrap items-center gap-2.5 mb-3 sm:mb-4">
                  <span className="inline-block font-black text-[10px] lg:text-xs tracking-widest text-white bg-kph-red px-3 py-1.5 rounded-lg uppercase border border-red-400/20 shadow-lg">
                    {featuredArticle.category}
                  </span>
                </div>

                <Link to={`/article/${featuredArticle.id}`} className="block group/title">
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[2.75rem] font-black text-white mb-4 sm:mb-5 leading-[1.15] font-serif drop-shadow-xl group-hover/title:text-white/90 transition-colors line-clamp-3 lg:line-clamp-none">
                    {featuredArticle.title}
                  </h2>
                </Link>

                <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 text-gray-300 text-[11px] sm:text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} />
                      {featuredArticle.readTime}
                    </span>
                    <span className="text-white/20">•</span>
                    <span className="text-white/60">{featuredArticle.author}</span>
                  </div>

                  {/* CTA buttons */}
                  <div className="flex items-center gap-2.5">
                    <Link
                      to={`/article/${featuredArticle.id}`}
                      className="hero-cta-secondary"
                    >
                      Read Story
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* ── Sub-featured articles panel ───────────────────────────────── */}
        <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4 lg:gap-5 h-full">
          {subFeaturedArticles.map((article, idx) => (
            <div
              key={article.id}
              className="relative group overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl h-44 sm:h-52 lg:h-auto shadow-xl border border-white/[0.06] bg-gray-900 flex-1 hero-sub-card"
              style={{ animationDelay: `${idx * 120}ms` }}
            >
              <Link to={`/article/${article.id}`} className="block w-full h-full">
                <ArticleMedia
                  article={article}
                  className="w-full h-full object-cover opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute inset-0 bg-kph-red/0 group-hover:bg-kph-red/5 transition-colors duration-500" />
                <div className="absolute bottom-0 left-0 p-3.5 sm:p-5 lg:p-6 w-full">
                  <span className="text-[9px] font-black text-kph-red uppercase tracking-widest mb-1.5 sm:mb-2 block">
                    {article.category}
                  </span>
                  <h3 className="text-white font-bold text-sm sm:text-base lg:text-lg leading-snug font-serif line-clamp-2 lg:line-clamp-3">
                    {article.title}
                  </h3>
                  <div className="hidden sm:flex items-center gap-1.5 mt-2.5 text-white/40 text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={11} />
                    Read More
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

      </div>
    </div>
    </section >
  );
};

// ─── Home Page ────────────────────────────────────────────────────────────────

const Home: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalAlert, setGlobalAlert] = useState<GlobalAlert | null>(null);
  const [adConfig, setAdConfig] = useState<AdConfig | null>(null);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const [alertConfig, ads, featuredIds, newsData] = await Promise.all([
        AdminService.getGlobalAlert(),
        AdminService.getAdConfig(),
        AdminService.getFeaturedArticleIds(),
        NewsService.getLatestNews('General')
      ]);

      if (alertConfig && alertConfig.enabled) setGlobalAlert(alertConfig);
      setAdConfig(ads);

      // Record impression if home banner is active
      if (ads.homeBanner.enabled && ads.homeBanner.imageUrl) {
        AdminService.recordAdImpression('homeBanner');
      }

      const processedNews = [...newsData];
      if (featuredIds.length > 0) {
        const topFeatureId = featuredIds[0];
        const featureIdx = processedNews.findIndex(a => a.id === topFeatureId);
        if (featureIdx > 0) {
          const item = processedNews.splice(featureIdx, 1)[0];
          processedNews.unshift(item);
        }
      }

      setArticles(processedNews);
      setError(null);
    } catch (err: any) {
      console.warn("Home Sync failed. Using existing local state.");
      if (articles.length === 0) {
        setError("Network connection interrupted. Please check your internet and retry.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBannerClick = () => {
    AdminService.recordAdClick('homeBanner');
  };

  if (loading && articles.length === 0) {
    return (
      <div className="min-h-screen bg-kph-light flex items-center justify-center">
        <SEO title="Initializing News Feed... | KPH" description="Loading the latest political updates for Kwara State." />
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="relative">
            <Loader2 className="w-14 h-14 text-kph-red animate-spin" />
            <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-kph-red/20" size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-kph-charcoal text-xl font-black tracking-tighter uppercase">KPH Engine</p>
            <p className="text-gray-400 text-sm font-medium animate-pulse">Initializing local data vault...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && articles.length === 0) {
    return (
      <div className="min-h-screen bg-kph-light flex items-center justify-center p-4">
        <SEO title="Connection Error | KPH" description="System unavailable." />
        <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full text-center border border-red-50">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <AlertTriangle className="w-10 h-10 text-kph-red" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Sync Interrupted</h2>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">{error}</p>
          <button onClick={fetchContent} className="flex items-center justify-center gap-3 w-full bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95">
            <RefreshCw size={20} /> Retry Handshake
          </button>
        </div>
      </div>
    );
  }

  const featuredArticle = articles[0];
  const subFeaturedArticles = articles.slice(1, 3);
  const feedArticles = articles.slice(3, 10);
  const latestVideoArticle = articles.find(a => a.videoUrl && a.id !== featuredArticle?.id);

  return (
    <div className="bg-kph-light min-h-screen pb-12 animate-fade-in flex flex-col">
      <SEO title="KPH News - Kwara Political Hangout | Home" description="The #1 source for political news in Kwara State." />
      <GlobalAlertBanner alert={globalAlert} onClose={() => setGlobalAlert(null)} />

      <div className="bg-kph-red text-white text-xs lg:text-sm py-2.5 overflow-hidden relative z-20 border-b border-red-900 shadow-md">
        <div className="container mx-auto px-4 lg:px-8 flex items-center">
          <span className="font-bold uppercase tracking-wider text-[10px] lg:text-xs bg-white/20 px-3 py-1.5 rounded-lg mr-4 flex items-center gap-1.5 shrink-0 border border-white/10">
            <Zap size={14} className="fill-current text-white" /> Live
          </span>
          <div className="overflow-hidden flex-1 relative h-6 flex items-center group">
            <div className="absolute whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused] flex items-center">
              {articles.slice(0, 6).map((a, i) => (
                <Link key={i} to={`/article/${a.id}`} className="mr-16 font-bold opacity-90 hover:opacity-100 flex items-center gap-3 cursor-pointer">
                  <span className="w-2 h-2 bg-white/40 rounded-full shrink-0"></span> {a.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <HeroSection featuredArticle={featuredArticle} subFeaturedArticles={subFeaturedArticles} />

      {adConfig?.homeBanner?.enabled && adConfig?.homeBanner?.imageUrl && (
        <div className="container mx-auto px-4 lg:px-8 py-10">
          <a
            href={adConfig.homeBanner.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleBannerClick}
            className="block relative group overflow-hidden rounded-3xl shadow-xl border border-gray-100 transition-all hover:shadow-2xl hover:-translate-y-1"
          >
            <img src={adConfig.homeBanner.imageUrl} alt={adConfig.homeBanner.altText} className="w-full h-32 lg:h-48 object-cover group-hover:scale-105 transition-transform duration-1000" />
            <div className="absolute top-2 right-4 bg-black/40 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter backdrop-blur-sm">Sponsored</div>
          </a>
        </div>
      )}

      <main className="container mx-auto px-4 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-16">
            <section>
              <div className="flex items-center justify-between mb-10 border-b-4 border-gray-900/5 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-8 bg-kph-red rounded-full"></div>
                  <h3 className="text-2xl lg:text-3xl font-black text-kph-charcoal tracking-tight uppercase">Latest Headlines</h3>
                </div>
                <Link to="/news" className="text-kph-red font-bold text-sm flex items-center gap-1">View Archive <ChevronRight size={18} /></Link>
              </div>
              <div className="space-y-6">
                {feedArticles.map((article, idx) => (
                  <ArticleCard
                    key={`feed-${article.id}`}
                    article={article}
                    variant="list"
                    delay={idx * 100}
                  />
                ))}
              </div>
            </section>


          </div>
          <div className="lg:col-span-4 space-y-10">
            <Sidebar />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
