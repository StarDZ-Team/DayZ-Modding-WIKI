# 3.7 Styles, Fonts & Images

This chapter covers the visual building blocks of DayZ UI: predefined styles, font usage, text sizing, image widgets with imageset references, and how to create custom imagesets for your mod.

---

## Styles

Styles are predefined visual appearances that can be applied to widgets via the `style` attribute in layout files. They control background rendering, borders, and overall look without requiring manual color and image configuration.

### Common Built-In Styles

| Style Name | Description |
|---|---|
| `blank` | No visual -- completely transparent background |
| `Empty` | No background rendering |
| `Default` | Default button/widget style with standard DayZ appearance |
| `Colorable` | Style that can be tinted using `SetColor()` |
| `rover_sim_colorable` | Colored panel style, commonly used for backgrounds |
| `rover_sim_black` | Dark panel background |
| `rover_sim_black_2` | Darker panel variant |
| `Outline_1px_BlackBackground` | 1-pixel outline with solid black background |
| `OutlineFilled` | Outline with a filled interior |
| `DayZDefaultPanelRight` | DayZ default right panel style |
| `DayZNormal` | DayZ normal text/widget style |
| `MenuDefault` | Standard menu button style |

### Using Styles in Layouts

```
ButtonWidgetClass MyButton {
 style Default
 text "Click Me"
 size 120 30
 hexactsize 1
 vexactsize 1
}

PanelWidgetClass Background {
 style rover_sim_colorable
 color 0.2 0.3 0.5 0.9
 size 1 1
}
```

### Style + Color Pattern

The `Colorable` and `rover_sim_colorable` styles are designed to be tinted. Set the `color` attribute in the layout or call `SetColor()` in code:

```
PanelWidgetClass TitleBar {
 style rover_sim_colorable
 color 0.4196 0.6471 1 0.9412
 size 1 30
 hexactsize 0
 vexactsize 1
}
```

```c
// Change color at runtime
PanelWidget bar = PanelWidget.Cast(root.FindAnyWidget("TitleBar"));
bar.SetColor(ARGB(240, 107, 165, 255));
```

### Styles in Professional Mods

DabsFramework dialogs use `Outline_1px_BlackBackground` for dialog containers:

```
WrapSpacerWidgetClass EditorDialog {
 style Outline_1px_BlackBackground
 Padding 5
 "Size To Content V" 1
}
```

Colorful UI uses `rover_sim_colorable` extensively for themed panels where the color is controlled by a centralized theme manager.

---

## Fonts

DayZ includes several built-in fonts. Font paths are specified in the `font` attribute.

### Built-In Font Paths

| Font Path | Description |
|---|---|
| `"gui/fonts/Metron"` | Standard UI font |
| `"gui/fonts/Metron28"` | Standard font, 28pt variant |
| `"gui/fonts/Metron-Bold"` | Bold variant |
| `"gui/fonts/Metron-Bold58"` | Bold 58pt variant |
| `"gui/fonts/sdf_MetronBook24"` | SDF (Signed Distance Field) font -- crisp at any size |

### Using Fonts in Layouts

```
TextWidgetClass Title {
 text "Mission Briefing"
 font "gui/fonts/Metron-Bold"
 "text halign" center
 "text valign" center
}

TextWidgetClass Body {
 text "Objective: Secure the airfield"
 font "gui/fonts/Metron"
}
```

### Using Fonts in Code

```c
TextWidget tw = TextWidget.Cast(root.FindAnyWidget("MyText"));
tw.SetText("Hello");
// Font is set in the layout, not changeable at runtime via script
```

### SDF Fonts

SDF (Signed Distance Field) fonts render crisply at any zoom level, making them ideal for UI elements that may appear at various sizes. The `sdf_MetronBook24` font is the best choice for text that needs to look sharp across different UI scale settings.

---

## Text Sizing: "exact text" vs. Proportional

DayZ text widgets support two sizing modes, controlled by the `"exact text"` attribute:

### Proportional Text (Default)

When `"exact text" 0` (the default), the font size is determined by the widget's height. The text scales with the widget. This is the default behavior.

```
TextWidgetClass ScalingText {
 size 1 0.05
 hexactsize 0
 vexactsize 0
 text "I scale with my parent"
}
```

### Exact Text Size

When `"exact text" 1`, the font size is a fixed pixel value set by `"exact text size"`:

```
TextWidgetClass FixedText {
 size 1 30
 hexactsize 0
 vexactsize 1
 text "I am always 16 pixels"
 "exact text" 1
 "exact text size" 16
}
```

### Which to Use?

| Scenario | Recommendation |
|---|---|
| HUD elements that scale with screen size | Proportional (default) |
| Menu text at a specific size | `"exact text" 1` with `"exact text size"` |
| Text that must match a specific font pixel size | `"exact text" 1` |
| Text inside spacers/grids | Often proportional, determined by cell height |

### Text-Related Size Attributes

| Attribute | Effect |
|---|---|
| `"size to text h" 1` | Widget width adjusts to fit the text |
| `"size to text v" 1` | Widget height adjusts to fit the text |
| `"text sharpness"` | Float value controlling rendering sharpness |
| `wrap 1` | Enable word wrapping for text that exceeds widget width |

The `"size to text"` attributes are useful for labels and tags where the widget should be exactly as large as its text content.

---

## Text Alignment

Control where text appears within its widget using alignment attributes:

```
TextWidgetClass CenteredLabel {
 text "Centered"
 "text halign" center
 "text valign" center
}
```

| Attribute | Values | Effect |
|---|---|---|
| `"text halign"` | `left`, `center`, `right` | Horizontal text position within widget |
| `"text valign"` | `top`, `center`, `bottom` | Vertical text position within widget |

---

## Text Outline

Add outlines to text for readability on busy backgrounds:

```c
TextWidget tw;
tw.SetOutline(1, ARGB(255, 0, 0, 0));   // 1px black outline

int size = tw.GetOutlineSize();           // Read outline size
int color = tw.GetOutlineColor();         // Read outline color (ARGB)
```

---

## ImageWidget

`ImageWidget` displays images from two sources: imageset references and dynamically loaded files.

### Imageset References

The most common way to display images. An imageset is a sprite atlas -- a single texture file with multiple named sub-images.

In a layout file:

```
ImageWidgetClass MyIcon {
 image0 "set:dayz_gui image:icon_refresh"
 mode blend
 "src alpha" 1
 stretch 1
}
```

The format is `"set:<imageset_name> image:<image_name>"`.

Common vanilla imagesets and images:

```
"set:dayz_gui image:icon_pin"           -- Map pin icon
"set:dayz_gui image:icon_refresh"       -- Refresh icon
"set:dayz_gui image:icon_x"            -- Close/X icon
"set:dayz_gui image:icon_missing"      -- Warning/missing icon
"set:dayz_gui image:iconHealth0"       -- Health/plus icon
"set:dayz_gui image:DayZLogo"          -- DayZ logo
"set:dayz_gui image:Expand"            -- Expand arrow
"set:dayz_gui image:Gradient"          -- Gradient strip
```

### Multiple Image Slots

A single `ImageWidget` can hold multiple images in different slots (`image0`, `image1`, etc.) and switch between them:

```
ImageWidgetClass StatusIcon {
 image0 "set:dayz_gui image:icon_missing"
 image1 "set:dayz_gui image:iconHealth0"
}
```

```c
ImageWidget icon;
icon.SetImage(0);    // Show image0 (missing icon)
icon.SetImage(1);    // Show image1 (health icon)
```

### Loading Images from Files

Load images dynamically at runtime:

```c
ImageWidget img;
img.LoadImageFile(0, "MyMod/gui/textures/my_image.edds");
img.SetImage(0);
```

The path is relative to the mod's root directory. Supported formats include `.edds`, `.paa`, and `.tga` (though `.edds` is standard for DayZ).

### Image Blend Modes

The `mode` attribute controls how the image blends with what's behind it:

| Mode | Effect |
|---|---|
| `blend` | Standard alpha blending (most common) |
| `additive` | Colors add together (glow effects) |
| `stretch` | Stretch to fill without blending |

### Image Mask Transitions

`ImageWidget` supports mask-based reveal transitions:

```c
ImageWidget img;
img.LoadMaskTexture("gui/textures/mask_wipe.edds");
img.SetMaskProgress(0.5);  // 50% revealed
```

This is useful for loading bars, health displays, and reveal animations.

---

## ImageSet Format

An imageset file (`.imageset`) defines named regions within a sprite atlas texture. DayZ supports two imageset formats.

### DayZ Native Format

Used by vanilla DayZ and most mods. This is **not** XML -- it uses the same brace-delimited format as layout files.

```
ImageSetClass {
 Name "my_mod_icons"
 RefSize 1024 1024
 Textures {
  ImageSetTextureClass {
   mpix 0
   path "MyMod/GUI/imagesets/my_icons.edds"
  }
 }
 Images {
  ImageSetDefClass icon_sword {
   Name "icon_sword"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass icon_shield {
   Name "icon_shield"
   Pos 64 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass icon_potion {
   Name "icon_potion"
   Pos 128 0
   Size 64 64
   Flags 0
  }
 }
}
```

Key fields:
- `Name` -- Imageset name (used in `"set:<name>"`)
- `RefSize` -- Reference size of the source texture in pixels (width height)
- `path` -- Path to the texture file (`.edds`)
- `mpix` -- Mipmap level (0 = standard resolution, 1 = 2x resolution)
- Each image entry defines `Name`, `Pos` (x y in pixels), and `Size` (width height in pixels)

### XML Format

Some mods (including some DayZ Expansion modules) use an XML-based imageset format:

```xml
<?xml version="1.0" encoding="utf-8"?>
<imageset name="my_icons" file="MyMod/GUI/imagesets/my_icons.edds">
  <image name="icon_sword" pos="0 0" size="64 64" />
  <image name="icon_shield" pos="64 0" size="64 64" />
  <image name="icon_potion" pos="128 0" size="64 64" />
</imageset>
```

Both formats accomplish the same thing. The native format is used by vanilla DayZ; the XML format is sometimes easier to read and edit by hand.

---

## Creating Custom Imagesets

To create your own imageset for a mod:

### Step 1: Create the Sprite Atlas Texture

Use an image editor (Photoshop, GIMP, etc.) to create a single texture that contains all your icons/images arranged on a grid. Common sizes are 256x256, 512x512, or 1024x1024 pixels.

Save as `.tga`, then convert to `.edds` using DayZ Tools (TexView2 or the ImageTool).

### Step 2: Create the Imageset File

Create a `.imageset` file that maps named regions to positions in the texture:

```
ImageSetClass {
 Name "mymod_icons"
 RefSize 512 512
 Textures {
  ImageSetTextureClass {
   mpix 0
   path "MyFramework/GUI/imagesets/mymod_icons.edds"
  }
 }
 Images {
  ImageSetDefClass icon_mission {
   Name "icon_mission"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass icon_waypoint {
   Name "icon_waypoint"
   Pos 64 0
   Size 64 64
   Flags 0
  }
 }
}
```

### Step 3: Register in config.cpp

In your mod's `config.cpp`, register the imageset under `CfgMods`:

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
                files[] = { "MyMod/GUI/imagesets/mymod_icons.imageset" };
            };
            // ... script modules ...
        };
    };
};
```

### Step 4: Use in Layouts and Code

In layout files:

```
ImageWidgetClass MissionIcon {
 image0 "set:mymod_icons image:icon_mission"
 mode blend
 "src alpha" 1
}
```

In code:

```c
ImageWidget icon;
// Images from registered imagesets are available by set:name image:name
// No additional loading step needed after config.cpp registration
```

---

## Color Theme Pattern

Professional mods centralize their color definitions in a theme class, then apply colors at runtime. This makes it easy to restyle the entire UI by changing one file.

```c
class UIColor
{
    static int White()        { return ARGB(255, 255, 255, 255); }
    static int Black()        { return ARGB(255, 0, 0, 0); }
    static int Primary()      { return ARGB(255, 75, 119, 190); }
    static int Secondary()    { return ARGB(255, 60, 60, 60); }
    static int Accent()       { return ARGB(255, 100, 200, 100); }
    static int Danger()       { return ARGB(255, 200, 50, 50); }
    static int Transparent()  { return ARGB(1, 0, 0, 0); }
    static int SemiBlack()    { return ARGB(180, 0, 0, 0); }
}
```

Apply in code:

```c
titleBar.SetColor(UIColor.Primary());
statusText.SetColor(UIColor.Accent());
errorText.SetColor(UIColor.Danger());
```

This pattern (used by Colorful UI, MyMod, and others) means changing the entire UI color scheme requires editing only the theme class.

---

## Summary of Visual Attributes by Widget Type

| Widget | Key Visual Attributes |
|---|---|
| Any widget | `color`, `visible`, `style`, `priority`, `inheritalpha` |
| TextWidget | `text`, `font`, `"text halign"`, `"text valign"`, `"exact text"`, `"exact text size"`, `"bold text"`, `wrap` |
| ImageWidget | `image0`, `mode`, `"src alpha"`, `stretch`, `"flip u"`, `"flip v"` |
| ButtonWidget | `text`, `style`, `switch toggle` |
| PanelWidget | `color`, `style` |
| SliderWidget | `"fill in"` |
| ProgressBarWidget | `style` |

---

## Best Practices

1. **Use imageset references** instead of direct file paths where possible -- imagesets are batched more efficiently by the engine.

2. **Use SDF fonts** (`sdf_MetronBook24`) for text that needs to look sharp at any scale.

3. **Use `"exact text" 1`** for UI text at specific pixel sizes; use proportional text for HUD elements that should scale.

4. **Centralize colors** in a theme class rather than hardcoding ARGB values throughout your code.

5. **Set `"src alpha" 1`** on image widgets to get proper transparency.

6. **Register custom imagesets** in `config.cpp` so they are available globally without manual loading.

7. **Keep sprite atlases reasonably sized** -- 512x512 or 1024x1024 is typical. Larger textures waste memory if most of the space is empty.

---

## Next Steps

- [3.8 Dialogs & Modals](08-dialogs-modals.md) -- Popup windows, confirmation prompts, and overlay panels
- [3.1 Widget Types](01-widget-types.md) -- Review the full widget catalog
- [3.6 Event Handling](06-event-handling.md) -- Make your styled widgets interactive

---

## Theory vs Practice

| Concept | Theory | Reality |
|---------|--------|---------|
| SDF fonts scale to any size | `sdf_MetronBook24` is crisp at all sizes | True for sizes above ~10px. Below that, SDF fonts can appear blurry compared to bitmap fonts at their native size |
| `"exact text" 1` gives pixel-perfect sizing | Font renders at the exact pixel size specified | DayZ applies internal scaling, so `"exact text size" 16` may render slightly differently across resolutions. Test on 1080p and 1440p |
| Built-in styles cover all needs | `Default`, `blank`, `Colorable` are sufficient | Most professional mods define their own `.styles` files because built-in styles have limited visual variety |
| Imageset XML and native formats are equivalent | Both define sprite regions | The native brace format is what the engine processes fastest. XML format works but adds a parsing step; use native format for production |
| `SetColor()` overrides layout color | Runtime color replaces the layout value | `SetColor()` tints the widget's existing visual. On styled widgets, the tint multiplies with the style's base color, producing unexpected results |

---

## Compatibility & Impact

- **Multi-Mod:** Style names are global. If two mods register a `.styles` file defining the same style name, the last-loaded mod wins. Prefix custom style names with your mod identifier (e.g., `MyMod_PanelDark`).
- **Performance:** Imagesets are loaded once into GPU memory at startup. Adding large sprite atlases (2048x2048+) increases VRAM usage. Keep atlases at 512x512 or 1024x1024 and split across multiple imagesets if needed.
