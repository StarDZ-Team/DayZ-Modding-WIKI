# 3.8. fejezet: Dialógusok és modális ablakok

[Főoldal](../README.md) | [<< Előző: Stílusok, betűtípusok és képek](07-styles-fonts.md) | **Dialógusok és modális ablakok** | [Következő: Valós mod UI minták >>](09-real-mod-patterns.md)

---

A dialógusok ideiglenes átfedő ablakok, amelyek felhasználói interakciót igényelnek -- megerősítő kérdések, figyelmeztető üzenetek, beviteli űrlapok és beállítási panelek. Ez a fejezet a beépített dialógus rendszert, a kézi dialógus mintákat, a layout struktúrát, a fókusz kezelést és a gyakori buktatókat tárgyalja.

---

## Modális vs. nem modális

Két alapvető típusú dialógus létezik:

- **Modális** -- Blokkolja a dialógus mögötti tartalommal való összes interakciót. A felhasználónak válaszolnia kell (megerősítés, mégsem, bezárás), mielőtt bármi mást tehetne. Példák: kilépés megerősítés, törlés figyelmeztetés, átnevezés kérdés.
- **Nem modális** -- Lehetővé teszi a felhasználó számára, hogy interakcióba lépjen a dialógus mögötti tartalommal, amíg az nyitva marad. Példák: információs panelek, beállítás ablakok, eszközpaletták.

A DayZ-ben a különbséget az határozza meg, hogy zárolod-e a játék bevitelt a dialógus megnyitásakor. Egy modális dialógus meghívja a `ChangeGameFocus(1)`-et és megjeleníti a kurzort; egy nem modális dialógus kihagyhatja ezt, vagy kapcsoló megközelítést használhat.

---

## UIScriptedMenu -- A beépített rendszer

A `UIScriptedMenu` a motor szintű alaposztály a DayZ összes menü képernyőjéhez. Integrálódik a `UIManager` menü veremmel, automatikusan kezeli a bevitel zárolást, és életciklus hook-okat biztosít. A vanilla DayZ a játékon belüli menühöz, kilépés dialógushoz, újraéledés dialógushoz, opciók menühöz és sok máshoz használja.

### Osztályhierarchia

```
UIMenuPanel          (alap: menü verem, Close(), almenü kezelés)
  UIScriptedMenu     (szkriptelt menük: Init(), OnShow(), OnHide(), Update())
```

### Minimális UIScriptedMenu dialógus

```c
class MyDialog extends UIScriptedMenu
{
    protected ButtonWidget m_BtnConfirm;
    protected ButtonWidget m_BtnCancel;
    protected TextWidget   m_MessageText;

    override Widget Init()
    {
        layoutRoot = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/GUI/layouts/my_dialog.layout");

        m_BtnConfirm  = ButtonWidget.Cast(
            layoutRoot.FindAnyWidget("BtnConfirm"));
        m_BtnCancel   = ButtonWidget.Cast(
            layoutRoot.FindAnyWidget("BtnCancel"));
        m_MessageText = TextWidget.Cast(
            layoutRoot.FindAnyWidget("MessageText"));

        return layoutRoot;
    }

    override void OnShow()
    {
        super.OnShow();
        // a super.OnShow() meghívja a LockControls()-t, amely kezeli:
        //   GetGame().GetInput().ChangeGameFocus(1);
        //   GetGame().GetUIManager().ShowUICursor(true);
    }

    override void OnHide()
    {
        super.OnHide();
        // a super.OnHide() meghívja az UnlockControls()-t, amely kezeli:
        //   GetGame().GetInput().ChangeGameFocus(-1);
        //   GetGame().GetUIManager().ShowUICursor(false);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        super.OnClick(w, x, y, button);

        if (w == m_BtnConfirm)
        {
            // Akció végrehajtása
            Close();
            return true;
        }

        if (w == m_BtnCancel)
        {
            Close();
            return true;
        }

        return false;
    }

    override void Update(float timeslice)
    {
        super.Update(timeslice);

        // ESC a bezáráshoz
        if (GetUApi().GetInputByID(UAUIBack).LocalPress())
        {
            Close();
        }
    }
}
```

### Megnyitás és bezárás

```c
// Megnyitás -- a menü létrehozása és a UIManager verembe helyezése
MyDialog dialog = new MyDialog();
GetGame().GetUIManager().ShowScriptedMenu(dialog, null);

// Bezárás kívülről
GetGame().GetUIManager().HideScriptedMenu(dialog);

// Bezárás a dialógus osztályon belülről
Close();
```

A `ShowScriptedMenu()` a menüt a motor menü verembe helyezi, kiváltja az `Init()`-et, majd az `OnShow()`-t. A `Close()` kiváltja az `OnHide()`-ot, eltávolítja a veremből, és megsemmisíti a widget fát.

### Fő életciklus metódusok

| Metódus | Mikor hívódik | Tipikus használat |
|---------|--------------|-------------------|
| `Init()` | Egyszer, a menü létrehozásakor | Widgetek létrehozása, referenciák gyorsítótárazása |
| `OnShow()` | Miután a menü láthatóvá válik | Bevitel zárolása, időzítők indítása |
| `OnHide()` | Miután a menü el van rejtve | Bevitel feloldása, időzítők leállítása |
| `Update(float timeslice)` | Minden képkockában, amíg látható | Bevitel lekérdezés (ESC billentyű), animációk |
| `Cleanup()` | Megsemmisítés előtt | Erőforrások felszabadítása |

### LockControls / UnlockControls

A `UIScriptedMenu` beépített metódusokat biztosít, amelyeket az `OnShow()` és `OnHide()` automatikusan meghív:

```c
// A UIScriptedMenu-n belül (motor kód, egyszerűsítve):
void LockControls()
{
    g_Game.GetInput().ChangeGameFocus(1, INPUT_DEVICE_MOUSE);
    g_Game.GetUIManager().ShowUICursor(true);
    g_Game.GetInput().ChangeGameFocus(1, INPUT_DEVICE_KEYBOARD);
    g_Game.GetInput().ChangeGameFocus(1, INPUT_DEVICE_GAMEPAD);
}

void UnlockControls()
{
    g_Game.GetInput().ChangeGameFocus(-1, INPUT_DEVICE_MOUSE);
    g_Game.GetInput().ChangeGameFocus(-1, INPUT_DEVICE_KEYBOARD);
    g_Game.GetInput().ChangeGameFocus(-1, INPUT_DEVICE_GAMEPAD);
    // A kurzor láthatósága attól függ, hogy létezik-e szülő menü
}
```

Mivel a `UIScriptedMenu` automatikusan kezeli a fókuszt az `OnShow()`/`OnHide()` metódusokban, ritkán kell magadnak meghívnod a `ChangeGameFocus()`-t, ha ezt az alaposztályt használod. Egyszerűen hívd meg a `super.OnShow()`-t és `super.OnHide()`-ot.

---

## Beépített ShowDialog (natív üzenetdobozok)

A motor natív dialógus rendszert biztosít egyszerű megerősítő kérdésekhez. Platform-megfelelő dialógusdobozt renderel layout fájl nélkül.

### Használat

```c
// Igen/Nem megerősítő dialógus megjelenítése
const int MY_DIALOG_ID = 500;

g_Game.GetUIManager().ShowDialog(
    "Confirm Action",                  // felirat
    "Are you sure you want to do this?", // szöveg
    MY_DIALOG_ID,                      // egyéni ID a dialógus azonosításához
    DBT_YESNO,                         // gomb konfiguráció
    DBB_YES,                           // alapértelmezett gomb
    DMT_QUESTION,                      // ikon típus
    this                               // kezelő (megkapja az OnModalResult-ot)
);
```

### Az eredmény fogadása

A kezelő (az utolsó argumentumként átadott `UIScriptedMenu`) az eredményt az `OnModalResult`-on keresztül kapja:

```c
override bool OnModalResult(Widget w, int x, int y, int code, int result)
{
    if (code == MY_DIALOG_ID)
    {
        if (result == DBB_YES)
        {
            PerformAction();
        }
        // DBB_NO azt jelenti, hogy a felhasználó elutasította -- nem csinálunk semmit
        return true;
    }

    return false;
}
```

### Konstansok

**Gomb konfigurációk** (`DBT_` -- DialogBoxType):

| Konstans | Megjelenő gombok |
|----------|-----------------|
| `DBT_OK` | OK |
| `DBT_YESNO` | Igen, Nem |
| `DBT_YESNOCANCEL` | Igen, Nem, Mégsem |

**Gomb azonosítók** (`DBB_` -- DialogBoxButton):

| Konstans | Érték | Jelentés |
|----------|-------|---------|
| `DBB_NONE` | 0 | Nincs alapértelmezett |
| `DBB_OK` | 1 | OK gomb |
| `DBB_YES` | 2 | Igen gomb |
| `DBB_NO` | 3 | Nem gomb |
| `DBB_CANCEL` | 4 | Mégsem gomb |

**Üzenet típusok** (`DMT_` -- DialogMessageType):

| Konstans | Ikon |
|----------|------|
| `DMT_NONE` | Nincs ikon |
| `DMT_INFO` | Információ |
| `DMT_WARNING` | Figyelmeztetés |
| `DMT_QUESTION` | Kérdőjel |
| `DMT_EXCLAMATION` | Felkiáltójel |

### Mikor használd a ShowDialog-ot

Használd a `ShowDialog()`-ot egyszerű riasztásokhoz és megerősítésekhez, amelyek nem igényelnek egyéni stílust. Megbízható és automatikusan kezeli a fókuszt/kurzort. Márkázott vagy összetett dialógusokhoz (egyéni layout, beviteli mezők, több opció) készítsd el a saját dialógus osztályodat.

---

## Kézi dialógus minta (UIScriptedMenu nélkül)

Ha olyan dialógusra van szükséged, amely nem része a motor menü veremnek -- például egy felugró ablak egy meglévő panelen belül -- a `ScriptedWidgetEventHandler`-t bővítsd a `UIScriptedMenu` helyett. Ez teljes kontrollt ad, de kézi fókusz és életciklus kezelést igényel.

### Alapminta

```c
class SimplePopup : ScriptedWidgetEventHandler
{
    protected Widget       m_Root;
    protected ButtonWidget m_BtnOk;
    protected ButtonWidget m_BtnCancel;
    protected TextWidget   m_Message;

    void Show(string message)
    {
        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/GUI/layouts/simple_popup.layout");
        m_Root.SetHandler(this);

        m_BtnOk     = ButtonWidget.Cast(m_Root.FindAnyWidget("BtnOk"));
        m_BtnCancel = ButtonWidget.Cast(m_Root.FindAnyWidget("BtnCancel"));
        m_Message   = TextWidget.Cast(m_Root.FindAnyWidget("Message"));

        m_Message.SetText(message);

        // Játék bevitel zárolása, hogy a játékos ne tudjon mozogni/lőni
        GetGame().GetInput().ChangeGameFocus(1);
        GetGame().GetUIManager().ShowUICursor(true);
    }

    void Hide()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = null;
        }

        // Játék bevitel visszaállítása -- EGYEZNIE KELL a Show() +1-ével
        GetGame().GetInput().ChangeGameFocus(-1);
        GetGame().GetUIManager().ShowUICursor(false);
    }

    void ~SimplePopup()
    {
        Hide();
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_BtnOk)
        {
            OnConfirm();
            Hide();
            return true;
        }

        if (w == m_BtnCancel)
        {
            Hide();
            return true;
        }

        return false;
    }

    protected void OnConfirm()
    {
        // Felülírás alosztályokban vagy visszahívás beállítása
    }
}
```

### VPP-stílusú felugró ablak (OnWidgetScriptInit minta)

A VPP Admin Tools és más modok az `OnWidgetScriptInit()` metódust használják felugró ablakok inicializálásához. A widgetet egy szülő hozza létre, és a szkript osztályt a layout fájl `scriptclass` attribútumán keresztül csatolják:

```c
class MyPopup : ScriptedWidgetEventHandler
{
    protected Widget       m_Root;
    protected ButtonWidget m_BtnClose;
    protected ButtonWidget m_BtnSave;
    protected EditBoxWidget m_NameInput;

    void OnWidgetScriptInit(Widget w)
    {
        m_Root = w;
        m_Root.SetHandler(this);

        m_BtnClose  = ButtonWidget.Cast(m_Root.FindAnyWidget("BtnClose"));
        m_BtnSave   = ButtonWidget.Cast(m_Root.FindAnyWidget("BtnSave"));
        m_NameInput = EditBoxWidget.Cast(m_Root.FindAnyWidget("NameInput"));

        // Dialógus más widgetek fölé emelése
        m_Root.SetSort(1024, true);
    }

    void ~MyPopup()
    {
        if (m_Root)
            m_Root.Unlink();
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_BtnClose)
        {
            delete this;
            return true;
        }

        if (w == m_BtnSave)
        {
            string name = m_NameInput.GetText();
            if (name != "")
            {
                SaveName(name);
                delete this;
            }
            return true;
        }

        return false;
    }

    protected void SaveName(string name)
    {
        // Bevitel feldolgozása
    }
}
```

A szülő a layout widget gyermekként való létrehozásával hozza létre a felugró ablakot:

```c
Widget popup = GetGame().GetWorkspace().CreateWidgets(
    "MyMod/GUI/layouts/popup.layout", parentWidget);
```

A motor automatikusan meghívja az `OnWidgetScriptInit()` metódust a layout `scriptclass` attribútumában megadott szkript osztályon.

---

## Dialógus layout struktúra

Egy dialógus layout jellemzően három réteggel rendelkezik: egy teljes képernyős gyökér a kattintás elfogáshoz, egy félig átlátszó átfedés a háttér tompításához, és a középre igazított dialógus panel.

### Layout fájl példa

```
FrameWidget "DialogRoot" {
    size 1 1 0 0        // Teljes képernyő
    halign fill
    valign fill

    // Félig átlátszó háttér átfedés
    ImageWidget "Overlay" {
        size 1 1 0 0
        halign fill
        valign fill
        color "0 0 0 180"
    }

    // Középre igazított dialógus panel
    FrameWidget "DialogPanel" {
        halign center
        valign center
        hexactsize 1
        vexactsize 1
        hexactpos  1
        vexactpos  1
        size 0 0 500 300   // 500x300 pixeles dialógus

        // Címsor
        TextWidget "TitleText" {
            halign fill
            size 1 0 0 30
            text "Dialog Title"
            font "gui/fonts/MetronBook24"
        }

        // Tartalom terület
        MultilineTextWidget "ContentText" {
            position 0 0 0 35
            size 1 0 0 200
            halign fill
        }

        // Gombsor az alján
        FrameWidget "ButtonRow" {
            valign bottom
            halign fill
            size 1 0 0 40

            ButtonWidget "BtnConfirm" {
                halign left
                size 0 0 120 35
                text "Confirm"
            }

            ButtonWidget "BtnCancel" {
                halign right
                size 0 0 120 35
                text "Cancel"
            }
        }
    }
}
```

### Fő layout elvek

1. **Teljes képernyős gyökér** -- A legkülső widget lefedi az egész képernyőt, hogy a dialóguson kívüli kattintások elfogásra kerüljenek.
2. **Félig átlátszó átfedés** -- Egy `ImageWidget` vagy panel alfa csatornával (pl. `color "0 0 0 180"`) tompítja a hátteret, vizuálisan jelezve a modális állapotot.
3. **Középre igazított panel** -- Használd a `halign center` és `valign center` beállításokat pontos pixeles méretekkel a kiszámítható méretekhez.
4. **Gomb igazítás** -- Helyezd a gombokat egy vízszintes konténerbe a dialógus panel alján.

---

## Megerősítő dialógus minta

Egy újrafelhasználható megerősítő dialógus, amely címet, üzenetet és visszahívást fogad el. Ez a leggyakoribb dialógus minta a DayZ modokban.

### Megvalósítás

```c
class ConfirmDialog : ScriptedWidgetEventHandler
{
    protected Widget          m_Root;
    protected TextWidget      m_TitleText;
    protected MultilineTextWidget m_ContentText;
    protected ButtonWidget    m_BtnYes;
    protected ButtonWidget    m_BtnNo;

    protected Class           m_CallbackTarget;
    protected string          m_CallbackFunc;

    void ConfirmDialog(string title, string message,
                       Class callbackTarget, string callbackFunc)
    {
        m_CallbackTarget = callbackTarget;
        m_CallbackFunc   = callbackFunc;

        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/GUI/layouts/confirm_dialog.layout");
        m_Root.SetHandler(this);

        m_TitleText   = TextWidget.Cast(
            m_Root.FindAnyWidget("TitleText"));
        m_ContentText = MultilineTextWidget.Cast(
            m_Root.FindAnyWidget("ContentText"));
        m_BtnYes      = ButtonWidget.Cast(
            m_Root.FindAnyWidget("BtnYes"));
        m_BtnNo       = ButtonWidget.Cast(
            m_Root.FindAnyWidget("BtnNo"));

        m_TitleText.SetText(title);
        m_ContentText.SetText(message);

        // Dialógus renderelése más UI fölé
        m_Root.SetSort(1024, true);

        GetGame().GetInput().ChangeGameFocus(1);
        GetGame().GetUIManager().ShowUICursor(true);
    }

    void ~ConfirmDialog()
    {
        if (m_Root)
            m_Root.Unlink();
    }

    protected void SendResult(bool confirmed)
    {
        GetGame().GetInput().ChangeGameFocus(-1);
        GetGame().GetUIManager().ShowUICursor(false);

        // A visszahívás függvény meghívása a cél objektumon
        GetGame().GameScript.CallFunction(
            m_CallbackTarget, m_CallbackFunc, null, confirmed);

        // Takarítás -- törlés halasztása a problémák elkerüléséhez
        GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(
            DestroyDialog, 0, false);
    }

    protected void DestroyDialog()
    {
        delete this;
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_BtnYes)
        {
            SendResult(true);
            return true;
        }

        if (w == m_BtnNo)
        {
            SendResult(false);
            return true;
        }

        return false;
    }
}
```

### Használat

```c
// A hívó osztályban:
void AskDeleteItem()
{
    new ConfirmDialog(
        "Delete Item",
        "Are you sure you want to delete this item?",
        this,
        "OnDeleteConfirmed"
    );
}

void OnDeleteConfirmed(bool confirmed)
{
    if (confirmed)
    {
        DeleteSelectedItem();
    }
}
```

A visszahívás a `GameScript.CallFunction()` metódust használja, amely név alapján hív meg egy függvényt a cél objektumon. Ez a szabványos módja a DayZ modok dialógus visszahívásainak, mivel az Enforce Script nem támogatja a closure-öket vagy a delegátokat.

---

## Fókusz kezelés

A fókusz kezelés a dialógus megvalósítás legkritikusabb aspektusa. A DayZ **referencia-számlált** fókusz rendszert használ -- minden `ChangeGameFocus(1)` hívásnak egyensúlyban kell lennie egy `ChangeGameFocus(-1)` hívással.

### Hogyan működik

```c
// Fókusz számláló növelése -- a játék bevitel elnyomva, amíg a számláló > 0
GetGame().GetInput().ChangeGameFocus(1);

// Az egér kurzor megjelenítése
GetGame().GetUIManager().ShowUICursor(true);

// ... dialógus interakció ...

// Fókusz számláló csökkentése -- a játék bevitel folytatódik, amikor a számláló eléri a 0-t
GetGame().GetInput().ChangeGameFocus(-1);

// Kurzor elrejtése (csak ha nincs más menü, amely igényli)
GetGame().GetUIManager().ShowUICursor(false);
```

### Szabályok

1. **Minden +1-nek kell legyen egy párosított -1.** Ha meghívod a `ChangeGameFocus(1)`-et a `Show()`-ban, meg kell hívnod a `ChangeGameFocus(-1)`-et a `Hide()`-ban, kivétel nélkül.

2. **Hívd meg a -1-et még hiba útvonalakon is.** Ha a dialógus váratlanul megsemmisül (játékos meghal, szerver lecsatlakozás), a destruktornak továbbra is csökkentenie kell. Helyezz el takarítást a destruktorban biztonsági hálóként.

3. **A UIScriptedMenu ezt automatikusan kezeli.** Ha a `UIScriptedMenu`-t bővíted és meghívod a `super.OnShow()` / `super.OnHide()` metódusokat, a fókusz kezelve van. Csak a `ScriptedWidgetEventHandler` használatakor kezeld kézzel.

4. **Az eszközönkénti fókusz opcionális.** A motor támogatja az eszközönkénti fókusz zárolást (`INPUT_DEVICE_MOUSE`, `INPUT_DEVICE_KEYBOARD`, `INPUT_DEVICE_GAMEPAD`). A legtöbb mod dialógushoz egyetlen `ChangeGameFocus(1)` (eszköz argumentum nélkül) minden bevitelt zárol.

5. **A ResetGameFocus() egy végső megoldás.** A számlálót nullára kényszeríti. Csak legfelső szintű takarításkor használd (pl. egy teljes admin eszköz bezárásakor), soha nem egyedi dialógus osztályokon belül.

### Mi romolhat el

| Hiba | Tünet |
|------|-------|
| Elfelejtett `ChangeGameFocus(-1)` bezáráskor | A játékos nem tud mozogni, lőni vagy interakcióba lépni a dialógus bezárása után |
| Kétszer hívott `-1` | A fókusz számláló negatívba megy; a következő megnyíló menü nem fogja megfelelően zárolni a bevitelt |
| Elfelejtett `ShowUICursor(false)` | Az egér kurzor véglegesen látható marad |
| `ShowUICursor(false)` hívás, amikor a szülő menü még nyitva van | A kurzor eltűnik, miközben a szülő menü még aktív |

---

## Z-sorrend és rétegezés

Amikor egy dialógus meglévő UI fölött nyílik meg, a többi fölött kell renderelődnie. A DayZ két mechanizmust biztosít:

### Widget rendezési sorrend

```c
// Widget emelése minden testvér fölé (rendezési érték 1024)
m_Root.SetSort(1024, true);
```

A `SetSort()` metódus beállítja a renderelési prioritást. Magasabb értékek felül renderelődnek. A második paraméter (`true`) rekurzívan alkalmazza a gyermekekre. A VPP Admin Tools minden dialógusdobozhoz `SetSort(1024, true)`-t használ.

### Bevált gyakorlatok

- **Átfedés háttér**: Használj magas rendezési értéket (pl. 998) a félig átlátszó háttérhez.
- **Dialógus panel**: Használj magasabb rendezési értéket (pl. 999 vagy 1024) magához a dialógushoz.
- **Egymásra helyezett dialógusok**: Ha a rendszered támogatja a beágyazott dialógusokat, növeld a rendezési értéket minden új dialógus réteghez.

---

## Gyakori minták

### Kapcsoló panel (megnyitás/bezárás ugyanazzal a billentyűvel)

```c
class TogglePanel : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected bool   m_IsVisible;

    void Toggle()
    {
        if (m_IsVisible)
            Hide();
        else
            Show();
    }

    protected void Show()
    {
        if (!m_Root)
        {
            m_Root = GetGame().GetWorkspace().CreateWidgets(
                "MyMod/GUI/layouts/toggle_panel.layout");
            m_Root.SetHandler(this);
        }

        m_Root.Show(true);
        m_IsVisible = true;
        GetGame().GetInput().ChangeGameFocus(1);
        GetGame().GetUIManager().ShowUICursor(true);
    }

    protected void Hide()
    {
        if (m_Root)
            m_Root.Show(false);

        m_IsVisible = false;
        GetGame().GetInput().ChangeGameFocus(-1);
        GetGame().GetUIManager().ShowUICursor(false);
    }
}
```

### ESC a bezáráshoz

```c
// A UIScriptedMenu Update()-jén belül:
override void Update(float timeslice)
{
    super.Update(timeslice);

    if (GetUApi().GetInputByID(UAUIBack).LocalPress())
    {
        Close();
    }
}

// A ScriptedWidgetEventHandler-en belül (nincs Update ciklus):
// Külső frissítési forrásból kell lekérdezni, vagy OnKeyDown-t használni:
override bool OnKeyDown(Widget w, int x, int y, int key)
{
    if (key == KeyCode.KC_ESCAPE)
    {
        Hide();
        return true;
    }
    return false;
}
```

### Kattintás kívülre a bezáráshoz

Tedd a teljes képernyős átfedő widgetet kattinthatóvá. Kattintáskor zárd be a dialógust:

```c
class OverlayDialog : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected Widget m_Overlay;
    protected Widget m_Panel;

    void Show()
    {
        m_Root    = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/GUI/layouts/overlay_dialog.layout");
        m_Overlay = m_Root.FindAnyWidget("Overlay");
        m_Panel   = m_Root.FindAnyWidget("DialogPanel");

        // Kezelő regisztrálása mind az átfedés, mind a panel widgetekre
        m_Root.SetHandler(this);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        // Ha a felhasználó az átfedésre kattintott (nem a panelre), bezárás
        if (w == m_Overlay)
        {
            Hide();
            return true;
        }

        return false;
    }
}
```

---

## Gyakori hibák

### 1. Játék fókusz nem visszaállítása bezáráskor

**A probléma:** A játékos nem tud mozogni, lőni vagy interakcióba lépni a dialógus bezárása után.

```c
// HELYTELEN -- nincs fókusz visszaállítás
void CloseDialog()
{
    m_Root.Unlink();
    m_Root = null;
    // A fókusz számláló még mindig növelt!
}

// HELYES -- mindig csökkentsd
void CloseDialog()
{
    m_Root.Unlink();
    m_Root = null;
    GetGame().GetInput().ChangeGameFocus(-1);
    GetGame().GetUIManager().ShowUICursor(false);
}
```

### 2. Widgetek nem leválasztása bezáráskor

**A probléma:** A widget fa a memóriában marad, az események továbbra is kiváltódnak, memóriaszivárgások halmozódnak.

```c
// HELYTELEN -- csak elrejtés
void Hide()
{
    m_Root.Show(false);  // A widget továbbra is létezik és memóriát fogyaszt
}

// HELYES -- az unlink megsemmisíti a widget fát
void Hide()
{
    if (m_Root)
    {
        m_Root.Unlink();
        m_Root = null;
    }
}
```

Ha ugyanazt a dialógust ismételten meg kell jeleníteni/elrejteni, a widget megtartása és `Show(true/false)` használata rendben van -- csak győződj meg, hogy `Unlink()`-et használsz a destruktorban.

### 3. Dialógus más UI mögött renderelődik

**A probléma:** A dialógus láthatatlan vagy részben el van rejtve, mert más widgeteknek magasabb renderelési prioritásuk van.

**A javítás:** Használd a `SetSort()` metódust a dialógus minden fölé emeléséhez:

```c
m_Root.SetSort(1024, true);
```

### 4. Több dialógus halmozott fókusz változásai

**A probléma:** Az A dialógus megnyitása (+1), majd a B dialógus (+1), majd B bezárása (-1) -- a fókusz számláló még mindig 1, tehát a bevitel még mindig zárolva van, bár a felhasználó nem lát dialógust.

**A javítás:** Kövesd nyomon, hogy minden dialógus példány zárolta-e a fókuszt, és csak akkor csökkentsd, ha zárolta:

```c
class SafeDialog : ScriptedWidgetEventHandler
{
    protected bool m_HasFocus;

    void LockFocus()
    {
        if (!m_HasFocus)
        {
            GetGame().GetInput().ChangeGameFocus(1);
            GetGame().GetUIManager().ShowUICursor(true);
            m_HasFocus = true;
        }
    }

    void UnlockFocus()
    {
        if (m_HasFocus)
        {
            GetGame().GetInput().ChangeGameFocus(-1);
            GetGame().GetUIManager().ShowUICursor(false);
            m_HasFocus = false;
        }
    }

    void ~SafeDialog()
    {
        UnlockFocus();
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = null;
        }
    }
}
```

---

## Összefoglalás

| Megközelítés | Alaposztály | Fókusz kezelés | Legjobb ehhez |
|-------------|-------------|----------------|---------------|
| Motor menü verem | `UIScriptedMenu` | Automatikus a `LockControls`/`UnlockControls` révén | Teljes képernyős menük, fő dialógusok |
| Natív dialógus | `ShowDialog()` | Automatikus | Egyszerű Igen/Nem/OK kérdések |
| Kézi felugró ablak | `ScriptedWidgetEventHandler` | Kézi `ChangeGameFocus` | Panel belüli felugró ablakok, egyéni dialógusok |
| Lebegő ablak | `UIScriptedWindow` | Szülő menün keresztül | Eszköz ablakok menü mellett |

Az aranyszabály: **minden `ChangeGameFocus(1)` hívásnak egyeznie kell egy `ChangeGameFocus(-1)` hívással.** Helyezd a fókusz takarítást a destruktorodba biztonsági hálóként, mindig használj `Unlink()`-et a widgetekre, ha végeztél, és használd a `SetSort()`-ot annak biztosítására, hogy a dialógusod felül renderelődjön.

---

## Következő lépések

- [3.6 Eseménykezelés](06-event-handling.md) -- Kattintások, hover, billentyűzet események kezelése dialógusokban
- [3.5 Programozottan létrehozott widgetek](05-programmatic-widgets.md) -- Dialógus tartalom dinamikus építése kódban
