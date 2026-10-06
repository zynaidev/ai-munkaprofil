// Futtatás: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kezelVisszajelzest, ujKorlat, type Beallitas } from './visszajelzesKezelo.ts';

const keres = (body: unknown, ip = '1.2.3.4') =>
  new Request('http://x/api/visszajelzes', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `${ip}, 10.0.0.1`, 'user-agent': 'Teszt/1.0' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

function beallitas(f: Partial<Beallitas> = {}): Beallitas & { hivasok: { url: string; body: unknown }[]; naplo: unknown[] } {
  const hivasok: { url: string; body: unknown }[] = [];
  const naplo: unknown[] = [];
  return {
    webhookUrl: 'https://n8n.pelda/webhook/x',
    adatVerzio: '2026-Q4',
    most: () => new Date('2026-10-06T10:00:00Z'),
    korlat: ujKorlat(),
    fetch: (async (url: string, init: RequestInit) => {
      hivasok.push({ url, body: JSON.parse(String(init.body)) });
      return new Response(null, { status: 200 });
    }) as unknown as typeof fetch,
    napl: (x: unknown) => naplo.push(x),
    ...f,
    hivasok,
    naplo,
  };
}

test('siker: tisztított payload megy a webhookra, azonosító nélkül', async () => {
  const b = beallitas();
  const v = await kezelVisszajelzest(keres({ tipus: 'nincs-talalat', szoveg: '  méhész  ' }), b);
  assert.equal(v.status, 200);
  assert.deepEqual(b.hivasok, [{
    url: 'https://n8n.pelda/webhook/x',
    body: { tipus: 'nincs-talalat', szoveg: 'méhész', idopont: '2026-10-06T10:00:00.000Z', adatVerzio: '2026-Q4' },
  }]);
  const s = JSON.stringify(b.hivasok);
  assert.ok(!s.includes('1.2.3.4') && !s.includes('Teszt/1.0'));
});

test('siker: szint-egyezés csak slug, szint, egyezik', async () => {
  const b = beallitas();
  const v = await kezelVisszajelzest(keres({ tipus: 'szint-egyezes', slug: 'konyvelo', szint: 3, egyezik: true, szoveg: 'x' }), b);
  assert.equal(v.status, 200);
  assert.deepEqual(b.hivasok[0].body, { tipus: 'szint-egyezes', slug: 'konyvelo', szint: 3, egyezik: true, idopont: '2026-10-06T10:00:00.000Z', adatVerzio: '2026-Q4' });
});

test('e-mailes szöveg: siker, de nem továbbítjuk', async () => {
  const b = beallitas();
  const v = await kezelVisszajelzest(keres({ tipus: 'nincs-talalat', szoveg: 'en@pelda.hu' }), b);
  assert.equal(v.status, 200);
  assert.equal(b.hivasok.length, 0);
});

test('honeypot: 204, semmi nem megy tovább', async () => {
  const b = beallitas();
  const v = await kezelVisszajelzest(keres({ tipus: 'nincs-talalat', szoveg: 'kertész', weboldal: 'http://spam' }), b);
  assert.equal(v.status, 204);
  assert.equal(b.hivasok.length, 0);
});

test('korlát: IP-nként 10 kérés / 10 perc, utána 429; más IP és lejárt ablak rendben', async () => {
  let ido = new Date('2026-10-06T10:00:00Z').getTime();
  const b = beallitas({ most: () => new Date(ido) });
  for (let i = 0; i < 10; i++) assert.equal((await kezelVisszajelzest(keres({ tipus: 'nincs-talalat', szoveg: 'a' }), b)).status, 200);
  assert.equal((await kezelVisszajelzest(keres({ tipus: 'nincs-talalat', szoveg: 'a' }), b)).status, 429);
  assert.equal((await kezelVisszajelzest(keres({ tipus: 'nincs-talalat', szoveg: 'a' }, '5.6.7.8'), b)).status, 200);
  ido += 10 * 60 * 1000 + 1;
  assert.equal((await kezelVisszajelzest(keres({ tipus: 'nincs-talalat', szoveg: 'a' }), b)).status, 200);
});

test('érvénytelen bemenet: 400', async () => {
  const b = beallitas();
  for (const body of ['nem json', { tipus: 'spam' }, { tipus: 'szint-egyezes', slug: 'konyvelo', szint: 9, egyezik: true }, { tipus: 'nincs-talalat', szoveg: '' }]) {
    assert.equal((await kezelVisszajelzest(keres(body), b)).status, 400, JSON.stringify(body));
  }
  assert.equal((await kezelVisszajelzest(keres('x'.repeat(5000)), b)).status, 400);
  assert.equal(b.hivasok.length, 0);
});

test('webhook-hiba és időtúllépés: 502', async () => {
  const hibas = beallitas({ fetch: (async () => new Response(null, { status: 500 })) as unknown as typeof fetch });
  assert.equal((await kezelVisszajelzest(keres({ tipus: 'nincs-talalat', szoveg: 'a' }), hibas)).status, 502);
  const dobo = beallitas({ fetch: (async () => { throw new DOMException('timeout', 'TimeoutError'); }) as unknown as typeof fetch });
  assert.equal((await kezelVisszajelzest(keres({ tipus: 'nincs-talalat', szoveg: 'a' }), dobo)).status, 502);
});

test('nincs webhook (fejlesztés): naplózza a tisztított payloadot, 200', async () => {
  const b = beallitas({ webhookUrl: undefined });
  const v = await kezelVisszajelzest(keres({ tipus: 'nincs-talalat', szoveg: ' kertész ' }), b);
  assert.equal(v.status, 200);
  assert.equal(b.hivasok.length, 0);
  assert.deepEqual(b.naplo, [{ tipus: 'nincs-talalat', szoveg: 'kertész', idopont: '2026-10-06T10:00:00.000Z', adatVerzio: '2026-Q4' }]);
});
