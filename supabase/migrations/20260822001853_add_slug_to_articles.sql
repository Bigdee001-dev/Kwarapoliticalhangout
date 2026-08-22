CREATE EXTENSION IF NOT EXISTS "unaccent";

CREATE OR REPLACE FUNCTION generate_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Generate the base slug from the title
  base_slug := lower(regexp_replace(unaccent(NEW.title), '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  new_slug := base_slug;
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.articles WHERE slug = new_slug AND id != NEW.id) LOOP
    new_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  NEW.slug := new_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Attach trigger
DROP TRIGGER IF EXISTS ensure_article_slug ON public.articles;
CREATE TRIGGER ensure_article_slug
  BEFORE INSERT OR UPDATE OF title
  ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION generate_slug();

-- Backfill existing rows
UPDATE public.articles SET title = title;
