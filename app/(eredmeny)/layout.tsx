import Lablec from "@/components/Lablec";

// Eredményoldalak: a becslés-figyelmeztetést az oldal Disclaimer-blokkja részletesen tartalmazza,
// ezért a lábléc itt nem ismétli meg.
export default function EredmenyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex-1">{children}</div>
      <Lablec adatVerzio="fejlesztői" becsles={false} />
    </>
  );
}
