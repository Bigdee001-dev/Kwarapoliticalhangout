import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data, error } = await supabase.from('people').select('*').limit(1);
  if (error) {
    console.error('Error fetching people:', error);
    return;
  }
  if (data && data.length > 0) {
    console.log('Columns in people table:', Object.keys(data[0]));
  } else {
    console.log('No data in people table.');
  }
}

run();
