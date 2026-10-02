# syntax = docker/dockerfile:1

# No build step and no runtime dependencies: node runs the TypeScript in src/
# directly, and node:sqlite keeps the house in DATA_DIR, which is the Fly
# volume mounted at /data.
FROM docker.io/library/node:24-slim
WORKDIR /app
ENV NODE_ENV=production DATA_DIR=/data
COPY package.json README.md ./
COPY public/ public/
COPY src/ src/
CMD ["node", "--disable-warning=ExperimentalWarning", "src/server.ts"]
