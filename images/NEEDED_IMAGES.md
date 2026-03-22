# Images Needed for DayZ Modding Wiki

This file lists all pages that would benefit from screenshots, diagrams, or visual assets.
Place images in this `images/` directory with descriptive names.

---

## CRITICAL PRIORITY (High visual impact)

### Workbench & DayZ Tools
| Image | For Chapter | Description |
|-------|-------------|-------------|
| `workbench-main-window.png` | 4.7 Workbench Guide | Main Workbench IDE window showing code editor, output, resource browser |
| `workbench-debugger.png` | 4.7 Workbench Guide | Debugger view with breakpoint hit, variable inspection, call stack |
| `workbench-console.png` | 4.7 Workbench Guide | Script console with command execution |
| `workbench-layout-preview.png` | 4.7 Workbench Guide | Layout file preview showing widget tree |
| `addon-builder-gui.png` | 4.6 PBO Packing | Addon Builder GUI with fields filled |
| `texview2-conversion.png` | 4.1 Textures | TexView2 converting TGA to PAA |
| `object-builder-lod.png` | 4.2 Models | Object Builder showing LOD hierarchy |
| `dayz-tools-launcher.png` | 4.5 DayZ Tools | DayZ Tools main launcher window |
| `p-drive-structure.png` | 4.5 DayZ Tools | P: drive folder structure in Explorer |

### Diag Menu
| Image | For Chapter | Description |
|-------|-------------|-------------|
| `diag-menu-main.png` | 8.13 Diag Menu | Main diagnostic menu (Win+Alt) |
| `diag-menu-fps.png` | 8.13 Diag Menu | FPS counter and profiler display |
| `diag-menu-free-camera.png` | 8.13 Diag Menu | Free camera mode in action |
| `diag-menu-ce-tools.png` | 8.13 Diag Menu | Central Economy loot spawn tools |

---

## HIGH PRIORITY (Significantly useful)

### In-Game UI Examples
| Image | For Chapter | Description |
|-------|-------------|-------------|
| `example-hud-overlay.png` | 8.8 HUD Overlay | Example HUD showing server info overlay |
| `example-admin-panel.png` | 8.3 Admin Panel | Admin panel UI with player list |
| `example-trading-menu.png` | 8.12 Trading System | Shop menu with categories and items |
| `example-dialog-confirm.png` | 3.8 Dialogs | Confirmation dialog example |
| `example-notification.png` | 6.6 Notifications | In-game notification toast |

### Game World Visuals
| Image | For Chapter | Description |
|-------|-------------|-------------|
| `construction-stages.png` | 6.17 Construction | Building progression (foundation -> walls -> roof) |
| `contaminated-zone.png` | 6.23 World Systems | Contaminated area with gas particles |
| `vehicle-damage-zones.png` | 6.2 Vehicles | Vehicle showing visible damage on parts |
| `zombie-types.png` | 6.21 Zombie AI | Different zombie variants (military, civilian, crawler) |

### 3D Modeling
| Image | For Chapter | Description |
|-------|-------------|-------------|
| `model-lod-comparison.png` | 4.2 Models | Side-by-side LOD 0 vs LOD 3 quality |
| `door-axis-setup.png` | 4.8 Building Modeling | Object Builder showing door rotation axis |
| `ladder-memory-points.png` | 4.8 Building Modeling | Memory LOD with ladder vertices labeled |
| `named-selections.png` | 4.2 Models | Object Builder named selections panel |
| `texture-suffix-example.png` | 4.1 Textures | _co, _nohq, _smdi textures side by side |

---

## MEDIUM PRIORITY (Adds clarity)

### Layout & Widget System
| Image | For Chapter | Description |
|-------|-------------|-------------|
| `layout-sizing-modes.png` | 3.3 Sizing | Proportional vs pixel sizing comparison |
| `container-types-visual.png` | 3.4 Containers | WrapSpacer vs GridSpacer vs ScrollWidget visual |
| `widget-alignment-grid.png` | 3.3 Sizing | 9-point alignment reference visual |
| `richtext-formatting.png` | 3.10 Advanced Widgets | RichTextWidget with inline images and colors |
| `canvas-esp-overlay.png` | 3.10 Advanced Widgets | CanvasWidget ESP drawing example |
| `map-markers.png` | 3.10 Advanced Widgets | MapWidget with custom markers |

### Config & Economy
| Image | For Chapter | Description |
|-------|-------------|-------------|
| `types-xml-annotated.png` | 5.5 Server Configs | types.xml entry with labeled fields |
| `spawn-gear-result.png` | 5.6 Spawning Gear | Player spawned with custom loadout |
| `stringtable-editor.png` | 5.1 Stringtable | Spreadsheet view of stringtable.csv |

### Mod Structure
| Image | For Chapter | Description |
|-------|-------------|-------------|
| `mod-folder-tree.png` | 2.5 File Organization | Complete mod folder structure in Explorer |
| `steam-workshop-page.png` | 8.7 Publishing | Example Steam Workshop mod page |
| `launcher-mod-list.png` | 8.7 Publishing | DayZ Launcher showing installed mods |

---

## LOW PRIORITY (Polish)

| Image | For Chapter | Description |
|-------|-------------|-------------|
| `color-palette-dayz.png` | 3.7 Styles & Fonts | DayZ UI color palette swatches |
| `font-comparison.png` | 3.7 Styles & Fonts | Metron vs Metron-Bold vs SDF fonts |
| `particle-fire-types.png` | 6.20 Particles | Fire particle variants comparison |
| `weather-phenomenon.png` | 6.3 Weather | Weather transition over time |
| `action-progress-bar.png` | 6.12 Action System | Continuous action progress bar |
| `player-damage-zones.png` | 6.14 Player System | Player body with damage zone labels |
| `keyboard-keybinds.png` | 5.2 Inputs.xml | QWERTY keyboard with common keybinds |
| `vehicle-mod-result.png` | 8.10 Vehicle Mod | Custom vehicle in-game |
| `clothing-mod-result.png` | 8.11 Clothing Mod | Custom jacket on player |

---

## Summary

| Priority | Images Needed | Impact |
|----------|--------------|--------|
| Critical | 13 | Essential for tool documentation |
| High | 12 | Major clarity improvement |
| Medium | 12 | Good visual support |
| Low | 9 | Polish and completeness |
| **Total** | **46** | — |

## Image Guidelines

- **Format:** PNG preferred, JPG for screenshots
- **Resolution:** 1920x1080 for screenshots, 800x600 minimum for diagrams
- **Naming:** `kebab-case-descriptive-name.png`
- **Size:** Optimize to < 500KB per image
- **Alt text:** Always provide descriptive alt text in markdown: `![Description](../images/filename.png)`
