# Chapter 5.4: ImageSet Format

> **Summary:** ImageSets define named sprite regions within a texture atlas. They are DayZ's primary mechanism for referencing icons, UI graphics, and sprite sheets from layout files and scripts. Instead of loading hundreds of individual image files, you pack all icons into a single texture and describe each icon's position and size in an imageset definition file.

---

## Содержание


- [Overview](#overview)
- [How ImageSets Work](#how-imagesets-work)
- [DayZ Native ImageSet Format](#dayz-native-imageset-format)
- [XML ImageSet Format](#xml-imageset-format)
- [Registering ImageSets in config.cpp](#registering-imagesets-in-configcpp)
- [Referencing Images in Layouts](#referencing-images-in-layouts)
- [Referencing Images in Scripts](#referencing-images-in-scripts)
- [Image Flags](#image-flags)
- [Multi-Resolution Текстуры](#multi-resolution-textures)
- [Creating Custom Icon Sets](#creating-custom-icon-sets)
- [Font Awesome Integration Pattern](#font-awesome-integration-pattern)
- [Real Examples](#real-examples)
- [Common Mistakes](#common-mistakes)

---

## Обзор


A texture atlas is a single large image (typically in `.edds` format) containing many smaller icons arranged in a grid or freeform layout. An imageset file maps human-readable names to rectangular regions within that atlas.

Например, a 1024x1024 texture might contain 64 icons at 64x64 pixels each. The imageset file says "the icon named `arrow_down` is at position (128, 64) and is 64x64 pixels." Your layout files and scripts reference `arrow_down` by name, and the engine extracts the correct sub-rectangle from the atlas at render time.

This approach is efficient: one GPU texture load serves all icons, reducing draw calls and memory overhead.

---

## How ImageSets Work

The data flow:

1. **Texture atlas** (`.edds` file) ----  single image containing all icons
2. **ImageSet definition** (`.imageset` file) --- maps names to regions in the atlas
3. **config.cpp registration** --- tells the engine to load the imageset at startup
4. **Layout/script reference** --- uses `set:name image:iconName` syntax to render a specific icon

Once registered, any widget in any layout file can reference any image from the set by name.

---

## DayZ Native ImageSet Format

The native format uses the Enfusion engine's class-based syntax (similar to config.cpp). Это format used by the vanilla game and most established mods.

### Structure

```
ImageSetClass {
 Name "my_icons"
 RefSize 1024 1024
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "MyMod/GUI/imagesets/my_icons.edds"
  }
 }
 Images {
  ImageSetDefClass icon_name {
   Name "icon_name"
   Pos 0 0
   Size 64 64
   Flags 0
  }
 }
}
```

### Top-Level Fields

| Field | Description |
|-------|-------------|
| `Name` | The set name. Used in the `set:` part of image references. Must be unique across all loaded mods. |
| `RefSize` | Reference dimensions of the texture (width height). Used for coordinate mapping. |
| `Текстуры` | Contains one or more `ImageSetTextureClass` entries for different resolution mip levels. |

### Texture Entry Fields

| Field | Description |
|-------|-------------|
| `mpix` | Minimum pixel level (mip level). `0` = lowest resolution, `1` = standard resolution. |
| `path` | Path to the `.edds` texture file, relative to the mod root. Can use Enfusion GUID format (`{GUID}path`) or plain relative paths. |

### Image Entry Fields

Each image is an `ImageSetDefClass` inside the `Images` block:

| Field | Description |
|-------|-------------|
| Class name | Must match the `Name` field (used for engine lookups) |
| `Name` | The image identifier. Used in the `image:` part of references. |
| `Pos` | Top-left corner position in the atlas (x y), in pixels |
| `Size` | Dimensions (width height), in pixels |
| `Flags` | Tiling behavior flags (см. [Image Flags](#image-flags)) |

### Full Example (DayZ Vanilla)

```
ImageSetClass {
 Name "dayz_gui"
 RefSize 1024 1024
 Textures {
  ImageSetTextureClass {
   mpix 0
   path "{534691EE0479871C}Gui/imagesets/dayz_gui.edds"
  }
  ImageSetTextureClass {
   mpix 1
   path "{C139E49FD0ECAF9E}Gui/imagesets/dayz_gui@2x.edds"
  }
 }
 Images {
  ImageSetDefClass Gradient {
   Name "Gradient"
   Pos 0 317
   Size 75 5
   Flags ISVerticalTile
  }
  ImageSetDefClass Expand {
   Name "Expand"
   Pos 121 257
   Size 20 20
   Flags 0
  }
 }
}
```

---

## XML ImageSet Format

An alternative XML-based format exists and is used by some mods. It is simpler but offers fewer features (no multi-resolution support).

### Structure

```xml
<?xml version="1.0" encoding="utf-8"?>
<imageset name="mh_icons" file="MyMod/GUI/imagesets/mh_icons.edds">
  <image name="icon_store" pos="0 0" size="64 64" />
  <image name="icon_cart" pos="64 0" size="64 64" />
  <image name="icon_wallet" pos="128 0" size="64 64" />
</imageset>
```

### XML Attributes

**`<imageset>` element:**

| Attribute | Description |
|-----------|-------------|
| `name` | The set name (equivalent to native `Name`) |
| `file` | Path to the texture file (equivalent to native `path`) |

**`<image>` element:**

| Attribute | Description |
|-----------|-------------|
| `name` | Image identifier |
| `pos` | Top-left position as `"x y"` |
| `size` | Dimensions as `"width height"` |

### When to Use Which Format

| Feature | Native Format | XML Format |
|---------|---------------|------------|
| Multi-resolution (mip levels) | Yes | No |
| Tiling flags | Yes | No |
| Enfusion GUID paths | Yes | Yes |
| Simplicity | Lower | Higher |
| Used by vanilla DayZ | Yes | No |
| Used by Expansion, MyMod, VPP | Yes | Occasionally |

**Recommendation:** Use the native format for production mods. Use the XML format for quick prototyping or simple icon sets that do not need tiling or multi-resolution support.

---

## Registering ImageSets in config.cpp

ImageSet files must be registered in your mod's `config.cpp` under the `CfgMods` > `class defs` > `class imageSets` block. Without this registration, the engine never loads the imageset and your image references fail silently.

### Синтаксис


```cpp
class CfgMods
{
    class MyMod
    {
        // ... other fields ...
        class defs
        {
            class imageSets
            {
                files[] =
                {
                    "MyMod/GUI/imagesets/my_icons.imageset",
                    "MyMod/GUI/imagesets/my_other_icons.imageset"
                };
            };
        };
    };
};
```

### Real Example: MyFramework

MyFramework registers seven imagesets including Font Awesome icon sets:

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
};
```

### Real Example: VPP Admin Tools

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "VPPAdminTools/GUI/Textures/dayz_gui_vpp.imageset"
        };
    };
};
```

### Real Example: DayZ Editor

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "DayZEditor/gui/imagesets/dayz_editor_gui.imageset"
        };
    };
};
```

---

## Referencing Images in Layouts

In `.layout` files, use the `image0` property with the `set:name image:imageName` syntax:

```
ImageWidgetClass MyIcon {
 size 32 32
 hexactsize 1
 vexactsize 1
 image0 "set:dayz_gui image:icon_refresh"
}
```

### Syntax Breakdown

```
set:SETNAME image:IMAGENAME
```

- `SETNAME` ----  `Name` field from the imageset definition (e.g., `dayz_gui`, `solid`, `brands`)
- `IMAGENAME` ----  `Name` field from a specific `ImageSetDefClass` entry (e.g., `icon_refresh`, `arrow_down`)

### Multiple Image States

Some widgets support multiple image states (normal, hover, pressed):

```
ImageWidgetClass icon {
 image0 "set:solid image:circle"
}

ButtonWidgetClass btn {
 image0 "set:dayz_gui image:icon_expand"
}
```

### Examples from Real Mods

```
image0 "set:regular image:arrow_down_short_wide"     -- MyMod: Font Awesome regular icon
image0 "set:dayz_gui image:icon_minus"                -- MyMod: vanilla DayZ icon
image0 "set:dayz_gui image:icon_collapse"             -- MyMod: vanilla DayZ icon
image0 "set:dayz_gui image:circle"                    -- MyMod: vanilla DayZ shape
image0 "set:dayz_editor_gui image:eye_open"           -- DayZ Editor: custom icon
```

---

## Referencing Images in Scripts

In Enforce Script, use `ImageWidget.LoadImageFile()` or set image properties on widgets:

### LoadImageFile

```c
ImageWidget icon = ImageWidget.Cast(layoutRoot.FindAnyWidget("MyIcon"));
icon.LoadImageFile(0, "set:solid image:circle");
```

The `0` parameter is the image index (corresponding to `image0` in layouts).

### Multiple States via Index

```c
ImageWidget collapseIcon;
collapseIcon.LoadImageFile(0, "set:regular image:square_plus");    // Normal state
collapseIcon.LoadImageFile(1, "set:solid image:square_minus");     // Toggled state
```

Switch between states using `SetImage(index)`:

```c
collapseIcon.SetImage(isExpanded ? 1 : 0);
```

### Using String Variables

```c
// From DayZ Editor
string icon = "set:dayz_editor_gui image:search";
searchBarIcon.LoadImageFile(0, icon);

// Later, change dynamically
searchBarIcon.LoadImageFile(0, "set:dayz_gui image:icon_x");
```

---

## Image Flags

The `Flags` field in native-format imageset entries controls tiling behavior when the image is stretched beyond its natural size.

| Flag | Value | Description |
|------|-------|-------------|
| `0` | 0 | No tiling. The image stretches to fill the widget. |
| `ISHorizontalTile` | 1 | Tiles horizontally when the widget is wider than the image. |
| `ISVerticalTile` | 2 | Tiles vertically when the widget is taller than the image. |
| Both | 3 | Tiles in both directions (`ISHorizontalTile` + `ISVerticalTile`). |

### Usage

```
ImageSetDefClass Gradient {
 Name "Gradient"
 Pos 0 317
 Size 75 5
 Flags ISVerticalTile
}
```

This `Gradient` image is 75x5 pixels. When used in a widget taller than 5 pixels, it tiles vertically to fill the height, creating a repeating gradient stripe.

Most icons use `Flags 0` (no tiling). Tiling flags are primarily for UI elements like borders, dividers, and repeating patterns.

---

## Multi-Resolution Текстуры

The native format supports multiple resolution textures for the same imageset. Это позволяет the engine to use higher-resolution artwork on high-DPI displays.

```
Textures {
 ImageSetTextureClass {
  mpix 0
  path "Gui/imagesets/dayz_gui.edds"
 }
 ImageSetTextureClass {
  mpix 1
  path "Gui/imagesets/dayz_gui@2x.edds"
 }
}
```

- `mpix 0` --- low resolution (used on low-quality settings or distant UI elements)
- `mpix 1` --- standard/high resolution (default)

The `@2x` naming convention is borrowed from Apple's Retina display system but is not enforced ---- вы can name the file anything.

### In Practice

Most mods only include `mpix 1` (a single resolution). Multi-resolution support is primarily used by the vanilla game:

```
Textures {
 ImageSetTextureClass {
  mpix 1
  path "MyFramework/GUI/icons/solid.edds"
 }
}
```

---

## Creating Custom Icon Sets

### Step-by-Step Workflow

**1. Create the Texture Atlas**

Use an image editor (Photoshop, GIMP, etc.) to arrange your icons on a single canvas:
- Choose a power-of-two size (256x256, 512x512, 1024x1024, etc.)
- Arrange icons in a grid for easy coordinate calculation
- Leave some padding between icons to prevent texture bleeding
- Сохранить as `.tga` or `.png`

**2. Convert to EDDS**

DayZ uses `.edds` (Enfusion DDS) format for textures. Use the DayZ Workbench or Mikero's tools to convert:
- Import your `.tga` into DayZ Workbench
- Or use `Pal2PacE.exe` to convert `.paa` to `.edds`
- The output must be an `.edds` file

**3. Write the ImageSet Definition**

Map each icon to a named region. If your icons are on a 64-pixel grid:

```
ImageSetClass {
 Name "mymod_icons"
 RefSize 512 512
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "MyMod/GUI/imagesets/mymod_icons.edds"
  }
 }
 Images {
  ImageSetDefClass settings {
   Name "settings"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass player {
   Name "player"
   Pos 64 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass map_marker {
   Name "map_marker"
   Pos 128 0
   Size 64 64
   Flags 0
  }
 }
}
```

**4. Register in config.cpp**

Add the imageset path to your mod's config.cpp:

```cpp
class imageSets
{
    files[] =
    {
        "MyMod/GUI/imagesets/mymod_icons.imageset"
    };
};
```

**5. Use in Layouts and Scripts**

```
ImageWidgetClass SettingsIcon {
 image0 "set:mymod_icons image:settings"
 size 32 32
 hexactsize 1
 vexactsize 1
}
```

---

## Font Awesome Integration Pattern

MyFramework (inherited from DabsFramework) demonstrates a powerful pattern: converting Font Awesome icon fonts into DayZ imagesets. This gives mods access to thousands of professional-quality icons without creating custom artwork.

### How It Works

1. Font Awesome icons are rendered to a texture atlas at a fixed grid size (64x64 per icon)
2. Each icon style gets its own imageset: `solid`, `regular`, `light`, `thin`, `brands`
3. Icon names in the imageset match Font Awesome icon names (e.g., `circle`, `arrow_down`, `discord`)
4. The imagesets are registered in config.cpp and available to any layout or script

### MyFramework / DabsFramework Icon Sets

```
MyFramework/GUI/icons/
  solid.imageset       -- Filled icons (3648x3712 atlas, 64x64 per icon)
  regular.imageset     -- Outlined icons
  light.imageset       -- Light-weight outlined icons
  thin.imageset        -- Ultra-thin outlined icons
  brands.imageset      -- Brand logos (Discord, GitHub, etc.)
```

### Usage in Layouts

```
image0 "set:solid image:circle"
image0 "set:solid image:gear"
image0 "set:regular image:arrow_down_short_wide"
image0 "set:brands image:discord"
image0 "set:brands image:500px"
```

### Usage in Scripts

```c
// DayZ Editor using the solid set
CollapseIcon.LoadImageFile(1, "set:solid image:square_minus");
CollapseIcon.LoadImageFile(0, "set:regular image:square_plus");
```

### Why This Pattern Works Well

- **Massive icon library**: Thousands of icons available without any artwork creation
- **Consistent style**: All icons share the same visual weight and style
- **Multiple weights**: Choose solid, regular, light, or thin for different visual contexts
- **Brand icons**: Ready-made logos for Discord, Steam, GitHub, etc.
- **Standard names**: Icon names follow Font Awesome conventions, making discovery easy

### The Atlas Structure

The solid imageset, for example, has a `RefSize` of 3648x3712 with icons arranged at 64-pixel intervals:

```
ImageSetClass {
 Name "solid"
 RefSize 3648 3712
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "MyFramework/GUI/icons/solid.edds"
  }
 }
 Images {
  ImageSetDefClass circle {
   Name "circle"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass 360_degrees {
   Name "360_degrees"
   Pos 320 0
   Size 64 64
   Flags 0
  }
  ...
 }
}
```

---

## Реальные примеры


### VPP Admin Tools

VPP packs all admin tool icons into a single 1920x1080 atlas with freeform positioning (not a strict grid):

```
ImageSetClass {
 Name "dayz_gui_vpp"
 RefSize 1920 1080
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "{534691EE0479871E}VPPAdminTools/GUI/Textures/dayz_gui_vpp.edds"
  }
 }
 Images {
  ImageSetDefClass vpp_icon_cloud {
   Name "vpp_icon_cloud"
   Pos 1206 108
   Size 62 62
   Flags 0
  }
  ImageSetDefClass vpp_icon_players {
   Name "vpp_icon_players"
   Pos 391 112
   Size 62 62
   Flags 0
  }
 }
}
```

Referenced in layouts as:
```
image0 "set:dayz_gui_vpp image:vpp_icon_cloud"
```

### MyWeapons Mod

Weapon and attachment icons packed into large atlases with varied icon sizes:

```
ImageSetClass {
 Name "SNAFU_Weapons_Icons"
 RefSize 2048 2048
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "{7C781F3D4B1173D4}SNAFU_Guns_01/gui/Imagesets/SNAFU_Weapons_Icons.edds"
  }
 }
 Images {
  ImageSetDefClass SNAFUFGRIP {
   Name "SNAFUFGRIP"
   Pos 123 19
   Size 300 300
   Flags 0
  }
  ImageSetDefClass SNAFU_M14Optic {
   Name "SNAFU_M14Optic"
   Pos 426 20
   Size 300 300
   Flags 0
  }
 }
}
```

This shows that icons do not need to be uniform size --- inventory icons for weapons use 300x300 while UI icons typically use 64x64.

### MyFramework Prefabs

UI primitives (rounded corners, alpha gradients) packed into a small 256x256 atlas:

```
ImageSetClass {
 Name "prefabs"
 RefSize 256 256
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "{82F14D6B9D1AA1CE}MyFramework/GUI/imagesets/prefabs.edds"
  }
 }
 Images {
  ImageSetDefClass Round_Outline_TopLeft {
   Name "Round_Outline_TopLeft"
   Pos 24 21
   Size 8 8
   Flags 0
  }
  ImageSetDefClass "Alpha 10" {
   Name "Alpha 10"
   Pos 0 15
   Size 1 1
   Flags 0
  }
 }
}
```

Notable: image names can contain spaces when quoted (e.g., `"Alpha 10"`). However, referencing these in layouts requires the exact name including the space.

### MyMod Market Hub (XML Format)

A simpler XML imageset for the market hub module:

```xml
<?xml version="1.0" encoding="utf-8"?>
<imageset name="mh_icons" file="DayZMarketHub/GUI/imagesets/mh_icons.edds">
  <image name="icon_store" pos="0 0" size="64 64" />
  <image name="icon_cart" pos="64 0" size="64 64" />
  <image name="icon_wallet" pos="128 0" size="64 64" />
  <image name="icon_vip" pos="192 0" size="64 64" />
  <image name="icon_weapons" pos="0 64" size="64 64" />
  <image name="icon_success" pos="0 192" size="64 64" />
  <image name="icon_error" pos="64 192" size="64 64" />
</imageset>
```

Referenced as:
```
image0 "set:mh_icons image:icon_store"
```

---

## Распространённые ошибки


### Forgetting config.cpp Registration

The most common issue. If your imageset file exists but is not listed in `class imageSets { files[] = { ... }; };` in config.cpp, the engine never loads it. All image references will fail silently (widgets appear blank).

### Set Name Collisions

If two mods register imagesets with the same `Name`, only one is loaded (the last one wins). Use a unique prefix:

```
Name "mymod_icons"     -- Good
Name "icons"           -- Risky, too generic
```

### Wrong Texture Path

The `path` must be relative to the PBO root (how the file appears inside the packed PBO):

```
path "MyMod/GUI/imagesets/icons.edds"     -- Correct if MyMod is the PBO root
path "GUI/imagesets/icons.edds"            -- Wrong if the PBO root is MyMod/
path "C:/Users/dev/icons.edds"            -- Wrong: absolute paths do not work
```

### Mismatched RefSize

The `RefSize` must match the actual pixel dimensions of your texture. If you specify `RefSize 512 512` but your texture is 1024x1024, all icon positions will be off by a factor of two.

### Pos Coordinates Off by One

`Pos` is the top-left corner of the icon region. If your icons are at 64-pixel intervals but you accidentally offset by 1 pixel, icons will have a thin slice of the adjacent icon visible.

### Using .png or .tga Directly

The engine requires `.edds` format for texture atlases referenced by imagesets. Raw `.png` or `.tga` files will not load. Always convert to `.edds` using DayZ Workbench or Mikero's tools.

### Spaces in Image Names

While the engine supports spaces in image names (e.g., `"Alpha 10"`), they can cause issues in some parsing contexts. Prefer underscores: `Alpha_10`.
