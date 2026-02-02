import { GoogleGenAI } from "@google/genai";
import { Resource } from "../types";

// Initialize Gemini Client
// Note: In a real production app, you might proxy this through a backend to hide the key,
// but for this client-side demo, we use the env variable directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzePortfolio = async (resources: Resource[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key is missing. Please check your configuration.";
  }

  try {
    const prompt = `
      You are a System Administrator Advisor. Analyze the following JSON list of VPS and Domain resources.
      
      Data:
      ${JSON.stringify(resources)}

      Please provide a concise summary report in Markdown format covering:
      1. **Urgent Alerts**: Any items expiring in the next 30 days.
      2. **Cost Analysis**: Total monthly/yearly projection (assume costs listed are annual if domain, monthly if VPS, but verify based on context if possible, otherwise treat as flat cost units).
      3. **Optimization Tips**: Suggestions on consolidation or renewal strategies based on the providers listed.
      
      Keep the tone professional and helpful.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Failed to generate analysis. Please try again later.";
  }
};