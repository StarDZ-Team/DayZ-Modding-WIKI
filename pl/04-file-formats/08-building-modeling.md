# Rozdział 4.8: Modelowanie budynków -- Drzwi i drabiny

[Strona główna](../README.md) | [<< Poprzedni: Przewodnik po Workbench](07-workbench-guide.md) | **Modelowanie budynków**

---

## Wprowadzenie

Budynki w DayZ to więcej niż statyczna sceneria. Gracze stale z nimi wchodzą w interakcję -- otwierają drzwi, wspinają się po drabinach, chowają się za ścianami. Tworzenie niestandardowego budynku obsługującego te interakcje wymaga starannej konfiguracji modelu: drzwi potrzebują osi obrotu i nazwanych selekcji w wielu LODach, drabiny potrzebują precyzyjnie rozmieszczonych ścieżek wspinaczki definiowanych w całości przez wierzchołki Memory LOD.

Ten rozdział obejmuje kompletny przepływ pracy dodawania interaktywnych drzwi i drabin do niestandardowych modeli budynków, oparty na oficjalnej dokumentacji Bohemia Interactive.

### Wymagania wstępne

- Działający **Work-drive** ze strukturą folderów niestandardowego moda.
- **Object Builder** (z pakietu DayZ Tools) ze skonfigurowanym **Buldozerem** (podgląd modelu).
- Umiejętność binaryzacji i pakowania plików niestandardowych modów do PBO.
- Znajomość systemu LOD i nazwanych selekcji (omówiona w [Rozdziale 4.2: Modele 3D](02-models.md)).

---

## Spis treści

- [Przegląd](#wprowadzenie)
- [Konfiguracja drzwi](#konfiguracja-drzwi)
  - [Konfiguracja modelu](#konfiguracja-modelu-dla-drzwi)
  - [model.cfg -- Szkielety i animacje](#modelcfg----szkielety-i-animacje)
  - [Konfiguracja gry (config.cpp)](#konfiguracja-gry-configcpp)
  - [Drzwi podwójne](#drzwi-podwójne)
  - [Drzwi przesuwne](#drzwi-przesuwne)
  - [Problemy ze sferą ograniczającą](#problemy-ze-sferą-ograniczającą)
- [Konfiguracja drabin](#konfiguracja-drabin)
  - [Obsługiwane typy drabin](#obsługiwane-typy-drabin)
  - [Nazwane selekcje Memory LOD](#nazwane-selekcje-memory-lod)
  - [Wymagania View Geometry](#wymagania-view-geometry)
  - [Wymiary drabin](#wymiary-drabin)
  - [Przestrzeń kolizji](#przestrzeń-kolizji)
  - [Wymagania konfiguracyjne dla drabin](#wymagania-konfiguracyjne-dla-drabin)
- [Podsumowanie wymagań modelu](#podsumowanie-wymagań-modelu)
- [Dobre praktyki](#dobre-praktyki)
- [Typowe błędy](#typowe-błędy)
- [Odniesienia](#odniesienia)

---

## Konfiguracja drzwi

Interaktywne drzwi wymagają trzech elementów: modelu P3D z poprawnie nazwanymi selekcjami i punktami pamięci, pliku `model.cfg` definiującego szkielet animacji i parametry obrotu, oraz pliku `config.cpp` łączącego drzwi z dźwiękami, strefami uszkodzeń i logiką gry.

### Konfiguracja modelu dla drzwi

Drzwi w modelu P3D muszą zawierać:

1. **Nazwane selekcje we wszystkich odpowiednich LODach.** Geometria reprezentująca drzwi musi być przypisana do nazwanej selekcji (np. `door1`) w każdym z tych LODów:
   - **Resolution LOD** -- wizualna siatka widziana przez gracza.
   - **Geometry LOD** -- fizyczny kształt kolizji. Musi również zawierać nazwaną właściwość `class` z wartością `house`.
   - **View Geometry LOD** -- używany do sprawdzania widoczności i raycastingu akcji. Nazwa selekcji odpowiada tu parametrowi `component` w konfiguracji gry.
   - **Fire Geometry LOD** -- używany do detekcji trafień balistycznych.

2. **Wierzchołki Memory LOD** definiujące:
   - **Oś obrotu** -- Dwa wierzchołki tworzące oś obrotu, przypisane do nazwanej selekcji jak `door1_axis`. Ta oś definiuje linię zawiasu, wokół której drzwi się obracają.
   - **Pozycja dźwięku** -- Wierzchołek przypisany do nazwanej selekcji jak `door1_action`, oznaczający miejsce pochodzenia dźwięków drzwi.
   - **Pozycja widgetu akcji** -- Gdzie widget interakcji jest wyświetlany graczowi.

#### Zalecane wymiary drzwi

Prawie wszystkie drzwi w vanilla DayZ mają **120 x 220 cm** (szerokość x wysokość). Użycie tych standardowych wymiarów zapewnia, że animacje wyglądają poprawnie, a postacie naturalnie przechodzą przez otwory. Modeluj drzwi **domyślnie zamknięte** i animuj je do pozycji otwartej -- Bohemia planuje w przyszłości obsługę otwierania drzwi w obu kierunkach.

### model.cfg -- Szkielety i animacje

Każde animowane drzwi wymagają pliku `model.cfg`. Ta konfiguracja definiuje strukturę kości (szkielet) i parametry animacji. Umieść `model.cfg` blisko pliku modelu lub wyżej w strukturze folderów -- dokładna lokalizacja jest elastyczna, o ile binaryzator może go znaleźć.

`model.cfg` ma dwie sekcje:

#### CfgSkeletons

Definiuje animowane kości. Każde drzwi otrzymują wpis kości. Kości są wymienione parami: nazwa kości, po której następuje rodzic (pusty ciąg `""` dla kości na poziomie głównym).

```cpp
class CfgSkeletons
{
    class Default
    {
        isDiscrete = 1;
        skeletonInherit = "";
        skeletonBones[] = {};
    };
    class Skeleton_2door: Default
    {
        skeletonInherit = "Default";
        skeletonBones[] =
        {
            "door1", "",
            "door2", ""
        };
    };
};
```

#### CfgModels

Definiuje animacje dla każdej kości. Nazwa klasy pod `CfgModels` **musi odpowiadać nazwie pliku modelu** (bez rozszerzenia), aby powiązanie działało.

```cpp
class CfgModels
{
    class Default
    {
        sectionsInherit = "";
        sections[] = {};
        skeletonName = "";
    };
    class yourmodelname: Default
    {
        skeletonName = "Skeleton_2door";
        class Animations
        {
            class Door1
            {
                type = "rotation";
                selection = "door1";
                source = "door1";
                axis = "door1_axis";
                memory = 1;
                minValue = 0;
                maxValue = 1;
                angle0 = 0;
                angle1 = 1.4;
            };
            class Door2
            {
                type = "rotation";
                selection = "door2";
                source = "door2";
                axis = "door2_axis";
                memory = 1;
                minValue = 0;
                maxValue = 1;
                angle0 = 0;
                angle1 = -1.4;
            };
        };
    };
};
```

**Wyjaśnienie kluczowych parametrów:**

| Parametr | Opis |
|----------|------|
| `type` | Typ animacji. Użyj `"rotation"` dla drzwi obrotowych, `"translation"` dla drzwi przesuwnych. |
| `selection` | Nazwana selekcja w modelu, która ma być animowana. |
| `source` | Łączy z klasą `Doors` w konfiguracji gry. Musi odpowiadać nazwie klasy w `config.cpp`. |
| `axis` | Nazwana selekcja w Memory LOD definiująca oś obrotu (dwa wierzchołki). |
| `memory` | Ustaw na `1`, aby wskazać, że oś jest zdefiniowana w Memory LOD. |
| `minValue` / `maxValue` | Zakres fazy animacji. Zwykle od `0` do `1`. |
| `angle0` / `angle1` | Kąty obrotu w **radianach**. `angle1` definiuje jak daleko drzwi się otwierają. Użyj wartości ujemnych, aby odwrócić kierunek. Wartość `1.4` radiana to około 80 stopni. |

#### Weryfikacja w Buldozerze

Po napisaniu `model.cfg` otwórz swój model w Object Builder z uruchomionym Buldozerem. Użyj klawiszy `[` i `]` do przełączania dostępnych źródeł animacji, a `;` / `'` (lub kółka myszy w górę/dół) do przewijania animacji. To pozwala zweryfikować, czy drzwi obracają się prawidłowo na swojej osi.

### Konfiguracja gry (config.cpp)

Konfiguracja gry łączy animowany model z systemami gry -- dźwiękami, uszkodzeniami i logiką stanu drzwi. Nazwa klasy konfiguracji **musi** odpowiadać wzorcowi `land_modelname`, aby powiązanie działało poprawnie.

```cpp
class CfgPatches
{
    class yourcustombuilding
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = {"DZ_Data"};
        author = "yourname";
        name = "addonname";
        url = "";
    };
};

class CfgVehicles
{
    class HouseNoDestruct;
    class land_modelname: HouseNoDestruct
    {
        model = "\path\to\your\model\file.p3d";
        class Doors
        {
            class Door1
            {
                displayName = "door 1";
                component = "Door1";
                soundPos = "door1_action";
                animPeriod = 1;
                initPhase = 0;
                initOpened = 0.5;
                soundOpen = "sound open";
                soundClose = "sound close";
                soundLocked = "sound locked";
                soundOpenABit = "sound openabit";
            };
            class Door2
            {
                displayName = "door 2";
                component = "Door2";
                soundPos = "door2_action";
                animPeriod = 1;
                initPhase = 0;
                initOpened = 0.5;
                soundOpen = "sound open";
                soundClose = "sound close";
                soundLocked = "sound locked";
                soundOpenABit = "sound openabit";
            };
        };
        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 1000;
                };
            };
            class GlobalArmor
            {
                class Projectile
                {
                    class Health { damage = 0; };
                    class Blood { damage = 0; };
                    class Shock { damage = 0; };
                };
                class Melee
                {
                    class Health { damage = 0; };
                    class Blood { damage = 0; };
                    class Shock { damage = 0; };
                };
            };
            class DamageZones
            {
                class Door1
                {
                    class Health
                    {
                        hitpoints = 1000;
                        transferToGlobalCoef = 0;
                    };
                    componentNames[] = {"door1"};
                    fatalInjuryCoef = -1;
                    class ArmorType
                    {
                        class Projectile
                        {
                            class Health { damage = 2; };
                            class Blood { damage = 0; };
                            class Shock { damage = 0; };
                        };
                        class Melee
                        {
                            class Health { damage = 2.5; };
                            class Blood { damage = 0; };
                            class Shock { damage = 0; };
                        };
                    };
                };
                class Door2
                {
                    class Health
                    {
                        hitpoints = 1000;
                        transferToGlobalCoef = 0;
                    };
                    componentNames[] = {"door2"};
                    fatalInjuryCoef = -1;
                    class ArmorType
                    {
                        class Projectile
                        {
                            class Health { damage = 2; };
                            class Blood { damage = 0; };
                            class Shock { damage = 0; };
                        };
                        class Melee
                        {
                            class Health { damage = 2.5; };
                            class Blood { damage = 0; };
                            class Shock { damage = 0; };
                        };
                    };
                };
            };
        };
    };
};
```

**Wyjaśnienie parametrów konfiguracji drzwi:**

| Parametr | Opis |
|----------|------|
| `component` | Nazwana selekcja w **View Geometry LOD** używana dla tych drzwi. |
| `soundPos` | Nazwana selekcja w **Memory LOD**, gdzie odtwarzane są dźwięki drzwi. |
| `animPeriod` | Szybkość animacji drzwi (w sekundach). |
| `initPhase` | Początkowa faza animacji (`0` = zamknięte, `1` = w pełni otwarte). Testuj w Buldozerze, aby zweryfikować, która wartość odpowiada któremu stanowi. |
| `initOpened` | Prawdopodobieństwo, że drzwi spawnują się otwarte w świecie. `0.5` oznacza 50% szansy. |
| `soundOpen` | Klasa dźwięku z `CfgActionSounds` odtwarzana przy otwieraniu drzwi. Zobacz `DZ\sounds\hpp\config.cpp` dla dostępnych zestawów dźwięków. |
| `soundClose` | Klasa dźwięku odtwarzana przy zamykaniu drzwi. |
| `soundLocked` | Klasa dźwięku odtwarzana, gdy gracz próbuje otworzyć zamknięte drzwi. |
| `soundOpenABit` | Klasa dźwięku odtwarzana, gdy gracz siłowo otwiera zamknięte drzwi. |

**Ważne uwagi dotyczące konfiguracji:**

- Wszystkie budynki w DayZ dziedziczą z `HouseNoDestruct`.
- Każda nazwa klasy pod `class Doors` musi odpowiadać parametrowi `source` zdefiniowanemu w `model.cfg`.
- Sekcja `DamageSystem` musi zawierać podklasę `DamageZones` dla każdych drzwi. Tablica `componentNames[]` odwołuje się do nazwanej selekcji z Fire Geometry LOD modelu.
- Dodanie nazwanej właściwości `class=house` i klasy konfiguracji gry wymaga ponownej binaryzacji terenu (ścieżki modeli w plikach `.wrp` są zastępowane odwołaniami do klas konfiguracji gry).

### Drzwi podwójne

Drzwi podwójne (dwa skrzydła otwierane razem z jednej interakcji) są powszechne w DayZ. Wymagają specjalnej konfiguracji:

**W modelu:**
- Skonfiguruj każde skrzydło jako indywidualne drzwi z własną nazwaną selekcją (np. `door3_1` i `door3_2`).
- W **Memory LOD** punkt akcji musi być **współdzielony** między dwoma skrzydłami -- użyj jednej nazwanej selekcji i jednego wierzchołka dla pozycji akcji.
- Nazwana selekcja bez sufiksu (np. `door3` bez sufiksu skrzydła) musi obejmować **oba** uchwyty drzwi.
- **View Geometry** i **Fire Geometry** wymagają dodatkowej nazwanej selekcji obejmującej oba skrzydła razem.

**W model.cfg:**
- Zdefiniuj każde skrzydło jako oddzielną klasę animacji, ale ustaw **ten sam parametr `source`** dla obu skrzydł (np. `"doors34"` dla obu).
- Ustaw `angle1` na wartość **dodatnią** dla jednego skrzydła i **ujemną** dla drugiego, aby obracały się w przeciwnych kierunkach.

**W config.cpp:**
- Zdefiniuj tylko **jedną** klasę pod `class Doors`, z nazwą odpowiadającą współdzielonemu parametrowi `source`.
- Podobnie zdefiniuj tylko **jeden** wpis w `DamageZones` dla pary drzwi podwójnych.

### Drzwi przesuwne

Dla drzwi przesuwanych po prowadnicy zamiast obrotowych (takie jak drzwi stodoły lub panele przesuwne), zmień `type` animacji w `model.cfg` z `"rotation"` na `"translation"`. Wierzchołki osi w Memory LOD definiują wtedy kierunek ruchu zamiast linii obrotu.

### Problemy ze sferą ograniczającą

Domyślnie sfera ograniczająca modelu jest wymiarowana tak, aby zawierać cały obiekt. Gdy drzwi są modelowane w pozycji zamkniętej, pozycja otwarta może wykraczać **poza** tę sferę ograniczającą. Powoduje to problemy:

- **Akcje przestają działać** -- raycasting dla interakcji z drzwiami nie działa z pewnych kątów.
- **Balistyka ignoruje drzwi** -- kule przelatują przez geometrię leżącą poza sferą ograniczającą.

**Rozwiązanie:** Utwórz nazwaną selekcję w Memory LOD obejmującą większy obszar, który budynek zajmuje z w pełni otwartymi drzwiami. Następnie dodaj parametr `bounding` do klasy konfiguracji gry:

```cpp
class land_modelname: HouseNoDestruct
{
    bounding = "selection_name";
    // ... reszta konfiguracji
};
```

To nadpisuje automatyczne obliczanie sfery ograniczającej sferą obejmującą wszystkie pozycje drzwi.

---

## Konfiguracja drabin

W przeciwieństwie do drzwi, drabiny w DayZ nie wymagają **żadnej konfiguracji animacji** ani **specjalnych wpisów w konfiguracji gry** poza bazową klasą budynku. Cała konfiguracja drabiny odbywa się przez rozmieszczenie wierzchołków Memory LOD i jedną selekcję View Geometry. To sprawia, że drabiny są prostsze w konfiguracji niż drzwi, ale rozmieszczenie wierzchołków musi być precyzyjne.

### Obsługiwane typy drabin

DayZ obsługuje dwa typy drabin:

1. **Wejście od przodu na dole z wyjściem bocznym na górze** -- Gracz podchodzi od przodu na dole i wychodzi na bok na górze (przy ścianie).
2. **Wejście od przodu na dole z wyjściem od przodu na górze** -- Gracz podchodzi od przodu na dole i wychodzi do przodu na górze (na dach lub platformę).

Oba typy obsługują również **środkowe boczne punkty wejścia i wyjścia**, pozwalające graczom wsiadać i zsiadać z drabiny na piętrach pośrednich. Drabiny mogą być również umieszczane **pod kątem**, a nie ściśle pionowo.

### Nazwane selekcje Memory LOD

Drabina jest definiowana w całości przez nazwane wierzchołki w Memory LOD. Każda nazwa selekcji zaczyna się od `ladderN_`, gdzie **N** to ID drabiny, zaczynając od `1`. Budynek może mieć wiele drabin (`ladder1_`, `ladder2_`, `ladder3_` itp.).

Oto kompletny zestaw nazwanych selekcji dla drabiny:

| Nazwana selekcja | Opis |
|-----------------|------|
| `ladderN_bottom_front` | Definiuje dolny stopień wejścia -- gdzie gracz zaczyna wspinaczkę. |
| `ladderN_middle_left` | Definiuje środkowy punkt wejścia/wyjścia (lewa strona). Może zawierać wiele wierzchołków, jeśli drabina przechodzi przez wiele pięter. |
| `ladderN_middle_right` | Definiuje środkowy punkt wejścia/wyjścia (prawa strona). Może zawierać wiele wierzchołków dla drabin wielopiętrowych. |
| `ladderN_top_front` | Definiuje górny stopień wyjścia -- gdzie gracz kończy wspinaczkę (wyjście od przodu). |
| `ladderN_top_left` | Definiuje górny kierunek wyjścia dla drabin przyściennych (lewa strona). Musi być co najmniej **5 stopni drabiny wyżej** niż podłoga (mniej więcej wysokość stojącego gracza na drabinie). |
| `ladderN_top_right` | Definiuje górny kierunek wyjścia dla drabin przyściennych (prawa strona). Ten sam wymóg wysokości co `top_left`. |
| `ladderN` | Definiuje, gdzie widget akcji "Wejdź na drabinę" pojawia się graczowi. |
| `ladderN_dir` | Definiuje kierunek, z którego drabina może być wspinana (kierunek podejścia). |
| `ladderN_con` | Punkt pomiarowy dla akcji wejścia. **Musi być umieszczony na poziomie podłogi.** |
| `ladderN_con_dir` | Definiuje kierunek stożka 180 stopni (o początku w `ladderN_con`), w którym akcja wejścia na drabinę jest dostępna. |

Każdy z nich to wierzchołek (lub zestaw wierzchołków dla punktów środkowych), który umieszczasz ręcznie w Memory LOD w Object Builder.

### Wymagania View Geometry

Oprócz konfiguracji Memory LOD musisz utworzyć komponent **View Geometry** z nazwaną selekcją o nazwie `ladderN`. Ta selekcja musi obejmować **całą objętość** drabiny -- pełną wysokość i szerokość obszaru wspinaczki. Bez tej selekcji View Geometry drabina nie będzie działać poprawnie.

### Wymiary drabin

Animacje wspinaczki po drabinie są zaprojektowane dla **stałych wymiarów**. Szczeble i odstępy twojej drabiny powinny odpowiadać proporcjom oryginalnych drabin, aby animacje były prawidłowo wyrównane. Odwiedź oficjalne repozytorium DayZ Samples po dokładne wymiary -- przykładowe części drabin są tymi samymi, które używane są na większości oryginalnych budynków.

### Przestrzeń kolizji

Postacie **kolidują z geometrią podczas wspinaczki po drabinie**. Oznacza to, że musisz zapewnić wystarczającą ilość wolnej przestrzeni wokół drabiny dla wspinającej się postaci zarówno w:

- **Geometry LOD** -- fizyczna kolizja.
- **Roadway LOD** -- interakcja z powierzchnią.

Jeśli przestrzeń jest zbyt ciasna, postać będzie wcinać się w ściany lub utknąć podczas animacji wspinaczki.

### Wymagania konfiguracyjne dla drabin

W przeciwieństwie do serii Arma, DayZ **nie** wymaga tablicy `ladders[]` w klasie konfiguracji gry. Jednak dwie rzeczy są nadal konieczne:

1. Twój model musi mieć **reprezentację konfiguracyjną** -- `config.cpp` z klasą `CfgVehicles` (ta sama klasa bazowa używana dla drzwi; zobacz sekcję konfiguracji drzwi powyżej).
2. **Geometry LOD** musi zawierać nazwaną właściwość `class` z wartością `house`.

Poza tymi dwoma wymaganiami drabina jest w pełni definiowana przez wierzchołki Memory LOD i selekcję View Geometry. Żadne wpisy animacji w `model.cfg` nie są potrzebne.

---

## Podsumowanie wymagań modelu

Budynki z drzwiami i drabinami muszą zawierać kilka LODów, z których każdy służy odrębnemu celowi. Poniższa tabela podsumowuje, co każdy LOD musi zawierać:

| LOD | Cel | Wymagania dla drzwi | Wymagania dla drabin |
|-----|-----|---------------------|----------------------|
| **Resolution LOD** | Wizualna siatka wyświetlana graczowi. | Nazwana selekcja dla geometrii drzwi (np. `door1`). | Brak specjalnych wymagań. |
| **Geometry LOD** | Fizyczna detekcja kolizji. | Nazwana selekcja dla geometrii drzwi. Nazwana właściwość `class = "house"`. | Nazwana właściwość `class = "house"`. Wystarczający prześwit wokół drabiny dla wspinających się postaci. |
| **Fire Geometry LOD** | Balistyczna detekcja trafień (kule, pociski). | Nazwana selekcja odpowiadająca `componentNames[]` w konfiguracji strefy uszkodzeń. | Brak specjalnych wymagań. |
| **View Geometry LOD** | Sprawdzanie widoczności, raycasting akcji. | Nazwana selekcja odpowiadająca parametrowi `component` w konfiguracji drzwi. | Nazwana selekcja `ladderN` obejmująca pełną objętość drabiny. |
| **Memory LOD** | Definicje osi, punkty akcji, pozycje dźwięku. | Wierzchołki osi (`door1_axis`), pozycja dźwięku (`door1_action`), pozycja widgetu akcji. | Pełny zestaw wierzchołków drabiny (`ladderN_bottom_front`, `ladderN_top_left`, `ladderN_dir`, `ladderN_con` itp.). |
| **Roadway LOD** | Interakcja powierzchniowa dla postaci. | Zwykle nie wymagany. | Wystarczający prześwit wokół drabiny dla wspinających się postaci. |

### Spójność nazwanych selekcji

Krytycznym wymaganiem jest, że **nazwane selekcje muszą być spójne we wszystkich LODach**, które się do nich odwołują. Jeśli selekcja nazywa się `door1` w Resolution LOD, musi również nazywać się `door1` w Geometry, Fire Geometry i View Geometry LOD. Niezgodne nazwy między LODami spowodują ciche niepowodzenie drzwi lub drabiny.

---

## Dobre praktyki

1. **Modeluj drzwi domyślnie zamknięte.** Animuj od zamkniętych do otwartych. Bohemia planuje obsługę otwierania drzwi w obu kierunkach, więc zaczynanie od zamkniętych jest przyszłościowe.

2. **Używaj standardowych wymiarów drzwi.** Trzymaj się 120 x 220 cm dla otworów drzwiowych, chyba że masz konkretny powód projektowy. To odpowiada oryginalnym budynkom i zapewnia prawidłowy wygląd animacji postaci.

3. **Testuj animacje w Buldozerze przed pakowaniem.** Użyj `[` / `]` do przełączania źródeł i `;` / `'` lub kółka myszy do przewijania animacji. Wyłapanie błędów osi lub kąta tutaj oszczędza znacząco czas.

4. **Nadpisuj sfery ograniczające dla dużych budynków.** Jeśli twój budynek ma drzwi, które znacząco otwierają się na zewnątrz, utwórz selekcję Memory LOD obejmującą pełny zakres animowany i powiąż ją parametrem `bounding` w konfiguracji.

5. **Umieszczaj wierzchołki drabin precyzyjnie.** Animacje wspinaczki mają stałe wymiary. Wierzchołki zbyt daleko od siebie lub źle wyrównane spowodują, że postać będzie się unosić, wcinać lub utykać.

6. **Zapewnij prześwit wokół drabin.** Pozostaw wystarczającą przestrzeń w Geometry i Roadway LODach dla modelu postaci podczas wspinaczki.

7. **Utrzymuj jeden `model.cfg` na model lub folder.** `model.cfg` nie musi leżeć obok pliku `.p3d`, ale trzymanie ich blisko ułatwia organizację. Może być również umieszczony wyżej w strukturze folderów, aby obejmować wiele modeli.

8. **Używaj repozytorium DayZ Samples.** Bohemia dostarcza działające przykłady zarówno dla drzwi (`Test_Building`), jak i drabin (`Test_Ladders`) pod adresem `https://github.com/BohemiaInteractive/DayZ-Samples`. Przestudiuj je przed budowaniem własnych.

9. **Ponownie zbinaryzuj teren po dodaniu konfiguracji budynków.** Dodanie `class=house` i klasy konfiguracji gry oznacza, że ścieżki modeli w plikach `.wrp` są zastępowane odwołaniami do klas. Twój teren musi być ponownie zbinaryzowany, aby to zadziałało.

10. **Zaktualizuj navmesh po umieszczeniu budynków.** Przebudowany teren bez zaktualizowanej navmesh może spowodować, że AI będzie przechodzić przez drzwi zamiast ich używać.

---

## Typowe błędy

### Drzwi

| Błąd | Objaw | Rozwiązanie |
|------|-------|-------------|
| Nazwa klasy `CfgModels` nie odpowiada nazwie pliku modelu. | Animacja drzwi się nie odtwarza. | Zmień nazwę klasy, aby dokładnie odpowiadała nazwie pliku `.p3d` (bez rozszerzenia). |
| Brakująca nazwana selekcja w jednym lub więcej LODach. | Drzwi są widoczne, ale nie interaktywne, lub kule przechodzą na wylot. | Upewnij się, że selekcja istnieje w Resolution, Geometry, View Geometry i Fire Geometry LOD. |
| Brakujące wierzchołki osi lub zdefiniowany tylko jeden wierzchołek. | Drzwi obracają się z niewłaściwego punktu lub w ogóle się nie obracają. | Umieść dokładnie dwa wierzchołki w Memory LOD dla selekcji osi (np. `door1_axis`). |
| `source` w `model.cfg` nie odpowiada nazwie klasy w `config.cpp` Doors. | Drzwi nie są powiązane z logiką gry -- brak dźwięków, brak zmian stanu. | Upewnij się, że parametr `source` i nazwa klasy Doors są identyczne. |
| Zapomnienie o nazwanej właściwości `class = "house"` w Geometry LOD. | Budynek nie jest rozpoznawany jako interaktywna struktura. | Dodaj nazwaną właściwość w Geometry LOD w Object Builder. |
| Sfera ograniczająca zbyt mała. | Akcje drzwi lub balistyka zawodzą z pewnych kątów. | Dodaj selekcję `bounding` w Memory LOD i odwołaj się do niej w konfiguracji. |
| Pomylenie ujemnego i dodatniego `angle1` dla drzwi podwójnych. | Oba skrzydła obracają się w tym samym kierunku i przenikają się. | Jedno skrzydło potrzebuje dodatniego `angle1`, drugie ujemnego. |

### Drabiny

| Błąd | Objaw | Rozwiązanie |
|------|-------|-------------|
| `ladderN_con` nie umieszczony na poziomie podłogi. | Akcja "Wejdź na drabinę" nie pojawia się lub pojawia się na złej wysokości. | Przesuń wierzchołek na poziom podłogi/ziemi. |
| Brakująca selekcja View Geometry `ladderN`. | Nie można wchodzić w interakcję z drabiną. | Utwórz komponent View Geometry z nazwaną selekcją obejmującą pełną objętość drabiny. |
| `ladderN_top_left` / `ladderN_top_right` zbyt nisko. | Postać wnika przez ścianę lub podłogę przy górnym wyjściu. | Muszą być co najmniej 5 stopni drabiny wyżej niż poziom podłogi. |
| Niewystarczający prześwit w Geometry LOD. | Postać utyka lub wnika w ściany podczas wspinaczki. | Poszerzaj szczelinę wokół drabiny w Geometry i Roadway LOD. |
| Numeracja drabin zaczyna się od 0. | Drabina nie działa. | Numeracja zaczyna się od `1` (`ladder1_`, nie `ladder0_`). |
| Podanie `ladders[]` w konfiguracji gry. | Stracony wysiłek (nieszkodliwe, ale zbędne). | DayZ nie używa tablicy `ladders[]`. Usuń ją i polegaj na rozmieszczeniu wierzchołków Memory LOD. |

---

## Odniesienia

- [Bohemia Interactive -- Drzwi na budynkach](https://community.bistudio.com/wiki/DayZ:Doors_on_buildings) (oficjalna dokumentacja BI)
- [Bohemia Interactive -- Drabiny na budynkach](https://community.bistudio.com/wiki/DayZ:Ladders_on_buildings) (oficjalna dokumentacja BI)
- [DayZ Samples -- Test_Building](https://github.com/BohemiaInteractive/DayZ-Samples/tree/master/Test_Building) (działający przykład drzwi)
- [DayZ Samples -- Test_Ladders](https://github.com/BohemiaInteractive/DayZ-Samples/tree/master/Test_Ladders) (działający przykład drabiny)
- [Rozdział 4.2: Modele 3D](02-models.md) -- System LOD, nazwane selekcje, podstawy `model.cfg`

---

## Nawigacja

| Poprzedni | W górę | Następny |
|-----------|--------|----------|
| [4.7 Przewodnik po Workbench](07-workbench-guide.md) | [Część 4: Formaty plików i DayZ Tools](01-textures.md) | -- |
