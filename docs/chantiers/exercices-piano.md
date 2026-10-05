# Chantier : Exercices au piano

Slug du premier exercice : `six-ficelles` · Branche : `feat/exercices-piano` (depuis `main`)

## Intention

Une rubrique « Exercices au piano » sur l’accueil, à côté des visualisations : des partitions à jouer, avec leur écoute, pour mettre les doigts sur ce que montrent les pages musicales. Demandée par l’auteur le 5 octobre 2026, après la partition « Six ficelles au piano » faite en page autonome : il veut que toutes ses recherches musicales restent dans le même dépôt, et que la partition défile seule pendant l’écoute pour garder les mains sur le clavier.

## Critères de fin

- [x] L’accueil range les exercices dans leur rubrique (`kind: 'exercice'` dans `src/shell/site.ts`), cachée tant qu’aucun n’est publié.
- [x] Socle commun dans `src/shell/music/` :
  - `score.ts` : rendu abcjs à la largeur, `pianoTune`, `abcNotes` et `abcWarnings` pour les tests ;
  - `piano.ts` : piano de synthèse à notes programmées ;
  - `follow.ts` : zone de suivi et pause quand l’utilisateur fait défiler ;
  - `exercise.ts` : branchement par attributs HTML, avec tempo retenu, curseur, défilement automatique, écran allumé, boucle et main droite coupée ;
  - `score.css`.
- [x] `npm run new:viz -- <slug> --exercice` crée un exercice depuis `viz/_exercice/`.
- [x] Premier exercice « Six ficelles au piano » publié, partitions testées note à note.
- [x] Vérifié sur mobile, en clair et en sombre. Le suivi de lecture a été mesuré : la note jouée reste entre le quart et les deux tiers de l’écran.

## Décisions

- **Une page par exercice** plutôt qu’une page unique à onglets : chacun a sa propre adresse, à mettre en favori sur la tablette du pupitre.
- **abcjs** (paquet npm) pour la gravure : la notation ABC est lisible et facile à écrire à la main, et le rendu se fait en SVG. Pièges rencontrés :
  - abcjs lit « Do9 » comme un accord anglais : les noms d’accords sont écrits en annotations (`"^Do9"`) ;
  - un changement de tonalité en cours de ligne s’affiche dès le début à la main gauche : `pianoTune` redit la tonalité en tête de cette voix.
- **Son** : un piano de synthèse maison (`piano.ts`), parce que les banques de sons d’abcjs se chargent depuis un autre site. `synth.ts` tient des accords comme un orgue et ne convient pas à des voix indépendantes.
- **Défilement** : la ligne jouée est gardée entre 8 % et 90 % de l’écran, sous le bandeau de tempo, et replacée à 22 % quand elle en sort. Un geste de défilement (molette, doigt, touches) suspend le suivi 4 s. Si le défilement doux n’avance pas, la page saute directement à la ligne.

## Prochaine action

Recueillir le retour de l’auteur au piano (sur tablette) : le confort du suivi, le son, et les exercices suivants à écrire (autre ambiance, autre tonalité, improvisation).
