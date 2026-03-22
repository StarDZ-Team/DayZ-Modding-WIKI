# Rozdział 5.4: Format ImageSet

[Strona główna](../README.md) | [<< Poprzedni: Credits.json](03-credits-json.md) | **Format ImageSet** | [Następny: Pliki konfiguracyjne serwera >>](05-server-configs.md)

---

> **Podsumowanie:** ImageSety definiują nazwane regiony sprite'ów wewnątrz atlasu tekstur. Są głównym mechanizmem DayZ do odwoływania się do ikon, grafik UI i arkuszy sprite'ów z plików layoutów i skryptów. Zamiast ładować setki pojedynczych plików obrazów, pakujesz wszystkie ikony w jedną teksturę i opisujesz pozycję oraz rozmiar każdej ikony w pliku definicji imagesetów.

---

## Spis treści

- [Przegląd](#przegląd)
- [Jak działają ImageSety](#jak-działają-imagesety)
- [Natywny format ImageSet DayZ](#natywny-format-imageset-dayz)
- [Format XML ImageSet](#format-xml-imageset)
- [Rejestrowanie ImageSetów w config.cpp](#rejestrowanie-imagesetów-w-configcpp)
- [Odwoływanie się do obrazów w layoutach](#odwoływanie-się-do-obrazów-w-layoutach)
- [Odwoływanie się do obrazów w skryptach](#odwoływanie-się-do-obrazów-w-skryptach)
- [Flagi obrazów](#flagi-obrazów)
- [Tekstury wielorozdzielczościowe](#tekstury-wielorozdzielczościowe)
- [Tworzenie własnych zestawów ikon](#tworzenie-własnych-zestawów-ikon)
- [Wzorzec integracji Font Awesome](#wzorzec-integracji-font-awesome)
- [Przykłady z praktyki](#przykłady-z-praktyki)
- [Najczęstsze błędy](#najczęstsze-błędy)

---

## Przegląd

Atlas tekstur to pojedynczy duży obraz (zwykle w formacie `.edds`) zawierający wiele mniejszych ikon rozmieszczonych w siatce lub dowolnym układzie. Plik imageset mapuje czytelne dla człowieka nazwy na prostokątne regiony wewnątrz tego atlasu.

Na przykład tekstura 1024x1024 może zawierać 64 ikony po 64x64 piksele każda. Plik imageset mówi: "ikona o nazwie `arrow_down` znajduje się na pozycji (128, 64) i ma rozmiar 64x64 pikseli." Twoje pliki layoutów i skrypty odwołują się do `arrow_down` po nazwie, a silnik wyodrębnia odpowiedni pod-prostokąt z atlasu w czasie renderowania.

To podejście jest wydajne: jedno załadowanie tekstury GPU obsługuje wszystkie ikony, zmniejszając liczbę wywołań rysowania i obciążenie pamięci.

---

## Jak działają ImageSety

Przepływ danych:

1. **Atlas tekstur** (plik `.edds`) --- pojedynczy obraz zawierający wszystkie ikony
2. **Definicja ImageSet** (plik `.imageset`) --- mapuje nazwy na regiony w atlasie
3. **Rejestracja w config.cpp** --- mówi silnikowi, aby załadował imageset przy starcie
4. **Odniesienie w layoucie/skrypcie** --- używa składni `set:nazwa image:nazwaIkony` do renderowania konkretnej ikony

Po zarejestrowaniu dowolny widget w dowolnym pliku layoutu może odwoływać się do dowolnego obrazu z zestawu po nazwie.

---

## Natywny format ImageSet DayZ

Format natywny używa składni opartej na klasach silnika Enfusion (podobnej do config.cpp). Jest to format używany przez grę vanilla i większość uznanych modów.

### Struktura

```
ImageSetClass {
 Name "my_icons"
 RefSize 1024 1024
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "MyMod/GUI/imagesets/my_icons.edds"
  }
 }
 Images {
  ImageSetDefClass icon_name {
   Name "icon_name"
   Pos 0 0
   Size 64 64
   Flags 0
  }
 }
}
```

### Pola najwyższego poziomu

| Pole | Opis |
|------|------|
| `Name` | Nazwa zestawu. Używana w części `set:` odwołań do obrazów. Musi być unikalna wśród wszystkich załadowanych modów. |
| `RefSize` | Wymiary referencyjne tekstury (szerokość wysokość). Używane do mapowania współrzędnych. |
| `Textures` | Zawiera jeden lub więcej wpisów `ImageSetTextureClass` dla różnych poziomów rozdzielczości mip. |

### Pola wpisu tekstury

| Pole | Opis |
|------|------|
| `mpix` | Minimalny poziom pikseli (poziom mip). `0` = najniższa rozdzielczość, `1` = standardowa rozdzielczość. |
| `path` | Ścieżka do pliku tekstury `.edds`, względem katalogu głównego moda. Może używać formatu GUID Enfusion (`{GUID}ścieżka`) lub zwykłych ścieżek względnych. |

### Pola wpisu obrazu

Każdy obraz to `ImageSetDefClass` wewnątrz bloku `Images`:

| Pole | Opis |
|------|------|
| Nazwa klasy | Musi odpowiadać polu `Name` (używane do wyszukiwania przez silnik) |
| `Name` | Identyfikator obrazu. Używany w części `image:` odwołań. |
| `Pos` | Pozycja lewego górnego rogu w atlasie (x y), w pikselach |
| `Size` | Wymiary (szerokość wysokość), w pikselach |
| `Flags` | Flagi zachowania kafelkowania (zobacz [Flagi obrazów](#flagi-obrazów)) |

### Pełny przykład (DayZ Vanilla)

```
ImageSetClass {
 Name "dayz_gui"
 RefSize 1024 1024
 Textures {
  ImageSetTextureClass {
   mpix 0
   path "{534691EE0479871C}Gui/imagesets/dayz_gui.edds"
  }
  ImageSetTextureClass {
   mpix 1
   path "{C139E49FD0ECAF9E}Gui/imagesets/dayz_gui@2x.edds"
  }
 }
 Images {
  ImageSetDefClass Gradient {
   Name "Gradient"
   Pos 0 317
   Size 75 5
   Flags ISVerticalTile
  }
  ImageSetDefClass Expand {
   Name "Expand"
   Pos 121 257
   Size 20 20
   Flags 0
  }
 }
}
```

---

## Format XML ImageSet

Istnieje alternatywny format oparty na XML, używany przez niektóre mody. Jest prostszy, ale oferuje mniej funkcji (brak obsługi wielu rozdzielczości).

### Struktura

```xml
<?xml version="1.0" encoding="utf-8"?>
<imageset name="mh_icons" file="MyMod/GUI/imagesets/mh_icons.edds">
  <image name="icon_store" pos="0 0" size="64 64" />
  <image name="icon_cart" pos="64 0" size="64 64" />
  <image name="icon_wallet" pos="128 0" size="64 64" />
</imageset>
```

### Atrybuty XML

**Element `<imageset>`:**

| Atrybut | Opis |
|---------|------|
| `name` | Nazwa zestawu (odpowiednik natywnego `Name`) |
| `file` | Ścieżka do pliku tekstury (odpowiednik natywnego `path`) |

**Element `<image>`:**

| Atrybut | Opis |
|---------|------|
| `name` | Identyfikator obrazu |
| `pos` | Pozycja lewego górnego rogu jako `"x y"` |
| `size` | Wymiary jako `"szerokość wysokość"` |

### Kiedy używać którego formatu

| Funkcja | Format natywny | Format XML |
|---------|---------------|------------|
| Wiele rozdzielczości (poziomy mip) | Tak | Nie |
| Flagi kafelkowania | Tak | Nie |
| Ścieżki GUID Enfusion | Tak | Tak |
| Prostota | Niższa | Wyższa |
| Używany przez DayZ vanilla | Tak | Nie |
| Używany przez Expansion, MyMod, VPP | Tak | Sporadycznie |

**Zalecenie:** Używaj formatu natywnego dla modów produkcyjnych. Używaj formatu XML do szybkiego prototypowania lub prostych zestawów ikon, które nie potrzebują kafelkowania ani obsługi wielu rozdzielczości.

---

## Rejestrowanie ImageSetów w config.cpp

Pliki ImageSet muszą być zarejestrowane w `config.cpp` twojego moda w bloku `CfgMods` > `class defs` > `class imageSets`. Bez tej rejestracji silnik nigdy nie załaduje imagesetu, a twoje odwołania do obrazów zawiodą cicho.

### Składnia

```cpp
class CfgMods
{
    class MyMod
    {
        // ... inne pola ...
        class defs
        {
            class imageSets
            {
                files[] =
                {
                    "MyMod/GUI/imagesets/my_icons.imageset",
                    "MyMod/GUI/imagesets/my_other_icons.imageset"
                };
            };
        };
    };
};
```

### Przykład: MyMod Core

MyMod Core rejestruje siedem imagesetów, w tym zestawy ikon Font Awesome:

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "MyFramework/GUI/imagesets/prefabs.imageset",
            "MyFramework/GUI/imagesets/CUI.imageset",
            "MyFramework/GUI/icons/thin.imageset",
            "MyFramework/GUI/icons/light.imageset",
            "MyFramework/GUI/icons/regular.imageset",
            "MyFramework/GUI/icons/solid.imageset",
            "MyFramework/GUI/icons/brands.imageset"
        };
    };
};
```

### Przykład: VPP Admin Tools

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "VPPAdminTools/GUI/Textures/dayz_gui_vpp.imageset"
        };
    };
};
```

### Przykład: DayZ Editor

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "DayZEditor/gui/imagesets/dayz_editor_gui.imageset"
        };
    };
};
```

---

## Odwoływanie się do obrazów w layoutach

W plikach `.layout` użyj właściwości `image0` ze składnią `set:nazwa image:nazwaObrazu`:

```
ImageWidgetClass MyIcon {
 size 32 32
 hexactsize 1
 vexactsize 1
 image0 "set:dayz_gui image:icon_refresh"
}
```

### Rozbicie składni

```
set:NAZWASETU image:NAZWAOBAZU
```

- `NAZWASETU` --- pole `Name` z definicji imagesetu (np. `dayz_gui`, `solid`, `brands`)
- `NAZWAOBAZU` --- pole `Name` z konkretnego wpisu `ImageSetDefClass` (np. `icon_refresh`, `arrow_down`)

### Wiele stanów obrazu

Niektóre widgety obsługują wiele stanów obrazu (normalny, najechany, wciśnięty):

```
ImageWidgetClass icon {
 image0 "set:solid image:circle"
}

ButtonWidgetClass btn {
 image0 "set:dayz_gui image:icon_expand"
}
```

### Przykłady z prawdziwych modów

```
image0 "set:regular image:arrow_down_short_wide"     -- MyMod: ikona Font Awesome regular
image0 "set:dayz_gui image:icon_minus"                -- MyMod: ikona vanilla DayZ
image0 "set:dayz_gui image:icon_collapse"             -- MyMod: ikona vanilla DayZ
image0 "set:dayz_gui image:circle"                    -- MyMod: kształt vanilla DayZ
image0 "set:dayz_editor_gui image:eye_open"           -- DayZ Editor: własna ikona
```

---

## Odwoływanie się do obrazów w skryptach

W Enforce Script użyj `ImageWidget.LoadImageFile()` lub ustaw właściwości obrazu na widgetach:

### LoadImageFile

```c
ImageWidget icon = ImageWidget.Cast(layoutRoot.FindAnyWidget("MyIcon"));
icon.LoadImageFile(0, "set:solid image:circle");
```

Parametr `0` to indeks obrazu (odpowiadający `image0` w layoutach).

### Wiele stanów przez indeks

```c
ImageWidget collapseIcon;
collapseIcon.LoadImageFile(0, "set:regular image:square_plus");    // Stan normalny
collapseIcon.LoadImageFile(1, "set:solid image:square_minus");     // Stan przełączony
```

Przełączanie między stanami za pomocą `SetImage(indeks)`:

```c
collapseIcon.SetImage(isExpanded ? 1 : 0);
```

### Użycie zmiennych typu string

```c
// Z DayZ Editor
string icon = "set:dayz_editor_gui image:search";
searchBarIcon.LoadImageFile(0, icon);

// Później, zmiana dynamiczna
searchBarIcon.LoadImageFile(0, "set:dayz_gui image:icon_x");
```

---

## Flagi obrazów

Pole `Flags` we wpisach imagesetu w formacie natywnym kontroluje zachowanie kafelkowania, gdy obraz jest rozciągany poza swój naturalny rozmiar.

| Flaga | Wartość | Opis |
|-------|---------|------|
| `0` | 0 | Bez kafelkowania. Obraz rozciąga się, aby wypełnić widget. |
| `ISHorizontalTile` | 1 | Kafelkowanie poziome, gdy widget jest szerszy niż obraz. |
| `ISVerticalTile` | 2 | Kafelkowanie pionowe, gdy widget jest wyższy niż obraz. |
| Oba | 3 | Kafelkowanie w obu kierunkach (`ISHorizontalTile` + `ISVerticalTile`). |

### Użycie

```
ImageSetDefClass Gradient {
 Name "Gradient"
 Pos 0 317
 Size 75 5
 Flags ISVerticalTile
}
```

Ten obraz `Gradient` ma 75x5 pikseli. Gdy jest użyty w widgecie wyższym niż 5 pikseli, kafelkuje się pionowo, aby wypełnić wysokość, tworząc powtarzający się pasek gradientu.

Większość ikon używa `Flags 0` (bez kafelkowania). Flagi kafelkowania są głównie dla elementów UI takich jak obramowania, separatory i powtarzające się wzory.

---

## Tekstury wielorozdzielczościowe

Format natywny obsługuje tekstury o wielu rozdzielczościach dla tego samego imagesetu. Pozwala to silnikowi używać grafiki o wyższej rozdzielczości na wyświetlaczach o wysokim DPI.

```
Textures {
 ImageSetTextureClass {
  mpix 0
  path "Gui/imagesets/dayz_gui.edds"
 }
 ImageSetTextureClass {
  mpix 1
  path "Gui/imagesets/dayz_gui@2x.edds"
 }
}
```

- `mpix 0` --- niska rozdzielczość (używana przy niskich ustawieniach jakości lub odległych elementach UI)
- `mpix 1` --- standardowa/wysoka rozdzielczość (domyślna)

Konwencja nazewnictwa `@2x` jest zapożyczona z systemu wyświetlaczy Retina Apple, ale nie jest wymagana --- możesz nazwać plik dowolnie.

### W praktyce

Większość modów dołącza tylko `mpix 1` (jedna rozdzielczość). Obsługa wielu rozdzielczości jest głównie używana przez grę vanilla:

```
Textures {
 ImageSetTextureClass {
  mpix 1
  path "MyFramework/GUI/icons/solid.edds"
 }
}
```

---

## Tworzenie własnych zestawów ikon

### Przebieg krok po kroku

**1. Utwórz atlas tekstur**

Użyj edytora obrazów (Photoshop, GIMP itp.), aby rozmieścić ikony na jednym płótnie:
- Wybierz rozmiar będący potęgą dwójki (256x256, 512x512, 1024x1024 itp.)
- Rozmieść ikony w siatce dla łatwego obliczania współrzędnych
- Zostaw trochę odstępu między ikonami, aby zapobiec krwawieniu tekstur
- Zapisz jako `.tga` lub `.png`

**2. Konwertuj na EDDS**

DayZ używa formatu `.edds` (Enfusion DDS) dla tekstur. Użyj DayZ Workbench lub narzędzi Mikero do konwersji:
- Zaimportuj swój `.tga` do DayZ Workbench
- Lub użyj `Pal2PacE.exe` do konwersji `.paa` na `.edds`
- Wynik musi być plikiem `.edds`

**3. Napisz definicję ImageSet**

Zmapuj każdą ikonę na nazwany region. Jeśli twoje ikony są na siatce 64-pikselowej:

```
ImageSetClass {
 Name "mymod_icons"
 RefSize 512 512
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "MyMod/GUI/imagesets/mymod_icons.edds"
  }
 }
 Images {
  ImageSetDefClass settings {
   Name "settings"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass player {
   Name "player"
   Pos 64 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass map_marker {
   Name "map_marker"
   Pos 128 0
   Size 64 64
   Flags 0
  }
 }
}
```

**4. Zarejestruj w config.cpp**

Dodaj ścieżkę imagesetu do config.cpp twojego moda:

```cpp
class imageSets
{
    files[] =
    {
        "MyMod/GUI/imagesets/mymod_icons.imageset"
    };
};
```

**5. Użyj w layoutach i skryptach**

```
ImageWidgetClass SettingsIcon {
 image0 "set:mymod_icons image:settings"
 size 32 32
 hexactsize 1
 vexactsize 1
}
```

---

## Wzorzec integracji Font Awesome

MyMod Core (odziedziczony z DabsFramework) demonstruje potężny wzorzec: konwersję czcionek ikon Font Awesome na imagesety DayZ. Daje to modom dostęp do tysięcy profesjonalnej jakości ikon bez tworzenia własnej grafiki.

### Jak to działa

1. Ikony Font Awesome są renderowane na atlas tekstur w stałym rozmiarze siatki (64x64 na ikonę)
2. Każdy styl ikon dostaje swój własny imageset: `solid`, `regular`, `light`, `thin`, `brands`
3. Nazwy ikon w imagesecie odpowiadają nazwom ikon Font Awesome (np. `circle`, `arrow_down`, `discord`)
4. Imagesety są rejestrowane w config.cpp i dostępne dla dowolnego layoutu lub skryptu

### Zestawy ikon MyMod Core / DabsFramework

```
MyFramework/GUI/icons/
  solid.imageset       -- Wypełnione ikony (atlas 3648x3712, 64x64 na ikonę)
  regular.imageset     -- Ikony z konturem
  light.imageset       -- Lekko zarysowane ikony
  thin.imageset        -- Ultra-cienkie zarysowane ikony
  brands.imageset      -- Logotypy marek (Discord, GitHub itp.)
```

### Użycie w layoutach

```
image0 "set:solid image:circle"
image0 "set:solid image:gear"
image0 "set:regular image:arrow_down_short_wide"
image0 "set:brands image:discord"
image0 "set:brands image:500px"
```

### Użycie w skryptach

```c
// DayZ Editor używający zestawu solid
CollapseIcon.LoadImageFile(1, "set:solid image:square_minus");
CollapseIcon.LoadImageFile(0, "set:regular image:square_plus");
```

### Dlaczego ten wzorzec działa dobrze

- **Ogromna biblioteka ikon**: Tysiące ikon dostępnych bez żadnego tworzenia grafiki
- **Spójny styl**: Wszystkie ikony dzielą tę samą wagę wizualną i styl
- **Wiele grubości**: Wybieraj solid, regular, light lub thin dla różnych kontekstów wizualnych
- **Ikony marek**: Gotowe logotypy Discord, Steam, GitHub itp.
- **Standardowe nazwy**: Nazwy ikon zgodne z konwencjami Font Awesome, ułatwiające wyszukiwanie

### Struktura atlasu

Imageset solid, na przykład, ma `RefSize` 3648x3712 z ikonami rozmieszczonymi w interwałach 64-pikselowych:

```
ImageSetClass {
 Name "solid"
 RefSize 3648 3712
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "MyFramework/GUI/icons/solid.edds"
  }
 }
 Images {
  ImageSetDefClass circle {
   Name "circle"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass 360_degrees {
   Name "360_degrees"
   Pos 320 0
   Size 64 64
   Flags 0
  }
  ...
 }
}
```

---

## Przykłady z praktyki

### VPP Admin Tools

VPP pakuje wszystkie ikony narzędzi admina w pojedynczy atlas 1920x1080 z dowolnym pozycjonowaniem (nie ścisła siatka):

```
ImageSetClass {
 Name "dayz_gui_vpp"
 RefSize 1920 1080
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "{534691EE0479871E}VPPAdminTools/GUI/Textures/dayz_gui_vpp.edds"
  }
 }
 Images {
  ImageSetDefClass vpp_icon_cloud {
   Name "vpp_icon_cloud"
   Pos 1206 108
   Size 62 62
   Flags 0
  }
  ImageSetDefClass vpp_icon_players {
   Name "vpp_icon_players"
   Pos 391 112
   Size 62 62
   Flags 0
  }
 }
}
```

Odniesienie w layoutach:
```
image0 "set:dayz_gui_vpp image:vpp_icon_cloud"
```

### MyMod Weapons

Ikony broni i dodatków spakowane w duże atlasy o zróżnicowanych rozmiarach ikon:

```
ImageSetClass {
 Name "SNAFU_Weapons_Icons"
 RefSize 2048 2048
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "{7C781F3D4B1173D4}SNAFU_Guns_01/gui/Imagesets/SNAFU_Weapons_Icons.edds"
  }
 }
 Images {
  ImageSetDefClass SNAFUFGRIP {
   Name "SNAFUFGRIP"
   Pos 123 19
   Size 300 300
   Flags 0
  }
  ImageSetDefClass SNAFU_M14Optic {
   Name "SNAFU_M14Optic"
   Pos 426 20
   Size 300 300
   Flags 0
  }
 }
}
```

To pokazuje, że ikony nie muszą mieć jednolitego rozmiaru --- ikony ekwipunku broni używają 300x300, podczas gdy ikony UI zwykle 64x64.

### MyMod Core Prefabs

Prymitywy UI (zaokrąglone narożniki, gradienty alfa) spakowane w mały atlas 256x256:

```
ImageSetClass {
 Name "prefabs"
 RefSize 256 256
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "{82F14D6B9D1AA1CE}MyFramework/GUI/imagesets/prefabs.edds"
  }
 }
 Images {
  ImageSetDefClass Round_Outline_TopLeft {
   Name "Round_Outline_TopLeft"
   Pos 24 21
   Size 8 8
   Flags 0
  }
  ImageSetDefClass "Alpha 10" {
   Name "Alpha 10"
   Pos 0 15
   Size 1 1
   Flags 0
  }
 }
}
```

Uwaga: nazwy obrazów mogą zawierać spacje w cudzysłowach (np. `"Alpha 10"`). Jednak odwoływanie się do nich w layoutach wymaga dokładnej nazwy łącznie ze spacją.

### MyMod Market Hub (format XML)

Prostszy imageset XML dla modułu market hub:

```xml
<?xml version="1.0" encoding="utf-8"?>
<imageset name="mh_icons" file="DayZMarketHub/GUI/imagesets/mh_icons.edds">
  <image name="icon_store" pos="0 0" size="64 64" />
  <image name="icon_cart" pos="64 0" size="64 64" />
  <image name="icon_wallet" pos="128 0" size="64 64" />
  <image name="icon_vip" pos="192 0" size="64 64" />
  <image name="icon_weapons" pos="0 64" size="64 64" />
  <image name="icon_success" pos="0 192" size="64 64" />
  <image name="icon_error" pos="64 192" size="64 64" />
</imageset>
```

Odniesienie:
```
image0 "set:mh_icons image:icon_store"
```

---

## Najczęstsze błędy

### Zapomnienie o rejestracji w config.cpp

Najczęstszy problem. Jeśli twój plik imageset istnieje, ale nie jest wymieniony w `class imageSets { files[] = { ... }; };` w config.cpp, silnik nigdy go nie załaduje. Wszystkie odwołania do obrazów zawiodą cicho (widgety będą puste).

### Kolizje nazw zestawów

Jeśli dwa mody rejestrują imagesety z tą samą `Name`, tylko jeden jest ładowany (wygrywa ostatni). Używaj unikalnego prefiksu:

```
Name "mymod_icons"     -- Dobrze
Name "icons"           -- Ryzykowne, zbyt ogólne
```

### Zła ścieżka tekstury

`path` musi być względna do katalogu głównego PBO (jak plik wygląda wewnątrz spakowanego PBO):

```
path "MyMod/GUI/imagesets/icons.edds"     -- Poprawne jeśli MyMod jest korzeniem PBO
path "GUI/imagesets/icons.edds"            -- Źle jeśli korzeń PBO to MyMod/
path "C:/Users/dev/icons.edds"            -- Źle: ścieżki bezwzględne nie działają
```

### Niezgodność RefSize

`RefSize` musi odpowiadać rzeczywistym wymiarom pikseli twojej tekstury. Jeśli określisz `RefSize 512 512`, ale twoja tekstura ma 1024x1024, wszystkie pozycje ikon będą przesunięte o czynnik dwa.

### Współrzędne Pos przesunięte o jeden

`Pos` to lewy górny róg regionu ikony. Jeśli twoje ikony są w interwałach 64-pikselowych, ale przypadkowo przesuniesz o 1 piksel, ikony będą miały widoczny cienki pasek sąsiedniej ikony.

### Używanie .png lub .tga bezpośrednio

Silnik wymaga formatu `.edds` dla atlasów tekstur odwoływanych przez imagesety. Surowe pliki `.png` lub `.tga` nie załadują się. Zawsze konwertuj na `.edds` używając DayZ Workbench lub narzędzi Mikero.

### Spacje w nazwach obrazów

Choć silnik obsługuje spacje w nazwach obrazów (np. `"Alpha 10"`), mogą one powodować problemy w niektórych kontekstach parsowania. Preferuj podkreślenia: `Alpha_10`.

---

## Dobre praktyki

- Zawsze używaj unikalnej, prefiksowanej nazwą moda nazwy zestawu (np. `"mymod_icons"` zamiast `"icons"`). Kolizje nazw zestawów między modami powodują ciche nadpisanie jednego zestawu przez drugi.
- Używaj wymiarów tekstur będących potęgą dwójki (256x256, 512x512, 1024x1024). Tekstury niebędące potęgą dwójki działają, ale mogą mieć zmniejszoną wydajność renderowania na niektórych GPU.
- Dodaj 1-2 piksele odstępu między ikonami w atlasie, aby zapobiec krwawieniu tekstur na krawędziach, szczególnie gdy tekstura jest wyświetlana w rozmiarze innym niż natywny.
- Preferuj natywny format `.imageset` nad XML dla modów produkcyjnych. Obsługuje tekstury wielorozdzielczościowe i flagi kafelkowania, których format XML nie ma.
- Zweryfikuj, że `RefSize` dokładnie odpowiada rzeczywistym wymiarom tekstury. Niezgodność powoduje, że wszystkie współrzędne ikon są błędne o proporcjonalny czynnik.

---

## Kompatybilność i wpływ

- **Multi-Mod:** Kolizje nazw zestawów to główne ryzyko. Jeśli dwa mody definiują imageset o nazwie `"icons"`, tylko jeden jest ładowany (wygrywa ostatnie PBO). Wszystkie odwołania do `set:icons` w przegrywającym modzie psują się cicho. Zawsze używaj prefiksu specyficznego dla moda.
- **Wydajność:** Każda unikalna tekstura imagesetu to jedno załadowanie tekstury GPU. Konsolidowanie ikon w mniejszej liczbie, większych atlasów zmniejsza liczbę wywołań rysowania. Mod z 10 oddzielnymi teksturami 64x64 działa gorzej niż jeden atlas 512x512 z 10 ikonami.
- **Wersja:** Natywny format `.imageset` i składnia odwołań `set:nazwa image:nazwa` są stabilne od DayZ 1.0. Format XML jest dostępny jako alternatywa od wczesnych wersji, ale nie jest oficjalnie udokumentowany przez Bohemię.
