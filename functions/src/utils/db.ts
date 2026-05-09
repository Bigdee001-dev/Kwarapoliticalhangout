import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initializing the app if it hasn't been initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Gets the specified Firestore database.
 */
export function getDb() {
  // In AI Studio environment, we use the specified database ID
  const databaseId = 'ai-studio-7710842b-5985-43ae-ab69-8c1c7a795b98';
  
  try {
    // Correct way to get a named database in firebase-admin v12
    return getFirestore(databaseId);
  } catch (error) {
    console.warn(`Failed to initialize firestore with databaseId: ${databaseId}. Falling back to default.`);
    // Fallback to default database using the modern getFirestore API
    return getFirestore();
  }
}

export const db = getDb();
