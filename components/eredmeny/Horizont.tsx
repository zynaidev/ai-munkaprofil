// „Mikor?” blokk – szöveg: landing-copy.md, 2. fejezet
import type { Horizont as HorizontKulcs } from "@/lib/scoring";
import { ora } from "@/lib/format";

// A horizontok címkéi; a feladatlista is ezeket használja
export const HORIZONT_CIMKE: Record<HorizontKulcs, string> = {
  ma: "Már ma",
  "1-3ev": "1–3 éven belül",
  "5ev+": "5+ év / bizonytalan",
};

const MAGYARAZAT: Record<HorizontKulcs, string | null> = {
  ma: "létező, olcsó eszközökkel megoldható",
  "1-3ev": "a technológia van, a bevezetés lassabb",
  "5ev+": null,
};

export default function Horizont({
  szerint,
  gyakorlatbanMa,
}: {
  szerint: Record<HorizontKulcs, number>;
  gyakorlatbanMa: number;
}) {
  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-3">
        {(Object.keys(HORIZONT_CIMKE) as HorizontKulcs[]).map((h) => (
          <li key={h} className="rounded-2xl border border-hairline bg-elevated p-6">
            <p className="font-mono text-cimke tracking-[0.14em] text-secondary uppercase">{HORIZONT_CIMKE[h]}</p>
            <p className="mt-3 font-display text-h2 font-medium text-primary">{ora(szerint[h])}</p>
            {MAGYARAZAT[h] && <p className="mt-2 text-kicsi leading-[1.7] text-secondary">{MAGYARAZAT[h]}</p>}
          </li>
        ))}
      </ul>
      <p className="mt-8 text-torzs text-secondary">
        A fékek figyelembevételével ma reálisan kb.{" "}
        <strong className="font-medium text-primary">{ora(gyakorlatbanMa)}</strong> érintett.
      </p>
    </>
  );
}
