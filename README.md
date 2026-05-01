# WinShirt Raffle Shopify App

Version: **0.1.0**

## Pré-requis
- Node.js 20+
- npm 10+
- PostgreSQL 15+
- Shopify Partner account + Custom App config

## Installation
```bash
npm install
cp .env.example .env
```

## Variables d’environnement
Voir `.env.example`:
- `SHOPIFY_API_KEY`
- `SHOPIFY_API_SECRET`
- `SCOPES`
- `SHOPIFY_APP_URL`
- `DATABASE_URL`
- `SESSION_SECRET`

## Commandes de développement
```bash
npm run dev
npm run typecheck
npm run build
npm run test
npm run check
```

## Commandes Prisma
```bash
npx prisma generate
npx prisma migrate dev --name init
```

## Lancer l’app en local
```bash
npm run dev
```
Puis ouvrir:
- Admin de base: `http://localhost:3000/admin`
- Health check: `http://localhost:3000/health`

## Ce qui est déjà fait
- Base applicative TypeScript structurée (routes admin/publiques, services, repositories, webhooks).
- Configuration d’environnement centralisée.
- Route publique `GET /health`.
- Première page admin avec le titre **WinShirt Raffle**.
- Prisma configuré avec PostgreSQL + modèle minimal `Shop`.
- Documentation projet initiale (`PROJECT.md`, `RULES.md`, `TASKS.md`).

## Ce qui n’est pas encore fait
- Logique métier loteries/tickets.
- Génération de tickets sur commandes payées.
- Webhooks Shopify réels (vérification signature incluse).
- UI Polaris complète.
- Export CSV, audit logs et tirage sécurisé.
- Theme App Extension.
