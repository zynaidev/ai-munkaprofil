// Futtatás: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { metaLeiras, nevelo, ogCim, ogLeiras, oldalUrl, seoCim, TARGYESET } from './seo.ts';
import { getIndexelhetoSlugok, getMunkakor } from './data.ts';
import { szamolProfil } from './scoring.ts';
import { TIPUSOK } from './tipusok.ts';

test('a szótárban benne van minden indexelhető munkakör (munkakorok.csv és public/data)', () => {
  const csv = readFileSync(new URL('../adat/munkakorok.csv', import.meta.url), 'utf8').trim().split(/\r?\n/);
  const fejlec = csv[0].split(',');
  const iSlug = fejlec.indexOf('slug');
  const iIdx = fejlec.indexOf('indexelheto');
  const csvIndexelhetok = csv.slice(1).map((s) => s.split(',')).filter((s) => s[iIdx] === 'true').map((s) => s[iSlug]);
  assert.ok(csvIndexelhetok.length > 0);
  for (const slug of [...csvIndexelhetok, ...getIndexelhetoSlugok()]) assert.ok(TARGYESET[slug], slug);
});

test('SEO-cím tárgyesettel és helyes névelővel', () => {
  assert.equal(seoCim('konyvelo', 'Könyvelő'), 'Elveszi az AI a könyvelők munkáját? | AI-Munkaprofil');
  assert.equal(
    seoCim('ugyfelszolgalati-munkatars', 'Ügyfélszolgálati munkatárs'),
    'Elveszi az AI az ügyfélszolgálati munkatársak munkáját? | AI-Munkaprofil',
  );
  assert.equal(seoCim('adatrogzito', 'Adatrögzítő'), 'Elveszi az AI az adatrögzítők munkáját? | AI-Munkaprofil');
  assert.equal(seoCim('hr-munkatars', 'HR-munkatárs'), 'Elveszi az AI a HR-munkatársak munkáját? | AI-Munkaprofil');
});

test('a munkakör saját „tobbes” mezője elsőbbséget kap, névelővel', () => {
  assert.equal(seoCim('villanyszerelo', 'Villanyszerelő', 'villanyszerelők'), 'Elveszi az AI a villanyszerelők munkáját? | AI-Munkaprofil');
  assert.equal(seoCim('x', 'Ápoló', 'ápolók'), 'Elveszi az AI az ápolók munkáját? | AI-Munkaprofil');
  assert.equal(seoCim('konyvelo', 'Könyvelő', 'mérlegképes könyvelők'), 'Elveszi az AI a mérlegképes könyvelők munkáját? | AI-Munkaprofil');
  // üres vagy csak szóköz: mintha nem lenne (a szótár, majd a tartalék cím marad)
  assert.equal(seoCim('konyvelo', 'Könyvelő', '  '), 'Elveszi az AI a könyvelők munkáját? | AI-Munkaprofil');
  assert.equal(seoCim('villanyszerelo', 'Villanyszerelő', ''), 'Villanyszerelő és az AI | AI-Munkaprofil');
});

test('hiányzó slugnál: „{nev} és az AI | AI-Munkaprofil”', () => {
  assert.equal(seoCim('villanyszerelo', 'Villanyszerelő'), 'Villanyszerelő és az AI | AI-Munkaprofil');
});

test('névelő', () => {
  for (const [szo, v] of [['Ügyfél', 'az'], ['őr', 'az'], ['Építész', 'az'], ['könyvelő', 'a'], ['HR', 'a']] as const) {
    assert.equal(nevelo(szo), v, szo);
  }
});

test('meta- és OG-szövegek a copy szerint, a pontozás eredményéből', () => {
  const m = getMunkakor('konyvelo');
  assert.ok(m);
  const p = szamolProfil(m);
  const { kivalthato, felgyorsul, emberi } = p.orak;
  assert.equal(
    metaLeiras(p),
    `Könyvelő: ${kivalthato} óra kiváltható, ${felgyorsul} óra felgyorsul, ${emberi} óra marad emberi. Kutatási adatokon alapuló, feladatonkénti elemzés.`,
  );
  assert.equal(ogCim(p), 'Könyvelő: Átalakuló | AI-Munkaprofil');
  assert.equal(TIPUSOK[p.tipus].cimke, 'Átalakuló');
  assert.equal(
    ogLeiras(p),
    `A heti 40 órából ${kivalthato} óra kiváltható, ${emberi} óra emberi mag. Nézd meg a saját munkakörödet!`,
  );
});

test('oldal-URL: záró perjel nélkül, alapértelmezés localhost', () => {
  assert.equal(oldalUrl('https://teszt.zynai.hu/'), 'https://teszt.zynai.hu');
  assert.equal(oldalUrl(' https://teszt.zynai.hu '), 'https://teszt.zynai.hu');
  assert.equal(oldalUrl(''), 'http://localhost:3000');
  assert.equal(oldalUrl(undefined), 'http://localhost:3000');
});
