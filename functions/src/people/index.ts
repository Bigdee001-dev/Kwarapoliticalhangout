import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { wrapFunction } from '../utils/errorHandler';
import { db } from '../utils/db';
import { callGemini } from '../utils/gemini';
import { isEditorOrAdmin } from '../utils/authUtils';
import { Person, Article } from '../types';

export const onPersonCreated = functions.region('europe-west3').firestore
  .document('people/{personId}')
  .onCreate(wrapFunction(async (snap, context) => {
      const { personId } = context.params;
      const data = snap.data() as Person;
      const { name, subCategory, state } = data;

      // 1. Generate unique slug
      let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').trim();
      if (slug.endsWith('-')) slug = slug.slice(0, -1);
      
      const slugQuery = await db.collection('people')
        .where('slug', '==', slug)
        .get();

      if (!slugQuery.empty) {
        let suffix = 2;
        let uniqueSlug = `${slug}-${suffix}`;
        while (true) {
          const check = await db.collection('people')
            .where('slug', '==', uniqueSlug)
            .get();
          if (check.empty) {
            slug = uniqueSlug;
            break;
          }
          suffix++;
          uniqueSlug = `${slug}-${suffix}`;
        }
      }

      // 2. Suggest related people
      const peopleSnapshot = await db.collection('people').limit(50).get();
      const existingPeople = peopleSnapshot.docs
        .filter(doc => doc.id !== personId)
        .map(doc => (doc.data() as Person).name);

      const relatedPeopleIds: string[] = [];
      if (existingPeople.length > 0) {
        const prompt = `Given a person profile with subCategory: ${subCategory || 'Politics'} and state: ${state || 'Kwara'},
        suggest 3 person names from this list who are similar: ${JSON.stringify(existingPeople)}.
        Return ONLY a JSON array of names: ["name1","name2","name3"]`;

        const response = await callGemini(prompt);
        if (response) {
          try {
            const suggestedNames = JSON.parse(response.replace(/```json|```/g, '').trim());
            // Fetch IDs for these names
            for (const name of suggestedNames) {
              const matched = await db.collection('people')
                .where('name', '==', name)
                .limit(1)
                .get();
              if (!matched.empty) {
                relatedPeopleIds.push(matched.docs[0].id);
              }
            }
          } catch (e) {
            console.error('Gemini related people parse error', e);
          }
        }
      }

      await db.collection('people').doc(personId).update({
        slug,
        relatedPeople: relatedPeopleIds.length > 0 ? relatedPeopleIds : null
      });
  }));

export const linkArticlesToPerson = functions.region('europe-west3').https.onCall(wrapFunction(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
    if (!(await isEditorOrAdmin(context.auth.uid))) throw new functions.https.HttpsError('permission-denied', 'No access');

    const { personId, articleIds } = data;
    if (!personId || !articleIds) throw new functions.https.HttpsError('invalid-argument', 'personId and articleIds required');

    // Update person
    await db.collection('people').doc(personId).update({
      linkedArticles: articleIds
    });

    // Update each article
    const batch = db.batch();
    for (const articleId of articleIds) {
      const articleRef = db.collection('articles').doc(articleId);
      batch.update(articleRef, {
        linkedPeople: admin.firestore.FieldValue.arrayUnion(personId)
      });
    }
    await batch.commit();

    await db.collection('activityLogs').add({
      action: 'PERSON_ARTICLES_LINKED',
      targetType: 'person',
      targetId: personId,
      performedBy: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  }));

export const suggestRelatedArticles = functions.region('europe-west3').https.onCall(wrapFunction(async (data) => {
    const { articleId } = data;
    if (!articleId) throw new functions.https.HttpsError('invalid-argument', 'articleId is required');

    const articleRef = db.collection('articles').doc(articleId);
    const snap = await articleRef.get();
    if (!snap.exists) throw new functions.https.HttpsError('not-found', 'Article not found');
    const article = snap.data() as Article;

    const recentSnapshot = await db.collection('articles')
      .where('status', '==', 'published')
      .where('category', '==', article.category)
      .orderBy('createdAt', 'desc')
      .limit(25)
      .get();

    const articlesList = recentSnapshot.docs
      .filter(doc => doc.id !== articleId)
      .map(doc => ({ id: doc.id, title: (doc.data() as Article).title }));

    if (articlesList.length === 0) return { success: true, related: [] };

    const prompt = `Given these tags: ${JSON.stringify(article.tags || [])}, which 3 of these articles are most related to the article "${article.title}"?
    Articles: ${JSON.stringify(articlesList)}
    Return ONLY a JSON array of the 3 most relevant article IDs: ["id1", "id2", "id3"]`;

    const response = await callGemini(prompt);
    let relatedIds: string[] = [];
    if (response) {
      try {
        relatedIds = JSON.parse(response.replace(/```json|```/g, '').trim());
        await articleRef.update({ relatedArticles: relatedIds });
      } catch (e) {
        console.error('Gemini related articles parse error', e);
      }
    }

    return { success: true, related: relatedIds };
  }));

export const syncPoliticalProfiles = functions.region('europe-west3').https.onCall(wrapFunction(async () => {
    // Logic to sync with official Kwara government data could go here
    return { success: true, message: 'Sync initialized' };
  }));
