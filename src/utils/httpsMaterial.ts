import fs from "node:fs";
import path from "node:path";
import { generate } from "selfsigned";

export const ensureHttpsMaterial = async (certPath: string, keyPath: string) => {
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    return;
  }

  const certDir = path.dirname(certPath);
  const keyDir = path.dirname(keyPath);
  fs.mkdirSync(certDir, { recursive: true });
  fs.mkdirSync(keyDir, { recursive: true });

  const pems = await generate(
    [{ name: "commonName", value: "localhost" }],
    {
      keySize: 2048,
      algorithm: "sha256",
      extensions: [
        {
          name: "subjectAltName",
          altNames: [
            { type: 2, value: "localhost" },
            { type: 7, ip: "127.0.0.1" },
            { type: 7, ip: "::1" }
          ]
        }
      ]
    }
  );

  fs.writeFileSync(certPath, pems.cert, "utf8");
  fs.writeFileSync(keyPath, pems.private, "utf8");

  console.warn("Self-signed HTTPS certificate was generated for local development.");
  console.warn(`Generated cert: ${certPath}`);
  console.warn(`Generated key: ${keyPath}`);
};
