import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data, error } = await supabase.from('people').select('*');
  if (error) {
    console.error('Error fetching people (anon):', error.message);
  } else {
    console.log('Successfully fetched people (anon):', data.length, 'rows');
  }
}

run();
