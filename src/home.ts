import { mountShell, renderCatalog } from './shell/shell';
import './shell/catalog.css';

mountShell();
renderCatalog(document.getElementById('catalog')!);
const exercises = document.getElementById('exercises')!;
if (renderCatalog(exercises, 'exercice') > 0) exercises.closest('section')!.hidden = false;
