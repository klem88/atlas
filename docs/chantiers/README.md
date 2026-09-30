# Chantiers

Un chantier = une fiche ici + une branche `feat/<slug>`. On mène **un chantier à la fois** : le quota de tokens est la vraie limite, et le parallélisme ne le multiplie pas.

## Reprendre un chantier

Dans une session neuve : *« Reprends docs/chantiers/<slug>.md »*. La fiche suffit : objectif, critères de fin, tâches, décisions prises, et **prochaine action**.

## Règles

- Un commit par tâche cochée, fiche mise à jour dans le même commit : une coupure ne coûte que quelques minutes.
- Rien d'inachevé sur `main` (chaque push déploie). On fusionne quand les critères de fin sont remplis.
- Les décisions de l'auteur sont regroupées en début de créneau, dans la section « À décider » de la fiche.

## Cycle d'une visualisation

1. Cadrage d'une page (phrase partageable, écran principal, données) → validation.
2. Données d'abord : sources, licences, volumes, puis pipeline.
3. Calculs purs et tests (`domain/`).
4. Visualisation, mobile d'abord, clair et sombre → validation sur téléphone.
5. Image d'aperçu, `status: 'published'`, fusion sur `main`.

## En cours et à venir

| Ordre | Chantier | État |
| --- | --- | --- |
| 1 | [mobile-salaire](mobile-salaire.md) | en ligne, en attente du retour de l'auteur |
| 2 | [piano-temperament](piano-temperament.md) : Pourquoi ton piano est (légèrement) faux | cadré, en construction |
| 3 | Point de ralliement et nom du site | à décider par l'auteur |
| 4 | [Qui chante autour de chez toi](qui-chante.md) | publiée (2026-09-30) ; restent l'image de partage et le test sur téléphone |
| 5 | [Sous tes pieds](sous-tes-pieds.md) | cadrage validé, sondes faites |

### Sessions parallèles

Exception à la règle « un chantier à la fois », choisie par l'auteur. Chaque session travaille dans **son propre worktree** (`git worktree add ../atlas-<slug> -b feat/<slug>`), jamais dans le même dossier qu'une autre, et ne touche au socle (`src/shell/`) qu'en le signalant dans sa fiche : le premier chantier fusionné sur `main` passe, l'autre se met à jour depuis `main` avant de fusionner.
