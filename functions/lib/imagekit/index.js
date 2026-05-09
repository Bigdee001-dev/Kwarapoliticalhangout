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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImageKitAuth = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const errorHandler_1 = require("../utils/errorHandler");
const imagekit_1 = __importDefault(require("imagekit"));
exports.getImageKitAuth = functions.https.onCall((0, errorHandler_1.wrapFunction)(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Login required');
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || '';
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || '';
    if (!publicKey || !privateKey || !urlEndpoint) {
        throw new functions.https.HttpsError('failed-precondition', 'ImageKit is not configured on the server.');
    }
    const imagekit = new imagekit_1.default({
        publicKey,
        privateKey,
        urlEndpoint,
    });
    return imagekit.getAuthenticationParameters();
}));
//# sourceMappingURL=index.js.map