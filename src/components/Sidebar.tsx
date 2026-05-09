
import React, { useState, useEffect } from 'react';
import { Mail, Facebook, Twitter, Linkedin, Youtube, ArrowRight, Check, Instagram, Loader2, Image as ImageIcon } from 'lucide-react';
import ArticleCard from './ArticleCard';
import { AdminService, AdConfig } from '../services/adminService';
import { NewsService } from '../services/newsService';
import { Article } from '../types';

const Sidebar: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [adConfig, setAdConfig] = useState<AdConfig | null>(null);
  const [loadingAd, setLoadingAd] = useState(true);
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      // 1. Load Ads
      const config = await AdminService.getAdConfig();
      setAdConfig(config);
      setLoadingAd(false);

      if (config.sidebarAd.enabled && config.sidebarAd.imageUrl) {
        AdminService.recordAdImpression('sidebarAd');
      }

      // 2. Load Real Trending Articles
      const news = await NewsService.getLatestNews('General');
      setTrendingArticles(news.slice(0, 4));
      setLoadingTrending(false);
    };
    loadContent();
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      AdminService.addSubscriber(email);
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const handleAdClick = () => {
    AdminService.recordAdClick('sidebarAd');
  };

  return (
    <aside className="space-y-8 sticky top-24">

      {/* Newsletter */}
      <div className="bg-gradient-to-br from-kph-charcoal to-gray-800 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>

        <div className="relative z-10">
          <div className="flex items-center space-x-2.5 mb-3 text-kph-red">
            <div className="bg-white/10 p-1.5 rounded-lg">
              <Mail size={20} className="text-white" />
            </div>
            <h3 className="font-bold text-lg text-white">Newsletter</h3>
          </div>
          <p className="text-[13px] text-gray-400 mb-5 leading-relaxed">Join 10,000+ subscribers getting the latest political news delivered to their inbox.</p>

          {subscribed ? (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-2.5 flex items-center gap-2 text-green-300 text-[11px] font-bold animate-slide-up">
              <Check size={14} /> Subscribed successfully!
            </div>
          ) : (
            <form className="space-y-2.5" onSubmit={handleSubscribe}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-kph-red focus:bg-white/20 text-white placeholder-gray-500 text-[13px] transition-colors"
                required
              />
              <button className="w-full bg-kph-red text-white font-bold py-2.5 rounded-lg hover:bg-white hover:text-kph-red transition-all duration-300 shadow-md text-sm">
                Subscribe Now
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Popular Posts */}
      <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-base text-kph-charcoal border-l-4 border-kph-red pl-2.5 uppercase tracking-tighter">Popular Posts</h3>
        </div>
        <div className="flex flex-col space-y-2">
          {loadingTrending ? (
            <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-gray-200" /></div>
          ) : (
            trendingArticles.map((article, idx) => (
              <ArticleCard key={article.id} article={article} variant="compact" delay={idx * 100} />
            ))
          )}
          {!loadingTrending && trendingArticles.length === 0 && (
            <p className="text-[10px] text-gray-400 uppercase text-center py-4">No recent activity found</p>
          )}
        </div>
      </div>

      {/* Dynamic Ad Space */}
      <div className="w-full">
        {loadingAd ? (
          <div className="w-full h-[250px] bg-gray-50 rounded-2xl flex items-center justify-center">
            <Loader2 className="animate-spin text-gray-200" size={32} />
          </div>
        ) : adConfig?.sidebarAd?.enabled && adConfig.sidebarAd.imageUrl ? (
          <a
            href={adConfig.sidebarAd.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleAdClick}
            className="block relative group overflow-hidden rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-lg"
          >
            <img
              src={adConfig.sidebarAd.imageUrl}
              alt={adConfig.sidebarAd.altText}
              className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter text-gray-600 shadow-sm">Sponsored</div>
          </a>
        ) : (
          <div className="bg-gray-100 h-[250px] w-full flex flex-col items-center justify-center rounded-2xl text-gray-400 font-bold tracking-widest border-2 border-dashed border-gray-300 relative overflow-hidden group">
            <span>ADVERTISEMENT</span>
          </div>
        )}
      </div>

    </aside>
  );
};

export default Sidebar;
