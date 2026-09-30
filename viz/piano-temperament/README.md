# Pourquoi ton piano est (légèrement) faux

Joue un accord et regarde les ondes battre : sur un piano, aucune quinte n’est juste, et c’est voulu.

## Avant de publier

- [ ] Les données sont produites par `pipeline/build.ts` (`npm run data -- piano-temperament`) dans `public/data/piano-temperament/`, avec leur contrat et leur validation dans `data/`.
- [ ] Les calculs sont des fonctions pures, testées (`domain/`).
- [ ] Les sections « Comment lire », « La méthode », « Sources » et « Ce que ça ne dit pas » sont rédigées.
- [ ] L'affichage a été vérifié en clair, en sombre et sur mobile (375 px).
- [ ] L'image d'aperçu est générée : `npm run og -- piano-temperament` crée `public/og/piano-temperament.png`.
- [ ] Dans `src/shell/site.ts`, le statut passe de `draft` à `published`, avec le mois de publication.
