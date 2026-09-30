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

## Tâches

- [ ] Domaine : positions sur le tore, distance PLR, réduction à la triade ; tests
- [ ] Pipeline : distances moyennes par style, grilles exportées pour la recherche (titres iRb et Billboard)
- [ ] Scène three.js (tore, facettes, chemin, tête, orbite), grille à plat, son, recherche
- [ ] Textes, image de partage, image d'aperçu
- [ ] Vérification mobile/clair/sombre, relecture de l'auteur, publication

## Prochaine action

Après `fleuve-des-accords` : créer la branche, écrire le domaine du tore en TDD.
