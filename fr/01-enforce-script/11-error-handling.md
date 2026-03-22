# Chapitre 1.11 : Gestion des erreurs

[Accueil](../README.md) | [<< Précédent : Enums & Préprocesseur](10-enums-preprocessor.md) | **Gestion des erreurs** | [Suivant : Pièges >>](12-gotchas.md)

---

> **Objectif :** Apprendre à gérer les erreurs dans un langage sans try/catch. Maîtriser les clauses de garde, la programmation défensive et les patterns de logging structuré qui gardent votre mod stable.

---

## Table des matières

- [La règle fondamentale : Pas de try/catch](#la-règle-fondamentale--pas-de-trycatch)
- [Pattern de clause de garde](#pattern-de-clause-de-garde)
  - [Garde simple](#garde-simple)
  - [Gardes multiples (empilées)](#gardes-multiples-empilées)
  - [Garde avec logging](#garde-avec-logging)
- [Vérification null](#vérification-null)
  - [Avant chaque opération](#avant-chaque-opération)
  - [Vérifications null enchaînées](#vérifications-null-enchaînées)
  - [Le mot-clé notnull](#le-mot-clé-notnull)
- [ErrorEx — Rapport d'erreur du moteur](#errorex--rapport-derreur-du-moteur)
  - [Niveaux de sévérité](#niveaux-de-sévérité)
  - [Quand utiliser chaque niveau](#quand-utiliser-chaque-niveau)
- [DumpStackString — Traces de pile](#dumpstackstring--traces-de-pile)
- [Impression de debug](#impression-de-debug)
  - [Print basique](#print-basique)
  - [Debug conditionnel avec #ifdef](#debug-conditionnel-avec-ifdef)
- [Patterns de logging structuré](#patterns-de-logging-structuré)
  - [Pattern de préfixe simple](#pattern-de-préfixe-simple)
  - [Classe de logger avec niveaux](#classe-de-logger-avec-niveaux)
  - [Style MyLog (Pattern de production)](#style-mylog-pattern-de-production)
- [Exemples du monde réel](#exemples-du-monde-réel)
  - [Fonction sûre avec gardes multiples](#fonction-sûre-avec-gardes-multiples)
  - [Chargement de config sûr](#chargement-de-config-sûr)
  - [Handler RPC sûr](#handler-rpc-sûr)
  - [Opération d'inventaire sûre](#opération-dinventaire-sûre)
- [Résumé des patterns défensifs](#résumé-des-patterns-défensifs)
- [Erreurs courantes](#erreurs-courantes)
- [Résumé](#résumé)
- [Navigation](#navigation)

---

## La règle fondamentale : Pas de try/catch

Enforce Script n'a **aucune gestion d'exceptions**. Il n'y a pas de `try`, pas de `catch`, pas de `throw`, pas de `finally`. Si quelque chose se passe mal à l'exécution (déréférencement null, cast invalide, index de tableau hors limites), le moteur :

1. **Crashe silencieusement** — la fonction arrête de s'exécuter, pas de message d'erreur
2. **Logge une erreur de script** — visible dans le fichier log `.RPT`
3. **Crashe le serveur/client** — dans les cas sévères

Cela signifie que **chaque point de défaillance potentiel doit être gardé manuellement**. La défense principale est le **pattern de clause de garde**.

---

## Pattern de clause de garde

Une clause de garde vérifie une précondition en haut d'une fonction et retourne tôt si elle échoue. Cela garde le « chemin heureux » non imbriqué et lisible.

### Garde simple

```c
void TeleportPlayer(PlayerBase player, vector destination)
{
    if (!player)
        return;

    player.SetPosition(destination);
}
```

### Gardes multiples (empilées)

Empilez les gardes en haut de la fonction — chacune vérifie une précondition :

```c
void GiveItemToPlayer(PlayerBase player, string className, int quantity)
{
    // Garde 1 : le joueur existe
    if (!player)
        return;

    // Garde 2 : le joueur est vivant
    if (!player.IsAlive())
        return;

    // Garde 3 : nom de classe valide
    if (className == "")
        return;

    // Garde 4 : quantité valide
    if (quantity <= 0)
        return;

    // Toutes les préconditions remplies — on peut procéder en toute sécurité
    for (int i = 0; i < quantity; i++)
    {
        player.GetInventory().CreateInInventory(className);
    }
}
```

### Garde avec logging

En code de production, loggez toujours pourquoi une garde s'est déclenchée — les échecs silencieux sont difficiles à déboguer :

```c
void StartMission(PlayerBase initiator, string missionId)
{
    if (!initiator)
    {
        Print("[Missions] ERROR: StartMission called with null initiator");
        return;
    }

    if (missionId == "")
    {
        Print("[Missions] ERROR: StartMission called with empty missionId");
        return;
    }

    if (!initiator.IsAlive())
    {
        Print("[Missions] WARN: Player " + initiator.GetIdentity().GetName() + " is dead, cannot start mission");
        return;
    }

    // Procéder au démarrage de la mission
    Print("[Missions] Starting mission " + missionId);
    // ...
}
```

---

## Vérification null

Les références null sont la source de crash la plus courante dans le modding DayZ. Chaque type référence peut être `null`.

### Avant chaque opération

```c
// FAUX — crashe si player, identity ou name est null à un moment quelconque
string name = player.GetIdentity().GetName();

// CORRECT — vérifier à chaque étape
if (!player)
    return;

PlayerIdentity identity = player.GetIdentity();
if (!identity)
    return;

string name = identity.GetName();
```

### Vérifications null enchaînées

Quand vous devez traverser une chaîne de références, vérifiez chaque maillon :

```c
void PrintHandItemName(PlayerBase player)
{
    if (!player)
        return;

    HumanInventory inv = player.GetHumanInventory();
    if (!inv)
        return;

    EntityAI handItem = inv.GetEntityInHands();
    if (!handItem)
        return;

    Print("Player is holding: " + handItem.GetType());
}
```

### Le mot-clé notnull

`notnull` est un modificateur de paramètre qui fait rejeter par le compilateur les arguments `null` au site d'appel :

```c
void ProcessItem(notnull EntityAI item)
{
    // Le compilateur garantit que item n'est pas null
    // Pas de vérification null nécessaire dans la fonction
    Print(item.GetType());
}

// Utilisation :
EntityAI item = GetSomeItem();
if (item)
{
    ProcessItem(item);  // OK — le compilateur sait que item n'est pas null ici
}
ProcessItem(null);      // Erreur de compilation !
```

> **Limitation :** `notnull` n'attrape que les `null` littéraux et les variables évidemment nulles au site d'appel. Il n'empêche pas qu'une variable qui était non-null au moment de la vérification devienne null suite à une suppression par le moteur.

---

## ErrorEx — Rapport d'erreur du moteur

`ErrorEx` écrit un message d'erreur dans le log de script (fichier `.RPT`). Il n'arrête **pas** l'exécution et ne lève pas d'exception.

```c
ErrorEx("Something went wrong");
```

### Niveaux de sévérité

`ErrorEx` accepte un second paramètre optionnel de type `ErrorExSeverity` :

```c
// INFO — informatif, pas une erreur
ErrorEx("Config loaded successfully", ErrorExSeverity.INFO);

// WARNING — problème potentiel, l'exécution continue
ErrorEx("Config file not found, using defaults", ErrorExSeverity.WARNING);

// ERROR — problème certain (sévérité par défaut si omise)
ErrorEx("Failed to create object: class not found");
ErrorEx("Critical failure in RPC handler", ErrorExSeverity.ERROR);
```

| Sévérité | Quand utiliser |
|----------|---------------|
| `ErrorExSeverity.INFO` | Messages informatifs que vous voulez dans le log d'erreur |
| `ErrorExSeverity.WARNING` | Problèmes récupérables (config manquante, fallback utilisé) |
| `ErrorExSeverity.ERROR` | Bugs certains ou états irrécupérables |

### Quand utiliser chaque niveau

```c
void LoadConfig(string path)
{
    if (!FileExist(path))
    {
        // WARNING — récupérable, nous utiliserons les valeurs par défaut
        ErrorEx("Config not found at " + path + ", using defaults", ErrorExSeverity.WARNING);
        UseDefaultConfig();
        return;
    }

    MyConfig cfg = new MyConfig();
    JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);

    if (cfg.Version < EXPECTED_VERSION)
    {
        // INFO — pas un problème, juste notable
        ErrorEx("Config version " + cfg.Version.ToString() + " is older than expected", ErrorExSeverity.INFO);
    }

    if (!cfg.Validate())
    {
        // ERROR — mauvaises données qui vont causer des problèmes
        ErrorEx("Config validation failed for " + path);
        UseDefaultConfig();
        return;
    }
}
```

---

## DumpStackString — Traces de pile

`DumpStackString` capture la pile d'appels courante sous forme de chaîne. C'est crucial pour diagnostiquer où un état inattendu s'est produit :

```c
void OnUnexpectedState(string context)
{
    string stack = DumpStackString();
    Print("[ERROR] Unexpected state in " + context);
    Print("[ERROR] Stack trace:");
    Print(stack);
}
```

Utilisez-le dans les clauses de garde pour tracer l'appelant :

```c
void CriticalFunction(PlayerBase player)
{
    if (!player)
    {
        string stack = DumpStackString();
        ErrorEx("CriticalFunction called with null player! Stack: " + stack);
        return;
    }

    // ...
}
```

---

## Impression de debug

### Print basique

`Print()` écrit dans le fichier log de script. Il accepte n'importe quel type :

```c
Print("Hello World");                    // string
Print(42);                               // int
Print(3.14);                             // float
Print(player.GetPosition());             // vector

// Print formaté
Print(string.Format("Player %1 at position %2 with %3 HP",
    player.GetIdentity().GetName(),
    player.GetPosition().ToString(),
    player.GetHealth("", "Health").ToString()
));
```

### Debug conditionnel avec #ifdef

Enveloppez les prints de debug dans des gardes de préprocesseur pour qu'ils ne soient pas compilés dans les builds de release :

```c
void ProcessAI(DayZInfected zombie)
{
    #ifdef DIAG_DEVELOPER
        Print(string.Format("[AI DEBUG] Processing %1 at %2",
            zombie.GetType(),
            zombie.GetPosition().ToString()
        ));
    #endif

    // Logique réelle...
}
```

Pour des drapeaux de debug spécifiques au mod, définissez votre propre symbole :

```c
// Dans votre config.cpp :
// defines[] = { "MYMOD_DEBUG" };

#ifdef MYMOD_DEBUG
    Print("[MyMod] Debug: item spawned at " + pos.ToString());
#endif
```

---

## Patterns de logging structuré

### Pattern de préfixe simple

L'approche la plus simple — ajouter un tag au début de chaque appel Print :

```c
class MissionManager
{
    static const string LOG_TAG = "[Missions] ";

    void Start()
    {
        Print(LOG_TAG + "Mission system starting");
    }

    void OnError(string msg)
    {
        Print(LOG_TAG + "ERROR: " + msg);
    }
}
```

### Classe de logger avec niveaux

Un logger réutilisable avec niveaux de sévérité :

```c
class ModLogger
{
    protected string m_Prefix;

    void ModLogger(string prefix)
    {
        m_Prefix = "[" + prefix + "] ";
    }

    void Info(string msg)
    {
        Print(m_Prefix + "INFO: " + msg);
    }

    void Warning(string msg)
    {
        Print(m_Prefix + "WARN: " + msg);
        ErrorEx(m_Prefix + msg, ErrorExSeverity.WARNING);
    }

    void Error(string msg)
    {
        Print(m_Prefix + "ERROR: " + msg);
        ErrorEx(m_Prefix + msg, ErrorExSeverity.ERROR);
    }

    void Debug(string msg)
    {
        #ifdef DIAG_DEVELOPER
            Print(m_Prefix + "DEBUG: " + msg);
        #endif
    }
}

// Utilisation :
ref ModLogger g_MissionLog = new ModLogger("Missions");
g_MissionLog.Info("System started");
g_MissionLog.Error("Failed to load mission data");
```

### Style MyLog (Pattern de production)

Pour les mods de production, une classe de logging statique avec sortie fichier, rotation quotidienne et cibles de sortie multiples :

```c
// Enum pour les niveaux de log
enum MyLogLevel
{
    TRACE   = 0,
    DEBUG   = 1,
    INFO    = 2,
    WARNING = 3,
    ERROR   = 4,
    NONE    = 5
};

class MyLog
{
    private static MyLogLevel s_FileMinLevel = MyLogLevel.DEBUG;
    private static MyLogLevel s_ConsoleMinLevel = MyLogLevel.INFO;

    // Utilisation : MyLog.Info("NomDuModule", "Quelque chose s'est passé");
    static void Info(string source, string message)
    {
        Log(MyLogLevel.INFO, source, message);
    }

    static void Warning(string source, string message)
    {
        Log(MyLogLevel.WARNING, source, message);
    }

    static void Error(string source, string message)
    {
        Log(MyLogLevel.ERROR, source, message);
    }

    private static void Log(MyLogLevel level, string source, string message)
    {
        if (level < s_ConsoleMinLevel)
            return;

        string levelName = typename.EnumToString(MyLogLevel, level);
        string line = string.Format("[MyMod] [%1] [%2] %3", levelName, source, message);
        Print(line);

        // Aussi écrire dans le fichier si le niveau atteint le seuil fichier
        if (level >= s_FileMinLevel)
        {
            WriteToFile(line);
        }
    }

    private static void WriteToFile(string line)
    {
        // Implémentation de l'I/O fichier...
    }
}
```

Utilisation à travers plusieurs modules :

```c
MyLog.Info("MissionServer", "MyMod Core initialized (server)");
MyLog.Warning("ServerWebhooksRPC", "Unauthorized request from: " + sender.GetName());
MyLog.Error("ConfigManager", "Failed to load config: " + path);
```

---

## Exemples du monde réel

### Fonction sûre avec gardes multiples

```c
void HealPlayer(PlayerBase player, float amount, string healerName)
{
    // Garde : joueur null
    if (!player)
    {
        MyLog.Error("HealSystem", "HealPlayer called with null player");
        return;
    }

    // Garde : joueur vivant
    if (!player.IsAlive())
    {
        MyLog.Warning("HealSystem", "Cannot heal dead player: " + player.GetIdentity().GetName());
        return;
    }

    // Garde : montant valide
    if (amount <= 0)
    {
        MyLog.Warning("HealSystem", "Invalid heal amount: " + amount.ToString());
        return;
    }

    // Garde : pas déjà à pleine santé
    float currentHP = player.GetHealth("", "Health");
    float maxHP = player.GetMaxHealth("", "Health");
    if (currentHP >= maxHP)
    {
        MyLog.Info("HealSystem", player.GetIdentity().GetName() + " already at full health");
        return;
    }

    // Toutes les gardes passées — effectuer le soin
    float newHP = Math.Min(currentHP + amount, maxHP);
    player.SetHealth("", "Health", newHP);

    MyLog.Info("HealSystem", string.Format("%1 healed %2 for %3 HP (%4 -> %5)",
        healerName,
        player.GetIdentity().GetName(),
        amount.ToString(),
        currentHP.ToString(),
        newHP.ToString()
    ));
}
```

### Chargement de config sûr

```c
class MyConfig
{
    int MaxPlayers = 60;
    float SpawnRadius = 100.0;
    string WelcomeMessage = "Welcome!";
}

static MyConfig LoadConfigSafe(string path)
{
    // Garde : le fichier existe
    if (!FileExist(path))
    {
        Print("[Config] File not found: " + path + " — creating defaults");
        MyConfig defaults = new MyConfig();
        JsonFileLoader<MyConfig>.JsonSaveFile(path, defaults);
        return defaults;
    }

    // Tentative de chargement (pas de try/catch, donc on valide après)
    MyConfig cfg = new MyConfig();
    JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);

    // Garde : l'objet chargé est valide
    if (!cfg)
    {
        Print("[Config] ERROR: Failed to parse " + path + " — using defaults");
        return new MyConfig();
    }

    // Garde : valider les valeurs
    if (cfg.MaxPlayers < 1 || cfg.MaxPlayers > 128)
    {
        Print("[Config] WARN: MaxPlayers out of range (" + cfg.MaxPlayers.ToString() + "), clamping");
        cfg.MaxPlayers = Math.Clamp(cfg.MaxPlayers, 1, 128);
    }

    if (cfg.SpawnRadius < 0)
    {
        Print("[Config] WARN: SpawnRadius negative, using default");
        cfg.SpawnRadius = 100.0;
    }

    return cfg;
}
```

### Handler RPC sûr

```c
void RPC_SpawnItem(CallType type, ParamsReadContext ctx, PlayerIdentity sender, Object target)
{
    // Garde : serveur uniquement
    if (type != CallType.Server)
        return;

    // Garde : expéditeur valide
    if (!sender)
    {
        Print("[RPC] SpawnItem: null sender identity");
        return;
    }

    // Garde : lecture des paramètres
    Param2<string, vector> data;
    if (!ctx.Read(data))
    {
        Print("[RPC] SpawnItem: failed to read params from " + sender.GetName());
        return;
    }

    string className = data.param1;
    vector position = data.param2;

    // Garde : nom de classe valide
    if (className == "")
    {
        Print("[RPC] SpawnItem: empty className from " + sender.GetName());
        return;
    }

    // Garde : vérification de permission
    if (!HasPermission(sender.GetPlainId(), "SpawnItem"))
    {
        Print("[RPC] SpawnItem: unauthorized by " + sender.GetName());
        return;
    }

    // Toutes les gardes passées — exécuter
    Object obj = GetGame().CreateObjectEx(className, position, ECE_PLACE_ON_SURFACE);
    if (!obj)
    {
        Print("[RPC] SpawnItem: CreateObjectEx returned null for " + className);
        return;
    }

    Print("[RPC] SpawnItem: " + sender.GetName() + " spawned " + className);
}
```

### Opération d'inventaire sûre

```c
bool TransferItem(PlayerBase fromPlayer, PlayerBase toPlayer, EntityAI item)
{
    // Garde : toutes les références valides
    if (!fromPlayer || !toPlayer || !item)
    {
        Print("[Inventory] TransferItem: null reference");
        return false;
    }

    // Garde : les deux joueurs vivants
    if (!fromPlayer.IsAlive() || !toPlayer.IsAlive())
    {
        Print("[Inventory] TransferItem: one or both players are dead");
        return false;
    }

    // Garde : la source a bien l'objet
    EntityAI checkItem = fromPlayer.GetInventory().FindAttachment(
        fromPlayer.GetInventory().FindUserReservedLocationIndex(item)
    );

    // Garde : la cible a de la place
    InventoryLocation il = new InventoryLocation();
    if (!toPlayer.GetInventory().FindFreeLocationFor(item, FindInventoryLocationType.ANY, il))
    {
        Print("[Inventory] TransferItem: no free space in target inventory");
        return false;
    }

    // Exécuter le transfert
    return toPlayer.GetInventory().TakeEntityToInventory(InventoryMode.SERVER, FindInventoryLocationType.ANY, item);
}
```

---

## Résumé des patterns défensifs

| Pattern | Objectif | Exemple |
|---------|----------|---------|
| Clause de garde | Retour anticipé sur entrée invalide | `if (!player) return;` |
| Vérification null | Empêcher le déréférencement null | `if (obj) obj.DoThing();` |
| Cast + vérification | Downcast sûr | `if (Class.CastTo(p, obj))` |
| Valider après chargement | Vérifier les données après chargement JSON | `if (cfg.Value < 0) cfg.Value = default;` |
| Valider avant utilisation | Vérification d'intervalle/limites | `if (arr.IsValidIndex(i))` |
| Logger en cas d'échec | Tracer où ça a mal tourné | `Print("[Tag] Error: " + context);` |
| ErrorEx pour le moteur | Écrire dans le fichier .RPT | `ErrorEx("msg", ErrorExSeverity.WARNING);` |
| DumpStackString | Capturer la pile d'appels | `Print(DumpStackString());` |

---

## Bonnes pratiques

- Utilisez des clauses de garde plates (`if (!x) return;`) en haut de chaque fonction au lieu de blocs `if` profondément imbriqués -- cela garde le code lisible et le chemin heureux non imbriqué.
- Loggez toujours un message dans les clauses de garde -- un `return` silencieux rend les échecs invisibles et extrêmement difficiles à déboguer.
- Utilisez `ErrorEx` avec les niveaux de sévérité appropriés (`INFO`, `WARNING`, `ERROR`) pour les messages qui doivent apparaître dans les logs `.RPT` ; utilisez `Print` pour la sortie log de script.
- Enveloppez le logging de debug lourd dans `#ifdef DIAG_DEVELOPER` ou un define personnalisé pour qu'il soit exclu des builds de release et ne nuise pas aux performances.
- Validez les données de config après le chargement avec `JsonFileLoader` -- il retourne `void` et laisse silencieusement les valeurs par défaut en cas d'échec de parsing.

---

## Observé dans les mods réels

> Patterns confirmés par l'étude du code source de mods DayZ professionnels.

| Pattern | Mod | Détail |
|---------|-----|--------|
| Clauses de garde empilées avec messages de log | COT / VPP | Chaque handler RPC vérifie l'expéditeur, les paramètres, les permissions et logge à chaque échec |
| Classe de logger statique avec filtrage de niveau | Expansion / Dabs | Une seule classe `Log` route `Info`/`Warning`/`Error` vers la console, le fichier et optionnellement Discord |
| `DumpStackString()` dans les gardes critiques | COT Admin | Capture la pile d'appels sur un null inattendu pour tracer quel appelant a passé de mauvaises données |
| `#ifdef DIAG_DEVELOPER` autour des prints de debug | Vanilla DayZ / Expansion | Toute sortie de debug par frame est enveloppée pour qu'elle ne s'exécute jamais dans les builds de release |

---

## Théorie vs Pratique

| Concept | Théorie | Réalité |
|---------|---------|---------|
| `try`/`catch` | Standard dans la plupart des langages | N'existe pas en Enforce Script -- chaque point de défaillance doit être gardé manuellement |
| `JsonFileLoader.JsonLoadFile` | Devrait retourner un indicateur de succès/échec | Retourne `void` ; sur du mauvais JSON, l'objet garde ses valeurs par défaut sans erreur |
| `ErrorEx` | On dirait que ça lève une erreur | Il écrit uniquement dans le log `.RPT` -- l'exécution continue normalement |

---

## Erreurs courantes

### 1. Supposer qu'une fonction s'est exécutée avec succès

```c
// FAUX — JsonLoadFile retourne void, pas un indicateur de succès
MyConfig cfg = new MyConfig();
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);
// Si le fichier a du mauvais JSON, cfg a toujours les valeurs par défaut — pas d'erreur

// CORRECT — valider après le chargement
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);
if (cfg.SomeCriticalField == 0)
{
    Print("[Config] Warning: SomeCriticalField is zero — was the file loaded correctly?");
}
```

### 2. Vérifications null profondément imbriquées au lieu de gardes

```c
// FAUX — pyramide de la mort
void Process(PlayerBase player)
{
    if (player)
    {
        if (player.GetIdentity())
        {
            if (player.IsAlive())
            {
                // Enfin faire quelque chose
            }
        }
    }
}

// CORRECT — clauses de garde plates
void Process(PlayerBase player)
{
    if (!player) return;
    if (!player.GetIdentity()) return;
    if (!player.IsAlive()) return;

    // Faire quelque chose
}
```

### 3. Oublier de logger dans les clauses de garde

```c
// FAUX — échec silencieux, impossible à déboguer
if (!player) return;

// CORRECT — laisse une trace
if (!player)
{
    Print("[MyMod] Process: null player");
    return;
}
```

### 4. Utiliser Print dans les chemins chauds

```c
// FAUX — Print à chaque frame tue les performances
override void OnUpdate(float timeslice)
{
    Print("Updating...");  // Appelé à chaque frame !
}

// CORRECT — utiliser des gardes de debug ou limiter le débit
override void OnUpdate(float timeslice)
{
    #ifdef DIAG_DEVELOPER
        m_DebugTimer += timeslice;
        if (m_DebugTimer > 5.0)
        {
            Print("[DEBUG] Update tick: " + timeslice.ToString());
            m_DebugTimer = 0;
        }
    #endif
}
```

---

## Résumé

| Outil | Objectif | Syntaxe |
|-------|----------|---------|
| Clause de garde | Retour anticipé en cas d'échec | `if (!x) return;` |
| Vérification null | Empêcher le crash | `if (obj) obj.Method();` |
| ErrorEx | Écrire dans le log .RPT | `ErrorEx("msg", ErrorExSeverity.WARNING);` |
| DumpStackString | Obtenir la pile d'appels | `string s = DumpStackString();` |
| Print | Écrire dans le log de script | `Print("message");` |
| string.Format | Logging formaté | `string.Format("P %1 at %2", a, b)` |
| Garde #ifdef | Commutateur de debug à la compilation | `#ifdef DIAG_DEVELOPER` |
| notnull | Vérification null du compilateur | `void Fn(notnull Class obj)` |

**La règle d'or :** En Enforce Script, supposez que tout peut être null et que chaque opération peut échouer. Vérifiez d'abord, agissez ensuite, loggez toujours.

---

## Navigation

| Précédent | Haut | Suivant |
|-----------|------|---------|
| [1.10 Enums & Préprocesseur](10-enums-preprocessor.md) | [Partie 1 : Enforce Script](../README.md) | [1.12 Ce qui n'existe PAS](12-gotchas.md) |
