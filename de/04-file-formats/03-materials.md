# Chapter 4.3: Materials (.rvmat)

[Home](../../README.md) | [<< Previous: 3D Models](02-models.md) | **Materials** | [Next: Audio >>](04-audio.md)

---

## Einführung

A material in DayZ is the bridge between a 3D model and its visual appearance. While textures provide raw image data, the **RVMAT** (Real Virtuality Material) file defines how those textures are combined, which shader interprets them, and what surface properties the engine should simulate -- shininess, transparency, self-illumination, and more. Every face on every P3D model in the game references an RVMAT file, and understanding how to create and configure them is essential for any visual mod.

This chapter covers the RVMAT file format, shader types, texture stage configuration, material properties, the damage-level material swap system, and practical examples drawn from DayZ-Samples.

---

## Inhaltsverzeichnis

- [RVMAT Format Overview](#rvmat-format-overview)
- [File Structure](#file-structure)
- [Shader Types](#shader-types)
- [Texture Stages](#texture-stages)
- [Material Properties](#material-properties)
- [Health Levels (Damage Material Swaps)](#health-levels-damage-material-swaps)
- [How Materials Reference Textures](#how-materials-reference-textures)
- [Creating an RVMAT from Scratch](#creating-an-rvmat-from-scratch)
- [Real Examples](#real-examples)
- [Common Mistakes](#common-mistakes)
- [Best Practices](#best-practices)

---

## RVMAT Format Overview

An **RVMAT** file is a text-based configuration file (not binary) that defines a material. Despite the custom extension, the format is plain text using Bohemia's config-style syntax with classes and key-value pairs.

### Key Characteristics

- **Text format:** Editable in any text editor (Notepad++, VS Code).
- **Shader binding:** Each RVMAT specifies which rendering shader to use.
- **Texture mapping:** Defines which texture files are assigned to which shader inputs (diffuse, normal, specular, etc.).
- **Surface properties:** Controls specular intensity, emissive glow, transparency, and more.
- **Referenced by P3D models:** Faces in Object Builder's Resolution LOD are assigned an RVMAT. The engine loads the RVMAT and all textures it references.
- **Referenced by config.cpp:** `hiddenSelectionsMaterials[]` can override materials at runtime.

### Path Convention

RVMAT files live alongside their textures, typically in a `data/` directory:

```
MyMod/
  data/
    my_item.rvmat              <-- Material definition
    my_item_co.paa             <-- Diffuse texture (referenced by the RVMAT)
    my_item_nohq.paa           <-- Normal map (referenced by the RVMAT)
    my_item_smdi.paa           <-- Specular map (referenced by the RVMAT)
```

---

## File Structure

An RVMAT file has a consistent structure. Here is a complete, annotated example:

```cpp
ambient[] = {1.0, 1.0, 1.0, 1.0};        // Ambient color multiplier (RGBA)
diffuse[] = {1.0, 1.0, 1.0, 1.0};        // Diffuse color multiplier (RGBA)
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};  // Additive diffuse override
emmisive[] = {0.0, 0.0, 0.0, 0.0};       // Emissive (self-illumination) color
specular[] = {0.7, 0.7, 0.7, 1.0};       // Specular highlight color
specularPower = 80;                        // Specular sharpness (higher = tighter highlight)
PixelShaderID = "Super";                   // Shader program to use
VertexShaderID = "Super";                  // Vertex shader program

class Stage1                               // Texture stage: Normal map
{
    texture = "MyMod\data\my_item_nohq.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage2                               // Texture stage: Diffuse/Color map
{
    texture = "MyMod\data\my_item_co.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage3                               // Texture stage: Specular/Metallic map
{
    texture = "MyMod\data\my_item_smdi.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};
```

### Top-Level Properties

These are declared before the Stage classes and control the material's overall behavior:

| Property | Type | Description |
|----------|------|-------------|
| `ambient[]` | float[4] | Ambient light color multiplier. `{1,1,1,1}` = full, `{0,0,0,0}` = no ambient. |
| `diffuse[]` | float[4] | Diffuse light color multiplier. Usually `{1,1,1,1}`. |
| `forcedDiffuse[]` | float[4] | Additive override to diffuse. Usually `{0,0,0,0}`. |
| `emmisive[]` | float[4] | Self-illumination color. Non-zero values make the surface glow. Note: Bohemia uses the misspelling `emmisive`, not `emissive`. |
| `specular[]` | float[4] | Specular highlight color and intensity. |
| `specularPower` | float | Sharpness of specular highlights. Range 1-200. Higher = tighter, more focused reflection. |
| `PixelShaderID` | string | Name of the pixel shader program. |
| `VertexShaderID` | string | Name of the vertex shader program. |

---

## Shader Types

The `PixelShaderID` and `VertexShaderID` values determine which rendering pipeline processes the material. Both should usually be set to the same value.

### Available Shaders

| Shader | Use Case | Texture Stages Required |
|--------|----------|------------------------|
| **Super** | Standard opaque surfaces (weapons, clothing, items) | Normal, Diffuse, Specular/Metallic |
| **Multi** | Multi-layered terrain and complex surfaces | Multiple diffuse/normal pairs |
| **Glass** | Transparent and semi-transparent surfaces | Diffuse with alpha |
| **Water** | Water surfaces with reflection and refraction | Special water textures |
| **Terrain** | Terrain ground surfaces | Satellite, mask, material layers |
| **NormalMap** | Simplified normal-mapped surface | Normal, Diffuse |
| **NormalMapSpecular** | Normal-mapped with specular | Normal, Diffuse, Specular |
| **Hair** | Character hair rendering | Diffuse with alpha, special translucency |
| **Skin** | Character skin with subsurface scattering | Diffuse, Normal, Specular |
| **AlphaTest** | Hard-edge transparency (foliage, fences) | Diffuse with alpha |
| **AlphaBlend** | Smooth transparency (glass, smoke) | Diffuse with alpha |

### Super Shader (Most Common)

The **Super** shader is the standard physically-based rendering shader used for the vast majority of items in DayZ. It expects three texture stages:

```
Stage1 = Normal map (_nohq)
Stage2 = Diffuse/Color map (_co)
Stage3 = Specular/Metallic map (_smdi)
```

If you are creating a mod item (weapon, clothing, tool, container), you will almost always use the Super shader.

### Glass Shader

The **Glass** shader handles transparent surfaces. It reads alpha from the diffuse texture to determine transparency:

```cpp
PixelShaderID = "Glass";
VertexShaderID = "Glass";

class Stage1
{
    texture = "MyMod\data\glass_nohq.paa";
    uvSource = "tex";
    class uvTransform { /* ... */ };
};

class Stage2
{
    texture = "MyMod\data\glass_ca.paa";    // Note: _ca suffix for color+alpha
    uvSource = "tex";
    class uvTransform { /* ... */ };
};
```

---

## Texture Stages

Each `Stage` class in the RVMAT assigns a texture to a specific shader input. The stage number determines what role the texture plays.

### Stage Assignments for the Super Shader

| Stage | Texture Role | Typical Suffix | Description |
|-------|-------------|----------------|-------------|
| **Stage1** | Normal map | `_nohq` | Surface detail, bumps, grooves |
| **Stage2** | Diffuse / Color map | `_co` or `_ca` | Base color of the surface |
| **Stage3** | Specular / Metallic map | `_smdi` | Shininess, metallic properties, detail |
| **Stage4** | Ambient Shadow | `_as` | Pre-baked ambient occlusion (optional) |
| **Stage5** | Macro map | `_mc` | Large-scale color variation (optional) |
| **Stage6** | Detail map | `_de` | Tiling micro-detail (optional) |
| **Stage7** | Emissive / Light map | `_li` | Self-illumination (optional) |

### Stage Properties

Each stage contains:

```cpp
class Stage1
{
    texture = "path\to\texture.paa";    // Path relative to P: drive
    uvSource = "tex";                    // UV source: "tex" (model UVs) or "tex1" (2nd UV set)
    class uvTransform                    // UV transformation matrix
    {
        aside[] = {1.0, 0.0, 0.0};     // U-axis scale and direction
        up[] = {0.0, 1.0, 0.0};        // V-axis scale and direction
        dir[] = {0.0, 0.0, 0.0};       // Not typically used
        pos[] = {0.0, 0.0, 0.0};       // UV offset (translation)
    };
};
```

### UV Transform for Tiling

To tile a texture (repeat it across a surface), modify the `aside` and `up` values:

```cpp
class uvTransform
{
    aside[] = {4.0, 0.0, 0.0};     // Tile 4x horizontally
    up[] = {0.0, 4.0, 0.0};        // Tile 4x vertically
    dir[] = {0.0, 0.0, 0.0};
    pos[] = {0.0, 0.0, 0.0};
};
```

This is commonly used for terrain materials and building surfaces where the same detail texture repeats.

---

## Material Properties

### Specular Control

The `specular[]` and `specularPower` values work together to define how shiny a surface appears:

| Material Type | specular[] | specularPower | Appearance |
|---------------|-----------|---------------|------------|
| **Matte plastic** | `{0.1, 0.1, 0.1, 1.0}` | 10 | Dull, wide highlight |
| **Worn metal** | `{0.3, 0.3, 0.3, 1.0}` | 40 | Moderate shine |
| **Polished metal** | `{0.8, 0.8, 0.8, 1.0}` | 120 | Bright, tight highlight |
| **Chrome** | `{1.0, 1.0, 1.0, 1.0}` | 200 | Mirror-like reflection |
| **Rubber** | `{0.02, 0.02, 0.02, 1.0}` | 5 | Almost no highlight |
| **Wet surface** | `{0.6, 0.6, 0.6, 1.0}` | 80 | Slick, medium-sharp highlight |

### Emissive (Self-Illumination)

To make a surface glow (LED lights, screens, glowing elements):

```cpp
emmisive[] = {0.2, 0.8, 0.2, 1.0};   // Green glow
```

The emissive color is added to the final pixel color regardless of lighting. An `_li` emissive map in a later texture stage can mask which parts of the surface glow.

### Two-Sided Rendering

For thin surfaces that should be visible from both sides (flags, foliage, cloth):

```cpp
renderFlags[] = {"noZWrite", "noAlpha", "twoSided"};
```

This is not a top-level RVMAT property but is configured in config.cpp or through the material's shader settings depending on the use case.

---

## Health Levels (Damage Material Swaps)

DayZ items degrade over time. The engine supports automatic material swapping at different damage thresholds, defined in `config.cpp` using the `healthLevels[]` array. This creates the visual progression from pristine to ruined.

### healthLevels[] Structure

```cpp
class MyItem: Inventory_Base
{
    // ... other config ...

    healthLevels[] =
    {
        // {health_threshold, {"material_set"}},

        {1.0, {"MyMod\data\my_item.rvmat"}},           // Pristine (100% health)
        {0.7, {"MyMod\data\my_item_worn.rvmat"}},       // Worn (70% health)
        {0.5, {"MyMod\data\my_item_damaged.rvmat"}},     // Damaged (50% health)
        {0.3, {"MyMod\data\my_item_badly_damaged.rvmat"}},// Badly Damaged (30% health)
        {0.0, {"MyMod\data\my_item_ruined.rvmat"}}       // Ruined (0% health)
    };
};
```

### How It Works

1. The engine monitors the item's health value (0.0 to 1.0).
2. When health drops below a threshold, the engine swaps the material to the corresponding RVMAT.
3. Each RVMAT can reference different textures -- typically progressively more damaged-looking variants.
4. The swap is automatic. No script code is needed.

### Damage Texture Progression

A typical damage progression:

| Level | Health | Visual Change |
|-------|--------|---------------|
| **Pristine** | 1.0 | Clean, factory-new appearance |
| **Worn** | 0.7 | Slight scuffing, minor scratches |
| **Damaged** | 0.5 | Visible scratches, discoloration, dirt |
| **Badly Damaged** | 0.3 | Heavy wear, rust, cracks, peeling paint |
| **Ruined** | 0.0 | Severely degraded, broken appearance |

### Creating Damage Materials

For each damage level, create a separate RVMAT that references progressively more damaged textures:

```
data/
  my_item.rvmat                    --> my_item_co.paa (clean)
  my_item_worn.rvmat               --> my_item_worn_co.paa (light damage)
  my_item_damaged.rvmat            --> my_item_damaged_co.paa (moderate damage)
  my_item_badly_damaged.rvmat      --> my_item_badly_damaged_co.paa (heavy damage)
  my_item_ruined.rvmat             --> my_item_ruined_co.paa (destroyed)
```

> **Tip:** You do not always need unique textures for every damage level. A common optimization is to share the normal and specular maps across all levels and only change the diffuse texture:
>
> ```
> my_item.rvmat           --> my_item_co.paa
> my_item_worn.rvmat      --> my_item_co.paa  (same diffuse, lower specular)
> my_item_damaged.rvmat   --> my_item_damaged_co.paa
> my_item_ruined.rvmat    --> my_item_ruined_co.paa
> ```

### Using Vanilla Damage Materials

DayZ provides a set of generic damage overlay materials that can be used if you do not want to create custom damage textures:

```cpp
healthLevels[] =
{
    {1.0, {"MyMod\data\my_item.rvmat"}},
    {0.7, {"DZ\data\data\default_worn.rvmat"}},
    {0.5, {"DZ\data\data\default_damaged.rvmat"}},
    {0.3, {"DZ\data\data\default_badly_damaged.rvmat"}},
    {0.0, {"DZ\data\data\default_ruined.rvmat"}}
};
```

---

## How Materials Reference Textures

The connection between models, materials, and textures forms a chain:

```
P3D Model (Object Builder)
  |
  |--> Face assigned to RVMAT
         |
         |--> Stage1.texture = "path\to\normal_nohq.paa"
         |--> Stage2.texture = "path\to\color_co.paa"
         |--> Stage3.texture = "path\to\specular_smdi.paa"
```

### Path Resolution

All texture paths in RVMAT files are relative to the **P: drive** root:

```cpp
// Correct: relative to P: drive
texture = "MyMod\data\textures\my_item_co.paa";

// This means: P:\MyMod\data\textures\my_item_co.paa
```

When packed into a PBO, the path prefix must match the PBO's prefix:

```
PBO prefix: MyMod
Internal path: data\textures\my_item_co.paa
Full reference: MyMod\data\textures\my_item_co.paa
```

### hiddenSelectionsMaterials Override

Config.cpp can override which material is applied to a named selection at runtime:

```cpp
class MyItem_Green: MyItem
{
    hiddenSelections[] = {"camo"};
    hiddenSelectionsTextures[] = {"MyMod\data\my_item_green_co.paa"};
    hiddenSelectionsMaterials[] = {"MyMod\data\my_item_green.rvmat"};
};
```

This allows creating item variants (color schemes, camo patterns) that share the same P3D model but use different materials.

---

## Creating an RVMAT from Scratch

### Step-by-Step: Standard Opaque Item

1. **Create your texture files:**
   - `my_item_co.paa` (diffuse color)
   - `my_item_nohq.paa` (normal map)
   - `my_item_smdi.paa` (specular/metallic)

2. **Create the RVMAT file** (plain text):

```cpp
ambient[] = {1.0, 1.0, 1.0, 1.0};
diffuse[] = {1.0, 1.0, 1.0, 1.0};
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};
emmisive[] = {0.0, 0.0, 0.0, 0.0};
specular[] = {0.5, 0.5, 0.5, 1.0};
specularPower = 60;
PixelShaderID = "Super";
VertexShaderID = "Super";

class Stage1
{
    texture = "MyMod\data\my_item_nohq.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage2
{
    texture = "MyMod\data\my_item_co.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage3
{
    texture = "MyMod\data\my_item_smdi.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};
```

3. **Assign in Object Builder:**
   - Open your P3D model.
   - Select faces in the Resolution LOD.
   - Right-click --> **Face Properties**.
   - Browse to your RVMAT file.

4. **Test in-game** via file patching or PBO build.

---

## Praxisbeispiele

### DayZ-Samples Test_ClothingRetexture

The official DayZ-Samples include a `Test_ClothingRetexture` example that demonstrates the standard material workflow:

```cpp
// From DayZ-Samples retexture example
ambient[] = {1.0, 1.0, 1.0, 1.0};
diffuse[] = {1.0, 1.0, 1.0, 1.0};
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};
emmisive[] = {0.0, 0.0, 0.0, 0.0};
specular[] = {0.3, 0.3, 0.3, 1.0};
specularPower = 50;
PixelShaderID = "Super";
VertexShaderID = "Super";

class Stage1
{
    texture = "DZ_Samples\Test_ClothingRetexture\data\tshirt_nohq.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage2
{
    texture = "DZ_Samples\Test_ClothingRetexture\data\tshirt_co.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage3
{
    texture = "DZ_Samples\Test_ClothingRetexture\data\tshirt_smdi.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};
```

### Metallic Weapon Material

A polished weapon barrel with high metallic response:

```cpp
ambient[] = {1.0, 1.0, 1.0, 1.0};
diffuse[] = {1.0, 1.0, 1.0, 1.0};
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};
emmisive[] = {0.0, 0.0, 0.0, 0.0};
specular[] = {0.9, 0.9, 0.9, 1.0};        // High specular for metal
specularPower = 150;                        // Tight, focused highlight
PixelShaderID = "Super";
VertexShaderID = "Super";

// ... Stage definitions with weapon textures ...
```

### Emissive Material (Glowing Screen)

A material for a device screen that emits light:

```cpp
ambient[] = {1.0, 1.0, 1.0, 1.0};
diffuse[] = {1.0, 1.0, 1.0, 1.0};
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};
emmisive[] = {0.05, 0.3, 0.05, 1.0};      // Soft green glow
specular[] = {0.5, 0.5, 0.5, 1.0};
specularPower = 80;
PixelShaderID = "Super";
VertexShaderID = "Super";

// ... Stage definitions including _li emissive map in Stage7 ...
```

---

## Häufige Fehler

### 1. Wrong Stage Order

**Symptom:** Texture appears scrambled, normal map shows as color, color shows as bumps.
**Fix:** Ensure Stage1 = normal, Stage2 = diffuse, Stage3 = specular (for the Super shader).

### 2. Misspelling `emmisive`

**Symptom:** Emissive does not work.
**Fix:** Bohemia uses `emmisive` (double m, single s). Using the correct English spelling `emissive` will not work. This is a known historical quirk.

### 3. Texture Path Mismatch

**Symptom:** Model appears with default gray or magenta material.
**Fix:** Verify that texture paths in the RVMAT exactly match the file locations relative to P: drive. Paths use backslashes. Check capitalization -- some systems are case-sensitive.

### 4. Missing RVMAT Assignment in P3D

**Symptom:** Model renders with no material (flat gray or default shader).
**Fix:** Open the model in Object Builder, select faces, and assign the RVMAT via **Face Properties**.

### 5. Using Wrong Shader for Transparent Items

**Symptom:** Transparent texture appears opaque, or entire surface vanishes.
**Fix:** Use `Glass`, `AlphaTest`, or `AlphaBlend` shader instead of `Super` for transparent surfaces. Use `_ca` suffix textures with proper alpha channels.

---

## Best Practices

1. **Start from a working example.** Copy an RVMAT from DayZ-Samples or a vanilla item and modify it. Starting from scratch invites typos.

2. **Keep materials and textures together.** Store the RVMAT in the same `data/` directory as its textures. This makes the relationship obvious and simplifies path management.

3. **Use the Super shader unless you have a reason not to.** It handles 95% of use cases correctly.

4. **Create damage materials even for simple items.** Players notice when items do not visually degrade. At minimum, use vanilla default damage materials for the lower health levels.

5. **Test specular in-game, not just in Object Builder.** The editor lighting and in-game lighting produce very different results. What looks perfect in Object Builder may be too shiny or too dull under DayZ's dynamic lighting.

6. **Document your material settings.** When you find specular/power values that work well for a surface type, record them. You will reuse these settings across many items.

---

## Navigation

| Previous | Up | Next |
|----------|----|------|
| [4.2 3D Models](02-models.md) | [Part 4: File Formats & DayZ Tools](01-textures.md) | [4.4 Audio](04-audio.md) |
