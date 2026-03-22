# Rozdział 3.5: Programowe tworzenie widgetów

[Strona główna](../README.md) | [<< Poprzedni: Widgety kontenerów](04-containers.md) | **Programowe tworzenie widgetów** | [Dalej: Obsługa zdarzeń >>](06-event-handling.md)

---

Podczas gdy pliki `.layout` są standardowym sposobem definiowania struktury UI, możesz również tworzyć i konfigurować widgety całkowicie z kodu. Jest to przydatne dla dynamicznych interfejsów, proceduralnie generowanych elementów i sytuacji, w których układ nie jest znany w czasie kompilacji.

---

## Dwa podejścia

DayZ zapewnia dwa sposoby tworzenia widgetów z kodu:

1. **`CreateWidgets()`** -- Załaduj plik `.layout` i utwórz instancję jego drzewa widgetów
2. **`CreateWidget()`** -- Utwórz pojedynczy widget z jawnymi parametrami

Obie metody są wywoływane na `WorkspaceWidget` uzyskanym z `GetGame().GetWorkspace()`.

---

## CreateWidgets() -- Z plików layoutu

Najczęściej stosowane podejście. Ładuje plik `.layout` i tworzy całe drzewo widgetów, dołączając je do widgetu rodzica.

```c
Widget root = GetGame().GetWorkspace().CreateWidgets(
    "MyMod/gui/layouts/MyPanel.layout",   // Path to layout file
    parentWidget                            // Parent widget (or null for root)
);
```

Zwrócony `Widget` jest korzeniowym widgetem z pliku layoutu. Następnie możesz wyszukiwać widgety potomne po nazwie:

```c
TextWidget title = TextWidget.Cast(root.FindAnyWidget("TitleText"));
title.SetText("Hello World");

ButtonWidget closeBtn = ButtonWidget.Cast(root.FindAnyWidget("CloseButton"));
```

### Tworzenie wielu instancji

Częstym wzorcem jest tworzenie wielu instancji szablonu layoutu (np. elementów listy):

```c
void PopulateList(WrapSpacerWidget container, array<string> items)
{
    foreach (string item : items)
    {
        Widget row = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/gui/layouts/ListRow.layout", container);

        TextWidget label = TextWidget.Cast(row.FindAnyWidget("Label"));
        label.SetText(item);
    }

    container.Update();  // Force layout recalculation
}
```

---

## CreateWidget() -- Tworzenie programowe

Tworzy pojedynczy widget z jawnym typem, pozycją, rozmiarem, flagami i rodzicem.

```c
Widget w = GetGame().GetWorkspace().CreateWidget(
    FrameWidgetTypeID,      // Widget type ID constant
    0,                       // X position
    0,                       // Y position
    100,                     // Width
    100,                     // Height
    WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE | WidgetFlags.EXACTPOS,
    -1,                      // Color (ARGB integer, -1 = white/default)
    0,                       // Sort order (priority)
    parentWidget             // Parent widget
);
```

### Parametry

| Parametr | Typ | Opis |
|---|---|---|
| typeID | int | Stała typu widgetu (np. `FrameWidgetTypeID`, `TextWidgetTypeID`) |
| x | float | Pozycja X (proporcjonalna lub pikselowa w zależności od flag) |
| y | float | Pozycja Y |
| width | float | Szerokość widgetu |
| height | float | Wysokość widgetu |
| flags | int | Bitowe OR stałych `WidgetFlags` |
| color | int | Kolor ARGB jako liczba całkowita (-1 dla domyślnego/białego) |
| sort | int | Kolejność Z (wyższe renderowane na wierzchu) |
| parent | Widget | Widget rodzica do dołączenia |

### Identyfikatory typów widgetów

```c
FrameWidgetTypeID
TextWidgetTypeID
MultilineTextWidgetTypeID
RichTextWidgetTypeID
ImageWidgetTypeID
VideoWidgetTypeID
RTTextureWidgetTypeID
RenderTargetWidgetTypeID
ButtonWidgetTypeID
CheckBoxWidgetTypeID
EditBoxWidgetTypeID
PasswordEditBoxWidgetTypeID
MultilineEditBoxWidgetTypeID
SliderWidgetTypeID
SimpleProgressBarWidgetTypeID
ProgressBarWidgetTypeID
TextListboxWidgetTypeID
GridSpacerWidgetTypeID
WrapSpacerWidgetTypeID
ScrollWidgetTypeID
WorkspaceWidgetTypeID
```

---

## WidgetFlags

Flagi kontrolują zachowanie widgetu przy programowym tworzeniu. Łącz je za pomocą bitowego OR (`|`).

| Flaga | Efekt |
|---|---|
| `WidgetFlags.VISIBLE` | Widget zaczyna jako widoczny |
| `WidgetFlags.IGNOREPOINTER` | Widget nie odbiera zdarzeń myszy |
| `WidgetFlags.DRAGGABLE` | Widget może być przeciągany |
| `WidgetFlags.EXACTSIZE` | Wartości rozmiaru podane w pikselach (nie proporcjonalnie) |
| `WidgetFlags.EXACTPOS` | Wartości pozycji podane w pikselach (nie proporcjonalnie) |
| `WidgetFlags.SOURCEALPHA` | Użyj źródłowego kanału alfa |
| `WidgetFlags.BLEND` | Włącz mieszanie alfa |
| `WidgetFlags.FLIPU` | Odbij teksturę poziomo |
| `WidgetFlags.FLIPV` | Odbij teksturę pionowo |

Popularne kombinacje flag:

```c
// Visible, pixel-sized, pixel-positioned, alpha-blended
int FLAGS_EXACT = WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE | WidgetFlags.EXACTPOS | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;

// Visible, proportional, non-interactive
int FLAGS_OVERLAY = WidgetFlags.VISIBLE | WidgetFlags.IGNOREPOINTER | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;
```

Po utworzeniu możesz dynamicznie modyfikować flagi:

```c
widget.SetFlags(WidgetFlags.VISIBLE);          // Add a flag
widget.ClearFlags(WidgetFlags.IGNOREPOINTER);  // Remove a flag
int flags = widget.GetFlags();                  // Read current flags
```

---

## Ustawianie właściwości po utworzeniu

Po utworzeniu widgetu za pomocą `CreateWidget()`, musisz go skonfigurować. Widget jest zwracany jako bazowy typ `Widget`, więc musisz rzutować na konkretny typ.

### Ustawianie nazwy

```c
Widget w = GetGame().GetWorkspace().CreateWidget(TextWidgetTypeID, ...);
w.SetName("MyTextWidget");
```

Nazwy są ważne dla wyszukiwania przez `FindAnyWidget()` i debugowania.

### Ustawianie tekstu

```c
TextWidget tw = TextWidget.Cast(w);
tw.SetText("Hello World");
tw.SetTextExactSize(16);           // Font size in pixels
tw.SetOutline(1, ARGB(255, 0, 0, 0));  // 1px black outline
```

### Ustawianie koloru

Kolory w DayZ używają formatu ARGB (Alfa, Czerwony, Zielony, Niebieski), spakowanego w pojedynczą 32-bitową liczbę całkowitą:

```c
// Using the ARGB helper function (0-255 per channel)
int red    = ARGB(255, 255, 0, 0);       // Opaque red
int green  = ARGB(255, 0, 255, 0);       // Opaque green
int blue   = ARGB(200, 0, 0, 255);       // Semi-transparent blue
int black  = ARGB(255, 0, 0, 0);         // Opaque black
int white  = ARGB(255, 255, 255, 255);   // Opaque white  (same as -1)

// Using the float version (0.0-1.0 per channel)
int color = ARGBF(1.0, 0.5, 0.25, 0.1);

// Decompose a color back to floats
float a, r, g, b;
InverseARGBF(color, a, r, g, b);

// Apply to any widget
widget.SetColor(ARGB(255, 100, 150, 200));
widget.SetAlpha(0.5);  // Override just the alpha
```

Format szesnastkowy `0xAARRGGBB` jest również powszechny:

```c
int color = 0xFF4B77BE;   // A=255, R=75, G=119, B=190
widget.SetColor(color);
```

### Ustawianie handlera zdarzeń

```c
widget.SetHandler(myEventHandler);  // ScriptedWidgetEventHandler instance
```

### Ustawianie danych użytkownika

Dołącz dowolne dane do widgetu do późniejszego odczytu:

```c
widget.SetUserData(myDataObject);  // Must inherit from Managed

// Later retrieve it:
Managed data;
widget.GetUserData(data);
MyDataClass myData = MyDataClass.Cast(data);
```

---

## Czyszczenie widgetów

Widgety, które nie są już potrzebne, muszą być odpowiednio wyczyszczone, aby uniknąć wycieków pamięci.

### Unlink()

Usuwa widget z jego rodzica i niszczy go (wraz ze wszystkimi dziećmi):

```c
widget.Unlink();
```

Po wywołaniu `Unlink()` referencja widgetu staje się nieważna. Ustaw ją na `null`:

```c
widget.Unlink();
widget = null;
```

### Usuwanie wszystkich dzieci

Aby wyczyścić kontener ze wszystkich jego dzieci:

```c
void ClearChildren(Widget parent)
{
    Widget child = parent.GetChildren();
    while (child)
    {
        Widget next = child.GetSibling();
        child.Unlink();
        child = next;
    }
}
```

**Ważne:** Musisz pobrać `GetSibling()` **przed** wywołaniem `Unlink()`, ponieważ odłączenie unieważnia łańcuch rodzeństwa widgetu.

### Sprawdzanie null

Zawsze sprawdzaj null przed użyciem widgetów. `FindAnyWidget()` zwraca `null`, jeśli widget nie został znaleziony, a operacje rzutowania zwracają `null`, jeśli typ nie pasuje:

```c
TextWidget tw = TextWidget.Cast(root.FindAnyWidget("MaybeExists"));
if (tw)
{
    tw.SetText("Found it");
}
```

---

## Nawigacja po hierarchii widgetów

Nawiguj po drzewie widgetów z kodu:

```c
Widget parent = widget.GetParent();           // Parent widget
Widget firstChild = widget.GetChildren();     // First child
Widget nextSibling = widget.GetSibling();     // Next sibling
Widget found = widget.FindAnyWidget("Name");  // Recursive search by name

string name = widget.GetName();               // Widget name
string typeName = widget.GetTypeName();       // e.g., "TextWidget"
```

Aby iterować po wszystkich dzieciach:

```c
Widget child = parent.GetChildren();
while (child)
{
    // Process child
    Print("Child: " + child.GetName());

    child = child.GetSibling();
}
```

Aby rekurencyjnie iterować po wszystkich potomkach:

```c
void WalkWidgets(Widget w, int depth = 0)
{
    if (!w) return;

    string indent = "";
    for (int i = 0; i < depth; i++) indent += "  ";
    Print(indent + w.GetTypeName() + " " + w.GetName());

    WalkWidgets(w.GetChildren(), depth + 1);
    WalkWidgets(w.GetSibling(), depth);
}
```

---

## Kompletny przykład: Tworzenie dialogu w kodzie

Oto kompletny przykład, który tworzy prosty dialog informacyjny całkowicie w kodzie, bez pliku layoutu:

```c
class SimpleCodeDialog : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected TextWidget m_Title;
    protected TextWidget m_Message;
    protected ButtonWidget m_CloseBtn;

    void SimpleCodeDialog(string title, string message)
    {
        int FLAGS_EXACT = WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE
            | WidgetFlags.EXACTPOS | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;
        int FLAGS_PROP = WidgetFlags.VISIBLE | WidgetFlags.SOURCEALPHA
            | WidgetFlags.BLEND;

        WorkspaceWidget workspace = GetGame().GetWorkspace();

        // Root frame: 400x200 pixels, centered on screen
        m_Root = workspace.CreateWidget(
            FrameWidgetTypeID, 0, 0, 400, 200, FLAGS_EXACT,
            ARGB(230, 30, 30, 30), 100, null);

        // Center it manually
        int sw, sh;
        GetScreenSize(sw, sh);
        m_Root.SetScreenPos((sw - 400) / 2, (sh - 200) / 2);

        // Title text: full width, 30px tall, at top
        Widget titleW = workspace.CreateWidget(
            TextWidgetTypeID, 0, 0, 400, 30, FLAGS_EXACT,
            ARGB(255, 100, 160, 220), 0, m_Root);
        m_Title = TextWidget.Cast(titleW);
        m_Title.SetText(title);

        // Message text: below title, fills remaining space
        Widget msgW = workspace.CreateWidget(
            TextWidgetTypeID, 10, 40, 380, 110, FLAGS_EXACT,
            ARGB(255, 200, 200, 200), 0, m_Root);
        m_Message = TextWidget.Cast(msgW);
        m_Message.SetText(message);

        // Close button: 80x30 pixels, bottom-right area
        Widget btnW = workspace.CreateWidget(
            ButtonWidgetTypeID, 310, 160, 80, 30, FLAGS_EXACT,
            ARGB(255, 80, 130, 200), 0, m_Root);
        m_CloseBtn = ButtonWidget.Cast(btnW);
        m_CloseBtn.SetText("Close");
        m_CloseBtn.SetHandler(this);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_CloseBtn)
        {
            Close();
            return true;
        }
        return false;
    }

    void Close()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = null;
        }
    }

    void ~SimpleCodeDialog()
    {
        Close();
    }
}

// Usage:
SimpleCodeDialog dialog = new SimpleCodeDialog("Alert", "Server restart in 5 minutes.");
```

---

## Pooling widgetów

Tworzenie i niszczenie widgetów w każdej klatce powoduje problemy z wydajnością. Zamiast tego utrzymuj pulę wielokrotnie używalnych widgetów:

```c
class WidgetPool
{
    protected ref array<Widget> m_Pool;
    protected ref array<Widget> m_Active;
    protected Widget m_Parent;
    protected string m_LayoutPath;

    void WidgetPool(Widget parent, string layoutPath, int initialSize = 10)
    {
        m_Pool = new array<Widget>();
        m_Active = new array<Widget>();
        m_Parent = parent;
        m_LayoutPath = layoutPath;

        // Pre-create widgets
        for (int i = 0; i < initialSize; i++)
        {
            Widget w = GetGame().GetWorkspace().CreateWidgets(m_LayoutPath, m_Parent);
            w.Show(false);
            m_Pool.Insert(w);
        }
    }

    Widget Acquire()
    {
        Widget w;
        if (m_Pool.Count() > 0)
        {
            w = m_Pool[m_Pool.Count() - 1];
            m_Pool.Remove(m_Pool.Count() - 1);
        }
        else
        {
            w = GetGame().GetWorkspace().CreateWidgets(m_LayoutPath, m_Parent);
        }
        w.Show(true);
        m_Active.Insert(w);
        return w;
    }

    void Release(Widget w)
    {
        w.Show(false);
        int idx = m_Active.Find(w);
        if (idx >= 0)
            m_Active.Remove(idx);
        m_Pool.Insert(w);
    }

    void ReleaseAll()
    {
        foreach (Widget w : m_Active)
        {
            w.Show(false);
            m_Pool.Insert(w);
        }
        m_Active.Clear();
    }
}
```

**Kiedy używać poolingu:**
- Listy, które się często aktualizują (killfeed, czat, lista graczy)
- Siatki z dynamiczną treścią (ekwipunek, market)
- Dowolny UI, który tworzy/niszczy 10+ widgetów na sekundę

**Kiedy NIE używać poolingu:**
- Statyczne panele tworzone raz
- Dialogi pokazywane/ukrywane (po prostu użyj Show/Hide)

---

## Pliki layoutu vs. tworzenie programowe: Kiedy użyć którego

| Sytuacja | Zalecenie |
|---|---|
| Statyczna struktura UI | Plik layoutu (`.layout`) |
| Złożone drzewa widgetów | Plik layoutu |
| Dynamiczna liczba elementów | `CreateWidgets()` z szablonu layoutu |
| Proste elementy runtime (tekst debugowania, znaczniki) | `CreateWidget()` |
| Szybkie prototypowanie | `CreateWidget()` |
| Produkcyjny UI moda | Plik layoutu + konfiguracja kodem |

W praktyce większość modów używa **plików layoutu** dla struktury i **kodu** do wypełniania danymi, pokazywania/ukrywania elementów i obsługi zdarzeń. Czysto programowe interfejsy są rzadkie poza narzędziami debugowania.

---

## Następne kroki

- [3.6 Obsługa zdarzeń](06-event-handling.md) -- Obsługa kliknięć, zmian i zdarzeń myszy
- [3.7 Style, czcionki i obrazy](07-styles-fonts.md) -- Stylowanie wizualne i zasoby graficzne

---

## Teoria a praktyka

| Koncepcja | Teoria | Rzeczywistość |
|---------|--------|---------|
| `CreateWidget()` tworzy dowolny typ widgetu | Wszystkie TypeID działają z `CreateWidget()` | `ScrollWidget` i `WrapSpacerWidget` utworzone programowo często wymagają ręcznego ustawienia flag (`EXACTSIZE`, rozmiarowanie), które pliki layoutu obsługują automatycznie |
| `Unlink()` zwalnia całą pamięć | Widget i dzieci są niszczone | Referencje przechowywane w zmiennych skryptowych stają się wiszące. Zawsze ustawiaj referencje widgetów na `null` po `Unlink()`, inaczej ryzykujesz awarie |
| `SetHandler()` przekierowuje wszystkie zdarzenia | Jeden handler odbiera wszystkie zdarzenia widgetu | Handler odbiera zdarzenia tylko dla widgetów, które wywołały `SetHandler(this)`. Dzieci nie dziedziczą handlera od swojego rodzica |
| `CreateWidgets()` z layoutu jest natychmiastowe | Layout ładuje się synchronicznie | Duże layouty z wieloma zagnieżdżonymi widgetami powodują skok klatek. Wstępnie ładuj layouty podczas ekranów ładowania, nie podczas rozgrywki |
| Rozmiarowanie proporcjonalne (0.0-1.0) skaluje się do rodzica | Wartości są relatywne do wymiarów rodzica | Bez flagi `EXACTSIZE`, nawet wartości `CreateWidget()` jak `100` są traktowane jako proporcjonalne (zakres 0-1), powodując wypełnienie całego rodzica |

---

## Kompatybilność i wpływ

- **Multi-Mod:** Programowo utworzone widgety są prywatne dla tworzącego moda. W przeciwieństwie do `modded class`, nie ma ryzyka kolizji, chyba że dwa mody dołączają widgety do tego samego waniliowego widgetu rodzica po nazwie.
- **Wydajność:** Każde wywołanie `CreateWidgets()` parsuje plik layoutu z dysku. Cachuj korzeń widgetu i pokazuj/ukrywaj go, zamiast tworzyć z layoutu za każdym razem, gdy UI jest otwierany.

---

## Zaobserwowane w prawdziwych modach

| Wzorzec | Mod | Szczegóły |
|---------|-----|--------|
| Szablon layoutu + wypełnianie kodem | COT, Expansion | Ładują szablon wiersza `.layout` przez `CreateWidgets()` na element listy, potem wypełniają przez `FindAnyWidget()` |
| Pooling widgetów dla killfeedu | Colorful UI | Wstępnie tworzy 20 widgetów wpisów feedu, pokazuje/ukrywa je zamiast tworzyć i niszczyć |
| Dialogi czysto kodowe | Narzędzia debugowania/admina | Proste dialogi alertów budowane całkowicie z `CreateWidget()`, aby uniknąć dostarczania dodatkowych plików `.layout` |
| `SetHandler(this)` na każdym interaktywnym dziecku | VPP Admin Tools | Iteruje po wszystkich przyciskach po załadowaniu layoutu i wywołuje `SetHandler()` na każdym z osobna |
| Wzorzec `Unlink()` + null | DabsFramework | Każda metoda `Close()` dialogu konsekwentnie wywołuje `m_Root.Unlink(); m_Root = null;` |
