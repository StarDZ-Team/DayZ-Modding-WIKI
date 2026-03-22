# Chapitre 8.11 : Créer des vêtements personnalisés

[Accueil](../README.md) | [<< Précédent : Créer un véhicule personnalisé](10-vehicle-mod.md) | **Créer des vêtements personnalisés** | [Suivant : Construire un système d'échange >>](12-trading-system.md)

---

> **Résumé :** Ce tutoriel vous guide dans la création d'une veste tactique personnalisée pour DayZ. Vous choisirez une classe de base, définirez le vêtement dans config.cpp avec des propriétés d'isolation et de cargo, le retexturerez avec un motif camouflage en utilisant les sélections cachées, ajouterez la localisation et l'apparition, et opterez éventuellement pour un comportement scripté. À la fin, vous aurez une veste portable qui garde les joueurs au chaud, contient des objets et apparaît dans le monde.

---

## Table des matières

- [Ce que nous construisons](#ce-que-nous-construisons)
- [Étape 1 : Choisir une classe de base](#étape-1--choisir-une-classe-de-base)
- [Étape 2 : config.cpp pour les vêtements](#étape-2--configcpp-pour-les-vêtements)
- [Étape 3 : Créer les textures](#étape-3--créer-les-textures)
- [Étape 4 : Ajouter l'espace de cargo](#étape-4--ajouter-lespace-de-cargo)
- [Étape 5 : Localisation et apparition](#étape-5--localisation-et-apparition)
- [Étape 6 : Comportement scripté (Optionnel)](#étape-6--comportement-scripté-optionnel)
- [Étape 7 : Compiler, tester, peaufiner](#étape-7--compiler-tester-peaufiner)
- [Référence de code complète](#référence-de-code-complète)
- [Erreurs courantes](#erreurs-courantes)
- [Bonnes pratiques](#bonnes-pratiques)
- [Théorie vs pratique](#théorie-vs-pratique)
- [Ce que vous avez appris](#ce-que-vous-avez-appris)

---

## Ce que nous construisons

Nous allons créer une **Veste tactique camouflage** -- une veste de style militaire avec un camouflage boisé que les joueurs peuvent trouver et porter. Elle va :

- Étendre le modèle de veste Gorka vanilla (pas de modélisation 3D requise)
- Avoir une retexture camouflage personnalisée utilisant les sélections cachées
- Fournir de la chaleur grâce aux valeurs de `heatIsolation`
- Transporter des objets dans ses poches (espace de cargo)
- Subir des dommages avec une dégradation visuelle selon les niveaux de santé
- Apparaître aux emplacements militaires dans le monde

**Prérequis :** Une structure de mod fonctionnelle (complétez d'abord le [Chapitre 8.1](01-first-mod.md) et le [Chapitre 8.2](02-custom-item.md)), un éditeur de texte, DayZ Tools installé (pour TexView2) et un éditeur d'image pour créer les textures camouflage.

---

## Étape 1 : Choisir une classe de base

Les vêtements dans DayZ héritent de `Clothing_Base`, mais vous n'étendez presque jamais cette classe directement. DayZ fournit des classes de base intermédiaires pour chaque emplacement corporel :

| Classe de base | Emplacement corporel | Exemples |
|------------|-----------|----------|
| `Top_Base` | Corps (torse) | Vestes, chemises, sweats à capuche |
| `Pants_Base` | Jambes | Jeans, pantalons cargo |
| `Shoes_Base` | Pieds | Bottes, baskets |
| `HeadGear_Base` | Tête | Casques, chapeaux |
| `Mask_Base` | Visage | Masques à gaz, cagoules |
| `Gloves_Base` | Mains | Gants tactiques |
| `Vest_Base` | Emplacement gilet | Porte-plaques, harnais |
| `Glasses_Base` | Lunettes | Lunettes de soleil |
| `Backpack_Base` | Dos | Sacs à dos, sacs |

La chaîne d'héritage complète est : `Clothing_Base -> Clothing -> Top_Base -> GorkaEJacket_ColorBase -> VotreVeste`

### Pourquoi étendre un objet vanilla existant

Vous pouvez étendre à différents niveaux :

1. **Étendre un objet spécifique** (comme `GorkaEJacket_ColorBase`) -- le plus facile. Vous héritez du modèle, des animations, de l'emplacement et de toutes les propriétés. Ne changez que les textures et ajustez les valeurs. C'est ce que fait l'exemple `Test_ClothingRetexture` de Bohemia.
2. **Étendre une base d'emplacement** (comme `Top_Base`) -- point de départ propre, mais vous devez spécifier un modèle et toutes les propriétés.
3. **Étendre `Clothing` directement** -- uniquement pour un comportement d'emplacement complètement personnalisé. Rarement nécessaire.

Pour notre veste tactique, nous allons étendre `GorkaEJacket_ColorBase`. En regardant le script vanilla :

```c
class GorkaEJacket_ColorBase extends Top_Base
{
    override void SetActions()
    {
        super.SetActions();
        AddAction(ActionWringClothes);
    }
};
class GorkaEJacket_Summer extends GorkaEJacket_ColorBase {};
class GorkaEJacket_Flat extends GorkaEJacket_ColorBase {};
```

Remarquez le patron : une classe `_ColorBase` gère le comportement partagé, et les variantes de couleur individuelles l'étendent sans code supplémentaire. Leurs entrées config.cpp fournissent différentes textures. Nous suivrons le même patron.

Pour trouver les classes de base, regardez dans `scripts/4_world/entities/itembase/clothing_base.c` (définit toutes les bases d'emplacement) et `scripts/4_world/entities/itembase/clothing/` (un fichier par famille de vêtements).

---

## Étape 2 : config.cpp pour les vêtements

Créez `MyClothingMod/Data/config.cpp` :

```cpp
class CfgPatches
{
    class MyClothingMod_Data
    {
        units[] = { "MCM_TacticalJacket_Woodland" };
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Data", "DZ_Characters_Tops" };
    };
};

class CfgVehicles
{
    class GorkaEJacket_ColorBase;

    class MCM_TacticalJacket_ColorBase : GorkaEJacket_ColorBase
    {
        scope = 0;
        displayName = "";
        descriptionShort = "";

        weight = 1800;
        itemSize[] = { 3, 4 };
        absorbency = 0.3;
        heatIsolation = 0.8;
        visibilityModifier = 0.7;

        repairableWithKits[] = { 5, 2 };
        repairCosts[] = { 30.0, 25.0 };

        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 200;
                    healthLevels[] =
                    {
                        { 1.0,  { "DZ\characters\tops\Data\GorkaUpper.rvmat" } },
                        { 0.70, { "DZ\characters\tops\Data\GorkaUpper.rvmat" } },
                        { 0.50, { "DZ\characters\tops\Data\GorkaUpper_damage.rvmat" } },
                        { 0.30, { "DZ\characters\tops\Data\GorkaUpper_damage.rvmat" } },
                        { 0.01, { "DZ\characters\tops\Data\GorkaUpper_destruct.rvmat" } }
                    };
                };
            };
            class GlobalArmor
            {
                class Melee
                {
                    class Health    { damage = 0.8; };
                    class Blood     { damage = 0.8; };
                    class Shock     { damage = 0.8; };
                };
                class Infected
                {
                    class Health    { damage = 0.8; };
                    class Blood     { damage = 0.8; };
                    class Shock     { damage = 0.8; };
                };
            };
        };

        class EnvironmentWetnessIncrements
        {
            class Soaking
            {
                rain = 0.015;
                water = 0.1;
            };
            class Drying
            {
                playerHeat = -0.08;
                fireBarrel = -0.25;
                wringing = -0.15;
            };
        };
    };

    class MCM_TacticalJacket_Woodland : MCM_TacticalJacket_ColorBase
    {
        scope = 2;
        displayName = "$STR_MCM_TacticalJacket_Woodland";
        descriptionShort = "$STR_MCM_TacticalJacket_Woodland_Desc";
        hiddenSelectionsTextures[] =
        {
            "MyClothingMod\Data\Textures\tactical_jacket_g_woodland_co.paa",
            "MyClothingMod\Data\Textures\tactical_jacket_woodland_co.paa",
            "MyClothingMod\Data\Textures\tactical_jacket_woodland_co.paa"
        };
    };
};
```

### Champs spécifiques aux vêtements expliqués

**Thermique et furtivité :**

| Champ | Valeur | Explication |
|-------|-------|-------------|
| `heatIsolation` | `0.8` | Chaleur fournie (plage 0.0-1.0). Le moteur multiplie cela par les facteurs de santé et d'humidité. Une veste en parfait état et sèche donne toute la chaleur ; une veste ruinée et trempée n'en donne presque aucune. |
| `visibilityModifier` | `0.7` | Visibilité du joueur pour l'IA (plus bas = plus difficile à détecter). |
| `absorbency` | `0.3` | Absorption d'eau (0 = imperméable, 1 = éponge). Plus bas est mieux pour la résistance à la pluie. |

**Référence vanilla heatIsolation :** T-shirt 0.2, Sweat à capuche 0.5, Veste Gorka 0.7, Veste de terrain 0.8, Manteau en laine 0.9.

**Réparation :** `repairableWithKits[] = { 5, 2 }` liste les types de kits (5=Kit de couture, 2=Kit de couture en cuir). `repairCosts[]` donne le matériau consommé par réparation, dans l'ordre correspondant.

**Armure :** Une valeur de `damage` de 0.8 signifie que le joueur reçoit 80% des dommages entrants (20% absorbés). Des valeurs plus basses = plus de protection.

**Humidité :** `Soaking` contrôle la vitesse à laquelle la pluie/l'eau imbibe l'objet. Les valeurs négatives de `Drying` représentent la perte d'humidité par la chaleur corporelle, les feux et l'essorage.

**Sélections cachées :** Le modèle Gorka a 3 sélections -- l'indice 0 est le modèle au sol, les indices 1 et 2 sont le modèle porté. Vous remplacez `hiddenSelectionsTextures[]` avec vos chemins PAA personnalisés.

**Niveaux de santé :** Chaque entrée est `{ seuilDeSanté, { cheminDuMatériau } }`. Quand la santé descend en dessous d'un seuil, le moteur échange le matériau. Les rvmats de dommages vanilla ajoutent des marques d'usure et des déchirures.

---

## Étape 3 : Créer les textures

### Trouver et créer des textures

Les textures de la veste Gorka se trouvent à `DZ\characters\tops\data\` -- extrayez les `gorka_upper_summer_co.paa` (couleur), `gorka_upper_nohq.paa` (normal) et `gorka_upper_smdi.paa` (spéculaire) depuis le lecteur P: pour les utiliser comme modèles.

**Créer le motif camouflage :**

1. Ouvrir la texture `_co` vanilla dans TexView2, exporter en TGA/PNG
2. Peindre votre camouflage boisé dans votre éditeur d'image, en suivant la disposition UV
3. Garder les mêmes dimensions (typiquement 2048x2048 ou 1024x1024)
4. Sauvegarder en TGA, convertir en PAA avec TexView2 (Fichier > Enregistrer sous > .paa)

### Types de textures

| Suffixe | But | Requis ? |
|--------|---------|-----------|
| `_co` | Couleur/motif principal | Oui |
| `_nohq` | Carte de normales (détail du tissu) | Non -- utilise le défaut vanilla |
| `_smdi` | Spéculaire (brillance) | Non -- utilise le défaut vanilla |
| `_as` | Masque alpha/surface | Non |

Pour une retexture, vous n'avez besoin que des textures `_co`. Les cartes de normales et spéculaires du modèle vanilla continuent de fonctionner.

Pour un contrôle complet des matériaux, créez des fichiers `.rvmat` et référencez-les dans `hiddenSelectionsMaterials[]`. Voir l'exemple `Test_ClothingRetexture` de Bohemia pour des exemples rvmat fonctionnels avec des variantes de dommages et de destruction.

---

## Étape 4 : Ajouter l'espace de cargo

En étendant `GorkaEJacket_ColorBase`, vous héritez automatiquement de sa grille de cargo (4x3) et de son emplacement d'inventaire (`"Body"`). La propriété `itemSize[] = { 3, 4 }` définit la taille de la veste quand elle est stockée comme butin -- PAS sa capacité de cargo.

Emplacements de vêtements courants : `"Body"` (vestes), `"Legs"` (pantalons), `"Feet"` (bottes), `"Headgear"` (chapeaux), `"Vest"` (harnais), `"Gloves"`, `"Mask"`, `"Back"` (sacs à dos).

Certains vêtements acceptent des fixations (comme les poches du porte-plaques). Ajoutez-les avec `attachments[] = { "Shoulder", "Armband" };`. Pour une veste basique, le cargo hérité est suffisant.

---

## Étape 5 : Localisation et apparition

### Table de chaînes

Créez `MyClothingMod/Data/Stringtable.csv` :

```csv
"Language","English","Czech","German","Russian","Polish","Hungarian","Italian","Spanish","French","Chinese","Japanese","Portuguese","ChineseSimp","Korean"
"STR_MCM_TacticalJacket_Woodland","Tactical Jacket (Woodland)","","","","","","","","","","","","",""
"STR_MCM_TacticalJacket_Woodland_Desc","A rugged tactical jacket with woodland camouflage. Provides good insulation and has multiple pockets.","","","","","","","","","","","","",""
```

### Apparition (types.xml)

Ajoutez dans le `types.xml` du dossier mission de votre serveur :

```xml
<type name="MCM_TacticalJacket_Woodland">
    <nominal>8</nominal>
    <lifetime>14400</lifetime>
    <restock>3600</restock>
    <min>3</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0" />
    <category name="clothes" />
    <usage name="Military" />
    <value name="Tier2" />
    <value name="Tier3" />
</type>
```

Utilisez `category name="clothes"` pour tous les vêtements. Définissez `usage` en fonction de l'endroit où l'objet doit apparaître (Military, Town, Police, etc.) et `value` pour le tier de la carte (Tier1=côte jusqu'à Tier4=intérieur profond).

---

## Étape 6 : Comportement scripté (Optionnel)

Pour une simple retexture, vous n'avez pas besoin de scripts. Mais pour ajouter un comportement quand la veste est portée, créez une classe de script.

### config.cpp des scripts

```cpp
class CfgPatches
{
    class MyClothingMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Data", "DZ_Characters_Tops" };
    };
};

class CfgMods
{
    class MyClothingMod
    {
        dir = "MyClothingMod";
        name = "My Clothing Mod";
        author = "YourName";
        type = "mod";
        dependencies[] = { "World" };
        class defs
        {
            class worldScriptModule
            {
                value = "";
                files[] = { "MyClothingMod/Scripts/4_World" };
            };
        };
    };
};
```

### Script de la veste personnalisée

Créez `Scripts/4_World/MyClothingMod/MCM_TacticalJacket.c` :

```c
class MCM_TacticalJacket_ColorBase extends GorkaEJacket_ColorBase
{
    override void OnWasAttached(EntityAI parent, int slot_id)
    {
        super.OnWasAttached(parent, slot_id);
        PlayerBase player = PlayerBase.Cast(parent);
        if (player)
        {
            Print("[MyClothingMod] Player equipped Tactical Jacket");
        }
    }

    override void OnWasDetached(EntityAI parent, int slot_id)
    {
        super.OnWasDetached(parent, slot_id);
        PlayerBase player = PlayerBase.Cast(parent);
        if (player)
        {
            Print("[MyClothingMod] Player removed Tactical Jacket");
        }
    }

    override void SetActions()
    {
        super.SetActions();
        AddAction(ActionWringClothes);
    }
};
```

### Événements clés des vêtements

| Événement | Quand il se déclenche | Utilisation courante |
|-------|---------------|------------|
| `OnWasAttached(parent, slot_id)` | Le joueur équipe l'objet | Appliquer des bonus, afficher des effets |
| `OnWasDetached(parent, slot_id)` | Le joueur déséquipe l'objet | Retirer les bonus, nettoyer |
| `EEItemAttached(item, slot_name)` | Un objet est attaché à ce vêtement | Afficher/masquer les sélections du modèle |
| `EEItemDetached(item, slot_name)` | Un objet est détaché de ce vêtement | Inverser les changements visuels |
| `EEHealthLevelChanged(old, new, zone)` | La santé franchit un seuil | Mettre à jour l'état visuel |

**Important :** Appelez toujours `super` au début de chaque override. La classe parente gère le comportement critique du moteur.

---

## Étape 7 : Compiler, tester, peaufiner

### Compiler et faire apparaître

Empaquetez `Data/` et `Scripts/` comme des PBO séparés. Lancez DayZ avec votre mod et faites apparaître la veste :

```c
GetGame().GetPlayer().GetInventory().CreateInInventory("MCM_TacticalJacket_Woodland");
```

### Liste de vérification

1. **Apparaît-elle dans l'inventaire ?** Sinon, vérifiez `scope=2` et la correspondance du nom de classe.
2. **Texture correcte ?** Texture Gorka par défaut = mauvais chemins. Blanc/rose = fichier de texture manquant.
3. **Pouvez-vous l'équiper ?** Elle devrait aller dans l'emplacement Body. Sinon, vérifiez la chaîne de classes parentes.
4. **Le nom d'affichage s'affiche ?** Si vous voyez du texte brut `$STR_`, la table de chaînes ne charge pas.
5. **Fournit-elle de la chaleur ?** Vérifiez `heatIsolation` dans le menu debug/inspection.
6. **Les dommages dégradent le visuel ?** Testez avec : `ItemBase.Cast(GetGame().GetPlayer().GetItemOnSlot("Body")).SetHealth("", "", 40);`

### Ajouter des variantes de couleur

Suivez le patron `_ColorBase` -- ajoutez des classes sœurs qui ne diffèrent que par les textures :

```cpp
class MCM_TacticalJacket_Desert : MCM_TacticalJacket_ColorBase
{
    scope = 2;
    displayName = "$STR_MCM_TacticalJacket_Desert";
    descriptionShort = "$STR_MCM_TacticalJacket_Desert_Desc";
    hiddenSelectionsTextures[] =
    {
        "MyClothingMod\Data\Textures\tactical_jacket_g_desert_co.paa",
        "MyClothingMod\Data\Textures\tactical_jacket_desert_co.paa",
        "MyClothingMod\Data\Textures\tactical_jacket_desert_co.paa"
    };
};
```

Chaque variante a besoin de son propre `scope=2`, nom d'affichage, textures, entrées dans la table de chaînes et entrée types.xml.

---

## Référence de code complète

### Structure de répertoire

```
MyClothingMod/
    mod.cpp
    Data/
        config.cpp              <-- Définitions d'objets (voir Étape 2)
        Stringtable.csv         <-- Noms d'affichage (voir Étape 5)
        Textures/
            tactical_jacket_woodland_co.paa
            tactical_jacket_g_woodland_co.paa
    Scripts/                    <-- Uniquement nécessaire pour le comportement scripté
        config.cpp              <-- Entrée CfgMods (voir Étape 6)
        4_World/
            MyClothingMod/
                MCM_TacticalJacket.c
```

### mod.cpp

```cpp
name = "My Clothing Mod";
author = "YourName";
version = "1.0";
overview = "Adds a tactical jacket with camo variants to DayZ.";
```

Tous les autres fichiers sont présentés en intégralité dans leurs étapes respectives ci-dessus.

---

## Erreurs courantes

| Erreur | Conséquence | Correction |
|---------|-------------|-----|
| Oublier `scope=2` sur les variantes | L'objet n'apparaît pas et ne se montre pas dans les outils admin | Mettre `scope=0` sur la base, `scope=2` sur chaque variante apparaissable |
| Mauvais nombre dans le tableau de textures | Textures blanches/roses sur certaines parties | Faire correspondre le nombre de `hiddenSelectionsTextures` aux sélections cachées du modèle (Gorka en a 3) |
| Barres obliques vers l'avant dans les chemins de texture | Les textures ne chargent pas silencieusement | Utiliser des barres obliques inversées : `"MyMod\Data\tex.paa"` |
| `requiredAddons` manquant | Le parseur de config ne peut pas résoudre la classe parente | Inclure `"DZ_Characters_Tops"` pour les hauts |
| `heatIsolation` au-dessus de 1.0 | Le joueur surchauffe par temps chaud | Garder les valeurs dans la plage 0.0-1.0 |
| Matériaux `healthLevels` vides | Pas de dégradation visuelle des dommages | Toujours référencer au moins les rvmats vanilla |
| Sauter `super` dans les overrides | Comportement cassé de l'inventaire, des dommages ou des fixations | Toujours appeler `super.NomDeMethode()` en premier |

---

## Bonnes pratiques

- **Commencer par une simple retexture.** Obtenez un mod fonctionnel avec un changement de texture avant d'ajouter des propriétés personnalisées ou des scripts. Cela isole les problèmes de config des problèmes de texture.
- **Utiliser le patron _ColorBase.** Propriétés partagées dans la base `scope=0`, uniquement les textures et noms dans les variantes `scope=2`. Pas de duplication.
- **Garder des valeurs d'isolation réalistes.** Référencez les objets vanilla avec des équivalents similaires dans le monde réel.
- **Tester avec la console de script avant types.xml.** Confirmez que l'objet fonctionne avant de déboguer les tables d'apparition.
- **Utiliser les références `$STR_` pour tout texte visible par le joueur.** Permet la localisation future sans changements de config.
- **Empaqueter Data et Scripts comme des PBO séparés.** Mettez à jour les textures sans reconstruire les scripts.
- **Fournir des textures au sol.** La texture `_g_` rend les objets déposés corrects visuellement.

---

## Théorie vs pratique

| Concept | Théorie | Réalité |
|---------|--------|---------|
| `heatIsolation` | Un simple nombre de chaleur | La chaleur effective dépend de la santé et de l'humidité. Le moteur le multiplie par des facteurs dans `MiscGameplayFunctions.GetCurrentItemHeatIsolation()`. |
| Valeurs de `damage` d'armure | Plus bas = plus de protection | Une valeur de 0.8 signifie que le joueur reçoit 80% des dommages (seulement 20% absorbés). Beaucoup de moddeurs lisent 0.9 comme "90% de protection" alors que c'est en réalité 10%. |
| Héritage de `scope` | Les enfants héritent du scope parent | Ils ne le font PAS. Chaque classe doit explicitement définir `scope`. Un parent `scope=0` met par défaut tous les enfants à `scope=0`. |
| `absorbency` | Contrôle la protection contre la pluie | Il contrôle l'absorption d'humidité, ce qui RÉDUIT la chaleur. Imperméable = BASSE absorbance (0.1). Haute absorbance (0.8+) = absorbe comme une éponge. |
| Sélections cachées | Fonctionnent sur n'importe quel modèle | Tous les modèles n'exposent pas les mêmes sélections. Vérifiez avec Object Builder ou la config vanilla avant de choisir un modèle de base. |

---

## Ce que vous avez appris

Dans ce tutoriel, vous avez appris :

- Comment les vêtements DayZ héritent de classes de base spécifiques aux emplacements (`Top_Base`, `Pants_Base`, etc.)
- Comment définir un vêtement dans config.cpp avec des propriétés thermiques, d'armure et d'humidité
- Comment les sélections cachées permettent de retexturer des modèles vanilla avec des motifs camouflage personnalisés
- Comment `heatIsolation`, `visibilityModifier` et `absorbency` affectent le gameplay
- Comment le `DamageSystem` contrôle la dégradation visuelle et la protection d'armure
- Comment créer des variantes de couleur en utilisant le patron `_ColorBase`
- Comment ajouter des entrées d'apparition avec `types.xml` et des noms d'affichage avec `Stringtable.csv`
- Comment ajouter optionnellement un comportement scripté avec les événements `OnWasAttached` et `OnWasDetached`

**Prochaine étape :** Appliquez les mêmes techniques pour créer des pantalons (`Pants_Base`), des bottes (`Shoes_Base`) ou un gilet (`Vest_Base`). La structure config est identique -- seule la classe parente et l'emplacement d'inventaire changent.

---

**Précédent :** [Chapitre 8.8 : Overlay HUD](08-hud-overlay.md)
**Suivant :** Bientôt disponible
