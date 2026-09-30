# Chantier : Pourquoi une tierce sonne douce

Slug : `consonance` · Branche : `feat/consonance` (construite sur `feat/forme-accord`)

## Intention

Le paysage de la rugosité : on glisse une note contre une autre, de l'unisson à l'octave, et on entend (et voit) la rugosité monter et descendre. Les intervalles doux sont des **vallées** : l'octave, la quinte, la quarte, la tierce, la sixte. Deux révélations :

1. **Sans harmoniques, il n'y a pas de vallées.** Deux sinusoïdes pures ne préfèrent aucun intervalle : le paysage est une seule colline. Les vallées naissent des harmoniques (modèle de Plomp et Levelt, formulé par Sethares). La consonance est une affaire de timbre.
2. **Le piano ne touche le fond d'aucune vallée**, sauf l'octave : ses douze notes sont posées à côté (la tierce à 14 cents du fond). Et dans le grave, les vallées se rétrécissent : une tierce basse est rugueuse, d'où les accords « ouverts » des basses.

- Viral ★★ (la courbe de dissonance est un classique qui surprend toujours ; international), faisable ★★★ (aucune donnée), adéquation ★★★.
- Troisième page du cycle « harmonies », après « Pourquoi ton piano est (légèrement) faux » et « La forme d'un accord ».

## Cadrage (30 septembre 2026, décidé par Claude sur mandat de l'auteur)

**Phrase partageable** : *« Sans harmoniques, une tierce n'est pas plus douce qu'un triton. »*

**Écran principal** : le paysage (courbe de rugosité de 0 à 1 200 cents, aire remplie, vallées nommées), un curseur que l'on glisse au doigt ou à la souris, les douze notes du piano en repères. Le son suit le curseur (deux sons tenus, glissando).

- **Panneau** : le résultat (intervalle en cents, note la plus proche, nom de la vallée la plus proche et à combien de cents on en est, rugosité relative), *Écouter* (son tenu qui suit le curseur), *Timbre* (1, 3, 6 ou 10 harmoniques), *Registre* (do2, do3, do4), intervalles préréglés, *Partager*.
- **Scène** : SVG, la courbe recalculée à chaque changement de timbre ou de registre ; les vallées annotées (rapport et nom) ; les repères du piano en traits fins, celui de la note tempérée la plus proche du curseur souligné.
- **URL** : `?cents=386&harmoniques=6&grave=60`.
- **Données** : aucune. Domaine : dissonance de deux partiels (Sethares 1993), rugosité d'un intervalle, courbe, vallées ; testé.

## Critères de fin

- Calculs purs testés, chaque chiffre affiché vérifié, la courbe reproduit les vallées attendues (2/1, 3/2, 4/3, 5/3, 5/4, 6/5).
- Glissement fluide au doigt (375 px), clair et sombre, curseur accessible au clavier (`input type=range`).
- Son tenu sur geste seulement, volume bas, coupé quand on quitte la page.
- Image de partage et d'aperçu, `status: 'published'` (geste de l'auteur).

## Décisions

- Modèle : Plomp et Levelt tel que paramétré par Sethares (*Tuning, Timbre, Spectrum, Scale*, 1993) : d(x) = a₁a₂ (e^(−3,5 s x) − e^(−5,75 s x)), s = 0,24 / (0,021 f_min + 19), sommée sur toutes les paires de partiels des deux notes. Amplitudes en 0,88ⁿ (comme Sethares), pour que les vallées hautes restent visibles.
- Le synthé du socle gagne un mode « tenu » (`hold`) dont les fréquences se modifient en continu.

## Tâches

- [x] Cadrage, `npm run new:viz -- consonance`
- [x] Domaine : dissonance de paire, rugosité, courbe, vallées ; tests
- [x] Synthé tenu (socle : `Synth.hold`)
- [x] Paysage SVG, curseur, repères du piano
- [x] Panneau, résultat, préréglages, état dans l'URL
- [x] Textes, image de partage, image d'aperçu
- [x] Vérification mobile/clair/sombre dans le navigateur de développement
- [x] Publiée le 1er octobre 2026 à la demande de l'auteur (relecture sur téléphone à faire après coup)

## Prochaine action

Relecture de l'auteur : `git checkout feat/consonance`, `npm run dev`, page `/viz/consonance/`.
