# Kapitola 7.1: Vzor Singleton

[Domů](../README.md) | **Vzor Singleton** | [Další: Systémy modulů >>](02-module-systems.md)

---

## Úvod

Vzor singleton zaručuje, že třída má právě jednu instanci, přístupnou globálně. V DayZ moddingu je to nejběžnější architektonický vzor --- prakticky každý manažer, cache, registr a subsystém ho používá. COT, VPP, Expansion, Dabs Framework a další, ti všichni spoléhají na singletony pro koordinaci stavu napříč skriptovými vrstvami enginu.

Tato kapitola pokrývá kanonickou implementaci, správu životního cyklu, kdy je tento vzor vhodný a kde se pokazí.

---

## Obsah

- [Kanonická implementace](#kanonická-implementace)
- [Lazy vs Eager inicializace](#lazy-vs-eager-inicializace)
- [Správa životního cyklu](#správa-životního-cyklu)
- [Kdy použít singletony](#kdy-použít-singletony)
- [Příklady z praxe](#příklady-z-praxe)
- [Úvahy o bezpečnosti vláken](#úvahy-o-bezpečnosti-vláken)
- [Anti-vzory](#anti-vzory)
- [Alternativa: Čistě statické třídy](#alternativa-čistě-statické-třídy)
- [Kontrolní seznam](#kontrolní-seznam)

---

## Kanonická implementace

Standardní DayZ singleton se řídí jednoduchým vzorcem: pole `private static ref`, statický přístupový bod `GetInstance()` a statická metoda `DestroyInstance()` pro úklid.

```c
class LootManager
{
    // Jediná instance. 'ref' ji drží naživu; 'private' brání vnějšímu zásahu.
    private static ref LootManager s_Instance;

    // Privátní data vlastněná singletonem
    protected ref map<string, int> m_SpawnCounts;

    // Konstruktor — volán právě jednou
    void LootManager()
    {
        m_SpawnCounts = new map<string, int>();
    }

    // Destruktor — volán když je s_Instance nastaven na null
    void ~LootManager()
    {
        m_SpawnCounts = null;
    }

    // Líný přístupový bod: vytvoří při prvním volání
    static LootManager GetInstance()
    {
        if (!s_Instance)
        {
            s_Instance = new LootManager();
        }
        return s_Instance;
    }

    // Explicitní zrušení
    static void DestroyInstance()
    {
        s_Instance = null;
    }

    // --- Veřejné API ---

    void RecordSpawn(string className)
    {
        int count = 0;
        m_SpawnCounts.Find(className, count);
        m_SpawnCounts.Set(className, count + 1);
    }

    int GetSpawnCount(string className)
    {
        int count = 0;
        m_SpawnCounts.Find(className, count);
        return count;
    }
};
```

### Proč `private static ref`?

| Klíčové slovo | Účel |
|---------|---------|
| `private` | Zabraňuje ostatním třídám nastavit `s_Instance` na null nebo ho nahradit |
| `static` | Sdíleno napříč veškerým kódem --- pro přístup není potřeba instance |
| `ref` | Silná reference --- drží objekt naživu, dokud je `s_Instance` nenulový |

Bez `ref` by instance byla slabá reference a mohla by být uvolněna garbage collectorem, zatímco se stále používá.

---

## Lazy vs Eager inicializace

### Líná inicializace (doporučený výchozí přístup)

Metoda `GetInstance()` vytvoří instanci při prvním přístupu. Tento přístup používá většina DayZ modů.

```c
static LootManager GetInstance()
{
    if (!s_Instance)
    {
        s_Instance = new LootManager();
    }
    return s_Instance;
}
```

**Výhody:**
- Žádná práce se nekoná, dokud není skutečně potřeba
- Žádná závislost na pořadí inicializace mezi mody
- Bezpečné, pokud je singleton volitelný (některé konfigurace serveru ho nemusí nikdy zavolat)

**Nevýhoda:**
- První volající nese náklady na konstrukci (obvykle zanedbatelné)

### Eager inicializace

Některé singletony jsou vytvořeny explicitně během startu mise, typicky z `MissionServer.OnInit()` nebo z metody `OnMissionStart()` modulu.

```c
// Ve vašem moddovaném MissionServer.OnInit():
void OnInit()
{
    super.OnInit();
    LootManager.Create();  // Eager: konstruován nyní, ne při prvním použití
}

// V LootManageru:
static void Create()
{
    if (!s_Instance)
    {
        s_Instance = new LootManager();
    }
}
```

**Kdy preferovat eager:**
- Singleton načítá data z disku (konfigurace, JSON soubory) a chcete, aby se chyby při načítání projevily při startu
- Singleton registruje RPC handlery, které musí být na místě dříve, než se připojí jakýkoli klient
- Na pořadí inicializace záleží a potřebujete ho explicitně kontrolovat

---

## Správa životního cyklu

Nejčastějším zdrojem chyb se singletony v DayZ je selhání úklidu při konci mise. DayZ servery mohou restartovat mise bez restartování procesu, což znamená, že statická pole přežijí mezi restarty misí. Pokud nevynulujete `s_Instance` v `OnMissionFinish`, přenesete zastaralé reference, mrtvé objekty a osiřelé callbacky do další mise.

### Kontrakt životního cyklu

```
Start procesu serveru
  └─ MissionServer.OnInit()
       └─ Vytvoření singletonů (eager) nebo je nechat se samy vytvořit (lazy)
  └─ MissionServer.OnMissionStart()
       └─ Singletony začnou pracovat
  └─ ... server běží ...
  └─ MissionServer.OnMissionFinish()
       └─ DestroyInstance() na každém singletonu
       └─ Všechny statické ref nastaveny na null
  └─ (Mise se může restartovat)
       └─ Nové singletony vytvořeny znovu
```

### Vzor úklidu

Vždy spárujte svůj singleton s metodou `DestroyInstance()` a zavolejte ji při ukončení:

```c
class VehicleRegistry
{
    private static ref VehicleRegistry s_Instance;
    protected ref array<ref VehicleData> m_Vehicles;

    static VehicleRegistry GetInstance()
    {
        if (!s_Instance) s_Instance = new VehicleRegistry();
        return s_Instance;
    }

    static void DestroyInstance()
    {
        s_Instance = null;  // Uvolní ref, spustí se destruktor
    }

    void ~VehicleRegistry()
    {
        if (m_Vehicles) m_Vehicles.Clear();
        m_Vehicles = null;
    }
};

// Ve vašem moddovaném MissionServer:
modded class MissionServer
{
    override void OnMissionFinish()
    {
        VehicleRegistry.DestroyInstance();
        super.OnMissionFinish();
    }
};
```

### Vzor centralizovaného ukončení

Frameworkový mod může konsolidovat veškerý úklid singletonů do `MyFramework.ShutdownAll()`, který se volá z moddovaného `MissionServer.OnMissionFinish()`. Tím se předejde běžné chybě zapomenutí na jeden singleton:

```c
// Koncepční vzor (centralizované ukončení):
static void ShutdownAll()
{
    MyRPC.Cleanup();
    MyEventBus.Cleanup();
    MyModuleManager.Cleanup();
    MyConfigManager.DestroyInstance();
    MyPermissions.DestroyInstance();
}
```

---

## Kdy použít singletony

### Dobří kandidáti

| Případ použití | Proč singleton funguje |
|----------|-------------------|
| **Manažerské třídy** (LootManager, VehicleManager) | Právě jeden koordinátor pro danou doménu |
| **Cache** (CfgVehicles cache, cache ikon) | Jeden zdroj pravdy zabraňuje redundantním výpočtům |
| **Registry** (registr RPC handlerů, registr modulů) | Centrální vyhledávání musí být globálně přístupné |
| **Držitelé konfigurace** (nastavení serveru, oprávnění) | Jedna konfigurace na mod, načtená jednou z disku |
| **RPC dispatchery** | Jeden vstupní bod pro všechny příchozí RPC |

### Špatní kandidáti

| Případ použití | Proč ne |
|----------|---------|
| **Data pro jednotlivé hráče** | Jedna instance na hráče, ne jedna globální instance |
| **Dočasné výpočty** | Vytvoř, použi, zahoď --- žádný globální stav není potřeba |
| **UI pohledy / dialogy** | Může jich koexistovat více; použijte zásobník pohledů |
| **Komponenty entit** | Připojeny k jednotlivým objektům, nejsou globální |

---

## Příklady z praxe

### COT (Community Online Tools)

COT používá modulový vzor singletonu přes CF framework. Každý nástroj je `JMModuleBase` singleton registrovaný při startu:

```c
// Vzor COT: CF automaticky instanciuje moduly deklarované v config.cpp
class JM_COT_ESP : JMModuleBase
{
    // CF spravuje životní cyklus singletonu
    // Přístup přes: JM_COT_ESP.Cast(GetModuleManager().GetModule(JM_COT_ESP));
}
```

### VPP Admin Tools

VPP používá explicitní `GetInstance()` na manažerských třídách:

```c
// Vzor VPP (zjednodušený)
class VPPATBanManager
{
    private static ref VPPATBanManager m_Instance;

    static VPPATBanManager GetInstance()
    {
        if (!m_Instance)
            m_Instance = new VPPATBanManager();
        return m_Instance;
    }
}
```

### Expansion

Expansion deklaruje singletony pro každý subsystém a napojuje se na životní cyklus mise pro úklid:

```c
// Vzor Expansion (zjednodušený)
class ExpansionMarketModule : CF_ModuleWorld
{
    // CF_ModuleWorld je sám singleton spravovaný modulovým systémem CF
    // ExpansionMarketModule.Cast(CF_ModuleCoreManager.Get(ExpansionMarketModule));
}
```

---

## Úvahy o bezpečnosti vláken

Enforce Script je jednovláknový. Veškeré vykonávání skriptů probíhá na hlavním vlákně v rámci herní smyčky enginu Enfusion. To znamená:

- **Neexistují** žádné race conditions mezi souběžnými vlákny
- **Nepotřebujete** mutexy, zámky ani atomické operace
- `GetInstance()` s línou inicializací je vždy bezpečný

Nicméně **opětovný vstup (re-entrancy)** může stále způsobit problémy. Pokud `GetInstance()` spustí kód, který znovu zavolá `GetInstance()` během konstrukce, můžete získat částečně inicializovaný singleton:

```c
// NEBEZPEČNÉ: opětovně vstupující konstrukce singletonu
class BadManager
{
    private static ref BadManager s_Instance;

    void BadManager()
    {
        // Toto volá GetInstance() během konstrukce!
        OtherSystem.Register(BadManager.GetInstance());
    }

    static BadManager GetInstance()
    {
        if (!s_Instance)
        {
            // s_Instance je zde stále null během konstrukce
            s_Instance = new BadManager();
        }
        return s_Instance;
    }
};
```

Opravou je přiřadit `s_Instance` před spuštěním jakékoli inicializace, která by mohla způsobit opětovný vstup:

```c
static BadManager GetInstance()
{
    if (!s_Instance)
    {
        s_Instance = new BadManager();  // Nejprve přiřadit
        s_Instance.Initialize();         // Poté spustit inicializaci, která může volat GetInstance()
    }
    return s_Instance;
}
```

Nebo ještě lépe, vyhněte se kruhové inicializaci zcela.

---

## Anti-vzory

### 1. Globální měnitelný stav bez zapouzdření

Vzor singleton vám dává globální přístup. To neznamená, že data by měla být globálně zapisovatelná.

```c
// ŠPATNĚ: Veřejná pole zvou k nekontrolované mutaci
class GameState
{
    private static ref GameState s_Instance;
    int PlayerCount;         // Kdokoli může zapisovat
    bool ServerLocked;       // Kdokoli může zapisovat
    string CurrentWeather;   // Kdokoli může zapisovat

    static GameState GetInstance() { ... }
};

// Jakýkoli kód může udělat:
GameState.GetInstance().PlayerCount = -999;  // Chaos
```

```c
// SPRÁVNĚ: Kontrolovaný přístup přes metody
class GameState
{
    private static ref GameState s_Instance;
    protected int m_PlayerCount;
    protected bool m_ServerLocked;

    int GetPlayerCount() { return m_PlayerCount; }

    void IncrementPlayerCount()
    {
        m_PlayerCount++;
    }

    static GameState GetInstance() { ... }
};
```

### 2. Chybějící DestroyInstance

Pokud zapomenete na úklid, singleton přetrvá mezi restarty misí se zastaralými daty:

```c
// ŠPATNĚ: Žádná cesta pro úklid
class ZombieTracker
{
    private static ref ZombieTracker s_Instance;
    ref array<Object> m_TrackedZombies;  // Tyto objekty se smažou na konci mise!

    static ZombieTracker GetInstance() { ... }
    // Žádná DestroyInstance() — m_TrackedZombies nyní drží mrtvé reference
};
```

### 3. Singletony, které vlastní všechno

Když singleton hromadí příliš mnoho zodpovědností, stává se "God objektem", o kterém nelze rozumně uvažovat:

```c
// ŠPATNĚ: Jeden singleton dělá všechno
class ServerManager
{
    // Spravuje loot I vozidla I počasí I spawny I bany A...
    ref array<Object> m_Loot;
    ref array<Object> m_Vehicles;
    ref WeatherData m_Weather;
    ref array<string> m_BannedPlayers;

    void SpawnLoot() { ... }
    void DespawnVehicle() { ... }
    void SetWeather() { ... }
    void BanPlayer() { ... }
    // O 2000 řádků později...
};
```

Rozdělte na zaměřené singletony: `LootManager`, `VehicleManager`, `WeatherManager`, `BanManager`. Každý z nich je malý, testovatelný a má jasnou doménu.

### 4. Přístup k singletonům v konstruktorech jiných singletonů

Toto vytváří skryté závislosti na pořadí inicializace:

```c
// ŠPATNĚ: Konstruktor závisí na jiném singletonu
class ModuleA
{
    void ModuleA()
    {
        // Co když ModuleB ještě nebyl vytvořen?
        ModuleB.GetInstance().Register(this);
    }
};
```

Odložte registraci mezi singletony do `OnInit()` nebo `OnMissionStart()`, kde je pořadí inicializace kontrolováno.

---

## Alternativa: Čistě statické třídy

Některé "singletony" vůbec nepotřebují instanci. Pokud třída nedrží žádný instanční stav a má pouze statické metody a statická pole, přeskočte ceremoniál `GetInstance()` úplně:

```c
// Není potřeba instance — vše statické
class MyLog
{
    private static FileHandle s_LogFile;
    private static int s_LogLevel;

    static void Info(string tag, string msg)
    {
        WriteLog("INFO", tag, msg);
    }

    static void Error(string tag, string msg)
    {
        WriteLog("ERROR", tag, msg);
    }

    static void Cleanup()
    {
        if (s_LogFile) CloseFile(s_LogFile);
        s_LogFile = null;
    }

    private static void WriteLog(string level, string tag, string msg)
    {
        // ...
    }
};
```

Toto je přístup používaný `MyLog`, `MyRPC`, `MyEventBus` a `MyModuleManager` ve frameworkovém modu. Je jednodušší, vyhýbá se režii kontroly null v `GetInstance()` a jasně vyjadřuje záměr: žádná instance neexistuje, pouze sdílený stav.

**Použijte čistě statickou třídu, když:**
- Všechny metody jsou bezstavové nebo operují nad statickými poli
- Neexistuje žádná smysluplná logika konstruktoru/destruktoru
- Nikdy nepotřebujete předat "instanci" jako parametr

**Použijte skutečný singleton, když:**
- Třída má instanční stav, který profituje ze zapouzdření (pole `protected`)
- Potřebujete polymorfismus (bázová třída s přepsanými metodami)
- Objekt musí být předán jiným systémům referencí

---

## Kontrolní seznam

Před nasazením singletonu ověřte:

- [ ] `s_Instance` je deklarován jako `private static ref`
- [ ] `GetInstance()` ošetřuje null případ (líná inicializace) nebo máte explicitní volání `Create()`
- [ ] `DestroyInstance()` existuje a nastavuje `s_Instance = null`
- [ ] `DestroyInstance()` se volá z `OnMissionFinish()` nebo z centralizované metody ukončení
- [ ] Destruktor uklízí vlastněné kolekce (`.Clear()`, nastavení na `null`)
- [ ] Žádná veřejná pole --- veškeré mutace probíhají přes metody
- [ ] Konstruktor nevolá `GetInstance()` na jiných singletonech (odložte do `OnInit()`)

---

## Kompatibilita a dopad

- **Více modů:** Více modů, z nichž každý definuje vlastní singletony, koexistuje bezpečně --- každý má svůj vlastní `s_Instance`. Konflikty vznikají pouze tehdy, když dva mody definují stejný název třídy, což Enforce Script označí jako chybu redefinice při načítání.
- **Pořadí načítání:** Líné singletony nejsou ovlivněny pořadím načítání modů. Eager singletony vytvořené v `OnInit()` závisí na pořadí řetězce `modded class`, které se řídí `config.cpp` `requiredAddons`.
- **Listen Server:** Statická pole jsou sdílena mezi klientským a serverovým kontextem ve stejném procesu. Singleton, který by měl existovat pouze na straně serveru, musí hlídat konstrukci pomocí `GetGame().IsServer()`, jinak bude přístupný (a potenciálně inicializovaný) i z klientského kódu.
- **Výkon:** Přístup k singletonu je statická kontrola null + volání metody --- zanedbatelná režie. Náklady jsou v tom, co singleton *dělá*, ne v přístupu k němu.
- **Migrace:** Singletony přežívají aktualizace verzí DayZ, dokud API, která volají (např. `GetGame()`, `JsonFileLoader`), zůstávají stabilní. Pro samotný vzor není potřeba žádná speciální migrace.

---

## Časté chyby

| Chyba | Dopad | Oprava |
|---------|--------|-----|
| Chybějící volání `DestroyInstance()` v `OnMissionFinish` | Zastaralá data a mrtvé reference na entity se přenášejí mezi restarty misí, což způsobuje pády nebo duchy stavu | Vždy volejte `DestroyInstance()` z `OnMissionFinish` nebo centralizovaného `ShutdownAll()` |
| Volání `GetInstance()` uvnitř konstruktoru jiného singletonu | Spustí opětovně vstupující konstrukci; `s_Instance` je stále null, takže se vytvoří druhá instance | Odložte přístup mezi singletony do metody `Initialize()` volané po konstrukci |
| Použití `public static ref` místo `private static ref` | Jakýkoli kód může nastavit `s_Instance = null` nebo ho nahradit, čímž poruší garanci jedné instance | Vždy deklarujte `s_Instance` jako `private static ref` |
| Nehlídání eager inicializace na listen serverech | Singleton je konstruován dvakrát (jednou ze serverové cesty, jednou z klientské), pokud `Create()` postrádá kontrolu null | Vždy kontrolujte `if (!s_Instance)` uvnitř `Create()` |
| Hromadění stavu bez omezení (neomezené cache) | Paměť roste neomezeně na dlouho běžících serverech; případné OOM nebo vážný lag | Omezte kolekce maximální velikostí nebo periodickým vyčišťováním v `OnUpdate` |

---

## Teorie vs praxe

| Učebnice říká | Realita DayZ |
|---------------|-------------|
| Singletony jsou anti-vzor; použijte dependency injection | Enforce Script nemá DI kontejner. Singletony jsou standardní přístup pro globální manažery napříč všemi hlavními mody. |
| Líná inicializace je vždy dostatečná | RPC handlery musí být registrovány dříve, než se připojí jakýkoli klient, takže eager inicializace v `OnInit()` je často nutná. |
| Singletony by nikdy neměly být zničeny | DayZ mise se restartují bez restartu serverového procesu; singletony *musí* být zničeny a znovu vytvořeny v každém cyklu mise. |

---

[Domů](../README.md) | **Vzor Singleton** | [Další: Systémy modulů >>](02-module-systems.md)
