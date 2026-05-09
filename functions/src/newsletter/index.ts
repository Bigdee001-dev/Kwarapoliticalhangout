import * as functions from 'firebase-functions/v1';
import { sendEmail } from '../utils/resend';
import { isEditorOrAdmin } from '../utils/authUtils';

export * from './subscriptions';
export * from './digest';

export const sendNewsletter = functions.https.onCall(async (data, context) => {
    try {
      console.log('Newsletter request received:', { 
        subject: data?.subject, 
        userId: context?.auth?.uid 
      });
      
      if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
      }
      
      const adminCheck = await isEditorOrAdmin(context.auth.uid);
      if (!adminCheck) {
        throw new functions.https.HttpsError('permission-denied', 'Only editors or admins can send newsletters');
      }

      const { subject, html, recipients } = data;
      if (!subject || !html || !recipients || !Array.isArray(recipients)) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing parameters: subject, html, and recipients array are required');
      }
      
      const results = [];
      const CHUNK_SIZE = 10;
      
      for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
        const chunk = recipients.slice(i, i + CHUNK_SIZE);
        const chunkPromises = chunk.map(email => 
          sendEmail({ to: email, subject, html }).catch(err => ({ error: err.message, email }))
        );
        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
      }
      
      const successCount = results.filter((r: any) => r && !r.error).length;
      
      return { 
        success: true, 
        sentCount: successCount, 
        totalCount: recipients.length 
      };
    } catch (err: any) {
      console.error('Newsletter Error:', err);
      // If it's already an HttpsError, rethrow it
      if (err instanceof functions.https.HttpsError) {
        throw err;
      }
      throw new functions.https.HttpsError('internal', err.message || 'Dispatch Failed');
    }
  });
