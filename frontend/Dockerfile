FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Étape 1 : Dépendances
FROM base AS deps
WORKDIR /app

# Copie du package partagé
COPY shared/package.json shared/
COPY shared/src/ shared/src/

# Copie des manifests frontend
COPY frontend/package.json frontend/package-lock.json* frontend/

WORKDIR /app/frontend
RUN npm ci --legacy-peer-deps

# Étape 2 : Build
FROM base AS builder
WORKDIR /app

COPY shared/ shared/
COPY frontend/ frontend/
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules

WORKDIR /app/frontend
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Variables de build (URL interne vers le backend dans le réseau Docker)
ARG BACKEND_URL=http://backend:3001
ENV BACKEND_URL=${BACKEND_URL}

RUN npm run build

# Étape 3 : Exécution
FROM base AS runner
WORKDIR /app/frontend

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/shared /app/shared
COPY --from=builder /app/frontend/public ./public
COPY --from=builder /app/frontend/package.json ./package.json
COPY --from=builder /app/frontend/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next ./.next

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]
