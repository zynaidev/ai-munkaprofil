// Futtatás: npm test
// A mintaszámok ILLUSZTRATÍVAK – a logikát tesztelik, nem valós kutatási adatok.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { szamolProfil, egeszreKerekit, type Munkakor } from './scoring.ts';

const ugyfelszolgalat: Munkakor = {
  slug: 'ugyfelszolgalati-munkatars', nev: 'Ügyfélszolgálati munkatárs', hetiOra: 40,
  fekek: { fizikai: 0, felelosseg: 1, szabalyozas: 1, bizalom: 2 },
  feladatok: [
    { leiras: 'Rutin írásos megkeresések megválaszolása', idoArany: 0.30, kitettseg: 0.95, kivaltasArany: 0.8, horizont: 'ma', csatorna: 'irasos' },
    { leiras: 'Telefonos első szintű ügyintézés', idoArany: 0.30, kitettseg: 0.8, kivaltasArany: 0.6, horizont: '1-3ev', csatorna: 'telefon' },
    { leiras: 'Adatrögzítés, ügyféladatok frissítése', idoArany: 0.10, kitettseg: 0.95, kivaltasArany: 0.9, horizont: 'ma' },
    { leiras: 'Eszkalált panaszok kezelése', idoArany: 0.20, kitettseg: 0.4, kivaltasArany: 0.1, horizont: '5ev+', csatorna: 'telefon', emberiMag: true },
    { leiras: 'Kivételes esetek egyeztetése a háttércsapattal', idoArany: 0.10, kitettseg: 0.3, kivaltasArany: 0.1, horizont: '5ev+', emberiMag: true },
  ],
};

const programozo: Munkakor = {
  slug: 'szoftverfejleszto', nev: 'Szoftverfejlesztő', hetiOra: 40,
  fekek: { fizikai: 0, felelosseg: 2, szabalyozas: 1, bizalom: 1 },
  feladatok: [
    { leiras: 'Kódírás', idoArany: 0.35, kitettseg: 0.9, kivaltasArany: 0.25, horizont: '1-3ev' },
    { leiras: 'Hibakeresés', idoArany: 0.20, kitettseg: 0.8, kivaltasArany: 0.2, horizont: '1-3ev' },
    { leiras: 'Dokumentáció', idoArany: 0.10, kitettseg: 0.9, kivaltasArany: 0.5, horizont: 'ma' },
    { leiras: 'Rendszertervezés, egyeztetés', idoArany: 0.25, kitettseg: 0.5, kivaltasArany: 0.05, horizont: '5ev+', emberiMag: true },
    { leiras: 'Code review', idoArany: 0.10, kitettseg: 0.7, kivaltasArany: 0.2, horizont: '1-3ev' },
  ],
};

const villanyszerelo: Munkakor = {
  slug: 'villanyszerelo', nev: 'Villanyszerelő', hetiOra: 40,
  fekek: { fizikai: 3, felelosseg: 3, szabalyozas: 2, bizalom: 1 },
  feladatok: [
    { leiras: 'Szerelés a helyszínen', idoArany: 0.6, kitettseg: 0.05, kivaltasArany: 0.1, horizont: '5ev+', emberiMag: true },
    { leiras: 'Hibafeltárás', idoArany: 0.2, kitettseg: 0.3, kivaltasArany: 0.1, horizont: '5ev+', emberiMag: true },
    { leiras: 'Árajánlat, adminisztráció', idoArany: 0.2, kitettseg: 0.9, kivaltasArany: 0.6, horizont: 'ma' },
  ],
};

const konyvelo: Munkakor = {
  slug: 'konyvelo', nev: 'Könyvelő', hetiOra: 40,
  fekek: { fizikai: 0, felelosseg: 3, szabalyozas: 3, bizalom: 2 },
  feladatok: [
    { leiras: 'Bizonylatok rögzítése, kontírozás', idoArany: 0.35, kitettseg: 0.95, kivaltasArany: 0.7, horizont: 'ma' },
    { leiras: 'Bevallások elkészítése', idoArany: 0.25, kitettseg: 0.8, kivaltasArany: 0.4, horizont: '1-3ev' },
    { leiras: 'Ügyféltanácsadás', idoArany: 0.25, kitettseg: 0.5, kivaltasArany: 0.1, horizont: '5ev+', emberiMag: true },
    { leiras: 'Egyeztetés hatóságokkal', idoArany: 0.15, kitettseg: 0.4, kivaltasArany: 0.1, horizont: '5ev+', emberiMag: true },
  ],
};

test('egész órák összege mindig a heti óraszám', () => {
  for (const m of [ugyfelszolgalat, programozo, villanyszerelo, konyvelo]) {
    const p = szamolProfil(m);
    const { kivalthato, felgyorsul, emberi } = p.orak;
    assert.equal(kivalthato + felgyorsul + emberi, 40, m.slug);
  }
});

test('típusok és szintek a várt módon jönnek ki', () => {
  assert.equal(szamolProfil(ugyfelszolgalat).tipus, 'automatizalodo');
  // Az egyindexes modellben: P ≈ 0.62 (magas kitettség), K ≈ 0.23 (főleg felgyorsul) → Átalakuló
  assert.equal(szamolProfil(programozo).tipus, 'atalakulo');
  assert.equal(szamolProfil(villanyszerelo).tipus, 'vedett');
  assert.equal(szamolProfil(konyvelo).tipus, 'atalakulo'); // erős fékek miatt P < 0.50, ezért nem automatizalodo
  assert.equal(szamolProfil(ugyfelszolgalat).szint, 4);
  assert.equal(szamolProfil(programozo).szint, 3);
  assert.equal(szamolProfil(villanyszerelo).szint, 1);
  assert.equal(szamolProfil(konyvelo).szint, 3);
});

test('determinisztikus', () => {
  assert.deepEqual(szamolProfil(konyvelo), szamolProfil(konyvelo));
});

test('finomítás: több telefon → kevesebb "ma" kiváltható óra', () => {
  const alap = szamolProfil(ugyfelszolgalat);
  const telefonos = szamolProfil(ugyfelszolgalat, { telefon: 1.6, irasos: 0.5 });
  assert.ok(telefonos.kivalthatoHorizontSzerint.ma < alap.kivalthatoHorizontSzerint.ma);
});

test('legnagyobb maradék kerekítés', () => {
  assert.deepEqual(egeszreKerekit([13.4, 13.4, 13.2], 40), [14, 13, 13]);
});

test('minta kimenet', () => {
  for (const m of [ugyfelszolgalat, programozo, villanyszerelo, konyvelo]) {
    const p = szamolProfil(m);
    console.log(`${p.nev.padEnd(28)} ${p.tipus.padEnd(11)} kiv:${p.orak.kivalthato} fel:${p.orak.felgyorsul} emb:${p.orak.emberi} | visszanyert:${p.visszanyertOra}ó | ma:${p.kivalthatoHorizontSzerint.ma} (fékkel ${p.gyakorlatbanMaKivalthato}) | fék:${p.fekIndex}`);
  }
});

// ───────── Egyindexes besorolás (P = kitettség × fékszorzó, K = kiváltási hányad) ─────────
import { profilTipus, szintMutatok, KONSTANSOK } from './scoring.ts';
import { readFileSync, readdirSync } from 'node:fs';

const K0 = { fizikai: 0, felelosseg: 0, szabalyozas: 0, bizalom: 0 };
const egyFeladat = (kitettseg: number, kivaltasArany: number, fekek = K0): Munkakor => ({
  slug: 't', nev: 'T', hetiOra: 40, fekek,
  feladatok: [{ leiras: 'a', idoArany: 1, kitettseg, kivaltasArany, horizont: 'ma' }],
});

test('konstansok egy helyen, a megadott értékekkel', () => {
  assert.equal(KONSTANSOK.P_VEDETT, 0.2);
  assert.equal(KONSTANSOK.P_ATALAKUL, 0.36);
  assert.equal(KONSTANSOK.P_AUTOMATIZ, 0.5);
  assert.equal(KONSTANSOK.K_AUTOMATIZ, 0.36);
  assert.equal(KONSTANSOK.FEK_SULY, 0.5);
});

test('szabálysor: P és K → szint', () => {
  assert.equal(profilTipus(0.1, 0.9), 'vedett');          // P < 0.20 → 1
  assert.equal(profilTipus(0.6, 0.5), 'automatizalodo');  // P ≥ 0.50, K ≥ 0.36 → 4
  assert.equal(profilTipus(0.6, 0.2), 'atalakulo');       // P ≥ 0.50, K < 0.36 → 3
  assert.equal(profilTipus(0.4, 0.9), 'atalakulo');       // 0.36 ≤ P < 0.50 → 3
  assert.equal(profilTipus(0.3, 0.9), 'felerosodo');      // 0.20 ≤ P < 0.36 → 2
});

test('határértékek a megadott oldalra esnek', () => {
  assert.equal(profilTipus(0.2, 0), 'felerosodo');        // P = 0.20 már nem Védett
  assert.equal(profilTipus(0.19999, 0), 'vedett');
  assert.equal(profilTipus(0.36, 0), 'atalakulo');        // P = 0.36 már Átalakuló
  assert.equal(profilTipus(0.35999, 0), 'felerosodo');
  assert.equal(profilTipus(0.5, 0.36), 'automatizalodo'); // P = 0.50 és K = 0.36 → 4
  assert.equal(profilTipus(0.5, 0.35999), 'atalakulo');
  assert.equal(profilTipus(0.49999, 0.9), 'atalakulo');
});

test('szintMutatok: P és K a képlet szerint', () => {
  const m: Munkakor = {
    slug: 't', nev: 'T', hetiOra: 40, fekek: { fizikai: 0, felelosseg: 3, szabalyozas: 3, bizalom: 0 }, // fékindex 0.5
    feladatok: [
      { leiras: 'a', idoArany: 0.5, kitettseg: 1, kivaltasArany: 0.6, horizont: 'ma' },
      { leiras: 'b', idoArany: 0.5, kitettseg: 0.2, kivaltasArany: 0, horizont: 'ma' },
    ],
  };
  const { P, K } = szintMutatok(m);
  // Σ idő × kitettség = 0.6; fékszorzó = 1 − 0.5 × 0.5 = 0.75 → P = 0.45; K = 0.3 / 0.6 = 0.5
  assert.ok(Math.abs(P - 0.45) < 1e-9, String(P));
  assert.ok(Math.abs(K - 0.5) < 1e-9, String(K));
  assert.deepEqual(szamolProfil(m).szintMutatok, { P, K });
});

test('erős fék csökkenti P-t', () => {
  const gyenge = szintMutatok(egyFeladat(0.8, 0.5)).P;
  const eros = szintMutatok(egyFeladat(0.8, 0.5, { fizikai: 3, felelosseg: 3, szabalyozas: 3, bizalom: 3 })).P;
  assert.ok(eros < gyenge);
  assert.ok(Math.abs(eros - 0.4) < 1e-9); // 0.8 × (1 − 0.5 × 1)
});

test('nevező 0 → K = 0, nincs NaN', () => {
  const { P, K } = szintMutatok(egyFeladat(0, 0.7));
  assert.equal(P, 0);
  assert.equal(K, 0);
  assert.equal(szamolProfil(egyFeladat(0, 0.7)).tipus, 'vedett');
});

test('valós munkakör-JSON-okon a szint egész szám 1–4 között', () => {
  const mappa = new URL('../public/data/', import.meta.url);
  const fajlok = readdirSync(mappa).filter((f) => f.endsWith('.json') && f !== 'kereso.json');
  assert.ok(fajlok.length > 0);
  for (const f of fajlok) {
    const p = szamolProfil(JSON.parse(readFileSync(new URL(f, mappa), 'utf8')));
    assert.ok(Number.isInteger(p.szint) && p.szint >= 1 && p.szint <= 4, f);
    assert.ok(Number.isFinite(p.szintMutatok.P) && Number.isFinite(p.szintMutatok.K), f);
  }
});
