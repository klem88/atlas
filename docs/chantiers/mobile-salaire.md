# Chantier : « Ce que ton salaire achète » sur mobile

Branche : `feat/mobile-salaire`

## Objectif

Sur téléphone, on voit la carte tout de suite. Aujourd'hui (375 px) elle commence à 1 380 px de haut, après tout le panneau de réglages.

## Critères de fin

- À 375 × 812, le haut de la carte est visible sans défiler, et la carte entière après un court défilement.
- Ordre mobile : intro courte → revenus → carte (légende, frise) → fiche commune → résultat et partage → type de logement, recherche, hypothèses.
- Bureau (≥ 1000 px) inchangé.
- Pas de défilement horizontal ; clair et sombre vérifiés ; `npm test` et `npm run typecheck` au vert.

## Décisions

- Le revenu reste au-dessus de la carte : sans lui, la carte ne veut rien dire. Le reste passe dessous.
- Réordonnancement en CSS (`display: contents` + `order` sous 1000 px), sans dupliquer le DOM.
- En-tête du site : sur mobile, on masque le nom de la visualisation (il est déjà le titre de la page).

## Tâches

- [x] En-tête compact sur mobile (socle) : 95 → 64 px
- [x] Intro resserrée sur mobile : 368 → 272 px
- [x] Réordonnancement du panneau et de la carte sous 1000 px : la carte commence à 496 px (au lieu de 1 380)
- [x] Textes adaptés au tactile (« Clique » → « Choisis »)
- [x] Toucher une commune : la détection lisait un seul pixel, presque toujours un bord anticrénelé à l'échelle de la France (6 % de réussite). Elle lit maintenant un carré de 9 px et confirme sur la géométrie (`map/pick.ts`, testé) : 86 %, les ratés tombant hors de France.
- [x] Vérifié à 375 px (clair, sombre), 768 px et 1280 px (bureau inchangé) ; tests et types au vert
- [ ] Validation de l'auteur sur son téléphone, puis fusion sur `main` (déploiement)

## Prochaine action

L'auteur teste sur son téléphone (`npm run dev -- --host`, puis l'adresse réseau affichée). Si c'est bon : fusion sur `main` et push.
