
import * as functions from 'firebase-functions/v1';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Use environment variables for Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

export const renderArticle = functions.https.onRequest(async (req, res) => {
  // Extract article ID from the path (e.g., /article/123)
  const pathParts = req.path.split('/');
  const articleId = pathParts[pathParts.length - 1];

  if (!articleId || articleId === 'article') {
    res.redirect('/');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // 1. Fetch article from Supabase
    const { data: article, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (error || !article) {
      console.warn(`Article not found: ${articleId}`);
      res.redirect('/');
      return;
    }

    // 2. Load the index.html template
    // In production, the file is in the root of the functions folder
    const indexPath = path.join(__dirname, '../../template.html');
    let html = '';
    
    try {
      html = fs.readFileSync(indexPath, 'utf-8');
    } catch (e) {
      // Fallback if public/index.html is not found (e.g. if we should use a copy in lib)
      html = `<!DOCTYPE html><html><head><!-- PREVIEW_PLACEHOLDER --></head><body><div id="root"></div></body></html>`;
    }

    // 3. Prepare Metadata
    const title = `${article.title} | KPH News`;
    const description = article.excerpt || 'Read the latest political news from Kwara State.';
    const image = article.image_url || article.imageUrl || 'https://res.cloudinary.com/dohuj4mx9/image/upload/v1778018185/hd_restoration_result_image_6_xejnhg.png';
    const url = `https://www.kwarapoliticalhangout.com.ng/article/${articleId}`;

    // 4. Inject Meta Tags
    const metaTags = `
      <title>${title}</title>
      <meta name="description" content="${description}">
      
      <!-- Open Graph / Facebook -->
      <meta property="og:type" content="article">
      <meta property="og:url" content="${url}">
      <meta property="og:title" content="${title}">
      <meta property="og:description" content="${description}">
      <meta property="og:image" content="${image}">
      <meta property="og:image:width" content="1200">
      <meta property="og:image:height" content="630">

      <!-- Twitter -->
      <meta property="twitter:card" content="summary_large_image">
      <meta property="twitter:url" content="${url}">
      <meta property="twitter:title" content="${title}">
      <meta property="twitter:description" content="${description}">
      <meta property="twitter:image" content="${image}">
    `;

    // 5. Strip existing meta tags to prevent crawler confusion
    // We remove title, description, and any og: or twitter: tags
    let finalHtml = html
      .replace(/<title>.*?<\/title>/gi, '')
      .replace(/<meta name=["']description["'].*?>/gi, '')
      .replace(/<meta property=["']og:.*?["'].*?>/gi, '')
      .replace(/<meta name=["']twitter:.*?["'].*?>/gi, '')
      .replace(/<meta property=["']twitter:.*?["'].*?>/gi, '');

    // Replace the placeholder
    finalHtml = finalHtml.replace('<!-- PREVIEW_PLACEHOLDER -->', metaTags);

    // 6. Send the modified HTML
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=7200');
    res.status(200).send(finalHtml);

  } catch (error) {
    console.error('Render error:', error);
    res.status(500).send('Internal Server Error');
  }
});
