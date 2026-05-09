import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  // To get columns of an empty table, we can try inserting a dummy row and rolling back,
  // or use RPC if available. Since I don't know the schema, I'll try to query information_schema if possible.
  // Actually, I can just try to fetch a row and check the error message or just use rpc.
  // Another way: try to insert an empty object and see the required columns in error.
  
  const { data, error } = await supabase.from('comments').insert({}).select();
  console.log('Error from dummy insert:', error?.message);
}

run();
