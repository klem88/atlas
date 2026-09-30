# Atlas

Des visualisations de données publiques, chacune avec sa méthode et ses limites expliquées.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests unitaires (Vitest)
npm run build      # vérification des types + build statique dans dist/
```

Le site est 100 % statique. Il est publié sur GitHub Pages par [.github/workflows/deploy.yml](.github/workflows/deploy.yml) à chaque push sur `main` (tests, puis build avec la base `/<dépôt>/`).

L’URL publique utilisée dans les balises de partage est définie dans [.env](.env) (`VITE_SITE_URL`).

## Structure

```
index.html                  page d'accueil (catalogue)
src/shell/                  socle partagé par toutes les visualisations
  tokens.css                jetons de design : couleurs (clair/sombre), typo, espacements
  base.css, page.css        typographie de base et gabarit de page (intro, panneau, scène, notes)
  components.css            champs, contrôle segmenté, boutons, infobulle, panneau dépliable
  charts/                   petits graphiques réutilisables (ligne)
  search.ts, store.ts,      recherche avec suggestions, état réactif minimal,
  format.ts, html.ts        formats français, utilitaires
  site.ts                   nom du site et catalogue des visualisations
viz/<slug>/                 une visualisation = un dossier autonome
  index.html, main.ts       la page et son point d'entrée
  data/                     contrat des données + validation
  domain/                   calculs purs et testés
  map/, ui/                 rendu et interface
  pipeline/                 sources publiques → public/data/<slug>/
  og/                       image d’aperçu des liens → public/og/<slug>.png
public/data/<slug>/         données statiques produites par le pipeline
```

## Ajouter une visualisation

1. Créer `viz/<slug>/index.html` en reprenant le gabarit (`data-site-header`, `.viz-intro`, `.viz-workspace`, `.viz-notes`, `data-site-footer`).
2. Appeler `mountShell({ currentSlug: '<slug>' })` dans son `main.ts`.
3. Déclarer l'entrée dans `src/shell/site.ts` pour qu'elle apparaisse sur l'accueil.

Vite détecte automatiquement la nouvelle page au build.

## Visualisations

- [`salaire-logement`](viz/salaire-logement/) : ce que ton salaire achète, commune par commune, de 2010 à 2025. Données : [pipeline](viz/salaire-logement/pipeline/README.md).
