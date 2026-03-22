# Chapitre 3.8 : Dialogues et fenêtres modales

[Accueil](../README.md) | [<< Précédent : Styles, polices et images](07-styles-fonts.md) | **Dialogues et fenêtres modales** | [Suivant : Patrons d'UI de vrais mods >>](09-real-mod-patterns.md)

---

Les dialogues sont des fenêtres superposées temporaires qui exigent une interaction de l'utilisateur -- invites de confirmation, messages d'alerte, formulaires de saisie et panneaux de paramètres. Ce chapitre couvre le système de dialogues intégré, les patrons de dialogues manuels, la structure des layouts, la gestion du focus et les pièges courants.

---

## Modal vs. non modal

Il existe deux types fondamentaux de dialogue :

- **Modal** -- Bloque toute interaction avec le contenu derrière le dialogue. L'utilisateur doit répondre (confirmer, annuler, fermer) avant de faire quoi que ce soit d'autre. Exemples : confirmation de fermeture, avertissement de suppression, invite de renommage.
- **Non modal** -- Permet à l'utilisateur d'interagir avec le contenu derrière le dialogue pendant qu'il reste ouvert. Exemples : panneaux d'information, fenêtres de paramètres, palettes d'outils.

Dans DayZ, la distinction est contrôlée par le verrouillage ou non des entrées du jeu à l'ouverture du dialogue. Un dialogue modal appelle `ChangeGameFocus(1)` et affiche le curseur ; un dialogue non modal peut ignorer cela ou utiliser une approche à bascule.

---

## UIScriptedMenu -- Le système intégré

`UIScriptedMenu` est la classe de base au niveau du moteur pour tous les écrans de menu dans DayZ. Elle s'intègre à la pile de menus `UIManager`, gère automatiquement le verrouillage des entrées et fournit des hooks de cycle de vie. Le DayZ vanilla l'utilise pour le menu en jeu, le dialogue de déconnexion, le dialogue de réapparition, le menu d'options et bien d'autres.

### Hiérarchie des classes

```
UIMenuPanel          (base : pile de menus, Close(), gestion des sous-menus)
  UIScriptedMenu     (menus scriptés : Init(), OnShow(), OnHide(), Update())
```

### Dialogue UIScriptedMenu minimal

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
        // super.OnShow() appelle LockControls() qui gère :
        //   GetGame().GetInput().ChangeGameFocus(1);
        //   GetGame().GetUIManager().ShowUICursor(true);
    }

    override void OnHide()
    {
        super.OnHide();
        // super.OnHide() appelle UnlockControls() qui gère :
        //   GetGame().GetInput().ChangeGameFocus(-1);
        //   GetGame().GetUIManager().ShowUICursor(false);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        super.OnClick(w, x, y, button);

        if (w == m_BtnConfirm)
        {
            // Effectuer l'action
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

        // Échap pour fermer
        if (GetUApi().GetInputByID(UAUIBack).LocalPress())
        {
            Close();
        }
    }
}
```

### Ouverture et fermeture

```c
// Ouverture -- créer le menu et le pousser sur la pile UIManager
MyDialog dialog = new MyDialog();
GetGame().GetUIManager().ShowScriptedMenu(dialog, null);

// Fermeture depuis l'extérieur
GetGame().GetUIManager().HideScriptedMenu(dialog);

// Fermeture depuis l'intérieur de la classe du dialogue
Close();
```

`ShowScriptedMenu()` pousse le menu sur la pile de menus du moteur, déclenche `Init()`, puis `OnShow()`. `Close()` déclenche `OnHide()`, retire le menu de la pile et détruit l'arbre de widgets.

### Méthodes clés du cycle de vie

| Méthode | Quand appelée | Utilisation typique |
|---------|---------------|---------------------|
| `Init()` | Une fois, à la création du menu | Créer les widgets, mettre en cache les références |
| `OnShow()` | Après que le menu devient visible | Verrouiller les entrées, démarrer les minuteries |
| `OnHide()` | Après que le menu est masqué | Déverrouiller les entrées, annuler les minuteries |
| `Update(float timeslice)` | Chaque frame tant que visible | Interroger les entrées (touche Échap), animations |
| `Cleanup()` | Avant la destruction | Libérer les ressources |

### LockControls / UnlockControls

`UIScriptedMenu` fournit des méthodes intégrées que `OnShow()` et `OnHide()` appellent automatiquement :

```c
// À l'intérieur de UIScriptedMenu (code du moteur, simplifié) :
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
    // La visibilité du curseur dépend de l'existence d'un menu parent
}
```

Puisque `UIScriptedMenu` gère automatiquement le focus dans `OnShow()`/`OnHide()`, vous avez rarement besoin d'appeler `ChangeGameFocus()` vous-même lorsque vous utilisez cette classe de base. Appelez simplement `super.OnShow()` et `super.OnHide()`.

---

## ShowDialog intégré (boîtes de message natives)

Le moteur fournit un système de dialogue natif pour les invites de confirmation simples. Il affiche une boîte de dialogue appropriée à la plateforme sans nécessiter de fichier layout.

### Utilisation

```c
// Afficher un dialogue de confirmation Oui/Non
const int MY_DIALOG_ID = 500;

g_Game.GetUIManager().ShowDialog(
    "Confirm Action",                  // titre
    "Are you sure you want to do this?", // texte
    MY_DIALOG_ID,                      // ID personnalisé pour identifier ce dialogue
    DBT_YESNO,                         // configuration des boutons
    DBB_YES,                           // bouton par défaut
    DMT_QUESTION,                      // type d'icône
    this                               // gestionnaire (reçoit OnModalResult)
);
```

### Réception du résultat

Le gestionnaire (le `UIScriptedMenu` passé comme dernier argument) reçoit le résultat via `OnModalResult` :

```c
override bool OnModalResult(Widget w, int x, int y, int code, int result)
{
    if (code == MY_DIALOG_ID)
    {
        if (result == DBB_YES)
        {
            PerformAction();
        }
        // DBB_NO signifie que l'utilisateur a refusé -- ne rien faire
        return true;
    }

    return false;
}
```

### Constantes

**Configurations de boutons** (`DBT_` -- DialogBoxType) :

| Constante | Boutons affichés |
|-----------|-----------------|
| `DBT_OK` | OK |
| `DBT_YESNO` | Oui, Non |
| `DBT_YESNOCANCEL` | Oui, Non, Annuler |

**Identifiants de boutons** (`DBB_` -- DialogBoxButton) :

| Constante | Valeur | Signification |
|-----------|--------|---------------|
| `DBB_NONE` | 0 | Pas de défaut |
| `DBB_OK` | 1 | Bouton OK |
| `DBB_YES` | 2 | Bouton Oui |
| `DBB_NO` | 3 | Bouton Non |
| `DBB_CANCEL` | 4 | Bouton Annuler |

**Types de messages** (`DMT_` -- DialogMessageType) :

| Constante | Icône |
|-----------|-------|
| `DMT_NONE` | Pas d'icône |
| `DMT_INFO` | Information |
| `DMT_WARNING` | Avertissement |
| `DMT_QUESTION` | Point d'interrogation |
| `DMT_EXCLAMATION` | Point d'exclamation |

### Quand utiliser ShowDialog

Utilisez `ShowDialog()` pour les alertes et confirmations simples qui n'ont pas besoin de style personnalisé. C'est fiable et gère automatiquement le focus et le curseur. Pour des dialogues personnalisés ou complexes (layout personnalisé, champs de saisie, options multiples), construisez votre propre classe de dialogue.

---

## Patron de dialogue manuel (sans UIScriptedMenu)

Lorsque vous avez besoin d'un dialogue qui ne fait pas partie de la pile de menus du moteur -- par exemple, un popup à l'intérieur d'un panneau existant -- étendez `ScriptedWidgetEventHandler` au lieu de `UIScriptedMenu`. Cela vous donne un contrôle total mais nécessite une gestion manuelle du focus et du cycle de vie.

### Patron de base

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

        // Verrouiller les entrées du jeu pour que le joueur ne puisse pas bouger/tirer
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

        // Restaurer les entrées du jeu -- DOIT correspondre au +1 de Show()
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
        // Surcharger dans les sous-classes ou définir un callback
    }
}
```

### Popup style VPP (patron OnWidgetScriptInit)

VPP Admin Tools et d'autres mods utilisent `OnWidgetScriptInit()` pour initialiser les popups. Le widget est créé par un parent, et la classe script est attachée via `scriptclass` dans le fichier layout :

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

        // Pousser le dialogue au-dessus des autres widgets
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
        // Traiter la saisie
    }
}
```

Le parent crée le popup en créant le widget layout comme enfant :

```c
Widget popup = GetGame().GetWorkspace().CreateWidgets(
    "MyMod/GUI/layouts/popup.layout", parentWidget);
```

Le moteur appelle automatiquement `OnWidgetScriptInit()` sur la classe script spécifiée dans l'attribut `scriptclass` du layout.

---

## Structure du layout de dialogue

Un layout de dialogue comporte typiquement trois couches : une racine plein écran pour intercepter les clics, un overlay semi-transparent pour assombrir, et le panneau de dialogue centré.

### Exemple de fichier layout

```
FrameWidget "DialogRoot" {
    size 1 1 0 0        // Plein écran
    halign fill
    valign fill

    // Overlay d'arrière-plan semi-transparent
    ImageWidget "Overlay" {
        size 1 1 0 0
        halign fill
        valign fill
        color "0 0 0 180"
    }

    // Panneau de dialogue centré
    FrameWidget "DialogPanel" {
        halign center
        valign center
        hexactsize 1
        vexactsize 1
        hexactpos  1
        vexactpos  1
        size 0 0 500 300   // Dialogue de 500x300 pixels

        // Barre de titre
        TextWidget "TitleText" {
            halign fill
            size 1 0 0 30
            text "Dialog Title"
            font "gui/fonts/MetronBook24"
        }

        // Zone de contenu
        MultilineTextWidget "ContentText" {
            position 0 0 0 35
            size 1 0 0 200
            halign fill
        }

        // Rangée de boutons en bas
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

### Principes clés du layout

1. **Racine plein écran** -- Le widget le plus externe couvre tout l'écran pour que les clics en dehors du dialogue soient interceptés.
2. **Overlay semi-transparent** -- Un `ImageWidget` ou panneau avec alpha (par ex. `color "0 0 0 180"`) assombrit l'arrière-plan, indiquant visuellement un état modal.
3. **Panneau centré** -- Utilisez `halign center` et `valign center` avec des tailles en pixels exactes pour des dimensions prévisibles.
4. **Alignement des boutons** -- Placez les boutons dans un conteneur horizontal en bas du panneau de dialogue.

---

## Patron de dialogue de confirmation

Un dialogue de confirmation réutilisable accepte un titre, un message et un callback. C'est le patron de dialogue le plus courant dans les mods DayZ.

### Implémentation

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

        // S'assurer que le dialogue s'affiche au-dessus des autres UI
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

        // Appeler la fonction callback sur l'objet cible
        GetGame().GameScript.CallFunction(
            m_CallbackTarget, m_CallbackFunc, null, confirmed);

        // Nettoyage -- différer la suppression pour éviter les problèmes
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

### Utilisation

```c
// Dans la classe appelante :
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

Le callback utilise `GameScript.CallFunction()` qui invoque une fonction par nom sur l'objet cible. C'est la méthode standard utilisée par les mods DayZ pour implémenter les callbacks de dialogues puisque Enforce Script ne supporte ni les closures ni les délégués.

---

## Patron de dialogue de saisie

Un dialogue de saisie ajoute un `EditBoxWidget` pour la saisie de texte avec validation.

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

            // Envoyer le résultat sous forme de Param2 : statut OK + texte
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
            // Masquer l'erreur quand l'utilisateur commence à taper
            m_ErrorText.Show(false);

            // Valider avec la touche Entrée
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

## Gestion du focus

La gestion du focus est l'aspect le plus critique de l'implémentation des dialogues. DayZ utilise un système de focus **à compteur de références** -- chaque `ChangeGameFocus(1)` doit être équilibré par un `ChangeGameFocus(-1)`.

### Comment ça fonctionne

```c
// Incrémenter le compteur de focus -- les entrées du jeu sont supprimées tant que le compteur > 0
GetGame().GetInput().ChangeGameFocus(1);

// Afficher le curseur de la souris
GetGame().GetUIManager().ShowUICursor(true);

// ... interaction avec le dialogue ...

// Décrémenter le compteur de focus -- les entrées du jeu reprennent quand le compteur atteint 0
GetGame().GetInput().ChangeGameFocus(-1);

// Masquer le curseur (seulement si aucun autre menu n'en a besoin)
GetGame().GetUIManager().ShowUICursor(false);
```

### Règles

1. **Chaque +1 doit avoir un -1 correspondant.** Si vous appelez `ChangeGameFocus(1)` dans `Show()`, vous devez appeler `ChangeGameFocus(-1)` dans `Hide()`, sans exception.

2. **Appelez -1 même sur les chemins d'erreur.** Si le dialogue est détruit de manière inattendue (mort du joueur, déconnexion du serveur), le destructeur doit quand même décrémenter. Mettez le nettoyage dans le destructeur comme filet de sécurité.

3. **UIScriptedMenu gère cela automatiquement.** Si vous étendez `UIScriptedMenu` et appelez `super.OnShow()` / `super.OnHide()`, le focus est géré pour vous. Ne le gérez manuellement que lorsque vous utilisez `ScriptedWidgetEventHandler`.

4. **Le focus par périphérique est optionnel.** Le moteur supporte le verrouillage du focus par périphérique (`INPUT_DEVICE_MOUSE`, `INPUT_DEVICE_KEYBOARD`, `INPUT_DEVICE_GAMEPAD`). Pour la plupart des dialogues de mods, un seul `ChangeGameFocus(1)` (sans argument de périphérique) verrouille toutes les entrées.

5. **ResetGameFocus() est une option nucléaire.** Cela force le compteur à zéro. Utilisez-le uniquement pour le nettoyage de haut niveau (par ex. en fermant un outil d'administration entier), jamais dans des classes de dialogue individuelles.

### Ce qui peut mal tourner

| Erreur | Symptôme |
|--------|----------|
| Oubli de `ChangeGameFocus(-1)` à la fermeture | Le joueur ne peut plus bouger, tirer ou interagir après la fermeture du dialogue |
| Appel de `-1` deux fois | Le compteur de focus devient négatif ; le prochain menu qui s'ouvre ne verrouillera pas correctement les entrées |
| Oubli de `ShowUICursor(false)` | Le curseur de la souris reste visible en permanence |
| Appel de `ShowUICursor(false)` quand un menu parent est encore ouvert | Le curseur disparaît alors que le menu parent est encore actif |

---

## Ordre Z et superposition

Quand un dialogue s'ouvre par-dessus une UI existante, il doit s'afficher au-dessus de tout le reste. DayZ fournit deux mécanismes :

### Ordre de tri des widgets

```c
// Pousser le widget au-dessus de tous les frères (valeur de tri 1024)
m_Root.SetSort(1024, true);
```

La méthode `SetSort()` définit la priorité de rendu. Des valeurs plus élevées s'affichent au-dessus. Le second paramètre (`true`) s'applique récursivement aux enfants. VPP Admin Tools utilise `SetSort(1024, true)` pour toutes les boîtes de dialogue.

### Priorité du layout (statique)

Dans les fichiers layout, vous pouvez définir la priorité directement :

```
FrameWidget "DialogRoot" {
    // Les valeurs plus élevées s'affichent au-dessus
    // UI normale : 0-100
    // Overlay :    998
    // Dialogue :   999
}
```

### Bonnes pratiques

- **Fond overlay** : Utilisez une valeur de tri élevée (par ex. 998) pour le fond semi-transparent.
- **Panneau de dialogue** : Utilisez une valeur de tri plus élevée (par ex. 999 ou 1024) pour le dialogue lui-même.
- **Dialogues empilés** : Si votre système supporte les dialogues imbriqués, incrémentez la valeur de tri pour chaque nouvelle couche de dialogue.

---

## Patrons courants

### Panneau à bascule (ouvrir/fermer avec la même touche)

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

### Échap pour fermer

```c
// Dans Update() d'un UIScriptedMenu :
override void Update(float timeslice)
{
    super.Update(timeslice);

    if (GetUApi().GetInputByID(UAUIBack).LocalPress())
    {
        Close();
    }
}

// Dans un ScriptedWidgetEventHandler (pas de boucle Update) :
// Vous devez interroger depuis une source de mise à jour externe, ou utiliser OnKeyDown :
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

### Clic extérieur pour fermer

Rendez le widget overlay plein écran cliquable. Lorsqu'il est cliqué, fermez le dialogue :

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

        // Enregistrer le gestionnaire sur les widgets overlay et panneau
        m_Root.SetHandler(this);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        // Si l'utilisateur a cliqué sur l'overlay (pas le panneau), fermer
        if (w == m_Overlay)
        {
            Hide();
            return true;
        }

        return false;
    }
}
```

### Callbacks de résultat de dialogue

Pour les dialogues qui doivent retourner des résultats complexes, utilisez `GameScript.CallFunctionParams()` avec des objets `Param` :

```c
// Envoi d'un résultat avec plusieurs valeurs
GetGame().GameScript.CallFunctionParams(
    m_CallbackTarget,
    m_CallbackFunc,
    null,
    new Param2<int, string>(RESULT_OK, inputText)
);

// Réception dans l'appelant
void OnDialogResult(int result, string text)
{
    if (result == RESULT_OK)
    {
        ProcessInput(text);
    }
}
```

C'est le même patron que celui utilisé par VPP Admin Tools pour son système de callback `VPPDialogBox`.

---

## UIScriptedWindow -- Fenêtres flottantes

DayZ dispose d'un second système intégré : `UIScriptedWindow`, pour les fenêtres flottantes qui existent aux côtés d'un `UIScriptedMenu`. Contrairement à `UIScriptedMenu`, les fenêtres sont suivies dans un dictionnaire statique et leurs événements sont routés à travers le menu actif.

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
        // Gérer les clics
        return false;
    }
}
```

Les fenêtres sont ouvertes et fermées via le `UIManager` :

```c
// Ouvrir
GetGame().GetUIManager().OpenWindow(MY_WINDOW_ID);

// Fermer
GetGame().GetUIManager().CloseWindow(MY_WINDOW_ID);

// Vérifier si ouverte
GetGame().GetUIManager().IsWindowOpened(MY_WINDOW_ID);
```

En pratique, la plupart des développeurs de mods utilisent des popups basés sur `ScriptedWidgetEventHandler` plutôt que `UIScriptedWindow`, car le système de fenêtres nécessite un enregistrement dans le switch-case du moteur dans `MissionBase` et les événements sont routés à travers le `UIScriptedMenu` actif. Le patron manuel est plus simple et plus flexible.

---

## Erreurs courantes

### 1. Ne pas restaurer le focus du jeu à la fermeture

**Le problème :** Le joueur ne peut plus bouger, tirer ou interagir après la fermeture du dialogue.

```c
// INCORRECT -- pas de restauration du focus
void CloseDialog()
{
    m_Root.Unlink();
    m_Root = null;
    // Le compteur de focus est toujours incrémenté !
}

// CORRECT -- toujours décrémenter
void CloseDialog()
{
    m_Root.Unlink();
    m_Root = null;
    GetGame().GetInput().ChangeGameFocus(-1);
    GetGame().GetUIManager().ShowUICursor(false);
}
```

### 2. Ne pas délier les widgets à la fermeture

**Le problème :** L'arbre de widgets reste en mémoire, les événements continuent de se déclencher, les fuites de mémoire s'accumulent.

```c
// INCORRECT -- juste masquer
void Hide()
{
    m_Root.Show(false);  // Le widget existe toujours et consomme de la mémoire
}

// CORRECT -- unlink détruit l'arbre de widgets
void Hide()
{
    if (m_Root)
    {
        m_Root.Unlink();
        m_Root = null;
    }
}
```

Si vous devez afficher/masquer le même dialogue de manière répétée, garder le widget et utiliser `Show(true/false)` est correct -- assurez-vous simplement d'appeler `Unlink()` dans le destructeur.

### 3. Le dialogue s'affiche derrière d'autres UI

**Le problème :** Le dialogue est invisible ou partiellement masqué parce que d'autres widgets ont une priorité de rendu plus élevée.

**La solution :** Utilisez `SetSort()` pour pousser le dialogue au-dessus de tout :

```c
m_Root.SetSort(1024, true);
```

### 4. Plusieurs dialogues empilant les changements de focus

**Le problème :** Ouverture du dialogue A (+1), puis du dialogue B (+1), puis fermeture de B (-1) -- le compteur de focus est toujours à 1, donc les entrées sont toujours verrouillées même si l'utilisateur ne voit aucun dialogue.

**La solution :** Suivre si chaque instance de dialogue a verrouillé le focus, et ne décrémenter que si c'est le cas :

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

### 5. Appeler Close() ou Delete dans le constructeur

**Le problème :** Appeler `Close()` ou `delete this` pendant la construction provoque des crashs ou un comportement indéfini parce que l'objet n'est pas entièrement initialisé.

**La solution :** Différer la fermeture en utilisant `CallLater` :

```c
void MyDialog()
{
    // ...
    if (someErrorCondition)
    {
        // INCORRECT : Close(); ou delete this;
        // CORRECT :
        GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(
            DeferredClose, 0, false);
    }
}

void DeferredClose()
{
    Close();  // ou : delete this;
}
```

### 6. Ne pas vérifier la nullité avant les opérations sur les widgets

**Le problème :** Crash lors de l'accès à un widget déjà détruit ou jamais créé.

```c
// INCORRECT
void UpdateMessage(string text)
{
    m_MessageText.SetText(text);  // Crash si m_MessageText est null
}

// CORRECT
void UpdateMessage(string text)
{
    if (m_MessageText)
        m_MessageText.SetText(text);
}
```

---

## Résumé

| Approche | Classe de base | Gestion du focus | Idéal pour |
|----------|---------------|-----------------|------------|
| Pile de menus du moteur | `UIScriptedMenu` | Automatique via `LockControls`/`UnlockControls` | Menus plein écran, dialogues majeurs |
| Dialogue natif | `ShowDialog()` | Automatique | Invites simples Oui/Non/OK |
| Popup manuel | `ScriptedWidgetEventHandler` | Manuel `ChangeGameFocus` | Popups dans un panneau, dialogues personnalisés |
| Fenêtre flottante | `UIScriptedWindow` | Via le menu parent | Fenêtres d'outils aux côtés d'un menu |

La règle d'or : **chaque `ChangeGameFocus(1)` doit être apparié à un `ChangeGameFocus(-1)`.** Mettez le nettoyage du focus dans votre destructeur comme filet de sécurité, appelez toujours `Unlink()` sur les widgets quand vous avez terminé, et utilisez `SetSort()` pour vous assurer que votre dialogue s'affiche au-dessus.

---

## Prochaines étapes

- [3.6 Gestion des événements](06-event-handling.md) -- Gérer les clics, le survol, les événements clavier dans les dialogues
- [3.5 Création programmatique de widgets](05-programmatic-widgets.md) -- Construire le contenu des dialogues dynamiquement en code
