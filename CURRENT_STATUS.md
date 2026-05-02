# CURRENT STATUS — WinShirt Raffle Shopify App

## État actuel
- L’application Shopify est en cours de construction du **socle technique**.

## Objectif immédiat
- Obtenir une base **installable** et **testable** de bout en bout.

## Problèmes récents rencontrés
- Conflit Prisma.
- `AppDistribution` incompatible.
- `DeliveryMethod` mal typé.
- Tests dépendants d’une URL d’environnement.

## Priorité produit
- **Ne pas commencer** les loteries/tickets tant que le socle Shopify n’est pas validé.

## Mise à jour 0.2.7
- Prisma/session storage Shopify réintroduits avec persistance PostgreSQL.
- Webhook `app/uninstalled` remet `Shop.isInstalled` à `false`, renseigne `uninstalledAt` et supprime les sessions.
- Les modèles Prisma loteries/tickets (Raffle, RaffleProduct, ShopifyOrder, Ticket, FreeEntry, AuditLog, DrawReport) sont ajoutés; la logique applicative reste non implémentée.
- GitHub Actions CI reste le gate obligatoire avant merge.
