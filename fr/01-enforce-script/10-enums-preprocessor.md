# Chapitre 1.10 : Enums & Préprocesseur

[Accueil](../README.md) | [<< Précédent : Casting & Réflexion](09-casting-reflection.md) | **Enums & Préprocesseur** | [Suivant : Gestion des erreurs >>](11-error-handling.md)

---

> **Objectif :** Comprendre les déclarations d'enum, les outils de réflexion d'enum, les patterns de drapeaux binaires, les constantes et le système de préprocesseur pour la compilation conditionnelle.

---

## Table des matières

- [Déclaration d'enum](#déclaration-denum)
  - [Valeurs explicites](#valeurs-explicites)
  - [Valeurs implicites](#valeurs-implicites)
  - [Héritage d'enum](#héritage-denum)
- [Utiliser les enums](#utiliser-les-enums)
- [Réflexion d'enum](#réflexion-denum)
  - [typename.EnumToString](#typenameenumtostring)
  - [typename.StringToEnum](#typenamestringtoenum)
- [Pattern de drapeaux binaires](#pattern-de-drapeaux-binaires)
- [Constantes](#constantes)
- [Directives du préprocesseur](#directives-du-préprocesseur)
  - [#ifdef / #ifndef / #endif](#ifdef--ifndef--endif)
  - [#define](#define)
  - [Defines du moteur courants](#defines-du-moteur-courants)
  - [Defines personnalisés via config.cpp](#defines-personnalisés-via-configcpp)
- [Exemples du monde réel](#exemples-du-monde-réel)
  - [Code spécifique à la plateforme](#code-spécifique-à-la-plateforme)
  - [Dépendances optionnelles de mods](#dépendances-optionnelles-de-mods)
  - [Diagnostics en mode debug uniquement](#diagnostics-en-mode-debug-uniquement)
  - [Logique serveur vs client](#logique-serveur-vs-client)
- [Erreurs courantes](#erreurs-courantes)
- [Résumé](#résumé)
- [Navigation](#navigation)

---

## Déclaration d'enum

Les enums en Enforce Script définissent des constantes entières nommées regroupées sous un nom de type. Ils se comportent comme des `int` en interne.

### Valeurs explicites

```c
enum EDamageState
{
    PRISTINE  = 0,
    WORN      = 1,
    DAMAGED   = 2,
    BADLY_DAMAGED = 3,
    RUINED    = 4
};
```

### Valeurs implicites

Si vous omettez les valeurs, elles s'auto-incrémentent à partir de la valeur précédente (en commençant à 0) :

```c
enum EWeaponMode
{
    SEMI,       // 0
    BURST,      // 1
    AUTO,       // 2
    COUNT       // 3 — astuce courante pour obtenir le nombre total
};
```

### Héritage d'enum

Les enums peuvent hériter d'autres enums. Les valeurs continuent à partir de la dernière valeur du parent :

```c
enum EBaseColor
{
    RED    = 0,
    GREEN  = 1,
    BLUE   = 2
};

enum EExtendedColor : EBaseColor
{
    YELLOW,   // 3
    CYAN,     // 4
    MAGENTA   // 5
};
```

Toutes les valeurs du parent sont accessibles via l'enum enfant :

```c
int c = EExtendedColor.RED;      // 0 — hérité de EBaseColor
int d = EExtendedColor.YELLOW;   // 3 — défini dans EExtendedColor
```

> **Note :** L'héritage d'enum est utile pour étendre les enums vanilla dans du code moddé sans modifier l'original.

---

## Utiliser les enums

Les enums agissent comme des `int` — vous pouvez les assigner à des variables `int`, les comparer et les utiliser dans des instructions switch :

```c
EDamageState state = EDamageState.WORN;

// Comparaison
if (state == EDamageState.RUINED)
{
    Print("Item is ruined!");
}

// Utilisation dans un switch
switch (state)
{
    case EDamageState.PRISTINE:
        Print("Perfect condition");
        break;
    case EDamageState.WORN:
        Print("Slightly worn");
        break;
    case EDamageState.DAMAGED:
        Print("Damaged");
        break;
    case EDamageState.BADLY_DAMAGED:
        Print("Badly damaged");
        break;
    case EDamageState.RUINED:
        Print("Ruined!");
        break;
}

// Assignation à un int
int stateInt = state;  // 1

// Assignation depuis un int (pas de validation — n'importe quelle valeur int est acceptée !)
EDamageState fromInt = 99;  // Pas d'erreur, même si 99 n'est pas une valeur d'enum valide
```

> **Attention :** Enforce Script ne valide **pas** les assignations d'enum. Assigner un entier hors limites à une variable enum compile et s'exécute sans erreur.

---

## Réflexion d'enum

Enforce Script fournit des fonctions intégrées pour convertir entre les valeurs d'enum et les chaînes.

### typename.EnumToString

Convertir une valeur d'enum en son nom sous forme de chaîne :

```c
EDamageState state = EDamageState.DAMAGED;
string name = typename.EnumToString(EDamageState, state);
Print(name);  // "DAMAGED"
```

C'est inestimable pour le logging et l'affichage UI :

```c
void LogDamageState(EntityAI item, EDamageState state)
{
    string stateName = typename.EnumToString(EDamageState, state);
    Print(item.GetType() + " is " + stateName);
}
```

### typename.StringToEnum

Convertir une chaîne en valeur d'enum :

```c
int value;
typename.StringToEnum(EDamageState, "RUINED", value);
Print(value.ToString());  // "4"
```

Ceci est utilisé lors du chargement de valeurs d'enum depuis des fichiers de configuration ou du JSON :

```c
// Chargement depuis une chaîne de config
string configValue = "BURST";
int modeInt;
if (typename.StringToEnum(EWeaponMode, configValue, modeInt))
{
    EWeaponMode mode = modeInt;
    Print("Loaded weapon mode: " + typename.EnumToString(EWeaponMode, mode));
}
```

---

## Pattern de drapeaux binaires

Les enums avec des valeurs en puissance de 2 créent des drapeaux binaires — plusieurs options combinées dans un seul entier :

```c
enum ESpawnFlags
{
    NONE            = 0,
    PLACE_ON_GROUND = 1,     // 1 << 0
    CREATE_PHYSICS  = 2,     // 1 << 1
    UPDATE_NAVMESH  = 4,     // 1 << 2
    CREATE_LOCAL    = 8,     // 1 << 3
    NO_LIFETIME     = 16     // 1 << 4
};
```

Combiner avec le OU binaire, tester avec le ET binaire :

```c
// Combiner les drapeaux
int flags = ESpawnFlags.PLACE_ON_GROUND | ESpawnFlags.CREATE_PHYSICS | ESpawnFlags.UPDATE_NAVMESH;

// Tester un seul drapeau
if (flags & ESpawnFlags.CREATE_PHYSICS)
{
    Print("Physics will be created");
}

// Supprimer un drapeau
flags = flags & ~ESpawnFlags.CREATE_LOCAL;

// Ajouter un drapeau
flags = flags | ESpawnFlags.NO_LIFETIME;
```

DayZ utilise ce pattern abondamment pour les drapeaux de création d'objets (`ECE_PLACE_ON_SURFACE`, `ECE_CREATEPHYSICS`, `ECE_UPDATEPATHGRAPH`, etc.).

---

## Constantes

Utilisez `const` pour déclarer des valeurs immuables. Les constantes doivent être initialisées à la déclaration.

```c
// Constantes entières
const int MAX_PLAYERS = 60;
const int INVALID_INDEX = -1;

// Constantes flottantes
const float GRAVITY = 9.81;
const float SPAWN_RADIUS = 500.0;

// Constantes de chaîne
const string MOD_NAME = "MyMod";
const string CONFIG_PATH = "$profile:MyMod/config.json";
const string LOG_PREFIX = "[MyMod] ";
```

Les constantes peuvent être utilisées comme valeurs de case dans les switch et comme tailles de tableau :

```c
// Tableau avec taille const
const int BUFFER_SIZE = 256;
int buffer[BUFFER_SIZE];

// Switch avec des valeurs const
const int CMD_HELP = 1;
const int CMD_SPAWN = 2;
const int CMD_TELEPORT = 3;

switch (command)
{
    case CMD_HELP:
        ShowHelp();
        break;
    case CMD_SPAWN:
        SpawnItem();
        break;
    case CMD_TELEPORT:
        TeleportPlayer();
        break;
}
```

> **Note :** Il n'y a pas de `const` pour les types référence (objets). Vous ne pouvez pas rendre une référence d'objet immuable.

---

## Directives du préprocesseur

Le préprocesseur Enforce Script s'exécute avant la compilation, permettant l'inclusion conditionnelle de code. Il fonctionne de manière similaire au préprocesseur C/C++ mais avec moins de fonctionnalités.

### #ifdef / #ifndef / #endif

Inclure conditionnellement du code selon qu'un symbole est défini ou non :

```c
// Inclure le code uniquement si DEVELOPER est défini
#ifdef DEVELOPER
    Print("[DEBUG] Diagnostics enabled");
#endif

// Inclure le code uniquement si un symbole n'est PAS défini
#ifndef SERVER
    // Code client uniquement
    CreateClientUI();
#endif

// Pattern if-else
#ifdef SERVER
    Print("Running on server");
#else
    Print("Running on client");
#endif
```

### #define

Définir vos propres symboles (pas de valeur — juste l'existence) :

```c
#define MY_MOD_DEBUG

#ifdef MY_MOD_DEBUG
    Print("Debug mode active");
#endif
```

> **Note :** Le `#define` d'Enforce Script ne crée que des drapeaux d'existence. Il ne supporte **pas** la substitution de macro (pas de `#define MAX_HP 100` — utilisez `const` à la place).

### Defines du moteur courants

DayZ fournit ces defines intégrés basés sur le type de build et la plateforme :

| Define | Quand disponible | Utilisation |
|--------|-----------------|-------------|
| `SERVER` | En exécution sur serveur dédié | Logique serveur uniquement |
| `DEVELOPER` | Build développeur de DayZ | Fonctionnalités dev uniquement |
| `DIAG_DEVELOPER` | Build diagnostic | Menus diagnostic, outils debug |
| `PLATFORM_WINDOWS` | Plateforme Windows | Chemins spécifiques à la plateforme |
| `PLATFORM_XBOX` | Plateforme Xbox | UI spécifique console |
| `PLATFORM_PS4` | Plateforme PlayStation | Logique spécifique console |
| `BUILD_EXPERIMENTAL` | Branche expérimentale | Fonctionnalités expérimentales |

```c
void InitPlatform()
{
    #ifdef PLATFORM_WINDOWS
        Print("Running on Windows");
    #endif

    #ifdef PLATFORM_XBOX
        Print("Running on Xbox");
    #endif

    #ifdef PLATFORM_PS4
        Print("Running on PlayStation");
    #endif
}
```

### Defines personnalisés via config.cpp

Les mods peuvent définir leurs propres symboles dans `config.cpp` en utilisant le tableau `defines[]`. Ceux-ci sont disponibles pour tous les scripts chargés après ce mod :

```cpp
class CfgMods
{
    class MyMod_MissionSystem
    {
        // ...
        defines[] = { "MY_MISSIONS_LOADED" };
        // ...
    };
};
```

Maintenant d'autres mods peuvent détecter si votre mod de missions est chargé :

```c
#ifdef MY_MISSIONS_LOADED
    // Le mod de missions est chargé — utiliser son API
    MyMissionManager.Start();
#else
    // Le mod de missions n'est pas chargé — ignorer ou utiliser un fallback
    Print("Mission system not detected");
#endif
```

---

## Exemples du monde réel

### Code spécifique à la plateforme

```c
string GetSavePath()
{
    #ifdef PLATFORM_WINDOWS
        return "$profile:MyMod/saves/";
    #else
        return "$saves:MyMod/";
    #endif
}
```

### Dépendances optionnelles de mods

C'est le pattern standard pour les mods qui s'intègrent optionnellement avec d'autres mods :

```c
class MyModManager
{
    void Init()
    {
        Print("[MyMod] Initializing...");

        // Fonctionnalités de base toujours disponibles
        LoadConfig();
        RegisterRPCs();

        // Intégration optionnelle avec MyFramework
        #ifdef MY_FRAMEWORK
            Print("[MyMod] Framework detected — using unified logging");
            RegisterWithCore();
        #endif

        // Intégration optionnelle avec Community Framework
        #ifdef JM_CommunityFramework
            GetRPCManager().AddRPC("MyMod", "RPC_Handler", this, 2);
        #endif
    }
}
```

### Diagnostics en mode debug uniquement

```c
void ProcessAI(DayZInfected zombie)
{
    vector pos = zombie.GetPosition();
    float health = zombie.GetHealth("", "Health");

    // Logging de debug lourd — uniquement dans les builds diagnostic
    #ifdef DIAG_DEVELOPER
        Print(string.Format("[AI] Zombie %1 at %2, HP: %3",
            zombie.GetType(), pos.ToString(), health.ToString()));

        // Dessiner une sphère de debug (fonctionne uniquement dans les builds diag)
        Debug.DrawSphere(pos, 1.0, Colors.RED, ShapeFlags.ONCE);
    #endif

    // La logique réelle s'exécute dans tous les builds
    if (health <= 0)
    {
        HandleZombieDeath(zombie);
    }
}
```

### Logique serveur vs client

```c
class MissionHandler
{
    void OnMissionStart()
    {
        #ifdef SERVER
            // Serveur : charger les données de mission, spawn des objets
            LoadMissionData();
            SpawnMissionObjects();
            NotifyAllPlayers();
        #else
            // Client : configurer l'UI, s'abonner aux événements
            CreateMissionHUD();
            RegisterClientRPCs();
        #endif
    }
}
```

---

## Bonnes pratiques

- Ajoutez une valeur sentinelle `COUNT` comme dernière entrée d'enum pour itérer ou valider facilement les plages (par exemple, `for (int i = 0; i < EMode.COUNT; i++)`).
- Utilisez des valeurs en puissance de 2 pour les enums de drapeaux binaires et combinez-les avec `|` ; testez avec `&` ; supprimez avec `& ~FLAG`.
- Utilisez `const` au lieu de `#define` pour les constantes numériques -- le `#define` d'Enforce Script ne crée que des drapeaux d'existence, pas des macros de valeur.
- Définissez un tableau `defines[]` dans le `config.cpp` de votre mod pour exposer des symboles de détection inter-mods (par exemple, `"STARDZ_CORE"`).
- Validez toujours les valeurs d'enum chargées depuis des données externes (configs, RPCs) -- Enforce Script accepte n'importe quel `int` comme enum sans vérification de plage.

---

## Observé dans les mods réels

> Patterns confirmés par l'étude du code source de mods DayZ professionnels.

| Pattern | Mod | Détail |
|---------|-----|--------|
| `#ifdef` pour l'intégration optionnelle de mod | Expansion / COT | Vérifie `#ifdef JM_CF` ou `#ifdef EXPANSIONMOD` avant d'appeler les APIs inter-mods |
| Enums de drapeaux binaires pour les options de spawn | Vanilla DayZ | `ECE_PLACE_ON_SURFACE`, `ECE_CREATEPHYSICS` etc. combinés avec `\|` pour `CreateObjectEx` |
| `typename.EnumToString` pour le logging | Expansion / Dabs | Les états de dégâts et types d'événements sont loggés comme chaînes lisibles au lieu d'entiers bruts |
| `defines[]` dans config.cpp | StarDZ Core / Expansion | Chaque mod déclare son propre symbole pour que les autres mods puissent le détecter avec `#ifdef` |

---

## Théorie vs Pratique

| Concept | Théorie | Réalité |
|---------|---------|---------|
| Validation d'assignation d'enum | On s'attend à ce que le compilateur rejette les valeurs invalides | `EDamageState state = 999` compile sans problème -- aucune vérification de plage |
| `#define MAX_HP 100` | Fonctionne comme une macro C/C++ | Le `#define` d'Enforce Script ne crée que des drapeaux d'existence ; utilisez `const int` pour les valeurs |
| Empilage de `case` dans `switch` | Plusieurs cases partageant un handler | Pas de fall-through en Enforce Script -- chaque `case` est indépendant ; utilisez `if`/`\|\|` à la place |

---

## Erreurs courantes

### 1. Utiliser les enums comme types validés

```c
// PROBLÈME — pas de validation, n'importe quel int est accepté
EDamageState state = 999;  // Compile sans problème, mais 999 n'est pas un état valide

// SOLUTION — valider manuellement lors du chargement depuis des données externes
int rawValue = LoadFromConfig();
if (rawValue >= 0 && rawValue <= EDamageState.RUINED)
{
    EDamageState state = rawValue;
}
```

### 2. Essayer d'utiliser #define pour la substitution de valeur

```c
// FAUX — le #define d'Enforce Script ne supporte PAS les valeurs
#define MAX_HEALTH 100
int hp = MAX_HEALTH;  // Erreur de compilation !

// CORRECT — utilisez const à la place
const int MAX_HEALTH = 100;
int hp = MAX_HEALTH;
```

### 3. Imbriquer #ifdef incorrectement

```c
// CORRECT — les ifdefs imbriqués sont acceptés
#ifdef SERVER
    #ifdef MY_FRAMEWORK
        MyLog.Info("MyMod", "Server + Core");
    #endif
#endif

// FAUX — un #endif manquant cause des erreurs de compilation mystérieuses
#ifdef SERVER
    DoServerStuff();
// #endif oublié ici !
```

### 4. Oublier que switch/case n'a pas de fall-through

```c
// En C/C++, les cases tombent en cascade sans break.
// En Enforce Script, chaque case est INDÉPENDANT — pas de fall-through.

switch (state)
{
    case EDamageState.PRISTINE:
    case EDamageState.WORN:
        Print("Good condition");  // Atteint uniquement pour WORN, pas PRISTINE !
        break;
}
```

Si vous avez besoin que plusieurs cases partagent la logique, utilisez if/else :

```c
if (state == EDamageState.PRISTINE || state == EDamageState.WORN)
{
    Print("Good condition");
}
```

---

## Résumé

### Enums

| Fonctionnalité | Syntaxe |
|----------------|---------|
| Déclarer | `enum EName { A = 0, B = 1 };` |
| Implicite | `enum EName { A, B, C };` (0, 1, 2) |
| Hériter | `enum EChild : EParent { D, E };` |
| Vers chaîne | `typename.EnumToString(EName, value)` |
| Depuis chaîne | `typename.StringToEnum(EName, "A", out val)` |
| Combiner drapeaux | `flags = A | B` |
| Tester drapeau | `if (flags & A)` |

### Préprocesseur

| Directive | Objectif |
|-----------|----------|
| `#ifdef SYMBOL` | Compiler si le symbole existe |
| `#ifndef SYMBOL` | Compiler si le symbole n'existe PAS |
| `#else` | Branche alternative |
| `#endif` | Fin du bloc conditionnel |
| `#define SYMBOL` | Définir un symbole (sans valeur) |

### Defines clés

| Define | Signification |
|--------|---------------|
| `SERVER` | Serveur dédié |
| `DEVELOPER` | Build développeur |
| `DIAG_DEVELOPER` | Build diagnostic |
| `PLATFORM_WINDOWS` | Système Windows |
| Personnalisé : `defines[]` | config.cpp de votre mod |

---

## Navigation

| Précédent | Haut | Suivant |
|-----------|------|---------|
| [1.9 Casting & Réflexion](09-casting-reflection.md) | [Partie 1 : Enforce Script](../README.md) | [1.11 Gestion des erreurs](11-error-handling.md) |
