
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiMetadata } from "../types";

export const generateMovieMetadata = async (title: string): Promise<GeminiMetadata | null> => {
  try {
    // API key must be used directly from process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: `Generate high-quality cinematic metadata for a movie titled "${title}". 
                 The description should be captivating. The rating should be a realistic decimal. 
                 The year should be between 1990 and 2025. Return JSON.` }]}],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: 'A 2-3 sentence engaging plot summary.',
            },
            genre: {
              type: Type.STRING,
              description: 'Primary genre (Action, Drama, Sci-Fi, Comedy, Horror, Thriller).',
            },
            rating: {
              type: Type.NUMBER,
              description: 'A realistic IMDB-style rating between 1.0 and 10.0.',
            },
            year: {
              type: Type.INTEGER,
              description: 'Year of release.',
            },
          },
          required: ["description", "genre", "rating", "year"],
        },
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text.trim()) as GeminiMetadata;
  } catch (error) {
    console.error("Gemini Metadata Generation Error:", error);
    return null;
  }
};
