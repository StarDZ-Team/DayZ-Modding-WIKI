# Chapitre 8.4 : Ajouter des commandes de chat

[Accueil](../README.md) | [<< Précédent : Construire un panneau d'administration](03-admin-panel.md) | **Ajouter des commandes de chat** | [Suivant : Utiliser le modèle de mod DayZ >>](05-mod-template.md)

---

> **Résumé :** Ce tutoriel vous guide à travers la création d'un système de commandes de chat pour DayZ. Vous intercepterez l'entrée du chat, analyserez les préfixes de commandes et les arguments, vérifierez les permissions d'administrateur, exécuterez une action côté serveur et enverrez un retour au joueur. À la fin, vous aurez une commande `/heal` fonctionnelle qui soigne complètement le personnage de l'administrateur, ainsi qu'un framework pour ajouter d'autres commandes.

---

## Table des matières

- [Ce que nous construisons](#ce-que-nous-construisons)
- [Prérequis](#prérequis)
- [Aperçu de l'architecture](#aperçu-de-larchitecture)
- [Étape 1 : Intercepter l'entrée du chat](#étape-1--intercepter-lentrée-du-chat)
- [Étape 2 : Analyser le préfixe et les arguments de la commande](#étape-2--analyser-le-préfixe-et-les-arguments-de-la-commande)
- [Étape 3 : Vérifier les permissions d'administrateur](#étape-3--vérifier-les-permissions-dadministrateur)
- [Étape 4 : Exécuter l'action côté serveur](#étape-4--exécuter-laction-côté-serveur)
- [Étape 5 : Envoyer un retour à l'administrateur](#étape-5--envoyer-un-retour-à-ladministrateur)
- [Étape 6 : Enregistrer les commandes](#étape-6--enregistrer-les-commandes)
- [Étape 7 : Ajouter à une liste de commandes du panneau d'administration](#étape-7--ajouter-à-une-liste-de-commandes-du-panneau-dadministration)
- [Code complet fonctionnel : commande /heal](#code-complet-fonctionnel--commande-heal)
- [Ajouter d'autres commandes](#ajouter-dautres-commandes)
- [Dépannage](#dépannage)
- [Prochaines étapes](#prochaines-étapes)

---

## Ce que nous construisons

Un système de commandes de chat avec :

- **`/heal`** -- Soigne complètement le personnage de l'administrateur (santé, sang, choc, faim, soif)
- **`/heal NomDuJoueur`** -- Soigne un joueur spécifique par son nom
- Un framework réutilisable pour ajouter `/kill`, `/teleport`, `/time`, `/weather` et toute autre commande
- Vérification des permissions d'administrateur pour que les joueurs normaux ne puissent pas utiliser les commandes admin
- Exécution côté serveur avec messages de retour dans le chat

---

## Prérequis

- Une structure de mod fonctionnelle (complétez d'abord le [Chapitre 8.1](01-first-mod.md))
- Compréhension du [patron RPC client-serveur](03-admin-panel.md) du Chapitre 8.3

### Structure du mod pour ce tutoriel

```
ChatCommands/
    mod.cpp
    Scripts/
        config.cpp
        3_Game/
            ChatCommands/
                CCmdRPC.c
                CCmdBase.c
                CCmdRegistry.c
        4_World/
            ChatCommands/
                CCmdServerHandler.c
                commands/
                    CCmdHeal.c
        5_Mission/
            ChatCommands/
                CCmdChatHook.c
```

---

## Aperçu de l'architecture

Les commandes de chat suivent ce flux :

```
CLIENT                                  SERVEUR
------                                  -------

1. L'admin tape "/heal" dans le chat
2. Le hook de chat intercepte le message
   (empêche son envoi comme chat normal)
3. Le client envoie la commande via RPC  ---->  4. Le serveur reçoit le RPC
                                                    Vérifie les permissions admin
                                                    Recherche le gestionnaire de commande
                                                    Exécute la commande
                                                5. Le serveur envoie un retour  ---->  CLIENT
                                                    (RPC de message chat)
                                                                                    6. L'admin voit
                                                                                       le retour dans le chat
```

**Pourquoi traiter les commandes sur le serveur ?** Parce que le serveur a l'autorité sur l'état du jeu. Seul le serveur peut de manière fiable soigner les joueurs, changer la météo, téléporter les personnages et modifier l'état du monde. Le rôle du client se limite à détecter la commande et la transmettre.

---

## Étape 1 : Intercepter l'entrée du chat

Nous devons intercepter les messages du chat avant qu'ils ne soient envoyés comme chat normal. DayZ fournit la classe `ChatInputMenu` à cet effet.

### L'approche du hook de chat

Nous allons modder la classe `MissionGameplay` pour intercepter les événements d'entrée du chat. Quand le joueur soumet un message commençant par `/`, nous l'interceptons, empêchons son envoi comme chat normal, et l'envoyons à la place comme RPC de commande au serveur.

### Créer `Scripts/5_Mission/ChatCommands/CCmdChatHook.c`

```c
modded class MissionGameplay
{
    // -------------------------------------------------------
    // Intercepter les messages du chat qui commencent par /
    // -------------------------------------------------------
    override void OnEvent(EventType eventTypeId, Param params)
    {
        super.OnEvent(eventTypeId, params);

        // ChatMessageEventTypeID se déclenche quand le joueur envoie un message
        if (eventTypeId == ChatMessageEventTypeID)
        {
            Param3<int, string, string> chatParams;
            if (Class.CastTo(chatParams, params))
            {
                string message = chatParams.param3;

                // Vérifier si ça commence par /
                if (message.Length() > 0 && message.Substring(0, 1) == "/")
                {
                    // C'est une commande -- l'envoyer au serveur
                    SendChatCommand(message);
                }
            }
        }
    }

    // -------------------------------------------------------
    // Envoyer la chaîne de commande au serveur via RPC
    // -------------------------------------------------------
    protected void SendChatCommand(string fullCommand)
    {
        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        Print("[ChatCommands] Sending command to server: " + fullCommand);

        Param1<string> data = new Param1<string>(fullCommand);
        GetGame().RPCSingleParam(player, CCmdRPC.COMMAND_REQUEST, data, true);
    }

    // -------------------------------------------------------
    // Recevoir le retour de commande depuis le serveur
    // -------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        if (rpc_type == CCmdRPC.COMMAND_FEEDBACK)
        {
            Param2<string, string> data = new Param2<string, string>("", "");
            if (ctx.Read(data))
            {
                string prefix = data.param1;
                string message = data.param2;

                // Afficher le retour comme message système dans le chat
                GetGame().Chat(prefix + " " + message, "colorStatusChannel");

                Print("[ChatCommands] Feedback: " + prefix + " " + message);
            }
        }
    }
};
```

### Comment fonctionne l'interception du chat

La méthode `OnEvent` sur `MissionGameplay` est appelée pour divers événements du jeu. Quand `eventTypeId` est `ChatMessageEventTypeID`, cela signifie que le joueur vient de soumettre un message de chat. Le `Param3` contient :

- `param1` -- Canal (int) : le canal de chat (global, direct, etc.)
- `param2` -- Nom de l'expéditeur (string)
- `param3` -- Texte du message (string)

Nous vérifions si le message commence par `/`. Si c'est le cas, nous transmettons la chaîne entière au serveur via RPC. Le message est aussi envoyé comme chat normal -- dans un mod de production, vous le supprimeriez (couvert dans les notes à la fin).

---

## Étape 2 : Analyser le préfixe et les arguments de la commande

Côté serveur, nous devons décomposer une chaîne de commande comme `/heal NomDuJoueur` en ses parties : le nom de la commande (`heal`) et les arguments (`["NomDuJoueur"]`).

### Créer `Scripts/3_Game/ChatCommands/CCmdRPC.c`

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST  = 79001;
    static const int COMMAND_FEEDBACK = 79002;
};
```

### Créer `Scripts/3_Game/ChatCommands/CCmdBase.c`

```c
// -------------------------------------------------------
// Classe de base pour toutes les commandes de chat
// -------------------------------------------------------
class CCmdBase
{
    // Le nom de la commande sans le préfixe / (par exemple "heal")
    string GetName()
    {
        return "";
    }

    // Description courte affichée dans l'aide ou la liste des commandes
    string GetDescription()
    {
        return "";
    }

    // Syntaxe d'utilisation affichée quand la commande est mal utilisée
    string GetUsage()
    {
        return "/" + GetName();
    }

    // Si cette commande nécessite des privilèges d'administrateur
    bool RequiresAdmin()
    {
        return true;
    }

    // Exécuter la commande sur le serveur
    // Renvoie true si réussie, false si échouée
    bool Execute(PlayerIdentity caller, array<string> args)
    {
        return false;
    }

    // -------------------------------------------------------
    // Utilitaire : Envoyer un message de retour à l'appelant de la commande
    // -------------------------------------------------------
    protected void SendFeedback(PlayerIdentity caller, string prefix, string message)
    {
        if (!caller)
            return;

        // Trouver l'objet joueur de l'appelant
        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        Man callerPlayer = null;
        for (int i = 0; i < players.Count(); i++)
        {
            Man candidate = players.Get(i);
            if (candidate && candidate.GetIdentity())
            {
                if (candidate.GetIdentity().GetId() == caller.GetId())
                {
                    callerPlayer = candidate;
                    break;
                }
            }
        }

        if (callerPlayer)
        {
            Param2<string, string> data = new Param2<string, string>(prefix, message);
            GetGame().RPCSingleParam(callerPlayer, CCmdRPC.COMMAND_FEEDBACK, data, true, caller);
        }
    }

    // -------------------------------------------------------
    // Utilitaire : Trouver un joueur par correspondance partielle de nom
    // -------------------------------------------------------
    protected Man FindPlayerByName(string partialName)
    {
        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        string searchLower = partialName;
        searchLower.ToLower();

        for (int i = 0; i < players.Count(); i++)
        {
            Man man = players.Get(i);
            if (man && man.GetIdentity())
            {
                string playerName = man.GetIdentity().GetName();
                string playerNameLower = playerName;
                playerNameLower.ToLower();

                if (playerNameLower.Contains(searchLower))
                    return man;
            }
        }

        return null;
    }
};
```

### Créer `Scripts/3_Game/ChatCommands/CCmdRegistry.c`

```c
// -------------------------------------------------------
// Registre qui contient toutes les commandes disponibles
// -------------------------------------------------------
class CCmdRegistry
{
    protected static ref map<string, ref CCmdBase> s_Commands;

    // -------------------------------------------------------
    // Initialiser le registre (appeler une fois au démarrage)
    // -------------------------------------------------------
    static void Init()
    {
        if (!s_Commands)
            s_Commands = new map<string, ref CCmdBase>;
    }

    // -------------------------------------------------------
    // Enregistrer une instance de commande
    // -------------------------------------------------------
    static void Register(CCmdBase command)
    {
        if (!s_Commands)
            Init();

        if (!command)
            return;

        string name = command.GetName();
        name.ToLower();

        if (s_Commands.Contains(name))
        {
            Print("[ChatCommands] WARNING: Command '" + name + "' already registered, overwriting.");
        }

        s_Commands.Set(name, command);
        Print("[ChatCommands] Registered command: /" + name);
    }

    // -------------------------------------------------------
    // Rechercher une commande par nom
    // -------------------------------------------------------
    static CCmdBase GetCommand(string name)
    {
        if (!s_Commands)
            return null;

        string nameLower = name;
        nameLower.ToLower();

        CCmdBase cmd;
        if (s_Commands.Find(nameLower, cmd))
            return cmd;

        return null;
    }

    // -------------------------------------------------------
    // Obtenir tous les noms de commandes enregistrées
    // -------------------------------------------------------
    static array<string> GetCommandNames()
    {
        ref array<string> names = new array<string>;

        if (s_Commands)
        {
            for (int i = 0; i < s_Commands.Count(); i++)
            {
                names.Insert(s_Commands.GetKey(i));
            }
        }

        return names;
    }

    // -------------------------------------------------------
    // Analyser une chaîne de commande brute en nom + arguments
    // Exemple : "/heal NomDuJoueur" --> nom="heal", args=["NomDuJoueur"]
    // -------------------------------------------------------
    static void ParseCommand(string fullCommand, out string commandName, out array<string> args)
    {
        args = new array<string>;
        commandName = "";

        if (fullCommand.Length() == 0)
            return;

        // Retirer le / initial
        string raw = fullCommand;
        if (raw.Substring(0, 1) == "/")
            raw = raw.Substring(1, raw.Length() - 1);

        // Découper par espaces
        raw.Split(" ", args);

        if (args.Count() > 0)
        {
            commandName = args.Get(0);
            commandName.ToLower();
            args.RemoveOrdered(0);
        }
    }
};
```

### La logique d'analyse expliquée

Étant donné l'entrée `/heal SomePlayer`, `ParseCommand` fait :

1. Retire le `/` initial pour obtenir `"heal SomePlayer"`
2. Découpe par espaces pour obtenir `["heal", "SomePlayer"]`
3. Prend le premier élément comme nom de commande : `"heal"`
4. Le retire du tableau, laissant les arguments : `["SomePlayer"]`

Le nom de la commande est converti en minuscules pour que `/Heal`, `/HEAL` et `/heal` fonctionnent tous.

---

## Étape 3 : Vérifier les permissions d'administrateur

La vérification des permissions d'administrateur empêche les joueurs normaux d'exécuter des commandes admin. DayZ n'a pas de système de permissions d'administrateur intégré dans les scripts, nous vérifions donc contre une simple liste d'administrateurs.

### La vérification admin dans le gestionnaire serveur

L'approche la plus simple est de vérifier l'identifiant Steam64 du joueur contre une liste d'identifiants admin connus. Dans un mod de production, vous chargeriez cette liste depuis un fichier de configuration.

```c
// Vérification admin simple -- en production, charger depuis un fichier JSON
static bool IsAdmin(PlayerIdentity identity)
{
    if (!identity)
        return false;

    // Vérifier l'identifiant simple du joueur (Steam64 ID)
    string playerId = identity.GetPlainId();

    // Liste d'admins codée en dur -- remplacer par un chargement de fichier en production
    ref array<string> adminIds = new array<string>;
    adminIds.Insert("76561198000000001");    // Remplacer par de vrais Steam64 IDs
    adminIds.Insert("76561198000000002");

    return (adminIds.Find(playerId) != -1);
}
```

### Où trouver les identifiants Steam64

- Ouvrez votre profil Steam dans un navigateur
- L'URL contient votre Steam64 ID : `https://steamcommunity.com/profiles/76561198XXXXXXXXX`
- Ou utilisez un outil comme https://steamid.io pour chercher n'importe quel joueur

### Permissions de qualité production

Dans un vrai mod, vous pourriez :

1. Stocker les identifiants admin dans un fichier JSON (`$profile:ChatCommands/admins.json`)
2. Charger le fichier au démarrage du serveur
3. Supporter des niveaux de permissions (modérateur, admin, superadmin)
4. Utiliser un framework comme le système `MyPermissions` de MyMod Core pour des permissions hiérarchiques

---

## Étape 4 : Exécuter l'action côté serveur

Maintenant nous créons la véritable commande `/heal` et le gestionnaire serveur qui traite les RPCs de commandes entrantes.

### Créer `Scripts/4_World/ChatCommands/commands/CCmdHeal.c`

```c
class CCmdHeal extends CCmdBase
{
    override string GetName()
    {
        return "heal";
    }

    override string GetDescription()
    {
        return "Fully heals a player (health, blood, shock, hunger, thirst)";
    }

    override string GetUsage()
    {
        return "/heal [PlayerName]";
    }

    override bool RequiresAdmin()
    {
        return true;
    }

    // -------------------------------------------------------
    // Exécuter la commande de soin
    // /heal         --> soigne l'appelant
    // /heal Nom     --> soigne le joueur nommé
    // -------------------------------------------------------
    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        if (!caller)
            return false;

        Man targetMan = null;
        string targetName = "";

        // Déterminer le joueur cible
        if (args.Count() > 0)
        {
            // Soigner un joueur spécifique par nom
            string searchName = args.Get(0);
            targetMan = FindPlayerByName(searchName);

            if (!targetMan)
            {
                SendFeedback(caller, "[Heal]", "Player '" + searchName + "' not found.");
                return false;
            }

            targetName = targetMan.GetIdentity().GetName();
        }
        else
        {
            // Soigner l'appelant lui-même
            ref array<Man> allPlayers = new array<Man>;
            GetGame().GetPlayers(allPlayers);

            for (int i = 0; i < allPlayers.Count(); i++)
            {
                Man candidate = allPlayers.Get(i);
                if (candidate && candidate.GetIdentity())
                {
                    if (candidate.GetIdentity().GetId() == caller.GetId())
                    {
                        targetMan = candidate;
                        break;
                    }
                }
            }

            if (!targetMan)
            {
                SendFeedback(caller, "[Heal]", "Could not find your player object.");
                return false;
            }

            targetName = "yourself";
        }

        // Exécuter le soin
        PlayerBase targetPlayer;
        if (!Class.CastTo(targetPlayer, targetMan))
        {
            SendFeedback(caller, "[Heal]", "Target is not a valid player.");
            return false;
        }

        HealPlayer(targetPlayer);

        // Journaliser et envoyer le retour
        Print("[ChatCommands] " + caller.GetName() + " healed " + targetName);
        SendFeedback(caller, "[Heal]", "Successfully healed " + targetName + ".");

        return true;
    }

    // -------------------------------------------------------
    // Appliquer un soin complet à un joueur
    // -------------------------------------------------------
    protected void HealPlayer(PlayerBase player)
    {
        if (!player)
            return;

        // Restaurer la santé au maximum
        player.SetHealth("GlobalHealth", "Health", player.GetMaxHealth("GlobalHealth", "Health"));

        // Restaurer le sang au maximum
        player.SetHealth("GlobalHealth", "Blood", player.GetMaxHealth("GlobalHealth", "Blood"));

        // Supprimer les dégâts de choc
        player.SetHealth("GlobalHealth", "Shock", player.GetMaxHealth("GlobalHealth", "Shock"));

        // Mettre la faim au maximum (valeur d'énergie)
        // PlayerBase a un système de statistiques -- définir la stat d'énergie
        player.GetStatEnergy().Set(player.GetStatEnergy().GetMax());

        // Mettre la soif au maximum (valeur d'eau)
        player.GetStatWater().Set(player.GetStatWater().GetMax());

        // Supprimer toutes les sources de saignement
        player.GetBleedingManagerServer().RemoveAllSources();

        Print("[ChatCommands] Healed player: " + player.GetIdentity().GetName());
    }
};
```

### Pourquoi 4_World ?

La commande heal référence `PlayerBase`, qui est défini dans la couche `4_World`. Elle utilise aussi des méthodes de statistiques du joueur (`GetStatEnergy`, `GetStatWater`, `GetBleedingManagerServer`) qui ne sont disponibles que sur les entités du monde. La commande **doit** résider dans `4_World` ou plus haut.

La classe de base `CCmdBase` réside dans `3_Game` car elle ne référence aucun type du monde. Les classes de commandes concrètes qui touchent les entités du monde résident dans `4_World`.

---

## Étape 5 : Envoyer un retour à l'administrateur

Le retour est géré par la méthode `SendFeedback()` dans `CCmdBase`. Traçons le chemin complet du retour :

### Le serveur envoie le retour

```c
// Dans CCmdBase.SendFeedback()
Param2<string, string> data = new Param2<string, string>(prefix, message);
GetGame().RPCSingleParam(callerPlayer, CCmdRPC.COMMAND_FEEDBACK, data, true, caller);
```

Le serveur envoie un RPC `COMMAND_FEEDBACK` au client spécifique qui a émis la commande. Les données contiennent un préfixe (comme `"[Heal]"`) et le texte du message.

### Le client reçoit et affiche le retour

De retour dans `CCmdChatHook.c` (Étape 1), le gestionnaire `OnRPC` intercepte ceci :

```c
if (rpc_type == CCmdRPC.COMMAND_FEEDBACK)
{
    // Désérialiser le message
    Param2<string, string> data = new Param2<string, string>("", "");
    if (ctx.Read(data))
    {
        string prefix = data.param1;
        string message = data.param2;

        // Afficher dans la fenêtre de chat
        GetGame().Chat(prefix + " " + message, "colorStatusChannel");
    }
}
```

`GetGame().Chat()` affiche un message dans la fenêtre de chat du joueur. Le deuxième paramètre est le canal de couleur :

| Canal | Couleur | Utilisation typique |
|-------|---------|---------------------|
| `"colorStatusChannel"` | Jaune/orange | Messages système |
| `"colorAction"` | Blanc | Retour d'action |
| `"colorFriendly"` | Vert | Retour positif |
| `"colorImportant"` | Rouge | Avertissements/erreurs |

---

## Étape 6 : Enregistrer les commandes

Le gestionnaire serveur reçoit les RPCs de commande, recherche la commande dans le registre et l'exécute.

### Créer `Scripts/4_World/ChatCommands/CCmdServerHandler.c`

```c
modded class MissionServer
{
    // -------------------------------------------------------
    // Enregistrer toutes les commandes au démarrage du serveur
    // -------------------------------------------------------
    override void OnInit()
    {
        super.OnInit();

        CCmdRegistry.Init();

        // Enregistrer toutes les commandes ici
        CCmdRegistry.Register(new CCmdHeal());

        // Ajouter d'autres commandes :
        // CCmdRegistry.Register(new CCmdKill());
        // CCmdRegistry.Register(new CCmdTeleport());
        // CCmdRegistry.Register(new CCmdTime());

        Print("[ChatCommands] Server initialized. Commands registered.");
    }
};

// -------------------------------------------------------
// Gestionnaire RPC côté serveur pour les commandes entrantes
// -------------------------------------------------------
modded class PlayerBase
{
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (!GetGame().IsServer())
            return;

        if (rpc_type == CCmdRPC.COMMAND_REQUEST)
        {
            HandleCommandRPC(sender, ctx);
        }
    }

    protected void HandleCommandRPC(PlayerIdentity sender, ParamsReadContext ctx)
    {
        if (!sender)
            return;

        // Lire la chaîne de commande
        Param1<string> data = new Param1<string>("");
        if (!ctx.Read(data))
        {
            Print("[ChatCommands] ERROR: Failed to read command RPC data.");
            return;
        }

        string fullCommand = data.param1;
        Print("[ChatCommands] Received command from " + sender.GetName() + ": " + fullCommand);

        // Analyser la commande
        string commandName;
        ref array<string> args;
        CCmdRegistry.ParseCommand(fullCommand, commandName, args);

        if (commandName == "")
            return;

        // Rechercher la commande
        CCmdBase command = CCmdRegistry.GetCommand(commandName);
        if (!command)
        {
            SendCommandFeedback(sender, "[Error]", "Unknown command: /" + commandName);
            return;
        }

        // Vérifier les permissions admin
        if (command.RequiresAdmin() && !IsCommandAdmin(sender))
        {
            Print("[ChatCommands] Non-admin " + sender.GetName() + " tried to use /" + commandName);
            SendCommandFeedback(sender, "[Error]", "You do not have permission to use this command.");
            return;
        }

        // Exécuter la commande
        bool success = command.Execute(sender, args);

        if (success)
            Print("[ChatCommands] Command /" + commandName + " executed successfully by " + sender.GetName());
        else
            Print("[ChatCommands] Command /" + commandName + " failed for " + sender.GetName());
    }

    // -------------------------------------------------------
    // Vérifier si un joueur est administrateur
    // -------------------------------------------------------
    protected bool IsCommandAdmin(PlayerIdentity identity)
    {
        if (!identity)
            return false;

        string playerId = identity.GetPlainId();

        // ----------------------------------------------------------
        // IMPORTANT : Remplacez ceux-ci par vos vrais Steam64 IDs d'admin
        // En production, chargez depuis un fichier de configuration JSON
        // ----------------------------------------------------------
        ref array<string> adminIds = new array<string>;
        adminIds.Insert("76561198000000001");
        adminIds.Insert("76561198000000002");

        return (adminIds.Find(playerId) != -1);
    }

    // -------------------------------------------------------
    // Envoyer un retour à un joueur spécifique
    // -------------------------------------------------------
    protected void SendCommandFeedback(PlayerIdentity target, string prefix, string message)
    {
        if (!target)
            return;

        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        for (int i = 0; i < players.Count(); i++)
        {
            Man candidate = players.Get(i);
            if (candidate && candidate.GetIdentity())
            {
                if (candidate.GetIdentity().GetId() == target.GetId())
                {
                    Param2<string, string> data = new Param2<string, string>(prefix, message);
                    GetGame().RPCSingleParam(candidate, CCmdRPC.COMMAND_FEEDBACK, data, true, target);
                    return;
                }
            }
        }
    }
};
```

### Le patron d'enregistrement

Les commandes sont enregistrées dans `MissionServer.OnInit()` :

```c
CCmdRegistry.Init();
CCmdRegistry.Register(new CCmdHeal());
```

Chaque appel `Register()` crée une instance de la classe de commande et la stocke dans un dictionnaire indexé par le nom de la commande. Quand un RPC de commande arrive, le gestionnaire recherche le nom dans le registre et appelle `Execute()` sur l'objet commande correspondant.

Ce patron rend l'ajout de nouvelles commandes trivial -- créez une nouvelle classe étendant `CCmdBase`, implémentez `Execute()`, et ajoutez une ligne `Register()`.

---

## Étape 7 : Ajouter à une liste de commandes du panneau d'administration

Si vous avez un panneau d'administration (issu du [Chapitre 8.3](03-admin-panel.md)), vous pouvez afficher la liste des commandes disponibles dans l'interface.

### Demander la liste des commandes au serveur

Ajoutez un nouvel identifiant RPC dans `CCmdRPC.c` :

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST   = 79001;
    static const int COMMAND_FEEDBACK  = 79002;
    static const int COMMAND_LIST_REQ  = 79003;
    static const int COMMAND_LIST_RESP = 79004;
};
```

### Côté serveur : Envoyer la liste des commandes

Ajoutez ce gestionnaire dans votre code côté serveur :

```c
// Dans le gestionnaire serveur, ajoutez un cas pour COMMAND_LIST_REQ
if (rpc_type == CCmdRPC.COMMAND_LIST_REQ)
{
    HandleCommandListRequest(sender);
}

protected void HandleCommandListRequest(PlayerIdentity requestor)
{
    if (!requestor)
        return;

    // Construire une chaîne formatée de toutes les commandes
    array<string> names = CCmdRegistry.GetCommandNames();
    string commandList = "Available Commands:\n";

    for (int i = 0; i < names.Count(); i++)
    {
        CCmdBase cmd = CCmdRegistry.GetCommand(names.Get(i));
        if (cmd)
        {
            commandList = commandList + cmd.GetUsage() + " - " + cmd.GetDescription() + "\n";
        }
    }

    // Renvoyer au client
    ref array<Man> players = new array<Man>;
    GetGame().GetPlayers(players);

    for (int j = 0; j < players.Count(); j++)
    {
        Man candidate = players.Get(j);
        if (candidate && candidate.GetIdentity() && candidate.GetIdentity().GetId() == requestor.GetId())
        {
            Param1<string> data = new Param1<string>(commandList);
            GetGame().RPCSingleParam(candidate, CCmdRPC.COMMAND_LIST_RESP, data, true, requestor);
            return;
        }
    }
}
```

### Côté client : Afficher dans un panneau

Sur le client, attrapez la réponse et affichez-la dans un widget texte :

```c
if (rpc_type == CCmdRPC.COMMAND_LIST_RESP)
{
    Param1<string> data = new Param1<string>("");
    if (ctx.Read(data))
    {
        string commandList = data.param1;
        // Afficher dans le widget texte de votre panneau d'administration
        // m_CommandListText.SetText(commandList);
        Print("[ChatCommands] Command list received:\n" + commandList);
    }
}
```

---

## Code complet fonctionnel : commande /heal

Voici chaque fichier nécessaire pour le système complet fonctionnel. Créez ces fichiers et votre mod aura une commande `/heal` fonctionnelle.

### Configuration config.cpp

```cpp
class CfgPatches
{
    class ChatCommands_Scripts
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
    class ChatCommands
    {
        dir = "ChatCommands";
        name = "Chat Commands";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "ChatCommands/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "ChatCommands/Scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "ChatCommands/Scripts/5_Mission" };
            };
        };
    };
};
```

### 3_Game/ChatCommands/CCmdRPC.c

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST  = 79001;
    static const int COMMAND_FEEDBACK = 79002;
};
```

### 3_Game/ChatCommands/CCmdBase.c

```c
class CCmdBase
{
    string GetName()
    {
        return "";
    }

    string GetDescription()
    {
        return "";
    }

    string GetUsage()
    {
        return "/" + GetName();
    }

    bool RequiresAdmin()
    {
        return true;
    }

    bool Execute(PlayerIdentity caller, array<string> args)
    {
        return false;
    }

    protected void SendFeedback(PlayerIdentity caller, string prefix, string message)
    {
        if (!caller)
            return;

        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        Man callerPlayer = null;
        for (int i = 0; i < players.Count(); i++)
        {
            Man candidate = players.Get(i);
            if (candidate && candidate.GetIdentity())
            {
                if (candidate.GetIdentity().GetId() == caller.GetId())
                {
                    callerPlayer = candidate;
                    break;
                }
            }
        }

        if (callerPlayer)
        {
            Param2<string, string> data = new Param2<string, string>(prefix, message);
            GetGame().RPCSingleParam(callerPlayer, CCmdRPC.COMMAND_FEEDBACK, data, true, caller);
        }
    }

    protected Man FindPlayerByName(string partialName)
    {
        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        string searchLower = partialName;
        searchLower.ToLower();

        for (int i = 0; i < players.Count(); i++)
        {
            Man man = players.Get(i);
            if (man && man.GetIdentity())
            {
                string playerName = man.GetIdentity().GetName();
                string playerNameLower = playerName;
                playerNameLower.ToLower();

                if (playerNameLower.Contains(searchLower))
                    return man;
            }
        }

        return null;
    }
};
```

### 3_Game/ChatCommands/CCmdRegistry.c

```c
class CCmdRegistry
{
    protected static ref map<string, ref CCmdBase> s_Commands;

    static void Init()
    {
        if (!s_Commands)
            s_Commands = new map<string, ref CCmdBase>;
    }

    static void Register(CCmdBase command)
    {
        if (!s_Commands)
            Init();

        if (!command)
            return;

        string name = command.GetName();
        name.ToLower();

        s_Commands.Set(name, command);
        Print("[ChatCommands] Registered command: /" + name);
    }

    static CCmdBase GetCommand(string name)
    {
        if (!s_Commands)
            return null;

        string nameLower = name;
        nameLower.ToLower();

        CCmdBase cmd;
        if (s_Commands.Find(nameLower, cmd))
            return cmd;

        return null;
    }

    static array<string> GetCommandNames()
    {
        ref array<string> names = new array<string>;

        if (s_Commands)
        {
            for (int i = 0; i < s_Commands.Count(); i++)
            {
                names.Insert(s_Commands.GetKey(i));
            }
        }

        return names;
    }

    static void ParseCommand(string fullCommand, out string commandName, out array<string> args)
    {
        args = new array<string>;
        commandName = "";

        if (fullCommand.Length() == 0)
            return;

        string raw = fullCommand;
        if (raw.Substring(0, 1) == "/")
            raw = raw.Substring(1, raw.Length() - 1);

        raw.Split(" ", args);

        if (args.Count() > 0)
        {
            commandName = args.Get(0);
            commandName.ToLower();
            args.RemoveOrdered(0);
        }
    }
};
```

### 4_World/ChatCommands/commands/CCmdHeal.c

```c
class CCmdHeal extends CCmdBase
{
    override string GetName()
    {
        return "heal";
    }

    override string GetDescription()
    {
        return "Fully heals a player (health, blood, shock, hunger, thirst)";
    }

    override string GetUsage()
    {
        return "/heal [PlayerName]";
    }

    override bool RequiresAdmin()
    {
        return true;
    }

    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        if (!caller)
            return false;

        Man targetMan = null;
        string targetName = "";

        if (args.Count() > 0)
        {
            string searchName = args.Get(0);
            targetMan = FindPlayerByName(searchName);

            if (!targetMan)
            {
                SendFeedback(caller, "[Heal]", "Player '" + searchName + "' not found.");
                return false;
            }

            targetName = targetMan.GetIdentity().GetName();
        }
        else
        {
            ref array<Man> allPlayers = new array<Man>;
            GetGame().GetPlayers(allPlayers);

            for (int i = 0; i < allPlayers.Count(); i++)
            {
                Man candidate = allPlayers.Get(i);
                if (candidate && candidate.GetIdentity())
                {
                    if (candidate.GetIdentity().GetId() == caller.GetId())
                    {
                        targetMan = candidate;
                        break;
                    }
                }
            }

            if (!targetMan)
            {
                SendFeedback(caller, "[Heal]", "Could not find your player object.");
                return false;
            }

            targetName = "yourself";
        }

        PlayerBase targetPlayer;
        if (!Class.CastTo(targetPlayer, targetMan))
        {
            SendFeedback(caller, "[Heal]", "Target is not a valid player.");
            return false;
        }

        HealPlayer(targetPlayer);

        Print("[ChatCommands] " + caller.GetName() + " healed " + targetName);
        SendFeedback(caller, "[Heal]", "Successfully healed " + targetName + ".");

        return true;
    }

    protected void HealPlayer(PlayerBase player)
    {
        if (!player)
            return;

        player.SetHealth("GlobalHealth", "Health", player.GetMaxHealth("GlobalHealth", "Health"));
        player.SetHealth("GlobalHealth", "Blood", player.GetMaxHealth("GlobalHealth", "Blood"));
        player.SetHealth("GlobalHealth", "Shock", player.GetMaxHealth("GlobalHealth", "Shock"));

        player.GetStatEnergy().Set(player.GetStatEnergy().GetMax());
        player.GetStatWater().Set(player.GetStatWater().GetMax());

        player.GetBleedingManagerServer().RemoveAllSources();
    }
};
```

### 4_World/ChatCommands/CCmdServerHandler.c

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();

        CCmdRegistry.Init();
        CCmdRegistry.Register(new CCmdHeal());

        Print("[ChatCommands] Server initialized. Commands registered.");
    }
};

modded class PlayerBase
{
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (!GetGame().IsServer())
            return;

        if (rpc_type == CCmdRPC.COMMAND_REQUEST)
        {
            HandleCommandRPC(sender, ctx);
        }
    }

    protected void HandleCommandRPC(PlayerIdentity sender, ParamsReadContext ctx)
    {
        if (!sender)
            return;

        Param1<string> data = new Param1<string>("");
        if (!ctx.Read(data))
        {
            Print("[ChatCommands] ERROR: Failed to read command RPC data.");
            return;
        }

        string fullCommand = data.param1;
        Print("[ChatCommands] Received command from " + sender.GetName() + ": " + fullCommand);

        string commandName;
        ref array<string> args;
        CCmdRegistry.ParseCommand(fullCommand, commandName, args);

        if (commandName == "")
            return;

        CCmdBase command = CCmdRegistry.GetCommand(commandName);
        if (!command)
        {
            SendCommandFeedback(sender, "[Error]", "Unknown command: /" + commandName);
            return;
        }

        if (command.RequiresAdmin() && !IsCommandAdmin(sender))
        {
            Print("[ChatCommands] Non-admin " + sender.GetName() + " tried to use /" + commandName);
            SendCommandFeedback(sender, "[Error]", "You do not have permission to use this command.");
            return;
        }

        command.Execute(sender, args);
    }

    protected bool IsCommandAdmin(PlayerIdentity identity)
    {
        if (!identity)
            return false;

        string playerId = identity.GetPlainId();

        // REMPLACEZ CEUX-CI PAR VOS VRAIS STEAM64 IDS D'ADMIN
        ref array<string> adminIds = new array<string>;
        adminIds.Insert("76561198000000001");
        adminIds.Insert("76561198000000002");

        return (adminIds.Find(playerId) != -1);
    }

    protected void SendCommandFeedback(PlayerIdentity target, string prefix, string message)
    {
        if (!target)
            return;

        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        for (int i = 0; i < players.Count(); i++)
        {
            Man candidate = players.Get(i);
            if (candidate && candidate.GetIdentity() && candidate.GetIdentity().GetId() == target.GetId())
            {
                Param2<string, string> data = new Param2<string, string>(prefix, message);
                GetGame().RPCSingleParam(candidate, CCmdRPC.COMMAND_FEEDBACK, data, true, target);
                return;
            }
        }
    }
};
```

### 5_Mission/ChatCommands/CCmdChatHook.c

```c
modded class MissionGameplay
{
    override void OnEvent(EventType eventTypeId, Param params)
    {
        super.OnEvent(eventTypeId, params);

        if (eventTypeId == ChatMessageEventTypeID)
        {
            Param3<int, string, string> chatParams;
            if (Class.CastTo(chatParams, params))
            {
                string message = chatParams.param3;

                if (message.Length() > 0 && message.Substring(0, 1) == "/")
                {
                    SendChatCommand(message);
                }
            }
        }
    }

    protected void SendChatCommand(string fullCommand)
    {
        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        Print("[ChatCommands] Sending command to server: " + fullCommand);

        Param1<string> data = new Param1<string>(fullCommand);
        GetGame().RPCSingleParam(player, CCmdRPC.COMMAND_REQUEST, data, true);
    }

    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        if (rpc_type == CCmdRPC.COMMAND_FEEDBACK)
        {
            Param2<string, string> data = new Param2<string, string>("", "");
            if (ctx.Read(data))
            {
                string prefix = data.param1;
                string message = data.param2;

                GetGame().Chat(prefix + " " + message, "colorStatusChannel");
                Print("[ChatCommands] Feedback: " + prefix + " " + message);
            }
        }
    }
};
```

---

## Ajouter d'autres commandes

Le patron de registre rend l'ajout de nouvelles commandes simple. Voici des exemples :

### Commande /kill

```c
class CCmdKill extends CCmdBase
{
    override string GetName()        { return "kill"; }
    override string GetDescription() { return "Kills a player"; }
    override string GetUsage()       { return "/kill [PlayerName]"; }

    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        Man targetMan = null;

        if (args.Count() > 0)
            targetMan = FindPlayerByName(args.Get(0));
        else
        {
            ref array<Man> players = new array<Man>;
            GetGame().GetPlayers(players);
            for (int i = 0; i < players.Count(); i++)
            {
                if (players.Get(i).GetIdentity() && players.Get(i).GetIdentity().GetId() == caller.GetId())
                {
                    targetMan = players.Get(i);
                    break;
                }
            }
        }

        if (!targetMan)
        {
            SendFeedback(caller, "[Kill]", "Player not found.");
            return false;
        }

        PlayerBase targetPlayer;
        if (Class.CastTo(targetPlayer, targetMan))
        {
            targetPlayer.SetHealth("GlobalHealth", "Health", 0);
            SendFeedback(caller, "[Kill]", "Killed " + targetMan.GetIdentity().GetName() + ".");
            return true;
        }

        return false;
    }
};
```

### Commande /time

```c
class CCmdTime extends CCmdBase
{
    override string GetName()        { return "time"; }
    override string GetDescription() { return "Sets the server time (0-23)"; }
    override string GetUsage()       { return "/time <hour>"; }

    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        if (args.Count() < 1)
        {
            SendFeedback(caller, "[Time]", "Usage: " + GetUsage());
            return false;
        }

        int hour = args.Get(0).ToInt();
        if (hour < 0 || hour > 23)
        {
            SendFeedback(caller, "[Time]", "Hour must be between 0 and 23.");
            return false;
        }

        GetGame().GetWorld().SetDate(2024, 6, 15, hour, 0);
        SendFeedback(caller, "[Time]", "Server time set to " + hour.ToString() + ":00.");
        return true;
    }
};
```

### Enregistrer de nouvelles commandes

Ajoutez une ligne par commande dans `MissionServer.OnInit()` :

```c
CCmdRegistry.Register(new CCmdHeal());
CCmdRegistry.Register(new CCmdKill());
CCmdRegistry.Register(new CCmdTime());
```

---

## Dépannage

### La commande n'est pas reconnue ("Unknown command")

- **Enregistrement manquant :** Assurez-vous que `CCmdRegistry.Register(new CCmdVotreCommande())` est appelé dans `MissionServer.OnInit()`.
- **Faute de frappe dans GetName() :** La chaîne renvoyée par `GetName()` doit correspondre à ce que le joueur tape (sans le `/`).
- **Non-correspondance de casse :** Le registre convertit les noms en minuscules. `/Heal`, `/HEAL` et `/heal` devraient tous fonctionner.

### Permission refusée pour les administrateurs

- **Mauvais Steam64 ID :** Vérifiez bien les identifiants admin dans `IsCommandAdmin()`. Ce doivent être des Steam64 IDs exacts (nombres de 17 chiffres commençant par `7656`).
- **GetPlainId() vs GetId() :** `GetPlainId()` renvoie le Steam64 ID. `GetId()` renvoie l'identifiant de session DayZ. Utilisez `GetPlainId()` pour les vérifications admin.

### Le message de retour n'apparaît pas dans le chat

- **RPC n'atteignant pas le client :** Ajoutez des instructions `Print()` sur le serveur pour confirmer que le RPC de retour est envoyé.
- **Le OnRPC client ne l'attrape pas :** Vérifiez que l'identifiant RPC correspond (`CCmdRPC.COMMAND_FEEDBACK`).
- **GetGame().Chat() ne fonctionne pas :** Cette fonction nécessite que le jeu soit dans un état où le chat est disponible. Elle peut ne pas fonctionner sur l'écran de chargement.

### /heal ne soigne pas réellement

- **Exécution côté serveur uniquement :** `SetHealth()` et les changements de statistiques doivent s'exécuter sur le serveur. Vérifiez que `GetGame().IsServer()` est vrai quand `Execute()` s'exécute.
- **Le cast PlayerBase échoue :** Si `Class.CastTo(targetPlayer, targetMan)` renvoie false, la cible n'est pas un PlayerBase valide. Cela peut arriver avec l'IA ou les entités non-joueur.
- **Les getters de statistiques renvoient null :** `GetStatEnergy()` et `GetStatWater()` peuvent renvoyer null si le joueur est mort ou pas entièrement initialisé. Ajoutez des vérifications de null dans le code de production.

### La commande apparaît dans le chat comme message normal

- Le hook `OnEvent` intercepte le message mais ne le supprime pas de l'envoi en tant que chat. Pour le supprimer dans un mod de production, vous devriez modder la classe `ChatInputMenu` pour filtrer les messages `/` avant leur envoi :

```c
modded class ChatInputMenu
{
    override void OnChatInputSend()
    {
        string text = "";
        // Obtenir le texte actuel du widget d'édition
        // S'il commence par /, NE PAS appeler super (qui l'envoie comme chat)
        // À la place, le traiter comme une commande

        // Cette approche varie selon la version de DayZ -- vérifiez les sources vanilla
        super.OnChatInputSend();
    }
};
```

L'implémentation exacte dépend de la version de DayZ et de la façon dont `ChatInputMenu` expose le texte. L'approche `OnEvent` de ce tutoriel est plus simple et fonctionne pour le développement, avec le compromis que le texte de la commande apparaît aussi comme message de chat.

---

## Prochaines étapes

1. **Charger les admins depuis un fichier de configuration** -- Utilisez `JsonFileLoader` pour charger les identifiants admin depuis un fichier JSON au lieu de les coder en dur.
2. **Ajouter une commande /help** -- Listez toutes les commandes disponibles avec leurs descriptions et syntaxes d'utilisation.
3. **Ajouter la journalisation** -- Écrivez l'utilisation des commandes dans un fichier journal à des fins d'audit.
4. **Intégrer avec un framework** -- MyMod Core fournit `MyPermissions` pour les permissions hiérarchiques et `MyRPC` pour les RPCs routés par chaîne qui évitent les collisions d'identifiants entiers.
5. **Ajouter des temps de recharge** -- Empêchez le spam de commandes en suivant le dernier temps d'exécution par joueur.
6. **Construire une interface palette de commandes** -- Créez un panneau d'administration qui liste toutes les commandes avec des boutons cliquables (en combinant ce tutoriel avec le [Chapitre 8.3](03-admin-panel.md)).

---

## Bonnes pratiques

- **Vérifiez toujours les permissions avant d'exécuter des commandes admin.** Une vérification de permission manquante signifie que n'importe quel joueur peut `/heal` ou `/kill` n'importe qui. Validez le Steam64 ID de l'appelant (via `GetPlainId()`) sur le serveur avant le traitement.
- **Envoyez un retour à l'admin même pour les commandes échouées.** Les échecs silencieux rendent le débogage impossible. Envoyez toujours un message de chat expliquant ce qui s'est mal passé ("Player not found", "Permission denied").
- **Utilisez `GetPlainId()` pour les vérifications admin, pas `GetId()`.** `GetId()` renvoie un identifiant DayZ spécifique à la session qui change à chaque reconnexion. `GetPlainId()` renvoie le Steam64 ID permanent.
- **Stockez les identifiants admin dans un fichier de configuration JSON, pas dans le code.** Les identifiants codés en dur nécessitent une reconstruction du PBO pour être modifiés. Un fichier JSON `$profile:` peut être édité par les administrateurs de serveur sans connaissances de modding.
- **Convertissez les noms de commandes en minuscules avant la correspondance.** Les joueurs peuvent taper `/Heal`, `/HEAL` ou `/heal`. La normalisation en minuscules évite les erreurs frustrantes de "commande inconnue".

---

## Théorie vs pratique

| Concept | Théorie | Réalité |
|---------|---------|---------|
| Hook de chat via `OnEvent` | Intercepter le message et le traiter comme commande | Le message apparaît quand même dans le chat pour tous les joueurs. Le supprimer nécessite de modder `ChatInputMenu`, ce qui varie selon la version de DayZ. |
| `GetGame().Chat()` | Affiche un message dans la fenêtre de chat du joueur | Ne fonctionne que quand l'interface de chat est active. Sur l'écran de chargement ou dans certains états de menu, le message est silencieusement ignoré. |
| Patron de registre de commandes | Architecture propre avec une classe par commande | Chaque fichier de classe de commande doit aller dans la bonne couche de script. `CCmdBase` dans `3_Game`, les commandes concrètes référençant `PlayerBase` dans `4_World`. Un mauvais placement de couche cause "Undefined type" au chargement. |
| Recherche de joueur par nom | `FindPlayerByName` fait une correspondance partielle | La correspondance partielle peut cibler le mauvais joueur sur un serveur avec des noms similaires. En production, préférez le ciblage par Steam64 ID ou ajoutez une étape de confirmation. |

---

## Ce que vous avez appris

Dans ce tutoriel, vous avez appris :
- Comment intercepter l'entrée du chat en utilisant `MissionGameplay.OnEvent` avec `ChatMessageEventTypeID`
- Comment analyser les préfixes de commandes et les arguments depuis le texte du chat
- Comment vérifier les permissions d'administrateur sur le serveur en utilisant les Steam64 IDs
- Comment envoyer un retour de commande au joueur via RPC et `GetGame().Chat()`
- Comment construire un patron de registre de commandes réutilisable pour ajouter de nouvelles commandes

**Suivant :** [Chapitre 8.6 : Débogage et test de votre mod](06-debugging-testing.md)

---

**Précédent :** [Chapitre 8.3 : Construire un module de panneau d'administration](03-admin-panel.md)
