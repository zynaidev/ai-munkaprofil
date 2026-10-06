// AI-Munkaprofil – megosztás: előre megírt szöveg (landing-copy.md „Megosztás”), share-URL-ek, OG-sáv szövege.
// Tiszta függvények, harmadik fél SDK nélkül.
import type { Profil } from './scoring.ts';
import { oraSzam } from './format.ts';
import { kerdes } from './seo.ts';
import { SZINTEK_SZAMA, TIPUSOK } from './tipusok.ts';

// „Megcsináltam az AI-Munkaprofilt: {tipus} vagyok ({szint}. szint a 4-ből). A heti {hetiOra} órámból
// {kivalthato} óra kiváltható, {emberi} óra marad csak az enyém. Te hova esel?”
// Ha a munkakörnek van „tobbes” alakja, a szöveg a kérdéssel kezdődik: „Elveszi az AI a könyvelők munkáját? …”
export function megosztasSzoveg(p: Pick<Profil, 'tipus' | 'hetiOra' | 'orak'>, tobbes?: string): string {
  const t = TIPUSOK[p.tipus];
  const elotag = tobbes?.trim() ? `${kerdes(tobbes.trim())} ` : '';
  return (
    elotag +
    `Megcsináltam az AI-Munkaprofilt: ${t.cimke} vagyok (${t.szint}. szint a ${SZINTEK_SZAMA}-ből). ` +
    `A heti ${oraSzam(p.hetiOra)} órámból ${oraSzam(p.orak.kivalthato)} óra kiváltható, ` +
    `${oraSzam(p.orak.emberi)} óra marad csak az enyém. Te hova esel?`
  );
}

export const facebookUrl = (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
export const linkedinUrl = (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

// A megosztott cím: a jelenlegi URL a finomítás query-vel, horgony nélkül
export function megosztasiUrl(href: string): string {
  const u = new URL(href);
  u.hash = '';
  return u.toString();
}

// OG-kép sávfelirata (landing-copy.md 4. fejezet): „{kiv} ó kiváltható · {fel} ó felgyorsul · {emb} ó emberi”
export function ogSavReszek(o: Profil['orak']): [string, string, string] {
  return [`${oraSzam(o.kivalthato)} ó kiváltható`, `${oraSzam(o.felgyorsul)} ó felgyorsul`, `${oraSzam(o.emberi)} ó emberi`];
}
export const ogSavSzoveg = (o: Profil['orak']) => ogSavReszek(o).join(' · ');
