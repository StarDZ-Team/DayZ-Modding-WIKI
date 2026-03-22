# Rozdział 8.13: Menu diagnostyczne (Diag Menu)

[Strona główna](../../README.md) | [<< Poprzedni: Budowanie systemu handlowego](12-trading-system.md) | **Menu diagnostyczne**

---

> **Podsumowanie:** Diag Menu to wbudowane narzędzie diagnostyczne DayZ, dostępne wyłącznie przez plik wykonywalny DayZDiag. Zapewnia liczniki FPS, profilowanie skryptów, debugowanie renderowania, wolną kamerę, wizualizację fizyki, kontrolę pogody, narzędzia Centralnej Ekonomii, debugowanie nawigacji SI oraz diagnostykę dźwięku. Ten rozdział dokumentuje każdą kategorię menu, opcję i skrót klawiaturowy na podstawie oficjalnej dokumentacji Bohemia Interactive.

---

## Spis treści

- [Czym jest Diag Menu?](#what-is-the-diag-menu)
- [Jak uzyskać dostęp](#how-to-access)
- [Sterowanie nawigacją](#navigation-controls)
- [Skróty klawiszowe szybkiego dostępu](#quick-access-keyboard-shortcuts)
- [Przegląd kategorii menu](#menu-categories-overview)
- [Statystyki](#statistics)
- [Enfusion Renderer](#enfusion-renderer)
- [Enfusion World (Fizyka)](#enfusion-world-physics)
- [DayZ Render](#dayz-render)
- [Gra](#game)
- [SI](#ai)
- [Dźwięki](#sounds)
- [Przydatne funkcje dla modderów](#useful-features-for-modders)
- [Kiedy używać Diag Menu](#when-to-use-the-diag-menu)
- [Częste błędy](#common-mistakes)
- [Następne kroki](#next-steps)

---

## Czym jest Diag Menu?

Diag Menu to hierarchiczne menu debugowania wbudowane w diagnostyczny plik wykonywalny DayZ. Zawiera opcje używane do debugowania skryptów gry i zasobów w siedmiu głównych kategoriach: Statystyki, Enfusion Renderer, Enfusion World, DayZ Render, Gra, SI i Dźwięki.

Diag Menu **nie jest dostępne** w detalicznym pliku wykonywalnym DayZ (`DayZ_x64.exe`). Musisz użyć `DayZDiag_x64.exe` -- wersji diagnostycznej, która jest dostarczana obok wersji detalicznej w katalogu instalacji DayZ lub w katalogach DayZ Server.

---

## Jak uzyskać dostęp

### Wymagania

- **DayZDiag_x64.exe** -- Diagnostyczny plik wykonywalny. Znajduje się w folderze instalacji DayZ obok zwykłego `DayZ_x64.exe`.
- Musisz być w grze (nie na ekranie ładowania). Menu jest dostępne w każdym widoku 3D.

### Otwieranie menu

Naciśnij **Win + Alt**, aby otworzyć Diag Menu.

Alternatywny skrót to **Ctrl + Win**, ale koliduje on ze skrótem systemowym Windows 11 i nie jest zalecany na tej platformie.

### Włączanie kursora myszy

Niektóre opcje Diag Menu wymagają interakcji z ekranem za pomocą myszy. Kursor myszy można przełączać naciskając:

**LCtrl + Numpad 9**

To przypisanie klawisza jest zarejestrowane przez skrypt (`PluginKeyBinding`).

---

## Sterowanie nawigacją

Po otwarciu Diag Menu:

| Klawisz | Akcja |
|-----|--------|
| **Strzałka w górę / w dół** | Nawigacja między elementami menu |
| **Strzałka w prawo** | Wejście do podmenu lub przełączanie wartości opcji |
| **Strzałka w lewo** | Przełączanie wartości opcji w odwrotnym kierunku |
| **Backspace** | Opuszczenie bieżącego podmenu (cofnięcie o jeden poziom) |

Gdy opcje pokazują wiele wartości, są wymienione w kolejności, w jakiej pojawiają się w menu. Pierwsza opcja jest zazwyczaj domyślna.

---

## Skróty klawiszowe szybkiego dostępu

Te skróty działają w dowolnym momencie podczas uruchomienia DayZDiag, bez potrzeby otwierania menu:

| Skrót | Funkcja |
|----------|----------|
| **LCtrl + Numpad 1** | Przełącz licznik FPS |
| **LCtrl + Numpad 9** | Przełącz kursor myszy na ekranie |
| **RCtrl + RAlt + W** | Przełącz tryb debugowania renderowania |
| **LCtrl + LAlt + P** | Przełącz efekty postprocessingu |
| **LAlt + Numpad 6** | Przełącz wizualizację ciał fizycznych |
| **Page Up** | Wolna kamera: przełącz ruch gracza |
| **Page Down** | Wolna kamera: zamroź/odmroź kamerę |
| **Insert** | Teleportuj gracza na pozycję kursora (w trybie wolnej kamery) |
| **Home** | Przełącz wolną kamerę / wyłącz i teleportuj gracza do kursora |
| **Numpad /** | Przełącz wolną kamerę (bez teleportacji) |
| **End** | Wyłącz wolną kamerę (powrót do kamery gracza) |

> **Uwaga:** Wszelkie wzmianki o "Cheat Inputs" w oficjalnej dokumentacji odnoszą się do danych wejściowych zakodowanych po stronie C++, niedostępnych przez skrypt.

---

## Przegląd kategorii menu

Diag Menu zawiera siedem kategorii najwyższego poziomu:

1. **Statystyki** -- Licznik FPS i profiler skryptów
2. **Enfusion Renderer** -- Oświetlenie, cienie, materiały, okluzja, postprocessing, teren, widżety
3. **Enfusion World** -- Wizualizacja i debug silnika fizyki (Bullet)
4. **DayZ Render** -- Renderowanie nieba, diagnostyka geometrii
5. **Gra** -- Pogoda, wolna kamera, pojazdy, walka, Centralna Ekonomia, dźwięki powierzchni
6. **SI** -- Siatka nawigacji, wyszukiwanie ścieżek, zachowanie agentów SI
7. **Dźwięki** -- Debug odtwarzanych próbek, informacje o systemie dźwiękowym

---

## Statystyki

### Struktura menu

```
Statistics
  FPS                              [LCtrl + Numpad 1]
  Script profiler UI
  > Script profiler settings
      Always enabled
      Flags
      Module
      Update interval
      Average
      Time resolution
      (UI) Scale
```

### FPS

Włącza licznik FPS w lewym górnym rogu ekranu.

Wartość FPS jest obliczana na podstawie czasu między ostatnimi 10 klatkami, więc odzwierciedla krótką średnią kroczącą, a nie odczyt chwilowy.

### Script Profiler UI

Włącza ekranowy Profiler Skryptów, który wyświetla dane o wydajności wykonywania skryptów w czasie rzeczywistym.

Profiler pokazuje sześć sekcji danych:

| Sekcja | Co pokazuje |
|---------|---------------|
| **Time per class** | Łączny czas wszystkich wywołań funkcji należących do klasy (top 20) |
| **Time per function** | Łączny czas wszystkich wywołań konkretnej funkcji (top 20) |
| **Class allocations** | Liczba alokacji klasy (top 20) |
| **Count per function** | Ile razy funkcja została wywołana (top 20) |
| **Class count** | Liczba żywych instancji klasy (top 40) |
| **Stats and settings** | Bieżąca konfiguracja profilera i liczniki klatek |

Panel Stats and settings pokazuje:

| Pole | Znaczenie |
|-------|---------|
| UI enabled (DIAG) | Czy interfejs profilera skryptów jest aktywny |
| Profiling enabled (SCRP) | Czy profilowanie działa nawet gdy UI nie jest aktywne |
| Profiling enabled (SCRC) | Czy profilowanie faktycznie się odbywa |
| Flags | Bieżące flagi zbierania danych |
| Module | Aktualnie profilowany moduł |
| Interval | Bieżący interwał aktualizacji |
| Time Resolution | Bieżąca rozdzielczość czasowa |
| Average | Czy wyświetlane wartości to średnie |
| Game Frame | Łączna liczba klatek, które minęły |
| Session Frame | Łączna liczba klatek w tej sesji profilowania |
| Total Frames | Łączna liczba klatek we wszystkich sesjach profilowania |
| Profiled Sess Frms | Klatki sprofilowane w tej sesji |
| Profiled Frames | Klatki sprofilowane we wszystkich sesjach |

> **Ważne:** Profiler Skryptów profiluje tylko kod skryptowy. Metody Proto (powiązane z silnikiem) nie są mierzone jako osobne wpisy, ale czas ich wykonywania jest uwzględniony w łącznym czasie metody skryptowej, która je wywołuje.

> **Ważne:** API EnProfiler oraz sam profiler skryptów są dostępne tylko w pliku wykonywalnym diagnostycznym.

### Ustawienia Profilera Skryptów

Te ustawienia kontrolują sposób zbierania danych profilowania. Mogą być również dostosowywane programowo przez API `EnProfiler` (udokumentowane w `EnProfiler.c`).

#### Always Enabled

Zbieranie danych profilowania nie jest domyślnie włączone. Ten przełącznik pokazuje, czy jest ono aktualnie aktywne.

Aby włączyć profilowanie przy starcie, użyj parametru uruchomieniowego `-profile`.

Interfejs Profilera Skryptów ignoruje to ustawienie -- zawsze wymusza profilowanie, gdy UI jest widoczne. Po wyłączeniu UI profilowanie zatrzymuje się ponownie (chyba że "Always enabled" jest ustawione na true).

#### Flags

Kontroluje sposób zbierania danych. Dostępne są cztery kombinacje:

| Kombinacja flag | Zakres | Czas życia danych |
|-----------------|-------|---------------|
| `SPF_RESET \| SPF_RECURSIVE` | Wybrany moduł + potomne | Na klatkę (reset co klatkę) |
| `SPF_RECURSIVE` | Wybrany moduł + potomne | Akumulowane między klatkami |
| `SPF_RESET` | Tylko wybrany moduł | Na klatkę (reset co klatkę) |
| `SPF_NONE` | Tylko wybrany moduł | Akumulowane między klatkami |

- **SPF_RECURSIVE**: Włącza profilowanie modułów potomnych (rekursywnie)
- **SPF_RESET**: Czyści dane na końcu każdej klatki

#### Module

Wybiera, który moduł skryptowy profilować:

| Opcja | Warstwa skryptów |
|--------|-------------|
| CORE | 1_Core |
| GAMELIB | 2_GameLib |
| GAME | 3_Game |
| WORLD | 4_World |
| MISSION | 5_Mission |
| MISSION_CUSTOM | init.c |

#### Update Interval

Liczba klatek do odczekania przed aktualizacją posortowanego wyświetlania danych. Opóźnia to również reset powodowany przez `SPF_RESET`.

Dostępne wartości: 0, 5, 10, 20, 30, 50, 60, 120, 144

#### Average

Włącza lub wyłącza wyświetlanie wartości średnich.

- Z `SPF_RESET` i bez interwału: wartości to surowe wartości na klatkę
- Bez `SPF_RESET`: dzieli akumulowaną wartość przez liczbę klatek sesji
- Z ustawionym interwałem: dzieli przez interwał

Liczba klas nigdy nie jest uśredniana -- zawsze pokazuje bieżącą liczbę instancji. Alokacje pokażą średnią liczbę utworzeń instancji.

#### Time Resolution

Ustawia jednostkę czasu do wyświetlania. Wartość reprezentuje mianownik (n-ta część sekundy):

| Wartość | Jednostka |
|-------|------|
| 1 | Sekundy |
| 1000 | Milisekundy |
| 1000000 | Mikrosekundy |

Dostępne wartości: 1, 10, 100, 1000, 10000, 100000, 1000000

#### (UI) Scale

Dostosowuje wizualną skalę ekranowego wyświetlacza profilera dla różnych rozmiarów ekranu i rozdzielczości.

Zakres: 0.5 do 1.5 (domyślnie: 1.0, krok: 0.05)

---

## Enfusion Renderer

### Struktura menu

```
Enfusion Renderer
  Lights
  > Lighting
      Ambient lighting
      Ground lighting
      Directional lighting
      Bidirectional lighting
      Specular lighting
      Reflection
      Emission lighting
  Shadows
  Terrain shadows
  Render debug mode                [RCtrl + RAlt + W]
  Occluders
  Occlude entities
  Occlude proxies
  Show occluder volumes
  Show active occluders
  Show occluded
  Widgets
  Postprocess                      [LCtrl + LAlt + P]
  Terrain
  > Materials
      Common, TreeTrunk, TreeCrown, Grass, Basic, Normal,
      Super, Skin, Multi, Old Terrain, Old Roads, Water,
      Sky, Sky clouds, Sky stars, Sky flares,
      Particle Sprite, Particle Streak
```

### Lights

Przełącza rzeczywiste źródła światła (takie jak `PersonalLight` lub przedmioty w grze jak latarki). Nie wpływa na oświetlenie środowiskowe -- do tego służy podmenu Lighting.

### Podmenu Lighting

Każdy przełącznik kontroluje konkretny komponent oświetlenia:

| Opcja | Efekt po wyłączeniu |
|--------|---------------------|
| **Ambient lighting** | Usuwa ogólne oświetlenie otoczenia w scenie |
| **Ground lighting** | Usuwa światło odbite od ziemi (widoczne na dachach, pod ramionami postaci) |
| **Directional lighting** | Usuwa główne światło kierunkowe (słońce/księżyc). Wyłącza również oświetlenie dwukierunkowe |
| **Bidirectional lighting** | Usuwa komponent światła dwukierunkowego |
| **Specular lighting** | Usuwa odbicia lustrzane (widoczne na błyszczących powierzchniach jak szafki, samochody) |
| **Reflection** | Usuwa oświetlenie refleksyjne (widoczne na metalicznych/gładkich powierzchniach) |
| **Emission lighting** | Usuwa emisję (samoświecenie) z materiałów |

Te przełączniki są przydatne do izolowania poszczególnych składowych oświetlenia podczas debugowania problemów wizualnych w niestandardowych modelach lub scenach.

### Shadows

Włącza lub wyłącza renderowanie cieni. Wyłączenie usuwa również przycinanie deszczu wewnątrz obiektów (deszcz będzie padać przez dachy).

### Terrain Shadows

Kontroluje sposób generowania cieni terenu.

Opcje: `on (slice)`, `on (full)`, `no update`, `disabled`

### Render Debug Mode

Przełącza między trybami wizualizacji renderowania do inspekcji geometrii siatki w grze.

Opcje: `normal`, `wire`, `wire only`, `overdraw`, `overdrawZ`

Różne materiały wyświetlają się w różnych kolorach siatki drucianej:

| Materiał | Kolor (RGB) |
|----------|-------------|
| TreeTrunk | 179, 126, 55 |
| TreeCrown | 143, 227, 94 |
| Grass | 41, 194, 53 |
| Basic | 208, 87, 87 |
| Normal | 204, 66, 107 |
| Super | 234, 181, 181 |
| Skin | 252, 170, 18 |
| Multi | 143, 185, 248 |
| Terrain | 255, 127, 127 |
| Water | 51, 51, 255 |
| Ocean | 51, 128, 255 |
| Sky | 143, 185, 248 |

### Occluders

Zestaw przełączników dla systemu okluzji:

| Opcja | Efekt |
|--------|--------|
| **Occluders** | Włącz/wyłącz okluzję obiektów |
| **Occlude entities** | Włącz/wyłącz okluzję encji |
| **Occlude proxies** | Włącz/wyłącz okluzję proxy |
| **Show occluder volumes** | Robi zrzut i rysuje kształty debug wizualizujące objętości okluzji |
| **Show active occluders** | Pokazuje aktualnie aktywne okluzje za pomocą kształtów debug |
| **Show occluded** | Wizualizuje okluzowane obiekty za pomocą kształtów debug |

### Widgets

Włącza lub wyłącza renderowanie wszystkich widżetów UI. Przydatne do robienia czystych zrzutów ekranu lub izolowania problemów z renderowaniem.

### Postprocess

Włącza lub wyłącza efekty post-processingu (bloom, korekcja kolorów, winieta itp.).

### Terrain

Włącza lub wyłącza renderowanie terenu w całości.

### Podmenu Materials

Przełącza renderowanie określonych typów materiałów. Większość jest oczywista. Godne uwagi wpisy:

- **Super** -- Nadrzędny przełącznik obejmujący każdy materiał związany z shaderem "super"
- **Old Terrain** -- Obejmuje zarówno materiały Terrain, jak i Terrain Simple
- **Water** -- Obejmuje każdy materiał związany z wodą (ocean, brzeg, rzeki)

---

## Enfusion World (Fizyka)

### Struktura menu

```
Enfusion World
  Show Bullet
  > Bullet
      Draw Char Ctrl
      Draw Simple Char Ctrl
      Max. Collider Distance
      Draw Bullet shape
      Draw Bullet wireframe
      Draw Bullet shape AABB
      Draw obj center of mass
      Draw Bullet contacts
      Force sleep Bullet
      Show stats
  Show bodies                      [LAlt + Numpad 6]
```

> **Uwaga:** "Bullet" tutaj odnosi się do silnika fizyki Bullet, nie do amunicji.

### Show Bullet

Włącza wizualizację debugowania dla silnika fizyki Bullet.

### Podmenu Bullet

| Opcja | Opis |
|--------|-------------|
| **Draw Char Ctrl** | Wizualizacja kontrolera postaci gracza. Zależy od "Draw Bullet shape" |
| **Draw Simple Char Ctrl** | Wizualizacja kontrolera postaci SI. Zależy od "Draw Bullet shape" |
| **Max. Collider Distance** | Maksymalna odległość od gracza do wizualizacji kolizji (wartości: 0, 1, 2, 5, 10, 20, 50, 100, 200, 500). Domyślnie 0 |
| **Draw Bullet shape** | Wizualizacja kształtów kolizji fizycznych |
| **Draw Bullet wireframe** | Pokaż kolizje jako samą siatkę drucianą. Zależy od "Draw Bullet shape" |
| **Draw Bullet shape AABB** | Pokaż osiowo wyrównane prostokąty ograniczające kolizji |
| **Draw obj center of mass** | Pokaż środki masy obiektów |
| **Draw Bullet contacts** | Wizualizacja kolizji stykających się |
| **Force sleep Bullet** | Wymuś uśpienie wszystkich ciał fizycznych |
| **Show stats** | Pokaż statystyki debug (opcje: disabled, basic, all). Statystyki pozostają widoczne przez 10 sekund po wyłączeniu |

> **Ostrzeżenie:** Max. Collider Distance domyślnie wynosi 0, ponieważ ta wizualizacja jest kosztowna. Ustawienie dużej odległości spowoduje znaczne pogorszenie wydajności.

### Show Bodies

Wizualizacja ciał fizycznych Bullet. Opcje: `disabled`, `only`, `all`

---

## DayZ Render

### Struktura menu

```
DayZ Render
  > Sky
      Space
      Stars
      > Planets
          Sun
          Moon
      Atmosphere
      > Clouds
          Far
          Near
          Physical
      Horizon
      > Post Process
          God Rays
  > Geometry diagnostic
      diagnostic mode
```

### Podmenu Sky

Przełączanie poszczególnych komponentów renderowania nieba:

| Opcja | Co kontroluje |
|--------|-----------------|
| **Space** | Tekstura tła za gwiazdami |
| **Stars** | Renderowanie gwiazd |
| **Sun** | Słońce i jego efekt halo (nie promienie boskie) |
| **Moon** | Księżyc i jego efekt halo (nie promienie boskie) |
| **Atmosphere** | Tekstura atmosfery na niebie |
| **Far (Clouds)** | Górne/odległe chmury. Nie wpływają na promienie świetlne (mniej gęste) |
| **Near (Clouds)** | Dolne/bliższe chmury. Gęstsze i działają jako okluzja dla promieni świetlnych |
| **Physical (Clouds)** | Przestarzałe chmury oparte na obiektach. Usunięte z Chernarus i Livonia w DayZ 1.23 |
| **Horizon** | Renderowanie horyzontu. Horyzont blokuje promienie świetlne |
| **God Rays** | Efekt post-processingu promieni świetlnych |

### Geometry Diagnostic

Włącza rysowanie kształtów debug do wizualizacji wyglądu geometrii obiektu w grze.

Typy geometrii: `normal`, `roadway`, `geometry`, `viewGeometry`, `fireGeometry`, `paths`, `memory`, `wreck`

Tryby rysowania: `solid+wire`, `Zsolid+wire`, `wire`, `ZWire`, `geom only`

Jest to niezwykle przydatne dla modderów tworzących niestandardowe modele -- możesz zweryfikować, czy twoja geometria ognia, geometria widoku i punkty pamięci są prawidłowo skonfigurowane bez wychodzenia z gry.

---

## Gra

### Struktura menu

```
Game
  > Weather & environment
      Display
      Force fog at camera
      Override fog
        Distance density
        Height density
        Distance offset
        Height bias
  Free Camera
    FrCam Player Move              [Page Up]
    FrCam NoClip
    FrCam Freeze                   [Page Down]
  > Vehicles
      Audio
      Simulation
  > Combat
      DECombat
      DEShots
      DEHitpoints
      DEExplosions
  > Legacy/obsolete
      DEAmbient
      DELight
  DESurfaceSound
  > Central Economy
      > Loot Spawn Edit
          Spawn Volume Vis
          Setup Vis
          Edit Volume
          Re-Trace Group Points
          Spawn Candy
          Spawn Rotation Test
          Placement Test
          Export Group
          Export All Groups
          Export Map
          Export Clusters
          Export Economy [csv]
          Export Respawn Queue [csv]
      > Loot Tool
          Deplete Lifetime
          Set Damage = 1.0
          Damage + Deplete
          Invert Avoidance
          Project Target Loot
      > Infected
          Infected Vis
          Infected Zone Info
          Infected Spawn
          Reset Cleanup
      > Animal
          Animal Vis
          Animal Spawn
          Ambient Spawn
      > Building
          Building Stats
      Vehicle&Wreck Vis
      Loot Vis
      Cluster Vis
      Dynamic Events Status
      Dynamic Events Vis
      Dynamic Events Spawn
      Export Dyn Event
      Overall Stats
      Updaters State
      Idle Mode
      Force Save
```

### Weather & Environment

Funkcjonalność debugowania systemu pogodowego.

#### Display

Włącza wizualizację debugowania pogody. Pokazuje ekranowy debug mgły/zasięgu widzenia i otwiera osobne okno w czasie rzeczywistym ze szczegółowymi danymi pogodowymi.

Aby włączyć osobne okno podczas pracy jako serwer, użyj parametru uruchomieniowego `-debugweather`.

Ustawienia okna są przechowywane w profilach jako `weather_client_imgui.ini` / `weather_client_imgui.bin` (lub `weather_server_*` dla serwerów).

#### Force Fog at Camera

Wymusza dopasowanie wysokości mgły do wysokości kamery gracza. Ma priorytet nad ustawieniem Height bias.

#### Override Fog

Włącza nadpisywanie wartości mgły ręcznymi ustawieniami:

| Parametr | Zakres | Krok |
|-----------|-------|------|
| Distance density | 0 -- 1 | 0.01 |
| Height density | 0 -- 1 | 0.01 |
| Distance offset | 0 -- 1 | 0.01 |
| Height bias | -500 -- 500 | 5 |

### Wolna kamera

Wolna kamera odłącza widok od postaci gracza i pozwala latać po świecie. Jest to jedno z najbardziej przydatnych narzędzi debug dla modderów.

#### Sterowanie wolną kamerą

| Klawisz | Źródło | Funkcja |
|-----|--------|----------|
| **W / A / S / D** | Inputs (xml) | Ruch do przodu / w lewo / do tyłu / w prawo |
| **Q** | Inputs (xml) | Ruch w górę |
| **Z** | Inputs (xml) | Ruch w dół |
| **Mysz** | Inputs (xml) | Rozglądanie się |
| **Kółko myszy w górę** | Inputs (C++) | Zwiększ prędkość |
| **Kółko myszy w dół** | Inputs (C++) | Zmniejsz prędkość |
| **Spacja** | Cheat Inputs (C++) | Przełącz ekranowy debug namierzonego obiektu |
| **Ctrl / Shift** | Cheat Inputs (C++) | Bieżąca prędkość x 10 |
| **Alt** | Cheat Inputs (C++) | Bieżąca prędkość / 10 |
| **End** | Cheat Inputs (C++) | Wyłącz wolną kamerę (powrót do gracza) |
| **Enter** | Cheat Inputs (C++) | Połącz kamerę z namierzonym obiektem |
| **Page Up** | Cheat Inputs (C++) | Przełącz ruch gracza w trybie wolnej kamery |
| **Page Down** | Cheat Inputs (C++) | Zamroź/odmroź pozycję kamery |
| **Insert** | PluginKeyBinding (Script) | Teleportuj gracza na pozycję kursora |
| **Home** | PluginKeyBinding (Script) | Przełącz wolną kamerę / wyłącz i teleportuj do kursora |
| **Numpad /** | PluginKeyBinding (Script) | Przełącz wolną kamerę (bez teleportacji) |

#### Opcje wolnej kamery

| Opcja | Opis |
|--------|-------------|
| **FrCam Player Move** | Włącz/wyłącz ruchy gracza (WASD) podczas wolnej kamery |
| **FrCam NoClip** | Włącz/wyłącz przechodzenie kamery przez teren |
| **FrCam Freeze** | Włącz/wyłącz ruchy kamery |

### Vehicles

Rozszerzona funkcjonalność debugowania pojazdów. Działają tylko gdy gracz jest wewnątrz pojazdu.

- **Audio** -- Otwiera osobne okno do dostrajania ustawień dźwięku w czasie rzeczywistym. Zawiera wizualizację kontrolerów audio.
- **Simulation** -- Otwiera osobne okno z debugiem symulacji samochodu: dostrajanie parametrów fizyki i wizualizacja.

### Combat

Narzędzia debug do walki, strzelania i punktów trafień:

| Opcja | Opis |
|--------|-------------|
| **DECombat** | Pokazuje tekst na ekranie z odległościami do samochodów, SI i graczy |
| **DEShots** | Podmenu debugowania pocisków (patrz poniżej) |
| **DEHitpoints** | Wyświetla DamageSystem gracza i obiektu, na który patrzy |
| **DEExplosions** | Pokazuje dane penetracji eksplozji. Liczby pokazują wartości spowolnienia. Czerwony krzyżyk = zatrzymany. Zielony krzyżyk = przeniknął |

**Podmenu DEShots:**

| Opcja | Opis |
|--------|-------------|
| Clear vis. | Wyczyść istniejącą wizualizację strzałów |
| Vis. trajectory | Prześledź tor lotu strzału, pokazując punkty wyjścia i punkt zatrzymania |
| Always Deflect | Wymusza rykoszet wszystkich strzałów wystrzelonych przez klienta |

### Legacy/Obsolete

- **DEAmbient** -- Wyświetla zmienne wpływające na dźwięki otoczenia
- **DELight** -- Wyświetla statystyki dotyczące bieżącego środowiska oświetleniowego

### DESurfaceSound

Wyświetla typ powierzchni, na której stoi gracz, oraz typ tłumienia.

### Centralna Ekonomia

Kompleksowy zestaw narzędzi debugowania dla systemu Centralnej Ekonomii (CE).

> **Ważne:** Większość opcji debugowania CE działa tylko w grze jednoosobowej z włączonym CE. Tylko "Building Stats" działa w środowisku wieloosobowym lub gdy CE jest wyłączone.

> **Uwaga:** Wiele z tych funkcji jest również dostępnych przez `CEApi` w skrypcie (`CentralEconomy.c`).

#### Loot Spawn Edit

Narzędzia do tworzenia i edycji punktów spawnu łupu na obiektach. Wolna kamera musi być włączona, aby użyć narzędzia Edit Volume.

| Opcja | Opis | Odpowiednik skryptowy |
|--------|-------------|-------------------|
| **Spawn Volume Vis** | Wizualizacja punktów spawnu łupu. Opcje: Off, Adaptive, Volume, Occupied | `GetCEApi().LootSetSpawnVolumeVisualisation()` |
| **Setup Vis** | Pokaż właściwości konfiguracji CE na ekranie z kolorowymi kontenerami | `GetCEApi().LootToggleSpawnSetup()` |
| **Edit Volume** | Interaktywny edytor punktów łupu (wymaga wolnej kamery) | `GetCEApi().LootToggleVolumeEditing()` |
| **Re-Trace Group Points** | Ponowne śledzenie punktów łupu, aby naprawić problemy z lewitacją | `GetCEApi().LootRetraceGroupPoints()` |
| **Spawn Candy** | Spawnuj łup we wszystkich punktach spawnu wybranej grupy | -- |
| **Spawn Rotation Test** | Testuj flagi rotacji na pozycji kursora | -- |
| **Placement Test** | Wizualizacja rozmieszczenia za pomocą cylindra sfery | -- |
| **Export Group** | Eksportuj wybraną grupę do `storage/export/mapGroup_CLASSNAME.xml` | `GetCEApi().LootExportGroup()` |
| **Export All Groups** | Eksportuj wszystkie grupy do `storage/export/mapgroupproto.xml` | `GetCEApi().LootExportAllGroups()` |
| **Export Map** | Generuj `storage/export/mapgrouppos.xml` | `GetCEApi().LootExportMap()` |
| **Export Clusters** | Generuj `storage/export/mapgroupcluster.xml` | `GetCEApi().ExportClusterData()` |
| **Export Economy [csv]** | Eksportuj ekonomię do `storage/log/economy.csv` | `GetCEApi().EconomyLog(EconomyLogCategories.Economy)` |
| **Export Respawn Queue [csv]** | Eksportuj kolejkę respawnu do `storage/log/respawn_queue.csv` | `GetCEApi().EconomyLog(EconomyLogCategories.RespawnQueue)` |

**Przypisania klawiszy Edit Volume:**

| Klawisz | Funkcja |
|-----|----------|
| **[** | Iteruj wstecz przez kontenery |
| **]** | Iteruj do przodu przez kontenery |
| **LMB** | Wstaw nowy punkt |
| **RMB** | Usuń punkt |
| **;** | Zwiększ rozmiar punktu |
| **'** | Zmniejsz rozmiar punktu |
| **Insert** | Spawnuj łup w punkcie |
| **M** | Spawnuj 48 "AmmoBox_762x54_20Rnd" |
| **Backspace** | Oznacz pobliski łup do usunięcia (wyczerpuje czas życia, nie natychmiast) |

#### Loot Tool

| Opcja | Opis | Odpowiednik skryptowy |
|--------|-------------|-------------------|
| **Deplete Lifetime** | Wyczerpuje czas życia do 3 sekund (zaplanowany do usunięcia) | `GetCEApi().LootDepleteLifetime()` |
| **Set Damage = 1.0** | Ustawia zdrowie na 0 | `GetCEApi().LootSetDamageToOne()` |
| **Damage + Deplete** | Wykonuje obie powyższe operacje | `GetCEApi().LootDepleteAndDamage()` |
| **Invert Avoidance** | Przełącza unikanie gracza (wykrywanie pobliskich graczy) | -- |
| **Project Target Loot** | Emuluje spawnowanie namierzonego przedmiotu, generuje obrazy i logi. Wymaga włączonego "Loot Vis" | `GetCEApi().SpawnAnalyze()` i `GetCEApi().EconomyMap()` |

#### Infected

| Opcja | Opis | Odpowiednik skryptowy |
|--------|-------------|-------------------|
| **Infected Vis** | Wizualizacja stref zombie, lokalizacji, statusu żywy/martwy | `GetCEApi().InfectedToggleVisualisation()` |
| **Infected Zone Info** | Ekranowy debug, gdy kamera jest wewnątrz strefy zarażonych | `GetCEApi().InfectedToggleZoneInfo()` |
| **Infected Spawn** | Spawnuj zarażonych w wybranej strefie (lub "InfectedArmy" na kursorze) | `GetCEApi().InfectedSpawn()` |
| **Reset Cleanup** | Ustawia timer czyszczenia na 3 sekundy | `GetCEApi().InfectedResetCleanup()` |

#### Animal

| Opcja | Opis | Odpowiednik skryptowy |
|--------|-------------|-------------------|
| **Animal Vis** | Wizualizacja stref zwierząt, lokalizacji, statusu żywy/martwy | `GetCEApi().AnimalToggleVisualisation()` |
| **Animal Spawn** | Spawnuj zwierzę w wybranej strefie (lub "AnimalGoat" na kursorze) | `GetCEApi().AnimalSpawn()` |
| **Ambient Spawn** | Spawnuj "AmbientHen" na celu kursora | `GetCEApi().AnimalAmbientSpawn()` |

#### Building

**Building Stats** pokazuje ekranowy debug o stanach drzwi budynków:

- Lewa strona: czy każde drzwi są otwarte/zamknięte i wolne/zablokowane
- Środek: statystyki dotyczące `buildings.bin` (trwałość budynków)

Randomizacja drzwi używa wartości konfiguracyjnej `initOpened`. Gdy `rand < initOpened`, drzwi spawnują się otwarte (więc `initOpened=0` oznacza, że drzwi nigdy nie spawnują się otwarte).

Typowe konfiguracje `<building/>` w economy.xml:

| Konfiguracja | Zachowanie |
|-------|----------|
| `init="0" load="0" respawn="0" save="0"` | Brak trwałości, brak randomizacji, domyślny stan po restarcie |
| `init="1" load="0" respawn="0" save="0"` | Brak trwałości, drzwi losowane przez initOpened |
| `init="1" load="1" respawn="0" save="1"` | Zapisuje tylko zablokowane drzwi, drzwi losowane przez initOpened |
| `init="0" load="1" respawn="0" save="1"` | Pełna trwałość, zapisuje dokładny stan drzwi, brak randomizacji |

#### Inne narzędzia Centralnej Ekonomii

| Opcja | Opis | Odpowiednik skryptowy |
|--------|-------------|-------------------|
| **Vehicle&Wreck Vis** | Wizualizacja obiektów zarejestrowanych w unikaniu "Vehicle". Żółty = Samochód, Różowy = Wraki (Building), Niebieski = InventoryItem | `GetCEApi().ToggleVehicleAndWreckVisualisation()` |
| **Loot Vis** | Ekranowe dane ekonomii dla wszystkiego, na co patrzysz (łup, zarażeni, dynamiczne wydarzenia) | `GetCEApi().ToggleLootVisualisation()` |
| **Cluster Vis** | Ekranowe statystyki trajektorii DE | `GetCEApi().ToggleClusterVisualisation()` |
| **Dynamic Events Status** | Ekranowe statystyki DE | `GetCEApi().ToggleDynamicEventStatus()` |
| **Dynamic Events Vis** | Wizualizacja i edycja punktów spawnu DE | `GetCEApi().ToggleDynamicEventVisualisation()` |
| **Dynamic Events Spawn** | Spawnuj dynamiczne wydarzenie w najbliższym punkcie lub "StaticChristmasTree" jako zapasowy | `GetCEApi().DynamicEventSpawn()` |
| **Export Dyn Event** | Eksportuj punkty DE do `storage/export/eventSpawn_CLASSNAME.xml` | `GetCEApi().DynamicEventExport()` |
| **Overall Stats** | Ekranowe statystyki CE | `GetCEApi().ToggleOverallStats()` |
| **Updaters State** | Pokazuje, co CE aktualnie przetwarza | -- |
| **Idle Mode** | Usypia CE (zatrzymuje przetwarzanie) | -- |
| **Force Save** | Wymusza zapis całego folderu `storage/data` (wyklucza bazę danych graczy) | -- |

**Przypisania klawiszy Dynamic Events Vis:**

| Klawisz | Funkcja |
|-----|----------|
| **[** | Iteruj wstecz przez dostępne DE |
| **]** | Iteruj do przodu przez dostępne DE |
| **LMB** | Wstaw nowy punkt dla wybranego DE |
| **RMB** | Usuń punkt najbliższy kursorowi |
| **MMB** | Przytrzymaj lub kliknij, aby obrócić kąt |

---

## SI

### Struktura menu

```
AI
  Show NavMesh
  Debug Pathgraph World
  Debug Path Agent
  Debug AI Agent
```

> **Ważne:** Debugowanie SI obecnie nie działa w środowisku wieloosobowym.

### Show NavMesh

Rysuje kształty debug do wizualizacji siatki nawigacyjnej. Pokazuje ekranowy debug ze statystykami.

| Klawisz | Funkcja |
|-----|----------|
| **Numpad 0** | Zarejestruj "Test start" na pozycji kamery |
| **Numpad 1** | Regeneruj kafelek na pozycji kamery |
| **Numpad 2** | Regeneruj kafelki wokół pozycji kamery |
| **Numpad 3** | Iteruj do przodu przez typy wizualizacji |
| **LAlt + Numpad 3** | Iteruj wstecz przez typy wizualizacji |
| **Numpad 4** | Zarejestruj "Test end" na pozycji kamery. Rysuje sfery i linię między startem a końcem. Zielony = znaleziono ścieżkę, Czerwony = brak ścieżki |
| **Numpad 5** | Test najbliższej pozycji NavMesh (SamplePosition). Niebieska sfera = zapytanie, różowa sfera = wynik |
| **Numpad 6** | Test raycast NavMesh. Niebieska sfera = zapytanie, różowa sfera = wynik |

### Debug Pathgraph World

Ekranowy debug pokazujący, ile żądań zadań ścieżek zostało ukończonych i ile jest aktualnie oczekujących.

### Debug Path Agent

Ekranowy debug i kształty debug dla ścieżkowania SI. Namierz encję SI, aby ją śledzić. Użyj tego, gdy jesteś konkretnie zainteresowany sposobem, w jaki SI znajduje swoją ścieżkę.

### Debug AI Agent

Ekranowy debug i kształty debug dla czujności i zachowania SI. Namierz encję SI, aby ją śledzić. Użyj tego, gdy chcesz zrozumieć podejmowanie decyzji i stan świadomości SI.

---

## Dźwięki

### Struktura menu

```
Sounds
  Show playing samples
  Show system info
```

### Show Playing Samples

Wizualizacja debug aktualnie odtwarzanych dźwięków.

| Opcja | Opis |
|--------|-------------|
| **none** | Domyślnie, brak debugowania |
| **ImGui** | Osobne okno (najnowsza iteracja). Obsługuje filtrowanie, pełne pokrycie kategorii. Ustawienia zapisywane jako `playing_sounds_imgui.ini` / `.bin` w profilach |
| **DbgUI** | Starsze. Ma filtrowanie kategorii, bardziej czytelne, ale wychodzi poza ekran i brakuje kategorii pojazdów |
| **Engine** | Starsze. Pokazuje dane w czasie rzeczywistym z kolorowaniem i statystykami, ale wychodzi poza ekran i nie ma legendy kolorów |

### Show System Info

Ekranowe statystyki debug systemu dźwiękowego (liczba buforów, aktywne źródła itp.).

---

## Przydatne funkcje dla modderów

Chociaż każda opcja ma swoje zastosowanie, oto te, po które modderzy sięgają najczęściej:

### Analiza wydajności

1. **Licznik FPS** (LCtrl + Numpad 1) -- Szybkie sprawdzenie, czy twój mod nie niszczy liczby klatek
2. **Profiler Skryptów** -- Znajdź, które z twoich klas lub funkcji zużywają najwięcej czasu procesora. Ustaw moduł na WORLD lub MISSION, aby skupić się na warstwie skryptowej twojego moda

### Debugowanie wizualne

1. **Wolna kamera** -- Lataj dookoła, aby sprawdzić zaspawnowane obiekty, zweryfikować pozycje, obserwować zachowanie SI z dystansu
2. **Diagnostyka geometrii** -- Zweryfikuj geometrię ognia, geometrię widoku, LOD drogi i punkty pamięci swojego niestandardowego modelu bez wychodzenia z gry
3. **Tryb debugowania renderowania** (RCtrl + RAlt + W) -- Zobacz nakładki siatki drucianej, aby sprawdzić gęstość siatki i przypisania materiałów

### Testowanie rozgrywki

1. **Wolna kamera + Insert** -- Teleportuj gracza w dowolne miejsce na mapie natychmiast
2. **Nadpisywanie pogody** -- Wymuś określone warunki mgły, aby przetestować funkcje zależne od widoczności
3. **Narzędzia Centralnej Ekonomii** -- Spawnuj zarażonych, zwierzęta, łup i dynamiczne wydarzenia na żądanie
4. **Debug walki** -- Śledź trajektorie strzałów, sprawdzaj systemy obrażeń punktów trafień, testuj penetrację eksplozji

### Rozwój SI

1. **Show NavMesh** -- Sprawdź, czy SI faktycznie może nawigować tam, gdzie oczekujesz
2. **Debug AI Agent** -- Zobacz, co zarażony lub zwierzę "myśli", jaki ma poziom alertu
3. **Debug Path Agent** -- Zobacz faktyczną ścieżkę, którą podąża SI i czy wyszukiwanie ścieżki się powiodło

---

## Kiedy używać Diag Menu

### Podczas rozwoju

- **Profiler Skryptów** przy optymalizacji kodu wykonywanego co klatkę (OnUpdate, EOnFrame)
- **Wolna kamera** do pozycjonowania obiektów, weryfikacji lokalizacji spawnu, inspekcji rozmieszczenia modeli
- **Diagnostyka geometrii** natychmiast po zaimportowaniu nowego modelu, aby zweryfikować LOD-y i typy geometrii
- **Licznik FPS** jako punkt odniesienia przed i po dodaniu nowych funkcji

### Podczas testowania

- **Debug walki** do weryfikacji obrażeń broni, zachowania pocisków, efektów eksplozji
- **Narzędzia CE** do testowania dystrybucji łupu, punktów spawnu, dynamicznych wydarzeń
- **Debug SI** do weryfikacji, czy zachowanie zarażonych/zwierząt poprawnie reaguje na obecność gracza
- **Debug pogody** do testowania moda w różnych warunkach pogodowych

### Podczas badania błędów

- **Licznik FPS + Profiler Skryptów** gdy gracze zgłaszają problemy z wydajnością
- **Wolna kamera + Spacja** (debug obiektu) do inspekcji obiektów, które nie zachowują się poprawnie
- **Tryb debugowania renderowania** do diagnozowania artefaktów wizualnych lub problemów z materiałami
- **Show Bullet** do debugowania problemów z kolizjami fizyki

---

## Częste błędy

**Używanie detalicznego pliku wykonywalnego.** Diag Menu jest dostępne tylko w `DayZDiag_x64.exe`. Jeśli naciskasz Win+Alt i nic się nie dzieje, używasz wersji detalicznej.

**Zapominanie, że Max. Collider Distance wynosi 0.** Wizualizacja fizyki (Draw Bullet shape) nic nie pokaże, jeśli Max. Collider Distance nadal ma domyślną wartość 0. Ustaw ją na co najmniej 10-20, aby zobaczyć kolizje wokół siebie.

**Narzędzia CE w trybie wieloosobowym.** Większość opcji debugowania Centralnej Ekonomii działa tylko w grze jednoosobowej z włączonym CE. Nie oczekuj, że będą działać na serwerze dedykowanym.

**Debug SI w trybie wieloosobowym.** Debugowanie SI obecnie nie działa w środowisku wieloosobowym. Testuj zachowanie SI w grze jednoosobowej.

**Mylenie "Bullet" z amunicją.** Opcje "Bullet" w kategorii "Enfusion World" odnoszą się do silnika fizyki Bullet, nie do amunicji broni. Debugowanie związane z walką znajduje się w Gra > Combat.

**Pozostawianie włączonego profilera.** Profiler Skryptów ma mierzalny narzut. Wyłącz go po zakończeniu profilowania, aby uzyskać dokładne odczyty FPS.

**Duże wartości odległości kolizji.** Ustawienie Max. Collider Distance na 200 lub 500 mocno obniży liczbę klatek. Używaj najmniejszej wartości, która pokrywa interesujący cię obszar.

**Nie włączanie wymagań wstępnych.** Kilka opcji zależy od wcześniejszego włączenia innych:
- "Draw Char Ctrl" i "Draw Bullet wireframe" zależą od "Draw Bullet shape"
- "Edit Volume" wymaga wolnej kamery
- "Project Target Loot" wymaga włączonego "Loot Vis"

---

## Następne kroki

- **Rozdział 8.6: [Debugowanie i testowanie](06-debugging-testing.md)** -- Logi skryptów, debugowanie Print, patchowanie plików i Workbench
- **Rozdział 8.7: [Publikacja w Workshop](07-publishing-workshop.md)** -- Spakuj i opublikuj swój przetestowany mod
