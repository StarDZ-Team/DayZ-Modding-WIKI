# Chapter 5.3: Credits.json

[Home](../../README.md) | [<< Previous: inputs.xml](02-inputs-xml.md) | **Credits.json** | [Next: ImageSet Format >>](04-imagesets.md)

---

## Inhaltsverzeichnis

- [Overview](#overview)
- [File Location](#file-location)
- [JSON Structure](#json-structure)
- [How DayZ Displays Credits](#how-dayz-displays-credits)
- [Using Localized Section Names](#using-localized-section-names)
- [Templates](#templates)
- [Real Examples](#real-examples)
- [Common Mistakes](#common-mistakes)

---

## Überblick

When a player selects your mod in the DayZ launcher or in-game mod menu, the engine looks for a `Credits.json` file inside your mod's PBO. If found, the credits are displayed in a scrolling view organized into departments and sections --- similar to movie credits.

The file is optional. If absent, no credits section appears for your mod. But including one is good practice: it acknowledges your team's work and gives your mod a professional appearance.

---

## File Location

Place `Credits.json` inside a `Data` subfolder of your Scripts directory, or directly in the Scripts root:

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      Scripts/
        Data/
          Credits.json       <-- Common location (COT, Expansion, DayZ Editor)
        Credits.json         <-- Also valid (DabsFramework, Colorful-UI)
```

Both locations work. The engine scans the PBO contents for a file named `Credits.json` (case-sensitive on some platforms).

---

## JSON Structure

The file uses a straightforward JSON structure with three levels of hierarchy:

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

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Header` | string | No | Main title displayed at the top of the credits. If omitted, no header is shown. |
| `Departments` | array | Yes | Array of department objects |

### Department Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `DepartmentName` | string | Yes | Section header text. Can be empty `""` for visual grouping without a header. |
| `Sections` | array | Yes | Array of section objects within this department |

### Section Object

Two variants exist in the wild for listing names. The engine supports both.

**Variant 1: `Names` array** (used by MyFramework)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `SectionName` | string | Yes | Sub-header within the department |
| `Names` | array of strings | Yes | List of contributor names |

**Variant 2: `SectionLines` array** (used by COT, Expansion, DabsFramework)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `SectionName` | string | Yes | Sub-header within the department |
| `SectionLines` | array of strings | Yes | List of contributor names or text lines |

Both `Names` and `SectionLines` serve the same purpose. Use whichever you prefer --- the engine renders them identically.

---

## How DayZ Displays Credits

The credits display follows this visual hierarchy:

```
╔══════════════════════════════════╗
║         MY MOD NAME              ║  <-- Header (large, centered)
║                                  ║
║     DEPARTMENT NAME              ║  <-- DepartmentName (medium, centered)
║                                  ║
║     Section Name                 ║  <-- SectionName (small, centered)
║     Person 1                     ║  <-- Names/SectionLines (list)
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

- The `Header` appears once at the top
- Each `DepartmentName` acts as a major section divider
- Each `SectionName` acts as a sub-heading
- Names scroll vertically in the credits view

### Empty Strings for Spacing

Expansion uses empty `DepartmentName` and `SectionName` strings, plus whitespace-only entries in `SectionLines`, to create visual spacing:

```json
{
    "DepartmentName": "",
    "Sections": [{
        "SectionName": "",
        "SectionLines": ["           "]
    }]
}
```

This is a common trick for controlling visual layout in the credits scroll.

---

## Using Localized Section Names

Section names can reference stringtable keys using the `#` prefix, just like UI text:

```json
{
    "SectionName": "#STR_EXPANSION_CREDITS_SCRIPTERS",
    "SectionLines": ["Steve aka Salutesh", "LieutenantMaster"]
}
```

When the engine renders this, it resolves `#STR_EXPANSION_CREDITS_SCRIPTERS` to the localized text matching the player's language. This is useful if your mod supports multiple languages and you want the credits section headers to be translated.

Department names can also use stringtable references:

```json
{
    "DepartmentName": "#legal_notices",
    "Sections": [...]
}
```

---

## Templates

### Solo Developer

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

### Small Team

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

### Full Professional Structure

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

## Praxisbeispiele

### MyFramework

A minimal but complete credits file using the `Names` variant:

```json
{
    "Header": "MyFramework",
    "Departments": [
        {
            "DepartmentName": "Development",
            "Sections": [
                {
                    "SectionName": "Framework",
                    "Names": ["MyMod Team"]
                }
            ]
        }
    ]
}
```

### Community Online Tools (COT)

Uses the `SectionLines` variant with multiple sections and acknowledgments:

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

Notable: COT omits the `Header` field entirely. The mod name comes from other metadata (config.cpp `CfgMods`).

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

Expansion demonstrates the most sophisticated use of Credits.json, including:
- Localized section names via stringtable references (`#STR_EXPANSION_CREDITS_SCRIPTERS`)
- Legal notices as a separate department
- Empty department and section names for visual spacing
- A supporters list with dozens of names

---

## Häufige Fehler

### Invalid JSON Syntax

The most common issue. JSON is strict about:
- **Trailing commas**: `["a", "b",]` is invalid JSON (the trailing comma after `"b"`)
- **Single quotes**: Use `"double quotes"`, not `'single quotes'`
- **Unquoted keys**: `DepartmentName` must be `"DepartmentName"`

Use a JSON validator before shipping.

### Wrong File Name

The file must be named exactly `Credits.json` (capital C). On case-sensitive file systems, `credits.json` or `CREDITS.JSON` will not be found.

### Mixing Names and SectionLines

Within a single section, use one or the other:

```json
{
    "SectionName": "Developers",
    "Names": ["Dev1"],
    "SectionLines": ["Dev2"]
}
```

This is ambiguous. Pick one format and use it consistently throughout the file.

### Encoding Issues

Save the file as UTF-8. Non-ASCII characters (accented names, CJK characters) require UTF-8 encoding to display correctly in-game.
