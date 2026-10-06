// Kezdőoldal – szöveg: landing-copy.md, 1. fejezet (szó szerint)
import type { Metadata } from "next";
import Kereso from "@/components/Kereso";

export const metadata: Metadata = {
  title: "Elveszi az AI a munkádat?",
  description:
    "Nem egy riogató százalékot kapsz. Megmutatjuk, hogy a heti 40 órádból mennyit vesz át az AI, mennyit gyorsít fel, és mi marad a te dolgod – kutatási adatok alapján.",
};

const TIPUSOK = [
  {
    nev: "Átalakuló",
    szin: "bg-atalakulo",
    leiras: "A munkád jelentős része már ma kiváltható. A szereped gyorsan változik, és ebben lehetőség is van.",
  },
  {
    nev: "Felerősödő",
    szin: "bg-felerosodo",
    leiras: "Az AI főleg gyorsít. Kevesebb rutin, több idő arra, amiben igazán jó vagy.",
  },
  {
    nev: "Kevert",
    szin: "bg-kevert",
    leiras: "Van, ami kiváltható, van, ami csak gyorsul. A te kezedben van, merre billen.",
  },
  {
    nev: "Védett",
    szin: "bg-vedett",
    leiras: "Munkád magja fizikai jelenlétet, kézügyességet vagy bizalmat igényel. Az AI itt inkább segéd.",
  },
];

const LEPESEK = [
  {
    cim: "Feladatokra bontjuk a munkádat.",
    szoveg: "Egy munkakör nem egy dolog: tucatnyi feladatból áll, eltérő időaránnyal.",
  },
  {
    cim: "Megnézzük, mit tud ma az AI.",
    szoveg: "Nemzetközi kutatások feladatszintű adatai alapján: mit tud elvégezni egyedül, és miben csak segít.",
  },
  {
    cim: "Figyelembe vesszük, mi fékez.",
    szoveg:
      "Felelősség, szabályozás, ügyfélbizalom, fizikai jelenlét – ezek miatt a technikailag lehetséges nem történik meg azonnal.",
  },
];

const tartaly = "mx-auto w-full max-w-5xl px-5 sm:px-8";

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[56rem] -translate-x-1/2 rounded-full bg-kiemelo-halvany opacity-70 blur-3xl"
        />
        <div className={`${tartaly} relative pt-14 pb-16 sm:pt-24 sm:pb-24`}>
          <p className="inline-flex items-center gap-2 rounded-full border border-vonal bg-felulet px-3 py-1 text-xs font-medium tracking-wide text-halvany">
            <span aria-hidden="true" className="flex gap-0.5">
              <span className="size-1.5 rounded-full bg-atalakulo" />
              <span className="size-1.5 rounded-full bg-felerosodo" />
              <span className="size-1.5 rounded-full bg-kevert" />
              <span className="size-1.5 rounded-full bg-vedett" />
            </span>
            AI-Munkaprofil · ingyenes, 1 perc
          </p>

          <h1 className="mt-6 max-w-3xl font-display text-hero leading-[1.02] font-bold tracking-tight text-balance">
            Elveszi az AI a munkádat?
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-halvany text-pretty">
            Nem egy riogató százalékot kapsz. Megmutatjuk, hogy a heti 40 órádból mennyit vesz át az AI, mennyit
            gyorsít fel, és mi marad a te dolgod – kutatási adatok alapján.
          </p>

          <div className="mt-8 max-w-2xl">
            <Kereso />
            <p className="mt-3 text-xs text-halvany">Nem kell regisztráció. Nem tárolunk semmit, amit beírsz.</p>
          </div>
        </div>
      </section>

      {/* Négy típus */}
      <section aria-labelledby="tipusok-cim" className="border-t border-vonal py-16 sm:py-20">
        <div className={tartaly}>
          <h2 id="tipusok-cim" className="font-display text-xl font-bold tracking-tight">
            Te melyik típus vagy?
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {TIPUSOK.map((t) => (
              <li key={t.nev} className="relative overflow-hidden rounded-doboz border border-vonal bg-felulet p-5 pl-7">
                <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${t.szin}`} />
                <h3 className="font-display text-lg font-bold">{t.nev}</h3>
                <p className="mt-1 text-halvany">{t.leiras}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Hogyan számolunk? */}
      <section aria-labelledby="modszer-cim" className="border-t border-vonal py-16 sm:py-20">
        <div className={tartaly}>
          <h2 id="modszer-cim" className="font-display text-xl font-bold tracking-tight">
            Nem jóslat. Kutatás.
          </h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
            {LEPESEK.map((l, i) => (
              <li key={l.cim} className="border-t-2 border-szoveg pt-4">
                <span aria-hidden="true" className="font-display text-xl font-bold text-kiemelo">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-2">
                  <strong className="font-semibold">{l.cim}</strong> <span className="text-halvany">{l.szoveg}</span>
                </p>
              </li>
            ))}
          </ol>
          <a
            href="/modszertan"
            className="mt-8 inline-flex min-h-erintes items-center font-semibold text-kiemelo underline decoration-2 underline-offset-4 hover:text-kiemelo-hover"
          >
            Részletes módszertan&nbsp;<span aria-hidden="true">→</span>
          </a>
        </div>
      </section>

      {/* Záró sáv */}
      <section aria-labelledby="csapat-cim" className="sav bg-sav-hatter text-sav-szoveg">
        <div className={`${tartaly} py-16 sm:flex sm:items-end sm:justify-between sm:gap-10 sm:py-20`}>
          <div className="max-w-2xl">
            <h2 id="csapat-cim" className="font-display text-xl font-bold tracking-tight">
              Vezetőként a csapatod érdekel?
            </h2>
            <p className="mt-3 text-sav-halvany">
              Felvisszük a cégetek munkaköreit, és megmutatjuk, hol szabadul fel a legtöbb idő AI-val – és hol nem éri
              meg hozzányúlni.
            </p>
          </div>
          <a
            href="https://zynai.hu"
            className="mt-6 inline-flex min-h-14 shrink-0 items-center justify-center rounded-doboz bg-sav-szoveg px-6 font-semibold text-sav-hatter transition-opacity hover:opacity-90 sm:mt-0"
          >
            Csapatelemzést kérek
          </a>
        </div>
      </section>
    </main>
  );
}
