FROM node:26-bookworm-slim AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm ci


FROM dependencies AS build

WORKDIR /app

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

RUN npm prune --production

FROM node:26-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

USER node

EXPOSE 2525

CMD ["node", "dist/index.js"]