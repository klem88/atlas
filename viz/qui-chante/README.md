# Qui chante autour de chez toi

Les oiseaux observés autour de ta commune, leurs chants et le chœur de l’aube.

## Avant de publier

- [ ] Les données sont produites par `pipeline/build.ts` (`npm run data -- qui-chante`) dans `public/data/qui-chante/`, avec leur contrat et leur validation dans `data/`.
- [ ] Les calculs sont des fonctions pures, testées (`domain/`).
- [ ] Les sections « Comment lire », « La méthode », « Sources » et « Ce que ça ne dit pas » sont rédigées.
- [ ] L'affichage a été vérifié en clair, en sombre et sur mobile (375 px).
- [ ] L'image d'aperçu est générée : `npm run og -- qui-chante` crée `public/og/qui-chante.png`.
- [ ] Dans `src/shell/site.ts`, le statut passe de `draft` à `published`, avec le mois de publication.
