import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AssessmentResult } from "../types";

// Initialize Gemini Client
// NOTE: Ensure process.env.GEMINI_API_KEY is available in your environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    pronunciationScore: {
      type: Type.INTEGER,
      description: "Score from 1 to 5 based on clarity and intonation.",
    },
    grammarScore: {
      type: Type.INTEGER,
      description: "Score from 1 to 5 based on basic grammar rules suitable for children.",
    },
    relevanceScore: {
      type: Type.INTEGER,
      description: "Score from 1 to 5 based on if the answer addresses the question.",
    },
    transcription: {
      type: Type.STRING,
      description: "What the student actually said.",
    },
    feedback: {
      type: Type.STRING,
      description: "A short, friendly, encouraging sentence for a child (GrapeSEED style).",
    },
    sticker: {
        type: Type.STRING,
        description: "A single emoji that represents the feeling of the result (e.g., Star, Thumbs up, Heart).",
    }
  },
  required: ["pronunciationScore", "grammarScore", "relevanceScore", "transcription", "feedback", "sticker"],
};

/**
 * Analyzes the audio blob against a specific question string.
 */
export const analyzeSpeaking = async (
  audioBase64: string,
  question: string
): Promise<AssessmentResult> => {
  try {
    // Create the prompt parts
    const audioPart = {
      inlineData: {
        mimeType: "audio/webm", // Assuming webm from MediaRecorder, standard for web
        data: audioBase64,
      },
    };

    const textPart = {
      text: `
      You are a friendly, encouraging English examiner for young children (GrapeSEED style).
      
      The child was asked: "${question}"

      Context: The student is a Vietnamese child learning English.
      
      Please listen to the audio and evaluate:
      1. Pronunciation & Intonation (Is it clear? Is the stress natural?)
      2. Grammar (Are basic structures correct?)
      3. Relevance (Did they answer the question asked?)

      IMPORTANT INSTRUCTION FOR VIETNAMESE NAMES:
      - The students will likely use Vietnamese names (e.g., Lan, Minh, Tuan, Huong, Vy, Dung, Bao, etc.) especially when answering "What is your mom's/dad's name?".
      - Please recognize these as valid proper nouns. 
      - Do NOT mark them as incorrect English words or pronunciation errors.
      - Example: "My mom's name is Lan" is a perfect sentence. "My dad's name is Dung" is correct.

      If the audio is silent or unintelligible, give low scores and ask them to try again nicely.
      Output JSON.
      `,
    };

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [audioPart, textPart],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.4, // Lower temperature for consistent grading
      },
    });

    if (response.text) {
        return JSON.parse(response.text) as AssessmentResult;
    } else {
        throw new Error("No text returned from Gemini");
    }
    
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};