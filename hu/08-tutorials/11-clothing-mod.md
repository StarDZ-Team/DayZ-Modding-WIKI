# 8.11. fejezet: Egyedi ruházat készítése

[Kezdőlap](../README.md) | [<< Előző: Egyedi jármű készítése](10-vehicle-mod.md) | **Egyedi ruházat készítése** | [Következő: Kereskedési rendszer építése >>](12-trading-system.md)

---

> **Összefoglalás:** Ez az oktatóanyag végigvezet egy egyedi taktikai kabát készítésén a DayZ-hez. Kiválasztasz egy alaposztályt, meghatározod a ruhadarabot a config.cpp-ben szigetelési és rakodótér tulajdonságokkal, újratextúrázod terepszínű mintával rejtett kiválasztások segítségével, hozzáadsz lokalizációt és spawnolást, és opcionálisan szkriptezett viselkedéssel bővíted. A végére egy viselhető kabátot kapsz, amely melegen tartja a játékosokat, tárgyakat tárol, és megjelenik a világban.

---

## Tartalomjegyzék

- [Mit építünk](#mit-építünk)
- [1. lépés: Alaposztály kiválasztása](#1-lépés-alaposztály-kiválasztása)
- [2. lépés: config.cpp a ruházathoz](#2-lépés-configcpp-a-ruházathoz)
- [3. lépés: Textúrák készítése](#3-lépés-textúrák-készítése)
- [4. lépés: Rakodótér hozzáadása](#4-lépés-rakodótér-hozzáadása)
- [5. lépés: Lokalizáció és spawnolás](#5-lépés-lokalizáció-és-spawnolás)
- [6. lépés: Szkript viselkedés (opcionális)](#6-lépés-szkript-viselkedés-opcionális)
- [7. lépés: Build, tesztelés, finomítás](#7-lépés-build-tesztelés-finomítás)
- [Teljes kódreferencia](#teljes-kódreferencia)
- [Gyakori hibák](#gyakori-hibák)
- [Legjobb gyakorlatok](#legjobb-gyakorlatok)
- [Elmélet vs gyakorlat](#elmélet-vs-gyakorlat)
- [Mit tanultál](#mit-tanultál)

---

## Mit építünk

Egy **taktikai terepszínű kabátot** készítünk -- egy katonai stílusú kabátot erdei álcamintával, amelyet a játékosok megtalálhatnak és viselhetnek. A kabát:

- A vanilla Gorka kabát modelljét terjeszti ki (nincs szükség 3D modellezésre)
- Egyedi terepszínű újratextúrával rendelkezik rejtett kiválasztások segítségével
- Meleget biztosít `heatIsolation` értékeken keresztül
- Tárgyakat tárol a zsebeiben (rakodótér)
- Sérülés hatására vizuálisan degradálódik az egészségi állapotok szerint
- Katonai helyszíneken jelenik meg a világban

**Előfeltételek:** Működő mod struktúra (először végezd el a [8.1. fejezetet](01-first-mod.md) és a [8.2. fejezetet](02-custom-item.md)), szövegszerkesztő, telepített DayZ Tools (a TexView2-höz), és képszerkesztő a terepszínű textúrák készítéséhez.

---

## 1. lépés: Alaposztály kiválasztása

A DayZ-ben a ruházat a `Clothing_Base` osztályból öröklődik, de szinte soha nem terjeszted ki közvetlenül. A DayZ köztes alaposztályokat biztosít minden testhelyre:

| Alaposztály | Testhely | Példák |
|-------------|----------|--------|
| `Top_Base` | Test (törzs) | Kabátok, ingek, pulóverek |
| `Pants_Base` | Lábak | Farmerek, cargo nadrágok |
| `Shoes_Base` | Lábfej | Bakancsok, sportcipők |
| `HeadGear_Base` | Fej | Sisakok, kalapok |
| `Mask_Base` | Arc | Gázálarcok, símaszkek |
| `Gloves_Base` | Kezek | Taktikai kesztyűk |
| `Vest_Base` | Mellény slot | Lemezhordozók, mellkaskosarak |
| `Glasses_Base` | Szemüveg | Napszemüvegek |
| `Backpack_Base` | Hát | Hátizsákok, táskák |

A teljes öröklési lánc: `Clothing_Base -> Clothing -> Top_Base -> GorkaEJacket_ColorBase -> SajátKabát`

### Miért terjessz ki egy meglévő vanilla tárgyat

Különböző szinteken terjeszthetsz ki:

1. **Konkrét tárgy kiterjesztése** (mint a `GorkaEJacket_ColorBase`) -- legegyszerűbb. Örökölöd a modellt, animációkat, slotot és az összes tulajdonságot. Csak textúrákat változtatsz és értékeket módosítasz. Ezt csinálja a Bohemia `Test_ClothingRetexture` mintája.
2. **Slot alap kiterjesztése** (mint a `Top_Base`) -- tiszta kiindulópont, de meg kell adnod a modellt és az összes tulajdonságot.
3. **`Clothing` közvetlen kiterjesztése** -- csak teljesen egyedi slot viselkedéshez. Ritkán szükséges.

A taktikai kabátunkhoz a `GorkaEJacket_ColorBase` osztályt terjesztjük ki. A vanilla szkriptet vizsgálva:

```c
class GorkaEJacket_ColorBase extends Top_Base
{
    override void SetActions()
    {
        super.SetActions();
        AddAction(ActionWringClothes);
    }
};
class GorkaEJacket_Summer extends GorkaEJacket_ColorBase {};
class GorkaEJacket_Flat extends GorkaEJacket_ColorBase {};
```

Figyeld meg a mintát: egy `_ColorBase` osztály kezeli a közös viselkedést, és az egyes színváltozatok további kód nélkül terjesztik ki. A config.cpp bejegyzéseik különböző textúrákat biztosítanak. Ugyanezt a mintát fogjuk követni.

Az alaposztályok megtalálásához nézd meg a `scripts/4_world/entities/itembase/clothing_base.c` fájlt (az összes slot alapot definiálja) és a `scripts/4_world/entities/itembase/clothing/` mappát (ruhacsaládonként egy fájl).

---

## 2. lépés: config.cpp a ruházathoz

Hozd létre a `MyClothingMod/Data/config.cpp` fájlt:

```cpp
class CfgPatches
{
    class MyClothingMod_Data
    {
        units[] = { "MCM_TacticalJacket_Woodland" };
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Data", "DZ_Characters_Tops" };
    };
};

class CfgVehicles
{
    class GorkaEJacket_ColorBase;

    class MCM_TacticalJacket_ColorBase : GorkaEJacket_ColorBase
    {
        scope = 0;
        displayName = "";
        descriptionShort = "";

        weight = 1800;
        itemSize[] = { 3, 4 };
        absorbency = 0.3;
        heatIsolation = 0.8;
        visibilityModifier = 0.7;

        repairableWithKits[] = { 5, 2 };
        repairCosts[] = { 30.0, 25.0 };

        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 200;
                    healthLevels[] =
                    {
                        { 1.0,  { "DZ\characters\tops\Data\GorkaUpper.rvmat" } },
                        { 0.70, { "DZ\characters\tops\Data\GorkaUpper.rvmat" } },
                        { 0.50, { "DZ\characters\tops\Data\GorkaUpper_damage.rvmat" } },
                        { 0.30, { "DZ\characters\tops\Data\GorkaUpper_damage.rvmat" } },
                        { 0.01, { "DZ\characters\tops\Data\GorkaUpper_destruct.rvmat" } }
                    };
                };
            };
            class GlobalArmor
            {
                class Melee
                {
                    class Health    { damage = 0.8; };
                    class Blood     { damage = 0.8; };
                    class Shock     { damage = 0.8; };
                };
                class Infected
                {
                    class Health    { damage = 0.8; };
                    class Blood     { damage = 0.8; };
                    class Shock     { damage = 0.8; };
                };
            };
        };

        class EnvironmentWetnessIncrements
        {
            class Soaking
            {
                rain = 0.015;
                water = 0.1;
            };
            class Drying
            {
                playerHeat = -0.08;
                fireBarrel = -0.25;
                wringing = -0.15;
            };
        };
    };

    class MCM_TacticalJacket_Woodland : MCM_TacticalJacket_ColorBase
    {
        scope = 2;
        displayName = "$STR_MCM_TacticalJacket_Woodland";
        descriptionShort = "$STR_MCM_TacticalJacket_Woodland_Desc";
        hiddenSelectionsTextures[] =
        {
            "MyClothingMod\Data\Textures\tactical_jacket_g_woodland_co.paa",
            "MyClothingMod\Data\Textures\tactical_jacket_woodland_co.paa",
            "MyClothingMod\Data\Textures\tactical_jacket_woodland_co.paa"
        };
    };
};
```

### Ruházat-specifikus mezők magyarázata

**Hőszabályozás és rejtőzés:**

| Mező | Érték | Magyarázat |
|------|-------|------------|
| `heatIsolation` | `0.8` | Biztosított melegség (0.0-1.0 tartomány). A motor ezt szorozza az egészségi állapot és nedvesség tényezőkkel. Egy hibátlan, száraz kabát teljes melegséget ad; egy tönkrement, átnedvesedett szinte semmit. |
| `visibilityModifier` | `0.7` | Játékos láthatósága az AI számára (alacsonyabb = nehezebben észlelhető). |
| `absorbency` | `0.3` | Vízfelszívás (0 = vízálló, 1 = szivacs). Alacsonyabb jobb az esőállósághoz. |

**Vanilla heatIsolation referencia:** Póló 0.2, Kapucnis pulóver 0.5, Gorka kabát 0.7, Tábori kabát 0.8, Gyapjú kabát 0.9.

**Javítás:** A `repairableWithKits[] = { 5, 2 }` felsorolja a készlet típusokat (5=Varródoboz, 2=Bőrvarró készlet). A `repairCosts[]` megadja a javításonként felhasznált anyagot, egyező sorrendben.

**Páncélzat:** A `damage` 0.8-as értéke azt jelenti, hogy a játékos a beérkező sérülés 80%-át kapja meg (20% elnyelve). Alacsonyabb értékek = több védelem.

**Nedvesség:** A `Soaking` szabályozza, milyen gyorsan ázik át a tárgy esőtől/víztől. A `Drying` negatív értékek a testhőtől, tüzektől és kicsavarástól származó nedvességveszteséget jelölik.

**Rejtett kiválasztások:** A Gorka modellnek 3 kiválasztása van -- a 0. index a földi modell, az 1. és 2. index a viselt modell. A `hiddenSelectionsTextures[]` tömböt felülírod az egyedi PAA útvonalaiddal.

**Egészségi szintek:** Minden bejegyzés `{ egészségKüszöb, { anyagÚtvonal } }`. Amikor az egészség egy küszöb alá esik, a motor kicseréli az anyagot. A vanilla damage rvmat-ok kopásnyomokat és szakadásokat adnak hozzá.

---

## 3. lépés: Textúrák készítése

### Textúrák keresése és létrehozása

A Gorka kabát textúrái a `DZ\characters\tops\data\` helyen találhatók -- csomagold ki a `gorka_upper_summer_co.paa` (szín), `gorka_upper_nohq.paa` (normál) és `gorka_upper_smdi.paa` (tükrös) fájlokat a P: meghajtóról sablonként való használathoz.

**A terepszínű minta létrehozása:**

1. Nyisd meg a vanilla `_co` textúrát a TexView2-ben, exportáld TGA/PNG formátumba
2. Fesd meg az erdei álcamintádat a képszerkesztőben, az UV elrendezést követve
3. Tartsd meg az eredeti méreteket (általában 2048x2048 vagy 1024x1024)
4. Mentsd TGA-ként, konvertáld PAA-ra a TexView2-vel (File > Save As > .paa)

### Textúra típusok

| Utótag | Cél | Szükséges? |
|--------|-----|------------|
| `_co` | Fő szín/minta | Igen |
| `_nohq` | Normál térkép (szövet részlet) | Nem -- a vanilla alapértelmezést használja |
| `_smdi` | Tükrös (fényesség) | Nem -- a vanilla alapértelmezést használja |
| `_as` | Alfa/felületi maszk | Nem |

Újratextúrázásnál csak `_co` textúrákra van szükséged. A vanilla modell normál és tükrös térképei továbbra is működnek.

Teljes anyagvezérléshez hozz létre `.rvmat` fájlokat és hivatkozz rájuk a `hiddenSelectionsMaterials[]` tömbben. A Bohemia `Test_ClothingRetexture` mintájában találsz működő rvmat példákat sérülés és pusztulás változatokkal.

---

## 4. lépés: Rakodótér hozzáadása

A `GorkaEJacket_ColorBase` kiterjesztésekor automatikusan örökölöd annak rakodórácsát (4x3) és inventory slotját (`"Body"`). Az `itemSize[] = { 3, 4 }` tulajdonság azt határozza meg, milyen nagy a kabát lootként tárolva -- NEM a rakodókapacitását.

Gyakori ruházati slotok: `"Body"` (kabátok), `"Legs"` (nadrágok), `"Feet"` (csizmák), `"Headgear"` (kalapok), `"Vest"` (mellkaskosarak), `"Gloves"`, `"Mask"`, `"Back"` (hátizsákok).

Néhány ruhadarab csatolmányokat fogad el (mint a lemez hordozó zsebek). Add hozzá őket az `attachments[] = { "Shoulder", "Armband" };` sorral. Egy alap kabáthoz az örökölt rakodótér elegendő.

---

## 5. lépés: Lokalizáció és spawnolás

### Stringtable

Hozd létre a `MyClothingMod/Data/Stringtable.csv` fájlt:

```csv
"Language","English","Czech","German","Russian","Polish","Hungarian","Italian","Spanish","French","Chinese","Japanese","Portuguese","ChineseSimp","Korean"
"STR_MCM_TacticalJacket_Woodland","Tactical Jacket (Woodland)","","","","","","","","","","","","",""
"STR_MCM_TacticalJacket_Woodland_Desc","A rugged tactical jacket with woodland camouflage. Provides good insulation and has multiple pockets.","","","","","","","","","","","","",""
```

### Spawnolás (types.xml)

Add hozzá a szervered mission mappájában lévő `types.xml` fájlhoz:

```xml
<type name="MCM_TacticalJacket_Woodland">
    <nominal>8</nominal>
    <lifetime>14400</lifetime>
    <restock>3600</restock>
    <min>3</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0" />
    <category name="clothes" />
    <usage name="Military" />
    <value name="Tier2" />
    <value name="Tier3" />
</type>
```

Használd a `category name="clothes"` értéket minden ruházathoz. Állítsd be a `usage` értéket annak megfelelően, hol spawnoljon a tárgy (Military, Town, Police stb.), és a `value` értéket a térkép szintjéhez (Tier1=part, Tier4=mély szárazföld).

---

## 6. lépés: Szkript viselkedés (opcionális)

Egyszerű újratextúrázáshoz nincs szükséged szkriptekre. De ha viselkedést akarsz hozzáadni a kabát viselésekor, hozz létre egy szkript osztályt.

### Scripts config.cpp

```cpp
class CfgPatches
{
    class MyClothingMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Data", "DZ_Characters_Tops" };
    };
};

class CfgMods
{
    class MyClothingMod
    {
        dir = "MyClothingMod";
        name = "My Clothing Mod";
        author = "YourName";
        type = "mod";
        dependencies[] = { "World" };
        class defs
        {
            class worldScriptModule
            {
                value = "";
                files[] = { "MyClothingMod/Scripts/4_World" };
            };
        };
    };
};
```

### Egyedi kabát szkript

Hozd létre a `Scripts/4_World/MyClothingMod/MCM_TacticalJacket.c` fájlt:

```c
class MCM_TacticalJacket_ColorBase extends GorkaEJacket_ColorBase
{
    override void OnWasAttached(EntityAI parent, int slot_id)
    {
        super.OnWasAttached(parent, slot_id);
        PlayerBase player = PlayerBase.Cast(parent);
        if (player)
        {
            Print("[MyClothingMod] Player equipped Tactical Jacket");
        }
    }

    override void OnWasDetached(EntityAI parent, int slot_id)
    {
        super.OnWasDetached(parent, slot_id);
        PlayerBase player = PlayerBase.Cast(parent);
        if (player)
        {
            Print("[MyClothingMod] Player removed Tactical Jacket");
        }
    }

    override void SetActions()
    {
        super.SetActions();
        AddAction(ActionWringClothes);
    }
};
```

### Főbb ruházati események

| Esemény | Mikor aktiválódik | Gyakori használat |
|---------|-------------------|-------------------|
| `OnWasAttached(parent, slot_id)` | A játékos felszereli a tárgyat | Bónuszok alkalmazása, effektek megjelenítése |
| `OnWasDetached(parent, slot_id)` | A játékos leveszi a tárgyat | Bónuszok eltávolítása, takarítás |
| `EEItemAttached(item, slot_name)` | Tárgy csatolva ehhez a ruhadarabhoz | Modell kiválasztások megjelenítése/elrejtése |
| `EEItemDetached(item, slot_name)` | Tárgy leválasztva erről a ruhadarabról | Vizuális változtatások visszaállítása |
| `EEHealthLevelChanged(old, new, zone)` | Az egészség átlép egy küszöböt | Vizuális állapot frissítése |

**Fontos:** Mindig hívd meg a `super`-t minden felülírás elején. A szülőosztály kritikus motor viselkedéseket kezel.

---

## 7. lépés: Build, tesztelés, finomítás

### Build és spawnolás

Csomagold a `Data/` és `Scripts/` könyvtárakat külön PBO-kba. Indítsd el a DayZ-t a mododdal és spawnold a kabátot:

```c
GetGame().GetPlayer().GetInventory().CreateInInventory("MCM_TacticalJacket_Woodland");
```

### Ellenőrző lista

1. **Megjelenik a leltárban?** Ha nem, ellenőrizd a `scope=2` értéket és az osztálynév egyezését.
2. **Helyes a textúra?** Alapértelmezett Gorka textúra = hibás útvonalak. Fehér/rózsaszín = hiányzó textúra fájl.
3. **Felszerelheted?** A Body slotba kell kerülnie. Ha nem, ellenőrizd a szülőosztály láncot.
4. **Megjelenik a megjelenítési név?** Ha nyers `$STR_` szöveget látsz, a stringtable nem töltődik be.
5. **Meleget biztosít?** Ellenőrizd a `heatIsolation` értéket a debug/inspect menüben.
6. **Sérülés degradálja a vizuált?** Teszteld ezzel: `ItemBase.Cast(GetGame().GetPlayer().GetItemOnSlot("Body")).SetHealth("", "", 40);`

### Színváltozatok hozzáadása

Kövesd a `_ColorBase` mintát -- adj hozzá testvérosztályokat, amelyek csak a textúrákban különböznek:

```cpp
class MCM_TacticalJacket_Desert : MCM_TacticalJacket_ColorBase
{
    scope = 2;
    displayName = "$STR_MCM_TacticalJacket_Desert";
    descriptionShort = "$STR_MCM_TacticalJacket_Desert_Desc";
    hiddenSelectionsTextures[] =
    {
        "MyClothingMod\Data\Textures\tactical_jacket_g_desert_co.paa",
        "MyClothingMod\Data\Textures\tactical_jacket_desert_co.paa",
        "MyClothingMod\Data\Textures\tactical_jacket_desert_co.paa"
    };
};
```

Minden változatnak saját `scope=2` értékre, megjelenítési névre, textúrákra, stringtable bejegyzésekre és types.xml bejegyzésre van szüksége.

---

## Teljes kódreferencia

### Könyvtárstruktúra

```
MyClothingMod/
    mod.cpp
    Data/
        config.cpp              <-- Tárgy definíciók (lásd 2. lépés)
        Stringtable.csv         <-- Megjelenítési nevek (lásd 5. lépés)
        Textures/
            tactical_jacket_woodland_co.paa
            tactical_jacket_g_woodland_co.paa
    Scripts/                    <-- Csak szkript viselkedéshez szükséges
        config.cpp              <-- CfgMods bejegyzés (lásd 6. lépés)
        4_World/
            MyClothingMod/
                MCM_TacticalJacket.c
```

### mod.cpp

```cpp
name = "My Clothing Mod";
author = "YourName";
version = "1.0";
overview = "Adds a tactical jacket with camo variants to DayZ.";
```

Minden egyéb fájl teljes egészében a fenti megfelelő lépésekben szerepel.

---

## Gyakori hibák

| Hiba | Következmény | Javítás |
|------|-------------|---------|
| `scope=2` elfelejtése a változatokon | A tárgy nem spawnol és nem jelenik meg az admin eszközökben | Állítsd `scope=0`-ra az alapon, `scope=2`-re minden spawnolható változaton |
| Hibás textúra tömb elemszám | Fehér/rózsaszín textúrák egyes részeken | Egyeztesd a `hiddenSelectionsTextures` elemszámát a modell rejtett kiválasztásaival (Gorka-nak 3 van) |
| Perjel a textúra útvonalakban | A textúrák csendben nem töltődnek be | Használj fordított perjelet: `"MyMod\Data\tex.paa"` |
| Hiányzó `requiredAddons` | A config elemző nem tudja feloldani a szülőosztályt | Írd bele a `"DZ_Characters_Tops"` értéket felsőruházathoz |
| `heatIsolation` 1.0 felett | A játékos túlmelegszik meleg időben | Tartsd az értékeket 0.0-1.0 tartományban |
| Üres `healthLevels` anyagok | Nincs vizuális sérülés degradáció | Mindig hivatkozz legalább vanilla rvmat-okra |
| `super` kihagyása felülírásokban | Hibás leltár, sérülés vagy csatolási viselkedés | Mindig hívd meg a `super.MetódusNév()` függvényt először |

---

## Legjobb gyakorlatok

- **Kezdd egyszerű újratextúrázással.** Szerezz egy működő modot textúracserével, mielőtt egyedi tulajdonságokat vagy szkripteket adnál hozzá. Ez elkülöníti a config problémákat a textúra problémáktól.
- **Használd a _ColorBase mintát.** Közös tulajdonságok a `scope=0` alapban, csak textúrák és nevek a `scope=2` változatokban. Nincs duplikáció.
- **Tartsd realisztikusan a szigetelési értékeket.** Hivatkozz vanilla tárgyakra hasonló valós világbeli megfelelőkkel.
- **Tesztelj szkript konzollal a types.xml előtt.** Erősítsd meg, hogy a tárgy működik, mielőtt a spawn táblákat debugolnád.
- **Használj `$STR_` hivatkozásokat minden játékos felé néző szöveghez.** Lehetővé teszi a jövőbeli lokalizációt config változtatások nélkül.
- **Csomagold a Data és Scripts könyvtárakat külön PBO-kba.** Textúrák frissítése szkriptek újraépítése nélkül.
- **Biztosíts földi textúrákat.** A `_g_` textúra gondoskodik arról, hogy az eldobott tárgyak helyesen nézzenek ki.

---

## Elmélet vs gyakorlat

| Fogalom | Elmélet | Valóság |
|---------|---------|---------|
| `heatIsolation` | Egyszerű melegség szám | A tényleges melegség függ az egészségi állapottól és nedvességtől. A motor tényezőkkel szorozza a `MiscGameplayFunctions.GetCurrentItemHeatIsolation()` függvényben. |
| Páncélzat `damage` értékek | Alacsonyabb = több védelem | A 0.8-as érték azt jelenti, hogy a játékos a sérülés 80%-át kapja (csak 20% elnyelve). Sok modder a 0.9-et "90% védelemnek" olvassa, holott valójában 10%. |
| `scope` öröklés | A gyermekek öröklik a szülő scope-ját | NEM teszik. Minden osztálynak explicit módon be kell állítania a `scope` értéket. A szülő `scope=0` minden gyermeket alapértelmezés szerint `scope=0`-ra állít. |
| `absorbency` | Esővédelmet szabályoz | A nedvességfelszívást szabályozza, ami CSÖKKENTI a melegséget. Vízálló = ALACSONY absorbency (0.1). Magas absorbency (0.8+) = szivacsként szívja a vizet. |
| Rejtett kiválasztások | Bármely modellen működnek | Nem minden modell teszi elérhetővé ugyanazokat a kiválasztásokat. Ellenőrizd az Object Builder-rel vagy vanilla config-gal az alapmodell kiválasztása előtt. |

---

## Mit tanultál

Ebben az oktatóanyagban megtanultad:

- Hogyan öröklődik a DayZ ruházat slot-specifikus alaposztályokból (`Top_Base`, `Pants_Base` stb.)
- Hogyan definiálj egy ruhadarabot a config.cpp-ben hőszabályozási, páncélzati és nedvességi tulajdonságokkal
- Hogyan teszik lehetővé a rejtett kiválasztások a vanilla modellek egyedi terepszínű mintákkal való újratextúrázását
- Hogyan befolyásolja a `heatIsolation`, `visibilityModifier` és `absorbency` a játékmenetet
- Hogyan vezérli a `DamageSystem` a vizuális degradációt és a páncélvédelmet
- Hogyan hozz létre színváltozatokat a `_ColorBase` minta használatával
- Hogyan adj hozzá spawn bejegyzéseket a `types.xml`-lel és megjelenítési neveket a `Stringtable.csv`-vel
- Hogyan adj opcionálisan szkript viselkedést az `OnWasAttached` és `OnWasDetached` eseményekkel

**Következő:** Alkalmazd ugyanezeket a technikákat nadrág (`Pants_Base`), csizma (`Shoes_Base`) vagy mellény (`Vest_Base`) készítéséhez. A config struktúra azonos -- csak a szülőosztály és az inventory slot változik.

---

**Előző:** [8.8. fejezet: HUD Overlay](08-hud-overlay.md)
**Következő:** Hamarosan
