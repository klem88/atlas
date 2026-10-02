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

- [x] Domaine : dispositions, bibliothèque, mouvements et notes communes ; tests
- [x] Interface : carte SVG, flèches de fond, comète, sélecteur de vue, bibliothèque, pas à pas, son, URL, compte des chansons
- [x] Textes (comment lire, méthode, sources, limites), image d'aperçu
- [x] Vérification dans le navigateur : clair, sombre, 375 px
- [ ] Relecture de l'auteur

## Décisions de construction (1er octobre 2026)

- La flèche d'un pas s'incurve toujours à gauche du sens de marche : un aller et un retour ne se superposent pas. Dans la ligne de quintes, les pas vers la maison passent donc au-dessus, les retours en dessous, avec une hauteur minimale pour sauter par-dessus les disques voisins.
- Pendant l'écoute, chaque tour efface le chemin, mais le pas qui referme la boucle (IV → I dans l'axe de la pop) reste dessiné.
- Toucher un accord de la carte sort de la progression : on l'entend, et le pas depuis l'accord précédent se dessine et se raconte (exploration libre).
- Sur mobile, la carte passe avant la bibliothèque.
- En sombre, la rampe s'inverse (la tension devient la plus claire) : le texte dit « plus la tension monte, plus le disque tranche sur le fond ».
- (Remplacée le 2 octobre par la bande des quintes.) En ligne de quintes à 375 px, les disques faisaient environ 38 px.

## Piste B : voisins et modulation (2 octobre 2026)

Demande de l'auteur : « naviguer parmi tous les accords », montrer les accords voisins qui permettent de moduler, et faire paraître la nouvelle tonalité si l'on prend ce chemin. Proposition validée (« vas-y avec tes recos ») : éclosion au toucher, ordre B1 → B2 → B3.

- [x] **B1, voisins** : les accords deviennent réels (fondamentale + couleur, `domain/harmony.ts`) ; rôle d'un accord dans une tonalité : gamme, dominante secondaire (V/x), emprunt au mineur (même degré dans la gamme mineure de même tonique), ailleurs. Toucher un accord de la gamme fait éclore sa dominante secondaire et son ombre ; les accords hors gamme de la progression choisie paraissent en satellites. Cinq progressions « avec des voisins » (Mario, ♭VII du rock, Creep, II majeur, chaîne du ragtime).
- [x] **B2, modulation** : les portes d'un accord sont les autres tonalités majeures qui le contiennent, par proximité sur le cycle des quintes (boutons sous la carte, avec le rôle qu'il y prend) ; un voisin touché montre sur la carte la porte où il mène. Passer une porte change la tonalité : les accords communs glissent (même disque, identifié par l'accord réel), leur degré se réécrit, la phrase dit ce qui reste, part et arrive. Trajet (fil d'Ariane) et « Rentrer à la maison ». Quatre progressions qui modulent (pivot vers la dominante, porte de V/V, côté bémol, camion) ; la carte bascule pendant la lecture, et chaque tour revient à la tonalité de départ.
- [x] **B3, bande des quintes** : remplace la ligne de quintes. Trois rangées (majeurs, relatifs mineurs, diminués) rangées par quintes, neuf colonnes autour de la tonalité ; la tonalité est une fenêtre de trois colonnes, les dominantes secondaires à sa droite, les emprunts à sa gauche ; les portes d'un accord touché sont des fenêtres en pointillés (cliquables). Sur mobile, la bande défile et se recentre sur la fenêtre.

### Décisions (piste B)

- **Correction de la proposition** : moduler d'un cran garde six *notes* sur sept, mais seulement quatre *accords* sur sept (de Do à Sol : Ré m, Fa, Si° partent ; Si m, Ré, Fa♯° arrivent). Les tests l'ont montré ; la page le dit.
- Les portes d'un accord de la gamme (modulation par pivot) restent en boutons sous la carte ; seuls les voisins montrent leur porte sur la carte (sinon quatre satellites s'entassaient).
- `t` dans l'URL est la tonalité du moment ; le sélecteur du panneau choisit la maison (le trajet repart d'elle). Après une porte, la progression choisie se lit dans la nouvelle tonalité.
- Une modulation directe (le camion) n'a pas de flèche : l'accord d'avant n'existe pas dans la nouvelle carte, le saut est franc.
- Tonalités majeures seulement ; le mineur (et ses accords propres, comme V majeur de La mineur) est la suite naturelle.
- Limite connue : dans la bande, les deux diminués voisins du vii° tombent dans la fenêtre (grisés) ; les fenêtres de portes chevauchent la fenêtre principale (deux colonnes sur trois sont communes, c'est le propos).

## Prochaine action

Relecture de l'auteur : http://localhost:5173/viz/suis-les-fleches/ (`npm run dev`). Ensuite, au choix : le mineur (maison mineure, relatif, V majeur du mineur harmonique comme porte) ou la piste C (« la colle » : notes communes et demi-tons entre deux accords, sur un mini-clavier).
