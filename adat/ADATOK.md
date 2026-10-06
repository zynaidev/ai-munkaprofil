# Munkakör-adatok (`public/data/`)

A `public/data/` mappa az `adat/pipeline.py export` kimenete. Kézzel ne szerkeszd (CLAUDE.md 4. szabály); a forrás az `adat/` mappa pipeline-ja. Ez a leírás szándékosan nincs a `public/` alatt, hogy ne legyen nyilvánosan elérhető.

## Jelenlegi állapot
- **50 munkakör**, mind valós, a pipeline által feldolgozott adat (nem illusztratív).
- **Adatverzió:** `2026-Q4` (minden fájlban ugyanaz; a lábléc és a módszertani oldal ezt mutatja).
- **Indexelhetőség:** mind az 50 munkakör `indexelheto: true` (az `adat/munkakorok.csv` szerint), így mind az 50 eredményoldal buildkor elkészül, és bekerül a sitemapbe.
- **`tobbes`:** mind az 50 munkakörnél ki van töltve (a címhez: „Elveszi az AI a {tobbes} munkáját?”).

## Fájlok
- `<slug>.json` – egy munkakör: `slug`, `nev`, `tobbes`, `hetiOra`, `fekek` (0–3), `fekIndoklas`, `feladatok` (`leiras`, `idoArany`, `kitettseg`, `kivaltasArany`, `horizont`, opcionális `csatorna`, `emberiMag`), `teendo`, `indexelheto`, `adatVerzio`.
- `kereso.json` – a kereső indexe (`slug`, `nev`, `aliasok`), a pipeline közelítő magyar ábécérendjében (`magyar_rendezo`: az ékezetes betű az alapbetűje mellé kerül).

A `public/data/` alatt csak ezek a fájlok lehetnek.

## Besorolás (lib/scoring.ts)
Egyindexes modell két mutatóval, feladatcsoportonként, a normalizált időarányokkal:
- `P = (Σ időarány × kitettség) × (1 − FEK_SULY × fékindex)` – fékkel csökkentett AI-kitettség
- `K = Σ(időarány × kitettség × kiváltási arány) / Σ(időarány × kitettség)` – a kitett munka kiváltható hányada (ha a nevező 0, `K = 0`)

Szintek, ebben a sorrendben: `P < P_VEDETT` → 1. Védett; `P ≥ P_AUTOMATIZ` és `K ≥ K_AUTOMATIZ` → 4. Automatizálódó; `P ≥ P_ATALAKUL` → 3. Átalakuló; különben 2. Felerősödő. A küszöbértékek csak a `KONSTANSOK`-ban vannak (jelenleg 0,20 / 0,50 / 0,36 / 0,36, `FEK_SULY` = 0,5).

Eloszlás a jelenlegi adaton (`node --experimental-strip-types adat/eloszlas.mts`): 18 Védett, 11 Felerősödő, 17 Átalakuló, 4 Automatizálódó.

## Frissítés
Új export után futtasd: `npm test` (az adat-tesztek az adatból veszik az elvárásokat), és nézd meg az eloszlás-riportot. Ha az adatverzió változik, ezt a leírást is frissítsd.
