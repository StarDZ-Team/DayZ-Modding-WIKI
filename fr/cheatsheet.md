# Aide-mémoire Enforce Script

[Accueil](./README.md) | **Aide-mémoire**

---

> Référence rapide sur une seule page pour l'Enforce Script de DayZ. Ajoutez cette page à vos favoris.

---

## Types

| Type | Description | Défaut | Exemple |
|------|-------------|--------|---------|
| `int` | Entier signé 32 bits | `0` | `int x = 42;` |
| `float` | Flottant 32 bits | `0.0` | `float f = 3.14;` |
| `bool` | Booléen | `false` | `bool b = true;` |
| `string` | Type valeur immuable | `""` | `string s = "hello";` |
| `vector` | 3 composantes float (x,y,z) | `"0 0 0"` | `vector v = "1 2 3";` |
| `typename` | Référence de type | `null` | `typename t = PlayerBase;` |
| `Class` | Racine de tous les types référence | `null` | — |
| `void` | Pas de retour | — | — |

**Limites :** `int.MAX` = 2147483647, `int.MIN` = -2147483648, `float.MAX`, `float.MIN`

---

## Méthodes de tableau (`array<T>`)

| Méthode | Retourne | Notes |
|---------|----------|-------|
| `Insert(item)` | `int` (index) | Ajouter à la fin |
| `InsertAt(item, idx)` | `void` | Insérer à une position |
| `Get(idx)` / `arr[idx]` | `T` | Accès par index |
| `Set(idx, item)` | `void` | Remplacer à l'index |
| `Find(item)` | `int` | Index ou -1 |
| `Count()` | `int` | Nombre d'éléments |
| `IsValidIndex(idx)` | `bool` | Vérification des bornes |
| `Remove(idx)` | `void` | **Non ordonné** (échange avec le dernier !) |
| `RemoveOrdered(idx)` | `void` | Préserve l'ordre |
| `RemoveItem(item)` | `void` | Rechercher + supprimer (ordonné) |
| `Clear()` | `void` | Tout supprimer |
| `Sort()` / `Sort(true)` | `void` | Croissant / décroissant |
| `ShuffleArray()` | `void` | Mélanger aléatoirement |
| `Invert()` | `void` | Inverser |
| `GetRandomElement()` | `T` | Sélection aléatoire |
| `InsertAll(other)` | `void` | Ajouter tout depuis un autre tableau |
| `Copy(other)` | `void` | Remplacer par une copie |
| `Resize(n)` | `void` | Redimensionner (remplit avec les valeurs par défaut) |
| `Reserve(n)` | `void` | Pré-allouer la capacité |

**Typedefs :** `TStringArray`, `TIntArray`, `TFloatArray`, `TBoolArray`, `TVectorArray`

---

## Méthodes de map (`map<K,V>`)

| Méthode | Retourne | Notes |
|---------|----------|-------|
| `Insert(key, val)` | `bool` | Ajouter nouveau |
| `Set(key, val)` | `void` | Insérer ou mettre à jour |
| `Get(key)` | `V` | Retourne la valeur par défaut si absent |
| `Find(key, out val)` | `bool` | Obtention sécurisée |
| `Contains(key)` | `bool` | Vérifier l'existence |
| `Remove(key)` | `void` | Supprimer par clé |
| `Count()` | `int` | Nombre d'entrées |
| `GetKey(idx)` | `K` | Clé à l'index (O(n)) |
| `GetElement(idx)` | `V` | Valeur à l'index (O(n)) |
| `GetKeyArray()` | `array<K>` | Toutes les clés |
| `GetValueArray()` | `array<V>` | Toutes les valeurs |
| `Clear()` | `void` | Tout supprimer |

---

## Méthodes de set (`set<T>`)

| Méthode | Retourne |
|---------|----------|
| `Insert(item)` | `int` (index) |
| `Find(item)` | `int` (index ou -1) |
| `Get(idx)` | `T` |
| `Remove(idx)` | `void` |
| `RemoveItem(item)` | `void` |
| `Count()` | `int` |
| `Clear()` | `void` |

---

## Syntaxe de classe

```c
class MyClass extends BaseClass
{
    protected int m_Value;                  // champ
    private ref array<string> m_List;       // référence possédée

    void MyClass() { m_List = new array<string>; }  // constructeur
    void ~MyClass() { }                              // destructeur

    override void OnInit() { super.OnInit(); }       // redéfinition
    static int GetCount() { return 0; }              // méthode statique
};
```

**Accès :** `private` | `protected` | (public par défaut)
**Modificateurs :** `static` | `override` | `ref` | `const` | `out` | `notnull`
**Modded :** `modded class MissionServer { override void OnInit() { super.OnInit(); } }`

---

## Flux de contrôle

```c
// if / else if / else
if (a > 0) { } else if (a == 0) { } else { }

// for
for (int i = 0; i < count; i++) { }

// foreach (valeur)
foreach (string item : myArray) { }

// foreach (index + valeur)
foreach (int i, string item : myArray) { }

// foreach (map : clé + valeur)
foreach (string key, int val : myMap) { }

// while
while (condition) { }

// switch (PAS de fall-through !)
switch (val) { case 0: Print("zero"); break; default: break; }
```

---

## Méthodes de chaîne

| Méthode | Retourne | Exemple |
|---------|----------|---------|
| `s.Length()` | `int` | `"hello".Length()` = 5 |
| `s.Substring(start, len)` | `string` | `"hello".Substring(1,3)` = `"ell"` |
| `s.IndexOf(sub)` | `int` | -1 si non trouvé |
| `s.LastIndexOf(sub)` | `int` | Recherche depuis la fin |
| `s.Contains(sub)` | `bool` | |
| `s.Replace(old, new)` | `int` | Modifie sur place, retourne le nombre |
| `s.ToLower()` | `void` | **Sur place !** |
| `s.ToUpper()` | `void` | **Sur place !** |
| `s.TrimInPlace()` | `void` | **Sur place !** |
| `s.Split(delim, out arr)` | `void` | Découpe en TStringArray |
| `s.Get(idx)` | `string` | Caractère unique |
| `s.Set(idx, ch)` | `void` | Remplacer un caractère |
| `s.ToInt()` | `int` | Analyser un entier |
| `s.ToFloat()` | `float` | Analyser un flottant |
| `s.ToVector()` | `vector` | Analyser `"1 2 3"` |
| `string.Format(fmt, ...)` | `string` | Espaces réservés `%1`..`%9` |
| `string.Join(sep, arr)` | `string` | Joindre les éléments d'un tableau |

---

## Méthodes mathématiques

| Méthode | Description |
|---------|-------------|
| `Math.RandomInt(min, max)` | `[min, max)` max exclusif |
| `Math.RandomIntInclusive(min, max)` | `[min, max]` |
| `Math.RandomFloat01()` | `[0, 1]` |
| `Math.RandomBool()` | Vrai/faux aléatoire |
| `Math.Round(f)` / `Floor(f)` / `Ceil(f)` | Arrondi |
| `Math.AbsFloat(f)` / `AbsInt(i)` | Valeur absolue |
| `Math.Clamp(val, min, max)` | Limiter à une plage |
| `Math.Min(a, b)` / `Max(a, b)` | Min/max |
| `Math.Lerp(a, b, t)` | Interpolation linéaire |
| `Math.InverseLerp(a, b, val)` | Interpolation inverse |
| `Math.Pow(base, exp)` / `Sqrt(f)` | Puissance/racine |
| `Math.Sin(r)` / `Cos(r)` / `Tan(r)` | Trigonométrie (radians) |
| `Math.Atan2(y, x)` | Angle depuis les composantes |
| `Math.NormalizeAngle(deg)` | Normaliser à 0-360 |
| `Math.SqrFloat(f)` / `SqrInt(i)` | Carré |

**Constantes :** `Math.PI`, `Math.PI2`, `Math.PI_HALF`, `Math.DEG2RAD`, `Math.RAD2DEG`

**Vecteur :** `vector.Distance(a,b)`, `vector.DistanceSq(a,b)`, `vector.Direction(a,b)`, `vector.Dot(a,b)`, `vector.Lerp(a,b,t)`, `v.Length()`, `v.Normalized()`

---

## Patrons courants

### Transtypage descendant sécurisé

```c
PlayerBase player;
if (Class.CastTo(player, obj))
{
    player.DoSomething();
}
```

### Transtypage en ligne

```c
PlayerBase player = PlayerBase.Cast(obj);
if (player) player.DoSomething();
```

### Garde null

```c
if (!player) return;
if (!player.GetIdentity()) return;
string name = player.GetIdentity().GetName();
```

### Vérifier IsAlive (nécessite EntityAI)

```c
EntityAI eai;
if (Class.CastTo(eai, obj) && eai.IsAlive()) { }
```

### Itération foreach sur une map

```c
foreach (string key, int value : myMap)
{
    Print(key + " = " + value.ToString());
}
```

### Conversion d'enum

```c
string name = typename.EnumToString(EDamageState, state);
int val; typename.StringToEnum(EDamageState, "RUINED", val);
```

### Drapeaux binaires

```c
int flags = FLAG_A | FLAG_B;       // combiner
if (flags & FLAG_A) { }           // tester
flags = flags & ~FLAG_B;          // supprimer
```

---

## Ce qui n'existe PAS

| Fonctionnalité manquante | Solution de contournement |
|--------------------------|---------------------------|
| Ternaire `? :` | `if/else` |
| `do...while` | `while(true) { ... break; }` |
| `try/catch` | Clauses de garde + retour anticipé |
| Héritage multiple | Simple + composition |
| Surcharge d'opérateurs | Méthodes nommées (sauf `[]` via Get/Set) |
| Lambdas | Méthodes nommées |
| `nullptr` | `null` / `NULL` |
| `\\` / `\"` dans les chaînes | Éviter (CParser plante) |
| `#include` | config.cpp `files[]` |
| Espaces de noms | Préfixes de noms (`MyMod_`, `VPP_`) |
| Interfaces / abstract | Méthodes de base vides |
| Fall-through de switch | Chaque case est indépendant |
| Valeurs `#define` | Utiliser `const` |
| Expressions de paramètres par défaut | Littéraux/NULL uniquement |
| Paramètres variadiques | `string.Format` ou tableaux |
| Redéclaration de variable dans else-if | Noms uniques par branche |

---

## Création de widget (programmatique)

```c
// Obtenir l'espace de travail
WorkspaceWidget ws = GetGame().GetWorkspace();

// Créer depuis un layout
Widget root = ws.CreateWidgets("MyMod/gui/layouts/MyPanel.layout");

// Trouver un widget enfant
TextWidget title = TextWidget.Cast(root.FindAnyWidget("TitleText"));
if (title) title.SetText("Hello World");

// Afficher/masquer
root.Show(true);
root.Show(false);
```

---

## Patron RPC

**Enregistrer (serveur) :**
```c
// Dans l'init 3_Game ou 4_World :
GetGame().RPCSingleParam(null, MY_RPC_ID, null, true, identity);  // RPC moteur

// Ou avec RPC routé par chaîne (MyRPC / CF) :
GetRPCManager().AddRPC("MyMod", "RPC_Handler", this, 2);  // CF
MyRPC.Register("MyMod", "MyRoute", this, MyRPCSide.SERVER);  // MyMod
```

**Envoyer (client vers serveur) :**
```c
Param2<string, int> data = new Param2<string, int>("itemName", 5);
GetGame().RPCSingleParam(null, MY_RPC_ID, data, true);
```

**Recevoir (gestionnaire serveur) :**
```c
void RPC_Handler(CallType type, ParamsReadContext ctx, PlayerIdentity sender, Object target)
{
    if (type != CallType.Server) return;
    if (!sender) return;

    Param2<string, int> data;
    if (!ctx.Read(data)) return;

    string itemName = data.param1;
    int quantity = data.param2;
    // Traitement...
}
```

---

## Gestion des erreurs

```c
ErrorEx("message");                              // Sévérité ERROR par défaut
ErrorEx("info", ErrorExSeverity.INFO);           // Info
ErrorEx("warning", ErrorExSeverity.WARNING);     // Avertissement
Print("debug output");                           // Journal de script
string stack = DumpStackString();                // Obtenir la pile d'appels
```

---

## E/S de fichiers

```c
// Chemins : "$profile:", "$saves:", "$mission:", "$CurrentDir:"
bool exists = FileExist("$profile:MyMod/config.json");
MakeDirectory("$profile:MyMod");

// JSON
MyConfig cfg = new MyConfig();
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);  // Retourne VOID !
JsonFileLoader<MyConfig>.JsonSaveFile(path, cfg);

// Fichier brut
FileHandle fh = OpenFile(path, FileMode.WRITE);
if (fh != 0) { FPrintln(fh, "line"); CloseFile(fh); }
```

---

## Création d'objets

```c
// Basique
Object obj = GetGame().CreateObject("AK101", pos, false, false, true);

// Avec des drapeaux
Object obj = GetGame().CreateObjectEx("Barrel_Green", pos, ECE_PLACE_ON_SURFACE);

// Dans l'inventaire du joueur
player.GetInventory().CreateInInventory("BandageDressing");

// En tant qu'attachement
weapon.GetInventory().CreateAttachment("ACOGOptic");

// Supprimer
GetGame().ObjectDelete(obj);
```

---

## Fonctions globales clés

```c
GetGame()                          // Instance CGame
GetGame().GetPlayer()              // Joueur local (CLIENT uniquement, null sur serveur !)
GetGame().GetPlayers(out arr)      // Tous les joueurs (serveur)
GetGame().GetWorld()               // Instance du monde
GetGame().GetTickTime()            // Temps serveur (float)
GetGame().GetWorkspace()           // Espace de travail UI
GetGame().SurfaceY(x, z)          // Hauteur du terrain
GetGame().IsServer()               // true sur le serveur
GetGame().IsClient()               // true sur le client
GetGame().IsMultiplayer()          // true si multijoueur
```

---

*Documentation complète : [Wiki de modding DayZ](./README.md) | [Pièges](01-enforce-script/12-gotchas.md) | [Gestion des erreurs](01-enforce-script/11-error-handling.md)*
