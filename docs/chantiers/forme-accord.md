# Chantier : La forme d’un accord

Slug : `forme-accord` · Branche : `feat/forme-accord` (construite sur `feat/piano-temperament`, dont elle réutilise le module musique du socle)

## Intention

Chaque accord dessine une courbe : on porte l'onde de la première note sur un axe, la deuxième sur un autre, la troisième sur le troisième (courbes de Lissajous, en 3D avec three.js). Un accord **pur** (rapports entiers, 4:5:6 pour l'accord majeur) donne une courbe fermée, simple, immobile : un nœud élégant. Le même accord **joué sur un piano** ne se referme jamais : la courbe tourne lentement sur elle-même, au rythme des battements de « Pourquoi ton piano est (légèrement) faux ». Plus l'intervalle est consonant, plus la forme est simple.

- Viral ★★ (les images d'accords en nœuds se partagent ; international), faisable ★★★ (aucune donnée), adéquation ★★★ (three.js, piano).
- Suite naturelle de « Pourquoi ton piano est (légèrement) faux » : mêmes notes, mêmes accordages, même clavier, autre regard.
- Ton : émerveillement géométrique. « Voici à quoi ressemble un accord majeur. »

## Cadrage (30 septembre 2026, décidé par Claude sur mandat de l'auteur)

**Phrase partageable** : *« Un accord majeur pur est un nœud. Sur un piano, il tourne sans fin. »*

**Écran principal** : la courbe 3D, grande, qui tourne doucement, avec sous elle le clavier commun (jusqu'à trois notes).

- **Panneau** : accordage (*Pur* / *Ton piano*), résultat (les rapports entiers « 4 : 5 : 6 », « la courbe se referme au bout de 4 tours du do » ou « ne se referme jamais : un tour complet sur elle-même toutes les 4 s à cette vitesse »), *Écouter*, *Temps* (*dessin* : la courbe se trace lentement, on voit le point avancer ; *normal* : le temps file, la forme précesse), accords préréglés, *Partager*.
- **Scène** : three.js, ligne épaisse (Line2) sur fond `--surface`, dégradé de la rampe ardoise du plus ancien (clair) au plus récent (foncé), point de tête à l'accent. Rotation automatique lente (désactivée avec `prefers-reduced-motion`), orbite à la souris ; sur téléphone, un doigt fait défiler la page, deux doigts tournent la courbe.
- **Deux notes** : courbe plane (z = 0), vue de face. **Trois notes** : courbe dans l'espace.
- **URL** : `?notes=60,64,67&accord=pur&temps=dessin`.
- **Données** : aucune. Domaine : rapports entiers d'un accord pur, points de la courbe, précession (cycles par période) ; tout est testé.

## Critères de fin

- Calculs purs testés (`domain/`), chaque chiffre affiché vérifié.
- Scène three.js fluide sur téléphone (375 px), clair et sombre, `prefers-reduced-motion` respecté, défilement de la page préservé.
- Son via Web Audio sur geste seulement.
- Image de partage (capture de la scène), image d'aperçu, `status: 'published'` (geste de l'auteur), fusion.

## Décisions

- three.js entre dans les dépendances (`three`, `@types/three`), importé par modules pour que seule cette page le charge.
- Trois notes au plus : au-delà, il n'y a plus d'axe.
- La vitesse « normal » avance de 30 périodes de la note grave par seconde : assez pour voir tourner une tierce (4 s par tour), une quinte tourne en 30 s.

## Tâches

- [x] Cadrage
- [x] `npm run new:viz -- forme-accord`, three.js installé
- [ ] Domaine : rapports entiers, points de la courbe, précession, fermeture ; tests
- [ ] Scène three.js (ligne, dégradé, tête, orbite, rotation auto, thème)
- [ ] Panneau, clavier, son, état dans l'URL
- [ ] Textes, image de partage, image d'aperçu
- [ ] Vérification mobile/clair/sombre, relecture de l'auteur, publication

## Prochaine action

Le domaine, en TDD.
