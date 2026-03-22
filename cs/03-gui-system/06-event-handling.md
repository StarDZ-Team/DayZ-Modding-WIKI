# Kapitola 3.6: Zpracování událostí

[Domů](../README.md) | [<< Předchozí: Programatické vytváření widgetů](05-programmatic-widgets.md) | **Zpracování událostí** | [Další: Styly, písma a obrázky >>](07-styles-fonts.md)

---

Widgety generují události, když s nimi uživatel interaguje -- klikání na tlačítka, psaní do vstupních polí, pohyb myší, přetahování prvků. Tato kapitola pokrývá, jak tyto události přijímat a zpracovávat.

---

## ScriptedWidgetEventHandler

Třída `ScriptedWidgetEventHandler` je základem veškerého zpracování událostí widgetů v DayZ. Poskytuje přepisovací metody pro každou možnou událost widgetu.

Pro přijímání událostí z widgetu vytvořte třídu, která rozšiřuje `ScriptedWidgetEventHandler`, přepište metody událostí, které vás zajímají, a připojte handler k widgetu pomocí `SetHandler()`.

### Kompletní seznam metod událostí

```c
class ScriptedWidgetEventHandler
{
    // Události kliknutí
    bool OnClick(Widget w, int x, int y, int button);
    bool OnDoubleClick(Widget w, int x, int y, int button);

    // Události výběru
    bool OnSelect(Widget w, int x, int y);
    bool OnItemSelected(Widget w, int x, int y, int row, int column,
                         int oldRow, int oldColumn);

    // Události fokusu
    bool OnFocus(Widget w, int x, int y);
    bool OnFocusLost(Widget w, int x, int y);

    // Události myši
    bool OnMouseEnter(Widget w, int x, int y);
    bool OnMouseLeave(Widget w, Widget enterW, int x, int y);
    bool OnMouseWheel(Widget w, int x, int y, int wheel);
    bool OnMouseButtonDown(Widget w, int x, int y, int button);
    bool OnMouseButtonUp(Widget w, int x, int y, int button);

    // Události klávesnice
    bool OnKeyDown(Widget w, int x, int y, int key);
    bool OnKeyUp(Widget w, int x, int y, int key);
    bool OnKeyPress(Widget w, int x, int y, int key);

    // Události změny (posuvníky, checkboxy, vstupní pole)
    bool OnChange(Widget w, int x, int y, bool finished);

    // Události přetažení
    bool OnDrag(Widget w, int x, int y);
    bool OnDragging(Widget w, int x, int y, Widget receiver);
    bool OnDraggingOver(Widget w, int x, int y, Widget receiver);
    bool OnDrop(Widget w, int x, int y, Widget receiver);
    bool OnDropReceived(Widget w, int x, int y, Widget receiver);

    // Události ovladače (gamepad)
    bool OnController(Widget w, int control, int value);

    // Události rozložení
    bool OnResize(Widget w, int x, int y);
    bool OnChildAdd(Widget w, Widget child);
    bool OnChildRemove(Widget w, Widget child);

    // Ostatní
    bool OnUpdate(Widget w);
    bool OnModalResult(Widget w, int x, int y, int code, int result);
}
```

### Návratová hodnota: Spotřebováno vs. předáno dál

Každý handler události vrací `bool`:

- **`return true;`** -- Událost je **spotřebována**. Žádný jiný handler ji nepřijme. Událost přestane propagovat nahoru hierarchií widgetů.
- **`return false;`** -- Událost je **předána dál** handleru rodičovského widgetu (pokud existuje).

Toto je kritické pro budování vrstvených UI. Například handler kliknutí na tlačítko by měl vrátit `true`, aby zabránil kliknutí v aktivování panelu za ním.

---

## Registrace handlerů pomocí SetHandler()

Nejjednodušší způsob zpracování událostí je zavolat `SetHandler()` na widgetu:

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

        // Registrace této třídy jako handleru událostí pro obě tlačítka
        m_SaveBtn.SetHandler(this);
        m_CancelBtn.SetHandler(this);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_SaveBtn)
        {
            Save();
            return true;  // Spotřebováno
        }

        if (w == m_CancelBtn)
        {
            Cancel();
            return true;
        }

        return false;  // Není náš widget, předat dál
    }
}
```

Jedna instance handleru může být registrována na více widgetech. Uvnitř metody události porovnejte `w` (widget, který vygeneroval událost) s vašimi kešovanými referencemi pro určení, se kterým widgetem bylo interagováno.

---

## Podrobnosti o běžných událostech

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

Vyvolá se, když je kliknuto na `ButtonWidget` (uvolnění myši nad widgetem).

- `w` -- Kliknutý widget
- `x, y` -- Pozice kurzoru myši (pixely obrazovky)
- `button` -- Index tlačítka myši: `0` = levé, `1` = pravé, `2` = střední

```c
override bool OnClick(Widget w, int x, int y, int button)
{
    if (button != 0) return false;  // Zpracovat pouze levý klik

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

Vyvolá se `SliderWidget`, `CheckBoxWidget`, `EditBoxWidget` a dalšími widgety založenými na hodnotách, když se jejich hodnota změní.

- `w` -- Widget, jehož hodnota se změnila
- `finished` -- Pro posuvníky: `true` když uživatel uvolní jezdec. Pro vstupní pole: `true` při stisknutí Enter.

```c
override bool OnChange(Widget w, int x, int y, bool finished)
{
    if (w == m_VolumeSlider)
    {
        SliderWidget slider = SliderWidget.Cast(w);
        float value = slider.GetCurrent();

        // Aplikovat pouze po dokončení tažení
        if (finished)
        {
            ApplyVolume(value);
        }
        else
        {
            // Náhled během tažení
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
            // Uživatel stiskl Enter
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

Vyvolá se, když kurzor myši vstoupí nebo opustí hranice widgetu. Parametr `enterW` v `OnMouseLeave` je widget, na který se kurzor přesunul.

Běžné použití: efekty při najetí.

```c
override bool OnMouseEnter(Widget w, int x, int y)
{
    if (w == m_HoverPanel)
    {
        m_HoverPanel.SetColor(ARGB(255, 80, 130, 200));  // Zvýraznění
        return true;
    }
    return false;
}

override bool OnMouseLeave(Widget w, Widget enterW, int x, int y)
{
    if (w == m_HoverPanel)
    {
        m_HoverPanel.SetColor(ARGB(255, 50, 50, 50));  // Výchozí
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

Vyvolá se, když widget získá nebo ztratí fokus klávesnice. Důležité pro vstupní pole a další widgety textového vstupu.

### OnMouseWheel

```c
bool OnMouseWheel(Widget w, int x, int y, int wheel)
```

Vyvolá se, když se kolečko myši posouvá nad widgetem. `wheel` je kladné pro posun nahoru, záporné pro posun dolů.

### OnKeyDown / OnKeyUp / OnKeyPress

```c
bool OnKeyDown(Widget w, int x, int y, int key)
bool OnKeyUp(Widget w, int x, int y, int key)
bool OnKeyPress(Widget w, int x, int y, int key)
```

Události klávesnice. Parametr `key` odpovídá konstantám `KeyCode` (např. `KeyCode.KC_ESCAPE`, `KeyCode.KC_RETURN`).

### OnDrag / OnDrop / OnDropReceived

```c
bool OnDrag(Widget w, int x, int y)
bool OnDrop(Widget w, int x, int y, Widget receiver)
bool OnDropReceived(Widget w, int x, int y, Widget receiver)
```

Události přetažení. Widget musí mít `draggable 1` ve svém layoutu (nebo `WidgetFlags.DRAGGABLE` nastaveno v kódu).

- `OnDrag` -- Uživatel začal přetahovat widget `w`
- `OnDrop` -- Widget `w` byl upuštěn; `receiver` je widget pod ním
- `OnDropReceived` -- Widget `w` přijal upuštění; `receiver` je upuštěný widget

### OnItemSelected

```c
bool OnItemSelected(Widget w, int x, int y, int row, int column,
                     int oldRow, int oldColumn)
```

Vyvolá se `TextListboxWidget`, když je vybrán řádek.

---

## Vanilla WidgetEventHandler (registrace callbacků)

Vanilla kód DayZ používá alternativní vzor: `WidgetEventHandler`, singleton, který směruje události na pojmenované callback funkce. Toto se běžně používá ve vanilla menu.

```c
WidgetEventHandler handler = WidgetEventHandler.GetInstance();

// Registrace callbacků událostí podle názvu funkce
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

// Odregistrace všech callbacků pro widget
handler.UnregisterWidget(myWidget);
```

Signatury callback funkcí musí odpovídat typu události:

```c
void OnMyButtonClick(Widget w, int x, int y, int button)
{
    // Zpracování kliknutí
}

void OnHoverStart(Widget w, int x, int y)
{
    // Zpracování najetí myší
}

void OnHoverEnd(Widget w, Widget enterW, int x, int y)
{
    // Zpracování odjetí myší
}
```

### SetHandler() vs. WidgetEventHandler

| Aspekt | SetHandler() | WidgetEventHandler |
|---|---|---|
| Vzor | Přepsání virtuálních metod | Registrace pojmenovaných callbacků |
| Handler na widget | Jeden handler na widget | Více callbacků na událost |
| Používá | DabsFramework, Expansion, vlastní mody | Vanilla DayZ menu |
| Flexibilita | Všechny události musí být zpracovány v jedné třídě | Lze registrovat různé cíle pro různé události |
| Úklid | Implicitní při zničení handleru | Musíte volat `UnregisterWidget()` |

Pro nové mody je doporučený přístup `SetHandler()` s `ScriptedWidgetEventHandler`.

---

## Kompletní příklad: Interaktivní panel s tlačítky

Panel se třemi tlačítky, která mění barvu při najetí a provádějí akce při kliknutí:

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

        // Registrace tohoto handleru na všech interaktivních widgetech
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

## Osvědčené postupy pro zpracování událostí

1. **Vždy vracejte `true`, když událost zpracujete** -- Jinak se událost propaguje k rodičovským widgetům a může vyvolat nechtěné chování.

2. **Vracejte `false` pro události, které nezpracováváte** -- To umožní rodičovským widgetům událost zpracovat.

3. **Kešujte reference na widgety** -- Nevolejte `FindAnyWidget()` uvnitř handlerů událostí. Vyhledejte widgety jednou v konstruktoru a uložte reference.

4. **Kontrolujte widgety na null v událostech** -- Widget `w` je obvykle platný, ale defenzivní kódování předchází pádům.

5. **Uklízejte handlery** -- Při ničení panelu odpojte kořenový widget. Pokud používáte `WidgetEventHandler`, volejte `UnregisterWidget()`.

6. **Používejte parametr `finished` rozumně** -- Pro posuvníky aplikujte náročné operace pouze když `finished` je `true` (uživatel uvolnil jezdec). Události s `finished == false` používejte pro náhled.

7. **Odkládejte náročnou práci** -- Pokud handler události potřebuje provést náročný výpočet, použijte `CallLater` pro odložení:

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

## Teorie vs. praxe

> Co říká dokumentace versus jak věci skutečně fungují za běhu.

| Koncept | Teorie | Realita |
|---------|--------|---------|
| `OnClick` se vyvolá na jakémkoli widgetu | Jakýkoli widget může přijímat události kliknutí | Pouze `ButtonWidget` spolehlivě vyvolává `OnClick`. Pro jiné typy widgetů použijte místo toho `OnMouseButtonDown` / `OnMouseButtonUp` |
| `SetHandler()` nahradí handler | Nastavení nového handleru nahradí starý | Správně, ale starý handler není upozorněn. Pokud držel zdroje, unikají. Vždy ukliďte před výměnou handlerů |
| Parametr `finished` v `OnChange` | `true` když uživatel dokončí interakci | Pro `EditBoxWidget` je `finished` `true` pouze při klávese Enter -- přechod tabulátorem nebo kliknutí jinam NENASTAVÍ `finished` na `true` |
| Propagace návratové hodnoty události | `return false` předá událost rodiči | Události propagují nahoru stromem widgetů, ne k sourozeneckým widgetům. `return false` od potomka jde k jeho rodiči, nikdy k sousednímu widgetu |
| Názvy callbacků `WidgetEventHandler` | Jakýkoli název funkce funguje | Funkce musí existovat na cílovém objektu v době registrace. Pokud je název funkce špatně napsán, registrace tiše uspěje, ale callback se nikdy nevyvolá |

---

## Kompatibilita a dopad

- **Více modů:** `SetHandler()` povoluje pouze jeden handler na widget. Pokud mod A i mod B oba zavolají `SetHandler()` na stejném vanilla widgetu (přes `modded class`), poslední vyhraje a druhý tiše přestane přijímat události. Pro aditivní kompatibilitu více modů použijte `WidgetEventHandler.RegisterOnClick()`.
- **Výkon:** Handlery událostí se spouštějí na hlavním vláknu hry. Pomalý handler `OnClick` (např. souborové I/O nebo složité výpočty) způsobuje viditelné záseky snímků. Odkládejte náročnou práci pomocí `GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater()`.
- **Verze:** API `ScriptedWidgetEventHandler` je stabilní od DayZ 1.0. Singleton callbacky `WidgetEventHandler` jsou vanilla vzory přítomné od raných verzí Enforce Scriptu a zůstávají beze změn.

---

## Pozorováno v reálných modech

| Vzor | Mod | Detail |
|---------|-----|--------|
| Jeden handler pro celý panel | COT, VPP Admin Tools | Jedna podtřída `ScriptedWidgetEventHandler` zpracovává všechna tlačítka v panelu, rozesílá porovnáváním `w` s kešovanými referencemi widgetů |
| `WidgetEventHandler.RegisterOnClick` pro modulární tlačítka | Expansion Market | Každé dynamicky vytvořené tlačítko kupovat/prodat registruje svůj vlastní callback, umožňující funkce handleru pro jednotlivé položky |
| `OnMouseEnter` / `OnMouseLeave` pro tooltipy při najetí | DayZ Editor | Události najetí spouštějí widgety tooltipů, které sledují pozici kurzoru přes `GetMousePos()` |
| Odložení `CallLater` v `OnClick` | DabsFramework | Náročné operace (uložení konfigurace, odeslání RPC) jsou odloženy o 0ms přes `CallLater` pro vyhnutí se blokování UI vlákna během události |

---

## Další kroky

- [3.7 Styly, písma a obrázky](07-styles-fonts.md) -- Vizuální stylování pomocí stylů, písem a odkazů na imagesety
- [3.5 Programatické vytváření widgetů](05-programmatic-widgets.md) -- Vytváření widgetů, které generují události
