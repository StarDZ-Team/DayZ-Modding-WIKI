# Chapitre 5.1 : stringtable.csv --- Localisation

[Accueil](../README.md) | **stringtable.csv** | [Suivant : inputs.xml >>](02-inputs-xml.md)

---

> **Résumé :** Le fichier `stringtable.csv` fournit du texte localisé pour votre mod DayZ. Le moteur lit ce CSV au démarrage et résout les clés de traduction en fonction du paramètre de langue du joueur. Chaque chaîne visible par l'utilisateur --- labels d'interface, noms de raccourcis clavier, descriptions d'objets, textes de notification --- devrait se trouver dans une stringtable plutôt qu'être codée en dur.

---

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Format CSV](#format-csv)
- [Référence des colonnes](#référence-des-colonnes)
- [Convention de nommage des clés](#convention-de-nommage-des-clés)
- [Référencer les chaînes](#référencer-les-chaînes)
- [Créer une nouvelle stringtable](#créer-une-nouvelle-stringtable)
- [Gestion des cellules vides et comportement de repli](#gestion-des-cellules-vides-et-comportement-de-repli)
- [Flux de travail multi-langues](#flux-de-travail-multi-langues)
- [Approche modulaire de stringtable (DayZ Expansion)](#approche-modulaire-de-stringtable-dayz-expansion)
- [Exemples réels](#exemples-réels)
- [Erreurs courantes](#erreurs-courantes)

---

## Vue d'ensemble

DayZ utilise un système de localisation basé sur le CSV. Quand le moteur rencontre une clé de chaîne préfixée par `#` (par exemple, `#STR_MYMOD_HELLO`), il recherche cette clé dans tous les fichiers stringtable chargés et retourne la traduction correspondant à la langue actuelle du joueur. Si aucune correspondance n'est trouvée pour la langue active, le moteur passe à une chaîne de repli définie.

Le fichier stringtable doit s'appeler exactement `stringtable.csv` et être placé dans la structure PBO de votre mod. Le moteur le découvre automatiquement --- aucun enregistrement dans config.cpp n'est requis.

---

## Format CSV

Le fichier est un fichier standard de valeurs séparées par des virgules avec des champs entre guillemets. La première ligne est l'en-tête, et chaque ligne suivante définit une clé de traduction.

### Ligne d'en-tête

La ligne d'en-tête définit les colonnes. DayZ reconnaît jusqu'à 15 colonnes :

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
```

### Lignes de données

Chaque ligne commence par la clé de chaîne (sans préfixe `#` dans le CSV), suivie de la traduction pour chaque langue :

```csv
"STR_MYMOD_HELLO","Hello World","Hello World","Ahoj světe","Hallo Welt","Привет мир","Witaj świecie","Helló világ","Ciao mondo","Hola mundo","Bonjour le monde","你好世界","ハローワールド","Olá mundo","你好世界",
```

### Virgule finale

De nombreux fichiers stringtable incluent une virgule finale après la dernière colonne. C'est conventionnel et sans risque --- le moteur le tolère.

### Règles de guillemets

- Les champs **doivent** être entre guillemets doubles s'ils contiennent des virgules, des sauts de ligne ou des guillemets doubles.
- En pratique, la plupart des mods mettent chaque champ entre guillemets par cohérence.
- Certains mods (comme MyMod Missions) omettent entièrement les guillemets ; le moteur gère les deux styles tant que le contenu du champ ne contient pas de virgules.

---

## Référence des colonnes

DayZ supporte 13 langues sélectionnables par le joueur. Le CSV a 15 colonnes car la première colonne est le nom de la clé et la seconde est la colonne `original` (la langue natale de l'auteur du mod ou le texte par défaut).

| # | Nom de la colonne | Langue | Notes |
|---|-------------------|--------|-------|
| 1 | `Language` | --- | L'identifiant de la clé de chaîne (ex. `STR_MYMOD_HELLO`) |
| 2 | `original` | Langue natale de l'auteur | Repli de dernier recours ; utilisé si aucune autre colonne ne correspond |
| 3 | `english` | Anglais | Langue principale la plus courante pour les mods internationaux |
| 4 | `czech` | Tchèque | |
| 5 | `german` | Allemand | |
| 6 | `russian` | Russe | |
| 7 | `polish` | Polonais | |
| 8 | `hungarian` | Hongrois | |
| 9 | `italian` | Italien | |
| 10 | `spanish` | Espagnol | |
| 11 | `french` | Français | |
| 12 | `chinese` | Chinois (traditionnel) | Caractères chinois traditionnels |
| 13 | `japanese` | Japonais | |
| 14 | `portuguese` | Portugais | |
| 15 | `chinesesimp` | Chinois (simplifié) | Caractères chinois simplifiés |

### L'ordre des colonnes compte

Le moteur identifie les colonnes par leur **nom d'en-tête**, pas par leur position. Cependant, suivre l'ordre standard montré ci-dessus est fortement recommandé pour la compatibilité et la lisibilité.

### Colonnes optionnelles

Vous n'avez pas besoin d'inclure les 15 colonnes. Si votre mod ne supporte que l'anglais, vous pouvez utiliser un en-tête minimal :

```csv
"Language","english"
"STR_MYMOD_HELLO","Hello World"
```

Certains mods ajoutent des colonnes non standard comme `korean` (MyMod Missions le fait). Le moteur ignore les colonnes qu'il ne reconnaît pas comme une langue supportée, mais ces colonnes peuvent servir de documentation ou de préparation pour un futur support linguistique.

---

## Convention de nommage des clés

Les clés de chaîne suivent un patron de nommage hiérarchique :

```
STR_MODNAME_CATEGORY_ELEMENT
```

### Règles

1. **Toujours commencer par `STR_`** --- c'est une convention universelle de DayZ
2. **Préfixe du mod** --- identifie uniquement votre mod (ex. `MYMOD`, `COT`, `EXPANSION`, `VPP`)
3. **Catégorie** --- regroupe les chaînes liées (ex. `INPUT`, `TAB`, `CONFIG`, `DIR`)
4. **Élément** --- la chaîne spécifique (ex. `ADMIN_PANEL`, `NORTH`, `SAVE`)
5. **Utilisez les MAJUSCULES** --- la convention à travers tous les mods majeurs
6. **Utilisez les underscores** comme séparateurs, jamais d'espaces ou de tirets

### Exemples de mods réels

```
STR_MYMOD_INPUT_ADMIN_PANEL       -- MyMod : label de raccourci clavier
STR_MYMOD_CLOSE                   -- MyMod : bouton générique "Fermer"
STR_MYMOD_DIR_NORTH                  -- MyMod : direction de la boussole
STR_MYMOD_TAB_ONLINE                 -- MyMod : nom d'onglet du panneau admin
STR_COT_ESP_MODULE_NAME            -- COT : nom d'affichage du module
STR_COT_CAMERA_MODULE_BLUR         -- COT : label de l'outil caméra
STR_EXPANSION_ATM                  -- Expansion : nom de fonctionnalité
STR_EXPANSION_AI_COMMAND_MENU      -- Expansion : label d'entrée
```

### Anti-patrons

```
STR_hello_world          -- Mauvais : minuscules, pas de préfixe de mod
MY_STRING                -- Mauvais : préfixe STR_ manquant
STR_MYMOD Hello World    -- Mauvais : espaces dans la clé
```

---

## Référencer les chaînes

Il y a trois contextes distincts où vous référencez des chaînes localisées, et chacun utilise une syntaxe légèrement différente.

### Dans les fichiers de layout (.layout)

Utilisez le préfixe `#` avant le nom de la clé. Le moteur le résout au moment de la création du widget.

```
TextWidgetClass MyLabel {
 text "#STR_MYMOD_CLOSE"
 size 100 30
}
```

Le préfixe `#` indique au parseur de layout « ceci est une clé de localisation, pas du texte littéral ».

### Dans le script Enforce (fichiers .c)

Utilisez `Widget.TranslateString()` pour résoudre la clé à l'exécution. Le préfixe `#` est requis dans l'argument.

```c
string translated = Widget.TranslateString("#STR_MYMOD_CLOSE");
// translated == "Close" (si la langue du joueur est l'anglais)
// translated == "Fermer" (si la langue du joueur est le français)
```

Vous pouvez aussi définir le texte du widget directement :

```c
TextWidget label = TextWidget.Cast(layoutRoot.FindAnyWidget("MyLabel"));
label.SetText(Widget.TranslateString("#STR_MYMOD_ADMIN_PANEL"));
```

Ou utiliser les clés de chaîne directement dans les propriétés de texte du widget, et le moteur les résout :

```c
label.SetText("#STR_MYMOD_ADMIN_PANEL");  // Fonctionne aussi -- le moteur résout automatiquement
```

### Dans inputs.xml

Utilisez l'attribut `loc` **sans** le préfixe `#`.

```xml
<input name="UAMyAction" loc="STR_MYMOD_INPUT_MY_ACTION" />
```

C'est le seul endroit où vous omettez le `#`. Le système d'entrées l'ajoute en interne.

### Tableau récapitulatif

| Contexte | Syntaxe | Exemple |
|----------|---------|---------|
| Attribut `text` du layout | `#STR_KEY` | `text "#STR_MYMOD_CLOSE"` |
| Script `TranslateString()` | `"#STR_KEY"` | `Widget.TranslateString("#STR_MYMOD_CLOSE")` |
| Texte de widget en script | `"#STR_KEY"` | `label.SetText("#STR_MYMOD_CLOSE")` |
| Attribut `loc` de inputs.xml | `STR_KEY` (sans #) | `loc="STR_MYMOD_INPUT_ADMIN_PANEL"` |

---

## Créer une nouvelle stringtable

### Étape 1 : créer le fichier

Créez `stringtable.csv` à la racine du répertoire de contenu PBO de votre mod. Le moteur scanne tous les PBO chargés à la recherche de fichiers nommés exactement `stringtable.csv`.

Emplacement typique :

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      config.cpp
      stringtable.csv        <-- Ici
      Scripts/
        3_Game/
        4_World/
        5_Mission/
```

### Étape 2 : écrire l'en-tête

Commencez avec l'en-tête complet à 15 colonnes :

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
```

### Étape 3 : ajouter vos chaînes

Ajoutez une ligne par chaîne traduisible. Commencez par l'anglais, remplissez les autres langues au fur et à mesure que les traductions deviennent disponibles :

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_TITLE","My Cool Mod","My Cool Mod","","","","","","","","","","","","",
"STR_MYMOD_OPEN","Open","Open","Otevřít","Öffnen","Открыть","Otwórz","Megnyitás","Apri","Abrir","Ouvrir","打开","開く","Abrir","打开",
```

### Étape 4 : empaqueter et tester

Compilez votre PBO. Lancez le jeu. Vérifiez que `Widget.TranslateString("#STR_MYMOD_TITLE")` retourne « My Cool Mod » dans vos logs de script. Changez la langue du jeu dans les paramètres pour vérifier le comportement de repli.

---

## Gestion des cellules vides et comportement de repli

Quand le moteur recherche une clé de chaîne pour la langue actuelle du joueur et trouve une cellule vide, il suit une chaîne de repli :

1. **Colonne de la langue sélectionnée par le joueur** --- vérifiée en premier
2. **Colonne `english`** --- si la cellule de la langue du joueur est vide
3. **Colonne `original`** --- si `english` est aussi vide
4. **Nom brut de la clé** --- si toutes les colonnes sont vides, le moteur affiche la clé elle-même (ex. `STR_MYMOD_TITLE`)

Cela signifie que vous pouvez en toute sécurité laisser les colonnes non-anglaises vides pendant le développement. Les joueurs anglophones voient la colonne `english`, et les autres joueurs voient le repli anglais jusqu'à ce qu'une traduction appropriée soit ajoutée.

### Implication pratique

Vous n'avez pas besoin de copier le texte anglais dans chaque colonne comme placeholder. Laissez les cellules non traduites vides :

```csv
"STR_MYMOD_HELLO","Hello","Hello","","","","","","","","","","","","",
```

Les joueurs dont la langue est l'allemand verront « Hello » (le repli anglais) jusqu'à ce qu'une traduction allemande soit fournie.

---

## Flux de travail multi-langues

### Pour les développeurs solo

1. Écrivez toutes les chaînes en anglais (colonnes `original` et `english`).
2. Publiez le mod. L'anglais sert de repli universel.
3. Au fur et à mesure que des membres de la communauté proposent des traductions, remplissez les colonnes supplémentaires.
4. Recompilez et publiez les mises à jour.

### Pour les équipes avec des traducteurs

1. Maintenez le CSV dans un dépôt partagé ou un tableur.
2. Assignez un traducteur par langue.
3. Utilisez la colonne `original` pour la langue natale de l'auteur (ex. le portugais pour les développeurs brésiliens).
4. La colonne `english` est toujours remplie --- c'est la base internationale.
5. Utilisez un outil de diff pour suivre quelles clés ont été ajoutées depuis la dernière passe de traduction.

### Utilisation de logiciels de tableur

Les fichiers CSV s'ouvrent naturellement dans Excel, Google Sheets ou LibreOffice Calc. Soyez conscient de ces pièges :

- **Excel peut ajouter un BOM (Byte Order Mark)** aux fichiers UTF-8. DayZ gère le BOM, mais cela peut causer des problèmes avec certains outils. Sauvegardez en « CSV UTF-8 » pour être sûr.
- **Le formatage automatique d'Excel** peut altérer les champs qui ressemblent à des dates ou des nombres.
- **Fins de ligne** : DayZ accepte à la fois `\r\n` (Windows) et `\n` (Unix).

---

## Approche modulaire de stringtable (DayZ Expansion)

DayZ Expansion démontre une bonne pratique pour les gros mods : diviser les traductions en plusieurs fichiers stringtable organisés par module fonctionnel. Leur structure utilise 20 fichiers stringtable séparés à l'intérieur d'un répertoire `languagecore` :

```
DayZExpansion/
  languagecore/
    AI/stringtable.csv
    BaseBuilding/stringtable.csv
    Book/stringtable.csv
    Chat/stringtable.csv
    Core/stringtable.csv
    Garage/stringtable.csv
    Groups/stringtable.csv
    Hardline/stringtable.csv
    Licensed/stringtable.csv
    Main/stringtable.csv
    MapAssets/stringtable.csv
    Market/stringtable.csv
    Missions/stringtable.csv
    Navigation/stringtable.csv
    PersonalStorage/stringtable.csv
    PlayerList/stringtable.csv
    Quests/stringtable.csv
    SpawnSelection/stringtable.csv
    Vehicles/stringtable.csv
    Weapons/stringtable.csv
```

### Pourquoi diviser ?

- **Gérabilité** : une seule stringtable pour un gros mod peut atteindre des milliers de lignes. Diviser par module fonctionnel rend chaque fichier gérable.
- **Mises à jour indépendantes** : les traducteurs peuvent travailler sur un module à la fois sans conflits de fusion.
- **Inclusion conditionnelle** : le PBO de chaque sous-mod n'inclut que la stringtable de sa propre fonctionnalité, gardant les tailles de PBO plus petites.

### Fonctionnement

Le moteur scanne chaque PBO chargé à la recherche de `stringtable.csv`. Comme chaque sous-module Expansion est empaqueté dans son propre PBO, chacun inclut naturellement seulement sa propre stringtable. Aucune configuration spéciale n'est nécessaire --- nommez simplement le fichier `stringtable.csv` et placez-le dans le PBO.

Les noms de clés utilisent toujours un préfixe global (`STR_EXPANSION_`) pour éviter les collisions.

---

## Exemples réels

### MyMod Core

MyMod Core utilise le format complet à 15 colonnes avec le portugais comme langue `original` (la langue natale de l'équipe de développement) et des traductions complètes pour les 13 langues supportées :

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_INPUT_GROUP","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod",
"STR_MYMOD_INPUT_ADMIN_PANEL","Painel Admin","Open Admin Panel","Otevřít Admin Panel","Admin-Panel öffnen","Открыть Админ Панель","Otwórz Panel Admina","Admin Panel megnyitása","Apri Pannello Admin","Abrir Panel Admin","Ouvrir le Panneau Admin","打开管理面板","管理パネルを開く","Abrir Painel Admin","打开管理面板",
"STR_MYMOD_CLOSE","Fechar","Close","Zavřít","Schließen","Закрыть","Zamknij","Bezárás","Chiudi","Cerrar","Fermer","关闭","閉じる","Fechar","关闭",
"STR_MYMOD_SAVE","Salvar","Save","Uložit","Speichern","Сохранить","Zapisz","Mentés","Salva","Guardar","Sauvegarder","保存","保存","Salvar","保存",
```

Patrons notables :
- `original` contient du texte portugais (la langue natale de l'équipe)
- `english` est toujours rempli comme base internationale
- Les 13 colonnes de langues sont peuplées

### COT (Community Online Tools)

COT utilise le même format à 15 colonnes. Ses clés suivent le patron `STR_COT_MODULE_CATEGORY_ELEMENT` :

```csv
Language,original,english,czech,german,russian,polish,hungarian,italian,spanish,french,chinese,japanese,portuguese,chinesesimp,
STR_COT_CAMERA_MODULE_BLUR,Blur:,Blur:,Rozmazání:,Weichzeichner:,Размытие:,Rozmycie:,Elmosódás:,Sfocatura:,Desenfoque:,Flou:,模糊:,ぼかし:,Desfoque:,模糊:,
STR_COT_ESP_MODULE_NAME,Camera Tools,Camera Tools,Nástroje kamery,Kamera-Werkzeuge,Камера,Narzędzia Kamery,Kamera Eszközök,Strumenti Camera,Herramientas de Cámara,Outils Caméra,相機工具,カメラツール,Ferramentas da Câmera,相机工具,
```

### VPP Admin Tools

VPP utilise un jeu de colonnes réduit (13 colonnes, pas de colonne `hungarian`) et ne préfixe pas les clés avec `STR_` :

```csv
"Language","original","english","czech","german","russian","polish","italian","spanish","french","chinese","japanese","portuguese","chinesesimp"
"vpp_focus_on_game","[Hold/2xTap] Focus On Game","[Hold/2xTap] Focus On Game","...","...","...","...","...","...","...","...","...","...","..."
```

Cela démontre que le préfixe `STR_` est une convention, pas une exigence. Cependant, l'omettre signifie que vous ne pouvez pas utiliser la résolution par préfixe `#` dans les fichiers de layout. VPP référence ces clés uniquement via le code de script. Le préfixe `STR_` est fortement recommandé pour tous les nouveaux mods.

### MyMod Missions

MyMod Missions utilise un CSV de style sans guillemets, sans en-tête (pas de guillemets autour des champs) avec une colonne `Korean` supplémentaire :

```csv
Language,English,Czech,German,Russian,Polish,Hungarian,Italian,Spanish,French,Chinese,Japanese,Portuguese,Korean
STR_MYMOD_MISSION_AVAILABLE,MISSION AVAILABLE,MISE K DISPOZICI,MISSION VERFÜGBAR,МИССИЯ ДОСТУПНА,...
```

Notable : la colonne `original` est absente, et `Korean` est ajouté comme langue supplémentaire. Le moteur ignore les noms de colonnes non reconnus, donc `Korean` sert de documentation jusqu'à ce que le support officiel du coréen soit ajouté.

---

## Erreurs courantes

### Oublier le préfixe `#` dans les scripts

```c
// FAUX -- affiche la clé brute, pas la traduction
label.SetText("STR_MYMOD_HELLO");

// CORRECT
label.SetText("#STR_MYMOD_HELLO");
```

### Utiliser `#` dans inputs.xml

```xml
<!-- FAUX -- le système d'entrées ajoute # en interne -->
<input name="UAMyAction" loc="#STR_MYMOD_MY_ACTION" />

<!-- CORRECT -->
<input name="UAMyAction" loc="STR_MYMOD_MY_ACTION" />
```

### Clés dupliquées entre mods

Si deux mods définissent `STR_CLOSE`, le moteur utilise celui dont le PBO est chargé en dernier. Utilisez toujours votre préfixe de mod :

```csv
"STR_MYMOD_CLOSE","Close","Close",...
```

### Nombre de colonnes incohérent

Si une ligne a moins de colonnes que l'en-tête, le moteur peut silencieusement l'ignorer ou assigner des chaînes vides aux colonnes manquantes. Assurez-vous toujours que chaque ligne a le même nombre de champs que l'en-tête.

### Problèmes de BOM

Certains éditeurs de texte insèrent un BOM UTF-8 (byte order mark) au début du fichier. Cela peut causer la rupture silencieuse de la première clé du CSV. Si votre première clé de chaîne ne se résout jamais, vérifiez et supprimez le BOM.

### Utiliser des virgules dans des champs non entre guillemets

```csv
STR_MYMOD_MSG,Hello, World,Hello, World,...
```

Cela casse l'analyse car `Hello` et ` World` sont lus comme des colonnes séparées. Soit mettez le champ entre guillemets, soit évitez les virgules dans les valeurs :

```csv
"STR_MYMOD_MSG","Hello, World","Hello, World",...
```

---

## Bonnes pratiques

- Utilisez toujours le préfixe `STR_MODNAME_` pour chaque clé. Cela empêche les collisions quand plusieurs mods sont chargés ensemble.
- Mettez chaque champ du CSV entre guillemets, même si le contenu n'a pas de virgules. Cela empêche les erreurs d'analyse subtiles quand les traductions dans d'autres langues contiennent des virgules ou des caractères spéciaux.
- Remplissez la colonne `english` pour chaque clé, même si votre langue natale est différente. L'anglais est le repli universel et la base pour les traducteurs communautaires.
- Gardez une stringtable par PBO pour les petits mods. Pour les gros mods avec 500+ clés, divisez en fichiers stringtable par fonctionnalité dans des PBO séparés (en suivant le patron Expansion).
- Sauvegardez les fichiers en UTF-8 sans BOM. Si vous utilisez Excel, choisissez explicitement le format « CSV UTF-8 » à l'export.

---

## Théorie vs pratique

> Ce que dit la documentation versus comment les choses fonctionnent réellement à l'exécution.

| Concept | Théorie | Réalité |
|---------|---------|---------|
| L'ordre des colonnes n'a pas d'importance | Le moteur identifie les colonnes par nom d'en-tête | Vrai, mais certains outils communautaires et exports de tableurs réordonnent les colonnes. Garder l'ordre standard évite la confusion |
| Chaîne de repli : langue > english > original > clé brute | Cascade documentée | Si `english` et `original` sont tous deux vides, le moteur affiche la clé brute avec le préfixe `#` retiré -- utile pour repérer les traductions manquantes en jeu |
| `Widget.TranslateString()` | Résout au moment de l'appel | Le résultat est mis en cache par session. Changer la langue du jeu nécessite un redémarrage pour que les recherches de stringtable se mettent à jour |
| Plusieurs mods avec la même clé | Le dernier PBO chargé l'emporte | L'ordre de chargement des PBO n'est pas garanti entre les mods. Si deux mods définissent `STR_CLOSE`, le texte affiché dépend de quel mod se charge en dernier -- utilisez toujours un préfixe de mod |
| Préfixe `#` dans `SetText()` | Le moteur résout automatiquement les clés de localisation | Fonctionne, mais uniquement au premier appel. Si vous appelez `SetText("#STR_KEY")` puis plus tard `SetText("texte littéral")`, revenir à `SetText("#STR_KEY")` fonctionne bien -- pas de problème de cache au niveau du widget |

---

## Compatibilité et impact

- **Multi-Mod :** Les collisions de clés de chaîne sont le risque principal. Deux mods définissant `STR_ADMIN_PANEL` entreront en conflit silencieusement. Préfixez toujours les clés avec le nom de votre mod (`STR_MYMOD_ADMIN_PANEL`).
- **Performance :** La recherche de stringtable est rapide (basée sur le hash). Avoir des milliers de clés à travers plusieurs mods n'a pas d'impact mesurable sur les performances. La stringtable entière est chargée en mémoire au démarrage.
- **Version :** Le format de stringtable basé sur le CSV n'a pas changé depuis DayZ Standalone alpha. La disposition à 15 colonnes et le comportement de repli sont restés stables à travers toutes les versions.
