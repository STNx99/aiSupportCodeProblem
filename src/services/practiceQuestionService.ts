import { GoogleGenAI } from "@google/genai";
import { practiceQuestionSystemPrompt } from "../constants/practiceQuestionPrompt";
import { env } from "../config/env";
import {
  PracticeQuestionRequest,
  PracticeQuestionsResponse,
  MultipleChoiceQuestion
} from "../schemas/practiceQuestionRequest";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_CHAT_SUPPORT });

const buildUserPrompt = ({
  problemTitle,
  problemCode,
  difficulty,
  language,
  programmingLanguage
}: PracticeQuestionRequest): string => {
  const prompts = {
    en: {
      intro: "Generate 5 multiple-choice questions for the following coding problem:",
      difficulty: "Difficulty Level",
      language: "Programming Language"
    },
    vi: {
      intro: "Tạo 5 câu hỏi trắc nghiệm cho bài toán lập trình sau:",
      difficulty: "Mức độ khó",
      language: "Ngôn ngữ lập trình"
    }
  };

  const t = prompts[language] || prompts.en;

  return [
    t.intro,
    "",
    `Problem Title: ${problemTitle}`,
    "",
    "Problem Code/Description:",
    problemCode,
    "",
    difficulty ? `${t.difficulty}: ${difficulty}` : "",
    programmingLanguage ? `${t.language}: ${programmingLanguage}` : "",
    "",
    language === "vi"
      ? "Hãy tạo 5 câu hỏi trắc nghiệm kiểm tra hiểu biết về bài toán này. Mỗi câu hỏi phải có 4 lựa chọn khác nhau và chỉ có 1 câu trả lời đúng."
      : "Create 5 multiple-choice questions. Each question must have 4 different options with only 1 correct answer. Return as valid JSON."
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

const parseQuestionsResponse = (text: string): MultipleChoiceQuestion[] => {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to extract JSON from response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  if (!Array.isArray(parsed.questions)) {
    throw new Error("Response does not contain questions array");
  }

  return parsed.questions.map((q: any, index: number) => ({
    id: q.id || index + 1,
    questionText: q.questionText || q.question || "",
    explanation: q.explanation || "",
    options: (q.options || []).map((opt: any, optIndex: number) => ({
      id: opt.id || optIndex + 1,
      text: opt.text || "",
      isCorrect: opt.isCorrect ?? false
    }))
  }));
};

export const generatePracticeQuestions = async (
  payload: PracticeQuestionRequest
): Promise<PracticeQuestionsResponse> => {
  const userPrompt = buildUserPrompt(payload);

  const callModel = async (model: string) =>
    ai.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        systemInstruction: practiceQuestionSystemPrompt,
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 2000
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

  const responseText = geminiResponse.text?.trim() ?? "";
  const questions = parseQuestionsResponse(responseText);

  if (questions.length === 0) {
    throw new Error("No questions were generated");
  }

  return {
    questions,
    model: usedModel
  };
};
