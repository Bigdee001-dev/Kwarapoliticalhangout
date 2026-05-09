"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callGemini = void 0;
const generative_ai_1 = require("@google/generative-ai");
const logger_1 = require("./logger");
let genAI = null;
function getGenAI() {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            logger_1.logger.log('critical', 'GEMINI_API_KEY is not set in environment variables');
            return null;
        }
        genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    }
    return genAI;
}
async function callGemini(prompt) {
    const ai = getGenAI();
    if (!ai)
        return null;
    try {
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }
    catch (error) {
        await logger_1.logger.log('high', `Gemini API Error: ${error.message}`, { prompt, error });
        return null;
    }
}
exports.callGemini = callGemini;
//# sourceMappingURL=gemini.js.map