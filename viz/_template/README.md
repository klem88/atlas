# __TITLE__

__SUMMARY__

## Avant de publier

- [ ] Les données sont produites par `pipeline/build.ts` (`npm run data -- __SLUG__`) dans `public/data/__SLUG__/`, avec leur contrat et leur validation dans `data/`.
- [ ] Les calculs sont des fonctions pures, testées (`domain/`).
- [ ] Les sections « Comment lire », « La méthode », « Sources » et « Ce que ça ne dit pas » sont rédigées.
- [ ] L'affichage a été vérifié en clair, en sombre et sur mobile (375 px).
- [ ] L'image d'aperçu est générée : `npm run og -- __SLUG__` crée `public/og/__SLUG__.png`.
- [ ] Dans `src/shell/site.ts`, le statut passe de `draft` à `published`, avec le mois de publication.
