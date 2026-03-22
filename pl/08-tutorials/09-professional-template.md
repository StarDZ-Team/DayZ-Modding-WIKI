# Rozdział 8.9: Profesjonalny szablon moda

[Strona główna](../README.md) | [<< Poprzedni: Budowanie nakładki HUD](08-hud-overlay.md) | **Profesjonalny szablon moda** | [Dalej: Tworzenie własnego pojazdu >>](10-vehicle-mod.md)

---

> **Podsumowanie:** Ten rozdział dostarcza kompletny, gotowy do produkcji szablon moda z każdym plikiem potrzebnym do profesjonalnego moda DayZ. W przeciwieństwie do [Rozdziału 8.5](05-mod-template.md), który wprowadza startowy szkielet InclementDab, to jest pełnofunkcyjny szablon z systemem konfiguracji, singletonowym menadżerem, RPC klient-serwer, panelem UI, skrótami klawiszowymi, lokalizacją i automatyzacją budowania. Każdy plik jest gotowy do skopiowania i obficie komentowany, aby wyjaśnić **dlaczego** każda linia istnieje.

---

## Spis treści

- [Przegląd](#przegląd)
- [Kompletna struktura katalogów](#kompletna-struktura-katalogów)
- [mod.cpp](#modcpp)
- [config.cpp](#configcpp)
- [Plik stałych (3_Game)](#plik-stałych-3_game)
- [Klasa danych konfiguracji (3_Game)](#klasa-danych-konfiguracji-3_game)
- [Definicje RPC (3_Game)](#definicje-rpc-3_game)
- [Singleton menadżera (4_World)](#singleton-menadżera-4_world)
- [Handler zdarzeń gracza (4_World)](#handler-zdarzeń-gracza-4_world)
- [Hook misji: Serwer (5_Mission)](#hook-misji-serwer-5_mission)
- [Hook misji: Klient (5_Mission)](#hook-misji-klient-5_mission)
- [Skrypt panelu UI (5_Mission)](#skrypt-panelu-ui-5_mission)
- [Plik layoutu](#plik-layoutu)
- [stringtable.csv](#stringtablecsv)
- [Inputs.xml](#inputsxml)
- [Skrypt budowania](#skrypt-budowania)
- [Przewodnik dostosowywania](#przewodnik-dostosowywania)
- [Przewodnik rozszerzania funkcji](#przewodnik-rozszerzania-funkcji)
- [Następne kroki](#następne-kroki)

---

## Przegląd

Mod "Hello World" dowodzi, że łańcuch narzędzi działa. Profesjonalny mod potrzebuje znacznie więcej:

| Zagadnienie | Hello World | Profesjonalny szablon |
|-------------|-------------|----------------------|
| Konfiguracja | Zahardkodowane wartości | Konfiguracja JSON z ładowaniem/zapisem/wartościami domyślnymi |
| Komunikacja | Instrukcje Print | Routowanie ciągów RPC (klient do serwera i z powrotem) |
| Architektura | Jeden plik, jedna funkcja | Singleton menadżera, warstwowe skrypty, czysty cykl życia |
| Interfejs użytkownika | Brak | Panel UI oparty na layoucie z otwieraniem/zamykaniem |
| Przypisanie klawiszy | Brak | Własny skrót klawiszowy w Opcje > Sterowanie |
| Lokalizacja | Brak | stringtable.csv z 13 językami |
| Pipeline budowania | Ręczny Addon Builder | Skrypt batch jednym kliknięciem |
| Czyszczenie | Brak | Prawidłowe zamykanie przy końcu misji, bez wycieków |

Ten szablon daje ci to wszystko od razu. Zmieniasz identyfikatory, usuwasz systemy, których nie potrzebujesz, i zaczynasz budować swoją właściwą funkcję na solidnym fundamencie.

---

## Kompletna struktura katalogów

To jest pełny układ źródeł. Każdy plik wymieniony poniżej jest dostarczony jako kompletny szablon w tym rozdziale.

```
MyProfessionalMod/                          <-- Katalog główny źródeł (na dysku P:)
    mod.cpp                                 <-- Metadane launchera
    Scripts/
        config.cpp                          <-- Rejestracja silnika (CfgPatches + CfgMods)
        Inputs.xml                          <-- Definicje skrótów klawiszowych
        stringtable.csv                     <-- Zlokalizowane ciągi (13 języków)
        3_Game/
            MyMod/
                MyModConstants.c            <-- Enumy, ciąg wersji, współdzielone stałe
                MyModConfig.c               <-- Konfiguracja serializowalna do JSON z wartościami domyślnymi
                MyModRPC.c                  <-- Nazwy tras RPC i rejestracja
        4_World/
            MyMod/
                MyModManager.c              <-- Singleton menadżera (cykl życia, konfiguracja, stan)
                MyModPlayerHandler.c        <-- Hooki połączenia/rozłączenia gracza
        5_Mission/
            MyMod/
                MyModMissionServer.c        <-- modded MissionServer (inicjalizacja/zamykanie serwera)
                MyModMissionClient.c        <-- modded MissionGameplay (inicjalizacja/zamykanie klienta)
                MyModUI.c                   <-- Skrypt panelu UI (otwieranie/zamykanie/wypełnianie)
        GUI/
            layouts/
                MyModPanel.layout           <-- Definicja layoutu UI
    build.bat                               <-- Automatyzacja pakowania PBO

Po zbudowaniu dystrybutowalny folder moda wygląda tak:

@MyProfessionalMod/                         <-- Co trafia na serwer / Workshop
    mod.cpp
    addons/
        MyProfessionalMod_Scripts.pbo       <-- Spakowany ze Scripts/
    keys/
        MyMod.bikey                         <-- Klucz dla podpisanych serwerów
    meta.cpp                                <-- Metadane Workshop (auto-generowane)
```

---

## mod.cpp

Ten plik kontroluje to, co gracze widzą w launcherze DayZ. Umieszczany jest w katalogu głównym moda, **nie** wewnątrz `Scripts/`.

```cpp
// ==========================================================================
// mod.cpp - Tożsamość moda dla launchera DayZ
// Ten plik jest odczytywany przez launcher do wyświetlania informacji o modzie
// na liście modów. NIE jest kompilowany przez silnik skryptowy -- to czyste metadane.
// ==========================================================================

// Nazwa wyświetlana na liście modów launchera i na ekranie modów w grze.
name         = "My Professional Mod";

// Twoje imię lub nazwa zespołu. Wyświetlana w kolumnie "Autor".
author       = "YourName";

// Ciąg wersji semantycznej. Aktualizuj przy każdym wydaniu.
// Launcher wyświetla to, aby gracze wiedzieli, którą wersję mają.
version      = "1.0.0";

// Krótki opis wyświetlany po najechaniu na mod w launcherze.
// Utrzymuj poniżej 200 znaków dla czytelności.
overview     = "A professional mod template with config, RPC, UI, and keybinds.";

// Podpowiedź wyświetlana po najechaniu. Zazwyczaj taka sama jak nazwa moda.
tooltipOwned = "My Professional Mod";

// Opcjonalnie: ścieżka do obrazu podglądu (względna do katalogu głównego moda).
// Zalecany rozmiar: 256x256 lub 512x512, format PAA lub EDDS.
// Zostaw puste, jeśli nie masz jeszcze obrazu.
picture      = "";

// Opcjonalnie: logo wyświetlane w panelu szczegółów moda.
logo         = "";
logoSmall    = "";
logoOver     = "";

// Opcjonalnie: URL otwierany po kliknięciu "Strona internetowa" w launcherze.
action       = "";
actionURL    = "";
```

---

## config.cpp

To jest najważniejszy plik. Rejestruje twój mod w silniku, deklaruje zależności, podłącza warstwy skryptów i opcjonalnie ustawia definicje preprocesora oraz zestawy obrazów.

Umieść go w `Scripts/config.cpp`.

```cpp
// ==========================================================================
// config.cpp - Rejestracja silnika
// Silnik DayZ odczytuje ten plik, aby wiedzieć, co twój mod dostarcza.
// Dwie sekcje mają znaczenie: CfgPatches (graf zależności) i CfgMods (ładowanie skryptów).
// ==========================================================================

// --------------------------------------------------------------------------
// CfgPatches - Deklaracja zależności
// Silnik używa tego do określenia kolejności ładowania. Jeśli twój mod zależy od
// innego moda, wymień klasę CfgPatches tego moda w requiredAddons[].
// --------------------------------------------------------------------------
class CfgPatches
{
    // Nazwa klasy MUSI być globalnie unikalna we wszystkich modach.
    // Konwencja: NazwaModa_Scripts (pasuje do nazwy PBO).
    class MyMod_Scripts
    {
        // units[] i weapons[] deklarują klasy konfiguracji definiowane przez ten addon.
        // Dla modów czysto skryptowych pozostaw puste. Używane przez mody,
        // które definiują nowe przedmioty, bronie lub pojazdy w config.cpp.
        units[] = {};
        weapons[] = {};

        // Minimalna wersja silnika. 0.1 działa dla wszystkich aktualnych wersji DayZ.
        requiredVersion = 0.1;

        // Zależności: wymień nazwy klas CfgPatches z innych modów.
        // "DZ_Data" to gra bazowa -- każdy mod powinien od niego zależeć.
        // Dodaj "CF_Scripts" jeśli używasz Community Framework.
        // Dodaj patche innych modów, jeśli je rozszerzasz.
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

// --------------------------------------------------------------------------
// CfgMods - Rejestracja modułów skryptów
// Informuje silnik, gdzie znajduje się każda warstwa skryptów i jakie definicje ustawić.
// --------------------------------------------------------------------------
class CfgMods
{
    // Nazwa klasy tutaj to wewnętrzny identyfikator twojego moda.
    // NIE musi pasować do CfgPatches -- ale utrzymywanie ich powiązanych
    // ułatwia nawigację po bazie kodu.
    class MyMod
    {
        // dir: nazwa folderu na dysku P: (lub w PBO).
        // Musi dokładnie odpowiadać nazwie twojego folderu głównego.
        dir = "MyProfessionalMod";

        // Nazwa wyświetlana (widoczna w Workbench i niektórych logach silnika).
        name = "My Professional Mod";

        // Autor i opis dla metadanych silnika.
        author = "YourName";
        overview = "Professional mod template";

        // Typ moda. Zawsze "mod" dla modów skryptowych.
        type = "mod";

        // credits: opcjonalna ścieżka do pliku Credits.json.
        // creditsJson = "MyProfessionalMod/Scripts/Credits.json";

        // inputs: ścieżka do twojego Inputs.xml dla własnych skrótów klawiszowych.
        // To MUSI być ustawione tutaj, aby silnik załadował twoje skróty.
        inputs = "MyProfessionalMod/Scripts/Inputs.xml";

        // defines: symbole preprocesora ustawiane gdy twój mod jest załadowany.
        // Inne mody mogą używać #ifdef MYMOD do wykrywania obecności twojego moda
        // i warunkowej kompilacji kodu integracyjnego.
        defines[] = { "MYMOD" };

        // dependencies: w które moduły skryptów vanilla twój mod się wpina.
        // "Game" = 3_Game, "World" = 4_World, "Mission" = 5_Mission.
        // Większość modów potrzebuje wszystkich trzech. Dodaj "Core" tylko jeśli używasz 1_Core.
        dependencies[] =
        {
            "Game", "World", "Mission"
        };

        // defs: mapuje każdy moduł skryptów na jego folder na dysku.
        // Silnik kompiluje wszystkie pliki .c znalezione rekurencyjnie w tych ścieżkach.
        // W Enforce Script nie ma #include -- tak właśnie ładowane są pliki.
        class defs
        {
            // imageSets: rejestruj pliki .imageset do użycia w layoutach.
            // Potrzebne tylko jeśli masz własne ikony/tekstury do UI.
            // Odkomentuj i zaktualizuj ścieżki, jeśli dodajesz imageset.
            //
            // class imageSets
            // {
            //     files[] =
            //     {
            //         "MyProfessionalMod/GUI/imagesets/mymod_icons.imageset"
            //     };
            // };

            // Warstwa Game (3_Game): ładuje się pierwsza.
            // Umieść enumy, stałe, klasy konfiguracji, definicje RPC tutaj.
            // NIE MOŻE odwoływać się do typów z 4_World lub 5_Mission.
            class gameScriptModule
            {
                value = "";
                files[] = { "MyProfessionalMod/Scripts/3_Game" };
            };

            // Warstwa World (4_World): ładuje się druga.
            // Umieść menadżerów, modyfikacje encji, interakcje ze światem tutaj.
            // MOŻE odwoływać się do typów 3_Game. NIE MOŻE do typów 5_Mission.
            class worldScriptModule
            {
                value = "";
                files[] = { "MyProfessionalMod/Scripts/4_World" };
            };

            // Warstwa Mission (5_Mission): ładuje się ostatnia.
            // Umieść hooki misji, panele UI, logikę startu/zamykania tutaj.
            // MOŻE odwoływać się do typów ze wszystkich niższych warstw.
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

## Plik stałych (3_Game)

Umieść w `Scripts/3_Game/MyMod/MyModConstants.c`.

Ten plik definiuje wszystkie współdzielone stałe, enumy i ciąg wersji. Znajduje się w `3_Game`, więc każda wyższa warstwa ma dostęp do tych wartości.

```c
// ==========================================================================
// MyModConstants.c - Współdzielone stałe i enumy
// Warstwa 3_Game: dostępne dla wszystkich wyższych warstw (4_World, 5_Mission).
//
// DLACZEGO ten plik istnieje:
//   Centralizacja stałych zapobiega magicznym liczbom rozrzuconym po plikach.
//   Enumy dają bezpieczeństwo w czasie kompilacji zamiast porównań surowych intów.
//   Ciąg wersji jest definiowany raz i używany w logach i UI.
// ==========================================================================

// ---------------------------------------------------------------------------
// Wersja - aktualizuj przy każdym wydaniu
// ---------------------------------------------------------------------------
const string MYMOD_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Tag logów - prefiks dla wszystkich wiadomości Print/log z tego moda
// Używanie spójnego tagu ułatwia filtrowanie logu skryptów.
// ---------------------------------------------------------------------------
const string MYMOD_TAG = "[MyMod]";

// ---------------------------------------------------------------------------
// Ścieżki plików - scentralizowane, aby literówki były wykrywane w jednym miejscu
// $profile: rozwiązuje się do katalogu profilu serwera w czasie wykonania.
// ---------------------------------------------------------------------------
const string MYMOD_CONFIG_DIR  = "$profile:MyMod";
const string MYMOD_CONFIG_PATH = "$profile:MyMod/config.json";

// ---------------------------------------------------------------------------
// Enum: Tryby funkcji
// Używaj enumów zamiast surowych intów dla czytelności i sprawdzania w czasie kompilacji.
// ---------------------------------------------------------------------------
enum MyModMode
{
    DISABLED = 0,    // Funkcja wyłączona
    PASSIVE  = 1,    // Funkcja działa, ale nie ingeruje
    ACTIVE   = 2     // Funkcja w pełni włączona
};

// ---------------------------------------------------------------------------
// Enum: Typy powiadomień (używane przez UI do wyboru ikony/koloru)
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

## Klasa danych konfiguracji (3_Game)

Umieść w `Scripts/3_Game/MyMod/MyModConfig.c`.

To jest klasa ustawień serializowalna do JSON. Serwer ładuje ją przy starcie. Jeśli plik nie istnieje, używane są wartości domyślne i świeża konfiguracja jest zapisywana na dysk.

```c
// ==========================================================================
// MyModConfig.c - Konfiguracja JSON z wartościami domyślnymi
// Warstwa 3_Game, aby zarówno menadżerowie 4_World, jak i hooki 5_Mission mogli ją czytać.
//
// JAK TO DZIAŁA:
//   JsonFileLoader<MyModConfig> używa wbudowanego serializera JSON
//   Enforce Script. Każde pole z wartością domyślną jest zapisywane do / odczytywane
//   z pliku JSON. Dodanie nowego pola jest bezpieczne -- stare pliki konfiguracji
//   po prostu otrzymują wartość domyślną dla brakujących pól.
//
// PUŁAPKA ENFORCE SCRIPT:
//   JsonFileLoader<T>.JsonLoadFile(path, obj) zwraca VOID.
//   NIE MOŻNA zrobić: if (JsonFileLoader<T>.JsonLoadFile(...)) -- to się nie skompiluje.
//   Zawsze przekazuj wcześniej utworzony obiekt przez referencję.
// ==========================================================================

class MyModConfig
{
    // --- Ustawienia ogólne ---

    // Główny przełącznik: jeśli false, cały mod jest wyłączony.
    bool Enabled = true;

    // Jak często (w sekundach) menadżer uruchamia swój tick aktualizacji.
    // Niższe wartości = szybsza reakcja, ale wyższy koszt CPU.
    float UpdateInterval = 5.0;

    // Maksymalna liczba przedmiotów/encji zarządzanych jednocześnie przez ten mod.
    int MaxItems = 100;

    // Tryb: 0 = DISABLED, 1 = PASSIVE, 2 = ACTIVE (patrz enum MyModMode).
    int Mode = 2;

    // --- Wiadomości ---

    // Wiadomość powitalna wyświetlana graczom po połączeniu.
    // Pusty ciąg = brak wiadomości.
    string WelcomeMessage = "Welcome to the server!";

    // Czy wyświetlać wiadomość powitalną jako powiadomienie czy wiadomość czatu.
    bool WelcomeAsNotification = true;

    // --- Logowanie ---

    // Włącz szczegółowe logowanie debugowe. Wyłącz na serwerach produkcyjnych.
    bool DebugLogging = false;

    // -----------------------------------------------------------------------
    // Load - odczytuje konfigurację z dysku, zwraca instancję z wartościami domyślnymi jeśli brakuje
    // -----------------------------------------------------------------------
    static MyModConfig Load()
    {
        // Zawsze twórz świeżą instancję najpierw. To zapewnia, że wszystkie wartości
        // domyślne są ustawione nawet jeśli plik JSON nie ma niektórych pól (np. po
        // aktualizacji, która dodała nowe ustawienia).
        MyModConfig cfg = new MyModConfig();

        // Sprawdź, czy plik konfiguracji istnieje przed próbą załadowania.
        // Przy pierwszym uruchomieniu nie będzie istnieć -- używamy wartości domyślnych i zapisujemy.
        if (FileExist(MYMOD_CONFIG_PATH))
        {
            // JsonLoadFile wypełnia istniejący obiekt. NIE zwraca
            // nowego obiektu. Pola obecne w JSON nadpisują wartości domyślne;
            // pola brakujące w JSON zachowują swoje wartości domyślne.
            JsonFileLoader<MyModConfig>.JsonLoadFile(MYMOD_CONFIG_PATH, cfg);
        }
        else
        {
            // Pierwsze uruchomienie: zapisz wartości domyślne, aby admin miał plik do edycji.
            cfg.Save();
            Print(MYMOD_TAG + " No config found, created default at: " + MYMOD_CONFIG_PATH);
        }

        return cfg;
    }

    // -----------------------------------------------------------------------
    // Save - zapisuje bieżące wartości na dysk jako sformatowany JSON
    // -----------------------------------------------------------------------
    void Save()
    {
        // Upewnij się, że katalog istnieje. MakeDirectory jest bezpieczne do wywołania
        // nawet jeśli katalog już istnieje.
        if (!FileExist(MYMOD_CONFIG_DIR))
        {
            MakeDirectory(MYMOD_CONFIG_DIR);
        }

        // JsonSaveFile zapisuje wszystkie pola jako obiekt JSON.
        // Plik jest nadpisywany w całości -- nie ma scalania.
        JsonFileLoader<MyModConfig>.JsonSaveFile(MYMOD_CONFIG_PATH, this);
    }
};
```

Wynikowy `config.json` na dysku wygląda tak:

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

Administratorzy edytują ten plik, restartują serwer i nowe wartości obowiązują.

---

## Definicje RPC (3_Game)

Umieść w `Scripts/3_Game/MyMod/MyModRPC.c`.

RPC (Remote Procedure Call) to sposób komunikacji klienta z serwerem w DayZ. Ten plik definiuje nazwy tras i udostępnia metody pomocnicze do rejestracji.

```c
// ==========================================================================
// MyModRPC.c - Definicje tras RPC i helpery
// Warstwa 3_Game: stałe nazw tras muszą być dostępne wszędzie.
//
// JAK RPC DZIAŁA W DAYZ:
//   Silnik udostępnia ScriptRPC i OnRPC do wysyłania/odbierania danych.
//   Wywołujesz GetGame().RPCSingleParam() lub tworzysz ScriptRPC, zapisujesz
//   do niego dane i wysyłasz. Odbiorca czyta dane w tej samej kolejności.
//
//   DayZ używa identyfikatorów liczbowych RPC. Aby uniknąć kolizji między modami,
//   każdy mod powinien wybrać unikalny zakres ID lub używać systemu routowania ciągów.
//   Ten szablon używa jednego unikalnego ID int z prefiksem ciągu
//   do identyfikacji, który handler powinien przetworzyć każdą wiadomość.
//
// WZORZEC:
//   1. Klient chce danych -> wysyła żądanie RPC do serwera
//   2. Serwer przetwarza  -> wysyła odpowiedź RPC z powrotem do klienta
//   3. Klient odbiera     -> aktualizuje UI lub stan
// ==========================================================================

// ---------------------------------------------------------------------------
// ID RPC - wybierz unikalny numer mało prawdopodobny do kolizji z innymi modami.
// Sprawdź wiki społeczności DayZ dla powszechnie używanych zakresów.
// Wbudowane RPC silnika używają niskich numerów (0-1000).
// Konwencja: użyj 5-cyfrowego numeru opartego na haszu nazwy twojego moda.
// ---------------------------------------------------------------------------
const int MYMOD_RPC_ID = 74291;

// ---------------------------------------------------------------------------
// Nazwy tras RPC - identyfikatory ciągów dla każdego punktu końcowego RPC.
// Używanie stałych zapobiega literówkom i umożliwia wyszukiwanie w IDE.
// ---------------------------------------------------------------------------
const string MYMOD_RPC_CONFIG_SYNC     = "MyMod:ConfigSync";
const string MYMOD_RPC_WELCOME         = "MyMod:Welcome";
const string MYMOD_RPC_PLAYER_DATA     = "MyMod:PlayerData";
const string MYMOD_RPC_UI_REQUEST      = "MyMod:UIRequest";
const string MYMOD_RPC_UI_RESPONSE     = "MyMod:UIResponse";

// ---------------------------------------------------------------------------
// MyModRPCHelper - statyczna klasa narzędziowa do wysyłania RPC
// Opakowuje boilerplate tworzenia ScriptRPC, zapisywania ciągu trasy,
// zapisywania ładunku i wywoływania Send().
// ---------------------------------------------------------------------------
class MyModRPCHelper
{
    // Wyślij wiadomość ciągu z serwera do konkretnego klienta.
    // identity: docelowy gracz. null = broadcast do wszystkich.
    // routeName: który handler powinien to przetworzyć (np. MYMOD_RPC_WELCOME).
    // message: ładunek ciągu.
    static void SendStringToClient(PlayerIdentity identity, string routeName, string message)
    {
        // Utwórz obiekt RPC. To jest koperta.
        ScriptRPC rpc = new ScriptRPC();

        // Zapisz nazwę trasy najpierw. Odbiorca czyta to, aby zdecydować,
        // który handler wywołać. Zawsze zapisuj/czytaj w tej samej kolejności.
        rpc.Write(routeName);

        // Zapisz dane ładunku.
        rpc.Write(message);

        // Wyślij do klienta. Parametry:
        //   null    = brak obiektu docelowego (encja gracza nie potrzebna dla własnych RPC)
        //   MYMOD_RPC_ID = nasz unikalny kanał RPC
        //   true    = gwarantowana dostawa (podobna do TCP). Użyj false dla częstych aktualizacji.
        //   identity = klient docelowy. null nadawałoby do WSZYSTKICH klientów.
        rpc.Send(null, MYMOD_RPC_ID, true, identity);
    }

    // Wyślij żądanie z klienta do serwera (bez ładunku, tylko trasa).
    static void SendRequestToServer(string routeName)
    {
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(routeName);
        // Przy wysyłaniu DO serwera, identity jest null (serwer nie ma PlayerIdentity).
        // guaranteed = true zapewnia, że wiadomość dotrze.
        rpc.Send(null, MYMOD_RPC_ID, true, null);
    }
};
```

---

## Singleton menadżera (4_World)

Umieść w `Scripts/4_World/MyMod/MyModManager.c`.

To jest centralny mózg twojego moda po stronie serwera. Posiada konfigurację, przetwarza RPC i uruchamia okresowe aktualizacje.

```c
// ==========================================================================
// MyModManager.c - Serwerowy singleton menadżera
// Warstwa 4_World: może odwoływać się do typów 3_Game (konfiguracja, stałe, RPC).
//
// DLACZEGO singleton:
//   Menadżer potrzebuje dokładnie jednej instancji, która przetrwa przez całą
//   misję. Wiele instancji powodowałoby duplikację przetwarzania i
//   konflikty stanu. Wzorzec singletona gwarantuje jedną instancję
//   i zapewnia globalny dostęp przez GetInstance().
//
// CYKL ŻYCIA:
//   1. MissionServer.OnInit() wywołuje MyModManager.GetInstance().Init()
//   2. Menadżer ładuje konfigurację, rejestruje RPC, uruchamia timery
//   3. Menadżer przetwarza zdarzenia podczas rozgrywki
//   4. MissionServer.OnMissionFinish() wywołuje MyModManager.Cleanup()
//   5. Singleton jest niszczony, wszystkie referencje zwalniane
// ==========================================================================

class MyModManager
{
    // Jedyna instancja. 'ref' oznacza, że ta klasa POSIADA obiekt.
    // Gdy s_Instance jest ustawione na null, obiekt jest niszczony.
    private static ref MyModManager s_Instance;

    // Konfiguracja załadowana z dysku.
    // 'ref' bo menadżer posiada czas życia obiektu konfiguracji.
    protected ref MyModConfig m_Config;

    // Skumulowany czas od ostatniego ticku aktualizacji (sekundy).
    protected float m_TimeSinceUpdate;

    // Śledzenie, czy Init() zostało wywołane pomyślnie.
    protected bool m_Initialized;

    // -----------------------------------------------------------------------
    // Dostęp do singletona
    // -----------------------------------------------------------------------

    static MyModManager GetInstance()
    {
        if (!s_Instance)
        {
            s_Instance = new MyModManager();
        }
        return s_Instance;
    }

    // Wywołaj to przy końcu misji, aby zniszczyć singletona i zwolnić pamięć.
    // Ustawienie s_Instance na null wyzwala destruktor.
    static void Cleanup()
    {
        s_Instance = null;
    }

    // -----------------------------------------------------------------------
    // Cykl życia
    // -----------------------------------------------------------------------

    // Wywoływane raz z MissionServer.OnInit().
    void Init()
    {
        if (m_Initialized) return;

        // Załaduj konfigurację z dysku (lub utwórz wartości domyślne przy pierwszym uruchomieniu).
        m_Config = MyModConfig.Load();

        if (!m_Config.Enabled)
        {
            Print(MYMOD_TAG + " Mod is DISABLED in config. Skipping initialization.");
            return;
        }

        // Zresetuj timer aktualizacji.
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

    // Wywoływane co klatkę z MissionServer.OnUpdate().
    // timeslice to sekundy, które upłynęły od ostatniej klatki.
    void OnUpdate(float timeslice)
    {
        if (!m_Initialized || !m_Config.Enabled) return;

        // Akumuluj czas i przetwarzaj tylko w konfigurowanym interwale.
        // To zapobiega uruchamianiu kosztownej logiki w każdej pojedynczej klatce.
        m_TimeSinceUpdate += timeslice;
        if (m_TimeSinceUpdate < m_Config.UpdateInterval) return;
        m_TimeSinceUpdate = 0;

        // --- Okresowa logika aktualizacji trafia tutaj ---
        // Przykład: iteruj śledzone encje, sprawdzaj warunki itp.
        if (m_Config.DebugLogging)
        {
            Print(MYMOD_TAG + " Periodic update tick");
        }
    }

    // Wywoływane gdy misja się kończy (zamknięcie lub restart serwera).
    void Shutdown()
    {
        if (!m_Initialized) return;

        Print(MYMOD_TAG + " Manager shutting down");

        // Zapisz stan runtime jeśli potrzeba.
        // m_Config.Save();

        m_Initialized = false;
    }

    // -----------------------------------------------------------------------
    // Handlery RPC
    // -----------------------------------------------------------------------

    // Wywoływane gdy klient żąda danych UI.
    // sender: gracz, który wysłał żądanie.
    // ctx: strumień danych (już za nazwą trasy).
    void OnUIRequest(PlayerIdentity sender, ParamsReadContext ctx)
    {
        if (!sender) return;

        if (m_Config.DebugLogging)
        {
            Print(MYMOD_TAG + " UI data requested by: " + sender.GetName());
        }

        // Zbuduj dane odpowiedzi i odeślij je.
        // W prawdziwym modzie zbierałbyś tu rzeczywiste dane.
        string responseData = "Items: " + m_Config.MaxItems.ToString();
        MyModRPCHelper.SendStringToClient(sender, MYMOD_RPC_UI_RESPONSE, responseData);
    }

    // Wywoływane gdy gracz się łączy. Wysyła wiadomość powitalną jeśli skonfigurowana.
    void OnPlayerConnected(PlayerIdentity identity)
    {
        if (!m_Initialized || !m_Config.Enabled) return;
        if (!identity) return;

        // Wyślij wiadomość powitalną jeśli skonfigurowana.
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
    // Akcesory
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

## Handler zdarzeń gracza (4_World)

Umieść w `Scripts/4_World/MyMod/MyModPlayerHandler.c`.

Używa wzorca `modded class` do podpięcia do vanilla `PlayerBase` i wykrywania zdarzeń połączenia/rozłączenia.

```c
// ==========================================================================
// MyModPlayerHandler.c - Hooki cyklu życia gracza
// Warstwa 4_World: modded PlayerBase do przechwytywania połączenia/rozłączenia.
//
// DLACZEGO modded class:
//   DayZ nie ma callbacku zdarzenia "player connected". Standardowy
//   wzorzec to nadpisanie metod na MissionServer (dla nowych połączeń)
//   lub hook do PlayerBase (dla zdarzeń na poziomie encji jak śmierć).
//   Używamy tu modded PlayerBase do zademonstrowania hooków na poziomie encji.
//
// WAŻNE:
//   Zawsze wywołuj super.NazwaMetody() jako pierwsze w nadpisaniach. Nierobienie tego
//   łamie łańcuch zachowań vanilla i inne mody, które również nadpisują
//   tę samą metodę.
// ==========================================================================

modded class PlayerBase
{
    // Śledzenie, czy wysłaliśmy zdarzenie init dla tego gracza.
    // Zapobiega duplikatom przetwarzania jeśli Init() jest wywoływane wielokrotnie.
    protected bool m_MyModPlayerReady;

    // -----------------------------------------------------------------------
    // Wywoływane po pełnym utworzeniu i replikacji encji gracza.
    // Na serwerze to jest moment, gdy gracz jest "gotowy" do odbierania RPC.
    // -----------------------------------------------------------------------
    override void Init()
    {
        super.Init();

        // Uruchamiaj tylko na serwerze. GetGame().IsServer() zwraca true na
        // serwerach dedykowanych i na hoście listen servera.
        if (!GetGame().IsServer()) return;

        // Zabezpieczenie przed podwójną inicjalizacją.
        if (m_MyModPlayerReady) return;
        m_MyModPlayerReady = true;

        // Pobierz tożsamość sieciową gracza.
        // Na serwerze GetIdentity() zwraca obiekt PlayerIdentity
        // zawierający nazwę gracza, Steam ID (PlainId) i UID.
        PlayerIdentity identity = GetIdentity();
        if (!identity) return;

        // Powiadom menadżera, że gracz się połączył.
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.OnPlayerConnected(identity);
        }
    }
};
```

---

## Hook misji: Serwer (5_Mission)

Umieść w `Scripts/5_Mission/MyMod/MyModMissionServer.c`.

Podpina się do `MissionServer` aby inicjalizować i zamykać mod po stronie serwera.

```c
// ==========================================================================
// MyModMissionServer.c - Serwerowe hooki misji
// Warstwa 5_Mission: ostatnia do załadowania, może odwoływać się do wszystkich niższych warstw.
//
// DLACZEGO modded MissionServer:
//   MissionServer jest punktem wejścia dla logiki po stronie serwera. Jego OnInit()
//   wykonuje się raz przy starcie misji (boot serwera). OnMissionFinish()
//   wykonuje się gdy serwer się zamyka lub restartuje. To są właściwe
//   miejsca do ustawiania i zamykania systemów twojego moda.
//
// KOLEJNOŚĆ CYKLU ŻYCIA:
//   1. Silnik ładuje wszystkie warstwy skryptów (3_Game -> 4_World -> 5_Mission)
//   2. Silnik tworzy instancję MissionServer
//   3. OnInit() jest wywoływane -> inicjalizuj tu swoje systemy
//   4. OnMissionStart() jest wywoływane -> świat jest gotowy, gracze mogą dołączać
//   5. OnUpdate() jest wywoływane co klatkę
//   6. OnMissionFinish() jest wywoływane -> serwer się zamyka
// ==========================================================================

modded class MissionServer
{
    // -----------------------------------------------------------------------
    // Inicjalizacja
    // -----------------------------------------------------------------------
    override void OnInit()
    {
        // ZAWSZE wywołuj super jako pierwsze. Inne mody w łańcuchu od tego zależą.
        super.OnInit();

        // Inicjalizuj singletona menadżera. To ładuje konfigurację z dysku,
        // rejestruje handlery RPC i przygotowuje mod do działania.
        MyModManager.GetInstance().Init();

        Print(MYMOD_TAG + " Server mission initialized");
    }

    // -----------------------------------------------------------------------
    // Aktualizacja per klatkę
    // -----------------------------------------------------------------------
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        // Deleguj do menadżera. Menadżer obsługuje własne ograniczanie
        // częstotliwości (UpdateInterval z konfiguracji), więc to jest tanie.
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.OnUpdate(timeslice);
        }
    }

    // -----------------------------------------------------------------------
    // Połączenie gracza - dispatch RPC serwera
    // Wywoływane przez silnik gdy klient wysyła RPC do serwera.
    // -----------------------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        // Obsługuj tylko nasze ID RPC. Wszystkie inne RPC przechodzą dalej.
        if (rpc_type != MYMOD_RPC_ID) return;

        // Odczytaj nazwę trasy (pierwszy ciąg zapisany przez nadawcę).
        string routeName;
        if (!ctx.Read(routeName)) return;

        // Dispatch do właściwego handlera na podstawie nazwy trasy.
        MyModManager mgr = MyModManager.GetInstance();
        if (!mgr) return;

        if (routeName == MYMOD_RPC_UI_REQUEST)
        {
            mgr.OnUIRequest(sender, ctx);
        }
        // Dodawaj więcej tras tutaj w miarę rozwoju moda:
        // else if (routeName == MYMOD_RPC_SOME_OTHER)
        // {
        //     mgr.OnSomeOther(sender, ctx);
        // }
    }

    // -----------------------------------------------------------------------
    // Zamykanie
    // -----------------------------------------------------------------------
    override void OnMissionFinish()
    {
        // Zamknij menadżera przed wywołaniem super.
        // To zapewnia, że nasze czyszczenie wykona się zanim silnik zniszczy
        // infrastrukturę misji.
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.Shutdown();
        }

        // Zniszcz singletona, aby zwolnić pamięć i zapobiec przestarzałemu stanowi
        // jeśli misja się restartuje (np. restart serwera bez zamknięcia procesu).
        MyModManager.Cleanup();

        Print(MYMOD_TAG + " Server mission finished");

        super.OnMissionFinish();
    }
};
```

---

## Hook misji: Klient (5_Mission)

Umieść w `Scripts/5_Mission/MyMod/MyModMissionClient.c`.

Podpina się do `MissionGameplay` dla inicjalizacji po stronie klienta, obsługi wejścia i odbierania RPC.

```c
// ==========================================================================
// MyModMissionClient.c - Klienckie hooki misji
// Warstwa 5_Mission.
//
// DLACZEGO MissionGameplay:
//   Na kliencie MissionGameplay jest aktywną klasą misji podczas
//   rozgrywki. Odbiera OnUpdate() co klatkę (do odpytywania wejścia)
//   i OnRPC() dla przychodzących wiadomości serwera.
//
// UWAGA O LISTEN SERWERACH:
//   Na listen serwerze (host + gra), ZARÓWNO MissionServer jak i
//   MissionGameplay są aktywne. Twój kod klienta będzie działał obok
//   kodu serwera. Zabezpieczaj GetGame().IsClient() lub GetGame().IsServer()
//   jeśli potrzebujesz logiki specyficznej dla strony.
// ==========================================================================

modded class MissionGameplay
{
    // Referencja do panelu UI. null gdy zamknięty.
    protected ref MyModUI m_MyModPanel;

    // Śledzenie stanu inicjalizacji.
    protected bool m_MyModInitialized;

    // -----------------------------------------------------------------------
    // Inicjalizacja
    // -----------------------------------------------------------------------
    override void OnInit()
    {
        super.OnInit();

        m_MyModInitialized = true;

        Print(MYMOD_TAG + " Client mission initialized");
    }

    // -----------------------------------------------------------------------
    // Aktualizacja per klatkę: odpytywanie wejścia i zarządzanie UI
    // -----------------------------------------------------------------------
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (!m_MyModInitialized) return;

        // Odpytuj skrót klawiszowy zdefiniowany w Inputs.xml.
        // GetUApi() zwraca API UserActions.
        // GetInputByName() wyszukuje akcję po nazwie z Inputs.xml.
        // LocalPress() zwraca true w klatce gdy klawisz jest wciśnięty.
        UAInput panelInput = GetUApi().GetInputByName("UAMyModPanel");
        if (panelInput && panelInput.LocalPress())
        {
            TogglePanel();
        }
    }

    // -----------------------------------------------------------------------
    // Odbiornik RPC: obsługuje wiadomości z serwera
    // -----------------------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        // Obsługuj tylko nasze ID RPC.
        if (rpc_type != MYMOD_RPC_ID) return;

        // Odczytaj nazwę trasy.
        string routeName;
        if (!ctx.Read(routeName)) return;

        // Dispatch na podstawie trasy.
        if (routeName == MYMOD_RPC_WELCOME)
        {
            string welcomeMsg;
            if (ctx.Read(welcomeMsg))
            {
                // Wyświetl wiadomość powitalną graczowi.
                // GetGame().GetMission().OnEvent() może pokazać powiadomienia,
                // lub możesz użyć własnego UI. Dla prostoty używamy czatu.
                GetGame().Chat(welcomeMsg, "");
                Print(MYMOD_TAG + " Welcome message: " + welcomeMsg);
            }
        }
        else if (routeName == MYMOD_RPC_UI_RESPONSE)
        {
            string responseData;
            if (ctx.Read(responseData))
            {
                // Aktualizuj panel UI odebranymi danymi.
                if (m_MyModPanel)
                {
                    m_MyModPanel.SetData(responseData);
                }
            }
        }
    }

    // -----------------------------------------------------------------------
    // Przełącznik panelu UI
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
            // Otwieraj tylko jeśli gracz żyje i żadne inne menu nie jest wyświetlane.
            PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
            if (!player || !player.IsAlive()) return;

            UIManager uiMgr = GetGame().GetUIManager();
            if (uiMgr && uiMgr.GetMenu()) return;

            m_MyModPanel = new MyModUI();
            m_MyModPanel.Open();

            // Zażądaj świeżych danych z serwera.
            MyModRPCHelper.SendRequestToServer(MYMOD_RPC_UI_REQUEST);
        }
    }

    // -----------------------------------------------------------------------
    // Zamykanie
    // -----------------------------------------------------------------------
    override void OnMissionFinish()
    {
        // Zamknij i zniszcz panel UI jeśli otwarty.
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

## Skrypt panelu UI (5_Mission)

Umieść w `Scripts/5_Mission/MyMod/MyModUI.c`.

Ten skrypt steruje panelem UI zdefiniowanym w pliku `.layout`. Znajduje referencje widgetów, wypełnia je danymi i obsługuje otwieranie/zamykanie.

```c
// ==========================================================================
// MyModUI.c - Kontroler panelu UI
// Warstwa 5_Mission: może odwoływać się do wszystkich niższych warstw.
//
// JAK DZIAŁA UI DAYZ:
//   1. Plik .layout definiuje hierarchię widgetów (jak HTML).
//   2. Klasa skryptu ładuje layout, znajduje widgety po nazwie i
//      manipuluje nimi (ustawia tekst, pokazuje/ukrywa, reaguje na kliknięcia).
//   3. Skrypt pokazuje/ukrywa główny widget i zarządza fokusem wejścia.
//
// CYKL ŻYCIA WIDGETÓW:
//   GetGame().GetWorkspace().CreateWidgets() ładuje plik layoutu i
//   zwraca główny widget. Następnie używasz FindAnyWidget() do uzyskania
//   referencji do nazwanych widgetów potomnych. Po zakończeniu wywołaj widget.Unlink()
//   aby zniszczyć całe drzewo widgetów.
// ==========================================================================

class MyModUI
{
    // Główny widget panelu (załadowany z .layout).
    protected ref Widget m_Root;

    // Nazwane widgety potomne.
    protected TextWidget m_TitleText;
    protected TextWidget m_DataText;
    protected TextWidget m_VersionText;
    protected ButtonWidget m_CloseButton;

    // Śledzenie stanu.
    protected bool m_IsOpen;

    // -----------------------------------------------------------------------
    // Konstruktor: załaduj layout i znajdź referencje widgetów
    // -----------------------------------------------------------------------
    void MyModUI()
    {
        // CreateWidgets ładuje plik .layout i tworzy instancje wszystkich widgetów.
        // Ścieżka jest relatywna do katalogu głównego moda (tak samo jak ścieżki config.cpp).
        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyProfessionalMod/Scripts/GUI/layouts/MyModPanel.layout"
        );

        // Początkowo ukryty dopóki Open() nie jest wywołane.
        if (m_Root)
        {
            m_Root.Show(false);

            // Znajdź nazwane widgety. Te nazwy MUSZĄ dokładnie odpowiadać nazwom widgetów
            // w pliku .layout (wielkość liter ma znaczenie).
            m_TitleText   = TextWidget.Cast(m_Root.FindAnyWidget("TitleText"));
            m_DataText    = TextWidget.Cast(m_Root.FindAnyWidget("DataText"));
            m_VersionText = TextWidget.Cast(m_Root.FindAnyWidget("VersionText"));
            m_CloseButton = ButtonWidget.Cast(m_Root.FindAnyWidget("CloseButton"));

            // Ustaw treść statyczną.
            if (m_TitleText)
                m_TitleText.SetText("My Professional Mod");

            if (m_VersionText)
                m_VersionText.SetText("v" + MYMOD_VERSION);
        }
    }

    // -----------------------------------------------------------------------
    // Open: pokaż panel i przechwyć wejście
    // -----------------------------------------------------------------------
    void Open()
    {
        if (!m_Root) return;

        m_Root.Show(true);
        m_IsOpen = true;

        // Zablokuj sterowanie graczem, aby WASD nie poruszał postacią
        // gdy panel jest otwarty. To pokazuje kursor.
        GetGame().GetMission().PlayerControlDisable(INPUT_EXCLUDE_ALL);
        GetGame().GetUIManager().ShowUICursor(true);

        Print(MYMOD_TAG + " UI panel opened");
    }

    // -----------------------------------------------------------------------
    // Close: ukryj panel i zwolnij wejście
    // -----------------------------------------------------------------------
    void Close()
    {
        if (!m_Root) return;

        m_Root.Show(false);
        m_IsOpen = false;

        // Ponownie włącz sterowanie graczem.
        GetGame().GetMission().PlayerControlEnable(true);
        GetGame().GetUIManager().ShowUICursor(false);

        Print(MYMOD_TAG + " UI panel closed");
    }

    // -----------------------------------------------------------------------
    // Aktualizacja danych: wywoływane gdy serwer wysyła dane UI
    // -----------------------------------------------------------------------
    void SetData(string data)
    {
        if (m_DataText)
        {
            m_DataText.SetText(data);
        }
    }

    // -----------------------------------------------------------------------
    // Zapytanie o stan
    // -----------------------------------------------------------------------
    bool IsOpen()
    {
        return m_IsOpen;
    }

    // -----------------------------------------------------------------------
    // Destruktor: wyczyść drzewo widgetów
    // -----------------------------------------------------------------------
    void ~MyModUI()
    {
        // Unlink niszczy główny widget i wszystkie jego dzieci.
        // To zwalnia pamięć używaną przez drzewo widgetów.
        if (m_Root)
        {
            m_Root.Unlink();
        }
    }
};
```

---

## Plik layoutu

Umieść w `Scripts/GUI/layouts/MyModPanel.layout`.

Definiuje strukturę wizualną panelu UI. Layouty DayZ używają własnego formatu tekstowego (nie XML).

```
// ==========================================================================
// MyModPanel.layout - Struktura panelu UI
//
// ZASADY WYMIAROWANIA:
//   hexactsize 1 + vexactsize 1 = rozmiar w pikselach (np. size 400 300)
//   hexactsize 0 + vexactsize 0 = rozmiar proporcjonalny (0.0 do 1.0)
//   halign/valign kontrolują punkt zakotwiczenia:
//     left_ref/top_ref     = zakotwiczony do lewej/górnej krawędzi rodzica
//     center_ref           = wycentrowany w rodzicu
//     right_ref/bottom_ref = zakotwiczony do prawej/dolnej krawędzi rodzica
//
// WAŻNE:
//   - Nigdy nie używaj ujemnych rozmiarów. Zamiast tego użyj wyrównania i pozycji.
//   - Nazwy widgetów muszą dokładnie odpowiadać wywołaniom FindAnyWidget() w skrypcie.
//   - 'ignorepointer 1' oznacza, że widget nie odbiera kliknięć myszy.
//   - 'scriptclass' łączy widget z klasą skryptu do obsługi zdarzeń.
// ==========================================================================

// Główny panel: wycentrowany na ekranie, 400x300 pikseli, półprzezroczyste tło.
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
  // Pasek tytułu: pełna szerokość, 36px wysokości, na górze.
  PanelWidgetClass TitleBar {
   position 0 0
   size 1 36
   hexactpos 1
   vexactpos 1
   hexactsize 0
   vexactsize 1
   color 0.15 0.15 0.18 1
   {
    // Tekst tytułu: wyrównany do lewej z paddingiem.
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
    // Tekst wersji: prawa strona paska tytułu.
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
  // Obszar treści: poniżej paska tytułu, wypełnia pozostałą przestrzeń.
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
    // Tekst danych: gdzie wyświetlane są dane serwera.
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
  // Przycisk zamykania: prawy dolny róg.
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

Umieść w `Scripts/stringtable.csv`.

Zapewnia lokalizację dla wszystkich tekstów widocznych dla gracza. Silnik odczytuje kolumnę odpowiadającą językowi gry gracza. Kolumna `original` jest zapasowa.

DayZ obsługuje 13 kolumn językowych. Każdy wiersz musi mieć wszystkie 13 kolumn (użyj tekstu angielskiego jako zastępnika dla języków, których nie tłumaczysz).

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_INPUT_GROUP","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod",
"STR_MYMOD_INPUT_PANEL","Open Panel","Open Panel","Otevrit Panel","Panel offnen","Otkryt Panel","Otworz Panel","Panel megnyitasa","Apri Pannello","Abrir Panel","Ouvrir Panneau","Open Panel","Open Panel","Abrir Painel","Open Panel",
"STR_MYMOD_TITLE","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod",
"STR_MYMOD_CLOSE","Close","Close","Zavrit","Schliessen","Zakryt","Zamknij","Bezaras","Chiudi","Cerrar","Fermer","Close","Close","Fechar","Close",
"STR_MYMOD_WELCOME","Welcome!","Welcome!","Vitejte!","Willkommen!","Dobro pozhalovat!","Witaj!","Udvozoljuk!","Benvenuto!","Bienvenido!","Bienvenue!","Welcome!","Welcome!","Bem-vindo!","Welcome!",
```

**Ważne:** Każda linia musi kończyć się przecinkiem końcowym po ostatniej kolumnie językowej. To jest wymaganie parsera CSV DayZ.

---

## Inputs.xml

Umieść w `Scripts/Inputs.xml`.

Definiuje własne skróty klawiszowe, które pojawiają się w menu Opcje > Sterowanie gry. Pole `inputs` w `config.cpp` CfgMods musi wskazywać na ten plik.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<!--
    Inputs.xml - Definicje własnych skrótów klawiszowych

    STRUKTURA:
    - <actions>:  deklaruje nazwy akcji wejścia i ich ciągi wyświetlane
    - <sorting>:  grupuje akcje pod kategorią w menu Sterowanie
    - <preset>:   ustawia domyślne przypisanie klawiszy

    KONWENCJA NAZEWNICTWA:
    - Nazwy akcji zaczynają się od "UA" (User Action) i następuje prefiks twojego moda.
    - Atrybut "loc" odwołuje się do klucza ciągu ze stringtable.csv.

    NAZWY KLAWISZY:
    - Klawiatura: kA do kZ, k0-k9, kInsert, kHome, kEnd, kDelete,
      kNumpad0-kNumpad9, kF1-kF12, kLControl, kRControl, kLShift, kRShift,
      kLAlt, kRAlt, kSpace, kReturn, kBack, kTab, kEscape
    - Mysz: mouse1 (lewy), mouse2 (prawy), mouse3 (środkowy)
    - Klawisze combo: użyj elementu <combo> z wieloma dziećmi <btn>
-->
<modded_inputs>
    <inputs>
        <!-- Deklaruj akcję wejścia. -->
        <actions>
            <input name="UAMyModPanel" loc="STR_MYMOD_INPUT_PANEL" />
        </actions>

        <!-- Grupuj pod kategorią w Opcje > Sterowanie. -->
        <!-- "name" to wewnętrzny ID; "loc" to nazwa wyświetlana ze stringtable. -->
        <sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
            <input name="UAMyModPanel"/>
        </sorting>
    </inputs>

    <!-- Domyślny preset klawiszy. Gracze mogą zmienić przypisanie w Opcje > Sterowanie. -->
    <preset>
        <!-- Domyślnie przypisz do klawisza Home. -->
        <input name="UAMyModPanel">
            <btn name="kHome"/>
        </input>

        <!--
        PRZYKŁAD KLAWISZA COMBO (odkomentuj aby użyć):
        Przypisałoby to do Ctrl+H zamiast jednego klawisza.
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

## Skrypt budowania

Umieść w `build.bat` w katalogu głównym moda.

Ten plik batch automatyzuje pakowanie PBO używając Addon Buildera z DayZ Tools.

```batch
@echo off
REM ==========================================================================
REM build.bat - Automatyczne pakowanie PBO dla MyProfessionalMod
REM
REM CO TO ROBI:
REM   1. Pakuje folder Scripts/ do pliku PBO
REM   2. Umieszcza PBO w dystrybutowalnym folderze @mod
REM   3. Kopiuje mod.cpp do folderu dystrybutowalnego
REM
REM WYMAGANIA:
REM   - DayZ Tools zainstalowane przez Steam
REM   - Źródła moda na P:\MyProfessionalMod\
REM
REM UŻYCIE:
REM   Kliknij dwukrotnie ten plik lub uruchom z linii komend: build.bat
REM ==========================================================================

REM --- Konfiguracja: zaktualizuj te ścieżki do swojej instalacji ---

REM Ścieżka do DayZ Tools (sprawdź ścieżkę swojej biblioteki Steam).
set DAYZ_TOOLS=C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools

REM Folder źródłowy: katalog Scripts, który zostanie spakowany do PBO.
set SOURCE=P:\MyProfessionalMod\Scripts

REM Folder wyjściowy: gdzie trafia spakowane PBO.
set OUTPUT=P:\@MyProfessionalMod\addons

REM Prefiks: wirtualna ścieżka wewnątrz PBO. Musi odpowiadać ścieżkom
REM w config.cpp (np. "MyProfessionalMod/Scripts/3_Game" musi się rozwiązywać).
set PREFIX=MyProfessionalMod\Scripts

REM --- Kroki budowania ---

echo ============================================
echo  Building MyProfessionalMod
echo ============================================

REM Utwórz katalog wyjściowy jeśli nie istnieje.
if not exist "%OUTPUT%" mkdir "%OUTPUT%"

REM Uruchom Addon Builder.
REM   -clear  = usuń stare PBO przed pakowaniem
REM   -prefix = ustaw prefiks PBO (wymagane do rozwiązywania ścieżek skryptów)
echo Packing PBO...
"%DAYZ_TOOLS%\Bin\AddonBuilder\AddonBuilder.exe" "%SOURCE%" "%OUTPUT%" -prefix=%PREFIX% -clear

REM Sprawdź, czy Addon Builder się powiódł.
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

REM Skopiuj mod.cpp do folderu dystrybutowalnego.
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

## Przewodnik dostosowywania

Gdy używasz tego szablonu dla swojego własnego moda, musisz zmienić nazwę każdego wystąpienia identyfikatorów zastępczych. Oto kompletna lista kontrolna.

### Krok 1: Wybierz swoje nazwy

Zdecyduj o tych identyfikatorach przed dokonaniem jakichkolwiek edycji:

| Identyfikator | Przykład | Zasady |
|---------------|---------|--------|
| **Nazwa folderu moda** | `MyBountySystem` | Bez spacji, PascalCase lub podkreślenia |
| **Nazwa wyświetlana** | `"My Bounty System"` | Czytelna, dla mod.cpp i config.cpp |
| **Klasa CfgPatches** | `MyBountySystem_Scripts` | Musi być globalnie unikalna we wszystkich modach |
| **Klasa CfgMods** | `MyBountySystem` | Wewnętrzny identyfikator silnika |
| **Prefiks skryptów** | `MyBounty` | Krótki prefiks dla klas: `MyBountyManager`, `MyBountyConfig` |
| **Stała tagu** | `MYBOUNTY_TAG` | Dla wiadomości logów: `"[MyBounty]"` |
| **Definicja preprocesora** | `MYBOUNTYSYSTEM` | Dla `#ifdef` wykrywania między modami |
| **ID RPC** | `58432` | Unikalny 5-cyfrowy numer, nieużywany przez inne mody |
| **Nazwa akcji wejścia** | `UAMyBountyPanel` | Zaczyna się od `UA`, unikalna |

### Krok 2: Zmień nazwy plików i folderów

Zmień nazwy każdego pliku i folderu zawierającego "MyMod" lub "MyProfessionalMod":

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

### Krok 3: Znajdź i zamień w każdym pliku

Wykonaj te zamiany **w kolejności** (najdłuższe ciągi najpierw, aby uniknąć częściowych dopasowań):

| Szukaj | Zamień | Pliki dotknięte |
|--------|--------|-----------------|
| `MyProfessionalMod` | `MyBountySystem` | config.cpp, mod.cpp, build.bat, skrypt UI |
| `MyModManager` | `MyBountyManager` | Menadżer, hooki misji, handler gracza |
| `MyModConfig` | `MyBountyConfig` | Klasa konfiguracji, menadżer |
| `MyModConstants` | `MyBountyConstants` | (tylko nazwa pliku) |
| `MyModRPCHelper` | `MyBountyRPCHelper` | Helper RPC, hooki misji |
| `MyModUI` | `MyBountyUI` | Skrypt UI, kliencki hook misji |
| `MyModPanel` | `MyBountyPanel` | Plik layoutu, skrypt UI |
| `MyMod_Scripts` | `MyBountySystem_Scripts` | config.cpp CfgPatches |
| `MYMOD_RPC_ID` | `MYBOUNTY_RPC_ID` | Stałe, RPC, hooki misji |
| `MYMOD_RPC_` | `MYBOUNTY_RPC_` | Wszystkie stałe tras RPC |
| `MYMOD_TAG` | `MYBOUNTY_TAG` | Stałe, wszystkie pliki używające tagu logów |
| `MYMOD_CONFIG` | `MYBOUNTY_CONFIG` | Stałe, klasa konfiguracji |
| `MYMOD_VERSION` | `MYBOUNTY_VERSION` | Stałe, skrypt UI |
| `MYMOD` | `MYBOUNTYSYSTEM` | config.cpp defines[] |
| `MyMod` | `MyBounty` | config.cpp klasa CfgMods, ciągi tras RPC |
| `My Mod` | `My Bounty System` | Ciągi w layoutach, stringtable |
| `mymod` | `mybounty` | Inputs.xml nazwa sortowania |
| `STR_MYMOD_` | `STR_MYBOUNTY_` | stringtable.csv, Inputs.xml |
| `UAMyMod` | `UAMyBounty` | Inputs.xml, kliencki hook misji |
| `m_MyMod` | `m_MyBounty` | Zmienne składowe klienciego hooka misji |
| `74291` | `58432` | ID RPC (twój wybrany unikalny numer) |

### Krok 4: Weryfikacja

Po zmianie nazw zrób wyszukiwanie w całym projekcie "MyMod" i "MyProfessionalMod", aby wyłapać cokolwiek pominięte. Następnie zbuduj i przetestuj:

```batch
DayZDiag_x64.exe -mod=P:\MyBountySystem -filePatching
```

Sprawdź log skryptów po swoim tagu (np. `[MyBounty]`) aby potwierdzić, że wszystko się załadowało.

---

## Przewodnik rozszerzania funkcji

Gdy twój mod już działa, oto jak dodawać popularne funkcje.

### Dodawanie nowego punktu końcowego RPC

**1. Zdefiniuj stałą trasy** w `MyModRPC.c` (3_Game):

```c
const string MYMOD_RPC_BOUNTY_SET = "MyMod:BountySet";
```

**2. Dodaj handler serwera** w `MyModManager.c` (4_World):

```c
void OnBountySet(PlayerIdentity sender, ParamsReadContext ctx)
{
    // Odczytaj parametry zapisane przez klienta.
    string targetName;
    int bountyAmount;
    if (!ctx.Read(targetName)) return;
    if (!ctx.Read(bountyAmount)) return;

    Print(MYMOD_TAG + " Bounty set on " + targetName + ": " + bountyAmount.ToString());
    // ... twoja logika tutaj ...
}
```

**3. Dodaj przypadek dispatchu** w `MyModMissionServer.c` (5_Mission), wewnątrz `OnRPC()`:

```c
else if (routeName == MYMOD_RPC_BOUNTY_SET)
{
    mgr.OnBountySet(sender, ctx);
}
```

**4. Wyślij z klienta** (gdziekolwiek akcja jest wyzwalana):

```c
ScriptRPC rpc = new ScriptRPC();
rpc.Write(MYMOD_RPC_BOUNTY_SET);
rpc.Write("PlayerName");
rpc.Write(5000);
rpc.Send(null, MYMOD_RPC_ID, true, null);
```

### Dodawanie nowego pola konfiguracji

**1. Dodaj pole** w `MyModConfig.c` z wartością domyślną:

```c
// Minimalna kwota nagrody, którą gracze mogą ustawić.
int MinBountyAmount = 100;
```

To wszystko. Serializer JSON automatycznie wykrywa pola publiczne. Istniejące pliki konfiguracji na dysku użyją wartości domyślnej dla nowego pola, dopóki admin nie zedytuje i nie zapisze.

**2. Odwołaj się do niego** z menadżera:

```c
if (bountyAmount < m_Config.MinBountyAmount)
{
    // Odrzuć: za mało.
    return;
}
```

### Dodawanie nowego panelu UI

**1. Utwórz layout** w `Scripts/GUI/layouts/MyModBountyList.layout`:

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

**2. Utwórz skrypt** w `Scripts/5_Mission/MyMod/MyModBountyListUI.c`:

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

### Dodawanie nowego skrótu klawiszowego

**1. Dodaj akcję** w `Inputs.xml`:

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

**2. Dodaj domyślne przypisanie** w sekcji `<preset>`:

```xml
<input name="UAMyModBountyList">
    <btn name="kEnd"/>
</input>
```

**3. Dodaj lokalizację** w `stringtable.csv`:

```csv
"STR_MYMOD_INPUT_BOUNTYLIST","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List",
```

**4. Odpytuj wejście** w `MyModMissionClient.c`:

```c
UAInput bountyInput = GetUApi().GetInputByName("UAMyModBountyList");
if (bountyInput && bountyInput.LocalPress())
{
    ToggleBountyList();
}
```

### Dodawanie nowego wpisu stringtable

**1. Dodaj wiersz** w `stringtable.csv`. Każdy wiersz potrzebuje wszystkich 13 kolumn językowych plus końcowy przecinek:

```csv
"STR_MYMOD_BOUNTY_PLACED","Bounty placed!","Bounty placed!","Odměna vypsána!","Kopfgeld gesetzt!","Награда назначена!","Nagroda wyznaczona!","Fejpénz kiírva!","Taglia piazzata!","Recompensa puesta!","Prime placée!","Bounty placed!","Bounty placed!","Recompensa colocada!","Bounty placed!",
```

**2. Użyj go** w kodzie skryptu:

```c
// Widget.SetText() NIE rozwiązuje automatycznie kluczy stringtable.
// Musisz użyć Widget.SetText() z rozwiązanym ciągiem:
string localizedText = Widget.TranslateString("#STR_MYMOD_BOUNTY_PLACED");
myTextWidget.SetText(localizedText);
```

Lub w pliku `.layout`, silnik rozwiązuje klucze `#STR_` automatycznie:

```
text "#STR_MYMOD_BOUNTY_PLACED"
```

---

## Następne kroki

Z tym profesjonalnym szablonem działającym, możesz:

1. **Przestudiować produkcyjne mody** -- Przeczytaj [DayZ Expansion](https://github.com/salutesh/DayZ-Expansion-Scripts) i źródło `StarDZ_Core` dla rzeczywistych wzorców na skalę.
2. **Dodać własne przedmioty** -- Podążaj za [Rozdziałem 8.2: Tworzenie własnego przedmiotu](02-custom-item.md) i zintegruj je ze swoim menadżerem.
3. **Zbudować panel administratora** -- Podążaj za [Rozdziałem 8.3: Budowanie panelu administratora](03-admin-panel.md) używając swojego systemu konfiguracji.
4. **Dodać nakładkę HUD** -- Podążaj za [Rozdziałem 8.8: Budowanie nakładki HUD](08-hud-overlay.md) dla zawsze widocznych elementów UI.
5. **Opublikować na Workshop** -- Podążaj za [Rozdziałem 8.7: Publikacja na Workshop](07-publishing-workshop.md) gdy twój mod jest gotowy.
6. **Nauczyć się debugowania** -- Przeczytaj [Rozdział 8.6: Debugowanie i testowanie](06-debugging-testing.md) dla analizy logów i rozwiązywania problemów.

---

**Poprzedni:** [Rozdział 8.8: Budowanie nakładki HUD](08-hud-overlay.md) | [Strona główna](../README.md)
