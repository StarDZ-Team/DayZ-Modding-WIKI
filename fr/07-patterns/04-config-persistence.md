# Chapitre 7.4 : Persistance de la configuration

[Accueil](../README.md) | [<< Précédent : Patrons RPC](03-rpc-patterns.md) | **Persistance de la configuration** | [Suivant : Systèmes de permissions >>](05-permissions.md)

---

## Introduction

Presque chaque mod DayZ a besoin de sauvegarder et charger des données de configuration : paramètres serveur, tables d'apparition, listes de bannissement, données joueur, emplacements de téléportation. Le moteur fournit `JsonFileLoader` pour la sérialisation JSON simple et des E/S fichier brutes (`FileHandle`, `FPrintln`) pour tout le reste. Les mods professionnels ajoutent par-dessus un versionnage de configuration et une migration automatique.

Ce chapitre couvre les patrons standards de persistance de configuration, du chargement/sauvegarde JSON basique aux systèmes de migration versionnée, en passant par la gestion des répertoires et les minuteries de sauvegarde automatique.

---

## Table des matières

- [Patron JsonFileLoader](#patron-jsonfileloader)
- [Écriture JSON manuelle (FPrintln)](#écriture-json-manuelle-fprintln)
- [Le chemin $profile](#le-chemin-profile)
- [Création de répertoires](#création-de-répertoires)
- [Classes de données de configuration](#classes-de-données-de-configuration)
- [Versionnage et migration de configuration](#versionnage-et-migration-de-configuration)
- [Minuteries de sauvegarde automatique](#minuteries-de-sauvegarde-automatique)
- [Erreurs courantes](#erreurs-courantes)
- [Bonnes pratiques](#bonnes-pratiques)

---

## Patron JsonFileLoader

`JsonFileLoader` est le sérialiseur intégré au moteur. Il convertit entre les objets Enforce Script et les fichiers JSON en utilisant la réflexion --- il lit les champs publics de votre classe et les fait correspondre aux clés JSON automatiquement.

### Piège critique

**`JsonFileLoader<T>.JsonLoadFile()` et `JsonFileLoader<T>.JsonSaveFile()` retournent `void`.** Vous ne pouvez pas vérifier leur valeur de retour. Vous ne pouvez pas les assigner à un `bool`. Vous ne pouvez pas les utiliser dans une condition `if`. C'est l'une des erreurs les plus courantes dans le modding DayZ.

```c
// FAUX — ne compilera pas
bool success = JsonFileLoader<MyConfig>.JsonLoadFile(path, config);

// FAUX — ne compilera pas
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, config))
{
    // ...
}

// CORRECT — appeler puis vérifier l'état de l'objet
JsonFileLoader<MyConfig>.JsonLoadFile(path, config);
// Vérifier si les données ont été effectivement peuplées
if (config.m_ServerName != "")
{
    // Données chargées avec succès
}
```

### Chargement/sauvegarde basique

```c
// Classe de données — les champs publics sont sérialisés vers/depuis JSON
class ServerSettings
{
    string ServerName = "My DayZ Server";
    int MaxPlayers = 60;
    float RestartInterval = 14400.0;
    bool PvPEnabled = true;
};

class SettingsManager
{
    private static const string SETTINGS_PATH = "$profile:MyMod/ServerSettings.json";
    protected ref ServerSettings m_Settings;

    void Load()
    {
        m_Settings = new ServerSettings();

        if (FileExist(SETTINGS_PATH))
        {
            JsonFileLoader<ServerSettings>.JsonLoadFile(SETTINGS_PATH, m_Settings);
        }
        else
        {
            // Premier lancement : sauvegarder les valeurs par défaut
            Save();
        }
    }

    void Save()
    {
        JsonFileLoader<ServerSettings>.JsonSaveFile(SETTINGS_PATH, m_Settings);
    }
};
```

### Ce qui est sérialisé

`JsonFileLoader` sérialise **tous les champs publics** de l'objet. Il ne sérialise pas :
- Les champs privés ou protégés
- Les méthodes
- Les champs statiques
- Les champs transitoires/d'exécution uniquement (il n'y a pas d'attribut `[NonSerialized]` --- utilisez les modificateurs d'accès)

Le JSON résultant ressemble à :

```json
{
    "ServerName": "My DayZ Server",
    "MaxPlayers": 60,
    "RestartInterval": 14400.0,
    "PvPEnabled": true
}
```

### Types de champs supportés

| Type | Représentation JSON |
|------|-------------------|
| `int` | Nombre |
| `float` | Nombre |
| `bool` | `true` / `false` |
| `string` | Chaîne |
| `vector` | Tableau de 3 nombres |
| `array<T>` | Tableau JSON |
| `map<string, T>` | Objet JSON (clés string uniquement) |
| Classe imbriquée | Objet JSON imbriqué |

### Objets imbriqués

```c
class SpawnPoint
{
    string Name;
    vector Position;
    float Radius;
};

class SpawnConfig
{
    ref array<ref SpawnPoint> SpawnPoints = new array<ref SpawnPoint>();
};
```

Produit :

```json
{
    "SpawnPoints": [
        {
            "Name": "Coast",
            "Position": [13000, 0, 3500],
            "Radius": 100.0
        },
        {
            "Name": "Airfield",
            "Position": [4500, 0, 9500],
            "Radius": 50.0
        }
    ]
}
```

---

## Écriture JSON manuelle (FPrintln)

Parfois `JsonFileLoader` n'est pas assez flexible : il ne peut pas gérer les tableaux de types mixtes, le formatage personnalisé ou les structures de données non-classe. Dans ces cas, utilisez les E/S fichier brutes.

### Patron basique

```c
void WriteCustomData(string path, array<string> lines)
{
    FileHandle file = OpenFile(path, FileMode.WRITE);
    if (!file) return;

    FPrintln(file, "{");
    FPrintln(file, "    \"entries\": [");

    for (int i = 0; i < lines.Count(); i++)
    {
        string comma = "";
        if (i < lines.Count() - 1) comma = ",";
        FPrintln(file, "        \"" + lines[i] + "\"" + comma);
    }

    FPrintln(file, "    ]");
    FPrintln(file, "}");

    CloseFile(file);
}
```

### Lecture de fichiers bruts

```c
void ReadCustomData(string path)
{
    FileHandle file = OpenFile(path, FileMode.READ);
    if (!file) return;

    string line;
    while (FGets(file, line) >= 0)
    {
        line = line.Trim();
        if (line == "") continue;
        // Traiter la ligne...
    }

    CloseFile(file);
}
```

### Quand utiliser les E/S manuelles

- Écriture de fichiers de log (mode ajout)
- Écriture d'exports CSV ou texte brut
- Formatage JSON personnalisé que `JsonFileLoader` ne peut pas produire
- Analyse de formats de fichiers non-JSON (ex. fichiers `.map` ou `.xml` de DayZ)

Pour les fichiers de configuration standard, préférez `JsonFileLoader`. C'est plus rapide à implémenter, moins sujet aux erreurs, et gère automatiquement les objets imbriqués.

---

## Le chemin $profile

DayZ fournit le préfixe de chemin `$profile:`, qui pointe vers le répertoire de profil du serveur (typiquement le dossier contenant `DayZServer_x64.exe`, ou le chemin de profil spécifié avec `-profiles=`).

```c
// Ceux-ci pointent vers le répertoire de profil :
"$profile:MyMod/config.json"       // → C:/DayZServer/MyMod/config.json
"$profile:MyMod/Players/data.json" // → C:/DayZServer/MyMod/Players/data.json
```

### Toujours utiliser $profile

N'utilisez jamais de chemins absolus. N'utilisez jamais de chemins relatifs. Utilisez toujours `$profile:` pour tout fichier que votre mod crée ou lit à l'exécution :

```c
// MAUVAIS : Chemin absolu — ne fonctionne sur aucune autre machine
const string CONFIG_PATH = "C:/DayZServer/MyMod/config.json";

// MAUVAIS : Chemin relatif — dépend du répertoire de travail, qui varie
const string CONFIG_PATH = "MyMod/config.json";

// BON : $profile se résout correctement partout
const string CONFIG_PATH = "$profile:MyMod/config.json";
```

### Structure conventionnelle des répertoires

La plupart des mods suivent cette convention :

```
$profile:
  └── YourModName/
      ├── Config.json          (configuration serveur principale)
      ├── Permissions.json     (permissions administrateur)
      ├── Logs/
      │   └── 2025-01-15.log   (fichiers de log quotidiens)
      └── Players/
          ├── 76561198xxxxx.json
          └── 76561198yyyyy.json
```

---

## Création de répertoires

Avant d'écrire un fichier, vous devez vous assurer que le répertoire parent existe. DayZ ne crée pas les répertoires automatiquement.

### MakeDirectory

```c
void EnsureDirectories()
{
    string baseDir = "$profile:MyMod";
    if (!FileExist(baseDir))
    {
        MakeDirectory(baseDir);
    }

    string playersDir = baseDir + "/Players";
    if (!FileExist(playersDir))
    {
        MakeDirectory(playersDir);
    }

    string logsDir = baseDir + "/Logs";
    if (!FileExist(logsDir))
    {
        MakeDirectory(logsDir);
    }
}
```

### Important : MakeDirectory n'est pas récursif

`MakeDirectory` ne crée que le dernier répertoire du chemin. Si le parent n'existe pas, il échoue silencieusement. Vous devez créer chaque niveau :

```c
// FAUX : Le parent "MyMod" n'existe pas encore
MakeDirectory("$profile:MyMod/Data/Players");  // Échoue silencieusement

// CORRECT : Créer chaque niveau
MakeDirectory("$profile:MyMod");
MakeDirectory("$profile:MyMod/Data");
MakeDirectory("$profile:MyMod/Data/Players");
```

### Patron de constantes pour les chemins

Un mod de framework définit tous les chemins comme constantes dans une classe dédiée :

```c
class MyModConst
{
    static const string PROFILE_DIR    = "$profile:MyMod";
    static const string CONFIG_DIR     = "$profile:MyMod/Configs";
    static const string LOG_DIR        = "$profile:MyMod/Logs";
    static const string PLAYERS_DIR    = "$profile:MyMod/Players";
    static const string PERMISSIONS_FILE = "$profile:MyMod/Permissions.json";
};
```

Cela évite la duplication de chaînes de chemin dans la base de code et facilite la recherche de chaque fichier que votre mod touche.

---

## Classes de données de configuration

Une classe de données de configuration bien conçue fournit des valeurs par défaut, un suivi de version et une documentation claire de chaque champ.

### Patron basique

```c
class MyModConfig
{
    // Suivi de version pour les migrations
    int ConfigVersion = 3;

    // Paramètres de gameplay avec des valeurs par défaut raisonnables
    bool EnableFeatureX = true;
    int MaxEntities = 50;
    float SpawnRadius = 500.0;
    string WelcomeMessage = "Welcome to the server!";

    // Paramètres complexes
    ref array<string> AllowedWeapons = new array<string>();
    ref map<string, float> ZoneRadii = new map<string, float>();

    void MyModConfig()
    {
        // Initialiser les collections avec les valeurs par défaut
        AllowedWeapons.Insert("AK74");
        AllowedWeapons.Insert("M4A1");

        ZoneRadii.Set("safe_zone", 100.0);
        ZoneRadii.Set("pvp_zone", 500.0);
    }
};
```

### Patron ConfigBase réflectif

Ce patron utilise un système de configuration réflectif où chaque classe de configuration déclare ses champs comme des descripteurs. Cela permet au panneau d'administration de générer automatiquement l'interface pour n'importe quelle configuration sans noms de champs codés en dur :

```c
// Patron conceptuel (configuration réflective) :
class MyConfigBase
{
    // Chaque config déclare sa version
    int ConfigVersion;
    string ModId;

    // Les sous-classes surchargent pour déclarer leurs champs
    void Init(string modId)
    {
        ModId = modId;
    }

    // Réflexion : obtenir tous les champs configurables
    array<ref MyConfigField> GetFields();

    // Get/set dynamique par nom de champ (pour la synchronisation du panneau admin)
    string GetFieldValue(string fieldName);
    void SetFieldValue(string fieldName, string value);

    // Hooks pour la logique personnalisée au chargement/sauvegarde
    void OnAfterLoad() {}
    void OnBeforeSave() {}
};
```

### Patron VPP ConfigurablePlugin

VPP fusionne la gestion de configuration directement dans le cycle de vie du plugin :

```c
// Patron VPP (simplifié) :
class VPPESPConfig
{
    bool EnableESP = true;
    float MaxDistance = 1000.0;
    int RefreshRate = 5;
};

class VPPESPPlugin : ConfigurablePlugin
{
    ref VPPESPConfig m_ESPConfig;

    override void OnInit()
    {
        m_ESPConfig = new VPPESPConfig();
        // ConfigurablePlugin.LoadConfig() gère le chargement JSON
        super.OnInit();
    }
};
```

---

## Versionnage et migration de configuration

Au fur et à mesure que votre mod évolue, les structures de configuration changent. Vous ajoutez des champs, en supprimez, en renommez, changez les valeurs par défaut. Sans versionnage, les utilisateurs avec d'anciens fichiers de configuration obtiendront silencieusement des valeurs erronées ou des crashs.

### Le champ de version

Chaque classe de configuration devrait avoir un champ de version entier :

```c
class MyModConfig
{
    int ConfigVersion = 5;  // Incrémenter quand la structure change
    // ...
};
```

### Migration au chargement

Lors du chargement d'une configuration, comparez la version sur disque avec la version actuelle du code. Si elles diffèrent, exécutez les migrations :

```c
void LoadConfig()
{
    MyModConfig config = new MyModConfig();  // A les valeurs par défaut actuelles

    if (FileExist(CONFIG_PATH))
    {
        JsonFileLoader<MyModConfig>.JsonLoadFile(CONFIG_PATH, config);

        if (config.ConfigVersion < CURRENT_VERSION)
        {
            MigrateConfig(config);
            config.ConfigVersion = CURRENT_VERSION;
            SaveConfig(config);  // Re-sauvegarder avec la version mise à jour
        }
    }
    else
    {
        SaveConfig(config);  // Premier lancement : écrire les valeurs par défaut
    }

    m_Config = config;
}
```

### Fonctions de migration

```c
static const int CURRENT_VERSION = 5;

void MigrateConfig(MyModConfig config)
{
    // Exécuter chaque étape de migration séquentiellement
    if (config.ConfigVersion < 2)
    {
        // v1 → v2 : "SpawnDelay" a été renommé en "RespawnInterval"
        // L'ancien champ est perdu au chargement ; définir la nouvelle valeur par défaut
        config.RespawnInterval = 300.0;
    }

    if (config.ConfigVersion < 3)
    {
        // v2 → v3 : Ajout du champ "EnableNotifications"
        config.EnableNotifications = true;
    }

    if (config.ConfigVersion < 4)
    {
        // v3 → v4 : La valeur par défaut de "MaxZombies" est passée de 100 à 200
        if (config.MaxZombies == 100)
        {
            config.MaxZombies = 200;  // Ne mettre à jour que si l'utilisateur ne l'avait pas changé
        }
    }

    if (config.ConfigVersion < 5)
    {
        // v4 → v5 : "DifficultyMode" est passé de int à string
        // config.DifficultyMode = "Normal"; // Définir la nouvelle valeur par défaut
    }

    MyLog.Info("Config", "Config migrée de v"
        + config.ConfigVersion.ToString() + " à v" + CURRENT_VERSION.ToString());
}
```

### Exemple de migration d'Expansion

Expansion est connu pour son évolution agressive des configurations. Certaines configs d'Expansion ont traversé plus de 17 versions. Leur patron :
1. Chaque incrémentation de version a une fonction de migration dédiée
2. Les migrations s'exécutent dans l'ordre (1 vers 2, puis 2 vers 3, puis 3 vers 4, etc.)
3. Chaque migration ne change que ce qui est nécessaire pour cette étape de version
4. Le numéro de version final est écrit sur le disque après que toutes les migrations sont terminées

C'est la référence en matière de versionnage de configuration dans les mods DayZ.

---

## Minuteries de sauvegarde automatique

Pour les configurations qui changent à l'exécution (modifications admin, accumulation de données joueur), implémentez une minuterie de sauvegarde automatique pour prévenir la perte de données en cas de crash.

### Sauvegarde automatique basée sur minuterie

```c
class MyDataManager
{
    protected const float AUTOSAVE_INTERVAL = 300.0;  // 5 minutes
    protected float m_AutosaveTimer;
    protected bool m_Dirty;  // Les données ont-elles changé depuis la dernière sauvegarde ?

    void MarkDirty()
    {
        m_Dirty = true;
    }

    void OnUpdate(float dt)
    {
        m_AutosaveTimer += dt;
        if (m_AutosaveTimer >= AUTOSAVE_INTERVAL)
        {
            m_AutosaveTimer = 0;

            if (m_Dirty)
            {
                Save();
                m_Dirty = false;
            }
        }
    }

    void OnMissionFinish()
    {
        // Toujours sauvegarder à l'arrêt, même si la minuterie n'a pas déclenché
        if (m_Dirty)
        {
            Save();
            m_Dirty = false;
        }
    }
};
```

### Optimisation par drapeau de modification

N'écrivez sur le disque que lorsque les données ont réellement changé. Les E/S fichier sont coûteuses. Si rien n'a changé, passez la sauvegarde :

```c
void UpdateSetting(string key, string value)
{
    if (m_Settings.Get(key) == value) return;  // Pas de changement, pas de sauvegarde

    m_Settings.Set(key, value);
    MarkDirty();
}
```

### Sauvegarde sur événements critiques

En plus des sauvegardes minutées, sauvegardez immédiatement après les opérations critiques :

```c
void BanPlayer(string uid, string reason)
{
    m_BanList.Insert(uid);
    Save();  // Sauvegarde immédiate — les bannissements doivent survivre aux crashs
}
```

---

## Erreurs courantes

### 1. Traiter JsonLoadFile comme s'il retournait une valeur

```c
// FAUX — ne compile pas
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, config)) { ... }
```

`JsonLoadFile` retourne `void`. Appelez-le, puis vérifiez l'état de l'objet.

### 2. Ne pas vérifier FileExist avant le chargement

```c
// FAUX — crash ou produit un objet vide sans diagnostic
JsonFileLoader<MyConfig>.JsonLoadFile("$profile:MyMod/Config.json", config);

// CORRECT — vérifier d'abord, créer les valeurs par défaut si absent
if (!FileExist("$profile:MyMod/Config.json"))
{
    SaveDefaults();
    return;
}
JsonFileLoader<MyConfig>.JsonLoadFile("$profile:MyMod/Config.json", config);
```

### 3. Oublier de créer les répertoires

`JsonSaveFile` échoue silencieusement si le répertoire n'existe pas. Assurez-vous toujours que les répertoires existent avant de sauvegarder.

### 4. Champs publics que vous n'aviez pas l'intention de sérialiser

Chaque champ `public` d'une classe de configuration se retrouve dans le JSON. Si vous avez des champs réservés à l'exécution, rendez-les `protected` ou `private` :

```c
class MyConfig
{
    // Ceux-ci vont dans le JSON :
    int MaxPlayers = 60;
    string ServerName = "My Server";

    // Celui-ci NE va PAS dans le JSON (protégé) :
    protected bool m_Loaded;
    protected float m_LastSaveTime;
};
```

### 5. Caractères backslash et guillemets dans les valeurs JSON

Le CParser d'Enforce Script a des problèmes avec `\\` et `\"` dans les littéraux de chaîne. Évitez de stocker des chemins de fichiers avec des backslashs dans les configs. Utilisez des slashs :

```c
// MAUVAIS — les backslashs peuvent casser l'analyse
string LogPath = "C:\\DayZ\\Logs\\server.log";

// BON — les slashs fonctionnent partout
string LogPath = "$profile:MyMod/Logs/server.log";
```

---

## Bonnes pratiques

1. **Utilisez `$profile:` pour tous les chemins de fichiers.** Ne codez jamais en dur des chemins absolus.

2. **Créez les répertoires avant d'écrire des fichiers.** Vérifiez avec `FileExist()`, créez avec `MakeDirectory()`, un niveau à la fois.

3. **Fournissez toujours des valeurs par défaut dans le constructeur ou les initialiseurs de champs de votre classe de configuration.** Cela garantit que les configs du premier lancement sont sensées.

4. **Versionnez vos configs dès le premier jour.** Ajouter un champ `ConfigVersion` ne coûte rien et économise des heures de débogage plus tard.

5. **Séparez les classes de données de configuration des classes gestionnaires.** La classe de données est un conteneur muet ; le gestionnaire gère la logique de chargement/sauvegarde/synchronisation.

6. **Utilisez la sauvegarde automatique avec un drapeau de modification.** N'écrivez pas sur le disque à chaque changement de valeur --- regroupez les écritures sur une minuterie.

7. **Sauvegardez en fin de mission.** La minuterie de sauvegarde automatique est un filet de sécurité, pas la sauvegarde principale. Sauvegardez toujours pendant `OnMissionFinish()`.

8. **Définissez les constantes de chemin en un seul endroit.** Une classe `MyModConst` avec tous les chemins évite la duplication de chaînes et rend les changements de chemin triviaux.

9. **Loggez les opérations de chargement/sauvegarde.** Lors du débogage de problèmes de configuration, une ligne de log disant « Config v3 chargée depuis $profile:MyMod/Config.json » est inestimable.

10. **Testez avec un fichier de configuration supprimé.** Votre mod devrait gérer le premier lancement gracieusement : créer les répertoires, écrire les valeurs par défaut, logger ce qui a été fait.

---

## Compatibilité et impact

- **Multi-Mod :** Chaque mod écrit dans son propre répertoire `$profile:NomDuMod/`. Les conflits ne surviennent que si deux mods utilisent le même nom de répertoire. Utilisez un préfixe unique et reconnaissable pour le dossier de votre mod.
- **Ordre de chargement :** Le chargement de configuration se fait dans `OnInit` ou `OnMissionStart`, tous deux contrôlés par le cycle de vie propre du mod. Pas de problème d'ordre de chargement inter-mods sauf si deux mods essaient de lire/écrire le même fichier (ce qu'ils ne devraient jamais faire).
- **Listen Server :** Les fichiers de configuration sont côté serveur uniquement (`$profile:` se résout sur le serveur). Sur les listen servers, le code côté client peut techniquement accéder à `$profile:`, mais les configs ne devraient être chargées que par les modules serveur pour éviter l'ambiguïté.
- **Performance :** `JsonFileLoader` est synchrone et bloque le thread principal. Pour les grosses configs (100+ Ko), chargez pendant `OnInit` (avant le début du gameplay). Les minuteries de sauvegarde automatique empêchent les écritures répétées ; le patron de drapeau de modification garantit que les E/S disque ne se produisent que lorsque les données ont réellement changé.
- **Migration :** Ajouter de nouveaux champs à une classe de configuration est sûr --- `JsonFileLoader` ignore les clés JSON manquantes et laisse la valeur par défaut de la classe. Supprimer ou renommer des champs nécessite une étape de migration versionnée pour éviter la perte silencieuse de données.

---

## Théorie vs pratique

| Ce que dit la théorie | La réalité DayZ |
|----------------------|-----------------|
| Utilisez des E/S fichier asynchrones pour éviter le blocage | Enforce Script n'a pas d'E/S fichier asynchrones ; toutes les lectures/écritures sont synchrones. Chargez au démarrage, sauvegardez sur des minuteries. |
| Validez le JSON avec un schéma | Il n'existe pas de validation de schéma JSON ; validez les champs dans `OnAfterLoad()` ou avec des clauses de garde après le chargement. |
| Utilisez une base de données pour les données structurées | Pas d'accès base de données depuis Enforce Script ; les fichiers JSON dans `$profile:` sont le seul mécanisme de persistance. |

---

[Accueil](../README.md) | [<< Précédent : Patrons RPC](03-rpc-patterns.md) | **Persistance de la configuration** | [Suivant : Systèmes de permissions >>](05-permissions.md)
