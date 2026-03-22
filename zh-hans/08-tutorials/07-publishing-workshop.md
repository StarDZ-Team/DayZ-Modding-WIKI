# 第 8.7 章：发布到 Steam 创意工坊

[首页](../README.md) | [<< 上一章：调试与测试](06-debugging-testing.md) | **发布到 Steam 创意工坊** | [下一章：构建 HUD 覆盖层 >>](08-hud-overlay.md)

---

> **摘要：** 你的 mod 已经构建、测试并准备好面向世界了。本教程将引导你完成从头到尾的完整发布流程：准备 mod 文件夹、为多人游戏兼容性签名 PBO、创建 Steam 创意工坊项目、通过 DayZ Tools 或命令行上传，以及随时间维护更新。完成后，你的 mod 将在创意工坊上线，任何人都可以游玩。

---

## 目录

- [简介](#introduction)
- [发布前检查清单](#pre-publishing-checklist)
- [步骤 1：准备 Mod 文件夹](#step-1-prepare-your-mod-folder)
- [步骤 2：编写完整的 mod.cpp](#step-2-write-a-complete-modcpp)
- [步骤 3：准备 Logo 和预览图](#step-3-prepare-logo-and-preview-images)
- [步骤 4：生成密钥对](#step-4-generate-a-key-pair)
- [步骤 5：签名你的 PBO](#step-5-sign-your-pbos)
- [步骤 6：通过 DayZ Tools Publisher 发布](#step-6-publish-via-dayz-tools-publisher)
- [通过命令行发布（替代方式）](#publishing-via-command-line-alternative)
- [更新你的 Mod](#updating-your-mod)
- [版本管理最佳实践](#version-management-best-practices)
- [创意工坊页面最佳实践](#workshop-page-best-practices)
- [服务器运营者指南](#guide-for-server-operators)
- [不通过创意工坊分发](#distribution-without-the-workshop)
- [常见问题与解决方案](#common-problems-and-solutions)
- [完整的 Mod 生命周期](#the-complete-mod-lifecycle)
- [下一步](#next-steps)

---

## 简介

发布到 Steam 创意工坊是 DayZ 模组制作之旅的最后一步。你在前几章中学到的所有知识都将在此汇聚。一旦你的 mod 上了创意工坊，任何 DayZ 玩家都可以订阅、下载并使用它。本章涵盖完整流程：准备 mod、签名 PBO、上传以及维护更新。

---

## 发布前检查清单

在上传之前，请逐项检查此清单。跳过这些项目会导致最常见的发布后问题。

- [ ] 所有功能已在**专用服务器**上测试（不仅是单人游戏）
- [ ] 已测试多人游戏：另一个客户端可以加入并使用 mod 功能
- [ ] 脚本日志中无致命错误（`DayZDiag_x64.RPT` 或 `script_*.log`）
- [ ] 所有 `Print()` 调试语句已移除或包装在 `#ifdef DEVELOPER` 中
- [ ] 无硬编码的测试值或遗留的实验性代码
- [ ] `stringtable.csv` 包含所有面向用户的字符串及翻译
- [ ] `credits.json` 已填写作者和贡献者信息
- [ ] Logo 图像已准备好（尺寸见[步骤 3](#step-3-prepare-logo-and-preview-images)）
- [ ] 所有贴图已转换为 `.paa` 格式（PBO 中不包含原始 `.png`/`.tga`）
- [ ] 创意工坊描述和安装说明已撰写
- [ ] 更新日志已开始（即使只是 "1.0.0 - Initial release"）

---

## 步骤 1：准备 Mod 文件夹

你的最终 mod 文件夹必须严格遵循 DayZ 的预期结构。

### 必需的结构

```
@MyMod/
├── addons/
│   ├── MyMod_Scripts.pbo
│   ├── MyMod_Scripts.pbo.MyMod.bisign
│   ├── MyMod_Data.pbo
│   └── MyMod_Data.pbo.MyMod.bisign
├── keys/
│   └── MyMod.bikey
├── mod.cpp
└── meta.cpp  （首次加载时由 DayZ 启动器自动生成）
```

### 文件夹说明

| 文件夹 / 文件 | 用途 |
|---------------|---------|
| `addons/` | 包含所有 `.pbo` 文件（打包的 mod 内容）及其 `.bisign` 签名文件 |
| `keys/` | 包含服务器用于验证你的 PBO 的公钥（`.bikey`） |
| `mod.cpp` | Mod 元数据：名称、作者、版本、描述、图标路径 |
| `meta.cpp` | 由 DayZ 启动器自动生成；发布后包含创意工坊 ID |

### 重要规则

- 文件夹名称**必须**以 `@` 开头。这是 DayZ 识别 mod 目录的方式。
- `addons/` 中的每个 `.pbo` 旁边必须有一个对应的 `.bisign` 文件。
- `keys/` 中的 `.bikey` 文件必须与用于创建 `.bisign` 文件的私钥对应。
- **不要**在上传文件夹中包含源文件（`.c` 脚本、原始贴图、Workbench 项目）。这里只放打包好的 PBO。

---

## 步骤 2：编写完整的 mod.cpp

`mod.cpp` 文件告诉 DayZ 和启动器关于你 mod 的一切信息。不完整的 `mod.cpp` 会导致图标缺失、描述空白和显示问题。

### 完整的 mod.cpp 示例

```cpp
name         = "My Awesome Mod";
picture      = "MyMod/Data/Textures/logo_co.paa";
logo         = "MyMod/Data/Textures/logo_co.paa";
logoSmall    = "MyMod/Data/Textures/logo_small_co.paa";
logoOver     = "MyMod/Data/Textures/logo_co.paa";
tooltip      = "My Awesome Mod - Adds cool features to DayZ";
overview     = "A comprehensive mod that adds new items, mechanics, and UI elements to DayZ.";
author       = "YourName";
overviewPicture = "MyMod/Data/Textures/overview_co.paa";
action       = "https://steamcommunity.com/sharedfiles/filedetails/?id=YOUR_WORKSHOP_ID";
version      = "1.0.0";
versionPath  = "MyMod/Data/version.txt";
```

### 字段参考

| 字段 | 是否必需 | 说明 |
|-------|----------|-------------|
| `name` | 是 | 在 DayZ 启动器 mod 列表中显示的名称 |
| `picture` | 是 | 主 Logo 图像的路径（在启动器中显示）。相对于 P: 盘或 mod 根目录 |
| `logo` | 是 | 大多数情况下与 picture 相同；在某些 UI 场景中使用 |
| `logoSmall` | 否 | Logo 的较小版本，用于紧凑视图 |
| `logoOver` | 否 | Logo 的悬停状态（通常与 `logo` 相同） |
| `tooltip` | 是 | 在启动器中悬停时显示的一行简短描述 |
| `overview` | 是 | 在 mod 详情面板中显示的较长描述 |
| `author` | 是 | 你的名字或团队名称 |
| `overviewPicture` | 否 | 在 mod 概览面板中显示的大图 |
| `action` | 否 | 玩家点击"网站"时打开的 URL（通常是你的创意工坊页面或 GitHub） |
| `version` | 是 | 当前版本字符串（例如 `"1.0.0"`） |
| `versionPath` | 否 | 包含版本号的文本文件路径（用于自动化构建） |

### 常见错误

- **缺少分号** —— 每行末尾必须以 `;` 结尾。
- **错误的图像路径。** 构建时路径相对于 P: 盘根目录。打包后，路径应反映 PBO 前缀。上传前通过本地加载 mod 来测试。
- **忘记更新版本号** —— 重新上传前始终递增版本字符串。

---

## 步骤 3：准备 Logo 和预览图

### 图像要求

| 图像 | 尺寸 | 格式 | 用途 |
|-------|------|--------|----------|
| Mod Logo（`picture` / `logo`） | 512 x 512 px | `.paa`（游戏内） | DayZ 启动器 mod 列表 |
| 小 Logo（`logoSmall`） | 128 x 128 px | `.paa`（游戏内） | 启动器紧凑视图 |
| Steam 创意工坊预览图 | 512 x 512 px | `.png` 或 `.jpg` | 创意工坊页面缩略图 |
| 概览图片 | 1024 x 512 px | `.paa`（游戏内） | Mod 详情面板 |

### 将图像转换为 PAA

DayZ 内部使用 `.paa` 贴图。要转换 PNG/TGA 图像：

1. 打开 **TexView2**（包含在 DayZ Tools 中）
2. 文件 > 打开你的 `.png` 或 `.tga` 图像
3. 文件 > 另存为 > 选择 `.paa` 格式
4. 保存到你 mod 的 `Data/Textures/` 目录

Addon Builder 也可以在打包 PBO 时自动转换贴图（如果配置了二进制化）。

### 提示

- 使用在小尺寸下仍清晰可辨的图标。
- Logo 上的文字保持最少 —— 在 128x128 下会变得不可读。
- Steam 创意工坊预览图（`.png`/`.jpg`）与游戏内 Logo（`.paa`）是分开的。你通过 Publisher 上传预览图。

---

## 步骤 4：生成密钥对

密钥签名对于多人游戏**至关重要**。几乎所有公共服务器都启用了签名验证，因此没有正确的签名，玩家加入时会被踢出。

### 密钥签名的工作原理

- 你创建一个**密钥对**：一个 `.biprivatekey`（私钥）和一个 `.bikey`（公钥）
- 你用私钥签名每个 `.pbo`，生成 `.bisign` 文件
- 你将 `.bikey` 随 mod 一起分发；服务器运营者将其放在 `keys/` 文件夹中
- 当玩家加入时，服务器使用 `.bikey` 对每个 `.pbo` 与其 `.bisign` 进行验证

### 使用 DayZ Tools 生成密钥

1. 从 Steam 打开 **DayZ Tools**
2. 在主窗口中找到并点击 **DS Create Key**（有时列在 Tools 或 Utilities 下）
3. 输入**密钥名称** —— 使用你的 mod 名称（例如 `MyMod`）
4. 选择保存位置
5. 生成两个文件：
   - `MyMod.bikey` —— **公钥**（分发此文件）
   - `MyMod.biprivatekey` —— **私钥**（保密此文件）

### 通过命令行生成密钥

你也可以直接从终端使用 `DSCreateKey` 工具：

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSCreateKey.exe" MyMod
```

这将在当前目录创建 `MyMod.bikey` 和 `MyMod.biprivatekey`。

### 关键安全规则

> **永远不要分享你的 `.biprivatekey` 文件。** 任何拥有你私钥的人都可以签名修改过的 PBO，而服务器会将其视为合法。安全地存储并备份它。如果丢失，你必须生成新的密钥对，重新签名所有文件，服务器运营者也必须更新他们的密钥。

---

## 步骤 5：签名你的 PBO

你 mod 中的每个 `.pbo` 文件都必须用私钥签名。这会生成与 PBO 文件并排放置的 `.bisign` 文件。

### 使用 DayZ Tools 签名

1. 打开 **DayZ Tools**
2. 找到并点击 **DS Sign File**（在 Tools 或 Utilities 下）
3. 选择你的 `.biprivatekey` 文件
4. 选择要签名的 `.pbo` 文件
5. 在 PBO 旁边生成一个 `.bisign` 文件（例如 `MyMod_Scripts.pbo.MyMod.bisign`）
6. 对 `addons/` 文件夹中的每个 `.pbo` 重复此操作

### 通过命令行签名

用于自动化或多个 PBO 时，使用命令行：

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSSignFile.exe" MyMod.biprivatekey MyMod_Scripts.pbo
```

使用批处理脚本签名文件夹中的所有 PBO：

```batch
@echo off
set DSSIGN="C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSSignFile.exe"
set KEY="path\to\MyMod.biprivatekey"

for %%f in (addons\*.pbo) do (
    echo Signing %%f ...
    %DSSIGN% %KEY% "%%f"
)

echo All PBOs signed.
pause
```

### 签名后：验证文件夹

你的 `addons/` 文件夹应如下所示：

```
addons/
├── MyMod_Scripts.pbo
├── MyMod_Scripts.pbo.MyMod.bisign
├── MyMod_Data.pbo
└── MyMod_Data.pbo.MyMod.bisign
```

每个 `.pbo` 都必须有对应的 `.bisign`。如果缺少任何 `.bisign`，玩家将被签名验证的服务器踢出。

### 放置公钥

将 `MyMod.bikey` 复制到你的 `@MyMod/keys/` 文件夹中。这是服务器运营者将复制到其服务器 `keys/` 目录以允许你 mod 的文件。

---

## 步骤 6：通过 DayZ Tools Publisher 发布

DayZ Tools 包含一个内置的创意工坊发布器 —— 将 mod 上传到 Steam 的最简单方式。

### 打开 Publisher

1. 从 Steam 打开 **DayZ Tools**
2. 在主窗口点击 **Publisher**（也可能标注为 "Workshop Tool"）
3. Publisher 窗口打开，显示 mod 详情的各个字段

### 填写详情

| 字段 | 填写内容 |
|-------|---------------|
| **Title** | 你的 mod 显示名称（例如 "My Awesome Mod"） |
| **Description** | 关于 mod 功能的详细概述。支持 Steam 的 BB code 格式（见下方） |
| **Preview Image** | 浏览到你的 512 x 512 `.png` 或 `.jpg` 预览图 |
| **Mod Folder** | 浏览到你完整的 `@MyMod` 文件夹 |
| **Tags** | 选择相关标签（例如 Weapons、Vehicles、UI、Server、Gear、Maps） |
| **Visibility** | **Public**（任何人可找到）、**Friends Only** 或 **Unlisted**（仅通过直接链接访问） |

### Steam BB Code 快速参考

创意工坊描述支持 BB code：

```
[h1]Features[/h1]
[list]
[*] Feature one
[*] Feature two
[/list]

[b]Bold[/b]  [i]Italic[/i]  [code]Code[/code]
[url=https://example.com]Link text[/url]
[img]https://example.com/image.png[/img]
```

### 发布

1. 最后检查所有字段
2. 点击 **Publish**（或 **Upload**）
3. 等待上传完成。大型 mod 可能需要几分钟，取决于你的网络连接。
4. 完成后，你会看到包含**创意工坊 ID** 的确认信息（一个长数字 ID，如 `2345678901`）
5. **保存此创意工坊 ID。** 后续推送更新时需要用到。

### 发布后：验证

不要跳过这一步。像普通玩家一样测试你的 mod：

1. 访问 `https://steamcommunity.com/sharedfiles/filedetails/?id=YOUR_ID` 并验证标题、描述和预览图
2. 在创意工坊**订阅**你自己的 mod
3. 启动 DayZ，确认 mod 出现在启动器中
4. 启用它，启动游戏，加入服务器（或运行你自己的测试服务器）
5. 确认所有功能正常工作
6. 更新 `mod.cpp` 中的 `action` 字段指向你的创意工坊页面 URL

如果有任何问题，在公开宣布之前更新并重新上传。

---

## 通过命令行发布（替代方式）

对于自动化、CI/CD 或批量上传，SteamCMD 提供命令行替代方案。

### 安装 SteamCMD

从 [Valve 开发者站点](https://developer.valvesoftware.com/wiki/SteamCMD) 下载并解压到文件夹，如 `C:\SteamCMD\`。

### 创建 VDF 文件

SteamCMD 使用 `.vdf` 文件来描述上传内容。创建名为 `workshop_publish.vdf` 的文件：

```
"workshopitem"
{
    "appid"          "221100"
    "publishedfileid" "0"
    "contentfolder"  "C:\\Path\\To\\@MyMod"
    "previewfile"    "C:\\Path\\To\\preview.png"
    "visibility"     "0"
    "title"          "My Awesome Mod"
    "description"    "A comprehensive mod for DayZ."
    "changenote"     "Initial release"
}
```

### 字段参考

| 字段 | 值 |
|-------|-------|
| `appid` | DayZ 始终为 `221100` |
| `publishedfileid` | 新项目为 `0`；更新时使用创意工坊 ID |
| `contentfolder` | 你的 `@MyMod` 文件夹的绝对路径 |
| `previewfile` | 预览图的绝对路径 |
| `visibility` | `0` = 公开，`1` = 仅好友，`2` = 未列出，`3` = 私密 |
| `title` | Mod 名称 |
| `description` | Mod 描述（纯文本） |
| `changenote` | 在创意工坊页面的变更历史中显示的文本 |

### 运行 SteamCMD

```batch
C:\SteamCMD\steamcmd.exe +login YourSteamUsername +workshop_build_item "C:\Path\To\workshop_publish.vdf" +quit
```

SteamCMD 首次使用时会提示输入密码和 Steam Guard 代码。认证后，它会上传 mod 并打印创意工坊 ID。

### 何时使用命令行

- **自动化构建：** 集成到一个打包 PBO、签名并一步上传的构建脚本中
- **批量操作：** 一次上传多个 mod
- **无头服务器：** 没有 GUI 的环境
- **CI/CD 流水线：** GitHub Actions 或类似工具可以调用 SteamCMD

---

## 更新你的 Mod

### 逐步更新流程

1. **进行代码修改**并充分测试
2. **递增版本号** —— 在 `mod.cpp` 中（例如 `"1.0.0"` 改为 `"1.0.1"`）
3. **重新构建所有 PBO** —— 使用 Addon Builder 或你的构建脚本
4. **用原来的私钥重新签名所有 PBO**
5. **打开 DayZ Tools Publisher**
6. 输入你现有的**创意工坊 ID**（或选择现有项目）
7. 指向你更新后的 `@MyMod` 文件夹
8. 撰写**变更说明**描述改动内容
9. 点击 **Publish / Update**

### 使用 SteamCMD 更新

用你的创意工坊 ID 和新的变更说明更新 VDF 文件：

```
"workshopitem"
{
    "appid"          "221100"
    "publishedfileid" "2345678901"
    "contentfolder"  "C:\\Path\\To\\@MyMod"
    "changenote"     "v1.0.1 - Fixed item duplication bug, added French translation"
}
```

然后像之前一样运行 SteamCMD。`publishedfileid` 告诉 Steam 更新现有项目而不是创建新项目。

### 重要：使用相同的密钥

始终使用与原始发布时**相同的私钥**签名更新。如果你用不同的密钥签名，服务器运营者必须用新的 `.bikey` 替换旧的 —— 这意味着停机时间和混乱。仅在私钥泄露时才生成新的密钥对。

---

## 版本管理最佳实践

### 语义化版本控制

使用 **MAJOR.MINOR.PATCH** 格式：

| 组件 | 何时递增 | 示例 |
|-----------|-------------------|---------|
| **MAJOR** | 破坏性变更：配置格式更改、功能移除、API 大改 | `1.0.0` 到 `2.0.0` |
| **MINOR** | 向后兼容的新功能 | `1.0.0` 到 `1.1.0` |
| **PATCH** | 错误修复、小调整、翻译更新 | `1.0.0` 到 `1.0.1` |

### 更新日志格式

在你的创意工坊描述或单独的文件中维护更新日志。一个简洁的格式：

```
v1.2.0 (2025-06-15)
- Added: Night vision toggle keybind
- Added: German and Spanish translations
- Fixed: Inventory crash when dropping stacked items
- Changed: Reduced default spawn rate from 5 to 3

v1.1.0 (2025-05-01)
- Added: New crafting recipes for 4 items
- Fixed: Server crash on player disconnect during trade

v1.0.0 (2025-04-01)
- Initial release
```

### 向后兼容性

当你的 mod 保存持久化数据（JSON 配置、玩家数据文件）时，在更改格式前请仔细考虑：

- **添加新字段**是安全的。加载旧文件时对缺失字段使用默认值。
- **重命名或删除字段**是破坏性变更。递增 MAJOR 版本。
- **考虑迁移模式：** 检测旧格式，转换为新格式，保存。

Enforce Script 中的迁移检查示例：

```csharp
// 在你的配置加载函数中
if (config.configVersion < 2)
{
    // 从 v1 迁移到 v2：将 "oldField" 重命名为 "newField"
    config.newField = config.oldField;
    config.configVersion = 2;
    SaveConfig(config);
    SDZ_Log.Info("MyMod", "Config migrated from v1 to v2");
}
```

### Git 标签

如果你使用 Git 进行版本控制（你应该这样做），为每个发布版本打标签：

```bash
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

这会创建一个永久的引用点，让你可以随时回到任何已发布版本的确切代码。

---

## 创意工坊页面最佳实践

### 描述结构

按以下部分组织你的描述：

1. **概述** —— mod 的功能，2-3 句话
2. **功能** —— 关键功能的项目符号列表
3. **依赖** —— 列出所有依赖 mod 及创意工坊链接
4. **安装** —— 玩家的逐步说明（通常只是"订阅并启用"）
5. **服务器设置** —— 服务器运营者的说明（密钥放置、配置文件）
6. **常见问题** —— 预先回答常见问题
7. **已知问题** —— 诚实地说明当前的限制
8. **支持** —— 链接到你的 Discord、GitHub Issues 或论坛帖子
9. **更新日志** —— 最近的版本历史
10. **许可证** —— 他人可以（或不可以）如何使用你的作品

### 截图和媒体

- 包含 **3-5 张游戏内截图**展示你的 mod 运行效果
- 如果你的 mod 添加了 UI，清楚地展示 UI 面板
- 如果你的 mod 添加了物品，在游戏内展示它们（不仅是在编辑器中）
- 一段简短的游戏视频会显著增加订阅量

### 依赖项

如果你的 mod 需要其他 mod，请清楚地列出它们及创意工坊链接。使用 Steam 创意工坊的"必需项目"功能，使启动器自动加载依赖项。

### 更新计划

设定期望。如果你每周更新，就说出来。如果更新是偶尔的，说"按需更新"。当玩家知道该期待什么时，他们会更理解。

---

## 服务器运营者指南

在你的创意工坊描述中为服务器管理员包含以下信息。

### 在专用服务器上安装创意工坊 Mod

1. 使用 SteamCMD 或 Steam 客户端**下载 mod**：
   ```batch
   steamcmd +login anonymous +workshop_download_item 221100 WORKSHOP_ID +quit
   ```
2. 将 `@ModName` 文件夹**复制**（或创建符号链接）到 DayZ Server 目录
3. 将 `.bikey` 文件从 `@ModName/keys/` **复制**到服务器的 `keys/` 文件夹
4. 将 mod **添加**到 `-mod=` 启动参数

### 启动参数语法

Mod 通过 `-mod=` 参数加载，用分号分隔：

```
-mod=@CF;@VPPAdminTools;@MyMod
```

使用从服务器根目录开始的**完整相对路径**。在 Linux 上，路径区分大小写。

### 加载顺序

Mod 按 `-mod=` 中列出的顺序加载。当 mod 相互依赖时这很重要：

- **依赖项在前。** 如果 `@MyMod` 需要 `@CF`，将 `@CF` 列在 `@MyMod` 之前。
- **一般规则：** 框架在前，内容 mod 在后。
- 如果你的 mod 在 `config.cpp` 中声明了 `requiredAddons`，DayZ 会尝试自动解析加载顺序，但在 `-mod=` 中显式排序更安全。

### 密钥管理

- 在服务器的 `keys/` 目录中放置**每个 mod 一个 `.bikey`**
- 当 mod 使用相同密钥更新时，无需操作 —— 现有的 `.bikey` 仍然有效
- 如果 mod 作者更换了密钥，你必须用新的 `.bikey` 替换旧的
- `keys/` 文件夹路径相对于服务器根目录（例如 `DayZServer/keys/`）

---

## 不通过创意工坊分发

### 何时跳过创意工坊

- 为你自己的服务器社区制作的**私有 mod**
- 在公开发布前与小组进行**Beta 测试**
- 通过其他渠道分发的**商业或授权 mod**
- 开发期间的**快速迭代**（比每次重新上传更快）

### 创建发布 ZIP

打包你的 mod 以进行手动分发：

```
MyMod_v1.0.0.zip
└── @MyMod/
    ├── addons/
    │   ├── MyMod_Scripts.pbo
    │   ├── MyMod_Scripts.pbo.MyMod.bisign
    │   ├── MyMod_Data.pbo
    │   └── MyMod_Data.pbo.MyMod.bisign
    ├── keys/
    │   └── MyMod.bikey
    └── mod.cpp
```

附带一个 `README.txt` 包含安装说明：

```
INSTALLATION:
1. Extract the @MyMod folder into your DayZ game directory
2. (Server operators) Copy MyMod.bikey from @MyMod/keys/ to your server's keys/ folder
3. Add @MyMod to your -mod= launch parameter
```

### GitHub Releases

如果你的 mod 是开源的，使用 GitHub Releases 托管带版本的下载：

1. 在 Git 中打标签（`git tag v1.0.0`）
2. 构建并签名 PBO
3. 创建 `@MyMod` 文件夹的 ZIP
4. 创建 GitHub Release 并附加 ZIP
5. 在 Release 描述中撰写发布说明

这为你提供版本历史、下载计数和每个版本的稳定 URL。

---

## 常见问题与解决方案

| 问题 | 原因 | 修复方法 |
|---------|-------|-----|
| "Addon rejected by server" | 服务器缺少 `.bikey`，或 `.bisign` 与 `.pbo` 不匹配 | 确认 `.bikey` 在服务器 `keys/` 文件夹中。用正确的 `.biprivatekey` 重新签名 PBO。 |
| "Signature check failed" | 签名后 PBO 被修改，或使用了错误的密钥签名 | 从干净源码重新构建 PBO。用**生成服务器 `.bikey` 的同一密钥**重新签名。 |
| Mod 不在 DayZ 启动器中 | `mod.cpp` 格式错误或文件夹结构错误 | 检查 `mod.cpp` 是否有语法错误（缺少 `;`）。确保文件夹以 `@` 开头。重启启动器。 |
| Publisher 中上传失败 | 认证、连接或文件锁定问题 | 验证 Steam 登录。关闭 Workbench/Addon Builder。尝试以管理员身份运行 DayZ Tools。 |
| 创意工坊图标错误/缺失 | `mod.cpp` 中路径错误或图像格式错误 | 验证 `picture`/`logo` 路径指向实际的 `.paa` 文件。创意工坊预览（`.png`）是单独的。 |
| 与其他 mod 冲突 | 重新定义原版类而不是 modding | 使用 `modded class`，在重写中调用 `super`，设置 `requiredAddons` 控制加载顺序。 |
| 玩家加载时崩溃 | 脚本错误、损坏的 PBO 或缺少依赖 | 检查 `.RPT` 日志。从干净源码重新构建 PBO。验证依赖项首先加载。 |

---

## 完整的 Mod 生命周期

```
构思 → 搭建 (8.1) → 结构 (8.1, 8.5) → 编码 (8.2, 8.3, 8.4) → 构建 (8.1)
  → 测试 → 调试 (8.6) → 完善 → 签名 (8.7) → 发布 (8.7) → 维护 (8.7)
                                    ↑                                    │
                                    └────── 反馈循环 ───────────────────┘
```

发布后，玩家反馈会让你回到编码、测试和调试阶段。这种发布-反馈-改进的循环，是打造优秀 mod 的方式。

---

## 下一步

你已经完成了完整的 DayZ 模组制作教程系列 —— 从空白工作区到在 Steam 创意工坊上发布、签名和维护的 mod。从这里出发：

- **探索参考章节**（第 1-7 章），深入了解 GUI 系统、config.cpp 和 Enforce Script
- **研究开源 mod**，如 CF、Community Online Tools 和 Expansion，学习高级模式
- **加入 DayZ 模组制作社区** —— Discord 和 Bohemia Interactive 论坛
- **做更大的项目。** 你的第一个 mod 是 Hello World。下一个可能是完整的游戏玩法大改。

工具已在你手中。创造伟大的东西吧。
