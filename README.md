# WinShirt Raffle Shopify App

Version: **0.3.0**

## Pré-requis
- Node.js 20+
- npm 10+
- PostgreSQL 15+
- Shopify Partner account
- Une boutique de développement Shopify

## Installation locale
```bash
npm install
cp .env.example .env
```

## Variables d’environnement
- `SHOPIFY_API_KEY`
- `SHOPIFY_API_SECRET`
- `SCOPES`
- `SHOPIFY_APP_URL`
- `DATABASE_URL`
- `SESSION_SECRET`

## Prisma
```bash
npm run prisma:generate
npm run prisma:migrate -- --name shopify_auth_base
```

## Lancer l’application
```bash
npm run dev
```

## OAuth Shopify embedded
1. Créer/configurer l’app dans Shopify Partner.
2. Mettre `SHOPIFY_APP_URL` avec l’URL publique HTTPS de l’app.
3. Dans la config Shopify App, définir l’URL de redirection OAuth: `https://<app-url>/auth/callback`.
4. Ouvrir: `https://<app-url>/auth?shop=<your-dev-store>.myshopify.com`
5. Après installation, l’admin embarqué affiche **WinShirt Raffle**.

## Webhook `app/uninstalled`
- Le webhook est enregistré après OAuth callback.
- Endpoint webhook: `POST /webhooks`
- Effets: boutique marquée désinstallée (`uninstalledAt`) et suppression des sessions Shopify associées.
- Vérifier dans les logs serveur: `[webhook] app/uninstalled processed for <shop>`.

## Healthcheck
```bash
curl http://localhost:3000/health
```
Réponse attendue:
```json
{
  "ok": true,
  "app": "winshirt-raffle-shopify-app"
}
```

## Vérifications
```bash
npm run typecheck
npm run build
npm run test
npm run check
```


## CI / Validation GitHub Actions
- En cas de blocage local Codex (ex: `npm install` en 403), la validation de référence est le workflow GitHub Actions `CI`.
- Le merge d'une PR dépend du statut **vert** de GitHub Actions (build, test, check).


## Agent workflow
- Voir `AGENTS.md` pour les rôles et responsabilités multi-agents.
- Voir `WORKFLOW.md` pour le process de branche/PR/merge obligatoire.
- Voir `CHECKLIST_PR.md` pour le template de validation à copier dans chaque PR.

## Portée produit actuelle
- La persistance Shopify (Prisma + session storage) est réactivée.
- Modèle Prisma métier loteries/tickets V1 ajouté (schéma + migration), sans logique applicative.
- Le statut GitHub Actions CI doit être vert avant merge.


## Admin loteries V1 (0.2.9)
- Routes admin: liste, création, édition de loteries.
- Gestion des `RaffleProduct` (IDs Shopify saisis manuellement en V1).
- Validations serveur strictes (slug, maxTickets, dates, ticketsPerUnit).
- AuditLog minimal sur création/modification/suppression logique.
- Non inclus: génération de tickets, webhooks commandes payées/remboursements/annulations, tirage, Theme App Extension.


## Webhook `orders/paid` (0.3.0)
- Le webhook `orders/paid` est enregistré et traité via `POST /webhooks`.
- Le service métier crée `ShopifyOrder`, génère des tickets `PURCHASE/VALID`, met à jour les compteurs raffle et journalise dans `AuditLog`.
- Idempotence: une commande déjà connue (`shopifyOrderId`) retourne `skipped_duplicate` et ne regénère aucun ticket.
- Non inclus dans cette version: `refunds/create`, `orders/cancelled`, affichage client, tirage, Theme App Extension.
