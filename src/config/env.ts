import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  GEMINI_CHAT_SUPPORT: z.string().min(1, "Missing GEMINI_CHAT_SUPPORT in .env"),
  GEMINI_MODEL: z.string().min(1).default("gemini-3.1-flash-lite"),
  GEMINI_FALLBACK_MODEL: z.string().min(1).default("gemini-2.5-flash-lite"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(8443),
  HTTPS_CERT_PATH: z.string().default("certs/localhost.crt"),
  HTTPS_KEY_PATH: z.string().default("certs/localhost.key")
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration:");
  console.error(parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsedEnv.data;
