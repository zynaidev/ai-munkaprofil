// Módszertan – landing-copy.md 3. fejezet. Statikus szerverkomponens.
// A szintek a lib/tipusok.ts-ből, a küszöbök és állandók a lib/scoring.ts KONSTANSOK-ból, a finomítás szorzói a
// lib/finomitas.ts-ből jönnek, így az oldal mindig egyezik a kóddal. A példát is a szamolProfil számolja.
import type { Metadata } from "next";
import Container from "@/components/Container";
import SectionLabel from "@/components/SectionLabel";
import Szekcio from "@/components/Szekcio";
import { adatVerzioFelirat, getAdatVerzio } from "@/lib/data";
import { SZORZO } from "@/lib/finomitas";
import { ora, tizedes } from "@/lib/format";
import { zynaiUrl } from "@/lib/linkek";
import { KONSTANSOK, szamolProfil, type Munkakor } from "@/lib/scoring";
import { SZINTEK, TIPUSOK } from "@/lib/tipusok";

export const metadata: Metadata = {
  title: "Módszertan",
  description:
    "Honnan jönnek a számok? Mit mérünk, honnan vesszük az adatot, hogyan számolunk, és mit nem tud a modell.",
  alternates: { canonical: "/modszertan" },
};

// A szint eldöntése (lib/scoring.ts profilTipus), közérthetően, számok nélkül. A küszöbök csak a kódban vannak.
const DONTES = [
  { t: TIPUSOK.vedett, feltetel: "ha a munkát az AI összességében kevéssé érinti – vagy azért, mert a feladatok nagy része kívül esik rajta, vagy mert erős fékek lassítják" },
  { t: TIPUSOK.automatizalodo, feltetel: "ha a munkát az AI erősen érinti, és az érintett részben jelentős a kiváltás (nem csak gyorsítás)" },
  { t: TIPUSOK.atalakulo, feltetel: "ha a munkát az AI jelentősen érinti, de az érintett rész inkább felgyorsul, vagy a kitettség közepesen erős" },
  { t: TIPUSOK.felerosodo, feltetel: "minden más esetben: az AI érezhetően jelen van, de főleg gyorsít és segít" },
];

// Kitalált példa: egy 40 órás munkakör, amelynek első feladatára a munkaidő negyede jut
const PELDA_KITETTSEG = 0.8;
const PELDA_KIVALTAS = 0.5;
const pelda: Munkakor = {
  slug: "pelda",
  nev: "Példa",
  hetiOra: 40,
  fekek: { fizikai: 0, felelosseg: 0, szabalyozas: 0, bizalom: 0 },
  feladatok: [
    { leiras: "A", idoArany: 0.25, kitettseg: PELDA_KITETTSEG, kivaltasArany: PELDA_KIVALTAS, horizont: "ma" },
    { leiras: "B", idoArany: 0.75, kitettseg: 0, kivaltasArany: 0, horizont: "5ev+" },
  ],
};
const peldaFeladat = szamolProfil(pelda).feladatok[0];

const sor = "border-t border-hairline py-5";
const kiemelt = "font-medium text-primary";
const kulsoLink =
  "py-3 text-primary underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent";

export default function ModszertanOldal() {
  const adatVerzio = adatVerzioFelirat(getAdatVerzio());

  return (
    <main>
      <Container className="pt-16 pb-16 lg:pt-24 lg:pb-24">
        <div className="mx-auto max-w-3xl">
          <SectionLabel>Módszertan</SectionLabel>
          <h1 className="mt-5 font-display text-h2 font-medium text-balance text-primary">Honnan jönnek a számok?</h1>
          <p className="mt-6 max-w-2xl text-lead text-secondary">
            Az átláthatóság a lényeg. Itt leírjuk, mit mérünk, honnan vesszük az adatot, és mit nem tud a modell.
          </p>
        </div>
      </Container>

      <Szekcio id="mit" sorszam="01" cimke="Mit mutat" cim="Mit mutat az eszköz – és mit nem" alt>
        <p className="text-torzs text-secondary">
          Az AI-Munkaprofil egy munkakör heti munkaidejét bontja fel aszerint, hogy az AI mennyit tud belőle átvenni,
          mennyit gyorsít fel, és mi marad emberi feladat. Nem egyetlen számot kapsz, hanem órákat, feladatonként, mert
          egy munkakör sok különböző feladatból áll.
        </p>
        <dl className="mt-8 border-b border-hairline">
          {[
            ["Kiváltható", "az AI egyedül is el tudja végezni, neked ellenőrizned kell"],
            ["Felgyorsul", "továbbra is te csinálod, de AI-val gyorsabban"],
            ["Emberi mag", "ezt az AI érdemben nem tudja"],
          ].map(([cim, szoveg]) => (
            <div key={cim} className={`${sor} sm:grid sm:grid-cols-[10rem_1fr] sm:gap-6`}>
              <dt className={kiemelt}>{cim}</dt>
              <dd className="text-torzs text-secondary">{szoveg}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-torzs text-secondary">
          Mellé tesszük, hogy a kiváltható rész mikor válhat valóra (már ma, 1–3 éven belül, vagy 5+ év múlva,
          bizonytalanul), és mi fékezi a változást.
        </p>
        <h3 className="mt-10 font-display text-h3 font-medium text-primary">Amit nem mutat</h3>
        <ul className="mt-4 space-y-3 text-torzs text-secondary">
          <li>
            <span className={kiemelt}>Nem egyéni előrejelzés.</span> Egy munkakör átlagát mutatja, nem a te
            munkahelyedet.
          </li>
          <li>
            <span className={kiemelt}>Nem karrier-tanácsadás.</span> Kiindulópontnak szánjuk, nem döntésnek.
          </li>
          <li>
            <span className={kiemelt}>Nem mondja meg, mi történik egy adott állással.</span> A technikai lehetőség és a
            valós bevezetés között fékek állnak.
          </li>
        </ul>
      </Szekcio>

      <Szekcio id="szintek" sorszam="02" cimke="Szintek" cim="A négy szint">
        <p className="text-torzs text-secondary">Minden munkakör a négy szint egyikébe kerül.</p>
        <ol className="mt-8 border-b border-hairline">
          {SZINTEK.map((t) => (
            <li key={t.kulcs} className={`${sor} sm:grid sm:grid-cols-[10rem_1fr] sm:gap-6`}>
              <p className="flex items-center gap-3">
                <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${t.pontOsztaly}`} />
                <span>
                  <span className="block font-mono text-cimke tracking-[0.14em] text-secondary uppercase">
                    {t.szint}. szint
                  </span>
                  <span className={kiemelt}>{t.cimke}</span>
                </span>
              </p>
              <p className="mt-2 text-torzs text-secondary sm:mt-0 sm:self-end">{t.leiras}</p>
            </li>
          ))}
        </ol>

        <h3 className="mt-12 font-display text-h3 font-medium text-primary">Hogyan dől el a szint?</h3>
        <p className="mt-4 text-torzs text-secondary">
          Két dolgot nézünk. Az egyik, hogy a heti munkaidődből mekkora részt érint az AI – ezt a fékek csökkentik,
          mert ahol erős a felelősség, a szabályozás, a fizikai jelenlét vagy az ügyfelek bizalma, ott a változás
          lassabb. A másik, hogy az érintett részből mennyi kiváltás és mennyi csak gyorsítás. A szinteket ebben a
          sorrendben nézzük, és az első illeszkedő dönt:
        </p>
        <ol className="mt-6 list-decimal space-y-3 pl-6 text-torzs text-secondary marker:text-secondary">
          {DONTES.map(({ t, feltetel }) => (
            <li key={t.kulcs}>
              <span className={kiemelt}>{t.cimke}</span> ({t.szint}. szint) – {feltetel}.
            </li>
          ))}
        </ol>
        <p className="mt-6 text-torzs text-secondary">
          A határokat szakmai becsléssel állítottuk be, hogy a szintek értelmesen különítsék el a munkaköröket. Ez nem
          tudományos mérés eredménye: ha jobb adatunk lesz, a határokat is pontosítjuk.
        </p>
      </Szekcio>

      <Szekcio id="adatok" sorszam="03" cimke="Adatok" cim="Honnan jönnek az adatok" alt>
        <p className="text-torzs text-secondary">
          Nemzetközi kutatások feladatszintű adataiból dolgozunk, és ezeket fordítjuk le magyar munkakörökre.
        </p>
        <dl className="mt-8 border-b border-hairline">
          <div className={sor}>
            <dt className={kiemelt}>
              <a href="https://www.onetcenter.org/database.html" className={kulsoLink}>
                O*NET 31.0 Database
              </a>{" "}
              – az amerikai munkaügyi minisztérium (U.S. Department of Labor, Employment and Training Administration,
              USDOL/ETA) foglalkozási adatbázisa
            </dt>
            <dd className="mt-1 text-torzs text-secondary">
              Az O*NET-adatbázisból a feladatok leírását (Task Statements), valamint a feladatok gyakoriságát és
              fontosságát (Task Ratings) használjuk. Licenc:{" "}
              <a href="https://creativecommons.org/licenses/by/4.0/" className={kulsoLink}>
                CC BY 4.0
              </a>
              . Az O*NET-adatokat átcsoportosítottuk és módosítottuk; ezeket a módosításokat az USDOL/ETA nem hagyta
              jóvá.
            </dd>
          </div>
          <div className={sor}>
            <dt className={kiemelt}>
              <a href="https://arxiv.org/abs/2303.10130" className={kulsoLink}>
                „GPTs are GPTs”
              </a>{" "}
              – az OpenAI és a Pennsylvaniai Egyetem kutatása
            </dt>
            <dd className="mt-1 text-torzs text-secondary">
              Feladatonként megmondja, mennyire érintik a nagy nyelvi modellek (E0, E1 és E2 kitettségi címkék).
              Adatforrás:{" "}
              <a href="https://github.com/openai/GPTs-are-GPTs" className={kulsoLink}>
                github.com/openai/GPTs-are-GPTs
              </a>
              , MIT licenc.
            </dd>
          </div>
          <div className={sor}>
            <dt className={kiemelt}>
              <a href="https://huggingface.co/datasets/Anthropic/EconomicIndex" className={kulsoLink}>
                Anthropic Economic Index
              </a>
            </dt>
            <dd className="mt-1 text-torzs text-secondary">
              Valós AI-használat alapján feladatonként azt, hogy az AI inkább elvégzi a feladatot (kiváltás), vagy
              segít benne (felerősítés). Licenc: CC BY 4.0.
            </dd>
          </div>
          <div className={sor}>
            <dt className={kiemelt}>Megfeleltetési táblák</dt>
            <dd className="mt-1 text-torzs text-secondary">
              A{" "}
              <a href="https://www.ksh.hu/docs/osztalyozasok/feor/fordkulcs_feor_isco_hu.pdf" className={kulsoLink}>
                FEOR-08 ↔ ISCO-08 (KSH)
              </a>{" "}
              és az{" "}
              <a href="https://www.bls.gov/soc/" className={kulsoLink}>
                ISCO-08 ↔ amerikai SOC (BLS)
              </a>{" "}
              táblák kötik össze a magyar munkaköröket az amerikai adatokkal.
            </dd>
          </div>
        </dl>

        <h3 className="mt-12 font-display text-h3 font-medium text-primary">Hogyan lesz belőle magyar munkakör?</h3>
        <p className="mt-4 text-torzs text-secondary">
          Munkakörönként a legsúlyosabb feladatokat (legfeljebb 25) négy–hét érthető, magyar nevű feladatcsoportba
          vonjuk össze. Az összevonást és a fékek első változatát Claude készíti, a számokat a program számolja, és
          minden munkakört kézzel is átnézünk. Az összevonás nem torzít: a csoportok értékei súlyozott átlagok, így az
          órák összege nem változik.
        </p>
        <ul className="mt-6 space-y-3 text-torzs text-secondary">
          <li>
            <span className={kiemelt}>Kitettség:</span> E1 → teljes (1), E2 → fél (0,5), E0 → nincs (0).
          </li>
          <li>
            <span className={kiemelt}>Időhorizont:</span> E1 → már ma, E2 → 1–3 éven belül, E0 → 5+ év.
          </li>
          <li>
            <span className={kiemelt}>Kiváltási arány:</span> a kiváltó és a felerősítő használat aránya. Ha egy
            feladatra nincs adat, a feladatkategória átlagát vesszük, végső esetben 0,5-öt.
          </li>
        </ul>
        <p className="mt-8 text-xs leading-[1.8] text-secondary">
          This site includes information from the{" "}
          <a href="https://www.onetcenter.org/database.html" className={kulsoLink}>
            O*NET 31.0 Database
          </a>{" "}
          by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under the{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/" className={kulsoLink}>
            CC BY 4.0
          </a>{" "}
          license. ZynAI has modified all or some of this information. USDOL/ETA has not approved, endorsed, or tested these modifications. O*NET® is a trademark of
          USDOL/ETA.
        </p>
      </Szekcio>

      <Szekcio id="szamitas" sorszam="04" cimke="Számítás" cim="Hogyan számolunk">
        <ol className="list-decimal space-y-4 pl-6 text-torzs text-secondary marker:text-secondary">
          <li>
            <span className={kiemelt}>A feladat heti órája</span> = heti óra × a feladat időaránya. Az időarány az
            O*NET-adatbázis gyakorisági (log-skálán) és fontossági értékeiből jön, a kiegészítő feladatok fél
            súllyal. Ez közelítés: az O*NET-adatbázis nem méri közvetlenül, mennyi időt töltesz egy feladattal.
          </li>
          <li>
            <span className={kiemelt}>Kiváltható</span> = a feladat órája × kitettség × kiváltási arány.{" "}
            <span className={kiemelt}>Felgyorsul</span> = a feladat órája × kitettség × (1 − kiváltási arány).{" "}
            <span className={kiemelt}>Emberi mag</span> = a feladat órája × (1 − kitettség).
          </li>
          <li>A három összeget egész órákra kerekítjük úgy, hogy pontosan kiadják a heti órát.</li>
          <li>
            <span className={kiemelt}>Visszanyert idő</span>: a felgyorsuló órák{" "}
            {tizedes(KONSTANSOK.felerositesMegtakaritas)}-szorosa.
          </li>
          <li>
            <span className={kiemelt}>Fékek</span>: fizikai jelenlét, felelősség, szabályozás és ügyfélbizalom,
            mindegyik 0–3 skálán (0: nem fékez, 3: erősen fékez). A fékindex a négy érték összege osztva 12-vel. A ma
            reálisan érintett órák = a ma kiváltható órák × (1 − {tizedes(KONSTANSOK.FEK_SULY)} × fékindex).
          </li>
          <li>
            <span className={kiemelt}>Finomítás</span>: ha megadod, mennyit dolgozol telefonon, személyesen vagy
            írásban, az adott csatornához kötött feladatok időarányát megszorozzuk (szinte soha:{" "}
            {tizedes(SZORZO.ritka)}, néha: {tizedes(SZORZO.neha)}, a munkám nagy része: {tizedes(SZORZO.sok)}), majd
            újra elosztjuk a heti órákat.
          </li>
        </ol>

        <div className="mt-10 rounded-2xl border border-accent-20 bg-accent-05 px-6 py-5">
          <p className="font-mono text-cimke tracking-[0.14em] text-accent uppercase">Példa, kitalált számokkal</p>
          <p className="mt-3 text-torzs text-secondary">
            Egy heti {pelda.hetiOra} órás munkakörben az egyik feladatra a munkaidő negyede jut: ez{" "}
            {ora(peldaFeladat.ora)}. Ha a kitettsége {tizedes(PELDA_KITETTSEG)}, a kiváltási aránya{" "}
            {tizedes(PELDA_KIVALTAS)}, akkor <span className={kiemelt}>{ora(peldaFeladat.kivaltottOra)}</span>{" "}
            kiváltható, <span className={kiemelt}>{ora(peldaFeladat.felerositettOra)}</span> felgyorsul, és{" "}
            <span className={kiemelt}>{ora(peldaFeladat.emberiOra)}</span> emberi mag marad.
          </p>
        </div>
      </Szekcio>

      <Szekcio id="korlatok" sorszam="05" cimke="Korlátok" cim="Mit nem tud a modell" alt>
        <ul className="border-b border-hairline text-torzs text-secondary">
          <li className={sor}>
            <span className={kiemelt}>Becslés, nem előrejelzés.</span> Nem mondja meg, mi történik veled vagy a
            munkahelyeddel.
          </li>
          <li className={sor}>
            <span className={kiemelt}>Amerikai alapadatok.</span> Amerikai feladatleírásokból dolgozunk, magyar
            munkakörökre igazítva; egy magyar munkahely feladatai ettől eltérhetnek.
          </li>
          <li className={sor}>
            <span className={kiemelt}>Az időarány becslés, nem mérés.</span>
          </li>
          <li className={sor}>
            <span className={kiemelt}>A technológia gyorsabban változik, mint az adat.</span>
          </li>
          <li className={sor}>
            <span className={kiemelt}>Az eredmény átlag, nem a te munkahelyed.</span>
          </li>
        </ul>
        <p className="mt-8 text-torzs text-secondary">
          Jelenlegi adatverzió: <span className={kiemelt}>{adatVerzio}</span>
        </p>
      </Szekcio>

      <Szekcio id="kapcsolat" sorszam="06" cimke="Kapcsolat" cim="Kérdésed van?">
        <p className="text-torzs text-secondary">
          Ha kérdésed van a módszertanról, vagy hibát találsz egy munkakörnél, írj nekünk:{" "}
          <a href="mailto:info@zynai.hu" className={kulsoLink}>
            info@zynai.hu
          </a>
          . Többet rólunk a{" "}
          <a href={zynaiUrl("/", "modszertan-kapcsolat")} className={kulsoLink}>
            zynai.hu
          </a>{" "}
          oldalon találsz.
        </p>
      </Szekcio>
    </main>
  );
}
