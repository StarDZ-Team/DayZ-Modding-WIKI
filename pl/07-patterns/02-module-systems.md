# Rozdział 7.2: Systemy modułów / wtyczek

[Strona główna](../README.md) | [<< Poprzedni: Wzorzec Singleton](01-singletons.md) | **Systemy modułów / wtyczek** | [Dalej: Wzorce RPC >>](03-rpc-patterns.md)

---

## Wprowadzenie

Każdy poważny framework moda DayZ używa systemu modułów lub wtyczek do organizowania kodu w samodzielne jednostki ze zdefiniowanymi hookami cyklu życia. Zamiast rozrzucać logikę inicjalizacji po zmoddowanych klasach misji, moduły rejestrują się w centralnym managerze, który rozsyła zdarzenia cyklu życia --- `OnInit`, `OnMissionStart`, `OnUpdate`, `OnMissionFinish` --- do każdego modułu w przewidywalnej kolejności.

Ten rozdział analizuje cztery podejścia z praktyki: `CF_ModuleCore` z Community Framework, `PluginBase` / `ConfigurablePlugin` z VPP, rejestrację opartą na atrybutach z Dabs Framework oraz własny statyczny manager modułów. Każde rozwiązuje ten sam problem w inny sposób; zrozumienie wszystkich czterech pomoże ci wybrać odpowiedni wzorzec dla twojego moda lub płynnie zintegrować się z istniejącym frameworkiem.

---

## Spis treści

- [Dlaczego moduły?](#dlaczego-moduły)
- [CF_ModuleCore (COT / Expansion)](#cf_modulecore-cot--expansion)
- [VPP PluginBase / ConfigurablePlugin](#vpp-pluginbase--configurableplugin)
- [Dabs — rejestracja oparta na atrybutach](#dabs--rejestracja-oparta-na-atrybutach)
- [Własny statyczny manager modułów](#własny-statyczny-manager-modułów)
- [Cykl życia modułu: uniwersalny kontrakt](#cykl-życia-modułu-uniwersalny-kontrakt)
- [Dobre praktyki projektowania modułów](#dobre-praktyki-projektowania-modułów)
- [Tabela porównawcza](#tabela-porównawcza)

---

## Dlaczego moduły?

Bez systemu modułów mod DayZ zazwyczaj kończy z monolityczną zmoddowaną klasą `MissionServer` lub `MissionGameplay`, która rośnie aż staje się niezarządzalna:

```c
// ŹLE: Wszystko upchane w jednej zmoddowanej klasie
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
        // ... 20 kolejnych systemów
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        TickLootSystem(timeslice);
        TickVehicleTracker(timeslice);
        TickWeatherController(timeslice);
        // ... 20 kolejnych ticków
    }
};
```

System modułów zastępuje to jednym, stabilnym punktem zaczepienia:

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
        MyModuleManager.OnMissionStart();  // Rozsyła do wszystkich modułów
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        MyModuleManager.OnServerUpdate(timeslice);  // Rozsyła do wszystkich modułów
    }
};
```

Każdy moduł to niezależna klasa z własnym plikiem, własnym stanem i własnymi hookami cyklu życia. Dodanie nowej funkcji oznacza dodanie nowego modułu --- nie edycję 3000-linijkowej klasy misji.

---

## CF_ModuleCore (COT / Expansion)

Community Framework (CF) dostarcza najszerzej używany system modułów w ekosystemie moddingu DayZ. Zarówno COT jak i Expansion bazują na nim.

### Jak to działa

1. Deklarujesz klasę modułu rozszerzającą jedną z bazowych klas modułów CF
2. Rejestrujesz ją w `config.cpp` pod `CfgPatches` / `CfgMods`
3. `CF_ModuleCoreManager` z CF automatycznie odkrywa i instancjonuje wszystkie zarejestrowane klasy modułów przy starcie
4. Zdarzenia cyklu życia są rozsyłane automatycznie

### Bazowe klasy modułów

CF dostarcza trzy klasy bazowe odpowiadające warstwom skryptów DayZ:

| Klasa bazowa | Warstwa | Typowe zastosowanie |
|-----------|-------|-------------|
| `CF_ModuleGame` | 3_Game | Wczesna inicjalizacja, rejestracja RPC, klasy danych |
| `CF_ModuleWorld` | 4_World | Interakcja z encjami, systemy rozgrywki |
| `CF_ModuleMission` | 5_Mission | UI, HUD, hooki poziomu misji |

### Przykład: moduł CF

```c
class MyLootModule : CF_ModuleWorld
{
    // CF wywołuje to raz podczas inicjalizacji modułu
    override void OnInit()
    {
        super.OnInit();
        // Rejestracja handlerów RPC, alokacja struktur danych
    }

    // CF wywołuje to gdy misja się rozpoczyna
    override void OnMissionStart(Class sender, CF_EventArgs args)
    {
        super.OnMissionStart(sender, args);
        // Ładowanie konfiguracji, spawn początkowego łupu
    }

    // CF wywołuje to co klatkę na serwerze
    override void OnUpdate(Class sender, CF_EventArgs args)
    {
        super.OnUpdate(sender, args);
        // Tick timerów respawnu łupu
    }

    // CF wywołuje to gdy misja się kończy
    override void OnMissionFinish(Class sender, CF_EventArgs args)
    {
        super.OnMissionFinish(sender, args);
        // Zapis stanu, zwolnienie zasobów
    }
};
```

### Dostęp do modułu CF

```c
// Pobierz referencję do działającego modułu po typie
MyLootModule lootMod;
CF_Modules<MyLootModule>.Get(lootMod);
if (lootMod)
{
    lootMod.ForceRespawn();
}
```

### Kluczowe cechy

- **Automatyczne odkrywanie**: moduły są instancjonowane przez CF na podstawie deklaracji w `config.cpp` --- bez ręcznych wywołań `new`
- **Argumenty zdarzeń**: hooki cyklu życia otrzymują `CF_EventArgs` z danymi kontekstu
- **Zależność od CF**: twój mod wymaga Community Framework jako zależności
- **Szerokie wsparcie**: jeśli twój mod celuje w serwery, które już uruchamiają COT lub Expansion, CF jest już obecny

---

## VPP PluginBase / ConfigurablePlugin

VPP Admin Tools używa architektury wtyczek, gdzie każde narzędzie administracyjne jest klasą wtyczki zarejestrowaną w centralnym managerze.

### Plugin Base

```c
// Wzorzec VPP (uproszczony)
class PluginBase : Managed
{
    void OnInit();
    void OnUpdate(float dt);
    void OnDestroy();

    // Tożsamość wtyczki
    string GetPluginName();
    bool IsServerOnly();
};
```

### ConfigurablePlugin

VPP rozszerza bazę o wariant świadomy konfiguracji, który automatycznie ładuje/zapisuje ustawienia:

```c
class ConfigurablePlugin : PluginBase
{
    // VPP automatycznie ładuje to z JSON przy inicjalizacji
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

### Rejestracja

VPP rejestruje wtyczki w zmoddowanym `MissionServer.OnInit()`:

```c
// Wzorzec VPP
GetPluginManager().RegisterPlugin(new VPPESPPlugin());
GetPluginManager().RegisterPlugin(new VPPTeleportPlugin());
GetPluginManager().RegisterPlugin(new VPPWeatherPlugin());
```

### Kluczowe cechy

- **Ręczna rejestracja**: każda wtyczka jest jawnie tworzona przez `new` i rejestrowana
- **Integracja z konfiguracją**: `ConfigurablePlugin` łączy zarządzanie konfiguracją z cyklem życia modułu
- **Samodzielna**: brak zależności od CF; manager wtyczek VPP jest własnym systemem
- **Jasna własność**: manager wtyczek trzyma `ref` do wszystkich wtyczek, kontrolując ich czas życia

---

## Dabs — rejestracja oparta na atrybutach

Dabs Framework (używany w Dabs Framework Admin Tools) stosuje bardziej nowoczesne podejście: atrybuty w stylu C# do automatycznej rejestracji.

### Koncepcja

Zamiast ręcznie rejestrować moduły, adnotujesz klasę atrybutem, a framework odkrywa ją przy starcie używając refleksji:

```c
// Wzorzec Dabs (koncepcyjny)
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

Atrybut `CF_RegisterModule` mówi managerowi modułów CF, aby automatycznie zinstancjonował tę klasę. Nie potrzeba ręcznego wywołania `Register()`.

### Jak działa odkrywanie

Przy starcie CF skanuje wszystkie załadowane klasy skryptów w poszukiwaniu atrybutu rejestracji. Dla każdego dopasowania tworzy instancję i dodaje ją do managera modułów. Dzieje się to przed wywołaniem `OnInit()` na jakimkolwiek module.

### Kluczowe cechy

- **Zero boilerplate'u**: brak kodu rejestracji w klasach misji
- **Deklaratywne**: sama klasa deklaruje, że jest modułem
- **Wymaga CF**: działa tylko z przetwarzaniem atrybutów Community Framework
- **Odkrywalność**: możesz znaleźć wszystkie moduły szukając atrybutu w bazie kodu

---

## Własny statyczny manager modułów

To podejście używa jawnego wzorca rejestracji ze statyczną klasą managera. Nie ma instancji managera --- składa się wyłącznie ze statycznych metod i statycznego przechowywania. Jest to przydatne gdy chcesz zero zależności od zewnętrznych frameworków.

### Bazowe klasy modułów

```c
// Baza: hooki cyklu życia
class MyModuleBase : Managed
{
    bool IsServer();       // Nadpisz w podklasie
    bool IsClient();       // Nadpisz w podklasie
    string GetModuleName();
    void OnInit();
    void OnMissionStart();
    void OnMissionFinish();
};

// Moduł serwerowy: dodaje OnUpdate + zdarzenia graczy
class MyServerModule : MyModuleBase
{
    void OnUpdate(float dt);
    void OnPlayerConnect(PlayerIdentity identity);
    void OnPlayerDisconnect(PlayerIdentity identity, string uid);
};

// Moduł kliencki: dodaje OnUpdate
class MyClientModule : MyModuleBase
{
    void OnUpdate(float dt);
};
```

### Rejestracja

Moduły rejestrują się jawnie, zazwyczaj ze zmoddowanych klas misji:

```c
// W zmoddowanym MissionServer.OnInit():
MyModuleManager.Register(new MyMissionServerModule());
MyModuleManager.Register(new MyAIServerModule());
```

### Rozsyłanie cyklu życia

Zmoddowane klasy misji wywołują `MyModuleManager` w każdym punkcie cyklu życia:

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

### Bezpieczeństwo na Listen Serverze

Bazowe klasy modułów własnego systemu wymuszają krytyczny niezmiennik: `MyServerModule` zwraca `true` z `IsServer()` i `false` z `IsClient()`, podczas gdy `MyClientModule` robi odwrotnie. Manager używa tych flag, aby uniknąć podwójnego rozsyłania zdarzeń cyklu życia na listen serwerach (gdzie zarówno `MissionServer` jak i `MissionGameplay` działają w tym samym procesie).

Bazowy `MyModuleBase` zwraca `true` z obu --- dlatego baza kodu ostrzega przed bezpośrednim dziedziczeniem z niego.

### Kluczowe cechy

- **Zero zależności**: brak CF, brak zewnętrznych frameworków
- **Statyczny manager**: nie potrzeba `GetInstance()`; czysto statyczne API
- **Jawna rejestracja**: pełna kontrola nad tym co jest rejestrowane i kiedy
- **Bezpieczny dla listen serverów**: typowane podklasy zapobiegają podwójnemu rozsyłaniu
- **Scentralizowane czyszczenie**: `MyModuleManager.Cleanup()` niszczy wszystkie moduły i centralne timery

---

## Cykl życia modułu: uniwersalny kontrakt

Pomimo różnic w implementacji, wszystkie cztery frameworki podążają za tym samym kontraktem cyklu życia:

```
┌─────────────────────────────────────────────────────┐
│  Rejestracja / Odkrywanie                            │
│  Instancja modułu jest tworzona i rejestrowana       │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnInit()                                            │
│  Jednorazowa konfiguracja: alokacja kolekcji,        │
│  rejestracja RPC                                     │
│  Wywoływane raz na moduł po rejestracji              │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnMissionStart()                                    │
│  Misja jest aktywna: ładowanie konfiguracji,         │
│  start timerów, subskrypcja zdarzeń,                 │
│  spawn początkowych encji                            │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnUpdate(float dt)         [powtarzane co klatkę]   │
│  Tick co klatkę: przetwarzanie kolejek,              │
│  aktualizacja timerów, sprawdzanie warunków,         │
│  przesuwanie maszyn stanów                           │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnMissionFinish()                                   │
│  Czyszczenie: zapis stanu, wypisanie ze zdarzeń,     │
│  czyszczenie kolekcji, zerowanie referencji          │
└─────────────────────────────────────────────────────┘
```

### Zasady

1. **OnInit przychodzi przed OnMissionStart.** Nigdy nie ładuj konfiguracji ani nie spawnuj encji w `OnInit()` --- świat może jeszcze nie być gotowy.
2. **OnUpdate otrzymuje delta time.** Zawsze używaj `dt` dla logiki opartej na czasie, nigdy nie zakładaj stałej liczby klatek.
3. **OnMissionFinish musi wyczyścić wszystko.** Każda kolekcja `ref` musi być wyczyszczona. Każda subskrypcja zdarzeń musi być usunięta. Każdy singleton musi być zniszczony. To jedyny niezawodny punkt czyszczenia.
4. **Moduły nie powinny zależeć od kolejności inicjalizacji innych modułów.** Jeśli Moduł A potrzebuje Modułu B, użyj leniwego dostępu (`GetModule()`) zamiast zakładać, że B został zarejestrowany pierwszy.

---

## Dobre praktyki projektowania modułów

### 1. Jeden moduł, jedna odpowiedzialność

Moduł powinien posiadać dokładnie jedną domenę. Jeśli piszesz `VehicleAndWeatherAndLootModule`, podziel go.

```c
// DOBRZE: Skoncentrowane moduły
class MyLootModule : MyServerModule { ... }
class MyVehicleModule : MyServerModule { ... }
class MyWeatherModule : MyServerModule { ... }

// ŹLE: Moduł-bóg
class MyEverythingModule : MyServerModule { ... }
```

### 2. Utrzymuj OnUpdate tani

`OnUpdate` działa co klatkę. Jeśli twój moduł wykonuje kosztowną pracę (I/O plików, skanowanie świata, pathfinding), rób to na timerze lub rozłóż na klatki:

```c
class MyCleanupModule : MyServerModule
{
    protected float m_CleanupTimer;
    protected const float CLEANUP_INTERVAL = 300.0;  // Co 5 minut

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

### 3. Rejestruj RPC w OnInit, nie w OnMissionStart

Handlery RPC muszą być na miejscu zanim jakikolwiek klient wyśle wiadomość. `OnInit()` działa podczas rejestracji modułu, co następuje wcześnie w konfiguracji misji. `OnMissionStart()` może być za późno jeśli klienci łączą się szybko.

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
        // Obsługa RPC
    }
};
```

### 4. Używaj managera modułów do dostępu między modułami

Nie trzymaj bezpośrednich referencji do innych modułów. Używaj wyszukiwania managera:

```c
// DOBRZE: Luźne wiązanie przez managera
MyModuleBase mod = MyModuleManager.GetModule("MyAIServerModule");
MyAIServerModule aiMod;
if (Class.CastTo(aiMod, mod))
{
    aiMod.PauseSpawning();
}

// ŹLE: Bezpośrednia statyczna referencja tworzy twarde wiązanie
MyAIServerModule.s_Instance.PauseSpawning();
```

### 5. Zabezpiecz się przed brakującymi zależnościami

Nie każdy serwer uruchamia każdy mod. Jeśli twój moduł opcjonalnie integruje się z innym modem, użyj sprawdzeń preprocesora:

```c
override void OnMissionStart()
{
    super.OnMissionStart();

    #ifdef MYMOD_AI
    MyEventBus.OnMissionStarted.Insert(OnAIMissionStarted);
    #endif
}
```

### 6. Loguj zdarzenia cyklu życia modułu

Logowanie ułatwia debugowanie. Każdy moduł powinien logować kiedy się inicjalizuje i zamyka:

```c
override void OnInit()
{
    super.OnInit();
    MyLog.Info("MyModule", "Initialized");
}

override void OnMissionFinish()
{
    MyLog.Info("MyModule", "Shutting down");
    // Czyszczenie...
}
```

---

## Tabela porównawcza

| Cecha | CF_ModuleCore | VPP Plugin | Dabs Attribute | Własny moduł |
|---------|--------------|------------|----------------|---------------|
| **Odkrywanie** | config.cpp + auto | Ręczne `Register()` | Skanowanie atrybutów | Ręczne `Register()` |
| **Klasy bazowe** | Game / World / Mission | PluginBase / ConfigurablePlugin | CF_ModuleWorld + atrybut | ServerModule / ClientModule |
| **Zależności** | Wymaga CF | Samodzielny | Wymaga CF | Samodzielny |
| **Bezpieczny dla listen serverów** | CF to obsługuje | Ręczne sprawdzenie | CF to obsługuje | Typowane podklasy |
| **Integracja z konfiguracją** | Oddzielna | Wbudowana w ConfigurablePlugin | Oddzielna | Przez MyConfigManager |
| **Rozsyłanie aktualizacji** | Automatyczne | Manager wywołuje `OnUpdate` | Automatyczne | Manager wywołuje `OnUpdate` |
| **Czyszczenie** | CF to obsługuje | Ręczne `OnDestroy` | CF to obsługuje | `MyModuleManager.Cleanup()` |
| **Dostęp między modami** | `CF_Modules<T>.Get()` | `GetPluginManager().Get()` | `CF_Modules<T>.Get()` | `MyModuleManager.GetModule()` |

Wybierz podejście odpowiadające profilowi zależności twojego moda. Jeśli już zależysz od CF, użyj `CF_ModuleCore`. Jeśli chcesz zero zewnętrznych zależności, zbuduj własny system wzorowany na własnym managerze lub wzorcu VPP.

---

## Kompatybilność i wpływ

- **Wielomodowość:** Wiele modów może rejestrować własne moduły w tym samym managerze (CF, VPP lub własnym). Kolizje nazw zdarzają się tylko gdy dwa mody rejestrują ten sam typ klasy --- używaj unikalnych nazw klas z prefiksem tagu twojego moda.
- **Kolejność ładowania:** CF automatycznie odkrywa moduły z `config.cpp`, więc kolejność ładowania wynika z `requiredAddons`. Własne managery rejestrują moduły w `OnInit()`, gdzie łańcuch `modded class` determinuje kolejność. Moduły nie powinny zależeć od kolejności rejestracji --- używaj wzorców leniwego dostępu.
- **Listen Server:** Na listen serwerach zarówno `MissionServer` jak i `MissionGameplay` działają w tym samym procesie. Jeśli twój manager modułów rozsyła `OnUpdate` z obu, moduły otrzymują podwójne ticki. Używaj typowanych podklas (`ServerModule` / `ClientModule`), które zwracają `IsServer()` lub `IsClient()` aby temu zapobiec.
- **Wydajność:** Rozsyłanie do modułów dodaje jedną iterację pętli na zarejestrowany moduł na wywołanie cyklu życia. Przy 10--20 modułach jest to pomijalne. Upewnij się, że indywidualne metody `OnUpdate` modułów są tanie (patrz Rozdział 7.7).
- **Migracja:** Przy aktualizacji wersji DayZ systemy modułów są stabilne dopóki API klasy bazowej (`CF_ModuleWorld`, `PluginBase`, itp.) się nie zmieni. Przypnij wersję zależności CF, aby uniknąć problemów.

---

## Częste błędy

| Błąd | Skutek | Rozwiązanie |
|---------|--------|-----|
| Brak czyszczenia `OnMissionFinish` w module | Kolekcje, timery i subskrypcje zdarzeń przeżywają restarty misji, powodując nieaktualne dane lub crashe | Nadpisz `OnMissionFinish`, wyczyść wszystkie kolekcje `ref`, wypisz się ze wszystkich zdarzeń |
| Podwójne rozsyłanie zdarzeń cyklu życia na listen serwerach | Moduły serwerowe uruchamiają logikę klienta i odwrotnie; duplikaty spawnów, podwójne wysyłki RPC | Użyj zabezpieczeń `IsServer()` / `IsClient()` lub typowanych podklas modułów wymuszających podział |
| Rejestrowanie RPC w `OnMissionStart` zamiast w `OnInit` | Klienci łączący się podczas konfiguracji misji mogą wysyłać RPC zanim handlery są gotowe --- wiadomości są cicho odrzucane | Zawsze rejestruj handlery RPC w `OnInit()`, które działa podczas rejestracji modułu przed połączeniem jakiegokolwiek klienta |
| Jeden "moduł-bóg" obsługujący wszystko | Niemożliwe do debugowania, testowania czy rozszerzania; konflikty merge'ów gdy wielu programistów nad nim pracuje | Podziel na skoncentrowane moduły z jedną odpowiedzialnością |
| Trzymanie bezpośredniego `ref` do instancji innego modułu | Tworzy twarde wiązanie i potencjalne wycieki pamięci z cykli ref | Użyj wyszukiwania managera modułów (`GetModule()`, `CF_Modules<T>.Get()`) do dostępu między modułami |

---

## Teoria vs praktyka

| Podręcznik mówi | Rzeczywistość DayZ |
|---------------|-------------|
| Odkrywanie modułów powinno być automatyczne przez refleksję | Refleksja Enforce Script jest ograniczona; odkrywanie oparte na `config.cpp` (CF) lub jawne wywołania `Register()` to jedyne niezawodne podejścia |
| Moduły powinny być wymienialne w czasie działania | DayZ nie wspiera przeładowywania skryptów na gorąco; moduły żyją przez cały cykl życia misji |
| Używaj interfejsów do kontraktów modułów | Enforce Script nie ma słowa kluczowego `interface`; używaj wirtualnych metod klasy bazowej (`override`) |
| Wstrzykiwanie zależności rozłącza moduły | Nie istnieje framework DI; używaj wyszukiwania managera i zabezpieczeń `#ifdef` dla opcjonalnych zależności między modami |

---

[Strona główna](../README.md) | [<< Poprzedni: Wzorzec Singleton](01-singletons.md) | **Systemy modułów / wtyczek** | [Dalej: Wzorce RPC >>](03-rpc-patterns.md)
