import * as admin from 'firebase-admin';

// Initialize the Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// AUTH
export * from './auth';

// ARTICLES
export * from './articles';

// WRITERS
export * from './writers';

// PEOPLE
export * from './people';

// NEWSLETTER
export * from './newsletter';

// MONITORING
export * from './monitoring';
