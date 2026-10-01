# Rapport qualité des données

Généré le 2026-10-01T00:09:22.879Z en 0.0 min, depuis `wjazzd.db` (Weimar Jazz Database, Jazzomat, HfM Weimar). Chaque note d’un solo est rattachée à la section d’accord qui la couvre et comptée par degré relatif à la fondamentale de l’accord (0 = fondamentale, 4 = tierce, 7 = quinte, 10 = septième mineure…) ; « sur le temps » = premier tatum du temps. Aucune suite de notes n’est exportée.

> Fichier régénéré à chaque `npm run data`. Le versionner permet de voir, dans le diff, ce qu’une mise à jour des sources a changé.

## Volumes

- 456 solos, 302 standards, 78 solistes, 192 980 notes rattachées à un accord ; 0 notes hors de toute section d’accord (ignorées).

## Par type d’accord : où tombent les notes

| Type | Occurrences | Notes | 1 | b9 | 9 | #9 | 3 | 11 | #11 | 5 | b13 | 13 | b7 | 7 |
| --- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| dominante (7) | 12 255 | 82 377 | 14.2 % | 5.2 % | 9.5 % | 5.5 % | 10.0 % | 8.5 % | 4.7 % | 13.2 % | 5.1 % | 8.8 % | 11.1 % | 4.4 % |
| mineur 7 | 6 298 | 49 226 | 13.2 % | 3.9 % | 10.0 % | 13.7 % | 3.6 % | 11.7 % | 4.1 % | 14.0 % | 4.4 % | 7.1 % | 9.9 % | 4.5 % |
| septième majeure | 2 955 | 21 458 | 13.0 % | 2.6 % | 12.7 % | 4.0 % | 14.1 % | 6.0 % | 4.0 % | 16.4 % | 2.9 % | 10.0 % | 3.2 % | 11.1 % |
| majeur | 1 822 | 13 923 | 16.2 % | 2.5 % | 9.9 % | 5.4 % | 14.4 % | 6.5 % | 4.5 % | 16.1 % | 3.0 % | 10.0 % | 3.9 % | 7.5 % |
| mineur | 1 146 | 9 772 | 14.2 % | 3.7 % | 10.8 % | 13.3 % | 3.4 % | 10.7 % | 4.9 % | 14.7 % | 4.5 % | 6.4 % | 7.0 % | 6.4 % |
| demi-diminué | 1 008 | 4 806 | 10.3 % | 8.5 % | 4.3 % | 14.4 % | 4.7 % | 13.8 % | 11.3 % | 3.8 % | 8.1 % | 5.6 % | 10.7 % | 4.4 % |
| suspendu | 612 | 6 915 | 12.9 % | 5.2 % | 9.4 % | 7.9 % | 7.6 % | 10.5 % | 5.0 % | 10.3 % | 6.9 % | 8.6 % | 10.6 % | 5.2 % |
| diminué | 487 | 2 528 | 9.1 % | 6.5 % | 6.7 % | 9.2 % | 7.5 % | 4.2 % | 12.5 % | 6.7 % | 9.4 % | 12.5 % | 5.6 % | 10.1 % |
| augmenté | 278 | 1 975 | 15.1 % | 6.5 % | 6.2 % | 6.0 % | 11.9 % | 5.8 % | 9.1 % | 6.5 % | 11.3 % | 4.9 % | 11.5 % | 5.3 % |

### Sur le temps seulement

| Type | Notes sur le temps | 1 | b9 | 9 | #9 | 3 | 11 | #11 | 5 | b13 | 13 | b7 | 7 |
| --- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| dominante (7) | 26 060 | 15.4 % | 4.7 % | 9.0 % | 5.4 % | 11.2 % | 8.1 % | 4.1 % | 13.2 % | 4.9 % | 9.0 % | 11.6 % | 3.6 % |
| mineur 7 | 15 478 | 14.3 % | 3.8 % | 9.5 % | 14.6 % | 2.9 % | 11.4 % | 3.8 % | 14.4 % | 4.1 % | 7.7 % | 9.3 % | 4.2 % |
| septième majeure | 6 959 | 13.7 % | 2.4 % | 12.3 % | 3.9 % | 15.6 % | 5.5 % | 3.6 % | 17.1 % | 2.3 % | 9.9 % | 2.9 % | 10.8 % |
| majeur | 4 880 | 16.6 % | 2.5 % | 10.0 % | 5.2 % | 15.0 % | 6.0 % | 3.7 % | 17.0 % | 2.3 % | 10.2 % | 3.7 % | 7.9 % |
| mineur | 3 166 | 14.0 % | 3.9 % | 10.4 % | 15.4 % | 2.6 % | 10.6 % | 4.8 % | 13.7 % | 4.5 % | 6.6 % | 7.1 % | 6.3 % |
| demi-diminué | 1 536 | 11.1 % | 8.3 % | 3.1 % | 14.1 % | 5.5 % | 13.6 % | 11.6 % | 3.3 % | 7.7 % | 6.3 % | 10.5 % | 4.8 % |
| suspendu | 2 058 | 12.1 % | 6.0 % | 9.7 % | 7.8 % | 8.1 % | 8.8 % | 5.2 % | 11.9 % | 5.9 % | 9.2 % | 11.0 % | 4.2 % |
| diminué | 797 | 7.2 % | 6.9 % | 6.3 % | 10.0 % | 7.8 % | 3.0 % | 11.9 % | 6.3 % | 10.5 % | 12.5 % | 5.0 % | 12.5 % |
| augmenté | 532 | 15.2 % | 5.6 % | 4.7 % | 7.1 % | 12.4 % | 7.0 % | 7.1 % | 7.7 % | 11.3 % | 4.5 % | 11.3 % | 6.0 % |

## La phrase

Sur un accord de dominante, les solistes jouent la neuvième une fois sur onze (9.5 %), la tierce une fois sur dix (10.0 %) ; la fondamentale : 14.2 % des notes, 15.4 % sur le temps. Note la plus jouée : la fondamentale ; la moins jouée parmi les notes attendues : la onzième.

## Standards les plus joués

- Body and Soul (Heyman, Sour, Eyton, Green, C-maj) : 14 solos
- All the Things You Are (J. Kern, O. Hammerstein, Ab-maj) : 4 solos
- Anthropology (Parker, Gillespie, Bb-maj) : 4 solos
- I'll Remember April (Raye/DePaul/Johnston, G-maj) : 4 solos
- Oleo (Sonny Rollins, Bb-maj) : 4 solos
- After Theatre Jump (Wells, Db-maj) : 3 solos
- Baby Won't You Please Come Home (Warfield, Wiliams, Bb-maj) : 3 solos
- Blue Seven (Sonny Rollins, Bb-maj) : 3 solos
- Blue Train (John Coltrane, Eb-maj) : 3 solos
- Crazy Rhythm (Meyer, Kahn, Caesar, F-maj) : 3 solos
- Destination K.C. (Clayton, C-maj) : 3 solos
- Dickie's Dream (Basie-Young, C-min) : 3 solos
- Dolores (Shorter, ) : 3 solos
- Down Under (Freddie Hubbard, F#-min) : 3 solos
- Got No Blues (Lillian Hardin, F-maj) : 3 solos
