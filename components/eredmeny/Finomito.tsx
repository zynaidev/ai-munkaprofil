// Finomító kérdések – szöveg: landing-copy.md „Finomítás” (az írásbeli kérdés új mikroszöveg).
// Vezérlők, nem kártyák: fieldset + legend, natív rádiógombokra épülő szegmentált pill-választó
// (nyilakkal kezelhető, a fókusz a pill-en látszik). Állapotot nem tart, a ProfilNezet adja.
import type { Csatorna } from "@/lib/scoring";
import { kerdesSzamSzo, VALASZOK, type Valasz, type Valaszok } from "@/lib/finomitas";

const KERDES: Record<Csatorna, string> = {
  telefon: "Mennyit dolgozol telefonon?",
  szemelyes: "Mennyit dolgozol személyesen, ügyfelekkel?",
  irasos: "Mennyit dolgozol írásban (e-mailben, chaten)?",
};

const VALASZ_CIMKE: Record<Valasz, string> = {
  ritka: "Szinte soha",
  neha: "Néha",
  sok: "A munkám nagy része",
};

export default function Finomito({
  azon,
  csatornak,
  valaszok,
  onValasz,
  onVisszaallit,
}: {
  azon: string;
  csatornak: Csatorna[];
  valaszok: Valaszok;
  onValasz: (cs: Csatorna, v: Valasz) => void;
  onVisszaallit: () => void;
}) {
  const aktiv = Object.keys(valaszok).length > 0;

  return (
    <div className="mt-12 border-t border-hairline pt-10">
      <h3 className="font-display text-h3 font-medium text-primary">Pontosítsd a profilod</h3>
      <p className="mt-2 text-torzs text-secondary">
        Ez a munkakör átlaga. {kerdesSzamSzo(csatornak.length)} kérdéssel személyesebb lesz.
      </p>

      <div className="mt-8 space-y-8">
        {csatornak.map((cs) => (
          <fieldset key={cs}>
            <legend className="font-medium text-primary">{KERDES[cs]}</legend>
            <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl border border-line p-1 sm:inline-grid sm:auto-cols-max sm:grid-flow-col sm:grid-cols-none sm:rounded-full">
              {VALASZOK.map((v) => (
                <label key={v} className="relative">
                  <input
                    type="radio"
                    name={`${azon}-${cs}`}
                    value={v}
                    checked={valaszok[cs] === v}
                    onChange={() => onValasz(cs, v)}
                    className="peer sr-only"
                  />
                  <span className="flex h-full min-h-11 cursor-pointer items-center justify-center rounded-xl px-3 py-2 text-center text-kicsi leading-snug text-secondary transition-colors select-none peer-checked:bg-primary peer-checked:font-medium peer-checked:text-on-accent! peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent hover:text-primary sm:rounded-full sm:px-5">
                    {VALASZ_CIMKE[v]}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      {aktiv && (
        <div className="mt-6 flex flex-wrap items-center gap-x-4">
          <p className="text-kicsi text-secondary">Frissítettük a te munkád alapján.</p>
          <button
            type="button"
            onClick={onVisszaallit}
            className="min-h-11 text-kicsi font-medium text-accent underline decoration-accent-30 underline-offset-4 transition-colors hover:decoration-accent"
          >
            Visszaállítás
          </button>
        </div>
      )}
    </div>
  );
}
