// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.4"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ""
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ""
const SITE_URL = "https://www.kwarapoliticalhangout.com.ng"

// Default fallback logic is now handled dynamically within the serve function

/**
 * Builds a complete, self-contained HTML page with article-specific
 * Open Graph / Twitter meta tags injected.
 */
function buildMetaHtml(title: string, description: string, image: string, canonical: string): string {
  // Escape content to prevent XSS in meta attributes
  const esc = (s: string) => s.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const t = esc(title)
  const d = esc(description.replace(/\s+/g, ' ').trim())
  const img = esc(image)
  const url = esc(canonical)

  const imageTags = img ? `
  <meta property="og:image" content="${img}">
  <meta property="og:image:secure_url" content="${img}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${t}">
  <meta name="twitter:image" content="${img}">
  <meta name="twitter:image:alt" content="${t}">` : ''

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

  <!-- Canonical -->
  <link rel="canonical" href="${url}">

  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="KPH News">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${t}">
  <meta property="og:description" content="${d}">${imageTags}

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@KPHNews">
  <meta name="twitter:url" content="${url}">
  <meta name="twitter:title" content="${t}">
  <meta name="twitter:description" content="${d}">

  <!-- Immediately redirect real browsers to the React SPA. -->
  <noscript>
    <meta http-equiv="refresh" content="0; url=${url}">
  </noscript>
</head>
<body>
  <script>
    window.location.replace("${url}");
  </script>
  <h1>${t}</h1>
  <p>${d}</p>
  ${img ? `<img src="${img}" alt="${t}" style="max-width:100%; height:auto;">` : ''}
  <a href="${url}">Read the full article on KPH News</a>
</body>
</html>`
}

serve(async (req: Request) => {
  const url = new URL(req.url)
  console.log(`[Request] ${req.method} ${url.pathname}${url.search}`)

  // Extract article ID from path or query param
  // Path format: /render-article/ARTICLE_ID or /render-article/ARTICLE_ID/
  let articleId = ""
  
  // 1. Check path parts, filtering out empty strings from trailing slashes
  const pathParts = url.pathname.split('/').filter(Boolean)
  if (pathParts.length > 0 && pathParts[0] === 'render-article') {
    articleId = pathParts[pathParts.length - 1]
  } else if (pathParts.length > 0) {
    // If it's just /ID (directly on function URL)
    articleId = pathParts[pathParts.length - 1]
  }

  // 2. Fallback to query param ?id=...
  if (!articleId || articleId === 'render-article') {
    articleId = url.searchParams.get('id') || ""
  }

  console.log(`[ArticleID] Extracted: "${articleId}"`)

  if (!articleId) {
    console.warn('[Redirect] No articleId found, redirecting to home')
    return Response.redirect(SITE_URL, 302)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  try {
    // Fetch article from Supabase
    console.log(`[DB] Fetching article ${articleId}...`)
    const { data: article, error } = await supabase
      .from('articles')
      .select('id, title, excerpt, content, image_url, imageUrl, category, date')
      .eq('id', articleId)
      .single()

    if (error || !article) {
      console.error(`[Error] Article not found or DB error:`, error)
      return Response.redirect(SITE_URL, 302)
    }

    console.log(`[Success] Article found: "${article.title}"`)

    // Extraction logic for the image
    let image = article.image_url || article.imageUrl || ""
    
    if (!image && article.content) {
      // 1. Try HTML <img> tags
      const imgMatch = article.content.match(/<img.*?src=["'](.*?)["']/i)
      if (imgMatch && imgMatch[1]) {
        image = imgMatch[1]
        console.log(`[Image] Extracted from HTML: ${image}`)
      } else {
        // 2. Try Markdown ![alt](url) tags
        const mdMatch = article.content.match(/!\[.*?\]\((.*?)\)/i)
        if (mdMatch && mdMatch[1]) {
          image = mdMatch[1]
          console.log(`[Image] Extracted from Markdown: ${image}`)
        }
      }
    }

    if (!image) {
      console.log(`[Image] No image found for article.`)
      image = ""
    } else {
      console.log(`[Image] Final image URL: ${image}`)
    }

    const title = `${article.title} | KPH News`
    const description = (article.excerpt || "") 
      || (article.content ? article.content.replace(/<[^>]*>/g, '').substring(0, 160) : "")
      || `Read the latest ${article.category || 'political'} news from Kwara State.`
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
