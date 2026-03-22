# 第 3.7 章：样式、字体与图像

[首页](../README.md) | [<< 上一章：事件处理](06-event-handling.md) | **样式、字体与图像** | [下一章：对话框与模态框 >>](08-dialogs-modals.md)

---

本章涵盖 DayZ UI 的视觉构建模块：预定义样式、字体使用、文本尺寸、带图像集引用的图像控件，以及如何为你的模组创建自定义图像集。

---

## 样式

样式是预定义的视觉外观，可以通过布局文件中的 `style` 属性应用到控件上。它们控制背景渲染、边框和整体外观，无需手动配置颜色和图像。

### 常用内置样式

| 样式名称 | 描述 |
|---|---|
| `blank` | 无视觉效果 -- 完全透明的背景 |
| `Empty` | 无背景渲染 |
| `Default` | 具有标准 DayZ 外观的默认按钮/控件样式 |
| `Colorable` | 可以使用 `SetColor()` 进行着色的样式 |
| `rover_sim_colorable` | 着色面板样式，常用于背景 |
| `rover_sim_black` | 深色面板背景 |
| `rover_sim_black_2` | 更深的面板变体 |
| `Outline_1px_BlackBackground` | 1 像素边框配纯黑背景 |
| `OutlineFilled` | 带填充内部的边框 |
| `DayZDefaultPanelRight` | DayZ 默认右侧面板样式 |
| `DayZNormal` | DayZ 标准文本/控件样式 |
| `MenuDefault` | 标准菜单按钮样式 |

### 在布局中使用样式

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

### 样式 + 颜色模式

`Colorable` 和 `rover_sim_colorable` 样式设计用于着色。在布局中设置 `color` 属性或在代码中调用 `SetColor()`：

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
// 在运行时更改颜色
PanelWidget bar = PanelWidget.Cast(root.FindAnyWidget("TitleBar"));
bar.SetColor(ARGB(240, 107, 165, 255));
```

### 专业模组中的样式

DabsFramework 对话框使用 `Outline_1px_BlackBackground` 作为对话框容器：

```
WrapSpacerWidgetClass EditorDialog {
 style Outline_1px_BlackBackground
 Padding 5
 "Size To Content V" 1
}
```

Colorful UI 大量使用 `rover_sim_colorable`，用于由集中式主题管理器控制颜色的主题化面板。

---

## 字体

DayZ 包含几种内置字体。字体路径通过 `font` 属性指定。

### 内置字体路径

| 字体路径 | 描述 |
|---|---|
| `"gui/fonts/Metron"` | 标准 UI 字体 |
| `"gui/fonts/Metron28"` | 标准字体，28pt 变体 |
| `"gui/fonts/Metron-Bold"` | 粗体变体 |
| `"gui/fonts/Metron-Bold58"` | 粗体 58pt 变体 |
| `"gui/fonts/sdf_MetronBook24"` | SDF（有符号距离场）字体 -- 任何尺寸都清晰 |

### 在布局中使用字体

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

### 在代码中使用字体

```c
TextWidget tw = TextWidget.Cast(root.FindAnyWidget("MyText"));
tw.SetText("Hello");
// 字体在布局中设置，无法在运行时通过脚本更改
```

### SDF 字体

SDF（有符号距离场）字体在任何缩放级别下都能清晰渲染，使其非常适合可能以各种尺寸显示的 UI 元素。`sdf_MetronBook24` 字体是需要在不同 UI 缩放设置下保持清晰的文本的最佳选择。

---

## 文本尺寸："exact text" 与比例

DayZ 文本控件支持两种尺寸模式，由 `"exact text"` 属性控制：

### 比例文本（默认）

当 `"exact text" 0`（默认值）时，字体大小由控件的高度决定。文本随控件缩放。这是默认行为。

```
TextWidgetClass ScalingText {
 size 1 0.05
 hexactsize 0
 vexactsize 0
 text "I scale with my parent"
}
```

### 精确文本尺寸

当 `"exact text" 1` 时，字体大小是由 `"exact text size"` 设置的固定像素值：

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

### 何时使用哪种？

| 场景 | 建议 |
|---|---|
| 随屏幕尺寸缩放的 HUD 元素 | 比例（默认） |
| 特定尺寸的菜单文本 | `"exact text" 1` 配合 `"exact text size"` |
| 必须匹配特定字体像素大小的文本 | `"exact text" 1` |
| 间距器/网格内的文本 | 通常使用比例，由单元格高度决定 |

### 文本相关尺寸属性

| 属性 | 效果 |
|---|---|
| `"size to text h" 1` | 控件宽度调整以适应文本 |
| `"size to text v" 1` | 控件高度调整以适应文本 |
| `"text sharpness"` | 控制渲染锐度的浮点值 |
| `wrap 1` | 为超出控件宽度的文本启用自动换行 |

`"size to text"` 属性对于标签和标记很有用，使控件的大小恰好与其文本内容一致。

---

## 文本对齐

使用对齐属性控制文本在控件内的显示位置：

```
TextWidgetClass CenteredLabel {
 text "Centered"
 "text halign" center
 "text valign" center
}
```

| 属性 | 值 | 效果 |
|---|---|---|
| `"text halign"` | `left`、`center`、`right` | 控件内文本的水平位置 |
| `"text valign"` | `top`、`center`、`bottom` | 控件内文本的垂直位置 |

---

## 文本描边

为文本添加描边以提高在复杂背景上的可读性：

```c
TextWidget tw;
tw.SetOutline(1, ARGB(255, 0, 0, 0));   // 1 像素黑色描边

int size = tw.GetOutlineSize();           // 读取描边大小
int color = tw.GetOutlineColor();         // 读取描边颜色（ARGB）
```

---

## ImageWidget

`ImageWidget` 从两种来源显示图像：图像集引用和动态加载的文件。

### 图像集引用

最常用的显示图像方式。图像集是一个精灵图集 —— 一个包含多个命名子图像的单一纹理文件。

在布局文件中：

```
ImageWidgetClass MyIcon {
 image0 "set:dayz_gui image:icon_refresh"
 mode blend
 "src alpha" 1
 stretch 1
}
```

格式为 `"set:<imageset_name> image:<image_name>"`。

常用的原版图像集和图像：

```
"set:dayz_gui image:icon_pin"           -- 地图标记图标
"set:dayz_gui image:icon_refresh"       -- 刷新图标
"set:dayz_gui image:icon_x"            -- 关闭/X 图标
"set:dayz_gui image:icon_missing"      -- 警告/缺失图标
"set:dayz_gui image:iconHealth0"       -- 生命/加号图标
"set:dayz_gui image:DayZLogo"          -- DayZ 徽标
"set:dayz_gui image:Expand"            -- 展开箭头
"set:dayz_gui image:Gradient"          -- 渐变条
```

### 多图像槽位

单个 `ImageWidget` 可以在不同的槽位（`image0`、`image1` 等）中保存多个图像并在它们之间切换：

```
ImageWidgetClass StatusIcon {
 image0 "set:dayz_gui image:icon_missing"
 image1 "set:dayz_gui image:iconHealth0"
}
```

```c
ImageWidget icon;
icon.SetImage(0);    // 显示 image0（缺失图标）
icon.SetImage(1);    // 显示 image1（生命图标）
```

### 从文件加载图像

在运行时动态加载图像：

```c
ImageWidget img;
img.LoadImageFile(0, "MyMod/gui/textures/my_image.edds");
img.SetImage(0);
```

路径相对于模组的根目录。支持的格式包括 `.edds`、`.paa` 和 `.tga`（不过 `.edds` 是 DayZ 的标准格式）。

### 图像混合模式

`mode` 属性控制图像与后面内容的混合方式：

| 模式 | 效果 |
|---|---|
| `blend` | 标准 Alpha 混合（最常用） |
| `additive` | 颜色叠加（发光效果） |
| `stretch` | 拉伸填充，不进行混合 |

### 图像遮罩过渡

`ImageWidget` 支持基于遮罩的揭示过渡效果：

```c
ImageWidget img;
img.LoadMaskTexture("gui/textures/mask_wipe.edds");
img.SetMaskProgress(0.5);  // 揭示 50%
```

这对于加载条、生命值显示和揭示动画很有用。

---

## ImageSet 格式

图像集文件（`.imageset`）定义了精灵图集纹理中的命名区域。DayZ 支持两种图像集格式。

### DayZ 原生格式

被原版 DayZ 和大多数模组使用。这**不是** XML —— 它使用与布局文件相同的花括号分隔格式。

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

关键字段：
- `Name` -- 图像集名称（在 `"set:<name>"` 中使用）
- `RefSize` -- 源纹理的参考大小（像素，宽度 高度）
- `path` -- 纹理文件的路径（`.edds`）
- `mpix` -- Mipmap 级别（0 = 标准分辨率，1 = 2x 分辨率）
- 每个图像条目定义 `Name`、`Pos`（x y，像素）和 `Size`（宽度 高度，像素）

### XML 格式

一些模组（包括部分 DayZ Expansion 模块）使用基于 XML 的图像集格式：

```xml
<?xml version="1.0" encoding="utf-8"?>
<imageset name="my_icons" file="MyMod/GUI/imagesets/my_icons.edds">
  <image name="icon_sword" pos="0 0" size="64 64" />
  <image name="icon_shield" pos="64 0" size="64 64" />
  <image name="icon_potion" pos="128 0" size="64 64" />
</imageset>
```

两种格式实现的功能相同。原生格式被原版 DayZ 使用；XML 格式有时更容易手动阅读和编辑。

---

## 创建自定义图像集

要为你的模组创建自己的图像集：

### 步骤 1：创建精灵图集纹理

使用图像编辑器（Photoshop、GIMP 等）创建一个包含所有图标/图像的单一纹理，排列在网格上。常见尺寸为 256x256、512x512 或 1024x1024 像素。

保存为 `.tga`，然后使用 DayZ Tools（TexView2 或 ImageTool）转换为 `.edds`。

### 步骤 2：创建图像集文件

创建一个 `.imageset` 文件，将命名区域映射到纹理中的位置：

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

### 步骤 3：在 config.cpp 中注册

在你的模组的 `config.cpp` 中，在 `CfgMods` 下注册图像集：

```cpp
class CfgMods
{
    class MyMod
    {
        // ... 其他字段 ...
        class defs
        {
            class imageSets
            {
                files[] = { "MyMod/GUI/imagesets/mymod_icons.imageset" };
            };
            // ... 脚本模块 ...
        };
    };
};
```

### 步骤 4：在布局和代码中使用

在布局文件中：

```
ImageWidgetClass MissionIcon {
 image0 "set:mymod_icons image:icon_mission"
 mode blend
 "src alpha" 1
}
```

在代码中：

```c
ImageWidget icon;
// 已注册图像集中的图像可通过 set:name image:name 格式使用
// 在 config.cpp 注册后无需额外加载步骤
```

---

## 颜色主题模式

专业模组将颜色定义集中在主题类中，然后在运行时应用颜色。这使得只需更改一个文件就能轻松重新设计整个 UI 的样式。

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

在代码中应用：

```c
titleBar.SetColor(UIColor.Primary());
statusText.SetColor(UIColor.Accent());
errorText.SetColor(UIColor.Danger());
```

这种模式（被 Colorful UI、MyMod 等使用）意味着更改整个 UI 配色方案只需编辑主题类即可。

---

## 按控件类型的视觉属性总结

| 控件 | 关键视觉属性 |
|---|---|
| 任何控件 | `color`、`visible`、`style`、`priority`、`inheritalpha` |
| TextWidget | `text`、`font`、`"text halign"`、`"text valign"`、`"exact text"`、`"exact text size"`、`"bold text"`、`wrap` |
| ImageWidget | `image0`、`mode`、`"src alpha"`、`stretch`、`"flip u"`、`"flip v"` |
| ButtonWidget | `text`、`style`、`switch toggle` |
| PanelWidget | `color`、`style` |
| SliderWidget | `"fill in"` |
| ProgressBarWidget | `style` |

---

## 最佳实践

1. **尽可能使用图像集引用**而非直接文件路径 -- 图像集被引擎更高效地批量处理。

2. **使用 SDF 字体**（`sdf_MetronBook24`）用于需要在任何缩放下保持清晰的文本。

3. **使用 `"exact text" 1`** 用于特定像素大小的 UI 文本；使用比例文本用于应随缩放的 HUD 元素。

4. **将颜色集中**在主题类中，而不是在代码中硬编码 ARGB 值。

5. **在图像控件上设置 `"src alpha" 1`** 以获得正确的透明度。

6. **在 `config.cpp` 中注册自定义图像集**，使其无需手动加载即可全局使用。

7. **保持精灵图集合理的大小** -- 512x512 或 1024x1024 是典型大小。更大的纹理如果大部分空间为空会浪费内存。

---

## 后续步骤

- [3.8 对话框与模态框](08-dialogs-modals.md) -- 弹出窗口、确认提示和叠加面板
- [3.1 控件类型](01-widget-types.md) -- 回顾完整的控件目录
- [3.6 事件处理](06-event-handling.md) -- 使你的样式化控件具有交互性

---

## 理论与实践

| 概念 | 理论 | 现实 |
|---------|--------|---------|
| SDF 字体可缩放到任何大小 | `sdf_MetronBook24` 在所有尺寸下都清晰 | 在大于约 10px 的尺寸下确实如此。低于该值时，SDF 字体可能比原始大小的位图字体看起来更模糊 |
| `"exact text" 1` 提供像素完美的尺寸 | 字体以指定的精确像素大小渲染 | DayZ 应用内部缩放，因此 `"exact text size" 16` 在不同分辨率下可能渲染略有不同。请在 1080p 和 1440p 上测试 |
| 内置样式满足所有需求 | `Default`、`blank`、`Colorable` 就够了 | 大多数专业模组定义自己的 `.styles` 文件，因为内置样式的视觉多样性有限 |
| 图像集 XML 和原生格式等效 | 两者都定义精灵区域 | 原生花括号格式是引擎处理最快的。XML 格式可以工作但增加了解析步骤；生产环境使用原生格式 |
| `SetColor()` 覆盖布局颜色 | 运行时颜色替换布局值 | `SetColor()` 对控件现有的视觉效果进行着色。在使用样式的控件上，着色与样式的基础颜色相乘，可能产生意外结果 |

---

## 兼容性与影响

- **多模组：** 样式名称是全局的。如果两个模组注册了定义相同样式名称的 `.styles` 文件，最后加载的模组获胜。为自定义样式名称添加模组标识前缀（例如 `MyMod_PanelDark`）。
- **性能：** 图像集在启动时一次性加载到 GPU 内存中。添加大型精灵图集（2048x2048+）会增加显存使用。保持图集在 512x512 或 1024x1024，如需更多则拆分为多个图像集。

---

## 在真实模组中的观察

| 模式 | 模组 | 详情 |
|---------|-----|--------|
| 集中式 `UIColor` 主题类 | Colorful UI | 所有颜色通过静态函数定义在一个类中，使全局重新着色只需一次更改 |
| 自定义 `.imageset` 用于模组图标 | Expansion Market | 为购买/出售/交易操作定义自定义图标的精灵图集 |
| `rover_sim_colorable` 用于主题化面板 | COT、VPP Admin Tools | 面板使用此样式以便主题管理器可以在运行时更改颜色 |
| SDF 字体用于 HUD 叠加 | Colorful UI | 使用 `sdf_MetronBook24` 确保 HUD 文本在所有 UI 缩放设置下保持清晰 |
