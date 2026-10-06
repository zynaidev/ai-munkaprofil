// Futtatás: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SZINTEK, TIPUSOK, szintAlt, szintCimke } from './tipusok.ts';
import { profilTipus, szamolProfil, type ProfilTipus } from './scoring.ts';

test('a négy szint a végleges szövegekkel', () => {
  assert.deepEqual(
    SZINTEK.map((t) => [t.szint, t.kulcs, t.cimke, t.leiras]),
    [
      [1, 'vedett', 'Védett', 'Az AI hatása jelenleg korlátozott.'],
      [2, 'felerosodo', 'Felerősödő', 'Az AI hatékonyabbá teszi a munkavégzést.'],
      [3, 'atalakulo', 'Átalakuló', 'A feladatok és a szerepkör érdemben megváltoznak.'],
      [4, 'automatizalodo', 'Automatizálódó', 'A munkafeladatok jelentős részét AI végezheti.'],
    ],
  );
  for (const t of SZINTEK) {
    assert.equal(TIPUSOK[t.kulcs], t);
    assert.equal(t.szinValtozo, `--szint-${t.szint}`);
    assert.equal(t.pontOsztaly, `bg-szint-${t.szint}`);
  }
});

test('szint-feliratok', () => {
  assert.equal(szintCimke(3), '3. szint · 4-ből');
  assert.equal(szintAlt(TIPUSOK.atalakulo), '3. szint a 4-ből: Átalakuló');
});

test('mind a négy szint elérhető a P–K szabálysorral, a tipusok.ts szintjével', () => {
  const kapott = [profilTipus(0.1, 0), profilTipus(0.3, 0), profilTipus(0.4, 0), profilTipus(0.6, 0.6)];
  assert.deepEqual(kapott.map((k) => TIPUSOK[k].szint), [1, 2, 3, 4]);
});

test('a Profil szint mezője a tipusok.ts szintje', () => {
  const m = {
    slug: 'x', nev: 'X', hetiOra: 40, fekek: { fizikai: 0, felelosseg: 0, szabalyozas: 0, bizalom: 0 },
    feladatok: [{ leiras: 'a', idoArany: 1, kitettseg: 0.9, kivaltasArany: 0.9, horizont: 'ma' as const }],
  };
  const p = szamolProfil(m);
  assert.equal(p.tipus satisfies ProfilTipus, 'automatizalodo');
  assert.equal(p.szint, 4);
});
