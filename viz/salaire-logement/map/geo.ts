import { geoConicConformal, geoMercator, geoPath, type GeoProjection } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import type { Feature, FeatureCollection, Geometry, MultiLineString } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';

export interface CommuneProps {
  code: string;
  nom: string;
}

export type CommuneFeature = Feature<Geometry, CommuneProps>;

export interface Territory {
  id: string;
  name: string;
  /** Vrai pour la métropole (Corse incluse). */
  main: boolean;
}

/** Métropole + DROM, dans l'ordre d'affichage des encarts. */
export const TERRITORIES: readonly Territory[] = [
  { id: 'metro', name: 'France métropolitaine', main: true },
  { id: '971', name: 'Guadeloupe', main: false },
  { id: '972', name: 'Martinique', main: false },
  { id: '973', name: 'Guyane', main: false },
  { id: '974', name: 'La Réunion', main: false },
  { id: '976', name: 'Mayotte', main: false },
];

export function territoryOf(code: string): string {
  return code.startsWith('97') ? code.slice(0, 3) : 'metro';
}

/** Code département d'une commune (2A/2B pour la Corse, 3 chiffres outre-mer). */
export function departementOf(code: string): string {
  return code.startsWith('97') ? code.slice(0, 3) : code.slice(0, 2);
}

export interface MapGeometry {
  communes: CommuneFeature[];
  /** Départements dissous, un par territoire, pour le cadrage. */
  departements: Feature<Geometry, { departement: string }>[];
  /** Limites départementales intérieures (sans doublons). */
  departementBorders: MultiLineString;
}

type Objects = { communes: GeometryCollection<CommuneProps>; departements: GeometryCollection<{ departement: string }> };

export function decodeTopology(topo: Topology<Objects>): MapGeometry {
  const communes = (feature(topo, topo.objects.communes) as FeatureCollection<Geometry, CommuneProps>).features;
  const departements = (feature(topo, topo.objects.departements) as FeatureCollection<Geometry, { departement: string }>).features;
  const departementBorders = mesh(topo, topo.objects.departements, (a, b) => a !== b);
  return { communes, departements, departementBorders };
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TerritoryLayout {
  territory: Territory;
  box: Box;
  projection: GeoProjection;
}

/**
 * Dispose la métropole et les encarts d'outre-mer dans un cadre W×H.
 * Paysage : encarts en colonne à gauche. Portrait : encarts en ligne en bas.
 */
export function layoutTerritories(width: number, height: number, geo: MapGeometry): TerritoryLayout[] {
  const pad = Math.max(8, Math.min(width, height) * 0.03);
  const insets = TERRITORIES.filter((t) => !t.main);
  const landscape = width / height >= 1.05;

  let mainBox: Box;
  const insetBoxes: Box[] = [];
  if (landscape) {
    const colW = Math.min(width * 0.14, 130);
    const cellH = (height - pad * 2) / insets.length;
    insets.forEach((_, i) => insetBoxes.push({ x: pad, y: pad + i * cellH, w: colW, h: cellH - pad * 0.6 }));
    mainBox = { x: pad * 2 + colW, y: pad, w: width - colW - pad * 3, h: height - pad * 2 };
  } else {
    const rowH = Math.min(height * 0.16, 110);
    const cellW = (width - pad * 2) / insets.length;
    insets.forEach((_, i) => insetBoxes.push({ x: pad + i * cellW, y: height - pad - rowH, w: cellW - pad * 0.6, h: rowH - 18 }));
    mainBox = { x: pad, y: pad, w: width - pad * 2, h: height - rowH - pad * 3 };
  }

  const shapesOf = (id: string): FeatureCollection => ({
    type: 'FeatureCollection',
    features: geo.departements.filter((d) => {
      const dep = d.properties.departement;
      return (dep.startsWith('97') ? dep : 'metro') === id;
    }),
  });

  const fit = (projection: GeoProjection, box: Box, id: string) =>
    projection.fitExtent(
      [
        [box.x, box.y],
        [box.x + box.w, box.y + box.h],
      ],
      shapesOf(id),
    );

  return TERRITORIES.map((territory) => {
    if (territory.main) {
      const projection = fit(geoConicConformal().parallels([44, 49]).rotate([-3, 0]), mainBox, 'metro');
      return { territory, box: mainBox, projection };
    }
    const box = insetBoxes[insets.indexOf(territory)]!;
    return { territory, box, projection: fit(geoMercator(), box, territory.id) };
  });
}

/** Construit un Path2D par commune, dans le repère du cadre (pixels CSS, zoom 1). */
export function buildPaths(communes: CommuneFeature[], layouts: TerritoryLayout[]): Path2D[] {
  const byId = new Map(layouts.map((l) => [l.territory.id, l.projection]));
  return communes.map((f) => {
    const path = new Path2D();
    const projection = byId.get(territoryOf(f.properties.code));
    if (projection) geoPath(projection, path as unknown as CanvasRenderingContext2D)(f);
    return path;
  });
}

/** Limites départementales projetées, par territoire. */
export function buildBorderPath(geo: MapGeometry, layouts: TerritoryLayout[]): Path2D {
  const path = new Path2D();
  const ctx = path as unknown as CanvasRenderingContext2D;
  for (const l of layouts) {
    const [[x0, y0], [x1, y1]] = [
      [l.box.x - 2, l.box.y - 2],
      [l.box.x + l.box.w + 2, l.box.y + l.box.h + 2],
    ];
    // Chaque projection ne trace que les segments tombant dans son cadre.
    const clipped = geoPath(l.projection.clipExtent([[x0, y0], [x1, y1]]), ctx);
    clipped(geo.departementBorders);
    l.projection.clipExtent(null);
  }
  return path;
}

export function featureBounds(f: CommuneFeature, layouts: TerritoryLayout[]): [[number, number], [number, number]] | null {
  const l = layouts.find((x) => x.territory.id === territoryOf(f.properties.code));
  return l ? geoPath(l.projection).bounds(f) : null;
}

/** Centre projeté d'une commune (point d'ancrage de son nom), ou null hors des territoires affichés. */
export function featureCentroid(f: CommuneFeature, layouts: TerritoryLayout[]): [number, number] | null {
  const l = layouts.find((x) => x.territory.id === territoryOf(f.properties.code));
  if (!l) return null;
  const c = geoPath(l.projection).centroid(f);
  return Number.isFinite(c[0]) && Number.isFinite(c[1]) ? c : null;
}
