# Chantier : Les ficelles

Slug : `les-ficelles` (nom provisoire) · Branche : `feat/les-ficelles` (depuis `main`)

## Intention

Un outil d'aide à la composition « à la manière de » la chanson française des années 70 (Michel Berger, Julien Clerc, Michel Polnareff). On part d'une progression simple (la sienne, ou le cliché Do – La m – Fa – Sol) et on y applique des **ficelles** : des procédés harmoniques nommés, expliqués, signés par des titres où on les entend. L'outil sert à parts égales à **comprendre** (chaque ficelle est une leçon : ce qui bouge, pourquoi ça sonne) et à **composer** (on repart avec sa grille, jouable au piano).

Né le 4 octobre 2026 d'un constat sur le Chemin des accords : ses propositions (paires d'accords les plus fréquentes du corpus, triades sans basse) ne peuvent pas produire ce que font ces auteurs. Leur son tient à la basse qui chante, aux accords enrichis, aux emprunts, à la tension douce. La fréquence dans un corpus pop mesure le banal, pas le beau : ici, pas de corpus, des règles.

- Premier utilisateur : l'auteur, pianiste qui lit la musique mais connaît peu les progressions et la composition. D'où une vraie portée, et une page très pédagogique.

## Cadrage (4 octobre 2026)

**Phrase partageable** (provisoire) : *« Do – La m – Fa – Sol, plus six ficelles de la chanson française. »*

**Écran, de haut en bas** :

1. **La progression de départ** : le cliché Do – La m – Fa – Sol par défaut ; sinon une tonalité, les sept accords de la gamme à toucher ou une saisie (« Do Lam Fa Sol ») ; de 2 à 8 accords.
2. **La portée** (élément signature) : deux clés, un accord par mesure en rondes, en SVG fait maison (pas de bibliothèque de gravure). Des **fils colorés relient les notes d'une même voix** d'un accord à l'autre, la basse plus marquée. *Écouter* joue la progression avec un curseur qui avance. À 375 px, retour à la ligne toutes les deux mesures.
3. **Les six ficelles en cartes** : nom, une phrase, le nombre d'endroits où elle s'applique. Inapplicable : grisée, avec la raison (« il faut un Fa suivi d'un Do »).
4. **Un endroit** : toucher une carte allume ses endroits sur la portée ; toucher un endroit montre l'avant / l'après (écoute des deux, notes qui bougent allumées, une phrase qui explique le geste) ; *Garder* l'applique.
5. **Les ficelles gardées** s'empilent sous la portée, chacune retirable. Chaque carte porte un ou deux titres signés avec un lien d'écoute.
6. **Le résultat** : la grille finale en noms d'accords (« Do – Do/Si – La m7 – … »), copiable ; tout l'état est dans l'URL.

Les ficelles se recalculent à chaque geste : en appliquer une ouvre ou ferme des endroits pour les autres.

## Les six ficelles (v1)

| Ficelle | Où (règle v1) | Ce qu'elle fait | Exemple en Do |
| --- | --- | --- | --- |
| **La basse qui descend** | Deux accords dont la basse descend d'une tierce ou d'une quarte | Glisse un accord renversé sur la note de passage (tierce), deux pour une quarte | Do – La m → Do – Do/Si – La m |
| **L'emprunt mineur** | IV suivi de I | Insère iv entre les deux | Fa – Do → Fa – Fa m – Do |
| **La dominante qui annonce** | Un accord majeur ou mineur, s'il n'est pas déjà précédé de sa dominante | Insère sa septième de dominante juste avant | Do – La m → Do – Mi7 – La m |
| **Le Sol suspendu** | Un accord V | Le remplace par IV/V | Sol → Fa/Sol |
| **Les accords enrichis** | Un accord à trois sons | 7M sur I et IV, m7 sur ii, iii et vi, 7 sur V | Fa → Fa7M |
| **La montée finale** | La fin de la progression (une fois) | Ajoute la dominante du ton au-dessus, puis la progression transposée d'un ton | … Sol – La7 → Ré – Si m – Sol – La |

Pour plus tard : la chaîne de dominantes, la marche harmonique (elles réécrivent une phrase entière, pas un endroit), la pose manuelle d'une ficelle à un endroit choisi, un affichage clavier.

## Architecture

Trois couches de calcul pur et testé (`domain/`), puis l'affichage.

1. **La grille** (source de vérité, symbolique) : une liste d'accords ; chacun a sa fondamentale, sa couleur (maj, min, dim, 7, 7M, m7, sus…), sa basse si elle diffère (Do/Si, Fa/Sol) et **sa tonalité** (la montée finale fait passer la suite en Ré).
2. **Les ficelles** : un module par ficelle, même contrat :
   - `sites(grille)` : les endroits ;
   - `apply(grille, endroit)` : la nouvelle grille ;
   - `explique(grille, endroit)` : la phrase de l'avant / après ;
   - `pourquoiPas(grille)` : la raison si aucun endroit.
3. **La réalisation** : grille → voix réelles (basse + trois voix, en MIDI), selon les règles d'enchaînement classiques : notes communes tenues, plus petit mouvement, basse imposée par l'accord, tessitures bornées, pas de croisement, pas de quintes ni d'octaves parallèles. Le diff de deux réalisations donne les notes qui bougent. Nouvelle fonction **dans le socle** (`src/shell/music/`), à côté de `voicing.ts` qu'on ne touche pas (d'autres pages en dépendent).
4. **L'orthographe** : chaque note s'écrit d'après la tonalité et l'accord (Fa m → la♭, Mi7 → sol♯, Do/Si → si à la basse). Indispensable pour quelqu'un qui lit la musique.

**État** : la grille de départ + la pile des ficelles appliquées ; le résultat se recalcule en rejouant la pile. Retirer une ficelle = rejouer sans elle ; une ficelle plus haut dans la pile qui n'a plus son endroit tombe, avec un message. URL : `?t=C&p=C,Am,F,G&f=descend.1,emprunt.3`.

**Son** : synthé et lecteur du socle (`synth.ts`, `player.ts`), timbre de piano, environ 1,5 s par accord. L'avant / après ne rejoue que l'endroit et un accord de part et d'autre. Rien ne joue sans geste.

**Réutilisé du socle** : `chords.ts` (lecture des symboles), `synth.ts`, `player.ts`, jetons de design et gabarit.

## Les titres signés

Fichier versionné `viz/les-ficelles/data/signatures.ts` : auteur, titre, passage (« le pont », « l'entrée du refrain »), source consultée, lien d'écoute, et un état `a-verifier` / `valide`. On ne reproduit pas la grille du morceau : on nomme le geste. **L'auteur valide chaque titre à l'oreille au piano** ; seuls les titres `valide` s'affichent. Aucun titre avancé de mémoire. Une ficelle sans titre validé s'affiche sans signature.

## Critères de fin

- Les six ficelles sont jouables sur toute progression de 2 à 8 accords.
- `npm test` et `npm run typecheck` au vert ; tests : endroits, transformation et refus de chaque ficelle ; orthographe ; réalisation (croisements, tessitures, notes communes, parallèles) ; pile (rejouer, retirer, ficelle qui tombe) ; aller-retour de l'URL.
- Page vérifiée en clair, en sombre et à 375 px ; son sur geste ; `prefers-reduced-motion` respecté.
- Au moins une ficelle sur deux porte un titre validé par l'auteur.
- Image d'aperçu. La publication reste la décision de l'auteur.

## Décisions

- **Pas de corpus** : des règles explicites, transparentes, testées. (Le corpus pop favorise les clichés ; vérifié sur le Chemin des accords le 4 octobre 2026 : Fa → Fa m n'y apparaît pas du tout.)
- **Concept** : transformer une progression par ficelles (« comprendre » et « composer » à parts égales), avec le visuel « deux mains » pour montrer la basse.
- **Auteurs** : ficelles signées par une petite liste vérifiée à la main (pas d'empreinte mesurée ; possible plus tard si une sonde Chordonomicon montre assez de chansons de ces auteurs).
- **Écriture** : une vraie portée à deux clés, mais la musique est stockée une seule fois (voix MIDI) pour qu'un clavier puisse se brancher plus tard.
- **Pose des ficelles** : l'outil allume les endroits possibles, on écoute, on garde ou non.

## À décider

- Le nom définitif de la page.

## Tâches

- [x] Cadrage et fiche (4 octobre 2026)
- [ ] `npm run new:viz -- les-ficelles` (brouillon)
- [ ] Grille, orthographe, état dans l'URL ; tests
- [ ] Réalisation des voix dans le socle ; tests
- [ ] Ficelles 1 et 2 : la basse qui descend, l'emprunt mineur ; tests
- [ ] Ficelles 3 et 4 : la dominante qui annonce, le Sol suspendu ; tests
- [ ] Ficelles 5 et 6 : les accords enrichis, la montée finale ; tests
- [ ] La portée en SVG : deux clés, fils de voix, retour à la ligne mobile
- [ ] L'interaction : cartes, endroits allumés, avant / après, pile
- [ ] Le son : écoute, curseur, avant / après
- [ ] Les titres signés : recherche des sources, puis validation à l'oreille par l'auteur
- [ ] Vérifications clair / sombre / 375 px, image d'aperçu

## Prochaine action

L'auteur relit cette fiche. Ensuite : écrire le plan d'implémentation, puis `npm run new:viz -- les-ficelles --title "Les ficelles" --summary "…" --tags "Musique"`.
