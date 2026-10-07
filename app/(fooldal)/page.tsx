// Kezdőoldal – szöveg: landing-copy.md, 1. fejezet (szó szerint)
// Szerverkomponens; kliens-JS csak a Kereso-ban van.
import type { Metadata } from "next";
import Container from "@/components/Container";
import Kereso from "@/components/Kereso";
import PrimaryCta from "@/components/PrimaryCta";
import SectionLabel from "@/components/SectionLabel";
import { zynaiUrl } from "@/lib/linkek";
import { statikusMeta } from "@/lib/seo";
import { SZINTEK } from "@/lib/tipusok";

export const metadata: Metadata = statikusMeta(
  "/",
  "Elveszi az AI a munkádat?",
  "Nem egy riogató százalékot kapsz. Megmutatjuk, hogy a heti 40 órádból mennyit vesz át az AI, mennyit gyorsít fel, és mi marad a te dolgod – kutatási adatok alapján.",
);

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

const TENYEK = ["Ingyenes", "~1 perc", "Regisztráció nélkül"];

const szekcio = "border-t border-hairline py-28 lg:py-36";
const h2 = "font-display text-h2 font-medium text-balance text-primary";

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="hero-hatter relative -mt-16 overflow-hidden pt-16">
        <Container className="relative">
          <div className="mx-auto max-w-3xl pt-16 pb-28 text-center lg:pt-24 lg:pb-36">
            <p className="inline-flex items-center gap-2.5 rounded-full border border-accent-30 bg-[rgba(189,255,0,0.06)] px-3.5 py-1.5 font-mono text-cimke leading-none tracking-[0.14em] text-accent uppercase">
              <span aria-hidden="true" className="pulzalo-pont size-1.5 rounded-full bg-accent" />
              AI-Munkaprofil · ingyenes, 1 perc
            </p>

            <h1 className="mt-8 font-display text-h1 font-medium text-balance text-primary">
              Elveszi az AI a <span className="kiemelt-szo">munkádat</span>?
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lead text-secondary text-pretty">
              Nem egy riogató százalékot kapsz. Megmutatjuk, hogy a{" "}
              <span className="font-medium text-primary">heti 40 órádból</span> mennyit vesz át az AI, mennyit gyorsít
              fel, és <span className="font-medium text-primary">mi marad a te dolgod</span> – kutatási adatok
              alapján.
            </p>

            <div className="mx-auto mt-10 max-w-2xl text-left">
              <Kereso />
              <p className="mt-4 text-center text-kicsi text-secondary">
                Nem kell regisztráció. Nem tárolunk semmit, amit beírsz, hacsak nem te jelzed nekünk.
              </p>
            </div>

            <ul className="mx-auto mt-14 grid max-w-2xl grid-cols-3 divide-x divide-hairline rounded-3xl border border-hairline bg-elevated">
              {TENYEK.map((t) => (
                <li
                  key={t}
                  className="flex items-center justify-center gap-2 px-2 py-5 font-mono text-cimke leading-snug tracking-[0.14em] text-primary uppercase sm:px-4"
                >
                  <span aria-hidden="true" className="hidden size-1 shrink-0 rounded-full bg-accent sm:block" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* Négy típus */}
      <section aria-labelledby="tipusok-cim" className={`${szekcio} bg-alt`}>
        <Container>
          <div className="mx-auto max-w-5xl">
            <div className="belep">
              <SectionLabel sorszam="01">A típusok</SectionLabel>
              <h2 id="tipusok-cim" className={`mt-5 ${h2}`}>
                Te melyik típus vagy?
              </h2>
            </div>
            {/* A négy szint emelkedő sorrendben (1 → 4); név, leírás, szín: lib/tipusok.ts */}
            <ol className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {SZINTEK.map((t) => (
                <li
                  key={t.kulcs}
                  className="tipus-kartya rounded-2xl border border-hairline bg-elevated p-6 transition-colors duration-300 hover:border-accent-30"
                >
                  <p className="font-mono text-cimke tracking-[0.14em] text-secondary uppercase">{t.szint}. szint</p>
                  <h3 className="mt-3 flex items-center gap-3 font-display text-h3 font-medium text-primary">
                    <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${t.pontOsztaly}`} />
                    {t.cimke}
                  </h3>
                  <p className="mt-3 text-torzs text-secondary">{t.leiras}</p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      {/* Hogyan számolunk? */}
      <section aria-labelledby="modszer-cim" className={szekcio}>
        <Container>
          <div className="belep mx-auto max-w-3xl">
            <SectionLabel sorszam="02">Módszer</SectionLabel>
            <h2 id="modszer-cim" className={`mt-5 ${h2}`}>
              Nem jóslat. Kutatás.
            </h2>
            <ol className="mt-12 space-y-4">
              {LEPESEK.map((l, i) => {
                const sorszam = String(i + 1).padStart(2, "0");
                return (
                  <li key={l.cim} className="relative">
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 right-full mr-8 hidden -translate-y-1/2 font-display text-[140px] leading-none font-medium text-white/[0.025] select-none lg:block"
                    >
                      {sorszam}
                    </span>
                    <div className="rounded-2xl border border-hairline bg-elevated p-6 sm:p-8">
                      <span aria-hidden="true" className="font-mono text-cimke tracking-[0.14em] text-accent">
                        {sorszam}
                      </span>
                      <p className="mt-3 text-torzs text-secondary">
                        <strong className="font-medium text-primary">{l.cim}</strong> {l.szoveg}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
            {/* Sima <a>: a next/link kliens-JS-t hozna (CLAUDE.md 6.) */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/modszertan"
              className="mt-10 inline-flex min-h-11 items-center gap-1 font-medium text-accent underline decoration-accent-30 underline-offset-[6px] transition-colors hover:decoration-accent"
            >
              Részletes módszertan&nbsp;<span aria-hidden="true">→</span>
            </a>
          </div>
        </Container>
      </section>

      {/* Záró sáv – B2B */}
      <section aria-labelledby="csapat-cim" className={`${szekcio} bg-alt`}>
        <Container>
          <div className="belep relative mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-6 py-16 text-center sm:px-12 sm:py-20">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_55%_at_50%_50%,rgba(189,255,0,0.07),transparent_70%)]"
            />
            <div className="relative">
              <SectionLabel sorszam="03">Csapatoknak</SectionLabel>
              <h2 id="csapat-cim" className={`mx-auto mt-5 max-w-2xl ${h2}`}>
                Vezetőként a csapatod érdekel?
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-torzs text-secondary">
                Felvisszük a cégetek munkaköreit, és megmutatjuk,{" "}
                <span className="font-medium text-primary">hol szabadul fel a legtöbb idő AI-val</span> – és hol nem éri
                meg hozzányúlni.
              </p>
              <PrimaryCta href={zynaiUrl("/kapcsolatfelvetel", "kezdooldal-csapat")} className="mt-10">
                Csapatelemzést kérek
              </PrimaryCta>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
