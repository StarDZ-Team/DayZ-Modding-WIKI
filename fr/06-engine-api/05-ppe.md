# Chapitre 6.5 : Effets post-traitement (PPE)

[Accueil](../README.md) | [<< Precedent : Cameras](04-cameras.md) | **Effets post-traitement** | [Suivant : Notifications >>](06-notifications.md)

---

## Introduction

Le systeme d'effets post-traitement (PPE) de DayZ controle les effets visuels appliques apres le rendu de la scene : flou, etalonnage des couleurs, vignettage, aberration chromatique, vision nocturne, et plus encore. Le systeme est construit autour de classes `PPERequester` qui peuvent demander des effets visuels specifiques. Plusieurs demandeurs peuvent etre actifs simultanement, et le moteur fusionne leurs contributions. Ce chapitre explique comment utiliser le systeme PPE dans les mods.

---

## Vue d'ensemble de l'architecture

```
PPEManager
├── PPERequesterBank              // Registre statique de tous les demandeurs disponibles
│   ├── REQ_INVENTORYBLUR         // Flou d'inventaire
│   ├── REQ_MENUEFFECTS           // Effets de menu
│   ├── REQ_CONTROLLERDISCONNECT  // Superposition deconnexion manette
│   ├── REQ_UNCONSCIOUS           // Effet d'inconscience
│   ├── REQ_FEVEREFFECTS          // Effets visuels de fievre
│   ├── REQ_FLASHBANGEFFECTS      // Grenade flash
│   ├── REQ_BURLAPSACK            // Sac de jute sur la tete
│   ├── REQ_DEATHEFFECTS          // Ecran de mort
│   ├── REQ_BLOODLOSS             // Desaturation par perte de sang
│   └── ... (beaucoup d'autres)
└── PPERequester_*                // Implementations individuelles des demandeurs
```

---

## PPEManager

Le `PPEManager` est un singleton qui coordonne toutes les demandes PPE actives. Vous interagissez rarement avec lui directement -- a la place, vous travaillez avec les sous-classes de `PPERequester`.

```c
// Obtenir l'instance du gestionnaire
PPEManager GetPPEManager();
```

---

## PPERequesterBank

**Fichier :** `3_Game/PPE/pperequesterbank.c`

Un registre statique qui contient les instances de tous les demandeurs PPE. Accedez aux demandeurs specifiques par leur indice constant.

### Obtenir un demandeur

```c
// Obtenir un demandeur par sa constante de banque
PPERequester req = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
```

### Constantes de demandeurs courantes

| Constante | Effet |
|-----------|-------|
| `REQ_INVENTORYBLUR` | Flou gaussien quand l'inventaire est ouvert |
| `REQ_MENUEFFECTS` | Flou d'arriere-plan du menu |
| `REQ_UNCONSCIOUS` | Visuel d'inconscience (flou + desaturation) |
| `REQ_DEATHEFFECTS` | Ecran de mort (niveaux de gris + vignette) |
| `REQ_BLOODLOSS` | Desaturation par perte de sang |
| `REQ_FEVEREFFECTS` | Aberration chromatique de fievre |
| `REQ_FLASHBANGEFFECTS` | Eblouissement de grenade flash |
| `REQ_BURLAPSACK` | Bandeau de sac de jute |
| `REQ_PAINBLUR` | Effet de flou de douleur |
| `REQ_CONTROLLERDISCONNECT` | Superposition deconnexion manette |
| `REQ_CAMERANV` | Vision nocturne |
| `REQ_FILMGRAINEFFECTS` | Superposition de grain de film |
| `REQ_RAINEFFECTS` | Effets de pluie sur l'ecran |
| `REQ_COLORSETTING` | Reglages de correction des couleurs |

---

## Base PPERequester

Tous les demandeurs PPE etendent `PPERequester` :

```c
class PPERequester : Managed
{
    // Demarrer l'effet
    void Start(Param par = null);

    // Arreter l'effet
    void Stop(Param par = null);

    // Verifier si actif
    bool IsActiveRequester();

    // Definir des valeurs sur les parametres de materiau
    void SetTargetValueFloat(int mat_id, int param_idx, bool relative,
                              float val, int priority_layer, int operator = PPOperators.SET);
    void SetTargetValueColor(int mat_id, int param_idx, bool relative,
                              float val1, float val2, float val3, float val4,
                              int priority_layer, int operator = PPOperators.SET);
    void SetTargetValueBool(int mat_id, int param_idx, bool relative,
                             bool val, int priority_layer, int operator = PPOperators.SET);
    void SetTargetValueInt(int mat_id, int param_idx, bool relative,
                            int val, int priority_layer, int operator = PPOperators.SET);
}
```

### PPOperators

```c
class PPOperators
{
    static const int SET          = 0;  // Definir directement la valeur
    static const int ADD          = 1;  // Ajouter a la valeur actuelle
    static const int ADD_RELATIVE = 2;  // Ajouter relativement a la valeur actuelle
    static const int HIGHEST      = 3;  // Utiliser la plus haute entre actuelle et nouvelle
    static const int LOWEST       = 4;  // Utiliser la plus basse entre actuelle et nouvelle
    static const int MULTIPLY     = 5;  // Multiplier la valeur actuelle
    static const int OVERRIDE     = 6;  // Forcer le remplacement
}
```

---

## Identifiants de materiaux PPE courants

Les effets ciblent des materiaux de post-traitement specifiques. Identifiants de materiaux courants :

| Constante | Materiau |
|-----------|----------|
| `PostProcessEffectType.Glow` | Bloom / eclat |
| `PostProcessEffectType.FilmGrain` | Grain de film |
| `PostProcessEffectType.RadialBlur` | Flou radial |
| `PostProcessEffectType.ChromAber` | Aberration chromatique |
| `PostProcessEffectType.WetEffect` | Effet de lentille mouillee |
| `PostProcessEffectType.ColorGrading` | Etalonnage des couleurs / LUT |
| `PostProcessEffectType.DepthOfField` | Profondeur de champ |
| `PostProcessEffectType.SSAO` | Occlusion ambiante en espace ecran |
| `PostProcessEffectType.GodRays` | Lumiere volumetrique |
| `PostProcessEffectType.Rain` | Pluie sur l'ecran |
| `PostProcessEffectType.Vignette` | Superposition de vignette |
| `PostProcessEffectType.HBAO` | Occlusion ambiante basee sur l'horizon |

---

## Utilisation des demandeurs integres

### Flou d'inventaire

L'exemple le plus simple -- le flou qui apparait quand l'inventaire s'ouvre :

```c
// Demarrer le flou
PPERequester blurReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
blurReq.Start();

// Arreter le flou
blurReq.Stop();
```

### Effet de grenade flash

```c
PPERequester flashReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_FLASHBANGEFFECTS);
flashReq.Start();

// Arreter apres un delai
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(StopFlashbang, 3000, false);

void StopFlashbang()
{
    PPERequester flashReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_FLASHBANGEFFECTS);
    flashReq.Stop();
}
```

---

## Creer un demandeur PPE personnalise

Pour creer des effets post-traitement personnalises, etendez `PPERequester` et enregistrez-le.

### Etape 1 : Definir le demandeur

```c
class MyCustomPPERequester extends PPERequester
{
    override protected void OnStart(Param par = null)
    {
        super.OnStart(par);

        // Appliquer un vignettage fort
        SetTargetValueFloat(PostProcessEffectType.Glow, PPEGlow.PARAM_VIGNETTE,
                            false, 0.8, PPEManager.L_0_STATIC, PPOperators.SET);

        // Desaturer les couleurs
        SetTargetValueFloat(PostProcessEffectType.ColorGrading, PPEColorGrading.PARAM_SATURATION,
                            false, 0.3, PPEManager.L_0_STATIC, PPOperators.SET);
    }

    override protected void OnStop(Param par = null)
    {
        super.OnStop(par);

        // Reinitialiser aux valeurs par defaut
        SetTargetValueFloat(PostProcessEffectType.Glow, PPEGlow.PARAM_VIGNETTE,
                            false, 0.0, PPEManager.L_0_STATIC, PPOperators.SET);
        SetTargetValueFloat(PostProcessEffectType.ColorGrading, PPEColorGrading.PARAM_SATURATION,
                            false, 1.0, PPEManager.L_0_STATIC, PPOperators.SET);
    }
}
```

### Etape 2 : Enregistrer et utiliser

L'enregistrement est gere en ajoutant le demandeur a la banque. En pratique, la plupart des moddeurs utilisent les demandeurs integres et modifient leurs parametres plutot que de creer des demandeurs entierement personnalises.

---

## Vision nocturne (NVG)

La vision nocturne est implementee comme un effet PPE. Le demandeur concerne est `REQ_CAMERANV` :

```c
// Activer l'effet NVG
PPERequester nvgReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_CAMERANV);
nvgReq.Start();

// Desactiver l'effet NVG
nvgReq.Stop();
```

Les NVG en jeu sont declenches par l'objet NVGoggles via son `ComponentEnergyManager` et la methode `NVGoggles.ToggleNVG()`, qui pilote internement le systeme PPE.

---

## Etalonnage des couleurs

L'etalonnage des couleurs modifie l'apparence globale des couleurs de la scene :

```c
PPERequester colorReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_COLORSETTING);
colorReq.Start();

// Ajuster la saturation (1.0 = normal, 0.0 = niveaux de gris, >1.0 = sursature)
colorReq.SetTargetValueFloat(PostProcessEffectType.ColorGrading,
                              PPEColorGrading.PARAM_SATURATION,
                              false, 0.5, PPEManager.L_0_STATIC,
                              PPOperators.SET);
```

---

## Effets de flou

### Flou gaussien

```c
PPERequester blurReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
blurReq.Start();

// Ajuster l'intensite du flou (0.0 = aucun, plus eleve = plus de flou)
blurReq.SetTargetValueFloat(PostProcessEffectType.GaussFilter,
                             PPEGaussFilter.PARAM_INTENSITY,
                             false, 0.5, PPEManager.L_0_STATIC,
                             PPOperators.SET);
```

### Flou radial

```c
PPERequester req = PPERequesterBank.GetRequester(PPERequesterBank.REQ_PAINBLUR);
req.Start();

req.SetTargetValueFloat(PostProcessEffectType.RadialBlur,
                         PPERadialBlur.PARAM_POWERX,
                         false, 0.3, PPEManager.L_0_STATIC,
                         PPOperators.SET);
```

---

## Couches de priorite

Lorsque plusieurs demandeurs modifient le meme parametre, la couche de priorite determine lequel l'emporte :

```c
class PPEManager
{
    static const int L_0_STATIC   = 0;   // Priorite la plus basse (effets statiques)
    static const int L_1_VALUES   = 1;   // Changements de valeurs dynamiques
    static const int L_2_SCRIPTS  = 2;   // Effets pilotes par script
    static const int L_3_EFFECTS  = 3;   // Effets de gameplay
    static const int L_4_OVERLAY  = 4;   // Effets de superposition
    static const int L_LAST       = 100;  // Priorite la plus haute (remplacer tout)
}
```

Les nombres plus eleves ont la priorite. Utilisez `PPEManager.L_LAST` pour forcer votre effet a remplacer tous les autres.

---

## Resume

| Concept | Point cle |
|---------|-----------|
| Acces | `PPERequesterBank.GetRequester(CONSTANTE)` |
| Demarrer/Arreter | `requester.Start()` / `requester.Stop()` |
| Parametres | `SetTargetValueFloat(materiau, param, relatif, valeur, couche, operateur)` |
| Operateurs | `PPOperators.SET`, `ADD`, `MULTIPLY`, `HIGHEST`, `LOWEST`, `OVERRIDE` |
| Effets courants | Flou, vignette, saturation, NVG, grenade flash, grain, aberration chromatique |
| NVG | Demandeur `REQ_CAMERANV` |
| Priorite | Couches 0-100 ; le nombre le plus eleve gagne les conflits |
| Personnalise | Etendre `PPERequester`, redefinir `OnStart()` / `OnStop()` |

---

## Bonnes pratiques

- **Appelez toujours `Stop()` pour nettoyer votre demandeur.** Ne pas arreter un demandeur PPE laisse son effet visuel actif en permanence, meme apres la fin de la condition declenchante.
- **Utilisez des couches de priorite appropriees.** Les effets de gameplay devraient utiliser `L_3_EFFECTS` ou plus. Utiliser `L_LAST` (100) remplace tout, y compris les effets vanilla d'inconscience et de mort, ce qui peut degrader l'experience du joueur.
- **Preferez les demandeurs integres aux personnalises.** Le `PPERequesterBank` contient deja des demandeurs pour le flou, la desaturation, le vignettage et le grain. Reutilisez-les avec des parametres ajustes avant de creer une classe de demandeur personnalisee.
- **Testez les effets PPE sous differentes conditions d'eclairage.** Le vignettage et la desaturation ont un rendu tres different de nuit par rapport au jour. Verifiez que votre effet est lisible dans les deux extremes.
- **Evitez d'empiler plusieurs effets de flou de haute intensite.** Plusieurs demandeurs de flou actifs se cumulent, rendant potentiellement l'ecran illisible. Verifiez `IsActiveRequester()` avant de demarrer des effets supplementaires.

---

## Compatibilite et impact

- **Multi-Mod :** Plusieurs mods peuvent activer des demandeurs PPE simultanement. Le moteur les fusionne en utilisant les couches de priorite et les operateurs. Les conflits surviennent lorsque deux mods utilisent le meme niveau de priorite avec `PPOperators.SET` sur le meme parametre -- le dernier a ecrire l'emporte.
- **Performance :** Les effets PPE sont des passes de post-traitement liees au GPU. Activer de nombreux effets simultanes (flou + grain + aberration chromatique + vignette) peut reduire le taux d'images sur les GPU d'entree de gamme. Gardez les effets actifs au minimum.
- **Serveur/Client :** Le PPE est entierement du rendu cote client. Le serveur n'a aucune connaissance des effets post-traitement. Ne conditionnez jamais la logique serveur sur l'etat PPE.

---

[<< Precedent : Cameras](04-cameras.md) | **Effets post-traitement** | [Suivant : Notifications >>](06-notifications.md)
