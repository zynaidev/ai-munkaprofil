// „Mi fékez?” blokk – szöveg: landing-copy.md, 2. fejezet. 0–3 skála, a szám is kiírva; 0-nál „nem fékez”.
// Doboz nélküli, hairline-elválasztós sorok.
import type { Fekek as FekErtekek } from "@/lib/scoring";

const FEKEK: { kulcs: keyof FekErtekek; nev: string }[] = [
  { kulcs: "fizikai", nev: "Fizikai jelenlét" },
  { kulcs: "felelosseg", nev: "Felelősség" },
  { kulcs: "szabalyozas", nev: "Szabályozás" },
  { kulcs: "bizalom", nev: "Ügyfélbizalom" },
];

const SKALA = [1, 2, 3] as const;

export default function Fekek({ ertekek, indoklas }: { ertekek: FekErtekek; indoklas: Record<keyof FekErtekek, string> }) {
  return (
    <ul className="border-b border-hairline">
      {FEKEK.map(({ kulcs, nev }) => (
        <li key={kulcs} className="grid gap-3 border-t border-hairline py-6 sm:grid-cols-[13rem_1fr] sm:gap-8">
          <div>
            <p className="font-medium text-primary">{nev}</p>
            <div className="mt-3 flex items-center gap-3">
              <span aria-hidden="true" className="flex gap-1">
                {SKALA.map((i) => (
                  <span
                    key={i}
                    className={`h-2 w-7 rounded-full ${i <= ertekek[kulcs] ? "bg-primary" : "border border-line"}`}
                  />
                ))}
              </span>
              {ertekek[kulcs] === 0 ? (
                <span className="font-mono text-xs text-secondary">nem fékez</span>
              ) : (
                <span className="font-mono text-xs text-secondary">
                  {ertekek[kulcs]}
                  <span aria-hidden="true">/3</span>
                  <span className="sr-only"> a 3-ból</span>
                </span>
              )}
            </div>
          </div>
          <p className="text-torzs text-secondary">{indoklas[kulcs]}</p>
        </li>
      ))}
    </ul>
  );
}
