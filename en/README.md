# DayZ Modding Complete Guide -- English

> The most comprehensive DayZ modding documentation available. From zero to published mod.
>
> **Note:** This is the English version. For other languages, see the [home page](../).

[![English](https://flagsapi.com/US/flat/48.png)](README.md) [![Portugues](https://flagsapi.com/BR/flat/48.png)](../pt/README.md) [![Deutsch](https://flagsapi.com/DE/flat/48.png)](../de/README.md) [![Russkij](https://flagsapi.com/RU/flat/48.png)](../ru/README.md) [![Cestina](https://flagsapi.com/CZ/flat/48.png)](../cs/README.md) [![Polski](https://flagsapi.com/PL/flat/48.png)](../pl/README.md) [![Magyar](https://flagsapi.com/HU/flat/48.png)](../hu/README.md) [![Italiano](https://flagsapi.com/IT/flat/48.png)](../it/README.md) [![Espanol](https://flagsapi.com/ES/flat/48.png)](../es/README.md) [![Francais](https://flagsapi.com/FR/flat/48.png)](../fr/README.md) [![Nihongo](https://flagsapi.com/JP/flat/48.png)](../ja/README.md) [![简体中文](https://flagsapi.com/CN/flat/48.png)](../zh-hans/README.md)

---

## Table of Contents

### Part 1: Enforce Script Language
Learn DayZ's scripting language from the ground up.

| Chapter | Topic | Status |
|---------|-------|--------|
| [1.1](01-enforce-script/01-variables-types.md) | Variables & Types | Done |
| [1.2](01-enforce-script/02-arrays-maps-sets.md) | Arrays, Maps & Sets | Done |
| [1.3](01-enforce-script/03-classes-inheritance.md) | Classes & Inheritance | Done |
| [1.4](01-enforce-script/04-modded-classes.md) | Modded Classes | Done |
| [1.5](01-enforce-script/05-control-flow.md) | Control Flow | Done |
| [1.6](01-enforce-script/06-strings.md) | String Operations | Done |
| [1.7](01-enforce-script/07-math-vectors.md) | Math & Vectors | Done |
| [1.8](01-enforce-script/08-memory-management.md) | Memory Management | Done |
| [1.9](01-enforce-script/09-casting-reflection.md) | Casting & Reflection | Done |
| [1.10](01-enforce-script/10-enums-preprocessor.md) | Enums & Preprocessor | Done |
| [1.11](01-enforce-script/11-error-handling.md) | Error Handling | Done |
| [1.12](01-enforce-script/12-gotchas.md) | What Does NOT Exist | Done |
| [1.13](01-enforce-script/13-functions-methods.md) | Functions & Methods | Done |

### Part 2: Mod Structure
Understand how DayZ mods are organized.

| Chapter | Topic | Status |
|---------|-------|--------|
| [2.1](02-mod-structure/01-five-layers.md) | The 5-Layer Script Hierarchy | Done |
| [2.2](02-mod-structure/02-config-cpp.md) | config.cpp Deep Dive | Done |
| [2.3](02-mod-structure/03-mod-cpp.md) | mod.cpp & Workshop | Done |
| [2.4](02-mod-structure/04-minimum-viable-mod.md) | Your First Mod | Done |
| [2.5](02-mod-structure/05-file-organization.md) | File Organization | Done |
| [2.6](02-mod-structure/06-server-client-split.md) | Server/Client Architecture | Done |

### Part 3: GUI & Layout System
Build user interfaces for DayZ.

| Chapter | Topic | Status |
|---------|-------|--------|
| [3.1](03-gui-system/01-widget-types.md) | Widget Types | Done |
| [3.2](03-gui-system/02-layout-files.md) | Layout File Format | Done |
| [3.3](03-gui-system/03-sizing-positioning.md) | Sizing & Positioning | Done |
| [3.4](03-gui-system/04-containers.md) | Container Widgets | Done |
| [3.5](03-gui-system/05-programmatic-widgets.md) | Programmatic Creation | Done |
| [3.6](03-gui-system/06-event-handling.md) | Event Handling | Done |
| [3.7](03-gui-system/07-styles-fonts.md) | Styles, Fonts & Images | Done |
| [3.8](03-gui-system/08-dialogs-modals.md) | Dialogs & Modals | Done |
| [3.9](03-gui-system/09-real-mod-patterns.md) | Real Mod UI Patterns | Done |
| [3.10](03-gui-system/10-advanced-widgets.md) | Advanced Widgets | Done |

### Part 4: File Formats & Tools
Working with DayZ asset pipeline.

| Chapter | Topic | Status |
|---------|-------|--------|
| [4.1](04-file-formats/01-textures.md) | Textures (.paa, .edds, .tga) | Done |
| [4.2](04-file-formats/02-models.md) | 3D Models (.p3d) | Done |
| [4.3](04-file-formats/03-materials.md) | Materials (.rvmat) | Done |
| [4.4](04-file-formats/04-audio.md) | Audio (.ogg, .wss) | Done |
| [4.5](04-file-formats/05-dayz-tools.md) | DayZ Tools Workflow | Done |
| [4.6](04-file-formats/06-pbo-packing.md) | PBO Packing | Done |
| [4.7](04-file-formats/07-workbench-guide.md) | Workbench Guide | Done |
| [4.8](04-file-formats/08-building-modeling.md) | Building Modeling (Doors & Ladders) | Done |

### Part 5: Configuration Files
Essential configuration files for every mod.

| Chapter | Topic | Status |
|---------|-------|--------|
| [5.1](05-config-files/01-stringtable.md) | stringtable.csv (13 Languages) | Done |
| [5.2](05-config-files/02-inputs-xml.md) | Inputs.xml (Keybindings) | Done |
| [5.3](05-config-files/03-credits-json.md) | Credits.json | Done |
| [5.4](05-config-files/04-imagesets.md) | ImageSet Format | Done |
| [5.5](05-config-files/05-server-configs.md) | Server Configuration Files | Done |
| [5.6](05-config-files/06-spawning-gear.md) | Spawning Gear Configuration | Done |

### Part 6: Engine API Reference
DayZ engine APIs for mod developers.

| Chapter | Topic | Status |
|---------|-------|--------|
| [6.1](06-engine-api/01-entity-system.md) | Entity System | Done |
| [6.2](06-engine-api/02-vehicles.md) | Vehicle System | Done |
| [6.3](06-engine-api/03-weather.md) | Weather System | Done |
| [6.4](06-engine-api/04-cameras.md) | Camera System | Done |
| [6.5](06-engine-api/05-ppe.md) | Post-Process Effects | Done |
| [6.6](06-engine-api/06-notifications.md) | Notification System | Done |
| [6.7](06-engine-api/07-timers.md) | Timers & CallQueue | Done |
| [6.8](06-engine-api/08-file-io.md) | File I/O & JSON | Done |
| [6.9](06-engine-api/09-networking.md) | Networking & RPC | Done |
| [6.10](06-engine-api/10-central-economy.md) | Central Economy | Done |
| [6.11](06-engine-api/11-mission-hooks.md) | Mission Hooks | Done |
| [6.12](06-engine-api/12-action-system.md) | Action System | Done |
| [6.13](06-engine-api/13-input-system.md) | Input System | Done |
| [6.14](06-engine-api/14-player-system.md) | Player System | Done |
| [6.15](06-engine-api/15-sound-system.md) | Sound System | Done |
| [6.16](06-engine-api/16-crafting-system.md) | Crafting System | Done |
| [6.17](06-engine-api/17-construction-system.md) | Construction System | Done |
| [6.18](06-engine-api/18-animation-system.md) | Animation System | Done |
| [6.19](06-engine-api/19-terrain-queries.md) | Terrain & World Queries | Done |
| [6.20](06-engine-api/20-particle-effects.md) | Particle & Effect System | Done |
| [6.21](06-engine-api/21-zombie-ai-system.md) | Zombie & AI System | Done |
| [6.22](06-engine-api/22-admin-server.md) | Admin & Server Management | Done |
| [6.23](06-engine-api/23-world-systems.md) | World Systems | Done |

### Part 7: Patterns & Best Practices
Battle-tested patterns from professional mods.

| Chapter | Topic | Status |
|---------|-------|--------|
| [7.1](07-patterns/01-singletons.md) | Singleton Pattern | Done |
| [7.2](07-patterns/02-module-systems.md) | Module/Plugin Systems | Done |
| [7.3](07-patterns/03-rpc-patterns.md) | RPC Communication | Done |
| [7.4](07-patterns/04-config-persistence.md) | Config Persistence | Done |
| [7.5](07-patterns/05-permissions.md) | Permission Systems | Done |
| [7.6](07-patterns/06-events.md) | Event-Driven Architecture | Done |
| [7.7](07-patterns/07-performance.md) | Performance Optimization | Done |

### Part 8: Tutorials
Step-by-step guides.

| Chapter | Topic | Status |
|---------|-------|--------|
| [8.1](08-tutorials/01-first-mod.md) | Your First Mod (Hello World) | Done |
| [8.2](08-tutorials/02-custom-item.md) | Creating a Custom Item | Done |
| [8.3](08-tutorials/03-admin-panel.md) | Building an Admin Panel | Done |
| [8.4](08-tutorials/04-chat-commands.md) | Adding Chat Commands | Done |
| [8.5](08-tutorials/05-mod-template.md) | Using the DayZ Mod Template | Done |
| [8.6](08-tutorials/06-debugging-testing.md) | Debugging & Testing | Done |
| [8.7](08-tutorials/07-publishing-workshop.md) | Publishing to Steam Workshop | Done |
| [8.8](08-tutorials/08-hud-overlay.md) | Building a HUD Overlay | Done |
| [8.9](08-tutorials/09-professional-template.md) | Professional Mod Template | Done |
| [8.10](08-tutorials/10-vehicle-mod.md) | Creating a Vehicle Mod | Done |
| [8.11](08-tutorials/11-clothing-mod.md) | Creating a Clothing Mod | Done |
| [8.12](08-tutorials/12-trading-system.md) | Building a Trading System | Done |
| [8.13](08-tutorials/13-diag-menu.md) | Diag Menu Reference | Done |

---

## Quick Reference

- [Enforce Script Cheat Sheet](cheatsheet.md)
- [Widget Type Reference](03-gui-system/01-widget-types.md)
- [API Quick Reference](06-engine-api/quick-reference.md)
- [Common Gotchas](01-enforce-script/12-gotchas.md)
- [Glossary](glossary.md)
- [FAQ](faq.md)
- [Troubleshooting Guide](troubleshooting.md)

---

## Contributing

This documentation was compiled by studying:
- 10+ professional DayZ mods (COT, VPP, Expansion, Dabs Framework, DayZ Editor, Colorful UI)
- 15 official Bohemia Interactive sample mods
- 2,800+ vanilla DayZ script files
- Community Framework source code

Pull requests welcome! See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

## Credits

This documentation was made possible by studying the work of these incredible developers and their open-source projects:

| Developer | GitHub | Projects | Contribution |
|-----------|--------|----------|--------------|
| **Jacob_Mango** | [@Jacob-Mango](https://github.com/Jacob-Mango) | Community Framework, Community Online Tools | Module system, RPC patterns, permissions, ESP, vehicle management |
| **InclementDab** | [@InclementDab](https://github.com/InclementDab) | Dabs Framework, DayZ Editor, Mod Template | MVC architecture, ViewBinding, widget patterns, editor UI |
| **salutesh** | [@salutesh](https://github.com/salutesh) | DayZ Expansion Scripts | Market system, party system, map markers, notification system, vehicle modules |
| **Arkensor** | [@Arkensor](https://github.com/Arkensor) | DayZ Expansion Scripts | Central economy, settings versioning, anti-cheat patterns |
| **DaOne** | [@Da0ne](https://github.com/Da0ne) | VPP Admin Tools | Player management, chat commands, webhook system, ESP tools |
| **GravityWolf** | [@GravityWolfNotAmused](https://github.com/GravityWolfNotAmused) | VPP Admin Tools | Permission system, server management, teleport system |
| **Bohemia Interactive** | [@BohemiaInteractive](https://github.com/BohemiaInteractive/) | DayZ Engine & Official Samples | Enforce Script engine, vanilla scripts, DayZ Tools, sample mods |
| **Brian Orr (DrkDevil)** | [@DrkDevil](https://github.com/DrkDevil) | Colorful UI | Color theming system, modded class UI patterns, resolution-aware layouts |
| **lothsun** | [@lothsun](https://github.com/lothsun) | Colorful UI | UI color systems, visual enhancement patterns |
| **StarDZ Team** | [@StarDZ-Team](https://github.com/StarDZ-Team) | --- | Documentation compilation, translation & organization |

## License

This documentation is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
Code examples are licensed under [MIT](https://opensource.org/licenses/MIT).
