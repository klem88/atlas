import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertValidSlug, fillPlaceholders, insertCatalogEntry, type VizInfo } from './new-viz';
import { vizWithTask } from './viz-task';

const info: VizInfo = { slug: 'sous-tes-pieds', title: 'Sous « tes » pieds', summary: 'L’argile & la roche', tags: ['Géologie', 'France'] };

describe('assertValidSlug', () => {
  it('accepte un slug en kebab-case', () => {
    expect(() => assertValidSlug('sous-tes-pieds')).not.toThrow();
  });

  it('refuse majuscules, espaces, accents et tirets en bord', () => {
    for (const bad of ['Sous', 'sous tes', 'pieds-é', '-a', 'a-']) expect(() => assertValidSlug(bad)).toThrow();
  });
});

describe('fillPlaceholders', () => {
  it('échappe selon le type de fichier', () => {
    expect(fillPlaceholders('<h1>__TITLE__</h1>', info, '.html')).toBe('<h1>Sous « tes » pieds</h1>');
    expect(fillPlaceholders('<p>__SUMMARY__</p>', info, '.html')).toBe('<p>L’argile &amp; la roche</p>');
    expect(fillPlaceholders("x('__SLUG__')", info, '.ts')).toBe("x('sous-tes-pieds')");
    expect(fillPlaceholders('__TAGS__', info, '.md')).toBe('Géologie · France');
  });

  it('échappe les apostrophes droites dans le code', () => {
    expect(fillPlaceholders("'__TITLE__'", { ...info, title: "L'eau" }, '.ts')).toBe("'L\\'eau'");
  });
});

describe('insertCatalogEntry', () => {
  const site = readFileSync(join(import.meta.dirname, '..', 'src', 'shell', 'site.ts'), 'utf8');

  it('ajoute une entrée en brouillon avant le marqueur, sans toucher au reste', () => {
    const out = insertCatalogEntry(site, info, '2026-11');
    expect(out).toContain("slug: 'sous-tes-pieds',");
    expect(out).toContain("status: 'draft',");
    expect(out.indexOf("slug: 'sous-tes-pieds'")).toBeLessThan(out.indexOf('// npm run new:viz'));
    expect(out.replace(/ {2}\{\n {4}slug: 'sous-tes-pieds'[\s\S]*?\n {2}\},\n/, '')).toBe(site);
  });

  it('marque un exercice au piano', () => {
    const out = insertCatalogEntry(site, { ...info, exercise: true }, '2026-11');
    expect(out).toMatch(/slug: 'sous-tes-pieds',[\s\S]*?kind: 'exercice',\n {2}\},/);
    const viz = insertCatalogEntry(site, info, '2026-11');
    expect(viz.match(/ {2}\{\n {4}slug: 'sous-tes-pieds'[\s\S]*?\n {2}\},\n/)![0]).not.toContain('kind:');
  });

  it('refuse un doublon', () => {
    expect(() => insertCatalogEntry(site, { ...info, slug: 'salaire-logement' }, '2026-11')).toThrow(/déjà/);
  });
});

describe('vizWithTask', () => {
  it('trouve les tâches par convention de dossier et ignore le modèle', () => {
    expect(vizWithTask('data')).toContain('salaire-logement');
    expect(vizWithTask('og')).toContain('salaire-logement');
    expect(vizWithTask('og')).not.toContain('_template');
  });
});
