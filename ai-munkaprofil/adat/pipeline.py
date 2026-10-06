#!/usr/bin/env python3
"""
AI-Munkaprofil – adatfeldolgozó pipeline

Három lépés:
  1. elokeszit   O*NET + GPTs-are-GPTs kitettség + Anthropic Economic Index → nyers/<slug>.json
  2. csoportosit Claude a nyers feladatokat 4–7 magyar feladattá vonja össze, fékeket és
                 teendő-szöveget javasol → atnezes/<slug>.json  (KÉZI ÁTNÉZÉSRE)
  3. export      átnézett fájlokból → public/data/<slug>.json, public/data/kereso.json, seed.sql

Minden szám Pythonban számolódik; Claude csak csoportosít és fogalmaz.
Az összevonás a végső órákat nem torzítja: a csoportértékek súlyozott átlagok,
így a kiváltható / felgyorsuló / emberi összegek azonosak az összevonás előtti értékekkel.

Példa:
  python pipeline.py elokeszit --onet-feladatok "Task Statements.xlsx" \\
      --onet-ertekelesek "Task Ratings.xlsx" --kitettseg full_labelset.tsv \\
      --economic-index automation_vs_augmentation_by_task.csv
  python pipeline.py csoportosit
  # ... átnézés: atnezes/*.json, "ellenorizve": true ...
  python pipeline.py export --verzio 2026-Q4
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import re
import sys
from pathlib import Path

import pandas as pd

GYOKER = Path(__file__).resolve().parent
ALAP_MODELL = os.environ.get("MUNKAPROFIL_MODELL", "claude-sonnet-5-5")
MAX_NYERS_FELADAT = 25          # ennyi legsúlyosabb O*NET-feladat megy tovább munkakörönként
CORE_SULY, SUPPLEMENTAL_SULY = 1.0, 0.5

# O*NET FT (gyakoriság) kategóriák → becsült alkalom / év
FT_ALKALOM = {1: 1, 2: 6, 3: 24, 4: 100, 5: 250, 6: 750, 7: 2000}

AUTOMATIZALAS_MINTAK = {"directive", "feedbackloop"}
FELEROSITES_MINTAK = {"taskiteration", "learning", "validation"}

CIMKE_KITETTSEG = {"E0": 0.0, "E1": 1.0, "E2": 0.5, "E3": 0.5}   # a tanulmány β-mérőszáma
CIMKE_HORIZONT = {"E0": "5ev+", "E1": "ma", "E2": "1-3ev", "E3": "1-3ev"}


# ───────────────────────── segédfüggvények ─────────────────────────

def figyel(uzenet: str) -> None:
    print(f"  ⚠ {uzenet}", file=sys.stderr)


def norm_nev(s: str) -> str:
    """Oszlopnév-normalizálás: kisbetű, csak alfanumerikus."""
    return re.sub(r"[^a-z0-9]", "", str(s).lower())


def norm_szoveg(s: str) -> str:
    """Feladatszöveg-normalizálás az illesztéshez."""
    s = re.sub(r"\s+", " ", str(s).lower()).strip()
    return s.rstrip(". ")


def beolvas(utvonal: str | Path) -> pd.DataFrame:
    p = Path(utvonal)
    if not p.exists():
        sys.exit(f"Hiányzó fájl: {p}")
    if p.suffix.lower() in {".xlsx", ".xls"}:
        return pd.read_excel(p, dtype=str).fillna("")
    sep = "\t" if p.suffix.lower() in {".txt", ".tsv"} else ","
    return pd.read_csv(p, sep=sep, dtype=str, keep_default_na=False)


def oszlop(df: pd.DataFrame, jeloltek: list[str], kotelezo: bool = True) -> str | None:
    terkep = {norm_nev(c): c for c in df.columns}
    for j in jeloltek:
        if norm_nev(j) in terkep:
            return terkep[norm_nev(j)]
    if kotelezo:
        sys.exit(f"Nem találom egyik oszlopot sem: {jeloltek}\nElérhető oszlopok: {list(df.columns)}")
    return None


_EKEZET = str.maketrans("áéíóöőúüű", "aeiooouuu")


def magyar_rendezo(s: str) -> tuple[str, str]:
    """Közelítő magyar ábécérend: az ékezetes betű az alapbetűje mellé kerül (Ü az U-hoz, nem a lista végére)."""
    k = s.lower()
    return k.translate(_EKEZET), k


def szam(x) -> float | None:
    try:
        v = float(str(x).replace(",", "."))
        return None if math.isnan(v) else v
    except (TypeError, ValueError):
        return None


# ───────────────────────── 1. ELŐKÉSZÍTÉS ─────────────────────────

def betolt_munkakorok(utvonal: Path) -> list[dict]:
    df = beolvas(utvonal)
    munkakorok = []
    for _, r in df.iterrows():
        munkakorok.append({
            "slug": r["slug"].strip(),
            "nev": r["nev"].strip(),
            "aliasok": [a.strip() for a in r.get("aliasok", "").split(";") if a.strip()],
            "feor_kod": r.get("feor_kod", "").strip() or None,
            "isco_kod": r.get("isco_kod", "").strip() or None,
            "soc_kodok": [k.strip() for k in r["onet_soc_kodok"].split(";") if k.strip()],
            "heti_ora": float(r.get("heti_ora") or 40),
            "indexelheto": str(r.get("indexelheto", "")).strip().lower() in {"true", "1", "igen"},
        })
    return munkakorok


def betolt_onet_sulyok(feladatok_ut: str, ertekelesek_ut: str | None) -> pd.DataFrame:
    """Feladatonkénti nyers súly: log(1+gyakoriság) × fontosság × (Core/Supplemental)."""
    fd = beolvas(feladatok_ut)
    soc_c = oszlop(fd, ["O*NET-SOC Code", "onetsoc_code", "soc_code"])
    id_c = oszlop(fd, ["Task ID", "task_id"])
    txt_c = oszlop(fd, ["Task", "task_statement"])
    tip_c = oszlop(fd, ["Task Type", "task_type"], kotelezo=False)

    tasks = pd.DataFrame({
        "soc": fd[soc_c].str.strip(),
        "task_id": fd[id_c].str.strip(),
        "task": fd[txt_c].str.strip(),
        "tipus": fd[tip_c].str.strip() if tip_c else "Core",
    })
    tasks["tipus_suly"] = tasks["tipus"].map(
        lambda t: SUPPLEMENTAL_SULY if str(t).lower().startswith("supp") else CORE_SULY)
    tasks["gyakorisag"] = float("nan")
    tasks["fontossag"] = float("nan")

    if ertekelesek_ut:
        er = beolvas(ertekelesek_ut)
        e_soc = oszlop(er, ["O*NET-SOC Code", "onetsoc_code"])
        e_id = oszlop(er, ["Task ID", "task_id"])
        e_scale = oszlop(er, ["Scale ID", "scale_id"])
        e_cat = oszlop(er, ["Category", "category"], kotelezo=False)
        e_val = oszlop(er, ["Data Value", "data_value"])
        er = er.assign(_v=er[e_val].map(szam).astype(float), _soc=er[e_soc].str.strip(),
                       _id=er[e_id].str.strip(), _scale=er[e_scale].str.strip())

        ft = er[er._scale == "FT"].copy()
        if e_cat and len(ft):
            ft["_alk"] = ft[e_cat].map(lambda c: FT_ALKALOM.get(int(szam(c) or 0), 0)) * ft["_v"].fillna(0) / 100
            gyak = ft.groupby(["_soc", "_id"])["_alk"].sum()
            tasks["gyakorisag"] = [gyak.get((s, i), float("nan")) for s, i in zip(tasks.soc, tasks.task_id)]

        im = er[er._scale == "IM"].groupby(["_soc", "_id"])["_v"].mean()
        tasks["fontossag"] = [im.get((s, i), float("nan")) for s, i in zip(tasks.soc, tasks.task_id)]
    else:
        figyel("Nincs Task Ratings fájl – minden feladat azonos súlyt kap (csak Core/Supplemental különbség).")

    gy = tasks["gyakorisag"].fillna(tasks["gyakorisag"].median() if tasks["gyakorisag"].notna().any() else 100)
    fo = tasks["fontossag"].fillna(tasks["fontossag"].median() if tasks["fontossag"].notna().any() else 3)
    tasks["nyers_suly"] = gy.map(math.log1p) * fo * tasks["tipus_suly"]
    return tasks


def betolt_kitettseg(utvonal: str, oszlop_nev: str | None) -> tuple[dict, dict, str]:
    """→ (task_id → (kitettség, horizont, címke), normalizált szöveg → ugyanez, használt oszlop)"""
    df = beolvas(utvonal)
    id_c = oszlop(df, ["Task ID", "task_id"], kotelezo=False)
    txt_c = oszlop(df, ["Task", "task"], kotelezo=False)
    if not id_c and not txt_c:
        sys.exit(f"A kitettségi fájlban nincs Task ID / Task oszlop. Oszlopok: {list(df.columns)}")

    if oszlop_nev:
        cimke_c = oszlop(df, [oszlop_nev])
    else:
        # automatikus: E0–E3 értékű oszlopok, GPT-4 címke előnyben, utána emberi
        jeloltek = [c for c in df.columns
                    if set(df[c].str.strip().unique()) - {""} <= set(CIMKE_KITETTSEG) and df[c].str.strip().ne("").any()]
        if not jeloltek:
            sys.exit("Nem találok E0/E1/E2 címkés oszlopot. Add meg: --kitettseg-oszlop <név>\n"
                     f"Oszlopok: {list(df.columns)}")
        jeloltek.sort(key=lambda c: (0 if "gpt" in c.lower() else 1 if "human" in c.lower() else 2, c))
        cimke_c = jeloltek[0]
        print(f"  Kitettségi oszlop: '{cimke_c}' (jelöltek: {jeloltek})")

    def ertelmez(v: str):
        v = str(v).strip()
        if v in CIMKE_KITETTSEG:
            return CIMKE_KITETTSEG[v], CIMKE_HORIZONT[v], v
        n = szam(v)                     # numerikus β (0 / 0,5 / 1) is elfogadott
        if n is None:
            return None
        n = max(0.0, min(1.0, n))
        return n, ("ma" if n >= 0.75 else "1-3ev" if n >= 0.25 else "5ev+"), f"β={n:g}"

    id_map, txt_map = {}, {}
    for _, r in df.iterrows():
        e = ertelmez(r[cimke_c])
        if e is None:
            continue
        if id_c and r[id_c].strip():
            id_map[r[id_c].strip()] = e
        if txt_c:
            txt_map[norm_szoveg(r[txt_c])] = e
    return id_map, txt_map, cimke_c


def betolt_economic_index(utvonal: str | None) -> dict[str, float]:
    """→ normalizált feladatszöveg → kiváltási arány (automation / (automation + augmentation))."""
    if not utvonal:
        figyel("Nincs Economic Index fájl – a kiváltási arány mindenhol 0,5 (semleges) lesz.")
        return {}
    df = beolvas(utvonal)
    task_c = oszlop(df, ["task_name", "task", "onet_task", "task_statement"])
    oszlopok = {norm_nev(c): c for c in df.columns}

    eredmeny: dict[str, float] = {}
    if "directive" in oszlopok:                         # széles formátum: mintánként egy oszlop
        auto_c = [oszlopok[n] for n in AUTOMATIZALAS_MINTAK if n in oszlopok]
        aug_c = [oszlopok[n] for n in FELEROSITES_MINTAK if n in oszlopok]
        for _, r in df.iterrows():
            a = sum(szam(r[c]) or 0 for c in auto_c)
            g = sum(szam(r[c]) or 0 for c in aug_c)
            if a + g > 0:
                eredmeny[norm_szoveg(r[task_c])] = a / (a + g)
    else:                                               # hosszú formátum: minta-oszlop + érték-oszlop
        minta_c = next((c for c in df.columns if c != task_c and
                        df[c].map(norm_nev).isin(AUTOMATIZALAS_MINTAK | FELEROSITES_MINTAK).any()), None)
        ertek_c = next((c for c in df.columns if c not in {task_c, minta_c} and
                        df[c].map(szam).notna().mean() > 0.9), None)
        if not minta_c or not ertek_c:
            sys.exit("Az Economic Index fájl formátumát nem ismerem fel (sem széles, sem hosszú).\n"
                     f"Oszlopok: {list(df.columns)}")
        df = df.assign(_m=df[minta_c].map(norm_nev), _v=df[ertek_c].map(szam).fillna(0), _t=df[task_c].map(norm_szoveg))
        for t, g in df.groupby("_t"):
            a = g.loc[g._m.isin(AUTOMATIZALAS_MINTAK), "_v"].sum()
            u = g.loc[g._m.isin(FELEROSITES_MINTAK), "_v"].sum()
            if a + u > 0:
                eredmeny[t] = a / (a + u)
    print(f"  Economic Index: {len(eredmeny)} feladat kiváltási aránnyal")
    return eredmeny


def elokeszit(args) -> None:
    munkakorok = betolt_munkakorok(Path(args.munkakorok))
    tasks = betolt_onet_sulyok(args.onet_feladatok, args.onet_ertekelesek)
    kit_id, kit_txt, _ = betolt_kitettseg(args.kitettseg, args.kitettseg_oszlop)
    ei = betolt_economic_index(args.economic_index)
    ei_globalis = sum(ei.values()) / len(ei) if ei else 0.5

    kimenet = GYOKER / "nyers"
    kimenet.mkdir(exist_ok=True)
    elerheto_soc = set(tasks.soc)

    for m in munkakorok:
        print(f"→ {m['slug']}")
        figyelmeztetesek = []
        reszek = []
        for soc in m["soc_kodok"]:
            t = tasks[tasks.soc == soc].copy()
            if t.empty:
                hasonlo = sorted(s for s in elerheto_soc if s[:7] == soc[:7])[:5]
                msg = f"SOC-kód nincs az O*NET-adatban: {soc}" + (f" (hasonlók: {', '.join(hasonlo)})" if hasonlo else "")
                figyel(msg); figyelmeztetesek.append(msg)
                continue
            t["arany"] = t.nyers_suly / t.nyers_suly.sum()   # SOC-kódonként normalizálva…
            reszek.append(t)
        if not reszek:
            figyel(f"{m['slug']}: egyetlen SOC-kódhoz sincs adat – kihagyva.")
            continue
        t = pd.concat(reszek)
        t["arany"] = t.arany / len(reszek)                    # …majd a kódok egyenlő arányban

        t = t.sort_values("arany", ascending=False)
        elhagyott = float(t.arany.iloc[MAX_NYERS_FELADAT:].sum())
        t = t.head(MAX_NYERS_FELADAT).copy()
        t["arany"] = t.arany / t.arany.sum()
        if elhagyott > 0.05:
            figyelmeztetesek.append(f"A kis súlyú feladatok elhagyása a munkaidő {elhagyott:.0%}-át érinti.")

        sorok, ei_talalt = [], []
        for _, r in t.iterrows():
            e = kit_id.get(r.task_id) or kit_txt.get(norm_szoveg(r.task))
            kitettseg_forras = "gpts-are-gpts" if e else "hianyzik"
            sorok.append({
                "task_id": r.task_id, "soc": r.soc, "task": r.task, "arany": float(r.arany),
                "kitettseg": e[0] if e else None, "horizont": e[1] if e else None,
                "cimke": e[2] if e else None, "kitettseg_forras": kitettseg_forras,
                "kivaltas_arany": ei.get(norm_szoveg(r.task)),
            })
            if sorok[-1]["kivaltas_arany"] is not None:
                ei_talalt.append(sorok[-1]["kivaltas_arany"])

        # hiányzó kitettség → munkakör-átlag (jelölve)
        ismert = [s for s in sorok if s["kitettseg"] is not None]
        if not ismert:
            figyel(f"{m['slug']}: egyik feladathoz sincs kitettségi adat – kihagyva.")
            continue
        kit_atlag = sum(s["kitettseg"] * s["arany"] for s in ismert) / sum(s["arany"] for s in ismert)
        hianyzo_kit = [s for s in sorok if s["kitettseg"] is None]
        for s in hianyzo_kit:
            s["kitettseg"] = round(kit_atlag, 3)
            s["horizont"] = "ma" if kit_atlag >= 0.75 else "1-3ev" if kit_atlag >= 0.25 else "5ev+"
            s["kitettseg_forras"] = "munkakor-atlag"
        if hianyzo_kit:
            figyelmeztetesek.append(f"{len(hianyzo_kit)} feladatnál nincs kitettségi adat (munkakör-átlag használva).")

        # hiányzó kiváltási arány → munkakör-átlag → globális átlag
        mk_ei = sum(ei_talalt) / len(ei_talalt) if ei_talalt else None
        for s in sorok:
            if s["kivaltas_arany"] is not None:
                s["kivaltas_forras"] = "economic-index"
            elif mk_ei is not None:
                s["kivaltas_arany"], s["kivaltas_forras"] = round(mk_ei, 3), "munkakor-atlag"
            else:
                s["kivaltas_arany"], s["kivaltas_forras"] = round(ei_globalis, 3), "globalis-atlag"
        lefedett = sum(s["arany"] for s in sorok if s["kivaltas_forras"] == "economic-index")
        if lefedett < 0.5:
            figyelmeztetesek.append(f"Az Economic Index a munkaidő csak {lefedett:.0%}-át fedi le közvetlenül.")

        (kimenet / f"{m['slug']}.json").write_text(json.dumps(
            {**m, "feladatok_nyers": sorok, "figyelmeztetesek": figyelmeztetesek},
            ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  {len(sorok)} feladat, {len(figyelmeztetesek)} figyelmeztetés")


# ───────────────────────── 2. CSOPORTOSÍTÁS ─────────────────────────

RENDSZER_PROMPT = """Munkaerőpiaci elemző vagy. Egy magyar nyelvű, nyilvános "AI-Munkaprofil" eszközhöz készítesz adatot.
Kapsz egy munkakört és az O*NET-feladatait (angolul), munkaidő-aránnyal és AI-kitettséggel.

Feladatod:
1. Vond össze a feladatokat 4–7 érthető, magyar feladatcsoporttá. Minden task_id pontosan egy csoportba kerüljön.
   A csoportnév legyen rövid (max. 60 karakter), hétköznapi magyar, ahogy egy magyar munkavállaló mondaná.
   Hasonló AI-kitettségű feladatokat vonj össze; ne keverd a jól és rosszul automatizálható feladatokat.
2. "emberi_mag": true azokra a csoportokra, amelyek az AI mellett is emberi maradnak és felértékelődnek.
3. "csatorna": "telefon", "irasos" vagy "szemelyes", ha a csoport egyértelműen egy csatornához kötött; különben null.
4. Fékerők 0–3 skálán (0 = nincs, 3 = erős), magyar munkaerőpiaci kontextusban, egymondatos indoklással:
   fizikai (fizikai jelenlét, kézügyesség), felelosseg (jogi/szakmai felelősség, aláírás),
   szabalyozas (EU AI Act, ágazati előírások), bizalom (elvárják-e az ügyfelek az embert).
5. "teendo_szoveg": 2–3 mondat, tegező, konkrét és bátorító: milyen irányba fejlődjön, aki ezt a munkát végzi.
   Ne ígérj, ne riogass, ne említs konkrét százalékot.

Csak érvényes JSON-t adj vissza, magyarázat nélkül, ebben a szerkezetben:
{"feladatok":[{"leiras":"...","task_idk":["..."],"emberi_mag":false,"csatorna":null}],
 "fekek":{"fizikai":{"ertek":0,"indoklas":"..."},"felelosseg":{...},"szabalyozas":{...},"bizalom":{...}},
 "teendo_szoveg":"..."}"""


def claude_kerdes(nyers: dict, modell: str, hiba: str | None = None) -> dict:
    import anthropic  # csak ennél a lépésnél kell

    cache_dir = GYOKER / "claude_cache"
    cache_dir.mkdir(exist_ok=True)
    feladat_sorok = "\n".join(
        f'- task_id={s["task_id"]} | arány={s["arany"]:.3f} | kitettség={s["kitettseg"]} | '
        f'kiváltási arány={s["kivaltas_arany"]} | {s["task"]}'
        for s in nyers["feladatok_nyers"])
    uzenet = f'Munkakör: {nyers["nev"]} (O*NET: {", ".join(nyers["soc_kodok"])})\n\nFeladatok:\n{feladat_sorok}'
    if hiba:
        uzenet += f"\n\nAz előző válaszod hibás volt: {hiba}\nJavítsd, és csak a teljes JSON-t add vissza."

    kulcs = hashlib.sha256(f"{modell}\n{RENDSZER_PROMPT}\n{uzenet}".encode()).hexdigest()[:16]
    cache = cache_dir / f"{nyers['slug']}-{kulcs}.json"
    if cache.exists():
        szoveg = cache.read_text(encoding="utf-8")
    else:
        valasz = anthropic.Anthropic().messages.create(
            model=modell, max_tokens=4000, system=RENDSZER_PROMPT,
            messages=[{"role": "user", "content": uzenet}])
        szoveg = "".join(b.text for b in valasz.content if b.type == "text")
        cache.write_text(szoveg, encoding="utf-8")

    talalat = re.search(r"\{.*\}", szoveg, re.S)
    if not talalat:
        raise ValueError("A válaszban nincs JSON.")
    return json.loads(talalat.group(0))


def ellenoriz_csoportositas(c: dict, task_idk: set[str]) -> None:
    csoportok = c.get("feladatok") or []
    if not 3 <= len(csoportok) <= 8:
        raise ValueError(f"{len(csoportok)} csoport jött, 4–7 kell.")
    latott: list[str] = []
    for g in csoportok:
        if not str(g.get("leiras", "")).strip():
            raise ValueError("Üres csoportnév.")
        if g.get("csatorna") not in (None, "telefon", "irasos", "szemelyes"):
            raise ValueError(f"Érvénytelen csatorna: {g.get('csatorna')}")
        latott += [str(i) for i in g.get("task_idk", [])]
    if sorted(latott) != sorted(task_idk):
        hiany = task_idk - set(latott)
        tobblet = [i for i in set(latott) if latott.count(i) > 1 or i not in task_idk]
        raise ValueError(f"A task_id-k nem pontosan egyszer szerepelnek. Hiányzik: {sorted(hiany)}, "
                         f"duplikált/ismeretlen: {sorted(tobblet)}")
    for nev in ("fizikai", "felelosseg", "szabalyozas", "bizalom"):
        ertek = (c.get("fekek") or {}).get(nev, {}).get("ertek")
        if not isinstance(ertek, int) or not 0 <= ertek <= 3:
            raise ValueError(f"Érvénytelen fék: {nev}={ertek}")


def tartalek_csoportositas(nyers: dict) -> dict:
    """Claude nélküli, determinisztikus csoportosítás (teszteléshez, offline munkához)."""
    s = nyers["feladatok_nyers"]
    fo, maradek = s[:5], s[5:]
    csoportok = [{"leiras": f"[FORDÍTANDÓ] {x['task'][:80]}", "task_idk": [x["task_id"]],
                  "emberi_mag": x["kitettseg"] < 0.25, "csatorna": None} for x in fo]
    if maradek:
        csoportok.append({"leiras": "[FORDÍTANDÓ] Egyéb feladatok", "task_idk": [x["task_id"] for x in maradek],
                          "emberi_mag": False, "csatorna": None})
    fek = {"ertek": 1, "indoklas": "KÉZZEL KITÖLTENDŐ"}
    return {"feladatok": csoportok,
            "fekek": {n: dict(fek) for n in ("fizikai", "felelosseg", "szabalyozas", "bizalom")},
            "teendo_szoveg": "KÉZZEL KITÖLTENDŐ"}


def osszesit_csoportok(nyers: dict, csoportok: list[dict]) -> list[dict]:
    """Csoportértékek súlyozott átlaggal – az órák összege változatlan marad."""
    by_id = {s["task_id"]: s for s in nyers["feladatok_nyers"]}
    eredmeny = []
    for g in csoportok:
        tagok = [by_id[str(i)] for i in g["task_idk"]]
        arany = sum(t["arany"] for t in tagok)
        kit = sum(t["arany"] * t["kitettseg"] for t in tagok) / arany
        erintett = sum(t["arany"] * t["kitettseg"] for t in tagok)
        kiv = (sum(t["arany"] * t["kitettseg"] * t["kivaltas_arany"] for t in tagok) / erintett
               if erintett > 0 else sum(t["arany"] * t["kivaltas_arany"] for t in tagok) / arany)
        # horizont: a csoport munkaidejének többsége hová esik
        ma = sum(t["arany"] for t in tagok if t["horizont"] == "ma") / arany
        kozep = sum(t["arany"] for t in tagok if t["horizont"] == "1-3ev") / arany
        horizont = "ma" if ma >= 0.5 else "1-3ev" if ma + kozep >= 0.5 else "5ev+"
        eredmeny.append({
            "leiras": g["leiras"].strip(),
            "task_idk": [str(i) for i in g["task_idk"]],
            "idoArany": round(arany, 4),
            "kitettseg": round(kit, 3),
            "kivaltasArany": round(kiv, 3),
            "horizont": horizont,
            "csatorna": g.get("csatorna"),
            "emberiMag": bool(g.get("emberi_mag")),
        })
    return eredmeny


def csoportosit(args) -> None:
    nyers_dir, atn_dir = GYOKER / "nyers", GYOKER / "atnezes"
    atn_dir.mkdir(exist_ok=True)
    fajlok = sorted(nyers_dir.glob("*.json"))
    if args.csak:
        fajlok = [f for f in fajlok if f.stem in set(args.csak)]
    if not fajlok:
        sys.exit("Nincs feldolgozandó fájl a nyers/ mappában. Előbb: python pipeline.py elokeszit ...")

    for f in fajlok:
        cel = atn_dir / f.name
        if cel.exists() and not args.felulir:
            print(f"= {f.stem}: már van átnézési fájl (felülíráshoz: --felulir)")
            continue
        print(f"→ {f.stem}")
        nyers = json.loads(f.read_text(encoding="utf-8"))
        task_idk = {s["task_id"] for s in nyers["feladatok_nyers"]}

        if args.nincs_claude:
            c = tartalek_csoportositas(nyers)
        else:
            hiba = None
            for probalkozas in range(2):
                try:
                    c = claude_kerdes(nyers, args.modell, hiba)
                    ellenoriz_csoportositas(c, task_idk)
                    break
                except (ValueError, json.JSONDecodeError) as e:
                    hiba = str(e)
                    figyel(f"{f.stem}: hibás válasz ({hiba})" + (" – újrapróbálom" if probalkozas == 0 else ""))
            else:
                figyel(f"{f.stem}: kihagyva, kézzel kell csoportosítani.")
                continue

        atnezes = {
            "ellenorizve": False,
            "slug": nyers["slug"], "nev": nyers["nev"], "aliasok": nyers["aliasok"],
            "feor_kod": nyers["feor_kod"], "isco_kod": nyers["isco_kod"], "soc_kodok": nyers["soc_kodok"],
            "heti_ora": nyers["heti_ora"], "indexelheto": nyers["indexelheto"],
            "fekek": c["fekek"],
            "teendo_szoveg": c["teendo_szoveg"],
            "csoportok": [{"leiras": g["leiras"], "task_idk": [str(i) for i in g["task_idk"]],
                           "emberi_mag": bool(g.get("emberi_mag")), "csatorna": g.get("csatorna")}
                          for g in c["feladatok"]],
            "_szamitott_elonezet": osszesit_csoportok(nyers, c["feladatok"]),
            "_figyelmeztetesek": nyers["figyelmeztetesek"],
            "_eredeti_feladatok": {s["task_id"]: s["task"] for s in nyers["feladatok_nyers"]},
        }
        cel.write_text(json.dumps(atnezes, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  {len(atnezes['csoportok'])} csoport → {cel.relative_to(GYOKER)}")

    print("\nKövetkező lépés: nézd át az atnezes/*.json fájlokat (csoportnevek, fékek, teendő),\n"
          "majd állítsd \"ellenorizve\": true értékre. Utána: python pipeline.py export")


# ───────────────────────── 3. EXPORT ─────────────────────────

def sql_szoveg(v) -> str:
    if v is None:
        return "NULL"
    return "'" + str(v).replace("'", "''") + "'"


def sql_tomb(lista: list[str]) -> str:
    return "ARRAY[" + ",".join(sql_szoveg(x) for x in lista) + "]::text[]" if lista else "'{}'::text[]"


def export(args) -> None:
    nyers_dir, atn_dir = GYOKER / "nyers", GYOKER / "atnezes"
    kimenet = Path(args.kimenet)
    kimenet.mkdir(parents=True, exist_ok=True)

    munkakorok, kereso = [], []
    for f in sorted(atn_dir.glob("*.json")):
        a = json.loads(f.read_text(encoding="utf-8"))
        if not a.get("ellenorizve") and not args.ellenorizetlen_is:
            figyel(f"{f.stem}: nincs átnézve (ellenorizve=false) – kihagyva.")
            continue
        nyers = json.loads((nyers_dir / f.name).read_text(encoding="utf-8"))
        task_idk = {s["task_id"] for s in nyers["feladatok_nyers"]}
        ellenoriz_csoportositas({"feladatok": a["csoportok"], "fekek": a["fekek"]}, task_idk)
        feladatok = osszesit_csoportok(nyers, a["csoportok"])

        jelzo = [g["leiras"] for g in feladatok if "FORDÍTANDÓ" in g["leiras"]]
        if "KÉZZEL KITÖLTENDŐ" in json.dumps(a, ensure_ascii=False) or jelzo:
            figyel(f"{f.stem}: kitöltetlen / fordítandó mezők maradtak.")

        adat = {
            "slug": a["slug"], "nev": a["nev"], "hetiOra": a["heti_ora"],
            "fekek": {n: a["fekek"][n]["ertek"] for n in ("fizikai", "felelosseg", "szabalyozas", "bizalom")},
            "fekIndoklas": {n: a["fekek"][n].get("indoklas", "") for n in ("fizikai", "felelosseg", "szabalyozas", "bizalom")},
            "feladatok": [{k: v for k, v in g.items() if k != "task_idk" and v is not None} for g in feladatok],
            "teendo": a["teendo_szoveg"],
            "indexelheto": a["indexelheto"],
            "adatVerzio": args.verzio,
        }
        (kimenet / f"{a['slug']}.json").write_text(json.dumps(adat, ensure_ascii=False, separators=(",", ":")),
                                                   encoding="utf-8")
        kereso.append({"slug": a["slug"], "nev": a["nev"], "aliasok": a["aliasok"]})
        munkakorok.append((a, feladatok, nyers))

    if not munkakorok:
        sys.exit("Nincs exportálható munkakör.")

    kereso.sort(key=lambda x: magyar_rendezo(x["nev"]))
    (kimenet / "kereso.json").write_text(json.dumps(kereso, ensure_ascii=False, separators=(",", ":")),
                                         encoding="utf-8")

    sql = ["-- Generálta: pipeline.py export – kézzel ne szerkeszd", "BEGIN;"]
    for a, feladatok, nyers in munkakorok:
        fk = {n: a["fekek"][n]["ertek"] for n in ("fizikai", "felelosseg", "szabalyozas", "bizalom")}
        sql.append(
            "INSERT INTO munkakor (slug, nev, aliasok, feor_kod, isco_kod, soc_kodok, heti_ora, fek_fizikai, "
            "fek_felelosseg, fek_szabalyozas, fek_bizalom, teendo_szoveg, indexelheto, adat_verzio, frissitve) VALUES ("
            f"{sql_szoveg(a['slug'])}, {sql_szoveg(a['nev'])}, {sql_tomb(a['aliasok'])}, {sql_szoveg(a['feor_kod'])}, "
            f"{sql_szoveg(a['isco_kod'])}, {sql_tomb(a['soc_kodok'])}, {a['heti_ora']}, {fk['fizikai']}, "
            f"{fk['felelosseg']}, {fk['szabalyozas']}, {fk['bizalom']}, {sql_szoveg(a['teendo_szoveg'])}, "
            f"{'TRUE' if a['indexelheto'] else 'FALSE'}, {sql_szoveg(args.verzio)}, now())\n"
            "ON CONFLICT (slug) DO UPDATE SET nev=EXCLUDED.nev, aliasok=EXCLUDED.aliasok, feor_kod=EXCLUDED.feor_kod, "
            "isco_kod=EXCLUDED.isco_kod, soc_kodok=EXCLUDED.soc_kodok, heti_ora=EXCLUDED.heti_ora, "
            "fek_fizikai=EXCLUDED.fek_fizikai, fek_felelosseg=EXCLUDED.fek_felelosseg, "
            "fek_szabalyozas=EXCLUDED.fek_szabalyozas, fek_bizalom=EXCLUDED.fek_bizalom, "
            "teendo_szoveg=EXCLUDED.teendo_szoveg, indexelheto=EXCLUDED.indexelheto, "
            "adat_verzio=EXCLUDED.adat_verzio, frissitve=now();")
        mk_id = f"(SELECT id FROM munkakor WHERE slug = {sql_szoveg(a['slug'])})"
        sql.append(f"DELETE FROM feladat WHERE munkakor_id = {mk_id};")
        for g in feladatok:
            onet = ";".join(g["task_idk"])
            sql.append(
                "INSERT INTO feladat (munkakor_id, leiras, onet_task_id, ido_arany, kitettseg, kivaltas_arany, "
                f"horizont, csatorna, emberi_mag) VALUES ({mk_id}, {sql_szoveg(g['leiras'])}, {sql_szoveg(onet)}, "
                f"{g['idoArany']}, {g['kitettseg']}, {g['kivaltasArany']}, {sql_szoveg(g['horizont'])}, "
                f"{sql_szoveg(g['csatorna'])}, {'TRUE' if g['emberiMag'] else 'FALSE'});")
    sql.append("COMMIT;")
    Path(args.seed).write_text("\n".join(sql) + "\n", encoding="utf-8")

    print(f"✓ {len(munkakorok)} munkakör → {kimenet}/ (+ kereso.json), {args.seed}")


# ───────────────────────── CLI ─────────────────────────

def main(argv: list[str] | None = None) -> None:
    global GYOKER
    p = argparse.ArgumentParser(description="AI-Munkaprofil adatpipeline")
    p.add_argument("--mappa", default=str(GYOKER),
                   help="Munkamappa (nyers/, atnezes/, claude_cache/, public/data/, seed.sql helye)")
    al = p.add_subparsers(dest="parancs", required=True)

    e = al.add_parser("elokeszit", help="Nyers adatok összefésülése")
    e.add_argument("--munkakorok", default=str(GYOKER / "munkakorok.csv"))
    e.add_argument("--onet-feladatok", required=True, help="O*NET Task Statements (.xlsx / .txt)")
    e.add_argument("--onet-ertekelesek", help="O*NET Task Ratings (.xlsx / .txt) – gyakoriság és fontosság")
    e.add_argument("--kitettseg", required=True, help="GPTs-are-GPTs feladatszintű címkék (.tsv / .csv)")
    e.add_argument("--kitettseg-oszlop", help="A címke-oszlop neve (alapból automatikus felismerés)")
    e.add_argument("--economic-index", help="Anthropic Economic Index feladatszintű fájl (.csv)")
    e.set_defaults(fn=elokeszit)

    c = al.add_parser("csoportosit", help="Claude-dal csoportosítás és fordítás")
    c.add_argument("--modell", default=ALAP_MODELL)
    c.add_argument("--csak", nargs="*", help="Csak ezek a slugok")
    c.add_argument("--felulir", action="store_true", help="Meglévő átnézési fájlok felülírása")
    c.add_argument("--nincs-claude", action="store_true", help="Claude nélküli tartalék-csoportosítás")
    c.set_defaults(fn=csoportosit)

    x = al.add_parser("export", help="Frontend JSON-ok és seed.sql")
    x.add_argument("--verzio", required=True, help="Adatverzió, pl. 2026-Q4")
    x.add_argument("--kimenet", help="Alapból: <mappa>/public/data")
    x.add_argument("--seed", help="Alapból: <mappa>/seed.sql")
    x.add_argument("--ellenorizetlen-is", action="store_true", help="Átnézetlen fájlokat is exportál (csak fejlesztéshez)")
    x.set_defaults(fn=export)

    args = p.parse_args(argv)
    GYOKER = Path(args.mappa).resolve()
    GYOKER.mkdir(parents=True, exist_ok=True)
    if args.parancs == "export":
        args.kimenet = args.kimenet or str(GYOKER / "public" / "data")
        args.seed = args.seed or str(GYOKER / "seed.sql")
    args.fn(args)


if __name__ == "__main__":
    main()
