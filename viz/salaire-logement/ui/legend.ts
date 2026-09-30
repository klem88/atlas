import { AREA_CLASSES } from '../domain/classes';

/**
 * Légende à seuils : une barre de 7 cases, et les bornes (20, 35, 50…) placées
 * sur les frontières entre cases — compacte, et exacte sur ce que signifie chaque couleur.
 */
export function renderLegend(target: HTMLElement): void {
  const swatches = AREA_CLASSES.map(
    (c, i) => `<li title="${c.label} : ${c.hint}"><span class="swatch" style="background: var(--seq-${i})"></span><span class="visually-hidden">${c.label}</span></li>`,
  ).join('');
  const ticks = AREA_CLASSES.slice(1)
    .map((c, i) => `<span style="left: ${((i + 1) / AREA_CLASSES.length) * 100}%">${c.min}</span>`)
    .join('');

  target.innerHTML = `
    <div class="legend-scale">
      <p class="legend-title">Surface achetable <span>(m²) — plus c’est foncé, plus c’est grand</span></p>
      <ol class="legend-classes">${swatches}</ol>
      <div class="legend-ticks" aria-hidden="true">${ticks}</div>
    </div>
    <ul class="legend-states">
      <li><span class="swatch swatch--estimate"></span>Prix estimé (intercommunalité)</li>
      <li><span class="swatch swatch--no-market"></span>Pas de marché pour ce type</li>
      <li><span class="swatch swatch--uncovered"></span>Données non publiées</li>
    </ul>`;
}
