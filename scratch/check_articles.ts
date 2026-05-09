
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

async function checkArticles() {
  console.log('Fetching all articles count...');
  const { count, error } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error fetching articles count:', error);
  } else {
    console.log('Total articles in DB:', count);
  }

  // Try to fetch one regardless of status
  const { data, error: fetchError } = await supabase.from('articles').select('id, title, status').limit(5);
  if (fetchError) {
    console.error('Error fetching sample articles:', fetchError);
  } else {
    console.log('Sample articles:', data);
  }
}

checkArticles();
