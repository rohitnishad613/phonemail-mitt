# ---------- Dependencies ----------
FROM node:26-bookworm-slim AS deps

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm ci

# ---------- Build ----------
FROM deps AS build

WORKDIR /app

COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npx prisma generate

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN npm run build

RUN npm prune --production

# ---------- Production ----------
FROM node:26-bookworm-slim AS production

ENV NODE_ENV=production

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

# CRITICAL: Copy the clean, fully-formed production node_modules from build stage
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
# Keep the config files available if needed at runtime
COPY --from=build --chown=node:node /app/prisma ./prisma

USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]