"""Áttekintés az atnezes/*.json fájlokról egyetlen olvasható fájlban, és tömeges jóváhagyás.

  python attekintes.py                       → attekintes.md (nyisd meg VS Code-ban, görgesd végig)
  python attekintes.py --jovahagy mind       → mindegyik "ellenorizve": true
  python attekintes.py --jovahagy konyvelo villanyszerelo   → csak ezek
  python attekintes.py --visszavon konyvelo  → "ellenorizve": false
"""
import argparse
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
GYOKER = Path(__file__).resolve().parent


def szazalek(x) -> str:
    return f"{round(100 * x):>3}%"


def szakasz(a: dict) -> str:
    sorok = [f"## {a['nev']}  (`{a['slug']}`, ellenőrizve: {'igen' if a.get('ellenorizve') else 'NEM'})", ""]
    sorok.append("SOC: " + ", ".join(a.get("soc_kodok", [])) + f" · heti óra: {a.get('heti_ora')}")
    sorok += ["", "| Feladatcsoport | idő | kitettség | kiváltás | horizont | emberi mag |", "|---|---|---|---|---|---|"]
    for g in a.get("_szamitott_elonezet", []):
        sorok.append(f"| {g['leiras']} | {szazalek(g['idoArany'])} | {g['kitettseg']:.2f} | {g['kivaltasArany']:.2f} | "
                     f"{g['horizont']} | {'igen' if g['emberiMag'] else ''} |")
    sorok += ["", "Fékek: " + " · ".join(f"{n} {v['ertek']}" for n, v in a["fekek"].items())]
    for n, v in a["fekek"].items():
        sorok.append(f"- {n} ({v['ertek']}): {v.get('indoklas', '')}")
    sorok += ["", f"Teendő: {a.get('teendo_szoveg', '')}"]
    for f in a.get("_figyelmeztetesek", []):
        sorok.append(f"⚠ {f}")
    jel = [g["leiras"] for g in a.get("_szamitott_elonezet", []) if "FORDÍTANDÓ" in g["leiras"]]
    if jel or "KÉZZEL KITÖLTENDŐ" in json.dumps(a, ensure_ascii=False):
        sorok.append("⚠ KITÖLTETLEN / FORDÍTANDÓ mezők vannak")
    return "\n".join(sorok) + "\n"


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--jovahagy", nargs="+", help="slugok vagy 'mind'")
    p.add_argument("--visszavon", nargs="+")
    p.add_argument("--mappa", default=str(GYOKER / "atnezes"))
    args = p.parse_args()
    fajlok = sorted(Path(args.mappa).glob("*.json"))
    if not fajlok:
        sys.exit("Nincs fájl az atnezes/ mappában. Előbb: python pipeline.py csoportosit")

    for kapcsolo, ertek in (("jovahagy", True), ("visszavon", False)):
        slugok = getattr(args, kapcsolo)
        if not slugok:
            continue
        db = 0
        for f in fajlok:
            a = json.loads(f.read_text(encoding="utf-8"))
            if "mind" in slugok or a["slug"] in slugok:
                if "FORDÍTANDÓ" in json.dumps(a, ensure_ascii=False) and ertek:
                    print(f"  ⚠ {a['slug']}: kitöltetlen mezők maradtak, nem hagyom jóvá.")
                    continue
                a["ellenorizve"] = ertek
                f.write_text(json.dumps(a, ensure_ascii=False, indent=2), encoding="utf-8")
                db += 1
        print(f"{db} fájl → ellenorizve={ertek}")
        return

    kimenet = GYOKER / "attekintes.md"
    reszek = [szakasz(json.loads(f.read_text(encoding="utf-8"))) for f in fajlok]
    kimenet.write_text("# Átnézési összefoglaló\n\n" + "\n---\n\n".join(reszek), encoding="utf-8")
    print(f"✓ {len(fajlok)} munkakör → {kimenet}")


if __name__ == "__main__":
    main()
