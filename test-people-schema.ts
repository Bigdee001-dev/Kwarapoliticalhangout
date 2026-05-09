import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

// Use service role if available, otherwise anon
async function run() {
  // Try to get column info from information_schema via rpc or just attempt inserts
  // First, let's try inserting a minimal row to see what works
  const { data, error } = await supabase
    .from('people')
    .insert([{ name: '__col_probe__' }])
    .select();
  
  console.log('Minimal insert (name only):');
  console.log('  error:', error?.message || 'none');
  console.log('  data:', data ? 'inserted' : 'null');

  if (data) {
    // Cleanup
    await supabase.from('people').delete().eq('name', '__col_probe__');
    console.log('Columns returned:', Object.keys(data[0]));
  }
}

run();
