# Rozdział 4.5: Przebieg pracy DayZ Tools

[Strona główna](../README.md) | [<< Poprzedni: Audio](04-audio.md) | **DayZ Tools** | [Dalej: Pakowanie PBO >>](06-pbo-packing.md)

---

## Wprowadzenie

DayZ Tools to darmowy pakiet aplikacji deweloperskich dystrybuowany przez Steam, dostarczony przez Bohemia Interactive dla modderów. Zawiera wszystko potrzebne do tworzenia, konwertowania i pakowania zasobów gry: edytor modeli 3D, przeglądarkę tekstur, edytor terenu, debugger skryptów oraz pipeline binaryzacji, który przekształca czytelne dla człowieka pliki źródłowe w zoptymalizowane formaty gotowe do gry. Żaden mod DayZ nie może być zbudowany bez przynajmniej pewnej interakcji z tymi narzędziami.

Ten rozdział zawiera przegląd każdego narzędzia w pakiecie, wyjaśnia system dysku P: (workdrive) stanowiący podstawę całego przepływu pracy, omawia file patching dla szybkiej iteracji rozwojowej i prowadzi przez kompletny pipeline zasobów od plików źródłowych do grywalnego moda.

---

## Spis treści

- [Przegląd pakietu DayZ Tools](#przegląd-pakietu-dayz-tools)
- [Instalacja i konfiguracja](#instalacja-i-konfiguracja)
- [Dysk P: (Workdrive)](#dysk-p-workdrive)
- [Object Builder](#object-builder)
- [TexView2](#texview2)
- [Terrain Builder](#terrain-builder)
- [Binarize](#binarize)
- [AddonBuilder](#addonbuilder)
- [Workbench](#workbench)
- [Tryb file patching](#tryb-file-patching)
- [Kompletny przebieg pracy: od źródła do gry](#kompletny-przebieg-pracy-od-źródła-do-gry)
- [Najczęstsze błędy](#najczęstsze-błędy)
- [Dobre praktyki](#dobre-praktyki)

---

## Przegląd pakietu DayZ Tools

DayZ Tools jest dostępny jako darmowe pobieranie na Steam w kategorii **Tools**. Instaluje kolekcję aplikacji, z których każda pełni określoną rolę w pipeline'ie moddingu.

| Narzędzie | Przeznaczenie | Główni użytkownicy |
|------|---------|---------------|
| **Object Builder** | Tworzenie i edycja modeli 3D (.p3d) | Artyści 3D, modelarze |
| **TexView2** | Podgląd i konwersja tekstur (.paa, .tga, .png) | Artyści tekstur, wszyscy modderzy |
| **Terrain Builder** | Tworzenie i edycja terenu/map | Twórcy map |
| **Binarize** | Konwersja formatu źródłowego do gry | Pipeline budowania (zwykle automatyczny) |
| **AddonBuilder** | Pakowanie PBO z opcjonalną binaryzacją | Wszyscy modderzy |
| **Workbench** | Debugowanie, testowanie, profilowanie skryptów | Skrypterzy |
| **DayZ Tools Launcher** | Centralny hub do uruchamiania narzędzi i konfiguracji dysku P: | Wszyscy modderzy |

### Lokalizacja na dysku

Po instalacji ze Steam narzędzia znajdują się zazwyczaj w:

```
C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\
  Bin\
    AddonBuilder\
      AddonBuilder.exe          <-- PBO packer
    Binarize\
      Binarize.exe              <-- Asset converter
    TexView2\
      TexView2.exe              <-- Texture tool
    ObjectBuilder\
      ObjectBuilder.exe         <-- 3D model editor
    Workbench\
      workbenchApp.exe          <-- Script debugger
  TerrainBuilder\
    TerrainBuilder.exe          <-- Terrain editor
```

---

## Instalacja i konfiguracja

### Krok 1: Zainstaluj DayZ Tools ze Steam

1. Otwórz bibliotekę Steam.
2. Włącz filtr **Tools** w rozwijanym menu.
3. Wyszukaj "DayZ Tools".
4. Zainstaluj (darmowe, około 2 GB).

### Krok 2: Uruchom DayZ Tools

1. Uruchom "DayZ Tools" ze Steam.
2. Otwiera się DayZ Tools Launcher -- centralna aplikacja hub.
3. Stąd możesz uruchomić dowolne indywidualne narzędzie i skonfigurować ustawienia.

### Krok 3: Skonfiguruj dysk P:

Launcher zapewnia przycisk do utworzenia i zamontowania dysku P: (workdrive). To wirtualny dysk, którego wszystkie narzędzia DayZ używają jako ścieżki głównej.

1. Kliknij **Setup Workdrive** (lub przycisk konfiguracji dysku P:).
2. Narzędzie tworzy zamapowany przez subst dysk P: wskazujący na katalog na twoim prawdziwym dysku.
3. Wypakuj lub utwórz symlink do waniliowych danych DayZ na P:, aby narzędzia mogły referencjonować zasoby gry.

---

## Dysk P: (Workdrive)

**Dysk P:** to wirtualny dysk Windows (tworzony przez `subst` lub junction) służący jako ujednolicona ścieżka główna dla całego moddingu DayZ. Każda ścieżka w modelach P3D, materiałach RVMAT, referencjach config.cpp i skryptach budowania jest relatywna do P:.

### Dlaczego dysk P: istnieje

Pipeline zasobów DayZ został zaprojektowany wokół stałej ścieżki głównej. Gdy materiał odwołuje się do `MyMod\data\texture_co.paa`, silnik szuka `P:\MyMod\data\texture_co.paa`. Ta konwencja zapewnia:

- Wszystkie narzędzia zgadzają się co do lokalizacji plików.
- Ścieżki w spakowanych PBO odpowiadają ścieżkom podczas rozwoju.
- Wiele modów może współistnieć pod jednym rootem.

### Struktura

```
P:\
  DZ\                          <-- Vanilla DayZ extracted data
  DayZ Tools\                  <-- Tools installation (or symlink)
  MyMod\                       <-- Your mod source
    config.cpp
    Scripts\
    data\
  AnotherMod\                  <-- Another mod's source
    ...
```

### SetupWorkdrive.bat

Wiele projektów modów zawiera skrypt `SetupWorkdrive.bat`, który automatyzuje tworzenie dysku P: i konfigurację junctions:

```batch
@echo off
REM Create P: drive pointing to the workspace
subst P: "D:\DayZModding"

REM Create junctions for vanilla game data
mklink /J "P:\DZ" "C:\Program Files (x86)\Steam\steamapps\common\DayZ\dta"

REM Create junction for tools
mklink /J "P:\DayZ Tools" "C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools"

echo Workdrive P: configured.
pause
```

> **Wskazówka:** Workdrive musi być zamontowany przed uruchomieniem jakiegokolwiek narzędzia DayZ. Jeśli Object Builder lub Binarize nie mogą znaleźć plików, pierwszą rzeczą do sprawdzenia jest, czy P: jest zamontowany.

---

## Object Builder

Object Builder to edytor modeli 3D dla plików P3D. Jest szczegółowo opisany w [Rozdziale 4.2: Modele 3D](02-models.md).

### Kluczowe możliwości

- Tworzenie i edycja plików modeli P3D.
- Definiowanie LODów dla siatek wizualnych, kolizji i cieni.
- Przypisywanie materiałów (RVMAT) i tekstur (PAA) do ścian modelu.
- Tworzenie nazwanych selekcji do animacji i zamiany tekstur.
- Umieszczanie punktów pamięci i obiektów proxy.
- Import geometrii z formatów FBX, OBJ i 3DS.
- Walidacja modeli pod kątem kompatybilności z silnikiem.

---

## TexView2

TexView2 to narzędzie do podglądu i konwersji tekstur. Obsługuje wszystkie konwersje formatów tekstur potrzebne do moddingu DayZ.

### Kluczowe możliwości

- Otwieranie i podgląd plików PAA, TGA, PNG, EDDS i DDS.
- Konwersja między formatami (TGA/PNG do PAA, PAA do TGA, itp.).
- Podgląd poszczególnych kanałów (R, G, B, A) osobno.
- Wyświetlanie poziomów mipmap.
- Pokazywanie wymiarów tekstury i typu kompresji.
- Konwersja wsadowa z linii poleceń.

### Typowe operacje

**Konwersja TGA do PAA:**
1. File --> Open --> wybierz plik TGA.
2. Sprawdź, czy obraz wygląda poprawnie.
3. File --> Save As --> wybierz format PAA.
4. Wybierz kompresję (DXT1 dla nieprzezroczystych, DXT5 dla alfy).
5. Zapisz.

**Konwersja z linii poleceń:**
```bash
TexView2.exe -i "P:\MyMod\data\texture_co.tga" -o "P:\MyMod\data\texture_co.paa"
```

---

## Terrain Builder

Terrain Builder to wyspecjalizowane narzędzie do tworzenia niestandardowych map (terenów). Terrain Builder NIE jest potrzebny dla modów przedmiotów, broni, UI ani modów czysto skryptowych.

---

## Binarize

Binarize to silnik konwersji przekształcający czytelne dla człowieka pliki źródłowe w zoptymalizowane formaty binarne gotowe do gry.

### Co Binarize konwertuje

| Format źródłowy | Format wyjściowy | Opis |
|---------------|---------------|-------------|
| MLOD `.p3d` | ODOL `.p3d` | Zoptymalizowany model 3D |
| `.tga` / `.png` / `.edds` | `.paa` | Skompresowana tekstura |
| `.cpp` (config) | `.bin` | Zbinaryzowana konfiguracja (szybsze parsowanie) |
| `.rvmat` | `.rvmat` (przetworzony) | Materiał z rozwiązanymi ścieżkami |

### Kiedy binaryzacja jest potrzebna

| Typ treści | Binaryzować? | Powód |
|-------------|-----------|--------|
| Config.cpp z CfgVehicles | **Tak** | Silnik wymaga zbinaryzowanych konfiguracji dla definicji przedmiotów |
| Config.cpp (tylko skrypty) | Opcjonalnie | Konfiguracje czysto skryptowe działają bez binaryzacji |
| Modele P3D | **Tak** | ODOL ładuje się szybciej, jest mniejszy, zoptymalizowany |
| Tekstury (TGA/PNG) | **Tak** | PAA jest wymagany w trakcie działania |
| Skrypty (.c) | **Nie** | Skrypty ładowane są w postaci tekstu |
| Audio (.ogg) | **Nie** | OGG jest już gotowy do gry |
| Layouty (.layout) | **Nie** | Ładowane w postaci źródłowej |

---

## AddonBuilder

AddonBuilder to narzędzie do pakowania PBO. Bierze katalog źródłowy i tworzy archiwum `.pbo`, opcjonalnie uruchamiając Binarize na treści. Szczegółowe omówienie w [Rozdziale 4.6: Pakowanie PBO](06-pbo-packing.md).

### Szybkie odniesienie

```bash
# Pack with binarization (for item/weapon mods with configs, models, textures)
AddonBuilder.exe "P:\MyMod" "P:\output" -prefix="MyMod" -sign="MyKey"

# Pack without binarization (for script-only mods)
AddonBuilder.exe "P:\MyMod" "P:\output" -prefix="MyMod" -packonly
```

---

## Workbench

Workbench to środowisko deweloperskie skryptów dołączone do DayZ Tools. Zapewnia edycję, debugowanie i profilowanie skryptów.

### Kluczowe możliwości

- **Edycja skryptów** z podświetlaniem składni dla Enforce Script.
- **Debugowanie** z breakpointami, wykonywaniem krokowym i inspekcją zmiennych.
- **Profilowanie** do identyfikacji wąskich gardeł wydajności w skryptach.
- **Konsola** do ewaluacji wyrażeń i testowania fragmentów.

### Ograniczenia

- Obsługa Enforce Script w Workbench ma pewne luki.
- Niektórzy modderzy preferują zewnętrzne edytory (VS Code z rozszerzeniami Enforce Script) do pisania kodu i używają Workbench tylko do debugowania.

---

## Tryb file patching

**File patching** to skrót deweloperski pozwalający grze ładować luźne pliki z dysku zamiast wymagania ich spakowania w PBO. Dramatycznie przyspiesza iterację podczas rozwoju.

### Jak działa file patching

Gdy DayZ jest uruchomiony z parametrem `-filePatching`, silnik sprawdza dysk P: w poszukiwaniu plików przed szukaniem w PBO. Jeśli plik istnieje na P:, luźna wersja jest ładowana zamiast wersji PBO.

### Włączanie file patching

Dodaj parametr uruchomienia `-filePatching` do DayZ:

```bash
# Client
DayZDiag_x64.exe -filePatching -mod="MyMod" -connect=127.0.0.1

# Server
DayZDiag_x64.exe -filePatching -server -mod="MyMod" -config=serverDZ.cfg
```

> **Ważne:** File patching wymaga wykonywalnego pliku **Diag** (diagnostycznego) (`DayZDiag_x64.exe`), nie detalicznego. Kompilacja detaliczna ignoruje `-filePatching` ze względów bezpieczeństwa.

### Co file patching może zrobić

| Typ zasobu | File patching działa? | Uwagi |
|------------|---------------------|-------|
| Skrypty (.c) | **Tak** | Najszybsza iteracja -- edytuj, restartuj, testuj |
| Layouty (.layout) | **Tak** | Zmiany UI bez przebudowy |
| Tekstury (.paa) | **Tak** | Zamiana tekstur bez przebudowy |
| Config.cpp | **Częściowo** | Tylko niezbinaryzowane konfiguracje |
| Modele (.p3d) | **Tak** | Tylko niezbinaryzowane MLOD P3D |
| Audio (.ogg) | **Tak** | Zamiana dźwięków bez przebudowy |

### Ograniczenia

- **Brak zbinaryzowanej treści.** Config.cpp z wpisami `CfgVehicles` może nie działać poprawnie bez binaryzacji.
- **Brak podpisywania kluczem.** Treść z file patching nie jest podpisana, więc działa tylko w rozwoju.
- **Tylko kompilacja Diag.** Wykonywalny plik detaliczny ignoruje file patching.
- **Dysk P: musi być zamontowany.** Jeśli workdrive nie jest zamontowany, file patching nie ma skąd czytać.

---

## Kompletny przebieg pracy: od źródła do gry

### Faza 1: Tworzenie zasobów źródłowych

```
3D Software (Blender/3dsMax)  -->  FBX export
Image Editor (Photoshop/GIMP) -->  TGA/PNG export
Audio Editor (Audacity)       -->  OGG export
Text Editor (VS Code)         -->  .c scripts, config.cpp, .layout files
```

### Faza 2: Import i konwersja

```
FBX  -->  Object Builder  -->  P3D (with LODs, selections, materials)
TGA  -->  TexView2         -->  PAA (compressed texture)
PNG  -->  TexView2         -->  PAA (compressed texture)
OGG  -->  (no conversion needed, game-ready)
```

### Faza 3: Organizacja na dysku P:

```
P:\MyMod\
  config.cpp                    <-- Mod configuration
  Scripts\
    3_Game\                     <-- Early-load scripts
    4_World\                    <-- Entity/manager scripts
    5_Mission\                  <-- UI/mission scripts
  data\
    models\
      my_item.p3d               <-- 3D model
    textures\
      my_item_co.paa            <-- Diffuse texture
      my_item_nohq.paa          <-- Normal map
      my_item_smdi.paa          <-- Specular map
    materials\
      my_item.rvmat             <-- Material definition
  sound\
    my_sound.ogg                <-- Audio file
  GUI\
    layouts\
      my_panel.layout           <-- UI layout
```

### Faza 4: Test z file patching (Rozwój)

```
Launch DayZDiag with -filePatching
  |
  |--> Engine reads loose files from P:\MyMod\
  |--> Test in-game
  |--> Edit files directly on P:
  |--> Restart to pick up changes
  |--> Iterate rapidly
```

### Faza 5: Pakowanie PBO (Wydanie)

```
AddonBuilder / build script
  |
  |--> Reads source from P:\MyMod\
  |--> Binarize converts: P3D-->ODOL, TGA-->PAA, config.cpp-->.bin
  |--> Packs everything into MyMod.pbo
  |--> Signs with key: MyMod.pbo.MyKey.bisign
  |--> Output: @MyMod\addons\MyMod.pbo
```

### Faza 6: Dystrybucja

```
@MyMod\
  addons\
    MyMod.pbo                   <-- The packed mod
    MyMod.pbo.MyKey.bisign      <-- Signature for server verification
  keys\
    MyKey.bikey                 <-- Public key for server admins
  mod.cpp                       <-- Mod metadata (name, author, etc.)
```

Gracze subskrybują mod na Steam Workshop lub administratorzy serwerów instalują go ręcznie.

---

## Najczęstsze błędy

### 1. Dysk P: niezamontowany

**Objaw:** Wszystkie narzędzia raportują błędy "file not found". Object Builder pokazuje puste tekstury.
**Rozwiązanie:** Uruchom `SetupWorkdrive.bat` lub zamontuj P: przez DayZ Tools Launcher przed uruchomieniem jakiegokolwiek narzędzia.

### 2. Złe narzędzie do zadania

**Objaw:** Próba edycji pliku PAA w edytorze tekstu lub otwieranie P3D w Notatniku.
**Rozwiązanie:** PAA jest binarny -- użyj TexView2. P3D jest binarny -- użyj Object Builder. Config.cpp jest tekstowy -- użyj dowolnego edytora tekstu.

### 3. Zapomnienie o wypakowaniu waniliowych danych

**Objaw:** Object Builder nie może wyświetlić waniliowych tekstur na referencjonowanych modelach. Materiały wyświetlają się różowo/magentowo.
**Rozwiązanie:** Wypakuj waniliowe dane DayZ do `P:\DZ\`, aby narzędzia mogły rozwiązywać referencje krzyżowe do treści gry.

### 4. File patching z wykonywalnym plikiem detalicznym

**Objaw:** Zmiany w plikach na dysku P: nie są odzwierciedlone w grze.
**Rozwiązanie:** Użyj `DayZDiag_x64.exe`, nie `DayZ_x64.exe`. Tylko kompilacja Diag obsługuje `-filePatching`.

### 5. Budowanie bez dysku P:

**Objaw:** AddonBuilder lub Binarize zwraca błędy rozwiązywania ścieżek.
**Rozwiązanie:** Zamontuj dysk P: przed uruchomieniem jakiegokolwiek narzędzia budowania. Wszystkie ścieżki w modelach i materiałach są relatywne do P:.

---

## Dobre praktyki

1. **Zawsze używaj dysku P:.** Oprzyj się pokusie używania ścieżek absolutnych. P: to standard i wszystkie narzędzia go oczekują.

2. **Używaj file patching podczas rozwoju.** Skraca czas iteracji z minut (przebudowa PBO) do sekund (restart gry). Buduj PBO tylko do testów wydaniowych i dystrybucji.

3. **Zautomatyzuj pipeline budowania.** Używaj skryptów (`build_pbos.bat`, `dev.py`) do automatyzacji wywołań AddonBuilder. Ręczne pakowanie GUI jest podatne na błędy i wolne dla modów z wieloma PBO.

4. **Oddzielaj źródło od wyników.** Pliki źródłowe żyją na P:. Zbudowane PBO trafiają do osobnego katalogu wyjściowego. Nigdy ich nie mieszaj.

5. **Ucz się skrótów klawiaturowych.** Object Builder i TexView2 mają rozbudowane skróty, które dramatycznie przyspieszają pracę. Zainwestuj czas w ich naukę.

6. **Wypakuj i studiuj waniliowe dane.** Najlepszy sposób na naukę struktury zasobów DayZ to badanie istniejących. Wypakuj waniliowe PBO i otwórz modele, materiały i tekstury w odpowiednich narzędziach.

7. **Używaj Workbench do debugowania, zewnętrznych edytorów do pisania.** VS Code z rozszerzeniami Enforce Script zapewnia lepszą edycję. Workbench zapewnia lepsze debugowanie. Używaj obu.

---

## Nawigacja

| Poprzedni | W górę | Dalej |
|----------|----|------|
| [4.4 Audio](04-audio.md) | [Część 4: Formaty plików i DayZ Tools](01-textures.md) | [4.6 Pakowanie PBO](06-pbo-packing.md) |
