# 7.1. fejezet: Singleton minta

[Kezdőlap](../README.md) | **Singleton minta** | [Következő: Modulrendszerek >>](02-module-systems.md)

---

## Bevezetés

A singleton minta garantálja, hogy egy osztálynak pontosan egy példánya legyen, amely globálisan elérhető. A DayZ modolásban ez a leggyakoribb architekturális minta --- gyakorlatilag minden kezelő, gyorsítótár, regiszter és alrendszer használja. A COT, VPP, Expansion, Dabs Framework és mások mind singletonokra támaszkodnak az állapot koordinálásához a motor szkriptrétegein keresztül.

Ez a fejezet a kanonikus implementációt, az életciklus-kezelést, a minta megfelelő alkalmazási eseteit és a tipikus hibákat tárgyalja.

---

## Tartalomjegyzék

- [A kanonikus implementáció](#a-kanonikus-implementáció)
- [Lusta vs mohó inicializálás](#lusta-vs-mohó-inicializálás)
- [Életciklus-kezelés](#életciklus-kezelés)
- [Mikor használj singletont](#mikor-használj-singletont)
- [Valós példák](#valós-példák)
- [Szálbiztonsági megfontolások](#szálbiztonsági-megfontolások)
- [Anti-minták](#anti-minták)
- [Alternatíva: Csak statikus osztályok](#alternatíva-csak-statikus-osztályok)
- [Ellenőrzőlista](#ellenőrzőlista)

---

## A kanonikus implementáció

A szabványos DayZ singleton egy egyszerű képletet követ: egy `private static ref` mező, egy statikus `GetInstance()` hozzáférő és egy statikus `DestroyInstance()` a takarításhoz.

```c
class LootManager
{
    // Az egyetlen példány. A 'ref' életben tartja; a 'private' megakadályozza a külső módosítást.
    private static ref LootManager s_Instance;

    // A singleton által birtokolt privát adatok
    protected ref map<string, int> m_SpawnCounts;

    // Konstruktor — pontosan egyszer hívódik meg
    void LootManager()
    {
        m_SpawnCounts = new map<string, int>();
    }

    // Destruktor — akkor hívódik, amikor s_Instance null-ra állítódik
    void ~LootManager()
    {
        m_SpawnCounts = null;
    }

    // Lusta hozzáférő: első hívásnál hozza létre
    static LootManager GetInstance()
    {
        if (!s_Instance)
        {
            s_Instance = new LootManager();
        }
        return s_Instance;
    }

    // Explicit leállítás
    static void DestroyInstance()
    {
        s_Instance = null;
    }

    // --- Publikus API ---

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

### Miért `private static ref`?

| Kulcsszó | Cél |
|---------|---------|
| `private` | Megakadályozza, hogy más osztályok `s_Instance`-t null-ra állítsák vagy lecseréljék |
| `static` | Minden kódban megosztott --- nincs szükség példányra az eléréséhez |
| `ref` | Erős referencia --- életben tartja az objektumot, amíg `s_Instance` nem null |

`ref` nélkül a példány gyenge referencia lenne, és szemétgyűjtés áldozata lehetne, miközben még használatban van.

---

## Lusta vs mohó inicializálás

### Lusta inicializálás (ajánlott alapértelmezés)

A `GetInstance()` metódus az első hozzáféréskor hozza létre a példányt. Ezt a megközelítést használja a legtöbb DayZ mod.

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

**Előnyök:**
- Nem végez munkát, amíg ténylegesen nem szükséges
- Nincs függőség a modok közötti inicializálási sorrendtől
- Biztonságos, ha a singleton opcionális (egyes szerver konfigurációk soha nem hívják)

**Hátrány:**
- Az első hívó fizeti az építési költséget (általában elhanyagolható)

### Mohó inicializálás

Egyes singletonok explicit módon a misszió indításakor jönnek létre, jellemzően a `MissionServer.OnInit()` vagy egy modul `OnMissionStart()` metódusából.

```c
// A modolt MissionServer.OnInit()-ben:
void OnInit()
{
    super.OnInit();
    LootManager.Create();  // Mohó: most épül fel, nem az első használatkor
}

// A LootManager-ben:
static void Create()
{
    if (!s_Instance)
    {
        s_Instance = new LootManager();
    }
}
```

**Mikor előnyösebb a mohó:**
- A singleton adatokat tölt be lemezről (konfigok, JSON fájlok) és azt szeretnéd, hogy a betöltési hibák indításkor felszínre kerüljenek
- A singleton RPC kezelőket regisztrál, amelyeknek a helyükön kell lenniük, mielőtt bármely kliens csatlakozna
- Az inicializálási sorrend számít és explicit módon kell vezérelned

---

## Életciklus-kezelés

A DayZ singleton hibák leggyakoribb forrása a misszió végén történő takarítás elmulasztása. A DayZ szerverek újraindíthatják a missziókat a folyamat újraindítása nélkül, ami azt jelenti, hogy a statikus mezők túlélik a misszió újraindításait. Ha nem null-ozod ki az `s_Instance`-t az `OnMissionFinish`-ben, elavult referenciákat, halott objektumokat és árva visszahívásokat viszol át a következő misszióba.

### Az életciklus szerződés

```
Szerver folyamat indítása
  └─ MissionServer.OnInit()
       └─ Singletonok létrehozása (mohó) vagy öninicializálás (lusta)
  └─ MissionServer.OnMissionStart()
       └─ Singletonok működni kezdenek
  └─ ... szerver fut ...
  └─ MissionServer.OnMissionFinish()
       └─ DestroyInstance() minden singletonon
       └─ Minden statikus ref null-ra állítva
  └─ (Misszió újraindulhat)
       └─ Friss singletonok újra létrejönnek
```

### Takarítási minta

Mindig párosítsd a singletonodat egy `DestroyInstance()` metódussal, és hívd meg leállítás során:

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
        s_Instance = null;  // Eldobja a ref-et, a destruktor lefut
    }

    void ~VehicleRegistry()
    {
        if (m_Vehicles) m_Vehicles.Clear();
        m_Vehicles = null;
    }
};

// A modolt MissionServer-ben:
modded class MissionServer
{
    override void OnMissionFinish()
    {
        VehicleRegistry.DestroyInstance();
        super.OnMissionFinish();
    }
};
```

### Centralizált leállítási minta

Egy keretrendszer mod összevonhatja az összes singleton takarítását a `MyFramework.ShutdownAll()` metódusba, amelyet a modolt `MissionServer.OnMissionFinish()` hív meg. Ez megelőzi a gyakori hibát, amikor elfelejtünk egy singletont:

```c
// Koncepcionális minta (centralizált leállítás):
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

## Mikor használj singletont

### Jó jelöltek

| Felhasználási eset | Miért működik a singleton |
|----------|-------------------|
| **Kezelő osztályok** (LootManager, VehicleManager) | Pontosan egy koordinátor egy tartományhoz |
| **Gyorsítótárak** (CfgVehicles cache, ikon cache) | Egyetlen igazságforrás elkerüli a redundáns számítást |
| **Regiszterek** (RPC kezelő regiszter, modul regiszter) | A központi keresőnek globálisan elérhetőnek kell lennie |
| **Konfig tárolók** (szerver beállítások, jogosultságok) | Egy konfig modonként, egyszer betöltve lemezről |
| **RPC diszpécserek** | Egyetlen belépési pont minden bejövő RPC-hez |

### Gyenge jelöltek

| Felhasználási eset | Miért nem |
|----------|---------|
| **Játékosonkénti adatok** | Egy példány játékosonként, nem egy globális példány |
| **Ideiglenes számítások** | Létrehozás, használat, eldobás --- nincs szükség globális állapotra |
| **UI nézetek / dialógusok** | Több is létezhet egyszerre; használd a nézetvermet |
| **Entitás komponensek** | Egyedi objektumokhoz csatoltak, nem globálisak |

---

## Valós példák

### COT (Community Online Tools)

A COT modul-alapú singleton mintát használ a CF keretrendszeren keresztül. Minden eszköz egy `JMModuleBase` singleton, amely indításkor regisztrálódik:

```c
// COT minta: a CF automatikusan példányosítja a config.cpp-ben deklarált modulokat
class JM_COT_ESP : JMModuleBase
{
    // A CF kezeli a singleton életciklusát
    // Elérés: JM_COT_ESP.Cast(GetModuleManager().GetModule(JM_COT_ESP));
}
```

### VPP Admin Tools

A VPP explicit `GetInstance()` metódust használ a kezelő osztályokon:

```c
// VPP minta (egyszerűsítve)
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

Az Expansion singletonokat deklarál minden alrendszerhez és a misszió életciklus hookjába kapcsolódik a takarításhoz:

```c
// Expansion minta (egyszerűsítve)
class ExpansionMarketModule : CF_ModuleWorld
{
    // A CF_ModuleWorld maga is singleton, amelyet a CF modulrendszer kezel
    // ExpansionMarketModule.Cast(CF_ModuleCoreManager.Get(ExpansionMarketModule));
}
```

---

## Szálbiztonsági megfontolások

Az Enforce Script egyszálú. Minden szkriptvégrehajtás a főszálon történik az Enfusion motor játékciklusán belül. Ez azt jelenti:

- **Nincsenek versenyhelyzetek** párhuzamos szálak között
- **Nincs szükség** mutexekre, zárakra vagy atomi műveletekre
- A `GetInstance()` lusta inicializálással mindig biztonságos

Azonban az **újrabejárhatóság** még mindig problémákat okozhat. Ha a `GetInstance()` olyan kódot indít el, amely az építés közben újra hívja a `GetInstance()`-t, részlegesen inicializált singletont kaphatsz:

```c
// VESZÉLYES: újrabejárható singleton építés
class BadManager
{
    private static ref BadManager s_Instance;

    void BadManager()
    {
        // Ez meghívja a GetInstance()-t az építés közben!
        OtherSystem.Register(BadManager.GetInstance());
    }

    static BadManager GetInstance()
    {
        if (!s_Instance)
        {
            // s_Instance még mindig null itt az építés közben
            s_Instance = new BadManager();
        }
        return s_Instance;
    }
};
```

A javítás az `s_Instance` hozzárendelése bármilyen inicializálás futtatása előtt, amely újra bejárhatna:

```c
static BadManager GetInstance()
{
    if (!s_Instance)
    {
        s_Instance = new BadManager();  // Először hozzárendelés
        s_Instance.Initialize();         // Aztán inicializálás, ami hívhatja a GetInstance()-t
    }
    return s_Instance;
}
```

Vagy még jobb: teljesen kerüld a körkörös inicializálást.

---

## Anti-minták

### 1. Globális módosítható állapot beágyazás nélkül

A singleton minta globális hozzáférést ad neked. Ez nem jelenti azt, hogy az adatoknak globálisan írhatónak kellene lenniük.

```c
// ROSSZ: Publikus mezők kontrollálatlan módosításra csábítanak
class GameState
{
    private static ref GameState s_Instance;
    int PlayerCount;         // Bárki írhatja
    bool ServerLocked;       // Bárki írhatja
    string CurrentWeather;   // Bárki írhatja

    static GameState GetInstance() { ... }
};

// Bármely kód megteheti:
GameState.GetInstance().PlayerCount = -999;  // Káosz
```

```c
// JÓ: Kontrollált hozzáférés metódusokon keresztül
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

### 2. Hiányzó DestroyInstance

Ha elfelejtjük a takarítást, a singleton elavult adatokkal megmarad a misszió újraindításokon keresztül:

```c
// ROSSZ: Nincs takarítási útvonal
class ZombieTracker
{
    private static ref ZombieTracker s_Instance;
    ref array<Object> m_TrackedZombies;  // Ezek az objektumok törlődnek a misszió végén!

    static ZombieTracker GetInstance() { ... }
    // Nincs DestroyInstance() — m_TrackedZombies most halott referenciákat tartalmaz
};
```

### 3. Singletonok, amelyek mindent birtokolnak

Amikor egy singleton túl sok felelősséget halmoz fel, "Isten objektummá" válik:

```c
// ROSSZ: Egy singleton csinál mindent
class ServerManager
{
    // Kezeli a zsákmányt ÉS járműveket ÉS időjárást ÉS spawnokat ÉS tiltásokat ÉS...
    ref array<Object> m_Loot;
    ref array<Object> m_Vehicles;
    ref WeatherData m_Weather;
    ref array<string> m_BannedPlayers;

    void SpawnLoot() { ... }
    void DespawnVehicle() { ... }
    void SetWeather() { ... }
    void BanPlayer() { ... }
    // 2000 sorral később...
};
```

Bontsd fókuszált singletonokra: `LootManager`, `VehicleManager`, `WeatherManager`, `BanManager`. Mindegyik kicsi, tesztelhető és egyértelmű tartománnyal rendelkezik.

### 4. Singletonok elérése más singletonok konstruktoraiban

Ez rejtett inicializálási sorrendfüggőségeket hoz létre:

```c
// ROSSZ: A konstruktor másik singletontól függ
class ModuleA
{
    void ModuleA()
    {
        // Mi van, ha a ModuleB még nem jött létre?
        ModuleB.GetInstance().Register(this);
    }
};
```

Halaszd a singleton-ok közötti regisztrációt az `OnInit()` vagy `OnMissionStart()` metódusba, ahol az inicializálási sorrend kontrollált.

---

## Alternatíva: Csak statikus osztályok

Egyes "singletonoknak" egyáltalán nincs szükségük példányra. Ha az osztály nem tart példányállapotot és csak statikus metódusai és statikus mezői vannak, hagyd el teljesen a `GetInstance()` ceremóniát:

```c
// Nincs szükség példányra — minden statikus
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

Ezt a megközelítést használja a `MyLog`, `MyRPC`, `MyEventBus` és `MyModuleManager` egy keretrendszer modban. Egyszerűbb, elkerüli a `GetInstance()` null-ellenőrzés többletterhelését, és egyértelművé teszi a szándékot: nincs példány, csak megosztott állapot.

**Használj csak statikus osztályt, amikor:**
- Minden metódus állapot nélküli vagy statikus mezőkön működik
- Nincs értelmes konstruktor/destruktor logika
- Soha nem kell a "példányt" paraméterként átadni

**Használj valódi singletont, amikor:**
- Az osztálynak van példányállapota, amelynek előnyére válik a beágyazás (`protected` mezők)
- Szükséged van polimorfizmusra (bázis osztály felülírt metódusokkal)
- Az objektumot referencia alapján kell átadni más rendszereknek

---

## Ellenőrzőlista

Szállítás előtt ellenőrizd a singletonnál:

- [ ] `s_Instance` deklarálva `private static ref`-ként
- [ ] `GetInstance()` kezeli a null esetet (lusta init) vagy van explicit `Create()` hívásod
- [ ] `DestroyInstance()` létezik és `s_Instance = null`-ra állít
- [ ] `DestroyInstance()` meghívódik az `OnMissionFinish()` metódusból vagy centralizált leállítási metódusból
- [ ] A destruktor takarítja a birtokolt kollekciókat (`.Clear()`, null-ra állítás)
- [ ] Nincsenek publikus mezők --- minden módosítás metódusokon keresztül történik
- [ ] A konstruktor nem hívja a `GetInstance()`-t más singletonokon (halaszd az `OnInit()`-re)

---

## Kompatibilitás és hatás

- **Több mod:** Több mod, amelyek mindegyike saját singletonokat definiál, biztonságosan együttélnek --- mindegyiknek saját `s_Instance`-a van. Konfliktusok csak akkor merülnek fel, ha két mod azonos osztálynevet definiál, amit az Enforce Script újradefiniálási hibaként jelez betöltéskor.
- **Betöltési sorrend:** A lusta singletonokat nem befolyásolja a mod betöltési sorrend. A mohó singletonok, amelyeket az `OnInit()` metódusban hoztak létre, a `modded class` lánc sorrendjétől függenek, amely a `config.cpp` `requiredAddons` értékét követi.
- **Figyelő szerver:** A statikus mezők megosztottak a kliens és szerver kontextusok között ugyanabban a folyamatban. Egy singleton, amely csak szerver oldalon kellene létezzen, a konstrukciót `GetGame().IsServer()` ellenőrzéssel kell védenie, különben kliens kódból is elérhető (és esetlegesen inicializálható) lesz.
- **Teljesítmény:** A singleton elérés egy statikus null ellenőrzés + metódushívás --- elhanyagolható többletterhelés. A költség abban rejlik, amit a singleton *csinál*, nem az elérésében.
- **Migráció:** A singletonok túlélik a DayZ verziófrissítéseket, amíg az általuk hívott API-k (pl. `GetGame()`, `JsonFileLoader`) stabilak maradnak. Nincs szükség speciális migrációra magához a mintához.

---

## Gyakori hibák

| Hiba | Hatás | Javítás |
|---------|--------|-----|
| Hiányzó `DestroyInstance()` hívás az `OnMissionFinish`-ben | Elavult adatok és halott entitás referenciák kerülnek át a misszió újraindításokon, összeomlásokat vagy szellemállapotot okozva | Mindig hívd a `DestroyInstance()`-t az `OnMissionFinish`-ből vagy centralizált `ShutdownAll()`-ból |
| `GetInstance()` hívása másik singleton konstruktorában | Újrabejárható konstrukciót vált ki; `s_Instance` még mindig null, így második példány jön létre | Halaszd a singleton-ok közötti hozzáférést `Initialize()` metódusra, amelyet a konstrukció után hívnak |
| `public static ref` használata `private static ref` helyett | Bármely kód null-ra állíthatja `s_Instance`-t vagy lecserélheti, megtörve az egypéldányos garanciát | Mindig deklaráld `s_Instance`-t `private static ref`-ként |
| Mohó init nem védett figyelő szervereken | Singleton kétszer épül fel (egyszer szerver útvonalon, egyszer kliens útvonalon), ha `Create()` nem tartalmaz null ellenőrzést | Mindig ellenőrizd `if (!s_Instance)` a `Create()`-ben |
| Állapot korlátlan felhalmozása (korlátlan gyorsítótárak) | Memória végtelenül nő hosszan futó szervereken; végső OOM vagy súlyos lag | Korlátozd a kollekciókat maximális mérettel vagy periodikus kiürítéssel az `OnUpdate`-ben |

---

## Elmélet vs gyakorlat

| A tankönyv szerint | DayZ valóság |
|---------------|-------------|
| A singletonok anti-minták; használj függőséginjektálást | Az Enforce Scriptnek nincs DI konténere. A singletonok a szabványos megközelítés globális kezelőkhöz az összes nagyobb modban. |
| A lusta inicializálás mindig elegendő | Az RPC kezelőket regisztrálni kell, mielőtt bármely kliens csatlakozna, ezért a mohó init az `OnInit()`-ben gyakran szükséges. |
| A singletonokat soha nem szabad megsemmisíteni | A DayZ missziók a szerver folyamat újraindítása nélkül indulnak újra; a singletonokat *meg kell semmisíteni* és újra létre kell hozni minden missziós ciklusban. |

---

[Kezdőlap](../README.md) | **Singleton minta** | [Következő: Modulrendszerek >>](02-module-systems.md)
