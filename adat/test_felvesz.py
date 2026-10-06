import pandas as pd
import pytest

import felvesz
import pipeline


def test_slug_es_nev():
    assert felvesz.slugosit("Ügyfélszolgálati munkatárs") == "ugyfelszolgalati-munkatars"
    assert felvesz.slugosit("Lakatos, szerkezetlakatos") == "lakatos-szerkezetlakatos"
    nev, extra = felvesz.tisztit_nev("Számviteli (könyvelői) ügyintéző")
    assert nev == "Számviteli ügyintéző" and extra == ["könyvelői"]
    nev, extra = felvesz.tisztit_nev("Gazdasági szervezet vezetője (igazgató, elnök, ügyvezető igazgató)")
    assert nev == "Gazdasági szervezet vezetője" and extra == ["igazgató", "elnök", "ügyvezető igazgató"]
    foglalt = {"konyvelo"}
    assert felvesz.egyedi_slug("Könyvelő", "2411", foglalt) == "konyvelo-2411"


def test_gyujto_kihagyva_es_feor_szint():
    df = pd.DataFrame({"FEOR-08": ["24", "2411", "2419", "7212"],
                       "Megnevezés": ["Csoport", "Könyvelő", "Máshova nem sorolt pénzügyi szakember", "Hegesztő"]})
    assert [k for k, _ in felvesz.feor_lista(df, pipeline.oszlop)] == ["2411", "2419", "7212"]
    assert felvesz.gyujto_e("Máshova nem sorolt pénzügyi szakember") and not felvesz.gyujto_e("Hegesztő")


def test_hasonlo_cimek():
    cimek = {"13-2011.00": "Accountants and Auditors", "47-2111.00": "Electricians", "11-1021.00": "General Managers"}
    assert felvesz.hasonlo_cimek("Accountant", cimek, 1)[0][0] == "13-2011.00"
    assert felvesz.hasonlo_cimek("Electrician", cimek, 1)[0][0] == "47-2111.00"


def _fajlok(tmp_path):
    (tmp_path / "feor.csv").write_text("FEOR-08,Megnevezés\n2411,Könyvelő\n7412,Villanyszerelő\n"
                                       "2419,Máshova nem sorolt szakember\n9999,Ismeretlen foglalkozás\n", encoding="utf-8")
    (tmp_path / "feor_isco.csv").write_text("FEOR-08,ISCO-08\n2411,2411\n7412,7411\n", encoding="utf-8")
    (tmp_path / "isco_soc.csv").write_text("ISCO-08 Code,2010 SOC Code\n2411,13-2011\n7411,47-2111\n", encoding="utf-8")
    (tmp_path / "onet.csv").write_text(
        "O*NET-SOC Code,Title,Task ID,Task,Task Type\n"
        "13-2011.00,Accountants and Auditors,1,x,Core\n47-2111.00,Electricians,2,y,Core\n"
        "11-1021.00,General Managers,3,z,Core\n", encoding="utf-8")


class Args:
    def __init__(self, tmp, **kw):
        self.feor, self.feor_szint = str(tmp / "feor.csv"), 4
        self.feor_isco, self.isco_soc = str(tmp / "feor_isco.csv"), str(tmp / "isco_soc.csv")
        self.onet_feladatok, self.meglevo = str(tmp / "onet.csv"), None
        self.kimenet, self.biztos_kuszob, self.limit = str(tmp / "ki.csv"), 0.75, None
        self.nincs_claude, self.modell = False, "teszt"
        self.__dict__.update(kw)


def hamis_claude(rendszer, uzenet, modell, cache_dir):
    import json
    if rendszer == felvesz.PROMPT_1:
        return {"munkakorok": [{"feor": x["feor"], "rovid_nev": x["nev"], "en": {"2411": "Accountant", "7412": "Electrician"}.get(x["feor"], "Thing"),
                                "aliasok": ["könyvelő bácsi", "számlázó"] if x["feor"] == "2411" else ["szerelő"],
                                "tobbes": "könyvelők" if x["feor"] == "2411" else "villanyszerelők"}
                               for x in json.loads(uzenet.split("\n\n")[0])]}
    out = []
    for x in json.loads(uzenet.split("\n\n")[0]):
        kodok = [x["jeloltek"][0]["kod"]] if x["feor"] == "2411" else (["11-1021.00"] if x["feor"] == "7412" else [])
        out.append({"feor": x["feor"], "kodok": kodok, "bizonyossag": 0.9 if x["feor"] == "2411" else 0.6, "indoklas": "teszt"})
    return {"valasztas": out}


def test_felvesz_teljes(tmp_path):
    _fajlok(tmp_path)
    r = felvesz.felvesz(Args(tmp_path), tmp_path, pipeline.beolvas, pipeline.oszlop, print, hivas=hamis_claude)
    df = pd.read_csv(tmp_path / "ki.csv", dtype=str, keep_default_na=False, encoding="utf-8-sig")
    assert list(df.slug) == ["konyvelo", "villanyszerelo", "ismeretlen-foglalkozas"]   # gyűjtő kihagyva
    k = df.set_index("slug")
    assert k.loc["konyvelo", "onet_soc_kodok"] == "13-2011.00" and k.loc["konyvelo", "statusz"] == "auto"
    assert k.loc["konyvelo", "tobbes"] == "könyvelők" and "számlázó" in k.loc["konyvelo", "aliasok"]
    assert k.loc["villanyszerelo", "statusz"] == "atnezendo" and k.loc["villanyszerelo", "isco_kod"] == "7411"
    assert r["statusz"]["auto"] == 1 and len(r["gyujtokategoria_kihagyva"]) == 1
    # a pipeline be tudja olvasni, a többes szám átmegy
    mk = pipeline.betolt_munkakorok(tmp_path / "ki.csv")
    assert mk[0]["tobbes"] == "könyvelők" and mk[0]["soc_kodok"] == ["13-2011.00"]


def test_felvesz_nincs_claude_es_meglevo(tmp_path):
    _fajlok(tmp_path)
    (tmp_path / "regi.csv").write_text("slug,nev,aliasok,feor_kod,isco_kod,onet_soc_kodok,heti_ora,indexelheto\n"
                                       "konyvelo,Könyvelő,,2411,,13-2011.00,40,true\n", encoding="utf-8")
    felvesz.felvesz(Args(tmp_path, nincs_claude=True, meglevo=str(tmp_path / "regi.csv")), tmp_path,
                    pipeline.beolvas, pipeline.oszlop, lambda m: None)
    df = pd.read_csv(tmp_path / "ki.csv", dtype=str, keep_default_na=False, encoding="utf-8-sig")
    assert list(df.slug)[0] == "konyvelo" and df.iloc[0]["indexelheto"] == "true"   # a régi sor érintetlen
    assert (df.feor_kod == "2411").sum() == 1                                        # nincs duplikáció
    assert df.set_index("slug").loc["villanyszerelo", "forras"] == "keresztkapcsolat"


def test_hibas_valasz_ujraprobalas(tmp_path):
    _fajlok(tmp_path)
    hivasok = []

    def rossz_aztan_jo(r, u, m, c):
        hivasok.append(1)
        if r == felvesz.PROMPT_2 and len(hivasok) < 3:
            return {"valasztas": [{"feor": "2411", "kodok": ["99-9999.00"], "bizonyossag": 1, "indoklas": ""}]}
        return hamis_claude(r, u, m, c)

    felvesz.felvesz(Args(tmp_path), tmp_path, pipeline.beolvas, pipeline.oszlop, lambda m: None, hivas=rossz_aztan_jo)
    df = pd.read_csv(tmp_path / "ki.csv", dtype=str, keep_default_na=False, encoding="utf-8-sig")
    assert df.set_index("slug").loc["konyvelo", "onet_soc_kodok"] == "13-2011.00"


def test_task_id_pont_nulla(tmp_path):
    assert pipeline.norm_id("8823.0") == "8823" and pipeline.norm_id(" 8823 ") == "8823"
    (tmp_path / "k.tsv").write_text("Task ID\tTask\tgpt4_exposure\n8823.0\tDo x.\tE1\n8824.0\tDo y.\tE0\n", encoding="utf-8")
    id_map, _, oszlop = pipeline.betolt_kitettseg(str(tmp_path / "k.tsv"), "gpt4_exposure")
    assert id_map["8823"][0] == 1.0 and id_map["8824"][0] == 0.0


def test_bls_fejlec_es_pontnulla(tmp_path):
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    for sor in (["Bureau of Labor Statistics"], ["Questions: soc@bls.gov"], [],
                ["ISCO-08 Code", "ISCO-08 Title EN", "2010 SOC Code", "2010 SOC Title"],
                [2411.0, "Accountants", "13-2011", "Accountants and Auditors"]):
        ws.append(sor)
    wb.save(tmp_path / "bls.xlsx")
    df = felvesz.beolvas_fejleces(tmp_path / "bls.xlsx", (("isco", "code"), ("soc", "code")), pipeline.beolvas)
    _, i2s = felvesz.kereszt_kapcsolat(None, df, pipeline.oszlop)
    assert i2s == {"2411": ["13-2011"]}


def test_gyujto_pontos():
    assert felvesz.gyujto_e("Egyéb ügyintéző") and felvesz.gyujto_e("Egyéb, máshova nem sorolható mérnök")
    assert not felvesz.gyujto_e("Borász és egyéb szeszesital-gyártó, szikvízkészítő")
    assert not felvesz.gyujto_e("Reklám-, PR- és egyéb kommunikációs tevékenységet folytató egység vezetője")


def test_rovid_nev_slug_es_hivatalos_nev_alias(tmp_path):
    _fajlok(tmp_path)
    (tmp_path / "feor.csv").write_text('FEOR-08,Megnevezés\n7412,"Építményvillamossági szerelő (villanyszerelő, erősáramú)"\n', encoding="utf-8")

    def sajat(r, u, m, c):
        v = hamis_claude(r, u, m, c)
        for x in v.get("munkakorok", []):
            x["rovid_nev"] = "villanyszerelő"
        return v

    felvesz.felvesz(Args(tmp_path), tmp_path, pipeline.beolvas, pipeline.oszlop, lambda m: None, hivas=sajat)
    df = pd.read_csv(tmp_path / "ki.csv", dtype=str, keep_default_na=False, encoding="utf-8-sig")
    r = df.iloc[0]
    assert r.slug == "villanyszerelo" and r.nev == "Villanyszerelő"        # nagy kezdőbetű, ASCII slug
    assert r.feor_nev == "Építményvillamossági szerelő"
    aliasok = r.aliasok.split(";")
    assert "Építményvillamossági szerelő" in aliasok and "erősáramú" in aliasok
    assert "villanyszerelő" not in [a.lower() for a in aliasok if a.lower() == r.nev.lower()]   # a megjelenített név nem alias


def test_kodok_szuro_es_duplikalt_nev(tmp_path):
    assert felvesz.kodok_beolvas("2411, 7412 9999") == ["2411", "7412", "9999"]
    (tmp_path / "k.txt").write_text("# fejléc 1234\n2411  # Könyvelő\n7412\n", encoding="utf-8")
    assert felvesz.kodok_beolvas(str(tmp_path / "k.txt")) == ["2411", "7412"]
    _fajlok(tmp_path)
    felvesz.felvesz(Args(tmp_path, kodok="7412, 2419"), tmp_path, pipeline.beolvas, pipeline.oszlop,
                    lambda m: None, hivas=hamis_claude)
    df = pd.read_csv(tmp_path / "ki.csv", dtype=str, keep_default_na=False, encoding="utf-8-sig")
    assert list(df.feor_kod) == ["7412"]            # a gyűjtő (2419) kimarad, a többi nincs kérve


def test_felulirasok(tmp_path):
    _fajlok(tmp_path)
    (tmp_path / "fel.csv").write_text("feor_kod,nev,tobbes,onet_soc_kodok,aliasok\n"
                                      "7412,Villanyszerelő mester,villanyszerelő mesterek,47-2111.00,mester\n", encoding="utf-8")
    felvesz.felvesz(Args(tmp_path, kodok="2411,7412", felulirasok=str(tmp_path / "fel.csv")), tmp_path,
                    pipeline.beolvas, pipeline.oszlop, lambda m: None, hivas=hamis_claude)
    df = pd.read_csv(tmp_path / "ki.csv", dtype=str, keep_default_na=False, encoding="utf-8-sig").set_index("feor_kod")
    v = df.loc["7412"]
    assert v.slug == "villanyszerelo-mester" and v.nev == "Villanyszerelő mester" and v.tobbes == "villanyszerelő mesterek"
    assert v.statusz == "kezi" and v.onet_soc_kodok == "47-2111.00" and v.aliasok.split(";")[0] == "mester"
    assert df.loc["2411"].statusz == "auto"          # amihez nincs felülírás, az változatlan
