# 第 2.3 章：mod.cpp 与 Workshop

[首页](../README.md) | [<< 上一章：config.cpp 深入解析](02-config-cpp.md) | **mod.cpp 与 Workshop** | [下一章：最小可行模组 >>](04-minimum-viable-mod.md)

---

> **概要：** `mod.cpp` 文件是纯元数据 -- 它控制你的模组在 DayZ 启动器、游戏内模组列表和 Steam Workshop 中的显示方式。它对游戏玩法、脚本或加载顺序没有任何影响。如果说 `config.cpp` 是引擎，那么 `mod.cpp` 就是外漆。

---

## 目录

- [概述](#概述)
- [mod.cpp 的位置](#modcpp-的位置)
- [所有字段参考](#所有字段参考)
- [字段详情](#字段详情)
- [客户端模组 vs 服务端模组](#客户端模组-vs-服务端模组)
- [Workshop 元数据](#workshop-元数据)
- [必填字段 vs 可选字段](#必填字段-vs-可选字段)
- [真实示例](#真实示例)
- [提示与最佳实践](#提示与最佳实践)

---

## 概述

`mod.cpp` 位于模组文件夹的根目录（在 `Addons/` 目录旁边）。DayZ 启动器读取它以在模组选择界面显示你的模组名称、Logo、描述和作者。

**关键点：** `mod.cpp` 不会被编译。它不是 Enforce Script。它是一个简单的键值文件，由启动器读取。没有类、没有右花括号后的分号、没有 `[]` 语法的数组（有一个例外是 Workshop 脚本模块 -- 见下文）。

---

## mod.cpp 的位置

```
@MyMod/                       <-- Workshop/启动文件夹（以 @ 为前缀）
  mod.cpp                     <-- 此文件
  Addons/
    MyMod_Scripts.pbo
    MyMod_Data.pbo
  Keys/
    MyMod.bikey
  meta.cpp                    <-- 由 Workshop 发布工具自动生成
```

文件夹名上的 `@` 前缀是 Steam Workshop 模组的惯例，但并非严格要求。

---

## 所有字段参考

| 字段 | 类型 | 用途 | 必填 |
|------|------|------|------|
| `name` | string | 模组显示名称 | 是 |
| `picture` | string | 展开描述中的大图 | 否 |
| `logo` | string | 游戏菜单下方的 Logo | 否 |
| `logoSmall` | string | 模组名称旁的小图标（收起时） | 否 |
| `logoOver` | string | 鼠标悬停时的 Logo | 否 |
| `tooltip` | string | 鼠标悬停时的提示文本 | 否 |
| `tooltipOwned` | string | 模组已安装时的提示文本 | 否 |
| `overview` | string | 模组详情中的较长描述 | 否 |
| `action` | string | URL 链接（网站、Discord、GitHub） | 否 |
| `actionURL` | string | `action` 的替代方案（相同用途） | 否 |
| `author` | string | 作者名称 | 否 |
| `authorID` | string | 作者的 Steam64 ID | 否 |
| `version` | string | 版本字符串 | 否 |
| `type` | string | `"mod"` 或 `"servermod"` | 否 |
| `extra` | int | 保留字段（始终为 0） | 否 |

---

## 字段详情

### name

在 DayZ 启动器模组列表和游戏内模组界面中显示的名称。

```cpp
name = "My Framework";
```

你可以使用字符串表引用来实现本地化：

```cpp
name = "$STR_DF_NAME";    // 通过 stringtable.csv 解析
```

### picture

展开模组描述时显示的较大图片的路径。支持 `.paa`、`.edds` 和 `.tga` 格式。

```cpp
picture = "MyMod/GUI/images/logo_large.edds";
```

路径相对于模组根目录。如果为空或省略，则不显示图片。

### logo

加载模组后显示在游戏菜单下方的主 Logo。

```cpp
logo = "MyMod/GUI/images/logo.edds";
```

### logoSmall

描述收起（未展开）时显示在模组名称旁边的小图标。

```cpp
logoSmall = "MyMod/GUI/images/logo_small.edds";
```

### logoOver

用户将鼠标悬停在模组 Logo 上时出现的 Logo。通常与 `logo` 相同，但可以是高亮/发光变体。

```cpp
logoOver = "MyMod/GUI/images/logo_hover.edds";
```

### tooltip / tooltipOwned

在启动器中悬停模组时显示的简短文本。`tooltipOwned` 在模组已安装（从 Workshop 下载）时显示。

```cpp
tooltip = "MyMod Core - Admin Panel & Framework";
tooltipOwned = "My Framework - Central Admin Panel & Shared Library";
```

### overview

在模组详情面板中显示的较长描述。这是你的"关于"文本。

```cpp
overview = "My Framework provides a centralized admin panel and shared library for all framework mods. Manage configurations, permissions, and mod integration from a single in-game interface.";
```

### action / actionURL

与模组关联的可点击 URL（通常是网站、Discord 邀请或 GitHub 仓库）。两个字段用途相同 -- 使用你喜欢的任何一个。

```cpp
action = "https://github.com/mymod/repo";
// 或
actionURL = "https://discord.gg/mymod";
```

### author / authorID

作者名称和 Steam64 ID。

```cpp
author = "Documentation Team";
authorID = "76561198000000000";
```

`authorID` 被 Workshop 用于链接到作者的 Steam 个人资料。

### version

版本字符串。可以是任何格式 -- 引擎不会解析或验证它。

```cpp
version = "1.0.0";
```

有些模组在 config.cpp 中指向版本文件：

```cpp
versionPath = "MyMod/Scripts/Data/Version.hpp";   // 放在 config.cpp 中，而非 mod.cpp
```

### type

声明这是普通模组还是仅服务端模组。省略时默认为 `"mod"`。

```cpp
type = "mod";           // 通过 -mod= 加载（客户端 + 服务端）
type = "servermod";     // 通过 -servermod= 加载（仅服务端，不发送给客户端）
```

### extra

保留字段。始终设为 `0` 或完全省略。

```cpp
extra = 0;
```

---

## 客户端模组 vs 服务端模组

DayZ 支持两种模组加载机制：

### 客户端模组 (`-mod=`)

- 客户端从 Steam Workshop 下载
- 脚本在客户端和服务端都运行
- 可以包含 UI、HUD、模型、纹理、音效
- 需要密钥签名（`.bikey`）才能加入服务器

```
// 启动参数：
-mod=@MyMod

// mod.cpp：
type = "mod";
```

### 服务端模组 (`-servermod=`)

- 仅在专用服务器上运行
- 客户端永远不会下载它
- 不能包含客户端 UI 或 `5_Mission` 客户端代码
- 不需要密钥签名

```
// 启动参数：
-servermod=@MyModServer

// mod.cpp：
type = "servermod";
```

### 分包模组模式

许多模组作为两个包发布 -- 一个客户端模组和一个服务端模组：

```
@MyMod_Missions/           <-- 客户端模组 (-mod=)
  mod.cpp                   type = "mod"
  Addons/
    MyMod_Missions.pbo     脚本：UI、实体渲染、RPC 接收

@MyMod_MissionsServer/     <-- 服务端模组 (-servermod=)
  mod.cpp                   type = "servermod"
  Addons/
    MyMod_MissionsServer.pbo   脚本：生成、逻辑、状态管理
```

这样可以保持服务端逻辑的私密性（永不发送给客户端）并减少客户端下载大小。

---

## Workshop 元数据

### meta.cpp（自动生成）

当你发布到 Steam Workshop 时，DayZ 工具会自动生成 `meta.cpp` 文件：

```cpp
protocol = 2;
publishedid = 2900000000;    // Steam Workshop 物品 ID
timestamp = 1711000000;       // 上次更新的 Unix 时间戳
```

不要手动编辑 `meta.cpp`。它由发布工具管理。

### Workshop 交互

DayZ 启动器同时读取 `mod.cpp` 和 `meta.cpp`：

- `mod.cpp` 提供视觉元数据（名称、Logo、描述）
- `meta.cpp` 将本地文件链接到 Steam Workshop 物品
- Steam Workshop 页面有自己的标题、描述和图片（通过 Steam 的网页界面管理）

`mod.cpp` 字段是玩家在**游戏内**模组列表中看到的内容。Workshop 页面是他们在 **Steam** 上看到的内容。请保持两者一致。

### Workshop 图片建议

| 图片 | 用途 | 建议尺寸 |
|------|------|----------|
| `picture` | 展开的模组描述 | 512x512 或类似 |
| `logo` | 菜单 Logo | 128x128 到 256x256 |
| `logoSmall` | 收起列表图标 | 64x64 到 128x128 |

使用 `.edds` 格式以获得最佳兼容性。`.paa` 和 `.tga` 也可以。PNG 和 JPG 在 mod.cpp 图片字段中不可用。

---

## 必填字段 vs 可选字段

### 绝对最低要求

一个功能性的 `mod.cpp` 只需要：

```cpp
name = "My Mod";
```

就这样。一行。模组将加载并正常运行。其他一切都是装饰性的。

### 建议最低要求

对于 Workshop 发布的模组，至少包含：

```cpp
name = "My Mod Name";
author = "YourName";
version = "1.0";
overview = "What this mod does in one sentence.";
```

### 完整专业设置

```cpp
name = "My Mod Name";
picture = "MyMod/GUI/images/logo_large.edds";
logo = "MyMod/GUI/images/logo.edds";
logoSmall = "MyMod/GUI/images/logo_small.edds";
logoOver = "MyMod/GUI/images/logo_hover.edds";
tooltip = "Short description";
overview = "Full description of your mod's features.";
action = "https://discord.gg/mymod";
author = "YourName";
authorID = "76561198000000000";
version = "1.2.3";
type = "mod";
```

---

## 真实示例

### 框架模组（客户端模组）

```cpp
name = "My Framework";
picture = "";
actionURL = "";
tooltipOwned = "My Framework - Central Admin Panel & Shared Library";
overview = "My Framework provides a centralized admin panel and shared library for all framework mods. Manage configurations, permissions, and mod integration from a single in-game interface.";
author = "Documentation Team";
version = "1.0.0";
```

### 框架服务端模组（最小配置）

```cpp
name = "My Framework Server";
author = "Documentation Team";
version = "1.0.0";
extra = 0;
type = "mod";
```

### Community Framework

```cpp
name = "Community Framework";
picture = "JM/CF/GUI/textures/cf_icon.edds";
logo = "JM/CF/GUI/textures/cf_icon.edds";
logoSmall = "JM/CF/GUI/textures/cf_icon.edds";
logoOver = "JM/CF/GUI/textures/cf_icon.edds";
tooltip = "Community Framework";
overview = "This is a Community Framework for DayZ SA. One notable feature is it aims to resolve the issue of conflicting RPC type ID's and mods.";
action = "https://github.com/Arkensor/DayZ-CommunityFramework";
author = "CF Mod Team";
authorID = "76561198103677868";
version = "1.5.8";
```

### VPP Admin Tools

```cpp
picture = "VPPAdminTools/data/vpp_logo_m.paa";
logoSmall = "VPPAdminTools/data/vpp_logo_ss.paa";
logo = "VPPAdminTools/data/vpp_logo_s.paa";
logoOver = "VPPAdminTools/data/vpp_logo_s.paa";
tooltip = "Tools helping in administrative DayZ server tasks";
overview = "V++ Admin Tools built for the DayZ community servers!";
action = "https://discord.dayzvpp.com";
```

注意：VPP 省略了 `name` 和 `author` -- 它仍然可以工作，但在启动器中模组名称默认为文件夹名。

### DabsFramework（带本地化）

```cpp
name = "$STR_DF_NAME";
picture = "DabsFramework/gui/images/dabs_framework_logo.paa";
logo = "DabsFramework/gui/images/dabs_framework_logo.paa";
logoSmall = "DabsFramework/gui/images/dabs_framework_logo.paa";
logoOver = "DabsFramework/gui/images/dabs_framework_logo.paa";
tooltip = "$STR_DF_TOOLTIP";
overview = "$STR_DF_DESCRIPTION";
action = "https://dab.dev";
author = "$STR_DF_AUTHOR";
authorID = "76561198247958888";
version = "1.0";
```

DabsFramework 对所有文本字段使用 `$STR_` 字符串表引用，为模组列表本身启用多语言支持。

### AI 模组（在 mod.cpp 中包含脚本模块的客户端模组）

```cpp
name = "My AI Mod";
picture = "";
actionURL = "";
tooltipOwned = "My AI Mod - Intelligent Bot Framework for DayZ";
overview = "Advanced AI bot framework with human-like perception, combat tactics, and developer API";
author = "YourName";
version = "1.0.0";
type = "mod";
dependencies[] = {"Game", "World", "Mission"};
class Defs
{
    class gameScriptModule
    {
        value = "";
        files[] = {"MyMod_AI/Scripts/3_Game"};
    };
    class worldScriptModule
    {
        value = "";
        files[] = {"MyMod_AI/Scripts/4_World"};
    };
    class missionScriptModule
    {
        value = "";
        files[] = {"MyMod_AI/Scripts/5_Mission"};
    };
};
```

注意：此模组将脚本模块定义放在 `mod.cpp` 而非 `config.cpp` 中。两个位置都可以使用 -- 引擎会读取这两个文件。然而，标准惯例是将 `CfgMods` 和脚本模块定义放在 `config.cpp` 中。将它们放在 `mod.cpp` 中是某些模组使用的替代方法。

---

## 提示与最佳实践

### 1. 保持 mod.cpp 简单

`mod.cpp` 仅用于元数据。不要尝试在这里放置游戏逻辑、类定义或任何复杂内容。如果你需要脚本模块，请将它们放在 `config.cpp` 中。

### 2. 使用 .edds 格式的图片

`.edds` 是 UI 元素的标准 DayZ 纹理格式。使用 DayZ Tools（TexView2）从 PNG/TGA 转换为 .edds。

### 3. 与 Workshop 页面保持一致

保持 `name`、`overview` 和 `author` 字段与你的 Steam Workshop 页面一致。玩家会看到两者。

### 4. 一致的版本号

选择一个版本号方案（例如 `1.0.0` 语义版本控制）并在每次发布时更新。一些模组使用 `config.cpp` 中引用的 `Version.hpp` 文件来集中管理版本。

### 5. 先在没有图片的情况下测试

在开发期间，将图片路径留空。在一切正常工作后最后添加 Logo。缺少图片不会阻止模组加载。

### 6. 服务端模组需要更少

仅服务端模组需要最小的 mod.cpp，因为玩家永远不会在启动器中看到它们：

```cpp
name = "My Server Mod";
author = "YourName";
version = "1.0.0";
type = "servermod";
```

---

## 最佳实践

- 始终至少包含 `name` 和 `author` -- 即使是服务端模组，它也有助于在日志输出和管理工具中识别它们。
- 对所有图片字段（`picture`、`logo`、`logoSmall`、`logoOver`）使用 `.edds` 格式。不支持 PNG 和 JPG。
- 保持 `mod.cpp` 仅用于元数据。将 `CfgMods`、脚本模块和 `defines[]` 放在 `config.cpp` 中。
- 在 `version` 字段中使用语义版本控制（`1.2.3`），并在每次 Workshop 发布时更新。
- 先在没有图片的情况下测试你的模组；在确认功能正常后，将添加 Logo 作为最后的打磨步骤。

---

## 真实模组中的观察

| 模式 | 模组 | 详情 |
|------|------|------|
| 本地化的 `name` 字段 | DabsFramework | 使用 `$STR_DF_NAME` 字符串表引用实现多语言模组列表 |
| mod.cpp 中的脚本模块 | 某些 AI 模组 | 将 `class Defs` 和脚本模块路径直接放在 mod.cpp 而非 config.cpp 中 |
| 缺少 `name` 字段 | VPP Admin Tools | 完全省略 `name`；启动器回退使用文件夹名作为显示文本 |
| 所有图片字段相同 | Community Framework | 将 `logo`、`logoSmall` 和 `logoOver` 设置为相同的 `.edds` 文件 |
| 空图片路径 | 许多早期阶段模组 | 开发期间留空 `picture=""`；Workshop 发布前添加品牌标识 |

---

## 理论 vs 实践

| 概念 | 理论 | 现实 |
|------|------|------|
| `mod.cpp` 是必需的 | 每个模组文件夹都需要一个 | 没有它模组也能正常加载，但启动器不会显示名称或元数据 |
| `type` 字段控制加载 | `"mod"` vs `"servermod"` | 启动参数（`-mod=` vs `-servermod=`）才是实际控制加载的；`type` 字段仅是元数据 |
| 图片路径支持常见格式 | 所有纹理格式都有效 | 只有 `.edds`、`.paa` 和 `.tga` 有效；`.png` 和 `.jpg` 被静默忽略 |
| `authorID` 链接到 Steam | Steam64 ID 创建可点击链接 | 仅在 Workshop 页面上有效；游戏内模组列表不会将其渲染为链接 |
| `version` 会被验证 | 引擎检查版本格式 | 引擎将其视为原始字符串；`"banana"` 在技术上是有效的 |

---

## 兼容性与影响

- **多模组：** `mod.cpp` 对加载顺序或依赖关系没有影响。具有相同字段值的两个模组不会冲突 -- 只有 `config.cpp` 中的 `CfgPatches` 类名会发生碰撞。
- **性能：** `mod.cpp` 在启动时只读取一次。此处引用的图片文件被加载到内存中用于启动器 UI，但对游戏内性能没有影响。

---

**上一章：** [第 2.2 章：config.cpp 深入解析](02-config-cpp.md)
**下一章：** [第 2.4 章：你的第一个模组 -- 最小可行](04-minimum-viable-mod.md)
