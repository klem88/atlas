# Chantier : Ce qu’une seule note contient

Slug : `une-seule-note` · Branche : `feat/une-seule-note` (construite sur `feat/gamme-sans-fin`)

## Intention

Une note de piano n'est pas une hauteur, c'est une pile : la fondamentale et ses harmoniques, à 2, 3, 4… fois sa fréquence. Posées sur le clavier, ces harmoniques racontent toute l'harmonie occidentale : les rangs 4, 5, 6 forment **l'accord majeur** (il est déjà là, dans un seul do), le rang 7 est une septième « bleue » que **ton piano ne sait pas jouer** (31 cents trop bas, entre deux touches), et à partir du rang 8 la série se resserre jusqu'à passer entre les touches.

On allume et on éteint chaque harmonique, on entend le timbre changer, on voit l'onde changer de forme.

- Viral ★★ (« l'accord majeur est caché dans chaque note », « la note que ton piano ne peut pas jouer »), faisable ★★★ (aucune donnée, tout le socle est déjà là), adéquation ★★★.
- Cinquième page du cycle « harmonies ». Elle éclaire les quatre autres : c'est la série harmonique qui explique les battements, les nœuds, les vallées et les composantes de Shepard.

## Cadrage (1er octobre 2026, décidé par Claude sur mandat de l'auteur)

**Phrase partageable** : *« Dans un seul do, il y a déjà un accord majeur. Et une note que ton piano ne peut pas jouer. »*

**Écran principal** : le clavier (quatre octaves au-dessus de la fondamentale, défilement horizontal sur téléphone) avec, au-dessus, le **rail des harmoniques** : un jeton par rang (1 à 16), posé sur la touche la plus proche, décalé de son écart en cents, plein s'il est allumé, à l'accent s'il tombe entre les touches (plus de 15 cents). On touche un jeton pour l'allumer ou l'éteindre. Sous le clavier, l'onde résultante (deux périodes de la fondamentale).

- **Panneau** : fondamentale (do1, do2, do3), *Écouter* (son tenu, mis à jour à chaque jeton), préréglages (fondamentale seule ; l'accord caché 4·5·6 ; la septième bleue 4·5·6·7 ; toutes), résultat (combien tombent sur une touche, la plus fausse et son écart, ce qu'on entend), *Partager*.
- **URL** : `?fondamentale=36&rangs=1,4,5,6`.
- **Données** : aucune. Domaine : série harmonique, note la plus proche et écart en cents, onde somme ; testé.

## Critères de fin

- Domaine testé (le rang 7 à −31 cents, le rang 11 à −49, le 5 à −14, le 3 à +2).
- Clavier défilable au doigt, jetons touchables (44 px), clair et sombre.
- Son sur geste seulement, volume bas, mise à jour des amplitudes sans clic.
- Image de partage et d'aperçu, `status: 'published'` (geste de l'auteur).

## Décisions

- Amplitudes en 1/k quand un rang est allumé : un timbre « dent de scie » adouci, assez riche pour entendre chaque rang.
- Le synthé du socle : `hold` accepte des amplitudes par harmonique et `setAmplitudes` les modifie en continu.
- Seize rangs : au-delà, tout tombe entre les touches et l'oreille ne suit plus.

## Tâches

- [x] Cadrage, `npm run new:viz -- une-seule-note`
- [x] Domaine : série, note la plus proche, cents, onde ; tests
- [x] Synthé : amplitudes par harmonique (socle : `Synth.hold(freqs, amplitudes)` et `setAmplitudes`)
- [x] Rail des harmoniques sur le clavier, onde
- [x] Panneau, préréglages, état dans l'URL
- [x] Textes, image de partage, image d'aperçu
- [x] Vérification mobile/clair/sombre dans le navigateur de développement
- [ ] Relecture de l'auteur (jetons au doigt, son au casque), puis `status: 'published'` et fusion

## Prochaine action

Relecture de l'auteur : `git checkout feat/une-seule-note`, `npm run dev`, page `/viz/une-seule-note/`.
