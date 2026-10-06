"use client";

// Munkakör-kereső: ARIA combobox (WAI-ARIA APG, „list autocomplete”).
// A /data/kereso.json csak az első fókuszkor töltődik be, egyszer (hiba után újrapróbálható).
// A beírt szöveget nem küldjük sehova és nem naplózzuk.
import { useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { indexel, keres, normalizal, type IndexeltMunkakor, type KeresoForras } from "@/lib/search";
import PrimaryCta from "./PrimaryCta";

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
      <form role="search" onSubmit={bekuld} className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
            className="peer min-h-14 w-full rounded-xl border border-mezo-keret bg-[rgba(255,255,255,0.04)] px-5 text-mezo text-primary transition-colors placeholder:text-secondary hover:border-secondary focus:border-accent focus-visible:outline-offset-2 max-sm:placeholder:text-transparent"
          />
          {/* Mobilon rövidebb placeholder (csak CSS): a hosszú placeholder átlátszó, helyette ez látszik */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 hidden items-center pl-5 text-mezo text-secondary max-sm:peer-placeholder-shown:flex"
          >
            Pl. könyvelő, grafikus…
          </span>

          <ul
            id={listaAzon}
            role="listbox"
            aria-label="Találatok"
            hidden={!listaLathato}
            className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-hairline bg-elevated py-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
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
                className={`flex min-h-11 cursor-pointer items-center px-5 py-2 text-mezo ${
                  i === aktiv ? "bg-accent-10 font-medium text-primary" : "text-secondary"
                }`}
              >
                {m.nev}
              </li>
            ))}
          </ul>
        </div>

        <PrimaryCta type="submit">Mutasd a profilom</PrimaryCta>
      </form>

      <p className="sr-only" aria-live="polite">
        {listaLathato ? `${talalatok.length} találat` : ""}
      </p>

      {allapot === "hiba" && (
        <p role="alert" className="mt-4 rounded-xl border border-[rgba(255,180,166,0.2)] bg-hiba-hatter px-5 py-3 text-left text-kicsi leading-[1.7] text-hiba">
          Valami elakadt, nem sikerült betölteni a munkakörök listáját. Próbáld újra pár perc múlva.
        </p>
      )}

      {nincsTalalat && (
        <div className="mt-4 rounded-xl border border-hairline bg-elevated p-5 text-left sm:flex sm:items-center sm:justify-between sm:gap-6">
          <p className="text-kicsi leading-[1.7] text-secondary">
            Nem találjuk pontosan ezt a munkakört. Megkeressük a hozzá legközelebb állót.
          </p>
          <button
            type="button"
            onClick={() => console.info("Besorolás: a 10. lépésben kötjük be.")}
            className="mt-4 min-h-11 w-full shrink-0 rounded-full border border-accent-30 bg-accent-05 px-6 text-kicsi font-medium text-accent transition-colors hover:border-accent hover:bg-accent-10 sm:mt-0 sm:w-auto"
          >
            Keresd meg a legközelebbit
          </button>
        </div>
      )}
    </div>
  );
}
