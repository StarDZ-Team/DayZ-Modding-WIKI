# Rozdział 8.5: Korzystanie z szablonu moda DayZ

[Strona główna](../README.md) | [<< Poprzedni: Dodawanie komend czatu](04-chat-commands.md) | **Korzystanie z szablonu moda DayZ** | [Następny: Debugowanie i testowanie >>](06-debugging-testing.md)

---

> **Podsumowanie:** Ten tutorial pokazuje, jak użyć open-source'owego szablonu moda DayZ autorstwa InclementDab, aby w kilka sekund uruchomić nowy projekt moda. Zamiast tworzyć każdy plik od zera, klonujesz gotowy szkielet, który już ma prawidłową strukturę folderów, config.cpp, mod.cpp i stuby warstw skryptowych. Następnie zmieniasz kilka nazw i natychmiast zaczynasz pisać kod.

---

## Spis treści

- [Czym jest szablon moda DayZ?](#czym-jest-szablon-moda-dayz)
- [Co zapewnia szablon](#co-zapewnia-szablon)
- [Krok 1: Klonowanie lub pobieranie szablonu](#krok-1-klonowanie-lub-pobieranie-szablonu)
- [Krok 2: Zrozumienie struktury plików](#krok-2-zrozumienie-struktury-plików)
- [Krok 3: Zmiana nazwy moda](#krok-3-zmiana-nazwy-moda)
- [Krok 4: Aktualizacja config.cpp](#krok-4-aktualizacja-configcpp)
- [Krok 5: Aktualizacja mod.cpp](#krok-5-aktualizacja-modcpp)
- [Krok 6: Zmiana nazw folderów i plików skryptów](#krok-6-zmiana-nazw-folderów-i-plików-skryptów)
- [Krok 7: Budowanie i testowanie](#krok-7-budowanie-i-testowanie)
- [Integracja z DayZ Tools i Workbench](#integracja-z-dayz-tools-i-workbench)
- [Szablon kontra ręczna konfiguracja](#szablon-kontra-ręczna-konfiguracja)
- [Następne kroki](#następne-kroki)

---

## Czym jest szablon moda DayZ?

**Szablon moda DayZ** to repozytorium open-source utrzymywane przez InclementDab, które zapewnia kompletny, gotowy do użycia szkielet moda dla DayZ:

**Repozytorium:** [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)

Zamiast tworzyć każdy plik ręcznie (jak opisano w [Rozdziale 8.1: Twój pierwszy mod](01-first-mod.md)), szablon daje ci gotową strukturę katalogów z całym kodem szablonowym już na miejscu. Klonujesz go, zmieniasz kilka identyfikatorów i jesteś gotowy do pisania logiki gry.

To zalecany punkt startowy dla każdego, kto już stworzył moda Hello World i chce przejść do bardziej złożonych projektów.

---

## Co zapewnia szablon

Szablon zawiera wszystko, czego mod DayZ potrzebuje do kompilacji i załadowania:

| Plik / Folder | Przeznaczenie |
|---------------|---------------|
| `mod.cpp` | Metadane moda (nazwa, autor, wersja) wyświetlane w launcherze DayZ |
| `config.cpp` | Deklaracje CfgPatches i CfgMods rejestrujące moda w silniku |
| `Scripts/3_Game/` | Stuby warstwy Game (enumy, stałe, klasy konfiguracji) |
| `Scripts/4_World/` | Stuby warstwy World (encje, managery, interakcje ze światem) |
| `Scripts/5_Mission/` | Stuby warstwy Mission (UI, haki misji) |
| `.gitignore` | Prekonfigurowane ignorowanie dla rozwoju DayZ (PBO, logi, pliki tymczasowe) |

Szablon podąża za standardową hierarchią 5 warstw skryptowych udokumentowaną w [Rozdziale 2.1: Hierarchia 5 warstw skryptowych](../02-mod-structure/01-five-layers.md). Wszystkie trzy warstwy skryptowe są podłączone w config.cpp, więc możesz natychmiast umieszczać kod w dowolnej warstwie bez dodatkowej konfiguracji.

---

## Krok 1: Klonowanie lub pobieranie szablonu

### Opcja A: Użyj funkcji "Use this template" na GitHubie

1. Przejdź na [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)
2. Kliknij zielony przycisk **"Use this template"** u góry repozytorium
3. Wybierz **"Create a new repository"**
4. Nazwij swoje repozytorium (np. `MyAwesomeMod`)
5. Sklonuj nowe repozytorium na dysk P:

```bash
cd P:\
git clone https://github.com/TwojaNazwaUzytkownika/MyAwesomeMod.git
```

### Opcja B: Bezpośrednie klonowanie

Jeśli nie potrzebujesz własnego repozytorium na GitHubie, sklonuj szablon bezpośrednio:

```bash
cd P:\
git clone https://github.com/InclementDab/DayZ-Mod-Template.git MyAwesomeMod
```

### Opcja C: Pobranie jako ZIP

1. Przejdź na stronę repozytorium
2. Kliknij **Code**, a potem **Download ZIP**
3. Wyodrębnij ZIP do `P:\MyAwesomeMod\`

---

## Krok 2: Zrozumienie struktury plików

Po klonowaniu katalog twojego moda wygląda tak:

```
P:\MyAwesomeMod\
    mod.cpp
    Scripts\
        config.cpp
        3_Game\
            ModName\
                (skrypty warstwy game)
        4_World\
            ModName\
                (skrypty warstwy world)
        5_Mission\
            ModName\
                (skrypty warstwy mission)
```

### Jak poszczególne elementy pasują do siebie

**`mod.cpp`** to dowód tożsamości twojego moda. Kontroluje to, co gracze widzą na liście modów w launcherze DayZ. Zobacz [Rozdział 2.3: mod.cpp i Workshop](../02-mod-structure/03-mod-cpp.md) po wszystkie dostępne pola.

**`Scripts/config.cpp`** to najważniejszy plik. Mówi silnikowi DayZ:
- Od czego zależy twój mod (`CfgPatches.requiredAddons[]`)
- Gdzie znajduje się każda warstwa skryptowa (`CfgMods.class defs`)
- Jakie definicje preprocesora ustawić (`defines[]`)

Zobacz [Rozdział 2.2: config.cpp szczegółowo](../02-mod-structure/02-config-cpp.md) po kompletną referencję.

**`Scripts/3_Game/`** ładuje się jako pierwszy. Umieszczaj tutaj enumy, stałe, identyfikatory RPC, klasy konfiguracji i wszystko, co nie odwołuje się do encji świata.

**`Scripts/4_World/`** ładuje się jako drugi. Umieszczaj tutaj klasy encji (`modded class ItemBase`), managery i wszystko, co współdziała z obiektami gry.

**`Scripts/5_Mission/`** ładuje się jako ostatni. Umieszczaj tutaj haki misji (`modded class MissionServer`), panele UI i logikę startową. Ta warstwa może odwoływać się do typów ze wszystkich niższych warstw.

---

## Krok 3: Zmiana nazwy moda

Szablon zawiera nazwy zastępcze. Musisz je zastąpić rzeczywistą nazwą swojego moda. Oto systematyczne podejście.

### Wybierz swoje nazwy

Przed jakąkolwiek edycją zdecyduj się na:

| Identyfikator | Przykład | Używany w |
|---------------|----------|-----------|
| **Wyświetlana nazwa moda** | `"My Awesome Mod"` | mod.cpp, config.cpp |
| **Nazwa katalogu** | `MyAwesomeMod` | Nazwa folderu, ścieżki config.cpp |
| **Klasa CfgPatches** | `MyAwesomeMod_Scripts` | config.cpp CfgPatches |
| **Klasa CfgMods** | `MyAwesomeMod` | config.cpp CfgMods |
| **Podfolder skryptów** | `MyAwesomeMod` | Wewnątrz 3_Game/, 4_World/, 5_Mission/ |
| **Definicja preprocesora** | `MYAWESOMEMOD` | config.cpp defines[], sprawdzenia #ifdef |

### Zasady nazewnictwa

- **Brak spacji ani znaków specjalnych** w nazwach katalogów i klas. Używaj PascalCase lub podkreśleń.
- **Nazwy klas CfgPatches muszą być globalnie unikalne.** Dwa mody z tą samą nazwą klasy CfgPatches będą kolidować. Użyj nazwy swojego moda jako prefiksu.
- **Nazwy podfolderów skryptów** wewnątrz każdej warstwy powinny odpowiadać nazwie twojego moda dla spójności.

---

## Krok 4: Aktualizacja config.cpp

Otwórz `Scripts/config.cpp` i zaktualizuj następujące sekcje.

### CfgPatches

Zamień nazwę klasy szablonu na swoją:

```cpp
class CfgPatches
{
    class MyAwesomeMod_Scripts    // <-- Twoja unikalna nazwa patcha
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"            // Zależność od gry bazowej
        };
    };
};
```

Jeśli twój mod zależy od innego moda, dodaj jego nazwę klasy CfgPatches do `requiredAddons[]`:

```cpp
requiredAddons[] =
{
    "DZ_Data",
    "CF_Scripts"              // Zależy od Community Framework
};
```

### CfgMods

Zaktualizuj tożsamość moda i ścieżki skryptów:

```cpp
class CfgMods
{
    class MyAwesomeMod
    {
        dir = "MyAwesomeMod";
        name = "My Awesome Mod";
        author = "TwojaNazwa";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/5_Mission" };
            };
        };
    };
};
```

**Kluczowe punkty:**
- Wartość `dir` musi dokładnie odpowiadać nazwie folderu głównego twojego moda.
- Każda ścieżka `files[]` jest relatywna do katalogu głównego moda.
- Tablica `dependencies[]` powinna wymieniać, do których waniliowych modułów skryptowych się podpinasz. Większość modów używa wszystkich trzech: `"Game"`, `"World"` i `"Mission"`.

### Definicje preprocesora (opcjonalne)

Jeśli chcesz, aby inne mody mogły wykryć obecność twojego moda, dodaj tablicę `defines[]`:

```cpp
class MyAwesomeMod
{
    // ... (pozostałe pola powyżej)

    class defs
    {
        class gameScriptModule
        {
            value = "";
            files[] = { "MyAwesomeMod/Scripts/3_Game" };
        };
        // ... inne moduły ...
    };

    // Włącz wykrywanie między modami
    defines[] = { "MYAWESOMEMOD" };
};
```

Inne mody mogą następnie użyć `#ifdef MYAWESOMEMOD`, aby warunkowo kompilować kod integrujący się z twoim.

---

## Krok 5: Aktualizacja mod.cpp

Otwórz `mod.cpp` w katalogu głównym i zaktualizuj go informacjami o swoim modzie:

```cpp
name         = "My Awesome Mod";
author       = "TwojaNazwa";
version      = "1.0.0";
overview     = "Krótki opis tego, co robi twój mod.";
picture      = "";             // Opcjonalne: ścieżka do obrazu podglądu
logo         = "";             // Opcjonalne: ścieżka do logo
logoSmall    = "";             // Opcjonalne: ścieżka do małego logo
logoOver     = "";             // Opcjonalne: ścieżka do logo po najechaniu
tooltip      = "My Awesome Mod";
action       = "";             // Opcjonalne: URL do strony twojego moda
```

Minimum to `name`, `author` i `overview`. Pozostałe pola są opcjonalne, ale poprawiają prezentację w launcherze.

---

## Krok 6: Zmiana nazw folderów i plików skryptów

Zmień nazwy podfolderów skryptów w każdej warstwie, aby pasowały do nazwy twojego moda:

```
Scripts/3_Game/ModName/    -->  Scripts/3_Game/MyAwesomeMod/
Scripts/4_World/ModName/   -->  Scripts/4_World/MyAwesomeMod/
Scripts/5_Mission/ModName/ -->  Scripts/5_Mission/MyAwesomeMod/
```

Wewnątrz tych folderów zmień nazwy zastępczych plików `.c` i zaktualizuj ich nazwy klas. Na przykład, jeśli szablon zawiera plik `ModInit.c` z klasą `ModInit`, zmień jego nazwę na `MyAwesomeModInit.c` i zaktualizuj klasę:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyAwesomeMod] Serwer zainicjalizowany!");
    }
};
```

---

## Krok 7: Budowanie i testowanie

### Użycie File Patching (szybka iteracja)

Najszybszy sposób testowania podczas rozwoju:

```batch
DayZDiag_x64.exe -mod=P:\MyAwesomeMod -filePatching
```

To ładuje twoje skrypty bezpośrednio z folderów źródłowych bez pakowania PBO. Edytuj plik `.c`, zrestartuj grę i natychmiast zobacz zmiany.

### Użycie Addon Builder (do dystrybucji)

Gdy jesteś gotowy do dystrybucji:

1. Otwórz **DayZ Tools** ze Steama
2. Uruchom **Addon Builder**
3. Ustaw **Source directory** na `P:\MyAwesomeMod\Scripts\`
4. Ustaw **Output directory** na `P:\@MyAwesomeMod\Addons\`
5. Ustaw **Prefix** na `MyAwesomeMod\Scripts`
6. Kliknij **Pack**

Następnie skopiuj `mod.cpp` obok folderu `Addons`:

```
P:\@MyAwesomeMod\
    mod.cpp
    Addons\
        Scripts.pbo
```

### Weryfikacja w logu skryptów

Po uruchomieniu sprawdź log skryptów pod kątem swoich komunikatów:

```
%localappdata%\DayZ\script_<data>_<czas>.log
```

Szukaj prefiksu swojego moda (np. `[MyAwesomeMod]`).

---

## Integracja z DayZ Tools i Workbench

### Workbench

DayZ Workbench może otwierać i edytować skrypty twojego moda z podświetlaniem składni:

1. Otwórz **Workbench** z DayZ Tools
2. Przejdź do **File > Open** i przejdź do folderu `Scripts/` twojego moda
3. Otwórz dowolny plik `.c`, aby edytować z podstawową obsługą Enforce Script

Workbench czyta `config.cpp`, aby zrozumieć, które pliki należą do którego modułu skryptowego, więc prawidłowo skonfigurowany config.cpp jest niezbędny.

### Konfiguracja dysku P:

Szablon jest zaprojektowany do pracy z dysku P:. Jeśli sklonowałeś w inne miejsce, utwórz dowiązanie:

```batch
mklink /J P:\MyAwesomeMod "D:\Projects\MyAwesomeMod"
```

To sprawia, że mod jest dostępny pod `P:\MyAwesomeMod` bez przenoszenia plików.

### Automatyzacja Addon Builder

Do powtarzalnych buildów możesz utworzyć plik batch w katalogu głównym moda:

```batch
@echo off
set DAYZ_TOOLS="C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools"
set SOURCE=P:\MyAwesomeMod\Scripts
set OUTPUT=P:\@MyAwesomeMod\Addons
set PREFIX=MyAwesomeMod\Scripts

%DAYZ_TOOLS%\Bin\AddonBuilder\AddonBuilder.exe %SOURCE% %OUTPUT% -prefix=%PREFIX% -clear
echo Build zakończony.
pause
```

---

## Szablon kontra ręczna konfiguracja

| Aspekt | Szablon | Ręczna (Rozdział 8.1) |
|--------|---------|----------------------|
| **Czas do pierwszego buildu** | ~2 minuty | ~15 minut |
| **Wszystkie 3 warstwy skryptowe** | Prekonfigurowane | Dodajesz w miarę potrzeb |
| **config.cpp** | Kompletny ze wszystkimi modułami | Minimalny (tylko misja) |
| **Gotowy na Git** | .gitignore dołączony | Tworzysz własny |
| **Wartość edukacyjna** | Niższa (pliki gotowe) | Wyższa (budujesz wszystko sam) |
| **Zalecany dla** | Doświadczonych modderów, nowe projekty | Początkujących modderów uczących się podstaw |

**Zalecenie:** Jeśli to twój pierwszy mod DayZ, zacznij od [Rozdziału 8.1](01-first-mod.md), aby zrozumieć każdy plik. Gdy poczujesz się pewnie, używaj szablonu do wszystkich przyszłych projektów.

---

## Następne kroki

Z twoim modem opartym na szablonie działającym, możesz:

1. **Dodać niestandardowy przedmiot** -- Podążaj za [Rozdziałem 8.2: Tworzenie niestandardowego przedmiotu](02-custom-item.md), aby definiować przedmioty w config.cpp.
2. **Zbudować panel admina** -- Podążaj za [Rozdziałem 8.3: Budowanie panelu admina](03-admin-panel.md) dla UI zarządzania serwerem.
3. **Dodać komendy czatu** -- Podążaj za [Rozdziałem 8.4: Dodawanie komend czatu](04-chat-commands.md) dla komend tekstowych w grze.
4. **Studiować config.cpp szczegółowo** -- Przeczytaj [Rozdział 2.2: config.cpp szczegółowo](../02-mod-structure/02-config-cpp.md), aby zrozumieć każde pole.
5. **Poznać opcje mod.cpp** -- Przeczytaj [Rozdział 2.3: mod.cpp i Workshop](../02-mod-structure/03-mod-cpp.md) do publikacji na Workshop.
6. **Dodać zależności** -- Jeśli twój mod używa Community Framework lub innego moda, zaktualizuj `requiredAddons[]` i zobacz [Rozdział 2.4: Twój pierwszy mod](../02-mod-structure/04-minimum-viable-mod.md).

---

**Poprzedni:** [Rozdział 8.4: Dodawanie komend czatu](04-chat-commands.md) | [Strona główna](../README.md)
