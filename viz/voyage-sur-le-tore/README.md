# Le voyage sur le tore

Chaque accord est une case sur un tore (le Tonnetz replié) ; un morceau y trace un chemin qu'on regarde se dessiner en l'écoutant. Surprise : « Giant Steps » y avance à plus petits pas qu'« Autumn Leaves ».

## Données

- `npm run data -- voyage-sur-le-tore` : écrit `public/data/voyage-sur-le-tore/songs.json` (les 1 927 morceaux nommés de l'iRb et du Billboard, grilles complètes) et `styles.json` (répartition des distances P, L, R entre accords successifs, par style, sur les trois corpus), plus [pipeline/REPORT.md](pipeline/REPORT.md). Quelques secondes avec le cache commun.
- `npm run og -- voyage-sur-le-tore` : image d'aperçu, le tore en projection avec le chemin de « Giant Steps ».

## Structure

- `domain/tonnetz.ts` : réseau, coordonnées du tore, 24 triades, transformations P, L, R et table des distances, statistiques d'un chemin (pur, testé).
- `domain/journey.ts` : la grille d'un morceau → arrêts, triades, positions, résumé.
- `domain/plane.ts` : le Tonnetz déplié (périodicité, instance la plus proche, chemin déroulé) ; `scene/draw-plane.ts` : dessin pur ; `scene/plane-scene.ts` : canvas, suivi de la tête, glisser.
- `ui/share-card.ts` : image de partage depuis la capture WebGL.
- Socle utilisé : `src/shell/music/{chords,voicing,player,synth}.ts`, `search.ts` ; `tools/lib/{corpora,degrees-corpus,named-songs}.ts`.

## Avant de publier

- [x] Les données sont produites par `pipeline/build.ts` dans `public/data/voyage-sur-le-tore/`, avec leur contrat et leur validation dans `data/`.
- [x] Les calculs sont des fonctions pures, testées (`domain/`).
- [x] Les sections « Comment lire », « La méthode », « Sources » et « Ce que ça ne dit pas » sont rédigées.
- [ ] L'affichage a été vérifié en clair, en sombre et sur mobile (375 px) par l'auteur, sur téléphone (fluidité du WebGL).
- [x] L'image d'aperçu est générée : `npm run og -- voyage-sur-le-tore`.
- [ ] Dans `src/shell/site.ts`, le statut passe de `draft` à `published` (geste de l'auteur).
