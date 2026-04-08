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

RUN npm run build:web

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app /app

EXPOSE 3000

CMD ["npm", "run", "start", "-w", "web", "--", "-H", "0.0.0.0", "-p", "3000"]
