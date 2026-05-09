import React, { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  url?: string;
  type?: 'website' | 'article';
  author?: string;
  date?: string;
  category?: string;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  image = 'https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=1200&h=630&auto=format&fit=crop',
  imageAlt = 'KPH News - Kwara Political Hangout',
  url,
  type = 'website',
  author,
  date,
  category
}) => {
  const fullUrl = url || window.location.href;

  useEffect(() => {
    // 1. Update Document Title
    document.title = title;

    // 2. Helper function to update or create meta tags
    const updateMeta = (name: string, content: string, attr: string = 'name') => {
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 3. Update Standard Tags
    updateMeta('description', description);

    // 4. Update Open Graph (Facebook/LinkedIn/WhatsApp)
    updateMeta('og:title', title, 'property');
    updateMeta('og:description', description, 'property');
    updateMeta('og:image', image, 'property');
    updateMeta('og:image:alt', imageAlt, 'property');
    updateMeta('og:url', fullUrl, 'property');
    updateMeta('og:type', type, 'property');
    updateMeta('og:site_name', 'KPH News', 'property');

    // Ensure image dimensions are standard for cards
    updateMeta('og:image:width', '1200', 'property');
    updateMeta('og:image:height', '630', 'property');

    // 5. Update Twitter Cards
    updateMeta('twitter:card', 'summary_large_image', 'property');
    updateMeta('twitter:title', title, 'property');
    updateMeta('twitter:description', description, 'property');
    updateMeta('twitter:image', image, 'property');
    updateMeta('twitter:image:alt', imageAlt, 'property');

    // 6. JSON-LD Structured Data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": type === 'article' ? "NewsArticle" : "WebSite",
      "headline": title,
      "description": description,
      "image": [image],
      "url": fullUrl,
      ...(type === 'article' && {
        "datePublished": date,
        "dateModified": date,
        "author": [{
          "@type": "Person",
          "name": author || "KPH News Staff",
          "url": "https://kphnews.com/about"
        }],
        "publisher": {
          "@type": "Organization",
          "name": "KPH News",
          "logo": {
            "@type": "ImageObject",
            "url": "https://res.cloudinary.com/dohuj4mx9/image/upload/v1778018185/hd_restoration_result_image_6_xejnhg.png"
          }
        },
        "articleSection": category
      })
    };

    // Update or create script tag for JSON-LD
    let scriptTag = document.getElementById('json-ld-seo') as HTMLScriptElement;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'json-ld-seo';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.text = JSON.stringify(structuredData);

    // 7. Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', fullUrl);

  }, [title, description, image, imageAlt, fullUrl, type, author, date, category]);

  return null;
};

export default SEO;