"""Kiírja a forras/ mappa fájljainak oszlopfejléceit és első sorait (a pipeline-paraméterek beállításához).
Futtatás az adat mappából:  python fejlec.py
"""
import sys
from pathlib import Path

import pandas as pd

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
mappa = Path(__file__).resolve().parent / "forras"
fajlok = [
    mappa / "automation_vs_augmentation_by_task.csv",
    mappa / "full_labelset.tsv",
    mappa / "ISCO_SOC_Crosswalk.xls",
    *sorted((mappa / "onet").rglob("Task Statements.xlsx")),
    *sorted((mappa / "onet").rglob("Task Ratings.xlsx")),
]
for f in fajlok:
    print("=" * 70, f.name, sep="\n")
    if not f.exists():
        print("  HIÁNYZIK")
        continue
    try:
        if f.suffix == ".xls":
            xl = pd.ExcelFile(f)
            print("  lapok:", xl.sheet_names)
            df = xl.parse(xl.sheet_names[0], dtype=str, nrows=6, header=None)
            print(df.to_string(max_colwidth=40))
            continue
        if f.suffix == ".xlsx":
            df = pd.read_excel(f, dtype=str, nrows=3)
        else:
            df = pd.read_csv(f, sep="\t" if f.suffix == ".tsv" else ",", dtype=str, nrows=3,
                             encoding="utf-8-sig", keep_default_na=False)
        print("  oszlopok:", list(df.columns))
        print(df.to_string(max_colwidth=40))
    except Exception as e:  # noqa: BLE001
        print("  HIBA:", e)
