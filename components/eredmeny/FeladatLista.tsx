// „Feladatonként” blokk – szöveg: landing-copy.md, 2. fejezet
import type { FeladatEredmeny } from "@/lib/scoring";
import { ora } from "@/lib/format";
import BontasSav from "./BontasSav";
import { HORIZONT_CIMKE } from "./Horizont";

export default function FeladatLista({ feladatok }: { feladatok: FeladatEredmeny[] }) {
  return (
    <ul className="space-y-3">
      {feladatok.map((f) => (
        <li
          key={f.leiras}
          className={`rounded-2xl border bg-elevated p-5 sm:p-6 ${f.emberiMag ? "border-accent-20" : "border-hairline"}`}
        >
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
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-line px-3 py-1 font-mono text-cimke tracking-[0.1em] text-secondary uppercase">
              {HORIZONT_CIMKE[f.horizont]}
            </span>
            {f.emberiMag && (
              <span className="rounded-full border border-accent-30 bg-accent-05 px-3 py-1 font-mono text-cimke tracking-[0.1em] text-accent uppercase">
                Ez marad – és felértékelődik
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
