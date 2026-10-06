"use client";

// A meglévő Kereso lustán betöltve, a 404-oldalhoz. A gyökér not-found minden oldal csomagjába bekerül
// (a gyökér-layout határa), így közvetlen importtal a kereső kódja minden oldalon letöltődne. Így csak ez a kis
// betöltő kerül mindenhova (React lazy, külön könyvtár nélkül), a kereső kódja pedig csak akkor töltődik le,
// ha a 404-oldal ténylegesen megjelenik.
import { lazy, Suspense } from "react";

const Kereso = lazy(() => import("./Kereso"));

export default function KeresoLusta() {
  return (
    <Suspense fallback={<div className="min-h-14" />}>
      <Kereso />
    </Suspense>
  );
}
