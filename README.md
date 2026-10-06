# AI-Munkaprofil – MVP specifikáció

Külön alkalmazás a `teszt.zynai.hu` aldomainen. A fő weboldalt nem érinti.

## Fájlok
| Fájl | Mi ez |
|---|---|
| `README.md` | Ez a specifikáció: munkakörök, adatfolyam, építési sorrend |
| `CLAUDE.md` | Projektkontextus és szabályok a Claude ügynöknek (a repó gyökerébe) |
| `implementacio.md` | Lépésenkénti implementációs terv ügynök-promptokkal |
| `landing-copy.md` | Oldalstruktúra és teljes magyar copy |
| `schema.sql` | PostgreSQL séma (munkakör, feladat, cache, lead) |
| `scoring.ts` | Pontozási logika, tiszta függvények, függőség nélkül |
| `scoring.test.ts` | Tesztek illusztratív mintaadatokkal (`node --experimental-strip-types --test scoring.test.ts`) |
| `adat/pipeline.py` | Adatfeldolgozó szkript: forrásadatok → átnézés → frontend JSON + `seed.sql` |
| `adat/munkakorok.csv` | A 30 munkakör és O\*NET-SOC kódjaik, kézzel szerkeszthető |
| `adat/test_pipeline.py` | A szkript tesztjei szintetikus mintaadatokkal (`python -m pytest -q`) |
| `adat/requirements.txt` | Python-függőségek |

---

## 1. Az MVP 30 munkaköre
Vegyes összetétel, hogy mind a négy típus megjelenjen. A FEOR-08 kódokat a KSH hivatalos FEOR-08 listájából kell kitölteni.

**Irodai, ügyfélkapcsolati:** ügyfélszolgálati munkatárs, irodai asszisztens, adatrögzítő, recepciós, könyvelő, bérszámfejtő, HR-munkatárs, értékesítési asszisztens, beszerző, irodavezető
**Tudásmunka, kreatív:** szoftverfejlesztő, marketinges, grafikus, újságíró, fordító, jogász, pénzügyi elemző, projektmenedzser, tanár, webfejlesztő
**Fizikai, személyes:** villanyszerelő, ápoló, fodrász, szakács, raktáros, gépkocsivezető, eladó (bolti), vízvezeték-szerelő, építőipari munkás, orvos

Az első 10 SEO-oldal (`indexelheto = TRUE`): ügyfélszolgálati munkatárs, könyvelő, programozó/szoftverfejlesztő, marketinges, fordító, grafikus, tanár, jogász, HR-munkatárs, adatrögzítő. Ezekre lesz a legtöbb „elveszi az AI a munkáját” keresés.

---

## 2. Pontozási modell

### Feladatonként
- `ora = heti_ora × ido_arany` (normalizálva, finomító kérdésekkel súlyozva)
- `kivaltott = ora × kitettseg × kivaltas_arany`
- `felerositett = ora × kitettseg × (1 − kivaltas_arany)`
- `emberi = ora × (1 − kitettseg)`

### Munkakörönként
- A három összeg egészre kerekítve (legnagyobb maradék módszer), így a kártyán mindig pontosan 40 óra jön ki.
- `visszanyert_ora = felerositett × 0,4` (a felgyorsuló munkából felszabaduló idő).
- `fek_index = (fizikai + felelosseg + szabalyozas + bizalom) / 12`
- `gyakorlatban_ma_kivalthato = ma_kivalthato × (1 − 0,5 × fek_index)`

### Típus: négy szint
A négy szint (név, leírás, szint és szín egyetlen forrása a `lib/tipusok.ts`):

| Szint | Kulcs | Név | Leírás |
|---|---|---|---|
| 1 | `vedett` | Védett | Az AI hatása jelenleg korlátozott. |
| 2 | `felerosodo` | Felerősödő | Az AI hatékonyabbá teszi a munkavégzést. |
| 3 | `atalakulo` | Átalakuló | A feladatok és a szerepkör érdemben megváltoznak. |
| 4 | `automatizalodo` | Automatizálódó | A munkafeladatok jelentős részét AI végezheti. |

Döntési sorrend (az első teljesülő feltétel):
1. **Védett (1. szint):** emberi arány ≥ 50%, vagy fizikai fék = 3
2. **Automatizálódó (4. szint):** kiváltási arány ≥ 35% és fék_index < 0,5
3. **Felerősödő (2. szint):** felerősítési arány ≥ 40% és kiváltás < 25%
4. **Átalakuló (3. szint):** minden más

A küszöbök a `scoring.ts` `KONSTANSOK` objektumában vannak, és a módszertani oldalon is publikálni kell őket. A nyílt módszertan maga is hitelességi érv.

**Tesztkimenet illusztratív mintaadatokkal:**
| Munkakör | Szint · Típus | Kiváltható / Felgyorsul / Emberi | Visszanyert |
|---|---|---|---|
| Ügyfélszolgálati munkatárs | 4 · Automatizálódó | 19 / 10 / 11 ó | 4 ó |
| Szoftverfejlesztő | 2 · Felerősödő | 7 / 23 / 10 ó | 9 ó |
| Villanyszerelő | 1 · Védett | 5 / 6 / 29 ó | 2 ó |
| Könyvelő | 3 · Átalakuló | 13 / 16 / 11 ó | 6 ó |

A könyvelő a kiváltható órák alapján Automatizálódó lehetne, de a felelősség és a szabályozás fékje miatt Átalakuló (3. szint) lesz. Pontosan ilyen árnyalatot akartunk a puszta százalék helyett.

---

## 3. Adatfolyam (offline, egyszer lefuttatott Python-szkript)

A valós számok ebből jönnek. A tesztekben szereplő mintaszámok csak a logikát ellenőrzik.

### Források (letöltés előtt ellenőrizd az aktuális elérhetőséget és licencet)
1. **O\*NET adatbázis**: Task Statements és Task Ratings (gyakoriság, fontosság).
2. **„GPTs are GPTs” tanulmány publikált adatai**: feladatszintű E0/E1/E2 kitettségi címkék O\*NET feladatokra.
3. **Anthropic Economic Index nyilvános adatai**: feladatonkénti kiváltás vs. felerősítés arány.
4. **Megfeleltetési táblák**: FEOR-08 ↔ ISCO-08 (KSH), ISCO-08 ↔ US SOC (BLS).

### Leképezés a sémára
| Séma mező | Forrás | Szabály |
|---|---|---|
| `kitettseg` | GPTs are GPTs | E1 → 1,0 · E2 → 0,5 · E0 → 0 (a tanulmány β-mérőszáma) |
| `horizont` | GPTs are GPTs | E1 → `ma` · E2 → `1-3ev` · E0 → `5ev+` |
| `kivaltas_arany` | Economic Index | automation / (automation + augmentation); ha nincs adat, a feladatkategória átlaga, végső esetben 0,5 |
| `ido_arany` | O\*NET Task Ratings | gyakoriság × fontosság, munkakörönként normalizálva |
| `fek_*` | Claude-tervezet + kézi ellenőrzés | 0–3 skála, indoklással |

### A szkript futtatása (`adat/pipeline.py`)

**0. Előkészítés**
```bash
cd adat
pip install -r requirements.txt
export ANTHROPIC_API_KEY=...        # csak a 2. lépéshez kell
```
Töltsd le a forrásfájlokat (O\*NET: *Task Statements* és *Task Ratings*; GPTs-are-GPTs: a feladatszintű címkefájl a repó `data/` mappájából; Anthropic Economic Index: a feladatszintű együttműködési minták fájlja). A `munkakorok.csv` SOC-kódjai O\*NET-SOC 2019 szerintiek. A szkript figyelmeztet, ha egy kód nincs a letöltött adatban, és hasonló kódokat javasol.

**1. Összefésülés**
```bash
python pipeline.py elokeszit \
  --onet-feladatok "Task Statements.xlsx" \
  --onet-ertekelesek "Task Ratings.xlsx" \
  --kitettseg full_labelset.tsv \
  --economic-index ei_task_file.csv
```
→ `nyers/<slug>.json`. Munkakörönként a 25 legsúlyosabb feladat, a hiányzó adatok forrásjelöléssel (`munkakor-atlag`, `globalis-atlag`), és figyelmeztetések, ha az adatlefedettség gyenge.

Az oszlopneveket a szkript automatikusan felismeri (E0/E1/E2 címkés oszlop, az Economic Index széles és hosszú formátuma is). Ha mégsem, a hibaüzenet kiírja a talált oszlopokat, a kitettségi oszlop pedig megadható: `--kitettseg-oszlop <név>`.

**2. Csoportosítás Claude-dal**
```bash
python pipeline.py csoportosit                 # mind
python pipeline.py csoportosit --csak konyvelo # egy munkakör újra
```
→ `atnezes/<slug>.json`. Claude csak csoportosít és fogalmaz (magyar feladatnevek, fékek indoklással, teendő-szöveg). A számokat a Python számolja. A válaszokat a szkript ellenőrzi (minden feladat pontosan egy csoportban, fékek 0–3), hiba esetén egyszer újrapróbálja. A válaszok a `claude_cache/` mappába kerülnek, így újrafuttatáskor nincs újabb API-költség. Modell: `--modell` vagy a `MUNKAPROFIL_MODELL` környezeti változó.

Claude nélkül is futtatható (`--nincs-claude`): ekkor angol feladatnevek és „KÉZZEL KITÖLTENDŐ” jelölések jönnek.

**3. Kézi átnézés** – munkakörönként kb. 5 perc, ezt nem érdemes kihagyni:
- csoportnevek (`csoportok[].leiras`), szükség esetén a csoportosítás (`task_idk`) átrendezése,
- fékek és indoklásuk, `teendo_szoveg`,
- a `_szamitott_elonezet` mutatja a számokat, a `_figyelmeztetesek` a gyenge pontokat,
- a végén: `"ellenorizve": true`.

**4. Export**
```bash
python pipeline.py export --verzio 2026-Q4
```
→ `public/data/<slug>.json` (kb. 1 KB / munkakör), `public/data/kereso.json`, `seed.sql`. Az átnézetlen fájlok kimaradnak, a kitöltetlen mezőkre figyelmeztetés jön. A `seed.sql` upsertet használ, így újrafuttatható, és nem törli a leadeket.

**Fontos tulajdonság:** a csoportosítás nem torzítja az eredményt. A csoportértékek súlyozott átlagok, így a kiváltható / felgyorsuló / emberi órák összege pontosan ugyanaz, mint az összevonás előtt. Ezt a tesztek ellenőrzik.

**Súlyozás:** a feladat munkaidő-aránya az O\*NET gyakoriság (log-skálán) × fontosság szorzata, a Supplemental feladatok fél súllyal. Ez közelítés, mert az O\*NET nem méri közvetlenül a ráfordított időt; a módszertani oldalon ezt is írd ki.

---

## 4. Teljesítmény-architektúra
- **A pontozás a böngészőben fut.** Munkakörönként egy kb. 2–4 KB-os JSON töltődik le, a `scoring.ts` kliensoldalon számol. A finomító kérdések azonnal frissítik az eredményt, szerverhívás nélkül.
- **A kereső** egyetlen kis JSON-t használ (név + aliasok, néhány KB).
- **Claude API** csak a szabad szöveges besorolásnál fut, szerveroldalon, a `besorolas_cache` táblával és rate limittel.
- **Egy dinamikus útvonal** van: `/[slug]`, ISR-rel vagy Nginx-cache-sel. Indexelhető csak az `indexelheto = TRUE` munkakör, a többi `noindex`.
- **OG-kép** az első megosztáskor generálódik, utána cache-ből jön.

---

### Visszajelzés-végpont
- `POST /api/visszajelzes` JSON-t vár: `{ tipus: "nincs-talalat", szoveg }` vagy `{ tipus: "szint-egyezes", slug, szint: 1–4, egyezik }`.
- A végpont tisztít és érvényesít (szöveg max. 80 karakter, e-mail- és telefonszám-szerű szöveg eldobva, slug csak `[a-z0-9-]`), majd továbbít az n8n webhookra: `{ tipus, szoveg, slug, szint, egyezik, idopont, adatVerzio }`. IP-cím és user-agent nem megy tovább.
- Környezeti változó: `VISSZAJELZES_WEBHOOK_URL`. Ha nincs megadva, a payload csak a szerver konzoljára kerül (fejlesztés).
- Válaszok: 200 siker, 204 honeypot, 400 érvénytelen kérés, 429 túl sok kérés, 502 a webhook hibázott vagy 4 mp alatt nem válaszolt.
- Korlát: az alkalmazásban IP-nként 10 kérés / 10 perc, memóriában (best-effort). **A végleges rate limitet az Nginx adja.**

## 5. Építési sorrend
Minden lépés végén legyen működő, kipróbálható állapot.

1. **Váz:** új Next.js (App Router, TypeScript, Tailwind) repo, a fő oldaltól külön. Másold be a `scoring.ts`-t és a tesztet a `lib/` mappába.
2. **Adat:** Postgres a Hetzneren, `schema.sql` lefuttatása, a 4 illusztratív munkakör seedelése, hogy legyen min fejleszteni, amíg a valós adat elkészül.
3. **Adat bekötése:** a `pipeline.py export` kimenetét (`public/data/`) másold az app `public/data/` mappájába; a `seed.sql`-t futtasd a Postgresen.
4. **Kezdőoldal és kereső:** autocomplete, és találat esetén átirányítás a `/[slug]` oldalra.
5. **Eredményoldal:** típuskártya, 40 órás sávdiagram (kiváltható / felgyorsul / emberi), horizont-bontás, fékek, feladatlista az „emberi mag” kiemelésével, teendő szöveg.
6. **Finomító kérdések:** 2–3 csúszka (pl. telefon vs. írásos arány), a `Finomitas` objektumot állítják, és élőben számolnak újra.
7. **Szabad szöveges besorolás:** `/api/besorol` útvonal, Claude-hívás, cache, rate limit.
8. **Megosztás:** OG-kép a típussal és a fő számokkal, Facebook- és LinkedIn-gomb, link másolása.
9. **Módszertani oldal:** források, képletek, küszöbök, korlátok, disclaimer.
10. **Lead:** e-mail űrlap GDPR-checkboxszal, n8n webhookra küldve.
11. **Deploy:** Hetzner + Nginx (cache, gzip/brotli), `teszt.zynai.hu` DNS, GA4-események.
12. **Valós adat:** a 3. fejezet szkriptjének lefuttatása a 30 munkakörre, kézi átnézés, seedelés, élesítés.

A 12. lépés párhuzamosan is futhat az 1–11. lépéssel: az UI az illusztratív adatokkal elkészülhet, amíg a valós adat összeáll.
