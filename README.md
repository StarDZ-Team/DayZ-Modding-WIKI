<h1 align="center">DayZ Modding Complete Guide</h1>

<p align="center">
  <img src="./images/logo.png" alt="DayZ Modding Wiki" />
</p>

---

<p align="center">
  <strong>The most comprehensive DayZ modding documentation ever created.</strong><br/>
  From absolute zero to published mod — in 12 languages.
</p>

<p align="center">
  <a href="en/README.md"><img src="https://flagsapi.com/US/flat/48.png" alt="English" /></a>
  <a href="pt/README.md"><img src="https://flagsapi.com/BR/flat/48.png" alt="Português" /></a>
  <a href="de/README.md"><img src="https://flagsapi.com/DE/flat/48.png" alt="Deutsch" /></a>
  <a href="ru/README.md"><img src="https://flagsapi.com/RU/flat/48.png" alt="Русский" /></a>
  <a href="es/README.md"><img src="https://flagsapi.com/ES/flat/48.png" alt="Español" /></a>
  <a href="fr/README.md"><img src="https://flagsapi.com/FR/flat/48.png" alt="Français" /></a>
  <a href="ja/README.md"><img src="https://flagsapi.com/JP/flat/48.png" alt="日本語" /></a>
  <a href="zh-hans/README.md"><img src="https://flagsapi.com/CN/flat/48.png" alt="简体中文" /></a>
  <a href="cs/README.md"><img src="https://flagsapi.com/CZ/flat/48.png" alt="Čeština" /></a>
  <a href="pl/README.md"><img src="https://flagsapi.com/PL/flat/48.png" alt="Polski" /></a>
  <a href="hu/README.md"><img src="https://flagsapi.com/HU/flat/48.png" alt="Magyar" /></a>
  <a href="it/README.md"><img src="https://flagsapi.com/IT/flat/48.png" alt="Italiano" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/chapters-92-blue?style=flat-square" alt="92 chapters" />
  <img src="https://img.shields.io/badge/languages-12-green?style=flat-square" alt="12 languages" />
  <img src="https://img.shields.io/badge/files-1,107-orange?style=flat-square" alt="1,107 files" />
  <img src="https://img.shields.io/badge/license-CC_BY--SA_4.0-lightgrey?style=flat-square" alt="CC BY-SA 4.0" />
</p>

---

## Why This Wiki?

There is **no complete public documentation** for DayZ modding. The official wiki is sparse, community tutorials are scattered and outdated, and most knowledge lives in private Discord servers. This project changes that.

This wiki was built by **reverse-engineering 10+ professional mods**, studying **2,800+ vanilla script files**, analyzing **15 official Bohemia samples**, and documenting every pattern, gotcha, and best practice we found.

**Whether you're creating your first mod or building a complex framework — this is your reference.**

---

## What's Inside

| Part | Topic | Chapters | What You'll Learn |
|:----:|-------|:--------:|-------------------|
| **1** | [Enforce Script Language](en/01-enforce-script/01-variables-types.md) | 13 | The complete language — types, classes, modded classes, memory management, 30+ gotchas |
| **2** | [Mod Structure](en/02-mod-structure/01-five-layers.md) | 6 | 5-layer hierarchy, config.cpp, server/client architecture |
| **3** | [GUI & Layout System](en/03-gui-system/01-widget-types.md) | 10 | Widgets, .layout files, sizing, events, dialogs, real mod UI patterns |
| **4** | [File Formats & Tools](en/04-file-formats/01-textures.md) | 8 | Textures, models, audio, DayZ Tools, Workbench, PBO packing |
| **5** | [Configuration Files](en/05-config-files/01-stringtable.md) | 6 | stringtable.csv, inputs.xml, imagesets, server configs, spawn gear |
| **6** | [Engine API Reference](en/06-engine-api/01-entity-system.md) | 23 | Entity, player, vehicle, sound, crafting, construction, animation, zombie/AI, terrain, particles, admin |
| **7** | [Patterns & Best Practices](en/07-patterns/01-singletons.md) | 7 | Singletons, modules, RPC, permissions, events, performance |
| **8** | [Tutorials](en/08-tutorials/01-first-mod.md) | 13 | Hello World → Custom Items → Admin Panel → Vehicles → Trading System |
| | [Quick Reference](en/06-engine-api/quick-reference.md) | 6 | Cheatsheet, API reference, glossary, FAQ, troubleshooting |

> **92 chapters total** — each with code examples, common mistakes, best practices, and real-world patterns from professional mods.

---

## Quick Start

**New to DayZ modding?** Follow this path:

1. [Your First Mod (Hello World)](en/08-tutorials/01-first-mod.md) — Build and load a mod in 15 minutes
2. [The 5-Layer Script Hierarchy](en/02-mod-structure/01-five-layers.md) — Understand how DayZ organizes code
3. [Variables & Types](en/01-enforce-script/01-variables-types.md) — Learn Enforce Script basics
4. [Creating a Custom Item](en/08-tutorials/02-custom-item.md) — Add your first in-game item
5. [What Does NOT Exist](en/01-enforce-script/12-gotchas.md) — Avoid the 30 most common traps

**Experienced developer?** Jump to:
- [API Quick Reference](en/06-engine-api/quick-reference.md) — Condensed method reference
- [Professional Mod Template](en/08-tutorials/09-professional-template.md) — Production-ready starter
- [Real Mod UI Patterns](en/03-gui-system/09-real-mod-patterns.md) — Patterns from COT, VPP, Expansion, Dabs
- [Troubleshooting Guide](en/troubleshooting.md) — 91 problems with solutions

---

## Key Features

- **Learn by example** — Every chapter includes real code from professional mods (COT, VPP, Expansion, Dabs Framework, Colorful UI)
- **Gotcha-first approach** — Each topic highlights what goes wrong before showing what's right
- **Copy-paste ready** — All code examples are complete and tested
- **Theory vs Practice** — Tables showing what the docs say vs how things actually behave
- **12 languages** — Full wiki available in English, Portuguese, German, Russian, Spanish, French, Japanese, Chinese, Czech, Polish, Hungarian, and Italian
- **31+ Mermaid diagrams** — Visual flowcharts, class hierarchies, and sequence diagrams
- **Professional template** — Complete mod starter with every file explained

---

## Reference Material

This documentation was built by studying:

| Source | What We Extracted |
|--------|-------------------|
| [Community Online Tools](https://github.com/Jacob-Mango/DayZ-CommunityOnlineTools) | Module system, RPC, permissions, ESP, admin UI |
| [VPP Admin Tools](https://github.com/Da0ne/VPP-AdminTools) | Player management, dialogs, webhook system |
| [DayZ Expansion](https://github.com/salutesh/DayZ-Expansion-Scripts) | Market, vehicles, AI, notifications, settings versioning |
| [Dabs Framework](https://github.com/InclementDab/DayZ-Dabs-Framework) | MVC architecture, ViewBinding, attribute-based registration |
| [Colorful UI](https://github.com/DrkDevil/DayZ-Colorful-UI) | Theme system, modded class UI, resolution-aware layouts |
| [DayZ Editor](https://github.com/InclementDab/DayZ-Editor) | Editor UI, command pattern, object management |
| [Community Framework](https://github.com/Jacob-Mango/DayZ-CommunityFramework) | Module lifecycle, RPC manager, logging |
| [Official DayZ Samples](https://github.com/BohemiaInteractive/DayZ-Samples) | 15 sample mods covering vehicles, weapons, crafting, terrain |
| Vanilla DayZ Scripts | 2,800+ script files reverse-engineered |

---

## Contributing

We welcome contributions! Whether it's fixing a typo, adding an example, translating a chapter, or writing new content.

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Ways to contribute:**
- Report errors or suggest improvements via [Issues](https://github.com/StarDZ-Team/DayZ-Modding-WIKI/issues)
- Submit corrections or new content via [Pull Requests](https://github.com/StarDZ-Team/DayZ-Modding-WIKI/pulls)
- Help translate — see [Translation Guide](CONTRIBUTING.md#translations)
- Add screenshots to chapters that need them — see [Image Needs](images/NEEDED_IMAGES.md)

---

## Credits

This wiki exists thanks to the incredible work of these developers and their open-source projects:

| Developer | Projects | Key Contributions |
|-----------|----------|-------------------|
| [**Jacob_Mango**](https://github.com/Jacob-Mango) | Community Framework, COT | Module system, RPC, permissions, ESP |
| [**InclementDab**](https://github.com/InclementDab) | Dabs Framework, DayZ Editor, Mod Template | MVC, ViewBinding, editor UI |
| [**salutesh**](https://github.com/salutesh) | DayZ Expansion | Market, party, map markers, vehicles |
| [**Arkensor**](https://github.com/Arkensor) | DayZ Expansion | Central economy, settings versioning |
| [**DaOne**](https://github.com/Da0ne) | VPP Admin Tools | Player management, webhooks, ESP |
| [**GravityWolf**](https://github.com/GravityWolfNotAmused) | VPP Admin Tools | Permissions, server management |
| [**Brian Orr (DrkDevil)**](https://github.com/DrkDevil) | Colorful UI | Color theming, modded class UI patterns |
| [**lothsun**](https://github.com/lothsun) | Colorful UI | UI color systems, visual enhancement |
| [**Bohemia Interactive**](https://github.com/BohemiaInteractive) | DayZ Engine & Samples | Enforce Script, vanilla scripts, DayZ Tools |
| [**StarDZ Team**](https://github.com/StarDZ-Team) | This Wiki | Documentation, translation & organization |

---

<p align="center">
  <strong>Built with reverse engineering, coffee, and the DayZ modding community.</strong><br/>
  <sub>If this wiki helped you, consider giving it a star and sharing it with fellow modders.</sub>
</p>

---

## License
<p align="center">
  Documentation is licensed under <a href="https://creativecommons.org/licenses/by-sa/4.0/"><img src="https://img.shields.io/badge/license-CC_BY--SA_4.0-lightgrey?style=flat-square" alt="CC BY-SA 4.0" /></a> — share and adapt with attribution.<br/>
  Code examples are licensed under <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square" alt="MIT License" /></a> — use freely in your mods.
  See <a href="LICENSE"><img src="https://img.shields.io/badge/license-See_LICENSE-lightgrey?style=flat-square" alt="See LICENSE" /></a> for full text.
</p>