// Futtatás: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  elerhetoCsatornak, finomitasbol, irUrl, kerdesSzamSzo, olvasUrl, SZORZO, szukit, type Valaszok,
} from './finomitas.ts';
import { getMunkakor } from './data.ts';
import { szamolProfil } from './scoring.ts';

test('válasz → szorzó leképezés', () => {
  assert.deepEqual(SZORZO, { ritka: 0.3, neha: 1, sok: 1.8 });
  assert.deepEqual(finomitasbol({ telefon: 'sok', irasos: 'ritka', szemelyes: 'neha' }), { telefon: 1.8, irasos: 0.3 });
  assert.deepEqual(finomitasbol({}), {});
});

test('URL olvasása: ismert kulcsok és értékek', () => {
  assert.deepEqual(olvasUrl('?telefon=sok&irasos=ritka'), { telefon: 'sok', irasos: 'ritka' });
  assert.deepEqual(olvasUrl('telefon=neha'), { telefon: 'neha' });
  assert.deepEqual(olvasUrl(''), {});
});

test('érvénytelen bemenetet figyelmen kívül hagy', () => {
  assert.deepEqual(olvasUrl('?telefon=SOK&fax=sok&szemelyes=1.8&irasos=&__proto__=sok&constructor=sok'), {});
  assert.deepEqual(olvasUrl('?telefon=sok&telefon=ritka'), { telefon: 'sok' }); // az első érték számít
  assert.deepEqual(olvasUrl('?telefon=%3Cscript%3E&irasos=ritka'), { irasos: 'ritka' });
});

test('URL írása: az alapértelmezett „neha” nem kerül bele, az idegen paraméterek maradnak', () => {
  assert.equal(irUrl('', { telefon: 'neha' }), '');
  assert.equal(irUrl('', {}), '');
  assert.equal(irUrl('', { irasos: 'ritka', telefon: 'sok' }), '?telefon=sok&irasos=ritka');
  assert.equal(irUrl('?utm_source=x&telefon=ritka', { telefon: 'neha' }), '?utm_source=x');
  assert.equal(irUrl('?utm_source=x', { szemelyes: 'sok' }), '?utm_source=x&szemelyes=sok');
});

test('oda-vissza: írás → olvasás', () => {
  const esetek: Valaszok[] = [{}, { telefon: 'sok' }, { telefon: 'ritka', szemelyes: 'sok', irasos: 'ritka' }];
  for (const v of esetek) assert.deepEqual(olvasUrl(irUrl('', v)), v);
  // a „neha” az URL-ben nem jelenik meg, visszaolvasva alapállapot (azonos jelentés)
  assert.deepEqual(olvasUrl(irUrl('', { telefon: 'neha', irasos: 'sok' })), { irasos: 'sok' });
});

test('elérhető csatornák és szűkítés', () => {
  const m = getMunkakor('ugyfelszolgalati-munkatars');
  assert.ok(m);
  assert.deepEqual(elerhetoCsatornak(m.feladatok), ['telefon', 'irasos']);
  assert.deepEqual(elerhetoCsatornak([{}, { csatorna: undefined }]), []);
  assert.deepEqual(szukit({ telefon: 'sok', szemelyes: 'sok' }, ['telefon', 'irasos']), { telefon: 'sok' });
});

test('kérdések száma szóval', () => {
  assert.equal(kerdesSzamSzo(1), 'Egy');
  assert.equal(kerdesSzamSzo(2), 'Két');
  assert.equal(kerdesSzamSzo(3), 'Három');
});

test('telefon „A munkám nagy része” → kevesebb „Már ma” óra (ügyfélszolgálat)', () => {
  const m = getMunkakor('ugyfelszolgalati-munkatars');
  assert.ok(m);
  const alap = szamolProfil(m);
  const sok = szamolProfil(m, finomitasbol(olvasUrl('?telefon=sok')));
  assert.ok(sok.kivalthatoHorizontSzerint.ma < alap.kivalthatoHorizontSzerint.ma);
});
