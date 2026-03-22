# Chapitre 6.6 : Systeme de notifications

[Accueil](../../README.md) | [<< Precedent : Effets post-traitement](05-ppe.md) | **Notifications** | [Suivant : Timers & CallQueue >>](07-timers.md)

---

## Introduction

DayZ inclut un systeme de notifications integre pour afficher des messages contextuels de type toast aux joueurs. La classe `NotificationSystem` fournit des methodes statiques pour envoyer des notifications a la fois localement (cote client) et du serveur au client via RPC. Ce chapitre couvre l'API complete pour l'envoi, la personnalisation et la gestion des notifications.

---

## NotificationSystem

**Fichier :** `3_Game/client/notifications/notificationsystem.c` (320 lignes)

Une classe statique qui gere la file d'attente des notifications. Les notifications apparaissent sous forme de petites cartes contextuelles en haut de l'ecran, empilees verticalement, et disparaissent en fondu apres l'expiration de leur duree d'affichage.

### Constantes

```c
const int   DEFAULT_TIME_DISPLAYED = 10;    // Duree d'affichage par defaut en secondes
const float NOTIFICATION_FADE_TIME = 3.0;   // Duree du fondu de sortie en secondes
static const int MAX_NOTIFICATIONS = 5;     // Nombre maximum de notifications visibles
```

---

## Notifications serveur vers client

Ces methodes sont appelees sur le serveur. Elles envoient un RPC au client du joueur cible, qui affiche la notification localement.

### SendNotificationToPlayerExtended

```c
static void SendNotificationToPlayerExtended(
    Man player,            // Joueur cible (Man ou PlayerBase)
    float show_time,       // Duree d'affichage en secondes
    string title_text,     // Titre de la notification
    string detail_text = "",  // Texte du corps (optionnel)
    string icon = ""       // Chemin de l'icone (optionnel, ex. "set:dayz_gui image:icon_info")
);
```

**Exemple -- notifier un joueur specifique :**

```c
void NotifyPlayer(PlayerBase player, string message)
{
    if (!GetGame().IsServer())
        return;

    NotificationSystem.SendNotificationToPlayerExtended(
        player,
        8.0,                   // Afficher pendant 8 secondes
        "Avis du serveur",     // Titre
        message,               // Corps
        ""                     // Icone par defaut
    );
}
```

### SendNotificationToPlayerIdentityExtended

```c
static void SendNotificationToPlayerIdentityExtended(
    PlayerIdentity player,   // Identite cible (null = diffusion a TOUS les joueurs)
    float show_time,
    string title_text,
    string detail_text = "",
    string icon = ""
);
```

**Exemple -- diffuser a tous les joueurs :**

```c
void BroadcastNotification(string title, string message)
{
    if (!GetGame().IsServer())
        return;

    NotificationSystem.SendNotificationToPlayerIdentityExtended(
        null,                  // null = tous les joueurs connectes
        10.0,                  // Afficher pendant 10 secondes
        title,
        message,
        ""
    );
}
```

### SendNotificationToPlayer (type)

```c
static void SendNotificationToPlayer(
    Man player,
    NotificationType type,    // Type de notification predefini
    float show_time,
    string detail_text = ""
);
```

Cette variante utilise des valeurs d'enumeration `NotificationType` predefinies qui correspondent a des titres et icones integres. Le `detail_text` est ajoute comme corps.

---

## Notifications cote client (locales)

Ces methodes affichent des notifications uniquement sur le client local. Elles n'impliquent aucune communication reseau.

### AddNotificationExtended

```c
static void AddNotificationExtended(
    float show_time,
    string title_text,
    string detail_text = "",
    string icon = ""
);
```

**Exemple -- notification locale sur le client :**

```c
void ShowLocalNotification(string title, string body)
{
    if (!GetGame().IsClient())
        return;

    NotificationSystem.AddNotificationExtended(
        5.0,
        title,
        body,
        "set:dayz_gui image:icon_info"
    );
}
```

### AddNotification (type)

```c
static void AddNotification(
    NotificationType type,
    float show_time,
    string detail_text = ""
);
```

Utilise un `NotificationType` predefini pour le titre et l'icone.

---

## Enumeration NotificationType

Le jeu vanilla definit des types de notification avec des titres et icones associes. Valeurs courantes :

| Type | Description |
|------|-------------|
| `NotificationType.GENERIC` | Notification generique |
| `NotificationType.FRIENDLY_FIRE` | Avertissement de tir ami |
| `NotificationType.JOIN` | Connexion d'un joueur |
| `NotificationType.LEAVE` | Deconnexion d'un joueur |
| `NotificationType.STATUS` | Mise a jour de statut |

> **Note :** Les types disponibles dependent de la version du jeu. Pour une flexibilite maximale, utilisez les variantes `Extended` qui acceptent des chaines personnalisees pour le titre et l'icone.

---

## Chemins d'icones

Les icones utilisent la syntaxe de jeu d'images DayZ :

```
"set:dayz_gui image:nom_icone"
```

Noms d'icones courants :

| Icone | Chemin du jeu d'images |
|-------|------------------------|
| Info | `"set:dayz_gui image:icon_info"` |
| Avertissement | `"set:dayz_gui image:icon_warning"` |
| Crane | `"set:dayz_gui image:icon_skull"` |

Vous pouvez egalement passer un chemin direct vers un fichier image `.edds` :

```c
"MyMod/GUI/notification_icon.edds"
```

Ou passer une chaine vide `""` pour aucune icone.

---

## Evenements

Le `NotificationSystem` expose des invocateurs de scripts pour reagir au cycle de vie des notifications :

```c
ref ScriptInvoker m_OnNotificationAdded;
ref ScriptInvoker m_OnNotificationRemoved;
```

**Exemple -- reagir aux notifications :**

```c
void Init()
{
    NotificationSystem notifSys = GetNotificationSystem();
    if (notifSys)
    {
        notifSys.m_OnNotificationAdded.Insert(OnNotifAdded);
        notifSys.m_OnNotificationRemoved.Insert(OnNotifRemoved);
    }
}

void OnNotifAdded()
{
    Print("Une notification a ete ajoutee");
}

void OnNotifRemoved()
{
    Print("Une notification a ete supprimee");
}
```

---

## Boucle de mise a jour

Le systeme de notifications doit etre actualise a chaque image pour gerer les animations d'apparition/disparition en fondu et la suppression des notifications expirees :

```c
static void Update(float timeslice);
```

Ceci est appele automatiquement par la methode `OnUpdate` de la mission vanilla. Si vous ecrivez une mission entierement personnalisee, assurez-vous de l'appeler.

---

## Exemple complet serveur vers client

Un patron de mod typique pour envoyer des notifications depuis le code serveur :

```c
// Cote serveur : dans un gestionnaire d'evenements de mission ou un module
class MyServerModule
{
    void OnMissionStarted(string missionName, vector location)
    {
        if (!GetGame().IsServer())
            return;

        // Diffuser a tous les joueurs
        string title = "Mission demarree !";
        string body = string.Format("Allez a %1 !", missionName);

        NotificationSystem.SendNotificationToPlayerIdentityExtended(
            null,
            12.0,
            title,
            body,
            "set:dayz_gui image:icon_info"
        );
    }

    void OnPlayerEnteredZone(PlayerBase player, string zoneName)
    {
        if (!GetGame().IsServer())
            return;

        // Notifier uniquement ce joueur
        NotificationSystem.SendNotificationToPlayerExtended(
            player,
            5.0,
            "Zone atteinte",
            string.Format("Vous etes entre dans %1", zoneName),
            ""
        );
    }
}
```

---

## Alternative CommunityFramework (CF)

Si vous utilisez CommunityFramework, il fournit sa propre API de notification :

```c
// Notification CF (RPC interne different)
NotificationSystem.Create(
    new StringLocaliser("Titre"),
    new StringLocaliser("Corps avec parametre : %1", someValue),
    "set:dayz_gui image:icon_info",
    COLOR_GREEN,
    5,
    player.GetIdentity()
);
```

L'API CF ajoute la prise en charge des couleurs et de la localisation. Utilisez le systeme qui convient a votre pile de mods -- ils sont fonctionnellement similaires mais utilisent des RPC internes differents.

---

## Resume

| Concept | Point cle |
|---------|-----------|
| Serveur vers joueur | `SendNotificationToPlayerExtended(player, time, title, text, icon)` |
| Serveur vers tous | `SendNotificationToPlayerIdentityExtended(null, time, title, text, icon)` |
| Client local | `AddNotificationExtended(time, title, text, icon)` |
| Type | `SendNotificationToPlayer(player, NotificationType, time, text)` |
| Maximum visible | 5 notifications empilees |
| Duree par defaut | 10 secondes d'affichage, 3 secondes de fondu |
| Icones | `"set:dayz_gui image:nom_icone"` ou chemin direct `.edds` |
| Evenements | `m_OnNotificationAdded`, `m_OnNotificationRemoved` |

---

## Bonnes pratiques

- **Utilisez les variantes `Extended` pour les notifications personnalisees.** `SendNotificationToPlayerExtended` vous donne un controle total sur le titre, le corps et l'icone. Les variantes typees `NotificationType` sont limitees aux presets vanilla.
- **Respectez la limite de 5 notifications empilees.** Envoyer de nombreuses notifications en succession rapide repousse les anciennes hors de l'ecran avant que les joueurs puissent les lire. Regroupez les messages connexes ou utilisez des durees d'affichage plus longues.
- **Protegez toujours les notifications serveur avec `GetGame().IsServer()`.** Appeler `SendNotificationToPlayerExtended` sur le client n'a aucun effet et gaspille un appel de methode.
- **Passez `null` comme identite pour les diffusions reelles.** `SendNotificationToPlayerIdentityExtended(null, ...)` envoie a tous les joueurs connectes. Ne parcourez pas manuellement les joueurs pour envoyer le meme message.
- **Gardez le texte de notification concis.** La fenetre contextuelle toast a une largeur d'affichage limitee. Les titres ou corps longs seront tronques. Visez des titres de moins de 30 caracteres et un corps de moins de 80 caracteres.

---

## Compatibilite et impact

- **Multi-Mod :** Le `NotificationSystem` vanilla est partage par tous les mods. Plusieurs mods envoyant des notifications simultanement peuvent deborder la pile de 5 notifications. CF fournit un canal de notification separe qui n'entre pas en conflit avec les notifications vanilla.
- **Performance :** Les notifications sont legeres (un seul RPC par notification). Cependant, diffuser a tous les joueurs toutes les quelques secondes genere un trafic reseau mesurable sur les serveurs de 60+ joueurs.
- **Serveur/Client :** Les methodes `SendNotificationToPlayer*` sont des RPC serveur-vers-client. `AddNotificationExtended` est uniquement cote client (local). Le tick `Update()` s'execute dans la boucle de mission du client.

---

[<< Precedent : Effets post-traitement](05-ppe.md) | **Notifications** | [Suivant : Timers & CallQueue >>](07-timers.md)
