// Tesztsegédek: a valós adat közvetlen beolvasása (a tesztelt függvényektől függetlenül), hogy a tesztek
// elvárásai az adatból jöjjenek, ne beégetett slugokból. Csak a tesztek használják.
import { readdirSync, readFileSync } from 'node:fs';

const ADAT = new URL('../public/data/', import.meta.url);

export interface NyersMunkakor {
  slug: string;
  nev: string;
  hetiOra: number;
  indexelheto: boolean;
  adatVerzio: string;
  tobbes?: string;
  teendo: string;
  fekIndoklas: Record<string, string>;
  [kulcs: string]: unknown;
}

export const adatFajlnevek = () => readdirSync(ADAT).filter((f) => f.endsWith('.json') && f !== 'kereso.json').sort();

export const nyersMunkakorok = (): NyersMunkakor[] =>
  adatFajlnevek().map((f) => JSON.parse(readFileSync(new URL(f, ADAT), 'utf8')));

export const nyersKereso = (): { slug: string; nev: string; aliasok: string[] }[] =>
  JSON.parse(readFileSync(new URL('kereso.json', ADAT), 'utf8'));

// Egyszerű CSV-olvasó idézőjeles mezőkkel (az aliasokban lehet vessző)
export function csvSorok(): Record<string, string>[] {
  const szoveg = readFileSync(new URL('../adat/munkakorok.csv', import.meta.url), 'utf8').replace(/^﻿/, '');
  const sorok: string[][] = [];
  let sor: string[] = [], mezo = '', idezet = false;
  for (let i = 0; i < szoveg.length; i++) {
    const c = szoveg[i];
    if (idezet) {
      if (c === '"' && szoveg[i + 1] === '"') { mezo += '"'; i++; }
      else if (c === '"') idezet = false;
      else mezo += c;
    } else if (c === '"') idezet = true;
    else if (c === ',') { sor.push(mezo); mezo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && szoveg[i + 1] === '\n') i++;
      sor.push(mezo); mezo = '';
      if (sor.some((m) => m !== '')) sorok.push(sor);
      sor = [];
    } else mezo += c;
  }
  if (mezo || sor.length) { sor.push(mezo); sorok.push(sor); }
  const [fejlec, ...adat] = sorok;
  return adat.map((s) => Object.fromEntries(fejlec.map((f, i) => [f.trim(), (s[i] ?? '').trim()])));
}

export const csvIndexelheto = (ertek: string) => ['true', '1', 'igen'].includes(ertek.toLowerCase());

// Az adat/pipeline.py magyar_rendezo kulcsa: az ékezetes betű az alapbetűje mellé kerül (Ü az U-hoz).
const EKEZET: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ö: 'o', ő: 'o', ú: 'u', ü: 'u', ű: 'u' };
export const magyarRendezoKulcs = (s: string): [string, string] => {
  const k = s.toLowerCase();
  return [k.replace(/[áéíóöőúüű]/g, (c) => EKEZET[c]), k];
};
export const kulcsSorrend = (a: [string, string], b: [string, string]) =>
  a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0;
