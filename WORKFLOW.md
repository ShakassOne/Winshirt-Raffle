# WORKFLOW — Process obligatoire multi-agents

## Règles non négociables
1. **Une branche par mission**
   - Format recommandé: `feat/<mission>`, `fix/<mission>`, `docs/<mission>`.
2. **Une PR par mission**
   - Pas de PR "fourre-tout".
3. **Pas de merge sans validation test**
   - Validation explicite Agent Testeur / Debugger.
4. **Pas de merge si les tests n’ont pas été exécutés**
   - Les commandes exécutées doivent être tracées dans la PR.
5. **Pas de merge si la PR modifie des fichiers hors scope**
   - Vérification obligatoire de l’onglet **Files changed**.
6. **Aucune correction locale manuelle par le propriétaire du repo**
   - Toute correction passe par commit dans une branche + PR.
7. **Si une PR échoue, créer une tâche de correction dédiée**
   - Nouvelle branche, nouvelle PR, nouveau cycle de validation.
8. **Toujours vérifier l’onglet Files changed avant merge**
   - Contrôle final Reviewer + Release.

## Pipeline recommandé
1. Architecte définit scope + critères d’acceptation.
2. Développeur implémente dans sa branche de mission.
3. Testeur exécute `npm install`, `npm run build`, `npm run test`, `npm run check`.
4. Reviewer valide scope + qualité + onglet Files changed.
5. Release confirme validations puis autorise le merge.

## Politique d’échec
- Un test KO = merge bloqué.
- Un fichier hors scope = merge bloqué.
- Une validation manquante (Testeur/Reviewer) = merge bloqué.
- La correction doit être traitée par une mission dédiée (branche + PR dédiées).
