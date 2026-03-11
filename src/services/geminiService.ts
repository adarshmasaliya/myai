import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, PersonalityMode, PERSONALITY_PROMPTS } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateChatResponse(
  messages: Message[],
  personality: PersonalityMode = PersonalityMode.GENERAL,
  language: string = "en"
) {
  const model = ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: messages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    })),
    config: {
      systemInstruction: `${PERSONALITY_PROMPTS[personality]} Respond in ${language === "gu" ? "Gujarati" : "English"}.`,
    },
  });

  const response = await model;
  return response.text;
}

export async function generateStreamingResponse(
  messages: Message[],
  personality: PersonalityMode = PersonalityMode.GENERAL,
  language: string = "en"
) {
  const responseStream = await ai.models.generateContentStream({
    model: "gemini-3.1-pro-preview",
    contents: messages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    })),
    config: {
      systemInstruction: `${PERSONALITY_PROMPTS[personality]} Respond in ${language === "gu" ? "Gujarati" : "English"}.`,
    },
  });

  return responseStream;
}
