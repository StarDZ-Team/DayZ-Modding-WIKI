# Chapitre 7.7 : Optimisation des performances

[Accueil](../README.md) | [<< Précédent : Architecture événementielle](06-events.md) | **Optimisation des performances**

---

## Introduction

DayZ tourne à 10--60 FPS serveur selon le nombre de joueurs, la charge d'entités et la complexité des mods. Chaque cycle de script qui prend trop de temps empiète sur ce budget de frame. Un seul `OnUpdate` mal écrit qui scanne chaque véhicule sur la carte ou reconstruit une liste d'interface à partir de zéro peut faire chuter les performances du serveur de façon notable. Les mods professionnels gagnent leur réputation en tournant vite --- pas en ayant plus de fonctionnalités, mais en implémentant les mêmes fonctionnalités avec moins de gaspillage.

Ce chapitre couvre les patrons d'optimisation éprouvés au combat utilisés par COT, VPP, Expansion et le Dabs Framework. Ce ne sont pas des optimisations prématurées --- ce sont des pratiques d'ingénierie standard que chaque moddeur DayZ devrait connaître dès le départ.

---

## Table des matières

- [Chargement paresseux et traitement par lots](#chargement-paresseux-et-traitement-par-lots)
- [Pooling de widgets](#pooling-de-widgets)
- [Debouncing de recherche](#debouncing-de-recherche)
- [Limitation du taux de mise à jour](#limitation-du-taux-de-mise-à-jour)
- [Mise en cache](#mise-en-cache)
- [Patron de registre de véhicules](#patron-de-registre-de-véhicules)
- [Choix de l'algorithme de tri](#choix-de-lalgorithme-de-tri)
- [Choses à éviter](#choses-à-éviter)
- [Profilage](#profilage)
- [Checklist](#checklist)

---

## Chargement paresseux et traitement par lots

L'optimisation la plus impactante dans le modding DayZ est de **ne pas faire le travail tant qu'il n'est pas nécessaire** et de **répartir le travail sur plusieurs frames** quand il doit être fait.

### Chargement paresseux

Ne pré-calculez ou pré-chargez jamais des données que l'utilisateur pourrait ne pas avoir besoin :

```c
class ItemDatabase
{
    protected ref map<string, ref ItemData> m_Cache;
    protected bool m_Loaded;

    // MAUVAIS : Tout charger au démarrage
    void OnInit()
    {
        LoadAllItems();  // 5000 objets, 200ms de blocage au démarrage
    }

    // BON : Charger au premier accès
    ItemData GetItem(string className)
    {
        if (!m_Loaded)
        {
            LoadAllItems();
            m_Loaded = true;
        }

        ItemData data;
        m_Cache.Find(className, data);
        return data;
    }
};
```

### Traitement par lots (N éléments par frame)

Quand vous devez traiter une grande collection, traitez un lot fixe par frame au lieu de la collection entière d'un coup :

```c
class LootCleanup : MyServerModule
{
    protected ref array<Object> m_DirtyItems;
    protected int m_ProcessIndex;

    static const int BATCH_SIZE = 50;  // Traiter 50 éléments par frame

    override void OnUpdate(float dt)
    {
        if (!m_DirtyItems || m_DirtyItems.Count() == 0) return;

        int processed = 0;
        while (m_ProcessIndex < m_DirtyItems.Count() && processed < BATCH_SIZE)
        {
            Object item = m_DirtyItems[m_ProcessIndex];
            if (item)
            {
                ProcessItem(item);
            }
            m_ProcessIndex++;
            processed++;
        }

        // Réinitialiser une fois terminé
        if (m_ProcessIndex >= m_DirtyItems.Count())
        {
            m_DirtyItems.Clear();
            m_ProcessIndex = 0;
        }
    }

    void ProcessItem(Object item) { ... }
};
```

### Pourquoi 50 ?

La taille du lot dépend du coût de traitement de chaque élément. Pour les opérations légères (vérifications null, lectures de position), 100--200 par frame conviennent. Pour les opérations lourdes (apparition d'entités, requêtes de pathfinding, E/S fichier), 5--10 par frame peuvent être la limite. Commencez avec 50 et ajustez en fonction de l'impact observé sur le temps de frame.

---

## Pooling de widgets

Créer et détruire des widgets d'interface est coûteux. Le moteur doit allouer de la mémoire, construire l'arbre de widgets, appliquer les styles et calculer la disposition. Si vous avez une liste défilable avec 500 entrées, créer 500 widgets, les détruire et en créer 500 nouveaux à chaque rafraîchissement de la liste est un drop de frame garanti.

### Le problème

```c
// MAUVAIS : Détruire et recréer à chaque rafraîchissement
void RefreshPlayerList(array<string> players)
{
    // Détruire tous les widgets existants
    Widget child = m_ListPanel.GetChildren();
    while (child)
    {
        Widget next = child.GetSibling();
        child.Unlink();  // Détruire
        child = next;
    }

    // Créer de nouveaux widgets pour chaque joueur
    for (int i = 0; i < players.Count(); i++)
    {
        Widget row = GetGame().GetWorkspace().CreateWidgets("MyMod/layouts/PlayerRow.layout", m_ListPanel);
        TextWidget nameText = TextWidget.Cast(row.FindAnyWidget("NameText"));
        nameText.SetText(players[i]);
    }
}
```

### Le patron de pool

Pré-créez un pool de lignes de widgets. Au rafraîchissement, réutilisez les lignes existantes. Affichez les lignes qui ont des données ; masquez celles qui n'en ont pas.

```c
class WidgetPool
{
    protected ref array<Widget> m_Pool;
    protected Widget m_Parent;
    protected string m_LayoutPath;
    protected int m_ActiveCount;

    void WidgetPool(Widget parent, string layoutPath, int initialSize)
    {
        m_Parent = parent;
        m_LayoutPath = layoutPath;
        m_Pool = new array<Widget>();
        m_ActiveCount = 0;

        // Pré-créer le pool
        for (int i = 0; i < initialSize; i++)
        {
            Widget w = GetGame().GetWorkspace().CreateWidgets(m_LayoutPath, m_Parent);
            w.Show(false);
            m_Pool.Insert(w);
        }
    }

    // Obtenir un widget du pool, en créer de nouveaux si nécessaire
    Widget Acquire()
    {
        if (m_ActiveCount < m_Pool.Count())
        {
            Widget w = m_Pool[m_ActiveCount];
            w.Show(true);
            m_ActiveCount++;
            return w;
        }

        // Pool épuisé — l'agrandir
        Widget newWidget = GetGame().GetWorkspace().CreateWidgets(m_LayoutPath, m_Parent);
        m_Pool.Insert(newWidget);
        m_ActiveCount++;
        return newWidget;
    }

    // Masquer tous les widgets actifs (mais ne pas les détruire)
    void ReleaseAll()
    {
        for (int i = 0; i < m_ActiveCount; i++)
        {
            m_Pool[i].Show(false);
        }
        m_ActiveCount = 0;
    }

    // Détruire le pool entier (appeler au nettoyage)
    void Destroy()
    {
        for (int i = 0; i < m_Pool.Count(); i++)
        {
            if (m_Pool[i]) m_Pool[i].Unlink();
        }
        m_Pool.Clear();
        m_ActiveCount = 0;
    }
};
```

### Utilisation

```c
void RefreshPlayerList(array<string> players)
{
    m_WidgetPool.ReleaseAll();  // Masquer tous — pas de destruction

    for (int i = 0; i < players.Count(); i++)
    {
        Widget row = m_WidgetPool.Acquire();  // Réutiliser ou créer
        TextWidget nameText = TextWidget.Cast(row.FindAnyWidget("NameText"));
        nameText.SetText(players[i]);
    }
}
```

Le premier appel à `RefreshPlayerList` crée les widgets. Chaque appel suivant les réutilise. Pas de destruction, pas de re-création, pas de drop de frame.

---

## Debouncing de recherche

Quand un utilisateur tape dans une zone de recherche, l'événement `OnChange` se déclenche à chaque frappe. Reconstruire une liste filtrée à chaque frappe est du gaspillage --- l'utilisateur est encore en train de taper. Retardez plutôt la recherche jusqu'à ce que l'utilisateur fasse une pause.

### Le patron debounce

```c
class SearchableList
{
    protected const float DEBOUNCE_DELAY = 0.15;  // 150ms
    protected float m_SearchTimer;
    protected bool m_SearchPending;
    protected string m_PendingQuery;

    // Appelé à chaque frappe
    void OnSearchTextChanged(string text)
    {
        m_PendingQuery = text;
        m_SearchPending = true;
        m_SearchTimer = 0;  // Réinitialiser le timer à chaque frappe
    }

    // Appelé chaque frame depuis OnUpdate
    void Tick(float dt)
    {
        if (!m_SearchPending) return;

        m_SearchTimer += dt;
        if (m_SearchTimer >= DEBOUNCE_DELAY)
        {
            m_SearchPending = false;
            ExecuteSearch(m_PendingQuery);
        }
    }

    void ExecuteSearch(string query)
    {
        // Maintenant faire le filtrage réel
        // Ceci s'exécute une fois après que l'utilisateur arrête de taper, pas à chaque frappe
    }
};
```

### Pourquoi 150ms ?

150ms est un bon défaut. C'est assez long pour que la plupart des frappes pendant la saisie continue soient regroupées en une seule recherche, mais assez court pour que l'interface semble réactive. Ajustez si votre recherche est particulièrement coûteuse (délai plus long) ou si vos utilisateurs attendent un retour instantané (délai plus court).

---

## Limitation du taux de mise à jour

Tout n'a pas besoin de s'exécuter à chaque frame. De nombreux systèmes peuvent se mettre à jour à une fréquence inférieure sans aucun impact notable.

### Throttling basé sur le temps

```c
class EntityScanner : MyServerModule
{
    protected const float SCAN_INTERVAL = 5.0;  // Toutes les 5 secondes
    protected float m_ScanTimer;

    override void OnUpdate(float dt)
    {
        m_ScanTimer += dt;
        if (m_ScanTimer < SCAN_INTERVAL) return;
        m_ScanTimer = 0;

        // Le scan coûteux s'exécute toutes les 5 secondes, pas chaque frame
        ScanEntities();
    }
};
```

### Throttling par nombre de frames

Pour les opérations qui doivent s'exécuter toutes les N frames :

```c
class PositionSync
{
    protected int m_FrameCounter;
    protected const int SYNC_EVERY_N_FRAMES = 10;  // Chaque 10e frame

    void OnUpdate(float dt)
    {
        m_FrameCounter++;
        if (m_FrameCounter % SYNC_EVERY_N_FRAMES != 0) return;

        SyncPositions();
    }
};
```

### Traitement décalé

Quand plusieurs systèmes ont besoin de mises à jour périodiques, décalez leurs timers pour qu'ils ne se déclenchent pas tous sur la même frame :

```c
// MAUVAIS : Les trois se déclenchent à t=5.0, t=10.0, t=15.0 — pic de frame
m_LootTimer   = 5.0;
m_VehicleTimer = 5.0;
m_WeatherTimer = 5.0;

// BON : Décalé — le travail est distribué
m_LootTimer    = 5.0;
m_VehicleTimer = 5.0 + 1.6;  // Se déclenche ~1.6s après le butin
m_WeatherTimer = 5.0 + 3.3;  // Se déclenche ~3.3s après le butin
```

Ou démarrez les timers avec des offsets différents :

```c
m_LootTimer    = 0;
m_VehicleTimer = 1.6;
m_WeatherTimer = 3.3;
```

---

## Mise en cache

Les recherches répétées des mêmes données sont un drain de performance courant. Mettez les résultats en cache.

### Cache de scan CfgVehicles

Scanner `CfgVehicles` (la base de données de config globale de toutes les classes d'objets/véhicules) est coûteux. Cela implique d'itérer des milliers d'entrées de config. Ne le faites jamais plus d'une fois :

```c
class WeaponRegistry
{
    private static ref array<string> s_AllWeapons;

    // Construire une fois, utiliser indéfiniment
    static array<string> GetAllWeapons()
    {
        if (s_AllWeapons) return s_AllWeapons;

        s_AllWeapons = new array<string>();

        int cfgCount = GetGame().ConfigGetChildrenCount("CfgVehicles");
        string className;
        for (int i = 0; i < cfgCount; i++)
        {
            GetGame().ConfigGetChildName("CfgVehicles", i, className);
            if (GetGame().IsKindOf(className, "Weapon_Base"))
            {
                s_AllWeapons.Insert(className);
            }
        }

        return s_AllWeapons;
    }

    static void Cleanup()
    {
        s_AllWeapons = null;
    }
};
```

### Cache d'opérations sur les chaînes

Si vous calculez la même transformation de chaîne de façon répétée (ex: passage en minuscules pour une recherche insensible à la casse), mettez le résultat en cache :

```c
class ItemEntry
{
    string DisplayName;
    string SearchName;  // Minuscules pré-calculées pour la correspondance de recherche

    void ItemEntry(string displayName)
    {
        DisplayName = displayName;
        SearchName = displayName;
        SearchName.ToLower();  // Calculer une fois
    }
};
```

### Cache de position

Si vous vérifiez fréquemment "le joueur est-il près de X ?", mettez en cache la position du joueur et mettez-la à jour périodiquement plutôt que d'appeler `GetPosition()` à chaque vérification :

```c
class ProximityChecker
{
    protected vector m_CachedPosition;
    protected float m_PositionAge;

    vector GetCachedPosition(EntityAI entity, float dt)
    {
        m_PositionAge += dt;
        if (m_PositionAge > 1.0)  // Rafraîchir chaque seconde
        {
            m_CachedPosition = entity.GetPosition();
            m_PositionAge = 0;
        }
        return m_CachedPosition;
    }
};
```

---

## Patron de registre de véhicules

Un besoin courant est de suivre tous les véhicules (ou toutes les entités d'un type spécifique) sur la carte. L'approche naïve est d'appeler `GetGame().GetObjectsAtPosition3D()` avec un rayon énorme. C'est catastrophiquement coûteux.

### Mauvais : Scan du monde

```c
// TERRIBLE : Scanne chaque objet dans un rayon de 50km à chaque frame
void FindAllVehicles()
{
    array<Object> objects = new array<Object>();
    GetGame().GetObjectsAtPosition3D(Vector(7500, 0, 7500), 50000, objects);

    foreach (Object obj : objects)
    {
        CarScript car = CarScript.Cast(obj);
        if (car) { ... }
    }
}
```

### Bon : Registre basé sur l'enregistrement

Suivez les entités à leur création et destruction :

```c
class VehicleRegistry
{
    private static ref array<CarScript> s_Vehicles = new array<CarScript>();

    static void Register(CarScript vehicle)
    {
        if (vehicle && s_Vehicles.Find(vehicle) == -1)
        {
            s_Vehicles.Insert(vehicle);
        }
    }

    static void Unregister(CarScript vehicle)
    {
        int idx = s_Vehicles.Find(vehicle);
        if (idx >= 0) s_Vehicles.Remove(idx);
    }

    static array<CarScript> GetAll()
    {
        return s_Vehicles;
    }

    static void Cleanup()
    {
        s_Vehicles.Clear();
    }
};

// Accrocher à la construction/destruction des véhicules :
modded class CarScript
{
    override void EEInit()
    {
        super.EEInit();
        if (GetGame().IsServer())
        {
            VehicleRegistry.Register(this);
        }
    }

    override void EEDelete(EntityAI parent)
    {
        if (GetGame().IsServer())
        {
            VehicleRegistry.Unregister(this);
        }
        super.EEDelete(parent);
    }
};
```

Maintenant `VehicleRegistry.GetAll()` retourne tous les véhicules instantanément --- pas de scan du monde nécessaire.

### Patron de liste chaînée d'Expansion

Expansion va plus loin avec une liste doublement chaînée sur la classe d'entité elle-même, évitant le coût des opérations sur les tableaux :

```c
// Patron Expansion (conceptuel) :
class ExpansionVehicle
{
    ExpansionVehicle m_Next;
    ExpansionVehicle m_Prev;

    static ExpansionVehicle s_Head;

    void Register()
    {
        m_Next = s_Head;
        if (s_Head) s_Head.m_Prev = this;
        s_Head = this;
    }

    void Unregister()
    {
        if (m_Prev) m_Prev.m_Next = m_Next;
        if (m_Next) m_Next.m_Prev = m_Prev;
        if (s_Head == this) s_Head = m_Next;
        m_Next = null;
        m_Prev = null;
    }
};
```

Cela donne une insertion et un retrait O(1) avec zéro allocation mémoire par opération. L'itération est un simple parcours de pointeurs depuis `s_Head`.

---

## Choix de l'algorithme de tri

Les tableaux Enforce Script ont une méthode `.Sort()` intégrée, mais elle ne fonctionne que pour les types basiques et utilise la comparaison par défaut. Pour des ordres de tri personnalisés, vous avez besoin d'une fonction de comparaison.

### Tri intégré

```c
array<int> numbers = {5, 2, 8, 1, 9, 3};
numbers.Sort();  // {1, 2, 3, 5, 8, 9}

array<string> names = {"Charlie", "Alice", "Bob"};
names.Sort();  // {"Alice", "Bob", "Charlie"} — lexicographique
```

### Tri personnalisé avec comparaison

Pour trier des tableaux d'objets par un champ spécifique, implémentez votre propre tri. Le tri par insertion est bon pour les petits tableaux (moins de ~100 éléments) ; pour les tableaux plus grands, le quicksort est plus performant.

```c
// Tri par insertion simple — bon pour les petits tableaux
void SortPlayersByScore(array<ref PlayerData> players)
{
    for (int i = 1; i < players.Count(); i++)
    {
        ref PlayerData key = players[i];
        int j = i - 1;

        while (j >= 0 && players[j].Score < key.Score)
        {
            players[j + 1] = players[j];
            j--;
        }
        players[j + 1] = key;
    }
}
```

### Éviter de trier par frame

Si une liste triée est affichée dans l'interface, triez-la une fois quand les données changent, pas à chaque frame :

```c
// MAUVAIS : Trier chaque frame
void OnUpdate(float dt)
{
    SortPlayersByScore(m_Players);
    RefreshUI();
}

// BON : Trier uniquement quand les données changent
void OnPlayerScoreChanged()
{
    SortPlayersByScore(m_Players);
    RefreshUI();
}
```

---

## Choses à éviter

### 1. `GetObjectsAtPosition3D` avec un rayon énorme

Cela scanne chaque objet physique dans le monde dans le rayon donné. À `50000` mètres (la carte entière), il itère chaque arbre, rocher, bâtiment, objet, zombie et joueur. Un seul appel peut prendre 50ms+.

```c
// NE JAMAIS FAIRE CECI
GetGame().GetObjectsAtPosition3D(Vector(7500, 0, 7500), 50000, results);
```

Utilisez un registre basé sur l'enregistrement à la place (voir [Patron de registre de véhicules](#patron-de-registre-de-véhicules)).

### 2. Reconstruction complète de liste à chaque frappe

```c
// MAUVAIS : Reconstruire 5000 lignes de widgets à chaque frappe
void OnSearchChanged(string text)
{
    DestroyAllRows();
    foreach (ItemData item : m_AllItems)
    {
        if (item.Name.Contains(text))
        {
            CreateWidgetRow(item);
        }
    }
}
```

Utilisez le [debouncing de recherche](#debouncing-de-recherche) et le [pooling de widgets](#pooling-de-widgets) à la place.

### 3. Allocations de chaînes par frame

La concaténation de chaînes crée de nouveaux objets chaîne. Dans une fonction par frame, cela génère des déchets à chaque frame :

```c
// MAUVAIS : Deux nouvelles allocations de chaîne par frame par entité
void OnUpdate(float dt)
{
    for (int i = 0; i < m_Entities.Count(); i++)
    {
        string label = "Entity_" + i.ToString();  // Nouvelle chaîne chaque frame
        string info = label + " at " + m_Entities[i].GetPosition().ToString();  // Encore une nouvelle chaîne
    }
}
```

Si vous avez besoin de chaînes formatées pour la journalisation ou l'interface, faites-le au changement d'état, pas par frame.

### 4. Vérifications FileExist redondantes dans les boucles

```c
// MAUVAIS : Vérifier FileExist pour le même chemin 500 fois
for (int i = 0; i < m_Players.Count(); i++)
{
    if (FileExist("$profile:MyMod/Config.json"))  // Même fichier, 500 vérifications
    {
        // ...
    }
}

// BON : Vérifier une fois
bool configExists = FileExist("$profile:MyMod/Config.json");
for (int i = 0; i < m_Players.Count(); i++)
{
    if (configExists)
    {
        // ...
    }
}
```

### 5. Appeler GetGame() de façon répétée

`GetGame()` est un appel de fonction global. Dans les boucles serrées, mettez le résultat en cache :

```c
// Acceptable pour un usage occasionnel
if (GetGame().IsServer()) { ... }

// Dans une boucle serrée, le mettre en cache :
CGame game = GetGame();
for (int i = 0; i < 1000; i++)
{
    if (game.IsServer()) { ... }
}
```

### 6. Faire apparaître des entités dans une boucle serrée

L'apparition d'entités est coûteuse (configuration physique, réplication réseau, etc.). Ne faites jamais apparaître des dizaines d'entités dans une seule frame :

```c
// MAUVAIS : 100 apparitions d'entités en une frame — pic de frame massif
for (int i = 0; i < 100; i++)
{
    GetGame().CreateObjectEx("Zombie", randomPos, ECE_PLACE_ON_SURFACE);
}
```

Utilisez le traitement par lots : faites apparaître 5 par frame sur 20 frames.

---

## Profilage

### Surveillance du FPS serveur

La métrique la plus basique est le FPS serveur. Si votre mod fait chuter le FPS serveur, quelque chose ne va pas :

```c
// Dans votre OnUpdate, mesurez le temps écoulé :
void OnUpdate(float dt)
{
    float startTime = GetGame().GetTickTime();

    // ... votre logique ...

    float elapsed = GetGame().GetTickTime() - startTime;
    if (elapsed > 0.005)  // Plus de 5ms
    {
        MyLog.Warning("Perf", "OnUpdate took " + elapsed.ToString() + "s");
    }
}
```

### Indicateurs dans le log de script

Surveillez le log de script du serveur DayZ pour ces avertissements de performance :

- `SCRIPT (W): Exceeded X ms` --- une exécution de script a dépassé le budget de temps du moteur
- De longues pauses dans les horodatages du log --- quelque chose a bloqué le thread principal

### Tests empiriques

La seule façon fiable de savoir si une optimisation est importante est de mesurer avant et après :

1. Ajouter des mesures de temps autour du code suspect
2. Exécuter un test reproductible (ex: 50 joueurs, 1000 entités)
3. Comparer les temps de frame
4. Si le changement est inférieur à 1ms par frame, il n'a probablement pas d'importance

---

## Checklist

Avant de livrer du code sensible aux performances, vérifiez :

- [ ] Pas d'appels `GetObjectsAtPosition3D` avec un rayon > 100m dans le code par frame
- [ ] Tous les scans coûteux (CfgVehicles, recherches d'entités) sont mis en cache
- [ ] Les listes d'interface utilisent le pooling de widgets, pas détruire/recréer
- [ ] Les entrées de recherche utilisent le debouncing (150ms+)
- [ ] Les opérations OnUpdate sont limitées par timer ou taille de lot
- [ ] Les grandes collections sont traitées par lots (50 éléments/frame par défaut)
- [ ] L'apparition d'entités est répartie sur les frames, pas faite dans une boucle serrée
- [ ] La concaténation de chaînes n'est pas faite par frame dans les boucles serrées
- [ ] Les opérations de tri s'exécutent au changement de données, pas par frame
- [ ] Les systèmes périodiques multiples ont des timers décalés
- [ ] Le suivi d'entités utilise l'enregistrement, pas le scan du monde

---

## Compatibilité et impact

- **Multi-Mod :** Les coûts de performance sont cumulatifs. Le `OnUpdate` de chaque mod s'exécute chaque frame. Cinq mods prenant chacun 2ms signifient 10ms par frame rien que pour les scripts. Coordonnez avec les autres auteurs de mods pour décaler les timers et éviter les scans du monde en double.
- **Ordre de chargement :** L'ordre de chargement n'affecte pas directement les performances. Cependant, si plusieurs mods font `modded class` sur la même entité (ex: `CarScript.EEInit`), chaque override ajoute au coût de la chaîne d'appels. Gardez les overrides moddés minimaux.
- **Serveur d'écoute :** Les serveurs d'écoute exécutent les scripts client et serveur dans le même processus. Le pooling de widgets, les mises à jour d'interface et les coûts de rendu s'ajoutent aux ticks côté serveur. Les budgets de performance sont plus serrés sur les serveurs d'écoute que sur les serveurs dédiés.
- **Performance :** Le budget de frame du serveur DayZ à 60 FPS est ~16ms. À 20 FPS (courant sur les serveurs chargés), c'est ~50ms. Un seul mod devrait viser à rester sous 2ms par frame. Profilez avec `GetGame().GetTickTime()` pour vérifier.
- **Migration :** Les patrons de performance sont agnostiques au moteur et survivent aux mises à jour de version DayZ. Les coûts d'API spécifiques (ex: `GetObjectsAtPosition3D`) peuvent changer entre les versions du moteur, donc re-profilez après les mises à jour majeures de DayZ.

---

## Erreurs courantes

| Erreur | Impact | Correction |
|---------|--------|-----|
| Optimisation prématurée (micro-optimiser du code qui ne s'exécute qu'une fois au démarrage) | Temps de développement gaspillé ; aucune amélioration mesurable ; code plus difficile à lire | Profiler d'abord. N'optimiser que le code qui s'exécute par frame ou traite de grandes collections. Le coût de démarrage est payé une seule fois. |
| Utiliser `GetObjectsAtPosition3D` avec un rayon couvrant toute la carte dans `OnUpdate` | Blocage de 50--200ms par appel, scannant chaque objet physique sur la carte ; le FPS serveur tombe à un chiffre | Utiliser un registre basé sur l'enregistrement (enregistrer dans `EEInit`, désenregistrer dans `EEDelete`). Ne jamais scanner le monde par frame. |
| Reconstruire les arbres de widgets d'interface à chaque changement de données | Pics de frame à cause de la création/destruction de widgets ; saccade visible pour le joueur | Utiliser le pooling de widgets : masquer/afficher les widgets existants au lieu de les détruire et recréer |
| Trier de grands tableaux à chaque frame | O(n log n) par frame pour des données qui changent rarement ; gaspillage CPU inutile | Trier une fois quand les données changent (drapeau dirty), mettre en cache le résultat trié, re-trier uniquement en cas de mutation |
| Exécuter des E/S fichier coûteuses (JsonSaveFile) à chaque tick `OnUpdate` | Les écritures sur disque bloquent le thread principal ; 5--20ms par sauvegarde selon la taille du fichier | Utiliser des timers d'auto-sauvegarde (300s par défaut) avec un drapeau dirty. N'écrire que quand les données ont réellement changé. |

---

## Théorie vs pratique

| Le manuel dit | La réalité DayZ |
|---------------|-------------|
| Utiliser le traitement asynchrone pour les opérations coûteuses | Enforce Script est mono-thread sans primitives async ; répartir le travail sur les frames en utilisant un traitement basé sur l'index |
| Le pooling d'objets est une optimisation prématurée | La création de widgets est véritablement coûteuse dans Enfusion ; le pooling est une pratique standard dans chaque mod majeur (COT, VPP, Expansion) |
| Profiler avant d'optimiser | Correct, mais certains patrons (scans du monde, allocation de chaînes par frame, reconstructions par frappe) sont *toujours* faux dans DayZ. Évitez-les dès le départ. |

---

[Accueil](../README.md) | [<< Précédent : Architecture événementielle](06-events.md) | **Optimisation des performances**
