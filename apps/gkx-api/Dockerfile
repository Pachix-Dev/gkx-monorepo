FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/gkx-api/package.json apps/gkx-api/package.json
COPY apps/gkx-web-app/package.json apps/gkx-web-app/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build:api
RUN npm prune --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app/apps/gkx-api

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/gkx-api/dist ./dist
COPY --from=builder /app/apps/gkx-api/package.json ./package.json

EXPOSE 3000

CMD ["node", "dist/main"]
