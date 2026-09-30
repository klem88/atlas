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

## Décisions de construction (nuit du 1er octobre 2026)

- **Comparaison en classe de triade** : G7, Gmaj7 et G comptent tous comme V ; Dm7 et Dm comme ii. Le jeton « septième » de la fiche n'existe donc pas dans la saisie : la page le dit (« ii–V–I trouve aussi les ii7–V7–IΔ »). Six classes : majeur, mineur, diminué, augmenté, suspendu, autre ; les accords de puissance (« no3d ») comptent comme majeurs.
- **Tonique de comparaison = relatif majeur.** Un morceau en la mineur est compté dans l'armure de do : Am–F–C–G s'écrit vi–IV–I–V. Le mode estimé est conservé à part (pour dire « dont N en mineur ») ; l'utilisateur peut saisir en mineur (i–bVI–bIII–bVII), la page convertit et l'indique.
- Les degrés sont épelés par rapport à la gamme majeure (bIII, #IV, bVII), en minuscules pour mineur et diminué.
- Chordonomicon écrit le dièse « s » (« Csmin ») : le lecteur d'accords le comprend, sauf devant « sus ».
- **Estimation de tonalité** : accord avec la gamme majeure pondéré par la durée, plus des indices de tonique (premier et dernier accord, débuts de section, poids des accords de tonique, cadence V→I), six poids ajustés par grille sur iRb et Billboard. Résultat : **86,5 % de toniques justes sur le Billboard** (pop, comme l'essentiel de Chordonomicon), **81,5 % d'armures justes sur l'iRb** (jazz, 1 % de Chordonomicon). Le seuil de 85 % de la fiche est tenu sur la pop, pas sur le jazz : Chordonomicon reste utilisé pour les comptages, et la page publie les deux chiffres.
- **Seuils par longueur** (20 jusqu'à 4 accords, 30 à 5, 40 à 6, 50 à 7 et 8) pour que chaque part reste sous 800 Ko gzippés ; la page ne charge que la longueur saisie.
- **« Première fois »** : première année où au moins trois morceaux datés contiennent la suite ; les dates avant 1920 (des « 1900 » bouche-trous) sont ignorées.
- Les jetons de degrés des morceaux nommés sont recalculés dans le navigateur (le fichier `songs.json` ne porte que les symboles et les durées).
- Le clavier de saisie reconnaît une triade (majeure, mineure, diminuée, augmentée, suspendue, ou une quinte à vide) et la convertit en degré de la tonalité d'écoute.

## Tâches

- [x] Socle : `src/shell/music/chords.ts` (symboles des trois écritures, dix qualités, six classes de triade), `degrees.ts` (degrés, jetons d'un octet, étiquettes, rotations), `key.ts` (estimation de tonalité), 41 tests
- [x] Outils : `tools/lib/corpora.ts` (téléchargement avec cache commun `tools/.cache/corpora/`, lecture en flux du CSV, du paquet iRb et des fichiers salami), tests sur des extraits
- [x] Pipeline : nettoyage, tonalité, suites de degrés, comptages, exemples, `REPORT.md` (7,7 min)
- [x] Domaine : recherche d'une progression dans les agrégats, rotations proches, phrase de résultat, exemples nommés et surlignage, voix et reconnaissance d'accord ; tests
- [x] Interface : saisie des degrés, clavier, frise des décennies, exemples et grilles, son, URL
- [x] Textes, image de partage, image d'aperçu
- [x] Vérification mobile (375 px), clair et sombre dans le navigateur de l'éditeur (nuit du 1er octobre)
- [ ] Relecture de l'auteur sur téléphone, publication

## Prochaine action

Relecture de l'auteur : `git checkout feat/progression-jouee`, `npm run dev`, http://localhost:5173/viz/progression-jouee/ . Points à regarder : la phrase de résultat, le seuil par longueur, le clavier de saisie. Pour publier : `status: 'published'` dans `src/shell/site.ts`, fusion sur `main`.
