# Le chemin des accords

Compose une progression sur la carte d’une tonalité : à chaque accord, vois où tu es, où tu peux aller, et d’où tu viens.

## Avant de publier

- [ ] Les données sont produites par `pipeline/build.ts` (`npm run data -- chemin-des-accords`) dans `public/data/chemin-des-accords/`, avec leur contrat et leur validation dans `data/`.
- [ ] Les calculs sont des fonctions pures, testées (`domain/`).
- [ ] Les sections « Comment lire », « La méthode », « Sources » et « Ce que ça ne dit pas » sont rédigées.
- [ ] L'affichage a été vérifié en clair, en sombre et sur mobile (375 px).
- [ ] L'image d'aperçu est générée : `npm run og -- chemin-des-accords` crée `public/og/chemin-des-accords.png`.
- [ ] Dans `src/shell/site.ts`, le statut passe de `draft` à `published`, avec le mois de publication.
