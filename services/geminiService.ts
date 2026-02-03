
import { Resource } from "../types/index";

export const analyzePortfolio = async (resources: Resource[]): Promise<string> => {
  try {
    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // In a real app with auth, you'd add the x-api-key or token here. 
        // For this demo, we assume the backend allows it or checks a static secret if configured.
        'x-api-key': 'demo-secret' 
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
