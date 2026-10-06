// Futtatás: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ervenyesit, MAX_SZOVEG, tisztit } from './visszajelzes.ts';

test('tisztít: trimel, összevonja a szóközöket', () => {
  assert.deepEqual(tisztit('  adó   tanácsadó \n'), { allapot: 'ok', szoveg: 'adó tanácsadó' });
});

test('tisztít: üres szöveg elutasítva', () => {
  for (const s of ['', '   ', '\n\t']) assert.deepEqual(tisztit(s), { allapot: 'ures' });
});

test('tisztít: túl hosszú szöveg elutasítva', () => {
  assert.deepEqual(tisztit('a'.repeat(MAX_SZOVEG)), { allapot: 'ok', szoveg: 'a'.repeat(MAX_SZOVEG) });
  assert.deepEqual(tisztit('a'.repeat(MAX_SZOVEG + 1)), { allapot: 'hosszu' });
});

test('tisztít: e-mail-szerű szöveget eldob', () => {
  for (const s of ['kovacs.janos@gmail.com', 'könyvelő, írj: a@b.hu', 'x (at) y.hu'.replace(' (at) ', '@')]) {
    assert.deepEqual(tisztit(s), { allapot: 'eldob' }, s);
  }
});

test('tisztít: telefonszám-szerű szöveget eldob, a rövid számot nem', () => {
  for (const s of ['+36 30 123 4567', 'hívj: 06-30-1234567', '(1) 234-5678']) assert.deepEqual(tisztit(s), { allapot: 'eldob' }, s);
  assert.deepEqual(tisztit('3D grafikus'), { allapot: 'ok', szoveg: '3D grafikus' });
  assert.deepEqual(tisztit('B2B értékesítő 2026'), { allapot: 'ok', szoveg: 'B2B értékesítő 2026' });
});

test('érvényesít: normál „nincs-találat”', () => {
  assert.deepEqual(ervenyesit({ tipus: 'nincs-talalat', szoveg: '  kertész ' }), { ok: true, adat: { tipus: 'nincs-talalat', szoveg: 'kertész' } });
});

test('érvényesít: e-mailes szöveg → siker, de eldobva', () => {
  assert.deepEqual(ervenyesit({ tipus: 'nincs-talalat', szoveg: 'en@pelda.hu' }), { ok: true, eldobva: true });
});

test('érvényesít: üres vagy túl hosszú szöveg hiba', () => {
  assert.equal(ervenyesit({ tipus: 'nincs-talalat', szoveg: ' ' }).ok, false);
  assert.equal(ervenyesit({ tipus: 'nincs-talalat', szoveg: 'x'.repeat(81) }).ok, false);
  assert.equal(ervenyesit({ tipus: 'nincs-talalat' }).ok, false);
  assert.equal(ervenyesit({ tipus: 'nincs-talalat', szoveg: 42 }).ok, false);
});

test('érvényesít: normál „szint-egyezés”, csak a szükséges mezők mennek tovább', () => {
  assert.deepEqual(
    ervenyesit({ tipus: 'szint-egyezes', slug: 'konyvelo', szint: 3, egyezik: false, szoveg: 'nem kell', extra: 1 }),
    { ok: true, adat: { tipus: 'szint-egyezes', slug: 'konyvelo', szint: 3, egyezik: false } },
  );
});

test('érvényesít: érvénytelen szint', () => {
  for (const szint of [0, 5, 2.5, '3', null, undefined]) {
    assert.equal(ervenyesit({ tipus: 'szint-egyezes', slug: 'konyvelo', szint, egyezik: true }).ok, false, String(szint));
  }
});

test('érvényesít: érvénytelen slug vagy egyezik', () => {
  for (const slug of ['Konyvelo', '../x', '', 'a'.repeat(81), 3]) {
    assert.equal(ervenyesit({ tipus: 'szint-egyezes', slug, szint: 1, egyezik: true }).ok, false, String(slug));
  }
  assert.equal(ervenyesit({ tipus: 'szint-egyezes', slug: 'konyvelo', szint: 1, egyezik: 'igen' }).ok, false);
});

test('érvényesít: ismeretlen típus és nem objektum', () => {
  for (const x of [{ tipus: 'spam' }, {}, null, 'szöveg', [1]]) assert.equal(ervenyesit(x).ok, false, JSON.stringify(x));
});
