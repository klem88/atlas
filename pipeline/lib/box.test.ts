import { describe, expect, it } from 'vitest';
import { parseBoxListing } from './box';

describe('parseBoxListing', () => {
  it('extrait les fichiers et ignore les dossiers', () => {
    const html = `
      {"typedID":"d_387040082118","type":"folder","id":387040082118,"name":"prix_volumes","itemSize":1451184165}
      {"typedID":"f_2263662829827","type":"file","id":2263662829827,"extension":"xlsx","name":"dv3f_prix_volumes_communes_2025.xlsx","itemSize":36985163}
    `;
    expect(parseBoxListing(html)).toEqual([
      { id: '2263662829827', name: 'dv3f_prix_volumes_communes_2025.xlsx', size: 36985163 },
    ]);
  });
});
