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
- **Défilement** (revu le 5 octobre 2026 à la demande de l’auteur, qui trouvait les sauts trop brusques) :
  - la ligne jouée reste au **centre** de l’espace visible sous le bandeau, pour que les yeux puissent toujours lire la suite ;
  - la page glisse en continu vers la ligne suivante pendant les 40 derniers pour cent de la ligne en cours (15 % pour un retour de reprise) ;
  - le mouvement est lissé à chaque image ; un geste de défilement suspend le suivi 4 s, puis le suivi revient en douceur ;
  - calcul pur et testé dans `follow.ts` (`lineSpans`, `centeredScroll`, `easeToward`).
- **Degrés** : choix « Accords / Degrés / Les deux » dans le bandeau, retenu d’une visite à l’autre. Dans l’ABC, chaque accord s’écrit `"^Do7M|I7M"` ; `applyChordLabels` garde l’un, l’autre ou les deux. Chiffrage : chiffres romains, majuscule = majeur, ⁶ et ⁶₄ pour les renversements, V/x pour les dominantes secondaires, IV/V pour l’accord sur basse étrangère. Les annotations sont lues en appariant les guillemets dans l’ordre (`mapAnnotations`) : une expression régulière confondait le dièse de `"_3"^c4` avec une annotation.

## Deuxième exercice : « Improviser sur trois grilles nostalgiques »

Branche `feat/improviser-nostalgie` (depuis `main`), en brouillon. Demandé le 5 octobre 2026 : le même rendu, mais centré sur l’improvisation, avec une progression nostalgique, et « je dois comprendre ce que je joue ». Choix de l’auteur :
- les trois grilles proposées, **sur une seule page avec un sélecteur** : le cycle des quintes (les accords des *Feuilles mortes*), la basse qui descend, la douce-amère ;
- la méthode complète en six étapes : main gauche, ligne guide, gamme, notes cibles, motif, question-réponse ;
- La mineur / Do (presque tout sur les touches blanches) ;
- une main gauche « basse + deux notes tenues », la même à toutes les étapes.

Socle touché : `mountExercise` renvoie `setScores` (changer toutes les partitions sans recharger la page). Les styles de la grille en jetons et du tableau passent de `viz/six-ficelles/viz.css` à `src/shell/music/score.css`, puisque deux exercices s’en servent.

## Prochaine action

Recueillir le retour de l’auteur au piano sur « Improviser sur trois grilles nostalgiques » (`feat/improviser-nostalgie`) : les grilles, les exemples de main droite, la difficulté de la main gauche. Ensuite : image d’aperçu, publication, fusion sur `main`. Retour toujours attendu sur Six ficelles (confort du suivi, son).
