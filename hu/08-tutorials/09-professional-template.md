# 8.9. fejezet: Professzionális mod sablon

[Főoldal](../README.md) | [<< Előző: HUD overlay építése](08-hud-overlay.md) | **Professzionális mod sablon** | [Következő: Egyéni jármű készítése >>](10-vehicle-mod.md)

---

## Tartalomjegyzék

- [Áttekintés](#áttekintés)
- [Teljes könyvtárstruktúra](#teljes-könyvtárstruktúra)
- [mod.cpp](#modcpp)
- [config.cpp](#configcpp)
- [Konstansok fájl (3_Game)](#konstansok-fájl-3_game)
- [Config adat osztály (3_Game)](#config-adat-osztály-3_game)
- [RPC definíciók (3_Game)](#rpc-definíciók-3_game)
- [Manager szingleton (4_World)](#manager-szingleton-4_world)
- [Játékos eseménykezelő (4_World)](#játékos-eseménykezelő-4_world)
- [Mission hook: szerver (5_Mission)](#mission-hook-szerver-5_mission)
- [Mission hook: kliens (5_Mission)](#mission-hook-kliens-5_mission)
- [UI panel szkript (5_Mission)](#ui-panel-szkript-5_mission)
- [Layout fájl](#layout-fájl)
- [stringtable.csv](#stringtablecsv)
- [Inputs.xml](#inputsxml)
- [Build szkript](#build-szkript)
- [Testreszabási útmutató](#testreszabási-útmutató)
- [Funkció bővítési útmutató](#funkció-bővítési-útmutató)
- [Következő lépések](#következő-lépések)

---

## Áttekintés

Egy "Hello World" mod bizonyítja, hogy az eszközlánc működik. Egy professzionális mod sokkal többet igényel:

| Szempont | Hello World | Professzionális sablon |
|---------|-------------|----------------------|
| Konfiguráció | Hardkódolt értékek | JSON config betöltéssel/mentéssel/alapértékekkel |
| Kommunikáció | Print utasítások | Sztring-útválasztott RPC (kliens és szerver között) |
| Architektúra | Egy fájl, egy függvény | Szingleton manager, réteges szkriptek, tiszta életciklus |
| Felhasználói felület | Nincs | Layout-vezérelt UI panel nyitás/zárással |
| Input kötés | Nincs | Egyéni billentyűkötés az Opciók > Vezérlők menüben |
| Lokalizáció | Nincs | stringtable.csv 13 nyelven |
| Build folyamat | Manuális Addon Builder | Egy kattintásos batch szkript |
| Takarítás | Nincs | Megfelelő leállítás a mission végén, nincs szivárgás |

Ez a sablon mindezt megadja azonnal. Átnevezed az azonosítókat, törlöd a nem szükséges rendszereket, és elkezded a tényleges funkciód építését szilárd alapokon.

---

## Teljes könyvtárstruktúra

Ez a teljes forrás elrendezés. Minden alább felsorolt fájl teljes sablonként van megadva ebben a fejezetben.

```
MyProfessionalMod/                          <-- Forrás gyökér (a P: meghajtón él)
    mod.cpp                                 <-- Indító metaadatok
    Scripts/
        config.cpp                          <-- Motor regisztráció (CfgPatches + CfgMods)
        Inputs.xml                          <-- Billentyűkötés definíciók
        stringtable.csv                     <-- Lokalizált sztringek (13 nyelv)
        3_Game/
            MyMod/
                MyModConstants.c            <-- Enumok, verzió sztring, megosztott konstansok
                MyModConfig.c               <-- JSON-szerializálható config alapértékekkel
                MyModRPC.c                  <-- RPC útvonal nevek és regisztráció
        4_World/
            MyMod/
                MyModManager.c              <-- Szingleton manager (életciklus, config, állapot)
                MyModPlayerHandler.c        <-- Játékos csatlakozás/lecsatlakozás hookok
        5_Mission/
            MyMod/
                MyModMissionServer.c        <-- modolt MissionServer (szerver init/leállítás)
                MyModMissionClient.c        <-- modolt MissionGameplay (kliens init/leállítás)
                MyModUI.c                   <-- UI panel szkript (nyitás/zárás/feltöltés)
        GUI/
            layouts/
                MyModPanel.layout           <-- UI layout definíció
    build.bat                               <-- PBO csomagolás automatizálás

Összeállítás után a terjeszthető mod mappa így néz ki:

@MyProfessionalMod/                         <-- Ami a szerverre / Workshop-ra kerül
    mod.cpp
    addons/
        MyProfessionalMod_Scripts.pbo       <-- Scripts/-ból csomagolva
    keys/
        MyMod.bikey                         <-- Kulcs aláírt szerverekhez
    meta.cpp                                <-- Workshop metaadat (automatikusan generált)
```

---

## mod.cpp

Ez a fájl szabályozza, mit látnak a játékosok a DayZ indítóban. A mod gyökerében van elhelyezve, **nem** a `Scripts/` mappában.

```cpp
// ==========================================================================
// mod.cpp - Mod azonosság a DayZ indítóhoz
// Ezt a fájlt az indító olvassa a mod információk megjelenítéséhez a mod listában.
// NEM a szkript motor fordítja -- tisztán metaadat.
// ==========================================================================

// Az indító mod listájában és a játékon belüli mod képernyőn megjelenő név.
name         = "My Professional Mod";

// A neved vagy csapatod neve. A "Szerző" oszlopban jelenik meg.
author       = "YourName";

// Szemantikus verzió sztring. Frissítsd minden kiadásnál.
// Az indító megjeleníti, hogy a játékosok tudják, melyik verziójuk van.
version      = "1.0.0";

// Rövid leírás, ami a mod fölé húzva jelenik meg az indítóban.
// Tartsd 200 karakter alatt az olvashatóság érdekében.
overview     = "A professional mod template with config, RPC, UI, and keybinds.";

// Tooltip, ami hover-re jelenik meg. Általában megegyezik a mod nevével.
tooltipOwned = "My Professional Mod";

// Opcionális: útvonal egy előnézeti képhez (mod gyökéréhez relatív).
// Ajánlott méret: 256x256 vagy 512x512, PAA vagy EDDS formátum.
// Hagyd üresen, ha még nincs képed.
picture      = "";

// Opcionális: logó megjelenítve a mod részletek panelen.
logo         = "";
logoSmall    = "";
logoOver     = "";

// Opcionális: URL, ami megnyílik, amikor a játékos a "Weboldal" gombra kattint az indítóban.
action       = "";
actionURL    = "";
```

---

## config.cpp

Ez a legkritikusabb fájl. Regisztrálja a mododat a motorral, deklarálja a függőségeket, összeköti a szkript rétegeket, és opcionálisan beállít előfeldolgozó definíciókat és képkészleteket.

Helyezd el itt: `Scripts/config.cpp`.

```cpp
// ==========================================================================
// config.cpp - Motor regisztráció
// A DayZ motor ezt olvassa, hogy megtudja, mit biztosít a modod.
// Két szekció fontos: CfgPatches (függőségi gráf) és CfgMods (szkript betöltés).
// ==========================================================================

// --------------------------------------------------------------------------
// CfgPatches - Függőség deklaráció
// A motor ezt használja a betöltési sorrend meghatározásához. Ha a modod függ
// egy másik modtól, listázd annak CfgPatches osztályát a requiredAddons[]-ben.
// --------------------------------------------------------------------------
class CfgPatches
{
    // Az osztálynévnek globálisan egyedinek KELL lennie az összes mod között.
    // Konvenció: ModNév_Scripts (megegyezik a PBO névvel).
    class MyMod_Scripts
    {
        // units[] és weapons[] az addon által definiált config osztályokat deklarálják.
        // Csak-szkript modoknál hagyd ezeket üresen. Azok a modok használják,
        // amelyek új tárgyakat, fegyvereket vagy járműveket definiálnak a config.cpp-ben.
        units[] = {};
        weapons[] = {};

        // Minimum motor verzió. 0.1 működik minden jelenlegi DayZ verzióhoz.
        requiredVersion = 0.1;

        // Függőségek: listázd a CfgPatches osztályneveket más modokból.
        // "DZ_Data" az alapjáték -- minden modnak függenie kell tőle.
        // Add hozzá a "CF_Scripts"-et, ha Community Framework-öt használsz.
        // Add hozzá más mod javításokat, ha kiterjeszted őket.
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

// --------------------------------------------------------------------------
// CfgMods - Szkript modul regisztráció
// Megmondja a motornak, hol él az egyes szkript rétegek és milyen definíciókat kell beállítani.
// --------------------------------------------------------------------------
class CfgMods
{
    // Az osztálynév itt a modod belső azonosítója.
    // NEM kell egyeznie a CfgPatches-szel -- de ha összefüggőnek tartod őket,
    // könnyebben navigálható a kódbázis.
    class MyMod
    {
        // dir: a mappa neve a P: meghajtón (vagy a PBO-ban).
        // Pontosan egyeznie kell a valódi gyökérmappa neveddel.
        dir = "MyProfessionalMod";

        // Megjelenítési név (a Workbench-ben és néhány motor naplóban jelenik meg).
        name = "My Professional Mod";

        // Szerző és leírás motor metaadatokhoz.
        author = "YourName";
        overview = "Professional mod template";

        // Mod típus. Mindig "mod" szkript modoknál.
        type = "mod";

        // credits: opcionális útvonal egy Credits.json fájlhoz.
        // creditsJson = "MyProfessionalMod/Scripts/Credits.json";

        // inputs: útvonal az Inputs.xml fájlodhoz egyéni billentyűkötésekhez.
        // Ezt ITT KELL beállítani, hogy a motor betöltse a billentyűkötéseidet.
        inputs = "MyProfessionalMod/Scripts/Inputs.xml";

        // defines: előfeldolgozó szimbólumok, amelyek a modod betöltésekor vannak beállítva.
        // Más modok használhatják az #ifdef MYMOD feltételt a modod jelenlétének
        // észlelésére és feltételes integrációs kód fordítására.
        defines[] = { "MYMOD" };

        // dependencies: melyik vanilla szkript modulokba hookol be a modod.
        // "Game" = 3_Game, "World" = 4_World, "Mission" = 5_Mission.
        // A legtöbb modnak mindháromra szüksége van. A "Core"-t csak akkor add hozzá, ha 1_Core-t használsz.
        dependencies[] =
        {
            "Game", "World", "Mission"
        };

        // defs: leképezi az egyes szkript modulokat a lemezen lévő mappájukra.
        // A motor rekurzívan fordítja az összes .c fájlt ezekben az útvonalakban.
        // Nincs #include az Enforce Script-ben -- a fájlok így töltődnek be.
        class defs
        {
            // imageSets: regisztrálj .imageset fájlokat layoutokban való használathoz.
            // Csak akkor szükséges, ha egyéni ikonokkal/textúrákkal rendelkezel az UI-hoz.
            // Vedd ki a megjegyzést és frissítsd az útvonalakat, ha imageset-et adsz hozzá.
            //
            // class imageSets
            // {
            //     files[] =
            //     {
            //         "MyProfessionalMod/GUI/imagesets/mymod_icons.imageset"
            //     };
            // };

            // Game réteg (3_Game): elsőként töltődik be.
            // Enumok, konstansok, config osztályok, RPC definíciók ide kerülnek.
            // NEM hivatkozhat 4_World vagy 5_Mission típusokra.
            class gameScriptModule
            {
                value = "";
                files[] = { "MyProfessionalMod/Scripts/3_Game" };
            };

            // World réteg (4_World): másodikként töltődik be.
            // Managerek, entitás módosítások, világ interakciók ide kerülnek.
            // HIVATKOZHAT 3_Game típusokra. NEM hivatkozhat 5_Mission típusokra.
            class worldScriptModule
            {
                value = "";
                files[] = { "MyProfessionalMod/Scripts/4_World" };
            };

            // Mission réteg (5_Mission): utolsóként töltődik be.
            // Mission hookok, UI panelek, indítás/leállítás logika ide kerül.
            // HIVATKOZHAT az összes alacsonyabb réteg típusaira.
            class missionScriptModule
            {
                value = "";
                files[] = { "MyProfessionalMod/Scripts/5_Mission" };
            };
        };
    };
};
```

---

## Konstansok fájl (3_Game)

Helyezd el itt: `Scripts/3_Game/MyMod/MyModConstants.c`.

Ez a fájl definiálja az összes megosztott konstanst, enumot és a verzió sztringet. A `3_Game`-ben van, hogy minden magasabb réteg hozzáférhessen ezekhez az értékekhez.

```c
// ==========================================================================
// MyModConstants.c - Megosztott konstansok és enumok
// 3_Game réteg: minden magasabb réteg számára elérhető (4_World, 5_Mission).
//
// MIÉRT létezik ez a fájl:
//   A konstansok központosítása megakadályozza a fájlok közötti szétszórt mágikus számokat.
//   Az enumok fordítási idejű biztonságot adnak nyers int összehasonlítások helyett.
//   A verzió sztring egyszer van definiálva és naplókban meg UI-ban van használva.
// ==========================================================================

// ---------------------------------------------------------------------------
// Verzió - frissítsd minden kiadásnál
// ---------------------------------------------------------------------------
const string MYMOD_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Napló címke - előtag az összes Print/napló üzenethez ebből a modból
// Következetes címke használata megkönnyíti a szkript napló szűrését.
// ---------------------------------------------------------------------------
const string MYMOD_TAG = "[MyMod]";

// ---------------------------------------------------------------------------
// Fájlútvonalak - központosítva, hogy az elgépelések egy helyen derüljenek ki
// $profile: futásidőben a szerver profil könyvtárára oldódik fel.
// ---------------------------------------------------------------------------
const string MYMOD_CONFIG_DIR  = "$profile:MyMod";
const string MYMOD_CONFIG_PATH = "$profile:MyMod/config.json";

// ---------------------------------------------------------------------------
// Enum: funkció módok
// Használj enumokat nyers int-ek helyett olvashatóságért és fordítási idejű ellenőrzésekért.
// ---------------------------------------------------------------------------
enum MyModMode
{
    DISABLED = 0,    // A funkció ki van kapcsolva
    PASSIVE  = 1,    // A funkció fut, de nem avatkozik be
    ACTIVE   = 2     // A funkció teljesen engedélyezve van
};

// ---------------------------------------------------------------------------
// Enum: értesítés típusok (az UI használja ikon/szín kiválasztáshoz)
// ---------------------------------------------------------------------------
enum MyModNotifyType
{
    INFO    = 0,
    SUCCESS = 1,
    WARNING = 2,
    ERROR   = 3
};
```

---

## Config adat osztály (3_Game)

Helyezd el itt: `Scripts/3_Game/MyMod/MyModConfig.c`.

Ez egy JSON-szerializálható beállítás osztály. A szerver indításkor tölti be. Ha nem létezik fájl, az alapértékek használatosak és egy friss config mentésre kerül a lemezre.

```c
// ==========================================================================
// MyModConfig.c - JSON konfiguráció alapértékekkel
// 3_Game réteg, hogy mind a 4_World managerek, mind az 5_Mission hookok olvashassák.
//
// HOGYAN MŰKÖDIK:
//   A JsonFileLoader<MyModConfig> az Enforce Script beépített JSON
//   szerializálóját használja. Minden alapértékkel rendelkező mező a JSON
//   fájlba írásra / fájlból olvasásra kerül. Új mező hozzáadása biztonságos --
//   a régi config fájlok egyszerűen megkapják az alapértéket a hiányzó mezőkhöz.
//
// ENFORCE SCRIPT BUKTATÓ:
//   A JsonFileLoader<T>.JsonLoadFile(path, obj) VOID-ot ad vissza.
//   NEM teheted: if (JsonFileLoader<T>.JsonLoadFile(...)) -- nem fordul le.
//   Mindig előre létrehozott objektumot adj át referencia szerint.
// ==========================================================================

class MyModConfig
{
    // --- Általános beállítások ---

    // Főkapcsoló: ha false, az egész mod le van tiltva.
    bool Enabled = true;

    // Milyen gyakran (másodpercben) futtatja a manager a frissítési ciklusát.
    // Alacsonyabb értékek = reaktívabb, de magasabb CPU költség.
    float UpdateInterval = 5.0;

    // A mod által egyidejűleg kezelt tárgyak/entitások maximális száma.
    int MaxItems = 100;

    // Mód: 0 = DISABLED, 1 = PASSIVE, 2 = ACTIVE (lásd MyModMode enum).
    int Mode = 2;

    // --- Üzenetek ---

    // Üdvözlő üzenet, ami a játékosoknak jelenik meg csatlakozáskor.
    // Üres sztring = nincs üzenet.
    string WelcomeMessage = "Welcome to the server!";

    // Az üdvözlő üzenet értesítésként vagy chat üzenetként jelenjen-e meg.
    bool WelcomeAsNotification = true;

    // --- Naplózás ---

    // Részletes debug naplózás engedélyezése. Éles szervereknél kapcsold ki.
    bool DebugLogging = false;

    // -----------------------------------------------------------------------
    // Load - configot olvas a lemezről, alapértékekkel tér vissza, ha hiányzik
    // -----------------------------------------------------------------------
    static MyModConfig Load()
    {
        // Mindig először hozz létre friss példányt. Ez biztosítja, hogy minden
        // alapérték be legyen állítva, még ha a JSON fájlból hiányoznak mezők
        // (pl. egy frissítés után, ami új beállításokat adott hozzá).
        MyModConfig cfg = new MyModConfig();

        // Ellenőrizd, hogy létezik-e a config fájl a betöltés megkísérlése előtt.
        // Első futásnál nem fog létezni -- alapértékeket használunk és mentünk.
        if (FileExist(MYMOD_CONFIG_PATH))
        {
            // A JsonLoadFile feltölti a meglévő objektumot. NEM ad vissza
            // új objektumot. A JSON-ban jelen lévő mezők felülírják az alapértékeket;
            // a JSON-ból hiányzó mezők megtartják az alapértékeiket.
            JsonFileLoader<MyModConfig>.JsonLoadFile(MYMOD_CONFIG_PATH, cfg);
        }
        else
        {
            // Első futás: alapértékek mentése, hogy az adminnak legyen szerkeszthető fájlja.
            cfg.Save();
            Print(MYMOD_TAG + " No config found, created default at: " + MYMOD_CONFIG_PATH);
        }

        return cfg;
    }

    // -----------------------------------------------------------------------
    // Save - aktuális értékek írása lemezre formázott JSON-ként
    // -----------------------------------------------------------------------
    void Save()
    {
        // Biztosítsd, hogy a könyvtár létezik. A MakeDirectory biztonságosan
        // hívható, még ha a könyvtár már létezik is.
        if (!FileExist(MYMOD_CONFIG_DIR))
        {
            MakeDirectory(MYMOD_CONFIG_DIR);
        }

        // A JsonSaveFile az összes mezőt JSON objektumként írja.
        // A fájl teljes egészében felülíródik -- nincs egyesítés.
        JsonFileLoader<MyModConfig>.JsonSaveFile(MYMOD_CONFIG_PATH, this);
    }
};
```

Az eredményül kapott `config.json` a lemezen így néz ki:

```json
{
    "Enabled": true,
    "UpdateInterval": 5.0,
    "MaxItems": 100,
    "Mode": 2,
    "WelcomeMessage": "Welcome to the server!",
    "WelcomeAsNotification": true,
    "DebugLogging": false
}
```

Az adminok szerkesztik ezt a fájlt, újraindítják a szervert, és az új értékek érvénybe lépnek.

---

## RPC definíciók (3_Game)

Helyezd el itt: `Scripts/3_Game/MyMod/MyModRPC.c`.

Az RPC (Remote Procedure Call) az, ahogyan a kliens és a szerver kommunikál a DayZ-ben. Ez a fájl definiálja az útvonal neveket és segéd metódusokat biztosít a regisztrációhoz.

```c
// ==========================================================================
// MyModRPC.c - RPC útvonal definíciók és segédek
// 3_Game réteg: az útvonal név konstansoknak mindenhol elérhetőeknek kell lenniük.
//
// HOGYAN MŰKÖDIK AZ RPC A DAYZ-BEN:
//   A motor ScriptRPC-t és OnRPC-t biztosít adatok küldéséhez/fogadásához.
//   Meghívod a GetGame().RPCSingleParam() metódust vagy létrehozol egy ScriptRPC-t,
//   adatokat írsz bele, és elküldöd. A fogadó ugyanabban a sorrendben olvassa az adatokat.
//
//   A DayZ egész szám RPC ID-kat használ. A modok közötti ütközések elkerülése érdekében
//   minden modnak egyedi ID tartományt kell választania vagy sztring-útválasztó rendszert kell használnia.
//   Ez a sablon egyetlen egyedi int ID-t használ sztring előtaggal,
//   hogy azonosítsa, melyik kezelőnek kell feldolgoznia az egyes üzeneteket.
//
// MINTA:
//   1. A kliens adatot akar -> kérés RPC-t küld a szervernek
//   2. A szerver feldolgozza -> válasz RPC-t küld vissza a kliensnek
//   3. A kliens fogadja -> frissíti az UI-t vagy állapotot
// ==========================================================================

// ---------------------------------------------------------------------------
// RPC ID - válassz egy egyedi számot, ami nem valószínű, hogy ütközik más modokkal.
// Ellenőrizd a DayZ közösségi wikit a gyakran használt tartományokért.
// A motor beépített RPC-i alacsony számokat használnak (0-1000).
// Konvenció: használj 5 jegyű számot a mod nevedből származó hash alapján.
// ---------------------------------------------------------------------------
const int MYMOD_RPC_ID = 74291;

// ---------------------------------------------------------------------------
// RPC útvonal nevek - sztring azonosítók minden RPC végponthoz.
// Konstansok használata megakadályozza az elgépeléseket és lehetővé teszi az IDE keresést.
// ---------------------------------------------------------------------------
const string MYMOD_RPC_CONFIG_SYNC     = "MyMod:ConfigSync";
const string MYMOD_RPC_WELCOME         = "MyMod:Welcome";
const string MYMOD_RPC_PLAYER_DATA     = "MyMod:PlayerData";
const string MYMOD_RPC_UI_REQUEST      = "MyMod:UIRequest";
const string MYMOD_RPC_UI_RESPONSE     = "MyMod:UIResponse";

// ---------------------------------------------------------------------------
// MyModRPCHelper - statikus segédosztály RPC-k küldéséhez
// Becsomagolja a ScriptRPC létrehozásának, útvonal sztring írásának,
// payload írásának és Send() hívásának sablon kódját.
// ---------------------------------------------------------------------------
class MyModRPCHelper
{
    // Sztring üzenet küldése szerverről egy adott kliensnek.
    // identity: a célj átékos. null = broadcast mindenkinek.
    // routeName: melyik kezelő dolgozza fel (pl. MYMOD_RPC_WELCOME).
    // message: a sztring payload.
    static void SendStringToClient(PlayerIdentity identity, string routeName, string message)
    {
        // RPC objektum létrehozása. Ez a boríték.
        ScriptRPC rpc = new ScriptRPC();

        // Az útvonal név írása először. A fogadó ezt olvassa, hogy eldöntse,
        // melyik kezelőt hívja. Mindig ugyanabban a sorrendben írj/olvass.
        rpc.Write(routeName);

        // A payload adatok írása.
        rpc.Write(message);

        // Küldés a kliensnek. Paraméterek:
        //   null    = nincs célobjektum (játékos entitás nem szükséges egyéni RPC-khez)
        //   MYMOD_RPC_ID = az egyedi RPC csatornánk
        //   true    = garantált kézbesítés (TCP-szerű). Használj false-t gyakori frissítésekhez.
        //   identity = cél kliens. null minden kliensnek broadcastolna.
        rpc.Send(null, MYMOD_RPC_ID, true, identity);
    }

    // Kérés küldése kliensről a szerverre (nincs payload, csak az útvonal).
    static void SendRequestToServer(string routeName)
    {
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(routeName);
        // Szerverre küldéskor az identity null (a szervernek nincs PlayerIdentity-je).
        // guaranteed = true biztosítja az üzenet megérkezését.
        rpc.Send(null, MYMOD_RPC_ID, true, null);
    }
};
```

---

## Manager szingleton (4_World)

Helyezd el itt: `Scripts/4_World/MyMod/MyModManager.c`.

Ez a modod szerver oldali központi agya. Birtokolja a configot, feldolgozza az RPC-ket és periodikus frissítéseket futtat.

```c
// ==========================================================================
// MyModManager.c - Szerver oldali szingleton manager
// 4_World réteg: hivatkozhat 3_Game típusokra (config, konstansok, RPC).
//
// MIÉRT szingleton:
//   A managernek pontosan egy példányra van szüksége, ami a teljes mission
//   ideje alatt fennmarad. Több példány duplikált feldolgozást és
//   ütköző állapotot okozna. A szingleton minta garantálja az egy példányt
//   és globális hozzáférést biztosít a GetInstance() metóduson keresztül.
//
// ÉLETCIKLUS:
//   1. MissionServer.OnInit() meghívja a MyModManager.GetInstance().Init()-et
//   2. A manager betölti a configot, regisztrálja az RPC-ket, elindítja az időzítőket
//   3. A manager feldolgozza az eseményeket a játékmenet során
//   4. MissionServer.OnMissionFinish() meghívja a MyModManager.Cleanup()-ot
//   5. A szingleton megsemmisül, minden hivatkozás felszabadul
// ==========================================================================

class MyModManager
{
    // Az egyetlen példány. 'ref' azt jelenti, hogy ez az osztály BIRTOKOLJA az objektumot.
    // Amikor az s_Instance null-ra van állítva, az objektum megsemmisül.
    private static ref MyModManager s_Instance;

    // Lemezről betöltött konfiguráció.
    // 'ref', mert a manager birtokolja a config objektum élettartamát.
    protected ref MyModConfig m_Config;

    // Az utolsó frissítési ciklus óta eltelt idő (másodperc).
    protected float m_TimeSinceUpdate;

    // Nyomon követi, hogy az Init() sikeresen meghívásra került-e.
    protected bool m_Initialized;

    // -----------------------------------------------------------------------
    // Szingleton hozzáférés
    // -----------------------------------------------------------------------

    static MyModManager GetInstance()
    {
        if (!s_Instance)
        {
            s_Instance = new MyModManager();
        }
        return s_Instance;
    }

    // Hívd meg a mission végén a szingleton megsemmisítéséhez és memória felszabadításhoz.
    // Az s_Instance null-ra állítása aktiválja a destruktort.
    static void Cleanup()
    {
        s_Instance = null;
    }

    // -----------------------------------------------------------------------
    // Életciklus
    // -----------------------------------------------------------------------

    // Egyszer hívódik a MissionServer.OnInit()-ből.
    void Init()
    {
        if (m_Initialized) return;

        // Config betöltése lemezről (vagy alapértékek létrehozása első futáskor).
        m_Config = MyModConfig.Load();

        if (!m_Config.Enabled)
        {
            Print(MYMOD_TAG + " Mod is DISABLED in config. Skipping initialization.");
            return;
        }

        // Frissítési időzítő visszaállítása.
        m_TimeSinceUpdate = 0;

        m_Initialized = true;

        Print(MYMOD_TAG + " Manager initialized (v" + MYMOD_VERSION + ")");

        if (m_Config.DebugLogging)
        {
            Print(MYMOD_TAG + " Debug logging enabled");
            Print(MYMOD_TAG + " Update interval: " + m_Config.UpdateInterval.ToString() + "s");
            Print(MYMOD_TAG + " Max items: " + m_Config.MaxItems.ToString());
        }
    }

    // Minden frame-ben hívódik a MissionServer.OnUpdate()-ből.
    // A timeslice az utolsó frame óta eltelt másodpercek.
    void OnUpdate(float timeslice)
    {
        if (!m_Initialized || !m_Config.Enabled) return;

        // Idő halmozás és feldolgozás csak a konfigurált intervallumban.
        // Ez megakadályozza a költséges logika futtatását minden egyes frame-ben.
        m_TimeSinceUpdate += timeslice;
        if (m_TimeSinceUpdate < m_Config.UpdateInterval) return;
        m_TimeSinceUpdate = 0;

        // --- Periodikus frissítési logika ide kerül ---
        // Példa: nyomon követett entitások iterálása, feltételek ellenőrzése, stb.
        if (m_Config.DebugLogging)
        {
            Print(MYMOD_TAG + " Periodic update tick");
        }
    }

    // A mission végekor hívódik (szerver leállítás vagy újraindítás).
    void Shutdown()
    {
        if (!m_Initialized) return;

        Print(MYMOD_TAG + " Manager shutting down");

        // Futásidejű állapot mentése, ha szükséges.
        // m_Config.Save();

        m_Initialized = false;
    }

    // -----------------------------------------------------------------------
    // RPC kezelők
    // -----------------------------------------------------------------------

    // Meghívásra kerül, amikor egy kliens UI adatokat kér.
    // sender: a kérést küldő játékos.
    // ctx: az adatfolyam (már az útvonal néven túl).
    void OnUIRequest(PlayerIdentity sender, ParamsReadContext ctx)
    {
        if (!sender) return;

        if (m_Config.DebugLogging)
        {
            Print(MYMOD_TAG + " UI data requested by: " + sender.GetName());
        }

        // Válasz adatok összeállítása és visszaküldése.
        // Valódi modban itt tényleges adatokat gyűjtenél.
        string responseData = "Items: " + m_Config.MaxItems.ToString();
        MyModRPCHelper.SendStringToClient(sender, MYMOD_RPC_UI_RESPONSE, responseData);
    }

    // Meghívásra kerül, amikor egy játékos csatlakozik. Üdvözlő üzenetet küld, ha be van állítva.
    void OnPlayerConnected(PlayerIdentity identity)
    {
        if (!m_Initialized || !m_Config.Enabled) return;
        if (!identity) return;

        // Üdvözlő üzenet küldése, ha be van állítva.
        if (m_Config.WelcomeMessage != "")
        {
            MyModRPCHelper.SendStringToClient(identity, MYMOD_RPC_WELCOME, m_Config.WelcomeMessage);

            if (m_Config.DebugLogging)
            {
                Print(MYMOD_TAG + " Sent welcome to: " + identity.GetName());
            }
        }
    }

    // -----------------------------------------------------------------------
    // Hozzáférők
    // -----------------------------------------------------------------------

    MyModConfig GetConfig()
    {
        return m_Config;
    }

    bool IsInitialized()
    {
        return m_Initialized;
    }
};
```

---

## Játékos eseménykezelő (4_World)

Helyezd el itt: `Scripts/4_World/MyMod/MyModPlayerHandler.c`.

Ez a `modded class` mintát használja a vanilla `PlayerBase` entitásba való behookolásra a csatlakozás/lecsatlakozás események észleléséhez.

```c
// ==========================================================================
// MyModPlayerHandler.c - Játékos életciklus hookok
// 4_World réteg: modolt PlayerBase a csatlakozás/lecsatlakozás elfogásához.
//
// MIÉRT modolt class:
//   A DayZ nem rendelkezik "játékos csatlakozott" esemény visszahívással. A szabványos
//   minta a MissionServer metódusainak felülírása (új csatlakozásokhoz)
//   vagy a PlayerBase-be hookolás (entitás-szintű eseményekhez, mint a halál).
//   Itt modolt PlayerBase-t használunk az entitás-szintű hookok bemutatásához.
//
// FONTOS:
//   Mindig hívd meg először a super.MetódusNév() metódust a felülírásokban.
//   Ennek elmulasztása megtöri a vanilla viselkedési láncot és más modokat,
//   amelyek szintén felülírják ugyanazt a metódust.
// ==========================================================================

modded class PlayerBase
{
    // Nyomon követi, hogy elküldtük-e az init eseményt ehhez a játékoshoz.
    // Ez megakadályozza a duplikált feldolgozást, ha az Init() többször hívódik.
    protected bool m_MyModPlayerReady;

    // -----------------------------------------------------------------------
    // A játékos entitás teljes létrehozása és replikálása után hívódik.
    // A szerveren itt "kész" a játékos RPC-k fogadására.
    // -----------------------------------------------------------------------
    override void Init()
    {
        super.Init();

        // Csak a szerveren fusson. A GetGame().IsServer() igaz a
        // dedikált szervereken és a listen szerver hosztján.
        if (!GetGame().IsServer()) return;

        // Dupla-init elleni védelem.
        if (m_MyModPlayerReady) return;
        m_MyModPlayerReady = true;

        // A játékos hálózati identitásának lekérése.
        // A szerveren a GetIdentity() a PlayerIdentity objektumot adja vissza,
        // amely tartalmazza a játékos nevét, Steam ID-jét (PlainId) és UID-jét.
        PlayerIdentity identity = GetIdentity();
        if (!identity) return;

        // A manager értesítése, hogy egy játékos csatlakozott.
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.OnPlayerConnected(identity);
        }
    }
};
```

---

## Mission hook: szerver (5_Mission)

Helyezd el itt: `Scripts/5_Mission/MyMod/MyModMissionServer.c`.

Ez a `MissionServer`-be hookol a mod szerver oldali inicializálásához és leállításához.

```c
// ==========================================================================
// MyModMissionServer.c - Szerver oldali mission hookok
// 5_Mission réteg: utolsóként töltődik be, hivatkozhat az összes alsóbb rétegre.
//
// MIÉRT modolt MissionServer:
//   A MissionServer a szerver oldali logika belépési pontja. Az OnInit()
//   egyszer fut, amikor a mission indul (szerver indítás). Az OnMissionFinish()
//   fut, amikor a szerver leáll vagy újraindul. Ezek a megfelelő
//   helyek a modod rendszereinek beállításához és lebontásához.
//
// ÉLETCIKLUS SORREND:
//   1. A motor betölti az összes szkript réteget (3_Game -> 4_World -> 5_Mission)
//   2. A motor létrehozza a MissionServer példányt
//   3. OnInit() hívódik -> inicializáld a rendszereidet itt
//   4. OnMissionStart() hívódik -> a világ kész, a játékosok csatlakozhatnak
//   5. OnUpdate() minden frame-ben hívódik
//   6. OnMissionFinish() hívódik -> a szerver leáll
// ==========================================================================

modded class MissionServer
{
    // -----------------------------------------------------------------------
    // Inicializálás
    // -----------------------------------------------------------------------
    override void OnInit()
    {
        // MINDIG hívd meg először a super-t. A láncban lévő más modok erre számítanak.
        super.OnInit();

        // A manager szingleton inicializálása. Ez betölti a configot lemezről,
        // regisztrálja az RPC kezelőket, és felkészíti a modot a működésre.
        MyModManager.GetInstance().Init();

        Print(MYMOD_TAG + " Server mission initialized");
    }

    // -----------------------------------------------------------------------
    // Frame-enkénti frissítés
    // -----------------------------------------------------------------------
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        // Delegálás a managernek. A manager kezeli a saját sebesség
        // korlátozását (UpdateInterval a configból), tehát ez olcsó.
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.OnUpdate(timeslice);
        }
    }

    // -----------------------------------------------------------------------
    // Játékos csatlakozás - szerver RPC diszpécser
    // A motor hívja, amikor egy kliens RPC-t küld a szervernek.
    // -----------------------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        // Csak a mi RPC ID-nkat kezeljük. Minden más RPC áthalad.
        if (rpc_type != MYMOD_RPC_ID) return;

        // Az útvonal név olvasása (a küldő által írt első sztring).
        string routeName;
        if (!ctx.Read(routeName)) return;

        // A megfelelő kezelőhöz irányítás az útvonal név alapján.
        MyModManager mgr = MyModManager.GetInstance();
        if (!mgr) return;

        if (routeName == MYMOD_RPC_UI_REQUEST)
        {
            mgr.OnUIRequest(sender, ctx);
        }
        // Adj hozzá több útvonalat, ahogy a modod növekszik:
        // else if (routeName == MYMOD_RPC_SOME_OTHER)
        // {
        //     mgr.OnSomeOther(sender, ctx);
        // }
    }

    // -----------------------------------------------------------------------
    // Leállítás
    // -----------------------------------------------------------------------
    override void OnMissionFinish()
    {
        // A manager leállítása a super hívás előtt.
        // Ez biztosítja, hogy a takarításunk a motor mission
        // infrastruktúra lebontása előtt fut.
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.Shutdown();
        }

        // A szingleton megsemmisítése a memória felszabadításához és az elavult állapot
        // megakadályozásához, ha a mission újraindul (pl. szerver újraindítás folyamat kilépés nélkül).
        MyModManager.Cleanup();

        Print(MYMOD_TAG + " Server mission finished");

        super.OnMissionFinish();
    }
};
```

---

## Mission hook: kliens (5_Mission)

Helyezd el itt: `Scripts/5_Mission/MyMod/MyModMissionClient.c`.

Ez a `MissionGameplay`-be hookol kliens oldali inicializáláshoz, input kezeléshez és RPC fogadáshoz.

```c
// ==========================================================================
// MyModMissionClient.c - Kliens oldali mission hookok
// 5_Mission réteg.
//
// MIÉRT MissionGameplay:
//   A kliensen a MissionGameplay az aktív mission osztály a
//   játékmenet során. Az OnUpdate() minden frame-ben fogad (input lekérdezéshez)
//   és az OnRPC() a bejövő szerver üzenetekhez.
//
// MEGJEGYZÉS A LISTEN SZERVEREKRŐL:
//   Listen szerveren (hoszt + játék) MIND a MissionServer, mind a
//   MissionGameplay aktív. A kliens kódod a szerver kód mellett fut.
//   Használj GetGame().IsClient() vagy GetGame().IsServer() védelmeket,
//   ha oldal-specifikus logikára van szükséged.
// ==========================================================================

modded class MissionGameplay
{
    // Hivatkozás az UI panelre. null, ha zárva van.
    protected ref MyModUI m_MyModPanel;

    // Inicializálási állapot nyomon követése.
    protected bool m_MyModInitialized;

    // -----------------------------------------------------------------------
    // Inicializálás
    // -----------------------------------------------------------------------
    override void OnInit()
    {
        super.OnInit();

        m_MyModInitialized = true;

        Print(MYMOD_TAG + " Client mission initialized");
    }

    // -----------------------------------------------------------------------
    // Frame-enkénti frissítés: input lekérdezés és UI kezelés
    // -----------------------------------------------------------------------
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (!m_MyModInitialized) return;

        // Az Inputs.xml-ben definiált billentyűkötés lekérdezése.
        // A GetUApi() a UserActions API-t adja vissza.
        // A GetInputByName() kikeresi az akciót az Inputs.xml-ben lévő név alapján.
        // A LocalPress() true-t ad vissza azon a frame-en, amikor a billentyű lenyomásra kerül.
        UAInput panelInput = GetUApi().GetInputByName("UAMyModPanel");
        if (panelInput && panelInput.LocalPress())
        {
            TogglePanel();
        }
    }

    // -----------------------------------------------------------------------
    // RPC fogadó: a szerver üzeneteinek kezelése
    // -----------------------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        // Csak a mi RPC ID-nkat kezeljük.
        if (rpc_type != MYMOD_RPC_ID) return;

        // Az útvonal név olvasása.
        string routeName;
        if (!ctx.Read(routeName)) return;

        // Útvonal alapú irányítás.
        if (routeName == MYMOD_RPC_WELCOME)
        {
            string welcomeMsg;
            if (ctx.Read(welcomeMsg))
            {
                // Az üdvözlő üzenet megjelenítése a játékosnak.
                // A GetGame().GetMission().OnEvent() értesítéseket jeleníthet meg,
                // vagy egyéni UI-t használhatsz. Az egyszerűség kedvéért chat-et használunk.
                GetGame().Chat(welcomeMsg, "");
                Print(MYMOD_TAG + " Welcome message: " + welcomeMsg);
            }
        }
        else if (routeName == MYMOD_RPC_UI_RESPONSE)
        {
            string responseData;
            if (ctx.Read(responseData))
            {
                // Az UI panel frissítése a kapott adatokkal.
                if (m_MyModPanel)
                {
                    m_MyModPanel.SetData(responseData);
                }
            }
        }
    }

    // -----------------------------------------------------------------------
    // UI panel váltás
    // -----------------------------------------------------------------------
    protected void TogglePanel()
    {
        if (m_MyModPanel && m_MyModPanel.IsOpen())
        {
            m_MyModPanel.Close();
            m_MyModPanel = null;
        }
        else
        {
            // Csak akkor nyisd meg, ha a játékos él és nincs más menü megnyitva.
            PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
            if (!player || !player.IsAlive()) return;

            UIManager uiMgr = GetGame().GetUIManager();
            if (uiMgr && uiMgr.GetMenu()) return;

            m_MyModPanel = new MyModUI();
            m_MyModPanel.Open();

            // Friss adatok kérése a szervertől.
            MyModRPCHelper.SendRequestToServer(MYMOD_RPC_UI_REQUEST);
        }
    }

    // -----------------------------------------------------------------------
    // Leállítás
    // -----------------------------------------------------------------------
    override void OnMissionFinish()
    {
        // Az UI panel bezárása és megsemmisítése, ha nyitva van.
        if (m_MyModPanel)
        {
            m_MyModPanel.Close();
            m_MyModPanel = null;
        }

        m_MyModInitialized = false;

        Print(MYMOD_TAG + " Client mission finished");

        super.OnMissionFinish();
    }
};
```

---

## UI panel szkript (5_Mission)

Helyezd el itt: `Scripts/5_Mission/MyMod/MyModUI.c`.

Ez a szkript vezérli a `.layout` fájlban definiált UI panelt. Megkeresi a widget hivatkozásokat, feltölti adatokkal, és kezeli a nyitást/zárást.

```c
// ==========================================================================
// MyModUI.c - UI panel vezérlő
// 5_Mission réteg: hivatkozhat az összes alsóbb rétegre.
//
// HOGYAN MŰKÖDIK A DAYZ UI:
//   1. Egy .layout fájl definiálja a widget hierarchiát (mint a HTML).
//   2. Egy szkript osztály betölti a layoutot, megkeresi a widgeteket név szerint, és
//      manipulálja őket (szöveg beállítás, megjelenítés/elrejtés, kattintásokra reagálás).
//   3. A szkript megjeleníti/elrejti a gyökér widgetet és kezeli az input fókuszt.
//
// WIDGET ÉLETCIKLUS:
//   A GetGame().GetWorkspace().CreateWidgets() betölti a layout fájlt és
//   visszaadja a gyökér widgetet. Ezután FindAnyWidget() segítségével kapsz
//   hivatkozásokat a nevesített gyermek widgetekre. Ha kész, hívd a widget.Unlink()
//   metódust a teljes widget fa megsemmisítéséhez.
// ==========================================================================

class MyModUI
{
    // A panel gyökér widgetje (a .layout-ból betöltve).
    protected ref Widget m_Root;

    // Nevesített gyermek widgetek.
    protected TextWidget m_TitleText;
    protected TextWidget m_DataText;
    protected TextWidget m_VersionText;
    protected ButtonWidget m_CloseButton;

    // Állapot nyomon követés.
    protected bool m_IsOpen;

    // -----------------------------------------------------------------------
    // Konstruktor: a layout betöltése és widget hivatkozások keresése
    // -----------------------------------------------------------------------
    void MyModUI()
    {
        // A CreateWidgets betölti a .layout fájlt és példányosítja az összes widgetet.
        // Az útvonal a mod gyökeréhez relatív (ugyanaz, mint a config.cpp útvonalak).
        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyProfessionalMod/Scripts/GUI/layouts/MyModPanel.layout"
        );

        // Kezdetben rejtett, amíg az Open() meghívásra nem kerül.
        if (m_Root)
        {
            m_Root.Show(false);

            // Nevesített widgetek keresése. Ezeknek a neveknek PONTOSAN egyezniük kell
            // a .layout fájlban lévő widget nevekkel (kis- és nagybetű érzékeny).
            m_TitleText   = TextWidget.Cast(m_Root.FindAnyWidget("TitleText"));
            m_DataText    = TextWidget.Cast(m_Root.FindAnyWidget("DataText"));
            m_VersionText = TextWidget.Cast(m_Root.FindAnyWidget("VersionText"));
            m_CloseButton = ButtonWidget.Cast(m_Root.FindAnyWidget("CloseButton"));

            // Statikus tartalom beállítása.
            if (m_TitleText)
                m_TitleText.SetText("My Professional Mod");

            if (m_VersionText)
                m_VersionText.SetText("v" + MYMOD_VERSION);
        }
    }

    // -----------------------------------------------------------------------
    // Open: a panel megjelenítése és input elfogása
    // -----------------------------------------------------------------------
    void Open()
    {
        if (!m_Root) return;

        m_Root.Show(true);
        m_IsOpen = true;

        // Játékos vezérlők zárolása, hogy a WASD ne mozgassa a karaktert
        // amíg a panel nyitva van. Ez kurzort jelenít meg.
        GetGame().GetMission().PlayerControlDisable(INPUT_EXCLUDE_ALL);
        GetGame().GetUIManager().ShowUICursor(true);

        Print(MYMOD_TAG + " UI panel opened");
    }

    // -----------------------------------------------------------------------
    // Close: a panel elrejtése és input felszabadítása
    // -----------------------------------------------------------------------
    void Close()
    {
        if (!m_Root) return;

        m_Root.Show(false);
        m_IsOpen = false;

        // Játékos vezérlők újraengedélyezése.
        GetGame().GetMission().PlayerControlEnable(true);
        GetGame().GetUIManager().ShowUICursor(false);

        Print(MYMOD_TAG + " UI panel closed");
    }

    // -----------------------------------------------------------------------
    // Adat frissítés: meghívásra kerül, amikor a szerver UI adatot küld
    // -----------------------------------------------------------------------
    void SetData(string data)
    {
        if (m_DataText)
        {
            m_DataText.SetText(data);
        }
    }

    // -----------------------------------------------------------------------
    // Állapot lekérdezés
    // -----------------------------------------------------------------------
    bool IsOpen()
    {
        return m_IsOpen;
    }

    // -----------------------------------------------------------------------
    // Destruktor: a widget fa takarítása
    // -----------------------------------------------------------------------
    void ~MyModUI()
    {
        // Az Unlink megsemmisíti a gyökér widgetet és annak összes gyermekét.
        // Ez felszabadítja a widget fa által használt memóriát.
        if (m_Root)
        {
            m_Root.Unlink();
        }
    }
};
```

---

## Layout fájl

Helyezd el itt: `Scripts/GUI/layouts/MyModPanel.layout`.

Ez definiálja az UI panel vizuális struktúráját. A DayZ layoutok egyéni szövegformátumot használnak (nem XML).

```
// ==========================================================================
// MyModPanel.layout - UI panel struktúra
//
// MÉRETEZÉSI SZABÁLYOK:
//   hexactsize 1 + vexactsize 1 = a méret pixelben van (pl. size 400 300)
//   hexactsize 0 + vexactsize 0 = a méret arányos (0.0-tól 1.0-ig)
//   halign/valign a horgonypont vezérlése:
//     left_ref/top_ref     = a szülő bal/felső széléhez horgonyozva
//     center_ref           = a szülőben középre igazítva
//     right_ref/bottom_ref = a szülő jobb/alsó széléhez horgonyozva
//
// FONTOS:
//   - Soha ne használj negatív méreteket. Használj igazítást és pozíciót helyette.
//   - A widget neveknek pontosan egyezniük kell a FindAnyWidget() hívásokkal a szkriptben.
//   - 'ignorepointer 1' azt jelenti, hogy a widget nem kap egérkattintásokat.
//   - 'scriptclass' egy widgetet köt egy szkript osztályhoz eseménykezelésre.
// ==========================================================================

// Gyökér panel: a képernyő közepén, 400x300 pixel, félig átlátszó háttér.
PanelWidgetClass MyModPanelRoot {
 position 0 0
 size 400 300
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 1
 vexactsize 1
 color 0.1 0.1 0.12 0.92
 priority 100
 {
  // Címsor: teljes szélesség, 36px magasság, felül.
  PanelWidgetClass TitleBar {
   position 0 0
   size 1 36
   hexactpos 1
   vexactpos 1
   hexactsize 0
   vexactsize 1
   color 0.15 0.15 0.18 1
   {
    // Cím szöveg: balra igazított, margóval.
    TextWidgetClass TitleText {
     position 12 0
     size 300 36
     hexactpos 1
     vexactpos 1
     hexactsize 1
     vexactsize 1
     valign center_ref
     ignorepointer 1
     text "My Mod"
     font "gui/fonts/metron2"
     "exact size" 16
     color 1 1 1 0.9
    }
    // Verzió szöveg: a címsor jobb oldalán.
    TextWidgetClass VersionText {
     position 0 0
     size 80 36
     halign right_ref
     hexactpos 1
     vexactpos 1
     hexactsize 1
     vexactsize 1
     valign center_ref
     ignorepointer 1
     text "v1.0.0"
     font "gui/fonts/metron2"
     "exact size" 12
     color 0.6 0.6 0.6 0.8
    }
   }
  }
  // Tartalom terület: a címsor alatt, kitölti a maradék helyet.
  PanelWidgetClass ContentArea {
   position 0 40
   size 380 200
   halign center_ref
   hexactpos 1
   vexactpos 1
   hexactsize 1
   vexactsize 1
   color 0 0 0 0
   {
    // Adat szöveg: ahol a szerver adatok megjelennek.
    TextWidgetClass DataText {
     position 12 12
     size 356 160
     hexactpos 1
     vexactpos 1
     hexactsize 1
     vexactsize 1
     ignorepointer 1
     text "Waiting for data..."
     font "gui/fonts/metron2"
     "exact size" 14
     color 0.85 0.85 0.85 1
    }
   }
  }
  // Bezárás gomb: jobb alsó sarokban.
  ButtonWidgetClass CloseButton {
   position 0 0
   size 100 32
   halign right_ref
   valign bottom_ref
   hexactpos 1
   vexactpos 1
   hexactsize 1
   vexactsize 1
   text "Close"
   font "gui/fonts/metron2"
   "exact size" 14
  }
 }
}
```

---

## stringtable.csv

Helyezd el itt: `Scripts/stringtable.csv`.

Ez biztosítja a lokalizációt az összes játékos-oldali szöveghez. A motor a játékos játéknyelvéhez illeszkedő oszlopot olvassa. Az `original` oszlop a tartalék.

A DayZ 13 nyelvi oszlopot támogat. Minden sornak mind a 13 oszlopot tartalmaznia kell (használd az angol szöveget helyőrzőként a nem fordított nyelvekhez).

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_INPUT_GROUP","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod",
"STR_MYMOD_INPUT_PANEL","Open Panel","Open Panel","Otevrit Panel","Panel offnen","Otkryt Panel","Otworz Panel","Panel megnyitása","Apri Pannello","Abrir Panel","Ouvrir Panneau","Open Panel","Open Panel","Abrir Painel","Open Panel",
"STR_MYMOD_TITLE","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod",
"STR_MYMOD_CLOSE","Close","Close","Zavrit","Schliessen","Zakryt","Zamknij","Bezárás","Chiudi","Cerrar","Fermer","Close","Close","Fechar","Close",
"STR_MYMOD_WELCOME","Welcome!","Welcome!","Vitejte!","Willkommen!","Dobro pozhalovat!","Witaj!","Üdvözöljük!","Benvenuto!","Bienvenido!","Bienvenue!","Welcome!","Welcome!","Bem-vindo!","Welcome!",
```

**Fontos:** Minden sor végén egy záró vesszővel kell végződnie az utolsó nyelvi oszlop után. Ez a DayZ CSV feldolgozójának követelménye.

---

## Inputs.xml

Helyezd el itt: `Scripts/Inputs.xml`.

Ez definiálja az egyéni billentyűkötéseket, amelyek megjelennek a játék Opciók > Vezérlők menüjében. A `config.cpp` CfgMods `inputs` mezőjének erre a fájlra kell mutatnia.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<!--
    Inputs.xml - Egyéni billentyűkötés definíciók

    STRUKTÚRA:
    - <actions>:  deklarálja az input akció neveket és megjelenítési sztringjeiket
    - <sorting>:  csoportosítja az akciókat egy kategória alá a Vezérlők menüben
    - <preset>:   beállítja az alapértelmezett billentyűkötést

    ELNEVEZÉSI KONVENCIÓ:
    - Az akció nevek "UA"-val (User Action) kezdődnek, amelyet a mod előtagod követ.
    - A "loc" attribútum egy stringtable.csv sztring kulcsra hivatkozik.

    BILLENTYŰ NEVEK:
    - Billentyűzet: kA-tól kZ-ig, k0-k9, kInsert, kHome, kEnd, kDelete,
      kNumpad0-kNumpad9, kF1-kF12, kLControl, kRControl, kLShift, kRShift,
      kLAlt, kRAlt, kSpace, kReturn, kBack, kTab, kEscape
    - Egér: mouse1 (bal), mouse2 (jobb), mouse3 (középső)
    - Kombinált billentyűk: használj <combo> elemet több <btn> gyermekkel
-->
<modded_inputs>
    <inputs>
        <!-- Az input akció deklarálása. -->
        <actions>
            <input name="UAMyModPanel" loc="STR_MYMOD_INPUT_PANEL" />
        </actions>

        <!-- Csoportosítás egy kategória alá az Opciók > Vezérlők menüben. -->
        <!-- A "name" egy belső ID; a "loc" a megjelenítési név a stringtable-ből. -->
        <sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
            <input name="UAMyModPanel"/>
        </sorting>
    </inputs>

    <!-- Alapértelmezett billentyű beállítás. A játékosok átállíthatják az Opciók > Vezérlők menüben. -->
    <preset>
        <!-- Alapértelmezetten a Home billentyűhöz kötve. -->
        <input name="UAMyModPanel">
            <btn name="kHome"/>
        </input>

        <!--
        KOMBINÁLT BILLENTYŰ PÉLDA (vedd ki a megjegyzésből a használathoz):
        Ez Ctrl+H-ra kötné egyetlen billentyű helyett.
        <input name="UAMyModPanel">
            <combo>
                <btn name="kLControl"/>
                <btn name="kH"/>
            </combo>
        </input>
        -->
    </preset>
</modded_inputs>
```

---

## Build szkript

Helyezd el a `build.bat` fájlt a mod gyökerében.

Ez a batch fájl automatizálja a PBO csomagolást a DayZ Tools Addon Builder segítségével.

```batch
@echo off
REM ==========================================================================
REM build.bat - Automatizált PBO csomagolás a MyProfessionalMod-hoz
REM
REM MIT CSINÁL:
REM   1. Becsomagolja a Scripts/ mappát egy PBO fájlba
REM   2. A PBO-t a terjeszthető @mod mappába helyezi
REM   3. A mod.cpp-t a terjeszthető mappába másolja
REM
REM ELŐFELTÉTELEK:
REM   - DayZ Tools telepítve Steamen keresztül
REM   - Mod forrás a P:\MyProfessionalMod\ helyen
REM
REM HASZNÁLAT:
REM   Kattints duplán erre a fájlra vagy futtasd parancssorból: build.bat
REM ==========================================================================

REM --- Konfiguráció: frissítsd ezeket az útvonalakat a beállításodnak megfelelően ---

REM A DayZ Tools útvonala (ellenőrizd a Steam könyvtárad útvonalát).
set DAYZ_TOOLS=C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools

REM Forrás mappa: a Scripts könyvtár, ami a PBO-ba kerül csomagolásra.
set SOURCE=P:\MyProfessionalMod\Scripts

REM Kimeneti mappa: ahova a becsomagolt PBO kerül.
set OUTPUT=P:\@MyProfessionalMod\addons

REM Prefix: a virtuális útvonal a PBO-n belül. Egyeznie kell a config.cpp
REM útvonalaival (pl. "MyProfessionalMod/Scripts/3_Game" fel kell hogy oldódjon).
set PREFIX=MyProfessionalMod\Scripts

REM --- Build lépések ---

echo ============================================
echo  Building MyProfessionalMod
echo ============================================

REM Kimeneti könyvtár létrehozása, ha nem létezik.
if not exist "%OUTPUT%" mkdir "%OUTPUT%"

REM Az Addon Builder futtatása.
REM   -clear  = régi PBO eltávolítása csomagolás előtt
REM   -prefix = a PBO prefix beállítása (szükséges a szkript útvonalak feloldásához)
echo Packing PBO...
"%DAYZ_TOOLS%\Bin\AddonBuilder\AddonBuilder.exe" "%SOURCE%" "%OUTPUT%" -prefix=%PREFIX% -clear

REM Ellenőrzés, hogy az Addon Builder sikerült-e.
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: PBO packing failed! Check the output above for details.
    echo Common causes:
    echo   - DayZ Tools path is wrong
    echo   - Source folder does not exist
    echo   - A .c file has a syntax error that prevents packing
    pause
    exit /b 1
)

REM A mod.cpp másolása a terjeszthető mappába.
echo Copying mod.cpp...
copy /Y "P:\MyProfessionalMod\mod.cpp" "P:\@MyProfessionalMod\mod.cpp" >nul

echo.
echo ============================================
echo  Build complete!
echo  Output: P:\@MyProfessionalMod\
echo ============================================
echo.
echo To test with file patching (no PBO needed):
echo   DayZDiag_x64.exe -mod=P:\MyProfessionalMod -filePatching
echo.
echo To test with the built PBO:
echo   DayZDiag_x64.exe -mod=P:\@MyProfessionalMod
echo.
pause
```

---

## Testreszabási útmutató

Amikor ezt a sablont használod a saját mododhoz, minden előfordulási helyen át kell nevezned a helyőrző neveket. Íme a teljes ellenőrzőlista.

### 1. lépés: Válaszd ki a neveidet

Döntsd el ezeket az azonosítókat a szerkesztések megkezdése előtt:

| Azonosító | Példa | Szabályok |
|------------|---------|-------|
| **Mod mappa név** | `MyBountySystem` | Szóközök nélkül, PascalCase vagy aláhúzás |
| **Megjelenítési név** | `"My Bounty System"` | Emberbarát, a mod.cpp és config.cpp számára |
| **CfgPatches osztály** | `MyBountySystem_Scripts` | Globálisan egyedinek kell lennie az összes mod között |
| **CfgMods osztály** | `MyBountySystem` | Belső motor azonosító |
| **Szkript előtag** | `MyBounty` | Rövid előtag osztályokhoz: `MyBountyManager`, `MyBountyConfig` |
| **Címke konstans** | `MYBOUNTY_TAG` | Napló üzenetekhez: `"[MyBounty]"` |
| **Előfeldolgozó definíció** | `MYBOUNTYSYSTEM` | Az `#ifdef` kereszt-mod érzékeléshez |
| **RPC ID** | `58432` | Egyedi 5 jegyű szám, amit más modok nem használnak |
| **Input akció név** | `UAMyBountyPanel` | `UA`-val kezdődik, egyedi |

### 2. lépés: Fájlok és mappák átnevezése

Nevezd át minden fájlt és mappát, ami "MyMod" vagy "MyProfessionalMod" nevet tartalmaz:

```
MyProfessionalMod/           -> MyBountySystem/
  Scripts/3_Game/MyMod/      -> Scripts/3_Game/MyBounty/
    MyModConstants.c          -> MyBountyConstants.c
    MyModConfig.c             -> MyBountyConfig.c
    MyModRPC.c                -> MyBountyRPC.c
  Scripts/4_World/MyMod/     -> Scripts/4_World/MyBounty/
    MyModManager.c            -> MyBountyManager.c
    MyModPlayerHandler.c      -> MyBountyPlayerHandler.c
  Scripts/5_Mission/MyMod/   -> Scripts/5_Mission/MyBounty/
    MyModMissionServer.c      -> MyBountyMissionServer.c
    MyModMissionClient.c      -> MyBountyMissionClient.c
    MyModUI.c                 -> MyBountyUI.c
  Scripts/GUI/layouts/
    MyModPanel.layout          -> MyBountyPanel.layout
```

### 3. lépés: Keresés-és-csere minden fájlban

Végezd el ezeket a cseréket **sorrendben** (a leghosszabb sztringek először a részleges egyezések elkerülése érdekében):

| Keresés | Csere | Érintett fájlok |
|------|---------|----------------|
| `MyProfessionalMod` | `MyBountySystem` | config.cpp, mod.cpp, build.bat, UI szkript |
| `MyModManager` | `MyBountyManager` | Manager, mission hookok, játékos kezelő |
| `MyModConfig` | `MyBountyConfig` | Config osztály, manager |
| `MyModConstants` | `MyBountyConstants` | (csak fájlnév) |
| `MyModRPCHelper` | `MyBountyRPCHelper` | RPC segéd, mission hookok |
| `MyModUI` | `MyBountyUI` | UI szkript, kliens mission hook |
| `MyModPanel` | `MyBountyPanel` | Layout fájl, UI szkript |
| `MyMod_Scripts` | `MyBountySystem_Scripts` | config.cpp CfgPatches |
| `MYMOD_RPC_ID` | `MYBOUNTY_RPC_ID` | Konstansok, RPC, mission hookok |
| `MYMOD_RPC_` | `MYBOUNTY_RPC_` | Összes RPC útvonal konstans |
| `MYMOD_TAG` | `MYBOUNTY_TAG` | Konstansok, összes fájl, ami a napló címkét használja |
| `MYMOD_CONFIG` | `MYBOUNTY_CONFIG` | Konstansok, config osztály |
| `MYMOD_VERSION` | `MYBOUNTY_VERSION` | Konstansok, UI szkript |
| `MYMOD` | `MYBOUNTYSYSTEM` | config.cpp defines[] |
| `MyMod` | `MyBounty` | config.cpp CfgMods osztály, RPC útvonal sztringek |
| `My Mod` | `My Bounty System` | Sztringek a layoutokban, stringtable |
| `mymod` | `mybounty` | Inputs.xml sorting név |
| `STR_MYMOD_` | `STR_MYBOUNTY_` | stringtable.csv, Inputs.xml |
| `UAMyMod` | `UAMyBounty` | Inputs.xml, kliens mission hook |
| `m_MyMod` | `m_MyBounty` | Kliens mission hook tagváltozók |
| `74291` | `58432` | RPC ID (a választott egyedi szám) |

### 4. lépés: Ellenőrzés

Az átnevezés után végezz projekt-szintű keresést a "MyMod" és "MyProfessionalMod" kifejezésekre, hogy elkapd, amit esetleg kihagytál. Ezután fordítsd le és teszteld:

```batch
DayZDiag_x64.exe -mod=P:\MyBountySystem -filePatching
```

Ellenőrizd a szkript naplót a címkéd után (pl. `[MyBounty]`), hogy megerősítsd, minden betöltődött.

---

## Funkció bővítési útmutató

Amint a modod fut, íme hogyan adj hozzá gyakori funkciókat.

### Új RPC végpont hozzáadása

**1. Definiáld az útvonal konstanst** a `MyModRPC.c`-ben (3_Game):

```c
const string MYMOD_RPC_BOUNTY_SET = "MyMod:BountySet";
```

**2. Add hozzá a szerver kezelőt** a `MyModManager.c`-ben (4_World):

```c
void OnBountySet(PlayerIdentity sender, ParamsReadContext ctx)
{
    // A kliens által írt paraméterek olvasása.
    string targetName;
    int bountyAmount;
    if (!ctx.Read(targetName)) return;
    if (!ctx.Read(bountyAmount)) return;

    Print(MYMOD_TAG + " Bounty set on " + targetName + ": " + bountyAmount.ToString());
    // ... a logikád ide ...
}
```

**3. Add hozzá a diszpécser esetet** a `MyModMissionServer.c`-ben (5_Mission), az `OnRPC()` belsejében:

```c
else if (routeName == MYMOD_RPC_BOUNTY_SET)
{
    mgr.OnBountySet(sender, ctx);
}
```

**4. Küldd a kliensről** (bárhol, ahol a művelet aktiválódik):

```c
ScriptRPC rpc = new ScriptRPC();
rpc.Write(MYMOD_RPC_BOUNTY_SET);
rpc.Write("PlayerName");
rpc.Write(5000);
rpc.Send(null, MYMOD_RPC_ID, true, null);
```

### Új config mező hozzáadása

**1. Add hozzá a mezőt** a `MyModConfig.c`-ben alapértékkel:

```c
// Minimális fejpénz összeg, amit a játékosok beállíthatnak.
int MinBountyAmount = 100;
```

Ennyi az egész. A JSON szerializáló automatikusan felveszi a nyilvános mezőket. A lemezen lévő meglévő config fájlok az új mező alapértékét fogják használni, amíg az admin nem szerkeszti és menti.

**2. Hivatkozd** a managerből:

```c
if (bountyAmount < m_Config.MinBountyAmount)
{
    // Elutasítás: túl alacsony.
    return;
}
```

### Új UI panel hozzáadása

**1. Hozd létre a layoutot** itt: `Scripts/GUI/layouts/MyModBountyList.layout`:

```
PanelWidgetClass BountyListRoot {
 position 0 0
 size 500 400
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 1
 vexactsize 1
 color 0.1 0.1 0.12 0.92
 {
  TextWidgetClass BountyListTitle {
   position 12 8
   size 476 30
   hexactpos 1
   vexactpos 1
   hexactsize 1
   vexactsize 1
   text "Active Bounties"
   font "gui/fonts/metron2"
   "exact size" 18
   color 1 1 1 0.9
  }
 }
}
```

**2. Hozd létre a szkriptet** itt: `Scripts/5_Mission/MyMod/MyModBountyListUI.c`:

```c
class MyModBountyListUI
{
    protected ref Widget m_Root;
    protected bool m_IsOpen;

    void MyModBountyListUI()
    {
        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyProfessionalMod/Scripts/GUI/layouts/MyModBountyList.layout"
        );
        if (m_Root)
            m_Root.Show(false);
    }

    void Open()  { if (m_Root) { m_Root.Show(true); m_IsOpen = true; } }
    void Close() { if (m_Root) { m_Root.Show(false); m_IsOpen = false; } }
    bool IsOpen() { return m_IsOpen; }

    void ~MyModBountyListUI()
    {
        if (m_Root) m_Root.Unlink();
    }
};
```

### Új billentyűkötés hozzáadása

**1. Add hozzá az akciót** az `Inputs.xml`-ben:

```xml
<actions>
    <input name="UAMyModPanel" loc="STR_MYMOD_INPUT_PANEL" />
    <input name="UAMyModBountyList" loc="STR_MYMOD_INPUT_BOUNTYLIST" />
</actions>

<sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
    <input name="UAMyModPanel"/>
    <input name="UAMyModBountyList"/>
</sorting>
```

**2. Add hozzá az alapértelmezett kötést** a `<preset>` szekcióba:

```xml
<input name="UAMyModBountyList">
    <btn name="kEnd"/>
</input>
```

**3. Add hozzá a lokalizációt** a `stringtable.csv`-ben:

```csv
"STR_MYMOD_INPUT_BOUNTYLIST","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List",
```

**4. Kérdezd le az inputot** a `MyModMissionClient.c`-ben:

```c
UAInput bountyInput = GetUApi().GetInputByName("UAMyModBountyList");
if (bountyInput && bountyInput.LocalPress())
{
    ToggleBountyList();
}
```

### Új stringtable bejegyzés hozzáadása

**1. Add hozzá a sort** a `stringtable.csv`-ben. Minden sornak mind a 13 nyelvi oszlopra szüksége van, plusz egy záró vessző:

```csv
"STR_MYMOD_BOUNTY_PLACED","Bounty placed!","Bounty placed!","Odměna vypsána!","Kopfgeld gesetzt!","Награда назначена!","Nagroda wyznaczona!","Fejpénz kiírva!","Taglia piazzata!","Recompensa puesta!","Prime placée!","Bounty placed!","Bounty placed!","Recompensa colocada!","Bounty placed!",
```

**2. Használd** a szkript kódban:

```c
// A Widget.SetText() NEM oldja fel automatikusan a stringtable kulcsokat.
// A Widget.SetText() metódust a feloldott sztringgel kell használnod:
string localizedText = Widget.TranslateString("#STR_MYMOD_BOUNTY_PLACED");
myTextWidget.SetText(localizedText);
```

Vagy egy `.layout` fájlban a motor automatikusan feloldja a `#STR_` kulcsokat:

```
text "#STR_MYMOD_BOUNTY_PLACED"
```

---

## Következő lépések

Ezzel a professzionális sablonnal futva a következőket teheted:

1. **Tanulmányozz éles modokat** -- Olvasd el a [DayZ Expansion](https://github.com/salutesh/DayZ-Expansion-Scripts) és a `StarDZ_Core` forrást valós mintákért nagy léptékben.
2. **Adj hozzá egyéni tárgyakat** -- Kövesd a [8.2. fejezetet: Egyéni tárgy létrehozása](02-custom-item.md) és integráld a managereddel.
3. **Építs admin panelt** -- Kövesd a [8.3. fejezetet: Admin panel építése](03-admin-panel.md) a config rendszered használatával.
4. **Adj hozzá HUD overlay-t** -- Kövesd a [8.8. fejezetet: HUD overlay építése](08-hud-overlay.md) a mindig látható UI elemekhez.
5. **Publikálj a Workshop-ra** -- Kövesd a [8.7. fejezetet: Publikálás a Workshop-ra](07-publishing-workshop.md), amikor a modod kész.
6. **Tanulj hibakeresést** -- Olvasd el a [8.6. fejezetet: Hibakeresés és tesztelés](06-debugging-testing.md) a napló elemzéshez és hibaelhárításhoz.

---

**Előző:** [8.8. fejezet: HUD overlay építése](08-hud-overlay.md) | [Főoldal](../README.md)
