
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable(tableName: string) {
  console.log(`\nInspecting table: ${tableName}`);
  // Try to get one row to see column names
  const { data, error } = await supabase.from(tableName).select('*').limit(1);
  if (error) {
    console.error(`Error fetching ${tableName}:`, error.message);
    // If table is empty, we might not get columns this way.
    // But we can try to insert a dummy row in a transaction or something? No.
  } else if (data && data.length > 0) {
    console.log(`Columns in ${tableName}:`, Object.keys(data[0]));
  } else {
    console.log(`No data in ${tableName} to inspect columns.`);
  }
}

async function run() {
  await inspectTable('articles');
  await inspectTable('people');
  await inspectTable('categories');
}

run();
