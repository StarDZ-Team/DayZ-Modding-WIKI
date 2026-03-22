# 8.7. fejezet: Publikálás a Steam Workshopra

[Főoldal](../README.md) | [<< Előző: Hibakeresés és tesztelés](06-debugging-testing.md) | **Publikálás a Steam Workshopra** | [Következő: HUD overlay készítése >>](08-hud-overlay.md)

---

> **Összefoglaló:** A modod elkészült, tesztelve van és készen áll a világra. Ez az útmutató végigvezet a teljes publikálási folyamaton az elejétől a végéig: a mod mappa előkészítése, PBO-k aláírása a többjátékos kompatibilitáshoz, Steam Workshop elem létrehozása, feltöltés a DayZ Tools-on vagy parancssorból, és frissítések karbantartása az idő múlásával. A végére a modod élőben lesz a Workshopon és bárki játszhat vele.

---

## Tartalomjegyzék

- [Bevezetés](#bevezetés)
- [Publikálás előtti ellenőrzőlista](#publikálás-előtti-ellenőrzőlista)
- [1. lépés: A mod mappa előkészítése](#1-lépés-a-mod-mappa-előkészítése)
- [2. lépés: Teljes mod.cpp írása](#2-lépés-teljes-modcpp-írása)
- [3. lépés: Logó és előnézeti képek előkészítése](#3-lépés-logó-és-előnézeti-képek-előkészítése)
- [4. lépés: Kulcspár generálása](#4-lépés-kulcspár-generálása)
- [5. lépés: PBO-k aláírása](#5-lépés-pbo-k-aláírása)
- [6. lépés: Publikálás a DayZ Tools Publisherrel](#6-lépés-publikálás-a-dayz-tools-publisherrel)
- [Publikálás parancssorból (alternatíva)](#publikálás-parancssorból-alternatíva)
- [A mod frissítése](#a-mod-frissítése)
- [Verziókezelés legjobb gyakorlatai](#verziókezelés-legjobb-gyakorlatai)
- [Workshop oldal legjobb gyakorlatai](#workshop-oldal-legjobb-gyakorlatai)
- [Útmutató szerver üzemeltetőknek](#útmutató-szerver-üzemeltetőknek)
- [Terjesztés a Workshop nélkül](#terjesztés-a-workshop-nélkül)
- [Gyakori problémák és megoldások](#gyakori-problémák-és-megoldások)
- [A teljes mod életciklus](#a-teljes-mod-életciklus)
- [Következő lépések](#következő-lépések)

---

## Bevezetés

A Steam Workshopra való publikálás a DayZ modolási út utolsó lépése. Minden, amit az előző fejezetekben tanultál, itt csúcsosodik ki. Amint a modod a Workshopon van, bármely DayZ játékos feliratkozhat, letöltheti és játszhat vele. Ez a fejezet a teljes folyamatot lefedi: a mod előkészítése, PBO-k aláírása, feltöltés és frissítések karbantartása.

---

## Publikálás előtti ellenőrzőlista

Mielőtt bármit feltöltenél, menj végig ezen a listán. Az elemek kihagyása okozza a leggyakoribb publikálás utáni fejfájásokat.

- [ ] Minden funkció tesztelve **dedikált szerveren** (nem csak egyjátékos módban)
- [ ] Többjátékos teszt: másik kliens tud csatlakozni és használni a mod funkciókat
- [ ] Nincs játékot megtörő hiba a script logokban (`DayZDiag_x64.RPT` vagy `script_*.log`)
- [ ] Minden `Print()` debug utasítás eltávolítva vagy `#ifdef DEVELOPER`-be csomagolva
- [ ] Nincsenek beégetett tesztértékek vagy megmaradt kísérleti kódok
- [ ] A `stringtable.csv` tartalmazza az összes felhasználó felé néző stringet fordításokkal
- [ ] A `credits.json` kitöltve a szerző és közreműködő információkkal
- [ ] Logó kép előkészítve (lásd a [3. lépést](#3-lépés-logó-és-előnézeti-képek-előkészítése) a méretekért)
- [ ] Minden textúra `.paa` formátumra konvertálva (nem nyers `.png`/`.tga` a PBO-kban)
- [ ] Workshop leírás és telepítési útmutató megírva
- [ ] Változásnapló elkezdve (akár csak "1.0.0 - Kezdeti kiadás")

---

## 1. lépés: A mod mappa előkészítése

A végleges mod mappának pontosan a DayZ által elvárt struktúrát kell követnie.

### Szükséges struktúra

```
@MyMod/
├── addons/
│   ├── MyMod_Scripts.pbo
│   ├── MyMod_Scripts.pbo.MyMod.bisign
│   ├── MyMod_Data.pbo
│   └── MyMod_Data.pbo.MyMod.bisign
├── keys/
│   └── MyMod.bikey
├── mod.cpp
└── meta.cpp  (a DayZ Launcher automatikusan generálja az első betöltéskor)
```

### Mappa bontás

| Mappa / Fájl | Cél |
|--------------|-----|
| `addons/` | Tartalmazza az összes `.pbo` fájlt (becsomagolt mod tartalom) és azok `.bisign` aláírás fájljait |
| `keys/` | Tartalmazza a nyilvános kulcsot (`.bikey`), amelyet a szerverek használnak a PBO-k ellenőrzéséhez |
| `mod.cpp` | Mod metaadatok: név, szerző, verzió, leírás, ikon útvonalak |
| `meta.cpp` | A DayZ Launcher automatikusan generálja; a Workshop ID-t tartalmazza publikálás után |

### Fontos szabályok

- A mappa nevének **kötelezően** `@`-tal kell kezdődnie. Így azonosítja a DayZ a mod könyvtárakat.
- Az `addons/`-ban lévő minden `.pbo`-nak kell hogy legyen mellette egy `.bisign` fájl.
- A `keys/`-ban lévő `.bikey` fájlnak meg kell egyeznie a `.bisign` fájlok létrehozásához használt privát kulccsal.
- **Ne** tegyél forrásfájlokat (`.c` scriptek, nyers textúrák, Workbench projektek) a feltöltési mappába. Csak becsomagolt PBO-k tartoznak ide.

---

## 2. lépés: Teljes mod.cpp írása

A `mod.cpp` fájl mindent elmond a DayZ-nek és a launchernek a mododról. Egy hiányos `mod.cpp` hiányzó ikonokat, üres leírásokat és megjelenítési problémákat okoz.

### Teljes mod.cpp példa

```cpp
name         = "My Awesome Mod";
picture      = "MyMod/Data/Textures/logo_co.paa";
logo         = "MyMod/Data/Textures/logo_co.paa";
logoSmall    = "MyMod/Data/Textures/logo_small_co.paa";
logoOver     = "MyMod/Data/Textures/logo_co.paa";
tooltip      = "My Awesome Mod - Adds cool features to DayZ";
overview     = "A comprehensive mod that adds new items, mechanics, and UI elements to DayZ.";
author       = "YourName";
overviewPicture = "MyMod/Data/Textures/overview_co.paa";
action       = "https://steamcommunity.com/sharedfiles/filedetails/?id=YOUR_WORKSHOP_ID";
version      = "1.0.0";
versionPath  = "MyMod/Data/version.txt";
```

### Mező referencia

| Mező | Kötelező | Leírás |
|------|----------|--------|
| `name` | Igen | A DayZ Launcher mod listában megjelenő név |
| `picture` | Igen | A fő logó kép útvonala (megjelenik a launcherben). A P: meghajtóhoz vagy a mod gyökérhez képest relatív |
| `logo` | Igen | A legtöbb esetben ugyanaz, mint a picture; bizonyos UI kontextusokban használják |
| `logoSmall` | Nem | A logó kisebb verziója kompakt nézetekhez |
| `logoOver` | Nem | A logó hover állapota (gyakran ugyanaz, mint a `logo`) |
| `tooltip` | Igen | Rövid egysoros leírás, amely a launcherben hover-nél jelenik meg |
| `overview` | Igen | Hosszabb leírás a mod részletek panelen |
| `author` | Igen | A neved vagy a csapatod neve |
| `overviewPicture` | Nem | Nagy kép a mod áttekintő panelen |
| `action` | Nem | URL, amely megnyílik, amikor a játékos a "Weboldal" gombra kattint (jellemzően a Workshop oldalad vagy GitHub) |
| `version` | Igen | Aktuális verzió string (pl. `"1.0.0"`) |
| `versionPath` | Nem | Egy szövegfájl útvonala, amely a verziószámot tartalmazza (automatizált build-ekhez) |

### Gyakori hibák

- **Hiányzó pontosvesszők** minden sor végén. Minden sornak `;`-vel kell végződnie.
- **Rossz kép útvonalak.** Az útvonalak a P: meghajtó gyökéréhez képest relatívak build-eléskor. Csomagolás után az útvonalnak a PBO prefix-et kell tükröznie. Teszteld a mod helyi betöltésével feltöltés előtt.
- **A verzió frissítésének elfelejtése** újrafeltöltés előtt. Mindig növeld a verzió stringet.

---

## 3. lépés: Logó és előnézeti képek előkészítése

### Kép követelmények

| Kép | Méret | Formátum | Használat |
|-----|-------|----------|-----------|
| Mod logó (`picture` / `logo`) | 512 x 512 px | `.paa` (játékon belül) | DayZ Launcher mod lista |
| Kis logó (`logoSmall`) | 128 x 128 px | `.paa` (játékon belül) | Kompakt launcher nézetek |
| Steam Workshop előnézet | 512 x 512 px | `.png` vagy `.jpg` | Workshop oldal bélyegkép |
| Áttekintő kép | 1024 x 512 px | `.paa` (játékon belül) | Mod részletek panel |

### Képek konvertálása PAA formátumba

A DayZ belsőleg `.paa` textúrákat használ. PNG/TGA képek konvertálásához:

1. Nyisd meg a **TexView2**-t (a DayZ Tools része)
2. File > Open a `.png` vagy `.tga` képed
3. File > Save As > válaszd a `.paa` formátumot
4. Mentsd a mod `Data/Textures/` könyvtárába

Az Addon Builder is automatikusan konvertálhatja a textúrákat PBO csomagoláskor, ha be van állítva a binarizálás.

### Tippek

- Használj tiszta, felismerhető ikont, ami kis méretben is jól olvasható.
- Tartsd a logókon a szöveget minimálisra -- 128x128-nál olvashatatlanná válik.
- A Steam Workshop előnézeti kép (`.png`/`.jpg`) különálló a játékon belüli logótól (`.paa`). A Publisheren keresztül töltöd fel.

---

## 4. lépés: Kulcspár generálása

A kulcs aláírás **elengedhetetlen** a többjátékos módhoz. Szinte minden nyilvános szerver engedélyezi az aláírás ellenőrzést, tehát megfelelő aláírások nélkül a játékosokat kidobja, amikor a mododdal csatlakoznak.

### Hogyan működik a kulcs aláírás

- Létrehozol egy **kulcspárt**: egy `.biprivatekey` (privát) és egy `.bikey` (nyilvános)
- Minden `.pbo`-t aláírsz a privát kulccsal, ami `.bisign` fájlt eredményez
- A `.bikey`-t a mododdal együtt terjeszted; a szerver üzemeltetők a `keys/` mappájukba helyezik
- Amikor egy játékos csatlakozik, a szerver minden `.pbo`-t ellenőriz a `.bisign`-jéhez képest a `.bikey` segítségével

### Kulcsok generálása a DayZ Tools-szal

1. Nyisd meg a **DayZ Tools**-t a Steamből
2. A főablakban keresd meg és kattints a **DS Create Key**-re (néha a Tools vagy Utilities alatt van)
3. Adj meg egy **kulcsnevet** -- használd a mod neved (pl. `MyMod`)
4. Válaszd ki, hova mentse a fájlokat
5. Két fájl jön létre:
   - `MyMod.bikey` -- a **nyilvános kulcs** (ezt terjeszd)
   - `MyMod.biprivatekey` -- a **privát kulcs** (tartsd titokban)

### Kulcsok generálása parancssorból

A `DSCreateKey` eszközt közvetlenül terminálból is használhatod:

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSCreateKey.exe" MyMod
```

Ez létrehozza a `MyMod.bikey` és `MyMod.biprivatekey` fájlokat az aktuális könyvtárban.

### Kritikus biztonsági szabály

> **SOHA ne oszd meg a `.biprivatekey` fájlodat.** Bárki, akinek megvan a privát kulcsod, aláírhat módosított PBO-kat, amelyeket a szerverek legitimként fogadnak el. Tárold biztonságosan és készíts biztonsági mentést. Ha elveszíted, új kulcspárt kell generálnod, mindent újra alá kell írnod, és a szerver üzemeltetőknek frissíteniük kell a kulcsaikat.

---

## 5. lépés: PBO-k aláírása

A modod minden `.pbo` fájlját alá kell írnod a privát kulcsoddal. Ez `.bisign` fájlokat eredményez, amelyek a PBO-k mellett helyezkednek el.

### Aláírás a DayZ Tools-szal

1. Nyisd meg a **DayZ Tools**-t
2. Keresd meg és kattints a **DS Sign File**-ra (a Tools vagy Utilities alatt)
3. Válaszd ki a `.biprivatekey` fájlodat
4. Válaszd ki az aláírandó `.pbo` fájlt
5. Egy `.bisign` fájl jön létre a PBO mellett (pl. `MyMod_Scripts.pbo.MyMod.bisign`)
6. Ismételd meg az `addons/` mappa minden `.pbo` fájljára

### Aláírás parancssorból

Automatizáláshoz vagy több PBO-hoz használd a parancssort:

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSSignFile.exe" MyMod.biprivatekey MyMod_Scripts.pbo
```

Az összes PBO aláírása egy mappában batch script-tel:

```batch
@echo off
set DSSIGN="C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSSignFile.exe"
set KEY="path\to\MyMod.biprivatekey"

for %%f in (addons\*.pbo) do (
    echo Signing %%f ...
    %DSSIGN% %KEY% "%%f"
)

echo All PBOs signed.
pause
```

### Aláírás után: Ellenőrizd a mappádat

Az `addons/` mappádnak így kell kinéznie:

```
addons/
├── MyMod_Scripts.pbo
├── MyMod_Scripts.pbo.MyMod.bisign
├── MyMod_Data.pbo
└── MyMod_Data.pbo.MyMod.bisign
```

Minden `.pbo`-nak kell hogy legyen egy megfelelő `.bisign`. Ha bármely `.bisign` hiányzik, a játékosokat kidobja az aláírás-ellenőrzéses szerverekről.

### A nyilvános kulcs elhelyezése

Másold a `MyMod.bikey`-t az `@MyMod/keys/` mappába. Ezt fogják a szerver üzemeltetők a szerverük `keys/` könyvtárába másolni a modod engedélyezéséhez.

---

## 6. lépés: Publikálás a DayZ Tools Publisherrel

A DayZ Tools tartalmaz egy beépített Workshop publishert -- a legegyszerűbb módja a modod Steam-re juttatásának.

### A Publisher megnyitása

1. Nyisd meg a **DayZ Tools**-t a Steamből
2. Kattints a **Publisher**-re a főablakban (néha "Workshop Tool" néven is szerepel)
3. Megnyílik a Publisher ablak a mod részleteinek mezőivel

### Töltsd ki a részleteket

| Mező | Mit írj be |
|------|-----------|
| **Title** | A modod megjelenített neve (pl. "My Awesome Mod") |
| **Description** | Részletes áttekintés arról, mit csinál a modod. Támogatja a Steam BB kód formázást (lásd alább) |
| **Preview Image** | Tallózz a 512 x 512 `.png` vagy `.jpg` előnézeti képedhez |
| **Mod Folder** | Tallózz a teljes `@MyMod` mappádhoz |
| **Tags** | Válaszd ki a releváns tageket (pl. Weapons, Vehicles, UI, Server, Gear, Maps) |
| **Visibility** | **Public** (bárki megtalálja), **Friends Only**, vagy **Unlisted** (csak közvetlen linkkel érhető el) |

### Steam BB kód gyors referencia

A Workshop leírás támogatja a BB kódot:

```
[h1]Funkciók[/h1]
[list]
[*] Első funkció
[*] Második funkció
[/list]

[b]Félkövér[/b]  [i]Dőlt[/i]  [code]Kód[/code]
[url=https://example.com]Link szöveg[/url]
[img]https://example.com/image.png[/img]
```

### Publikálás

1. Nézd át az összes mezőt egy utolsó alkalommal
2. Kattints a **Publish** (vagy **Upload**) gombra
3. Várj, amíg a feltöltés befejeződik. Nagy modoknál ez több percig is tarthat a kapcsolatodtól függően.
4. Befejezés után egy megerősítést látsz a **Workshop ID**-ddal (egy hosszú számkód, pl. `2345678901`)
5. **Mentsd el ezt a Workshop ID-t.** Szükséged lesz rá a frissítések küldéséhez.

### Publikálás után: Ellenőrzés

Ne hagyd ki ezt. Teszteld a mododat úgy, ahogy egy átlagos játékos tenné:

1. Látogasd meg a `https://steamcommunity.com/sharedfiles/filedetails/?id=YOUR_ID` oldalt és ellenőrizd a címet, leírást, előnézeti képet
2. **Iratkozz fel** a saját mododra a Workshopon
3. Indítsd el a DayZ-t, erősítsd meg, hogy a mod megjelenik a launcherben
4. Engedélyezd, indítsd el a játékot, csatlakozz egy szerverre (vagy futtasd a saját tesztszervered)
5. Erősítsd meg, hogy minden funkció működik
6. Frissítsd az `action` mezőt a `mod.cpp`-ben, hogy a Workshop oldal URL-edre mutasson

Ha bármi hibás, frissíts és töltsd fel újra, mielőtt nyilvánosan bejelentenéd.

---

## Publikálás parancssorból (alternatíva)

Automatizáláshoz, CI/CD-hez vagy kötegelt feltöltésekhez a SteamCMD parancssoros alternatívát biztosít.

### A SteamCMD telepítése

Töltsd le a [Valve fejlesztői oldaláról](https://developer.valvesoftware.com/wiki/SteamCMD) és csomagold ki egy mappába, pl. `C:\SteamCMD\`.

### VDF fájl létrehozása

A SteamCMD egy `.vdf` fájlt használ a feltöltendő tartalom leírásához. Hozz létre egy `workshop_publish.vdf` nevű fájlt:

```
"workshopitem"
{
    "appid"          "221100"
    "publishedfileid" "0"
    "contentfolder"  "C:\\Path\\To\\@MyMod"
    "previewfile"    "C:\\Path\\To\\preview.png"
    "visibility"     "0"
    "title"          "My Awesome Mod"
    "description"    "A comprehensive mod for DayZ."
    "changenote"     "Initial release"
}
```

### Mező referencia

| Mező | Érték |
|------|-------|
| `appid` | Mindig `221100` a DayZ-hez |
| `publishedfileid` | `0` új elemhez; használd a Workshop ID-t frissítésekhez |
| `contentfolder` | Abszolút útvonal az `@MyMod` mappádhoz |
| `previewfile` | Abszolút útvonal az előnézeti képedhez |
| `visibility` | `0` = Nyilvános, `1` = Csak barátoknak, `2` = Nem listázott, `3` = Privát |
| `title` | Mod neve |
| `description` | Mod leírása (sima szöveg) |
| `changenote` | A Workshop oldalon a változási előzményekben megjelenő szöveg |

### A SteamCMD futtatása

```batch
C:\SteamCMD\steamcmd.exe +login YourSteamUsername +workshop_build_item "C:\Path\To\workshop_publish.vdf" +quit
```

A SteamCMD az első használatkor kérni fogja a jelszavadat és a Steam Guard kódodat. A hitelesítés után feltölti a modot és kiírja a Workshop ID-t.

### Mikor használd a parancssort

- **Automatizált build-ek:** integrálás egy build scriptbe, amely becsomagolja a PBO-kat, aláírja és feltölti egy lépésben
- **Kötegelt műveletek:** több mod feltöltése egyszerre
- **Fejetlen szerverek:** GUI nélküli környezetek
- **CI/CD folyamatok:** GitHub Actions vagy hasonló tudja hívni a SteamCMD-t

---

## A mod frissítése

### Lépésről lépésre frissítési folyamat

1. **Végezd el a kódváltoztatásokat** és teszteld alaposan
2. **Növeld a verziót** a `mod.cpp`-ben (pl. `"1.0.0"` lesz `"1.0.1"`)
3. **Építsd újra az összes PBO-t** az Addon Builder-rel vagy a build scripted segítségével
4. **Írd alá újra az összes PBO-t** **ugyanazzal a privát kulccsal**, amelyet eredetileg használtál
5. **Nyisd meg a DayZ Tools Publishert**
6. Add meg a meglévő **Workshop ID**-dat (vagy válaszd ki a meglévő elemet)
7. Mutasd a frissített `@MyMod` mappádra
8. Írj egy **változási megjegyzést**, amelyik leírja, mi változott
9. Kattints a **Publish / Update** gombra

### Frissítés SteamCMD-vel

Frissítsd a VDF fájlt a Workshop ID-ddal és egy új változási megjegyzéssel:

```
"workshopitem"
{
    "appid"          "221100"
    "publishedfileid" "2345678901"
    "contentfolder"  "C:\\Path\\To\\@MyMod"
    "changenote"     "v1.0.1 - Fixed item duplication bug, added French translation"
}
```

Majd futtasd a SteamCMD-t a korábbiakhoz hasonlóan. A `publishedfileid` megmondja a Steamnek, hogy a meglévő elemet frissítse új létrehozása helyett.

### Fontos: Használd ugyanazt a kulcsot

A frissítéseket mindig **ugyanazzal a privát kulccsal** írd alá, amelyet az eredeti kiadáshoz használtál. Ha más kulccsal írsz alá, a szerver üzemeltetőknek ki kell cserélniük a régi `.bikey`-t az újra -- ami leállást és zavart jelent. Csak akkor generálj új kulcspárt, ha a privát kulcsod kompromittálódott.

---

## Verziókezelés legjobb gyakorlatai

### Szemantikus verziózás

Használd a **MAJOR.MINOR.PATCH** formátumot:

| Komponens | Mikor növeld | Példa |
|-----------|-------------|-------|
| **MAJOR** | Törő változások: konfiguráció formátum változás, eltávolított funkciók, API átalakítások | `1.0.0` -> `2.0.0` |
| **MINOR** | Új funkciók, amelyek visszafelé kompatibilisek | `1.0.0` -> `1.1.0` |
| **PATCH** | Hibajavítások, kis finomítások, fordítás frissítések | `1.0.0` -> `1.0.1` |

### Változásnapló formátum

Tarts fenn egy változásnaplót a Workshop leírásodban vagy egy külön fájlban. Egy tiszta formátum:

```
v1.2.0 (2025-06-15)
- Hozzáadva: Éjjellátó átkapcsoló billentyűkötés
- Hozzáadva: Német és spanyol fordítások
- Javítva: Felszerelés összeomlás halmozott tárgyak eldobásakor
- Módosítva: Alapértelmezett spawn ráta csökkentése 5-ről 3-ra

v1.1.0 (2025-05-01)
- Hozzáadva: Új barkácsolási receptek 4 tárgyhoz
- Javítva: Szerver összeomlás játékos lekapcsolódásakor kereskedés közben

v1.0.0 (2025-04-01)
- Kezdeti kiadás
```

### Visszafelé kompatibilitás

Amikor a modod perzisztens adatokat ment (JSON konfigok, játékos adat fájlok), gondolj alaposan, mielőtt megváltoztatnád a formátumot:

- **Új mezők hozzáadása** biztonságos. Használj alapértelmezett értékeket a hiányzó mezőkhöz régi fájlok betöltésekor.
- **Mezők átnevezése vagy eltávolítása** törő változás. Növeld a MAJOR verziót.
- **Fontold meg a migrációs mintát:** észleld a régi formátumot, alakítsd át az új formátumra, mentsd.

Példa migrációs ellenőrzés Enforce Script-ben:

```csharp
// A konfiguráció betöltő függvényben
if (config.configVersion < 2)
{
    // Migráció v1-ről v2-re: "oldField" átnevezése "newField"-re
    config.newField = config.oldField;
    config.configVersion = 2;
    SaveConfig(config);
    SDZ_Log.Info("MyMod", "Config migrated from v1 to v2");
}
```

### Git címkézés

Ha Git-et használsz verziókezeléshez (és kéne), címkézz minden kiadást:

```bash
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

Ez egy állandó hivatkozási pontot hoz létre, így bármikor visszamehetsz bármely publikált verzió pontos kódjához.

---

## Workshop oldal legjobb gyakorlatai

### Leírás struktúra

Szervezd a leírásodat ezekkel a szekciókkal:

1. **Áttekintés** -- mit csinál a mod, 2-3 mondatban
2. **Funkciók** -- felsorolás a fő funkciókról
3. **Követelmények** -- listázd az összes függőségi modot Workshop linkekkel
4. **Telepítés** -- lépésről lépésre játékosoknak (általában csak "iratkozz fel és engedélyezd")
5. **Szerver beállítás** -- útmutató szerver üzemeltetőknek (kulcs elhelyezés, konfigurációs fájlok)
6. **GYIK** -- gyakori kérdések előre megválaszolva
7. **Ismert problémák** -- légy őszinte a jelenlegi korlátozásokkal kapcsolatban
8. **Támogatás** -- link a Discordodra, GitHub issues-ra vagy fórum szálra
9. **Változásnapló** -- legutóbbi verzió előzmények
10. **Licenc** -- hogyan használhatják (vagy nem használhatják) mások a munkádat

### Képernyőképek és média

- Mellékelj **3-5 játékon belüli képernyőképet**, amelyek a mododat működés közben mutatják
- Ha a modod UI-t ad hozzá, mutasd az UI paneleket tisztán
- Ha a modod tárgyakat ad hozzá, mutasd őket játékon belül (nem csak a szerkesztőben)
- Egy rövid gameplay videó drámaian növeli a feliratkozások számát

### Függőségek

Ha a modod más modokat igényel, listázd őket tisztán Workshop linkekkel. Használd a Steam Workshop "Required Items" funkcióját, hogy a launcher automatikusan betöltse a függőségeket.

### Frissítési ütemterv

Állíts be elvárásokat. Ha hetente frissítesz, mondd el. Ha a frissítések alkalomszerűek, mondd, hogy "szükség szerint frissül." A játékosok megértőbbek, ha tudják, mire számítsanak.

---

## Útmutató szerver üzemeltetőknek

Foglald bele ezt az információt a Workshop leírásodba a szerver adminoknak.

### Workshop mod telepítése dedikált szerverre

1. **Töltsd le a modot** SteamCMD-vel vagy a Steam klienssel:
   ```batch
   steamcmd +login anonymous +workshop_download_item 221100 WORKSHOP_ID +quit
   ```
2. **Másold** (vagy symlinkeld) az `@ModName` mappát a DayZ Server könyvtárba
3. **Másold a `.bikey` fájlt** az `@ModName/keys/`-ből a szerver `keys/` mappájába
4. **Add hozzá a modot** a `-mod=` indítási paraméterhez

### Indítási paraméter szintaxis

A modok a `-mod=` paraméteren keresztül töltődnek be, pontosvesszővel elválasztva:

```
-mod=@CF;@VPPAdminTools;@MyMod
```

Használd a **teljes relatív útvonalat** a szerver gyökérből. Linuxon az útvonalak kis- és nagybetű érzékenyek.

### Betöltési sorrend

A modok a `-mod=`-ban felsorolt sorrendben töltődnek be. Ez számít, amikor a modok egymástól függenek:

- **Függőségek először.** Ha az `@MyMod` igényli az `@CF`-et, listázd az `@CF`-et az `@MyMod` előtt.
- **Általános szabály:** keretrendszerek először, tartalmi modok utoljára.
- Ha a modod `requiredAddons`-t deklarál a `config.cpp`-ben, a DayZ megpróbálja automatikusan feloldani a betöltési sorrendet, de az explicit sorrend a `-mod=`-ban biztonságosabb.

### Kulcskezelés

- Helyezz el **egy `.bikey`-t modonként** a szerver `keys/` könyvtárában
- Amikor egy mod ugyanazzal a kulccsal frissül, nem kell tenni semmit -- a meglévő `.bikey` továbbra is működik
- Ha egy mod szerzője kulcsot vált, ki kell cserélned a régi `.bikey`-t az újra
- A `keys/` mappa útvonala a szerver gyökérhez képest relatív (pl. `DayZServer/keys/`)

---

## Terjesztés a Workshop nélkül

### Mikor hagyd ki a Workshopot

- **Privát modok** a saját szerver közösségednek
- **Béta tesztelés** kis csoporttal a nyilvános kiadás előtt
- **Kereskedelmi vagy licencelt modok** más csatornákon terjesztve
- **Gyors iteráció** fejlesztés közben (gyorsabb, mint minden alkalommal újra feltölteni)

### Kiadás ZIP létrehozása

Csomagold a mododat kézi terjesztéshez:

```
MyMod_v1.0.0.zip
└── @MyMod/
    ├── addons/
    │   ├── MyMod_Scripts.pbo
    │   ├── MyMod_Scripts.pbo.MyMod.bisign
    │   ├── MyMod_Data.pbo
    │   └── MyMod_Data.pbo.MyMod.bisign
    ├── keys/
    │   └── MyMod.bikey
    └── mod.cpp
```

Mellékelj egy `README.txt` fájlt telepítési útmutatóval:

```
TELEPÍTÉS:
1. Csomagold ki az @MyMod mappát a DayZ játékkönyvtáradba
2. (Szerver üzemeltetők) Másold a MyMod.bikey-t az @MyMod/keys/-ből a szervered keys/ mappájába
3. Add hozzá az @MyMod-ot a -mod= indítási paraméterhez
```

### GitHub kiadások

Ha a modod nyílt forráskódú, használd a GitHub Releases-t verziózott letöltések tárolásához:

1. Címkézd a kiadást Git-ben (`git tag v1.0.0`)
2. Építsd meg és írd alá a PBO-kat
3. Hozz létre egy ZIP-et az `@MyMod` mappából
4. Hozz létre egy GitHub Release-t és csatold a ZIP-et
5. Írj kiadási jegyzeteket a kiadás leírásába

Ez verzió előzményeket, letöltési számokat és stabil URL-t ad minden kiadáshoz.

---

## Gyakori problémák és megoldások

| Probléma | Ok | Megoldás |
|----------|-----|---------|
| "Addon rejected by server" | A szerveren hiányzik a `.bikey`, vagy a `.bisign` nem egyezik a `.pbo`-val | Erősítsd meg, hogy a `.bikey` a szerver `keys/` mappájában van. Írd alá újra a PBO-kat a helyes `.biprivatekey`-jel. |
| "Signature check failed" | A PBO módosult az aláírás után, vagy rossz kulccsal írták alá | Építsd újra a PBO-t tiszta forrásból. Írd alá újra **ugyanazzal a kulccsal**, amely a szerver `.bikey`-jét generálta. |
| A mod nem jelenik meg a DayZ Launcherben | Hibás `mod.cpp` vagy rossz mappastruktúra | Ellenőrizd a `mod.cpp`-t szintaktikai hibákra (hiányzó `;`). Győződj meg róla, hogy a mappa `@`-tal kezdődik. Indítsd újra a launchert. |
| A feltöltés sikertelen a Publisherben | Hitelesítési, kapcsolati vagy fájlzárolási probléma | Ellenőrizd a Steam bejelentkezést. Zárd be a Workbench-et/Addon Builder-t. Próbáld meg a DayZ Tools-t rendszergazdaként futtatni. |
| Rossz/hiányzó Workshop ikon | Rossz útvonal a `mod.cpp`-ben vagy rossz képformátum | Ellenőrizd, hogy a `picture`/`logo` útvonalak valós `.paa` fájlokra mutatnak. A Workshop előnézet (`.png`) külön van. |
| Ütközés más modokkal | Vanilla osztályok újradefiniálása modolás helyett | Használd a `modded class`-t, hívd meg a `super`-t felülírásokban, állítsd be a `requiredAddons`-t a betöltési sorrendhez. |
| Játékosok összeomlanak betöltéskor | Script hibák, sérült PBO-k vagy hiányzó függőségek | Ellenőrizd az `.RPT` logokat. Építsd újra a PBO-kat tiszta forrásból. Ellenőrizd, hogy a függőségek előbb töltődnek be. |

---

## A teljes mod életciklus

```
ÖTLET -> BEÁLLÍTÁS (8.1) -> STRUKTÚRA (8.1, 8.5) -> KÓD (8.2, 8.3, 8.4) -> BUILD (8.1)
  -> TESZT -> HIBAKERESÉS (8.6) -> CSISZOLÁS -> ALÁÍRÁS (8.7) -> PUBLIKÁLÁS (8.7) -> KARBANTARTÁS (8.7)
                                    ↑                                    │
                                    └────── visszajelzési hurok ─────────┘
```

A publikálás után a játékos visszajelzés visszavisz a KÓD, TESZT és HIBAKERESÉS fázisba. A publikálás-visszajelzés-javítás ciklusa az, ahogyan a nagyszerű modok készülnek.

---

## Következő lépések

Befejezted a teljes DayZ modolási útmutató sorozatot -- az üres munkahelytől a publikált, aláírt és karbantartott modig a Steam Workshopon. Innen:

- **Fedezd fel a referencia fejezeteket** (1-7. fejezetek) a GUI rendszer, a config.cpp és az Enforce Script mélyebb megismeréséhez
- **Tanulmányozd a nyílt forráskódú modokat**, mint a CF, Community Online Tools és Expansion a haladó mintákért
- **Csatlakozz a DayZ modolói közösséghez** a Discordon és a Bohemia Interactive fórumokon
- **Építs nagyobbat.** Az első modod a Hello World volt. A következő egy teljes gameplay átalakítás is lehet.

Az eszközök a kezedben vannak. Építs valami nagyszerűt.
