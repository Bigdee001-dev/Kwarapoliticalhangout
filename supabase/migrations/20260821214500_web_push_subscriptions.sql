-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert subscriptions
CREATE POLICY "Allow public insert to push_subscriptions" ON public.push_subscriptions
FOR INSERT WITH CHECK (true);

-- Allow authenticated users to delete their own, or anyone to delete by endpoint
CREATE POLICY "Allow public delete from push_subscriptions" ON public.push_subscriptions
FOR DELETE USING (true);

-- Create a webhook function to trigger edge function when an article is published
CREATE OR REPLACE FUNCTION public.trigger_push_on_publish()
RETURNS trigger AS $$
BEGIN
  -- Only trigger if the status changed to 'published' (from something else or on insert)
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status != 'published') THEN
    PERFORM
      net.http_post(
        url := 'https://ajqzyygzgjrydxilzzto.supabase.co/functions/v1/send-push',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := json_build_object(
          'type', TG_OP,
          'table', TG_TABLE_NAME,
          'schema', TG_TABLE_SCHEMA,
          'record', row_to_json(NEW),
          'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE null END
        )::jsonb
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the articles table
DROP TRIGGER IF EXISTS on_article_published ON public.articles;
CREATE TRIGGER on_article_published
AFTER INSERT OR UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_push_on_publish();
