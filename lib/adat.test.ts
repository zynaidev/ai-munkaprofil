// Futtatás: npm test
// A public/data/ valós munkakör-adatainak ellenőrzése (a pipeline exportja). Az elvárások az adatból és az
// adat/munkakorok.csv-ből jönnek, nem beégetett slugokból; a típusokat néhány biztos munkakörön rögzítjük.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { szamolProfil, type Munkakor, type ProfilTipus } from './scoring.ts';
import { TIPUSOK } from './tipusok.ts';
import {
  adatFajlnevek, csvIndexelheto, csvSorok, kulcsSorrend, magyarRendezoKulcs, nyersKereso, nyersMunkakorok,
} from './tesztSegedek.ts';

// Mind a négy szintre egy-egy valós munkakör (az egyindexes modell szerint; lásd adat/eloszlas.mts)
const vartTipus: Record<string, ProfilTipus> = {
  adatrogzito: 'automatizalodo',
  szoftverfejleszto: 'atalakulo',
  jogasz: 'felerosodo',
  apolo: 'vedett',
};

test('minden munkakör-JSON betölthető, az órák összege a heti óra; a kijelölt munkakörök a várt szintet kapják', () => {
  const munkakorok = nyersMunkakorok();
  assert.ok(munkakorok.length >= 4);
  for (const m of munkakorok) {
    const p = szamolProfil(m as unknown as Munkakor);
    assert.equal(p.orak.kivalthato + p.orak.felgyorsul + p.orak.emberi, m.hetiOra, m.slug);
  }
  for (const [slug, tipus] of Object.entries(vartTipus)) {
    const m = munkakorok.find((x) => x.slug === slug);
    assert.ok(m, `hiányzik az adatból: ${slug}`);
    const p = szamolProfil(m as unknown as Munkakor);
    assert.equal(p.tipus, tipus, slug);
    assert.equal(p.szint, TIPUSOK[tipus].szint, slug);
  }
});

test('kötelező mezők; az adatverzió egységes; az indexelhetőség egyezik a munkakorok.csv-vel', () => {
  const munkakorok = nyersMunkakorok();
  const csv = new Map(csvSorok().map((s) => [s.slug, s]));
  const verziok = new Set(munkakorok.map((m) => m.adatVerzio));
  assert.equal(verziok.size, 1, `több adatverzió: ${[...verziok].join(', ')}`);
  for (const m of munkakorok) {
    assert.ok(m.adatVerzio.trim(), m.slug);
    assert.ok(m.teendo.trim(), m.slug);
    for (const n of ['fizikai', 'felelosseg', 'szabalyozas', 'bizalom']) assert.ok(m.fekIndoklas[n]?.trim(), `${m.slug}.${n}`);
    assert.equal(typeof m.indexelheto, 'boolean', m.slug);
    const sor = csv.get(m.slug);
    assert.ok(sor, `nincs a munkakorok.csv-ben: ${m.slug}`);
    assert.equal(m.indexelheto, csvIndexelheto(sor.indexelheto), m.slug);
  }
});

test('kereso.json: pontosan a munkakör-fájlok, a pipeline magyar ábécérendjében, aliasokkal', () => {
  const kereso = nyersKereso();
  assert.deepEqual(kereso.map((k) => k.slug).sort(), adatFajlnevek().map((f) => f.replace(/\.json$/, '')).sort());
  const kulcsok = kereso.map((k) => magyarRendezoKulcs(k.nev));
  assert.deepEqual(kulcsok, [...kulcsok].sort(kulcsSorrend));
  for (const k of kereso) assert.ok(k.aliasok.length > 0, k.slug);
});
