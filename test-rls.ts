import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data, error } = await supabase.from('site_settings').select('*');
  if (error) {
    console.error('Error fetching site_settings (anon):', error.message);
  } else {
    console.log('Successfully fetched site_settings (anon):', data.length, 'rows');
    data.forEach(d => console.log(`- ${d.id}`));
  }
}

run();
