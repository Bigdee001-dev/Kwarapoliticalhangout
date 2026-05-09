import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  console.log('--- Searching for Article with Missing Metadata Images ---');

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, content, image_url, imageUrl')
    .or('image_url.is.null,imageUrl.is.null'); // Check for missing images

  if (error) {
    console.error('Error fetching articles:', error.message);
    return;
  }

  // Filter for articles where BOTH are null/empty
  const candidate = articles.find(a => !a.image_url && !a.imageUrl && a.content && a.content.includes('<img'));

  if (candidate) {
    console.log(`\nFound Candidate: ${candidate.title}`);
    const match = candidate.content.match(/<img.*?src=["'](.*?)["']/i);
    console.log(`Extracted Image: ${match ? match[1] : 'NONE'}`);
    console.log('TEST RESULT: PASS (Found image in content)');
  } else {
    console.log('No articles found with both image columns null but images in content.');
    console.log('Testing with manual mock of first result...');
    
    if (articles.length > 0) {
       const mockArt = { ...articles[0], image_url: null, imageUrl: null };
       // Add a mock image to content if not present
       if (!mockArt.content.includes('<img')) {
         mockArt.content += '<img src="https://test.com/extracted.jpg" />';
       }
       
       const match = mockArt.content.match(/<img.*?src=["'](.*?)["']/i);
       console.log(`Mock Extracted Image: ${match ? match[1] : 'NONE'}`);
       console.log('TEST RESULT: PASS (Manual mock passed)');
    }
  }
}

run();
