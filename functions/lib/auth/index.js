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
exports.onUserDeleted = exports.onUserCreated = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const errorHandler_1 = require("../utils/errorHandler");
const db_1 = require("../utils/db");
const resend_1 = require("../utils/resend");
const logger_1 = require("../utils/logger");
exports.onUserCreated = functions.auth.user().onCreate((0, errorHandler_1.wrapFunction)(async (userRecord) => {
    const { uid, displayName, email, photoURL } = userRecord;
    const userDoc = {
        uid,
        displayName: displayName || 'New Writer',
        email: email || '',
        avatarUrl: photoURL || '',
        role: 'writer',
        status: 'pending',
        articlesSubmitted: 0,
        articlesPublished: 0,
        totalViews: 0,
        totalLikes: 0,
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
        approvedBy: null,
        approvedAt: null,
        isActive: true,
    };
    await db_1.db.collection('users').doc(uid).set(userDoc);
    if (email) {
        await (0, resend_1.sendEmail)({
            to: email,
            subject: "We received your KPH writer application",
            html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #2F4F4F; margin: 0;">KPH News</h1>
              <p style="text-transform: uppercase; font-size: 10px; letter-spacing: 2px; color: #8B0000; margin: 5px 0 0;">Kwara Political Hangout</p>
            </div>
            <h2 style="color: #2F4F4F;">Hello ${displayName || 'Future Contributor'},</h2>
            <p>Thank you for your interest in joining the <strong>Kwara Political Hangout</strong> writing team.</p>
            <p>We've successfully received your application. Our editorial board is dedicated to maintaining high standards of political discourse in Kwara State, and we take every application seriously.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2F4F4F; margin: 20px 0;">
              <p style="margin: 0;"><strong>What to expect next:</strong></p>
              <ul style="margin: 10px 0 0; padding-left: 20px;">
                <li>Review Period: Estimated <strong>48 hours</strong>.</li>
                <li>Notification: You'll receive an email once your account is activated.</li>
                <li>Access: Upon approval, the Writer Studio will be open for your first draft.</li>
              </ul>
            </div>
            <p>We look forward to your contributions to the KPH community.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #777;">If you did not register for this account, please contact our support team immediately.</p>
          </div>
        `
        });
    }
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
        await (0, resend_1.sendEmail)({
            to: adminEmail,
            subject: `New writer application: ${displayName || uid}`,
            html: `
          <div style="font-family: sans-serif; line-height: 1.6;">
            <h2 style="color: #8B0000;">New Contributor Registration</h2>
            <p>A new user has requested writer permissions on KPH News.</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${displayName || 'N/A'}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${email || 'N/A'}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Joined:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date().toLocaleString()}</td></tr>
            </table>
            <p style="margin-top: 20px;">
              <a href="${process.env.APP_URL || 'https://kph-news.portal'}/admin/writers" 
                 style="background-color: #2F4F4F; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Review in Admin Dashboard
              </a>
            </p>
          </div>
        `
        });
    }
    await logger_1.logger.log('low', `Writer profile initialized for ${uid}`);
}));
exports.onUserDeleted = functions.auth.user().onDelete((0, errorHandler_1.wrapFunction)(async (userRecord) => {
    const { uid } = userRecord;
    await db_1.db.collection('users').doc(uid).update({
        isActive: false,
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const draftsQuery = db_1.db.collection('articles')
        .where('authorId', '==', uid)
        .where('status', '==', 'draft');
    const draftsSnapshot = await draftsQuery.get();
    if (!draftsSnapshot.empty) {
        const batch = db_1.db.batch();
        draftsSnapshot.docs.forEach((doc) => {
            batch.update(doc.ref, {
                status: 'archived',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
        await batch.commit();
        await logger_1.logger.log('medium', `Archived ${draftsSnapshot.size} drafts for deleted writer ${uid}`);
    }
    await logger_1.logger.log('medium', `Writer profile soft-deleted: ${uid}`);
}));
//# sourceMappingURL=index.js.map