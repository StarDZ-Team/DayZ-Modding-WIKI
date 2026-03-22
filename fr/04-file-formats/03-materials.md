# Chapitre 4.3 : Matériaux (.rvmat)

[Accueil](../../README.md) | [<< Précédent : Modèles 3D](02-models.md) | **Matériaux** | [Suivant : Audio >>](04-audio.md)

---

## Introduction

Un matériau dans DayZ est le pont entre un modèle 3D et son apparence visuelle. Alors que les textures fournissent les données d'image brutes, le fichier **RVMAT** (Real Virtuality Material) définit comment ces textures sont combinées, quel shader les interprète, et quelles propriétés de surface le moteur doit simuler -- brillance, transparence, auto-illumination, et plus encore. Chaque face de chaque modèle P3D dans le jeu référence un fichier RVMAT, et comprendre comment les créer et les configurer est essentiel pour tout mod visuel.

Ce chapitre couvre le format de fichier RVMAT, les types de shaders, la configuration des étapes de texture, les propriétés des matériaux, le système d'échange de matériaux par niveau de dégâts, et des exemples pratiques tirés de DayZ-Samples.

---

## Table des matières

- [Vue d'ensemble du format RVMAT](#vue-densemble-du-format-rvmat)
- [Structure du fichier](#structure-du-fichier)
- [Types de shaders](#types-de-shaders)
- [Étapes de texture](#étapes-de-texture)
- [Propriétés des matériaux](#propriétés-des-matériaux)
- [Niveaux de santé (échange de matériaux par dégâts)](#niveaux-de-santé-échange-de-matériaux-par-dégâts)
- [Comment les matériaux référencent les textures](#comment-les-matériaux-référencent-les-textures)
- [Créer un RVMAT à partir de zéro](#créer-un-rvmat-à-partir-de-zéro)
- [Exemples réels](#exemples-réels)
- [Erreurs courantes](#erreurs-courantes)
- [Bonnes pratiques](#bonnes-pratiques)

---

## Vue d'ensemble du format RVMAT

Un fichier **RVMAT** est un fichier de configuration textuel (pas binaire) qui définit un matériau. Malgré l'extension personnalisée, le format est du texte brut utilisant la syntaxe de configuration de style Bohemia avec des classes et des paires clé-valeur.

### Caractéristiques principales

- **Format texte :** Éditable dans n'importe quel éditeur de texte (Notepad++, VS Code).
- **Liaison de shader :** Chaque RVMAT spécifie quel shader de rendu utiliser.
- **Mappage de textures :** Définit quels fichiers de texture sont assignés à quelles entrées du shader (diffuse, normale, spéculaire, etc.).
- **Propriétés de surface :** Contrôle l'intensité spéculaire, la lueur émissive, la transparence, et plus encore.
- **Référencé par les modèles P3D :** Les faces dans le LOD de résolution d'Object Builder se voient assigner un RVMAT. Le moteur charge le RVMAT et toutes les textures qu'il référence.
- **Référencé par config.cpp :** `hiddenSelectionsMaterials[]` peut remplacer les matériaux à l'exécution.

### Convention de chemin

Les fichiers RVMAT se trouvent aux côtés de leurs textures, généralement dans un répertoire `data/` :

```
MyMod/
  data/
    my_item.rvmat              <-- Définition du matériau
    my_item_co.paa             <-- Texture diffuse (référencée par le RVMAT)
    my_item_nohq.paa           <-- Normal map (référencée par le RVMAT)
    my_item_smdi.paa           <-- Carte spéculaire (référencée par le RVMAT)
```

---

## Structure du fichier

Un fichier RVMAT a une structure cohérente. Voici un exemple complet et annoté :

```cpp
ambient[] = {1.0, 1.0, 1.0, 1.0};        // Multiplicateur de couleur ambiante (RGBA)
diffuse[] = {1.0, 1.0, 1.0, 1.0};        // Multiplicateur de couleur diffuse (RGBA)
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};  // Remplacement additif de la diffuse
emmisive[] = {0.0, 0.0, 0.0, 0.0};       // Couleur émissive (auto-illumination)
specular[] = {0.7, 0.7, 0.7, 1.0};       // Couleur de reflet spéculaire
specularPower = 80;                        // Netteté spéculaire (plus élevé = reflet plus concentré)
PixelShaderID = "Super";                   // Programme shader de pixels à utiliser
VertexShaderID = "Super";                  // Programme shader de sommets

class Stage1                               // Étape de texture : Normal map
{
    texture = "MyMod\data\my_item_nohq.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage2                               // Étape de texture : Carte diffuse/couleur
{
    texture = "MyMod\data\my_item_co.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage3                               // Étape de texture : Carte spéculaire/métallique
{
    texture = "MyMod\data\my_item_smdi.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};
```

### Propriétés de premier niveau

Elles sont déclarées avant les classes Stage et contrôlent le comportement global du matériau :

| Propriété | Type | Description |
|----------|------|-------------|
| `ambient[]` | float[4] | Multiplicateur de couleur de lumière ambiante. `{1,1,1,1}` = plein, `{0,0,0,0}` = pas d'ambiance. |
| `diffuse[]` | float[4] | Multiplicateur de couleur de lumière diffuse. Généralement `{1,1,1,1}`. |
| `forcedDiffuse[]` | float[4] | Remplacement additif de la diffuse. Généralement `{0,0,0,0}`. |
| `emmisive[]` | float[4] | Couleur d'auto-illumination. Des valeurs non nulles font briller la surface. Remarque : Bohemia utilise la faute d'orthographe `emmisive`, pas `emissive`. |
| `specular[]` | float[4] | Couleur et intensité du reflet spéculaire. |
| `specularPower` | float | Netteté des reflets spéculaires. Plage 1-200. Plus élevé = réflexion plus serrée et concentrée. |
| `PixelShaderID` | string | Nom du programme shader de pixels. |
| `VertexShaderID` | string | Nom du programme shader de sommets. |

---

## Types de shaders

Les valeurs de `PixelShaderID` et `VertexShaderID` déterminent quel pipeline de rendu traite le matériau. Les deux devraient généralement être réglés sur la même valeur.

### Shaders disponibles

| Shader | Cas d'utilisation | Étapes de texture requises |
|--------|----------|------------------------|
| **Super** | Surfaces opaques standard (armes, vêtements, objets) | Normale, Diffuse, Spéculaire/Métallique |
| **Multi** | Terrain multicouche et surfaces complexes | Plusieurs paires diffuse/normale |
| **Glass** | Surfaces transparentes et semi-transparentes | Diffuse avec alpha |
| **Water** | Surfaces d'eau avec réflexion et réfraction | Textures d'eau spéciales |
| **Terrain** | Surfaces de terrain au sol | Satellite, masque, couches de matériaux |
| **NormalMap** | Surface simplifiée avec normal map | Normale, Diffuse |
| **NormalMapSpecular** | Normal map avec spéculaire | Normale, Diffuse, Spéculaire |
| **Hair** | Rendu de cheveux de personnage | Diffuse avec alpha, translucidité spéciale |
| **Skin** | Peau de personnage avec diffusion sous-surfacique | Diffuse, Normale, Spéculaire |
| **AlphaTest** | Transparence à bords nets (feuillage, clôtures) | Diffuse avec alpha |
| **AlphaBlend** | Transparence lisse (verre, fumée) | Diffuse avec alpha |

### Shader Super (le plus courant)

Le shader **Super** est le shader de rendu physiquement réaliste standard utilisé pour la grande majorité des objets dans DayZ. Il attend trois étapes de texture :

```
Stage1 = Normal map (_nohq)
Stage2 = Carte diffuse/couleur (_co)
Stage3 = Carte spéculaire/métallique (_smdi)
```

Si vous créez un objet de mod (arme, vêtement, outil, conteneur), vous utiliserez presque toujours le shader Super.

### Shader Glass

Le shader **Glass** gère les surfaces transparentes. Il lit l'alpha de la texture diffuse pour déterminer la transparence :

```cpp
PixelShaderID = "Glass";
VertexShaderID = "Glass";

class Stage1
{
    texture = "MyMod\data\glass_nohq.paa";
    uvSource = "tex";
    class uvTransform { /* ... */ };
};

class Stage2
{
    texture = "MyMod\data\glass_ca.paa";    // Remarque : suffixe _ca pour couleur+alpha
    uvSource = "tex";
    class uvTransform { /* ... */ };
};
```

---

## Étapes de texture

Chaque classe `Stage` dans le RVMAT assigne une texture à une entrée spécifique du shader. Le numéro de l'étape détermine quel rôle joue la texture.

### Assignations d'étapes pour le shader Super

| Étape | Rôle de la texture | Suffixe typique | Description |
|-------|-------------|----------------|-------------|
| **Stage1** | Normal map | `_nohq` | Détails de surface, bosses, rainures |
| **Stage2** | Carte diffuse / couleur | `_co` ou `_ca` | Couleur de base de la surface |
| **Stage3** | Carte spéculaire / métallique | `_smdi` | Brillance, propriétés métalliques, détails |
| **Stage4** | Ombre ambiante | `_as` | Occlusion ambiante précalculée (optionnel) |
| **Stage5** | Carte macro | `_mc` | Variation de couleur à grande échelle (optionnel) |
| **Stage6** | Carte de détail | `_de` | Micro-détail en répétition (optionnel) |
| **Stage7** | Carte émissive / lumière | `_li` | Auto-illumination (optionnel) |

### Propriétés des étapes

Chaque étape contient :

```cpp
class Stage1
{
    texture = "path\to\texture.paa";    // Chemin relatif au lecteur P:
    uvSource = "tex";                    // Source UV : "tex" (UV du modèle) ou "tex1" (2e jeu d'UV)
    class uvTransform                    // Matrice de transformation UV
    {
        aside[] = {1.0, 0.0, 0.0};     // Échelle et direction de l'axe U
        up[] = {0.0, 1.0, 0.0};        // Échelle et direction de l'axe V
        dir[] = {0.0, 0.0, 0.0};       // Pas typiquement utilisé
        pos[] = {0.0, 0.0, 0.0};       // Décalage UV (translation)
    };
};
```

### Transformation UV pour la répétition

Pour répéter une texture (la faire se répéter sur une surface), modifiez les valeurs `aside` et `up` :

```cpp
class uvTransform
{
    aside[] = {4.0, 0.0, 0.0};     // Répéter 4x horizontalement
    up[] = {0.0, 4.0, 0.0};        // Répéter 4x verticalement
    dir[] = {0.0, 0.0, 0.0};
    pos[] = {0.0, 0.0, 0.0};
};
```

Ceci est couramment utilisé pour les matériaux de terrain et les surfaces de bâtiments où la même texture de détail se répète.

---

## Propriétés des matériaux

### Contrôle spéculaire

Les valeurs `specular[]` et `specularPower` fonctionnent ensemble pour définir la brillance apparente d'une surface :

| Type de matériau | specular[] | specularPower | Apparence |
|---------------|-----------|---------------|------------|
| **Plastique mat** | `{0.1, 0.1, 0.1, 1.0}` | 10 | Terne, reflet large |
| **Métal usé** | `{0.3, 0.3, 0.3, 1.0}` | 40 | Brillance modérée |
| **Métal poli** | `{0.8, 0.8, 0.8, 1.0}` | 120 | Reflet vif et serré |
| **Chrome** | `{1.0, 1.0, 1.0, 1.0}` | 200 | Réflexion miroir |
| **Caoutchouc** | `{0.02, 0.02, 0.02, 1.0}` | 5 | Presque aucun reflet |
| **Surface mouillée** | `{0.6, 0.6, 0.6, 1.0}` | 80 | Reflet lisse, moyennement net |

### Émissif (auto-illumination)

Pour faire briller une surface (LED, écrans, éléments lumineux) :

```cpp
emmisive[] = {0.2, 0.8, 0.2, 1.0};   // Lueur verte
```

La couleur émissive est ajoutée à la couleur finale du pixel indépendamment de l'éclairage. Une carte émissive `_li` dans une étape de texture ultérieure peut masquer quelles parties de la surface brillent.

### Rendu double face

Pour les surfaces fines qui devraient être visibles des deux côtés (drapeaux, feuillage, tissu) :

```cpp
renderFlags[] = {"noZWrite", "noAlpha", "twoSided"};
```

Ce n'est pas une propriété RVMAT de premier niveau mais est configuré dans config.cpp ou via les paramètres du shader du matériau selon le cas d'utilisation.

---

## Niveaux de santé (échange de matériaux par dégâts)

Les objets DayZ se dégradent avec le temps. Le moteur prend en charge l'échange automatique de matériaux à différents seuils de dégâts, défini dans `config.cpp` à l'aide du tableau `healthLevels[]`. Cela crée la progression visuelle de l'état neuf à l'état ruiné.

### Structure de healthLevels[]

```cpp
class MyItem: Inventory_Base
{
    // ... autre config ...

    healthLevels[] =
    {
        // {seuil_santé, {"jeu_de_matériaux"}},

        {1.0, {"MyMod\data\my_item.rvmat"}},           // Neuf (100% santé)
        {0.7, {"MyMod\data\my_item_worn.rvmat"}},       // Usé (70% santé)
        {0.5, {"MyMod\data\my_item_damaged.rvmat"}},     // Endommagé (50% santé)
        {0.3, {"MyMod\data\my_item_badly_damaged.rvmat"}},// Très endommagé (30% santé)
        {0.0, {"MyMod\data\my_item_ruined.rvmat"}}       // Ruiné (0% santé)
    };
};
```

### Fonctionnement

1. Le moteur surveille la valeur de santé de l'objet (0.0 à 1.0).
2. Quand la santé descend en dessous d'un seuil, le moteur échange le matériau pour le RVMAT correspondant.
3. Chaque RVMAT peut référencer des textures différentes -- généralement des variantes progressivement plus endommagées.
4. L'échange est automatique. Aucun code script n'est nécessaire.

### Progression des textures de dégâts

Une progression de dégâts typique :

| Niveau | Santé | Changement visuel |
|-------|--------|---------------|
| **Neuf** | 1.0 | Apparence propre, sortie d'usine |
| **Usé** | 0.7 | Légères éraflures, rayures mineures |
| **Endommagé** | 0.5 | Rayures visibles, décoloration, saleté |
| **Très endommagé** | 0.3 | Usure importante, rouille, fissures, peinture écaillée |
| **Ruiné** | 0.0 | Apparence sévèrement dégradée, cassée |

### Créer des matériaux de dégâts

Pour chaque niveau de dégâts, créez un RVMAT séparé qui référence des textures progressivement plus endommagées :

```
data/
  my_item.rvmat                    --> my_item_co.paa (propre)
  my_item_worn.rvmat               --> my_item_worn_co.paa (dégâts légers)
  my_item_damaged.rvmat            --> my_item_damaged_co.paa (dégâts modérés)
  my_item_badly_damaged.rvmat      --> my_item_badly_damaged_co.paa (dégâts lourds)
  my_item_ruined.rvmat             --> my_item_ruined_co.paa (détruit)
```

> **Astuce :** Vous n'avez pas toujours besoin de textures uniques pour chaque niveau de dégâts. Une optimisation courante consiste à partager les normal maps et les cartes spéculaires entre tous les niveaux et à ne changer que la texture diffuse :
>
> ```
> my_item.rvmat           --> my_item_co.paa
> my_item_worn.rvmat      --> my_item_co.paa  (même diffuse, spéculaire réduit)
> my_item_damaged.rvmat   --> my_item_damaged_co.paa
> my_item_ruined.rvmat    --> my_item_ruined_co.paa
> ```

### Utiliser les matériaux de dégâts vanilla

DayZ fournit un ensemble de matériaux génériques de superposition de dégâts qui peuvent être utilisés si vous ne souhaitez pas créer de textures de dégâts personnalisées :

```cpp
healthLevels[] =
{
    {1.0, {"MyMod\data\my_item.rvmat"}},
    {0.7, {"DZ\data\data\default_worn.rvmat"}},
    {0.5, {"DZ\data\data\default_damaged.rvmat"}},
    {0.3, {"DZ\data\data\default_badly_damaged.rvmat"}},
    {0.0, {"DZ\data\data\default_ruined.rvmat"}}
};
```

---

## Comment les matériaux référencent les textures

La connexion entre modèles, matériaux et textures forme une chaîne :

```
Modèle P3D (Object Builder)
  |
  |--> Face assignée à un RVMAT
         |
         |--> Stage1.texture = "path\to\normal_nohq.paa"
         |--> Stage2.texture = "path\to\color_co.paa"
         |--> Stage3.texture = "path\to\specular_smdi.paa"
```

### Résolution des chemins

Tous les chemins de textures dans les fichiers RVMAT sont relatifs à la racine du **lecteur P:** :

```cpp
// Correct : relatif au lecteur P:
texture = "MyMod\data\textures\my_item_co.paa";

// Cela signifie : P:\MyMod\data\textures\my_item_co.paa
```

Une fois empaqueté dans un PBO, le préfixe du chemin doit correspondre au préfixe du PBO :

```
Préfixe PBO : MyMod
Chemin interne : data\textures\my_item_co.paa
Référence complète : MyMod\data\textures\my_item_co.paa
```

### Remplacement par hiddenSelectionsMaterials

Config.cpp peut remplacer quel matériau est appliqué à une sélection nommée à l'exécution :

```cpp
class MyItem_Green: MyItem
{
    hiddenSelections[] = {"camo"};
    hiddenSelectionsTextures[] = {"MyMod\data\my_item_green_co.paa"};
    hiddenSelectionsMaterials[] = {"MyMod\data\my_item_green.rvmat"};
};
```

Cela permet de créer des variantes d'objets (schémas de couleurs, motifs de camouflage) qui partagent le même modèle P3D mais utilisent des matériaux différents.

---

## Créer un RVMAT à partir de zéro

### Étape par étape : objet opaque standard

1. **Créez vos fichiers de texture :**
   - `my_item_co.paa` (couleur diffuse)
   - `my_item_nohq.paa` (normal map)
   - `my_item_smdi.paa` (spéculaire/métallique)

2. **Créez le fichier RVMAT** (texte brut) :

```cpp
ambient[] = {1.0, 1.0, 1.0, 1.0};
diffuse[] = {1.0, 1.0, 1.0, 1.0};
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};
emmisive[] = {0.0, 0.0, 0.0, 0.0};
specular[] = {0.5, 0.5, 0.5, 1.0};
specularPower = 60;
PixelShaderID = "Super";
VertexShaderID = "Super";

class Stage1
{
    texture = "MyMod\data\my_item_nohq.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage2
{
    texture = "MyMod\data\my_item_co.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage3
{
    texture = "MyMod\data\my_item_smdi.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};
```

3. **Assignez dans Object Builder :**
   - Ouvrez votre modèle P3D.
   - Sélectionnez les faces dans le LOD de résolution.
   - Clic droit --> **Face Properties**.
   - Parcourez jusqu'à votre fichier RVMAT.

4. **Testez en jeu** via le file patching ou un build PBO.

---

## Exemples réels

### DayZ-Samples Test_ClothingRetexture

Les DayZ-Samples officiels incluent un exemple `Test_ClothingRetexture` qui démontre le flux de travail standard des matériaux :

```cpp
// Depuis l'exemple de retexture DayZ-Samples
ambient[] = {1.0, 1.0, 1.0, 1.0};
diffuse[] = {1.0, 1.0, 1.0, 1.0};
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};
emmisive[] = {0.0, 0.0, 0.0, 0.0};
specular[] = {0.3, 0.3, 0.3, 1.0};
specularPower = 50;
PixelShaderID = "Super";
VertexShaderID = "Super";

class Stage1
{
    texture = "DZ_Samples\Test_ClothingRetexture\data\tshirt_nohq.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage2
{
    texture = "DZ_Samples\Test_ClothingRetexture\data\tshirt_co.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage3
{
    texture = "DZ_Samples\Test_ClothingRetexture\data\tshirt_smdi.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};
```

### Matériau métallique d'arme

Un canon d'arme poli avec une forte réponse métallique :

```cpp
ambient[] = {1.0, 1.0, 1.0, 1.0};
diffuse[] = {1.0, 1.0, 1.0, 1.0};
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};
emmisive[] = {0.0, 0.0, 0.0, 0.0};
specular[] = {0.9, 0.9, 0.9, 1.0};        // Spéculaire élevé pour le métal
specularPower = 150;                        // Reflet serré et concentré
PixelShaderID = "Super";
VertexShaderID = "Super";

// ... Définitions des étapes avec les textures d'arme ...
```

### Matériau émissif (écran lumineux)

Un matériau pour un écran d'appareil qui émet de la lumière :

```cpp
ambient[] = {1.0, 1.0, 1.0, 1.0};
diffuse[] = {1.0, 1.0, 1.0, 1.0};
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};
emmisive[] = {0.05, 0.3, 0.05, 1.0};      // Lueur verte douce
specular[] = {0.5, 0.5, 0.5, 1.0};
specularPower = 80;
PixelShaderID = "Super";
VertexShaderID = "Super";

// ... Définitions des étapes incluant la carte émissive _li dans Stage7 ...
```

---

## Erreurs courantes

### 1. Mauvais ordre des étapes

**Symptôme :** La texture apparaît brouillée, la normal map s'affiche comme couleur, la couleur s'affiche comme des bosses.
**Correction :** Assurez-vous que Stage1 = normale, Stage2 = diffuse, Stage3 = spéculaire (pour le shader Super).

### 2. Mauvaise orthographe de `emmisive`

**Symptôme :** L'émissif ne fonctionne pas.
**Correction :** Bohemia utilise `emmisive` (double m, un seul s). Utiliser l'orthographe anglaise correcte `emissive` ne fonctionnera pas. C'est une particularité historique connue.

### 3. Chemins de textures incorrects

**Symptôme :** Le modèle apparaît avec le matériau gris par défaut ou magenta.
**Correction :** Vérifiez que les chemins de textures dans le RVMAT correspondent exactement aux emplacements des fichiers relatifs au lecteur P:. Les chemins utilisent des antislashs. Vérifiez la casse -- certains systèmes sont sensibles à la casse.

### 4. Assignation RVMAT manquante dans le P3D

**Symptôme :** Le modèle se rend sans matériau (gris plat ou shader par défaut).
**Correction :** Ouvrez le modèle dans Object Builder, sélectionnez les faces et assignez le RVMAT via **Face Properties**.

### 5. Utilisation du mauvais shader pour les objets transparents

**Symptôme :** La texture transparente apparaît opaque, ou toute la surface disparaît.
**Correction :** Utilisez le shader `Glass`, `AlphaTest` ou `AlphaBlend` au lieu de `Super` pour les surfaces transparentes. Utilisez des textures avec le suffixe `_ca` et des canaux alpha appropriés.

---

## Bonnes pratiques

1. **Partez d'un exemple fonctionnel.** Copiez un RVMAT depuis DayZ-Samples ou un objet vanilla et modifiez-le. Partir de zéro invite aux fautes de frappe.

2. **Gardez les matériaux et les textures ensemble.** Stockez le RVMAT dans le même répertoire `data/` que ses textures. Cela rend la relation évidente et simplifie la gestion des chemins.

3. **Utilisez le shader Super sauf si vous avez une raison de ne pas le faire.** Il gère 95% des cas d'utilisation correctement.

4. **Créez des matériaux de dégâts même pour les objets simples.** Les joueurs remarquent quand les objets ne se dégradent pas visuellement. Au minimum, utilisez les matériaux de dégâts vanilla par défaut pour les niveaux de santé inférieurs.

5. **Testez le spéculaire en jeu, pas seulement dans Object Builder.** L'éclairage de l'éditeur et l'éclairage en jeu produisent des résultats très différents. Ce qui semble parfait dans Object Builder peut être trop brillant ou trop terne sous l'éclairage dynamique de DayZ.

6. **Documentez vos paramètres de matériaux.** Quand vous trouvez des valeurs spéculaires/puissance qui fonctionnent bien pour un type de surface, notez-les. Vous réutiliserez ces paramètres sur de nombreux objets.

---

## Observé dans les mods réels

| Patron | Mod | Détail |
|---------|-----|--------|
| RVMAT de dégâts partagé entre tous les objets | Expansion (modules multiples) | Réutilise un ensemble commun de RVMAT par niveau de dégâts (`worn`, `damaged`, `ruined`) au lieu de variantes par objet pour réduire le nombre de fichiers |
| Matériaux émissifs pour la lueur d'écran | COT (Admin Tools) | Utilise des valeurs `emmisive[]` dans le RVMAT pour les effets d'écran de tablette/appareil visibles la nuit |
| Shader Glass pour les vitres de véhicules | DayZ-Samples (Test_Vehicle) | Démontre `PixelShaderID = "Glass"` avec des textures `_ca` pour les panneaux de pare-brise transparents |

---

## Compatibilité et impact

- **Multi-Mod :** Les chemins RVMAT sont par PBO et n'entrent pas en collision entre les mods. Cependant, les remplacements `hiddenSelectionsMaterials[]` dans config.cpp suivent la priorité du dernier chargé, donc deux mods remplaçant le matériau du même objet vanilla entreront en conflit.
- **Performance :** Chaque RVMAT unique référencé sur un seul modèle P3D crée un appel de dessin séparé. Consolider les faces sous moins de matériaux réduit la charge GPU, surtout pour les scènes complexes.
- **Version :** Le format texte RVMAT et les noms de shaders (Super, Glass, AlphaTest) sont stables depuis DayZ 1.0. Aucun changement structurel n'a été introduit dans les mises à jour récentes.

---

## Navigation

| Précédent | Haut | Suivant |
|----------|----|------|
| [4.2 Modèles 3D](02-models.md) | [Partie 4 : Formats de fichiers et outils DayZ](01-textures.md) | [4.4 Audio](04-audio.md) |
