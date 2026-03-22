# Chapitre 5.3 : Credits.json

[Accueil](../README.md) | [<< Précédent : inputs.xml](02-inputs-xml.md) | **Credits.json** | [Suivant : Format ImageSet >>](04-imagesets.md)

---

> **Résumé :** Le fichier `Credits.json` définit les crédits que DayZ affiche pour votre mod dans le menu des mods du jeu. Il liste les membres de l'équipe, les contributeurs et les remerciements organisés par départements et sections. Bien que purement cosmétique, c'est la manière standard de créditer votre équipe de développement.

---

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Emplacement du fichier](#emplacement-du-fichier)
- [Structure JSON](#structure-json)
- [Comment DayZ affiche les crédits](#comment-dayz-affiche-les-crédits)
- [Utiliser des noms de section localisés](#utiliser-des-noms-de-section-localisés)
- [Modèles](#modèles)
- [Exemples réels](#exemples-réels)
- [Erreurs courantes](#erreurs-courantes)

---

## Vue d'ensemble

Lorsqu'un joueur sélectionne votre mod dans le lanceur DayZ ou dans le menu des mods en jeu, le moteur recherche un fichier `Credits.json` à l'intérieur du PBO de votre mod. S'il est trouvé, les crédits sont affichés dans une vue défilante organisée en départements et sections --- similaire aux génériques de film.

Le fichier est optionnel. S'il est absent, aucune section de crédits n'apparaît pour votre mod. Mais en inclure un est une bonne pratique : cela reconnaît le travail de votre équipe et donne à votre mod une apparence professionnelle.

---

## Emplacement du fichier

Placez `Credits.json` dans un sous-dossier `Data` de votre répertoire Scripts, ou directement à la racine de Scripts :

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      Scripts/
        Data/
          Credits.json       <-- Emplacement courant (COT, Expansion, DayZ Editor)
        Credits.json         <-- Également valide (DabsFramework, Colorful-UI)
```

Les deux emplacements fonctionnent. Le moteur parcourt le contenu du PBO à la recherche d'un fichier nommé `Credits.json` (sensible à la casse sur certaines plateformes).

---

## Structure JSON

Le fichier utilise une structure JSON simple avec trois niveaux de hiérarchie :

```json
{
    "Header": "My Mod Name",
    "Departments": [
        {
            "DepartmentName": "Department Title",
            "Sections": [
                {
                    "SectionName": "Section Title",
                    "Names": ["Person 1", "Person 2"]
                }
            ]
        }
    ]
}
```

### Champs de niveau supérieur

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `Header` | string | Non | Titre principal affiché en haut des crédits. S'il est omis, aucun en-tête n'est affiché. |
| `Departments` | array | Oui | Tableau d'objets département |

### Objet Département

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `DepartmentName` | string | Oui | Texte d'en-tête de section. Peut être vide `""` pour un regroupement visuel sans en-tête. |
| `Sections` | array | Oui | Tableau d'objets section dans ce département |

### Objet Section

Deux variantes existent dans la pratique pour lister les noms. Le moteur prend en charge les deux.

**Variante 1 : Tableau `Names`** (utilisée par MyMod Core)

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `SectionName` | string | Oui | Sous-en-tête dans le département |
| `Names` | array de strings | Oui | Liste des noms de contributeurs |

**Variante 2 : Tableau `SectionLines`** (utilisée par COT, Expansion, DabsFramework)

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `SectionName` | string | Oui | Sous-en-tête dans le département |
| `SectionLines` | array de strings | Oui | Liste des noms de contributeurs ou lignes de texte |

Les deux variantes `Names` et `SectionLines` remplissent le même objectif. Utilisez celle que vous préférez --- le moteur les affiche de manière identique.

---

## Comment DayZ affiche les crédits

L'affichage des crédits suit cette hiérarchie visuelle :

```
╔══════════════════════════════════╗
║         MY MOD NAME              ║  <-- Header (grand, centré)
║                                  ║
║     DEPARTMENT NAME              ║  <-- DepartmentName (moyen, centré)
║                                  ║
║     Section Name                 ║  <-- SectionName (petit, centré)
║     Person 1                     ║  <-- Names/SectionLines (liste)
║     Person 2                     ║
║     Person 3                     ║
║                                  ║
║     Another Section              ║
║     Person A                     ║
║     Person B                     ║
║                                  ║
║     ANOTHER DEPARTMENT           ║
║     ...                          ║
╚══════════════════════════════════╝
```

- Le `Header` apparaît une seule fois en haut
- Chaque `DepartmentName` agit comme un séparateur de section majeure
- Chaque `SectionName` agit comme un sous-titre
- Les noms défilent verticalement dans la vue des crédits

### Chaînes vides pour l'espacement

Expansion utilise des chaînes vides pour `DepartmentName` et `SectionName`, ainsi que des entrées composées uniquement d'espaces dans `SectionLines`, pour créer un espacement visuel :

```json
{
    "DepartmentName": "",
    "Sections": [{
        "SectionName": "",
        "SectionLines": ["           "]
    }]
}
```

C'est une astuce courante pour contrôler la mise en page visuelle dans le défilement des crédits.

---

## Utiliser des noms de section localisés

Les noms de section peuvent référencer des clés de stringtable en utilisant le préfixe `#`, tout comme le texte d'interface :

```json
{
    "SectionName": "#STR_EXPANSION_CREDITS_SCRIPTERS",
    "SectionLines": ["Steve aka Salutesh", "LieutenantMaster"]
}
```

Lorsque le moteur affiche ceci, il résout `#STR_EXPANSION_CREDITS_SCRIPTERS` vers le texte localisé correspondant à la langue du joueur. C'est utile si votre mod prend en charge plusieurs langues et que vous souhaitez que les en-têtes de section des crédits soient traduits.

Les noms de département peuvent également utiliser des références stringtable :

```json
{
    "DepartmentName": "#legal_notices",
    "Sections": [...]
}
```

---

## Modèles

### Développeur solo

```json
{
    "Header": "My Awesome Mod",
    "Departments": [
        {
            "DepartmentName": "Development",
            "Sections": [
                {
                    "SectionName": "Developer",
                    "Names": ["YourName"]
                }
            ]
        }
    ]
}
```

### Petite équipe

```json
{
    "Header": "My Mod",
    "Departments": [
        {
            "DepartmentName": "Development",
            "Sections": [
                {
                    "SectionName": "Developers",
                    "Names": ["Lead Dev", "Co-Developer"]
                },
                {
                    "SectionName": "3D Artists",
                    "Names": ["Modeler1", "Modeler2"]
                },
                {
                    "SectionName": "Translators",
                    "Names": [
                        "Translator1 (French)",
                        "Translator2 (German)",
                        "Translator3 (Russian)"
                    ]
                }
            ]
        }
    ]
}
```

### Structure professionnelle complète

```json
{
    "Header": "My Big Mod",
    "Departments": [
        {
            "DepartmentName": "Core Team",
            "Sections": [
                {
                    "SectionName": "Lead Developer",
                    "Names": ["ProjectLead"]
                },
                {
                    "SectionName": "Scripters",
                    "Names": ["Dev1", "Dev2", "Dev3"]
                },
                {
                    "SectionName": "3D Artists",
                    "Names": ["Artist1", "Artist2"]
                },
                {
                    "SectionName": "Mapping",
                    "Names": ["Mapper1"]
                }
            ]
        },
        {
            "DepartmentName": "Community",
            "Sections": [
                {
                    "SectionName": "Translators",
                    "Names": [
                        "Translator1 (Czech)",
                        "Translator2 (German)",
                        "Translator3 (Russian)"
                    ]
                },
                {
                    "SectionName": "Testers",
                    "Names": ["Tester1", "Tester2", "Tester3"]
                }
            ]
        },
        {
            "DepartmentName": "Legal Notices",
            "Sections": [
                {
                    "SectionName": "Licenses",
                    "Names": [
                        "Font Awesome - CC BY 4.0 License",
                        "Some assets licensed under ADPL-SA"
                    ]
                }
            ]
        }
    ]
}
```

---

## Exemples réels

### MyMod Core

Un fichier de crédits minimal mais complet utilisant la variante `Names` :

```json
{
    "Header": "MyMod Core",
    "Departments": [
        {
            "DepartmentName": "Development",
            "Sections": [
                {
                    "SectionName": "Framework",
                    "Names": ["Documentation Team"]
                }
            ]
        }
    ]
}
```

### Community Online Tools (COT)

Utilise la variante `SectionLines` avec plusieurs sections et remerciements :

```json
{
    "Departments": [
        {
            "DepartmentName": "Community Online Tools",
            "Sections": [
                {
                    "SectionName": "Active Developers",
                    "SectionLines": [
                        "LieutenantMaster",
                        "LAVA (liquidrock)"
                    ]
                },
                {
                    "SectionName": "Inactive Developers",
                    "SectionLines": [
                        "Jacob_Mango",
                        "Arkensor",
                        "DannyDog68",
                        "Thurston",
                        "GrosTon1"
                    ]
                },
                {
                    "SectionName": "Thank you to the following communities",
                    "SectionLines": [
                        "PIPSI.NET AU/NZ",
                        "1SKGaming",
                        "AWG",
                        "Expansion Mod Team",
                        "Bohemia Interactive"
                    ]
                }
            ]
        }
    ]
}
```

À noter : COT omet entièrement le champ `Header`. Le nom du mod provient d'autres métadonnées (config.cpp `CfgMods`).

### DabsFramework

```json
{
    "Departments": [{
        "DepartmentName": "Development",
        "Sections": [{
                "SectionName": "Developers",
                "SectionLines": [
                    "InclementDab",
                    "Gormirn"
                ]
            },
            {
                "SectionName": "Translators",
                "SectionLines": [
                    "InclementDab",
                    "DanceOfJesus (French)",
                    "MarioE (Spanish)",
                    "Dubinek (Czech)",
                    "Steve AKA Salutesh (German)",
                    "Yuki (Russian)",
                    ".magik34 (Polish)",
                    "Daze (Hungarian)"
                ]
            }
        ]
    }]
}
```

### DayZ Expansion

Expansion démontre l'utilisation la plus sophistiquée de Credits.json, incluant :
- Des noms de section localisés via des références stringtable (`#STR_EXPANSION_CREDITS_SCRIPTERS`)
- Des mentions légales en tant que département séparé
- Des noms de département et de section vides pour l'espacement visuel
- Une liste de supporters avec des dizaines de noms

---

## Erreurs courantes

### Syntaxe JSON invalide

Le problème le plus courant. Le JSON est strict concernant :
- **Virgules finales** : `["a", "b",]` est du JSON invalide (la virgule finale après `"b"`)
- **Guillemets simples** : Utilisez `"guillemets doubles"`, pas `'guillemets simples'`
- **Clés sans guillemets** : `DepartmentName` doit être `"DepartmentName"`

Utilisez un validateur JSON avant la publication.

### Mauvais nom de fichier

Le fichier doit être nommé exactement `Credits.json` (C majuscule). Sur les systèmes de fichiers sensibles à la casse, `credits.json` ou `CREDITS.JSON` ne seront pas trouvés.

### Mélange de Names et SectionLines

Au sein d'une même section, utilisez l'un ou l'autre :

```json
{
    "SectionName": "Developers",
    "Names": ["Dev1"],
    "SectionLines": ["Dev2"]
}
```

Ceci est ambigu. Choisissez un format et utilisez-le de manière cohérente dans tout le fichier.

### Problèmes d'encodage

Enregistrez le fichier en UTF-8. Les caractères non-ASCII (noms accentués, caractères CJK) nécessitent un encodage UTF-8 pour s'afficher correctement en jeu.

---

## Bonnes pratiques

- Validez votre JSON avec un outil externe avant de le packer dans un PBO -- le moteur ne donne aucun message d'erreur utile pour du JSON malformé.
- Utilisez la variante `SectionLines` pour la cohérence, car c'est le format utilisé par COT, Expansion et DabsFramework.
- Incluez un département « Legal Notices » si votre mod contient des ressources tierces (polices, icônes, sons) avec des exigences d'attribution.
- Gardez le champ `Header` cohérent avec le `name` de votre mod dans `mod.cpp` et `config.cpp` pour une identité uniforme.
- Utilisez les chaînes vides `DepartmentName` et `SectionName` avec parcimonie pour l'espacement visuel -- un usage excessif rend les crédits fragmentés.

---

## Compatibilité et impact

- **Multi-Mod :** Chaque mod possède son propre fichier `Credits.json` indépendant. Il n'y a aucun risque de collision -- le moteur lit le fichier depuis chaque PBO de mod séparément.
- **Performance :** Les crédits ne sont chargés que lorsque le joueur ouvre l'écran de détails du mod. La taille du fichier n'a aucun impact sur les performances en jeu.
