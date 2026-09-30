# Pourquoi une tierce sonne douce

Glisse d’une note à l’autre et écoute la rugosité monter et descendre : les intervalles doux sont des vallées, et ton piano n’en atteint aucune tout à fait.

Pas de pipeline ni de données. Le module musique du socle fournit hauteurs et synthé (mode « tenu » pour le glissando) ; ici :

- `domain/roughness.ts` : dissonance de deux partiels (Plomp–Levelt, paramètres de Sethares), rugosité d'un intervalle, courbe cent par cent, vallées et rapports simples (testé).
- `ui/landscape.ts` : le paysage SVG, ses vallées, les repères du piano, le curseur que l'on glisse.
- `ui/share-card.ts` : image de partage ; `drawLandscape` sert aussi à l'image d'aperçu (`og/build-og.ts`).

## Avant de publier

- [x] Les calculs sont des fonctions pures, testées (`domain/`).
- [x] Les sections « Comment lire », « La méthode », « Sources » et « Ce que ça ne dit pas » sont rédigées.
- [x] L'affichage a été vérifié en clair, en sombre et sur mobile (375 px) dans le navigateur de développement.
- [x] L'image d'aperçu est générée : `npm run og -- consonance` crée `public/og/consonance.png`.
- [ ] Relecture de l'auteur (glisser au doigt, son tenu au casque).
- [ ] Dans `src/shell/site.ts`, le statut passe de `draft` à `published`, avec le mois de publication.
