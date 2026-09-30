# Chantier : La carte des styles

Slug : `carte-des-styles` · Branche : `feat/carte-des-styles` (construite sur `feat/voyage-sur-le-tore`)

## Intention

Un point par morceau, placé selon sa manière d'enchaîner les accords ; les styles forment des continents, avec des isthmes (le rock et le country se touchent, le jazz est une île, le metal a sa propre côte). On clique un point pour voir la grille, l'entendre, et l'on cherche ses standards pour voir sur quel continent ils sont. L'esprit « atlas » appliqué à l'harmonie.

- Viral ★★ (une carte se partage, et « où est mon morceau ? » est un jeu), faisable ★★ (réduction de dimension à valider par une sonde), adéquation ★★★ (cartographie, D3, canvas).
- Quatrième page du cycle « progressions ». **Sonde de faisabilité obligatoire avant le cadrage définitif** (voir Décisions).

## Cadrage provisoire (1er octobre 2026)

**Phrase partageable** : *« Le jazz est une île. Le blues est la plage d'où tout le monde est parti. »*

**Écran principal** : **la carte** (élément signature), canvas (des dizaines de milliers de points), couleur = style (une teinte par continent : ici, exception assumée à la règle « une seule teinte », discutée dans DESIGN.md si retenue, sinon rampe ardoise par densité et styles en contours nommés), zoom à deux doigts ou Ctrl + molette comme les cartes du site.

- **Panneau** : recherche d'un standard (iRb, Billboard) qui le place sur la carte, style à mettre en avant, décennie (glissière qui allume les points de la décennie), le résultat pour un point (grille, style, année, voisins), *Écouter*, *Partager*.
- **Données** : pour chaque morceau, un vecteur de fréquences de transitions entre degrés (qualité réduite, 12 × 12 = 144 dimensions), puis une réduction en 2D **calculée dans le pipeline** (jamais dans le navigateur) : échantillon stratifié de 30 000 morceaux de Chordonomicon + tout iRb et Billboard. Sortie : positions (x, y, style, décennie, identifiant), quelques centaines de Ko en binaire.

## Sonde à faire avant de s'engager

1. Calculer les vecteurs de transitions sur iRb + Billboard + 30 000 Chordonomicon.
2. Réduire en 2D avec une méthode déterministe et sans dépendance lourde : PCA puis t-SNE ou UMAP en Node (`umap-js` existe ; vérifier sa licence et son coût), ou une réduction plus simple (PCA seule) si elle sépare déjà les styles.
3. Mesurer : les styles sont-ils séparés (silhouette par style > 0,2) ? Les standards de jazz tombent-ils ensemble ? Si non, **abandonner la carte** et remplacer par « la boussole des styles » : pour chaque style, ses cinq transitions signatures, en petits multiples (faisable à coup sûr avec les agrégats existants).

## Décisions

- Pas de carte tant que la sonde n'a pas montré des continents lisibles : une carte floue ne serait qu'un joli nuage.
- La réduction se fait une fois, dans le pipeline, avec graine fixée ; le rapport publie les paramètres.

## Tâches

- [ ] Sonde (script dans `pipeline/probe.ts`, résultats dans `REPORT.md`) et décision carte / boussole
- [ ] Pipeline : vecteurs, réduction, export binaire
- [ ] Domaine : recherche des voisins, agrégats par région ; tests
- [ ] Carte canvas (zoom, survol, sélection) ou boussole en petits multiples, son, URL
- [ ] Textes, image de partage, image d'aperçu
- [ ] Vérification mobile/clair/sombre, relecture de l'auteur, publication

## Prochaine action

Après `voyage-sur-le-tore` : la sonde, avant toute ligne d'interface.
