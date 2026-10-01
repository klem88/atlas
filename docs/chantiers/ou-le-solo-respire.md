# Chantier : Où le solo respire

Slug : `ou-le-solo-respire` · Branche : `feat/ou-le-solo-respire` (construite sur `feat/cinquante-ans-de-refrains`)

## Intention

Sur une grille de jazz, chaque accord reçoit les notes que les solistes y ont réellement jouées (Weimar Jazz Database, 456 solos transcrits) : on voit la couleur de chaque accord, les notes fortes, les tensions, les notes évitées, et on entend l'accord avec ses notes typiques. Public plus étroit (musiciens), mais très partagé chez eux ; c'est la page « pour les pianistes ».

- Viral ★ à ★★ (niche fidèle), faisable ★★ (nouveau corpus, SQLite, conditions d'usage à confirmer), adéquation ★★★.
- Sixième et dernière page du cycle « progressions ». **Condition** : confirmation écrite des conditions d'usage de la Weimar Jazz Database (courriel à jazzomat@hfm-weimar.de) avant publication ; en attendant, la page reste en brouillon ou bascule sur un repli (voir Décisions).

## Cadrage (1er octobre 2026, décidé par Claude sur mandat de l'auteur)

**Phrase partageable** : *« Sur un accord de dominante, les grands solistes jouent la neuvième une fois sur six. La tierce, une fois sur cinq. La fondamentale : presque jamais sur le temps. »* (chiffres à recalculer ; ceux-ci sont des ordres de grandeur attendus, pas des résultats)

**Écran principal** : **la grille qui s'allume** (élément signature) : les mesures d'un standard en ligne, un accord par case ; au-dessus de chaque case, les douze notes en colonne, remplies selon la fréquence avec laquelle les solistes les jouent sur cet accord (degrés relatifs à l'accord : fondamentale, 3, 5, 7, 9, 11, 13, notes hors accord), rampe ardoise, la note la plus jouée à l'accent. On touche une case pour entendre l'accord et ses trois notes les plus jouées.

- **Panneau** : le standard (ceux de la Weimar Jazz Database qui sont aussi dans iRb), le soliste (tous, ou un seul), la mesure (sur le temps fort, ou toutes les notes), le résultat pour l'accord touché (répartition, note la plus jouée, note évitée), *Écouter*, *Partager*.
- **Scène** : la grille ; sous elle, la synthèse par type d'accord (majeur 7, mineur 7, dominante, demi-diminué) sur tout le corpus, en petits multiples.
- **URL** : `?morceau=...&soliste=...`.
- **Données** : pipeline SQLite → pour chaque (morceau, mesure, accord) la distribution des degrés joués ; et pour chaque type d'accord la distribution globale. Aucune note n'est réexportée dans l'ordre : uniquement des comptages par accord.

## Décisions

- Les notes sont ramenées en **degrés relatifs à l'accord** (pas à la tonalité) : c'est ce que les solistes entendent.
- Seuls les morceaux dont la grille de Weimar correspond à celle d'iRb (même suite d'accords à la transposition près) sont affichés avec la grille iRb ; les autres utilisent la grille de Weimar.
- **Repli** si les conditions d'usage ne permettent pas la publication : la même page avec les notes **de la mélodie des standards** (iRb n'a pas les mélodies ; alors abandon) ou, plus simplement, la synthèse par type d'accord sans grille nommée. La décision revient à l'auteur.

## Courriel proposé (à envoyer par l'auteur à jazzomat@hfm-weimar.de)

> **Subject: Permission to publish aggregated statistics derived from the Weimar Jazz Database**
>
> Dear Jazzomat team,
>
> I am building Atlas (https://klem88.github.io/atlas/), a small non-commercial, open-source website of French-language data visualisations. One page, « Où le solo respire » (“Where the solo breathes”), shows, for each chord of a jazz standard, the distribution of scale degrees that soloists actually play over it, computed from the 456 transcribed solos of the Weimar Jazz Database.
>
> What would be published: only aggregated counts per (tune, chord position, scale degree) and per chord type, as a static JSON file (about 300 KB), plus tune titles and soloist names. No note-by-note transcription, no melody, no audio, nothing that would allow reconstructing a solo. The database itself is never redistributed; the page credits the WJD and cites *Inside the Jazzomat* (Pfleiderer et al., 2017) and lists the download page.
>
> Could you confirm that this use is in line with the terms under which the WJD is made available? If attribution should take a specific form, I will follow it.
>
> With thanks for this remarkable resource,
> Clément Roux

## Décisions de construction (nuit du 1er octobre 2026)

- **Chiffres réels** (dominante, 82 377 notes) : fondamentale 14 %, quinte 13 %, septième mineure 11 %, tierce 10 %, neuvième 9,5 %. La phrase de la fiche était fausse : la fondamentale n'est pas « presque jamais » jouée. La page dit ce que les données disent ; la phrase partageable est à réécrire par l'auteur depuis `REPORT.md`.
- Comptes **par symbole d'accord du standard** (toutes ses occurrences, tous les chorus), pas par mesure ; la grille affichée est le texte `chord_changes` de la base. Pas d'appariement avec l'iRb.
- « Sur le temps » = premier tatum du temps. Aucune suite de notes exportée ; 111 Ko gzippés.
- `node:sqlite` (Node 22.5+) suffit : pas de `better-sqlite3`.

## Tâches

- [ ] Courriel à Jazzomat (conditions d'usage), **à envoyer par l'auteur** ; texte proposé ci-dessous ; réponse à noter ici
- [x] Pipeline : lecture SQLite avec `node:sqlite` (sans dépendance), comptages par (solo, symbole, degré) et par type, `REPORT.md` ; pas d'appariement iRb (la grille de Weimar est utilisée, voir décisions)
- [x] Domaine : degrés relatifs à l'accord, répartitions, note évitée, grille textuelle ; tests
- [x] Grille qui s'allume, petits multiples par type, son, URL
- [x] Textes, image de partage, image d'aperçu
- [ ] **Vérification dans le navigateur non faite** (quota atteint) : à ouvrir en premier à la reprise ; relecture de l'auteur, publication sous réserve des conditions d'usage

## Prochaine action

Ouvrir http://localhost:5173/viz/ou-le-solo-respire/ et vérifier la page (non vue dans un navigateur), puis l'auteur envoie le courriel ci-dessus et réécrit la phrase partageable depuis le rapport.
