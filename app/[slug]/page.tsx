// Eredményoldal – egyelőre csak a felső típuskártya (landing-copy.md 2. fejezet).
// Szerverkomponens, kliens-JS nélkül. Az adat a getMunkakor, a profil a szamolProfil eredménye; itt nem számolunk.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import TipusKartya from "@/components/TipusKartya";
import { getIndexelhetoSlugok, getMunkakor } from "@/lib/data";
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

  return (
    <main className="pt-10 pb-28 sm:pt-16 lg:pb-36">
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
          <div className="mt-6">
            <TipusKartya nev={profil.nev} tipus={profil.tipus} />
          </div>
        </div>
      </Container>
    </main>
  );
}
