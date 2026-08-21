import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function testAuth() {
  const email = 'test.writer.upgrade.123@example.com';
  const password = 'Password123!';
  
  console.log('Signing up...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { requested_role: 'writer' } }
  });
  
  if (signUpError) {
     console.log('SignUp error:', signUpError.message);
     return;
  }
  
  console.log('SignUp success. User ID:', signUpData.user?.id);
  // Note: if email confirmations are ON, we can't sign in immediately.
  // We'd have to check if session exists.
  if (!signUpData.session) {
      console.log('Email confirmation required. Cannot test update via this script.');
      
      // Let's just try to update using anon key without session? Will fail RLS.
      return;
  }
}
testAuth();
