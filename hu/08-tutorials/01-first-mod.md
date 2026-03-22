# 8.1. fejezet: Az első modod (Hello World)

[Kezdőlap](../../README.md) | **Az első modod** | [Következő: Egyéni tárgy létrehozása >>](02-custom-item.md)

---

> **Összefoglalás:** Ez az útmutató végigvezet az első DayZ mod létrehozásán az abszolút nulláról. Telepíted az eszközöket, beállítod a munkaterületet, három fájlt írsz, PBO-t csomagolsz, betöltöd a modot a DayZ-ben, és ellenőrzöd a működését a szkript log olvasásával. Nincs szükség korábbi DayZ modding tapasztalatra.

---

## Tartalomjegyzék

- [Előfeltételek](#előfeltételek)
- [1. lépés: A DayZ Tools telepítése](#1-lépés-a-dayz-tools-telepítése)
- [2. lépés: A P: meghajtó beállítása (Workdrive)](#2-lépés-a-p-meghajtó-beállítása-workdrive)
- [3. lépés: A mod könyvtárstruktúra létrehozása](#3-lépés-a-mod-könyvtárstruktúra-létrehozása)
- [4. lépés: A mod.cpp megírása](#4-lépés-a-modcpp-megírása)
- [5. lépés: A config.cpp megírása](#5-lépés-a-configcpp-megírása)
- [6. lépés: Az első szkript megírása](#6-lépés-az-első-szkript-megírása)
- [7. lépés: PBO csomagolás az Addon Builderrel](#7-lépés-pbo-csomagolás-az-addon-builderrel)
- [8. lépés: A mod betöltése a DayZ-ben](#8-lépés-a-mod-betöltése-a-dayz-ben)
- [9. lépés: Ellenőrzés a szkript logban](#9-lépés-ellenőrzés-a-szkript-logban)
- [10. lépés: Gyakori problémák megoldása](#10-lépés-gyakori-problémák-megoldása)
- [Teljes fájl referencia](#teljes-fájl-referencia)
- [Következő lépések](#következő-lépések)

---

## Előfeltételek

Mielőtt elkezded, győződj meg róla, hogy rendelkezel a következőkkel:

- Telepített **Steam** és bejelentkezve
- Telepített **DayZ** játék (kiskereskedelmi verzió a Steamből)
- Egy **szövegszerkesztő** (VS Code, Notepad++ vagy akár Jegyzettömb)
- Körülbelül **15 GB szabad lemezterület** a DayZ Tools számára

Ennyi az egész. Ehhez az útmutatóhoz nem szükséges programozási tapasztalat -- minden kódsor el van magyarázva.

---

## 1. lépés: A DayZ Tools telepítése

A DayZ Tools egy ingyenes alkalmazás a Steamen, amely mindent tartalmaz, amire szükséged van a modok építéséhez: a Workbench szkriptszerkesztőt, az Addon Buildert PBO csomagoláshoz, a Terrain Buildert és az Object Buildert.

### Hogyan telepítsük

1. Nyisd meg a **Steamet**
2. Menj a **Könyvtárba**
3. A felső legördülő szűrőben változtasd a **Játékok**-at **Eszközök**-re
4. Keress rá a **DayZ Tools**-ra
5. Kattints a **Telepítés**-re
6. Várd meg, amíg a letöltés befejeződik (körülbelül 12-15 GB)

A telepítés után a DayZ Tools a Steam könyvtáradban az Eszközök alatt található. Az alapértelmezett telepítési útvonal:

```
C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\
```

### Mi kerül telepítésre

| Eszköz | Cél |
|------|---------|
| **Addon Builder** | A mod fájljaidat `.pbo` archívumokba csomagolja |
| **Workbench** | Szkriptszerkesztő szintaxiskiemeléssel |
| **Object Builder** | 3D modell megjelenítő és szerkesztő `.p3d` fájlokhoz |
| **Terrain Builder** | Térkép/terep szerkesztő |
| **TexView2** | Textúra megjelenítő/konverter (`.paa`, `.edds`) |

Ehhez az útmutatóhoz csak az **Addon Builder**-re van szükséged. A többiek később lesznek hasznosak.

---

## 2. lépés: A P: meghajtó beállítása (Workdrive)

A DayZ modding egy virtuális meghajtóbetűjelet használ, a **P:**-t, mint közös munkaterületet. Minden mod és játékadat P:-vel kezdődő útvonalakra hivatkozik, ami konzisztens útvonalakat biztosít különböző gépeken.

### A P: meghajtó létrehozása

1. Nyisd meg a **DayZ Tools**-t a Steamből
2. A DayZ Tools főablakában kattints a **P: Drive Management**-re (vagy keress egy "Mount P drive" / "Setup P drive" feliratú gombot)
3. Kattints a **Create/Mount P: Drive**-ra
4. Válassz helyet a P: meghajtó adatainak (az alapértelmezett megfelelő, vagy válassz egy meghajtót elegendő hellyel)
5. Várd meg, amíg a folyamat befejeződik

### A működés ellenőrzése

Nyisd meg a **Fájlkezelőt** és navigálj a `P:\`-re. Egy könyvtárat kell látnod, amely DayZ játékadatokat tartalmaz. Ha a P: meghajtó létezik és böngészni tudod, készen állsz a folytatásra.

### Alternatíva: Kézi P: meghajtó

Ha a DayZ Tools GUI nem működik, a P: meghajtót manuálisan is létrehozhatod a Windows parancssorból (Rendszergazdaként futtatva):

```batch
subst P: "C:\DayZWorkdrive"
```

Cseréld ki a `C:\DayZWorkdrive`-ot bármely mappára. Ez egy ideiglenes meghajtó-leképezést hoz létre, amely az újraindításig tart. Állandó leképezéshez használd a `net use`-t vagy a DayZ Tools GUI-t.

### Mi van, ha nem akarom használni a P: meghajtót?

Fejleszthetsz a P: meghajtó nélkül is, ha a mod mappádat közvetlenül a DayZ játékkönyvtárba helyezed és `-filePatching` módot használsz. Azonban a P: meghajtó a szabványos munkafolyamat, és minden hivatalos dokumentáció feltételezi. Határozottan javasoljuk a beállítását.

---

## 3. lépés: A mod könyvtárstruktúra létrehozása

Minden DayZ mod egy adott mappastruktúrát követ. Hozd létre a következő könyvtárakat és fájlokat a P: meghajtódon (vagy a DayZ játékkönyvtáradban, ha nem használsz P:-t):

```
P:\MyFirstMod\
    mod.cpp
    Scripts\
        config.cpp
        5_Mission\
            MyFirstMod\
                MissionHello.c
```

### Mappák létrehozása

1. Nyisd meg a **Fájlkezelőt**
2. Navigálj a `P:\`-re
3. Hozz létre egy új mappát `MyFirstMod` néven
4. A `MyFirstMod`-on belül hozz létre egy `Scripts` mappát
5. A `Scripts`-en belül hozz létre egy `5_Mission` mappát
6. Az `5_Mission`-on belül hozz létre egy `MyFirstMod` mappát

### A struktúra megértése

| Útvonal | Cél |
|------|---------|
| `MyFirstMod/` | A mod gyökérkönyvtára |
| `mod.cpp` | Metaadatok (név, szerző) a DayZ launcherben megjelenítve |
| `Scripts/config.cpp` | Megmondja a motornak, mitől függ a mod és hol vannak a szkriptek |
| `Scripts/5_Mission/` | A misszió szkriptréteg (UI, indítási hookok) |
| `Scripts/5_Mission/MyFirstMod/` | Almappa a mod misszió szkriptjeihez |
| `Scripts/5_Mission/MyFirstMod/MissionHello.c` | A tényleges szkriptfájlod |

Pontosan **3 fájlra** van szükséged. Hozzuk létre őket egyenként.

---

## 4. lépés: A mod.cpp megírása

Hozd létre a `P:\MyFirstMod\mod.cpp` fájlt a szövegszerkesztődben és illeszd be ezt a tartalmat:

```cpp
name = "My First Mod";
author = "YourName";
version = "1.0";
overview = "My very first DayZ mod. Prints Hello World to the script log.";
```

### Mit csinál minden sor

- **`name`** -- A DayZ launcher modlistájában megjelenő név. A játékosok ezt látják a modok kiválasztásakor.
- **`author`** -- A neved vagy a csapat neve.
- **`version`** -- Bármilyen verzió szöveg. A motor nem értelmezi.
- **`overview`** -- A mod részleteinél megjelenő leírás.

Mentsd el a fájlt. Ez a mod személyi igazolványa.

---

## 5. lépés: A config.cpp megírása

Hozd létre a `P:\MyFirstMod\Scripts\config.cpp` fájlt és illeszd be ezt a tartalmat:

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### Mit csinál minden szekció

A **CfgPatches** deklarálja a mododat a DayZ motornak:

- `class MyFirstMod_Scripts` -- Egyedi azonosító a mod szkriptcsomagjához. Nem ütközhet más modokkal.
- `units[] = {}; weapons[] = {};` -- A mod által hozzáadott entitások és fegyverek listája. Egyelőre üres.
- `requiredVersion = 0.1;` -- Minimális játékverzió. Mindig `0.1`.
- `requiredAddons[] = { "DZ_Data" };` -- Függőségek. A `DZ_Data` az alapjáték adatai. Ez biztosítja, hogy a mod **az** alapjáték **után** töltődik be.

A **CfgMods** megmondja a motornak, hol vannak a szkriptek:

- `dir = "MyFirstMod";` -- A mod gyökérkönyvtára.
- `type = "mod";` -- Ez egy kliens+szerver mod (szemben a `"servermod"`-dal, ami csak szerverre vonatkozik).
- `dependencies[] = { "Mission" };` -- A kódod a Mission szkriptmodulba kapcsolódik.
- `class missionScriptModule` -- Megmondja a motornak, hogy fordítsa le az összes `.c` fájlt a `MyFirstMod/Scripts/5_Mission/` mappában.

**Miért csak `5_Mission`?** Mert a Hello World szkriptünk a misszió indítási eseményébe kapcsolódik, ami a misszió rétegben él. A legtöbb egyszerű mod itt kezdődik.

---

## 6. lépés: Az első szkript megírása

Hozd létre a `P:\MyFirstMod\Scripts\5_Mission\MyFirstMod\MissionHello.c` fájlt és illeszd be ezt a tartalmat:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The CLIENT mission has started.");
    }
};
```

### Soronkénti magyarázat

```c
modded class MissionServer
```
A `modded` kulcsszó a DayZ modding szíve. Azt mondja: "Vedd a meglévő `MissionServer` osztályt a vanília játékból és add hozzá a módosításaimat." Nem hozol létre új osztályt -- a meglévőt bővíted.

```c
    override void OnInit()
```
Az `OnInit()` metódust a motor hívja meg, amikor egy misszió elindul. Az `override` megmondja a fordítónak, hogy ez a metódus már létezik a szülőosztályban, és mi a saját verziónkra cseréljük.

```c
        super.OnInit();
```
**Ez a sor kritikus.** A `super.OnInit()` meghívja az eredeti vanília implementációt. Ha kihagyod, a vanília misszió inicializációs kódja soha nem fut le, és a játék elromlik. Mindig hívd meg a `super`-t először.

```c
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
```
A `Print()` üzenetet ír a DayZ szkript logfájlba. A `[MyFirstMod]` előtag megkönnyíti az üzeneteid megtalálását a logban.

```c
modded class MissionGameplay
```
A `MissionGameplay` a `MissionServer` kliens oldali megfelelője. Amikor egy játékos csatlakozik egy szerverhez, a `MissionGameplay.OnInit()` az ő gépén fut le. Mindkét osztály modolásával az üzeneted mind a szerver, mind a kliens logban megjelenik.

### A `.c` fájlokról

A DayZ szkriptek `.c` fájlkiterjesztést használnak. Bár C-nek tűnnek, ez az **Enforce Script**, a DayZ saját szkriptnyelve. Vannak benne osztályok, öröklés, tömbök és mapek, de nem C, C++ vagy C#. Az IDE-d szintaxishibákat mutathat -- ez normális és várt viselkedés.

---

## 7. lépés: PBO csomagolás az Addon Builderrel

A DayZ modokat `.pbo` archív fájlokból tölti be (hasonlóak a .zip-hez, de a motor által értett formátumban). A `Scripts` mappádat PBO-ba kell csomagolnod.

### Az Addon Builder használata (GUI)

1. Nyisd meg a **DayZ Tools**-t a Steamből
2. Kattints az **Addon Builder**-re az indításhoz
3. Állítsd a **Source directory**-t erre: `P:\MyFirstMod\Scripts\`
4. Állítsd az **Output/Destination directory**-t egy új mappára: `P:\@MyFirstMod\Addons\`

   Hozd létre a `@MyFirstMod\Addons\` mappát először, ha nem létezik.

5. Az **Addon Builder Options**-ban:
   - Állítsd a **Prefix**-et erre: `MyFirstMod\Scripts`
   - A többi beállítást hagyd alapértelmezetten
6. Kattints a **Pack**-ra

Ha sikeres, egy fájlt fogsz látni itt:

```
P:\@MyFirstMod\Addons\Scripts.pbo
```

### A végleges modstruktúra beállítása

Most másold a `mod.cpp` fájlt az `Addons` mappa mellé:

```
P:\@MyFirstMod\
    mod.cpp                         <-- Másolat a P:\MyFirstMod\mod.cpp-ból
    Addons\
        Scripts.pbo                 <-- Az Addon Builder által létrehozva
```

A `@` előtag a mappanéven a terjeszthető modok konvenciója. Jelzi a szerveradminisztrátoroknak és a launchernek, hogy ez egy modcsomag.

### Alternatíva: Tesztelés csomagolás nélkül (File Patching)

Fejlesztés során teljesen kihagyhatod a PBO csomagolást file patching módban. Ez közvetlenül a forrásmappáidból tölti be a szkripteket:

```
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

A file patching gyorsabb az iterációhoz, mert szerkeszted a `.c` fájlt, újraindítod a játékot, és azonnal látod a változásokat. Nincs szükség csomagolási lépésre. Azonban a file patching csak a diagnosztikai végrehajtható fájllal (`DayZDiag_x64.exe`) működik, és nem alkalmas terjesztésre.

---

## 8. lépés: A mod betöltése a DayZ-ben

Kétféleképpen töltheted be a mododat: a launcheren keresztül vagy parancssori paraméterekkel.

### A opció: DayZ Launcher

1. Nyisd meg a **DayZ Launchert** a Steamből
2. Menj a **Mods** fülre
3. Kattints az **Add local mod**-ra (vagy "Add mod from local storage")
4. Navigálj a `P:\@MyFirstMod\` mappához
5. Engedélyezd a modot a jelölőnégyzet bejelölésével
6. Kattints a **Play**-re (győződj meg róla, hogy helyi/offline szerverhez csatlakozol, vagy egyjátékos módot indítasz)

### B opció: Parancssor (fejlesztéshez ajánlott)

Gyorsabb iterációhoz indítsd a DayZ-t közvetlenül parancssori paraméterekkel. Hozz létre egy parancsikont vagy batch fájlt:

**A diagnosztikai végrehajtható fájl használata (file patching-gel, PBO nélkül):**

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ\DayZDiag_x64.exe" -mod=P:\MyFirstMod -filePatching -server -config=serverDZ.cfg -port=2302
```

**A csomagolt PBO használata:**

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ\DayZDiag_x64.exe" -mod=P:\@MyFirstMod -server -config=serverDZ.cfg -port=2302
```

A `-server` jelző helyi listen szervert indít. A `-filePatching` jelző lehetővé teszi a szkriptek betöltését csomagolatlan mappákból.

### Gyorsteszt: Offline mód

A leggyorsabb tesztelési mód a DayZ offline módban való indítása:

```batch
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

Ezután a főmenüben kattints a **Play**-re és válaszd az **Offline Mode**-ot (vagy **Community Offline**-t). Ez helyi egyjátékos munkamenetet indít szerver nélkül.

---

## 9. lépés: Ellenőrzés a szkript logban

A DayZ moddal való indítás után a motor minden `Print()` kimenetet logfájlokba ír.

### Logfájlok megtalálása

A DayZ a logokat a helyi AppData könyvtáradban tárolja:

```
C:\Users\<WindowsFelhasznaloNeved>\AppData\Local\DayZ\
```

Gyors elérés:
1. Nyomd meg a **Win + R** gombot a Futtatás párbeszédpanel megnyitásához
2. Írd be: `%localappdata%\DayZ` és nyomd meg az Entert

Keresd a legfrissebb fájlt ilyen névvel:

```
script_<datum>_<ido>.log
```

Például: `script_2025-01-15_14-30-22.log`

### Mit keress

Nyisd meg a logfájlt a szövegszerkesztődben és keress rá a `[MyFirstMod]`-ra. Az alábbi üzenetek egyikét kellene látnod:

```
[MyFirstMod] Hello World! The SERVER mission has started.
```

vagy (ha kliensként töltötted be):

```
[MyFirstMod] Hello World! The CLIENT mission has started.
```

**Ha látod az üzenetedet: gratulálunk.** Az első DayZ modod működik. Sikeresen:

1. Létrehoztál egy mod könyvtárstruktúrát
2. Írtál egy konfigurációt, amelyet a motor olvas
3. Bekapcsolódtál a vanília játékkódba `modded class` segítségével
4. Kimenetet nyomtattál a szkript logba

### Mi van, ha hibákat látsz?

Ha a log `SCRIPT (E):`-vel kezdődő sorokat tartalmaz, valami elromlott. Olvasd el a következő szekciót.

---

## 10. lépés: Gyakori problémák megoldása

### Probléma: Nincs log kimenet egyáltalán (a mod nem tűnik betöltöttnek)

**Ellenőrizd az indítási paramétereket.** A `-mod=` útvonalnak a helyes mappára kell mutatnia. Ha file patching-et használsz, ellenőrizd, hogy az útvonal közvetlenül a `Scripts/config.cpp`-t tartalmazó mappára mutat (nem a `@` mappára).

**Ellenőrizd, hogy a config.cpp a megfelelő szinten létezik.** A `Scripts/config.cpp`-ben kell lennie a mod gyökerén belül. Ha rossz mappában van, a motor csendben figyelmen kívül hagyja a mododat.

**Ellenőrizd a CfgPatches osztálynevet.** Ha nincs `CfgPatches` blokk, vagy a szintaxisa hibás, az egész PBO kihagyásra kerül.

**Nézd meg a fő DayZ logot** (nem csak a szkript logot). Ellenőrizd:
```
C:\Users\<Neved>\AppData\Local\DayZ\DayZ_<datum>_<ido>.RPT
```
Keress a mod nevére. Olyan üzeneteket láthatsz, mint "Addon MyFirstMod_Scripts requires addon DZ_Data which is not loaded."

### Probléma: `SCRIPT (E): Undefined variable` vagy `Undefined type`

Ez azt jelenti, hogy a kódod olyan dologra hivatkozik, amit a motor nem ismer fel. Gyakori okok:

- **Elgépelés az osztálynévben.** `MisionServer` a `MissionServer` helyett (figyelj a dupla 's'-re).
- **Rossz szkriptréteg.** Ha a `PlayerBase`-re hivatkozol az `5_Mission`-ből, annak működnie kell. De ha véletlenül a `3_Game`-be helyezted a fájlodat és misszió típusokra hivatkozol, ezt a hibát kapod.
- **Hiányzó `super.OnInit()` hívás.** Kihagyása kaszkádos hibákat okozhat.

### Probléma: `SCRIPT (E): Member not found`

A metódus, amelyet hívni próbálsz, nem létezik az osztályon. Ellenőrizd kétszer a metódusnevet, és győződj meg róla, hogy valódi vanília metódust írsz felül. Az `OnInit` létezik a `MissionServer`-en és a `MissionGameplay`-en -- de nem minden osztályon.

### Probléma: A mod betöltődik, de a szkript soha nem fut le

- **Fájlkiterjesztés:** Győződj meg róla, hogy a szkriptfájlod `.c`-re végződik (nem `.c.txt` vagy `.cs`). A Windows alapértelmezetten elrejtheti a kiterjesztéseket.
- **Szkript útvonal eltérés:** A `files[]` útvonalnak a `config.cpp`-ben meg kell egyeznie a tényleges könyvtáraddal. A `"MyFirstMod/Scripts/5_Mission"` azt jelenti, hogy a motor pontosan ezen az útvonalon keresi a mappát a mod gyökeréhez képest.
- **Osztálynév:** A `modded class MissionServer` megkülönbözteti a kis- és nagybetűket. Pontosan meg kell egyeznie a vanília osztálynévvel.

### Probléma: PBO csomagolási hibák

- Győződj meg róla, hogy a `config.cpp` annak a gyökérszintjén van, amit csomagolsz (a `Scripts/` mappa).
- Ellenőrizd, hogy az Addon Builder-ben lévő prefix megegyezik a mod útvonaladdal.
- Győződj meg róla, hogy a Scripts mappában nincsenek nem-szöveges fájlok keverve (nincs `.exe`, `.dll` vagy bináris fájl).

### Probléma: A játék összeomlik indításkor

- Ellenőrizd a szintaxishibákat a `config.cpp`-ben. Egy hiányzó pontosvessző, zárójel vagy idézőjel összeomlást okozhat a konfigurációs parserben.
- Ellenőrizd, hogy a `requiredAddons` érvényes addon neveket sorol fel. Egy elgépelt addon név kemény hibát okoz.
- Távolítsd el a mododat az indítási paraméterekből és erősítsd meg, hogy a játék nélküle elindul. Ezután add vissza a probléma izolálásához.

---

## Teljes fájl referencia

Íme mindhárom fájl teljes formában, könnyű másoláshoz:

### 1. fájl: `MyFirstMod/mod.cpp`

```cpp
name = "My First Mod";
author = "YourName";
version = "1.0";
overview = "My very first DayZ mod. Prints Hello World to the script log.";
```

### 2. fájl: `MyFirstMod/Scripts/config.cpp`

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### 3. fájl: `MyFirstMod/Scripts/5_Mission/MyFirstMod/MissionHello.c`

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The CLIENT mission has started.");
    }
};
```

---

## Következő lépések

Most, hogy van egy működő modod, íme a természetes továbbfejlődési irányok:

1. **[8.2. fejezet: Egyéni tárgy létrehozása](02-custom-item.md)** -- Definiálj egy új játékbeli tárgyat textúrákkal és spawnolással.
2. **Adj hozzá több szkriptréteget** -- Hozz létre `3_Game` és `4_World` mappákat a konfiguráció, adatosztályok és entitás logika szervezéséhez. Lásd [2.1. fejezet: Az ötréteges szkript hierarchia](../02-mod-structure/01-five-layers.md).
3. **Adj hozzá billentyűkiosztásokat** -- Hozz létre egy `Inputs.xml` fájlt és regisztrálj egyéni billentyűműveleteket.
4. **Hozz létre UI-t** -- Építs játékbeli paneleket layout fájlok és `ScriptedWidgetEventHandler` használatával. Lásd [3. fejezet: GUI rendszer](../03-gui-system/01-widget-types.md).
5. **Használj keretrendszert** -- Integrálj a Community Framework-kel (CF) vagy más keretrendszerrel haladó funkciókhoz, mint RPC, konfiguráció-kezelés és admin panelek.

---

## Bevált gyakorlatok

- **Mindig tesztelj `-filePatching`-gel PBO-k építése előtt.** Kiiktatja a csomagolás-másolás-újraindítás ciklust és az iterációs időt percekről másodpercekre csökkenti.
- **Kezdd az `5_Mission` réteggel a leggyorsabb iterációhoz.** A misszió hookok, mint az `OnInit()`, a legegyszerűbb módja annak bizonyítására, hogy a mod betöltődik és fut. Csak akkor adj hozzá `3_Game`-et és `4_World`-öt, amikor tényleg szükséged van rájuk.
- **Mindig hívd meg a `super`-t először a felülírt metódusokban.** A `super.OnInit()` kihagyása csendben elrontja a vanília viselkedést és minden más modot, ami ugyanebbe a metódusba kapcsolódik.
- **Használj egyedi előtagot a Print kimenetben** (pl. `[MyFirstMod]`). A szkript logok ezernyi sort tartalmaznak a vanília játékból és más modokból -- az előtag az egyetlen módja a kimenet gyors megtalálásának.
- **Tartsd a `config.cpp` szintaxisát egyszerűnek és érvényesnek.** Egy hiányzó pontosvessző vagy zárójel a config.cpp-ben kemény összeomlást vagy csendes mod-kihagyást okoz egyértelmű hibaüzenet nélkül.

---

## Elmélet vs. gyakorlat

| Fogalom | Elmélet | Valóság |
|---------|--------|---------|
| `mod.cpp` mezők | A `version` függőségi feloldáshoz használt | A motor teljesen figyelmen kívül hagyja a verzió szöveget -- tisztán kozmetikus a launchernek. |
| CfgPatches `requiredAddons` | Felsorolja a függőségeket, hogy a mod a megfelelő sorrendben töltődjön be | Ha elgépeled az addon nevet, az egész PBO csendben kihagyásra kerül hiba nélkül a szkript logban. Ellenőrizd a `.RPT` fájlt. |
| File patching | Szerkeszd a `.c` fájlt és csatlakozz újra az azonnali változásokhoz | A `config.cpp` és az újonnan hozzáadott fájlok NEM tartoznak a file patching hatálya alá. Azokhoz továbbra is PBO újraépítés szükséges. |
| Offline mód tesztelés | Gyors módja a mod működésének ellenőrzésének | Néhány API (mint a `GetGame().GetPlayer().GetIdentity()`) NULL-t ad vissza offline módban, ami olyan összeomlásokat okoz, amelyek valódi szerveren nem fordulnak elő. |

---

## Mit tanultál

Ebben az útmutatóban megtanultad:
- Hogyan telepítsd a DayZ Tools-t és állítsd be a P: meghajtó munkaterületet
- A három alapvető fájlt, amelyre minden modnak szüksége van: `mod.cpp`, `config.cpp` és legalább egy `.c` szkript
- Hogyan bővíti a `modded class` a vanília osztályokat anélkül, hogy lecserélné őket
- Hogyan csomagolj PBO-t, tölts be modot és ellenőrizd a működését a szkript log olvasásával

**Következő:** [8.2. fejezet: Egyéni tárgy létrehozása](02-custom-item.md)
