# Chantier : Le voyage sur le tore

Slug : `voyage-sur-le-tore` · Branche : `feat/voyage-sur-le-tore` (construite sur `feat/fleuve-des-accords`)

## Intention

Le Tonnetz est le plan des accords : chaque triangle est un accord majeur ou mineur, deux triangles voisins partagent deux notes. Replié, ce plan est un tore. Une progression est un chemin sur ce tore : les enchaînements doux sont des pas courts (do majeur → la mineur, une seule note bouge), les surprises sont des sauts. On lance un standard et on regarde le chemin se tracer en 3D (three.js), en l'écoutant ; puis on compare la longueur moyenne des pas selon le style.

- Viral ★★ (l'image du chemin sur le tore est belle et rare ; « Giant Steps » en trajectoire est un classique attendu), faisable ★★ (géométrie à écrire, mais sans donnée nouvelle), adéquation ★★★ (three.js, pianiste).
- Troisième page du cycle « progressions », la page three.js.

## Cadrage (1er octobre 2026, décidé par Claude sur mandat de l'auteur)

**Phrase partageable** : *« "Autumn Leaves" fait le tour du tore en petits pas. "Giant Steps" le traverse en trois bonds. »*

**Écran principal** : le tore (three.js), les 24 triades comme facettes discrètes (majeur clair, mineur foncé dans la rampe), et **le chemin** (élément signature) : une ligne épaisse qui se trace accord après accord pendant l'écoute, tête à l'accent, traîne dans la rampe. Orbite à la souris, deux doigts sur téléphone, rotation auto lente.

- **Panneau** : choix du morceau (recherche du socle sur les 1 185 standards iRb et les 740 titres Billboard ; exemples : Autumn Leaves, Giant Steps, So What, Blue Bossa, un tube des années 80), *Jouer* (le chemin avance au tempo, un accord par temps compté), vitesse, le résultat (nombre de pas, longueur moyenne, le plus grand saut et entre quels accords), *Comparer les styles* (longueur moyenne des pas par style, petit graphique en barres), *Partager*.
- **Scène** : le tore et, sous lui, la grille du morceau à plat (les accords, la section, le curseur), pour lire ce qu'on entend.
- **Accords hors triades** (septièmes, diminués, suspendus) : ramenés à la triade la plus proche pour le tracé, marqués d'un anneau ; la page le dit.
- **URL** : `?morceau=irb:autumn-leaves`.
- **Données** : iRb et Billboard (grilles complètes avec durées), plus un agrégat par style de la distance moyenne entre accords successifs (distance sur le Tonnetz : nombre minimal de transformations P, L, R) calculé par le pipeline sur les trois corpus.

## Critères de fin

- Domaine testé : coordonnées des 24 triades sur le tore, distance néo-riemannienne entre deux triades (P, L, R), réduction d'un accord quelconque à sa triade.
- Fluide sur téléphone, clair et sombre, `prefers-reduced-motion` (le chemin se trace sans rotation automatique).
- Son sur geste (synthé du socle, accords tenus au tempo), image de partage (le tore avec le chemin), image d'aperçu.

## Décisions

- Tonnetz 12 notes tempéré (le tore, pas le plan infini) : un accord = une position, quelle que soit l'orthographe.
- Un pas = un changement d'accord ; les répétitions ne comptent pas.
- Distance = plus court chemin en transformations P, L, R (tableau précalculé 24 × 24, testé).

## Décisions de construction (nuit du 1er octobre 2026)

- **La phrase partageable a changé, parce que les données l'ont contredite.** Mesurée en transformations P, L, R, « Autumn Leaves » fait 29 pas de 2,8 en moyenne, « Giant Steps » 25 pas de 2,6 : le cycle de tierces majeures de Coltrane est *court* sur le Tonnetz (deux pas), alors qu'un ii → V (mineur vers majeur à la quarte, une note commune) en coûte trois. La page en fait sa surprise : « les bonds qu'on entend ne sont pas ceux qu'on mesure ». À valider par l'auteur : c'est un renversement du cadrage.
- **Tore** : domaine fondamental engendré par (4, 2) et (0, 3) dans le réseau (quintes, tierces majeures) : quatre colonnes autour du grand cercle, trois rangées autour du tube, le cycle des quintes en hélice. Chaque triade au centre de son triangle ; facettes courbes subdivisées ; étiquettes MAJUSCULES/minuscules.
- Distance d'un pas = plus court chemin PLR (table 24 × 24 par parcours en largeur) ; quinte = 2, ton = 4, relatif = 1.
- Accords hors triades : septièmes sur leur triade, diminués et demi-diminués sur le mineur, augmentés et suspendus sur le majeur, marqués d'un anneau ; silences et répétitions ne font pas de pas.
- Le morceau se choisit dans les 1 927 titres nommés (recherche du socle) ; sept préréglages. `songs.json` est propre à la page (même contenu que celui de progression-jouee, produit par le module commun `tools/lib/named-songs.ts`).
- Moyennes par style dans le panneau (barres) ; les tablatures font 2,4 par pas, les standards 2,7.
- Le lecteur d'accords (`Player`) et les symboles lisibles ont été montés dans le socle.

## Tâches

- [x] Domaine : positions sur le tore, distance PLR, réduction à la triade ; tests
- [x] Pipeline : distances moyennes par style, grilles exportées pour la recherche (titres iRb et Billboard)
- [x] Scène three.js (tore, facettes, chemin, tête, orbite), grille à plat, son, recherche
- [x] Textes, image de partage, image d'aperçu
- [x] Vérification dans le navigateur de l'éditeur (rendu WebGL, lecture, 375 px)
- [ ] Relecture de l'auteur sur téléphone (fluidité, sombre), publication

## Prochaine action

Relecture de l'auteur : `git checkout feat/voyage-sur-le-tore`, http://localhost:5173/viz/voyage-sur-le-tore/?morceau=irb:362 . Trancher le renversement de la phrase (Giant Steps à petits pas) ; vérifier la fluidité du tore sur téléphone.
