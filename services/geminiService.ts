
import { Resource } from "../types/index";
import { ApiError, requestJson } from "../utils/apiClient";

const getHeaders = () => {
  return {
    'Content-Type': 'application/json'
  };
};

export const analyzePortfolio = async (resources: Resource[]): Promise<string> => {
  try {
    const response = await requestJson<{ analysis?: string; error?: string }>(
      '/api/ai/analyze',
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(resources),
        timeoutMs: 20000
      }
    );

    return response.data?.analysis || "No analysis generated.";
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Failed to connect to analysis server. Please check your network or API configuration.";
    console.error("Gemini Service Error:", error);
    return message;
  }
};
