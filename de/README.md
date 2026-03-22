# DayZ Modding - Kompletter Leitfaden

> Umfassende DayZ-Modding-Dokumentation — 92 Kapitel, von Null zum fertigen Mod.

<p align="center">
  <a href="../en/README.md"><img src="https://flagsapi.com/US/flat/48.png" alt="English" /></a>
  <a href="../pt/README.md"><img src="https://flagsapi.com/BR/flat/48.png" alt="Portugues" /></a>
  <a href="README.md"><img src="https://flagsapi.com/DE/flat/48.png" alt="Deutsch" /></a>
  <a href="../ru/README.md"><img src="https://flagsapi.com/RU/flat/48.png" alt="Russki" /></a>
  <a href="../es/README.md"><img src="https://flagsapi.com/ES/flat/48.png" alt="Espanol" /></a>
  <a href="../fr/README.md"><img src="https://flagsapi.com/FR/flat/48.png" alt="Francais" /></a>
  <a href="../ja/README.md"><img src="https://flagsapi.com/JP/flat/48.png" alt="Nihongo" /></a>
  <a href="../zh-hans/README.md"><img src="https://flagsapi.com/CN/flat/48.png" alt="Jiantizi Zhongwen" /></a>
  <a href="../cs/README.md"><img src="https://flagsapi.com/CZ/flat/48.png" alt="Cestina" /></a>
  <a href="../pl/README.md"><img src="https://flagsapi.com/PL/flat/48.png" alt="Polski" /></a>
  <a href="../hu/README.md"><img src="https://flagsapi.com/HU/flat/48.png" alt="Magyar" /></a>
  <a href="../it/README.md"><img src="https://flagsapi.com/IT/flat/48.png" alt="Italiano" /></a>
</p>

---

## Vollständiges Seitenverzeichnis

### Teil 1: Enforce Script Sprache (13 Kapitel)

| # | Kapitel | Beschreibung |
|---|---------|--------------|
| 1.1 | [Variablen & Typen](01-enforce-script/01-variables-types.md) | Primitive Typen, Variablendeklaration, Konvertierungen und Standardwerte |
| 1.2 | [Arrays, Maps & Sets](01-enforce-script/02-arrays-maps-sets.md) | Datensammlungen: Array, Map, Set — Iteration, Suche, Sortierung |
| 1.3 | [Klassen & Vererbung](01-enforce-script/03-classes-inheritance.md) | Klassendefinition, Vererbung, Konstruktoren, Polymorphismus |
| 1.4 | [Modded Classes](01-enforce-script/04-modded-classes.md) | Modded-Class-System, Methoden-Override, Super-Aufrufe |
| 1.5 | [Kontrollfluss](01-enforce-script/05-control-flow.md) | If/else, switch, while/for-Schleifen, break, continue |
| 1.6 | [String-Operationen](01-enforce-script/06-strings.md) | String-Manipulation, Formatierung, Suche, Vergleich |
| 1.7 | [Mathematik & Vektoren](01-enforce-script/07-math-vectors.md) | Mathematische Funktionen, 3D-Vektoren, Entfernungen, Richtungen |
| 1.8 | [Speicherverwaltung](01-enforce-script/08-memory-management.md) | Referenzzählung, ref, Leak-Vermeidung, Referenzzyklen |
| 1.9 | [Casting & Reflexion](01-enforce-script/09-casting-reflection.md) | Typumwandlung, Class.CastTo, Laufzeit-Typüberprüfung |
| 1.10 | [Enums & Präprozessor](01-enforce-script/10-enums-preprocessor.md) | Aufzählungen, #ifdef, #define, bedingte Kompilierung |
| 1.11 | [Fehlerbehandlung](01-enforce-script/11-error-handling.md) | Fehlerbehandlung ohne try/catch, Guard Clauses |
| 1.12 | [Was es NICHT gibt](01-enforce-script/12-gotchas.md) | 30+ Fallstricke und Einschränkungen von Enforce Script |
| 1.13 | [Funktionen & Methoden](01-enforce-script/13-functions-methods.md) | Funktionsdeklaration, Parameter, Rückgabewerte, static, proto |

### Teil 2: Mod-Struktur (6 Kapitel)

| # | Kapitel | Beschreibung |
|---|---------|--------------|
| 2.1 | [Die 5-Schichten-Hierarchie](02-mod-structure/01-five-layers.md) | Die 5 Script-Schichten von DayZ und Kompilierungsreihenfolge |
| 2.2 | [config.cpp im Detail](02-mod-structure/02-config-cpp.md) | Vollständige config.cpp-Struktur, CfgPatches, CfgMods |
| 2.3 | [mod.cpp & Workshop](02-mod-structure/03-mod-cpp.md) | mod.cpp-Datei, Veröffentlichung im Steam Workshop |
| 2.4 | [Dein erster Mod](02-mod-structure/04-minimum-viable-mod.md) | Minimaler funktionsfähiger Mod — essentielle Dateien und Struktur |
| 2.5 | [Dateiorganisation](02-mod-structure/05-file-organization.md) | Namenskonventionen, empfohlene Ordnerstruktur |
| 2.6 | [Server/Client-Architektur](02-mod-structure/06-server-client-split.md) | Trennung von Server- und Client-Code, Sicherheit |

### Teil 3: GUI & Layout-System (10 Kapitel)

| # | Kapitel | Beschreibung |
|---|---------|--------------|
| 3.1 | [Widget-Typen](03-gui-system/01-widget-types.md) | Alle verfügbaren Widget-Typen: Text, Bild, Button usw. |
| 3.2 | [Layout-Dateiformat](03-gui-system/02-layout-files.md) | Struktur von .layout-XML-Dateien für Oberflächen |
| 3.3 | [Größe & Positionierung](03-gui-system/03-sizing-positioning.md) | Koordinatensystem, Größen-Flags, Verankerung |
| 3.4 | [Container](03-gui-system/04-containers.md) | Container-Widgets: WrapSpacer, GridSpacer, ScrollWidget |
| 3.5 | [Programmatische Erstellung](03-gui-system/05-programmatic-widgets.md) | Widgets per Code erstellen, GetWidgetUnderCursor, SetHandler |
| 3.6 | [Ereignisbehandlung](03-gui-system/06-event-handling.md) | UI-Callbacks: OnClick, OnChange, OnMouseEnter |
| 3.7 | [Stile, Schriften & Bilder](03-gui-system/07-styles-fonts.md) | Verfügbare Schriften, Stile, Bildladen |
| 3.8 | [Dialoge & Modale](03-gui-system/08-dialogs-modals.md) | Dialogerstellung, modale Menüs, Bestätigungen |
| 3.9 | [Echte Mod-UI-Muster](03-gui-system/09-real-mod-patterns.md) | UI-Muster von COT, VPP, Expansion, Dabs Framework |
| 3.10 | [Erweiterte Widgets](03-gui-system/10-advanced-widgets.md) | MapWidget, RenderTargetWidget, spezialisierte Widgets |

### Teil 4: Dateiformate & Werkzeuge (8 Kapitel)

| # | Kapitel | Beschreibung |
|---|---------|--------------|
| 4.1 | [Texturen](04-file-formats/01-textures.md) | Formate .paa, .edds, .tga — Konvertierung und Verwendung |
| 4.2 | [3D-Modelle](04-file-formats/02-models.md) | Format .p3d, LODs, Geometrie, Memory-Points |
| 4.3 | [Materialien](04-file-formats/03-materials.md) | .rvmat-Dateien, Shader, Oberflächeneigenschaften |
| 4.4 | [Audio](04-file-formats/04-audio.md) | Formate .ogg und .wss, Soundkonfiguration |
| 4.5 | [DayZ Tools](04-file-formats/05-dayz-tools.md) | Arbeitsablauf mit offiziellen DayZ Tools |
| 4.6 | [PBO-Verpackung](04-file-formats/06-pbo-packing.md) | Erstellung und Extraktion von PBO-Dateien |
| 4.7 | [Workbench-Anleitung](04-file-formats/07-workbench-guide.md) | Nutzung der Workbench für Skript- und Asset-Bearbeitung |
| 4.8 | [Gebäude-Modellierung](04-file-formats/08-building-modeling.md) | Gebäude modellieren mit Türen und Leitern |

### Teil 5: Konfigurationsdateien (6 Kapitel)

| # | Kapitel | Beschreibung |
|---|---------|--------------|
| 5.1 | [stringtable.csv](05-config-files/01-stringtable.md) | Lokalisierung mit stringtable.csv für 13 Sprachen |
| 5.2 | [inputs.xml](05-config-files/02-inputs-xml.md) | Tastenbelegung und benutzerdefinierte Keybindings |
| 5.3 | [credits.json](05-config-files/03-credits-json.md) | Credits-Datei des Mods |
| 5.4 | [ImageSets](05-config-files/04-imagesets.md) | ImageSet-Format für Icons und Sprites |
| 5.5 | [Server-Konfiguration](05-config-files/05-server-configs.md) | DayZ-Server-Konfigurationsdateien |
| 5.6 | [Spawn-Konfiguration](05-config-files/06-spawning-gear.md) | Startausrüstung und Spawnpunkt-Konfiguration |

### Teil 6: Engine-API-Referenz (23 Kapitel)

| # | Kapitel | Beschreibung |
|---|---------|--------------|
| 6.1 | [Entitätensystem](06-engine-api/01-entity-system.md) | Entitätshierarchie, EntityAI, ItemBase, Object |
| 6.2 | [Fahrzeugsystem](06-engine-api/02-vehicles.md) | Fahrzeug-API, Motoren, Flüssigkeiten, Physiksimulation |
| 6.3 | [Wettersystem](06-engine-api/03-weather.md) | Wettersteuerung, Regen, Nebel, Bewölkung |
| 6.4 | [Kamerasystem](06-engine-api/04-cameras.md) | Benutzerdefinierte Kameras, Position, Rotation, Übergänge |
| 6.5 | [Post-Processing-Effekte](06-engine-api/05-ppe.md) | PPE: Blur, chromatische Aberration, Farbkorrektur |
| 6.6 | [Benachrichtigungssystem](06-engine-api/06-notifications.md) | Bildschirmbenachrichtigungen, Spielernachrichten |
| 6.7 | [Timer & CallQueue](06-engine-api/07-timers.md) | Zeitgeber, verzögerte Aufrufe, Wiederholung |
| 6.8 | [Datei-I/O & JSON](06-engine-api/08-file-io.md) | Datei lesen/schreiben, JSON-Parsing |
| 6.9 | [Netzwerk & RPC](06-engine-api/09-networking.md) | Netzwerkkommunikation, RPCs, Client-Server-Synchronisation |
| 6.10 | [Zentralwirtschaft](06-engine-api/10-central-economy.md) | Loot-System, Kategorien, Flags, Min/Max |
| 6.11 | [Mission Hooks](06-engine-api/11-mission-hooks.md) | Missions-Hooks, MissionBase, MissionServer |
| 6.12 | [Aktionssystem](06-engine-api/12-action-system.md) | Spieleraktionen, ActionBase, Ziele, Bedingungen |
| 6.13 | [Eingabesystem](06-engine-api/13-input-system.md) | Tastenerkennung, Mapping, UAInput |
| 6.14 | [Spielersystem](06-engine-api/14-player-system.md) | PlayerBase, Inventar, Leben, Ausdauer, Statistiken |
| 6.15 | [Soundsystem](06-engine-api/15-sound-system.md) | Audiowiedergabe, SoundOnVehicle, Umgebung |
| 6.16 | [Crafting-System](06-engine-api/16-crafting-system.md) | Handwerksrezepte, Zutaten, Ergebnisse |
| 6.17 | [Bausystem](06-engine-api/17-construction-system.md) | Basisbau, Bauteile, Zustände |
| 6.18 | [Animationssystem](06-engine-api/18-animation-system.md) | Spieleranimation, Command-IDs, Callbacks |
| 6.19 | [Geländeabfragen](06-engine-api/19-terrain-queries.md) | Raycasts, Geländeposition, Oberflächen |
| 6.20 | [Partikeleffekte](06-engine-api/20-particle-effects.md) | Partikelsystem, Emitter, visuelle Effekte |
| 6.21 | [Zombie- & KI-System](06-engine-api/21-zombie-ai-system.md) | ZombieBase, Infizierten-KI, Verhalten |
| 6.22 | [Admin & Server](06-engine-api/22-admin-server.md) | Serververwaltung, Bans, Kicks, RCON |
| 6.23 | [Weltsysteme](06-engine-api/23-world-systems.md) | Tageszeit, Datum, Weltfunktionen |

### Teil 7: Muster & Best Practices (7 Kapitel)

| # | Kapitel | Beschreibung |
|---|---------|--------------|
| 7.1 | [Singleton-Muster](07-patterns/01-singletons.md) | Einzelinstanzen, globaler Zugriff, Initialisierung |
| 7.2 | [Modulsysteme](07-patterns/02-module-systems.md) | Modulregistrierung, Lebenszyklus, CF-Module |
| 7.3 | [RPC-Kommunikation](07-patterns/03-rpc-patterns.md) | Muster für sichere und effiziente RPCs |
| 7.4 | [Konfigurationspersistenz](07-patterns/04-config-persistence.md) | JSON-Konfigurationen speichern/laden, Versionierung |
| 7.5 | [Berechtigungssysteme](07-patterns/05-permissions.md) | Hierarchische Berechtigungen, Wildcards, Gruppen |
| 7.6 | [Ereignisgesteuerte Architektur](07-patterns/06-events.md) | Event-Bus, Publish/Subscribe, Entkopplung |
| 7.7 | [Leistungsoptimierung](07-patterns/07-performance.md) | Profiling, Cache, Pooling, RPC-Reduzierung |

### Teil 8: Tutorials (13 Kapitel)

| # | Kapitel | Beschreibung |
|---|---------|--------------|
| 8.1 | [Dein erster Mod (Hello World)](08-tutorials/01-first-mod.md) | Schritt-für-Schritt: Mod erstellen und laden |
| 8.2 | [Benutzerdefiniertes Item erstellen](08-tutorials/02-custom-item.md) | Item mit Modell, Textur und Config erstellen |
| 8.3 | [Admin-Panel bauen](08-tutorials/03-admin-panel.md) | Admin-UI mit Teleport, Spawn, Verwaltung |
| 8.4 | [Chat-Befehle hinzufügen](08-tutorials/04-chat-commands.md) | Benutzerdefinierte Befehle im Spielchat |
| 8.5 | [Mod-Template verwenden](08-tutorials/05-mod-template.md) | Das offizielle DayZ-Mod-Template nutzen |
| 8.6 | [Debugging & Testen](08-tutorials/06-debugging-testing.md) | Logs, Debug, Diagnosewerkzeuge |
| 8.7 | [Im Workshop veröffentlichen](08-tutorials/07-publishing-workshop.md) | Mod im Steam Workshop veröffentlichen |
| 8.8 | [HUD-Overlay bauen](08-tutorials/08-hud-overlay.md) | Benutzerdefiniertes HUD-Overlay über dem Spiel |
| 8.9 | [Professionelles Mod-Template](08-tutorials/09-professional-template.md) | Vollständiges produktionsreifes Template |
| 8.10 | [Fahrzeug-Mod erstellen](08-tutorials/10-vehicle-mod.md) | Benutzerdefiniertes Fahrzeug mit Physik und Config |
| 8.11 | [Kleidungs-Mod erstellen](08-tutorials/11-clothing-mod.md) | Benutzerdefinierte Kleidung mit Texturen und Slots |
| 8.12 | [Handelssystem bauen](08-tutorials/12-trading-system.md) | Handelssystem zwischen Spielern/NPCs |
| 8.13 | [Diag-Menu-Referenz](08-tutorials/13-diag-menu.md) | Diagnosemenüs für die Entwicklung |

### Schnellreferenz

| Seite | Beschreibung |
|-------|--------------|
| [Cheatsheet](cheatsheet.md) | Kurzübersicht der Enforce-Script-Syntax |
| [API-Schnellreferenz](06-engine-api/quick-reference.md) | Meistgenutzte Engine-API-Methoden |
| [Glossar](glossary.md) | Begriffsdefinitionen für DayZ-Modding |
| [FAQ](faq.md) | Häufig gestellte Fragen zum Modding |
| [Fehlerbehebung](troubleshooting.md) | 91 häufige Probleme mit Lösungen |

---

## Credits

| Entwickler | Projekte | Hauptbeiträge |
|------------|----------|----------------|
| [**Jacob_Mango**](https://github.com/Jacob-Mango) | Community Framework, COT | Modulsystem, RPC, Berechtigungen, ESP |
| [**InclementDab**](https://github.com/InclementDab) | Dabs Framework, DayZ Editor, Mod Template | MVC, ViewBinding, Editor-UI |
| [**salutesh**](https://github.com/salutesh) | DayZ Expansion | Markt, Gruppen, Kartenmarkierungen, Fahrzeuge |
| [**Arkensor**](https://github.com/Arkensor) | DayZ Expansion | Zentralwirtschaft, Einstellungsversionierung |
| [**DaOne**](https://github.com/Da0ne) | VPP Admin Tools | Spielerverwaltung, Webhooks, ESP |
| [**GravityWolf**](https://github.com/GravityWolfNotAmused) | VPP Admin Tools | Berechtigungen, Serververwaltung |
| [**Brian Orr (DrkDevil)**](https://github.com/DrkDevil) | Colorful UI | Farbthemen, Modded-Class-UI-Muster |
| [**lothsun**](https://github.com/lothsun) | Colorful UI | UI-Farbsysteme, visuelle Verbesserung |
| [**Bohemia Interactive**](https://github.com/BohemiaInteractive) | DayZ Engine & Samples | Enforce Script, Vanilla-Skripte, DayZ Tools |
| [**StarDZ Team**](https://github.com/StarDZ-Team) | Dieses Wiki | Dokumentation, Übersetzung & Organisation |

## Lizenz

Die Dokumentation ist lizenziert unter [**CC BY-SA 4.0**](https://creativecommons.org/licenses/by-sa/4.0/).
Codebeispiele sind lizenziert unter [**MIT**](../LICENCE).
