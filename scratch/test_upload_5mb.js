
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ajqzyygzgjrydxilzzto.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqcXp5eWd6Z2pyeWR4aWx6enRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNjE2ODUsImV4cCI6MjA5MzgzNzY4NX0.fQ_JsXeM4rhgwRwkxDds06RH-OLXi7pAtUCE76jWjm0';
const IMAGEKIT_PUBLIC_KEY = 'public_3Kgzl+BuilYxsQke9HXDIqT82CA=';

async function testUpload() {
  console.log('Starting 5MB upload test...');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: authParams } = await supabase.functions.invoke('imagekit-auth');
    
    const fileName = 'test_video_5mb.mp4';
    const filePath = './' + fileName;
    const content = Buffer.alloc(5 * 1024 * 1024); // 5MB
    fs.writeFileSync(filePath, content);

    const formData = new FormData();
    const blob = new Blob([fs.readFileSync(filePath)], { type: 'video/mp4' });
    
    formData.append('file', blob, fileName);
    formData.append('publicKey', IMAGEKIT_PUBLIC_KEY);
    formData.append('signature', authParams.signature);
    formData.append('expire', authParams.expire.toString());
    formData.append('token', authParams.token);
    formData.append('fileName', fileName);
    formData.append('folder', '/kph-videos-test');

    const startTime = Date.now();
    const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      body: formData
    });

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    if (response.ok) {
      console.log(`Upload Success in ${duration}s! Rate: ${(5/duration).toFixed(2)} MB/s`);
    } else {
      console.error(`Upload Failed: ${response.status}`, await response.text());
    }

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error(err);
  }
}

testUpload();
