// AI-Munkaprofil – finomító kérdések: válasz → szorzó, URL-paraméterek olvasása és írása (tiszta függvények).
// URL-séma: ?telefon=ritka|neha|sok&szemelyes=…&irasos=…  Az alapértelmezett „neha” nem kerül az URL-be.
import type { Csatorna, Feladat, Finomitas } from './scoring.ts';

export const CSATORNAK = ['telefon', 'szemelyes', 'irasos'] as const satisfies readonly Csatorna[];
export const VALASZOK = ['ritka', 'neha', 'sok'] as const;
export type Valasz = (typeof VALASZOK)[number];
export type Valaszok = Partial<Record<Csatorna, Valasz>>;

export const ALAP_VALASZ: Valasz = 'neha';

// „Szinte soha” 0,3 · „Néha” 1 · „A munkám nagy része” 1,8
export const SZORZO: Readonly<Record<Valasz, number>> = { ritka: 0.3, neha: 1, sok: 1.8 };

const ervenyesCsatorna = (x: string): x is Csatorna => (CSATORNAK as readonly string[]).includes(x);
const ervenyesValasz = (x: string): x is Valasz => (VALASZOK as readonly string[]).includes(x);

// Válaszok → a szamolProfil Finomitas-objektuma (az alapértelmezett 1-es szorzót nem kell átadni)
export function finomitasbol(v: Valaszok): Finomitas {
  const f: Finomitas = {};
  for (const cs of CSATORNAK) {
    const valasz = v[cs];
    if (valasz && valasz !== ALAP_VALASZ) f[cs] = SZORZO[valasz];
  }
  return f;
}

// URL query → válaszok. Csak ismert kulcsot és értéket fogad el, a többit figyelmen kívül hagyja.
export function olvasUrl(search: string): Valaszok {
  const p = new URLSearchParams(search);
  const v: Valaszok = {};
  for (const cs of CSATORNAK) {
    const ertek = p.get(cs);
    if (ertek !== null && ervenyesValasz(ertek)) v[cs] = ertek;
  }
  return v;
}

// Új query string a válaszokkal (vezető „?”-lel, vagy üres). Az idegen paramétereket megtartja,
// a sajátjainkat fix sorrendben írja, az alapértelmezettet kihagyja.
export function irUrl(search: string, v: Valaszok): string {
  const p = new URLSearchParams(search);
  for (const cs of CSATORNAK) p.delete(cs);
  for (const cs of CSATORNAK) {
    const valasz = v[cs];
    if (valasz && valasz !== ALAP_VALASZ) p.set(cs, valasz);
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

// A munkakörben ténylegesen előforduló csatornák, fix sorrendben (ezekre van kérdés)
export function elerhetoCsatornak(feladatok: Pick<Feladat, 'csatorna'>[]): Csatorna[] {
  const van = new Set(feladatok.map((f) => f.csatorna).filter((c): c is Csatorna => !!c && ervenyesCsatorna(c)));
  return CSATORNAK.filter((cs) => van.has(cs));
}

// Csak az adott munkakörben értelmes válaszok maradnak meg
export function szukit(v: Valaszok, csatornak: readonly Csatorna[]): Valaszok {
  const ki: Valaszok = {};
  for (const cs of csatornak) if (v[cs]) ki[cs] = v[cs];
  return ki;
}

// „{Két} kérdéssel személyesebb lesz.” – a megjelenő kérdések száma szóval
export function kerdesSzamSzo(n: number): string {
  return ({ 1: 'Egy', 2: 'Két', 3: 'Három' } as Record<number, string>)[n] ?? String(n);
}
