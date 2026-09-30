# Rapport qualité des données

Généré le 2026-09-30T23:04:49.520Z en 7.7 min. Seuil : une suite est retenue si assez de morceaux la contiennent (20 pour 2 degrés, 20 pour 3 degrés, 20 pour 4 degrés, 30 pour 5 degrés, 40 pour 6 degrés, 50 pour 7 degrés, 50 pour 8 degrés).

> Fichier régénéré à chaque `npm run data`. Le versionner permet de voir, dans le diff, ce qu’une mise à jour des sources a changé.

## Corpus

- Chordonomicon : 679 807 progressions lues, 205 écartées (moins de deux degrés distincts), **679 602 retenues**.
- Genre principal connu : 351 981 (51.8 %) ; année ou décennie connue : 422 004 (62.1 %).
- Mode estimé mineur : 170 711 (25.1 %).
- iRb : 1 185 standards de jazz ; McGill Billboard : 742 titres distincts (après dédoublonnage des entrées classées plusieurs fois).

| Genre | Morceaux |
| --- | --: |
| pop | 85 171 |
| rock | 67 199 |
| country | 53 296 |
| alternative | 47 235 |
| pop rock | 39 547 |
| punk | 16 066 |
| metal | 11 311 |
| rap | 11 167 |
| soul | 7 343 |
| jazz | 6 993 |
| reggae | 3 839 |
| electronic | 2 814 |

| Décennie | Morceaux |
| --- | --: |
| jusqu’aux années 1950 | 1 666 |
| années 1960 | 8 245 |
| années 1970 | 15 976 |
| années 1980 | 18 371 |
| années 1990 | 39 590 |
| années 2000 | 86 586 |
| années 2010 | 172 103 |
| années 2020 | 79 467 |

## Estimation de tonalité

Chordonomicon n’a pas de tonalité : elle est estimée depuis les accords (accord avec la gamme majeure, pondéré par la durée, bonus au premier et au dernier accord ; le mode se décide ensuite entre le majeur et son relatif mineur). Mesurée là où la tonalité est annotée :

- **iRb** (1 185 standards, tonalité et mode annotés) : armure juste **81.5 %**, tonique et mode exacts 77.0 %.
- **Billboard** (742 titres, tonique annotée) : tonique juste **86.5 %**, armure compatible avec la tonique 88.4 %.
- Marge de décision sur Chordonomicon (écart relatif entre la meilleure armure et la deuxième) : médiane 0.20, premier décile 0.04, dernier décile 0.32.

Les comptages se font dans l’armure (relatif majeur) : c’est la mesure « armure juste » qui compte pour la page. Le mode ne sert qu’à dire « dont N en mineur ». Les six poids de l’estimateur (premier accord, dernier, débuts de section, accords de tonique, emprunts, cadence V→I) ont été choisis par une recherche en grille sur ces deux mêmes corpus ; la grille est grossière (trois à cinq valeurs par poids), ce qui limite l’optimisme de la mesure, mais elle n’est pas indépendante.

« Vu dès » : la première année où au moins 3 morceaux datés contiennent la suite ; les dates antérieures à 1920 sont tenues pour des bouche-trous et ignorées.

## Suites retenues

| Longueur | Suites | JSON | gzippé |
| --: | --: | --: | --: |
| 2 | 1 536 | 116 Ko | 41 Ko |
| 3 | 10 039 | 716 Ko | 229 Ko |
| 4 | 27 864 | 1981 Ko | 597 Ko |
| 5 | 33 391 | 2460 Ko | 748 Ko |
| 6 | 33 776 | 2570 Ko | 776 Ko |
| 7 | 29 020 | 2276 Ko | 678 Ko |
| 8 | 26 910 | 2155 Ko | 622 Ko |

Total gzippé des agrégats : 3691 Ko (chaque page ne charge que la longueur demandée).

## Les suites les plus fréquentes

### 2 degrés

- V–I : 425 774 morceaux (62.7 %), dont 10.8 % en mineur, vu dès 1922
- I–V : 390 460 morceaux (57.5 %), dont 13.4 % en mineur, vu dès 1924
- IV–I : 381 808 morceaux (56.2 %), dont 13.3 % en mineur, vu dès 1925
- IV–V : 331 862 morceaux (48.8 %), dont 19.3 % en mineur, vu dès 1926
- I–IV : 326 634 morceaux (48.1 %), dont 11.6 % en mineur, vu dès 1924
- V–IV : 298 360 morceaux (43.9 %), dont 19.8 % en mineur, vu dès 1927
- V–vi : 260 694 morceaux (38.4 %), dont 33.9 % en mineur, vu dès 1926
- vi–IV : 254 057 morceaux (37.4 %), dont 32.8 % en mineur, vu dès 1934
- vi–V : 223 355 morceaux (32.9 %), dont 35.1 % en mineur, vu dès 1932
- I–vi : 219 683 morceaux (32.3 %), dont 20.7 % en mineur, vu dès 1926
- vi–I : 164 564 morceaux (24.2 %), dont 34.1 % en mineur, vu dès 1930
- IV–vi : 155 866 morceaux (22.9 %), dont 39.2 % en mineur, vu dès 1941

### 3 degrés

- IV–I–V : 225 288 morceaux (33.1 %), dont 10.8 % en mineur, vu dès 1926
- IV–V–I : 206 611 morceaux (30.4 %), dont 7.1 % en mineur, vu dès 1926
- V–I–IV : 200 248 morceaux (29.5 %), dont 6.7 % en mineur, vu dès 1924
- I–V–I : 186 014 morceaux (27.4 %), dont 3.6 % en mineur, vu dès 1925
- I–IV–I : 182 526 morceaux (26.9 %), dont 4.7 % en mineur, vu dès 1925
- V–I–V : 182 337 morceaux (26.8 %), dont 5.9 % en mineur, vu dès 1924
- V–IV–I : 156 129 morceaux (23.0 %), dont 8.1 % en mineur, vu dès 1928
- IV–I–IV : 147 010 morceaux (21.6 %), dont 5.9 % en mineur, vu dès 1926
- I–IV–V : 145 885 morceaux (21.5 %), dont 7.9 % en mineur, vu dès 1928
- I–V–IV : 142 124 morceaux (20.9 %), dont 10.5 % en mineur, vu dès 1930
- I–V–vi : 141 633 morceaux (20.8 %), dont 22.1 % en mineur, vu dès 1938
- V–vi–IV : 128 098 morceaux (18.8 %), dont 31.8 % en mineur, vu dès 1948

### 4 degrés

- V–I–IV–I : 100 552 morceaux (14.8 %), dont 1.9 % en mineur, vu dès 1925
- IV–I–V–I : 95 028 morceaux (14.0 %), dont 2.1 % en mineur, vu dès 1926
- I–V–I–V : 94 686 morceaux (13.9 %), dont 2.8 % en mineur, vu dès 1926
- V–I–V–I : 94 170 morceaux (13.9 %), dont 2.5 % en mineur, vu dès 1925
- IV–I–IV–I : 93 661 morceaux (13.8 %), dont 4.1 % en mineur, vu dès 1926
- I–IV–V–I : 93 306 morceaux (13.7 %), dont 2.7 % en mineur, vu dès 1928
- IV–V–I–IV : 92 555 morceaux (13.6 %), dont 3.9 % en mineur, vu dès 1928
- I–IV–I–IV : 91 722 morceaux (13.5 %), dont 3.6 % en mineur, vu dès 1926
- I–IV–I–V : 90 063 morceaux (13.3 %), dont 2.3 % en mineur, vu dès 1926
- IV–I–V–IV : 88 368 morceaux (13.0 %), dont 7.3 % en mineur, vu dès 1930
- I–V–IV–I : 86 099 morceaux (12.7 %), dont 4.7 % en mineur, vu dès 1930
- V–I–IV–V : 84 584 morceaux (12.4 %), dont 4.4 % en mineur, vu dès 1928

### 5 degrés

- I–IV–I–IV–I : 64 669 morceaux (9.5 %), dont 2.8 % en mineur, vu dès 1926
- IV–I–V–IV–I : 64 197 morceaux (9.4 %), dont 4.3 % en mineur, vu dès 1930
- I–V–I–V–I : 62 998 morceaux (9.3 %), dont 1.5 % en mineur, vu dès 1926
- V–I–IV–V–I : 62 129 morceaux (9.1 %), dont 2.3 % en mineur, vu dès 1928
- I–V–vi–IV–I : 61 335 morceaux (9.0 %), dont 21.1 % en mineur, vu dès 1958
- IV–I–V–vi–IV : 60 946 morceaux (9.0 %), dont 22.3 % en mineur, vu dès 1958
- V–vi–IV–I–V : 59 435 morceaux (8.7 %), dont 21.6 % en mineur, vu dès 1957
- I–V–IV–I–V : 59 138 morceaux (8.7 %), dont 4.6 % en mineur, vu dès 1936
- IV–V–I–IV–V : 57 644 morceaux (8.5 %), dont 3.5 % en mineur, vu dès 1928
- I–IV–I–V–I : 56 272 morceaux (8.3 %), dont 0.7 % en mineur, vu dès 1926
- I–IV–V–I–IV : 56 016 morceaux (8.2 %), dont 2.0 % en mineur, vu dès 1928
- V–I–V–I–V : 55 270 morceaux (8.1 %), dont 1.9 % en mineur, vu dès 1926

### 6 degrés

- I–V–vi–IV–I–V : 54 406 morceaux (8.0 %), dont 21.2 % en mineur, vu dès 1958
- IV–I–V–vi–IV–I : 51 116 morceaux (7.5 %), dont 23.1 % en mineur, vu dès 1958
- vi–IV–I–V–vi–IV : 49 369 morceaux (7.3 %), dont 24.8 % en mineur, vu dès 1958
- V–vi–IV–I–V–vi : 45 538 morceaux (6.7 %), dont 23.4 % en mineur, vu dès 1958
- IV–I–V–IV–I–V : 45 011 morceaux (6.6 %), dont 4.5 % en mineur, vu dès 1937
- IV–V–I–IV–V–I : 44 374 morceaux (6.5 %), dont 2.1 % en mineur, vu dès 1928
- V–I–V–I–V–I : 42 076 morceaux (6.2 %), dont 1.3 % en mineur, vu dès 1926
- I–V–I–V–I–V : 41 540 morceaux (6.1 %), dont 1.4 % en mineur, vu dès 1926
- IV–I–IV–I–IV–I : 40 560 morceaux (6.0 %), dont 3.0 % en mineur, vu dès 1931
- IV–I–V–I–IV–I : 40 274 morceaux (5.9 %), dont 0.7 % en mineur, vu dès 1927
- I–IV–V–I–IV–V : 39 877 morceaux (5.9 %), dont 2.0 % en mineur, vu dès 1928
- I–IV–I–IV–I–IV : 39 570 morceaux (5.8 %), dont 2.6 % en mineur, vu dès 1931

### 7 degrés

- IV–I–V–vi–IV–I–V : 45 602 morceaux (6.7 %), dont 23.4 % en mineur, vu dès 1958
- vi–IV–I–V–vi–IV–I : 42 219 morceaux (6.2 %), dont 25.6 % en mineur, vu dès 1958
- I–V–vi–IV–I–V–vi : 41 952 morceaux (6.2 %), dont 23.1 % en mineur, vu dès 1958
- V–vi–IV–I–V–vi–IV : 41 697 morceaux (6.1 %), dont 23.0 % en mineur, vu dès 1958
- I–V–I–V–I–V–I : 33 418 morceaux (4.9 %), dont 1.0 % en mineur, vu dès 1926
- I–IV–V–I–IV–V–I : 31 913 morceaux (4.7 %), dont 1.3 % en mineur, vu dès 1928
- I–V–IV–I–V–IV–I : 31 752 morceaux (4.7 %), dont 3.0 % en mineur, vu dès 1955
- I–V–I–IV–I–V–I : 30 691 morceaux (4.5 %), dont 0.4 % en mineur, vu dès 1928
- V–I–V–I–V–I–V : 30 286 morceaux (4.5 %), dont 1.2 % en mineur, vu dès 1936
- IV–I–V–IV–I–V–IV : 30 164 morceaux (4.4 %), dont 3.7 % en mineur, vu dès 1955
- V–I–IV–V–I–IV–V : 30 140 morceaux (4.4 %), dont 1.7 % en mineur, vu dès 1939
- V–IV–I–V–IV–I–V : 29 880 morceaux (4.4 %), dont 3.6 % en mineur, vu dès 1955

### 8 degrés

- I–V–vi–IV–I–V–vi–IV : 38 487 morceaux (5.7 %), dont 22.7 % en mineur, vu dès 1958
- vi–IV–I–V–vi–IV–I–V : 38 203 morceaux (5.6 %), dont 25.9 % en mineur, vu dès 1963
- V–vi–IV–I–V–vi–IV–I : 35 295 morceaux (5.2 %), dont 23.8 % en mineur, vu dès 1963
- IV–I–V–vi–IV–I–V–vi : 35 115 morceaux (5.2 %), dont 25.4 % en mineur, vu dès 1958
- IV–I–V–IV–I–V–IV–I : 26 015 morceaux (3.8 %), dont 3.0 % en mineur, vu dès 1955
- I–V–IV–I–V–IV–I–V : 25 468 morceaux (3.7 %), dont 3.1 % en mineur, vu dès 1955
- IV–V–I–IV–V–I–IV–V : 25 281 morceaux (3.7 %), dont 1.7 % en mineur, vu dès 1945
- V–I–IV–V–I–IV–V–I : 24 911 morceaux (3.7 %), dont 1.3 % en mineur, vu dès 1939
- V–I–V–I–V–I–V–I : 24 392 morceaux (3.6 %), dont 0.8 % en mineur, vu dès 1936
- V–IV–I–V–IV–I–V–IV : 24 168 morceaux (3.6 %), dont 3.0 % en mineur, vu dès 1956
- I–V–I–V–I–V–I–V : 23 914 morceaux (3.5 %), dont 0.8 % en mineur, vu dès 1945
- IV–I–V–I–IV–I–V–I : 23 178 morceaux (3.4 %), dont 0.4 % en mineur, vu dès 1935
