import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { env } from "./config/env";
import { guideRequestSchema } from "./schemas/guideRequest";
import { generateMentorGuidance } from "./services/mentorService";

const app = new Hono();

app.use("*", secureHeaders());
app.use("*", cors());

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "mentor-api",
    primaryModel: env.GEMINI_MODEL,
    fallbackModel: env.GEMINI_FALLBACK_MODEL
  });
});

app.post("/api/v1/mentor/guide", async (c) => {
  let requestBody: unknown;

  try {
    requestBody = await c.req.json();
  } catch {
    return c.json(
      {
        error: "invalid_request",
        details: { body: ["Invalid JSON body"] }
      },
      400
    );
  }

  const parsedBody = guideRequestSchema.safeParse(requestBody);

  if (!parsedBody.success) {
    return c.json(
      {
        error: "invalid_request",
        details: parsedBody.error.flatten().fieldErrors
      },
      400
    );
  }

  try {
    const { guidance, model } = await generateMentorGuidance(parsedBody.data);

    if (!guidance) {
      return c.json({ error: "empty_ai_response" }, 502);
    }

    return c.json({
      guidance,
      model,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    return c.json({ error: "internal_server_error" }, 500);
  }
});

app.onError((error, c) => {
  console.error(error);
  return c.json({ error: "internal_server_error" }, 500);
});

export { app };
