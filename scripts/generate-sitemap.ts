
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const siteUrl = process.env.APP_URL || 'https://www.kwarapoliticalhangout.com.ng';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function generateSitemap() {
  console.log('🚀 Generating sitemap...');

  try {
    // 1. Fetch all published articles
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, date, updated_at')
      .eq('status', 'published')
      .order('date', { ascending: false });

    if (error) throw error;

    // 2. Define static pages
    const staticPages = [
      '',
      '/news',
      '/about',
      '/contact',
      '/people',
    ];

    // 3. Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Add static pages
    staticPages.forEach(page => {
      xml += `  <url>\n`;
      xml += `    <loc>${siteUrl}${page}</loc>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n`;
      xml += `  </url>\n`;
    });

    // Add dynamic articles
    articles?.forEach(article => {
      const date = article.updated_at || article.date || new Date().toISOString();
      xml += `  <url>\n`;
      xml += `    <loc>${siteUrl}/article/${article.id}</loc>\n`;
      xml += `    <lastmod>${new Date(date).toISOString().split('T')[0]}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    // 4. Write to public folder
    const publicPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    fs.writeFileSync(publicPath, xml);

    console.log(`✅ Sitemap generated at ${publicPath}`);
    console.log(`📊 Total URLs: ${staticPages.length + (articles?.length || 0)}`);
  } catch (error) {
    console.error('❌ Failed to generate sitemap:', error);
    process.exit(1);
  }
}

generateSitemap();
