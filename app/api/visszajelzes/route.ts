// POST /api/visszajelzes – nincs-találat és szint-egyezés visszajelzések. Az egyetlen dinamikus útvonal.
// A logika a lib/visszajelzesKezelo.ts-ben van (tesztelve); itt csak a futásidejű beállítások.
import { getAdatVerzio } from "@/lib/data";
import { kezelVisszajelzest, ujKorlat } from "@/lib/visszajelzesKezelo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Memóriabeli, folyamatonkénti korlát (best-effort). A végleges rate limit az Nginx-ben van.
const korlat = ujKorlat();

export function POST(keres: Request) {
  return kezelVisszajelzest(keres, {
    webhookUrl: process.env.VISSZAJELZES_WEBHOOK_URL || undefined,
    adatVerzio: getAdatVerzio(),
    most: () => new Date(),
    korlat,
    fetch,
    napl: (payload) => console.info("visszajelzés (VISSZAJELZES_WEBHOOK_URL nincs beállítva):", payload),
  });
}
