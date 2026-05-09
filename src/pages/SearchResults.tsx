import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Loader2, Search, ArrowRight, AlertCircle } from 'lucide-react';
import { NewsService } from '../services/newsService';
import { Article } from '../types';
import ArticleCard from '../components/ArticleCard';
import Sidebar from '../components/Sidebar';

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const performSearch = async () => {
        if (!query) return;
        
        setLoading(true);
        setArticles([]);
        try {
            // Add slight delay to simulate processing if cached
            const results = await NewsService.searchNews(query);
            setArticles(results);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    performSearch();
  }, [query]);

  return (
    <div className="min-h-screen bg-kph-light animate-fade-in pb-16">
       
       {/* Search Header */}
       <div className="bg-white border-b border-gray-200 py-12">
          <div className="container mx-auto px-4 lg:px-8">
             <div className="max-w-4xl">
                 <div className="flex items-center gap-2 text-kph-red font-bold text-sm uppercase tracking-wider mb-2">
                    <Search size={14} /> Search Results
                 </div>
                 <h1 className="text-3xl lg:text-5xl font-bold text-kph-charcoal font-serif break-words">
                    "{query}"
                 </h1>
                 <p className="text-gray-500 mt-4">
                    {loading ? 'Searching our archives and live feed...' : `Found ${articles.length} results matching your query.`}
                 </p>
             </div>
          </div>
       </div>

       <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
             
             {/* Main Content */}
             <div className="lg:col-span-8">
                {loading ? (
                   <div className="flex flex-col items-center justify-center py-20 space-y-4">
                       <Loader2 className="w-10 h-10 text-kph-red animate-spin" />
                       <p className="text-gray-500 font-medium">Curating relevant stories...</p>
                   </div>
                ) : articles.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {articles.map((article, index) => (
                           <ArticleCard key={article.id} article={article} delay={index * 100} />
                       ))}
                   </div>
                ) : (
                   <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                       <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mx-auto mb-6">
                           <Search size={32} />
                       </div>
                       <h3 className="text-xl font-bold text-kph-charcoal mb-2">No results found</h3>
                       <p className="text-gray-500 max-w-md mx-auto mb-8">
                           We couldn't find any news articles matching "{query}". Try checking for typos or using different keywords.
                       </p>
                       <Link to="/" className="inline-flex items-center justify-center px-6 py-3 bg-kph-charcoal text-white font-bold rounded-lg hover:bg-kph-red transition-colors">
                           Back to Home
                       </Link>
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

export default SearchResults;
