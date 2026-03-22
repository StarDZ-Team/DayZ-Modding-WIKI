# Rozdział 7.1: Wzorzec Singleton

[Strona główna](../README.md) | **Wzorzec Singleton** | [Dalej: Systemy modułów >>](02-module-systems.md)

---

## Wprowadzenie

Wzorzec singleton gwarantuje, że klasa ma dokładnie jedną instancję, dostępną globalnie. W moddingu DayZ jest to najczęściej spotykany wzorzec architektoniczny --- praktycznie każdy manager, cache, rejestr i podsystem go używa. COT, VPP, Expansion, Dabs Framework i inne mody opierają się na singletonach, aby koordynować stan pomiędzy warstwami skryptów silnika.

Ten rozdział obejmuje kanoniczną implementację, zarządzanie cyklem życia, kiedy wzorzec jest odpowiedni i gdzie może pójść nie tak.

---

## Spis treści

- [Kanoniczna implementacja](#kanoniczna-implementacja)
- [Leniwa vs zachłanna inicjalizacja](#leniwa-vs-zachłanna-inicjalizacja)
- [Zarządzanie cyklem życia](#zarządzanie-cyklem-życia)
- [Kiedy używać singletonów](#kiedy-używać-singletonów)
- [Przykłady z praktyki](#przykłady-z-praktyki)
- [Bezpieczeństwo wątkowe](#bezpieczeństwo-wątkowe)
- [Antywzorce](#antywzorce)
- [Alternatywa: klasy czysto statyczne](#alternatywa-klasy-czysto-statyczne)
- [Lista kontrolna](#lista-kontrolna)

---

## Kanoniczna implementacja

Standardowy singleton DayZ opiera się na prostej formule: pole `private static ref`, statyczny akcesor `GetInstance()` i statyczna metoda `DestroyInstance()` do sprzątania.

```c
class LootManager
{
    // Jedyna instancja. 'ref' utrzymuje ją przy życiu; 'private' zapobiega zewnętrznej modyfikacji.
    private static ref LootManager s_Instance;

    // Prywatne dane należące do singletona
    protected ref map<string, int> m_SpawnCounts;

    // Konstruktor — wywoływany dokładnie raz
    void LootManager()
    {
        m_SpawnCounts = new map<string, int>();
    }

    // Destruktor — wywoływany gdy s_Instance jest ustawiane na null
    void ~LootManager()
    {
        m_SpawnCounts = null;
    }

    // Leniwy akcesor: tworzy przy pierwszym wywołaniu
    static LootManager GetInstance()
    {
        if (!s_Instance)
        {
            s_Instance = new LootManager();
        }
        return s_Instance;
    }

    // Jawne czyszczenie
    static void DestroyInstance()
    {
        s_Instance = null;
    }

    // --- Publiczne API ---

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

### Dlaczego `private static ref`?

| Słowo kluczowe | Cel |
|---------|---------|
| `private` | Zapobiega ustawianiu `s_Instance` na null lub zastępowaniu go przez inne klasy |
| `static` | Współdzielone w całym kodzie --- nie potrzeba instancji aby uzyskać dostęp |
| `ref` | Silna referencja --- utrzymuje obiekt przy życiu dopóki `s_Instance` jest różne od null |

Bez `ref` instancja byłaby słabą referencją i mogłaby zostać usunięta przez garbage collector podczas używania.

---

## Leniwa vs zachłanna inicjalizacja

### Leniwa inicjalizacja (zalecana domyślnie)

Metoda `GetInstance()` tworzy instancję przy pierwszym dostępie. To podejście stosowane przez większość modów DayZ.

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

**Zalety:**
- Żadna praca nie jest wykonywana dopóki nie jest naprawdę potrzebna
- Brak zależności od kolejności inicjalizacji między modami
- Bezpieczne jeśli singleton jest opcjonalny (niektóre konfiguracje serwera mogą go nigdy nie wywołać)

**Wada:**
- Pierwszy wywołujący ponosi koszt konstrukcji (zwykle pomijalny)

### Zachłanna inicjalizacja

Niektóre singletony są tworzone jawnie podczas startu misji, zazwyczaj z `MissionServer.OnInit()` lub metody modułu `OnMissionStart()`.

```c
// W zmoddowanym MissionServer.OnInit():
void OnInit()
{
    super.OnInit();
    LootManager.Create();  // Zachłannie: konstruowany teraz, nie przy pierwszym użyciu
}

// W LootManager:
static void Create()
{
    if (!s_Instance)
    {
        s_Instance = new LootManager();
    }
}
```

**Kiedy preferować zachłanną inicjalizację:**
- Singleton ładuje dane z dysku (konfiguracje, pliki JSON) i chcesz, aby błędy ładowania pojawiły się przy starcie
- Singleton rejestruje handlery RPC, które muszą być na miejscu zanim jakikolwiek klient się połączy
- Kolejność inicjalizacji ma znaczenie i musisz ją jawnie kontrolować

---

## Zarządzanie cyklem życia

Najczęstszym źródłem błędów singletonów w DayZ jest brak czyszczenia przy zakończeniu misji. Serwery DayZ mogą restartować misje bez restartowania procesu, co oznacza, że pola statyczne przeżywają restarty misji. Jeśli nie wyzerujesz `s_Instance` w `OnMissionFinish`, przenosisz nieaktualne referencje, martwe obiekty i osierocone callbacki do następnej misji.

### Kontrakt cyklu życia

```
Start procesu serwera
  └─ MissionServer.OnInit()
       └─ Tworzenie singletonów (zachłannie) lub samodzielne tworzenie (leniwie)
  └─ MissionServer.OnMissionStart()
       └─ Singletony rozpoczynają działanie
  └─ ... serwer działa ...
  └─ MissionServer.OnMissionFinish()
       └─ DestroyInstance() na każdym singletonie
       └─ Wszystkie statyczne ref ustawione na null
  └─ (Misja może się zrestartować)
       └─ Nowe singletony tworzone od nowa
```

### Wzorzec czyszczenia

Zawsze łącz swój singleton z metodą `DestroyInstance()` i wywołuj ją podczas zamykania:

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
        s_Instance = null;  // Zwalnia ref, uruchamia destruktor
    }

    void ~VehicleRegistry()
    {
        if (m_Vehicles) m_Vehicles.Clear();
        m_Vehicles = null;
    }
};

// W zmoddowanym MissionServer:
modded class MissionServer
{
    override void OnMissionFinish()
    {
        VehicleRegistry.DestroyInstance();
        super.OnMissionFinish();
    }
};
```

### Scentralizowane zamykanie

Mod frameworkowy może skonsolidować czyszczenie wszystkich singletonów w `MyFramework.ShutdownAll()`, które jest wywoływane ze zmoddowanego `MissionServer.OnMissionFinish()`. Zapobiega to częstemu błędowi zapomnienia o jednym singletonie:

```c
// Wzorzec koncepcyjny (scentralizowane zamykanie):
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

## Kiedy używać singletonów

### Dobrzy kandydaci

| Przypadek użycia | Dlaczego singleton działa |
|----------|-------------------|
| **Klasy managerów** (LootManager, VehicleManager) | Dokładnie jeden koordynator dla danej domeny |
| **Cache** (cache CfgVehicles, cache ikon) | Jedno źródło prawdy eliminuje zbędne obliczenia |
| **Rejestry** (rejestr handlerów RPC, rejestr modułów) | Centralne wyszukiwanie musi być globalnie dostępne |
| **Pojemniki konfiguracji** (ustawienia serwera, uprawnienia) | Jedna konfiguracja na mod, ładowana raz z dysku |
| **Dyspozytory RPC** | Jeden punkt wejścia dla wszystkich przychodzących RPC |

### Słabi kandydaci

| Przypadek użycia | Dlaczego nie |
|----------|---------|
| **Dane per-gracz** | Jedna instancja na gracza, nie jedna globalna instancja |
| **Tymczasowe obliczenia** | Stwórz, użyj, odrzuć --- nie potrzeba globalnego stanu |
| **Widoki UI / okna dialogowe** | Wiele może współistnieć; użyj stosu widoków |
| **Komponenty encji** | Dołączone do poszczególnych obiektów, nie globalne |

---

## Przykłady z praktyki

### COT (Community Online Tools)

COT używa wzorca singletona opartego na modułach poprzez framework CF. Każde narzędzie jest singletonem `JMModuleBase` zarejestrowanym przy starcie:

```c
// Wzorzec COT: CF automatycznie instancjonuje moduły zadeklarowane w config.cpp
class JM_COT_ESP : JMModuleBase
{
    // CF zarządza cyklem życia singletona
    // Dostęp przez: JM_COT_ESP.Cast(GetModuleManager().GetModule(JM_COT_ESP));
}
```

### VPP Admin Tools

VPP używa jawnego `GetInstance()` na klasach managerów:

```c
// Wzorzec VPP (uproszczony)
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

Expansion deklaruje singletony dla każdego podsystemu i podpina się do cyklu życia misji w celu czyszczenia:

```c
// Wzorzec Expansion (uproszczony)
class ExpansionMarketModule : CF_ModuleWorld
{
    // CF_ModuleWorld sam jest singletonem zarządzanym przez system modułów CF
    // ExpansionMarketModule.Cast(CF_ModuleCoreManager.Get(ExpansionMarketModule));
}
```

---

## Bezpieczeństwo wątkowe

Enforce Script jest jednowątkowy. Całe wykonywanie skryptów odbywa się w głównym wątku w pętli gry silnika Enfusion. Oznacza to:

- **Nie ma wyścigów** między współbieżnymi wątkami
- **Nie potrzebujesz** mutexów, blokad ani operacji atomowych
- `GetInstance()` z leniwą inicjalizacją jest zawsze bezpieczne

Jednak **re-entrancja** wciąż może powodować problemy. Jeśli `GetInstance()` wyzwala kod, który wywołuje `GetInstance()` ponownie podczas konstrukcji, możesz otrzymać częściowo zainicjalizowany singleton:

```c
// NIEBEZPIECZNE: re-entrantna konstrukcja singletona
class BadManager
{
    private static ref BadManager s_Instance;

    void BadManager()
    {
        // To wywołuje GetInstance() podczas konstrukcji!
        OtherSystem.Register(BadManager.GetInstance());
    }

    static BadManager GetInstance()
    {
        if (!s_Instance)
        {
            // s_Instance jest wciąż null tutaj podczas konstrukcji
            s_Instance = new BadManager();
        }
        return s_Instance;
    }
};
```

Rozwiązaniem jest przypisanie `s_Instance` przed uruchomieniem jakiejkolwiek inicjalizacji, która może powodować re-entrancję:

```c
static BadManager GetInstance()
{
    if (!s_Instance)
    {
        s_Instance = new BadManager();  // Najpierw przypisz
        s_Instance.Initialize();         // Potem uruchom inicjalizację, która może wywołać GetInstance()
    }
    return s_Instance;
}
```

Lub jeszcze lepiej, unikaj cyklicznej inicjalizacji całkowicie.

---

## Antywzorce

### 1. Globalny mutowalny stan bez enkapsulacji

Wzorzec singleton daje ci globalny dostęp. To nie oznacza, że dane powinny być globalnie zapisywalne.

```c
// ŹLE: Publiczne pola zapraszają do niekontrolowanej mutacji
class GameState
{
    private static ref GameState s_Instance;
    int PlayerCount;         // Każdy może to zapisać
    bool ServerLocked;       // Każdy może to zapisać
    string CurrentWeather;   // Każdy może to zapisać

    static GameState GetInstance() { ... }
};

// Każdy kod może zrobić:
GameState.GetInstance().PlayerCount = -999;  // Chaos
```

```c
// DOBRZE: Kontrolowany dostęp przez metody
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

### 2. Brak DestroyInstance

Jeśli zapomnisz o czyszczeniu, singleton przetrwa restarty misji z nieaktualnymi danymi:

```c
// ŹLE: Brak ścieżki czyszczenia
class ZombieTracker
{
    private static ref ZombieTracker s_Instance;
    ref array<Object> m_TrackedZombies;  // Te obiekty zostają usunięte przy końcu misji!

    static ZombieTracker GetInstance() { ... }
    // Brak DestroyInstance() — m_TrackedZombies teraz trzyma martwe referencje
};
```

### 3. Singletony, które posiadają wszystko

Gdy singleton akumuluje zbyt wiele odpowiedzialności, staje się "obiektem-bogiem", o którym nie da się racjonalnie myśleć:

```c
// ŹLE: Jeden singleton robiący wszystko
class ServerManager
{
    // Zarządza łupem ORAZ pojazdami ORAZ pogodą ORAZ spawnami ORAZ banami ORAZ...
    ref array<Object> m_Loot;
    ref array<Object> m_Vehicles;
    ref WeatherData m_Weather;
    ref array<string> m_BannedPlayers;

    void SpawnLoot() { ... }
    void DespawnVehicle() { ... }
    void SetWeather() { ... }
    void BanPlayer() { ... }
    // 2000 linii później...
};
```

Podziel na skoncentrowane singletony: `LootManager`, `VehicleManager`, `WeatherManager`, `BanManager`. Każdy jest mały, testowalny i ma jasną domenę.

### 4. Dostęp do singletonów w konstruktorach innych singletonów

To tworzy ukryte zależności kolejności inicjalizacji:

```c
// ŹLE: Konstruktor zależy od innego singletona
class ModuleA
{
    void ModuleA()
    {
        // Co jeśli ModuleB nie został jeszcze utworzony?
        ModuleB.GetInstance().Register(this);
    }
};
```

Odłóż rejestrację między singletonami do `OnInit()` lub `OnMissionStart()`, gdzie kolejność inicjalizacji jest kontrolowana.

---

## Alternatywa: klasy czysto statyczne

Niektóre "singletony" w ogóle nie potrzebują instancji. Jeśli klasa nie przechowuje stanu instancji i ma tylko statyczne metody oraz statyczne pola, pomiń całą ceremonię `GetInstance()`:

```c
// Brak potrzeby instancji — wszystko statyczne
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

To podejście stosowane przez `MyLog`, `MyRPC`, `MyEventBus` i `MyModuleManager` w modzie frameworkowym. Jest prostsze, unika narzutu sprawdzania null w `GetInstance()` i jasno komunikuje intencję: nie ma instancji, tylko współdzielony stan.

**Użyj klasy czysto statycznej gdy:**
- Wszystkie metody są bezstanowe lub operują na polach statycznych
- Nie ma sensownej logiki konstruktora/destruktora
- Nigdy nie musisz przekazywać "instancji" jako parametru

**Użyj prawdziwego singletona gdy:**
- Klasa ma stan instancji, który korzysta z enkapsulacji (pola `protected`)
- Potrzebujesz polimorfizmu (klasa bazowa z nadpisanymi metodami)
- Obiekt musi być przekazywany do innych systemów przez referencję

---

## Lista kontrolna

Przed wdrożeniem singletona zweryfikuj:

- [ ] `s_Instance` jest zadeklarowane jako `private static ref`
- [ ] `GetInstance()` obsługuje przypadek null (leniwa init) lub masz jawne wywołanie `Create()`
- [ ] `DestroyInstance()` istnieje i ustawia `s_Instance = null`
- [ ] `DestroyInstance()` jest wywoływane z `OnMissionFinish()` lub scentralizowanej metody zamykania
- [ ] Destruktor czyści posiadane kolekcje (`.Clear()`, ustawia na `null`)
- [ ] Brak publicznych pól --- cała mutacja przechodzi przez metody
- [ ] Konstruktor nie wywołuje `GetInstance()` na innych singletonach (odłóż do `OnInit()`)

---

## Kompatybilność i wpływ

- **Wielomodowość:** Wiele modów definiujących własne singletony współistnieje bezpiecznie --- każdy ma własne `s_Instance`. Konflikty powstają tylko gdy dwa mody definiują tę samą nazwę klasy, co Enforce Script zasygnalizuje jako błąd redefinicji przy ładowaniu.
- **Kolejność ładowania:** Leniwe singletony nie są zależne od kolejności ładowania modów. Zachłanne singletony tworzone w `OnInit()` zależą od kolejności łańcucha `modded class`, która wynika z `requiredAddons` w `config.cpp`.
- **Listen Server:** Pola statyczne są współdzielone między kontekstami klienta i serwera w tym samym procesie. Singleton, który powinien istnieć tylko po stronie serwera, musi zabezpieczyć konstrukcję sprawdzeniem `GetGame().IsServer()`, w przeciwnym razie będzie dostępny (i potencjalnie zainicjalizowany) z kodu klienta.
- **Wydajność:** Dostęp do singletona to statyczne sprawdzenie null + wywołanie metody --- pomijalny narzut. Koszt leży w tym co singleton *robi*, nie w dostępie do niego.
- **Migracja:** Singletony przeżywają aktualizacje wersji DayZ dopóki API, które wywołują (np. `GetGame()`, `JsonFileLoader`) pozostają stabilne. Dla samego wzorca nie jest potrzebna żadna specjalna migracja.

---

## Częste błędy

| Błąd | Skutek | Rozwiązanie |
|---------|--------|-----|
| Brak wywołania `DestroyInstance()` w `OnMissionFinish` | Nieaktualne dane i martwe referencje encji przenoszą się przez restarty misji, powodując crashe lub ghostowy stan | Zawsze wywołuj `DestroyInstance()` z `OnMissionFinish` lub scentralizowanego `ShutdownAll()` |
| Wywoływanie `GetInstance()` w konstruktorze innego singletona | Wyzwala re-entrantną konstrukcję; `s_Instance` jest wciąż null, więc tworzona jest druga instancja | Odłóż dostęp między singletonami do metody `Initialize()` wywoływanej po konstrukcji |
| Użycie `public static ref` zamiast `private static ref` | Każdy kod może ustawić `s_Instance = null` lub go zastąpić, łamiąc gwarancję jednej instancji | Zawsze deklaruj `s_Instance` jako `private static ref` |
| Brak zabezpieczenia zachłannej inicjalizacji na listen serwerach | Singleton jest konstruowany dwukrotnie (raz ze ścieżki serwera, raz z klienta) jeśli `Create()` nie ma sprawdzenia null | Zawsze sprawdzaj `if (!s_Instance)` wewnątrz `Create()` |
| Akumulowanie stanu bez ograniczeń (nieograniczone cache) | Pamięć rośnie w nieskończoność na długo działających serwerach; ewentualny OOM lub poważne lagi | Ogranicz kolekcje maksymalnym rozmiarem lub okresowym czyszczeniem w `OnUpdate` |

---

## Teoria vs praktyka

| Podręcznik mówi | Rzeczywistość DayZ |
|---------------|-------------|
| Singletony to antywzorzec; użyj wstrzykiwania zależności | Enforce Script nie ma kontenera DI. Singletony to standardowe podejście do globalnych managerów we wszystkich głównych modach. |
| Leniwa inicjalizacja jest zawsze wystarczająca | Handlery RPC muszą być zarejestrowane zanim jakikolwiek klient się połączy, więc zachłanna inicjalizacja w `OnInit()` jest często konieczna. |
| Singletony nie powinny być nigdy niszczone | Misje DayZ restartują się bez restartowania procesu serwera; singletony *muszą* być niszczone i odtwarzane przy każdym cyklu misji. |

---

[Strona główna](../README.md) | **Wzorzec Singleton** | [Dalej: Systemy modułów >>](02-module-systems.md)
