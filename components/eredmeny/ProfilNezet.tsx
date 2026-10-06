"use client";

// Az eredményoldal finomítástól függő része: hero (típus), 01 órabontás + finomító kérdések, 02 Mikor?,
// 04 feladatlista, és a megosztás (06). A fékek és a teendő szekciót a szerver rendereli, slotként kapjuk
// (nem függnek a finomítástól). A megosztott URL a jelenlegi URL a finomítás query-vel.
//
// Állapot: a válaszok az URL-ben élnek (?telefon=sok …), history.replaceState-tel írva, navigáció nélkül.
// Szerveren és hidratáláskor az alapprofil renderelődik (useSyncExternalStore szerver-pillanatképe üres),
// így a statikus HTML és az első kliens-render azonos; ha az URL-ben érvényes válasz van, React utána
// egyszer újrarenderel. Az oldal statikus/ISR marad: searchParams-ot nem használunk.
import { useId, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { szamolProfil, type Csatorna, type Munkakor, type Profil } from "@/lib/scoring";
import { elerhetoCsatornak, finomitasbol, irUrl, olvasUrl, szukit, type Valasz, type Valaszok } from "@/lib/finomitas";
import { egeszOra, horizontEgeszOrak, ora, oraSzam } from "@/lib/format";
import { megosztasiUrl, megosztasSzoveg } from "@/lib/megosztas";
import { ogCim } from "@/lib/seo";
import Container from "../Container";
import Szekcio from "../Szekcio";
import FeladatLista from "./FeladatLista";
import Finomito from "./Finomito";
import Hero from "./Hero";
import Horizont from "./Horizont";
import Megosztas from "./Megosztas";
import OraBontas from "./OraBontas";

// ───────── URL-hez kötött válasz-tár (useSyncExternalStore) ─────────
// A „Néha” választ az URL nem tárolja (alapértelmezett), ezért a kiválasztott állapot a memóriában is
// megvan; oldalváltáskor (más útvonal) újra az URL-ből indul.
const URES: Valaszok = {};
let tar: { ut: string; valaszok: Valaszok } | null = null;
const figyelok = new Set<() => void>();

function feliratkoz(f: () => void) {
  figyelok.add(f);
  return () => {
    figyelok.delete(f);
  };
}

function pillanatkep(): Valaszok {
  const ut = window.location.pathname;
  if (tar?.ut !== ut) tar = { ut, valaszok: olvasUrl(window.location.search) };
  return tar.valaszok;
}

function beallit(valaszok: Valaszok) {
  const { pathname, search, hash } = window.location;
  tar = { ut: pathname, valaszok };
  window.history.replaceState(null, "", pathname + irUrl(search, valaszok) + hash);
  figyelok.forEach((f) => f());
}

// A jelenlegi oldal-URL (finomítás query-vel, horgony nélkül); szerveren a kanonikus URL
const jelenlegiUrl = () => megosztasiUrl(window.location.href);

const frissitve = (p: Profil) =>
  `Frissítve: ${ora(p.orak.kivalthato)} kiváltható, ${ora(p.orak.felgyorsul)} felgyorsul, ${ora(p.orak.emberi)} emberi mag`;

export default function ProfilNezet({
  munkakor,
  kanonikusUrl,
  fekek,
  teendo,
}: {
  munkakor: Munkakor;
  kanonikusUrl: string;
  fekek: ReactNode;
  teendo: ReactNode;
}) {
  const azon = useId();
  const csatornak = useMemo(() => elerhetoCsatornak(munkakor.feladatok), [munkakor]);
  const nyers = useSyncExternalStore(feliratkoz, pillanatkep, () => URES);
  const valaszok = useMemo(() => szukit(nyers, csatornak), [nyers, csatornak]);
  const profil = useMemo(() => szamolProfil(munkakor, finomitasbol(valaszok)), [munkakor, valaszok]);
  const [bejelentes, setBejelentes] = useState("");
  const url = useSyncExternalStore(feliratkoz, jelenlegiUrl, () => kanonikusUrl);
  const megosztas = { url, cim: ogCim(profil), szoveg: megosztasSzoveg(profil) };

  function frissit(uj: Valaszok) {
    beallit(uj);
    setBejelentes(frissitve(szamolProfil(munkakor, finomitasbol(uj))));
  }
  const onValasz = (cs: Csatorna, v: Valasz) => frissit({ ...valaszok, [cs]: v });

  const hetiOra = oraSzam(profil.hetiOra);

  return (
    <>
      <div className="pt-6 sm:pt-10">
        <Container>
          <div className="mx-auto max-w-3xl">
            {/* Sima <a>: a next/link több kliens-JS-t hozna (CLAUDE.md 6.) */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="inline-flex min-h-11 items-center font-mono text-xs tracking-[0.08em] text-secondary transition-colors hover:text-accent"
            >
              <span aria-hidden="true">←</span>&nbsp;Másik munkakör
            </a>
            <Hero nev={profil.nev} tipus={profil.tipus} reszletekId="reszletek" megosztas={megosztas} />
          </div>
        </Container>
      </div>

      <Szekcio id="orak" horgony="reszletek" sorszam="01" cimke={`A heti ${hetiOra} órád`} cim={`Mi történik a heti ${hetiOra} órával?`} alt>
        <OraBontas orak={profil.orak} hetiOra={profil.hetiOra} visszanyertOra={profil.visszanyertOra} />
        {csatornak.length > 0 && (
          <Finomito
            azon={azon}
            csatornak={csatornak}
            valaszok={valaszok}
            onValasz={onValasz}
            onVisszaallit={() => frissit({})}
          />
        )}
        <p className="sr-only" aria-live="polite">
          {bejelentes}
        </p>
      </Szekcio>

      <Szekcio id="mikor" sorszam="02" cimke="Mikor?" cim="Nem holnap. De nem is soha.">
        <Horizont
          kivalthato={profil.orak.kivalthato}
          orak={horizontEgeszOrak(profil.kivalthatoHorizontSzerint, profil.orak.kivalthato)}
          gyakorlatbanMa={egeszOra(profil.gyakorlatbanMaKivalthato)}
        />
      </Szekcio>

      {fekek}

      <Szekcio id="feladatok" sorszam="04" cimke="Feladatonként" cim="A munkád, feladatokra bontva">
        <FeladatLista feladatok={profil.feladatok} />
      </Szekcio>

      {teendo}

      <Szekcio id="megosztas" sorszam="06" cimke="Megosztás" cim="Kíváncsi vagy, a kollégáid hova esnek?">
        <Megosztas {...megosztas} />
      </Szekcio>
    </>
  );
}
