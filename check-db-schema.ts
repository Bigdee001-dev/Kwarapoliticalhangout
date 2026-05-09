import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  // Check articles table for likes column
  const { data: articleCols, error: articleError } = await supabase.from('articles').select('*').limit(1);
  if (articleError) {
    console.error('Error fetching articles:', articleError.message);
  } else {
    console.log('Articles columns:', articleCols.length > 0 ? Object.keys(articleCols[0]) : 'No rows');
  }

  // Check if comments table exists
  const { data: comments, error: commentsError } = await supabase.from('comments').select('*').limit(1);
  if (commentsError) {
    console.log('Comments table likely does not exist:', commentsError.message);
  } else {
    console.log('Comments table exists. Columns:', comments.length > 0 ? Object.keys(comments[0]) : 'Empty table');
  }
}

run();
