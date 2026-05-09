"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncPoliticalProfiles = exports.suggestRelatedArticles = exports.linkArticlesToPerson = exports.onPersonCreated = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const errorHandler_1 = require("../utils/errorHandler");
const db_1 = require("../utils/db");
const gemini_1 = require("../utils/gemini");
const authUtils_1 = require("../utils/authUtils");
exports.onPersonCreated = functions.region('europe-west3').firestore
    .document('people/{personId}')
    .onCreate((0, errorHandler_1.wrapFunction)(async (snap, context) => {
    const { personId } = context.params;
    const data = snap.data();
    const { name, subCategory, state } = data;
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').trim();
    if (slug.endsWith('-'))
        slug = slug.slice(0, -1);
    const slugQuery = await db_1.db.collection('people')
        .where('slug', '==', slug)
        .get();
    if (!slugQuery.empty) {
        let suffix = 2;
        let uniqueSlug = `${slug}-${suffix}`;
        while (true) {
            const check = await db_1.db.collection('people')
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
    const peopleSnapshot = await db_1.db.collection('people').limit(50).get();
    const existingPeople = peopleSnapshot.docs
        .filter(doc => doc.id !== personId)
        .map(doc => doc.data().name);
    const relatedPeopleIds = [];
    if (existingPeople.length > 0) {
        const prompt = `Given a person profile with subCategory: ${subCategory || 'Politics'} and state: ${state || 'Kwara'},
        suggest 3 person names from this list who are similar: ${JSON.stringify(existingPeople)}.
        Return ONLY a JSON array of names: ["name1","name2","name3"]`;
        const response = await (0, gemini_1.callGemini)(prompt);
        if (response) {
            try {
                const suggestedNames = JSON.parse(response.replace(/```json|```/g, '').trim());
                for (const name of suggestedNames) {
                    const matched = await db_1.db.collection('people')
                        .where('name', '==', name)
                        .limit(1)
                        .get();
                    if (!matched.empty) {
                        relatedPeopleIds.push(matched.docs[0].id);
                    }
                }
            }
            catch (e) {
                console.error('Gemini related people parse error', e);
            }
        }
    }
    await db_1.db.collection('people').doc(personId).update({
        slug,
        relatedPeople: relatedPeopleIds.length > 0 ? relatedPeopleIds : null
    });
}));
exports.linkArticlesToPerson = functions.region('europe-west3').https.onCall((0, errorHandler_1.wrapFunction)(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Login required');
    if (!(await (0, authUtils_1.isEditorOrAdmin)(context.auth.uid)))
        throw new functions.https.HttpsError('permission-denied', 'No access');
    const { personId, articleIds } = data;
    if (!personId || !articleIds)
        throw new functions.https.HttpsError('invalid-argument', 'personId and articleIds required');
    await db_1.db.collection('people').doc(personId).update({
        linkedArticles: articleIds
    });
    const batch = db_1.db.batch();
    for (const articleId of articleIds) {
        const articleRef = db_1.db.collection('articles').doc(articleId);
        batch.update(articleRef, {
            linkedPeople: admin.firestore.FieldValue.arrayUnion(personId)
        });
    }
    await batch.commit();
    await db_1.db.collection('activityLogs').add({
        action: 'PERSON_ARTICLES_LINKED',
        targetType: 'person',
        targetId: personId,
        performedBy: context.auth.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
}));
exports.suggestRelatedArticles = functions.region('europe-west3').https.onCall((0, errorHandler_1.wrapFunction)(async (data) => {
    const { articleId } = data;
    if (!articleId)
        throw new functions.https.HttpsError('invalid-argument', 'articleId is required');
    const articleRef = db_1.db.collection('articles').doc(articleId);
    const snap = await articleRef.get();
    if (!snap.exists)
        throw new functions.https.HttpsError('not-found', 'Article not found');
    const article = snap.data();
    const recentSnapshot = await db_1.db.collection('articles')
        .where('status', '==', 'published')
        .where('category', '==', article.category)
        .orderBy('createdAt', 'desc')
        .limit(25)
        .get();
    const articlesList = recentSnapshot.docs
        .filter(doc => doc.id !== articleId)
        .map(doc => ({ id: doc.id, title: doc.data().title }));
    if (articlesList.length === 0)
        return { success: true, related: [] };
    const prompt = `Given these tags: ${JSON.stringify(article.tags || [])}, which 3 of these articles are most related to the article "${article.title}"?
    Articles: ${JSON.stringify(articlesList)}
    Return ONLY a JSON array of the 3 most relevant article IDs: ["id1", "id2", "id3"]`;
    const response = await (0, gemini_1.callGemini)(prompt);
    let relatedIds = [];
    if (response) {
        try {
            relatedIds = JSON.parse(response.replace(/```json|```/g, '').trim());
            await articleRef.update({ relatedArticles: relatedIds });
        }
        catch (e) {
            console.error('Gemini related articles parse error', e);
        }
    }
    return { success: true, related: relatedIds };
}));
exports.syncPoliticalProfiles = functions.region('europe-west3').https.onCall((0, errorHandler_1.wrapFunction)(async () => {
    return { success: true, message: 'Sync initialized' };
}));
//# sourceMappingURL=index.js.map