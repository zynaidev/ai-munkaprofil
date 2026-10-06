import type { ReactNode } from "react";
import Container from "./Container";
import SectionLabel from "./SectionLabel";

// Tartalmi szekció a dizájnrendszer ritmusával: hairline felső szegély, nagy függőleges térköz,
// SectionLabel + H2, keskeny tartalmi oszlop. Minden második szekció `alt` háttérrel.
export default function Szekcio({
  id,
  sorszam,
  cimke,
  cim,
  alt = false,
  children,
}: {
  id: string;
  sorszam: string;
  cimke: string;
  cim: string;
  alt?: boolean;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-cim`} className={`border-t border-hairline py-28 lg:py-36 ${alt ? "bg-alt" : ""}`}>
      <Container>
        <div className="belep mx-auto max-w-3xl">
          <SectionLabel sorszam={sorszam}>{cimke}</SectionLabel>
          <h2 id={`${id}-cim`} className="mt-5 font-display text-h2 font-medium text-balance text-primary">
            {cim}
          </h2>
          <div className="mt-12">{children}</div>
        </div>
      </Container>
    </section>
  );
}
