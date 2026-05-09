
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBrokenUrls() {
  console.log('Searching for articles with potential double-bucket prefixes in image URLs...');
  const { data, error } = await supabase
    .from('articles')
    .select('id, imageUrl, image_url, content');

  if (error) {
    console.error('Error fetching articles:', error);
    return;
  }

  console.log(`Checking ${data.length} articles...`);

  for (const article of data) {
    let updated = false;
    const updateData: any = {};

    // Check imageUrl and image_url
    ['imageUrl', 'image_url'].forEach(field => {
      const url = article[field];
      if (url && url.includes('/articles/temp/') || url && url.includes('/articles/articles/')) {
        // Fix: remove redundant /articles/ if it's duplicated or wrong for the setup
        // Actually, let's just look for the specific duplication pattern /articles/articles/
        if (url.includes('/articles/articles/')) {
           updateData[field] = url.replace('/articles/articles/', '/articles/');
           updated = true;
        }
      }
    });

    // Check content for embedded images
    if (article.content && article.content.includes('/articles/articles/')) {
      updateData.content = article.content.split('/articles/articles/').join('/articles/');
      updated = true;
    }

    if (updated) {
      console.log(`Fixing article ${article.id}...`);
      const { error: updateError } = await supabase
        .from('articles')
        .update(updateData)
        .eq('id', article.id);
      
      if (updateError) {
        console.error(`Failed to update article ${article.id}:`, updateError.message);
      }
    }
  }

  console.log('URL fix complete.');
}

fixBrokenUrls();
