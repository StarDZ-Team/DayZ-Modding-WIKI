# Rozdział 4.2: Modele 3D (.p3d)

[Strona główna](../README.md) | [<< Poprzedni: Tekstury](01-textures.md) | **Modele 3D** | [Dalej: Materiały >>](03-materials.md)

---

## Wprowadzenie

Każdy fizyczny obiekt w DayZ -- broń, ubrania, budynki, pojazdy, drzewa, skały -- to model 3D przechowywany w zastrzeżonym formacie **P3D** firmy Bohemia. Format P3D to znacznie więcej niż kontener siatki: koduje wiele poziomów szczegółowości, geometrię kolizji, selekcje animacji, punkty pamięci dla dodatków i efektów oraz pozycje proxy dla montowanych przedmiotów. Zrozumienie działania plików P3D i sposobu ich tworzenia za pomocą **Object Builder** jest niezbędne dla każdego moda dodającego fizyczne przedmioty do świata gry.

Ten rozdział opisuje strukturę formatu P3D, system LOD, nazwane selekcje, punkty pamięci, system proxy, konfigurację animacji przez `model.cfg` oraz przebieg pracy przy imporcie ze standardowych formatów 3D.

---

## Spis treści

- [Przegląd formatu P3D](#przegląd-formatu-p3d)
- [Object Builder](#object-builder)
- [System LOD](#system-lod)
- [Nazwane selekcje](#nazwane-selekcje)
- [Punkty pamięci](#punkty-pamięci)
- [System proxy](#system-proxy)
- [Model.cfg dla animacji](#modelcfg-dla-animacji)
- [Import z FBX/OBJ](#import-z-fbxobj)
- [Typowe typy modeli](#typowe-typy-modeli)
- [Najczęstsze błędy](#najczęstsze-błędy)
- [Dobre praktyki](#dobre-praktyki)

---

## Przegląd formatu P3D

**P3D** (Point 3D) to binarny format modeli 3D firmy Bohemia Interactive, odziedziczony z silnika Real Virtuality i przeniesiony do Enfusion. Jest to skompilowany, gotowy dla silnika format -- nie piszesz plików P3D ręcznie.

### Kluczowe cechy

- **Format binarny:** Nie jest czytelny dla człowieka. Tworzony i edytowany wyłącznie za pomocą Object Builder.
- **Kontener wielu LOD:** Pojedynczy plik P3D zawiera wiele siatek LOD (Level of Detail), każda o innym przeznaczeniu.
- **Natywny dla silnika:** Silnik DayZ ładuje P3D bezpośrednio. Nie zachodzi żadna konwersja w trakcie działania.
- **Zbinaryzowany vs. niezbinaryzowany:** Źródłowe pliki P3D z Object Builder to "MLOD" (edytowalne). Binarize konwertuje je do "ODOL" (zoptymalizowane, tylko do odczytu). Gra może ładować oba, ale ODOL ładuje się szybciej i jest mniejszy.

### Typy plików, które napotkasz

| Rozszerzenie | Opis |
|-----------|-------------|
| `.p3d` | Model 3D (zarówno źródłowy MLOD, jak i zbinaryzowany ODOL) |
| `.rtm` | Runtime Motion -- dane klatek kluczowych animacji |
| `.bisurf` | Plik właściwości powierzchni (używany obok P3D) |

### MLOD vs. ODOL

| Właściwość | MLOD (Źródłowy) | ODOL (Zbinaryzowany) |
|----------|---------------|-------------------|
| Tworzony przez | Object Builder | Binarize |
| Edytowalny | Tak | Nie |
| Rozmiar pliku | Większy | Mniejszy |
| Prędkość ładowania | Wolniejsza | Szybsza |
| Używany podczas | Rozwoju | Wydania |
| Zawiera | Pełne dane edycji, nazwane selekcje | Zoptymalizowane dane siatki |

> **Ważne:** Gdy pakujesz PBO z włączoną binaryzacją, twoje pliki MLOD P3D są automatycznie konwertowane do ODOL. Jeśli pakujesz z `-packonly`, pliki MLOD są dołączane w niezmienionej formie. Oba działają w grze, ale ODOL jest preferowany dla kompilacji wydaniowych.

---

## Object Builder

**Object Builder** to narzędzie dostarczone przez Bohemię do tworzenia i edycji modeli P3D. Jest dołączony do pakietu DayZ Tools na Steam.

### Podstawowe możliwości

- Tworzenie i edycja siatek 3D z wierzchołkami, krawędziami i ścianami.
- Definiowanie wielu LOD w pojedynczym pliku P3D.
- Przypisywanie **nazwanych selekcji** (grup wierzchołków/ścian) do animacji i kontroli tekstur.
- Umieszczanie **punktów pamięci** dla pozycji dodatków, źródeł cząstek i źródeł dźwięku.
- Dodawanie **obiektów proxy** dla montowanych przedmiotów (magazynki, optyka, itp.).
- Przypisywanie materiałów (`.rvmat`) i tekstur (`.paa`) do ścian.
- Import siatek z formatów FBX, OBJ i 3DS.
- Eksport zwalidowanych plików P3D dla Binarize.

### Konfiguracja przestrzeni roboczej

Object Builder wymaga skonfigurowania **dysku P:** (workdrive). Ten wirtualny dysk zapewnia jednolity prefiks ścieżki, którego silnik używa do lokalizowania zasobów.

```
P:\
  DZ\                        <-- Vanilla DayZ data (extracted)
  DayZ Tools\                <-- Tools installation
  MyMod\                     <-- Your mod's source directory
    data\
      models\
        my_item.p3d
      textures\
        my_item_co.paa
```

Wszystkie ścieżki w plikach P3D i materiałach są relatywne do korzenia dysku P:. Na przykład, referencja materiału wewnątrz modelu to `MyMod\data\textures\my_item_co.paa`.

### Podstawowy przebieg pracy w Object Builder

1. **Utwórz lub zaimportuj** geometrię siatki.
2. **Zdefiniuj LOD** -- co najmniej utwórz LOD Resolution, Geometry i Fire Geometry.
3. **Przypisz materiały** do ścian w LOD Resolution.
4. **Nazwij selekcje** dla części, które animują, zamieniają tekstury lub wymagają interakcji kodu.
5. **Umieść punkty pamięci** dla dodatków, pozycji błysku wylotowego, portów wyrzutu łusek, itp.
6. **Dodaj proxy** dla przedmiotów, które mogą być dołączone (optyka, magazynki, tłumiki).
7. **Zwaliduj** za pomocą wbudowanej walidacji Object Builder (Structure --> Validate).
8. **Zapisz** jako P3D.
9. **Zbuduj** przez Binarize lub AddonBuilder.

---

## System LOD

Plik P3D zawiera wiele **LOD** (Level of Detail -- poziomów szczegółowości), z których każdy służy konkretnemu celowi. Silnik wybiera, którego LOD użyć na podstawie sytuacji -- odległości od kamery, obliczeń fizyki, renderowania cieni, itp.

### Typy LOD

| LOD | Wartość rozdzielczości | Przeznaczenie |
|-----|-----------------|---------|
| **Resolution 0** | 1.000 | Siatka wizualna najwyższego detalu. Renderowana, gdy obiekt jest blisko kamery. |
| **Resolution 1** | 1.100 | Średni detal. Renderowana przy umiarkowanej odległości. |
| **Resolution 2** | 1.200 | Niski detal. Renderowana przy dużej odległości. |
| **Resolution 3+** | 1.300+ | Dodatkowe LOD odległości. |
| **View Geometry** | Specjalny | Określa, co blokuje widok gracza (pierwsza osoba). Uproszczona siatka. |
| **Fire Geometry** | Specjalny | Kolizja dla pocisków. Musi być wypukła lub złożona z wypukłych części. |
| **Geometry** | Specjalny | Kolizja fizyki. Używana dla kolizji ruchu, grawitacji, umieszczania. Musi być wypukła lub złożona z dekompozycji wypukłej. |
| **Shadow 0** | Specjalny | Siatka rzucania cieni (bliski zasięg). |
| **Shadow 1000** | Specjalny | Siatka rzucania cieni (daleki zasięg). Prostsza niż Shadow 0. |
| **Memory** | Specjalny | Zawiera tylko nazwane punkty (bez widocznej geometrii). Używany dla pozycji dodatków, źródeł dźwięku, itp. |
| **Roadway** | Specjalny | Definiuje powierzchnie po których można chodzić na obiektach (pojazdy, budynki z wchodzalnymi wnętrzami). |
| **Paths** | Specjalny | Wskazówki pathfindingu AI dla budynków. |

### Wymagania LOD wg typu przedmiotu

| Typ przedmiotu | Wymagane LOD | Zalecane dodatkowe LOD |
|-----------|---------------|----------------------------|
| **Przedmiot ręczny** | Resolution 0, Geometry, Fire Geometry, Memory | Shadow 0, Resolution 1 |
| **Ubranie** | Resolution 0, Geometry, Fire Geometry, Memory | Shadow 0, Resolution 1, Resolution 2 |
| **Broń** | Resolution 0, Geometry, Fire Geometry, View Geometry, Memory | Shadow 0, Resolution 1, Resolution 2 |
| **Budynek** | Resolution 0, Geometry, Fire Geometry, View Geometry, Memory | Shadow 0, Shadow 1000, Roadway, Paths |
| **Pojazd** | Resolution 0, Geometry, Fire Geometry, View Geometry, Memory | Shadow 0, Roadway, Resolution 1+ |

### Zasady LOD geometrii

LOD Geometry i Fire Geometry mają ścisłe wymagania:

- **Muszą być wypukłe** lub złożone z wielu wypukłych komponentów. System fizyki silnika wymaga wypukłych kształtów kolizji.
- **Nazwane selekcje muszą się zgadzać** z tymi w LOD Resolution (dla animowanych części).
- **Masa musi być zdefiniowana.** Zaznacz wszystkie wierzchołki w LOD Geometry i przypisz masę przez **Structure --> Mass**. Określa to fizyczną wagę obiektu.
- **Utrzymuj prostotę.** Mniej trójkątów = lepsza wydajność fizyki. LOD geometrii broni może mieć 20-50 trójkątów vs. tysiące w LOD wizualnym.

---

## Nazwane selekcje

Nazwane selekcje to grupy wierzchołków, krawędzi lub ścian w LOD, które są oznaczone nazwą. Służą jako uchwyty, które silnik i skrypty używają do manipulowania częściami modelu.

### Co robią nazwane selekcje

| Przeznaczenie | Przykładowa nazwa selekcji | Używane przez |
|---------|----------------------|---------|
| **Animacja** | `bolt`, `trigger`, `magazine` | Źródła animacji `model.cfg` |
| **Zamiana tekstur** | `camo`, `camo1`, `body` | `hiddenSelections[]` w config.cpp |
| **Tekstury uszkodzeń** | `zbytek` | System uszkodzeń silnika, zamiana materiałów |
| **Punkty montażu** | `magazine`, `optics`, `suppressor` | System proxy i montażu |

### hiddenSelections (Zamiana tekstur)

Najczęstsze użycie nazwanych selekcji przez modderów to **hiddenSelections** -- możliwość zamiany tekstur w trakcie działania przez config.cpp.

**W modelu P3D (LOD Resolution):**
1. Zaznacz ściany, które powinny mieć wymienialną teksturę.
2. Nazwij selekcję (np. `camo`).

**W config.cpp:**
```cpp
class MyRifle: Rifle_Base
{
    hiddenSelections[] = {"camo"};
    hiddenSelectionsTextures[] = {"MyMod\data\my_rifle_co.paa"};
    hiddenSelectionsMaterials[] = {"MyMod\data\my_rifle.rvmat"};
};
```

Pozwala to na różne warianty tego samego modelu z różnymi teksturami bez duplikowania pliku P3D.

### Tworzenie nazwanych selekcji

W Object Builder:

1. Zaznacz wierzchołki lub ściany, które chcesz zgrupować.
2. Przejdź do **Structure --> Named Selections** (lub naciśnij Ctrl+N).
3. Kliknij **New**, wpisz nazwę selekcji.
4. Kliknij **Assign**, aby oznaczyć wybraną geometrię tą nazwą.

> **Wskazówka:** Nazwy selekcji rozróżniają wielkość liter. `Camo` i `camo` to różne selekcje. Konwencja to małe litery.

### Selekcje między LODami

Nazwane selekcje muszą być spójne między LODami, aby animacje działały:

- Jeśli selekcja `bolt` istnieje w Resolution 0, musi również istnieć w LODach Geometry i Fire Geometry (obejmując odpowiednią geometrię kolizji).
- LODy Shadow powinny również mieć selekcję, jeśli animowana część powinna rzucać poprawne cienie.

---

## Punkty pamięci

Punkty pamięci to nazwane pozycje zdefiniowane w **LOD Memory**. Nie mają wizualnej reprezentacji w grze -- definiują współrzędne przestrzenne, do których silnik i skrypty się odwołują przy pozycjonowaniu efektów, dodatków, dźwięków i więcej.

### Typowe punkty pamięci

| Nazwa punktu | Przeznaczenie |
|------------|---------|
| `usti hlavne` | Pozycja wylotu lufy (skąd wychodzą pociski, pojawia się błysk wylotowy) |
| `konec hlavne` | Koniec lufy (używany z `usti hlavne` do definiowania kierunku lufy) |
| `nabojnicestart` | Początek portu wyrzutu (skąd wylatują łuski) |
| `nabojniceend` | Koniec portu wyrzutu (kierunek wyrzutu) |
| `handguard` | Punkt montażu chwytki |
| `magazine` | Pozycja gniazda magazynka |
| `optics` | Pozycja szyny optyki |
| `suppressor` | Pozycja montażu tłumika |
| `trigger` | Pozycja spustu (dla IK ręki) |
| `pistolgrip` | Pozycja chwytni pistoletowej (dla IK ręki) |
| `lefthand` | Pozycja chwytu lewej ręki |
| `righthand` | Pozycja chwytu prawej ręki |
| `eye` | Pozycja oka (dla wyrównania widoku z pierwszej osoby) |
| `pilot` | Pozycja siedzenia kierowcy/pilota (pojazdy) |
| `light_l` / `light_r` | Pozycje lewego/prawego reflektora (pojazdy) |

### Kierunkowe punkty pamięci

Wiele efektów wymaga zarówno pozycji, jak i kierunku. Osiąga się to za pomocą par punktów pamięci:

```
usti hlavne  ------>  konec hlavne
(muzzle start)        (muzzle end)

The direction vector is: konec hlavne - usti hlavne
```

---

## System proxy

Proxy definiują pozycje, w których inne modele P3D mogą być zamontowane. Gdy widzisz magazynek włożony do broni, optykę zamontowaną na szynie lub tłumik nakręcony na lufę -- to są modele zamontowane przez proxy.

### Jak działają proxy

Proxy to specjalna referencja umieszczona w LOD Resolution, która wskazuje na inny plik P3D. Silnik renderuje referencyjny model proxy w pozycji i orientacji proxy.

### Konwencja nazewnictwa proxy

Nazwy proxy podążają za wzorcem: `proxy:\path\to\model.p3d`

Dla proxy montażu na broni standardowe nazwy to:

| Ścieżka proxy | Typ montażu |
|------------|----------------|
| `proxy:\dz\weapons\attachments\magazine\mag_placeholder.p3d` | Slot magazynka |
| `proxy:\dz\weapons\attachments\optics\optic_placeholder.p3d` | Szyna optyki |
| `proxy:\dz\weapons\attachments\suppressor\sup_placeholder.p3d` | Montaż tłumika |
| `proxy:\dz\weapons\attachments\handguard\handguard_placeholder.p3d` | Slot chwytki |
| `proxy:\dz\weapons\attachments\stock\stock_placeholder.p3d` | Slot kolby |

---

## Model.cfg dla animacji

Plik `model.cfg` definiuje animacje dla modeli P3D. Mapuje źródła animacji (sterowane logiką gry) na transformacje na nazwanych selekcjach.

### Podstawowa struktura

```cpp
class CfgModels
{
    class Default
    {
        sectionsInherit = "";
        sections[] = {};
        skeletonName = "";
    };

    class MyRifle: Default
    {
        skeletonName = "MyRifle_skeleton";
        sections[] = {"camo"};

        class Animations
        {
            class bolt_move
            {
                type = "translation";
                source = "reload";        // Engine animation source
                selection = "bolt";       // Named selection in P3D
                axis = "bolt_axis";       // Axis memory point pair
                memory = 1;               // Axis defined in Memory LOD
                minValue = 0;
                maxValue = 1;
                offset0 = 0;
                offset1 = 0.05;           // 5cm translation
            };

            class trigger_move
            {
                type = "rotation";
                source = "trigger";
                selection = "trigger";
                axis = "trigger_axis";
                memory = 1;
                minValue = 0;
                maxValue = 1;
                angle0 = 0;
                angle1 = -0.4;            // Radians
            };
        };
    };
};

class CfgSkeletons
{
    class Default
    {
        isDiscrete = 0;
        skeletonInherit = "";
        skeletonBones[] = {};
    };

    class MyRifle_skeleton: Default
    {
        skeletonBones[] =
        {
            "bolt", "",          // "bone_name", "parent_bone" ("" = root)
            "trigger", "",
            "magazine", ""
        };
    };
};
```

### Typy animacji

| Typ | Słowo kluczowe | Ruch | Kontrolowane przez |
|------|---------|----------|---------------|
| **Translacja** | `translation` | Ruch liniowy wzdłuż osi | `offset0` / `offset1` (metry) |
| **Rotacja** | `rotation` | Obrót wokół osi | `angle0` / `angle1` (radiany) |
| **RotationX/Y/Z** | `rotationX` | Obrót wokół stałej osi świata | `angle0` / `angle1` |
| **Ukrycie** | `hide` | Pokaż/ukryj selekcję | Próg `hideValue` |

### Źródła animacji

Źródła animacji to dostarczane przez silnik wartości sterujące animacjami:

| Źródło | Zakres | Opis |
|--------|-------|-------------|
| `reload` | 0-1 | Faza przeładowania broni |
| `trigger` | 0-1 | Naciśnięcie spustu |
| `zeroing` | 0-N | Ustawienie zerowania broni |
| `isFlipped` | 0-1 | Stan odwrócenia celownika mechanicznego |
| `door` | 0-1 | Otwarcie/zamknięcie drzwi |
| `rpm` | 0-N | Obroty silnika pojazdu |
| `speed` | 0-N | Prędkość pojazdu |
| `fuel` | 0-1 | Poziom paliwa pojazdu |
| `damper` | 0-1 | Zawieszenie pojazdu |

---

## Import z FBX/OBJ

Większość modderów tworzy modele 3D w zewnętrznych narzędziach (Blender, 3ds Max, Maya) i importuje je do Object Builder.

### Obsługiwane formaty importu

| Format | Rozszerzenie | Uwagi |
|--------|-----------|-------|
| **FBX** | `.fbx` | Najlepsza kompatybilność. Eksportuj jako FBX 2013 lub nowszy (binarny). |
| **OBJ** | `.obj` | Wavefront OBJ. Tylko proste dane siatki (bez animacji). |
| **3DS** | `.3ds` | Starszy format 3ds Max. Ograniczony do 65K wierzchołków na siatkę. |

### Przebieg importu

**Krok 1: Przygotuj w oprogramowaniu 3D**
- Model powinien być wyśrodkowany w punkcie początkowym.
- Zastosuj wszystkie transformacje (lokalizacja, rotacja, skala).
- Skala: 1 jednostka = 1 metr. DayZ używa metrów.
- Trianguluj siatkę (Object Builder pracuje z trójkątami).
- Rozwiń UV modelu.
- Eksportuj jako FBX (binarny, bez animacji, Y-up lub Z-up -- Object Builder obsługuje oba).

**Krok 2: Zaimportuj do Object Builder**
1. Otwórz Object Builder.
2. **File --> Import --> FBX** (lub OBJ/3DS).
3. Przejrzyj ustawienia importu:
   - Współczynnik skali (powinien być 1.0 jeśli źródło jest w metrach).
   - Konwersja osi (Z-up do Y-up w razie potrzeby).
4. Siatka pojawia się w nowym LOD Resolution.

**Krok 3: Konfiguracja po imporcie**
1. Przypisz materiały do ścian (zaznacz ściany, prawy przycisk --> **Face Properties**).
2. Utwórz dodatkowe LODy (Geometry, Fire Geometry, Memory, Shadow).
3. Uprość geometrię dla LODów kolizji (usuń drobne detale, zapewnij wypukłość).
4. Dodaj nazwane selekcje, punkty pamięci i proxy.
5. Zwaliduj i zapisz.

---

## Typowe typy modeli

### Broń

Broń to najbardziej złożone modele P3D, wymagające:
- LOD Resolution z dużą liczbą wielokątów (5 000-20 000 trójkątów)
- Wielu nazwanych selekcji (bolt, trigger, magazine, camo, itp.)
- Pełnego zestawu punktów pamięci (wylot, wyrzut, pozycje chwytów)
- Wielu proxy (magazynek, optyka, tłumik, chwytka, kolba)
- Szkieletu i animacji w model.cfg
- View Geometry dla przesłaniania z pierwszej osoby

### Odzież

Modele odzieży są zriggowane do szkieletu postaci:
- LOD Resolution podąża za strukturą kości postaci
- Nazwane selekcje dla wariantów tekstur (`camo`, `camo1`)
- Prostsza geometria kolizji
- Brak proxy (zazwyczaj)
- hiddenSelections dla wariantów koloru/kamuflaży

### Budynki

Budynki mają unikalne wymagania:
- Duże, szczegółowe LODy Resolution
- LOD Roadway dla powierzchni do chodzenia (podłogi, schody)
- LOD Paths dla nawigacji AI
- View Geometry zapobiegająca widzeniu przez ściany
- Wiele LODów Shadow dla wydajności na różnych odległościach
- Nazwane selekcje dla drzwi i okien, które się otwierają

### Pojazdy

Pojazdy łączą wiele systemów:
- Szczegółowy LOD Resolution z animowanymi częściami (koła, drzwi, maska)
- Złożony szkielet z wieloma kośćmi
- LOD Roadway dla pasażerów stojących na platformie ciężarówki
- Punkty pamięci dla świateł, wydechu, pozycji kierowcy, siedzeń pasażerów
- Wiele proxy dla dodatków (koła, drzwi)

---

## Najczęstsze błędy

### 1. Brak LOD Geometry

**Objaw:** Obiekt nie ma kolizji. Gracze i pociski przechodzą przez niego.
**Rozwiązanie:** Utwórz LOD Geometry z uproszczoną wypukłą siatką. Przypisz masę do wierzchołków.

### 2. Niewypukłe kształty kolizji

**Objaw:** Usterki fizyki, obiekty odbijające się niekontrolowanie, przedmioty przenikające przez powierzchnie.
**Rozwiązanie:** Rozbij złożone kształty na wiele wypukłych komponentów w LOD Geometry. Każdy komponent musi być zamkniętym wypukłym bryłą.

### 3. Niespójne nazwane selekcje

**Objaw:** Animacje działają tylko wizualnie, ale nie dla kolizji, lub cień się nie animuje.
**Rozwiązanie:** Upewnij się, że każda nazwana selekcja istniejąca w LOD Resolution istnieje również w LODach Geometry, Fire Geometry i Shadow.

### 4. Zła skala

**Objaw:** Obiekt jest gigantyczny lub mikroskopijny w grze.
**Rozwiązanie:** Sprawdź, czy twoje oprogramowanie 3D używa metrów jako jednostki. Postać DayZ ma około 1,8 metra wzrostu.

### 5. Brakujące punkty pamięci

**Objaw:** Błysk wylotowy pojawia się w złej pozycji, dodatki unoszą się w przestrzeni.
**Rozwiązanie:** Utwórz LOD Memory i dodaj wszystkie wymagane nazwane punkty w prawidłowych pozycjach.

### 6. Niezdefiniowana masa

**Objaw:** Obiekt nie może być podniesiony lub interakcje fizyczne zachowują się dziwnie.
**Rozwiązanie:** Zaznacz wszystkie wierzchołki w LOD Geometry i przypisz masę przez **Structure --> Mass**.

---

## Dobre praktyki

1. **Zacznij od LOD Geometry.** Zablokuj kształt kolizji najpierw, potem buduj detal wizualny na wierzchu. Zapobiega to częstemu błędowi tworzenia pięknego modelu, który nie może prawidłowo kolidować.

2. **Używaj modeli referencyjnych.** Wypakuj waniliowe pliki P3D z danych gry i przestudiuj je w Object Builder. Pokazują dokładnie, czego silnik oczekuje dla każdego typu przedmiotu.

3. **Waliduj często.** Używaj **Structure --> Validate** w Object Builder po każdej istotnej zmianie. Napraw ostrzeżenia, zanim staną się tajemniczymi błędami w grze.

4. **Utrzymuj liczbę trójkątów LOD proporcjonalną.** Resolution 0 może mieć 10 000 trójkątów; Resolution 1 powinien mieć ~5 000; Geometry powinien mieć ~100-500. Dramatyczna redukcja na każdym poziomie.

5. **Nazywaj selekcje opisowo.** Używaj `bolt_carrier` zamiast `sel01`. Twoje przyszłe ja (i inni modderzy) będą wdzięczni.

6. **Testuj z file patching najpierw.** Załaduj swój niezbinaryzowany P3D przez tryb file patching przed committowaniem do pełnego builda PBO. Wyłapuje to większość problemów szybciej.

7. **Dokumentuj punkty pamięci.** Przechowuj obraz referencyjny lub plik tekstowy z listą wszystkich punktów pamięci i ich zamierzonych pozycji. Złożona broń może mieć 20+ punktów.

---

## Nawigacja

| Poprzedni | W górę | Dalej |
|----------|----|------|
| [4.1 Tekstury](01-textures.md) | [Część 4: Formaty plików i DayZ Tools](01-textures.md) | [4.3 Materiały](03-materials.md) |
