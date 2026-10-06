// Futtatás: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ora, oraSzam, szelesseg } from './format.ts';

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
