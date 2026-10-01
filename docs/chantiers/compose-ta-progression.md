# Chantier : Compose ta progression

Slug : `compose-ta-progression` · Branche : `feat/compose-ta-progression` (construite sur `feat/tore-a-plat`, donc sur le cycle « progressions »)

## Intention

Le pendant joueur de « Ta progression a déjà été jouée 40 000 fois » : on pose un premier accord, la page ouvre l'éventail des accords possibles pour la suite, chacun à la taille de sa probabilité, on en choisit un, et ainsi de suite. À chaque pas, on voit la progression devenir plus commune ou plus rare, dans quels styles elle vit, et quels morceaux nommés la contiennent. Demandé par l'auteur le 2 octobre 2026 ; cadrage décidé par Claude sur ses indications (accords en noms réels dans une tonalité choisie, degré en petit).

- Viral ★★★ (on crée, on partage « ma progression est dans 24 morceaux »), faisable ★★★ (aucune donnée nouvelle : les parts `p2`…`p8` de progression-jouee), adéquation ★★★.

## Cadrage (2 octobre 2026)

**Phrase partageable** : *« Après Do – Sol – La m, 61 % des chansons vont au Fa. J'ai choisi le Ré♭. Il y en a 24. »*

**Écran principal** : en haut, **la portée** : les accords choisis en jetons (« Do », « Sol », « La m », le degré en petit dessous), dans la tonalité choisie ; à droite du dernier, **l'éventail** (élément signature) : les accords possibles pour la suite, en arc, chaque disque à la taille de sa probabilité, les plus probables au centre, les raretés aux extrémités, toutes visibles. Toucher un disque le fait entendre, le glisse dans la portée (animation), et ouvre l'éventail suivant. Sous la portée, **la ligne qui respire** : sa largeur est le nombre de morceaux qui contiennent la progression ; elle s'amincit à chaque choix rare ; le compteur suit.

- **Probabilités conditionnées à toute la suite posée** (jusqu'à huit accords) : P(suivant | préfixe) = morceaux(préfixe + suivant) / morceaux(préfixe), depuis la part de longueur n + 1. Pour un seul accord posé : la part `p2`. Les continuations vues moins de 20 fois n'apparaissent pas (dit dans la page) ; une case « autre chose » les regroupe avec leur masse.
- **Style** : un sélecteur (toutes les tablatures, douze genres) rejoue l'éventail avec les comptes du genre (colonnes des parts). Les décennies aussi, si les effectifs tiennent.
- **Panneau** : tonalité (douze majeures), style, le compte de morceaux de la progression courante, les trois styles qui l'aiment le plus (part dans le genre), des morceaux nommés qui la contiennent (`songs.json` de progression-jouee), *Écouter* (la boucle), *Laisse la pop décider* (tirage au sort pondéré d'un accord suivant), *Recommencer*, *Partager*, et un lien vers « Ta progression a déjà été jouée » avec la progression préremplie.
- **URL** : `?p=I,V,vi,IV&t=C&style=pop`.
- **Données** : aucune nouvelle. La page charge `meta.json`, `songs.json` et la part `p{n+1}.json` nécessaire au pas courant (cache mémoire).

## Critères de fin

- Les probabilités affichées se recalculent depuis les parts (test) ; l'éventail totalise 100 % avec « autre chose ».
- Éventail lisible et touchable à 375 px (disques ≥ 40 px, jamais superposés : les petits sont regroupés si la place manque).
- Son sur geste ; clair et sombre ; `prefers-reduced-motion` (pas de glissement) ; image de partage (portée + éventail) et d'aperçu.
- Une seule teinte : les disques dans la rampe selon la probabilité, le choisi à l'accent.

## Décisions

- Noms réels d'accords dans la tonalité choisie, degré en petit (demande de l'auteur) ; en interne tout reste en degrés, donc comparable aux autres pages.
- Les septièmes restent repliées (comme partout) : « Sol » vaut aussi G7.
- Maximum huit accords (limite des parts) ; au-delà, la page propose de partager ou de recommencer.

## Tâches

- [ ] Domaine : `nextChords(prefix, shard, meta, style)` (probabilités, regroupement « autre chose »), tirage pondéré, phrases ; tests
- [ ] Interface : portée, éventail (SVG, disposition en arc sans chevauchement), ligne qui respire, panneau, son, URL
- [ ] Textes, image de partage, image d'aperçu
- [ ] Vérification 375 px, clair, sombre ; publication

## Prochaine action

Créer la branche, `npm run new:viz -- compose-ta-progression`, écrire le domaine en TDD.
