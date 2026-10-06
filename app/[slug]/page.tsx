// Eredményoldal – landing-copy.md 2. fejezet (blokkok) és 5. fejezet (H1).
// Szerverkomponens, kliens-JS nélkül. Az adat a getMunkakor, a profil a szamolProfil eredménye;
// a komponensek propként kapják a számokat, itt és ott sem számolunk.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import Szekcio from "@/components/Szekcio";
import TipusKartya from "@/components/TipusKartya";
import Disclaimer from "@/components/eredmeny/Disclaimer";
import FeladatLista from "@/components/eredmeny/FeladatLista";
import Fekek from "@/components/eredmeny/Fekek";
import Horizont from "@/components/eredmeny/Horizont";
import OraBontas from "@/components/eredmeny/OraBontas";
import { getIndexelhetoSlugok, getMunkakor } from "@/lib/data";
import { oraSzam } from "@/lib/format";
import { szamolProfil } from "@/lib/scoring";
import { metaLeiras, OLDALNEV, ogCim, ogLeiras, seoCim } from "@/lib/seo";

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
    title: { absolute: seoCim(slug, munkakor.nev) },
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
  };
}

export default async function MunkakorOldal({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const munkakor = getMunkakor(slug);
  if (!munkakor) notFound();
  const profil = szamolProfil(munkakor);
  const hetiOra = oraSzam(profil.hetiOra);

  return (
    <main>
      {/* Felső rész: vissza-link, H1, típuskártya */}
      <div className="pt-10 pb-28 sm:pt-16 lg:pb-36">
        <Container>
          <div className="mx-auto max-w-3xl">
            {/* Sima <a>: a next/link kliens-JS-t hozna; ez az oldal kliens-JS nélküli (CLAUDE.md 6.) */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="inline-flex min-h-11 items-center font-mono text-xs tracking-[0.08em] text-secondary transition-colors hover:text-accent"
            >
              <span aria-hidden="true">←</span>&nbsp;Másik munkakör
            </a>
            <h1 className="mt-6 font-display text-h2 font-medium text-balance text-primary">
              {profil.nev} és az AI: mi változik a munkában?
            </h1>
            <div className="mt-10">
              <TipusKartya nev={profil.nev} tipus={profil.tipus} />
            </div>
          </div>
        </Container>
      </div>

      <Szekcio id="orak" sorszam="01" cimke={`A heti ${hetiOra} órád`} cim={`Mi történik a heti ${hetiOra} órával?`} alt>
        <OraBontas orak={profil.orak} hetiOra={profil.hetiOra} visszanyertOra={profil.visszanyertOra} />
      </Szekcio>

      <Szekcio id="mikor" sorszam="02" cimke="Mikor?" cim="Nem holnap. De nem is soha.">
        <Horizont szerint={profil.kivalthatoHorizontSzerint} gyakorlatbanMa={profil.gyakorlatbanMaKivalthato} />
      </Szekcio>

      <Szekcio id="fekek" sorszam="03" cimke="Mi fékez?" cim="Ami lassítja – vagy megállítja" alt>
        <Fekek ertekek={profil.fekek} indoklas={munkakor.fekIndoklas} />
      </Szekcio>

      <Szekcio id="feladatok" sorszam="04" cimke="Feladatonként" cim="A munkád, feladatokra bontva">
        <FeladatLista feladatok={profil.feladatok} />
      </Szekcio>

      <Szekcio id="teendo" sorszam="05" cimke="Teendő" cim="Mit tegyél most?" alt>
        <p className="rounded-2xl border border-hairline bg-elevated p-6 text-lead text-primary sm:p-8">
          {munkakor.teendo}
        </p>
      </Szekcio>

      <Disclaimer />
    </main>
  );
}
