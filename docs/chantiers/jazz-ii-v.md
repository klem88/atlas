# Chantier : Les progressions du jazz (exercice au piano)

Slug : `jazz-ii-v` (nom de page provisoire « Les ii–V du jazz », à valider) · Branche : `feat/jazz-ii-v` (depuis `main`) · Rubrique : Exercices au piano (`kind: 'exercice'`)

## Intention

Demandé par l’auteur le 6 octobre 2026, après avoir testé « Improviser sur trois grilles nostalgiques » : « pas assez jazz, pas assez rythmique ». Il comprend bien l’harmonie mais lit mal la partition : il ne veut **pas de partition complète**. Ce qu’il veut savoir, c’est **quel mode jouer sur quel accord, et sur quel rythme**. Le reste tient en trois points :
- les progressions les plus courantes du jazz, **dans la tonalité de son choix** ;
- de petits exercices à forte valeur pédagogique, surtout pour le rythme ;
- **un suivi du tempo** : il dit « J’y arrive » et la page pose un tampon avec la date et le tempo, pour qu’il voie sa progression.

## Critères de fin

- [x] Onze progressions, une affichée à la fois (voir la liste plus bas), transposables dans les 12 tonalités.
- [x] Pour chaque accord : le mode, un mini-clavier qui allume ses notes, les notes guides (3ce et 7e) mises en avant, et la note à viser sur l’accord suivant.
- [x] Six paliers par progression. Chaque palier tient sur une carte : une consigne de deux ou trois lignes, **une seule mesure de rythme** pour la main gauche (rythme seul et voicing sur le clavier, sans portée) et le bouton « J’y arrive ».
- [x] Un accompagnement swing qui boucle sur la grille : une contrebasse qui marche, une ride, le charleston sur les temps 2 et 4. Il suit la tonalité et le tempo choisis.
- [x] « Écouter l’exemple » ajoute à l’accompagnement la main gauche du palier en cours.
- [x] Le carnet :
  - un tampon (palier, progression, tonalité, tempo, date) par « J’y arrive » ;
  - par progression, une grille paliers × 12 tonalités qui montre le meilleur tempo, et une petite courbe du tempo dans le temps ;
  - un résumé global (nombre de tampons, tempo moyen) ;
  - un export et un import en fichier JSON.
- [x] La fréquence de chaque progression dans le corpus iRb : « N standards sur 1 185 la contiennent ». La liste complète s’ouvre à la demande, et chaque titre montre sa grille avec la progression surlignée (demandé par l’auteur le 6 octobre 2026).
- [x] Tests au vert, typecheck au vert, page vérifiée en clair, en sombre et sur mobile (375 px).
- [x] Publiée et fusionnée sur `main` le 6 octobre 2026, à la demande de l’auteur, avant son écoute au piano.
- [ ] Écoute au piano par l’auteur.

## Les onze progressions

| # | Progression | En do | Où on l’entend |
|---|---|---|---|
| 1 | ii–V–I majeur | Dm7 G7 Cmaj7 | partout |
| 2 | ii–V–i mineur | Bø E7alt Am6 | *Autumn Leaves*, *Blue Bossa* |
| 3 | *Autumn Leaves* (1 puis 2 enchaînés) | Dm7 G7 Cmaj7 Fmaj7 Bø E7 Am | *Autumn Leaves* |
| 4 | Turnaround I–vi–ii–V | Cmaj7 A7 Dm7 G7 | *I Got Rhythm*, fins de grilles |
| 5 | iii–VI–ii–V | Em7 A7 Dm7 G7 | *I Got Rhythm*, *Blue Moon* |
| 6 | Dominantes en chaîne III7–VI7–II7–V7 | E7 A7 D7 G7 | pont de *Rhythm changes*, *Sweet Georgia Brown* |
| 7 | ii–V vers le IV, puis IV–iv mineur | Cmaj7 Gm7 C7 Fmaj7 Fm6 Cmaj7 | *All of Me*, *Misty* |
| 8 | Substitution tritonique ii–♭II7–I | Dm7 D♭7 Cmaj7 | bebop |
| 9 | Backdoor iv–♭VII7–I | Fm7 B♭7 Cmaj7 | *Lady Bird*, *There Will Never Be Another You* |
| 10 | ii–V en chaîne qui descendent | Em7 A7 E♭m7 A♭7 Dm7 G7 | *Satin Doll*, *Tune Up* |
| 11 | Diminué de passage I–♯I°–ii–V | Cmaj7 C♯°7 Dm7 G7 | *Ain’t Misbehavin’*, *Have You Met Miss Jones* |

Choix de l’auteur (6 octobre 2026) : pas de blues ; les dominantes en chaîne, les substitutions courantes et le ii–V vers le IV ajoutés à la liste de départ ; les numéros 10 et 11 proposés par Claude et acceptés.

**Modes par fonction** :

| Fonction | Mode |
|---|---|
| ii m7 | dorien |
| V7 vers un majeur | mixolydien |
| I maj7 | ionien (lydien en option) |
| iiø | locrien |
| V7 vers un mineur | altéré (phrygien dominant en option) |
| i m6 | mélodique mineur |
| dominantes secondaires | mixolydien, ou ♭9/♭13 quand elles vont vers un accord mineur |
| ♭II7 | lydien ♭7 |
| ♭VII7 du backdoor | mixolydien |
| iv m6 | mélodique mineur |
| °7 | ton/demi-ton |

Chaque choix est noté dans `domain/`, avec un test.

## Les six paliers (les mêmes pour toutes les progressions)

1. **Notes guides** : la main gauche tient la 3ce et la 7e en rondes ; la main droite se tait. On écoute la 7e descendre d’un demi-ton sur la 3ce suivante.
2. **Charleston** : voicings sans fondamentale A et B (Bill Evans, présentés par Mark Levine), joués sur une noire pointée puis une croche.
3. **Anticipation** : l’accord suivant arrive sur le « et » du 4.
4. **Croches swing dans le mode** : la main droite change de mode pile sur le changement d’accord et retombe sur la 3ce au temps 1.
5. **Phrases à contretemps** : deux mesures de jeu, deux mesures de silence ; la phrase commence sur un « et ».
6. **Encerclements** : on vise la 3ce de l’accord suivant par le demi-ton au-dessus et le demi-ton en dessous (bebop, *Forward Motion* de Hal Galper).

Références pédagogiques : Aebersold vol. 3 (*The II/V7/I Progression*), Mark Levine (*The Jazz Piano Book*), Phil DeGreg (*Jazz Keyboard Harmony*), Hal Galper (*Forward Motion*), Jerry Bergonzi (*Inside Improvisation*). Usage habituel : le métronome sur les temps 2 et 4, et les 12 tonalités par le cycle des quartes.

## Décisions

- **Pas de partition ABC complète**, à la demande de l’auteur. On montre une mesure de rythme et un voicing ; la main droite reçoit une consigne en mots.
- **Accompagnement A + « Écouter l’exemple »** (choix de l’auteur) :
  - la page joue la section rythmique et, à la demande, la main gauche du palier ;
  - elle ne joue jamais de phrase de main droite (l’option C a été écartée, car elle revenait à « tout écrire »).
- **Tonalité** : 12 boutons rangés dans l’ordre du cycle des quartes, plus un bouton « tonalité suivante ». Le choix est retenu d’une visite à l’autre.
- **Carnet** : enregistré dans le navigateur (`localStorage`, lectures et écritures dans un try/catch), avec export et import en JSON pour ne rien perdre. Il se lit par progression ; une grille unique de 11 × 6 × 12 cases serait trop grande.
- **Pas de micro** : c’est l’auteur qui décide quand il y arrive.

## Architecture

Socle (`src/shell/music/`), parce que l’accompagnement servira à d’autres exercices :
- `swing.ts` (pur, testé) : la contrebasse qui marche sur une grille (fondamentale au temps 1, notes de l’accord, approche chromatique de l’accord suivant), le motif ride et charleston, l’ordonnancement des croches swing (rapport réglable, 2:1 par défaut) ;
- `drums.ts` : ride et charleston synthétisés avec du bruit filtré (Web Audio) ;
- `band.ts` : l’horloge Web Audio, qui ordonnance par lots la basse (`PianoSynth`, registre grave), la batterie et l’exemple de main gauche. La boucle est sans fin et suit en direct les changements de tempo et de tonalité.
- `logbook.ts` (pur, testé) : les tampons, le meilleur tempo par case, la série dans le temps, la validation de l’import. Le stockage est isolé dans une fine couche à part.

Exercice (`viz/jazz-ii-v/`) :
- `domain/progressions.ts` : les 11 grilles en degrés relatifs, avec leur transposition testée ;
- `domain/modes.ts` : le mode de chaque fonction et ses notes ;
- `domain/voicings.ts` : les voicings sans fondamentale A et B dans un registre fixe, avec un mouvement minimal entre accords ;
- `domain/paliers.ts` : le motif rythmique de main gauche de chaque palier et son texte ;
- `pipeline/build.ts` : compte chaque progression dans le corpus iRb (`tools/lib/corpora.ts`, `readIrb`) par motifs d’intervalles entre fondamentales et de qualités, sans estimer la tonalité. Il écrit `public/data/jazz-ii-v/frequences.json` et `REPORT.md`.

## Résultats de l’iRb (6 octobre 2026)

Nombre de standards, sur 1 185, qui contiennent chaque progression :

| Progression | Standards |
|---|---:|
| ii–V–I majeur | 871 |
| ii–V–i mineur | 455 |
| Turnaround I–vi–ii–V | 359 |
| iii–VI–ii–V | 332 |
| ii–V vers le IV, puis IV–iv | 282 |
| Dominantes en chaîne | 244 |
| Backdoor | 170 |
| ii–V en chaîne qui descendent | 98 |
| Diminué de passage | 81 |
| Substitution tritonique | 38 |
| Majeur puis relatif mineur | 15 |

Le motif d’*Autumn Leaves* est strict (cinq accords d’affilée), d’où son petit nombre. Le détail est dans `viz/jazz-ii-v/pipeline/REPORT.md`.

## Construit le 6 octobre 2026

- Sur la page : bandeau collant (lecture, tempo, palier, exemple, tonalité suivante), choix de la progression et des 12 tonalités, grille dont la mesure et le temps joués s’allument, cartes d’accords (mode, notes guides en orange, note à viser, claviers des deux mains), six paliers, carnet, standards.
- Socle ajouté (`src/shell/music/`) :
  - `swing.ts`, `sounds.ts`, `band.ts`, `logbook.ts` ;
  - `piano.ts` exporte maintenant `pianoNote`.
- Voicings : choisis par programmation dynamique sur toute la boucle. Sur les grilles qui descendent par quintes, la main gauche glisse vers le grave et doit remonter une fois par tour : ce saut est signalé dans les limites de la page.
- Sur téléphone, le bandeau ne garde que la lecture, le tempo et la tonalité. Le palier et l’exemple se choisissent dans les cartes.
- Non vérifié par Claude : le son lui-même (le navigateur de test ne fait pas entendre l’audio) et l’allumage des mesures pendant la lecture (l’animation ne tourne pas dans le panneau de test masqué). L’horloge, elle, a été mesurée : décompte, position, changement de tempo.

## À décider

- Le nom de la page (« Les ii–V du jazz » est provisoire).
- Le swing : en attendant, rapport 2:1 jusqu’à 160 à la noire, puis de plus en plus droit (0,58 à 260). À juger à l’oreille.
- Le son de la contrebasse et de la ride : à juger sur la tablette.

## Prochaine action

Recueillir le retour de l’auteur au piano sur la page publiée (https://klem88.github.io/atlas/viz/jazz-ii-v/) : son de la section, swing, voicings, textes des paliers. Corriger d’après son retour, sur une nouvelle branche.
