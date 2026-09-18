# Guide de Déploiement - Plateforme StageLink

Ce guide détaille l'architecture, les prérequis et les différentes options de déploiement en production pour la plateforme StageLink.

---

## 1. Architecture du Système

StageLink est conçu selon une architecture découplée optimisée pour la montée en charge et la sécurité :

```
                        [ Navigateurs Utilisateurs ]
                                     │
                                     ▼ (Port 3000 / HTTPS 443)
                         ┌───────────────────────┐
                         │   StageLink Frontend  │ (Next.js 15)
                         │   (UI, Layout, Auth)  │
                         └───────────┬───────────┘
                                     │ Proxy Rewrites (/api/*, /verify/*, /uploads/*)
                                     ▼ (Port 3001)
                         ┌───────────────────────┐
                         │   StageLink Backend   │ (Next.js API Routes + Prisma)
                         │   (Auth, Ledger, DB)  │
                         └───────────┬───────────┘
                                     │ Prisma Client (Pooler)
                                     ▼ (Port 5432)
                         ┌───────────────────────┐
                         │ PostgreSQL Database   │ (PostgreSQL 16 / Neon Cloud)
                         └───────────────────────┘
```

- **Frontend** : Next.js 15 (Interface utilisateur, formulaires React Hook Form + Zod, Tailwind CSS v4, SessionProvider).
- **Backend** : Next.js 15 (API REST, NextAuth v5 JWT, Moteur Ledger double entrée, validation de justificatifs).
- **Shared** : Package TypeScript `@stagelink/shared` contenant les schémas de validation Zod partagés.
- **Base de données** : PostgreSQL avec schéma et migrations gérés par Prisma ORM.

---

## 2. Variables d'Environnement

Un fichier `.env.example` est disponible à la racine ainsi que dans `backend/` et `frontend/`.

| Variable | Description | Exemple / Valeur par défaut | Requis |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Chaîne de connexion PostgreSQL | `postgresql://user:pass@host:5432/stagelink` | Oui (Backend) |
| `AUTH_SECRET` | Clé secrète de signature des tokens JWT | `openssl rand -base64 32` | Oui (Backend & Frontend) |
| `AUTH_URL` | URL publique de l'application | `https://stagelink.fr` ou `http://localhost:3000` | Oui (Backend) |
| `AUTH_TRUST_HOST`| Autorise NextAuth derrière un reverse-proxy | `true` | Oui (Backend) |
| `BACKEND_URL` | URL interne d'accès au backend par le frontend | `http://backend:3001` (Docker) ou `http://localhost:3001` | Oui (Frontend) |
| `NEXT_PUBLIC_APP_URL`| URL canonique publique | `https://stagelink.fr` | Recommandé |
| `PAYMENT_PROVIDER`| Fournisseur de paiement | `MOCK` (ou `STRIPE`, `CINETPAY`) | Backend |
| `PLATFORM_COMMISSION_RATE` | Commission plateforme en % | `8` | Backend |
| `AUTO_RELEASE_DAYS` | Délai de libération automatique (jours) | `7` | Backend |

---

## 3. Options de Déploiement

### Option A : Déploiement Docker Compose (Recommandé pour VPS / Serveur dédié)

StageLink inclut une configuration Docker Compose complète prête pour la production avec base de données, backend, frontend, volumes persistants et sondes de santé.

#### 1. Cloner le projet sur le serveur
```bash
git clone https://github.com/votre-org/stagelink.git
cd stagelink
```

#### 2. Configurer les variables d'environnement
```bash
cp .env.example .env
# Éditer les valeurs sensibles (notamment AUTH_SECRET et les mots de passe)
nano .env
```

#### 3. Lancer l'infrastructure
```bash
docker compose up -d --build
```

#### 4. Appliquer les migrations de base de données
```bash
docker compose exec backend npx prisma migrate deploy
```

*(Optionnel)* Pour injecter les données de démonstration initiales :
```bash
docker compose exec backend npm run db:seed
```

#### 5. Vérifier la santé du système
```bash
curl http://localhost:3001/api/health
```
Retour attendu :
```json
{
  "status": "ok",
  "uptime": 42.5,
  "timestamp": "2026-09-18T17:30:00.000Z",
  "database": "connected"
}
```

---

### Option B : Déploiement Cloud Hybride (PaaS Serverless)

Cette option est particulièrement adaptée pour bénéficier d'une haute disponibilité avec mise à l'échelle automatique.

1. **Base de Données** : Créer un projet sur [Neon.tech](https://neon.tech) ou Supabase et récupérer la `DATABASE_URL` avec pooler transactionnel.
2. **Backend (API)** :
   - Déployer sur **Render**, **Railway**, ou **Fly.io**.
   - Définir les variables : `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST=true`, `PORT=3001`.
   - Commande de build : `npm run build:backend`
   - Commande de démarrage : `npm run start:backend`
   - Configurer le Health Check sur `/api/health`.
3. **Frontend (App Web)** :
   - Déployer sur **Vercel** ou **Cloudflare Pages**.
   - Root Directory : `frontend/`
   - Variables d'environnement :
     - `BACKEND_URL` : URL de votre backend Render/Railway (ex: `https://api.stagelink.fr`)
     - `AUTH_SECRET` : Même clé secrète que le backend.
     - `NEXT_PUBLIC_APP_URL` : URL de votre frontend (ex: `https://stagelink.fr`).

---

## 4. Reverse-Proxy Nginx & SSL (Let's Encrypt)

Exemple de configuration Nginx pour un déploiement sur VPS avec nom de domaine et SSL automatique :

```nginx
server {
    listen 80;
    server_name stagelink.fr www.stagelink.fr;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name stagelink.fr www.stagelink.fr;

    ssl_certificate /etc/letsencrypt/live/stagelink.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stagelink.fr/privkey.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 5. Commandes Utiles de Maintenance

Depuis la racine du projet :

```bash
# Vérification globale des types TypeScript
npm run typecheck

# Lint de l'ensemble du monorepo
npm run lint

# Tests unitaires du moteur de ledger et séquestre
npm run test

# Build de production complet
npm run build

# Application des migrations Prisma
npm run db:deploy

# Re-génération du client Prisma
npm run db:generate
```

---

## 6. Checklist de Sécurité Avant Mise en Ligne

- [ ] `AUTH_SECRET` remplacé par une clé aléatoire forte d'au moins 32 caractères.
- [ ] Mots de passe par défaut de la base PostgreSQL modifiés.
- [ ] Certificat SSL/TLS activé et redirection HTTPS forcée.
- [ ] Taux de commission (`PLATFORM_COMMISSION_RATE`) vérifié.
- [ ] Volume persistant configuré pour `./public/uploads/` afin d'éviter la perte des justificatifs étudiants lors d'un redémarrage de conteneur.
- [ ] Sauvegardes régulières planifiées sur la base PostgreSQL (`pg_dump`).
- [ ] Endpoint `/api/health` surveillé par un outil de monitoring (Uptime Kuma, BetterStack, Datadog).
