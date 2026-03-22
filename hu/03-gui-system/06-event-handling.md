# 3.6. fejezet: Események kezelése

[Kezdőlap](../README.md) | [<< Előző: Programozott widget létrehozás](05-programmatic-widgets.md) | **Események kezelése** | [Következő: Stílusok, betűtípusok és képek >>](07-styles-fonts.md)

---

A widgetek eseményeket generálnak, amikor a felhasználó interakcióba lép velük -- gombok kattintása, szerkesztőmezőkbe gépelés, az egér mozgatása, elemek húzása. Ez a fejezet bemutatja, hogyan fogadhatod és kezelheted ezeket az eseményeket.

---

## ScriptedWidgetEventHandler

A `ScriptedWidgetEventHandler` osztály az összes widget eseménykezelés alapja a DayZ-ben. Felülírható metódusokat biztosít minden lehetséges widget eseményhez.

Ahhoz, hogy eseményeket fogadj egy widgettől, hozz létre egy osztályt, amely kiterjeszti a `ScriptedWidgetEventHandler`-t, írd felül a kívánt esemény metódusokat, és csatold a kezelőt a widgethez a `SetHandler()` segítségével.

### Teljes esemény metódus lista

```c
class ScriptedWidgetEventHandler
{
    // Kattintás események
    bool OnClick(Widget w, int x, int y, int button);
    bool OnDoubleClick(Widget w, int x, int y, int button);

    // Kiválasztás események
    bool OnSelect(Widget w, int x, int y);
    bool OnItemSelected(Widget w, int x, int y, int row, int column,
                         int oldRow, int oldColumn);

    // Fókusz események
    bool OnFocus(Widget w, int x, int y);
    bool OnFocusLost(Widget w, int x, int y);

    // Egér események
    bool OnMouseEnter(Widget w, int x, int y);
    bool OnMouseLeave(Widget w, Widget enterW, int x, int y);
    bool OnMouseWheel(Widget w, int x, int y, int wheel);
    bool OnMouseButtonDown(Widget w, int x, int y, int button);
    bool OnMouseButtonUp(Widget w, int x, int y, int button);

    // Billentyűzet események
    bool OnKeyDown(Widget w, int x, int y, int key);
    bool OnKeyUp(Widget w, int x, int y, int key);
    bool OnKeyPress(Widget w, int x, int y, int key);

    // Változás események (csúszkák, jelölőnégyzetek, szerkesztőmezők)
    bool OnChange(Widget w, int x, int y, bool finished);

    // Húzd és ejtsd események
    bool OnDrag(Widget w, int x, int y);
    bool OnDragging(Widget w, int x, int y, Widget receiver);
    bool OnDraggingOver(Widget w, int x, int y, Widget receiver);
    bool OnDrop(Widget w, int x, int y, Widget receiver);
    bool OnDropReceived(Widget w, int x, int y, Widget receiver);

    // Kontroller (gamepad) események
    bool OnController(Widget w, int control, int value);

    // Layout események
    bool OnResize(Widget w, int x, int y);
    bool OnChildAdd(Widget w, Widget child);
    bool OnChildRemove(Widget w, Widget child);

    // Egyéb
    bool OnUpdate(Widget w);
    bool OnModalResult(Widget w, int x, int y, int code, int result);
}
```

### Visszatérési érték: Felhasznált vs. átengedett

Minden eseménykezelő `bool` értéket ad vissza:

- **`return true;`** -- Az esemény **felhasznált**. Más kezelő nem fogja megkapni. Az esemény terjedése megáll a widget hierarchiában.
- **`return false;`** -- Az esemény **átengedett** a szülő widget kezelőjéhez (ha van).

Ez kritikus a rétegzett UI-k építéséhez. Például egy gomb kattintás kezelőnek `true` értéket kell visszaadnia, hogy megakadályozza a kattintást a mögötte lévő panel aktiválásától.

---

## Kezelők regisztrálása a SetHandler() segítségével

Az események kezelésének legegyszerűbb módja a `SetHandler()` hívása egy widgeten:

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

        // Ennek az osztálynak a regisztrálása eseménykezelőként mindkét gombhoz
        m_SaveBtn.SetHandler(this);
        m_CancelBtn.SetHandler(this);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_SaveBtn)
        {
            Save();
            return true;  // Felhasznált
        }

        if (w == m_CancelBtn)
        {
            Cancel();
            return true;
        }

        return false;  // Nem a mi widgetünk, átengedés
    }
}
```

Egyetlen kezelő példány több widgetre is regisztrálható. Az esemény metóduson belül hasonlítsd össze a `w` értéket (az eseményt generáló widget) a gyorsítótárazott referenciáiddal, hogy meghatározd, melyik widgettel történt az interakció.

---

## Gyakori események részletesen

### OnClick

```mermaid
sequenceDiagram
    participant User as User Input
    participant Widget as ButtonWidget
    participant Handler as ScriptedWidgetEventHandler
    participant Logic as Your Module

    User->>Widget: Mouse Click
    Widget->>Handler: OnClick(widget, x, y, button)
    Handler->>Logic: Process button action

    alt Return true
        Logic-->>Handler: Event consumed (stops propagation)
    else Return false
        Handler-->>Widget: Event passed to parent widget
    end
```
```c
bool OnClick(Widget w, int x, int y, int button)
```

Akkor aktiválódik, amikor egy `ButtonWidget`-re kattintanak (az egeret a widget felett elengedik).

- `w` -- A kattintott widget
- `x, y` -- Egérkurzor pozíció (képernyő pixelek)
- `button` -- Egérgomb index: `0` = bal, `1` = jobb, `2` = középső

```c
override bool OnClick(Widget w, int x, int y, int button)
{
    if (button != 0) return false;  // Csak bal kattintás kezelése

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

A `SliderWidget`, `CheckBoxWidget`, `EditBoxWidget` és más érték-alapú widgetek váltják ki, amikor az értékük változik.

- `w` -- A widget, amelynek az értéke megváltozott
- `finished` -- Csúszkáknál: `true`, amikor a felhasználó elengedi a csúszka fogantyúját. Szerkesztőmezőknél: `true`, amikor az Enter billentyűt megnyomják.

```c
override bool OnChange(Widget w, int x, int y, bool finished)
{
    if (w == m_VolumeSlider)
    {
        SliderWidget slider = SliderWidget.Cast(w);
        float value = slider.GetCurrent();

        // Csak akkor alkalmazd, amikor a felhasználó befejezi a húzást
        if (finished)
        {
            ApplyVolume(value);
        }
        else
        {
            // Előnézet húzás közben
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
            // A felhasználó megnyomta az Entert
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

Akkor aktiválódik, amikor az egérkurzor belép egy widget területére vagy elhagyja azt. Az `OnMouseLeave` metódus `enterW` paramétere az a widget, amelyre a kurzor átkerült.

Gyakori használat: hover effektek.

```c
override bool OnMouseEnter(Widget w, int x, int y)
{
    if (w == m_HoverPanel)
    {
        m_HoverPanel.SetColor(ARGB(255, 80, 130, 200));  // Kiemelés
        return true;
    }
    return false;
}

override bool OnMouseLeave(Widget w, Widget enterW, int x, int y)
{
    if (w == m_HoverPanel)
    {
        m_HoverPanel.SetColor(ARGB(255, 50, 50, 50));  // Alapértelmezett
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

Akkor aktiválódik, amikor egy widget megkapja vagy elveszíti a billentyűzet fókuszt. Fontos a szerkesztőmezőknél és más szövegbeviteli widgeteknél.

### OnMouseWheel

```c
bool OnMouseWheel(Widget w, int x, int y, int wheel)
```

Akkor aktiválódik, amikor az egérgörgőt görgetik egy widget felett. A `wheel` pozitív felfelé görgetéskor, negatív lefelé görgetéskor.

### OnKeyDown / OnKeyUp / OnKeyPress

```c
bool OnKeyDown(Widget w, int x, int y, int key)
bool OnKeyUp(Widget w, int x, int y, int key)
bool OnKeyPress(Widget w, int x, int y, int key)
```

Billentyűzet események. A `key` paraméter a `KeyCode` konstansoknak felel meg (pl. `KeyCode.KC_ESCAPE`, `KeyCode.KC_RETURN`).

### OnDrag / OnDrop / OnDropReceived

```c
bool OnDrag(Widget w, int x, int y)
bool OnDrop(Widget w, int x, int y, Widget receiver)
bool OnDropReceived(Widget w, int x, int y, Widget receiver)
```

Húzd és ejtsd események. A widgetnek `draggable 1` beállítással kell rendelkeznie a layoutjában (vagy `WidgetFlags.DRAGGABLE` kódban beállítva).

- `OnDrag` -- A felhasználó elkezdte húzni a `w` widgetet
- `OnDrop` -- A `w` widget el lett ejtve; a `receiver` az alatta lévő widget
- `OnDropReceived` -- A `w` widget fogadott egy ejtést; a `receiver` az ejtett widget

### OnItemSelected

```c
bool OnItemSelected(Widget w, int x, int y, int row, int column,
                     int oldRow, int oldColumn)
```

A `TextListboxWidget` váltja ki, amikor egy sort kiválasztanak.

---

## Vanilla WidgetEventHandler (visszahívás regisztráció)

A DayZ vanilla kódja egy alternatív mintát használ: a `WidgetEventHandler`-t, egy singletont, amely nevezett visszahívási függvényekhez irányítja az eseményeket. Ez gyakran használatos a vanilla menükben.

```c
WidgetEventHandler handler = WidgetEventHandler.GetInstance();

// Esemény visszahívások regisztrálása függvénynév alapján
handler.RegisterOnClick(myButton, this, "OnMyButtonClick");
handler.RegisterOnMouseEnter(myWidget, this, "OnHoverStart");
handler.RegisterOnMouseLeave(myWidget, this, "OnHoverEnd");
handler.RegisterOnDoubleClick(myWidget, this, "OnDoubleClick");

// Összes visszahívás regisztrációjának törlése egy widgethez
handler.UnregisterWidget(myWidget);
```

### SetHandler() vs. WidgetEventHandler

| Szempont | SetHandler() | WidgetEventHandler |
|---|---|---|
| Minta | Virtuális metódusok felülírása | Nevezett visszahívások regisztrálása |
| Kezelő widgetenként | Egy kezelő widgetenként | Több visszahívás eseményenként |
| Használja | DabsFramework, Expansion, egyéni modok | Vanilla DayZ menük |
| Rugalmasság | Minden eseményt egy osztályban kell kezelni | Különböző célpontok regisztrálhatók különböző eseményekhez |
| Takarítás | Implicit a kezelő megsemmisítésekor | `UnregisterWidget()` hívása szükséges |

Új modokhoz a `SetHandler()` a `ScriptedWidgetEventHandler`-rel az ajánlott megközelítés.

---

## Teljes példa: Interaktív gomb panel

Egy panel három gombbal, amelyek hover-kor színt váltanak és kattintásra műveletet hajtanak végre:

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

        // Kezelő regisztrálása az összes interaktív widgetre
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

## Eseménykezelési bevált gyakorlatok

1. **Mindig adj vissza `true`-t, amikor kezelsz egy eseményt** -- Ellenkező esetben az esemény továbbterjed a szülő widgetekhez és nem kívánt viselkedést válthat ki.

2. **Adj vissza `false`-t az általad nem kezelt eseményekre** -- Ez lehetővé teszi a szülő widgetek számára az esemény feldolgozását.

3. **Gyorsítótárazd a widget referenciákat** -- Ne hívj `FindAnyWidget()`-et az eseménykezelőkben. Keresd ki a widgeteket egyszer a konstruktorban és tárold a referenciákat.

4. **Null-ellenőrizd a widgeteket az eseményekben** -- A `w` widget általában érvényes, de a védelmi kódolás megakadályozza az összeomlásokat.

5. **Takaríts kezelőket** -- Egy panel megsemmisítésekor szüntesd meg a gyökér widget csatolását. Ha `WidgetEventHandler`-t használsz, hívd az `UnregisterWidget()` metódust.

6. **Használd bölcsen a `finished` paramétert** -- Csúszkáknál csak akkor alkalmazz költséges műveleteket, amikor a `finished` értéke `true` (a felhasználó elengedte a fogantyút). Használd a nem befejezett eseményeket előnézethez.

7. **Halaszd el a nehéz munkát** -- Ha egy eseménykezelőnek költséges számítást kell végeznie, használd a `CallLater` hívást az elhalasztáshoz:

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

## Következő lépések

- [3.7 Stílusok, betűtípusok és képek](07-styles-fonts.md) -- Vizuális stílusok stílusokkal, betűtípusokkal és imageset referenciákkal
- [3.5 Programozott widget létrehozás](05-programmatic-widgets.md) -- Eseményeket generáló widgetek létrehozása
