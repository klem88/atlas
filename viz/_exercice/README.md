# __TITLE__

__SUMMARY__

Exercice au piano : il apparaît dans la rubrique « Exercices au piano » de l’accueil (`kind: 'exercice'` dans `src/shell/site.ts`).

## Comment c’est fait

- Les partitions sont écrites en notation ABC dans `domain/partition.ts`, une par étape, assemblées par `pianoTune` (`src/shell/music/score.ts`).
- La page déclare ses étapes en HTML avec des attributs (`data-score`, `data-play`, `data-mute`, `data-loop`). `mountExercise` (`src/shell/music/exercise.ts`) fait le reste : rendu, écoute, curseur, défilement automatique, écran maintenu allumé.
- Les noms d’accords s’écrivent en annotations au-dessus (`"^Do7M"`), les degrés en dessous (`"_7M"`) : ils prennent l’accent.

## Avant de publier

- [ ] Chaque partition se lit sans avertissement (`npm test`), et les hauteurs jouées ont été écoutées.
- [ ] Les sections « Comment lire », « Pourquoi ça sonne » et « Ce que l’exercice ne dit pas » sont rédigées.
- [ ] L’affichage a été vérifié en clair, en sombre et sur mobile (375 px), lecture et défilement compris.
- [ ] L’image d’aperçu est générée : `npm run og -- __SLUG__` crée `public/og/__SLUG__.png`.
- [ ] Dans `src/shell/site.ts`, le statut passe de `draft` à `published`, avec le mois de publication.
