# Où le solo respire

Sur chaque accord d’un standard, les notes que les grands solistes ont vraiment jouées : la couleur de l’accord, vue depuis 456 solos transcrits.

## Avant de publier

- [ ] Les données sont produites par `pipeline/build.ts` (`npm run data -- ou-le-solo-respire`) dans `public/data/ou-le-solo-respire/`, avec leur contrat et leur validation dans `data/`.
- [ ] Les calculs sont des fonctions pures, testées (`domain/`).
- [ ] Les sections « Comment lire », « La méthode », « Sources » et « Ce que ça ne dit pas » sont rédigées.
- [ ] L'affichage a été vérifié en clair, en sombre et sur mobile (375 px).
- [ ] L'image d'aperçu est générée : `npm run og -- ou-le-solo-respire` crée `public/og/ou-le-solo-respire.png`.
- [ ] Dans `src/shell/site.ts`, le statut passe de `draft` à `published`, avec le mois de publication.
