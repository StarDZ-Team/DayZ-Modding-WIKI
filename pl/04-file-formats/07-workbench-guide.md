# Rozdział 4.7: Przewodnik po Workbench

[Strona główna](../README.md) | [<< Poprzedni: Pakowanie PBO](06-pbo-packing.md) | **Przewodnik po Workbench** | [Następny: Modelowanie budynków >>](08-building-modeling.md)

---

## Wprowadzenie

Workbench to zintegrowane środowisko programistyczne Bohemia Interactive dla silnika Enfusion. Jest dostarczany z DayZ Tools i jest jedynym oficjalnym narzędziem, które rozumie Enforce Script na poziomie języka. Choć wielu modderów pisze kod w VS Code lub innych edytorach, Workbench pozostaje niezastąpiony do zadań, których żadne inne narzędzie nie może wykonać: podłączanie debuggera do działającej instancji DayZ, ustawianie breakpointów, krokowe wykonywanie kodu, inspekcja zmiennych w czasie rzeczywistym, podgląd plików `.layout` UI, przeglądanie zasobów gry i uruchamianie poleceń skryptowych na żywo przez wbudowaną konsolę.

---

## Spis treści

- [Czym jest Workbench?](#czym-jest-workbench)
- [Instalacja i konfiguracja](#instalacja-i-konfiguracja)
- [Pliki projektu (.gproj)](#pliki-projektu-gproj)
- [Interfejs Workbench](#interfejs-workbench)
- [Edycja skryptów](#edycja-skryptów)
- [Debugowanie skryptów](#debugowanie-skryptów)
- [Konsola skryptów -- Testowanie na żywo](#konsola-skryptów----testowanie-na-żywo)
- [Podgląd UI / Layoutów](#podgląd-ui--layoutów)
- [Przeglądarka zasobów](#przeglądarka-zasobów)
- [Profilowanie wydajności](#profilowanie-wydajności)
- [Integracja z File Patching](#integracja-z-file-patching)
- [Typowe problemy z Workbench](#typowe-problemy-z-workbench)
- [Wskazówki i dobre praktyki](#wskazówki-i-dobre-praktyki)

---

## Czym jest Workbench?

Workbench to IDE Bohemii do rozwoju na silniku Enfusion. Jest jedynym narzędziem w pakiecie DayZ Tools, które potrafi kompilować, analizować i debugować Enforce Script. Służy sześciu celom:

| Cel | Opis |
|-----|------|
| **Edycja skryptów** | Kolorowanie składni, uzupełnianie kodu i sprawdzanie błędów dla plików `.c` |
| **Debugowanie skryptów** | Breakpointy, inspekcja zmiennych, stos wywołań, krokowe wykonywanie |
| **Przeglądanie zasobów** | Nawigacja i podgląd zasobów gry -- modeli, tekstur, konfiguracji, layoutów |
| **Podgląd UI / layoutów** | Wizualny podgląd hierarchii widgetów `.layout` z inspekcją właściwości |
| **Profilowanie wydajności** | Profilowanie skryptów, analiza czasu klatek, monitorowanie pamięci |
| **Konsola skryptów** | Wykonywanie poleceń Enforce Script na żywo wobec działającej instancji gry |

Workbench używa tego samego kompilatora skryptów Enfusion co sam DayZ. Gdy Workbench zgłasza błąd kompilacji, ten błąd wystąpi również w grze -- co czyni go niezawodnym sprawdzeniem przed uruchomieniem.

### Czym Workbench NIE jest

- **Nie jest edytorem kodu ogólnego przeznaczenia.** Brakuje mu narzędzi refaktoryzacji, integracji z Git, edycji wielokursorowej i ekosystemu rozszerzeń VS Code.
- **Nie jest launcherem gry.** Nadal uruchamiasz `DayZDiag_x64.exe` osobno; Workbench łączy się z nim.
- **Nie jest wymagany do budowania PBO.** AddonBuilder i skrypty budowania obsługują pakowanie PBO niezależnie.

---

## Instalacja i konfiguracja

### Krok 1: Zainstaluj DayZ Tools

Workbench jest dołączony do DayZ Tools, dystrybuowanych bezpłatnie przez Steam. Otwórz Bibliotekę Steam, włącz filtr **Narzędzia**, wyszukaj **DayZ Tools** i zainstaluj (~2 GB).

### Krok 2: Zlokalizuj Workbench

```
Steam\steamapps\common\DayZ Tools\Bin\Workbench\
  workbenchApp.exe          <-- Plik wykonywalny Workbench
  dayz.gproj                <-- Domyślny plik projektu
```

### Krok 3: Zamontuj dysk P:

Workbench wymaga zamontowanego dysku P: (workdrive). Bez niego Workbench nie uruchomi się lub pokaże pustą przeglądarkę zasobów. Zamontuj przez DayZ Tools Launcher, `SetupWorkdrive.bat` twojego projektu lub ręcznie: `subst P: "D:\TwójKatalogRoboczy"`.

### Krok 4: Wypakuj oryginalne skrypty

Workbench potrzebuje oryginalnych skryptów DayZ na P: do kompilacji twojego moda (ponieważ twój kod rozszerza klasy vanilla):

```
P:\scripts\
  1_Core\
  2_GameLib\
  3_Game\
  4_World\
  5_Mission\
```

Wypakuj je przez DayZ Tools Launcher lub utwórz dowiązanie symboliczne do katalogu z wypakowanymi skryptami.

### Krok 4b: Powiąż instalację gry z dyskiem projektu (dla podmiany na żywo)

Aby umożliwić DayZDiag wczytywanie skryptów bezpośrednio z dysku projektu (umożliwiając edycję na żywo bez przebudowywania PBO), utwórz dowiązanie symboliczne z folderu instalacji DayZ do `P:\scripts`:

1. Przejdź do folderu instalacji DayZ (zwykle `Steam\steamapps\common\DayZ`).
2. Usuń istniejący folder `scripts` wewnątrz.
3. Otwórz wiersz poleceń **jako Administrator** i uruchom:

```batch
mklink /J "C:\...\steamapps\common\DayZ\scripts" "P:\scripts"
```

Zastąp pierwszą ścieżkę rzeczywistą ścieżką instalacji DayZ. Po tym folder instalacji DayZ będzie zawierał junction `scripts` wskazujący na `P:\scripts`. Wszelkie zmiany wprowadzone na dysku projektu są natychmiast widoczne dla gry.

### Krok 5: Skonfiguruj katalog danych źródłowych

1. Uruchom `workbenchApp.exe`.
2. Kliknij **Workbench > Options** w pasku menu.
3. Ustaw **Source data directory** na `P:\`.
4. Kliknij **OK** i pozwól Workbench się zrestartować.

---

## Pliki projektu (.gproj)

Plik `.gproj` to konfiguracja projektu Workbench. Informuje Workbench, gdzie szukać skryptów, które zestawy obrazów załadować do podglądu layoutów i jakie style widgetów są dostępne.

### Lokalizacja pliku

Konwencja to umieszczenie go w katalogu `Workbench/` wewnątrz moda:

```
P:\MyMod\
  Workbench\
    dayz.gproj
  Scripts\
    3_Game\
    4_World\
    5_Mission\
  config.cpp
```

### Przegląd struktury

Plik `.gproj` używa własnościowego formatu tekstowego (nie JSON, nie XML):

```
GameProjectClass {
    ID "MyMod"
    TITLE "My Mod Name"
    Configurations {
        GameProjectConfigClass PC {
            platformHardware PC
            skeletonDefinitions "DZ/Anims/cfg/skeletons.anim.xml"

            FileSystem {
                FileSystemPathClass {
                    Name "Workdrive"
                    Directory "P:/"
                }
            }

            imageSets {
                "gui/imagesets/ccgui_enforce.imageset"
                "gui/imagesets/dayz_gui.imageset"
                "gui/imagesets/dayz_inventory.imageset"
                // ... inne oryginalne zestawy obrazów ...
                "MyMod/gui/imagesets/my_imageset.imageset"
            }

            widgetStyles {
                "gui/looknfeel/dayzwidgets.styles"
                "gui/looknfeel/widgets.styles"
            }

            ScriptModules {
                ScriptModulePathClass {
                    Name "core"
                    Paths {
                        "scripts/1_Core"
                        "MyMod/Scripts/1_Core"
                    }
                    EntryPoint ""
                }
                ScriptModulePathClass {
                    Name "gameLib"
                    Paths { "scripts/2_GameLib" }
                    EntryPoint ""
                }
                ScriptModulePathClass {
                    Name "game"
                    Paths {
                        "scripts/3_Game"
                        "MyMod/Scripts/3_Game"
                    }
                    EntryPoint "CreateGame"
                }
                ScriptModulePathClass {
                    Name "world"
                    Paths {
                        "scripts/4_World"
                        "MyMod/Scripts/4_World"
                    }
                    EntryPoint ""
                }
                ScriptModulePathClass {
                    Name "mission"
                    Paths {
                        "scripts/5_Mission"
                        "MyMod/Scripts/5_Mission"
                    }
                    EntryPoint "CreateMission"
                }
                ScriptModulePathClass {
                    Name "workbench"
                    Paths { "MyMod/Workbench/ToolAddons" }
                    EntryPoint ""
                }
            }
        }
        GameProjectConfigClass XBOX_ONE { platformHardware XBOX_ONE }
        GameProjectConfigClass PS4 { platformHardware PS4 }
        GameProjectConfigClass LINUX { platformHardware LINUX }
    }
}
```

### Wyjaśnienie kluczowych sekcji

**FileSystem** -- Katalogi główne, w których Workbench szuka plików. Minimum to `P:/`. Możesz dodać dodatkowe ścieżki (np. katalog instalacji DayZ ze Steam), jeśli pliki znajdują się poza dyskiem roboczym.

**ScriptModules** -- Najważniejsza sekcja. Mapuje każdą warstwę silnika na katalogi skryptów:

| Moduł | Warstwa | EntryPoint | Przeznaczenie |
|-------|---------|------------|---------------|
| `core` | `1_Core` | `""` | Rdzeń silnika, typy podstawowe |
| `gameLib` | `2_GameLib` | `""` | Narzędzia biblioteki gry |
| `game` | `3_Game` | `"CreateGame"` | Enumy, stałe, inicjalizacja gry |
| `world` | `4_World` | `""` | Encje, menedżery |
| `mission` | `5_Mission` | `"CreateMission"` | Hooki misji, panele UI |
| `workbench` | (narzędzia) | `""` | Pluginy Workbench |

Najpierw podaje się ścieżki vanilla, potem ścieżki twojego moda. Jeśli twój mod zależy od innych modów (jak Community Framework), dodaj ich ścieżki również:

```
ScriptModulePathClass {
    Name "game"
    Paths {
        "scripts/3_Game"              // Vanilla
        "JM/CF/Scripts/3_Game"        // Community Framework
        "MyMod/Scripts/3_Game"        // Twój mod
    }
    EntryPoint "CreateGame"
}
```

Niektóre frameworki nadpisują punkty wejścia (CF używa `"CF_CreateGame"`).

**imageSets / widgetStyles** -- Wymagane do podglądu layoutów. Bez oryginalnych zestawów obrazów pliki layout pokazują brakujące obrazy. Zawsze dodawaj standardowe 14 oryginalnych zestawów obrazów wymienionych w powyższym przykładzie.

### Rozwiązywanie prefiksów ścieżek

Gdy Workbench automatycznie rozwiązuje ścieżki skryptów z `config.cpp` moda, ścieżka FileSystem jest poprzedzana. Jeśli twój mod jest w `P:\OtherMods\MyMod` i config.cpp deklaruje `MyMod/scripts/3_Game`, FileSystem musi zawierać `P:\OtherMods` dla poprawnego rozwiązywania.

### Tworzenie i uruchamianie

**Utwórz .gproj:** Skopiuj domyślny `dayz.gproj` z `DayZ Tools\Bin\Workbench\`, zaktualizuj `ID`/`TITLE` i dodaj ścieżki skryptów twojego moda do każdego modułu.

**Uruchom z niestandardowym projektem:**
```batch
workbenchApp.exe -project="P:\MyMod\Workbench\dayz.gproj"
```

**Uruchom z -mod (automatyczna konfiguracja z config.cpp):**
```batch
workbenchApp.exe -mod=P:\MyMod
workbenchApp.exe -mod=P:\CommunityFramework;P:\MyMod
```

Podejście z `-mod` jest prostsze, ale daje mniejszą kontrolę. Dla złożonych konfiguracji wielomodowych niestandardowy `.gproj` jest bardziej niezawodny.

---

## Interfejs Workbench

### Główny pasek menu

| Menu | Kluczowe elementy |
|------|-------------------|
| **File** | Otwórz projekt, ostatnie projekty, zapisz |
| **Edit** | Wytnij, kopiuj, wklej, szukaj, zamień |
| **View** | Przełączaj panele wł./wył., resetuj układ |
| **Workbench** | Opcje (katalog danych źródłowych, preferencje) |
| **Debug** | Rozpocznij/zatrzymaj debugowanie, przełącznik klient/serwer, zarządzanie breakpointami |
| **Plugins** | Zainstalowane pluginy Workbench i dodatki narzędziowe |

### Panele

- **Przeglądarka zasobów** (lewy) -- Drzewo plików dysku P:. Kliknij dwukrotnie pliki `.c` do edycji, pliki `.layout` do podglądu, `.p3d` do przeglądania modeli, `.paa` do przeglądania tekstur.
- **Edytor skryptów** (środek) -- Obszar edycji kodu z kolorowaniem składni, uzupełnianiem kodu, podkreślaniem błędów, numerami linii, znacznikami breakpointów i edycją wielu plików w kartach.
- **Wyjście** (dół) -- Błędy/ostrzeżenia kompilatora, wyjście `Print()` z połączonej gry, komunikaty debugowania. Po połączeniu z DayZDiag to okno strumieniuje w czasie rzeczywistym cały tekst, który plik wykonywalny diagnostyczny wypisuje do celów debugowania -- to samo wyjście, które widziałbyś w logach skryptów. Kliknij dwukrotnie błędy, aby nawigować do linii źródłowej.
- **Właściwości** (prawy) -- Właściwości wybranego obiektu. Najbardziej przydatne w Edytorze Layoutów do inspekcji widgetów.
- **Konsola** -- Wykonywanie poleceń Enforce Script na żywo.
- **Panele debugowania** (podczas debugowania) -- **Lokalne** (zmienne bieżącego zakresu), **Obserwowane** (wyrażenia użytkownika), **Stos wywołań** (łańcuch funkcji), **Breakpointy** (lista z przełącznikami włączania/wyłączania).

---

## Edycja skryptów

### Otwieranie plików

1. **Przeglądarka zasobów:** Kliknij dwukrotnie plik `.c`. To automatycznie otwiera moduł Edytora Skryptów i wczytuje plik.
2. **Przeglądarka zasobów Edytora Skryptów:** Edytor Skryptów ma własny wbudowany panel Przeglądarki Zasobów, oddzielny od głównej Przeglądarki Zasobów Workbench. Możesz użyć dowolnego do nawigacji i otwierania plików skryptów.
3. **File > Open:** Standardowe okno dialogowe pliku.
4. **Wyjście błędów:** Kliknij dwukrotnie błąd kompilatora, aby przejść do pliku i linii.

### Kolorowanie składni

| Element | Podświetlony |
|---------|-------------|
| Słowa kluczowe (`class`, `if`, `while`, `return`, `modded`, `override`) | Pogrubienie / kolor słowa kluczowego |
| Typy (`int`, `float`, `string`, `bool`, `vector`, `void`) | Kolor typu |
| Łańcuchy, komentarze, dyrektywy preprocesora | Odrębne kolory |

### Uzupełnianie kodu

Wpisz nazwę klasy, a następnie `.`, aby zobaczyć metody i pola, lub naciśnij `Ctrl+Space` dla sugestii. Uzupełnianie opiera się na skompilowanym kontekście skryptu. Jest funkcjonalne, ale ograniczone w porównaniu z VS Code -- najlepsze do szybkiego wyszukiwania API.

### Informacje zwrotne kompilatora

Workbench kompiluje przy zapisie. Typowe błędy:

| Komunikat | Znaczenie |
|-----------|-----------|
| `Undefined variable 'xyz'` | Nie zadeklarowana lub literówka |
| `Method 'Foo' not found in class 'Bar'` | Zła nazwa metody lub klasy |
| `Cannot convert 'string' to 'int'` | Niezgodność typów |
| `Type 'MyClass' not found` | Plik nie jest w projekcie |

### Szukaj, zamień i przejdź do definicji

- `Ctrl+F` / `Ctrl+H` -- szukaj/zamień w bieżącym pliku.
- `Ctrl+Shift+F` -- szukaj we wszystkich plikach projektu.
- Kliknij prawym przyciskiem symbol i wybierz **Go to Definition**, aby przejść do jego deklaracji, nawet w skryptach vanilla.

---

## Debugowanie skryptów

Debugowanie to najpotężniejsza funkcja Workbench -- wstrzymaj działającą instancję DayZ, sprawdź każdą zmienną i krokowo przechodź przez kod linia po linii.

### Wymagania wstępne

- **DayZDiag_x64.exe** (nie detaliczny DayZ) -- tylko wersja diagnostyczna obsługuje debugowanie.
- **Zamontowany dysk P:** z wypakowanymi oryginalnymi skryptami.
- **Skrypty muszą się zgadzać** -- jeśli edytujesz po załadowaniu gry, numery linii nie będą się zgadzać.

### Konfiguracja sesji debugowania

1. Otwórz Workbench i załaduj swój projekt.
2. Otwórz moduł **Script Editor** (z paska menu lub klikając dwukrotnie dowolny plik `.c` w Przeglądarce Zasobów -- to automatycznie otwiera Edytor Skryptów i wczytuje plik).
3. Uruchom DayZDiag osobno:

```batch
DayZDiag_x64.exe -filePatching -mod=P:\MyMod -connect=127.0.0.1 -port=2302
```

4. Workbench automatycznie wykrywa DayZDiag i łączy się. Krótki popup pojawia się w prawym dolnym rogu ekranu potwierdzając połączenie.

> **Wskazówka:** Jeśli potrzebujesz tylko widzieć wyjście konsoli (bez breakpointów i krokowania), nie musisz wypakowywać PBO ani wczytywać skryptów do Workbench. Edytor Skryptów nadal połączy się z DayZDiag i wyświetli strumień wyjścia. Jednak breakpointy i nawigacja po kodzie wymagają, aby pasujące pliki skryptów były załadowane w projekcie.

### Breakpointy

Kliknij lewy margines obok numeru linii. Pojawi się czerwona kropka.

| Znacznik | Znaczenie |
|----------|-----------|
| Czerwona kropka | Aktywny breakpoint -- wykonanie zatrzymuje się tutaj |
| Żółty wykrzyknik | Nieprawidłowy -- ta linia nigdy się nie wykonuje |
| Niebieska kropka | Zakładka -- tylko znacznik nawigacyjny |

Przełączaj klawiszem `F9`. Możesz też kliknąć lewym przyciskiem bezpośrednio w obszarze marginesu (gdzie pojawiają się czerwone kropki), aby dodać lub usunąć breakpointy. Kliknięcie prawym przyciskiem w marginesie dodaje niebieską **Zakładkę** -- zakładki nie mają wpływu na wykonanie, ale oznaczają miejsca, które chcesz odwiedzić ponownie. Kliknij prawym przyciskiem breakpoint, aby ustawić **warunek** (np. `i == 10` lub `player.GetIdentity().GetName() == "TestPlayer"`).

### Krokowe wykonywanie kodu

| Akcja | Skrót | Opis |
|-------|-------|------|
| Kontynuuj | `F5` | Uruchom do następnego breakpointu |
| Krok nad | `F10` | Wykonaj bieżącą linię, przejdź do następnej |
| Krok do | `F11` | Wejdź do wywoływanej funkcji |
| Krok z | `Shift+F11` | Uruchom do powrotu bieżącej funkcji |
| Zatrzymaj | `Shift+F5` | Rozłącz i wznów grę |

### Inspekcja zmiennych

Panel **Lokalne** pokazuje wszystkie zmienne w zakresie -- prymitywy z wartościami, obiekty z nazwami klas (rozwijalne), tablice z długościami i referencje NULL wyraźnie oznaczone. Panel **Obserwowane** ocenia niestandardowe wyrażenia przy każdym wstrzymaniu. **Stos wywołań** pokazuje łańcuch funkcji; kliknij wpisy, aby nawigować.

### Debugowanie klienta vs serwera

`DayZDiag_x64.exe` może działać jako klient lub serwer (dodając parametr uruchomienia `-server`). Akceptuje wszystkie te same parametry co plik wykonywalny detaliczny. Workbench może połączyć się z dowolną instancją.

Użyj **Debug > Debug Client** lub **Debug > Debug Server** w menu Edytora Skryptów, aby wybrać, którą stronę debugować. Na serwerze listen możesz swobodnie przełączać. Krokowanie, breakpointy i inspekcja zmiennych dotyczą strony, która jest aktualnie wybrana.

### Ograniczenia

- Tylko `DayZDiag_x64.exe` obsługuje debugowanie, nie wersje detaliczne.
- Wewnętrznych funkcji C++ silnika nie można krokować.
- Wiele breakpointów w funkcjach o wysokiej częstotliwości (`OnUpdate`) powoduje poważne opóźnienia.
- Duże projekty modów mogą spowolnić indeksowanie Workbench.

---

## Konsola skryptów -- Testowanie na żywo

Konsola skryptów pozwala wykonywać polecenia Enforce Script wobec działającej instancji gry -- nieoceniona do eksperymentowania z API bez edycji plików.

### Otwieranie

Szukaj karty **Console** w dolnym panelu lub włącz przez **View > Console**.

### Typowe polecenia

```c
// Wyświetl pozycję gracza
Print(GetGame().GetPlayer().GetPosition().ToString());

// Spawn przedmiotu pod nogami gracza
GetGame().CreateObject("AKM", GetGame().GetPlayer().GetPosition(), false, false, true);

// Testuj matematykę
float dist = vector.Distance("0 0 0", "100 0 100");
Print("Distance: " + dist.ToString());

// Teleportuj gracza
GetGame().GetPlayer().SetPosition("6737 0 2505");

// Spawn zombie w pobliżu
vector pos = GetGame().GetPlayer().GetPosition();
for (int i = 0; i < 5; i++)
{
    vector offset = Vector(Math.RandomFloat(-5, 5), 0, Math.RandomFloat(-5, 5));
    GetGame().CreateObject("ZmbF_JournalistNormal_Blue", pos + offset, false, false, true);
}
```

### Ograniczenia

- **Domyślnie tylko po stronie klienta** (kod po stronie serwera wymaga serwera listen).
- **Brak stanu trwałego** -- zmienne nie przenoszą się między wykonaniami.
- **Niektóre API niedostępne** do osiągnięcia określonego stanu gry (gracz zspawnowany, misja wczytana).
- **Brak obsługi błędów** -- wskaźniki null po prostu cicho zawodzą.

---

## Podgląd UI / Layoutów

Workbench może otwierać pliki `.layout` do wizualnej inspekcji.

### Co możesz zrobić

- **Wyświetl hierarchię widgetów** -- zobacz zagnieżdżanie rodzic-dziecko i nazwy widgetów.
- **Sprawdź właściwości** -- pozycja, rozmiar, kolor, alpha, wyrównanie, źródło obrazu, tekst, czcionka.
- **Znajdź nazwy widgetów** używane przez `FindAnyWidget()` w kodzie skryptu.
- **Sprawdź odwołania do obrazów** -- które wpisy zestawów obrazów lub tekstury widget używa.

### Czego nie możesz zrobić

- **Brak zachowania w runtime** -- handlery ScriptClass i dynamiczna zawartość się nie wykonują.
- **Różnice renderowania** -- przezroczystość, warstwy i rozdzielczość mogą się różnić od gry.
- **Ograniczona edycja** -- Workbench jest przede wszystkim przeglądarką, nie wizualnym projektantem.

**Dobra praktyka:** Używaj Edytora Layoutów do inspekcji. Buduj i edytuj pliki `.layout` w edytorze tekstu. Testuj w grze z file patching.

---

## Przeglądarka zasobów

Przeglądarka zasobów nawiguje dysk P: z podglądami plików świadomymi gry.

### Możliwości

| Typ pliku | Akcja po dwukrotnym kliknięciu |
|-----------|-------------------------------|
| `.c` | Otwiera w Edytorze Skryptów |
| `.layout` | Otwiera w Edytorze Layoutów |
| `.p3d` | Podgląd modelu 3D (obracanie, zoom, inspekcja LODów) |
| `.paa` / `.edds` | Przeglądarka tekstur z inspekcją kanałów (R, G, B, A) |
| Klasy config | Przeglądanie sparsowanych hierarchii CfgVehicles, CfgWeapons |

### Znajdowanie zasobów vanilla

Jedno z najcenniejszych zastosowań -- badanie jak Bohemia strukturyzuje zasoby:

```
P:\DZ\weapons\        <-- Oryginalne modele broni i tekstury
P:\DZ\characters\     <-- Modele postaci i ubrania
P:\scripts\4_World\   <-- Oryginalne skrypty world
P:\scripts\5_Mission\  <-- Oryginalne skrypty mission
```

---

## Profilowanie wydajności

Po połączeniu z DayZDiag, Workbench może profilować wykonanie skryptów.

### Co pokazuje profiler

- **Liczba wywołań funkcji** -- jak często każda funkcja jest uruchamiana na klatkę.
- **Czas wykonania** -- milisekundy na funkcję.
- **Hierarchia wywołań** -- które funkcje wywołują które, z przypisaniem czasu.
- **Podział czasu klatki** -- czas skryptu vs czas silnika. Przy 60 FPS każda klatka ma ~16.6ms budżetu.
- **Pamięć** -- liczba alokacji według klasy, wykrywanie wycieków cykli ref.

### Wbudowany profiler skryptów (Diag Menu)

Oprócz profilera Workbench, `DayZDiag_x64.exe` ma wbudowany Profiler Skryptów dostępny przez Diag Menu (w sekcji Statistics). Pokazuje listy top-20 dla czasu na klasę, czasu na funkcję, alokacji klas, liczby na funkcję i liczby instancji klas. Użyj parametru uruchomienia `-profile`, aby włączyć profilowanie od startu. Profiler mierzy tylko Enforce Script -- metody proto (silnikowe) nie są mierzone jako oddzielne wpisy, ale ich czas wykonania jest wliczany w łączny czas metody skryptowej, która je wywołuje. Zobacz `EnProfiler.c` w skryptach vanilla dla programistycznego API (`EnProfiler.Enable`, `EnProfiler.SetModule`, stałe flag).

### Typowe wąskie gardła

| Problem | Objaw w profilerze | Rozwiązanie |
|---------|---------------------|-------------|
| Kosztowny kod per-klatkowy | Wysoki czas w `OnUpdate` | Przenieś do timerów, zmniejsz częstotliwość |
| Nadmierna iteracja | Pętla z tysiącami wywołań | Cachuj wyniki, używaj zapytań przestrzennych |
| Konkatenacja stringów w pętlach | Wysoka liczba alokacji | Zmniejsz logowanie, łącz stringi w paczkach |

---

## Integracja z File Patching

Najszybszy przepływ pracy programistycznej łączy Workbench z file patching, eliminując przebudowywanie PBO dla zmian w skryptach.

### Konfiguracja

1. Skrypty na dysku P: jako luźne pliki (nie w PBO).
2. Dowiązanie symboliczne skryptów instalacji DayZ: `mklink /J "...\DayZ\scripts" "P:\scripts"`
3. Uruchom z `-filePatching`: zarówno klient, jak i serwer używają `DayZDiag_x64.exe`.

### Szybka pętla iteracyjna

```
1. Edytuj plik .c w swoim edytorze
2. Zapisz (plik jest już na dysku P:)
3. Zrestartuj misję w DayZDiag (bez przebudowywania PBO)
4. Testuj w grze
5. Ustaw breakpointy w Workbench jeśli potrzeba
6. Powtórz
```

### Co wymaga przebudowania?

| Zmiana | Przebudowa? |
|--------|------------|
| Logika skryptu (`.c`) | Nie -- restart misji |
| Pliki layout (`.layout`) | Nie -- restart misji |
| Config.cpp (tylko skrypty) | Nie -- restart misji |
| Config.cpp (z CfgVehicles) | Tak -- zbinaryzowane configy wymagają PBO |
| Tekstury (`.paa`) | Nie -- silnik przeładowuje z P: |
| Modele (`.p3d`) | Możliwe -- tylko niezbinaryzowane MLOD |

---

## Typowe problemy z Workbench

### Workbench crash przy starcie

**Przyczyna:** Dysk P: nie jest zamontowany lub `.gproj` odwołuje się do nieistniejących ścieżek.
**Rozwiązanie:** Najpierw zamontuj P:. Sprawdź **Workbench > Options** katalog źródłowy. Zweryfikuj, czy ścieżki FileSystem w `.gproj` istnieją.

### Brak uzupełniania kodu

**Przyczyna:** Projekt źle skonfigurowany -- Workbench nie może skompilować skryptów.
**Rozwiązanie:** Zweryfikuj, czy ScriptModules w `.gproj` zawierają ścieżki vanilla (`scripts/1_Core` itp.). Sprawdź Wyjście pod kątem błędów kompilatora. Upewnij się, że oryginalne skrypty są na P:.

### Skrypty się nie kompilują

**Rozwiązanie:** Sprawdź panel Wyjście pod kątem dokładnych błędów. Zweryfikuj, czy wszystkie ścieżki modów zależności są w ScriptModules. Upewnij się, że nie ma odwołań międzywarstwowych (3_Game nie może używać typów z 4_World).

### Breakpointy nie trafiają

**Lista kontrolna:**
1. Połączony z DayZDiag (nie detaliczny)?
2. Czerwona kropka (prawidłowy) czy żółty wykrzyknik (nieprawidłowy)?
3. Skrypty zgadzają się między Workbench a grą?
4. Debugujesz właściwą stronę (klient vs serwer)?
5. Ścieżka kodu rzeczywiście osiągnięta? (Dodaj `Print()` do weryfikacji.)

### Nie można znaleźć plików w Przeglądarce Zasobów

**Rozwiązanie:** Sprawdź, czy FileSystem w `.gproj` zawiera katalog, w którym znajdują się twoje pliki. Zrestartuj Workbench po modyfikacji `.gproj`.

### Błędy "Plugin Not Found"

**Rozwiązanie:** Zweryfikuj integralność DayZ Tools przez Steam (kliknij prawym > Właściwości > Zainstalowane pliki > Weryfikuj). Reinstaluj jeśli potrzeba.

### Połączenie z DayZDiag nie udaje się

**Rozwiązanie:** Oba procesy muszą być na tej samej maszynie. Sprawdź firewalle. Upewnij się, że moduł Script Editor jest otwarty przed uruchomieniem DayZDiag. Spróbuj zrestartować oba.

---

## Wskazówki i dobre praktyki

1. **Używaj Workbench do debugowania, VS Code do pisania.** Edytor Workbench jest podstawowy. Używaj zewnętrznych edytorów do codziennego kodowania; przełączaj się na Workbench do debugowania i podglądu layoutów.

2. **Utrzymuj .gproj per mod.** Każdy mod powinien mieć własny plik projektu, aby kompilować dokładnie właściwy kontekst skryptowy bez indeksowania niezwiązanych modów.

3. **Używaj konsoli do eksperymentowania z API.** Testuj wywołania API w konsoli przed zapisaniem ich do plików. Szybsze niż cykl edycja-restart-test.

4. **Profiluj przed optymalizacją.** Nie zgaduj wąskich gardeł. Profiler pokazuje, gdzie czas jest naprawdę spędzany.

5. **Ustawiaj breakpointy strategicznie.** Unikaj breakpointów w `OnUpdate()`, chyba że warunkowych. Uruchamiają się co klatkę i ciągle zamrażają grę.

6. **Używaj zakładek do nawigacji.** Niebieskie kropki zakładek oznaczają interesujące lokalizacje w skryptach vanilla, do których często się odwołujesz.

7. **Sprawdź wyjście kompilatora przed uruchomieniem.** Jeśli Workbench zgłasza błędy, gra też zawiedzie. Napraw błędy w Workbench najpierw -- szybciej niż czekanie na uruchomienie gry.

8. **Używaj -mod dla prostych konfiguracji, .gproj dla złożonych.** Jeden mod bez zależności: `-mod=P:\MyMod`. Multi-mod z CF/Dabs: niestandardowy `.gproj`.

9. **Utrzymuj Workbench zaktualizowany.** Aktualizuj DayZ Tools przez Steam, gdy DayZ się aktualizuje. Niezgodne wersje powodują błędy kompilacji.

---

## Szybka referencja: Skróty klawiszowe

| Skrót | Akcja |
|-------|-------|
| `F5` | Rozpocznij / Kontynuuj debugowanie |
| `Shift+F5` | Zatrzymaj debugowanie |
| `F9` | Przełącz breakpoint |
| `F10` | Krok nad |
| `F11` | Krok do |
| `Shift+F11` | Krok z |
| `Ctrl+F` | Szukaj w pliku |
| `Ctrl+H` | Szukaj i zamień |
| `Ctrl+Shift+F` | Szukaj w projekcie |
| `Ctrl+S` | Zapisz |
| `Ctrl+Space` | Uzupełnianie kodu |

## Szybka referencja: Parametry uruchomienia

| Parametr | Opis |
|----------|------|
| `-project="path/dayz.gproj"` | Wczytaj określony plik projektu |
| `-mod=P:\MyMod` | Automatyczna konfiguracja z config.cpp moda |
| `-mod=P:\ModA;P:\ModB` | Wiele modów (rozdzielone średnikami) |

---

## Nawigacja

| Poprzedni | W górę | Następny |
|-----------|--------|----------|
| [4.6 Pakowanie PBO](06-pbo-packing.md) | [Część 4: Formaty plików i DayZ Tools](01-textures.md) | [4.8 Modelowanie budynków](08-building-modeling.md) |
