import { describe, expect, it } from 'vitest';
import { dedupeBillboard, irbSong, parseBillboardIndex, parseChordonomiconRow, parseCsvLine, parseSalami, untar } from './corpora';

describe('CSV', () => {
  it('découpe virgules et guillemets', () => {
    expect(parseCsvLine('a,b,c')).toEqual(['a', 'b', 'c']);
    expect(parseCsvLine('1,"Roberta Flack,Donny Hathaway",x')).toEqual(['1', 'Roberta Flack,Donny Hathaway', 'x']);
    expect(parseCsvLine('"He said ""hi""",2')).toEqual(['He said "hi"', '2']);
    expect(parseCsvLine('a,,')).toEqual(['a', '', '']);
  });
});

describe('Chordonomicon', () => {
  const row = {
    id: '3',
    chords: '<intro_1> Csmin <verse_1> A Csmin A B <chorus_1> Csmin A Fsmin A B',
    release_date: '2003-01-01',
    genres: "'alternative metal' 'nu metal'",
    decade: '2000.0',
    rock_genre: 'canadian rock',
    artist_id: 'artist_3',
    main_genre: 'metal',
    spotify_song_id: '',
    spotify_artist_id: '',
  };
  it('découpe en sections nommées sans numéro', () => {
    const s = parseChordonomiconRow(row);
    expect(s.id).toBe('cho:3');
    expect(s.corpus).toBe('chordonomicon');
    expect(s.year).toBe(2003);
    expect(s.genre).toBe('metal');
    expect(s.sections.map((x) => x.name)).toEqual(['intro', 'verse', 'chorus']);
    expect(s.sections[1]!.chords.map((c) => c.symbol)).toEqual(['A', 'Csmin', 'A', 'B']);
    expect(s.sections[1]!.chords[0]!.beats).toBe(1);
  });
  it('se replie sur la décennie quand la date manque, et sur une section unique sans marqueur', () => {
    const s = parseChordonomiconRow({ ...row, chords: 'C F G', release_date: '' });
    expect(s.year).toBe(2000);
    expect(s.sections).toEqual([{ name: 'main', chords: [{ symbol: 'C', beats: 1 }, { symbol: 'F', beats: 1 }, { symbol: 'G', beats: 1 }] }]);
    expect(parseChordonomiconRow({ ...row, release_date: '', decade: '' }).year).toBeUndefined();
  });
});

describe('iRb', () => {
  it('convertit une grille avec ses reprises de section et sa tonalité', () => {
    const s = irbSong(
      {
        sections: ['A', 'A', 'B'],
        content: {
          A: [
            { chord: 'Cmin7', duration: { beats: 4 } },
            { chord: 'F7', duration: { beats: 4 } },
          ],
          B: [{ chord: 'Bbmaj7', duration: { beats: 8 } }],
        },
        info: { title: 'Autumn Leaves', composer: 'Kosma, Joseph', date: '1945', key: 'G', minor: true },
      },
      12,
    );
    expect(s.id).toBe('irb:12');
    expect(s.title).toBe('Autumn Leaves');
    expect(s.year).toBe(1945);
    expect(s.key).toEqual({ tonic: 7, mode: 'minor' });
    expect(s.sections).toHaveLength(3);
    expect(s.sections[2]!.chords).toEqual([{ symbol: 'Bbmaj7', beats: 8 }]);
  });
});

describe('Billboard', () => {
  const salami = [
    '# title: I Don\'t mind',
    '# artist: James Brown',
    '# metre: 6/8',
    '# tonic: C',
    '',
    '0.0\tsilence',
    '7.3\tA, intro, | A:min | A:min . C:maj | C:maj |',
    '8.7\t| A:min | x2',
    '22.3\tB, verse, | F:maj | G:maj |, (voice',
    '36.2\t| (2/4) D:maj |',
    '# tonic: D',
    '43.0\t| N | &pause |',
    '150.9\tend',
  ].join('\n');
  const meta = { id: '0003', title: "I Don't Mind", artist: 'James Brown', year: 1961 };

  it('lit sections, mesures, prolongations, reprises et changements de métrique', () => {
    const s = parseSalami(salami, meta);
    expect(s.id).toBe('bb:0003');
    expect(s.key).toEqual({ tonic: 0 });
    expect(s.sections.map((x) => x.name)).toEqual(['intro', 'verse']);
    expect(s.sections[0]!.chords).toEqual([
      { symbol: 'A:min', beats: 6 },
      { symbol: 'A:min', beats: 4 },
      { symbol: 'C:maj', beats: 2 },
      { symbol: 'C:maj', beats: 6 },
      { symbol: 'A:min', beats: 6 },
      { symbol: 'A:min', beats: 6 },
    ]);
    expect(s.sections[1]!.chords).toEqual([
      { symbol: 'F:maj', beats: 6 },
      { symbol: 'G:maj', beats: 6 },
      { symbol: 'D:maj', beats: 2 },
      { symbol: 'N', beats: 6 },
      { symbol: 'N', beats: 6 },
    ]);
  });

  it('lit l’index et ignore les entrées sans titre', () => {
    const idx = parseBillboardIndex('id,chart_date,target_rank,actual_rank,title,artist,peak_rank,weeks_on_chart\n1,1987-07-11,82,,,,,\n3,1961-07-03,56,57,I Don\'t Mind,James Brown,47,8\n4,1971-08-07,32,31,You\'ve Got A Friend,"Roberta Flack,Donny Hathaway",29,12\n');
    expect(idx.size).toBe(2);
    expect(idx.get('0003')).toEqual({ id: '0003', title: "I Don't Mind", artist: 'James Brown', year: 1961 });
    expect(idx.get('0004')!.artist).toBe('Roberta Flack,Donny Hathaway');
  });

  it('dédoublonne les morceaux classés plusieurs fois', () => {
    const a = parseSalami(salami, meta);
    const b = parseSalami(salami, { ...meta, id: '0100', year: 1965 });
    const c = parseSalami(salami, { ...meta, id: '0200', title: 'Other' });
    expect(dedupeBillboard([b, a, c]).map((s) => s.id)).toEqual(['bb:0003', 'bb:0200']);
  });
});

describe('tar', () => {
  it('lit une archive minimale', () => {
    const header = Buffer.alloc(512);
    header.write('dir/file.txt', 0);
    header.write('0000000006\0', 124);
    header.write('0', 156);
    const data = Buffer.alloc(512);
    data.write('hello\n');
    const files = untar(Buffer.concat([header, data, Buffer.alloc(1024)]));
    expect(files.get('dir/file.txt')!.toString()).toBe('hello\n');
  });
});
