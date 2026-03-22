# Rozdział 3.1: Typy widgetów

[Strona główna](../README.md) | **Typy widgetów** | [Dalej: Pliki layoutów >>](02-layout-files.md)

---

System GUI w DayZ jest zbudowany na widgetach -- wielokrotnie używalnych komponentach interfejsu, od prostych kontenerów po złożone interaktywne kontrolki. Każdy widoczny element na ekranie jest widgetem, a zrozumienie pełnego katalogu jest niezbędne do tworzenia interfejsów modów.

Ten rozdział zawiera kompletne odniesienie do wszystkich typów widgetów dostępnych w Enforce Script.

---

## Jak działają widgety

Każdy widget w DayZ dziedziczy po klasie bazowej `Widget`. Widgety są zorganizowane w drzewo rodzic-dziecko, gdzie korzeniem jest zazwyczaj `WorkspaceWidget` uzyskany przez `GetGame().GetWorkspace()`.

Każdy typ widgetu ma trzy powiązane identyfikatory:

| Identyfikator | Przykład | Zastosowanie |
|---|---|---|
| **Klasa skryptowa** | `TextWidget` | Odwołania w kodzie, rzutowanie |
| **Klasa layoutu** | `TextWidgetClass` | Deklaracje w plikach `.layout` |
| **Stała TypeID** | `TextWidgetTypeID` | Programowe tworzenie za pomocą `CreateWidget()` |

W plikach `.layout` zawsze używasz nazwy klasy layoutu (kończącej się na `Class`). W skryptach pracujesz z nazwą klasy skryptowej.

---

## Widgety kontenerów / układu

Widgety kontenerów przechowują i organizują widgety potomne. Same nie wyświetlają treści (z wyjątkiem `PanelWidget`, który rysuje kolorowy prostokąt).

| Klasa skryptowa | Klasa layoutu | Przeznaczenie |
|---|---|---|
| `Widget` | `WidgetClass` | Abstrakcyjna klasa bazowa dla wszystkich widgetów. Nigdy nie twórz instancji bezpośrednio. |
| `WorkspaceWidget` | `WorkspaceWidgetClass` | Korzeń przestrzeni roboczej. Uzyskiwany przez `GetGame().GetWorkspace()`. Służy do programowego tworzenia widgetów. |
| `FrameWidget` | `FrameWidgetClass` | Kontener ogólnego przeznaczenia. Najczęściej używany widget w DayZ. |
| `PanelWidget` | `PanelWidgetClass` | Jednolity kolorowy prostokąt. Używaj do teł, przegród, separatorów. |
| `WrapSpacerWidget` | `WrapSpacerWidgetClass` | Układ przepływowy. Układa dzieci sekwencyjnie z zawijaniem, paddingiem i marginesami. |
| `GridSpacerWidget` | `GridSpacerWidgetClass` | Układ siatkowy. Układa dzieci w siatce zdefiniowanej przez `Columns` i `Rows`. |
| `ScrollWidget` | `ScrollWidgetClass` | Przewijany widok. Umożliwia pionowe/poziome przewijanie treści potomnej. |
| `SpacerBaseWidget` | -- | Abstrakcyjna klasa bazowa dla `WrapSpacerWidget` i `GridSpacerWidget`. |

### FrameWidget

Koń roboczy interfejsu DayZ. Używaj `FrameWidget` jako domyślnego kontenera, gdy musisz grupować widgety. Nie ma żadnego wyglądu wizualnego -- jest czysto strukturalny.

**Kluczowe metody:**
- Wszystkie bazowe metody `Widget` (pozycja, rozmiar, kolor, dzieci, flagi)

**Kiedy używać:** Prawie wszędzie. Opakowuj grupy powiązanych widgetów. Używaj jako korzenia dialogów, paneli i elementów HUD.

```c
// Find a frame widget by name
FrameWidget panel = FrameWidget.Cast(root.FindAnyWidget("MyPanel"));
panel.Show(true);
```

### PanelWidget

Widoczny prostokąt o jednolitym kolorze. W przeciwieństwie do `FrameWidget`, `PanelWidget` faktycznie rysuje coś na ekranie.

**Kluczowe metody:**
- `SetColor(int argb)` -- Ustaw kolor tła
- `SetAlpha(float alpha)` -- Ustaw przezroczystość

**Kiedy używać:** Tła za tekstem, kolorowe przegródki, nakładki, warstwy barwiące.

```c
PanelWidget bg = PanelWidget.Cast(root.FindAnyWidget("Background"));
bg.SetColor(ARGB(200, 0, 0, 0));  // Semi-transparent black
```

### WrapSpacerWidget

Automatycznie układa dzieci w układzie przepływowym. Dzieci są umieszczane jedno za drugim, zawijając do następnej linii, gdy brakuje miejsca.

**Kluczowe atrybuty layoutu:**
- `Padding` -- Wewnętrzny padding (piksele)
- `Margin` -- Zewnętrzny margines (piksele)
- `"Size To Content H" 1` -- Zmień szerokość, aby dopasować do dzieci
- `"Size To Content V" 1` -- Zmień wysokość, aby dopasować do dzieci
- `content_halign` -- Poziome wyrównanie zawartości (`left`, `center`, `right`)
- `content_valign` -- Pionowe wyrównanie zawartości (`top`, `center`, `bottom`)

**Kiedy używać:** Dynamiczne listy, chmury tagów, rzędy przycisków, dowolny układ, gdzie dzieci mają różne rozmiary.

### GridSpacerWidget

Układa dzieci w stałej siatce. Każda komórka ma jednakowy rozmiar.

**Kluczowe atrybuty layoutu:**
- `Columns` -- Liczba kolumn
- `Rows` -- Liczba wierszy
- `Margin` -- Odstęp między komórkami
- `"Size To Content V" 1` -- Zmień wysokość, aby dopasować do zawartości

**Kiedy używać:** Siatki ekwipunku, galerie ikon, panele ustawień z jednolitymi wierszami.

### ScrollWidget

Zapewnia przewijany widok dla treści przekraczającej widoczny obszar.

**Kluczowe atrybuty layoutu:**
- `"Scrollbar V" 1` -- Włącz pionowy pasek przewijania
- `"Scrollbar H" 1` -- Włącz poziomy pasek przewijania

**Kluczowe metody:**
- `VScrollToPos(float pos)` -- Przewiń do pozycji pionowej
- `GetVScrollPos()` -- Pobierz aktualną pozycję przewijania pionowego
- `GetContentHeight()` -- Pobierz całkowitą wysokość zawartości
- `VScrollStep(int step)` -- Przewiń o podaną wartość kroku

**Kiedy używać:** Długie listy, panele konfiguracji, okna czatu, przeglądarki logów.

---

## Widgety wyświetlania

Widgety wyświetlania pokazują treść użytkownikowi, ale nie są interaktywne.

| Klasa skryptowa | Klasa layoutu | Przeznaczenie |
|---|---|---|
| `TextWidget` | `TextWidgetClass` | Jednowierszowe wyświetlanie tekstu |
| `MultilineTextWidget` | `MultilineTextWidgetClass` | Wielowierszowy tekst tylko do odczytu |
| `RichTextWidget` | `RichTextWidgetClass` | Tekst z osadzonymi obrazami (tagi `<image>`) |
| `ImageWidget` | `ImageWidgetClass` | Wyświetlanie obrazu (z imagesetów lub plików) |
| `CanvasWidget` | `CanvasWidgetClass` | Programowalna powierzchnia rysowania |
| `VideoWidget` | `VideoWidgetClass` | Odtwarzanie pliku wideo |
| `RTTextureWidget` | `RTTextureWidgetClass` | Powierzchnia renderowania do tekstury |
| `RenderTargetWidget` | `RenderTargetWidgetClass` | Cel renderowania sceny 3D |
| `ItemPreviewWidget` | `ItemPreviewWidgetClass` | Podgląd 3D przedmiotu DayZ |
| `PlayerPreviewWidget` | `PlayerPreviewWidgetClass` | Podgląd 3D modelu postaci gracza |
| `MapWidget` | `MapWidgetClass` | Interaktywna mapa świata |

### TextWidget

Najczęściej używany widget wyświetlania. Pokazuje pojedynczą linię tekstu.

**Kluczowe metody:**
```c
TextWidget tw;
tw.SetText("Hello World");
tw.GetText();                           // Returns string
tw.GetTextSize(out int w, out int h);   // Pixel dimensions of rendered text
tw.SetTextExactSize(float size);        // Set font size in pixels
tw.SetOutline(int size, int color);     // Add text outline
tw.GetOutlineSize();                    // Returns int
tw.GetOutlineColor();                   // Returns int (ARGB)
tw.SetColor(int argb);                  // Text color
```

**Kluczowe atrybuty layoutu:** `text`, `font`, `"text halign"`, `"text valign"`, `"exact text"`, `"exact text size"`, `"bold text"`, `"size to text h"`, `"size to text v"`, `wrap`.

### MultilineTextWidget

Wyświetla wiele linii tekstu tylko do odczytu. Tekst jest automatycznie zawijany na podstawie szerokości widgetu.

**Kiedy używać:** Panele opisów, tekst pomocy, wyświetlacze logów.

### RichTextWidget

Obsługuje osadzone obrazy wewnątrz tekstu za pomocą tagów `<image>`. Obsługuje również zawijanie tekstu.

**Kluczowe atrybuty layoutu:**
- `wrap 1` -- Włącz zawijanie wyrazów

**Użycie w tekście:**
```
"Health: <image set:dayz_gui image:iconHealth0 /> OK"
```

**Kiedy używać:** Tekst statusu z ikonami, sformatowane wiadomości, czat z osadzonymi obrazami.

### ImageWidget

Wyświetla obrazy z arkuszy sprite'ów (imagesetów) lub ładowane ze ścieżek plików.

**Kluczowe metody:**
```c
ImageWidget iw;
iw.SetImage(int index);                    // Switch between image0, image1, etc.
iw.LoadImageFile(int slot, string path);   // Load image from file
iw.LoadMaskTexture(string path);           // Load a mask texture
iw.SetMaskProgress(float progress);        // 0-1 for wipe/reveal transitions
```

**Kluczowe atrybuty layoutu:**
- `image0 "set:dayz_gui image:icon_refresh"` -- Obraz z imagesetu
- `mode blend` -- Tryb mieszania (`blend`, `additive`, `stretch`)
- `"src alpha" 1` -- Użyj źródłowego kanału alfa
- `stretch 1` -- Rozciągnij obraz, aby wypełnić widget
- `"flip u" 1` -- Odbij poziomo
- `"flip v" 1` -- Odbij pionowo

**Kiedy używać:** Ikony, logo, tła, znaczniki mapy, wskaźniki statusu.

### CanvasWidget

Powierzchnia rysowania, na której możesz programowo renderować linie.

**Kluczowe metody:**
```c
CanvasWidget cw;
cw.DrawLine(float x1, float y1, float x2, float y2, float width, int color);
cw.Clear();
```

**Kiedy używać:** Niestandardowe wykresy, linie połączeń między węzłami, nakładki debugowania.

### MapWidget

Pełna interaktywna mapa świata. Obsługuje przesuwanie, powiększanie i konwersję współrzędnych.

**Kluczowe metody:**
```c
MapWidget mw;
mw.SetMapPos(vector pos);              // Center on world position
mw.GetMapPos();                        // Current center position
mw.SetScale(float scale);             // Zoom level
mw.GetScale();                        // Current zoom
mw.MapToScreen(vector world_pos);     // World coords to screen coords
mw.ScreenToMap(vector screen_pos);    // Screen coords to world coords
```

**Kiedy używać:** Mapy misji, systemy GPS, selektory lokalizacji.

### ItemPreviewWidget

Renderuje podgląd 3D dowolnego przedmiotu ekwipunku DayZ.

**Kiedy używać:** Ekrany ekwipunku, podglądy łupów, interfejsy sklepów.

### PlayerPreviewWidget

Renderuje podgląd 3D modelu postaci gracza.

**Kiedy używać:** Ekrany tworzenia postaci, podgląd wyposażenia, systemy garderoby.

### RTTextureWidget

Renderuje swoje dzieci na powierzchnię tekstury, zamiast bezpośrednio na ekran.

**Kiedy używać:** Renderowanie minimapy, efekty obraz-w-obrazie, kompozycja UI poza ekranem.

---

## Widgety interaktywne

Widgety interaktywne reagują na dane wejściowe użytkownika i emitują zdarzenia.

| Klasa skryptowa | Klasa layoutu | Przeznaczenie |
|---|---|---|
| `ButtonWidget` | `ButtonWidgetClass` | Klikalny przycisk |
| `CheckBoxWidget` | `CheckBoxWidgetClass` | Pole wyboru typu boolean |
| `EditBoxWidget` | `EditBoxWidgetClass` | Jednowierszowe pole tekstowe |
| `MultilineEditBoxWidget` | `MultilineEditBoxWidgetClass` | Wielowierszowe pole tekstowe |
| `PasswordEditBoxWidget` | `PasswordEditBoxWidgetClass` | Zamaskowane pole hasła |
| `SliderWidget` | `SliderWidgetClass` | Poziomy suwak |
| `XComboBoxWidget` | `XComboBoxWidgetClass` | Lista rozwijana |
| `TextListboxWidget` | `TextListboxWidgetClass` | Wybieralna lista wierszy |
| `ProgressBarWidget` | `ProgressBarWidgetClass` | Wskaźnik postępu |
| `SimpleProgressBarWidget` | `SimpleProgressBarWidgetClass` | Minimalny wskaźnik postępu |

### ButtonWidget

Podstawowa kontrolka interaktywna. Obsługuje zarówno tryb chwilowego kliknięcia, jak i przełączania.

**Kluczowe metody:**
```c
ButtonWidget bw;
bw.SetText("Click Me");
bw.GetState();              // Returns bool (toggle buttons only)
bw.SetState(bool state);    // Set toggle state
```

**Kluczowe atrybuty layoutu:**
- `text "Label"` -- Tekst etykiety przycisku
- `switch toggle` -- Uczyń przyciskiem przełącznikowym
- `style Default` -- Styl wizualny

**Emitowane zdarzenia:** `OnClick(Widget w, int x, int y, int button)`

### CheckBoxWidget

Kontrolka przełączania wartości boolean.

**Kluczowe metody:**
```c
CheckBoxWidget cb;
cb.IsChecked();                 // Returns bool
cb.SetChecked(bool checked);    // Set state
```

**Emitowane zdarzenia:** `OnChange(Widget w, int x, int y, bool finished)`

### EditBoxWidget

Jednowierszowe pole wprowadzania tekstu.

**Kluczowe metody:**
```c
EditBoxWidget eb;
eb.GetText();               // Returns string
eb.SetText("default");      // Set text content
```

**Emitowane zdarzenia:** `OnChange(Widget w, int x, int y, bool finished)` -- `finished` jest `true`, gdy naciśnięto Enter.

### SliderWidget

Poziomy suwak dla wartości numerycznych.

**Kluczowe metody:**
```c
SliderWidget sw;
sw.GetCurrent();            // Returns float (0-1)
sw.SetCurrent(float val);   // Set position
```

**Kluczowe atrybuty layoutu:**
- `"fill in" 1` -- Pokaż wypełniony tor za uchwytem
- `"listen to input" 1` -- Reaguj na dane wejściowe myszy

**Emitowane zdarzenia:** `OnChange(Widget w, int x, int y, bool finished)` -- `finished` jest `true`, gdy użytkownik zwolni suwak.

### XComboBoxWidget

Rozwijana lista wyboru.

**Kluczowe metody:**
```c
XComboBoxWidget xcb;
xcb.AddItem("Option A");
xcb.AddItem("Option B");
xcb.SetCurrentItem(0);         // Select by index
xcb.GetCurrentItem();          // Returns selected index
xcb.ClearAll();                // Remove all items
```

### TextListboxWidget

Przewijana lista wierszy tekstowych. Obsługuje zaznaczanie i dane wielokolumnowe.

**Kluczowe metody:**
```c
TextListboxWidget tlb;
tlb.AddItem("Row text", null, 0);   // text, userData, column
tlb.GetSelectedRow();               // Returns int (-1 if none)
tlb.SetRow(int row);                // Select a row
tlb.RemoveRow(int row);
tlb.ClearItems();
```

**Emitowane zdarzenia:** `OnItemSelected`

### ProgressBarWidget

Wyświetla wskaźnik postępu.

**Kluczowe metody:**
```c
ProgressBarWidget pb;
pb.SetCurrent(float value);    // 0-100
```

**Kiedy używać:** Paski ładowania, paski zdrowia, postęp misji, wskaźniki odnowienia.

---

## Kompletne odniesienie TypeID

Użyj tych stałych z `GetGame().GetWorkspace().CreateWidget()` do programowego tworzenia widgetów:

```
FrameWidgetTypeID
TextWidgetTypeID
MultilineTextWidgetTypeID
MultilineEditBoxWidgetTypeID
RichTextWidgetTypeID
RenderTargetWidgetTypeID
ImageWidgetTypeID
VideoWidgetTypeID
RTTextureWidgetTypeID
ButtonWidgetTypeID
CheckBoxWidgetTypeID
SimpleProgressBarWidgetTypeID
ProgressBarWidgetTypeID
SliderWidgetTypeID
TextListboxWidgetTypeID
EditBoxWidgetTypeID
PasswordEditBoxWidgetTypeID
WorkspaceWidgetTypeID
GridSpacerWidgetTypeID
WrapSpacerWidgetTypeID
ScrollWidgetTypeID
```

---

## Wybór odpowiedniego widgetu

| Potrzebuję... | Użyj tego widgetu |
|---|---|
| Zgrupować widgety razem (niewidocznie) | `FrameWidget` |
| Narysować kolorowy prostokąt | `PanelWidget` |
| Pokazać tekst | `TextWidget` |
| Pokazać tekst wielowierszowy | `MultilineTextWidget` lub `RichTextWidget` z `wrap 1` |
| Pokazać tekst z osadzonymi ikonami | `RichTextWidget` |
| Wyświetlić obraz/ikonę | `ImageWidget` |
| Utworzyć klikalny przycisk | `ButtonWidget` |
| Utworzyć przełącznik (wł./wył.) | `CheckBoxWidget` lub `ButtonWidget` z `switch toggle` |
| Przyjąć dane tekstowe | `EditBoxWidget` |
| Przyjąć wielowierszowe dane tekstowe | `MultilineEditBoxWidget` |
| Przyjąć hasło | `PasswordEditBoxWidget` |
| Pozwolić użytkownikowi wybrać liczbę | `SliderWidget` |
| Pozwolić użytkownikowi wybrać z listy | `XComboBoxWidget` (rozwijana) lub `TextListboxWidget` (widoczna lista) |
| Pokazać postęp | `ProgressBarWidget` lub `SimpleProgressBarWidget` |
| Ułożyć dzieci w przepływie | `WrapSpacerWidget` |
| Ułożyć dzieci w siatce | `GridSpacerWidget` |
| Uczynić treść przewijalną | `ScrollWidget` |
| Pokazać model 3D przedmiotu | `ItemPreviewWidget` |
| Pokazać model gracza | `PlayerPreviewWidget` |
| Pokazać mapę świata | `MapWidget` |
| Rysować niestandardowe linie/kształty | `CanvasWidget` |
| Renderować do tekstury | `RTTextureWidget` |

---

## Następne kroki

- [3.2 Format pliku layoutu](02-layout-files.md) -- Dowiedz się, jak definiować drzewa widgetów w plikach `.layout`
- [3.5 Programowe tworzenie widgetów](05-programmatic-widgets.md) -- Twórz widgety z kodu zamiast plików layoutu

---

## Dobre praktyki

- Używaj `FrameWidget` jako domyślnego kontenera. Używaj `PanelWidget` tylko wtedy, gdy potrzebujesz widocznego kolorowego tła.
- Preferuj `RichTextWidget` zamiast `TextWidget`, gdy możesz później potrzebować osadzonych ikon -- zmiana typów w istniejącym layoucie jest żmudna.
- Zawsze sprawdzaj null po `FindAnyWidget()` i `Cast()`. Brakujące nazwy widgetów cicho zwracają `null` i powodują awarie przy następnym wywołaniu metody.
- Używaj `WrapSpacerWidget` do dynamicznych list i `GridSpacerWidget` do stałych siatek. Nie pozycjonuj ręcznie dzieci w układzie przepływowym.
- Unikaj `CanvasWidget` w produkcyjnym UI -- przerysowuje się w każdej klatce i nie ma batchowania. Używaj go tylko do nakładek debugowania.

---

## Teoria a praktyka

| Koncepcja | Teoria | Rzeczywistość |
|---------|--------|---------|
| `ScrollWidget` automatycznie przewija do treści | Pasek przewijania pojawia się, gdy treść przekracza granice | Musisz ręcznie wywołać `VScrollToPos()`, aby przewinąć do nowej treści; widget nie przewija się automatycznie po dodaniu dziecka |
| `SliderWidget` emituje ciągłe zdarzenia | `OnChange` uruchamia się przy każdym pikselu przeciągania | Parametr `finished` jest `false` podczas przeciągania i `true` po zwolnieniu; aktualizuj ciężką logikę tylko gdy `finished == true` |
| `XComboBoxWidget` obsługuje wiele elementów | Rozwijana lista działa z dowolną liczbą | Wydajność zauważalnie spada przy 100+ elementach; używaj `TextListboxWidget` dla długich list |
| `ItemPreviewWidget` pokazuje dowolny przedmiot | Podaj dowolną nazwę klasy do podglądu 3D | Widget wymaga załadowanego modelu `.p3d` przedmiotu; zmodyfikowane przedmioty wymagają obecnego PBO z danymi |
| `MapWidget` jest prostym wyświetlaczem | Po prostu pokazuje mapę | Przechwytuje domyślnie wszystkie zdarzenia myszy; musisz starannie zarządzać flagami `IGNOREPOINTER`, inaczej blokuje kliknięcia na nakładających się widgetach |

---

## Kompatybilność i wpływ

- **Multi-Mod:** Identyfikatory typów widgetów są stałymi silnika współdzielonymi przez wszystkie mody. Dwa mody tworzące widgety o tej samej nazwie pod tym samym rodzicem będą kolidować. Używaj unikalnych nazw widgetów z prefiksem moda.
- **Wydajność:** `TextListboxWidget` i `ScrollWidget` z setkami dzieci powodują spadki klatek. Pooluj i recykluj widgety dla list przekraczających 50 elementów.
