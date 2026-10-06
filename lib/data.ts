// AI-Munkaprofil – adatréteg: a public/data/*.json betöltése és típusai.
// Csak szerveroldalon (build és szerverkomponensek) használható, mert fájlrendszerből olvas.
// Szándékosan nincs benne Next.js-specifikus import, hogy node:test alatt is fusson.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Csatorna, Feladat, Fekek, Horizont, Munkakor } from './scoring.ts';

export interface FeladatAdat extends Feladat {
  emberiMag: boolean; // az export mindig kiírja
}

export interface MunkakorAdat extends Munkakor {
  feladatok: FeladatAdat[];
  fekIndoklas: Record<keyof Fekek, string>;
  teendo: string;
  indexelheto: boolean;
  adatVerzio: string;
}

export interface KeresoElem {
  slug: string;
  nev: string;
  aliasok: string[];
}

const SLUG_MINTA = /^[a-z0-9-]+$/;
const KERESO_SLUG = 'kereso';
const FEK_NEVEK = ['fizikai', 'felelosseg', 'szabalyozas', 'bizalom'] as const;
const HORIZONTOK: readonly Horizont[] = ['ma', '1-3ev', '5ev+'];
const CSATORNAK: readonly Csatorna[] = ['telefon', 'irasos', 'szemelyes'];

const adatMappa = () => path.join(process.cwd(), 'public', 'data');

// Csak [a-z0-9-] engedett, és a kereső indexe nem munkakör.
export function ervenyesSlug(slug: unknown): slug is string {
  return typeof slug === 'string' && SLUG_MINTA.test(slug) && slug !== KERESO_SLUG;
}

function olvasJson(fajlnev: string): unknown | null {
  try {
    return JSON.parse(readFileSync(path.join(adatMappa(), fajlnev), 'utf8'));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw new Error(`${fajlnev}: nem olvasható vagy hibás JSON (${(e as Error).message})`);
  }
}

// ───────────── Futásidejű alakellenőrzés ─────────────

type Obj = Record<string, unknown>;

const objektum = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);

function hiba(forras: string, mezo: string, elvart: string): never {
  throw new Error(`${forras}: a(z) "${mezo}" mező hiányzik vagy hibás (elvárt: ${elvart})`);
}

function szoveg(o: Obj, kulcs: string, forras: string, elotag = ''): string {
  const v = o[kulcs];
  if (typeof v !== 'string' || !v.trim()) hiba(forras, elotag + kulcs, 'nem üres szöveg');
  return v;
}

function szam(o: Obj, kulcs: string, forras: string, min: number, max: number, elotag = ''): number {
  const v = o[kulcs];
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) hiba(forras, elotag + kulcs, `szám ${min}–${max} között`);
  return v;
}

function logikai(o: Obj, kulcs: string, forras: string, elotag = ''): boolean {
  const v = o[kulcs];
  if (typeof v !== 'boolean') hiba(forras, elotag + kulcs, 'true/false');
  return v;
}

function ellenorizFeladat(x: unknown, forras: string, elotag: string): FeladatAdat {
  if (!objektum(x)) hiba(forras, elotag.slice(0, -1), 'objektum');
  const horizont = x.horizont;
  if (!HORIZONTOK.includes(horizont as Horizont)) hiba(forras, `${elotag}horizont`, HORIZONTOK.join(' | '));
  const csatorna = x.csatorna;
  if (csatorna !== undefined && !CSATORNAK.includes(csatorna as Csatorna)) hiba(forras, `${elotag}csatorna`, CSATORNAK.join(' | '));
  return {
    leiras: szoveg(x, 'leiras', forras, elotag),
    idoArany: szam(x, 'idoArany', forras, 0, 1, elotag),
    kitettseg: szam(x, 'kitettseg', forras, 0, 1, elotag),
    kivaltasArany: szam(x, 'kivaltasArany', forras, 0, 1, elotag),
    horizont: horizont as Horizont,
    ...(csatorna !== undefined && { csatorna: csatorna as Csatorna }),
    emberiMag: logikai(x, 'emberiMag', forras, elotag),
  };
}

// Ha a JSON-ból kötelező mező hiányzik, érthető hibát dob, nem enged tovább undefined-ot.
export function ellenorizMunkakor(x: unknown, forras = 'munkakör'): MunkakorAdat {
  if (!objektum(x)) throw new Error(`${forras}: a gyökérelem nem objektum`);

  const fekek = x.fekek;
  const fekIndoklas = x.fekIndoklas;
  if (!objektum(fekek)) hiba(forras, 'fekek', 'objektum');
  if (!objektum(fekIndoklas)) hiba(forras, 'fekIndoklas', 'objektum');

  const feladatok = x.feladatok;
  if (!Array.isArray(feladatok) || feladatok.length === 0) hiba(forras, 'feladatok', 'nem üres tömb');

  return {
    slug: szoveg(x, 'slug', forras),
    nev: szoveg(x, 'nev', forras),
    hetiOra: szam(x, 'hetiOra', forras, 1, 168),
    fekek: Object.fromEntries(FEK_NEVEK.map((n) => [n, szam(fekek, n, forras, 0, 3, 'fekek.')])) as unknown as Fekek,
    fekIndoklas: Object.fromEntries(
      FEK_NEVEK.map((n) => [n, szoveg(fekIndoklas, n, forras, 'fekIndoklas.')]),
    ) as Record<keyof Fekek, string>,
    feladatok: feladatok.map((f, i) => ellenorizFeladat(f, forras, `feladatok[${i}].`)),
    teendo: szoveg(x, 'teendo', forras),
    indexelheto: logikai(x, 'indexelheto', forras),
    adatVerzio: szoveg(x, 'adatVerzio', forras),
  };
}

function ellenorizKereso(x: unknown): KeresoElem[] {
  const forras = 'kereso.json';
  if (!Array.isArray(x)) throw new Error(`${forras}: a gyökérelem nem tömb`);
  return x.map((e, i) => {
    if (!objektum(e)) hiba(forras, `[${i}]`, 'objektum');
    const slug = szoveg(e, 'slug', forras, `[${i}].`);
    if (!ervenyesSlug(slug)) hiba(forras, `[${i}].slug`, '[a-z0-9-] karakterek');
    const aliasok = e.aliasok;
    if (!Array.isArray(aliasok) || !aliasok.every((a) => typeof a === 'string')) hiba(forras, `[${i}].aliasok`, 'szövegtömb');
    return { slug, nev: szoveg(e, 'nev', forras, `[${i}].`), aliasok };
  });
}

// ───────────── Publikus függvények ─────────────

// Érvénytelen vagy ismeretlen slugnál null; hibás fájlnál érthető hibát dob.
export function getMunkakor(slug: string): MunkakorAdat | null {
  if (!ervenyesSlug(slug)) return null;
  const nyers = olvasJson(`${slug}.json`);
  if (nyers === null) return null;
  const m = ellenorizMunkakor(nyers, `${slug}.json`);
  if (m.slug !== slug) throw new Error(`${slug}.json: a fájlban lévő slug ("${m.slug}") nem egyezik a fájlnévvel`);
  return m;
}

export function getKereso(): KeresoElem[] {
  const nyers = olvasJson(`${KERESO_SLUG}.json`);
  if (nyers === null) throw new Error('kereso.json: nem található a public/data/ mappában');
  return ellenorizKereso(nyers);
}

// Minden munkakör slugja a kereső indexéből.
export function getOsszesSlug(): string[] {
  return getKereso().map((k) => k.slug);
}

// Az indexelhető munkakörök slugjai, a munkakör-fájlok indexelheto mezője alapján.
export function getIndexelhetoSlugok(): string[] {
  return getOsszesSlug().filter((slug) => {
    const m = getMunkakor(slug);
    if (m === null) throw new Error(`kereso.json: a(z) "${slug}" munkakörhöz nincs ${slug}.json`);
    return m.indexelheto;
  });
}
