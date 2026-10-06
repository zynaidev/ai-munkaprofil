// Eredményoldal herója: mono címke, SEO-H1, a típus nagyban, típusmondat (landing-copy.md 2. és 5. fejezet),
// alatta horgonygomb a részletekhez. Doboz nélkül; a típus színe csak a pont, a név mindig kiírva.
import type { ProfilTipus } from "@/lib/scoring";
import SectionLabel from "../SectionLabel";

const TIPUSMONDAT: Record<ProfilTipus, string> = {
  Átalakuló: "A munkád nagy része átalakul – a tudásod nem.",
  Felerősödő: "Az AI nem helyetted dolgozik, hanem melletted.",
  Kevert: "Félig átalakul, félig felgyorsul a munkád.",
  Védett: "A munkád magját nem lehet letölteni.",
};

const TIPUSSZIN: Record<ProfilTipus, string> = {
  Átalakuló: "bg-atalakulo",
  Felerősödő: "bg-felerosodo",
  Kevert: "bg-kevert",
  Védett: "bg-vedett",
};

export default function Hero({ nev, tipus, reszletekId }: { nev: string; tipus: ProfilTipus; reszletekId: string }) {
  return (
    <div className="flex min-h-[min(80svh,720px)] flex-col justify-center py-12">
      <SectionLabel>AI-Munkaprofil</SectionLabel>
      <h1 className="mt-5 max-w-2xl font-display text-oldalcim font-medium text-balance text-primary">
        {nev} és az AI: mi változik a munkában?
      </h1>

      <p className="mt-10 flex items-center gap-3 font-display text-tipus font-medium text-primary sm:gap-5">
        <span aria-hidden="true" className={`size-3 shrink-0 rounded-full sm:size-5 ${TIPUSSZIN[tipus]}`} />
        {tipus}
      </p>
      <p className="mt-6 max-w-xl text-lead text-secondary text-pretty">{TIPUSMONDAT[tipus]}</p>

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
