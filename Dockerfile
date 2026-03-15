# syntax=docker/dockerfile:1.7

FROM oven/bun:1.2 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
RUN bun run build

FROM base AS production
ENV NODE_ENV=production \
  HOST=0.0.0.0 \
  PORT=8443

COPY --chown=bun:bun package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY --from=build --chown=bun:bun /app/dist ./dist
COPY --chown=bun:bun certs ./certs

USER bun
EXPOSE 8443

CMD ["bun", "dist/server.js"]
