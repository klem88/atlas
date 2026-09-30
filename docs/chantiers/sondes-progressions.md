# Sondes : les corpus de progressions d'accords

Faites le 1er octobre 2026, avant le cycle « progressions ». Résultats vérifiés (pages officielles, paquets ouverts, premières lignes lues), sauf mention contraire.

## Corpus retenus

| Corpus | Contenu | Métadonnées | Licence | Accès |
| --- | --- | --- | --- | --- |
| **Chordonomicon** (Kantarelis et al., 2024) | 679 807 progressions (tablatures Ultimate Guitar), avec marqueurs de structure `<intro_1>`, `<verse_1>`, `<chorus_1>`… | genres (liste), `main_genre` (12 catégories), décennie, date, identifiants Spotify. **Ni titre, ni tonalité.** | **CC BY-NC 4.0** | HuggingFace `ailsntua/Chordonomicon`, parquet, 264 Mo |
| **iRb** (Broze et Shanahan, OSU) | 1 185 standards de jazz, grilles complètes par section (A, A2, B…) avec durées en temps | titre, compositeur, année, tonalité, mineur/majeur, mesure | « librement disponible pour la recherche musicale » (OSU) ; pas de licence formelle | paquet npm `sharp11-irb` 1.0.0 (2,5 Mo, JSON), 988 symboles d'accords distincts |
| **McGill Billboard** (Burgoyne, Wild, Fujinaga, 2011) | 890 entrées du Billboard Hot 100 (1958–1991), 740 morceaux distincts, accords annotés à la main avec structure et tonique | titre, artiste, date de classement, rang, semaines au classement | **CC0** (citer l'article ISMIR 2011) | `billboard-2.0-index.csv` + `billboard-2.0-salami_chords.tar.gz` (liens Dropbox listés par mirdata, sommes de contrôle connues) |
| **Weimar Jazz Database** (Jazzomat, HfM Weimar) | 456 solos transcrits note à note, avec la grille sous-jacente | titre, soliste, année, style, tempo | « open access », citer *Inside the Jazzomat* (2017) ; conditions détaillées non trouvées, **à confirmer par courriel** avant publication | SQLite unique, jazzomat.hfm-weimar.de/download |

Non retenu : Isophonics (Beatles…), petit et redondant avec Billboard ; Hooktheory, API sous licence commerciale.

## Ce que ça change dans les cadrages

- **Les titres d'exemple viennent d'iRb et de Billboard**, pas de Chordonomicon (qui n'a que des identifiants Spotify). Chordonomicon donne les volumes, les genres et les décennies.
- **Chordonomicon n'a pas de tonalité** : il faut l'estimer depuis les accords. Le pipeline le fera avec une heuristique simple (meilleure tonalité majeure ou mineure au sens des degrés diatoniques, pondérée par la durée), **mesurée sur iRb et Billboard où la tonalité est connue** ; la précision est publiée dans `REPORT.md` et affichée dans « Ce que ça ne dit pas ». Si elle est sous 85 %, on limite Chordonomicon aux analyses qui n'en dépendent pas (transitions en intervalles de fondamentales).
- **Attribution partout** : licence CC BY-NC (le site est non commercial), CC0, et citations demandées dans « D'où viennent les chiffres ».
- **Aucun extrait audio, aucune parole, aucune mélodie** n'est redistribué : uniquement des suites de symboles d'accords, qui ne sont pas protégées, et des titres. Les solos de Weimar sont résumés en statistiques par accord, jamais réédités note à note.
- **Poids** : Chordonomicon ne sera jamais servi tel quel ; le pipeline en tire des agrégats (comptages par progression, par transition, par genre, par décennie) de quelques centaines de Ko.

## Socle commun aux six pages

Un module `src/shell/music/chords.ts` (pur, testé) : lecture d'un symbole d'accord (`Csmin7`, `F#ø7`, `Bb/D`, `N`) en fondamentale, qualité et basse ; réduction à quelques qualités (majeur, mineur, septième, majeur 7, mineur 7, diminué, demi-diminué, suspendu, augmenté, autre) ; degré romain par rapport à une tonalité ; estimation de tonalité. Un module `tools/lib/corpora.ts` : téléchargement avec cache et lecture des trois corpus dans un format commun `{ id, titre?, artiste?, annee?, genre?, tonalite?, sections: [{ nom, accords: [{ symbole, temps }] }] }`. Chaque page a ensuite son propre pipeline et ses propres agrégats.
