// AI-Munkaprofil – a négy profiltípus (szint) egyetlen forrása: szint, név, leírás, színtoken.
// Minden felület (hero, kezdőoldali kártyák, színek, megosztási és aria-szövegek) innen olvas.
import type { ProfilTipus } from './scoring.ts';

export type Szint = 1 | 2 | 3 | 4;
export const SZINTEK_SZAMA = 4;

export interface TipusAdat {
  kulcs: ProfilTipus;
  szint: Szint;
  cimke: string;       // megjelenített név
  leiras: string;      // egymondatos leírás (hero típusmondat és kezdőoldali kártya)
  szinValtozo: string; // CSS-változó a globals.css-ben
  pontOsztaly: string; // Tailwind-osztály a kis színjelzéshez (teljes név, hogy a Tailwind megtalálja)
}

export const TIPUSOK: Readonly<Record<ProfilTipus, TipusAdat>> = {
  vedett: {
    kulcs: 'vedett', szint: 1, cimke: 'Védett',
    leiras: 'Az AI hatása jelenleg korlátozott.',
    szinValtozo: '--szint-1', pontOsztaly: 'bg-szint-1',
  },
  felerosodo: {
    kulcs: 'felerosodo', szint: 2, cimke: 'Felerősödő',
    leiras: 'Az AI hatékonyabbá teszi a munkavégzést.',
    szinValtozo: '--szint-2', pontOsztaly: 'bg-szint-2',
  },
  atalakulo: {
    kulcs: 'atalakulo', szint: 3, cimke: 'Átalakuló',
    leiras: 'A feladatok és a szerepkör érdemben megváltoznak.',
    szinValtozo: '--szint-3', pontOsztaly: 'bg-szint-3',
  },
  automatizalodo: {
    kulcs: 'automatizalodo', szint: 4, cimke: 'Automatizálódó',
    leiras: 'A munkafeladatok jelentős részét AI végezheti.',
    szinValtozo: '--szint-4', pontOsztaly: 'bg-szint-4',
  },
};

// Szint szerint emelkedő sorrendben (1 → 4)
export const SZINTEK: readonly TipusAdat[] = Object.values(TIPUSOK).sort((a, b) => a.szint - b.szint);

// Mono címke: „3. szint · 4-ből”
export function szintCimke(szint: Szint): string {
  return `${szint}. szint · ${SZINTEK_SZAMA}-ből`;
}

// Szöveges alternatíva a szintjelzőhöz: „3. szint a 4-ből: Átalakuló”
export function szintAlt(t: Pick<TipusAdat, 'szint' | 'cimke'>): string {
  return `${t.szint}. szint a ${SZINTEK_SZAMA}-ből: ${t.cimke}`;
}
