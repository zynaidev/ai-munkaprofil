import Lablec from "@/components/Lablec";

// Eredményoldalak: a becslés-figyelmeztetést az oldal Disclaimer-blokkja részletesen tartalmazza,
// ezért a lábléc itt nem ismétli meg. (Nem route groupban van: abban a Next.js a metaadat-képek URL-jéhez
// hash-utótagot fűzne, pl. /konyvelo/opengraph-image-1aqz6o.)
export default function EredmenyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex-1">{children}</div>
      <Lablec becsles={false} />
    </>
  );
}
