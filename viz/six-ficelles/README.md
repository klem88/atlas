# Six ficelles au piano

Une grille de huit mesures en Do, puis un ton plus haut, qui réunit les six ficelles de la chanson française : à jouer en quatre étapes, des accords plaqués à la mélodie.

Exercice au piano (rubrique « Exercices au piano » de l’accueil), né le 5 octobre 2026 de la relecture des [Ficelles](../les-ficelles/) : l’auteur savait poser les accords mais n’aimait pas le résultat. L’exercice montre ce qui manquait : des positions où la main droite bouge le moins possible, une ligne cachée, et une mélodie posée sur les notes de couleur.

## Comment c’est fait

- Les quatre partitions sont dans `domain/partition.ts`, en notation ABC, assemblées par `pianoTune` (`src/shell/music/score.ts`).
- `domain/partition.test.ts` vérifie note à note, après déroulé des reprises et application des altérations :
  - chaque note des étapes 1 et 2 appartient à l’accord écrit, avec la bonne basse ;
  - la ligne cachée descend bien si♭, la, la♭, sol ;
  - la mélodie tombe sur les notes de couleur annoncées.
- La page déclare ses étapes en HTML ; `mountExercise` (`src/shell/music/exercise.ts`) fait le rendu, l’écoute, le curseur et le défilement automatique.

## Publication

- [x] Partitions lisibles sans avertissement et hauteurs vérifiées (`npm test`).
- [x] Textes « Comment lire », « Pourquoi ça sonne », « Ce que l’exercice ne dit pas ».
- [x] Vérifiée sur mobile (375 px), en clair et en sombre, lecture et défilement compris.
- [x] Image d’aperçu : `npm run og -- six-ficelles`.
- [x] Publiée le 5 octobre 2026.
