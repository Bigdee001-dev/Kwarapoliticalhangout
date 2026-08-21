
import { supabase } from './supabase';
import { Article, Comment } from '../types';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minute freshness
interface CacheEntry {
  timestamp: number;
  data: Article[];
}
const newsCache: Record<string, CacheEntry> = {};
const articleDetailCache: Map<string, Article> = new Map();

const LOCAL_STORAGE_KEY = 'kph_news_cache_v2';

// Load from localStorage on initialization
try {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.newsCache) {
      Object.assign(newsCache, parsed.newsCache);
    }
    if (parsed.articleDetailCache) {
      parsed.articleDetailCache.forEach(([k, v]: any) => articleDetailCache.set(k, v));
    }
  }
} catch (e) {
  console.warn("Failed to parse localStorage cache", e);
}

const persistCache = () => {
  try {
    const serialized = {
      newsCache,
      // Only store up to 50 articles in detail cache to avoid quota limits
      articleDetailCache: Array.from(articleDetailCache.entries()).slice(0, 50)
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serialized));
  } catch (e) {
    console.warn("Failed to save to localStorage", e);
  }
};

const mapArticleData = (d: any): Article => ({
  id: d.id,
  title: d.title,
  excerpt: d.excerpt || '',
  content: d.content,
  category: d.category,
  author: d.profiles?.name || d.author_name || d.authorName || d.author_id || d.authorId || 'KPH Desk',
  date: d.date || d.created_at || d.createdAt,
  readTime: d.read_time || d.readTime || '5 min read',
  imageUrl: d.image_url || d.imageUrl || '',
  videoUrl: d.video_url || d.videoUrl || '',
  sourceUrl: d.source_url || d.sourceUrl || '',
  sourceName: d.source_name || d.sourceName || 'KPH News',
  isFeatured: d.is_featured || d.isFeatured || false,
  status: d.status,
  views: d.views || 0,
  likes: d.likes || 0
});

export const NewsService = {
  async getLatestNews(topic: string = 'General', onUpdate?: (articles: Article[]) => void): Promise<Article[]> {
    const cacheKey = `latest_${topic}`;
    const cached = newsCache[cacheKey];
    const isFresh = cached && (Date.now() - cached.timestamp < CACHE_DURATION);

    const fetchFresh = async () => {
      try {
        let query = supabase
          .from('articles')
          .select(`id, title, excerpt, content, category, author_name, date, read_time, image_url, imageUrl, video_url, source_url, source_name, is_featured, status, views, likes, profiles:author_id(name)`)
          .eq('status', 'published')
          .order('date', { ascending: false })
          .limit(50);

        if (topic !== 'General') {
          query = query.eq('category', topic);
        }

        let guardianPromise = Promise.resolve<Article[]>([]);
        if (topic === 'General') {
          guardianPromise = this.fetchGuardianNews('');
        } else if (topic === 'Nigeria') {
          guardianPromise = this.fetchGuardianNews('nigeria');
        }

        const [supabaseResult, guardianResult] = await Promise.allSettled([query, guardianPromise]);

        const articles: Article[] = [];

        if (supabaseResult.status === 'fulfilled' && !supabaseResult.value.error && supabaseResult.value.data) {
          supabaseResult.value.data.forEach((d: any) => {
            const art = mapArticleData(d);
            // We don't overwrite full content in articleDetailCache if we already have it
            if (!articleDetailCache.has(art.id) || !articleDetailCache.get(art.id)?.content) {
              articleDetailCache.set(art.id, art);
            }
            articles.push(art);
          });
        }

        if (guardianResult.status === 'fulfilled') {
          articles.push(...guardianResult.value);
        }

        newsCache[cacheKey] = { timestamp: Date.now(), data: articles };
        persistCache();
        
        if (onUpdate) onUpdate(articles);
        return articles;
      } catch (error) {
        console.error('Error fetching articles:', error);
        return cached ? cached.data : [];
      }
    };

    if (cached) {
      if (!isFresh) {
        fetchFresh(); // Revalidate in background
      }
      return cached.data; // Return instantly
    }

    return await fetchFresh();
  },

  async fetchGuardianNews(query: string, section?: string): Promise<Article[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second timeout

      let url = `https://content.guardianapis.com/search?api-key=ec05b8cc-27af-4bed-910e-0199cd646792&show-fields=headline,thumbnail,trailText,body,byline,firstPublicationDate,shortUrl&order-by=newest`;
      if (query) url += `&q=${encodeURIComponent(query)}`;
      if (section) url += `&section=${section}`;
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data.response?.status !== 'ok') {
        return [];
      }

      return data.response.results.map((d: any) => {
        const art: Article = {
          id: d.id.replace(/\//g, '-'), // Make ID URL safe just in case
          title: d.fields?.headline || d.webTitle,
          excerpt: d.fields?.trailText?.replace(/<[^>]+>/g, '') || '', // Strip HTML from trailText
          content: d.fields?.body || '',
          category: section === 'sport' ? 'Sports' : 'News',
          author: d.fields?.byline || 'The Guardian',
          date: d.webPublicationDate,
          readTime: '5 min read',
          imageUrl: d.fields?.thumbnail || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000&auto=format&fit=crop',
          videoUrl: '',
          sourceUrl: d.webUrl,
          sourceName: 'The Guardian',
          isFeatured: false,
          status: 'Published',
          views: Math.floor(Math.random() * 500) + 100,
          likes: Math.floor(Math.random() * 200) + 10
        };
        articleDetailCache.set(art.id, art);
        return art;
      });
    } catch (error) {
      console.error('Error fetching Guardian news:', error);
      return [];
    }
  },

  async fetchLiveSportsNews(onUpdate?: (articles: Article[]) => void): Promise<Article[]> {
    const cacheKey = `latest_sports_api`;
    const cached = newsCache[cacheKey];
    const isFresh = cached && (Date.now() - cached.timestamp < CACHE_DURATION);

    const fetchFresh = async () => {
      try {
        const [naijaSportsResult, globalSportsResult] = await Promise.allSettled([
          this.fetchGuardianNews('nigeria', 'sport'),
          this.fetchGuardianNews('', 'sport')
        ]);
        
        let combined: Article[] = [];
        if (naijaSportsResult.status === 'fulfilled') combined.push(...naijaSportsResult.value);
        if (globalSportsResult.status === 'fulfilled') combined.push(...globalSportsResult.value);
        
        const uniqueIds = new Set();
        const articles = combined.filter(a => {
          if (uniqueIds.has(a.id)) return false;
          uniqueIds.add(a.id);
          return true;
        });

        newsCache[cacheKey] = { timestamp: Date.now(), data: articles };
        persistCache();
        if (onUpdate) onUpdate(articles);
        return articles;
      } catch (error) {
        console.error('Error fetching live sports:', error);
        return cached ? cached.data : [];
      }
    };

    if (cached) {
      if (!isFresh) fetchFresh();
      return cached.data;
    }

    return await fetchFresh();
  },

  async getArticleById(id: string, onUpdate?: (article: Article) => void): Promise<Article | undefined> {
    const cached = articleDetailCache.get(id);
    const hasFullContent = cached && cached.content !== undefined;

    const fetchFresh = async () => {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select(`*, profiles:author_id(name)`)
          .eq('id', id)
          .single();
          
        if (error) throw error;
        if (data) {
          // Fire-and-forget view increment
          (async () => {
            try {
              await supabase.from('articles').update({ views: (data.views || 0) + 1 }).eq('id', id);
            } catch (e) {
              // Ignore errors
            }
          })();
          
          const art = mapArticleData(data);
          articleDetailCache.set(id, art);
          persistCache();
          if (onUpdate) onUpdate(art);
          return art;
        }
        return undefined;
      } catch (error) {
        console.error('Error fetching article by id:', error);
        return cached;
      }
    };

    if (hasFullContent) {
      fetchFresh(); // Revalidate silently
      return cached;
    }
    
    return await fetchFresh();
  },

  async checkIfLiked(articleId: string, deviceId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('article_likes')
        .select('id')
        .eq('article_id', articleId)
        .eq('device_id', deviceId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking if liked:', error);
      }
      return !!data;
    } catch (error) {
      console.error('Error checking if liked:', error);
      return false;
    }
  },

  async toggleLikeArticle(articleId: string, deviceId: string, currentLikes: number = 0): Promise<{ likes: number; isLiked: boolean }> {
    try {
      // Check if already liked
      const isLiked = await this.checkIfLiked(articleId, deviceId);

      if (isLiked) {
        // Unlike
        await supabase
          .from('article_likes')
          .delete()
          .eq('article_id', articleId)
          .eq('device_id', deviceId);

        const newLikes = Math.max(0, currentLikes - 1);
        await supabase.from('articles').update({ likes: newLikes }).eq('id', articleId);
        return { likes: newLikes, isLiked: false };
      } else {
        // Like
        await supabase
          .from('article_likes')
          .insert({ article_id: articleId, device_id: deviceId });

        const newLikes = currentLikes + 1;
        await supabase.from('articles').update({ likes: newLikes }).eq('id', articleId);
        return { likes: newLikes, isLiked: true };
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Return previous state on error
      return { likes: currentLikes, isLiked: false };
    }
  },

  async getComments(articleId: string): Promise<Comment[]> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  },

  async addComment(articleId: string, authorName: string, content: string): Promise<Comment | null> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          article_id: articleId,
          author_name: authorName,
          content: content
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  },

  async searchNews(queryStr: string): Promise<Article[]> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`id, title, excerpt, category, author_name, date, read_time, image_url, imageUrl, video_url, source_url, source_name, is_featured, status, views, likes, profiles:author_id(name)`)
        .eq('status', 'published')
        .or(`title.ilike.%${queryStr}%,excerpt.ilike.%${queryStr}%`)
        .order('date', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      return data.map((d: any) => mapArticleData(d));
    } catch (error) {
      console.error('Error searching articles:', error);
      return [];
    }
  }
};
