# PROJECT — WinShirt Raffle Shopify App

## Objectif de l'app
Créer une Shopify Custom App privée pour WinShirt afin de gérer des loteries/concours liés aux produits Shopify.

## Fonctionnalités prévues en V1
- Créer des loteries depuis l’admin Shopify.
- Associer des produits/variantes Shopify à une loterie.
- Définir un nombre de tickets par produit.
- Générer des tickets automatiquement quand une commande est payée.
- Gérer les tickets côté admin et client.
- Afficher les tickets vendus/restants en temps réel.

## Stack technique
- Base Shopify app moderne (structure compatible embedded app).
- TypeScript.
- Prisma.
- PostgreSQL.
- UI admin Shopify Polaris (intégration prévue dès ajout dépendances Shopify).
- Architecture compatible Railway.

## Rappel fonctionnel
Shopify reste la source de vérité pour commandes et paiements.
L’app WinShirt Raffle gère uniquement la logique loteries/tickets liée aux événements Shopify.
