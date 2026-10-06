-- AI-Munkaprofil – PostgreSQL séma (MVP)
-- Minden eredmény előre számolt adatból jön; futásidőben nincs LLM-hívás.

-- Munkakörök (a kereső és az URL-ek alapja)
CREATE TABLE munkakor (
  id               SERIAL PRIMARY KEY,
  slug             TEXT UNIQUE NOT NULL,          -- pl. 'ugyfelszolgalati-munkatars'
  nev              TEXT NOT NULL,                 -- megjelenített név
  aliasok          TEXT[] NOT NULL DEFAULT '{}',  -- keresőhöz: 'call center', 'ügyfélszolgálatos'
  feor_kod         TEXT,                          -- FEOR-08 (KSH táblából)
  isco_kod         TEXT,                          -- ISCO-08
  soc_kodok        TEXT[] NOT NULL DEFAULT '{}',  -- US SOC (több is lehet)
  heti_ora         NUMERIC(4,1) NOT NULL DEFAULT 40,
  -- Fékezőerők, 0–3 skála (0 = nincs fék, 3 = erős fék)
  fek_fizikai      SMALLINT NOT NULL CHECK (fek_fizikai BETWEEN 0 AND 3),
  fek_felelosseg   SMALLINT NOT NULL CHECK (fek_felelosseg BETWEEN 0 AND 3),
  fek_szabalyozas  SMALLINT NOT NULL CHECK (fek_szabalyozas BETWEEN 0 AND 3),
  fek_bizalom      SMALLINT NOT NULL CHECK (fek_bizalom BETWEEN 0 AND 3),
  teendo_szoveg    TEXT,                          -- Claude-dal generált, kézzel átnézett
  indexelheto      BOOLEAN NOT NULL DEFAULT FALSE, -- csak a top 30–50 SEO-oldal TRUE
  adat_verzio      TEXT NOT NULL,                 -- pl. '2026-Q4'
  frissitve        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feladatok munkakörönként
CREATE TABLE feladat (
  id               SERIAL PRIMARY KEY,
  munkakor_id      INT NOT NULL REFERENCES munkakor(id) ON DELETE CASCADE,
  leiras           TEXT NOT NULL,                 -- magyar, rövid
  onet_task_id     TEXT,                          -- visszakövethetőség
  ido_arany        NUMERIC(5,4) NOT NULL CHECK (ido_arany > 0),  -- munkaidő-részarány; munkakörönként normalizáljuk
  kitettseg        NUMERIC(4,3) NOT NULL CHECK (kitettseg BETWEEN 0 AND 1),   -- GPTs are GPTs alapján
  kivaltas_arany   NUMERIC(4,3) NOT NULL CHECK (kivaltas_arany BETWEEN 0 AND 1), -- Economic Index: automation / (automation+augmentation)
  horizont         TEXT NOT NULL CHECK (horizont IN ('ma', '1-3ev', '5ev+')),
  csatorna         TEXT CHECK (csatorna IN ('telefon', 'irasos', 'szemelyes')), -- finomító kérdésekhez, opcionális
  emberi_mag       BOOLEAN NOT NULL DEFAULT FALSE -- kiemelés az eredményoldalon: "ez marad és felértékelődik"
);

CREATE INDEX feladat_munkakor_idx ON feladat(munkakor_id);

-- Keresőhöz: könnyű nézet, csak nevek (pár KB a kliensnek)
CREATE VIEW munkakor_kereso AS
  SELECT slug, nev, aliasok FROM munkakor ORDER BY nev;

-- Szabad szöveges besorolás cache-e (Claude-hívás csak cache-miss esetén)
CREATE TABLE besorolas_cache (
  bemenet_hash     TEXT PRIMARY KEY,              -- normalizált bemenet SHA-256, a nyers szöveget nem tároljuk
  munkakor_id      INT REFERENCES munkakor(id),
  letrehozva       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead (GDPR-hozzájárulással)
CREATE TABLE lead (
  id               SERIAL PRIMARY KEY,
  email            TEXT NOT NULL,
  munkakor_id      INT REFERENCES munkakor(id),
  tipus            TEXT NOT NULL CHECK (tipus IN ('b2c_riport', 'b2b_csapat')),
  hozzajarulas_at  TIMESTAMPTZ NOT NULL,
  letrehozva       TIMESTAMPTZ NOT NULL DEFAULT now()
);
