# Les ficelles

Six procédés de la chanson française des années 70 pour transformer une progression simple : à voir sur la portée, à écouter, à garder ou non.

## Avant de publier

- [ ] Les données sont produites par `pipeline/build.ts` (`npm run data -- les-ficelles`) dans `public/data/les-ficelles/`, avec leur contrat et leur validation dans `data/`.
- [ ] Les calculs sont des fonctions pures, testées (`domain/`).
- [ ] Les sections « Comment lire », « La méthode », « Sources » et « Ce que ça ne dit pas » sont rédigées.
- [ ] L'affichage a été vérifié en clair, en sombre et sur mobile (375 px).
- [ ] L'image d'aperçu est générée : `npm run og -- les-ficelles` crée `public/og/les-ficelles.png`.
- [ ] Dans `src/shell/site.ts`, le statut passe de `draft` à `published`, avec le mois de publication.
