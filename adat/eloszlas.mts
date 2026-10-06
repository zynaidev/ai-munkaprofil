// Kalibrációs riport: hogyan oszlik meg a munkakörök besorolása a 4 szint között?
// Futtatás a repó gyökeréből (Node 22.6+):
//   node --experimental-strip-types adat/eloszlas.mts
//   node --experimental-strip-types adat/eloszlas.mts public/data 20
// Env: SCORING=lib/scoring.ts (a számítás helye), a 2. argumentum a szélső-lista hossza.
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const mappa = resolve(process.argv[2] ?? 'public/data');
const hossz = Number(process.argv[3] ?? 10);
const scoring = await import(pathToFileURL(resolve(process.env.SCORING ?? 'lib/scoring.ts')).href);

type Sor = { slug: string; nev: string; szint: number; tipus: string; kivaltas: number; fekIndex: number };
const sorok: Sor[] = [];

for (const f of readdirSync(mappa)) {
  if (!f.endsWith('.json') || f === 'kereso.json') continue;
  const m = JSON.parse(readFileSync(join(mappa, f), 'utf8'));
  try {
    const p = scoring.szamolProfil(m);
    const ora = m.hetiOra ?? 40;
    sorok.push({
      slug: m.slug, nev: m.nev,
      szint: p.szint ?? 0, tipus: String(p.tipus ?? p.tipusKulcs ?? '?'),
      kivaltas: (p.kivalthatoOra ?? p.kivaltottOra ?? 0) / ora,
      fekIndex: scoring.fekIndex ? scoring.fekIndex(m.fekek) : NaN,
    });
  } catch (e) {
    console.error(`⚠ ${f}: ${(e as Error).message}`);
  }
}

const n = sorok.length;
if (!n) { console.error('Nincs munkakör.'); process.exit(1); }
console.log(`\n${n} munkakör – szintek eloszlása\n`);
for (const sz of [1, 2, 3, 4]) {
  const db = sorok.filter(s => s.szint === sz).length;
  console.log(`${sz}. szint ${String(db).padStart(4)}  ${(100 * db / n).toFixed(0).padStart(3)}%  ${'█'.repeat(Math.round(40 * db / n))}`);
}
const ures = [1, 2, 3, 4].filter(sz => !sorok.some(s => s.szint === sz));
const domin = [1, 2, 3, 4].filter(sz => sorok.filter(s => s.szint === sz).length / n > 0.5);
if (ures.length) console.log(`\n⚠ Üres szint: ${ures.join(', ')} – a küszöbök kalibrálandók.`);
if (domin.length) console.log(`⚠ Egy szint a munkakörök több mint felét viszi: ${domin.join(', ')} – kalibrálandó.`);

const rendezett = [...sorok].sort((a, b) => b.kivaltas - a.kivaltas);
const ki = (s: Sor) => `  ${(s.kivaltas * 100).toFixed(0).padStart(3)}% kiváltható · fék ${isNaN(s.fekIndex) ? '?' : s.fekIndex.toFixed(2)} · ${s.szint}. szint · ${s.nev}`;
console.log(`\nLegkitettebb ${hossz}:`); rendezett.slice(0, hossz).forEach(s => console.log(ki(s)));
console.log(`\nLegkevésbé kitett ${hossz}:`); rendezett.slice(-hossz).reverse().forEach(s => console.log(ki(s)));
console.log('\nSzemrevételezés: a lista elején és végén lévő munkaköröknek egyezniük kell az intuícióval (ügyfélszolgálat, adatrögzítő felül; villanyszerelő, ápoló alul).');
