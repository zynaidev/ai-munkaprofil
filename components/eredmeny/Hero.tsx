// Eredményoldal herója: mono címke, SEO-H1, szint („3. szint · 4-ből” + 4 szegmenses jelző), a típus nagyban,
// alatta az egymondatos leírás és horgonygomb a részletekhez. Doboz nélkül.
// Név, leírás, szint és szín: lib/tipusok.ts. A szint jelentését a felirat, a kitöltés és a méret is hordozza,
// a szín csak kiegészítés.
import type { ProfilTipus } from "@/lib/scoring";
import { SZINTEK, TIPUSOK, szintAlt, szintCimke } from "@/lib/tipusok";
import SectionLabel from "../SectionLabel";

export default function Hero({ nev, tipus, reszletekId }: { nev: string; tipus: ProfilTipus; reszletekId: string }) {
  const t = TIPUSOK[tipus];

  return (
    <div className="flex min-h-[min(80svh,720px)] flex-col justify-center py-12">
      <SectionLabel>AI-Munkaprofil</SectionLabel>
      <h1 className="mt-5 max-w-2xl font-display text-oldalcim font-medium text-balance text-primary">
        {nev} és az AI: mi változik a munkában?
      </h1>

      <div className="mt-10 flex items-center gap-4">
        <span aria-hidden="true" className="font-mono text-cimke tracking-[0.14em] text-secondary uppercase">
          {szintCimke(t.szint)}
        </span>
        <span role="img" aria-label={szintAlt(t)} className="flex items-center gap-1">
          {SZINTEK.map(({ szint }) => (
            <span
              key={szint}
              className={`block rounded-full ${
                szint === t.szint
                  ? `h-3 w-9 ${t.pontOsztaly}`
                  : szint < t.szint
                    ? "h-1.5 w-6 bg-secondary"
                    : "h-1.5 w-6 border border-line"
              }`}
            />
          ))}
        </span>
      </div>

      <p className="mt-4 font-display text-tipus font-medium whitespace-nowrap text-primary">{t.cimke}</p>
      <p className="mt-6 max-w-xl text-lead text-secondary text-pretty">{t.leiras}</p>

      <div className="mt-12">
        <a
          href={`#${reszletekId}`}
          className="inline-flex min-h-11 items-center gap-2.5 rounded-full border border-line px-6 py-3 text-cta font-medium text-primary transition-colors hover:border-accent-30"
        >
          Tudd meg a részleteket
          <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none" className="nyil-le shrink-0">
            <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </div>
  );
}
