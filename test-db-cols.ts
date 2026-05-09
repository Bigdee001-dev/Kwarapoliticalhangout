import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data, error } = await supabase.from('articles').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
    console.log('Image URLs:', {
      imageUrl: data[0].imageUrl,
      image_url: data[0].image_url
    });
  } else {
    console.log('No articles found');
  }
}

run();
