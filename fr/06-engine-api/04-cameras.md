# Chapitre 6.4 : Système de caméras

[Accueil](../README.md) | [<< Précédent : Météo](03-weather.md) | **Caméras** | [Suivant : Effets de post-traitement >>](05-ppe.md)

---

## Introduction

DayZ utilise un système de caméras multicouche. La caméra du joueur est gérée par le moteur via les sous-classes de `DayZPlayerCamera`. Pour le modding et le débogage, la `FreeDebugCamera` permet le vol libre. Le moteur fournit également des accesseurs globaux pour l'état actuel de la caméra. Ce chapitre couvre les types de caméras, comment accéder aux données de la caméra, et comment utiliser les outils de caméra scriptés.

---

## État actuel de la caméra (accesseurs globaux)

Ces méthodes sont disponibles partout et retournent l'état de la caméra active quel que soit le type de caméra :

```c
// Position mondiale actuelle de la caméra
proto native vector GetGame().GetCurrentCameraPosition();

// Direction avant actuelle de la caméra (vecteur unitaire)
proto native vector GetGame().GetCurrentCameraDirection();

// Convertir une position monde en coordonnées écran
proto native vector GetGame().GetScreenPos(vector world_pos);
// Retourne : x = X écran (pixels), y = Y écran (pixels), z = profondeur (distance depuis la caméra)
```

**Exemple --- vérifier si une position est à l'écran :**

```c
bool IsPositionOnScreen(vector worldPos)
{
    vector screenPos = GetGame().GetScreenPos(worldPos);

    // z < 0 signifie derrière la caméra
    if (screenPos[2] < 0)
        return false;

    int screenW, screenH;
    GetScreenSize(screenW, screenH);

    return (screenPos[0] >= 0 && screenPos[0] <= screenW &&
            screenPos[1] >= 0 && screenPos[1] <= screenH);
}
```

**Exemple --- obtenir la distance entre la caméra et un point :**

```c
float DistanceFromCamera(vector worldPos)
{
    return vector.Distance(GetGame().GetCurrentCameraPosition(), worldPos);
}
```

---

## Système DayZPlayerCamera

Les caméras du joueur DayZ sont des classes natives gérées par le contrôleur de joueur du moteur. Elles ne sont pas instanciées directement depuis le script --- le moteur sélectionne la caméra appropriée en fonction de l'état du joueur (debout, couché, nageant, véhicule, inconscient, etc.).

### Types de caméras (constantes DayZPlayerCameras)

Les identifiants de type de caméra sont définis comme des constantes :

| Constante | Description |
|-----------|-------------|
| `DayZPlayerCameras.DAYZCAMERA_1ST` | Caméra première personne |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC` | Troisième personne debout |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CRO` | Troisième personne accroupi |
| `DayZPlayerCameras.DAYZCAMERA_3RD_PRO` | Troisième personne couché |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC_SPR` | Troisième personne sprint |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC_RAISED` | Troisième personne arme levée |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CRO_RAISED` | Troisième personne accroupi arme levée |
| `DayZPlayerCameras.DAYZCAMERA_IRONSIGHTS` | Visée mécanique |
| `DayZPlayerCameras.DAYZCAMERA_OPTICS` | Visée optique/lunette |
| `DayZPlayerCameras.DAYZCAMERA_3RD_VEHICLE` | Troisième personne véhicule |
| `DayZPlayerCameras.DAYZCAMERA_1ST_VEHICLE` | Première personne véhicule |
| `DayZPlayerCameras.DAYZCAMERA_3RD_SWIM` | Troisième personne nage |
| `DayZPlayerCameras.DAYZCAMERA_3RD_UNCONSCIOUS` | Troisième personne inconscient |
| `DayZPlayerCameras.DAYZCAMERA_1ST_UNCONSCIOUS` | Première personne inconscient |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CLIMB` | Troisième personne escalade |
| `DayZPlayerCameras.DAYZCAMERA_3RD_JUMP` | Troisième personne saut |

### Obtenir le type de caméra actuel

```c
DayZPlayer player = GetGame().GetPlayer();
if (player)
{
    int cameraType = player.GetCurrentCameraType();
    if (cameraType == DayZPlayerCameras.DAYZCAMERA_1ST)
    {
        Print("Le joueur est en première personne");
    }
}
```

---

## FreeDebugCamera

**Fichier :** `5_Mission/gui/scriptconsole/freedebugcamera.c`

La caméra en vol libre utilisée pour le débogage et le travail cinématique. Disponible dans les builds diagnostiques ou lorsqu'elle est activée par des mods.

### Accéder à l'instance

```c
FreeDebugCamera GetFreeDebugCamera();
```

Cette fonction globale retourne l'instance singleton de la caméra libre (ou null si elle n'existe pas).

### Méthodes principales

```c
// Activer/désactiver la caméra libre
static void SetActive(bool active);
static bool GetActive();

// Position et orientation
vector GetPosition();
void   SetPosition(vector pos);
vector GetOrientation();
void   SetOrientation(vector ori);   // lacet, tangage, roulis

// Vitesse
void SetFlySpeed(float speed);
float GetFlySpeed();

// Direction de la caméra
vector GetDirection();
```

**Exemple --- activer la caméra libre et la téléporter :**

```c
void ActivateDebugCamera(vector pos)
{
    FreeDebugCamera.SetActive(true);

    FreeDebugCamera cam = GetFreeDebugCamera();
    if (cam)
    {
        cam.SetPosition(pos);
        cam.SetOrientation(Vector(0, -30, 0));  // Regarder légèrement vers le bas
        cam.SetFlySpeed(10.0);
    }
}
```

---

## Champ de vision (FOV)

Le moteur contrôle le FOV nativement. Vous pouvez le lire et le modifier via le système de caméra du joueur :

### Lire le FOV

```c
// Obtenir le FOV actuel de la caméra
float fov = GetDayZGame().GetFieldOfView();
```

### Redéfinition du FOV de DayZPlayerCamera

Dans les classes de caméra personnalisées qui étendent `DayZPlayerCamera`, vous pouvez redéfinir le FOV :

```c
class MyCustomCamera extends DayZPlayerCamera1stPerson
{
    override float GetCurrentFOV()
    {
        return 0.7854;  // ~45 degrés (radians)
    }
}
```

---

## Profondeur de champ (DOF)

La profondeur de champ est contrôlée via le système d'effets de post-traitement (voir [Chapitre 6.5](05-ppe.md)). Cependant, le système de caméra interagit avec le DOF par ces mécanismes :

### Régler le DOF via World

```c
World world = GetGame().GetWorld();
if (world)
{
    // SetDOF(distance_focale, longueur_focale, longueur_focale_proche, flou, décalage_profondeur)
    // Toutes les valeurs en mètres
    world.SetDOF(5.0, 100.0, 0.5, 0.3, 0.0);
}
```

### Désactiver le DOF

```c
World world = GetGame().GetWorld();
if (world)
{
    world.SetDOF(0, 0, 0, 0, 0);  // Tous à zéro désactive le DOF
}
```

---

## ScriptCamera (GameLib)

**Fichier :** `2_GameLib/entities/scriptcamera.c`

Une entité de caméra scriptée de niveau inférieur provenant de la couche GameLib. C'est la base pour les implémentations de caméra personnalisées.

### Créer une caméra

```c
ScriptCamera camera = ScriptCamera.Cast(
    GetGame().CreateObject("ScriptCamera", pos, true)  // local uniquement
);
```

### Méthodes principales

```c
proto native void SetFOV(float fov);          // FOV en radians
proto native void SetNearPlane(float nearPlane);
proto native void SetFarPlane(float farPlane);
proto native void SetFocus(float dist, float len);
```

### Activer une caméra

```c
// Faire de cette caméra la caméra de rendu active
GetGame().SelectPlayer(null, null);   // Détacher du joueur
GetGame().ObjectRelease(camera);      // Libérer vers le moteur
```

> **Note :** Passer à une autre caméra que celle du joueur nécessite une gestion soigneuse des entrées et de l'interface. La plupart des mods utilisent la caméra de débogage libre ou les effets PPE plutôt que de créer des caméras personnalisées.

---

## Lancer de rayon depuis la caméra

Un patron courant consiste à lancer un rayon depuis la position de la caméra dans la direction de la caméra pour trouver ce que le joueur regarde :

```c
Object GetObjectInCrosshair(float maxDistance)
{
    vector from = GetGame().GetCurrentCameraPosition();
    vector to = from + (GetGame().GetCurrentCameraDirection() * maxDistance);

    vector contactPos;
    vector contactDir;
    int contactComponent;
    set<Object> hitObjects = new set<Object>;

    if (DayZPhysics.RaycastRV(from, to, contactPos, contactDir,
                               contactComponent, hitObjects, null, null,
                               false, false, ObjIntersectView, 0.0))
    {
        if (hitObjects.Count() > 0)
            return hitObjects[0];
    }

    return null;
}
```

---

## Résumé

| Concept | Point clé |
|---------|-----------|
| Accesseurs globaux | `GetCurrentCameraPosition()`, `GetCurrentCameraDirection()`, `GetScreenPos()` |
| Types de caméras | Constantes `DayZPlayerCameras` (1ST, 3RD_ERC, IRONSIGHTS, OPTICS, VEHICLE, etc.) |
| Type actuel | `player.GetCurrentCameraType()` |
| Caméra libre | `FreeDebugCamera.SetActive(true)`, puis `GetFreeDebugCamera()` |
| FOV | `GetDayZGame().GetFieldOfView()` pour lire, redéfinir `GetCurrentFOV()` dans la classe de caméra |
| DOF | `GetGame().GetWorld().SetDOF(focus, length, near, blur, offset)` |
| Conversion écran | `GetScreenPos(worldPos)` retourne les pixels XY + profondeur Z |

---

## Bonnes pratiques

- **Mettez en cache la position de la caméra lorsque vous l'interrogez plusieurs fois par frame.** `GetGame().GetCurrentCameraPosition()` et `GetCurrentCameraDirection()` sont des appels moteur -- stockez le résultat dans une variable locale si vous en avez besoin dans plusieurs calculs au sein de la même frame.
- **Utilisez la vérification de profondeur de `GetScreenPos()` avant le placement UI.** Vérifiez toujours `screenPos[2] > 0` (devant la caméra) avant de dessiner des marqueurs HUD aux positions du monde, sinon les marqueurs apparaîtront en miroir derrière le joueur.
- **Évitez de créer des instances ScriptCamera personnalisées pour des effets simples.** La FreeDebugCamera et le système PPE couvrent la plupart des besoins cinématiques et visuels. Les caméras personnalisées nécessitent une gestion soigneuse des entrées/HUD facile à casser.
- **Respectez les transitions de type de caméra du moteur.** Ne forcez pas les changements de type de caméra depuis le script sans gérer entièrement l'état du contrôleur de joueur. Les changements de caméra inattendus peuvent bloquer le mouvement du joueur ou causer une désynchronisation.
- **Protégez l'utilisation de la caméra libre derrière des vérifications admin/débogage.** FreeDebugCamera offre une inspection divine du monde. N'activez-la que pour les administrateurs authentifiés ou les builds diagnostiques pour prévenir les abus.

---

## Compatibilité et impact

- **Multi-Mod :** Les accesseurs de caméra sont des globaux en lecture seule, donc plusieurs mods peuvent lire l'état de la caméra simultanément en toute sécurité. Les conflits surviennent uniquement si deux mods tentent tous les deux d'activer FreeDebugCamera ou des instances ScriptCamera personnalisées.
- **Performance :** `GetScreenPos()` et `GetCurrentCameraPosition()` sont des appels moteur légers. Le lancer de rayon depuis la caméra (`DayZPhysics.RaycastRV`) est plus coûteux -- limitez-le à une fois par frame, pas par entité.
- **Serveur/Client :** L'état de la caméra n'existe que côté client. Toutes les méthodes de caméra retournent des données sans signification sur un serveur dédié. N'utilisez jamais les requêtes de caméra dans la logique côté serveur.

---

[<< Précédent : Météo](03-weather.md) | **Caméras** | [Suivant : Effets de post-traitement >>](05-ppe.md)
