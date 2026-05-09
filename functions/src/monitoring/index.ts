import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { wrapFunction } from '../utils/errorHandler';
import { db } from '../utils/db';
import { sendEmail } from '../utils/resend';
import { isAdmin } from '../utils/authUtils';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@kph.com.ng';

const ErrorLogSchema = z.object({
  app: z.enum(['portal', 'writer', 'admin']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  type: z.string(),
  message: z.string(),
  stack: z.string().optional(),
  context: z.record(z.string(), z.any()).optional(),
  userId: z.string().optional(),
  userRole: z.string().optional(),
});

export const logClientError = functions.https.onCall(wrapFunction(async (data) => {
    const validatedData = ErrorLogSchema.parse(data);

    const logEntry = {
      ...validatedData,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isResolved: false,
    };

    const docRef = await db.collection('errorLogs').add(logEntry);

    if (validatedData.severity === 'critical') {
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `🔴 CRITICAL ERROR on KPH ${validatedData.app}`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #d32f2f;">Critical System Error Detected</h2>
            <p><strong>App:</strong> ${validatedData.app}</p>
            <p><strong>Type:</strong> ${validatedData.type}</p>
            <p><strong>Message:</strong> ${validatedData.message}</p>
            ${validatedData.userId ? `<p><strong>User ID:</strong> ${validatedData.userId}</p>` : ''}
            ${validatedData.stack ? `<div style="background: #f5f5f5; padding: 15px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; margin-top: 10px;">${validatedData.stack}</div>` : ''}
            <p style="margin-top: 20px;">
              <a href="https://admin.kph.com.ng/errors/${docRef.id}" style="background: #d32f2f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View in Dashboard</a>
            </p>
          </div>
        `
      });
    }

    return { success: true, logId: docRef.id };
  }));

export const resolveErrorLog = functions.https.onCall(wrapFunction(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
    if (!(await isAdmin(context.auth.uid))) throw new functions.https.HttpsError('permission-denied', 'Admin access required');

    const { logId } = data;
    if (!logId) throw new functions.https.HttpsError('invalid-argument', 'logId is required');

    await db.collection('errorLogs').doc(logId).update({
      isResolved: true,
      resolvedBy: context.auth.uid,
      resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  }));

export const dailyErrorSummary = functions.pubsub
  .schedule('0 7 * * *')
  .timeZone('Africa/Lagos')
  .onRun(wrapFunction(async (context) => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const snapshot = await db.collection('errorLogs')
        .where('isResolved', '==', false)
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(yesterday))
        .get();

      if (snapshot.empty) return null;

      const counts = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      };

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.severity in counts) {
          counts[data.severity as keyof typeof counts]++;
        }
      });

      const totalUnresolved = snapshot.size;
      if (totalUnresolved === 0) return null;

      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `KPH Daily Error Summary — ${new Date().toLocaleDateString()}`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6;">
            <h2>Daily Error Report</h2>
            <p>There are <strong>${totalUnresolved}</strong> new unresolved errors from the last 24 hours.</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr style="background: #f8f8f8;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Severity</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Count</th>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; color: #d32f2f; font-weight: bold;">Critical</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${counts.critical}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; color: #f57c00; font-weight: bold;">High</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${counts.high}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; color: #1976d2;">Medium</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${counts.medium}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; color: #666;">Low</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${counts.low}</td>
              </tr>
            </table>
            <p style="margin-top: 30px;">
              <a href="https://admin.kph.com.ng/errors" style="background: #2F4F4F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Open Error Dashboard</a>
            </p>
          </div>
        `
      });
  }));

export const healthCheck = functions.pubsub
  .schedule('*/5 * * * *')
  .onRun(async (context) => {
    try {
      // Light read to verify DB connectivity
      await db.collection('siteSettings').doc('config').get();
      console.log('Health check: healthy');
      return null;
    } catch (error: any) {
      console.error('Health check failed:', error);
      
      const logEntry = {
        app: 'admin',
        severity: 'critical',
        type: 'HealthCheckFailed',
        message: `Database connectivity check failed: ${error.message}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        isResolved: false,
      };

      await db.collection('errorLogs').add(logEntry);

      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `🔴 SYSTEM ALERT: KPH Health Check Failed`,
        html: `<h2>Health Check Failure</h2><p>The automated health check failed to read from Firestore.</p><p><strong>Error:</strong> ${error.message}</p>`
      });

      return null;
    }
  });
