// Az OG-kép színei hexben (a satori nem ismeri a CSS-változókat). A globals.css tokenjeinek megfelelői;
// a lib/ogPaletta.test.ts őrzi, hogy egyezzenek. A szintek színei: lib/tipusok.ts (szin).
export const OG_PALETTA = {
  hatter: '#09090b',     // --bg-base
  szoveg: '#fafafa',     // --text-primary
  szoveg2: '#a1a1aa',    // --text-secondary
  lime: '#bdff00',       // --accent (csak kiemelés)
  kivalthato: '#e69f00', // --szin-kivalthato
  felgyorsul: '#56b4e9', // --szin-felgyorsul
  emberi: '#71717a',     // --szin-emberi
} as const;
