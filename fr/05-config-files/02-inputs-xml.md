# Chapitre 5.2 : inputs.xml --- Raccourcis clavier personnalisés

[Accueil](../../README.md) | [<< Précédent : stringtable.csv](01-stringtable.md) | **inputs.xml** | [Suivant : Credits.json >>](03-credits-json.md)

---

> **Résumé :** Le fichier `inputs.xml` permet à votre mod d'enregistrer des raccourcis clavier personnalisés qui apparaissent dans le menu Paramètres > Contrôles du joueur. Les joueurs peuvent voir, réassigner et activer/désactiver ces entrées comme les actions vanilla. C'est le mécanisme standard pour ajouter des raccourcis clavier aux mods DayZ.

---

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Emplacement du fichier](#emplacement-du-fichier)
- [Structure XML complète](#structure-xml-complète)
- [Bloc actions](#bloc-actions)
- [Bloc sorting](#bloc-sorting)
- [Bloc preset (raccourcis par défaut)](#bloc-preset-raccourcis-par-défaut)
- [Combinaisons de modificateurs](#combinaisons-de-modificateurs)
- [Entrées masquées](#entrées-masquées)
- [Touches par défaut multiples](#touches-par-défaut-multiples)
- [Accéder aux entrées en script](#accéder-aux-entrées-en-script)
- [Référence des méthodes d'entrée](#référence-des-méthodes-dentrée)
- [Suppression et désactivation des entrées](#suppression-et-désactivation-des-entrées)
- [Référence des noms de touches](#référence-des-noms-de-touches)
- [Exemples réels](#exemples-réels)
- [Erreurs courantes](#erreurs-courantes)

---

## Vue d'ensemble

Quand votre mod a besoin que le joueur appuie sur une touche --- ouvrir un menu, activer/désactiver une fonctionnalité, commander une unité IA --- vous enregistrez une action d'entrée personnalisée dans `inputs.xml`. Le moteur lit ce fichier au démarrage et intègre vos actions dans le système d'entrée universel. Les joueurs voient vos raccourcis dans le menu Paramètres > Contrôles du jeu, regroupés sous un titre que vous définissez.

Les entrées personnalisées sont identifiées par un nom d'action unique (conventionnellement préfixé par `UA` pour « User Action ») et peuvent avoir des raccourcis par défaut que les joueurs peuvent réassigner à volonté.

---

## Emplacement du fichier

Placez `inputs.xml` dans un sous-dossier `data` de votre répertoire Scripts :

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      Scripts/
        data/
          inputs.xml        <-- Ici
        3_Game/
        4_World/
        5_Mission/
```

Certains mods le placent directement dans le dossier `Scripts/`. Les deux emplacements fonctionnent. Le moteur découvre le fichier automatiquement --- aucun enregistrement dans config.cpp n'est requis.

---

## Structure XML complète

Un fichier `inputs.xml` a trois sections, toutes enveloppées dans un élément racine `<modded_inputs>` :

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <!-- Les définitions d'actions vont ici -->
        </actions>

        <sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
            <!-- Ordre de tri pour le menu des paramètres -->
        </sorting>
    </inputs>
    <preset>
        <!-- Les assignations de raccourcis par défaut vont ici -->
    </preset>
</modded_inputs>
```

Les trois sections --- `<actions>`, `<sorting>` et `<preset>` --- fonctionnent ensemble mais servent des objectifs différents.

---

## Bloc actions

Le bloc `<actions>` déclare chaque action d'entrée que votre mod fournit. Chaque action est un seul élément `<input>`.

### Syntaxe

```xml
<actions>
    <input name="UAMyModOpenMenu" loc="STR_MYMOD_INPUT_OPEN_MENU" />
    <input name="UAMyModToggleHUD" loc="STR_MYMOD_INPUT_TOGGLE_HUD" />
</actions>
```

### Attributs

| Attribut | Requis | Description |
|----------|--------|-------------|
| `name` | Oui | Identifiant unique de l'action. Convention : préfixer avec `UA` (User Action). Utilisé dans les scripts pour interroger cette entrée. |
| `loc` | Non | Clé de stringtable pour le nom d'affichage dans le menu Contrôles. **Pas de préfixe `#`** --- le système l'ajoute. |
| `visible` | Non | Mettre à `"false"` pour masquer du menu Contrôles. Par défaut `true`. |

### Convention de nommage

Les noms d'actions doivent être globalement uniques parmi tous les mods chargés. Utilisez le préfixe de votre mod :

```xml
<input name="UAMyModAdminPanel" loc="STR_MYMOD_INPUT_ADMIN_PANEL" />
<input name="UAExpansionBookToggle" loc="STR_EXPANSION_BOOK_TOGGLE" />
<input name="eAICommandMenu" loc="STR_EXPANSION_AI_COMMAND_MENU" />
```

Le préfixe `UA` est conventionnel mais pas imposé. Expansion AI utilise `eAI` comme préfixe, ce qui fonctionne aussi.

---

## Bloc sorting

Le bloc `<sorting>` contrôle comment vos entrées apparaissent dans les paramètres de Contrôles du joueur. Il définit un groupe nommé (qui devient un titre de section) et liste les entrées dans l'ordre d'affichage.

### Syntaxe

```xml
<sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
    <input name="UAMyModOpenMenu" />
    <input name="UAMyModToggleHUD" />
    <input name="UAMyModSpecialAction" />
</sorting>
```

### Attributs

| Attribut | Requis | Description |
|----------|--------|-------------|
| `name` | Oui | Identifiant interne pour ce groupe de tri |
| `loc` | Oui | Clé de stringtable pour l'en-tête du groupe affiché dans Paramètres > Contrôles |

### Affichage

Dans les paramètres de Contrôles, le joueur voit :

```
[MyMod]                          <-- depuis le loc du sorting
  Ouvrir le menu ........... [Y]   <-- depuis le loc de l'input + preset
  Basculer le HUD ......... [H]   <-- depuis le loc de l'input + preset
```

Seules les entrées listées dans le bloc `<sorting>` apparaissent dans le menu des paramètres. Les entrées définies dans `<actions>` mais non listées dans `<sorting>` sont silencieusement enregistrées mais invisibles pour le joueur (même si `visible` n'est pas explicitement mis à `false`).

---

## Bloc preset (raccourcis par défaut)

Le bloc `<preset>` assigne des touches par défaut à vos actions. Ce sont les touches avec lesquelles le joueur commence avant toute personnalisation.

### Assignation de touche simple

```xml
<preset>
    <input name="UAMyModOpenMenu">
        <btn name="kY"/>
    </input>
</preset>
```

Cela lie la touche `Y` par défaut à `UAMyModOpenMenu`.

### Pas de touche par défaut

Si vous omettez une action du bloc `<preset>`, elle n'a pas de raccourci par défaut. Le joueur doit manuellement assigner une touche dans Paramètres > Contrôles. C'est approprié pour les raccourcis optionnels ou avancés.

---

## Combinaisons de modificateurs

Pour exiger une touche modificatrice (Ctrl, Shift, Alt), imbriquez les éléments `<btn>` :

### Ctrl + clic gauche de la souris

```xml
<input name="eAISetWaypoint">
    <btn name="kLControl">
        <btn name="mBLeft"/>
    </btn>
</input>
```

Le `<btn>` extérieur est le modificateur ; le `<btn>` intérieur est la touche principale. Le joueur doit maintenir le modificateur puis appuyer sur la touche principale.

### Shift + touche

```xml
<input name="UAMyModQuickAction">
    <btn name="kLShift">
        <btn name="kQ"/>
    </btn>
</input>
```

### Règles d'imbrication

- Le `<btn>` **extérieur** est toujours le modificateur (maintenu enfoncé)
- Le `<btn>` **intérieur** est le déclencheur (appuyé pendant que le modificateur est maintenu)
- Un seul niveau d'imbrication est typique ; une imbrication plus profonde n'est pas testée et non recommandée

---

## Entrées masquées

Utilisez `visible="false"` pour enregistrer une entrée que le joueur ne peut pas voir ni réassigner dans le menu Contrôles. C'est utile pour les entrées internes utilisées par le code de votre mod qui ne devraient pas être configurables par le joueur.

```xml
<actions>
    <input name="eAITestInput" visible="false" />
    <input name="UAExpansionConfirm" loc="" visible="false" />
</actions>
```

Les entrées masquées peuvent toujours avoir des assignations de touches par défaut dans le bloc `<preset>` :

```xml
<preset>
    <input name="eAITestInput">
        <btn name="kY"/>
    </input>
</preset>
```

---

## Touches par défaut multiples

Une action peut avoir plusieurs touches par défaut. Listez plusieurs éléments `<btn>` comme frères :

```xml
<input name="UAExpansionConfirm">
    <btn name="kReturn" />
    <btn name="kNumpadEnter" />
</input>
```

`Entrée` et `Entrée du pavé numérique` déclencheront toutes deux `UAExpansionConfirm`. C'est utile pour les actions où plusieurs touches physiques devraient correspondre à la même action logique.

---

## Accéder aux entrées en script

### Obtenir l'API d'entrée

Tout accès aux entrées passe par `GetUApi()`, qui retourne l'API globale d'actions utilisateur :

```c
UAInput input = GetUApi().GetInputByName("UAMyModOpenMenu");
```

### Interrogation dans OnUpdate

Les entrées personnalisées sont typiquement interrogées dans `MissionGameplay.OnUpdate()` ou des callbacks similaires par frame :

```c
modded class MissionGameplay
{
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        UAInput input = GetUApi().GetInputByName("UAMyModOpenMenu");

        if (input.LocalPress())
        {
            // La touche vient d'être enfoncée cette frame
            OpenMyModMenu();
        }
    }
}
```

### Alternative : utiliser le nom de l'entrée directement

De nombreux mods vérifient les entrées en ligne en utilisant les méthodes `UAInputAPI` avec des noms de chaîne :

```c
override void OnUpdate(float timeslice)
{
    super.OnUpdate(timeslice);

    Input input = GetGame().GetInput();

    if (input.LocalPress("UAMyModOpenMenu", false))
    {
        OpenMyModMenu();
    }
}
```

Le paramètre `false` dans `LocalPress("name", false)` indique que la vérification ne devrait pas consommer l'événement d'entrée.

---

## Référence des méthodes d'entrée

Une fois que vous avez une référence `UAInput` (depuis `GetUApi().GetInputByName()`), ou que vous utilisez directement la classe `Input`, ces méthodes détectent différents états d'entrée :

| Méthode | Retourne | Quand vrai |
|---------|----------|------------|
| `LocalPress()` | `bool` | La touche a été enfoncée **cette frame** (déclenchement unique au key-down) |
| `LocalRelease()` | `bool` | La touche a été relâchée **cette frame** (déclenchement unique au key-up) |
| `LocalClick()` | `bool` | La touche a été enfoncée et relâchée rapidement (tap) |
| `LocalHold()` | `bool` | La touche a été maintenue enfoncée pendant une durée seuil |
| `LocalDoubleClick()` | `bool` | La touche a été tapée deux fois rapidement |
| `LocalValue()` | `float` | Valeur analogique actuelle (0.0 ou 1.0 pour les touches numériques ; variable pour les axes analogiques) |

### Patrons d'utilisation

**Basculer sur pression :**
```c
if (input.LocalPress("UAMyModToggle", false))
{
    m_IsEnabled = !m_IsEnabled;
}
```

**Maintenir pour activer, relâcher pour désactiver :**
```c
if (input.LocalPress("eAICommandMenu", false))
{
    ShowCommandWheel();
}

if (input.LocalRelease("eAICommandMenu", false) || input.LocalValue("eAICommandMenu", false) == 0)
{
    HideCommandWheel();
}
```

**Action double-tap :**
```c
if (input.LocalDoubleClick("UAMyModSpecial", false))
{
    PerformSpecialAction();
}
```

**Maintien pour action prolongée :**
```c
if (input.LocalHold("UAExpansionGPSToggle"))
{
    ToggleGPSMode();
}
```

---

## Suppression et désactivation des entrées

### ForceDisable

Désactive temporairement une entrée spécifique. Couramment utilisé lors de l'ouverture de menus pour empêcher les actions de jeu de se déclencher pendant qu'une interface est active :

```c
// Désactiver l'entrée pendant que le menu est ouvert
GetUApi().GetInputByName("UAMyModToggle").ForceDisable(true);

// Réactiver quand le menu se ferme
GetUApi().GetInputByName("UAMyModToggle").ForceDisable(false);
```

### SupressNextFrame

Supprime tout le traitement d'entrée pour la frame suivante. Utilisé pendant les transitions de contexte d'entrée (ex. fermeture de menus) pour empêcher les fuites d'entrée d'une frame :

```c
GetUApi().SupressNextFrame(true);
```

### UpdateControls

Après modification des états d'entrée, appelez `UpdateControls()` pour appliquer les changements immédiatement :

```c
GetUApi().GetInputByName("UAExpansionBookToggle").ForceDisable(false);
GetUApi().UpdateControls();
```

### Exclusions d'entrées

Le système de mission vanilla fournit des groupes d'exclusion. Quand un menu est actif, vous pouvez exclure des catégories d'entrées :

```c
// Supprimer les entrées de gameplay pendant que l'inventaire est ouvert
AddActiveInputExcludes({"inventory"});

// Restaurer à la fermeture
RemoveActiveInputExcludes({"inventory"});
```

---

## Référence des noms de touches

Les noms de touches utilisés dans l'attribut `<btn name="">` suivent une convention de nommage spécifique. Voici la référence complète.

### Touches du clavier

| Catégorie | Noms de touches |
|-----------|-----------------|
| Lettres | `kA`, `kB`, `kC`, `kD`, `kE`, `kF`, `kG`, `kH`, `kI`, `kJ`, `kK`, `kL`, `kM`, `kN`, `kO`, `kP`, `kQ`, `kR`, `kS`, `kT`, `kU`, `kV`, `kW`, `kX`, `kY`, `kZ` |
| Chiffres (rangée du haut) | `k0`, `k1`, `k2`, `k3`, `k4`, `k5`, `k6`, `k7`, `k8`, `k9` |
| Touches de fonction | `kF1`, `kF2`, `kF3`, `kF4`, `kF5`, `kF6`, `kF7`, `kF8`, `kF9`, `kF10`, `kF11`, `kF12` |
| Modificateurs | `kLControl`, `kRControl`, `kLShift`, `kRShift`, `kLAlt`, `kRAlt` |
| Navigation | `kUp`, `kDown`, `kLeft`, `kRight`, `kHome`, `kEnd`, `kPageUp`, `kPageDown` |
| Édition | `kReturn`, `kBackspace`, `kDelete`, `kInsert`, `kSpace`, `kTab`, `kEscape` |
| Pavé numérique | `kNumpad0` ... `kNumpad9`, `kNumpadEnter`, `kNumpadPlus`, `kNumpadMinus`, `kNumpadMultiply`, `kNumpadDivide`, `kNumpadDecimal` |
| Ponctuation | `kMinus`, `kEquals`, `kLBracket`, `kRBracket`, `kBackslash`, `kSemicolon`, `kApostrophe`, `kComma`, `kPeriod`, `kSlash`, `kGrave` |
| Verrouillages | `kCapsLock`, `kNumLock`, `kScrollLock` |

### Boutons de la souris

| Nom | Bouton |
|-----|--------|
| `mBLeft` | Bouton gauche de la souris |
| `mBRight` | Bouton droit de la souris |
| `mBMiddle` | Bouton du milieu (clic sur la molette) |
| `mBExtra1` | Bouton 4 de la souris (bouton latéral arrière) |
| `mBExtra2` | Bouton 5 de la souris (bouton latéral avant) |

### Axes de la souris

| Nom | Axe |
|-----|-----|
| `mAxisX` | Mouvement horizontal de la souris |
| `mAxisY` | Mouvement vertical de la souris |
| `mWheelUp` | Molette vers le haut |
| `mWheelDown` | Molette vers le bas |

### Patron de nommage

- **Clavier** : préfixe `k` + nom de la touche (ex. `kT`, `kF5`, `kLControl`)
- **Boutons de souris** : préfixe `mB` + nom du bouton (ex. `mBLeft`, `mBRight`)
- **Axes de souris** : préfixe `m` + nom de l'axe (ex. `mAxisX`, `mWheelUp`)

---

## Exemples réels

### DayZ Expansion AI

Un inputs.xml bien structuré avec des raccourcis visibles, des entrées de débogage masquées et des combinaisons de modificateurs :

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="eAICommandMenu" loc="STR_EXPANSION_AI_COMMAND_MENU"/>
            <input name="eAISetWaypoint" loc="STR_EXPANSION_AI_SET_WAYPOINT"/>
            <input name="eAITestInput" visible="false" />
            <input name="eAITestLRIncrease" visible="false" />
            <input name="eAITestLRDecrease" visible="false" />
            <input name="eAITestUDIncrease" visible="false" />
            <input name="eAITestUDDecrease" visible="false" />
        </actions>

        <sorting name="expansion" loc="STR_EXPANSION_LABEL">
            <input name="eAICommandMenu" />
            <input name="eAISetWaypoint" />
            <input name="eAITestInput" />
            <input name="eAITestLRIncrease" />
            <input name="eAITestLRDecrease" />
            <input name="eAITestUDIncrease" />
            <input name="eAITestUDDecrease" />
        </sorting>
    </inputs>
    <preset>
        <input name="eAICommandMenu">
            <btn name="kT"/>
        </input>
        <input name="eAISetWaypoint">
            <btn name="kLControl">
                <btn name="mBLeft"/>
            </btn>
        </input>
        <input name="eAITestInput">
            <btn name="kY"/>
        </input>
        <input name="eAITestLRIncrease">
            <btn name="kRight"/>
        </input>
        <input name="eAITestLRDecrease">
            <btn name="kLeft"/>
        </input>
        <input name="eAITestUDIncrease">
            <btn name="kUp"/>
        </input>
        <input name="eAITestUDDecrease">
            <btn name="kDown"/>
        </input>
    </preset>
</modded_inputs>
```

Observations clés :
- `eAICommandMenu` lié à `T` --- visible dans les paramètres, le joueur peut le réassigner
- `eAISetWaypoint` utilise une combinaison modificateur **Ctrl + clic gauche**
- Les entrées de test sont `visible="false"` --- masquées des joueurs mais accessibles dans le code

### DayZ Expansion Market

Un inputs.xml minimal pour une entrée utilitaire masquée avec plusieurs touches par défaut :

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAExpansionConfirm" loc="" visible="false" />
        </actions>
    </inputs>
    <preset>
        <input name="UAExpansionConfirm">
            <btn name="kReturn" />
            <btn name="kNumpadEnter" />
        </input>
    </preset>
</modded_inputs>
```

Observations clés :
- Entrée masquée (`visible="false"`) avec un `loc` vide --- jamais affichée dans les paramètres
- Deux touches par défaut : Entrée et Entrée du pavé numérique déclenchent la même action
- Pas de bloc `<sorting>` --- pas nécessaire puisque l'entrée est masquée

### Modèle de démarrage complet

Un modèle minimal mais complet pour un nouveau mod :

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAMyModOpenMenu" loc="STR_MYMOD_INPUT_OPEN_MENU" />
            <input name="UAMyModQuickAction" loc="STR_MYMOD_INPUT_QUICK_ACTION" />
        </actions>

        <sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
            <input name="UAMyModOpenMenu" />
            <input name="UAMyModQuickAction" />
        </sorting>
    </inputs>
    <preset>
        <input name="UAMyModOpenMenu">
            <btn name="kF6"/>
        </input>
        <!-- UAMyModQuickAction n'a pas de touche par défaut ; le joueur doit l'assigner -->
    </preset>
</modded_inputs>
```

Avec un stringtable.csv correspondant :

```csv
"Language","original","english"
"STR_MYMOD_INPUT_GROUP","My Mod","My Mod"
"STR_MYMOD_INPUT_OPEN_MENU","Open Menu","Open Menu"
"STR_MYMOD_INPUT_QUICK_ACTION","Quick Action","Quick Action"
```

---

## Erreurs courantes

### Utiliser `#` dans l'attribut loc

```xml
<!-- FAUX -->
<input name="UAMyAction" loc="#STR_MYMOD_ACTION" />

<!-- CORRECT -->
<input name="UAMyAction" loc="STR_MYMOD_ACTION" />
```

Le système d'entrées ajoute `#` en interne. L'ajouter vous-même cause un double préfixe et la recherche échoue.

### Collision de noms d'actions

Si deux mods définissent `UAOpenMenu`, un seul fonctionnera. Utilisez toujours le préfixe de votre mod :

```xml
<input name="UAMyModOpenMenu" />     <!-- Bon -->
<input name="UAOpenMenu" />          <!-- Risqué -->
```

### Entrée manquante dans le sorting

Si vous définissez une action dans `<actions>` mais oubliez de la lister dans `<sorting>`, l'action fonctionne dans le code mais est invisible dans le menu Contrôles. Le joueur n'a aucun moyen de la réassigner.

### Oublier de définir dans actions

Si vous listez une entrée dans `<sorting>` ou `<preset>` mais ne la définissez jamais dans `<actions>`, le moteur l'ignore silencieusement.

### Lier des touches en conflit

Choisir des touches qui entrent en conflit avec les raccourcis vanilla (comme `W`, `A`, `S`, `D`, `Tab`, `I`) fait que votre action et l'action vanilla se déclenchent simultanément. Utilisez des touches moins courantes (F5-F12, touches du pavé numérique) ou des combinaisons de modificateurs pour plus de sécurité.

---

## Bonnes pratiques

- Préfixez toujours les noms d'actions avec `UA` + le nom de votre mod (ex. `UAMyModOpenMenu`). Les noms génériques comme `UAOpenMenu` entreront en collision avec d'autres mods.
- Fournissez un attribut `loc` pour chaque entrée visible et définissez la clé de stringtable correspondante. Sans cela, le menu Contrôles affiche le nom brut de l'action.
- Choisissez des touches par défaut peu communes (F5-F12, pavé numérique) ou des combinaisons de modificateurs (Ctrl+touche) pour minimiser les conflits avec les raccourcis vanilla et les mods populaires.
- Listez toujours les entrées visibles dans le bloc `<sorting>`. Une entrée définie dans `<actions>` mais manquante dans `<sorting>` est invisible pour le joueur et ne peut pas être réassignée.
- Mettez en cache la référence `UAInput` depuis `GetUApi().GetInputByName()` dans une variable membre plutôt que de l'appeler à chaque frame dans `OnUpdate`. La recherche par chaîne a un surcoût.

---

## Théorie vs pratique

> Ce que dit la documentation versus comment les choses fonctionnent réellement à l'exécution.

| Concept | Théorie | Réalité |
|---------|---------|---------|
| `visible="false"` masque du menu Contrôles | L'entrée est enregistrée mais invisible | Les entrées masquées apparaissent toujours dans la liste du bloc `<sorting>` dans certaines versions de DayZ. Omettre du `<sorting>` est le moyen fiable de masquer les entrées |
| `LocalPress()` se déclenche une fois par key-down | Déclenchement unique sur la frame où la touche est enfoncée | Si le jeu saccade (FPS bas), `LocalPress()` peut être complètement raté. Pour les actions critiques, vérifiez aussi `LocalValue() > 0` comme repli |
| Combinaisons de modificateurs via `<btn>` imbriqués | L'extérieur est le modificateur, l'intérieur est le déclencheur | La touche modificatrice seule s'enregistre aussi comme une pression sur sa propre entrée (ex. `kLControl` est aussi l'accroupissement vanilla). Les joueurs maintenant Ctrl+clic s'accroupiront aussi |
| `ForceDisable(true)` supprime l'entrée | L'entrée est complètement ignorée | `ForceDisable` persiste jusqu'à être explicitement réactivé. Si votre mod plante ou l'interface se ferme sans appeler `ForceDisable(false)`, l'entrée reste désactivée jusqu'au redémarrage du jeu |
| Plusieurs `<btn>` frères | Les deux touches déclenchent la même action | Fonctionne correctement, mais le menu Contrôles n'affiche que la première touche. Le joueur peut voir et réassigner la première touche mais peut ne pas se rendre compte que la seconde par défaut existe |

---

## Compatibilité et impact

- **Multi-Mod :** Les collisions de noms d'actions sont le risque principal. Si deux mods définissent `UAOpenMenu`, un seul fonctionne et le conflit est silencieux. Il n'y a pas d'avertissement du moteur pour les noms d'actions dupliqués entre les mods.
- **Performance :** L'interrogation des entrées via `GetUApi().GetInputByName()` implique une recherche par hash de chaîne. Interroger 5-10 entrées par frame est négligeable, mais mettre en cache la référence `UAInput` est tout de même recommandé pour les mods avec de nombreuses entrées.
- **Version :** Le format `inputs.xml` et la structure `<modded_inputs>` sont stables depuis DayZ 1.0. L'attribut `visible` a été ajouté plus tard (vers 1.08) -- sur les versions plus anciennes, toutes les entrées sont toujours visibles dans le menu Contrôles.

---

## Observé dans les mods réels

| Patron | Mod | Détail |
|--------|-----|--------|
| Combinaison modificateur `Ctrl+clic` | Expansion AI | `eAISetWaypoint` utilise `<btn name="kLControl"><btn name="mBLeft"/>` imbriqué pour Ctrl+clic gauche pour placer des waypoints IA |
| Entrées utilitaires masquées | Expansion Market | `UAExpansionConfirm` est `visible="false"` avec deux touches (Entrée + Entrée pavé numérique) pour la logique de confirmation interne |
| `ForceDisable` à l'ouverture du menu | COT, VPP | Les panneaux admin appellent `ForceDisable(true)` sur les entrées de gameplay quand le panneau s'ouvre, et `ForceDisable(false)` à la fermeture pour empêcher le mouvement du personnage pendant la frappe |
| `UAInput` en cache dans une variable membre | DabsFramework | Stocke le résultat de `GetUApi().GetInputByName()` dans un champ de classe pendant l'init, interroge la référence en cache dans `OnUpdate` pour éviter la recherche par chaîne par frame |
