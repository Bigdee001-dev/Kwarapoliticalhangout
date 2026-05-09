import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data, error } = await supabase.from('articles').select('*').order('date', { ascending: false }).limit(1);
  console.log('Error with date order:', error);
  console.log('Data:', data);
  
  const { data: data2, error: error2 } = await supabase.from('articles').select('*, profiles:author_id(name)').limit(1);
  console.log('Error with profiles join:', error2);
}

run();
