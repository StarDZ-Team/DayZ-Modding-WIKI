# Rozdział 3.6: Obsługa zdarzeń

[Strona główna](../../README.md) | [<< Poprzedni: Programowe tworzenie widgetów](05-programmatic-widgets.md) | **Obsługa zdarzeń** | [Dalej: Style, czcionki i obrazy >>](07-styles-fonts.md)

---

Widgety generują zdarzenia, gdy użytkownik z nimi wchodzi w interakcję -- klikanie przycisków, wpisywanie tekstu w pola edycji, ruszanie myszą, przeciąganie elementów. Ten rozdział opisuje, jak odbierać i obsługiwać te zdarzenia.

---

## ScriptedWidgetEventHandler

Klasa `ScriptedWidgetEventHandler` jest fundamentem całej obsługi zdarzeń widgetów w DayZ. Udostępnia metody do nadpisywania dla każdego możliwego zdarzenia widgetu.

Aby odbierać zdarzenia od widgetu, utwórz klasę rozszerzającą `ScriptedWidgetEventHandler`, nadpisz metody zdarzeń, które Cię interesują, i dołącz handler do widgetu za pomocą `SetHandler()`.

### Kompletna lista metod zdarzeń

```c
class ScriptedWidgetEventHandler
{
    // Click events
    bool OnClick(Widget w, int x, int y, int button);
    bool OnDoubleClick(Widget w, int x, int y, int button);

    // Selection events
    bool OnSelect(Widget w, int x, int y);
    bool OnItemSelected(Widget w, int x, int y, int row, int column,
                         int oldRow, int oldColumn);

    // Focus events
    bool OnFocus(Widget w, int x, int y);
    bool OnFocusLost(Widget w, int x, int y);

    // Mouse events
    bool OnMouseEnter(Widget w, int x, int y);
    bool OnMouseLeave(Widget w, Widget enterW, int x, int y);
    bool OnMouseWheel(Widget w, int x, int y, int wheel);
    bool OnMouseButtonDown(Widget w, int x, int y, int button);
    bool OnMouseButtonUp(Widget w, int x, int y, int button);

    // Keyboard events
    bool OnKeyDown(Widget w, int x, int y, int key);
    bool OnKeyUp(Widget w, int x, int y, int key);
    bool OnKeyPress(Widget w, int x, int y, int key);

    // Change events (sliders, checkboxes, editboxes)
    bool OnChange(Widget w, int x, int y, bool finished);

    // Drag and drop events
    bool OnDrag(Widget w, int x, int y);
    bool OnDragging(Widget w, int x, int y, Widget receiver);
    bool OnDraggingOver(Widget w, int x, int y, Widget receiver);
    bool OnDrop(Widget w, int x, int y, Widget receiver);
    bool OnDropReceived(Widget w, int x, int y, Widget receiver);

    // Controller (gamepad) events
    bool OnController(Widget w, int control, int value);

    // Layout events
    bool OnResize(Widget w, int x, int y);
    bool OnChildAdd(Widget w, Widget child);
    bool OnChildRemove(Widget w, Widget child);

    // Other
    bool OnUpdate(Widget w);
    bool OnModalResult(Widget w, int x, int y, int code, int result);
}
```

### Wartość zwracana: Konsumpcja vs. przepuszczanie

Każdy handler zdarzenia zwraca `bool`:

- **`return true;`** -- Zdarzenie jest **skonsumowane**. Żaden inny handler go nie otrzyma. Zdarzenie przestaje się propagować w górę hierarchii widgetów.
- **`return false;`** -- Zdarzenie jest **przepuszczone** do handlera widgetu rodzica (jeśli istnieje).

Jest to krytyczne dla budowania warstwowych interfejsów. Na przykład handler kliknięcia przycisku powinien zwrócić `true`, aby zapobiec propagacji kliknięcia do panelu za nim.

---

## Rejestrowanie handlerów za pomocą SetHandler()

Najprostszy sposób obsługi zdarzeń to wywołanie `SetHandler()` na widgecie:

```c
class MyPanel : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected ButtonWidget m_SaveBtn;
    protected ButtonWidget m_CancelBtn;

    void MyPanel()
    {
        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/gui/layouts/panel.layout");

        m_SaveBtn = ButtonWidget.Cast(m_Root.FindAnyWidget("SaveButton"));
        m_CancelBtn = ButtonWidget.Cast(m_Root.FindAnyWidget("CancelButton"));

        // Register this class as the event handler for both buttons
        m_SaveBtn.SetHandler(this);
        m_CancelBtn.SetHandler(this);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_SaveBtn)
        {
            Save();
            return true;  // Consumed
        }

        if (w == m_CancelBtn)
        {
            Cancel();
            return true;
        }

        return false;  // Not our widget, pass through
    }
}
```

Jedna instancja handlera może być zarejestrowana na wielu widgetach. Wewnątrz metody zdarzenia porównuj `w` (widget, który wygenerował zdarzenie) z zapisanymi referencjami, aby określić, z którym widgetem nastąpiła interakcja.

---

## Szczegóły najczęstszych zdarzeń

### OnClick

```c
bool OnClick(Widget w, int x, int y, int button)
```

Emitowane, gdy `ButtonWidget` jest kliknięty (mysz zwolniona nad widgetem).

- `w` -- Kliknięty widget
- `x, y` -- Pozycja kursora myszy (piksele ekranowe)
- `button` -- Indeks przycisku myszy: `0` = lewy, `1` = prawy, `2` = środkowy

```c
override bool OnClick(Widget w, int x, int y, int button)
{
    if (button != 0) return false;  // Only handle left click

    if (w == m_MyButton)
    {
        DoAction();
        return true;
    }
    return false;
}
```

### OnChange

```c
bool OnChange(Widget w, int x, int y, bool finished)
```

Emitowane przez `SliderWidget`, `CheckBoxWidget`, `EditBoxWidget` i inne widgety oparte na wartościach, gdy ich wartość się zmienia.

- `w` -- Widget, którego wartość się zmieniła
- `finished` -- Dla suwaków: `true`, gdy użytkownik zwolni uchwyt suwaka. Dla pól edycji: `true`, gdy naciśnięto Enter.

```c
override bool OnChange(Widget w, int x, int y, bool finished)
{
    if (w == m_VolumeSlider)
    {
        SliderWidget slider = SliderWidget.Cast(w);
        float value = slider.GetCurrent();

        // Only apply when user finishes dragging
        if (finished)
        {
            ApplyVolume(value);
        }
        else
        {
            // Preview while dragging
            PreviewVolume(value);
        }
        return true;
    }

    if (w == m_NameInput)
    {
        EditBoxWidget edit = EditBoxWidget.Cast(w);
        string text = edit.GetText();

        if (finished)
        {
            // User pressed Enter
            SubmitName(text);
        }
        return true;
    }

    if (w == m_EnableCheckbox)
    {
        CheckBoxWidget cb = CheckBoxWidget.Cast(w);
        bool checked = cb.IsChecked();
        ToggleFeature(checked);
        return true;
    }

    return false;
}
```

### OnMouseEnter / OnMouseLeave

```c
bool OnMouseEnter(Widget w, int x, int y)
bool OnMouseLeave(Widget w, Widget enterW, int x, int y)
```

Emitowane, gdy kursor myszy wchodzi do lub opuszcza granice widgetu. Parametr `enterW` w `OnMouseLeave` jest widgetem, do którego kursor się przeniósł.

Typowe zastosowanie: efekty najechania.

```c
override bool OnMouseEnter(Widget w, int x, int y)
{
    if (w == m_HoverPanel)
    {
        m_HoverPanel.SetColor(ARGB(255, 80, 130, 200));  // Highlight
        return true;
    }
    return false;
}

override bool OnMouseLeave(Widget w, Widget enterW, int x, int y)
{
    if (w == m_HoverPanel)
    {
        m_HoverPanel.SetColor(ARGB(255, 50, 50, 50));  // Default
        return true;
    }
    return false;
}
```

### OnFocus / OnFocusLost

```c
bool OnFocus(Widget w, int x, int y)
bool OnFocusLost(Widget w, int x, int y)
```

Emitowane, gdy widget zyskuje lub traci fokus klawiatury. Ważne dla pól edycji i innych widgetów wprowadzania tekstu.

```c
override bool OnFocus(Widget w, int x, int y)
{
    if (w == m_SearchBox)
    {
        m_SearchBox.SetColor(ARGB(255, 100, 160, 220));
        return true;
    }
    return false;
}

override bool OnFocusLost(Widget w, int x, int y)
{
    if (w == m_SearchBox)
    {
        m_SearchBox.SetColor(ARGB(255, 60, 60, 60));
        return true;
    }
    return false;
}
```

### OnMouseWheel

```c
bool OnMouseWheel(Widget w, int x, int y, int wheel)
```

Emitowane, gdy kółko myszy jest przewijane nad widgetem. `wheel` jest dodatnie dla przewijania w górę, ujemne dla przewijania w dół.

### OnKeyDown / OnKeyUp / OnKeyPress

```c
bool OnKeyDown(Widget w, int x, int y, int key)
bool OnKeyUp(Widget w, int x, int y, int key)
bool OnKeyPress(Widget w, int x, int y, int key)
```

Zdarzenia klawiatury. Parametr `key` odpowiada stałym `KeyCode` (np. `KeyCode.KC_ESCAPE`, `KeyCode.KC_RETURN`).

### OnDrag / OnDrop / OnDropReceived

```c
bool OnDrag(Widget w, int x, int y)
bool OnDrop(Widget w, int x, int y, Widget receiver)
bool OnDropReceived(Widget w, int x, int y, Widget receiver)
```

Zdarzenia przeciągnij i upuść. Widget musi mieć `draggable 1` w swoim layoucie (lub ustawioną flagę `WidgetFlags.DRAGGABLE` w kodzie).

- `OnDrag` -- Użytkownik zaczął przeciągać widget `w`
- `OnDrop` -- Widget `w` został upuszczony; `receiver` to widget pod spodem
- `OnDropReceived` -- Widget `w` otrzymał upuszczony element; `receiver` to upuszczony widget

### OnItemSelected

```c
bool OnItemSelected(Widget w, int x, int y, int row, int column,
                     int oldRow, int oldColumn)
```

Emitowane przez `TextListboxWidget`, gdy wiersz jest wybrany.

---

## Waniliowy WidgetEventHandler (rejestracja callbacków)

Waniliowy kod DayZ używa alternatywnego wzorca: `WidgetEventHandler`, singletona, który przekierowuje zdarzenia do nazwanych funkcji callback. Jest to powszechnie używane w waniliowych menu.

```c
WidgetEventHandler handler = WidgetEventHandler.GetInstance();

// Register event callbacks by function name
handler.RegisterOnClick(myButton, this, "OnMyButtonClick");
handler.RegisterOnMouseEnter(myWidget, this, "OnHoverStart");
handler.RegisterOnMouseLeave(myWidget, this, "OnHoverEnd");
handler.RegisterOnDoubleClick(myWidget, this, "OnDoubleClick");
handler.RegisterOnMouseButtonDown(myWidget, this, "OnMouseDown");
handler.RegisterOnMouseButtonUp(myWidget, this, "OnMouseUp");
handler.RegisterOnMouseWheel(myWidget, this, "OnWheel");
handler.RegisterOnFocus(myWidget, this, "OnFocusGained");
handler.RegisterOnFocusLost(myWidget, this, "OnFocusLost");
handler.RegisterOnDrag(myWidget, this, "OnDragStart");
handler.RegisterOnDrop(myWidget, this, "OnDropped");
handler.RegisterOnDropReceived(myWidget, this, "OnDropReceived");
handler.RegisterOnDraggingOver(myWidget, this, "OnDragOver");
handler.RegisterOnChildAdd(myWidget, this, "OnChildAdded");
handler.RegisterOnChildRemove(myWidget, this, "OnChildRemoved");

// Unregister all callbacks for a widget
handler.UnregisterWidget(myWidget);
```

Sygnatury funkcji callback muszą odpowiadać typowi zdarzenia:

```c
void OnMyButtonClick(Widget w, int x, int y, int button)
{
    // Handle click
}

void OnHoverStart(Widget w, int x, int y)
{
    // Handle mouse enter
}

void OnHoverEnd(Widget w, Widget enterW, int x, int y)
{
    // Handle mouse leave
}
```

### SetHandler() vs. WidgetEventHandler

| Aspekt | SetHandler() | WidgetEventHandler |
|---|---|---|
| Wzorzec | Nadpisywanie metod wirtualnych | Rejestracja nazwanych callbacków |
| Handler na widget | Jeden handler na widget | Wiele callbacków na zdarzenie |
| Używany przez | DabsFramework, Expansion, niestandardowe mody | Waniliowe menu DayZ |
| Elastyczność | Wszystkie zdarzenia muszą być obsługiwane w jednej klasie | Można rejestrować różne cele dla różnych zdarzeń |
| Czyszczenie | Niejawne po zniszczeniu handlera | Wymaga wywołania `UnregisterWidget()` |

Dla nowych modów `SetHandler()` z `ScriptedWidgetEventHandler` jest zalecanym podejściem.

---

## Kompletny przykład: Interaktywny panel przycisków

Panel z trzema przyciskami, które zmieniają kolor przy najechaniu i wykonują akcje po kliknięciu:

```c
class InteractivePanel : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected ButtonWidget m_BtnStart;
    protected ButtonWidget m_BtnStop;
    protected ButtonWidget m_BtnReset;
    protected TextWidget m_StatusText;

    protected int m_DefaultColor = ARGB(255, 60, 60, 60);
    protected int m_HoverColor   = ARGB(255, 80, 130, 200);
    protected int m_ActiveColor  = ARGB(255, 50, 180, 80);

    void InteractivePanel()
    {
        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/gui/layouts/interactive_panel.layout");

        m_BtnStart  = ButtonWidget.Cast(m_Root.FindAnyWidget("BtnStart"));
        m_BtnStop   = ButtonWidget.Cast(m_Root.FindAnyWidget("BtnStop"));
        m_BtnReset  = ButtonWidget.Cast(m_Root.FindAnyWidget("BtnReset"));
        m_StatusText = TextWidget.Cast(m_Root.FindAnyWidget("StatusText"));

        // Register this handler on all interactive widgets
        m_BtnStart.SetHandler(this);
        m_BtnStop.SetHandler(this);
        m_BtnReset.SetHandler(this);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (button != 0) return false;

        if (w == m_BtnStart)
        {
            m_StatusText.SetText("Started");
            m_StatusText.SetColor(m_ActiveColor);
            return true;
        }
        if (w == m_BtnStop)
        {
            m_StatusText.SetText("Stopped");
            m_StatusText.SetColor(ARGB(255, 200, 50, 50));
            return true;
        }
        if (w == m_BtnReset)
        {
            m_StatusText.SetText("Ready");
            m_StatusText.SetColor(ARGB(255, 200, 200, 200));
            return true;
        }
        return false;
    }

    override bool OnMouseEnter(Widget w, int x, int y)
    {
        if (w == m_BtnStart || w == m_BtnStop || w == m_BtnReset)
        {
            w.SetColor(m_HoverColor);
            return true;
        }
        return false;
    }

    override bool OnMouseLeave(Widget w, Widget enterW, int x, int y)
    {
        if (w == m_BtnStart || w == m_BtnStop || w == m_BtnReset)
        {
            w.SetColor(m_DefaultColor);
            return true;
        }
        return false;
    }

    void Show(bool visible)
    {
        m_Root.Show(visible);
    }

    void ~InteractivePanel()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = null;
        }
    }
}
```

---

## Dobre praktyki obsługi zdarzeń

1. **Zawsze zwracaj `true`, gdy obsługujesz zdarzenie** -- W przeciwnym razie zdarzenie propaguje się do widgetów nadrzędnych i może wywołać niezamierzone zachowanie.

2. **Zwracaj `false` dla zdarzeń, których nie obsługujesz** -- Pozwala to widgetom nadrzędnym przetworzyć zdarzenie.

3. **Cachuj referencje widgetów** -- Nie wywołuj `FindAnyWidget()` wewnątrz handlerów zdarzeń. Wyszukaj widgety raz w konstruktorze i przechowuj referencje.

4. **Sprawdzaj null widgetów w zdarzeniach** -- Widget `w` jest zazwyczaj poprawny, ale defensywne kodowanie zapobiega awariom.

5. **Czyść handlery** -- Przy niszczeniu panelu odłącz korzeń widgetu. Jeśli używasz `WidgetEventHandler`, wywołaj `UnregisterWidget()`.

6. **Używaj parametru `finished` mądrze** -- Dla suwaków wykonuj kosztowne operacje tylko gdy `finished` jest `true` (użytkownik zwolnił uchwyt). Używaj zdarzeń bez finished do podglądu.

7. **Odraczaj ciężką pracę** -- Jeśli handler zdarzenia musi wykonać kosztowne obliczenia, użyj `CallLater` do odroczenia:

```c
override bool OnClick(Widget w, int x, int y, int button)
{
    if (w == m_HeavyActionBtn)
    {
        GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(DoHeavyWork, 0, false);
        return true;
    }
    return false;
}
```

---

## Teoria a praktyka

> Czego mówi dokumentacja w porównaniu z tym, jak rzeczy faktycznie działają w trakcie pracy.

| Koncepcja | Teoria | Rzeczywistość |
|---------|--------|---------|
| `OnClick` emitowane na dowolnym widgecie | Dowolny widget może odbierać zdarzenia kliknięcia | Tylko `ButtonWidget` niezawodnie emituje `OnClick`. Dla innych typów widgetów użyj `OnMouseButtonDown` / `OnMouseButtonUp` |
| `SetHandler()` zastępuje handler | Ustawienie nowego handlera zastępuje stary | Poprawne, ale stary handler nie jest powiadamiany. Jeśli przechowywał zasoby, wyciekną. Zawsze czyść przed zastąpieniem handlerów |
| Parametr `finished` `OnChange` | `true`, gdy użytkownik kończy interakcję | Dla `EditBoxWidget`, `finished` jest `true` tylko po naciśnięciu Enter -- tabulacja lub kliknięcie gdzie indziej NIE ustawia `finished` na `true` |
| Propagacja wartości zwracanej zdarzenia | `return false` przekazuje zdarzenie do rodzica | Zdarzenia propagują się w górę drzewa widgetów, nie do widgetów rodzeństwa. `return false` z dziecka trafia do jego rodzica, nigdy do sąsiedniego widgetu |
| Nazwy callbacków `WidgetEventHandler` | Dowolna nazwa funkcji działa | Funkcja musi istnieć na obiekcie docelowym w momencie rejestracji. Jeśli nazwa funkcji jest błędnie napisana, rejestracja cicho się udaje, ale callback nigdy się nie uruchomi |

---

## Kompatybilność i wpływ

- **Multi-Mod:** `SetHandler()` pozwala na tylko jeden handler na widget. Jeśli mod A i mod B oba wywołują `SetHandler()` na tym samym waniliowym widgecie (przez `modded class`), ostatni wygrywa, a drugi cicho przestaje odbierać zdarzenia. Użyj `WidgetEventHandler.RegisterOnClick()` dla addytywnej kompatybilności multi-mod.
- **Wydajność:** Handlery zdarzeń uruchamiają się na głównym wątku gry. Wolny handler `OnClick` (np. I/O plików lub złożone obliczenia) powoduje widoczne zacinanie klatek. Odraczaj ciężką pracę za pomocą `GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater()`.
- **Wersja:** API `ScriptedWidgetEventHandler` jest stabilne od DayZ 1.0. Callbacki singletona `WidgetEventHandler` to waniliowe wzorce obecne od wczesnych wersji Enforce Script i pozostają niezmienione.

---

## Zaobserwowane w prawdziwych modach

| Wzorzec | Mod | Szczegóły |
|---------|-----|--------|
| Jeden handler dla całego panelu | COT, VPP Admin Tools | Jedna podklasa `ScriptedWidgetEventHandler` obsługuje wszystkie przyciski w panelu, rozdzielając przez porównywanie `w` z zapisanymi referencjami widgetów |
| `WidgetEventHandler.RegisterOnClick` dla modularnych przycisków | Expansion Market | Każdy dynamicznie tworzony przycisk kupna/sprzedaży rejestruje swój własny callback, umożliwiając funkcje handlera per-element |
| `OnMouseEnter` / `OnMouseLeave` dla tooltipów przy najechaniu | DayZ Editor | Zdarzenia najechania uruchamiają widgety tooltipów, które podążają za pozycją kursora przez `GetMousePos()` |
| Odroczenie `CallLater` w `OnClick` | DabsFramework | Ciężkie operacje (zapis konfiguracji, wysyłanie RPC) są odraczane o 0ms przez `CallLater`, aby uniknąć blokowania wątku UI podczas zdarzenia |

---

## Następne kroki

- [3.7 Style, czcionki i obrazy](07-styles-fonts.md) -- Stylowanie wizualne ze stylami, czcionkami i referencjami imagesetów
- [3.5 Programowe tworzenie widgetów](05-programmatic-widgets.md) -- Tworzenie widgetów generujących zdarzenia
