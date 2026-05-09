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
exports.wrapFunction = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const logger_1 = require("./logger");
function wrapFunction(handler) {
    return async (...args) => {
        let data = null;
        let context = null;
        if (args.length >= 2) {
            data = args[0];
            context = args[1];
        }
        else if (args.length === 1) {
            context = args[0];
        }
        try {
            return await handler(...args);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const stack = error instanceof Error ? error.stack : undefined;
            try {
                await logger_1.logger.log('high', `Cloud Function Error: ${message}`, {
                    data: data && typeof data === 'object' ? JSON.stringify(data).substring(0, 5000) : data,
                    context: context ? {
                        auth: context.auth ? { uid: context.auth.uid, email: context.auth.token.email } : null,
                        params: context.params,
                        eventId: context.eventId
                    } : null,
                    stack: stack?.substring(0, 5000)
                }, context?.auth?.uid);
            }
            catch (logError) {
                console.error('CRITICAL: Logger failed inside wrapFunction:', logError);
            }
            if (error && error.constructor && error.constructor.name === 'HttpsError') {
                throw error;
            }
            if (error instanceof functions.https.HttpsError) {
                throw error;
            }
            const detailedMessage = stack ? `${message}\nStack: ${stack.substring(0, 500)}` : message;
            throw new functions.https.HttpsError('internal', `[BACKEND_ERROR] ${detailedMessage}`);
        }
    };
}
exports.wrapFunction = wrapFunction;
//# sourceMappingURL=errorHandler.js.map