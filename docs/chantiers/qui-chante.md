# Chantier : « Qui chante autour de chez toi »

Branche : `feat/qui-chante` (à créer quand le cadrage sera validé)

État : **cadrage proposé, à valider par l'auteur**

## Cadrage

**Phrase partageable.** *« Autour de chez moi, 74 espèces d'oiseaux ont été entendues ou vues. Écoute le chœur de l'aube. »*

**Ce que la page fait.** Tu choisis ta commune. La page répond avec les oiseaux observés autour de toi, classés du plus courant au plus rare. Chaque espèce a sa ligne : nom, silhouette de son chant en spectrogramme, lecture en un toucher. Le bouton « Chœur de l'aube » joue les chants superposés, décalés dans le temps, et les spectrogrammes défilent comme une partition.

**Écran principal (mobile d'abord).**
1. Recherche de commune (composant du socle, déjà utilisé par salaire-logement).
2. Le chiffre : « 74 espèces » + une phrase (« dont 12 que l'on n'entend qu'au printemps »).
3. La partition : une ligne par espèce, spectrogramme en largeur, trié par fréquence d'observation. L'accent désigne l'espèce en train de chanter.
4. Le chœur de l'aube, puis l'image de partage 4:5.
5. En bas : méthode, sources, crédits de chaque enregistrement, limites.

**Leviers viraux.** Le résultat parle de moi (ma commune), le jouet (écouter, superposer), la surprise (« il y a des loriots chez moi ? »). Le pont avec la musique donne l'angle partition, qui distingue ce projet des applis naturalistes.

## Données

| Besoin | Source | Accès | Licence |
| --- | --- | --- | --- |
| Observations d'oiseaux | GBIF, classe Aves, France, 2015 → aujourd'hui | API `occurrence/search` avec facettes (pas de clé) ou téléchargement complet (compte GBIF) | Par jeu de données : CC0, CC BY ou CC BY-NC |
| Chants | Xeno-canto, API v3 | **Clé obligatoire** (compte vérifié), à garder dans un `.env` local jamais versionné | Par enregistrement : variantes CC BY-NC-SA, CC BY-NC-ND, etc. |
| Noms français | Taxref (INPN) ou noms vernaculaires GBIF | Fichier ouvert | Licence Ouverte |
| Communes | Contours Etalab, déjà traités pour salaire-logement | Réutilisation | Licence Ouverte |

**Précalcul proposé (données 100 % statiques).**
- Grille de mailles de 10 km (Lambert-93, environ 5 800 mailles en métropole). Pour chaque maille : liste des espèces avec leur nombre d'observations, et le mois de pointe de chacune. On évite ainsi un téléchargement de plusieurs Go : le pipeline interroge l'API GBIF maille par maille avec `facet=speciesKey` (5 800 requêtes mises en cache, relançables).
- Une commune se rattache à la maille qui contient son centre et aux 8 mailles voisines (rayon d'environ 15 km, « autour de chez toi »). Ce calcul pur va dans `domain/` et il est testé.
- Chants : un enregistrement par espèce pour les 150 à 200 espèces les plus courantes. Qualité A, type « song », pris de préférence en France ou en Europe de l'Ouest. On en tire un extrait de 15 à 20 s en Opus ou MP3, soit environ 200 × 200 Ko ≈ 40 Mo au total, chargés à la demande. Les spectrogrammes sont précalculés en petites images, légères et identiques partout.
- Volume au premier chargement visé : moins de 1 Mo (grille + index des espèces). Les chants se chargent au toucher.

## Limites à afficher (transparence)

- « Observé » ne veut pas dire « niche ici ». Les données viennent de gens qui observent, et elles sont biaisées vers les villes, les sentiers et les zones humides connues. Une commune rurale peu parcourue paraîtra plus pauvre qu'elle ne l'est.
- Espèces sensibles : GBIF floute déjà certaines localisations. La maille de 10 km évite de désigner un nid. Les espèces protégées sensibles peuvent être exclues ou regroupées.
- Un chant enregistré ailleurs illustre l'espèce, pas l'oiseau de ta rue (les dialectes régionaux existent).

## À décider

1. **Licences acceptées.** Le site est non commercial. CC BY-NC est donc acceptable pour les observations comme pour les chants, à condition de citer. Je propose d'**exclure les enregistrements « ND »** (pas de modification) : couper un extrait et en tirer un spectrogramme, c'est déjà modifier. Et on garde le partage à l'identique (SA) sur les extraits publiés.
2. **Entrée.** Par commune (réutilise le socle, 100 % statique) ou par adresse (API Adresse, un appel externe). Je propose la commune.
3. **Saison.** Un curseur de mois (« en mai », « en décembre ») ou seulement l'année entière. Je propose l'année entière avec une mention du printemps en V1. Le curseur viendra si la page prend.
4. **Nombre d'espèces avec chant.** 150, 200, ou toutes celles qui ont un enregistrement utilisable.
5. **Clé Xeno-canto.** Tu crées le compte : la clé est personnelle et je ne peux pas créer de compte à ta place.

## Critères de fin

- Pour n'importe quelle commune de métropole, la liste s'affiche en moins de 2 s sur mobile 4G.
- Paris, une commune rurale et une commune du littoral donnent des nombres d'espèces plausibles, vérifiés à la main dans le `REPORT.md`.
- Chaque chant publié affiche son auteur, sa licence et son lien Xeno-canto. Aucun enregistrement « ND ».
- Le chœur de l'aube fonctionne sur iOS Safari (qui exige un toucher avant de jouer du son).
- Clair, sombre, 375 px vérifiés. `npm test` et `npm run typecheck` au vert. Image d'aperçu faite.

## Tâches

- [ ] Validation du cadrage et des points « À décider »
- [ ] Sonde de faisabilité GBIF : 3 mailles tests (Paris, Morvan, baie de Somme), nombre d'espèces et temps de requête. On en déduit la durée totale du pipeline.
- [ ] Sonde Xeno-canto : pour les 200 espèces les plus courantes, part d'enregistrements utilisables (qualité A, pas de ND)
- [ ] Contrat de données + validation (`data/`)
- [ ] Pipeline observations → `public/data/qui-chante/` + `REPORT.md`
- [ ] Pipeline chants : extraits, spectrogrammes, crédits
- [ ] `domain/` : rattachement commune → mailles, agrégation, tri, tests
- [ ] Visualisation mobile d'abord : recherche, chiffre, partition, lecture
- [ ] Chœur de l'aube (Web Audio : superposition et décalages)
- [ ] Image de partage 4:5, image d'aperçu, publication

## Prochaine action

Faire valider le cadrage par l'auteur (section « À décider »), puis lancer les deux sondes de faisabilité (GBIF et Xeno-canto) avant d'écrire le moindre pipeline.
