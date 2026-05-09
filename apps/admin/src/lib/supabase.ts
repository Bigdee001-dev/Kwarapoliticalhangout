import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ajqzyygzgjrydxilzzto.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqcXp5eWd6Z2pyeWR4aWx6enRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNjE2ODUsImV4cCI6MjA5MzgzNzY4NX0.fQ_JsXeM4rhgwRwkxDds06RH-OLXi7pAtUCE76jWjm0';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
