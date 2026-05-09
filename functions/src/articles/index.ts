import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { wrapFunction } from '../utils/errorHandler';
import { db } from '../utils/db';
import { callGemini } from '../utils/gemini';
import { logger } from '../utils/logger';
import { sendEmail } from '../utils/resend';
import { isEditorOrAdmin } from '../utils/authUtils';
import { UserProfile, Article } from '../types';

export const generateArticleSummary = functions.https.onCall(wrapFunction(async (data) => {
    const { content } = data;
    if (!content) throw new functions.https.HttpsError('invalid-argument', 'Content is required');
    
    const prompt = `Please summarize the following political news article from Kwara State in 3 sentences:\n\n${content}`;
    const summary = await callGemini(prompt);
    
    return { success: !!summary, summary };
  }));

export const onArticleStatusChanged = functions.firestore
  .document('articles/{articleId}')
  .onUpdate(wrapFunction(async (change, context) => {
      const before = change.before.data() as Article;
      const after = change.after.data() as Article;
      const { articleId } = context.params;

      if (before.status === after.status) return;

      const authorRef = db.collection('users').doc(after.authorId);
      const authorSnap = await authorRef.get();
      const authorData = authorSnap.data() as UserProfile;

      // Log activity helper
      const logActivity = async (action: string) => {
        await db.collection('activityLogs').add({
          action,
          targetType: 'article',
          targetId: articleId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      };

      if (after.status === 'published') {
        // Increment user and category counts
        await authorRef.update({
          articlesPublished: admin.firestore.FieldValue.increment(1)
        });
        
        if (after.category) {
          await db.collection('categories').doc(after.category).set({
            articleCount: admin.firestore.FieldValue.increment(1)
          }, { merge: true });
        }

        if (authorData.email) {
          await sendEmail({
            to: authorData.email,
            subject: "Your article has been published on KPH News!",
            html: `<h2>Congratulations!</h2><p>Your article "<strong>${after.title}</strong>" is now live.</p><p>View it here: <a href="${process.env.APP_URL}/articles/${articleId}">Link</a></p>`
          });
        }
        await logActivity('ARTICLE_PUBLISHED');
      } 
      else if (after.status === 'rejected') {
        const note = (after as any).rejectionNote || 'No specific reason provided.';
        if (authorData.email) {
          await sendEmail({
            to: authorData.email,
            subject: "Update on your article submission",
            html: `<h2>Submission Update</h2><p>Your article "<strong>${after.title}</strong>" was not approved for publication.</p><p><strong>Note:</strong> ${note}</p>`
          });
        }
      }
      else if (after.status === 'revision') {
        const note = (after as any).revisionNote || 'Please review the editorial notes.';
        if (authorData.email) {
          await sendEmail({
            to: authorData.email,
            subject: "Revision requested for your article",
            html: `<h2>Revision Required</h2><p>Your article "<strong>${after.title}</strong>" needs some changes before it can be published.</p><p><strong>Editorial Notes:</strong> ${note}</p>`
          });
        }
      }
      else if (after.status === 'archived' && before.status === 'published') {
        if (after.category) {
          await db.collection('categories').doc(after.category).update({
            articleCount: admin.firestore.FieldValue.increment(-1)
          });
        }
        await logActivity('ARTICLE_ARCHIVED');
      }

      await logger.log('low', `Article ${articleId} status changed: ${before.status} -> ${after.status}`);
  }));

export const generateArticleSEO = functions.https.onCall(wrapFunction(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
    if (!(await isEditorOrAdmin(context.auth.uid))) throw new functions.https.HttpsError('permission-denied', 'No access');

    const { articleId } = data;
    if (!articleId) throw new functions.https.HttpsError('invalid-argument', 'articleId is required');
    
    const articleRef = db.collection('articles').doc(articleId);
    const articleSnap = await articleRef.get();
    if (!articleSnap.exists) throw new functions.https.HttpsError('not-found', 'Article not found');
    const article = articleSnap.data() as Article;

    const prompt = `You are an SEO expert. Given the following article, generate:
      1. seoTitle (max 60 chars, compelling, keyword-rich)
      2. seoDescription (max 155 chars, engaging summary)
      3. seoKeywords (array of 6-8 relevant keywords)
      Article title: ${article.title}
      Article content: ${article.content.substring(0, 500)}
      Respond ONLY in JSON: { "seoTitle": "...", "seoDescription": "...", "seoKeywords": ["..."] }`;

    const response = await callGemini(prompt);
    if (!response) throw new functions.https.HttpsError('internal', 'Gemini failed to generate response');

    try {
      const seo = JSON.parse(response.replace(/```json|```/g, '').trim());
      await articleRef.update(seo);
      return { success: true, seo };
    } catch (e: any) {
      await logger.log('high', 'SEO JSON Parse Error', { response });
      throw new functions.https.HttpsError('internal', 'Invalid AI response format: ' + e.message);
    }
  }));

export const scoreArticleQuality = functions.https.onCall(wrapFunction(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
    if (!(await isEditorOrAdmin(context.auth.uid))) throw new functions.https.HttpsError('permission-denied', 'No access');

    const { articleId } = data;
    if (!articleId) throw new functions.https.HttpsError('invalid-argument', 'articleId is required');
    
    const articleRef = db.collection('articles').doc(articleId);
    const articleSnap = await articleRef.get();
    if (!articleSnap.exists) throw new functions.https.HttpsError('not-found', 'Article not found');
    const article = articleSnap.data() as Article;

    const prompt = `You are a senior editor. Score this article on 4 dimensions (each 0-25):
      1. Grammar & writing quality
      2. Length & depth (ideal: 500-2000 words)
      3. Readability & structure
      4. Originality & newsworthiness
      Article: ${article.content.substring(0, 3000)}
      Return ONLY JSON: { "total": 0, "grammar": 0, "length": 0, "readability": 0, "originality": 0, "summary": "..." }`;

    let response: string | null = null;
    try {
      response = await callGemini(prompt);
    } catch (e) {
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
    } catch (e: any) {
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

export const suggestArticleTags = functions.region('europe-west3').https.onCall(wrapFunction(async (data) => {
    const { title, excerpt } = data;
    const prompt = `Suggest 6 relevant tags for a political news article titled "${title}" with this excerpt: "${excerpt}". Return ONLY a JSON array of strings.`;
    
    const response = await callGemini(prompt);
    if (!response) return { tags: [] };

    try {
      const tags = JSON.parse(response.replace(/```json|```/g, '').trim());
      return { tags };
    } catch (e) {
      return { tags: [] };
    }
  }));

export const improveArticleHeadline = functions.region('europe-west3').https.onCall(wrapFunction(async (data) => {
    const { title, excerpt } = data;
    const prompt = `Suggest 3 alternative compelling headlines for this article: "${title}". Excerpt: ${excerpt}. Return ONLY a JSON array of strings.`;
    
    const response = await callGemini(prompt);
    if (!response) return { headlines: [] };

    try {
      const headlines = JSON.parse(response.replace(/```json|```/g, '').trim());
      return { headlines };
    } catch (e) {
      return { headlines: [] };
    }
  }));

export const incrementArticleViews = functions.region('europe-west3').https.onCall(wrapFunction(async (data) => {
    const { articleId } = data;
    if (!articleId) throw new functions.https.HttpsError('invalid-argument', 'articleId is required');
    
    await db.collection('articles').doc(articleId).update({
      views: admin.firestore.FieldValue.increment(1)
    });
    
    return { success: true };
  }));
export * from './renderer';
