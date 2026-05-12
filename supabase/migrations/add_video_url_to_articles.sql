-- Migration: Add video_url column to articles table
-- This enables video content to be associated with news articles.
-- Safe to re-run: uses IF NOT EXISTS guard.

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS video_url TEXT;

COMMENT ON COLUMN articles.video_url IS 
  'Optional: URL to a hosted video (e.g. ImageKit) associated with this article.';
