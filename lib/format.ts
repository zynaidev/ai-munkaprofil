// AI-Munkaprofil – megjelenítési formázás (tiszta függvények). Nem számol modellt, csak formáz.

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
