# Ta progression a déjà été jouée 40 000 fois

Choisis quatre accords et la page te dit combien de morceaux les enchaînent, dans quels styles, depuis quand, et lesquels.

## Avant de publier

- [ ] Les données sont produites par `pipeline/build.ts` (`npm run data -- progression-jouee`) dans `public/data/progression-jouee/`, avec leur contrat et leur validation dans `data/`.
- [ ] Les calculs sont des fonctions pures, testées (`domain/`).
- [ ] Les sections « Comment lire », « La méthode », « Sources » et « Ce que ça ne dit pas » sont rédigées.
- [ ] L'affichage a été vérifié en clair, en sombre et sur mobile (375 px).
- [ ] L'image d'aperçu est générée : `npm run og -- progression-jouee` crée `public/og/progression-jouee.png`.
- [ ] Dans `src/shell/site.ts`, le statut passe de `draft` à `published`, avec le mois de publication.
