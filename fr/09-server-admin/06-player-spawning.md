# Chapter 9.6 : Apparition des joueurs

[Accueil](../README.md) | [<< Précédent : Apparition des véhicules](05-vehicle-spawning.md) | [Suivant : Persistance >>](07-persistence.md)

---

> **Résumé :** Les emplacements d'apparition des joueurs sont contrôlés par **cfgplayerspawnpoints.xml** (bulles de position) et **init.c** (équipement de départ). Ce chapitre couvre les deux fichiers avec les valeurs vanilla réelles de Chernarus.

---

## Table des matières

- [Aperçu de cfgplayerspawnpoints.xml](#aperçu-de-cfgplayerspawnpointsxml)
- [Paramètres d'apparition](#paramètres-dapparition)
- [Paramètres du générateur](#paramètres-du-générateur)
- [Paramètres de groupe](#paramètres-de-groupe)
- [Bulles d'apparition initiales](#bulles-dapparition-initiales)
- [Apparitions hop](#apparitions-hop)
- [init.c -- Équipement de départ](#initc----équipement-de-départ)
- [Ajouter des points d'apparition personnalisés](#ajouter-des-points-dapparition-personnalisés)
- [Erreurs courantes](#erreurs-courantes)

---

## Aperçu de cfgplayerspawnpoints.xml

Ce fichier se trouve dans votre dossier de mission (par ex. `dayzOffline.chernarusplus/cfgplayerspawnpoints.xml`). Il comporte deux sections, chacune avec ses propres paramètres et bulles de position :

- **`<fresh>`** -- personnages tout neufs (première vie ou après la mort)
- **`<hop>`** -- joueurs qui changent de serveur (le joueur avait un personnage sur un autre serveur)

---

## Paramètres d'apparition

Valeurs vanilla d'apparition initiale :

```xml
<spawn_params>
    <min_dist_infected>30</min_dist_infected>
    <max_dist_infected>70</max_dist_infected>
    <min_dist_player>65</min_dist_player>
    <max_dist_player>150</max_dist_player>
    <min_dist_static>0</min_dist_static>
    <max_dist_static>2</max_dist_static>
</spawn_params>
```

| Paramètre | Valeur | Signification |
|-----------|--------|---------------|
| `min_dist_infected` | 30 | Le joueur doit apparaître à au moins 30 m de l'infecté le plus proche |
| `max_dist_infected` | 70 | S'il n'existe aucune position à 30 m+, accepter jusqu'à 70 m comme plage de repli |
| `min_dist_player` | 65 | Le joueur doit apparaître à au moins 65 m de tout autre joueur |
| `max_dist_player` | 150 | Plage de repli -- accepter les positions jusqu'à 150 m des autres joueurs |
| `min_dist_static` | 0 | Distance minimum des objets statiques (bâtiments, murs) |
| `max_dist_static` | 2 | Distance maximum des objets statiques -- garde les joueurs proches des structures |

Le moteur essaie d'abord `min_dist_*` ; si aucune position valide n'existe, il relâche vers `max_dist_*`.

---

## Paramètres du générateur

Le générateur crée une grille de positions candidates autour de chaque bulle :

```xml
<generator_params>
    <grid_density>4</grid_density>
    <grid_width>200</grid_width>
    <grid_height>200</grid_height>
    <min_dist_static>0</min_dist_static>
    <max_dist_static>2</max_dist_static>
    <min_steepness>-45</min_steepness>
    <max_steepness>45</max_steepness>
</generator_params>
```

| Paramètre | Valeur | Signification |
|-----------|--------|---------------|
| `grid_density` | 4 | Espacement entre les points de grille en mètres -- plus bas = plus de candidats, coût CPU plus élevé |
| `grid_width` | 200 | La grille s'étend sur 200 m sur l'axe X autour de chaque centre de bulle |
| `grid_height` | 200 | La grille s'étend sur 200 m sur l'axe Z autour de chaque centre de bulle |
| `min_steepness` / `max_steepness` | -45 / 45 | Plage de pente du terrain en degrés -- rejette les falaises et collines escarpées |

Chaque bulle obtient une grille de 200x200 m avec un point tous les 4 m (~2 500 candidats). Le moteur filtre par pente et distance statique, puis applique les `spawn_params` au moment de l'apparition.

#### Paramètre `allow_in_water` (1.28+)

À partir de DayZ 1.28, un nouveau paramètre booléen `allow_in_water` a été ajouté à `generator_params` (défaut : `false`). Quand il est défini à `true`, le générateur de points d'apparition considère les positions dans l'eau comme des points d'apparition valides :

```xml
<generator_params>
    <grid_density>4</grid_density>
    <grid_width>200</grid_width>
    <grid_height>200</grid_height>
    <min_dist_static>0</min_dist_static>
    <max_dist_static>2</max_dist_static>
    <min_steepness>-45</min_steepness>
    <max_steepness>45</max_steepness>
    <allow_in_water>false</allow_in_water>
</generator_params>
```

Par défaut, le moteur rejette toute position candidate qui tombe dans l'eau (étangs, rivières, océan). Définir `allow_in_water` à `true` supprime ce filtre. C'est principalement utile pour les cartes personnalisées avec des apparitions sur des îles ou des scénarios où les apparitions en eau côtière sont intentionnelles. Pour la plupart des serveurs, laissez cette valeur à `false` pour éviter que les joueurs n'apparaissent dans les lacs ou l'océan.

---

## Paramètres de groupe

```xml
<group_params>
    <enablegroups>true</enablegroups>
    <groups_as_regular>true</groups_as_regular>
    <lifetime>240</lifetime>
    <counter>-1</counter>
</group_params>
```

| Paramètre | Valeur | Signification |
|-----------|--------|---------------|
| `enablegroups` | true | Les bulles de position sont organisées en groupes nommés |
| `groups_as_regular` | true | Les groupes sont traités comme des points d'apparition normaux (n'importe quel groupe peut être sélectionné) |
| `lifetime` | 240 | Secondes avant qu'un point d'apparition utilisé redevienne disponible |
| `counter` | -1 | Nombre de fois qu'un point d'apparition peut être utilisé. -1 = illimité |

Un point utilisé est verrouillé pendant 240 secondes, empêchant deux joueurs d'apparaître l'un sur l'autre.

---

## Bulles d'apparition initiales

Le Chernarus vanilla définit 11 groupes le long de la côte pour les apparitions initiales. Chaque groupe regroupe 3 à 8 positions autour d'une ville :

| Groupe | Positions | Zone |
|--------|-----------|------|
| WestCherno | 4 | Côté ouest de Chernogorsk |
| EastCherno | 4 | Côté est de Chernogorsk |
| WestElektro | 5 | Ouest d'Elektrozavodsk |
| EastElektro | 4 | Est d'Elektrozavodsk |
| Kamyshovo | 5 | Littoral de Kamyshovo |
| Solnechny | 5 | Zone industrielle de Solnechniy |
| Orlovets | 4 | Entre Solnechniy et Nizhnoye |
| Nizhnee | 4 | Côte de Nizhnoye |
| SouthBerezino | 3 | Sud de Berezino |
| NorthBerezino | 8 | Nord de Berezino + côte étendue |
| Svetlojarsk | 3 | Port de Svetlojarsk |

### Exemples réels de groupes

```xml
<generator_posbubbles>
    <group name="WestCherno">
        <pos x="6063.018555" z="1931.907227" />
        <pos x="5933.964844" z="2171.072998" />
        <pos x="6199.782715" z="2241.805176" />
        <pos x="13552.5654" z="5955.893066" />
    </group>
    <group name="WestElektro">
        <pos x="8747.670898" z="2357.187012" />
        <pos x="9363.6533" z="2017.953613" />
        <pos x="9488.868164" z="1898.900269" />
        <pos x="9675.2216" z="1817.324585" />
        <pos x="9821.274414" z="2194.003662" />
    </group>
    <group name="Kamyshovo">
        <pos x="11830.744141" z="3400.428955" />
        <pos x="11930.805664" z="3484.882324" />
        <pos x="11961.211914" z="3419.867676" />
        <pos x="12222.977539" z="3454.867188" />
        <pos x="12336.774414" z="3503.847168" />
    </group>
</generator_posbubbles>
```

Les coordonnées utilisent `x` (est-ouest) et `z` (nord-sud). L'axe Y (altitude) est calculé automatiquement à partir de la carte d'élévation du terrain.

---

## Apparitions hop

Les apparitions hop sont plus souples sur la distance joueur et utilisent des grilles plus petites :

```xml
<!-- Différences des spawn_params hop par rapport aux apparitions initiales -->
<min_dist_player>25.0</min_dist_player>   <!-- initial : 65 -->
<max_dist_player>70.0</max_dist_player>   <!-- initial : 150 -->
<min_dist_static>0.5</min_dist_static>    <!-- initial : 0 -->

<!-- Différences des generator_params hop -->
<grid_width>150</grid_width>              <!-- initial : 200 -->
<grid_height>150</grid_height>            <!-- initial : 200 -->

<!-- Différences des group_params hop -->
<enablegroups>false</enablegroups>        <!-- initial : true -->
<lifetime>360</lifetime>                  <!-- initial : 240 -->
```

Les groupes hop sont répartis **à l'intérieur des terres** : Balota (6), Cherno (5), Pusta (5), Kamyshovo (4), Solnechny (5), Nizhnee (6), Berezino (5), Olsha (4), Svetlojarsk (5), Dobroye (5). Avec `enablegroups=false`, le moteur traite les 50 positions comme un pool unique.

---

## init.c -- Équipement de départ

Le fichier **init.c** dans votre dossier de mission contrôle la création des personnages et l'équipement de départ. Deux surcharges sont importantes :

- **`CreateCharacter`** -- appelle `GetGame().CreatePlayer()`. Le moteur choisit la position depuis **cfgplayerspawnpoints.xml** avant l'exécution de cette méthode ; vous ne définissez pas la position d'apparition ici.
- **`StartingEquipSetup`** -- s'exécute après la création du personnage. Le joueur a déjà des vêtements par défaut (chemise, jean, baskets). Cette méthode ajoute les objets de départ.

### StartingEquipSetup vanilla (Chernarus)

```c
override void StartingEquipSetup(PlayerBase player, bool clothesChosen)
{
    EntityAI itemClothing;
    EntityAI itemEnt;
    float rand;

    itemClothing = player.FindAttachmentBySlotName( "Body" );
    if ( itemClothing )
    {
        SetRandomHealth( itemClothing );  // 0.45 - 0.65 santé

        itemEnt = itemClothing.GetInventory().CreateInInventory( "BandageDressing" );
        player.SetQuickBarEntityShortcut(itemEnt, 2);

        string chemlightArray[] = { "Chemlight_White", "Chemlight_Yellow", "Chemlight_Green", "Chemlight_Red" };
        int rndIndex = Math.RandomInt( 0, 4 );
        itemEnt = itemClothing.GetInventory().CreateInInventory( chemlightArray[rndIndex] );
        SetRandomHealth( itemEnt );
        player.SetQuickBarEntityShortcut(itemEnt, 1);

        rand = Math.RandomFloatInclusive( 0.0, 1.0 );
        if ( rand < 0.35 )
            itemEnt = player.GetInventory().CreateInInventory( "Apple" );
        else if ( rand > 0.65 )
            itemEnt = player.GetInventory().CreateInInventory( "Pear" );
        else
            itemEnt = player.GetInventory().CreateInInventory( "Plum" );
        player.SetQuickBarEntityShortcut(itemEnt, 3);
        SetRandomHealth( itemEnt );
    }

    itemClothing = player.FindAttachmentBySlotName( "Legs" );
    if ( itemClothing )
        SetRandomHealth( itemClothing );
}
```

Ce que cela donne à chaque joueur : **BandageDressing** (barre rapide 3), **Chemlight** aléatoire (barre rapide 2), fruit aléatoire -- 35% Apple, 30% Plum, 35% Pear (barre rapide 1). `SetRandomHealth` définit l'état à 45-65% sur tous les objets.

### Ajouter un équipement de départ personnalisé

```c
// Ajouter après le bloc de fruits, à l'intérieur de la vérification du slot Body
itemEnt = player.GetInventory().CreateInInventory( "KitchenKnife" );
SetRandomHealth( itemEnt );
```

---

## Ajouter des points d'apparition personnalisés

Pour ajouter un groupe d'apparition personnalisé, modifiez la section `<fresh>` de **cfgplayerspawnpoints.xml** :

```xml
<group name="MyCustomSpawn">
    <pos x="7500.0" z="7500.0" />
    <pos x="7550.0" z="7520.0" />
    <pos x="7480.0" z="7540.0" />
    <pos x="7520.0" z="7480.0" />
</group>
```

Étapes :

1. Ouvrez votre carte en jeu ou utilisez iZurvive pour trouver les coordonnées
2. Choisissez 3-5 positions réparties sur 100-200 m dans une zone sûre (pas de falaises, pas d'eau)
3. Ajoutez le bloc `<group>` à l'intérieur de `<generator_posbubbles>`
4. Utilisez `x` pour est-ouest et `z` pour nord-sud -- le moteur calcule Y (altitude) à partir du terrain
5. Redémarrez le serveur -- aucun wipe de persistance nécessaire

Pour un spawn équilibré, gardez au moins 4 positions par groupe afin que le verrouillage de 240 secondes ne bloque pas toutes les positions quand plusieurs joueurs meurent en même temps.

---

## Erreurs courantes

### Les joueurs apparaissent dans l'océan

Vous avez interverti `z` (nord-sud) avec Y (altitude), ou utilisé des coordonnées en dehors de la plage 0-15360. Les positions côtières ont des valeurs `z` basses (bord sud). Revérifiez avec iZurvive.

### Pas assez de points d'apparition

Avec seulement 2-3 positions, le verrouillage de 240 secondes cause du regroupement. Le vanilla utilise 49 positions initiales réparties en 11 groupes. Visez au moins 20 positions dans 4+ groupes.

### Oublier la section hop

Une section `<hop>` vide signifie que les joueurs qui changent de serveur apparaissent à `0,0,0` -- l'océan sur Chernarus. Définissez toujours des points hop, même si vous les copiez depuis `<fresh>`.

### Points d'apparition sur terrain escarpé

Le générateur rejette les pentes au-delà de 45 degrés. Si toutes les positions personnalisées sont sur des flancs de colline, aucun candidat valide n'existe. Utilisez du terrain plat près des routes.

### Les joueurs apparaissent toujours au même endroit

Les groupes avec 1-2 positions se retrouvent verrouillés par le délai de 240 secondes. Ajoutez plus de positions par groupe.

---

[Accueil](../README.md) | [<< Précédent : Apparition des véhicules](05-vehicle-spawning.md) | [Suivant : Persistance >>](07-persistence.md)
