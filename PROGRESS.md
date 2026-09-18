# StageLink - suivi du projet

Dernière mise à jour : 17 septembre 2026

## État global

Le backend contient déjà le schéma Prisma, l'authentification, les rôles, les APIs principales et le module ledger/escrow. Le frontend est en construction, avec le layout public et la connexion réalisés.

Le suivi détaillé des **Priorités 3 (Sécurisation)** et **Priorités 4 (Expérience Utilisateur)** est consigné dans [PROGRESS_PRIORITES_3_4.md](file:///c:/Users/user/Desktop/StageLink-1/PROGRESS_PRIORITES_3_4.md).

## Audit initial

### Modèles Prisma présents

Les modèles suivants existent dans `backend/prisma/schema.prisma` :

- `User`
- `StudentProfile`
- `Availability`
- `CompanyProfile`
- `Category`
- `Mission`
- `Application`
- `Contract`
- `Deliverable`
- `Message`
- `Wallet`
- `LedgerEntry`
- `Payment`
- `Dispute`
- `Review`
- `Certificate`
- `Badge`
- `Notification`

### Tests backend

- `backend/tests/ledger.test.ts` existe.
- `npm run test` exécuté depuis `backend` : 6 tests réussis.
- Les plans dépôt, séquestre, libération, remboursement et litige sont couverts.

### Routes backend déjà présentes

- `/api/auth/register`
- `/api/auth/[...nextauth]`
- `/api/missions`
- `/api/missions/[id]/applications`
- `/api/missions/[id]/contract`
- `/api/contracts/[id]/auto-release`
- `/api/contracts/[id]/deliverables`
- `/api/contracts/[id]/dispute`
- `/api/contracts/[id]/messages`
- `/api/contracts/[id]/validate`
- `/api/disputes/[id]/resolve`
- `/api/wallet/deposit`
- `/api/certificates/[serial]`
- `/api/certificates/[serial]/pdf`

### Écarts connus à corriger plus tard

- La migration de suppression de `LedgerEntry.balanceAfter` est appliquée à la base PostgreSQL locale ; la base cible devra recevoir la même migration au déploiement.
- Les schémas Zod communs sont dans `shared/src/validations.ts` et sont utilisés par les deux applications via `@stagelink/shared`.
- Le frontend et le backend sont deux applications Next séparées : les appels passent par le proxy frontend et `BACKEND_URL`.
- Le proxy frontend utilise `http://localhost:3000` par défaut, aligné sur le port de développement du backend ; `BACKEND_URL` reste configurable en production.
- L’accès à `/dashboard/admin` est couvert par le middleware de rôle admin.
- L’endpoint `auto-release` est maintenant protégé par une authentification admin.
- Les versions Next.js sont différentes (`15.5.25` frontend, `15.5.4` backend).
- L’alignement a été tenté mais npm est resté bloqué avec et sans réseau ; `package.json` et les lockfiles ont été laissés inchangés.

## Plan en 8 étapes

| Étape | Sujet                                          | État                                                |
| ----- | ---------------------------------------------- | --------------------------------------------------- |
| 1     | Setup, schéma et seed                          | Terminée côté backend                               |
| 2     | Auth, rôles et middleware                      | Terminée côté backend et frontend                   |
| 3     | Ledger, escrow et tests                        | Terminée ; solde calculé par crédits moins débits   |
| 4     | APIs missions, candidatures et écrans associés | Terminée côté backend et frontend                   |
| 5     | Contrats, livrables et messagerie              | Terminée côté backend et frontend                   |
| 6     | Litiges et médiation                           | Terminée côté backend et frontend                   |
| 7     | Attestations PDF et badges                     | Backend présent ; vérification frontend à compléter |
| 8     | Tableaux de bord et polish UI                  | Dashboards terminés ; polish final partiel          |

## Avancement frontend

### Étape 1 du parcours frontend : layout et authentification

- [x] Structure `frontend/src/components/ui` initialisée avec primitives shadcn nécessaires : `Button`, `Input`, `Label`, `Separator`.
- [x] Shell public avec header, navigation et footer.
- [x] Page d'accueil StageLink remplaçant le scaffold Next.js.
- [x] Écran de connexion avec React Hook Form et Zod.
- [x] `next-auth` installé dans le frontend.
- [x] Proxy `/api/auth/:path*` vers `BACKEND_URL` configuré dans `frontend/next.config.ts`.
- [x] Validation frontend : `npm run lint` et `npm run build` réussis.
- [x] Écran d'inscription étudiant/entreprise avec POST vers `/api/auth/register`.
- [x] Validation finale de l'inscription : `npm run lint` et `npm run build` réussis.
- [x] Landing connectée à `GET /api/missions` avec catégories, missions récentes et états chargement/vide/erreur.
- [x] Validation finale de la landing : `npm run lint` et `npm run build` réussis.
- [x] Liste `/missions` avec filtres catégorie, ville, budget et durée, états chargement/vide/erreur.
- [x] Filtres synchronisés avec l’URL et validation finale : `npm run lint` et `npm run build` réussis.
- [x] Détail `/missions/[id]` avec données réelles, états chargement/erreur et candidature étudiant.
- [x] Formulaire de candidature validé avec Zod et POST vers `/api/missions/[id]/applications`.
- [x] Validation finale du détail et de la candidature : `npm run lint` et `npm run build` réussis.
- [x] Dashboard étudiant `/dashboard/student` avec profil, portefeuille, contrats et candidatures réels.
- [x] Endpoint protégé `/api/dashboard/student` avec solde calculé par crédits moins débits.
- [x] Validation finale du dashboard : lint frontend/backend et build frontend réussis.
- [x] Dashboard entreprise `/dashboard/company` avec missions, candidatures reçues, contrats et indicateurs réels.
- [x] Endpoint protégé `/api/dashboard/company` ajouté pour agréger les données de l’entreprise.
- [x] Validation finale du dashboard entreprise : lint frontend/backend et build frontend réussis.
- [x] Espace contrat `/contracts/[id]` avec suivi, messages, livrables et ouverture de litige.
- [x] Endpoint protégé `/api/contracts/[id]` ajouté pour charger les données du contrat.
- [x] Validation finale de l’espace contrat : lint/build frontend, lint backend et tests ledger réussis.
- [x] Dashboard médiateur `/dashboard/mediator` avec litiges réels, compteurs et formulaire de résolution.
- [x] Endpoint protégé `/api/dashboard/mediator` ajouté et proxy de résolution des litiges configuré.
- [x] Validation finale du dashboard médiateur : lint/build frontend, lint backend et tests ledger réussis.
- [x] Back-office admin `/dashboard/admin` en lecture seule avec supervision des comptes, missions, paiements et litiges.
- [x] Endpoint protégé `/api/dashboard/admin` ajouté.
- [x] Validation finale du back-office : lint/build frontend, lint backend et tests ledger réussis.
- [x] Revue de branchement finale : port proxy aligné, route admin protégée et auto-release sécurisé.
- [x] Validation de revue : lint/build frontend, lint backend et tests ledger réussis.
- [x] Suppression de `LedgerEntry.balanceAfter` du schéma et de l’écriture ledger.
- [x] Migration `20260917210000_remove_ledger_balance_after` créée.
- [x] Migration ledger appliquée en local avec `prisma migrate deploy` ; `prisma migrate status` confirme que la base est à jour.
- [x] Validation ledger : `prisma validate`, `prisma generate`, lint et 6 tests réussis.
- [x] Package local `@stagelink/shared` créé pour les schémas Zod communs.
- [x] Routes backend et formulaires frontend migrés vers les validations partagées.
- [x] Validation Zod partagée : lint/build frontend, Prisma/lint backend et 6 tests réussis.
- [x] Revue responsive locale : accueil, connexion et liste des missions vérifiés sans débordement horizontal sur mobile et desktop.

### Ordre frontend restant

1. Aligner les versions Next.js, actuellement bloqué localement par npm.
2. Revue visuelle réelle à 375 px et desktop terminée ; aucun débordement horizontal détecté.

- [x] Lockfile racine vide supprimé ; le build frontend ne signale plus d’avertissement de workspace.
- [x] Migration Prisma appliquée sur la base configurée `localhost:5432` ; `prisma migrate status` confirme que le schéma est à jour.
- [x] Migration Prisma vérifiée sur Neon `eu-central-1` ; `prisma migrate status` confirme que le schéma est à jour.
- [x] Correction des 4 erreurs TypeScript strictes bloquant le build backend (`contracts/[id]`, `dashboard/admin`, `dashboard/student`).
- [x] Ajout de `trustHost: true` dans NextAuth (`backend/src/auth.ts`) pour la compatibilité reverse-proxy et déploiements déployés.
- [x] Extension et simplification des rewrites frontend (`frontend/next.config.ts`) couvrant `/api/*`, `/verify/*` et `/uploads/*` (résolution du bug 404 sur les justificatifs étudiants).
- [x] Création de l'endpoint `/api/health` vérifiant la réactivité serveur et la connectivité base de données.
- [x] Création du `package.json` unifié à la racine avec commandes de build, test, lint, typecheck et base de données.
- [x] Suppression du doublon de test obsolète `tests/ledger.test.ts` à la racine.
- [x] Création des Dockerfiles multi-stage de production (`backend/Dockerfile`, `frontend/Dockerfile`) et de `docker-compose.yml`.
- [x] Rédaction du guide de déploiement complet en production [DEPLOYMENT.md](file:///c:/Users/user/Desktop/StageLink-1/DEPLOYMENT.md).
- [x] Validation finale globale : `npm run typecheck`, `npm run lint`, `npm run test` et `npm run build` exécutés avec 100% de succès.

## Règle de mise à jour

Une étape ou un livrable est marqué `[x]` uniquement après implémentation et validation lint/build ou test adaptée. Les données métier ne doivent pas être inventées après disponibilité de l'API.
