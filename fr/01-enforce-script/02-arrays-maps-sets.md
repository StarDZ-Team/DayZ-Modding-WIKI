# Chapitre 1.2 : Tableaux, Maps & Sets

[Accueil](../README.md) | [<< Précédent : Variables & Types](01-variables-types.md) | **Tableaux, Maps & Sets** | [Suivant : Classes & Héritage >>](03-classes-inheritance.md)

---

## Introduction

Les vrais mods DayZ traitent des collections de choses : listes de joueurs, inventaires d'objets, mappings d'IDs de joueurs vers des permissions, ensembles de zones actives. Enforce Script fournit trois types de collection pour gérer ces besoins :

- **`array<T>`** --- Liste dynamique, ordonnée et redimensionnable (la collection que vous utiliserez le plus)
- **`map<K,V>`** --- Conteneur associatif clé-valeur (table de hachage)
- **`set<T>`** --- Collection ordonnée avec suppression basée sur la valeur

Il existe aussi des **tableaux statiques** (`int arr[5]`) pour les données de taille fixe connues à la compilation. Ce chapitre couvre tout cela en profondeur, y compris chaque méthode disponible, les patterns d'itération et les pièges subtils qui causent de vrais bugs dans les mods de production.

---

## Tableaux statiques

Les tableaux statiques ont une taille fixe déterminée à la compilation. Ils ne peuvent ni grandir ni rétrécir. Ils sont utiles pour les petites collections de taille connue et sont plus efficaces en mémoire que les tableaux dynamiques.

### Déclaration et utilisation

```c
void StaticArrayBasics()
{
    // Déclarer avec une taille littérale
    int numbers[5];
    numbers[0] = 10;
    numbers[1] = 20;
    numbers[2] = 30;
    numbers[3] = 40;
    numbers[4] = 50;

    // Déclarer avec une liste d'initialisation
    float damages[3] = {10.5, 25.0, 50.0};

    // Déclarer avec une taille const
    const int GRID_SIZE = 4;
    string labels[GRID_SIZE];

    // Accéder aux éléments
    int first = numbers[0];     // 10
    float maxDmg = damages[2];  // 50.0

    // Itérer avec une boucle for
    for (int i = 0; i < 5; i++)
    {
        Print(numbers[i]);
    }
}
```

### Règles des tableaux statiques

1. La taille doit être une constante à la compilation (littéral ou `const int`)
2. Vous **ne pouvez pas** utiliser une variable comme taille : `int arr[myVar]` est une erreur de compilation
3. Accéder à un index hors limites cause un comportement indéfini (pas de vérification de limites à l'exécution)
4. Les tableaux statiques sont passés par référence aux fonctions (contrairement aux primitives)

```c
// Tableaux statiques comme paramètres de fonction
void FillArray(int arr[3])
{
    arr[0] = 100;
    arr[1] = 200;
    arr[2] = 300;
}

void Test()
{
    int myArr[3];
    FillArray(myArr);
    Print(myArr[0]);  // 100 -- l'original a été modifié (passé par référence)
}
```

### Quand utiliser les tableaux statiques

Utilisez les tableaux statiques pour :
- Les données de vecteur/matrice (`vector mat[3]` pour les matrices de rotation 3x3)
- Les petites tables de recherche fixes
- Les chemins chauds critiques en performance où l'allocation compte

Utilisez `array<T>` dynamique pour tout le reste.

---

## Tableaux dynamiques : `array<T>`

Les tableaux dynamiques sont la collection la plus couramment utilisée dans le modding DayZ. Ils peuvent grandir et rétrécir à l'exécution, supportent les génériques et fournissent un riche ensemble de méthodes.

### Création

```c
void CreateArrays()
{
    // Méthode 1 : opérateur new
    array<string> names = new array<string>;

    // Méthode 2 : Liste d'initialisation
    array<int> scores = {100, 85, 92, 78};

    // Méthode 3 : Utiliser un typedef
    TStringArray items = new TStringArray;  // identique à array<string>

    // Tableaux de n'importe quel type
    array<float> distances = new array<float>;
    array<bool> flags = new array<bool>;
    array<vector> positions = new array<vector>;
    array<PlayerBase> players = new array<PlayerBase>;
}
```

### Typedefs pré-définis

DayZ fournit des typedefs raccourcis pour les types de tableaux les plus courants :

```c
typedef array<string>  TStringArray;
typedef array<float>   TFloatArray;
typedef array<int>     TIntArray;
typedef array<bool>    TBoolArray;
typedef array<vector>  TVectorArray;
```

Vous rencontrerez `TStringArray` constamment dans le code DayZ --- parsing de config, messages de chat, tables de loot, et plus encore.

---

## Référence complète des méthodes de tableau

### Ajouter des éléments

```c
void AddingElements()
{
    array<string> items = new array<string>;

    // Insert : ajouter à la fin, retourne le nouvel index
    int idx = items.Insert("Bandage");     // idx == 0
    idx = items.Insert("Morphine");        // idx == 1
    idx = items.Insert("Saline");          // idx == 2
    // items : ["Bandage", "Morphine", "Saline"]

    // InsertAt : insérer à un index spécifique, décale les éléments existants vers la droite
    items.InsertAt("Epinephrine", 1);
    // items : ["Bandage", "Epinephrine", "Morphine", "Saline"]

    // InsertAll : ajouter tous les éléments d'un autre tableau
    array<string> moreItems = {"Tetracycline", "Charcoal"};
    items.InsertAll(moreItems);
    // items : ["Bandage", "Epinephrine", "Morphine", "Saline", "Tetracycline", "Charcoal"]
}
```

### Accéder aux éléments

```c
void AccessingElements()
{
    array<string> items = {"Apple", "Banana", "Cherry", "Date"};

    // Get : accès par index
    string first = items.Get(0);       // "Apple"
    string third = items.Get(2);       // "Cherry"

    // Opérateur crochet : identique à Get
    string second = items[1];          // "Banana"

    // Set : remplacer l'élément à l'index
    items.Set(1, "Blueberry");         // items[1] est maintenant "Blueberry"

    // Count : nombre d'éléments
    int count = items.Count();         // 4

    // IsValidIndex : vérification de limites
    bool valid = items.IsValidIndex(3);   // true
    bool invalid = items.IsValidIndex(4); // false
    bool negative = items.IsValidIndex(-1); // false
}
```

### Recherche

```c
void SearchingArrays()
{
    array<string> weapons = {"AKM", "M4A1", "Mosin", "IZH18", "AKM"};

    // Find : retourne le premier index de l'élément, ou -1 s'il n'est pas trouvé
    int idx = weapons.Find("Mosin");    // 2
    int notFound = weapons.Find("FAL");  // -1

    // Vérifier l'existence
    if (weapons.Find("M4A1") != -1)
        Print("M4A1 found!");

    // GetRandomElement : retourne un élément aléatoire
    string randomWeapon = weapons.GetRandomElement();

    // GetRandomIndex : retourne un index valide aléatoire
    int randomIdx = weapons.GetRandomIndex();
}
```

### Supprimer des éléments

C'est ici que les bugs les plus courants se produisent. Faites bien attention à la différence entre `Remove` et `RemoveOrdered`.

```c
void RemovingElements()
{
    array<string> items = {"A", "B", "C", "D", "E"};

    // Remove(index) : RAPIDE mais NON ORDONNÉ
    // Échange l'élément à l'index avec le DERNIER élément, puis réduit le tableau
    items.Remove(1);  // Supprime "B" en échangeant avec "E"
    // items est maintenant : ["A", "E", "C", "D"]  -- L'ORDRE A CHANGÉ !

    // RemoveOrdered(index) : LENT mais préserve l'ordre
    // Décale tous les éléments après l'index vers la gauche
    items = {"A", "B", "C", "D", "E"};
    items.RemoveOrdered(1);  // Supprime "B", décale C,D,E vers la gauche
    // items est maintenant : ["A", "C", "D", "E"]  -- ordre préservé

    // RemoveItem(value) : trouve l'élément et le supprime (ordonné)
    items = {"A", "B", "C", "D", "E"};
    items.RemoveItem("C");
    // items est maintenant : ["A", "B", "D", "E"]

    // Clear : supprimer tous les éléments
    items.Clear();
    // items.Count() == 0
}
```

### Dimensionnement et capacité

```c
void SizingArrays()
{
    array<int> data = new array<int>;

    // Reserve : pré-allouer la capacité interne (ne change PAS Count)
    // Utiliser quand vous savez combien d'éléments vous allez ajouter
    data.Reserve(100);
    // data.Count() == 0, mais le buffer interne est prêt pour 100 éléments

    // Resize : changer le Count, remplir les nouveaux emplacements avec les valeurs par défaut
    data.Resize(10);
    // data.Count() == 10, tous les éléments sont 0

    // Resize plus petit tronque
    data.Resize(5);
    // data.Count() == 5
}
```

### Tri et mélange

```c
void OrderingArrays()
{
    array<int> numbers = {5, 2, 8, 1, 9, 3};

    // Tri croissant
    numbers.Sort();
    // numbers : [1, 2, 3, 5, 8, 9]

    // Tri décroissant
    numbers.Sort(true);
    // numbers : [9, 8, 5, 3, 2, 1]

    // Inverser le tableau
    numbers = {1, 2, 3, 4, 5};
    numbers.Invert();
    // numbers : [5, 4, 3, 2, 1]

    // Mélanger aléatoirement
    numbers.ShuffleArray();
    // numbers : [3, 1, 5, 2, 4]  (ordre aléatoire)
}
```

### Copie

```c
void CopyingArrays()
{
    array<string> original = {"A", "B", "C"};

    // Copy : remplace tout le contenu par une copie d'un autre tableau
    array<string> copy = new array<string>;
    copy.Copy(original);
    // copy : ["A", "B", "C"]
    // Modifier copy n'affecte PAS original

    // InsertAll : ajoute (ne remplace pas)
    array<string> combined = {"X", "Y"};
    combined.InsertAll(original);
    // combined : ["X", "Y", "A", "B", "C"]
}
```

### Debug

```c
void DebuggingArrays()
{
    array<string> items = {"Bandage", "Morphine", "Saline"};

    // Debug : affiche tous les éléments dans le log de script
    items.Debug();
    // Sortie :
    // [0] => Bandage
    // [1] => Morphine
    // [2] => Saline
}
```

---

## Itérer les tableaux

### Boucle for (basée sur l'index)

```c
void ForLoopIteration()
{
    array<string> items = {"AKM", "M4A1", "Mosin"};

    for (int i = 0; i < items.Count(); i++)
    {
        Print(string.Format("[%1] %2", i, items[i]));
    }
    // [0] AKM
    // [1] M4A1
    // [2] Mosin
}
```

### foreach (valeur seulement)

```c
void ForEachValue()
{
    array<string> items = {"AKM", "M4A1", "Mosin"};

    foreach (string weapon : items)
    {
        Print(weapon);
    }
    // AKM
    // M4A1
    // Mosin
}
```

### foreach (index + valeur)

```c
void ForEachIndexValue()
{
    array<string> items = {"AKM", "M4A1", "Mosin"};

    foreach (int i, string weapon : items)
    {
        Print(string.Format("[%1] %2", i, weapon));
    }
    // [0] AKM
    // [1] M4A1
    // [2] Mosin
}
```

### Exemple du monde réel : Trouver le joueur le plus proche

```c
PlayerBase FindNearestPlayer(vector origin, float maxRange)
{
    array<Man> allPlayers = new array<Man>;
    GetGame().GetPlayers(allPlayers);

    PlayerBase nearest = null;
    float nearestDist = maxRange;

    foreach (Man man : allPlayers)
    {
        PlayerBase player;
        if (!Class.CastTo(player, man))
            continue;

        if (!player.IsAlive())
            continue;

        float dist = vector.Distance(origin, player.GetPosition());
        if (dist < nearestDist)
        {
            nearestDist = dist;
            nearest = player;
        }
    }

    return nearest;
}
```

---

## Maps : `map<K,V>`

Les maps stockent des paires clé-valeur. Elles sont utilisées quand vous devez chercher une valeur par une clé --- données de joueur par UID, prix d'objet par nom de classe, permissions par nom de rôle, etc.

### Création

```c
void CreateMaps()
{
    // Création standard
    map<string, int> prices = new map<string, int>;

    // Maps de divers types
    map<string, float> multipliers = new map<string, float>;
    map<int, string> idToName = new map<int, string>;
    map<string, ref array<string>> categories = new map<string, ref array<string>>;
}
```

---

## Référence complète des méthodes de map

### Insertion et mise à jour

```c
void MapInsertUpdate()
{
    map<string, int> inventory = new map<string, int>;

    // Insert : ajouter une nouvelle paire clé-valeur
    // Retourne true si la clé est nouvelle, false si elle existe déjà
    bool isNew = inventory.Insert("Bandage", 5);    // true (nouvelle clé)
    isNew = inventory.Insert("Bandage", 10);         // false (clé existe, valeur NON mise à jour)
    // inventory["Bandage"] est toujours 5 !

    // Set : insérer OU mettre à jour (c'est ce que vous voulez habituellement)
    inventory.Set("Bandage", 10);    // Maintenant inventory["Bandage"] == 10
    inventory.Set("Morphine", 3);    // Nouvelle clé ajoutée
    inventory.Set("Morphine", 7);    // Clé existante mise à jour à 7
}
```

**Distinction critique :** `Insert()` ne met **pas** à jour les clés existantes. `Set()` le fait. En cas de doute, utilisez `Set()`.

### Accéder aux valeurs

```c
void MapAccess()
{
    map<string, int> prices = new map<string, int>;
    prices.Set("AKM", 5000);
    prices.Set("M4A1", 7500);
    prices.Set("Mosin", 2000);

    // Get : retourne la valeur, ou la valeur par défaut (0 pour int) si la clé n'est pas trouvée
    int akmPrice = prices.Get("AKM");         // 5000
    int falPrice = prices.Get("FAL");          // 0 (non trouvé, retourne la valeur par défaut)

    // Find : accès sûr, retourne true si la clé existe et définit le paramètre out
    int price;
    bool found = prices.Find("M4A1", price);  // found == true, price == 7500
    bool notFound = prices.Find("SVD", price); // notFound == false, price inchangé

    // Contains : vérifier si la clé existe (pas de récupération de valeur)
    bool hasAKM = prices.Contains("AKM");     // true
    bool hasFAL = prices.Contains("FAL");     // false

    // Count : nombre de paires clé-valeur
    int count = prices.Count();  // 3
}
```

### Suppression

```c
void MapRemove()
{
    map<string, int> data = new map<string, int>;
    data.Set("a", 1);
    data.Set("b", 2);
    data.Set("c", 3);

    // Remove : supprimer par clé
    data.Remove("b");
    // data a maintenant : {"a": 1, "c": 3}

    // Clear : supprimer toutes les entrées
    data.Clear();
    // data.Count() == 0
}
```

### Accès basé sur l'index

Les maps supportent l'accès positionnel, mais c'est en `O(n)` --- utilisez-le pour l'itération, pas pour les recherches fréquentes.

```c
void MapIndexAccess()
{
    map<string, int> data = new map<string, int>;
    data.Set("alpha", 1);
    data.Set("beta", 2);
    data.Set("gamma", 3);

    // Accès par index interne (O(n), l'ordre est l'ordre d'insertion)
    for (int i = 0; i < data.Count(); i++)
    {
        string key = data.GetKey(i);
        int value = data.GetElement(i);
        Print(string.Format("%1 = %2", key, value));
    }
}
```

### Extraire les clés et valeurs

```c
void MapExtraction()
{
    map<string, int> prices = new map<string, int>;
    prices.Set("AKM", 5000);
    prices.Set("M4A1", 7500);
    prices.Set("Mosin", 2000);

    // Obtenir toutes les clés comme un tableau
    array<string> keys = prices.GetKeyArray();
    // keys : ["AKM", "M4A1", "Mosin"]

    // Obtenir toutes les valeurs comme un tableau
    array<int> values = prices.GetValueArray();
    // values : [5000, 7500, 2000]
}
```

### Exemple du monde réel : Suivi de joueurs

```c
class PlayerTracker
{
    protected ref map<string, vector> m_LastPositions;  // UID -> position
    protected ref map<string, float> m_PlayTime;        // UID -> secondes

    void PlayerTracker()
    {
        m_LastPositions = new map<string, vector>;
        m_PlayTime = new map<string, float>;
    }

    void OnPlayerConnect(string uid)
    {
        m_PlayTime.Set(uid, 0);
    }

    void OnPlayerDisconnect(string uid)
    {
        m_LastPositions.Remove(uid);
        m_PlayTime.Remove(uid);
    }

    void UpdatePlayer(string uid, vector pos, float deltaTime)
    {
        m_LastPositions.Set(uid, pos);

        float current = 0;
        m_PlayTime.Find(uid, current);
        m_PlayTime.Set(uid, current + deltaTime);
    }

    float GetPlayTime(string uid)
    {
        float time = 0;
        m_PlayTime.Find(uid, time);
        return time;
    }
}
```

---

## Sets : `set<T>`

Les sets sont des collections ordonnées similaires aux tableaux, mais avec une sémantique orientée vers les opérations basées sur la valeur (trouver et supprimer par valeur). Ils sont moins couramment utilisés que les tableaux et les maps.

```c
void SetExamples()
{
    set<string> activeZones = new set<string>;

    // Insert : ajouter un élément
    activeZones.Insert("NWAF");
    activeZones.Insert("Tisy");
    activeZones.Insert("Balota");

    // Find : retourne l'index ou -1
    int idx = activeZones.Find("Tisy");    // 1
    int missing = activeZones.Find("Zelenogorsk");  // -1

    // Get : accès par index
    string first = activeZones.Get(0);     // "NWAF"

    // Count
    int count = activeZones.Count();       // 3

    // Remove par index
    activeZones.Remove(0);
    // activeZones : ["Tisy", "Balota"]

    // RemoveItem : supprimer par valeur
    activeZones.RemoveItem("Tisy");
    // activeZones : ["Balota"]

    // Clear
    activeZones.Clear();
}
```

### Quand utiliser Set vs Array

En pratique, la plupart des moddeurs DayZ utilisent `array<T>` pour presque tout car :
- `set<T>` a moins de méthodes que `array<T>`
- `array<T>` fournit `Find()` pour la recherche et `RemoveItem()` pour la suppression basée sur la valeur
- L'API dont vous avez besoin est typiquement déjà sur `array<T>`

Utilisez `set<T>` quand votre code représente sémantiquement un ensemble (pas d'ordre significatif, focalisé sur les tests d'appartenance), ou quand vous le rencontrez dans le code vanilla DayZ et devez interagir avec lui.

---

## Itérer les maps

Les maps supportent `foreach` pour une itération pratique :

### foreach avec clé-valeur

```c
void IterateMap()
{
    map<string, int> scores = new map<string, int>;
    scores.Set("Alice", 150);
    scores.Set("Bob", 230);
    scores.Set("Charlie", 180);

    // foreach avec clé et valeur
    foreach (string name, int score : scores)
    {
        Print(string.Format("%1: %2 points", name, score));
    }
    // Alice: 150 points
    // Bob: 230 points
    // Charlie: 180 points
}
```

---

## Collections imbriquées

Les collections peuvent contenir d'autres collections. Quand vous stockez des types référence (comme des tableaux) dans une map, utilisez `ref` pour gérer la propriété.

```c
class LootTable
{
    // Map du nom de catégorie vers la liste de noms de classes
    protected ref map<string, ref array<string>> m_Categories;

    void LootTable()
    {
        m_Categories = new map<string, ref array<string>>;

        // Créer les tableaux de catégorie
        ref array<string> medical = new array<string>;
        medical.Insert("Bandage");
        medical.Insert("Morphine");
        medical.Insert("Saline");

        ref array<string> weapons = new array<string>;
        weapons.Insert("AKM");
        weapons.Insert("M4A1");

        m_Categories.Set("medical", medical);
        m_Categories.Set("weapons", weapons);
    }

    string GetRandomFromCategory(string category)
    {
        array<string> items;
        if (!m_Categories.Find(category, items))
            return "";

        if (items.Count() == 0)
            return "";

        return items.GetRandomElement();
    }
}
```

---

## Bonnes pratiques

- Utilisez toujours `new` pour instancier les collections avant utilisation -- `array<string> items;` est `null`, pas vide.
- Préférez `map.Set()` à `map.Insert()` pour les mises à jour -- `Insert` ignore silencieusement les clés existantes.
- Quand vous supprimez des éléments pendant l'itération, utilisez une boucle `for` inversée ou construisez une liste de suppression séparée -- ne modifiez jamais une collection à l'intérieur d'un `foreach`.
- Utilisez `Reserve()` quand vous connaissez le nombre d'éléments attendu à l'avance pour éviter les réallocations internes répétées.
- Protégez chaque accès aux éléments avec `IsValidIndex()` ou une vérification `Count() > 0` -- un accès hors limites cause des crashs silencieux.

---

## Observé dans les mods réels

> Patterns confirmés par l'étude du code source de mods DayZ professionnels.

| Pattern | Mod | Détail |
|---------|-----|--------|
| Boucle `for` inversée pour la suppression | Expansion / COT | Itère toujours de `Count()-1` à `0` quand on supprime des éléments filtrés |
| `map<string, ref ClassName>` pour les registres | Dabs Framework | Tous les registres de gestionnaires utilisent `ref` dans les valeurs de map pour garder les objets vivants |
| Typedef `TStringArray` partout | Vanilla / VPP | Le parsing de config, les messages de chat et les tables de loot utilisent tous `TStringArray` au lieu de `array<string>` |
| Garde null + vide avant accès | Expansion Market | Chaque fonction recevant un tableau commence par `if (!arr \|\| arr.Count() == 0) return;` |

---

## Théorie vs Pratique

| Concept | Théorie | Réalité |
|---------|---------|---------|
| `Remove(index)` est une « suppression rapide » | Devrait juste supprimer l'élément | Il échange avec le dernier élément d'abord, réordonnant silencieusement le tableau |
| `map.Insert()` ajoute une clé | Devrait mettre à jour si la clé existe | Retourne `false` et ne fait rien si la clé est déjà présente |
| `set<T>` pour les collections uniques | Devrait se comporter comme un ensemble mathématique | La plupart des moddeurs utilisent `array<T>` avec `Find()` à la place car `set` a moins de méthodes |

---

## Erreurs courantes

### 1. `Remove` vs `RemoveOrdered` : Le bug silencieux

`Remove(index)` est rapide mais **change l'ordre** en échangeant avec le dernier élément. Si vous itérez en avant et supprimez, cela cause des éléments sautés :

```c
// MAUVAIS : saute des éléments car Remove échange l'ordre
array<int> nums = {1, 2, 3, 4, 5};
for (int i = 0; i < nums.Count(); i++)
{
    if (nums[i] % 2 == 0)
        nums.Remove(i);  // Après avoir supprimé l'index 1, l'élément à l'index 1 est maintenant "5"
                          // et on saute à l'index 2, ratant "5"
}

// BON : itérer en arrière quand on supprime
array<int> nums2 = {1, 2, 3, 4, 5};
for (int j = nums2.Count() - 1; j >= 0; j--)
{
    if (nums2[j] % 2 == 0)
        nums2.Remove(j);  // Sûr : supprimer depuis la fin n'affecte pas les indices inférieurs
}

// AUSSI BON : utiliser RemoveOrdered avec itération inversée pour préserver l'ordre
array<int> nums3 = {1, 2, 3, 4, 5};
for (int k = nums3.Count() - 1; k >= 0; k--)
{
    if (nums3[k] % 2 == 0)
        nums3.RemoveOrdered(k);
}
// nums3 : [1, 3, 5] dans l'ordre original
```

### 2. Index de tableau hors limites

Enforce Script ne lève pas d'exceptions pour l'accès hors limites --- il retourne silencieusement des données erronées ou crashe. Vérifiez toujours les limites.

```c
// MAUVAIS : pas de vérification de limites
array<string> items = {"A", "B", "C"};
string fourth = items[3];  // COMPORTEMENT INDÉFINI : l'index 3 n'existe pas

// BON : vérifier les limites
if (items.IsValidIndex(3))
{
    string fourth2 = items[3];
}

// BON : vérifier le count
if (items.Count() > 0)
{
    string last = items[items.Count() - 1];
}
```

### 3. Oublier de créer la collection

Les collections sont des objets et doivent être instanciées avec `new` :

```c
// MAUVAIS : crash de référence null
array<string> items;
items.Insert("Test");  // CRASH : items est null

// BON : créer d'abord
array<string> items2 = new array<string>;
items2.Insert("Test");

// AUSSI BON : la liste d'initialisation crée automatiquement
array<string> items3 = {"Test"};
```

### 4. `Insert` vs `Set` sur les maps

`Insert` ne met pas à jour les clés existantes --- il retourne `false` et laisse la valeur inchangée :

```c
map<string, int> data = new map<string, int>;
data.Insert("key", 100);
data.Insert("key", 200);   // Retourne false, la valeur est TOUJOURS 100 !

// Utilisez Set pour mettre à jour
data.Set("key", 200);      // Maintenant la valeur est 200
```

### 5. Modifier une collection pendant un foreach

N'ajoutez ni ne supprimez d'éléments d'une collection pendant que vous itérez dessus avec `foreach`. Construisez une liste séparée d'éléments à supprimer, puis supprimez-les après.

```c
// MAUVAIS : modification pendant l'itération
array<string> items = {"A", "B", "C", "D"};
foreach (string item : items)
{
    if (item == "B")
        items.RemoveItem(item);  // INDÉFINI : invalide l'itérateur
}

// BON : collecter puis supprimer
array<string> toRemove = new array<string>;
foreach (string item2 : items)
{
    if (item2 == "B")
        toRemove.Insert(item2);
}
foreach (string rem : toRemove)
{
    items.RemoveItem(rem);
}
```

### 6. Sécurité de tableau vide

Vérifiez toujours si un tableau est à la fois non-null et non-vide avant d'accéder aux éléments :

```c
string GetFirstItem(array<string> items)
{
    // Clause de garde : vérification null + vérification vide
    if (!items || items.Count() == 0)
        return "";

    return items[0];
}
```

---

## Exercices pratiques

### Exercice 1 : Compteur d'inventaire
Créez une fonction qui prend un `array<string>` de noms de classes d'objets (avec des doublons) et retourne un `map<string, int>` comptant combien de chaque objet existe.

### Exercice 2 : Déduplication de tableau
Écrivez une fonction `array<string> RemoveDuplicates(array<string> input)` qui retourne un nouveau tableau avec les doublons supprimés, en préservant l'ordre de première occurrence.

### Exercice 3 : Classement
Créez un `map<string, int>` de noms de joueurs vers des compteurs de kills. Écrivez des fonctions pour :
1. Ajouter un kill pour un joueur (créer l'entrée si nécessaire)
2. Obtenir les N meilleurs joueurs triés par kills
3. Supprimer tous les joueurs avec zéro kill

### Exercice 4 : Historique de positions
Créez une classe qui stocke les 10 dernières positions d'un joueur (buffer circulaire utilisant un tableau).

### Exercice 5 : Recherche bidirectionnelle
Créez une classe avec deux maps permettant la recherche dans les deux sens : étant donné un UID de joueur, trouver son nom ; étant donné un nom, trouver son UID.

---

## Résumé

| Collection | Type | Cas d'utilisation | Différence clé |
|-----------|------|-------------------|----------------|
| Tableau statique | `int arr[5]` | Taille fixe, connue à la compilation | Pas de redimensionnement, pas de méthodes |
| Tableau dynamique | `array<T>` | Liste ordonnée à usage général | API riche, redimensionnable |
| Map | `map<K,V>` | Recherche clé-valeur | `Set()` pour insérer/mettre à jour |
| Set | `set<T>` | Appartenance basée sur la valeur | Plus simple que array, moins courant |

| Opération | Méthode | Notes |
|-----------|---------|-------|
| Ajouter à la fin | `Insert(val)` | Retourne l'index |
| Ajouter à une position | `InsertAt(val, idx)` | Décale à droite |
| Suppression rapide | `Remove(idx)` | Échange avec le dernier, **non ordonné** |
| Suppression ordonnée | `RemoveOrdered(idx)` | Décale à gauche, préserve l'ordre |
| Supprimer par valeur | `RemoveItem(val)` | Trouve puis supprime (ordonné) |
| Rechercher | `Find(val)` | Retourne l'index ou -1 |
| Compter | `Count()` | Nombre d'éléments |
| Vérification de limites | `IsValidIndex(idx)` | Retourne bool |
| Trier | `Sort()` / `Sort(true)` | Croissant / décroissant |
| Aléatoire | `GetRandomElement()` | Retourne une valeur aléatoire |
| foreach | `foreach (T val : arr)` | Valeur seulement |
| foreach indexé | `foreach (int i, T val : arr)` | Index + valeur |

---

[Accueil](../README.md) | [<< Précédent : Variables & Types](01-variables-types.md) | **Tableaux, Maps & Sets** | [Suivant : Classes & Héritage >>](03-classes-inheritance.md)
