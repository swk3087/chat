
FROM node:20-alpine AS base
WORKDIR /app
ENV CI=true
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json ./
RUN npm i -g pnpm && pnpm install
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm i -g pnpm && pnpm prisma generate && pnpm build
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node","node_modules/next/dist/bin/next","start","-p","3000"]
