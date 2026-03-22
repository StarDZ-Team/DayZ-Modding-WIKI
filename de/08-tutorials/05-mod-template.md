# Kapitel 8.5: Das DayZ Mod-Template verwenden

[Startseite](../README.md) | [<< Zurück: Chat-Befehle hinzufügen](04-chat-commands.md) | **Das DayZ Mod-Template verwenden** | [Weiter: Debugging und Testen >>](06-debugging-testing.md)

---

> **Zusammenfassung:** Dieses Tutorial zeigt Ihnen, wie Sie InclementDabs Open-Source DayZ Mod-Template verwenden, um ein neues Mod-Projekt in Sekunden zu starten. Anstatt jede Datei von Grund auf zu erstellen, klonen Sie ein fertiges Gerüst, das bereits die korrekte Ordnerstruktur, config.cpp, mod.cpp und Script-Layer-Stubs enthält. Sie benennen dann einige Dinge um und beginnen sofort mit dem Programmieren.

---

## Inhaltsverzeichnis

- [Was ist das DayZ Mod-Template?](#was-ist-das-dayz-mod-template)
- [Was das Template bereitstellt](#was-das-template-bereitstellt)
- [Schritt 1: Template klonen oder herunterladen](#schritt-1-template-klonen-oder-herunterladen)
- [Schritt 2: Dateistruktur verstehen](#schritt-2-dateistruktur-verstehen)
- [Schritt 3: Die Mod umbenennen](#schritt-3-die-mod-umbenennen)
- [Schritt 4: config.cpp aktualisieren](#schritt-4-configcpp-aktualisieren)
- [Schritt 5: mod.cpp aktualisieren](#schritt-5-modcpp-aktualisieren)
- [Schritt 6: Script-Ordner und Dateien umbenennen](#schritt-6-script-ordner-und-dateien-umbenennen)
- [Schritt 7: Bauen und testen](#schritt-7-bauen-und-testen)
- [Integration mit DayZ Tools und Workbench](#integration-mit-dayz-tools-und-workbench)
- [Template vs. manuelle Einrichtung](#template-vs-manuelle-einrichtung)
- [Nächste Schritte](#nächste-schritte)

---

## Was ist das DayZ Mod-Template?

Das **DayZ Mod-Template** ist ein Open-Source-Repository, das von InclementDab gepflegt wird und ein vollständiges, einsatzbereites Mod-Gerüst für DayZ bereitstellt:

**Repository:** [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)

Anstatt jede Datei von Hand zu erstellen (wie in [Kapitel 8.1: Ihre erste Mod](01-first-mod.md) behandelt), gibt Ihnen das Template eine vorgefertigte Verzeichnisstruktur mit dem gesamten Boilerplate bereits vorhanden. Sie klonen es, benennen einige Bezeichner um, und Sie sind bereit, Spiellogik zu schreiben.

Dies ist der empfohlene Startpunkt für jeden, der bereits eine Hello-World-Mod gebaut hat und zu komplexeren Projekten übergehen möchte.

---

## Was das Template bereitstellt

Das Template enthält alles, was eine DayZ-Mod zum Kompilieren und Laden benötigt:

| Datei / Ordner | Zweck |
|----------------|-------|
| `mod.cpp` | Mod-Metadaten (Name, Autor, Version), die im DayZ-Launcher angezeigt werden |
| `config.cpp` | CfgPatches- und CfgMods-Deklarationen, die die Mod bei der Engine registrieren |
| `Scripts/3_Game/` | Game-Layer-Script-Stubs (Enums, Konstanten, Konfigurationsklassen) |
| `Scripts/4_World/` | World-Layer-Script-Stubs (Entities, Manager, Weltinteraktionen) |
| `Scripts/5_Mission/` | Mission-Layer-Script-Stubs (UI, Missions-Hooks) |
| `.gitignore` | Vorkonfigurierte Ignores für DayZ-Entwicklung (PBOs, Logs, Temp-Dateien) |

Das Template folgt der in [Kapitel 2.1: Die 5-Schichten-Script-Hierarchie](../02-mod-structure/01-five-layers.md) dokumentierten Standard-5-Schichten-Script-Hierarchie. Alle drei Script-Schichten sind in config.cpp verdrahtet, sodass Sie sofort Code in jeder Schicht platzieren können, ohne zusätzliche Konfiguration.

---

## Schritt 1: Template klonen oder herunterladen

### Option A: GitHubs "Use this template"-Funktion verwenden

1. Gehen Sie zu [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)
2. Klicken Sie auf den grünen **"Use this template"**-Button oben im Repository
3. Wählen Sie **"Create a new repository"**
4. Benennen Sie Ihr Repository (z.B. `MyAwesomeMod`)
5. Klonen Sie Ihr neues Repository auf Ihr P:-Laufwerk:

```bash
cd P:\
git clone https://github.com/IhrBenutzername/MyAwesomeMod.git
```

### Option B: Direktes Klonen

Wenn Sie kein eigenes GitHub-Repository benötigen, klonen Sie das Template direkt:

```bash
cd P:\
git clone https://github.com/InclementDab/DayZ-Mod-Template.git MyAwesomeMod
```

### Option C: Als ZIP herunterladen

1. Gehen Sie zur Repository-Seite
2. Klicken Sie auf **Code** dann **Download ZIP**
3. Extrahieren Sie die ZIP nach `P:\MyAwesomeMod\`

---

## Schritt 2: Dateistruktur verstehen

Nach dem Klonen sieht Ihr Mod-Verzeichnis so aus:

```
P:\MyAwesomeMod\
    mod.cpp
    Scripts\
        config.cpp
        3_Game\
            ModName\
                (Game-Layer-Scripts)
        4_World\
            ModName\
                (World-Layer-Scripts)
        5_Mission\
            ModName\
                (Mission-Layer-Scripts)
```

### Wie jedes Teil zusammenpasst

**`mod.cpp`** ist der Personalausweis Ihrer Mod. Sie steuert, was Spieler in der DayZ-Launcher-Modliste sehen. Siehe [Kapitel 2.3: mod.cpp und Workshop](../02-mod-structure/03-mod-cpp.md) für alle verfügbaren Felder.

**`Scripts/config.cpp`** ist die kritischste Datei. Sie teilt der DayZ-Engine mit:
- Wovon Ihre Mod abhängt (`CfgPatches.requiredAddons[]`)
- Wo sich jede Script-Schicht befindet (`CfgMods.class defs`)
- Welche Präprozessor-Defines gesetzt werden sollen (`defines[]`)

Siehe [Kapitel 2.2: config.cpp im Detail](../02-mod-structure/02-config-cpp.md) für eine vollständige Referenz.

**`Scripts/3_Game/`** wird zuerst geladen. Platzieren Sie hier Enums, Konstanten, RPC-IDs, Konfigurationsklassen und alles, was keine Welt-Entities referenziert.

**`Scripts/4_World/`** wird als zweites geladen. Platzieren Sie hier Entity-Klassen (`modded class ItemBase`), Manager und alles, was mit Spielobjekten interagiert.

**`Scripts/5_Mission/`** wird zuletzt geladen. Platzieren Sie hier Missions-Hooks (`modded class MissionServer`), UI-Panels und Startlogik. Diese Schicht kann Typen aus allen niedrigeren Schichten referenzieren.

---

## Schritt 3: Die Mod umbenennen

Das Template wird mit Platzhalternamen geliefert. Sie müssen diese durch den tatsächlichen Namen Ihrer Mod ersetzen. Hier ist ein systematischer Ansatz.

### Ihre Namen wählen

Bevor Sie Änderungen vornehmen, entscheiden Sie sich für:

| Bezeichner | Beispiel | Verwendet in |
|------------|---------|--------------|
| **Mod-Anzeigename** | `"My Awesome Mod"` | mod.cpp, config.cpp |
| **Verzeichnisname** | `MyAwesomeMod` | Ordnername, config.cpp-Pfade |
| **CfgPatches-Klasse** | `MyAwesomeMod_Scripts` | config.cpp CfgPatches |
| **CfgMods-Klasse** | `MyAwesomeMod` | config.cpp CfgMods |
| **Script-Unterordner** | `MyAwesomeMod` | Innerhalb von 3_Game/, 4_World/, 5_Mission/ |
| **Präprozessor-Define** | `MYAWESOMEMOD` | config.cpp defines[], #ifdef-Prüfungen |

### Benennungsregeln

- **Keine Leerzeichen oder Sonderzeichen** in Verzeichnis- und Klassennamen. Verwenden Sie PascalCase oder Unterstriche.
- **CfgPatches-Klassennamen müssen global eindeutig sein.** Zwei Mods mit demselben CfgPatches-Klassennamen werden kollidieren. Verwenden Sie Ihren Mod-Namen als Präfix.
- **Script-Unterordnernamen** innerhalb jeder Schicht sollten zur Konsistenz Ihrem Mod-Namen entsprechen.

---

## Schritt 4: config.cpp aktualisieren

Öffnen Sie `Scripts/config.cpp` und aktualisieren Sie die folgenden Abschnitte.

### CfgPatches

Ersetzen Sie den Template-Klassennamen durch Ihren eigenen:

```cpp
class CfgPatches
{
    class MyAwesomeMod_Scripts    // <-- Ihr eindeutiger Patch-Name
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"            // Basisspiel-Abhängigkeit
        };
    };
};
```

Wenn Ihre Mod von einer anderen Mod abhängt, fügen Sie deren CfgPatches-Klassennamen zu `requiredAddons[]` hinzu:

```cpp
requiredAddons[] =
{
    "DZ_Data",
    "CF_Scripts"              // Hängt von Community Framework ab
};
```

### CfgMods

Aktualisieren Sie die Mod-Identität und Script-Pfade:

```cpp
class CfgMods
{
    class MyAwesomeMod
    {
        dir = "MyAwesomeMod";
        name = "My Awesome Mod";
        author = "IhrName";
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

**Kernpunkte:**
- Der `dir`-Wert muss exakt mit dem Stammordnernamen Ihrer Mod übereinstimmen.
- Jeder `files[]`-Pfad ist relativ zum Mod-Stammverzeichnis.
- Das `dependencies[]`-Array sollte auflisten, in welche Vanilla-Scriptmodule Sie sich einklinken. Die meisten Mods verwenden alle drei: `"Game"`, `"World"` und `"Mission"`.

### Präprozessor-Defines (Optional)

Wenn Sie möchten, dass andere Mods die Präsenz Ihrer Mod erkennen können, fügen Sie ein `defines[]`-Array hinzu:

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

    // Mod-übergreifende Erkennung aktivieren
    defines[] = { "MYAWESOMEMOD" };
};
```

Andere Mods können dann `#ifdef MYAWESOMEMOD` verwenden, um bedingt Code zu kompilieren, der sich mit Ihrer Mod integriert.

---

## Schritt 5: mod.cpp aktualisieren

Öffnen Sie `mod.cpp` im Stammverzeichnis und aktualisieren Sie sie mit den Informationen Ihrer Mod:

```cpp
name         = "My Awesome Mod";
author       = "IhrName";
version      = "1.0.0";
overview     = "Eine kurze Beschreibung dessen, was Ihre Mod macht.";
picture      = "";             // Optional: Pfad zu einem Vorschaubild
logo         = "";             // Optional: Pfad zu einem Logo
logoSmall    = "";             // Optional: Pfad zu einem kleinen Logo
logoOver     = "";             // Optional: Pfad zu einem Logo-Hover-Zustand
tooltip      = "My Awesome Mod";
action       = "";             // Optional: URL zur Website Ihrer Mod
```

Setzen Sie mindestens `name`, `author` und `overview`. Die anderen Felder sind optional, verbessern aber die Darstellung im Launcher.

---

## Schritt 6: Script-Ordner und Dateien umbenennen

Benennen Sie die Script-Unterordner innerhalb jeder Schicht um, damit sie zu Ihrem Mod-Namen passen:

```
Scripts/3_Game/ModName/    -->  Scripts/3_Game/MyAwesomeMod/
Scripts/4_World/ModName/   -->  Scripts/4_World/MyAwesomeMod/
Scripts/5_Mission/ModName/ -->  Scripts/5_Mission/MyAwesomeMod/
```

Innerhalb dieser Ordner benennen Sie alle Platzhalter-`.c`-Dateien um und aktualisieren deren Klassennamen. Zum Beispiel, wenn das Template eine Datei wie `ModInit.c` mit einer Klasse namens `ModInit` enthält, benennen Sie sie in `MyAwesomeModInit.c` um und aktualisieren die Klasse:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyAwesomeMod] Server initialisiert!");
    }
};
```

---

## Schritt 7: Bauen und testen

### File Patching verwenden (Schnelle Iteration)

Der schnellste Weg zum Testen während der Entwicklung:

```batch
DayZDiag_x64.exe -mod=P:\MyAwesomeMod -filePatching
```

Dies lädt Ihre Scripts direkt aus den Quellordnern, ohne ein PBO zu packen. Bearbeiten Sie eine `.c`-Datei, starten Sie das Spiel neu, und sehen Sie die Änderungen sofort.

### Addon Builder verwenden (Für Verteilung)

Wenn Sie bereit zur Verteilung sind:

1. Öffnen Sie **DayZ Tools** aus Steam
2. Starten Sie **Addon Builder**
3. Setzen Sie **Source directory** auf `P:\MyAwesomeMod\Scripts\`
4. Setzen Sie **Output directory** auf `P:\@MyAwesomeMod\Addons\`
5. Setzen Sie **Prefix** auf `MyAwesomeMod\Scripts`
6. Klicken Sie auf **Pack**

Kopieren Sie dann `mod.cpp` neben den `Addons`-Ordner:

```
P:\@MyAwesomeMod\
    mod.cpp
    Addons\
        Scripts.pbo
```

### Im Script-Log überprüfen

Nach dem Start prüfen Sie das Script-Log auf Ihre Nachrichten:

```
%localappdata%\DayZ\script_<datum>_<zeit>.log
```

Suchen Sie nach dem Präfix-Tag Ihrer Mod (z.B. `[MyAwesomeMod]`).

---

## Integration mit DayZ Tools und Workbench

### Workbench

DayZ Workbench kann die Scripts Ihrer Mod mit Syntax-Hervorhebung öffnen und bearbeiten:

1. Öffnen Sie **Workbench** aus DayZ Tools
2. Gehen Sie zu **File > Open** und navigieren Sie zum `Scripts/`-Ordner Ihrer Mod
3. Öffnen Sie eine beliebige `.c`-Datei zum Bearbeiten mit grundlegender Enforce-Script-Unterstützung

Workbench liest die `config.cpp`, um zu verstehen, welche Dateien zu welchem Scriptmodul gehören, daher ist eine korrekt konfigurierte config.cpp unverzichtbar.

### P:-Laufwerk-Einrichtung

Das Template ist für die Arbeit vom P:-Laufwerk aus konzipiert. Wenn Sie an einen anderen Ort geklont haben, erstellen Sie eine Verknüpfung:

```batch
mklink /J P:\MyAwesomeMod "D:\Projekte\MyAwesomeMod"
```

Dies macht die Mod unter `P:\MyAwesomeMod` zugänglich, ohne Dateien zu verschieben.

### Addon Builder Automatisierung

Für wiederholte Builds können Sie eine Batch-Datei im Stammverzeichnis Ihrer Mod erstellen:

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

## Template vs. manuelle Einrichtung

| Aspekt | Template | Manuell (Kapitel 8.1) |
|--------|----------|----------------------|
| **Zeit bis zum ersten Build** | ~2 Minuten | ~15 Minuten |
| **Alle 3 Script-Schichten** | Vorkonfiguriert | Sie fügen sie nach Bedarf hinzu |
| **config.cpp** | Vollständig mit allen Modulen | Minimal (nur Mission) |
| **Git-bereit** | .gitignore enthalten | Sie erstellen Ihren eigenen |
| **Lernwert** | Niedriger (Dateien vorgefertigt) | Höher (alles selbst aufbauen) |
| **Empfohlen für** | Erfahrene Modder, neue Projekte | Erstmalige Modder, die die Grundlagen lernen |

**Empfehlung:** Wenn dies Ihre allererste DayZ-Mod ist, beginnen Sie mit [Kapitel 8.1](01-first-mod.md), um jede Datei zu verstehen. Sobald Sie sich wohlfühlen, verwenden Sie das Template für alle zukünftigen Projekte.

---

## Nächste Schritte

Mit Ihrer template-basierten Mod, die läuft, können Sie:

1. **Ein benutzerdefiniertes Item hinzufügen** -- Folgen Sie [Kapitel 8.2: Ein benutzerdefiniertes Item erstellen](02-custom-item.md), um Items in config.cpp zu definieren.
2. **Ein Admin-Panel bauen** -- Folgen Sie [Kapitel 8.3: Ein Admin-Panel bauen](03-admin-panel.md) für Serververwaltungs-UI.
3. **Chat-Befehle hinzufügen** -- Folgen Sie [Kapitel 8.4: Chat-Befehle hinzufügen](04-chat-commands.md) für In-Game-Textbefehle.
4. **config.cpp im Detail studieren** -- Lesen Sie [Kapitel 2.2: config.cpp im Detail](../02-mod-structure/02-config-cpp.md), um jedes Feld zu verstehen.
5. **mod.cpp-Optionen lernen** -- Lesen Sie [Kapitel 2.3: mod.cpp und Workshop](../02-mod-structure/03-mod-cpp.md) für Workshop-Veröffentlichung.
6. **Abhängigkeiten hinzufügen** -- Wenn Ihre Mod Community Framework oder eine andere Mod verwendet, aktualisieren Sie `requiredAddons[]` und siehe [Kapitel 2.4: Ihre erste Mod](../02-mod-structure/04-minimum-viable-mod.md).

---

**Zurück:** [Kapitel 8.4: Chat-Befehle hinzufügen](04-chat-commands.md) | [Startseite](../README.md)
