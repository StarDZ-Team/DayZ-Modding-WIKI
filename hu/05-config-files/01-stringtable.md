# 5.1. fejezet: stringtable.csv --- Lokalizáció

[Főoldal](../../README.md) | **stringtable.csv** | [Következő: inputs.xml >>](02-inputs-xml.md)

---

> **Összefoglalás:** A `stringtable.csv` fájl biztosítja a lokalizált szövegeket a DayZ mododhoz. A motor indításkor beolvassa ezt a CSV fájlt, és a játékos nyelvi beállítása alapján oldja fel a fordítási kulcsokat. Minden felhasználó számára látható szöveg --- UI feliratok, billentyűkötés nevek, tárgy leírások, értesítési szövegek --- a stringtable-ben kell elhelyezni a hardkódolás helyett.

---

## Tartalomjegyzék

- [Áttekintés](#overview)
- [CSV formátum](#csv-format)
- [Oszlop referencia](#column-reference)
- [Kulcs elnevezési konvenció](#key-naming-convention)
- [Sztringek hivatkozása](#referencing-strings)
- [Új stringtable létrehozása](#creating-a-new-stringtable)
- [Üres cellák kezelése és tartalék viselkedés](#empty-cell-handling-and-fallback-behavior)
- [Többnyelvű munkafolyamat](#multi-language-workflow)
- [Moduláris stringtable megközelítés (DayZ Expansion)](#modular-stringtable-approach-dayz-expansion)
- [Valós példák](#real-examples)
- [Gyakori hibák](#common-mistakes)

---

## Áttekintés

A DayZ CSV-alapú lokalizációs rendszert használ. Amikor a motor egy `#` előtaggal ellátott sztring kulccsal találkozik (például `#STR_MYMOD_HELLO`), megkeresi azt a kulcsot az összes betöltött stringtable fájlban, és visszaadja a játékos aktuális nyelvének megfelelő fordítást. Ha nem talál egyezést az aktív nyelven, egy meghatározott tartalék láncon halad végig.

A stringtable fájl nevének pontosan `stringtable.csv`-nek kell lennie, és a mod PBO struktúráján belül kell elhelyezni. A motor automatikusan felfedezi --- nincs szükség config.cpp regisztrációra.

---

## CSV formátum

A fájl egy szabványos vesszővel elválasztott értékfájl idézőjeles mezőkkel. Az első sor a fejléc, és minden további sor egy fordítási kulcsot definiál.

### Fejléc sor

A fejléc sor határozza meg az oszlopokat. A DayZ legfeljebb 15 oszlopot ismer fel:

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
```

### Adat sorok

Minden sor a sztring kulccsal kezdődik (a CSV-ben `#` előtag nélkül), amelyet az egyes nyelvekhez tartozó fordítás követ:

```csv
"STR_MYMOD_HELLO","Hello World","Hello World","Ahoj světe","Hallo Welt","Привет мир","Witaj świecie","Helló világ","Ciao mondo","Hola mundo","Bonjour le monde","你好世界","ハローワールド","Olá mundo","你好世界",
```

### Záró vessző

Sok stringtable fájl tartalmaz záró vesszőt az utolsó oszlop után. Ez szokásos és biztonságos --- a motor elfogadja.

### Idézőjelezési szabályok

- A mezőket **kötelező** dupla idézőjelbe tenni, ha vesszőt, sortörést vagy dupla idézőjelet tartalmaznak.
- A gyakorlatban a legtöbb mod minden mezőt idézőjelez az egységesség kedvéért.
- Egyes modok (mint a MyMissions Mod) teljesen elhagyják az idézőjeleket; a motor mindkét stílust kezeli, amíg a mező tartalma nem tartalmaz vesszőt.

---

## Oszlop referencia

A DayZ 13 játékos által választható nyelvet támogat. A CSV 15 oszloppal rendelkezik, mert az első oszlop a kulcs neve, a második pedig az `original` oszlop (a mod szerző anyanyelve vagy alapértelmezett szöveg).

| # | Oszlop neve | Nyelv | Megjegyzések |
|---|-------------|----------|-------|
| 1 | `Language` | --- | A sztring kulcs azonosító (pl. `STR_MYMOD_HELLO`) |
| 2 | `original` | Szerző anyanyelve | Végső tartalék; akkor használt, ha más oszlop sem egyezik |
| 3 | `english` | Angol | A leggyakoribb elsődleges nyelv nemzetközi modokhoz |
| 4 | `czech` | Cseh | |
| 5 | `german` | Német | |
| 6 | `russian` | Orosz | |
| 7 | `polish` | Lengyel | |
| 8 | `hungarian` | Magyar | |
| 9 | `italian` | Olasz | |
| 10 | `spanish` | Spanyol | |
| 11 | `french` | Francia | |
| 12 | `chinese` | Kínai (Hagyományos) | Hagyományos kínai karakterek |
| 13 | `japanese` | Japán | |
| 14 | `portuguese` | Portugál | |
| 15 | `chinesesimp` | Kínai (Egyszerűsített) | Egyszerűsített kínai karakterek |

### Az oszlopsorrend számít

A motor a **fejléc neve** alapján azonosítja az oszlopokat, nem a pozíció alapján. Mindazonáltal a fent bemutatott szabványos sorrend követése erősen ajánlott a kompatibilitás és olvashatóság érdekében.

### Opcionális oszlopok

Nem kell mind a 15 oszlopot szerepeltetni. Ha a modod csak angolt támogat, használhatsz minimális fejlécet:

```csv
"Language","english"
"STR_MYMOD_HELLO","Hello World"
```

Egyes modok nem szabványos oszlopokat adnak hozzá, mint a `korean` (a MyMissions Mod teszi ezt). A motor figyelmen kívül hagyja azokat az oszlopokat, amelyeket nem ismer fel támogatott nyelvként, de ezek az oszlopok dokumentációként vagy jövőbeli nyelvtámogatás előkészítéseként szolgálhatnak.

---

## Kulcs elnevezési konvenció

A sztring kulcsok hierarchikus elnevezési mintát követnek:

```
STR_MODNAME_CATEGORY_ELEMENT
```

### Szabályok

1. **Mindig `STR_`-vel kezdődik** --- ez egyetemes DayZ konvenció
2. **Mod előtag** --- egyedileg azonosítja a mododat (pl. `MYMOD`, `COT`, `EXPANSION`, `VPP`)
3. **Kategória** --- csoportosítja a kapcsolódó sztringeket (pl. `INPUT`, `TAB`, `CONFIG`, `DIR`)
4. **Elem** --- az adott sztring (pl. `ADMIN_PANEL`, `NORTH`, `SAVE`)
5. **NAGYBETŰS** --- a konvenció az összes jelentős mod között
6. **Aláhúzásjeleket** használj elválasztóként, soha szóközöket vagy kötőjeleket

### Példák valós modokból

```
STR_MYMOD_INPUT_ADMIN_PANEL       -- MyMod: billentyűkötés felirat
STR_MYMOD_CLOSE                   -- MyMod: általános "Bezárás" gomb
STR_MyDIR_NORTH                  -- MyMod: iránytű irány
STR_MyTAB_ONLINE                 -- MyMod: admin panel fül neve
STR_COT_ESP_MODULE_NAME            -- COT: modul megjelenítési neve
STR_COT_CAMERA_MODULE_BLUR         -- COT: kamera eszköz felirat
STR_EXPANSION_ATM                  -- Expansion: funkció neve
STR_EXPANSION_AI_COMMAND_MENU      -- Expansion: beviteli felirat
```

### Kerülendő minták

```
STR_hello_world          -- Rossz: kisbetűs, nincs mod előtag
MY_STRING                -- Rossz: hiányzó STR_ előtag
STR_MYMOD Hello World    -- Rossz: szóközök a kulcsban
```

---

## Sztringek hivatkozása

Három különböző kontextus van, ahol lokalizált sztringekre hivatkozhatsz, és mindegyik kissé eltérő szintaxist használ.

### Layout fájlokban (.layout)

Használd a `#` előtagot a kulcs neve előtt. A motor a widget létrehozásakor oldja fel.

```
TextWidgetClass MyLabel {
 text "#STR_MYMOD_CLOSE"
 size 100 30
}
```

A `#` előtag jelzi a layout parsernek, hogy "ez egy lokalizációs kulcs, nem szó szerinti szöveg."

### Enforce Scriptben (.c fájlok)

Használd a `Widget.TranslateString()` metódust a kulcs futásidejű feloldásához. A `#` előtag kötelező az argumentumban.

```c
string translated = Widget.TranslateString("#STR_MYMOD_CLOSE");
// translated == "Close" (ha a játékos nyelve angol)
// translated == "Fechar" (ha a játékos nyelve portugál)
```

A widget szövegét közvetlenül is beállíthatod:

```c
TextWidget label = TextWidget.Cast(layoutRoot.FindAnyWidget("MyLabel"));
label.SetText(Widget.TranslateString("#STR_MYMOD_ADMIN_PANEL"));
```

Vagy használhatsz sztring kulcsokat közvetlenül widget szöveg tulajdonságokban, és a motor feloldja őket:

```c
label.SetText("#STR_MYMOD_ADMIN_PANEL");  // Ez is működik -- a motor automatikusan feloldja
```

### Az inputs.xml fájlban

Használd a `loc` attribútumot a `#` előtag **nélkül**.

```xml
<input name="UAMyAction" loc="STR_MYMOD_INPUT_MY_ACTION" />
```

Ez az egyetlen hely, ahol elhagyod a `#`-t. A beviteli rendszer belsőleg hozzáadja.

### Összefoglaló táblázat

| Kontextus | Szintaxis | Példa |
|---------|--------|---------|
| Layout fájl `text` attribútum | `#STR_KEY` | `text "#STR_MYMOD_CLOSE"` |
| Script `TranslateString()` | `"#STR_KEY"` | `Widget.TranslateString("#STR_MYMOD_CLOSE")` |
| Script widget szöveg | `"#STR_KEY"` | `label.SetText("#STR_MYMOD_CLOSE")` |
| inputs.xml `loc` attribútum | `STR_KEY` (# nélkül) | `loc="STR_MYMOD_INPUT_ADMIN_PANEL"` |

---

## Új stringtable létrehozása

### 1. lépés: Fájl létrehozása

Hozd létre a `stringtable.csv` fájlt a mod PBO tartalom könyvtárának gyökerében. A motor az összes betöltött PBO-ban megkeresi a pontosan `stringtable.csv` nevű fájlokat.

Tipikus elhelyezés:

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      config.cpp
      stringtable.csv        <-- Itt
      Scripts/
        3_Game/
        4_World/
        5_Mission/
```

### 2. lépés: Fejléc megírása

Kezdd a teljes 15 oszlopos fejléccel:

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
```

### 3. lépés: Sztringek hozzáadása

Adj hozzá egy sort fordítandó sztringenként. Kezdd az angollal, töltsd ki a többi nyelvet ahogy a fordítások elérhetővé válnak:

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_TITLE","My Cool Mod","My Cool Mod","","","","","","","","","","","","",
"STR_MYMOD_OPEN","Open","Open","Otevřít","Öffnen","Открыть","Otwórz","Megnyitás","Apri","Abrir","Ouvrir","打开","開く","Abrir","打开",
```

### 4. lépés: Csomagolás és tesztelés

Építsd meg a PBO-dat. Indítsd el a játékot. Ellenőrizd, hogy a `Widget.TranslateString("#STR_MYMOD_TITLE")` visszaadja-e a "My Cool Mod" értéket a script logokban. Változtasd meg a játék nyelvét a beállításokban a tartalék viselkedés ellenőrzéséhez.

---

## Üres cellák kezelése és tartalék viselkedés

Amikor a motor megkeres egy sztring kulcsot a játékos aktuális nyelvén és üres cellát talál, egy tartalék láncon halad végig:

1. **A játékos kiválasztott nyelve oszlop** --- először ellenőrzi
2. **`english` oszlop** --- ha a játékos nyelve cellája üres
3. **`original` oszlop** --- ha az `english` is üres
4. **Nyers kulcsnév** --- ha minden oszlop üres, a motor magát a kulcsot jeleníti meg (pl. `STR_MYMOD_TITLE`)

Ez azt jelenti, hogy fejlesztés közben biztonságosan üresen hagyhatod a nem angol oszlopokat. Az angolul beszélő játékosok az `english` oszlopot látják, a többi játékos pedig az angol tartalékot, amíg megfelelő fordítás nem kerül hozzáadásra.

### Gyakorlati következmény

Nem kell az angol szöveget minden oszlopba másolni helyőrzőként. Hagyd üresen a le nem fordított cellákat:

```csv
"STR_MYMOD_HELLO","Hello","Hello","","","","","","","","","","","","",
```

Azok a játékosok, akiknek a nyelve német, a "Hello" szöveget fogják látni (az angol tartalékot), amíg német fordítás nem kerül megadásra.

---

## Többnyelvű munkafolyamat

### Egyéni fejlesztőknek

1. Írd meg az összes sztringet angolul (mind az `original`, mind az `english` oszlopban).
2. Add ki a modot. Az angol egyetemes tartalékként szolgál.
3. Ahogy a közösség tagjai önkéntesen fordítanak, töltsd ki a további oszlopokat.
4. Építsd újra és add ki a frissítéseket.

### Fordítókkal rendelkező csapatoknak

1. Tartsd a CSV-t egy megosztott adattárban vagy táblázatkezelőben.
2. Rendelj hozzá egy fordítót nyelvenként.
3. Használd az `original` oszlopot a szerző anyanyelvéhez (pl. portugál brazil fejlesztőknek).
4. Az `english` oszlop mindig ki van töltve --- ez a nemzetközi alap.
5. Használj diff eszközt annak nyomon követésére, hogy mely kulcsok lettek hozzáadva az utolsó fordítási menet óta.

### Táblázatkezelő szoftver használata

A CSV fájlok természetesen megnyílnak Excelben, Google Sheetsben vagy LibreOffice Calc-ban. Legyél tudatában ezeknek a buktatóknak:

- **Az Excel hozzáadhat BOM-ot (Byte Order Mark-ot)** az UTF-8 fájlokhoz. A DayZ kezeli a BOM-ot, de egyes eszközöknél problémákat okozhat. Biztonság kedvéért mentsd el "CSV UTF-8"-ként.
- **Az Excel automatikus formázása** megváltoztathatja a dátumnak vagy számnak tűnő mezőket.
- **Sorvégek**: a DayZ elfogadja mind a `\r\n` (Windows), mind a `\n` (Unix) formátumot.

---

## Moduláris stringtable megközelítés (DayZ Expansion)

A DayZ Expansion egy bevált gyakorlatot mutat be nagy modokhoz: a fordítások szétosztása több stringtable fájlba, funkció modulok szerint rendezve. A struktúrájuk 20 különálló stringtable fájlt használ egy `languagecore` könyvtáron belül:

```
DayZExpansion/
  languagecore/
    AI/stringtable.csv
    BaseBuilding/stringtable.csv
    Book/stringtable.csv
    Chat/stringtable.csv
    Core/stringtable.csv
    Garage/stringtable.csv
    Groups/stringtable.csv
    Hardline/stringtable.csv
    Licensed/stringtable.csv
    Main/stringtable.csv
    MapAssets/stringtable.csv
    Market/stringtable.csv
    Missions/stringtable.csv
    Navigation/stringtable.csv
    PersonalStorage/stringtable.csv
    PlayerList/stringtable.csv
    Quests/stringtable.csv
    SpawnSelection/stringtable.csv
    Vehicles/stringtable.csv
    Weapons/stringtable.csv
```

### Miért érdemes szétválasztani?

- **Kezelhetőség**: Egy nagy mod egyetlen stringtable-je több ezer sorra nőhet. A funkció modulok szerinti felosztás minden fájlt kezelhetővé tesz.
- **Független frissítések**: A fordítók egyszerre egy modulon dolgozhatnak merge konfliktusok nélkül.
- **Feltételes bevonás**: Minden al-mod PBO-ja csak a saját funkciójához tartozó stringtable-t tartalmazza, kisebb PBO méreteket biztosítva.

### Hogyan működik

A motor minden betöltött PBO-ban megkeresi a `stringtable.csv` fájlt. Mivel minden Expansion al-modul saját PBO-ba van csomagolva, mindegyik természetesen csak a saját stringtable-jét tartalmazza. Nincs szükség különleges konfigurációra --- egyszerűen nevezd el a fájlt `stringtable.csv`-nek és helyezd a PBO-ba.

A kulcsnevek továbbra is globális előtagot használnak (`STR_EXPANSION_`), hogy elkerüljék az ütközéseket.

---

## Valós példák

### MyFramework

A MyFramework a teljes 15 oszlopos formátumot használja, portugállal mint `original` nyelv (a fejlesztőcsapat anyanyelve), és átfogó fordításokkal mind a 13 támogatott nyelvhez:

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_INPUT_GROUP","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod",
"STR_MYMOD_INPUT_ADMIN_PANEL","Painel Admin","Open Admin Panel","Otevřít Admin Panel","Admin-Panel öffnen","Открыть Админ Панель","Otwórz Panel Admina","Admin Panel megnyitása","Apri Pannello Admin","Abrir Panel Admin","Ouvrir le Panneau Admin","打开管理面板","管理パネルを開く","Abrir Painel Admin","打开管理面板",
"STR_MYMOD_CLOSE","Fechar","Close","Zavřít","Schließen","Закрыть","Zamknij","Bezárás","Chiudi","Cerrar","Fermer","关闭","閉じる","Fechar","关闭",
"STR_MYMOD_SAVE","Salvar","Save","Uložit","Speichern","Сохранить","Zapisz","Mentés","Salva","Guardar","Sauvegarder","保存","保存","Salvar","保存",
```

Figyelemreméltó minták:
- Az `original` portugál szöveget tartalmaz (a csapat anyanyelve)
- Az `english` mindig ki van töltve nemzetközi alapként
- Mind a 13 nyelvi oszlop ki van töltve

### COT (Community Online Tools)

A COT ugyanazt a 15 oszlopos formátumot használja. A kulcsai a `STR_COT_MODULE_CATEGORY_ELEMENT` mintát követik:

```csv
Language,original,english,czech,german,russian,polish,hungarian,italian,spanish,french,chinese,japanese,portuguese,chinesesimp,
STR_COT_CAMERA_MODULE_BLUR,Blur:,Blur:,Rozmazání:,Weichzeichner:,Размытие:,Rozmycie:,Elmosódás:,Sfocatura:,Desenfoque:,Flou:,模糊:,ぼかし:,Desfoque:,模糊:,
STR_COT_ESP_MODULE_NAME,Camera Tools,Camera Tools,Nástroje kamery,Kamera-Werkzeuge,Камера,Narzędzia Kamery,Kamera Eszközök,Strumenti Camera,Herramientas de Cámara,Outils Caméra,相機工具,カメラツール,Ferramentas da Câmera,相机工具,
```

### VPP Admin Tools

A VPP csökkentett oszlopkészletet használ (13 oszlop, nincs `hungarian` oszlop), és nem használ `STR_` előtagot a kulcsokhoz:

```csv
"Language","original","english","czech","german","russian","polish","italian","spanish","french","chinese","japanese","portuguese","chinesesimp"
"vpp_focus_on_game","[Hold/2xTap] Focus On Game","[Hold/2xTap] Focus On Game","...","...","...","...","...","...","...","...","...","...","..."
```

Ez bizonyítja, hogy az `STR_` előtag konvenció, nem követelmény. Mindazonáltal ennek elhagyása azt jelenti, hogy nem használhatod a `#` előtagos feloldást layout fájlokban. A VPP ezeket a kulcsokat csak script kódon keresztül hivatkozza. Az `STR_` előtag erősen ajánlott minden új modhoz.

### MyMissions Mod

A MyMissions Mod idézőjel nélküli, fejléc nélküli stílusú CSV-t használ (nincs idézőjel a mezők körül), egy extra `Korean` oszloppal:

```csv
Language,English,Czech,German,Russian,Polish,Hungarian,Italian,Spanish,French,Chinese,Japanese,Portuguese,Korean
STR_MyMISSION_AVAILABLE,MISSION AVAILABLE,MISE K DISPOZICI,MISSION VERFÜGBAR,МИССИЯ ДОСТУПНА,...
```

Megjegyzés: az `original` oszlop hiányzik, és a `Korean` extra nyelvként van hozzáadva. A motor figyelmen kívül hagyja a fel nem ismert oszlopneveket, így a `Korean` dokumentációként szolgál, amíg a hivatalos koreai támogatás hozzá nem kerül.

---

## Gyakori hibák

### A `#` előtag elfelejtése scriptekben

```c
// HELYTELEN -- a nyers kulcsot jeleníti meg, nem a fordítást
label.SetText("STR_MYMOD_HELLO");

// HELYES
label.SetText("#STR_MYMOD_HELLO");
```

### A `#` használata az inputs.xml-ben

```xml
<!-- HELYTELEN -- a beviteli rendszer belsőleg adja hozzá a # jelet -->
<input name="UAMyAction" loc="#STR_MYMOD_MY_ACTION" />

<!-- HELYES -->
<input name="UAMyAction" loc="STR_MYMOD_MY_ACTION" />
```

### Duplikált kulcsok modok között

Ha két mod definiálja az `STR_CLOSE` kulcsot, a motor azt használja, amelyik PBO utoljára töltődik be. Mindig használd a mod előtagodat:

```csv
"STR_MYMOD_CLOSE","Close","Close",...
```

### Eltérő oszlopszám

Ha egy sornak kevesebb oszlopa van, mint a fejlécnek, a motor csendben kihagyhatja, vagy üres sztringeket rendelhet a hiányzó oszlopokhoz. Mindig gondoskodj arról, hogy minden sor ugyanannyi mezővel rendelkezzen, mint a fejléc.

### BOM problémák

Egyes szövegszerkesztők UTF-8 BOM-ot (byte order mark-ot) szúrnak be a fájl elejére. Ez a CSV első kulcsának csendes törését okozhatja. Ha az első sztring kulcsod soha nem oldódik fel, ellenőrizd és távolítsd el a BOM-ot.

### Vesszők használata idézőjel nélküli mezőkben

```csv
STR_MYMOD_MSG,Hello, World,Hello, World,...
```

Ez elrontja az elemzést, mert a `Hello` és a ` World` külön oszlopként kerül beolvasásra. Vagy idézőjelezd a mezőt, vagy kerüld a vesszőket az értékekben:

```csv
"STR_MYMOD_MSG","Hello, World","Hello, World",...
```
