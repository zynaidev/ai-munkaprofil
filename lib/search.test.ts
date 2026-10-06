// Futtatás: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { indexel, keres, normalizal, MAX_TALALAT, type KeresoForras } from './search.ts';

const kereso: KeresoForras[] = JSON.parse(readFileSync(new URL('../public/data/kereso.json', import.meta.url), 'utf8'));
const index = indexel(kereso);
const slugok = (q: string) => keres(index, q).map((t) => t.slug);

test('normalizálás: kisbetű, ékezet nélkül', () => {
  assert.equal(normalizal('  ÜGYFÉL-szolgálat  Őr '), 'ugyfel szolgalat or');
});

test('„ugyfel”, „ügyfél” és „call” is az ügyfélszolgálatot adja', () => {
  for (const q of ['ugyfel', 'ügyfél', 'ÜGYFÉL', 'call', 'Call Center']) {
    assert.deepEqual(slugok(q), ['ugyfelszolgalati-munkatars'], q);
  }
});

test('aliasra is talál (programozó → szoftverfejlesztő)', () => {
  assert.deepEqual(slugok('programozo'), ['szoftverfejleszto']);
});

test('üres és értelmetlen szövegre üres lista', () => {
  for (const q of ['', '   ', '-.,', 'xqzzy', 'könyvelő villanyszerelő']) {
    assert.deepEqual(keres(index, q), [], JSON.stringify(q));
  }
});

test('a névre illeszkedés előrébb kerül, mint az aliasra', () => {
  const sajat = indexel([
    { slug: 'alias-talalat', nev: 'Adatrögzítő', aliasok: ['könyvelési asszisztens'] },
    { slug: 'nev-talalat', nev: 'Könyvelő', aliasok: [] },
  ]);
  assert.deepEqual(keres(sajat, 'konyv').map((t) => t.slug), ['nev-talalat', 'alias-talalat']);
});

test(`legfeljebb ${MAX_TALALAT} találat`, () => {
  const sok = indexel(Array.from({ length: 10 }, (_, i) => ({ slug: `szerelo-${i}`, nev: `Szerelő ${i}`, aliasok: [] })));
  assert.equal(keres(sok, 'szerelo').length, MAX_TALALAT);
});
