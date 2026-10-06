// AI-Munkaprofil – munkakör-kereső (tiszta függvények, kliensen és szerveren is futtatható).
// Ékezet- és kisbetű-független keresés a nevekben és az aliasokban; a névre illeszkedés előrébb kerül.

export interface KeresoForras {
  slug: string;
  nev: string;
  aliasok: string[];
}

export interface IndexeltMunkakor extends KeresoForras {
  _nev: string;       // normalizált név
  _aliasok: string[]; // normalizált aliasok
}

export const MAX_TALALAT = 6;

// Kisbetű, ékezet nélkül, egyszerűsített szóközökkel. Írásjelek szóközzé válnak.
export function normalizal(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function indexel(lista: KeresoForras[]): IndexeltMunkakor[] {
  return lista.map((m) => ({ ...m, _nev: normalizal(m.nev), _aliasok: m.aliasok.map(normalizal) }));
}

// Kisebb pontszám = jobb találat; null = nincs illeszkedés.
// 0: a szöveg így kezdődik · 1: valamelyik szava így kezdődik · 2: minden keresett szó benne van
function illeszkedes(mezo: string, kifejezes: string, szavak: string[]): number | null {
  if (mezo.startsWith(kifejezes)) return 0;
  if (mezo.split(' ').some((sz) => sz.startsWith(szavak[0])) && szavak.every((sz) => mezo.includes(sz))) return 1;
  if (szavak.every((sz) => mezo.includes(sz))) return 2;
  return null;
}

export function keres(index: IndexeltMunkakor[], kerdes: string, max = MAX_TALALAT): KeresoForras[] {
  const kifejezes = normalizal(kerdes);
  if (!kifejezes) return [];
  const szavak = kifejezes.split(' ');

  const talalatok: { m: IndexeltMunkakor; pont: number }[] = [];
  for (const m of index) {
    const nevPont = illeszkedes(m._nev, kifejezes, szavak);
    const aliasPontok = m._aliasok.map((a) => illeszkedes(a, kifejezes, szavak)).filter((p) => p !== null);
    // A névre illeszkedés mindig megelőzi az aliasra illeszkedést.
    const pont = nevPont ?? (aliasPontok.length ? 3 + Math.min(...aliasPontok) : null);
    if (pont !== null) talalatok.push({ m, pont });
  }

  return talalatok
    .sort((a, b) => a.pont - b.pont || a.m.nev.localeCompare(b.m.nev, 'hu'))
    .slice(0, max)
    .map(({ m }) => ({ slug: m.slug, nev: m.nev, aliasok: m.aliasok }));
}
