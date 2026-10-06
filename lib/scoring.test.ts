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

test('típusok a várt módon jönnek ki', () => {
  assert.equal(szamolProfil(ugyfelszolgalat).tipus, 'Átalakuló');
  assert.equal(szamolProfil(programozo).tipus, 'Felerősödő');
  assert.equal(szamolProfil(villanyszerelo).tipus, 'Védett');
  assert.equal(szamolProfil(konyvelo).tipus, 'Kevert'); // erős fékek miatt nem Átalakuló
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
