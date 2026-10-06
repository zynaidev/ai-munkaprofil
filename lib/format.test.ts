// Futtatás: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { egeszOra, horizontEgeszOrak, ora, oraSzam, szelesseg } from './format.ts';
import { getOsszesSlug, getMunkakor } from './data.ts';
import { szamolProfil } from './scoring.ts';

test('óraszám: egy tizedes, tizedesvessző, egésznél tizedes nélkül', () => {
  assert.equal(oraSzam(12.5), '12,5');
  assert.equal(oraSzam(19), '19');
  assert.equal(oraSzam(40.0), '40');
  assert.equal(oraSzam(9.25), '9,3');
  assert.equal(oraSzam(1.04), '1');
  assert.equal(oraSzam(0), '0');
  assert.equal(oraSzam(-0.01), '0');
  assert.throws(() => oraSzam(Number.NaN));
});

test('ragozás: alanyeset és tárgyeset', () => {
  assert.equal(ora(19), '19 óra');
  assert.equal(ora(12.5), '12,5 óra');
  assert.equal(ora(1), '1 óra');
  assert.equal(ora(4, 'targy'), '4 órát');
  assert.equal(ora(10.5, 'targy'), '10,5 órát');
});

test('sávszélesség', () => {
  assert.equal(szelesseg(19, 40), '47.5%');
  assert.equal(szelesseg(10, 40), '25%');
  assert.equal(szelesseg(0, 40), '0%');
  assert.equal(szelesseg(1, 3), '33.33%');
  assert.equal(szelesseg(50, 40), '100%');
  assert.equal(szelesseg(5, 0), '0%');
});

test('egész óra', () => {
  assert.equal(egeszOra(10.5), 11);
  assert.equal(egeszOra(10.4), 10);
  assert.equal(egeszOra(2.7), 3);
  assert.equal(egeszOra(-0.2), 0);
});

test('horizont-órák: egészek, összegük pontosan a kiváltható óra', () => {
  // ügyfélszolgálat: 12,5 + 5,8 + 0,4 = 18,7 → a sávon 19 kiváltható óra
  assert.deepEqual(horizontEgeszOrak({ ma: 12.5, '1-3ev': 5.8, '5ev+': 0.4 }, 19), { ma: 13, '1-3ev': 6, '5ev+': 0 });
  assert.deepEqual(horizontEgeszOrak({ ma: 0, '1-3ev': 0, '5ev+': 0 }, 0), { ma: 0, '1-3ev': 0, '5ev+': 0 });
  for (const slug of getOsszesSlug()) {
    const m = getMunkakor(slug);
    assert.ok(m);
    const p = szamolProfil(m);
    const h = horizontEgeszOrak(p.kivalthatoHorizontSzerint, p.orak.kivalthato);
    assert.equal(h.ma + h['1-3ev'] + h['5ev+'], p.orak.kivalthato, slug);
    for (const v of Object.values(h)) assert.ok(Number.isInteger(v) && v >= 0, slug);
  }
});
