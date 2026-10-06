"""
AI-Munkaprofil – munkakör-felvétel (skálázás ~500 FEOR-08 foglalkozásra)

A `pipeline.py felvesz` parancs logikája. Bemenet a KSH FEOR-08 lista; kimenet egy
munkakorok.csv, amit az `elokeszit` lépés közvetlenül használ.

Lépések:
  1. FEOR-lista beolvasása, 4 jegyű kódok, "máshova nem sorolt" gyűjtőkategóriák kihagyása
  2. névtisztítás, ASCII slug (ütközéskezeléssel)
  3. SOC-jelöltek: FEOR→ISCO (KSH) → SOC (BLS) keresztkapcsolat + angol cím szerinti
     hasonlóság az O*NET-címekkel
  4. Claude 1. kör (25/kötegelve): angol cím, keresési aliasok, többes szám a megosztási szöveghez
  5. Claude 2. kör (10/kötegelve): 1–3 SOC-kód kiválasztása ≤15 jelöltből, bizonyossággal
  6. státusz: auto (≥ küszöb) / atnezendo / hianyzik – a CSV-be, plusz összegző riport

Claude csak javasol; a besorolás-adatot (számokat) nem ő adja. Az "atnezendo" és "hianyzik"
sorokat ember nézi át – az "auto" is mintavételesen.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

import pandas as pd

CSV_OSZLOPOK = ["slug", "nev", "feor_nev", "aliasok", "feor_kod", "isco_kod", "onet_soc_kodok", "heti_ora",
                "indexelheto", "tobbes", "bizonyossag", "statusz", "forras", "indoklas"]

GYUJTO_MINTAK = ("máshova nem sorolt", "másutt nem sorolt", "m.n.s.")   # + az "Egyéb…"-gyel kezdődő nevek
MAX_JELOLT = 15
KOTEG_1, KOTEG_2 = 25, 10
ANGOL_STOP = {"and", "of", "the", "for", "in", "to", "all", "other", "workers", "worker", "except", "a", "an"}

_MAGYAR_ASCII = str.maketrans({"ö": "o", "ő": "o", "ü": "u", "ű": "u", "Ö": "o", "Ő": "o", "Ü": "u", "Ű": "u"})


# ───────────────────────── névtisztítás, slug ─────────────────────────

def gyujto_e(nev: str) -> bool:
    n = nev.lower().strip()
    return n.startswith("egyéb") or any(m in n for m in GYUJTO_MINTAK)


def tisztit_nev(nyers: str) -> tuple[str, list[str]]:
    """'Gazdasági szervezet vezetője (igazgató, elnök)' → ('Gazdasági szervezet vezetője', ['igazgató', 'elnök'])"""
    nyers = re.sub(r"\s+", " ", nyers).strip()
    nev = re.sub(r"\s*\([^)]*\)", "", nyers).strip(" ,;-")
    extra = []
    for z in re.findall(r"\(([^)]*)\)", nyers):
        extra += [x.strip() for x in re.split(r"[,;]", z) if x.strip()]
    return nev, extra


def slugosit(nev: str) -> str:
    s = nev.translate(_MAGYAR_ASCII)
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:60].strip("-") or "munkakor"


def egyedi_slug(nev: str, feor: str, foglalt: set[str]) -> str:
    s = slugosit(nev)
    if s in foglalt:
        s = f"{s}-{feor}"
    i = 2
    while s in foglalt:
        s = f"{slugosit(nev)}-{feor}-{i}"
        i += 1
    foglalt.add(s)
    return s


# ───────────────────────── forrásfájlok ─────────────────────────

def felulirasok_beolvas(ut, beolvas) -> dict[str, dict]:
    """Kézi javítások: feor_kod → {nev, tobbes, onet_soc_kodok, aliasok} (csak a kitöltött mezők)."""
    if not ut or not Path(ut).exists():
        return {}
    df = beolvas(ut)
    ered = {}
    for _, r in df.iterrows():
        kod = _kod(r.get("feor_kod", ""))
        if kod:
            ered[kod] = {k: str(r[k]).strip() for k in ("nev", "tobbes", "onet_soc_kodok", "aliasok")
                         if k in df.columns and str(r[k]).strip()}
    return ered


def kodok_beolvas(forras: str) -> list[str]:
    """'4114,4225' vagy egy szövegfájl útvonala (soronként egy kód, # utáni rész megjegyzés)."""
    p = Path(forras)
    szoveg = p.read_text(encoding="utf-8-sig") if p.exists() else forras
    kodok = []
    for sor in szoveg.splitlines():
        sor = sor.split("#", 1)[0]
        kodok += re.findall(r"\b\d{4}\b", sor)
    return list(dict.fromkeys(kodok))


def _kod(x) -> str:
    """Csak számjegyek; az Excelből jövő '1111.0' alakot is védi."""
    t = str(x).strip()
    if t.endswith(".0"):
        t = t[:-2]
    return re.sub(r"\D", "", t)


def beolvas_fejleces(ut, kulcsparok, beolvas) -> pd.DataFrame:
    """Excel, amelynek tetején címsorok vannak (BLS): megkeresi azt a sort, ahol minden kulcspár
    ((szó1, szó2), ...) előfordul valamelyik cellában, és azt használja fejlécnek."""
    p = Path(ut)
    if p.suffix.lower() in {".xls", ".xlsx"}:
        nyers = pd.read_excel(p, sheet_name=0, header=None, dtype=str).fillna("")
        for i in range(min(60, len(nyers))):
            sor = [str(c).strip() for c in nyers.iloc[i]]
            if all(any(all(k in c.lower() for k in par) for c in sor) for par in kulcsparok):
                df = nyers.iloc[i + 1:].copy()
                df.columns = sor
                return df.reset_index(drop=True)
        sys.exit(f"{p.name}: nem találom a fejlécsort ({kulcsparok}).")
    return beolvas(p)


def feor_lista(df: pd.DataFrame, oszlop, szint: int = 4) -> list[tuple[str, str]]:
    """→ [(kód, név)] – csak a kért jegyszámú kódok."""
    kod_c = oszlop(df, ["FEOR-08", "FEOR08", "FEOR", "feor_kod", "Kód", "Kod", "code"], kotelezo=False)
    nev_c = oszlop(df, ["Megnevezés", "Megnevezes", "Foglalkozás", "nev", "name", "Név"], kotelezo=False)
    kimenet, latott = [], set()
    if kod_c and nev_c:
        par = zip(df[kod_c].astype(str), df[nev_c].astype(str))
    else:   # egyetlen oszlop: "2411 Könyvelő"
        elso = df.columns[0]
        par = []
        for v in df[elso].astype(str):
            m = re.match(r"^\s*(\d+)\s+(.+)$", v)
            if m:
                par.append((m.group(1), m.group(2)))
    for kod, nev in par:
        kod = _kod(kod)
        nev = nev.strip()
        if len(kod) != szint or not nev or kod in latott:
            continue
        latott.add(kod)
        kimenet.append((kod, nev))
    return kimenet


def kereszt_kapcsolat(feor_isco: pd.DataFrame | None, isco_soc: pd.DataFrame | None, oszlop):
    """→ (feor→[isco], isco→[soc 7 karakteres])"""
    f2i: dict[str, list[str]] = {}
    i2s: dict[str, list[str]] = {}
    if feor_isco is not None:
        f = oszlop(feor_isco, ["FEOR-08", "FEOR08", "FEOR", "feor_kod"])
        i = oszlop(feor_isco, ["ISCO-08", "ISCO08", "ISCO", "isco_kod"])
        for a, b in zip(feor_isco[f], feor_isco[i]):
            a, b = _kod(a), _kod(b)
            if a and b and b not in f2i.setdefault(a, []):
                f2i[a].append(b)
    if isco_soc is not None:
        i = oszlop(isco_soc, ["ISCO-08 Code", "ISCO08", "ISCO-08", "isco_kod"])
        s = oszlop(isco_soc, ["2010 SOC Code", "SOC 2010", "SOC", "soc_kod"])
        for a, b in zip(isco_soc[i], isco_soc[s]):
            a = _kod(a)
            m = re.search(r"\d{2}-\d{4}", str(b))
            if a and m and m.group(0) not in i2s.setdefault(a, []):
                i2s[a].append(m.group(0))
    return f2i, i2s


def onet_cimek(tasks: pd.DataFrame, oszlop) -> dict[str, str]:
    """O*NET-SOC kód → angol cím (Task Statements 'Title' oszlopából)."""
    soc_c = oszlop(tasks, ["O*NET-SOC Code", "onetsoc_code", "soc_code"])
    cim_c = oszlop(tasks, ["Title", "title", "Occupation Title"])
    return {k.strip(): c.strip() for k, c in zip(tasks[soc_c], tasks[cim_c]) if k.strip()}


def cim_tokenek(s: str) -> set[str]:
    return {t[:-1] if len(t) > 3 and t.endswith("s") else t
            for t in re.findall(r"[a-z]+", s.lower()) if t not in ANGOL_STOP}


def hasonlo_cimek(angol: str, cimek: dict[str, str], n: int = MAX_JELOLT) -> list[tuple[str, str, float]]:
    ta = cim_tokenek(angol)
    ered = []
    for kod, cim in cimek.items():
        tc = cim_tokenek(cim)
        jac = len(ta & tc) / len(ta | tc) if ta | tc else 0.0
        pontszam = 0.6 * jac + 0.4 * SequenceMatcher(None, angol.lower(), cim.lower()).ratio()
        ered.append((kod, cim, pontszam))
    ered.sort(key=lambda x: -x[2])
    return ered[:n]


# ───────────────────────── Claude ─────────────────────────

PROMPT_1 = """Magyar foglalkozásnevekből (FEOR-08) készítesz keresőadatot egy nyilvános "AI-Munkaprofil" oldalhoz.
Minden bemeneti foglalkozáshoz add vissza:
- "rovid_nev": a foglalkozás rövid, hétköznapi magyar neve egyes számban, ahogy az emberek mondanák, és ahogy
  egy weboldal címében jól mutat (max. 40 karakter, nagy kezdőbetűvel, hivatali körülírás nélkül). Ha a kód több
  rokon munkát fed le, a leggyakoribb vagy az átfogó nevet add (pl. "Polgármester", nem "Helyi önkormányzat
  választott vezetője"). Maradjon megkülönböztethető a többi bemeneti foglalkozástól.
- "en": a legközelebbi angol (US/O*NET) foglalkozáscím, rövid, tőszámnévi/általános alakban (pl. "Accountant")
- "aliasok": 3–8 olyan keresőkifejezés, amit magyar emberek ténylegesen beírnának erre a munkára (hétköznapi
  és szakmai változatok, szleng, gyakori rövidítés). Ne ismételd a hivatalos nevet, ne legyenek általános
  szavak ("dolgozó"), kisbetűvel írd őket, kivéve a tulajdonneveket.
- "tobbes": a "rovid_nev" többes szám alanyesete kisbetűvel, hogy ez illjen: "Elveszi az AI a ____ munkáját?"
  (pl. "könyvelők", "villanyszerelők").
Csak érvényes JSON-t adj vissza: {"munkakorok":[{"feor":"2411","rovid_nev":"...","en":"...","aliasok":["..."],"tobbes":"..."}]}
Minden bemeneti "feor" pontosan egyszer szerepeljen."""

PROMPT_2 = """Foglalkozásokat feleltetsz meg O*NET-SOC kódoknak egy munkaerőpiaci eszközhöz.
Minden elemhez kapsz egy magyar foglalkozást és legfeljebb 15 jelölt O*NET-kódot (kód + angol cím).
Válassz 1–3 olyat, ami a magyar foglalkozás napi feladatait a legjobban lefedi. Csak a megadott jelöltekből
választhatsz. Ha egyik sem illik érdemben, adj üres "kodok" listát.
"bizonyossag": 0–1 (1 = egyértelmű egyezés, 0,5 = elfogadható közelítés, 0,2 = gyenge).
"indoklas": egy rövid magyar mondat.
Csak érvényes JSON-t adj: {"valasztas":[{"feor":"2411","kodok":["13-2011.00"],"bizonyossag":0.9,"indoklas":"..."}]}
Minden bemeneti "feor" pontosan egyszer szerepeljen."""


def claude_json(rendszer: str, uzenet: str, modell: str, cache_dir: Path) -> dict:
    """Egy Claude-hívás JSON-válasszal, lemezre cache-elve (azonos bemenet → nincs újabb hívás)."""
    import anthropic

    cache_dir.mkdir(parents=True, exist_ok=True)
    kulcs = hashlib.sha256(f"{modell}\n{rendszer}\n{uzenet}".encode("utf-8")).hexdigest()[:16]
    cache = cache_dir / f"felvesz-{kulcs}.json"
    if cache.exists():
        szoveg = cache.read_text(encoding="utf-8")
    else:
        valasz = anthropic.Anthropic().messages.create(
            model=modell, max_tokens=8000, system=rendszer,
            messages=[{"role": "user", "content": uzenet}])
        szoveg = "".join(b.text for b in valasz.content if b.type == "text")
        cache.write_text(szoveg, encoding="utf-8")
    talalat = re.search(r"\{.*\}", szoveg, re.S)
    if not talalat:
        raise ValueError("A válaszban nincs JSON.")
    return json.loads(talalat.group(0))


def _kotegek(lista: list, meret: int):
    for i in range(0, len(lista), meret):
        yield lista[i:i + meret]


def _kotegelt(elemek: list[dict], meret: int, rendszer: str, kulcs_mezo: str, valaszkulcs: str,
              ellenoriz, modell: str, cache_dir: Path, hivas) -> dict[str, dict]:
    """Köteg-hívás újrapróbálással; csak a hibás/hiányzó elemeket kérdezi újra. → feor → válasz"""
    eredmeny: dict[str, dict] = {}
    for koteg in _kotegek(elemek, meret):
        hatra = list(koteg)
        hiba = None
        for _ in range(3):
            if not hatra:
                break
            uzenet = json.dumps(hatra, ensure_ascii=False)
            if hiba:
                uzenet += f"\n\nAz előző válaszod hibás/hiányos volt: {hiba}\nAdd vissza a teljes JSON-t ezekre az elemekre."
            try:
                v = hivas(rendszer, uzenet, modell, cache_dir)
            except (ValueError, json.JSONDecodeError) as e:
                hiba = str(e)
                continue
            hiba_lista = []
            for x in v.get(valaszkulcs) or []:
                k = str(x.get(kulcs_mezo, ""))
                if k not in {h[kulcs_mezo] for h in hatra}:
                    continue
                try:
                    eredmeny[k] = ellenoriz(x, next(h for h in hatra if h[kulcs_mezo] == k))
                except (ValueError, TypeError) as e:
                    hiba_lista.append(f"{k}: {e}")
            hatra = [h for h in hatra if h[kulcs_mezo] not in eredmeny]
            hiba = "; ".join(hiba_lista) or (f"hiányzó elemek: {[h[kulcs_mezo] for h in hatra]}" if hatra else None)
    return eredmeny


def _ellenoriz_1(x: dict, _bemenet: dict) -> dict:
    en = str(x.get("en", "")).strip()
    rovid = re.sub(r"\s+", " ", str(x.get("rovid_nev", ""))).strip()
    if not rovid or len(rovid) > 45:
        raise ValueError("a 'rovid_nev' hiányzik vagy 45 karakternél hosszabb")
    aliasok = [str(a).strip() for a in x.get("aliasok") or [] if str(a).strip()]
    tobbes = str(x.get("tobbes", "")).strip()
    if not en or not tobbes:
        raise ValueError("hiányzik az 'en' vagy a 'tobbes'")
    if not 1 <= len(aliasok) <= 12:
        raise ValueError("az aliasok száma 1–12 kell legyen")
    return {"en": en, "rovid_nev": rovid[0].upper() + rovid[1:], "aliasok": aliasok, "tobbes": tobbes}


def _ellenoriz_2(x: dict, bemenet: dict) -> dict:
    megengedett = {j["kod"] for j in bemenet["jeloltek"]}
    kodok = [str(k) for k in x.get("kodok") or []]
    if len(kodok) > 3 or any(k not in megengedett for k in kodok):
        raise ValueError("a kódok nem a jelöltekből jönnek / háromnál több")
    biz = float(x.get("bizonyossag", 0))
    if not 0 <= biz <= 1:
        raise ValueError("a bizonyossag 0–1")
    return {"kodok": kodok, "bizonyossag": round(biz, 2), "indoklas": str(x.get("indoklas", "")).strip()}


# ───────────────────────── a parancs ─────────────────────────

def felvesz(args, gyoker: Path, beolvas, oszlop, figyel, hivas=None) -> dict:
    hivas = hivas or claude_json
    ov = felulirasok_beolvas(getattr(args, "felulirasok", None), beolvas)
    feor = feor_lista(beolvas(args.feor), oszlop, args.feor_szint)
    if not feor:
        sys.exit(f"Nem találtam {args.feor_szint} jegyű FEOR-kódot a fájlban.")

    meglevo = pd.DataFrame(columns=CSV_OSZLOPOK)
    if args.meglevo and Path(args.meglevo).exists():
        meglevo = beolvas(args.meglevo)
    foglalt = set(meglevo["slug"]) if "slug" in meglevo else set()
    megvan_feor = set(meglevo["feor_kod"]) if "feor_kod" in meglevo else set()

    cimek = {}
    if args.onet_feladatok:
        cimek = onet_cimek(beolvas(args.onet_feladatok), oszlop)
    f2i, i2s = kereszt_kapcsolat(beolvas(args.feor_isco) if args.feor_isco else None,
                                 beolvas_fejleces(args.isco_soc, (("isco", "code"), ("soc", "code")), beolvas)
                                 if args.isco_soc else None, oszlop)
    onet_elotag: dict[str, list[str]] = {}
    for kod in cimek:
        onet_elotag.setdefault(kod[:7], []).append(kod)

    sorok: list[dict] = []
    kihagyott = []
    for kod, nyers_nev in feor:
        if kod in megvan_feor:
            continue
        if gyujto_e(nyers_nev):
            kihagyott.append(f"{kod} {nyers_nev}")
            continue
        nev, extra = tisztit_nev(nyers_nev)
        sorok.append({"feor_kod": kod, "nev": nev, "extra_aliasok": extra})
    if getattr(args, "kodok", None):
        kert = kodok_beolvas(args.kodok)
        hianyzo = [k for k in kert if k not in {x["feor_kod"] for x in sorok}]
        if hianyzo:
            figyel(f"Ezek a kért kódok nincsenek az új sorok közt (nincs a listában, gyűjtőkategória vagy már meglévő): {hianyzo}")
        sorok = [x for x in sorok if x["feor_kod"] in set(kert)]
    if args.limit:
        sorok = sorok[:args.limit]
    print(f"  {len(feor)} FEOR-sor, {len(sorok)} új munkakör, {len(kihagyott)} gyűjtőkategória kihagyva")

    # 1. kör: angol cím, aliasok, többes szám
    if args.nincs_claude:
        info = {}
    else:
        info = _kotegelt([{"feor": s["feor_kod"], "nev": s["nev"]} for s in sorok], KOTEG_1, PROMPT_1,
                         "feor", "munkakorok", _ellenoriz_1, args.modell, gyoker / "claude_cache", hivas)

    # megjelenített név és slug: Claude rövid neve, ennek hiányában a hivatalos
    for s_ in sorok:
        s_["feor_nev"] = s_["nev"]
        o = ov.get(s_["feor_kod"], {})
        s_["nev"] = o.get("nev") or (info.get(s_["feor_kod"]) or {}).get("rovid_nev") or s_["feor_nev"]
        if o.get("nev") and not o.get("tobbes"):
            figyel(f"{s_['feor_kod']}: kézi 'nev' van, de 'tobbes' nincs – a többes szám a régi névből marad.")
        s_["slug"] = egyedi_slug(s_["nev"], s_["feor_kod"], foglalt)

    # SOC-jelöltek: keresztkapcsolat + hasonlóság
    jeloltek: dict[str, list[dict]] = {}
    kereszt: dict[str, list[str]] = {}
    for s in sorok:
        k = s["feor_kod"]
        iscok = f2i.get(k, [])
        socok = [soc for i in iscok for soc in i2s.get(i, [])]
        onet = [o for soc in socok for o in onet_elotag.get(soc, [])]
        kereszt[k] = list(dict.fromkeys(onet))
        angol = (info.get(k) or {}).get("en") or ""
        lista = [{"kod": o, "cim": cimek.get(o, ""), "forras": "keresztkapcsolat"} for o in kereszt[k]]
        if angol and cimek:
            for o, cim, _ in hasonlo_cimek(angol, cimek):
                if o not in {j["kod"] for j in lista}:
                    lista.append({"kod": o, "cim": cim, "forras": "hasonlosag"})
        jeloltek[k] = lista[:MAX_JELOLT]

    # 2. kör: kiválasztás
    valasztas: dict[str, dict] = {}
    if not args.nincs_claude and cimek:
        bemenet = [{"feor": s["feor_kod"], "nev": s["nev"], "en": (info.get(s["feor_kod"]) or {}).get("en", ""),
                    "jeloltek": [{"kod": j["kod"], "cim": j["cim"]} for j in jeloltek[s["feor_kod"]]]}
                   for s in sorok if jeloltek[s["feor_kod"]]]
        valasztas = _kotegelt(bemenet, KOTEG_2, PROMPT_2, "feor", "valasztas", _ellenoriz_2,
                              args.modell, gyoker / "claude_cache", hivas)

    # státusz
    uj = []
    for s in sorok:
        k = s["feor_kod"]
        i = info.get(k) or {}
        o = ov.get(k, {})
        v = valasztas.get(k)
        if v is not None:
            kodok, biz, ind = v["kodok"], v["bizonyossag"], v["indoklas"]
            forras = "claude"
        elif kereszt[k]:       # Claude nélkül: a keresztkapcsolat első találatai
            kodok, biz, ind, forras = kereszt[k][:2], 0.5, "keresztkapcsolat, Claude nélkül", "keresztkapcsolat"
        else:
            kodok, biz, ind, forras = [], 0.0, "nincs jelölt", "nincs"
        if o.get("onet_soc_kodok"):
            kodok = [x.strip() for x in o["onet_soc_kodok"].split(";") if x.strip()]
            ismeretlen = [x for x in kodok if cimek and x not in cimek]
            if ismeretlen:
                figyel(f"{k}: kézi SOC-kód nincs az O*NET-adatban: {ismeretlen}")
            biz, ind, forras = 1.0, "kézi felülírás", "kezi"
        statusz = ("kezi" if forras == "kezi" else "hianyzik" if not kodok
                   else "auto" if biz >= args.biztos_kuszob else "atnezendo")
        hivatalos = [s["feor_nev"]] if len(s["feor_nev"]) <= 60 else []
        kezi_alias = [a for a in o.get("aliasok", "").split(";") if a.strip()]
        jeloltek_alias = kezi_alias + hivatalos + s["extra_aliasok"] + i.get("aliasok", [])
        aliasok, latott_alias = [], {s["nev"].lower()}
        for a in jeloltek_alias:
            a = a.strip()
            if a and len(a) <= 60 and a.lower() not in latott_alias:
                latott_alias.add(a.lower())
                aliasok.append(a)
        uj.append({"slug": s["slug"], "nev": s["nev"], "feor_nev": s["feor_nev"], "aliasok": ";".join(aliasok), "feor_kod": k,
                   "isco_kod": ";".join(f2i.get(k, [])), "onet_soc_kodok": ";".join(kodok), "heti_ora": 40,
                   "indexelheto": "false", "tobbes": o.get("tobbes") or i.get("tobbes", ""), "bizonyossag": biz,
                   "statusz": statusz, "forras": forras, "indoklas": ind})

    kimenet = Path(args.kimenet)
    kimenet.parent.mkdir(parents=True, exist_ok=True)
    regi = meglevo.reindex(columns=CSV_OSZLOPOK).fillna("")
    teljes = pd.concat([regi, pd.DataFrame(uj, columns=CSV_OSZLOPOK)], ignore_index=True)
    teljes.to_csv(kimenet, index=False, encoding="utf-8-sig")

    nevek = [u["nev"].lower() for u in uj]
    duplikalt = sorted({n for n in nevek if nevek.count(n) > 1})
    if duplikalt:
        figyel(f"Azonos megjelenített név több sorban (kézzel különböztesd meg): {duplikalt}")
    riport = {"duplikalt_nevek": duplikalt, "osszes_feor_sor": len(feor), "uj": len(uj), "meglevo": len(regi),
              "gyujtokategoria_kihagyva": kihagyott,
              "statusz": {n: sum(1 for u in uj if u["statusz"] == n) for n in ("auto", "atnezendo", "hianyzik", "kezi")},
              "claude_nelkul_aliasok": sum(1 for u in uj if not u["tobbes"])}
    Path(str(kimenet) + ".riport.json").write_text(json.dumps(riport, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✓ {len(teljes)} sor → {kimenet}  ({riport['statusz']})")
    if riport["claude_nelkul_aliasok"]:
        figyel(f"{riport['claude_nelkul_aliasok']} sorhoz nincs 'tobbes'/alias (Claude nélkül futott vagy hibás válasz).")
    return riport
