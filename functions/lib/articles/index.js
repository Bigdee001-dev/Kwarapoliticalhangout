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
exports.incrementArticleViews = exports.improveArticleHeadline = exports.suggestArticleTags = exports.scoreArticleQuality = exports.generateArticleSEO = exports.onArticleStatusChanged = exports.generateArticleSummary = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const errorHandler_1 = require("../utils/errorHandler");
const db_1 = require("../utils/db");
const gemini_1 = require("../utils/gemini");
const logger_1 = require("../utils/logger");
const resend_1 = require("../utils/resend");
const authUtils_1 = require("../utils/authUtils");
exports.generateArticleSummary = functions.https.onCall((0, errorHandler_1.wrapFunction)(async (data) => {
    const { content } = data;
    if (!content)
        throw new functions.https.HttpsError('invalid-argument', 'Content is required');
    const prompt = `Please summarize the following political news article from Kwara State in 3 sentences:\n\n${content}`;
    const summary = await (0, gemini_1.callGemini)(prompt);
    return { success: !!summary, summary };
}));
exports.onArticleStatusChanged = functions.firestore
    .document('articles/{articleId}')
    .onUpdate((0, errorHandler_1.wrapFunction)(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const { articleId } = context.params;
    if (before.status === after.status)
        return;
    const authorRef = db_1.db.collection('users').doc(after.authorId);
    const authorSnap = await authorRef.get();
    const authorData = authorSnap.data();
    const logActivity = async (action) => {
        await db_1.db.collection('activityLogs').add({
            action,
            targetType: 'article',
            targetId: articleId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
    };
    if (after.status === 'published') {
        await authorRef.update({
            articlesPublished: admin.firestore.FieldValue.increment(1)
        });
        if (after.category) {
            await db_1.db.collection('categories').doc(after.category).set({
                articleCount: admin.firestore.FieldValue.increment(1)
            }, { merge: true });
        }
        if (authorData.email) {
            await (0, resend_1.sendEmail)({
                to: authorData.email,
                subject: "Your article has been published on KPH News!",
                html: `<h2>Congratulations!</h2><p>Your article "<strong>${after.title}</strong>" is now live.</p><p>View it here: <a href="${process.env.APP_URL}/articles/${articleId}">Link</a></p>`
            });
        }
        await logActivity('ARTICLE_PUBLISHED');
    }
    else if (after.status === 'rejected') {
        const note = after.rejectionNote || 'No specific reason provided.';
        if (authorData.email) {
            await (0, resend_1.sendEmail)({
                to: authorData.email,
                subject: "Update on your article submission",
                html: `<h2>Submission Update</h2><p>Your article "<strong>${after.title}</strong>" was not approved for publication.</p><p><strong>Note:</strong> ${note}</p>`
            });
        }
    }
    else if (after.status === 'revision') {
        const note = after.revisionNote || 'Please review the editorial notes.';
        if (authorData.email) {
            await (0, resend_1.sendEmail)({
                to: authorData.email,
                subject: "Revision requested for your article",
                html: `<h2>Revision Required</h2><p>Your article "<strong>${after.title}</strong>" needs some changes before it can be published.</p><p><strong>Editorial Notes:</strong> ${note}</p>`
            });
        }
    }
    else if (after.status === 'archived' && before.status === 'published') {
        if (after.category) {
            await db_1.db.collection('categories').doc(after.category).update({
                articleCount: admin.firestore.FieldValue.increment(-1)
            });
        }
        await logActivity('ARTICLE_ARCHIVED');
    }
    await logger_1.logger.log('low', `Article ${articleId} status changed: ${before.status} -> ${after.status}`);
}));
exports.generateArticleSEO = functions.https.onCall((0, errorHandler_1.wrapFunction)(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Login required');
    if (!(await (0, authUtils_1.isEditorOrAdmin)(context.auth.uid)))
        throw new functions.https.HttpsError('permission-denied', 'No access');
    const { articleId } = data;
    if (!articleId)
        throw new functions.https.HttpsError('invalid-argument', 'articleId is required');
    const articleRef = db_1.db.collection('articles').doc(articleId);
    const articleSnap = await articleRef.get();
    if (!articleSnap.exists)
        throw new functions.https.HttpsError('not-found', 'Article not found');
    const article = articleSnap.data();
    const prompt = `You are an SEO expert. Given the following article, generate:
      1. seoTitle (max 60 chars, compelling, keyword-rich)
      2. seoDescription (max 155 chars, engaging summary)
      3. seoKeywords (array of 6-8 relevant keywords)
      Article title: ${article.title}
      Article content: ${article.content.substring(0, 500)}
      Respond ONLY in JSON: { "seoTitle": "...", "seoDescription": "...", "seoKeywords": ["..."] }`;
    const response = await (0, gemini_1.callGemini)(prompt);
    if (!response)
        throw new functions.https.HttpsError('internal', 'Gemini failed to generate response');
    try {
        const seo = JSON.parse(response.replace(/```json|```/g, '').trim());
        await articleRef.update(seo);
        return { success: true, seo };
    }
    catch (e) {
        await logger_1.logger.log('high', 'SEO JSON Parse Error', { response });
        throw new functions.https.HttpsError('internal', 'Invalid AI response format: ' + e.message);
    }
}));
exports.scoreArticleQuality = functions.https.onCall((0, errorHandler_1.wrapFunction)(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Login required');
    if (!(await (0, authUtils_1.isEditorOrAdmin)(context.auth.uid)))
        throw new functions.https.HttpsError('permission-denied', 'No access');
    const { articleId } = data;
    if (!articleId)
        throw new functions.https.HttpsError('invalid-argument', 'articleId is required');
    const articleRef = db_1.db.collection('articles').doc(articleId);
    const articleSnap = await articleRef.get();
    if (!articleSnap.exists)
        throw new functions.https.HttpsError('not-found', 'Article not found');
    const article = articleSnap.data();
    const prompt = `You are a senior editor. Score this article on 4 dimensions (each 0-25):
      1. Grammar & writing quality
      2. Length & depth (ideal: 500-2000 words)
      3. Readability & structure
      4. Originality & newsworthiness
      Article: ${article.content.substring(0, 3000)}
      Return ONLY JSON: { "total": 0, "grammar": 0, "length": 0, "readability": 0, "originality": 0, "summary": "..." }`;
    let response = null;
    try {
        response = await (0, gemini_1.callGemini)(prompt);
    }
    catch (e) {
        console.error('Gemini call failed:', e);
    }
    if (!response) {
        return {
            success: false,
            score: {
                total: 0,
                grammar: 0,
                length: 0,
                readability: 0,
                originality: 0,
                summary: "AI Editorial Audit is currently unavailable. Please review the article manually."
            }
        };
    }
    try {
        const score = JSON.parse(response.replace(/```json|```/g, '').trim());
        await articleRef.update({ aiQualityScore: score.total });
        return { success: true, score };
    }
    catch (e) {
        return {
            success: false,
            score: {
                total: 0,
                grammar: 0,
                length: 0,
                readability: 0,
                originality: 0,
                summary: "System was unable to parse AI response. Manual review required."
            }
        };
    }
}));
exports.suggestArticleTags = functions.region('europe-west3').https.onCall((0, errorHandler_1.wrapFunction)(async (data) => {
    const { title, excerpt } = data;
    const prompt = `Suggest 6 relevant tags for a political news article titled "${title}" with this excerpt: "${excerpt}". Return ONLY a JSON array of strings.`;
    const response = await (0, gemini_1.callGemini)(prompt);
    if (!response)
        return { tags: [] };
    try {
        const tags = JSON.parse(response.replace(/```json|```/g, '').trim());
        return { tags };
    }
    catch (e) {
        return { tags: [] };
    }
}));
exports.improveArticleHeadline = functions.region('europe-west3').https.onCall((0, errorHandler_1.wrapFunction)(async (data) => {
    const { title, excerpt } = data;
    const prompt = `Suggest 3 alternative compelling headlines for this article: "${title}". Excerpt: ${excerpt}. Return ONLY a JSON array of strings.`;
    const response = await (0, gemini_1.callGemini)(prompt);
    if (!response)
        return { headlines: [] };
    try {
        const headlines = JSON.parse(response.replace(/```json|```/g, '').trim());
        return { headlines };
    }
    catch (e) {
        return { headlines: [] };
    }
}));
exports.incrementArticleViews = functions.region('europe-west3').https.onCall((0, errorHandler_1.wrapFunction)(async (data) => {
    const { articleId } = data;
    if (!articleId)
        throw new functions.https.HttpsError('invalid-argument', 'articleId is required');
    await db_1.db.collection('articles').doc(articleId).update({
        views: admin.firestore.FieldValue.increment(1)
    });
    return { success: true };
}));
//# sourceMappingURL=index.js.map