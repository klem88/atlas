import { writeFile } from 'node:fs/promises';
import { PROPERTY_TYPES, PriceSource, priceIndex, type PricesFile, type RatesFile } from '../src/data/contract';

export interface Report {
  generatedAt: string;
  communes: number;
  years: number[];
  /** `${type}|${year}|${src}` → nombre de communes. */
  bySource: Map<string, number>;
  outliers: number;
  epciJoinMisses: number;
  prices: PricesFile;
  rates: RatesFile;
}

const SOURCE_LABELS: Record<PriceSource, string> = {
  [PriceSource.CommuneAnnual]: 'Commune, annuel',
  [PriceSource.CommuneTriennial]: 'Commune, 3 ans',
  [PriceSource.EpciAnnual]: 'EPCI, annuel',
  [PriceSource.EpciTriennial]: 'EPCI, 3 ans',
  [PriceSource.None]: 'Aucune',
};

/** Communes témoins, pour vérifier les ordres de grandeur à l'œil. */
const SAMPLES: [string, string][] = [
  ['75111', 'Paris 11e'],
  ['69383', 'Lyon 3e'],
  ['13201', 'Marseille 1er'],
  ['44109', 'Nantes'],
  ['33063', 'Bordeaux'],
  ['31555', 'Toulouse'],
  ['59350', 'Lille'],
  ['23096', 'Guéret'],
  ['97411', 'Saint-Denis (Réunion)'],
  ['23001', 'Ahun (petite commune)'],
];

const pct = (n: number, total: number) => `${((100 * n) / total).toFixed(1)} %`;

export async function writeReport(path: string, r: Report): Promise<void> {
  const lines: string[] = [];
  const first = r.years[0]!;
  const last = r.years.at(-1)!;

  lines.push(
    '# Rapport qualité des données',
    '',
    `Généré le ${r.generatedAt} — ${r.communes} communes, ${first} → ${last}.`,
    '',
    '> Fichier régénéré à chaque `npm run data`. Le versionner permet de voir, dans le diff, ce qu’une mise à jour des sources a changé.',
    '',
    '## Contrôles',
    '',
    `- Valeurs écartées car hors bornes de plausibilité : **${r.outliers}**`,
    `- Communes dont l’EPCI est introuvable dans les fichiers Cerema : **${r.epciJoinMisses}**`,
    `- Départements sans données (hors DVF) : ${r.prices.uncoveredDepartements.join(', ')}`,
    '',
  );

  for (const type of PROPERTY_TYPES) {
    const sources = [PriceSource.CommuneAnnual, PriceSource.CommuneTriennial, PriceSource.EpciAnnual, PriceSource.EpciTriennial, PriceSource.None];
    lines.push(`## Provenance des prix — ${type}`, '', `| Année | ${sources.map((s) => SOURCE_LABELS[s]).join(' | ')} |`, `|---|${sources.map(() => '---:').join('|')}|`);
    for (const year of r.years) {
      const cells = sources.map((s) => pct(r.bySource.get(`${type}|${year}|${s}`) ?? 0, r.communes));
      lines.push(`| ${year} | ${cells.join(' | ')} |`);
    }
    lines.push('');
  }

  lines.push('## Communes témoins (prix médian €/m²)', '', `| Commune | Maison ${first} | Maison ${last} | Appart. ${first} | Appart. ${last} |`, '|---|---:|---:|---:|---:|');
  const fmt = (code: string, type: (typeof PROPERTY_TYPES)[number], year: number) => {
    const ci = r.prices.codes.indexOf(code);
    if (ci < 0) return 'absente';
    const i = priceIndex(r.prices, ci, r.years.indexOf(year));
    const s = r.prices.series[type];
    const px = s.pxm2[i] ?? null;
    return px === null ? '—' : `${px.toLocaleString('fr-FR')} (${SOURCE_LABELS[s.src[i]!]}, n=${s.n[i]})`;
  };
  for (const [code, label] of SAMPLES) {
    lines.push(`| ${label} | ${fmt(code, 'maison', first)} | ${fmt(code, 'maison', last)} | ${fmt(code, 'appartement', first)} | ${fmt(code, 'appartement', last)} |`);
  }

  lines.push('', '## Taux moyens annuels (%)', '', `Source : ${r.rates.source}`, '', '| Année | Taux |', '|---|---:|');
  for (const [year, rate] of Object.entries(r.rates.annual)) lines.push(`| ${year} | ${rate.toFixed(2)} |`);

  await writeFile(path, lines.join('\n') + '\n');
}
