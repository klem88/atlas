# Compose ta progression

Pose un accord, l'éventail montre les accords que les chansons jouent ensuite, à la taille de leur probabilité (conditionnée à toute la suite déjà posée) ; on compose pas à pas et la page dit combien de chansons contiennent la suite, quels styles l'aiment et quels morceaux la jouent.

## Données

Aucune donnée propre : la page lit `public/data/progression-jouee/` (`meta.json`, `songs.json`, `p2.json` … `p8.json`) par le chargeur de « Ta progression a déjà été jouée ». Si ce pipeline change de format, cette page suit.

- `npm run og -- compose-ta-progression` : image d'aperçu (l'éventail après Do – Sol – La m), depuis les vraies données.

## Structure

- `domain/next.ts` : éventail (probabilités conditionnelles, « autre chose », base), tirage pondéré, noms d'accords dans une tonalité, phrases ; testé.
- `ui/fan.ts` : disposition de l'éventail (arc centré sur le plus probable, sans chevauchement ; testée), rendu SVG et canvas ; `ui/share-card.ts`.
- Dépend de `viz/progression-jouee/{data,domain}` (contrat, chargeur, exemples, étiquettes de genres).

## Avant de publier

- [x] Les calculs sont des fonctions pures, testées (`domain/`, `ui/fan.ts`).
- [x] Les sections « Comment lire », « La méthode », « Sources » et « Ce que ça ne dit pas » sont rédigées.
- [ ] L'affichage a été vérifié en clair, en sombre et sur mobile (375 px) par l'auteur, sur téléphone.
- [x] L'image d'aperçu est générée.
- [x] `status: 'published'` (à la demande de l'auteur, le site n'étant visité que par lui).
