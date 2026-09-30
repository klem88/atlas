# La boussole des styles

Une rose par style, tracée sur les mêmes douze enchaînements d'accords, qui montre ce que chacun aime plus que les autres ; et pour un morceau nommé, le style auquel il ressemble le plus. Le dossier s'appelle `carte-des-styles` parce que c'était le chantier prévu : la sonde ([pipeline/PROBE.md](pipeline/PROBE.md)) a montré que les styles ne forment pas d'îles (sauf les standards de jazz), et la page est devenue la boussole prévue en repli.

## Données

- `npx tsx viz/carte-des-styles/pipeline/probe.ts` : la sonde de faisabilité de la carte (ACP, silhouette, plus proches voisins), écrit `pipeline/PROBE.md`.
- `npm run data -- carte-des-styles` : `public/data/carte-des-styles/styles.json` (axes communs, parts, roses, signatures, centres ; 13 Ko gzippés) et `songs.json` (morceaux nommés), plus [pipeline/REPORT.md](pipeline/REPORT.md). Quelques secondes avec le cache commun.
- `npm run og -- carte-des-styles` : image d'aperçu, les quatorze roses.

## Structure

- `pipeline/vectors.ts` : vecteur d'un morceau (576 transitions entre 24 classes), ACP maison, silhouette, kNN (pur, testé) ; `probe.ts` ; `build.ts`.
- `domain/compass.ts` : rayons (rapport à la moyenne en échelle log bornée), signatures, ressemblance cosinus, mots.
- `ui/rose.ts` : la rose en SVG et en canvas ; `ui/share-card.ts`.

## Avant de publier

- [x] Les données sont produites par `pipeline/build.ts` dans `public/data/carte-des-styles/`, avec leur contrat dans `data/`.
- [x] Les calculs sont des fonctions pures, testées (`domain/`, `pipeline/vectors.ts`).
- [x] Les sections « Comment lire », « Pourquoi pas une carte », « La méthode », « Sources » et « Ce que ça ne dit pas » sont rédigées.
- [ ] L'affichage a été vérifié en clair, en sombre et sur mobile (375 px) par l'auteur, sur téléphone.
- [x] L'image d'aperçu est générée : `npm run og -- carte-des-styles`.
- [ ] Dans `src/shell/site.ts`, le statut passe de `draft` à `published` (geste de l'auteur) ; renommer le slug si souhaité.
