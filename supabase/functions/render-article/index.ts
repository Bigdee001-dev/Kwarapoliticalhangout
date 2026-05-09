// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.4"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ""
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ""
const SITE_URL = "https://www.kwarapoliticalhangout.com.ng"

// Default fallback image for articles without one
const DEFAULT_IMAGE = "https://res.cloudinary.com/dohuj4mx9/image/upload/v1778018185/hd_restoration_result_image_6_xejnhg.png"

/**
 * Builds a complete, self-contained HTML page with article-specific
 * Open Graph / Twitter meta tags injected.
 * 
 * Social media crawlers (WhatsApp, Facebook, Twitter/X) do NOT execute
 * JavaScript. They must receive the correct meta tags in the raw HTML on
 * the very first request — this function does exactly that, then redirects
 * browsers to the React SPA to render the full article.
 */
function buildMetaHtml(title: string, description: string, image: string, canonical: string): string {
  // Escape content to prevent XSS in meta attributes
  const esc = (s: string) => s.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const t = esc(title)
  const d = esc(description)
  const img = esc(image)
  const url = esc(canonical)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- Primary Meta Tags -->
  <title>${t}</title>
  <meta name="title" content="${t}">
  <meta name="description" content="${d}">
  <meta name="theme-color" content="#8B0000">
  <meta name="google-site-verification" content="2Xt3Pvk2oeGHg68uf5hyhFQvzrWijYEToNDkp0s1KWQ">

  <!-- Canonical -->
  <link rel="canonical" href="${url}">

  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="KPH News">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${t}">
  <meta property="og:description" content="${d}">
  <meta property="og:image" content="${img}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${t}">

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@KPHNews">
  <meta name="twitter:url" content="${url}">
  <meta name="twitter:title" content="${t}">
  <meta name="twitter:description" content="${d}">
  <meta name="twitter:image" content="${img}">
  <meta name="twitter:image:alt" content="${t}">

  <!-- Favicon -->
  <link rel="icon" type="image/png"
    href="https://res.cloudinary.com/dohuj4mx9/image/upload/v1778018185/hd_restoration_result_image_6_xejnhg.png" />

  <!-- Immediately redirect real browsers to the React SPA.
       Social crawlers ignore <noscript> and meta refresh, so they
       stay and read the meta tags above. Browsers get the full app. -->
  <noscript>
    <meta http-equiv="refresh" content="0; url=${url}">
  </noscript>
</head>
<body>
  <script>
    // Redirect JS-enabled browsers to the SPA immediately
    window.location.replace("${url}");
  </script>
  <!-- Fallback content for crawlers that render the body -->
  <h1>${t}</h1>
  <p>${d}</p>
  <img src="${img}" alt="${t}" width="1200" height="630">
  <a href="${url}">Read the full article on KPH News</a>
</body>
</html>`
}

serve(async (req: Request) => {
  const url = new URL(req.url)

  // Extract article ID from path: /render-article/ARTICLE_ID
  const pathParts = url.pathname.split('/')
  const articleId = pathParts[pathParts.length - 1]

  if (!articleId || articleId === 'render-article') {
    return Response.redirect(SITE_URL, 302)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  try {
    // Fetch article from Supabase
    const { data: article, error } = await supabase
      .from('articles')
      .select('id, title, excerpt, image_url, imageUrl, category, date')
      .eq('id', articleId)
      .single()

    if (error || !article) {
      console.error('Article fetch error:', error)
      return Response.redirect(SITE_URL, 302)
    }

    const title = `${article.title} | KPH News`
    const description = article.excerpt
      || `Read the latest ${article.category || 'political'} news from Kwara State.`
    const image = article.image_url || article.imageUrl || DEFAULT_IMAGE
    const canonical = `${SITE_URL}/article/${articleId}`

    const html = buildMetaHtml(title, description, image, canonical)

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        // Cache 1 hour on CDN, revalidate every 5 minutes
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
      },
      status: 200,
    })

  } catch (err) {
    console.error('Edge Function Error:', err)
    return Response.redirect(`${SITE_URL}/article/${articleId}`, 302)
  }
})
