import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { audioBase64, question } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server Error: API Key missing' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const MODEL_NAME = "gemini-2.5-flash";

    const responseSchema = {
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

    const audioPart = {
      inlineData: {
        mimeType: "audio/webm",
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
        temperature: 0.4,
      },
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      res.status(200).json(result);
    } else {
      throw new Error("No text returned from Gemini");
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}