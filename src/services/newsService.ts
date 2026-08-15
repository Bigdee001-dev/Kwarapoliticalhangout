
import { supabase } from './supabase';
import { Article, Comment } from '../types';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minute freshness
interface CacheEntry {
  timestamp: number;
  data: Article[];
}
const newsCache: Record<string, CacheEntry> = {};
const articleDetailCache: Map<string, Article> = new Map();

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
  async getLatestNews(topic: string = 'General'): Promise<Article[]> {
    const cacheKey = `latest_${topic}`;
    const cached = newsCache[cacheKey];
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      return cached.data;
    }

    try {
      let query = supabase
        .from('articles')
        .select(`
          *,
          profiles:author_id(name)
        `)
        .eq('status', 'published')
        .order('date', { ascending: false })
        .limit(50);

      if (topic !== 'General') {
        query = query.eq('category', topic);
      }

      const { data, error } = await query;
      if (error) throw error;

      const articles = data.map((d: any) => {
        const art = mapArticleData(d);
        articleDetailCache.set(art.id, art);
        return art;
      });

      newsCache[cacheKey] = { timestamp: Date.now(), data: articles };
      return articles;
    } catch (error) {
      console.error('Error fetching articles:', error);
      return [];
    }
  },

  async fetchLiveSportsNews(): Promise<Article[]> {
    const cacheKey = `latest_sports_api`;
    const cached = newsCache[cacheKey];
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      return cached.data;
    }

    try {
      const response = await fetch('https://newsdata.io/api/1/latest?apikey=pub_510e28e84bbb4e2f81191a52b9395b0a&category=sports&language=en');
      const data = await response.json();
      
      if (data.status !== 'success') {
        throw new Error('Failed to fetch sports news');
      }

      const articles: Article[] = data.results.map((d: any) => {
        const art: Article = {
          id: d.article_id,
          title: d.title,
          excerpt: d.description || '',
          content: d.content || d.description || '',
          category: 'Sports',
          author: d.creator ? d.creator[0] : (d.source_name || 'KPH Sports'),
          date: d.pubDate,
          readTime: '4 min read',
          imageUrl: d.image_url || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000&auto=format&fit=crop',
          videoUrl: d.video_url || '',
          sourceUrl: d.link,
          sourceName: d.source_name || 'KPH Sports',
          isFeatured: false,
          status: 'published',
          views: Math.floor(Math.random() * 500) + 100,
          likes: Math.floor(Math.random() * 200) + 10
        };
        articleDetailCache.set(art.id, art);
        return art;
      });

      newsCache[cacheKey] = { timestamp: Date.now(), data: articles };
      return articles;
    } catch (error) {
      console.error('Error fetching live sports:', error);
      return [];
    }
  },

  async getArticleById(id: string): Promise<Article | undefined> {
    // Check local cache first (crucial for sports API articles)
    if (articleDetailCache.has(id)) {
      return articleDetailCache.get(id);
    }
    
    // Fallback to Supabase for native articles
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`*, profiles:author_id(name)`)
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (data) {
        // Increment views
        await supabase.from('articles').update({ views: (data.views || 0) + 1 }).eq('id', id);
        
        const art = mapArticleData(data);
        articleDetailCache.set(id, art);
        return art;
      }
      return undefined;
    } catch (error) {
      console.error('Error fetching article by id:', error);
      return undefined;
    }
  },

  async likeArticle(id: string, currentLikes: number = 0): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .update({ likes: currentLikes + 1 })
        .eq('id', id)
        .select('likes')
        .single();
      
      if (error) throw error;
      return data.likes || currentLikes + 1;
    } catch (error) {
      console.error('Error liking article:', error);
      return currentLikes;
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
        .select(`*, profiles:author_id(name)`)
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
