import { mountShell, renderCatalog } from './shell/shell';
import './shell/catalog.css';

mountShell();
renderCatalog(document.getElementById('catalog')!);
