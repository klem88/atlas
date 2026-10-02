# Chantier : Le chemin des accords

Slug : `chemin-des-accords` · Branche : `feat/chemin-des-accords` (depuis `feat/suis-les-fleches`, dont elle importe le code)

## Intention

Composer une progression sur la carte d'une tonalité en sachant **toujours où l'on est, où l'on peut aller, et où l'on était**. Née de la relecture de « Suis les flèches » (2 octobre 2026) : sa carte est belle, mais ses flèches de fond sont fixes (aucune ne part de la tonique, ce qui laisse croire qu'on ne peut aller nulle part depuis Do), toucher un accord ne montre que ses voisins hors gamme, la progression qu'on joue n'est gardée nulle part, et une modulation redessine la carte sans dire où se trouve la nouvelle tonalité par rapport à la maison. « Suis les flèches » reste intacte ; cette page reprend son cercle et s'y consacre entièrement.

- Viral ★★ (« mon chemin d'accords, de Do à Sol »), faisable ★★★ (aucune donnée nouvelle), adéquation ★★★ (l'auteur veut apprendre l'harmonie en la voyant).

## Cadrage (validé par l'auteur le 2 octobre 2026)

**Phrase partageable** : *« Do, La m, Ré, Sol, Si m : je suis parti de Do majeur et j'ai atterri en Sol. »*

**Écran principal**

- **Le cercle de la tonalité** (repris de « Suis les flèches ») : la tonique au centre ; autour, les six autres accords dans leurs trois secteurs (tension en haut, repos à droite, départ à gauche). Noms réels, degré en petit.
- **L'anneau des tonalités** autour du cercle : les douze tonalités majeures sur le cycle des quintes. La maison est cerclée de pointillés, la tonalité du moment est à l'accent ; une flèche courbe, le long de l'anneau, va de la maison à la tonalité du moment. Une tonalité **frôlée** s'allume en pointillés à l'accent.
- **Halos = possibilités** : autour de chaque accord que l'on peut jouer ensuite, un halo à l'accent dont la taille (et l'opacité) dit la part des chansons qui font ce pas, avec le pourcentage dessous. Les sept accords de la gamme ont toujours un halo (même à 0 %) ; au plus trois accords hors de la gamme (dominantes secondaires, emprunts), les plus joués après l'accord du moment, paraissent en satellites à bord pointillé, près de l'accord auquel ils se rattachent.
- **Flèches = chemin** : les pas déjà faits restent dessinés sur la carte et pâlissent avec l'âge ; le dernier est à l'accent. Sur ordinateur, survoler un accord candidat dessine la flèche du pas à venir et affiche sa phrase.
- **Le panneau** : « Tu es en **Sol majeur** », d'où l'on vient (« parti de Do majeur, un cran vers les dièses ») ou ce qui se passe (« on penche vers Sol majeur ») ; la phrase du dernier pas (`moveSentence`) ; les suites les plus jouées en clair (« Mi m 35 % · Do 20 % … ») ; ce que frôlerait un satellite. Boutons : *↶ Annuler*, *▶ Écouter* (rejoue le chemin, la carte rebascule à chaque modulation), *Recommencer*, tonalité de départ (douze majeures).
- **Le ruban** sous la carte : les accords joués en jetons (nom, degré dessous), sur des bandes nommées par tonalité (« Do majeur », « Sol majeur »). L'accord pivot est à cheval sur deux bandes et porte ses deux degrés (« V/V → V »).

**Geste** : toucher un accord = l'entendre **et** le poser (il entre dans le ruban, les halos se recalculent depuis lui). *Annuler* retire le dernier. Au départ, rien n'est joué : les sept accords sont neutres, on choisit par où commencer.

**Modulation : frôler puis confirmer**

1. Une **dominante secondaire** ou un accord **d'ailleurs** frôle une autre tonalité : celle qu'il vise (pour une dominante secondaire, la tonalité de sa cible ; sinon la plus proche sur le cycle des quintes qui le contient) s'allume en pointillés, le panneau dit « on penche vers Sol majeur ». Un **emprunt au mineur** (Fa m, Si♭, La♭ en Do) ne frôle rien : c'est une couleur, la page le dit (« une ombre sur IV »), et la tonalité ne bouge pas.
2. Tant qu'on joue des accords **communs** aux deux tonalités, on reste en suspens.
3. Le premier accord qui n'appartient **qu'à l'une des deux** tranche : à la nouvelle → la modulation est confirmée (la carte bascule : les accords communs glissent vers leur nouvelle place, trois partent, trois arrivent ; l'anneau avance) ; à l'ancienne → le frôlement s'éteint, c'était un détour.
4. Un accord qui n'appartient à aucune des deux relance un frôlement vers sa propre tonalité.
5. À la confirmation, les accords en suspens et l'accord qui avait frôlé passent dans la bande de la nouvelle tonalité ; le premier d'entre eux est le **pivot** (deux degrés).

**Légendes au fil du jeu** (demande de l'auteur : expliquer ce qui se passe, sans envahir). Une seule légende à la fois, une ligne en italique sous le panneau (sous la carte sur mobile), qui s'efface au pas suivant ; jamais de fenêtre qui bloque. Les légendes d'apprentissage (marquées « 1re fois ») ne paraissent qu'une fois par visite ; celles d'événement paraissent chaque fois que l'événement se produit. Par ordre de priorité quand plusieurs s'appliquent :

| Moment | Légende (exemple en Do) |
| --- | --- |
| Modulation confirmée | « Si m n'existe qu'en Sol majeur : on y est. Ré a servi de pivot : V/V en Do, V en Sol. » |
| Frôlement éteint | « Fa n'existe qu'en Do : Ré n'était qu'un détour vers Sol (on dit une tonicisation). » |
| Frôlement | « Ré n'est pas dans Do majeur : il tire vers Sol. Si un accord propre à Sol suit, on aura modulé. » |
| Suspens | « Mi m est en Do comme en Sol : on ne sait pas encore. » |
| Emprunt en boucle (même emprunt deux fois avec la tonique entre) | « Do – Si♭ en boucle : le son du rock (mode mixolydien). On reste en Do : Si♭ est une couleur, pas une destination. » |
| Emprunt | « Si♭ vient de Do mineur : une ombre passagère, on reste en Do. » |
| Retour à la maison après une modulation | « De retour en Do majeur, la maison. » |
| Pas rare (< 1 %) | « Peu de chansons font ce pas. Rien n'est interdit : à toi de juger à l'oreille. » |
| Premier satellite (1re fois) | « En pointillés : un accord hors de la gamme, que les chansons jouent souvent ici. » |
| Premier accord (1re fois) | « Les halos montrent où vont les chansons après Do : plus il est grand, plus le pas est courant. » |
| Départ | « Touche un accord pour commencer. Depuis la maison, tout est possible. » |

**Petites bulles** (au survol sur ordinateur, au toucher long sur mobile, et un « ? » discret à côté de l'élément) sur : l'anneau (« les douze tonalités, rangées par quintes : voisines = presque les mêmes accords »), un halo (« 35 % des chansons qui jouent Sol font ensuite Mi m »), un jeton pivot (« cet accord appartient aux deux tonalités »), une bande du ruban, un satellite (son rôle : « V/vi, la dominante de La m »).

**Mobile (375 px)** : anneau et cercle en pleine largeur (disques ≥ 44 px), panneau court dessous (« Sol majeur · Sol → Si m … »), ruban qui défile horizontalement et se cale sur le dernier accord.

**URL** : `?t=C&p=C,Am,D,G,Bm` (tonalité de départ, chemin en accords réels) ; le chemin se rejoue à l'ouverture.

## Données

Aucune nouvelle. `public/data/progression-jouee/p2.json` (118 Ko, chargé une fois) : pour chaque couple de degrés (« V,vi »), le nombre de morceaux qui le contiennent (colonne `total`). Depuis l'accord du moment, lu en degré de la **tonalité du moment** : part(x) = morceaux(a,x) / Σ morceaux(a,·). Les couples vus moins de 20 fois sont absents (seuil du pipeline) : leur part s'affiche « < 1 % ». Les morceaux mineurs y sont ramenés à leur relatif majeur (choix du pipeline, dit dans la page).

Volontairement pas de probabilité conditionnée à toute la suite (comme « Compose ta progression ») : après une modulation, le préfixe vit dans une autre tonalité, et la page explique un pas, pas une chanson.

## Code

Importé de `viz/suis-les-fleches/` **sans le modifier** (dépendance assumée, comme compose-ta-progression → progression-jouee) : `domain/harmony.ts` (accords réels, rôle, `keysContaining`, `fifthsOffset`, `modulation`), `domain/moves.ts` (phrase d'un pas), `domain/layout.ts` (angles du cercle, `arrowPath`). Le son par le socle (`Synth`, `Player`, `voice`). Le code commun ira dans `src/shell/music/` quand l'une des deux pages sera publiée.

Nouveau :
- `domain/journey.ts` : le parcours, réduit pas à pas depuis `(maison, accords[])` : tonalité de chaque pas, frôlement, suspens, confirmation, pivot, bandes du ruban ; annuler = rejouer sans le dernier. Pur.
- `domain/halos.ts` : les candidats après un accord dans une tonalité (sept de la gamme + trois satellites au plus) et leurs parts, depuis une part `p2`.
- `domain/notes.ts` : la légende d'un pas (d'après le parcours avant et après), par priorité ; textes des bulles. Pur.
- `domain/ring.ts` : positions de l'anneau, arc maison → tonalité du moment.
- `ui/map.ts` (cercle, anneau, halos, traînée, glissement à la bascule), `ui/ribbon.ts` (ruban), `state.ts` (URL), `main.ts`.

## Critères de fin

- `journey.ts` testé sur les cas : diatonique pur ; détour (Do – Ré – Sol – Fa : frôle Sol puis s'éteint) ; modulation confirmée (Do – La m – Ré – Sol – Si m : bascule en Sol, pivot Ré) ; suspens prolongé (Do – Ré – Sol – Mi m – Do) ; frôlement relancé ; annulation ; aller-retour vers la maison.
- `journey.ts` : un emprunt (Do – Fa m – Do) ne frôle rien.
- `notes.ts` testé : chaque ligne du tableau des légendes sur son cas, priorité quand plusieurs s'appliquent, « 1re fois » respecté.
- `halos.ts` testé : parts calculées sur toutes les suites du corpus (la somme des candidats affichés est ≤ 100 %), sept accords de la gamme toujours présents, trois satellites au plus, lecture en degrés de la tonalité du moment après modulation.
- On répond à vue aux trois questions (où je suis, où je peux aller, où j'étais) à 375 px, en clair et en sombre.
- `prefers-reduced-motion` : pas de glissement ni de pâlissement animé, les états apparaissent d'un coup.
- Son seulement sur geste ; une seule teinte vive (l'accent : accord du moment, halos, tonalité du moment, dernier pas) ; image d'aperçu.

## Hors champ (pistes pour plus tard)

Bibliothèque de progressions, autres dispositions (grille, bande), tonalités et modes mineurs, septièmes, filtres par style ou décennie.

## Tâches

- [x] Cadrage avec l'auteur (maquettes : modulation, possibilités, écran complet)
- [x] Domaine : `journey.ts`, `halos.ts`, `geometry.ts`, `notes.ts` ; tests
- [x] Squelette de la page (`npm run new:viz`), carte + anneau + halos, geste toucher-poser, son
- [x] Traînée, ruban, panneau, annulation, bascule animée
- [x] URL, écoute du chemin, textes (comment lire, méthode, sources, limites)
- [x] Vérification navigateur : clair, sombre, 375 px ; image d'aperçu
- [ ] Relecture de l'auteur

## Décisions

- Flèches : la théorie décide quelles suites existent (gamme, dominantes secondaires, emprunts), le corpus décide de leur poids (choix de l'auteur).
- Modulation « frôler puis confirmer » plutôt que portes explicites ou bascule immédiate (choix de l'auteur) ; règle de décision : le premier accord propre à l'une des deux tonalités.
- Carte « C » : cercle local + anneau des tonalités (choix de l'auteur, sur maquettes).
- Halo = possibilité, flèche = chemin (choix de l'auteur).
- Toucher = jouer et poser, avec annulation (choix de l'auteur).
- Une dominante secondaire de cible mineure (V/ii, V/iii, V/vi) est une couleur, comme un emprunt : elle éclaire un accord sans quitter la tonalité (pas de tonalités mineures dans cette page). Seuls V/V et les accords d’ailleurs frôlent. Un accord répété ne change rien. (Construction, 2 octobre 2026.)
- `ring.ts` devient `geometry.ts` : satellites et anneau partagent la même géométrie.
- Une dominante secondaire de cible mineure est une couleur, pas une porte (déjà notée plus haut). (2 octobre 2026)
- Une couleur jouée pendant un frôlement éteint le frôlement. (2 octobre 2026)
- Au plus quatre accords en pointillés : l'accord du moment et le précédent, s'ils sont hors gamme, passent avant les candidats. (2 octobre 2026)
- Toucher un accord pendant l'écoute l'arrête sans l'ajouter au chemin. (2 octobre 2026)
- Au premier accord, la légende des halos passe avant celle des pointillés. (2 octobre 2026)

## Prochaine action

Relecture de l’auteur sur http://localhost:5173/viz/chemin-des-accords/ ; ensuite seulement `status: 'published'` dans `src/shell/site.ts`.
