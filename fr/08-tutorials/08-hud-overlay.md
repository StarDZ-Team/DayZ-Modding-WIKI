# Chapitre 8.8 : Construire une surcouche HUD

[Accueil](../README.md) | [<< Précédent : Publier sur le Steam Workshop](07-publishing-workshop.md) | **Construire une surcouche HUD** | [Suivant : Modèle de mod professionnel >>](09-professional-template.md)

---

> **Résumé :** Ce tutoriel vous guide à travers la construction d'une surcouche HUD personnalisée qui affiche les informations du serveur dans le coin supérieur droit de l'écran. Vous créerez un fichier de disposition, écrirez une classe contrôleur, vous connecterez au cycle de vie de la mission, demanderez des données au serveur via RPC, ajouterez une touche de bascule, et peaufinerez le résultat avec des animations de fondu et une visibilité intelligente. À la fin, vous aurez un HUD d'informations serveur non intrusif affichant le nom du serveur, le nombre de joueurs et l'heure en jeu -- plus une solide compréhension du fonctionnement des surcouches HUD dans DayZ.

---

## Table des matières

- [Ce que nous construisons](#ce-que-nous-construisons)
- [Prérequis](#prérequis)
- [Structure du mod](#structure-du-mod)
- [Étape 1 : Créer le fichier de disposition](#étape-1--créer-le-fichier-de-disposition)
- [Étape 2 : Créer la classe contrôleur du HUD](#étape-2--créer-la-classe-contrôleur-du-hud)
- [Étape 3 : Se connecter à MissionGameplay](#étape-3--se-connecter-à-missiongameplay)
- [Étape 4 : Demander des données au serveur](#étape-4--demander-des-données-au-serveur)
- [Étape 5 : Ajouter une bascule avec raccourci clavier](#étape-5--ajouter-une-bascule-avec-raccourci-clavier)
- [Étape 6 : Finitions](#étape-6--finitions)
- [Référence complète du code](#référence-complète-du-code)
- [Étendre le HUD](#étendre-le-hud)
- [Erreurs courantes](#erreurs-courantes)
- [Prochaines étapes](#prochaines-étapes)

---

## Ce que nous construisons

Un petit panneau semi-transparent ancré dans le coin supérieur droit de l'écran qui affiche trois lignes d'informations :

```
  Aurora Survival [Official]
  Players: 24 / 60
  Time: 14:35
```

Le panneau se situe sous les indicateurs de statut et au-dessus de la barre rapide. Il se met à jour une fois par seconde (pas à chaque frame), apparaît en fondu quand il est affiché et disparaît en fondu quand il est masqué, et se cache automatiquement quand l'inventaire ou le menu pause est ouvert. Le joueur peut le basculer avec une touche configurable (par défaut : **F7**).

### Résultat attendu

Une fois chargé, vous verrez un rectangle semi-transparent foncé dans la zone supérieure droite de l'écran. Un texte blanc affiche le nom du serveur sur la première ligne, le nombre actuel de joueurs sur la deuxième ligne, et l'heure du monde en jeu sur la troisième ligne. Appuyer sur F7 le fait disparaître en fondu ; appuyer à nouveau sur F7 le fait réapparaître en fondu.

---

## Prérequis

- Une structure de mod fonctionnelle (complétez d'abord le [Chapitre 8.1](01-first-mod.md))
- Compréhension de base de la syntaxe Enforce Script
- Familiarité avec le modèle client-serveur de DayZ (le HUD s'exécute sur le client ; le nombre de joueurs vient du serveur)

---

## Structure du mod

Créez l'arborescence de répertoires suivante :

```
ServerInfoHUD/
    mod.cpp
    Scripts/
        config.cpp
        data/
            inputs.xml
        3_Game/
            ServerInfoHUD/
                ServerInfoRPC.c
        4_World/
            ServerInfoHUD/
                ServerInfoServer.c
        5_Mission/
            ServerInfoHUD/
                ServerInfoHUD.c
                MissionHook.c
    GUI/
        layouts/
            ServerInfoHUD.layout
```

La couche `3_Game` définit les constantes (notre identifiant RPC). La couche `4_World` gère la réponse côté serveur. La couche `5_Mission` contient la classe HUD et le hook de mission. Le fichier de disposition définit l'arbre de widgets.

---

## Étape 1 : Créer le fichier de disposition

Les fichiers de disposition (`.layout`) définissent la hiérarchie des widgets en XML. Le système GUI de DayZ utilise un modèle de coordonnées où chaque widget a une position et une taille exprimées en valeurs proportionnelles (0.0 à 1.0 du parent) plus des décalages en pixels.

### `GUI/layouts/ServerInfoHUD.layout`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<layoutset>
  <children>
    <!-- Cadre racine : couvre tout l'écran, ne consomme pas les entrées -->
    <Widget name="ServerInfoRoot" type="FrameWidgetClass">
      <Attribute name="position" value="0 0" />
      <Attribute name="size" value="1 1" />
      <Attribute name="halign" value="0" />
      <Attribute name="valign" value="0" />
      <Attribute name="hexactpos" value="0" />
      <Attribute name="vexactpos" value="0" />
      <Attribute name="hexactsize" value="0" />
      <Attribute name="vexactsize" value="0" />
      <children>
        <!-- Panneau de fond : coin supérieur droit -->
        <Widget name="ServerInfoPanel" type="ImageWidgetClass">
          <Attribute name="position" value="1 0" />
          <Attribute name="size" value="220 70" />
          <Attribute name="halign" value="2" />
          <Attribute name="valign" value="0" />
          <Attribute name="hexactpos" value="0" />
          <Attribute name="vexactpos" value="1" />
          <Attribute name="hexactsize" value="1" />
          <Attribute name="vexactsize" value="1" />
          <Attribute name="color" value="0 0 0 0.55" />
          <children>
            <!-- Texte du nom du serveur -->
            <Widget name="ServerNameText" type="TextWidgetClass">
              <Attribute name="position" value="8 6" />
              <Attribute name="size" value="204 20" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="14" />
              <Attribute name="text" value="Server Name" />
              <Attribute name="color" value="1 1 1 0.9" />
              <Attribute name="halign" value="0" />
              <Attribute name="valign" value="0" />
            </Widget>
            <!-- Texte du nombre de joueurs -->
            <Widget name="PlayerCountText" type="TextWidgetClass">
              <Attribute name="position" value="8 28" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Players: - / -" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
              <Attribute name="halign" value="0" />
              <Attribute name="valign" value="0" />
            </Widget>
            <!-- Texte de l'heure en jeu -->
            <Widget name="TimeText" type="TextWidgetClass">
              <Attribute name="position" value="8 48" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Time: --:--" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
              <Attribute name="halign" value="0" />
              <Attribute name="valign" value="0" />
            </Widget>
          </children>
        </Widget>
      </children>
    </Widget>
  </children>
</layoutset>
```

### Concepts clés de la disposition

| Attribut | Signification |
|----------|---------------|
| `halign="2"` | Alignement horizontal : **droite**. Le widget s'ancre au bord droit de son parent. |
| `valign="0"` | Alignement vertical : **haut**. |
| `hexactpos="0"` + `vexactpos="1"` | La position horizontale est proportionnelle (1.0 = bord droit), la position verticale est en pixels. |
| `hexactsize="1"` + `vexactsize="1"` | La largeur et la hauteur sont en pixels (220 x 70). |
| `color="0 0 0 0.55"` | RGBA en flottants. Noir à 55% d'opacité pour le panneau de fond. |

Le `ServerInfoPanel` est positionné à X proportionnel=1.0 (bord droit) avec `halign="2"` (aligné à droite), donc le bord droit du panneau touche le côté droit de l'écran. La position Y est à 0 pixels du haut. Cela place notre HUD dans le coin supérieur droit.

**Pourquoi des tailles en pixels pour le panneau ?** Le dimensionnement proportionnel ferait que le panneau s'adapte avec la résolution, mais pour les petits widgets d'information vous voulez une empreinte fixe en pixels pour que le texte reste lisible à toutes les résolutions.

---

## Étape 2 : Créer la classe contrôleur du HUD

La classe contrôleur charge la disposition, trouve les widgets par nom et expose des méthodes pour mettre à jour le texte affiché. Elle étend `ScriptedWidgetEventHandler` pour pouvoir recevoir des événements de widgets si nécessaire ultérieurement.

### `Scripts/5_Mission/ServerInfoHUD/ServerInfoHUD.c`

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected Widget m_Panel;
    protected TextWidget m_ServerNameText;
    protected TextWidget m_PlayerCountText;
    protected TextWidget m_TimeText;

    protected bool m_IsVisible;
    protected float m_UpdateTimer;

    // Fréquence de rafraîchissement des données affichées (secondes)
    static const float UPDATE_INTERVAL = 1.0;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
    }

    void ~ServerInfoHUD()
    {
        Destroy();
    }

    // Créer et afficher le HUD
    void Init()
    {
        if (m_Root)
            return;

        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout"
        );

        if (!m_Root)
        {
            Print("[ServerInfoHUD] ERROR: Failed to load layout file.");
            return;
        }

        m_Panel = m_Root.FindAnyWidget("ServerInfoPanel");
        m_ServerNameText = TextWidget.Cast(
            m_Root.FindAnyWidget("ServerNameText")
        );
        m_PlayerCountText = TextWidget.Cast(
            m_Root.FindAnyWidget("PlayerCountText")
        );
        m_TimeText = TextWidget.Cast(
            m_Root.FindAnyWidget("TimeText")
        );

        m_Root.Show(true);
        m_IsVisible = true;

        // Demander les données initiales au serveur
        RequestServerInfo();
    }

    // Supprimer tous les widgets
    void Destroy()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = NULL;
        }
    }

    // Appelé chaque frame depuis MissionGameplay.OnUpdate
    void Update(float timeslice)
    {
        if (!m_Root)
            return;

        if (!m_IsVisible)
            return;

        m_UpdateTimer += timeslice;

        if (m_UpdateTimer >= UPDATE_INTERVAL)
        {
            m_UpdateTimer = 0;
            RefreshTime();
            RequestServerInfo();
        }
    }

    // Mettre à jour l'affichage de l'heure en jeu (côté client, pas de RPC nécessaire)
    protected void RefreshTime()
    {
        if (!m_TimeText)
            return;

        int year, month, day, hour, minute;
        GetGame().GetWorld().GetDate(year, month, day, hour, minute);

        string hourStr = hour.ToString();
        string minStr = minute.ToString();

        if (hour < 10)
            hourStr = "0" + hourStr;

        if (minute < 10)
            minStr = "0" + minStr;

        m_TimeText.SetText("Time: " + hourStr + ":" + minStr);
    }

    // Envoyer un RPC au serveur demandant le nombre de joueurs et le nom du serveur
    protected void RequestServerInfo()
    {
        if (!GetGame().IsMultiplayer())
        {
            // Mode hors ligne : afficher simplement les infos locales
            SetServerName("Offline Mode");
            SetPlayerCount(1, 1);
            return;
        }

        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        ScriptRPC rpc = new ScriptRPC();
        rpc.Send(player, SIH_RPC_REQUEST_INFO, true, NULL);
    }

    // --- Setters appelés quand les données arrivent ---

    void SetServerName(string name)
    {
        if (m_ServerNameText)
            m_ServerNameText.SetText(name);
    }

    void SetPlayerCount(int current, int max)
    {
        if (m_PlayerCountText)
        {
            string text = "Players: " + current.ToString()
                + " / " + max.ToString();
            m_PlayerCountText.SetText(text);
        }
    }

    // Basculer la visibilité
    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (m_Root)
            m_Root.Show(m_IsVisible);
    }

    // Masquer quand les menus sont ouverts
    void SetMenuState(bool menuOpen)
    {
        if (!m_Root)
            return;

        if (menuOpen)
        {
            m_Root.Show(false);
        }
        else if (m_IsVisible)
        {
            m_Root.Show(true);
        }
    }

    bool IsVisible()
    {
        return m_IsVisible;
    }

    Widget GetRoot()
    {
        return m_Root;
    }
};
```

### Détails importants

1. **Chemin de `CreateWidgets`** : Le chemin est relatif à la racine du mod. Puisque nous empaquetons le dossier `GUI/` dans le PBO, le moteur résout `ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout` en utilisant le préfixe du mod.
2. **`FindAnyWidget`** : Recherche récursivement dans l'arbre de widgets par nom. Vérifiez toujours NULL après le cast.
3. **`Widget.Unlink()`** : Supprime proprement le widget et tous ses enfants de l'arbre UI. Appelez toujours ceci lors du nettoyage.
4. **Patron d'accumulateur de temps** : Nous ajoutons `timeslice` à chaque frame et n'agissons que quand le temps accumulé dépasse `UPDATE_INTERVAL`. Cela évite de faire du travail à chaque frame.

---

## Étape 3 : Se connecter à MissionGameplay

La classe `MissionGameplay` est le contrôleur de mission côté client. Nous utilisons `modded class` pour injecter notre HUD dans son cycle de vie sans remplacer le fichier vanilla.

### `Scripts/5_Mission/ServerInfoHUD/MissionHook.c`

```c
modded class MissionGameplay
{
    protected ref ServerInfoHUD m_ServerInfoHUD;

    override void OnInit()
    {
        super.OnInit();

        // Créer la surcouche HUD
        m_ServerInfoHUD = new ServerInfoHUD();
        m_ServerInfoHUD.Init();
    }

    override void OnMissionFinish()
    {
        // Nettoyer AVANT d'appeler super
        if (m_ServerInfoHUD)
        {
            m_ServerInfoHUD.Destroy();
            m_ServerInfoHUD = NULL;
        }

        super.OnMissionFinish();
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (!m_ServerInfoHUD)
            return;

        // Masquer le HUD quand l'inventaire ou un menu est ouvert
        UIManager uiMgr = GetGame().GetUIManager();
        bool menuOpen = false;

        if (uiMgr)
        {
            UIScriptedMenu topMenu = uiMgr.GetMenu();
            if (topMenu)
                menuOpen = true;
        }

        m_ServerInfoHUD.SetMenuState(menuOpen);

        // Mettre à jour les données du HUD (limité en interne)
        m_ServerInfoHUD.Update(timeslice);

        // Vérifier la touche de bascule
        Input input = GetGame().GetInput();
        if (input)
        {
            if (GetUApi().GetInputByName("UAServerInfoToggle").LocalPress())
            {
                m_ServerInfoHUD.ToggleVisibility();
            }
        }
    }

    // Accesseur pour que le gestionnaire RPC puisse atteindre le HUD
    ServerInfoHUD GetServerInfoHUD()
    {
        return m_ServerInfoHUD;
    }
};
```

### Pourquoi ce patron fonctionne

- **`OnInit`** s'exécute une fois quand le joueur entre en gameplay. Nous créons et initialisons le HUD ici.
- **`OnUpdate`** s'exécute à chaque frame. Nous passons `timeslice` au HUD, qui limite en interne à une fois par seconde. Nous vérifions aussi l'appui sur la touche de bascule et la visibilité des menus ici.
- **`OnMissionFinish`** s'exécute quand le joueur se déconnecte ou que la mission se termine. Nous détruisons nos widgets ici pour éviter les fuites de mémoire.

### Règle critique : Toujours nettoyer

Si vous oubliez de détruire vos widgets dans `OnMissionFinish`, la racine du widget fuira dans la session suivante. Après quelques changements de serveur, le joueur se retrouve avec des widgets fantômes empilés consommant de la mémoire. Associez toujours `Init()` avec `Destroy()`.

---

## Étape 4 : Demander des données au serveur

Le nombre de joueurs n'est connu que sur le serveur. Nous avons besoin d'un simple aller-retour RPC (Remote Procedure Call) : le client envoie une requête, le serveur lit les données et les renvoie.

### Étape 4a : Définir l'identifiant RPC

Les identifiants RPC doivent être uniques parmi tous les mods. Nous définissons le nôtre dans la couche `3_Game` pour que le code client et serveur puissent le référencer.

### `Scripts/3_Game/ServerInfoHUD/ServerInfoRPC.c`

```c
// Identifiants RPC pour le Server Info HUD.
// Utiliser des numéros élevés pour éviter les conflits avec vanilla et les autres mods.

const int SIH_RPC_REQUEST_INFO = 72810;
const int SIH_RPC_RESPONSE_INFO = 72811;
```

**Pourquoi `3_Game` ?** Les constantes et énumérations appartiennent à la couche la plus basse accessible par le client et le serveur. La couche `3_Game` se charge avant `4_World` et `5_Mission`, donc les deux côtés peuvent voir ces valeurs.

### Étape 4b : Gestionnaire côté serveur

Le serveur écoute `SIH_RPC_REQUEST_INFO`, rassemble les données et répond avec `SIH_RPC_RESPONSE_INFO`.

### `Scripts/4_World/ServerInfoHUD/ServerInfoServer.c`

```c
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (!GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_REQUEST_INFO)
        {
            HandleServerInfoRequest(sender);
        }
    }

    protected void HandleServerInfoRequest(PlayerIdentity sender)
    {
        if (!sender)
            return;

        // Rassembler les infos du serveur
        string serverName = "";
        GetGame().GetHostName(serverName);

        int playerCount = 0;
        int maxPlayers = 0;

        // Obtenir la liste des joueurs
        ref array<Man> players = new array<Man>();
        GetGame().GetPlayers(players);
        playerCount = players.Count();

        // Nombre maximum de joueurs depuis la configuration serveur
        maxPlayers = GetGame().GetMaxPlayers();

        // Renvoyer les données au client demandeur
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(serverName);
        rpc.Write(playerCount);
        rpc.Write(maxPlayers);
        rpc.Send(this, SIH_RPC_RESPONSE_INFO, true, sender);
    }
};
```

### Étape 4c : Récepteur RPC côté client

Le client reçoit la réponse et met à jour le HUD.

Ajoutez ceci au même fichier `ServerInfoHUD.c` (en bas, en dehors de la classe), ou créez un fichier séparé dans `5_Mission/ServerInfoHUD/` :

Ajoutez ce qui suit **en dessous** de la classe `ServerInfoHUD` dans `ServerInfoHUD.c` :

```c
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_RESPONSE_INFO)
        {
            HandleServerInfoResponse(ctx);
        }
    }

    protected void HandleServerInfoResponse(ParamsReadContext ctx)
    {
        string serverName;
        int playerCount;
        int maxPlayers;

        if (!ctx.Read(serverName))
            return;
        if (!ctx.Read(playerCount))
            return;
        if (!ctx.Read(maxPlayers))
            return;

        // Accéder au HUD via MissionGameplay
        MissionGameplay mission = MissionGameplay.Cast(
            GetGame().GetMission()
        );

        if (!mission)
            return;

        ServerInfoHUD hud = mission.GetServerInfoHUD();
        if (!hud)
            return;

        hud.SetServerName(serverName);
        hud.SetPlayerCount(playerCount, maxPlayers);
    }
};
```

### Comment fonctionne le flux RPC

```
CLIENT                           SERVEUR
  |                                |
  |--- SIH_RPC_REQUEST_INFO ----->|
  |                                | lit serverName, playerCount, maxPlayers
  |<-- SIH_RPC_RESPONSE_INFO ----|
  |                                |
  | met à jour le texte du HUD   |
```

Le client envoie la requête une fois par seconde (limité par le minuteur de mise à jour). Le serveur répond avec trois valeurs empaquetées dans le contexte RPC. Le client les lit dans le même ordre qu'elles ont été écrites.

**Important :** `rpc.Write()` et `ctx.Read()` doivent utiliser les mêmes types dans le même ordre. Si le serveur écrit une `string` puis deux valeurs `int`, le client doit lire une `string` puis deux valeurs `int`.

---

## Étape 5 : Ajouter une bascule avec raccourci clavier

### Étape 5a : Définir l'entrée dans `inputs.xml`

DayZ utilise `inputs.xml` pour enregistrer des actions de touches personnalisées. Le fichier doit être placé dans `Scripts/data/inputs.xml` et référencé depuis `config.cpp`.

### `Scripts/data/inputs.xml`

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAServerInfoToggle" loc="Toggle Server Info HUD" />
        </actions>
    </inputs>
    <preset>
        <input name="UAServerInfoToggle">
            <btn name="kF7" />
        </input>
    </preset>
</modded_inputs>
```

| Élément | Objectif |
|---------|----------|
| `<actions>` | Déclare l'action d'entrée par nom. `loc` est la chaîne d'affichage montrée dans le menu des options de raccourcis clavier. |
| `<preset>` | Assigne la touche par défaut. `kF7` correspond à la touche F7. |

### Étape 5b : Référencer `inputs.xml` dans `config.cpp`

Votre `config.cpp` doit indiquer au moteur où trouver le fichier d'entrées. Ajoutez une entrée `inputs` dans le bloc `defs` :

```cpp
class defs
{
    class gameScriptModule
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/3_Game" };
    };

    class worldScriptModule
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/4_World" };
    };

    class missionScriptModule
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/5_Mission" };
    };

    class inputs
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/data" };
    };
};
```

### Étape 5c : Lire l'appui de touche

Nous gérons déjà cela dans le hook `MissionGameplay` de l'Étape 3 :

```c
if (GetUApi().GetInputByName("UAServerInfoToggle").LocalPress())
{
    m_ServerInfoHUD.ToggleVisibility();
}
```

`GetUApi()` renvoie le singleton de l'API d'entrée. `GetInputByName` recherche notre action enregistrée. `LocalPress()` renvoie `true` pour exactement une frame quand la touche est enfoncée.

### Référence des noms de touches

Noms de touches courants pour `<btn>` :

| Nom de touche | Touche |
|---------------|--------|
| `kF1` à `kF12` | Touches de fonction |
| `kH`, `kI`, etc. | Touches de lettres |
| `kNumpad0` à `kNumpad9` | Pavé numérique |
| `kLControl` | Contrôle gauche |
| `kLShift` | Shift gauche |
| `kLAlt` | Alt gauche |

Les combinaisons de modificateurs utilisent l'imbrication :

```xml
<input name="UAServerInfoToggle">
    <btn name="kLControl">
        <btn name="kH" />
    </btn>
</input>
```

Cela signifie "maintenir Contrôle gauche et appuyer sur H."

---

## Étape 6 : Finitions

### 6a : Animation de fondu entrant/sortant

DayZ fournit `WidgetFadeTimer` pour des transitions d'opacité fluides. Mettez à jour la classe `ServerInfoHUD` pour l'utiliser :

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    // ... champs existants ...

    protected ref WidgetFadeTimer m_FadeTimer;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
        m_FadeTimer = new WidgetFadeTimer();
    }

    // Remplacer la méthode ToggleVisibility :
    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (!m_Root)
            return;

        if (m_IsVisible)
        {
            m_Root.Show(true);
            m_FadeTimer.FadeIn(m_Root, 0.3);
        }
        else
        {
            m_FadeTimer.FadeOut(m_Root, 0.3);
        }
    }

    // ... reste de la classe ...
};
```

`FadeIn(widget, durée)` anime l'opacité du widget de 0 à 1 sur la durée donnée en secondes. `FadeOut` passe de 1 à 0 et masque le widget une fois terminé.

### 6b : Panneau de fond avec alpha

Nous avons déjà défini cela dans la disposition (`color="0 0 0 0.55"`), donnant une surcouche sombre à 55% d'opacité. Si vous voulez ajuster l'alpha à l'exécution :

```c
void SetBackgroundAlpha(float alpha)
{
    if (m_Panel)
    {
        int color = ARGB(
            (int)(alpha * 255),
            0, 0, 0
        );
        m_Panel.SetColor(color);
    }
}
```

La fonction `ARGB()` prend des valeurs entières 0-255 pour l'alpha, le rouge, le vert et le bleu.

### 6c : Choix de polices et de couleurs

DayZ inclut plusieurs polices que vous pouvez référencer dans les dispositions :

| Chemin de police | Style |
|-----------------|-------|
| `gui/fonts/MetronBook` | Sans-serif propre (utilisé dans le HUD vanilla) |
| `gui/fonts/MetronMedium` | Version plus grasse de MetronBook |
| `gui/fonts/Metron` | Variante la plus fine |
| `gui/fonts/luxuriousscript` | Script décoratif (à éviter pour le HUD) |

Pour changer la couleur du texte à l'exécution :

```c
void SetTextColor(TextWidget widget, int r, int g, int b, int a)
{
    if (widget)
        widget.SetColor(ARGB(a, r, g, b));
}
```

### 6d : Respecter les autres interfaces

Notre `MissionHook.c` détecte déjà quand un menu est ouvert et appelle `SetMenuState(true)`. Voici une approche plus complète qui vérifie spécifiquement l'inventaire :

```c
// Dans la surcharge OnUpdate de MissionGameplay moddé :
bool menuOpen = false;

UIManager uiMgr = GetGame().GetUIManager();
if (uiMgr)
{
    UIScriptedMenu topMenu = uiMgr.GetMenu();
    if (topMenu)
        menuOpen = true;
}

// Vérifier aussi si l'inventaire est ouvert
if (uiMgr && uiMgr.FindMenu(MENU_INVENTORY))
    menuOpen = true;

m_ServerInfoHUD.SetMenuState(menuOpen);
```

Cela garantit que votre HUD se cache derrière l'écran d'inventaire, le menu pause, l'écran d'options et tout autre menu scripté.

---

## Référence complète du code

Ci-dessous, chaque fichier du mod, dans sa forme finale avec toutes les finitions appliquées.

### Fichier 1 : `ServerInfoHUD/mod.cpp`

```cpp
name = "Server Info HUD";
author = "YourName";
version = "1.0";
overview = "Displays server name, player count, and in-game time.";
```

### Fichier 2 : `ServerInfoHUD/Scripts/config.cpp`

```cpp
class CfgPatches
{
    class ServerInfoHUD_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Scripts"
        };
    };
};

class CfgMods
{
    class ServerInfoHUD
    {
        dir = "ServerInfoHUD";
        name = "Server Info HUD";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/3_Game" };
            };

            class worldScriptModule
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/4_World" };
            };

            class missionScriptModule
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/5_Mission" };
            };

            class inputs
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/data" };
            };
        };
    };
};
```

### Fichier 3 : `ServerInfoHUD/Scripts/data/inputs.xml`

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAServerInfoToggle" loc="Toggle Server Info HUD" />
        </actions>
    </inputs>
    <preset>
        <input name="UAServerInfoToggle">
            <btn name="kF7" />
        </input>
    </preset>
</modded_inputs>
```

### Fichier 4 : `ServerInfoHUD/Scripts/3_Game/ServerInfoHUD/ServerInfoRPC.c`

```c
// Identifiants RPC pour le Server Info HUD.
// Utiliser des numéros élevés pour éviter les collisions avec les ERPCs vanilla et les autres mods.

const int SIH_RPC_REQUEST_INFO = 72810;
const int SIH_RPC_RESPONSE_INFO = 72811;
```

### Fichier 5 : `ServerInfoHUD/Scripts/4_World/ServerInfoHUD/ServerInfoServer.c`

```c
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        // Seul le serveur gère ce RPC
        if (!GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_REQUEST_INFO)
        {
            HandleServerInfoRequest(sender);
        }
    }

    protected void HandleServerInfoRequest(PlayerIdentity sender)
    {
        if (!sender)
            return;

        // Obtenir le nom du serveur
        string serverName = "";
        GetGame().GetHostName(serverName);

        // Compter les joueurs
        ref array<Man> players = new array<Man>();
        GetGame().GetPlayers(players);
        int playerCount = players.Count();

        // Obtenir le nombre maximum d'emplacements joueur
        int maxPlayers = GetGame().GetMaxPlayers();

        // Renvoyer les données au client demandeur
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(serverName);
        rpc.Write(playerCount);
        rpc.Write(maxPlayers);
        rpc.Send(this, SIH_RPC_RESPONSE_INFO, true, sender);
    }
};
```

### Fichier 6 : `ServerInfoHUD/Scripts/5_Mission/ServerInfoHUD/ServerInfoHUD.c`

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected Widget m_Panel;
    protected TextWidget m_ServerNameText;
    protected TextWidget m_PlayerCountText;
    protected TextWidget m_TimeText;

    protected bool m_IsVisible;
    protected float m_UpdateTimer;
    protected ref WidgetFadeTimer m_FadeTimer;

    static const float UPDATE_INTERVAL = 1.0;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
        m_FadeTimer = new WidgetFadeTimer();
    }

    void ~ServerInfoHUD()
    {
        Destroy();
    }

    void Init()
    {
        if (m_Root)
            return;

        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout"
        );

        if (!m_Root)
        {
            Print("[ServerInfoHUD] ERROR: Failed to load layout.");
            return;
        }

        m_Panel = m_Root.FindAnyWidget("ServerInfoPanel");
        m_ServerNameText = TextWidget.Cast(
            m_Root.FindAnyWidget("ServerNameText")
        );
        m_PlayerCountText = TextWidget.Cast(
            m_Root.FindAnyWidget("PlayerCountText")
        );
        m_TimeText = TextWidget.Cast(
            m_Root.FindAnyWidget("TimeText")
        );

        m_Root.Show(true);
        m_IsVisible = true;

        RequestServerInfo();
    }

    void Destroy()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = NULL;
        }
    }

    void Update(float timeslice)
    {
        if (!m_Root || !m_IsVisible)
            return;

        m_UpdateTimer += timeslice;

        if (m_UpdateTimer >= UPDATE_INTERVAL)
        {
            m_UpdateTimer = 0;
            RefreshTime();
            RequestServerInfo();
        }
    }

    protected void RefreshTime()
    {
        if (!m_TimeText)
            return;

        int year, month, day, hour, minute;
        GetGame().GetWorld().GetDate(year, month, day, hour, minute);

        string hourStr = hour.ToString();
        string minStr = minute.ToString();

        if (hour < 10)
            hourStr = "0" + hourStr;

        if (minute < 10)
            minStr = "0" + minStr;

        m_TimeText.SetText("Time: " + hourStr + ":" + minStr);
    }

    protected void RequestServerInfo()
    {
        if (!GetGame().IsMultiplayer())
        {
            SetServerName("Offline Mode");
            SetPlayerCount(1, 1);
            return;
        }

        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        ScriptRPC rpc = new ScriptRPC();
        rpc.Send(player, SIH_RPC_REQUEST_INFO, true, NULL);
    }

    void SetServerName(string name)
    {
        if (m_ServerNameText)
            m_ServerNameText.SetText(name);
    }

    void SetPlayerCount(int current, int max)
    {
        if (m_PlayerCountText)
        {
            string text = "Players: " + current.ToString()
                + " / " + max.ToString();
            m_PlayerCountText.SetText(text);
        }
    }

    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (!m_Root)
            return;

        if (m_IsVisible)
        {
            m_Root.Show(true);
            m_FadeTimer.FadeIn(m_Root, 0.3);
        }
        else
        {
            m_FadeTimer.FadeOut(m_Root, 0.3);
        }
    }

    void SetMenuState(bool menuOpen)
    {
        if (!m_Root)
            return;

        if (menuOpen)
        {
            m_Root.Show(false);
        }
        else if (m_IsVisible)
        {
            m_Root.Show(true);
        }
    }

    bool IsVisible()
    {
        return m_IsVisible;
    }

    Widget GetRoot()
    {
        return m_Root;
    }
};

// -----------------------------------------------
// Récepteur RPC côté client
// -----------------------------------------------
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_RESPONSE_INFO)
        {
            HandleServerInfoResponse(ctx);
        }
    }

    protected void HandleServerInfoResponse(ParamsReadContext ctx)
    {
        string serverName;
        int playerCount;
        int maxPlayers;

        if (!ctx.Read(serverName))
            return;
        if (!ctx.Read(playerCount))
            return;
        if (!ctx.Read(maxPlayers))
            return;

        MissionGameplay mission = MissionGameplay.Cast(
            GetGame().GetMission()
        );
        if (!mission)
            return;

        ServerInfoHUD hud = mission.GetServerInfoHUD();
        if (!hud)
            return;

        hud.SetServerName(serverName);
        hud.SetPlayerCount(playerCount, maxPlayers);
    }
};
```

### Fichier 7 : `ServerInfoHUD/Scripts/5_Mission/ServerInfoHUD/MissionHook.c`

```c
modded class MissionGameplay
{
    protected ref ServerInfoHUD m_ServerInfoHUD;

    override void OnInit()
    {
        super.OnInit();

        m_ServerInfoHUD = new ServerInfoHUD();
        m_ServerInfoHUD.Init();
    }

    override void OnMissionFinish()
    {
        if (m_ServerInfoHUD)
        {
            m_ServerInfoHUD.Destroy();
            m_ServerInfoHUD = NULL;
        }

        super.OnMissionFinish();
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (!m_ServerInfoHUD)
            return;

        // Détecter les menus ouverts
        bool menuOpen = false;
        UIManager uiMgr = GetGame().GetUIManager();
        if (uiMgr)
        {
            UIScriptedMenu topMenu = uiMgr.GetMenu();
            if (topMenu)
                menuOpen = true;
        }

        m_ServerInfoHUD.SetMenuState(menuOpen);
        m_ServerInfoHUD.Update(timeslice);

        // Touche de bascule
        if (GetUApi().GetInputByName(
            "UAServerInfoToggle"
        ).LocalPress())
        {
            m_ServerInfoHUD.ToggleVisibility();
        }
    }

    ServerInfoHUD GetServerInfoHUD()
    {
        return m_ServerInfoHUD;
    }
};
```

### Fichier 8 : `ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<layoutset>
  <children>
    <Widget name="ServerInfoRoot" type="FrameWidgetClass">
      <Attribute name="position" value="0 0" />
      <Attribute name="size" value="1 1" />
      <Attribute name="halign" value="0" />
      <Attribute name="valign" value="0" />
      <Attribute name="hexactpos" value="0" />
      <Attribute name="vexactpos" value="0" />
      <Attribute name="hexactsize" value="0" />
      <Attribute name="vexactsize" value="0" />
      <children>
        <Widget name="ServerInfoPanel" type="ImageWidgetClass">
          <Attribute name="position" value="1 0" />
          <Attribute name="size" value="220 70" />
          <Attribute name="halign" value="2" />
          <Attribute name="valign" value="0" />
          <Attribute name="hexactpos" value="0" />
          <Attribute name="vexactpos" value="1" />
          <Attribute name="hexactsize" value="1" />
          <Attribute name="vexactsize" value="1" />
          <Attribute name="color" value="0 0 0 0.55" />
          <children>
            <Widget name="ServerNameText" type="TextWidgetClass">
              <Attribute name="position" value="8 6" />
              <Attribute name="size" value="204 20" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="14" />
              <Attribute name="text" value="Server Name" />
              <Attribute name="color" value="1 1 1 0.9" />
            </Widget>
            <Widget name="PlayerCountText" type="TextWidgetClass">
              <Attribute name="position" value="8 28" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Players: - / -" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
            </Widget>
            <Widget name="TimeText" type="TextWidgetClass">
              <Attribute name="position" value="8 48" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Time: --:--" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
            </Widget>
          </children>
        </Widget>
      </children>
    </Widget>
  </children>
</layoutset>
```

---

## Étendre le HUD

Une fois le HUD de base fonctionnel, voici des extensions naturelles.

### Ajouter l'affichage du FPS

Le FPS peut être lu côté client sans aucun RPC :

```c
// Ajouter un champ TextWidget m_FPSText et le trouver dans Init()

protected void RefreshFPS()
{
    if (!m_FPSText)
        return;

    float fps = 1.0 / GetGame().GetDeltaT();
    m_FPSText.SetText("FPS: " + Math.Round(fps).ToString());
}
```

Appelez `RefreshFPS()` aux côtés de `RefreshTime()` dans la méthode de mise à jour. Notez que `GetDeltaT()` renvoie le temps de la frame courante, donc la valeur du FPS fluctuera. Pour un affichage plus fluide, faites une moyenne sur plusieurs frames :

```c
protected float m_FPSAccum;
protected int m_FPSFrames;

protected void RefreshFPS()
{
    if (!m_FPSText)
        return;

    m_FPSAccum += GetGame().GetDeltaT();
    m_FPSFrames++;

    float avgFPS = m_FPSFrames / m_FPSAccum;
    m_FPSText.SetText("FPS: " + Math.Round(avgFPS).ToString());

    // Réinitialiser chaque seconde (quand le minuteur principal se déclenche)
    m_FPSAccum = 0;
    m_FPSFrames = 0;
}
```

### Ajouter la position du joueur

```c
protected void RefreshPosition()
{
    if (!m_PositionText)
        return;

    Man player = GetGame().GetPlayer();
    if (!player)
        return;

    vector pos = player.GetPosition();
    string text = "Pos: " + Math.Round(pos[0]).ToString()
        + " / " + Math.Round(pos[2]).ToString();
    m_PositionText.SetText(text);
}
```

### Panneaux HUD multiples

Pour plusieurs panneaux (boussole, statut, mini-carte), créez une classe gestionnaire parente qui contient un tableau d'éléments HUD :

```c
class HUDManager
{
    protected ref array<ref ServerInfoHUD> m_Panels;

    void HUDManager()
    {
        m_Panels = new array<ref ServerInfoHUD>();
    }

    void AddPanel(ServerInfoHUD panel)
    {
        m_Panels.Insert(panel);
    }

    void UpdateAll(float timeslice)
    {
        int count = m_Panels.Count();
        int i = 0;
        while (i < count)
        {
            m_Panels.Get(i).Update(timeslice);
            i++;
        }
    }
};
```

### Éléments HUD déplaçables

Rendre un widget déplaçable nécessite la gestion des événements souris via `ScriptedWidgetEventHandler` :

```c
class DraggableHUD : ScriptedWidgetEventHandler
{
    protected bool m_Dragging;
    protected float m_OffsetX;
    protected float m_OffsetY;
    protected Widget m_DragWidget;

    override bool OnMouseButtonDown(Widget w, int x, int y, int button)
    {
        if (w == m_DragWidget && button == 0)
        {
            m_Dragging = true;
            float wx, wy;
            m_DragWidget.GetScreenPos(wx, wy);
            m_OffsetX = x - wx;
            m_OffsetY = y - wy;
            return true;
        }
        return false;
    }

    override bool OnMouseButtonUp(Widget w, int x, int y, int button)
    {
        if (button == 0)
            m_Dragging = false;
        return false;
    }

    override bool OnUpdate(Widget w, int x, int y, int oldX, int oldY)
    {
        if (m_Dragging && m_DragWidget)
        {
            m_DragWidget.SetPos(x - m_OffsetX, y - m_OffsetY);
            return true;
        }
        return false;
    }
};
```

Note : pour que le déplacement fonctionne, le widget doit avoir `SetHandler(this)` appelé dessus pour que le gestionnaire d'événements reçoive les événements. De plus, le curseur doit être visible, ce qui limite les HUD déplaçables aux situations où un menu ou un mode d'édition est actif.

---

## Erreurs courantes

### 1. Mise à jour à chaque frame au lieu d'être limitée

**Incorrect :**

```c
override void OnUpdate(float timeslice)
{
    super.OnUpdate(timeslice);
    m_ServerInfoHUD.RefreshTime();      // S'exécute 60+ fois par seconde !
    m_ServerInfoHUD.RequestServerInfo(); // Envoie 60+ RPCs par seconde !
}
```

**Correct :** Utilisez un accumulateur de temps (comme montré dans le tutoriel) pour que les opérations coûteuses s'exécutent au plus une fois par seconde. Le texte du HUD qui change à chaque frame (comme un compteur FPS) peut être mis à jour par frame, mais les requêtes RPC doivent être limitées.

### 2. Ne pas nettoyer dans OnMissionFinish

**Incorrect :**

```c
modded class MissionGameplay
{
    ref ServerInfoHUD m_HUD;

    override void OnInit()
    {
        super.OnInit();
        m_HUD = new ServerInfoHUD();
        m_HUD.Init();
        // Aucun nettoyage nulle part -- fuite de widgets à la déconnexion !
    }
};
```

**Correct :** Détruisez toujours les widgets et annulez les références dans `OnMissionFinish()`. Le destructeur (`~ServerInfoHUD`) est un filet de sécurité, mais ne comptez pas dessus -- `OnMissionFinish` est le bon endroit pour un nettoyage explicite.

### 3. HUD derrière d'autres éléments d'interface

Les widgets créés plus tard sont rendus au-dessus des widgets créés plus tôt. Si votre HUD apparaît derrière l'interface vanilla, il a été créé trop tôt. Solutions :

- Créez le HUD plus tard dans la séquence d'initialisation (par exemple au premier appel `OnUpdate` plutôt que dans `OnInit`).
- Utilisez `m_Root.SetSort(100)` pour forcer un ordre de tri plus élevé, poussant votre widget au-dessus des autres.

### 4. Demander des données trop fréquemment (spam de RPC)

Envoyer un RPC à chaque frame crée 60+ paquets réseau par seconde par joueur connecté. Sur un serveur de 60 joueurs, cela fait 3 600 paquets par seconde de trafic inutile. Limitez toujours les requêtes RPC. Une fois par seconde est raisonnable pour des informations non critiques. Pour des données qui changent rarement (comme le nom du serveur), vous pourriez le demander une seule fois à l'initialisation et le mettre en cache.

### 5. Oublier l'appel `super`

```c
// INCORRECT : casse la fonctionnalité du HUD vanilla
override void OnInit()
{
    m_HUD = new ServerInfoHUD();
    m_HUD.Init();
    // super.OnInit() manquant ! Le HUD vanilla ne s'initialisera pas.
}
```

Appelez toujours `super.OnInit()` (et `super.OnUpdate()`, `super.OnMissionFinish()`) en premier. Omettre l'appel super casse l'implémentation vanilla et chaque autre mod qui se connecte à la même méthode.

### 6. Utiliser la mauvaise couche de script

Si vous essayez de référencer `MissionGameplay` depuis `4_World`, vous obtiendrez une erreur "Undefined type" car les types de `5_Mission` ne sont pas visibles pour `4_World`. Les constantes RPC vont dans `3_Game`, le gestionnaire serveur va dans `4_World` (moddant `PlayerBase` qui y réside), et la classe HUD et le hook de mission vont dans `5_Mission`.

### 7. Chemin de disposition codé en dur

Le chemin de disposition dans `CreateWidgets()` est relatif aux chemins de recherche du jeu. Si le préfixe de votre PBO ne correspond pas à la chaîne de chemin, la disposition ne se chargera pas et `CreateWidgets` renvoie NULL. Vérifiez toujours NULL après `CreateWidgets` et journalisez une erreur si cela échoue.

---

## Prochaines étapes

Maintenant que vous avez une surcouche HUD fonctionnelle, considérez ces progressions :

1. **Sauvegarder les préférences utilisateur** -- Stockez si le HUD est visible dans un fichier JSON local pour que l'état de bascule persiste entre les sessions.
2. **Ajouter une configuration côté serveur** -- Permettez aux administrateurs du serveur d'activer/désactiver le HUD ou de choisir quels champs afficher via un fichier de configuration JSON.
3. **Construire une surcouche admin** -- Étendez le HUD pour afficher des informations réservées aux admins (performance serveur, nombre d'entités, minuteur de redémarrage) en utilisant des vérifications de permissions.
4. **Créer un HUD boussole** -- Utilisez `GetGame().GetCurrentCameraDirection()` pour calculer le cap et afficher une barre de boussole en haut de l'écran.
5. **Étudier les mods existants** -- Regardez le HUD de quête de DayZ Expansion et le système de surcouche de Colorful UI pour des implémentations HUD de qualité production.

---

## Bonnes pratiques

- **Limitez `OnUpdate` à des intervalles d'au moins 1 seconde.** Utilisez un accumulateur de temps pour éviter d'exécuter des opérations coûteuses (requêtes RPC, formatage de texte) 60+ fois par seconde. Seuls les visuels par frame comme les compteurs FPS devraient se mettre à jour à chaque frame.
- **Masquez le HUD quand l'inventaire ou un menu est ouvert.** Vérifiez `GetGame().GetUIManager().GetMenu()` à chaque mise à jour et supprimez votre surcouche. Les éléments d'interface qui se chevauchent déroutent les joueurs et bloquent les interactions.
- **Nettoyez toujours les widgets dans `OnMissionFinish`.** Les racines de widgets non libérées persistent entre les changements de serveur, empilant des panneaux fantômes qui consomment de la mémoire et finissent par causer des problèmes visuels.
- **Utilisez `SetSort()` pour contrôler l'ordre de rendu.** Si votre HUD apparaît derrière les éléments vanilla, appelez `m_Root.SetSort(100)` pour le pousser au-dessus. Sans ordre de tri explicite, le timing de création détermine la superposition.
- **Mettez en cache les données serveur qui changent rarement.** Le nom du serveur ne change pas pendant une session. Demandez-le une fois à l'initialisation et mettez-le en cache localement au lieu de le redemander chaque seconde.

---

## Théorie vs pratique

| Concept | Théorie | Réalité |
|---------|---------|---------|
| `OnUpdate(float timeslice)` | Appelé une fois par frame avec le delta time de la frame | Sur un client à 144 FPS, cela se déclenche 144 fois par seconde. Envoyer un RPC à chaque appel crée 144 paquets réseau/seconde par joueur. Accumulez toujours `timeslice` et n'agissez que quand la somme dépasse votre intervalle. |
| Chemin de disposition de `CreateWidgets()` | Charge la disposition depuis le chemin que vous fournissez | Le chemin est relatif au préfixe du PBO, pas au système de fichiers. Si le préfixe de votre PBO ne correspond pas à la chaîne de chemin, `CreateWidgets` renvoie silencieusement NULL sans erreur dans le journal. |
| `WidgetFadeTimer` | Anime fluidement l'opacité du widget | `FadeOut` masque le widget après la fin de l'animation, mais `FadeIn` n'appelle PAS `Show(true)` en premier. Vous devez manuellement afficher le widget avant d'appeler `FadeIn`, sinon rien n'apparaît. |
| `GetUApi().GetInputByName()` | Renvoie l'action d'entrée pour votre raccourci personnalisé | Si `inputs.xml` n'est pas référencé dans `config.cpp` sous `class inputs`, le nom de l'action est inconnu et `GetInputByName` renvoie null, causant un crash sur `.LocalPress()`. |

---

## Ce que vous avez appris

Dans ce tutoriel, vous avez appris :
- Comment créer une disposition HUD avec des panneaux ancrés et semi-transparents
- Comment construire une classe contrôleur qui limite les mises à jour à un intervalle fixe
- Comment se connecter à `MissionGameplay` pour la gestion du cycle de vie du HUD (initialisation, mise à jour, nettoyage)
- Comment demander des données serveur via RPC et les afficher sur le client
- Comment enregistrer un raccourci clavier personnalisé via `inputs.xml` et basculer la visibilité du HUD avec des animations de fondu

**Précédent :** [Chapitre 8.7 : Publier sur le Steam Workshop](07-publishing-workshop.md)
