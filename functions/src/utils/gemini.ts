import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from './logger';

let genAI: GoogleGenerativeAI | null = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.log('critical', 'GEMINI_API_KEY is not set in environment variables');
      return null;
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function callGemini(prompt: string): Promise<string | null> {
  const ai = getGenAI();
  if (!ai) return null;

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    await logger.log('high', `Gemini API Error: ${error.message}`, { prompt, error });
    return null;
  }
}
