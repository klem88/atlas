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

## Tâches

- [ ] Courriel à Jazzomat (conditions d'usage), réponse notée ici
- [ ] Pipeline : lecture SQLite (`better-sqlite3` ou `sql.js`), appariement avec iRb, comptages par accord et par type, `REPORT.md`
- [ ] Domaine : degrés relatifs à l'accord, répartitions, note évitée ; tests
- [ ] Grille qui s'allume, petits multiples, son, URL
- [ ] Textes, image de partage, image d'aperçu
- [ ] Vérification mobile/clair/sombre, relecture de l'auteur, publication (sous réserve des conditions d'usage)

## Prochaine action

Après `cinquante-ans-de-refrains` : le courriel (à écrire par l'auteur, texte proposé par Claude), puis le pipeline.
