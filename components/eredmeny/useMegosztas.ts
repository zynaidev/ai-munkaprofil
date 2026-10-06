"use client";

// Megosztás és link másolása, harmadik fél SDK nélkül.
// - navigator.share, ha a böngésző tudja (szerveren és hidratáláskor „nem tudja”, így nincs eltérés);
// - különben vágólapra másolás (Clipboard API), hiba esetén kijelölhető mező a tartalék.
import { useState, useSyncExternalStore } from "react";

export type MasolasAllapot = "semmi" | "masolva" | "tartalek";

const nincsFeliratkozas = () => () => {};
const tudMegosztani = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

export function useMegosztas({ url, cim, szoveg }: { url: string; cim: string; szoveg: string }) {
  const tud = useSyncExternalStore(nincsFeliratkozas, tudMegosztani, () => false);
  const [allapot, setAllapot] = useState<MasolasAllapot>("semmi");

  async function masol() {
    setAllapot("semmi");
    try {
      await navigator.clipboard.writeText(url);
      setAllapot("masolva");
      window.setTimeout(() => setAllapot((a) => (a === "masolva" ? "semmi" : a)), 4000);
    } catch {
      setAllapot("tartalek");
    }
  }

  async function megoszt() {
    if (!tud) return masol();
    try {
      await navigator.share({ title: cim, text: szoveg, url });
    } catch (e) {
      // A felhasználó bezárta a megosztó ablakot: nem hiba. Más hibánál a link másolása a tartalék.
      if ((e as DOMException)?.name !== "AbortError") await masol();
    }
  }

  return { tud, allapot, masol, megoszt };
}
