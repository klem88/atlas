# Idées et démarche

Ce document garde la trace des réflexions qui ont mené au projet, et de la réserve d'idées pour les prochaines visualisations. Il sert à repartir à froid.

## L'intention

- **Pas un business, des feux.** On lance des visualisations virales, vite, sans démarchage et sans « se vendre ». Si un feu ne prend pas, on passe au suivant. Le but est la visibilité, pour la suite.
- **Chaque feu laisse une trace.** Toutes les visualisations vivent sous un même toit (ce site, Atlas), avec une signature commune. Au troisième feu, les gens suivent l'auteur, pas seulement l'outil. Un point de ralliement durable (newsletter, compte) reste à décider.
- **Informatif, jamais catastrophiste.** On éclaire plutôt qu'on n'alarme. Les sujets « la France sous l'eau » ou « la fortune d'Arnault à l'échelle » ont été écartés : trop grand public, trop anxiogènes.
- **Transparence maximale.** Pour chaque visualisation : sources, méthode pas à pas, limites. C'est ce qui distingue du bruit ambiant.

## Le profil qui oriente les choix

- Développeur front-end, à l'aise avec **D3.js** et **three.js**. Aime la **cartographie** et la **simulation**.
- Musicien (**piano**), aime la **nature**, la **poterie et la céramique**.
- Goûts visuels : élégance, finesse, grande lisibilité, couleurs sobres. Un accent vif seulement pour désigner quelque chose de précis. Voir [DESIGN.md](DESIGN.md).
- Préfère éviter les sujets dont on ne maîtrise pas la science (climat notamment), sauf à être sûr de ce qu'on affirme.

## Ce qui rend une visualisation virale

1. **Le résultat parle de moi.** On entre une donnée personnelle (revenu, adresse, année de naissance) et la visualisation répond pour soi. C'est le levier principal, retenu pour toutes les idées.
2. **La révélation d'échelle** : le « quoi ?! » qui fait partager.
3. **Le jouet** : on manipule, on teste, on revient.
4. **Une phrase partageable** : un chiffre qui tient dans un message (« Ma maison est posée sur un récif vieux de 150 millions d'années »).
5. **Un format prêt à partager** : image au format 4:5 générée dans le navigateur, lien qui redonne exactement la même vue, aperçu soigné quand le lien est collé.

Références du genre : neal.fun, The Pudding, Nicky Case, Bartosz Ciechanowski. Elles occupent le terrain en anglais ; **en français, les données publiques sont riches et peu exploitées visuellement** (DVF, Météo-France, INSEE, IGN, BRGM…).

## Fil conducteur envisagé : « Ce qu'il y a là où tu vis »

Le prix, le sol, les oiseaux, le ciel… Chaque visualisation part de l'endroit où l'on vit. La série se reconnaît, et chaque épisode renvoie aux autres.

## Méthode « allumer des feux »

- 1 idée = quelques jours de construction au maximum, puis lancement.
- Lancer avec **sa propre démo** : une vidéo de 15 s de son résultat (TikTok, Reddit, X, LinkedIn).
- Mesurer **un seul chiffre** : combien de nouveaux visiteurs chaque visiteur amène.
- Au bout de 7 jours, on alimente le feu ou on passe au suivant.

## Réserve d'idées

Notées par impact viral, faisabilité et adéquation (★ à ★★★).

### ✅ Ce que ton salaire achète — publiée
Commune par commune, la surface achetable avec son revenu, de 2010 à 2025, avec la frise des taux d'emprunt. → [viz/salaire-logement](../viz/salaire-logement/)

Pistes d'amélioration :
- **Mobile : montrer la carte d'abord**, les réglages ensuite ou repliés. C'est la priorité pour le premier contact viral.
- **Salaire indexé** sur l'évolution des salaires (indice INSEE), en option, pour une comparaison dans le temps plus juste.
- **Poids** : environ 3,3 Mo de données au premier chargement ; charger les années à la demande.
- Loyers (même moteur, autre jeu de données) : « ce que ton salaire loue ».
- CI : monter les versions des actions GitHub (avertissement Node 20 déprécié).

### 🪨 Sous tes pieds — viral ★★★ · faisable ★★ · adéquation ★★★
On entre son adresse et on voit une coupe géologique en 3D (three.js) des couches sous sa maison, avec leur âge et leur origine.
- Phrase partageable : *« Ma maison est posée sur un récif tropical vieux de 150 millions d'années. »*
- Données : carte géologique du BRGM (BD Charm-50, ouverte, par département).
- Pont céramique : un mode « argiles », avec les gisements et les traditions potières (kaolin de Limoges, Puisaye, Vallauris). *« Quelle terre pourrais-tu tourner avec le sol de chez toi ? »*
- Difficulté : le traitement des données est costaud (notations et âges des couches à harmoniser).

### 🐦 Qui chante autour de chez toi — viral ★★ · faisable ★★★ · adéquation ★★★
On entre sa commune et on voit les espèces d'oiseaux observées autour, avec leurs vrais chants et leurs spectrogrammes (D3). Un « chorus de l'aube » superpose les chants comme une partition.
- Données : GBIF (observations géolocalisées), Xeno-canto (enregistrements sous Creative Commons, licence à vérifier par enregistrement).
- Contemplatif et beau ; parle à la fois aux amateurs de nature et aux musiciens.

### ✨ Le ciel que tu ne vois plus — viral ★★ · faisable ★★ · adéquation ★★
On entre son adresse et on voit, en 3D (three.js), le ciel étoilé sans pollution lumineuse puis le ciel réel ; un curseur fait disparaître les étoiles une à une. En bonus, le site de ciel noir le plus proche.
- Phrase : *« Depuis mon balcon, je vois 4 % des étoiles. »* Poétique plus qu'alarmiste.
- Données : atlas mondial de la pollution lumineuse (Falchi et al.), catalogues d'étoiles (Hipparcos / Yale Bright Star).

### 🎹 Pourquoi ton piano est (légèrement) faux — viral ★★ (international) · faisable ★★★ · adéquation ★★★
Une explication interactive du tempérament égal : les harmoniques, les intervalles purs contre tempérés, la « virgule pythagoricienne ». On joue des accords et on *voit* les battements des ondes (Web Audio + D3).
- Moins de donnée personnelle, mais typique des pages qui explosent sur Hacker News et Reddit, en anglais.

### 🗺️ La France en chansons — viral ★★ · faisable ★ · adéquation ★★
La carte de France des lieux cités dans les chansons françaises. On entre sa ville et on découvre ce qu'on a chanté sur elle, avec un lien d'écoute.
- Uniquement les titres et les mentions de lieux, **jamais les paroles** (droit d'auteur).
- Difficulté : constituer la base de données.

### 👥 Tous les humains ayant vécu — viral ★★ · faisable ★★★ · adéquation ★★
On entre son année de naissance et on voit sa place parmi environ 117 milliards d'êtres humains (estimation du Population Reference Bureau), en instanciation massive three.js.

### 🚗 Simulateur de bouchon fantôme — mis de côté
Une route circulaire où l'on freine une voiture pour voir le bouchon naître de rien. Écarté pour l'instant : la théorie est plus subtile qu'il n'y paraît, et l'apport pédagogique est incertain.

### Écartées
- **Climat** (« ta ville en 2050 a le climat de… », « ta commune depuis ta naissance ») : données complexes, risque d'affirmer des choses fausses.
- **Catastrophiste ou trop grand public** : « la France sous l'eau », « la fortune d'Arnault à l'échelle ».
- **Générateurs IA viraux** (explorés au tout début : tribunal des disputes, awards de groupe WhatsApp, « Wrapped » de ses conversations IA) : abandonnés au profit de la dataviz, plus distinctive et plus proche des compétences.

## Données publiques repérées

| Thème | Source | Accès |
|---|---|---|
| Prix immobiliers | Cerema, indicateurs DV3F (2010 → 2025, communes, EPCI) | Box public, xlsx |
| Ventes une à une | DVF+ open data (Cerema), DVF géolocalisé (Etalab, 5 ans glissants) | data.gouv.fr |
| Taux d'emprunt | BCE, série MIR France (sans clé) ; Banque de France Webstat (clé requise) | API SDMX |
| Contours administratifs | Etalab, 5 m à 1 000 m de généralisation | data.gouv.fr |
| Géologie | BRGM, BD Charm-50 | InfoTerre |
| Oiseaux | GBIF, Xeno-canto | API publiques |
| Pollution lumineuse | Falchi et al., VIIRS | fichiers raster |
