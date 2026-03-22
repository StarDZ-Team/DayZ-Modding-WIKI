# Rozdział 3.8: Okna dialogowe i modale

[Strona główna](../README.md) | [<< Poprzedni: Style, czcionki i obrazy](07-styles-fonts.md) | **Okna dialogowe i modale** | [Następny: Wzorce UI z prawdziwych modów >>](09-real-mod-patterns.md)

---

Okna dialogowe to tymczasowe nakładki, które wymagają interakcji użytkownika -- potwierdzenia, komunikaty alertów, formularze wprowadzania danych i panele ustawień. Ten rozdział omawia wbudowany system okien dialogowych, ręczne wzorce tworzenia okien, strukturę layoutów, zarządzanie fokusem oraz najczęstsze pułapki.

---

## Modalne vs. niemodalne

Istnieją dwa podstawowe typy okien dialogowych:

- **Modalne** -- Blokują wszelką interakcję z treścią za oknem dialogowym. Użytkownik musi odpowiedzieć (potwierdzić, anulować, zamknąć) zanim zrobi cokolwiek innego. Przykłady: potwierdzenie wyjścia, ostrzeżenie o usunięciu, monit o zmianę nazwy.
- **Niemodalne** -- Pozwalają użytkownikowi na interakcję z treścią za oknem dialogowym, gdy jest ono otwarte. Przykłady: panele informacyjne, okna ustawień, palety narzędzi.

W DayZ rozróżnienie to jest kontrolowane przez to, czy blokujesz wejście gry po otwarciu okna dialogowego. Modalne okno dialogowe wywołuje `ChangeGameFocus(1)` i wyświetla kursor; niemodalne może to pominąć lub użyć podejścia z przełącznikiem.

---

## UIScriptedMenu -- Wbudowany system

`UIScriptedMenu` to bazowa klasa na poziomie silnika dla wszystkich ekranów menu w DayZ. Integruje się ze stosem menu `UIManager`, automatycznie obsługuje blokowanie wejścia i zapewnia haki cyklu życia. Vanilla DayZ używa jej do menu w grze, okna dialogowego wylogowania, okna dialogowego odrodzenia, menu opcji i wielu innych.

### Hierarchia klas

```
UIMenuPanel          (bazowa: stos menu, Close(), zarządzanie podmenu)
  UIScriptedMenu     (menu skryptowe: Init(), OnShow(), OnHide(), Update())
```

### Minimalne okno dialogowe UIScriptedMenu

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
        // super.OnShow() wywołuje LockControls(), który obsługuje:
        //   GetGame().GetInput().ChangeGameFocus(1);
        //   GetGame().GetUIManager().ShowUICursor(true);
    }

    override void OnHide()
    {
        super.OnHide();
        // super.OnHide() wywołuje UnlockControls(), który obsługuje:
        //   GetGame().GetInput().ChangeGameFocus(-1);
        //   GetGame().GetUIManager().ShowUICursor(false);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        super.OnClick(w, x, y, button);

        if (w == m_BtnConfirm)
        {
            // Wykonaj akcję
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

        // ESC aby zamknąć
        if (GetUApi().GetInputByID(UAUIBack).LocalPress())
        {
            Close();
        }
    }
}
```

### Otwieranie i zamykanie

```c
// Otwieranie -- utwórz menu i umieść je na stosie UIManager
MyDialog dialog = new MyDialog();
GetGame().GetUIManager().ShowScriptedMenu(dialog, null);

// Zamykanie z zewnątrz
GetGame().GetUIManager().HideScriptedMenu(dialog);

// Zamykanie z wnętrza klasy okna dialogowego
Close();
```

`ShowScriptedMenu()` umieszcza menu na stosie menu silnika, uruchamia `Init()`, a następnie `OnShow()`. `Close()` uruchamia `OnHide()`, zdejmuje je ze stosu i niszczy drzewo widgetów.

### Kluczowe metody cyklu życia

| Metoda | Kiedy wywoływana | Typowe zastosowanie |
|--------|------------|-------------|
| `Init()` | Raz, gdy menu jest tworzone | Tworzenie widgetów, buforowanie referencji |
| `OnShow()` | Po tym jak menu staje się widoczne | Blokowanie wejścia, uruchamianie timerów |
| `OnHide()` | Po ukryciu menu | Odblokowanie wejścia, anulowanie timerów |
| `Update(float timeslice)` | Co klatkę, gdy widoczne | Odpytywanie wejścia (klawisz ESC), animacje |
| `Cleanup()` | Przed zniszczeniem | Zwalnianie zasobów |

### LockControls / UnlockControls

`UIScriptedMenu` zapewnia wbudowane metody, które `OnShow()` i `OnHide()` wywołują automatycznie:

```c
// Wewnątrz UIScriptedMenu (kod silnika, uproszczony):
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
    // Widoczność kursora zależy od tego, czy istnieje menu nadrzędne
}
```

Ponieważ `UIScriptedMenu` obsługuje zarządzanie fokusem automatycznie w `OnShow()`/`OnHide()`, rzadko trzeba wywoływać `ChangeGameFocus()` samodzielnie przy użyciu tej klasy bazowej. Wystarczy wywołać `super.OnShow()` i `super.OnHide()`.

---

## Wbudowane ShowDialog (Natywne okna komunikatów)

Silnik zapewnia natywny system okien dialogowych do prostych monitów potwierdzenia. Renderuje odpowiednie dla platformy okno dialogowe bez potrzeby pliku layout.

### Użycie

```c
// Wyświetlenie okna dialogowego potwierdzenia Tak/Nie
const int MY_DIALOG_ID = 500;

g_Game.GetUIManager().ShowDialog(
    "Confirm Action",                  // nagłówek
    "Are you sure you want to do this?", // tekst
    MY_DIALOG_ID,                      // własne ID do identyfikacji tego okna dialogowego
    DBT_YESNO,                         // konfiguracja przycisków
    DBB_YES,                           // domyślny przycisk
    DMT_QUESTION,                      // typ ikony
    this                               // handler (otrzymuje OnModalResult)
);
```

### Odbieranie wyniku

Handler (obiekt `UIScriptedMenu` przekazany jako ostatni argument) otrzymuje wynik przez `OnModalResult`:

```c
override bool OnModalResult(Widget w, int x, int y, int code, int result)
{
    if (code == MY_DIALOG_ID)
    {
        if (result == DBB_YES)
        {
            PerformAction();
        }
        // DBB_NO oznacza, że użytkownik odmówił -- nic nie robimy
        return true;
    }

    return false;
}
```

### Stałe

**Konfiguracje przycisków** (`DBT_` -- DialogBoxType):

| Stała | Wyświetlane przyciski |
|----------|---------------|
| `DBT_OK` | OK |
| `DBT_YESNO` | Tak, Nie |
| `DBT_YESNOCANCEL` | Tak, Nie, Anuluj |

**Identyfikatory przycisków** (`DBB_` -- DialogBoxButton):

| Stała | Wartość | Znaczenie |
|----------|-------|---------|
| `DBB_NONE` | 0 | Brak domyślnego |
| `DBB_OK` | 1 | Przycisk OK |
| `DBB_YES` | 2 | Przycisk Tak |
| `DBB_NO` | 3 | Przycisk Nie |
| `DBB_CANCEL` | 4 | Przycisk Anuluj |

**Typy komunikatów** (`DMT_` -- DialogMessageType):

| Stała | Ikona |
|----------|------|
| `DMT_NONE` | Brak ikony |
| `DMT_INFO` | Informacja |
| `DMT_WARNING` | Ostrzeżenie |
| `DMT_QUESTION` | Znak zapytania |
| `DMT_EXCLAMATION` | Wykrzyknik |

### Kiedy używać ShowDialog

Używaj `ShowDialog()` do prostych alertów i potwierdzeń, które nie wymagają niestandardowego stylowania. Jest niezawodne i automatycznie obsługuje fokus/kursor. Dla markowych lub złożonych okien dialogowych (własny layout, pola wejściowe, wiele opcji), stwórz własną klasę okna dialogowego.

---

## Ręczny wzorzec okna dialogowego (Bez UIScriptedMenu)

Gdy potrzebujesz okna dialogowego, które nie jest częścią stosu menu silnika -- na przykład wyskakującego okienka wewnątrz istniejącego panelu -- rozszerz `ScriptedWidgetEventHandler` zamiast `UIScriptedMenu`. Daje to pełną kontrolę, ale wymaga ręcznego zarządzania fokusem i cyklem życia.

### Podstawowy wzorzec

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

        // Zablokuj wejście gry, aby gracz nie mógł się poruszać/strzelać
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

        // Przywróć wejście gry -- MUSI odpowiadać +1 z Show()
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
        // Nadpisz w podklasach lub ustaw callback
    }
}
```

### Wyskakujące okienka w stylu VPP (Wzorzec OnWidgetScriptInit)

VPP Admin Tools i inne mody używają `OnWidgetScriptInit()` do inicjalizacji wyskakujących okienek. Widget jest tworzony przez rodzica, a klasa skryptu jest dołączana przez `scriptclass` w pliku layout:

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

        // Umieść okno dialogowe nad innymi widgetami
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
        // Przetwórz dane wejściowe
    }
}
```

Rodzic tworzy wyskakujące okienko, tworząc widget layout jako dziecko:

```c
Widget popup = GetGame().GetWorkspace().CreateWidgets(
    "MyMod/GUI/layouts/popup.layout", parentWidget);
```

Silnik automatycznie wywołuje `OnWidgetScriptInit()` na klasie skryptu określonej w atrybucie `scriptclass` layoutu.

---

## Struktura layoutu okna dialogowego

Layout okna dialogowego zwykle ma trzy warstwy: pełnoekranowy korzeń do przechwytywania kliknięć, półprzezroczyste tło do przyciemniania oraz wyśrodkowany panel dialogowy.

### Przykład pliku layout

```
FrameWidget "DialogRoot" {
    size 1 1 0 0        // Pełny ekran
    halign fill
    valign fill

    // Półprzezroczysta nakładka tła
    ImageWidget "Overlay" {
        size 1 1 0 0
        halign fill
        valign fill
        color "0 0 0 180"
    }

    // Wyśrodkowany panel dialogowy
    FrameWidget "DialogPanel" {
        halign center
        valign center
        hexactsize 1
        vexactsize 1
        hexactpos  1
        vexactpos  1
        size 0 0 500 300   // Okno dialogowe 500x300 pikseli

        // Pasek tytułu
        TextWidget "TitleText" {
            halign fill
            size 1 0 0 30
            text "Dialog Title"
            font "gui/fonts/MetronBook24"
        }

        // Obszar treści
        MultilineTextWidget "ContentText" {
            position 0 0 0 35
            size 1 0 0 200
            halign fill
        }

        // Rząd przycisków na dole
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

### Kluczowe zasady layoutu

1. **Pełnoekranowy korzeń** -- Zewnętrzny widget pokrywa cały ekran, aby kliknięcia poza oknem dialogowym były przechwytywane.
2. **Półprzezroczysta nakładka** -- `ImageWidget` lub panel z kanałem alfa (np. `color "0 0 0 180"`) przyciemnia tło, wizualnie wskazując stan modalny.
3. **Wyśrodkowany panel** -- Użyj `halign center` i `valign center` z dokładnymi rozmiarami w pikselach dla przewidywalnych wymiarów.
4. **Wyrównanie przycisków** -- Umieść przyciski w poziomym kontenerze na dole panelu dialogowego.

---

## Wzorzec okna dialogowego potwierdzenia

Wielokrotnego użytku okno dialogowe potwierdzenia przyjmuje tytuł, wiadomość i callback. Jest to najczęstszy wzorzec okna dialogowego w modach DayZ.

### Implementacja

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

        // Upewnij się, że okno dialogowe renderuje się nad innym UI
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

        // Wywołaj funkcję callback na obiekcie docelowym
        GetGame().GameScript.CallFunction(
            m_CallbackTarget, m_CallbackFunc, null, confirmed);

        // Posprzątaj -- odłóż usunięcie, aby uniknąć problemów
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

### Użycie

```c
// W klasie wywołującej:
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

Callback używa `GameScript.CallFunction()`, które wywołuje funkcję po nazwie na obiekcie docelowym. Jest to standardowy sposób implementacji callbacków okien dialogowych w modach DayZ, ponieważ Enforce Script nie obsługuje domknięć ani delegatów.

---

## Wzorzec okna dialogowego wprowadzania danych

Okno dialogowe wprowadzania danych dodaje `EditBoxWidget` do wprowadzania tekstu z walidacją.

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

            // Wyślij wynik jako Param2: status OK + tekst
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
            // Ukryj błąd, gdy użytkownik zacznie pisać
            m_ErrorText.Show(false);

            // Zatwierdź klawiszem Enter
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

## Zarządzanie fokusem

Zarządzanie fokusem jest najważniejszym aspektem implementacji okien dialogowych. DayZ używa **systemu zliczania referencji** -- każde `ChangeGameFocus(1)` musi być zrównoważone przez `ChangeGameFocus(-1)`.

### Jak to działa

```c
// Zwiększ licznik fokusu -- wejście gry jest wyłączone, gdy licznik > 0
GetGame().GetInput().ChangeGameFocus(1);

// Pokaż kursor myszy
GetGame().GetUIManager().ShowUICursor(true);

// ... interakcja z oknem dialogowym ...

// Zmniejsz licznik fokusu -- wejście gry zostaje przywrócone, gdy licznik osiągnie 0
GetGame().GetInput().ChangeGameFocus(-1);

// Ukryj kursor (tylko jeśli żadne inne menu go nie potrzebuje)
GetGame().GetUIManager().ShowUICursor(false);
```

### Zasady

1. **Każde +1 musi mieć odpowiadające -1.** Jeśli wywołujesz `ChangeGameFocus(1)` w `Show()`, musisz wywołać `ChangeGameFocus(-1)` w `Hide()`, bez wyjątków.

2. **Wywołuj -1 nawet na ścieżkach błędów.** Jeśli okno dialogowe zostanie niespodziewanie zniszczone (śmierć gracza, rozłączenie z serwerem), destruktor nadal musi dekrementować. Umieść czyszczenie w destruktorze jako zabezpieczenie.

3. **UIScriptedMenu obsługuje to automatycznie.** Jeśli rozszerzasz `UIScriptedMenu` i wywołujesz `super.OnShow()` / `super.OnHide()`, fokus jest zarządzany za ciebie. Zarządzaj nim ręcznie tylko przy użyciu `ScriptedWidgetEventHandler`.

4. **Fokus per urządzenie jest opcjonalny.** Silnik obsługuje blokowanie fokusu per urządzenie (`INPUT_DEVICE_MOUSE`, `INPUT_DEVICE_KEYBOARD`, `INPUT_DEVICE_GAMEPAD`). Dla większości okien dialogowych modów, pojedyncze `ChangeGameFocus(1)` (bez argumentu urządzenia) blokuje wszystkie wejścia.

5. **ResetGameFocus() to opcja nuklearna.** Wymusza wyzerowanie licznika. Używaj go tylko przy czyszczeniu najwyższego poziomu (np. przy zamykaniu całego narzędzia administratora), nigdy wewnątrz pojedynczych klas okien dialogowych.

### Co może pójść nie tak

| Błąd | Objaw |
|---------|---------|
| Zapomnienie `ChangeGameFocus(-1)` przy zamykaniu | Gracz nie może się poruszać, strzelać ani wchodzić w interakcje po zamknięciu okna dialogowego |
| Wywołanie `-1` dwa razy | Licznik fokusu staje się ujemny; następne menu, które się otworzy, nie zablokuje prawidłowo wejścia |
| Zapomnienie `ShowUICursor(false)` | Kursor myszy pozostaje widoczny na stałe |
| Wywołanie `ShowUICursor(false)` gdy menu nadrzędne jest wciąż otwarte | Kursor znika, gdy menu nadrzędne jest wciąż aktywne |

---

## Kolejność Z i warstwy

Gdy okno dialogowe otwiera się na istniejącym UI, musi renderować się nad wszystkim innym. DayZ zapewnia dwa mechanizmy:

### Kolejność sortowania widgetów

```c
// Umieść widget nad wszystkimi rodzeństwem (wartość sortowania 1024)
m_Root.SetSort(1024, true);
```

Metoda `SetSort()` ustawia priorytet renderowania. Wyższe wartości renderują się na wierzchu. Drugi parametr (`true`) stosuje się rekurencyjnie do dzieci. VPP Admin Tools używa `SetSort(1024, true)` dla wszystkich okien dialogowych.

### Priorytet layoutu (statyczny)

W plikach layout możesz ustawić priorytet bezpośrednio:

```
FrameWidget "DialogRoot" {
    // Wyższe wartości renderują się na wierzchu
    // Zwykłe UI: 0-100
    // Nakładka:   998
    // Okno dialogowe: 999
}
```

### Najlepsze praktyki

- **Tło nakładki**: Użyj wysokiej wartości sortowania (np. 998) dla półprzezroczystego tła.
- **Panel dialogowy**: Użyj wyższej wartości sortowania (np. 999 lub 1024) dla samego okna dialogowego.
- **Zagnieżdżone okna dialogowe**: Jeśli twój system obsługuje zagnieżdżone okna dialogowe, zwiększaj wartość sortowania dla każdej nowej warstwy okna dialogowego.

---

## Typowe wzorce

### Panel przełączania (otwieranie/zamykanie tym samym klawiszem)

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

### ESC aby zamknąć

```c
// Wewnątrz Update() UIScriptedMenu:
override void Update(float timeslice)
{
    super.Update(timeslice);

    if (GetUApi().GetInputByID(UAUIBack).LocalPress())
    {
        Close();
    }
}

// Wewnątrz ScriptedWidgetEventHandler (brak pętli Update):
// Musisz odpytywać z zewnętrznego źródła aktualizacji, lub użyć OnKeyDown:
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

### Kliknięcie na zewnątrz aby zamknąć

Zrób pełnoekranowy widget nakładki klikalnym. Po kliknięciu zamknij okno dialogowe:

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

        // Zarejestruj handler na obu widgetach nakładki i panelu
        m_Root.SetHandler(this);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        // Jeśli użytkownik kliknął nakładkę (nie panel), zamknij
        if (w == m_Overlay)
        {
            Hide();
            return true;
        }

        return false;
    }
}
```

### Callbacki wyników okien dialogowych

Dla okien dialogowych, które muszą zwracać złożone wyniki, użyj `GameScript.CallFunctionParams()` z obiektami `Param`:

```c
// Wysyłanie wyniku z wieloma wartościami
GetGame().GameScript.CallFunctionParams(
    m_CallbackTarget,
    m_CallbackFunc,
    null,
    new Param2<int, string>(RESULT_OK, inputText)
);

// Odbieranie w wywołującym
void OnDialogResult(int result, string text)
{
    if (result == RESULT_OK)
    {
        ProcessInput(text);
    }
}
```

Jest to ten sam wzorzec, którego VPP Admin Tools używa w swoim systemie callbacków `VPPDialogBox`.

---

## UIScriptedWindow -- Pływające okna

DayZ ma drugi wbudowany system: `UIScriptedWindow`, do pływających okien, które istnieją obok `UIScriptedMenu`. W przeciwieństwie do `UIScriptedMenu`, okna są śledzone w statycznej mapie, a ich zdarzenia są kierowane przez aktywne menu.

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
        // Obsłuż kliknięcia
        return false;
    }
}
```

Okna otwiera się i zamyka przez `UIManager`:

```c
// Otwórz
GetGame().GetUIManager().OpenWindow(MY_WINDOW_ID);

// Zamknij
GetGame().GetUIManager().CloseWindow(MY_WINDOW_ID);

// Sprawdź czy otwarte
GetGame().GetUIManager().IsWindowOpened(MY_WINDOW_ID);
```

W praktyce większość twórców modów używa wyskakujących okienek opartych na `ScriptedWidgetEventHandler` zamiast `UIScriptedWindow`, ponieważ system okien wymaga rejestracji w switch-case silnika w `MissionBase`, a zdarzenia są kierowane przez aktywne `UIScriptedMenu`. Ręczny wzorzec jest prostszy i bardziej elastyczny.

---

## Częste błędy

### 1. Brak przywrócenia fokusu gry przy zamykaniu

**Problem:** Gracz nie może się poruszać, strzelać ani wchodzić w interakcje po zamknięciu okna dialogowego.

```c
// ŹLE -- brak przywrócenia fokusu
void CloseDialog()
{
    m_Root.Unlink();
    m_Root = null;
    // Licznik fokusu wciąż jest zwiększony!
}

// DOBRZE -- zawsze dekrementuj
void CloseDialog()
{
    m_Root.Unlink();
    m_Root = null;
    GetGame().GetInput().ChangeGameFocus(-1);
    GetGame().GetUIManager().ShowUICursor(false);
}
```

### 2. Brak odłączenia widgetów przy zamykaniu

**Problem:** Drzewo widgetów pozostaje w pamięci, zdarzenia nadal się uruchamiają, wycieki pamięci się kumulują.

```c
// ŹLE -- tylko ukrywanie
void Hide()
{
    m_Root.Show(false);  // Widget wciąż istnieje i zużywa pamięć
}

// DOBRZE -- unlink niszczy drzewo widgetów
void Hide()
{
    if (m_Root)
    {
        m_Root.Unlink();
        m_Root = null;
    }
}
```

Jeśli musisz wielokrotnie pokazywać/ukrywać to samo okno dialogowe, zachowanie widgetu i użycie `Show(true/false)` jest w porządku -- tylko upewnij się, że wywołujesz `Unlink()` w destruktorze.

### 3. Okno dialogowe renderuje się za innym UI

**Problem:** Okno dialogowe jest niewidoczne lub częściowo ukryte, ponieważ inne widgety mają wyższy priorytet renderowania.

**Rozwiązanie:** Użyj `SetSort()`, aby umieścić okno dialogowe nad wszystkim:

```c
m_Root.SetSort(1024, true);
```

### 4. Wiele okien dialogowych nakłada zmiany fokusu

**Problem:** Otwieranie okna dialogowego A (+1), potem okna B (+1), następnie zamknięcie B (-1) -- licznik fokusu wciąż wynosi 1, więc wejście jest nadal zablokowane, mimo że użytkownik nie widzi żadnego okna dialogowego.

**Rozwiązanie:** Śledź, czy każda instancja okna dialogowego zablokowała fokus, i dekrementuj tylko jeśli tak było:

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

### 5. Wywoływanie Close() lub Delete w konstruktorze

**Problem:** Wywoływanie `Close()` lub `delete this` podczas konstrukcji powoduje awarie lub niezdefiniowane zachowanie, ponieważ obiekt nie jest w pełni zainicjalizowany.

**Rozwiązanie:** Odłóż zamknięcie używając `CallLater`:

```c
void MyDialog()
{
    // ...
    if (someErrorCondition)
    {
        // ŹLE: Close(); lub delete this;
        // DOBRZE:
        GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(
            DeferredClose, 0, false);
    }
}

void DeferredClose()
{
    Close();  // lub: delete this;
}
```

### 6. Brak sprawdzenia null przed operacjami na widgetach

**Problem:** Awaria przy dostępie do widgetu, który został już zniszczony lub nigdy nie został utworzony.

```c
// ŹLE
void UpdateMessage(string text)
{
    m_MessageText.SetText(text);  // Awaria jeśli m_MessageText jest null
}

// DOBRZE
void UpdateMessage(string text)
{
    if (m_MessageText)
        m_MessageText.SetText(text);
}
```

---

## Podsumowanie

| Podejście | Klasa bazowa | Zarządzanie fokusem | Najlepsze do |
|----------|-----------|-----------------|----------|
| Stos menu silnika | `UIScriptedMenu` | Automatyczne przez `LockControls`/`UnlockControls` | Pełnoekranowe menu, główne okna dialogowe |
| Natywne okno dialogowe | `ShowDialog()` | Automatyczne | Proste monity Tak/Nie/OK |
| Ręczne wyskakujące okienko | `ScriptedWidgetEventHandler` | Ręczne `ChangeGameFocus` | Wyskakujące okienka wewnątrz paneli, własne okna dialogowe |
| Pływające okno | `UIScriptedWindow` | Przez menu nadrzędne | Okna narzędziowe obok menu |

Złota zasada: **każde `ChangeGameFocus(1)` musi być dopasowane do `ChangeGameFocus(-1)`.** Umieść czyszczenie fokusu w destruktorze jako zabezpieczenie, zawsze wywołuj `Unlink()` na widgetach gdy skończysz, i używaj `SetSort()`, aby upewnić się, że twoje okno dialogowe renderuje się na wierzchu.

---

## Następne kroki

- [3.6 Obsługa zdarzeń](06-event-handling.md) -- Obsługa kliknięć, najechania, zdarzeń klawiatury wewnątrz okien dialogowych
- [3.5 Programowe tworzenie widgetów](05-programmatic-widgets.md) -- Dynamiczne budowanie treści okien dialogowych w kodzie
