# Skálázás ~500 munkakörre

Cél: minél több magyar foglalkozás megtalálható legyen, és mindegyik egy a **négy fix szint** közül kapjon besorolást. A szintek közösek, az oldalak munkakör-specifikusak. A számokat Python/TypeScript számolja; Claude csak csoportosít, fordít és javasol, és mindent ember néz át.

## Lépések

| # | Lépés | Parancs / eredmény |
|---|---|---|
| S1 | Források letöltése (`adat/forras/`, gitignore-ban) | KSH FEOR-08 lista; KSH FEOR-08→ISCO-08 megfeleltetés; BLS ISCO-08→SOC 2010 (`isco_soc_crosswalk.xls`); O*NET Task Statements + Ratings; GPTs-are-GPTs címkék; Anthropic Economic Index. **Licenc/felhasználási feltétel ellenőrzése forrásonként**, a forrásmegjelölés a módszertan oldalra kerül. |
| S2 | Felvétel | `python pipeline.py felvesz --feor forras/feor08.xlsx --feor-isco forras/feor_isco.xlsx --isco-soc forras/isco_soc.xls --onet-feladatok forras/Task_Statements.xlsx --meglevo munkakorok.csv --limit 20` (próba), majd `--limit` nélkül. Kimenet: `munkakorok.javaslat.csv` + `.riport.json`. |
| S3 | SOC-átnézés | A CSV-ben a `statusz` oszlop: `hianyzik` (kézzel kell), `atnezendo` (gyorsan átnézni), `auto` (10%-os mintavétel). Nézd át az `indoklas`, `bizonyossag` oszlopokat; javítsd az `onet_soc_kodok`-ot; ha kész: mentsd `munkakorok.csv` néven. |
| S4 | Tömeges előkészítés | `elokeszit` → `csoportosit` (Claude, gyorsítótárazva) → `atnezes/*.json`. Először 30–50 munkakörön, utána a többin. |
| S5 | Eloszlás és kalibráció | `node --experimental-strip-types adat/eloszlas.mts` – a 4 szint eloszlása, szélső értékek. Ha egy szint üres vagy >50%: küszöbök hangolása **tesztek előtt**. A `KONSTANSOK` kulcsait ekkor érdemes átnevezni a szintekre. |
| S6 | Oldalak | `/munkakorok` (ábécé szerinti lista), négy szintoldal (`/szint/automatizalodo` …) a hozzájuk tartozó munkakörökkel, belső linkek; sitemap. |
| S7 | Keresés | `kereso.json` ~500 sor ≈ 60–90 KB: betöltés első fókuszra, ékezet- és elütéstűrő egyezés, aliasok. Találat nélkül: `/api/besorol` szabad szöveges besorolás (gyorsítótárazva). |
| S8 | Indexelés | `indexelheto: true` csak átnézett, jó minőségű oldalakra; kötegelten, heti 20–50 új oldal. A többi `noindex`, de elérhető és kereshető. |

## A `felvesz` kimenete

`slug, nev, aliasok, feor_kod, isco_kod, onet_soc_kodok, heti_ora, indexelheto, tobbes, bizonyossag, statusz, forras, indoklas`

- Gyűjtő ("máshova nem sorolt") kategóriák kimaradnak, listájuk a riportban van.
- A meglévő `munkakorok.csv` sorai változatlanul maradnak, duplikáció FEOR-kód alapján nincs.
- `tobbes`: a megosztási szövegnek ("Elveszi az AI a könyvelők munkáját?"); a pipeline végigviszi a `public/data/<slug>.json`-ig, a frontend `seo.ts`-e használhatja.
- Az új sorok `indexelheto: false`.
- Claude nélkül (`--nincs-claude`) csak a keresztkapcsolat ad SOC-javaslatot, aliasok nélkül.

## Minőségkapuk
- Szintenként legalább 3 intuíciós ellenpróba (pl. ápoló ≠ 4. szint).
- Minden indexelhető oldalon `ellenorizve: true`.
- Eloszlás-riport minden tömeges futás után.
