import { z } from "zod";

export const PracticeQuestionRequestSchema = z.object({
  problemTitle: z.string().min(1, "Problem title is required"),
  problemCode: z.string().min(1, "Problem code is required"),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  language: z.enum(["en", "vi"]).default("en"),
  programmingLanguage: z.string().optional()
});

export type PracticeQuestionRequest = z.infer<typeof PracticeQuestionRequestSchema>;

export const QuestionOptionSchema = z.object({
  id: z.number(),
  text: z.string(),
  isCorrect: z.boolean()
});

export const MultipleChoiceQuestionSchema = z.object({
  id: z.number(),
  questionText: z.string(),
  explanation: z.string(),
  options: z.array(QuestionOptionSchema),
  difficulty: z.enum(["easy", "medium", "hard"]).optional()
});

export type MultipleChoiceQuestion = z.infer<typeof MultipleChoiceQuestionSchema>;

export const PracticeQuestionsResponseSchema = z.object({
  questions: z.array(MultipleChoiceQuestionSchema),
  model: z.string()
});

export type PracticeQuestionsResponse = z.infer<typeof PracticeQuestionsResponseSchema>;
