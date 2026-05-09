
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

async function checkImageUrls() {
  console.log('Fetching sample articles to check image URLs...');
  // We'll fetch from 'articles' table, specifically looking at imageUrl or image_url
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, imageUrl, image_url')
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Found articles:', data.length);
  data.forEach(a => {
    console.log(`Article: ${a.title}`);
    console.log(`  imageUrl: ${a.imageUrl}`);
    console.log(`  image_url: ${a.image_url}`);
  });
}

checkImageUrls();
