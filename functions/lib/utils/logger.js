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
exports.logger = void 0;
const admin = __importStar(require("firebase-admin"));
const Sentry = __importStar(require("@sentry/node"));
const db_1 = require("./db");
let sendEmail = null;
async function getSendEmail() {
    if (!sendEmail) {
        const resend = await Promise.resolve().then(() => __importStar(require('./resend')));
        sendEmail = resend.sendEmail;
    }
    return sendEmail;
}
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
    });
}
exports.logger = {
    log: async (severity, message, context = {}, userId) => {
        const timestamp = admin.firestore.Timestamp.now();
        const logData = {
            severity,
            message,
            context,
            userId: userId || null,
            timestamp: timestamp.toDate().toISOString(),
        };
        if (severity === 'critical' || severity === 'high') {
            console.error(`[${severity.toUpperCase()}] ${message}`, JSON.stringify(logData));
            if (process.env.SENTRY_DSN) {
                Sentry.captureMessage(message, {
                    level: severity === 'critical' ? 'fatal' : 'error',
                    extra: logData,
                    user: userId ? { id: userId } : undefined,
                });
            }
        }
        else {
            console.log(`[${severity.toUpperCase()}] ${message}`, JSON.stringify(logData));
        }
        try {
            await db_1.db.collection('errorLogs').add(logData);
        }
        catch (err) {
            console.error('Failed to write log to Firestore:', err);
        }
        if (severity === 'critical') {
            await triggerAdminAlert(logData);
        }
    }
};
async function triggerAdminAlert(logData) {
    console.log('CRITICAL ERROR ALERT: Notifying admins...', logData.message);
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
        const send = await getSendEmail();
        await send({
            to: adminEmail,
            subject: `[CRITICAL] KPH News System Alert - ${logData.message.substring(0, 50)}`,
            html: `
        <h1>Critical System Error</h1>
        <p><strong>Message:</strong> ${logData.message}</p>
        <p><strong>Severity:</strong> ${logData.severity}</p>
        <p><strong>Timestamp:</strong> ${logData.timestamp}</p>
        <p><strong>User ID:</strong> ${logData.userId || 'N/A'}</p>
        <pre><code>${JSON.stringify(logData.context, null, 2)}</code></pre>
        <hr />
        <p><a href="${process.env.APP_URL || '#'}/admin/logs">View in Dashboard</a></p>
      `,
        });
    }
}
//# sourceMappingURL=logger.js.map