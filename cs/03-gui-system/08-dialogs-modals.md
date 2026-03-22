# Kapitola 3.8: Dialogy a modální okna

[Domů](../README.md) | [<< Předchozí: Styly, fonty a obrázky](07-styles-fonts.md) | **Dialogy a modální okna** | [Další: Vzory UI ve skutečných modech >>](09-real-mod-patterns.md)

---

Dialogy jsou dočasná překryvná okna, která vyžadují interakci uživatele -- potvrzovací výzvy, upozornění, vstupní formuláře a panely nastavení. Tato kapitola pokrývá vestavěný systém dialogů, ruční vzory dialogů, strukturu layoutu, správu fokusu a časté chyby.

---

## Modální vs. nemodální

Existují dva základní typy dialogů:

- **Modální** -- Blokuje veškerou interakci s obsahem za dialogem. Uživatel musí odpovědět (potvrdit, zrušit, zavřít), než může dělat cokoliv jiného. Příklady: potvrzení ukončení, varování při mazání, výzva k přejmenování.
- **Nemodální** -- Umožňuje uživateli interagovat s obsahem za dialogem, zatímco dialog zůstává otevřený. Příklady: informační panely, okna nastavení, palety nástrojů.

V DayZ je rozlišení řízeno tím, zda při otevření dialogu uzamknete herní vstup. Modální dialog volá `ChangeGameFocus(1)` a zobrazí kurzor; nemodální dialog může toto přeskočit nebo použít přepínací přístup.

---

## UIScriptedMenu -- Vestavěný systém

`UIScriptedMenu` je základní třída na úrovni enginu pro všechny obrazovky menu v DayZ. Integruje se se zásobníkem menu `UIManager`, automaticky zpracovává uzamčení vstupu a poskytuje háčky životního cyklu. Vanilla DayZ ji používá pro herní menu, dialog odhlášení, dialog respawnu, menu nastavení a mnoho dalších.

### Hierarchie tříd

```
UIMenuPanel          (základ: zásobník menu, Close(), správa podmenu)
  UIScriptedMenu     (skriptovaná menu: Init(), OnShow(), OnHide(), Update())
```

### Minimální dialog UIScriptedMenu

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
        // super.OnShow() volá LockControls(), který zajistí:
        //   GetGame().GetInput().ChangeGameFocus(1);
        //   GetGame().GetUIManager().ShowUICursor(true);
    }

    override void OnHide()
    {
        super.OnHide();
        // super.OnHide() volá UnlockControls(), který zajistí:
        //   GetGame().GetInput().ChangeGameFocus(-1);
        //   GetGame().GetUIManager().ShowUICursor(false);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        super.OnClick(w, x, y, button);

        if (w == m_BtnConfirm)
        {
            // Provést akci
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

        // ESC pro zavření
        if (GetUApi().GetInputByID(UAUIBack).LocalPress())
        {
            Close();
        }
    }
}
```

### Otevírání a zavírání

```c
// Otevření -- vytvoří menu a vloží ho na zásobník UIManager
MyDialog dialog = new MyDialog();
GetGame().GetUIManager().ShowScriptedMenu(dialog, null);

// Zavření zvenčí
GetGame().GetUIManager().HideScriptedMenu(dialog);

// Zavření zevnitř třídy dialogu
Close();
```

`ShowScriptedMenu()` vloží menu na zásobník menu enginu, vyvolá `Init()` a poté `OnShow()`. `Close()` vyvolá `OnHide()`, odebere menu ze zásobníku a zničí strom widgetů.

### Klíčové metody životního cyklu

| Metoda | Kdy se volá | Typické použití |
|--------|------------|-------------|
| `Init()` | Jednou, při vytvoření menu | Vytvoření widgetů, uložení referencí |
| `OnShow()` | Po zviditelnění menu | Uzamčení vstupu, spuštění časovačů |
| `OnHide()` | Po skrytí menu | Odemčení vstupu, zrušení časovačů |
| `Update(float timeslice)` | Každý snímek, dokud je viditelné | Dotazování vstupu (klávesa ESC), animace |
| `Cleanup()` | Před zničením | Uvolnění prostředků |

### LockControls / UnlockControls

`UIScriptedMenu` poskytuje vestavěné metody, které `OnShow()` a `OnHide()` volají automaticky:

```c
// Uvnitř UIScriptedMenu (kód enginu, zjednodušený):
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
    // Viditelnost kurzoru závisí na tom, zda existuje nadřazené menu
}
```

Protože `UIScriptedMenu` zpracovává správu fokusu automaticky v `OnShow()`/`OnHide()`, zřídka potřebujete volat `ChangeGameFocus()` sami, když používáte tuto základní třídu. Jednoduše volejte `super.OnShow()` a `super.OnHide()`.

---

## Vestavěný ShowDialog (Nativní dialogová okna)

Engine poskytuje nativní systém dialogů pro jednoduché potvrzovací výzvy. Vykreslí dialogové okno přizpůsobené platformě bez nutnosti jakéhokoliv souboru layoutu.

### Použití

```c
// Zobrazení potvrzovacího dialogu Ano/Ne
const int MY_DIALOG_ID = 500;

g_Game.GetUIManager().ShowDialog(
    "Confirm Action",                  // titulek
    "Are you sure you want to do this?", // text
    MY_DIALOG_ID,                      // vlastní ID pro identifikaci dialogu
    DBT_YESNO,                         // konfigurace tlačítek
    DBB_YES,                           // výchozí tlačítko
    DMT_QUESTION,                      // typ ikony
    this                               // handler (přijímá OnModalResult)
);
```

### Přijetí výsledku

Handler (instance `UIScriptedMenu` předaná jako poslední argument) přijímá výsledek přes `OnModalResult`:

```c
override bool OnModalResult(Widget w, int x, int y, int code, int result)
{
    if (code == MY_DIALOG_ID)
    {
        if (result == DBB_YES)
        {
            PerformAction();
        }
        // DBB_NO znamená, že uživatel odmítl -- nic neděláme
        return true;
    }

    return false;
}
```

### Konstanty

**Konfigurace tlačítek** (`DBT_` -- DialogBoxType):

| Konstanta | Zobrazená tlačítka |
|----------|---------------|
| `DBT_OK` | OK |
| `DBT_YESNO` | Yes, No |
| `DBT_YESNOCANCEL` | Yes, No, Cancel |

**Identifikátory tlačítek** (`DBB_` -- DialogBoxButton):

| Konstanta | Hodnota | Význam |
|----------|-------|---------|
| `DBB_NONE` | 0 | Bez výchozího |
| `DBB_OK` | 1 | Tlačítko OK |
| `DBB_YES` | 2 | Tlačítko Yes |
| `DBB_NO` | 3 | Tlačítko No |
| `DBB_CANCEL` | 4 | Tlačítko Cancel |

**Typy zpráv** (`DMT_` -- DialogMessageType):

| Konstanta | Ikona |
|----------|------|
| `DMT_NONE` | Bez ikony |
| `DMT_INFO` | Informace |
| `DMT_WARNING` | Varování |
| `DMT_QUESTION` | Otazník |
| `DMT_EXCLAMATION` | Vykřičník |

### Kdy použít ShowDialog

Použijte `ShowDialog()` pro jednoduché výstrahy a potvrzení, které nepotřebují vlastní stylování. Je spolehlivý a automaticky zpracovává fokus/kurzor. Pro brandované nebo složité dialogy (vlastní layout, vstupní pole, více možností) si vytvořte vlastní třídu dialogu.

---

## Ruční vzor dialogu (bez UIScriptedMenu)

Když potřebujete dialog, který není součástí zásobníku menu enginu -- například vyskakovací okno uvnitř existujícího panelu -- rozšiřte `ScriptedWidgetEventHandler` místo `UIScriptedMenu`. To vám dává plnou kontrolu, ale vyžaduje ruční správu fokusu a životního cyklu.

### Základní vzor

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

        // Uzamknout herní vstup, aby se hráč nemohl pohybovat/střílet
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

        // Obnovit herní vstup -- MUSÍ odpovídat +1 z Show()
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
        // Přepište v podtřídách nebo nastavte callback
    }
}
```

### Vyskakovací okno ve stylu VPP (vzor OnWidgetScriptInit)

VPP Admin Tools a další mody používají `OnWidgetScriptInit()` k inicializaci vyskakovacích oken. Widget je vytvořen rodičem a skriptová třída je připojena přes atribut `scriptclass` v souboru layoutu:

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

        // Posunout dialog nad ostatní widgety
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
        // Zpracovat vstup
    }
}
```

Rodič vytvoří vyskakovací okno vytvořením widgetu layoutu jako potomka:

```c
Widget popup = GetGame().GetWorkspace().CreateWidgets(
    "MyMod/GUI/layouts/popup.layout", parentWidget);
```

Engine automaticky zavolá `OnWidgetScriptInit()` na skriptové třídě specifikované v atributu `scriptclass` layoutu.

---

## Struktura layoutu dialogu

Layout dialogu má typicky tři vrstvy: celoobrazovkový kořen pro zachycení kliknutí, poloprůhledné překrytí pro ztmavení a vycentrovaný panel dialogu.

### Příklad souboru layoutu

```
FrameWidget "DialogRoot" {
    size 1 1 0 0        // Celá obrazovka
    halign fill
    valign fill

    // Poloprůhledné překrytí pozadí
    ImageWidget "Overlay" {
        size 1 1 0 0
        halign fill
        valign fill
        color "0 0 0 180"
    }

    // Vycentrovaný panel dialogu
    FrameWidget "DialogPanel" {
        halign center
        valign center
        hexactsize 1
        vexactsize 1
        hexactpos  1
        vexactpos  1
        size 0 0 500 300   // Dialog 500x300 pixelů

        // Záhlaví
        TextWidget "TitleText" {
            halign fill
            size 1 0 0 30
            text "Dialog Title"
            font "gui/fonts/MetronBook24"
        }

        // Oblast obsahu
        MultilineTextWidget "ContentText" {
            position 0 0 0 35
            size 1 0 0 200
            halign fill
        }

        // Řádek tlačítek dole
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

### Klíčové principy layoutu

1. **Celoobrazovkový kořen** -- Nejvnějšnější widget pokrývá celou obrazovku, takže kliknutí mimo dialog jsou zachycena.
2. **Poloprůhledné překrytí** -- `ImageWidget` nebo panel s průhledností (např. `color "0 0 0 180"`) ztmaví pozadí a vizuálně indikuje modální stav.
3. **Vycentrovaný panel** -- Použijte `halign center` a `valign center` s přesnými pixelovými rozměry pro předvídatelné rozměry.
4. **Zarovnání tlačítek** -- Umístěte tlačítka do horizontálního kontejneru ve spodní části panelu dialogu.

---

## Vzor potvrzovacího dialogu

Znovupoužitelný potvrzovací dialog přijímá titulek, zprávu a callback. Jedná se o nejběžnější vzor dialogu v modech DayZ.

### Implementace

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

        // Zajistit, aby se dialog vykresloval nad ostatním UI
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

        // Zavolat funkci callbacku na cílovém objektu
        GetGame().GameScript.CallFunction(
            m_CallbackTarget, m_CallbackFunc, null, confirmed);

        // Vyčistit -- odložit smazání, aby se předešlo problémům
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

### Použití

```c
// Ve volající třídě:
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

Callback používá `GameScript.CallFunction()`, který vyvolá funkci podle názvu na cílovém objektu. Toto je standardní způsob, jakým mody DayZ implementují callbacky dialogů, protože Enforce Script nepodporuje uzávěry (closures) ani delegáty.

---

## Vzor vstupního dialogu

Vstupní dialog přidává `EditBoxWidget` pro zadávání textu s validací.

```c
class InputDialog : ScriptedWidgetEventHandler
{
    protected Widget         m_Root;
    protected TextWidget     m_TitleText;
    protected EditBoxWidget  m_InputBox;
    protected ButtonWidget   m_BtnOk;
    protected ButtonWidget   m_BtnCancel;
    protected TextWidget     m_ErrorText;

    protected Class          m_CallbackTarget;
    protected string         m_CallbackFunc;

    void InputDialog(string title, string defaultText,
                     Class callbackTarget, string callbackFunc)
    {
        m_CallbackTarget = callbackTarget;
        m_CallbackFunc   = callbackFunc;

        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/GUI/layouts/input_dialog.layout");
        m_Root.SetHandler(this);

        m_TitleText = TextWidget.Cast(
            m_Root.FindAnyWidget("TitleText"));
        m_InputBox  = EditBoxWidget.Cast(
            m_Root.FindAnyWidget("InputBox"));
        m_BtnOk     = ButtonWidget.Cast(
            m_Root.FindAnyWidget("BtnOk"));
        m_BtnCancel = ButtonWidget.Cast(
            m_Root.FindAnyWidget("BtnCancel"));
        m_ErrorText = TextWidget.Cast(
            m_Root.FindAnyWidget("ErrorText"));

        m_TitleText.SetText(title);
        m_InputBox.SetText(defaultText);
        m_ErrorText.Show(false);

        m_Root.SetSort(1024, true);
        GetGame().GetInput().ChangeGameFocus(1);
        GetGame().GetUIManager().ShowUICursor(true);
    }

    void ~InputDialog()
    {
        if (m_Root)
            m_Root.Unlink();
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_BtnOk)
        {
            string text = m_InputBox.GetText();
            text.Trim();

            if (text == "")
            {
                m_ErrorText.SetText("Name cannot be empty");
                m_ErrorText.Show(true);
                return true;
            }

            GetGame().GetInput().ChangeGameFocus(-1);
            GetGame().GetUIManager().ShowUICursor(false);

            // Odeslat výsledek jako Param2: stav OK + text
            GetGame().GameScript.CallFunctionParams(
                m_CallbackTarget, m_CallbackFunc, null,
                new Param2<bool, string>(true, text));

            GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(
                DeleteSelf, 0, false);
            return true;
        }

        if (w == m_BtnCancel)
        {
            GetGame().GetInput().ChangeGameFocus(-1);
            GetGame().GetUIManager().ShowUICursor(false);

            GetGame().GameScript.CallFunctionParams(
                m_CallbackTarget, m_CallbackFunc, null,
                new Param2<bool, string>(false, ""));

            GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(
                DeleteSelf, 0, false);
            return true;
        }

        return false;
    }

    override bool OnChange(Widget w, int x, int y, bool finished)
    {
        if (w == m_InputBox)
        {
            // Skrýt chybu, když uživatel začne psát
            m_ErrorText.Show(false);

            // Odeslat při stisknutí Enter
            if (finished)
            {
                OnClick(m_BtnOk, 0, 0, 0);
            }
            return true;
        }

        return false;
    }

    protected void DeleteSelf()
    {
        delete this;
    }
}
```

---

## Správa fokusu

Správa fokusu je nejkritičtějším aspektem implementace dialogu. DayZ používá systém fokusu **založený na počítání referencí** -- každé `ChangeGameFocus(1)` musí být vyváženo odpovídajícím `ChangeGameFocus(-1)`.

### Jak to funguje

```c
// Inkrementovat počítadlo fokusu -- herní vstup je potlačen, dokud je počítadlo > 0
GetGame().GetInput().ChangeGameFocus(1);

// Zobrazit kurzor myši
GetGame().GetUIManager().ShowUICursor(true);

// ... interakce s dialogem ...

// Dekrementovat počítadlo fokusu -- herní vstup se obnoví, když počítadlo dosáhne 0
GetGame().GetInput().ChangeGameFocus(-1);

// Skrýt kurzor (pouze pokud ho žádné jiné menu nepotřebuje)
GetGame().GetUIManager().ShowUICursor(false);
```

### Pravidla

1. **Každé +1 musí mít odpovídající -1.** Pokud zavoláte `ChangeGameFocus(1)` v `Show()`, musíte zavolat `ChangeGameFocus(-1)` v `Hide()`, bez výjimek.

2. **Volejte -1 i na chybových cestách.** Pokud je dialog neočekávaně zničen (hráč zemře, odpojení serveru), destruktor musí stále dekrementovat. Umístěte čištění do destruktoru jako pojistku.

3. **UIScriptedMenu to zpracovává automaticky.** Pokud rozšiřujete `UIScriptedMenu` a voláte `super.OnShow()` / `super.OnHide()`, fokus je spravován za vás. Spravujte ho ručně pouze při použití `ScriptedWidgetEventHandler`.

4. **Fokus po zařízeních je volitelný.** Engine podporuje uzamčení fokusu po zařízeních (`INPUT_DEVICE_MOUSE`, `INPUT_DEVICE_KEYBOARD`, `INPUT_DEVICE_GAMEPAD`). Pro většinu dialogů v modech jedno volání `ChangeGameFocus(1)` (bez argumentu zařízení) uzamkne veškerý vstup.

5. **ResetGameFocus() je nukleární volba.** Vynutí nulové počítadlo. Použijte ho pouze při čištění nejvyšší úrovně (např. při zavírání celého admin nástroje), nikdy uvnitř jednotlivých tříd dialogů.

### Co se může pokazit

| Chyba | Příznak |
|---------|---------|
| Zapomenutí `ChangeGameFocus(-1)` při zavření | Hráč se nemůže pohybovat, střílet nebo interagovat po zavření dialogu |
| Dvojité volání `-1` | Počítadlo fokusu přejde do záporu; další menu, které se otevře, nebude správně uzamykat vstup |
| Zapomenutí `ShowUICursor(false)` | Kurzor myši zůstane trvale viditelný |
| Volání `ShowUICursor(false)`, když je nadřazené menu stále otevřené | Kurzor zmizí, zatímco nadřazené menu je stále aktivní |

---

## Z-pořadí a vrstvení

Když se dialog otevře nad existujícím UI, musí se vykreslovat nad vším ostatním. DayZ poskytuje dva mechanismy:

### Pořadí řazení widgetů

```c
// Posunout widget nad všechny sourozence (hodnota řazení 1024)
m_Root.SetSort(1024, true);
```

Metoda `SetSort()` nastavuje prioritu vykreslování. Vyšší hodnoty se vykreslují nahoře. Druhý parametr (`true`) se aplikuje rekurzivně na potomky. VPP Admin Tools používá `SetSort(1024, true)` pro všechna dialogová okna.

### Priorita layoutu (statická)

V souborech layoutu můžete nastavit prioritu přímo:

```
FrameWidget "DialogRoot" {
    // Vyšší hodnoty se vykreslují nahoře
    // Normální UI: 0-100
    // Překrytí:    998
    // Dialog:      999
}
```

### Doporučené postupy

- **Překrytí pozadí**: Použijte vysokou hodnotu řazení (např. 998) pro poloprůhledné pozadí.
- **Panel dialogu**: Použijte vyšší hodnotu řazení (např. 999 nebo 1024) pro samotný dialog.
- **Skládání dialogů**: Pokud váš systém podporuje vnořené dialogy, zvyšujte hodnotu řazení pro každou novou vrstvu dialogu.

---

## Běžné vzory

### Přepínací panel (otevření/zavření stejnou klávesou)

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

### ESC pro zavření

```c
// Uvnitř Update() v UIScriptedMenu:
override void Update(float timeslice)
{
    super.Update(timeslice);

    if (GetUApi().GetInputByID(UAUIBack).LocalPress())
    {
        Close();
    }
}

// Uvnitř ScriptedWidgetEventHandler (nemá smyčku Update):
// Musíte dotazovat z externího zdroje aktualizací, nebo použít OnKeyDown:
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

### Kliknutí mimo pro zavření

Udělejte celoobrazovkový widget překrytí klikatelný. Při kliknutí zavřete dialog:

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

        // Zaregistrovat handler na widgety překrytí i panelu
        m_Root.SetHandler(this);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        // Pokud uživatel klikl na překrytí (ne na panel), zavřít
        if (w == m_Overlay)
        {
            Hide();
            return true;
        }

        return false;
    }
}
```

### Callbacky výsledků dialogu

Pro dialogy, které potřebují vracet složité výsledky, použijte `GameScript.CallFunctionParams()` s objekty `Param`:

```c
// Odeslání výsledku s více hodnotami
GetGame().GameScript.CallFunctionParams(
    m_CallbackTarget,
    m_CallbackFunc,
    null,
    new Param2<int, string>(RESULT_OK, inputText)
);

// Přijetí ve volající třídě
void OnDialogResult(int result, string text)
{
    if (result == RESULT_OK)
    {
        ProcessInput(text);
    }
}
```

Toto je stejný vzor, jaký VPP Admin Tools používá pro svůj systém callbacků `VPPDialogBox`.

---

## UIScriptedWindow -- Plovoucí okna

DayZ má druhý vestavěný systém: `UIScriptedWindow`, pro plovoucí okna, která existují vedle `UIScriptedMenu`. Na rozdíl od `UIScriptedMenu` jsou okna sledována ve statické mapě a jejich události jsou směrovány přes aktivní menu.

```c
class MyWindow extends UIScriptedWindow
{
    void MyWindow(int id) : UIScriptedWindow(id)
    {
    }

    override Widget Init()
    {
        m_WgtRoot = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/GUI/layouts/my_window.layout");
        return m_WgtRoot;
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        // Zpracovat kliknutí
        return false;
    }
}
```

Okna se otevírají a zavírají přes `UIManager`:

```c
// Otevřít
GetGame().GetUIManager().OpenWindow(MY_WINDOW_ID);

// Zavřít
GetGame().GetUIManager().CloseWindow(MY_WINDOW_ID);

// Zkontrolovat, zda je otevřeno
GetGame().GetUIManager().IsWindowOpened(MY_WINDOW_ID);
```

V praxi většina vývojářů modů používá vyskakovací okna založená na `ScriptedWidgetEventHandler` místo `UIScriptedWindow`, protože systém oken vyžaduje registraci přes switch-case v `MissionBase` a události jsou směrovány přes aktivní `UIScriptedMenu`. Ruční vzor je jednodušší a flexibilnější.

---

## Časté chyby

### 1. Neobnovení herního fokusu při zavření

**Problém:** Hráč se nemůže pohybovat, střílet nebo interagovat po zavření dialogu.

```c
// ŠPATNĚ -- žádné obnovení fokusu
void CloseDialog()
{
    m_Root.Unlink();
    m_Root = null;
    // Počítadlo fokusu je stále inkrementované!
}

// SPRÁVNĚ -- vždy dekrementovat
void CloseDialog()
{
    m_Root.Unlink();
    m_Root = null;
    GetGame().GetInput().ChangeGameFocus(-1);
    GetGame().GetUIManager().ShowUICursor(false);
}
```

### 2. Neodpojení widgetů při zavření

**Problém:** Strom widgetů zůstává v paměti, události se stále vyvolávají, úniky paměti se hromadí.

```c
// ŠPATNĚ -- pouhé skrytí
void Hide()
{
    m_Root.Show(false);  // Widget stále existuje a spotřebovává paměť
}

// SPRÁVNĚ -- Unlink zničí strom widgetů
void Hide()
{
    if (m_Root)
    {
        m_Root.Unlink();
        m_Root = null;
    }
}
```

Pokud potřebujete opakovaně zobrazovat/skrývat stejný dialog, ponechání widgetu a použití `Show(true/false)` je v pořádku -- jen se ujistěte, že zavoláte `Unlink()` v destruktoru.

### 3. Dialog se vykresluje za ostatním UI

**Problém:** Dialog je neviditelný nebo částečně skrytý, protože jiné widgety mají vyšší prioritu vykreslování.

**Řešení:** Použijte `SetSort()` k posunutí dialogu nad vše ostatní:

```c
m_Root.SetSort(1024, true);
```

### 4. Více dialogů skládajících změny fokusu

**Problém:** Otevření dialogu A (+1), poté dialogu B (+1), poté zavření B (-1) -- počítadlo fokusu je stále 1, takže vstup je stále uzamčen, i když uživatel nevidí žádný dialog.

**Řešení:** Sledujte, zda každá instance dialogu uzamkla fokus, a dekrementujte pouze v takovém případě:

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

### 5. Volání Close() nebo Delete v konstruktoru

**Problém:** Volání `Close()` nebo `delete this` během konstrukce způsobuje pády nebo nedefinované chování, protože objekt není plně inicializován.

**Řešení:** Odložte uzavření pomocí `CallLater`:

```c
void MyDialog()
{
    // ...
    if (someErrorCondition)
    {
        // ŠPATNĚ: Close(); nebo delete this;
        // SPRÁVNĚ:
        GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(
            DeferredClose, 0, false);
    }
}

void DeferredClose()
{
    Close();  // nebo: delete this;
}
```

### 6. Nekontrolování null před operacemi s widgety

**Problém:** Pád při přístupu k widgetu, který byl již zničen nebo nikdy vytvořen.

```c
// ŠPATNĚ
void UpdateMessage(string text)
{
    m_MessageText.SetText(text);  // Pád, pokud m_MessageText je null
}

// SPRÁVNĚ
void UpdateMessage(string text)
{
    if (m_MessageText)
        m_MessageText.SetText(text);
}
```

---

## Shrnutí

| Přístup | Základní třída | Správa fokusu | Nejlepší pro |
|----------|-----------|-----------------|----------|
| Zásobník menu enginu | `UIScriptedMenu` | Automatická přes `LockControls`/`UnlockControls` | Celoobrazovková menu, hlavní dialogy |
| Nativní dialog | `ShowDialog()` | Automatická | Jednoduché výzvy Ano/Ne/OK |
| Ruční vyskakovací okno | `ScriptedWidgetEventHandler` | Ruční `ChangeGameFocus` | Vyskakovací okna v panelech, vlastní dialogy |
| Plovoucí okno | `UIScriptedWindow` | Přes nadřazené menu | Okna nástrojů vedle menu |

Zlaté pravidlo: **každé `ChangeGameFocus(1)` musí být spárováno s `ChangeGameFocus(-1)`.** Umístěte čištění fokusu do destruktoru jako pojistku, vždy odpojujte widgety pomocí `Unlink()` po dokončení a použijte `SetSort()` k zajištění, že se váš dialog vykresluje nahoře.

---

## Další kroky

- [3.6 Zpracování událostí](06-event-handling.md) -- Zpracování kliknutí, najetí myší, klávesnicových událostí uvnitř dialogů
- [3.5 Programatické vytváření widgetů](05-programmatic-widgets.md) -- Dynamické vytváření obsahu dialogu v kódu
