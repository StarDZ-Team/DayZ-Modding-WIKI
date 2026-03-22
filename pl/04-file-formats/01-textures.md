# Rozdział 4.1: Tekstury (.paa, .edds, .tga)

[Strona główna](../README.md) | **Tekstury** | [Dalej: Modele 3D >>](02-models.md)

---

## Wprowadzenie

Każda powierzchnia, którą widzisz w DayZ -- skórki broni, ubrania, teren, ikony UI -- jest definiowana przez pliki tekstur. Silnik używa zastrzeżonego skompresowanego formatu o nazwie **PAA** w trakcie działania, ale podczas tworzenia pracujesz z kilkoma formatami źródłowymi, które są konwertowane podczas procesu budowania. Zrozumienie tych formatów, konwencji nazewnictwa wiążących je z materiałami oraz zasad rozdzielczości narzucanych przez silnik jest fundamentalne do tworzenia treści wizualnych dla modów DayZ.

Ten rozdział opisuje każdy format tekstur, z którym się spotkasz, system sufiksów nazewnictwa informujący silnik, jak interpretować każdą teksturę, wymagania rozdzielczości i kanału alfa oraz praktyczny przebieg pracy przy konwersji między formatami.

---

## Spis treści

- [Przegląd formatów tekstur](#przegląd-formatów-tekstur)
- [Format PAA](#format-paa)
- [Format EDDS](#format-edds)
- [Format TGA](#format-tga)
- [Format PNG](#format-png)
- [Konwencje nazewnictwa tekstur](#konwencje-nazewnictwa-tekstur)
- [Wymagania rozdzielczości](#wymagania-rozdzielczości)
- [Obsługa kanału alfa](#obsługa-kanału-alfa)
- [Konwersja między formatami](#konwersja-między-formatami)
- [Jakość i kompresja tekstur](#jakość-i-kompresja-tekstur)
- [Przykłady z praktyki](#przykłady-z-praktyki)
- [Najczęstsze błędy](#najczęstsze-błędy)
- [Dobre praktyki](#dobre-praktyki)

---

## Przegląd formatów tekstur

DayZ używa czterech formatów tekstur na różnych etapach procesu tworzenia:

| Format | Rozszerzenie | Rola | Obsługa alfy | Używany na etapie |
|--------|-----------|------|---------------|---------|
| **PAA** | `.paa` | Format gry w trakcie działania (skompresowany) | Tak | Finalna kompilacja, dostarczany w PBO |
| **EDDS** | `.edds` | Wariant edytora/pośredni DDS | Tak | Podgląd Object Builder, autokonwersja |
| **TGA** | `.tga` | Nieskompresowana grafika źródłowa | Tak | Przestrzeń pracy artysty, eksport Photoshop/GIMP |
| **PNG** | `.png` | Przenośny format źródłowy | Tak | Tekstury UI, narzędzia zewnętrzne |

Ogólny przebieg pracy to: **Źródło (TGA/PNG) --> konwersja DayZ Tools --> PAA (gotowy do gry)**.

---

## Format PAA

**PAA** (PAcked Arma) to natywny skompresowany format tekstur używany przez silnik Enfusion w trakcie działania. Każda tekstura dostarczana w PBO musi być w formacie PAA (lub zostanie skonwertowana do niego podczas binaryzacji).

### Cechy

- **Skompresowany:** Używa wewnętrznie kompresji DXT1, DXT5 lub ARGB8888 w zależności od obecności kanału alfa i ustawień jakości.
- **Mipmapowany:** Pliki PAA zawierają pełny łańcuch mipmap, generowany automatycznie podczas konwersji. Jest to krytyczne dla wydajności renderowania -- silnik wybiera odpowiedni poziom mip na podstawie odległości.
- **Wymiary będące potęgami dwójki:** Silnik wymaga, aby tekstury PAA miały wymiary będące potęgami 2 (256, 512, 1024, 2048, 4096).
- **Tylko do odczytu w trakcie działania:** Silnik ładuje pliki PAA bezpośrednio z PBO. Nigdy nie edytujesz pliku PAA -- edytujesz źródło i konwertujesz ponownie.

### Wewnętrzne typy kompresji

| Typ | Alfa | Jakość | Przypadek użycia |
|------|-------|---------|----------|
| **DXT1** | Nie (1-bit) | Dobra, współczynnik 6:1 | Nieprzezroczyste tekstury, teren |
| **DXT5** | Pełna 8-bit | Dobra, współczynnik 4:1 | Tekstury z gładką alfą (szkło, roślinność) |
| **ARGB4444** | Pełna 4-bit | Średnia | Tekstury UI, małe ikony |
| **ARGB8888** | Pełna 8-bit | Bezstratna | Debugowanie, najwyższa jakość (duży rozmiar pliku) |
| **AI88** | Skala szarości + alfa | Dobra | Mapy normalnych, maski w skali szarości |

### Kiedy zobaczysz pliki PAA

- Wewnątrz rozpakowanych danych waniliowej gry (katalogi `dta/` i PBO addonów)
- Jako wynik konwersji TexView2
- Jako wynik Binarize przy przetwarzaniu tekstur źródłowych
- W finalnym PBO twojego moda po zbudowaniu

---

## Format EDDS

**EDDS** to pośredni format tekstur używany głównie przez **Object Builder** DayZ i narzędzia edytora. Jest zasadniczo wariantem standardowego formatu DirectDraw Surface (DDS) z metadanymi specyficznymi dla silnika.

### Cechy

- **Format podglądu:** Object Builder może wyświetlać tekstury EDDS bezpośrednio, co czyni je użytecznymi podczas tworzenia modeli.
- **Autokonwersja do PAA:** Gdy uruchamiasz Binarize lub AddonBuilder (bez `-packonly`), pliki EDDS w twoim drzewie źródłowym są automatycznie konwertowane do PAA.
- **Większe niż PAA:** Pliki EDDS nie są zoptymalizowane do dystrybucji -- istnieją dla wygody edytora.
- **Format DayZ-Samples:** Oficjalne DayZ-Samples dostarczone przez Bohemię intensywnie używają tekstur EDDS.

### Przebieg pracy z EDDS

```
Artist creates TGA/PNG source
    --> Photoshop DDS plugin exports EDDS for preview
        --> Object Builder displays EDDS on model
            --> Binarize converts EDDS to PAA for PBO
```

> **Wskazówka:** Możesz całkowicie pominąć EDDS, jeśli wolisz. Skonwertuj tekstury źródłowe bezpośrednio do PAA za pomocą TexView2 i odwołuj się do ścieżek PAA w materiałach. EDDS to wygoda, nie wymóg.

---

## Format TGA

**TGA** (Truevision TGA / Targa) to tradycyjny nieskompresowany format źródłowy do pracy z teksturami DayZ. Wiele waniliowych tekstur DayZ było pierwotnie tworzonych jako pliki TGA.

### Cechy

- **Nieskompresowany:** Brak utraty jakości, pełna głębia kolorów (24-bit lub 32-bit z alfą).
- **Duże rozmiary plików:** TGA 2048x2048 z alfą to około 16 MB.
- **Alfa w dedykowanym kanale:** TGA obsługuje właściwy 8-bitowy kanał alfa (32-bit TGA), który mapuje się bezpośrednio na przezroczystość w PAA.
- **Kompatybilny z TexView2:** TexView2 może otwierać pliki TGA bezpośrednio i konwertować je do PAA.

### Kiedy używać TGA

- Jako główny plik źródłowy dla tekstur tworzonych od zera.
- Przy eksporcie z Substance Painter lub Photoshop dla DayZ.
- Gdy dokumentacja DayZ-Samples lub poradniki społeczności określają TGA jako format źródłowy.

### Ustawienia eksportu TGA

Przy eksporcie TGA do konwersji DayZ:

- **Głębia bitowa:** 32-bit (jeśli alfa jest potrzebna) lub 24-bit (nieprzezroczyste tekstury)
- **Kompresja:** Brak (nieskompresowany)
- **Orientacja:** Lewy dolny róg (standardowa orientacja TGA)
- **Rozdzielczość:** Musi być potęgą 2 (patrz [Wymagania rozdzielczości](#wymagania-rozdzielczości))

---

## Format PNG

**PNG** (Portable Network Graphics) jest szeroko obsługiwany i może być używany jako alternatywny format źródłowy, szczególnie dla tekstur UI.

### Cechy

- **Kompresja bezstratna:** Mniejszy niż TGA, ale zachowuje pełną jakość.
- **Pełny kanał alfa:** 32-bit PNG obsługuje 8-bitową alfę.
- **Kompatybilny z TexView2:** TexView2 może otwierać i konwertować PNG do PAA.
- **Przyjazny dla UI:** Wiele imagesetów i ikon UI w modach używa PNG jako formatu źródłowego.

### Kiedy używać PNG

- **Tekstury UI i ikony:** PNG to praktyczny wybór dla imagesetów i elementów HUD.
- **Proste retekstury:** Gdy potrzebujesz tylko mapy koloru/diffuse bez złożonej alfy.
- **Przepływy pracy z wieloma narzędziami:** PNG jest uniwersalnie obsługiwany we wszystkich edytorach obrazów, narzędziach webowych i skryptach.

> **Uwaga:** PNG nie jest oficjalnym formatem źródłowym Bohemii -- preferują TGA. Jednakże narzędzia konwersji obsługują PNG bez problemów i wielu modderów używa go z powodzeniem.

---

## Konwencje nazewnictwa tekstur

DayZ używa ścisłego systemu sufiksów do identyfikacji roli każdej tekstury. Silnik i materiały odwołują się do tekstur po nazwie pliku, a sufiks informuje zarówno silnik, jak i innych modderów, jaki typ danych tekstura zawiera.

### Wymagane sufiksy

| Sufiks | Pełna nazwa | Przeznaczenie | Typowy format |
|--------|-----------|---------|----------------|
| `_co` | **Color / Diffuse** | Bazowy kolor (albedo) powierzchni | RGB, opcjonalna alfa |
| `_nohq` | **Normal Map (High Quality)** | Normalne szczegółów powierzchni, definiuje nierówności i rowki | RGB (tangent-space normal) |
| `_smdi` | **Specular / Metallic / Detail Index** | Kontroluje połyskliwość i właściwości metaliczne | Kanały RGB kodują oddzielne dane |
| `_ca` | **Color with Alpha** | Tekstura koloru, gdzie kanał alfa niesie znaczące dane (przezroczystość, maska) | RGBA |
| `_as` | **Ambient Shadow** | Okluzja otoczenia / wypieciony cień | Skala szarości |
| `_mc` | **Macro** | Wielkoskalowa wariacja koloru widoczna z odległości | RGB |
| `_li` | **Light / Emissive** | Mapa samoświecenia (świecące elementy) | RGB |
| `_no` | **Normal Map (Standard)** | Wariant mapy normalnych niższej jakości | RGB |
| `_mca` | **Macro with Alpha** | Tekstura makro z kanałem alfa | RGBA |
| `_de` | **Detail** | Kafelkowa tekstura detalu dla wariacji powierzchni z bliska | RGB |

### Konwencja nazewnictwa w praktyce

Pojedynczy przedmiot zazwyczaj ma wiele tekstur, wszystkie dzielące bazową nazwę:

```
data/
  my_rifle_co.paa          <-- Base color (what you see)
  my_rifle_nohq.paa        <-- Normal map (surface bumps)
  my_rifle_smdi.paa         <-- Specular/metallic (shininess)
  my_rifle_as.paa           <-- Ambient shadow (baked AO)
  my_rifle_ca.paa           <-- Color with alpha (if transparency needed)
```

### Kanały _smdi

Tekstura specular/metallic/detail pakuje trzy strumienie danych w jeden obraz RGB:

| Kanał | Dane | Zakres | Efekt |
|---------|------|-------|--------|
| **R** | Metaliczny | 0-255 | 0 = niemetalowy, 255 = pełny metal |
| **G** | Chropowatość (odwrócone specular) | 0-255 | 0 = szorstki/matowy, 255 = gładki/błyszczący |
| **B** | Indeks detalu / AO | 0-255 | Kafelkowanie detalu lub okluzja otoczenia |

### Kanały _nohq

Mapy normalnych w DayZ używają kodowania tangent-space:

| Kanał | Dane |
|---------|------|
| **R** | Normalna osi X (lewo-prawo) |
| **G** | Normalna osi Y (góra-dół) |
| **B** | Normalna osi Z (w kierunku obserwatora) |
| **A** | Moc specularna (opcjonalna, zależy od materiału) |

---

## Wymagania rozdzielczości

Silnik Enfusion wymaga, aby wszystkie tekstury miały **wymiary będące potęgami dwójki**. Zarówno szerokość, jak i wysokość muszą niezależnie być potęgą 2, ale nie muszą być równe (tekstury niekwadratowe są prawidłowe).

### Prawidłowe wymiary

| Rozmiar | Typowe zastosowanie |
|------|-------------|
| **64x64** | Małe ikony, elementy UI |
| **128x128** | Małe ikony, miniatury ekwipunku |
| **256x256** | Panele UI, małe tekstury przedmiotów |
| **512x512** | Standardowe tekstury przedmiotów, ubrania |
| **1024x1024** | Broń, szczegółowe ubrania, części pojazdów |
| **2048x2048** | Wysoko szczegółowa broń, modele postaci |
| **4096x4096** | Tekstury terenu, duże tekstury pojazdów |

### Tekstury niekwadratowe

Niekwadratowe tekstury o wymiarach będących potęgami dwójki są prawidłowe:

```
256x512    -- Valid (both are powers of 2)
512x1024   -- Valid
1024x2048  -- Valid
300x512    -- INVALID (300 is not a power of 2)
```

### Wytyczne dotyczące rozdzielczości

- **Broń:** 2048x2048 dla głównego korpusu, 1024x1024 dla dodatków.
- **Ubrania:** 1024x1024 lub 2048x2048 w zależności od pokrycia powierzchni.
- **Ikony UI:** 128x128 lub 256x256 dla ikon ekwipunku, 64x64 dla elementów HUD.
- **Teren:** 4096x4096 dla map satelitarnych, 512x512 lub 1024x1024 dla kafelków materiałów.
- **Mapy normalnych:** Ta sama rozdzielczość co odpowiadająca tekstura koloru.
- **Mapy SMDI:** Ta sama rozdzielczość co odpowiadająca tekstura koloru.

> **Ostrzeżenie:** Jeśli tekstura ma wymiary niebędące potęgami dwójki, silnik odmówi jej załadowania lub wyświetli magentową teksturę błędu. TexView2 pokaże ostrzeżenie podczas konwersji.

---

## Obsługa kanału alfa

Kanał alfa w teksturze niesie dodatkowe dane poza kolorem. Sposób interpretacji zależy od sufiksu tekstury i shadera materiału.

### Role kanału alfa

| Sufiks | Interpretacja alfy |
|--------|---------------------|
| `_co` | Zazwyczaj nieużywana; jeśli obecna, może definiować przezroczystość dla prostych materiałów |
| `_ca` | Maska przezroczystości (0 = w pełni przezroczysty, 255 = w pełni nieprzezroczysty) |
| `_nohq` | Mapa mocy specularnej (wyższa = ostrzejszy odblask specularny) |
| `_smdi` | Zazwyczaj nieużywana |
| `_li` | Maska intensywności emisji |

### Tworzenie tekstur z alfą

W edytorze obrazów (Photoshop, GIMP, Krita):

1. Utwórz zawartość RGB jak zwykle.
2. Dodaj kanał alfa.
3. Maluj biały (255) tam, gdzie chcesz pełnej krycia/efektu, czarny (0) tam, gdzie nic nie chcesz.
4. Eksportuj jako 32-bit TGA lub PNG.
5. Skonwertuj do PAA za pomocą TexView2 -- automatycznie wykryje kanał alfa.

### Weryfikacja alfy w TexView2

Otwórz PAA w TexView2 i użyj przycisków wyświetlania kanałów:

- **RGBA** -- Pokazuje finalną kompozycję
- **RGB** -- Pokazuje tylko kolor
- **A** -- Pokazuje tylko kanał alfa (biały = nieprzezroczysty, czarny = przezroczysty)

---

## Konwersja między formatami

### TexView2 (Główne narzędzie)

**TexView2** jest dołączony do DayZ Tools i jest standardowym narzędziem konwersji tekstur.

**Otwieranie pliku:**
1. Uruchom TexView2 z DayZ Tools lub bezpośrednio z `DayZ Tools\Bin\TexView2\TexView2.exe`.
2. Otwórz plik źródłowy (TGA, PNG lub EDDS).
3. Sprawdź, czy obraz wygląda poprawnie i zweryfikuj wymiary.

**Konwersja do PAA:**
1. Otwórz teksturę źródłową w TexView2.
2. Przejdź do **File --> Save As**.
3. Wybierz **PAA** jako format wyjściowy.
4. Wybierz typ kompresji:
   - **DXT1** dla nieprzezroczystych tekstur (alfa niepotrzebna)
   - **DXT5** dla tekstur z przezroczystością alfa
   - **ARGB4444** dla małych tekstur UI, gdzie rozmiar pliku ma znaczenie
5. Kliknij **Save**.

**Konwersja wsadowa z linii poleceń:**

```bash
# Convert a single TGA to PAA
"P:\DayZ Tools\Bin\TexView2\TexView2.exe" -i "source.tga" -o "output.paa"

# TexView2 will auto-select compression based on alpha channel presence
```

### Binarize (Automatycznie)

Gdy Binarize przetwarza katalog źródłowy twojego moda, automatycznie konwertuje wszystkie rozpoznane formaty tekstur (TGA, PNG, EDDS) do PAA. Dzieje się to jako część procesu AddonBuilder.

**Przepływ konwersji Binarize:**
```
source/mod_name/data/texture_co.tga
    --> Binarize detects TGA
        --> Converts to PAA with automatic compression selection
            --> Output: build/mod_name/data/texture_co.paa
```

### Tabela ręcznej konwersji

| Z | Do | Narzędzie | Uwagi |
|------|----|------|-------|
| TGA --> PAA | TexView2 | Standardowy przepływ pracy |
| PNG --> PAA | TexView2 | Działa identycznie jak TGA |
| EDDS --> PAA | TexView2 lub Binarize | Automatycznie podczas budowania |
| PAA --> TGA | TexView2 (Save As TGA) | Do edycji istniejących tekstur |
| PAA --> PNG | TexView2 (Save As PNG) | Do ekstrakcji do przenośnego formatu |
| PSD --> TGA/PNG | Photoshop/GIMP | Eksport z edytora, następnie konwersja |

---

## Jakość i kompresja tekstur

### Wybór typu kompresji

| Scenariusz | Zalecana kompresja | Powód |
|----------|------------------------|--------|
| Nieprzezroczysty diffuse (`_co`) | DXT1 | Najlepszy współczynnik, alfa niepotrzebna |
| Przezroczysty diffuse (`_ca`) | DXT5 | Pełna obsługa alfy |
| Mapy normalnych (`_nohq`) | DXT5 | Kanał alfa niesie moc specularną |
| Mapy specularne (`_smdi`) | DXT1 | Zazwyczaj nieprzezroczyste, tylko kanały RGB |
| Tekstury UI | ARGB4444 lub DXT5 | Mały rozmiar, czyste krawędzie |
| Mapy emisji (`_li`) | DXT1 lub DXT5 | DXT5 jeśli alfa niesie intensywność |

### Jakość vs. rozmiar pliku

```
Format        2048x2048 approx. size
-----------------------------------------
ARGB8888      16.0 MB    (uncompressed)
DXT5           5.3 MB    (4:1 compression)
DXT1           2.7 MB    (6:1 compression)
ARGB4444       8.0 MB    (2:1 compression)
```

### Ustawienia jakości w grze

Gracze mogą dostosować jakość tekstur w ustawieniach wideo DayZ. Silnik wybiera niższe poziomy mip, gdy jakość jest zmniejszona, więc twoje tekstury będą wyglądać na coraz bardziej rozmazane przy niższych ustawieniach. Jest to automatyczne -- nie musisz tworzyć oddzielnych poziomów jakości.

---

## Przykłady z praktyki

### Zestaw tekstur broni

Typowy mod broni zawiera następujące pliki tekstur:

```
MyMod_Weapons/data/weapons/m4a1/
  my_weapon_co.paa           <-- 2048x2048, DXT1, base color
  my_weapon_nohq.paa         <-- 2048x2048, DXT5, normal map
  my_weapon_smdi.paa          <-- 2048x2048, DXT1, specular/metallic
  my_weapon_as.paa            <-- 1024x1024, DXT1, ambient shadow
```

Plik materiału (`.rvmat`) odwołuje się do tych tekstur i przypisuje je do etapów shadera.

### Tekstura UI (Źródło imagesetu)

```
MyFramework/data/gui/icons/
  my_icons_co.paa           <-- 512x512, ARGB4444, sprite atlas
```

Tekstury UI są często pakowane w pojedynczy atlas (imageset) i referencjonowane po nazwie w plikach layoutu. Kompresja ARGB4444 jest powszechna dla UI, ponieważ zachowuje czyste krawędzie przy zachowaniu małych rozmiarów plików.

### Tekstury terenu

```
terrain/
  grass_green_co.paa         <-- 1024x1024, DXT1, tiling color
  grass_green_nohq.paa       <-- 1024x1024, DXT5, tiling normal
  grass_green_smdi.paa        <-- 1024x1024, DXT1, tiling specular
  grass_green_mc.paa          <-- 512x512, DXT1, macro variation
  grass_green_de.paa          <-- 512x512, DXT1, detail tiling
```

Tekstury terenu kafelkują się po krajobrazie. Tekstura makro `_mc` dodaje wielkoskalową wariację koloru, aby zapobiec powtarzalności.

---

## Najczęstsze błędy

### 1. Wymiary niebędące potęgami dwójki

**Objaw:** Magentowa tekstura w grze, ostrzeżenia TexView2.
**Rozwiązanie:** Zmień rozmiar źródła do najbliższej potęgi 2 przed konwersją.

### 2. Brakujący sufiks

**Objaw:** Materiał nie może znaleźć tekstury lub renderuje ją niepoprawnie.
**Rozwiązanie:** Zawsze dołączaj odpowiedni sufiks (`_co`, `_nohq`, itd.) w nazwie pliku.

### 3. Zła kompresja dla alfy

**Objaw:** Przezroczystość wygląda na blokową lub binarną (wł./wył. bez gradientu).
**Rozwiązanie:** Użyj DXT5 zamiast DXT1 dla tekstur, które potrzebują gładkich gradientów alfy.

### 4. Zapomnienie o mipmapach

**Objaw:** Tekstura wygląda dobrze z bliska, ale mieni się/iskrzy z odległości.
**Rozwiązanie:** Pliki PAA generowane przez TexView2 automatycznie zawierają mipmapy. Jeśli używasz niestandardowego narzędzia, upewnij się, że generowanie mipmap jest włączone.

### 5. Niepoprawny format mapy normalnych

**Objaw:** Oświetlenie modelu wygląda na odwrócone lub płaskie.
**Rozwiązanie:** Upewnij się, że twoja mapa normalnych jest w formacie tangent-space z konwencją osi Y w stylu DirectX (zielony kanał: góra = jaśniej). Niektóre narzędzia eksportują w stylu OpenGL (odwrócone Y) -- musisz odwrócić zielony kanał.

### 6. Niezgodność ścieżek po konwersji

**Objaw:** Model lub materiał pokazuje magentę, ponieważ odwołuje się do ścieżki `.tga`, ale PBO zawiera `.paa`.
**Rozwiązanie:** Materiały powinny odwoływać się do finalnej ścieżki `.paa`. Binarize automatycznie obsługuje przemapowanie ścieżek, ale jeśli pakujesz z `-packonly` (bez binaryzacji), musisz zapewnić, że ścieżki dokładnie się zgadzają.

---

## Dobre praktyki

1. **Przechowuj pliki źródłowe w kontroli wersji.** Przechowuj źródła TGA/PNG obok moda. Pliki PAA to wygenerowany wynik -- źródła są tym, co się liczy.

2. **Dopasuj rozdzielczość do ważności.** Karabin, na który gracz patrzy godzinami, zasługuje na 2048x2048. Puszka fasoli z tyłu półki może używać 512x512.

3. **Zawsze dostarczaj mapę normalnych.** Nawet płaska mapa normalnych (128, 128, 255 jednolite wypełnienie) jest lepsza niż brak -- brakujące mapy normalnych powodują błędy materiałów.

4. **Nazywaj konsekwentnie.** Jedna bazowa nazwa, wiele sufiksów: `myitem_co.paa`, `myitem_nohq.paa`, `myitem_smdi.paa`. Nigdy nie mieszaj schematów nazewnictwa.

5. **Podglądaj w TexView2 przed budowaniem.** Otwórz wygenerowany PAA i sprawdź, czy wygląda poprawnie. Sprawdź każdy kanał osobno.

6. **Używaj DXT1 domyślnie, DXT5 tylko gdy alfa jest potrzebna.** DXT1 ma połowę rozmiaru pliku DXT5 i wygląda identycznie dla nieprzezroczystych tekstur.

7. **Testuj przy niskich ustawieniach jakości.** Co wygląda świetnie na Ultra, może być nieczytelne na Low, ponieważ silnik agresywnie obniża poziomy mip.

---

## Nawigacja

| Poprzedni | W górę | Dalej |
|----------|----|------|
| [Część 3: System GUI](../03-gui-system/07-styles-fonts.md) | [Część 4: Formaty plików i DayZ Tools](../04-file-formats/01-textures.md) | [4.2 Modele 3D](02-models.md) |
