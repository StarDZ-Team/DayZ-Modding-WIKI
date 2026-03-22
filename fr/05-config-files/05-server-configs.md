# Chapitre 5.5 : Fichiers de configuration serveur

[Accueil](../README.md) | [<< Précédent : Format ImageSet](04-imagesets.md) | **Fichiers de configuration serveur** | [Suivant : Configuration de l'équipement d'apparition >>](06-spawning-gear.md)

---

> **Résumé :** Les serveurs DayZ sont configurés via des fichiers XML, JSON et de script dans le dossier de mission (ex. `mpmissions/dayzOffline.chernarusplus/`). Ces fichiers contrôlent les apparitions d'objets, le comportement de l'économie, les règles de gameplay et l'identité du serveur. Les comprendre est essentiel pour ajouter des objets personnalisés à l'économie de loot, ajuster les paramètres du serveur ou construire une mission personnalisée.

---

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [init.c --- Point d'entrée de la mission](#initc----point-dentrée-de-la-mission)
- [types.xml --- Définitions d'apparition des objets](#typesxml----définitions-dapparition-des-objets)
- [cfgspawnabletypes.xml --- Accessoires et cargaison](#cfgspawnabletypesxml----accessoires-et-cargaison)
- [cfgrandompresets.xml --- Pools de loot réutilisables](#cfgrandompresetsxml----pools-de-loot-réutilisables)
- [globals.xml --- Paramètres de l'économie](#globalsxml----paramètres-de-léconomie)
- [cfggameplay.json --- Paramètres de gameplay](#cfggameplayjson----paramètres-de-gameplay)
- [serverDZ.cfg --- Paramètres du serveur](#serverdzcfg----paramètres-du-serveur)
- [Comment les mods interagissent avec l'économie](#comment-les-mods-interagissent-avec-léconomie)
- [Erreurs courantes](#erreurs-courantes)

---

## Vue d'ensemble

Chaque serveur DayZ charge sa configuration depuis un **dossier de mission**. Les fichiers de l'Économie Centrale (CE) définissent quels objets apparaissent, où et pour combien de temps. L'exécutable du serveur lui-même est configuré via `serverDZ.cfg`, qui se trouve à côté de l'exécutable.

| Fichier | Objectif |
|---------|----------|
| `init.c` | Point d'entrée de la mission --- init du Hive, date/heure, équipement d'apparition |
| `db/types.xml` | Définitions d'apparition des objets : quantités, durées de vie, emplacements |
| `cfgspawnabletypes.xml` | Objets pré-attachés et cargaison sur les entités apparues |
| `cfgrandompresets.xml` | Pools d'objets réutilisables pour cfgspawnabletypes |
| `db/globals.xml` | Paramètres globaux de l'économie : comptages maximum, minuteries de nettoyage |
| `cfggameplay.json` | Ajustement du gameplay : endurance, construction de base, interface |
| `cfgeconomycore.xml` | Enregistrement des classes racines et journalisation CE |
| `cfglimitsdefinition.xml` | Définitions valides de catégorie, usage et valeur |
| `serverDZ.cfg` | Nom du serveur, mot de passe, max joueurs, chargement des mods |

---

## init.c --- Point d'entrée de la mission

Le script `init.c` est la première chose que le serveur exécute. Il initialise l'Économie Centrale et crée l'instance de mission.

```c
void main()
{
    Hive ce = CreateHive();
    if (ce)
        ce.InitOffline();

    GetGame().GetWorld().SetDate(2024, 9, 15, 12, 0);
    CreateCustomMission("dayzOffline.chernarusplus");
}

class CustomMission: MissionServer
{
    override PlayerBase CreateCharacter(PlayerIdentity identity, vector pos,
                                        ParamsReadContext ctx, string characterName)
    {
        Entity playerEnt;
        playerEnt = GetGame().CreatePlayer(identity, characterName, pos, 0, "NONE");
        Class.CastTo(m_player, playerEnt);
        GetGame().SelectPlayer(identity, m_player);
        return m_player;
    }

    override void StartingEquipSetup(PlayerBase player, bool clothesChosen)
    {
        EntityAI itemClothing = player.FindAttachmentBySlotName("Body");
        if (itemClothing)
        {
            itemClothing.GetInventory().CreateInInventory("BandageDressing");
        }
    }
}

Mission CreateCustomMission(string path)
{
    return new CustomMission();
}
```

Le `Hive` gère la base de données CE. Sans `CreateHive()`, aucun objet n'apparaît et la persistance est désactivée. `CreateCharacter` crée l'entité joueur à l'apparition, et `StartingEquipSetup` définit les objets qu'un personnage nouvellement créé reçoit. D'autres surcharges utiles de `MissionServer` incluent `OnInit()`, `OnUpdate()`, `InvokeOnConnect()` et `InvokeOnDisconnect()`.

---

## types.xml --- Définitions d'apparition des objets

Situé dans `db/types.xml`, ce fichier est le cœur de la CE. Chaque objet pouvant apparaître doit avoir une entrée ici.

### Entrée complète

```xml
<type name="AK74">
    <nominal>6</nominal>
    <lifetime>28800</lifetime>
    <restock>0</restock>
    <min>4</min>
    <quantmin>30</quantmin>
    <quantmax>80</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1"
           count_in_player="0" crafted="0" deloot="0"/>
    <category name="weapons"/>
    <usage name="Military"/>
    <value name="Tier3"/>
    <value name="Tier4"/>
</type>
```

### Référence des champs

| Champ | Description |
|-------|-------------|
| `nominal` | Nombre cible sur la carte. La CE fait apparaître des objets jusqu'à atteindre ce nombre |
| `min` | Nombre minimum avant que la CE ne déclenche le réapprovisionnement |
| `lifetime` | Secondes pendant lesquelles un objet persiste au sol avant de disparaître |
| `restock` | Secondes minimum entre les tentatives de réapprovisionnement (0 = immédiat) |
| `quantmin/quantmax` | Pourcentage de remplissage pour les objets avec quantité (chargeurs, bouteilles). Utilisez `-1` pour les objets sans quantité |
| `cost` | Poids de priorité CE (plus haut = prioritaire). La plupart des objets utilisent `100` |

### Drapeaux

| Drapeau | Objectif |
|---------|----------|
| `count_in_cargo` | Compter les objets dans les conteneurs vers le nominal |
| `count_in_hoarder` | Compter les objets dans les caches/tentes/barils vers le nominal |
| `count_in_map` | Compter les objets au sol vers le nominal |
| `count_in_player` | Compter les objets dans l'inventaire des joueurs vers le nominal |
| `crafted` | Objet fabriqué uniquement, pas d'apparition naturelle |
| `deloot` | Loot d'Événement Dynamique (crashs d'hélicoptères, etc.) |

### Étiquettes de catégorie, usage et valeur

Ces étiquettes contrôlent **où** les objets apparaissent :

- **`category`** --- Type d'objet. Vanilla : `tools`, `containers`, `clothes`, `food`, `weapons`, `books`, `explosives`, `lootdispatch`.
- **`usage`** --- Types de bâtiments. Vanilla : `Military`, `Police`, `Medic`, `Firefighter`, `Industrial`, `Farm`, `Coast`, `Town`, `Village`, `Hunting`, `Office`, `School`, `Prison`, `ContaminatedArea`, `Historical`.
- **`value`** --- Zones de tier de la carte. Vanilla : `Tier1` (côte), `Tier2` (intérieur des terres), `Tier3` (militaire), `Tier4` (militaire avancé), `Unique`.

Plusieurs étiquettes peuvent être combinées. Pas d'étiquettes `usage` = l'objet n'apparaîtra pas. Pas d'étiquettes `value` = apparaît dans tous les tiers.

### Désactiver un objet

Définissez `nominal=0` et `min=0`. L'objet n'apparaît jamais mais peut encore exister via des scripts ou la fabrication.

---

## cfgspawnabletypes.xml --- Accessoires et cargaison

Contrôle ce qui apparaît **déjà attaché à ou à l'intérieur** d'autres objets.

### Marquage accumulateur

Les conteneurs de stockage sont étiquetés pour que la CE sache qu'ils contiennent des objets de joueurs :

```xml
<type name="SeaChest">
    <hoarder />
</type>
```

### Dommages à l'apparition

```xml
<type name="NVGoggles">
    <damage min="0.0" max="0.32" />
</type>
```

Les valeurs vont de `0.0` (impeccable) à `1.0` (ruiné).

### Accessoires

```xml
<type name="PlateCarrierVest_Camo">
    <damage min="0.1" max="0.6" />
    <attachments chance="0.85">
        <item name="PlateCarrierHolster_Camo" chance="1.00" />
    </attachments>
    <attachments chance="0.85">
        <item name="PlateCarrierPouches_Camo" chance="1.00" />
    </attachments>
</type>
```

La `chance` externe détermine si le groupe d'accessoires est évalué. La `chance` interne sélectionne l'objet spécifique lorsque plusieurs objets sont listés dans un groupe.

### Pré-réglages de cargaison

```xml
<type name="AssaultBag_Ttsko">
    <cargo preset="mixArmy" />
    <cargo preset="mixArmy" />
    <cargo preset="mixArmy" />
</type>
```

Chaque ligne lance le pré-réglage indépendamment --- trois lignes signifient trois chances séparées.

---

## cfgrandompresets.xml --- Pools de loot réutilisables

Définit des pools d'objets nommés référencés par `cfgspawnabletypes.xml` :

```xml
<randompresets>
    <cargo chance="0.16" name="foodVillage">
        <item name="SodaCan_Cola" chance="0.02" />
        <item name="TunaCan" chance="0.05" />
        <item name="PeachesCan" chance="0.05" />
        <item name="BakedBeansCan" chance="0.05" />
        <item name="Crackers" chance="0.05" />
    </cargo>

    <cargo chance="0.15" name="toolsHermit">
        <item name="WeaponCleaningKit" chance="0.10" />
        <item name="Matchbox" chance="0.15" />
        <item name="Hatchet" chance="0.07" />
    </cargo>
</randompresets>
```

La `chance` du pré-réglage est la probabilité globale que quelque chose apparaisse. Si le tirage réussit, un objet est sélectionné dans le pool en fonction des chances individuelles des objets. Pour ajouter des objets moddés, créez un nouveau bloc `cargo` et référencez-le dans `cfgspawnabletypes.xml`.

---

## globals.xml --- Paramètres de l'économie

Situé dans `db/globals.xml`, ce fichier définit les paramètres globaux de la CE :

```xml
<variables>
    <var name="AnimalMaxCount" type="0" value="200"/>
    <var name="ZombieMaxCount" type="0" value="1000"/>
    <var name="CleanupLifetimeDeadPlayer" type="0" value="3600"/>
    <var name="CleanupLifetimeDeadAnimal" type="0" value="1200"/>
    <var name="CleanupLifetimeDeadInfected" type="0" value="330"/>
    <var name="CleanupLifetimeRuined" type="0" value="330"/>
    <var name="FlagRefreshFrequency" type="0" value="432000"/>
    <var name="FlagRefreshMaxDuration" type="0" value="3456000"/>
    <var name="FoodDecay" type="0" value="1"/>
    <var name="InitialSpawn" type="0" value="100"/>
    <var name="LootDamageMin" type="1" value="0.0"/>
    <var name="LootDamageMax" type="1" value="0.82"/>
    <var name="SpawnInitial" type="0" value="1200"/>
    <var name="TimeLogin" type="0" value="15"/>
    <var name="TimeLogout" type="0" value="15"/>
    <var name="TimePenalty" type="0" value="20"/>
    <var name="TimeHopping" type="0" value="60"/>
    <var name="ZoneSpawnDist" type="0" value="300"/>
</variables>
```

### Variables clés

| Variable | Défaut | Description |
|----------|--------|-------------|
| `AnimalMaxCount` | 200 | Maximum d'animaux sur la carte |
| `ZombieMaxCount` | 1000 | Maximum d'infectés sur la carte |
| `CleanupLifetimeDeadPlayer` | 3600 | Délai de suppression des corps (secondes) |
| `CleanupLifetimeRuined` | 330 | Délai de suppression des objets ruinés |
| `FlagRefreshFrequency` | 432000 | Intervalle de rafraîchissement du drapeau de territoire (5 jours) |
| `FlagRefreshMaxDuration` | 3456000 | Durée de vie maximale du drapeau (40 jours) |
| `FoodDecay` | 1 | Activation de la détérioration de la nourriture (0=désactivé, 1=activé) |
| `InitialSpawn` | 100 | Pourcentage du nominal apparu au démarrage |
| `LootDamageMax` | 0.82 | Dommages maximum sur le loot apparu |
| `TimeLogin` / `TimeLogout` | 15 | Minuterie de connexion/déconnexion (anti-combat-log) |
| `TimePenalty` | 20 | Minuterie de pénalité de combat-log |
| `ZoneSpawnDist` | 300 | Distance du joueur déclenchant l'apparition de zombies/animaux |

L'attribut `type` est `0` pour entier, `1` pour flottant. Utiliser le mauvais type tronque la valeur.

---

## cfggameplay.json --- Paramètres de gameplay

Chargé uniquement lorsque `enableCfgGameplayFile = 1` dans `serverDZ.cfg`. Sans cela, le moteur utilise les valeurs par défaut codées en dur.

### Structure

```json
{
    "version": 123,
    "GeneralData": {
        "disableBaseDamage": false,
        "disableContainerDamage": false,
        "disableRespawnDialog": false
    },
    "PlayerData": {
        "disablePersonalLight": false,
        "StaminaData": {
            "sprintStaminaModifierErc": 1.0,
            "staminaMax": 100.0,
            "staminaWeightLimitThreshold": 6000.0,
            "staminaMinCap": 5.0
        },
        "MovementData": {
            "timeToSprint": 0.45,
            "rotationSpeedSprint": 0.15,
            "allowStaminaAffectInertia": true
        }
    },
    "WorldsData": {
        "lightingConfig": 0,
        "environmentMinTemps": [-3, -2, 0, 4, 9, 14, 18, 17, 13, 11, 9, 0],
        "environmentMaxTemps": [3, 5, 7, 14, 19, 24, 26, 25, 18, 14, 10, 5]
    },
    "BaseBuildingData": {
        "HologramData": {
            "disableIsCollidingBBoxCheck": false,
            "disableIsCollidingAngleCheck": false,
            "disableHeightPlacementCheck": false,
            "disallowedTypesInUnderground": ["FenceKit", "TerritoryFlagKit"]
        }
    },
    "MapData": {
        "ignoreMapOwnership": false,
        "displayPlayerPosition": false,
        "displayNavInfo": true
    }
}
```

Paramètres clés : `disableBaseDamage` empêche les dommages aux bases, `disablePersonalLight` supprime la lumière du nouveau survivant, `staminaWeightLimitThreshold` est en grammes (6000 = 6kg), les tableaux de température ont 12 valeurs (janvier--décembre), `lightingConfig` accepte `0` (par défaut) ou `1` (nuits plus sombres), et `displayPlayerPosition` affiche le point du joueur sur la carte.

---

## serverDZ.cfg --- Paramètres du serveur

Ce fichier se trouve à côté de l'exécutable du serveur, pas dans le dossier de mission.

### Paramètres clés

```
hostname = "My DayZ Server";
password = "";
passwordAdmin = "adminpass123";
maxPlayers = 60;
verifySignatures = 2;
forceSameBuild = 1;
template = "dayzOffline.chernarusplus";
enableCfgGameplayFile = 1;
storeHouseStateDisabled = false;
storageAutoFix = 1;
```

| Paramètre | Description |
|-----------|-------------|
| `hostname` | Nom du serveur dans le navigateur |
| `password` | Mot de passe de connexion (vide = ouvert) |
| `passwordAdmin` | Mot de passe admin RCON |
| `maxPlayers` | Maximum de joueurs simultanés |
| `template` | Nom du dossier de mission |
| `verifySignatures` | Niveau de vérification des signatures (2 = strict) |
| `enableCfgGameplayFile` | Charger cfggameplay.json (0/1) |

### Chargement des mods

Les mods sont spécifiés via les paramètres de lancement, pas dans le fichier de configuration :

```
DayZServer_x64.exe -config=serverDZ.cfg -mod=@CF;@MyMod -servermod=@MyServerMod -port=2302
```

Les mods `-mod=` doivent être installés par les clients. Les mods `-servermod=` fonctionnent uniquement côté serveur.

---

## Comment les mods interagissent avec l'économie

### cfgeconomycore.xml --- Enregistrement des classes racines

Chaque hiérarchie de classes d'objets doit remonter à une classe racine enregistrée :

```xml
<economycore>
    <classes>
        <rootclass name="DefaultWeapon" />
        <rootclass name="DefaultMagazine" />
        <rootclass name="Inventory_Base" />
        <rootclass name="SurvivorBase" act="character" reportMemoryLOD="no" />
        <rootclass name="DZ_LightAI" act="character" reportMemoryLOD="no" />
        <rootclass name="CarScript" act="car" reportMemoryLOD="no" />
    </classes>
</economycore>
```

Si votre mod introduit une nouvelle classe de base qui n'hérite pas de `Inventory_Base`, `DefaultWeapon` ou `DefaultMagazine`, ajoutez-la comme `rootclass`. L'attribut `act` spécifie le type d'entité : `character` pour l'IA, `car` pour les véhicules.

### cfglimitsdefinition.xml --- Étiquettes personnalisées

Toute `category`, `usage` ou `value` utilisée dans `types.xml` doit être définie ici :

```xml
<lists>
    <categories>
        <category name="mymod_special"/>
    </categories>
    <usageflags>
        <usage name="MyModDungeon"/>
    </usageflags>
    <valueflags>
        <value name="MyModEndgame"/>
    </valueflags>
</lists>
```

Utilisez `cfglimitsdefinitionuser.xml` pour les ajouts qui ne devraient pas écraser le fichier vanilla.

### economy.xml --- Contrôle des sous-systèmes

Contrôle quels sous-systèmes CE sont actifs :

```xml
<economy>
    <dynamic init="1" load="1" respawn="1" save="1"/>
    <animals init="1" load="0" respawn="1" save="0"/>
    <zombies init="1" load="0" respawn="1" save="0"/>
    <vehicles init="1" load="1" respawn="1" save="1"/>
</economy>
```

Drapeaux : `init` (apparition au démarrage), `load` (charger la persistance), `respawn` (réapparaître après nettoyage), `save` (persister dans la base de données).

### Interaction côté script avec l'économie

Les objets créés via `CreateInInventory()` sont automatiquement gérés par la CE. Pour les apparitions dans le monde, utilisez les drapeaux ECE :

```c
EntityAI item = GetGame().CreateObjectEx("AK74", position, ECE_PLACE_ON_SURFACE);
```

---

## Erreurs courantes

### Erreurs de syntaxe XML

Une seule balise non fermée casse le fichier entier. Validez toujours le XML avant le déploiement.

### Étiquettes manquantes dans cfglimitsdefinition.xml

Utiliser un `usage` ou `value` dans types.xml qui n'est pas défini dans cfglimitsdefinition.xml fait que l'objet échoue silencieusement à apparaître. Vérifiez les logs RPT pour les avertissements.

### Nominal trop élevé

Le nominal total à travers tous les objets devrait rester en dessous de 10 000--15 000. Des valeurs excessives dégradent les performances du serveur.

### Durée de vie trop courte

Les objets avec des durées de vie très courtes disparaissent avant que les joueurs ne les trouvent. Utilisez au moins `3600` (1 heure) pour les objets courants, `28800` (8 heures) pour les armes.

### Classe racine manquante

Les objets dont la hiérarchie de classes ne remonte pas à une classe racine enregistrée dans `cfgeconomycore.xml` n'apparaîtront jamais, même avec des entrées types.xml correctes.

### cfggameplay.json non activé

Le fichier est ignoré sauf si `enableCfgGameplayFile = 1` est défini dans `serverDZ.cfg`.

### Mauvais type dans globals.xml

Utiliser `type="0"` (entier) pour une valeur flottante comme `0.82` la tronque à `0`. Utilisez `type="1"` pour les flottants.

### Modification directe des fichiers vanilla

Modifier le types.xml vanilla fonctionne mais casse lors des mises à jour du jeu. Préférez livrer des fichiers de types séparés et les enregistrer via cfgeconomycore, ou utilisez `cfglimitsdefinitionuser.xml` pour les étiquettes personnalisées.

---

## Bonnes pratiques

- Livrez un dossier `ServerFiles/` avec votre mod contenant des entrées `types.xml` pré-configurées pour que les administrateurs serveur puissent copier-coller plutôt qu'écrire à partir de zéro.
- Utilisez `cfglimitsdefinitionuser.xml` au lieu de modifier le `cfglimitsdefinition.xml` vanilla --- vos ajouts survivent aux mises à jour du jeu.
- Définissez `count_in_hoarder="0"` pour les objets courants (nourriture, munitions) afin d'empêcher l'accumulation de bloquer les réapparitions CE.
- Définissez toujours `enableCfgGameplayFile = 1` dans `serverDZ.cfg` avant d'attendre que les changements de `cfggameplay.json` prennent effet.
- Gardez le `nominal` total à travers toutes les entrées types.xml en dessous de 12 000 pour éviter la dégradation des performances CE sur les serveurs peuplés.

---

## Théorie vs pratique

| Concept | Théorie | Réalité |
|---------|---------|---------|
| `nominal` est un objectif strict | La CE fait apparaître exactement ce nombre d'objets | La CE approche le nominal au fil du temps mais fluctue en fonction de l'interaction des joueurs, des cycles de nettoyage et de la distance aux zones |
| `restock=0` signifie réapparition instantanée | Les objets réapparaissent immédiatement après disparition | La CE traite le réapprovisionnement par lots en cycles (typiquement toutes les 30-60 secondes), il y a donc toujours un délai quelle que soit la valeur de restock |
| `cfggameplay.json` contrôle tout le gameplay | Tout l'ajustement se fait ici | De nombreuses valeurs de gameplay sont codées en dur dans les scripts ou config.cpp et ne peuvent pas être surchargées par cfggameplay.json |
| `init.c` ne s'exécute qu'au démarrage du serveur | Initialisation unique | `init.c` s'exécute à chaque chargement de mission, y compris après les redémarrages du serveur. L'état persistant est géré par le Hive, pas par init.c |
| Plusieurs fichiers types.xml fusionnent proprement | La CE lit tous les fichiers enregistrés | Les fichiers doivent être enregistrés dans cfgeconomycore.xml via des directives `<ce folder="custom">`. Simplement placer des fichiers XML supplémentaires dans `db/` ne fait rien |

---

## Compatibilité et impact

- **Multi-Mod :** Plusieurs mods peuvent ajouter des entrées à types.xml sans conflit tant que les noms de classes sont uniques. Si deux mods définissent le même nom de classe avec des valeurs nominal/lifetime différentes, la dernière entrée chargée l'emporte.
- **Performance :** Des comptages nominaux excessifs (15 000+) causent des pics de tick CE visibles sous forme de baisses de FPS serveur. Chaque cycle CE itère tous les types enregistrés pour vérifier les conditions d'apparition.
