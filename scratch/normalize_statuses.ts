
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function normalizeStatuses() {
  console.log('Fetching articles with uppercase Published status...');
  const { data, error } = await supabase
    .from('articles')
    .select('id, status')
    .eq('status', 'Published');

  if (error) {
    console.error('Error fetching articles:', error);
    return;
  }

  console.log(`Found ${data.length} articles to normalize.`);

  for (const article of data) {
    const { error: updateError } = await supabase
      .from('articles')
      .update({ status: 'published' })
      .eq('id', article.id);
    
    if (updateError) {
      console.error(`Failed to update article ${article.id}:`, updateError);
    } else {
      console.log(`Updated article ${article.id} to lowercase 'published'`);
    }
  }

  console.log('Normalization complete.');
}

normalizeStatuses();
