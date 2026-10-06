# Rapport qualité : Les ii–V du jazz

Généré le 2026-10-06 par `npm run data -- jazz-ii-v`, en 0.3 s.

## Source

- **iRb** (Broze et Shanahan, Ohio State University), paquet npm `sharp11-irb` : 1185 grilles de standards de jazz, issues des grilles iRealPro.
- Symboles d’accords non lus : 0 (ignorés).

## Méthode

- Grille aplatie dans l’ordre des sections, accords répétés fusionnés ; la fin rejoint le début.
- Un motif est une suite d’intervalles entre fondamentales et de qualités admises (voir `domain/progressions.ts`) : la tonalité du morceau n’intervient pas, une progression dans une tonalité de passage compte aussi.
- Les qualités sont réduites à dix classes (`src/shell/music/chords.ts`) : un « C6 » compte comme majeur, un « C-6 » comme mineur, un « G7♭9 » comme dominante.

## Résultats

| Progression | Standards | Part | Occurrences |
|---|---:|---:|---:|
| ii–V–I majeur | 871 | 73,5 % | 4029 |
| ii–V–i mineur | 455 | 38,4 % | 1159 |
| Majeur puis relatif mineur | 15 | 1,3 % | 31 |
| Turnaround I–vi–ii–V | 359 | 30,3 % | 951 |
| iii–VI–ii–V | 332 | 28,0 % | 795 |
| Dominantes en chaîne | 244 | 20,6 % | 742 |
| ii–V vers le IV, puis IV–iv | 282 | 23,8 % | 600 |
| Substitution tritonique | 38 | 3,2 % | 67 |
| Backdoor | 170 | 14,3 % | 432 |
| ii–V en chaîne qui descendent | 98 | 8,3 % | 243 |
| Diminué de passage | 81 | 6,8 % | 193 |

## Limites

- L’iRb est un corpus de grilles « de fake book » : une seule version par morceau, celle de ses contributeurs.
- Le motif ne regarde que les accords : un ii–V–I « caché » par une substitution ou une pédale n’est pas compté, et une suite d’accords qui ressemble au motif sans en avoir la fonction l’est.
- Les variantes du backdoor comptent aussi un simple ♭VII7–I.
