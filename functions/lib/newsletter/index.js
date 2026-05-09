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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNewsletter = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const resend_1 = require("../utils/resend");
const authUtils_1 = require("../utils/authUtils");
__exportStar(require("./subscriptions"), exports);
__exportStar(require("./digest"), exports);
exports.sendNewsletter = functions.https.onCall(async (data, context) => {
    try {
        console.log('Newsletter request received:', {
            subject: data?.subject,
            userId: context?.auth?.uid
        });
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        const adminCheck = await (0, authUtils_1.isEditorOrAdmin)(context.auth.uid);
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
            const chunkPromises = chunk.map(email => (0, resend_1.sendEmail)({ to: email, subject, html }).catch(err => ({ error: err.message, email })));
            const chunkResults = await Promise.all(chunkPromises);
            results.push(...chunkResults);
        }
        const successCount = results.filter((r) => r && !r.error).length;
        return {
            success: true,
            sentCount: successCount,
            totalCount: recipients.length
        };
    }
    catch (err) {
        console.error('Newsletter Error:', err);
        if (err instanceof functions.https.HttpsError) {
            throw err;
        }
        throw new functions.https.HttpsError('internal', err.message || 'Dispatch Failed');
    }
});
//# sourceMappingURL=index.js.map