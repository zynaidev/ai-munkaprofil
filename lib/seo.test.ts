// Futtatás: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { metaLeiras, nevelo, ogCim, ogLeiras, oldalUrl, seoCim, statikusMeta, TARGYESET } from './seo.ts';
import { getIndexelhetoSlugok, getMunkakor } from './data.ts';
import { szamolProfil } from './scoring.ts';
import { TIPUSOK } from './tipusok.ts';
import { csvIndexelheto, csvSorok, nyersMunkakorok } from './tesztSegedek.ts';

test('minden munkakörnek van tárgyesetes alakja a címhez (tobbes vagy szótár), az indexelhetőknek különösen', () => {
  // Szigorúbb a korábbinál: nem csak az indexelhetőkre, hanem az összes munkakörre ellenőrzi,
  // mert a valós adatban jelenleg nincs indexelhető munkakör, de bármelyik azzá válhat.
  const csv = csvSorok();
  const munkakorok = nyersMunkakorok();
  assert.ok(csv.length > 0 && munkakorok.length > 0);
  const csvTobbes = new Map(csv.map((s) => [s.slug, s.tobbes ?? '']));
  for (const m of munkakorok) {
    assert.ok(m.tobbes?.trim() || TARGYESET[m.slug], `nincs tárgyesetes alak: ${m.slug}`);
    assert.match(seoCim(m.slug, m.nev, m.tobbes), /^Elveszi az AI az? .+ munkáját\? \| AI-Munkaprofil$/, m.slug);
    // a fájl és a forrás-CSV ugyanazt a tobbes-alakot adja
    if (csvTobbes.get(m.slug)) assert.equal(m.tobbes, csvTobbes.get(m.slug), m.slug);
  }
  for (const s of csv.filter((r) => csvIndexelheto(r.indexelheto))) assert.ok(s.tobbes || TARGYESET[s.slug], s.slug);
  for (const slug of getIndexelhetoSlugok()) {
    const m = munkakorok.find((x) => x.slug === slug);
    assert.ok(m?.tobbes || TARGYESET[slug], slug);
  }
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
  assert.equal(oldalUrl('https://ai-munkaprofil.zynai.hu/'), 'https://ai-munkaprofil.zynai.hu');
  assert.equal(oldalUrl(' https://ai-munkaprofil.zynai.hu '), 'https://ai-munkaprofil.zynai.hu');
  assert.equal(oldalUrl(''), 'http://localhost:3000');
  assert.equal(oldalUrl(undefined), 'http://localhost:3000');
});

const OG_KEP = 'public/brand/og-fooldal.png';

test('a kezdőoldali OG-kép valódi PNG, 1200×630, 300 KB alatt', () => {
  const fajl = readFileSync(OG_KEP);
  assert.deepEqual([...fajl.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'PNG-aláírás');
  assert.equal(fajl.subarray(12, 16).toString('latin1'), 'IHDR');
  assert.equal(fajl.readUInt32BE(16), 1200, 'szélesség');
  assert.equal(fajl.readUInt32BE(20), 630, 'magasság');
  assert.ok(statSync(OG_KEP).size < 300 * 1024, 'legfeljebb 300 KB');
});

test('statikusMeta: cím, leírás, canonical, Open Graph és Twitter-kártya', () => {
  const m = statikusMeta('/modszertan', 'Módszertan', 'Honnan jönnek a számok?');
  assert.equal(m.title, 'Módszertan');
  assert.equal(m.description, 'Honnan jönnek a számok?');
  assert.equal(m.alternates?.canonical, '/modszertan');
  const og = m.openGraph as Record<string, unknown>;
  assert.equal(og.siteName, 'AI-Munkaprofil');
  assert.equal(og.locale, 'hu_HU');
  assert.equal(og.type, 'website');
  assert.equal(og.url, '/modszertan');
  assert.equal(og.title, 'Módszertan');
  assert.equal(og.description, 'Honnan jönnek a számok?');
  const kep = (og.images as Record<string, unknown>[])[0];
  assert.equal(kep.url, '/brand/og-fooldal.png');
  assert.equal(kep.width, 1200);
  assert.equal(kep.height, 630);
  assert.ok(typeof kep.alt === 'string' && kep.alt.length > 0, 'alt');
  const tw = m.twitter as Record<string, unknown>;
  assert.equal(tw.card, 'summary_large_image');
  assert.equal(tw.title, 'Módszertan');
  assert.equal(tw.description, 'Honnan jönnek a számok?');
  assert.deepEqual(tw.images, ['/brand/og-fooldal.png']);
});

test('statikusMeta: a kezdőoldal útvonala „/”, nincs beégetett domain', () => {
  const m = statikusMeta('/', 'Cím', 'Leírás');
  assert.equal(m.alternates?.canonical, '/');
  assert.equal((m.openGraph as Record<string, unknown>).url, '/');
  assert.doesNotMatch(JSON.stringify(m), /https?:\/\//);
});
