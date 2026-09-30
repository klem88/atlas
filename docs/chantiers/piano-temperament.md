# Chantier : Pourquoi ton piano est (légèrement) faux

Slug : `piano-temperament` · Branche : `feat/piano-temperament` (dans un worktree, voir « Sessions parallèles » dans [README.md](README.md))

## Intention

Une explication interactive du tempérament égal, pour tout le monde : les harmoniques, les intervalles purs contre tempérés, la « virgule pythagoricienne ». On joue des accords et on *voit* les battements des ondes. Idée d'origine dans [docs/IDEES.md](../IDEES.md) (🎹).

- Viral ★★ (international : prévoir l'anglais dès la conception, ou au moins ne rien fermer), faisable ★★★, adéquation ★★★ (l'auteur est pianiste).
- Aucun pipeline de données : tout se calcule (fréquences, rapports, écarts en cents) et s'entend (Web Audio). C'est la visualisation la plus rapide de la réserve.
- Ton : émerveillement, pas de « ton piano est cassé ». Le compromis est une belle invention, pas un défaut.

## Critères de fin

- Cadrage validé par l'auteur (phrase partageable, écran principal, parcours).
- Calculs purs et testés dans `domain/` (fréquences, cents, battements), chaque chiffre affiché vérifié.
- Son via Web Audio, déclenché seulement par un geste (jamais au chargement), volume doux.
- Mobile d'abord (375 px), clair et sombre, `prefers-reduced-motion` respecté, clavier accessible.
- Image d'aperçu (`npm run og -- piano-temperament`), `status: 'published'`, fusion sur `main`.

## À décider (par l'auteur, en début de session)

- La phrase partageable. Piste : *« Sur ton piano, aucune quinte n'est juste, et c'est voulu. »*
- L'écran principal : un clavier jouable avec les ondes superposées, ou un récit qui défile (scrollytelling) ?
- Français seul d'abord, ou français et anglais dès le départ ?

## Tâches

- [ ] Cadrage d'une page (superpowers:brainstorming), validé par l'auteur
- [ ] `npm run new:viz -- piano-temperament --title "Pourquoi ton piano est (légèrement) faux" --summary "…" --tags "Musique,Physique"`
- [ ] Domaine : fréquences (égal, pur, pythagoricien), écarts en cents, fréquence des battements, virgule pythagoricienne ; tests
- [ ] Son : moteur Web Audio (notes, accords, comparaison pur/tempéré)
- [ ] Visualisation des ondes et des battements (D3 ou canvas)
- [ ] Textes : comment lire, le calcul, limites
- [ ] Vérification mobile/clair/sombre, image d'aperçu, publication

## Prochaine action

Cadrer avec l'auteur (les trois questions de « À décider »), puis créer la visualisation avec `npm run new:viz`.
