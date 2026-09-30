import { fmtEurosRounded, fmtInt, fmtPct } from '@shell/format';

/** Contenu d'une carte de partage, indépendant de la façon de le dessiner. */
export interface ShareCardData {
  kicker: string;
  headline: string;
  figure: string;
  figureCaption: string;
  comparison: string | null;
  series: { x: number; y: number | null }[];
  currentYear: number;
  seriesLabel: string;
  formatY: (y: number) => string;
  footnote: string;
  url: string;
}

export interface CardTheme {
  surface: string;
  page: string;
  ink: string;
  ink2: string;
  ink3: string;
  rule: string;
  line: string;
  accent: string;
  fontDisplay: string;
  fontUi: string;
}

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

interface CardInput {
  netMonthlyIncome: number;
  year: number;
  rate: number;
  commune: { nom: string; area: number; peak: { x: number; y: number } | null; series: { x: number; y: number | null }[] } | null;
  budget: { value: number; peak: { x: number; y: number }; series: { x: number; y: number }[] };
  url: string;
}

/** Choisit le message : la commune si elle est sélectionnée, sinon le budget national. */
export function buildCardData(i: CardInput): ShareCardData {
  const kicker = 'Ce que ton salaire achète';
  const headline = `Avec ${fmtInt(i.netMonthlyIncome)} € nets par mois`;
  const footnote = `Taux moyen ${fmtPct(i.rate)} en ${i.year}. Prix médians : Cerema (DV3F) · Taux : BCE.`;

  if (i.commune) {
    const { nom, area, peak, series } = i.commune;
    const better = peak && peak.x !== i.year && peak.y > area * 1.03;
    return {
      kicker,
      headline,
      figure: `${fmtInt(Math.round(area))} m²`,
      figureCaption: `à ${nom} en ${i.year}`,
      comparison: better ? `contre ${fmtInt(Math.round(peak.y))} m² en ${peak.x}` : null,
      series,
      currentYear: i.year,
      seriesLabel: 'Surface achetable selon l’année',
      formatY: (y) => `${fmtInt(Math.round(y))} m²`,
      footnote,
      url: i.url,
    };
  }

  const { value, peak, series } = i.budget;
  const better = peak.x !== i.year && peak.y > value * 1.03;
  return {
    kicker,
    headline,
    figure: fmtEurosRounded(value),
    figureCaption: `de budget d’achat en ${i.year}`,
    comparison: better ? `contre ${fmtEurosRounded(peak.y)} en ${peak.x}` : null,
    series,
    currentYear: i.year,
    seriesLabel: 'Budget d’achat selon l’année',
    formatY: (y) => `${fmtInt(Math.round(y / 1000))} k€`,
    footnote,
    url: i.url,
  };
}

/**
 * Dessine la carte de partage. `mapImage` est la vue courante de la carte (facultative).
 * Mise en page : texte en haut, carte au centre, courbe et sources en bas.
 */
export function drawShareCard(ctx: CanvasRenderingContext2D, d: ShareCardData, t: CardTheme, mapImage?: CanvasImageSource & { width: number; height: number }): void {
  const W = CARD_WIDTH;
  const H = CARD_HEIGHT;
  const pad = 80;

  ctx.fillStyle = t.page;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'alphabetic';

  // En-tête
  ctx.fillStyle = t.ink3;
  ctx.font = `600 26px ${t.fontUi}`;
  ctx.fillText(d.kicker.toUpperCase(), pad, pad + 20, W - pad * 2);
  ctx.fillStyle = t.ink2;
  ctx.font = `300 44px ${t.fontDisplay}`;
  ctx.fillText(d.headline, pad, pad + 100, W - pad * 2);

  ctx.fillStyle = t.ink;
  ctx.font = `300 150px ${t.fontUi}`;
  ctx.fillText(d.figure, pad - 6, pad + 260, W - pad * 2);
  ctx.font = `400 46px ${t.fontDisplay}`;
  ctx.fillText(d.figureCaption, pad, pad + 330, W - pad * 2);
  if (d.comparison) {
    ctx.fillStyle = t.accent;
    ctx.font = `600 36px ${t.fontUi}`;
    ctx.fillText(d.comparison, pad, pad + 390, W - pad * 2);
  }

  // Carte (vue courante), contenue dans son cadre
  const map = { x: pad, y: 520, w: W - pad * 2, h: 470 };
  ctx.fillStyle = t.surface;
  roundRect(ctx, map.x, map.y, map.w, map.h, 14);
  ctx.fill();
  if (mapImage && mapImage.width > 0) {
    // Remplit le cadre (recadrage centré) : pas de bandes vides autour de la carte.
    const s = Math.max(map.w / mapImage.width, map.h / mapImage.height);
    const w = mapImage.width * s;
    const h = mapImage.height * s;
    ctx.save();
    roundRect(ctx, map.x, map.y, map.w, map.h, 14);
    ctx.clip();
    ctx.drawImage(mapImage, map.x + (map.w - w) / 2, map.y + (map.h - h) / 2, w, h);
    ctx.restore();
  }

  // Courbe
  drawSeries(ctx, d, t, { x: pad, y: 1040, w: W - pad * 2, h: 170 });

  // Pied
  ctx.fillStyle = t.ink3;
  ctx.font = `400 24px ${t.fontUi}`;
  ctx.fillText(d.footnote, pad, H - 70, W - pad * 2);
  ctx.fillStyle = t.ink;
  ctx.font = `600 26px ${t.fontUi}`;
  ctx.fillText(d.url.replace(/^https?:\/\//, '').replace(/[?#].*$/, ''), pad, H - 34, W - pad * 2);
}

function drawSeries(ctx: CanvasRenderingContext2D, d: ShareCardData, t: CardTheme, box: { x: number; y: number; w: number; h: number }): void {
  const valid = d.series.filter((p): p is { x: number; y: number } => p.y !== null);
  if (valid.length < 2) return;
  const xs = d.series.map((p) => p.x);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  // Échelle serrée sur les valeurs (courbe sans axe, valeurs écrites dessus) pour rendre la variation lisible.
  const ys = valid.map((p) => p.y);
  const [lo, hi] = [Math.min(...ys), Math.max(...ys)];
  const span = hi - lo || hi || 1;
  const yMin = Math.max(0, lo - span * 0.25);
  const yMax = hi + span * 0.15;
  const top = box.y + 70;
  const bottom = box.y + box.h - 34;
  const X = (v: number) => box.x + 12 + ((v - x0) / (x1 - x0)) * (box.w - 24);
  const Y = (v: number) => bottom - ((v - yMin) / (yMax - yMin)) * (bottom - top);

  ctx.fillStyle = t.ink2;
  ctx.font = `700 24px ${t.fontUi}`;
  ctx.fillText(d.seriesLabel, box.x, box.y + 20);

  ctx.strokeStyle = t.rule;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(box.x, bottom);
  ctx.lineTo(box.x + box.w, bottom);
  ctx.stroke();

  ctx.strokeStyle = t.line;
  ctx.lineWidth = 5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  let pen = false;
  for (const p of d.series) {
    if (p.y === null) {
      pen = false;
      continue;
    }
    if (pen) ctx.lineTo(X(p.x), Y(p.y));
    else ctx.moveTo(X(p.x), Y(p.y));
    pen = true;
  }
  ctx.stroke();

  const cur = valid.find((p) => p.x === d.currentYear);
  const peak = valid.reduce((a, b) => (b.y > a.y ? b : a));
  // Étiquettes directes : le pic et l'année courante (texte en encre, jamais la couleur de la série).
  const label = (p: { x: number; y: number }, text: string, weight: number) => {
    ctx.font = `${weight} 24px ${t.fontUi}`;
    const w = ctx.measureText(text).width;
    const lx = Math.min(Math.max(X(p.x) - w / 2, box.x), box.x + box.w - w);
    ctx.lineWidth = 8;
    ctx.strokeStyle = t.page;
    ctx.strokeText(text, lx, Y(p.y) - 22);
    ctx.fillStyle = t.ink;
    ctx.fillText(text, lx, Y(p.y) - 22);
  };
  if (peak.x !== d.currentYear) {
    ctx.fillStyle = t.line;
    ctx.beginPath();
    ctx.arc(X(peak.x), Y(peak.y), 7, 0, Math.PI * 2);
    ctx.fill();
    label(peak, `${d.formatY(peak.y)} en ${peak.x}`, 400);
  }
  if (cur) label(cur, d.formatY(cur.y), 700);
  if (cur) {
    ctx.fillStyle = t.page;
    ctx.beginPath();
    ctx.arc(X(cur.x), Y(cur.y), 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = t.accent;
    ctx.beginPath();
    ctx.arc(X(cur.x), Y(cur.y), 9, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = t.ink3;
  ctx.font = `400 22px ${t.fontUi}`;
  ctx.textAlign = 'left';
  ctx.fillText(String(x0), box.x, bottom + 30);
  ctx.textAlign = 'right';
  ctx.fillText(String(x1), box.x + box.w, bottom + 30);
  ctx.textAlign = 'left';
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
