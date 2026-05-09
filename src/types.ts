
export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  category: 'Politics' | 'Media' | 'People' | 'News' | string;
  author: string;
  date: string;
  readTime: string;
  imageUrl: string;
  videoUrl?: string; // Support for Cloudinary Video
  sourceUrl?: string;
  sourceName?: string;
  isFeatured?: boolean;
  status?: 'Published' | 'Draft';
  views?: number;
  likes?: number;
}

export interface Comment {
  id: string;
  article_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export interface Profile {
  id: string;
  name: string;
  title: string;
  role: string;
  department: string;
  imageUrl: string;
  bio: string;
}

export interface NavItem {
  label: string;
  path: string;
}
