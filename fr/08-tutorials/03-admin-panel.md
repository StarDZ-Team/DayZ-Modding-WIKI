# Chapitre 8.3 : Construire un module de panneau d'administration

[Accueil](../README.md) | [<< Précédent : Créer un objet personnalisé](02-custom-item.md) | **Construire un panneau d'administration** | [Suivant : Ajouter des commandes de chat >>](04-chat-commands.md)

---

> **Résumé :** Ce tutoriel vous guide à travers la construction d'un module complet de panneau d'administration de zéro. Vous créerez une disposition d'interface utilisateur, lierez les widgets en script, gérerez les clics de boutons, enverrez un RPC du client au serveur, traiterez la requête côté serveur, renverrez une réponse, et afficherez le résultat dans l'interface. Cela couvre l'aller-retour complet client-serveur-client dont chaque mod en réseau a besoin.

---

## Table des matières

- [Ce que nous construisons](#ce-que-nous-construisons)
- [Prérequis](#prérequis)
- [Aperçu de l'architecture](#aperçu-de-larchitecture)
- [Étape 1 : Créer la classe du module](#étape-1--créer-la-classe-du-module)
- [Étape 2 : Créer le fichier de disposition](#étape-2--créer-le-fichier-de-disposition)
- [Étape 3 : Lier les widgets dans OnActivated](#étape-3--lier-les-widgets-dans-onactivated)
- [Étape 4 : Gérer les clics de boutons](#étape-4--gérer-les-clics-de-boutons)
- [Étape 5 : Envoyer un RPC au serveur](#étape-5--envoyer-un-rpc-au-serveur)
- [Étape 6 : Gérer la réponse côté serveur](#étape-6--gérer-la-réponse-côté-serveur)
- [Étape 7 : Mettre à jour l'interface avec les données reçues](#étape-7--mettre-à-jour-linterface-avec-les-données-reçues)
- [Étape 8 : Enregistrer le module](#étape-8--enregistrer-le-module)
- [Référence complète des fichiers](#référence-complète-des-fichiers)
- [L'aller-retour complet expliqué](#laller-retour-complet-expliqué)
- [Dépannage](#dépannage)
- [Prochaines étapes](#prochaines-étapes)

---

## Ce que nous construisons

Nous allons créer un panneau **Admin Player Info** qui :

1. Affiche un bouton "Refresh" dans un panneau d'interface simple
2. Quand l'administrateur clique sur Refresh, envoie un RPC au serveur demandant les données du nombre de joueurs
3. Le serveur reçoit la requête, rassemble les informations et les renvoie
4. Le client reçoit la réponse et affiche le nombre de joueurs et la liste dans l'interface

Cela démontre le patron fondamental utilisé par chaque outil d'administration en réseau, panneau de configuration de mod et interface multijoueur dans DayZ.

---

## Prérequis

- Un mod fonctionnel issu du [Chapitre 8.1](01-first-mod.md) ou un nouveau mod avec la structure standard
- Compréhension de la [Hiérarchie des 5 couches de script](../02-mod-structure/01-five-layers.md) (nous utiliserons `3_Game`, `4_World` et `5_Mission`)
- Aisance de base dans la lecture du code Enforce Script

### Structure du mod pour ce tutoriel

Nous allons créer ces nouveaux fichiers :

```
AdminDemo/
    mod.cpp
    GUI/
        layouts/
            admin_player_info.layout
    Scripts/
        config.cpp
        3_Game/
            AdminDemo/
                AdminDemoRPC.c
        4_World/
            AdminDemo/
                AdminDemoServer.c
        5_Mission/
            AdminDemo/
                AdminDemoPanel.c
                AdminDemoMission.c
```

---

## Aperçu de l'architecture

Avant d'écrire du code, comprenez le flux de données :

```
CLIENT                              SERVEUR
------                              -------

1. L'admin clique sur "Refresh"
2. Le client envoie un RPC ------>  3. Le serveur reçoit le RPC
   (AdminDemo_RequestInfo)             Rassemble les données des joueurs
                                    4. Le serveur envoie un RPC ------>  CLIENT
                                       (AdminDemo_ResponseInfo)
                                                                    5. Le client reçoit le RPC
                                                                       Met à jour le texte de l'interface
```

Le système RPC (Remote Procedure Call) est la façon dont le client et le serveur communiquent dans DayZ. Le moteur fournit les méthodes `GetGame().RPCSingleParam()` et `GetGame().RPC()` pour envoyer des données, et une surcharge `OnRPC()` pour les recevoir.

**Contraintes clés :**
- Les clients ne peuvent pas lire directement les données côté serveur (liste des joueurs, état du serveur)
- Toute communication inter-frontières doit passer par les RPC
- Les messages RPC sont identifiés par des identifiants entiers
- Les données sont envoyées sous forme de paramètres sérialisés via les classes `Param`

---

## Étape 1 : Créer la classe du module

Tout d'abord, définissez les identifiants RPC dans `3_Game` (la couche la plus basse où les types de jeu sont disponibles). Les identifiants RPC doivent être définis dans `3_Game` car `4_World` (gestionnaire serveur) et `5_Mission` (gestionnaire client) ont tous deux besoin de les référencer.

### Créer `Scripts/3_Game/AdminDemo/AdminDemoRPC.c`

```c
class AdminDemoRPC
{
    // Identifiants RPC -- choisissez des numéros uniques qui n'entrent pas en conflit avec d'autres mods
    // Utiliser des numéros élevés réduit le risque de collision
    static const int REQUEST_PLAYER_INFO  = 78001;
    static const int RESPONSE_PLAYER_INFO = 78002;
};
```

Ces constantes seront utilisées par le client (pour envoyer des requêtes) et par le serveur (pour identifier les requêtes entrantes et envoyer des réponses).

### Pourquoi 3_Game ?

Les identifiants RPC sont des données pures -- des entiers sans dépendance aux entités du monde ou à l'interface. Les placer dans `3_Game` les rend visibles à la fois par `4_World` (où se trouve le gestionnaire serveur) et `5_Mission` (où se trouve l'interface client).

---

## Étape 2 : Créer le fichier de disposition

Le fichier de disposition définit la structure visuelle de votre panneau. DayZ utilise un format texte personnalisé (pas du XML) pour les fichiers `.layout`.

### Créer `GUI/layouts/admin_player_info.layout`

```
FrameWidgetClass AdminDemoPanel {
 size 0.4 0.5
 position 0.3 0.25
 hexactpos 0
 vexactpos 0
 hexactsize 0
 vexactsize 0
 {
  ImageWidgetClass Background {
   size 1 1
   position 0 0
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   color 0.1 0.1 0.1 0.85
  }
  TextWidgetClass Title {
   size 1 0.08
   position 0 0.02
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Player Info Panel"
   "text halign" center
   "text valign" center
   color 1 1 1 1
   font "gui/fonts/MetronBook"
  }
  ButtonWidgetClass RefreshButton {
   size 0.3 0.08
   position 0.35 0.12
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Refresh"
   "text halign" center
   "text valign" center
   color 0.2 0.6 1.0 1.0
  }
  TextWidgetClass PlayerCountText {
   size 1 0.06
   position 0 0.22
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Player Count: --"
   "text halign" center
   "text valign" center
   color 0.9 0.9 0.9 1
   font "gui/fonts/MetronBook"
  }
  TextWidgetClass PlayerListText {
   size 0.9 0.55
   position 0.05 0.3
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Click Refresh to load player data..."
   "text halign" left
   "text valign" top
   color 0.8 0.8 0.8 1
   font "gui/fonts/MetronBook"
  }
  ButtonWidgetClass CloseButton {
   size 0.2 0.06
   position 0.4 0.9
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Close"
   "text halign" center
   "text valign" center
   color 1.0 0.3 0.3 1.0
  }
 }
}
```

### Détail de la disposition

| Widget | Objectif |
|--------|----------|
| `AdminDemoPanel` | Cadre racine, 40% de largeur et 50% de hauteur, centré à l'écran |
| `Background` | Fond semi-transparent foncé remplissant tout le panneau |
| `Title` | Texte "Player Info Panel" en haut |
| `RefreshButton` | Bouton sur lequel l'admin clique pour demander les données |
| `PlayerCountText` | Affiche le nombre de joueurs |
| `PlayerListText` | Affiche la liste des noms de joueurs |
| `CloseButton` | Ferme le panneau |

Toutes les tailles utilisent des coordonnées proportionnelles (0.0 à 1.0 relatives au parent) car `hexactsize` et `vexactsize` sont définis à `0`.

---

## Étape 3 : Lier les widgets dans OnActivated

Maintenant, créez le script du panneau côté client qui charge la disposition et connecte les widgets aux variables.

### Créer `Scripts/5_Mission/AdminDemo/AdminDemoPanel.c`

```c
class AdminDemoPanel extends ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected ButtonWidget m_RefreshButton;
    protected ButtonWidget m_CloseButton;
    protected TextWidget m_PlayerCountText;
    protected TextWidget m_PlayerListText;

    protected bool m_IsOpen;

    void AdminDemoPanel()
    {
        m_IsOpen = false;
    }

    void ~AdminDemoPanel()
    {
        Close();
    }

    // -------------------------------------------------------
    // Ouvrir le panneau : créer les widgets et lier les références
    // -------------------------------------------------------
    void Open()
    {
        if (m_IsOpen)
            return;

        // Charger le fichier de disposition et obtenir le widget racine
        m_Root = GetGame().GetWorkspace().CreateWidgets("AdminDemo/GUI/layouts/admin_player_info.layout");
        if (!m_Root)
        {
            Print("[AdminDemo] ERROR: Failed to load layout file!");
            return;
        }

        // Lier les références des widgets par nom
        m_RefreshButton  = ButtonWidget.Cast(m_Root.FindAnyWidget("RefreshButton"));
        m_CloseButton    = ButtonWidget.Cast(m_Root.FindAnyWidget("CloseButton"));
        m_PlayerCountText = TextWidget.Cast(m_Root.FindAnyWidget("PlayerCountText"));
        m_PlayerListText  = TextWidget.Cast(m_Root.FindAnyWidget("PlayerListText"));

        // Enregistrer cette classe comme gestionnaire d'événements pour nos widgets
        if (m_RefreshButton)
            m_RefreshButton.SetHandler(this);

        if (m_CloseButton)
            m_CloseButton.SetHandler(this);

        m_Root.Show(true);
        m_IsOpen = true;

        // Afficher le curseur de la souris pour que l'admin puisse cliquer sur les boutons
        GetGame().GetMission().PlayerControlDisable(INPUT_EXCLUDE_ALL);
        GetGame().GetUIManager().ShowUICursor(true);

        Print("[AdminDemo] Panel opened.");
    }

    // -------------------------------------------------------
    // Fermer le panneau : détruire les widgets et restaurer les contrôles
    // -------------------------------------------------------
    void Close()
    {
        if (!m_IsOpen)
            return;

        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = null;
        }

        m_IsOpen = false;

        // Restaurer les contrôles du joueur et masquer le curseur
        GetGame().GetMission().PlayerControlEnable(true);
        GetGame().GetUIManager().ShowUICursor(false);

        Print("[AdminDemo] Panel closed.");
    }

    bool IsOpen()
    {
        return m_IsOpen;
    }

    // -------------------------------------------------------
    // Basculer ouverture/fermeture
    // -------------------------------------------------------
    void Toggle()
    {
        if (m_IsOpen)
            Close();
        else
            Open();
    }

    // -------------------------------------------------------
    // Gérer les événements de clic de bouton
    // -------------------------------------------------------
    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_RefreshButton)
        {
            OnRefreshClicked();
            return true;
        }

        if (w == m_CloseButton)
        {
            Close();
            return true;
        }

        return false;
    }

    // -------------------------------------------------------
    // Appelé quand l'admin clique sur Refresh
    // -------------------------------------------------------
    protected void OnRefreshClicked()
    {
        Print("[AdminDemo] Refresh clicked, sending RPC to server...");

        // Mettre à jour l'interface pour afficher l'état de chargement
        if (m_PlayerCountText)
            m_PlayerCountText.SetText("Player Count: Loading...");

        if (m_PlayerListText)
            m_PlayerListText.SetText("Requesting data from server...");

        // Envoyer le RPC au serveur
        // Paramètres : objet cible, identifiant RPC, données, destinataire (null = serveur)
        Man player = GetGame().GetPlayer();
        if (player)
        {
            Param1<bool> params = new Param1<bool>(true);
            GetGame().RPCSingleParam(player, AdminDemoRPC.REQUEST_PLAYER_INFO, params, true);
        }
    }

    // -------------------------------------------------------
    // Appelé quand la réponse du serveur arrive (depuis le OnRPC de mission)
    // -------------------------------------------------------
    void OnPlayerInfoReceived(int playerCount, string playerNames)
    {
        Print("[AdminDemo] Received player info: " + playerCount.ToString() + " players");

        if (m_PlayerCountText)
            m_PlayerCountText.SetText("Player Count: " + playerCount.ToString());

        if (m_PlayerListText)
            m_PlayerListText.SetText(playerNames);
    }
};
```

### Concepts clés

**`CreateWidgets()`** charge le fichier `.layout` et crée les objets widget en mémoire. Il renvoie le widget racine.

**`FindAnyWidget("name")`** recherche dans l'arbre de widgets un widget portant le nom donné. Le nom doit correspondre exactement à celui du fichier de disposition.

**`Cast()`** convertit la référence générique `Widget` vers un type spécifique (comme `ButtonWidget`). C'est nécessaire car `FindAnyWidget` renvoie le type de base `Widget`.

**`SetHandler(this)`** enregistre cette classe comme gestionnaire d'événements pour le widget. Quand le bouton est cliqué, le moteur appelle `OnClick()` sur cet objet.

**`PlayerControlDisable` / `PlayerControlEnable`** désactive/réactive les mouvements et actions du joueur. Sans cela, le joueur se déplacerait en essayant de cliquer sur les boutons.

---

## Étape 4 : Gérer les clics de boutons

La gestion des clics de boutons est déjà implémentée dans la méthode `OnClick()` de l'Étape 3. Examinons le patron de plus près.

### Le patron OnClick

```c
override bool OnClick(Widget w, int x, int y, int button)
{
    if (w == m_RefreshButton)
    {
        OnRefreshClicked();
        return true;    // Événement consommé -- arrêter la propagation
    }

    if (w == m_CloseButton)
    {
        Close();
        return true;
    }

    return false;        // Événement non consommé -- le laisser se propager
}
```

**Paramètres :**
- `w` -- Le widget qui a été cliqué
- `x`, `y` -- Coordonnées de la souris au moment du clic
- `button` -- Quel bouton de souris (0 = gauche, 1 = droit, 2 = milieu)

**Valeur de retour :**
- `true` signifie que vous avez géré l'événement. Il cesse de se propager aux widgets parents.
- `false` signifie que vous ne l'avez pas géré. Le moteur le passe au gestionnaire suivant.

**Patron :** Comparez le widget cliqué `w` à vos références de widgets connues. Appelez une méthode de gestion pour chaque bouton reconnu. Renvoyez `true` pour les clics gérés, `false` pour tout le reste.

---

## Étape 5 : Envoyer un RPC au serveur

Quand l'admin clique sur Refresh, nous devons envoyer un message du client au serveur. DayZ fournit le système RPC pour cela.

### Envoi RPC (client vers serveur)

L'appel d'envoi principal de l'Étape 3 :

```c
Man player = GetGame().GetPlayer();
if (player)
{
    Param1<bool> params = new Param1<bool>(true);
    GetGame().RPCSingleParam(player, AdminDemoRPC.REQUEST_PLAYER_INFO, params, true);
}
```

**`GetGame().RPCSingleParam(target, rpcID, params, guaranteed)` :**

| Paramètre | Signification |
|-----------|---------------|
| `target` | L'objet auquel ce RPC est associé. Utiliser le joueur est standard. |
| `rpcID` | Votre identifiant entier unique (défini dans `AdminDemoRPC`). |
| `params` | Un objet `Param` transportant la charge utile de données. |
| `guaranteed` | `true` = livraison fiable de type TCP. `false` = envoi sans garantie de type UDP. Utilisez toujours `true` pour les opérations d'administration. |

### Classes Param

DayZ fournit des classes template `Param` pour envoyer des données :

| Classe | Utilisation |
|--------|-------------|
| `Param1<T>` | Une valeur |
| `Param2<T1, T2>` | Deux valeurs |
| `Param3<T1, T2, T3>` | Trois valeurs |

Vous pouvez envoyer des chaînes, des entiers, des flottants, des booléens et des vecteurs. Exemple avec plusieurs valeurs :

```c
Param3<string, int, float> data = new Param3<string, int, float>("hello", 42, 3.14);
GetGame().RPCSingleParam(player, MY_RPC_ID, data, true);
```

---

## Étape 6 : Gérer la réponse côté serveur

Le serveur reçoit le RPC du client, rassemble les données et renvoie une réponse.

### Créer `Scripts/4_World/AdminDemo/AdminDemoServer.c`

```c
modded class PlayerBase
{
    // -------------------------------------------------------
    // Gestionnaire RPC côté serveur
    // -------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        // Ne traiter que sur le serveur
        if (!GetGame().IsServer())
            return;

        switch (rpc_type)
        {
            case AdminDemoRPC.REQUEST_PLAYER_INFO:
                HandlePlayerInfoRequest(sender);
                break;
        }
    }

    // -------------------------------------------------------
    // Rassembler les données des joueurs et envoyer la réponse
    // -------------------------------------------------------
    protected void HandlePlayerInfoRequest(PlayerIdentity requestor)
    {
        if (!requestor)
            return;

        Print("[AdminDemo] Server received player info request from: " + requestor.GetName());

        // --- Vérification des permissions (optionnel mais recommandé) ---
        // Dans un vrai mod, vérifiez si le demandeur est un admin :
        // if (!IsAdmin(requestor))
        //     return;

        // --- Rassembler les données des joueurs ---
        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        int playerCount = players.Count();
        string playerNames = "";

        for (int i = 0; i < playerCount; i++)
        {
            Man man = players.Get(i);
            if (man)
            {
                PlayerIdentity identity = man.GetIdentity();
                if (identity)
                {
                    if (playerNames != "")
                        playerNames = playerNames + "\n";

                    playerNames = playerNames + (i + 1).ToString() + ". " + identity.GetName();
                }
            }
        }

        if (playerNames == "")
            playerNames = "(No players connected)";

        // --- Envoyer la réponse au client demandeur ---
        Param2<int, string> responseData = new Param2<int, string>(playerCount, playerNames);

        // RPCSingleParam avec l'objet joueur du demandeur envoie à ce client spécifique
        Man requestorPlayer = null;
        for (int j = 0; j < players.Count(); j++)
        {
            Man candidate = players.Get(j);
            if (candidate && candidate.GetIdentity() && candidate.GetIdentity().GetId() == requestor.GetId())
            {
                requestorPlayer = candidate;
                break;
            }
        }

        if (requestorPlayer)
        {
            GetGame().RPCSingleParam(requestorPlayer, AdminDemoRPC.RESPONSE_PLAYER_INFO, responseData, true, requestor);

            Print("[AdminDemo] Server sent player info response: " + playerCount.ToString() + " players");
        }
    }
};
```

### Comment fonctionne la réception RPC côté serveur

1. **`OnRPC()` est appelé sur l'objet cible.** Quand le client a envoyé le RPC avec `target = player`, le `PlayerBase.OnRPC()` côté serveur se déclenche.

2. **Appelez toujours `super.OnRPC()`.** D'autres mods et le code vanilla peuvent aussi gérer des RPCs sur cet objet.

3. **Vérifiez `GetGame().IsServer()`.** Ce code est dans `4_World`, qui compile à la fois sur le client et le serveur. La vérification `IsServer()` assure que nous ne traitons la requête que sur le serveur.

4. **Faites un switch sur `rpc_type`.** Faites correspondre avec vos constantes d'identifiants RPC.

5. **Envoyez la réponse.** Utilisez `RPCSingleParam` avec le cinquième paramètre (`recipient`) défini sur l'identité du joueur demandeur. Cela envoie la réponse uniquement à ce client spécifique.

### Signature de la réponse RPCSingleParam

```c
GetGame().RPCSingleParam(
    requestorPlayer,                        // Objet cible (le joueur)
    AdminDemoRPC.RESPONSE_PLAYER_INFO,      // Identifiant RPC
    responseData,                           // Charge utile de données
    true,                                   // Livraison garantie
    requestor                               // Identité du destinataire (client spécifique)
);
```

Le cinquième paramètre `requestor` (un `PlayerIdentity`) est ce qui fait de ceci une réponse ciblée. Sans lui, le RPC irait à tous les clients.

---

## Étape 7 : Mettre à jour l'interface avec les données reçues

De retour côté client, nous devons intercepter le RPC de réponse du serveur et le router vers le panneau.

### Créer `Scripts/5_Mission/AdminDemo/AdminDemoMission.c`

```c
modded class MissionGameplay
{
    protected ref AdminDemoPanel m_AdminDemoPanel;

    // -------------------------------------------------------
    // Initialiser le panneau au démarrage de la mission
    // -------------------------------------------------------
    override void OnInit()
    {
        super.OnInit();

        if (!m_AdminDemoPanel)
            m_AdminDemoPanel = new AdminDemoPanel();

        Print("[AdminDemo] Client mission initialized.");
    }

    // -------------------------------------------------------
    // Nettoyer à la fin de la mission
    // -------------------------------------------------------
    override void OnMissionFinish()
    {
        if (m_AdminDemoPanel)
        {
            m_AdminDemoPanel.Close();
            m_AdminDemoPanel = null;
        }

        super.OnMissionFinish();
    }

    // -------------------------------------------------------
    // Gérer l'entrée clavier pour basculer le panneau
    // -------------------------------------------------------
    override void OnKeyPress(int key)
    {
        super.OnKeyPress(key);

        // La touche F5 bascule le panneau d'administration
        if (key == KeyCode.KC_F5)
        {
            if (m_AdminDemoPanel)
                m_AdminDemoPanel.Toggle();
        }
    }

    // -------------------------------------------------------
    // Recevoir les RPCs du serveur côté client
    // -------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        switch (rpc_type)
        {
            case AdminDemoRPC.RESPONSE_PLAYER_INFO:
                HandlePlayerInfoResponse(ctx);
                break;
        }
    }

    // -------------------------------------------------------
    // Désérialiser la réponse du serveur et mettre à jour le panneau
    // -------------------------------------------------------
    protected void HandlePlayerInfoResponse(ParamsReadContext ctx)
    {
        Param2<int, string> data = new Param2<int, string>(0, "");
        if (!ctx.Read(data))
        {
            Print("[AdminDemo] ERROR: Failed to read player info response!");
            return;
        }

        int playerCount = data.param1;
        string playerNames = data.param2;

        Print("[AdminDemo] Client received player info: " + playerCount.ToString() + " players");

        if (m_AdminDemoPanel)
            m_AdminDemoPanel.OnPlayerInfoReceived(playerCount, playerNames);
    }
};
```

### Comment fonctionne la réception RPC côté client

1. **`MissionGameplay.OnRPC()`** est un gestionnaire universel pour les RPCs reçus sur le client. Il se déclenche pour chaque RPC entrant.

2. **`ParamsReadContext ctx`** contient les données sérialisées envoyées par le serveur. Vous devez les désérialiser en utilisant `ctx.Read()` avec un type `Param` correspondant.

3. **La correspondance des types Param est critique.** Le serveur a envoyé `Param2<int, string>`. Le client doit lire avec `Param2<int, string>`. Une non-correspondance fait que `ctx.Read()` renvoie `false` et aucune donnée n'est récupérée.

4. **Routez les données vers le panneau.** Après la désérialisation, appelez une méthode sur l'objet panneau pour mettre à jour l'interface.

### Le gestionnaire OnKeyPress

```c
override void OnKeyPress(int key)
{
    super.OnKeyPress(key);

    if (key == KeyCode.KC_F5)
    {
        if (m_AdminDemoPanel)
            m_AdminDemoPanel.Toggle();
    }
}
```

Cela se connecte à l'entrée clavier de la mission. Quand l'admin appuie sur F5, le panneau s'ouvre ou se ferme. `KeyCode.KC_F5` est une constante intégrée pour la touche F5.

---

## Étape 8 : Enregistrer le module

Enfin, liez le tout dans config.cpp.

### Créer `AdminDemo/mod.cpp`

```cpp
name = "Admin Demo";
author = "YourName";
version = "1.0";
overview = "Tutorial admin panel demonstrating the full RPC roundtrip pattern.";
```

### Créer `AdminDemo/Scripts/config.cpp`

```cpp
class CfgPatches
{
    class AdminDemo_Scripts
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
    class AdminDemo
    {
        dir = "AdminDemo";
        name = "Admin Demo";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "AdminDemo/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "AdminDemo/Scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "AdminDemo/Scripts/5_Mission" };
            };
        };
    };
};
```

### Pourquoi trois couches ?

| Couche | Contient | Raison |
|--------|----------|--------|
| `3_Game` | `AdminDemoRPC.c` | Les constantes d'identifiants RPC doivent être visibles par `4_World` et `5_Mission` |
| `4_World` | `AdminDemoServer.c` | Gestionnaire côté serveur moddant `PlayerBase` (une entité du monde) |
| `5_Mission` | `AdminDemoPanel.c`, `AdminDemoMission.c` | Interface client et hooks de mission |

---

## Référence complète des fichiers

### Structure finale du répertoire

```
AdminDemo/
    mod.cpp
    GUI/
        layouts/
            admin_player_info.layout
    Scripts/
        config.cpp
        3_Game/
            AdminDemo/
                AdminDemoRPC.c
        4_World/
            AdminDemo/
                AdminDemoServer.c
        5_Mission/
            AdminDemo/
                AdminDemoPanel.c
                AdminDemoMission.c
```

### AdminDemo/Scripts/3_Game/AdminDemo/AdminDemoRPC.c

```c
class AdminDemoRPC
{
    static const int REQUEST_PLAYER_INFO  = 78001;
    static const int RESPONSE_PLAYER_INFO = 78002;
};
```

### AdminDemo/Scripts/4_World/AdminDemo/AdminDemoServer.c

```c
modded class PlayerBase
{
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (!GetGame().IsServer())
            return;

        switch (rpc_type)
        {
            case AdminDemoRPC.REQUEST_PLAYER_INFO:
                HandlePlayerInfoRequest(sender);
                break;
        }
    }

    protected void HandlePlayerInfoRequest(PlayerIdentity requestor)
    {
        if (!requestor)
            return;

        Print("[AdminDemo] Server received player info request from: " + requestor.GetName());

        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        int playerCount = players.Count();
        string playerNames = "";

        for (int i = 0; i < playerCount; i++)
        {
            Man man = players.Get(i);
            if (man)
            {
                PlayerIdentity identity = man.GetIdentity();
                if (identity)
                {
                    if (playerNames != "")
                        playerNames = playerNames + "\n";

                    playerNames = playerNames + (i + 1).ToString() + ". " + identity.GetName();
                }
            }
        }

        if (playerNames == "")
            playerNames = "(No players connected)";

        Param2<int, string> responseData = new Param2<int, string>(playerCount, playerNames);

        Man requestorPlayer = null;
        for (int j = 0; j < players.Count(); j++)
        {
            Man candidate = players.Get(j);
            if (candidate && candidate.GetIdentity() && candidate.GetIdentity().GetId() == requestor.GetId())
            {
                requestorPlayer = candidate;
                break;
            }
        }

        if (requestorPlayer)
        {
            GetGame().RPCSingleParam(requestorPlayer, AdminDemoRPC.RESPONSE_PLAYER_INFO, responseData, true, requestor);
            Print("[AdminDemo] Server sent player info response: " + playerCount.ToString() + " players");
        }
    }
};
```

### AdminDemo/Scripts/5_Mission/AdminDemo/AdminDemoPanel.c

```c
class AdminDemoPanel extends ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected ButtonWidget m_RefreshButton;
    protected ButtonWidget m_CloseButton;
    protected TextWidget m_PlayerCountText;
    protected TextWidget m_PlayerListText;

    protected bool m_IsOpen;

    void AdminDemoPanel()
    {
        m_IsOpen = false;
    }

    void ~AdminDemoPanel()
    {
        Close();
    }

    void Open()
    {
        if (m_IsOpen)
            return;

        m_Root = GetGame().GetWorkspace().CreateWidgets("AdminDemo/GUI/layouts/admin_player_info.layout");
        if (!m_Root)
        {
            Print("[AdminDemo] ERROR: Failed to load layout file!");
            return;
        }

        m_RefreshButton   = ButtonWidget.Cast(m_Root.FindAnyWidget("RefreshButton"));
        m_CloseButton     = ButtonWidget.Cast(m_Root.FindAnyWidget("CloseButton"));
        m_PlayerCountText = TextWidget.Cast(m_Root.FindAnyWidget("PlayerCountText"));
        m_PlayerListText  = TextWidget.Cast(m_Root.FindAnyWidget("PlayerListText"));

        if (m_RefreshButton)
            m_RefreshButton.SetHandler(this);

        if (m_CloseButton)
            m_CloseButton.SetHandler(this);

        m_Root.Show(true);
        m_IsOpen = true;

        GetGame().GetMission().PlayerControlDisable(INPUT_EXCLUDE_ALL);
        GetGame().GetUIManager().ShowUICursor(true);

        Print("[AdminDemo] Panel opened.");
    }

    void Close()
    {
        if (!m_IsOpen)
            return;

        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = null;
        }

        m_IsOpen = false;

        GetGame().GetMission().PlayerControlEnable(true);
        GetGame().GetUIManager().ShowUICursor(false);

        Print("[AdminDemo] Panel closed.");
    }

    bool IsOpen()
    {
        return m_IsOpen;
    }

    void Toggle()
    {
        if (m_IsOpen)
            Close();
        else
            Open();
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_RefreshButton)
        {
            OnRefreshClicked();
            return true;
        }

        if (w == m_CloseButton)
        {
            Close();
            return true;
        }

        return false;
    }

    protected void OnRefreshClicked()
    {
        Print("[AdminDemo] Refresh clicked, sending RPC to server...");

        if (m_PlayerCountText)
            m_PlayerCountText.SetText("Player Count: Loading...");

        if (m_PlayerListText)
            m_PlayerListText.SetText("Requesting data from server...");

        Man player = GetGame().GetPlayer();
        if (player)
        {
            Param1<bool> params = new Param1<bool>(true);
            GetGame().RPCSingleParam(player, AdminDemoRPC.REQUEST_PLAYER_INFO, params, true);
        }
    }

    void OnPlayerInfoReceived(int playerCount, string playerNames)
    {
        Print("[AdminDemo] Received player info: " + playerCount.ToString() + " players");

        if (m_PlayerCountText)
            m_PlayerCountText.SetText("Player Count: " + playerCount.ToString());

        if (m_PlayerListText)
            m_PlayerListText.SetText(playerNames);
    }
};
```

### AdminDemo/Scripts/5_Mission/AdminDemo/AdminDemoMission.c

```c
modded class MissionGameplay
{
    protected ref AdminDemoPanel m_AdminDemoPanel;

    override void OnInit()
    {
        super.OnInit();

        if (!m_AdminDemoPanel)
            m_AdminDemoPanel = new AdminDemoPanel();

        Print("[AdminDemo] Client mission initialized.");
    }

    override void OnMissionFinish()
    {
        if (m_AdminDemoPanel)
        {
            m_AdminDemoPanel.Close();
            m_AdminDemoPanel = null;
        }

        super.OnMissionFinish();
    }

    override void OnKeyPress(int key)
    {
        super.OnKeyPress(key);

        if (key == KeyCode.KC_F5)
        {
            if (m_AdminDemoPanel)
                m_AdminDemoPanel.Toggle();
        }
    }

    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        switch (rpc_type)
        {
            case AdminDemoRPC.RESPONSE_PLAYER_INFO:
                HandlePlayerInfoResponse(ctx);
                break;
        }
    }

    protected void HandlePlayerInfoResponse(ParamsReadContext ctx)
    {
        Param2<int, string> data = new Param2<int, string>(0, "");
        if (!ctx.Read(data))
        {
            Print("[AdminDemo] ERROR: Failed to read player info response!");
            return;
        }

        int playerCount = data.param1;
        string playerNames = data.param2;

        Print("[AdminDemo] Client received player info: " + playerCount.ToString() + " players");

        if (m_AdminDemoPanel)
            m_AdminDemoPanel.OnPlayerInfoReceived(playerCount, playerNames);
    }
};
```

---

## L'aller-retour complet expliqué

Voici la séquence exacte des événements quand l'admin appuie sur F5 et clique sur Refresh :

```
1. [CLIENT] L'admin appuie sur F5
   --> MissionGameplay.OnKeyPress(KC_F5) se déclenche
   --> AdminDemoPanel.Toggle() est appelé
   --> Le panneau s'ouvre, la disposition est créée, le curseur apparaît

2. [CLIENT] L'admin clique sur le bouton "Refresh"
   --> AdminDemoPanel.OnClick() se déclenche avec w == m_RefreshButton
   --> OnRefreshClicked() est appelé
   --> L'interface affiche "Loading..."
   --> RPCSingleParam envoie REQUEST_PLAYER_INFO (78001) au serveur

3. [RÉSEAU] Le RPC voyage du client au serveur

4. [SERVEUR] PlayerBase.OnRPC() se déclenche
   --> rpc_type correspond à REQUEST_PLAYER_INFO
   --> HandlePlayerInfoRequest(sender) est appelé
   --> Le serveur itère sur tous les joueurs connectés
   --> Construit le nombre de joueurs et la liste de noms
   --> RPCSingleParam envoie RESPONSE_PLAYER_INFO (78002) au client

5. [RÉSEAU] Le RPC voyage du serveur au client

6. [CLIENT] MissionGameplay.OnRPC() se déclenche
   --> rpc_type correspond à RESPONSE_PLAYER_INFO
   --> HandlePlayerInfoResponse(ctx) est appelé
   --> Les données sont désérialisées depuis ParamsReadContext
   --> AdminDemoPanel.OnPlayerInfoReceived() est appelé
   --> L'interface se met à jour avec le nombre et les noms des joueurs

Temps total : typiquement moins de 100ms sur un réseau local.
```

---

## Dépannage

### Le panneau ne s'ouvre pas en appuyant sur F5

- **Vérifiez la surcharge OnKeyPress :** Assurez-vous que `super.OnKeyPress(key)` est appelé en premier.
- **Vérifiez le code de touche :** `KeyCode.KC_F5` est la bonne constante. Si vous utilisez une autre touche, trouvez la bonne constante dans l'API Enforce Script.
- **Vérifiez l'initialisation :** Assurez-vous que `m_AdminDemoPanel` est créé dans `OnInit()`.

### Le panneau s'ouvre mais les boutons ne fonctionnent pas

- **Vérifiez SetHandler :** Chaque bouton nécessite un appel `button.SetHandler(this)`.
- **Vérifiez les noms de widgets :** `FindAnyWidget("RefreshButton")` est sensible à la casse. Le nom doit correspondre exactement au fichier de disposition.
- **Vérifiez le retour de OnClick :** Assurez-vous que `OnClick` renvoie `true` pour les boutons gérés.

### Le RPC n'atteint jamais le serveur

- **Vérifiez l'unicité de l'identifiant RPC :** Si un autre mod utilise le même numéro d'identifiant RPC, il y aura des conflits. Utilisez des numéros élevés et uniques.
- **Vérifiez la référence du joueur :** `GetGame().GetPlayer()` renvoie `null` s'il est appelé avant que le joueur soit entièrement initialisé. Assurez-vous que le panneau ne s'ouvre qu'après l'apparition du joueur.
- **Vérifiez que le code serveur compile :** Cherchez les erreurs `SCRIPT (E)` dans le journal de script du serveur dans votre code `4_World`.

### La réponse du serveur n'atteint jamais le client

- **Vérifiez le paramètre destinataire :** Le cinquième paramètre de `RPCSingleParam` doit être le `PlayerIdentity` du client cible.
- **Vérifiez la correspondance des types Param :** Le serveur envoie `Param2<int, string>`, le client lit `Param2<int, string>`. Une non-correspondance de type fait échouer `ctx.Read()`.
- **Vérifiez la surcharge MissionGameplay.OnRPC :** Assurez-vous d'appeler `super.OnRPC()` et que la signature de la méthode est correcte.

### L'interface s'affiche mais les données ne se mettent pas à jour

- **Références de widgets nulles :** Si `FindAnyWidget` renvoie `null` (nom de widget incorrect), les appels à `SetText()` échouent silencieusement.
- **Vérifiez la référence du panneau :** Assurez-vous que `m_AdminDemoPanel` dans la classe mission est le même objet qui a été ouvert.
- **Ajoutez des instructions Print :** Tracez le flux de données en ajoutant des appels `Print()` à chaque étape.

---

## Prochaines étapes

1. **[Chapitre 8.4 : Ajouter des commandes de chat](04-chat-commands.md)** -- Créez des commandes de chat côté serveur pour les opérations d'administration.
2. **Ajoutez des permissions** -- Vérifiez si le joueur demandeur est un administrateur avant de traiter les RPCs.
3. **Ajoutez plus de fonctionnalités** -- Étendez le panneau avec des onglets pour le contrôle météo, la téléportation de joueurs, l'apparition d'objets.
4. **Utilisez un framework** -- Les frameworks comme MyMod Core fournissent un routage RPC intégré, une gestion de configuration et une infrastructure de panneau d'administration qui élimine une grande partie de ce code standard.
5. **Stylisez l'interface** -- Apprenez les styles de widgets, les imagesets et les polices dans le [Chapitre 3 : Système GUI](../03-gui-system/01-widget-types.md).

---

## Bonnes pratiques

- **Validez toutes les données RPC sur le serveur avant de les exécuter.** Ne faites jamais confiance aux données du client -- vérifiez toujours les permissions, validez les paramètres et protégez-vous contre les valeurs nulles avant d'effectuer toute action serveur.
- **Mettez en cache les références de widgets dans des variables membres au lieu d'appeler `FindAnyWidget` à chaque frame.** La recherche de widgets n'est pas gratuite ; l'appeler dans `OnUpdate` ou `OnClick` de manière répétée gaspille les performances.
- **Appelez toujours `SetHandler(this)` sur les widgets interactifs.** Sans cela, `OnClick()` ne se déclenchera jamais, et il n'y a pas de message d'erreur -- les boutons ne font simplement rien en silence.
- **Utilisez des numéros d'identifiants RPC élevés et uniques.** Le DayZ vanilla utilise des identifiants bas. D'autres mods choisissent des plages communes. Utilisez des numéros supérieurs à 70000 et ajoutez le préfixe de votre mod dans les commentaires pour que les collisions soient traçables.
- **Nettoyez les widgets dans `OnMissionFinish`.** Les racines de widgets non libérées s'accumulent entre les changements de serveur, consommant de la mémoire et causant des éléments d'interface fantômes.

---

## Théorie vs pratique

| Concept | Théorie | Réalité |
|---------|---------|---------|
| Livraison de `RPCSingleParam` | Mettre `guaranteed=true` signifie que le RPC arrive toujours | Les RPCs peuvent quand même être perdus si le joueur se déconnecte en cours de route ou si le serveur plante. Gérez toujours le cas "pas de réponse" dans votre interface (par exemple un message de délai d'attente). |
| Correspondance de widget dans `OnClick` | Comparer `w == m_Button` pour identifier les clics | Si `FindAnyWidget` a renvoyé NULL (faute de frappe dans le nom du widget), `m_Button` est NULL et la comparaison échoue silencieusement. Affichez toujours un avertissement si la liaison du widget échoue dans `Open()`. |
| Correspondance des types Param | Le client et le serveur utilisent le même `Param2<int, string>` | Si les types ou l'ordre ne correspondent pas exactement, `ctx.Read()` renvoie false et les données sont silencieusement perdues. Il n'y a pas de message d'erreur de vérification de type à l'exécution. |
| Test en listen server | Suffisant pour une itération rapide | Les listen servers exécutent client et serveur dans un seul processus, donc les RPCs arrivent instantanément et ne traversent jamais le réseau. Les bugs de timing, les pertes de paquets et les problèmes d'autorité n'apparaissent que sur un vrai serveur dédié. |

---

## Ce que vous avez appris

Dans ce tutoriel, vous avez appris :
- Comment créer un panneau d'interface avec des fichiers de disposition et lier des widgets en script
- Comment gérer les clics de boutons avec `OnClick()` et `SetHandler()`
- Comment envoyer des RPCs du client au serveur et retour en utilisant `RPCSingleParam` et les classes `Param`
- Le patron complet d'aller-retour client-serveur-client utilisé par chaque outil d'administration en réseau
- Comment enregistrer le panneau dans `MissionGameplay` avec une gestion appropriée du cycle de vie

**Suivant :** [Chapitre 8.4 : Ajouter des commandes de chat](04-chat-commands.md)

---

**Précédent :** [Chapitre 8.2 : Créer un objet personnalisé](02-custom-item.md)
**Suivant :** [Chapitre 8.4 : Ajouter des commandes de chat](04-chat-commands.md)
