# 4.7. fejezet: Workbench útmutató

[Főoldal](../README.md) | [<< Előző: PBO csomagolás](06-pbo-packing.md) | **Workbench útmutató** | [Következő: Épület modellezés >>](08-building-modeling.md)

---

## Bevezetés

A Workbench a Bohemia Interactive integrált fejlesztői környezete az Enfusion motorhoz. A DayZ Tools-szal szállítják, és ez az egyetlen hivatalos eszköz, amely nyelvi szinten érti az Enforce Scriptet. Bár sok modder VS Code-ban vagy más szerkesztőkben ír kódot, a Workbench nélkülözhetetlen marad olyan feladatokhoz, amelyeket más eszköz nem tud elvégezni: hibakereső csatlakoztatása egy futó DayZ példányhoz, töréspontok beállítása, kódon való lépkedés, változók vizsgálata futásidőben, `.layout` UI fájlok előnézete, játék erőforrások böngészése, és élő szkript parancsok futtatása a beépített konzolon keresztül.

---

## Tartalomjegyzék

- [Mi az a Workbench?](#what-is-workbench)
- [Telepítés és beállítás](#installation-and-setup)
- [Projekt fájlok (.gproj)](#project-files-gproj)
- [A Workbench felület](#the-workbench-interface)
- [Szkript szerkesztés](#script-editing)
- [Szkriptek debugolása](#debugging-scripts)
- [Script Console -- élő tesztelés](#script-console----live-testing)
- [UI / Layout előnézet](#ui--layout-preview)
- [Erőforrás böngésző](#resource-browser)
- [Teljesítmény profilozás](#performance-profiling)
- [Integráció a File Patching-gel](#integration-with-file-patching)
- [Gyakori Workbench problémák](#common-workbench-issues)
- [Tippek és bevált gyakorlatok](#tips-and-best-practices)

---

## Mi az a Workbench?

A Workbench a Bohemia IDE-je az Enfusion motor fejlesztéséhez. Ez az egyetlen eszköz a DayZ Tools csomagban, amely képes Enforce Scriptet fordítani, elemezni és debugolni. Hat célt szolgál:

| Cél | Leírás |
|-----|--------|
| **Szkript szerkesztés** | Szintaxis kiemelés, kódkiegészítés és hibaellenőrzés `.c` fájlokhoz |
| **Szkript hibakeresés** | Töréspontok, változó vizsgálat, hívási verem, lépésenkénti végrehajtás |
| **Erőforrás böngészés** | Játék assetek navigálása és előnézete -- modellek, textúrák, konfigok, layout-ok |
| **UI / layout előnézet** | `.layout` widget hierarchiák vizuális előnézete tulajdonság vizsgálattal |
| **Teljesítmény profilozás** | Szkript profilozás, képkocka idő elemzés, memória figyelés |
| **Szkript konzol** | Enforce Script parancsok élő végrehajtása egy futó játék példány ellen |

A Workbench ugyanazt az Enfusion szkript fordítót használja, mint maga a DayZ. Amikor a Workbench fordítási hibát jelent, az a hiba a játékban is bekövetkezik -- megbízható előzetes ellenőrzéssé téve az indítás előtt.

### Mi NEM a Workbench

- **Nem általános célú kódszerkesztő.** Hiányoznak belőle a refaktorálási eszközök, Git integráció, többkurzoros szerkesztés és a VS Code bővítmény ökoszisztémája.
- **Nem játékindító.** Továbbra is külön kell futtatnod a `DayZDiag_x64.exe`-t; a Workbench csatlakozik hozzá.
- **Nem szükséges PBO-k építéséhez.** Az AddonBuilder és a build szkriptek függetlenül kezelik a PBO csomagolást.

---

## Telepítés és beállítás

### 1. lépés: DayZ Tools telepítése

A Workbench a DayZ Tools-szal érkezik, amely ingyenesen terjesztve van a Steamen. Nyisd meg a Steam Könyvtárat, engedélyezd az **Eszközök** szűrőt, keress rá a **DayZ Tools**-ra és telepítsd (~2 GB).

### 2. lépés: Workbench megkeresése

```
Steam\steamapps\common\DayZ Tools\Bin\Workbench\
  workbenchApp.exe          <-- A Workbench futtatható fájl
  dayz.gproj                <-- Alapértelmezett projekt fájl
```

### 3. lépés: P: meghajtó csatolása

A Workbench megköveteli a P: meghajtó (workdrive) csatolását. Enélkül a Workbench nem indul el, vagy üres erőforrás böngészőt mutat. Csatold a DayZ Tools Launchen keresztül, a projekted `SetupWorkdrive.bat`-jával, vagy kézzel: `subst P: "D:\YourWorkDir"`.

### 4. lépés: Vanilla szkriptek kicsomagolása

A Workbench-nek szüksége van a vanilla DayZ szkriptekre a P:-n a mod fordításához (mivel a kódod vanilla osztályokat bővít):

```
P:\scripts\
  1_Core\
  2_GameLib\
  3_Game\
  4_World\
  5_Mission\
```

Csomagold ki ezeket a DayZ Tools Launcheren keresztül, vagy hozz létre szimbolikus linket a kicsomagolt szkriptek könyvtárára.

### 4b. lépés: Játék telepítés összekapcsolása a projekt meghajtóval (élő hotloading-hoz)

Ahhoz, hogy a DayZDiag közvetlenül a projekt meghajtóról töltse be a szkripteket (lehetővé téve az élő szerkesztést PBO újraépítések nélkül), hozz létre szimbolikus linket a DayZ telepítési mappából a `P:\scripts`-re:

1. Navigálj a DayZ telepítési mappájához (jellemzően `Steam\steamapps\common\DayZ`).
2. Töröld a benne lévő meglévő `scripts` mappát.
3. Nyiss meg egy parancssort **rendszergazdaként** és futtasd:

```batch
mklink /J "C:\...\steamapps\common\DayZ\scripts" "P:\scripts"
```

Cseréld ki az első elérési utat a tényleges DayZ telepítési útvonalra. Ezután a DayZ telepítési mappa egy `scripts` junction-t fog tartalmazni, amely a `P:\scripts`-re mutat. A projekt meghajtón végrehajtott bármely módosítás azonnal látható a játék számára.

### 5. lépés: Forrás adat könyvtár konfigurálása

1. Indítsd el a `workbenchApp.exe`-t.
2. Kattints a **Workbench > Options** menüpontra a menüsávban.
3. Állítsd a **Source data directory**-t `P:\`-re.
4. Kattints az **OK**-ra és engedd a Workbench-et újraindulni.

---

## Projekt fájlok (.gproj)

A `.gproj` fájl a Workbench projekt konfigurációja. Megmondja a Workbench-nek, hol találja a szkripteket, milyen imageset-eket töltsön be a layout előnézethez, és milyen widget stílusok érhetők el.

### Fájl helye

A konvenció szerint a mod egy `Workbench/` könyvtárába kell helyezni:

```
P:\MyMod\
  Workbench\
    dayz.gproj
  Scripts\
    3_Game\
    4_World\
    5_Mission\
  config.cpp
```

### Struktúra áttekintés

A `.gproj` saját szövegformátumot használ (nem JSON, nem XML):

```
GameProjectClass {
    ID "MyMod"
    TITLE "My Mod Name"
    Configurations {
        GameProjectConfigClass PC {
            platformHardware PC
            skeletonDefinitions "DZ/Anims/cfg/skeletons.anim.xml"

            FileSystem {
                FileSystemPathClass {
                    Name "Workdrive"
                    Directory "P:/"
                }
            }

            imageSets {
                "gui/imagesets/ccgui_enforce.imageset"
                "gui/imagesets/dayz_gui.imageset"
                "gui/imagesets/dayz_inventory.imageset"
                // ... egyéb vanilla imageset-ek ...
                "MyMod/gui/imagesets/my_imageset.imageset"
            }

            widgetStyles {
                "gui/looknfeel/dayzwidgets.styles"
                "gui/looknfeel/widgets.styles"
            }

            ScriptModules {
                ScriptModulePathClass {
                    Name "core"
                    Paths {
                        "scripts/1_Core"
                        "MyMod/Scripts/1_Core"
                    }
                    EntryPoint ""
                }
                ScriptModulePathClass {
                    Name "gameLib"
                    Paths { "scripts/2_GameLib" }
                    EntryPoint ""
                }
                ScriptModulePathClass {
                    Name "game"
                    Paths {
                        "scripts/3_Game"
                        "MyMod/Scripts/3_Game"
                    }
                    EntryPoint "CreateGame"
                }
                ScriptModulePathClass {
                    Name "world"
                    Paths {
                        "scripts/4_World"
                        "MyMod/Scripts/4_World"
                    }
                    EntryPoint ""
                }
                ScriptModulePathClass {
                    Name "mission"
                    Paths {
                        "scripts/5_Mission"
                        "MyMod/Scripts/5_Mission"
                    }
                    EntryPoint "CreateMission"
                }
                ScriptModulePathClass {
                    Name "workbench"
                    Paths { "MyMod/Workbench/ToolAddons" }
                    EntryPoint ""
                }
            }
        }
        GameProjectConfigClass XBOX_ONE { platformHardware XBOX_ONE }
        GameProjectConfigClass PS4 { platformHardware PS4 }
        GameProjectConfigClass LINUX { platformHardware LINUX }
    }
}
```

### Fő szekciók magyarázata

**FileSystem** -- Gyökér könyvtárak, ahol a Workbench fájlokat keres. Minimum a `P:/`-t tartalmazza. Hozzáadhatsz további elérési utakat (pl. a Steam DayZ telepítési könyvtárat), ha fájlok a workdrive-on kívül vannak.

**ScriptModules** -- A legfontosabb szekció. Minden motor réteget szkript könyvtárakhoz rendel:

| Modul | Réteg | EntryPoint | Cél |
|-------|-------|------------|-----|
| `core` | `1_Core` | `""` | Motor mag, alaptípusok |
| `gameLib` | `2_GameLib` | `""` | Játék könyvtár segédprogramok |
| `game` | `3_Game` | `"CreateGame"` | Felsorolások, konstansok, játék inicializálás |
| `world` | `4_World` | `""` | Entitások, menedzserek |
| `mission` | `5_Mission` | `"CreateMission"` | Küldetés hook-ok, UI panelek |
| `workbench` | (eszközök) | `""` | Workbench bővítmények |

A vanilla elérési utak jönnek először, majd a mod elérési útjai. Ha a modod más modoktól függ (mint a Community Framework), add hozzá azok elérési útjait is:

```
ScriptModulePathClass {
    Name "game"
    Paths {
        "scripts/3_Game"              // Vanilla
        "JM/CF/Scripts/3_Game"        // Community Framework
        "MyMod/Scripts/3_Game"        // A te modod
    }
    EntryPoint "CreateGame"
}
```

Egyes keretrendszerek felülírják a belépési pontokat (a CF a `"CF_CreateGame"`-t használja).

**imageSets / widgetStyles** -- Szükségesek a layout előnézethez. Vanilla imageset-ek nélkül a layout fájlok hiányzó képeket mutatnak. Mindig tartalmazza a fenti példában felsorolt 14 szabványos vanilla imageset-et.

### Létrehozás és indítás

**Hozz létre egy .gproj-t:** Másold az alapértelmezett `dayz.gproj`-t a `DayZ Tools\Bin\Workbench\`-ből, frissítsd az `ID`/`TITLE` mezőket, és add hozzá a mod szkript elérési útjait minden modulhoz.

**Indítás egyéni projekttel:**
```batch
workbenchApp.exe -project="P:\MyMod\Workbench\dayz.gproj"
```

**Indítás -mod-dal (automatikus konfiguráció a config.cpp-ből):**
```batch
workbenchApp.exe -mod=P:\MyMod
workbenchApp.exe -mod=P:\CommunityFramework;P:\MyMod
```

A `-mod` megközelítés egyszerűbb, de kevesebb kontrollt ad. Összetett több-modos beállításokhoz egy egyéni `.gproj` megbízhatóbb.

---

## A Workbench felület

### Fő menüsor

| Menü | Fő elemek |
|------|-----------|
| **File** | Projekt megnyitása, legutóbbi projektek, mentés |
| **Edit** | Kivágás, másolás, beillesztés, keresés, csere |
| **View** | Panelek be/kikapcsolása, elrendezés visszaállítása |
| **Workbench** | Opciók (forrás adat könyvtár, beállítások) |
| **Debug** | Hibakeresés indítása/leállítása, kliens/szerver váltás, töréspont kezelés |
| **Plugins** | Telepített Workbench bővítmények és eszköz kiegészítők |

### Panelek

- **Erőforrás böngésző** (bal) -- A P: meghajtó fájlfája. Dupla kattintás `.c` fájlokra a szerkesztéshez, `.layout` fájlokra az előnézethez, `.p3d`-re a modellek megtekintéséhez, `.paa`-ra a textúrák megtekintéséhez.
- **Szkript szerkesztő** (közép) -- Kódszerkesztő terület szintaxis kiemeléssel, kódkiegészítéssel, hiba aláhúzásokkal, sorszámokkal, töréspont jelölőkkel és lapfüles többfájlos szerkesztéssel.
- **Kimenet** (alul) -- Fordítói hibák/figyelmeztetések, `Print()` kimenet egy csatlakozott játékból, hibakeresési üzenetek. Ha DayZDiag-hoz csatlakozik, ez az ablak valós időben továbbítja az összes szöveget, amelyet a diagnosztikai futtatható fájl hibakeresési célból kiír -- ugyanaz a kimenet, amelyet a szkript naplókban látnál. Dupla kattintás a hibákra a forrás sorhoz navigáláshoz.
- **Tulajdonságok** (jobb) -- A kiválasztott objektum tulajdonságai. Leginkább a Layout szerkesztőben hasznos widget vizsgálathoz.
- **Konzol** -- Élő Enforce Script parancs végrehajtás.
- **Hibakeresési panelek** (hibakeresés közben) -- **Locals** (aktuális hatókör változók), **Watch** (felhasználói kifejezések), **Call Stack** (függvénylánc), **Breakpoints** (lista engedélyezés/letiltás kapcsolókkal).

---

## Szkript szerkesztés

### Fájlok megnyitása

1. **Erőforrás böngésző:** Dupla kattintás egy `.c` fájlra. Ez automatikusan megnyitja a Szkript szerkesztő modult és betölti a fájlt.
2. **Szkript szerkesztő erőforrás böngészője:** A Szkript szerkesztőnek saját beépített erőforrás böngésző panelja van, amely különálló a fő Workbench erőforrás böngészőtől. Bármelyiket használhatod szkript fájlok navigálásához és megnyitásához.
3. **File > Open:** Szabványos fájl dialógus.
4. **Hiba kimenet:** Dupla kattintás egy fordítói hibára a fájlhoz és sorhoz ugráshoz.

### Szintaxis kiemelés

| Elem | Kiemelt |
|------|---------|
| Kulcsszavak (`class`, `if`, `while`, `return`, `modded`, `override`) | Félkövér / kulcsszó szín |
| Típusok (`int`, `float`, `string`, `bool`, `vector`, `void`) | Típus szín |
| Sztringek, megjegyzések, preprocesszor direktívák | Különálló színek |

### Kódkiegészítés

Gépelj egy osztálynevet, amelyet `.` követ a metódusok és mezők megtekintéséhez, vagy nyomd meg a `Ctrl+Space`-t a javaslatokhoz. A kiegészítés a fordított szkript kontextuson alapul. Működik, de korlátozott a VS Code-hoz képest -- legjobb gyors API keresésekhez.

### Fordítói visszajelzés

A Workbench mentéskor fordít. Gyakori hibák:

| Üzenet | Jelentés |
|--------|---------|
| `Undefined variable 'xyz'` | Nincs deklarálva vagy elgépelés |
| `Method 'Foo' not found in class 'Bar'` | Rossz metódusnév vagy osztály |
| `Cannot convert 'string' to 'int'` | Típus eltérés |
| `Type 'MyClass' not found` | A fájl nincs a projektben |

### Keresés, csere és definícióra ugrás

- `Ctrl+F` / `Ctrl+H` -- keresés/csere az aktuális fájlban.
- `Ctrl+Shift+F` -- keresés az összes projekt fájlban.
- Jobb kattintás egy szimbólumon és **Go to Definition** kiválasztása a deklarációjához ugráshoz, akár vanilla szkriptekbe is.

---

## Szkriptek debugolása

A hibakeresés a Workbench legerősebb funkciója -- megállíthatsz egy futó DayZ példányt, megvizsgálhatsz minden változót, és soronként léphetsz végig a kódon.

### Előfeltételek

- **DayZDiag_x64.exe** (nem a kereskedelmi DayZ) -- csak a Diag build támogatja a hibakeresést.
- **P: meghajtó csatolva** vanilla szkriptek kicsomagolva.
- **A szkripteknek egyezniük kell** -- ha a játék betöltése után szerkesztesz, a sorszámok nem fognak egyezni.

### Hibakeresési munkamenet beállítása

1. Nyisd meg a Workbench-et és töltsd be a projektedet.
2. Nyisd meg a **Szkript szerkesztő** modult (a menüsávból vagy bármely `.c` fájlra dupla kattintva az erőforrás böngészőben -- ez automatikusan megnyitja a Szkript szerkesztőt és betölti a fájlt).
3. Indítsd el a DayZDiag-ot külön:

```batch
DayZDiag_x64.exe -filePatching -mod=P:\MyMod -connect=127.0.0.1 -port=2302
```

4. A Workbench automatikusan észleli a DayZDiag-ot és csatlakozik. Egy rövid felugró ablak jelenik meg a képernyő jobb alsó sarkában, megerősítve a csatlakozást.

> **Tipp:** Ha csak a konzol kimenetet kell látnod (nincs szükség töréspontokra vagy lépkedésre), nem kell PBO-kat kicsomagolnod vagy szkripteket betöltened a Workbench-be. A Szkript szerkesztő továbbra is csatlakozik a DayZDiag-hoz és megjeleníti a kimeneti adatfolyamot. Azonban a töréspontok és kód navigáció megkövetelik, hogy a megfelelő szkript fájlok be legyenek töltve a projektben.

### Töréspontok

Kattints a bal margóra egy sorszám mellett. Piros pont jelenik meg.

| Jelölő | Jelentés |
|--------|---------|
| Piros pont | Aktív töréspont -- a végrehajtás itt megáll |
| Sárga felkiáltójel | Érvénytelen -- ez a sor soha nem hajtódik végre |
| Kék pont | Könyvjelző -- csak navigációs jelölő |

Kapcsolás az `F9` billentyűvel. A margó területen (ahol a piros pontok megjelennek) bal kattintással is hozzáadhatsz vagy eltávolíthatsz töréspontokat. A margón jobb kattintás kék **Könyvjelzőt** ad hozzá -- a könyvjelzők nem befolyásolják a végrehajtást, de megjelölik a visszalátogatni kívánt helyeket. Jobb kattintás egy töréspontra **feltétel** beállításához (pl. `i == 10` vagy `player.GetIdentity().GetName() == "TestPlayer"`).

### Lépkedés a kódon

| Akció | Gyorsbillentyű | Leírás |
|-------|---------------|--------|
| Folytatás | `F5` | Futás a következő töréspontig |
| Átlépés | `F10` | Aktuális sor végrehajtása, ugrás a következőre |
| Belépés | `F11` | Belépés a hívott függvénybe |
| Kilépés | `Shift+F11` | Futás az aktuális függvény visszatéréséig |
| Leállítás | `Shift+F5` | Lecsatlakozás és játék folytatása |

### Változó vizsgálat

A **Locals** panel megjeleníti a hatókörben lévő összes változót -- primitíveket értékekkel, objektumokat osztálynevekkel (kibontható), tömböket hosszakkal, és NULL referenciákat világosan megjelölve. A **Watch** panel egyéni kifejezéseket értékel ki minden megállásnál. A **Call Stack** a függvényláncot mutatja; kattints a bejegyzésekre a navigáláshoz.

### Kliens vs. szerver hibakeresés

A `DayZDiag_x64.exe` működhet kliensként vagy szerverként (a `-server` indítási paraméter hozzáadásával). Elfogadja ugyanazokat a paramétereket, mint a kereskedelmi futtatható fájl. A Workbench bármelyik példányhoz csatlakozhat.

Használd a **Debug > Debug Client** vagy **Debug > Debug Server** menüpontot a Szkript szerkesztő menüjében, hogy kiválaszd, melyik oldalt debugolod. Listen szerveren szabadon válthatsz. A lépkedési vezérlők, töréspontok és változó vizsgálat mind az aktuálisan kiválasztott oldalra vonatkoznak.

### Korlátozások

- Csak a `DayZDiag_x64.exe` támogatja a hibakeresést, a kereskedelmi buildek nem.
- A motor belső C++ függvényeibe nem lehet belépni.
- Sok töréspont nagy frekvenciájú függvényekben (`OnUpdate`) súlyos késleltetést okoz.
- A nagy mod projektek lassíthatják a Workbench indexelést.

---

## Script Console -- élő tesztelés

A Script Console lehetővé teszi Enforce Script parancsok végrehajtását egy futó játék példány ellen -- felbecsülhetetlen az API kísérletezéshez fájlok szerkesztése nélkül.

### Megnyitás

Keresd a **Console** fület az alsó panelben, vagy engedélyezd a **View > Console** menüponton keresztül.

### Gyakori parancsok

```c
// Játékos pozíció kiírása
Print(GetGame().GetPlayer().GetPosition().ToString());

// Tárgy megjelenítése a játékos lábánál
GetGame().CreateObject("AKM", GetGame().GetPlayer().GetPosition(), false, false, true);

// Matematikai teszt
float dist = vector.Distance("0 0 0", "100 0 100");
Print("Distance: " + dist.ToString());

// Játékos teleportálása
GetGame().GetPlayer().SetPosition("6737 0 2505");

// Zombik megjelenítése a közelben
vector pos = GetGame().GetPlayer().GetPosition();
for (int i = 0; i < 5; i++)
{
    vector offset = Vector(Math.RandomFloat(-5, 5), 0, Math.RandomFloat(-5, 5));
    GetGame().CreateObject("ZmbF_JournalistNormal_Blue", pos + offset, false, false, true);
}
```

### Korlátozások

- Alapértelmezés szerint **csak kliens oldali** (szerver oldali kód listen szerverre van szükség).
- **Nincs állandó állapot** -- a változók nem maradnak meg a végrehajtások között.
- **Egyes API-k nem elérhetők**, amíg a játék nem ér el egy meghatározott állapotot (játékos megjelent, küldetés betöltve).
- **Nincs hiba helyreállítás** -- a null pointerek egyszerűen csendben kudarcot vallanak.

---

## UI / Layout előnézet

A Workbench meg tudja nyitni a `.layout` fájlokat vizuális vizsgálathoz.

### Amit megtehetsz

- **Widget hierarchia megtekintése** -- szülő-gyermek beágyazás és widget nevek megjelenítése.
- **Tulajdonságok vizsgálata** -- pozíció, méret, szín, alfa, igazítás, képforrás, szöveg, betűtípus.
- **Widget nevek keresése**, amelyeket a `FindAnyWidget()` használ a szkript kódban.
- **Kép hivatkozások ellenőrzése** -- melyik imageset bejegyzéseket vagy textúrákat használ egy widget.

### Amit nem tehetsz meg

- **Nincs futásidejű viselkedés** -- a ScriptClass kezelők és a dinamikus tartalom nem hajtódik végre.
- **Renderelési különbségek** -- az átlátszóság, rétegezés és felbontás eltérhet a játékon belülitől.
- **Korlátozott szerkesztés** -- a Workbench elsősorban megjelenítő, nem vizuális tervező.

**Bevált gyakorlat:** Használd a Layout szerkesztőt vizsgálathoz. Építsd és szerkeszd a `.layout` fájlokat szövegszerkesztőben. Tesztelj játékon belül file patching-gel.

---

## Erőforrás böngésző

Az erőforrás böngésző a P: meghajtón navigál játék-tudatos fájl előnézetekkel.

### Képességek

| Fájltípus | Akció dupla kattintásra |
|-----------|------------------------|
| `.c` | Megnyitás a Szkript szerkesztőben |
| `.layout` | Megnyitás a Layout szerkesztőben |
| `.p3d` | 3D modell előnézet (forgatás, nagyítás, LOD-ok vizsgálata) |
| `.paa` / `.edds` | Textúra megjelenítő csatorna vizsgálattal (R, G, B, A) |
| Konfig osztályok | Elemzett CfgVehicles, CfgWeapons hierarchiák böngészése |

### Vanilla erőforrások keresése

Az egyik legértékesebb felhasználás -- tanulmányozd, hogyan strukturálja a Bohemia az asseteket:

```
P:\DZ\weapons\        <-- Vanilla fegyver modellek és textúrák
P:\DZ\characters\     <-- Karakter modellek és ruházat
P:\scripts\4_World\   <-- Vanilla világ szkriptek
P:\scripts\5_Mission\  <-- Vanilla küldetés szkriptek
```

---

## Teljesítmény profilozás

Ha DayZDiag-hoz csatlakozik, a Workbench képes profilozni a szkript végrehajtást.

### Amit a profilozó mutat

- **Függvényhívás számok** -- milyen gyakran fut minden függvény képkockánként.
- **Végrehajtási idő** -- ezredmásodpercek függvényenként.
- **Hívási hierarchia** -- melyik függvények hívják melyikeket, idő hozzárendeléssel.
- **Képkocka idő bontás** -- szkript idő vs. motor idő. 60 FPS-nél minden képkockának ~16.6ms kerete van.
- **Memória** -- osztályonkénti allokáció számok, ref-ciklus szivárgások észlelése.

### Játékon belüli szkript profilozó (Diag menü)

A Workbench profilozójának kiegészítéseként a `DayZDiag_x64.exe` rendelkezik beépített szkript profilozóval, amely a Diag menüből érhető el (a Statistics alatt). Top-20 listákat mutat az osztályonkénti időhöz, függvényenkénti időhöz, osztály allokációkhoz, függvényenkénti darabszámhoz és osztálypéldány számokhoz. Használd a `-profile` indítási paramétert a profilozás indítástól való engedélyezéséhez. A profilozó csak az Enforce Scriptet méri -- a proto (motor) metódusok nem külön bejegyzésekként mérődnek, de végrehajtási idejük beleszámít az őket meghívó szkript metódus teljes idejébe. Lásd az `EnProfiler.c`-t a vanilla szkriptekben a programozási API-hoz (`EnProfiler.Enable`, `EnProfiler.SetModule`, jelző konstansok).

### Gyakori szűk keresztmetszetek

| Probléma | Profilozói tünet | Javítás |
|----------|-----------------|---------|
| Drága képkockánkénti kód | Magas idő az `OnUpdate`-ben | Áthelyezés időzítőkre, frekvencia csökkentése |
| Túlzott iteráció | Ciklus több ezer hívással | Eredmények gyorsítótárazása, térbeli lekérdezések használata |
| Sztring összefűzés ciklusokban | Magas allokáció szám | Naplózás csökkentése, sztringek kötegelése |

---

## Integráció a File Patching-gel

A leggyorsabb fejlesztési munkafolyamat a Workbench-et a file patching-gel kombinálja, kiküszöbölve a PBO újraépítéseket a szkript módosításokhoz.

### Beállítás

1. Szkriptek a P: meghajtón különálló fájlokként (nem PBO-kban).
2. DayZ telepítés szkriptek szimbolikus linkje: `mklink /J "...\DayZ\scripts" "P:\scripts"`
3. Indítás `-filePatching`-gel: mind a kliens, mind a szerver `DayZDiag_x64.exe`-t használ.

### A gyors iterációs ciklus

```
1. .c fájl szerkesztése a szerkesztődben
2. Mentés (a fájl már a P: meghajtón van)
3. Küldetés újraindítása a DayZDiag-ban (nincs PBO újraépítés)
4. Tesztelés játékon belül
5. Töréspontok beállítása a Workbench-ben, ha szükséges
6. Ismétlés
```

### Mi igényel újraépítést?

| Változás | Újraépítés? |
|----------|------------|
| Szkript logika (`.c`) | Nem -- küldetés újraindítás |
| Layout fájlok (`.layout`) | Nem -- küldetés újraindítás |
| Config.cpp (csak szkript) | Nem -- küldetés újraindítás |
| Config.cpp (CfgVehicles-szel) | Igen -- binarizált konfigok PBO-t igényelnek |
| Textúrák (`.paa`) | Nem -- a motor újratölti a P:-ről |
| Modellek (`.p3d`) | Talán -- csak binarizálatlan MLOD |

---

## Gyakori Workbench problémák

### Workbench összeomlik indításkor

**Ok:** P: meghajtó nincs csatolva, vagy a `.gproj` nem létező elérési utakra hivatkozik.
**Javítás:** Csatold előbb a P:-t. Ellenőrizd a **Workbench > Options** forrás könyvtárat. Ellenőrizd, hogy a `.gproj` FileSystem elérési útjai léteznek.

### Nincs kódkiegészítés

**Ok:** Projekt rosszul konfigurálva -- a Workbench nem tudja fordítani a szkripteket.
**Javítás:** Ellenőrizd, hogy a `.gproj` ScriptModules tartalmazza a vanilla elérési utakat (`scripts/1_Core`, stb.). Ellenőrizd a kimenetet fordítói hibákért. Győződj meg, hogy a vanilla szkriptek a P:-n vannak.

### Szkriptek nem fordulnak

**Javítás:** Ellenőrizd a kimeneti panelt a pontos hibákért. Ellenőrizd, hogy minden függőségi mod elérési útja a ScriptModules-ban van. Győződj meg, hogy nincsenek rétegek közötti hivatkozások (a 3_Game nem használhat 4_World típusokat).

### Töréspontok nem aktiválódnak

**Ellenőrző lista:**
1. Csatlakozva a DayZDiag-hoz (nem a kereskedelmi verzióhoz)?
2. Piros pont (érvényes) vagy sárga felkiáltójel (érvénytelen)?
3. A szkriptek egyeznek a Workbench és a játék között?
4. A megfelelő oldalt (kliens vs. szerver) debugolod?
5. A kód útvonal valóban elérhető? (Adj hozzá `Print()`-et az ellenőrzéshez.)

### Fájlok nem találhatók az erőforrás böngészőben

**Javítás:** Ellenőrizd, hogy a `.gproj` FileSystem tartalmazza azt a könyvtárat, ahol a fájljaid vannak. Indítsd újra a Workbench-et a `.gproj` módosítása után.

### "Plugin Not Found" hibák

**Javítás:** Ellenőrizd a DayZ Tools integritását a Steamen keresztül (jobb kattintás > Tulajdonságok > Telepített fájlok > Ellenőrzés). Szükség esetén telepítsd újra.

### DayZDiag csatlakozás sikertelen

**Javítás:** Mindkét folyamatnak ugyanazon a gépen kell lennie. Ellenőrizd a tűzfalakat. Győződj meg, hogy a Szkript szerkesztő modul nyitva van a DayZDiag indítása előtt. Próbáld újraindítani mindkettőt.

---

## Tippek és bevált gyakorlatok

1. **Használd a Workbench-et hibakereséshez, a VS Code-ot íráshoz.** A Workbench szerkesztője egyszerű. Használj külső szerkesztőket a napi kódoláshoz; válts a Workbench-re hibakereséshez és layout előnézethez.

2. **Tarts fenn egy .gproj-t modonként.** Minden modnak legyen saját projekt fájlja, hogy pontosan a megfelelő szkript kontextust fordítsa a nem kapcsolódó modok indexelése nélkül.

3. **Használd a konzolt API kísérletezéshez.** Teszteld az API hívásokat a konzolban, mielőtt fájlokba írnád őket. Gyorsabb, mint a szerkesztés-újraindítás-teszt ciklusok.

4. **Profilozz az optimalizálás előtt.** Ne találgasd a szűk keresztmetszeteket. A profilozó megmutatja, hol tölti a rendszer ténylegesen az időt.

5. **Állíts be töréspontokat stratégiailag.** Kerüld az `OnUpdate()` töréspontokat, hacsak nem feltételesek. Minden képkockában aktiválódnak és folyamatosan lefagyasztják a játékot.

6. **Használj könyvjelzőket a navigációhoz.** A kék könyvjelző pontok megjelölik az érdekesebb vanilla szkript helyeket, amelyekre gyakran hivatkozol.

7. **Ellenőrizd a fordítói kimenetet az indítás előtt.** Ha a Workbench hibákat jelent, a játék is hibázni fog. Javítsd a hibákat először a Workbench-ben -- gyorsabb, mint a játék indulására várni.

8. **Használj -mod-ot egyszerű beállításokhoz, .gproj-t összetettekhez.** Egyetlen mod függőségek nélkül: `-mod=P:\MyMod`. Több mod CF/Dabs-szal: egyéni `.gproj`.

9. **Tartsd frissítve a Workbench-et.** Frissítsd a DayZ Tools-t a Steamen keresztül, amikor a DayZ frissül. Eltérő verziók fordítási hibákat okoznak.

---

## Gyors referencia: billentyűparancsok

| Gyorsbillentyű | Akció |
|----------------|-------|
| `F5` | Hibakeresés indítása / Folytatás |
| `Shift+F5` | Hibakeresés leállítása |
| `F9` | Töréspont kapcsolása |
| `F10` | Átlépés |
| `F11` | Belépés |
| `Shift+F11` | Kilépés |
| `Ctrl+F` | Keresés a fájlban |
| `Ctrl+H` | Keresés és csere |
| `Ctrl+Shift+F` | Keresés a projektben |
| `Ctrl+S` | Mentés |
| `Ctrl+Space` | Kódkiegészítés |

## Gyors referencia: indítási paraméterek

| Paraméter | Leírás |
|-----------|--------|
| `-project="path/dayz.gproj"` | Meghatározott projekt fájl betöltése |
| `-mod=P:\MyMod` | Automatikus konfiguráció a mod config.cpp-jéből |
| `-mod=P:\ModA;P:\ModB` | Több mod (pontosvesszővel elválasztva) |

---

## Navigáció

| Előző | Fel | Következő |
|-------|-----|-----------|
| [4.6 PBO csomagolás](06-pbo-packing.md) | [4. rész: Fájlformátumok és DayZ Tools](01-textures.md) | [4.8 Épület modellezés](08-building-modeling.md) |
