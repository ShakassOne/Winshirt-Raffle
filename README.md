# WinShirt Raffle Shopify App

Version: **0.2.5**

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


## Agent workflow
- Voir `AGENTS.md` pour les rôles et responsabilités multi-agents.
- Voir `WORKFLOW.md` pour le process de branche/PR/merge obligatoire.
- Voir `CHECKLIST_PR.md` pour le template de validation à copier dans chaque PR.
