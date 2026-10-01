# Atlas

Des visualisations de données publiques, chacune avec sa méthode et ses limites expliquées.
En ligne : **https://klem88.github.io/atlas/**

- Intention, réserve d'idées, méthode : [docs/IDEES.md](docs/IDEES.md)
- Règles de design communes : [docs/DESIGN.md](docs/DESIGN.md)

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests unitaires (Vitest)
npm run build      # vérification des types + build statique dans dist/
```

Le site est 100 % statique. Il est publié sur GitHub Pages par [.github/workflows/deploy.yml](.github/workflows/deploy.yml) à chaque push sur `main` : tests, puis build avec la base `/<dépôt>/`. L'URL publique utilisée dans les balises de partage est définie dans [.env](.env) (`VITE_SITE_URL`).

## Ajouter une visualisation

```bash
npm run new:viz -- sous-tes-pieds --title "Sous tes pieds" --summary "La roche sous ta maison." --tags "Géologie,France"
```

La commande :
1. copie [`viz/_template/`](viz/_template/) dans `viz/sous-tes-pieds/`, en remplissant le titre, le résumé et les thèmes ;
2. l'inscrit au catalogue ([`src/shell/site.ts`](src/shell/site.ts)) en **brouillon**, visible sur l'accueil en développement seulement ;
3. Vite détecte la nouvelle page tout seul, rien d'autre à déclarer.

La liste des étapes avant publication se trouve dans le `README.md` créé dans le dossier de la visualisation. Pour publier : passer `status` à `'published'`, puis pousser sur `main`.

## Structure

```
index.html                  page d'accueil (catalogue)
src/home.ts
src/shell/                  socle partagé par toutes les visualisations
  tokens.css                jetons de design : couleurs (clair/sombre), typo, espacements
  base.css, page.css        typographie de base et gabarit de page (intro, panneau, scène, notes)
  components.css            champs, contrôle segmenté, boutons, infobulle, fenêtre, panneau dépliable
  catalog.css               cartes du catalogue
  charts/                   petits graphiques réutilisables (ligne)
  music/                    hauteurs, accordages, synthèse Web Audio, clavier jouable
  share.ts                  fenêtre « Partager » (image, partage natif, lien)
  search.ts                 recherche avec suggestions (combobox accessible)
  store.ts                  état réactif minimal
  format.ts, html.ts        formats français, échappement, normalisation
  site.ts                   nom du site, catalogue (brouillon/publié), URL relatives à la base
tools/                      outils Node communs
  new-viz.ts                crée une visualisation depuis le modèle
  viz-task.ts               lance les tâches par convention (data, og)
  og.ts                     polices, couleurs et écriture des images d'aperçu
  lib/                      téléchargement avec cache, journalisation, corpus d'accords et leur tokenisation
viz/_template/              modèle de visualisation (ignoré au build)
viz/<slug>/                 une visualisation = un dossier autonome
  index.html, main.ts       la page et son point d'entrée
  viz.css                   styles propres (dérivés des jetons)
  data/                     contrat des données + validation
  domain/                   calculs purs et testés
  map/, ui/                 rendu et interface
  pipeline/build.ts         sources publiques → public/data/<slug>/   (npm run data -- <slug>)
  og/build-og.ts            image d'aperçu → public/og/<slug>.png     (npm run og -- <slug>)
public/data/<slug>/         données statiques produites par le pipeline (versionnées)
public/og/<slug>.png        images d'aperçu des liens
docs/                       idées, design
```

## Visualisations

| Visualisation | Statut | Données |
|---|---|---|
| [Ce que ton salaire achète](viz/salaire-logement/) | publiée | [pipeline](viz/salaire-logement/pipeline/README.md) · [rapport qualité](viz/salaire-logement/pipeline/REPORT.md) |
| [Qui chante autour de chez toi](viz/qui-chante/) | publiée | [rapport qualité](viz/qui-chante/pipeline/REPORT.md) |
| [Pourquoi ton piano est (légèrement) faux](viz/piano-temperament/) | publiée | aucune donnée, tout est calculé |
| [La forme d’un accord](viz/forme-accord/) | publiée | aucune donnée, three.js |
| [Pourquoi une tierce sonne douce](viz/consonance/) | publiée | aucune donnée, modèle de Plomp–Levelt |
| [La gamme qui monte sans fin](viz/gamme-sans-fin/) | publiée | aucune donnée, three.js |
| [Ce qu’une seule note contient](viz/une-seule-note/) | publiée | aucune donnée, série harmonique |
| [Ta progression a déjà été jouée 40 000 fois](viz/progression-jouee/) | publiée | [rapport qualité](viz/progression-jouee/pipeline/REPORT.md) · Chordonomicon, iRb, McGill Billboard |
| [Le fleuve des enchaînements](viz/fleuve-des-accords/) | publiée | [rapport qualité](viz/fleuve-des-accords/pipeline/REPORT.md) · mêmes corpus |
| [Le voyage sur le tore](viz/voyage-sur-le-tore/) | publiée | [rapport qualité](viz/voyage-sur-le-tore/pipeline/REPORT.md) · iRb, Billboard, three.js |
| [La boussole des styles](viz/carte-des-styles/) | publiée | [rapport qualité](viz/carte-des-styles/pipeline/REPORT.md) · [sonde](viz/carte-des-styles/pipeline/PROBE.md) |
| [Cinquante ans de refrains](viz/cinquante-ans-de-refrains/) | publiée | [rapport qualité](viz/cinquante-ans-de-refrains/pipeline/REPORT.md) · Chordonomicon, Billboard |
| [Où le solo respire](viz/ou-le-solo-respire/) | publiée | [rapport qualité](viz/ou-le-solo-respire/pipeline/REPORT.md) · Weimar Jazz Database |
