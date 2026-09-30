# Pipeline de données

Transforme des sources publiques en trois fichiers statiques, consommés tels quels par le front :

| Fichier | Contenu | Source |
|---|---|---|
| `public/data/salaire-logement/prices.json` | Prix médian au m² par commune, année (2010 → 2025) et type de bien | Cerema, indicateurs DV3F |
| `public/data/salaire-logement/rates.json` | Taux moyen des crédits immobiliers, mensuel et annuel | BCE, série MIR (France) |
| `public/data/salaire-logement/communes.topo.json` | Contours des communes et des départements (TopoJSON) | Etalab, contours administratifs 2025 |

Le format de sortie est défini dans [`data/contract.ts`](../data/contract.ts) et vérifié par [`data/validate.ts`](../data/validate.ts), que le front réutilise au chargement.

## Utilisation

```bash
npm run data -- salaire-logement                 # utilise le cache local (pipeline/.cache, ≈1,3 Go)
npm run data -- salaire-logement --clean-cache   # vide le cache et retélécharge tout
```

Chaque exécution régénère [`REPORT.md`](REPORT.md) : la provenance des prix par année, les contrôles effectués et des communes témoins. Le rapport est versionné, pour que le diff montre ce qu'une mise à jour des sources a changé.

## Sources et choix

Toutes les URL et tous les paramètres se trouvent dans [`sources.ts`](sources.ts).

**Prix : indicateurs DV3F du Cerema** (Licence Ouverte 2.0)
- Il s'agit de prix médians au m² déjà agrégés et nettoyés par un organisme public. On utilise les feuilles « Ensemble des maisons » (`cod111`, une maison) et « Ensemble des appartements » (`cod121`, un appartement).
- Tous les millésimes sont exprimés dans le **COG 2025**, ce qui règle le problème des fusions de communes à la source.
- Le Cerema masque les prix calculés sur moins de **11 ventes** (secret statistique). Le pipeline se replie alors, dans cet ordre : commune sur 3 ans → EPCI annuel → EPCI sur 3 ans. La provenance est conservée (`src`) pour que le front puisse signaler les estimations.
- **Non couverts par DVF** : Moselle (57), Bas-Rhin (67), Haut-Rhin (68) et Mayotte (976). Ces territoires sont listés dans `uncoveredDepartements`.
- Les fichiers sont hébergés sur un partage Box public. Leurs identifiants sont résolus par leur nom à chaque exécution, et la taille annoncée par Box sert de contrôle d'intégrité.

**Taux : BCE, série `MIR.M.FR.B.A2C.A.R.A.2250.EUR.N`**
- Il s'agit de la même collecte que celle de la Banque de France, mais accessible sans clé d'API.
- Limite connue : la série **inclut les renégociations**. Le taux affiché est donc légèrement sous-estimé lors des vagues de renégociation (2015-2017, 2019-2020).

**Contours : Etalab, 2025, généralisation à 100 m**
- Paris, Lyon et Marseille sont découpés en arrondissements (les communes « parents » sont retirées pour éviter les superpositions).
- Les collectivités du Pacifique, Saint-Pierre-et-Miquelon, Saint-Barthélemy et Saint-Martin sont exclues : elles sont hors DVF et hors carte.

## Limites connues

- **Estimations fréquentes pour les maisons en zone rurale.** Selon l'année, 35 à 50 % des communes n'ont un prix qu'à l'échelle de leur EPCI, qui peut être tiré vers le haut par la ville-centre. Le front doit l'afficher (`src`).
- **Appartements : environ 27 % des communes n'ont aucun prix.** C'est le cas quand l'EPCI entier n'a pas de marché d'appartements. Le front doit présenter ces communes comme « pas de marché », pas comme « pas de données ».
- **Deux EPCI de l'Aveyron** (`241200658` et `241200765`, 19 communes) ont un code qui diffère entre les contours 2025 et les fichiers du Cerema. Ces communes perdent le repli EPCI.
- **111 valeurs écartées** par le contrôle de plausibilité. Ce sont des erreurs de la source, par exemple 17 €/m² pour des maisons en Martinique en 2010.

## Mettre à jour vers un nouveau millésime

1. Dans `sources.ts`, ajuster `LAST_YEAR` (et `CONTOURS.url` si le COG change).
2. `npm run data -- salaire-logement`. Si un fichier manque sur Box, le pipeline échoue en listant exactement lequel.
3. Relire le diff de `REPORT.md`.
