// AI-Munkaprofil – a visszajelzés-végpont logikája (app/api/visszajelzes/route.ts hívja).
// Szabványos Request/Response, Next.js-specifikus import nélkül, hogy node:test alatt is tesztelhető legyen.
// IP-cím, user-agent és más azonosító nem megy tovább és nem kerül naplóba; az IP csak a memóriabeli
// korlát kulcsa (best-effort; a végleges rate limit az Nginx-ben van).
import { ervenyesit } from './visszajelzes.ts';

export const KORLAT_DB = 10;
export const KORLAT_ABLAK_MS = 10 * 60 * 1000;
const TOVABBITAS_IDOKORLAT_MS = 4000;
const MAX_TOROZS = 2000; // bájt; a valódi kérés ennél jóval kisebb

export type Korlat = Map<string, { db: number; kezdet: number }>;
export const ujKorlat = (): Korlat => new Map();

export interface Beallitas {
  webhookUrl: string | undefined;
  adatVerzio: string;
  most: () => Date;
  korlat: Korlat;
  fetch: typeof fetch;
  napl: (payload: unknown) => void;
}

const valasz = (status: number, body?: object) =>
  body === undefined
    ? new Response(null, { status })
    : new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

// Fix ablakos számláló IP-nként; a lejárt bejegyzéseket időnként kitakarítja.
function korlatonBelul(korlat: Korlat, kulcs: string, most: number): boolean {
  if (korlat.size > 5000) for (const [k, v] of korlat) if (most - v.kezdet > KORLAT_ABLAK_MS) korlat.delete(k);
  const b = korlat.get(kulcs);
  if (!b || most - b.kezdet > KORLAT_ABLAK_MS) {
    korlat.set(kulcs, { db: 1, kezdet: most });
    return true;
  }
  b.db += 1;
  return b.db <= KORLAT_DB;
}

const ipKulcs = (r: Request) =>
  r.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || r.headers.get('x-real-ip')?.trim() || 'ismeretlen';

export async function kezelVisszajelzest(keres: Request, b: Beallitas): Promise<Response> {
  const most = b.most();
  if (!korlatonBelul(b.korlat, ipKulcs(keres), most.getTime())) {
    return valasz(429, { hiba: 'Túl sok kérés, próbáld később.' });
  }

  const szoveg = await keres.text();
  if (szoveg.length > MAX_TOROZS) return valasz(400, { hiba: 'Túl nagy kérés.' });
  let adat: unknown;
  try {
    adat = JSON.parse(szoveg);
  } catch {
    return valasz(400, { hiba: 'Érvénytelen JSON.' });
  }

  // Honeypot: a rejtett „weboldal” mezőt csak robot tölti ki
  if (typeof adat === 'object' && adat !== null && (adat as Record<string, unknown>).weboldal) return valasz(204);

  const e = ervenyesit(adat);
  if (!e.ok) return valasz(400, { hiba: e.hiba });
  if ('eldobva' in e) return valasz(200, { ok: true }); // személyes adatnak tűnő szöveg: nem rögzítjük

  const payload = { ...e.adat, idopont: most.toISOString(), adatVerzio: b.adatVerzio };

  if (!b.webhookUrl) {
    b.napl(payload); // fejlesztés: nincs webhook beállítva
    return valasz(200, { ok: true });
  }

  try {
    const v = await b.fetch(b.webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TOVABBITAS_IDOKORLAT_MS),
    });
    if (!v.ok) return valasz(502, { hiba: 'A továbbítás nem sikerült.' });
  } catch {
    return valasz(502, { hiba: 'A továbbítás nem sikerült.' });
  }
  return valasz(200, { ok: true });
}
