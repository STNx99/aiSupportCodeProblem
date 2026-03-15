import { z } from "zod";

export const guideRequestSchema = z.object({
  question: z.string().trim().min(10, "question is too short").max(8000),
  context: z.string().trim().max(8000).optional(),
  language: z.enum(["vi", "en"]).default("vi")
});

export type GuideRequest = z.infer<typeof guideRequestSchema>;
