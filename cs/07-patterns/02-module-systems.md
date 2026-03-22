# Kapitola 7.2: Systémy modulů / pluginů

[Domů](../README.md) | [<< Předchozí: Vzor Singleton](01-singletons.md) | **Systémy modulů / pluginů** | [Další: Vzory RPC >>](03-rpc-patterns.md)

---

## Úvod

Každý seriózní DayZ modový framework používá systém modulů nebo pluginů pro organizaci kódu do samostatných jednotek s definovanými hooky životního cyklu. Místo rozptylování inicializační logiky napříč moddovanými třídami misí se moduly registrují u centrálního manažera, který dispečuje události životního cyklu --- `OnInit`, `OnMissionStart`, `OnUpdate`, `OnMissionFinish` --- každému modulu v předvídatelném pořadí.

Tato kapitola zkoumá čtyři přístupy z praxe: `CF_ModuleCore` od Community Frameworku, `PluginBase` / `ConfigurablePlugin` od VPP, registraci založenou na atributech od Dabs Frameworku a vlastní statický manažer modulů. Každý řeší stejný problém odlišně; pochopení všech čtyř vám pomůže vybrat správný vzor pro váš vlastní mod nebo se čistě integrovat s existujícím frameworkem.

---

## Obsah

- [Proč moduly?](#proč-moduly)
- [CF_ModuleCore (COT / Expansion)](#cf_modulecore-cot--expansion)
- [VPP PluginBase / ConfigurablePlugin](#vpp-pluginbase--configurableplugin)
- [Registrace založená na atributech (Dabs)](#registrace-založená-na-atributech-dabs)
- [Vlastní statický manažer modulů](#vlastní-statický-manažer-modulů)
- [Životní cyklus modulu: Univerzální kontrakt](#životní-cyklus-modulu-univerzální-kontrakt)
- [Doporučené postupy pro návrh modulů](#doporučené-postupy-pro-návrh-modulů)
- [Srovnávací tabulka](#srovnávací-tabulka)

---

## Proč moduly?

Bez systému modulů DayZ mod typicky skončí s monolitickou moddovanou třídou `MissionServer` nebo `MissionGameplay`, která roste, dokud se nestane nezvladatelnou:

```c
// ŠPATNĚ: Všechno nacpané do jedné moddované třídy
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
        // ... dalších 20 systémů
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        TickLootSystem(timeslice);
        TickVehicleTracker(timeslice);
        TickWeatherController(timeslice);
        // ... dalších 20 tiků
    }
};
```

Systém modulů toto nahrazuje jediným stabilním bodem napojení:

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
        MyModuleManager.OnMissionStart();  // Dispečuje všem modulům
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        MyModuleManager.OnServerUpdate(timeslice);  // Dispečuje všem modulům
    }
};
```

Každý modul je nezávislá třída se svým vlastním souborem, svým vlastním stavem a svými vlastními hooky životního cyklu. Přidání nové funkce znamená přidání nového modulu --- ne editaci 3000řádkové třídy mise.

---

## CF_ModuleCore (COT / Expansion)

Community Framework (CF) poskytuje nejrozšířenější systém modulů v ekosystému moddingu DayZ. COT i Expansion na něm staví.

### Jak to funguje

1. Deklarujete třídu modulu, která rozšiřuje jednu ze základních tříd modulů CF
2. Zaregistrujete ji v `config.cpp` pod `CfgPatches` / `CfgMods`
3. `CF_ModuleCoreManager` od CF automaticky objeví a instanciuje všechny registrované třídy modulů při startu
4. Události životního cyklu se dispečují automaticky

### Základní třídy modulů

CF poskytuje tři základní třídy odpovídající skriptovým vrstvám DayZ:

| Základní třída | Vrstva | Typické použití |
|-----------|-------|-------------|
| `CF_ModuleGame` | 3_Game | Raná inicializace, registrace RPC, datové třídy |
| `CF_ModuleWorld` | 4_World | Interakce s entitami, herní systémy |
| `CF_ModuleMission` | 5_Mission | UI, HUD, hooky na úrovni mise |

### Příklad: CF modul

```c
class MyLootModule : CF_ModuleWorld
{
    // CF zavolá toto jednou během inicializace modulu
    override void OnInit()
    {
        super.OnInit();
        // Registrace RPC handlerů, alokace datových struktur
    }

    // CF zavolá toto při startu mise
    override void OnMissionStart(Class sender, CF_EventArgs args)
    {
        super.OnMissionStart(sender, args);
        // Načtení konfigurací, spawn počátečního lootu
    }

    // CF zavolá toto každý snímek na serveru
    override void OnUpdate(Class sender, CF_EventArgs args)
    {
        super.OnUpdate(sender, args);
        // Tikání časovačů respawnu lootu
    }

    // CF zavolá toto při ukončení mise
    override void OnMissionFinish(Class sender, CF_EventArgs args)
    {
        super.OnMissionFinish(sender, args);
        // Uložení stavu, uvolnění zdrojů
    }
};
```

### Přístup k CF modulu

```c
// Získání reference na běžící modul podle typu
MyLootModule lootMod;
CF_Modules<MyLootModule>.Get(lootMod);
if (lootMod)
{
    lootMod.ForceRespawn();
}
```

### Klíčové charakteristiky

- **Automatické objevování**: moduly jsou instanciovány CF na základě deklarací v `config.cpp` --- bez manuálních volání `new`
- **Argumenty událostí**: hooky životního cyklu přijímají `CF_EventArgs` s kontextovými daty
- **Závislost na CF**: váš mod vyžaduje Community Framework jako závislost
- **Široká podpora**: pokud váš mod cílí na servery, které již provozují COT nebo Expansion, CF je již přítomen

---

## VPP PluginBase / ConfigurablePlugin

VPP Admin Tools používá pluginovou architekturu, kde každý administrátorský nástroj je pluginová třída registrovaná u centrálního manažera.

### Základ pluginu

```c
// Vzor VPP (zjednodušený)
class PluginBase : Managed
{
    void OnInit();
    void OnUpdate(float dt);
    void OnDestroy();

    // Identita pluginu
    string GetPluginName();
    bool IsServerOnly();
};
```

### ConfigurablePlugin

VPP rozšiřuje základ o variantu s povědomím o konfiguraci, která automaticky načítá/ukládá nastavení:

```c
class ConfigurablePlugin : PluginBase
{
    // VPP automaticky načte toto z JSON při inicializaci
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

### Registrace

VPP registruje pluginy v moddovaném `MissionServer.OnInit()`:

```c
// Vzor VPP
GetPluginManager().RegisterPlugin(new VPPESPPlugin());
GetPluginManager().RegisterPlugin(new VPPTeleportPlugin());
GetPluginManager().RegisterPlugin(new VPPWeatherPlugin());
```

### Klíčové charakteristiky

- **Manuální registrace**: každý plugin je explicitně instanciován pomocí `new` a registrován
- **Integrace konfigurace**: `ConfigurablePlugin` slučuje správu konfigurace s životním cyklem modulu
- **Samostatný**: žádná závislost na CF; manažer pluginů VPP je vlastní systém
- **Jasné vlastnictví**: manažer pluginů drží `ref` na všechny pluginy, čímž kontroluje jejich životnost

---

## Registrace založená na atributech (Dabs)

Dabs Framework (používaný v Dabs Framework Admin Tools) používá modernější přístup: atributy ve stylu C# pro automatickou registraci.

### Koncept

Místo manuální registrace modulů anotujete třídu atributem a framework ji objeví při startu pomocí reflexe:

```c
// Vzor Dabs (koncepční)
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

Atribut `CF_RegisterModule` říká manažeru modulů CF, aby tuto třídu automaticky instancioval. Žádné manuální volání `Register()` není potřeba.

### Jak funguje objevování

Při startu CF prohledá všechny načtené třídy skriptů pro registrační atribut. Pro každou shodu vytvoří instanci a přidá ji do manažeru modulů. To se děje před tím, než je `OnInit()` zavolán na jakémkoli modulu.

### Klíčové charakteristiky

- **Nulový boilerplate**: žádný registrační kód ve třídách mise
- **Deklarativní**: třída sama deklaruje, že je modulem
- **Závisí na CF**: funguje pouze se zpracováním atributů Community Frameworku
- **Nalezitelnost**: všechny moduly můžete najít vyhledáním atributu v kódové bázi

---

## Vlastní statický manažer modulů

Tento přístup používá explicitní registrační vzor se statickou manažerskou třídou. Neexistuje žádná instance manažera --- jsou to čistě statické metody a statické úložiště. To je užitečné, když chcete nulové závislosti na externích frameworcích.

### Základní třídy modulů

```c
// Základ: hooky životního cyklu
class MyModuleBase : Managed
{
    bool IsServer();       // Přepište v podtřídě
    bool IsClient();       // Přepište v podtřídě
    string GetModuleName();
    void OnInit();
    void OnMissionStart();
    void OnMissionFinish();
};

// Serverový modul: přidává OnUpdate + události hráčů
class MyServerModule : MyModuleBase
{
    void OnUpdate(float dt);
    void OnPlayerConnect(PlayerIdentity identity);
    void OnPlayerDisconnect(PlayerIdentity identity, string uid);
};

// Klientský modul: přidává OnUpdate
class MyClientModule : MyModuleBase
{
    void OnUpdate(float dt);
};
```

### Registrace

Moduly se registrují explicitně, typicky z moddovaných tříd mise:

```c
// V moddovaném MissionServer.OnInit():
MyModuleManager.Register(new MyMissionServerModule());
MyModuleManager.Register(new MyAIServerModule());
```

### Dispečování životního cyklu

Moddované třídy mise volají do `MyModuleManager` v každém bodě životního cyklu:

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

### Bezpečnost na listen serveru

Základní třídy modulů vlastního systému vynucují kritický invariant: `MyServerModule` vrací `true` z `IsServer()` a `false` z `IsClient()`, zatímco `MyClientModule` dělá opak. Manažer používá tyto příznaky, aby se vyhnul dvojitému dispečování událostí životního cyklu na listen serverech (kde `MissionServer` i `MissionGameplay` běží ve stejném procesu).

Základní `MyModuleBase` vrací `true` z obou --- proto kódová báze varuje před přímým rozšířením této třídy.

### Klíčové charakteristiky

- **Nulové závislosti**: žádné CF, žádné externí frameworky
- **Statický manažer**: žádný `GetInstance()` není potřeba; čistě statické API
- **Explicitní registrace**: plná kontrola nad tím, co se registruje a kdy
- **Bezpečné pro listen server**: typované podtřídy zabraňují dvojitému dispečování
- **Centralizovaný úklid**: `MyModuleManager.Cleanup()` zruší všechny moduly a základní časovače

---

## Životní cyklus modulu: Univerzální kontrakt

Navzdory rozdílům v implementaci všechny čtyři frameworky následují stejný kontrakt životního cyklu:

```
┌─────────────────────────────────────────────────────┐
│  Registrace / Objevení                               │
│  Instance modulu je vytvořena a registrována          │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnInit()                                            │
│  Jednorázové nastavení: alokace kolekcí, registrace  │
│  RPC. Voláno jednou na modul po registraci.          │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnMissionStart()                                    │
│  Mise je aktivní: načtení konfigurací, spuštění      │
│  časovačů, přihlášení k událostem, spawn entit       │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnUpdate(float dt)         [opakuje se každý snímek] │
│  Tik na snímek: zpracování front, aktualizace        │
│  časovačů, kontrola podmínek, posun stavových automatů│
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnMissionFinish()                                   │
│  Úklid: uložení stavu, odhlášení událostí,           │
│  vyčištění kolekcí, vynulování referencí              │
└─────────────────────────────────────────────────────┘
```

### Pravidla

1. **OnInit přichází před OnMissionStart.** Nikdy nenačítejte konfigurace ani nespawnujte entity v `OnInit()` --- svět ještě nemusí být připraven.
2. **OnUpdate přijímá delta čas.** Vždy používejte `dt` pro logiku založenou na čase, nikdy nepředpokládejte fixní snímkovou frekvenci.
3. **OnMissionFinish musí uklidit všechno.** Každá `ref` kolekce musí být vyčištěna. Každé přihlášení k události musí být odebráno. Každý singleton musí být zničen. Toto je jediný spolehlivý bod úklidu.
4. **Moduly by neměly záviset na pořadí inicializace jiných modulů.** Pokud modul A potřebuje modul B, použijte líný přístup (`GetModule()`) místo předpokladu, že B byl registrován jako první.

---

## Doporučené postupy pro návrh modulů

### 1. Jeden modul, jedna zodpovědnost

Modul by měl vlastnit právě jednu doménu. Pokud zjistíte, že píšete `VehicleAndWeatherAndLootModule`, rozdělte ho.

```c
// SPRÁVNĚ: Zaměřené moduly
class MyLootModule : MyServerModule { ... }
class MyVehicleModule : MyServerModule { ... }
class MyWeatherModule : MyServerModule { ... }

// ŠPATNĚ: God modul
class MyEverythingModule : MyServerModule { ... }
```

### 2. Udržujte OnUpdate levný

`OnUpdate` běží každý snímek. Pokud váš modul dělá náročnou práci (souborové I/O, prohledávání světa, hledání cest), dělejte to na časovači nebo to rozložte mezi snímky:

```c
class MyCleanupModule : MyServerModule
{
    protected float m_CleanupTimer;
    protected const float CLEANUP_INTERVAL = 300.0;  // Každých 5 minut

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

### 3. Registrujte RPC v OnInit, ne v OnMissionStart

RPC handlery musí být na místě dříve, než jakýkoli klient může odeslat zprávu. `OnInit()` běží během registrace modulu, což se děje brzy v nastavení mise. `OnMissionStart()` může být příliš pozdě, pokud se klienti připojí rychle.

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
        // Zpracování RPC
    }
};
```

### 4. Používejte manažer modulů pro přístup mezi moduly

Nedržte přímé reference na jiné moduly. Používejte vyhledávání manažera:

```c
// SPRÁVNĚ: Volná vazba přes manažer
MyModuleBase mod = MyModuleManager.GetModule("MyAIServerModule");
MyAIServerModule aiMod;
if (Class.CastTo(aiMod, mod))
{
    aiMod.PauseSpawning();
}

// ŠPATNĚ: Přímá statická reference vytváří pevnou vazbu
MyAIServerModule.s_Instance.PauseSpawning();
```

### 5. Chraňte se před chybějícími závislostmi

Ne každý server provozuje každý mod. Pokud se váš modul volitelně integruje s jiným modem, použijte kontroly preprocesoru:

```c
override void OnMissionStart()
{
    super.OnMissionStart();

    #ifdef MYMOD_AI
    MyEventBus.OnMissionStarted.Insert(OnAIMissionStarted);
    #endif
}
```

### 6. Logujte události životního cyklu modulu

Logování zjednodušuje ladění. Každý modul by měl logovat, kdy se inicializuje a ukončuje:

```c
override void OnInit()
{
    super.OnInit();
    MyLog.Info("MyModule", "Inicializován");
}

override void OnMissionFinish()
{
    MyLog.Info("MyModule", "Ukončování");
    // Úklid...
}
```

---

## Srovnávací tabulka

| Vlastnost | CF_ModuleCore | VPP Plugin | Dabs Atribut | Vlastní modul |
|---------|--------------|------------|----------------|---------------|
| **Objevení** | config.cpp + auto | Manuální `Register()` | Skenování atributů | Manuální `Register()` |
| **Základní třídy** | Game / World / Mission | PluginBase / ConfigurablePlugin | CF_ModuleWorld + atribut | ServerModule / ClientModule |
| **Závislosti** | Vyžaduje CF | Samostatný | Vyžaduje CF | Samostatný |
| **Bezpečné pro listen server** | CF to řeší | Manuální kontrola | CF to řeší | Typované podtřídy |
| **Integrace konfigurace** | Oddělená | Vestavěna v ConfigurablePlugin | Oddělená | Přes MyConfigManager |
| **Dispečování update** | Automatické | Manažer volá `OnUpdate` | Automatické | Manažer volá `OnUpdate` |
| **Úklid** | CF to řeší | Manuální `OnDestroy` | CF to řeší | `MyModuleManager.Cleanup()` |
| **Přístup mezi mody** | `CF_Modules<T>.Get()` | `GetPluginManager().Get()` | `CF_Modules<T>.Get()` | `MyModuleManager.GetModule()` |

Zvolte přístup, který odpovídá profilu závislostí vašeho modu. Pokud již závisíte na CF, použijte `CF_ModuleCore`. Pokud chcete nulové externí závislosti, vytvořte vlastní systém podle vzoru vlastního manažera nebo VPP.

---

## Kompatibilita a dopad

- **Více modů:** Více modů může každý registrovat vlastní moduly u stejného manažera (CF, VPP nebo vlastní). Kolize názvů nastanou pouze tehdy, když dva mody registrují stejný typ třídy --- používejte unikátní názvy tříd s prefixem vašeho modu.
- **Pořadí načítání:** CF automaticky objevuje moduly z `config.cpp`, takže pořadí načítání se řídí `requiredAddons`. Vlastní manažeři registrují moduly v `OnInit()`, kde řetězec `modded class` určuje pořadí. Moduly by neměly záviset na pořadí registrace --- používejte vzory líného přístupu.
- **Listen Server:** Na listen serverech `MissionServer` i `MissionGameplay` běží ve stejném procesu. Pokud váš manažer modulů dispečuje `OnUpdate` z obou, moduly dostanou dvojité tiky. Použijte typované podtřídy (`ServerModule` / `ClientModule`), které vracejí `IsServer()` nebo `IsClient()`, abyste tomu zabránili.
- **Výkon:** Dispečování modulů přidává jednu iteraci smyčky na registrovaný modul na volání životního cyklu. S 10--20 moduly je to zanedbatelné. Zajistěte, aby individuální metody `OnUpdate` modulů byly levné (viz Kapitola 7.7).
- **Migrace:** Při upgradu verzí DayZ jsou systémy modulů stabilní, dokud se API základní třídy (`CF_ModuleWorld`, `PluginBase` atd.) nezmění. Připněte verzi závislosti CF, abyste se vyhnuli poruchám.

---

## Časté chyby

| Chyba | Dopad | Oprava |
|---------|--------|-----|
| Chybějící úklid `OnMissionFinish` v modulu | Kolekce, časovače a přihlášení k událostem přežijí restarty misí, což způsobuje zastaralá data nebo pády | Přepište `OnMissionFinish`, vyčistěte všechny `ref` kolekce, odhlaste všechny události |
| Dvojité dispečování událostí životního cyklu na listen serverech | Serverové moduly spouštějí klientskou logiku a naopak; duplicitní spawny, dvojité odesílání RPC | Použijte ochrany `IsServer()` / `IsClient()` nebo typované podtřídy modulů, které vynucují rozdělení |
| Registrace RPC v `OnMissionStart` místo `OnInit` | Klienti, kteří se připojí během nastavení mise, mohou odesílat RPC dříve, než jsou handlery připraveny --- zprávy jsou tiše zahozeny | Vždy registrujte RPC handlery v `OnInit()`, který běží během registrace modulu před připojením jakéhokoli klienta |
| Jeden "God modul" zpracovávající všechno | Nelze ladit, testovat ani rozšiřovat; konflikty při slučování, když na tom pracuje více vývojářů | Rozdělte na zaměřené moduly s jedinou zodpovědností |
| Držení přímého `ref` na jinou instanci modulu | Vytváří pevnou vazbu a potenciální úniky paměti z ref-cyklů | Použijte vyhledávání manažera modulů (`GetModule()`, `CF_Modules<T>.Get()`) pro přístup mezi moduly |

---

## Teorie vs praxe

| Učebnice říká | Realita DayZ |
|---------------|-------------|
| Objevování modulů by mělo být automatické přes reflexi | Reflexe Enforce Scriptu je omezená; objevování založené na `config.cpp` (CF) nebo explicitní volání `Register()` jsou jediné spolehlivé přístupy |
| Moduly by měly být za provozu vyměnitelné | DayZ nepodporuje hot-reloading skriptů; moduly žijí po celý životní cyklus mise |
| Používejte rozhraní pro kontrakty modulů | Enforce Script nemá klíčové slovo `interface`; místo toho použijte virtuální metody bázové třídy (`override`) |
| Dependency injection odděluje moduly | Žádný DI framework neexistuje; použijte vyhledávání manažerů a `#ifdef` ochrany pro volitelné závislosti mezi mody |

---

[Domů](../README.md) | [<< Předchozí: Vzor Singleton](01-singletons.md) | **Systémy modulů / pluginů** | [Další: Vzory RPC >>](03-rpc-patterns.md)
