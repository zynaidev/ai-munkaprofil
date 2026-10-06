// Kalibrációs riport: hogyan oszlik meg a munkakörök besorolása a 4 szint között (egyindexes modell, P és K).
// Futtatás a repó gyökeréből (Node 22.6+):
//   node --experimental-strip-types adat/eloszlas.mts
//   node --experimental-strip-types adat/eloszlas.mts public/data
// Env: SCORING=lib/scoring.ts (a számítás helye).
// P = fékkel csökkentett AI-kitettség, K = a kitett munka kiváltható hányada (lib/scoring.ts szintMutatok).
// Belső riport: a felhasználónak ezek a számok sosem jelennek meg.
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const mappa = resolve(process.argv[2] ?? 'public/data');
const scoring = await import(pathToFileURL(resolve(process.env.SCORING ?? 'lib/scoring.ts')).href);

type Sor = { slug: string; nev: string; szint: number | null; P: number | null; K: number | null };
const sorok: Sor[] = [];
const hibak: string[] = [];

const szam = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : null);

for (const f of readdirSync(mappa).sort()) {
  if (!f.endsWith('.json') || f === 'kereso.json') continue;
  try {
    const m = JSON.parse(readFileSync(join(mappa, f), 'utf8'));
    const p = scoring.szamolProfil(m);
    const sz = szam(p.szint);
    sorok.push({
      slug: m.slug ?? f, nev: m.nev ?? f,
      szint: sz !== null && Number.isInteger(sz) && sz >= 1 && sz <= 4 ? sz : null,
      P: szam(p.szintMutatok?.P), K: szam(p.szintMutatok?.K),
    });
  } catch (e) {
    hibak.push(`${f}: ${(e as Error).message}`);
  }
}

const n = sorok.length;
if (!n) { console.error('Nincs munkakör.'); process.exit(1); }
const ervenyes = sorok.filter((s) => s.szint !== null);
const hianyos = sorok.filter((s) => s.szint === null || s.P === null || s.K === null);
const ertek = (x: number | null) => (x === null ? ' hiányzik' : x.toFixed(3).padStart(8));
const NEV = { 1: 'Védett', 2: 'Felerősödő', 3: 'Átalakuló', 4: 'Automatizálódó' } as const;

console.log(`\n${n} munkakör – szintek eloszlása (P: kitettség × fékszorzó, K: kiváltható hányad)\n`);
for (const sz of [1, 2, 3, 4] as const) {
  const db = ervenyes.filter((s) => s.szint === sz).length;
  const arany = ervenyes.length ? `${((100 * db) / ervenyes.length).toFixed(0).padStart(3)}%` : '   ?';
  console.log(`${sz}. ${NEV[sz].padEnd(15)} ${String(db).padStart(3)} db ${arany}  ${'█'.repeat(Math.round((40 * db) / n))}`);
}
if (ervenyes.length < n) console.log(`\n⚠ ${n - ervenyes.length} munkakörnek nincs érvényes szintje – a százalékok csak a ${ervenyes.length} érvényesre vonatkoznak.`);
if (hianyos.length) console.log(`⚠ Hiányzó érték (szint, P vagy K): ${hianyos.map((s) => s.slug).join(', ')}`);
if (hibak.length) console.log(`⚠ Nem feldolgozható fájl:\n  ${hibak.join('\n  ')}`);

const ures = [1, 2, 3, 4].filter((sz) => !ervenyes.some((s) => s.szint === sz));
const domin = [1, 2, 3, 4].filter((sz) => ervenyes.filter((s) => s.szint === sz).length / Math.max(1, ervenyes.length) > 0.5);
if (ures.length) console.log(`⚠ Üres szint: ${ures.join(', ')}`);
if (domin.length) console.log(`⚠ Egy szint a munkakörök több mint felét viszi: ${domin.join(', ')}`);

for (const sz of [1, 2, 3, 4] as const) {
  const lista = ervenyes.filter((s) => s.szint === sz).sort((a, b) => (b.P ?? -1) - (a.P ?? -1));
  console.log(`\n${sz}. szint – ${NEV[sz]} (${lista.length})`);
  console.log(`${'P'.padStart(10)}${'K'.padStart(9)}  munkakör`);
  for (const s of lista) console.log(`  ${ertek(s.P)} ${ertek(s.K)}  ${s.nev}`);
}
const nincsSzint = sorok.filter((s) => s.szint === null);
if (nincsSzint.length) {
  console.log(`\nSzint nélkül (${nincsSzint.length})`);
  for (const s of nincsSzint) console.log(`  ${ertek(s.P)} ${ertek(s.K)}  ${s.nev}`);
}
