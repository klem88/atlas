# Cinquante ans de refrains

Année par année, ce que les chansons font de leurs accords : accords distincts par morceau, part des mineurs, des « quatre accords », des septièmes, des emprunts, et la part de chaque degré en rubans. Sans lissage ni projection, limites d'abord.

## Données

- `npm run data -- cinquante-ans-de-refrains` : `public/data/cinquante-ans-de-refrains/years.json` (une série pour toutes les tablatures, une par genre, une pour le Billboard ; par année, les mesures et la part des degrés, plus deux titres repères pour le Billboard) et [pipeline/REPORT.md](pipeline/REPORT.md). Deux passes : le cache commun des degrés, puis une relecture du CSV pour les septièmes. Environ trois minutes.
- `npm run og -- cinquante-ans-de-refrains` : image d'aperçu, la courbe des accords distincts et les rubans.

## Structure

- `domain/measures.ts` : mesures d'un morceau et agrégation par année (pur, testé).
- `ui/ribbons.ts` : les rubans empilés (SVG et canvas) ; `ui/share-card.ts` : courbe en canvas et carte de partage. La courbe de la page utilise le graphique en ligne du socle (`src/shell/charts/line-chart.ts`, `scrub.ts`).

## Avant de publier

- [x] Les données sont produites par `pipeline/build.ts` dans `public/data/cinquante-ans-de-refrains/`, avec leur contrat dans `data/`.
- [x] Les calculs sont des fonctions pures, testées (`domain/`).
- [x] Les sections « Ce que ça ne dit pas » (en premier), « Comment lire », « La méthode » et « Sources » sont rédigées.
- [ ] L'affichage a été vérifié en clair, en sombre et sur mobile (375 px) par l'auteur, sur téléphone.
- [x] L'image d'aperçu est générée : `npm run og -- cinquante-ans-de-refrains`.
- [ ] Dans `src/shell/site.ts`, le statut passe de `draft` à `published` (geste de l'auteur).
