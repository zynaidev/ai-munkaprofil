# AI-Munkaprofil – projektkontextus a Claude ügynöknek

## Mi ez
Magyar nyelvű, nyilvános webes eszköz: a felhasználó beírja a munkakörét, és megkapja az AI-Munkaprofilját (típus + heti órák bontása + időhorizont + fékerők + teendő). A ZynAI (zynai.hu) lead magnetje. Külön alkalmazás a `teszt.zynai.hu` aldomainen; a fő weboldaltól független.

## Stack
- Next.js (App Router), TypeScript (strict), Tailwind CSS
- Self-hosted: Hetzner VPS, Docker, Nginx reverse proxy (`output: "standalone"`)
- Adat: statikus JSON a `public/data/` mappában (a `adat/pipeline.py` export kimenete)
- Leadek: szerveroldali API route → n8n webhook

## Megkerülhetetlen szabályok
1. **A pontozási logika a `lib/scoring.ts`-ben van, és ott is marad.** Ne duplikáld, ne számolj sehol máshol órákat vagy típust. Ha a logikán kell változtatni, előbb a tesztet (`lib/scoring.test.ts`) módosítsd.
2. **Futásidőben nincs LLM-hívás az eredményhez.** Minden eredmény determinisztikus, előre számolt adatból jön. Claude API csak a `/api/besorol` útvonalon fut (szabad szöveg → legközelebbi munkakör), szerveroldalon, cache-sel és rate limittel.
3. **A felhasználó szabad szövegét nem tároljuk.** Logba sem írjuk; cache-kulcsnak csak a hash-e megy.
4. **A `public/data/*.json` generált fájl.** Kézzel ne szerkeszd; a forrás az `adat/` mappa pipeline-ja.
5. **Minden felhasználói szöveg magyar**, tegező, a `landing-copy.md` szerint. Ne találj ki statisztikát vagy százalékot a copyba.
6. **Teljesítmény:** a munkakör-oldalakon a kliens csak az adott munkakör JSON-ját (kb. 1 KB) és a kereső indexét tölti. Nincs nehéz chart-könyvtár; a sávokat sima CSS-sel rajzold. Cél: Lighthouse Performance ≥ 95 mobilon.
7. **SEO:** csak az `indexelheto: true` munkakörök indexelhetők, a többi oldal `noindex, follow`.
8. **Titkok** (`N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`, `ANTHROPIC_API_KEY`) csak szerveroldalon, környezeti változóból. Soha ne kerüljenek kliens-bundle-be (`NEXT_PUBLIC_` előtag tilos rájuk).

## Mappastruktúra
```
app/
  page.tsx                 kezdőoldal (hero + kereső)
  [slug]/page.tsx          eredményoldal
  [slug]/opengraph-image.tsx
  modszertan/page.tsx
  adatkezeles/page.tsx
  api/besorol/route.ts
  api/lead/route.ts
components/                UI-komponensek
lib/scoring.ts             pontozás (tiszta függvények)
lib/data.ts                JSON betöltés, típusok
public/data/               generált adat
adat/                      Python pipeline (nem része a Next buildnek)
```

## Parancsok
- `npm run dev` – fejlesztői szerver
- `npm run build && npm start` – éles build lokálisan
- `npm test` – `node --experimental-strip-types --test lib/*.test.ts`
- `cd adat && python -m pytest -q` – pipeline-tesztek

## Munkamód
- Kis, ellenőrizhető lépésekben dolgozz; minden lépés végén fusson a build és a tesztek.
- Új függőséget csak indoklással adj hozzá.
- Ha valami ellentmond ennek a fájlnak, kérdezz, mielőtt eltérsz.
