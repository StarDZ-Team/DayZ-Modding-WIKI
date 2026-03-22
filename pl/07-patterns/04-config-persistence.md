# Rozdział 7.4: Trwałość konfiguracji

[Strona główna](../README.md) | [<< Poprzedni: Wzorce RPC](03-rpc-patterns.md) | **Trwałość konfiguracji** | [Dalej: Systemy uprawnień >>](05-permissions.md)

---

## Wprowadzenie

Prawie każdy mod DayZ musi zapisywać i ładować dane konfiguracyjne: ustawienia serwera, tabele spawnu, listy banów, dane graczy, lokalizacje teleportów. Silnik dostarcza `JsonFileLoader` do prostej serializacji JSON oraz surowe I/O plików (`FileHandle`, `FPrintln`) do wszystkiego innego. Profesjonalne mody nakładają na to wersjonowanie konfiguracji i automatyczną migrację.

Ten rozdział obejmuje standardowe wzorce trwałości konfiguracji, od podstawowego ładowania/zapisu JSON przez systemy migracji wersjonowanej, zarządzanie katalogami i timery automatycznego zapisu.

---

## Spis treści

- [Wzorzec JsonFileLoader](#wzorzec-jsonfileloader)
- [Ręczne zapisywanie JSON (FPrintln)](#ręczne-zapisywanie-json-fprintln)
- [Ścieżka $profile](#ścieżka-profile)
- [Tworzenie katalogów](#tworzenie-katalogów)
- [Klasy danych konfiguracji](#klasy-danych-konfiguracji)
- [Wersjonowanie i migracja konfiguracji](#wersjonowanie-i-migracja-konfiguracji)
- [Timery automatycznego zapisu](#timery-automatycznego-zapisu)
- [Częste błędy](#częste-błędy)
- [Dobre praktyki](#dobre-praktyki)

---

## Wzorzec JsonFileLoader

`JsonFileLoader` to wbudowany serializator silnika. Konwertuje między obiektami Enforce Script a plikami JSON używając refleksji --- czyta publiczne pola twojej klasy i automatycznie mapuje je na klucze JSON.

### Krytyczna pułapka

**`JsonFileLoader<T>.JsonLoadFile()` i `JsonFileLoader<T>.JsonSaveFile()` zwracają `void`.** Nie możesz sprawdzić ich wartości zwrotnej. Nie możesz przypisać ich do `bool`. Nie możesz użyć ich w warunku `if`. To jeden z najczęstszych błędów w moddingu DayZ.

```c
// ŹŁLE — nie skompiluje się
bool success = JsonFileLoader<MyConfig>.JsonLoadFile(path, config);

// ŹŁLE — nie skompiluje się
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, config))
{
    // ...
}

// DOBRZE — wywołaj i potem sprawdź stan obiektu
JsonFileLoader<MyConfig>.JsonLoadFile(path, config);
// Sprawdź czy dane zostały faktycznie wypełnione
if (config.m_ServerName != "")
{
    // Dane załadowane pomyślnie
}
```

### Podstawowe ładowanie/zapis

```c
// Klasa danych — publiczne pola są serializowane do/z JSON
class ServerSettings
{
    string ServerName = "My DayZ Server";
    int MaxPlayers = 60;
    float RestartInterval = 14400.0;
    bool PvPEnabled = true;
};

class SettingsManager
{
    private static const string SETTINGS_PATH = "$profile:MyMod/ServerSettings.json";
    protected ref ServerSettings m_Settings;

    void Load()
    {
        m_Settings = new ServerSettings();

        if (FileExist(SETTINGS_PATH))
        {
            JsonFileLoader<ServerSettings>.JsonLoadFile(SETTINGS_PATH, m_Settings);
        }
        else
        {
            // Pierwsze uruchomienie: zapisz domyślne wartości
            Save();
        }
    }

    void Save()
    {
        JsonFileLoader<ServerSettings>.JsonSaveFile(SETTINGS_PATH, m_Settings);
    }
};
```

### Co jest serializowane

`JsonFileLoader` serializuje **wszystkie publiczne pola** obiektu. Nie serializuje:
- Pól prywatnych lub chronionych
- Metod
- Pól statycznych
- Pól przejściowych/tylko do runtime (nie ma atrybutu `[NonSerialized]` --- użyj modyfikatorów dostępu)

Wynikowy JSON wygląda tak:

```json
{
    "ServerName": "My DayZ Server",
    "MaxPlayers": 60,
    "RestartInterval": 14400.0,
    "PvPEnabled": true
}
```

### Obsługiwane typy pól

| Typ | Reprezentacja JSON |
|------|-------------------|
| `int` | Liczba |
| `float` | Liczba |
| `bool` | `true` / `false` |
| `string` | String |
| `vector` | Tablica 3 liczb |
| `array<T>` | Tablica JSON |
| `map<string, T>` | Obiekt JSON (tylko klucze stringowe) |
| Zagnieżdżona klasa | Zagnieżdżony obiekt JSON |

### Zagnieżdżone obiekty

```c
class SpawnPoint
{
    string Name;
    vector Position;
    float Radius;
};

class SpawnConfig
{
    ref array<ref SpawnPoint> SpawnPoints = new array<ref SpawnPoint>();
};
```

Produkuje:

```json
{
    "SpawnPoints": [
        {
            "Name": "Coast",
            "Position": [13000, 0, 3500],
            "Radius": 100.0
        },
        {
            "Name": "Airfield",
            "Position": [4500, 0, 9500],
            "Radius": 50.0
        }
    ]
}
```

---

## Ręczne zapisywanie JSON (FPrintln)

Czasami `JsonFileLoader` nie jest wystarczająco elastyczny: nie obsługuje tablic typów mieszanych, niestandardowego formatowania ani struktur danych nie będących klasami. W takich przypadkach użyj surowego I/O plików.

### Podstawowy wzorzec

```c
void WriteCustomData(string path, array<string> lines)
{
    FileHandle file = OpenFile(path, FileMode.WRITE);
    if (!file) return;

    FPrintln(file, "{");
    FPrintln(file, "    \"entries\": [");

    for (int i = 0; i < lines.Count(); i++)
    {
        string comma = "";
        if (i < lines.Count() - 1) comma = ",";
        FPrintln(file, "        \"" + lines[i] + "\"" + comma);
    }

    FPrintln(file, "    ]");
    FPrintln(file, "}");

    CloseFile(file);
}
```

### Odczyt surowych plików

```c
void ReadCustomData(string path)
{
    FileHandle file = OpenFile(path, FileMode.READ);
    if (!file) return;

    string line;
    while (FGets(file, line) >= 0)
    {
        line = line.Trim();
        if (line == "") continue;
        // Przetwarzaj linię...
    }

    CloseFile(file);
}
```

### Kiedy używać ręcznego I/O

- Pisanie plików logów (tryb dopisywania)
- Pisanie eksportów CSV lub zwykłego tekstu
- Niestandardowe formatowanie JSON, którego `JsonFileLoader` nie może wyprodukować
- Parsowanie formatów plików nie-JSON (np. pliki `.map` lub `.xml` DayZ)

Dla standardowych plików konfiguracji preferuj `JsonFileLoader`. Jest szybszy w implementacji, mniej podatny na błędy i automatycznie obsługuje zagnieżdżone obiekty.

---

## Ścieżka $profile

DayZ dostarcza prefiks ścieżki `$profile:`, który rozwiązuje się do katalogu profilu serwera (zazwyczaj folder zawierający `DayZServer_x64.exe`, lub ścieżka profilu podana z `-profiles=`).

```c
// Te rozwiązują się do katalogu profilu:
"$profile:MyMod/config.json"       // → C:/DayZServer/MyMod/config.json
"$profile:MyMod/Players/data.json" // → C:/DayZServer/MyMod/Players/data.json
```

### Zawsze używaj $profile

Nigdy nie używaj ścieżek absolutnych. Nigdy nie używaj ścieżek względnych. Zawsze używaj `$profile:` dla każdego pliku, który twój mod tworzy lub czyta w runtime:

```c
// ŹLE: Ścieżka absolutna — nie działa na innej maszynie
const string CONFIG_PATH = "C:/DayZServer/MyMod/config.json";

// ŹLE: Ścieżka względna — zależy od katalogu roboczego, który się zmienia
const string CONFIG_PATH = "MyMod/config.json";

// DOBRZE: $profile rozwiązuje się poprawnie wszędzie
const string CONFIG_PATH = "$profile:MyMod/config.json";
```

### Konwencjonalna struktura katalogów

Większość modów stosuje tę konwencję:

```
$profile:
  └── YourModName/
      ├── Config.json          (główna konfiguracja serwera)
      ├── Permissions.json     (uprawnienia adminów)
      ├── Logs/
      │   └── 2025-01-15.log   (dzienne pliki logów)
      └── Players/
          ├── 76561198xxxxx.json
          └── 76561198yyyyy.json
```

---

## Tworzenie katalogów

Przed zapisem pliku musisz upewnić się, że katalog nadrzędny istnieje. DayZ nie tworzy katalogów automatycznie.

### MakeDirectory

```c
void EnsureDirectories()
{
    string baseDir = "$profile:MyMod";
    if (!FileExist(baseDir))
    {
        MakeDirectory(baseDir);
    }

    string playersDir = baseDir + "/Players";
    if (!FileExist(playersDir))
    {
        MakeDirectory(playersDir);
    }

    string logsDir = baseDir + "/Logs";
    if (!FileExist(logsDir))
    {
        MakeDirectory(logsDir);
    }
}
```

### Ważne: MakeDirectory nie jest rekursywne

`MakeDirectory` tworzy tylko ostatni katalog w ścieżce. Jeśli katalog nadrzędny nie istnieje, zawodzi cicho. Musisz tworzyć każdy poziom:

```c
// ŹŁLE: Nadrzędny "MyMod" jeszcze nie istnieje
MakeDirectory("$profile:MyMod/Data/Players");  // Zawodzi cicho

// DOBRZE: Twórz każdy poziom
MakeDirectory("$profile:MyMod");
MakeDirectory("$profile:MyMod/Data");
MakeDirectory("$profile:MyMod/Data/Players");
```

### Wzorzec stałych dla ścieżek

Mod frameworkowy definiuje wszystkie ścieżki jako stałe w dedykowanej klasie:

```c
class MyModConst
{
    static const string PROFILE_DIR    = "$profile:MyMod";
    static const string CONFIG_DIR     = "$profile:MyMod/Configs";
    static const string LOG_DIR        = "$profile:MyMod/Logs";
    static const string PLAYERS_DIR    = "$profile:MyMod/Players";
    static const string PERMISSIONS_FILE = "$profile:MyMod/Permissions.json";
};
```

To eliminuje duplikację stringów ścieżek w bazie kodu i ułatwia znalezienie każdego pliku, którego dotyka twój mod.

---

## Klasy danych konfiguracji

Dobrze zaprojektowana klasa danych konfiguracji zapewnia domyślne wartości, śledzenie wersji i jasną dokumentację każdego pola.

### Podstawowy wzorzec

```c
class MyModConfig
{
    // Śledzenie wersji do migracji
    int ConfigVersion = 3;

    // Ustawienia rozgrywki z sensownymi domyślnymi wartościami
    bool EnableFeatureX = true;
    int MaxEntities = 50;
    float SpawnRadius = 500.0;
    string WelcomeMessage = "Welcome to the server!";

    // Złożone ustawienia
    ref array<string> AllowedWeapons = new array<string>();
    ref map<string, float> ZoneRadii = new map<string, float>();

    void MyModConfig()
    {
        // Inicjalizuj kolekcje domyślnymi wartościami
        AllowedWeapons.Insert("AK74");
        AllowedWeapons.Insert("M4A1");

        ZoneRadii.Set("safe_zone", 100.0);
        ZoneRadii.Set("pvp_zone", 500.0);
    }
};
```

### Wzorzec refleksyjny ConfigBase

Ten wzorzec używa refleksyjnego systemu konfiguracji, gdzie każda klasa konfiguracji deklaruje swoje pola jako deskryptory. Pozwala to panelowi administracyjnemu na automatyczne generowanie UI dla dowolnej konfiguracji bez zakodowanych na stałe nazw pól:

```c
// Wzorzec koncepcyjny (refleksyjna konfiguracja):
class MyConfigBase
{
    // Każda konfiguracja deklaruje swoją wersję
    int ConfigVersion;
    string ModId;

    // Podklasy nadpisują aby zadeklarować swoje pola
    void Init(string modId)
    {
        ModId = modId;
    }

    // Refleksja: pobierz wszystkie konfigurowalne pola
    array<ref MyConfigField> GetFields();

    // Dynamiczne get/set po nazwie pola (do synchronizacji panelu admina)
    string GetFieldValue(string fieldName);
    void SetFieldValue(string fieldName, string value);

    // Hooki dla niestandardowej logiki przy ładowaniu/zapisie
    void OnAfterLoad() {}
    void OnBeforeSave() {}
};
```

### Wzorzec VPP ConfigurablePlugin

VPP łączy zarządzanie konfiguracją bezpośrednio z cyklem życia wtyczki:

```c
// Wzorzec VPP (uproszczony):
class VPPESPConfig
{
    bool EnableESP = true;
    float MaxDistance = 1000.0;
    int RefreshRate = 5;
};

class VPPESPPlugin : ConfigurablePlugin
{
    ref VPPESPConfig m_ESPConfig;

    override void OnInit()
    {
        m_ESPConfig = new VPPESPConfig();
        // ConfigurablePlugin.LoadConfig() obsługuje ładowanie JSON
        super.OnInit();
    }
};
```

---

## Wersjonowanie i migracja konfiguracji

W miarę ewolucji twojego moda, struktury konfiguracji się zmieniają. Dodajesz pola, usuwasz pola, zmieniasz nazwy pól, zmieniasz domyślne wartości. Bez wersjonowania, użytkownicy ze starymi plikami konfiguracji cicho otrzymają złe wartości lub crashe.

### Pole wersji

Każda klasa konfiguracji powinna mieć integerowe pole wersji:

```c
class MyModConfig
{
    int ConfigVersion = 5;  // Zwiększ gdy struktura się zmieni
    // ...
};
```

### Migracja przy ładowaniu

Przy ładowaniu konfiguracji, porównaj wersję na dysku z aktualną wersją kodu. Jeśli się różnią, uruchom migracje:

```c
void LoadConfig()
{
    MyModConfig config = new MyModConfig();  // Ma aktualne domyślne wartości

    if (FileExist(CONFIG_PATH))
    {
        JsonFileLoader<MyModConfig>.JsonLoadFile(CONFIG_PATH, config);

        if (config.ConfigVersion < CURRENT_VERSION)
        {
            MigrateConfig(config);
            config.ConfigVersion = CURRENT_VERSION;
            SaveConfig(config);  // Zapisz ponownie z zaktualizowaną wersją
        }
    }
    else
    {
        SaveConfig(config);  // Pierwsze uruchomienie: zapisz domyślne
    }

    m_Config = config;
}
```

### Funkcje migracji

```c
static const int CURRENT_VERSION = 5;

void MigrateConfig(MyModConfig config)
{
    // Uruchom każdy krok migracji sekwencyjnie
    if (config.ConfigVersion < 2)
    {
        // v1 → v2: "SpawnDelay" zostało zmienione na "RespawnInterval"
        // Stare pole jest utracone przy ładowaniu; ustaw nową domyślną
        config.RespawnInterval = 300.0;
    }

    if (config.ConfigVersion < 3)
    {
        // v2 → v3: Dodano pole "EnableNotifications"
        config.EnableNotifications = true;
    }

    if (config.ConfigVersion < 4)
    {
        // v3 → v4: Domyślna "MaxZombies" zmieniona ze 100 na 200
        if (config.MaxZombies == 100)
        {
            config.MaxZombies = 200;  // Aktualizuj tylko jeśli użytkownik nie zmienił
        }
    }

    if (config.ConfigVersion < 5)
    {
        // v4 → v5: "DifficultyMode" zmieniono z int na string
        // config.DifficultyMode = "Normal"; // Ustaw nową domyślną
    }

    MyLog.Info("Config", "Migrated config from v"
        + config.ConfigVersion.ToString() + " to v" + CURRENT_VERSION.ToString());
}
```

### Przykład migracji Expansion

Expansion jest znany z agresywnej ewolucji konfiguracji. Niektóre konfiguracje Expansion przeszły przez 17+ wersji. Ich wzorzec:
1. Każdy bump wersji ma dedykowaną funkcję migracji
2. Migracje uruchamiane są w kolejności (1 do 2, potem 2 do 3, potem 3 do 4, itd.)
3. Każda migracja zmienia tylko to co konieczne dla tego kroku wersji
4. Końcowy numer wersji jest zapisywany na dysk po zakończeniu wszystkich migracji

To jest złoty standard wersjonowania konfiguracji w modach DayZ.

---

## Timery automatycznego zapisu

Dla konfiguracji zmieniających się w runtime (edycje admina, akumulacja danych graczy), zaimplementuj timer automatycznego zapisu, aby zapobiec utracie danych przy crashach.

### Automatyczny zapis oparty na timerze

```c
class MyDataManager
{
    protected const float AUTOSAVE_INTERVAL = 300.0;  // 5 minut
    protected float m_AutosaveTimer;
    protected bool m_Dirty;  // Czy dane zmieniły się od ostatniego zapisu?

    void MarkDirty()
    {
        m_Dirty = true;
    }

    void OnUpdate(float dt)
    {
        m_AutosaveTimer += dt;
        if (m_AutosaveTimer >= AUTOSAVE_INTERVAL)
        {
            m_AutosaveTimer = 0;

            if (m_Dirty)
            {
                Save();
                m_Dirty = false;
            }
        }
    }

    void OnMissionFinish()
    {
        // Zawsze zapisz przy zamykaniu, nawet jeśli timer nie zdążył
        if (m_Dirty)
        {
            Save();
            m_Dirty = false;
        }
    }
};
```

### Optymalizacja flagi dirty

Zapisuj na dysk tylko gdy dane faktycznie się zmieniły. I/O plików jest kosztowne. Jeśli nic się nie zmieniło, pomiń zapis:

```c
void UpdateSetting(string key, string value)
{
    if (m_Settings.Get(key) == value) return;  // Brak zmiany, brak zapisu

    m_Settings.Set(key, value);
    MarkDirty();
}
```

### Zapis przy krytycznych zdarzeniach

Oprócz okresowych zapisów, zapisuj natychmiast po krytycznych operacjach:

```c
void BanPlayer(string uid, string reason)
{
    m_BanList.Insert(uid);
    Save();  // Natychmiastowy zapis — bany muszą przetrwać crashe
}
```

---

## Częste błędy

### 1. Traktowanie JsonLoadFile jakby zwracał wartość

```c
// ŹŁLE — nie skompiluje się
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, config)) { ... }
```

`JsonLoadFile` zwraca `void`. Wywołaj go, potem sprawdź stan obiektu.

### 2. Brak sprawdzenia FileExist przed ładowaniem

```c
// ŹŁLE — crash lub pusty obiekt bez diagnostyki
JsonFileLoader<MyConfig>.JsonLoadFile("$profile:MyMod/Config.json", config);

// DOBRZE — sprawdź najpierw, stwórz domyślne jeśli brak
if (!FileExist("$profile:MyMod/Config.json"))
{
    SaveDefaults();
    return;
}
JsonFileLoader<MyConfig>.JsonLoadFile("$profile:MyMod/Config.json", config);
```

### 3. Zapomnienie o tworzeniu katalogów

`JsonSaveFile` zawodzi cicho jeśli katalog nie istnieje. Zawsze upewnij się o katalogach przed zapisem.

### 4. Publiczne pola, których nie zamierzałeś serializować

Każde `public` pole na klasie konfiguracji trafia do JSON. Jeśli masz pola tylko do runtime, zrób je `protected` lub `private`:

```c
class MyConfig
{
    // Te idą do JSON:
    int MaxPlayers = 60;
    string ServerName = "My Server";

    // To NIE idzie do JSON (protected):
    protected bool m_Loaded;
    protected float m_LastSaveTime;
};
```

### 5. Znaki backslash i cudzysłowu w wartościach JSON

CParser Enforce Script ma problemy z `\\` i `\"` w literałach stringowych. Unikaj przechowywania ścieżek z backslashami w konfiguracji. Używaj ukośników:

```c
// ŹLE — backslashe mogą złamać parsowanie
string LogPath = "C:\\DayZ\\Logs\\server.log";

// DOBRZE — ukośniki działają wszędzie
string LogPath = "$profile:MyMod/Logs/server.log";
```

---

## Dobre praktyki

1. **Używaj `$profile:` dla wszystkich ścieżek plików.** Nigdy nie koduj na stałe ścieżek absolutnych.

2. **Twórz katalogi przed zapisem plików.** Sprawdź z `FileExist()`, twórz z `MakeDirectory()`, jeden poziom naraz.

3. **Zawsze zapewniaj domyślne wartości w konstruktorze klasy konfiguracji lub inicjalizatorach pól.** Zapewnia to sensowne konfiguracje przy pierwszym uruchomieniu.

4. **Wersjonuj swoje konfiguracje od pierwszego dnia.** Dodanie pola `ConfigVersion` nic nie kosztuje, a oszczędza godziny debugowania później.

5. **Oddzielaj klasy danych konfiguracji od klas managerów.** Klasa danych to głupi kontener; manager obsługuje logikę ładowania/zapisu/synchronizacji.

6. **Używaj automatycznego zapisu z flagą dirty.** Nie zapisuj na dysk za każdym razem gdy zmienia się wartość --- grupuj zapisy na timerze.

7. **Zapisuj przy zakończeniu misji.** Timer automatycznego zapisu to siatka bezpieczeństwa, nie główny zapis. Zawsze zapisuj podczas `OnMissionFinish()`.

8. **Definiuj stałe ścieżek w jednym miejscu.** Klasa `MyModConst` ze wszystkimi ścieżkami zapobiega duplikacji stringów i czyni zmiany ścieżek trywialnymi.

9. **Loguj operacje ładowania/zapisu.** Przy debugowaniu problemów z konfiguracją, linia logu mówiąca "Loaded config v3 from $profile:MyMod/Config.json" jest bezcenna.

10. **Testuj z usuniętym plikiem konfiguracji.** Twój mod powinien obsługiwać pierwsze uruchomienie elegancko: twórz katalogi, zapisz domyślne, loguj co zrobił.

---

## Kompatybilność i wpływ

- **Wielomodowość:** Każdy mod zapisuje do własnego katalogu `$profile:ModName/`. Konflikty zdarzają się tylko gdy dwa mody używają tej samej nazwy katalogu. Używaj unikalnego, rozpoznawalnego prefiksu dla folderu twojego moda.
- **Kolejność ładowania:** Ładowanie konfiguracji odbywa się w `OnInit` lub `OnMissionStart`, oba kontrolowane przez własny cykl życia moda. Brak problemów z kolejnością ładowania między modami, chyba że dwa mody próbują czytać/pisać ten sam plik (czego nigdy nie powinny robić).
- **Listen Server:** Pliki konfiguracji są tylko po stronie serwera (`$profile:` rozwiązuje się na serwerze). Na listen serwerach kod kliencki technicznie może uzyskać dostęp do `$profile:`, ale konfiguracje powinny być ładowane tylko przez moduły serwerowe, aby uniknąć niejednoznaczności.
- **Wydajność:** `JsonFileLoader` jest synchroniczny i blokuje główny wątek. Dla dużych konfiguracji (100+ KB), ładuj podczas `OnInit` (przed rozpoczęciem rozgrywki). Timery automatycznego zapisu zapobiegają powtórnym zapisom; wzorzec flagi dirty zapewnia, że I/O dysku zachodzi tylko gdy dane faktycznie się zmieniły.
- **Migracja:** Dodawanie nowych pól do klasy konfiguracji jest bezpieczne --- `JsonFileLoader` ignoruje brakujące klucze JSON i zostawia domyślną wartość klasy. Usuwanie lub zmiana nazw pól wymaga kroku migracji wersjonowanej, aby uniknąć cichej utraty danych.

---

## Teoria vs praktyka

| Podręcznik mówi | Rzeczywistość DayZ |
|---------------|-------------|
| Używaj asynchronicznego I/O plików aby uniknąć blokowania | Enforce Script nie ma asynchronicznego I/O plików; wszystkie odczyty/zapisy są synchroniczne. Ładuj przy starcie, zapisuj na timerach. |
| Waliduj JSON schematem | Nie istnieje walidacja schematu JSON; waliduj pola w `OnAfterLoad()` lub z klauzulami zabezpieczającymi po ładowaniu. |
| Używaj bazy danych do danych strukturalnych | Brak dostępu do bazy danych z Enforce Script; pliki JSON w `$profile:` to jedyny mechanizm trwałości. |

---

[Strona główna](../README.md) | [<< Poprzedni: Wzorce RPC](03-rpc-patterns.md) | **Trwałość konfiguracji** | [Dalej: Systemy uprawnień >>](05-permissions.md)
