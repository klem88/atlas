# Chantier : La gamme qui monte sans fin

Slug : `gamme-sans-fin` · Branche : `feat/gamme-sans-fin` (construite sur `feat/consonance`)

## Intention

L'illusion de Shepard (1964) et le glissando de Risset : un son qui semble monter indéfiniment sans jamais aller plus haut. On l'entend, et on **voit pourquoi** : la hauteur est une hélice (un tour = une octave, la hauteur = la position sur l'hélice) et le son de Shepard est un accord d'octaves qui grimpe l'hélice pendant que ses composantes s'éteignent en haut et renaissent en bas. Vu de dessus, l'hélice est un cercle : le son tourne, il ne monte pas.

- Viral ★★★ (illusion sonore, immédiate, internationale ; le compteur « tu as monté 40 demi-tons sans bouger » se partage), faisable ★★★ (aucune donnée), adéquation ★★★ (three.js, musique).
- Quatrième page du cycle « harmonies ». Deuxième page en three.js.

## Cadrage (1er octobre 2026, décidé par Claude sur mandat de l'auteur)

**Phrase partageable** : *« J'ai monté 48 demi-tons. Je suis toujours au même endroit. »*

**Écran principal** : l'hélice des hauteurs en 3D, les composantes du son qui la gravissent (sphères dont la taille suit la force), un bouton *Jouer* ; vue de côté (on voit monter) ou de dessus (on voit tourner).

- **Panneau** : *Jouer / Arrêter* ; *Sens* (monte / descend) ; *Mouvement* (glissando continu / par demi-tons) ; *Vitesse* (lente / normale / rapide) ; *Vue* (de côté / de dessus) ; le compteur (demi-tons parcourus depuis le départ, tours d'hélice, et la note où l'on est) ; *Paradoxe du triton* (deux sons à six demi-tons : monte ou descend ? la réponse dépend de l'auditeur) ; *Partager*.
- **Scène** : three.js, hélice de 9 octaves (fil discret), 12 noms de notes autour, sphères des composantes (accent pour la plus forte), caméra qui glisse entre la vue de côté et la vue de dessus. Sous la scène, le **spectre** en SVG : les composantes en fréquence (log) et leur enveloppe en cloche, la figure classique de Shepard.
- **URL** : `?sens=descend&mouvement=marches&vitesse=rapide&vue=dessus`.
- **Données** : aucune. Domaine : composantes d'un son de Shepard (fréquences, amplitudes en enveloppe cosinus sur 9 octaves), position sur l'hélice, compteur ; testé.

## Critères de fin

- Domaine testé ; l'enveloppe est nulle aux extrêmes, maximale au centre, invariante quand on monte d'une octave.
- Son sur geste seulement, volume bas, coupé à la sortie de page ; boucle sans clic audible.
- three.js fluide sur téléphone, clair et sombre, `prefers-reduced-motion` respecté (rien ne bouge tant que l'on ne joue pas).
- Image de partage et d'aperçu, `status: 'published'` (geste de l'auteur).

## Décisions

- Composantes : 9 octaves à partir de do1 (32,7 Hz), enveloppe en cosinus surélevé sur log₂(f), centrée sur do5. Sinusoïdes pures (le timbre n'a pas d'importance ici, c'est l'enveloppe qui fait l'illusion).
- Le synthé de Shepard a son propre petit moteur Web Audio (9 oscillateurs, gains lissés), distinct du synthé harmonique du socle.
- Le compteur de demi-tons est le vrai levier : il dit ce que l'oreille refuse de croire.

## Tâches

- [x] Cadrage, `npm run new:viz -- gamme-sans-fin`
- [x] Domaine : composantes, enveloppe, hélice, compteur ; tests
- [x] Synthé de Shepard (glissando, marches, sens, vitesse)
- [x] Scène three.js (hélice, sphères, noms, deux vues) et spectre SVG
- [x] Panneau, compteur, paradoxe du triton, état dans l'URL
- [x] Textes, image de partage, image d'aperçu
- [x] Vérification mobile/clair/sombre dans le navigateur de développement
- [ ] Relecture de l'auteur au casque (l'illusion, le paradoxe du triton), puis `status: 'published'` et fusion

## Prochaine action

Relecture de l'auteur : `git checkout feat/gamme-sans-fin`, `npm run dev`, page `/viz/gamme-sans-fin/`.
