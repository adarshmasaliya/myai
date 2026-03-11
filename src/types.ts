export enum Role {
  USER = "user",
  ASSISTANT = "assistant",
}

export interface Message {
  id?: number;
  chat_id?: string;
  role: Role;
  content: string;
  timestamp?: string;
}

export interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export enum PersonalityMode {
  GENERAL = "general",
  CODER = "coder",
  TUTOR = "tutor",
  ADVISOR = "advisor",
  WRITER = "writer",
}

export interface AppSettings {
  personality: PersonalityMode;
  language: "en" | "gu";
  darkMode: boolean;
  voiceEnabled: boolean;
}

export const PERSONALITY_PROMPTS: Record<PersonalityMode, string> = {
  [PersonalityMode.GENERAL]: "You are Sitara AI, a helpful and versatile AI assistant. Provide clear, accurate, and natural responses.",
  [PersonalityMode.CODER]: "You are Sitara AI, an expert software engineer. Provide high-quality code, explain complex algorithms, and help debug issues efficiently.",
  [PersonalityMode.TUTOR]: "You are Sitara AI, a patient and knowledgeable study tutor. Explain concepts simply, provide examples, and help students learn step-by-step.",
  [PersonalityMode.ADVISOR]: "You are Sitara AI, a strategic business advisor. Provide professional insights, market analysis, and practical business solutions.",
  [PersonalityMode.WRITER]: "You are Sitara AI, a creative writer and editor. Help with storytelling, copywriting, and refining prose with a creative flair.",
};
