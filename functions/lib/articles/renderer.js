"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderArticle = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const supabase_js_1 = require("@supabase/supabase-js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
exports.renderArticle = functions.https.onRequest(async (req, res) => {
    const pathParts = req.path.split('/');
    const articleId = pathParts[pathParts.length - 1];
    if (!articleId || articleId === 'article') {
        res.redirect('/');
        return;
    }
    const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
    try {
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
        const indexPath = path.join(__dirname, '../../template.html');
        let html = '';
        try {
            html = fs.readFileSync(indexPath, 'utf-8');
        }
        catch (e) {
            html = `<!DOCTYPE html><html><head><!-- PREVIEW_PLACEHOLDER --></head><body><div id="root"></div></body></html>`;
        }
        const title = `${article.title} | KPH News`;
        const description = article.excerpt || 'Read the latest political news from Kwara State.';
        const image = article.image_url || 'https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=1200&h=630&auto=format&fit=crop';
        const url = `https://www.kwarapoliticalhangout.com.ng/article/${articleId}`;
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
        let finalHtml = html
            .replace(/<title>.*?<\/title>/gi, '')
            .replace(/<meta name=["']description["'].*?>/gi, '')
            .replace(/<meta property=["']og:.*?["'].*?>/gi, '')
            .replace(/<meta name=["']twitter:.*?["'].*?>/gi, '')
            .replace(/<meta property=["']twitter:.*?["'].*?>/gi, '');
        finalHtml = finalHtml.replace('<!-- PREVIEW_PLACEHOLDER -->', metaTags);
        res.set('Cache-Control', 'public, max-age=3600, s-maxage=7200');
        res.status(200).send(finalHtml);
    }
    catch (error) {
        console.error('Render error:', error);
        res.status(500).send('Internal Server Error');
    }
});
//# sourceMappingURL=renderer.js.map