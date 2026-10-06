// Futtatás: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ellenorizMunkakor, getIndexelhetoSlugok, getMunkakor, getOsszesSlug } from './data.ts';

test('létező slug: a munkakör betöltődik, minden mezővel', () => {
  const m = getMunkakor('konyvelo');
  assert.ok(m);
  assert.equal(m.nev, 'Könyvelő');
  assert.equal(m.hetiOra, 40);
  assert.equal(m.fekek.szabalyozas, 3);
  assert.ok(m.fekIndoklas.bizalom.length > 0);
  assert.ok(m.teendo.length > 0);
  assert.equal(m.indexelheto, true);
  assert.equal(m.adatVerzio, 'fejlesztoi');
  assert.equal(m.feladatok.length, 4);
});

test('ismeretlen slug → null', () => {
  assert.equal(getMunkakor('nem-letezo-munkakor'), null);
});

test('érvénytelen slugok és path traversal → null', () => {
  for (const slug of ['../package', '..%2fpackage', '..%2F..%2Fpackage', '..\\package', '', 'Konyvelo', 'KONYVELO',
    'konyvelo.json', 'konyvelo/', ' konyvelo', 'kereso']) {
    assert.equal(getMunkakor(slug), null, JSON.stringify(slug));
  }
  assert.equal(getMunkakor(undefined as unknown as string), null);
});

test('összes slug a kereső indexéből', () => {
  assert.deepEqual(getOsszesSlug(), ['konyvelo', 'szoftverfejleszto', 'ugyfelszolgalati-munkatars', 'villanyszerelo']);
});

test('indexelhető slugok', () => {
  assert.deepEqual(getIndexelhetoSlugok(), ['konyvelo', 'ugyfelszolgalati-munkatars']);
});

test('alakellenőrzés: hiányzó vagy hibás mezőnél érthető hiba', () => {
  const ep = JSON.parse(readFileSync(new URL('../public/data/konyvelo.json', import.meta.url), 'utf8'));
  assert.doesNotThrow(() => ellenorizMunkakor(ep));

  const nelkul = (kulcs: string) => Object.fromEntries(Object.entries(ep).filter(([k]) => k !== kulcs));
  assert.throws(() => ellenorizMunkakor(nelkul('teendo'), 'teszt.json'), /teszt\.json: a\(z\) "teendo" mező/);
  assert.throws(() => ellenorizMunkakor(nelkul('indexelheto')), /"indexelheto"/);
  assert.throws(() => ellenorizMunkakor({ ...ep, fekIndoklas: { ...ep.fekIndoklas, bizalom: undefined } }), /"fekIndoklas\.bizalom"/);
  assert.throws(() => ellenorizMunkakor({ ...ep, fekek: { ...ep.fekek, fizikai: 5 } }), /"fekek\.fizikai"/);
  const rosszFeladat = { ...ep, feladatok: [...ep.feladatok.slice(0, 2), { ...ep.feladatok[2], horizont: 'holnap' }] };
  assert.throws(() => ellenorizMunkakor(rosszFeladat), /"feladatok\[2\]\.horizont"/);
  assert.throws(() => ellenorizMunkakor([]), /nem objektum/);
});
