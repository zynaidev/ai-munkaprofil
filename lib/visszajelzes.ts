// AI-Munkaprofil – visszajelzések (nincs találat, szint-egyezés): tisztítás és érvényesítés. Tiszta függvények.
// Személyes adatot nem rögzítünk: az e-mail- vagy telefonszám-szerű szöveget eldobjuk (a kliens mégis sikert kap).

export type VisszajelzesTipus = 'nincs-talalat' | 'szint-egyezes';

export interface Visszajelzes {
  tipus: VisszajelzesTipus;
  szoveg?: string;
  slug?: string;
  szint?: 1 | 2 | 3 | 4;
  egyezik?: boolean;
}

export const MAX_SZOVEG = 80;
const MAX_SLUG = 80;
const SLUG_MINTA = /^[a-z0-9-]+$/;
const EMAIL_MINTA = /\S+@\S+\.\S+/;
// Legalább 7 számjegy, köztük szóköz, kötőjel, zárójel, perjel vagy pont lehet (pl. +36 30 123 4567)
const TELEFON_MINTA = /\+?\(?\d(?:[\s\-()./]*\d){6,}/;

export type Tisztitott =
  | { allapot: 'ok'; szoveg: string }
  | { allapot: 'ures' }
  | { allapot: 'hosszu' }
  | { allapot: 'eldob' };

export function tisztit(nyers: string): Tisztitott {
  const szoveg = nyers.replace(/\s+/g, ' ').trim();
  if (!szoveg) return { allapot: 'ures' };
  if (szoveg.length > MAX_SZOVEG) return { allapot: 'hosszu' };
  if (EMAIL_MINTA.test(szoveg) || TELEFON_MINTA.test(szoveg)) return { allapot: 'eldob' };
  return { allapot: 'ok', szoveg };
}

export type Eredmeny =
  | { ok: true; adat: Visszajelzes }
  | { ok: true; eldobva: true }
  | { ok: false; hiba: string };

const hiba = (h: string): Eredmeny => ({ ok: false, hiba: h });

// Csak az ismert mezőket engedi tovább; minden más figyelmen kívül marad.
export function ervenyesit(x: unknown): Eredmeny {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return hiba('A kérés nem objektum.');
  const o = x as Record<string, unknown>;

  if (o.tipus === 'nincs-talalat') {
    if (typeof o.szoveg !== 'string') return hiba('Hiányzik a szöveg.');
    const t = tisztit(o.szoveg);
    if (t.allapot === 'ures') return hiba('Üres szöveg.');
    if (t.allapot === 'hosszu') return hiba(`A szöveg legfeljebb ${MAX_SZOVEG} karakter lehet.`);
    if (t.allapot === 'eldob') return { ok: true, eldobva: true };
    return { ok: true, adat: { tipus: 'nincs-talalat', szoveg: t.szoveg } };
  }

  if (o.tipus === 'szint-egyezes') {
    const { slug, szint, egyezik } = o;
    if (typeof slug !== 'string' || !slug || slug.length > MAX_SLUG || !SLUG_MINTA.test(slug)) return hiba('Érvénytelen slug.');
    if (szint !== 1 && szint !== 2 && szint !== 3 && szint !== 4) return hiba('A szint 1–4 lehet.');
    if (typeof egyezik !== 'boolean') return hiba('Az „egyezik” igen/nem érték.');
    return { ok: true, adat: { tipus: 'szint-egyezes', slug, szint, egyezik } };
  }

  return hiba('Ismeretlen típus.');
}
