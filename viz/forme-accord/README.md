# La forme d’un accord

Chaque accord dessine une courbe dans l’espace : simple quand il est pur, qui tourne sans fin quand il vient d’un piano.

Pas de pipeline ni de données. Le module musique du socle (`src/shell/music/`) fournit les hauteurs, les accordages, le synthé et le clavier ; ici :

- `domain/curve.ts` : rapports relatifs et entiers d'un accord, tours avant fermeture, précession, points de la courbe (testé).
- `scene/scene.ts` : la scène three.js (ligne épaisse dégradée, tête, cube des axes, orbite, rotation lente, thème).
- `ui/share-card.ts` : image de partage à partir de la vue WebGL.
- `og/build-og.ts` : image d'aperçu, courbe 4:5:6 projetée.

## Avant de publier

- [x] Les calculs sont des fonctions pures, testées (`domain/`).
- [x] Les sections « Comment lire », « Le calcul », « Sources » et « Ce que ça ne dit pas » sont rédigées.
- [x] L'affichage a été vérifié en clair, en sombre et sur mobile (375 px) dans le navigateur de développement.
- [x] L'image d'aperçu est générée : `npm run og -- forme-accord` crée `public/og/forme-accord.png`.
- [ ] Relecture de l'auteur sur téléphone (deux doigts pour tourner, un doigt pour défiler).
- [ ] Dans `src/shell/site.ts`, le statut passe de `draft` à `published`, avec le mois de publication.
