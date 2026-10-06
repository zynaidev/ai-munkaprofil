import pandas as pd
import pytest

import felvesz
import pipeline


def test_slug_es_nev():
    assert felvesz.slugosit("Ügyfélszolgálati munkatárs") == "ugyfelszolgalati-munkatars"
    assert felvesz.slugosit("Lakatos, szerkezetlakatos") == "lakatos-szerkezetlakatos"
    nev, extra = felvesz.tisztit_nev("Számviteli (könyvelői) ügyintéző")
    assert nev == "Számviteli ügyintéző"
    assert "Számviteli könyvelői ügyintéző" in extra and "könyvelői" in extra
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
        return {"munkakorok": [{"feor": x["feor"], "en": {"2411": "Accountant", "7412": "Electrician"}.get(x["feor"], "Thing"),
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
