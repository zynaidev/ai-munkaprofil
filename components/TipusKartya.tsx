// Típuskártya az eredményoldal tetején – szöveg: landing-copy.md, 2. fejezet.
// A típus színe csak kis jelzés (pont, vékony csík); a típus neve mindig kiírva.
// Az oldal h1-e a SEO-cím (app/[slug]/page.tsx), itt a felcím sima címke.
import type { ProfilTipus } from "@/lib/scoring";
import SectionLabel from "./SectionLabel";

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

export default function TipusKartya({ nev, tipus }: { nev: string; tipus: ProfilTipus }) {
  return (
    <article className="relative overflow-hidden rounded-3xl border border-hairline bg-elevated px-6 py-10 sm:px-12 sm:py-14">
      <span aria-hidden="true" className={`absolute top-0 left-6 h-0.5 w-16 sm:left-12 ${TIPUSSZIN[tipus]}`} />
      <SectionLabel>{`${nev} · AI-Munkaprofil`}</SectionLabel>
      <p className="mt-6 flex items-center gap-4 font-display text-tipus font-medium text-primary">
        <span aria-hidden="true" className={`size-3 shrink-0 rounded-full sm:size-4 ${TIPUSSZIN[tipus]}`} />
        {tipus}
      </p>
      <p className="mt-6 max-w-xl text-lead text-secondary text-pretty">{TIPUSMONDAT[tipus]}</p>
    </article>
  );
}
