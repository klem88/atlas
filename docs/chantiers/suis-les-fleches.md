# Chantier : Suis les flèches

Slug : `suis-les-fleches` · Branche : `feat/suis-les-fleches` (depuis `main`)

## Intention

Apprendre l'harmonie en la **voyant**, dans l'esprit des livres de Brian Calli (*Harmonie illustrée* : « jouer avec les diagrammes en suivant les flèches »). Les pages existantes partent des statistiques (éventail, fleuve, tore) ; celle-ci part d'une **carte fixe de la tonalité** : chaque accord a toujours la même place et la même couleur, des flèches disent qui tire vers qui, et les progressions courantes s'y **dessinent pendant qu'elles sonnent**. Demandée par l'auteur le 1er octobre 2026 (piste A de trois : A carte, B accords voisins, C colle entre accords).

- Viral ★★ (« la progression de toutes les chansons pop, dessinée »), faisable ★★★ (pas de données nouvelles), adéquation ★★★ (l'auteur veut apprendre l'harmonie visuellement).

## Cadrage

**Phrase partageable** : *« I–V–vi–IV : on part de la maison, on monte en tension, on se pose à côté, on prend son élan. »*

**Écran principal** : la carte des sept accords de la gamme majeure.
- **Disposition « cercle »** (par défaut, choix de l'auteur) : I au centre ; autour, trois secteurs de 120° : **tension** en haut (V, vii°), **repos** à droite (iii, vi), **départ** à gauche (ii, IV). L'ordre horaire V, vii°, iii, vi, ii, IV suit presque le cycle des quintes : la plupart des pas « naturels » sont entre voisins ou vers le centre.
- **Disposition « ligne de quintes »** : vii° – iii – vi – ii – V – I – IV de gauche à droite ; aller à droite, c'est rentrer à la maison.
- **Disposition « grille »** : placement à la main, façon schéma de livre (I au centre, IV à gauche, V à droite, vi sous I…).
- Un sélecteur à trois boutons passe de l'une à l'autre ; les accords glissent vers leur nouvelle place (animation), le chemin en cours suit.
- **Flèches de fond** (fines, discrètes) : les attractions classiques V→I, vii°→I, IV→V, ii→V, IV→I, vi→ii, iii→vi, vi→IV.
- **Bibliothèque** d'une douzaine de progressions diatoniques nommées, chacune avec une phrase. Choisir une progression la joue en boucle : une **comète** à l'accent saute d'accord en accord le long d'une flèche courbe, laissant une traînée ; l'accord qui sonne s'allume.
- **Légende du pas** sous la carte : « Sol → Do : quinte descendante, le retour à la maison. 1 note en commun (sol). »
- **Pas à pas** (◀ ▶) pour apprendre à son rythme ; toucher un accord le fait sonner seul.
- **Tonalité** au choix (douze majeures) ; noms réels, degré en petit.
- **Dans combien de chansons** : pour les progressions de 2 à 8 accords, le compte de « Ta progression a déjà été jouée » (même chargeur, part `p{n}`), avec un lien vers cette page.
- **URL** : `?p=pop&vue=cercle&t=C`.

## Critères de fin

- Calculs purs testés : positions des trois dispositions (sept accords distincts, dans le cadre), nature d'un mouvement (quinte, quarte, seconde, tierce), notes communes, bibliothèque lisible et diatonique.
- Carte lisible et touchable à 375 px (disques ≥ 44 px), clair et sombre, `prefers-reduced-motion` (pas de comète ni de glissement : le chemin apparaît d'un coup).
- Son seulement sur geste ; image d'aperçu.
- Une seule teinte vive : l'accent pour l'accord qui sonne et la comète ; les secteurs en rampe ardoise (repos clair, départ moyen, tension foncé).

## Décisions

- Seulement la gamme majeure et ses sept triades pour cette première page ; les accords empruntés et dominantes secondaires (piste B) viendront en anneau extérieur sur la même carte, la colle entre accords (piste C) en panneau dessous.
- Couleur des fonctions dans la rampe ardoise plutôt que trois teintes : la règle « un seul accent » de DESIGN.md tient, et le foncé dit « tension ».
- Les trois fonctions sont nommées en mots simples (repos, départ, tension) avec les termes savants en petit (tonique, sous-dominante, dominante).
- Le blues de 12 mesures garde ses répétitions (il se joue mesure par mesure) ; il n'a pas de compte de chansons (plus de huit accords).
- Les comptes viennent de la page sœur (dépendance de code assumée, comme compose-ta-progression).

## Tâches

- [ ] Domaine : dispositions, bibliothèque, mouvements et notes communes ; tests
- [ ] Interface : carte SVG, flèches de fond, comète, sélecteur de vue, bibliothèque, pas à pas, son, URL, compte des chansons
- [ ] Textes (comment lire, méthode, sources, limites), image d'aperçu
- [ ] Vérification dans le navigateur : clair, sombre, 375 px
- [ ] Relecture de l'auteur

## Prochaine action

Domaine : `domain/layout.ts`, `domain/library.ts`, `domain/moves.ts` et leurs tests.
