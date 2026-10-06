# AI-Munkaprofil – implementáció lépésről lépésre

**Munkamód:** VS Code + Claude ügynök. Minden lépésnél van:
- **Cél** – mi lesz kész
- **Prompt** – amit bemásolsz az ügynöknek (a `CLAUDE.md` már a repóban van, így a szabályokat nem kell ismételni)
- **Kész, ha…** – ezt te ellenőrzöd, mielőtt továbblépsz

Egy lépés = egy commit. Ha egy lépés elcsúszik, `git reset`, és a promptot pontosítva újra.

**Becsült idő:** A–D fázis (működő MVP lokálisan) kb. 1 hétvége. E–F fázis (élesítés, valós adat) kb. 1 hétvége + az adat átnézése.

---

## A FÁZIS – Alapok

### 0. Előkészítés (kézi, ügynök nélkül)
- Új Git-repo: `ai-munkaprofil`. Másold bele: `CLAUDE.md`, `README.md`, `landing-copy.md`, `implementacio.md`, `schema.sql`, `scoring.ts`, `scoring.test.ts`, és az `adat/` mappát.
- DNS: `ai-munkaprofil.zynai.hu` A-rekord a Hetzner VPS IP-jére (élesítésig ráér, de a propagáció miatt érdemes most).
- n8n-ben hozz létre egy üres webhook workflow-t (`/webhook/munkaprofil-lead`), és jegyezd fel az URL-t. Generálj hozzá egy titkos kulcsot.
- `.env.local` (git-ignorált):
  ```
  N8N_WEBHOOK_URL=...
  N8N_WEBHOOK_SECRET=...
  ANTHROPIC_API_KEY=...
  NEXT_PUBLIC_GA_ID=G-...
  NEXT_PUBLIC_SITE_URL=http://localhost:3000
  ```

**Kész, ha…** a repóban ott vannak a fájlok, és megvan a webhook URL.

### 1. Projektváz
**Cél:** futó Next.js app a megfelelő szerkezettel, a pontozás tesztjei zölden.

**Prompt:**
> Hozz létre ebben a repóban egy Next.js alkalmazást (App Router, TypeScript strict, Tailwind, ESLint, `src/` mappa nélkül) a CLAUDE.md mappastruktúrája szerint. Helyezd át a gyökérben lévő `scoring.ts`-t és `scoring.test.ts`-t a `lib/` mappába. A tsconfig-ban kapcsold be az `allowImportingTsExtensions`-t (a teszt `./scoring.ts`-ként importál), és add hozzá az `npm test` scriptet: `node --experimental-strip-types --test lib/*.test.ts`. A `next.config` legyen `output: "standalone"`. Az `adat/` mappa ne kerüljön a buildbe. Hozz létre `.env.example`-t a CLAUDE.md-ben felsorolt változókkal, értékek nélkül. Futtasd a buildet és a teszteket.

**Kész, ha…** `npm run build` hiba nélkül lefut, `npm test` 6/6 zöld, `npm run dev` alatt az üres kezdőoldal megnyílik.

### 2. Fejlesztői adat
**Cél:** legyen min építeni, amíg a valós adat elkészül.

**Prompt:**
> A `lib/scoring.test.ts` négy illusztratív munkakörét (ügyfélszolgálat, szoftverfejlesztő, villanyszerelő, könyvelő) írd ki a `public/data/` mappába külön JSON-fájlokba, pontosan abban a formátumban, amit az `adat/pipeline.py` `export` parancsa állít elő (nézd meg a függvényt). Töltsd ki a `fekIndoklas` és `teendo` mezőket rövid, értelmes magyar mondatokkal, `adatVerzio: "fejlesztoi"`. Az ügyfélszolgálat és a könyvelő legyen `indexelheto: true`. Készíts `kereso.json`-t is (slug, nev, aliasok). A fájlok elején nem lehet komment (JSON), ezért a `public/data/README.md`-be írd le, hogy ezek illusztratív fejlesztői adatok.

**Kész, ha…** öt JSON van a `public/data/`-ban, és a `/data/konyvelo.json` megnyílik a böngészőben.

### 3. Adatréteg
**Cél:** egy helyen legyen az adat betöltése és a típusok.

**Prompt:**
> Írd meg a `lib/data.ts`-t: típus a munkakör-JSON-hoz (a `lib/scoring.ts` `Munkakor` típusát bővítve a `fekIndoklas`, `teendo`, `indexelheto`, `adatVerzio` mezőkkel), egy `getMunkakor(slug)` szerveroldali függvény, ami a `public/data/{slug}.json`-t olvassa fájlrendszerből (érvénytelen slugnál `null`, path traversal ellen védve: csak `[a-z0-9-]` engedett), egy `getOsszesSlug()` és egy `getIndexelhetoSlugok()`. Írj hozzá egy rövid tesztet `lib/data.test.ts`-be.

**Kész, ha…** `npm test` zöld, beleértve az új teszteket.

---

## B FÁZIS – Oldalak

### 4. Kezdőoldal és kereső
**Cél:** a hero és a kereső működik, találatkor átvisz az eredményoldalra.

**Prompt:**
> Készítsd el a kezdőoldalt (`app/page.tsx`) a `landing-copy.md` 1. fejezete szerint, szó szerint a copyval. A kereső kliens-komponens: a `/data/kereso.json`-t csak az első fókuszkor tölti be, ékezet- és kisbetű-független keresés a nevekben és aliasokban, billentyűzettel kezelhető lista (fel/le, Enter, Esc), ARIA combobox mintával. Választáskor navigáljon a `/{slug}` oldalra. Ha nincs találat, jelenjen meg a „Keresd meg a legközelebbit” gomb (egyelőre csak egy `console.info`, a 10. lépésben kötjük be). A dizájn legyen letisztult, mobil-első, a ZynAI arculatához illő; ne használj ikon- vagy UI-könyvtárat.

**Kész, ha…** mobilon és asztalon is működik a keresés, „ugyfel”, „ügyfél” és „call” is megtalálja az ügyfélszolgálatot.

### 5. Eredményoldal – váz, SEO, statikus generálás
**Cél:** a `/{slug}` oldal betölt, a metaadatok és az indexelés helyesek.

**Prompt:**
> Készítsd el az `app/[slug]/page.tsx`-t. `generateStaticParams` csak az indexelhető slugokat adja vissza, `dynamicParams = true`, a többi első kéréskor renderelődjön, `revalidate = 86400`. Ismeretlen slug → `notFound()`. `generateMetadata` a `landing-copy.md` 4–5. fejezete szerint: OG-cím, OG-leírás, kanonikus URL a `NEXT_PUBLIC_SITE_URL`-ből; nem indexelhető munkakörnél `robots: { index: false, follow: true }`. A SEO-címhez kell a tárgyesetes alak („könyvelők”) – ehhez hozz létre egy `lib/seo.ts`-t slug → tárgyeset szótárral az indexelhető munkakörökre; ha egy slug hiányzik belőle, a cím legyen „{nev} és az AI | AI-Munkaprofil”. Egyelőre az oldal csak a felső típuskártyát mutassa (a `szamolProfil` eredményéből). Készíts sitemap.xml-t (csak indexelhető oldalak + kezdőoldal + módszertan) és robots.txt-t.

**Kész, ha…** `/konyvelo` mutatja a típust, `/villanyszerelo` forrásában ott a `noindex`, `/nemletezik` 404, a sitemap csak az indexelhetőket listázza.

### 6. Eredményoldal – tartalmi blokkok
**Cél:** a teljes eredmény látszik.

**Prompt:**
> Egészítsd ki az eredményoldalt a `landing-copy.md` 2. fejezetének blokkjaival, ebben a sorrendben: heti órák sáv (három szín, CSS-sel, felirat + képernyőolvasónak szöveges alternatíva), visszanyert órák kiemelés, „Mikor?” horizont-blokk, fékek 0–3 sávokkal és indoklással, feladatlista az „emberi mag” címkével, teendő, disclaimer. Minden szám a `szamolProfil` kimenetéből jön; a komponensek kapják propként, ne számoljanak. A színek legyenek színtévesztő-barátok, és ne csak a szín hordozza a jelentést. Szerveroldali komponensek legyenek, kliens-JS nélkül.

**Kész, ha…** az ügyfélszolgálat oldalán a 19/10/11 óra és az „Automatizálódó” típus (4. szint) látszik, a sávok összege vizuálisan is 40, és az oldal JS-letiltva is olvasható.

### 7. Finomító kérdések
**Cél:** két kérdéssel személyre szabható az eredmény.

**Prompt:**
> Készíts egy kliens-komponenst a finomító kérdésekhez (`landing-copy.md`: „Finomítás”). Csak azok a kérdések jelenjenek meg, amelyek csatornája szerepel a munkakör feladatai között. Válaszok → szorzók: „Szinte soha” 0,3, „Néha” 1, „A munkám nagy része” 1,8. A komponens kapja meg a munkakör adatát, a `szamolProfil(munkakor, finomitas)`-t hívja, és frissítse az órák sávját, a horizont-blokkot és a típust. Ehhez az eredményoldal érintett blokkjait tedd egy kliens-wrapperbe úgy, hogy alapállapotban a szerver által renderelt értékek látszódjanak (nincs ugrálás betöltéskor). Az állapot kerüljön az URL query-be (`?telefon=sok`), hogy a finomított eredmény is megosztható legyen.

**Kész, ha…** az ügyfélszolgálatnál a telefon „A munkám nagy része” válaszra csökken a „Már ma” óra, az URL frissül, és újratöltéskor megmarad.

### 8. Megosztás és OG-kép
**Cél:** a megosztott link előnézete maga az eredménykártya.

**Prompt:**
> Készítsd el az `app/[slug]/opengraph-image.tsx`-t (`next/og`, 1200×630) a `landing-copy.md` 4. fejezete szerint. Magyar ékezetes betűtípust ágyazz be (pl. Inter latin-ext, a fontfájlt tedd a repóba), mert az alapfont ékezetei hibásak lehetnek. A kép az alapprofilt mutatja (finomítás nélkül), és legyen cache-elhető. Utána a megosztási blokk: Facebook és LinkedIn share-URL-ek, „Link másolása” gomb a Clipboard API-val és visszajelzéssel; mobilon, ha elérhető, a `navigator.share`-t használd az előre megírt szöveggel.

**Kész, ha…** a `/konyvelo/opengraph-image` helyes, ékezetes képet ad, és a megosztási gombok működnek. (Élesben a Facebook Sharing Debuggerrel ellenőrizd.)

### 9. Módszertan és adatkezelés
**Cél:** a hitelesség és a jogi alap.

**Prompt:**
> Készítsd el a `/modszertan` oldalt a `landing-copy.md` 3. fejezete szerint. A képletet és a küszöböket a `lib/scoring.ts` `KONSTANSOK` objektumából olvasd ki, ne gépeld be újra, hogy mindig egyezzenek. Hozz létre egy `/adatkezeles` oldalt is helyőrző szöveggel és jól látható „JOGI ÁTNÉZÉSRE VÁR” jelöléssel; a tartalmat én adom. A láblécből mindkettő legyen elérhető.

**Kész, ha…** a módszertani oldal küszöbei egyeznek a kódban lévőkkel (változtass meg egyet próbaképp, és nézd meg).

---

## C FÁZIS – Szerveroldali funkciók

### 10. Szabad szöveges besorolás
**Cél:** ha a munkakör nincs a listában, Claude megkeresi a legközelebbit.

**Prompt:**
> Készítsd el az `app/api/besorol/route.ts`-t (POST, `{ szoveg: string }`). Validálás: 2–80 karakter. Rate limit IP-nként percenként 5 kérés, memóriában. Cache: a normalizált szöveg SHA-256 hash-e a kulcs, memóriában (LRU, max. 1000 elem) – a nyers szöveget sehol ne tárold és ne logold. Claude-hívás az Anthropic SDK-val: a rendszerprompt tartalmazza a `kereso.json` slugjait és neveit, és csak egyetlen slugot vagy `null`-t kérjen vissza JSON-ban; a választ ellenőrizd, hogy létező slug-e. Időtúllépés 8 másodperc. Hibánál `{ slug: null }`. A modellnév környezeti változóból jöjjön (`BESOROLAS_MODELL`). Kösd be a kezdőoldal „Keresd meg a legközelebbit” gombjába: találatnál navigálás az oldalra egy sávval („A legközelebbi munkakör: {nev}”), `null`-nál barátságos üzenet.

**Kész, ha…** „pultos” vagy „telefonos ügyintéző” értelmes munkakörre visz, a hatodik gyors kérés 429-et kap, és a szerverlogban nincs ott a beírt szöveg.

### 11. Lead-gyűjtés
**Cél:** e-mail és B2B érdeklődés eljut az n8n-be.

**Prompt:**
> Készítsd el az `app/api/lead/route.ts`-t (POST, `{ email, slug, tipus: "b2c_riport" | "b2b_csapat", hozzajarulas: true }`). Validálás: e-mail formátum, létező slug, kötelező hozzájárulás. Honeypot mező a botok ellen, rate limit IP-nként óránként 5. Továbbítás a `N8N_WEBHOOK_URL`-re `X-Webhook-Secret` fejléccel, a hozzájárulás időbélyegével. A kliens-űrlap a `landing-copy.md` „Lead – B2C” szövegeivel, betöltés-, siker- és hibaállapottal. A B2B gomb egyelőre linkeljen a zynai.hu konzultációs oldalára.

**Kész, ha…** egy próbaküldés megjelenik az n8n executionök között a helyes adatokkal, és hiányzó hozzájárulással 400-at kapsz.

**n8n oldalon (kézi):** webhook → secret ellenőrzés (IF) → Postgres insert a `schema.sql` `lead` táblájába → e-mail a felhasználónak (riport-sablon, egyelőre egyszerű szöveg) → értesítés neked B2B esetén.

### 12. Mérés és süti-hozzájárulás
**Cél:** GA4 események, GDPR-kompatibilisen.

**Prompt:**
> Építs be egy egyszerű, saját süti-hozzájárulási sávot (elfogad / elutasít, a döntés `localStorage`-ban, try/catch-csel). GA4 csak elfogadás után töltődjön be (`NEXT_PUBLIC_GA_ID`). Események: `job_search` (keresés indítása), `result_view` (slug, típus), `refine` (melyik kérdés), `share_click` (csatorna), `lead_submit` (tipus), `b2b_click`, `classify_request` (találat igen/nem, a szöveg nélkül). Egy `lib/analytics.ts` helper hívja, ami hozzájárulás nélkül semmit nem csinál.

**Kész, ha…** elutasítás után nincs GA-kérés a hálózati fülön, elfogadás után a GA4 DebugView-ban látszanak az események.

---

## D FÁZIS – Minőség

### 13. Teljesítmény és akadálymentesség
**Prompt:**
> Futtass Lighthouse-auditot mobilprofillal a kezdőoldalra és a `/konyvelo` oldalra (production buildben), és javítsd, ami 95 alatt van Performance-ban vagy Accessibility-ben. Ellenőrizd: az eredményoldal kezdeti JS-mérete, betűtípus-betöltés (`next/font`, `display: swap`), képek nélküli LCP, kontrasztok, fókuszállapotok, címsor-hierarchia. Írd le röviden, mit változtattál.

**Kész, ha…** mindkét oldal ≥ 95 Performance és Accessibility mobilon.

### 14. Végponttól végpontig próba (kézi)
- Keresés → eredmény → finomítás → megosztás → lead, mobilon és asztalon
- Szabad szöveges besorolás 5–6 furcsa bemenettel
- OG-előnézet (megosztás magadnak Messengeren)
- JS kikapcsolva: olvasható-e az eredmény

---

## E FÁZIS – Élesítés

### 15. Docker és deploy
**Prompt:**
> Készíts többlépcsős `Dockerfile`-t a Next.js standalone kimenethez (Node 22 alpine, nem-root felhasználó, healthcheck), `docker-compose.yml`-t (a port csak localhoston, `.env` fájlból), és egy Nginx szerverblokk-mintát a `ai-munkaprofil.zynai.hu`-hoz: HTTPS (Let's Encrypt/certbot), gzip és brotli, hosszú cache a `/_next/static/` és `/data/` alatt, rövidebb az oldalakra, biztonsági fejlécek (CSP, HSTS, X-Content-Type-Options, Referrer-Policy). Írj egy `DEPLOY.md`-t a lépésekkel.

**Kész, ha…** a VPS-en `docker compose up -d` után a `https://ai-munkaprofil.zynai.hu` él, és a `/konyvelo` második betöltése cache-ből jön.

### 16. Bekötés a fő oldalra (kézi)
- A zynai.hu-ra csak egy link vagy CTA-blokk kerül („Elveszi az AI a munkádat? → Teszt”), beágyazott JS nélkül.
- Search Console: új property a `ai-munkaprofil.zynai.hu`-ra, sitemap beküldése.

---

## F FÁZIS – Valós adat

### 17. Pipeline futtatása
A `README.md` 3. fejezete szerint: forrásfájlok letöltése → `elokeszit` → `csoportosit` → **átnézés** → `export`. Kezdd az első 10 indexelhető munkakörrel, a többi jöhet fokozatosan.

**Kész, ha…** a 30 munkakör átnézve, a `seed.sql` lefutott a Postgresen, a `public/data/` frissült, az `adat/ADATOK.md`-ből kikerült az „illusztratív” jelölés.

### 18. Adatellenőrzés (kézi, 30 perc)
- Végignézed a 30 munkakör típusát: van-e nyilvánvalóan furcsa eredmény? Ha igen, előbb az átnézési fájlt (csoportosítás, fékek) javítsd, és csak végső esetben a `KONSTANSOK` küszöbeit.
- Ellenőrzöd, hogy mind a négy típus előfordul-e. Ha valamelyik hiányzik, az a küszöbökre utal.

### 19. Launch
- Három előre megírt poszt három különböző típusú szakmával
- Sajtóanyag saját magyar összesítéssel (melyik típusba hány munkakör esik)
- Negyedéves frissítés naptárba: pipeline újrafuttatás, `adatVerzio` léptetés

---

## Ha elakadsz
- **Az ügynök a `scoring.ts`-hez nyúlna:** állítsd meg, a CLAUDE.md 1. szabálya szerint előbb tesztet kell írni.
- **Eltérő számok az oldalon és a tesztben:** szinte mindig a JSON-formátum eltérése; hasonlítsd össze a `public/data` fájlt a `pipeline.py export` kimenetével.
- **Az OG-képen hibás ékezetek:** a betűtípus nincs beágyazva, vagy nem latin-ext változat.
