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

## Mise à jour 0.2.9
- Prisma/session storage Shopify réintroduits avec persistance PostgreSQL.
- Webhook `app/uninstalled` remet `Shop.isInstalled` à `false`, renseigne `uninstalledAt` et supprime les sessions.
- Les modèles Prisma loteries/tickets (Raffle, RaffleProduct, ShopifyOrder, Ticket, FreeEntry, AuditLog, DrawReport) sont ajoutés; la logique applicative reste non implémentée.
- GitHub Actions CI reste le gate obligatoire avant merge.


## Mise à jour 0.2.9
- Admin loteries V1 ajouté: liste, création, édition, statuts autorisés et gestion des produits liés RaffleProduct.
- Validations serveur (slug, maxTickets, dates, ticketsPerUnit) ajoutées.
- AuditLog minimal ajouté sur create/update raffle et create/update/disable raffle product.
- Tickets non générés, webhooks commandes non implémentés dans cette version.


## Mise à jour 0.3.0
- Webhook `orders/paid` implémenté avec service dédié `handleOrderPaid(shopDomain, payload)`.
- Génération automatique de tickets avec idempotence sur `shopifyOrderId`.
- Gestion du matching produit/variant, contrôle de capacité `maxTickets`, mise à jour des compteurs et AuditLog.
- Toujours non implémenté: `refunds/create`, `orders/cancelled`, affichage client, tirage, Theme App Extension.


## Mise à jour 0.3.1
- Webhooks `orders/cancelled` et `refunds/create` ajoutés sans casser `orders/paid` ni `app/uninstalled`.
- Invalidation tickets implémentée: `VALID -> CANCELLED` (annulation) et `VALID -> REFUNDED` (remboursement total).
- Idempotence invalidation: duplicata => aucun double effet, log `duplicate_no_valid_tickets`.
- Compteurs loterie recalculés depuis les tickets `VALID` (pas de décrément fragile).
- Limitation V1: remboursement partiel non traçable au `line_item_id` => log `refund_ignored_partial_unhandled` sans invalidation partielle approximative.
- Toujours non fait: affichage client, tirage, export CSV, Theme App Extension.


## Mise à jour 0.3.3
- Admin Tickets / Orders V1 ajouté en lecture seule.
- Tickets: liste + filtres (raffleId, status, email, ticketNumber) + pagination simple.
- Commandes: liste + filtres (email, shopifyOrderId, shopifyOrderNumber), compteurs tickets (total, VALID, REFUNDED/CANCELLED), détail commande et ticket.
- Sécurité shop stricte: requêtes bornées au `shopId` courant.
- Toujours non fait: export CSV, modification manuelle des tickets, tirage, affichage client, Theme App Extension.


## Mise à jour 0.3.4
- Correction de typage TypeScript pour supprimer les erreurs `TS7006` sur les callbacks map/filter côté admin tickets/orders.
- Aucun changement fonctionnel du périmètre (toujours lecture seule, sans export CSV, sans tirage, sans affichage client).


## Mise à jour 0.3.5
- Correction de typage TS2345 sur le rendu `/admin/orders` en utilisant un type enrichi aligné avec la sortie service.
- Aucun changement de scope fonctionnel.


## Mise à jour 0.3.7
- Affichage client tickets V1 ajouté avec recherche sécurisée email + référence de commande sur route publique `/tickets` (lecture seule).
- Service dédié `findCustomerTicketsByOrder(shopDomain, email, orderReference)` ajouté avec filtrage strict multi-boutique et normalisation email.
- Messages neutres et statuts explicites pour tickets annulés/remboursés; aucune exposition des audit payloads.
- Aucun ajout hors scope (pas de modification ticket, pas de Theme App Extension, pas de tirage, pas d'export CSV).


## Mise à jour 0.3.6
- Correction TypeScript TS2322 sur `listOrdersForShop`: sélection Prisma alignée sur le type enrichi retourné.
- Aucun changement fonctionnel de scope.
