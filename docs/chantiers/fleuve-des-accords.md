# Chantier : Le fleuve des enchaînements

Slug : `fleuve-des-accords` · Branche : `feat/fleuve-des-accords` (construite sur `feat/progression-jouee`, dont elle réutilise le socle et les corpus)

## Intention

D'un accord au suivant, où va-t-on ? Un diagramme de flux : les degrés en colonnes, un courant d'un degré au suivant dont la largeur est la fréquence de la transition dans le style choisi. Le jazz descend le cercle des quintes (vi → ii → V → I), la pop tourne autour de quatre accords, le blues fait des allers-retours entre I, IV et V. On compare deux styles côte à côte, et on entend chaque courant.

- Viral ★★ (la comparaison jazz contre pop parle à tout le monde), faisable ★★★ (mêmes agrégats que la page précédente, à la transition près), adéquation ★★★.
- Deuxième page du cycle « progressions ».

## Cadrage (1er octobre 2026, décidé par Claude sur mandat de l'auteur)

**Phrase partageable** : *« Après un V, la pop retourne au I une fois sur deux. Le jazz, une fois sur trois : il préfère surprendre. »*

**Écran principal** : **le fleuve** (élément signature), en SVG : à gauche, les degrés de départ empilés (hauteur = fréquence), à droite les degrés d'arrivée, entre les deux des rubans dont l'épaisseur est le nombre de transitions ; les rubans sont dans la rampe ardoise, celui qu'on survole ou touche passe à l'accent. Deux fleuves côte à côte (ou l'un sous l'autre sur téléphone) quand on compare deux styles.

- **Panneau** : style A et style B (jazz iRb, pop, rock, metal, country, soul, electronic, punk… de Chordonomicon, tubes 1958–1991 de Billboard), le degré de départ à isoler (« après un V… »), le résultat (les trois arrivées les plus fréquentes avec leur part), *Écouter* (la transition la plus fréquente puis les suivantes, dans une tonalité choisie), *Partager*.
- **Scène** : le ou les fleuves, avec sous chacun la légende des degrés et l'effectif.
- **Préréglages de comparaison** : jazz contre pop, blues contre metal, années 60 contre années 2010.
- **URL** : `?a=jazz&b=pop&de=V`.
- **Données** : agrégats de transitions entre degrés (qualité réduite) par style et par décennie, issus du pipeline de `progression-jouee`, complétés d'un comptage par corpus. Pas de nouveau téléchargement.

## Critères de fin

- Les parts affichées se recalculent depuis l'agrégat (test) ; les rubans totalisent 100 % par colonne.
- Fleuve lisible à 375 px (une colonne de rubans, étiquettes directes, jamais un chiffre par ruban).
- Son sur geste, clair et sombre, image de partage (les deux fleuves) et d'aperçu.

## Décisions

- Les transitions sont comptées **à l'intérieur d'une section** (pas de l'outro d'un morceau à l'intro du suivant), sans les répétitions immédiates d'un même accord.
- Dix degrés de départ au plus par fleuve (les autres regroupés en « autres »), pour rester lisible.
- Les styles viennent du champ `main_genre` de Chordonomicon (douze catégories) ; le jazz de la page est iRb, plus riche et mieux annoté, et la page le dit.

## Tâches

- [ ] Pipeline : agrégat des transitions par style et décennie, `REPORT.md`
- [ ] Domaine : parts, tri, regroupement « autres », phrases de comparaison ; tests
- [ ] Fleuve SVG, survol et sélection, comparaison, son, URL
- [ ] Textes, image de partage, image d'aperçu
- [ ] Vérification mobile/clair/sombre, relecture de l'auteur, publication

## Prochaine action

Après la fusion de `progression-jouee` dans la chaîne : créer la branche et étendre le pipeline aux transitions.
