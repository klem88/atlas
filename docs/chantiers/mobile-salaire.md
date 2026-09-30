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
- [x] Fusion sur `main` et déploiement (2026-09-30)
- [ ] Retour de l'auteur après test en ligne sur son téléphone

### Retours de l'auteur (2026-09-30), branche `fix/mobile-salaire`

- [x] Déplacer la carte au pouce : une fois zoomé, un doigt déplace la carte (`touch-action: none`) ; en vue d'ensemble, un doigt fait défiler la page.
- [x] Courbe du budget (et de la fiche commune) cliquable et glissable comme la frise, tout reste synchronisé (`src/shell/charts/scrub.ts`, testé).
- [x] Afficher moins d'informations par défaut : bouton « Plus de détails » (socle, `src/shell/details.ts`), classe `detail` sur les aides, la note de la frise, la phrase de calcul et la source du prix. La légende reste toujours visible.
- [x] Fusion sur `main` et déploiement (2026-09-30)

### Deuxième retour (2026-09-30), branche `fix/legende-noms`

- [x] Légende « inversée » sur mobile : le téléphone était en mode sombre, où la rampe allait du foncé au clair. Les cartes ont maintenant leur propre rampe (`--ramp-*`) : foncé = plus, dans les deux thèmes ; en sombre, elle est éclaircie pour se détacher du fond.
- [x] Noms des communes au zoom (à partir de ×3) : les plus actives d'abord (volume de ventes 2010-2025, faute de population), sans chevauchement, une vingtaine au plus sur téléphone (`map/labels.ts`, testé).
- [x] Fusion sur `main` et déploiement.

Piste notée : ajouter la population INSEE au pipeline pour ordonner les noms (Strasbourg et Metz, sans ventes publiées, n'apparaissent qu'en zoomant davantage).

## Prochaine action

Attendre le retour de l'auteur. Sans retouche : chantier clos, passer au suivant dans `docs/chantiers/README.md`.
