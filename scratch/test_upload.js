
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ajqzyygzgjrydxilzzto.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqcXp5eWd6Z2pyeWR4aWx6enRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNjE2ODUsImV4cCI6MjA5MzgzNzY4NX0.fQ_JsXeM4rhgwRwkxDds06RH-OLXi7pAtUCE76jWjm0';
const IMAGEKIT_PUBLIC_KEY = 'public_3Kgzl+BuilYxsQke9HXDIqT82CA=';

async function testUpload() {
  console.log('Starting upload test...');
  
  try {
    // 1. Get auth params from Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: authParams, error: authError } = await supabase.functions.invoke('imagekit-auth');
    
    if (authError) {
      console.error('Auth Error:', authError);
      return;
    }
    console.log('Got Auth Params:', authParams);

    // 2. Create a small dummy file
    const fileName = 'test_video.mp4';
    const filePath = './' + fileName;
    const content = Buffer.alloc(1024 * 1024); // 1MB
    fs.writeFileSync(filePath, content);
    console.log('Created 1MB dummy file.');

    // 3. Upload to ImageKit using fetch
    const formData = new FormData();
    // In Node, we can append a Blob or a File.
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: 'video/mp4' });
    
    formData.append('file', blob, fileName);
    formData.append('publicKey', IMAGEKIT_PUBLIC_KEY);
    formData.append('signature', authParams.signature);
    formData.append('expire', authParams.expire.toString());
    formData.append('token', authParams.token);
    formData.append('fileName', fileName);
    formData.append('folder', '/kph-videos-test');

    console.log('Uploading to ImageKit...');
    const startTime = Date.now();
    const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      body: formData
    });

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    if (response.ok) {
      const result = await response.json();
      console.log(`Upload Success in ${duration}s! URL:`, result.url);
    } else {
      const errorText = await response.text();
      console.error(`Upload Failed in ${duration}s: ${response.status}`, errorText);
    }

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testUpload();
