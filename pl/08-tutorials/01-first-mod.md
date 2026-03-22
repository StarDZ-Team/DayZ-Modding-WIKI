# Rozdział 8.1: Twój pierwszy mod (Hello World)

[Strona główna](../../README.md) | **Twój pierwszy mod** | [Dalej: Tworzenie własnego przedmiotu >>](02-custom-item.md)

---

> **Podsumowanie:** Ten samouczek przeprowadzi cię przez tworzenie pierwszego moda DayZ od absolutnego zera. Zainstalujesz narzędzia, skonfigurujesz przestrzeń roboczą, napiszesz trzy pliki, spakujesz PBO, załadujesz moda w DayZ i zweryfikujesz jego działanie czytając log skryptowy. Nie jest wymagane żadne wcześniejsze doświadczenie z moddingiem DayZ.

---

## Spis treści

- [Wymagania wstępne](#wymagania-wstępne)
- [Krok 1: Instalacja DayZ Tools](#krok-1-instalacja-dayz-tools)
- [Krok 2: Konfiguracja dysku P: (Workdrive)](#krok-2-konfiguracja-dysku-p-workdrive)
- [Krok 3: Tworzenie struktury katalogów moda](#krok-3-tworzenie-struktury-katalogów-moda)
- [Krok 4: Pisanie mod.cpp](#krok-4-pisanie-modcpp)
- [Krok 5: Pisanie config.cpp](#krok-5-pisanie-configcpp)
- [Krok 6: Pisanie pierwszego skryptu](#krok-6-pisanie-pierwszego-skryptu)
- [Krok 7: Pakowanie PBO za pomocą Addon Buildera](#krok-7-pakowanie-pbo-za-pomocą-addon-buildera)
- [Krok 8: Ładowanie moda w DayZ](#krok-8-ładowanie-moda-w-dayz)
- [Krok 9: Weryfikacja w logu skryptowym](#krok-9-weryfikacja-w-logu-skryptowym)
- [Krok 10: Rozwiązywanie typowych problemów](#krok-10-rozwiązywanie-typowych-problemów)
- [Kompletna referencja plików](#kompletna-referencja-plików)
- [Następne kroki](#następne-kroki)

---

## Wymagania wstępne

Przed rozpoczęciem upewnij się, że masz:

- Zainstalowany **Steam** i zalogowane konto
- Zainstalowaną grę **DayZ** (wersja detaliczna ze Steam)
- **Edytor tekstu** (VS Code, Notepad++ lub nawet Notatnik)
- Około **15 GB wolnego miejsca na dysku** na DayZ Tools

To wszystko. Do tego samouczka nie jest wymagane żadne doświadczenie programistyczne -- każda linia kodu jest wyjaśniona.

---

## Krok 1: Instalacja DayZ Tools

DayZ Tools to bezpłatna aplikacja na Steam, która zawiera wszystko, czego potrzebujesz do budowania modów: edytor skryptów Workbench, Addon Builder do pakowania PBO, Terrain Builder i Object Builder.

### Jak zainstalować

1. Otwórz **Steam**
2. Przejdź do **Biblioteki**
3. W filtrze rozwijalnym na górze zmień **Gry** na **Narzędzia**
4. Wyszukaj **DayZ Tools**
5. Kliknij **Zainstaluj**
6. Poczekaj na zakończenie pobierania (około 12-15 GB)

Po zainstalowaniu znajdziesz DayZ Tools w swojej bibliotece Steam pod Narzędziami. Domyślna ścieżka instalacji to:

```
C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\
```

### Co zostanie zainstalowane

| Narzędzie | Przeznaczenie |
|------|---------|
| **Addon Builder** | Pakuje pliki twojego moda do archiwów `.pbo` |
| **Workbench** | Edytor skryptów z podświetlaniem składni |
| **Object Builder** | Przeglądarka i edytor modeli 3D dla plików `.p3d` |
| **Terrain Builder** | Edytor map/terenu |
| **TexView2** | Przeglądarka/konwerter tekstur (`.paa`, `.edds`) |

W tym samouczku potrzebujesz tylko **Addon Buildera**. Pozostałe przydadzą się później.

---

## Krok 2: Konfiguracja dysku P: (Workdrive)

Modding DayZ używa wirtualnej litery dysku **P:** jako wspólnej przestrzeni roboczej. Wszystkie mody i dane gry odwołują się do ścieżek zaczynających się od P:, co utrzymuje spójność ścieżek na różnych maszynach.

### Tworzenie dysku P:

1. Otwórz **DayZ Tools** ze Steam
2. W głównym oknie DayZ Tools kliknij **P: Drive Management** (lub szukaj przycisku oznaczonego "Mount P drive" / "Setup P drive")
3. Kliknij **Create/Mount P: Drive**
4. Wybierz lokalizację dla danych dysku P: (domyślna jest w porządku, lub wybierz dysk z wystarczającą ilością miejsca)
5. Poczekaj na zakończenie procesu

### Weryfikacja działania

Otwórz **Eksplorator plików** i przejdź do `P:\`. Powinieneś zobaczyć katalog zawierający dane gry DayZ. Jeśli dysk P: istnieje i możesz go przeglądać, jesteś gotowy do kontynuowania.

### Alternatywa: Ręczny dysk P:

Jeśli GUI DayZ Tools nie działa, możesz utworzyć dysk P: ręcznie za pomocą wiersza poleceń Windows (uruchomionego jako Administrator):

```batch
subst P: "C:\DayZWorkdrive"
```

Zamień `C:\DayZWorkdrive` na dowolny folder. To tworzy tymczasowe mapowanie dysku, które trwa do restartu. Dla trwałego mapowania użyj `net use` lub GUI DayZ Tools.

### Co jeśli nie chcę używać dysku P:?

Możesz tworzyć mody bez dysku P:, umieszczając folder moda bezpośrednio w katalogu gry DayZ i używając trybu `-filePatching`. Jednak dysk P: to standardowy sposób pracy i cała oficjalna dokumentacja go zakłada. Zdecydowanie zalecamy jego skonfigurowanie.

---

## Krok 3: Tworzenie struktury katalogów moda

Każdy mod DayZ ma określoną strukturę folderów. Utwórz następujące katalogi i pliki na swoim dysku P: (lub w katalogu gry DayZ, jeśli nie używasz P:):

```
P:\MyFirstMod\
    mod.cpp
    Scripts\
        config.cpp
        5_Mission\
            MyFirstMod\
                MissionHello.c
```

### Tworzenie folderów

1. Otwórz **Eksplorator plików**
2. Przejdź do `P:\`
3. Utwórz nowy folder o nazwie `MyFirstMod`
4. Wewnątrz `MyFirstMod` utwórz folder `Scripts`
5. Wewnątrz `Scripts` utwórz folder `5_Mission`
6. Wewnątrz `5_Mission` utwórz folder `MyFirstMod`

### Zrozumienie struktury

| Ścieżka | Przeznaczenie |
|------|---------|
| `MyFirstMod/` | Katalog główny twojego moda |
| `mod.cpp` | Metadane (nazwa, autor) wyświetlane w launcherze DayZ |
| `Scripts/config.cpp` | Mówi silnikowi, od czego zależy twój mod i gdzie są skrypty |
| `Scripts/5_Mission/` | Warstwa skryptów misji (UI, hooki startowe) |
| `Scripts/5_Mission/MyFirstMod/` | Podkatalog dla skryptów misji twojego moda |
| `Scripts/5_Mission/MyFirstMod/MissionHello.c` | Twój właściwy plik skryptowy |

Potrzebujesz dokładnie **3 plików**. Stwórzmy je jeden po drugim.

---

## Krok 4: Pisanie mod.cpp

Utwórz plik `P:\MyFirstMod\mod.cpp` w swoim edytorze tekstu i wklej tę zawartość:

```cpp
name = "My First Mod";
author = "YourName";
version = "1.0";
overview = "My very first DayZ mod. Prints Hello World to the script log.";
```

### Co robi każda linia

- **`name`** -- Nazwa wyświetlana na liście modów w launcherze DayZ. Gracze widzą ją przy wybieraniu modów.
- **`author`** -- Twoje imię lub nazwa zespołu.
- **`version`** -- Dowolny łańcuch wersji. Silnik go nie parsuje.
- **`overview`** -- Opis wyświetlany po rozwinięciu szczegółów moda.

Zapisz plik. To jest karta tożsamości twojego moda.

---

## Krok 5: Pisanie config.cpp

Utwórz plik `P:\MyFirstMod\Scripts\config.cpp` i wklej tę zawartość:

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### Co robi każda sekcja

**CfgPatches** deklaruje twojego moda w silniku DayZ:

- `class MyFirstMod_Scripts` -- Unikalny identyfikator pakietu skryptów twojego moda. Nie może kolidować z żadnym innym modem.
- `units[] = {}; weapons[] = {};` -- Listy encji i broni dodawanych przez twojego moda. Na razie puste.
- `requiredVersion = 0.1;` -- Minimalna wersja gry. Zawsze `0.1`.
- `requiredAddons[] = { "DZ_Data" };` -- Zależności. `DZ_Data` to podstawowe dane gry. Zapewnia to, że twój mod załaduje się **po** grze bazowej.

**CfgMods** mówi silnikowi, gdzie są twoje skrypty:

- `dir = "MyFirstMod";` -- Katalog główny moda.
- `type = "mod";` -- To jest mod klient+serwer (w przeciwieństwie do `"servermod"` tylko dla serwera).
- `dependencies[] = { "Mission" };` -- Twój kod wpina się w moduł skryptowy Mission.
- `class missionScriptModule` -- Mówi silnikowi, żeby skompilował wszystkie pliki `.c` znalezione w `MyFirstMod/Scripts/5_Mission/`.

**Dlaczego tylko `5_Mission`?** Ponieważ nasz skrypt Hello World wpina się w zdarzenie uruchomienia misji, które żyje w warstwie misji. Większość prostych modów zaczyna tutaj.

---

## Krok 6: Pisanie pierwszego skryptu

Utwórz plik `P:\MyFirstMod\Scripts\5_Mission\MyFirstMod\MissionHello.c` i wklej tę zawartość:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The CLIENT mission has started.");
    }
};
```

### Wyjaśnienie linia po linii

```c
modded class MissionServer
```
Słowo kluczowe `modded` jest sercem moddingu DayZ. Mówi: "Weź istniejącą klasę `MissionServer` z podstawowej gry i dodaj moje zmiany na wierzch." Nie tworzysz nowej klasy -- rozszerzasz istniejącą.

```c
    override void OnInit()
```
`OnInit()` jest wywoływany przez silnik, gdy misja się uruchamia. `override` mówi kompilatorowi, że ta metoda już istnieje w klasie nadrzędnej i zastępujemy ją naszą wersją.

```c
        super.OnInit();
```
**Ta linia jest krytyczna.** `super.OnInit()` wywołuje oryginalną implementację z gry bazowej. Jeśli to pominiesz, kod inicjalizacji misji z gry bazowej nigdy się nie uruchomi i gra się zepsuje. Zawsze wywołuj `super` jako pierwsze.

```c
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
```
`Print()` zapisuje wiadomość do pliku logu skryptowego DayZ. Prefiks `[MyFirstMod]` ułatwia znalezienie twoich wiadomości w logu.

```c
modded class MissionGameplay
```
`MissionGameplay` jest odpowiednikiem `MissionServer` po stronie klienta. Gdy gracz dołącza do serwera, `MissionGameplay.OnInit()` uruchamia się na jego maszynie. Moddując obie klasy, twoja wiadomość pojawia się zarówno w logach serwera, jak i klienta.

### O plikach `.c`

Skrypty DayZ używają rozszerzenia `.c`. Mimo że wyglądają jak C, to jest **Enforce Script**, własny język skryptowy DayZ. Ma klasy, dziedziczenie, tablice i mapy, ale nie jest to C, C++ ani C#. Twoje IDE może wyświetlać błędy składni -- to jest normalne i oczekiwane.

---

## Krok 7: Pakowanie PBO za pomocą Addon Buildera

DayZ ładuje mody z plików archiwów `.pbo` (podobnych do .zip, ale w formacie zrozumiałym dla silnika). Musisz spakować swój folder `Scripts` do PBO.

### Używanie Addon Buildera (GUI)

1. Otwórz **DayZ Tools** ze Steam
2. Kliknij **Addon Builder**, aby go uruchomić
3. Ustaw **Source directory** na: `P:\MyFirstMod\Scripts\`
4. Ustaw **Output/Destination directory** na nowy folder: `P:\@MyFirstMod\Addons\`

   Utwórz folder `@MyFirstMod\Addons\` najpierw, jeśli nie istnieje.

5. W **Addon Builder Options**:
   - Ustaw **Prefix** na: `MyFirstMod\Scripts`
   - Pozostaw inne opcje domyślne
6. Kliknij **Pack**

Jeśli się powiodło, zobaczysz plik w:

```
P:\@MyFirstMod\Addons\Scripts.pbo
```

### Konfiguracja finalnej struktury moda

Teraz skopiuj swój `mod.cpp` obok folderu `Addons`:

```
P:\@MyFirstMod\
    mod.cpp                         <-- Kopia z P:\MyFirstMod\mod.cpp
    Addons\
        Scripts.pbo                 <-- Utworzony przez Addon Builder
```

Prefiks `@` w nazwie folderu to konwencja dla modów dystrybucyjnych. Sygnalizuje administratorom serwerów i launcherowi, że to jest pakiet moda.

### Alternatywa: Testowanie bez pakowania (File Patching)

Podczas rozwoju możesz całkowicie pominąć pakowanie PBO, używając trybu file patching. Ładuje on skrypty bezpośrednio z twoich folderów źródłowych:

```
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

File patching jest szybszy przy iteracji, ponieważ edytujesz plik `.c`, restartujesz grę i od razu widzisz zmiany. Nie potrzeba kroku pakowania. Jednak file patching działa tylko z diagnostycznym plikiem wykonywalnym (`DayZDiag_x64.exe`) i nie nadaje się do dystrybucji.

---

## Krok 8: Ładowanie moda w DayZ

Istnieją dwa sposoby załadowania moda: przez launcher lub za pomocą parametrów wiersza poleceń.

### Opcja A: DayZ Launcher

1. Otwórz **DayZ Launcher** ze Steam
2. Przejdź do zakładki **Mods**
3. Kliknij **Add local mod** (lub "Add mod from local storage")
4. Przejdź do `P:\@MyFirstMod\`
5. Włącz moda zaznaczając jego pole wyboru
6. Kliknij **Play** (upewnij się, że łączysz się z lokalnym/offline serwerem lub uruchamiasz tryb jednoosobowy)

### Opcja B: Wiersz poleceń (zalecane do rozwoju)

Dla szybszej iteracji uruchom DayZ bezpośrednio z parametrami wiersza poleceń. Utwórz skrót lub plik batch:

**Używając diagnostycznego pliku wykonywalnego (z file patching, bez potrzeby PBO):**

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ\DayZDiag_x64.exe" -mod=P:\MyFirstMod -filePatching -server -config=serverDZ.cfg -port=2302
```

**Używając spakowanego PBO:**

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ\DayZDiag_x64.exe" -mod=P:\@MyFirstMod -server -config=serverDZ.cfg -port=2302
```

Flaga `-server` uruchamia lokalny serwer listen. Flaga `-filePatching` pozwala na ładowanie skryptów z niespakowanych folderów.

### Szybki test: Tryb offline

Najszybszym sposobem testowania jest uruchomienie DayZ w trybie offline:

```batch
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

Następnie w menu głównym kliknij **Play** i wybierz **Offline Mode** (lub **Community Offline**). To uruchamia lokalną sesję jednoosobową bez potrzeby serwera.

---

## Krok 9: Weryfikacja w logu skryptowym

Po uruchomieniu DayZ z twoim modem, silnik zapisuje cały wynik `Print()` do plików logów.

### Znajdowanie plików logów

DayZ przechowuje logi w twoim lokalnym katalogu AppData:

```
C:\Users\<TwojaWindowsowaNowaUzytkownika>\AppData\Local\DayZ\
```

Aby się tam szybko dostać:
1. Naciśnij **Win + R**, aby otworzyć okno dialogowe Uruchom
2. Wpisz `%localappdata%\DayZ` i naciśnij Enter

Szukaj najnowszego pliku o nazwie takiej jak:

```
script_<data>_<czas>.log
```

Na przykład: `script_2025-01-15_14-30-22.log`

### Czego szukać

Otwórz plik logu w swoim edytorze tekstu i wyszukaj `[MyFirstMod]`. Powinieneś zobaczyć jedną z tych wiadomości:

```
[MyFirstMod] Hello World! The SERVER mission has started.
```

lub (jeśli załadowałeś jako klient):

```
[MyFirstMod] Hello World! The CLIENT mission has started.
```

**Jeśli widzisz swoją wiadomość: gratulacje.** Twój pierwszy mod DayZ działa. Udało ci się:

1. Stworzyć strukturę katalogów moda
2. Napisać konfigurację, którą silnik czyta
3. Wpiąć się w kod gry bazowej za pomocą `modded class`
4. Wydrukować wynik do logu skryptowego

### Co jeśli widzisz błędy?

Jeśli log zawiera linie zaczynające się od `SCRIPT (E):`, coś poszło nie tak. Przeczytaj następną sekcję.

---

## Krok 10: Rozwiązywanie typowych problemów

### Problem: Brak wyjścia w logu (mod wydaje się nie ładować)

**Sprawdź parametry uruchomienia.** Ścieżka `-mod=` musi wskazywać na prawidłowy folder. Jeśli używasz file patching, zweryfikuj, że ścieżka wskazuje na folder zawierający `Scripts/config.cpp` bezpośrednio (nie na folder `@`).

**Sprawdź, czy config.cpp istnieje na właściwym poziomie.** Musi być w `Scripts/config.cpp` wewnątrz katalogu głównego twojego moda. Jeśli jest w niewłaściwym folderze, silnik po cichu ignoruje twojego moda.

**Sprawdź nazwę klasy CfgPatches.** Jeśli nie ma bloku `CfgPatches`, lub jego składnia jest niepoprawna, całe PBO jest pomijane.

**Sprawdź główny log DayZ** (nie tylko log skryptowy). Sprawdź:
```
C:\Users\<TwojeImie>\AppData\Local\DayZ\DayZ_<data>_<czas>.RPT
```
Wyszukaj nazwę swojego moda. Możesz zobaczyć wiadomości takie jak "Addon MyFirstMod_Scripts requires addon DZ_Data which is not loaded."

### Problem: `SCRIPT (E): Undefined variable` lub `Undefined type`

To oznacza, że twój kod odwołuje się do czegoś, czego silnik nie rozpoznaje. Typowe przyczyny:

- **Literówka w nazwie klasy.** `MisionServer` zamiast `MissionServer` (zwróć uwagę na podwójne 's').
- **Niewłaściwa warstwa skryptowa.** Jeśli odwołujesz się do `PlayerBase` z `5_Mission`, powinno działać. Ale jeśli przypadkowo umieściłeś swój plik w `3_Game` i odwołujesz się do typów misji, dostaniesz ten błąd.
- **Brakujące wywołanie `super.OnInit()`.** Jego pominięcie może spowodować kaskadowe awarie.

### Problem: `SCRIPT (E): Member not found`

Metoda, którą wywołujesz, nie istnieje w tej klasie. Sprawdź dwukrotnie nazwę metody i upewnij się, że nadpisujesz prawdziwą metodę z gry bazowej. `OnInit` istnieje w `MissionServer` i `MissionGameplay` -- ale nie w każdej klasie.

### Problem: Mod się ładuje, ale skrypt nigdy się nie wykonuje

- **Rozszerzenie pliku:** Upewnij się, że twój plik skryptowy kończy się na `.c` (nie `.c.txt` ani `.cs`). Windows może domyślnie ukrywać rozszerzenia.
- **Niezgodność ścieżki skryptu:** Ścieżka `files[]` w `config.cpp` musi odpowiadać twojemu rzeczywistemu katalogowi. `"MyFirstMod/Scripts/5_Mission"` oznacza, że silnik szuka folderu dokładnie pod tą ścieżką względem katalogu głównego moda.
- **Nazwa klasy:** `modded class MissionServer` rozróżnia wielkość liter. Musi dokładnie odpowiadać nazwie klasy z gry bazowej.

### Problem: Błędy pakowania PBO

- Upewnij się, że `config.cpp` jest na głównym poziomie tego, co pakujesz (folder `Scripts/`).
- Sprawdź, czy prefiks w Addon Builderze odpowiada ścieżce twojego moda.
- Upewnij się, że w folderze Scripts nie ma plików nietekstowych (żadnych `.exe`, `.dll` ani plików binarnych).

### Problem: Gra crashuje przy uruchomieniu

- Sprawdź błędy składni w `config.cpp`. Brakujący średnik, nawias lub cudzysłów może spowodować crash parsera konfiguracji.
- Zweryfikuj, że `requiredAddons` wymienia poprawne nazwy addonów. Błędna nazwa addonu powoduje twardy błąd.
- Usuń swojego moda z parametrów uruchomienia i potwierdź, że gra uruchamia się bez niego. Następnie dodaj go z powrotem, aby izolować problem.

---

## Kompletna referencja plików

Oto wszystkie trzy pliki w kompletnej formie, do łatwego skopiowania:

### Plik 1: `MyFirstMod/mod.cpp`

```cpp
name = "My First Mod";
author = "YourName";
version = "1.0";
overview = "My very first DayZ mod. Prints Hello World to the script log.";
```

### Plik 2: `MyFirstMod/Scripts/config.cpp`

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### Plik 3: `MyFirstMod/Scripts/5_Mission/MyFirstMod/MissionHello.c`

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The CLIENT mission has started.");
    }
};
```

---

## Następne kroki

Teraz, gdy masz działającego moda, oto naturalne kierunki rozwoju:

1. **[Rozdział 8.2: Tworzenie własnego przedmiotu](02-custom-item.md)** -- Zdefiniuj nowy przedmiot w grze z teksturami i spawnowaniem.
2. **Dodaj więcej warstw skryptowych** -- Utwórz foldery `3_Game` i `4_World` do organizacji konfiguracji, klas danych i logiki encji. Zobacz [Rozdział 2.1: Pięciowarstwowa hierarchia skryptów](../02-mod-structure/01-five-layers.md).
3. **Dodaj przypisania klawiszy** -- Utwórz plik `Inputs.xml` i zarejestruj własne akcje klawiszy.
4. **Stwórz UI** -- Buduj panele w grze używając plików layoutu i `ScriptedWidgetEventHandler`. Zobacz [Rozdział 3: System GUI](../03-gui-system/01-widget-types.md).
5. **Użyj frameworka** -- Zintegruj się z Community Framework (CF) lub innym frameworkiem dla zaawansowanych funkcji jak RPC, zarządzanie konfiguracją i panele administracyjne.

---

## Najlepsze praktyki

- **Zawsze testuj z `-filePatching` przed budowaniem PBO.** Eliminuje to cykl pakowania-kopiowania-restartowania i skraca czas iteracji z minut do sekund.
- **Zacznij od warstwy `5_Mission` dla najszybszej iteracji.** Hooki misji jak `OnInit()` to najprostszy sposób na udowodnienie, że twój mod się ładuje i działa. Dodawaj `3_Game` i `4_World` dopiero gdy naprawdę ich potrzebujesz.
- **Zawsze wywołuj `super` jako pierwsze w nadpisanych metodach.** Pominięcie `super.OnInit()` po cichu psuje zachowanie gry bazowej i każdego innego moda hookującego tę samą metodę.
- **Używaj unikalnego prefiksu w wyjściu Print** (np. `[MyFirstMod]`). Logi skryptowe zawierają tysiące linii z gry bazowej i innych modów -- prefiks to jedyny sposób na szybkie znalezienie twojego wyjścia.
- **Utrzymuj składnię `config.cpp` prostą i poprawną.** Brakujący średnik lub nawias w config.cpp powoduje twardy crash lub ciche pominięcie moda bez wyraźnego komunikatu o błędzie.

---

## Teoria a praktyka

| Koncept | Teoria | Rzeczywistość |
|---------|--------|---------|
| Pola `mod.cpp` | `version` jest używana do rozwiązywania zależności | Silnik całkowicie ignoruje łańcuch wersji -- jest czysto kosmetyczny dla launchera. |
| CfgPatches `requiredAddons` | Wymienia zależności, aby twój mod załadował się we właściwej kolejności | Jeśli błędnie wpiszesz nazwę addona, całe PBO jest po cichu pomijane bez błędu w logu skryptowym. Sprawdź plik `.RPT`. |
| File patching | Edytuj plik `.c` i połącz się ponownie, aby natychmiast zobaczyć zmiany | `config.cpp` i nowo dodane pliki NIE są objęte file patchingiem. Nadal potrzebujesz przebudowy PBO dla nich. |
| Testowanie w trybie offline | Szybki sposób na weryfikację działania moda | Niektóre API (jak `GetGame().GetPlayer().GetIdentity()`) zwracają NULL w trybie offline, powodując crashe, które nie występują na prawdziwym serwerze. |

---

## Czego się nauczyłeś

W tym samouczku nauczyłeś się:
- Jak zainstalować DayZ Tools i skonfigurować przestrzeń roboczą dysku P:
- Trzy niezbędne pliki, których potrzebuje każdy mod: `mod.cpp`, `config.cpp` i co najmniej jeden skrypt `.c`
- Jak `modded class` rozszerza klasy gry bazowej bez ich zastępowania
- Jak spakować PBO, załadować moda i zweryfikować jego działanie czytając log skryptowy

**Dalej:** [Rozdział 8.2: Tworzenie własnego przedmiotu](02-custom-item.md)
