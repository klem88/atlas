# Atlas — contexte pour les sessions de travail

Site de visualisations de données publiques françaises, publié sur **https://klem88.github.io/atlas/** (dépôt `klem88/atlas`, GitHub Pages, déploiement automatique à chaque push sur `main`).

À lire avant de proposer ou de construire quoi que ce soit :
- [docs/IDEES.md](docs/IDEES.md) : l'intention (des « feux » viraux, informatifs, jamais catastrophistes), le profil de l'auteur et la réserve d'idées notées.
- [docs/DESIGN.md](docs/DESIGN.md) : les règles visuelles communes (palette ardoise, un seul accent, Spectral + Atkinson, transparence).
- [README.md](README.md) : la structure du dépôt et les commandes.

## Conventions

- **Langue** : interface, textes, commentaires de code et messages de commit en français. Tutoiement dans l'interface.
- **Stack** : Vite + TypeScript strict, **sans framework**. D3 en modules séparés (`d3-geo`, `d3-zoom`…), three.js prévu pour les visualisations 3D. Canvas pour les grands volumes (plus de quelques milliers de formes).
- **Une visualisation = un dossier `viz/<slug>/`** : `index.html`, `main.ts`, `viz.css`, `data/` (contrat et validation), `domain/` (calculs purs et testés), `pipeline/build.ts` (sources vers `public/data/<slug>/`), `og/build-og.ts` (image d'aperçu).
- **Commencer une visualisation** avec `npm run new:viz -- <slug> --title "…" --summary "…" --tags "A,B"`. Elle arrive en brouillon (visible sur l'accueil en développement seulement). Pour la publier, passer `status` à `published` dans `src/shell/site.ts`.
- **Socle commun** : `src/shell/` (jetons de design, gabarit, composants, recherche, graphique en ligne, formats français). Si un composant peut servir à deux visualisations, il va dans le socle.
- **Outils Node communs** : `tools/` (téléchargement avec cache, journalisation, génération des images d'aperçu, création de visualisation, exécution des tâches).
- **Données** : 100 % statiques, versionnées dans `public/data/<slug>/`. La CI ne relance pas les pipelines. Chaque pipeline écrit un rapport qualité versionné (`REPORT.md`).
- **Chemins publics** : toujours via `assetUrl()` / `vizUrl()` (`src/shell/site.ts`) ou `%BASE_URL%` en HTML, car le site est servi sous `/atlas/`.
- **Qualité** : `npm test` et `npm run typecheck` au vert avant chaque commit. Vérifier l'affichage en clair, en sombre et sur mobile (375 px) avant de publier.

## Commandes

```bash
npm run dev                          # http://localhost:5173
npm test                             # Vitest
npm run build                        # types + build statique (dist/)
npm run new:viz -- <slug> [...]      # nouvelle visualisation depuis viz/_template
npm run data -- <slug> [--clean-cache]  # pipeline de données d'une visualisation
npm run og -- <slug>                 # image d'aperçu des liens
```

Sous Git Bash (Windows), préfixer `MSYS_NO_PATHCONV=1` pour tester localement un build avec `BASE_PATH=/atlas/`.

## Prochaines étapes identifiées

1. « Ce que ton salaire achète » : **carte d'abord sur mobile** (réglages ensuite ou repliés).
2. Choisir la deuxième visualisation dans la réserve : *Sous tes pieds* ou *Qui chante autour de chez toi* (voir docs/IDEES.md).
3. Décider d'un point de ralliement pour l'audience (newsletter, compte), et de l'éventuel nom définitif du site (aujourd'hui « Atlas », modifiable dans `src/shell/site.ts`).
