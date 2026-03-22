# Chapitre 1.6 : Operations sur les chaines

[Accueil](../README.md) | [<< Precedent : Flux de controle](05-control-flow.md) | **Operations sur les chaines** | [Suivant : Math & Vecteurs >>](07-math-vectors.md)

---

## Introduction

Les chaines en Enforce Script sont un **type valeur**, comme `int` ou `float`. Elles sont passees par valeur et comparees par valeur. Le type `string` dispose d'un ensemble riche de methodes integrees pour la recherche, le decoupage, la conversion et le formatage de texte. Ce chapitre est une reference complete pour chaque operation sur les chaines disponible dans le scripting DayZ, avec des exemples concrets du developpement de mods.

---

## Bases des chaines

```c
// Declaration et initialisation
string empty;                          // "" (chaine vide par defaut)
string greeting = "Hello, Chernarus!";
string combined = "Player: " + "John"; // Concatenation avec +

// Les chaines sont des types valeur -- l'assignation cree une copie
string original = "DayZ";
string copy = original;
copy = "Arma";
Print(original); // Toujours "DayZ"
```

---

## Reference complete des methodes de chaine

### Length

Retourne le nombre de caracteres dans la chaine.

```c
string s = "Hello";
int len = s.Length(); // 5

string empty = "";
int emptyLen = empty.Length(); // 0
```

### Substring

Extrait une portion de la chaine. Parametres : `start` (indice), `length` (nombre de caracteres).

```c
string s = "Hello World";
string word = s.Substring(6, 5);  // "World"
string first = s.Substring(0, 5); // "Hello"

// Extraire d'une position jusqu'a la fin
string rest = s.Substring(6, s.Length() - 6); // "World"
```

### IndexOf

Trouve la premiere occurrence d'une sous-chaine. Retourne l'indice, ou `-1` si non trouvee.

```c
string s = "Hello World";
int idx = s.IndexOf("World");     // 6
int notFound = s.IndexOf("DayZ"); // -1
```

### IndexOfFrom

Trouve la premiere occurrence a partir d'un indice donne.

```c
string s = "one-two-one-two";
int first = s.IndexOf("one");        // 0
int second = s.IndexOfFrom(1, "one"); // 8
```

### LastIndexOf

Trouve la derniere occurrence d'une sous-chaine.

```c
string path = "profiles/MyMod/Players/player.json";
int lastSlash = path.LastIndexOf("/"); // 23
```

### Contains

Retourne `true` si la chaine contient la sous-chaine donnee.

```c
string chatMsg = "!teleport 100 0 200";
if (chatMsg.Contains("!teleport"))
{
    Print("Commande de teleportation detectee");
}
```

### Replace

Remplace toutes les occurrences d'une sous-chaine. **Modifie la chaine sur place** et retourne le nombre de remplacements effectues.

```c
string s = "Hello World World";
int count = s.Replace("World", "DayZ");
// s vaut maintenant "Hello DayZ DayZ"
// count vaut 2
```

### Split

Decoupe une chaine par un delimiteur et remplit un tableau. Le tableau doit etre pre-alloue.

```c
string csv = "AK101,M4A1,UMP45,Mosin9130";
TStringArray weapons = new TStringArray;
csv.Split(",", weapons);
// weapons = ["AK101", "M4A1", "UMP45", "Mosin9130"]

// Decouper une commande de chat par les espaces
string chatLine = "!spawn Barrel_Green 5";
TStringArray parts = new TStringArray;
chatLine.Split(" ", parts);
// parts = ["!spawn", "Barrel_Green", "5"]
string command = parts.Get(0);   // "!spawn"
string itemType = parts.Get(1);  // "Barrel_Green"
int amount = parts.Get(2).ToInt(); // 5
```

### Join (statique)

Joint un tableau de chaines avec un separateur.

```c
TStringArray names = {"Alice", "Bob", "Charlie"};
string result = string.Join(", ", names);
// result = "Alice, Bob, Charlie"
```

### Format (statique)

Construit une chaine en utilisant des placeholders numerotes `%1` a `%9`. C'est la methode principale pour construire des chaines formatees en Enforce Script.

```c
string name = "John";
int kills = 15;
float distance = 342.5;

string msg = string.Format("Le joueur %1 a %2 kills (meilleur tir : %3m)", name, kills, distance);
// msg = "Le joueur John a 15 kills (meilleur tir : 342.5m)"
```

Les placeholders sont **indexes a partir de 1** (`%1` est le premier argument, pas `%0`). Vous pouvez utiliser jusqu'a 9 placeholders.

```c
string log = string.Format("[%1] %2 :: %3", "MyMod", "INFO", "Serveur demarre");
// log = "[MyMod] INFO :: Serveur demarre"
```

> **Note :** Il n'y a pas de formatage de type `printf` (`%d`, `%f`, `%s`). Seuls `%1` a `%9` fonctionnent.

### ToLower

Convertit la chaine en minuscules. **Modifie sur place** -- ne retourne PAS une nouvelle chaine.

```c
string s = "Hello WORLD";
s.ToLower();
Print(s); // "hello world"
```

### ToUpper

Convertit la chaine en majuscules. **Modifie sur place.**

```c
string s = "Hello World";
s.ToUpper();
Print(s); // "HELLO WORLD"
```

### Trim / TrimInPlace

Supprime les espaces en debut et fin. **Modifie sur place.**

```c
string s = "  Hello World  ";
s.TrimInPlace();
Print(s); // "Hello World"
```

Il existe aussi `Trim()` qui retourne une nouvelle chaine nettoyee (disponible dans certaines versions du moteur) :

```c
string raw = "  padded  ";
string clean = raw.Trim();
// clean = "padded", raw inchange
```

### Get

Obtient un seul caractere a un indice, retourne sous forme de chaine.

```c
string s = "DayZ";
string ch = s.Get(0); // "D"
string ch2 = s.Get(3); // "Z"
```

### Set

Definit un seul caractere a un indice.

```c
string s = "DayZ";
s.Set(0, "N");
Print(s); // "NayZ"
```

### ToInt

Convertit une chaine numerique en entier.

```c
string s = "42";
int num = s.ToInt(); // 42

string bad = "hello";
int zero = bad.ToInt(); // 0 (les chaines non numeriques retournent 0)
```

### ToFloat

Convertit une chaine numerique en float.

```c
string s = "3.14";
float f = s.ToFloat(); // 3.14
```

### ToVector

Convertit une chaine de trois nombres separes par des espaces en vecteur.

```c
string s = "100.5 0 200.3";
vector pos = s.ToVector(); // Vector(100.5, 0, 200.3)
```

---

## Comparaison de chaines

Les chaines sont comparees par valeur en utilisant les operateurs standard. La comparaison est **sensible a la casse** et suit l'ordre lexicographique (dictionnaire).

```c
string a = "Apple";
string b = "Banana";
string c = "Apple";

bool equal    = (a == c);  // true
bool notEqual = (a != b);  // true
bool less     = (a < b);   // true  ("Apple" < "Banana" lexicographiquement)
bool greater  = (b > a);   // true
```

### Comparaison insensible a la casse

Il n'y a pas de comparaison insensible a la casse integree. Convertissez les deux chaines en minuscules d'abord :

```c
bool EqualsIgnoreCase(string a, string b)
{
    string lowerA = a;
    string lowerB = b;
    lowerA.ToLower();
    lowerB.ToLower();
    return lowerA == lowerB;
}
```

---

## Concatenation de chaines

Utilisez l'operateur `+` pour concatener les chaines. Les types non-chaines sont automatiquement convertis.

```c
string name = "John";
int health = 75;
float distance = 42.5;

string msg = "Joueur " + name + " a " + health + " PV a " + distance + "m";
// "Joueur John a 75 PV a 42.5m"
```

Pour un formatage complexe, preferez `string.Format()` a la concatenation -- c'est plus lisible et evite les allocations intermediaires multiples.

```c
// Preferez ceci :
string msg = string.Format("Joueur %1 a %2 PV a %3m", name, health, distance);

// Plutot que cela :
string msg2 = "Joueur " + name + " a " + health + " PV a " + distance + "m";
```

---

## Exemples concrets

### Analyse des commandes de chat

```c
void ProcessChatMessage(string sender, string message)
{
    // Nettoyer les espaces
    message.TrimInPlace();

    // Doit commencer par !
    if (message.Length() == 0 || message.Get(0) != "!")
        return;

    // Decouper en parties
    TStringArray parts = new TStringArray;
    message.Split(" ", parts);

    if (parts.Count() == 0)
        return;

    string command = parts.Get(0);
    command.ToLower();

    switch (command)
    {
        case "!heal":
            Print(string.Format("[CMD] %1 a utilise !heal", sender));
            break;

        case "!spawn":
            if (parts.Count() >= 2)
            {
                string itemType = parts.Get(1);
                int quantity = 1;
                if (parts.Count() >= 3)
                    quantity = parts.Get(2).ToInt();

                Print(string.Format("[CMD] %1 fait apparaitre %2 x%3", sender, itemType, quantity));
            }
            break;

        case "!tp":
            if (parts.Count() >= 4)
            {
                float x = parts.Get(1).ToFloat();
                float y = parts.Get(2).ToFloat();
                float z = parts.Get(3).ToFloat();
                vector pos = Vector(x, y, z);
                Print(string.Format("[CMD] %1 se teleporte a %2", sender, pos.ToString()));
            }
            break;
    }
}
```

### Formater les noms de joueurs pour l'affichage

```c
string FormatPlayerTag(string name, string clanTag, bool isAdmin)
{
    string result = "";

    if (clanTag.Length() > 0)
    {
        result = "[" + clanTag + "] ";
    }

    result = result + name;

    if (isAdmin)
    {
        result = result + " (Admin)";
    }

    return result;
}
// FormatPlayerTag("John", "DZR", true) => "[DZR] John (Admin)"
// FormatPlayerTag("Jane", "", false)   => "Jane"
```

### Construction de chemins de fichiers

```c
string BuildPlayerFilePath(string steamId)
{
    return "$profile:MyMod/Players/" + steamId + ".json";
}
```

### Assainir les messages de log

```c
string SanitizeForLog(string input)
{
    string safe = input;
    safe.Replace("\n", " ");
    safe.Replace("\r", "");
    safe.Replace("\t", " ");

    // Tronquer a la longueur maximale
    if (safe.Length() > 200)
    {
        safe = safe.Substring(0, 197) + "...";
    }

    return safe;
}
```

### Extraire le nom de fichier d'un chemin

```c
string GetFileName(string path)
{
    int lastSlash = path.LastIndexOf("/");
    if (lastSlash == -1)
        lastSlash = path.LastIndexOf("\\");

    if (lastSlash >= 0 && lastSlash < path.Length() - 1)
    {
        return path.Substring(lastSlash + 1, path.Length() - lastSlash - 1);
    }

    return path;
}
// GetFileName("profiles/MyMod/config.json") => "config.json"
```

---

## Bonnes pratiques

- Utilisez `string.Format()` avec les placeholders `%1`..`%9` pour toute sortie formatee -- c'est plus lisible et evite les pieges de conversion de type de la concatenation `+`.
- N'oubliez pas que `ToLower()`, `ToUpper()` et `Replace()` modifient la chaine sur place -- copiez la chaine d'abord si vous devez preserver l'original.
- Allouez toujours le tableau cible avec `new TStringArray` avant d'appeler `Split()` -- passer un tableau null cause un crash.
- Utilisez `Contains()` pour les verifications simples de sous-chaine et `IndexOf()` uniquement quand vous avez besoin de la position.
- Pour les comparaisons insensibles a la casse, copiez les deux chaines et appelez `ToLower()` sur chacune avant de comparer -- il n'y a pas de comparaison insensible integree.

---

## Observe dans les mods reels

> Patrons confirmes en etudiant le code source de mods DayZ professionnels.

| Patron | Mod | Detail |
|--------|-----|--------|
| `Split(" ", parts)` pour l'analyse des commandes de chat | VPP / COT | Tous les systemes de commande de chat decoupent par espace, puis font un switch sur `parts.Get(0)` |
| `string.Format` avec prefixe `[TAG]` | Expansion / Dabs | Les messages de log utilisent toujours `string.Format("[%1] %2", tag, msg)` plutot que la concatenation |
| Convention de chemin `"$profile:NomMod/"` | COT / Expansion | Les chemins de fichiers construits avec `+` utilisent des barres obliques et le prefixe `$profile:` pour eviter les problemes de backslash |
| `ToLower()` avant la correspondance de commande | VPP Admin | L'entree utilisateur est mise en minuscules avant le `switch`/comparaison pour gerer la casse mixte |

---

## Theorie vs pratique

| Concept | Theorie | Realite |
|---------|---------|---------|
| Valeur de retour de `ToLower()` / `Replace()` | On s'attend a ce qu'ils retournent une nouvelle chaine (comme C#) | Ils modifient sur place et retournent `void` ou un compteur -- source constante de bugs |
| Placeholders `string.Format` | `%d`, `%f`, `%s` comme printf en C | Seuls `%1` a `%9` fonctionnent ; les specificateurs de style C sont silencieusement ignores |
| Backslash `\\` dans les chaines | Caractere d'echappement standard | Peut casser le CParser de DayZ dans les contextes JSON -- preferez les barres obliques pour les chemins |

---

## Erreurs courantes

| Erreur | Probleme | Correction |
|--------|----------|------------|
| S'attendre a ce que `ToLower()` retourne une nouvelle chaine | `ToLower()` modifie sur place, retourne `void` | Copiez la chaine d'abord, puis appelez `ToLower()` sur la copie |
| S'attendre a ce que `ToUpper()` retourne une nouvelle chaine | Meme chose -- modifie sur place | Copiez d'abord, puis appelez `ToUpper()` sur la copie |
| S'attendre a ce que `Replace()` retourne une nouvelle chaine | `Replace()` modifie sur place, retourne le nombre de remplacements | Copiez la chaine d'abord si vous avez besoin de l'original |
| Utiliser `%0` dans `string.Format()` | Les placeholders sont indexes a partir de 1 (`%1` a `%9`) | Commencez a partir de `%1` |
| Utiliser les specificateurs de format `%d`, `%f`, `%s` | Les specificateurs de format de style C ne fonctionnent pas | Utilisez `%1`, `%2`, etc. |
| Comparer des chaines sans normaliser la casse | `"Hello" != "hello"` | Appelez `ToLower()` sur les deux avant de comparer |
| Traiter les chaines comme des types reference | Les chaines sont des types valeur ; l'assignation cree une copie | C'est generalement bien -- sachez juste que modifier une copie n'affecte pas l'original |
| Oublier de creer le tableau avant `Split()` | Appeler `Split()` sur un tableau null cause un crash | Toujours : `TStringArray parts = new TStringArray;` avant `Split()` |

---

## Reference rapide

```c
// Longueur
int len = s.Length();

// Recherche
int idx = s.IndexOf("sub");
int idx = s.IndexOfFrom(startIdx, "sub");
int idx = s.LastIndexOf("sub");
bool has = s.Contains("sub");

// Extraction
string sub = s.Substring(start, length);
string ch  = s.Get(index);

// Modification (sur place)
s.Set(index, "x");
int count = s.Replace("old", "new");
s.ToLower();
s.ToUpper();
s.TrimInPlace();

// Split & Join
TStringArray parts = new TStringArray;
s.Split(delimiter, parts);
string joined = string.Join(sep, parts);

// Format (statique, placeholders %1-%9)
string msg = string.Format("Bonjour %1, vous avez %2 objets", name, count);

// Conversion
int n    = s.ToInt();
float f  = s.ToFloat();
vector v = s.ToVector();

// Comparaison (sensible a la casse, lexicographique)
bool eq = (a == b);
bool lt = (a < b);
```

---

[<< 1.5 : Flux de controle](05-control-flow.md) | [Accueil](../README.md) | [1.7 : Math & Vecteurs >>](07-math-vectors.md)
