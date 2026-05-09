import * as admin from 'firebase-admin';
import { UserProfile } from '../types';
import { db } from './db';

/** Emails that are always treated as super-admins regardless of Firestore role. */
const BOOTSTRAP_ADMINS = [
  'danielajibade50@gmail.com',
  'abdulrahmanadebambo@gmail.com',
];

/**
 * Checks if a user has the 'admin' role.
 */
export async function isAdmin(uid: string): Promise<boolean> {
  const user = await admin.auth().getUser(uid);
  if (BOOTSTRAP_ADMINS.includes(user.email?.toLowerCase() ?? '')) {
    return true;
  }

  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) return false;
  const data = userDoc.data() as UserProfile;
  return data.role === 'admin';
}

/**
 * Checks if a user has the 'editor' or 'admin' role.
 */
export async function isEditorOrAdmin(uid: string): Promise<boolean> {
  const user = await admin.auth().getUser(uid);
  if (BOOTSTRAP_ADMINS.includes(user.email?.toLowerCase() ?? '')) {
    return true;
  }

  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) return false;
  const data = userDoc.data() as UserProfile;
  return data.role === 'admin' || data.role === 'editor';
}
