# Chantiers

Un chantier = une fiche ici + une branche `feat/<slug>`. On mène **un chantier à la fois** : le quota de tokens est la vraie limite, et le parallélisme ne le multiplie pas.

## Reprendre un chantier

Dans une session neuve : *« Reprends docs/chantiers/<slug>.md »*. La fiche suffit : objectif, critères de fin, tâches, décisions prises, et **prochaine action**.

## Règles

- Un commit par tâche cochée, fiche mise à jour dans le même commit : une coupure ne coûte que quelques minutes.
- Rien d'inachevé sur `main` (chaque push déploie). On fusionne quand les critères de fin sont remplis.
- Les décisions de l'auteur sont regroupées en début de créneau, dans la section « À décider » de la fiche.

## Cycle d'une visualisation

1. Cadrage d'une page (phrase partageable, écran principal, données) → validation.
2. Données d'abord : sources, licences, volumes, puis pipeline.
3. Calculs purs et tests (`domain/`).
4. Visualisation, mobile d'abord, clair et sombre → validation sur téléphone.
5. Image d'aperçu, `status: 'published'`, fusion sur `main`.

## En cours et à venir

| Ordre | Chantier | État |
| --- | --- | --- |
| 1 | [mobile-salaire](mobile-salaire.md) | en ligne, en attente du retour de l'auteur |
| 2 | [piano-temperament](piano-temperament.md) : Pourquoi ton piano est (légèrement) faux | publiée le 1er octobre 2026 |
| 2b | [forme-accord](forme-accord.md) : La forme d’un accord (three.js) | publiée le 1er octobre 2026 |
| 2c | [consonance](consonance.md) : Pourquoi une tierce sonne douce | publiée le 1er octobre 2026 |
| 2d | [gamme-sans-fin](gamme-sans-fin.md) : La gamme qui monte sans fin (three.js) | publiée le 1er octobre 2026 |
| 2e | [une-seule-note](une-seule-note.md) : Ce qu’une seule note contient | publiée le 1er octobre 2026 |
| 3 | Point de ralliement et nom du site | à décider par l'auteur |
| 3a | [progression-jouee](progression-jouee.md) : Ta progression a déjà été jouée 40 000 fois | construite en brouillon sur `feat/progression-jouee` (nuit du 1er octobre), en attente de relecture |
| 3b | [fleuve-des-accords](fleuve-des-accords.md) : Le fleuve des enchaînements | construite en brouillon sur `feat/fleuve-des-accords`, en attente de relecture |
| 3c | [voyage-sur-le-tore](voyage-sur-le-tore.md) : Le voyage sur le tore | publiée ; refaite à plat (canvas 2D) le 2 octobre 2026 |
| 3d | [carte-des-styles](carte-des-styles.md) : La boussole des styles | sonde négative (pas d'îles sauf le jazz), repli « boussole » construit en brouillon sur `feat/carte-des-styles` |
| 3e | [cinquante-ans-de-refrains](cinquante-ans-de-refrains.md) : Cinquante ans de refrains | construite en brouillon sur `feat/cinquante-ans-de-refrains`, en attente de relecture |
| 3f | [ou-le-solo-respire](ou-le-solo-respire.md) : Où le solo respire | construite sur `feat/ou-le-solo-respire`, **page non vérifiée en navigateur** ; courriel Weimar à envoyer |
| 3g | [compose-ta-progression](compose-ta-progression.md) : Compose ta progression | publiée le 2 octobre 2026, en attente de relecture |
| 3h | [suis-les-fleches](suis-les-fleches.md) : Suis les flèches | brouillon sur `feat/suis-les-fleches` : carte, voisins, modulation, bande des quintes ; en attente de relecture |
| 3i | [chemin-des-accords](chemin-des-accords.md) : Le chemin des accords | publiée ; piste B (guidage) sur `feat/chemin-guidage`, en attente de relecture |
| 4 | [Qui chante autour de chez toi](qui-chante.md) | publiée (2026-09-30) ; restent l'image de partage et le test sur téléphone |
| 5 | [Sous tes pieds](sous-tes-pieds.md) | cadrage validé, sondes faites |

### Cycle « harmonies » (nuit du 30 septembre 2026)

Cinq visualisations musicales construites en autonomie, chacune en brouillon sur sa branche, en chaîne : `feat/piano-temperament` → `feat/forme-accord` → `feat/consonance` → `feat/gamme-sans-fin` → `feat/une-seule-note`. Fusionnées sur `main` et publiées le 1er octobre 2026.

### Cycle « progressions » (cadré le 1er octobre 2026)

Six pages fondées sur trois corpus (Chordonomicon, iRb, McGill Billboard, plus Weimar pour la dernière), voir [sondes-progressions](sondes-progressions.md). Elles s'enchaînent dans l'ordre 3a → 3f, chacune sur sa branche construite sur la précédente, à partir de `docs/progressions` (qui contient le cycle « harmonies »). La première construit le socle commun (`src/shell/music/chords.ts`, `tools/lib/corpora.ts`) ; on ne commence pas la suivante avant que la précédente ait son pipeline, son `REPORT.md` et sa page vérifiée sur mobile.

### Sessions parallèles

Exception à la règle « un chantier à la fois », choisie par l'auteur. Chaque session travaille dans **son propre worktree** (`git worktree add ../atlas-<slug> -b feat/<slug>`), jamais dans le même dossier qu'une autre, et ne touche au socle (`src/shell/`) qu'en le signalant dans sa fiche : le premier chantier fusionné sur `main` passe, l'autre se met à jour depuis `main` avant de fusionner.
