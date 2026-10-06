// Háromrészes órabontás-sáv (kiváltható / felgyorsul / emberi mag), tisztán CSS-sel.
// A szín mellett mintázat is jelöl, a képernyőolvasó a szöveges aria-label-t kapja.
// A szegmensek zsugorodhatnak, így a résekkel együtt is pontosan kitöltik a sávot.
import { szelesseg } from "@/lib/format";

export const KATEGORIAK = [
  { kulcs: "kivalthato", minta: "minta-kivalthato", nev: "kiváltható" },
  { kulcs: "felgyorsul", minta: "minta-felgyorsul", nev: "felgyorsul" },
  { kulcs: "emberi", minta: "minta-emberi", nev: "emberi mag" },
] as const;

export type Bontas = Record<(typeof KATEGORIAK)[number]["kulcs"], number>;

// Mintás jelölő (a jelmagyarázatban és a feliratok előtt)
export function Jelolo({ minta, className = "" }: { minta: string; className?: string }) {
  return <span aria-hidden="true" className={`inline-block size-3.5 shrink-0 rounded-[3px] ${minta} ${className}`} />;
}

// Tömör, egysoros jelmagyarázat
export function Jelmagyarazat() {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2 text-kicsi text-secondary">
      {KATEGORIAK.map(({ kulcs, minta, nev }) => (
        <li key={kulcs} className="flex items-center gap-2">
          <Jelolo minta={minta} />
          {nev}
        </li>
      ))}
    </ul>
  );
}

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
