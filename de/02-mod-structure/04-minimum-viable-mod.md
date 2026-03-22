# Kapitel 2.4: Deine erste Mod -- Minimaler Prototyp

[Startseite](../README.md) | [<< Zurück: mod.cpp & Workshop](03-mod-cpp.md) | **Minimaler Prototyp** | [Weiter: Dateiorganisation >>](05-file-organization.md)

---

> **Zusammenfassung:** Dieses Kapitel führt dich Schritt für Schritt durch die Erstellung der kleinstmöglichen DayZ-Mod. Am Ende wirst du eine funktionierende Mod haben, die beim Spielstart eine Nachricht in das Skript-Log schreibt. Drei Dateien, keine Abhängigkeiten, unter fünf Minuten.

---

## Inhaltsverzeichnis

- [Was du brauchst](#was-du-brauchst)
- [Das Ziel](#das-ziel)
- [Schritt 1: Verzeichnisstruktur erstellen](#schritt-1-verzeichnisstruktur-erstellen)
- [Schritt 2: mod.cpp erstellen](#schritt-2-modcpp-erstellen)
- [Schritt 3: config.cpp erstellen](#schritt-3-configcpp-erstellen)
- [Schritt 4: Dein erstes Skript erstellen](#schritt-4-dein-erstes-skript-erstellen)
- [Schritt 5: Packen und Testen](#schritt-5-packen-und-testen)
- [Schritt 6: Überprüfen, ob es funktioniert](#schritt-6-überprüfen-ob-es-funktioniert)
- [Was passiert ist](#was-passiert-ist)
- [Nächste Schritte](#nächste-schritte)
- [Fehlerbehebung](#fehlerbehebung)

---

## Was du brauchst

- DayZ installiert (Retail oder DayZ Tools/Diag)
- Einen Texteditor (VS Code, Notepad++ oder ein beliebiger Texteditor)
- DayZ Tools installiert (für PBO-Packing) -- ODER du kannst ohne Packen testen (siehe Schritt 5)

---

## Das Ziel

Wir erstellen eine Mod namens **HelloMod**, die:
1. Ohne Fehler in DayZ geladen wird
2. `"[HelloMod] Mission started!"` in das Skript-Log schreibt
3. Die korrekte Standardstruktur verwendet

Dies ist das DayZ-Äquivalent von "Hello World."

---

## Schritt 1: Verzeichnisstruktur erstellen

Erstelle die folgenden Ordner und Dateien. Du brauchst genau **3 Dateien**:

```
HelloMod/
  mod.cpp
  Scripts/
    config.cpp
    5_Mission/
      HelloMod/
        HelloMission.c
```

Das ist die vollständige Struktur. Erstellen wir nun jede Datei.

---

## Schritt 2: mod.cpp erstellen

Erstelle `HelloMod/mod.cpp` mit diesem Inhalt:

```cpp
name = "Hello Mod";
author = "DeinName";
version = "1.0";
overview = "My first DayZ mod - prints a message on mission start.";
```

Das sind die minimalen Metadaten. Der DayZ-Launcher zeigt "Hello Mod" in der Mod-Liste an.

---

## Schritt 3: config.cpp erstellen

Erstelle `HelloMod/Scripts/config.cpp` mit diesem Inhalt:

```cpp
class CfgPatches
{
    class HelloMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

class CfgMods
{
    class HelloMod
    {
        dir = "HelloMod";
        name = "Hello Mod";
        author = "DeinName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "HelloMod/Scripts/5_Mission" };
            };
        };
    };
};
```

Schauen wir uns an, was jeder Teil bewirkt:

- **CfgPatches** meldet die Mod bei der Engine an. `requiredAddons` besagt, dass wir von `DZ_Data` (Vanilla-DayZ-Daten) abhängen, was sicherstellt, dass wir nach dem Basisspiel geladen werden.
- **CfgMods** teilt der Engine mit, wo unsere Skripte liegen. Wir verwenden nur `5_Mission`, weil dort die Lifecycle-Hooks der Mission verfügbar sind.
- **dependencies** listet `"Mission"` auf, weil unser Code in das Mission-Skriptmodul einhakt.

---

## Schritt 4: Dein erstes Skript erstellen

Erstelle `HelloMod/Scripts/5_Mission/HelloMod/HelloMission.c` mit diesem Inhalt:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[HelloMod] Mission started! Server is running.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[HelloMod] Mission started! Client is running.");
    }
};
```

Was dies bewirkt:

- `modded class MissionServer` erweitert die Vanilla-Server-Mission-Klasse. Wenn der Server eine Mission startet, wird `OnInit()` ausgelöst und unsere Nachricht wird ausgegeben.
- `modded class MissionGameplay` macht dasselbe für die Client-Seite.
- `super.OnInit()` ruft zuerst die originale (Vanilla-) Implementierung auf -- das ist entscheidend. Überspringe es niemals.
- `Print()` schreibt in die DayZ-Skript-Log-Datei.

---

## Schritt 5: Packen und Testen

Du hast zwei Möglichkeiten zum Testen:

### Option A: File Patching (Kein PBO erforderlich -- nur Entwicklung)

DayZ unterstützt das Laden ungepackter Mods während der Entwicklung. Dies ist der schnellste Weg zur Iteration.

1. Platziere deinen `HelloMod/`-Ordner in deinem DayZ-Installationsverzeichnis (oder verwende das P:-Laufwerk mit der Workbench)
2. Starte DayZ mit dem `-filePatching`-Parameter und lade deine Mod:

```
DayZDiag_x64.exe -mod=HelloMod -filePatching
```

Dies lädt Skripte direkt aus dem Ordner ohne PBO-Packing.

### Option B: PBO-Packing (Erforderlich für Verteilung)

Für die Workshop-Veröffentlichung oder Server-Bereitstellung musst du in eine PBO packen:

1. Öffne **DayZ Tools** (aus Steam)
2. Öffne den **Addon Builder**
3. Setze das Quellverzeichnis auf `HelloMod/Scripts/`
4. Setze die Ausgabe auf `@HelloMod/Addons/HelloMod_Scripts.pbo`
5. Klicke auf **Pack**

Oder verwende einen Kommandozeilen-Packer wie `PBOConsole`:

```
PBOConsole.exe -pack HelloMod/Scripts @HelloMod/Addons/HelloMod_Scripts.pbo
```

Platziere die `mod.cpp` neben dem `Addons/`-Ordner:

```
@HelloMod/
  mod.cpp
  Addons/
    HelloMod_Scripts.pbo
```

Dann starte DayZ:

```
DayZDiag_x64.exe -mod=@HelloMod
```

---

## Schritt 6: Überprüfen, ob es funktioniert

### Die Skript-Log-Datei finden

DayZ schreibt Skript-Ausgaben in Log-Dateien in deinem Profilverzeichnis:

```
Windows: C:\Users\DeinName\AppData\Local\DayZ\
```

Suche nach der neuesten `.RPT`- oder `.log`-Datei. Das Skript-Log heißt typischerweise:

```
script_<datum>_<uhrzeit>.log
```

### Wonach du suchst

Öffne die Log-Datei und suche nach `[HelloMod]`. Du solltest sehen:

```
[HelloMod] Mission started! Server is running.
```

oder (wenn du als Client beigetreten bist):

```
[HelloMod] Mission started! Client is running.
```

Wenn du diese Nachricht siehst, herzlichen Glückwunsch -- deine Mod funktioniert.

### Wenn du Fehler siehst

Wenn das Log Zeilen enthält, die mit `SCRIPT (E):` beginnen, ist etwas schiefgelaufen. Siehe den Abschnitt [Fehlerbehebung](#fehlerbehebung) unten.

---

## Was passiert ist

Hier ist die Abfolge der Ereignisse, als DayZ deine Mod geladen hat:

```
1. Engine startet, liest config.cpp-Dateien aus allen PBOs
2. CfgPatches "HelloMod_Scripts" wird registriert
   --> requiredAddons stellt sicher, dass es nach DZ_Data geladen wird
3. CfgMods "HelloMod" wird registriert
   --> Engine kennt den missionScriptModule-Pfad
4. Engine kompiliert alle 5_Mission-Skripte aller Mods
   --> HelloMission.c wird kompiliert
   --> "modded class MissionServer" patcht die Vanilla-Klasse
5. Server startet eine Mission
   --> MissionServer.OnInit() wird aufgerufen
   --> Dein Override läuft, ruft zuerst super.OnInit() auf
   --> Print() schreibt in das Skript-Log
6. Client verbindet und lädt
   --> MissionGameplay.OnInit() wird aufgerufen
   --> Dein Override läuft
   --> Print() schreibt in das Client-Log
```

Das `modded`-Schlüsselwort ist der Schlüsselmechanismus. Es teilt der Engine mit: "Nimm die existierende Klasse und füge meine Änderungen obendrauf." So integriert sich jede DayZ-Mod mit Vanilla-Code.

---

## Nächste Schritte

Jetzt, da du eine funktionierende Mod hast, sind hier natürliche Weiterentwicklungen:

### Eine 3_Game-Ebene hinzufügen

Füge Konfigurationsdaten oder Konstanten hinzu, die nicht von Welt-Entities abhängen:

```
HelloMod/
  Scripts/
    config.cpp              <-- gameScriptModule-Eintrag hinzufügen
    3_Game/
      HelloMod/
        HelloConfig.c       <-- Konfigurationsklasse
    5_Mission/
      HelloMod/
        HelloMission.c      <-- Bestehende Datei
```

Aktualisiere `config.cpp`, um die neue Ebene einzuschließen:

```cpp
dependencies[] = { "Game", "Mission" };

class defs
{
    class gameScriptModule
    {
        value = "";
        files[] = { "HelloMod/Scripts/3_Game" };
    };
    class missionScriptModule
    {
        value = "";
        files[] = { "HelloMod/Scripts/5_Mission" };
    };
};
```

### Eine 4_World-Ebene hinzufügen

Erstelle benutzerdefinierte Items, erweitere Spieler oder füge Welt-Manager hinzu:

```
HelloMod/
  Scripts/
    config.cpp              <-- worldScriptModule-Eintrag hinzufügen
    3_Game/
      HelloMod/
        HelloConfig.c
    4_World/
      HelloMod/
        HelloManager.c      <-- Welt-bewusste Logik
    5_Mission/
      HelloMod/
        HelloMission.c
```

### UI hinzufügen

Erstelle ein einfaches In-Game-Panel (behandelt in Teil 3 dieses Guides):

```
HelloMod/
  GUI/
    layouts/
      hello_panel.layout    <-- UI-Layout-Datei
  Scripts/
    5_Mission/
      HelloMod/
        HelloPanel.c        <-- UI-Skript
```

### Ein benutzerdefiniertes Item hinzufügen

Definiere ein Item in `Data/config.cpp` und erstelle sein Skript-Verhalten in `4_World`:

```
HelloMod/
  Data/
    config.cpp              <-- CfgVehicles mit Item-Definition
    Models/
      hello_item.p3d        <-- 3D-Modell
  Scripts/
    4_World/
      HelloMod/
        HelloItem.c         <-- Item-Verhaltensskript
```

### Von einem Framework abhängen

Wenn du Community Framework (CF) Funktionen verwenden möchtest, füge die Abhängigkeit hinzu:

```cpp
// In config.cpp
requiredAddons[] = { "DZ_Data", "JM_CF_Scripts" };
```

---

## Fehlerbehebung

### "Addon HelloMod_Scripts requires addon DZ_Data which is not loaded"

Dein `requiredAddons` verweist auf ein Addon, das nicht vorhanden ist. Stelle sicher, dass `DZ_Data` korrekt geschrieben ist und das DayZ-Basisspiel geladen ist.

### Keine Log-Ausgabe (Mod scheint nicht zu laden)

Überprüfe folgendes in dieser Reihenfolge:

1. **Ist die Mod im Startparameter?** Überprüfe, ob `-mod=HelloMod` oder `-mod=@HelloMod` in deinem Startbefehl steht.
2. **Ist config.cpp am richtigen Ort?** Sie muss im Stammverzeichnis der PBO (oder im Stammverzeichnis des `Scripts/`-Ordners beim File-Patching) sein.
3. **Sind die Skriptpfade korrekt?** Die `files[]`-Pfade in `config.cpp` müssen der tatsächlichen Verzeichnisstruktur entsprechen. `"HelloMod/Scripts/5_Mission"` bedeutet, dass die Engine nach genau diesem Pfad sucht.
4. **Gibt es eine CfgPatches-Klasse?** Ohne sie wird die PBO ignoriert.

### SCRIPT (E): Undefined variable / Undefined type

Dein Code verweist auf etwas, das in dieser Ebene nicht existiert. Häufige Ursachen:

- Verweis auf `PlayerBase` aus `3_Game` (es wird in `4_World` definiert)
- Tippfehler in einem Klassen- oder Variablennamen
- Fehlender `super.OnInit()`-Aufruf (verursacht Kaskadenfehler)

### SCRIPT (E): Member not found

Die Methode oder Eigenschaft, die du aufrufst, existiert nicht in dieser Klasse. Überprüfe die Vanilla-API. Häufiger Fehler: Methoden einer neueren DayZ-Version aufrufen, während eine ältere ausgeführt wird.

### Mod lädt, aber Skript wird nicht ausgeführt

- Überprüfe, ob deine `.c`-Datei im Verzeichnis liegt, das in `files[]` aufgelistet ist
- Stelle sicher, dass die Datei die Erweiterung `.c` hat (nicht `.txt` oder `.cs`)
- Überprüfe, ob der `modded class`-Name exakt mit der Vanilla-Klasse übereinstimmt (Groß-/Kleinschreibung beachten)

### PBO-Packing-Fehler

- Stelle sicher, dass `config.cpp` auf der Stammebene innerhalb der PBO liegt
- Dateipfade innerhalb von PBOs verwenden Schrägstriche (`/`), keine Backslashes
- Stelle sicher, dass keine Binärdateien im Scripts-Ordner sind (nur `.c` und `.cpp`)

---

## Bewährte Methoden

- Rufe immer `super.OnInit()` vor deinem eigenen Code in modded Mission-Klassen auf -- das Überspringen bricht die Initialisierung anderer Mods.
- Verwende ein eindeutiges Präfix in deinen `Print()`-Nachrichten (z.B. `[HelloMod]`), damit du Log-Dateien schnell durchsuchen kannst.
- Beginne nur mit `5_Mission`. Füge `3_Game`- und `4_World`-Ebenen schrittweise hinzu, wenn deine Mod wächst.
- Verwende `-filePatching` während der Entwicklung, um das erneute Packen von PBOs bei jeder Änderung zu vermeiden.
- Halte deine erste Mod unter 3 Dateien, bis sie funktioniert, dann erweitere. Das Debuggen einer minimalen Struktur ist weitaus einfacher.

---

## Theorie vs. Praxis

| Konzept | Theorie | Realität |
|---------|---------|---------|
| `Print()` gibt ins Log aus | Nachrichten erscheinen im Skript-Log | Die Ausgabe geht in die `.RPT`-Datei, nicht in ein separates Skript-Log. Auf dedizierten Servern die Server-RPT im Profilordner prüfen |
| `-filePatching` lädt lose Dateien | Ungepackte Mods funktionieren sofort | Einige Assets (Modelle, Texturen) erfordern trotzdem PBO-Packing; Skripte funktionieren lose, aber `.layout`-Dateien laden möglicherweise nicht aus ungepackten Ordnern auf allen Setups |
| `modded class` patcht Vanilla | Dein Override ersetzt das Original | Mehrere Mods können die gleiche Klasse mit `modded class` modifizieren; sie werden in Ladereihenfolge verkettet. Wenn eine `super.OnInit()` überspringt, brechen alle späteren Mods |
| `DZ_Data` ist die einzige benötigte Abhängigkeit | Minimale `requiredAddons` | Funktioniert für reine Skript-Mods, aber wenn du auf Vanilla-Waffen-/Item-Klassen verweist, brauchst du auch `DZ_Scripts` oder die spezifische Vanilla-PBO |
| Drei Dateien genügen | Mod lädt mit mod.cpp + config.cpp + einer .c-Datei | Stimmt für eine reine Skript-Mod, aber das Hinzufügen von Items oder UI erfordert zusätzliche PBOs (Data, GUI) |

---

## Vollständige Dateiliste

Hier sind alle drei Dateien in ihrer Gesamtheit als Referenz:

### HelloMod/mod.cpp

```cpp
name = "Hello Mod";
author = "DeinName";
version = "1.0";
overview = "My first DayZ mod - prints a message on mission start.";
```

### HelloMod/Scripts/config.cpp

```cpp
class CfgPatches
{
    class HelloMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

class CfgMods
{
    class HelloMod
    {
        dir = "HelloMod";
        name = "Hello Mod";
        author = "DeinName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "HelloMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### HelloMod/Scripts/5_Mission/HelloMod/HelloMission.c

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[HelloMod] Mission started! Server is running.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[HelloMod] Mission started! Client is running.");
    }
};
```

---

**Vorheriges:** [Kapitel 2.3: mod.cpp & Workshop](03-mod-cpp.md)
**Nächstes:** [Kapitel 2.5: Best Practices für Dateiorganisation](05-file-organization.md)
