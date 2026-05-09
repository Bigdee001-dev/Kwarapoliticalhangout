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
exports.unsubscribeFromNewsletter = exports.confirmNewsletterSubscription = exports.subscribeToNewsletter = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const crypto_1 = require("crypto");
const errorHandler_1 = require("../utils/errorHandler");
const db_1 = require("../utils/db");
const resend_1 = require("../utils/resend");
const logger_1 = require("../utils/logger");
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const APP_URL = process.env.APP_URL || 'https://kph.com.ng';
exports.subscribeToNewsletter = functions.https.onCall((0, errorHandler_1.wrapFunction)(async (data) => {
    const { email, name, categories } = data;
    if (!email || !EMAIL_REGEX.test(email)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid email address.');
    }
    const newsletterRef = db_1.db.collection('newsletter');
    const existingSubQuery = await newsletterRef.where('email', '==', email).limit(1).get();
    if (!existingSubQuery.empty) {
        const subDoc = existingSubQuery.docs[0];
        const subData = subDoc.data();
        if (subData.isActive) {
            return { success: true, message: 'You are already subscribed.' };
        }
        await subDoc.ref.update({
            isActive: true,
            isVerified: true,
            preferences: { categories: categories || [] },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, message: 'Subscription reactivated successfully.' };
    }
    const unsubscribeToken = (0, crypto_1.randomUUID)();
    await newsletterRef.add({
        email,
        name: name || '',
        subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true,
        isVerified: true,
        unsubscribeToken,
        preferences: { categories: categories || [] }
    });
    await sendWelcomeEmail(email, name || 'Subscriber');
    return { success: true, message: 'Thank you for subscribing to KPH Weekly!' };
}));
async function sendWelcomeEmail(email, name) {
    await (0, resend_1.sendEmail)({
        to: email,
        subject: "Welcome to KPH Weekly!",
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2F4F4F;">You're In!</h2>
        <p>Hello ${name},</p>
        <p>Your subscription to <strong>KPH Weekly</strong> is now active. You'll receive our next update right in your inbox.</p>
        <p>Get ready for deep-dives into Kwara's political landscape, breaking news, and exclusive commentary.</p>
        <p>Best regards,<br>The KPH Team</p>
      </div>
    `
    });
}
exports.confirmNewsletterSubscription = functions.https.onRequest(async (req, res) => {
    const token = req.query.token;
    if (!token) {
        res.status(400).send('<h1>Invalid Link</h1><p>The confirmation link is missing a token.</p>');
        return;
    }
    try {
        const newsletterRef = db_1.db.collection('newsletter');
        const snapshot = await newsletterRef.where('verificationToken', '==', token).limit(1).get();
        if (snapshot.empty) {
            res.status(400).send('<h1>Invalid or Expired Link</h1><p>We couldn\'t find a subscription matching this token. It may have expired or been used already.</p>');
            return;
        }
        const subDoc = snapshot.docs[0];
        const subData = subDoc.data();
        await subDoc.ref.update({
            isVerified: true,
            verificationToken: admin.firestore.FieldValue.delete(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await (0, resend_1.sendEmail)({
            to: subData.email,
            subject: "Welcome to KPH Weekly!",
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2F4F4F;">You're In!</h2>
          <p>Hello ${subData.name || 'there'},</p>
          <p>Your subscription to <strong>KPH Weekly</strong> is now confirmed. You'll receive our next update right in your inbox.</p>
          <p>Get ready for deep-dives into Kwara's political landscape, breaking news, and exclusive commentary.</p>
          <p>Best regards,<br>The KPH Team</p>
        </div>
      `
        });
        res.redirect(`${APP_URL}/subscribed`);
    }
    catch (error) {
        await logger_1.logger.log('high', 'Error confirming subscription', { error, token });
        res.status(500).send('<h1>Server Error</h1><p>An unexpected error occurred. Please try again later.</p>');
    }
});
exports.unsubscribeFromNewsletter = functions.https.onRequest(async (req, res) => {
    const token = req.query.token;
    if (!token) {
        res.status(400).send('<h1>Invalid Link</h1><p>Unsubscribe link is missing a token.</p>');
        return;
    }
    try {
        const newsletterRef = db_1.db.collection('newsletter');
        const snapshot = await newsletterRef.where('unsubscribeToken', '==', token).limit(1).get();
        if (snapshot.empty) {
            res.status(400).send('<h1>Invalid Link</h1><p>We couldn\'t process your request. This link may be invalid.</p>');
            return;
        }
        const subDoc = snapshot.docs[0];
        await subDoc.ref.update({
            isActive: false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.redirect(`${APP_URL}/unsubscribed`);
    }
    catch (error) {
        await logger_1.logger.log('high', 'Error unsubscribing', { error, token });
        res.status(500).send('<h1>Server Error</h1>');
    }
});
//# sourceMappingURL=subscriptions.js.map