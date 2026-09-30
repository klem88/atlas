# Sonde de faisabilité : la carte des styles

Faite le 2026-09-30. Question : placés selon leurs transitions entre degrés, les morceaux se regroupent-ils par style assez nettement pour dessiner des continents ?

## Méthode

- Échantillon : jusqu’à 2500 tablatures par genre principal (tirage déterministe), plus les standards de l’iRb et les titres du Billboard ; morceaux d’au moins 8 transitions. 31877 vecteurs.
- Vecteur : fréquences des 576 transitions possibles entre 24 classes (degré × majeur/mineur), en racine carrée (Hellinger).
- ACP maison à dix composantes ; variance expliquée : 10.2 %, 7.6 %, 6.1 %, 5.4 %, 4.5 %, 3.8 %, 3.4 %, 3.2 %, 2.9 %, 2.8 % (cumul 49.8 %).
- Séparation mesurée sur 200 morceaux par style : silhouette moyenne par étiquette (1 = amas nets, 0 = mélange, < 0 = mal classé) et précision des dix plus proches voisins (hasard : 7 %).

## Résultats

| Espace | Silhouette | kNN (10) |
| --- | --: | --: |
| ACP 2D | -0.149 | 13.8 % |
| ACP 10D | -0.090 | 19.7 % |
| 576D (sans réduction) | -0.030 | 19.8 % |
| ACP 10D, iRb contre tout le reste | -0.050 | 95.1 % |

### Silhouette par style (ACP 10D)

| Style | Silhouette | Effectif |
| --- | --: | --: |
| pop | -0.125 | 2500 |
| rock | -0.135 | 2500 |
| country | -0.092 | 2500 |
| alternative | -0.137 | 2500 |
| pop rock | -0.113 | 2500 |
| punk | -0.086 | 2500 |
| metal | -0.054 | 2500 |
| rap | -0.154 | 2500 |
| soul | -0.155 | 2500 |
| jazz | -0.143 | 2500 |
| reggae | -0.174 | 2500 |
| electronic | -0.136 | 2500 |
| irb | 0.358 | 1149 |
| billboard | -0.115 | 728 |

## Décision

La meilleure silhouette d’ensemble est -0.03, sous le seuil de 0,2 fixé par la fiche : les genres des tablatures se recouvrent trop pour former des continents lisibles (la précision des voisins, 20 % contre 7 % au hasard, dit qu’il y a un signal, mais pas des îles). Une exception : les standards de jazz de l’iRb ont une silhouette de 0.36 : eux forment bien une île, le reste est un seul continent sans frontières. **On abandonne la carte** et on construit le repli prévu, « la boussole des styles » : pour chaque style, ses transitions signatures en petits multiples, et pour un morceau, le style auquel il ressemble le plus.