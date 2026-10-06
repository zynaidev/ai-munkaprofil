// Kliensoldali küldő a /api/visszajelzes végpontra. Lustán töltődik be (dinamikus import gombnyomáskor),
// hogy a Kereső és az eredményoldal csomagját ne növelje.
import type { Visszajelzes } from './visszajelzes.ts';

// `weboldal`: a rejtett honeypot mező értéke (embernél üres)
export async function kuldVisszajelzest(adat: Visszajelzes, weboldal = ''): Promise<boolean> {
  try {
    const v = await fetch('/api/visszajelzes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...adat, weboldal }),
    });
    return v.ok;
  } catch {
    return false;
  }
}
