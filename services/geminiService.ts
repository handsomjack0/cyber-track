
import { Resource } from "../types/index";
import { API_CLIENT_SECRET } from '../utils/constants';

export const analyzePortfolio = async (resources: Resource[]): Promise<string> => {
  try {
    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_CLIENT_SECRET 
      },
      body: JSON.stringify(resources),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to analyze');
    }

    return data.analysis || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Service Error:", error);
    return "Failed to connect to analysis server. Please check your network or API configuration.";
  }
};
