
import { GoogleGenAI } from "@google/genai";
import { Env, jsonResponse, errorResponse, checkAuth, Resource } from '../../utils/storage';

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  // 1. Auth Check
  if (!checkAuth(request, env)) {
    return errorResponse('Unauthorized', 401);
  }

  // 2. Validate API Key
  if (!env.API_KEY) {
    return errorResponse('Server Error: API_KEY is not configured in environment variables.', 500);
  }

  try {
    const resources = await request.json() as Resource[];

    // 3. Initialize Gemini (Server-side)
    const ai = new GoogleGenAI({ apiKey: env.API_KEY });

    const prompt = `
      You are a System Administrator Advisor. Analyze the following JSON list of VPS and Domain resources.
      
      Data:
      ${JSON.stringify(resources)}

      Please provide a concise summary report in Markdown format covering:
      1. **Urgent Alerts**: Any items expiring in the next 30 days.
      2. **Cost Analysis**: Total monthly/yearly projection.
      3. **Optimization Tips**: Suggestions on consolidation or renewal strategies.
      
      Keep the tone professional and helpful.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return jsonResponse({ 
      success: true, 
      analysis: response.text 
    });

  } catch (error) {
    console.error("Gemini Backend Error:", error);
    return errorResponse('Failed to generate analysis via Gemini API.', 500);
  }
};
