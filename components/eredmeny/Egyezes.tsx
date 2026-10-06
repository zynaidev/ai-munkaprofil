// „Egyezik ez a tapasztalatoddal?” – igen/nem visszajelzés a látott szintről. Csak a slug és a szint megy el
// (lusta küldő modul, gombnyomáskor). Az állapot csak a kliensben él.
import { useRef, useState } from "react";
import Container from "../Container";

type Allapot = "alap" | "kuld" | "kesz" | "hiba";

const gomb =
  "inline-flex min-h-11 min-w-20 items-center justify-center rounded-full border border-line px-6 text-kicsi font-medium text-primary transition-colors hover:border-accent-30 disabled:cursor-wait disabled:opacity-60";

export default function Egyezes({ slug, szint }: { slug: string; szint: 1 | 2 | 3 | 4 }) {
  const [allapot, setAllapot] = useState<Allapot>("alap");
  const csapdaRef = useRef<HTMLInputElement>(null);

  async function valasz(egyezik: boolean) {
    if (allapot === "kuld" || allapot === "kesz") return;
    setAllapot("kuld");
    const { kuldVisszajelzest } = await import("@/lib/visszajelzesKuldes");
    const ok = await kuldVisszajelzest({ tipus: "szint-egyezes", slug, szint, egyezik }, csapdaRef.current?.value ?? "");
    setAllapot(ok ? "kesz" : "hiba");
  }

  return (
    <div className="border-t border-hairline bg-alt py-10">
      <Container>
        <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-primary">Egyezik ez a tapasztalatoddal?</p>
          <div className="flex min-h-11 flex-wrap items-center gap-3">
            <input ref={csapdaRef} name="weboldal" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
            {allapot !== "kesz" && (
              <>
                <button type="button" onClick={() => valasz(true)} disabled={allapot === "kuld"} className={gomb}>
                  Igen
                </button>
                <button type="button" onClick={() => valasz(false)} disabled={allapot === "kuld"} className={gomb}>
                  Nem
                </button>
              </>
            )}
            <p aria-live="polite" className="text-kicsi text-secondary">
              {allapot === "kesz" ? "Köszönjük." : allapot === "hiba" ? "Most nem sikerült, próbáld később." : ""}
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
