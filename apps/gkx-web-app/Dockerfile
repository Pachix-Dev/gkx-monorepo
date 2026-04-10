FROM node:20-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY package.json package-lock.json ./
COPY apps/gkx-web-app/package.json apps/gkx-web-app/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci --workspace web --workspace shared --include-workspace-root=false

COPY apps/gkx-web-app apps/gkx-web-app
COPY packages/shared packages/shared

RUN npm run build -w web

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/apps/gkx-web-app/.next/standalone ./
COPY --from=builder /app/apps/gkx-web-app/.next/static ./apps/gkx-web-app/.next/static
COPY --from=builder /app/apps/gkx-web-app/public ./apps/gkx-web-app/public

WORKDIR /app/apps/gkx-web-app

EXPOSE 3000

CMD ["node", "server.js"]
