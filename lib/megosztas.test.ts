// Futtatás: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { facebookUrl, linkedinUrl, megosztasiUrl, megosztasSzoveg, ogSavSzoveg } from './megosztas.ts';
import { getMunkakor } from './data.ts';
import { szamolProfil } from './scoring.ts';
import { finomitasbol } from './finomitas.ts';

test('előre megírt megosztási szöveg a copy szerint, a tényleges adatokkal', () => {
  const m = getMunkakor('adatrogzito');
  assert.ok(m);
  assert.equal(
    megosztasSzoveg(szamolProfil(m)),
    'Megcsináltam az AI-Munkaprofilt: Automatizálódó vagyok (4. szint a 4-ből). A heti 40 órámból 22 óra kiváltható, 4 óra marad csak az enyém. Te hova esel?',
  );
  const v = getMunkakor('villanyszerelo');
  assert.ok(v);
  assert.equal(
    megosztasSzoveg(szamolProfil(v)),
    'Megcsináltam az AI-Munkaprofilt: Védett vagyok (1. szint a 4-ből). A heti 40 órámból 2 óra kiváltható, 35 óra marad csak az enyém. Te hova esel?',
  );
  // a finomított profil saját számait mondja (az adatrögzítőnek írásbeli csatornája van)
  const finomitott = szamolProfil(m, finomitasbol({ irasos: 'sok' }));
  assert.notDeepEqual(finomitott.orak, szamolProfil(m).orak);
  assert.match(megosztasSzoveg(finomitott), new RegExp(`${finomitott.orak.kivalthato} óra kiváltható`));
});

test('ha van „tobbes”, a megosztási szöveg a kérdéssel kezdődik; ha nincs, változatlan', () => {
  const m = getMunkakor('villanyszerelo');
  assert.ok(m);
  const p = szamolProfil(m);
  const alap = megosztasSzoveg(p);
  assert.equal(megosztasSzoveg(p, 'villanyszerelők'), `Elveszi az AI a villanyszerelők munkáját? ${alap}`);
  assert.equal(megosztasSzoveg(p, 'ügyintézők'), `Elveszi az AI az ügyintézők munkáját? ${alap}`);
  assert.equal(megosztasSzoveg(p, ''), alap);
  assert.equal(megosztasSzoveg(p, undefined), alap);
});

test('megosztási URL-ek kódolva, a finomítás query-vel együtt', () => {
  const u = 'https://ai-munkaprofil.zynai.hu/ugyfelszolgalati-munkatars?telefon=sok';
  assert.equal(facebookUrl(u), 'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fai-munkaprofil.zynai.hu%2Fugyfelszolgalati-munkatars%3Ftelefon%3Dsok');
  assert.equal(linkedinUrl(u), 'https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fai-munkaprofil.zynai.hu%2Fugyfelszolgalati-munkatars%3Ftelefon%3Dsok');
});

test('megosztott URL: a horgony (#…) nem kerül bele, a query igen', () => {
  assert.equal(megosztasiUrl('https://x.hu/konyvelo?irasos=sok#reszletek'), 'https://x.hu/konyvelo?irasos=sok');
  assert.equal(megosztasiUrl('https://x.hu/konyvelo'), 'https://x.hu/konyvelo');
});

test('OG-sáv szövege', () => {
  assert.equal(ogSavSzoveg({ kivalthato: 19, felgyorsul: 10, emberi: 11 }), '19 ó kiváltható · 10 ó felgyorsul · 11 ó emberi');
});
