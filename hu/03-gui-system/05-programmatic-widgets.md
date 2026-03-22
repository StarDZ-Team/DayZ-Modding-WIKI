# 3.5. fejezet: Programozott widget létrehozás

[Kezdőlap](../../README.md) | [<< Előző: Konténer widgetek](04-containers.md) | **Programozott widget létrehozás** | [Következő: Események kezelése >>](06-event-handling.md)

---

Bár a `.layout` fájlok a szabványos módja az UI struktúra definiálásának, widgeteket teljes egészében kódból is létrehozhatsz és konfigurálhatsz. Ez hasznos dinamikus UI-khoz, procedurálisan generált elemekhez, és olyan helyzetekhez, ahol az elrendezés fordítási időben nem ismert.

---

## Két megközelítés

A DayZ két módot kínál widgetek kódból történő létrehozásához:

1. **`CreateWidgets()`** -- `.layout` fájl betöltése és widget fa példányosítása
2. **`CreateWidget()`** -- Egyetlen widget létrehozása explicit paraméterekkel

Mindkét metódust a `GetGame().GetWorkspace()` által kapott `WorkspaceWidget`-en hívjuk meg.

---

## CreateWidgets() -- Layout fájlokból

A leggyakoribb megközelítés. Betölti a `.layout` fájlt és létrehozza a teljes widget fát, csatolva egy szülő widgethez.

```c
Widget root = GetGame().GetWorkspace().CreateWidgets(
    "MyMod/gui/layouts/MyPanel.layout",   // A layout fájl elérési útja
    parentWidget                            // Szülő widget (vagy null a gyökérhez)
);
```

A visszaadott `Widget` a layout fájl gyökér widgetje. Ezután név szerint kereshetsz gyermek widgeteket:

```c
TextWidget title = TextWidget.Cast(root.FindAnyWidget("TitleText"));
title.SetText("Hello World");

ButtonWidget closeBtn = ButtonWidget.Cast(root.FindAnyWidget("CloseButton"));
```

### Több példány létrehozása

Gyakori minta egy layout sablon több példányának létrehozása (pl. lista elemek):

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

    container.Update();  // Elrendezés újraszámolásának kényszerítése
}
```

---

## CreateWidget() -- Programozott létrehozás

Egyetlen widgetet hoz létre explicit típussal, pozícióval, mérettel, jelzőkkel és szülővel.

```c
Widget w = GetGame().GetWorkspace().CreateWidget(
    FrameWidgetTypeID,      // Widget típus azonosító konstans
    0,                       // X pozíció
    0,                       // Y pozíció
    100,                     // Szélesség
    100,                     // Magasság
    WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE | WidgetFlags.EXACTPOS,
    -1,                      // Szín (ARGB egész, -1 = fehér/alapértelmezett)
    0,                       // Rendezési sorrend (prioritás)
    parentWidget             // Szülő widget
);
```

### Paraméterek

| Paraméter | Típus | Leírás |
|---|---|---|
| typeID | int | Widget típus konstans (pl. `FrameWidgetTypeID`, `TextWidgetTypeID`) |
| x | float | X pozíció (arányos vagy pixel a jelzők alapján) |
| y | float | Y pozíció |
| width | float | Widget szélesség |
| height | float | Widget magasság |
| flags | int | `WidgetFlags` konstansok bitenkénti VAGY kapcsolata |
| color | int | ARGB szín egész (-1 alapértelmezett/fehér) |
| sort | int | Z-sorrend (magasabb felülre renderelődik) |
| parent | Widget | Szülő widget a csatoláshoz |

### Widget típus azonosítók

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

A jelzők szabályozzák a widget viselkedését programozott létrehozáskor. Kombinálhatók bitenkénti VAGY (`|`) operátorral.

| Jelző | Hatás |
|---|---|
| `WidgetFlags.VISIBLE` | A widget láthatóan indul |
| `WidgetFlags.IGNOREPOINTER` | A widget nem fogad egér eseményeket |
| `WidgetFlags.DRAGGABLE` | A widget húzható |
| `WidgetFlags.EXACTSIZE` | A méretértékek pixelben vannak (nem arányos) |
| `WidgetFlags.EXACTPOS` | A pozícióértékek pixelben vannak (nem arányos) |
| `WidgetFlags.SOURCEALPHA` | Forrás alfa csatorna használata |
| `WidgetFlags.BLEND` | Alfa keverés engedélyezése |
| `WidgetFlags.FLIPU` | Textúra vízszintes tükrözése |
| `WidgetFlags.FLIPV` | Textúra függőleges tükrözése |

Gyakori jelző kombinációk:

```c
// Látható, pixel-méretezésű, pixel-pozíciójú, alfa-kevert
int FLAGS_EXACT = WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE | WidgetFlags.EXACTPOS | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;

// Látható, arányos, nem interaktív
int FLAGS_OVERLAY = WidgetFlags.VISIBLE | WidgetFlags.IGNOREPOINTER | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;
```

Létrehozás után dinamikusan módosíthatók a jelzők:

```c
widget.SetFlags(WidgetFlags.VISIBLE);          // Jelző hozzáadása
widget.ClearFlags(WidgetFlags.IGNOREPOINTER);  // Jelző eltávolítása
int flags = widget.GetFlags();                  // Aktuális jelzők olvasása
```

---

## Tulajdonságok beállítása létrehozás után

Miután a `CreateWidget()` hívással létrehoztál egy widgetet, konfigurálnod kell. A widget az alap `Widget` típusként tér vissza, ezért a specifikus típusra kell konvertálnod.

### Név beállítása

```c
Widget w = GetGame().GetWorkspace().CreateWidget(TextWidgetTypeID, ...);
w.SetName("MyTextWidget");
```

A nevek fontosak a `FindAnyWidget()` keresésekhez és a hibakereséshez.

### Szöveg beállítása

```c
TextWidget tw = TextWidget.Cast(w);
tw.SetText("Hello World");
tw.SetTextExactSize(16);           // Betűméret pixelben
tw.SetOutline(1, ARGB(255, 0, 0, 0));  // 1px fekete körvonal
```

### Szín beállítása

A DayZ-ben a színek ARGB formátumot használnak (Alfa, Piros, Zöld, Kék), egyetlen 32-bites egész számba csomagolva:

```c
// Az ARGB segédfüggvény használata (0-255 csatornánként)
int red    = ARGB(255, 255, 0, 0);       // Átlátszatlan piros
int green  = ARGB(255, 0, 255, 0);       // Átlátszatlan zöld
int blue   = ARGB(200, 0, 0, 255);       // Félig átlátszó kék
int black  = ARGB(255, 0, 0, 0);         // Átlátszatlan fekete
int white  = ARGB(255, 255, 255, 255);   // Átlátszatlan fehér (ugyanaz mint -1)

// A float verzió használata (0.0-1.0 csatornánként)
int color = ARGBF(1.0, 0.5, 0.25, 0.1);

// Szín visszabontása float értékekre
float a, r, g, b;
InverseARGBF(color, a, r, g, b);

// Alkalmazás bármilyen widgetre
widget.SetColor(ARGB(255, 100, 150, 200));
widget.SetAlpha(0.5);  // Csak az alfa felülírása
```

A hexadecimális `0xAARRGGBB` formátum is gyakori:

```c
int color = 0xFF4B77BE;   // A=255, R=75, G=119, B=190
widget.SetColor(color);
```

### Eseménykezelő beállítása

```c
widget.SetHandler(myEventHandler);  // ScriptedWidgetEventHandler példány
```

### Felhasználói adat beállítása

Tetszőleges adat csatolása egy widgethez későbbi lekérdezéshez:

```c
widget.SetUserData(myDataObject);  // Managed osztályból kell öröklődnie

// Később lekérdezés:
Managed data;
widget.GetUserData(data);
MyDataClass myData = MyDataClass.Cast(data);
```

---

## Widget takarítás

A már nem szükséges widgeteket megfelelően takarítani kell a memóriaszivárgás elkerülése érdekében.

### Unlink()

Eltávolít egy widgetet a szülőjéből és megsemmisíti (az összes gyermekével együtt):

```c
widget.Unlink();
```

Az `Unlink()` hívása után a widget referencia érvénytelenné válik. Állítsd `null`-ra:

```c
widget.Unlink();
widget = null;
```

### Összes gyermek eltávolítása

Egy konténer widget összes gyermekének törlése:

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

**Fontos:** A `GetSibling()` metódust az `Unlink()` hívása **előtt** kell meghívnod, mert a leválasztás érvényteleníti a widget testvérláncolatát.

### Null ellenőrzések

Mindig ellenőrizd a null értéket a widgetek használata előtt. A `FindAnyWidget()` `null`-t ad vissza, ha a widget nem található, és a típuskonverziós műveletek `null`-t adnak vissza, ha a típus nem egyezik:

```c
TextWidget tw = TextWidget.Cast(root.FindAnyWidget("MaybeExists"));
if (tw)
{
    tw.SetText("Found it");
}
```

---

## Widget hierarchia navigáció

A widget fa navigálása kódból:

```c
Widget parent = widget.GetParent();           // Szülő widget
Widget firstChild = widget.GetChildren();     // Első gyermek
Widget nextSibling = widget.GetSibling();     // Következő testvér
Widget found = widget.FindAnyWidget("Name");  // Rekurzív keresés név alapján

string name = widget.GetName();               // Widget neve
string typeName = widget.GetTypeName();       // Pl. "TextWidget"
```

Összes gyermek bejárása:

```c
Widget child = parent.GetChildren();
while (child)
{
    // Gyermek feldolgozása
    Print("Child: " + child.GetName());

    child = child.GetSibling();
}
```

Összes leszármazott rekurzív bejárása:

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

## Teljes példa: Párbeszédablak létrehozása kódban

Íme egy teljes példa, amely teljesen kódból hoz létre egy egyszerű információs párbeszédablakot, layout fájl nélkül:

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

        // Gyökér keret: 400x200 pixel, képernyő közepén
        m_Root = workspace.CreateWidget(
            FrameWidgetTypeID, 0, 0, 400, 200, FLAGS_EXACT,
            ARGB(230, 30, 30, 30), 100, null);

        // Manuális középre igazítás
        int sw, sh;
        GetScreenSize(sw, sh);
        m_Root.SetScreenPos((sw - 400) / 2, (sh - 200) / 2);

        // Cím szöveg: teljes szélesség, 30px magas, felül
        Widget titleW = workspace.CreateWidget(
            TextWidgetTypeID, 0, 0, 400, 30, FLAGS_EXACT,
            ARGB(255, 100, 160, 220), 0, m_Root);
        m_Title = TextWidget.Cast(titleW);
        m_Title.SetText(title);

        // Üzenet szöveg: a cím alatt, kitölti a maradék teret
        Widget msgW = workspace.CreateWidget(
            TextWidgetTypeID, 10, 40, 380, 110, FLAGS_EXACT,
            ARGB(255, 200, 200, 200), 0, m_Root);
        m_Message = TextWidget.Cast(msgW);
        m_Message.SetText(message);

        // Bezárás gomb: 80x30 pixel, jobb alsó terület
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

// Használat:
SimpleCodeDialog dialog = new SimpleCodeDialog("Alert", "Server restart in 5 minutes.");
```

---

## Layout fájlok vs. programozott: Mikor melyiket használjuk

| Helyzet | Ajánlás |
|---|---|
| Statikus UI struktúra | Layout fájl (`.layout`) |
| Összetett widget fák | Layout fájl |
| Dinamikus számú elem | `CreateWidgets()` sablon layoutból |
| Egyszerű futásidejű elemek (debug szöveg, jelölők) | `CreateWidget()` |
| Gyors prototípus készítés | `CreateWidget()` |
| Éles mod UI | Layout fájl + kód konfiguráció |

A gyakorlatban a legtöbb mod **layout fájlokat** használ a struktúrához és **kódot** az adatok feltöltéséhez, elemek megjelenítéséhez/elrejtéséhez és események kezeléséhez. A tisztán programozott UI-k ritkák a hibakeresési eszközökön kívül.

---

## Következő lépések

- [3.6 Események kezelése](06-event-handling.md) -- Kattintások, változások és egér események kezelése
- [3.7 Stílusok, betűtípusok és képek](07-styles-fonts.md) -- Vizuális stílusok és kép erőforrások
