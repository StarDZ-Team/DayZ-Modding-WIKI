# Chapitre 6.3 : Systeme meteorologique

[Accueil](../../README.md) | [<< Precedent : Vehicules](02-vehicles.md) | **Meteo** | [Suivant : Cameras >>](04-cameras.md)

---

## Introduction

DayZ dispose d'un systeme meteorologique entierement dynamique controle via la classe `Weather`. Le systeme gere la couverture nuageuse, la pluie, les chutes de neige, le brouillard, le vent et les orages. La meteo peut etre configuree par script (l'API Weather), via `cfgweather.xml` dans le dossier de mission, ou via une machine a etats meteorologique scriptee. Ce chapitre couvre l'API de script pour lire et controler la meteo de maniere programmatique.

---

## Acceder a l'objet Weather

```c
Weather weather = GetGame().GetWeather();
```

L'objet `Weather` est un singleton gere par le moteur. Il est toujours disponible apres l'initialisation du monde de jeu.

---

## Phenomenes meteorologiques

Chaque phenomene meteorologique (couverture nuageuse, brouillard, pluie, chutes de neige, intensite du vent, direction du vent) est represente par un objet `WeatherPhenomenon`. Vous y accedez via des methodes d'acces sur `Weather`.

### Obtenir les objets de phenomene

```c
proto native WeatherPhenomenon GetOvercast();
proto native WeatherPhenomenon GetFog();
proto native WeatherPhenomenon GetRain();
proto native WeatherPhenomenon GetSnowfall();
proto native WeatherPhenomenon GetWindMagnitude();
proto native WeatherPhenomenon GetWindDirection();
```

### API WeatherPhenomenon

Chaque phenomene partage la meme interface :

```c
class WeatherPhenomenon
{
    // Etat actuel
    proto native float GetActual();          // Valeur interpolee actuelle (0.0 - 1.0 pour la plupart)
    proto native float GetForecast();        // Valeur cible vers laquelle on interpole
    proto native float GetDuration();        // Duree de persistance de la prevision actuelle (secondes)

    // Definir la prevision (serveur uniquement)
    proto native void Set(float forecast, float time = 0, float minDuration = 0);
    // forecast : valeur cible
    // time : secondes pour interpoler vers cette valeur (0 = instantane)
    // minDuration : duree minimale de maintien avant changement automatique

    // Limites
    proto native void  SetLimits(float fnMin, float fnMax);
    proto native float GetMin();
    proto native float GetMax();

    // Limites de vitesse de changement
    proto native void SetTimeLimits(float fnMin, float fnMax);

    // Limites d'amplitude de changement
    proto native void SetChangeLimits(float fnMin, float fnMax);
}
```

**Exemple -- lire l'etat meteorologique actuel :**

```c
Weather w = GetGame().GetWeather();
float overcast  = w.GetOvercast().GetActual();
float rain      = w.GetRain().GetActual();
float fog       = w.GetFog().GetActual();
float snow      = w.GetSnowfall().GetActual();
float windSpeed = w.GetWindMagnitude().GetActual();
float windDir   = w.GetWindDirection().GetActual();

Print(string.Format("Couverture : %1, Pluie : %2, Brouillard : %3", overcast, rain, fog));
```

**Exemple -- forcer un temps clair (serveur) :**

```c
void ForceClearWeather()
{
    Weather w = GetGame().GetWeather();
    w.GetOvercast().Set(0.0, 30, 600);    // Ciel degage, transition 30s, maintien 10 min
    w.GetRain().Set(0.0, 10, 600);        // Pas de pluie
    w.GetFog().Set(0.0, 30, 600);         // Pas de brouillard
    w.GetSnowfall().Set(0.0, 10, 600);    // Pas de neige
}
```

**Exemple -- creer un orage :**

```c
void ForceStorm()
{
    Weather w = GetGame().GetWeather();
    w.GetOvercast().Set(1.0, 60, 1800);   // Couverture totale, montee 60s, maintien 30 min
    w.GetRain().Set(0.8, 120, 1800);      // Pluie forte
    w.GetFog().Set(0.3, 120, 1800);       // Brouillard leger
    w.GetWindMagnitude().Set(15.0, 60, 1800);  // Vent fort (m/s)
}
```

---

## Seuils de pluie

La pluie est liee aux niveaux de couverture nuageuse. Le moteur ne rend la pluie que lorsque la couverture depasse un seuil. Vous pouvez configurer cela via `cfgweather.xml` :

```xml
<rain>
    <thresholds min="0.5" max="1.0" end="120" />
</rain>
```

- `min` / `max` : plage de couverture ou la pluie est autorisee
- `end` : secondes pour que la pluie s'arrete si la couverture tombe sous le seuil

En script, la pluie n'apparaitra pas visuellement si la couverture est trop basse, meme si `GetRain().GetActual()` retourne une valeur non nulle.

---

## Vent

Le vent utilise deux phenomenes : l'intensite (vitesse en m/s) et la direction (angle en radians).

### Vecteur de vent

```c
proto native vector GetWind();           // Vecteur de direction du vent (espace monde)
proto native float  GetWindSpeed();      // Vitesse du vent en m/s
```

**Exemple -- obtenir les informations du vent :**

```c
Weather w = GetGame().GetWeather();
vector windVec = w.GetWind();
float windSpd = w.GetWindSpeed();
Print(string.Format("Vent : %1 m/s, direction : %2", windSpd, windVec));
```

---

## Orages (eclairs)

```c
proto native void SetStorm(float density, float threshold, float timeout);
```

| Parametre | Description |
|-----------|-------------|
| `density` | Densite des eclairs (0.0 - 1.0) |
| `threshold` | Niveau minimum de couverture pour que les eclairs apparaissent (0.0 - 1.0) |
| `timeout` | Secondes entre les coups de foudre |

**Exemple -- activer des eclairs frequents :**

```c
GetGame().GetWeather().SetStorm(1.0, 0.6, 10);
// Densite maximale, se declenche a 60% de couverture, eclairs toutes les 10 secondes
```

---

## Controle MissionWeather

Pour prendre le controle manuel de la meteo (desactivant la machine a etats automatique), appelez :

```c
proto native void MissionWeather(bool use);
```

Lorsque `MissionWeather(true)` est appele, le moteur arrete les transitions automatiques et seuls vos appels `Set()` pilotes par script controlent la meteo.

**Exemple -- controle manuel complet dans init.c :**

```c
void main()
{
    // Prendre le controle manuel de la meteo
    GetGame().GetWeather().MissionWeather(true);

    // Definir la meteo souhaitee
    GetGame().GetWeather().GetOvercast().Set(0.3, 0, 0);
    GetGame().GetWeather().GetRain().Set(0.0, 0, 0);
    GetGame().GetWeather().GetFog().Set(0.1, 0, 0);
}
```

---

## Date et heure

La date et l'heure du jeu affectent l'eclairage, la position du soleil et le cycle jour/nuit. Ceux-ci sont controles via l'objet `World`, pas `Weather`, mais ils sont etroitement lies.

### Obtenir la date/heure actuelle

```c
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);
```

### Definir la date/heure (serveur uniquement)

```c
proto native void SetDate(int year, int month, int day, int hour, int minute);
```

**Exemple -- regler l'heure a midi :**

```c
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);
GetGame().GetWorld().SetDate(year, month, day, 12, 0);
```

### Acceleration du temps

L'acceleration du temps est configuree dans `serverDZ.cfg` via :

```
serverTimeAcceleration = 12;      // 12x temps reel
serverNightTimeAcceleration = 4;  // Acceleration 4x pendant la nuit
```

En script, vous pouvez lire le multiplicateur de temps actuel mais ne pouvez generalement pas le changer a l'execution.

---

## Machine a etats meteorologique WorldData

DayZ vanilla utilise une machine a etats meteorologique scriptee dans les classes `WorldData` (par ex. `ChernarusPlusData`, `EnochData`, `SakhalData`). Le point d'extension cle est :

```c
class WorldData
{
    void WeatherOnBeforeChange(EWeatherPhenomenon type, float actual, float change,
                                float time);
}
```

Redefinissez cette methode dans une classe `WorldData` moddee pour intercepter et modifier les transitions :

```c
modded class ChernarusPlusData
{
    override void WeatherOnBeforeChange(EWeatherPhenomenon type, float actual,
                                         float change, float time)
    {
        super.WeatherOnBeforeChange(type, actual, change, time);

        // Empecher la pluie de jamais depasser 0.5
        if (type == EWeatherPhenomenon.RAIN && change > 0.5)
        {
            GetGame().GetWeather().GetRain().Set(0.5, time, 300);
        }
    }
}
```

---

## cfgweather.xml

Le fichier `cfgweather.xml` dans le dossier de mission fournit un moyen declaratif de configurer la meteo sans script. Lorsqu'il est present, il remplace les parametres par defaut de la machine a etats.

Structure cle :

```xml
<weather reset="0" enable="1">
    <overcast>
        <current actual="0.45" time="120" duration="240" />
        <limits min="0.0" max="1.0" />
        <timelimits min="900" max="1800" />
        <changelimits min="0.0" max="1.0" />
    </overcast>
    <fog>...</fog>
    <rain>
        ...
        <thresholds min="0.5" max="1.0" end="120" />
    </rain>
    <snowfall>...</snowfall>
    <windMagnitude>...</windMagnitude>
    <windDirection>...</windDirection>
    <storm density="1.0" threshold="0.7" timeout="25"/>
</weather>
```

| Attribut | Description |
|----------|-------------|
| `reset` | Reinitialiser la meteo depuis le stockage au demarrage du serveur |
| `enable` | Si ce fichier est actif |
| `actual` | Valeur initiale |
| `time` | Secondes pour atteindre la valeur initiale |
| `duration` | Secondes de maintien de la valeur initiale |
| `limits min/max` | Plage de la valeur du phenomene |
| `timelimits min/max` | Plage de duree de transition (secondes) |
| `changelimits min/max` | Plage d'amplitude de changement par transition |

---

## Resume

| Concept | Point cle |
|---------|-----------|
| Acces | `GetGame().GetWeather()` retourne le singleton `Weather` |
| Phenomenes | `GetOvercast()`, `GetRain()`, `GetFog()`, `GetSnowfall()`, `GetWindMagnitude()`, `GetWindDirection()` |
| Lecture | `phenomenon.GetActual()` pour la valeur actuelle (0.0 - 1.0) |
| Ecriture | `phenomenon.Set(prevision, tempsTransition, dureeMaintien)` (serveur uniquement) |
| Orages | `SetStorm(densite, seuil, delai)` |
| Mode manuel | `MissionWeather(true)` desactive les changements automatiques |
| Date/Heure | `GetGame().GetWorld().GetDate()` / `SetDate()` |
| Fichier de config | `cfgweather.xml` dans le dossier de mission pour une configuration declarative |

---

## Bonnes pratiques

- **Appelez `MissionWeather(true)` avant de definir la meteo dans `init.c`.** Sans cela, la machine a etats automatique remplacera vos appels `Set()` en quelques secondes. Prenez toujours le controle manuel d'abord si vous voulez une meteo deterministe.
- **Fournissez toujours un parametre `minDuration` dans `Set()`.** Definir `minDuration` a 0 signifie que le systeme meteorologique peut immediatement transitionner depuis votre valeur. Utilisez au moins 300-600 secondes pour maintenir l'etat souhaite.
- **Definissez la couverture avant la pluie.** La pluie est visuellement liee aux seuils de couverture. Si la couverture est sous le seuil configure dans `cfgweather.xml`, la pluie ne sera pas rendue meme si `GetRain().GetActual()` retourne une valeur non nulle.
- **Utilisez `WeatherOnBeforeChange()` pour la politique meteorologique serveur.** Redefinissez ceci dans une `modded class ChernarusPlusData` (ou la sous-classe WorldData appropriee) pour limiter ou rediriger les transitions sans combattre la machine a etats.
- **Lisez la meteo des deux cotes, ecrivez uniquement sur le serveur.** `GetActual()` et `GetForecast()` fonctionnent sur le client et le serveur, mais `Set()` n'a d'effet que sur le serveur.

---

## Compatibilite et impact

> **Compatibilite des mods :** Les mods meteo redefinissent couramment `WeatherOnBeforeChange()` dans les sous-classes WorldData. Seule la chaine de redefinition d'un seul mod s'execute par classe WorldData de carte.

- **Ordre de chargement :** Plusieurs mods redefinissant `WeatherOnBeforeChange` sur la meme sous-classe WorldData doivent tous appeler `super`, sinon les mods anterieurs perdent leur logique.
- **Conflits de classes moddees :** Si un mod appelle `MissionWeather(true)` et qu'un autre s'attend a une meteo automatique, ils sont fondamentalement incompatibles. Documentez si votre mod prend le controle manuel.
- **Impact sur les performances :** Les appels API meteo sont legers. L'interpolation s'execute dans le moteur, pas en script. Des appels `Set()` frequents (chaque image) sont inutiles mais pas nuisibles.
- **Serveur/Client :** Tous les appels `Set()` sont cote serveur uniquement. Les clients recoivent l'etat via la synchronisation automatique du moteur. Les appels `Set()` cote client sont silencieusement ignores.

---

## Observe dans les mods reels

> Ces patrons ont ete confirmes en etudiant le code source de mods DayZ professionnels.

| Patron | Mod | Fichier/Emplacement |
|--------|-----|---------------------|
| `MissionWeather(true)` + cycle meteo scripte avec `CallLater` | Expansion | Controleur meteo dans l'init de mission |
| Redefinition `WeatherOnBeforeChange` pour empecher la pluie dans certaines zones | COT Weather Module | `ChernarusPlusData` moddee |
| Commande admin pour forcer beau/orage via `Set()` avec longue duree de maintien | VPP Admin Tools | Panneau d'administration meteo |
| `cfgweather.xml` avec seuils personnalises pour les cartes neigeuses | Namalsk | Configuration du dossier de mission |

---

[<< Precedent : Vehicules](02-vehicles.md) | **Meteo** | [Suivant : Cameras >>](04-cameras.md)
