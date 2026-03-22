# Chapitre 7.2 : Systèmes de modules / plugins

[Accueil](../README.md) | [<< Précédent : Patron Singleton](01-singletons.md) | **Systèmes de modules / plugins** | [Suivant : Patrons RPC >>](03-rpc-patterns.md)

---

## Introduction

Chaque framework de mod DayZ sérieux utilise un système de modules ou de plugins pour organiser le code en unités autonomes avec des hooks de cycle de vie définis. Plutôt que de disperser la logique d'initialisation à travers des classes de mission moddées, les modules s'enregistrent auprès d'un gestionnaire central qui répartit les événements de cycle de vie --- `OnInit`, `OnMissionStart`, `OnUpdate`, `OnMissionFinish` --- vers chaque module dans un ordre prévisible.

Ce chapitre examine quatre approches réelles : `CF_ModuleCore` de Community Framework, `PluginBase` / `ConfigurablePlugin` de VPP, l'enregistrement basé sur les attributs de Dabs Framework, et un gestionnaire de modules statique personnalisé. Chacun résout le même problème différemment ; comprendre les quatre vous aidera à choisir le bon patron pour votre propre mod ou à vous intégrer proprement avec un framework existant.

---

## Table des matières

- [Pourquoi des modules ?](#pourquoi-des-modules-)
- [CF_ModuleCore (COT / Expansion)](#cf_modulecore-cot--expansion)
- [VPP PluginBase / ConfigurablePlugin](#vpp-pluginbase--configurableplugin)
- [Enregistrement basé sur les attributs de Dabs](#enregistrement-basé-sur-les-attributs-de-dabs)
- [Gestionnaire de modules statique personnalisé](#gestionnaire-de-modules-statique-personnalisé)
- [Cycle de vie des modules : le contrat universel](#cycle-de-vie-des-modules--le-contrat-universel)
- [Bonnes pratiques de conception de modules](#bonnes-pratiques-de-conception-de-modules)
- [Tableau comparatif](#tableau-comparatif)

---

## Pourquoi des modules ?

Sans système de modules, un mod DayZ se retrouve typiquement avec une classe moddée monolithique `MissionServer` ou `MissionGameplay` qui grossit jusqu'à devenir ingérable :

```c
// MAUVAIS : Tout entassé dans une seule classe moddée
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        InitLootSystem();
        InitVehicleTracker();
        InitBanManager();
        InitWeatherController();
        InitAdminPanel();
        InitKillfeedHUD();
        // ... 20 systèmes de plus
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        TickLootSystem(timeslice);
        TickVehicleTracker(timeslice);
        TickWeatherController(timeslice);
        // ... 20 ticks de plus
    }
};
```

Un système de modules remplace cela par un seul point d'accroche stable :

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        MyModuleManager.Register(new LootModule());
        MyModuleManager.Register(new VehicleModule());
        MyModuleManager.Register(new WeatherModule());
    }

    override void OnMissionStart()
    {
        super.OnMissionStart();
        MyModuleManager.OnMissionStart();  // Répartit vers tous les modules
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        MyModuleManager.OnServerUpdate(timeslice);  // Répartit vers tous les modules
    }
};
```

Chaque module est une classe indépendante avec son propre fichier, son propre état et ses propres hooks de cycle de vie. Ajouter une nouvelle fonctionnalité signifie ajouter un nouveau module --- pas modifier une classe de mission de 3000 lignes.

---

## CF_ModuleCore (COT / Expansion)

Community Framework (CF) fournit le système de modules le plus largement utilisé dans l'écosystème de modding DayZ. COT et Expansion s'appuient tous deux dessus.

### Fonctionnement

1. Vous déclarez une classe de module qui étend l'une des classes de base de CF
2. Vous l'enregistrez dans `config.cpp` sous `CfgPatches` / `CfgMods`
3. Le `CF_ModuleCoreManager` de CF découvre et instancie automatiquement toutes les classes de modules enregistrées au démarrage
4. Les événements de cycle de vie sont répartis automatiquement

### Classes de base des modules

CF fournit trois classes de base correspondant aux couches de script de DayZ :

| Classe de base | Couche | Utilisation typique |
|---------------|--------|---------------------|
| `CF_ModuleGame` | 3_Game | Init précoce, enregistrement RPC, classes de données |
| `CF_ModuleWorld` | 4_World | Interaction avec les entités, systèmes de gameplay |
| `CF_ModuleMission` | 5_Mission | Hooks de mission, panneaux d'interface |

### Exemple : un module CF

```c
class MyLootModule : CF_ModuleWorld
{
    // CF appelle ceci une fois pendant l'initialisation du module
    override void OnInit()
    {
        super.OnInit();
        // Enregistrer les gestionnaires RPC, allouer les structures de données
    }

    // CF appelle ceci quand la mission démarre
    override void OnMissionStart(Class sender, CF_EventArgs args)
    {
        super.OnMissionStart(sender, args);
        // Charger les configs, faire apparaître le loot initial
    }

    // CF appelle ceci à chaque frame sur le serveur
    override void OnUpdate(Class sender, CF_EventArgs args)
    {
        super.OnUpdate(sender, args);
        // Faire avancer les minuteries de réapparition du loot
    }

    // CF appelle ceci quand la mission se termine
    override void OnMissionFinish(Class sender, CF_EventArgs args)
    {
        super.OnMissionFinish(sender, args);
        // Sauvegarder l'état, libérer les ressources
    }
};
```

### Accéder à un module CF

```c
// Obtenir une référence à un module en cours d'exécution par type
MyLootModule lootMod;
CF_Modules<MyLootModule>.Get(lootMod);
if (lootMod)
{
    lootMod.ForceRespawn();
}
```

### Caractéristiques clés

- **Découverte automatique** : les modules sont instanciés par CF en fonction des déclarations `config.cpp` --- pas d'appels manuels `new`
- **Arguments d'événements** : les hooks de cycle de vie reçoivent des `CF_EventArgs` avec des données de contexte
- **Dépendance à CF** : votre mod nécessite Community Framework comme dépendance
- **Largement supporté** : si votre mod cible des serveurs qui exécutent déjà COT ou Expansion, CF est déjà présent

---

## VPP PluginBase / ConfigurablePlugin

VPP Admin Tools utilise une architecture de plugins où chaque outil d'administration est une classe plugin enregistrée auprès d'un gestionnaire central.

### Plugin de base

```c
// Patron VPP (simplifié)
class PluginBase : Managed
{
    void OnInit();
    void OnUpdate(float dt);
    void OnDestroy();

    // Identité du plugin
    string GetPluginName();
    bool IsServerOnly();
};
```

### ConfigurablePlugin

VPP étend la base avec une variante intégrant la configuration qui charge/sauvegarde automatiquement les paramètres :

```c
class ConfigurablePlugin : PluginBase
{
    // VPP charge automatiquement ceci depuis le JSON à l'init
    ref PluginConfigBase m_Config;

    override void OnInit()
    {
        super.OnInit();
        LoadConfig();
    }

    void LoadConfig()
    {
        string path = "$profile:VPPAdminTools/" + GetPluginName() + ".json";
        if (FileExist(path))
        {
            JsonFileLoader<PluginConfigBase>.JsonLoadFile(path, m_Config);
        }
    }

    void SaveConfig()
    {
        string path = "$profile:VPPAdminTools/" + GetPluginName() + ".json";
        JsonFileLoader<PluginConfigBase>.JsonSaveFile(path, m_Config);
    }
};
```

### Enregistrement

VPP enregistre les plugins dans le `MissionServer.OnInit()` moddé :

```c
// Patron VPP
GetPluginManager().RegisterPlugin(new VPPESPPlugin());
GetPluginManager().RegisterPlugin(new VPPTeleportPlugin());
GetPluginManager().RegisterPlugin(new VPPWeatherPlugin());
```

### Caractéristiques clés

- **Enregistrement manuel** : chaque plugin est explicitement `new`-é et enregistré
- **Intégration de la configuration** : `ConfigurablePlugin` fusionne la gestion de configuration avec le cycle de vie du module
- **Autonome** : pas de dépendance à CF ; le gestionnaire de plugins de VPP est son propre système
- **Propriété claire** : le gestionnaire de plugins détient une `ref` vers tous les plugins, contrôlant leur durée de vie

---

## Enregistrement basé sur les attributs de Dabs

Le Dabs Framework (utilisé dans Dabs Framework Admin Tools) utilise une approche plus moderne : des attributs de style C# pour l'auto-enregistrement.

### Le concept

Au lieu d'enregistrer manuellement les modules, vous annotez une classe avec un attribut, et le framework la découvre au démarrage par réflexion :

```c
// Patron Dabs (conceptuel)
[CF_RegisterModule(DabsAdminESP)]
class DabsAdminESP : CF_ModuleWorld
{
    override void OnInit()
    {
        super.OnInit();
        // ...
    }
};
```

L'attribut `CF_RegisterModule` indique au gestionnaire de modules de CF d'instancier cette classe automatiquement. Pas besoin d'appel `Register()` manuel.

### Fonctionnement de la découverte

Au démarrage, CF scanne toutes les classes de scripts chargées à la recherche de l'attribut d'enregistrement. Pour chaque correspondance, il crée une instance et l'ajoute au gestionnaire de modules. Cela se produit avant que `OnInit()` ne soit appelé sur aucun module.

### Caractéristiques clés

- **Zéro boilerplate** : pas de code d'enregistrement dans les classes de mission
- **Déclaratif** : la classe elle-même déclare qu'elle est un module
- **Repose sur CF** : ne fonctionne qu'avec le traitement des attributs de Community Framework
- **Découvrabilité** : vous pouvez trouver tous les modules en cherchant l'attribut dans la base de code

---

## Gestionnaire de modules statique personnalisé

Cette approche utilise un patron d'enregistrement explicite avec une classe gestionnaire statique. Il n'y a pas d'instance du gestionnaire --- ce sont entièrement des méthodes statiques et un stockage statique. C'est utile quand vous voulez zéro dépendance aux frameworks externes.

### Classes de base des modules

```c
// Base : hooks de cycle de vie
class MyModuleBase : Managed
{
    bool IsServer();       // Surcharger dans la sous-classe
    bool IsClient();       // Surcharger dans la sous-classe
    string GetModuleName();
    void OnInit();
    void OnMissionStart();
    void OnMissionFinish();
};

// Module côté serveur : ajoute OnUpdate + événements joueur
class MyServerModule : MyModuleBase
{
    void OnUpdate(float dt);
    void OnPlayerConnect(PlayerIdentity identity);
    void OnPlayerDisconnect(PlayerIdentity identity, string uid);
};

// Module côté client : ajoute OnUpdate
class MyClientModule : MyModuleBase
{
    void OnUpdate(float dt);
};
```

### Enregistrement

Les modules s'enregistrent explicitement, typiquement depuis les classes de mission moddées :

```c
// Dans MissionServer.OnInit() moddé :
MyModuleManager.Register(new MyMissionServerModule());
MyModuleManager.Register(new MyAIServerModule());
```

### Répartition du cycle de vie

Les classes de mission moddées appellent `MyModuleManager` à chaque point du cycle de vie :

```c
modded class MissionServer
{
    override void OnMissionStart()
    {
        super.OnMissionStart();
        MyModuleManager.OnMissionStart();
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        MyModuleManager.OnServerUpdate(timeslice);
    }

    override void OnMissionFinish()
    {
        MyModuleManager.OnMissionFinish();
        MyModuleManager.Cleanup();
        super.OnMissionFinish();
    }
};
```

### Sécurité listen server

Les classes de base des modules du système personnalisé imposent un invariant critique : `MyServerModule` retourne `true` depuis `IsServer()` et `false` depuis `IsClient()`, tandis que `MyClientModule` fait l'inverse. Le gestionnaire utilise ces drapeaux pour éviter de répartir les événements de cycle de vie deux fois sur les listen servers (où `MissionServer` et `MissionGameplay` s'exécutent dans le même processus).

La base `MyModuleBase` retourne `true` depuis les deux --- c'est pourquoi la base de code met en garde contre le sous-classement direct.

### Caractéristiques clés

- **Zéro dépendance** : pas de CF, pas de frameworks externes
- **Gestionnaire statique** : pas de `GetInstance()` nécessaire ; API purement statique
- **Enregistrement explicite** : contrôle total sur ce qui est enregistré et quand
- **Sûr pour listen server** : les sous-classes typées empêchent la double répartition
- **Nettoyage centralisé** : `MyModuleManager.Cleanup()` démonte tous les modules et les minuteries du cœur

---

## Cycle de vie des modules : le contrat universel

Malgré les différences d'implémentation, les quatre frameworks suivent le même contrat de cycle de vie :

```
┌─────────────────────────────────────────────────────┐
│  Enregistrement / Découverte                         │
│  L'instance du module est créée et enregistrée       │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnInit()                                            │
│  Configuration unique : allouer les collections,     │
│  enregistrer les RPC                                 │
│  Appelé une fois par module après l'enregistrement   │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnMissionStart()                                    │
│  La mission est active : charger les configs,        │
│  démarrer les minuteries, s'abonner aux événements,  │
│  faire apparaître les entités initiales              │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnUpdate(float dt)         [répété chaque frame]    │
│  Tick par frame : traiter les files, mettre à jour   │
│  les minuteries, vérifier les conditions, avancer    │
│  les machines à états                                │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnMissionFinish()                                   │
│  Démontage : sauvegarder l'état, se désabonner       │
│  des événements, vider les collections, mettre       │
│  les références à null                               │
└─────────────────────────────────────────────────────┘
```

### Règles

1. **OnInit précède OnMissionStart.** Ne chargez jamais les configs et ne faites pas apparaître les entités dans `OnInit()` --- le monde pourrait ne pas être prêt.
2. **OnUpdate reçoit le delta time.** Utilisez toujours `dt` pour la logique basée sur le temps, ne supposez jamais un taux de frames fixe.
3. **OnMissionFinish doit tout nettoyer.** Chaque collection `ref` doit être vidée. Chaque abonnement aux événements doit être supprimé. Chaque singleton doit être détruit. C'est le seul point de démontage fiable.
4. **Les modules ne devraient pas dépendre de l'ordre d'initialisation des uns des autres.** Si le Module A a besoin du Module B, utilisez un accès paresseux (`GetModule()`) plutôt que de supposer que B a été enregistré en premier.

---

## Bonnes pratiques de conception de modules

### 1. Un module, une responsabilité

Un module devrait posséder exactement un domaine. Si vous vous retrouvez à écrire `VehicleAndWeatherAndLootModule`, divisez-le.

```c
// BON : Modules ciblés
class MyLootModule : MyServerModule { ... }
class MyVehicleModule : MyServerModule { ... }
class MyWeatherModule : MyServerModule { ... }

// MAUVAIS : Module dieu
class MyEverythingModule : MyServerModule { ... }
```

### 2. Gardez OnUpdate peu coûteux

`OnUpdate` s'exécute à chaque frame. Si votre module fait un travail coûteux (E/S fichier, scans du monde, pathfinding), faites-le sur une minuterie ou répartissez-le sur plusieurs frames :

```c
class MyCleanupModule : MyServerModule
{
    protected float m_CleanupTimer;
    protected const float CLEANUP_INTERVAL = 300.0;  // Toutes les 5 minutes

    override void OnUpdate(float dt)
    {
        m_CleanupTimer += dt;
        if (m_CleanupTimer >= CLEANUP_INTERVAL)
        {
            m_CleanupTimer = 0;
            RunCleanup();
        }
    }
};
```

### 3. Enregistrez les RPC dans OnInit, pas OnMissionStart

Les gestionnaires RPC doivent être en place avant que tout client ne puisse envoyer un message. `OnInit()` s'exécute pendant l'enregistrement des modules, ce qui se produit tôt dans la configuration de la mission. `OnMissionStart()` peut être trop tard si les clients se connectent rapidement.

```c
class MyModule : MyServerModule
{
    override void OnInit()
    {
        super.OnInit();
        MyRPC.Register("MyMod", "RPC_DoThing", this, MyRPCSide.SERVER);
    }

    void RPC_DoThing(PlayerIdentity sender, Object target, ParamsReadContext ctx)
    {
        // Gérer le RPC
    }
};
```

### 4. Utilisez le gestionnaire de modules pour l'accès inter-modules

Ne gardez pas de références directes vers d'autres modules. Utilisez la recherche du gestionnaire :

```c
// BON : Couplage lâche via le gestionnaire
MyModuleBase mod = MyModuleManager.GetModule("MyAIServerModule");
MyAIServerModule aiMod;
if (Class.CastTo(aiMod, mod))
{
    aiMod.PauseSpawning();
}

// MAUVAIS : Référence statique directe créant un couplage fort
MyAIServerModule.s_Instance.PauseSpawning();
```

### 5. Protégez-vous contre les dépendances manquantes

Tous les serveurs n'exécutent pas tous les mods. Si votre module s'intègre optionnellement avec un autre mod, utilisez des vérifications préprocesseur :

```c
override void OnMissionStart()
{
    super.OnMissionStart();

    #ifdef MYMOD_AI
    MyEventBus.OnMissionStarted.Insert(OnAIMissionStarted);
    #endif
}
```

### 6. Loggez les événements de cycle de vie des modules

La journalisation rend le débogage simple. Chaque module devrait logger quand il s'initialise et s'arrête :

```c
override void OnInit()
{
    super.OnInit();
    MyLog.Info("MyModule", "Initialisé");
}

override void OnMissionFinish()
{
    MyLog.Info("MyModule", "Arrêt en cours");
    // Nettoyage...
}
```

---

## Tableau comparatif

| Fonctionnalité | CF_ModuleCore | VPP Plugin | Attribut Dabs | Module personnalisé |
|----------------|--------------|------------|----------------|---------------------|
| **Découverte** | config.cpp + auto | `Register()` manuel | Scan d'attributs | `Register()` manuel |
| **Classes de base** | Game / World / Mission | PluginBase / ConfigurablePlugin | CF_ModuleWorld + attribut | ServerModule / ClientModule |
| **Dépendances** | Nécessite CF | Autonome | Nécessite CF | Autonome |
| **Sûr listen server** | CF le gère | Vérification manuelle | CF le gère | Sous-classes typées |
| **Intégration config** | Séparée | Intégrée dans ConfigurablePlugin | Séparée | Via MyConfigManager |
| **Répartition update** | Automatique | Le gestionnaire appelle `OnUpdate` | Automatique | Le gestionnaire appelle `OnUpdate` |
| **Nettoyage** | CF le gère | `OnDestroy` manuel | CF le gère | `MyModuleManager.Cleanup()` |
| **Accès inter-mods** | `CF_Modules<T>.Get()` | `GetPluginManager().Get()` | `CF_Modules<T>.Get()` | `MyModuleManager.GetModule()` |

Choisissez l'approche qui correspond au profil de dépendances de votre mod. Si vous dépendez déjà de CF, utilisez `CF_ModuleCore`. Si vous voulez zéro dépendance externe, construisez votre propre système en suivant le patron du gestionnaire personnalisé ou de VPP.

---

## Compatibilité et impact

- **Multi-Mod :** Plusieurs mods peuvent chacun enregistrer leurs propres modules auprès du même gestionnaire (CF, VPP ou personnalisé). Les collisions de noms ne surviennent que si deux mods enregistrent le même type de classe --- utilisez des noms de classes uniques préfixés avec l'identifiant de votre mod.
- **Ordre de chargement :** CF découvre automatiquement les modules depuis `config.cpp`, donc l'ordre de chargement suit les `requiredAddons`. Les gestionnaires personnalisés enregistrent les modules dans `OnInit()`, où la chaîne `modded class` détermine l'ordre. Les modules ne devraient pas dépendre de l'ordre d'enregistrement --- utilisez des patrons d'accès paresseux.
- **Listen Server :** Sur les listen servers, `MissionServer` et `MissionGameplay` s'exécutent dans le même processus. Si votre gestionnaire de modules répartit `OnUpdate` depuis les deux, les modules reçoivent des ticks doubles. Utilisez des sous-classes typées (`ServerModule` / `ClientModule`) qui retournent `IsServer()` ou `IsClient()` pour empêcher cela.
- **Performance :** La répartition des modules ajoute une itération de boucle par module enregistré par appel de cycle de vie. Avec 10--20 modules, c'est négligeable. Assurez-vous que les méthodes `OnUpdate` individuelles des modules sont peu coûteuses (voir chapitre 7.7).
- **Migration :** Lors de la mise à niveau des versions de DayZ, les systèmes de modules sont stables tant que l'API de la classe de base (`CF_ModuleWorld`, `PluginBase`, etc.) ne change pas. Fixez la version de votre dépendance CF pour éviter les ruptures.

---

## Erreurs courantes

| Erreur | Impact | Correction |
|--------|--------|------------|
| Nettoyage `OnMissionFinish` manquant dans un module | Les collections, minuteries et abonnements aux événements survivent entre les redémarrages de mission, causant des données périmées ou des crashs | Surchargez `OnMissionFinish`, videz toutes les collections `ref`, désabonnez-vous de tous les événements |
| Répartition des événements de cycle de vie deux fois sur les listen servers | Les modules serveur exécutent la logique client et vice versa ; apparitions en double, envois RPC doubles | Utilisez des gardes `IsServer()` / `IsClient()` ou des sous-classes de modules typées qui imposent la séparation |
| Enregistrement des RPC dans `OnMissionStart` au lieu de `OnInit` | Les clients qui se connectent pendant la configuration de la mission peuvent envoyer des RPC avant que les gestionnaires ne soient prêts --- les messages sont silencieusement perdus | Enregistrez toujours les gestionnaires RPC dans `OnInit()`, qui s'exécute pendant l'enregistrement des modules avant que tout client ne se connecte |
| Un « module Dieu » qui gère tout | Impossible à déboguer, tester ou étendre ; conflits de fusion quand plusieurs développeurs travaillent dessus | Divisez en modules ciblés avec une seule responsabilité chacun |
| Garder une `ref` directe vers une autre instance de module | Crée un couplage fort et de potentielles fuites mémoire par cycle de références | Utilisez la recherche du gestionnaire de modules (`GetModule()`, `CF_Modules<T>.Get()`) pour l'accès inter-modules |

---

## Théorie vs pratique

| Ce que dit la théorie | La réalité DayZ |
|----------------------|-----------------|
| La découverte de modules devrait être automatique via la réflexion | La réflexion d'Enforce Script est limitée ; la découverte basée sur `config.cpp` (CF) ou les appels explicites `Register()` sont les seules approches fiables |
| Les modules devraient être échangeables à chaud à l'exécution | DayZ ne supporte pas le rechargement à chaud des scripts ; les modules vivent pendant tout le cycle de vie de la mission |
| Utilisez des interfaces pour les contrats de modules | Enforce Script n'a pas de mot-clé `interface` ; utilisez les méthodes virtuelles de classes de base (`override`) à la place |
| L'injection de dépendances découple les modules | Aucun framework DI n'existe ; utilisez les recherches du gestionnaire et les gardes `#ifdef` pour les dépendances inter-mods optionnelles |

---

[Accueil](../README.md) | [<< Précédent : Patron Singleton](01-singletons.md) | **Systèmes de modules / plugins** | [Suivant : Patrons RPC >>](03-rpc-patterns.md)
