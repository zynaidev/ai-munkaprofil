# AI-Munkaprofil – oldalstruktúra és copy

Hangnem: tegező, egyenes, nem riogató. Nem azt mondjuk, hogy „elveszíted a munkád”, hanem hogy „így változik a munkád, és ezt teheted”.
Kapcsos zárójelben: dinamikus érték. Szögletes zárójelben: szerkesztői megjegyzés, nem jelenik meg.

---

## 1. KEZDŐOLDAL – `teszt.zynai.hu`

### Hero
**Felcím:** AI-Munkaprofil · ingyenes, 1 perc

**Főcím:** Elveszi az AI a munkádat?
**Alcím:** Nem egy riogató százalékot kapsz. Megmutatjuk, hogy a heti 40 órádból mennyit vesz át az AI, mennyit gyorsít fel, és mi marad a te dolgod – kutatási adatok alapján.

**Kereső placeholder:** Írd be a munkakörödet, pl. könyvelő, ügyfélszolgálatos, grafikus…
**Gomb:** Mutasd a profilom
**Alatta, apró:** Nem kell regisztráció. Nem tárolunk semmit, amit beírsz, hacsak nem te jelzed nekünk.

[Ha nincs találat a listában:]
**Szöveg:** Nem találjuk pontosan ezt a munkakört. Megkeressük a hozzá legközelebb állót.
**Gomb:** Keresd meg a legközelebbit

### Négy szint (rövid előzetes)
**Szekciócím:** Te melyik típus vagy?
[Szint szerint emelkedő sorrendben. Név, leírás, szint és szín egyetlen forrása: `lib/tipusok.ts`.]

- **1. szint · Védett** – Az AI hatása jelenleg korlátozott.
- **2. szint · Felerősödő** – Az AI hatékonyabbá teszi a munkavégzést.
- **3. szint · Átalakuló** – A feladatok és a szerepkör érdemben megváltoznak.
- **4. szint · Automatizálódó** – A munkafeladatok jelentős részét AI végezheti.

### Hogyan számolunk?
**Szekciócím:** Nem jóslat. Kutatás.

1. **Feladatokra bontjuk a munkádat.** Egy munkakör nem egy dolog: tucatnyi feladatból áll, eltérő időaránnyal.
2. **Megnézzük, mit tud ma az AI.** Nemzetközi kutatások feladatszintű adatai alapján: mit tud elvégezni egyedül, és miben csak segít.
3. **Figyelembe vesszük, mi fékez.** Felelősség, szabályozás, ügyfélbizalom, fizikai jelenlét – ezek miatt a technikailag lehetséges nem történik meg azonnal.

**Link:** Részletes módszertan →

### Záró sáv
**Főcím:** Vezetőként a csapatod érdekel?
**Szöveg:** Felvisszük a cégetek munkaköreit, és megmutatjuk, hol szabadul fel a legtöbb idő AI-val – és hol nem éri meg hozzányúlni.
**Gomb:** Csapatelemzést kérek

**Lábléc:** Készítette a ZynAI · AI-integráció magyar KKV-knak · zynai.hu
**Lábléc, apró:** Az eredmények becslések kutatási adatok alapján, nem egyéni előrejelzések. Adatverzió: {adatVerzio}

---

## 2. EREDMÉNYOLDAL – `teszt.zynai.hu/{slug}`

### Felső blokk (hero – ez kerül a megosztási képre is)
**Címke:** AI-Munkaprofil
**H1:** {nev} és az AI: mi változik a munkában?
**Szint:** {szint}. szint · 4-ből [4 szegmenses szintjelző; képernyőolvasónak: „{szint}. szint a 4-ből: {tipus}”]
**Típus (nagy):** {tipus}
**Típusmondat:** a szint leírása (lásd a kezdőoldali „Négy szint” listát):
- 1. szint · Védett: Az AI hatása jelenleg korlátozott.
- 2. szint · Felerősödő: Az AI hatékonyabbá teszi a munkavégzést.
- 3. szint · Átalakuló: A feladatok és a szerepkör érdemben megváltoznak.
- 4. szint · Automatizálódó: A munkafeladatok jelentős részét AI végezheti.

### A heti 40 órád
**Szekciócím:** Mi történik a heti {hetiOra} órával?
[Vízszintes sáv három színnel]
- **{kivalthato} óra** – kiváltható: az AI egyedül is el tudja végezni, neked ellenőrizned kell
- **{felgyorsul} óra** – felgyorsul: továbbra is te csinálod, de AI-val gyorsabban
- **{emberi} óra** – emberi mag: ezt az AI érdemben nem tudja

**Kiemelés:** A felgyorsuló munkán kb. **{visszanyertOra} órát nyerhetsz vissza hetente.**

### Mikor?
**Szekciócím:** Nem holnap. De nem is soha.
- **Már ma:** {ma} óra – létező, olcsó eszközökkel megoldható
- **1–3 éven belül:** {kozep} óra – a technológia van, a bevezetés lassabb
- **5+ év / bizonytalan:** {tavoli} óra

**Megjegyzés:** A fékek figyelembevételével ma reálisan kb. **{gyakorlatbanMaKivalthato} óra** érintett.

### Mi fékez?
**Szekciócím:** Ami lassítja – vagy megállítja
[Négy sáv 0–3 skálán, mindegyik mellett a fekIndoklas szövege]
- Fizikai jelenlét
- Felelősség
- Szabályozás
- Ügyfélbizalom

### Feladatonként
**Szekciócím:** A munkád, feladatokra bontva
[Feladatlista: név, óra, horizont címke, kis sáv. Az emberiMag feladatok kiemelve:]
**Címke az emberi mag feladatokon:** Ez marad – és felértékelődik

### Finomítás
**Szekciócím:** Pontosítsd a profilod
**Szöveg:** Ez a munkakör átlaga. Két kérdéssel személyesebb lesz.
[Csak akkor jelenik meg, ha a munkakörnek van csatornához kötött feladata]
- **Kérdés:** Mennyit dolgozol telefonon? — Szinte soha / Néha / A munkám nagy része
- **Kérdés:** Mennyit dolgozol személyesen, ügyfelekkel? — Szinte soha / Néha / A munkám nagy része
**Visszajelzés finomítás után:** Frissítettük a te munkád alapján.

### Teendő
**Szekciócím:** Mit tegyél most?
{teendo}

### Megosztás
**Szekciócím:** Kíváncsi vagy, a kollégáid hova esnek?
**Gombok:** Megosztom Facebookon · Megosztom LinkedInen · Link másolása
**Másolás visszajelzés:** Link vágólapon.

**Előre megírt megosztási szöveg:**
„Megcsináltam az AI-Munkaprofilt: {tipus} vagyok ({szint}. szint a 4-ből). A heti {hetiOra} órámból {kivalthato} óra kiváltható, {emberi} óra marad csak az enyém. Te hova esel?”

[Példák az illusztratív fejlesztői adatokkal:]
- „Megcsináltam az AI-Munkaprofilt: Automatizálódó vagyok (4. szint a 4-ből). A heti 40 órámból 19 óra kiváltható, 11 óra marad csak az enyém. Te hova esel?”
- „Megcsináltam az AI-Munkaprofilt: Védett vagyok (1. szint a 4-ből). A heti 40 órámból 5 óra kiváltható, 29 óra marad csak az enyém. Te hova esel?”

### Lead – B2C
**Szekciócím:** Kérd el a részletes riportot
**Szöveg:** Feladatonkénti bontás, milyen AI-eszközökkel kezdj, és mely készségeidet érdemes erősíteni. E-mailben küldjük.
**Mező:** E-mail címed
**Checkbox:** Hozzájárulok, hogy a ZynAI a riportot és kapcsolódó tájékoztatást e-mailben küldje. Bármikor leiratkozhatok. [link: Adatkezelési tájékoztató]
**Gomb:** Kérem a riportot
**Sikeres küldés:** Úton van. Nézd meg a postafiókodat (és a promóciók mappát is).
**Hiba:** Valami elakadt. Próbáld újra pár perc múlva.

### Lead – B2B
**Főcím:** A csapatod profilja érdekel?
**Szöveg:** Cégvezetőként nem egy munkakör számít, hanem az egész csapat. Megmutatjuk, hol szabadul fel a legtöbb idő, és hol nem éri meg AI-t bevezetni.
**Gomb:** Csapatelemzést kérek → [zynai.hu konzultációs oldal vagy űrlap]

### Disclaimer (az oldal alján)
Az eredmény becslés: nemzetközi kutatások feladatszintű adatait fordítottuk le magyar munkakörökre. Egy adott munkahely ettől jelentősen eltérhet. Nem egyéni előrejelzés, és nem karrier-tanácsadás. Részletek a módszertani oldalon.

---

## 3. MÓDSZERTAN – `teszt.zynai.hu/modszertan`

**Főcím:** Honnan jönnek a számok?
**Bevezető:** Az átláthatóság a lényeg. Itt leírjuk, mit mérünk, honnan vesszük az adatot, és mit nem tud a modell.

**Szekciók:**
1. **Mit mérünk?** – Kiváltás, felerősítés, emberi mag. Miért nem egyetlen százalék.
2. **Az adatforrások** – O*NET feladatadatbázis; „GPTs are GPTs” (OpenAI, UPenn) feladatszintű kitettség; Anthropic Economic Index kiváltás/felerősítés arányok. Linkkel mindegyikre.
3. **Hogyan lesz amerikai adatból magyar munkakör?** – FEOR → ISCO → SOC megfeleltetés, a feladatok összevonása, kézi ellenőrzés.
4. **A képlet** – A számítás lépései és a típusok küszöbei. [a README 2. fejezetéből, közérthetően]
5. **Fékek** – A négy tényező és a 0–3 skála jelentése.
6. **Korlátok** – Amerikai feladatleírások; az időarány becslés, nem mérés; a technológia gyorsabban változik, mint az adat; az eredmény átlag, nem a te munkahelyed.
7. **Frissítés** – Negyedévente frissítjük. Jelenlegi adatverzió: {adatVerzio}.

---

## 4. MEGOSZTÁSI KÉP (OG, 1200×630)
- Bal felül: ZynAI logó
- Felcím: {nev}
- Szint: {szint}. szint · 4-ből (szintjelzővel)
- Nagy: {tipus}
- Sáv: {kivalthato} ó kiváltható · {felgyorsul} ó felgyorsul · {emberi} ó emberi
- Alul: Te melyik vagy? → teszt.zynai.hu

**OG cím:** {nev}: {tipus} | AI-Munkaprofil
**OG leírás:** A heti {hetiOra} órából {kivalthato} óra kiváltható, {emberi} óra emberi mag. Nézd meg a saját munkakörödet!

## 5. SEO (csak az indexelhető munkaköröknél)
**Title:** Elveszi az AI a {nev_targyeset} munkáját? | AI-Munkaprofil
[A tárgyeset kézzel megadandó mező, pl. „könyvelők”, „fordítók”]
**Meta description:** {nev}: {kivalthato} óra kiváltható, {felgyorsul} óra felgyorsul, {emberi} óra marad emberi. Kutatási adatokon alapuló, feladatonkénti elemzés.
**H1:** {nev} és az AI: mi változik a munkában?
