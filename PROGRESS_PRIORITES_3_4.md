# Suivi d'Avancement - Priorité 3 (Sécurisation) & Priorité 4 (Expérience Utilisateur)

Dernière mise à jour : 18 septembre 2026

Ce document consigne la progression détaillée de la réalisation des fonctionnalités des Priorités 3 et 4 pour la plateforme StageLink. Chaque élément est validé par des tests unitaires, des vérifications de lint et de build.

---

## Synthèse Globale

| Axe | Sujet | Statut |
| :--- | :--- | :--- |
| **P3.1** | Vérification email | ⏳ En attente de validation du plan |
| **P3.2** | Validation stricte des fichiers et antivirus | ⏳ En attente de validation du plan |
| **P3.3** | Limitation des tentatives de connexion et des uploads | ⏳ En attente de validation du plan |
| **P3.4** | Journal d’audit administrateur | ⏳ En attente de validation du plan |
| **P3.5** | Contrôle des permissions sur chaque action | ⏳ En attente de validation du plan |
| **P3.6** | Suppression ou expiration sécurisée des documents étudiants | ⏳ En attente de validation du plan |
| **P4.1** | Profil étudiant complet (compétences, portfolio, disponibilités) | ⏳ En attente de validation du plan |
| **P4.2** | Score de compatibilité mission/étudiant | ⏳ En attente de validation du plan |
| **P4.3** | Système de favoris | ⏳ En attente de validation du plan |
| **P4.4** | Recherche avancée (ville, budget, catégorie, durée, mot-clé, tri) | ⏳ En attente de validation du plan |
| **P4.5** | Messagerie consolidée entreprise / étudiant | ⏳ En attente de validation du plan |
| **P4.6** | Responsive mobile avancé avec navigation dédiée (Bottom Bar) | ⏳ En attente de validation du plan |

---

## Détail des Tâches & Critères d'Acceptation

### Priorité 3 : Sécuriser la plateforme

- [ ] **P3.1 : Vérification email**
  - [ ] Génération de jeton sécurisé (`VerificationToken`) avec expiration à 24h.
  - [ ] Endpoints `/api/auth/verify-email/request` et `/api/auth/verify-email`.
  - [ ] Blocage des actions clés si email non vérifié (postuler, publier).
  - [ ] Bannière de rappel et écran de confirmation frontend.

- [ ] **P3.2 : Validation stricte des fichiers et antivirus**
  - [ ] Contrôle des magic bytes (PDF, JPG, PNG).
  - [ ] Détection des signatures malveillantes, scripts et signature test EICAR.
  - [ ] Rejet des extensions et types MIME non conformes.
  - [ ] Tests unitaires de validation et de rejet antivirus.

- [ ] **P3.3 : Limitation des tentatives de connexion et des uploads**
  - [ ] Rate limiting par IP et par compte sur la connexion (max 5 échecs / 15 min).
  - [ ] Limitation des uploads de fichiers (justificatifs et livrables).
  - [ ] Limitation anti-spam pour les candidatures et messages.

- [ ] **P3.4 : Journal d’audit administrateur**
  - [ ] Modèle Prisma `AuditLog` et enum `AuditAction`.
  - [ ] Enregistrement des événements clés (auth, modération, contrats, litiges).
  - [ ] API sécurisée `/api/admin/audit-logs` avec filtrage et pagination.
  - [ ] Interface de consultation administrateur dans `/dashboard/admin`.

- [ ] **P3.5 : Contrôle des permissions sur chaque action**
  - [ ] Helpers centralisés RBAC / ABAC (`assertRole`, `assertOwnership`, etc.).
  - [ ] Audit et sécurisation systématique de chaque endpoint API.
  - [ ] Vérification stricte de l'appartenance des ressources (contrats, candidatures, livrables).

- [ ] **P3.6 : Suppression ou expiration sécurisée des documents étudiants**
  - [ ] Suppression physique sécurisée sur le système de fichiers (`unlink`).
  - [ ] Endpoint de suppression de justificatif par l'étudiant (`DELETE /api/student/proof`).
  - [ ] Procédure de purge des documents archivés ou obsolètes pour l'administrateur.
  - [ ] Journalisation dans l'audit trail.

---

### Priorité 4 : Améliorer l’expérience

- [ ] **P4.1 : Profil étudiant complet avec compétences, portfolio et disponibilités**
  - [ ] Ajout des champs portfolio, github, linkedin dans `StudentProfile`.
  - [ ] API `GET /api/student/profile` et `PUT /api/student/profile`.
  - [ ] Interface d'édition avec badges de compétences, formulaire portfolio et matrice de disponibilités.

- [ ] **P4.2 : Score de compatibilité mission/étudiant**
  - [ ] Calcul et exposition du score sur `GET /api/missions/[id]`.
  - [ ] Jauge visuelle et décomposition des critères sur la fiche de mission.
  - [ ] Affichage du score sur les candidatures reçues côté entreprise.

- [ ] **P4.3 : Système de favoris**
  - [ ] Modèle Prisma `Favorite` avec contrainte d'unicité `(userId, missionId)`.
  - [ ] Endpoints API `/api/favorites` (GET, POST, DELETE).
  - [ ] Bouton d'ajout/retrait favori sur les cartes et la fiche mission.
  - [ ] Section "Mes favoris" dans le dashboard étudiant.

- [ ] **P4.4 : Recherche avancée par ville, budget, catégorie et durée**
  - [ ] Paramètres de filtrage et tri étendus sur `/api/missions`.
  - [ ] Barre de filtres enrichie (recherche textuelle, budget min/max, durée, tri).
  - [ ] Gestion réactive des filtres avec synchronisation URL.

- [ ] **P4.5 : Messagerie entre entreprise et étudiant**
  - [ ] Espace messagerie accessible depuis les tableaux de bord.
  - [ ] Affichage des échanges avec indicateurs de statut de lecture (`readAt`).
  - [ ] Notifications visuelles lors de la réception d'un nouveau message.

- [ ] **P4.6 : Responsive mobile plus poussé avec navigation dédiée**
  - [ ] Bottom Navigation Bar fixe sur mobile avec raccourcis tactiles.
  - [ ] Tiroir de filtres optimisé pour écran mobile.
  - [ ] Ergonomie tactile (zones de contact >= 44px, espacements sécurisés).
  - [ ] Absence totale de débordement horizontal (testé à 360px et 375px).

---

## Journal des Validations Techniques

*Les validations (tests unitaires, Prisma migrate, lint, build) seront renseignées ici au fil de la réalisation.*
