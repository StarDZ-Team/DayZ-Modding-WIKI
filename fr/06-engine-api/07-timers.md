# Chapitre 6.7 : Timers et CallQueue

[Accueil](../README.md) | [<< Precedent : Notifications](06-notifications.md) | **Timers & CallQueue** | [Suivant : E/S fichiers & JSON >>](08-file-io.md)

---

## Introduction

DayZ fournit plusieurs mecanismes pour les appels de fonctions differes et repetitifs : `ScriptCallQueue` (le systeme principal), `Timer`, `ScriptInvoker` et `WidgetFadeTimer`. Ceux-ci sont essentiels pour planifier une logique differee, creer des boucles de mise a jour et gerer des evenements temporises sans bloquer le thread principal. Ce chapitre couvre chaque mecanisme avec les signatures API completes et les patrons d'utilisation.

---

## Categories d'appel

Tous les systemes de timer et de file d'appel necessitent une **categorie d'appel** qui determine quand l'appel differe s'execute dans la trame :

```c
const int CALL_CATEGORY_SYSTEM   = 0;   // Operations au niveau systeme
const int CALL_CATEGORY_GUI      = 1;   // Mises a jour de l'interface
const int CALL_CATEGORY_GAMEPLAY = 2;   // Logique de gameplay
const int CALL_CATEGORY_COUNT    = 3;   // Nombre total de categories
```

Acces a la file pour une categorie :

```c
ScriptCallQueue  queue   = GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY);
ScriptInvoker    updater = GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY);
TimerQueue       timers  = GetGame().GetTimerQueue(CALL_CATEGORY_GAMEPLAY);
```

---

## ScriptCallQueue

**Fichier :** `3_Game/tools/utilityclasses.c`

Le mecanisme principal pour les appels de fonctions differes. Supporte les delais uniques, les appels repetitifs et l'execution immediate a la trame suivante.

### CallLater

```c
void CallLater(func fn, int delay = 0, bool repeat = false,
               void param1 = NULL, void param2 = NULL,
               void param3 = NULL, void param4 = NULL);
```

| Parametre | Description |
|-----------|-------------|
| `fn` | La fonction a appeler (reference de methode : `this.MaMethode`) |
| `delay` | Delai en millisecondes (0 = trame suivante) |
| `repeat` | `true` = appeler de maniere repetee a intervalles de `delay` ; `false` = appeler une fois |
| `param1..4` | Parametres optionnels passes a la fonction |

**Exemple -- delai unique :**

```c
// Appeler MaFonction une fois apres 5 secondes
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.MaFonction, 5000, false);
```

**Exemple -- appel repetitif :**

```c
// Appeler BoucleDeMiseAJour toutes les 1 seconde, en repetition
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.BoucleDeMiseAJour, 1000, true);
```

**Exemple -- avec parametres :**

```c
void ShowMessage(string text, int color)
{
    Print(text);
}

// Appeler avec des parametres apres 2 secondes
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(
    this.ShowMessage, 2000, false, "Bonjour !", ARGB(255, 255, 0, 0)
);
```

### Call

```c
void Call(func fn, void param1 = NULL, void param2 = NULL,
          void param3 = NULL, void param4 = NULL);
```

Execute la fonction a la trame suivante (delai = 0, pas de repetition). Raccourci pour `CallLater(fn, 0, false)`.

**Exemple :**

```c
// Executer a la trame suivante
GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM).Call(this.Initialize);
```

### CallByName

```c
void CallByName(Class obj, string fnName, int delay = 0, bool repeat = false,
                Param par = null);
```

Appeler une methode par son nom en chaine. Utile lorsque la reference de methode n'est pas directement disponible.

**Exemple :**

```c
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallByName(
    monObjet, "OnTimerExpired", 3000, false
);
```

### Remove

```c
void Remove(func fn);
```

Supprime un appel planifie. Essentiel pour arreter les appels repetitifs et empecher les appels sur des objets detruits.

**Exemple :**

```c
// Arreter un appel repetitif
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).Remove(this.BoucleDeMiseAJour);
```

### RemoveByName

```c
void RemoveByName(Class obj, string fnName);
```

Supprime un appel planifie via `CallByName`.

### Tick

```c
void Tick(float timeslice);
```

Appele en interne par le moteur a chaque trame. Vous ne devriez jamais avoir besoin de l'appeler manuellement.

---

## Timer

**Fichier :** `3_Game/tools/utilityclasses.c`

Un timer base sur une classe avec un cycle de vie explicite demarrage/arret. Plus propre pour les timers de longue duree qui doivent etre mis en pause ou redemarres.

### Constructeur

```c
void Timer(int category = CALL_CATEGORY_SYSTEM);
```

### Run

```c
void Run(float duration, Class obj, string fn_name, Param params = null, bool loop = false);
```

| Parametre | Description |
|-----------|-------------|
| `duration` | Temps en secondes (pas en millisecondes !) |
| `obj` | L'objet dont la methode sera appelee |
| `fn_name` | Nom de la methode en chaine |
| `params` | Objet `Param` optionnel avec les parametres |
| `loop` | `true` = repeter apres chaque duree |

**Exemple -- timer unique :**

```c
ref Timer m_Timer;

void StartTimer()
{
    m_Timer = new Timer(CALL_CATEGORY_GAMEPLAY);
    m_Timer.Run(5.0, this, "OnTimerComplete", null, false);
}

void OnTimerComplete()
{
    Print("Timer termine !");
}
```

**Exemple -- timer repetitif :**

```c
ref Timer m_UpdateTimer;

void StartUpdateLoop()
{
    m_UpdateTimer = new Timer(CALL_CATEGORY_GAMEPLAY);
    m_UpdateTimer.Run(1.0, this, "OnUpdate", null, true);  // Toutes les 1 seconde
}

void StopUpdateLoop()
{
    if (m_UpdateTimer && m_UpdateTimer.IsRunning())
        m_UpdateTimer.Stop();
}
```

### Stop

```c
void Stop();
```

Arrete le timer. Peut etre redemarre avec un autre appel `Run()`.

### IsRunning

```c
bool IsRunning();
```

Retourne `true` si le timer est actuellement actif.

### Pause

```c
void Pause();
```

Met en pause un timer en cours, preservant le temps restant. Le timer peut etre repris avec `Continue()`.

### Continue

```c
void Continue();
```

Reprend un timer mis en pause la ou il s'est arrete.

### IsPaused

```c
bool IsPaused();
```

Retourne `true` si le timer est actuellement en pause.

**Exemple -- pause et reprise :**

```c
ref Timer m_Timer;

void StartTimer()
{
    m_Timer = new Timer(CALL_CATEGORY_GAMEPLAY);
    m_Timer.Run(10.0, this, "OnTimerComplete", null, false);
}

void TogglePause()
{
    if (m_Timer.IsPaused())
        m_Timer.Continue();
    else
        m_Timer.Pause();
}
```

### GetRemaining

```c
float GetRemaining();
```

Retourne le temps restant en secondes.

### GetDuration

```c
float GetDuration();
```

Retourne la duree totale definie par `Run()`.

---

## ScriptInvoker

**Fichier :** `3_Game/tools/utilityclasses.c`

Un systeme d'evenements/delegues. `ScriptInvoker` contient une liste de fonctions callback et les invoque toutes quand `Invoke()` est appele. C'est l'equivalent DayZ des evenements C# ou du patron observateur.

### Insert

```c
void Insert(func fn);
```

Enregistrer une fonction callback.

### Remove

```c
void Remove(func fn);
```

Desenregistrer une fonction callback.

### Invoke

```c
void Invoke(void param1 = NULL, void param2 = NULL,
            void param3 = NULL, void param4 = NULL);
```

Appeler toutes les fonctions enregistrees avec les parametres fournis.

### Count

```c
int Count();
```

Nombre de callbacks enregistres.

### Clear

```c
void Clear();
```

Supprimer tous les callbacks enregistres.

**Exemple -- systeme d'evenements personnalise :**

```c
class MyModule
{
    ref ScriptInvoker m_OnMissionComplete = new ScriptInvoker();

    void CompleteMission()
    {
        // Logique de completion...

        // Notifier tous les ecouteurs
        m_OnMissionComplete.Invoke("MissionAlpha", 1500);
    }
}

class MyUI
{
    void Init(MyModule module)
    {
        // S'abonner a l'evenement
        module.m_OnMissionComplete.Insert(this.OnMissionComplete);
    }

    void OnMissionComplete(string name, int reward)
    {
        Print(string.Format("Mission %1 terminee ! Recompense : %2", name, reward));
    }

    void Cleanup(MyModule module)
    {
        // Toujours se desabonner pour eviter les references pendantes
        module.m_OnMissionComplete.Remove(this.OnMissionComplete);
    }
}
```

### File de mise a jour

Le moteur fournit des files `ScriptInvoker` par trame :

```c
ScriptInvoker updater = GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY);
updater.Insert(this.OnFrame);

// Supprimer quand termine
updater.Remove(this.OnFrame);
```

Les fonctions enregistrees dans la file de mise a jour sont appelees a chaque trame sans parametres. C'est utile pour la logique par trame sans utiliser `EntityEvent.FRAME`.

---

## WidgetFadeTimer

**Fichier :** `3_Game/tools/utilityclasses.c`

Un timer specialise pour le fondu entrant et sortant des widgets.

```c
class WidgetFadeTimer
{
    void FadeIn(Widget w, float time, bool continue_from_current = false);
    void FadeOut(Widget w, float time, bool continue_from_current = false);
    bool IsFading();
    void Stop();
}
```

| Parametre | Description |
|-----------|-------------|
| `w` | Le widget a faire fondre |
| `time` | Duree du fondu en secondes |
| `continue_from_current` | Si `true`, demarrer depuis l'alpha actuel ; sinon demarrer depuis 0 (fondu entrant) ou 1 (fondu sortant) |

**Exemple :**

```c
ref WidgetFadeTimer m_FadeTimer;
Widget m_NotificationPanel;

void ShowNotification()
{
    m_NotificationPanel.Show(true);
    m_FadeTimer = new WidgetFadeTimer;
    m_FadeTimer.FadeIn(m_NotificationPanel, 0.3);

    // Masquer automatiquement apres 5 secondes
    GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(this.HideNotification, 5000, false);
}

void HideNotification()
{
    m_FadeTimer.FadeOut(m_NotificationPanel, 0.5);
}
```

---

## GetRemainingTime (CallQueue)

Le `ScriptCallQueue` fournit egalement un moyen de consulter le temps restant sur un `CallLater` planifie :

```c
float GetRemainingTime(Class obj, string fnName);
```

**Exemple :**

```c
// Obtenir le temps restant sur un CallLater
float remaining = GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).GetRemainingTime(this, "MonCallback");
if (remaining > 0)
    Print(string.Format("Le callback se declenche dans %1 ms", remaining));
```

---

## Patrons courants

### Accumulateur de timer (OnUpdate ralenti)

Quand vous avez un callback par trame mais souhaitez executer la logique a un rythme plus lent :

```c
class MyModule
{
    protected float m_UpdateAccumulator;
    protected const float UPDATE_INTERVAL = 2.0;  // Toutes les 2 secondes

    void OnUpdate(float timeslice)
    {
        m_UpdateAccumulator += timeslice;
        if (m_UpdateAccumulator < UPDATE_INTERVAL)
            return;
        m_UpdateAccumulator = 0;

        // Logique ralentie ici
        DoPeriodicWork();
    }
}
```

### Patron de nettoyage

Supprimez toujours les appels planifies quand votre objet est detruit pour eviter les crashs :

```c
class MyManager
{
    void MyManager()
    {
        GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.Tick, 1000, true);
    }

    void ~MyManager()
    {
        GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).Remove(this.Tick);
    }

    void Tick()
    {
        // Travail periodique
    }
}
```

### Initialisation differee unique

Un patron courant pour initialiser les systemes apres le chargement complet du monde :

```c
void OnMissionStart()
{
    // Retarder l'init d'1 seconde pour s'assurer que tout est charge
    GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(this.DelayedInit, 1000, false);
}

void DelayedInit()
{
    // Sur d'acceder aux objets du monde maintenant
}
```

---

## Resume

| Mecanisme | Cas d'utilisation | Unite de temps |
|-----------|-------------------|----------------|
| `CallLater` | Appels differes uniques ou repetitifs | Millisecondes |
| `Call` | Executer a la trame suivante | N/A (immediat) |
| `Timer` | Timer base sur une classe avec demarrage/arret/restant | Secondes |
| `ScriptInvoker` | Evenement/delegue (patron observateur) | N/A (invocation manuelle) |
| `WidgetFadeTimer` | Fondu entrant/sortant de widget | Secondes |
| `GetUpdateQueue()` | Enregistrement de callback par trame | N/A (chaque trame) |

| Concept | Point cle |
|---------|-----------|
| Categories | `CALL_CATEGORY_SYSTEM` (0), `GUI` (1), `GAMEPLAY` (2) |
| Supprimer les appels | Toujours `Remove()` dans le destructeur pour eviter les references pendantes |
| Timer vs CallLater | Timer en secondes + base sur une classe ; CallLater en millisecondes + fonctionnel |
| ScriptInvoker | Insert/Remove les callbacks, Invoke pour tous les declencher |

---

## Bonnes pratiques

- **Supprimez toujours les appels `CallLater` planifies dans votre destructeur.** Si l'objet proprietaire est detruit pendant qu'un `CallLater` est encore en attente, le moteur appellera une methode sur un objet supprime et plantera. Chaque `CallLater` doit avoir un `Remove()` correspondant dans le destructeur.
- **Utilisez `Timer` (secondes) pour les timers de longue duree avec pause/reprise, `CallLater` (millisecondes) pour les delais a usage unique.** Les melanger conduit a des bugs de timing x1000 puisque `Timer.Run()` utilise des secondes mais `CallLater` des millisecondes.
- **Ralentissez `OnUpdate` avec un accumulateur de timer au lieu d'enregistrer un `CallLater` repetitif.** Un `CallLater` avec repetition cree une entree suivie separee dans la file, tandis qu'un patron accumulateur (`m_Acc += timeslice; if (m_Acc >= INTERVAL)`) n'a aucun surcout et est plus facile a ajuster.
- **Desabonnez les callbacks `ScriptInvoker` avant la destruction de l'ecouteur.** Oublier d'appeler `Remove()` sur un `ScriptInvoker` laisse une reference de fonction pendante qui plante quand `Invoke()` se declenche.
- **N'appelez jamais `Tick()` manuellement sur `ScriptCallQueue`.** Le moteur l'appelle automatiquement a chaque trame. Les appels manuels declenchent doublement tous les callbacks en attente.

---

## Compatibilite et impact

> **Compatibilite des mods :** Les systemes de timer sont par instance, donc les mods entrent rarement en conflit sur les timers directement. Le risque est dans les evenements `ScriptInvoker` partages ou plusieurs mods enregistrent des callbacks.

- **Ordre de chargement :** Les systemes Timer et CallQueue sont independants de l'ordre de chargement. Chaque mod gere ses propres timers.
- **Conflits de classes moddees :** Pas de conflits directs, mais si deux mods redefinissent `OnUpdate()` sur la meme classe (par ex. `MissionServer`) et que l'un oublie `super`, les timers a base d'accumulateur de l'autre cessent de fonctionner.
- **Impact sur les performances :** Chaque `CallLater` actif avec `repeat = true` est verifie a chaque trame. Des centaines d'appels repetitifs degradent le taux de tick du serveur. Preferez moins de timers avec des intervalles plus longs, ou utilisez le patron accumulateur dans `OnUpdate`.
- **Serveur/Client :** `CallLater` et `Timer` fonctionnent des deux cotes. Utilisez `CALL_CATEGORY_GAMEPLAY` pour la logique de jeu, `CALL_CATEGORY_GUI` pour les mises a jour d'interface (client uniquement), et `CALL_CATEGORY_SYSTEM` pour les operations bas niveau.

---

## Observe dans les mods reels

> Ces patrons ont ete confirmes en etudiant le code source de mods DayZ professionnels.

| Patron | Mod | Fichier/Emplacement |
|--------|-----|---------------------|
| Nettoyage `Remove()` dans le destructeur pour chaque enregistrement `CallLater` | COT | Cycle de vie du gestionnaire de modules |
| Bus d'evenements `ScriptInvoker` pour les notifications inter-modules | Expansion | `ExpansionEventBus` |
| `Timer` avec `Pause()`/`Continue()` pour le compte a rebours de deconnexion | Vanilla | Systeme de deconnexion `MissionServer` |
| Patron accumulateur dans `OnUpdate` pour des verifications periodiques de 5 secondes | Dabs Framework | Planification des ticks de modules |

---

[<< Precedent : Notifications](06-notifications.md) | **Timers & CallQueue** | [Suivant : E/S fichiers & JSON >>](08-file-io.md)
