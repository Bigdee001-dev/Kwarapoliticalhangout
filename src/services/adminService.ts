import { supabase } from './supabase';
import { Article } from '../types';

export interface AdUnit {
  enabled: boolean;
  imageUrl: string;
  linkUrl: string;
  altText: string;
  title?: string;
  stats: {
    clicks: number;
    impressions: number;
    lastUpdated: string;
  };
}

export interface AdConfig {
  homeBanner: AdUnit;
  sidebarAd: AdUnit;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Writer' | 'Suspended';
  joinedDate: string;
  status: 'Active' | 'Pending' | 'Banned';
}

export interface GlobalAlert {
  enabled: boolean;
  message: string;
  type: 'info' | 'warning' | 'critical';
}

const DEFAULT_AD_UNIT: AdUnit = { 
  enabled: false, 
  imageUrl: '', 
  linkUrl: '#', 
  altText: 'Advertisement', 
  title: 'Sponsored Content',
  stats: { clicks: 0, impressions: 0, lastUpdated: new Date().toISOString() } 
};

const DEFAULT_AD_CONFIG: AdConfig = {
  homeBanner: { ...DEFAULT_AD_UNIT },
  sidebarAd: { ...DEFAULT_AD_UNIT }
};

export const AdminService = {
  async getAdConfig(): Promise<AdConfig> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('id', 'ads')
        .single();
      if (error || !data) return DEFAULT_AD_CONFIG;
      return data.value as unknown as AdConfig;
    } catch (error) {
      console.warn("Failed to fetch ad config", error);
      return DEFAULT_AD_CONFIG;
    }
  },

  async saveAdConfig(config: AdConfig) {
    try {
      await supabase.from('site_settings').upsert({ id: 'ads', value: config as any });
    } catch (error) {
      console.error("Failed to save ad config", error);
    }
  },

  async recordAdImpression(slot: 'homeBanner' | 'sidebarAd') {
    // Note: Incrementing in Supabase requires an RPC or read+write.
    // For simplicity, we just fetch, update, and save.
    const config = await this.getAdConfig();
    config[slot].stats.impressions += 1;
    config[slot].stats.lastUpdated = new Date().toISOString();
    await this.saveAdConfig(config);
  },

  async recordAdClick(slot: 'homeBanner' | 'sidebarAd') {
    const config = await this.getAdConfig();
    config[slot].stats.clicks += 1;
    config[slot].stats.lastUpdated = new Date().toISOString();
    await this.saveAdConfig(config);
  },

  async getFeaturedArticleIds(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('id', 'featured')
        .single();
      if (error || !data) return [];
      return (data.value as any)?.ids || [];
    } catch (error) {
      return [];
    }
  },

  async getGlobalAlert(): Promise<GlobalAlert | null> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('id', 'alert')
        .single();
      if (error || !data) return null;
      const alert = data.value as unknown as GlobalAlert;
      return alert.enabled ? alert : null;
    } catch (error) {
      return null;
    }
  },

  async addSubscriber(email: string) {
    try {
      await supabase.from('newsletter').insert({ email, status: 'active' });
    } catch (error) {
      console.error("Failed to add subscriber", error);
    }
  },

  async addMessage(message: any) {
    try {
      await supabase.from('messages').insert({
        name: message.name,
        email: message.email,
        message: message.message
      });
    } catch (error) {
      console.error("Failed to add message", error);
    }
  },

  async getWriterArticles(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (error) {
      console.error("Failed to get writer articles", error);
      return [];
    }
    return data;
  },

  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('email', { ascending: true });
        
      if (error) throw error;
      return data.map(d => ({
        id: d.id,
        name: d.name,
        email: d.email,
        role: d.role as any,
        joinedDate: d.created_at,
        status: 'Active'
      }));
    } catch (error) {
      console.error("Failed to get users", error);
      return [];
    }
  },

  async addUser(user: Partial<User>) {
    try {
      await supabase.from('profiles').upsert({
        id: user.id || undefined,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      console.error("Failed to add user", error);
    }
  },

  async deleteUser(id: string) {
    try {
      await supabase.from('profiles').delete().eq('id', id);
    } catch (error) {
      console.error("Failed to delete user", error);
    }
  },

  async setGlobalAlert(alert: GlobalAlert | null) {
    try {
      await supabase.from('site_settings').upsert({
        id: 'alert',
        value: alert || { enabled: false, message: '', type: 'info' } as any
      });
    } catch (error) {
      console.error("Failed to set alert", error);
    }
  },

  async setFeaturedArticle(id: string) {
    try {
      await supabase.from('site_settings').upsert({
        id: 'featured',
        value: { ids: [id] } as any
      });
    } catch (error) {
      console.error("Failed to set featured article", error);
    }
  },

  async resetAdStats() {
    try {
      const config = await this.getAdConfig();
      config.homeBanner.stats = { clicks: 0, impressions: 0, lastUpdated: new Date().toISOString() };
      config.sidebarAd.stats = { clicks: 0, impressions: 0, lastUpdated: new Date().toISOString() };
      await this.saveAdConfig(config);
    } catch (error) {
      console.error("Failed to reset ad stats", error);
    }
  },

  async deleteArticle(id: string) {
    try {
      await supabase.from('articles').delete().eq('id', id);
    } catch (error) {
      console.error("Failed to delete article", error);
    }
  },

  async publishArticle(article: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const data = {
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        category: article.category,
        author_id: user.id,
        image_url: article.imageUrl || article.featuredImage,
        video_url: article.videoUrl,
        source_url: article.sourceUrl,
        source_name: article.sourceName,
        status: article.status || 'published'
      };

      if (!article.id) {
        await supabase.from('articles').insert(data);
      } else {
        await supabase.from('articles').update(data).eq('id', article.id);
      }
    } catch (error) {
      console.error("Failed to publish article", error);
    }
  }
};
