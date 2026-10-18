# syntax = docker/dockerfile:1

# No build step: node runs the TypeScript in src/ directly, and node:sqlite
# keeps the house in DATA_DIR, which is the Fly volume mounted at /data.
# One runtime dependency, the Anthropic SDK, for making a house for any five
# friends (ADR 0017); it's installed from the lockfile, without dev tools.
FROM docker.io/library/node:24-slim
WORKDIR /app
ENV NODE_ENV=production DATA_DIR=/data
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate \
  && pnpm install --prod --frozen-lockfile \
  && pnpm store prune
COPY README.md ./
COPY public/ public/
COPY src/ src/
CMD ["node", "--disable-warning=ExperimentalWarning", "src/server.ts"]
