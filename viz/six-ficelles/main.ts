import { mountExercise } from '@shell/music/exercise';
import { escapeHtml } from '@shell/html';
import { mountShell } from '@shell/shell';
import { DEGRES_DO, DEGRES_RE, GRILLE, SCORES } from './domain/partition';
import './viz.css';

mountShell({ currentSlug: 'six-ficelles' });

// La grille en jetons, une ligne par partie (A, pont, A′), avec le degré sous chaque accord.
const DEGRES = [DEGRES_DO, DEGRES_RE, DEGRES_RE];
const grille = document.getElementById('grille')!;
grille.innerHTML = GRILLE.map(
  (partie, p) => `
  <div class="grille-partie">
    <p class="grille-label">${escapeHtml(partie.label)}</p>
    <ol class="grille-mesures">${partie.bars
      .map((mesure, i) => {
        const accords = mesure.split(' · ');
        const degres = accords.map((a) => DEGRES[p]![a] ?? '').join(' · ');
        return `<li><span class="grille-num">${i + 1}</span><span class="grille-accord"><span class="grille-nom">${escapeHtml(mesure)}</span><span class="grille-degre">${escapeHtml(degres)}</span></span></li>`;
      })
      .join('')}</ol>
  </div>`,
).join('');
// Le choix « Accords / Degrés / Les deux » du bandeau vaut aussi pour la grille.
document.addEventListener('chordlabels', (e) => {
  grille.dataset.labels = (e as CustomEvent<string>).detail;
});

mountExercise({ slug: 'six-ficelles', scores: SCORES });
