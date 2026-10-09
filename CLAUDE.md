# AI-Munkaprofil – projektkontextus a Claude ügynöknek

## Mi ez
Magyar nyelvű, nyilvános webes eszköz: a felhasználó beírja a munkakörét, és megkapja az AI-Munkaprofilját (típus + heti órák bontása + időhorizont + fékerők + teendő). A ZynAI (zynai.hu) lead magnetje. Külön alkalmazás a `ai-munkaprofil.zynai.hu` aldomainen; a fő weboldaltól független.

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
8. **Titkok** csak szerveroldalon, környezeti változóból; soha ne kerüljenek a repóba vagy a kliens-bundle-be (`NEXT_PUBLIC_` előtag tilos rájuk). Az app szerveroldali titka: `VISSZAJELZES_WEBHOOK_URL` (a visszajelzéseket fogadó n8n webhook). Az `ANTHROPIC_API_KEY`-t csak az `adat/` mappa Python pipeline-ja használja, az app nem. A `N8N_WEBHOOK_URL` és a `N8N_WEBHOOK_SECRET` tervezett, a jövőbeli lead-űrlaphoz.

## Visszajelzés-végpont
- `POST /api/visszajelzes`: „nincs találat” (a beírt munkakörnév) és „Egyezik ez a tapasztalatoddal?” (slug, szint, igen/nem). A logika a `lib/visszajelzes.ts` (tisztítás, érvényesítés) és a `lib/visszajelzesKezelo.ts` (végpont), mindkettő tesztelve; a `route.ts` csak a beállításokat adja.
- Továbbítás az n8n webhookra: `VISSZAJELZES_WEBHOOK_URL` (csak szerveroldali env, `NEXT_PUBLIC_` előtag tilos). Ha nincs beállítva (fejlesztés), a tisztított payload `console.info`-val naplózódik. Továbbítási időkorlát 4 mp, hiba esetén 502.
- IP-cím, user-agent és más azonosító nem megy tovább és nem kerül naplóba. Az e-mail- vagy telefonszám-szerű szöveget a végpont eldobja (a kliens sikert kap). Rejtett `weboldal` mező (honeypot) → 204.
- **A 3. szabály kivétele:** a „nincs találat” jelzésnél a beírt szöveget (tisztítva, max. 80 karakter) a felhasználó kifejezett gombnyomására rögzítjük a lista bővítéséhez. Más szabad szöveget továbbra sem tárolunk és nem naplózunk.
- **Korlát:** IP-nként 10 kérés / 10 perc, memóriában, folyamatonként (best-effort, újraindításkor nullázódik). **A végleges rate limit az Nginx-ben van** (`limit_req`), az alkalmazásbeli korlát csak tartalék.
- A kliens a küldőt (`lib/visszajelzesKuldes.ts`) lustán, gombnyomáskor tölti be; az oldalak statikusak maradnak.

## Mappastruktúra
```
app/
  page.tsx                 kezdőoldal (hero + kereső)
  [slug]/page.tsx          eredményoldal
  [slug]/opengraph-image.tsx
  modszertan/page.tsx
  api/besorol/route.ts
  api/lead/route.ts
  api/visszajelzes/route.ts  visszajelzés-végpont (az egyetlen dinamikus útvonal az OG-képen kívül)
components/                UI-komponensek
lib/scoring.ts             pontozás (tiszta függvények)
lib/tipusok.ts             a négy szint: név, leírás, szint, színtoken
lib/data.ts                JSON betöltés, típusok
public/data/               generált adat (csak <slug>.json és kereso.json; leírás: adat/ADATOK.md)
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
- Éles próbához (`npm start`) a 3100-as portot használd (`npm start -- -p 3100`). A felhasználó dev szerverét a 3000-es porton ne állítsd le.
- Fájlokat UTF-8-ban, BOM nélkül írj. PowerShell `Set-Content`/`Out-File` helyett a Write/Edit eszközt használd.

## Dizájnrendszer
- **Csak sötét téma** (`color-scheme: dark`), a zynai.hu főoldal stílusát követi. Világos mód nincs.
- **Tokenek az `app/globals.css`-ben** (`:root` + Tailwind 4 `@theme inline`, utility-ként is: `bg-base`, `bg-elevated`, `text-primary`, `text-secondary`, `border-hairline`, `text-h2`, `max-w-site` stb.). Új színt, betűméretet ne írj be közvetlenül a komponensbe; ha kell, előbb tokenként vedd fel.
- **Egyetlen akcentus a lime (`--accent: #bdff00`)**, csak CTA-ra, linkre, fókuszra és kiemelésre. A fókuszkeret 3 px-es lime.
- **Kontraszt:** olvasandó szöveg legalább `--text-secondary` (AA, ≥ 4,5:1); a `--text-tertiary` csak apró, dekoratív szövegre. Űrlapmező kerete `--szin-mezo-keret` (≥ 3:1).
- **Betűk** (`next/font/google`, latin + latin-ext, csak a használt súlyok): címek Instrument Sans 500 (`font-display`), törzs Inter 400/500 (`font-sans`), címkék és számok Geist Mono 400 (`font-mono`).
- **Komponensek:** `Container` (max. 1280 px), `SectionLabel` (sorszám + mono címke minden szekciócím felett), `PrimaryCta` (lime pill, ez a fő gomb).
- **Mozgás csak CSS-sel** (keyframes, `animation-timeline: view()` `@supports` mögött). Nincs animációs könyvtár, scroll-kezelő JS vagy IntersectionObserver. Alapból semmi sem lehet `opacity: 0`, és `prefers-reduced-motion: reduce` esetén minden mozgás kikapcsol.
- **Besorolás: egyindexes modell** (`lib/scoring.ts`): P = fékkel csökkentett AI-kitettség, K = a kitett munka kiváltható hányada; a küszöbök és súlyok csak a `KONSTANSOK`-ban vannak (más fájlban ne legyen belőlük szám). A P és K (`szintMutatok`) belső mutató: a felhasználónak sosem jelenik meg pontszám vagy százalék, csak a szint.
- **Profiltípus = négy szint** (1 Védett · 2 Felerősödő · 3 Átalakuló · 4 Automatizálódó). Név, leírás, szint és színtoken egyetlen forrása a `lib/tipusok.ts`; a színek a `--szint-1` … `--szint-4` tokenek. Sehol ne legyen beégetett típusnév vagy leírás.
- **A profiltípus jelentését sosem hordozhatja csak szín:** a típus neve (és a szint felirata) mindig ott van, a típusszínek csak kis jelzések (pont, szintjelző).
- Keretezett doboz csak kiemelésre, oldalanként legfeljebb egy. Listák doboz nélküli, hairline-elválasztós sorok. A szekciók köze az eredményoldalon py-16/lg:py-24.
