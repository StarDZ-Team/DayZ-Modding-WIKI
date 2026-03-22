# Kapitel 2.2: config.cpp im Detail

[Startseite](../../README.md) | [<< Zurück: Die 5-Schichten-Skript-Hierarchie](01-five-layers.md) | **config.cpp im Detail** | [Weiter: mod.cpp & Workshop >>](03-mod-cpp.md)

---

## Inhaltsverzeichnis

- [Überblick](#überblick)
- [Wo config.cpp liegt](#wo-configcpp-liegt)
- [CfgPatches-Block](#cfgpatches-block)
- [CfgMods-Block](#cfgmods-block)
- [class defs: Skriptmodulpfade](#class-defs-skriptmodulpfade)
- [class defs: imageSets und widgetStyles](#class-defs-imagesets-und-widgetstyles)
- [defines-Array](#defines-array)
- [CfgVehicles: Item- und Entitäts-Definitionen](#cfgvehicles-item--und-entitäts-definitionen)
- [CfgSoundSets und CfgSoundShaders](#cfgsoundsets-und-cfgsoundshaders)
- [CfgAddons: Preload-Deklarationen](#cfgaddons-preload-deklarationen)
- [Praxisbeispiele aus professionellen Mods](#praxisbeispiele-aus-professionellen-mods)
- [Häufige Fehler](#häufige-fehler)
- [Vollständige Vorlage](#vollständige-vorlage)

---

## Überblick

Eine DayZ-Mod hat typischerweise eine oder mehrere PBO-Dateien, die jeweils eine `config.cpp` im Stammverzeichnis enthalten. Die Engine liest diese Configs beim Start, um zu bestimmen:

1. **Wovon Ihre Mod abhängt** (CfgPatches)
2. **Wo Ihre Skripte sind** (CfgMods class defs)
3. **Welche Items/Entitäten sie hinzufügt** (CfgVehicles, CfgWeapons, etc.)
4. **Welche Sounds sie hinzufügt** (CfgSoundSets, CfgSoundShaders)
5. **Welche Präprozessor-Symbole sie definiert** (defines[])

Eine Mod hat normalerweise separate PBOs für verschiedene Belange:
- `MyMod/Scripts/config.cpp` -- Skriptdefinitionen und Modulpfade
- `MyMod/Data/config.cpp` -- Item-/Fahrzeug-/Waffen-Definitionen
- `MyMod/GUI/config.cpp` -- ImageSet- und Style-Deklarationen

---

## Wo config.cpp liegt

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo         --> enthält Scripts/config.cpp
    MyMod_Data.pbo            --> enthält Data/config.cpp (Items, Fahrzeuge)
    MyMod_GUI.pbo             --> enthält GUI/config.cpp (ImageSets, Styles)
```

Jedes PBO hat seine eigene `config.cpp`. Die Engine liest sie alle. Mehrere PBOs von derselben Mod sind üblich -- dies ist Standardpraxis, keine Ausnahme.

---

## CfgPatches-Block

`CfgPatches` ist in jeder config.cpp **erforderlich**. Es deklariert einen benannten Patch und seine Abhängigkeiten.

### Syntax

```cpp
class CfgPatches
{
    class MyMod_Scripts          // Eindeutiger Patch-Name (darf nicht mit anderen Mods kollidieren)
    {
        units[] = {};            // Entitäts-Klassennamen die dieses PBO hinzufügt (für Editor/Spawner)
        weapons[] = {};          // Waffen-Klassennamen die dieses PBO hinzufügt
        requiredVersion = 0.1;   // Minimale Spielversion (in der Praxis immer 0.1)
        requiredAddons[] =       // PBO-Abhängigkeiten -- STEUERT DIE LADEREIHENFOLGE
        {
            "DZ_Data"            // Fast immer benötigt
        };
    };
};
```

### requiredAddons: Die Abhängigkeitskette

Dies ist das wichtigste Feld in der gesamten Config. `requiredAddons` sagt der Engine:

1. **Ladereihenfolge:** Die Skripte Ihres PBOs werden NACH allen aufgelisteten Addons kompiliert
2. **Harte Abhängigkeit:** Wenn ein aufgelistetes Addon fehlt, schlägt das Laden Ihrer Mod fehl

Jeder Eintrag muss mit einem `CfgPatches`-Klassennamen einer anderen Mod übereinstimmen:

| Abhängigkeit | requiredAddons-Eintrag | Wann verwenden |
|-----------|---------------------|-------------|
| Vanilla-DayZ-Daten | `"DZ_Data"` | Fast immer (Items, Configs) |
| Vanilla-DayZ-Skripte | `"DZ_Scripts"` | Beim Erweitern von Vanilla-Skriptklassen |
| Vanilla-Waffen | `"DZ_Weapons_Firearms"` | Beim Hinzufügen von Waffen/Anbauteilen |
| Vanilla-Magazine | `"DZ_Weapons_Magazines"` | Beim Hinzufügen von Magazinen/Munition |
| Community Framework | `"JM_CF_Scripts"` | Bei Verwendung des CF-Modulsystems |
| DabsFramework | `"DF_Scripts"` | Bei Verwendung von Dabs MVC/Framework |
| MyFramework | `"MyCore_Scripts"` | Beim Bauen einer MyMod-Mod |

**Beispiel: Mehrere Abhängigkeiten**

```cpp
requiredAddons[] =
{
    "DZ_Scripts",
    "DZ_Data",
    "DZ_Weapons_Firearms",
    "DZ_Weapons_Ammunition",
    "DZ_Weapons_Magazines",
    "MyCore_Scripts"
};
```

### units[] und weapons[]

Diese Arrays listen die Klassennamen von Entitäten und Waffen auf, die in diesem PBO definiert sind. Sie dienen zwei Zwecken:

1. Der DayZ-Editor verwendet sie, um Spawnlisten zu fuellen
2. Andere Tools (wie Admin-Panels) verwenden sie zur Item-Erkennung

```cpp
units[] = { "MyMod_SomeBuilding", "MyMod_SomeVehicle" };
weapons[] = { "MyMod_CustomRifle", "MyMod_CustomPistol" };
```

Für reine Skript-PBOs lassen Sie beide leer.

---

## CfgMods-Block

`CfgMods` ist erforderlich, wenn Ihr PBO Skripte, Eingaben oder GUI-Ressourcen hinzufügt oder modifiziert. Es definiert die Mod-Identität und ihre Skriptmodul-Struktur.

### Grundstruktur

```cpp
class CfgMods
{
    class MyMod                   // Mod-Identifikator (intern verwendet)
    {
        dir = "MyMod";            // Stammverzeichnis der Mod (PBO-Präfixpfad)
        name = "My Mod Name";     // Menschenlesbarer Name
        author = "AuthorName";    // Autorenstring
        credits = "AuthorName";   // Credits-String
        creditsJson = "MyMod/Scripts/Data/Credits.json";  // Pfad zur Credits-Datei
        versionPath = "MyMod/Scripts/Data/Version.hpp";   // Pfad zur Versionsdatei
        overview = "Description"; // Mod-Beschreibung
        picture = "";             // Logo-Bildpfad
        action = "";              // URL (Website/Discord)
        type = "mod";             // "mod" für Client, "servermod" für nur Server
        extra = 0;                // Reserviert, immer 0
        hideName = 0;             // Mod-Name im Launcher verstecken (0 = anzeigen, 1 = verstecken)
        hidePicture = 0;          // Mod-Bild im Launcher verstecken

        // Tastenbelegungs-Definitionen (optional)
        inputs = "MyMod/Scripts/Data/Inputs.xml";

        // Präprozessor-Symbole (optional)
        defines[] = { "MYMOD_LOADED" };

        // Skriptmodul-Abhängigkeiten
        dependencies[] = { "Game", "World", "Mission" };

        // Skriptmodulpfade
        class defs
        {
            // ... (im nächsten Abschnitt behandelt)
        };
    };
};
```

### Wichtige Felder erklärt

**`dir`** -- Der Stammpfad-Präfix für alle Dateipfade in dieser Config. Wenn die Engine `files[] = { "MyMod/Scripts/3_Game" }` sieht, verwendet sie `dir` als Basis.

**`type`** -- Entweder `"mod"` (geladen via `-mod=`) oder `"servermod"` (geladen via `-servermod=`). Server-Mods laufen nur auf dem dedizierten Server. So trennen Sie reine Server-Logik von Client-Code.

**`dependencies`** -- Welche Vanilla-Skriptmodule Ihre Mod erweitert. Fast immer `{ "Game", "World", "Mission" }`. Mögliche Werte: `"Core"`, `"GameLib"`, `"Game"`, `"World"`, `"Mission"`.

**`inputs`** -- Pfad zu einer `Inputs.xml`-Datei, die eigene Tastenbelegungen definiert. Der Pfad ist relativ zum PBO-Stamm.

---

## class defs: Skriptmodulpfade

Der `class defs`-Block innerhalb von `CfgMods` teilt der Engine mit, welche Ordner Ihre Skripte für jede Schicht enthalten.

### Alle verfügbaren Skriptmodule

```cpp
class defs
{
    class engineScriptModule        // 1_Core
    {
        value = "";                 // Einstiegsfunktion (leer = Standard)
        files[] = { "MyMod/Scripts/1_Core" };
    };
    class gameLibScriptModule       // 2_GameLib (selten verwendet)
    {
        value = "";
        files[] = { "MyMod/Scripts/2_GameLib" };
    };
    class gameScriptModule          // 3_Game
    {
        value = "";
        files[] = { "MyMod/Scripts/3_Game" };
    };
    class worldScriptModule         // 4_World
    {
        value = "";
        files[] = { "MyMod/Scripts/4_World" };
    };
    class missionScriptModule       // 5_Mission
    {
        value = "";
        files[] = { "MyMod/Scripts/5_Mission" };
    };
};
```

### Das `value`-Feld

Das `value`-Feld gibt einen eigenen Einstiegsfunktionsnamen für dieses Skriptmodul an. Wenn leer (`""`), verwendet die Engine den Standard-Einstiegspunkt. Wenn gesetzt (z.B. `value = "CreateGameMod"`), ruft die Engine diese globale Funktion beim Initialisieren des Moduls auf.

Community Framework verwendet dies:

```cpp
class gameScriptModule
{
    value = "CF_CreateGame";    // Eigener Einstiegspunkt
    files[] = { "JM/CF/Scripts/3_Game" };
};
```

Für die meisten Mods lassen Sie `value` leer.

### Das `files`-Array

Jeder Eintrag ist ein **Verzeichnispfad** (keine einzelnen Dateien). Die Engine kompiliert rekursiv alle `.c`-Dateien in den aufgelisteten Verzeichnissen:

```cpp
class gameScriptModule
{
    value = "";
    files[] =
    {
        "MyMod/Scripts/3_Game"      // Alle .c-Dateien in diesem Verzeichnisbaum
    };
};
```

Sie können mehrere Verzeichnisse auflisten. So funktioniert das "Common-Ordner"-Muster:

```cpp
class gameScriptModule
{
    value = "";
    files[] =
    {
        "MyMod/Scripts/Common",     // Geteilter Code, der in JEDES Modul kompiliert wird
        "MyMod/Scripts/3_Game"      // Schichtspezifischer Code
    };
};
class worldScriptModule
{
    value = "";
    files[] =
    {
        "MyMod/Scripts/Common",     // Gleicher geteilter Code, auch hier verfügbar
        "MyMod/Scripts/4_World"
    };
};
```

### Nur definieren was Sie verwenden

Sie müssen nicht alle fünf Skriptmodule deklarieren. Deklarieren Sie nur die, die Ihre Mod tatsächlich verwendet:

```cpp
// Eine einfache Mod die nur 3_Game- und 5_Mission-Code hat
class defs
{
    class gameScriptModule
    {
        files[] = { "MyMod/Scripts/3_Game" };
    };
    class missionScriptModule
    {
        files[] = { "MyMod/Scripts/5_Mission" };
    };
};
```

---

## class defs: imageSets und widgetStyles

Wenn Ihre Mod eigene Icons oder GUI-Styles verwendet, deklarieren Sie sie innerhalb von `class defs`:

### imageSets

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "MyMod/GUI/imagesets/icons.imageset",
            "MyMod/GUI/imagesets/items.imageset"
        };
    };
    // ... Skriptmodule ...
};
```

ImageSets sind XML-Dateien, die benannte Bereiche eines Texturatlasses auf Sprite-Namen abbilden. Einmal hier deklariert, kann jedes Skript die Icons nach Namen referenzieren.

### widgetStyles

```cpp
class defs
{
    class widgetStyles
    {
        files[] =
        {
            "MyMod/GUI/looknfeel/custom.styles"
        };
    };
    // ... Skriptmodule ...
};
```

Widget-Styles definieren wiederverwendbare visuelle Eigenschaften (Farben, Schriftarten, Abstande) für GUI-Widgets.

### Praxisbeispiel: MyFramework

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "MyFramework/GUI/imagesets/prefabs.imageset",
            "MyFramework/GUI/imagesets/CUI.imageset",
            "MyFramework/GUI/icons/thin.imageset",
            "MyFramework/GUI/icons/light.imageset",
            "MyFramework/GUI/icons/regular.imageset",
            "MyFramework/GUI/icons/solid.imageset",
            "MyFramework/GUI/icons/brands.imageset"
        };
    };
    class widgetStyles
    {
        files[] =
        {
            "MyFramework/GUI/looknfeel/prefabs.styles"
        };
    };
    // ... Skriptmodule ...
};
```

---

## defines-Array

Das `defines[]`-Array in `CfgMods` erstellt Präprozessor-Symbole, die andere Mods mit `#ifdef` prüfen können:

```cpp
defines[] =
{
    "MYMOD_CORE",           // Andere Mods können: #ifdef MYMOD_CORE
    // "MYMOD_DEBUG"        // Auskommentiert = im Release deaktiviert
};
```

### Anwendungsfälle

**Feature-Erkennung zwischen Mods:**

```c
// Im Code einer anderen Mod:
#ifdef MYMOD_CORE
    MyLog.Info("MyMod", "MyFramework erkannt, Integration wird aktiviert");
#else
    Print("[MyMod] Läuft ohne MyFramework");
#endif
```

**Debug-/Release-Builds:**

```cpp
defines[] =
{
    "MYMOD_LOADED",
    // "MYMOD_DEBUG",        // Für Debug-Logging einkommentieren
    // "MYMOD_VERBOSE"       // Für ausführliche Ausgabe einkommentieren
};
```

### Praxisbeispiele

**COT** verwendet defines umfangreich für Feature-Flags:

```cpp
defines[] =
{
    "JM_COT",
    "JM_COT_VEHICLE_ONSPAWNVEHICLE",
    "COT_BUGFIX_REF",
    "COT_BUGFIX_REF_UIACTIONS",
    "COT_UIACTIONS_SETWIDTH",
    "COT_REFRESHSTATS_NEW",
    "JM_COT_VEHICLEMANAGER",
    "JM_COT_INVISIBILITY"
};
```

**CF** verwendet defines zum Aktivieren/Deaktivieren von Subsystemen:

```cpp
defines[] =
{
    "CF_MODULE_CONFIG",
    "CF_EXPRESSION",
    "CF_GHOSTICONS",
    "CF_MODSTORAGE",
    "CF_SURFACES",
    "CF_MODULES"
};
```

---

## CfgVehicles: Item- und Entitäts-Definitionen

`CfgVehicles` ist die primäre Config-Klasse zum Definieren von Ingame-Items, Gebäuden, Fahrzeugen und anderen Entitäten. Trotz des Namens "Vehicles" deckt sie ALLE Entitätstypen ab.

### Grundlegende Item-Definition

```cpp
class CfgVehicles
{
    class ItemBase;                          // Elternklasse vorwärts deklarieren
    class MyMod_CustomItem : ItemBase        // Von Vanilla-Basis erben
    {
        scope = 2;                           // 0=versteckt, 1=nur Editor, 2=öffentlich
        displayName = "Custom Item";
        descriptionShort = "A custom item.";
        model = "MyMod/Data/Models/item.p3d";
        weight = 500;                        // Gramm
        itemSize[] = { 2, 3 };               // Inventarplätze (Breite, Höhe)
        rotationFlags = 17;                   // Erlaubte Rotation im Inventar
        inventorySlot[] = {};                 // In welche Anbauteil-Slots es passt
    };
};
```

### scope-Werte

| Wert | Bedeutung | Verwendung |
|-------|---------|-------|
| `0` | Versteckt | Basisklassen, abstrakte Eltern -- nie spawnbar |
| `1` | Nur Editor | Sichtbar im DayZ-Editor, aber nicht im normalen Gameplay |
| `2` | Öffentlich | Voll spawnbar, erscheint in Admin-Tools und Spawnern |

### Gebäude-/Struktur-Definition

```cpp
class CfgVehicles
{
    class HouseNoDestruct;
    class MyMod_Bunker : HouseNoDestruct
    {
        scope = 2;
        displayName = "Military Bunker";
        model = "MyMod/Data/Models/bunker.p3d";
    };
};
```

### Fahrzeug-Definition (vereinfacht)

```cpp
class CfgVehicles
{
    class CarScript;
    class MyMod_Truck : CarScript
    {
        scope = 2;
        displayName = "Custom Truck";
        model = "MyMod/Data/Models/truck.p3d";

        class Cargo
        {
            itemsCargoSize[] = { 10, 50 };   // Fracht-Dimensionen
        };
    };
};
```

### DabsFramework-Entitäts-Beispiel

```cpp
class CfgVehicles
{
    class HouseNoDestruct;
    class NetworkLightBase : HouseNoDestruct
    {
        scope = 1;
    };
    class NetworkPointLight : NetworkLightBase
    {
        scope = 1;
    };
    class NetworkSpotLight : NetworkLightBase
    {
        scope = 1;
    };
};
```

---

## CfgSoundSets und CfgSoundShaders

Eigenes Audio erfordert zwei Config-Klassen, die zusammenarbeiten: einen SoundShader (die Audiodatei-Referenz) und ein SoundSet (die Wiedergabekonfiguration).

### CfgSoundShaders

```cpp
class CfgSoundShaders
{
    class MyMod_Alert_SoundShader
    {
        samples[] = {{ "MyMod/Sounds/alert", 1 }};  // Pfad zur .ogg-Datei, Wahrscheinlichkeit
        volume = 0.8;                                 // Grundlautstärke (0.0 bis 1.0)
        range = 50;                                   // Hörbare Reichweite in Metern (nur 3D)
        limitation = 0;                               // 0 = keine Beschränkung gleichzeitiger Wiedergaben
    };
};
```

Das `samples`-Array verwendet doppelte Klammern. Jeder Eintrag ist `{ "pfad_ohne_erweiterung", wahrscheinlichkeit }`. Wenn Sie mehrere Samples auflisten, wählt die Engine zufällig basierend auf Wahrscheinlichkeitsgewichten.

### CfgSoundSets

```cpp
class CfgSoundSets
{
    class MyMod_Alert_SoundSet
    {
        soundShaders[] = { "MyMod_Alert_SoundShader" };
        volumeFactor = 1.0;                           // Multiplikator auf Shader-Lautstärke
        frequencyFactor = 1.0;                        // Tonhöhen-Multiplikator
        spatial = 1;                                  // 0 = 2D (UI-Sounds), 1 = 3D (Welt)
    };
};
```

### Sounds im Skript abspielen

```c
// 2D-UI-Sound (spatial = 0)
SEffectManager.PlaySound("MyMod_Alert_SoundSet", vector.Zero);

// 3D-Welt-Sound (spatial = 1)
SEffectManager.PlaySound("MyMod_Alert_SoundSet", GetPosition());
```

### Praxisbeispiel: MyMissions-Mod Radio-Piepton

```cpp
class CfgSoundShaders
{
    class MyBeep_SoundShader
    {
        samples[] = {{ "MyMissions\Sounds\bip", 1 }};
        volume = 0.6;
        range = 5;
        limitation = 0;
    };
};

class CfgSoundSets
{
    class MyBeep_SoundSet
    {
        soundShaders[] = { "MyBeep_SoundShader" };
        volumeFactor = 1.0;
        frequencyFactor = 1.0;
        spatial = 0;      // 2D -- wird als UI-Sound abgespielt
    };
};
```

---

## CfgAddons: Preload-Deklarationen

`CfgAddons` ist ein optionaler Block, der der Engine Hinweise zum Vorladen von Assets gibt:

```cpp
class CfgAddons
{
    class PreloadAddons
    {
        class MyMod
        {
            list[] = {};       // Liste von Addon-Namen zum Vorladen (normalerweise leer)
        };
    };
};
```

In der Praxis deklarieren die meisten Mods dies mit einer leeren `list[]`. Es stellt sicher, dass die Engine die Mod während der Preload-Phase erkennt. Einige Mods lassen es komplett weg, ohne Probleme.

---

## Praxisbeispiele aus professionellen Mods

### MyFramework (nur Skripte, Framework)

```cpp
class CfgPatches
{
    class MyCore_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Scripts" };
    };
};

class CfgMods
{
    class MyMod
    {
        name = "MyFramework";
        dir = "MyFramework";
        author = "MyMod Team";
        overview = "MyFramework - Central Admin Panel and Shared Library";
        inputs = "MyFramework/Scripts/Inputs.xml";
        creditsJson = "MyFramework/Scripts/Credits.json";
        type = "mod";
        defines[] = { "MYMOD_CORE" };
        dependencies[] = { "Core", "Game", "World", "Mission" };

        class defs
        {
            class imageSets
            {
                files[] =
                {
                    "MyFramework/GUI/imagesets/prefabs.imageset",
                    "MyFramework/GUI/imagesets/CUI.imageset",
                    "MyFramework/GUI/icons/thin.imageset",
                    "MyFramework/GUI/icons/light.imageset",
                    "MyFramework/GUI/icons/regular.imageset",
                    "MyFramework/GUI/icons/solid.imageset",
                    "MyFramework/GUI/icons/brands.imageset"
                };
            };
            class widgetStyles
            {
                files[] =
                {
                    "MyFramework/GUI/looknfeel/prefabs.styles"
                };
            };
            class engineScriptModule
            {
                files[] = { "MyFramework/Scripts/1_Core" };
            };
            class gameScriptModule
            {
                files[] = { "MyFramework/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                files[] = { "MyFramework/Scripts/4_World" };
            };
            class missionScriptModule
            {
                files[] = { "MyFramework/Scripts/5_Mission" };
            };
        };
    };
};
```

### COT (Abhängigkeit von CF, verwendet Common-Ordner)

```cpp
class CfgPatches
{
    class JM_COT_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "JM_CF_Scripts", "JM_COT_GUI", "DZ_Data" };
    };
};

class CfgMods
{
    class JM_CommunityOnlineTools
    {
        dir = "JM";
        name = "Community Online Tools";
        credits = "Jacob_Mango, DannyDog, Arkensor";
        creditsJson = "JM/COT/Scripts/Data/Credits.json";
        author = "Jacob_Mango";
        versionPath = "JM/COT/Scripts/Data/Version.hpp";
        inputs = "JM/COT/Scripts/Data/Inputs.xml";
        type = "mod";
        defines[] = { "JM_COT", "JM_COT_VEHICLEMANAGER", "JM_COT_INVISIBILITY" };
        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class engineScriptModule
            {
                value = "";
                files[] =
                {
                    "JM/COT/Scripts/Common",     // Geteilter Code
                    "JM/COT/Scripts/1_Core"
                };
            };
            class gameScriptModule
            {
                value = "";
                files[] =
                {
                    "JM/COT/Scripts/Common",
                    "JM/COT/Scripts/3_Game"
                };
            };
            class worldScriptModule
            {
                value = "";
                files[] =
                {
                    "JM/COT/Scripts/Common",
                    "JM/COT/Scripts/4_World"
                };
            };
            class missionScriptModule
            {
                value = "";
                files[] =
                {
                    "JM/COT/Scripts/Common",
                    "JM/COT/Scripts/5_Mission"
                };
            };
        };
    };
};
```

### MyMissions-Mod Server (nur Server-Mod)

```cpp
class CfgPatches
{
    class SDZS_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Scripts", "MyScripts", "MyCore_Scripts" };
    };
};

class CfgMods
{
    class MyMissionsServer
    {
        name = "MyMissions Mod Server";
        dir = "MyMissions_Server";
        author = "MyMod";
        type = "servermod";              // <-- Nur-Server-Mod
        defines[] = { "MYMOD_MISSIONS" };
        dependencies[] = { "Core", "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                files[] = { "MyMissions_Server/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                files[] = { "MyMissions_Server/Scripts/4_World" };
            };
            class missionScriptModule
            {
                files[] = { "MyMissions_Server/Scripts/5_Mission" };
            };
        };
    };
};
```

### DabsFramework (Verwendet gameLibScriptModule + CfgVehicles)

```cpp
class CfgPatches
{
    class DF_Scripts
    {
        requiredAddons[] = { "DZ_Scripts", "DF_GUI" };
    };
};

class CfgMods
{
    class DabsFramework
    {
        name = "Dabs Framework";
        dir = "DabsFramework";
        credits = "InclementDab";
        author = "InclementDab";
        creditsJson = "DabsFramework/Scripts/Credits.json";
        versionPath = "DabsFramework/Scripts/Version.hpp";
        type = "mod";
        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class imageSets
            {
                files[] =
                {
                    "DabsFramework/gui/imagesets/prefabs.imageset",
                    "DabsFramework/gui/icons/brands.imageset",
                    "DabsFramework/gui/icons/light.imageset",
                    "DabsFramework/gui/icons/regular.imageset",
                    "DabsFramework/gui/icons/solid.imageset",
                    "DabsFramework/gui/icons/thin.imageset"
                };
            };
            class widgetStyles
            {
                files[] =
                {
                    "DabsFramework/gui/looknfeel/prefabs.styles"
                };
            };
            class engineScriptModule
            {
                value = "";
                files[] = { "DabsFramework/scripts/1_core" };
            };
            class gameLibScriptModule      // Selten: Dabs verwendet Schicht 2
            {
                value = "";
                files[] = { "DabsFramework/scripts/2_GameLib" };
            };
            class gameScriptModule
            {
                value = "";
                files[] = { "DabsFramework/scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "DabsFramework/scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "DabsFramework/scripts/5_Mission" };
            };
        };
    };
};

class CfgVehicles
{
    class HouseNoDestruct;
    class NetworkLightBase : HouseNoDestruct
    {
        scope = 1;
    };
    class NetworkPointLight : NetworkLightBase
    {
        scope = 1;
    };
    class NetworkSpotLight : NetworkLightBase
    {
        scope = 1;
    };
};
```

---

## Häufige Fehler

### 1. Falsche requiredAddons -- Mod lädt vor ihrer Abhängigkeit

```cpp
// FALSCH: Fehlende Abhängigkeit von CF, daher lädt Ihre Mod möglicherweise vor CF
class CfgPatches
{
    class MyMod_Scripts
    {
        requiredAddons[] = { "DZ_Data" };  // CF nicht aufgelistet!
    };
};

// RICHTIG: ALLE Abhängigkeiten deklarieren
class CfgPatches
{
    class MyMod_Scripts
    {
        requiredAddons[] = { "DZ_Data", "JM_CF_Scripts" };
    };
};
```

**Symptom:** Undefinierte Typfehler für Klassen aus der Abhängigkeit. Die Mod wurde geladen, bevor die Abhängigkeit kompiliert war.

### 2. Fehlende Skriptmodul-Pfade

```cpp
// FALSCH: Sie haben einen Scripts/4_World/-Ordner, aber vergessen ihn zu deklarieren
class defs
{
    class gameScriptModule
    {
        files[] = { "MyMod/Scripts/3_Game" };
    };
    // 4_World fehlt! Alle .c-Dateien in 4_World/ werden ignoriert.
};

// RICHTIG: Jede verwendete Schicht deklarieren
class defs
{
    class gameScriptModule
    {
        files[] = { "MyMod/Scripts/3_Game" };
    };
    class worldScriptModule
    {
        files[] = { "MyMod/Scripts/4_World" };
    };
};
```

**Symptom:** Klassen, die Sie definiert haben, existieren einfach nicht. Kein Fehler -- sie werden stillschweigend nicht kompiliert.

### 3. Falsche Dateipfade (Groß-/Kleinschreibung)

Während Windows nicht zwischen Groß- und Kleinschreibung unterscheidet, können DayZ-Pfade in bestimmten Kontexten (Linux-Server, PBO-Packing) gross-/kleinschreibungssensitiv sein:

```cpp
// RISKANT: Gemischte Groß-/Kleinschreibung die auf Linux fehlschlagen kann
files[] = { "mymod/scripts/3_game" };   // Ordner ist tatsächlich "MyMod/Scripts/3_Game"

// SICHER: Exakt die tatsächliche Verzeichnis-Schreibweise verwenden
files[] = { "MyMod/Scripts/3_Game" };
```

### 4. CfgPatches-Klassennamen-Kollision

```cpp
// FALSCH: Einen generischen Namen verwenden, der mit einer anderen Mod kollidieren könnte
class CfgPatches
{
    class Scripts              // Zu generisch! Wird kollidieren.
    {
        // ...
    };
};

// RICHTIG: Ein eindeutiges Präfix verwenden
class CfgPatches
{
    class MyMod_Scripts        // Einzigartig für Ihre Mod
    {
        // ...
    };
};
```

### 5. Zirkuläre requiredAddons

```cpp
// ModA config.cpp
requiredAddons[] = { "ModB_Scripts" };

// ModB config.cpp
requiredAddons[] = { "ModA_Scripts" };  // ZIRKULAER! Engine kann nicht auflösen.
```

### 6. dependencies[] ohne passende Skriptmodule deklarieren

```cpp
// FALSCH: "World" als Abhängigkeit aufgelistet, aber kein worldScriptModule vorhanden
dependencies[] = { "Game", "World", "Mission" };

class defs
{
    class gameScriptModule
    {
        files[] = { "MyMod/Scripts/3_Game" };
    };
    // Kein worldScriptModule deklariert -- "World"-Abhängigkeit ist irreführend
    class missionScriptModule
    {
        files[] = { "MyMod/Scripts/5_Mission" };
    };
};
```

Dies verursacht keinen Fehler, ist aber irreführend. Listen Sie nur Abhängigkeiten auf, die Sie tatsächlich verwenden.

### 7. CfgVehicles in die Scripts-config.cpp setzen

Es funktioniert, ist aber schlechte Praxis. Halten Sie Item-/Entitäts-Definitionen in einem separaten PBO (`Data/config.cpp`) und Skript-Definitionen in `Scripts/config.cpp`.

---

## Vollständige Vorlage

Hier ist eine produktionsreife `Scripts/config.cpp`-Vorlage, die Sie kopieren und anpassen können:

```cpp
// ============================================================================
// Scripts/config.cpp -- MyMod Skriptmodul-Definitionen
// ============================================================================

class CfgPatches
{
    class MyMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Scripts"
            // Framework-Abhängigkeiten hier hinzufügen:
            // "JM_CF_Scripts",         // Community Framework
            // "MyCore_Scripts",      // MyFramework
        };
    };
};

class CfgMods
{
    class MyMod
    {
        dir = "MyMod";
        name = "My Mod";
        author = "IhrName";
        credits = "IhrName";
        creditsJson = "MyMod/Scripts/Data/Credits.json";
        overview = "Eine kurze Beschreibung, was diese Mod tut.";
        type = "mod";

        defines[] =
        {
            "MYMOD_LOADED"
            // "MYMOD_DEBUG"      // Für Debug-Builds einkommentieren
        };

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class imageSets
            {
                files[] = {};     // .imageset-Pfade hier hinzufügen
            };

            class widgetStyles
            {
                files[] = {};     // .styles-Pfade hier hinzufügen
            };

            class gameScriptModule
            {
                value = "";
                files[] = { "MyMod/Scripts/3_Game" };
            };

            class worldScriptModule
            {
                value = "";
                files[] = { "MyMod/Scripts/4_World" };
            };

            class missionScriptModule
            {
                value = "";
                files[] = { "MyMod/Scripts/5_Mission" };
            };
        };
    };
};
```

---

**Zurück:** [Kapitel 2.1: Die 5-Schichten-Skript-Hierarchie](01-five-layers.md)
**Weiter:** [Kapitel 2.3: mod.cpp & Workshop](03-mod-cpp.md)
