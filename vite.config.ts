import { readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const root = import.meta.dirname;

/**
 * Site multi-pages : la page d'accueil + une page par dossier `viz/<slug>/index.html`.
 * Ajouter une visualisation = créer son dossier, rien à déclarer ici.
 */
function pages(): Record<string, string> {
  const entries: Record<string, string> = { home: resolve(root, 'index.html') };
  for (const slug of readdirSync(join(root, 'viz'))) {
    const html = join(root, 'viz', slug, 'index.html');
    if (existsSync(html)) entries[slug] = html;
  }
  return entries;
}

export default defineConfig({
  // Base de déploiement : `/` en local, `/<dépôt>/` sur GitHub Pages (fournie par la CI).
  base: process.env.BASE_PATH ?? '/',
  resolve: {
    alias: { '@shell': resolve(root, 'src/shell') },
  },
  build: {
    target: 'es2022',
    rollupOptions: { input: pages() },
  },
  test: {
    include: ['{src,viz}/**/*.test.ts'],
  },
});
