
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

async function checkSchema() {
  console.log('Checking newsletter table columns...');
  const { data, error } = await supabase.from('newsletter').select('*').limit(1);
  if (error) {
    console.error('Error fetching newsletter:', error);
  } else if (data && data.length > 0) {
    console.log('Newsletter sample row keys:', Object.keys(data[0]));
    console.log('Status value:', data[0].status);
  } else {
    console.log('No data in newsletter table yet.');
  }

  console.log('\nChecking articles table statuses...');
  const { data: articleData, error: articleError } = await supabase.from('articles').select('status').limit(20);
  if (articleError) {
    console.error('Error fetching articles:', articleError);
  } else if (articleData) {
    const statuses = [...new Set(articleData.map(a => a.status))];
    console.log('Article statuses found in DB:', statuses);
  }
}

checkSchema();
