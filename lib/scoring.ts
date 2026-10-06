// AI-Munkaprofil – pontozási logika (MVP)
// Tiszta, függőség nélküli függvények: ugyanarra a bemenetre mindig ugyanaz az eredmény.
import { TIPUSOK, type Szint } from './tipusok.ts';

export type Horizont = 'ma' | '1-3ev' | '5ev+';
export type Csatorna = 'telefon' | 'irasos' | 'szemelyes';
// A négy szint kulcsai; név, leírás, szint és szín: lib/tipusok.ts
export type ProfilTipus = 'vedett' | 'felerosodo' | 'atalakulo' | 'automatizalodo';

export interface Feladat {
  leiras: string;
  idoArany: number;        // munkaidő-részarány (nem kell 1-re összegződnie, normalizáljuk)
  kitettseg: number;       // 0–1: mennyire tudja az AI érdemben érinteni
  kivaltasArany: number;   // 0–1: az érintett részből mennyi kiváltás (a többi felerősítés)
  horizont: Horizont;
  csatorna?: Csatorna;
  emberiMag?: boolean;
}

export interface Fekek {
  fizikai: number;         // 0–3
  felelosseg: number;      // 0–3
  szabalyozas: number;     // 0–3
  bizalom: number;         // 0–3
}

export interface Munkakor {
  slug: string;
  nev: string;
  hetiOra: number;
  fekek: Fekek;
  feladatok: Feladat[];
}

// Finomító kérdések válaszai: csatornánkénti szorzó a munkaidő-arányra.
// Pl. "főleg telefonon dolgozom" → { telefon: 1.5, irasos: 0.6 }
export type Finomitas = Partial<Record<Csatorna, number>>;

// Konstansok – a módszertani oldalon is publikálandók
export const KONSTANSOK = {
  felerositesMegtakaritas: 0.4, // felerősített órák ennyi része szabadul fel (időmegtakarítás)
  fekSuly: 0.5,                 // a fékindex ennyivel csökkentheti a "gyakorlatban ma kiváltható" órákat
  kuszob: {
    // A kulcsnevek a korábbi elnevezést őrzik; értékük és a döntési sorrend változatlan.
    vedettEmberi: 0.5,          // emberi arány ≥ 50% → vedett (1. szint)
    vedettFizikaiFek: 3,        // vagy maximális fizikai fék
    atalakuloKivaltas: 0.35,    // kiváltási arány ≥ 35% …
    atalakuloMaxFek: 0.5,       // … és fékindex < 0.5 → automatizalodo (4. szint)
    felerosodoFelerosites: 0.4, // felerősítési arány ≥ 40% …
    felerosodoMaxKivaltas: 0.25 // … és kiváltás < 25% → felerosodo (2. szint); minden más → atalakulo (3. szint)
  },
} as const;

export interface FeladatEredmeny {
  leiras: string;
  ora: number;
  kivaltottOra: number;
  felerositettOra: number;
  emberiOra: number;
  horizont: Horizont;
  emberiMag: boolean;
}

export interface Profil {
  slug: string;
  nev: string;
  tipus: ProfilTipus;
  szint: Szint;                    // 1–4, a tipusok.ts szerint
  hetiOra: number;
  // egész órák, összegük = hetiOra (kerekítve)
  orak: { kivalthato: number; felgyorsul: number; emberi: number };
  visszanyertOra: number;          // a felgyorsuló részből felszabaduló idő
  kivalthatoHorizontSzerint: Record<Horizont, number>;
  gyakorlatbanMaKivalthato: number; // a fékek figyelembevételével
  fekIndex: number;                 // 0–1
  fekek: Fekek;
  feladatok: FeladatEredmeny[];
}

const kerek1 = (x: number) => Math.round(x * 10) / 10;

// Legnagyobb maradék módszere: egészre kerekít úgy, hogy az összeg pontosan `cel` maradjon.
export function egeszreKerekit(ertekek: number[], cel: number): number[] {
  const alsok = ertekek.map(Math.floor);
  let maradek = cel - alsok.reduce((a, b) => a + b, 0);
  const sorrend = ertekek
    .map((v, i) => ({ i, tort: v - Math.floor(v) }))
    .sort((a, b) => b.tort - a.tort || a.i - b.i);
  for (const { i } of sorrend) {
    if (maradek <= 0) break;
    alsok[i] += 1;
    maradek -= 1;
  }
  return alsok;
}

export function fekIndex(f: Fekek): number {
  return (f.fizikai + f.felelosseg + f.szabalyozas + f.bizalom) / 12;
}

export function profilTipus(
  kivaltasArany: number,
  felerositesArany: number,
  emberiArany: number,
  fek: Fekek,
): ProfilTipus {
  const k = KONSTANSOK.kuszob;
  if (emberiArany >= k.vedettEmberi || fek.fizikai >= k.vedettFizikaiFek) return 'vedett';
  if (kivaltasArany >= k.atalakuloKivaltas && fekIndex(fek) < k.atalakuloMaxFek) return 'automatizalodo';
  if (felerositesArany >= k.felerosodoFelerosites && kivaltasArany < k.felerosodoMaxKivaltas) return 'felerosodo';
  return 'atalakulo';
}

export function szamolProfil(m: Munkakor, finomitas: Finomitas = {}): Profil {
  if (m.feladatok.length === 0) throw new Error(`Nincs feladat: ${m.slug}`);

  // 1. Súlyozott időarányok (finomítással), normalizálás
  const sulyok = m.feladatok.map(
    (f) => f.idoArany * (f.csatorna ? finomitas[f.csatorna] ?? 1 : 1),
  );
  const osszSuly = sulyok.reduce((a, b) => a + b, 0);

  // 2. Feladatonkénti órák és bontás
  const feladatok: FeladatEredmeny[] = m.feladatok.map((f, i) => {
    const ora = (m.hetiOra * sulyok[i]) / osszSuly;
    const erintett = ora * f.kitettseg;
    return {
      leiras: f.leiras,
      ora: kerek1(ora),
      kivaltottOra: kerek1(erintett * f.kivaltasArany),
      felerositettOra: kerek1(erintett * (1 - f.kivaltasArany)),
      emberiOra: kerek1(ora - erintett),
      horizont: f.horizont,
      emberiMag: f.emberiMag ?? false,
    };
  });

  // Pontos (nem kerekített) összegek a típushoz
  let kiv = 0, fel = 0, emb = 0;
  const horizont: Record<Horizont, number> = { ma: 0, '1-3ev': 0, '5ev+': 0 };
  m.feladatok.forEach((f, i) => {
    const ora = (m.hetiOra * sulyok[i]) / osszSuly;
    const erintett = ora * f.kitettseg;
    kiv += erintett * f.kivaltasArany;
    fel += erintett * (1 - f.kivaltasArany);
    emb += ora - erintett;
    horizont[f.horizont] += erintett * f.kivaltasArany;
  });

  // 3. Egész órák a kártyára (összeg = heti óra)
  const [kivalthato, felgyorsul, emberi] = egeszreKerekit([kiv, fel, emb], Math.round(m.hetiOra));

  const fi = fekIndex(m.fekek);
  const tipus = profilTipus(kiv / m.hetiOra, fel / m.hetiOra, emb / m.hetiOra, m.fekek);

  return {
    slug: m.slug,
    nev: m.nev,
    tipus,
    szint: TIPUSOK[tipus].szint,
    hetiOra: m.hetiOra,
    orak: { kivalthato, felgyorsul, emberi },
    visszanyertOra: Math.round(fel * KONSTANSOK.felerositesMegtakaritas),
    kivalthatoHorizontSzerint: {
      ma: kerek1(horizont.ma),
      '1-3ev': kerek1(horizont['1-3ev']),
      '5ev+': kerek1(horizont['5ev+']),
    },
    gyakorlatbanMaKivalthato: kerek1(horizont.ma * (1 - KONSTANSOK.fekSuly * fi)),
    fekIndex: Math.round(fi * 100) / 100,
    fekek: m.fekek,
    feladatok,
  };
}
