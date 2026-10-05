# Improviser sur trois grilles nostalgiques

Trois grilles mélancoliques en La mineur et en Do, et une méthode en six étapes pour improviser dessus : la main gauche d’abord, puis la gamme, les notes cibles, le motif et la question-réponse.

Deuxième exercice au piano, demandé le 5 octobre 2026 après « Six ficelles au piano » : même rendu et même fonctionnement, mais centré sur l’improvisation, avec une progression nostalgique. L’auteur a choisi les trois grilles proposées, sur une seule page avec un sélecteur, en La mineur / Do, avec une main gauche « basse + 3ce et 7e ».

## Les grilles

- **Le cycle des quintes** : les accords des *Feuilles mortes* (Kosma, 1945) en La mineur, sans leur mélodie. Ré m7 · Sol7 · Do7M · Fa7M · Si m7♭5 · Mi7 · La m7 · La m7.
- **La basse qui descend** : La m · La m/Sol♯ · La m/Sol · La m/Fa♯ · Fa7M · Ré m7 · Mi7sus4–Mi7 · La m.
- **La douce-amère** : Do7M · Mi m7 · Fa7M · Fa m6 · Do/Sol · La m7 · Ré m7–Sol7sus4 · Do.

## Les étapes

1. La main gauche seule : la basse, puis deux notes tenues qui bougent le moins possible.
2. La ligne guide : une note de l’accord par mesure, qui avance par petits pas.
3. Une seule gamme : les touches blanches, avec l’altération propre à chaque grille.
4. Les notes cibles : la ligne guide au premier temps, puis la gamme.
5. Le motif : noire, deux croches, blanche, ajusté à chaque accord.
6. Question et réponse : des phrases de deux mesures, qui commencent par un silence.

## Comment c’est fait

- `domain/partition.ts` décrit chaque grille : ses accords (nom, degré, main gauche) et, pour chaque étape, la main droite accord par accord. `partitions(grille)` assemble les six partitions ABC et place au-dessus de la portée le nom et le degré de chaque accord.
- `domain/partition.test.ts` vérifie note à note, pour les trois grilles :
  - la main gauche ne joue que les notes de l’accord, avec la bonne basse, et ses deux notes tenues bougent d’une tierce au plus ;
  - les notes cibles appartiennent à leur accord ;
  - l’exemple de gamme reste sur les touches blanches, sauf la note altérée de l’accord, et ne frotte jamais la basse ;
  - le motif garde son rythme, et les questions et réponses finissent où le texte le dit.
  Les phrases de la page sont aussi vérifiées une à une (ligne guide, basse chromatique, la♭ de Fa m6…).
- `mountExercise` (`src/shell/music/exercise.ts`) renvoie `setScores`. Le sélecteur s’en sert pour changer les six partitions sans recharger la page. La grille choisie se garde dans l’adresse (`?grille=chromatique`), et les textes propres à chaque grille portent `data-grille`.

## Avant de publier

- [x] Partitions lisibles sans avertissement et hauteurs vérifiées (`npm test`).
- [x] Textes « Comment lire », « Pourquoi ça marche », « Ce que l’exercice ne dit pas ».
- [x] Vérifiée en clair (ordinateur) et en sombre (375 px), lecture et changement de grille compris.
- [x] Image d’aperçu : `npm run og -- improviser-nostalgie`.
- [x] Publiée le 5 octobre 2026, à la demande de l’auteur, avant sa relecture au piano.
