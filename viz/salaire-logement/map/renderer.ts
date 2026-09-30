import { select } from 'd3-selection';
import 'd3-transition';
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import {
  buildBorderPath,
  buildPaths,
  featureBounds,
  layoutTerritories,
  type CommuneFeature,
  type MapGeometry,
  type TerritoryLayout,
} from './geo';

/** Apparence d'une commune : une couleur de remplissage et éventuellement une texture. */
export interface CommuneFill {
  color: string;
  texture: 'none' | 'estimate' | 'uncovered';
}

export interface MapTheme {
  surface: string;
  border: string;
  ink: string;
  ink3: string;
  accent: string;
  hatch: string;
  hatchInk: string;
}

export interface MapEvents {
  onHover?: (index: number | null, at: { x: number; y: number }) => void;
  onSelect?: (index: number | null) => void;
  onWheelWithoutModifier?: () => void;
}

const MAX_ZOOM = 60;

/** Opacité des hachures « estimation » selon le zoom : 15 % en vue d'ensemble, 100 % dès ×4. */
export function hatchOpacity(k: number): number {
  return Math.min(1, Math.max(0.15, 0.15 + ((k - 1) / 3) * 0.85));
}

/**
 * Carte choroplèthe sur canvas.
 * - Les communes sont regroupées par apparence : un Path2D combiné par groupe,
 *   donc une dizaine d'appels `fill` par image au lieu de 35 000.
 * - La détection au survol lit un canvas caché où chaque commune a une couleur unique.
 */
export class CanvasMap {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly pick: HTMLCanvasElement;
  private readonly pickCtx: CanvasRenderingContext2D;
  private readonly zoomBehavior: ZoomBehavior<HTMLCanvasElement, unknown>;
  private readonly resizeObserver: ResizeObserver;

  private width = 0;
  private height = 0;
  private dpr = 1;
  private transform: ZoomTransform = zoomIdentity;
  private layouts: TerritoryLayout[] = [];
  private paths: Path2D[] = [];
  private allPaths = new Path2D();
  private borders = new Path2D();
  private groups: { fill: CommuneFill; path: Path2D }[] = [];
  private fillOf: (index: number) => CommuneFill = () => ({ color: '#ccc', texture: 'none' });
  private hovered: number | null = null;
  private selected: number | null = null;
  private pickDirty = true;
  private frame = 0;
  private patterns = new Map<string, CanvasPattern>();
  /** Zoom demandé avant que la carte ait une taille : appliqué au premier dimensionnement. */
  private pendingZoom: { index: number; duration: number } | null = null;

  constructor(
    container: HTMLElement,
    private readonly geo: MapGeometry,
    private theme: MapTheme,
    private readonly events: MapEvents = {},
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'map-canvas';
    container.append(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
    this.pick = document.createElement('canvas');
    this.pickCtx = this.pick.getContext('2d', { willReadFrequently: true })!;

    this.zoomBehavior = zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([1, MAX_ZOOM])
      .filter((event: Event) => {
        // La molette seule fait défiler la page ; Ctrl/⌘ + molette zoome (comme les cartes usuelles).
        if (event.type === 'wheel') {
          const wheel = event as WheelEvent;
          if (!wheel.ctrlKey && !wheel.metaKey) {
            this.events.onWheelWithoutModifier?.();
            return false;
          }
          return true;
        }
        // Tactile : un doigt fait défiler la page, deux doigts déplacent et zoomment la carte.
        if (event.type === 'touchstart') return (event as TouchEvent).touches.length >= 2;
        return !(event as MouseEvent).button;
      })
      .on('zoom', (e: { transform: ZoomTransform }) => {
        this.transform = e.transform;
        this.pickDirty = true;
        this.requestDraw();
      });
    select(this.canvas).call(this.zoomBehavior).on('dblclick.zoom', null);
    // d3-zoom impose `touch-action: none` ; on rend le défilement vertical au navigateur.
    this.canvas.style.touchAction = 'pan-y';

    this.canvas.addEventListener('pointermove', (e) => this.handlePointer(e));
    this.canvas.addEventListener('pointerleave', () => this.setHovered(null, { x: 0, y: 0 }));
    this.canvas.addEventListener('click', (e) => {
      const i = this.indexAt(e.offsetX, e.offsetY);
      this.events.onSelect?.(i);
    });

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
  }

  /** Définit l'apparence de chaque commune et reconstruit les groupes de remplissage. */
  setFills(fillOf: (index: number) => CommuneFill): void {
    this.fillOf = fillOf;
    this.rebuildGroups();
    this.requestDraw();
  }

  setTheme(theme: MapTheme): void {
    this.theme = theme;
    this.patterns.clear();
    this.requestDraw();
  }

  setSelected(index: number | null): void {
    this.selected = index;
    this.requestDraw();
  }

  /** Centre et zoome sur une commune (avec un contexte suffisant autour). */
  zoomToCommune(index: number, duration = 750): void {
    if (this.layouts.length === 0) {
      this.pendingZoom = { index, duration };
      return;
    }
    const f = this.geo.communes[index];
    const b = f && featureBounds(f, this.layouts);
    if (!b) return;
    const [[x0, y0], [x1, y1]] = b;
    const k = Math.min(MAX_ZOOM, 0.1 / Math.max((x1 - x0) / this.width, (y1 - y0) / this.height), 24);
    const t = zoomIdentity
      .translate(this.width / 2, this.height / 2)
      .scale(Math.min(Math.max(k, 3), 14))
      .translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
    this.animateTo(t, duration);
  }

  zoomBy(factor: number): void {
    select(this.canvas).transition().duration(250).call(this.zoomBehavior.scaleBy, factor);
  }

  resetZoom(): void {
    this.animateTo(zoomIdentity, 500);
  }

  destroy(): void {
    this.resizeObserver.disconnect();
    cancelAnimationFrame(this.frame);
    this.canvas.remove();
  }

  // --- Interne -------------------------------------------------------------

  private animateTo(t: ZoomTransform, duration: number): void {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sel = select(this.canvas);
    if (reduced) sel.call(this.zoomBehavior.transform, t);
    else sel.transition().duration(duration).call(this.zoomBehavior.transform, t);
  }

  private resize(): void {
    const rect = this.canvas.parentElement!.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.pick.width = width;
    this.pick.height = height;

    this.layouts = layoutTerritories(width, height, this.geo);
    this.paths = buildPaths(this.geo.communes, this.layouts);
    this.allPaths = new Path2D();
    for (const p of this.paths) this.allPaths.addPath(p);
    this.borders = buildBorderPath(this.geo, this.layouts);
    this.zoomBehavior.translateExtent([
      [0, 0],
      [width, height],
    ]);
    this.zoomBehavior.extent([
      [0, 0],
      [width, height],
    ]);
    this.rebuildGroups();
    this.pickDirty = true;
    this.requestDraw();
    if (this.pendingZoom) {
      const { index, duration } = this.pendingZoom;
      this.pendingZoom = null;
      this.zoomToCommune(index, duration);
    }
  }

  private rebuildGroups(): void {
    if (this.paths.length === 0) return;
    const groups = new Map<string, { fill: CommuneFill; path: Path2D }>();
    this.paths.forEach((p, i) => {
      const fill = this.fillOf(i);
      const key = `${fill.color}|${fill.texture}`;
      let g = groups.get(key);
      if (!g) groups.set(key, (g = { fill, path: new Path2D() }));
      g.path.addPath(p);
    });
    this.groups = [...groups.values()];
  }

  private requestDraw(): void {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.draw());
  }

  private draw(): void {
    const { ctx, dpr, transform: t, theme } = this;
    const k = t.k;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * t.x, dpr * t.y);

    for (const { fill, path } of this.groups) {
      ctx.fillStyle = fill.color;
      ctx.fill(path);
      if (fill.texture !== 'none') {
        // Vue d'ensemble : texture à peine perceptible (sinon 40 % du territoire vire au gris).
        // Elle se révèle en zoomant, là où l'on examine une commune en particulier.
        ctx.globalAlpha = fill.texture === 'estimate' ? hatchOpacity(k) : 1;
        ctx.fillStyle = this.pattern(fill.texture, k);
        ctx.fill(path);
        ctx.globalAlpha = 1;
      }
    }

    // Limites communales en couleur de fond : un « espace » plutôt qu'un trait,
    // seulement quand les communes sont assez grandes à l'écran pour qu'il aide.
    if (k >= 1.8) {
      ctx.strokeStyle = theme.surface;
      ctx.lineJoin = 'round';
      ctx.lineWidth = (k < 6 ? 0.5 : 1) / k;
      ctx.stroke(this.allPaths);
    }

    ctx.strokeStyle = theme.border;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 0.6 / k;
    ctx.stroke(this.borders);
    ctx.globalAlpha = 1;

    if (this.selected !== null && this.paths[this.selected]) {
      const p = this.paths[this.selected]!;
      ctx.strokeStyle = theme.surface;
      ctx.lineWidth = 5 / k;
      ctx.stroke(p);
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 2.5 / k;
      ctx.stroke(p);
    }
    if (this.hovered !== null && this.hovered !== this.selected && this.paths[this.hovered]) {
      ctx.strokeStyle = theme.ink;
      ctx.lineWidth = 1.5 / k;
      ctx.stroke(this.paths[this.hovered]!);
    }

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.drawInsetFrames();
  }

  /** Cadres et noms des encarts d'outre-mer, suivant le zoom. */
  private drawInsetFrames(): void {
    const { ctx, transform: t, theme } = this;
    ctx.font = `11px ${getComputedStyle(this.canvas).fontFamily}`;
    ctx.textBaseline = 'top';
    for (const { territory, box } of this.layouts) {
      if (territory.main) continue;
      const [x, y] = t.apply([box.x, box.y]);
      const w = box.w * t.k;
      const h = box.h * t.k;
      ctx.strokeStyle = theme.border;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w, h);
      ctx.globalAlpha = 1;
      // Nom au-dessus des formes, détouré de la couleur de fond pour rester lisible.
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = theme.surface;
      ctx.strokeText(territory.name, x + 4, y + 4);
      ctx.fillStyle = theme.ink3;
      ctx.fillText(territory.name, x + 4, y + 4);
    }
  }

  private pattern(kind: 'estimate' | 'uncovered', k: number): CanvasPattern {
    const key = `${kind}`;
    let p = this.patterns.get(key);
    if (!p) {
      const size = Math.round(6 * this.dpr);
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d')!;
      g.strokeStyle = kind === 'estimate' ? this.theme.hatch : this.theme.hatchInk;
      g.lineWidth = this.dpr;
      g.beginPath();
      // Diagonale à 45°, raccordée aux coins pour un motif continu.
      g.moveTo(0, size);
      g.lineTo(size, 0);
      g.moveTo(-size / 2, size / 2);
      g.lineTo(size / 2, -size / 2);
      g.moveTo(size / 2, size * 1.5);
      g.lineTo(size * 1.5, size / 2);
      g.stroke();
      p = this.ctx.createPattern(c, 'repeat')!;
      this.patterns.set(key, p);
    }
    // Motif constant à l'écran, quel que soit le zoom.
    p.setTransform(new DOMMatrix().scale(1 / (this.dpr * k)));
    return p;
  }

  private redrawPick(): void {
    const { pickCtx: ctx, transform: t } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.setTransform(t.k, 0, 0, t.k, t.x, t.y);
    this.paths.forEach((p, i) => {
      const id = i + 1;
      ctx.fillStyle = `rgb(${id & 255},${(id >> 8) & 255},${(id >> 16) & 255})`;
      ctx.fill(p);
    });
    this.pickDirty = false;
  }

  private indexAt(x: number, y: number): number | null {
    if (this.pickDirty) this.redrawPick();
    const [r, g, b, a] = this.pickCtx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
    // Pixels d'anticrénelage (alpha partiel) : couleur non fiable, on ignore.
    if (a !== 255) return null;
    const id = r! + (g! << 8) + (b! << 16);
    return id === 0 ? null : id - 1;
  }

  private handlePointer(e: PointerEvent): void {
    if (e.pointerType === 'touch' || e.buttons) return;
    this.setHovered(this.indexAt(e.offsetX, e.offsetY), { x: e.offsetX, y: e.offsetY });
  }

  private setHovered(index: number | null, at: { x: number; y: number }): void {
    const changed = index !== this.hovered;
    this.hovered = index;
    this.canvas.style.cursor = index === null ? 'grab' : 'pointer';
    if (changed) this.requestDraw();
    this.events.onHover?.(index, at);
  }
}

export type { CommuneFeature };
