import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, ExternalLink, Loader2, Heart, MessageSquare } from 'lucide-react';
import { NewsService } from '../services/newsService';
import { Article } from '../types';
import SEO from '../components/SEO';
import { motion } from 'motion/react';
import { ArticleMedia } from '../components/ArticleCard';

const SportsArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      setLoading(true);
      const data = await NewsService.getArticleById(id);
      if (data) {
        setArticle(data);
      }
      setLoading(false);
    };
    fetchArticle();
  }, [id]);

  const handleShare = async () => {
    if (!article) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: `Check out this live sports update: ${article.title}`,
          url: article.sourceUrl || window.location.href,
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      navigator.clipboard.writeText(article.sourceUrl || window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-kph-red mb-4" />
        <p className="text-zinc-500 font-bold animate-pulse text-sm">Loading Live Update...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Article Not Found</h2>
        <p className="text-zinc-500 mb-6">This sports update might have expired from the live feed.</p>
        <button onClick={() => navigate('/sports')} className="px-6 py-3 bg-zinc-900 text-white font-bold rounded-xl active:scale-95 transition-transform">
          Return to Sports
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-24 font-sans selection:bg-kph-red/10 selection:text-kph-red">
      <SEO title={`${article.title} | Live Sports`} description={article.excerpt} image={article.imageUrl} />

      {/* Floating Back Button */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg"
        >
          <ChevronLeft size={24} />
        </button>
      </div>

      {/* Edge-to-Edge Hero Image */}
      <div className="relative w-full h-[50vh] sm:h-[60vh] bg-zinc-900">
        <ArticleMedia article={article} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="px-5 sm:px-8 -mt-16 relative z-10 max-w-3xl mx-auto"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-block font-black text-[10px] tracking-widest text-white bg-kph-red px-3 py-1.5 rounded-lg uppercase shadow-lg">
            LIVE SPORTS
          </span>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            {article.sourceName}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 leading-[1.15] font-serif mb-6">
          {article.title}
        </h1>

        <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-8 border-b border-zinc-100 pb-6">
          <span>{new Date(article.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {/* Abstract/Summary */}
        <div className="prose prose-zinc prose-lg text-zinc-700 leading-relaxed font-serif mb-10">
          <p className="text-xl sm:text-2xl leading-relaxed">
            {article.excerpt || article.content}
          </p>
        </div>

        {/* Call To Action */}
        <div className="bg-zinc-50 border border-zinc-100 rounded-[2rem] p-8 text-center mt-12 mb-8">
          <h3 className="text-lg font-black text-zinc-900 font-serif mb-2">Read the Full Coverage</h3>
          <p className="text-sm text-zinc-500 mb-6">This is a live summary. Tap below to read the complete story directly on {article.sourceName}.</p>
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-zinc-900 text-white font-bold py-4 px-8 rounded-xl hover:bg-kph-red transition-all active:scale-95 text-[11px] uppercase tracking-widest shadow-xl"
          >
            Open in {article.sourceName}
            <ExternalLink size={16} />
          </a>
        </div>
      </motion.div>

      {/* Frosted Glass Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-10 bg-gradient-to-t from-white via-white to-transparent pointer-events-none select-none">
        <div className="bg-white/80 backdrop-blur-xl border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full pointer-events-auto flex items-center justify-between px-2 py-2 max-w-md mx-auto">
          {/* Faux Comment Input */}
          <div className="flex-grow mr-2">
            <div className="bg-zinc-100 rounded-full py-3 px-5 text-[13px] text-zinc-400 font-bold flex items-center gap-2 cursor-not-allowed">
              <MessageSquare size={16} />
              Comments on source...
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="w-12 h-12 rounded-full flex items-center justify-center text-zinc-400 active:scale-90 transition-transform bg-transparent">
              <Heart size={20} />
            </button>
            <button onClick={handleShare} className="w-12 h-12 rounded-full flex items-center justify-center text-zinc-900 active:scale-90 transition-transform bg-zinc-100">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SportsArticleDetail;
