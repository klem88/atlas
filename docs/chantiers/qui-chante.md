# Chantier : « Qui chante autour de chez toi »

Branche : `feat/qui-chante`

État : **cadrage validé (2026-09-30), sondes faites, prêt pour le pipeline**

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
| Chants | Xeno-canto, via son jeu de données GBIF (l'API v3 exige une clé, on s'en passe) | API GBIF, sans clé | Par enregistrement : variantes CC BY-NC-SA, CC BY-NC-ND, etc. |
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

## Décisions (validées le 2026-09-30)

0. **Grille en degrés** (0,13° × 0,09°, soit environ 10 km) plutôt qu'en Lambert-93 : aucune projection à calculer, ni dans le pipeline ni dans le navigateur. Les mailles vont de 9 km de large au nord à 11 km au sud, ce qui est sans conséquence pour « autour de chez toi ».

1. **Licences** : CC0, CC BY et CC BY-NC acceptées, avec citation. **Enregistrements « ND » exclus** (couper un extrait et en tirer un spectrogramme, c'est modifier). Partage à l'identique (SA) conservé sur les extraits publiés.
2. **Entrée par commune** (socle réutilisé, 100 % statique).
3. **Année entière** en V1, avec une mention du printemps. Le curseur de mois viendra si la page prend.
4. **200 espèces** avec chant (les plus observées en France).
5. **Pas de clé Xeno-canto nécessaire** : Xeno-canto publie ses enregistrements dans GBIF (jeu `b1047888-ae52-4179-9dd5-5448ea342a24`), avec l'URL du MP3, l'auteur, la licence et la note de chaque enregistrement. Le pipeline passe par là. La clé ne servira que si un champ manque (type « song », par exemple).

## Décisions techniques (2026-09-30)

- **Extraits réencodés** (`@breezystack/lamejs`, LGPL, pipeline seulement) plutôt que découpés : 120 Ko au lieu de 300 à 600 Ko, et volume égalisé, indispensable pour le chœur. Décodage avec `mpg123-decoder` (WebAssembly), trame par trame.
- **Spectrogrammes en binaire brut** (48 bandes de 250 Hz à 11 kHz × 187 colonnes de 80 ms ≈ 9 Ko), un fichier par chant chargé à la demande, dessiné par la page aux couleurs du thème. Le bruit de fond stationnaire est retiré (médiane par bande).
- **Styles de la recherche déplacés dans le socle** (`src/shell/components.css`) : le composant sert maintenant à deux visualisations.
- **Pays en code ISO** : la page l'affiche en français avec `Intl.DisplayNames`.

## Résultats des sondes (2026-09-30)

**GBIF, observations** (Aves, France, 2015 → 2026) : 59 millions d'observations en France, donc hors de question de tout télécharger. Les facettes par maille répondent en 0,1 à 0,6 s.

| Lieu | Maille 10 km | Carré 30 km (3 × 3 mailles) |
| --- | --- | --- |
| Paris | 236 espèces (170 avec ≥ 5 obs.) | 298 (238) |
| Morvan | 103 espèces (50), **844 obs. seulement** | 178 (133) |
| Baie de Somme | 273 espèces (211) | n. d. (erreur passagère de l'API) |

- Le biais d'observation se confirme : une maille rurale seule est pauvre. **Le rayon de 3 × 3 mailles est indispensable**, et un seuil de 5 observations écarte les oiseaux de passage égarés.
- Licences dans ces zones : 90 à 94 % CC BY, 6 à 17 % CC BY-NC, le reste CC0. Tout est acceptable.
- Principaux jeux : Oiseaux des Jardins, eBird, STOC-EPS, Faune-Occitanie, LPO Franche-Comté, baguage CRBPO (tous CC BY 4.0).
- L'API échoue parfois sans raison : le pipeline doit **réessayer** et **mettre en cache** chaque réponse. Durée estimée : environ 5 800 mailles × 0,4 s ≈ 40 min au premier passage.

**Xeno-canto (via GBIF)**, pour les 200 espèces les plus observées en France, avec 100 enregistrements européens par espèce :
- **198 espèces sur 200** ont au moins un enregistrement utilisable (sans ND, note ≥ 4).
- Licences : 88 % CC BY-NC-SA, 10 % ND (exclus), le reste plus ouvert.
- Les 2 « manques » (fauvette mélanocéphale, fauvette passerinette) viennent de la nomenclature : *Sylvia* dans les observations, *Curruca* chez Xeno-canto. Le pipeline doit faire correspondre les espèces par nom accepté et par synonymes, pas seulement par identifiant.
- À vérifier : l'échelle des notes (5 = A ?) et l'endroit où trouver le type « song » ou « call » (le nom de fichier le contient parfois, par exemple « zang »).

## Critères de fin

- Pour n'importe quelle commune de métropole, la liste s'affiche en moins de 2 s sur mobile 4G.
- Paris, une commune rurale et une commune du littoral donnent des nombres d'espèces plausibles, vérifiés à la main dans le `REPORT.md`.
- Chaque chant publié affiche son auteur, sa licence et son lien Xeno-canto. Aucun enregistrement « ND ».
- Le chœur de l'aube fonctionne sur iOS Safari (qui exige un toucher avant de jouer du son).
- Clair, sombre, 375 px vérifiés. `npm test` et `npm run typecheck` au vert. Image d'aperçu faite.

## Tâches

- [x] Validation du cadrage (2026-09-30)
- [x] Sonde de faisabilité GBIF : 3 lieux tests, nombre d'espèces et temps de requête
- [x] Sonde Xeno-canto : 198 espèces sur 200 couvertes, sans clé, via GBIF
- [x] Contrat de données + validation (`data/`), grille de mailles et agrégation (`domain/`), testés
- [ ] Pipeline observations → `public/data/qui-chante/` + `REPORT.md` (code écrit et testé ; premier passage en cours, ≈ 1 h 30 à cause du débit limité de GBIF)
- [x] Pipeline chants : choix de l'enregistrement, 15 s les plus chantantes, volume égalisé, MP3 mono 64 kbit/s (≈ 120 Ko), spectrogramme sans bruit de fond. Essayé sur 5 espèces.
- [x] `domain/` : rattachement commune → mailles, agrégation, présence à seuils fixes, plan du chœur, tests
- [x] Visualisation : recherche, chiffre, liste avec spectrogrammes et lecture, textes de méthode, sources et limites. Vérifiée sur données d'aperçu (Arles) en clair, en sombre et à 375 px.
- [x] Chœur de l'aube (Web Audio : 6 voix décalées de 2,5 s, curseur et voix actives à l'accent)
- [ ] Vérification sur les données complètes, et sur un vrai téléphone (iOS Safari : son au premier toucher)
- [ ] Image de partage 4:5, image d'aperçu, publication

## Prochaine action

Quand le premier passage du pipeline est fini : relire `pipeline/REPORT.md` (communes témoins plausibles ?), vérifier la page sur les données complètes (Paris, Saulieu, Brest, Chamonix), puis committer les données. Ensuite : image de partage 4:5, image d'aperçu, publication.
