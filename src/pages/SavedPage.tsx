import React, { useEffect, useState } from 'react';
import { Bookmark, SearchX } from 'lucide-react';
import ArticleCard from '../components/ArticleCard';
import { Article } from '../types';
import SEO from '../components/SEO';

const SavedPage: React.FC = () => {
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedArticles') || '[]');
    setSavedArticles(saved);
  }, []);

  return (
    <div className="bg-zinc-50 min-h-screen pb-24 font-sans selection:bg-kph-red/10 selection:text-kph-red">
      <SEO title="Saved Articles | KPH News" description="Your saved articles." />

      <div className="bg-white px-4 py-4 border-b border-zinc-200 sticky top-0 z-40 bg-white/95 backdrop-blur-xl select-none flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-kph-red">
            <Bookmark size={20} className="fill-kph-red/20" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight leading-none">Saved Articles</h1>
            <p className="text-[11px] text-zinc-500 font-medium mt-1">Your personal reading list</p>
          </div>
        </div>
      </div>

      <main className="max-w-xl mx-auto w-full pt-4 px-4">
        {savedArticles.length > 0 ? (
          <div className="flex flex-col gap-4">
            {savedArticles.map((article) => (
              <ArticleCard key={`saved-${article.id}`} article={article} variant="list" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-20 pb-10 text-center px-4">
            <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6 border border-zinc-200">
              <SearchX size={32} className="text-zinc-400" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2 font-serif">No Saved Articles</h2>
            <p className="text-sm text-zinc-500 max-w-[250px] leading-relaxed">
              Articles you save using the bookmark icon will appear here for you to read later.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SavedPage;
