// „Mikor?” blokk – szöveg: landing-copy.md, 2. fejezet.
// Doboz nélkül: három oszlop hairline függőleges elválasztókkal (mobilon egymás alatt, vízszintes elválasztóval).
// A horizont-órák egészek, és összegük a sávon látható kiváltható óra (a hívó adja, lib/format horizontEgeszOrak).
import type { Horizont as HorizontKulcs } from "@/lib/scoring";
import { ora } from "@/lib/format";

// A horizontok címkéi; a feladatlista is ezeket használja
export const HORIZONT_CIMKE: Record<HorizontKulcs, string> = {
  ma: "Már ma",
  "1-3ev": "1–3 éven belül",
  "5ev+": "5+ év / bizonytalan",
};

const MAGYARAZAT: Record<HorizontKulcs, string> = {
  ma: "létező, olcsó eszközökkel megoldható",
  "1-3ev": "a technológia van, a bevezetés lassabb",
  "5ev+": "ma még nem látszik rá megbízható megoldás",
};

export default function Horizont({
  kivalthato,
  orak,
  gyakorlatbanMa,
}: {
  kivalthato: number;
  orak: Record<HorizontKulcs, number>;
  gyakorlatbanMa: number;
}) {
  return (
    <>
      <p className="text-torzs text-secondary">A kiváltható {ora(kivalthato)} időbeli megoszlása:</p>
      <ul className="mt-8 grid divide-y divide-hairline border-y border-hairline sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:border-y-0">
        {(Object.keys(HORIZONT_CIMKE) as HorizontKulcs[]).map((h) => (
          <li key={h} className="py-6 sm:px-6 sm:py-2 sm:first:pl-0 sm:last:pr-0">
            <p className="font-mono text-cimke tracking-[0.14em] text-secondary uppercase">{HORIZONT_CIMKE[h]}</p>
            <p className="mt-3 font-display text-h2 font-medium text-primary">{ora(orak[h])}</p>
            <p className="mt-2 text-kicsi leading-[1.7] text-secondary">{MAGYARAZAT[h]}</p>
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
