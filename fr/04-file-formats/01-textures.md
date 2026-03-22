# Chapitre 4.1 : Textures (.paa, .edds, .tga)

[Accueil](../README.md) | **Textures** | [Suivant : Modèles 3D >>](02-models.md)

---

## Introduction

Chaque surface que vous voyez dans DayZ -- skins d'armes, vêtements, terrain, icônes d'interface -- est définie par des fichiers de texture. Le moteur utilise un format compressé propriétaire appelé **PAA** à l'exécution, mais pendant le développement vous travaillez avec plusieurs formats sources qui sont convertis lors du processus de build. Comprendre ces formats, les conventions de nommage qui les lient aux matériaux, et les règles de résolution imposées par le moteur est fondamental pour créer du contenu visuel pour les mods DayZ.

Ce chapitre couvre tous les formats de texture que vous rencontrerez, le système de suffixes de nommage qui indique au moteur comment interpréter chaque texture, les exigences de résolution et de canal alpha, et le workflow pratique de conversion entre formats.

---

## Table des matières

- [Vue d'ensemble des formats de texture](#vue-densemble-des-formats-de-texture)
- [Format PAA](#format-paa)
- [Format EDDS](#format-edds)
- [Format TGA](#format-tga)
- [Format PNG](#format-png)
- [Conventions de nommage des textures](#conventions-de-nommage-des-textures)
- [Exigences de résolution](#exigences-de-résolution)
- [Support du canal alpha](#support-du-canal-alpha)
- [Conversion entre formats](#conversion-entre-formats)
- [Qualité et compression des textures](#qualité-et-compression-des-textures)
- [Exemples concrets](#exemples-concrets)
- [Erreurs courantes](#erreurs-courantes)
- [Bonnes pratiques](#bonnes-pratiques)

---

## Vue d'ensemble des formats de texture

DayZ utilise quatre formats de texture à différentes étapes du pipeline de développement :

| Format | Extension | Rôle | Support alpha | Utilisé à |
|--------|-----------|------|---------------|-----------|
| **PAA** | `.paa` | Format de jeu à l'exécution (compressé) | Oui | Build final, livré dans les PBOs |
| **EDDS** | `.edds` | Variante DDS d'éditeur/intermédiaire | Oui | Aperçu Object Builder, conversion automatique |
| **TGA** | `.tga` | Artwork source non compressé | Oui | Espace de travail de l'artiste, export Photoshop/GIMP |
| **PNG** | `.png` | Format source portable | Oui | Textures d'UI, outils externes |

Le workflow général est : **Source (TGA/PNG) --> Conversion DayZ Tools --> PAA (prêt pour le jeu)**.

---

## Format PAA

**PAA** (PAcked Arma) est le format de texture compressé natif utilisé par le moteur Enfusion à l'exécution. Chaque texture livrée dans un PBO doit être au format PAA (ou sera convertie lors de la binarisation).

### Caractéristiques

- **Compressé :** Utilise la compression DXT1, DXT5 ou ARGB8888 en interne selon la présence du canal alpha et les paramètres de qualité.
- **Mipmappé :** Les fichiers PAA contiennent une chaîne complète de mipmaps, générée automatiquement lors de la conversion. C'est critique pour les performances de rendu -- le moteur sélectionne le niveau de mip approprié en fonction de la distance.
- **Dimensions puissance de deux :** Le moteur exige que les textures PAA aient des dimensions qui sont des puissances de 2 (256, 512, 1024, 2048, 4096).
- **Lecture seule à l'exécution :** Le moteur charge les fichiers PAA directement depuis les PBOs. Vous ne modifiez jamais un fichier PAA -- vous éditez la source et reconvertissez.

### Types de compression interne

| Type | Alpha | Qualité | Cas d'utilisation |
|------|-------|---------|-------------------|
| **DXT1** | Non (1-bit) | Bon, ratio 6:1 | Textures opaques, terrain |
| **DXT5** | Complet 8-bit | Bon, ratio 4:1 | Textures avec alpha lisse (verre, feuillage) |
| **ARGB4444** | Complet 4-bit | Moyen | Textures d'UI, petites icônes |
| **ARGB8888** | Complet 8-bit | Sans perte | Débogage, qualité maximale (grande taille de fichier) |
| **AI88** | Niveaux de gris + alpha | Bon | Normal maps, masques en niveaux de gris |

### Quand vous voyez des fichiers PAA

- À l'intérieur des données vanilla du jeu décompressées (répertoire `dta/` et PBOs d'addons)
- En sortie de conversion TexView2
- En sortie de Binarize lors du traitement des textures sources
- Dans le PBO final de votre mod après le build

---

## Format EDDS

**EDDS** est un format de texture intermédiaire utilisé principalement par **Object Builder** de DayZ et les outils d'édition. C'est essentiellement une variante du format standard DirectDraw Surface (DDS) avec des métadonnées spécifiques au moteur.

### Caractéristiques

- **Format d'aperçu :** Object Builder peut afficher les textures EDDS directement, ce qui les rend utiles pendant la création de modèles.
- **Conversion automatique en PAA :** Quand vous lancez Binarize ou AddonBuilder (sans `-packonly`), les fichiers EDDS dans votre arbre source sont automatiquement convertis en PAA.
- **Plus gros que PAA :** Les fichiers EDDS ne sont pas optimisés pour la distribution -- ils existent pour la commodité de l'éditeur.
- **Format DayZ-Samples :** Les DayZ-Samples officiels fournis par Bohemia utilisent extensivement les textures EDDS.

### Workflow avec EDDS

```
L'artiste crée une source TGA/PNG
    --> Le plugin DDS de Photoshop exporte en EDDS pour l'aperçu
        --> Object Builder affiche l'EDDS sur le modèle
            --> Binarize convertit l'EDDS en PAA pour le PBO
```

> **Astuce :** Vous pouvez ignorer complètement EDDS si vous préférez. Convertissez vos textures sources directement en PAA avec TexView2 et référencez les chemins PAA dans vos matériaux. EDDS est une commodité, pas une obligation.

---

## Format TGA

**TGA** (Truevision TGA / Targa) est le format source non compressé traditionnel pour le travail de texture DayZ. De nombreuses textures vanilla DayZ ont été originalement créées sous forme de fichiers TGA.

### Caractéristiques

- **Non compressé :** Pas de perte de qualité, profondeur de couleur complète (24-bit ou 32-bit avec alpha).
- **Fichiers volumineux :** Un TGA 2048x2048 avec alpha fait environ 16 Mo.
- **Alpha dans un canal dédié :** TGA supporte un canal alpha 8-bit correct (TGA 32-bit), qui correspond directement à la transparence dans PAA.
- **Compatible TexView2 :** TexView2 peut ouvrir les fichiers TGA directement et les convertir en PAA.

### Quand utiliser TGA

- Comme fichier source maître pour les textures que vous créez de zéro.
- Lors de l'export depuis Substance Painter ou Photoshop pour DayZ.
- Quand la documentation DayZ-Samples ou les tutoriels communautaires spécifient TGA comme format source.

### Paramètres d'export TGA

Lors de l'export TGA pour la conversion DayZ :

- **Profondeur de bits :** 32-bit (si alpha nécessaire) ou 24-bit (textures opaques)
- **Compression :** Aucune (non compressé)
- **Orientation :** Origine en bas à gauche (orientation TGA standard)
- **Résolution :** Doit être une puissance de 2 (voir [Exigences de résolution](#exigences-de-résolution))

---

## Format PNG

**PNG** (Portable Network Graphics) est largement supporté et peut être utilisé comme format source alternatif, particulièrement pour les textures d'UI.

### Caractéristiques

- **Compression sans perte :** Plus petit que TGA mais conserve la qualité intégrale.
- **Canal alpha complet :** PNG 32-bit supporte l'alpha 8-bit.
- **Compatible TexView2 :** TexView2 peut ouvrir et convertir les PNG en PAA.
- **Adapté à l'UI :** De nombreux imagesets et icônes d'UI dans les mods utilisent PNG comme format source.

### Quand utiliser PNG

- **Textures et icônes d'UI :** PNG est le choix pratique pour les imagesets et les éléments de HUD.
- **Retexturations simples :** Quand vous n'avez besoin que d'une carte de couleur/diffuse sans alpha complexe.
- **Workflows multi-outils :** PNG est universellement supporté dans les éditeurs d'images, outils web et scripts.

> **Note :** PNG n'est pas un format source officiel Bohemia -- ils préfèrent TGA. Cependant, les outils de conversion gèrent PNG sans problème et de nombreux moddeurs l'utilisent avec succès.

---

## Conventions de nommage des textures

DayZ utilise un système de suffixes strict pour identifier le rôle de chaque texture. Le moteur et les matériaux référencent les textures par nom de fichier, et le suffixe indique à la fois au moteur et aux autres moddeurs quel type de données la texture contient.

### Suffixes requis

| Suffixe | Nom complet | But | Format typique |
|---------|-------------|-----|----------------|
| `_co` | **Color / Diffuse** | La couleur de base (albedo) d'une surface | RGB, alpha optionnel |
| `_nohq` | **Normal Map (High Quality)** | Normales de détail de surface, définit les bosses et rainures | RGB (normale en espace tangent) |
| `_smdi` | **Specular / Metallic / Detail Index** | Contrôle la brillance et les propriétés métalliques | Les canaux RGB encodent des données séparées |
| `_ca` | **Color with Alpha** | Texture de couleur où le canal alpha porte des données significatives (transparence, masque) | RGBA |
| `_as` | **Ambient Shadow** | Occlusion ambiante / bake d'ombres | Niveaux de gris |
| `_mc` | **Macro** | Variation de couleur à grande échelle visible à distance | RGB |
| `_li` | **Light / Emissive** | Carte d'auto-illumination (parties brillantes) | RGB |
| `_no` | **Normal Map (Standard)** | Variante de normal map de qualité inférieure | RGB |
| `_mca` | **Macro with Alpha** | Texture macro avec canal alpha | RGBA |
| `_de` | **Detail** | Texture de détail en tuile pour variation de surface de près | RGB |

### Convention de nommage en pratique

Un seul objet possède typiquement plusieurs textures, partageant toutes un nom de base :

```
data/
  my_rifle_co.paa          <-- Couleur de base (ce que vous voyez)
  my_rifle_nohq.paa        <-- Normal map (bosses de surface)
  my_rifle_smdi.paa         <-- Spéculaire/métallique (brillance)
  my_rifle_as.paa           <-- Ombre ambiante (AO baked)
  my_rifle_ca.paa           <-- Couleur avec alpha (si transparence nécessaire)
```

### Les canaux _smdi

La texture spéculaire/métallique/détail emballe trois flux de données dans une seule image RGB :

| Canal | Données | Plage | Effet |
|-------|---------|-------|-------|
| **R** | Métallique | 0-255 | 0 = non-métal, 255 = métal complet |
| **G** | Rugosité (spéculaire inversé) | 0-255 | 0 = rugueux/mat, 255 = lisse/brillant |
| **B** | Indice de détail / AO | 0-255 | Tuilage de détail ou occlusion ambiante |

### Les canaux _nohq

Les normal maps dans DayZ utilisent l'encodage en espace tangent :

| Canal | Données |
|-------|---------|
| **R** | Normale axe X (gauche-droite) |
| **G** | Normale axe Y (haut-bas) |
| **B** | Normale axe Z (vers le spectateur) |
| **A** | Puissance spéculaire (optionnel, dépend du matériau) |

---

## Exigences de résolution

Le moteur Enfusion exige que toutes les textures aient des **dimensions puissance de deux**. La largeur et la hauteur doivent indépendamment être une puissance de 2, mais elles n'ont pas besoin d'être égales (les textures non carrées sont valides).

### Dimensions valides

| Taille | Utilisation typique |
|--------|---------------------|
| **64x64** | Petites icônes, éléments d'UI |
| **128x128** | Petites icônes, miniatures d'inventaire |
| **256x256** | Panneaux d'UI, petites textures d'objets |
| **512x512** | Textures d'objets standard, vêtements |
| **1024x1024** | Armes, vêtements détaillés, pièces de véhicules |
| **2048x2048** | Armes haute définition, modèles de personnages |
| **4096x4096** | Textures de terrain, grandes textures de véhicules |

### Textures non carrées

Les textures non carrées puissance de deux sont valides :

```
256x512    -- Valide (les deux sont des puissances de 2)
512x1024   -- Valide
1024x2048  -- Valide
300x512    -- INVALIDE (300 n'est pas une puissance de 2)
```

### Recommandations de résolution

- **Armes :** 2048x2048 pour le corps principal, 1024x1024 pour les accessoires.
- **Vêtements :** 1024x1024 ou 2048x2048 selon la couverture de surface.
- **Icônes d'UI :** 128x128 ou 256x256 pour les icônes d'inventaire, 64x64 pour les éléments de HUD.
- **Terrain :** 4096x4096 pour les cartes satellites, 512x512 ou 1024x1024 pour les tuiles de matériaux.
- **Normal maps :** Même résolution que la texture de couleur correspondante.
- **Cartes SMDI :** Même résolution que la texture de couleur correspondante.

> **Avertissement :** Si une texture a des dimensions non puissance de deux, le moteur refusera de la charger ou affichera une texture d'erreur magenta. TexView2 affichera un avertissement lors de la conversion.

---

## Support du canal alpha

Le canal alpha dans une texture porte des données supplémentaires au-delà de la couleur. La façon dont il est interprété dépend du suffixe de la texture et du shader du matériau.

### Rôles du canal alpha

| Suffixe | Interprétation de l'alpha |
|---------|---------------------------|
| `_co` | Généralement inutilisé ; si présent, peut définir la transparence pour des matériaux simples |
| `_ca` | Masque de transparence (0 = totalement transparent, 255 = totalement opaque) |
| `_nohq` | Carte de puissance spéculaire (plus élevé = reflet spéculaire plus net) |
| `_smdi` | Généralement inutilisé |
| `_li` | Masque d'intensité émissive |

### Créer des textures avec alpha

Dans votre éditeur d'images (Photoshop, GIMP, Krita) :

1. Créez le contenu RGB normalement.
2. Ajoutez un canal alpha.
3. Peignez en blanc (255) là où vous voulez une opacité/effet complet, en noir (0) là où vous n'en voulez pas.
4. Exportez en TGA 32-bit ou PNG.
5. Convertissez en PAA avec TexView2 -- il détectera automatiquement le canal alpha.

### Vérification de l'alpha dans TexView2

Ouvrez le PAA dans TexView2 et utilisez les boutons d'affichage des canaux :

- **RGBA** -- Affiche le composite final
- **RGB** -- Affiche la couleur uniquement
- **A** -- Affiche le canal alpha uniquement (blanc = opaque, noir = transparent)

---

## Conversion entre formats

### TexView2 (outil principal)

**TexView2** est inclus avec DayZ Tools et est l'utilitaire standard de conversion de textures.

**Ouverture d'un fichier :**
1. Lancez TexView2 depuis DayZ Tools ou directement depuis `DayZ Tools\Bin\TexView2\TexView2.exe`.
2. Ouvrez votre fichier source (TGA, PNG ou EDDS).
3. Vérifiez que l'image semble correcte et vérifiez les dimensions.

**Conversion en PAA :**
1. Ouvrez la texture source dans TexView2.
2. Allez dans **File --> Save As**.
3. Sélectionnez **PAA** comme format de sortie.
4. Choisissez le type de compression :
   - **DXT1** pour les textures opaques (pas d'alpha nécessaire)
   - **DXT5** pour les textures avec transparence alpha
   - **ARGB4444** pour les petites textures d'UI où la taille de fichier compte
5. Cliquez sur **Save**.

**Conversion par lot via ligne de commande :**

```bash
# Convertir un seul TGA en PAA
"P:\DayZ Tools\Bin\TexView2\TexView2.exe" -i "source.tga" -o "output.paa"

# TexView2 sélectionnera automatiquement la compression basée sur la présence du canal alpha
```

### Binarize (automatisé)

Quand Binarize traite le répertoire source de votre mod, il convertit automatiquement tous les formats de texture reconnus (TGA, PNG, EDDS) en PAA. Cela se fait dans le cadre du pipeline AddonBuilder.

**Flux de conversion Binarize :**
```
source/mod_name/data/texture_co.tga
    --> Binarize détecte le TGA
        --> Convertit en PAA avec sélection automatique de la compression
            --> Sortie : build/mod_name/data/texture_co.paa
```

### Tableau de conversion manuelle

| De | Vers | Outil | Notes |
|----|------|-------|-------|
| TGA --> PAA | TexView2 | Workflow standard |
| PNG --> PAA | TexView2 | Fonctionne de manière identique au TGA |
| EDDS --> PAA | TexView2 ou Binarize | Automatique pendant le build |
| PAA --> TGA | TexView2 (Save As TGA) | Pour éditer des textures existantes |
| PAA --> PNG | TexView2 (Save As PNG) | Pour extraire vers un format portable |
| PSD --> TGA/PNG | Photoshop/GIMP | Export depuis l'éditeur, puis conversion |

---

## Qualité et compression des textures

### Sélection du type de compression

| Scénario | Compression recommandée | Raison |
|----------|------------------------|--------|
| Diffuse opaque (`_co`) | DXT1 | Meilleur ratio, pas d'alpha nécessaire |
| Diffuse transparent (`_ca`) | DXT5 | Support alpha complet |
| Normal maps (`_nohq`) | DXT5 | Le canal alpha porte la puissance spéculaire |
| Cartes spéculaires (`_smdi`) | DXT1 | Généralement opaque, canaux RGB uniquement |
| Textures d'UI | ARGB4444 ou DXT5 | Petite taille, bords nets |
| Cartes émissives (`_li`) | DXT1 ou DXT5 | DXT5 si l'alpha porte l'intensité |

### Qualité vs. taille de fichier

```
Format        2048x2048 taille approx.
-----------------------------------------
ARGB8888      16.0 Mo    (non compressé)
DXT5           5.3 Mo    (compression 4:1)
DXT1           2.7 Mo    (compression 6:1)
ARGB4444       8.0 Mo    (compression 2:1)
```

### Paramètres de qualité en jeu

Les joueurs peuvent ajuster la qualité des textures dans les paramètres vidéo de DayZ. Le moteur sélectionne des niveaux de mip inférieurs quand la qualité est réduite, donc vos textures apparaîtront progressivement plus floues aux réglages inférieurs. C'est automatique -- vous n'avez pas besoin de créer des niveaux de qualité séparés.

---

## Exemples concrets

### Jeu de textures d'arme

Un mod d'arme typique contient ces fichiers de texture :

```
MyMod_Weapons/data/weapons/m4a1/
  my_weapon_co.paa           <-- 2048x2048, DXT1, couleur de base
  my_weapon_nohq.paa         <-- 2048x2048, DXT5, normal map
  my_weapon_smdi.paa          <-- 2048x2048, DXT1, spéculaire/métallique
  my_weapon_as.paa            <-- 1024x1024, DXT1, ombre ambiante
```

Le fichier matériau (`.rvmat`) référence ces textures et les assigne aux étapes de shader.

### Texture d'UI (source imageset)

```
MyFramework/data/gui/icons/
  my_icons_co.paa           <-- 512x512, ARGB4444, atlas de sprites
```

Les textures d'UI sont souvent empaquetées dans un seul atlas (imageset) et référencées par nom dans les fichiers layout. La compression ARGB4444 est courante pour l'UI car elle préserve des bords nets tout en gardant des tailles de fichier réduites.

### Textures de terrain

```
terrain/
  grass_green_co.paa         <-- 1024x1024, DXT1, couleur en tuile
  grass_green_nohq.paa       <-- 1024x1024, DXT5, normale en tuile
  grass_green_smdi.paa        <-- 1024x1024, DXT1, spéculaire en tuile
  grass_green_mc.paa          <-- 512x512, DXT1, variation macro
  grass_green_de.paa          <-- 512x512, DXT1, détail en tuile
```

Les textures de terrain se répètent sur le paysage. La texture macro `_mc` ajoute une variation de couleur à grande échelle pour éviter la répétition.

---

## Erreurs courantes

### 1. Dimensions non puissance de deux

**Symptôme :** Texture magenta en jeu, avertissements de TexView2.
**Solution :** Redimensionnez votre source à la puissance de 2 la plus proche avant de convertir.

### 2. Suffixe manquant

**Symptôme :** Le matériau ne trouve pas la texture, ou elle s'affiche incorrectement.
**Solution :** Incluez toujours le suffixe approprié (`_co`, `_nohq`, etc.) dans le nom de fichier.

### 3. Mauvaise compression pour l'alpha

**Symptôme :** La transparence apparaît en blocs ou binaire (activé/désactivé sans gradient).
**Solution :** Utilisez DXT5 au lieu de DXT1 pour les textures nécessitant des gradients alpha lisses.

### 4. Oubli des mipmaps

**Symptôme :** La texture est belle de près mais scintille/miroite à distance.
**Solution :** Les fichiers PAA générés par TexView2 incluent automatiquement les mipmaps. Si vous utilisez un outil non standard, assurez-vous que la génération de mipmaps est activée.

### 5. Format de normal map incorrect

**Symptôme :** L'éclairage sur le modèle apparaît inversé ou plat.
**Solution :** Assurez-vous que votre normal map est au format espace tangent avec la convention d'axe Y style DirectX (canal vert : haut = plus clair). Certains outils exportent au style OpenGL (Y inversé) -- vous devez inverser le canal vert.

### 6. Discordance de chemin après conversion

**Symptôme :** Le modèle ou matériau affiche du magenta parce qu'il référence un chemin `.tga` mais le PBO contient `.paa`.
**Solution :** Les matériaux doivent référencer le chemin final `.paa`. Binarize gère automatiquement le remapping des chemins, mais si vous empaquetez avec `-packonly` (sans binarisation), vous devez vous assurer que les chemins correspondent exactement.

---

## Bonnes pratiques

1. **Gardez les fichiers sources sous contrôle de version.** Stockez les masters TGA/PNG aux côtés de votre mod. Les fichiers PAA sont des sorties générées -- ce sont les sources qui comptent.

2. **Adaptez la résolution à l'importance.** Un fusil que le joueur regarde pendant des heures mérite du 2048x2048. Une boîte de conserve au fond d'une étagère peut utiliser du 512x512.

3. **Fournissez toujours une normal map.** Même une normal map plate (remplissage uni 128, 128, 255) est mieux que rien -- les normal maps manquantes causent des erreurs de matériau.

4. **Nommez de manière cohérente.** Un nom de base, plusieurs suffixes : `myitem_co.paa`, `myitem_nohq.paa`, `myitem_smdi.paa`. Ne mélangez jamais les schémas de nommage.

5. **Prévisualisez dans TexView2 avant le build.** Ouvrez votre sortie PAA et vérifiez qu'elle semble correcte. Vérifiez chaque canal individuellement.

6. **Utilisez DXT1 par défaut, DXT5 uniquement quand l'alpha est nécessaire.** DXT1 fait la moitié de la taille de fichier de DXT5 et semble identique pour les textures opaques.

7. **Testez avec les réglages de qualité faibles.** Ce qui est superbe en Ultra peut être illisible en Low parce que le moteur réduit agressivement les niveaux de mip.

---

## Observé dans les mods réels

| Patron | Mod | Détail |
|--------|-----|--------|
| Atlas de textures `_co` pour grilles d'icônes | Colorful UI | Empaquette plusieurs icônes d'UI dans un seul atlas `_co.paa` de 512x512 référencé par des imagesets |
| Feuilles de sprites d'icônes de marché | Expansion Market | Utilise de grandes textures PAA atlas avec des dizaines de miniatures d'objets pour l'UI du marchand |
| Retexture hiddenSelections sans nouveau P3D | DayZ-Samples (Test_ClothingRetexture) | Échange `_co.paa` via `hiddenSelectionsTextures[]` pour créer des variantes de couleur à partir d'un seul modèle |
| ARGB4444 pour petits éléments de HUD | VPP Admin Tools | Utilise des fichiers PAA compressés en ARGB4444 de 64x64 pour les icônes de barre d'outils et de panneau afin de minimiser la taille des fichiers |

---

## Compatibilité et impact

- **Multi-mod :** Les collisions de chemins de texture sont rares car chaque mod utilise son propre préfixe de PBO, mais deux mods retexturant le même objet vanilla via `hiddenSelectionsTextures[]` entreront en conflit -- le dernier chargé l'emporte.
- **Performance :** Une seule texture 4096x4096 DXT5 utilise environ 21 Mo de mémoire GPU avec les mipmaps. L'utilisation excessive de grandes textures sur de nombreux objets moddés peut épuiser la VRAM sur le matériel bas de gamme. Préférez 1024 ou 2048 pour la plupart des objets.
- **Version :** Le format PAA et le pipeline TexView2 sont stables depuis DayZ 1.0. Aucun changement cassant ne s'est produit entre les versions de DayZ.

---

## Navigation

| Précédent | Haut | Suivant |
|-----------|------|---------|
| [Partie 3 : Système GUI](../03-gui-system/07-styles-fonts.md) | [Partie 4 : Formats de fichiers et DayZ Tools](../04-file-formats/01-textures.md) | [4.2 Modèles 3D](02-models.md) |
