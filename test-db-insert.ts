import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data, error } = await supabase.from('articles').insert([{ 
    title: 'Test Article',
    content: 'This is a test',
    category: 'General',
    status: 'published'
  }]).select();
  console.log('Insert Error:', error);
  console.log('Insert Data:', data);
}

run();
