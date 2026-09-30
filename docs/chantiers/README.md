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
| 1 | [mobile-salaire](mobile-salaire.md) | en cours |
| 2 | Point de ralliement et nom du site | à décider par l'auteur |
| 3 | [Qui chante autour de chez toi](qui-chante.md) | cadrage proposé, à valider |
| 4 | [Sous tes pieds](sous-tes-pieds.md) | cadrage proposé, à valider |
