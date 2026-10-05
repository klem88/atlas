import { mountExercise } from '@shell/music/exercise';
import { escapeHtml } from '@shell/html';
import { mountShell } from '@shell/shell';
import { GRILLE, SCORES } from './domain/partition';
import './viz.css';

mountShell({ currentSlug: 'six-ficelles' });

// La grille en jetons, une ligne par partie (A, pont, A′).
document.getElementById('grille')!.innerHTML = GRILLE.map(
  (partie) => `
  <div class="grille-partie">
    <p class="grille-label">${escapeHtml(partie.label)}</p>
    <ol class="grille-mesures">${partie.bars
      .map((b, i) => `<li><span class="grille-num">${i + 1}</span>${escapeHtml(b)}</li>`)
      .join('')}</ol>
  </div>`,
).join('');

mountExercise({ slug: 'six-ficelles', scores: SCORES });
