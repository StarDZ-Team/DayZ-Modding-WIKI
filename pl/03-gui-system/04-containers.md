# Rozdział 3.4: Widgety kontenerów

[Strona główna](../README.md) | [<< Poprzedni: Rozmiary i pozycjonowanie](03-sizing-positioning.md) | **Widgety kontenerów** | [Dalej: Programowe tworzenie widgetów >>](05-programmatic-widgets.md)

---

Widgety kontenerów organizują widgety potomne wewnątrz siebie. Podczas gdy `FrameWidget` jest najprostszym (niewidoczne pudełko, ręczne pozycjonowanie), DayZ dostarcza trzy wyspecjalizowane kontenery, które obsługują układ automatycznie: `WrapSpacerWidget`, `GridSpacerWidget` i `ScrollWidget`.

---

## FrameWidget -- Kontener strukturalny

`FrameWidget` jest najbardziej podstawowym kontenerem. Nie rysuje niczego na ekranie i nie układa swoich dzieci -- musisz pozycjonować każde dziecko ręcznie.

**Kiedy używać:**
- Grupowanie powiązanych widgetów, aby można je było razem pokazywać/ukrywać
- Korzeń widgetu panelu lub dialogu
- Dowolne grupowanie strukturalne, gdzie sam obsługujesz pozycjonowanie

```
FrameWidgetClass MyPanel {
 size 0.5 0.5
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 0
 vexactsize 0
 {
  TextWidgetClass Header {
   position 0 0
   size 1 0.1
   text "Panel Title"
   "text halign" center
  }
  PanelWidgetClass Divider {
   position 0 0.1
   size 1 2
   hexactsize 0
   vexactsize 1
   color 1 1 1 0.3
  }
  FrameWidgetClass Content {
   position 0 0.12
   size 1 0.88
  }
 }
}
```

**Kluczowe cechy:**
- Brak wyglądu wizualnego (przezroczysty)
- Dzieci pozycjonowane względem granic ramki
- Brak automatycznego układu -- każde dziecko wymaga jawnej pozycji/rozmiaru
- Lekki -- zero kosztów renderowania poza dziećmi

---

## WrapSpacerWidget -- Układ przepływowy

`WrapSpacerWidget` automatycznie układa swoje dzieci w sekwencji przepływowej. Dzieci są umieszczane jedno za drugim poziomo, zawijając do następnego wiersza, gdy przekraczają dostępną szerokość. Jest to widget do użycia dla dynamicznych list, gdzie liczba dzieci zmienia się w trakcie działania.

### Atrybuty layoutu

| Atrybut | Wartości | Opis |
|---|---|---|
| `Padding` | liczba całkowita (piksele) | Odstęp między krawędzią spacera a jego dziećmi |
| `Margin` | liczba całkowita (piksele) | Odstęp między poszczególnymi dziećmi |
| `"Size To Content H"` | `0` lub `1` | Zmień szerokość, aby dopasować do wszystkich dzieci |
| `"Size To Content V"` | `0` lub `1` | Zmień wysokość, aby dopasować do wszystkich dzieci |
| `content_halign` | `left`, `center`, `right` | Poziome wyrównanie grupy dzieci |
| `content_valign` | `top`, `center`, `bottom` | Pionowe wyrównanie grupy dzieci |

### Podstawowy układ przepływowy

```
WrapSpacerWidgetClass TagList {
 size 1 0
 hexactsize 0
 "Size To Content V" 1
 Padding 5
 Margin 3
 {
  ButtonWidgetClass Tag1 {
   size 80 24
   hexactsize 1
   vexactsize 1
   text "Weapons"
  }
  ButtonWidgetClass Tag2 {
   size 60 24
   hexactsize 1
   vexactsize 1
   text "Food"
  }
  ButtonWidgetClass Tag3 {
   size 90 24
   hexactsize 1
   vexactsize 1
   text "Medical"
  }
 }
}
```

W tym przykładzie:
- Spacer ma pełną szerokość rodzica (`size 1`), ale jego wysokość dostosowuje się do dzieci (`"Size To Content V" 1`).
- Dzieci to przyciski o szerokości 80px, 60px i 90px.
- Jeśli dostępna szerokość nie pomieści wszystkich trzech w jednym wierszu, spacer zawija je do następnego wiersza.
- `Padding 5` dodaje 5px odstępu wewnątrz krawędzi spacera.
- `Margin 3` dodaje 3px między każdym dzieckiem.

### Lista pionowa z WrapSpacer

Aby utworzyć listę pionową (jeden element na wiersz), ustaw dzieci na pełną szerokość:

```
WrapSpacerWidgetClass ItemList {
 size 1 0
 hexactsize 0
 "Size To Content V" 1
 Margin 2
 {
  FrameWidgetClass Item1 {
   size 1 30
   hexactsize 0
   vexactsize 1
  }
  FrameWidgetClass Item2 {
   size 1 30
   hexactsize 0
   vexactsize 1
  }
 }
}
```

Każde dziecko ma 100% szerokości (`size 1` z `hexactsize 0`), więc tylko jedno mieści się na wiersz, tworząc pionowy stos.

### Dynamiczne dzieci

`WrapSpacerWidget` jest idealny dla programowo dodawanych dzieci. Gdy dodajesz lub usuwasz dzieci, wywołaj `Update()` na spacerze, aby wymusić ponowne obliczenie układu:

```c
WrapSpacerWidget spacer;

// Add a child from a layout file
Widget child = GetGame().GetWorkspace().CreateWidgets("MyMod/gui/layouts/ListItem.layout", spacer);

// Force the spacer to recalculate
spacer.Update();
```

---

## GridSpacerWidget -- Układ siatkowy

`GridSpacerWidget` układa dzieci w jednolitej siatce. Definiujesz liczbę kolumn i wierszy, a każda komórka otrzymuje równą przestrzeń.

### Atrybuty layoutu

| Atrybut | Wartości | Opis |
|---|---|---|
| `Columns` | liczba całkowita | Liczba kolumn siatki |
| `Rows` | liczba całkowita | Liczba wierszy siatki |
| `Margin` | liczba całkowita (piksele) | Odstęp między komórkami siatki |
| `"Size To Content V"` | `0` lub `1` | Zmień wysokość, aby dopasować do zawartości |

### Podstawowa siatka

```
GridSpacerWidgetClass InventoryGrid {
 size 0.5 0.5
 hexactsize 0
 vexactsize 0
 Columns 4
 Rows 3
 Margin 2
 {
  // 12 cells (4 columns x 3 rows)
  // Children are placed in order: left-to-right, top-to-bottom
  FrameWidgetClass Slot1 { }
  FrameWidgetClass Slot2 { }
  FrameWidgetClass Slot3 { }
  FrameWidgetClass Slot4 { }
  FrameWidgetClass Slot5 { }
  FrameWidgetClass Slot6 { }
  FrameWidgetClass Slot7 { }
  FrameWidgetClass Slot8 { }
  FrameWidgetClass Slot9 { }
  FrameWidgetClass Slot10 { }
  FrameWidgetClass Slot11 { }
  FrameWidgetClass Slot12 { }
 }
}
```

### Siatka jednokolumnowa (lista pionowa)

Ustawienie `Columns 1` tworzy prosty pionowy stos, gdzie każde dziecko otrzymuje pełną szerokość:

```
GridSpacerWidgetClass SettingsList {
 size 1 0
 hexactsize 0
 "Size To Content V" 1
 Columns 1
 {
  FrameWidgetClass Setting1 {
   size 150 30
   hexactsize 1
   vexactsize 1
  }
  FrameWidgetClass Setting2 {
   size 150 30
   hexactsize 1
   vexactsize 1
  }
  FrameWidgetClass Setting3 {
   size 150 30
   hexactsize 1
   vexactsize 1
  }
 }
}
```

### GridSpacer vs. WrapSpacer

| Cecha | GridSpacer | WrapSpacer |
|---|---|---|
| Rozmiar komórki | Jednolity (równy) | Każde dziecko zachowuje swój rozmiar |
| Tryb układu | Stała siatka (kolumny x wiersze) | Przepływ z zawijaniem |
| Najlepszy do | Slotów ekwipunku, jednolitych galerii | Dynamicznych list, chmur tagów |
| Rozmiar dzieci | Ignorowany (siatka go kontroluje) | Respektowany (rozmiar dziecka ma znaczenie) |

---

## ScrollWidget -- Przewijany widok

`ScrollWidget` opakowuje treść, która może być wyższa (lub szersza) niż widoczny obszar, zapewniając paski przewijania do nawigacji.

### Atrybuty layoutu

| Atrybut | Wartości | Opis |
|---|---|---|
| `"Scrollbar V"` | `0` lub `1` | Pokaż pionowy pasek przewijania |
| `"Scrollbar H"` | `0` lub `1` | Pokaż poziomy pasek przewijania |

### API skryptowe

```c
ScrollWidget sw;
sw.VScrollToPos(float pos);     // Scroll to vertical position (0 = top)
sw.GetVScrollPos();             // Get current scroll position
sw.GetContentHeight();          // Get total content height
sw.VScrollStep(int step);       // Scroll by a step amount
```

### Podstawowa przewijana lista

```
ScrollWidgetClass ListScroll {
 size 1 300
 hexactsize 0
 vexactsize 1
 "Scrollbar V" 1
 {
  WrapSpacerWidgetClass ListContent {
   size 1 0
   hexactsize 0
   "Size To Content V" 1
   {
    // Many children here...
    FrameWidgetClass Item1 {
     size 1 30
     hexactsize 0
     vexactsize 1
    }
    FrameWidgetClass Item2 {
     size 1 30
     hexactsize 0
     vexactsize 1
    }
    // ... more items
   }
  }
 }
}
```

---

## Wzorzec ScrollWidget + WrapSpacer

To jest **ten** wzorzec dla przewijalnych dynamicznych list w modach DayZ. Łączy `ScrollWidget` o stałej wysokości z `WrapSpacerWidget`, który rośnie, aby pomieścić swoje dzieci.

```
// Fixed-height scroll viewport
ScrollWidgetClass DialogScroll {
 size 0.97 235
 hexactsize 0
 vexactsize 1
 "Scrollbar V" 1
 {
  // Content grows vertically to fit all children
  WrapSpacerWidgetClass DialogContent {
   size 1 0
   hexactsize 0
   "Size To Content V" 1
  }
 }
}
```

Jak to działa:

1. `ScrollWidget` ma **stałą** wysokość (235 pikseli w tym przykładzie).
2. Wewnątrz niego `WrapSpacerWidget` ma `"Size To Content V" 1`, więc jego wysokość rośnie w miarę dodawania dzieci.
3. Gdy treść spacera przekroczy 235 pikseli, pojawia się pasek przewijania i użytkownik może przewijać.

Ten wzorzec pojawia się w DabsFramework, DayZ Editor, Expansion i praktycznie w każdym profesjonalnym modzie DayZ.

### Programowe dodawanie elementów

```c
ScrollWidget m_Scroll;
WrapSpacerWidget m_Content;

void AddItem(string text)
{
    // Create a new child inside the WrapSpacer
    Widget item = GetGame().GetWorkspace().CreateWidgets(
        "MyMod/gui/layouts/ListItem.layout", m_Content);

    // Configure the new item
    TextWidget tw = TextWidget.Cast(item.FindAnyWidget("Label"));
    tw.SetText(text);

    // Force layout recalculation
    m_Content.Update();
}

void ScrollToBottom()
{
    m_Scroll.VScrollToPos(m_Scroll.GetContentHeight());
}

void ClearAll()
{
    // Remove all children
    Widget child = m_Content.GetChildren();
    while (child)
    {
        Widget next = child.GetSibling();
        child.Unlink();
        child = next;
    }
    m_Content.Update();
}
```

---

## Zasady zagnieżdżania

Kontenery mogą być zagnieżdżane w celu tworzenia złożonych układów. Kilka wytycznych:

1. **FrameWidget wewnątrz czegokolwiek** -- Zawsze działa. Używaj ramek do grupowania podsekcji wewnątrz spacerów lub siatek.

2. **WrapSpacer wewnątrz ScrollWidget** -- Standardowy wzorzec dla przewijalnych list. Spacer rośnie; scroll przycina.

3. **GridSpacer wewnątrz WrapSpacer** -- Działa. Przydatne do umieszczania stałej siatki jako jednego elementu w układzie przepływowym.

4. **ScrollWidget wewnątrz WrapSpacer** -- Możliwe, ale wymaga stałej wysokości widgetu scroll (`vexactsize 1`). Bez stałej wysokości widget scroll będzie próbował rosnąć, aby dopasować się do treści (co niweluje sens przewijania).

5. **Unikaj głębokiego zagnieżdżania** -- Każdy poziom zagnieżdżenia dodaje koszt obliczania układu. Trzy lub cztery poziomy głębokości to norma dla złożonych interfejsów; przekroczenie sześciu poziomów sugeruje, że układ powinien być przebudowany.

---

## Kiedy użyć każdego kontenera

| Scenariusz | Najlepszy kontener |
|---|---|
| Statyczny panel z ręcznie pozycjonowanymi elementami | `FrameWidget` |
| Dynamiczna lista elementów o różnych rozmiarach | `WrapSpacerWidget` |
| Jednolita siatka (ekwipunek, galeria) | `GridSpacerWidget` |
| Lista pionowa z jednym elementem na wiersz | `WrapSpacerWidget` (dzieci pełnej szerokości) lub `GridSpacerWidget` (`Columns 1`) |
| Treść wyższa niż dostępna przestrzeń | `ScrollWidget` opakowujący spacer |
| Obszar treści zakładek | `FrameWidget` (przełączaj widoczność dzieci) |
| Przyciski paska narzędzi | `WrapSpacerWidget` lub `GridSpacerWidget` |

---

## Kompletny przykład: Przewijalny panel ustawień

Panel ustawień z paskiem tytułu, przewijalnym obszarem zawartości z opcjami ułożonymi w siatkę i dolnym paskiem przycisków:

```
FrameWidgetClass SettingsPanel {
 size 0.4 0.6
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 0
 vexactsize 0
 {
  // Title bar
  PanelWidgetClass TitleBar {
   position 0 0
   size 1 30
   hexactsize 0
   vexactsize 1
   color 0.2 0.4 0.8 1
  }

  // Scrollable settings area
  ScrollWidgetClass SettingsScroll {
   position 0 30
   size 1 0
   hexactpos 0
   vexactpos 1
   hexactsize 0
   vexactsize 0
   "Scrollbar V" 1
   {
    GridSpacerWidgetClass SettingsGrid {
     size 1 0
     hexactsize 0
     "Size To Content V" 1
     Columns 1
     Margin 2
    }
   }
  }

  // Button bar at bottom
  FrameWidgetClass ButtonBar {
   size 1 40
   halign left_ref
   valign bottom_ref
   hexactpos 0
   vexactpos 1
   hexactsize 0
   vexactsize 1
  }
 }
}
```

---

## Dobre praktyki

- Zawsze wywołuj `Update()` na `WrapSpacerWidget` lub `GridSpacerWidget` po programowym dodaniu lub usunięciu dzieci. Bez tego wywołania spacer nie przelicza swojego układu, a dzieci mogą się nakładać lub być niewidoczne.
- Używaj `ScrollWidget` + `WrapSpacerWidget` jako standardowego wzorca dla dowolnej dynamicznej listy. Ustaw scroll na stałą wysokość pikselową, a wewnętrzny spacer na `"Size To Content V" 1`.
- Preferuj `WrapSpacerWidget` z dziećmi pełnej szerokości zamiast `GridSpacerWidget Columns 1` dla list pionowych, gdzie elementy mają różne wysokości. GridSpacer wymusza jednolite rozmiary komórek.
- Zawsze ustawiaj `clipchildren 1` na `ScrollWidget`. Bez tego, przepełniona treść renderuje się poza granicami widoku scroll.
- Unikaj zagnieżdżania więcej niż 4-5 poziomów kontenerów. Każdy poziom dodaje koszt obliczania układu i znacznie utrudnia debugowanie.

---

## Teoria a praktyka

> Czego mówi dokumentacja w porównaniu z tym, jak rzeczy faktycznie działają w trakcie pracy.

| Koncepcja | Teoria | Rzeczywistość |
|---------|--------|---------|
| `WrapSpacerWidget.Update()` | Układ automatycznie się przelicza, gdy dzieci się zmieniają | Musisz ręcznie wywołać `Update()` po `CreateWidgets()` lub `Unlink()`. Zapomnienie tego jest najczęstszym błędem spacera |
| `"Size To Content V"` | Spacer rośnie, aby dopasować się do dzieci | Działa tylko wtedy, gdy dzieci mają jawne rozmiary (wysokość pikselowa lub znany proporcjonalny rodzic). Jeśli dzieci również mają `Size To Content`, otrzymasz zerową wysokość |
| Rozmiar komórek `GridSpacerWidget` | Siatka jednolicie kontroluje rozmiar komórek | Własne atrybuty rozmiaru dzieci są ignorowane -- siatka je nadpisuje. Ustawianie `size` na dziecku siatki nie ma efektu |
| Pozycja przewijania `ScrollWidget` | `VScrollToPos(0)` przewija na górę | Po dodaniu dzieci może być konieczne odroczenie `VScrollToPos()` o jedną klatkę (przez `CallLater`), ponieważ wysokość treści nie została jeszcze przeliczona |
| Zagnieżdżone spacery | Spacery mogą się swobodnie zagnieżdżać | `WrapSpacer` wewnątrz `WrapSpacer` działa, ale `Size To Content` na obu poziomach może spowodować nieskończone pętle układu, które zamrażają interfejs |

---

## Kompatybilność i wpływ

- **Multi-Mod:** Widgety kontenerów są per-layout i nie kolidują między modami. Jednakże, jeśli dwa mody wstrzykują dzieci do tego samego waniliowego `ScrollWidget` (przez `modded class`), kolejność dzieci jest nieprzewidywalna.
- **Wydajność:** `WrapSpacerWidget.Update()` przelicza pozycje wszystkich dzieci. Dla list z 100+ elementami, wywołuj `Update()` raz po operacjach wsadowych, nie po każdym pojedynczym dodaniu. GridSpacer jest szybszy dla jednolitych siatek, ponieważ pozycje komórek są obliczane arytmetycznie.
- **Wersja:** `WrapSpacerWidget` i `GridSpacerWidget` są dostępne od DayZ 1.0. Atrybuty `"Size To Content H/V"` były obecne od początku, ale ich zachowanie z głęboko zagnieżdżonymi układami zostało ustabilizowane około DayZ 1.10.

---

## Zaobserwowane w prawdziwych modach

| Wzorzec | Mod | Szczegóły |
|---------|-----|--------|
| `ScrollWidget` + `WrapSpacerWidget` dla dynamicznych list | DabsFramework, Expansion, COT | Widok scroll o stałej wysokości z automatycznie rosnącym wewnętrznym spacerem -- uniwersalny wzorzec przewijalnej listy |
| `GridSpacerWidget Columns 10` dla ekwipunku | Waniliowy DayZ | Siatka ekwipunku używa GridSpacer ze stałą liczbą kolumn odpowiadającą układowi slotów |
| Poolowane dzieci w WrapSpacer | VPP Admin Tools | Wstępnie tworzy pulę widgetów elementów listy, pokazuje/ukrywa je zamiast tworzyć/niszczyć, aby uniknąć narzutu `Update()` |
| `WrapSpacerWidget` jako korzeń dialogu | COT, DayZ Editor | Korzeń dialogu używa `Size To Content V/H`, więc dialog automatycznie dopasowuje się do swojej treści bez zakodowanych wymiarów |

---

## Następne kroki

- [3.5 Programowe tworzenie widgetów](05-programmatic-widgets.md) -- Tworzenie widgetów z kodu
- [3.6 Obsługa zdarzeń](06-event-handling.md) -- Reagowanie na kliknięcia, zmiany i inne zdarzenia
