// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

declare const Deno: any;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function generateSlug(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .normalize('NFD') // Decompose accents
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Trim hyphens
}

serve(async (req: Request) => {
  try {
    // Determine the base URL (this would be your production URL in real life)
    const url = new URL(req.url);
    const origin = Deno.env.get("APP_URL") || "https://kwarapoliticalhangout.com"; // Replace with real production URL later

    // Fetch the 1000 most recent published articles
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, updated_at, created_at, category')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      throw error;
    }

    // Start building XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    const staticPages = [
      '/',
      '/news',
      '/politics',
      '/sports',
      '/about',
      '/contact'
    ];

    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${origin}${page}</loc>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>${page === '/' ? '1.0' : '0.8'}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Article pages
    if (articles) {
      for (const article of articles) {
        const dateToUse = article.updated_at || article.created_at;
        const lastmod = new Date(dateToUse).toISOString();
        const slug = generateSlug(article.title);
        
        let path = `/article/${slug}-${article.id}`;
        if (article.category?.toLowerCase() === 'sports') {
           path = `/sports/article/${slug}-${article.id}`;
        }

        xml += `  <url>\n`;
        xml += `    <loc>${origin}${path}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>never</changefreq>\n`;
        xml += `    <priority>0.6</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600"
      },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
