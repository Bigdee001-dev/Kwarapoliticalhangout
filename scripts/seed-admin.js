/**
 * seed-admin.js
 * Run once to create/update the admin user in Firebase Auth + Firestore.
 *
 * Usage:
 *   node scripts/seed-admin.js
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS to be set, or run from a machine
 * already authenticated via `firebase login` / `gcloud auth`.
 */

const admin = require('firebase-admin');

// ── Config ────────────────────────────────────────────────────────────────────
const ADMIN_EMAIL    = 'abdulrahmanadebambo@gmail.com';
const ADMIN_PASSWORD = 'adeola123';
const ADMIN_NAME     = 'Abdulrahman Adebambo';
const DATABASE_ID    = 'ai-studio-7710842b-5985-43ae-ab69-8c1c7a795b98'; // matches db.ts
// ─────────────────────────────────────────────────────────────────────────────

if (!admin.apps.length) {
  admin.initializeApp();
}

const auth = admin.auth();
const db   = admin.firestore().databaseId
  ? admin.firestore() // fallback
  : (() => {
      const { getFirestore } = require('firebase-admin/firestore');
      try { return getFirestore(DATABASE_ID); }
      catch { return getFirestore(); }
    })();

async function seedAdmin() {
  let uid;

  // 1. Create or update Firebase Auth user
  try {
    const existing = await auth.getUserByEmail(ADMIN_EMAIL);
    uid = existing.uid;
    await auth.updateUser(uid, {
      password:    ADMIN_PASSWORD,
      displayName: ADMIN_NAME,
      emailVerified: true,
    });
    console.log(`✅ Updated existing Auth user: ${uid}`);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      const newUser = await auth.createUser({
        email:         ADMIN_EMAIL,
        password:      ADMIN_PASSWORD,
        displayName:   ADMIN_NAME,
        emailVerified: true,
      });
      uid = newUser.uid;
      console.log(`✅ Created new Auth user: ${uid}`);
    } else {
      throw err;
    }
  }

  // 2. Upsert Firestore user profile with role: 'admin'
  await db.collection('users').doc(uid).set(
    {
      uid,
      displayName:        ADMIN_NAME,
      email:              ADMIN_EMAIL,
      role:               'admin',
      status:             'active',
      isActive:           true,
      articlesSubmitted:  0,
      articlesPublished:  0,
      totalViews:         0,
      totalLikes:         0,
      joinedAt:           admin.firestore.FieldValue.serverTimestamp(),
      lastActiveAt:       admin.firestore.FieldValue.serverTimestamp(),
      approvedBy:         'system',
      approvedAt:         admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  console.log(`✅ Firestore profile upserted with role: admin`);

  // 3. Set custom claim (optional but recommended for client-side auth guards)
  await auth.setCustomUserClaims(uid, { role: 'admin' });
  console.log(`✅ Custom claim set: { role: 'admin' }`);

  console.log('\n🎉 Admin user seeded successfully!');
  console.log(`   Email   : ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   UID     : ${uid}`);
  process.exit(0);
}

seedAdmin().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
