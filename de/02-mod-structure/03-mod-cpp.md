# Kapitel 2.3: mod.cpp und Workshop

[Startseite](../README.md) | [<< Zurück: config.cpp im Detail](02-config-cpp.md) | **mod.cpp und Workshop** | [Weiter: Minimale funktionsfähige Mod >>](04-minimum-viable-mod.md)

---

> **Zusammenfassung:** Die `mod.cpp`-Datei ist reine Metadaten -- sie steuert, wie Ihre Mod im DayZ-Launcher, in der Spiel-Mod-Liste und im Steam Workshop erscheint. Sie hat keinen Einfluss auf Gameplay, Scripting oder Ladereihenfolge. Wenn `config.cpp` der Motor ist, ist `mod.cpp` die Lackierung.

---

## Inhaltsverzeichnis

- [Übersicht](#übersicht)
- [Wo mod.cpp gespeichert wird](#wo-modcpp-gespeichert-wird)
- [Alle Felder Referenz](#alle-felder-referenz)
- [Felddetails](#felddetails)
- [Client-Mod vs Server-Mod](#client-mod-vs-server-mod)
- [Workshop-Metadaten](#workshop-metadaten)
- [Erforderliche vs optionale Felder](#erforderliche-vs-optionale-felder)
- [Praxisbeispiele](#praxisbeispiele)
- [Tipps und bewährte Praktiken](#tipps-und-bewährte-praktiken)

---

## Übersicht

`mod.cpp` befindet sich im Stammverzeichnis Ihres Mod-Ordners (neben dem `Addons/`-Verzeichnis). Der DayZ-Launcher liest sie, um den Namen, das Logo, die Beschreibung und den Autor Ihrer Mod im Mod-Auswahlbildschirm anzuzeigen.

**Kernpunkt:** `mod.cpp` wird NICHT kompiliert. Es ist kein Enforce Script. Es ist eine einfache Schlüssel-Wert-Datei, die vom Launcher gelesen wird. Es gibt keine Klassen, keine Semikolons nach schließenden Klammern, keine Arrays mit `[]`-Syntax (mit einer Ausnahme für Workshop-Scriptmodule -- siehe unten).

---

## Wo mod.cpp gespeichert wird

```
@MyMod/                       <-- Workshop-/Startordner (mit @ präfixiert)
  mod.cpp                     <-- Diese Datei
  Addons/
    MyMod_Scripts.pbo
    MyMod_Data.pbo
  Keys/
    MyMod.bikey
  meta.cpp                    <-- Automatisch generiert vom Workshop-Publisher
```

Das `@`-Präfix am Ordnernamen ist Konvention für Steam-Workshop-Mods, aber nicht streng erforderlich.

---

## Alle Felder Referenz

| Feld | Typ | Zweck | Erforderlich |
|------|-----|-------|-------------|
| `name` | String | Mod-Anzeigename | Ja |
| `picture` | String | Großes Bild in erweiterter Beschreibung | Nein |
| `logo` | String | Logo unter dem Spielmenü | Nein |
| `logoSmall` | String | Kleines Icon neben dem Mod-Namen (eingeklappt) | Nein |
| `logoOver` | String | Logo bei Mausüberfahrt | Nein |
| `tooltip` | String | Tooltip bei Mausüberfahrt | Nein |
| `tooltipOwned` | String | Tooltip wenn Mod installiert ist | Nein |
| `overview` | String | Längere Beschreibung in Mod-Details | Nein |
| `action` | String | URL-Link (Website, Discord, GitHub) | Nein |
| `actionURL` | String | Alternative zu `action` (gleicher Zweck) | Nein |
| `author` | String | Autorenname | Nein |
| `authorID` | String | Steam64-ID des Autors | Nein |
| `version` | String | Versionsstring | Nein |
| `type` | String | `"mod"` oder `"servermod"` | Nein |
| `extra` | int | Reserviertes Feld (immer 0) | Nein |

---

## Felddetails

### name

Der Anzeigename, der in der DayZ-Launcher-Modliste und im Spiel-Mod-Bildschirm angezeigt wird.

```cpp
name = "My Framework";
```

Sie können Stringtable-Referenzen zur Lokalisierung verwenden:

```cpp
name = "$STR_DF_NAME";    // Wird über stringtable.csv aufgelöst
```

### picture

Pfad zu einem größeren Bild, das angezeigt wird, wenn die Mod-Beschreibung erweitert ist. Unterstützt `.paa`, `.edds` und `.tga`-Formate.

```cpp
picture = "MyMod/GUI/images/logo_large.edds";
```

Der Pfad ist relativ zum Mod-Stammverzeichnis. Wenn leer oder weggelassen, wird kein Bild angezeigt.

### logo

Das primäre Logo, das unter dem Spielmenü angezeigt wird, wenn die Mod geladen ist.

```cpp
logo = "MyMod/GUI/images/logo.edds";
```

### logoSmall

Kleines Icon, das neben dem Mod-Namen angezeigt wird, wenn die Beschreibung eingeklappt (nicht erweitert) ist.

```cpp
logoSmall = "MyMod/GUI/images/logo_small.edds";
```

### logoOver

Das Logo, das erscheint, wenn der Benutzer mit der Maus über das Mod-Logo fährt. Oft dasselbe wie `logo`, kann aber eine hervorgehobene/leuchtende Variante sein.

```cpp
logoOver = "MyMod/GUI/images/logo_hover.edds";
```

### tooltip / tooltipOwned

Kurzer Text, der beim Überfahren der Mod im Launcher angezeigt wird. `tooltipOwned` wird angezeigt, wenn die Mod installiert ist (vom Workshop heruntergeladen).

```cpp
tooltip = "MyMod Core - Admin-Panel & Framework";
tooltipOwned = "My Framework - Zentrales Admin-Panel & geteilte Bibliothek";
```

### overview

Eine längere Beschreibung, die im Mod-Details-Panel angezeigt wird. Dies ist Ihr "Über"-Text.

```cpp
overview = "My Framework bietet ein zentralisiertes Admin-Panel und eine geteilte Bibliothek für alle Framework-Mods.";
```

### action / actionURL

Eine anklickbare URL, die mit der Mod verknüpft ist (typischerweise eine Website, Discord-Einladung oder GitHub-Repository). Beide Felder dienen demselben Zweck -- verwenden Sie das, was Sie bevorzugen.

```cpp
action = "https://github.com/mymod/repo";
// ODER
actionURL = "https://discord.gg/mymod";
```

### author / authorID

Der Autorenname und seine Steam64-ID.

```cpp
author = "Dokumentationsteam";
authorID = "76561198000000000";
```

`authorID` wird vom Workshop verwendet, um auf das Steam-Profil des Autors zu verlinken.

### version

Ein Versionsstring. Kann jedes Format haben -- die Engine parst oder validiert ihn nicht.

```cpp
version = "1.0.0";
```

Einige Mods verweisen stattdessen auf eine Versionsdatei in config.cpp:

```cpp
versionPath = "MyMod/Scripts/Data/Version.hpp";   // Dies gehört in config.cpp, NICHT mod.cpp
```

### type

Deklariert, ob dies eine reguläre Mod oder eine nur-Server-Mod ist. Wenn weggelassen, ist der Standard `"mod"`.

```cpp
type = "mod";           // Geladen über -mod= (Client + Server)
type = "servermod";     // Geladen über -servermod= (nur Server, nicht an Clients gesendet)
```

### extra

Reserviertes Feld. Immer auf `0` setzen oder ganz weglassen.

```cpp
extra = 0;
```

---

## Client-Mod vs Server-Mod

DayZ unterstützt zwei Mod-Lademechanismen:

### Client-Mod (`-mod=`)

- Von Clients aus dem Steam Workshop heruntergeladen
- Scripts laufen auf BEIDEN Seiten, Client und Server
- Kann UI, HUD, Modelle, Texturen, Sounds enthalten
- Erfordert Schlüsselsignierung (`.bikey`) für Server-Beitritt

```
// Startparameter:
-mod=@MyMod

// mod.cpp:
type = "mod";
```

### Server-Mod (`-servermod=`)

- Läuft NUR auf dem dedizierten Server
- Clients laden sie nie herunter
- Kann keine clientseitige UI oder `5_Mission`-Client-Code enthalten
- Keine Schlüsselsignierung erforderlich

```
// Startparameter:
-servermod=@MyModServer

// mod.cpp:
type = "servermod";
```

### Split-Mod-Muster

Viele Mods werden als ZWEI Pakete ausgeliefert -- eine Client-Mod und eine Server-Mod:

```
@MyMod_Missions/           <-- Client-Mod (-mod=)
  mod.cpp                   type = "mod"
  Addons/
    MyMod_Missions.pbo     Scripts: UI, Entity-Rendering, RPC-Empfang

@MyMod_MissionsServer/     <-- Server-Mod (-servermod=)
  mod.cpp                   type = "servermod"
  Addons/
    MyMod_MissionsServer.pbo   Scripts: Spawning, Logik, Zustandsverwaltung
```

Dies hält die serverseitige Logik privat (nie an Clients gesendet) und reduziert die Client-Download-Größe.

---

## Workshop-Metadaten

### meta.cpp (Automatisch generiert)

Wenn Sie im Steam Workshop veröffentlichen, generieren die DayZ-Tools automatisch eine `meta.cpp`-Datei:

```cpp
protocol = 2;
publishedid = 2900000000;    // Steam-Workshop-Element-ID
timestamp = 1711000000;       // Unix-Zeitstempel der letzten Aktualisierung
```

Bearbeiten Sie `meta.cpp` nicht manuell. Sie wird von den Publishing-Tools verwaltet.

### Workshop-Interaktion

Der DayZ-Launcher liest sowohl `mod.cpp` als auch `meta.cpp`:

- `mod.cpp` liefert die visuellen Metadaten (Name, Logo, Beschreibung)
- `meta.cpp` verknüpft die lokalen Dateien mit dem Steam-Workshop-Element
- Die Steam-Workshop-Seite hat eigene Titel, Beschreibung und Bilder (verwaltet über die Steam-Weboberfläche)

Die `mod.cpp`-Felder sind das, was Spieler in der **Spiel-internen** Mod-Liste sehen. Die Workshop-Seite ist das, was sie auf **Steam** sehen. Halten Sie sie konsistent.

### Workshop-Bildempfehlungen

| Bild | Zweck | Empfohlene Größe |
|------|-------|-----------------|
| `picture` | Erweiterte Mod-Beschreibung | 512x512 oder ähnlich |
| `logo` | Menü-Logo | 128x128 bis 256x256 |
| `logoSmall` | Eingeklapptes Listen-Icon | 64x64 bis 128x128 |

Verwenden Sie das `.edds`-Format für beste Kompatibilität. `.paa` und `.tga` funktionieren ebenfalls. PNG und JPG funktionieren NICHT in mod.cpp-Bildfeldern.

---

## Erforderliche vs optionale Felder

### Absolutes Minimum

Eine funktionsfähige `mod.cpp` benötigt nur:

```cpp
name = "Meine Mod";
```

Das war's. Eine Zeile. Die Mod wird laden und funktionieren. Alles andere ist kosmetisch.

### Empfohlenes Minimum

Für eine im Workshop veröffentlichte Mod fügen Sie mindestens hinzu:

```cpp
name = "Mein Mod-Name";
author = "IhrName";
version = "1.0";
overview = "Was diese Mod in einem Satz macht.";
```

### Volle professionelle Einrichtung

```cpp
name = "Mein Mod-Name";
picture = "MyMod/GUI/images/logo_large.edds";
logo = "MyMod/GUI/images/logo.edds";
logoSmall = "MyMod/GUI/images/logo_small.edds";
logoOver = "MyMod/GUI/images/logo_hover.edds";
tooltip = "Kurze Beschreibung";
overview = "Vollständige Beschreibung der Funktionen Ihrer Mod.";
action = "https://discord.gg/mymod";
author = "IhrName";
authorID = "76561198000000000";
version = "1.2.3";
type = "mod";
```

---

## Praxisbeispiele

### Framework-Mod (Client-Mod)

```cpp
name = "My Framework";
picture = "";
actionURL = "";
tooltipOwned = "My Framework - Zentrales Admin-Panel & geteilte Bibliothek";
overview = "My Framework bietet ein zentralisiertes Admin-Panel und geteilte Bibliothek für alle Framework-Mods. Verwalten Sie Konfigurationen, Berechtigungen und Mod-Integration über eine einzige In-Game-Oberfläche.";
author = "Dokumentationsteam";
version = "1.0.0";
```

### Framework Server-Mod (Minimal)

```cpp
name = "My Framework Server";
author = "Dokumentationsteam";
version = "1.0.0";
extra = 0;
type = "mod";
```

### Community Framework

```cpp
name = "Community Framework";
picture = "JM/CF/GUI/textures/cf_icon.edds";
logo = "JM/CF/GUI/textures/cf_icon.edds";
logoSmall = "JM/CF/GUI/textures/cf_icon.edds";
logoOver = "JM/CF/GUI/textures/cf_icon.edds";
tooltip = "Community Framework";
overview = "Dies ist ein Community Framework für DayZ SA. Ein bemerkenswertes Feature ist, dass es darauf abzielt, das Problem widersprüchlicher RPC-Typ-IDs und Mods zu lösen.";
action = "https://github.com/Arkensor/DayZ-CommunityFramework";
author = "CF Mod Team";
authorID = "76561198103677868";
version = "1.5.8";
```

### VPP Admin Tools

```cpp
picture = "VPPAdminTools/data/vpp_logo_m.paa";
logoSmall = "VPPAdminTools/data/vpp_logo_ss.paa";
logo = "VPPAdminTools/data/vpp_logo_s.paa";
logoOver = "VPPAdminTools/data/vpp_logo_s.paa";
tooltip = "Werkzeuge zur Unterstützung bei administrativen DayZ-Serveraufgaben";
overview = "V++ Admin Tools gebaut für die DayZ-Community-Server!";
action = "https://discord.dayzvpp.com";
```

Hinweis: VPP lässt `name` und `author` weg -- es funktioniert trotzdem, aber der Mod-Name fällt im Launcher auf den Ordnernamen zurück.

### DabsFramework (Mit Lokalisierung)

```cpp
name = "$STR_DF_NAME";
picture = "DabsFramework/gui/images/dabs_framework_logo.paa";
logo = "DabsFramework/gui/images/dabs_framework_logo.paa";
logoSmall = "DabsFramework/gui/images/dabs_framework_logo.paa";
logoOver = "DabsFramework/gui/images/dabs_framework_logo.paa";
tooltip = "$STR_DF_TOOLTIP";
overview = "$STR_DF_DESCRIPTION";
action = "https://dab.dev";
author = "$STR_DF_AUTHOR";
authorID = "76561198247958888";
version = "1.0";
```

DabsFramework verwendet `$STR_`-Stringtable-Referenzen für alle Textfelder, was mehrsprachige Unterstützung für die Mod-Auflistung selbst ermöglicht.

### AI-Mod (Client-Mod mit Scriptmodulen in mod.cpp)

```cpp
name = "My AI Mod";
picture = "";
actionURL = "";
tooltipOwned = "My AI Mod - Intelligentes Bot-Framework für DayZ";
overview = "Fortgeschrittenes AI-Bot-Framework mit menschenähnlicher Wahrnehmung, Kampftaktiken und Entwickler-API";
author = "IhrName";
version = "1.0.0";
type = "mod";
dependencies[] = {"Game", "World", "Mission"};
class Defs
{
    class gameScriptModule
    {
        value = "";
        files[] = {"MyMod_AI/Scripts/3_Game"};
    };
    class worldScriptModule
    {
        value = "";
        files[] = {"MyMod_AI/Scripts/4_World"};
    };
    class missionScriptModule
    {
        value = "";
        files[] = {"MyMod_AI/Scripts/5_Mission"};
    };
};
```

Hinweis: Diese Mod platziert Scriptmodul-Definitionen in `mod.cpp` anstatt in `config.cpp`. Beide Speicherorte funktionieren -- die Engine liest beide Dateien. Allerdings ist die Standardkonvention, `CfgMods` und Scriptmodul-Definitionen in `config.cpp` zu platzieren. Sie in `mod.cpp` zu platzieren ist ein alternativer Ansatz, der von einigen Mods verwendet wird.

---

## Tipps und bewährte Praktiken

### 1. mod.cpp einfach halten

`mod.cpp` ist nur Metadaten. Versuchen Sie nicht, Spiellogik, Klassendefinitionen oder etwas Komplexes hier einzufügen. Wenn Sie Scriptmodule benötigen, platzieren Sie sie in `config.cpp`.

### 2. .edds für Bilder verwenden

`.edds` ist das Standard-DayZ-Texturformat für UI-Elemente. Verwenden Sie DayZ Tools (TexView2) zum Konvertieren von PNG/TGA in .edds.

### 3. Workshop-Seite abstimmen

Halten Sie die Felder `name`, `overview` und `author` konsistent mit Ihrer Steam-Workshop-Seite. Spieler sehen beide.

### 4. Konsistent versionieren

Wählen Sie ein Versionierungsschema (z.B. `1.0.0` semantische Versionierung) und aktualisieren Sie es mit jedem Release. Einige Mods verwenden eine `Version.hpp`-Datei, die in `config.cpp` referenziert wird, für zentralisierte Versionsverwaltung.

### 5. Zuerst ohne Bilder testen

Während der Entwicklung lassen Sie Bildpfade leer. Fügen Sie Logos zuletzt hinzu, nachdem alles funktioniert. Fehlende Bilder verhindern nicht das Laden der Mod.

### 6. Server-Mods benötigen weniger

Nur-Server-Mods benötigen minimale mod.cpp, da Spieler sie nie im Launcher sehen:

```cpp
name = "Meine Server-Mod";
author = "IhrName";
version = "1.0.0";
type = "servermod";
```

---

## Bewährte Praktiken

- Fügen Sie immer mindestens `name` und `author` ein -- selbst bei Server-Mods hilft es, sie in Log-Ausgaben und Admin-Tools zu identifizieren.
- Verwenden Sie das `.edds`-Format für alle Bildfelder (`picture`, `logo`, `logoSmall`, `logoOver`). PNG und JPG werden nicht unterstützt.
- Halten Sie `mod.cpp` auf Metadaten beschränkt. Platzieren Sie `CfgMods`, Scriptmodule und `defines[]` stattdessen in `config.cpp`.
- Verwenden Sie semantische Versionierung (`1.2.3`) im `version`-Feld und aktualisieren Sie sie mit jedem Workshop-Release.
- Testen Sie Ihre Mod zuerst ohne Bilder; fügen Sie Logos als letzten Schliff hinzu, nachdem die Funktionalität bestätigt ist.

---

## In echten Mods beobachtet

| Muster | Mod | Detail |
|--------|-----|--------|
| Lokalisiertes `name`-Feld | DabsFramework | Verwendet `$STR_DF_NAME` Stringtable-Referenz für mehrsprachige Mod-Auflistung |
| Scriptmodule in mod.cpp | Einige AI-Mods | Platzieren `class Defs` mit Scriptmodul-Pfaden direkt in mod.cpp anstatt config.cpp |
| Fehlendes `name`-Feld | VPP Admin Tools | Lässt `name` vollständig weg; Launcher fällt auf Ordnernamen als Anzeigetext zurück |
| Alle Bildfelder identisch | Community Framework | Setzt `logo`, `logoSmall` und `logoOver` auf dieselbe `.edds`-Datei |
| Leere Bildpfade | Viele frühe Mods | Lassen `picture=""` während der Entwicklung; fügen Branding vor Workshop-Veröffentlichung hinzu |

---

## Theorie vs. Praxis

| Konzept | Theorie | Realität |
|---------|---------|---------|
| `mod.cpp` ist erforderlich | Jeder Mod-Ordner braucht eine | Eine Mod lädt problemlos ohne sie, aber der Launcher zeigt keinen Namen oder Metadaten an |
| `type`-Feld steuert das Laden | `"mod"` vs `"servermod"` | Der Startparameter (`-mod=` vs `-servermod=`) ist das, was das Laden tatsächlich steuert; das `type`-Feld ist nur Metadaten |
| Bildpfade unterstützen gängige Formate | Alle Texturformate funktionieren | Nur `.edds`, `.paa` und `.tga` funktionieren; `.png` und `.jpg` werden stillschweigend ignoriert |
| `authorID` verlinkt zu Steam | Steam64-ID erstellt einen anklickbaren Link | Funktioniert nur auf der Workshop-Seite; die Spiel-interne Mod-Liste rendert ihn nicht als Link |
| `version` wird validiert | Engine prüft das Versionsformat | Die Engine behandelt es als rohen String; `"banana"` ist technisch gültig |

---

## Kompatibilität und Auswirkungen

- **Multi-Mod:** `mod.cpp` hat keinen Einfluss auf Ladereihenfolge oder Abhängigkeiten. Zwei Mods mit identischen Feldwerten werden nicht kollidieren -- nur `CfgPatches`-Klassennamen in `config.cpp` können kollidieren.
- **Leistung:** `mod.cpp` wird einmal beim Start gelesen. Hier referenzierte Bilddateien werden für die Launcher-UI in den Speicher geladen, haben aber keine Auswirkung auf die Spielleistung.

---

**Zurück:** [Kapitel 2.2: config.cpp im Detail](02-config-cpp.md)
**Weiter:** [Kapitel 2.4: Ihre erste Mod -- Minimale funktionsfähige](04-minimum-viable-mod.md)
