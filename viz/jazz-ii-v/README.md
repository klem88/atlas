# Les ii–V du jazz

Onze progressions du jazz dans la tonalité de ton choix : quel mode jouer sur chaque accord, six paliers rythmiques avec une section rythmique qui swingue, et un carnet de tes tempos.

Exercice au piano de la rubrique « Exercices au piano » (`kind: 'exercice'` dans `src/shell/site.ts`). Contrairement aux autres exercices, il n’a **pas de partition complète** : l’auteur lit mal la portée, il veut savoir quel mode jouer sur quel accord, et sur quel rythme. Chaque palier montre seulement deux mesures écrites, que « Écouter l’exemple » joue en boucle. La fiche du chantier est dans `docs/chantiers/jazz-ii-v.md`.

## Comment c’est fait

- `domain/` (pur, testé) :
  - `progressions.ts` : les 11 grilles en degrés, avec leurs motifs de comptage ;
  - `spelling.ts` : l’orthographe des notes (le ♭II de do s’écrit ré♭) ;
  - `modes.ts` : les modes et leurs notes ;
  - `voicings.ts` : les deux mains en piano solo. À gauche les shells (fondamentale et note guide), à droite les notes guides ou les voicings A/B, avec le moins de mouvement possible sur toute la boucle ;
  - `paliers.ts` : les six paliers, ce que joue chaque main et l’accompagnement sur la grille ;
  - `cellules.ts` : les deux mesures d’exemple de chaque palier, note à note pour les deux mains ;
  - `abc.ts` : ces deux mesures en notation ABC (armure, altérations, liaisons, noms d’accords).
- Socle (`src/shell/music/`), partagé avec les futurs exercices :
  - `swing.ts` : la contrebasse qui marche, la ride et le charleston ;
  - `sounds.ts` : les sons synthétisés ;
  - `band.ts` : l’horloge Web Audio, qui joue en boucle et suit le tempo en direct ;
  - `logbook.ts` : le carnet de tampons, gardé dans le navigateur.
- `pipeline/` : `npm run data -- jazz-ii-v` compte chaque progression dans l’iRb (1 185 standards) et écrit `public/data/jazz-ii-v/frequences.json` et `standards.json`. Le rapport est dans `pipeline/REPORT.md`.
- `ui/` : le mini-clavier SVG, le carnet (grille et courbe), la liste des standards.

## Avant de publier

- [x] Tests au vert, typecheck au vert.
- [x] Affichage vérifié en clair, en sombre et sur mobile (375 px).
- [x] Image d’aperçu : `npm run og -- jazz-ii-v`.
- [ ] Écoute au piano par l’auteur : le son de la section, le swing, les voicings, les textes des paliers (publiée avant, à sa demande).
- [x] Statut `published` dans `src/shell/site.ts`.
