import { mountExercise } from '@shell/music/exercise';
import { escapeHtml } from '@shell/html';
import { mountShell } from '@shell/shell';
import { grille, partitions, type Grille } from './domain/partition';
import './viz.css';

mountShell({ currentSlug: 'improviser-nostalgie' });

const choix = document.querySelector<HTMLFieldSetElement>('[data-grille-choix]')!;
const jetons = document.getElementById('grille')!;

// La grille en jetons, avec le degré sous chaque accord.
function afficher(g: Grille): void {
  jetons.innerHTML = `<ol class="grille-mesures">${g.mesures
    .map((m, i) => {
      const noms = m.map((a) => a.nom).join(' · ');
      const degres = m.map((a) => a.degre).join(' · ');
      return `<li><span class="grille-num">${i + 1}</span><span class="grille-accord"><span class="grille-nom">${escapeHtml(noms)}</span><span class="grille-degre">${escapeHtml(degres)}</span></span></li>`;
    })
    .join('')}</ol>`;
  // Textes propres à chaque grille.
  document.querySelectorAll<HTMLElement>('[data-grille]').forEach((el) => (el.hidden = el.dataset.grille !== g.id));
  const radio = choix.querySelector<HTMLInputElement>(`input[value="${g.id}"]`);
  if (radio) radio.checked = true;
}

// Le choix « Accords / Degrés / Les deux » du bandeau vaut aussi pour la grille.
document.addEventListener('chordlabels', (e) => {
  jetons.dataset.labels = (e as CustomEvent<string>).detail;
});

// La grille choisie se garde dans l'adresse (?grille=…), pour la retrouver ou la partager.
let courante = grille(new URLSearchParams(location.search).get('grille') ?? '');
afficher(courante);
const exercice = mountExercise({ slug: 'improviser-nostalgie', scores: partitions(courante) });

choix.addEventListener('change', (e) => {
  const suivante = grille((e.target as HTMLInputElement).value);
  if (suivante.id === courante.id) return;
  courante = suivante;
  afficher(courante);
  exercice.setScores(partitions(courante));
  const url = new URL(location.href);
  url.searchParams.set('grille', courante.id);
  history.replaceState(null, '', url);
});
