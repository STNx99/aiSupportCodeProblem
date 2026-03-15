import { serve } from "@hono/node-server";
import fs from "node:fs";
import { createServer } from "node:https";
import path from "node:path";
import { app } from "./app";
import { env } from "./config/env";
import { ensureHttpsMaterial } from "./utils/httpsMaterial";

const certPath = path.resolve(process.cwd(), env.HTTPS_CERT_PATH);
const keyPath = path.resolve(process.cwd(), env.HTTPS_KEY_PATH);

const start = async () => {
  await ensureHttpsMaterial(certPath, keyPath);

  serve(
    {
      fetch: app.fetch,
      hostname: env.HOST,
      port: env.PORT,
      createServer,
      serverOptions: {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath)
      }
    },
    (info) => {
      console.log(`HTTPS mentor API running at https://${env.HOST}:${info.port}`);
    }
  );
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
