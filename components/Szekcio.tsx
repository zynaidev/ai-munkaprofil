import type { ReactNode } from "react";
import Container from "./Container";
import SectionLabel from "./SectionLabel";

// Eredményoldali tartalmi szekció: hairline felső szegély, py-16/lg:py-24, SectionLabel + H2,
// max-w-3xl tartalmi oszlop (a sávok és sorok ezt teljes szélességben használják).
// Minden második szekció `alt` háttérrel; `horgony` = a section id-ja horgonylinkhez.
export default function Szekcio({
  id,
  horgony,
  sorszam,
  cimke,
  cim,
  alt = false,
  children,
}: {
  id: string;
  horgony?: string;
  sorszam: string;
  cimke: string;
  cim: string;
  alt?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={horgony}
      aria-labelledby={`${id}-cim`}
      className={`border-t border-hairline py-16 lg:py-24 ${alt ? "bg-alt" : ""}`}
    >
      <Container>
        <div className="belep mx-auto max-w-3xl">
          <SectionLabel sorszam={sorszam}>{cimke}</SectionLabel>
          <h2 id={`${id}-cim`} className="mt-5 font-display text-h2 font-medium text-balance text-primary">
            {cim}
          </h2>
          <div className="mt-10">{children}</div>
        </div>
      </Container>
    </section>
  );
}
