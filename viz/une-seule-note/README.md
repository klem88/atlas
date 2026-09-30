# Ce qu’une seule note contient

Joue un do : tu entends déjà un accord majeur. Allume et éteins ses harmoniques une à une, et découvre celles que ton piano ne sait pas jouer.

Pas de pipeline ni de données. Le module musique du socle fournit hauteurs, clavier et synthé (amplitudes par harmonique) ; ici :

- `domain/partials.ts` : série harmonique, touche la plus proche et écart en cents, onde somme, résumé (testé).
- `ui/rail.ts` : le rail des jetons au-dessus du clavier (élément signature), positions lues sur les touches.
- `ui/wave.ts` : l'onde résultante ; `drawWave` sert aussi à l'image de partage.
- `ui/share-card.ts` : image de partage ; `drawKeyboardStrip` sert aussi à l'image d'aperçu (`og/build-og.ts`).

## Avant de publier

- [x] Les calculs sont des fonctions pures, testées (`domain/`).
- [x] Les sections « Comment lire », « Le calcul », « Sources » et « Ce que ça ne dit pas » sont rédigées.
- [x] L'affichage a été vérifié en clair, en sombre et sur mobile (375 px) dans le navigateur de développement.
- [x] L'image d'aperçu est générée : `npm run og -- une-seule-note` crée `public/og/une-seule-note.png`.
- [ ] Relecture de l'auteur (jetons au doigt, son au casque).
- [ ] Dans `src/shell/site.ts`, le statut passe de `draft` à `published`, avec le mois de publication.
