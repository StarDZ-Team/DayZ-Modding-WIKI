# Chapitre 8.10 : Créer un mod de véhicule personnalisé

[Accueil](../README.md) | [<< Précédent : Modèle de mod professionnel](09-professional-template.md) | **Créer un véhicule personnalisé** | [Suivant : Créer des vêtements personnalisés >>](11-clothing-mod.md)

---

> **Résumé :** Ce tutoriel vous guide à travers la création d'une variante de véhicule personnalisé dans DayZ en étendant un véhicule vanilla existant. Vous définirez le véhicule dans config.cpp, personnaliserez ses statistiques et textures, écrirez le comportement scriptique pour les portes et le moteur, l'ajouterez à la table d'apparition du serveur avec des pièces pré-attachées, et le testerez en jeu. À la fin, vous aurez un Offroad Hatchback personnalisé entièrement conduisible avec des performances et une apparence modifiées.

---

## Table des matières

- [Ce que nous construisons](#ce-que-nous-construisons)
- [Prérequis](#prérequis)
- [Étape 1 : Créer la configuration (config.cpp)](#étape-1--créer-la-configuration-configcpp)
- [Étape 2 : Textures personnalisées](#étape-2--textures-personnalisées)
- [Étape 3 : Comportement scriptique (CarScript)](#étape-3--comportement-scriptique-carscript)
- [Étape 4 : Entrée types.xml](#étape-4--entrée-typesxml)
- [Étape 5 : Compiler et tester](#étape-5--compiler-et-tester)
- [Étape 6 : Finitions](#étape-6--finitions)
- [Référence complète du code](#référence-complète-du-code)
- [Bonnes pratiques](#bonnes-pratiques)
- [Théorie vs pratique](#théorie-vs-pratique)
- [Ce que vous avez appris](#ce-que-vous-avez-appris)
- [Erreurs courantes](#erreurs-courantes)

---

## Ce que nous construisons

Nous allons créer un véhicule appelé **MFM Rally Hatchback** -- une version modifiée du Offroad Hatchback vanilla (la Niva) avec :

- Des panneaux de carrosserie retexturés à l'aide de sélections cachées
- Des performances moteur modifiées (vitesse de pointe plus élevée, consommation de carburant accrue)
- Des valeurs de santé des zones de dégâts ajustées (moteur plus résistant, portes plus fragiles)
- Tous les comportements standards du véhicule : ouverture des portes, démarrage/arrêt du moteur, carburant, phares, entrée/sortie de l'équipage
- Une entrée dans la table d'apparition avec des roues et pièces pré-attachées

Nous étendons `OffroadHatchback` plutôt que de construire un véhicule de zéro. C'est le workflow standard pour les mods de véhicules car il hérite du modèle, des animations, de la géométrie physique et de tous les comportements existants. Vous ne surchargez que ce que vous voulez modifier.

---

## Prérequis

- Une structure de mod fonctionnelle (complétez d'abord le [Chapitre 8.1](01-first-mod.md) et le [Chapitre 8.2](02-custom-item.md))
- Un éditeur de texte
- DayZ Tools installé (pour la conversion de textures, optionnel)
- Une familiarité de base avec le fonctionnement de l'héritage de classes dans config.cpp

Votre mod devrait avoir cette structure de départ :

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp
    Data/
        config.cpp
```

---

## Étape 1 : Créer la configuration (config.cpp)

Les définitions de véhicules se trouvent dans `CfgVehicles`, tout comme les objets. Malgré le nom de la classe, `CfgVehicles` contient tout -- objets, bâtiments et véhicules réels. La différence clé pour les véhicules est la classe parente et la configuration additionnelle pour les zones de dégâts, les attachements et les paramètres de simulation.

### Mettre à jour votre Data config.cpp

Ouvrez `MyFirstMod/Data/config.cpp` et ajoutez la classe du véhicule. Si vous avez déjà des définitions d'objets ici depuis le Chapitre 8.2, ajoutez la classe du véhicule dans le bloc `CfgVehicles` existant.

```cpp
class CfgPatches
{
    class MyFirstMod_Vehicles
    {
        units[] = { "MFM_RallyHatchback" };
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Vehicles_Wheeled"
        };
    };
};

class CfgVehicles
{
    class OffroadHatchback;

    class MFM_RallyHatchback : OffroadHatchback
    {
        scope = 2;
        displayName = "Rally Hatchback";
        descriptionShort = "A modified offroad hatchback built for speed.";

        // --- Sélections cachées pour le retexturage ---
        hiddenSelections[] =
        {
            "camoGround",
            "camoMale",
            "driverDoors",
            "coDriverDoors",
            "intHood",
            "intTrunk"
        };
        hiddenSelectionsTextures[] =
        {
            "MyFirstMod\Data\Textures\rally_body_co.paa",
            "MyFirstMod\Data\Textures\rally_body_co.paa",
            "",
            "",
            "",
            ""
        };

        // --- Simulation (physique et moteur) ---
        class SimulationModule : SimulationModule
        {
            // Type de transmission : 0 = propulsion, 1 = traction, 2 = intégrale
            drive = 2;

            class Throttle
            {
                reactionTime = 0.75;
                defaultThrust = 0.85;
                gentleThrust = 0.65;
                turboCoef = 4.0;
                gentleCoef = 0.5;
            };

            class Engine
            {
                inertia = 0.15;
                torqueMax = 160;
                torqueRpm = 4200;
                powerMax = 95;
                powerRpm = 5600;
                rpmIdle = 850;
                rpmMin = 900;
                rpmClutch = 1400;
                rpmRedline = 6500;
                rpmMax = 7500;
            };

            class Gearbox
            {
                reverse = 3.526;
                ratios[] = { 3.667, 2.1, 1.361, 1.0 };
                transmissionRatio = 3.857;
            };

            braking[] = { 0.0, 0.1, 0.8, 0.9, 0.95, 1.0 };
        };

        // --- Zones de dégâts ---
        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 1000;
                    healthLevels[] =
                    {
                        { 1.0, {} },
                        { 0.7, {} },
                        { 0.5, {} },
                        { 0.3, {} },
                        { 0.0, {} }
                    };
                };
            };

            class DamageZones
            {
                class Chassis
                {
                    class Health
                    {
                        hitpoints = 3000;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_chassis" };
                    inventorySlots[] = {};
                };

                class Engine
                {
                    class Health
                    {
                        hitpoints = 1200;
                        transferToGlobalCoef = 1;
                    };
                    fatalInjuryCoef = 0.001;
                    componentNames[] = { "yourcar_engine" };
                    inventorySlots[] = {};
                };

                class FuelTank
                {
                    class Health
                    {
                        hitpoints = 600;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_fueltank" };
                    inventorySlots[] = {};
                };

                class Front
                {
                    class Health
                    {
                        hitpoints = 1500;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_front" };
                    inventorySlots[] = { "NivaHood" };
                };

                class Rear
                {
                    class Health
                    {
                        hitpoints = 1500;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_rear" };
                    inventorySlots[] = { "NivaTrunk" };
                };

                class Body
                {
                    class Health
                    {
                        hitpoints = 2000;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_body" };
                    inventorySlots[] = {};
                };

                class WindowFront
                {
                    class Health
                    {
                        hitpoints = 150;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_windowfront" };
                    inventorySlots[] = {};
                };

                class WindowLR
                {
                    class Health
                    {
                        hitpoints = 150;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_windowLR" };
                    inventorySlots[] = {};
                };

                class WindowRR
                {
                    class Health
                    {
                        hitpoints = 150;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_windowRR" };
                    inventorySlots[] = {};
                };

                class Door_1_1
                {
                    class Health
                    {
                        hitpoints = 500;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_door_1_1" };
                    inventorySlots[] = { "NivaDriverDoors" };
                };

                class Door_2_1
                {
                    class Health
                    {
                        hitpoints = 500;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_door_2_1" };
                    inventorySlots[] = { "NivaCoDriverDoors" };
                };
            };
        };
    };
};
```

### Explication des champs clés

| Champ | Objectif |
|-------|----------|
| `scope = 2` | Rend le véhicule apparitionnable. Utilisez `0` pour les classes de base qui ne doivent jamais apparaître directement. |
| `displayName` | Nom affiché dans les outils d'administration et en jeu. Vous pouvez utiliser des références `$STR_` pour la localisation. |
| `requiredAddons[]` | Doit inclure `"DZ_Vehicles_Wheeled"` pour que la classe parente `OffroadHatchback` soit chargée avant votre classe. |
| `hiddenSelections[]` | Emplacements de texture sur le modèle que vous souhaitez surcharger. Doivent correspondre aux sélections nommées du modèle. |
| `SimulationModule` | Configuration de la physique et du moteur. Contrôle la vitesse, le couple, les rapports de boîte et le freinage. |
| `DamageSystem` | Définit les réserves de santé pour chaque partie du véhicule (moteur, portes, vitres, carrosserie). |

### À propos de la classe parente

```cpp
class OffroadHatchback;
```

Cette déclaration anticipée indique au parseur de configuration que `OffroadHatchback` existe dans le DayZ vanilla. Votre véhicule en hérite ensuite, obtenant le modèle Niva complet, les animations, la géométrie physique, les points d'attachement et les définitions de proxies. Vous n'avez qu'à surcharger ce que vous voulez modifier.

Autres classes parentes de véhicules vanilla que vous pourriez étendre :

| Classe parente | Véhicule |
|---------------|----------|
| `OffroadHatchback` | Niva (hatchback 4 places) |
| `CivilianSedan` | Olga (berline 4 places) |
| `Hatchback_02` | Golf/Gunter (hatchback 4 places) |
| `Sedan_02` | Sarka 120 (berline 4 places) |
| `Offroad_02` | Humvee (tout-terrain 4 places) |
| `Truck_01_Base` | V3S (camion) |

### À propos du SimulationModule

Le `SimulationModule` contrôle le comportement routier du véhicule. Paramètres clés :

| Paramètre | Effet |
|-----------|-------|
| `drive` | `0` = propulsion arrière, `1` = traction avant, `2` = transmission intégrale |
| `torqueMax` | Couple moteur maximal en Nm. Plus élevé = plus d'accélération. La Niva vanilla est ~114. |
| `powerMax` | Puissance maximale en chevaux. Plus élevé = vitesse de pointe plus rapide. La Niva vanilla est ~68. |
| `rpmRedline` | Régime de zone rouge. Au-delà, le moteur bute sur le limiteur de régime. |
| `ratios[]` | Rapports de boîte. Des nombres plus bas = rapports plus longs = vitesse de pointe plus élevée mais accélération plus lente. |
| `transmissionRatio` | Rapport de pont. Agit comme un multiplicateur sur tous les rapports. |

### À propos des zones de dégâts

Chaque zone de dégâts possède sa propre réserve de santé. Quand la santé d'une zone atteint zéro, ce composant est détruit :

| Zone | Effet une fois détruite |
|------|------------------------|
| `Engine` | Le véhicule ne peut plus démarrer |
| `FuelTank` | Le carburant fuit |
| `Front` / `Rear` | Dégâts visuels, protection réduite |
| `Door_1_1` / `Door_2_1` | La porte tombe |
| `WindowFront` | La vitre se brise (affecte l'isolation sonore) |

La valeur `transferToGlobalCoef` détermine combien de dégâts sont transférés de cette zone à la santé globale du véhicule. `1` signifie 100% de transfert (les dégâts au moteur affectent la santé globale), `0` signifie aucun transfert.

Les `componentNames[]` doivent correspondre aux composants nommés dans le LOD de géométrie du véhicule. Puisque nous héritons du modèle Niva, nous utilisons des noms temporaires ici -- les composants géométriques de la classe parente sont ceux qui comptent réellement pour la détection de collision. Si vous utilisez le modèle vanilla sans modification, le mapping des composants du parent s'applique automatiquement.

---

## Étape 2 : Textures personnalisées

### Comment fonctionnent les sélections cachées des véhicules

Les sélections cachées des véhicules fonctionnent de la même manière que les textures d'objets, mais les véhicules ont généralement plus d'emplacements de sélection. Le modèle Offroad Hatchback utilise des sélections pour différents panneaux de carrosserie, permettant des variantes de couleur (Blanc, Bleu) en vanilla.

### Utiliser les textures vanilla (démarrage le plus rapide)

Pour les tests initiaux, pointez vos sélections cachées vers des textures vanilla existantes. Cela confirme que votre configuration fonctionne avant de créer des ressources artistiques personnalisées :

```cpp
hiddenSelectionsTextures[] =
{
    "\DZ\vehicles\wheeled\offroadhatchback\data\niva_body_co.paa",
    "\DZ\vehicles\wheeled\offroadhatchback\data\niva_body_co.paa",
    "",
    "",
    "",
    ""
};
```

Les chaînes vides `""` signifient "utiliser la texture par défaut du modèle pour cette sélection."

### Créer un jeu de textures personnalisé

Pour créer une apparence unique :

1. **Extrayez la texture vanilla** en utilisant l'Addon Builder de DayZ Tools ou le lecteur P: pour trouver :
   ```
   P:\DZ\vehicles\wheeled\offroadhatchback\data\niva_body_co.paa
   ```

2. **Convertissez en format éditable** avec TexView2 :
   - Ouvrez le fichier `.paa` dans TexView2
   - Exportez en `.tga` ou `.png`

3. **Éditez dans votre éditeur d'images** (GIMP, Photoshop, Paint.NET) :
   - Les textures de véhicules font généralement **2048x2048** ou **4096x4096**
   - Modifiez les couleurs, ajoutez des décalcomanies, des bandes de course ou des effets de rouille
   - Conservez l'agencement UV intact -- ne changez que les couleurs et les détails

4. **Reconvertissez en `.paa`** :
   - Ouvrez votre image modifiée dans TexView2
   - Enregistrez au format `.paa`
   - Enregistrez dans `MyFirstMod/Data/Textures/rally_body_co.paa`

### Conventions de nommage des textures pour les véhicules

| Suffixe | Type | Objectif |
|---------|------|----------|
| `_co` | Couleur (Diffuse) | Couleur et apparence principales |
| `_nohq` | Normal Map | Reliefs de surface, lignes de panneaux, détails de rivets |
| `_smdi` | Spéculaire | Brillance métallique, reflets de peinture |
| `_as` | Alpha/Surface | Transparence pour les vitres |
| `_de` | Destruction | Textures de superposition de dégâts |

Pour un premier mod de véhicule, seule la texture `_co` est requise. Le modèle utilise ses normal maps et spéculaires par défaut.

### Matériaux correspondants (optionnel)

Pour un contrôle complet des matériaux, créez un fichier `.rvmat` :

```cpp
hiddenSelectionsMaterials[] =
{
    "MyFirstMod\Data\Textures\rally_body.rvmat",
    "MyFirstMod\Data\Textures\rally_body.rvmat",
    "",
    "",
    "",
    ""
};
```

---

## Étape 3 : Comportement scriptique (CarScript)

Les classes de script de véhicule contrôlent les sons du moteur, la logique des portes, le comportement d'entrée/sortie de l'équipage et les animations des sièges. Puisque nous étendons `OffroadHatchback`, nous héritons de tout le comportement vanilla et ne surchargeons que ce que nous voulons personnaliser.

### Créer le fichier de script

Créez la structure de dossiers et le fichier de script :

```
MyFirstMod/
    Scripts/
        config.cpp
        4_World/
            MyFirstMod/
                MFM_RallyHatchback.c
```

### Mettre à jour Scripts config.cpp

Votre `Scripts/config.cpp` doit enregistrer la couche `4_World` pour que le moteur charge votre script :

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Vehicles_Wheeled"
        };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "World" };

        class defs
        {
            class worldScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/4_World" };
            };
        };
    };
};
```

### Écrire le script du véhicule

Créez `4_World/MyFirstMod/MFM_RallyHatchback.c` :

```c
class MFM_RallyHatchback extends OffroadHatchback
{
    void MFM_RallyHatchback()
    {
        // Surcharge des sons du moteur (réutilise les sons vanilla de la Niva)
        m_EngineStartOK         = "offroad_engine_start_SoundSet";
        m_EngineStartBattery    = "offroad_engine_failed_start_battery_SoundSet";
        m_EngineStartPlug       = "offroad_engine_failed_start_sparkplugs_SoundSet";
        m_EngineStartFuel       = "offroad_engine_failed_start_fuel_SoundSet";
        m_EngineStop            = "offroad_engine_stop_SoundSet";
        m_EngineStopFuel        = "offroad_engine_stop_fuel_SoundSet";

        m_CarDoorOpenSound      = "offroad_door_open_SoundSet";
        m_CarDoorCloseSound     = "offroad_door_close_SoundSet";
        m_CarSeatShiftInSound   = "Offroad_SeatShiftIn_SoundSet";
        m_CarSeatShiftOutSound  = "Offroad_SeatShiftOut_SoundSet";

        m_CarHornShortSoundName = "Offroad_Horn_Short_SoundSet";
        m_CarHornLongSoundName  = "Offroad_Horn_SoundSet";

        // Position du moteur dans l'espace du modèle (x, y, z) -- utilisée pour
        // la source de température, la détection de noyade et les effets de particules
        SetEnginePos("0 0.7 1.2");
    }

    // --- Instance d'animation ---
    // Détermine quel jeu d'animations du joueur est utilisé lors de l'entrée/sortie.
    // Doit correspondre au squelette du véhicule. Puisque nous utilisons le modèle Niva, gardez HATCHBACK.
    override int GetAnimInstance()
    {
        return VehicleAnimInstances.HATCHBACK;
    }

    // --- Distance de caméra ---
    // Distance de la caméra troisième personne derrière le véhicule.
    // La Niva vanilla est 3.5. Augmentez pour une vue plus large.
    override float GetTransportCameraDistance()
    {
        return 4.0;
    }

    // --- Types d'animation des sièges ---
    // Associe chaque index de siège à un type d'animation du joueur.
    // 0 = conducteur, 1 = passager avant, 2 = arrière gauche, 3 = arrière droit.
    override int GetSeatAnimationType(int posIdx)
    {
        switch (posIdx)
        {
        case 0:
            return DayZPlayerConstants.VEHICLESEAT_DRIVER;
        case 1:
            return DayZPlayerConstants.VEHICLESEAT_CODRIVER;
        case 2:
            return DayZPlayerConstants.VEHICLESEAT_PASSENGER_L;
        case 3:
            return DayZPlayerConstants.VEHICLESEAT_PASSENGER_R;
        }

        return 0;
    }

    // --- État des portes ---
    // Renvoie si une porte est manquante, ouverte ou fermée.
    // Les noms d'emplacements (NivaDriverDoors, NivaCoDriverDoors, NivaHood, NivaTrunk)
    // sont définis par les proxies d'emplacements d'inventaire du modèle.
    override int GetCarDoorsState(string slotType)
    {
        CarDoor carDoor;

        Class.CastTo(carDoor, FindAttachmentBySlotName(slotType));
        if (!carDoor)
        {
            return CarDoorState.DOORS_MISSING;
        }

        switch (slotType)
        {
            case "NivaDriverDoors":
                return TranslateAnimationPhaseToCarDoorState("DoorsDriver");

            case "NivaCoDriverDoors":
                return TranslateAnimationPhaseToCarDoorState("DoorsCoDriver");

            case "NivaHood":
                return TranslateAnimationPhaseToCarDoorState("DoorsHood");

            case "NivaTrunk":
                return TranslateAnimationPhaseToCarDoorState("DoorsTrunk");
        }

        return CarDoorState.DOORS_MISSING;
    }

    // --- Entrée/sortie de l'équipage ---
    // Détermine si un joueur peut entrer ou sortir d'un siège spécifique.
    // Vérifie l'état de la porte et la phase d'animation de rabattement du siège.
    // Les sièges avant (0, 1) nécessitent que la porte soit ouverte.
    // Les sièges arrière (2, 3) nécessitent la porte ouverte ET le siège avant rabattu.
    override bool CrewCanGetThrough(int posIdx)
    {
        switch (posIdx)
        {
            case 0:
                if (GetCarDoorsState("NivaDriverDoors") == CarDoorState.DOORS_CLOSED)
                    return false;
                if (GetAnimationPhase("SeatDriver") > 0.5)
                    return false;
                return true;

            case 1:
                if (GetCarDoorsState("NivaCoDriverDoors") == CarDoorState.DOORS_CLOSED)
                    return false;
                if (GetAnimationPhase("SeatCoDriver") > 0.5)
                    return false;
                return true;

            case 2:
                if (GetCarDoorsState("NivaDriverDoors") == CarDoorState.DOORS_CLOSED)
                    return false;
                if (GetAnimationPhase("SeatDriver") <= 0.5)
                    return false;
                return true;

            case 3:
                if (GetCarDoorsState("NivaCoDriverDoors") == CarDoorState.DOORS_CLOSED)
                    return false;
                if (GetAnimationPhase("SeatCoDriver") <= 0.5)
                    return false;
                return true;
        }

        return false;
    }

    // --- Vérification du capot pour les attachements ---
    // Empêche les joueurs de retirer les pièces du moteur quand le capot est fermé.
    override bool CanReleaseAttachment(EntityAI attachment)
    {
        if (!super.CanReleaseAttachment(attachment))
        {
            return false;
        }

        if (EngineIsOn() || GetCarDoorsState("NivaHood") == CarDoorState.DOORS_CLOSED)
        {
            string attType = attachment.GetType();
            if (attType == "CarRadiator" || attType == "CarBattery" || attType == "SparkPlug")
            {
                return false;
            }
        }

        return true;
    }

    // --- Accès au cargo ---
    // Le coffre doit être ouvert pour accéder au cargo du véhicule.
    override bool CanDisplayCargo()
    {
        if (!super.CanDisplayCargo())
        {
            return false;
        }

        if (GetCarDoorsState("NivaTrunk") == CarDoorState.DOORS_CLOSED)
        {
            return false;
        }

        return true;
    }

    // --- Accès au compartiment moteur ---
    // Le capot doit être ouvert pour voir les emplacements d'attachement du moteur.
    override bool CanDisplayAttachmentCategory(string category_name)
    {
        if (!super.CanDisplayAttachmentCategory(category_name))
        {
            return false;
        }

        category_name.ToLower();
        if (category_name.Contains("engine"))
        {
            if (GetCarDoorsState("NivaHood") == CarDoorState.DOORS_CLOSED)
            {
                return false;
            }
        }

        return true;
    }

    // --- Apparition de débogage ---
    // Appelé lors de l'apparition depuis le menu de débogage. Apparaît avec toutes les pièces
    // attachées et les fluides remplis pour un test immédiat.
    override void OnDebugSpawn()
    {
        SpawnUniversalParts();
        SpawnAdditionalItems();
        FillUpCarFluids();

        GameInventory inventory = GetInventory();
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");

        inventory.CreateInInventory("HatchbackDoors_Driver");
        inventory.CreateInInventory("HatchbackDoors_CoDriver");
        inventory.CreateInInventory("HatchbackHood");
        inventory.CreateInInventory("HatchbackTrunk");

        // Roues de secours dans le cargo
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");
    }
};
```

### Comprendre les surcharges clés

**GetAnimInstance** -- Renvoie quel jeu d'animations le joueur utilise lorsqu'il est assis dans le véhicule. Les valeurs de l'énumération sont :

| Valeur | Constante | Type de véhicule |
|--------|----------|-----------------|
| 0 | `CIVVAN` | Fourgon |
| 1 | `V3S` | Camion V3S |
| 2 | `SEDAN` | Berline Olga |
| 3 | `HATCHBACK` | Hatchback Niva |
| 5 | `S120` | Sarka 120 |
| 7 | `GOLF` | Gunter 2 |
| 8 | `HMMWV` | Humvee |

Si vous changez cette valeur pour la mauvaise, l'animation du joueur traversera le véhicule ou sera incorrecte. Faites toujours correspondre au modèle que vous utilisez.

**CrewCanGetThrough** -- Cette méthode est appelée à chaque frame pour déterminer si un joueur peut entrer ou sortir d'un siège. Les sièges arrière de la Niva (indices 2 et 3) fonctionnent différemment des sièges avant : le dossier du siège avant doit être rabattu vers l'avant (phase d'animation > 0.5) avant que les passagers arrière puissent passer. Cela reproduit le comportement réel d'un hatchback 2 portes où les passagers arrière doivent incliner le siège avant.

**OnDebugSpawn** -- Appelé lorsque vous utilisez le menu d'apparition de débogage. `SpawnUniversalParts()` ajoute des ampoules de phares et une batterie de voiture. `FillUpCarFluids()` remplit le carburant, le liquide de refroidissement, l'huile et le liquide de frein au maximum. Nous créons ensuite les roues, les portes, le capot et le coffre. Cela vous donne un véhicule immédiatement conduisible pour les tests.

---

## Étape 4 : Entrée types.xml

### Configuration d'apparition du véhicule

Les véhicules dans `types.xml` utilisent le même format que les objets, mais avec quelques différences importantes. Ajoutez ceci au `types.xml` de votre serveur :

```xml
<type name="MFM_RallyHatchback">
    <nominal>3</nominal>
    <lifetime>3888000</lifetime>
    <restock>0</restock>
    <min>1</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0" />
    <category name="vehicles" />
    <usage name="Coast" />
    <usage name="Farm" />
    <usage name="Village" />
    <value name="Tier1" />
    <value name="Tier2" />
    <value name="Tier3" />
</type>
```

### Différences entre véhicules et objets dans types.xml

| Paramètre | Objets | Véhicules |
|-----------|--------|-----------|
| `nominal` | 10-50+ | 1-5 (les véhicules sont rares) |
| `lifetime` | 3600-14400 | 3888000 (45 jours -- les véhicules persistent longtemps) |
| `restock` | 1800 | 0 (les véhicules ne se réapprovisionnent pas automatiquement ; ils réapparaissent uniquement après que le précédent soit détruit et despawné) |
| `category` | `tools`, `weapons`, etc. | `vehicles` |

### Pièces pré-attachées avec cfgspawnabletypes.xml

Les véhicules apparaissent comme des coques vides par défaut -- sans roues, portes ni pièces moteur. Pour les faire apparaître avec des pièces pré-attachées, ajoutez des entrées dans `cfgspawnabletypes.xml` dans le dossier de mission du serveur :

```xml
<type name="MFM_RallyHatchback">
    <attachments chance="1.00">
        <item name="HatchbackWheel" chance="0.75" />
        <item name="HatchbackWheel" chance="0.75" />
        <item name="HatchbackWheel" chance="0.60" />
        <item name="HatchbackWheel" chance="0.40" />
    </attachments>
    <attachments chance="1.00">
        <item name="HatchbackDoors_Driver" chance="0.50" />
        <item name="HatchbackDoors_CoDriver" chance="0.50" />
    </attachments>
    <attachments chance="1.00">
        <item name="HatchbackHood" chance="0.60" />
        <item name="HatchbackTrunk" chance="0.60" />
    </attachments>
    <attachments chance="0.70">
        <item name="CarBattery" chance="0.30" />
        <item name="SparkPlug" chance="0.30" />
    </attachments>
    <attachments chance="0.50">
        <item name="CarRadiator" chance="0.40" />
    </attachments>
    <attachments chance="0.30">
        <item name="HeadlightH7" chance="0.50" />
        <item name="HeadlightH7" chance="0.50" />
    </attachments>
</type>
```

### Comment fonctionne cfgspawnabletypes

Chaque bloc `<attachments>` est évalué indépendamment :
- La `chance` extérieure détermine si ce groupe d'attachements est considéré
- Chaque `<item>` à l'intérieur a sa propre `chance` d'être placé
- Les objets sont placés dans le premier emplacement disponible correspondant sur le véhicule

Cela signifie qu'un véhicule peut apparaître avec 3 roues et aucune porte, ou avec toutes les roues et une batterie mais pas de bougie. Cela crée la boucle de gameplay de récupération -- les joueurs doivent trouver les pièces manquantes.

---

## Étape 5 : Compiler et tester

### Empaqueter les PBOs

Vous avez besoin de deux PBOs pour ce mod :

```
@MyFirstMod/
    mod.cpp
    Addons/
        Scripts.pbo          <-- Contient Scripts/config.cpp et 4_World/
        Data.pbo             <-- Contient Data/config.cpp et Textures/
```

Utilisez l'Addon Builder de DayZ Tools :
1. **PBO Scripts :** Source = `MyFirstMod/Scripts/`, Prefix = `MyFirstMod/Scripts`
2. **PBO Data :** Source = `MyFirstMod/Data/`, Prefix = `MyFirstMod/Data`

Ou utilisez le file patching pendant le développement :

```
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

### Faire apparaître le véhicule avec la console de script

1. Lancez DayZ avec votre mod chargé
2. Rejoignez votre serveur ou démarrez en mode hors ligne
3. Ouvrez la console de script
4. Pour faire apparaître un véhicule entièrement équipé près de votre personnage :

```c
EntityAI vehicle;
vector pos = GetGame().GetPlayer().GetPosition();
pos[2] = pos[2] + 5;
vehicle = EntityAI.Cast(GetGame().CreateObject("MFM_RallyHatchback", pos, false, false, true));
```

5. Appuyez sur **Execute**

Le véhicule devrait apparaître à 5 mètres devant vous.

### Faire apparaître un véhicule prêt à conduire

Pour des tests plus rapides, faites apparaître le véhicule et utilisez la méthode d'apparition de débogage qui attache toutes les pièces :

```c
vector pos = GetGame().GetPlayer().GetPosition();
pos[2] = pos[2] + 5;
Object obj = GetGame().CreateObject("MFM_RallyHatchback", pos, false, false, true);
CarScript car = CarScript.Cast(obj);
if (car)
{
    car.OnDebugSpawn();
}
```

Cela appelle votre surcharge `OnDebugSpawn()`, qui remplit les fluides et attache les roues, les portes, le capot et le coffre.

### Éléments à tester

| Vérification | Ce qu'il faut observer |
|--------------|----------------------|
| **Le véhicule apparaît** | Apparaît dans le monde sans erreurs dans le journal de script |
| **Textures appliquées** | La couleur personnalisée de la carrosserie est visible (si vous utilisez des textures personnalisées) |
| **Le moteur démarre** | Montez à bord, maintenez la touche de démarrage du moteur. Écoutez le son de démarrage. |
| **Conduite** | L'accélération, la vitesse de pointe, la maniabilité sont différentes du vanilla |
| **Portes** | Possibilité d'ouvrir/fermer les portes conducteur et passager |
| **Capot/Coffre** | Possibilité d'ouvrir le capot pour accéder aux pièces moteur. Possibilité d'ouvrir le coffre pour le cargo. |
| **Sièges arrière** | Rabattez le siège avant, puis entrez dans le siège arrière |
| **Consommation de carburant** | Conduisez et observez la jauge de carburant |
| **Dégâts** | Tirez sur le véhicule. Les pièces devraient subir des dégâts et finalement se casser. |
| **Phares** | Les phares avant et arrière fonctionnent la nuit |

### Lire le journal de script

Si le véhicule n'apparaît pas ou se comporte incorrectement, vérifiez le journal de script à :

```
%localappdata%\DayZ\<VotreProfil>\script.log
```

Erreurs courantes :

| Message du journal | Cause |
|-------------------|-------|
| `Cannot create object type MFM_RallyHatchback` | Nom de classe config.cpp incorrect ou PBO Data non chargé |
| `Undefined variable 'OffroadHatchback'` | `requiredAddons` manque `"DZ_Vehicles_Wheeled"` |
| `Member not found` sur un appel de méthode | Faute de frappe dans le nom de la méthode surchargée |

---

## Étape 6 : Finitions

### Son de klaxon personnalisé

Pour donner à votre véhicule un klaxon unique, définissez des jeux de sons personnalisés dans votre Data config.cpp :

```cpp
class CfgSoundShaders
{
    class MFM_RallyHorn_SoundShader
    {
        samples[] = {{ "MyFirstMod\Data\Sounds\rally_horn", 1 }};
        volume = 1.0;
        range = 150;
        limitation = 0;
    };
    class MFM_RallyHornShort_SoundShader
    {
        samples[] = {{ "MyFirstMod\Data\Sounds\rally_horn_short", 1 }};
        volume = 1.0;
        range = 100;
        limitation = 0;
    };
};

class CfgSoundSets
{
    class MFM_RallyHorn_SoundSet
    {
        soundShaders[] = { "MFM_RallyHorn_SoundShader" };
        volumeFactor = 1.0;
        frequencyFactor = 1.0;
        spatial = 1;
    };
    class MFM_RallyHornShort_SoundSet
    {
        soundShaders[] = { "MFM_RallyHornShort_SoundShader" };
        volumeFactor = 1.0;
        frequencyFactor = 1.0;
        spatial = 1;
    };
};
```

Puis référencez-les dans le constructeur de votre script :

```c
m_CarHornShortSoundName = "MFM_RallyHornShort_SoundSet";
m_CarHornLongSoundName  = "MFM_RallyHorn_SoundSet";
```

Les fichiers audio doivent être au format `.ogg`. Le chemin dans `samples[]` n'inclut PAS l'extension du fichier.

### Phares personnalisés

Vous pouvez créer une classe de lumière personnalisée pour modifier la luminosité, la couleur ou la portée des phares :

```c
class MFM_RallyFrontLight extends CarLightBase
{
    void MFM_RallyFrontLight()
    {
        // Feux de croisement (ségrégés)
        m_SegregatedBrightness = 7;
        m_SegregatedRadius = 65;
        m_SegregatedAngle = 110;
        m_SegregatedColorRGB = Vector(0.9, 0.9, 1.0);

        // Feux de route (agrégés)
        m_AggregatedBrightness = 14;
        m_AggregatedRadius = 90;
        m_AggregatedAngle = 120;
        m_AggregatedColorRGB = Vector(0.9, 0.9, 1.0);

        FadeIn(0.3);
        SetFadeOutTime(0.25);

        SegregateLight();
    }
};
```

Surchargez dans votre classe de véhicule :

```c
override CarLightBase CreateFrontLight()
{
    return CarLightBase.Cast(ScriptedLightBase.CreateLight(MFM_RallyFrontLight));
}
```

### Isolation sonore (OnSound)

La surcharge `OnSound` contrôle à quel point l'habitacle atténue le bruit du moteur en fonction de l'état des portes et des vitres :

```c
override float OnSound(CarSoundCtrl ctrl, float oldValue)
{
    switch (ctrl)
    {
    case CarSoundCtrl.DOORS:
        float newValue = 0;
        if (GetCarDoorsState("NivaDriverDoors") == CarDoorState.DOORS_CLOSED)
        {
            newValue = newValue + 0.5;
        }
        if (GetCarDoorsState("NivaCoDriverDoors") == CarDoorState.DOORS_CLOSED)
        {
            newValue = newValue + 0.5;
        }
        if (GetCarDoorsState("NivaTrunk") == CarDoorState.DOORS_CLOSED)
        {
            newValue = newValue + 0.3;
        }
        if (GetHealthLevel("WindowFront") == GameConstants.STATE_RUINED)
        {
            newValue = newValue - 0.6;
        }
        if (GetHealthLevel("WindowLR") == GameConstants.STATE_RUINED)
        {
            newValue = newValue - 0.2;
        }
        if (GetHealthLevel("WindowRR") == GameConstants.STATE_RUINED)
        {
            newValue = newValue - 0.2;
        }
        return Math.Clamp(newValue, 0, 1);
    }

    return super.OnSound(ctrl, oldValue);
}
```

Une valeur de `1.0` signifie isolation complète (habitacle silencieux), `0.0` signifie aucune isolation (sensation de plein air).

---

## Référence complète du code

### Structure finale du répertoire

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp
        4_World/
            MyFirstMod/
                MFM_RallyHatchback.c
    Data/
        config.cpp
        Textures/
            rally_body_co.paa
        Sounds/
            rally_horn.ogg           (optionnel)
            rally_horn_short.ogg     (optionnel)
```

### MyFirstMod/mod.cpp

```cpp
name = "My First Mod";
author = "YourName";
version = "1.2";
overview = "My first DayZ mod with a custom rally hatchback vehicle.";
```

### MyFirstMod/Scripts/config.cpp

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Vehicles_Wheeled"
        };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "World" };

        class defs
        {
            class worldScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/4_World" };
            };
        };
    };
};
```

### Entrée types.xml de la mission serveur

```xml
<type name="MFM_RallyHatchback">
    <nominal>3</nominal>
    <lifetime>3888000</lifetime>
    <restock>0</restock>
    <min>1</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0" />
    <category name="vehicles" />
    <usage name="Coast" />
    <usage name="Farm" />
    <usage name="Village" />
    <value name="Tier1" />
    <value name="Tier2" />
    <value name="Tier3" />
</type>
```

### Entrée cfgspawnabletypes.xml de la mission serveur

```xml
<type name="MFM_RallyHatchback">
    <attachments chance="1.00">
        <item name="HatchbackWheel" chance="0.75" />
        <item name="HatchbackWheel" chance="0.75" />
        <item name="HatchbackWheel" chance="0.60" />
        <item name="HatchbackWheel" chance="0.40" />
    </attachments>
    <attachments chance="1.00">
        <item name="HatchbackDoors_Driver" chance="0.50" />
        <item name="HatchbackDoors_CoDriver" chance="0.50" />
    </attachments>
    <attachments chance="1.00">
        <item name="HatchbackHood" chance="0.60" />
        <item name="HatchbackTrunk" chance="0.60" />
    </attachments>
    <attachments chance="0.70">
        <item name="CarBattery" chance="0.30" />
        <item name="SparkPlug" chance="0.30" />
    </attachments>
    <attachments chance="0.50">
        <item name="CarRadiator" chance="0.40" />
    </attachments>
    <attachments chance="0.30">
        <item name="HeadlightH7" chance="0.50" />
        <item name="HeadlightH7" chance="0.50" />
    </attachments>
</type>
```

---

## Bonnes pratiques

- **Étendez toujours une classe de véhicule existante.** Créer un véhicule de zéro nécessite un modèle 3D personnalisé avec les LODs de géométrie corrects, les proxies, les points mémoire et une configuration de simulation physique. Étendre un véhicule vanilla vous donne tout cela gratuitement.
- **Testez d'abord avec `OnDebugSpawn()`.** Avant de configurer types.xml et cfgspawnabletypes.xml, vérifiez que le véhicule fonctionne en le faisant apparaître entièrement équipé via le menu de débogage ou la console de script.
- **Gardez le même `GetAnimInstance()` que le parent.** Si vous changez cela sans un jeu d'animations correspondant, les joueurs feront le T-pose ou traverseront le véhicule.
- **Ne changez pas les noms des emplacements de portes.** La Niva utilise `NivaDriverDoors`, `NivaCoDriverDoors`, `NivaHood`, `NivaTrunk`. Ceux-ci sont liés aux noms de proxies du modèle et aux définitions d'emplacements d'inventaire. Les changer sans modifier le modèle cassera la fonctionnalité des portes.
- **Utilisez `scope = 0` pour les classes de base internes.** Si vous créez un véhicule de base abstrait que d'autres variantes étendent, mettez `scope = 0` pour qu'il n'apparaisse jamais directement.
- **Définissez `requiredAddons` correctement.** Votre Data config.cpp doit lister `"DZ_Vehicles_Wheeled"` pour que la classe parente `OffroadHatchback` soit chargée avant la vôtre.
- **Testez la logique des portes minutieusement.** Entrez/sortez de chaque siège, ouvrez/fermez chaque porte, essayez d'accéder au compartiment moteur avec le capot fermé. Les bugs de CrewCanGetThrough sont le problème le plus courant des mods de véhicules.

---

## Théorie vs pratique

| Concept | Théorie | Réalité |
|---------|---------|---------|
| `SimulationModule` dans config.cpp | Contrôle total sur la physique du véhicule | Tous les paramètres ne se surchargent pas proprement lors de l'extension d'une classe parente. Si vos changements de vitesse/couple semblent n'avoir aucun effet, essayez d'ajuster `transmissionRatio` et les `ratios[]` des rapports au lieu de simplement `torqueMax`. |
| Zones de dégâts avec `componentNames[]` | Chaque zone correspond à un composant géométrique | Lors de l'extension d'un véhicule vanilla, les noms de composants du modèle parent sont déjà définis. Vos valeurs `componentNames[]` dans la configuration n'importent que si vous fournissez un modèle personnalisé. Le LOD de géométrie du parent détermine la détection de collision réelle. |
| Textures personnalisées via les sélections cachées | Changez n'importe quelle texture librement | Seules les sélections que l'auteur du modèle a marquées comme "cachées" peuvent être surchargées. Si vous devez retexturer une partie absente de `hiddenSelections[]`, vous devez créer un nouveau modèle ou modifier l'existant dans Object Builder. |
| Pièces pré-attachées dans `cfgspawnabletypes.xml` | Les objets se fixent aux emplacements correspondants | Si une classe de roue est incompatible avec le véhicule (mauvais emplacement d'attachement), l'opération échoue silencieusement. Utilisez toujours des pièces acceptées par le véhicule parent -- pour la Niva, cela signifie `HatchbackWheel`, pas `CivSedanWheel`. |
| Sons du moteur | Définissez n'importe quel nom de SoundSet | Les jeux de sons doivent être définis dans `CfgSoundSets` quelque part dans les configurations chargées. Si vous référencez un jeu de sons inexistant, le moteur utilise silencieusement aucun son -- pas d'erreur dans le journal. |

---

## Ce que vous avez appris

Dans ce tutoriel, vous avez appris :

- Comment définir une classe de véhicule personnalisée en étendant un véhicule vanilla existant dans config.cpp
- Comment les zones de dégâts fonctionnent et comment configurer les valeurs de santé pour chaque composant du véhicule
- Comment les sélections cachées des véhicules permettent le retexturage de la carrosserie sans modèle 3D personnalisé
- Comment écrire un script de véhicule avec la logique d'état des portes, les vérifications d'entrée de l'équipage et le comportement du moteur
- Comment `types.xml` et `cfgspawnabletypes.xml` fonctionnent ensemble pour l'apparition de véhicules avec des pièces pré-attachées aléatoires
- Comment tester les véhicules en jeu en utilisant la console de script et la méthode `OnDebugSpawn()`
- Comment ajouter des sons personnalisés pour les klaxons et des classes de lumière personnalisées pour les phares

**Prochain :** Enrichissez votre mod de véhicule avec des modèles de portes personnalisés, des textures d'intérieur, ou même une carrosserie entièrement nouvelle en utilisant Blender et Object Builder.

---

## Erreurs courantes

### Le véhicule apparaît mais tombe immédiatement à travers le sol

La géométrie physique ne se charge pas. Cela signifie généralement que `requiredAddons[]` n'inclut pas `"DZ_Vehicles_Wheeled"`, donc la configuration physique de la classe parente n'est pas héritée.

### Le véhicule apparaît mais on ne peut pas y entrer

Vérifiez que `GetAnimInstance()` renvoie la bonne valeur d'énumération pour votre modèle. Si vous étendez `OffroadHatchback` mais renvoyez `VehicleAnimInstances.SEDAN`, l'animation d'entrée cible les mauvaises positions de portes et le joueur ne peut pas monter.

### Les portes ne s'ouvrent pas ou ne se ferment pas

Vérifiez que `GetCarDoorsState()` utilise les bons noms d'emplacements. La Niva utilise `"NivaDriverDoors"`, `"NivaCoDriverDoors"`, `"NivaHood"` et `"NivaTrunk"`. Ceux-ci doivent correspondre exactement, y compris la casse.

### Le moteur démarre mais le véhicule ne bouge pas

Vérifiez les rapports de boîte de votre `SimulationModule`. Si `ratios[]` est vide ou contient des valeurs à zéro, le véhicule n'a pas de vitesses avant. Vérifiez aussi que les roues sont attachées -- un véhicule sans roues accélérera mais ne bougera pas.

### Le véhicule n'a pas de son

Les sons du moteur sont assignés dans le constructeur. Si vous faites une faute de frappe dans un nom de SoundSet (par exemple `"offroad_engine_Start_SoundSet"` au lieu de `"offroad_engine_start_SoundSet"`), le moteur utilise silencieusement aucun son. Les noms de jeux de sons sont sensibles à la casse.

### La texture personnalisée ne s'affiche pas

Vérifiez trois choses dans l'ordre : (1) le nom de la sélection cachée correspond exactement au modèle, (2) le chemin de la texture utilise des barres obliques inversées dans config.cpp, et (3) le fichier `.paa` est à l'intérieur du PBO empaqueté. Si vous utilisez le file patching pendant le développement, assurez-vous que le chemin commence depuis la racine du mod, pas un chemin absolu.

### Les passagers arrière ne peuvent pas entrer

Les sièges arrière de la Niva nécessitent que le siège avant soit rabattu vers l'avant. Si votre surcharge `CrewCanGetThrough()` pour les indices de siège 2 et 3 ne vérifie pas `GetAnimationPhase("SeatDriver")` et `GetAnimationPhase("SeatCoDriver")`, les passagers arrière seront définitivement bloqués.

### Le véhicule apparaît sans pièces en multijoueur

`OnDebugSpawn()` est uniquement pour le débogage/test. Sur un vrai serveur, les pièces proviennent de `cfgspawnabletypes.xml`. Si votre véhicule apparaît comme une coque nue, ajoutez l'entrée `cfgspawnabletypes.xml` décrite à l'Étape 4.

---

**Précédent :** [Chapitre 8.9 : Modèle de mod professionnel](09-professional-template.md)
