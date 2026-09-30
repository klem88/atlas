# La forme d’un accord

Chaque accord dessine une courbe dans l’espace : simple quand il est pur, qui tourne sans fin quand il vient d’un piano.

## Avant de publier

- [ ] Les données sont produites par `pipeline/build.ts` (`npm run data -- forme-accord`) dans `public/data/forme-accord/`, avec leur contrat et leur validation dans `data/`.
- [ ] Les calculs sont des fonctions pures, testées (`domain/`).
- [ ] Les sections « Comment lire », « La méthode », « Sources » et « Ce que ça ne dit pas » sont rédigées.
- [ ] L'affichage a été vérifié en clair, en sombre et sur mobile (375 px).
- [ ] L'image d'aperçu est générée : `npm run og -- forme-accord` crée `public/og/forme-accord.png`.
- [ ] Dans `src/shell/site.ts`, le statut passe de `draft` à `published`, avec le mois de publication.
