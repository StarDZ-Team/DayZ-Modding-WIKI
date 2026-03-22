# Chapitre 4.4 : Audio (.ogg, .wss)

[Accueil](../README.md) | [<< Précédent : Matériaux](03-materials.md) | **Audio** | [Suivant : Flux de travail DayZ Tools >>](05-dayz-tools.md)

---

## Introduction

La conception sonore est l'un des aspects les plus immersifs du modding DayZ. Du craquement d'un fusil au vent ambiant dans une forêt, l'audio donne vie au monde du jeu. DayZ utilise **OGG Vorbis** comme format audio principal et configure la lecture du son via un système en couches de **CfgSoundShaders** et **CfgSoundSets** définis dans `config.cpp`. Comprendre ce pipeline -- du fichier audio brut au son spatialisé en jeu -- est essentiel pour tout mod introduisant des armes personnalisées, des véhicules, des effets ambiants ou des retours d'interface.

Ce chapitre couvre les formats audio, le système sonore piloté par la configuration, l'audio positionnel 3D, l'atténuation du volume et de la distance, la boucle, et le flux de travail complet pour ajouter des sons personnalisés à un mod DayZ.

---

## Table des matières

- [Formats audio](#formats-audio)
- [CfgSoundShaders et CfgSoundSets](#cfgsoundshaders-et-cfgsoundsets)
- [Catégories de sons](#catégories-de-sons)
- [Audio positionnel 3D](#audio-positionnel-3d)
- [Volume et atténuation par la distance](#volume-et-atténuation-par-la-distance)
- [Sons en boucle](#sons-en-boucle)
- [Ajouter des sons personnalisés à un mod](#ajouter-des-sons-personnalisés-à-un-mod)
- [Outils de production audio](#outils-de-production-audio)
- [Erreurs courantes](#erreurs-courantes)
- [Bonnes pratiques](#bonnes-pratiques)

---

## Formats audio

### OGG Vorbis (format principal)

**OGG Vorbis** est le format audio principal de DayZ. Tous les sons personnalisés doivent être exportés en fichiers `.ogg`.

| Propriété | Valeur |
|----------|-------|
| **Extension** | `.ogg` |
| **Codec** | Vorbis (compression avec perte) |
| **Taux d'échantillonnage** | 44100 Hz (standard), 22050 Hz (acceptable pour l'ambiance) |
| **Profondeur de bits** | Gérée par l'encodeur (paramètre de qualité) |
| **Canaux** | Mono (pour les sons 3D) ou Stéréo (pour la musique/l'interface) |
| **Plage de qualité** | -1 à 10 (5-7 recommandé pour l'audio de jeu) |

### Règles clés pour l'OGG dans DayZ

- **Les sons positionnels 3D DOIVENT être en mono.** Si vous fournissez un fichier stéréo pour un son 3D, le moteur peut ne pas le spatialiser correctement ou ignorer un canal.
- **Les sons d'interface et de musique peuvent être en stéréo.** Les sons non positionnels (menus, retours HUD, musique de fond) fonctionnent correctement en stéréo.
- **Le taux d'échantillonnage devrait être de 44100 Hz** pour la plupart des sons. Des taux plus bas (22050 Hz) peuvent être utilisés pour les sons ambiants distants afin d'économiser de l'espace.

### WSS (format hérité)

**WSS** est un format sonore hérité des anciens titres Bohemia (série Arma). DayZ peut encore charger des fichiers WSS, mais les nouveaux mods devraient utiliser exclusivement l'OGG.

| Propriété | Valeur |
|----------|-------|
| **Extension** | `.wss` |
| **Statut** | Hérité, non recommandé pour les nouveaux mods |
| **Conversion** | Les fichiers WSS peuvent être convertis en OGG avec Audacity ou des outils similaires |

Vous rencontrerez des fichiers WSS en examinant les données vanilla de DayZ ou en portant du contenu depuis d'anciens jeux Bohemia.

---

## CfgSoundShaders et CfgSoundSets

Le système audio de DayZ utilise une approche de configuration à deux couches définie dans `config.cpp`. Un **SoundShader** définit quel fichier audio jouer et comment, tandis qu'un **SoundSet** définit où et comment le son est entendu dans le monde.

### La relation

```
config.cpp
  |
  |--> CfgSoundShaders     (QUOI jouer : fichier, volume, fréquence)
  |      |
  |      |--> MyShader      référence --> sound\my_sound.ogg
  |
  |--> CfgSoundSets         (COMMENT jouer : position 3D, distance, spatial)
         |
         |--> MySoundSet    référence --> MyShader
```

Le code du jeu et les autres configs référencent les **SoundSets**, jamais les SoundShaders directement. Les SoundSets sont l'interface publique ; les SoundShaders sont le détail d'implémentation.

### CfgSoundShaders

Un SoundShader définit le contenu audio brut et les paramètres de lecture de base :

```cpp
class CfgSoundShaders
{
    class MyMod_GunShot_SoundShader
    {
        // Tableau de fichiers audio -- le moteur en choisit un aléatoirement
        samples[] =
        {
            {"MyMod\sound\gunshot_01", 1},    // {chemin (sans extension), poids de probabilité}
            {"MyMod\sound\gunshot_02", 1},
            {"MyMod\sound\gunshot_03", 1}
        };
        volume = 1.0;                          // Volume de base (0.0 - 1.0)
        range = 300;                           // Distance audible maximale (mètres)
        rangeCurve[] = {{0, 1.0}, {300, 0.0}}; // Courbe d'atténuation du volume
    };
};
```

#### Propriétés du SoundShader

| Propriété | Type | Description |
|----------|------|-------------|
| `samples[]` | array | Liste de paires `{chemin, poids}`. Le chemin exclut l'extension du fichier. |
| `volume` | float | Multiplicateur de volume de base (0.0 à 1.0). |
| `range` | float | Distance audible maximale en mètres. |
| `rangeCurve[]` | array | Tableau de points `{distance, volume}` définissant l'atténuation sur la distance. |
| `frequency` | float | Multiplicateur de vitesse de lecture. 1.0 = normal, 0.5 = demi-vitesse (hauteur plus basse), 2.0 = double vitesse (hauteur plus haute). |

> **Important :** Le chemin dans `samples[]` N'inclut PAS l'extension du fichier. Le moteur ajoute automatiquement `.ogg` (ou `.wss`) en fonction de ce qu'il trouve sur le disque.

### CfgSoundSets

Un SoundSet encapsule un ou plusieurs SoundShaders et définit les propriétés spatiales et comportementales :

```cpp
class CfgSoundSets
{
    class MyMod_GunShot_SoundSet
    {
        soundShaders[] = {"MyMod_GunShot_SoundShader"};
        volumeFactor = 1.0;          // Mise à l'échelle du volume (appliquée en plus du volume du shader)
        frequencyFactor = 1.0;       // Mise à l'échelle de la fréquence
        volumeCurve = "InverseSquare"; // Nom de courbe d'atténuation prédéfinie
        spatial = 1;                  // 1 = positionnel 3D, 0 = 2D (HUD/menu)
        doppler = 0;                  // 1 = activer l'effet Doppler
        loop = 0;                     // 1 = boucle continue
    };
};
```

#### Propriétés du SoundSet

| Propriété | Type | Description |
|----------|------|-------------|
| `soundShaders[]` | array | Liste des noms de classes SoundShader à combiner. |
| `volumeFactor` | float | Multiplicateur de volume supplémentaire appliqué en plus du volume du shader. |
| `frequencyFactor` | float | Multiplicateur de fréquence/hauteur supplémentaire. |
| `frequencyRandomizer` | float | Variation aléatoire de la hauteur (0.0 = aucune, 0.1 = +/- 10%). |
| `volumeCurve` | string | Courbe d'atténuation nommée : `"InverseSquare"`, `"Linear"`, `"Logarithmic"`. |
| `spatial` | int | `1` pour l'audio positionnel 3D, `0` pour le 2D (interface, musique). |
| `doppler` | int | `1` pour activer le décalage de hauteur Doppler pour les sources en mouvement. |
| `loop` | int | `1` pour la boucle continue, `0` pour un coup unique. |
| `distanceFilter` | int | `1` pour appliquer un filtre passe-bas à distance (sons lointains étouffés). |
| `occlusionFactor` | float | Combien les murs/le terrain étouffent le son (0.0 à 1.0). |
| `obstructionFactor` | float | Combien les obstacles entre la source et l'auditeur affectent le son. |

---

## Catégories de sons

DayZ organise les sons en catégories qui affectent leur interaction avec le système de mixage audio du jeu.

### Sons d'armes

Les sons d'armes sont l'audio le plus complexe dans DayZ, impliquant généralement plusieurs SoundSets pour différents aspects d'un seul coup de feu :

```
Tir effectué
  |--> SoundSet de tir rapproché     (le "bang" entendu à proximité)
  |--> SoundSet de tir distant        (le grondement/écho entendu au loin)
  |--> SoundSet de traînée            (réverbération/écho qui suit)
  |--> SoundSet de claquement supersonique (balle passant au-dessus)
  |--> SoundSet mécanique             (culasse, insertion de chargeur)
```

Exemple de configuration audio d'arme :

```cpp
class CfgSoundShaders
{
    class MyMod_Rifle_Shot_SoundShader
    {
        samples[] =
        {
            {"MyMod\sound\weapons\rifle_shot_01", 1},
            {"MyMod\sound\weapons\rifle_shot_02", 1},
            {"MyMod\sound\weapons\rifle_shot_03", 1}
        };
        volume = 1.0;
        range = 200;
        rangeCurve[] = {{0, 1.0}, {50, 0.8}, {100, 0.4}, {200, 0.0}};
    };

    class MyMod_Rifle_Tail_SoundShader
    {
        samples[] =
        {
            {"MyMod\sound\weapons\rifle_tail_01", 1},
            {"MyMod\sound\weapons\rifle_tail_02", 1}
        };
        volume = 0.8;
        range = 800;
        rangeCurve[] = {{0, 0.6}, {200, 0.4}, {500, 0.2}, {800, 0.0}};
    };
};

class CfgSoundSets
{
    class MyMod_Rifle_Shot_SoundSet
    {
        soundShaders[] = {"MyMod_Rifle_Shot_SoundShader"};
        volumeFactor = 1.0;
        spatial = 1;
        doppler = 0;
        loop = 0;
    };

    class MyMod_Rifle_Tail_SoundSet
    {
        soundShaders[] = {"MyMod_Rifle_Tail_SoundShader"};
        volumeFactor = 1.0;
        spatial = 1;
        doppler = 0;
        loop = 0;
        distanceFilter = 1;
    };
};
```

### Sons ambiants

Audio environnemental pour l'atmosphère :

```cpp
class MyMod_Wind_SoundShader
{
    samples[] = {{"MyMod\sound\ambient\wind_loop", 1}};
    volume = 0.5;
    range = 50;
};

class MyMod_Wind_SoundSet
{
    soundShaders[] = {"MyMod_Wind_SoundShader"};
    volumeFactor = 0.6;
    spatial = 0;           // Non positionnel (ambiance surround)
    loop = 1;              // Boucle continue
};
```

### Sons d'interface

Sons de retour d'interface (clics de boutons, notifications) :

```cpp
class MyMod_ButtonClick_SoundShader
{
    samples[] = {{"MyMod\sound\ui\click_01", 1}};
    volume = 0.7;
    range = 0;             // Pas de portée spatiale nécessaire
};

class MyMod_ButtonClick_SoundSet
{
    soundShaders[] = {"MyMod_ButtonClick_SoundShader"};
    volumeFactor = 0.8;
    spatial = 0;           // 2D -- joue dans la tête de l'auditeur
    loop = 0;
};
```

### Sons de véhicules

Les véhicules utilisent des configurations sonores complexes avec plusieurs composants :

- **Ralenti moteur** -- en boucle, la hauteur varie avec le régime
- **Accélération moteur** -- en boucle, le volume et la hauteur varient avec l'accélérateur
- **Bruit des pneus** -- en boucle, le volume varie avec la vitesse
- **Klaxon** -- déclenché, en boucle tant qu'il est maintenu
- **Crash** -- un coup unique à la collision

### Sons de personnage

Les sons liés au joueur incluent :

- **Pas** -- varient selon le matériau de surface (béton, herbe, bois, métal)
- **Respiration** -- dépendante de l'endurance
- **Voix** -- émotes et commandes
- **Inventaire** -- sons de manipulation d'objets

---

## Audio positionnel 3D

DayZ utilise l'audio spatial 3D pour positionner les sons dans le monde du jeu. Quand un fusil tire à 200 mètres sur votre gauche, vous l'entendez depuis votre haut-parleur/écouteur gauche avec une réduction de volume appropriée.

### Prérequis pour l'audio 3D

1. **Le fichier audio doit être en mono.** Les fichiers stéréo ne se spatialiseront pas correctement.
2. **Le `spatial` du SoundSet doit être `1`.** Cela active le système de positionnement 3D.
3. **La source sonore doit avoir une position dans le monde.** Le moteur a besoin de coordonnées pour calculer la direction et la distance.

### Comment le moteur spatialise le son

```
Source sonore (position dans le monde)
  |
  |--> Calculer la distance à l'auditeur
  |--> Calculer la direction relative à l'orientation de l'auditeur
  |--> Appliquer l'atténuation de distance (rangeCurve)
  |--> Appliquer l'occlusion (murs, terrain)
  |--> Appliquer l'effet Doppler (si activé et si la source est en mouvement)
  |--> Sortir vers les bons canaux de haut-parleurs
```

### Déclencher des sons 3D depuis un script

```c
// Jouer un son positionnel à un emplacement du monde
void PlaySoundAtPosition(vector position)
{
    EffectSound sound;
    SEffectManager.PlaySound("MyMod_Rifle_Shot_SoundSet", position);
}

// Jouer un son attaché à un objet (se déplace avec lui)
void PlaySoundOnObject(Object obj)
{
    EffectSound sound;
    SEffectManager.PlaySoundOnObject("MyMod_Engine_SoundSet", obj);
}
```

---

## Volume et atténuation par la distance

### Courbe de portée

La `rangeCurve[]` dans un SoundShader définit comment le volume diminue avec la distance. C'est un tableau de paires `{distance, volume}` :

```cpp
rangeCurve[] =
{
    {0, 1.0},       // À 0m : volume maximal
    {50, 0.7},      // À 50m : 70% du volume
    {150, 0.3},     // À 150m : 30% du volume
    {300, 0.0}      // À 300m : silence
};
```

Le moteur interpole linéairement entre les points définis. Vous pouvez créer n'importe quelle courbe d'atténuation en ajoutant plus de points de contrôle.

### Courbes de volume prédéfinies

Les SoundSets peuvent référencer des courbes nommées via la propriété `volumeCurve` :

| Nom de la courbe | Comportement |
|------------|----------|
| `"InverseSquare"` | Atténuation réaliste (volume = 1/distance^2). Son naturel. |
| `"Linear"` | Atténuation uniforme du maximum à zéro sur la portée. |
| `"Logarithmic"` | Fort de près, chute rapidement à moyenne distance, puis s'atténue lentement. |

### Exemples pratiques d'atténuation

**Coup de feu (fort, porte loin) :**
```cpp
range = 800;
rangeCurve[] = {{0, 1.0}, {100, 0.6}, {300, 0.3}, {600, 0.1}, {800, 0.0}};
```

**Pas (discret, courte portée) :**
```cpp
range = 30;
rangeCurve[] = {{0, 1.0}, {10, 0.5}, {20, 0.15}, {30, 0.0}};
```

**Moteur de véhicule (portée moyenne, continu) :**
```cpp
range = 200;
rangeCurve[] = {{0, 1.0}, {50, 0.7}, {100, 0.4}, {200, 0.0}};
```

---

## Sons en boucle

Les sons en boucle se répètent continuellement jusqu'à être explicitement arrêtés. Ils sont utilisés pour les moteurs, l'atmosphère ambiante, les alarmes et tout audio continu.

### Configurer un son en boucle

Dans le SoundSet :
```cpp
class MyMod_Alarm_SoundSet
{
    soundShaders[] = {"MyMod_Alarm_SoundShader"};
    spatial = 1;
    loop = 1;              // Activer la boucle
};
```

### Boucle depuis un script

```c
// Démarrer un son en boucle
EffectSound m_AlarmSound;

void StartAlarm(vector position)
{
    if (!m_AlarmSound)
    {
        m_AlarmSound = SEffectManager.PlaySound("MyMod_Alarm_SoundSet", position);
    }
}

// Arrêter le son en boucle
void StopAlarm()
{
    if (m_AlarmSound)
    {
        m_AlarmSound.Stop();
        m_AlarmSound = null;
    }
}
```

### Préparation du fichier audio pour les boucles

Pour une boucle sans couture, le fichier audio lui-même doit boucler proprement :

1. **Passage par zéro au début et à la fin.** La forme d'onde doit traverser l'amplitude zéro aux deux extrémités pour éviter un clic/pop au point de boucle.
2. **Début et fin correspondants.** La fin du fichier doit se fondre parfaitement dans le début.
3. **Pas de fondu entrant/sortant.** Les fondus seraient audibles à chaque itération de boucle.
4. **Testez la boucle dans Audacity.** Sélectionnez tout le clip, activez la lecture en boucle et écoutez les clics ou les discontinuités.

---

## Ajouter des sons personnalisés à un mod

### Flux de travail complet

**Étape 1 : Préparer les fichiers audio**
- Enregistrez ou procurez-vous votre audio.
- Éditez dans Audacity (ou votre éditeur audio préféré).
- Pour les sons 3D : convertissez en mono.
- Exportez en OGG Vorbis (qualité 5-7).
- Nommez les fichiers de manière descriptive : `rifle_shot_01.ogg`, `rifle_shot_02.ogg`.

**Étape 2 : Organiser dans le répertoire du mod**

```
MyMod/
  sound/
    weapons/
      rifle_shot_01.ogg
      rifle_shot_02.ogg
      rifle_shot_03.ogg
      rifle_tail_01.ogg
      rifle_tail_02.ogg
    ambient/
      wind_loop.ogg
    ui/
      click_01.ogg
      notification_01.ogg
  config.cpp
```

**Étape 3 : Définir les SoundShaders dans config.cpp**

```cpp
class CfgPatches
{
    class MyMod_Sounds
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = {"DZ_Sounds_Effects"};
    };
};

class CfgSoundShaders
{
    class MyMod_RifleShot_SoundShader
    {
        samples[] =
        {
            {"MyMod\sound\weapons\rifle_shot_01", 1},
            {"MyMod\sound\weapons\rifle_shot_02", 1},
            {"MyMod\sound\weapons\rifle_shot_03", 1}
        };
        volume = 1.0;
        range = 300;
        rangeCurve[] = {{0, 1.0}, {100, 0.6}, {200, 0.2}, {300, 0.0}};
    };
};

class CfgSoundSets
{
    class MyMod_RifleShot_SoundSet
    {
        soundShaders[] = {"MyMod_RifleShot_SoundShader"};
        volumeFactor = 1.0;
        spatial = 1;
        doppler = 0;
        loop = 0;
        distanceFilter = 1;
    };
};
```

**Étape 4 : Référencer depuis la config de l'arme/objet**

Pour les armes, le SoundSet est référencé dans la classe de configuration de l'arme :

```cpp
class CfgWeapons
{
    class MyMod_Rifle: Rifle_Base
    {
        // ... autre config ...

        class Sounds
        {
            class Fire
            {
                soundSet = "MyMod_RifleShot_SoundSet";
            };
        };
    };
};
```

**Étape 5 : Compiler et tester**
- Empaquetez le PBO (utilisez `-packonly` car les fichiers OGG n'ont pas besoin de binarisation).
- Lancez le jeu avec le mod chargé.
- Testez le son en jeu à différentes distances.

---

## Outils de production audio

### Audacity (gratuit, open source)

Audacity est l'outil recommandé pour la production audio DayZ :

- **Téléchargement :** [audacityteam.org](https://www.audacityteam.org/)
- **Export OGG :** Fichier --> Exporter --> Exporter en OGG
- **Conversion mono :** Pistes --> Mixer --> Mixer stéréo vers mono
- **Normalisation :** Effet --> Normaliser (régler le pic à -1 dB pour éviter l'écrêtage)
- **Suppression du bruit :** Effet --> Réduction du bruit
- **Test de boucle :** Transport --> Lecture en boucle (Shift+Espace)

### Paramètres d'export OGG dans Audacity

1. **Fichier --> Exporter --> Exporter en OGG Vorbis**
2. **Qualité :** 5-7 (5 pour l'ambiance/interface, 7 pour les armes/sons importants)
3. **Canaux :** Mono pour les sons 3D, Stéréo pour l'interface/musique

### Autres outils utiles

| Outil | Usage | Coût |
|------|---------|------|
| **Audacity** | Édition audio générale, conversion de format | Gratuit |
| **Reaper** | Station de travail audio professionnelle, édition avancée | 60 $ (licence personnelle) |
| **FFmpeg** | Conversion audio par lots en ligne de commande | Gratuit |
| **Ocenaudio** | Éditeur simple avec prévisualisation en temps réel | Gratuit |

### Conversion par lots avec FFmpeg

Convertir tous les fichiers WAV d'un répertoire en OGG mono :

```bash
for file in *.wav; do
    ffmpeg -i "$file" -ac 1 -codec:a libvorbis -qscale:a 6 "${file%.wav}.ogg"
done
```

---

## Erreurs courantes

### 1. Fichier stéréo pour un son 3D

**Symptôme :** Le son ne se spatialise pas, joue au centre ou seulement dans une oreille.
**Correction :** Convertissez en mono avant l'export. Les sons positionnels 3D nécessitent des fichiers audio mono.

### 2. Extension de fichier dans le chemin samples[]

**Symptôme :** Le son ne joue pas, pas d'erreur dans le log (le moteur échoue silencieusement à trouver le fichier).
**Correction :** Retirez l'extension `.ogg` du chemin dans `samples[]`. Le moteur l'ajoute automatiquement.

```cpp
// INCORRECT
samples[] = {{"MyMod\sound\gunshot_01.ogg", 1}};

// CORRECT
samples[] = {{"MyMod\sound\gunshot_01", 1}};
```

### 3. requiredAddons de CfgPatches manquant

**Symptôme :** Les SoundShaders ou SoundSets ne sont pas reconnus, les sons ne jouent pas.
**Correction :** Ajoutez `"DZ_Sounds_Effects"` à votre `requiredAddons[]` de CfgPatches pour vous assurer que le système sonore de base se charge avant vos définitions.

### 4. Portée trop courte

**Symptôme :** Le son se coupe abruptement à courte distance, semble artificiel.
**Correction :** Réglez `range` à une valeur réaliste. Les coups de feu devraient porter à 300-800m, les pas à 20-40m, les voix à 50-100m.

### 5. Pas de variation aléatoire

**Symptôme :** Le son semble répétitif et artificiel après l'avoir entendu plusieurs fois.
**Correction :** Fournissez plusieurs échantillons dans le SoundShader et ajoutez `frequencyRandomizer` au SoundSet pour la variation de hauteur.

```cpp
// Plusieurs échantillons pour la variété
samples[] =
{
    {"MyMod\sound\step_01", 1},
    {"MyMod\sound\step_02", 1},
    {"MyMod\sound\step_03", 1},
    {"MyMod\sound\step_04", 1}
};

// Plus la randomisation de hauteur dans le SoundSet
frequencyRandomizer = 0.05;    // +/- 5% de variation de hauteur
```

### 6. Écrêtage / Distorsion

**Symptôme :** Le son crépite ou se déforme, surtout à courte distance.
**Correction :** Normalisez votre audio à -1 dB ou -3 dB de pic dans Audacity avant l'export. Ne réglez jamais `volume` ou `volumeFactor` au-dessus de 1.0 sauf si l'audio source est très faible.

---

## Bonnes pratiques

1. **Exportez toujours les sons 3D en OGG mono.** C'est la règle la plus importante. Les fichiers stéréo ne se spatialiseront pas.

2. **Fournissez 3 à 5 variantes d'échantillons** pour les sons fréquemment entendus (coups de feu, pas, impacts). La sélection aléatoire évite l'« effet mitrailleuse » d'un audio identique répété.

3. **Utilisez `frequencyRandomizer`** entre 0.03 et 0.08 pour une variation de hauteur naturelle. Même une variation subtile améliore significativement la qualité audio perçue.

4. **Définissez des valeurs de portée réalistes.** Étudiez les sons vanilla de DayZ pour référence. Un tir de fusil à 600-800m de portée, un tir supprimé à 150-200m, les pas à 20-40m.

5. **Superposez vos sons.** Les événements audio complexes (coups de feu) devraient utiliser plusieurs SoundSets : tir rapproché + grondement distant + traînée/écho. Cela crée une profondeur qu'un seul fichier sonore ne peut pas atteindre.

6. **Testez à plusieurs distances.** Éloignez-vous de la source sonore en jeu et vérifiez que la courbe d'atténuation semble naturelle. Ajustez les points de contrôle de `rangeCurve[]` de manière itérative.

7. **Organisez votre répertoire de sons.** Utilisez des sous-répertoires par catégorie (`weapons/`, `ambient/`, `ui/`, `vehicles/`). Un répertoire plat avec 200 fichiers OGG est ingérable.

8. **Gardez des tailles de fichiers raisonnables.** L'audio de jeu n'a pas besoin d'une qualité studio. La qualité OGG 5-7 est suffisante. La plupart des fichiers sonores individuels devraient faire moins de 500 Ko.

---

## Observé dans les mods réels

| Patron | Mod | Détail |
|---------|-----|--------|
| Sons de notification personnalisés via les SoundSets | Expansion (module Notification) | Définit plusieurs `CfgSoundSets` pour différents types de notifications (succès, avertissement, erreur) avec `spatial = 0` |
| Sons de clic d'interface avec lecture en cache | VPP Admin Tools | Utilise `SEffectManager.PlaySoundCachedParams()` pour les clics de boutons afin d'éviter de re-parser la config à chaque fois |
| Audio d'arme multicouche (tir + traînée + claquement) | Packs d'armes communautaires (RFCP, MuchStuffPack) | Chaque arme définit 3 à 5 SoundSets séparés par événement de tir pour le tir rapproché, le grondement distant, le claquement supersonique |
| `frequencyRandomizer` pour la variation des pas | DayZ Vanilla | Utilise une randomisation de hauteur de 0.05-0.08 sur les SoundSets de pas pour éviter la répétition robotique |

---

## Compatibilité et impact

- **Multi-Mod :** Les noms de classes SoundShader et SoundSet sont globaux. Deux mods définissant le même nom de classe entreront en conflit (le dernier chargé l'emporte). Préfixez toujours les noms avec l'identifiant de votre mod (ex : `MyMod_Shot_SoundShader`).
- **Performance :** Les fichiers OGG sont décompressés à l'exécution. Les mods avec des centaines de fichiers audio uniques augmentent l'utilisation mémoire. Gardez les fichiers individuels en dessous de 500 Ko et réutilisez les échantillons entre les variantes.
- **Version :** Le système audio de DayZ (CfgSoundShaders/CfgSoundSets) est stable depuis la version 1.0. Les préréglages nommés `sound3DProcessingType` et `volumeCurve` ont été ajoutés dans des mises à jour ultérieures mais sont rétrocompatibles.

---

## Navigation

| Précédent | Haut | Suivant |
|----------|----|------|
| [4.3 Matériaux](03-materials.md) | [Partie 4 : Formats de fichiers et outils DayZ](01-textures.md) | [4.5 Flux de travail DayZ Tools](05-dayz-tools.md) |
