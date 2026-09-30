# Chantier : « Sous tes pieds »

Branche : `feat/sous-tes-pieds` (à créer quand le cadrage sera validé)

État : **cadrage validé (2026-09-30), sondes faites, prêt pour le pipeline**

## Cadrage

**Phrase partageable.** *« Ma maison est posée sur une mer tropicale vieille de 150 millions d'années. »*

**Ce que la page fait.** Tu donnes ton adresse, ou tu touches la carte. La page te dit sur quelle roche tu vis, quel âge elle a et comment elle s'est formée (mer chaude, récif, delta, glacier, volcan…). Un bloc 3D (three.js) montre le terrain autour de toi, découpé comme une part de gâteau, avec les couches colorées selon leur âge. Une frise des temps géologiques situe ta roche : « quand elle se déposait, les dinosaures… ».

**Écran principal (mobile d'abord).**
1. Adresse ou commune.
2. La réponse en une phrase : roche, âge, milieu de formation.
3. Le bloc 3D qu'on peut faire pivoter, ou une coupe en 2D si l'appareil est trop faible.
4. La frise des temps, avec l'accent sur ta couche.
5. Image de partage 4:5, puis méthode, sources et limites.

## Le point dur : la profondeur

La BD Charm-50 est une carte **de surface** : elle dit quelle couche affleure, pas l'épaisseur des couches ni ce qu'il y a dessous. Une « coupe sous ta maison » ne peut donc pas sortir de cette seule source. Trois options :

| Option | Ce qu'on montre | Fiabilité | Effort |
| --- | --- | --- | --- |
| **A. Surface en 3D** | Carte géologique drapée sur le relief (IGN) dans un bloc de 2 à 5 km autour de toi. Les flancs du bloc prolongent les couches en surface sans prétendre connaître la profondeur | Juste | Moyen |
| **B. Forage le plus proche** | La Banque du sous-sol (BSS, BRGM) recense plus de 700 000 ouvrages, dont beaucoup ont une coupe géologique : « le forage à 800 m de chez toi a traversé 12 m d'argile puis 40 m de calcaire » | Réelle mais inégale : forages parfois éloignés, descriptions en texte libre, hétérogènes | Élevé |
| **C. Colonne régionale déduite** | Empiler les couches plus anciennes de la région selon la stratigraphie | Risque d'affirmer du faux | Élevé, et il faut un géologue |

**Proposition : A en V1, B en bonus** si la sonde montre qu'assez de forages ont une coupe exploitable. On écarte C, selon le principe « ne pas affirmer ce qu'on ne maîtrise pas ».

## Données

| Besoin | Source | Accès | Licence |
| --- | --- | --- | --- |
| Formations en surface | BRGM, BD Charm-50 harmonisée (1/50 000), par département | data.gouv.fr / InfoTerre, fichiers shape | Licence Ouverte |
| Vue d'ensemble légère | BRGM, carte géologique au 1/1 000 000 | InfoTerre | Licence Ouverte |
| Forages (option B) | BRGM, BSS | data.gouv.fr / InfoTerre, WFS | Licence Ouverte |
| Relief | IGN, RGE ALTI ou BD ALTI (25 m) | Géoplateforme | Licence Ouverte |
| Âges | Charte chronostratigraphique internationale (ICS) | Table écrite à la main dans `domain/`, étage → âge en millions d'années | Référence citée |
| Adresse → point | API Adresse (BAN) | Appel depuis le navigateur, sans clé | Licence Ouverte |

**Précalcul proposé.**
- Les formations tirées des fichiers shape sont converties en **raster d'identifiants** (une couleur = un numéro de formation), à environ 50 à 100 m de résolution et en tuiles PNG par zone. Ces tuiles sont compactes, se lisent au pixel dans un Canvas et chargent vite. Le polygone exact ne sert qu'au contrôle dans le pipeline.
- Un dictionnaire des formations : notation, libellé, lithologie, âge de début et de fin (en Ma), milieu de dépôt. C'est là que se trouve la « phrase » : ce dictionnaire demande le plus de soin.
- Bloc 3D : tuile de relief et tuile géologique chargées à la demande pour le point choisi.

## Risques et limites

- **Harmonisation des notations** (déjà signalée dans IDEES.md) : les notations varient d'une feuille à l'autre. La version « harmonisée » en règle une partie. La sonde dira combien de formations distinctes il reste et si les champs d'âge et d'environnement sont remplis.
- **Le milieu de dépôt** (« récif », « mer chaude ») fait toute la viralité, et c'est aussi le plus facile à dire de travers. Il faut une table lithologie → milieu, prudente (« mer peu profonde » plutôt que « récif » quand on ne sait pas), idéalement relue par un géologue.
- **Formations superficielles** : en ville et dans les vallées, la couche en surface est souvent un remblai, des alluvions ou du limon récent (« 10 000 ans », moins spectaculaire). On peut afficher aussi le « socle » sous ces formations quand la carte le permet.
- **Volume** : la France entière pèse plusieurs Go en fichiers shape. On le mesure sur un département avant d'extrapoler.
- **Mobile** : un bloc 3D three.js doit rester fluide sur un téléphone moyen. Une coupe 2D sert de solution de repli.

## Hors périmètre V1

- Le **mode argiles** (gisements, traditions potières, « quelle terre pourrais-tu tourner ? »). C'est un bel épisode 2, qui s'appuiera sur le dictionnaire des formations.

## Décisions (validées le 2026-09-30)

1. **Profondeur** : option A (surface en 3D) en V1, option B (forage le plus proche) en bonus.
2. **Entrée par adresse** (API Adresse), avec en plus un toucher sur la carte.
3. **Formulations prudentes par défaut** pour les milieux de dépôt. Une relecture par un géologue reste souhaitable si l'auteur en trouve un.
4. **Département pilote : Côte-d'Or (21).**

## Résultats des sondes (2026-09-30)

**BD Charm-50, Côte-d'Or.**
- Source : miroir `http://data.cquest.org/brgm/bd_charm_50/2019/GEO050K_HARM_nnn.zip` (millésime 2019-2021, Licence Ouverte 2.0), ce qui évite le formulaire d'InfoTerre. France entière : **2,8 Go zippés** (95 fichiers). Côte-d'Or : 31 Mo zippés, 71 Mo décompressés.
- Couche utile : `S_FGEOL` (polygones), en Lambert-93. **13 960 polygones, 62 formations distinctes.** L'aire totale calculée, 8 788 km², correspond à la surface du département : la géométrie est saine.
- **Champs : `NOTATION`, `DESCR` (texte libre), couleurs CMJN officielles (`C_FOND`…`N_FOND`), surcharges.** Aucun champ d'âge, de lithologie ni de milieu de dépôt. Il faudra donc :
  - **l'âge**, à partir de la notation normalisée BRGM (`j` Jurassique moyen-sup., `l` Lias, `t` Trias, `n`/`c` Crétacé inf./sup., `e` Éocène, `g` Oligocène, `h` Carbonifère, `F` alluvions…) et, plus précisément, de l'étage souvent écrit dans la description (« Bajocien sup. », « Oxfordien moyen »), traduit en Ma avec la charte ICS ;
  - **le milieu**, à partir de mots-clés dans la description : « polypiers », « subrécifales » → récif ; « oolithique », « entroques », « Gryphées », « Ostrea » → mer chaude peu profonde ; « lacustres » → lac ; granites, rhyolites → magma…
- La phrase marche : j4a « Dalle nacrée… à polypiers (Callovien inférieur) » et j5a « calcarénites subrécifales (Oxfordien sup.) » sont bien présentes.
- Les notations des roches magmatiques utilisent une police de symboles grecs, mal décodée (`ã` pour γ, granite…). Il faut une table de correspondance.
- **Formations superficielles : 31 % de la surface** (alluvions récentes Fz 9 %, colluvions, limons, éboulis…). Dans ces cas, la réponse doit aussi donner la roche en dessous, ce qui plaide pour l'option B.
- Formations les plus étendues : Fz 9,3 %, j3a (Comblanchien, Bathonien) 8,3 %, j3O (Oolithe blanche) 7,6 %, j1-2 (calcaires à entroques) 5,7 %.

**BSS (forages)**, via le WFS `geoservices.brgm.fr/geologie`, couche `ms:BSS_TOTAL_AVEC_LABEL` : chaque ouvrage a les indicateurs `coupe_geologique` (Présente/Absente) et `prof_max_coupe`.

| Lieu | Forage avec coupe le plus proche | Le plus proche descendant à ≥ 30 m |
| --- | --- | --- |
| Paris | 1,5 km | 1,8 km (41 m) |
| Dijon | 400 m | 420 m (110 m) |
| Beaune | 260 m | 430 m (100 m) |
| Saulieu (Morvan) | 230 m | 3,0 km (50 m) |
| Clermont-Ferrand | 140 m | 530 m (36 m) |
| Grenoble | 380 m | 440 m (34 m) |
| Rennes | 20 m | 20 m (31 m) |
| Plonévez-Porzay | 610 m | 610 m (70 m) |
| Mende | 1,2 km | 1,3 km (100 m) |
| Arcachon | 70 m | 220 m (156 m) |

- Le WFS plafonne à 1 000 résultats par requête (Paris, Clermont et Rennes sont tronqués, donc les vraies distances sont encore plus courtes).
- **Le contenu de la coupe est du texte structuré** sur la fiche InfoTerre (`ficheBss.action?id=BSS…`, en HTTP) : « Log géologique numérisé », avec pour chaque niveau la profondeur, la lithologie et parfois la stratigraphie. Par exemple, à Chenôve : remblai 0-4 m, graviers argileux (Quaternaire) 4-7 m… Ce texte est **hétérogène** (majuscules, abréviations comme « PLIOQUAT », stratigraphie souvent vide).
- **Conclusion** : l'option B est faisable, mais seulement en précalcul. Les fiches sont en HTTP, sans CORS, et on ne peut pas les appeler depuis le navigateur. Il faut trouver un export en masse des logs, sinon récupérer les fiches poliment en ne gardant qu'un forage par kilomètre carré. C'est à trancher au moment du bonus.

## Critères de fin

- Pour n'importe quel point de métropole, on obtient la formation en surface, son âge et son milieu de dépôt (ou « inconnu », affiché honnêtement).
- Dix points tests (Paris, Côte-d'Or, Massif central, Alpes, Bretagne, littoral…) sont vérifiés à la main contre InfoTerre dans le `REPORT.md`.
- Le bloc 3D reste fluide sur mobile, avec une coupe 2D de repli.
- Clair, sombre et 375 px sont vérifiés. `npm test` et `npm run typecheck` sont au vert. L'image d'aperçu est faite.

## Tâches

- [x] Validation du cadrage (2026-09-30)
- [x] Sonde BD Charm-50 sur la Côte-d'Or : 62 formations, pas de champ d'âge ni de milieu (à déduire de la notation et de la description), 31 % de formations superficielles
- [x] Sonde BSS : forage avec coupe à moins de 2 km dans 9 lieux sur 10 ; logs en texte structuré mais hétérogène, récupérables seulement en précalcul
- [ ] Recenser toutes les notations et descriptions de France (95 départements), pour dimensionner les tables d'âge et de milieu
- [ ] Table étages → âges (ICS) et table lithologie → milieu de dépôt, dans `domain/`, testées
- [ ] Contrat de données + validation (`data/`)
- [ ] Pipeline : fichiers shape → tuiles raster + dictionnaire, puis `REPORT.md` ; d'abord un département, ensuite la France
- [ ] Visualisation mobile d'abord : réponse, frise des temps, coupe 2D
- [ ] Bloc 3D three.js (relief + géologie)
- [ ] Image de partage 4:5, image d'aperçu, publication

## Prochaine action

Recenser les notations et descriptions de toute la France : télécharger uniquement les `.dbf` de la couche `S_FGEOL` (ou les 2,8 Go une fois, en cache), compter les formations distinctes et mesurer quelle part on peut dater automatiquement par la notation ou l'étage. Ce chiffre dit si les tables d'âge et de milieu tiennent en quelques centaines de lignes ou en plusieurs milliers.
