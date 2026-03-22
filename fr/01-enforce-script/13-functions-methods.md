# Chapitre 1.13 : Fonctions & Méthodes

[Accueil](../README.md) | [<< Précédent : Pièges](12-gotchas.md) | **Fonctions & Méthodes**

---

## Introduction

Les fonctions sont l'unité fondamentale de comportement en Enforce Script. Chaque action qu'un mod effectue --- spawner un objet, vérifier la santé d'un joueur, envoyer un RPC, dessiner un élément UI --- vit dans une fonction. Comprendre comment les déclarer, passer des données en entrée et en sortie, et travailler avec les modificateurs spéciaux du moteur est essentiel pour écrire des mods DayZ corrects.

Ce chapitre couvre les mécanismes des fonctions en profondeur : syntaxe de déclaration, modes de passage de paramètres, valeurs de retour, paramètres par défaut, liaisons proto native, méthodes statiques vs instance, l'override, le mot-clé `thread` et le mot-clé `event`. Si le Chapitre 1.3 (Classes) vous a appris où vivent les fonctions, ce chapitre vous apprend comment elles fonctionnent.

---

## Table des matières

- [Syntaxe de déclaration de fonction](#syntaxe-de-déclaration-de-fonction)
  - [Fonctions autonomes](#fonctions-autonomes)
  - [Méthodes d'instance](#méthodes-dinstance)
  - [Méthodes statiques](#méthodes-statiques)
- [Modes de passage de paramètres](#modes-de-passage-de-paramètres)
  - [Par valeur (par défaut)](#par-valeur-par-défaut)
  - [Paramètres out](#paramètres-out)
  - [Paramètres inout](#paramètres-inout)
  - [Paramètres notnull](#paramètres-notnull)
- [Valeurs de retour](#valeurs-de-retour)
- [Valeurs par défaut des paramètres](#valeurs-par-défaut-des-paramètres)
- [Méthodes Proto Native (Liaisons moteur)](#méthodes-proto-native-liaisons-moteur)
- [Méthodes statiques vs instance](#méthodes-statiques-vs-instance)
- [Override de méthodes](#override-de-méthodes)
- [Surcharge de méthodes (Non supportée)](#surcharge-de-méthodes-non-supportée)
- [Le mot-clé event](#le-mot-clé-event)
- [Méthodes Thread (Coroutines)](#méthodes-thread-coroutines)
- [Appels différés avec CallLater](#appels-différés-avec-calllater)
- [Bonnes pratiques](#bonnes-pratiques)
- [Observé dans les mods réels](#observé-dans-les-mods-réels)
- [Théorie vs Pratique](#théorie-vs-pratique)
- [Erreurs courantes](#erreurs-courantes)
- [Tableau de référence rapide](#tableau-de-référence-rapide)

---

## Syntaxe de déclaration de fonction

Chaque fonction a un type de retour, un nom et une liste de paramètres. Le corps est encadré par des accolades.

```
TypeDeRetour NomDeFonction(TypeParam nomParam, ...)
{
    // corps
}
```

### Fonctions autonomes

Les fonctions autonomes (globales) existent en dehors de toute classe. Elles sont rares dans le modding DayZ --- presque tout le code vit dans des classes --- mais vous en rencontrerez quelques-unes dans les scripts vanilla.

```c
// Fonction autonome (portée globale)
void PrintPlayerCount()
{
    int count = GetGame().GetPlayers().Count();
    Print(string.Format("Players online: %1", count));
}
```

### Méthodes d'instance

La grande majorité des fonctions dans les mods DayZ sont des méthodes d'instance --- elles appartiennent à une classe et opèrent sur les données de cette instance.

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

Les méthodes d'instance ont un accès implicite à `this` --- une référence à l'objet courant.

### Méthodes statiques

Les méthodes statiques appartiennent à la classe elle-même, pas à une instance. Appelez-les via `NomDeClasse.Methode()`. Elles ne peuvent pas accéder aux champs d'instance ni à `this`.

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

// Utilisation :
float result = MathHelper.Lerp(0, 100, 0.75);  // 75.0
```

Les méthodes statiques sont idéales pour les fonctions utilitaires, les méthodes factory et les accesseurs singleton.

---

## Modes de passage de paramètres

Enforce Script supporte quatre modes de passage de paramètres. Les comprendre est critique car le mauvais mode mène à des bugs silencieux où les données n'atteignent jamais l'appelant.

### Par valeur (par défaut)

Quand aucun modificateur n'est spécifié, le paramètre est passé **par valeur**. Pour les primitives (`int`, `float`, `bool`, `string`, `vector`), une copie est faite. Les modifications à l'intérieur de la fonction n'affectent pas la variable de l'appelant.

```c
void DoubleValue(int x)
{
    x = x * 2;  // modifie la copie locale uniquement
}

// Utilisation :
int n = 5;
DoubleValue(n);
Print(n);  // toujours 5 --- l'original est inchangé
```

Pour les types classe (objets), le passage par valeur passe quand même une **référence à l'objet** --- mais la référence elle-même est copiée. Vous pouvez modifier les champs de l'objet, mais vous ne pouvez pas réassigner la référence pour pointer vers un objet différent.

### Paramètres out

Le mot-clé `out` marque un paramètre comme **sortie uniquement**. La fonction y écrit une valeur, et l'appelant reçoit cette valeur. La valeur initiale du paramètre est indéfinie --- ne la lisez pas avant d'écrire.

```c
// Paramètre out — la fonction remplit la valeur
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

// Utilisation :
PlayerBase result;
if (TryFindPlayer("John", result))
{
    Print(result.GetIdentity().GetName());
}
```

### Paramètres inout

Le mot-clé `inout` marque un paramètre qui est **à la fois lu et écrit** par la fonction. La valeur de l'appelant est disponible à l'intérieur de la fonction, et toute modification est visible par l'appelant après.

```c
// inout — la fonction lit la valeur courante et la modifie
void ClampHealth(inout float health)
{
    if (health < 0)
        health = 0;
    if (health > 100)
        health = 100;
}

// Utilisation :
float hp = 150.0;
ClampHealth(hp);
Print(hp);  // 100.0
```

### Paramètres notnull

Le mot-clé `notnull` dit au compilateur (et au moteur) que le paramètre ne doit pas être `null`. Si une valeur null est passée, le jeu crashera avec une erreur plutôt que de procéder silencieusement avec des données invalides.

```c
void ProcessEntity(notnull EntityAI entity)
{
    // Sûr d'utiliser entity sans vérification null — le moteur le garantit
    string name = entity.GetType();
    Print(name);
}
```

---

## Valeurs de retour

### Valeur de retour unique

Les fonctions retournent une seule valeur. Le type de retour est déclaré avant le nom de la fonction.

```c
float GetDistanceBetween(vector a, vector b)
{
    return vector.Distance(a, b);
}
```

### void (Pas de retour)

Utilisez `void` pour les fonctions qui effectuent une action sans retourner de données.

### Valeurs de retour multiples via paramètres out

Quand vous devez retourner plus d'une valeur, utilisez des paramètres `out`. C'est un pattern universel dans le scripting DayZ.

```c
void GetTimeComponents(float totalSeconds, out int hours, out int minutes, out int seconds)
{
    hours = (int)(totalSeconds / 3600);
    minutes = (int)((totalSeconds % 3600) / 60);
    seconds = (int)(totalSeconds % 60);
}

// Utilisation :
int h, m, s;
GetTimeComponents(3725, h, m, s);
// h == 1, m == 2, s == 5
```

### PIÈGE : JsonFileLoader retourne void

Un piège courant : `JsonFileLoader<T>.JsonLoadFile()` retourne `void`, pas l'objet chargé. Vous devez passer un objet pré-créé comme paramètre `ref`.

```c
// FAUX — ne compilera pas
MyConfig config = JsonFileLoader<MyConfig>.JsonLoadFile(path);

// CORRECT — passer un objet ref
MyConfig config = new MyConfig;
JsonFileLoader<MyConfig>.JsonLoadFile(path, config);
```

---

## Valeurs par défaut des paramètres

Enforce Script supporte les valeurs par défaut pour les paramètres. Les paramètres avec des valeurs par défaut doivent venir **après** tous les paramètres requis.

```c
void SpawnItem(string className, vector pos, float quantity = -1, bool withAttachments = true)
{
    // quantity vaut -1 par défaut (plein), withAttachments vaut true par défaut
    EntityAI item = EntityAI.Cast(GetGame().CreateObject(className, pos, false, false, true));
    if (item && quantity >= 0)
        item.SetQuantity(quantity);
}

// Tous ces appels sont valides :
SpawnItem("AKM", myPos);                   // utilise les deux valeurs par défaut
SpawnItem("AKM", myPos, 0.5);             // quantité personnalisée, accessoires par défaut
SpawnItem("AKM", myPos, -1, false);        // doit spécifier quantity pour atteindre attachments
```

### Limitations

1. **Valeurs littérales uniquement** --- vous ne pouvez pas utiliser d'expressions, d'appels de fonction ou d'autres variables comme valeurs par défaut
2. **Pas de paramètres nommés** --- vous ne pouvez pas sauter un paramètre par nom
3. **Les valeurs par défaut pour les types classe sont restreintes à `null` ou `NULL`**

---

## Méthodes Proto Native (Liaisons moteur)

Les méthodes proto native sont déclarées en script mais **implémentées dans le moteur C++**. Elles forment le pont entre votre code Enforce Script et le moteur de jeu DayZ. Vous les appelez comme des méthodes normales, mais vous ne pouvez pas voir ni modifier leur implémentation.

### Référence des modificateurs

| Modificateur | Signification | Exemple |
|-------------|---------------|---------|
| `proto native` | Implémenté dans le code C++ du moteur | `proto native void SetPosition(vector pos);` |
| `proto native owned` | Retourne une valeur que l'appelant possède (gère la mémoire) | `proto native owned string GetType();` |
| `proto native external` | Défini dans un autre module | `proto native external bool AddSettings(typename cls);` |
| `proto volatile` | A des effets secondaires ; le compilateur ne doit pas optimiser | `proto volatile int Call(Class inst, string fn, void parm);` |
| `proto` (sans `native`) | Fonction interne, peut être native ou non | `proto int ParseString(string input, out string tokens[]);` |

### Appeler les méthodes Proto Native

Vous les appelez comme n'importe quelle autre méthode. La règle clé : **n'essayez jamais d'override ou de redéfinir une méthode proto native**. Ce sont des liaisons moteur fixes.

```c
// Appeler les méthodes proto native — pas différent des méthodes script
Object obj = GetGame().CreateObject("AKM", pos, false, false, true);
vector position = obj.GetPosition();
string typeName = obj.GetType();     // chaîne owned — retournée à vous
obj.SetPosition(newPos);             // native void — pas de retour
```

---

## Méthodes statiques vs instance

### Quand utiliser static

Utilisez les méthodes statiques quand la fonction n'a besoin d'aucune donnée d'instance :

```c
class StringUtils
{
    // Utilitaire pur — pas d'état nécessaire
    static bool IsNullOrEmpty(string s)
    {
        return s == "" || s.Length() == 0;
    }
}
```

**Cas d'utilisation statiques courants :**
- **Fonctions utilitaires** --- helpers math, formateurs de chaîne, vérifications de validation
- **Méthodes factory** --- `Create()` qui retourne une nouvelle instance configurée
- **Accesseurs singleton** --- `GetInstance()` qui retourne l'instance unique

### Pattern Singleton (Static + Instance)

Beaucoup de gestionnaires DayZ combinent statique et instance :

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

    // Méthodes d'instance pour le travail réel
    void ShowNotification(string text, float duration)
    {
        // ...
    }
}

// Utilisation :
NotificationManager.GetInstance().ShowNotification("Hello", 5.0);
```

---

## Override de méthodes

Quand une classe enfant a besoin de changer le comportement d'une méthode parente, elle utilise le mot-clé `override`.

### Override basique

```c
class BaseModule
{
    void OnInit()
    {
        Print("[BaseModule] Initialized");
    }
}

class CombatModule extends BaseModule
{
    override void OnInit()
    {
        super.OnInit();  // appeler le parent d'abord
        Print("[CombatModule] Combat system ready");
    }
}
```

### Règles pour l'override

1. **Le mot-clé `override` est obligatoire** --- sans lui, vous créez une nouvelle méthode qui cache celle du parent
2. **La signature doit correspondre exactement** --- même type de retour, mêmes types de paramètres, même nombre de paramètres
3. **`super.NomMethode()` appelle le parent** --- utilisez-le pour étendre le comportement plutôt que le remplacer complètement
4. **Les méthodes privées ne peuvent pas être overridées**
5. **Les méthodes protégées peuvent être overridées**

### PIÈGE : Oublier override

Si vous omettez `override`, le compilateur peut émettre un avertissement mais ne produira **pas** d'erreur. Votre méthode devient silencieusement une nouvelle méthode au lieu de remplacer celle du parent.

---

## Surcharge de méthodes (Non supportée)

**Enforce Script ne supporte pas la surcharge de méthodes.** Vous ne pouvez pas avoir deux méthodes avec le même nom mais des listes de paramètres différentes. Tenter cela causera une erreur de compilation.

### Solution 1 : Noms de méthodes différents

```c
class Calculator
{
    int AddInt(int a, int b) { return a + b; }
    float AddFloat(float a, float b) { return a + b; }
}
```

### Solution 2 : La convention Ex()

DayZ vanilla et les mods suivent une convention de nommage où une version étendue d'une méthode ajoute `Ex` au nom :

```c
// Depuis les scripts vanilla — version de base vs version étendue
void ExplosionEffects(Object source, Object directHit, int componentIndex);
void ExplosionEffectsEx(Object source, Object directHit, int componentIndex,
    float energyFactor, float explosionFactor, HitInfo hitInfo);
```

### Solution 3 : Paramètres par défaut

Si la différence n'est que des paramètres optionnels, utilisez les valeurs par défaut :

```c
class Spawner
{
    void SpawnAt(vector pos, float radius = 0, string filter = "")
    {
        // une seule méthode gère tous les cas
    }
}
```

---

## Le mot-clé event

Le mot-clé `event` marque une méthode comme **handler d'événement du moteur** --- une fonction que le moteur C++ appelle à des moments spécifiques (création d'entité, événements d'animation, callbacks physiques, etc.).

```c
// Depuis Pawn (3_game/entities/pawn.c)
protected event void OnPossess()
{
    // appelé par le moteur quand un contrôleur possède ce pawn
}

event void GetTransform(inout vector transform[4])
{
    // le moteur appelle ceci pour obtenir la transformation de l'entité
}
```

Vous overridez typiquement les méthodes event dans les classes enfants plutôt que de les définir de zéro.

Le point clé : `event` est un modificateur de déclaration, pas quelque chose que vous invoquez. Le moteur appelle les méthodes event au moment approprié.

---

## Méthodes Thread (Coroutines)

Le mot-clé `thread` crée une **coroutine** --- une fonction qui peut céder l'exécution et reprendre plus tard. Malgré le nom, Enforce Script est **mono-thread**. Les méthodes thread sont des coroutines coopératives, pas des threads au niveau OS.

### Déclarer et démarrer un thread

Vous démarrez un thread en appelant une fonction avec le mot-clé `thread` précédant l'appel :

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
            Sleep(1000);  // céder pendant 1000 millisecondes
        }
    }
}
```

Le mot-clé `thread` va sur **l'appel**, pas la déclaration de fonction. La fonction elle-même est une fonction normale --- ce qui en fait une coroutine est la façon dont vous l'invoquez.

### Quand utiliser les threads (et quand ne pas)

**Préférez `CallLater` et les timers aux threads.** Les coroutines thread ont des limitations :
- Elles sont plus difficiles à déboguer
- Elles consomment un emplacement de coroutine qui persiste jusqu'à complétion ou kill
- Elles ne peuvent pas être sérialisées ou transférées à travers les limites réseau

Utilisez les threads uniquement quand vous avez véritablement besoin d'une boucle longue durée avec des cessions intermédiaires.

---

## Appels différés avec CallLater

`CallLater` planifie un appel de fonction à exécuter après un délai. C'est l'alternative principale aux coroutines thread et est utilisé abondamment dans DayZ vanilla.

### Syntaxe

```c
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(FonctionAAppeler, delaiMs, repeter, ...params);
```

| Paramètre | Type | Description |
|-----------|------|-------------|
| Function | `func` | La méthode à appeler |
| Delay | `int` | Millisecondes avant l'appel |
| Repeat | `bool` | `true` pour répéter à intervalle, `false` pour un tir unique |
| Params | variadique | Paramètres à passer à la fonction |

### Catégories d'appel

| Catégorie | Objectif |
|----------|----------|
| `CALL_CATEGORY_SYSTEM` | Usage général, s'exécute chaque frame |
| `CALL_CATEGORY_GUI` | Callbacks liés à l'UI |
| `CALL_CATEGORY_GAMEPLAY` | Callbacks de logique de gameplay |

### Supprimer des appels planifiés

Pour annuler un appel planifié avant qu'il ne se déclenche :

```c
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).Remove(FonctionAAppeler);
```

---

## Bonnes pratiques

1. **Gardez les fonctions courtes** --- visez moins de 50 lignes. Si une fonction est plus longue, extrayez des méthodes helper.

2. **Utilisez les clauses de garde pour le retour anticipé** --- vérifiez les préconditions en haut et retournez tôt. Cela réduit l'imbrication.

```c
void ProcessPlayer(PlayerBase player)
{
    if (!player) return;
    if (!player.IsAlive()) return;
    if (!player.GetIdentity()) return;

    // logique réelle ici, non imbriquée
    string name = player.GetIdentity().GetName();
    // ...
}
```

3. **Préférez les paramètres out aux types de retour complexes** --- quand une fonction doit communiquer succès/échec plus des données, utilisez un retour `bool` avec des paramètres `out`.

4. **Utilisez static pour les utilitaires sans état** --- si une méthode n'accède pas à `this`, rendez-la `static`.

5. **Préférez CallLater aux coroutines thread** --- `CallLater` est plus simple, plus facile à annuler et moins sujet aux erreurs.

6. **Appelez toujours super dans les overrides** --- sauf si vous voulez intentionnellement remplacer complètement le comportement parent.

---

## Observé dans les mods réels

> Patterns confirmés par l'étude du code source de mods DayZ professionnels.

| Pattern | Mod | Détail |
|---------|-----|--------|
| `TryGet___()` retournant `bool` avec paramètre `out` | COT / Expansion | Pattern cohérent pour les recherches nullable |
| `MethodEx()` pour les signatures étendues | Vanilla / Expansion Market | Quand une API a besoin de plus de paramètres, ajouter `Ex` plutôt que casser les appelants existants |
| Méthodes de classe statiques `Init()` + `Cleanup()` | Expansion / VPP | Les classes gestionnaire initialisent les données statiques dans `Init()` et nettoient dans `Cleanup()` |
| Clause de garde `if (!GetGame()) return` au début de méthode | COT Admin Tools | Chaque méthode touchant le moteur commence par des vérifications null |
| Singleton `GetInstance()` avec création paresseuse | COT / Expansion / Dabs | Les gestionnaires exposent une instance `static ref` avec un accesseur `GetInstance()` |

---

## Théorie vs Pratique

| Concept | Théorie | Réalité |
|---------|---------|---------|
| Surcharge de méthodes | Fonctionnalité OOP standard | Non supportée ; utilisez le suffixe `Ex()` ou les paramètres par défaut |
| `thread` crée des threads OS | Le mot-clé suggère le parallélisme | Coroutines mono-thread avec cession coopérative via `Sleep()` |
| Les paramètres `out` sont en écriture seule | Ne devrait pas lire la valeur initiale | Certains codes vanilla lisent le paramètre `out` avant d'écrire |
| `override` est optionnel | Pourrait être inféré | L'omettre crée silencieusement une nouvelle méthode au lieu d'overrider |
| Expressions dans les paramètres par défaut | Devrait supporter les appels de fonction | Seules les valeurs littérales sont autorisées |

---

## Erreurs courantes

### 1. Oublier override en remplaçant une méthode parente

Sans `override`, votre méthode devient une nouvelle méthode qui cache celle du parent.

### 2. S'attendre à ce que les paramètres out soient pré-initialisés

Un paramètre `out` n'a pas de valeur initiale garantie. Ne le lisez jamais avant d'écrire.

### 3. Essayer de surcharger les méthodes

Enforce Script ne supporte pas la surcharge. Deux méthodes avec le même nom causent une erreur de compilation.

### 4. Assigner le retour d'une fonction void

Certaines fonctions (notamment `JsonFileLoader.JsonLoadFile`) retournent `void`. Essayer d'assigner leur résultat cause une erreur de compilation.

### 5. Utiliser des expressions dans les paramètres par défaut

Les valeurs par défaut des paramètres doivent être des littéraux à la compilation.

```c
// ERREUR DE COMPILATION — expression dans la valeur par défaut
void SetTimeout(float seconds = GetDefaultTimeout()) {}

// CORRECT — valeurs littérales uniquement
void SetTimeout(float seconds = 30.0) {}
```

### 6. Oublier super dans les chaînes d'override

Les hiérarchies de classes de DayZ sont profondes. Omettre `super` dans un override peut casser des fonctionnalités plusieurs couches plus haut dans la chaîne.

```c
// MAUVAIS — casse l'initialisation parente
class MyMission extends MissionServer
{
    override void OnInit()
    {
        // oublié super.OnInit() — l'initialisation vanilla ne s'exécute jamais !
        Print("My mission started");
    }
}

// BON
class MyMission extends MissionServer
{
    override void OnInit()
    {
        super.OnInit();  // laisser vanilla + les autres mods s'initialiser d'abord
        Print("My mission started");
    }
}
```

---

## Tableau de référence rapide

| Fonctionnalité | Syntaxe | Notes |
|----------------|---------|-------|
| Méthode d'instance | `void DoWork()` | A accès à `this` |
| Méthode statique | `static void DoWork()` | Appelée via `ClassName.DoWork()` |
| Param par valeur | `void Fn(int x)` | Copie pour primitives ; copie de ref pour objets |
| Paramètre `out` | `void Fn(out int x)` | Écriture seule ; l'appelant reçoit la valeur |
| Paramètre `inout` | `void Fn(inout float x)` | Lecture + écriture ; l'appelant voit les changements |
| Paramètre `notnull` | `void Fn(notnull EntityAI e)` | Crashe sur null |
| Valeur par défaut | `void Fn(int x = 5)` | Littéraux uniquement, pas d'expressions |
| Override | `override void Fn()` | Doit correspondre à la signature parente |
| Appeler le parent | `super.Fn()` | À l'intérieur du corps d'override |
| Proto native | `proto native void Fn()` | Implémenté en C++ |
| Retour owned | `proto native owned string Fn()` | Le script gère la mémoire retournée |
| External | `proto native external void Fn()` | Défini dans un autre module |
| Volatile | `proto volatile void Fn()` | Peut rappeler dans le script |
| Event | `event void Fn()` | Callback invoqué par le moteur |
| Démarrer un thread | `thread MyFunc()` | Démarre une coroutine (pas un thread OS) |
| Tuer un thread | `KillThread(owner, "FnName")` | Arrête une coroutine en cours |
| Appel différé | `CallLater(Fn, delay, repeat)` | Préféré aux threads |
| Convention `Ex()` | `void FnEx(...)` | Version étendue de `Fn` |

---

## Navigation

| Précédent | Haut | Suivant |
|-----------|------|---------|
| [1.12 Pièges](12-gotchas.md) | [Partie 1 : Enforce Script](../README.md) | -- |
