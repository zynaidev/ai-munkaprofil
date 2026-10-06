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

test('a döntési ágak → kulcsok, változatlan logikával és sorrendben', () => {
  const fek0 = { fizikai: 0, felelosseg: 0, szabalyozas: 0, bizalom: 0 };
  const fekEros = { fizikai: 0, felelosseg: 3, szabalyozas: 3, bizalom: 3 };
  // 1. ág: emberi arány ≥ 50% vagy fizikai fék = 3
  assert.equal(profilTipus(0.1, 0.1, 0.8, fek0), 'vedett');
  assert.equal(profilTipus(0.6, 0.2, 0.2, { ...fek0, fizikai: 3 }), 'vedett');
  // 2. ág: kiváltás ≥ 35% és fékindex < 0,5
  assert.equal(profilTipus(0.5, 0.3, 0.2, fek0), 'automatizalodo');
  // 3. ág: felerősítés ≥ 40% és kiváltás < 25%
  assert.equal(profilTipus(0.2, 0.5, 0.3, fek0), 'felerosodo');
  // 4. ág: minden más (pl. sok kiváltás, de erős fékek)
  assert.equal(profilTipus(0.5, 0.3, 0.2, fekEros), 'atalakulo');
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
