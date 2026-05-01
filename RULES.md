# RULES — WinShirt Raffle

- Ne jamais générer les tickets côté navigateur.
- Ne jamais supprimer physiquement un ticket.
- Toute action sensible devra plus tard créer un audit log.
- Les tickets remboursés ou annulés devront changer de statut.
- Les compteurs devront venir de la base de données, pas du front.
- Les webhooks Shopify devront vérifier l’auth/signature via la méthode Shopify officielle.
- Les données clients ne devront jamais être exposées dans une route publique.
- Ne pas construire de logique de tirage tant que les tickets ne sont pas fiables.
