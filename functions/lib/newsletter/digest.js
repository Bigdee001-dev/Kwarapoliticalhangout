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
exports.sendWeeklyDigest = exports.generateWeeklyDigest = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const errorHandler_1 = require("../utils/errorHandler");
const db_1 = require("../utils/db");
const gemini_1 = require("../utils/gemini");
const logger_1 = require("../utils/logger");
const resend_1 = require("../utils/resend");
const authUtils_1 = require("../utils/authUtils");
const APP_URL = process.env.APP_URL || 'https://kph.com.ng';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@kph.com.ng';
exports.generateWeeklyDigest = functions.pubsub
    .schedule('0 20 * * 0')
    .timeZone('Africa/Lagos')
    .onRun((0, errorHandler_1.wrapFunction)(async (context) => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const articlesSnap = await db_1.db.collection('articles')
        .where('status', '==', 'published')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(sevenDaysAgo))
        .get();
    let articles = articlesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    articles.sort((a, b) => {
        const scoreA = (a.views || 0) + (a.likes || 0);
        const scoreB = (b.views || 0) + (b.likes || 0);
        return scoreB - scoreA;
    });
    articles = articles.slice(0, 10);
    if (articles.length < 3) {
        await logger_1.logger.log('medium', 'Weekly digest aborted: fewer than 3 articles published this week.');
        return null;
    }
    const prompt = `You are an editorial AI for Kwara Political Hangout, a Nigerian political news platform.
Below are this week's top articles. For each, write a 2-sentence summary.
Also write a 3-sentence week-in-review intro paragraph.
Also extract one compelling quote from any of the articles below.

Articles:
${articles.map(a => `ID: ${a.id}\nTitle: ${a.title}\nExcerpt: ${a.excerpt || a.content.substring(0, 200)}`).join('\n\n')}

Respond ONLY in this JSON format:
{
  "intro": "...",
  "quote": { "text": "...", "articleId": "..." },
  "summaries": [
    { "articleId": "...", "summary": "..." }
  ]
}`;
    const aiResponse = await (0, gemini_1.callGemini)(prompt);
    let digestData = {
        intro: "Welcome to this week's Political Hangout. Here's a review of the most impactful stories shaping the political landscape in Kwara.",
        quote: { text: "Politics is not a game of chance, but of strategic engagement.", articleId: articles[0].id },
        summaries: articles.map(a => ({ articleId: a.id, summary: a.excerpt || a.content.substring(0, 150) + '...' }))
    };
    if (aiResponse) {
        try {
            const parsed = JSON.parse(aiResponse.replace(/```json|```/g, '').trim());
            digestData = { ...digestData, ...parsed };
        }
        catch (e) {
            await logger_1.logger.log('high', 'Failed to parse Gemini digest response', { aiResponse });
        }
    }
    const topStory = articles[0];
    const categoryPicks = articles.slice(1, 5);
    const peopleSnap = await db_1.db.collection('people').limit(20).get();
    const randomPerson = peopleSnap.docs[Math.floor(Math.random() * peopleSnap.docs.length)]?.data();
    const dateStr = `${sevenDaysAgo.toLocaleDateString()} - ${now.toLocaleDateString()}`;
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eeeeee; }
            .header { text-align: center; border-bottom: 3px solid #2F4F4F; padding-bottom: 10px; margin-bottom: 20px; }
            .header img { max-width: 150px; }
            .header h1 { color: #2F4F4F; margin: 10px 0 0 0; font-size: 24px; }
            .intro { font-style: italic; color: #555; margin-bottom: 30px; }
            .top-story { margin-bottom: 30px; }
            .top-story img { width: 100%; height: auto; border-radius: 8px; }
            .top-story h2 { color: #2F4F4F; margin: 15px 0 10px 0; }
            .grid { display: flex; flex-wrap: wrap; margin: -10px; }
            .grid-item { box-sizing: border-box; width: 50%; padding: 10px; }
            .card { background: #f9f9f9; border-radius: 8px; padding: 15px; height: 100%; border: 1px solid #eeeeee; }
            .card h3 { font-size: 16px; margin: 0 0 10px 0; color: #2F4F4F; }
            .quote-section { background: #2F4F4F; color: white; padding: 30px; border-radius: 8px; margin: 30px 0; text-align: center; }
            .quote-text { font-size: 20px; font-weight: bold; margin-bottom: 15px; }
            .quote-author { font-size: 14px; opacity: 0.8; }
            .spotlight { display: flex; align-items: center; background: #f0f4f4; padding: 20px; border-radius: 8px; margin-top: 30px; }
            .spotlight-img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-right: 20px; }
            .footer { text-align: center; font-size: 12px; color: #999; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eeeeee; }
            .btn { background: #2F4F4F; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>This Week in Kwara Politics</h1>
              <p>${dateStr}</p>
            </div>
            
            <div class="intro">${digestData.intro}</div>
            
            <div class="top-story">
              ${topStory.imageUrl ? `<img src="${topStory.imageUrl}" alt="${topStory.title}">` : ''}
              <h2>${topStory.title}</h2>
              <p>${digestData.summaries.find(s => s.articleId === topStory.id)?.summary || topStory.excerpt}</p>
              <a href="${APP_URL}/articles/${topStory.id}" class="btn">Read Full Story</a>
            </div>
            
            <div class="grid">
              ${categoryPicks.map(a => `
                <div class="grid-item">
                  <div class="card">
                    <h3>${a.title}</h3>
                    <p style="font-size: 13px;">${digestData.summaries.find(s => s.articleId === a.id)?.summary.substring(0, 100)}...</p>
                    <a href="${APP_URL}/articles/${a.id}" style="color: #2F4F4F; font-size: 12px; font-weight: bold; text-decoration: none;">View Story &rarr;</a>
                  </div>
                </div>
              `).join('')}
            </div>
            
            <div class="quote-section">
              <div class="quote-text">"${digestData.quote.text}"</div>
              <div class="quote-author">— From the article: <em>${articles.find(a => a.id === digestData.quote.articleId)?.title || 'Top Story'}</em></div>
            </div>
            
            ${randomPerson ? `
              <div class="spotlight">
                ${randomPerson.imageUrl ? `<img src="${randomPerson.imageUrl}" class="spotlight-img">` : ''}
                <div>
                  <h4 style="margin: 0; color: #2F4F4F;">People Spotlight: ${randomPerson.name}</h4>
                  <p style="margin: 5px 0 0 0; font-size: 14px;">${randomPerson.role} | ${randomPerson.state}</p>
                  <a href="${APP_URL}/people/${randomPerson.slug}" style="color: #2F4F4F; font-size: 12px; font-weight: bold; text-decoration: none;">View Profile</a>
                </div>
              </div>
            ` : ''}
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Kwara Political Hangout. All rights reserved.</p>
              <p>You received this because you're subscribed to our newsletter.</p>
              <p><a href="{{UNSUBSCRIBE_LINK}}" style="color: #666;">Unsubscribe</a></p>
            </div>
          </div>
        </body>
        </html>
      `;
    const weekOf = `${now.getFullYear()}-W${getWeekNumber(now)}`;
    await db_1.db.collection('newsletter_digests').add({
        weekOf,
        subject: `This Week in Kwara Politics — ${dateStr}`,
        htmlContent,
        textContent: `Check out this week's political review at ${APP_URL}`,
        articlesIncluded: articles.map(a => a.id),
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'draft',
        sentBy: 'scheduler'
    });
    await (0, resend_1.sendEmail)({
        to: ADMIN_EMAIL,
        subject: "[KPH] New Digest Ready for Review",
        html: `<p>This week's digest (${dateStr}) has been generated and is ready for review.</p><p><a href="https://admin.kph.com.ng/newsletter">Go to Admin Dashboard</a></p>`
    });
}));
exports.sendWeeklyDigest = functions.https.onCall((0, errorHandler_1.wrapFunction)(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Login required');
    if (!(await (0, authUtils_1.isEditorOrAdmin)(context.auth.uid)))
        throw new functions.https.HttpsError('permission-denied', 'Only editors or admins can send newsletters.');
    const { digestId } = data;
    if (!digestId)
        throw new functions.https.HttpsError('invalid-argument', 'digestId required');
    const digestSnap = await db_1.db.collection('newsletter_digests').doc(digestId).get();
    if (!digestSnap.exists)
        throw new functions.https.HttpsError('not-found', 'Digest not found');
    const digest = digestSnap.data();
    const subscribersSnap = await db_1.db.collection('newsletter')
        .where('isActive', '==', true)
        .get();
    const subscribers = subscribersSnap.docs.map(doc => doc.data());
    let recipientCount = 0;
    for (const sub of subscribers) {
        const unsubLink = `${APP_URL}/api/unsubscribe?token=${sub.unsubscribeToken}`;
        const personalizedHtml = digest.htmlContent.replace('{{UNSUBSCRIBE_LINK}}', unsubLink);
        try {
            await (0, resend_1.sendEmail)({
                to: sub.email,
                subject: digest.subject,
                html: personalizedHtml
            });
            recipientCount++;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        catch (e) {
            await logger_1.logger.log('medium', `Failed to send digest to ${sub.email}`, { error: e });
        }
    }
    await digestSnap.ref.update({
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        recipientCount,
        status: 'sent',
        sentBy: context.auth.uid
    });
    await db_1.db.collection('activityLogs').add({
        action: 'NEWSLETTER_SENT',
        targetType: 'newsletter',
        targetId: digestId,
        performedBy: context.auth.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true, recipientCount };
}));
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
//# sourceMappingURL=digest.js.map