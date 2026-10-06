// AI-Munkaprofil – megjelenítési formázás (tiszta függvények). Nem számol modellt, csak formáz és kerekít.
import { egeszreKerekit, type Horizont } from './scoring.ts';

// Óraszám magyar formátumban: legfeljebb egy tizedes, tizedesvesszővel; egész számnál tizedes nélkül.
// 12.5 → „12,5”, 19 → „19”, 9.25 → „9,3”, 40.0 → „40”
export function oraSzam(ora: number): string {
  if (!Number.isFinite(ora)) throw new Error(`Érvénytelen óraszám: ${ora}`);
  const kerek = Math.round(ora * 10) / 10;
  return (Object.is(kerek, -0) ? 0 : kerek).toString().replace('.', ',');
}

// Óra a mondatbeli szerepe szerint ragozva. Számnév után a magyarban egyes szám áll („19 óra”, „12,5 órát”).
export function ora(ertek: number, eset: 'alany' | 'targy' = 'alany'): string {
  return `${oraSzam(ertek)} ${eset === 'targy' ? 'órát' : 'óra'}`;
}

// CSS-szélesség egy rész arányából (sávokhoz), 0–100% közé szorítva.
export function szelesseg(resz: number, egesz: number): string {
  if (!(egesz > 0) || !Number.isFinite(resz)) return '0%';
  const sz = Math.min(100, Math.max(0, (resz / egesz) * 100));
  return `${Math.round(sz * 100) / 100}%`;
}

// Szám pontosan, tizedesvesszővel (pl. küszöbök: 0.35 → „0,35”), kerekítés nélkül
export function tizedes(n: number): string {
  return String(n).replace('.', ',');
}

// Egész órára kerekítés megjelenítéshez (pl. „ma reálisan kb. 10 óra”).
export function egeszOra(ertek: number): number {
  if (!Number.isFinite(ertek)) throw new Error(`Érvénytelen óraszám: ${ertek}`);
  return Math.max(0, Math.round(ertek));
}

const HORIZONTOK: Horizont[] = ['ma', '1-3ev', '5ev+'];

// A horizontonkénti kiváltható órák egész órákra, úgy, hogy összegük pontosan a sávon látható
// egész „kiváltható” óra legyen. Előbb arányosan a célösszegre skáláz, majd a legnagyobb maradék
// módszerével (scoring.ts egeszreKerekit) kerekít – új kerekítési szabály nincs.
export function horizontEgeszOrak(szerint: Record<Horizont, number>, kivalthato: number): Record<Horizont, number> {
  const ertekek = HORIZONTOK.map((h) => Math.max(0, szerint[h]));
  const osszeg = ertekek.reduce((a, b) => a + b, 0);
  const egeszek = osszeg > 0 ? egeszreKerekit(ertekek.map((v) => (v * kivalthato) / osszeg), kivalthato) : [0, 0, 0];
  return { ma: egeszek[0], '1-3ev': egeszek[1], '5ev+': egeszek[2] };
}
