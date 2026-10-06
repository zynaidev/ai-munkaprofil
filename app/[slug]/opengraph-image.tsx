// Megosztási kép (OG, 1200×630) – landing-copy.md 4. fejezet. Az alapprofilt mutatja (finomítás nélkül).
// Betűk: assets/fonts (OFL), latin-ext glifákkal (ő, ű, Ő, Ű). Színek: lib/tipusok.ts és lib/ogPaletta.ts.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { getMunkakor } from "@/lib/data";
import { ogSavReszek } from "@/lib/megosztas";
import { OG_PALETTA as P } from "@/lib/ogPaletta";
import { szamolProfil } from "@/lib/scoring";
import { oldalUrl } from "@/lib/seo";
import { SZINTEK, TIPUSOK, szintCimke } from "@/lib/tipusok";

export const runtime = "nodejs";
export const revalidate = 86400;
export const alt = "AI-Munkaprofil eredménykártya: a munkakör szintje, típusa és a heti órák bontása";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Buildkor nem készül kép; az első kérésre generálódik, utána a revalidate szerint cache-ből jön (ISR).
export function generateStaticParams() {
  return [];
}

const betu = (fajl: string) => readFile(path.join(process.cwd(), "assets/fonts", fajl));
const betuk = Promise.all([betu("InstrumentSans-Medium.ttf"), betu("Inter-Regular.ttf"), betu("Inter-Medium.ttf")]);

// Mintázatok a sávhoz (mint a weboldalon: csíkos / pöttyös / tömör)
const MINTA = {
  kivalthato: {
    backgroundColor: P.kivalthato,
    backgroundImage: "repeating-linear-gradient(-45deg, rgba(0,0,0,0.34), rgba(0,0,0,0.34) 4px, transparent 4px, transparent 12px)",
  },
  felgyorsul: {
    backgroundColor: P.felgyorsul,
    backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.42) 2px, transparent 2.6px)",
    backgroundSize: "10px 10px",
  },
  emberi: { backgroundColor: P.emberi },
} as const;

export default async function OgKep({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const munkakor = getMunkakor(slug);
  if (!munkakor) notFound();
  const profil = szamolProfil(munkakor);
  const t = TIPUSOK[profil.tipus];
  const reszek = ogSavReszek(profil.orak);
  const domain = new URL(oldalUrl()).host;
  const [instrument, interRegular, interMedium] = await betuk;

  const kategoriak = [
    { kulcs: "kivalthato", ora: profil.orak.kivalthato, felirat: reszek[0] },
    { kulcs: "felgyorsul", ora: profil.orak.felgyorsul, felirat: reszek[1] },
    { kulcs: "emberi", ora: profil.orak.emberi, felirat: reszek[2] },
  ] as const;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "52px 72px 48px",
          backgroundColor: P.hatter,
          backgroundImage: "radial-gradient(ellipse 70% 60% at 85% 0%, rgba(189,255,0,0.07), transparent 70%)",
          color: P.szoveg,
          fontFamily: "Inter",
        }}
      >
        {/* Felső rész: logó, felcím, szint, típus */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: "Instrument Sans", fontSize: 34, letterSpacing: "-0.02em" }}>
            <span>Zyn</span>
            <span style={{ color: P.lime }}>AI</span>
          </div>

          <div style={{ display: "flex", marginTop: 44, fontSize: 36, fontWeight: 500, color: P.szoveg }}>{profil.nev}</div>

          <div style={{ display: "flex", alignItems: "center", marginTop: 26 }}>
            <div style={{ display: "flex", fontSize: 20, letterSpacing: "0.14em", color: P.szoveg2, textTransform: "uppercase" }}>
              {szintCimke(t.szint)}
            </div>
            <div style={{ display: "flex", alignItems: "center", marginLeft: 22 }}>
              {SZINTEK.map(({ szint }) => (
                <div
                  key={szint}
                  style={{
                    display: "flex",
                    marginRight: 7,
                    borderRadius: 999,
                    ...(szint === t.szint
                      ? { width: 54, height: 18, backgroundColor: t.szin }
                      : szint < t.szint
                        ? { width: 36, height: 9, backgroundColor: P.szoveg2 }
                        : { width: 36, height: 9, border: "1.5px solid rgba(255,255,255,0.22)" }),
                  }}
                />
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 10,
              fontFamily: "Instrument Sans",
              fontSize: 132,
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
              color: t.szin,
            }}
          >
            {t.cimke}
          </div>
        </div>

        {/* Órasáv és számok */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", height: 46, borderRadius: 14, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.04)" }}>
            {kategoriak
              .filter((k) => k.ora > 0)
              .map((k, i) => (
                <div key={k.kulcs} style={{ display: "flex", flexGrow: k.ora, flexBasis: 0, marginLeft: i === 0 ? 0 : 5, ...MINTA[k.kulcs] }} />
              ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 20, fontSize: 27, color: P.szoveg2 }}>
            {kategoriak.map((k, i) => (
              <div key={k.kulcs} style={{ display: "flex", alignItems: "center" }}>
                {i > 0 && <span style={{ margin: "0 18px", color: "rgba(255,255,255,0.3)" }}>·</span>}
                <div style={{ display: "flex", width: 22, height: 22, borderRadius: 5, marginRight: 12, ...MINTA[k.kulcs] }} />
                <span style={{ color: P.szoveg }}>{k.felirat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alul: Te melyik vagy? → domain */}
        <div style={{ display: "flex", fontSize: 26, color: P.szoveg2 }}>
          <span>Te melyik vagy?</span>
          <span style={{ margin: "0 12px", color: P.lime }}>→</span>
          <span style={{ color: P.lime, fontWeight: 500 }}>{domain}</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Instrument Sans", data: instrument, weight: 500, style: "normal" },
        { name: "Inter", data: interRegular, weight: 400, style: "normal" },
        { name: "Inter", data: interMedium, weight: 500, style: "normal" },
      ],
    },
  );
}
