# Le chemin des accords

Compose une progression sur la carte d’une tonalité : à chaque accord, vois où tu es, où tu peux aller, et d’où tu viens. Fiche : [docs/chantiers/chemin-des-accords.md](../../docs/chantiers/chemin-des-accords.md).

## Structure

- `domain/journey.ts` : le parcours, réduit pas à pas (tonalité de chaque pas, frôlement, suspens, confirmation, pivot, bandes du ruban).
- `domain/halos.ts` : les suites possibles après un accord (sept de la gamme, satellites hors gamme) et leurs parts.
- `domain/notes.ts` : la légende de chaque pas, par priorité, et les textes des bulles.
- `domain/geometry.ts` : positions des disques, des satellites et de l’anneau des tonalités, arc maison vers tonalité du moment.
- `ui/map.ts` : la carte SVG (cercle, anneau, halos, traînée, bascule) ; `ui/ribbon.ts` : le ruban ; `ui/tip.ts` : les petites bulles.
- `state.ts` : `?t=C&p=C,Am,D,G,Bm` (tonalité de départ, chemin en accords réels).
- `og/build-og.ts` : l’image d’aperçu des liens.

## Dépendances

Pas de données propres. Le code de `suis-les-fleches` (harmonie, disposition, phrase d’un pas), le chargeur de `progression-jouee` (`p2.json` : les parts des suites) et les noms de tonalités de `compose-ta-progression`, importés sans modification (dépendance de code assumée).

## Avant de publier

- [x] Les calculs sont des fonctions pures, testées (`domain/`, `state.test.ts`).
- [x] Les sections « Comment lire », « La méthode », « Sources » et « Ce que ça ne dit pas » sont rédigées.
- [x] L’affichage a été vérifié en clair, en sombre et sur mobile (375 px).
- [x] L’image d’aperçu est générée : `npm run og -- chemin-des-accords`.
- [ ] Relecture de l’auteur, puis `status: 'published'` dans `src/shell/site.ts`.
