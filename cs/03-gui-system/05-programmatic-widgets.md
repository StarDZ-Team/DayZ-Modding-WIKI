# Kapitola 3.5: Programatické vytváření widgetů

[Domů](../../README.md) | [<< Předchozí: Kontejnerové widgety](04-containers.md) | **Programatické vytváření widgetů** | [Další: Zpracování událostí >>](06-event-handling.md)

---

Zatímco `.layout` soubory jsou standardním způsobem definování struktury UI, můžete widgety také vytvářet a konfigurovat zcela z kódu. To je užitečné pro dynamická UI, procedurálně generované prvky a situace, kdy rozložení není známo v době kompilace.

---

## Dva přístupy

DayZ poskytuje dva způsoby vytváření widgetů v kódu:

1. **`CreateWidgets()`** -- Načte `.layout` soubor a vytvoří instanci jeho stromu widgetů
2. **`CreateWidget()`** -- Vytvoří jeden widget s explicitními parametry

Obě metody se volají na `WorkspaceWidget` získaném z `GetGame().GetWorkspace()`.

---

## CreateWidgets() -- Ze souborů layoutu

Nejběžnější přístup. Načte `.layout` soubor a vytvoří celý strom widgetů, připojí ho k rodičovskému widgetu.

```c
Widget root = GetGame().GetWorkspace().CreateWidgets(
    "MyMod/gui/layouts/MyPanel.layout",   // Cesta k souboru layoutu
    parentWidget                            // Rodičovský widget (nebo null pro kořen)
);
```

Vrácený `Widget` je kořenový widget ze souboru layoutu. Poté můžete najít potomkovské widgety podle názvu:

```c
TextWidget title = TextWidget.Cast(root.FindAnyWidget("TitleText"));
title.SetText("Hello World");

ButtonWidget closeBtn = ButtonWidget.Cast(root.FindAnyWidget("CloseButton"));
```

### Vytváření více instancí

Běžný vzor je vytváření více instancí šablony layoutu (např. položek seznamu):

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

    container.Update();  // Vynucení přepočtu rozložení
}
```

---

## CreateWidget() -- Programatické vytváření

Vytvoří jeden widget s explicitním typem, pozicí, velikostí, příznaky a rodičem.

```c
Widget w = GetGame().GetWorkspace().CreateWidget(
    FrameWidgetTypeID,      // Konstanta ID typu widgetu
    0,                       // Pozice X
    0,                       // Pozice Y
    100,                     // Šířka
    100,                     // Výška
    WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE | WidgetFlags.EXACTPOS,
    -1,                      // Barva (ARGB celé číslo, -1 = bílá/výchozí)
    0,                       // Pořadí řazení (priorita)
    parentWidget             // Rodičovský widget
);
```

### Parametry

| Parametr | Typ | Popis |
|---|---|---|
| typeID | int | Konstanta typu widgetu (např. `FrameWidgetTypeID`, `TextWidgetTypeID`) |
| x | float | Pozice X (proporcionální nebo pixelová podle příznaků) |
| y | float | Pozice Y |
| width | float | Šířka widgetu |
| height | float | Výška widgetu |
| flags | int | Bitový OR konstant `WidgetFlags` |
| color | int | Barva ARGB celé číslo (-1 pro výchozí/bílou) |
| sort | int | Z-pořadí (vyšší se vykresluje navrch) |
| parent | Widget | Rodičovský widget pro připojení |

### ID typů widgetů

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

Příznaky řídí chování widgetu při programatickém vytváření. Kombinujte je bitovým OR (`|`).

| Příznak | Efekt |
|---|---|
| `WidgetFlags.VISIBLE` | Widget je na začátku viditelný |
| `WidgetFlags.IGNOREPOINTER` | Widget nepřijímá události myši |
| `WidgetFlags.DRAGGABLE` | Widget lze přetáhnout |
| `WidgetFlags.EXACTSIZE` | Hodnoty velikosti jsou v pixelech (ne proporcionální) |
| `WidgetFlags.EXACTPOS` | Hodnoty pozice jsou v pixelech (ne proporcionální) |
| `WidgetFlags.SOURCEALPHA` | Použít zdrojový alfa kanál |
| `WidgetFlags.BLEND` | Povolit alfa prolínání |
| `WidgetFlags.FLIPU` | Převrátit texturu horizontálně |
| `WidgetFlags.FLIPV` | Převrátit texturu vertikálně |

Běžné kombinace příznaků:

```c
// Viditelný, pixelová velikost, pixelová pozice, alfa prolínání
int FLAGS_EXACT = WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE | WidgetFlags.EXACTPOS | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;

// Viditelný, proporcionální, neinteraktivní
int FLAGS_OVERLAY = WidgetFlags.VISIBLE | WidgetFlags.IGNOREPOINTER | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;
```

Po vytvoření můžete příznaky dynamicky měnit:

```c
widget.SetFlags(WidgetFlags.VISIBLE);          // Přidání příznaku
widget.ClearFlags(WidgetFlags.IGNOREPOINTER);  // Odebrání příznaku
int flags = widget.GetFlags();                  // Čtení aktuálních příznaků
```

---

## Nastavení vlastností po vytvoření

Po vytvoření widgetu pomocí `CreateWidget()` ho potřebujete nakonfigurovat. Widget je vrácen jako základní typ `Widget`, takže musíte přetypovat na specifický typ.

### Nastavení názvu

```c
Widget w = GetGame().GetWorkspace().CreateWidget(TextWidgetTypeID, ...);
w.SetName("MyTextWidget");
```

Názvy jsou důležité pro vyhledávání `FindAnyWidget()` a ladění.

### Nastavení textu

```c
TextWidget tw = TextWidget.Cast(w);
tw.SetText("Hello World");
tw.SetTextExactSize(16);           // Velikost písma v pixelech
tw.SetOutline(1, ARGB(255, 0, 0, 0));  // 1px černý obrys
```

### Nastavení barvy

Barvy v DayZ používají formát ARGB (Alfa, Červená, Zelená, Modrá), zabalený do jednoho 32-bitového celého čísla:

```c
// Použití pomocné funkce ARGB (0-255 na kanál)
int red    = ARGB(255, 255, 0, 0);       // Neprůhledná červená
int green  = ARGB(255, 0, 255, 0);       // Neprůhledná zelená
int blue   = ARGB(200, 0, 0, 255);       // Poloprůhledná modrá
int black  = ARGB(255, 0, 0, 0);         // Neprůhledná černá
int white  = ARGB(255, 255, 255, 255);   // Neprůhledná bílá (stejné jako -1)

// Použití float verze (0.0-1.0 na kanál)
int color = ARGBF(1.0, 0.5, 0.25, 0.1);

// Rozložení barvy zpět na floaty
float a, r, g, b;
InverseARGBF(color, a, r, g, b);

// Aplikace na jakýkoli widget
widget.SetColor(ARGB(255, 100, 150, 200));
widget.SetAlpha(0.5);  // Přepsání pouze alfy
```

Hexadecimální formát `0xAARRGGBB` je také běžný:

```c
int color = 0xFF4B77BE;   // A=255, R=75, G=119, B=190
widget.SetColor(color);
```

### Nastavení obsluhy událostí

```c
widget.SetHandler(myEventHandler);  // Instance ScriptedWidgetEventHandler
```

### Nastavení uživatelských dat

Připojení libovolných dat k widgetu pro pozdější získání:

```c
widget.SetUserData(myDataObject);  // Musí dědit z Managed

// Pozdější získání:
Managed data;
widget.GetUserData(data);
MyDataClass myData = MyDataClass.Cast(data);
```

---

## Úklid widgetů

Widgety, které již nejsou potřeba, musí být řádně vyčištěny, aby nedocházelo k únikům paměti.

### Unlink()

Odstraní widget od jeho rodiče a zničí ho (a všechny jeho potomky):

```c
widget.Unlink();
```

Po zavolání `Unlink()` se reference na widget stane neplatnou. Nastavte ji na `null`:

```c
widget.Unlink();
widget = null;
```

### Odstranění všech potomků

Pro vyčištění kontejnerového widgetu od všech jeho potomků:

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

**Důležité:** Musíte získat `GetSibling()` **před** zavoláním `Unlink()`, protože odpojení zneplatní řetězec sourozenců widgetu.

### Kontroly null

Vždy kontrolujte widgety na null před jejich použitím. `FindAnyWidget()` vrací `null`, pokud widget není nalezen, a operace přetypování vrací `null`, pokud typ neodpovídá:

```c
TextWidget tw = TextWidget.Cast(root.FindAnyWidget("MaybeExists"));
if (tw)
{
    tw.SetText("Found it");
}
```

---

## Navigace hierarchií widgetů

Navigace stromem widgetů z kódu:

```c
Widget parent = widget.GetParent();           // Rodičovský widget
Widget firstChild = widget.GetChildren();     // První potomek
Widget nextSibling = widget.GetSibling();     // Další sourozenec
Widget found = widget.FindAnyWidget("Name");  // Rekurzivní vyhledávání podle názvu

string name = widget.GetName();               // Název widgetu
string typeName = widget.GetTypeName();       // např. "TextWidget"
```

Pro iteraci všech potomků:

```c
Widget child = parent.GetChildren();
while (child)
{
    // Zpracování potomka
    Print("Child: " + child.GetName());

    child = child.GetSibling();
}
```

Pro rekurzivní iteraci všech potomků:

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

## Kompletní příklad: Vytvoření dialogu v kódu

Zde je kompletní příklad, který vytváří jednoduchý informační dialog zcela v kódu, bez jakéhokoli souboru layoutu:

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

        // Kořenový rámec: 400x200 pixelů, vycentrovaný na obrazovce
        m_Root = workspace.CreateWidget(
            FrameWidgetTypeID, 0, 0, 400, 200, FLAGS_EXACT,
            ARGB(230, 30, 30, 30), 100, null);

        // Ruční centrování
        int sw, sh;
        GetScreenSize(sw, sh);
        m_Root.SetScreenPos((sw - 400) / 2, (sh - 200) / 2);

        // Text titulku: celá šířka, 30px vysoký, nahoře
        Widget titleW = workspace.CreateWidget(
            TextWidgetTypeID, 0, 0, 400, 30, FLAGS_EXACT,
            ARGB(255, 100, 160, 220), 0, m_Root);
        m_Title = TextWidget.Cast(titleW);
        m_Title.SetText(title);

        // Text zprávy: pod titulkem, vyplní zbývající prostor
        Widget msgW = workspace.CreateWidget(
            TextWidgetTypeID, 10, 40, 380, 110, FLAGS_EXACT,
            ARGB(255, 200, 200, 200), 0, m_Root);
        m_Message = TextWidget.Cast(msgW);
        m_Message.SetText(message);

        // Tlačítko zavřít: 80x30 pixelů, oblast vpravo dole
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

// Použití:
SimpleCodeDialog dialog = new SimpleCodeDialog("Alert", "Server restart in 5 minutes.");
```

---

## Sdružování widgetů (pooling)

Vytváření a ničení widgetů každý snímek způsobuje problémy s výkonem. Místo toho udržujte pool znovupoužitelných widgetů:

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

        // Předběžné vytvoření widgetů
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

**Kdy použít sdružování:**
- Seznamy, které se často aktualizují (killfeed, chat, seznam hráčů)
- Mřížky s dynamickým obsahem (inventář, tržiště)
- Jakékoli UI, které vytváří/ničí 10+ widgetů za sekundu

**Kdy NEPOUŽÍVAT sdružování:**
- Statické panely vytvořené jednou
- Dialogy zobrazované/skrývané (stačí použít Show/Hide)

---

## Soubory layoutu vs. programatické vytváření: Kdy použít co

| Situace | Doporučení |
|---|---|
| Statická struktura UI | Soubor layoutu (`.layout`) |
| Složité stromy widgetů | Soubor layoutu |
| Dynamický počet položek | `CreateWidgets()` ze šablony layoutu |
| Jednoduché runtime prvky (ladící text, značky) | `CreateWidget()` |
| Rychlé prototypování | `CreateWidget()` |
| Produkční UI modu | Soubor layoutu + konfigurace kódem |

V praxi většina modů používá **soubory layoutu** pro strukturu a **kód** pro naplnění daty, zobrazování/skrývání prvků a zpracování událostí. Čistě programatická UI jsou vzácná mimo ladící nástroje.

---

## Další kroky

- [3.6 Zpracování událostí](06-event-handling.md) -- Zpracování kliknutí, změn a událostí myši
- [3.7 Styly, písma a obrázky](07-styles-fonts.md) -- Vizuální stylování a obrazové zdroje

---

## Teorie vs. praxe

| Koncept | Teorie | Realita |
|---------|--------|---------|
| `CreateWidget()` vytvoří jakýkoli typ widgetu | Všechna TypeID fungují s `CreateWidget()` | `ScrollWidget` a `WrapSpacerWidget` vytvořené programaticky často potřebují ruční nastavení příznaků (`EXACTSIZE`, rozměry), které soubory layoutu řeší automaticky |
| `Unlink()` uvolní veškerou paměť | Widget a potomci jsou zničeni | Reference držené ve skriptových proměnných se stávají visícími. Vždy nastavte reference widgetů na `null` po `Unlink()`, jinak riskujete pády |
| `SetHandler()` směruje všechny události | Jeden handler přijímá všechny události widgetu | Handler přijímá události pouze pro widgety, na kterých bylo zavoláno `SetHandler(this)`. Potomci nedědí handler od svého rodiče |
| `CreateWidgets()` z layoutu je okamžité | Layout se načítá synchronně | Velké layouty s mnoha vnořenými widgety způsobují výkyv snímku. Přednačtěte layouty během načítacích obrazovek, ne během hraní |
| Proporcionální rozměry (0.0-1.0) se škálují k rodiči | Hodnoty jsou relativní k rozměrům rodiče | Bez příznaku `EXACTSIZE` jsou i hodnoty `CreateWidget()` jako `100` zpracovány jako proporcionální (rozsah 0-1), což způsobí, že widgety vyplní celého rodiče |

---

## Kompatibilita a dopad

- **Více modů:** Programaticky vytvořené widgety jsou soukromé pro vytvářející mod. Na rozdíl od `modded class` nehrozí riziko kolize, pokud dva mody nepřipojí widgety ke stejnému vanilla rodičovskému widgetu podle názvu.
- **Výkon:** Každé volání `CreateWidgets()` parsuje soubor layoutu z disku. Kešujte kořenový widget a zobrazujte/skrývejte ho, místo aby se layout znovu vytvářel pokaždé, když se UI otevře.

---

## Pozorováno v reálných modech

| Vzor | Mod | Detail |
|---------|-----|--------|
| Šablona layoutu + naplnění kódem | COT, Expansion | Načte `.layout` šablonu řádku přes `CreateWidgets()` pro každou položku seznamu, poté naplní přes `FindAnyWidget()` |
| Sdružování widgetů pro killfeed | Colorful UI | Předem vytvoří 20 widgetů záznamů feedu, zobrazuje/skrývá je místo vytváření a ničení |
| Čistě kódové dialogy | Ladící/admin nástroje | Jednoduché upozorňovací dialogy postavené zcela pomocí `CreateWidget()` pro vyhnutí se distribuci extra `.layout` souborů |
| `SetHandler(this)` na každém interaktivním potomkovi | VPP Admin Tools | Iteruje všechna tlačítka po načtení layoutu a volá `SetHandler()` na každém individuálně |
| Vzor `Unlink()` + null | DabsFramework | Metoda `Close()` každého dialogu konzistentně volá `m_Root.Unlink(); m_Root = null;` |
