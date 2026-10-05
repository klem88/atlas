/**
 * Crée une nouvelle visualisation à partir de viz/_template et l'inscrit au catalogue en brouillon.
 *
 *   npm run new:viz -- sous-tes-pieds --title "Sous tes pieds" --summary "La roche sous ta maison." --tags "Géologie,France"
 *
 * Avec `--exercice`, crée un exercice au piano depuis viz/_exercice (rubrique « Exercices au piano » de l'accueil) :
 *
 *   npm run new:viz -- valse-triste --exercice --title "Valse triste" --tags "Piano,Harmonie,Exercice"
 *
 * Seul le slug est obligatoire ; les textes se corrigent ensuite dans les fichiers créés.
 */
import { cp, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';

const ROOT = join(import.meta.dirname, '..');
const TEMPLATE = join(ROOT, 'viz', '_template');
const EXERCISE_TEMPLATE = join(ROOT, 'viz', '_exercice');
const SITE_FILE = join(ROOT, 'src', 'shell', 'site.ts');
const CATALOG_MARKER = '  // npm run new:viz ajoute ici';

export interface VizInfo {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  /** Exercice au piano plutôt que visualisation. */
  exercise?: boolean;
}

export function assertValidSlug(slug: string): void {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`Slug invalide « ${slug} » : minuscules, chiffres et tirets uniquement (ex. « sous-tes-pieds »).`);
  }
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const escapeJsString = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

/** Remplace les marqueurs __SLUG__, __TITLE__, __SUMMARY__, __TAGS__ avec l'échappement adapté au type de fichier. */
export function fillPlaceholders(content: string, info: VizInfo, ext: string): string {
  const escape = ext === '.html' ? escapeHtml : ext === '.ts' ? escapeJsString : (s: string) => s;
  const values: Record<string, string> = {
    __SLUG__: info.slug,
    __TITLE__: info.title,
    __SUMMARY__: info.summary,
    __TAGS__: info.tags.join(' · '),
  };
  return content.replace(/__(SLUG|TITLE|SUMMARY|TAGS)__/g, (m) => escape(values[m]!));
}

/** Ajoute l'entrée au catalogue (statut brouillon), juste avant le marqueur prévu dans site.ts. */
export function insertCatalogEntry(siteSource: string, info: VizInfo, month: string): string {
  if (!siteSource.includes(CATALOG_MARKER)) throw new Error(`Marqueur introuvable dans site.ts : « ${CATALOG_MARKER.trim()} »`);
  if (siteSource.includes(`slug: '${info.slug}'`)) throw new Error(`« ${info.slug} » est déjà au catalogue.`);
  const q = (s: string) => `'${escapeJsString(s)}'`;
  const entry = [
    '  {',
    `    slug: ${q(info.slug)},`,
    `    title: ${q(info.title)},`,
    `    summary: ${q(info.summary)},`,
    `    tags: [${info.tags.map(q).join(', ')}],`,
    `    status: 'draft',`,
    `    published: ${q(month)},`,
    ...(info.exercise ? [`    kind: 'exercice',`] : []),
    '  },',
  ].join('\n');
  return siteSource.replace(CATALOG_MARKER, `${entry}\n${CATALOG_MARKER}`);
}

async function listFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    if ((await stat(p)).isDirectory()) out.push(...(await listFiles(p)));
    else out.push(p);
  }
  return out;
}

async function main(argv: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { title: { type: 'string' }, summary: { type: 'string' }, tags: { type: 'string' }, exercice: { type: 'boolean' } },
  });
  const slug = positionals[0];
  if (!slug) throw new Error('Usage : npm run new:viz -- <slug> [--title "…"] [--summary "…"] [--tags "A,B"]');
  assertValidSlug(slug);

  const target = join(ROOT, 'viz', slug);
  if (existsSync(target)) throw new Error(`viz/${slug} existe déjà.`);

  const info: VizInfo = {
    slug,
    title: values.title ?? slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()),
    summary: values.summary ?? 'À écrire : une phrase qui dit ce que montre la visualisation.',
    tags: (values.tags ?? (values.exercice ? 'Piano,Exercice' : 'À classer')).split(',').map((t) => t.trim()).filter(Boolean),
    exercise: values.exercice ?? false,
  };

  await cp(info.exercise ? EXERCISE_TEMPLATE : TEMPLATE, target, { recursive: true });
  for (const file of await listFiles(target)) {
    await writeFile(file, fillPlaceholders(await readFile(file, 'utf8'), info, extname(file)));
  }
  const month = new Date().toISOString().slice(0, 7);
  await writeFile(SITE_FILE, insertCatalogEntry(await readFile(SITE_FILE, 'utf8'), info, month));

  console.log(`✓ viz/${slug}/ créé et inscrit au catalogue (brouillon).
  Page         : http://localhost:5173/viz/${slug}/  (npm run dev)
  À faire      : viz/${slug}/README.md
  Publication  : passer status à 'published' dans src/shell/site.ts`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main(process.argv.slice(2)).catch((err: unknown) => {
    console.error(`\n✖ ${(err as Error).message}`);
    process.exitCode = 1;
  });
}
