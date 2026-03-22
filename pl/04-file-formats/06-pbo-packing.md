# Rozdział 4.6: Pakowanie PBO

[Strona główna](../README.md) | [<< Poprzedni: Przepływ pracy DayZ Tools](05-dayz-tools.md) | **Pakowanie PBO** | [Następny: Przewodnik po Workbench >>](07-workbench-guide.md)

---

## Wprowadzenie

**PBO** (Packed Bank of Objects) to format archiwum DayZ -- odpowiednik pliku `.zip` dla zawartości gry. Każdy mod ładowany przez grę jest dostarczany jako jeden lub więcej plików PBO. Gdy gracz subskrybuje moda w Steam Workshop, pobiera pliki PBO. Gdy serwer ładuje mody, odczytuje pliki PBO. PBO to końcowy produkt całego procesu moddingu.

Zrozumienie jak prawidłowo tworzyć PBO -- kiedy binaryzować, jak ustawiać prefiksy, jak strukturyzować dane wyjściowe i jak zautomatyzować proces -- to ostatni krok między plikami źródłowymi a działającym modem. Ten rozdział obejmuje wszystko od podstawowej koncepcji po zaawansowane zautomatyzowane przepływy budowania.

---

## Spis treści

- [Czym jest PBO?](#czym-jest-pbo)
- [Wewnętrzna struktura PBO](#wewnętrzna-struktura-pbo)
- [AddonBuilder: Narzędzie do pakowania](#addonbuilder-narzędzie-do-pakowania)
- [Flaga -packonly](#flaga--packonly)
- [Flaga -prefix](#flaga--prefix)
- [Binaryzacja: Kiedy potrzebna, a kiedy nie](#binaryzacja-kiedy-potrzebna-a-kiedy-nie)
- [Podpisywanie kluczem](#podpisywanie-kluczem)
- [Struktura folderu @mod](#struktura-folderu-mod)
- [Zautomatyzowane skrypty budowania](#zautomatyzowane-skrypty-budowania)
- [Budowanie modów z wieloma PBO](#budowanie-modów-z-wieloma-pbo)
- [Typowe błędy budowania i rozwiązania](#typowe-błędy-budowania-i-rozwiązania)
- [Testowanie: File Patching vs ładowanie PBO](#testowanie-file-patching-vs-ładowanie-pbo)
- [Dobre praktyki](#dobre-praktyki)

---

## Czym jest PBO?

PBO to płaski plik archiwum zawierający drzewo katalogów z zasobami gry. Nie stosuje kompresji (w przeciwieństwie do ZIP) -- pliki wewnątrz są przechowywane w oryginalnym rozmiarze. „Pakowanie" jest czysto organizacyjne: wiele plików staje się jednym plikiem z wewnętrzną strukturą ścieżek.

### Kluczowe cechy

- **Brak kompresji:** Pliki są przechowywane bez zmian. Rozmiar PBO równa się sumie zawartości plus mały nagłówek.
- **Płaski nagłówek:** Lista wpisów plików ze ścieżkami, rozmiarami i offsetami.
- **Metadane prefiksu:** Każde PBO deklaruje wewnętrzny prefiks ścieżki, który mapuje jego zawartość do wirtualnego systemu plików silnika.
- **Tylko do odczytu w trakcie działania:** Silnik odczytuje z PBO, ale nigdy do nich nie zapisuje.
- **Podpisywane dla trybu wieloosobowego:** PBO mogą być podpisane parą kluczy w stylu Bohemia do weryfikacji sygnatur na serwerze.

### Dlaczego PBO zamiast luźnych plików

- **Dystrybucja:** Jeden plik na komponent moda jest prostszy niż tysiące luźnych plików.
- **Integralność:** Podpisywanie kluczem zapewnia, że mod nie został zmodyfikowany.
- **Wydajność:** Operacje I/O silnika są zoptymalizowane pod odczyt z PBO.
- **Organizacja:** System prefiksów zapewnia brak kolizji ścieżek między modami.

---

## Wewnętrzna struktura PBO

Gdy otworzysz PBO (używając narzędzia takiego jak PBO Manager lub MikeroTools), zobaczysz drzewo katalogów:

```
MyMod.pbo
  $PBOPREFIX$                    <-- Plik tekstowy zawierający ścieżkę prefiksu
  config.bin                      <-- Zbinaryzowany config.cpp (lub config.cpp jeśli -packonly)
  Scripts/
    3_Game/
      MyConstants.c
    4_World/
      MyManager.c
    5_Mission/
      MyUI.c
  data/
    models/
      my_item.p3d                 <-- Zbinaryzowany ODOL (lub MLOD jeśli -packonly)
    textures/
      my_item_co.paa
      my_item_nohq.paa
      my_item_smdi.paa
    materials/
      my_item.rvmat
  sound/
    gunshot_01.ogg
  GUI/
    layouts/
      my_panel.layout
```

### $PBOPREFIX$

Plik `$PBOPREFIX$` to mały plik tekstowy w katalogu głównym PBO, który deklaruje prefiks ścieżki moda. Na przykład:

```
MyMod
```

Mówi to silnikowi: „Gdy coś odwołuje się do `MyMod\data\textures\my_item_co.paa`, szukaj wewnątrz tego PBO pod ścieżką `data\textures\my_item_co.paa`."

### config.bin vs. config.cpp

- **config.bin:** Zbinaryzowana (binarna) wersja config.cpp, utworzona przez Binarize. Szybsza do parsowania przy ładowaniu.
- **config.cpp:** Oryginalna konfiguracja w formacie tekstowym. Działa w silniku, ale jest nieco wolniejsza do parsowania.

Gdy budujesz z binaryzacją, config.cpp staje się config.bin. Gdy używasz `-packonly`, config.cpp jest dołączany bez zmian.

---

## AddonBuilder: Narzędzie do pakowania

**AddonBuilder** to oficjalne narzędzie Bohemia do pakowania PBO, dołączone do DayZ Tools. Może działać w trybie GUI lub wiersza poleceń.

### Tryb GUI

1. Uruchom AddonBuilder z DayZ Tools Launcher.
2. **Katalog źródłowy:** Wskaż folder moda na dysku P: (np. `P:\MyMod`).
3. **Katalog wyjściowy:** Wskaż folder wyjściowy (np. `P:\output`).
4. **Opcje:**
   - **Binarize:** Zaznacz, aby uruchomić Binarize na zawartości (konwertuje P3D, tekstury, konfiguracje).
   - **Sign:** Zaznacz i wybierz klucz do podpisania PBO.
   - **Prefix:** Wprowadź prefiks moda (np. `MyMod`).
5. Kliknij **Pack**.

### Tryb wiersza poleceń

Tryb wiersza poleceń jest preferowany dla zautomatyzowanych budowań:

```bash
AddonBuilder.exe [ścieżka_źródłowa] [ścieżka_wyjściowa] [opcje]
```

**Pełny przykład:**
```bash
"P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe" ^
    "P:\MyMod" ^
    "P:\output" ^
    -prefix="MyMod" ^
    -sign="P:\keys\MyKey"
```

### Opcje wiersza poleceń

| Flaga | Opis |
|------|-------------|
| `-prefix=<ścieżka>` | Ustawia wewnętrzny prefiks PBO (krytyczny dla rozwiązywania ścieżek) |
| `-packonly` | Pomija binaryzację, pakuje pliki bez zmian |
| `-sign=<ścieżka_klucza>` | Podpisuje PBO określonym kluczem BI (ścieżka klucza prywatnego, bez rozszerzenia) |
| `-include=<ścieżka>` | Lista plików do dołączenia -- pakuje tylko pliki pasujące do tego filtra |
| `-exclude=<ścieżka>` | Lista plików do wykluczenia -- pomija pliki pasujące do tego filtra |
| `-binarize=<ścieżka>` | Ścieżka do Binarize.exe (jeśli nie w domyślnej lokalizacji) |
| `-temp=<ścieżka>` | Katalog tymczasowy dla wyjścia Binarize |
| `-clear` | Czyści katalog wyjściowy przed pakowaniem |
| `-project=<ścieżka>` | Ścieżka dysku projektu (zwykle `P:\`) |

---

## Flaga -packonly

Flaga `-packonly` to jedna z najważniejszych opcji w AddonBuilder. Nakazuje narzędziu pominięcie całej binaryzacji i pakowanie plików źródłowych dokładnie w takiej formie, w jakiej są.

### Kiedy używać -packonly

| Zawartość moda | Używać -packonly? | Powód |
|-------------|---------------|--------|
| Tylko skrypty (pliki .c) | **Tak** | Skrypty nigdy nie są binaryzowane |
| Layouty UI (.layout) | **Tak** | Layouty nigdy nie są binaryzowane |
| Tylko audio (.ogg) | **Tak** | OGG jest już gotowy dla gry |
| Wstępnie skonwertowane tekstury (.paa) | **Tak** | Już w formacie końcowym |
| Config.cpp (bez CfgVehicles) | **Tak** | Proste konfiguracje działają bez binaryzacji |
| Config.cpp (z CfgVehicles) | **Nie** | Definicje przedmiotów wymagają zbinaryzowanej konfiguracji |
| Modele P3D (MLOD) | **Nie** | Powinny być zbinaryzowane do ODOL dla wydajności |
| Tekstury TGA/PNG (wymagają konwersji) | **Nie** | Muszą być skonwertowane do PAA |

### Praktyczne wskazówki

Dla **moda zawierającego tylko skrypty** (jak framework lub mod narzędziowy bez własnych przedmiotów):
```bash
AddonBuilder.exe "P:\MyScriptMod" "P:\output" -prefix="MyScriptMod" -packonly
```

Dla **moda z przedmiotami** (bronie, ubrania, pojazdy z modelami i teksturami):
```bash
AddonBuilder.exe "P:\MyItemMod" "P:\output" -prefix="MyItemMod" -sign="P:\keys\MyKey"
```

> **Wskazówka:** Wiele modów dzieli się na wiele PBO właśnie w celu optymalizacji procesu budowania. PBO ze skryptami używają `-packonly` (szybkie), podczas gdy PBO z danymi zawierającymi modele i tekstury przechodzą pełną binaryzację (wolniejszą, ale konieczną).

---

## Flaga -prefix

Flaga `-prefix` ustawia wewnętrzny prefiks ścieżki PBO, który jest zapisywany do pliku `$PBOPREFIX$` wewnątrz PBO. Ten prefiks jest krytyczny -- określa, jak silnik rozwiązuje ścieżki do zawartości wewnątrz PBO.

### Jak działa prefiks

```
Źródło: P:\MyMod\data\textures\item_co.paa
Prefiks: MyMod
Wewnętrzna ścieżka PBO: data\textures\item_co.paa

Rozwiązywanie przez silnik: MyMod\data\textures\item_co.paa
  --> Szuka w MyMod.pbo: data\textures\item_co.paa
  --> Znaleziono!
```

### Prefiksy wielopoziomowe

Dla modów używających struktury podfolderów, prefiks może zawierać wiele poziomów:

```bash
# Źródło na dysku P:
P:\MyMod\MyMod\Scripts\3_Game\MyClass.c

# Jeśli prefiks to "MyMod\MyMod\Scripts"
# Wewnątrz PBO: 3_Game\MyClass.c
# Ścieżka silnika: MyMod\MyMod\Scripts\3_Game\MyClass.c
```

### Prefiks musi pasować do odwołań

Jeśli twój config.cpp odwołuje się do `MyMod\data\texture_co.paa`, to PBO zawierające tę teksturę musi mieć prefiks `MyMod`, a plik musi znajdować się pod ścieżką `data\texture_co.paa` wewnątrz PBO. Niezgodność powoduje, że silnik nie znajdzie pliku.

### Typowe wzorce prefiksów

| Struktura moda | Ścieżka źródłowa | Prefiks | Odwołanie w konfiguracji |
|---------------|-------------|--------|-----------------|
| Prosty mod | `P:\MyMod\` | `MyMod` | `MyMod\data\item.p3d` |
| Mod z przestrzenią nazw | `P:\MyWeapons\` | `MyWeapons` | `MyWeapons\data\rifle.p3d` |
| Podpakiet skryptowy | `P:\MyFramework\MyMod\Scripts\` | `MyFramework\MyMod\Scripts` | (odwołanie przez config.cpp `CfgMods`) |

---

## Binaryzacja: Kiedy potrzebna, a kiedy nie

Binaryzacja to konwersja czytelnych dla człowieka formatów źródłowych na zoptymalizowane formaty binarne silnika. Jest to najbardziej czasochłonny krok w procesie budowania i najczęstsze źródło błędów kompilacji.

### Co jest binaryzowane

| Typ pliku | Binaryzowany do | Wymagane? |
|-----------|-------------|-----------|
| `config.cpp` | `config.bin` | Wymagane dla modów definiujących przedmioty (CfgVehicles, CfgWeapons) |
| `.p3d` (MLOD) | `.p3d` (ODOL) | Zalecane -- ODOL ładuje się szybciej i jest mniejszy |
| `.tga` / `.png` | `.paa` | Wymagane -- silnik potrzebuje PAA w trakcie działania |
| `.edds` | `.paa` | Wymagane -- jak wyżej |
| `.rvmat` | `.rvmat` (przetworzony) | Ścieżki rozwiązane, drobna optymalizacja |
| `.wrp` | `.wrp` (zoptymalizowany) | Wymagane dla modów terenu/map |

### Co NIE jest binaryzowane

| Typ pliku | Powód |
|-----------|--------|
| skrypty `.c` | Skrypty są ładowane jako tekst przez silnik |
| audio `.ogg` | Już w formacie gotowym dla gry |
| pliki `.layout` | Już w formacie gotowym dla gry |
| tekstury `.paa` | Już w formacie końcowym (wstępnie skonwertowane) |
| dane `.json` | Odczytywane jako tekst przez kod skryptowy |

### Szczegóły binaryzacji Config.cpp

Binaryzacja config.cpp to krok, na którym większość modderów napotyka problemy. Binaryzator parsuje tekst config.cpp, waliduje jego strukturę, rozwiązuje łańcuchy dziedziczenia i generuje binarny config.bin.

**Kiedy binaryzacja jest wymagana dla config.cpp:**
- Konfiguracja definiuje wpisy `CfgVehicles` (przedmioty, bronie, pojazdy, budynki).
- Konfiguracja definiuje wpisy `CfgWeapons`.
- Konfiguracja definiuje wpisy odwołujące się do modeli lub tekstur.

**Kiedy binaryzacja NIE jest wymagana:**
- Konfiguracja definiuje tylko `CfgPatches` i `CfgMods` (rejestracja moda).
- Konfiguracja definiuje tylko konfiguracje dźwięku.
- Mody zawierające tylko skrypty z minimalną konfiguracją.

> **Zasada ogólna:** Jeśli twój config.cpp dodaje fizyczne przedmioty do świata gry, potrzebujesz binaryzacji. Jeśli tylko rejestruje skrypty i definiuje dane nie-przedmiotowe, `-packonly` działa prawidłowo.

---

## Podpisywanie kluczem

PBO mogą być podpisane kryptograficzną parą kluczy. Serwery używają weryfikacji sygnatur, aby upewnić się, że wszyscy połączeni klienci mają te same (niezmodyfikowane) pliki modów.

### Składniki pary kluczy

| Plik | Rozszerzenie | Przeznaczenie | Kto go posiada |
|------|-----------|---------|------------|
| Klucz prywatny | `.biprivatekey` | Podpisuje PBO podczas budowania | Tylko autor moda (ZACHOWAJ W TAJEMNICY) |
| Klucz publiczny | `.bikey` | Weryfikuje sygnatury | Administratorzy serwerów, dystrybuowany z modem |

### Generowanie kluczy

Użyj narzędzi **DSSignFile** lub **DSCreateKey** z DayZ Tools:

```bash
# Generowanie pary kluczy
DSCreateKey.exe MyModKey

# Tworzy to:
#   MyModKey.biprivatekey   (zachowaj w tajemnicy, nie dystrybuuj)
#   MyModKey.bikey          (dystrybuuj administratorom serwerów)
```

### Podpisywanie podczas budowania

```bash
AddonBuilder.exe "P:\MyMod" "P:\output" ^
    -prefix="MyMod" ^
    -sign="P:\keys\MyModKey"
```

Tworzy to:
```
P:\output\
  MyMod.pbo
  MyMod.pbo.MyModKey.bisign    <-- Plik sygnatury
```

### Instalacja klucza po stronie serwera

Administratorzy serwerów umieszczają klucz publiczny (`.bikey`) w katalogu `keys/` serwera:

```
DayZServer/
  keys/
    MyModKey.bikey             <-- Pozwala klientom z tym modem na połączenie
```

---

## Struktura folderu @mod

DayZ oczekuje, że mody będą zorganizowane w określonej strukturze katalogów z konwencją prefiksu `@`:

```
@MyMod/
  addons/
    MyMod.pbo                  <-- Spakowana zawartość moda
    MyMod.pbo.MyKey.bisign     <-- Sygnatura PBO (opcjonalna)
  keys/
    MyKey.bikey                <-- Klucz publiczny dla serwerów (opcjonalny)
  mod.cpp                      <-- Metadane moda
```

### mod.cpp

Plik `mod.cpp` dostarcza metadane wyświetlane w launcherze DayZ:

```cpp
name = "My Awesome Mod";
author = "ModAuthor";
version = "1.0.0";
url = "https://steamcommunity.com/sharedfiles/filedetails/?id=XXXXXXXXX";
```

### Mody z wieloma PBO

Duże mody często dzielą się na wiele PBO w ramach jednego folderu `@mod`:

```
@MyFramework/
  addons/
    MyCore_Scripts.pbo        <-- Warstwa skryptowa
    MyCore_Data.pbo           <-- Tekstury, modele, materiały
    MyCore_GUI.pbo            <-- Pliki layoutów, zestawy obrazków
  keys/
    MyMod.bikey
  mod.cpp
```

### Ładowanie modów

Mody są ładowane przez parametr `-mod`:

```bash
# Pojedynczy mod
DayZDiag_x64.exe -mod="@MyMod"

# Wiele modów (rozdzielone średnikiem)
DayZDiag_x64.exe -mod="@MyFramework;@MyWeapons;@MyMissions"
```

Folder `@` musi znajdować się w katalogu głównym gry lub należy podać ścieżkę bezwzględną.

---

## Zautomatyzowane skrypty budowania

Ręczne pakowanie PBO przez GUI AddonBuilder jest akceptowalne dla małych, prostych modów. Dla większych projektów z wieloma PBO, zautomatyzowane skrypty budowania są niezbędne.

### Wzorzec skryptu Batch

Typowy `build_pbos.bat`:

```batch
@echo off
setlocal

set TOOLS="P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe"
set OUTPUT="P:\@MyMod\addons"
set KEY="P:\keys\MyKey"

echo === Budowanie PBO skryptów ===
%TOOLS% "P:\MyMod\Scripts" %OUTPUT% -prefix="MyMod\Scripts" -packonly -clear

echo === Budowanie PBO danych ===
%TOOLS% "P:\MyMod\Data" %OUTPUT% -prefix="MyMod\Data" -sign=%KEY% -clear

echo === Budowanie zakończone ===
pause
```

### Wzorzec skryptu Python (dev.py)

Dla bardziej zaawansowanych budowań, skrypt Python zapewnia lepszą obsługę błędów, logowanie i logikę warunkową:

```python
import subprocess
import os
import sys

ADDON_BUILDER = r"P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe"
OUTPUT_DIR = r"P:\@MyMod\addons"
KEY_PATH = r"P:\keys\MyKey"

PBOS = [
    {
        "name": "Scripts",
        "source": r"P:\MyMod\Scripts",
        "prefix": r"MyMod\Scripts",
        "packonly": True,
    },
    {
        "name": "Data",
        "source": r"P:\MyMod\Data",
        "prefix": r"MyMod\Data",
        "packonly": False,
    },
]

def build_pbo(pbo_config):
    """Buduje pojedyncze PBO."""
    cmd = [
        ADDON_BUILDER,
        pbo_config["source"],
        OUTPUT_DIR,
        f"-prefix={pbo_config['prefix']}",
    ]

    if pbo_config.get("packonly"):
        cmd.append("-packonly")
    else:
        cmd.append(f"-sign={KEY_PATH}")

    print(f"Budowanie {pbo_config['name']}...")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"BŁĄD budowania {pbo_config['name']}:")
        print(result.stderr)
        return False

    print(f"  {pbo_config['name']} zbudowane pomyślnie.")
    return True

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    success = True
    for pbo in PBOS:
        if not build_pbo(pbo):
            success = False

    if success:
        print("\nWszystkie PBO zbudowane pomyślnie.")
    else:
        print("\nBudowanie zakończone z błędami.")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### Integracja z dev.py

Projekt MyMod używa `dev.py` jako centralnego orkiestratora budowania:

```bash
python dev.py build          # Buduje wszystkie PBO
python dev.py server         # Buduje + uruchamia serwer + monitoruje logi
python dev.py full           # Buduje + serwer + klient
```

Ten wzorzec jest zalecany dla każdego wielomodowego obszaru roboczego. Jedno polecenie buduje wszystko, uruchamia serwer i rozpoczyna monitorowanie -- eliminując ręczne kroki i zmniejszając ryzyko błędu ludzkiego.

---

## Budowanie modów z wieloma PBO

Duże mody korzystają z podziału na wiele PBO. Ma to kilka zalet:

### Dlaczego dzielić na wiele PBO

1. **Szybsza przebudowa.** Jeśli zmieniasz tylko skrypt, przebuduj tylko PBO skryptów (z `-packonly`, co trwa sekundy). PBO danych (z binaryzacją) zajmuje minuty i nie wymaga przebudowy.
2. **Modułowe ładowanie.** PBO przeznaczone tylko dla serwera mogą być wykluczone z pobierania przez klienta.
3. **Czystsza organizacja.** Skrypty, dane i GUI są wyraźnie rozdzielone.
4. **Równoległe budowanie.** Niezależne PBO mogą być budowane jednocześnie.

### Typowy wzorzec podziału

```
@MyMod/
  addons/
    MyMod_Core.pbo           <-- config.cpp, CfgPatches (zbinaryzowany)
    MyMod_Scripts.pbo         <-- Wszystkie pliki skryptowe .c (-packonly)
    MyMod_Data.pbo            <-- Modele, tekstury, materiały (zbinaryzowane)
    MyMod_GUI.pbo             <-- Layouty, zestawy obrazków (-packonly)
    MyMod_Sounds.pbo          <-- Pliki audio OGG (-packonly)
```

### Zależności między PBO

Gdy jedno PBO zależy od drugiego (np. skrypty odwołują się do przedmiotów zdefiniowanych w PBO konfiguracji), `requiredAddons[]` w `CfgPatches` zapewnia poprawną kolejność ładowania:

```cpp
// W config.cpp MyMod_Scripts
class CfgPatches
{
    class MyMod_Scripts
    {
        requiredAddons[] = {"MyMod_Core"};   // Ładuj po PBO rdzenia
    };
};
```

---

## Typowe błędy budowania i rozwiązania

### Błąd: „Include file not found"

**Przyczyna:** Config.cpp odwołuje się do pliku (modelu, tekstury), który nie istnieje pod oczekiwaną ścieżką.
**Rozwiązanie:** Sprawdź, czy plik istnieje na dysku P: pod dokładną ścieżką, do której się odwołujesz. Sprawdź pisownię i wielkość liter.

### Błąd: „Binarize failed" bez szczegółów

**Przyczyna:** Binarize zawiesiło się na uszkodzonym lub nieprawidłowym pliku źródłowym.
**Rozwiązanie:**
1. Sprawdź, który plik Binarize przetwarzał (patrz na wyjście loga).
2. Otwórz problematyczny plik w odpowiednim narzędziu (Object Builder dla P3D, TexView2 dla tekstur).
3. Zwaliduj plik.
4. Typowi winowajcy: tekstury o rozmiarach nie będących potęgą 2, uszkodzone pliki P3D, nieprawidłowa składnia config.cpp.

### Błąd: „Addon requires addon X"

**Przyczyna:** `requiredAddons[]` w CfgPatches wymienia addon, który nie jest obecny.
**Rozwiązanie:** Zainstaluj wymagany addon, dodaj go do budowania lub usuń wymaganie, jeśli faktycznie nie jest potrzebne.

### Błąd: Błąd parsowania Config.cpp (linia X)

**Przyczyna:** Błąd składni w config.cpp.
**Rozwiązanie:** Otwórz config.cpp w edytorze tekstu i sprawdź linię X. Typowe problemy:
- Brakujące średniki po definicjach klas.
- Niezamknięte nawiasy klamrowe `{}`.
- Brakujące cudzysłowy wokół wartości tekstowych.
- Ukośnik odwrotny na końcu linii (kontynuacja linii nie jest obsługiwana).

### Błąd: Niezgodność prefiksu PBO

**Przyczyna:** Prefiks w PBO nie pasuje do ścieżek używanych w config.cpp lub materiałach.
**Rozwiązanie:** Upewnij się, że `-prefix` pasuje do struktury ścieżek oczekiwanej przez wszystkie odwołania. Jeśli config.cpp odwołuje się do `MyMod\data\item.p3d`, prefiks PBO musi wynosić `MyMod`, a plik musi znajdować się pod ścieżką `data\item.p3d` wewnątrz PBO.

### Błąd: „Signature check failed" na serwerze

**Przyczyna:** PBO klienta nie pasuje do oczekiwanej sygnatury serwera.
**Rozwiązanie:**
1. Upewnij się, że zarówno serwer, jak i klient mają tę samą wersję PBO.
2. Podpisz PBO ponownie nowym kluczem, jeśli to konieczne.
3. Zaktualizuj `.bikey` na serwerze.

### Błąd: „Cannot open file" podczas Binarize

**Przyczyna:** Dysk P: nie jest zamontowany lub ścieżka pliku jest nieprawidłowa.
**Rozwiązanie:** Zamontuj dysk P: i sprawdź, czy ścieżka źródłowa istnieje.

---

## Testowanie: File Patching vs ładowanie PBO

Rozwój obejmuje dwa tryby testowania. Wybór odpowiedniego trybu w każdej sytuacji oszczędza znaczną ilość czasu.

### File Patching (Rozwój)

| Aspekt | Szczegóły |
|--------|--------|
| **Szybkość** | Natychmiastowa -- edytuj plik, uruchom grę ponownie |
| **Konfiguracja** | Zamontuj dysk P:, uruchom z flagą `-filePatching` |
| **Plik wykonywalny** | `DayZDiag_x64.exe` (wymagana wersja Diag) |
| **Podpisywanie** | Nie dotyczy (brak PBO do podpisania) |
| **Ograniczenia** | Brak zbinaryzowanych konfiguracji, tylko wersja Diag |
| **Najlepsze dla** | Rozwój skryptów, iteracja UI, szybkie prototypowanie |

### Ładowanie PBO (Testowanie przed wydaniem)

| Aspekt | Szczegóły |
|--------|--------|
| **Szybkość** | Wolniejsza -- wymaga przebudowy PBO przy każdej zmianie |
| **Konfiguracja** | Zbuduj PBO, umieść w `@mod/addons/` |
| **Plik wykonywalny** | `DayZDiag_x64.exe` lub detaliczny `DayZ_x64.exe` |
| **Podpisywanie** | Obsługiwane (wymagane dla trybu wieloosobowego) |
| **Ograniczenia** | Przebudowa wymagana przy każdej zmianie |
| **Najlepsze dla** | Końcowe testy, testy wieloosobowe, walidacja przed wydaniem |

### Zalecany przepływ pracy

1. **Rozwijaj z file patching:** Pisz skrypty, dostosowuj layouty, iteruj nad teksturami. Uruchom grę ponownie, aby przetestować. Brak kroku budowania.
2. **Buduj PBO okresowo:** Testuj zbinaryzowaną wersję, aby wychwycić problemy specyficzne dla binaryzacji (błędy parsowania konfiguracji, problemy z konwersją tekstur).
3. **Końcowy test tylko z PBO:** Przed wydaniem testuj wyłącznie z PBO, aby upewnić się, że spakowany mod działa identycznie jak wersja z file patching.
4. **Podpisz i dystrybuuj PBO:** Wygeneruj sygnatury dla kompatybilności w trybie wieloosobowym.

---

## Dobre praktyki

1. **Używaj `-packonly` dla PBO skryptów.** Skrypty nigdy nie są binaryzowane, więc `-packonly` jest zawsze poprawne i znacznie szybsze.

2. **Zawsze ustawiaj prefiks.** Bez prefiksu silnik nie może rozwiązać ścieżek do zawartości moda. Każde PBO musi mieć poprawny `-prefix`.

3. **Automatyzuj budowanie.** Utwórz skrypt budowania (batch lub Python) od pierwszego dnia. Ręczne pakowanie nie skaluje się i jest podatne na błędy.

4. **Oddzielaj źródła od wyjścia.** Źródła na dysku P:, zbudowane PBO w osobnym katalogu wyjściowym lub `@mod/addons/`. Nigdy nie pakuj z katalogu wyjściowego.

5. **Podpisuj PBO do wszelkich testów wieloosobowych.** Niepodpisane PBO są odrzucane przez serwery z włączoną weryfikacją sygnatur. Podpisuj podczas rozwoju, nawet jeśli wydaje się to zbędne -- zapobiega to problemom typu „u mnie działa", gdy inni testują.

6. **Wersjonuj klucze.** Gdy wprowadzasz przełomowe zmiany, wygeneruj nową parę kluczy. Wymusza to jednoczesną aktualizację wszystkich klientów i serwerów.

7. **Testuj zarówno tryb file patching, jak i PBO.** Niektóre błędy pojawiają się tylko w jednym trybie. Zbinaryzowane konfiguracje zachowują się inaczej niż konfiguracje tekstowe w skrajnych przypadkach.

8. **Regularnie czyść katalog wyjściowy.** Stare PBO z poprzednich budowań mogą powodować mylące zachowanie. Używaj flagi `-clear` lub czyść ręcznie przed budowaniem.

9. **Dziel duże mody na wiele PBO.** Czas zaoszczędzony na przyrostowych przebudowach zwraca się w ciągu pierwszego dnia rozwoju.

10. **Czytaj logi budowania.** Binarize i AddonBuilder tworzą pliki logów. Gdy coś pójdzie nie tak, odpowiedź prawie zawsze znajduje się w logach. Sprawdź `%TEMP%\AddonBuilder\` i `%TEMP%\Binarize\` dla szczegółowego wyjścia.

---

## Zaobserwowane w prawdziwych modach

| Wzorzec | Mod | Szczegóły |
|---------|-----|--------|
| Ponad 20 PBO na mod z drobiazgowym podziałem | Expansion (wszystkie moduły) | Dzieli na osobne PBO dla Scripts, Data, GUI, Vehicles, Book, Market itd., umożliwiając niezależne przebudowy i opcjonalną separację klient/serwer |
| Potrójny podział Skrypty/Dane/GUI | StarDZ (Core, Missions, AI) | Każdy mod tworzy 2-3 PBO: `_Scripts.pbo` (packonly), `_Data.pbo` (zbinaryzowane modele/tekstury), `_GUI.pbo` (packonly layouty) |
| Pojedyncze monolityczne PBO | Proste mody reteksturujące | Małe mody zawierające tylko config.cpp i kilka tekstur PAA pakują wszystko w jedno PBO z binaryzacją |
| Wersjonowanie kluczy na każde duże wydanie | Expansion | Generuje nowe pary kluczy dla przełomowych aktualizacji, wymuszając jednoczesną aktualizację wszystkich klientów i serwerów |

---

## Kompatybilność i wpływ

- **Wiele modów:** Kolizje prefiksów PBO powodują, że silnik ładuje pliki jednego moda zamiast drugiego. Każdy mod musi używać unikalnego prefiksu. Sprawdzaj `$PBOPREFIX$` dokładnie podczas debugowania błędów „file not found" w środowiskach z wieloma modami.
- **Wydajność:** Ładowanie PBO jest szybkie (sekwencyjne odczyty plików), ale mody z wieloma dużymi PBO wydłużają czas uruchamiania serwera. Zbinaryzowana zawartość ładuje się szybciej niż niezbinaryzowana. Używaj modeli ODOL i tekstur PAA w wersjach wydaniowych.
- **Wersja:** Sam format PBO nie zmienił się. AddonBuilder otrzymuje okresowe poprawki przez aktualizacje DayZ Tools, ale flagi wiersza poleceń i zachowanie pakowania są stabilne od DayZ 1.0.

---

## Nawigacja

| Poprzedni | W górę | Następny |
|----------|----|------|
| [4.5 Przepływ pracy DayZ Tools](05-dayz-tools.md) | [Część 4: Formaty plików i DayZ Tools](01-textures.md) | [Następny: Przewodnik po Workbench](07-workbench-guide.md) |
