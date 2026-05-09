import { supabase } from './supabase';

export interface PersonProfile {
  id: string;
  name: string;
  title: string;
  subCategory: string;
  state: string;
  bio: string;
  photoUrl: string;
  isPublished: boolean;
  linkedArticlesCount?: number;
  socialLinks?: any;
  birthplace?: string;
  slug?: string;
}

export const PeopleService = {
  async getAllPeople(): Promise<any[]> {
    try {
      // Use is_published (database column) instead of isPublished
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('is_published', true)
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      // Map database fields to application fields
      return (data || []).map(d => ({
        id: d.id,
        name: d.name,
        title: d.title,
        subCategory: d.sub_category || d.subCategory,
        state: d.state,
        bio: d.bio,
        photoUrl: d.photo_url || d.photoUrl || d.image_url,
        isPublished: d.is_published ?? d.isPublished,
        linkedArticlesCount: d.linked_articles_count || d.linkedArticlesCount || 0,
        socialLinks: d.social_links || d.socialLinks || {},
        birthplace: d.birthplace,
        slug: d.slug
      }));
    } catch (error) {
      console.error('Error fetching people:', error);
      return [];
    }
  }
};
