
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

  async getArticleById(id: string): Promise<Article | undefined> {
    // We don't cache detail here to ensure likes/views are fresh
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
