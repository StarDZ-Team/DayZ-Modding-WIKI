# 第 5.4 章：ImageSet 格式

[首页](../README.md) | [<< 上一章：Credits.json](03-credits-json.md) | **ImageSet 格式** | [下一章：服务器配置文件 >>](05-server-configs.md)

---

> **摘要：** ImageSets 定义纹理图集中的命名精灵区域。它们是 DayZ 从布局文件和脚本中引用图标、UI 图形和精灵表的主要机制。你不需要加载数百个单独的图像文件，而是将所有图标打包到单个纹理中，并在 imageset 定义文件中描述每个图标的位置和大小。

---

## 目录

- [概述](#概述)
- [ImageSets 的工作原理](#imagesets-的工作原理)
- [DayZ 原生 ImageSet 格式](#dayz-原生-imageset-格式)
- [XML ImageSet 格式](#xml-imageset-格式)
- [在 config.cpp 中注册 ImageSets](#在-configcpp-中注册-imagesets)
- [在布局中引用图像](#在布局中引用图像)
- [在脚本中引用图像](#在脚本中引用图像)
- [图像标志](#图像标志)
- [多分辨率纹理](#多分辨率纹理)
- [创建自定义图标集](#创建自定义图标集)
- [Font Awesome 集成模式](#font-awesome-集成模式)
- [实际示例](#实际示例)
- [常见错误](#常见错误)

---

## 概述

纹理图集是一个包含许多较小图标的大型单一图像（通常为 `.edds` 格式），这些图标排列在网格或自由形式的布局中。imageset 文件将人类可读的名称映射到该图集中的矩形区域。

例如，一个 1024x1024 的纹理可能包含 64 个 64x64 像素的图标。imageset 文件说明"名为 `arrow_down` 的图标位于位置 (128, 64)，大小为 64x64 像素。"你的布局文件和脚本按名称引用 `arrow_down`，引擎在渲染时从图集中提取正确的子矩形。

这种方法很高效：一次 GPU 纹理加载即可服务所有图标，减少绘制调用和内存开销。

---

## ImageSets 的工作原理

数据流：

1. **纹理图集**（`.edds` 文件）--- 包含所有图标的单一图像
2. **ImageSet 定义**（`.imageset` 文件）--- 将名称映射到图集中的区域
3. **config.cpp 注册** --- 告诉引擎在启动时加载 imageset
4. **布局/脚本引用** --- 使用 `set:name image:iconName` 语法渲染特定图标

注册后，任何布局文件中的任何控件都可以按名称引用该集合中的任何图像。

---

## DayZ 原生 ImageSet 格式

原生格式使用 Enfusion 引擎基于类的语法（类似于 config.cpp）。这是原版游戏和大多数成熟 Mod 使用的格式。

### 结构

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

### 顶级字段

| 字段 | 说明 |
|------|------|
| `Name` | 集合名称。用于图像引用的 `set:` 部分。在所有已加载的 Mod 中必须唯一。 |
| `RefSize` | 纹理的参考尺寸（宽度 高度）。用于坐标映射。 |
| `Textures` | 包含一个或多个用于不同分辨率 mip 级别的 `ImageSetTextureClass` 条目。 |

### 纹理条目字段

| 字段 | 说明 |
|------|------|
| `mpix` | 最小像素级别（mip 级别）。`0` = 最低分辨率，`1` = 标准分辨率。 |
| `path` | `.edds` 纹理文件的路径，相对于 Mod 根目录。可以使用 Enfusion GUID 格式（`{GUID}path`）或普通相对路径。 |

### 图像条目字段

每个图像是 `Images` 块内的一个 `ImageSetDefClass`：

| 字段 | 说明 |
|------|------|
| 类名 | 必须与 `Name` 字段匹配（用于引擎查找） |
| `Name` | 图像标识符。用于引用的 `image:` 部分。 |
| `Pos` | 图集中的左上角位置（x y），以像素为单位 |
| `Size` | 尺寸（宽度 高度），以像素为单位 |
| `Flags` | 平铺行为标志（参见[图像标志](#图像标志)） |

### 完整示例（DayZ 原版）

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

## XML ImageSet 格式

存在一种替代的基于 XML 的格式，一些 Mod 使用它。它更简单但功能较少（不支持多分辨率）。

### 结构

```xml
<?xml version="1.0" encoding="utf-8"?>
<imageset name="mh_icons" file="MyMod/GUI/imagesets/mh_icons.edds">
  <image name="icon_store" pos="0 0" size="64 64" />
  <image name="icon_cart" pos="64 0" size="64 64" />
  <image name="icon_wallet" pos="128 0" size="64 64" />
</imageset>
```

### XML 属性

**`<imageset>` 元素：**

| 属性 | 说明 |
|------|------|
| `name` | 集合名称（等同于原生格式的 `Name`） |
| `file` | 纹理文件路径（等同于原生格式的 `path`） |

**`<image>` 元素：**

| 属性 | 说明 |
|------|------|
| `name` | 图像标识符 |
| `pos` | 左上角位置，格式为 `"x y"` |
| `size` | 尺寸，格式为 `"width height"` |

### 何时使用哪种格式

| 功能 | 原生格式 | XML 格式 |
|------|----------|----------|
| 多分辨率（mip 级别） | 是 | 否 |
| 平铺标志 | 是 | 否 |
| Enfusion GUID 路径 | 是 | 是 |
| 简洁性 | 较低 | 较高 |
| 原版 DayZ 使用 | 是 | 否 |
| Expansion、MyMod、VPP 使用 | 是 | 偶尔 |

**建议：** 生产 Mod 使用原生格式。快速原型设计或不需要平铺或多分辨率支持的简单图标集使用 XML 格式。

---

## 在 config.cpp 中注册 ImageSets

ImageSet 文件必须在你的 Mod 的 `config.cpp` 中的 `CfgMods` > `class defs` > `class imageSets` 块下注册。没有此注册，引擎永远不会加载 imageset，你的图像引用会静默失败。

### 语法

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

### 实际示例：MyMod Core

MyMod Core 注册了七个 imagesets，包括 Font Awesome 图标集：

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

### 实际示例：VPP Admin Tools

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

### 实际示例：DayZ Editor

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

## 在布局中引用图像

在 `.layout` 文件中，使用 `image0` 属性和 `set:name image:imageName` 语法：

```
ImageWidgetClass MyIcon {
 size 32 32
 hexactsize 1
 vexactsize 1
 image0 "set:dayz_gui image:icon_refresh"
}
```

### 语法解析

```
set:SETNAME image:IMAGENAME
```

- `SETNAME` --- imageset 定义中的 `Name` 字段（例如 `dayz_gui`、`solid`、`brands`）
- `IMAGENAME` --- 特定 `ImageSetDefClass` 条目中的 `Name` 字段（例如 `icon_refresh`、`arrow_down`）

### 多图像状态

某些控件支持多个图像状态（正常、悬停、按下）：

```
ImageWidgetClass icon {
 image0 "set:solid image:circle"
}

ButtonWidgetClass btn {
 image0 "set:dayz_gui image:icon_expand"
}
```

### 来自实际 Mod 的示例

```
image0 "set:regular image:arrow_down_short_wide"     -- MyMod：Font Awesome regular 图标
image0 "set:dayz_gui image:icon_minus"                -- MyMod：原版 DayZ 图标
image0 "set:dayz_gui image:icon_collapse"             -- MyMod：原版 DayZ 图标
image0 "set:dayz_gui image:circle"                    -- MyMod：原版 DayZ 形状
image0 "set:dayz_editor_gui image:eye_open"           -- DayZ Editor：自定义图标
```

---

## 在脚本中引用图像

在 Enforce Script 中，使用 `ImageWidget.LoadImageFile()` 或在控件上设置图像属性：

### LoadImageFile

```c
ImageWidget icon = ImageWidget.Cast(layoutRoot.FindAnyWidget("MyIcon"));
icon.LoadImageFile(0, "set:solid image:circle");
```

`0` 参数是图像索引（对应布局中的 `image0`）。

### 通过索引切换多个状态

```c
ImageWidget collapseIcon;
collapseIcon.LoadImageFile(0, "set:regular image:square_plus");    // 正常状态
collapseIcon.LoadImageFile(1, "set:solid image:square_minus");     // 切换状态
```

使用 `SetImage(index)` 在状态之间切换：

```c
collapseIcon.SetImage(isExpanded ? 1 : 0);
```

### 使用字符串变量

```c
// 来自 DayZ Editor
string icon = "set:dayz_editor_gui image:search";
searchBarIcon.LoadImageFile(0, icon);

// 之后动态更改
searchBarIcon.LoadImageFile(0, "set:dayz_gui image:icon_x");
```

---

## 图像标志

原生格式 imageset 条目中的 `Flags` 字段控制当图像拉伸超过其原始大小时的平铺行为。

| 标志 | 值 | 说明 |
|------|-----|------|
| `0` | 0 | 不平铺。图像拉伸以填充控件。 |
| `ISHorizontalTile` | 1 | 当控件比图像宽时水平平铺。 |
| `ISVerticalTile` | 2 | 当控件比图像高时垂直平铺。 |
| 两者 | 3 | 双向平铺（`ISHorizontalTile` + `ISVerticalTile`）。 |

### 用法

```
ImageSetDefClass Gradient {
 Name "Gradient"
 Pos 0 317
 Size 75 5
 Flags ISVerticalTile
}
```

这个 `Gradient` 图像是 75x5 像素。当用在高于 5 像素的控件中时，它会垂直平铺以填充高度，创建重复的渐变条纹。

大多数图标使用 `Flags 0`（不平铺）。平铺标志主要用于 UI 元素，如边框、分隔线和重复图案。

---

## 多分辨率纹理

原生格式支持同一 imageset 的多分辨率纹理。这允许引擎在高 DPI 显示器上使用更高分辨率的图稿。

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

- `mpix 0` --- 低分辨率（在低质量设置或远距离 UI 元素上使用）
- `mpix 1` --- 标准/高分辨率（默认）

`@2x` 命名约定借鉴自 Apple 的 Retina 显示系统，但不是强制的——你可以随意命名文件。

### 实际使用

大多数 Mod 只包含 `mpix 1`（单一分辨率）。多分辨率支持主要由原版游戏使用：

```
Textures {
 ImageSetTextureClass {
  mpix 1
  path "MyFramework/GUI/icons/solid.edds"
 }
}
```

---

## 创建自定义图标集

### 分步工作流程

**1. 创建纹理图集**

使用图像编辑器（Photoshop、GIMP 等）在单个画布上排列你的图标：
- 选择 2 的幂次方尺寸（256x256、512x512、1024x1024 等）
- 在网格中排列图标以便于坐标计算
- 在图标之间留出一些间距以防止纹理渗色
- 保存为 `.tga` 或 `.png`

**2. 转换为 EDDS**

DayZ 使用 `.edds`（Enfusion DDS）格式的纹理。使用 DayZ Workbench 或 Mikero 的工具转换：
- 将你的 `.tga` 导入 DayZ Workbench
- 或使用 `Pal2PacE.exe` 将 `.paa` 转换为 `.edds`
- 输出必须是 `.edds` 文件

**3. 编写 ImageSet 定义**

将每个图标映射到命名区域。如果你的图标在 64 像素网格上：

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

**4. 在 config.cpp 中注册**

将 imageset 路径添加到你的 Mod 的 config.cpp：

```cpp
class imageSets
{
    files[] =
    {
        "MyMod/GUI/imagesets/mymod_icons.imageset"
    };
};
```

**5. 在布局和脚本中使用**

```
ImageWidgetClass SettingsIcon {
 image0 "set:mymod_icons image:settings"
 size 32 32
 hexactsize 1
 vexactsize 1
}
```

---

## Font Awesome 集成模式

MyMod Core（继承自 DabsFramework）展示了一个强大的模式：将 Font Awesome 图标字体转换为 DayZ imagesets。这使 Mod 可以访问数千个专业品质的图标，而无需创建自定义图稿。

### 工作原理

1. Font Awesome 图标以固定网格大小（每个图标 64x64）渲染到纹理图集
2. 每种图标样式获得自己的 imageset：`solid`、`regular`、`light`、`thin`、`brands`
3. imageset 中的图标名称与 Font Awesome 图标名称匹配（例如 `circle`、`arrow_down`、`discord`）
4. imagesets 在 config.cpp 中注册，可供任何布局或脚本使用

### MyMod Core / DabsFramework 图标集

```
MyFramework/GUI/icons/
  solid.imageset       -- 填充图标（3648x3712 图集，每个图标 64x64）
  regular.imageset     -- 轮廓图标
  light.imageset       -- 轻量轮廓图标
  thin.imageset        -- 超细轮廓图标
  brands.imageset      -- 品牌标志（Discord、GitHub 等）
```

### 在布局中使用

```
image0 "set:solid image:circle"
image0 "set:solid image:gear"
image0 "set:regular image:arrow_down_short_wide"
image0 "set:brands image:discord"
image0 "set:brands image:500px"
```

### 在脚本中使用

```c
// DayZ Editor 使用 solid 集
CollapseIcon.LoadImageFile(1, "set:solid image:square_minus");
CollapseIcon.LoadImageFile(0, "set:regular image:square_plus");
```

### 为什么这种模式效果好

- **庞大的图标库**：无需创建任何图稿即可使用数千个图标
- **一致的风格**：所有图标共享相同的视觉重量和风格
- **多种粗细**：为不同的视觉场景选择 solid、regular、light 或 thin
- **品牌图标**：Discord、Steam、GitHub 等现成的标志
- **标准名称**：图标名称遵循 Font Awesome 约定，便于发现

### 图集结构

例如，solid imageset 的 `RefSize` 为 3648x3712，图标以 64 像素间隔排列：

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

## 实际示例

### VPP Admin Tools

VPP 将所有管理工具图标打包到单个 1920x1080 图集中，使用自由形式定位（不是严格的网格）：

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

在布局中引用为：
```
image0 "set:dayz_gui_vpp image:vpp_icon_cloud"
```

### MyMod Weapons

武器和附件图标打包到大型图集中，图标大小各异：

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

这表明图标不需要统一大小——武器的物品栏图标使用 300x300，而 UI 图标通常使用 64x64。

### MyMod Core Prefabs

UI 基元（圆角、Alpha 渐变）打包到小型 256x256 图集中：

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

值得注意的是：图像名称在加引号时可以包含空格（例如 `"Alpha 10"`）。但在布局中引用这些图像时需要包含空格的完整名称。

### MyMod Market Hub（XML 格式）

一个更简单的 XML imageset，用于 market hub 模块：

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

引用方式为：
```
image0 "set:mh_icons image:icon_store"
```

---

## 常见错误

### 忘记 config.cpp 注册

最常见的问题。如果你的 imageset 文件存在但未在 config.cpp 的 `class imageSets { files[] = { ... }; };` 中列出，引擎永远不会加载它。所有图像引用将静默失败（控件显示为空白）。

### 集合名称冲突

如果两个 Mod 注册了相同 `Name` 的 imagesets，只有一个会被加载（后加载的获胜）。使用唯一前缀：

```
Name "mymod_icons"     -- 好
Name "icons"           -- 有风险，太通用
```

### 纹理路径错误

`path` 必须相对于 PBO 根目录（文件在打包的 PBO 内的显示方式）：

```
path "MyMod/GUI/imagesets/icons.edds"     -- 如果 MyMod 是 PBO 根目录则正确
path "GUI/imagesets/icons.edds"            -- 如果 PBO 根目录是 MyMod/ 则错误
path "C:/Users/dev/icons.edds"            -- 错误：绝对路径不起作用
```

### RefSize 不匹配

`RefSize` 必须与纹理的实际像素尺寸匹配。如果你指定 `RefSize 512 512` 但纹理是 1024x1024，所有图标位置都会偏差两倍。

### Pos 坐标偏移一个像素

`Pos` 是图标区域的左上角。如果你的图标以 64 像素间隔排列但不小心偏移了 1 个像素，图标会显示相邻图标的一条细线。

### 直接使用 .png 或 .tga

引擎要求 imageset 引用的纹理图集使用 `.edds` 格式。原始 `.png` 或 `.tga` 文件无法加载。始终使用 DayZ Workbench 或 Mikero 的工具转换为 `.edds`。

### 图像名称中的空格

虽然引擎支持图像名称中的空格（例如 `"Alpha 10"`），但在某些解析上下文中可能导致问题。建议使用下划线：`Alpha_10`。

---

## 最佳实践

- 始终使用唯一的、带 Mod 前缀的集合名称（例如 `"mymod_icons"` 而不是 `"icons"`）。Mod 之间的集合名称冲突会导致一个集合静默覆盖另一个。
- 使用 2 的幂次方纹理尺寸（256x256、512x512、1024x1024）。非 2 的幂次方纹理可以工作，但在某些 GPU 上可能降低渲染性能。
- 在图集中的图标之间添加 1-2 像素的间距以防止纹理渗色，尤其是当纹理以非原始大小显示时。
- 生产 Mod 优先使用原生 `.imageset` 格式而非 XML。它支持 XML 格式缺乏的多分辨率纹理和平铺标志。
- 验证 `RefSize` 与实际纹理尺寸完全匹配。不匹配会导致所有图标坐标按比例偏移。

---

## 理论与实践

> 文档所说的与运行时实际工作方式的对比。

| 概念 | 理论 | 现实 |
|------|------|------|
| config.cpp 注册是必需的 | ImageSets 必须在 `class imageSets` 中列出 | 正确，这是"空白图标"错误最常见的来源。如果缺少注册，引擎不会给出错误——控件只是渲染为空 |
| `RefSize` 映射坐标 | 坐标在 `RefSize` 空间中 | `RefSize` 必须与实际纹理像素尺寸匹配。如果你的纹理是 1024x1024 但 `RefSize` 写的是 512x512，所有 `Pos` 值都会以双倍缩放解释 |
| XML 格式更简单 | 功能更少但工作方式相同 | XML imagesets 无法指定平铺标志或多分辨率 mip 级别。对于图标来说没问题，但对于重复的 UI 元素（边框、渐变）你需要原生格式 |
| 多个 `mpix` 条目 | 引擎根据质量设置选择 | 实际上，大多数 Mod 只提供 `mpix 1`。如果只提供一个 mip 级别，引擎会优雅地回退——没有视觉故障，只是没有高 DPI 优化 |
| 图像名称区分大小写 | `"MyIcon"` 和 `"myicon"` 是不同的 | 在 imageset 定义中确实如此，但在某些引擎版本中 `LoadImageFile()` 的查找不区分大小写。为安全起见始终精确匹配大小写 |

---

## 兼容性与影响

- **多 Mod 共存：** 集合名称冲突是主要风险。如果两个 Mod 都定义了名为 `"icons"` 的 imageset，只有一个会被加载（后加载的 PBO 获胜）。失败 Mod 中所有对 `set:icons` 的引用都会静默失效。始终使用 Mod 特定的前缀。
- **性能：** 每个唯一的 imageset 纹理是一次 GPU 纹理加载。将图标合并到更少、更大的图集中可减少绘制调用。一个拥有 10 个单独 64x64 纹理的 Mod 性能不如一个包含 10 个图标的 512x512 图集。
- **版本：** 原生 `.imageset` 格式和 `set:name image:name` 引用语法自 DayZ 1.0 以来一直稳定。XML 格式自早期版本起作为替代方案可用，但未被 Bohemia 官方文档记录。

---

## 在实际 Mod 中观察到的模式

| 模式 | Mod | 详情 |
|------|-----|------|
| Font Awesome 图标图集 | DabsFramework / StarDZ Core | 将 Font Awesome 图标渲染到大型图集（3648x3712），通过 `set:solid`、`set:regular`、`set:brands` 提供数千个专业图标 |
| 自由形式图集布局 | VPP Admin Tools | 图标以非均匀方式排列在 1920x1080 图集上，大小各异，最大化纹理空间利用 |
| 按功能分的小图集 | Expansion | 每个 Expansion 子模块有自己的小 imageset，而不是一个巨大的图集，保持 PBO 大小最小 |
| 300x300 物品栏图标 | SNAFU Weapons | 武器/附件物品栏插槽使用大图标尺寸，细节更重要，不同于 64x64 的 UI 图标 |
