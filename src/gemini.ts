/** Imported modules */
import { GoogleGenAI } from "@google/genai";

/** Gemini client instance */
const geminiClient = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

export { geminiClient };
