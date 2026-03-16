# AI Mentor Backend (HonoJS + TypeScript + HTTPS + Gemini)

Backend API that receives a coding question and returns guided problem-solving steps (without full solution code).

## 0) Install Bun (once)

Windows (PowerShell):

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

Verify:

```bash
bun --version
```

## 1) Install

```bash
bun install
```

## 2) Environment

Copy `.env.example` to `.env` and set values.

Required:
- `GEMINI_CHAT_SUPPORT`: Gemini API key
- `GEMINI_MODEL`: preferred model (default `gemini-3.1-flash-lite`)
- `GEMINI_FALLBACK_MODEL`: fallback if preferred model is not available (default `gemini-2.5-flash-lite`)
- `HTTPS_CERT_PATH`: SSL cert file path
- `HTTPS_KEY_PATH`: SSL key file path

## 3) Generate local HTTPS cert (dev)

If cert files do not exist, the server automatically generates self-signed certs at startup using paths from `.env`.

You can still generate your own certs manually if needed.

Option A (mkcert):

```bash
mkcert -install
mkcert localhost 127.0.0.1 ::1
```

Move generated files into `certs/` and update `.env` paths.

## 4) Run

```bash
bun run dev
```

or

```bash
bun run build
bun run start
```

## 5) API

### Health

`GET /health`

### Mentor Guide

`POST /api/v1/mentor/guide`

Request body:

```json
{
  "question": "Explain how to optimize two-sum when constraints are large",
  "context": "I tried nested loops but got time limit exceeded",
  "language": "vi"
}
```

Response body:

```json
{
  "guidance": "1. Problem Understanding ...",
  "model": "gemini-3.1-flash-lite",
  "timestamp": "2026-03-15T00:00:00.000Z"
}
```

## 6) Deploy with Docker

Build image:

```bash
docker build -t ai-mentor-api .
```

Run container:

```bash
docker run -d \
  --name ai-mentor-api \
  -p 8443:8443 \
  -e GEMINI_CHAT_SUPPORT=your_api_key \
  -e GEMINI_MODEL=gemini-3.1-flash-lite \
  -e GEMINI_FALLBACK_MODEL=gemini-2.5-flash-lite \
  -e HOST=0.0.0.0 \
  -e PORT=8443 \
  ai-mentor-api
```

Health check:

`https://localhost:8443/health`

Railway note:

- In production (or Railway), the app listens on HTTP internally and Railway handles HTTPS at the edge.
- For local development, the app keeps HTTPS with self-signed cert support.

## Notes

- The backend enforces mentoring behavior via system instruction.
- Endpoint returns strategy guidance, not full algorithm implementation code.
- If primary model is unavailable, backend retries with fallback model.
