# Kapitel 3.8: Dialoge & Modale Fenster

[Startseite](../README.md) | [<< Zurück: Styles, Schriften & Bilder](07-styles-fonts.md) | **Dialoge & Modale Fenster** | [Weiter: Echte Mod-UI-Muster >>](09-real-mod-patterns.md)

---

Dialoge sind temporäre Overlay-Fenster, die eine Benutzerinteraktion erfordern -- Bestätigungsaufforderungen, Warnmeldungen, Eingabeformulare und Einstellungspanels. Dieses Kapitel behandelt das eingebaute Dialogsystem, manuelle Dialog-Muster, Layout-Struktur, Fokusverwaltung und häufige Fallstricke.

---

## Modal vs. Nicht-Modal

Es gibt zwei grundlegende Arten von Dialogen:

- **Modal** -- Blockiert alle Interaktionen mit dem Inhalt hinter dem Dialog. Der Benutzer muss reagieren (bestätigen, abbrechen, schließen), bevor er etwas anderes tun kann. Beispiele: Beenden-Bestätigung, Lösch-Warnung, Umbenennungs-Eingabe.
- **Nicht-Modal** -- Erlaubt dem Benutzer, mit dem Inhalt hinter dem Dialog zu interagieren, während dieser geöffnet bleibt. Beispiele: Info-Panels, Einstellungsfenster, Werkzeugpaletten.

In DayZ wird die Unterscheidung dadurch gesteuert, ob Sie die Spieleingabe beim Öffnen des Dialogs sperren. Ein modaler Dialog ruft `ChangeGameFocus(1)` auf und zeigt den Cursor an; ein nicht-modaler Dialog überspringt dies möglicherweise oder verwendet einen Umschalt-Ansatz.

---

## UIScriptedMenu -- Das eingebaute System

`UIScriptedMenu` ist die Engine-Basisklasse für alle Menübildschirme in DayZ. Sie integriert sich in den `UIManager`-Menüstapel, behandelt die Eingabesperre automatisch und bietet Lifecycle-Hooks. Vanilla DayZ verwendet sie für das Ingame-Menü, den Abmelde-Dialog, den Respawn-Dialog, das Optionsmenü und viele andere.

### Klassenhierarchie

```
UIMenuPanel          (Basis: Menüstapel, Close(), Untermenü-Verwaltung)
  UIScriptedMenu     (geskriptete Menüs: Init(), OnShow(), OnHide(), Update())
```

### Minimaler UIScriptedMenu-Dialog

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
        // super.OnShow() ruft LockControls() auf, das Folgendes erledigt:
        //   GetGame().GetInput().ChangeGameFocus(1);
        //   GetGame().GetUIManager().ShowUICursor(true);
    }

    override void OnHide()
    {
        super.OnHide();
        // super.OnHide() ruft UnlockControls() auf, das Folgendes erledigt:
        //   GetGame().GetInput().ChangeGameFocus(-1);
        //   GetGame().GetUIManager().ShowUICursor(false);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        super.OnClick(w, x, y, button);

        if (w == m_BtnConfirm)
        {
            // Aktion ausführen
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

        // ESC zum Schließen
        if (GetUApi().GetInputByID(UAUIBack).LocalPress())
        {
            Close();
        }
    }
}
```

### Öffnen und Schließen

```c
// Öffnen -- das Menü erstellen und auf den UIManager-Stapel schieben
MyDialog dialog = new MyDialog();
GetGame().GetUIManager().ShowScriptedMenu(dialog, null);

// Von außen schließen
GetGame().GetUIManager().HideScriptedMenu(dialog);

// Von innerhalb der Dialog-Klasse schließen
Close();
```

`ShowScriptedMenu()` schiebt das Menü auf den Engine-Menüstapel, löst `Init()` aus und dann `OnShow()`. `Close()` löst `OnHide()` aus, entfernt es vom Stapel und zerstört den Widget-Baum.

### Wichtige Lifecycle-Methoden

| Methode | Wann aufgerufen | Typische Verwendung |
|---------|----------------|---------------------|
| `Init()` | Einmal, wenn das Menü erstellt wird | Widgets erstellen, Referenzen zwischenspeichern |
| `OnShow()` | Nachdem das Menü sichtbar wird | Eingabe sperren, Timer starten |
| `OnHide()` | Nachdem das Menü ausgeblendet wird | Eingabe entsperren, Timer abbrechen |
| `Update(float timeslice)` | Jeden Frame während sichtbar | Eingabe abfragen (ESC-Taste), Animationen |
| `Cleanup()` | Vor der Zerstörung | Ressourcen freigeben |

### LockControls / UnlockControls

`UIScriptedMenu` bietet eingebaute Methoden, die `OnShow()` und `OnHide()` automatisch aufrufen:

```c
// Innerhalb von UIScriptedMenu (Engine-Code, vereinfacht):
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
    // Cursor-Sichtbarkeit hängt davon ab, ob ein übergeordnetes Menü existiert
}
```

Da `UIScriptedMenu` die Fokusverwaltung automatisch in `OnShow()`/`OnHide()` übernimmt, müssen Sie `ChangeGameFocus()` bei Verwendung dieser Basisklasse selten selbst aufrufen. Rufen Sie einfach `super.OnShow()` und `super.OnHide()` auf.

---

## Eingebauter ShowDialog (Native Nachrichtenboxen)

Die Engine bietet ein natives Dialogsystem für einfache Bestätigungsaufforderungen. Es rendert eine plattformgerechte Dialogbox ohne Benötigung einer Layout-Datei.

### Verwendung

```c
// Einen Ja/Nein-Bestätigungsdialog anzeigen
const int MY_DIALOG_ID = 500;

g_Game.GetUIManager().ShowDialog(
    "Confirm Action",                  // Überschrift
    "Are you sure you want to do this?", // Text
    MY_DIALOG_ID,                      // benutzerdefinierte ID zur Identifikation dieses Dialogs
    DBT_YESNO,                         // Schaltflächen-Konfiguration
    DBB_YES,                           // Standard-Schaltfläche
    DMT_QUESTION,                      // Symbol-Typ
    this                               // Handler (empfängt OnModalResult)
);
```

### Ergebnis empfangen

Der Handler (das als letztes Argument übergebene `UIScriptedMenu`) empfängt das Ergebnis über `OnModalResult`:

```c
override bool OnModalResult(Widget w, int x, int y, int code, int result)
{
    if (code == MY_DIALOG_ID)
    {
        if (result == DBB_YES)
        {
            PerformAction();
        }
        // DBB_NO bedeutet, der Benutzer hat abgelehnt -- nichts tun
        return true;
    }

    return false;
}
```

### Konstanten

**Schaltflächen-Konfigurationen** (`DBT_` -- DialogBoxType):

| Konstante | Angezeigte Schaltflächen |
|-----------|-------------------------|
| `DBT_OK` | OK |
| `DBT_YESNO` | Ja, Nein |
| `DBT_YESNOCANCEL` | Ja, Nein, Abbrechen |

**Schaltflächen-Bezeichner** (`DBB_` -- DialogBoxButton):

| Konstante | Wert | Bedeutung |
|-----------|------|-----------|
| `DBB_NONE` | 0 | Kein Standard |
| `DBB_OK` | 1 | OK-Schaltfläche |
| `DBB_YES` | 2 | Ja-Schaltfläche |
| `DBB_NO` | 3 | Nein-Schaltfläche |
| `DBB_CANCEL` | 4 | Abbrechen-Schaltfläche |

**Nachrichtentypen** (`DMT_` -- DialogMessageType):

| Konstante | Symbol |
|-----------|--------|
| `DMT_NONE` | Kein Symbol |
| `DMT_INFO` | Info |
| `DMT_WARNING` | Warnung |
| `DMT_QUESTION` | Fragezeichen |
| `DMT_EXCLAMATION` | Ausrufezeichen |

### Wann ShowDialog verwenden

Verwenden Sie `ShowDialog()` für einfache Warnungen und Bestätigungen, die kein benutzerdefiniertes Styling benötigen. Es ist zuverlässig und behandelt Fokus/Cursor automatisch. Für gebrandete oder komplexe Dialoge (benutzerdefiniertes Layout, Eingabefelder, mehrere Optionen) erstellen Sie Ihre eigene Dialog-Klasse.

---

## Manuelles Dialog-Muster (Ohne UIScriptedMenu)

Wenn Sie einen Dialog benötigen, der nicht Teil des Engine-Menüstapels ist -- zum Beispiel ein Popup innerhalb eines bestehenden Panels -- erweitern Sie `ScriptedWidgetEventHandler` anstelle von `UIScriptedMenu`. Dies gibt Ihnen volle Kontrolle, erfordert aber manuelle Fokus- und Lifecycle-Verwaltung.

### Grundmuster

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

        // Spieleingabe sperren, damit der Spieler sich nicht bewegen/schießen kann
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

        // Spieleingabe wiederherstellen -- MUSS zum +1 von Show() passen
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
        // In Unterklassen überschreiben oder einen Callback setzen
    }
}
```

### VPP-Stil Popup (OnWidgetScriptInit-Muster)

VPP Admin Tools und andere Mods verwenden `OnWidgetScriptInit()` zur Initialisierung von Popups. Das Widget wird von einem übergeordneten Element erstellt, und die Script-Klasse wird über das `scriptclass`-Attribut in der Layout-Datei angehängt:

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

        // Dialog über andere Widgets schieben
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
        // Eingabe verarbeiten
    }
}
```

Das übergeordnete Element erstellt das Popup, indem es das Layout-Widget als Kind erzeugt:

```c
Widget popup = GetGame().GetWorkspace().CreateWidgets(
    "MyMod/GUI/layouts/popup.layout", parentWidget);
```

Die Engine ruft automatisch `OnWidgetScriptInit()` auf der Script-Klasse auf, die im `scriptclass`-Attribut des Layouts angegeben ist.

---

## Dialog-Layout-Struktur

Ein Dialog-Layout hat typischerweise drei Ebenen: ein Vollbild-Root für die Klick-Abfangung, ein halbtransparentes Overlay zum Abdunkeln und das zentrierte Dialog-Panel.

### Layout-Datei-Beispiel

```
FrameWidget "DialogRoot" {
    size 1 1 0 0        // Vollbild
    halign fill
    valign fill

    // Halbtransparentes Hintergrund-Overlay
    ImageWidget "Overlay" {
        size 1 1 0 0
        halign fill
        valign fill
        color "0 0 0 180"
    }

    // Zentriertes Dialog-Panel
    FrameWidget "DialogPanel" {
        halign center
        valign center
        hexactsize 1
        vexactsize 1
        hexactpos  1
        vexactpos  1
        size 0 0 500 300   // 500x300 Pixel Dialog

        // Titelleiste
        TextWidget "TitleText" {
            halign fill
            size 1 0 0 30
            text "Dialog Title"
            font "gui/fonts/MetronBook24"
        }

        // Inhaltsbereich
        MultilineTextWidget "ContentText" {
            position 0 0 0 35
            size 1 0 0 200
            halign fill
        }

        // Schaltflächenreihe am unteren Rand
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

### Wichtige Layout-Prinzipien

1. **Vollbild-Root** -- Das äußerste Widget bedeckt den gesamten Bildschirm, damit Klicks außerhalb des Dialogs abgefangen werden.
2. **Halbtransparentes Overlay** -- Ein `ImageWidget` oder Panel mit Alpha (z.B. `color "0 0 0 180"`) dunkelt den Hintergrund ab und zeigt visuell einen modalen Zustand an.
3. **Zentriertes Panel** -- Verwenden Sie `halign center` und `valign center` mit exakten Pixel-Größen für vorhersehbare Abmessungen.
4. **Schaltflächen-Ausrichtung** -- Platzieren Sie Schaltflächen in einem horizontalen Container am unteren Rand des Dialog-Panels.

---

## Bestätigungsdialog-Muster

Ein wiederverwendbarer Bestätigungsdialog akzeptiert einen Titel, eine Nachricht und einen Callback. Dies ist das häufigste Dialog-Muster in DayZ-Mods.

### Implementierung

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

        // Sicherstellen, dass der Dialog über anderer UI gerendert wird
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

        // Callback-Funktion auf dem Zielobjekt aufrufen
        GetGame().GameScript.CallFunction(
            m_CallbackTarget, m_CallbackFunc, null, confirmed);

        // Aufräumen -- Löschung verzögern, um Probleme zu vermeiden
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

### Verwendung

```c
// In der aufrufenden Klasse:
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

Der Callback verwendet `GameScript.CallFunction()`, das eine Funktion anhand ihres Namens auf dem Zielobjekt aufruft. Dies ist die Standardmethode, wie DayZ-Mods Dialog-Callbacks implementieren, da Enforce Script keine Closures oder Delegates unterstützt.

---

## Eingabedialog-Muster

Ein Eingabedialog fügt ein `EditBoxWidget` für Texteingabe mit Validierung hinzu.

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

            // Ergebnis als Param2 senden: OK-Status + Text
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
            // Fehler ausblenden, wenn der Benutzer zu tippen beginnt
            m_ErrorText.Show(false);

            // Bei Enter-Taste absenden
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

## Fokusverwaltung

Die Fokusverwaltung ist der kritischste Aspekt der Dialog-Implementierung. DayZ verwendet ein **referenzgezähltes** Fokussystem -- jedes `ChangeGameFocus(1)` muss durch ein `ChangeGameFocus(-1)` ausgeglichen werden.

### Wie es funktioniert

```c
// Fokuszähler erhöhen -- Spieleingabe wird unterdrückt, solange Zähler > 0
GetGame().GetInput().ChangeGameFocus(1);

// Mauszeiger anzeigen
GetGame().GetUIManager().ShowUICursor(true);

// ... Dialog-Interaktion ...

// Fokuszähler verringern -- Spieleingabe wird fortgesetzt, wenn Zähler 0 erreicht
GetGame().GetInput().ChangeGameFocus(-1);

// Cursor ausblenden (nur wenn kein anderes Menü ihn benötigt)
GetGame().GetUIManager().ShowUICursor(false);
```

### Regeln

1. **Jedes +1 muss ein passendes -1 haben.** Wenn Sie `ChangeGameFocus(1)` in `Show()` aufrufen, müssen Sie `ChangeGameFocus(-1)` in `Hide()` aufrufen, ohne Ausnahmen.

2. **Rufen Sie -1 auch auf Fehlerpfaden auf.** Wenn der Dialog unerwartet zerstört wird (Spieler stirbt, Server-Trennung), muss der Destruktor trotzdem dekrementieren. Platzieren Sie die Bereinigung im Destruktor als Sicherheitsnetz.

3. **UIScriptedMenu behandelt dies automatisch.** Wenn Sie `UIScriptedMenu` erweitern und `super.OnShow()` / `super.OnHide()` aufrufen, wird der Fokus für Sie verwaltet. Verwalten Sie ihn nur manuell, wenn Sie `ScriptedWidgetEventHandler` verwenden.

4. **Gerätespezifischer Fokus ist optional.** Die Engine unterstützt gerätespezifische Fokussperren (`INPUT_DEVICE_MOUSE`, `INPUT_DEVICE_KEYBOARD`, `INPUT_DEVICE_GAMEPAD`). Für die meisten Mod-Dialoge sperrt ein einzelnes `ChangeGameFocus(1)` (ohne Geräte-Argument) alle Eingaben.

5. **ResetGameFocus() ist die Notlösung.** Es erzwingt den Zähler auf null. Verwenden Sie es nur bei der übergeordneten Bereinigung (z.B. beim Schließen eines gesamten Admin-Tools), niemals innerhalb einzelner Dialog-Klassen.

### Was schiefgehen kann

| Fehler | Symptom |
|--------|---------|
| `ChangeGameFocus(-1)` beim Schließen vergessen | Spieler kann sich nach dem Schließen des Dialogs nicht bewegen, schießen oder interagieren |
| `-1` zweimal aufgerufen | Fokuszähler wird negativ; das nächste Menü, das sich öffnet, sperrt die Eingabe nicht korrekt |
| `ShowUICursor(false)` vergessen | Mauszeiger bleibt dauerhaft sichtbar |
| `ShowUICursor(false)` aufgerufen, obwohl übergeordnetes Menü noch offen ist | Cursor verschwindet, während das übergeordnete Menü noch aktiv ist |

---

## Z-Reihenfolge und Ebenen

Wenn sich ein Dialog über bestehender UI öffnet, muss er über allem anderen gerendert werden. DayZ bietet zwei Mechanismen:

### Widget-Sortierreihenfolge

```c
// Widget über alle Geschwister schieben (Sortierwert 1024)
m_Root.SetSort(1024, true);
```

Die Methode `SetSort()` setzt die Rendering-Priorität. Höhere Werte werden oben gerendert. Der zweite Parameter (`true`) wird rekursiv auf Kinder angewendet. VPP Admin Tools verwenden `SetSort(1024, true)` für alle Dialogboxen.

### Layout-Priorität (Statisch)

In Layout-Dateien können Sie die Priorität direkt setzen:

```
FrameWidget "DialogRoot" {
    // Höhere Werte werden oben gerendert
    // Normale UI: 0-100
    // Overlay:   998
    // Dialog:    999
}
```

### Best Practices

- **Overlay-Hintergrund**: Verwenden Sie einen hohen Sortierwert (z.B. 998) für den halbtransparenten Hintergrund.
- **Dialog-Panel**: Verwenden Sie einen höheren Sortierwert (z.B. 999 oder 1024) für den Dialog selbst.
- **Gestapelte Dialoge**: Wenn Ihr System verschachtelte Dialoge unterstützt, erhöhen Sie den Sortierwert für jede neue Dialog-Ebene.

---

## Häufige Muster

### Umschalt-Panel (Öffnen/Schließen mit derselben Taste)

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

### ESC zum Schließen

```c
// Innerhalb von Update() eines UIScriptedMenu:
override void Update(float timeslice)
{
    super.Update(timeslice);

    if (GetUApi().GetInputByID(UAUIBack).LocalPress())
    {
        Close();
    }
}

// Innerhalb eines ScriptedWidgetEventHandler (keine Update-Schleife):
// Sie müssen von einer externen Update-Quelle abfragen, oder OnKeyDown verwenden:
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

### Klick außerhalb zum Schließen

Machen Sie das Vollbild-Overlay-Widget klickbar. Bei Klick wird der Dialog geschlossen:

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

        // Handler sowohl auf Overlay- als auch auf Panel-Widgets registrieren
        m_Root.SetHandler(this);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        // Wenn der Benutzer auf das Overlay geklickt hat (nicht das Panel), schließen
        if (w == m_Overlay)
        {
            Hide();
            return true;
        }

        return false;
    }
}
```

### Dialog-Ergebnis-Callbacks

Für Dialoge, die komplexe Ergebnisse zurückgeben müssen, verwenden Sie `GameScript.CallFunctionParams()` mit `Param`-Objekten:

```c
// Ein Ergebnis mit mehreren Werten senden
GetGame().GameScript.CallFunctionParams(
    m_CallbackTarget,
    m_CallbackFunc,
    null,
    new Param2<int, string>(RESULT_OK, inputText)
);

// Im Aufrufer empfangen
void OnDialogResult(int result, string text)
{
    if (result == RESULT_OK)
    {
        ProcessInput(text);
    }
}
```

Dies ist das gleiche Muster, das VPP Admin Tools für sein `VPPDialogBox`-Callback-System verwendet.

---

## UIScriptedWindow -- Schwebende Fenster

DayZ hat ein zweites eingebautes System: `UIScriptedWindow`, für schwebende Fenster, die neben einem `UIScriptedMenu` existieren. Im Gegensatz zu `UIScriptedMenu` werden Fenster in einer statischen Map verfolgt und ihre Ereignisse über das aktive Menü geroutet.

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
        // Klicks verarbeiten
        return false;
    }
}
```

Fenster werden über den `UIManager` geöffnet und geschlossen:

```c
// Öffnen
GetGame().GetUIManager().OpenWindow(MY_WINDOW_ID);

// Schließen
GetGame().GetUIManager().CloseWindow(MY_WINDOW_ID);

// Prüfen, ob geöffnet
GetGame().GetUIManager().IsWindowOpened(MY_WINDOW_ID);
```

In der Praxis verwenden die meisten Mod-Entwickler Popups auf Basis von `ScriptedWidgetEventHandler` anstelle von `UIScriptedWindow`, weil das Fenster-System eine Registrierung beim Switch-Case der Engine in `MissionBase` erfordert und die Ereignisse über das aktive `UIScriptedMenu` geroutet werden. Das manuelle Muster ist einfacher und flexibler.

---

## Häufige Fehler

### 1. Spielfokus beim Schließen nicht wiederherstellen

**Das Problem:** Der Spieler kann sich nach dem Schließen des Dialogs nicht bewegen, schießen oder interagieren.

```c
// FALSCH -- keine Fokuswiederherstellung
void CloseDialog()
{
    m_Root.Unlink();
    m_Root = null;
    // Fokuszähler ist immer noch erhöht!
}

// RICHTIG -- immer dekrementieren
void CloseDialog()
{
    m_Root.Unlink();
    m_Root = null;
    GetGame().GetInput().ChangeGameFocus(-1);
    GetGame().GetUIManager().ShowUICursor(false);
}
```

### 2. Widgets beim Schließen nicht entlinken

**Das Problem:** Der Widget-Baum bleibt im Speicher, Ereignisse feuern weiter, Speicherlecks häufen sich an.

```c
// FALSCH -- nur verstecken
void Hide()
{
    m_Root.Show(false);  // Widget existiert noch und verbraucht Speicher
}

// RICHTIG -- Unlink zerstört den Widget-Baum
void Hide()
{
    if (m_Root)
    {
        m_Root.Unlink();
        m_Root = null;
    }
}
```

Wenn Sie denselben Dialog wiederholt anzeigen/ausblenden müssen, ist es in Ordnung, das Widget zu behalten und `Show(true/false)` zu verwenden -- stellen Sie nur sicher, dass Sie `Unlink()` im Destruktor aufrufen.

### 3. Dialog wird hinter anderer UI gerendert

**Das Problem:** Der Dialog ist unsichtbar oder teilweise verdeckt, weil andere Widgets eine höhere Rendering-Priorität haben.

**Die Lösung:** Verwenden Sie `SetSort()`, um den Dialog über alles zu schieben:

```c
m_Root.SetSort(1024, true);
```

### 4. Mehrere Dialoge stapeln Fokusänderungen

**Das Problem:** Dialog A öffnen (+1), dann Dialog B öffnen (+1), dann B schließen (-1) -- Fokuszähler steht immer noch auf 1, also ist die Eingabe noch gesperrt, obwohl der Benutzer keinen Dialog sieht.

**Die Lösung:** Verfolgen Sie, ob jede Dialog-Instanz den Fokus gesperrt hat, und dekrementieren Sie nur, wenn sie es hat:

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

### 5. Close() oder Delete im Konstruktor aufrufen

**Das Problem:** Das Aufrufen von `Close()` oder `delete this` während der Konstruktion verursacht Abstürze oder undefiniertes Verhalten, da das Objekt noch nicht vollständig initialisiert ist.

**Die Lösung:** Schließung mittels `CallLater` verzögern:

```c
void MyDialog()
{
    // ...
    if (someErrorCondition)
    {
        // FALSCH: Close(); oder delete this;
        // RICHTIG:
        GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(
            DeferredClose, 0, false);
    }
}

void DeferredClose()
{
    Close();  // oder: delete this;
}
```

### 6. Nicht auf Null prüfen vor Widget-Operationen

**Das Problem:** Absturz beim Zugriff auf ein Widget, das bereits zerstört wurde oder nie erstellt wurde.

```c
// FALSCH
void UpdateMessage(string text)
{
    m_MessageText.SetText(text);  // Absturz, wenn m_MessageText null ist
}

// RICHTIG
void UpdateMessage(string text)
{
    if (m_MessageText)
        m_MessageText.SetText(text);
}
```

---

## Zusammenfassung

| Ansatz | Basisklasse | Fokusverwaltung | Am besten für |
|--------|------------|-----------------|---------------|
| Engine-Menüstapel | `UIScriptedMenu` | Automatisch über `LockControls`/`UnlockControls` | Vollbild-Menüs, große Dialoge |
| Nativer Dialog | `ShowDialog()` | Automatisch | Einfache Ja/Nein/OK-Abfragen |
| Manuelles Popup | `ScriptedWidgetEventHandler` | Manuell `ChangeGameFocus` | In-Panel-Popups, benutzerdefinierte Dialoge |
| Schwebendes Fenster | `UIScriptedWindow` | Über übergeordnetes Menü | Werkzeugfenster neben einem Menü |

Die goldene Regel: **Jedes `ChangeGameFocus(1)` muss durch ein `ChangeGameFocus(-1)` ausgeglichen werden.** Platzieren Sie die Fokus-Bereinigung in Ihrem Destruktor als Sicherheitsnetz, entlinken Sie Widgets immer mit `Unlink()` wenn fertig, und verwenden Sie `SetSort()`, um sicherzustellen, dass Ihr Dialog oben gerendert wird.

---

## Nächste Schritte

- [3.6 Event-Behandlung](06-event-handling.md) -- Klicks, Hover, Tastaturereignisse innerhalb von Dialogen behandeln
- [3.5 Programmatische Widget-Erstellung](05-programmatic-widgets.md) -- Dialog-Inhalt dynamisch im Code erstellen
