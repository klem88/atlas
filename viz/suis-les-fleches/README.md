# Suis les flèches

La carte d’une tonalité : sept accords, des flèches qui disent qui tire vers qui, et les progressions les plus jouées qui s’y dessinent pendant qu’elles sonnent. Fiche : [docs/chantiers/suis-les-fleches.md](../../docs/chantiers/suis-les-fleches.md).

## Structure

- `domain/layout.ts` : les sept accords, leur fonction (repos, départ, tension), trois dispositions (cercle, ligne de quintes, grille), la géométrie des flèches.
- `domain/library.ts` : les progressions courantes (nom, degrés, phrase, tempo).
- `domain/moves.ts` : mouvement de la basse, notes communes, phrase d’un pas.
- `ui/map.ts` : la carte SVG (secteurs, flèches de fond, accords qui glissent, traînée et comète).
- `state.ts` : `?p=pop&vue=cercle&t=C`.

## Dépendances

Pas de données propres. La page réutilise `chordName` et `KEY_NAMES` de `compose-ta-progression`, et le chargeur et `findProgression` de `progression-jouee` pour le compte des chansons (dépendance de code assumée, comme pour compose-ta-progression).

## Avant de publier

- [x] Les calculs sont des fonctions pures, testées (`domain/`, `state.test.ts`).
- [x] Les sections « Comment lire », « La méthode », « Sources » et « Ce que ça ne dit pas » sont rédigées.
- [x] L’affichage a été vérifié en clair, en sombre et sur mobile (375 px).
- [x] L’image d’aperçu est générée : `npm run og -- suis-les-fleches`.
- [ ] Relecture de l’auteur, puis `status: 'published'` dans `src/shell/site.ts`.
