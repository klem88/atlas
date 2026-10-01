# Suis les flèches

La carte d’une tonalité : sept accords, des flèches qui disent qui tire vers qui, et les progressions les plus jouées qui s’y dessinent pendant qu’elles sonnent.

## Avant de publier

- [ ] Les données sont produites par `pipeline/build.ts` (`npm run data -- suis-les-fleches`) dans `public/data/suis-les-fleches/`, avec leur contrat et leur validation dans `data/`.
- [ ] Les calculs sont des fonctions pures, testées (`domain/`).
- [ ] Les sections « Comment lire », « La méthode », « Sources » et « Ce que ça ne dit pas » sont rédigées.
- [ ] L'affichage a été vérifié en clair, en sombre et sur mobile (375 px).
- [ ] L'image d'aperçu est générée : `npm run og -- suis-les-fleches` crée `public/og/suis-les-fleches.png`.
- [ ] Dans `src/shell/site.ts`, le statut passe de `draft` à `published`, avec le mois de publication.
