import { describe, expect, it } from 'vitest';
import { VISUALIZATIONS, listedVisualizations, type VizEntry } from './site';

const entry = (slug: string, status: VizEntry['status'], published: string): VizEntry => ({
  slug,
  title: slug,
  summary: '',
  tags: [],
  status,
  published,
});

describe('listedVisualizations', () => {
  const all = [entry('a', 'published', '2026-01'), entry('b', 'draft', '2026-05'), entry('c', 'published', '2026-03')];

  it('masque les brouillons en production', () => {
    expect(listedVisualizations(false, all).map((v) => v.slug)).toEqual(['c', 'a']);
  });

  it('les montre en développement, la plus récente d’abord', () => {
    expect(listedVisualizations(true, all).map((v) => v.slug)).toEqual(['b', 'c', 'a']);
  });
});

describe('catalogue', () => {
  it('a des slugs uniques au format dossier', () => {
    const slugs = VISUALIZATIONS.map((v) => v.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});
