# Chapitre 1.13 : Fonctions et Methodes

[Accueil](../../README.md) | [<< Precedent : Gotchas](12-gotchas.md) | **Fonctions et Methodes**

---

## Introduction

Les fonctions sont l'unite fondamentale de comportement dans Enforce Script. Chaque action qu'un mod effectue --- creer un objet, verifier la sante d'un joueur, envoyer un RPC, dessiner un element d'interface --- vit dans une fonction. Comprendre comment les declarer, passer des donnees en entree et en sortie, et travailler avec les modificateurs speciaux du moteur est essentiel pour ecrire des mods DayZ corrects.

Ce chapitre couvre en profondeur les mecanismes des fonctions : syntaxe de declaration, modes de passage de parametres, valeurs de retour, parametres par defaut, liaisons proto native, methodes statiques vs d'instance, surcharge, le mot-cle `thread` et le mot-cle `event`. Si le Chapitre 1.3 (Classes) vous a appris ou vivent les fonctions, ce chapitre vous apprend comment elles fonctionnent.

---

## Table des Matieres

- [Function Declaration Syntax](#function-declaration-syntax)
  - [Standalone Functions](#standalone-functions)
  - [Instance Methods](#instance-methods)
  - [Static Methods](#static-methods)
- [Parameter Passing Modes](#parameter-passing-modes)
  - [By Value (Default)](#by-value-default)
  - [out Parameters](#out-parameters)
  - [inout Parameters](#inout-parameters)
  - [notnull Parameters](#notnull-parameters)
- [Return Values](#return-values)
- [Default Parameter Values](#default-parameter-values)
- [Proto Native Methods (Engine Bindings)](#proto-native-methods-engine-bindings)
- [Static vs Instance Methods](#static-vs-instance-methods)
- [Method Overriding](#method-overriding)
- [Method Overloading (Not Supported)](#method-overloading-not-supported)
- [The event Keyword](#the-event-keyword)
- [Thread Methods (Coroutines)](#thread-methods-coroutines)
- [Deferred Calls with CallLater](#deferred-calls-with-calllater)
- [Best Practices](#best-practices)
- [Observed in Real Mods](#observed-in-real-mods)
- [Theory vs Practice](#theory-vs-practice)
- [Common Mistakes](#common-mistakes)
- [Quick Reference Table](#quick-reference-table)

---

## Syntaxe de Declaration de Fonction

Chaque fonction a un type de retour, un nom et une liste de parametres. Le corps est entoure d'accolades.

```
ReturnType FunctionName(ParamType paramName, ...)
{
    // body
}
```

### Fonctions Autonomes

Les fonctions autonomes (globales) existent en dehors de toute classe. Elles sont rares dans le modding DayZ --- presque tout le code vit dans des classes --- mais vous en rencontrerez quelques-unes dans les scripts vanilla.

```c
// Standalone function (global scope)
void PrintPlayerCount()
{
    int count = GetGame().GetPlayers().Count();
    Print(string.Format("Players online: %1", count));
}

// Standalone function with return value
string FormatTimestamp(int hours, int minutes)
{
    return string.Format("%1:%2", hours.ToStringLen(2), minutes.ToStringLen(2));
}
```

Le moteur vanilla definit plusieurs fonctions utilitaires autonomes :

```c
// From enscript.c — helper for string expressions
string String(string s)
{
    return s;
}
```

### Methodes d'Instance

La grande majorite des fonctions dans les mods DayZ sont des methodes d'instance --- elles appartiennent a une classe et operent sur les donnees de cette instance.

```c
class LootSpawner
{
    protected vector m_Position;
    protected float m_Radius;

    void SetPosition(vector pos)
    {
        m_Position = pos;
    }

    float GetRadius()
    {
        return m_Radius;
    }

    bool IsNearby(vector testPos)
    {
        return vector.Distance(m_Position, testPos) <= m_Radius;
    }
}
```

Les methodes d'instance ont un acces implicite a `this` --- une reference vers l'objet courant. Vous avez rarement besoin d'ecrire `this.` explicitement, mais cela peut aider a desambiguiser quand un parametre a un nom similaire.

### Methodes Statiques

Les methodes statiques appartiennent a la classe elle-meme, pas a une instance. Appelez-les via `ClassName.Method()`. Elles ne peuvent pas acceder aux champs d'instance ou a `this`.

```c
class MathHelper
{
    static float Clamp01(float value)
    {
        if (value < 0) return 0;
        if (value > 1) return 1;
        return value;
    }

    static float Lerp(float a, float b, float t)
    {
        return a + (b - a) * Clamp01(t);
    }
}

// Usage:
float result = MathHelper.Lerp(0, 100, 0.75);  // 75.0
```

Les methodes statiques sont ideales pour les fonctions utilitaires, les methodes de fabrique et les accesseurs de singleton. Le code vanilla de DayZ les utilise largement :

```c
// From DamageSystem (3_game/damagesystem.c)
class DamageSystem
{
    static bool GetDamageZoneMap(EntityAI entity, out DamageZoneMap zoneMap)
    {
        // ...
    }

    static string GetDamageDisplayName(EntityAI entity, string zone)
    {
        // ...
    }
}
```

---

## Modes de Passage de Parametres

Enforce Script supporte quatre modes de passage de parametres. Les comprendre est critique car le mauvais mode conduit a des bugs silencieux ou les donnees n'atteignent jamais l'appelant.

### By Value (Default)

Quand aucun modificateur n'est specifie, le parametre est passe **par valeur**. Pour les primitifs (`int`, `float`, `bool`, `string`, `vector`), une copie est faite. Les modifications dans la fonction n'affectent pas la variable de l'appelant.

```c
void DoubleValue(int x)
{
    x = x * 2;  // modifies local copy only
}

// Usage:
int n = 5;
DoubleValue(n);
Print(n);  // still 5 --- the original is unchanged
```

Pour les types de classe (objets), le passage par valeur passe tout de meme une **reference vers l'objet** --- mais la reference elle-meme est copiee. Vous pouvez modifier les champs de l'objet, mais vous ne pouvez pas reassigner la reference pour pointer vers un objet different.

```c
void RenameZone(SpawnZone zone)
{
    zone.SetName("NewName");  // this WORKS --- modifies the same object
    zone = null;              // this does NOT affect the caller's variable
}
```

### out Parameters

Le mot-cle `out` marque un parametre comme **sortie uniquement**. La fonction ecrit une valeur dedans, et l'appelant recoit cette valeur. La valeur initiale du parametre est indefinie --- ne la lisez pas avant d'ecrire.

```c
// out parameter — function fills the value
bool TryFindPlayer(string name, out PlayerBase player)
{
    array<Man> players = new array<Man>;
    GetGame().GetPlayers(players);

    for (int i = 0; i < players.Count(); i++)
    {
        PlayerBase pb = PlayerBase.Cast(players[i]);
        if (pb && pb.GetIdentity() && pb.GetIdentity().GetName() == name)
        {
            player = pb;
            return true;
        }
    }

    player = null;
    return false;
}

// Usage:
PlayerBase result;
if (TryFindPlayer("John", result))
{
    Print(result.GetIdentity().GetName());
}
```

Les scripts vanilla utilisent largement `out` pour le flux de donnees du moteur vers le script :

```c
// From DayZPlayer (3_game/dayzplayer.c)
proto native void GetCurrentCameraTransform(out vector position, out vector direction, out vector rotation);

// From AIWorld (3_game/ai/aiworld.c)
proto native bool RaycastNavMesh(vector from, vector to, PGFilter pgFilter, out vector hitPos, out vector hitNormal);

// Multiple out parameters for look limits
proto void GetLookLimits(out float pDown, out float pUp, out float pLeft, out float pRight);
```

### inout Parameters

Le mot-cle `inout` marque un parametre qui est **lu et ecrit** par la fonction. La valeur de l'appelant est disponible dans la fonction, et toute modification est visible pour l'appelant apres.

```c
// inout — the function reads the current value and modifies it
void ClampHealth(inout float health)
{
    if (health < 0)
        health = 0;
    if (health > 100)
        health = 100;
}

// Usage:
float hp = 150.0;
ClampHealth(hp);
Print(hp);  // 100.0
```

Vanilla examples of `inout`:

```c
// From enmath.c — smoothing function reads and writes velocity
proto static float SmoothCD(float val, float target, inout float velocity[],
    float smoothTime, float maxVelocity, float dt);

// From enscript.c — parsing modifies the input string
proto int ParseStringEx(inout string input, string token);

// From Pawn (3_game/entities/pawn.c) — transform is read and modified
event void GetTransform(inout vector transform[4])
```

### notnull Parameters

Le mot-cle `notnull` indique au compilateur (et au moteur) que le parametre ne doit pas etre `null`. Si une valeur null est passee, le jeu plantera avec une erreur plutot que de continuer silencieusement avec des donnees invalides.

```c
void ProcessEntity(notnull EntityAI entity)
{
    // Safe to use entity without null-checking — engine guarantees it
    string name = entity.GetType();
    Print(name);
}
```

Vanilla uses `notnull` heavily in engine-facing functions:

```c
// From envisual.c
proto native void SetBone(notnull IEntity ent, int bone, vector angles, vector trans, float scale);
proto native bool GetBoneMatrix(notnull IEntity ent, int bone, vector mat[4]);

// From DamageSystem
static bool GetDamageZoneFromComponentName(notnull EntityAI entity, string component, out string damageZone);
```

You can combine `notnull` with `out`:

```c
// From universaltemperaturesourcelambdabaseimpl.c
override void DryItemsInVicinity(UniversalTemperatureSourceSettings pSettings, vector position,
    out notnull array<EntityAI> nearestObjects);
```

---

## Valeurs de Retour

### Single Return Value

Les fonctions retournent une seule valeur. Le type de retour est declare avant le nom de la fonction.

```c
float GetDistanceBetween(vector a, vector b)
{
    return vector.Distance(a, b);
}
```

### void (No Return)

Utilisez `void` pour les fonctions qui effectuent une action sans retourner de donnees.

```c
void LogMessage(string msg)
{
    Print(string.Format("[MyMod] %1", msg));
}
```

### Returning Objects

Quand une fonction retourne un objet, elle retourne une **reference** (pas une copie). L'appelant recoit un pointeur vers le meme objet en memoire.

```c
EntityAI SpawnItem(string className, vector pos)
{
    EntityAI item = EntityAI.Cast(GetGame().CreateObject(className, pos, false, false, true));
    return item;  // caller gets a reference to the same object
}
```

### Multiple Return Values via out Parameters

Quand vous devez retourner plus d'une valeur, utilisez des parametres `out`. C'est un patron universel dans le scripting DayZ.

```c
void GetTimeComponents(float totalSeconds, out int hours, out int minutes, out int seconds)
{
    hours = (int)(totalSeconds / 3600);
    minutes = (int)((totalSeconds % 3600) / 60);
    seconds = (int)(totalSeconds % 60);
}

// Usage:
int h, m, s;
GetTimeComponents(3725, h, m, s);
// h == 1, m == 2, s == 5
```

### GOTCHA: JsonFileLoader Returns void

Un piege courant : `JsonFileLoader<T>.JsonLoadFile()` retourne `void`, pas l'objet charge. Vous devez passer un objet pre-cree comme parametre `ref`.

```c
// WRONG — will not compile
MyConfig config = JsonFileLoader<MyConfig>.JsonLoadFile(path);

// CORRECT — pass a ref object
MyConfig config = new MyConfig;
JsonFileLoader<MyConfig>.JsonLoadFile(path, config);
```

---

## Valeurs de Parametres par Defaut

Enforce Script supporte les valeurs par defaut pour les parametres. Les parametres avec des valeurs par defaut doivent venir **apres** tous les parametres requis.

```c
void SpawnItem(string className, vector pos, float quantity = -1, bool withAttachments = true)
{
    // quantity defaults to -1 (full), withAttachments defaults to true
    EntityAI item = EntityAI.Cast(GetGame().CreateObject(className, pos, false, false, true));
    if (item && quantity >= 0)
        item.SetQuantity(quantity);
}

// All of these are valid calls:
SpawnItem("AKM", myPos);                   // uses both defaults
SpawnItem("AKM", myPos, 0.5);             // custom quantity, default attachments
SpawnItem("AKM", myPos, -1, false);        // must specify quantity to reach attachments
```

### Valeurs par Defaut du Vanilla

Les scripts vanilla utilisent largement les parametres par defaut :

```c
// From Weather (3_game/weather.c)
proto native void Set(float forecast, float time = 0, float minDuration = 0);
proto native void SetDynVolFogDistanceDensity(float value, float time = 0);

// From UAInput (3_game/inputapi/uainput.c)
proto native float SyncedValue_ID(int action, bool check_focus = true);
proto native bool SyncedPress(string action, bool check_focus = true);

// From DbgUI (1_core/proto/dbgui.c)
static bool FloatOverride(string id, inout float value, float min, float max,
    int precision = 1000, bool sameLine = true);

// From InputManager (2_gamelib/inputmanager.c)
proto native external bool ActivateAction(string actionName, int duration = 0);
```

### Limitations

1. **Valeurs litterales uniquement** --- vous ne pouvez pas utiliser d'expressions, d'appels de fonctions ou d'autres variables comme valeurs par defaut :

```c
// WRONG — no expressions in defaults
void MyFunc(float speed = Math.PI * 2)  // COMPILE ERROR

// CORRECT — use a literal
void MyFunc(float speed = 6.283)
```

2. **Pas de parametres nommes** --- vous ne pouvez pas sauter un parametre par nom. Pour definir le troisieme defaut, vous devez fournir tous les parametres precedents :

```c
void Configure(int a = 1, int b = 2, int c = 3) {}

Configure(1, 2, 10);  // must specify a and b to set c
// There is no syntax like Configure(c: 10)
```

3. **Les valeurs par defaut pour les types de classe sont restreintes a `null` ou `NULL` :**

```c
void DoWork(EntityAI target = null, string name = "")
{
    if (!target) return;
    // ...
}
```

---

## Methodes Proto Native (Engine Bindings)

Les methodes proto native sont declarees dans le script mais **implementees dans le moteur C++**. Elles forment le pont entre votre code Enforce Script et le moteur de jeu DayZ. Vous les appelez comme des methodes normales, mais vous ne pouvez pas voir ou modifier leur implementation.

### Reference des Modificateurs

| Modificateur | Signification | Exemple |
|----------|---------|---------|
| `proto native` | Implemented in C++ engine code | `proto native void SetPosition(vector pos);` |
| `proto native owned` | Returns a value the caller owns (manages memory) | `proto native owned string GetType();` |
| `proto native external` | Defined in another module | `proto native external bool AddSettings(typename cls);` |
| `proto volatile` | Has side effects; compiler must not optimize away | `proto volatile int Call(Class inst, string fn, void parm);` |
| `proto` (without `native`) | Internal function, may or may not be native | `proto int ParseString(string input, out string tokens[]);` |

### proto native

Le modificateur le plus courant. Ce sont des appels directs au moteur.

```c
// Setting/getting position (Object)
proto native void SetPosition(vector pos);
proto native vector GetPosition();

// AI pathfinding (AIWorld)
proto native bool FindPath(vector from, vector to, PGFilter pgFilter, out TVectorArray waypoints);
proto native bool SampleNavmeshPosition(vector position, float maxDistance, PGFilter pgFilter,
    out vector sampledPosition);
```

### proto native owned

Le modificateur `owned` signifie que la valeur de retour est allouee par le moteur et **la propriete est transferee au script**. Cela est principalement utilise pour les retours `string`, ou le moteur cree une nouvelle chaine que le ramasse-miettes du script doit liberer plus tard.

```c
// From Class (enscript.c) — returns a string the script now owns
proto native owned external string ClassName();

// From Widget (enwidgets.c)
proto native owned string GetName();
proto native owned string GetTypeName();
proto native owned string GetStyleName();

// From Object (3_game/entities/object.c)
proto native owned string GetLODName(LOD lod);
proto native owned string GetActionComponentName(int componentIndex, string geometry = "");
```

### proto native external

Le modificateur `external` indique que la fonction est definie dans un module de script different. Cela permet les declarations de methodes inter-modules.

```c
// From Settings (2_gamelib/settings.c)
proto native external bool AddSettings(typename settingsClass);

// From InputManager (2_gamelib/inputmanager.c)
proto native external bool RegisterAction(string actionName);
proto native external float LocalValue(string actionName);
proto native external bool ActivateAction(string actionName, int duration = 0);

// From Workbench API (1_core/workbenchapi.c)
proto native external bool SetOpenedResource(string filename);
proto native external bool Save();
```

### proto volatile

Le modificateur `volatile` indique au compilateur que la fonction peut avoir des **effets de bord** ou peut **rappeler dans le script** (creant de la reentrance). Le compilateur doit preserver le contexte complet lors de l'appel de ces fonctions.

```c
// From ScriptModule (enscript.c) — dynamic function calls that may invoke script
proto volatile int Call(Class inst, string function, void parm);
proto volatile int CallFunction(Class inst, string function, out void returnVal, void parm);

// From typename (enconvert.c) — creates a new instance dynamically
proto volatile Class Spawn();

// Yielding control
proto volatile void Idle();
```

### Appeler les Methodes Proto Native

Vous les appelez comme n'importe quelle autre methode. La regle cle : **n'essayez jamais de surcharger ou redefinir une methode proto native**. Ce sont des liaisons fixes du moteur.

```c
// Calling proto native methods — no different from script methods
Object obj = GetGame().CreateObject("AKM", pos, false, false, true);
vector position = obj.GetPosition();
string typeName = obj.GetType();     // owned string — returned to you
obj.SetPosition(newPos);             // native void — no return
```

---

## Methodes Statiques vs d\'Instance

### Quand Utiliser Static

Use static methods when the function does not need any instance data:

```c
class StringUtils
{
    // Pure utility — no state needed
    static bool IsNullOrEmpty(string s)
    {
        return s == "" || s.Length() == 0;
    }

    static string PadLeft(string s, int totalWidth, string padChar = "0")
    {
        while (s.Length() < totalWidth)
            s = padChar + s;
        return s;
    }
}
```

**Cas d'utilisation statique courants :**
- **Utility functions** --- math helpers, string formatters, validation checks
- **Factory methods** --- `Create()` that returns a new configured instance
- **Singleton accessors** --- `GetInstance()` that returns the single instance
- **Constants/lookups** --- `Init()` + `Cleanup()` for static data tables

### Patron Singleton (Static + Instance)

Many DayZ managers combine static and instance:

```c
class NotificationManager
{
    private static ref NotificationManager s_Instance;

    static NotificationManager GetInstance()
    {
        if (!s_Instance)
            s_Instance = new NotificationManager;
        return s_Instance;
    }

    // Instance methods for actual work
    void ShowNotification(string text, float duration)
    {
        // ...
    }
}

// Usage:
NotificationManager.GetInstance().ShowNotification("Hello", 5.0);
```

### Quand Utiliser Instance

Use instance methods when the function needs access to the object's state:

```c
class SupplyDrop
{
    protected vector m_DropPosition;
    protected float m_DropRadius;
    protected ref array<string> m_LootTable;

    // Needs m_DropPosition, m_DropRadius — must be instance
    bool IsInDropZone(vector testPos)
    {
        return vector.Distance(m_DropPosition, testPos) <= m_DropRadius;
    }

    // Needs m_LootTable — must be instance
    string GetRandomItem()
    {
        return m_LootTable.GetRandomElement();
    }
}
```

---

## Surcharge de Methodes

Quand une classe enfant doit changer le comportement d'une methode parente, elle utilise le mot-cle `override`.

### Surcharge de Base

```c
class BaseModule
{
    void OnInit()
    {
        Print("[BaseModule] Initialized");
    }

    void OnUpdate(float dt)
    {
        // default: do nothing
    }
}

class CombatModule extends BaseModule
{
    override void OnInit()
    {
        super.OnInit();  // call parent first
        Print("[CombatModule] Combat system ready");
    }

    override void OnUpdate(float dt)
    {
        super.OnUpdate(dt);
        // custom combat logic
        CheckCombatState();
    }
}
```

### Regles de Surcharge

1. **Le mot-cle `override` est requis** --- sans lui, vous creez une nouvelle methode qui masque celle du parent, au lieu de la remplacer.

2. **La signature doit correspondre exactement** --- meme type de retour, memes types de parametres, meme nombre de parametres.

3. **`super.MethodName()` appelle le parent** --- utilisez ceci pour etendre le comportement plutot que de le remplacer completement.

4. **Les methodes privees ne peuvent pas etre surchargees** --- elles sont invisibles pour les classes enfants.

5. **Les methodes protegees peuvent etre surchargees** --- les classes enfants les voient et peuvent les surcharger.

```c
class Parent
{
    private void SecretMethod() {}    // cannot be overridden
    protected void InternalWork() {}  // can be overridden by children
    void PublicWork() {}              // can be overridden by anyone
}

class Child extends Parent
{
    // override void SecretMethod() {}   // COMPILE ERROR — private
    override void InternalWork() {}      // OK — protected is visible
    override void PublicWork() {}        // OK — public
}
```

### GOTCHA: Forgetting override

Si vous omettez `override`, le compilateur peut emettre un avertissement mais ne produira **pas** d'erreur. Votre methode devient silencieusement une nouvelle methode au lieu de remplacer celle du parent. La version du parent s'execute chaque fois que l'objet est reference via une variable de type parent.

```c
class Animal
{
    void Speak() { Print("..."); }
}

class Dog extends Animal
{
    // BAD: Missing override — creates a NEW method
    void Speak() { Print("Woof!"); }

    // GOOD: Properly overrides
    override void Speak() { Print("Woof!"); }
}
```

---

## Surcharge de Methodes (Non Supportee)

**Enforce Script ne supporte pas la surcharge de methodes.** Vous ne pouvez pas avoir deux methodes avec le meme nom mais des listes de parametres differentes. Tenter cela causera une erreur de compilation.

```c
class Calculator
{
    // COMPILE ERROR — duplicate method name
    int Add(int a, int b) { return a + b; }
    float Add(float a, float b) { return a + b; }  // NOT ALLOWED
}
```

### Workaround 1: Different Method Names

L'approche la plus courante est d'utiliser des noms descriptifs :

```c
class Calculator
{
    int AddInt(int a, int b) { return a + b; }
    float AddFloat(float a, float b) { return a + b; }
}
```

### Workaround 2: The Ex() Convention

Le vanilla DayZ et les mods suivent une convention de nommage ou une version etendue d'une methode ajoute `Ex` au nom :

```c
// From vanilla scripts — base version vs extended version
void ExplosionEffects(Object source, Object directHit, int componentIndex);
void ExplosionEffectsEx(Object source, Object directHit, int componentIndex,
    float energyFactor, float explosionFactor, HitInfo hitInfo);

// From EffectManager
static void EffectUnregister(Effect effect);
static void EffectUnregisterEx(Effect effect);

// From EntityAI
void SplitIntoStackMax(EntityAI destination_entity, int slot_id);
void SplitIntoStackMaxEx(EntityAI destination_entity, int slot_id);
```

### Workaround 3: Default Parameters

Si la difference est juste des parametres optionnels, utilisez des valeurs par defaut a la place :

```c
class Spawner
{
    // Instead of overloads, use defaults
    void SpawnAt(vector pos, float radius = 0, string filter = "")
    {
        // one method handles all cases
    }
}
```

---

## Le Mot-cle event

Le mot-cle `event` marque une methode comme un **gestionnaire d'evenement du moteur** --- une fonction que le moteur C++ appelle a des moments specifiques (entity creation, animation events, physics callbacks, etc.). C'est une indication pour les outils (comme Workbench) que la methode doit etre exposee comme evenement de script.

```c
// From Pawn (3_game/entities/pawn.c)
protected event void OnPossess()
{
    // called by engine when a controller possesses this pawn
}

protected event void OnUnPossess()
{
    // called by engine when the controller releases this pawn
}

event void GetTransform(inout vector transform[4])
{
    // engine calls this to get the entity's transform
}

// Event methods that supply data for networking
protected event void ObtainMove(PawnMove pMove)
{
    // called by engine to gather movement input
}
```

Vous surchargez generalement les methodes `event` dans les classes enfants plutot que de les definir de zero :

```c
class MyVehicle extends Transport
{
    override event void GetTransform(inout vector transform[4])
    {
        // provide custom transform logic
        super.GetTransform(transform);
    }
}
```

Le point cle : `event` est un modificateur de declaration, pas quelque chose que vous invoquez. Le moteur appelle les methodes event au moment opportun.

---

## Methodes Thread (Coroutines)

Le mot-cle `thread` cree une **coroutine** --- une fonction qui peut ceder l'execution et reprendre plus tard. Malgre le nom, Enforce Script est **mono-thread**. Les methodes thread sont des coroutines cooperatives, pas des threads au niveau du systeme d'exploitation.

### Declarer et Demarrer un Thread

Vous demarrez un thread en appelant une fonction avec le mot-cle `thread` precedant l'appel :

```c
class Monitor
{
    void Start()
    {
        thread MonitorLoop();
    }

    void MonitorLoop()
    {
        while (true)
        {
            CheckStatus();
            Sleep(1000);  // yield for 1000 milliseconds
        }
    }
}
```

Le mot-cle `thread` va sur l'**appel**, pas sur la declaration de la fonction. La fonction elle-meme est une fonction normale --- ce qui en fait une coroutine est comment vous l'invoquez.

### Sleep() and Yielding

Dans une fonction thread, `Sleep(millisecondes)` met en pause l'execution et cede le controle a un autre code. Quand le temps de pause est ecoule, le thread reprend la ou il s'est arrete.

### Arreter les Threads

You can terminate a running thread with `KillThread()`:

```c
// From enscript.c
proto native int KillThread(Class owner, string name);

// Usage:
KillThread(this, "MonitorLoop");  // stops the MonitorLoop coroutine
```

The `owner` is the object that started the thread (or `null` for global threads). The `name` is the function name.

### Quand Utiliser les Threads (et Quand Ne Pas)

**Preferez `CallLater` et les timers aux threads.** Les coroutines thread ont des limitations :
- Elles sont plus difficiles a deboguer (les traces de pile sont moins claires)
- Elles consomment un slot de coroutine qui persiste jusqu'a l'achevement ou l'arret
- Elles ne peuvent pas etre serialisees ou transferees a travers les frontieres reseau

Utilisez les threads uniquement quand vous avez veritablement besoin d'une boucle longue avec des cessions intermediaires. Pour les actions differees ponctuelles, utilisez `CallLater` (voir ci-dessous).

---

## Appels Differes avec CallLater

`CallLater` planifie un appel de fonction a executer apres un delai. C'est l'alternative principale aux coroutines thread et est utilise largement dans le DayZ vanilla.

### Syntax

```c
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(FunctionToCall, delayMs, repeat, ...params);
```

| Parametre | Type | Description |
|-----------|------|-------------|
| Function | `func` | The method to call |
| Delay | `int` | Milliseconds before calling |
| Repeat | `bool` | `true` to repeat at interval, `false` for one-shot |
| Params | variadic | Parameters to pass to the function |

### Categories d'Appel

| Categorie | But |
|----------|---------|
| `CALL_CATEGORY_SYSTEM` | General-purpose, runs every frame |
| `CALL_CATEGORY_GUI` | UI-related callbacks |
| `CALL_CATEGORY_GAMEPLAY` | Gameplay logic callbacks |

### Exemples du Vanilla

```c
// One-shot delayed call (3_game/entities/entityai.c)
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(DeferredInit, 34);

// Repeated call — login countdown every 1 second (3_game/dayzgame.c)
GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(this.LoginTimeCountdown, 1000, true);

// Delayed deletion with parameter (4_world/entities/explosivesbase)
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(DeleteSafe, delayFor * 1000, false);

// UI delayed callback (3_game/gui/hints/uihintpanel.c)
m_Game.GetCallQueue(CALL_CATEGORY_GUI).CallLater(SlideshowThread, m_SlideShowDelay);
```

### Supprimer les Appels en File

Pour annuler un appel planifie avant qu'il ne s'execute :

```c
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).Remove(FunctionToCall);
```

---

## Bonnes Pratiques

1. **Gardez les fonctions courtes** --- visez moins de 50 lignes. Si une fonction est plus longue, extrayez des methodes auxiliaires.

2. **Utilisez des clauses de garde pour un retour anticipe** --- verifiez les preconditions en haut et retournez tot. Cela reduit l'imbrication et rend le "chemin heureux" plus facile a lire.

```c
void ProcessPlayer(PlayerBase player)
{
    if (!player) return;
    if (!player.IsAlive()) return;
    if (!player.GetIdentity()) return;

    // actual logic here, unnested
    string name = player.GetIdentity().GetName();
    // ...
}
```

3. **Preferez les parametres out aux types de retour complexes** --- quand une fonction doit communiquer succes/echec plus des donnees, utilisez un retour `bool` avec des parametres `out`.

4. **Utilisez static pour les utilitaires sans etat** --- si une methode n'accede pas a `this`, rendez-la `static`. Cela documente l'intention et permet l'appel sans instance.

5. **Documentez les limitations proto native** --- lors de l'encapsulation d'un appel proto native, notez en commentaires ce que la fonction du moteur peut et ne peut pas faire.

6. **Preferez CallLater aux coroutines thread** --- `CallLater` est plus simple, plus facile a annuler et moins sujet aux erreurs.

7. **Appelez toujours super dans les surcharges** --- sauf si vous voulez intentionnellement remplacer completement le comportement parent. Les chaines d'heritage profondes de DayZ dependent des appels `super` se propageant a travers la hierarchie.

---

## Observe dans les Mods Reels

> Patrons confirmes par l'etude du code source de mods DayZ professionnels.

| Patron | Mod | Detail |
|---------|-----|--------|
| `TryGet___()` returning `bool` with `out` param | COT / Expansion | Consistent pattern for nullable lookups: return `true`/`false`, fill `out` param on success |
| `MethodEx()` for extended signatures | Vanilla / Expansion Market | When an API needs more parameters, append `Ex` rather than breaking existing callers |
| Static `Init()` + `Cleanup()` class methods | Expansion / VPP | Manager classes initialize static data in `Init()` and tear down in `Cleanup()`, called from mission lifecycle |
| Guard clause `if (!GetGame()) return` at method start | COT Admin Tools | Every method that touches the engine starts with null checks to avoid crashes during shutdown |
| Singleton `GetInstance()` with lazy creation | COT / Expansion / Dabs | Managers expose `static ref` instance with `GetInstance()` accessor, created on first access |

---

## Theorie vs Pratique

| Concept | Theorie | Realite |
|---------|--------|---------|
| Method overloading | Standard OOP feature | Not supported; use `Ex()` suffix or default parameters instead |
| `thread` creates OS threads | Keyword suggests parallelism | Single-threaded coroutines with cooperative yielding via `Sleep()` |
| `out` parameters are write-only | Should not read initial value | Some vanilla code reads the `out` param before writing; safer to always treat as `inout` defensively |
| `override` is optional | Could be inferred | Omitting it silently creates a new method instead of overriding; always include it |
| Default parameter expressions | Should support function calls | Only literal values (`42`, `true`, `null`, `""`) are allowed; no expressions |

---

## Erreurs Courantes

### 1. Forgetting override When Replacing a Parent Method

Without `override`, your method becomes a new method that hides the parent's. The parent's version will still be called when the object is referenced through a parent type.

```c
// BAD — silently creates a new method
class CustomPlayer extends PlayerBase
{
    void OnConnect() { Print("Custom!"); }
}

// GOOD — properly overrides
class CustomPlayer extends PlayerBase
{
    override void OnConnect() { Print("Custom!"); }
}
```

### 2. Expecting out Parameters to Be Pre-initialized

An `out` parameter has no guaranteed initial value. Never read it before writing.

```c
// BAD — reading out param before it's set
void GetData(out int value)
{
    if (value > 0)  // WRONG — value is undefined here
        return;
    value = 42;
}

// GOOD — always write first, then read
void GetData(out int value)
{
    value = 42;
}
```

### 3. Trying to Overload Methods

Enforce Script does not support overloading. Two methods with the same name cause a compile error.

```c
// COMPILE ERROR
void Process(int id) {}
void Process(string name) {}

// CORRECT — use different names
void ProcessById(int id) {}
void ProcessByName(string name) {}
```

### 4. Assigning the Return of a void Function

Some functions (notably `JsonFileLoader.JsonLoadFile`) return `void`. Trying to assign their result causes a compile error.

```c
// COMPILE ERROR — JsonLoadFile returns void
MyConfig cfg = JsonFileLoader<MyConfig>.JsonLoadFile(path);

// CORRECT
MyConfig cfg = new MyConfig;
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);
```

### 5. Using Expressions in Default Parameters

Default parameter values must be compile-time literals. Expressions, function calls, and variable references are not allowed.

```c
// COMPILE ERROR — expression in default
void SetTimeout(float seconds = GetDefaultTimeout()) {}
void SetAngle(float rad = Math.PI) {}

// CORRECT — literal values only
void SetTimeout(float seconds = 30.0) {}
void SetAngle(float rad = 3.14159) {}
```

### 6. Forgetting super in Override Chains

DayZ's class hierarchies are deep. Omitting `super` in an override can break functionality several layers up the chain that you never even knew existed.

```c
// BAD — breaks parent initialization
class MyMission extends MissionServer
{
    override void OnInit()
    {
        // forgot super.OnInit() — vanilla initialization never runs!
        Print("My mission started");
    }
}

// GOOD
class MyMission extends MissionServer
{
    override void OnInit()
    {
        super.OnInit();  // let vanilla + other mods initialize first
        Print("My mission started");
    }
}
```

---

## Tableau de Reference Rapide

| Fonctionnalite | Syntaxe | Notes |
|---------|--------|-------|
| Instance method | `void DoWork()` | Has access to `this` |
| Static method | `static void DoWork()` | Called via `ClassName.DoWork()` |
| By-value param | `void Fn(int x)` | Copy for primitives; ref copy for objects |
| `out` param | `void Fn(out int x)` | Write-only; caller receives value |
| `inout` param | `void Fn(inout float x)` | Read + write; caller sees changes |
| `notnull` param | `void Fn(notnull EntityAI e)` | Crashes on null |
| Default value | `void Fn(int x = 5)` | Literals only, no expressions |
| Override | `override void Fn()` | Must match parent signature |
| Call parent | `super.Fn()` | Inside override body |
| Proto native | `proto native void Fn()` | Implemented in C++ |
| Owned return | `proto native owned string Fn()` | Script manages returned memory |
| External | `proto native external void Fn()` | Defined in another module |
| Volatile | `proto volatile void Fn()` | May callback into script |
| Event | `event void Fn()` | Engine-invoked callback |
| Thread start | `thread MyFunc()` | Starts coroutine (not OS thread) |
| Kill thread | `KillThread(owner, "FnName")` | Stops a running coroutine |
| Deferred call | `CallLater(Fn, delay, repeat)` | Preferred over threads |
| `Ex()` convention | `void FnEx(...)` | Extended version of `Fn` |

---

## Navigation

| Previous | Haut | Next |
|----------|----|------|
| [1.12 Gotchas](12-gotchas.md) | [Part 1: Enforce Script](../README.md) | -- |
