# AGENTS — Organisation multi-agents Codex

Ce document définit les rôles et responsabilités pour éviter les conflits, les corrections locales manuelles et les merges cassés.

## Règles globales
- Une mission = une branche dédiée + une PR dédiée.
- Aucun agent ne modifie des fichiers hors scope de sa mission.
- Aucun merge sans validation test et review.
- Le propriétaire du repo ne fait **pas** de correction locale manuelle sur une PR agent.

---

## 1) Agent Architecte

### Rôle
- Définir le plan technique de mission.
- Découper le travail en tâches atomiques (une tâche = un scope clair).
- Fixer les critères d’acceptation et les commandes de validation.

### A le droit de modifier
- `PROJECT.md`, `TASKS.md`, `RULES.md`, `WORKFLOW.md`, `CHECKLIST_PR.md`, `CURRENT_STATUS.md`, `README.md` (sections de pilotage uniquement).
- Templates de process/documentation liés à l’organisation.

### N’a pas le droit de modifier
- Code applicatif (`src/**`).
- Schéma/migrations Prisma (`prisma/**`).
- Configs runtime/build sauf si mission explicitement documentaire.

### Commandes à lancer
```bash
git status
npm run check
```

### Format de rapport attendu
```md
## Rapport Architecte
- Mission:
- Scope autorisé:
- Risques identifiés:
- Critères d’acceptation:
- Tâches créées:
```

---

## 2) Agent Développeur

### Rôle
- Implémenter strictement la mission dans le scope défini.
- Livrer des changements minimaux, lisibles et testables.

### A le droit de modifier
- Uniquement les fichiers explicitement listés dans la mission.
- Documentation associée à la mission si nécessaire.

### N’a pas le droit de modifier
- Fichiers hors scope de mission.
- `package.json` sauf nécessité absolue validée dans la mission.
- Prisma, Theme App Extension, loteries/tickets si non demandés.

### Commandes à lancer
```bash
git status
npm install
npm run build
npm run test
npm run check
```

### Format de rapport attendu
```md
## Rapport Développeur
- Objectif:
- Fichiers modifiés:
- Commandes exécutées:
- Résultats:
- Limites / non testé:
```

---

## 3) Agent Testeur / Debugger

### Rôle
- Exécuter et valider les tests/reproductions.
- Isoler les causes racines en cas d’échec.

### A le droit de modifier
- Fichiers de tests et outillage de debug dans le scope validé.
- Documentation de diagnostic (`CURRENT_STATUS.md`, notes d’incident).

### N’a pas le droit de modifier
- La feature métier sans ticket de correction dédié.
- Fichiers hors scope de la PR testée.

### Commandes à lancer
```bash
git status
npm install
npm run build
npm run test
npm run check
```

### Format de rapport attendu
```md
## Rapport Testeur/Debugger
- PR / Branche testée:
- Scénarios testés:
- Commandes exécutées:
- Résultats (OK/KO):
- Bugs confirmés:
- Recommandation (Go/No-Go):
```

---

## 4) Agent Reviewer

### Rôle
- Vérifier la qualité de la PR (scope, lisibilité, risques, conformité process).
- Refuser toute PR qui modifie des fichiers hors scope.

### A le droit de modifier
- Commentaires de review.
- Documentation de gouvernance si clarification requise.

### N’a pas le droit de modifier
- Le contenu métier de la PR reviewée directement sur la branche du développeur (sauf règle explicite de pairing).

### Commandes à lancer
```bash
git diff --name-only origin/main...HEAD
npm run build
npm run test
npm run check
```

### Format de rapport attendu
```md
## Rapport Reviewer
- Conformité scope:
- Vérification "Files changed":
- Vérification tests:
- Risques:
- Décision: Approve / Request changes
```

---

## 5) Agent Release

### Rôle
- Contrôler les prérequis de merge/release.
- Valider que la PR est testée, reviewée et traçable.

### A le droit de modifier
- Fichiers de release notes/changelog.
- Documentation de suivi de version.

### N’a pas le droit de modifier
- Le code de feature à ce stade (hors correctif explicitement planifié).
- Le scope fonctionnel d’une PR en phase release.

### Commandes à lancer
```bash
git status
git log --oneline -n 10
npm run build
npm run test
npm run check
```

### Format de rapport attendu
```md
## Rapport Release
- PR prête au merge:
- Validations présentes (Testeur/Reviewer):
- Contrôle fichiers hors scope:
- Décision finale: Merge autorisé / Bloqué
- Actions post-merge:
```
