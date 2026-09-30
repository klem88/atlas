# Principes de design

Toutes les visualisations d'Atlas partagent ces règles, pour que le site se reconnaisse d'une page à l'autre. Les valeurs concrètes vivent dans [`src/shell/tokens.css`](../src/shell/tokens.css) : on ne code jamais une couleur ou une taille en dur ailleurs.

## Intention

Élégant, fin, très lisible, très fonctionnel. **Le plus d'explications et de transparence possible.** Pas de couleurs vives, sauf pour désigner quelque chose de précis.

## Couleurs

- **Rampe « ardoise »** : un bleu-gris désaturé (OKLCH, teinte ≈ 245), qui évoque les toits. Sept pas `--seq-0` à `--seq-6`, du clair au foncé. La luminosité est monotone et chaque pas contraste de 1,3 à 1,5:1 avec le précédent.
- **Encre de la même teinte** que la rampe : l'ensemble reste calme.
- **Un seul accent chaud** (`--accent`, orange) : la sélection, le « vous », la comparaison qui compte. Jamais décoratif.
- **Mode sombre choisi, pas inversé** : sa propre rampe, où « plus » reste le plus contrasté (le plus clair sur fond sombre).
- Grandeur → une seule teinte, du clair au foncé. Jamais d'arc-en-ciel. Pour une polarité (au-dessus / en dessous d'un seuil) : deux teintes et un gris neutre au milieu.
- Le texte ne prend jamais la couleur d'une série : il reste en `--ink`, `--ink-2` ou `--ink-3`.

## Typographie

- **Spectral** (fonderie française Production Type, pensée pour l'écran) pour les titres et le texte éditorial, en graisses légères.
- **Atkinson Hyperlegible Next** (conçue pour la lisibilité maximale) pour l'interface et les nombres. Chiffres tabulaires seulement dans les colonnes à aligner.

## Mise en page

Gabarit commun ([`src/shell/page.css`](../src/shell/page.css)) :

```
en-tête du site
intro         surtitre · titre · chapeau
espace        panneau (réglages, résultat) | scène (la visualisation)
notes         sommaire | comment lire · méthode · sources · limites
pied de page
```

Chaque visualisation a un **élément signature**, et un seul. Pour « Ce que ton salaire achète », c'est la frise des années, qui est la courbe des taux.

## Graphiques

- Traits de 2 px, points d'au moins 8 px détourés de la couleur de fond, grille en filets discrets.
- Étiquettes directes et sélectives (le pic, la valeur actuelle), jamais un nombre sur chaque point.
- Classes à seuils fixes plutôt qu'échelle continue, pour qu'une couleur garde le même sens d'une année ou d'un réglage à l'autre.
- Les estimations sont signalées par une **texture discrète** (hachures à 45°), qui s'intensifie au zoom.
- Pas de double axe.

## Interaction

- Survol → infobulle ; clic ou recherche → sélection détaillée.
- L'état est reflété dans l'URL : un lien partagé redonne exactement la même vue.
- Sur mobile, en vue d'ensemble, un doigt fait défiler la page et deux doigts zooment ; une fois zoomé, un doigt déplace la carte (le bouton « vue d'ensemble » rend la page). Sur ordinateur, Ctrl + molette zoome.
- Clavier, focus visible, `prefers-reduced-motion` respecté.

## Textes

- Tutoiement, phrases courtes, verbes simples. On nomme ce que l'utilisateur voit, pas la technique.
- Chaque chiffre affirmé dans la page est vérifié (et recalculé si possible).
- Une erreur dit ce qui s'est passé et quoi faire, sans s'excuser.

## Partage

- Une image 1080×1350 générée dans le navigateur (chiffre, comparaison, vue courante, courbe), avec partage natif sur mobile.
- Une image d'aperçu 1200×630 générée depuis les vraies données (`npm run og -- <slug>`).
