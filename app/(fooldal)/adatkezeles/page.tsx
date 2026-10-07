// Adatkezelési tájékoztató. A jogi keret (adatkezelő, általános tudnivalók, adattárolás és biztonság, érintetti
// jogok, jogorvoslat, módosítás) a zynai.hu tájékoztatójából szó szerint jön; a kezelt adatok és az adattovábbítás
// az AI-Munkaprofil tényleges működését írják le. A szöveg jogi átnézésre vár (az oldalon látható címke jelzi).
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Container from "@/components/Container";
import SectionLabel from "@/components/SectionLabel";
import Szekcio from "@/components/Szekcio";
import { statikusMeta } from "@/lib/seo";

export const metadata: Metadata = statikusMeta(
  "/adatkezeles",
  "Adatkezelési tájékoztató",
  "Milyen adatot kezel az AI-Munkaprofil, ki az adatkezelő, és milyen jogaid vannak.",
);

// A tájékoztató hatályba lépésének napja – egyetlen helyen; módosításkor itt kell átírni.
const HATALYOS_DATUM = "2026. október 7.";

const sor = "border-t border-hairline py-5";
const kiemelt = "font-medium text-primary";
const torzs = "text-torzs text-secondary";
const link =
  "py-3 font-medium text-primary underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent";

// Kulcs–érték sorok (adatkezelő, NAIH)
function Adatsorok({ sorok }: { sorok: [string, ReactNode][] }) {
  return (
    <dl className="border-b border-hairline text-torzs">
      {sorok.map(([cim, ertek]) => (
        <div key={cim} className={`${sor} sm:grid sm:grid-cols-[14rem_1fr] sm:gap-6`}>
          <dt className="text-secondary">{cim}</dt>
          <dd className={kiemelt}>{ertek}</dd>
        </div>
      ))}
    </dl>
  );
}

// Egy adatkezelési tétel: mit, milyen célból, milyen jogalapon, meddig
function Adatkezeles({ cim, children, cel, jogalap, megorzes }: {
  cim: string; children: ReactNode; cel: string; jogalap: string; megorzes: string;
}) {
  return (
    <li className={sor}>
      <h3 className="font-display text-h3 font-medium text-primary">{cim}</h3>
      <div className={`mt-3 space-y-3 ${torzs}`}>{children}</div>
      <dl className="mt-4 space-y-1 text-torzs">
        <div><dt className={`inline ${kiemelt}`}>Adatkezelés célja: </dt><dd className="inline text-secondary">{cel}</dd></div>
        <div><dt className={`inline ${kiemelt}`}>Jogalap: </dt><dd className="inline text-secondary">{jogalap}</dd></div>
        <div><dt className={`inline ${kiemelt}`}>Megőrzési idő: </dt><dd className="inline text-secondary">{megorzes}</dd></div>
      </dl>
    </li>
  );
}

const Felsorolas = ({ elemek }: { elemek: ReactNode[] }) => (
  <ul className={`mt-4 list-disc space-y-2 pl-6 marker:text-secondary ${torzs}`}>
    {elemek.map((e, i) => <li key={i}>{e}</li>)}
  </ul>
);

const email = (cim: string) => <a href={`mailto:${cim}`} className={link}>{cim}</a>;

export default function AdatkezelesOldal() {
  return (
    <main>
      <Container className="pt-16 pb-16 lg:pt-24 lg:pb-24">
        <div className="mx-auto max-w-3xl">
          <SectionLabel>Jogi dokumentum</SectionLabel>
          <h1 className="mt-5 font-display text-h2 font-medium text-balance text-primary">Adatkezelési tájékoztató</h1>
          <p className="mt-4 font-mono text-cimke tracking-[0.14em] text-secondary uppercase">
            Hatályos: {HATALYOS_DATUM} · GDPR · 2011. évi CXII. tv.
          </p>
          <p className="mt-6 max-w-2xl text-lead text-secondary">
            Röviden: az AI-Munkaprofil nem kér tőled személyes adatot. Amit technikai okból rögzítünk, azt alább
            pontosan leírjuk.
          </p>
          <p className="mt-6 font-mono text-cimke tracking-[0.14em] text-secondary uppercase">Jogi átnézésre vár</p>
        </div>
      </Container>

      <Szekcio id="adatkezelo" sorszam="01" cimke="Adatkezelő" cim="Az adatkezelő adatai" alt>
        <Adatsorok
          sorok={[
            ["Név", "Bakos Attila egyéni vállalkozó"],
            ["Székhely", "2119 Pécel, Maglódi út 66., Magyarország"],
            ["Nyilvántartási szám", "59341763"],
            ["Adószám", "90189021-1-33"],
            ["Weboldal", <a key="w" href="https://zynai.hu" className={link}>zynai.hu</a>],
            ["Kapcsolattartási e-mail", email("info@zynai.hu")],
          ]}
        />
      </Szekcio>

      <Szekcio id="altalanos" sorszam="02" cimke="Általános" cim="Általános tudnivalók">
        <div className={`space-y-4 ${torzs}`}>
          <p>
            Jelen tájékoztató a természetes személyek személyes adatainak kezelésére vonatkozó, az Európai Parlament és
            a Tanács (EU) 2016/679 rendelete (GDPR), valamint az információs önrendelkezési jogról és az
            információszabadságról szóló 2011. évi CXII. törvény (Info tv.) előírásai alapján készült.
          </p>
          <p>
            Az adatkezelő elkötelezett az érintett személyek adatainak védelme iránt, és megtesz minden ésszerű
            technikai és szervezési intézkedést az adatok biztonságos kezelése érdekében.
          </p>
        </div>
      </Szekcio>

      <Szekcio id="adatok" sorszam="03" cimke="Kezelt adatok" cim="Kezelt adatok" alt>
        <p className={torzs}>
          Az AI-Munkaprofil használatához nem kell regisztrálnod, és nem kell megadnod semmilyen személyes adatot. Az
          alábbi adatokat kezeljük:
        </p>
        <ol className="mt-6 border-b border-hairline">
          <Adatkezeles
            cim="3.1. Munkakör jelzése („Jelezd, hogy felvegyük”)"
            cel="a munkakörök listájának bővítése."
            jogalap="GDPR 6. cikk (1) bekezdés f) pont, jogos érdek (a munkakörlista bővítése)."
            megorzes="12 hónap."
          >
            <p>
              Ha a keresőben nincs találat, és a gombbal jelzed a munkakört, rögzítjük a beírt szöveget (tisztítva,
              legfeljebb 80 karakter), az időpontot és az adatverziót. Kérjük, ne írj bele személyes adatot. Az
              e-mail-címnek vagy telefonszámnak tűnő szöveget nem rögzítjük. Az IP-címedet a jelzéshez tartósan nem
              tároljuk: a túlterhelés elleni korláthoz legfeljebb 10 percig a szerver memóriájában van, és nem megy
              tovább. Böngészőazonosítót nem rögzítünk.
            </p>
          </Adatkezeles>
          <Adatkezeles
            cim="3.2. Visszajelzés az eredményről („Egyezik ez a tapasztalatoddal?”)"
            cel="a besorolás pontosítása."
            jogalap="GDPR 6. cikk (1) bekezdés f) pont, jogos érdek (a besorolás pontosságának javítása)."
            megorzes="12 hónap, utána csak összesítve, egyedi sorok nélkül."
          >
            <p>
              Ha igennel vagy nemmel válaszolsz, a munkakört, a szintet, a válaszodat, az időpontot és az adatverziót
              rögzítjük. Az IP-címre itt is ugyanaz érvényes, mint a 3.1. pontban: tartósan nem tároljuk, legfeljebb 10
              percig a memóriában van a túlterhelés elleni korláthoz, és nem megy tovább.
            </p>
          </Adatkezeles>
          <Adatkezeles
            cim="3.3. Technikai napló"
            cel="a szerver üzemeltetése és biztonsága."
            jogalap="GDPR 6. cikk (1) bekezdés f) pont, jogos érdek (üzemeltetés és biztonság)."
            megorzes="30 nap."
          >
            <p>
              A szerver üzemeltetési célból technikai naplót vezet (IP-cím, időpont). A 3.1. és a 3.2. ponttal
              ellentétben itt az IP-cím a naplóban tárolódik, a lent megadott ideig.
            </p>
          </Adatkezeles>
        </ol>
        <h3 className="mt-10 font-display text-h3 font-medium text-primary">Amit nem gyűjtünk</h3>
        <Felsorolas
          elemek={[
            "A keresés a böngésződben fut; a beírt szöveget csak a 3.1. pont szerinti jelzésnél küldjük el.",
            <>
              A finomító kérdésekre adott válaszaid csak az oldal címében (URL) jelennek meg, például{" "}
              <span className="font-mono text-sm text-primary">?telefon=sok</span>. Nem mentjük el őket; ha megosztod a
              linket, a válaszaid is benne vannak.
            </>,
            "Az oldal nem használ sütit, analitikát vagy követőkódot, ezért sütibanner sincs. A betűtípusokat saját szerverünkről szolgáljuk ki.",
            "A Facebook- és a LinkedIn-gomb sima link: csak akkor visz át a másik oldalra, ha rákattintasz, és onnantól annak az oldalnak az adatkezelése érvényes. A link másolása a böngésződ vágólapját használja.",
          ]}
        />
      </Szekcio>

      <Szekcio id="tarolas" sorszam="04" cimke="Biztonság" cim="Adattárolás és biztonság">
        <p className={torzs}>
          A weboldal és az érintett adatai az adatkezelő által üzemeltetett, dedikált virtuális privát szerveren (VPS)
          kerülnek tárolásra. Az adatokat az Európai Unióban (Finnország), az általunk bérelt szerveren tároljuk, az
          Európai Unión kívülre nem továbbítjuk. A szerver helye: Finnország (Helsinki).
        </p>
        <p className={`mt-6 ${kiemelt}`}>Alkalmazott biztonsági intézkedések:</p>
        <Felsorolas
          elemek={[
            "HTTPS titkosított kapcsolat (SSL/TLS tanúsítvány)",
            "Tűzfal és hozzáférés-korlátozás a szerveren",
            "Rendszeres biztonsági mentések",
            "Jelszóvédett adminisztrátori hozzáférés",
            "Minimális adatgyűjtés elve",
          ]}
        />
      </Szekcio>

      <Szekcio id="tovabbitas" sorszam="05" cimke="Továbbítás" cim="Adattovábbítás" alt>
        <div className={`space-y-4 ${torzs}`}>
          <p>
            Az adatkezelő az érintett személyes adatait harmadik félnek nem adja át, kivéve jogszabályi kötelezettség vagy
            az érintett kifejezett hozzájárulása esetén.
          </p>
          <p>
            A 3.1. és a 3.2. pont szerinti visszajelzéseket az adatkezelő saját automatizálási munkafolyamata (n8n)
            fogadja.
          </p>
          <p>
            <span className={kiemelt}>Adatfeldolgozó:</span> Hetzner Online GmbH (tárhelyszolgáltatás). Az n8n és az
            adatbázis a saját szerverünkön fut, ezért azok nem külön adatfeldolgozók.
          </p>
        </div>
      </Szekcio>

      <Szekcio id="jogok" sorszam="06" cimke="Jogaid" cim="Az érintett jogai">
        <p className={torzs}>Az érintett az alábbi jogokat gyakorolhatja ({email("info@zynai.hu")}):</p>
        <Felsorolas
          elemek={[
            "Hozzáférési jog — GDPR 15. cikk",
            "Helyesbítési jog — GDPR 16. cikk",
            "Törléshez való jog — GDPR 17. cikk",
            "Adatkezelés korlátozásához való jog — GDPR 18. cikk",
            "Tiltakozáshoz való jog — GDPR 21. cikk",
          ]}
        />
        <p className={`mt-6 ${torzs}`}>
          Mindhárom adatkezelés (3.1–3.3.) jogos érdeken alapul, ezért a jogos érdeken alapuló adatkezelés elleni
          tiltakozás joga is megillet.
        </p>
        <p className={`mt-4 ${torzs}`}>
          A beküldött jelzésekhez és visszajelzésekhez nem kapcsolunk azonosítót, ezért ezeket utólag nem tudjuk
          személyhez kötni. Ilyenkor nem tudunk adatot kikeresni vagy törölni.
        </p>
        <p className={`mt-4 ${torzs}`}>Az adatkezelő a kérelmeket 30 napon belül megválaszolja.</p>
      </Szekcio>

      <Szekcio id="jogorvoslat" sorszam="07" cimke="Jogorvoslat" cim="Jogorvoslat" alt>
        <p className={torzs}>Panasz esetén az érintett a következő hatósághoz fordulhat:</p>
        <p className={`mt-6 ${kiemelt}`}>Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)</p>
        <div className="mt-4">
          <Adatsorok
            sorok={[
              ["Cím", "1055 Budapest, Falk Miksa utca 9–11."],
              ["E-mail", email("ugyfelszolgalat@naih.hu")],
              ["Web", <a key="n" href="https://naih.hu" className={link}>naih.hu</a>],
            ]}
          />
        </div>
      </Szekcio>

      <Szekcio id="modositas" sorszam="08" cimke="Módosítás" cim="A tájékoztató módosítása">
        <p className={torzs}>
          Az adatkezelő fenntartja a jogot, hogy jelen tájékoztatót egyoldalúan módosítsa. A módosításról az érintetteket
          a weboldalon közzétett értesítéssel tájékoztatja.
        </p>
        <p className={`mt-6 ${torzs}`}>
          <span className={kiemelt}>Hatályos:</span> {HATALYOS_DATUM}
        </p>
      </Szekcio>
    </main>
  );
}
