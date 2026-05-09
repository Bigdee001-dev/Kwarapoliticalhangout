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
exports.healthCheck = exports.dailyErrorSummary = exports.resolveErrorLog = exports.logClientError = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const zod_1 = require("zod");
const errorHandler_1 = require("../utils/errorHandler");
const db_1 = require("../utils/db");
const resend_1 = require("../utils/resend");
const authUtils_1 = require("../utils/authUtils");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@kph.com.ng';
const ErrorLogSchema = zod_1.z.object({
    app: zod_1.z.enum(['portal', 'writer', 'admin']),
    severity: zod_1.z.enum(['low', 'medium', 'high', 'critical']),
    type: zod_1.z.string(),
    message: zod_1.z.string(),
    stack: zod_1.z.string().optional(),
    context: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    userId: zod_1.z.string().optional(),
    userRole: zod_1.z.string().optional(),
});
exports.logClientError = functions.https.onCall((0, errorHandler_1.wrapFunction)(async (data) => {
    const validatedData = ErrorLogSchema.parse(data);
    const logEntry = {
        ...validatedData,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        isResolved: false,
    };
    const docRef = await db_1.db.collection('errorLogs').add(logEntry);
    if (validatedData.severity === 'critical') {
        await (0, resend_1.sendEmail)({
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
exports.resolveErrorLog = functions.https.onCall((0, errorHandler_1.wrapFunction)(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Login required');
    if (!(await (0, authUtils_1.isAdmin)(context.auth.uid)))
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    const { logId } = data;
    if (!logId)
        throw new functions.https.HttpsError('invalid-argument', 'logId is required');
    await db_1.db.collection('errorLogs').doc(logId).update({
        isResolved: true,
        resolvedBy: context.auth.uid,
        resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true };
}));
exports.dailyErrorSummary = functions.pubsub
    .schedule('0 7 * * *')
    .timeZone('Africa/Lagos')
    .onRun((0, errorHandler_1.wrapFunction)(async (context) => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const snapshot = await db_1.db.collection('errorLogs')
        .where('isResolved', '==', false)
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(yesterday))
        .get();
    if (snapshot.empty)
        return null;
    const counts = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
    };
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.severity in counts) {
            counts[data.severity]++;
        }
    });
    const totalUnresolved = snapshot.size;
    if (totalUnresolved === 0)
        return null;
    await (0, resend_1.sendEmail)({
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
exports.healthCheck = functions.pubsub
    .schedule('*/5 * * * *')
    .onRun(async (context) => {
    try {
        await db_1.db.collection('siteSettings').doc('config').get();
        console.log('Health check: healthy');
        return null;
    }
    catch (error) {
        console.error('Health check failed:', error);
        const logEntry = {
            app: 'admin',
            severity: 'critical',
            type: 'HealthCheckFailed',
            message: `Database connectivity check failed: ${error.message}`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            isResolved: false,
        };
        await db_1.db.collection('errorLogs').add(logEntry);
        await (0, resend_1.sendEmail)({
            to: ADMIN_EMAIL,
            subject: `🔴 SYSTEM ALERT: KPH Health Check Failed`,
            html: `<h2>Health Check Failure</h2><p>The automated health check failed to read from Firestore.</p><p><strong>Error:</strong> ${error.message}</p>`
        });
        return null;
    }
});
//# sourceMappingURL=index.js.map