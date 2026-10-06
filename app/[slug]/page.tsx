// Eredményoldal – landing-copy.md 2. fejezet (blokkok) és 5. fejezet (H1).
// Szerverkomponens; a finomítástól függő blokkok a ProfilNezet kliens-komponensben (7. lépés).
// Az adat a getMunkakor, a profil a szamolProfil eredménye; a komponensek propként kapják a számokat.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Szekcio from "@/components/Szekcio";
import Disclaimer from "@/components/eredmeny/Disclaimer";
import Fekek from "@/components/eredmeny/Fekek";
import ProfilNezet from "@/components/eredmeny/ProfilNezet";
import { getIndexelhetoSlugok, getMunkakor } from "@/lib/data";
import { szamolProfil } from "@/lib/scoring";
import { metaLeiras, OLDALNEV, ogCim, ogLeiras, oldalUrl, seoCim } from "@/lib/seo";

// Route segment config (Next.js 16, Cache Components nélkül érvényes):
// buildkor csak az indexelhető oldalak készülnek el, a többi az első kéréskor, napi újraérvényesítéssel.
export const dynamicParams = true;
export const revalidate = 86400;

export function generateStaticParams() {
  return getIndexelhetoSlugok().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const munkakor = getMunkakor(slug);
  if (!munkakor) return {};
  const profil = szamolProfil(munkakor);

  return {
    title: { absolute: seoCim(slug, munkakor.nev, munkakor.tobbes) },
    description: metaLeiras(profil),
    alternates: { canonical: `/${slug}` },
    robots: munkakor.indexelheto ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: "website",
      locale: "hu_HU",
      siteName: OLDALNEV,
      url: `/${slug}`,
      title: ogCim(profil),
      description: ogLeiras(profil),
    },
    // A kép az opengraph-image.tsx-ből jön (og:image + alt); az X/Twitter az og:image-et használja.
    twitter: {
      card: "summary_large_image",
      title: ogCim(profil),
      description: ogLeiras(profil),
    },
  };
}

export default async function MunkakorOldal({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const munkakor = getMunkakor(slug);
  if (!munkakor) notFound();

  // A kliens-nézet csak a pontozáshoz szükséges mezőket kapja (~1 KB), a szövegek szerveroldalon maradnak.
  const { nev, hetiOra, fekek, feladatok } = munkakor;

  return (
    <main>
      <ProfilNezet
        munkakor={{ slug, nev, hetiOra, fekek, feladatok }}
        kanonikusUrl={`${oldalUrl()}/${slug}`}
        tobbes={munkakor.tobbes}
        fekek={
          <Szekcio id="fekek" sorszam="03" cimke="Mi fékez?" cim="Ami lassítja – vagy megállítja" alt>
            <Fekek ertekek={fekek} indoklas={munkakor.fekIndoklas} />
          </Szekcio>
        }
        teendo={
          <Szekcio id="teendo" sorszam="05" cimke="Teendő" cim="Mit tegyél most?" alt>
            <p className="border-l-2 border-accent pl-6 text-lead leading-[1.8] text-primary sm:pl-8">{munkakor.teendo}</p>
          </Szekcio>
        }
      />

      <Disclaimer />
    </main>
  );
}
