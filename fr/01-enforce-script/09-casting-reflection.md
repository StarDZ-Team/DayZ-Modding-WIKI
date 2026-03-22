# Chapitre 1.9 : Casting & Réflexion

[Accueil](../../README.md) | [<< Précédent : Gestion de la mémoire](08-memory-management.md) | **Casting & Réflexion** | [Suivant : Enums & Préprocesseur >>](10-enums-preprocessor.md)

---

> **Objectif :** Maîtriser le casting de type sûr, les vérifications de type à l'exécution et l'API de réflexion d'Enforce Script pour l'accès dynamique aux propriétés.

---

## Table des matières

- [Pourquoi le casting est important](#pourquoi-le-casting-est-important)
- [Class.CastTo — Downcasting sûr](#classcastto--downcasting-sûr)
- [Type.Cast — Casting alternatif](#typecast--casting-alternatif)
- [CastTo vs Type.Cast — Quand utiliser lequel](#castto-vs-typecast--quand-utiliser-lequel)
- [obj.IsInherited — Vérification de type à l'exécution](#obisinherited--vérification-de-type-à-lexécution)
- [obj.IsKindOf — Vérification de type par chaîne](#obiskindof--vérification-de-type-par-chaîne)
- [obj.Type — Obtenir le type à l'exécution](#objtype--obtenir-le-type-à-lexécution)
- [typename — Stocker des références de type](#typename--stocker-des-références-de-type)
- [API de réflexion](#api-de-réflexion)
  - [Inspecter les variables](#inspecter-les-variables)
  - [EnScript.GetClassVar / SetClassVar](#enscriptgetclassvar--setclassvar)
- [Exemples du monde réel](#exemples-du-monde-réel)
  - [Trouver tous les véhicules dans le monde](#trouver-tous-les-véhicules-dans-le-monde)
  - [Helper d'objet sûr avec cast](#helper-dobjet-sûr-avec-cast)
  - [Système de configuration basé sur la réflexion](#système-de-configuration-basé-sur-la-réflexion)
  - [Dispatch d'événements type-safe](#dispatch-dévénements-type-safe)
- [Erreurs courantes](#erreurs-courantes)
- [Résumé](#résumé)
- [Navigation](#navigation)

---

## Pourquoi le casting est important

La hiérarchie d'entités de DayZ est profonde. La plupart des APIs du moteur retournent un type de base générique (`Object`, `Man`, `Class`), mais vous avez besoin d'un type spécifique (`PlayerBase`, `ItemBase`, `CarScript`) pour accéder aux méthodes spécialisées. Le casting convertit une référence de base en une référence dérivée — de manière sûre.

```
Class (racine)
  └─ Object
       └─ Entity
            └─ EntityAI
                 ├─ InventoryItem → ItemBase
                 ├─ DayZCreatureAI
                 │    ├─ DayZInfected
                 │    └─ DayZAnimal
                 └─ Man
                      └─ DayZPlayer → PlayerBase
```

Appeler une méthode qui n'existe pas sur le type de base cause un **crash à l'exécution** — il n'y a pas d'erreur de compilation car Enforce Script résout les appels virtuels à l'exécution.

---

## Class.CastTo — Downcasting sûr

`Class.CastTo` est la méthode de casting **préférée** dans DayZ. C'est une méthode statique qui écrit le résultat dans un paramètre `out` et retourne un `bool`.

```c
// Signature :
// static bool Class.CastTo(out Class target, Class source)

Object obj = GetSomeObject();
PlayerBase player;

if (Class.CastTo(player, obj))
{
    // Le cast a réussi — player est valide
    string name = player.GetIdentity().GetName();
    Print("Found player: " + name);
}
else
{
    // Le cast a échoué — obj n'est pas un PlayerBase
    // player est null ici
}
```

**Pourquoi c'est préféré :**
- Retourne `false` en cas d'échec au lieu de crasher
- Le paramètre `out` est mis à `null` en cas d'échec — sûr à vérifier
- Fonctionne à travers toute la hiérarchie de classes (pas seulement `Object`)

### Pattern : Cast-and-Continue

Dans les boucles, utilisez l'échec du cast pour ignorer les objets non pertinents :

```c
array<Object> nearObjects = new array<Object>;
array<CargoBase> proxyCargos = new array<CargoBase>;
GetGame().GetObjectsAtPosition(pos, 50.0, nearObjects, proxyCargos);

foreach (Object obj : nearObjects)
{
    EntityAI entity;
    if (!Class.CastTo(entity, obj))
        continue;  // Ignorer les objets non-EntityAI (bâtiments, terrain, etc.)

    // Maintenant c'est sûr d'appeler les méthodes EntityAI
    if (entity.IsAlive())
    {
        Print(entity.GetType() + " is alive at " + entity.GetPosition().ToString());
    }
}
```

---

## Type.Cast — Casting alternatif

Chaque classe a une méthode statique `Cast` qui retourne le résultat du cast directement (ou `null` en cas d'échec).

```c
// Syntaxe : TargetType.Cast(source)

Object obj = GetSomeObject();
PlayerBase player = PlayerBase.Cast(obj);

if (player)
{
    player.DoSomething();
}
```

C'est un one-liner qui combine cast et assignation, mais vous **devez** quand même vérifier le résultat pour null.

### Casting de primitives et Params

`Type.Cast` est aussi utilisé avec les classes `Param` (utilisées abondamment dans les RPCs et événements) :

```c
override void OnEvent(EventType eventTypeId, Param params)
{
    if (eventTypeId == ClientReadyEventTypeID)
    {
        Param2<PlayerIdentity, Man> readyParams = Param2<PlayerIdentity, Man>.Cast(params);
        if (readyParams)
        {
            PlayerIdentity identity = readyParams.param1;
            Man player = readyParams.param2;
        }
    }
}
```

---

## CastTo vs Type.Cast — Quand utiliser lequel

| Fonctionnalité | `Class.CastTo` | `Type.Cast` |
|----------------|----------------|-------------|
| Type de retour | `bool` | Type cible ou `null` |
| Null en cas d'échec | Oui (paramètre out mis à null) | Oui (retourne null) |
| Meilleur pour | Blocs if avec logique de branchement | Assignations one-liner |
| Utilisé dans DayZ vanilla | Partout | Partout |
| Fonctionne avec non-Object | Oui (tout `Class`) | Oui (tout `Class`) |

**Règle générale :** Utilisez `Class.CastTo` quand vous branchez sur le succès/échec. Utilisez `Type.Cast` quand vous avez juste besoin de la référence typée et vérifierez null plus tard.

```c
// CastTo — brancher sur le résultat
PlayerBase player;
if (Class.CastTo(player, obj))
{
    // gérer le joueur
}

// Type.Cast — assigner et vérifier plus tard
PlayerBase player = PlayerBase.Cast(obj);
if (!player) return;
```

---

## obj.IsInherited — Vérification de type à l'exécution

`IsInherited` vérifie si un objet est une instance d'un type donné **sans** effectuer de cast. Il prend un argument `typename`.

```c
Object obj = GetSomeObject();

if (obj.IsInherited(PlayerBase))
{
    Print("This is a player!");
}

if (obj.IsInherited(DayZInfected))
{
    Print("This is a zombie!");
}

if (obj.IsInherited(CarScript))
{
    Print("This is a vehicle!");
}
```

`IsInherited` retourne `true` pour le type exact **et** tout type parent dans la hiérarchie. Un objet `PlayerBase` retourne `true` pour `IsInherited(Man)`, `IsInherited(EntityAI)`, `IsInherited(Object)`, etc.

---

## obj.IsKindOf — Vérification de type par chaîne

`IsKindOf` fait la même vérification mais avec un nom de classe en **chaîne**. Utile quand vous avez le nom du type comme donnée (par exemple, depuis des fichiers de configuration).

```c
Object obj = GetSomeObject();

if (obj.IsKindOf("ItemBase"))
{
    Print("This is an item");
}

if (obj.IsKindOf("DayZAnimal"))
{
    Print("This is an animal");
}
```

**Important :** `IsKindOf` vérifie toute la chaîne d'héritage, tout comme `IsInherited`. Un `Mag_STANAG_30Rnd` retourne `true` pour `IsKindOf("Magazine_Base")`, `IsKindOf("InventoryItem")`, `IsKindOf("EntityAI")`, etc.

### IsInherited vs IsKindOf

| Fonctionnalité | `IsInherited(typename)` | `IsKindOf(string)` |
|----------------|------------------------|---------------------|
| Argument | Type à la compilation | Nom en chaîne |
| Vitesse | Plus rapide (comparaison de type) | Plus lent (recherche de chaîne) |
| Utiliser quand | Vous connaissez le type à la compilation | Le type vient de données/config |

---

## obj.Type — Obtenir le type à l'exécution

`Type()` retourne le `typename` de la classe réelle de l'objet à l'exécution — pas le type déclaré de la variable.

```c
Object obj = GetSomeObject();
typename t = obj.Type();

Print(t.ToString());  // par ex., "PlayerBase", "AK101", "LandRover"
```

Utilisez ceci pour le logging, le debug ou la comparaison dynamique de types :

```c
void ProcessEntity(EntityAI entity)
{
    typename t = entity.Type();
    Print("Processing entity of type: " + t.ToString());

    if (t == PlayerBase)
    {
        Print("It's a player");
    }
}
```

---

## typename — Stocker des références de type

`typename` est un type de première classe en Enforce Script. Vous pouvez le stocker dans des variables, le passer en paramètre et le comparer.

```c
// Déclarer une variable typename
typename playerType = PlayerBase;
typename vehicleType = CarScript;

// Comparer
typename objType = obj.Type();
if (objType == playerType)
{
    Print("Match!");
}

// Utiliser dans des collections
array<typename> allowedTypes = new array<typename>;
allowedTypes.Insert(PlayerBase);
allowedTypes.Insert(DayZInfected);
allowedTypes.Insert(DayZAnimal);

// Vérifier l'appartenance
foreach (typename t : allowedTypes)
{
    if (obj.IsInherited(t))
    {
        Print("Object matches allowed type: " + t.ToString());
        break;
    }
}
```

### Créer des instances depuis typename

Vous pouvez créer des objets depuis un `typename` à l'exécution :

```c
typename t = PlayerBase;
Class instance = t.Spawn();  // Crée une nouvelle instance

// Ou utilisez l'approche basée sur les chaînes :
Class instance2 = GetGame().CreateObjectEx("AK101", pos, ECE_PLACE_ON_SURFACE);
```

> **Note :** `typename.Spawn()` ne fonctionne que pour les classes avec un constructeur sans paramètres. Pour les entités DayZ, utilisez `GetGame().CreateObject()` ou `CreateObjectEx()`.

---

## API de réflexion

Enforce Script fournit une réflexion basique — la capacité d'inspecter et de modifier les propriétés d'un objet à l'exécution sans connaître son type à la compilation.

### Inspecter les variables

Le `Type()` de chaque objet retourne un `typename` qui expose les métadonnées des variables :

```c
void InspectObject(Class obj)
{
    typename t = obj.Type();

    int varCount = t.GetVariableCount();
    Print("Class: " + t.ToString() + " has " + varCount.ToString() + " variables");

    for (int i = 0; i < varCount; i++)
    {
        string varName = t.GetVariableName(i);
        typename varType = t.GetVariableType(i);

        Print("  [" + i.ToString() + "] " + varName + " : " + varType.ToString());
    }
}
```

**Méthodes de réflexion disponibles sur `typename` :**

| Méthode | Retourne | Description |
|---------|----------|-------------|
| `GetVariableCount()` | `int` | Nombre de variables membres |
| `GetVariableName(int index)` | `string` | Nom de la variable à l'index |
| `GetVariableType(int index)` | `typename` | Type de la variable à l'index |
| `ToString()` | `string` | Nom de la classe sous forme de chaîne |

### EnScript.GetClassVar / SetClassVar

`EnScript.GetClassVar` et `EnScript.SetClassVar` vous permettent de lire/écrire des variables membres par **nom** à l'exécution. C'est l'équivalent en Enforce Script de l'accès dynamique aux propriétés.

```c
// Signature :
// static void EnScript.GetClassVar(Class instance, string varName, int index, out T value)
// static bool EnScript.SetClassVar(Class instance, string varName, int index, T value)
// 'index' est l'index de l'élément du tableau — utilisez 0 pour les champs non-tableau.

class MyConfig
{
    int MaxSpawns = 10;
    float SpawnRadius = 100.0;
    string WelcomeMsg = "Hello!";
}

void DemoReflection()
{
    MyConfig cfg = new MyConfig();

    // Lire les valeurs par nom
    int maxVal;
    EnScript.GetClassVar(cfg, "MaxSpawns", 0, maxVal);
    Print("MaxSpawns = " + maxVal.ToString());  // "MaxSpawns = 10"

    float radius;
    EnScript.GetClassVar(cfg, "SpawnRadius", 0, radius);
    Print("SpawnRadius = " + radius.ToString());  // "SpawnRadius = 100"

    string msg;
    EnScript.GetClassVar(cfg, "WelcomeMsg", 0, msg);
    Print("WelcomeMsg = " + msg);  // "WelcomeMsg = Hello!"

    // Écrire les valeurs par nom
    EnScript.SetClassVar(cfg, "MaxSpawns", 0, 50);
    EnScript.SetClassVar(cfg, "SpawnRadius", 0, 250.0);
    EnScript.SetClassVar(cfg, "WelcomeMsg", 0, "Welcome!");
}
```

> **Attention :** `GetClassVar`/`SetClassVar` échouent silencieusement si le nom de variable est incorrect ou si le type ne correspond pas. Validez toujours les noms de variables avant utilisation.

---

## Exemples du monde réel

### Trouver tous les véhicules dans le monde

```c
static array<CarScript> FindAllVehicles()
{
    array<CarScript> vehicles = new array<CarScript>;
    array<Object> allObjects = new array<Object>;
    array<CargoBase> proxyCargos = new array<CargoBase>;

    // Chercher dans une grande zone (ou utiliser une logique spécifique à la mission)
    vector center = "7500 0 7500";
    GetGame().GetObjectsAtPosition(center, 15000.0, allObjects, proxyCargos);

    foreach (Object obj : allObjects)
    {
        CarScript car;
        if (Class.CastTo(car, obj))
        {
            vehicles.Insert(car);
        }
    }

    Print("Found " + vehicles.Count().ToString() + " vehicles");
    return vehicles;
}
```

### Helper d'objet sûr avec cast

Ce pattern est utilisé dans tout le modding DayZ — une fonction utilitaire qui vérifie de manière sûre si un `Object` est vivant en castant vers `EntityAI` :

```c
// Object.IsAlive() n'existe PAS sur la classe de base Object !
// Vous devez d'abord caster vers EntityAI.

static bool IsObjectAlive(Object obj)
{
    if (!obj)
        return false;

    EntityAI eai;
    if (Class.CastTo(eai, obj))
    {
        return eai.IsAlive();
    }

    return false;  // Objets non-EntityAI (bâtiments, etc.) — traiter comme « pas vivant »
}
```

### Système de configuration basé sur la réflexion

Ce pattern (utilisé dans MyMod Core) construit un système de configuration générique où les champs sont lus/écrits par nom, permettant aux panneaux d'administration de modifier n'importe quelle config sans connaître sa classe spécifique :

```c
class ConfigBase
{
    protected int FindVarIndex(string fieldName)
    {
        typename t = Type();
        int count = t.GetVariableCount();
        for (int i = 0; i < count; i++)
        {
            if (t.GetVariableName(i) == fieldName)
                return i;
        }
        return -1;
    }

    string GetFieldValue(string fieldName)
    {
        if (FindVarIndex(fieldName) == -1)
            return "";

        int iVal;
        EnScript.GetClassVar(this, fieldName, 0, iVal);
        return iVal.ToString();
    }

    void SetFieldValue(string fieldName, string value)
    {
        if (FindVarIndex(fieldName) == -1)
            return;

        int iVal = value.ToInt();
        EnScript.SetClassVar(this, fieldName, 0, iVal);
    }
}

class MyModConfig : ConfigBase
{
    int MaxPlayers = 60;
    int RespawnTime = 300;
}

void AdminPanelSave(ConfigBase config, string fieldName, string newValue)
{
    // Fonctionne pour N'IMPORTE QUELLE sous-classe de config — pas de code spécifique au type
    config.SetFieldValue(fieldName, newValue);
}
```

### Dispatch d'événements type-safe

Utilisez `typename` pour construire un dispatcher qui route les événements vers le bon handler :

```c
class EventDispatcher
{
    protected ref map<typename, ref array<ref EventHandler>> m_Handlers;

    void EventDispatcher()
    {
        m_Handlers = new map<typename, ref array<ref EventHandler>>;
    }

    void Register(typename eventType, EventHandler handler)
    {
        if (!m_Handlers.Contains(eventType))
        {
            m_Handlers.Insert(eventType, new array<ref EventHandler>);
        }

        m_Handlers.Get(eventType).Insert(handler);
    }

    void Dispatch(EventBase event)
    {
        typename eventType = event.Type();

        array<ref EventHandler> handlers;
        if (m_Handlers.Find(eventType, handlers))
        {
            foreach (EventHandler handler : handlers)
            {
                handler.Handle(event);
            }
        }
    }
}
```

---

## Bonnes pratiques

- Vérifiez toujours null après chaque cast -- tant `Class.CastTo` que `Type.Cast` retournent null en cas d'échec, et utiliser le résultat sans vérification cause des crashs.
- Utilisez `Class.CastTo` quand vous avez besoin de brancher sur le succès/échec ; utilisez `Type.Cast` pour des assignations one-liner concises suivies d'une vérification null.
- Préférez `IsInherited(typename)` à `IsKindOf(string)` quand le type est connu à la compilation -- c'est plus rapide et attrape les fautes de frappe à la compilation.
- Castez vers `EntityAI` avant d'appeler `IsAlive()` -- la classe de base `Object` n'a pas cette méthode.
- Validez les noms de variables avec `GetVariableCount`/`GetVariableName` avant d'utiliser `EnScript.GetClassVar` -- il échoue silencieusement sur les mauvais noms.

---

## Observé dans les mods réels

> Patterns confirmés par l'étude du code source de mods DayZ professionnels.

| Pattern | Mod | Détail |
|---------|-----|--------|
| `Class.CastTo` + `continue` dans les boucles d'entités | COT / Expansion | Chaque boucle sur des tableaux d'`Object` utilise cast-and-continue pour ignorer les types non correspondants |
| `IsKindOf` pour les vérifications de type pilotées par config | Expansion Market | Les catégories d'objets chargées depuis JSON utilisent `IsKindOf` basé sur les chaînes car les types sont des données |
| `EnScript.GetClassVar`/`SetClassVar` pour les panneaux d'admin | Dabs Framework | Les éditeurs de config génériques lisent/écrivent les champs par nom pour qu'une seule UI fonctionne pour toutes les classes de config |
| `obj.Type().ToString()` pour le logging | VPP Admin | Les logs de debug incluent toujours `entity.Type().ToString()` pour identifier ce qui a été traité |

---

## Théorie vs Pratique

| Concept | Théorie | Réalité |
|---------|---------|---------|
| `Object.IsAlive()` | On s'attend à ce qu'il existe sur `Object` | Disponible uniquement sur `EntityAI` et sous-classes -- l'appeler sur `Object` crashe |
| `EnScript.SetClassVar` retourne `bool` | Devrait indiquer le succès/échec | Retourne `false` silencieusement sur un mauvais nom de champ sans message d'erreur -- facile à rater |
| `typename.Spawn()` | Crée n'importe quelle instance de classe | Ne fonctionne que pour les classes avec un constructeur sans paramètres ; pour les entités de jeu, utilisez `CreateObject` |

---

## Erreurs courantes

### 1. Oublier de vérifier null après un cast

```c
// FAUX — crashe si obj n'est pas un PlayerBase
PlayerBase player = PlayerBase.Cast(obj);
player.GetIdentity();  // CRASH si le cast a échoué !

// CORRECT
PlayerBase player = PlayerBase.Cast(obj);
if (player)
{
    player.GetIdentity();
}
```

### 2. Appeler IsAlive() sur un Object de base

```c
// FAUX — Object.IsAlive() n'existe pas
Object obj = GetSomeObject();
if (obj.IsAlive())  // Erreur de compilation ou crash à l'exécution !

// CORRECT
EntityAI eai;
if (Class.CastTo(eai, obj) && eai.IsAlive())
{
    // Sûr
}
```

### 3. Utiliser la réflexion avec un mauvais nom de variable

```c
// ÉCHEC SILENCIEUX — pas d'erreur, retourne juste zéro/vide
int val;
EnScript.GetClassVar(obj, "NonExistentField", 0, val);
// val est 0, aucune erreur levée
```

Validez toujours avec `FindVarIndex` ou `GetVariableCount`/`GetVariableName` d'abord.

### 4. Confondre Type() avec un littéral typename

```c
// Type() — retourne le type RUNTIME d'une instance
typename t = myObj.Type();  // par ex., PlayerBase

// Littéral typename — une référence de type à la compilation
typename t = PlayerBase;    // Toujours PlayerBase

// Ils sont comparables
if (myObj.Type() == PlayerBase)  // true si myObj EST un PlayerBase
```

---

## Résumé

| Opération | Syntaxe | Retourne |
|-----------|---------|----------|
| Downcast sûr | `Class.CastTo(out target, source)` | `bool` |
| Cast inline | `TargetType.Cast(source)` | Cible ou `null` |
| Vérification de type (typename) | `obj.IsInherited(typename)` | `bool` |
| Vérification de type (chaîne) | `obj.IsKindOf("ClassName")` | `bool` |
| Obtenir le type runtime | `obj.Type()` | `typename` |
| Nombre de variables | `obj.Type().GetVariableCount()` | `int` |
| Nom de variable | `obj.Type().GetVariableName(i)` | `string` |
| Type de variable | `obj.Type().GetVariableType(i)` | `typename` |
| Lire une propriété | `EnScript.GetClassVar(obj, name, 0, out val)` | `void` |
| Écrire une propriété | `EnScript.SetClassVar(obj, name, 0, val)` | `bool` |

---

## Navigation

| Précédent | Haut | Suivant |
|-----------|------|---------|
| [1.8 Gestion de la mémoire](08-memory-management.md) | [Partie 1 : Enforce Script](../README.md) | [1.10 Enums & Préprocesseur](10-enums-preprocessor.md) |
