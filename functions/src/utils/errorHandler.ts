import * as functions from 'firebase-functions/v1';
import { logger } from './logger';

export function wrapFunction(handler: (...args: any[]) => Promise<any>) {
  return async (...args: any[]) => {
    // Determine context and data based on common function signatures
    // onCall: (data, context)
    // onUpdate: (change, context)
    // onRun: (context)
    let data: any = null;
    let context: any = null;

    if (args.length >= 2) {
      data = args[0];
      context = args[1];
    } else if (args.length === 1) {
      context = args[0];
    }

    try {
      return await handler(...args);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      try {
        await logger.log('high', `Cloud Function Error: ${message}`, {
          data: data && typeof data === 'object' ? JSON.stringify(data).substring(0, 5000) : data,
          context: context ? { 
            auth: context.auth ? { uid: context.auth.uid, email: context.auth.token.email } : null,
            params: context.params,
            eventId: context.eventId
          } : null,
          stack: stack?.substring(0, 5000)
        }, context?.auth?.uid);
      } catch (logError) {
        console.error('CRITICAL: Logger failed inside wrapFunction:', logError);
      }

      // If it's already an HttpsError, rethrow it
      if (error && error.constructor && error.constructor.name === 'HttpsError') {
        throw error;
      }
      
      // Fallback check for instance of if constructors don't match exactly
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      // Preserve descriptive error message even for internal errors
      const detailedMessage = stack ? `${message}\nStack: ${stack.substring(0, 500)}` : message;
      throw new functions.https.HttpsError('internal', `[BACKEND_ERROR] ${detailedMessage}`);
    }
  };
}
