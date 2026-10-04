# Les ficelles

Six procédés de la chanson française des années 70 pour transformer une progression simple : à voir sur la portée, à écouter, à garder ou non.

- Fiche de chantier : `docs/chantiers/les-ficelles.md`.
- Pas de données : des règles écrites et testées (`domain/ficelles/`), une réalisation à quatre voix dans le socle (`src/shell/music/realisation.ts`).
- Titres signés : `data/signatures.ts`, affichés seulement une fois validés à l’oreille par l’auteur.
- Dépend de `viz/compose-ta-progression/state.ts` (`KEY_NAMES`).

## Avant de publier

- [ ] Au moins une ficelle sur deux porte un titre validé.
- [ ] L'affichage a été vérifié en clair, en sombre et sur mobile (375 px), et sur le téléphone de l'auteur.
- [ ] L'image d'aperçu est générée : `npm run og -- les-ficelles`.
- [ ] Dans `src/shell/site.ts`, le statut passe de `draft` à `published`, avec le mois de publication (décision de l'auteur).
