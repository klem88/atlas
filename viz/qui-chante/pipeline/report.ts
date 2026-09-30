import { writeFile } from 'node:fs/promises';
import type { CommunesFile, SpeciesFile } from '../data/contract';
import type { Neighborhood } from '../domain/aggregate';
import { MIN_COUNT, NATIONAL_MIN, YEARS } from './sources';

export interface Report {
  generatedAt: string;
  minutes: number;
  communes: CommunesFile;
  species: SpeciesFile;
  neighborhoods: ReadonlyMap<number, Neighborhood>;
  indexOf: ReadonlyMap<number, number>;
  nationalTotal: number;
  queriedCells: number;
}

/** Communes témoins, de la grande ville au village peu parcouru. */
const SAMPLES: [string, string][] = [
  ['75056', 'Paris'],
  ['69123', 'Lyon'],
  ['13055', 'Marseille'],
  ['33063', 'Bordeaux'],
  ['80001', 'Abbeville (baie de Somme)'],
  ['21584', 'Saulieu (Morvan)'],
  ['48095', 'Mende (Lozère)'],
  ['2A004', 'Ajaccio'],
  ['23096', 'Guéret'],
  ['05061', 'Gap'],
];

const fmt = (n: number) => n.toLocaleString('fr');

function quantiles(values: number[]): string {
  const s = [...values].sort((a, b) => a - b);
  const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))]!;
  return `min ${fmt(s[0]!)} · 10 % ${fmt(q(0.1))} · médiane ${fmt(q(0.5))} · 90 % ${fmt(q(0.9))} · max ${fmt(s.at(-1)!)}`;
}

export async function writeReport(path: string, r: Report): Promise<void> {
  const cellOf = new Map(r.communes.codes.map((c, i) => [c, r.communes.cell[i]!]));
  const hoods = [...r.neighborhoods.values()];
  const lines: string[] = [
    '# Rapport qualité des données',
    '',
    `Généré le ${r.generatedAt} en ${r.minutes.toFixed(1)} min. Observations GBIF ${YEARS[0]} → ${YEARS[1]}, seuil de ${MIN_COUNT} observations par espèce dans le voisinage 3 × 3 et de ${NATIONAL_MIN} en France.`,
    '',
    '> Fichier régénéré à chaque `npm run data`. Le versionner permet de voir, dans le diff, ce qu’une mise à jour des sources a changé.',
    '',
    '## Volumes',
    '',
    `- ${fmt(r.communes.codes.length)} communes, ${fmt(r.neighborhoods.size)} mailles habitées, ${fmt(r.queriedCells)} mailles interrogées.`,
    `- ${fmt(r.nationalTotal)} observations d’oiseaux en France ; ${fmt(r.species.species.length)} espèces retenues dans au moins un voisinage.`,
    `- Espèces par voisinage : ${quantiles(hoods.map((h) => h.species.length))}.`,
    `- Observations par voisinage : ${quantiles(hoods.map((h) => h.total))}.`,
    `- Espèces sans nom français : ${r.species.species.filter((s) => s.french === s.scientific).map((s) => `*${s.scientific}*`).join(', ') || 'aucune'}.`,
    '',
    '## Communes témoins',
    '',
    '| Commune | Observations autour | Espèces | Les cinq plus observées |',
    '| --- | --: | --: | --- |',
  ];
  for (const [code, label] of SAMPLES) {
    const h = r.neighborhoods.get(cellOf.get(code) ?? -1);
    if (!h) {
      lines.push(`| ${label} | — | — | commune introuvable |`);
      continue;
    }
    const top = h.species.slice(0, 5).map((s) => r.species.species[r.indexOf.get(s.key)!]!.french);
    lines.push(`| ${label} | ${fmt(h.total)} | ${h.species.length} | ${top.join(', ')} |`);
  }
  lines.push(
    '',
    '## Espèces les plus observées en France',
    '',
    ...r.species.species.slice(0, 20).map((s, i) => `${i + 1}. ${s.french} (*${s.scientific}*) : ${fmt(s.national)}`),
    '',
  );
  await writeFile(path, lines.join('\n'));
}
