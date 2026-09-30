# Pourquoi ton piano est (légèrement) faux

Joue un accord et regarde les ondes battre : sur un piano, aucune quinte n’est juste, et c’est voulu.

Pas de pipeline ni de données : tout se calcule dans `domain/` (fréquences, cents, battements, virgule) et s'entend par Web Audio (`ui/synth.ts`).

- `domain/pitch.ts` : MIDI, fréquences tempérées, noms français.
- `domain/tuning.ts` : tempérament égal, intonation juste, Pythagore ; cents.
- `domain/beats.ts` : harmoniques coïncidentes et battements d'une paire ou d'un accord.
- `domain/comma.ts` : virgules, spirale des quintes.
- `ui/keyboard.ts`, `ui/waves.ts` (élément signature), `ui/harmonics.ts`, `ui/spiral.ts`, `ui/share-card.ts`, `ui/strings.ts` (textes d'interface isolés pour une future version anglaise).

## Avant de publier

- [x] Les calculs sont des fonctions pures, testées (`domain/`).
- [x] Les sections « Comment lire », « La virgule », « Le calcul », « Sources » et « Ce que ça ne dit pas » sont rédigées.
- [x] L'affichage a été vérifié en clair, en sombre et sur mobile (375 px) dans le navigateur de développement.
- [x] L'image d'aperçu est générée : `npm run og -- piano-temperament` crée `public/og/piano-temperament.png`.
- [ ] Relecture de l'auteur sur téléphone, au casque.
- [ ] Dans `src/shell/site.ts`, le statut passe de `draft` à `published`, avec le mois de publication.
