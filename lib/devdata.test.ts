// Futtatás: npm test
// A public/data/ illusztratív fejlesztői adatainak ellenőrzése.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { szamolProfil, type Munkakor, type ProfilTipus } from './scoring.ts';

const betolt = (fajl: string) =>
  JSON.parse(readFileSync(new URL(`../public/data/${fajl}`, import.meta.url), 'utf8'));

// Ugyanazok a típusok, mint a scoring.test.ts-ben
const vartTipus: Record<string, ProfilTipus> = {
  'ugyfelszolgalati-munkatars': 'Átalakuló',
  'szoftverfejleszto': 'Felerősödő',
  'villanyszerelo': 'Védett',
  'konyvelo': 'Kevert',
};

test('mind a négy munkakör JSON betölthető, és a pontozás a várt típust adja', () => {
  for (const [slug, tipus] of Object.entries(vartTipus)) {
    const m: Munkakor = betolt(`${slug}.json`);
    assert.equal(m.slug, slug);
    const p = szamolProfil(m);
    assert.equal(p.tipus, tipus, slug);
    assert.equal(p.orak.kivalthato + p.orak.felgyorsul + p.orak.emberi, m.hetiOra, slug);
  }
});

test('kötelező mezők és indexelhetőség', () => {
  for (const slug of Object.keys(vartTipus)) {
    const m = betolt(`${slug}.json`);
    assert.equal(m.adatVerzio, 'fejlesztoi', slug);
    assert.ok(m.teendo.trim(), slug);
    for (const n of ['fizikai', 'felelosseg', 'szabalyozas', 'bizalom']) assert.ok(m.fekIndoklas[n]?.trim(), `${slug}.${n}`);
    assert.equal(m.indexelheto, slug === 'ugyfelszolgalati-munkatars' || slug === 'konyvelo', slug);
  }
});

test('kereso.json: mind a négy munkakör, magyar ábécérendben', () => {
  const kereso: { slug: string; nev: string; aliasok: string[] }[] = betolt('kereso.json');
  assert.deepEqual(kereso.map((k) => k.slug).sort(), Object.keys(vartTipus).sort());
  const nevek = kereso.map((k) => k.nev);
  assert.deepEqual(nevek, [...nevek].sort((a, b) => a.localeCompare(b, 'hu')));
  for (const k of kereso) assert.ok(k.aliasok.length > 0, k.slug);
});
