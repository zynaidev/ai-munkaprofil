// Adatkezelési tájékoztató – rövid, csak azt írja le, ami ma igaz. Jogi szöveget nem állít;
// a pontos cégadatok TODO jelöléssel várnak kitöltésre, a végleges szöveg jogi átnézés után kerül ide.
import type { Metadata } from "next";
import Container from "@/components/Container";
import SectionLabel from "@/components/SectionLabel";
import Szekcio from "@/components/Szekcio";

export const metadata: Metadata = {
  title: "Adatkezelés",
  description: "Milyen adatot kezel az AI-Munkaprofil? Röviden és érthetően.",
  alternates: { canonical: "/adatkezeles" },
};

const sor = "border-t border-hairline py-5";
const kiemelt = "font-medium text-primary";

export default function AdatkezelesOldal() {
  return (
    <main>
      <Container className="pt-16 pb-16 lg:pt-24 lg:pb-24">
        <div className="mx-auto max-w-3xl">
          <SectionLabel>Adatkezelés</SectionLabel>
          <h1 className="mt-5 font-display text-h2 font-medium text-balance text-primary">Milyen adatot kezelünk?</h1>
          <p className="mt-6 max-w-2xl text-lead text-secondary">
            Röviden: az eszköz nem kér és nem tárol rólad személyes adatot. Amit rögzítünk, azt alább pontosan
            leírjuk.
          </p>
          <p className="mt-6 font-mono text-cimke tracking-[0.14em] text-secondary uppercase">Jogi átnézésre vár</p>
        </div>
      </Container>

      <Szekcio id="mit" sorszam="01" cimke="Mit gyűjt" cim="Mit gyűjt az eszköz?" alt>
        <ul className="border-b border-hairline text-torzs text-secondary">
          <li className={sor}>
            <span className={kiemelt}>Nincs regisztráció.</span> Az eszköz használatához nem kell megadnod semmilyen
            adatot.
          </li>
          <li className={sor}>
            <span className={kiemelt}>Technikai napló.</span> A szerver üzemeltetési célból technikai naplót vezet
            (IP-cím, időpont). Megőrzési idő: TODO.
          </li>
          <li className={sor}>
            <span className={kiemelt}>Amit a keresőbe írsz,</span> a böngésződben marad: a keresés ott fut. Kivétel, ha
            nincs találat, és a „Jelezd, hogy felvegyük” gombbal jelzed a munkakört: ekkor a beírt szöveget és az
            időpontot rögzítjük, hogy bővíthessük a listát. Kérjük, ne írj bele személyes adatot. Az e-mail-címnek vagy
            telefonszámnak tűnő szöveget nem rögzítjük.
          </li>
          <li className={sor}>
            <span className={kiemelt}>„Egyezik ez a tapasztalatoddal?”</span> Ha igennel vagy nemmel válaszolsz, a
            munkakört, a szintet, a válaszodat és az időpontot rögzítjük.
          </li>
          <li className={sor}>
            <span className={kiemelt}>A finomító kérdésekre adott válaszaid</span> csak az oldal címében (URL) jelennek
            meg, például <span className="font-mono text-sm text-primary">?telefon=sok</span>. Nem mentjük el őket; ha
            megosztod a linket, a válaszaid is benne vannak.
          </li>
          <li className={sor}>
            <span className={kiemelt}>Nincs analitika és nincs követő süti.</span> Az oldal betűtípusait is saját
            magunk szolgáljuk ki.
          </li>
          <li className={sor}>
            <span className={kiemelt}>Megosztás:</span> a Facebook- és a LinkedIn-gomb sima link. Csak akkor visz át a
            másik oldalra, ha rákattintasz, és onnantól annak az oldalnak az adatkezelése érvényes. A link másolása a
            böngésződ vágólapját használja.
          </li>
        </ul>
      </Szekcio>

      <Szekcio id="adatkezelo" sorszam="02" cimke="Adatkezelő" cim="Ki üzemelteti?">
        <dl className="border-b border-hairline text-torzs">
          {[
            ["Név", "ZynAI (Bakos Attila e. v.)"],
            ["Székhely", "TODO"],
            ["Nyilvántartási szám", "TODO"],
            ["Adószám", "TODO"],
            ["Kapcsolat", "TODO"],
          ].map(([cim, ertek]) => (
            <div key={cim} className={`${sor} sm:grid sm:grid-cols-[12rem_1fr] sm:gap-6`}>
              <dt className="text-secondary">{cim}</dt>
              <dd className={kiemelt}>{ertek}</dd>
            </div>
          ))}
        </dl>
      </Szekcio>
    </main>
  );
}
