FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# Étape 1 : Dépendances
FROM base AS deps
WORKDIR /app

# Copie du package partagé
COPY shared/package.json shared/
COPY shared/src/ shared/src/

# Copie des manifests backend
COPY backend/package.json backend/package-lock.json* backend/
COPY backend/prisma backend/prisma/

WORKDIR /app/backend
RUN npm ci --legacy-peer-deps
RUN npx prisma generate

# Étape 2 : Build
FROM base AS builder
WORKDIR /app

COPY shared/ shared/
COPY backend/ backend/
COPY --from=deps /app/backend/node_modules ./backend/node_modules

WORKDIR /app/backend
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Étape 3 : Exécution
FROM base AS runner
WORKDIR /app/backend

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/shared /app/shared
COPY --from=builder /app/backend/public ./public
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/package.json ./package.json
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/backend/.next ./.next

# Dossier d'uploads pour les justificatifs étudiants
RUN mkdir -p ./public/uploads/student-proofs && chown -R nextjs:nodejs ./public/uploads

USER nextjs

EXPOSE 3001

CMD ["npm", "run", "start"]
