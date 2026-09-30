import mapshaper from 'mapshaper';
import { CONTOURS } from '../sources';

export interface CommuneFeature {
  type: 'Feature';
  properties: { code: string; nom: string; departement: string; epci: string | null };
  geometry: unknown;
}

interface FeatureCollection {
  type: 'FeatureCollection';
  features: CommuneFeature[];
}

/** Garde les communes du périmètre de la carte (métropole + DROM), sans doublon Paris/Lyon/Marseille. */
export function filterCommunes(fc: FeatureCollection): CommuneFeature[] {
  const parents = new Set<string>(CONTOURS.plmParents);
  return fc.features.filter(({ properties: { code } }) => {
    if (parents.has(code)) return false;
    return !CONTOURS.excludedPrefixes.some((p) => code.startsWith(p));
  });
}

/**
 * Produit un TopoJSON à deux couches :
 * - `communes` (propriétés : code, nom) pour le remplissage ;
 * - `departements` (dissous) pour le tracé des limites.
 * Le TopoJSON partage les arcs entre communes voisines : ~3× plus léger que le GeoJSON.
 */
export async function buildTopology(features: CommuneFeature[]): Promise<string> {
  const input = { 'communes.json': JSON.stringify({ type: 'FeatureCollection', features }) };
  const cmd = [
    '-i communes.json name=communes',
    `-simplify ${CONTOURS.simplify} keep-shapes`,
    '-dissolve departement + name=departements',
    '-target communes',
    '-filter-fields code,nom',
    `-o target=communes,departements format=topojson quantization=${CONTOURS.quantization} out.topo.json`,
  ].join(' ');
  const output = (await mapshaper.applyCommands(cmd, input)) as Record<string, string | Buffer>;
  const topo = output['out.topo.json'];
  if (!topo) throw new Error('mapshaper : sortie TopoJSON absente');
  return topo.toString();
}
