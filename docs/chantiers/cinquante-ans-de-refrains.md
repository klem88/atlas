# Chantier : Cinquante ans de refrains, accord par accord

Slug : `cinquante-ans-de-refrains` · Branche : `feat/cinquante-ans-de-refrains` (construite sur `feat/carte-des-styles`)

## Intention

Année par année, ce que les chansons font de leurs accords : combien d'accords distincts par morceau, la part des accords mineurs, la part des morceaux qui tiennent en quatre accords, la fréquence de chaque degré, la place des septièmes et des emprunts. Des courbes lentes, avec de vrais morceaux comme repères. Le ton : curiosité, pas déclin. Une chanson à quatre accords est un choix, pas une paresse ; la page le dit et montre les contre-exemples.

- Viral ★★ (les courbes « la musique se simplifie » circulent déjà, souvent sans source ; ici avec méthode et limites), faisable ★★★ (agrégats par année), adéquation ★★ (attention éditoriale).
- Cinquième page du cycle « progressions ».

## Cadrage (1er octobre 2026, décidé par Claude sur mandat de l'auteur)

**Phrase partageable** : *« En 1975, un tube avait en moyenne 6 accords. En 2015, 4. Et pourtant. »* (le « et pourtant » renvoie aux contre-exemples récents et à la complexité qui s'est déplacée ailleurs : rythme, production, timbre).

**Écran principal** : **les rubans empilés** (élément signature) : pour chaque année, la part de chaque degré (I, IV, V, vi, ii, iii, autres) dans les accords des morceaux, en aires empilées, rampe ardoise ; et, au-dessus, la courbe du nombre moyen d'accords distincts par morceau (le graphique en ligne du socle), avec les repères d'années et quelques titres du Billboard placés à leur année.

- **Panneau** : la mesure (accords distincts, part des mineurs, part des « quatre accords », part des septièmes), le corpus (Billboard 1958–1991 seul, ou Chordonomicon 1950–2020), le style (tous, ou un `main_genre`), le résultat pour l'année survolée ou choisie, *Partager*.
- **Scène** : la ligne et les rubans, avec l'incertitude signalée par la texture des estimations du site quand une année a peu de morceaux (hachures), et un repère « ici, le corpus change » à 1991.
- **URL** : `?mesure=distincts&corpus=chordonomicon&style=pop`.
- **Données** : agrégats par année (et par style) calculés par le pipeline commun ; effectifs publiés ; années à moins de 200 morceaux hachurées.

## Critères de fin

- Chaque courbe recalculable depuis l'agrégat, effectifs affichés, changements de corpus signalés.
- Section « Ce que ça ne dit pas » écrite avant le graphique : biais des tablatures (Chordonomicon surreprésente la guitare et l'anglophone), biais du Billboard (les charts, pas la musique), tonalité estimée, absence de rythme et de timbre.
- Mobile, clair, sombre ; image de partage (la courbe choisie) et d'aperçu.

## Décisions

- Aucune projection au-delà des données, aucune moyenne mobile masquante (au plus 3 ans, et dite).
- Les titres repères viennent du Billboard (années 1958–1991) ; après 1991, pas de titre (Chordonomicon n'en a pas), et la page l'explique.
- Le mot « simplification » n'apparaît pas dans le titre ; le texte parle de « moins d'accords », pas de « moins de musique ».

## Décisions de construction (nuit du 1er octobre 2026)

- **Deux corpus dans le même graphique, jamais superposés** : un commutateur tablatures 1950–2024 / Billboard 1958–1991 ; le texte explique que la rupture de 1991 est un changement de population, pas de musique.
- **Cinq mesures** : accords distincts (classes degré × mode), part des mineurs, part des morceaux à quatre accords ou moins, part des septièmes (relue sur les symboles bruts, le cache n'ayant que les triades), part des emprunts (fondamentale hors gamme).
- **Aucun lissage**, même déclaré : les années à moins de 200 morceaux sont hachurées (sur la courbe et sur les rubans), et les années rondes gonflées par les tablatures datées à la décennie sont signalées.
- **Repères** : pour chaque année du Billboard, le titre le plus riche et le plus sobre en accords distincts (« la richesse existe à toutes les époques »).
- « Ce que ça ne dit pas » est la **première** section des notes, avant « Comment lire ».
- Le titre garde « Cinquante ans de refrains » ; « simplification » n'apparaît nulle part.

## Tâches

- [x] Pipeline : agrégats par année et par style, effectifs, `REPORT.md`
- [x] Domaine : mesures, hachures (< 200 morceaux) ; pas de lissage du tout ; tests
- [x] Interface : ligne (graphique du socle) + rubans SVG, repères Billboard, glissé, URL
- [x] Textes (limites d'abord), image de partage, image d'aperçu
- [x] Vérification dans le navigateur de l'éditeur (375 px)
- [ ] Relecture de l'auteur (ton éditorial surtout), publication

## Prochaine action

Relecture de l'auteur : `git checkout feat/cinquante-ans-de-refrains`, http://localhost:5173/viz/cinquante-ans-de-refrains/?annee=1975 . Le ton des textes est le point à surveiller.
