# Kapitel 8.5: Das DayZ Mod Template verwenden

> **Zusammenfassung:** Dieses Tutorial zeigt dir, wie du InclementDabs Open-Source DayZ Mod Template verwendest, um in Sekunden ein neues Mod-Projekt zu erstellen. Anstatt jede Datei von Grund auf neu zu erstellen, klonst du ein fertiges Geruest, das bereits die korrekte Ordnerstruktur, config.cpp, mod.cpp und Script-Layer-Stubs enthaelt. Du benennst dann ein paar Dinge um und kannst sofort mit dem Programmieren beginnen.

---

## Inhaltsverzeichnis

- [Was ist das DayZ Mod Template?](#was-ist-das-dayz-mod-template)
- [Was das Template bietet](#was-das-template-bietet)
- [Schritt 1: Template klonen oder herunterladen](#schritt-1-template-klonen-oder-herunterladen)
- [Schritt 2: Die Dateistruktur verstehen](#schritt-2-die-dateistruktur-verstehen)
- [Schritt 3: Den Mod umbenennen](#schritt-3-den-mod-umbenennen)
- [Schritt 4: config.cpp aktualisieren](#schritt-4-configcpp-aktualisieren)
- [Schritt 5: mod.cpp aktualisieren](#schritt-5-modcpp-aktualisieren)
- [Schritt 6: Script-Ordner und Dateien umbenennen](#schritt-6-script-ordner-und-dateien-umbenennen)
- [Schritt 7: Erstellen und testen](#schritt-7-erstellen-und-testen)
- [Integration mit DayZ Tools und Workbench](#integration-mit-dayz-tools-und-workbench)
- [Template vs. manuelles Setup](#template-vs-manuelles-setup)
- [Naechste Schritte](#naechste-schritte)

---

## Was ist das DayZ Mod Template?

Das **DayZ Mod Template** ist ein Open-Source-Repository, das von InclementDab gepflegt wird und ein vollstaendiges, sofort verwendbares Mod-Geruest fuer DayZ bereitstellt:

**Repository:** [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)

Anstatt jede Datei von Hand zu erstellen (wie in [Kapitel 8.1: Dein erster Mod](01-first-mod.md) beschrieben), bietet dir das Template eine vorgefertigte Verzeichnisstruktur mit allen Boilerplate-Dateien. Du klonst es, benennst ein paar Bezeichner um und kannst sofort Spiellogik schreiben.

Dies ist der empfohlene Ausgangspunkt fuer jeden, der bereits einen Hello-World-Mod erstellt hat und zu komplexeren Projekten uebergehen moechte.

---

## Was das Template bietet

Das Template enthaelt alles, was ein DayZ-Mod zum Kompilieren und Laden benoetigt:

| Datei / Ordner | Zweck |
|----------------|-------|
| `mod.cpp` | Mod-Metadaten (Name, Autor, Version), die im DayZ-Launcher angezeigt werden |
| `config.cpp` | CfgPatches- und CfgMods-Deklarationen, die den Mod beim Engine registrieren |
| `Scripts/3_Game/` | Game-Layer Script-Stubs (Enums, Konstanten, Config-Klassen) |
| `Scripts/4_World/` | World-Layer Script-Stubs (Entities, Manager, Weltinteraktionen) |
| `Scripts/5_Mission/` | Mission-Layer Script-Stubs (UI, Mission Hooks) |
| `.gitignore` | Vorkonfigurierte Ignores fuer die DayZ-Entwicklung (PBOs, Logs, Temp-Dateien) |

Das Template folgt der standardmaessigen 5-Schichten-Skripthierarchie, die in [Kapitel 2.1: Die 5-Schichten-Skripthierarchie](../02-mod-structure/01-five-layers.md) dokumentiert ist. Alle drei Script-Layer sind in der config.cpp eingebunden, sodass du sofort Code in jeder Schicht platzieren kannst, ohne zusaetzliche Konfiguration.

---

## Schritt 1: Template klonen oder herunterladen

### Option A: GitHubs "Use this template"-Funktion verwenden

1. Gehe zu [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)
2. Klicke auf den gruenen **"Use this template"**-Button oben im Repository
3. Waehle **"Create a new repository"**
4. Benenne dein Repository (z.B. `MyAwesomeMod`)
5. Klone dein neues Repository auf dein P:-Laufwerk:

```bash
cd P:\
git clone https://github.com/YourUsername/MyAwesomeMod.git
```

### Option B: Direktes Klonen

Wenn du kein eigenes GitHub-Repository brauchst, klone das Template direkt:

```bash
cd P:\
git clone https://github.com/InclementDab/DayZ-Mod-Template.git MyAwesomeMod
```

### Option C: Als ZIP herunterladen

1. Gehe zur Repository-Seite
2. Klicke auf **Code** und dann **Download ZIP**
3. Entpacke die ZIP-Datei nach `P:\MyAwesomeMod\`

---

## Schritt 2: Die Dateistruktur verstehen

Nach dem Klonen sieht dein Mod-Verzeichnis so aus:

```
P:\MyAwesomeMod\
    mod.cpp
    Scripts\
        config.cpp
        3_Game\
            ModName\
                (Game-Layer-Skripte)
        4_World\
            ModName\
                (World-Layer-Skripte)
        5_Mission\
            ModName\
                (Mission-Layer-Skripte)
```

### Wie die einzelnen Teile zusammenpassen

**`mod.cpp`** ist der Ausweis deines Mods. Sie steuert, was Spieler in der DayZ-Launcher-Modliste sehen. Siehe [Kapitel 2.3: mod.cpp & Workshop](../02-mod-structure/03-mod-cpp.md) fuer alle verfuegbaren Felder.

**`Scripts/config.cpp`** ist die wichtigste Datei. Sie teilt der DayZ-Engine mit:
- Wovon dein Mod abhaengt (`CfgPatches.requiredAddons[]`)
- Wo sich jeder Script-Layer befindet (`CfgMods.class defs`)
- Welche Praeprozessor-Defines gesetzt werden sollen (`defines[]`)

Siehe [Kapitel 2.2: config.cpp im Detail](../02-mod-structure/02-config-cpp.md) fuer eine vollstaendige Referenz.

**`Scripts/3_Game/`** wird zuerst geladen. Platziere hier Enums, Konstanten, RPC-IDs, Konfigurationsklassen und alles, was keine Weltentitaeten referenziert.

**`Scripts/4_World/`** wird als zweites geladen. Platziere hier Entity-Klassen (`modded class ItemBase`), Manager und alles, was mit Spielobjekten interagiert.

**`Scripts/5_Mission/`** wird zuletzt geladen. Platziere hier Mission Hooks (`modded class MissionServer`), UI-Panels und Startlogik. Diese Schicht kann Typen aus allen niedrigeren Schichten referenzieren.

---

## Schritt 3: Den Mod umbenennen

Das Template wird mit Platzhalternamen ausgeliefert. Du musst diese durch den tatsaechlichen Namen deines Mods ersetzen. Hier ist ein systematischer Ansatz.

### Deine Namen waehlen

Bevor du Aenderungen vornimmst, entscheide dich fuer:

| Bezeichner | Beispiel | Verwendet in |
|------------|----------|--------------|
| **Mod-Anzeigename** | `"My Awesome Mod"` | mod.cpp, config.cpp |
| **Verzeichnisname** | `MyAwesomeMod` | Ordnername, config.cpp-Pfade |
| **CfgPatches-Klasse** | `MyAwesomeMod_Scripts` | config.cpp CfgPatches |
| **CfgMods-Klasse** | `MyAwesomeMod` | config.cpp CfgMods |
| **Script-Unterordner** | `MyAwesomeMod` | Innerhalb von 3_Game/, 4_World/, 5_Mission/ |
| **Praeprozessor-Define** | `MYAWESOMEMOD` | config.cpp defines[], #ifdef-Pruefungen |

### Benennungsregeln

- **Keine Leerzeichen oder Sonderzeichen** in Verzeichnis- und Klassennamen. Verwende PascalCase oder Unterstriche.
- **CfgPatches-Klassennamen muessen global eindeutig sein.** Zwei Mods mit demselben CfgPatches-Klassennamen verursachen Konflikte. Verwende deinen Mod-Namen als Praefix.
- **Script-Unterordnernamen** innerhalb jeder Schicht sollten aus Konsistenzgruenden deinem Mod-Namen entsprechen.

---

## Schritt 4: config.cpp aktualisieren

Oeffne `Scripts/config.cpp` und aktualisiere die folgenden Abschnitte.

### CfgPatches

Ersetze den Template-Klassennamen durch deinen eigenen:

```cpp
class CfgPatches
{
    class MyAwesomeMod_Scripts    // <-- Dein eindeutiger Patch-Name
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"            // Basisspiel-Abhaengigkeit
        };
    };
};
```

Wenn dein Mod von einem anderen Mod abhaengt, fuege dessen CfgPatches-Klassennamen zu `requiredAddons[]` hinzu:

```cpp
requiredAddons[] =
{
    "DZ_Data",
    "CF_Scripts"              // Abhaengigkeit vom Community Framework
};
```

### CfgMods

Aktualisiere die Mod-Identitaet und Script-Pfade:

```cpp
class CfgMods
{
    class MyAwesomeMod
    {
        dir = "MyAwesomeMod";
        name = "My Awesome Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/5_Mission" };
            };
        };
    };
};
```

**Wichtige Punkte:**
- Der `dir`-Wert muss exakt mit dem Stammordnernamen deines Mods uebereinstimmen.
- Jeder `files[]`-Pfad ist relativ zum Mod-Stammverzeichnis.
- Das `dependencies[]`-Array sollte auflisten, in welche Vanilla-Skriptmodule du einhakst. Die meisten Mods verwenden alle drei: `"Game"`, `"World"` und `"Mission"`.

### Praeprozessor-Defines (optional)

Wenn andere Mods die Praesenz deines Mods erkennen sollen, fuege ein `defines[]`-Array hinzu:

```cpp
class MyAwesomeMod
{
    // ... (andere Felder oben)

    class defs
    {
        class gameScriptModule
        {
            value = "";
            files[] = { "MyAwesomeMod/Scripts/3_Game" };
        };
        // ... andere Module ...
    };

    // Mod-uebergreifende Erkennung aktivieren
    defines[] = { "MYAWESOMEMOD" };
};
```

Andere Mods koennen dann `#ifdef MYAWESOMEMOD` verwenden, um bedingt Code zu kompilieren, der sich mit deinem Mod integriert.

---

## Schritt 5: mod.cpp aktualisieren

Oeffne `mod.cpp` im Stammverzeichnis und aktualisiere sie mit den Informationen deines Mods:

```cpp
name         = "My Awesome Mod";
author       = "YourName";
version      = "1.0.0";
overview     = "Eine kurze Beschreibung, was dein Mod macht.";
picture      = "";             // Optional: Pfad zu einem Vorschaubild
logo         = "";             // Optional: Pfad zu einem Logo
logoSmall    = "";             // Optional: Pfad zu einem kleinen Logo
logoOver     = "";             // Optional: Pfad zu einem Logo-Hover-Zustand
tooltip      = "My Awesome Mod";
action       = "";             // Optional: URL zur Webseite deines Mods
```

Setze mindestens `name`, `author` und `overview`. Die anderen Felder sind optional, verbessern aber die Darstellung im Launcher.

---

## Schritt 6: Script-Ordner und Dateien umbenennen

Benenne die Script-Unterordner in jeder Schicht um, damit sie deinem Mod-Namen entsprechen:

```
Scripts/3_Game/ModName/    -->  Scripts/3_Game/MyAwesomeMod/
Scripts/4_World/ModName/   -->  Scripts/4_World/MyAwesomeMod/
Scripts/5_Mission/ModName/ -->  Scripts/5_Mission/MyAwesomeMod/
```

Benenne innerhalb dieser Ordner alle Platzhalter-`.c`-Dateien um und aktualisiere deren Klassennamen. Wenn das Template zum Beispiel eine Datei wie `ModInit.c` mit einer Klasse namens `ModInit` enthaelt, benenne sie in `MyAwesomeModInit.c` um und aktualisiere die Klasse:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyAwesomeMod] Server initialized!");
    }
};
```

---

## Schritt 7: Erstellen und testen

### File Patching verwenden (schnelle Iteration)

Der schnellste Weg zum Testen waehrend der Entwicklung:

```batch
DayZDiag_x64.exe -mod=P:\MyAwesomeMod -filePatching
```

Dies laedt deine Skripte direkt aus den Quellordnern, ohne ein PBO zu packen. Bearbeite eine `.c`-Datei, starte das Spiel neu und sieh die Aenderungen sofort.

### Addon Builder verwenden (fuer die Verteilung)

Wenn du bereit bist zu verteilen:

1. Oeffne **DayZ Tools** ueber Steam
2. Starte den **Addon Builder**
3. Setze **Source directory** auf `P:\MyAwesomeMod\Scripts\`
4. Setze **Output directory** auf `P:\@MyAwesomeMod\Addons\`
5. Setze **Prefix** auf `MyAwesomeMod\Scripts`
6. Klicke auf **Pack**

Kopiere dann `mod.cpp` neben den `Addons`-Ordner:

```
P:\@MyAwesomeMod\
    mod.cpp
    Addons\
        Scripts.pbo
```

### Im Script-Log ueberpruefen

Pruefe nach dem Start das Script-Log auf deine Nachrichten:

```
%localappdata%\DayZ\script_<date>_<time>.log
```

Suche nach dem Praefix-Tag deines Mods (z.B. `[MyAwesomeMod]`).

---

## Integration mit DayZ Tools und Workbench

### Workbench

DayZ Workbench kann die Skripte deines Mods mit Syntax-Hervorhebung oeffnen und bearbeiten:

1. Oeffne **Workbench** ueber DayZ Tools
2. Gehe zu **File > Open** und navigiere zum `Scripts/`-Ordner deines Mods
3. Oeffne eine beliebige `.c`-Datei zur Bearbeitung mit grundlegender Enforce-Script-Unterstuetzung

Workbench liest die `config.cpp`, um zu verstehen, welche Dateien zu welchem Skriptmodul gehoeren. Daher ist eine korrekt konfigurierte config.cpp essenziell.

### P:-Laufwerk einrichten

Das Template ist dafuer konzipiert, vom P:-Laufwerk aus zu arbeiten. Wenn du an einen anderen Ort geklont hast, erstelle eine Verknuepfung:

```batch
mklink /J P:\MyAwesomeMod "D:\Projects\MyAwesomeMod"
```

Dies macht den Mod unter `P:\MyAwesomeMod` zugaenglich, ohne Dateien zu verschieben.

### Addon Builder Automatisierung

Fuer wiederholte Builds kannst du eine Batch-Datei im Stammverzeichnis deines Mods erstellen:

```batch
@echo off
set DAYZ_TOOLS="C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools"
set SOURCE=P:\MyAwesomeMod\Scripts
set OUTPUT=P:\@MyAwesomeMod\Addons
set PREFIX=MyAwesomeMod\Scripts

%DAYZ_TOOLS%\Bin\AddonBuilder\AddonBuilder.exe %SOURCE% %OUTPUT% -prefix=%PREFIX% -clear
echo Build abgeschlossen.
pause
```

---

## Template vs. manuelles Setup

| Aspekt | Template | Manuell (Kapitel 8.1) |
|--------|----------|----------------------|
| **Zeit bis zum ersten Build** | ~2 Minuten | ~15 Minuten |
| **Alle 3 Script-Layer** | Vorkonfiguriert | Du fuegst sie nach Bedarf hinzu |
| **config.cpp** | Vollstaendig mit allen Modulen | Minimal (nur Mission) |
| **Git-bereit** | .gitignore enthalten | Du erstellst deine eigene |
| **Lernwert** | Niedriger (Dateien vorgefertigt) | Hoeher (du baust alles selbst) |
| **Empfohlen fuer** | Erfahrene Modder, neue Projekte | Erstmalige Modder, die die Grundlagen lernen |

**Empfehlung:** Wenn dies dein allererster DayZ-Mod ist, beginne mit [Kapitel 8.1](01-first-mod.md), um jede Datei zu verstehen. Sobald du vertraut bist, verwende das Template fuer alle zukuenftigen Projekte.

---

## Naechste Schritte

Mit deinem Template-basierten Mod in Betrieb kannst du:

1. **Ein benutzerdefiniertes Item hinzufuegen** -- Folge [Kapitel 8.2: Ein benutzerdefiniertes Item erstellen](02-custom-item.md), um Items in der config.cpp zu definieren.
2. **Ein Admin-Panel bauen** -- Folge [Kapitel 8.3: Ein Admin-Panel bauen](03-admin-panel.md) fuer Server-Management-UI.
3. **Chat-Befehle hinzufuegen** -- Folge [Kapitel 8.4: Chat-Befehle hinzufuegen](04-chat-commands.md) fuer In-Game-Textbefehle.
4. **config.cpp vertieft studieren** -- Lies [Kapitel 2.2: config.cpp im Detail](../02-mod-structure/02-config-cpp.md), um jedes Feld zu verstehen.
5. **mod.cpp-Optionen lernen** -- Lies [Kapitel 2.3: mod.cpp & Workshop](../02-mod-structure/03-mod-cpp.md) fuer die Workshop-Veroeffentlichung.
6. **Abhaengigkeiten hinzufuegen** -- Wenn dein Mod das Community Framework oder einen anderen Mod verwendet, aktualisiere `requiredAddons[]` und siehe [Kapitel 2.4: Dein erster Mod](../02-mod-structure/04-minimum-viable-mod.md).

---

**Vorheriges:** [Kapitel 8.4: Chat-Befehle hinzufuegen](04-chat-commands.md) | [Startseite](../../README.md)
