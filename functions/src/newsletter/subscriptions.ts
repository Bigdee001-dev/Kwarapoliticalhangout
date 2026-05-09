import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { randomUUID } from 'crypto';
import { wrapFunction } from '../utils/errorHandler';
import { db } from '../utils/db';
import { sendEmail } from '../utils/resend';
import { logger } from '../utils/logger';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const APP_URL = process.env.APP_URL || 'https://kph.com.ng';

export const subscribeToNewsletter = functions.https.onCall(wrapFunction(async (data) => {
    const { email, name, categories } = data;

    if (!email || !EMAIL_REGEX.test(email)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid email address.');
    }

    const newsletterRef = db.collection('newsletter');
    const existingSubQuery = await newsletterRef.where('email', '==', email).limit(1).get();

    if (!existingSubQuery.empty) {
      const subDoc = existingSubQuery.docs[0];
      const subData = subDoc.data();

      if (subData.isActive) {
        return { success: true, message: 'You are already subscribed.' };
      }

      // Reactivate
      await subDoc.ref.update({
        isActive: true,
        isVerified: true,
        preferences: { categories: categories || [] },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: true, message: 'Subscription reactivated successfully.' };
    }

    const unsubscribeToken = randomUUID();

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

async function sendWelcomeEmail(email: string, name: string) {
  await sendEmail({
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

export const confirmNewsletterSubscription = functions.https.onRequest(async (req, res) => {
  const token = req.query.token as string;

  if (!token) {
    res.status(400).send('<h1>Invalid Link</h1><p>The confirmation link is missing a token.</p>');
    return;
  }

  try {
    const newsletterRef = db.collection('newsletter');
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

    await sendEmail({
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
  } catch (error) {
    await logger.log('high', 'Error confirming subscription', { error, token });
    res.status(500).send('<h1>Server Error</h1><p>An unexpected error occurred. Please try again later.</p>');
  }
});

export const unsubscribeFromNewsletter = functions.https.onRequest(async (req, res) => {
  const token = req.query.token as string;

  if (!token) {
    res.status(400).send('<h1>Invalid Link</h1><p>Unsubscribe link is missing a token.</p>');
    return;
  }

  try {
    const newsletterRef = db.collection('newsletter');
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
  } catch (error) {
    await logger.log('high', 'Error unsubscribing', { error, token });
    res.status(500).send('<h1>Server Error</h1>');
  }
});
