# Chapter 4.1: Textures (.paa, .edds, .tga)

[Home](../README.md) | **Textures** | [Next: 3D Models >>](02-models.md)

---

## Introduction

Every surface you see in DayZ -- weapon skins, clothing, terrain, UI icons -- is defined by texture files. The engine uses a proprietary compressed format called **PAA** at runtime, but during development you work with several source formats that are converted during the build process. Understanding these formats, the naming conventions that bind them to materials, and the resolution rules the engine enforces is fundamental to creating visual content for DayZ mods.

This chapter covers every texture format you will encounter, the suffix naming system that tells the engine how to interpret each texture, resolution and alpha channel requirements, and the practical workflow for converting between formats.

---

## Table of Contents

- [Texture Formats Overview](#texture-formats-overview)
- [PAA Format](#paa-format)
- [EDDS Format](#edds-format)
- [TGA Format](#tga-format)
- [PNG Format](#png-format)
- [Texture Naming Conventions](#texture-naming-conventions)
- [Resolution Requirements](#resolution-requirements)
- [Alpha Channel Support](#alpha-channel-support)
- [Converting Between Formats](#converting-between-formats)
- [Texture Quality and Compression](#texture-quality-and-compression)
- [Real-World Examples](#real-world-examples)
- [Common Mistakes](#common-mistakes)
- [Best Practices](#best-practices)

---

## Texture Formats Overview

DayZ uses four texture formats at different stages of the development pipeline:

| Format | Extension | Role | Alpha Support | Used At |
|--------|-----------|------|---------------|---------|
| **PAA** | `.paa` | Runtime game format (compressed) | Yes | Final build, shipped in PBOs |
| **EDDS** | `.edds` | Editor/intermediate DDS variant | Yes | Object Builder preview, auto-converts |
| **TGA** | `.tga` | Uncompressed source artwork | Yes | Artist workspace, Photoshop/GIMP export |
| **PNG** | `.png` | Portable source format | Yes | UI textures, external tools |

The general workflow is: **Source (TGA/PNG) --> DayZ Tools conversion --> PAA (game-ready)**.

---

## PAA Format

**PAA** (PAcked Arma) is the native compressed texture format used by the Enfusion engine at runtime. Every texture that ships in a PBO must be in PAA format (or will be converted to it during binarization).

### Characteristics

- **Compressed:** Uses DXT1, DXT5, or ARGB8888 compression internally depending on alpha channel presence and quality settings.
- **Mipmapped:** PAA files contain a full mipmap chain, generated automatically during conversion. This is critical for rendering performance -- the engine selects the appropriate mip level based on distance.
- **Power-of-two dimensions:** The engine requires PAA textures to have dimensions that are powers of 2 (256, 512, 1024, 2048, 4096).
- **Read-only at runtime:** The engine loads PAA files directly from PBOs. You never edit a PAA file -- you edit the source and re-convert.

### Internal Compression Types

| Type | Alpha | Quality | Use Case |
|------|-------|---------|----------|
| **DXT1** | No (1-bit) | Good, 6:1 ratio | Opaque textures, terrain |
| **DXT5** | Full 8-bit | Good, 4:1 ratio | Textures with smooth alpha (glass, foliage) |
| **ARGB4444** | Full 4-bit | Medium | UI textures, small icons |
| **ARGB8888** | Full 8-bit | Lossless | Debug, highest quality (large file size) |
| **AI88** | Grayscale + alpha | Good | Normal maps, grayscale masks |

### When You See PAA Files

- Inside unpacked vanilla game data (`dta/` and addon PBOs)
- As the output of TexView2 conversion
- As the output of Binarize when processing source textures
- In your mod's final PBO after building

---

## EDDS Format

**EDDS** is an intermediate texture format used primarily by DayZ's **Object Builder** and the editor tools. It is essentially a variant of the standard DirectDraw Surface (DDS) format with engine-specific metadata.

### Characteristics

- **Preview format:** Object Builder can display EDDS textures directly, making them useful during model creation.
- **Auto-converts to PAA:** When you run Binarize or AddonBuilder (without `-packonly`), EDDS files in your source tree are automatically converted to PAA.
- **Larger than PAA:** EDDS files are not optimized for distribution -- they exist for editor convenience.
- **DayZ-Samples format:** The official DayZ-Samples provided by Bohemia use EDDS textures extensively.

### Workflow with EDDS

```
Artist creates TGA/PNG source
    --> Photoshop DDS plugin exports EDDS for preview
        --> Object Builder displays EDDS on model
            --> Binarize converts EDDS to PAA for PBO
```

> **Tip:** You can skip EDDS entirely if you prefer. Convert your source textures directly to PAA using TexView2 and reference the PAA paths in your materials. EDDS is a convenience, not a requirement.

---

## TGA Format

**TGA** (Truevision TGA / Targa) is the traditional uncompressed source format for DayZ texture work. Many vanilla DayZ textures were originally authored as TGA files.

### Characteristics

- **Uncompressed:** No quality loss, full color depth (24-bit or 32-bit with alpha).
- **Large file sizes:** A 2048x2048 TGA with alpha is approximately 16 MB.
- **Alpha in dedicated channel:** TGA supports a proper 8-bit alpha channel (32-bit TGA), which maps directly to transparency in PAA.
- **TexView2 compatible:** TexView2 can open TGA files directly and convert them to PAA.

### When to Use TGA

- As your master source file for textures you author from scratch.
- When exporting from Substance Painter or Photoshop for DayZ.
- When the DayZ-Samples documentation or community tutorials specify TGA as the source format.

### TGA Export Settings

When exporting TGA for DayZ conversion:

- **Bit depth:** 32-bit (if alpha is needed) or 24-bit (opaque textures)
- **Compression:** None (uncompressed)
- **Orientation:** Bottom-left origin (standard TGA orientation)
- **Resolution:** Must be power of 2 (see [Resolution Requirements](#resolution-requirements))

---

## PNG Format

**PNG** (Portable Network Graphics) is widely supported and can be used as an alternative source format, particularly for UI textures.

### Characteristics

- **Lossless compression:** Smaller than TGA but retains full quality.
- **Full alpha channel:** 32-bit PNG supports 8-bit alpha.
- **TexView2 compatible:** TexView2 can open and convert PNG to PAA.
- **UI-friendly:** Many UI imagesets and icons in mods use PNG as their source format.

### When to Use PNG

- **UI textures and icons:** PNG is the practical choice for imagesets and HUD elements.
- **Simple retextures:** When you only need a color/diffuse map with no complex alpha.
- **Cross-tool workflows:** PNG is universally supported across image editors, web tools, and scripts.

> **Note:** PNG is not an official Bohemia source format -- they prefer TGA. However, the conversion tools handle PNG without issues and many modders use it successfully.

---

## Texture Naming Conventions

DayZ uses a strict suffix system to identify the role of each texture. The engine and materials reference textures by filename, and the suffix tells both the engine and other modders what type of data the texture contains.

### Required Suffixes

| Suffix | Full Name | Purpose | Typical Format |
|--------|-----------|---------|----------------|
| `_co` | **Color / Diffuse** | The base color (albedo) of a surface | RGB, optional alpha |
| `_nohq` | **Normal Map (High Quality)** | Surface detail normals, defines bumps and grooves | RGB (tangent-space normal) |
| `_smdi` | **Specular / Metallic / Detail Index** | Controls shininess and metallic properties | RGB channels encode separate data |
| `_ca` | **Color with Alpha** | Color texture where the alpha channel carries meaningful data (transparency, mask) | RGBA |
| `_as` | **Ambient Shadow** | Ambient occlusion / shadow bake | Grayscale |
| `_mc` | **Macro** | Large-scale color variation visible at distance | RGB |
| `_li` | **Light / Emissive** | Self-illumination map (glowing parts) | RGB |
| `_no` | **Normal Map (Standard)** | Lower quality normal map variant | RGB |
| `_mca` | **Macro with Alpha** | Macro texture with alpha channel | RGBA |
| `_de` | **Detail** | Tiling detail texture for close-up surface variation | RGB |

### Naming Convention in Practice

A single item typically has multiple textures, all sharing a base name:

```
data/
  my_rifle_co.paa          <-- Base color (what you see)
  my_rifle_nohq.paa        <-- Normal map (surface bumps)
  my_rifle_smdi.paa         <-- Specular/metallic (shininess)
  my_rifle_as.paa           <-- Ambient shadow (baked AO)
  my_rifle_ca.paa           <-- Color with alpha (if transparency needed)
```

### The _smdi Channels

The specular/metallic/detail texture packs three data streams into one RGB image:

| Channel | Data | Range | Effect |
|---------|------|-------|--------|
| **R** | Metallic | 0-255 | 0 = non-metal, 255 = full metal |
| **G** | Roughness (inverted specular) | 0-255 | 0 = rough/matte, 255 = smooth/glossy |
| **B** | Detail index / AO | 0-255 | Detail tiling or ambient occlusion |

### The _nohq Channels

Normal maps in DayZ use tangent-space encoding:

| Channel | Data |
|---------|------|
| **R** | X-axis normal (left-right) |
| **G** | Y-axis normal (up-down) |
| **B** | Z-axis normal (toward viewer) |
| **A** | Specular power (optional, depends on material) |

---

## Resolution Requirements

The Enfusion engine requires all textures to have **power-of-two dimensions**. Both width and height must independently be a power of 2, but they do not have to be equal (non-square textures are valid).

### Valid Dimensions

| Size | Typical Use |
|------|-------------|
| **64x64** | Tiny icons, UI elements |
| **128x128** | Small icons, inventory thumbnails |
| **256x256** | UI panels, small item textures |
| **512x512** | Standard item textures, clothing |
| **1024x1024** | Weapons, detailed clothing, vehicle parts |
| **2048x2048** | High-detail weapons, character models |
| **4096x4096** | Terrain textures, large vehicle textures |

### Non-Square Textures

Non-square power-of-two textures are valid:

```
256x512    -- Valid (both are powers of 2)
512x1024   -- Valid
1024x2048  -- Valid
300x512    -- INVALID (300 is not a power of 2)
```

### Resolution Guidelines

- **Weapons:** 2048x2048 for the main body, 1024x1024 for attachments.
- **Clothing:** 1024x1024 or 2048x2048 depending on surface area coverage.
- **UI icons:** 128x128 or 256x256 for inventory icons, 64x64 for HUD elements.
- **Terrain:** 4096x4096 for satellite maps, 512x512 or 1024x1024 for material tiles.
- **Normal maps:** Same resolution as the corresponding color texture.
- **SMDI maps:** Same resolution as the corresponding color texture.

> **Warning:** If a texture has non-power-of-two dimensions, the engine will either refuse to load it or display a magenta error texture. TexView2 will show a warning during conversion.

---

## Alpha Channel Support

The alpha channel in a texture carries additional data beyond color. How it is interpreted depends on the texture suffix and the material shader.

### Alpha Channel Roles

| Suffix | Alpha Interpretation |
|--------|---------------------|
| `_co` | Usually unused; if present, may define transparency for simple materials |
| `_ca` | Transparency mask (0 = fully transparent, 255 = fully opaque) |
| `_nohq` | Specular power map (higher = sharper specular highlight) |
| `_smdi` | Usually unused |
| `_li` | Emissive intensity mask |

### Creating Textures with Alpha

In your image editor (Photoshop, GIMP, Krita):

1. Create the RGB content as normal.
2. Add an alpha channel.
3. Paint white (255) where you want full opacity/effect, black (0) where you want none.
4. Export as 32-bit TGA or PNG.
5. Convert to PAA using TexView2 -- it will detect the alpha channel automatically.

### Verifying Alpha in TexView2

Open the PAA in TexView2 and use the channel display buttons:

- **RGBA** -- Shows the final composite
- **RGB** -- Shows color only
- **A** -- Shows alpha channel only (white = opaque, black = transparent)

---

## Converting Between Formats

### TexView2 (Primary Tool)

**TexView2** is included with DayZ Tools and is the standard texture conversion utility.

**Opening a file:**
1. Launch TexView2 from DayZ Tools or directly from `DayZ Tools\Bin\TexView2\TexView2.exe`.
2. Open your source file (TGA, PNG, or EDDS).
3. Verify the image looks correct and check dimensions.

**Converting to PAA:**
1. Open the source texture in TexView2.
2. Go to **File --> Save As**.
3. Select **PAA** as the output format.
4. Choose the compression type:
   - **DXT1** for opaque textures (no alpha needed)
   - **DXT5** for textures with alpha transparency
   - **ARGB4444** for small UI textures where file size matters
5. Click **Save**.

**Batch conversion via command line:**

```bash
# Convert a single TGA to PAA
"P:\DayZ Tools\Bin\TexView2\TexView2.exe" -i "source.tga" -o "output.paa"

# TexView2 will auto-select compression based on alpha channel presence
```

### Binarize (Automated)

When Binarize processes your mod's source directory, it automatically converts all recognized texture formats (TGA, PNG, EDDS) to PAA. This happens as part of the AddonBuilder pipeline.

**Binarize conversion flow:**
```
source/mod_name/data/texture_co.tga
    --> Binarize detects TGA
        --> Converts to PAA with automatic compression selection
            --> Output: build/mod_name/data/texture_co.paa
```

### Manual Conversion Table

| From | To | Tool | Notes |
|------|----|------|-------|
| TGA --> PAA | TexView2 | Standard workflow |
| PNG --> PAA | TexView2 | Works identically to TGA |
| EDDS --> PAA | TexView2 or Binarize | Automatic during build |
| PAA --> TGA | TexView2 (Save As TGA) | For editing existing textures |
| PAA --> PNG | TexView2 (Save As PNG) | For extracting to portable format |
| PSD --> TGA/PNG | Photoshop/GIMP | Export from editor, then convert |

---

## Texture Quality and Compression

### Compression Type Selection

| Scenario | Recommended Compression | Reason |
|----------|------------------------|--------|
| Opaque diffuse (`_co`) | DXT1 | Best ratio, no alpha needed |
| Transparent diffuse (`_ca`) | DXT5 | Full alpha support |
| Normal maps (`_nohq`) | DXT5 | Alpha channel carries specular power |
| Specular maps (`_smdi`) | DXT1 | Usually opaque, RGB channels only |
| UI textures | ARGB4444 or DXT5 | Small size, clean edges |
| Emissive maps (`_li`) | DXT1 or DXT5 | DXT5 if alpha carries intensity |

### Quality vs. File Size

```
Format        2048x2048 approx. size
-----------------------------------------
ARGB8888      16.0 MB    (uncompressed)
DXT5           5.3 MB    (4:1 compression)
DXT1           2.7 MB    (6:1 compression)
ARGB4444       8.0 MB    (2:1 compression)
```

### In-Game Quality Settings

Players can adjust texture quality in DayZ's video settings. The engine selects lower mip levels when quality is reduced, so your textures will look progressively blurrier at lower settings. This is automatic -- you do not need to create separate quality levels.

---

## Real-World Examples

### Weapon Texture Set

A typical weapon mod contains these texture files:

```
MyMod_Weapons/data/weapons/m4a1/
  my_weapon_co.paa           <-- 2048x2048, DXT1, base color
  my_weapon_nohq.paa         <-- 2048x2048, DXT5, normal map
  my_weapon_smdi.paa          <-- 2048x2048, DXT1, specular/metallic
  my_weapon_as.paa            <-- 1024x1024, DXT1, ambient shadow
```

The material file (`.rvmat`) references these textures and assigns them to shader stages.

### UI Texture (Imageset Source)

```
MyFramework/data/gui/icons/
  my_icons_co.paa           <-- 512x512, ARGB4444, sprite atlas
```

UI textures are often packed into a single atlas (imageset) and referenced by name in layout files. ARGB4444 compression is common for UI because it preserves clean edges while keeping file sizes small.

### Terrain Textures

```
terrain/
  grass_green_co.paa         <-- 1024x1024, DXT1, tiling color
  grass_green_nohq.paa       <-- 1024x1024, DXT5, tiling normal
  grass_green_smdi.paa        <-- 1024x1024, DXT1, tiling specular
  grass_green_mc.paa          <-- 512x512, DXT1, macro variation
  grass_green_de.paa          <-- 512x512, DXT1, detail tiling
```

Terrain textures tile across the landscape. The `_mc` macro texture adds large-scale color variation to prevent repetition.

---

## Common Mistakes

### 1. Non-Power-of-Two Dimensions

**Symptom:** Magenta texture in-game, TexView2 warnings.
**Fix:** Resize your source to the nearest power of 2 before converting.

### 2. Missing Suffix

**Symptom:** Material cannot find the texture, or it renders incorrectly.
**Fix:** Always include the proper suffix (`_co`, `_nohq`, etc.) in the filename.

### 3. Wrong Compression for Alpha

**Symptom:** Transparency looks blocky or binary (on/off with no gradient).
**Fix:** Use DXT5 instead of DXT1 for textures that need smooth alpha gradients.

### 4. Forgetting Mipmaps

**Symptom:** Texture looks fine up close but shimmers/sparkles at distance.
**Fix:** PAA files generated by TexView2 automatically include mipmaps. If you are using a non-standard tool, ensure mipmap generation is enabled.

### 5. Incorrect Normal Map Format

**Symptom:** Lighting on the model looks inverted or flat.
**Fix:** Ensure your normal map is in tangent-space format with DirectX-style Y-axis convention (green channel: up = lighter). Some tools export OpenGL-style (inverted Y) -- you need to invert the green channel.

### 6. Path Mismatch After Conversion

**Symptom:** Model or material shows magenta because it references a `.tga` path but the PBO contains `.paa`.
**Fix:** Materials should reference the final `.paa` path. Binarize handles path remapping automatically, but if you pack with `-packonly` (no binarization), you must ensure the paths match exactly.

---

## Best Practices

1. **Keep source files in version control.** Store TGA/PNG masters alongside your mod. The PAA files are generated output -- the sources are what matter.

2. **Match resolution to importance.** A rifle the player stares at for hours deserves 2048x2048. A can of beans in the back of a shelf can use 512x512.

3. **Always provide a normal map.** Even a flat normal map (128, 128, 255 solid fill) is better than none -- missing normal maps cause material errors.

4. **Name consistently.** One base name, multiple suffixes: `myitem_co.paa`, `myitem_nohq.paa`, `myitem_smdi.paa`. Never mix naming schemes.

5. **Preview in TexView2 before building.** Open your PAA output and verify it looks correct. Check each channel individually.

6. **Use DXT1 by default, DXT5 only when alpha is needed.** DXT1 is half the file size of DXT5 and looks identical for opaque textures.

7. **Test at low quality settings.** What looks great at Ultra may be unreadable at Low because the engine drops mip levels aggressively.

---

## Observed in Real Mods

| Pattern | Mod | Detail |
|---------|-----|--------|
| Atlas `_co` textures for icon grids | Colorful UI | Packs multiple UI icons into a single 512x512 `_co.paa` atlas referenced by imagesets |
| Market icon sprite sheets | Expansion Market | Uses large atlas PAA textures with dozens of item thumbnails for the trader UI |
| hiddenSelections retexture without new P3D | DayZ-Samples (Test_ClothingRetexture) | Swaps `_co.paa` via `hiddenSelectionsTextures[]` to create color variants from one model |
| ARGB4444 for small HUD elements | VPP Admin Tools | Uses ARGB4444-compressed 64x64 PAA files for toolbar and panel icons to minimize file size |

---

## Compatibility & Impact

- **Multi-Mod:** Texture path collisions are rare because each mod uses its own PBO prefix, but two mods retexturing the same vanilla item via `hiddenSelectionsTextures[]` will conflict -- last loaded wins.
- **Performance:** A single 4096x4096 DXT5 texture uses ~21 MB of GPU memory with mipmaps. Overuse of large textures across many mod items can exhaust VRAM on lower-end hardware. Prefer 1024 or 2048 for most items.
- **Version:** The PAA format and TexView2 pipeline have been stable since DayZ 1.0. No breaking changes have occurred between DayZ versions.

---

## Navigation

| Previous | Up | Next |
|----------|----|------|
| [Part 3: GUI System](../03-gui-system/07-styles-fonts.md) | [Part 4: File Formats & DayZ Tools](../04-file-formats/01-textures.md) | [4.2 3D Models](02-models.md) |
