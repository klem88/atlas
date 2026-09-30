# Chantier : Pourquoi ton piano est (légèrement) faux

Slug : `piano-temperament` · Branche : `feat/piano-temperament`

## Intention

Une explication interactive du tempérament égal, pour tout le monde : les harmoniques, les intervalles purs contre tempérés, la « virgule pythagoricienne ». On joue des accords et on *voit* les battements des ondes. Idée d'origine dans [docs/IDEES.md](../IDEES.md) (🎹).

- Viral ★★ (international : ne rien fermer pour l'anglais), faisable ★★★, adéquation ★★★ (l'auteur est pianiste).
- Aucun pipeline de données : tout se calcule (fréquences, rapports, écarts en cents) et s'entend (Web Audio). C'est la visualisation la plus rapide de la réserve.
- Ton : émerveillement, pas de « ton piano est cassé ». Le compromis est une belle invention, pas un défaut.

## Cadrage (validé le 30 septembre 2026 : l'auteur a suivi les recommandations)

**Phrase partageable** : *« Sur ton piano, aucune quinte n'est juste, et c'est voulu. »*

**Écran principal** : un clavier jouable, avec sous lui les ondes des notes jouées. Pas de scrollytelling : un jouet d'abord, un court récit ensuite dans les notes.

- **Panneau** (à gauche sur ordinateur, sous le clavier sur téléphone) :
  - l'accordage : *Ton piano (égal)* · *Pur (intonation juste)* · *Pythagore (quintes pures)* ;
  - le résultat : l'intervalle joué (« Do – Sol, une quinte »), son écart en cents entre pur et choisi, le battement en « par seconde » ;
  - *Écouter* : le son ne part que sur un geste ; bouton « Comparer » qui joue l'accord dans l'accordage choisi puis en pur ;
  - des accords préréglés (quinte, tierce majeure, tierce mineure, accord parfait majeur, loup pythagoricien) ;
  - *Partager* (image 1080×1350, lien qui redonne la vue).
- **Scène** :
  - un clavier de 1 octave sur téléphone (do4 à do5), 2 sur ordinateur (do3 à do5), jouable à la souris, au doigt et au clavier ;
  - **l'élément signature : la vague des battements.** Pour les deux harmoniques qui devraient coïncider (par ex. la 3ᵉ du do et la 2ᵉ du sol), on trace leurs deux ondes et leur somme. Tempérées, elles glissent l'une contre l'autre et la somme ondule (l'enveloppe se gonfle et se creuse) ; pures, l'enveloppe est plate. La fenêtre de temps s'adapte pour montrer 2 à 3 battements ;
  - l'échelle des harmoniques : sur un axe des fréquences (log), les harmoniques de chaque note, avec les quasi-coïncidences soulignées ;
  - dans les notes : la spirale des quintes, douze quintes pures qui ratent l'octave de 23,46 cents (la virgule), et comment les répartir.
- **URL** : `?notes=60,67&accord=egal` redonne la vue.
- **Langue** : français seul ; les textes de l'interface (panneau, résultat, formats de notes) sont isolés dans `ui/strings.ts` pour préparer l'anglais. Les notes de la page restent dans `index.html`, comme les autres visualisations.

**Données** : aucune. La = 440 Hz, tempérament égal à 12 notes, intonation juste à 5 limites, échelle pythagoricienne. L'intonation juste est calculée par rapport à la note la plus grave de l'accord. Tout chiffre affiché est calculé dans `domain/` et testé.

**Son** : synthèse additive (6 harmoniques en 1/n, enveloppe douce), volume global bas. Les sinusoïdes pures ne battent pas sur une quinte : il faut les harmoniques pour entendre ce qu'on voit.

## Critères de fin

- Cadrage validé par l'auteur (phrase partageable, écran principal, parcours). ✔
- Calculs purs et testés dans `domain/` (fréquences, cents, battements), chaque chiffre affiché vérifié.
- Son via Web Audio, déclenché seulement par un geste (jamais au chargement), volume doux.
- Mobile d'abord (375 px), clair et sombre, `prefers-reduced-motion` respecté, clavier accessible.
- Image d'aperçu (`npm run og -- piano-temperament`), `status: 'published'`, fusion sur `main`.

## Décisions

- Pas de worktree : une seule session travaille (l'auteur, 30 septembre 2026).
- L'auteur relit tout le lendemain : la visualisation reste en **brouillon** sur sa branche, la publication est son geste.
- Intonation juste relative à la note la plus grave jouée (et non à un do fixe) : c'est ce qu'un oreille accorde en jouant l'accord.

## Tâches

- [x] Cadrage d'une page, validé par l'auteur
- [x] `npm run new:viz -- piano-temperament`
- [ ] Domaine : fréquences (égal, pur, pythagoricien), écarts en cents, fréquence des battements, virgule pythagoricienne ; tests
- [ ] Son : moteur Web Audio (notes, accords, comparaison pur/tempéré)
- [ ] Clavier jouable et vague des battements (canvas), échelle des harmoniques
- [ ] Panneau, résultat, préréglages, état dans l'URL
- [ ] Spirale des quintes
- [ ] Textes : comment lire, le calcul, sources, limites
- [ ] Image de partage, image d'aperçu
- [ ] Vérification mobile/clair/sombre, publication (geste de l'auteur)

## Prochaine action

Le domaine (`viz/piano-temperament/domain/`), en TDD.
