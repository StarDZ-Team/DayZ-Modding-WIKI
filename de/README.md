# Vollstaendiger Leitfaden zum DayZ Modding

> Die umfassendste DayZ-Modding-Dokumentation, die es gibt. Vom Nullpunkt zum veroeffentlichten Mod.

[![English](https://flagsapi.com/US/flat/48.png)](../en/README.md) [![Portugues](https://flagsapi.com/BR/flat/48.png)](../pt/README.md) [![Deutsch](https://flagsapi.com/DE/flat/48.png)](README.md) [![Russkij](https://flagsapi.com/RU/flat/48.png)](../ru/README.md) [![Cestina](https://flagsapi.com/CZ/flat/48.png)](../cs/README.md) [![Polski](https://flagsapi.com/PL/flat/48.png)](../pl/README.md) [![Magyar](https://flagsapi.com/HU/flat/48.png)](../hu/README.md) [![Italiano](https://flagsapi.com/IT/flat/48.png)](../it/README.md) [![Espanol](https://flagsapi.com/ES/flat/48.png)](../es/README.md) [![Francais](https://flagsapi.com/FR/flat/48.png)](../fr/README.md) [![Nihongo](https://flagsapi.com/JP/flat/48.png)](../ja/README.md) [![Jiantizi Zhongwen](https://flagsapi.com/CN/flat/48.png)](../zh-hans/README.md)

---

## Inhaltsverzeichnis

### Teil 1: Enforce Script Sprache
Lerne die Skriptsprache von DayZ von Grund auf.

| Kapitel | Thema | Status |
|---------|-------|--------|
| [1.1](../de/01-enforce-script/01-variables-types.md) | Variablen & Typen | ✅ |
| [1.2](../de/01-enforce-script/02-arrays-maps-sets.md) | Arrays, Maps & Sets | ✅ |
| [1.3](../de/01-enforce-script/03-classes-inheritance.md) | Klassen & Vererbung | ✅ |
| [1.4](../de/01-enforce-script/04-modded-classes.md) | Modded-Klassen | ✅ |
| [1.5](../de/01-enforce-script/05-control-flow.md) | Kontrollfluss | ✅ |
| [1.6](../de/01-enforce-script/06-strings.md) | String-Operationen | ✅ |
| [1.7](../de/01-enforce-script/07-math-vectors.md) | Mathematik & Vektoren | ✅ |
| [1.8](../de/01-enforce-script/08-memory-management.md) | Speicherverwaltung | ✅ |
| [1.9](../de/01-enforce-script/09-casting-reflection.md) | Casting & Reflection | ✅ |
| [1.10](../de/01-enforce-script/10-enums-preprocessor.md) | Enums & Praeprozessor | ✅ |
| [1.11](../de/01-enforce-script/11-error-handling.md) | Fehlerbehandlung | ✅ |
| [1.12](../de/01-enforce-script/12-gotchas.md) | Was es NICHT gibt | ✅ |
| [1.13](../en/01-enforce-script/13-functions-methods.md) | Functions & Methods (English) | 🔄 |

### Teil 2: Mod-Struktur
Verstehe, wie DayZ-Mods organisiert sind.

| Kapitel | Thema | Status |
|---------|-------|--------|
| [2.1](../de/02-mod-structure/01-five-layers.md) | Die 5-Schichten-Skripthierarchie | ✅ |
| [2.2](../de/02-mod-structure/02-config-cpp.md) | config.cpp im Detail | ✅ |
| [2.3](../de/02-mod-structure/03-mod-cpp.md) | mod.cpp & Workshop | ✅ |
| [2.4](../de/02-mod-structure/04-minimum-viable-mod.md) | Dein erster Mod | ✅ |
| [2.5](../de/02-mod-structure/05-file-organization.md) | Dateiorganisation | ✅ |
| [2.6](../en/02-mod-structure/06-server-client-split.md) | Server/Client Architecture (English) | 🔄 |

### Teil 3: GUI- & Layout-System
Baue Benutzeroberflaechen fuer DayZ.

| Kapitel | Thema | Status |
|---------|-------|--------|
| [3.1](../de/03-gui-system/01-widget-types.md) | Widget-Typen | ✅ |
| [3.2](../de/03-gui-system/02-layout-files.md) | Layout-Dateiformat | ✅ |
| [3.3](../de/03-gui-system/03-sizing-positioning.md) | Groessenbestimmung & Positionierung | ✅ |
| [3.4](../de/03-gui-system/04-containers.md) | Container-Widgets | ✅ |
| [3.5](../de/03-gui-system/05-programmatic-widgets.md) | Programmatische Erstellung | ✅ |
| [3.6](../de/03-gui-system/06-event-handling.md) | Ereignisbehandlung | ✅ |
| [3.7](../de/03-gui-system/07-styles-fonts.md) | Stile, Schriften & Bilder | ✅ |
| [3.8](../en/03-gui-system/08-dialogs-modals.md) | Dialogs & Modals (English) | 🔄 |
| [3.9](../en/03-gui-system/09-real-mod-patterns.md) | Real Mod UI Patterns (English) | 🔄 |
| [3.10](../en/03-gui-system/10-advanced-widgets.md) | Advanced Widgets (English) | 🔄 |

### Teil 4: Dateiformate & Werkzeuge
Arbeiten mit der DayZ-Asset-Pipeline.

| Kapitel | Thema | Status |
|---------|-------|--------|
| [4.1](../de/04-file-formats/01-textures.md) | Texturen (.paa, .edds, .tga) | ✅ |
| [4.2](../de/04-file-formats/02-models.md) | 3D-Modelle (.p3d) | ✅ |
| [4.3](../de/04-file-formats/03-materials.md) | Materialien (.rvmat) | ✅ |
| [4.4](../de/04-file-formats/04-audio.md) | Audio (.ogg, .wss) | ✅ |
| [4.5](../de/04-file-formats/05-dayz-tools.md) | DayZ Tools Arbeitsablauf | ✅ |
| [4.6](../de/04-file-formats/06-pbo-packing.md) | PBO-Paketierung | ✅ |
| [4.7](../en/04-file-formats/07-workbench-guide.md) | Workbench Guide (English) | 🔄 |

### Teil 5: Konfigurationsdateien
Wichtige Konfigurationsdateien fuer jeden Mod.

| Kapitel | Thema | Status |
|---------|-------|--------|
| [5.1](../de/05-config-files/01-stringtable.md) | stringtable.csv (13 Sprachen) | ✅ |
| [5.2](../de/05-config-files/02-inputs-xml.md) | Inputs.xml (Tastenbelegung) | ✅ |
| [5.3](../de/05-config-files/03-credits-json.md) | Credits.json | ✅ |
| [5.4](../de/05-config-files/04-imagesets.md) | ImageSet-Format | ✅ |
| [5.5](../en/05-config-files/05-server-configs.md) | Server Configuration Files (English) | 🔄 |
| [5.6](../en/05-config-files/06-spawning-gear.md) | Spawning Gear Configuration (English) | 🔄 |

### Teil 6: Engine-API-Referenz
DayZ-Engine-APIs fuer Mod-Entwickler.

| Kapitel | Thema | Status |
|---------|-------|--------|
| [6.1](../de/06-engine-api/01-entity-system.md) | Entity-System | ✅ |
| [6.2](../de/06-engine-api/02-vehicles.md) | Fahrzeugsystem | ✅ |
| [6.3](../de/06-engine-api/03-weather.md) | Wettersystem | ✅ |
| [6.4](../de/06-engine-api/04-cameras.md) | Kamerasystem | ✅ |
| [6.5](../de/06-engine-api/05-ppe.md) | Nachbearbeitungseffekte | ✅ |
| [6.6](../de/06-engine-api/06-notifications.md) | Benachrichtigungssystem | ✅ |
| [6.7](../de/06-engine-api/07-timers.md) | Timer & CallQueue | ✅ |
| [6.8](../de/06-engine-api/08-file-io.md) | Datei-I/O & JSON | ✅ |
| [6.9](../de/06-engine-api/09-networking.md) | Netzwerk & RPC | ✅ |
| [6.10](../de/06-engine-api/10-central-economy.md) | Zentralwirtschaft | ✅ |
| [6.11](../en/06-engine-api/11-mission-hooks.md) | Mission Hooks (English) | 🔄 |
| [6.12](../en/06-engine-api/12-action-system.md) | Action System (English) | 🔄 |
| [6.13](../en/06-engine-api/13-input-system.md) | Input System (English) | 🔄 |
| [6.14](../en/06-engine-api/14-player-system.md) | Player System (English) | 🔄 |
| [6.15](../en/06-engine-api/15-sound-system.md) | Sound System (English) | 🔄 |
| [6.16](../en/06-engine-api/16-crafting-system.md) | Crafting System (English) | 🔄 |
| [6.17](../en/06-engine-api/17-construction-system.md) | Construction System (English) | 🔄 |
| [6.18](../en/06-engine-api/18-animation-system.md) | Animation System (English) | 🔄 |
| [6.19](../en/06-engine-api/19-terrain-queries.md) | Terrain & World Queries (English) | 🔄 |
| [6.20](../en/06-engine-api/20-particle-effects.md) | Particle & Effect System (English) | 🔄 |
| [6.21](../en/06-engine-api/21-zombie-ai-system.md) | Zombie & AI System (English) | 🔄 |
| [6.22](../en/06-engine-api/22-admin-server.md) | Admin & Server Management (English) | 🔄 |

### Teil 7: Muster & Best Practices
Praxiserprobte Muster aus professionellen Mods.

| Kapitel | Thema | Status |
|---------|-------|--------|
| [7.1](../de/07-patterns/01-singletons.md) | Singleton-Muster | ✅ |
| [7.2](../de/07-patterns/02-module-systems.md) | Modul-/Plugin-Systeme | ✅ |
| [7.3](../de/07-patterns/03-rpc-patterns.md) | RPC-Kommunikation | ✅ |
| [7.4](../de/07-patterns/04-config-persistence.md) | Konfigurationspersistenz | ✅ |
| [7.5](../de/07-patterns/05-permissions.md) | Berechtigungssysteme | ✅ |
| [7.6](../de/07-patterns/06-events.md) | Ereignisgesteuerte Architektur | ✅ |
| [7.7](../de/07-patterns/07-performance.md) | Leistungsoptimierung | ✅ |

### Teil 8: Tutorials
Schritt-fuer-Schritt-Anleitungen.

| Kapitel | Thema | Status |
|---------|-------|--------|
| [8.1](../de/08-tutorials/01-first-mod.md) | Dein erster Mod (Hello World) | ✅ |
| [8.2](../de/08-tutorials/02-custom-item.md) | Ein benutzerdefiniertes Item erstellen | ✅ |
| [8.3](../de/08-tutorials/03-admin-panel.md) | Ein Admin-Panel bauen | ✅ |
| [8.4](../de/08-tutorials/04-chat-commands.md) | Chat-Befehle hinzufuegen | ✅ |
| [8.5](../de/08-tutorials/05-mod-template.md) | Das DayZ Mod Template verwenden | ✅ |
| [8.6](../en/08-tutorials/06-debugging-testing.md) | Debugging & Testing (English) | 🔄 |
| [8.7](../en/08-tutorials/07-publishing-workshop.md) | Publishing to Steam Workshop (English) | 🔄 |
| [8.8](../en/08-tutorials/08-hud-overlay.md) | Building a HUD Overlay (English) | 🔄 |
| [8.9](../en/08-tutorials/09-professional-template.md) | Professional Mod Template (English) | 🔄 |
| [8.10](../en/08-tutorials/10-vehicle-mod.md) | Creating a Vehicle Mod (English) | 🔄 |
| [8.11](../en/08-tutorials/11-clothing-mod.md) | Creating a Clothing Mod (English) | 🔄 |
| [8.12](../en/08-tutorials/12-trading-system.md) | Building a Trading System (English) | 🔄 |
| [8.13](../en/08-tutorials/13-diag-menu.md) | Diag Menu Reference (English) | 🔄 |

---

## Unterstuetzte Sprachen

| Sprache | Code | Status |
|---------|------|--------|
| English | `en` | ✅ Original |
| Portugues | `pt` | ✅ Uebersetzt |
| Deutsch | `de` | ✅ Uebersetzt |
| Russkij | `ru` | Geplant |
| Cestina | `cs` | Geplant |
| Polski | `pl` | Geplant |
| Magyar | `hu` | Geplant |
| Italiano | `it` | Geplant |
| Espanol | `es` | Geplant |
| Francais | `fr` | Geplant |
| Nihongo | `ja` | Geplant |
| Jiantizi Zhongwen | `zh-hans` | Geplant |

---

## Schnellreferenz

- [Enforce Script Spickzettel](../de/cheatsheet.md)
- [Widget-Typ-Referenz](../de/03-gui-system/01-widget-types.md)
- [API-Schnellreferenz](../de/06-engine-api/quick-reference.md)
- [Haeufige Fallstricke](../de/01-enforce-script/12-gotchas.md)
- [Glossary (English)](../en/glossary.md) 🔄
- [FAQ (English)](../en/faq.md) 🔄
- [Troubleshooting Guide (English)](../en/troubleshooting.md) 🔄

---

## Mitwirken

Diese Dokumentation wurde durch das Studium folgender Quellen erstellt:
- 10+ professionelle DayZ-Mods (COT, VPP, Expansion, Dabs Framework, DayZ Editor, Colorful UI)
- 15 offizielle Beispiel-Mods von Bohemia Interactive
- 2.800+ Vanilla-DayZ-Skriptdateien
- Community-Framework-Quellcode

Pull Requests sind willkommen! Siehe [CONTRIBUTING.md](../CONTRIBUTING.md) fuer Richtlinien.

---

## Credits

- **Bohemia Interactive** -- DayZ-Engine & offizielle Beispiele
- **Jacob_Mango** -- Community Framework & Community Online Tools
- **InclementDab** -- Dabs Framework & DayZ Editor
- **DaOne & GravityWolf** -- VPP Admin Tools
- **DayZ Expansion Team** -- Expansion Scripts
- **Brian Orr (DrkDevil)** -- Colorful UI, Farbthemensystem
- **lothsun** -- Colorful UI, UI-Farbsysteme
- **StarDZ Team** -- Zusammenstellung, Uebersetzung & Dokumentation

## Lizenz

Diese Dokumentation ist lizenziert unter [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
Codebeispiele sind lizenziert unter [MIT](https://opensource.org/licenses/MIT).
