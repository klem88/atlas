import { mountShell } from '@shell/shell';
import { assetUrl } from '@shell/site';
import './viz.css';

/** Données statiques de cette visualisation (produites par `npm run data -- qui-chante`). */
export const DATA_URL = assetUrl('data/qui-chante');

mountShell({ currentSlug: 'qui-chante' });

const stage = document.getElementById('stage')!;
stage.textContent = 'La visualisation « Qui chante autour de chez toi » s’affichera ici.';
