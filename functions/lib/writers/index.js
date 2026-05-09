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
exports.submitArticleReview = exports.sendMessageToWriter = exports.banWriter = exports.demoteToWriter = exports.promoteToAdmin = exports.promoteToEditor = exports.suspendWriter = exports.rejectWriterApplication = exports.approveWriter = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const errorHandler_1 = require("../utils/errorHandler");
const db_1 = require("../utils/db");
const logger_1 = require("../utils/logger");
const resend_1 = require("../utils/resend");
const authUtils_1 = require("../utils/authUtils");
async function logActivity(action, targetType, targetId, performedBy, context = {}) {
    await db_1.db.collection('activityLogs').add({
        action,
        targetType,
        targetId,
        performedBy,
        context,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
}
exports.approveWriter = functions.https.onCall((0, errorHandler_1.wrapFunction)(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    if (!(await (0, authUtils_1.isAdmin)(context.auth.uid)))
        throw new functions.https.HttpsError('permission-denied', 'Only admins can approve writers.');
    const { uid } = data;
    if (!uid)
        throw new functions.https.HttpsError('invalid-argument', 'UID is required.');
    const userRef = db_1.db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists)
        throw new functions.https.HttpsError('not-found', 'User not found.');
    const userData = userSnap.data();
    await userRef.update({
        role: userData.role === 'admin' || userData.role === 'editor' ? userData.role : 'writer',
        status: 'active',
        approvedBy: context.auth.uid,
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    if (userData.email) {
        await (0, resend_1.sendEmail)({
            to: userData.email,
            subject: "You're approved! Welcome to Kwara Political Hangout",
            html: `
          <div style="font-family: sans-serif; line-height: 1.6;">
            <h2 style="color: #2F4F4F;">Welcome to the Team, ${userData.displayName}!</h2>
            <p>We are excited to inform you that your writer application for <strong>KPH News</strong> has been approved.</p>
            <p>You can now log in to the Writer Studio to start contributing your insights to the political landscape of Kwara State.</p>
            <div style="margin: 30px 0;">
              <a href="${process.env.APP_URL || 'https://kph-news.portal'}/writer-studio" 
                 style="background-color: #2F4F4F; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Access Writer Studio
              </a>
            </div>
            <p>Best regards,<br>The KPH Editorial Board</p>
          </div>
        `
        });
    }
    await logActivity('WRITER_APPROVED', 'writer', uid, context.auth.uid);
    await logger_1.logger.log('medium', `Writer approved: ${uid}`, { approvedBy: context.auth.uid });
    return { success: true };
}));
exports.rejectWriterApplication = functions.https.onCall((0, errorHandler_1.wrapFunction)(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    if (!(await (0, authUtils_1.isAdmin)(context.auth.uid)))
        throw new functions.https.HttpsError('permission-denied', 'Only admins can reject applications.');
    const { uid, reason } = data;
    if (!uid)
        throw new functions.https.HttpsError('invalid-argument', 'UID is required.');
    const userRef = db_1.db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists)
        throw new functions.https.HttpsError('not-found', 'User not found.');
    const userData = userSnap.data();
    await userRef.update({
        status: 'rejected',
    });
    if (userData.email) {
        await (0, resend_1.sendEmail)({
            to: userData.email,
            subject: "Update on your KPH writer application",
            html: `
          <div style="font-family: sans-serif; line-height: 1.6;">
            <h2 style="color: #8B0000;">Application Update</h2>
            <p>Hello ${userData.displayName},</p>
            <p>Thank you for your interest in writing for <strong>Kwara Political Hangout</strong>.</p>
            <p>After reviewing your application, we regret to inform you that we cannot approve your request at this time.</p>
            ${reason ? `<div style="background-color: #fce8e8; padding: 15px; border-radius: 4px; border-left: 4px solid #8B0000;"><strong>Reason:</strong> ${reason}</div>` : ''}
            <p>Thank you for your understanding.</p>
            <p>Best regards,<br>The KPH Editorial Board</p>
          </div>
        `
        });
    }
    await logActivity('WRITER_REJECTED', 'writer', uid, context.auth.uid, { reason });
    await logger_1.logger.log('medium', `Writer application rejected: ${uid}`, { rejectedBy: context.auth.uid, reason });
    return { success: true };
}));
exports.suspendWriter = functions.https.onCall((0, errorHandler_1.wrapFunction)(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    if (!(await (0, authUtils_1.isAdmin)(context.auth.uid)))
        throw new functions.https.HttpsError('permission-denied', 'Only admins can suspend writers.');
    const { uid, reason } = data;
    if (!uid)
        throw new functions.https.HttpsError('invalid-argument', 'UID is required.');
    const userRef = db_1.db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists)
        throw new functions.https.HttpsError('not-found', 'User not found.');
    const userData = userSnap.data();
    await userRef.update({
        status: 'suspended',
    });
    await admin.auth().revokeRefreshTokens(uid);
    if (userData.email) {
        await (0, resend_1.sendEmail)({
            to: userData.email,
            subject: "Your KPH writer account has been suspended",
            html: `
          <div style="font-family: sans-serif; line-height: 1.6;">
            <h2 style="color: #8B0000;">Account Suspension Notice</h2>
            <p>Hello ${userData.displayName},</p>
            <p>Please be advised that your writer account on <strong>Kwara Political Hangout</strong> has been suspended.</p>
            ${reason ? `<div style="background-color: #fce8e8; padding: 15px; border-radius: 4px; border-left: 4px solid #8B0000;"><strong>Reason for suspension:</strong> ${reason}</div>` : ''}
            <p>If you believe this is an error, please contact the administrators.</p>
            <p>Best regards,<br>The KPH Administration</p>
          </div>
        `
        });
    }
    await logActivity('WRITER_SUSPENDED', 'writer', uid, context.auth.uid, { reason });
    await logger_1.logger.log('high', `Writer suspended: ${uid}`, { suspendedBy: context.auth.uid, reason });
    return { success: true };
}));
exports.promoteToEditor = functions.https.onCall((0, errorHandler_1.wrapFunction)(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    if (!(await (0, authUtils_1.isAdmin)(context.auth.uid)))
        throw new functions.https.HttpsError('permission-denied', 'Only admins can promote users.');
    const { uid } = data;
    if (!uid)
        throw new functions.https.HttpsError('invalid-argument', 'UID is required.');
    await db_1.db.collection('users').doc(uid).update({
        role: 'editor',
    });
    await admin.auth().setCustomUserClaims(uid, { role: 'editor' });
    const userSnap = await db_1.db.collection('users').doc(uid).get();
    const userData = userSnap.data();
    if (userData.email) {
        await (0, resend_1.sendEmail)({
            to: userData.email,
            subject: "You've been promoted to Editor at KPH News",
            html: `
          <div style="font-family: sans-serif; line-height: 1.6;">
            <h2 style="color: #2F4F4F;">Congratulations!</h2>
            <p>Hello ${userData.displayName},</p>
            <p>We are pleased to inform you that you have been promoted to the role of <strong>Editor</strong> at Kwara Political Hangout.</p>
            <p>You now have increased permissions to review and manage articles across the platform.</p>
            <p>Thank you for your continued dedication to journalistic excellence in Kwara.</p>
            <p>Best regards,<br>The KPH Management</p>
          </div>
        `
        });
    }
    await logActivity('ROLE_PROMOTED', 'writer', uid, context.auth.uid, { role: 'editor' });
    await logger_1.logger.log('medium', `User ${uid} promoted to editor by ${context.auth.uid}`);
    return { success: true };
}));
exports.promoteToAdmin = functions.https.onCall((0, errorHandler_1.wrapFunction)(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    if (!(await (0, authUtils_1.isAdmin)(context.auth.uid)))
        throw new functions.https.HttpsError('permission-denied', 'Only admins can promote users to admin.');
    const { uid } = data;
    if (!uid)
        throw new functions.https.HttpsError('invalid-argument', 'UID is required.');
    await db_1.db.collection('users').doc(uid).update({
        role: 'admin',
    });
    await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
    const userSnap = await db_1.db.collection('users').doc(uid).get();
    const userData = userSnap.data();
    if (userData.email) {
        await (0, resend_1.sendEmail)({
            to: userData.email,
            subject: "Elevated Access: Admin Role at KPH News",
            html: `
          <div style="font-family: sans-serif; line-height: 1.6;">
            <h2 style="color: #8B0000;">Administrative Appointment</h2>
            <p>Hello ${userData.displayName},</p>
            <p>You have been officially promoted to the role of <strong>Admin</strong> at Kwara Political Hangout.</p>
            <p>You now have full administrative control over the platform's content, users, and configurations.</p>
            <p>Please exercise this responsibility with the utmost integrity.</p>
            <p>Best regards,<br>The KPH Administration</p>
          </div>
        `
        });
    }
    await logActivity('ROLE_PROMOTED_ADMIN', 'writer', uid, context.auth.uid);
    return { success: true };
}));
exports.demoteToWriter = functions.https.onCall((0, errorHandler_1.wrapFunction)(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    if (!(await (0, authUtils_1.isAdmin)(context.auth.uid)))
        throw new functions.https.HttpsError('permission-denied', 'Only admins can demote users.');
    const { uid } = data;
    if (!uid)
        throw new functions.https.HttpsError('invalid-argument', 'UID is required.');
    await db_1.db.collection('users').doc(uid).update({
        role: 'writer',
    });
    await admin.auth().setCustomUserClaims(uid, { role: 'writer' });
    await logActivity('ROLE_DEMOTED', 'writer', uid, context.auth.uid, { newRole: 'writer' });
    return { success: true };
}));
exports.banWriter = functions.https.onCall((0, errorHandler_1.wrapFunction)(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    if (!(await (0, authUtils_1.isAdmin)(context.auth.uid)))
        throw new functions.https.HttpsError('permission-denied', 'Only admins can ban writers.');
    const { uid } = data;
    if (!uid)
        throw new functions.https.HttpsError('invalid-argument', 'UID is required.');
    await db_1.db.collection('users').doc(uid).update({
        status: 'banned',
    });
    await admin.auth().updateUser(uid, { disabled: true });
    await admin.auth().revokeRefreshTokens(uid);
    await logActivity('WRITER_BANNED', 'writer', uid, context.auth.uid);
    return { success: true };
}));
exports.sendMessageToWriter = functions.https.onCall((0, errorHandler_1.wrapFunction)(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    if (!(await (0, authUtils_1.isEditorOrAdmin)(context.auth.uid)))
        throw new functions.https.HttpsError('permission-denied', 'Only editors or admins can send direct messages.');
    const { uid, writerId, subject, message } = data;
    const targetUid = uid || writerId;
    if (!targetUid || !subject || !message)
        throw new functions.https.HttpsError('invalid-argument', 'UID/writerId, subject, and message are required.');
    const userSnap = await db_1.db.collection('users').doc(targetUid).get();
    if (!userSnap.exists)
        throw new functions.https.HttpsError('not-found', 'Writer not found.');
    const userData = userSnap.data();
    if (!userData.email)
        throw new functions.https.HttpsError('failed-precondition', 'Writer does not have an email address.');
    await (0, resend_1.sendEmail)({
        to: userData.email,
        subject: `KPH Editorial: ${subject}`,
        html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <div style="border-bottom: 2px solid #2F4F4F; padding-bottom: 10px; margin-bottom: 20px;">
            <h2 style="color: #2F4F4F; margin: 0;">KPH Editorial Message</h2>
          </div>
          <p>Hello ${userData.displayName},</p>
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <p>Please respond to this email or through the writer portal if required.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #777;">This message was sent by a member of the KPH Editorial Board.</p>
        </div>
      `
    });
    await logActivity('DIRECT_MESSAGE_SENT', 'writer', uid, context.auth.uid, { subject });
    return { success: true };
}));
exports.submitArticleReview = functions.https.onCall((0, errorHandler_1.wrapFunction)(async (data) => {
    return { success: true, submissionId: 'stub-123' };
}));
//# sourceMappingURL=index.js.map