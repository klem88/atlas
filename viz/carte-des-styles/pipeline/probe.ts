/**
 * Sonde de faisabilité de la carte : les styles forment-ils des continents lisibles ?
 *
 *   npx tsx viz/carte-des-styles/pipeline/probe.ts
 *
 * Échantillon stratifié (jusqu'à 2 500 tablatures par genre, plus l'iRb et le Billboard), vecteurs de transitions,
 * ACP à dix composantes, puis silhouette par style et précision des plus proches voisins, en 2 et 10 dimensions.
 * Écrit `pipeline/PROBE.md`. Critère de la fiche : silhouette par style > 0,2 pour faire une carte.
 */
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseChord } from '@shell/music/chords';
import { tokensOf } from '@shell/music/degrees';
import { GENRES, knownKey, loadChordonomiconDegrees, packSections } from '@tools/lib/degrees-corpus';
import { loadNamedSongs } from '@tools/lib/named-songs';
import { log } from '@tools/lib/log';
import { knnAccuracy, pca, project, silhouette, songVector } from './vectors';

const PER_GENRE = 2500;
const PER_STYLE_EVAL = 200;

export async function probe(): Promise<string> {
  log.step('Échantillon');
  const degrees = await loadChordonomiconDegrees();
  const labels: string[] = [...GENRES, 'irb', 'billboard'];
  const rows: Float32Array[] = [];
  const rowLabel: number[] = [];
  const counts = new Array<number>(labels.length).fill(0);
  let seed = 42;
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  // Réservoir simple : on parcourt tout, on garde au plus PER_GENRE par genre (tirage aléatoire déterministe).
  const buckets: Float32Array[][] = labels.map(() => []);
  const seen = new Array<number>(labels.length).fill(0);
  for (const s of degrees.songs) {
    if (s.genre < 0) continue;
    const v = songVector(s.tokens);
    if (!v) continue;
    const b = buckets[s.genre]!;
    seen[s.genre]!++;
    if (b.length < PER_GENRE) b.push(v);
    else {
      const j = Math.floor(rand() * seen[s.genre]!);
      if (j < PER_GENRE) b[j] = v;
    }
  }
  const { irb, billboard } = await loadNamedSongs();
  for (const [key, songs] of [
    ['irb', irb],
    ['billboard', billboard],
  ] as const) {
    const li = labels.indexOf(key);
    for (const song of songs) {
      const k = knownKey(song);
      if (!k) continue;
      const tokens = packSections(song.sections.map((sec) => tokensOf(sec.chords.map((c) => parseChord(c.symbol)), k.relativeMajor)).filter((t) => t.length));
      const v = songVector(tokens);
      if (v) buckets[li]!.push(v);
    }
  }
  buckets.forEach((b, li) => {
    for (const v of b) {
      rows.push(v);
      rowLabel.push(li);
    }
    counts[li] = b.length;
  });
  log.info(`${rows.length} morceaux : ${labels.map((l, i) => `${l} ${counts[i]}`).join(', ')}`);

  log.step('ACP (576 dimensions → 10)');
  const t0 = Date.now();
  const p = pca(rows, 10);
  const explained = p.variances.map((v) => v / p.totalVariance);
  log.info(`variance expliquée : ${explained.map((e) => `${(100 * e).toFixed(1)} %`).join(', ')} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);

  log.step('Séparation des styles');
  // Sous-échantillon d'évaluation : PER_STYLE_EVAL par style.
  const evalIdx: number[] = [];
  const taken = new Array<number>(labels.length).fill(0);
  const order = rows.map((_, i) => i).sort(() => rand() - 0.5);
  for (const i of order) {
    const l = rowLabel[i]!;
    if (taken[l]! < PER_STYLE_EVAL) {
      taken[l]!++;
      evalIdx.push(i);
    }
  }
  const evalLabels = evalIdx.map((i) => rowLabel[i]!);
  const results: { space: string; silhouette: number; byStyle: Map<number, number>; knn: number }[] = [];
  for (const k of [2, 10]) {
    const pts = evalIdx.map((i) => project(p, rows[i]!, k));
    const s = silhouette(pts, evalLabels);
    results.push({ space: `ACP ${k}D`, silhouette: s.overall, byStyle: s.byLabel, knn: knnAccuracy(pts, evalLabels, 10) });
  }
  // Et dans l'espace complet (576 D), pour savoir si c'est la réduction ou la donnée qui mélange.
  {
    const pts = evalIdx.map((i) => Array.from(rows[i]!));
    const s = silhouette(pts, evalLabels);
    results.push({ space: '576D (sans réduction)', silhouette: s.overall, byStyle: s.byLabel, knn: knnAccuracy(pts, evalLabels, 10) });
  }
  // Jazz (iRb) contre le reste : le cas le plus favorable.
  {
    const pts = evalIdx.map((i) => project(p, rows[i]!, 10));
    const bin = evalLabels.map((l) => (labels[l] === 'irb' ? 1 : 0));
    const s = silhouette(pts, bin);
    results.push({ space: 'ACP 10D, iRb contre tout le reste', silhouette: s.overall, byStyle: s.byLabel, knn: knnAccuracy(pts, bin, 10) });
  }
  for (const r of results) log.info(`${r.space} : silhouette ${r.silhouette.toFixed(3)}, kNN ${(100 * r.knn).toFixed(1)} %`);

  const L: string[] = [];
  L.push('# Sonde de faisabilité : la carte des styles', '');
  L.push(`Faite le ${new Date().toISOString().slice(0, 10)}. Question : placés selon leurs transitions entre degrés, les morceaux se regroupent-ils par style assez nettement pour dessiner des continents ?`, '');
  L.push('## Méthode', '');
  L.push(`- Échantillon : jusqu’à ${PER_GENRE} tablatures par genre principal (tirage déterministe), plus les standards de l’iRb et les titres du Billboard ; morceaux d’au moins 8 transitions. ${rows.length} vecteurs.`);
  L.push('- Vecteur : fréquences des 576 transitions possibles entre 24 classes (degré × majeur/mineur), en racine carrée (Hellinger).');
  L.push(`- ACP maison à dix composantes ; variance expliquée : ${explained.map((e) => `${(100 * e).toFixed(1)} %`).join(', ')} (cumul ${(100 * explained.reduce((a, b) => a + b, 0)).toFixed(1)} %).`);
  L.push(`- Séparation mesurée sur ${PER_STYLE_EVAL} morceaux par style : silhouette moyenne par étiquette (1 = amas nets, 0 = mélange, < 0 = mal classé) et précision des dix plus proches voisins (hasard : ${(100 / labels.length).toFixed(0)} %).`, '');
  L.push('## Résultats', '', '| Espace | Silhouette | kNN (10) |', '| --- | --: | --: |');
  for (const r of results) L.push(`| ${r.space} | ${r.silhouette.toFixed(3)} | ${(100 * r.knn).toFixed(1)} % |`);
  L.push('', '### Silhouette par style (ACP 10D)', '', '| Style | Silhouette | Effectif |', '| --- | --: | --: |');
  const ten = results[1]!;
  labels.forEach((l, i) => L.push(`| ${l} | ${(ten.byStyle.get(i) ?? 0).toFixed(3)} | ${counts[i]} |`));
  const best = Math.max(...results.slice(0, 3).map((r) => r.silhouette));
  L.push('', '## Décision', '');
  if (best > 0.2) L.push(`La silhouette atteint ${best.toFixed(2)} : au-dessus du seuil de 0,2 fixé par la fiche. **La carte est faisable** ; passer à la réduction en 2D (UMAP ou t-SNE dans le pipeline, graine fixée).`);
  else {
    const irbSil = ten.byStyle.get(labels.indexOf('irb')) ?? 0;
    L.push(`La meilleure silhouette d’ensemble est ${best.toFixed(2)}, sous le seuil de 0,2 fixé par la fiche : les genres des tablatures se recouvrent trop pour former des continents lisibles (la précision des voisins, ${(100 * results[1]!.knn).toFixed(0)} % contre ${(100 / labels.length).toFixed(0)} % au hasard, dit qu’il y a un signal, mais pas des îles). Une exception : les standards de jazz de l’iRb ont une silhouette de ${irbSil.toFixed(2)} : eux forment bien une île, le reste est un seul continent sans frontières. **On abandonne la carte** et on construit le repli prévu, « la boussole des styles » : pour chaque style, ses transitions signatures en petits multiples, et pour un morceau, le style auquel il ressemble le plus.`);
  }
  return L.join('\n');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  probe()
    .then(async (md) => {
      const out = join(import.meta.dirname, 'PROBE.md');
      await writeFile(out, md);
      log.step(`Écrit ${out}`);
    })
    .catch((e: unknown) => {
      console.error(e);
      process.exitCode = 1;
    });
}
