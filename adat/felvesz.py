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

CSV_OSZLOPOK = ["slug", "nev", "aliasok", "feor_kod", "isco_kod", "onet_soc_kodok", "heti_ora",
                "indexelheto", "tobbes", "bizonyossag", "statusz", "forras", "indoklas"]

GYUJTO_MINTAK = ("máshova nem sorolt", "másutt nem sorolt", "m.n.s.", "egyéb ", " egyéb")
MAX_JELOLT = 15
KOTEG_1, KOTEG_2 = 25, 10
ANGOL_STOP = {"and", "of", "the", "for", "in", "to", "all", "other", "workers", "worker", "except", "a", "an"}

_MAGYAR_ASCII = str.maketrans({"ö": "o", "ő": "o", "ü": "u", "ű": "u", "Ö": "o", "Ő": "o", "Ü": "u", "Ű": "u"})


# ───────────────────────── névtisztítás, slug ─────────────────────────

def gyujto_e(nev: str) -> bool:
    n = " " + nev.lower() + " "
    return any(m in n for m in GYUJTO_MINTAK)


def tisztit_nev(nyers: str) -> tuple[str, list[str]]:
    """'Számviteli (könyvelői) ügyintéző' → ('Számviteli ügyintéző', ['Számviteli könyvelői ügyintéző', 'könyvelői'])"""
    nyers = re.sub(r"\s+", " ", nyers).strip()
    zarojelesek = re.findall(r"\(([^)]*)\)", nyers)
    nev = re.sub(r"\s*\([^)]*\)", "", nyers).strip(" ,;-")
    extra = []
    if zarojelesek:
        extra.append(re.sub(r"[()]", "", nyers).replace("  ", " ").strip())
        extra += [z.strip() for z in zarojelesek if z.strip()]
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
        kod = re.sub(r"\D", "", kod.strip())
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
            a, b = re.sub(r"\D", "", str(a)), re.sub(r"\D", "", str(b))
            if a and b and b not in f2i.setdefault(a, []):
                f2i[a].append(b)
    if isco_soc is not None:
        i = oszlop(isco_soc, ["ISCO-08 Code", "ISCO08", "ISCO-08", "isco_kod"])
        s = oszlop(isco_soc, ["2010 SOC Code", "SOC 2010", "SOC", "soc_kod"])
        for a, b in zip(isco_soc[i], isco_soc[s]):
            a = re.sub(r"\D", "", str(a))
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
- "en": a legközelebbi angol (US/O*NET) foglalkozáscím, rövid, tőszámnévi/általános alakban (pl. "Accountant")
- "aliasok": 3–8 olyan keresőkifejezés, amit magyar emberek ténylegesen beírnának erre a munkára (hétköznapi
  és szakmai változatok, szleng, gyakori rövidítés). Ne ismételd a hivatalos nevet, ne legyenek általános
  szavak ("dolgozó"), kisbetűvel írd őket, kivéve a tulajdonneveket.
- "tobbes": a foglalkozás többes szám alanyesete kisbetűvel, hogy ez illjen: "Elveszi az AI a ____ munkáját?"
  (pl. "könyvelők", "villanyszerelők").
Csak érvényes JSON-t adj vissza: {"munkakorok":[{"feor":"2411","en":"...","aliasok":["..."],"tobbes":"..."}]}
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
    aliasok = [str(a).strip() for a in x.get("aliasok") or [] if str(a).strip()]
    tobbes = str(x.get("tobbes", "")).strip()
    if not en or not tobbes:
        raise ValueError("hiányzik az 'en' vagy a 'tobbes'")
    if not 1 <= len(aliasok) <= 12:
        raise ValueError("az aliasok száma 1–12 kell legyen")
    return {"en": en, "aliasok": aliasok, "tobbes": tobbes}


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
                                 beolvas(args.isco_soc) if args.isco_soc else None, oszlop)
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
        sorok.append({"feor_kod": kod, "nev": nev, "extra_aliasok": extra,
                      "slug": egyedi_slug(nev, kod, foglalt)})
    if args.limit:
        sorok = sorok[:args.limit]
    print(f"  {len(feor)} FEOR-sor, {len(sorok)} új munkakör, {len(kihagyott)} gyűjtőkategória kihagyva")

    # 1. kör: angol cím, aliasok, többes szám
    if args.nincs_claude:
        info = {}
    else:
        info = _kotegelt([{"feor": s["feor_kod"], "nev": s["nev"]} for s in sorok], KOTEG_1, PROMPT_1,
                         "feor", "munkakorok", _ellenoriz_1, args.modell, gyoker / "claude_cache", hivas)

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
        v = valasztas.get(k)
        if v is not None:
            kodok, biz, ind = v["kodok"], v["bizonyossag"], v["indoklas"]
            forras = "claude"
        elif kereszt[k]:       # Claude nélkül: a keresztkapcsolat első találatai
            kodok, biz, ind, forras = kereszt[k][:2], 0.5, "keresztkapcsolat, Claude nélkül", "keresztkapcsolat"
        else:
            kodok, biz, ind, forras = [], 0.0, "nincs jelölt", "nincs"
        statusz = ("hianyzik" if not kodok else "auto" if biz >= args.biztos_kuszob else "atnezendo")
        aliasok = list(dict.fromkeys(s["extra_aliasok"] + i.get("aliasok", [])))
        aliasok = [a for a in aliasok if a.lower() != s["nev"].lower()]
        uj.append({"slug": s["slug"], "nev": s["nev"], "aliasok": ";".join(aliasok), "feor_kod": k,
                   "isco_kod": ";".join(f2i.get(k, [])), "onet_soc_kodok": ";".join(kodok), "heti_ora": 40,
                   "indexelheto": "false", "tobbes": i.get("tobbes", ""), "bizonyossag": biz,
                   "statusz": statusz, "forras": forras, "indoklas": ind})

    kimenet = Path(args.kimenet)
    kimenet.parent.mkdir(parents=True, exist_ok=True)
    regi = meglevo.reindex(columns=CSV_OSZLOPOK).fillna("")
    teljes = pd.concat([regi, pd.DataFrame(uj, columns=CSV_OSZLOPOK)], ignore_index=True)
    teljes.to_csv(kimenet, index=False, encoding="utf-8-sig")

    riport = {"osszes_feor_sor": len(feor), "uj": len(uj), "meglevo": len(regi),
              "gyujtokategoria_kihagyva": kihagyott,
              "statusz": {n: sum(1 for u in uj if u["statusz"] == n) for n in ("auto", "atnezendo", "hianyzik")},
              "claude_nelkul_aliasok": sum(1 for u in uj if not u["tobbes"])}
    Path(str(kimenet) + ".riport.json").write_text(json.dumps(riport, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✓ {len(teljes)} sor → {kimenet}  ({riport['statusz']})")
    if riport["claude_nelkul_aliasok"]:
        figyel(f"{riport['claude_nelkul_aliasok']} sorhoz nincs 'tobbes'/alias (Claude nélkül futott vagy hibás válasz).")
    return riport
