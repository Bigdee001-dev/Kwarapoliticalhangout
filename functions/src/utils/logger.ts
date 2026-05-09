import * as admin from 'firebase-admin';
import * as Sentry from '@sentry/node';
import { db } from './db';

// Lazy load sendEmail to avoid circular dependency
let sendEmail: any = null;
async function getSendEmail() {
  if (!sendEmail) {
    const resend = await import('./resend');
    sendEmail = resend.sendEmail;
  }
  return sendEmail;
}

// Initialize Sentry if DSN is provided
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
  });
}

type Severity = 'low' | 'medium' | 'high' | 'critical';

export const logger = {
  log: async (severity: Severity, message: string, context: object = {}, userId?: string) => {
    const timestamp = admin.firestore.Timestamp.now();
    const logData = {
      severity,
      message,
      context,
      userId: userId || null,
      timestamp: timestamp.toDate().toISOString(),
    };

    // 1. Log to Cloud Logging & Sentry
    if (severity === 'critical' || severity === 'high') {
      console.error(`[${severity.toUpperCase()}] ${message}`, JSON.stringify(logData));
      if (process.env.SENTRY_DSN) {
        Sentry.captureMessage(message, {
          level: severity === 'critical' ? 'fatal' : 'error',
          extra: logData,
          user: userId ? { id: userId } : undefined,
        });
      }
    } else {
      console.log(`[${severity.toUpperCase()}] ${message}`, JSON.stringify(logData));
    }

    // 2. Write to Firestore /errorLogs collection
    try {
      await db.collection('errorLogs').add(logData);
    } catch (err) {
      console.error('Failed to write log to Firestore:', err);
    }

    // 3. Admin alert for critical errors
    if (severity === 'critical') {
      await triggerAdminAlert(logData);
    }
  }
};

async function triggerAdminAlert(logData: any) {
  console.log('CRITICAL ERROR ALERT: Notifying admins...', logData.message);
  
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    const send = await getSendEmail();
    await send({
      to: adminEmail,
      subject: `[CRITICAL] KPH News System Alert - ${logData.message.substring(0, 50)}`,
      html: `
        <h1>Critical System Error</h1>
        <p><strong>Message:</strong> ${logData.message}</p>
        <p><strong>Severity:</strong> ${logData.severity}</p>
        <p><strong>Timestamp:</strong> ${logData.timestamp}</p>
        <p><strong>User ID:</strong> ${logData.userId || 'N/A'}</p>
        <pre><code>${JSON.stringify(logData.context, null, 2)}</code></pre>
        <hr />
        <p><a href="${process.env.APP_URL || '#'}/admin/logs">View in Dashboard</a></p>
      `,
    });
  }
}
