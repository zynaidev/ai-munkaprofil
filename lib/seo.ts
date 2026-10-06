// AI-Munkaprofil – SEO- és megosztási szövegek (landing-copy.md 4–5. fejezet). Tiszta függvények.
// Szándékosan nincs benne Next.js-specifikus import, hogy node:test alatt is fusson.
import type { Profil } from './scoring.ts';
import { TIPUSOK } from './tipusok.ts';

export const OLDALNEV = 'AI-Munkaprofil';
const ALAP_URL = 'http://localhost:3000';

// Slug → többes számú alak a címhez („Elveszi az AI a {könyvelők} munkáját?”).
// Az adat/munkakorok.csv indexelhető munkakörei; új indexelhető munkakörnél ide is fel kell venni.
export const TARGYESET: Readonly<Record<string, string>> = {
  'adatrogzito': 'adatrögzítők',
  'fordito': 'fordítók',
  'grafikus': 'grafikusok',
  'hr-munkatars': 'HR-munkatársak',
  'jogasz': 'jogászok',
  'konyvelo': 'könyvelők',
  'marketinges': 'marketingesek',
  'szoftverfejleszto': 'szoftverfejlesztők',
  'tanar': 'tanárok',
  'ugyfelszolgalati-munkatars': 'ügyfélszolgálati munkatársak',
};

// Határozott névelő: magánhangzóval kezdődő szó előtt „az”, különben „a” (HR → „há-er”, mássalhangzó).
export function nevelo(szo: string): 'a' | 'az' {
  return /^[aáeéiíoóöőuúüű]/i.test(szo) ? 'az' : 'a';
}

// „Elveszi az AI a/az {tobbes} munkáját?” – helyes névelővel
export function kerdes(tobbes: string): string {
  return `Elveszi az AI ${nevelo(tobbes)} ${tobbes} munkáját?`;
}

// <title> és SEO-cím. Elsőbbség: a munkakör saját „tobbes” mezője, majd a TARGYESET szótár;
// ha egyik sincs: „{nev} és az AI | AI-Munkaprofil”.
export function seoCim(slug: string, nev: string, tobbes?: string): string {
  const t = tobbes?.trim() || TARGYESET[slug];
  return t ? `${kerdes(t)} | ${OLDALNEV}` : `${nev} és az AI | ${OLDALNEV}`;
}

export function metaLeiras(p: Pick<Profil, 'nev' | 'orak'>): string {
  const { kivalthato, felgyorsul, emberi } = p.orak;
  return `${p.nev}: ${kivalthato} óra kiváltható, ${felgyorsul} óra felgyorsul, ${emberi} óra marad emberi. Kutatási adatokon alapuló, feladatonkénti elemzés.`;
}

export function ogCim(p: Pick<Profil, 'nev' | 'tipus'>): string {
  return `${p.nev}: ${TIPUSOK[p.tipus].cimke} | ${OLDALNEV}`;
}

export function ogLeiras(p: Pick<Profil, 'hetiOra' | 'orak'>): string {
  return `A heti ${p.hetiOra} órából ${p.orak.kivalthato} óra kiváltható, ${p.orak.emberi} óra emberi mag. Nézd meg a saját munkakörödet!`;
}

// Az oldal abszolút alap-URL-je a NEXT_PUBLIC_SITE_URL-ből, záró perjel nélkül.
export function oldalUrl(env: string | undefined = process.env.NEXT_PUBLIC_SITE_URL): string {
  const url = env?.trim().replace(/\/+$/, '');
  return url || ALAP_URL;
}
