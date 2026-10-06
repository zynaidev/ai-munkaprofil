"use client";

// Munkakör-kereső: ARIA combobox (WAI-ARIA APG, „list autocomplete”).
// A /data/kereso.json csak az első fókuszkor töltődik be, egyszer (hiba után újrapróbálható).
// A beírt szöveget nem küldjük sehova és nem naplózzuk.
import { useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { indexel, keres, normalizal, type IndexeltMunkakor, type KeresoForras } from "@/lib/search";

type Allapot = "kezdeti" | "tolt" | "kesz" | "hiba";

const SLUG_MINTA = /^[a-z0-9-]+$/;

export default function Kereso() {
  const router = useRouter();
  const azon = useId();
  const listaAzon = `${azon}-lista`;
  const opcioAzon = (i: number) => `${azon}-opcio-${i}`;

  const inputRef = useRef<HTMLInputElement>(null);
  const betoltes = useRef<Promise<IndexeltMunkakor[] | null> | null>(null);

  const [allapot, setAllapot] = useState<Allapot>("kezdeti");
  const [index, setIndex] = useState<IndexeltMunkakor[] | null>(null);
  const [kerdes, setKerdes] = useState("");
  const [nyitva, setNyitva] = useState(false);
  const [aktiv, setAktiv] = useState(-1);

  const talalatok = useMemo(() => (index ? keres(index, kerdes) : []), [index, kerdes]);
  const listaLathato = nyitva && talalatok.length > 0;
  const nincsTalalat = allapot === "kesz" && normalizal(kerdes) !== "" && talalatok.length === 0;

  function betolt(): Promise<IndexeltMunkakor[] | null> {
    if (index) return Promise.resolve(index);
    if (betoltes.current) return betoltes.current;
    setAllapot("tolt");
    betoltes.current = fetch("/data/kereso.json")
      .then((v) => {
        if (!v.ok) throw new Error(`HTTP ${v.status}`);
        return v.json() as Promise<KeresoForras[]>;
      })
      .then((lista) => {
        const idx = indexel(lista);
        setIndex(idx);
        setAllapot("kesz");
        return idx;
      })
      .catch(() => {
        betoltes.current = null; // a következő fókusz / gépelés újrapróbálja
        setAllapot("hiba");
        return null;
      });
    return betoltes.current;
  }

  function valaszt(m: KeresoForras) {
    if (!SLUG_MINTA.test(m.slug)) return;
    setKerdes(m.nev);
    setNyitva(false);
    setAktiv(-1);
    router.push(`/${m.slug}`);
  }

  function billentyu(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setNyitva(true);
        if (talalatok.length) setAktiv((a) => (a + 1) % talalatok.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setNyitva(true);
        if (talalatok.length) setAktiv((a) => (a <= 0 ? talalatok.length - 1 : a - 1));
        break;
      case "Enter":
        if (listaLathato && aktiv >= 0) {
          e.preventDefault();
          valaszt(talalatok[aktiv]);
        }
        break;
      case "Escape":
        if (listaLathato) {
          e.preventDefault();
          setNyitva(false);
          setAktiv(-1);
        } else if (kerdes) {
          e.preventDefault();
          setKerdes("");
        }
        break;
    }
  }

  async function bekuld(e: FormEvent) {
    e.preventDefault();
    if (!normalizal(kerdes)) {
      inputRef.current?.focus();
      return;
    }
    const idx = await betolt();
    if (!idx) return;
    const cel = listaLathato && aktiv >= 0 ? talalatok[aktiv] : keres(idx, kerdes)[0];
    if (cel) valaszt(cel);
    else setNyitva(true);
  }

  return (
    <div className="w-full">
      <form role="search" onSubmit={bekuld} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label="Írd be a munkakörödet"
            aria-autocomplete="list"
            aria-expanded={listaLathato}
            aria-controls={listaAzon}
            aria-activedescendant={listaLathato && aktiv >= 0 ? opcioAzon(aktiv) : undefined}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            placeholder="Írd be a munkakörödet, pl. könyvelő, ügyfélszolgálatos, grafikus…"
            value={kerdes}
            onFocus={() => {
              void betolt();
              setNyitva(true);
            }}
            onBlur={() => {
              setNyitva(false);
              setAktiv(-1);
            }}
            onChange={(e) => {
              if (allapot === "hiba") void betolt();
              setKerdes(e.target.value);
              setNyitva(true);
              setAktiv(-1);
            }}
            onKeyDown={billentyu}
            className="min-h-14 w-full rounded-doboz border-2 border-mezo-keret bg-felulet px-4 text-base text-szoveg shadow-sm transition-colors placeholder:text-halvany hover:border-szoveg focus:border-kiemelo focus-visible:outline-offset-2"
          />

          <ul
            id={listaAzon}
            role="listbox"
            aria-label="Találatok"
            hidden={!listaLathato}
            className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-doboz border border-vonal bg-felulet py-1 shadow-lg"
          >
            {talalatok.map((m, i) => (
              <li
                key={m.slug}
                id={opcioAzon(i)}
                role="option"
                aria-selected={i === aktiv}
                onMouseDown={(e) => e.preventDefault()} // a fókusz a mezőben marad
                onMouseMove={() => setAktiv(i)}
                onClick={() => valaszt(m)}
                className={`flex min-h-erintes cursor-pointer items-center px-4 py-2 text-base ${
                  i === aktiv ? "bg-kiemelo-halvany font-medium text-szoveg" : "text-szoveg"
                }`}
              >
                {m.nev}
              </li>
            ))}
          </ul>
        </div>

        <button
          type="submit"
          className="min-h-14 rounded-doboz bg-kiemelo px-6 text-base font-semibold text-kiemelo-szoveg transition-colors hover:bg-kiemelo-hover"
        >
          Mutasd a profilom
        </button>
      </form>

      <p className="sr-only" aria-live="polite">
        {listaLathato ? `${talalatok.length} találat` : ""}
      </p>

      {allapot === "hiba" && (
        <p role="alert" className="mt-4 rounded-doboz bg-hiba-hatter px-4 py-3 text-sm text-hiba">
          Valami elakadt, nem sikerült betölteni a munkakörök listáját. Próbáld újra pár perc múlva.
        </p>
      )}

      {nincsTalalat && (
        <div className="mt-4 rounded-doboz border border-vonal bg-felulet p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <p className="text-sm text-szoveg">
            Nem találjuk pontosan ezt a munkakört. Megkeressük a hozzá legközelebb állót.
          </p>
          <button
            type="button"
            onClick={() => console.info("Besorolás: a 10. lépésben kötjük be.")}
            className="mt-3 min-h-erintes w-full shrink-0 rounded-doboz border-2 border-kiemelo px-4 text-sm font-semibold text-kiemelo transition-colors hover:bg-kiemelo-halvany sm:mt-0 sm:w-auto"
          >
            Keresd meg a legközelebbit
          </button>
        </div>
      )}
    </div>
  );
}
