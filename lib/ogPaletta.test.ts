// Futtatás: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { OG_PALETTA } from './ogPaletta.ts';
import { SZINTEK } from './tipusok.ts';

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const token = (nev: string) => css.match(new RegExp(`${nev}:\\s*(#[0-9a-fA-F]{6})`))?.[1]?.toLowerCase();

test('az OG-paletta egyezik a globals.css tokenjeivel', () => {
  const par: Record<keyof typeof OG_PALETTA, string> = {
    hatter: '--bg-base', szoveg: '--text-primary', szoveg2: '--text-secondary', lime: '--accent',
    kivalthato: '--szin-kivalthato', felgyorsul: '--szin-felgyorsul', emberi: '--szin-emberi',
  };
  for (const [k, v] of Object.entries(par)) assert.equal(OG_PALETTA[k as keyof typeof OG_PALETTA], token(v), k);
});

test('a szintek hex színe egyezik a --szint-N tokenekkel', () => {
  for (const t of SZINTEK) assert.equal(t.szin, token(t.szinValtozo), t.kulcs);
});
