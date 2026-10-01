# Ta progression a déjà été jouée 40 000 fois

Choisis quatre accords (en degrés, ou sur le clavier) et la page te dit combien de morceaux les enchaînent, dans quels styles, depuis quand, et lesquels.

## Données

- `npm run data -- progression-jouee` : télécharge les trois corpus dans `tools/.cache/corpora/` (Chordonomicon 264 Mo, iRb, McGill Billboard), estime la tonalité, compte les suites de 2 à 8 degrés et écrit `public/data/progression-jouee/` (`meta.json`, `p2.json` … `p8.json`, `songs.json`) et le rapport qualité [pipeline/REPORT.md](pipeline/REPORT.md). Compter huit minutes et `NODE_OPTIONS=--max-old-space-size=8192`.
- `npm run og -- progression-jouee` : image d'aperçu, dessinée depuis les vraies données (I–V–vi–IV).

## Structure

La page « Compose ta progression » (`viz/compose-ta-progression/`) lit les mêmes fichiers et importe `data/contract.ts`, `data/load.ts`, `domain/examples.ts` et `domain/lookup.ts` : un changement de format ici la touche aussi.


- `data/` : contrat des fichiers, validation, chargement paresseux (une part par longueur).
- `domain/` : recherche dans les agrégats, rotations, phrase (`lookup.ts`) ; exemples nommés et surlignage dans une grille (`examples.ts`) ; voix des accords et reconnaissance au clavier (`voicing.ts`).
- `pipeline/` : `build.ts` (orchestration, rapport), `ngrams.ts` (comptage par longueur avec élagage a priori).
- `ui/` : frise des décennies (SVG et canvas), grille d'un morceau, lecteur, carte de partage.
- Socle utilisé : `src/shell/music/chords.ts`, `degrees.ts`, `key.ts` ; `tools/lib/corpora.ts`.

## Avant de publier

- [x] Les données sont produites par `pipeline/build.ts` dans `public/data/progression-jouee/`, avec leur contrat et leur validation dans `data/`.
- [x] Les calculs sont des fonctions pures, testées (`domain/`).
- [x] Les sections « Comment lire », « La méthode », « Sources » et « Ce que ça ne dit pas » sont rédigées.
- [ ] L'affichage a été vérifié en clair, en sombre et sur mobile (375 px) par l'auteur, sur téléphone.
- [x] L'image d'aperçu est générée : `npm run og -- progression-jouee` crée `public/og/progression-jouee.png`.
- [ ] Dans `src/shell/site.ts`, le statut passe de `draft` à `published`, avec le mois de publication (geste de l'auteur).
