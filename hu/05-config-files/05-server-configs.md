# 5.5. fejezet: Szerver konfigurációs fájlok

[Főoldal](../README.md) | [<< Előző: ImageSet formátum](04-imagesets.md) | **Szerver konfigurációs fájlok** | [Következő: Spawn felszerelés konfiguráció >>](06-spawning-gear.md)

---

> **Összefoglalás:** A DayZ szervereket XML, JSON és script fájlok konfigurálják a küldetés mappában (pl. `mpmissions/dayzOffline.chernarusplus/`). Ezek a fájlok szabályozzák a tárgyak megjelenését, a gazdaság viselkedését, a játékmenet szabályait és a szerver azonosságát. Megértésük elengedhetetlen egyéni tárgyak hozzáadásához a loot gazdaságba, szerver paraméterek hangolásához, vagy egyéni küldetés építéséhez.

---

## Tartalomjegyzék

- [Áttekintés](#overview)
- [init.c --- Küldetés belépési pont](#initc--mission-entry-point)
- [types.xml --- Tárgy spawn definíciók](#typesxml--item-spawn-definitions)
- [cfgspawnabletypes.xml --- Kiegészítők és rakomány](#cfgspawnabletypesxml--attachments-and-cargo)
- [cfgrandompresets.xml --- Újrafelhasználható loot készletek](#cfgrandompresetsxml--reusable-loot-pools)
- [globals.xml --- Gazdasági paraméterek](#globalsxml--economy-parameters)
- [cfggameplay.json --- Játékmenet beállítások](#cfggameplayjson--gameplay-settings)
- [serverDZ.cfg --- Szerver beállítások](#serverdzcfg--server-settings)
- [Hogyan lépnek kapcsolatba a modok a gazdasággal](#how-mods-interact-with-the-economy)
- [Gyakori hibák](#common-mistakes)

---

## Áttekintés

Minden DayZ szerver a konfigurációját egy **küldetés mappából** tölti be. A Central Economy (CE) fájlok határozzák meg, milyen tárgyak jelennek meg, hol és mennyi ideig. Maga a szerver futtatható fájl a `serverDZ.cfg`-n keresztül van konfigurálva, amely a futtatható fájl mellett található.

| Fájl | Cél |
|------|---------|
| `init.c` | Küldetés belépési pont --- Hive inicializálás, dátum/idő, spawn felszerelés |
| `db/types.xml` | Tárgy spawn definíciók: mennyiségek, élettartamok, helyszínek |
| `cfgspawnabletypes.xml` | Előre felszerelt tárgyak és rakomány megjelenített entitásokon |
| `cfgrandompresets.xml` | Újrafelhasználható tárgy készletek a cfgspawnabletypes számára |
| `db/globals.xml` | Globális gazdasági paraméterek: maximális darabszámok, takarítási időzítők |
| `cfggameplay.json` | Játékmenet hangolás: állóképesség, bázisépítés, UI |
| `cfgeconomycore.xml` | Gyökér osztály regisztráció és CE naplózás |
| `cfglimitsdefinition.xml` | Érvényes kategória, használat és érték címkék definíciói |
| `serverDZ.cfg` | Szerver neve, jelszó, maximális játékosok, mod betöltés |

---

## init.c --- Küldetés belépési pont

Az `init.c` script az első dolog, amit a szerver végrehajt. Inicializálja a Central Economy-t és létrehozza a küldetés példányt.

```c
void main()
{
    Hive ce = CreateHive();
    if (ce)
        ce.InitOffline();

    GetGame().GetWorld().SetDate(2024, 9, 15, 12, 0);
    CreateCustomMission("dayzOffline.chernarusplus");
}

class CustomMission: MissionServer
{
    override PlayerBase CreateCharacter(PlayerIdentity identity, vector pos,
                                        ParamsReadContext ctx, string characterName)
    {
        Entity playerEnt;
        playerEnt = GetGame().CreatePlayer(identity, characterName, pos, 0, "NONE");
        Class.CastTo(m_player, playerEnt);
        GetGame().SelectPlayer(identity, m_player);
        return m_player;
    }

    override void StartingEquipSetup(PlayerBase player, bool clothesChosen)
    {
        EntityAI itemClothing = player.FindAttachmentBySlotName("Body");
        if (itemClothing)
        {
            itemClothing.GetInventory().CreateInInventory("BandageDressing");
        }
    }
}

Mission CreateCustomMission(string path)
{
    return new CustomMission();
}
```

A `Hive` kezeli a CE adatbázist. `CreateHive()` nélkül nem jelennek meg tárgyak és a perzisztencia le van tiltva. A `CreateCharacter` hozza létre a játékos entitást spawn-kor, a `StartingEquipSetup` pedig meghatározza azokat a tárgyakat, amelyeket egy friss karakter kap. Egyéb hasznos `MissionServer` felülírások: `OnInit()`, `OnUpdate()`, `InvokeOnConnect()` és `InvokeOnDisconnect()`.

---

## types.xml --- Tárgy spawn definíciók

A `db/types.xml` fájlban található, ez a CE szíve. Minden tárgynak, amely megjelenhet, rendelkeznie kell egy bejegyzéssel itt.

### Teljes bejegyzés

```xml
<type name="AK74">
    <nominal>6</nominal>
    <lifetime>28800</lifetime>
    <restock>0</restock>
    <min>4</min>
    <quantmin>30</quantmin>
    <quantmax>80</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1"
           count_in_player="0" crafted="0" deloot="0"/>
    <category name="weapons"/>
    <usage name="Military"/>
    <value name="Tier3"/>
    <value name="Tier4"/>
</type>
```

### Mező referencia

| Mező | Leírás |
|-------|-------------|
| `nominal` | Cél darabszám a térképen. A CE addig hoz létre tárgyakat, amíg ezt el nem éri |
| `min` | Minimális darabszám, mielőtt a CE újratöltést indít |
| `lifetime` | Másodpercek, amíg egy tárgy a földön marad eltűnés előtt |
| `restock` | Minimum másodpercek újratöltési kísérletek között (0 = azonnal) |
| `quantmin/quantmax` | Töltöttségi százalék mennyiséggel rendelkező tárgyakhoz (tárak, palackok). Használj `-1`-et mennyiség nélküli tárgyakhoz |
| `cost` | CE prioritás súly (magasabb = prioritizált). A legtöbb tárgy `100`-at használ |

### Jelzők

| Jelző | Cél |
|------|---------|
| `count_in_cargo` | A konténerekben lévő tárgyak beleszámítanak a nominálba |
| `count_in_hoarder` | A raktárakban/sátrakban/hordókban lévő tárgyak beleszámítanak a nominálba |
| `count_in_map` | A földön lévő tárgyak beleszámítanak a nominálba |
| `count_in_player` | A játékos leltárában lévő tárgyak beleszámítanak a nominálba |
| `crafted` | A tárgy csak barkácsolt, nem jelenik meg természetesen |
| `deloot` | Dinamikus esemény loot (helikopter roncsok, stb.) |

### Kategória, használat és érték címkék

Ezek a címkék szabályozzák, **hol** jelennek meg a tárgyak:

- **`category`** --- Tárgy típus. Vanilla: `tools`, `containers`, `clothes`, `food`, `weapons`, `books`, `explosives`, `lootdispatch`.
- **`usage`** --- Épület típusok. Vanilla: `Military`, `Police`, `Medic`, `Firefighter`, `Industrial`, `Farm`, `Coast`, `Town`, `Village`, `Hunting`, `Office`, `School`, `Prison`, `ContaminatedArea`, `Historical`.
- **`value`** --- Térkép szint zónák. Vanilla: `Tier1` (part), `Tier2` (szárazföld), `Tier3` (katonai), `Tier4` (mély katonai), `Unique`.

Több címke kombinálható. `usage` címkék nélkül a tárgy nem fog megjelenni. `value` címkék nélkül minden szinten megjelenik.

### Tárgy letiltása

Állítsd be `nominal=0` és `min=0` értékeket. A tárgy soha nem jelenik meg, de továbbra is létezhet scriptek vagy barkácsolás révén.

---

## cfgspawnabletypes.xml --- Kiegészítők és rakomány

Szabályozza, hogy mi jelenik meg **már felszerelve vagy benne** más tárgyakban.

### Felhalmozó jelölés

A tároló konténerek úgy vannak megjelölve, hogy a CE tudja, játékos tárgyakat tartalmaznak:

```xml
<type name="SeaChest">
    <hoarder />
</type>
```

### Spawn sérülés

```xml
<type name="NVGoggles">
    <damage min="0.0" max="0.32" />
</type>
```

Az értékek `0.0` (hibátlan) és `1.0` (tönkrement) között mozognak.

### Kiegészítők

```xml
<type name="PlateCarrierVest_Camo">
    <damage min="0.1" max="0.6" />
    <attachments chance="0.85">
        <item name="PlateCarrierHolster_Camo" chance="1.00" />
    </attachments>
    <attachments chance="0.85">
        <item name="PlateCarrierPouches_Camo" chance="1.00" />
    </attachments>
</type>
```

A külső `chance` határozza meg, hogy a kiegészítő csoport kiértékelésre kerül-e. A belső `chance` választja ki az adott tárgyat, amikor több tárgy van egy csoportban.

### Rakomány készletek

```xml
<type name="AssaultBag_Ttsko">
    <cargo preset="mixArmy" />
    <cargo preset="mixArmy" />
    <cargo preset="mixArmy" />
</type>
```

Minden sor függetlenül dobja a készletet --- három sor három különálló esélyt jelent.

---

## cfgrandompresets.xml --- Újrafelhasználható loot készletek

Megnevezett tárgy készleteket definiál, amelyeket a `cfgspawnabletypes.xml` hivatkozik:

```xml
<randompresets>
    <cargo chance="0.16" name="foodVillage">
        <item name="SodaCan_Cola" chance="0.02" />
        <item name="TunaCan" chance="0.05" />
        <item name="PeachesCan" chance="0.05" />
        <item name="BakedBeansCan" chance="0.05" />
        <item name="Crackers" chance="0.05" />
    </cargo>

    <cargo chance="0.15" name="toolsHermit">
        <item name="WeaponCleaningKit" chance="0.10" />
        <item name="Matchbox" chance="0.15" />
        <item name="Hatchet" chance="0.07" />
    </cargo>
</randompresets>
```

A készlet `chance` értéke az általános valószínűség, hogy bármi megjelenik. Ha a dobás sikeres, egy tárgy kerül kiválasztásra a készletből az egyedi tárgy esélyek alapján. Moddolt tárgyak hozzáadásához hozz létre egy új `cargo` blokkot és hivatkozd a `cfgspawnabletypes.xml`-ben.

---

## globals.xml --- Gazdasági paraméterek

A `db/globals.xml` fájlban található, ez a fájl állítja be a globális CE paramétereket:

```xml
<variables>
    <var name="AnimalMaxCount" type="0" value="200"/>
    <var name="ZombieMaxCount" type="0" value="1000"/>
    <var name="CleanupLifetimeDeadPlayer" type="0" value="3600"/>
    <var name="CleanupLifetimeDeadAnimal" type="0" value="1200"/>
    <var name="CleanupLifetimeDeadInfected" type="0" value="330"/>
    <var name="CleanupLifetimeRuined" type="0" value="330"/>
    <var name="FlagRefreshFrequency" type="0" value="432000"/>
    <var name="FlagRefreshMaxDuration" type="0" value="3456000"/>
    <var name="FoodDecay" type="0" value="1"/>
    <var name="InitialSpawn" type="0" value="100"/>
    <var name="LootDamageMin" type="1" value="0.0"/>
    <var name="LootDamageMax" type="1" value="0.82"/>
    <var name="SpawnInitial" type="0" value="1200"/>
    <var name="TimeLogin" type="0" value="15"/>
    <var name="TimeLogout" type="0" value="15"/>
    <var name="TimePenalty" type="0" value="20"/>
    <var name="TimeHopping" type="0" value="60"/>
    <var name="ZoneSpawnDist" type="0" value="300"/>
</variables>
```

### Kulcs változók

| Változó | Alapértelmezett | Leírás |
|----------|---------|-------------|
| `AnimalMaxCount` | 200 | Maximum állatok a térképen |
| `ZombieMaxCount` | 1000 | Maximum fertőzöttek a térképen |
| `CleanupLifetimeDeadPlayer` | 3600 | Holttest eltávolítási idő (másodperc) |
| `CleanupLifetimeRuined` | 330 | Tönkrement tárgy eltávolítási idő |
| `FlagRefreshFrequency` | 432000 | Területi zászló frissítési intervallum (5 nap) |
| `FlagRefreshMaxDuration` | 3456000 | Maximális zászló élettartam (40 nap) |
| `FoodDecay` | 1 | Étel romlás kapcsoló (0=ki, 1=be) |
| `InitialSpawn` | 100 | A nominál százaléka, ami indításkor megjelenik |
| `LootDamageMax` | 0.82 | Maximális sérülés a megjelent looton |
| `TimeLogin` / `TimeLogout` | 15 | Bejelentkezési/kijelentkezési időzítő (anti-combat-log) |
| `TimePenalty` | 20 | Combat log büntetési időzítő |
| `ZoneSpawnDist` | 300 | Játékos távolság, ami zombi/állat megjelenést vált ki |

A `type` attribútum `0` egész számhoz, `1` lebegőpontos számhoz. Rossz típus használata csonkítja az értéket.

---

## cfggameplay.json --- Játékmenet beállítások

Csak akkor töltődik be, ha `enableCfgGameplayFile = 1` van beállítva a `serverDZ.cfg`-ben. Enélkül a motor a beépített alapértékeket használja.

### Struktúra

```json
{
    "version": 123,
    "GeneralData": {
        "disableBaseDamage": false,
        "disableContainerDamage": false,
        "disableRespawnDialog": false
    },
    "PlayerData": {
        "disablePersonalLight": false,
        "StaminaData": {
            "sprintStaminaModifierErc": 1.0,
            "staminaMax": 100.0,
            "staminaWeightLimitThreshold": 6000.0,
            "staminaMinCap": 5.0
        },
        "MovementData": {
            "timeToSprint": 0.45,
            "rotationSpeedSprint": 0.15,
            "allowStaminaAffectInertia": true
        }
    },
    "WorldsData": {
        "lightingConfig": 0,
        "environmentMinTemps": [-3, -2, 0, 4, 9, 14, 18, 17, 13, 11, 9, 0],
        "environmentMaxTemps": [3, 5, 7, 14, 19, 24, 26, 25, 18, 14, 10, 5]
    },
    "BaseBuildingData": {
        "HologramData": {
            "disableIsCollidingBBoxCheck": false,
            "disableIsCollidingAngleCheck": false,
            "disableHeightPlacementCheck": false,
            "disallowedTypesInUnderground": ["FenceKit", "TerritoryFlagKit"]
        }
    },
    "MapData": {
        "ignoreMapOwnership": false,
        "displayPlayerPosition": false,
        "displayNavInfo": true
    }
}
```

Kulcs beállítások: a `disableBaseDamage` megakadályozza a bázis sérülést, a `disablePersonalLight` eltávolítja a friss spawn fényt, a `staminaWeightLimitThreshold` grammban van megadva (6000 = 6kg), a hőmérsékleti tömbök 12 értéket tartalmaznak (január--december), a `lightingConfig` `0`-t (alapértelmezett) vagy `1`-et (sötétebb éjszakák) fogad el, és a `displayPlayerPosition` mutatja a játékos pontját a térképen.

---

## serverDZ.cfg --- Szerver beállítások

Ez a fájl a szerver futtatható fájl mellett található, nem a küldetés mappában.

### Fő beállítások

```
hostname = "My DayZ Server";
password = "";
passwordAdmin = "adminpass123";
maxPlayers = 60;
verifySignatures = 2;
forceSameBuild = 1;
template = "dayzOffline.chernarusplus";
enableCfgGameplayFile = 1;
storeHouseStateDisabled = false;
storageAutoFix = 1;
```

| Paraméter | Leírás |
|-----------|-------------|
| `hostname` | Szerver neve a böngészőben |
| `password` | Csatlakozási jelszó (üres = nyílt) |
| `passwordAdmin` | RCON admin jelszó |
| `maxPlayers` | Maximális egyidejű játékosok |
| `template` | Küldetés mappa neve |
| `verifySignatures` | Aláírás ellenőrzési szint (2 = szigorú) |
| `enableCfgGameplayFile` | cfggameplay.json betöltése (0/1) |

### Mod betöltés

A modok indítási paramétereken keresztül vannak megadva, nem a konfigurációs fájlban:

```
DayZServer_x64.exe -config=serverDZ.cfg -mod=@CF;@MyMod -servermod=@MyServerMod -port=2302
```

A `-mod=` modokat a klienseknek is telepíteniük kell. A `-servermod=` modok csak szerver oldalon futnak.

---

## Hogyan lépnek kapcsolatba a modok a gazdasággal

### cfgeconomycore.xml --- Gyökér osztály regisztráció

Minden tárgy osztály hierarchiának vissza kell vezetnie egy regisztrált gyökér osztályhoz:

```xml
<economycore>
    <classes>
        <rootclass name="DefaultWeapon" />
        <rootclass name="DefaultMagazine" />
        <rootclass name="Inventory_Base" />
        <rootclass name="SurvivorBase" act="character" reportMemoryLOD="no" />
        <rootclass name="DZ_LightAI" act="character" reportMemoryLOD="no" />
        <rootclass name="CarScript" act="car" reportMemoryLOD="no" />
    </classes>
</economycore>
```

Ha a modod egy olyan új alap osztályt vezet be, amely nem az `Inventory_Base`, `DefaultWeapon` vagy `DefaultMagazine` osztályból öröklődik, add hozzá `rootclass`-ként. Az `act` attribútum az entitás típusát adja meg: `character` AI-hoz, `car` járművekhez.

### cfglimitsdefinition.xml --- Egyéni címkék

Minden `category`, `usage` vagy `value`, amelyet a `types.xml`-ben használsz, itt kell definiálni:

```xml
<lists>
    <categories>
        <category name="mymod_special"/>
    </categories>
    <usageflags>
        <usage name="MyModDungeon"/>
    </usageflags>
    <valueflags>
        <value name="MyModEndgame"/>
    </valueflags>
</lists>
```

Használd a `cfglimitsdefinitionuser.xml` fájlt olyan kiegészítésekhez, amelyek nem írják felül a vanilla fájlt.

### economy.xml --- Alrendszer vezérlés

Szabályozza, hogy mely CE alrendszerek aktívak:

```xml
<economy>
    <dynamic init="1" load="1" respawn="1" save="1"/>
    <animals init="1" load="0" respawn="1" save="0"/>
    <zombies init="1" load="0" respawn="1" save="0"/>
    <vehicles init="1" load="1" respawn="1" save="1"/>
</economy>
```

Jelzők: `init` (megjelenés indításkor), `load` (perzisztencia betöltése), `respawn` (újramegjelenés takarítás után), `save` (mentés adatbázisba).

### Script oldali gazdasági interakció

A `CreateInInventory()` metódussal létrehozott tárgyak automatikusan CE-kezeltek. Világ spawn-okhoz használd az ECE jelzőket:

```c
EntityAI item = GetGame().CreateObjectEx("AK74", position, ECE_PLACE_ON_SURFACE);
```

---

## Gyakori hibák

### XML szintaxis hibák

Egyetlen le nem zárt címke elrontja az egész fájlt. Mindig validáld az XML-t telepítés előtt.

### Hiányzó címkék a cfglimitsdefinition.xml-ben

Olyan `usage` vagy `value` használata a types.xml-ben, ami nincs definiálva a cfglimitsdefinition.xml-ben, a tárgy csendes megjelenési hibáját okozza. Ellenőrizd az RPT logokat figyelmeztetésekért.

### Túl magas nominal

Az összes tárgy teljes nominálja 10 000--15 000 alatt kell maradjon. Túlzott értékek rontják a szerver teljesítményét.

### Túl rövid élettartam

A nagyon rövid élettartamú tárgyak eltűnnek, mielőtt a játékosok megtalálnák őket. Használj legalább `3600`-at (1 óra) közönséges tárgyakhoz, `28800`-at (8 óra) fegyverekhez.

### Hiányzó gyökér osztály

Azok a tárgyak, amelyek osztály hierarchiája nem vezethető vissza egy regisztrált gyökér osztályhoz a `cfgeconomycore.xml`-ben, soha nem fognak megjelenni, még helyes types.xml bejegyzésekkel sem.

### cfggameplay.json nincs engedélyezve

A fájl figyelmen kívül marad, hacsak az `enableCfgGameplayFile = 1` nincs beállítva a `serverDZ.cfg`-ben.

### Rossz típus a globals.xml-ben

A `type="0"` (egész szám) használata egy lebegőpontos értékhez, mint a `0.82`, csonkítja azt `0`-ra. Használj `type="1"`-et lebegőpontos számokhoz.

### Vanilla fájlok közvetlen szerkesztése

A vanilla types.xml módosítása működik, de a játék frissítésekor elromlik. Inkább szállíts külön típus fájlokat és regisztráld őket cfgeconomycore-on keresztül, vagy használd a `cfglimitsdefinitionuser.xml`-t egyéni címkékhez.

---

## Legjobb gyakorlatok

- Szállíts egy `ServerFiles/` mappát a mododdal, amely előre konfigurált `types.xml` bejegyzéseket tartalmaz, hogy a szerver adminisztrátorok másolhassák-beilleszthessék ahelyett, hogy nulláról írnák.
- Használd a `cfglimitsdefinitionuser.xml` fájlt a vanilla `cfglimitsdefinition.xml` szerkesztése helyett -- a kiegészítéseid túlélik a játék frissítéseket.
- Állítsd be a `count_in_hoarder="0"` értéket közönséges tárgyakhoz (étel, lőszer), hogy megelőzd a felhalmozást, ami blokkolja a CE újramegjelenéseket.
- Mindig állítsd be az `enableCfgGameplayFile = 1` értéket a `serverDZ.cfg`-ben, mielőtt elvárno a `cfggameplay.json` változtatások érvénybe lépését.
- Tartsd az összes `nominal` értéket a types.xml bejegyzésekben 12 000 alatt, hogy elkerüld a CE teljesítményromlást népszerű szervereken.

---

## Elmélet vs. gyakorlat

| Fogalom | Elmélet | Valóság |
|---------|--------|---------|
| A `nominal` kemény célérték | A CE pontosan ennyi tárgyat hoz létre | A CE idővel közelíti meg a nominált, de ingadozik a játékos interakció, takarítási ciklusok és zóna távolság alapján |
| A `restock=0` azonnali újramegjelenést jelent | A tárgyak azonnal újra megjelennek eltűnés után | A CE kötegelt feldolgozásban kezeli az újratöltést ciklusokban (jellemzően 30-60 másodpercenként), tehát mindig van késleltetés a restock értéktől függetlenül |
| A `cfggameplay.json` minden játékmenetet szabályoz | Minden hangolás ide kerül | Sok játékmenet érték scriptben vagy config.cpp-ben van beépítve és nem írható felül a cfggameplay.json-nel |
| Az `init.c` csak szerver indításkor fut | Egyszeri inicializáció | Az `init.c` minden alkalommal lefut, amikor a küldetés betöltődik, beleértve a szerver újraindításokat is. A perzisztens állapotot a Hive kezeli, nem az init.c |
| Több types.xml fájl tisztán egyesül | A CE az összes regisztrált fájlt olvassa | A fájlokat a cfgeconomycore.xml-ben kell regisztrálni `<ce folder="custom">` direktívákkal. Egyszerűen extra XML fájlokat elhelyezni a `db/` mappában nem csinál semmit |

---

## Kompatibilitás és hatás

- **Multi-Mod:** Több mod is adhat bejegyzéseket a types.xml-hez ütközés nélkül, amennyiben az osztálynevek egyediek. Ha két mod ugyanazt az osztálynevet definiálja különböző nominal/lifetime értékekkel, az utoljára betöltött bejegyzés nyer.
- **Teljesítmény:** Túlzott nominal számok (15 000+) CE tick kiugrásokat okoznak, amelyek szerver FPS csökkenésként láthatók. Minden CE ciklus végigiterál az összes regisztrált típuson a spawn feltételek ellenőrzéséhez.
