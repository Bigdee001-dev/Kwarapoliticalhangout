import * as admin from 'firebase-admin';

export type UserRole = 'reader' | 'writer' | 'editor' | 'admin';
export type UserStatus = 'pending' | 'active' | 'approved' | 'rejected' | 'suspended';
export type ArticleStatus = 'draft' | 'published' | 'archived' | 'rejected' | 'revision';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
  status: UserStatus;
  articlesSubmitted: number;
  articlesPublished: number;
  totalViews: number;
  totalLikes: number;
  joinedAt: admin.firestore.FieldValue;
  lastActiveAt: admin.firestore.FieldValue;
  approvedBy: string | null;
  approvedAt: admin.firestore.FieldValue | null;
  isActive?: boolean;
  deletedAt?: admin.firestore.FieldValue | null;
}

export interface Article {
  id?: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  category: string;
  status: ArticleStatus;
  imageUrl?: string;
  createdAt: admin.firestore.FieldValue;
  updatedAt: admin.firestore.FieldValue;
  publishedAt?: admin.firestore.FieldValue;
  views?: number;
  likes?: number;
  tags?: string[];
  excerpt?: string;
  linkedPeople?: string[];
  relatedArticles?: string[];
  aiQualityScore?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

export interface Person {
  id?: string;
  name: string;
  slug?: string;
  bio: string;
  role: string;
  party?: string;
  subCategory?: string;
  state?: string;
  imageUrl?: string;
  linkedArticles?: string[];
  relatedPeople?: string[];
}

export interface ErrorLog {
  id?: string;
  app: 'portal' | 'writer' | 'admin';
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  userRole?: string;
  timestamp: admin.firestore.FieldValue;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: admin.firestore.FieldValue;
}
