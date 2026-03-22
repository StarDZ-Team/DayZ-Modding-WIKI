# 7.2. fejezet: Modul / Plugin rendszerek

[Kezdőlap](../README.md) | [<< Előző: Singleton minta](01-singletons.md) | **Modul / Plugin rendszerek** | [Következő: RPC minták >>](03-rpc-patterns.md)

---

## Bevezetés

Minden komoly DayZ mod keretrendszer modul- vagy pluginrendszert használ a kód önálló egységekbe szervezéséhez, meghatározott életciklus-hookokkal. Ahelyett, hogy az inicializációs logikát modolt mission osztályok között szórnánk szét, a modulok egy központi menedzsernél regisztrálják magukat, amely életciklus-eseményeket diszpécsel --- `OnInit`, `OnMissionStart`, `OnUpdate`, `OnMissionFinish` --- minden modulnak kiszámítható sorrendben.

Ez a fejezet négy valós megközelítést vizsgál: a Community Framework `CF_ModuleCore`-ját, a VPP `PluginBase` / `ConfigurablePlugin`-ját, a Dabs Framework attribútum-alapú regisztrációját és egy egyéni statikus modul menedzsert. Mindegyik különbözőképpen oldja meg ugyanazt a problémát; mind a négy megértése segít kiválasztani a megfelelő mintát a saját mododhoz vagy problémamentesen integrálni egy meglévő keretrendszerrel.

---

## Tartalomjegyzék

- [Miért modulok?](#miért-modulok)
- [CF_ModuleCore (COT / Expansion)](#cf_modulecore-cot--expansion)
- [VPP PluginBase / ConfigurablePlugin](#vpp-pluginbase--configurableplugin)
- [Dabs attribútum-alapú regisztráció](#dabs-attribútum-alapú-regisztráció)
- [Egyéni statikus modul menedzser](#egyéni-statikus-modul-menedzser)
- [Modul életciklus: Az univerzális szerződés](#modul-életciklus-az-univerzális-szerződés)
- [Bevált gyakorlatok a modul tervezéshez](#bevált-gyakorlatok-a-modul-tervezéshez)
- [Összehasonlító táblázat](#összehasonlító-táblázat)

---

## Miért modulok?

Modulrendszer nélkül egy DayZ mod jellemzően egy monolitikus modolt `MissionServer` vagy `MissionGameplay` osztállyal végzi, amely addig nő, amíg kezelhetetlenné nem válik:

```c
// ROSSZ: Minden egy modolt osztályba zsúfolva
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        InitLootSystem();
        InitVehicleTracker();
        InitBanManager();
        InitWeatherController();
        InitAdminPanel();
        InitKillfeedHUD();
        // ... még 20 rendszer
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        TickLootSystem(timeslice);
        TickVehicleTracker(timeslice);
        TickWeatherController(timeslice);
        // ... még 20 tick
    }
};
```

A modulrendszer ezt egyetlen stabil hook-ponttal helyettesíti:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        MyModuleManager.Register(new LootModule());
        MyModuleManager.Register(new VehicleModule());
        MyModuleManager.Register(new WeatherModule());
    }

    override void OnMissionStart()
    {
        super.OnMissionStart();
        MyModuleManager.OnMissionStart();  // Minden modulnak diszpécsel
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        MyModuleManager.OnServerUpdate(timeslice);  // Minden modulnak diszpécsel
    }
};
```

Minden modul független osztály, saját fájllal, saját állapottal és saját életciklus-hookjokkal. Új funkció hozzáadása új modul hozzáadását jelenti --- nem egy 3000 soros mission osztály szerkesztését.

---

## CF_ModuleCore (COT / Expansion)

A Community Framework (CF) biztosítja a legszélesebb körben használt modulrendszert a DayZ modding ökoszisztémában. Mind a COT, mind az Expansion erre épít.

### Hogyan működik

1. Deklarálsz egy modul osztályt, amely kiterjeszti a CF valamelyik modul alaposztályát
2. Regisztrálod a `config.cpp`-ben a `CfgPatches` / `CfgMods` alatt
3. A CF `CF_ModuleCoreManager`-je automatikusan felfedezi és példányosítja az összes regisztrált modul osztályt indításkor
4. Az életciklus-események automatikusan diszpécselődnek

### Modul alaposztályok

A CF három alaposztályt biztosít, amelyek megfelelnek a DayZ szkriptrétegjeinek:

| Alaposztály | Réteg | Tipikus használat |
|-----------|-------|-------------|
| `CF_ModuleGame` | 3_Game | Korai init, RPC regisztráció, adatosztályok |
| `CF_ModuleWorld` | 4_World | Entitás interakció, játékmenet rendszerek |
| `CF_ModuleMission` | 5_Mission | UI, HUD, mission-szintű hookok |

### Példa: CF modul

```c
class MyLootModule : CF_ModuleWorld
{
    // A CF ezt egyszer hívja meg a modul inicializálása során
    override void OnInit()
    {
        super.OnInit();
        // RPC kezelők regisztrálása, adatszerkezetek foglalása
    }

    // A CF ezt hívja a küldetés indulásakor
    override void OnMissionStart(Class sender, CF_EventArgs args)
    {
        super.OnMissionStart(sender, args);
        // Konfigurációk betöltése, kezdeti loot spawnolása
    }

    // A CF ezt minden képkockán hívja a szerveren
    override void OnUpdate(Class sender, CF_EventArgs args)
    {
        super.OnUpdate(sender, args);
        // Loot újraspawn időzítők frissítése
    }

    // A CF ezt hívja a küldetés végeztével
    override void OnMissionFinish(Class sender, CF_EventArgs args)
    {
        super.OnMissionFinish(sender, args);
        // Állapot mentése, erőforrások felszabadítása
    }
};
```

### CF modul elérése

```c
// Referencia lekérése futó modulra típus alapján
MyLootModule lootMod;
CF_Modules<MyLootModule>.Get(lootMod);
if (lootMod)
{
    lootMod.ForceRespawn();
}
```

### Kulcsjellemzők

- **Automatikus felfedezés**: a modulok a `config.cpp` deklarációk alapján automatikusan példányosulnak --- nincs kézi `new` hívás
- **Eseményargumentumok**: az életciklus-hookok `CF_EventArgs`-t kapnak kontextusadatokkal
- **CF függőség**: a modod a Community Framework-öt igényli függőségként
- **Széles körű támogatottság**: ha a modod COT-ot vagy Expansion-t futtató szervereket céloz, a CF már jelen van

---

## VPP PluginBase / ConfigurablePlugin

A VPP Admin Tools plugin architektúrát használ, ahol minden admin eszköz egy központi menedzsernél regisztrált plugin osztály.

### Plugin alap

```c
// VPP minta (egyszerűsítve)
class PluginBase : Managed
{
    void OnInit();
    void OnUpdate(float dt);
    void OnDestroy();

    // Plugin azonosság
    string GetPluginName();
    bool IsServerOnly();
};
```

### ConfigurablePlugin

A VPP a bázist egy konfiguráció-tudatos változattal bővíti, amely automatikusan betölti/menti a beállításokat:

```c
class ConfigurablePlugin : PluginBase
{
    // A VPP automatikusan betölti ezt JSON-ból init-kor
    ref PluginConfigBase m_Config;

    override void OnInit()
    {
        super.OnInit();
        LoadConfig();
    }

    void LoadConfig()
    {
        string path = "$profile:VPPAdminTools/" + GetPluginName() + ".json";
        if (FileExist(path))
        {
            JsonFileLoader<PluginConfigBase>.JsonLoadFile(path, m_Config);
        }
    }

    void SaveConfig()
    {
        string path = "$profile:VPPAdminTools/" + GetPluginName() + ".json";
        JsonFileLoader<PluginConfigBase>.JsonSaveFile(path, m_Config);
    }
};
```

### Regisztráció

A VPP a pluginokat a modolt `MissionServer.OnInit()`-ben regisztrálja:

```c
// VPP minta
GetPluginManager().RegisterPlugin(new VPPESPPlugin());
GetPluginManager().RegisterPlugin(new VPPTeleportPlugin());
GetPluginManager().RegisterPlugin(new VPPWeatherPlugin());
```

### Kulcsjellemzők

- **Kézi regisztráció**: minden plugin kifejezetten `new`-val jön létre és regisztrálva van
- **Konfiguráció integráció**: a `ConfigurablePlugin` egyesíti a konfigurációkezelést a modul életciklusával
- **Önálló**: nincs CF függőség; a VPP plugin menedzsere a saját rendszere
- **Egyértelmű tulajdonlás**: a plugin menedzser `ref`-et tart az összes pluginra, vezérelve azok élettartamát

---

## Dabs attribútum-alapú regisztráció

A Dabs Framework (amelyet a Dabs Framework Admin Tools használ) egy modernebb megközelítést alkalmaz: C#-stílusú attribútumokat az automatikus regisztrációhoz.

### A koncepció

Ahelyett, hogy kézzel regisztrálnál modulokat, az osztályt attribútummal jelölöd, és a keretrendszer indításkor reflexió segítségével felfedezi:

```c
// Dabs minta (koncepcionális)
[CF_RegisterModule(DabsAdminESP)]
class DabsAdminESP : CF_ModuleWorld
{
    override void OnInit()
    {
        super.OnInit();
        // ...
    }
};
```

A `CF_RegisterModule` attribútum utasítja a CF modul menedzserét, hogy automatikusan példányosítsa ezt az osztályt. Nincs szükség kézi `Register()` hívásra.

### Hogyan működik a felfedezés

Indításkor a CF átvizsgálja az összes betöltött szkript osztályt a regisztrációs attribútum után. Minden egyezéshez létrehoz egy példányt és hozzáadja a modul menedzserhez. Ez azelőtt történik, hogy bármely modulon meghívná az `OnInit()`-et.

### Kulcsjellemzők

- **Nulla boilerplate**: nincs regisztrációs kód a mission osztályokban
- **Deklaratív**: maga az osztály deklarálja, hogy modul
- **CF-re támaszkodik**: csak a Community Framework attribútum-feldolgozásával működik
- **Felfedezhetőség**: az összes modul megtalálható az attribútum keresésével a kódbázisban

---

## Egyéni statikus modul menedzser

Ez a megközelítés explicit regisztrációs mintát használ statikus menedzser osztállyal. Nincs a menedzsernek példánya --- teljesen statikus metódusok és statikus tároló. Ez akkor hasznos, ha nulla függőséget szeretnél külső keretrendszerektől.

### Modul alaposztályok

```c
// Alap: életciklus-hookok
class MyModuleBase : Managed
{
    bool IsServer();       // Alosztályban felülírandó
    bool IsClient();       // Alosztályban felülírandó
    string GetModuleName();
    void OnInit();
    void OnMissionStart();
    void OnMissionFinish();
};

// Szerver oldali modul: OnUpdate + játékos események hozzáadása
class MyServerModule : MyModuleBase
{
    void OnUpdate(float dt);
    void OnPlayerConnect(PlayerIdentity identity);
    void OnPlayerDisconnect(PlayerIdentity identity, string uid);
};

// Kliens oldali modul: OnUpdate hozzáadása
class MyClientModule : MyModuleBase
{
    void OnUpdate(float dt);
};
```

### Regisztráció

A modulok explicit módon regisztrálják magukat, jellemzően modolt mission osztályokból:

```c
// A modolt MissionServer.OnInit()-ben:
MyModuleManager.Register(new MyMissionServerModule());
MyModuleManager.Register(new MyAIServerModule());
```

### Életciklus diszpécselés

A modolt mission osztályok minden életciklus-ponton hívják a `MyModuleManager`-t:

```c
modded class MissionServer
{
    override void OnMissionStart()
    {
        super.OnMissionStart();
        MyModuleManager.OnMissionStart();
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        MyModuleManager.OnServerUpdate(timeslice);
    }

    override void OnMissionFinish()
    {
        MyModuleManager.OnMissionFinish();
        MyModuleManager.Cleanup();
        super.OnMissionFinish();
    }
};
```

### Listen szerver biztonság

Az egyéni modulrendszer alaposztályai egy kritikus invariánst érvényesítenek: a `MyServerModule` `true`-t ad vissza az `IsServer()`-ből és `false`-t az `IsClient()`-ből, míg a `MyClientModule` az ellenkezőjét. A menedzser ezeket a jelzőket használja, hogy elkerülje az életciklus-események kétszeri diszpécselését listen szervereken (ahol mind a `MissionServer`, mind a `MissionGameplay` ugyanabban a folyamatban fut).

Az alap `MyModuleBase` mindkettőből `true`-t ad vissza --- ezért figyelmeztet a kódbázis a közvetlen alosztályozása ellen.

### Kulcsjellemzők

- **Nulla függőség**: nincs CF, nincs külső keretrendszer
- **Statikus menedzser**: nincs szükség `GetInstance()`-re; teljesen statikus API
- **Explicit regisztráció**: teljes kontroll afölött, mi regisztrálódik és mikor
- **Listen szerver biztonságos**: típusos alosztályok megakadályozzák a dupla diszpécselést
- **Centralizált takarítás**: a `MyModuleManager.Cleanup()` az összes modult és core időzítőt lebontja

---

## Modul életciklus: Az univerzális szerződés

Az implementációs különbségek ellenére mind a négy keretrendszer ugyanazt az életciklus-szerződést követi:

```
┌─────────────────────────────────────────────────────┐
│  Regisztráció / Felfedezés                           │
│  A modul példány létrejön és regisztrálva van         │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnInit()                                            │
│  Egyszeri beállítás: gyűjtemények foglalása, RPC      │
│  regisztráció. Modulonként egyszer hívódik regisztráció│
│  után                                                │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnMissionStart()                                    │
│  A küldetés él: konfigurációk betöltése, időzítők     │
│  indítása, feliratkozás eseményekre, kezdeti          │
│  entitások spawnolása                                │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnUpdate(float dt)         [minden képkockán ismétlődik]│
│  Képkockánkénti tick: sorok feldolgozása, időzítők    │
│  frissítése, feltételek ellenőrzése, állapotgépek     │
│  előreléptetése                                      │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnMissionFinish()                                   │
│  Lebontás: állapot mentése, leiratkozás eseményekről, │
│  gyűjtemények kiürítése, referenciák nullázása        │
└─────────────────────────────────────────────────────┘
```

### Szabályok

1. **Az OnInit az OnMissionStart előtt jön.** Soha ne tölts be konfigurációkat vagy spawnolj entitásokat az `OnInit()`-ben --- a világ még nem feltétlenül áll készen.
2. **Az OnUpdate delta időt kap.** Mindig a `dt`-t használd az időalapú logikához, soha ne feltételezz fix képkockasebességet.
3. **Az OnMissionFinish-nek mindent ki kell takarítania.** Minden `ref` gyűjteményt ki kell üríteni. Minden esemény-feliratkozást el kell távolítani. Minden singletont meg kell semmisíteni. Ez az egyetlen megbízható lebontási pont.
4. **A modulok ne függjenek egymás inicializálási sorrendjétől.** Ha az A modulnak szüksége van a B modulra, használj lusta hozzáférést (`GetModule()`) ahelyett, hogy feltételeznéd, hogy B korábban regisztrálva lett.

---

## Bevált gyakorlatok a modul tervezéshez

### 1. Egy modul, egy felelősség

Egy modul pontosan egy területet kell, hogy birtokoljon. Ha azon kapod magad, hogy `JárműÉsIdőjárásÉsLootModul`-t írsz, bontsd szét.

```c
// JÓ: Fókuszált modulok
class MyLootModule : MyServerModule { ... }
class MyVehicleModule : MyServerModule { ... }
class MyWeatherModule : MyServerModule { ... }

// ROSSZ: Isten-modul
class MyEverythingModule : MyServerModule { ... }
```

### 2. Tartsd olcsón az OnUpdate-et

Az `OnUpdate` minden képkockán fut. Ha a modulod költséges munkát végez (fájl I/O, világ-szkennelés, útkereső), időzítővel vagy képkockák közötti kötegeléssel csináld:

```c
class MyCleanupModule : MyServerModule
{
    protected float m_CleanupTimer;
    protected const float CLEANUP_INTERVAL = 300.0;  // 5 percenként

    override void OnUpdate(float dt)
    {
        m_CleanupTimer += dt;
        if (m_CleanupTimer >= CLEANUP_INTERVAL)
        {
            m_CleanupTimer = 0;
            RunCleanup();
        }
    }
};
```

### 3. RPC-ket az OnInit-ben regisztráld, ne az OnMissionStart-ban

Az RPC kezelőknek a helyükön kell lenniük, mielőtt bármely kliens üzenetet küldhetne. Az `OnInit()` a modul regisztráció során fut, ami a küldetés beállítás elején történik. Az `OnMissionStart()` lehet, hogy túl késő, ha a kliensek gyorsan csatlakoznak.

```c
class MyModule : MyServerModule
{
    override void OnInit()
    {
        super.OnInit();
        MyRPC.Register("MyMod", "RPC_DoThing", this, MyRPCSide.SERVER);
    }

    void RPC_DoThing(PlayerIdentity sender, Object target, ParamsReadContext ctx)
    {
        // RPC kezelése
    }
};
```

### 4. Használd a modul menedzsert a modulok közötti hozzáféréshez

Ne tarts közvetlen referenciákat más modulokra. Használd a menedzser keresését:

```c
// JÓ: Laza csatolás a menedzseren keresztül
MyModuleBase mod = MyModuleManager.GetModule("MyAIServerModule");
MyAIServerModule aiMod;
if (Class.CastTo(aiMod, mod))
{
    aiMod.PauseSpawning();
}

// ROSSZ: Közvetlen statikus referencia erős csatolást hoz létre
MyAIServerModule.s_Instance.PauseSpawning();
```

### 5. Védekezz a hiányzó függőségek ellen

Nem minden szerver futtat minden modot. Ha a modulod opcionálisan integrálódik egy másik moddal, használj preprocesszor ellenőrzéseket:

```c
override void OnMissionStart()
{
    super.OnMissionStart();

    #ifdef MYMOD_AI
    MyEventBus.OnMissionStarted.Insert(OnAIMissionStarted);
    #endif
}
```

### 6. Naplózd a modul életciklus-eseményeket

A naplózás egyszerűvé teszi a hibakeresést. Minden modulnak naplóznia kell, amikor inicializálódik és leáll:

```c
override void OnInit()
{
    super.OnInit();
    MyLog.Info("MyModule", "Initialized");
}

override void OnMissionFinish()
{
    MyLog.Info("MyModule", "Shutting down");
    // Takarítás...
}
```

---

## Összehasonlító táblázat

| Jellemző | CF_ModuleCore | VPP Plugin | Dabs attribútum | Egyéni modul |
|---------|--------------|------------|----------------|---------------|
| **Felfedezés** | config.cpp + auto | Kézi `Register()` | Attribútum szkennelés | Kézi `Register()` |
| **Alaposztályok** | Game / World / Mission | PluginBase / ConfigurablePlugin | CF_ModuleWorld + attribútum | ServerModule / ClientModule |
| **Függőségek** | CF szükséges | Önálló | CF szükséges | Önálló |
| **Listen szerver biztonságos** | CF kezeli | Kézi ellenőrzés | CF kezeli | Típusos alosztályok |
| **Konfiguráció integráció** | Külön | Beépítve a ConfigurablePlugin-be | Külön | MyConfigManager-en keresztül |
| **Update diszpécselés** | Automatikus | A menedzser hívja az `OnUpdate`-et | Automatikus | A menedzser hívja az `OnUpdate`-et |
| **Takarítás** | CF kezeli | Kézi `OnDestroy` | CF kezeli | `MyModuleManager.Cleanup()` |
| **Mod-közi hozzáférés** | `CF_Modules<T>.Get()` | `GetPluginManager().Get()` | `CF_Modules<T>.Get()` | `MyModuleManager.GetModule()` |

Válaszd azt a megközelítést, amely illeszkedik a modod függőségi profiljához. Ha már függsz a CF-től, használd a `CF_ModuleCore`-t. Ha nulla külső függőséget szeretnél, építsd meg a saját rendszered az egyéni menedzser vagy VPP minta alapján.

---

## Kompatibilitás és hatás

- **Multi-Mod:** Több mod is regisztrálhatja a saját moduljait ugyanannál a menedzsernél (CF, VPP vagy egyéni). Névütközések csak akkor fordulnak elő, ha két mod ugyanazt az osztálytípust regisztrálja --- használj egyedi, a mod előtagjával ellátott osztályneveket.
- **Betöltési sorrend:** A CF a `config.cpp`-ből fedezi fel a modulokat, így a betöltési sorrend a `requiredAddons`-t követi. Az egyéni menedzserek az `OnInit()`-ben regisztrálják a modulokat, ahol a `modded class` lánc határozza meg a sorrendet. A moduloknak nem kellene a regisztrációs sorrendtől függeniük --- használj lusta hozzáférési mintákat.
- **Listen szerver:** Listen szervereken mind a `MissionServer`, mind a `MissionGameplay` ugyanabban a folyamatban fut. Ha a modul menedzsered mindkettőből diszpécsel `OnUpdate`-et, a modulok dupla tick-eket kapnak. Használj típusos alosztályokat (`ServerModule` / `ClientModule`), amelyek `IsServer()`-t vagy `IsClient()`-t adnak vissza ennek megakadályozásához.
- **Teljesítmény:** A modul diszpécselés egy ciklusiterációt ad hozzá regisztrált modulonként életciklus-hívásonként. 10--20 modullal ez elhanyagolható. Biztosítsd, hogy az egyes modulok `OnUpdate` metódusai olcsók legyenek (lásd a 7.7. fejezetet).
- **Migráció:** DayZ verziók frissítésekor a modulrendszerek stabilak, amíg az alaposztály API (`CF_ModuleWorld`, `PluginBase` stb.) nem változik. Rögzítsd a CF függőségi verziódat a törés elkerüléséhez.

---

## Gyakori hibák

| Hiba | Hatás | Javítás |
|---------|--------|-----|
| Hiányzó `OnMissionFinish` takarítás egy modulban | Gyűjtemények, időzítők és esemény-feliratkozások túlélik a küldetés-újraindításokat, elavult adatokat vagy összeomlásokat okozva | Írd felül az `OnMissionFinish`-t, ürítsd ki az összes `ref` gyűjteményt, iratkozz le minden eseményről |
| Életciklus-események kétszeri diszpécselése listen szervereken | Szerver modulok futtatják a kliens logikát és fordítva; dupla spawnok, dupla RPC küldések | Használj `IsServer()` / `IsClient()` védelmeket vagy típusos modul alosztályokat, amelyek kikényszerítik a szétválasztást |
| RPC-k regisztrálása az `OnMissionStart`-ban az `OnInit` helyett | A küldetés beállítás során csatlakozó kliensek küldhetnek RPC-ket, mielőtt a kezelők készek --- az üzenetek csendben eldobódnak | Mindig az `OnInit()`-ben regisztráld az RPC kezelőket, amely a modul regisztráció során fut, mielőtt bármely kliens csatlakozna |
| Egy "Isten-modul" mindent kezel | Lehetetlen hibakeresni, tesztelni vagy bővíteni; összevonási konfliktusok, amikor több fejlesztő dolgozik rajta | Bontsd fókuszált modulokra, mindegyik egyetlen felelősséggel |
| Közvetlen `ref` tartása másik modul példányra | Erős csatolást és potenciális ref-ciklus memóriaszivárgásokat hoz létre | Használd a modul menedzser keresését (`GetModule()`, `CF_Modules<T>.Get()`) a modulok közötti hozzáféréshez |

---

## Elmélet vs gyakorlat

| Az elmélet azt mondja | DayZ valóság |
|---------------|-------------|
| A modulfelfedezésnek automatikusnak kell lennie reflexión keresztül | Az Enforce Script reflexió korlátozott; a `config.cpp`-alapú felfedezés (CF) vagy explicit `Register()` hívások az egyetlen megbízható megközelítések |
| A moduloknak futásidőben cserélhetőnek kell lenniük | A DayZ nem támogatja a szkriptek menet közbeni újratöltését; a modulok a teljes küldetés életciklus alatt élnek |
| Használj interfészeket a modul szerződésekhez | Az Enforce Scriptben nincs `interface` kulcsszó; használj alaposztály virtuális metódusokat (`override`) helyette |
| A függőséginjektálás szétválasztja a modulokat | Nem létezik DI keretrendszer; használj menedzser kereséseket és `#ifdef` védelmeket az opcionális mod-közi függőségekhez |

---

[Kezdőlap](../README.md) | [<< Előző: Singleton minta](01-singletons.md) | **Modul / Plugin rendszerek** | [Következő: RPC minták >>](03-rpc-patterns.md)
