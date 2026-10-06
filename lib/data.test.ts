// Futtatás: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { nyersKereso, nyersMunkakorok } from './tesztSegedek.ts';
import { adatVerzioFelirat, ellenorizMunkakor, getAdatVerzio, getIndexelhetoSlugok, getMunkakor, getOsszesSlug } from './data.ts';

test('létező slug: a munkakör betöltődik, minden mezővel', () => {
  const m = getMunkakor('konyvelo');
  assert.ok(m);
  // az elvárt értékek a nyers fájlból, a betöltőtől függetlenül
  const nyers = nyersMunkakorok().find((x) => x.slug === 'konyvelo');
  assert.ok(nyers);
  assert.equal(m.nev, 'Könyvelő');
  assert.equal(m.hetiOra, 40);
  assert.deepEqual(m.fekek, nyers.fekek);
  assert.ok(m.fekIndoklas.bizalom.length > 0);
  assert.ok(m.teendo.length > 0);
  assert.equal(m.indexelheto, nyers.indexelheto);
  assert.equal(m.adatVerzio, nyers.adatVerzio);
  assert.equal(m.feladatok.length, (nyers.feladatok as unknown[]).length);
  assert.ok(m.feladatok.length > 0);
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
  const vart = nyersKereso().map((k) => k.slug);
  assert.ok(vart.length > 0);
  assert.deepEqual(getOsszesSlug(), vart);
});

test('adatverzió az adatból, olvasható felirattal', () => {
  const verziok = [...new Set(nyersMunkakorok().map((m) => m.adatVerzio))];
  assert.equal(verziok.length, 1);
  assert.equal(getAdatVerzio(), verziok[0]);
  assert.equal(adatVerzioFelirat('fejlesztoi'), 'fejlesztői');
  assert.equal(adatVerzioFelirat('2026-Q4'), '2026-Q4');
});

test('indexelhető slugok: a valós adatban a fájlok indexelheto mezője szerint, a kereső sorrendjében', () => {
  const zaszlo = new Map(nyersMunkakorok().map((m) => [m.slug, m.indexelheto]));
  const vart = nyersKereso().map((k) => k.slug).filter((s) => zaszlo.get(s) === true);
  assert.deepEqual(getIndexelhetoSlugok(), vart);
});

test('indexelhető slugok: valós fájlokból épített mintán csak a megjelöltek, a kereső sorrendjében', () => {
  // A valós adatban jelenleg nincs indexelhető munkakör, ezért a pozitív ágat egy ideiglenes mintán is ellenőrizzük.
  const kereso = nyersKereso().slice(0, 3);
  const munkakorok = new Map(nyersMunkakorok().map((m) => [m.slug, m]));
  const minta = mkdtempSync(path.join(tmpdir(), 'munkaprofil-'));
  const eredeti = process.cwd();
  try {
    mkdirSync(path.join(minta, 'public', 'data'), { recursive: true });
    writeFileSync(path.join(minta, 'public', 'data', 'kereso.json'), JSON.stringify(kereso));
    kereso.forEach((k, i) => {
      const m = { ...munkakorok.get(k.slug), indexelheto: i !== 1 }; // az 1. és a 3. indexelhető
      writeFileSync(path.join(minta, 'public', 'data', `${k.slug}.json`), JSON.stringify(m));
    });
    process.chdir(minta);
    assert.deepEqual(getIndexelhetoSlugok(), [kereso[0].slug, kereso[2].slug]);
  } finally {
    process.chdir(eredeti);
    rmSync(minta, { recursive: true, force: true });
  }
});

test('opcionális „tobbes”: hiányzó, üres és kitöltött is érvényes; nem szöveg hiba', () => {
  const ep = JSON.parse(readFileSync(new URL('../public/data/villanyszerelo.json', import.meta.url), 'utf8'));
  const nelkule = Object.fromEntries(Object.entries(ep).filter(([k]) => k !== 'tobbes'));
  assert.equal(ellenorizMunkakor(nelkule).tobbes, undefined);
  assert.equal(ellenorizMunkakor({ ...ep, tobbes: '' }).tobbes, undefined);
  assert.equal(ellenorizMunkakor({ ...ep, tobbes: '   ' }).tobbes, undefined);
  assert.equal(ellenorizMunkakor({ ...ep, tobbes: ' villanyszerelők ' }).tobbes, 'villanyszerelők');
  assert.throws(() => ellenorizMunkakor({ ...ep, tobbes: 42 }), /"tobbes"/);
  assert.equal(getMunkakor('konyvelo')?.tobbes, 'könyvelők'); // a dev adatban kézzel felvéve
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
