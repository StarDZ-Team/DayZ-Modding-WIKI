# Chapitre 7.1 : Le patron Singleton

[Accueil](../README.md) | **Patron Singleton** | [Suivant : Systèmes de modules >>](02-module-systems.md)

---

## Introduction

Le patron singleton garantit qu'une classe possède exactement une instance, accessible globalement. Dans le modding DayZ, c'est le patron architectural le plus courant --- pratiquement chaque gestionnaire, cache, registre et sous-système l'utilise. COT, VPP, Expansion, Dabs Framework et d'autres s'appuient tous sur des singletons pour coordonner l'état à travers les couches de script du moteur.

Ce chapitre couvre l'implémentation canonique, la gestion du cycle de vie, les cas où le patron est approprié, et où il peut mal tourner.

---

## Table des matières

- [L'implémentation canonique](#limplémentation-canonique)
- [Initialisation paresseuse vs hâtive](#initialisation-paresseuse-vs-hâtive)
- [Gestion du cycle de vie](#gestion-du-cycle-de-vie)
- [Quand utiliser les singletons](#quand-utiliser-les-singletons)
- [Exemples concrets](#exemples-concrets)
- [Considérations sur la sécurité des threads](#considérations-sur-la-sécurité-des-threads)
- [Anti-patrons](#anti-patrons)
- [Alternative : classes entièrement statiques](#alternative--classes-entièrement-statiques)
- [Liste de vérification](#liste-de-vérification)

---

## L'implémentation canonique

Le singleton standard de DayZ suit une formule simple : un champ `private static ref`, un accesseur statique `GetInstance()`, et un `DestroyInstance()` statique pour le nettoyage.

```c
class LootManager
{
    // L'instance unique. 'ref' la maintient en vie ; 'private' empêche la manipulation externe.
    private static ref LootManager s_Instance;

    // Données privées possédées par le singleton
    protected ref map<string, int> m_SpawnCounts;

    // Constructeur — appelé exactement une fois
    void LootManager()
    {
        m_SpawnCounts = new map<string, int>();
    }

    // Destructeur — appelé lorsque s_Instance est mis à null
    void ~LootManager()
    {
        m_SpawnCounts = null;
    }

    // Accesseur paresseux : crée à la première utilisation
    static LootManager GetInstance()
    {
        if (!s_Instance)
        {
            s_Instance = new LootManager();
        }
        return s_Instance;
    }

    // Nettoyage explicite
    static void DestroyInstance()
    {
        s_Instance = null;
    }

    // --- API publique ---

    void RecordSpawn(string className)
    {
        int count = 0;
        m_SpawnCounts.Find(className, count);
        m_SpawnCounts.Set(className, count + 1);
    }

    int GetSpawnCount(string className)
    {
        int count = 0;
        m_SpawnCounts.Find(className, count);
        return count;
    }
};
```

### Pourquoi `private static ref` ?

| Mot-clé | Objectif |
|---------|----------|
| `private` | Empêche les autres classes de mettre `s_Instance` à null ou de le remplacer |
| `static` | Partagé entre tout le code --- pas besoin d'instance pour y accéder |
| `ref` | Référence forte --- maintient l'objet en vie tant que `s_Instance` est non-null |

Sans `ref`, l'instance serait une référence faible et pourrait être récupérée par le ramasse-miettes alors qu'elle est encore utilisée.

---

## Initialisation paresseuse vs hâtive

### Initialisation paresseuse (recommandée par défaut)

La méthode `GetInstance()` crée l'instance lors du premier accès. C'est l'approche utilisée par la plupart des mods DayZ.

```c
static LootManager GetInstance()
{
    if (!s_Instance)
    {
        s_Instance = new LootManager();
    }
    return s_Instance;
}
```

**Avantages :**
- Aucun travail effectué tant que ce n'est pas nécessaire
- Pas de dépendance à l'ordre d'initialisation entre les mods
- Sûr si le singleton est optionnel (certaines configurations serveur pourraient ne jamais l'appeler)

**Inconvénient :**
- Le premier appelant paie le coût de construction (généralement négligeable)

### Initialisation hâtive

Certains singletons sont créés explicitement pendant le démarrage de la mission, typiquement depuis `MissionServer.OnInit()` ou le `OnMissionStart()` d'un module.

```c
// Dans votre MissionServer.OnInit() moddé :
void OnInit()
{
    super.OnInit();
    LootManager.Create();  // Hâtif : construit maintenant, pas à la première utilisation
}

// Dans LootManager :
static void Create()
{
    if (!s_Instance)
    {
        s_Instance = new LootManager();
    }
}
```

**Quand préférer l'initialisation hâtive :**
- Le singleton charge des données depuis le disque (configs, fichiers JSON) et vous voulez que les erreurs de chargement apparaissent au démarrage
- Le singleton enregistre des gestionnaires RPC qui doivent être en place avant que tout client ne se connecte
- L'ordre d'initialisation est important et vous devez le contrôler explicitement

---

## Gestion du cycle de vie

La source de bugs de singleton la plus courante dans DayZ est l'absence de nettoyage en fin de mission. Les serveurs DayZ peuvent redémarrer les missions sans redémarrer le processus, ce qui signifie que les champs statiques survivent entre les redémarrages de mission. Si vous ne mettez pas `s_Instance` à null dans `OnMissionFinish`, vous transportez des références périmées, des objets morts et des callbacks orphelins dans la mission suivante.

### Le contrat de cycle de vie

```
Démarrage du processus serveur
  └─ MissionServer.OnInit()
       └─ Créer les singletons (hâtif) ou les laisser se créer (paresseux)
  └─ MissionServer.OnMissionStart()
       └─ Les singletons commencent à fonctionner
  └─ ... le serveur tourne ...
  └─ MissionServer.OnMissionFinish()
       └─ DestroyInstance() sur chaque singleton
       └─ Toutes les réfs statiques mises à null
  └─ (La mission peut redémarrer)
       └─ Singletons frais créés à nouveau
```

### Patron de nettoyage

Associez toujours votre singleton à une méthode `DestroyInstance()` et appelez-la lors de l'arrêt :

```c
class VehicleRegistry
{
    private static ref VehicleRegistry s_Instance;
    protected ref array<ref VehicleData> m_Vehicles;

    static VehicleRegistry GetInstance()
    {
        if (!s_Instance) s_Instance = new VehicleRegistry();
        return s_Instance;
    }

    static void DestroyInstance()
    {
        s_Instance = null;  // Libère la réf, le destructeur s'exécute
    }

    void ~VehicleRegistry()
    {
        if (m_Vehicles) m_Vehicles.Clear();
        m_Vehicles = null;
    }
};

// Dans votre MissionServer moddé :
modded class MissionServer
{
    override void OnMissionFinish()
    {
        VehicleRegistry.DestroyInstance();
        super.OnMissionFinish();
    }
};
```

### Patron d'arrêt centralisé

Un mod de framework peut consolider tout le nettoyage des singletons dans `MyFramework.ShutdownAll()`, qui est appelé depuis le `MissionServer.OnMissionFinish()` moddé. Cela évite l'erreur courante d'oublier un singleton :

```c
// Patron conceptuel (arrêt centralisé) :
static void ShutdownAll()
{
    MyRPC.Cleanup();
    MyEventBus.Cleanup();
    MyModuleManager.Cleanup();
    MyConfigManager.DestroyInstance();
    MyPermissions.DestroyInstance();
}
```

---

## Quand utiliser les singletons

### Bons candidats

| Cas d'utilisation | Pourquoi le singleton fonctionne |
|-------------------|--------------------------------|
| **Classes gestionnaires** (LootManager, VehicleManager) | Exactement un coordinateur pour un domaine |
| **Caches** (cache CfgVehicles, cache d'icônes) | Source unique de vérité évitant les calculs redondants |
| **Registres** (registre de gestionnaires RPC, registre de modules) | La recherche centrale doit être accessible globalement |
| **Conteneurs de configuration** (paramètres serveur, permissions) | Une config par mod, chargée une fois depuis le disque |
| **Répartiteurs RPC** | Point d'entrée unique pour tous les RPC entrants |

### Mauvais candidats

| Cas d'utilisation | Pourquoi non |
|-------------------|-------------|
| **Données par joueur** | Une instance par joueur, pas une instance globale |
| **Calculs temporaires** | Créer, utiliser, jeter --- pas besoin d'état global |
| **Vues / dialogues d'interface** | Plusieurs peuvent coexister ; utilisez la pile de vues à la place |
| **Composants d'entité** | Attachés à des objets individuels, pas globaux |

---

## Exemples concrets

### COT (Community Online Tools)

COT utilise un patron singleton basé sur les modules à travers le framework CF. Chaque outil est un singleton `JMModuleBase` enregistré au démarrage :

```c
// Patron COT : CF instancie automatiquement les modules déclarés dans config.cpp
class JM_COT_ESP : JMModuleBase
{
    // CF gère le cycle de vie du singleton
    // Accès via : JM_COT_ESP.Cast(GetModuleManager().GetModule(JM_COT_ESP));
}
```

### VPP Admin Tools

VPP utilise un `GetInstance()` explicite sur les classes gestionnaires :

```c
// Patron VPP (simplifié)
class VPPATBanManager
{
    private static ref VPPATBanManager m_Instance;

    static VPPATBanManager GetInstance()
    {
        if (!m_Instance)
            m_Instance = new VPPATBanManager();
        return m_Instance;
    }
}
```

### Expansion

Expansion déclare des singletons pour chaque sous-système et s'accroche au cycle de vie de la mission pour le nettoyage :

```c
// Patron Expansion (simplifié)
class ExpansionMarketModule : CF_ModuleWorld
{
    // CF_ModuleWorld est lui-même un singleton géré par le système de modules CF
    // ExpansionMarketModule.Cast(CF_ModuleCoreManager.Get(ExpansionMarketModule));
}
```

---

## Considérations sur la sécurité des threads

Enforce Script est mono-thread. Toute l'exécution de script se fait sur le thread principal dans la boucle de jeu du moteur Enfusion. Cela signifie :

- Il n'y a **pas de conditions de concurrence** entre threads simultanés
- Vous n'avez **pas besoin** de mutex, verrous ou opérations atomiques
- `GetInstance()` avec initialisation paresseuse est toujours sûr

Cependant, la **réentrance** peut encore causer des problèmes. Si `GetInstance()` déclenche du code qui appelle `GetInstance()` à nouveau pendant la construction, vous pouvez obtenir un singleton partiellement initialisé :

```c
// DANGEREUX : construction réentrante du singleton
class BadManager
{
    private static ref BadManager s_Instance;

    void BadManager()
    {
        // Ceci appelle GetInstance() pendant la construction !
        OtherSystem.Register(BadManager.GetInstance());
    }

    static BadManager GetInstance()
    {
        if (!s_Instance)
        {
            // s_Instance est encore null ici pendant la construction
            s_Instance = new BadManager();
        }
        return s_Instance;
    }
};
```

La solution est d'assigner `s_Instance` avant d'exécuter toute initialisation qui pourrait réentrer :

```c
static BadManager GetInstance()
{
    if (!s_Instance)
    {
        s_Instance = new BadManager();  // Assigner d'abord
        s_Instance.Initialize();         // Puis exécuter l'initialisation qui pourrait appeler GetInstance()
    }
    return s_Instance;
}
```

Ou mieux encore, évitez complètement l'initialisation circulaire.

---

## Anti-patrons

### 1. État global mutable sans encapsulation

Le patron singleton vous donne un accès global. Cela ne signifie pas que les données doivent être modifiables globalement.

```c
// MAUVAIS : Les champs publics invitent à des modifications non contrôlées
class GameState
{
    private static ref GameState s_Instance;
    int PlayerCount;         // N'importe qui peut écrire ici
    bool ServerLocked;       // N'importe qui peut écrire ici
    string CurrentWeather;   // N'importe qui peut écrire ici

    static GameState GetInstance() { ... }
};

// N'importe quel code peut faire :
GameState.GetInstance().PlayerCount = -999;  // Chaos
```

```c
// BON : Accès contrôlé via des méthodes
class GameState
{
    private static ref GameState s_Instance;
    protected int m_PlayerCount;
    protected bool m_ServerLocked;

    int GetPlayerCount() { return m_PlayerCount; }

    void IncrementPlayerCount()
    {
        m_PlayerCount++;
    }

    static GameState GetInstance() { ... }
};
```

### 2. DestroyInstance manquant

Si vous oubliez le nettoyage, le singleton persiste entre les redémarrages de mission avec des données périmées :

```c
// MAUVAIS : Pas de chemin de nettoyage
class ZombieTracker
{
    private static ref ZombieTracker s_Instance;
    ref array<Object> m_TrackedZombies;  // Ces objets sont supprimés en fin de mission !

    static ZombieTracker GetInstance() { ... }
    // Pas de DestroyInstance() — m_TrackedZombies contient maintenant des références mortes
};
```

### 3. Singletons qui possèdent tout

Quand un singleton accumule trop de responsabilités, il devient un "objet Dieu" impossible à comprendre :

```c
// MAUVAIS : Un singleton qui fait tout
class ServerManager
{
    // Gère le loot ET les véhicules ET la météo ET les spawns ET les bans ET...
    ref array<Object> m_Loot;
    ref array<Object> m_Vehicles;
    ref WeatherData m_Weather;
    ref array<string> m_BannedPlayers;

    void SpawnLoot() { ... }
    void DespawnVehicle() { ... }
    void SetWeather() { ... }
    void BanPlayer() { ... }
    // 2000 lignes plus tard...
};
```

Divisez en singletons ciblés : `LootManager`, `VehicleManager`, `WeatherManager`, `BanManager`. Chacun est petit, testable et a un domaine clair.

### 4. Accéder aux singletons dans les constructeurs d'autres singletons

Cela crée des dépendances d'ordre d'initialisation cachées :

```c
// MAUVAIS : Le constructeur dépend d'un autre singleton
class ModuleA
{
    void ModuleA()
    {
        // Et si ModuleB n'a pas encore été créé ?
        ModuleB.GetInstance().Register(this);
    }
};
```

Reportez l'enregistrement inter-singletons à `OnInit()` ou `OnMissionStart()`, où l'ordre d'initialisation est contrôlé.

---

## Alternative : classes entièrement statiques

Certains "singletons" n'ont pas besoin d'instance du tout. Si la classe ne contient aucun état d'instance et n'a que des méthodes et champs statiques, évitez la cérémonie du `GetInstance()` :

```c
// Pas besoin d'instance — tout est statique
class MyLog
{
    private static FileHandle s_LogFile;
    private static int s_LogLevel;

    static void Info(string tag, string msg)
    {
        WriteLog("INFO", tag, msg);
    }

    static void Error(string tag, string msg)
    {
        WriteLog("ERROR", tag, msg);
    }

    static void Cleanup()
    {
        if (s_LogFile) CloseFile(s_LogFile);
        s_LogFile = null;
    }

    private static void WriteLog(string level, string tag, string msg)
    {
        // ...
    }
};
```

C'est l'approche utilisée par `MyLog`, `MyRPC`, `MyEventBus` et `MyModuleManager` dans un mod de framework. C'est plus simple, évite le surcoût de la vérification de null de `GetInstance()`, et rend l'intention claire : il n'y a pas d'instance, seulement un état partagé.

**Utilisez une classe entièrement statique quand :**
- Toutes les méthodes sont sans état ou opèrent sur des champs statiques
- Il n'y a pas de logique significative de constructeur/destructeur
- Vous n'avez jamais besoin de passer l'"instance" en paramètre

**Utilisez un vrai singleton quand :**
- La classe a un état d'instance qui bénéficie de l'encapsulation (champs `protected`)
- Vous avez besoin de polymorphisme (une classe de base avec des méthodes surchargées)
- L'objet doit être passé à d'autres systèmes par référence

---

## Liste de vérification

Avant de publier un singleton, vérifiez :

- [ ] `s_Instance` est déclaré `private static ref`
- [ ] `GetInstance()` gère le cas null (init paresseuse) ou vous avez un appel explicite `Create()`
- [ ] `DestroyInstance()` existe et met `s_Instance = null`
- [ ] `DestroyInstance()` est appelé depuis `OnMissionFinish()` ou une méthode d'arrêt centralisée
- [ ] Le destructeur nettoie les collections possédées (`.Clear()`, mise à `null`)
- [ ] Pas de champs publics --- toute mutation passe par des méthodes
- [ ] Le constructeur n'appelle pas `GetInstance()` sur d'autres singletons (reporter à `OnInit()`)

---

## Compatibilité et impact

- **Multi-Mod :** Plusieurs mods définissant chacun leurs propres singletons coexistent en sécurité --- chacun a son propre `s_Instance`. Les conflits ne surviennent que si deux mods définissent le même nom de classe, ce que Enforce Script signalera comme une erreur de redéfinition au chargement.
- **Ordre de chargement :** Les singletons paresseux ne sont pas affectés par l'ordre de chargement des mods. Les singletons hâtifs créés dans `OnInit()` dépendent de l'ordre de la chaîne `modded class`, qui suit les `requiredAddons` de `config.cpp`.
- **Listen Server :** Les champs statiques sont partagés entre les contextes client et serveur dans le même processus. Un singleton qui ne devrait exister que côté serveur doit protéger sa construction avec `GetGame().IsServer()`, sinon il sera accessible (et potentiellement initialisé) depuis le code client également.
- **Performance :** L'accès au singleton est une vérification statique de null + un appel de méthode --- surcoût négligeable. Le coût réside dans ce que le singleton *fait*, pas dans l'accès à celui-ci.
- **Migration :** Les singletons survivent aux mises à jour de version de DayZ tant que les API qu'ils appellent (ex. `GetGame()`, `JsonFileLoader`) restent stables. Aucune migration spéciale n'est nécessaire pour le patron lui-même.

---

## Erreurs courantes

| Erreur | Impact | Correction |
|--------|--------|------------|
| Appel `DestroyInstance()` manquant dans `OnMissionFinish` | Données périmées et références d'entités mortes persistent entre les redémarrages de mission, causant des crashs ou un état fantôme | Toujours appeler `DestroyInstance()` depuis `OnMissionFinish` ou un `ShutdownAll()` centralisé |
| Appeler `GetInstance()` dans le constructeur d'un autre singleton | Déclenche une construction réentrante ; `s_Instance` est encore null, donc une seconde instance est créée | Reporter l'accès inter-singleton à une méthode `Initialize()` appelée après la construction |
| Utiliser `public static ref` au lieu de `private static ref` | N'importe quel code peut mettre `s_Instance = null` ou le remplacer, brisant la garantie d'instance unique | Toujours déclarer `s_Instance` comme `private static ref` |
| Ne pas protéger l'init hâtive sur les listen servers | Le singleton est construit deux fois (une fois depuis le chemin serveur, une fois depuis le chemin client) si `Create()` manque une vérification null | Toujours vérifier `if (!s_Instance)` dans `Create()` |
| Accumuler l'état sans limites (caches illimités) | La mémoire croît indéfiniment sur les serveurs longue durée ; OOM ou lag sévère à terme | Limiter les collections avec une taille maximale ou une éviction périodique dans `OnUpdate` |

---

## Théorie vs pratique

| Ce que dit la théorie | La réalité DayZ |
|----------------------|-----------------|
| Les singletons sont un anti-patron ; utilisez l'injection de dépendances | Enforce Script n'a pas de conteneur DI. Les singletons sont l'approche standard pour les gestionnaires globaux à travers tous les mods majeurs. |
| L'initialisation paresseuse est toujours suffisante | Les gestionnaires RPC doivent être enregistrés avant que tout client ne se connecte, donc l'init hâtive dans `OnInit()` est souvent nécessaire. |
| Les singletons ne devraient jamais être détruits | Les missions DayZ redémarrent sans redémarrer le processus serveur ; les singletons *doivent* être détruits et recréés à chaque cycle de mission. |

---

[Accueil](../README.md) | **Patron Singleton** | [Suivant : Systèmes de modules >>](02-module-systems.md)
