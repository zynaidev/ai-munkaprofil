# public/data – ILLUSZTRATÍV FEJLESZTŐI ADAT

Az itt lévő JSON-fájlok **nem valós kutatási adatok**. Arra valók, hogy legyen min fejleszteni, amíg a valós adat elkészül.

- `ugyfelszolgalati-munkatars.json`, `szoftverfejleszto.json`, `villanyszerelo.json`, `konyvelo.json`: a `lib/scoring.test.ts` négy mintamunkaköre. A feladatok számai onnan származnak, a `fekIndoklas` és a `teendo` szövegek kézzel írt példák.
- `kereso.json`: a négy munkakör keresőindexe (slug, név, aliasok az `adat/munkakorok.csv`-ből), magyar ábécérendben.

A formátum megegyezik az `adat/pipeline.py export` kimenetével. Minden fájlban `"adatVerzio": "fejlesztoi"` szerepel.

A 17. lépésben (pipeline futtatása) a valós export felülírja ezeket a fájlokat. Utána ezt a README-t is töröld vagy írd át.
