
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function scanAllTables() {
  console.log('Scanning tables for image URLs...');
  const tables = ['articles', 'profiles', 'site_settings'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(5);
    if (error) {
      console.log(`Table ${table} error:`, error.message);
      continue;
    }
    console.log(`--- ${table} ---`);
    console.log(JSON.stringify(data, null, 2));
  }
}

scanAllTables();
