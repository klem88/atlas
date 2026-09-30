# Le fleuve des enchaînements

D’un accord au suivant, où va la musique ? Deux fleuves côte à côte : le jazz descend le cercle des quintes, la pop tourne autour de quatre accords.

## Données

- `npm run data -- fleuve-des-accords` : compte les transitions entre degrés (à l'intérieur d'une partie, sans répétition immédiate) pour l'ensemble de Chordonomicon, ses douze genres, ses huit décennies, l'iRb et le Billboard, et écrit `public/data/fleuve-des-accords/transitions.json` (92 Ko gzippés) et [pipeline/REPORT.md](pipeline/REPORT.md). Une seconde si le cache commun `tools/.cache/corpora/chordonomicon-degrees.*` existe (il est construit par n'importe quel pipeline du cycle), deux minutes sinon.
- `npm run og -- fleuve-des-accords` : image d'aperçu, la pop et le jazz des standards après un V, depuis les vraies données.

## Structure

- `data/` : contrat et validation.
- `domain/flow.ts` : du tableau des transitions au fleuve (dix départs, dix arrivées, « autres »), parts, mots (« une fois sur trois »), phrase de comparaison.
- `pipeline/` : `transitions.ts` (matrice 72 × 72, pur), `build.ts`.
- `ui/` : `river-layout.ts` (géométrie pure, testée), `river.ts` (SVG et canvas), `share-card.ts`.
- Socle utilisé : `src/shell/music/{chords,degrees,key,voicing}.ts`, `tools/lib/{corpora,degrees-corpus}.ts`.

## Avant de publier

- [x] Les données sont produites par `pipeline/build.ts` dans `public/data/fleuve-des-accords/`, avec leur contrat et leur validation dans `data/`.
- [x] Les calculs sont des fonctions pures, testées (`domain/`, `ui/river-layout.ts`).
- [x] Les sections « Comment lire », « La méthode », « Sources » et « Ce que ça ne dit pas » sont rédigées.
- [ ] L'affichage a été vérifié en clair, en sombre et sur mobile (375 px) par l'auteur, sur téléphone.
- [x] L'image d'aperçu est générée : `npm run og -- fleuve-des-accords`.
- [ ] Dans `src/shell/site.ts`, le statut passe de `draft` à `published` (geste de l'auteur).
