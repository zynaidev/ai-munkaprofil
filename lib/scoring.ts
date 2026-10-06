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

// Konstansok – az összes küszöb és súly egy helyen (más fájlban ne legyen belőlük szám).
export const KONSTANSOK = {
  felerositesMegtakaritas: 0.4, // felerősített órák ennyi része szabadul fel (időmegtakarítás)
  FEK_SULY: 0.5,     // a fékindex legfeljebb ennyivel csökkenti P-t és a „gyakorlatban ma kiváltható” órákat
  // Besorolás: P = (Σ időarány × kitettség) × (1 − FEK_SULY × fékindex),
  //            K = Σ(időarány × kitettség × kiváltási arány) / Σ(időarány × kitettség)
  P_VEDETT: 0.2,     // P < 0.20 → 1. szint, Védett
  P_ATALAKUL: 0.36,  // P ≥ 0.36 → 3. szint, Átalakuló (ha nem 4.)
  P_AUTOMATIZ: 0.5,  // P ≥ 0.50 …
  K_AUTOMATIZ: 0.36, // … és K ≥ 0.36 → 4. szint, Automatizálódó; különben 2. szint, Felerősödő
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
  // Belső mutatók (besorolás, eloszlás-riport). A felhasználónak sosem jelenik meg, csak a szint.
  szintMutatok: { P: number; K: number };
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

// Szint a két mutatóból, ebben a sorrendben
export function profilTipus(P: number, K: number): ProfilTipus {
  const k = KONSTANSOK;
  if (P < k.P_VEDETT) return 'vedett';
  if (P >= k.P_AUTOMATIZ && K >= k.K_AUTOMATIZ) return 'automatizalodo';
  if (P >= k.P_ATALAKUL) return 'atalakulo';
  return 'felerosodo';
}

// Normalizált (finomítással súlyozott) időarányok
function idoSulyok(m: Munkakor, finomitas: Finomitas): number[] {
  const sulyok = m.feladatok.map((f) => f.idoArany * (f.csatorna ? finomitas[f.csatorna] ?? 1 : 1));
  const ossz = sulyok.reduce((a, b) => a + b, 0);
  return sulyok.map((s) => (ossz > 0 ? s / ossz : 0));
}

// P: fékkel csökkentett AI-kitettség; K: a kitett munka kiváltható hányada (nevező 0 → K = 0)
export function szintMutatok(m: Munkakor, finomitas: Finomitas = {}): { P: number; K: number } {
  const w = idoSulyok(m, finomitas);
  let kitett = 0, kivalthato = 0;
  m.feladatok.forEach((f, i) => {
    kitett += w[i] * f.kitettseg;
    kivalthato += w[i] * f.kitettseg * f.kivaltasArany;
  });
  return {
    P: kitett * (1 - KONSTANSOK.FEK_SULY * fekIndex(m.fekek)),
    K: kitett > 0 ? kivalthato / kitett : 0,
  };
}

export function szamolProfil(m: Munkakor, finomitas: Finomitas = {}): Profil {
  if (m.feladatok.length === 0) throw new Error(`Nincs feladat: ${m.slug}`);

  // 1. Súlyozott, normalizált időarányok (finomítással)
  const w = idoSulyok(m, finomitas);

  // 2. Feladatonkénti órák és bontás
  const feladatok: FeladatEredmeny[] = m.feladatok.map((f, i) => {
    const ora = m.hetiOra * w[i];
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
    const ora = m.hetiOra * w[i];
    const erintett = ora * f.kitettseg;
    kiv += erintett * f.kivaltasArany;
    fel += erintett * (1 - f.kivaltasArany);
    emb += ora - erintett;
    horizont[f.horizont] += erintett * f.kivaltasArany;
  });

  // 3. Egész órák a kártyára (összeg = heti óra)
  const [kivalthato, felgyorsul, emberi] = egeszreKerekit([kiv, fel, emb], Math.round(m.hetiOra));

  const fi = fekIndex(m.fekek);
  const mutatok = szintMutatok(m, finomitas);
  const tipus = profilTipus(mutatok.P, mutatok.K);

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
    gyakorlatbanMaKivalthato: kerek1(horizont.ma * (1 - KONSTANSOK.FEK_SULY * fi)),
    fekIndex: Math.round(fi * 100) / 100,
    szintMutatok: mutatok,
    fekek: m.fekek,
    feladatok,
  };
}
