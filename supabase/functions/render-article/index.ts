
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.4"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ""
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ""
const SITE_URL = "https://www.kwarapoliticalhangout.com.ng"

serve(async (req: Request) => {
  const url = new URL(req.url)
  // Extract ID from path like /render-article/ID
  const pathParts = url.pathname.split('/')
  const articleId = pathParts[pathParts.length - 1]

  if (!articleId || articleId === 'render-article') {
    return Response.redirect(SITE_URL, 302)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  try {
    // 1. Fetch article data
    const { data: article, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single()

    if (error || !article) {
      console.error('Article fetch error:', error)
      return Response.redirect(SITE_URL, 302)
    }

    // 2. Fetch the current index.html from the production site
    // This ensures we always have the latest JS/CSS bundles
    const indexRes = await fetch(SITE_URL)
    let html = await indexRes.text()

    // 3. Prepare Metadata
    const title = `${article.title} | KPH News`
    const description = article.excerpt || 'Unbiased political news, government analysis, and community engagement in Kwara State.'
    const image = article.image_url || 'https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=1200&h=630&auto=format&fit=crop'
    const canonical = `${SITE_URL}/article/${articleId}`

    // 4. Inject Meta Tags
    const metaTags = `
      <title>${title}</title>
      <meta name="description" content="${description}">
      
      <!-- Open Graph / Facebook -->
      <meta property="og:type" content="article">
      <meta property="og:url" content="${canonical}">
      <meta property="og:title" content="${title}">
      <meta property="og:description" content="${description}">
      <meta property="og:image" content="${image}">
      <meta property="og:image:width" content="1200">
      <meta property="og:image:height" content="630">

      <!-- Twitter -->
      <meta property="twitter:card" content="summary_large_image">
      <meta property="twitter:url" content="${canonical}">
      <meta property="twitter:title" content="${title}">
      <meta property="twitter:description" content="${description}">
      <meta property="twitter:image" content="${image}">
    `

    // Replace the placeholder in the fetched HTML
    // We also remove the default title and description if they exist to avoid duplicates
    html = html.replace(/<title>.*?<\/title>/g, '')
    html = html.replace(/<meta name="description".*?>/g, '')
    html = html.replace('<!-- PREVIEW_PLACEHOLDER -->', metaTags)

    return new Response(html, {
      headers: { 
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=7200'
      },
      status: 200,
    })

  } catch (error) {
    console.error('Edge Function Error:', error)
    return Response.redirect(SITE_URL, 302)
  }
})
