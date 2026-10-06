// Visszajelzés a link másolásáról („Link vágólapon.”, aria-live), és tartalékként kijelölhető mező,
// ha a vágólap nem elérhető (pl. nem biztonságos kapcsolat vagy tiltott engedély).
import type { MasolasAllapot } from "./useMegosztas";

export default function MasolasVisszajelzes({ allapot, url }: { allapot: MasolasAllapot; url: string }) {
  return (
    <>
      <p aria-live="polite" className="mt-3 min-h-[1.5em] text-kicsi text-secondary">
        {allapot === "masolva" ? "Link vágólapon." : ""}
      </p>
      {allapot === "tartalek" && (
        <input
          readOnly
          value={url}
          aria-label="Az eredmény linkje"
          onFocus={(e) => e.currentTarget.select()}
          ref={(el) => el?.select()}
          className="mt-1 min-h-11 w-full max-w-xl rounded-xl border border-mezo-keret bg-[rgba(255,255,255,0.04)] px-4 font-mono text-sm text-primary"
        />
      )}
    </>
  );
}
