# La gamme qui monte sans fin

Un son qui monte, monte, monte… et ne va nulle part. L’illusion de Shepard, vue de l’intérieur : une hélice de hauteurs qui tourne sur elle-même.

Pas de pipeline ni de données.

- `domain/shepard.ts` : composantes du son de Shepard (neuf octaves, enveloppe cosinus), noms de notes, points de l'hélice, compteur (testé).
- `ui/shepard-synth.ts` : neuf oscillateurs Web Audio, gains lissés, articulation des marches.
- `scene/helix.ts` : l'hélice three.js, les sphères des composantes, les noms autour, deux vues (côté, dessus).
- `ui/spectrum.ts` : le spectre SVG sous la scène.
- `ui/share-card.ts`, `og/build-og.ts` : images de partage et d'aperçu.

## Avant de publier

- [x] Les calculs sont des fonctions pures, testées (`domain/`).
- [x] Les sections « Comment lire », « La méthode », « Sources » et « Ce que ça ne dit pas » sont rédigées.
- [x] L'affichage a été vérifié en clair, en sombre et sur mobile (375 px) dans le navigateur de développement.
- [x] L'image d'aperçu est générée : `npm run og -- gamme-sans-fin` crée `public/og/gamme-sans-fin.png`.
- [ ] Relecture de l'auteur au casque (l'illusion, le paradoxe du triton).
- [ ] Dans `src/shell/site.ts`, le statut passe de `draft` à `published`, avec le mois de publication.
