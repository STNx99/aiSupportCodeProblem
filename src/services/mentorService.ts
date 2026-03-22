import { GoogleGenAI } from "@google/genai";
import { mentorSystemPrompt } from "../constants/mentorPrompt";
import { env } from "../config/env";
import { GuideRequest } from "../schemas/guideRequest";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_CHAT_SUPPORT });

const buildUserPrompt = ({ question, context, programmingLanguage, language }: GuideRequest) => {
  return [
    language === "vi"
      ? "Hãy hướng dẫn cách tư duy để giải quyết câu hỏi dưới đây. Không được đưa full code lời giải."
      : "Guide the thinking process for the following problem. Do not provide full solution code.",
    "",
    programmingLanguage ? `Programming Language: ${programmingLanguage}` : "",
    `Question:\n${question}`,
    context ? `\nDeveloper Context:\n${context}` : ""
  ]
    .filter(Boolean)
    .join("\n");
};

const isModelNotFoundError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeStatus = (error as { status?: number }).status;
  if (maybeStatus === 404) {
    return true;
  }

  const message = String((error as { message?: string }).message ?? "").toLowerCase();
  return message.includes("not found") && message.includes("models/");
};

export const generateMentorGuidance = async (payload: GuideRequest) => {
  const userPrompt = buildUserPrompt(payload);

  const callModel = async (model: string) =>
    ai.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        systemInstruction: mentorSystemPrompt,
        temperature: 0.3,
        topP: 0.9,
        maxOutputTokens: 900
      }
    });

  let usedModel = env.GEMINI_MODEL;
  let geminiResponse;

  try {
    geminiResponse = await callModel(usedModel);
  } catch (error) {
    if (!isModelNotFoundError(error) || env.GEMINI_FALLBACK_MODEL === usedModel) {
      throw error;
    }

    usedModel = env.GEMINI_FALLBACK_MODEL;
    geminiResponse = await callModel(usedModel);
  }

  return {
    guidance: geminiResponse.text?.trim() ?? "",
    model: usedModel
  };
};
