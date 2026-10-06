"""
Futtatás:  python -m pytest -q test_pipeline.py
Szintetikus, a valós forrásfájlok szerkezetét utánzó mintaadatokkal teszteli a teljes folyamatot.
"""
import json
import shutil
import subprocess
from pathlib import Path

import pandas as pd
import pytest

import pipeline

ITT = Path(__file__).resolve().parent
SCORING = ITT.parent / "scoring.ts"

FELADATOK = [
    # soc, task_id, task, típus, FT kategória (domináns), IM, címke, EI (directive, feedback_loop, task_iteration, learning, validation)
    ("43-4051.00", "1001", "Answer customer emails about orders.", "Core", 6, 4.5, "E1", (0.6, 0.2, 0.1, 0.05, 0.05)),
    ("43-4051.00", "1002", "Handle customer phone calls.", "Core", 7, 4.6, "E2", (0.3, 0.1, 0.4, 0.1, 0.1)),
    ("43-4051.00", "1003", "Update customer records in database.", "Core", 5, 3.8, "E1", (0.8, 0.1, 0.05, 0.0, 0.05)),
    ("43-4051.00", "1004", "Resolve escalated complaints.", "Core", 4, 4.7, "E0", None),
    ("43-4051.00", "1005", "Coordinate exceptions with back office.", "Supplemental", 3, 3.5, "E0", None),
    ("43-4051.00", "1006", "Prepare daily activity reports.", "Supplemental", 5, 2.9, "E1", (0.5, 0.3, 0.1, 0.05, 0.05)),
    ("47-2111.00", "2001", "Install electrical wiring.", "Core", 6, 4.8, "E0", None),
    ("47-2111.00", "2002", "Diagnose electrical faults.", "Core", 5, 4.5, "E0", None),
    ("47-2111.00", "2003", "Prepare cost estimates.", "Supplemental", 3, 3.2, "E1", (0.4, 0.2, 0.2, 0.1, 0.1)),
    ("47-2111.00", "2004", "Read blueprints.", "Core", 5, 4.0, "E2", (0.2, 0.0, 0.3, 0.4, 0.1)),
]


def irj_forrasokat(mappa: Path, ei_formatum: str = "szeles") -> dict:
    mappa.mkdir(parents=True, exist_ok=True)
    ts = pd.DataFrame([{"O*NET-SOC Code": s, "Title": "x", "Task ID": i, "Task": t, "Task Type": tp,
                        "Incumbents Responding": 50, "Date": "2024", "Domain Source": "Incumbent"}
                       for s, i, t, tp, *_ in FELADATOK])
    ts.to_csv(mappa / "Task Statements.txt", sep="\t", index=False)

    sorok = []
    for s, i, t, _, ft, im, *_ in FELADATOK:
        for kat in range(1, 8):
            sorok.append({"O*NET-SOC Code": s, "Task ID": i, "Task": t, "Scale ID": "FT", "Category": kat,
                          "Data Value": 70.0 if kat == ft else 5.0})
        sorok.append({"O*NET-SOC Code": s, "Task ID": i, "Task": t, "Scale ID": "IM", "Category": "", "Data Value": im})
        sorok.append({"O*NET-SOC Code": s, "Task ID": i, "Task": t, "Scale ID": "RT", "Category": "", "Data Value": 90})
    pd.DataFrame(sorok).to_excel(mappa / "Task Ratings.xlsx", index=False)

    pd.DataFrame([{"O*NET-SOC Code": s, "Task ID": i, "Task": t, "Title": "x",
                   "human_exposure_agg": c, "gpt4_exposure": c, "alpha": 0}
                  for s, i, t, _, _, _, c, _ in FELADATOK]).to_csv(mappa / "full_labelset.tsv", sep="\t", index=False)

    minták = ["directive", "feedback_loop", "task_iteration", "learning", "validation"]
    ei = [(t.lower().rstrip("."), v) for _, _, t, _, _, _, _, v in FELADATOK if v]
    if ei_formatum == "szeles":
        pd.DataFrame([{"task_name": t, **dict(zip(minták, v)), "filtered": 0.0} for t, v in ei]) \
            .to_csv(mappa / "ei.csv", index=False)
    else:
        pd.DataFrame([{"task_name": t, "collaboration_type": m, "pct": x}
                      for t, v in ei for m, x in zip(minták, v)]).to_csv(mappa / "ei.csv", index=False)

    pd.DataFrame([
        {"slug": "ugyfelszolgalati-munkatars", "nev": "Ügyfélszolgálati munkatárs", "aliasok": "call center;ügyfélszolgálatos",
         "feor_kod": "", "isco_kod": "", "onet_soc_kodok": "43-4051.00", "heti_ora": 40, "indexelheto": "true"},
        {"slug": "villanyszerelo", "nev": "Villanyszerelő", "aliasok": "", "feor_kod": "", "isco_kod": "",
         "onet_soc_kodok": "47-2111.00;47-9999.00", "heti_ora": 40, "indexelheto": "false"},
        {"slug": "nemletezo", "nev": "Nemlétező", "aliasok": "", "feor_kod": "", "isco_kod": "",
         "onet_soc_kodok": "99-9999.00", "heti_ora": 40, "indexelheto": "false"},
    ]).to_csv(mappa / "munkakorok.csv", index=False)
    return {k: str(mappa / v) for k, v in {"ts": "Task Statements.txt", "tr": "Task Ratings.xlsx",
                                            "kit": "full_labelset.tsv", "ei": "ei.csv", "mk": "munkakorok.csv"}.items()}


def futtat_elokeszit(munka: Path, f: dict):
    pipeline.main(["--mappa", str(munka), "elokeszit", "--munkakorok", f["mk"], "--onet-feladatok", f["ts"],
                   "--onet-ertekelesek", f["tr"], "--kitettseg", f["kit"], "--economic-index", f["ei"]])


def orak(nyers_feladatok, hetiora=40):
    """Kiváltható / felerősített / emberi órák (nem kerekítve) egy feladatlistából."""
    kiv = fel = emb = 0.0
    for x in nyers_feladatok:
        a = x.get("arany", x.get("idoArany"))
        k = x["kitettseg"]
        r = x.get("kivaltas_arany", x.get("kivaltasArany"))
        kiv += hetiora * a * k * r
        fel += hetiora * a * k * (1 - r)
        emb += hetiora * a * (1 - k)
    return kiv, fel, emb


@pytest.mark.parametrize("ei_formatum", ["szeles", "hosszu"])
def test_elokeszit(tmp_path, ei_formatum, capsys):
    f = irj_forrasokat(tmp_path / "forras", ei_formatum)
    futtat_elokeszit(tmp_path / "munka", f)
    err = capsys.readouterr().err

    ugy = json.loads((tmp_path / "munka/nyers/ugyfelszolgalati-munkatars.json").read_text(encoding="utf-8"))
    assert len(ugy["feladatok_nyers"]) == 6
    assert sum(s["arany"] for s in ugy["feladatok_nyers"]) == pytest.approx(1.0)
    by_id = {s["task_id"]: s for s in ugy["feladatok_nyers"]}
    assert by_id["1001"]["kitettseg"] == 1.0 and by_id["1001"]["horizont"] == "ma"
    assert by_id["1002"]["kitettseg"] == 0.5 and by_id["1002"]["horizont"] == "1-3ev"
    assert by_id["1004"]["kitettseg"] == 0.0 and by_id["1004"]["horizont"] == "5ev+"
    assert by_id["1001"]["kivaltas_arany"] == pytest.approx(0.8)          # (0.6+0.2) / 1.0
    assert by_id["1001"]["kivaltas_forras"] == "economic-index"
    assert by_id["1004"]["kivaltas_forras"] == "munkakor-atlag"
    # Core + gyakoribb + fontosabb feladat nagyobb súlyú, mint a Supplemental riport
    assert by_id["1002"]["arany"] > by_id["1006"]["arany"]

    # hiányzó SOC-kód: figyelmeztetés, de a munkakör megmarad; teljesen hiányzó munkakör kimarad
    vill = json.loads((tmp_path / "munka/nyers/villanyszerelo.json").read_text(encoding="utf-8"))
    assert any("47-9999.00" in w for w in vill["figyelmeztetesek"])
    assert not (tmp_path / "munka/nyers/nemletezo.json").exists()
    assert "99-9999.00" in err


def test_teljes_folyamat_tartalek_csoportositassal(tmp_path):
    f = irj_forrasokat(tmp_path / "forras")
    munka = tmp_path / "munka"
    futtat_elokeszit(munka, f)
    pipeline.main(["--mappa", str(munka), "csoportosit", "--nincs-claude"])

    atn = munka / "atnezes/ugyfelszolgalati-munkatars.json"
    a = json.loads(atn.read_text(encoding="utf-8"))
    assert a["ellenorizve"] is False

    # átnézetlen fájl nem kerül exportba
    with pytest.raises(SystemExit):
        pipeline.main(["--mappa", str(munka), "export", "--verzio", "teszt"])

    for p in (munka / "atnezes").glob("*.json"):
        d = json.loads(p.read_text(encoding="utf-8"))
        d["ellenorizve"] = True
        p.write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
    pipeline.main(["--mappa", str(munka), "export", "--verzio", "2026-Q4"])

    adat = json.loads((munka / "public/data/ugyfelszolgalati-munkatars.json").read_text(encoding="utf-8"))
    nyers = json.loads((munka / "nyers/ugyfelszolgalati-munkatars.json").read_text(encoding="utf-8"))
    # az összevonás nem torzítja az órákat
    for x, y in zip(orak(adat["feladatok"]), orak(nyers["feladatok_nyers"])):
        assert x == pytest.approx(y, abs=0.05)
    assert adat["adatVerzio"] == "2026-Q4"
    assert set(adat["fekek"]) == {"fizikai", "felelosseg", "szabalyozas", "bizalom"}

    kereso = json.loads((munka / "public/data/kereso.json").read_text(encoding="utf-8"))
    assert [k["slug"] for k in kereso] == ["ugyfelszolgalati-munkatars", "villanyszerelo"]

    seed = (munka / "seed.sql").read_text(encoding="utf-8")
    assert seed.startswith("-- Generálta") and seed.rstrip().endswith("COMMIT;")
    assert "ON CONFLICT (slug) DO UPDATE" in seed
    assert seed.count("INSERT INTO feladat") == sum(
        len(json.loads(p.read_text(encoding="utf-8"))["feladatok"]) for p in (munka / "public/data").glob("*.json")
        if p.name != "kereso.json")

    # a frontend pontozása beolvassa a kimenetet
    if shutil.which("node") and SCORING.exists():
        kod = (f"import {{ szamolProfil }} from '{SCORING.as_uri()}';"
               f"const m = JSON.parse(require('fs').readFileSync('{(munka / 'public/data/villanyszerelo.json').as_posix()}','utf8'));"
               "const p = szamolProfil(m); console.log(JSON.stringify({tipus:p.tipus, ossz:p.orak.kivalthato+p.orak.felgyorsul+p.orak.emberi}));")
        (munka / "check.mts").write_text(kod.replace("require('fs')", "(await import('node:fs'))"), encoding="utf-8")
        futas = subprocess.run(["node", "--experimental-strip-types", str(munka / "check.mts")],
                               capture_output=True, text=True, encoding="utf-8")
        assert futas.returncode == 0, f"Node hiba:\n{futas.stderr}"
        ki = futas.stdout
        eredmeny = json.loads(ki.strip().splitlines()[-1])
        assert eredmeny["ossz"] == 40
        assert eredmeny["tipus"] == "vedett"


def test_claude_hibas_valasz_ujraprobalas(tmp_path, monkeypatch):
    f = irj_forrasokat(tmp_path / "forras")
    munka = tmp_path / "munka"
    futtat_elokeszit(munka, f)

    fek = {n: {"ertek": 1, "indoklas": "x"} for n in ("fizikai", "felelosseg", "szabalyozas", "bizalom")}
    hivasok = []

    def hamis_claude(nyers, modell, hiba=None):
        hivasok.append(hiba)
        idk = [s["task_id"] for s in nyers["feladatok_nyers"]]
        if hiba is None:   # első válasz hibás: egy task_id hiányzik
            return {"feladatok": [{"leiras": "A", "task_idk": idk[:-1]}, {"leiras": "B", "task_idk": []},
                                  {"leiras": "C", "task_idk": []}], "fekek": fek, "teendo_szoveg": "t"}
        harmad = max(1, len(idk) // 3)
        return {"feladatok": [{"leiras": "Írásos ügyek", "task_idk": idk[:harmad], "csatorna": "irasos"},
                              {"leiras": "Telefon", "task_idk": idk[harmad:2 * harmad], "csatorna": "telefon"},
                              {"leiras": "Egyéb", "task_idk": idk[2 * harmad:], "emberi_mag": True}],
                "fekek": fek, "teendo_szoveg": "Fejlődj a nehéz esetek felé."}

    monkeypatch.setattr(pipeline, "claude_kerdes", hamis_claude)
    pipeline.main(["--mappa", str(munka), "csoportosit", "--csak", "ugyfelszolgalati-munkatars"])

    assert hivasok[0] is None and "nem pontosan egyszer" in hivasok[1]
    a = json.loads((munka / "atnezes/ugyfelszolgalati-munkatars.json").read_text(encoding="utf-8"))
    assert [g["csatorna"] for g in a["csoportok"]] == ["irasos", "telefon", None]
    assert a["csoportok"][2]["emberi_mag"] is True


def test_ervenytelen_fek_elutasitva():
    c = {"feladatok": [{"leiras": "a", "task_idk": ["1"]}, {"leiras": "b", "task_idk": ["2"]},
                       {"leiras": "c", "task_idk": ["3"]}],
         "fekek": {"fizikai": {"ertek": 5}, "felelosseg": {"ertek": 1}, "szabalyozas": {"ertek": 1}, "bizalom": {"ertek": 1}}}
    with pytest.raises(ValueError, match="fizikai"):
        pipeline.ellenoriz_csoportositas(c, {"1", "2", "3"})
