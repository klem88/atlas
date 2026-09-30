# Chantier : Ta progression a déjà été jouée 40 000 fois

Slug : `progression-jouee` · Branche : `feat/progression-jouee` (construite sur `docs/progressions`, donc sur le cycle « harmonies »)

## Intention

On choisit quatre accords (ou plus) en degrés, I–V–vi–IV par exemple, ou on les joue sur le clavier dans une tonalité, et la page répond : combien de morceaux utilisent cette suite, dans quels genres, depuis quand, avec des standards qui la contiennent. Le levier « le résultat parle de moi » du cycle progressions : *ma* progression, *mon* chiffre.

- Viral ★★★ (le chiffre se partage, les exemples font débat), faisable ★★★ (pipeline de comptage), adéquation ★★★.
- Première page du cycle « progressions » : elle construit le socle (lecture des accords, degrés, estimation de tonalité, agrégats) que les cinq autres réutilisent.

## Cadrage (1er octobre 2026, décidé par Claude sur mandat de l'auteur)

**Phrase partageable** : *« Ma progression préférée est dans 38 412 morceaux. La première fois, c'était en 1954. »*

**Écran principal** : la saisie de la progression (jetons de degrés I à vii°, majeurs, mineurs, septièmes, en boucle de 2 à 8 accords, ou le clavier commun pour la jouer dans une tonalité), et sous elle **la frise des décennies** (élément signature) : la part des morceaux de chaque décennie qui contiennent la progression, par genre en rubans discrets, avec le total en gros.

- **Panneau** : la progression courante (jetons réordonnables, retrait, ajout), tonalité pour l'écoute, *Écouter* (l'accord après l'autre, puis en boucle, synthé du socle), le résultat (nombre de morceaux, part du corpus, décennie et genre où elle est la plus fréquente), *Partager*.
- **Scène** : la frise, et sous elle **les exemples** : standards de jazz (iRb) et tubes du Billboard (McGill) qui contiennent la progression, avec la section où elle apparaît ; on clique un exemple pour voir sa grille complète, les accords de la progression surlignés, et l'écouter.
- **Préréglages** : I–V–vi–IV (les « quatre accords »), ii–V–I, I–vi–IV–V (les années 50), i–VII–VI–VII (Andalouse), I–IV–V (blues), vi–IV–I–V, I–bVII–IV (rock).
- **URL** : `?p=I,V,vi,IV&t=C`.
- **Données** : Chordonomicon (volumes, genres, décennies), iRb et Billboard (exemples nommés). Le pipeline compte, pour chaque suite de 2 à 8 degrés (ramenée à la tonalité estimée ou connue, qualités réduites, rotations distinctes conservées), les morceaux qui la contiennent, par genre et par décennie ; il ne garde que les suites vues au moins 20 fois (les autres répondent « moins de 20 »). Estimation de tonalité mesurée sur iRb et Billboard, précision publiée.

## Critères de fin

- Pipeline avec rapport qualité : taille du corpus après nettoyage, précision de l'estimation de tonalité, nombre de progressions retenues, taille des agrégats (< 1 Mo gzippé).
- Chaque chiffre affiché recalculable depuis les agrégats ; tests sur les degrés, la normalisation, le comptage.
- Mobile : jetons touchables, frise lisible à 375 px ; clair et sombre.
- Attribution des trois corpus ; image de partage (chiffre + frise) et d'aperçu ; `status: 'published'` (geste de l'auteur).

## Décisions

- Les progressions sont comparées **en degrés avec qualité réduite** (I, ii, iii, IV, V, vi, vii°, plus les emprunts bVII, bVI, bIII, iv, V/V…) : deux morceaux dans deux tonalités comptent ensemble.
- **Les rotations comptent séparément** : I–V–vi–IV et vi–IV–I–V sont deux progressions (leur effet diffère), mais la page signale les rotations proches.
- Le compteur dit « morceaux qui contiennent la suite au moins une fois », jamais « morceaux construits sur ».
- La tonalité estimée est signalée comme telle ; en dessous de 85 % de précision mesurée, Chordonomicon ne sert plus qu'aux transitions.

## Tâches

- [ ] Socle : `src/shell/music/chords.ts` (symboles, qualités, degrés, estimation de tonalité), tests
- [ ] Outils : `tools/lib/corpora.ts` (téléchargement avec cache, lecture des trois corpus), tests sur des extraits
- [ ] Pipeline : nettoyage, tonalité, suites de degrés, comptages, exemples, `REPORT.md`
- [ ] Domaine : recherche d'une progression dans les agrégats, rotations proches, phrase de résultat ; tests
- [ ] Interface : saisie des degrés, clavier, frise des décennies, exemples et grilles, son, URL
- [ ] Textes, image de partage, image d'aperçu
- [ ] Vérification mobile/clair/sombre, relecture de l'auteur, publication

## Prochaine action

Créer la branche, `npm run new:viz -- progression-jouee`, puis le socle `chords.ts` en TDD (les fiches suivantes en dépendent).
