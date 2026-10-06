// „Feladatonként” blokk – szöveg: landing-copy.md, 2. fejezet.
// Doboz nélküli, hairline-elválasztós sorok; az emberi mag feladatokat a lime címke emeli ki.
import type { FeladatEredmeny } from "@/lib/scoring";
import { ora } from "@/lib/format";
import BontasSav, { Jelmagyarazat } from "./BontasSav";
import { HORIZONT_CIMKE } from "./Horizont";

export default function FeladatLista({ feladatok }: { feladatok: FeladatEredmeny[] }) {
  return (
    <>
      <Jelmagyarazat />
      <ul className="mt-8 border-b border-hairline">
        {feladatok.map((f) => (
          <li key={f.leiras} className="border-t border-hairline py-6">
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-medium text-primary">{f.leiras}</p>
              <p className="shrink-0 font-mono text-sm text-primary">{ora(f.ora)}</p>
            </div>
            <div className="mt-4">
              <BontasSav
                bontas={{ kivalthato: f.kivaltottOra, felgyorsul: f.felerositettOra, emberi: f.emberiOra }}
                osszes={f.ora}
                cimke={`${ora(f.kivaltottOra)} kiváltható, ${ora(f.felerositettOra)} felgyorsul, ${ora(f.emberiOra)} emberi mag`}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="font-mono text-cimke tracking-[0.1em] text-secondary uppercase">
                {HORIZONT_CIMKE[f.horizont]}
              </span>
              {f.emberiMag && (
                <span className="rounded-full bg-accent-10 px-3 py-1 font-mono text-cimke tracking-[0.1em] text-accent uppercase">
                  Ez marad – és felértékelődik
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
