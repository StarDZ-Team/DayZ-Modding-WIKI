# Chapitre 1.5 : Flux de contrôle

[Accueil](../README.md) | [<< Précédent : Classes Moddées](04-modded-classes.md) | **Flux de contrôle** | [Suivant : Opérations sur les chaînes >>](06-strings.md)

---

## Introduction

Le flux de contrôle détermine l'ordre dans lequel votre code s'exécute. Enforce Script fournit les constructions familières `if/else`, `for`, `while`, `foreach` et `switch` -- mais avec plusieurs différences importantes par rapport au C/C++ qui vous piégeront si vous n'êtes pas préparé. Ce chapitre couvre chaque mécanisme de flux de contrôle disponible, y compris les pièges propres au moteur de script de DayZ.

---

## if / else / else if

L'instruction `if` évalue une expression booléenne et exécute un bloc de code lorsque le résultat est `true`. Vous pouvez enchaîner les conditions avec `else if` et fournir un repli avec `else`.

```c
void CheckHealth(PlayerBase player)
{
    float health = player.GetHealth("", "Health");

    if (health > 75)
    {
        Print("Le joueur est en bonne santé");
    }
    else if (health > 25)
    {
        Print("Le joueur est blessé");
    }
    else
    {
        Print("Le joueur est dans un état critique");
    }
}
```

### Vérifications null

En Enforce Script, les références d'objets s'évaluent à `false` lorsqu'elles sont null. C'est la manière standard de se protéger contre l'accès null :

```c
void ProcessItem(EntityAI item)
{
    if (!item)
        return;

    string name = item.GetType();
    Print("Traitement : " + name);
}
```

### Opérateurs logiques

Combinez les conditions avec `&&` (ET) et `||` (OU). L'évaluation en court-circuit s'applique : si le côté gauche de `&&` est `false`, le côté droit n'est jamais évalué.

```c
void CheckPlayerState(PlayerBase player)
{
    if (player && player.IsAlive())
    {
        // Sûr -- player est vérifié pour null avant d'appeler IsAlive()
        Print("Le joueur est vivant");
    }

    if (player.GetHealth("", "Blood") < 3000 || player.GetHealth("", "Health") < 25)
    {
        Print("Le joueur est en danger");
    }
}
```

### PIÈGE : Redéclaration de variable dans les blocs else-if

C'est l'une des erreurs Enforce Script les plus courantes. Dans la plupart des langages, les variables déclarées dans une branche `if` sont indépendantes des variables dans une branche `else` sœur. **Pas en Enforce Script.** Déclarer le même nom de variable dans des blocs `if`/`else if`/`else` frères provoque une **erreur de déclaration multiple** à la compilation.

```c
// INCORRECT -- Erreur de compilation !
void BadExample(Object obj)
{
    if (obj.IsKindOf("Car"))
    {
        Car vehicle = Car.Cast(obj);
        vehicle.GetSpeedometer();
    }
    else if (obj.IsKindOf("ItemBase"))
    {
        ItemBase item = ItemBase.Cast(obj);    // OK -- nom différent
        item.GetQuantity();
    }
    else
    {
        string msg = "Objet inconnu";         // Première déclaration de msg
        Print(msg);
    }
}
```

Attendez -- ça a l'air correct, non ? Le problème survient lorsque vous utilisez le **même nom de variable** dans deux branches :

```c
// INCORRECT -- Erreur de compilation : déclaration multiple de 'result'
void ProcessObject(Object obj)
{
    if (obj.IsKindOf("Car"))
    {
        string result = "C'est une voiture";
        Print(result);
    }
    else
    {
        string result = "C'est autre chose";  // ERREUR ! Même nom que dans le bloc if
        Print(result);
    }
}
```

**La solution :** Déclarez la variable **avant** l'instruction if, ou utilisez des noms uniques par branche.

```c
// CORRECT -- Déclarer avant le if
void ProcessObject(Object obj)
{
    string result;

    if (obj.IsKindOf("Car"))
    {
        result = "C'est une voiture";
    }
    else
    {
        result = "C'est autre chose";
    }

    Print(result);
}
```

---

## Boucle for

La boucle `for` est identique à la syntaxe du style C : initialisateur, condition et incrément.

```c
// Afficher les nombres de 0 à 9
void CountToTen()
{
    for (int i = 0; i < 10; i++)
    {
        Print(i);
    }
}
```

### Itérer sur un tableau avec for

```c
void ListInventory(PlayerBase player)
{
    array<EntityAI> items = new array<EntityAI>;
    player.GetInventory().EnumerateInventory(InventoryTraversalType.PREORDER, items);

    for (int i = 0; i < items.Count(); i++)
    {
        EntityAI item = items.Get(i);
        if (item)
        {
            Print(string.Format("[%1] %2", i, item.GetType()));
        }
    }
}
```

### Boucles for imbriquées

```c
// Faire apparaître une grille d'objets
void SpawnGrid(vector origin, int rows, int cols, float spacing)
{
    for (int r = 0; r < rows; r++)
    {
        for (int c = 0; c < cols; c++)
        {
            vector pos = origin;
            pos[0] = pos[0] + (c * spacing);
            pos[2] = pos[2] + (r * spacing);
            pos[1] = GetGame().SurfaceY(pos[0], pos[2]);

            GetGame().CreateObject("Barrel_Green", pos, false, false, true);
        }
    }
}
```

> **Note :** Ne redéclarez pas la variable de boucle `i` s'il existe déjà une variable nommée `i` dans la portée englobante. Enforce Script traite cela comme une erreur de déclaration multiple, même dans des portées imbriquées.

---

## Boucle while

La boucle `while` répète un bloc tant que sa condition est `true`. La condition est évaluée **avant** chaque itération.

```c
// Supprimer tous les zombies morts d'une liste de suivi
void CleanupDeadZombies(array<DayZInfected> zombieList)
{
    int i = 0;
    while (i < zombieList.Count())
    {
        EntityAI eai;
        if (Class.CastTo(eai, zombieList.Get(i)) && !eai.IsAlive())
        {
            zombieList.RemoveOrdered(i);
            // Ne PAS incrémenter i -- l'élément suivant a glissé à cet index
        }
        else
        {
            i++;
        }
    }
}
```

### ATTENTION : Il n'y a PAS de do...while en Enforce Script

Le mot-clé `do...while` n'existe pas. Le compilateur le rejettera. Si vous avez besoin d'une boucle qui s'exécute au moins une fois, utilisez le pattern de drapeau décrit ci-dessous.

```c
// INCORRECT -- Ceci ne compilera PAS
do
{
    // corps
}
while (someCondition);
```

---

## Simuler do...while avec un drapeau

La solution standard est d'utiliser une variable `bool` qui est `true` à la première itération :

```c
void SimulateDoWhile()
{
    bool first = true;
    int attempts = 0;
    vector spawnPos;

    while (first || !IsPositionSafe(spawnPos))
    {
        first = false;
        attempts++;
        spawnPos = GetRandomPosition();

        if (attempts > 100)
            break;
    }

    Print(string.Format("Position sûre trouvée après %1 tentatives", attempts));
}
```

Une approche alternative utilisant `break` :

```c
void AlternativeDoWhile()
{
    while (true)
    {
        // Le corps s'exécute au moins une fois
        DoSomething();

        // Vérifier la condition de sortie à la FIN
        if (!ShouldContinue())
            break;
    }
}
```

---

## foreach

L'instruction `foreach` est la manière la plus propre d'itérer sur des tableaux, des maps et des tableaux statiques. Elle se présente sous deux formes.

### foreach simple (valeur uniquement)

```c
void AnnounceItems(array<string> itemNames)
{
    foreach (string name : itemNames)
    {
        Print("Objet trouvé : " + name);
    }
}
```

### foreach avec index

Lors de l'itération sur des tableaux, la première variable reçoit l'index :

```c
void ListPlayers(array<Man> players)
{
    foreach (int idx, Man player : players)
    {
        Print(string.Format("Joueur #%1 : %2", idx, player.GetIdentity().GetName()));
    }
}
```

### foreach sur les maps

Pour les maps, la première variable reçoit la clé et la seconde reçoit la valeur :

```c
void PrintScoreboard(map<string, int> scores)
{
    foreach (string playerName, int score : scores)
    {
        Print(string.Format("%1 : %2 kills", playerName, score));
    }
}
```

Vous pouvez également itérer sur les maps avec juste la valeur :

```c
void SumScores(map<string, int> scores)
{
    int total = 0;
    foreach (int score : scores)
    {
        total += score;
    }
    Print("Total des kills : " + total);
}
```

### foreach sur les tableaux statiques

```c
void PrintStaticArray()
{
    int numbers[] = {10, 20, 30, 40, 50};

    foreach (int value : numbers)
    {
        Print(value);
    }
}
```

---

## switch / case

L'instruction `switch` compare une valeur à une liste d'étiquettes `case`. Elle fonctionne avec `int`, `string`, les valeurs d'enum et les constantes.

### Important : PAS de fall-through

Contrairement au C/C++, le `switch/case` d'Enforce Script ne « tombe pas » d'un case au suivant. Chaque `case` est indépendant. Vous pouvez inclure `break` par clarté, mais il n'est pas nécessaire pour empêcher le fall-through.

```c
void HandleCommand(string command)
{
    switch (command)
    {
        case "heal":
            HealPlayer();
            break;

        case "kill":
            KillPlayer();
            break;

        case "teleport":
            TeleportPlayer();
            break;

        default:
            Print("Commande inconnue : " + command);
            break;
    }
}
```

### switch avec enums

```c
enum EDifficulty
{
    EASY = 0,
    MEDIUM,
    HARD
};

void SetDifficulty(EDifficulty difficulty)
{
    float zombieMultiplier;

    switch (difficulty)
    {
        case EDifficulty.EASY:
            zombieMultiplier = 0.5;
            break;

        case EDifficulty.MEDIUM:
            zombieMultiplier = 1.0;
            break;

        case EDifficulty.HARD:
            zombieMultiplier = 2.0;
            break;

        default:
            zombieMultiplier = 1.0;
            break;
    }

    Print(string.Format("Multiplicateur de zombies : %1", zombieMultiplier));
}
```

### switch avec constantes entières

```c
void DescribeWeaponSlot(int slotId)
{
    const int SLOT_SHOULDER = 0;
    const int SLOT_MELEE = 1;
    const int SLOT_PISTOL = 2;

    switch (slotId)
    {
        case SLOT_SHOULDER:
            Print("Arme principale");
            break;

        case SLOT_MELEE:
            Print("Arme de mêlée");
            break;

        case SLOT_PISTOL:
            Print("Arme de poing");
            break;

        default:
            Print("Emplacement inconnu");
            break;
    }
}
```

> **Rappel :** Comme il n'y a pas de fall-through, vous ne pouvez pas empiler les cases pour partager un gestionnaire comme vous le feriez en C. Chaque case doit avoir son propre corps.

---

## break et continue

### break

`break` quitte la boucle (ou le case du switch) la plus interne immédiatement.

```c
// Trouver le premier joueur à moins de 100 mètres
void FindNearbyPlayer(vector origin, array<Man> players)
{
    foreach (Man player : players)
    {
        float dist = vector.Distance(origin, player.GetPosition());
        if (dist < 100)
        {
            Print("Joueur proche trouvé : " + player.GetIdentity().GetName());
            break; // Arrêter la recherche
        }
    }
}
```

### continue

`continue` saute le reste de l'itération courante et passe à la suivante.

```c
// Traiter uniquement les joueurs vivants
void HealAllPlayers(array<Man> players)
{
    foreach (Man man : players)
    {
        PlayerBase player;
        if (!Class.CastTo(player, man))
            continue; // Pas un PlayerBase, passer

        if (!player.IsAlive())
            continue; // Mort, passer

        player.SetHealth("", "Health", 100);
        Print("Soigné : " + player.GetIdentity().GetName());
    }
}
```

### Boucles imbriquées avec break

`break` ne quitte que la boucle la plus interne. Pour sortir de boucles imbriquées, utilisez une variable drapeau :

```c
void FindItemInGrid(array<array<string>> grid, string target)
{
    bool found = false;

    for (int row = 0; row < grid.Count(); row++)
    {
        for (int col = 0; col < grid.Get(row).Count(); col++)
        {
            if (grid.Get(row).Get(col) == target)
            {
                Print(string.Format("'%1' trouvé à [%2, %3]", target, row, col));
                found = true;
                break; // Ne quitte que la boucle interne
            }
        }

        if (found)
            break; // Quitte la boucle externe
    }
}
```

---

## Mot-clé thread

Enforce Script possède un mot-clé `thread` pour l'exécution asynchrone :

```c
// Déclarer une fonction threadée
thread void LongOperation()
{
    // Ceci s'exécute de manière asynchrone
    Sleep(5000);  // Attendre 5 secondes sans bloquer
    Print("Terminé !");
}

// L'appeler
thread LongOperation();  // Démarre sans bloquer l'appelant
```

**Important :** `thread` en Enforce Script n'est PAS la même chose que les threads du système d'exploitation. C'est plutôt comme une coroutine --- elle s'exécute sur le même thread mais peut céder/dormir sans bloquer le jeu. Utilisez `CallLater` plutôt que `thread` pour la plupart des cas d'utilisation des mods --- c'est plus simple et plus prévisible.

### Thread vs CallLater

| Fonctionnalité | `thread` | `CallLater` |
|----------------|----------|-------------|
| Syntaxe | `thread MyFunc();` | `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.MyFunc, delayMs, repeat);` |
| Peut dormir/céder | Oui (`Sleep()`) | Non (se déclenche une fois ou se répète à intervalle) |
| Annulable | Pas d'annulation intégrée | Oui (`CallQueue.Remove()`) |
| Cas d'utilisation | Logique asynchrone séquentielle avec attentes | Callbacks différés ou répétés |

Pour la plupart des scénarios de modding DayZ, `CallLater` avec un timer est l'approche préférée. Réservez `thread` aux cas où vous avez genuinement besoin d'une logique séquentielle avec des attentes intermédiaires (par exemple, une séquence d'animation multi-étapes).

---

## Bonnes pratiques

- Utilisez des clauses de garde (`if (!x) return;`) en haut des fonctions au lieu de blocs `if` profondément imbriqués -- cela garde le chemin normal plat et lisible.
- Déclarez les variables partagées avant les blocs `if`/`else` pour éviter l'erreur de redéclaration de portée sœur propre à Enforce Script.
- Utilisez `foreach` pour l'itération simple et `for` avec index uniquement lorsque vous devez supprimer des éléments ou accéder aux voisins.
- Remplacez `do...while` par `while (first || condition)` en utilisant un drapeau `bool first = true` -- c'est la solution standard d'Enforce Script.
- Préférez `CallLater` à `thread` pour les actions différées ou répétées -- c'est annulable, plus simple et plus prévisible.

---

## Observé dans les vrais mods

> Patterns confirmés par l'étude du code source de mods DayZ professionnels.

| Pattern | Mod | Détail |
|---------|-----|--------|
| Clause de garde + `continue` dans les boucles | COT / Expansion | Les boucles sur les joueurs font toujours `continue` sur un cast échoué ou `!IsAlive()` avant de travailler |
| `switch` sur des commandes string | VPP Admin | Les gestionnaires de commandes chat utilisent `switch(command)` avec des cases string comme `"!heal"`, `"!tp"` |
| Variable drapeau pour sortir des boucles imbriquées | Expansion Market | Utilise `bool found = false` avec vérification après la boucle interne pour sortir de la boucle externe |
| `CallLater` pour le spawn différé | Dabs Framework | Préfère `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater()` à `thread` |

---

## Théorie vs pratique

| Concept | Théorie | Réalité |
|---------|---------|---------|
| Boucle `do...while` | Standard dans la plupart des langages de type C | N'existe pas en Enforce Script ; provoque une erreur de compilation confuse |
| Fall-through du `switch` | En C/C++ les cases tombent sans `break` | Les cases d'Enforce Script sont indépendants -- empiler les cases ne partage pas les gestionnaires |
| Mot-clé `thread` | Ressemble au multithreading | En réalité une coroutine sur le thread principal ; `Sleep()` cède, ne bloque pas |
| Portée des variables dans `if`/`else` | Les blocs frères devraient avoir une portée indépendante | Enforce Script les traite comme une portée partagée -- le même nom de variable dans les deux blocs est une erreur de compilation |

---

## Erreurs courantes

| Erreur | Problème | Solution |
|--------|----------|----------|
| Utiliser `do...while` | N'existe pas en Enforce Script | Utilisez `while` avec un drapeau `bool first = true` |
| Déclarer la même variable dans les blocs `if` et `else` | Erreur de déclaration multiple | Déclarez la variable avant le `if` |
| Redéclarer la variable de boucle `i` dans une portée imbriquée | Erreur de déclaration multiple | Utilisez des noms différents (`i`, `j`, `k`) ou déclarez à l'extérieur |
| S'attendre au fall-through du `switch` | Les cases sont indépendants, pas de fall-through | Chaque case a besoin de son propre gestionnaire complet |
| Modifier un tableau pendant l'itération avec `foreach` | Comportement indéfini, crash potentiel | Utilisez une boucle `for` basée sur l'index lors de la suppression d'éléments |
| Boucle `while` infinie sans `break` | Gel du serveur / blocage du client | Assurez-vous toujours que la condition deviendra `false`, ou utilisez `break` |

---

## Référence rapide

```c
// if / else if / else
if (condition) { } else if (other) { } else { }

// boucle for
for (int i = 0; i < count; i++) { }

// boucle while
while (condition) { }

// Simuler do...while
bool first = true;
while (first || condition) { first = false; /* corps */ }

// foreach (valeur uniquement)
foreach (Type value : collection) { }

// foreach (index + valeur)
foreach (int i, Type value : array) { }

// foreach (clé + valeur sur map)
foreach (KeyType key, ValueType val : someMap) { }

// switch/case (pas de fall-through)
switch (value) { case X: /* ... */ break; default: break; }

// thread (asynchrone style coroutine)
thread void MyFunc() { Sleep(1000); }
thread MyFunc();  // appel non-bloquant
```

---

[<< 1.4 : Classes Moddées](04-modded-classes.md) | [Accueil](../README.md) | [1.6 : Opérations sur les chaînes >>](06-strings.md)
