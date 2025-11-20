import { AssessmentResult } from "../types";

/**
 * Analyzes the audio blob against a specific question string by calling the server-side API.
 */
export const analyzeSpeaking = async (
  audioBase64: string,
  question: string
): Promise<AssessmentResult> => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioBase64,
        question,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to analyze audio');
    }

    const result = await response.json();
    return result as AssessmentResult;
    
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};