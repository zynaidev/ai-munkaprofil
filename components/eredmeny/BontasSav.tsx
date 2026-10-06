// Háromrészes órabontás-sáv (kiváltható / felgyorsul / emberi mag), tisztán CSS-sel.
// A szín mellett mintázat is jelöl, a képernyőolvasó a szöveges aria-label-t kapja.
// A szegmensek zsugorodhatnak, így a résekkel együtt is pontosan kitöltik a sávot.
import { szelesseg } from "@/lib/format";

export const KATEGORIAK = [
  { kulcs: "kivalthato", minta: "minta-kivalthato" },
  { kulcs: "felgyorsul", minta: "minta-felgyorsul" },
  { kulcs: "emberi", minta: "minta-emberi" },
] as const;

export type Bontas = Record<(typeof KATEGORIAK)[number]["kulcs"], number>;

export default function BontasSav({
  bontas,
  osszes,
  cimke,
  vastag = false,
}: {
  bontas: Bontas;
  osszes: number;
  cimke: string;
  vastag?: boolean;
}) {
  return (
    <div
      role="img"
      aria-label={cimke}
      className={`flex w-full gap-0.5 overflow-hidden ${vastag ? "h-14 rounded-xl sm:h-16" : "h-2 rounded-full"} bg-[rgba(255,255,255,0.04)]`}
    >
      {KATEGORIAK.map(({ kulcs, minta }) =>
        bontas[kulcs] > 0 ? (
          <span key={kulcs} className={`h-full min-w-0 ${minta}`} style={{ width: szelesseg(bontas[kulcs], osszes) }} />
        ) : null,
      )}
    </div>
  );
}
