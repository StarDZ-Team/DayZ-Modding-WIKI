# Rozdział 4.3: Materiały (.rvmat)

[Strona główna](../../README.md) | [<< Poprzedni: Modele 3D](02-models.md) | **Materiały** | [Dalej: Audio >>](04-audio.md)

---

## Wprowadzenie

Materiał w DayZ jest pomostem między modelem 3D a jego wyglądem wizualnym. Podczas gdy tekstury dostarczają surowe dane obrazu, plik **RVMAT** (Real Virtuality Material) definiuje, jak te tekstury są łączone, który shader je interpretuje i jakie właściwości powierzchni silnik powinien symulować -- połyskliwość, przezroczystość, samoświecenie i więcej. Każda ściana na każdym modelu P3D w grze odwołuje się do pliku RVMAT, a zrozumienie sposobu ich tworzenia i konfiguracji jest niezbędne dla każdego moda wizualnego.

Ten rozdział opisuje format pliku RVMAT, typy shaderów, konfigurację etapów tekstur, właściwości materiałów, system zamiany materiałów przy różnych poziomach uszkodzeń oraz praktyczne przykłady z DayZ-Samples.

---

## Spis treści

- [Przegląd formatu RVMAT](#przegląd-formatu-rvmat)
- [Struktura pliku](#struktura-pliku)
- [Typy shaderów](#typy-shaderów)
- [Etapy tekstur](#etapy-tekstur)
- [Właściwości materiałów](#właściwości-materiałów)
- [Poziomy zdrowia (zamiana materiałów przy uszkodzeniach)](#poziomy-zdrowia-zamiana-materiałów-przy-uszkodzeniach)
- [Jak materiały odwołują się do tekstur](#jak-materiały-odwołują-się-do-tekstur)
- [Tworzenie RVMAT od podstaw](#tworzenie-rvmat-od-podstaw)
- [Przykłady z praktyki](#przykłady-z-praktyki)
- [Najczęstsze błędy](#najczęstsze-błędy)
- [Dobre praktyki](#dobre-praktyki)

---

## Przegląd formatu RVMAT

Plik **RVMAT** to tekstowy plik konfiguracyjny (nie binarny) definiujący materiał. Mimo niestandardowego rozszerzenia, format to zwykły tekst używający składni konfiguracji w stylu Bohemii z klasami i parami klucz-wartość.

### Kluczowe cechy

- **Format tekstowy:** Edytowalny w dowolnym edytorze tekstu (Notepad++, VS Code).
- **Wiązanie shadera:** Każdy RVMAT określa, którego shadera renderowania użyć.
- **Mapowanie tekstur:** Definiuje, które pliki tekstur są przypisane do których wejść shadera (diffuse, normal, specular, itp.).
- **Właściwości powierzchni:** Kontroluje intensywność specularną, poświatę emisyjną, przezroczystość i więcej.
- **Referencjonowany przez modele P3D:** Ścianom w LOD Resolution Object Builder przypisuje się RVMAT. Silnik ładuje RVMAT i wszystkie tekstury, do których się odwołuje.
- **Referencjonowany przez config.cpp:** `hiddenSelectionsMaterials[]` może nadpisywać materiały w trakcie działania.

---

## Struktura pliku

Plik RVMAT ma spójną strukturę. Oto kompletny, opatrzony komentarzami przykład:

```cpp
ambient[] = {1.0, 1.0, 1.0, 1.0};        // Ambient color multiplier (RGBA)
diffuse[] = {1.0, 1.0, 1.0, 1.0};        // Diffuse color multiplier (RGBA)
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};  // Additive diffuse override
emmisive[] = {0.0, 0.0, 0.0, 0.0};       // Emissive (self-illumination) color
specular[] = {0.7, 0.7, 0.7, 1.0};       // Specular highlight color
specularPower = 80;                        // Specular sharpness (higher = tighter highlight)
PixelShaderID = "Super";                   // Shader program to use
VertexShaderID = "Super";                  // Vertex shader program

class Stage1                               // Texture stage: Normal map
{
    texture = "MyMod\data\my_item_nohq.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage2                               // Texture stage: Diffuse/Color map
{
    texture = "MyMod\data\my_item_co.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage3                               // Texture stage: Specular/Metallic map
{
    texture = "MyMod\data\my_item_smdi.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};
```

### Właściwości najwyższego poziomu

| Właściwość | Typ | Opis |
|----------|------|-------------|
| `ambient[]` | float[4] | Mnożnik koloru światła otoczenia. `{1,1,1,1}` = pełny, `{0,0,0,0}` = brak otoczenia. |
| `diffuse[]` | float[4] | Mnożnik koloru światła rozproszonego. Zazwyczaj `{1,1,1,1}`. |
| `forcedDiffuse[]` | float[4] | Addytywne nadpisanie diffuse. Zazwyczaj `{0,0,0,0}`. |
| `emmisive[]` | float[4] | Kolor samoświecenia. Wartości niezerowe sprawiają, że powierzchnia świeci. Uwaga: Bohemia używa błędnej pisowni `emmisive`, nie `emissive`. |
| `specular[]` | float[4] | Kolor i intensywność odblasków specularnych. |
| `specularPower` | float | Ostrość odblasków specularnych. Zakres 1-200. Wyższa = ciaśniejsze, bardziej skupione odbicie. |
| `PixelShaderID` | string | Nazwa programu shadera pikseli. |
| `VertexShaderID` | string | Nazwa programu shadera wierzchołków. |

---

## Typy shaderów

### Dostępne shadery

| Shader | Przypadek użycia | Wymagane etapy tekstur |
|--------|----------|------------------------|
| **Super** | Standardowe nieprzezroczyste powierzchnie (broń, odzież, przedmioty) | Normal, Diffuse, Specular/Metallic |
| **Multi** | Wielowarstwowy teren i złożone powierzchnie | Wiele par diffuse/normal |
| **Glass** | Przezroczyste i półprzezroczyste powierzchnie | Diffuse z alfą |
| **Water** | Powierzchnie wodne z odbiciem i refrakcją | Specjalne tekstury wody |
| **AlphaTest** | Ostrokrawędziowa przezroczystość (roślinność, ogrodzenia) | Diffuse z alfą |
| **AlphaBlend** | Gładka przezroczystość (szkło, dym) | Diffuse z alfą |

### Shader Super (Najczęstszy)

Shader **Super** to standardowy shader renderowania opartego na fizyce używany dla zdecydowanej większości przedmiotów w DayZ. Oczekuje trzech etapów tekstur:

```
Stage1 = Normal map (_nohq)
Stage2 = Diffuse/Color map (_co)
Stage3 = Specular/Metallic map (_smdi)
```

---

## Etapy tekstur

### Przypisania etapów dla shadera Super

| Etap | Rola tekstury | Typowy sufiks | Opis |
|-------|-------------|----------------|-------------|
| **Stage1** | Mapa normalnych | `_nohq` | Detale powierzchni, nierówności, rowki |
| **Stage2** | Mapa diffuse / koloru | `_co` lub `_ca` | Bazowy kolor powierzchni |
| **Stage3** | Mapa specular / metaliczna | `_smdi` | Połyskliwość, właściwości metaliczne, detal |
| **Stage4** | Cień otoczenia | `_as` | Wstępnie wypieciona okluzja otoczenia (opcjonalnie) |
| **Stage5** | Mapa makro | `_mc` | Wielkoskalowa wariacja koloru (opcjonalnie) |
| **Stage6** | Mapa detalu | `_de` | Kafelkowany mikrodetal (opcjonalnie) |
| **Stage7** | Mapa emisji / światła | `_li` | Samoświecenie (opcjonalnie) |

---

## Poziomy zdrowia (zamiana materiałów przy uszkodzeniach)

Przedmioty DayZ degradują się z czasem. Silnik obsługuje automatyczną zamianę materiałów przy różnych progach uszkodzeń, definiowaną w `config.cpp` za pomocą tablicy `healthLevels[]`.

### Struktura healthLevels[]

```cpp
class MyItem: Inventory_Base
{
    healthLevels[] =
    {
        {1.0, {"MyMod\data\my_item.rvmat"}},           // Pristine (100% health)
        {0.7, {"MyMod\data\my_item_worn.rvmat"}},       // Worn (70% health)
        {0.5, {"MyMod\data\my_item_damaged.rvmat"}},     // Damaged (50% health)
        {0.3, {"MyMod\data\my_item_badly_damaged.rvmat"}},// Badly Damaged (30% health)
        {0.0, {"MyMod\data\my_item_ruined.rvmat"}}       // Ruined (0% health)
    };
};
```

### Jak to działa

1. Silnik monitoruje wartość zdrowia przedmiotu (0.0 do 1.0).
2. Gdy zdrowie spada poniżej progu, silnik zamienia materiał na odpowiedni RVMAT.
3. Każdy RVMAT może odwoływać się do innych tekstur -- zazwyczaj stopniowo bardziej uszkodzonych wariantów.
4. Zamiana jest automatyczna. Nie jest potrzebny żaden kod skryptowy.

### Używanie waniliowych materiałów uszkodzeń

DayZ dostarcza zestaw ogólnych materiałów uszkodzeń nakładkowych, które można użyć, jeśli nie chcesz tworzyć niestandardowych tekstur uszkodzeń:

```cpp
healthLevels[] =
{
    {1.0, {"MyMod\data\my_item.rvmat"}},
    {0.7, {"DZ\data\data\default_worn.rvmat"}},
    {0.5, {"DZ\data\data\default_damaged.rvmat"}},
    {0.3, {"DZ\data\data\default_badly_damaged.rvmat"}},
    {0.0, {"DZ\data\data\default_ruined.rvmat"}}
};
```

---

## Najczęstsze błędy

### 1. Zła kolejność etapów

**Objaw:** Tekstura wygląda na pomieszaną, mapa normalnych wyświetla się jako kolor, kolor jako nierówności.
**Rozwiązanie:** Upewnij się, że Stage1 = normal, Stage2 = diffuse, Stage3 = specular (dla shadera Super).

### 2. Błąd pisowni `emmisive`

**Objaw:** Emisja nie działa.
**Rozwiązanie:** Bohemia używa `emmisive` (podwójne m, pojedyncze s). Używanie poprawnej angielskiej pisowni `emissive` nie zadziała. To znana historyczna ciekawostka.

### 3. Niezgodność ścieżek tekstur

**Objaw:** Model wyświetla się z domyślnym szarym lub magentowym materiałem.
**Rozwiązanie:** Sprawdź, czy ścieżki tekstur w RVMAT dokładnie odpowiadają lokalizacjom plików relatywnie do dysku P:. Ścieżki używają ukośników wstecznych. Sprawdź wielkość liter -- niektóre systemy rozróżniają wielkość liter.

### 4. Brak przypisania RVMAT w P3D

**Objaw:** Model renderuje się bez materiału (płaski szary lub domyślny shader).
**Rozwiązanie:** Otwórz model w Object Builder, zaznacz ściany i przypisz RVMAT przez **Face Properties**.

### 5. Użycie złego shadera dla przezroczystych przedmiotów

**Objaw:** Przezroczysta tekstura wyświetla się jako nieprzezroczysta lub cała powierzchnia znika.
**Rozwiązanie:** Użyj shadera `Glass`, `AlphaTest` lub `AlphaBlend` zamiast `Super` dla przezroczystych powierzchni. Używaj tekstur z sufiksem `_ca` z odpowiednimi kanałami alfa.

---

## Dobre praktyki

1. **Zacznij od działającego przykładu.** Skopiuj RVMAT z DayZ-Samples lub waniliowego przedmiotu i zmodyfikuj go. Zaczynanie od zera prowadzi do literówek.

2. **Przechowuj materiały i tekstury razem.** Umieszczaj RVMAT w tym samym katalogu `data/` co jego tekstury. Czyni to relację oczywistą i upraszcza zarządzanie ścieżkami.

3. **Używaj shadera Super, chyba że masz powód, by tego nie robić.** Obsługuje 95% przypadków użycia poprawnie.

4. **Twórz materiały uszkodzeń nawet dla prostych przedmiotów.** Gracze zauważają, gdy przedmioty nie degradują się wizualnie. Minimum to użycie waniliowych domyślnych materiałów uszkodzeń dla niższych poziomów zdrowia.

5. **Testuj specular w grze, nie tylko w Object Builder.** Oświetlenie edytora i oświetlenie w grze dają bardzo różne wyniki. To, co wygląda idealnie w Object Builder, może być zbyt błyszczące lub zbyt matowe pod dynamicznym oświetleniem DayZ.

6. **Dokumentuj ustawienia materiałów.** Gdy znajdziesz wartości specular/power, które dobrze działają dla danego typu powierzchni, zanotuj je. Będziesz ponownie używać tych ustawień w wielu przedmiotach.

---

## Nawigacja

| Poprzedni | W górę | Dalej |
|----------|----|------|
| [4.2 Modele 3D](02-models.md) | [Część 4: Formaty plików i DayZ Tools](01-textures.md) | [4.4 Audio](04-audio.md) |
