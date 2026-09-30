import { fetchText } from '@tools/lib/download';

export interface BoxFile {
  id: string;
  name: string;
  size: number;
}

const ITEM_RE = /"typedID":"f_(\d+)","type":"file"[^}]*?"name":"([^"]+)","itemSize":(\d+)/g;
const MAX_PAGES = 50;

/**
 * Liste les fichiers d'un dossier d'un partage Box public.
 * Box n'expose pas d'API sans authentification : on lit l'état JSON embarqué dans la page HTML.
 * C'est la partie la plus fragile du pipeline, d'où l'isolement ici et la vérification stricte en aval.
 */
export async function listBoxFolder(vanity: string, folderId: string): Promise<BoxFile[]> {
  const files = new Map<string, BoxFile>();
  for (let page = 1; page <= MAX_PAGES; page++) {
    const html = await fetchText(`https://cerema.box.com/v/${vanity}/folder/${folderId}?page=${page}`);
    const found = parseBoxListing(html);
    const before = files.size;
    for (const f of found) files.set(f.id, f);
    if (files.size === before) break; // page vide ou déjà vue : fin de la pagination
  }
  if (files.size === 0) {
    throw new Error(`Aucun fichier trouvé dans le dossier Box ${folderId} : le format de la page a peut-être changé.`);
  }
  return [...files.values()];
}

export function parseBoxListing(html: string): BoxFile[] {
  return [...html.matchAll(ITEM_RE)].map(([, id, name, size]) => ({ id: id!, name: name!, size: Number(size) }));
}

export function boxDownloadUrl(vanity: string, fileId: string): string {
  return `https://cerema.box.com/index.php?rm=box_download_shared_file&vanity_name=${vanity}&file_id=f_${fileId}`;
}
