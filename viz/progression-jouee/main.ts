import { mountShell } from '@shell/shell';
import { assetUrl } from '@shell/site';
import './viz.css';

/** Données statiques de cette visualisation (produites par `npm run data -- progression-jouee`). */
export const DATA_URL = assetUrl('data/progression-jouee');

mountShell({ currentSlug: 'progression-jouee' });

const stage = document.getElementById('stage')!;
stage.textContent = 'La visualisation « Ta progression a déjà été jouée 40 000 fois » s’affichera ici.';
