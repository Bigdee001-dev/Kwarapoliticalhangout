import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function check() {
  const { data, error } = await supabase.rpc('get_triggers');
  if (error) console.log('RPC failed. Trying query via select...');
  
  // Can't run arbitrary SQL from client usually, but maybe we can query pg_trigger if RLS isn't blocking it (it is).
}
check();
