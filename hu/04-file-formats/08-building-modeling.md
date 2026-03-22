# 4.8. fejezet: Épület modellezés -- Ajtók és létrák

[Főoldal](../README.md) | [<< Előző: Workbench útmutató](07-workbench-guide.md) | **Épület modellezés**

---

## Bevezetés

A DayZ épületei többek, mint statikus díszletek. A játékosok folyamatosan interakcióba lépnek velük -- ajtókat nyitnak, létrákon másznak, falak mögé bújnak. Egy olyan egyéni épület létrehozása, amely támogatja ezeket az interakciókat, gondos modell beállítást igényel: az ajtóknak forgástengelyekre és elnevezett szelekciókra van szükségük több LOD-on keresztül, a létráknak pedig precízen elhelyezett mászási útvonalakra, amelyeket teljes egészében Memory LOD csúcspontokon keresztül definiálnak.

Ez a fejezet az interaktív ajtók és megmászható létrák egyéni épületmodellekhez való hozzáadásának teljes munkafolyamatát ismerteti, a hivatalos Bohemia Interactive dokumentáció alapján.

### Előfeltételek

- Működő **Work-drive** az egyéni mod mappa struktúrával.
- **Object Builder** (a DayZ Tools csomagból) a **Buldozer** (modell előnézet) konfigurálásával.
- Képesség egyéni mod fájlok binarizálására és PBO-kba csomagolására.
- Az LOD rendszer és az elnevezett szelekciók ismerete (lásd: [4.2. fejezet: 3D modellek](02-models.md)).

---

## Tartalomjegyzék

- [Áttekintés](#introduction)
- [Ajtó konfiguráció](#door-configuration)
  - [Modell beállítás](#model-setup-for-doors)
  - [model.cfg -- Csontvázak és animációk](#modelcfg----skeletons-and-animations)
  - [Játék konfiguráció (config.cpp)](#game-config-configcpp)
  - [Dupla ajtók](#double-doors)
  - [Toló ajtók](#shifting-doors)
  - [Határoló gömb problémák](#bounding-sphere-issues)
- [Létra konfiguráció](#ladder-configuration)
  - [Támogatott létra típusok](#supported-ladder-types)
  - [Memory LOD elnevezett szelekciók](#memory-lod-named-selections)
  - [View Geometry követelmények](#view-geometry-requirements)
  - [Létra méretek](#ladder-dimensions)
  - [Ütközési tér](#collision-space)
  - [Konfigurációs követelmények létrákhoz](#config-requirements-for-ladders)
- [Modell követelmények összefoglalása](#model-requirements-summary)
- [Legjobb gyakorlatok](#best-practices)
- [Gyakori hibák](#common-mistakes)
- [Hivatkozások](#references)

---

## Ajtó konfiguráció

Az interaktív ajtók három dolog összhangját igénylik: a P3D modell helyesen elnevezett szelekciókkal és memória pontokkal, egy `model.cfg`, amely definiálja az animációs csontvázat és forgási paramétereket, és egy `config.cpp` játék konfiguráció, amely összekapcsolja az ajtót a hangokkal, sérülési zónákkal és játék logikával.

### Modell beállítás ajtókhoz

Egy ajtónak a P3D modellben a következőket kell tartalmaznia:

1. **Elnevezett szelekciók az összes releváns LOD-on keresztül.** Az ajtót képviselő geometriát hozzá kell rendelni egy elnevezett szelekcióhoz (pl. `door1`) mindegyik LOD-ban:
   - **Resolution LOD** -- a játékos által látható vizuális háló.
   - **Geometry LOD** -- a fizikai ütközési alakzat. Tartalmaznia kell egy `class` nevű tulajdonságot `house` értékkel is.
   - **View Geometry LOD** -- láthatósági ellenőrzésekhez és akció sugárvetéshez. A szelekció neve itt megfelel a játék konfigurációban lévő `component` paraméternek.
   - **Fire Geometry LOD** -- ballisztikus találat érzékeléshez.

2. **Memory LOD csúcspontok**, amelyek definiálják:
   - **Forgástengely** -- Két csúcspont, amely a forgástengelyt alkotja, egy elnevezett szelekcióhoz rendelve, mint `door1_axis`. Ez a tengely határozza meg a zsanér vonalat, amely körül az ajtó fordul.
   - **Hang pozíció** -- Egy csúcspont egy elnevezett szelekcióhoz rendelve, mint `door1_action`, amely jelzi, honnan származnak az ajtóhangok.
   - **Akció widget pozíció** -- Ahol az interakciós widget megjelenik a játékos számára.

#### Ajánlott ajtó méretek

A vanilla DayZ szinte minden ajtaja **120 x 220 cm** (szélesség x magasság). Ezeknek a szabványos méreteknek a használata biztosítja, hogy az animációk helyesen nézzenek ki és a karakterek természetesen átférjenek a nyílásokon. Modellezd az ajtókat **alapértelmezetten zárva** és animáld őket nyitott pozícióba -- a Bohemia tervezi, hogy a jövőben mindkét irányban nyitható ajtókat támogat.

### model.cfg -- Csontvázak és animációk

Minden animált ajtóhoz `model.cfg` fájl szükséges. Ez a konfiguráció definiálja a csontstruktúrát (csontváz) és az animációs paramétereket. Helyezd a `model.cfg`-t a modellfájlod közelébe, vagy magasabban a mappa struktúrában -- a pontos hely rugalmas, amíg a binarizáló megtalálja.

A `model.cfg`-nek két szekciója van:

#### CfgSkeletons

Definiálja az animált csontokat. Minden ajtó kap egy csont bejegyzést. A csontok párokként vannak felsorolva: a csont neve, amelyet a szülője követ (üres sztring `""` a gyökér szintű csontokhoz).

```cpp
class CfgSkeletons
{
    class Default
    {
        isDiscrete = 1;
        skeletonInherit = "";
        skeletonBones[] = {};
    };
    class Skeleton_2door: Default
    {
        skeletonInherit = "Default";
        skeletonBones[] =
        {
            "door1", "",
            "door2", ""
        };
    };
};
```

#### CfgModels

Definiálja az animációkat minden csonthoz. A `CfgModels` alatti osztálynévnek **meg kell egyeznie a modellfájl nevével** (kiterjesztés nélkül), hogy a kapcsolat működjön.

```cpp
class CfgModels
{
    class Default
    {
        sectionsInherit = "";
        sections[] = {};
        skeletonName = "";
    };
    class yourmodelname: Default
    {
        skeletonName = "Skeleton_2door";
        class Animations
        {
            class Door1
            {
                type = "rotation";
                selection = "door1";
                source = "door1";
                axis = "door1_axis";
                memory = 1;
                minValue = 0;
                maxValue = 1;
                angle0 = 0;
                angle1 = 1.4;
            };
            class Door2
            {
                type = "rotation";
                selection = "door2";
                source = "door2";
                axis = "door2_axis";
                memory = 1;
                minValue = 0;
                maxValue = 1;
                angle0 = 0;
                angle1 = -1.4;
            };
        };
    };
};
```

**Kulcs paraméterek magyarázata:**

| Paraméter | Leírás |
|-----------|-------------|
| `type` | Animáció típus. Használj `"rotation"`-t lengő ajtókhoz, `"translation"`-t csúszó ajtókhoz. |
| `selection` | Az a elnevezett szelekció a modellben, amelyet animálni kell. |
| `source` | Kapcsolódik a játék konfiguráció `Doors` osztályához. Meg kell egyeznie a `config.cpp` osztálynevével. |
| `axis` | Elnevezett szelekció a Memory LOD-ban, amely a forgástengelyt definiálja (két csúcspont). |
| `memory` | Állítsd `1`-re, hogy jelezd, a tengely a Memory LOD-ban van definiálva. |
| `minValue` / `maxValue` | Animációs fázis tartomány. Jellemzően `0`-tól `1`-ig. |
| `angle0` / `angle1` | Forgási szögek **radiánban**. Az `angle1` határozza meg, mennyire nyílik ki az ajtó. Használj negatív értékeket az irány megfordításához. Az `1.4` radián megközelítőleg 80 fok. |

#### Ellenőrzés a Buldozerben

A `model.cfg` megírása után nyisd meg a modelled az Object Builderben a Buldozer futtatásával. Használd a `[` és `]` billentyűket az elérhető animációs források közötti váltáshoz, és a `;` / `'` billentyűket (vagy az egér görgőjét fel/le) az animáció előre- és hátraléptetéséhez. Ez lehetővé teszi az ellenőrzést, hogy az ajtó helyesen forog-e a tengelye körül.

### Játék konfiguráció (config.cpp)

A játék konfiguráció összekapcsolja az animált modellt a játék rendszerekkel -- hangok, sérülés és ajtó állapot logika. A konfiguráció osztálynévnek **kötelezően** a `land_modellnév` mintát kell követnie a helyes összekapcsoláshoz.

```cpp
class CfgPatches
{
    class yourcustombuilding
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = {"DZ_Data"};
        author = "yourname";
        name = "addonname";
        url = "";
    };
};

class CfgVehicles
{
    class HouseNoDestruct;
    class land_modelname: HouseNoDestruct
    {
        model = "\path\to\your\model\file.p3d";
        class Doors
        {
            class Door1
            {
                displayName = "door 1";
                component = "Door1";
                soundPos = "door1_action";
                animPeriod = 1;
                initPhase = 0;
                initOpened = 0.5;
                soundOpen = "sound open";
                soundClose = "sound close";
                soundLocked = "sound locked";
                soundOpenABit = "sound openabit";
            };
            class Door2
            {
                displayName = "door 2";
                component = "Door2";
                soundPos = "door2_action";
                animPeriod = 1;
                initPhase = 0;
                initOpened = 0.5;
                soundOpen = "sound open";
                soundClose = "sound close";
                soundLocked = "sound locked";
                soundOpenABit = "sound openabit";
            };
        };
        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 1000;
                };
            };
            class GlobalArmor
            {
                class Projectile
                {
                    class Health { damage = 0; };
                    class Blood { damage = 0; };
                    class Shock { damage = 0; };
                };
                class Melee
                {
                    class Health { damage = 0; };
                    class Blood { damage = 0; };
                    class Shock { damage = 0; };
                };
            };
            class DamageZones
            {
                class Door1
                {
                    class Health
                    {
                        hitpoints = 1000;
                        transferToGlobalCoef = 0;
                    };
                    componentNames[] = {"door1"};
                    fatalInjuryCoef = -1;
                    class ArmorType
                    {
                        class Projectile
                        {
                            class Health { damage = 2; };
                            class Blood { damage = 0; };
                            class Shock { damage = 0; };
                        };
                        class Melee
                        {
                            class Health { damage = 2.5; };
                            class Blood { damage = 0; };
                            class Shock { damage = 0; };
                        };
                    };
                };
                class Door2
                {
                    class Health
                    {
                        hitpoints = 1000;
                        transferToGlobalCoef = 0;
                    };
                    componentNames[] = {"door2"};
                    fatalInjuryCoef = -1;
                    class ArmorType
                    {
                        class Projectile
                        {
                            class Health { damage = 2; };
                            class Blood { damage = 0; };
                            class Shock { damage = 0; };
                        };
                        class Melee
                        {
                            class Health { damage = 2.5; };
                            class Blood { damage = 0; };
                            class Shock { damage = 0; };
                        };
                    };
                };
            };
        };
    };
};
```

**Ajtó konfiguráció paraméterek magyarázata:**

| Paraméter | Leírás |
|-----------|-------------|
| `component` | Elnevezett szelekció a **View Geometry LOD**-ban, amely ehhez az ajtóhoz használt. |
| `soundPos` | Elnevezett szelekció a **Memory LOD**-ban, ahol az ajtóhangok lejátszásra kerülnek. |
| `animPeriod` | Az ajtó animáció sebessége (másodpercben). |
| `initPhase` | Kezdeti animációs fázis (`0` = zárt, `1` = teljesen nyitott). Teszteld a Buldozerben, hogy melyik érték melyik állapotnak felel meg. |
| `initOpened` | Annak valószínűsége, hogy az ajtó nyitva jelenik meg a világban. `0.5` 50%-os esélyt jelent. |
| `soundOpen` | A `CfgActionSounds`-ból származó hangkategória, amely az ajtó nyitásakor szól. Lásd `DZ\sounds\hpp\config.cpp` az elérhető hangkészletekért. |
| `soundClose` | Az ajtó zárásakor lejátszott hangkategória. |
| `soundLocked` | Az a hangkategória, amely akkor szól, amikor a játékos zárt ajtót próbál nyitni. |
| `soundOpenABit` | Az a hangkategória, amely akkor szól, amikor a játékos feltöri a zárt ajtót. |

**Fontos megjegyzések a konfigurációhoz:**

- A DayZ összes épülete a `HouseNoDestruct` osztályból öröklődik.
- A `class Doors` alatti minden osztálynévnek meg kell felelnie a `model.cfg`-ben definiált `source` paraméternek.
- A `DamageSystem` szekciónak tartalmaznia kell egy `DamageZones` alosztályt minden ajtóhoz. A `componentNames[]` tömb a modell Fire Geometry LOD-jából származó elnevezett szekcióra hivatkozik.
- A `class=house` elnevezett tulajdonság és egy játék konfiguráció osztály hozzáadása megköveteli a terepet újra binarizálni (a `.wrp` fájlokban lévő modell elérési utak játék konfiguráció osztály hivatkozásokkal lesznek helyettesítve).

### Dupla ajtók

A dupla ajtók (két szárny, amelyek egyetlen interakció hatására együtt nyílnak) gyakoriak a DayZ-ben. Speciális beállítást igényelnek:

**A modellben:**
- Konfigurálj minden szárnyat egyedi ajtóként saját elnevezett szelekcióval (pl. `door3_1` és `door3_2`).
- A **Memory LOD**-ban az akció pontnak **közösnek** kell lennie a két szárny között -- használj egy elnevezett szelekciót és egy csúcspontot az akció pozícióhoz.
- Az utótag nélküli elnevezett szelekciónak (pl. `door3` szárny utótag nélkül) **mindkét** ajtókilincset le kell fednie.
- A **View Geometry** és **Fire Geometry** további elnevezett szelekciót igényel, amely mindkét szárnyat együtt fedi le.

**A model.cfg-ben:**
- Definiáld minden szárnyat külön animációs osztályként, de állítsd be **ugyanazt a `source` paramétert** mindkét szárnyhoz (pl. `"doors34"` mindkettőhöz).
- Állítsd az `angle1`-et **pozitív** értékre az egyik szárnyhoz és **negatívra** a másikhoz, hogy ellentétes irányba nyíljanak.

**A config.cpp-ben:**
- Definiálj csak **egy** osztályt a `class Doors` alatt, amelynek neve megegyezik a közös `source` paraméterrel.
- Hasonlóan, definiálj csak **egy** bejegyzést a `DamageZones`-ban a dupla ajtó párhoz.

### Toló ajtók

Olyan ajtókhoz, amelyek sínen csúsznak a lengés helyett (mint pajta ajtók vagy csúszó panelek), változtasd meg az animáció `type`-ját a `model.cfg`-ben `"rotation"`-ról `"translation"`-ra. A Memory LOD tengely csúcspontjai ekkor a mozgás irányát definiálják a forgáspont vonal helyett.

### Határoló gömb problémák

Alapértelmezetten egy modell határoló gömbje úgy van méretezve, hogy az egész objektumot magában foglalja. Ha az ajtók zárt helyzetben vannak modellezve, a nyitott pozíció **kívül** eshet ezen a határoló gömbön. Ez problémákat okoz:

- **Az akciók nem működnek** -- a sugárvetés az ajtó interakciókhoz bizonyos szögekből meghiúsul.
- **A ballisztika figyelmen kívül hagyja az ajtót** -- a golyók átmennek a határoló gömbön kívül eső geometrián.

**Megoldás:** Hozz létre egy elnevezett szelekciót a Memory LOD-ban, amely lefedi azt a nagyobb területet, amelyet az épület elfoglal, amikor az ajtók teljesen nyitva vannak. Ezután adj hozzá egy `bounding` paramétert a játék konfigurációs osztályodhoz:

```cpp
class land_modelname: HouseNoDestruct
{
    bounding = "selection_name";
    // ... a konfiguráció többi része
};
```

Ez felülírja az automatikus határoló gömb számítást olyannal, amely magában foglalja az összes ajtó pozíciót.

---

## Létra konfiguráció

Az ajtókkal ellentétben a DayZ létrák **nem igényelnek animációs konfigurációt** és **nem igényelnek speciális játék konfigurációs bejegyzéseket** az alap épület osztályon kívül. A teljes létra beállítás Memory LOD csúcspont elhelyezéssel és egy View Geometry szelekcióval történik. Ez egyszerűbbé teszi a létrák beállítását az ajtóknál, de a csúcspont elhelyezésnek precíznek kell lennie.

### Támogatott létra típusok

A DayZ két típusú létrát támogat:

1. **Elöl alul belépés oldalsó felső kilépéssel** -- A játékos elölről közelíti meg alul és oldalt lép ki felül (fal mellett).
2. **Elöl alul belépés elöl felső kilépéssel** -- A játékos elölről közelíti meg alul és előre lép ki felül (tetőre vagy platformra).

Mindkét típus támogatja a **középső oldalsó be- és kilépési pontokat** is, lehetővé téve a játékosok számára, hogy közbenső emeleteken szálljanak fel és le a létráról. A létrák **szögben** is elhelyezhetők a szigorúan függőleges helyett.

### Memory LOD elnevezett szelekciók

A létrát teljes egészében elnevezett csúcspontok definiálják a Memory LOD-ban. Minden szelekciónév `ladderN_`-nel kezdődik, ahol **N** a létra azonosító, `1`-től kezdve. Egy épületnek több létrája is lehet (`ladder1_`, `ladder2_`, `ladder3_`, stb.).

Itt a létra elnevezett szelekciók teljes készlete:

| Elnevezett szelekció | Leírás |
|----------------|-------------|
| `ladderN_bottom_front` | Definiálja az alsó belépési lépcsőt -- ahol a játékos elkezdi a mászást. |
| `ladderN_middle_left` | Definiál egy középső be-/kilépési pontot (bal oldal). Több csúcspontot tartalmazhat, ha a létra több emeleten halad át. |
| `ladderN_middle_right` | Definiál egy középső be-/kilépési pontot (jobb oldal). Több csúcspontot tartalmazhat többemeletes létrákhoz. |
| `ladderN_top_front` | Definiálja a felső kilépési lépcsőt -- ahol a játékos befejezi a mászást (elülső kilépés típus). |
| `ladderN_top_left` | Definiálja a felső kilépési irányt fali létrákhoz (bal oldal). Legalább **5 létra lépcsővel magasabbnak** kell lennie a padlószintnél (megközelítőleg egy álló játékos magassága a létrán). |
| `ladderN_top_right` | Definiálja a felső kilépési irányt fali létrákhoz (jobb oldal). Ugyanaz a magassági követelmény, mint a `top_left`-nél. |
| `ladderN` | Definiálja, hol jelenik meg a "Létra használata" akció widget a játékos számára. |
| `ladderN_dir` | Definiálja az irányt, ahonnan a létrán lehet mászni (megközelítési irány). |
| `ladderN_con` | A belépési akció mérési pontja. **A padlószintre kell helyezni.** |
| `ladderN_con_dir` | Definiálja egy 180 fokos kúp irányát (a `ladderN_con`-ból kiindulva), amelyen belül a létrára szállás akció elérhető. |

Ezek mindegyike egy csúcspont (vagy csúcspont készlet a középső pontokhoz), amelyet manuálisan helyezel el az Object Builder Memory LOD-jában.

### View Geometry követelmények

A Memory LOD beállítás mellett létre kell hoznod egy **View Geometry** komponenst `ladderN` nevű elnevezett szelekcióval. Ennek a szelekciónak le kell fednie a létra **teljes térfogatát** -- a mászható terület teljes magasságát és szélességét. Ezen View Geometry szelekció nélkül a létra nem fog helyesen működni.

### Létra méretek

A létra mászási animációk **rögzített méretekhez** vannak tervezve. A létra fokaid és térközeid a vanilla létra arányainak kell megfelelniük az animációk helyes illeszkedéséhez. Tekintsd meg a hivatalos DayZ Samples adattárat a pontos mérésekért -- a minta létra részek ugyanazok, amelyeket a legtöbb vanilla épületen használnak.

### Ütközési tér

A karakterek **ütköznek a geometriával létra mászás közben**. Ez azt jelenti, hogy elegendő szabad helyet kell biztosítanod a létra körül a mászó karakter számára mind a:

- **Geometry LOD** -- fizikai ütközés.
- **Roadway LOD** -- felszín interakció.

Ha a tér túl szűk, a karakter beleakad a falakba vagy elakad a mászási animáció során.

### Konfigurációs követelmények létrákhoz

Az Arma sorozattal ellentétben a DayZ **nem** igényel `ladders[]` tömböt a játék konfigurációs osztályban. Mindazonáltal két dolog még mindig szükséges:

1. A modellednek rendelkeznie kell **konfigurációs reprezentációval** -- egy `config.cpp` `CfgVehicles` osztállyal (ugyanaz az alap osztály, amelyet az ajtókhoz használnak; lásd az ajtó konfiguráció szekciót fentebb).
2. A **Geometry LOD**-nak tartalmaznia kell a `class` elnevezett tulajdonságot `house` értékkel.

Ezen két követelményen kívül a létrát teljes egészében a Memory LOD csúcspontok és a View Geometry szelekció definiálja. Nincs szükség `model.cfg` animációs bejegyzésekre.

---

## Modell követelmények összefoglalása

Az ajtókkal és létrákkal rendelkező épületeknek több LOD-ot kell tartalmazniuk, mindegyik különálló célt szolgálva. Az alábbi táblázat összefoglalja, mit kell tartalmaznia minden LOD-nak:

| LOD | Cél | Ajtó követelmények | Létra követelmények |
|-----|---------|-------------------|---------------------|
| **Resolution LOD** | A játékos számára megjelenített vizuális háló. | Elnevezett szelekció az ajtó geometriához (pl. `door1`). | Nincs specifikus követelmény. |
| **Geometry LOD** | Fizikai ütközés érzékelés. | Elnevezett szelekció az ajtó geometriához. `class = "house"` elnevezett tulajdonság. | `class = "house"` elnevezett tulajdonság. Elegendő szabad hely a létra körül a mászó karakterek számára. |
| **Fire Geometry LOD** | Ballisztikus találat érzékelés (golyók, lövedékek). | A sérülési zóna konfigurációban lévő `componentNames[]` értékkel egyező elnevezett szelekció. | Nincs specifikus követelmény. |
| **View Geometry LOD** | Láthatósági ellenőrzések, akció sugárvetés. | Az ajtó konfigurációban lévő `component` paraméterrel egyező elnevezett szelekció. | `ladderN` elnevezett szelekció, amely lefedi a létra teljes térfogatát. |
| **Memory LOD** | Tengely definíciók, akció pontok, hang pozíciók. | Tengely csúcspontok (`door1_axis`), hang pozíció (`door1_action`), akció widget pozíció. | Létra csúcspontok teljes készlete (`ladderN_bottom_front`, `ladderN_top_left`, `ladderN_dir`, `ladderN_con`, stb.). |
| **Roadway LOD** | Felszín interakció karakterek számára. | Jellemzően nem szükséges. | Elegendő szabad hely a létra körül a mászó karakterek számára. |

### Elnevezett szelekció konzisztencia

Kritikus követelmény, hogy az **elnevezett szelekcióknak konzisztensnek kell lenniük az összes hivatkozó LOD-on keresztül**. Ha egy szelekciót `door1`-nek nevezünk a Resolution LOD-ban, annak szintén `door1`-nek kell lennie a Geometry, Fire Geometry és View Geometry LOD-okban. A LOD-ok közötti eltérő nevek az ajtó vagy létra csendes meghibásodását okozzák.

---

## Legjobb gyakorlatok

1. **Modellezd az ajtókat alapértelmezetten zárva.** Animálj zártból nyitottba. A Bohemia tervezi, hogy támogatja az ajtók mindkét irányú nyitását, így a zártból indulás jövőbiztos.

2. **Használj szabványos ajtó méreteket.** Maradj a 120 x 220 cm-nél az ajtónyílásokhoz, hacsak nincs konkrét tervezési indokod. Ez megegyezik a vanilla épületekkel és biztosítja, hogy a karakter animációk helyesek legyenek.

3. **Teszteld az animációkat a Buldozerben csomagolás előtt.** Használd a `[` / `]` billentyűket a források váltásához és a `;` / `'` billentyűket vagy az egér görgőjét az animáció lejátszásához. A tengely vagy szög hibák korai észlelése jelentős időt takarít meg.

4. **Írd felül a határoló gömböket nagy épületeknél.** Ha az épületednek jelentősen kifelé lengő ajtói vannak, hozz létre egy Memory LOD szelekciót, amely lefedi a teljes animált kiterjedést, és kapcsold össze a `bounding` konfiguráció paraméterrel.

5. **Helyezd el precízen a létra csúcspontokat.** A mászási animációk rögzített méretekhez vannak kötve. A túl távol lévő vagy rosszul igazított csúcspontok lebegő, beakadó vagy elakadó karaktert eredményeznek.

6. **Biztosíts szabad helyet a létrák körül.** Hagyj elegendő teret a Geometry és Roadway LOD-okban a karakter modell számára mászás közben.

7. **Tarts egy `model.cfg`-t modellenként vagy mappánként.** A `model.cfg`-nek nem kell a `.p3d` fájl mellett lennie, de az egymáshoz közeli elhelyezés megkönnyíti a szervezést. Magasabban is elhelyezhető a mappa struktúrában, hogy több modellt fedjen le.

8. **Használd a DayZ Samples adattárat.** A Bohemia működő mintákat biztosít mind az ajtókhoz (`Test_Building`), mind a létrákhoz (`Test_Ladders`) a `https://github.com/BohemiaInteractive/DayZ-Samples` címen. Tanulmányozd ezeket, mielőtt sajátot építesz.

9. **Binarizáld újra a terepet épület konfigurációk hozzáadása után.** A `class=house` és egy játék konfigurációs osztály hozzáadása azt jelenti, hogy a `.wrp` fájlokban lévő modell elérési utak osztályhivatkozásokkal lesznek helyettesítve. A terepet újra kell binarizálni, hogy ez érvénybe lépjen.

10. **Frissítsd a navmesh-t épületek elhelyezése után.** A frissített navmesh nélkül újraépített terep azt okozhatja, hogy az AI átmegy az ajtókon ahelyett, hogy megfelelően használná őket.

---

## Gyakori hibák

### Ajtók

| Hiba | Tünet | Javítás |
|---------|---------|-----|
| A `CfgModels` osztálynév nem egyezik a modell fájlnévvel. | Az ajtó animáció nem játszódik le. | Nevezd át az osztályt, hogy pontosan egyezzen a `.p3d` fájlnévvel (kiterjesztés nélkül). |
| Hiányzó elnevezett szelekció egy vagy több LOD-ban. | Az ajtó látható, de nem interaktív, vagy a golyók átmennek rajta. | Biztosítsd, hogy a szelekció létezzen a Resolution, Geometry, View Geometry és Fire Geometry LOD-okban. |
| Tengely csúcspontok hiányoznak vagy csak egy csúcspont van definiálva. | Az ajtó rossz pontból forog vagy egyáltalán nem forog. | Helyezz el pontosan két csúcspontot a Memory LOD-ban a tengely szelekcióhoz (pl. `door1_axis`). |
| A `model.cfg`-beli `source` nem egyezik a `config.cpp` Doors osztálynévvel. | Az ajtó nincs összekapcsolva a játék logikával -- nincsenek hangok, nincsenek állapotváltozások. | Biztosítsd, hogy a `source` paraméter és a Doors osztálynév azonos legyen. |
| A `class = "house"` elnevezett tulajdonság elfelejtése a Geometry LOD-ban. | Az épület nem interaktív struktúraként van felismerve. | Add hozzá az elnevezett tulajdonságot az Object Builder Geometry LOD-jában. |
| A határoló gömb túl kicsi. | Az ajtó akciók vagy a ballisztika bizonyos szögekből nem működik. | Adj hozzá egy `bounding` szelekciót a Memory LOD-ban és hivatkozd a konfigurációban. |
| Negatív vs. pozitív `angle1` zavar dupla ajtóknál. | Mindkét szárny azonos irányba leng és egymásba akad. | Az egyik szárnynak pozitív `angle1`-re, a másiknak negatívra van szüksége. |

### Létrák

| Hiba | Tünet | Javítás |
|---------|---------|-----|
| A `ladderN_con` nincs padlószintre helyezve. | A "Létra használata" akció nem jelenik meg vagy rossz magasságban jelenik meg. | Mozgasd a csúcspontot a talaj/padló szintjére. |
| Hiányzó View Geometry szelekció `ladderN`. | A létrával nem lehet interakcióba lépni. | Hozz létre egy View Geometry komponenst elnevezett szelekcióval, amely lefedi a teljes létra térfogatot. |
| A `ladderN_top_left` / `ladderN_top_right` túl alacsony. | A karakter átmegy a falon vagy padlón a felső kilépésnél. | Ezeknek legalább 5 létra lépcsővel magasabbnak kell lenniük a padlószintnél. |
| Elégtelen szabad hely a Geometry LOD-ban. | A karakter elakad vagy beakad a falakba mászás közben. | Szélesítsd a rést a létra körül a Geometry és Roadway LOD-okban. |
| A létra számozás 0-val kezdődik. | A létra nem működik. | A számozás `1`-gyel kezdődik (`ladder1_`, nem `ladder0_`). |
| `ladders[]` megadása a játék konfigurációban. | Felesleges erőfeszítés (ártalmatlan, de szükségtelen). | A DayZ nem használja a `ladders[]` tömböt. Távolítsd el és támaszkodj a Memory LOD csúcspont elhelyezésre. |

---

## Hivatkozások

- [Bohemia Interactive -- Ajtók épületeken](https://community.bistudio.com/wiki/DayZ:Doors_on_buildings) (hivatalos BI dokumentáció)
- [Bohemia Interactive -- Létrák épületeken](https://community.bistudio.com/wiki/DayZ:Ladders_on_buildings) (hivatalos BI dokumentáció)
- [DayZ Samples -- Test_Building](https://github.com/BohemiaInteractive/DayZ-Samples/tree/master/Test_Building) (működő ajtó minta)
- [DayZ Samples -- Test_Ladders](https://github.com/BohemiaInteractive/DayZ-Samples/tree/master/Test_Ladders) (működő létra minta)
- [4.2. fejezet: 3D modellek](02-models.md) -- LOD rendszer, elnevezett szelekciók, `model.cfg` alapok

---

## Navigáció

| Előző | Fel | Következő |
|----------|----|------|
| [4.7 Workbench útmutató](07-workbench-guide.md) | [4. rész: Fájlformátumok és DayZ Tools](01-textures.md) | -- |
