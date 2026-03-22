# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A 12-language DayZ modding wiki built with VitePress. Contains 92 chapters covering Enforce Script, mod structure, GUI, engine APIs, patterns, and tutorials. Content was reverse-engineered from 10+ professional mods, 2,800+ vanilla script files, and 15 official Bohemia samples.

## Commands

```bash
npm run dev       # Start VitePress dev server (hot reload)
npm run build     # Build static site to .vitepress/dist/
npm run preview   # Preview the built site locally
```

No linter, no test suite. Validation is visual: run `npm run dev` and check the rendered output.

## Content Architecture

### Language Structure

All 12 languages mirror the same file tree. English (`en/`) is the source of truth:

```
en/01-enforce-script/01-variables-types.md   (English original)
pt/01-enforce-script/01-variables-types.md   (Portuguese translation)
de/01-enforce-script/01-variables-types.md   (German translation)
...
```

Languages: `en`, `pt`, `de`, `ru`, `es`, `fr`, `ja`, `zh-hans`, `cs`, `pl`, `hu`, `it`

### Chapter Organization (8 Parts)

| Part | Directory | Chapters | Topic |
|------|-----------|----------|-------|
| 1 | `01-enforce-script/` | 13 | Language fundamentals |
| 2 | `02-mod-structure/` | 6 | Mod organization, config.cpp |
| 3 | `03-gui-system/` | 10 | Widgets, layouts, UI patterns |
| 4 | `04-file-formats/` | 8 | Textures, models, audio, tools |
| 5 | `05-config-files/` | 6 | stringtable, inputs, server configs |
| 6 | `06-engine-api/` | 24 | Entity, player, vehicle, sound, AI, terrain |
| 7 | `07-patterns/` | 7 | Singletons, RPC, permissions, events |
| 8 | `08-tutorials/` | 13 | Hello World through Trading System |

Reference files sit at the root of each language dir: `cheatsheet.md`, `glossary.md`, `faq.md`, `troubleshooting.md`, `README.md`.

### File Naming Convention

```
<part-number>-<section-name>/<sequence-number>-<topic-slug>.md
```

### VitePress Configuration

- **Config:** `.vitepress/config.mts` — single sidebar definition via `sidebar(lang)`, parameterized for all 12 locales
- **Sidebar:** Each locale calls `sidebar('pt')`, `sidebar('de')`, etc. so sidebar links point to the correct language paths.
- **Mermaid:** Enabled via `vitepress-plugin-mermaid` (dark theme)
- **Search:** Local client-side search (no external provider)
- **Code blocks:** Line numbers enabled globally
- **Clean URLs:** Enabled (no `.html` suffixes)
- **Dead link exceptions:** `ignoreDeadLinks` allows `/LICENCE/` and `/04-scripting-guide/` patterns

## Content Conventions

### Chapter Structure

Every chapter follows this template:

```markdown
# Chapter X.Y: Title

> **Summary:** One or two sentences.

---

## Table of Contents
...

## Section
...

---

**Previous:** [link] | [Home](../../README.md) | **Next:** [link]
```

### Code Block Language Tags

- `` ```c `` — Enforce Script (`.c` files, NOT C/C++)
- `` ```cpp `` — config.cpp, mod.cpp
- `` ```xml `` — stringtable.csv (XML format), types.xml
- `` ```json `` / `` ```bash `` / `` ```batch `` — as expected

### Translation Rules

**Translate:** prose, headings, code comments, alt text, link labels.

**Never translate:** code keywords (`class`, `modded`, `override`, `void`, `int`), class names (`PlayerBase`, `EntityAI`), method names (`GetPosition()`), file names (`config.cpp`), config syntax (`CfgPatches`, `requiredAddons[]`), path prefixes (`$profile:`), tool names (Addon Builder, Workbench).

Internal links in translations must point to the correct language folder.

### When Adding/Editing Chapters

Update these when adding a new chapter:
1. Root `README.md` — chapter in the Part table
2. `<lang>/README.md` — language-specific table of contents
3. Previous/Next navigation links in adjacent chapters
4. `.vitepress/config.mts` — sidebar `sidebar(lang)` items array

One topic per PR. Reference vanilla script files or tested in-game behavior when correcting API signatures.

### Writing Style

- Second person ("you"), present tense
- Plain English; DayZ jargon only when necessary
- ATX headings only (`#`, `##`, `###`)
- `---` horizontal rules between major sections
- One `#` heading per file
- **Bold** for UI elements and file names in prose; `` `code` `` for class names, methods, paths
- Ordered lists for sequential steps; unordered (`-`) for non-sequential items
