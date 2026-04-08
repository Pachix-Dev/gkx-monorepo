FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/gkx-api/package.json apps/gkx-api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci --workspace api --workspace shared --include-workspace-root=false

COPY apps/gkx-api apps/gkx-api
COPY packages/shared packages/shared

RUN npm run build -w api

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json package-lock.json ./
COPY apps/gkx-api/package.json apps/gkx-api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci --omit=dev --workspace api --workspace shared --include-workspace-root=false \
    && npm cache clean --force

COPY --from=builder /app/apps/gkx-api/dist /app/apps/gkx-api/dist

WORKDIR /app/apps/gkx-api

EXPOSE 3000

CMD ["node", "dist/main"]
