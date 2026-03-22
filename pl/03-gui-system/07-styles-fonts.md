# Rozdział 3.7: Style, czcionki i obrazy

[Strona główna](../README.md) | [<< Poprzedni: Obsługa zdarzeń](06-event-handling.md) | **Style, czcionki i obrazy** | [Dalej: Dialogi i modale >>](08-dialogs-modals.md)

---

Ten rozdział opisuje wizualne elementy składowe interfejsu DayZ: predefiniowane style, użycie czcionek, rozmiarowanie tekstu, widgety obrazów z referencjami imagesetów oraz jak tworzyć niestandardowe imagesety dla swojego moda.

---

## Style

Style to predefiniowane wyglądy wizualne, które można stosować do widgetów za pomocą atrybutu `style` w plikach layoutu. Kontrolują renderowanie tła, obramowania i ogólny wygląd bez konieczności ręcznej konfiguracji kolorów i obrazów.

### Popularne wbudowane style

| Nazwa stylu | Opis |
|---|---|
| `blank` | Brak wyglądu -- całkowicie przezroczyste tło |
| `Empty` | Brak renderowania tła |
| `Default` | Domyślny styl przycisku/widgetu ze standardowym wyglądem DayZ |
| `Colorable` | Styl, który można barwić za pomocą `SetColor()` |
| `rover_sim_colorable` | Kolorowy styl panelu, powszechnie używany do teł |
| `rover_sim_black` | Ciemne tło panelu |
| `rover_sim_black_2` | Ciemniejszy wariant panelu |
| `Outline_1px_BlackBackground` | 1-pikselowe obramowanie z czarnym tłem |
| `OutlineFilled` | Obramowanie z wypełnionym wnętrzem |
| `DayZDefaultPanelRight` | Domyślny styl prawego panelu DayZ |
| `DayZNormal` | Normalny styl tekstu/widgetu DayZ |
| `MenuDefault` | Standardowy styl przycisku menu |

### Używanie stylów w layoutach

```
ButtonWidgetClass MyButton {
 style Default
 text "Click Me"
 size 120 30
 hexactsize 1
 vexactsize 1
}

PanelWidgetClass Background {
 style rover_sim_colorable
 color 0.2 0.3 0.5 0.9
 size 1 1
}
```

### Wzorzec styl + kolor

Style `Colorable` i `rover_sim_colorable` są zaprojektowane do barwienia. Ustaw atrybut `color` w layoucie lub wywołaj `SetColor()` w kodzie:

```
PanelWidgetClass TitleBar {
 style rover_sim_colorable
 color 0.4196 0.6471 1 0.9412
 size 1 30
 hexactsize 0
 vexactsize 1
}
```

```c
// Change color at runtime
PanelWidget bar = PanelWidget.Cast(root.FindAnyWidget("TitleBar"));
bar.SetColor(ARGB(240, 107, 165, 255));
```

### Style w profesjonalnych modach

Dialogi DabsFramework używają `Outline_1px_BlackBackground` dla kontenerów dialogów:

```
WrapSpacerWidgetClass EditorDialog {
 style Outline_1px_BlackBackground
 Padding 5
 "Size To Content V" 1
}
```

Colorful UI intensywnie używa `rover_sim_colorable` dla paneli tematycznych, gdzie kolor jest kontrolowany przez scentralizowany menedżer motywu.

---

## Czcionki

DayZ zawiera kilka wbudowanych czcionek. Ścieżki czcionek są podawane w atrybucie `font`.

### Wbudowane ścieżki czcionek

| Ścieżka czcionki | Opis |
|---|---|
| `"gui/fonts/Metron"` | Standardowa czcionka UI |
| `"gui/fonts/Metron28"` | Standardowa czcionka, wariant 28pt |
| `"gui/fonts/Metron-Bold"` | Wariant pogrubiony |
| `"gui/fonts/Metron-Bold58"` | Wariant pogrubiony 58pt |
| `"gui/fonts/sdf_MetronBook24"` | Czcionka SDF (Signed Distance Field) -- ostra w każdym rozmiarze |

### Używanie czcionek w layoutach

```
TextWidgetClass Title {
 text "Mission Briefing"
 font "gui/fonts/Metron-Bold"
 "text halign" center
 "text valign" center
}

TextWidgetClass Body {
 text "Objective: Secure the airfield"
 font "gui/fonts/Metron"
}
```

### Używanie czcionek w kodzie

```c
TextWidget tw = TextWidget.Cast(root.FindAnyWidget("MyText"));
tw.SetText("Hello");
// Font is set in the layout, not changeable at runtime via script
```

### Czcionki SDF

Czcionki SDF (Signed Distance Field) renderują się ostro przy dowolnym poziomie powiększenia, co czyni je idealnymi dla elementów UI, które mogą pojawiać się w różnych rozmiarach. Czcionka `sdf_MetronBook24` jest najlepszym wyborem dla tekstu, który musi wyglądać ostro w różnych ustawieniach skali UI.

---

## Rozmiarowanie tekstu: "exact text" vs. proporcjonalne

Widgety tekstowe DayZ obsługują dwa tryby rozmiarowania, kontrolowane przez atrybut `"exact text"`:

### Tekst proporcjonalny (domyślny)

Gdy `"exact text" 0` (domyślnie), rozmiar czcionki jest określony przez wysokość widgetu. Tekst skaluje się wraz z widgetem. To jest domyślne zachowanie.

```
TextWidgetClass ScalingText {
 size 1 0.05
 hexactsize 0
 vexactsize 0
 text "I scale with my parent"
}
```

### Dokładny rozmiar tekstu

Gdy `"exact text" 1`, rozmiar czcionki jest stałą wartością pikselową ustawioną przez `"exact text size"`:

```
TextWidgetClass FixedText {
 size 1 30
 hexactsize 0
 vexactsize 1
 text "I am always 16 pixels"
 "exact text" 1
 "exact text size" 16
}
```

### Którego użyć?

| Scenariusz | Zalecenie |
|---|---|
| Elementy HUD skalujące się z rozmiarem ekranu | Proporcjonalny (domyślny) |
| Tekst menu o określonym rozmiarze | `"exact text" 1` z `"exact text size"` |
| Tekst, który musi odpowiadać konkretnemu rozmiarowi czcionki w pikselach | `"exact text" 1` |
| Tekst wewnątrz spacerów/siatek | Często proporcjonalny, określony przez wysokość komórki |

### Atrybuty rozmiaru związane z tekstem

| Atrybut | Efekt |
|---|---|
| `"size to text h" 1` | Szerokość widgetu dostosowuje się do tekstu |
| `"size to text v" 1` | Wysokość widgetu dostosowuje się do tekstu |
| `"text sharpness"` | Wartość zmiennoprzecinkowa kontrolująca ostrość renderowania |
| `wrap 1` | Włącz zawijanie wyrazów dla tekstu przekraczającego szerokość widgetu |

Atrybuty `"size to text"` są przydatne dla etykiet i tagów, gdzie widget powinien mieć dokładnie taki rozmiar jak jego treść tekstowa.

---

## Wyrównanie tekstu

Kontroluj, gdzie tekst pojawia się wewnątrz widgetu za pomocą atrybutów wyrównania:

```
TextWidgetClass CenteredLabel {
 text "Centered"
 "text halign" center
 "text valign" center
}
```

| Atrybut | Wartości | Efekt |
|---|---|---|
| `"text halign"` | `left`, `center`, `right` | Pozycja pozioma tekstu wewnątrz widgetu |
| `"text valign"` | `top`, `center`, `bottom` | Pozycja pionowa tekstu wewnątrz widgetu |

---

## Obramowanie tekstu

Dodaj obramowanie do tekstu dla czytelności na zajętych tłach:

```c
TextWidget tw;
tw.SetOutline(1, ARGB(255, 0, 0, 0));   // 1px black outline

int size = tw.GetOutlineSize();           // Read outline size
int color = tw.GetOutlineColor();         // Read outline color (ARGB)
```

---

## ImageWidget

`ImageWidget` wyświetla obrazy z dwóch źródeł: referencji imagesetów i dynamicznie ładowanych plików.

### Referencje imagesetów

Najczęstszy sposób wyświetlania obrazów. Imageset to atlas sprite'ów -- pojedynczy plik tekstury z wieloma nazwanymi podobrazami.

W pliku layoutu:

```
ImageWidgetClass MyIcon {
 image0 "set:dayz_gui image:icon_refresh"
 mode blend
 "src alpha" 1
 stretch 1
}
```

Format to `"set:<nazwa_imagesetu> image:<nazwa_obrazu>"`.

Popularne waniliowe imagesety i obrazy:

```
"set:dayz_gui image:icon_pin"           -- Ikona pinezki mapy
"set:dayz_gui image:icon_refresh"       -- Ikona odświeżania
"set:dayz_gui image:icon_x"            -- Ikona zamknięcia/X
"set:dayz_gui image:icon_missing"      -- Ikona ostrzeżenia/brakujący
"set:dayz_gui image:iconHealth0"       -- Ikona zdrowia/plus
"set:dayz_gui image:DayZLogo"          -- Logo DayZ
"set:dayz_gui image:Expand"            -- Strzałka rozwinięcia
"set:dayz_gui image:Gradient"          -- Pasek gradientu
```

### Wiele slotów obrazów

Pojedynczy `ImageWidget` może przechowywać wiele obrazów w różnych slotach (`image0`, `image1`, itd.) i przełączać się między nimi:

```
ImageWidgetClass StatusIcon {
 image0 "set:dayz_gui image:icon_missing"
 image1 "set:dayz_gui image:iconHealth0"
}
```

```c
ImageWidget icon;
icon.SetImage(0);    // Show image0 (missing icon)
icon.SetImage(1);    // Show image1 (health icon)
```

### Ładowanie obrazów z plików

Ładuj obrazy dynamicznie w trakcie działania:

```c
ImageWidget img;
img.LoadImageFile(0, "MyMod/gui/textures/my_image.edds");
img.SetImage(0);
```

Ścieżka jest relatywna do katalogu głównego moda. Obsługiwane formaty to `.edds`, `.paa` i `.tga` (choć `.edds` jest standardem dla DayZ).

### Tryby mieszania obrazów

Atrybut `mode` kontroluje, jak obraz miesza się z tym, co jest za nim:

| Tryb | Efekt |
|---|---|
| `blend` | Standardowe mieszanie alfa (najczęstszy) |
| `additive` | Kolory się dodają (efekty poświaty) |
| `stretch` | Rozciągnij, aby wypełnić bez mieszania |

### Przejścia maskowe obrazów

`ImageWidget` obsługuje przejścia odsłaniania oparte na maskowaniu:

```c
ImageWidget img;
img.LoadMaskTexture("gui/textures/mask_wipe.edds");
img.SetMaskProgress(0.5);  // 50% revealed
```

Jest to przydatne dla pasków ładowania, wyświetlaczy zdrowia i animacji odsłaniania.

---

## Format ImageSet

Plik imagesetu (`.imageset`) definiuje nazwane regiony wewnątrz tekstury atlasu sprite'ów. DayZ obsługuje dwa formaty imagesetów.

### Natywny format DayZ

Używany przez waniliowy DayZ i większość modów. To **nie jest** XML -- używa tego samego formatu z nawiasami klamrowymi co pliki layoutu.

```
ImageSetClass {
 Name "my_mod_icons"
 RefSize 1024 1024
 Textures {
  ImageSetTextureClass {
   mpix 0
   path "MyMod/GUI/imagesets/my_icons.edds"
  }
 }
 Images {
  ImageSetDefClass icon_sword {
   Name "icon_sword"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass icon_shield {
   Name "icon_shield"
   Pos 64 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass icon_potion {
   Name "icon_potion"
   Pos 128 0
   Size 64 64
   Flags 0
  }
 }
}
```

Kluczowe pola:
- `Name` -- Nazwa imagesetu (używana w `"set:<nazwa>"`)
- `RefSize` -- Rozmiar referencyjny tekstury źródłowej w pikselach (szerokość wysokość)
- `path` -- Ścieżka do pliku tekstury (`.edds`)
- `mpix` -- Poziom mipmapy (0 = standardowa rozdzielczość, 1 = rozdzielczość 2x)
- Każdy wpis obrazu definiuje `Name`, `Pos` (x y w pikselach) i `Size` (szerokość wysokość w pikselach)

### Format XML

Niektóre mody (w tym niektóre moduły DayZ Expansion) używają formatu imagesetu opartego na XML:

```xml
<?xml version="1.0" encoding="utf-8"?>
<imageset name="my_icons" file="MyMod/GUI/imagesets/my_icons.edds">
  <image name="icon_sword" pos="0 0" size="64 64" />
  <image name="icon_shield" pos="64 0" size="64 64" />
  <image name="icon_potion" pos="128 0" size="64 64" />
</imageset>
```

Oba formaty osiągają to samo. Format natywny jest używany przez waniliowy DayZ; format XML jest czasem łatwiejszy do czytania i ręcznej edycji.

---

## Tworzenie niestandardowych imagesetów

Aby utworzyć własny imageset dla moda:

### Krok 1: Utwórz teksturę atlasu sprite'ów

Użyj edytora obrazów (Photoshop, GIMP, itp.) aby utworzyć pojedynczą teksturę zawierającą wszystkie ikony/obrazy ułożone na siatce. Typowe rozmiary to 256x256, 512x512 lub 1024x1024 pikseli.

Zapisz jako `.tga`, następnie skonwertuj na `.edds` za pomocą DayZ Tools (TexView2 lub ImageTool).

### Krok 2: Utwórz plik imagesetu

Utwórz plik `.imageset`, który mapuje nazwane regiony na pozycje w teksturze:

```
ImageSetClass {
 Name "mymod_icons"
 RefSize 512 512
 Textures {
  ImageSetTextureClass {
   mpix 0
   path "MyFramework/GUI/imagesets/mymod_icons.edds"
  }
 }
 Images {
  ImageSetDefClass icon_mission {
   Name "icon_mission"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass icon_waypoint {
   Name "icon_waypoint"
   Pos 64 0
   Size 64 64
   Flags 0
  }
 }
}
```

### Krok 3: Zarejestruj w config.cpp

W `config.cpp` swojego moda zarejestruj imageset pod `CfgMods`:

```cpp
class CfgMods
{
    class MyMod
    {
        // ... other fields ...
        class defs
        {
            class imageSets
            {
                files[] = { "MyMod/GUI/imagesets/mymod_icons.imageset" };
            };
            // ... script modules ...
        };
    };
};
```

### Krok 4: Używaj w layoutach i kodzie

W plikach layoutu:

```
ImageWidgetClass MissionIcon {
 image0 "set:mymod_icons image:icon_mission"
 mode blend
 "src alpha" 1
}
```

W kodzie:

```c
ImageWidget icon;
// Images from registered imagesets are available by set:name image:name
// No additional loading step needed after config.cpp registration
```

---

## Wzorzec motywu kolorów

Profesjonalne mody centralizują definicje kolorów w klasie motywu, a następnie stosują kolory w trakcie działania. Ułatwia to zmianę stylu całego UI przez edycję jednego pliku.

```c
class UIColor
{
    static int White()        { return ARGB(255, 255, 255, 255); }
    static int Black()        { return ARGB(255, 0, 0, 0); }
    static int Primary()      { return ARGB(255, 75, 119, 190); }
    static int Secondary()    { return ARGB(255, 60, 60, 60); }
    static int Accent()       { return ARGB(255, 100, 200, 100); }
    static int Danger()       { return ARGB(255, 200, 50, 50); }
    static int Transparent()  { return ARGB(1, 0, 0, 0); }
    static int SemiBlack()    { return ARGB(180, 0, 0, 0); }
}
```

Zastosowanie w kodzie:

```c
titleBar.SetColor(UIColor.Primary());
statusText.SetColor(UIColor.Accent());
errorText.SetColor(UIColor.Danger());
```

Ten wzorzec (używany przez Colorful UI, MyMod i inne) oznacza, że zmiana całego schematu kolorów UI wymaga edycji tylko klasy motywu.

---

## Podsumowanie atrybutów wizualnych wg typu widgetu

| Widget | Kluczowe atrybuty wizualne |
|---|---|
| Dowolny widget | `color`, `visible`, `style`, `priority`, `inheritalpha` |
| TextWidget | `text`, `font`, `"text halign"`, `"text valign"`, `"exact text"`, `"exact text size"`, `"bold text"`, `wrap` |
| ImageWidget | `image0`, `mode`, `"src alpha"`, `stretch`, `"flip u"`, `"flip v"` |
| ButtonWidget | `text`, `style`, `switch toggle` |
| PanelWidget | `color`, `style` |
| SliderWidget | `"fill in"` |
| ProgressBarWidget | `style` |

---

## Dobre praktyki

1. **Używaj referencji imagesetów** zamiast bezpośrednich ścieżek plików, gdzie to możliwe -- imagesety są batchowane efektywniej przez silnik.

2. **Używaj czcionek SDF** (`sdf_MetronBook24`) dla tekstu, który musi wyglądać ostro w każdej skali.

3. **Używaj `"exact text" 1`** dla tekstu UI o określonych rozmiarach pikselowych; używaj tekstu proporcjonalnego dla elementów HUD, które powinny się skalować.

4. **Centralizuj kolory** w klasie motywu zamiast na stałe kodować wartości ARGB w całym kodzie.

5. **Ustawiaj `"src alpha" 1`** na widgetach obrazów, aby uzyskać prawidłową przezroczystość.

6. **Rejestruj niestandardowe imagesety** w `config.cpp`, aby były dostępne globalnie bez ręcznego ładowania.

7. **Utrzymuj atlasy sprite'ów w rozsądnych rozmiarach** -- 512x512 lub 1024x1024 to norma. Większe tekstury marnują pamięć, jeśli większość przestrzeni jest pusta.

---

## Następne kroki

- [3.8 Dialogi i modale](08-dialogs-modals.md) -- Wyskakujące okna, potwierdzenia i panele nakładkowe
- [3.1 Typy widgetów](01-widget-types.md) -- Przegląd pełnego katalogu widgetów
- [3.6 Obsługa zdarzeń](06-event-handling.md) -- Uczyń swoje stylowane widgety interaktywnymi

---

## Teoria a praktyka

| Koncepcja | Teoria | Rzeczywistość |
|---------|--------|---------|
| Czcionki SDF skalują się do dowolnego rozmiaru | `sdf_MetronBook24` jest ostra we wszystkich rozmiarach | Prawda dla rozmiarów powyżej ~10px. Poniżej tego czcionki SDF mogą wyglądać na rozmyte w porównaniu z czcionkami bitmapowymi w ich natywnym rozmiarze |
| `"exact text" 1` daje rozmiarowanie pixel-perfect | Czcionka renderuje się w dokładnie podanym rozmiarze pikselowym | DayZ stosuje wewnętrzne skalowanie, więc `"exact text size" 16` może renderować się nieco inaczej w różnych rozdzielczościach. Testuj na 1080p i 1440p |
| Wbudowane style pokrywają wszystkie potrzeby | `Default`, `blank`, `Colorable` wystarczą | Większość profesjonalnych modów definiuje własne pliki `.styles`, ponieważ wbudowane style mają ograniczoną różnorodność wizualną |
| Formaty XML i natywne imagesetów są równoważne | Oba definiują regiony sprite'ów | Natywny format z nawiasami jest przetwarzany najszybciej przez silnik. Format XML działa, ale dodaje krok parsowania; używaj natywnego formatu w produkcji |
| `SetColor()` nadpisuje kolor layoutu | Kolor runtime zastępuje wartość layoutu | `SetColor()` barwi istniejący wygląd widgetu. Na widgetach ze stylem, barwienie mnożone jest z bazowym kolorem stylu, dając nieoczekiwane rezultaty |

---

## Kompatybilność i wpływ

- **Multi-Mod:** Nazwy stylów są globalne. Jeśli dwa mody rejestrują plik `.styles` definiujący tę samą nazwę stylu, ostatni załadowany mod wygrywa. Poprzedzaj niestandardowe nazwy stylów identyfikatorem moda (np. `MyMod_PanelDark`).
- **Wydajność:** Imagesety są ładowane raz do pamięci GPU przy starcie. Dodawanie dużych atlasów sprite'ów (2048x2048+) zwiększa użycie VRAM. Utrzymuj atlasy na 512x512 lub 1024x1024 i dziel na wiele imagesetów w razie potrzeby.
