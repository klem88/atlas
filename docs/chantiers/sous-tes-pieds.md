# Chantier : « Sous tes pieds »

Branche : `feat/sous-tes-pieds` (à créer quand le cadrage sera validé)

État : **cadrage proposé, à valider par l'auteur**

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

## À décider

1. **Profondeur** : option A en V1 et B en bonus (proposé), ou A seule.
2. **Entrée** : adresse via l'API Adresse (appel externe, plus personnel) ou commune + toucher sur la carte (100 % statique). Je propose l'adresse : « sous ta maison » perd son sens à l'échelle d'une commune.
3. **Relecture scientifique** : as-tu un géologue dans ton entourage pour relire la table des milieux de dépôt ? Sinon, on reste sur des formulations prudentes.
4. **Département pilote** pour la sonde : je propose la Côte-d'Or (calcaires jurassiques, récifs fossiles, la phrase y marche) ou la Meuse.

## Critères de fin

- Pour n'importe quel point de métropole, on obtient la formation en surface, son âge et son milieu de dépôt (ou « inconnu », affiché honnêtement).
- Dix points tests (Paris, Côte-d'Or, Massif central, Alpes, Bretagne, littoral…) sont vérifiés à la main contre InfoTerre dans le `REPORT.md`.
- Le bloc 3D reste fluide sur mobile, avec une coupe 2D de repli.
- Clair, sombre et 375 px sont vérifiés. `npm test` et `npm run typecheck` sont au vert. L'image d'aperçu est faite.

## Tâches

- [ ] Validation du cadrage et des points « À décider »
- [ ] Sonde BD Charm-50 sur le département pilote : volume, champs disponibles (âge, lithologie, environnement), nombre de formations distinctes, qualité des notations
- [ ] Sonde BSS : pour 10 adresses, distance au forage le plus proche qui a une coupe géologique, et lisibilité de cette coupe (décide l'option B)
- [ ] Table étages → âges (ICS) et table lithologie → milieu de dépôt, dans `domain/`, testées
- [ ] Contrat de données + validation (`data/`)
- [ ] Pipeline : fichiers shape → tuiles raster + dictionnaire, puis `REPORT.md` ; d'abord un département, ensuite la France
- [ ] Visualisation mobile d'abord : réponse, frise des temps, coupe 2D
- [ ] Bloc 3D three.js (relief + géologie)
- [ ] Image de partage 4:5, image d'aperçu, publication

## Prochaine action

Faire valider le cadrage par l'auteur (section « À décider »), puis lancer la sonde BD Charm-50 sur le département pilote.
