// Megosztás blokk – szöveg: landing-copy.md „Megosztás”. Sima linkek (Facebook, LinkedIn), link másolása,
// és ha a böngésző tudja, natív megosztás az előre megírt szöveggel (mobilon ez az elsődleges).
import { facebookUrl, linkedinUrl } from "@/lib/megosztas";
import MasolasVisszajelzes from "./MasolasVisszajelzes";
import { useMegosztas } from "./useMegosztas";

const masodlagos =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-line px-5 py-2.5 text-kicsi font-medium text-primary transition-colors hover:border-accent-30";

export default function Megosztas({ url, cim, szoveg }: { url: string; cim: string; szoveg: string }) {
  const { tud, allapot, masol, megoszt } = useMegosztas({ url, cim, szoveg });
  const ujLap = <span className="sr-only"> (új lapon nyílik meg)</span>;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {tud && (
          <button
            type="button"
            onClick={megoszt}
            className={`${masodlagos} max-sm:order-first max-sm:border-accent max-sm:bg-accent max-sm:text-on-accent sm:order-last`}
          >
            Megosztás…
          </button>
        )}
        <a href={facebookUrl(url)} target="_blank" rel="noopener noreferrer" className={masodlagos}>
          Megosztom Facebookon{ujLap}
        </a>
        <a href={linkedinUrl(url)} target="_blank" rel="noopener noreferrer" className={masodlagos}>
          Megosztom LinkedInen{ujLap}
        </a>
        <button type="button" onClick={masol} className={masodlagos}>
          Link másolása
        </button>
      </div>
      <MasolasVisszajelzes allapot={allapot} url={url} />
    </>
  );
}
