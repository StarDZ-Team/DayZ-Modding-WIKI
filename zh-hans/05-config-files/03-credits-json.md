# 第 5.3 章：Credits.json

[首页](../README.md) | [<< 上一章：inputs.xml](02-inputs-xml.md) | **Credits.json** | [下一章：ImageSet 格式 >>](04-imagesets.md)

---

> **摘要：** `Credits.json` 文件定义了 DayZ 在游戏 Mod 菜单中为你的 Mod 显示的制作人员名单。它按部门和分类列出团队成员、贡献者和致谢信息。虽然纯粹是装饰性的，但它是为你的开发团队署名的标准方式。

---

## 目录

- [概述](#概述)
- [文件位置](#文件位置)
- [JSON 结构](#json-结构)
- [DayZ 如何显示制作人员名单](#dayz-如何显示制作人员名单)
- [使用本地化分类名称](#使用本地化分类名称)
- [模板](#模板)
- [实际示例](#实际示例)
- [常见错误](#常见错误)

---

## 概述

当玩家在 DayZ 启动器或游戏内 Mod 菜单中选择你的 Mod 时，引擎会在 Mod 的 PBO 内查找 `Credits.json` 文件。如果找到，制作人员名单将以按部门和分类组织的滚动视图显示——类似于电影片尾字幕。

该文件是可选的。如果不存在，你的 Mod 不会显示制作人员分类。但包含一个是好的做法：它承认了团队的工作，并使你的 Mod 看起来更加专业。

---

## 文件位置

将 `Credits.json` 放在 Scripts 目录的 `Data` 子文件夹中，或直接放在 Scripts 根目录下：

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      Scripts/
        Data/
          Credits.json       <-- 常见位置（COT、Expansion、DayZ Editor）
        Credits.json         <-- 也有效（DabsFramework、Colorful-UI）
```

两个位置都有效。引擎会扫描 PBO 内容以查找名为 `Credits.json` 的文件（在某些平台上区分大小写）。

---

## JSON 结构

该文件使用简单的 JSON 结构，具有三级层次：

```json
{
    "Header": "My Mod Name",
    "Departments": [
        {
            "DepartmentName": "Department Title",
            "Sections": [
                {
                    "SectionName": "Section Title",
                    "Names": ["Person 1", "Person 2"]
                }
            ]
        }
    ]
}
```

### 顶级字段

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `Header` | string | 否 | 显示在制作人员名单顶部的主标题。如果省略，则不显示标题。 |
| `Departments` | array | 是 | 部门对象数组 |

### Department 对象

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `DepartmentName` | string | 是 | 分类标题文本。可以为空字符串 `""` 以进行无标题的视觉分组。 |
| `Sections` | array | 是 | 该部门内的分类对象数组 |

### Section 对象

实际中存在两种列出名称的变体。引擎都支持。

**变体 1：`Names` 数组**（MyMod Core 使用）

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `SectionName` | string | 是 | 部门内的子标题 |
| `Names` | array of strings | 是 | 贡献者名称列表 |

**变体 2：`SectionLines` 数组**（COT、Expansion、DabsFramework 使用）

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `SectionName` | string | 是 | 部门内的子标题 |
| `SectionLines` | array of strings | 是 | 贡献者名称或文本行列表 |

`Names` 和 `SectionLines` 的作用相同。使用你喜欢的任一种——引擎的渲染方式完全相同。

---

## DayZ 如何显示制作人员名单

制作人员名单的显示遵循以下视觉层次：

```
╔══════════════════════════════════╗
║         MY MOD NAME              ║  <-- Header（大号，居中）
║                                  ║
║     DEPARTMENT NAME              ║  <-- DepartmentName（中号，居中）
║                                  ║
║     Section Name                 ║  <-- SectionName（小号，居中）
║     Person 1                     ║  <-- Names/SectionLines（列表）
║     Person 2                     ║
║     Person 3                     ║
║                                  ║
║     Another Section              ║
║     Person A                     ║
║     Person B                     ║
║                                  ║
║     ANOTHER DEPARTMENT           ║
║     ...                          ║
╚══════════════════════════════════╝
```

- `Header` 在顶部显示一次
- 每个 `DepartmentName` 作为主要分类分隔符
- 每个 `SectionName` 作为子标题
- 名称在制作人员视图中垂直滚动

### 用空字符串控制间距

Expansion 使用空的 `DepartmentName` 和 `SectionName` 字符串，以及 `SectionLines` 中的纯空白条目来创建视觉间距：

```json
{
    "DepartmentName": "",
    "Sections": [{
        "SectionName": "",
        "SectionLines": ["           "]
    }]
}
```

这是控制制作人员滚动中视觉布局的常用技巧。

---

## 使用本地化分类名称

分类名称可以使用 `#` 前缀引用 stringtable 键，就像 UI 文本一样：

```json
{
    "SectionName": "#STR_EXPANSION_CREDITS_SCRIPTERS",
    "SectionLines": ["Steve aka Salutesh", "LieutenantMaster"]
}
```

当引擎渲染时，它会将 `#STR_EXPANSION_CREDITS_SCRIPTERS` 解析为与玩家语言匹配的本地化文本。如果你的 Mod 支持多语言并且希望制作人员分类标题被翻译，这很有用。

部门名称也可以使用 stringtable 引用：

```json
{
    "DepartmentName": "#legal_notices",
    "Sections": [...]
}
```

---

## 模板

### 独立开发者

```json
{
    "Header": "My Awesome Mod",
    "Departments": [
        {
            "DepartmentName": "Development",
            "Sections": [
                {
                    "SectionName": "Developer",
                    "Names": ["YourName"]
                }
            ]
        }
    ]
}
```

### 小型团队

```json
{
    "Header": "My Mod",
    "Departments": [
        {
            "DepartmentName": "Development",
            "Sections": [
                {
                    "SectionName": "Developers",
                    "Names": ["Lead Dev", "Co-Developer"]
                },
                {
                    "SectionName": "3D Artists",
                    "Names": ["Modeler1", "Modeler2"]
                },
                {
                    "SectionName": "Translators",
                    "Names": [
                        "Translator1 (French)",
                        "Translator2 (German)",
                        "Translator3 (Russian)"
                    ]
                }
            ]
        }
    ]
}
```

### 完整专业结构

```json
{
    "Header": "My Big Mod",
    "Departments": [
        {
            "DepartmentName": "Core Team",
            "Sections": [
                {
                    "SectionName": "Lead Developer",
                    "Names": ["ProjectLead"]
                },
                {
                    "SectionName": "Scripters",
                    "Names": ["Dev1", "Dev2", "Dev3"]
                },
                {
                    "SectionName": "3D Artists",
                    "Names": ["Artist1", "Artist2"]
                },
                {
                    "SectionName": "Mapping",
                    "Names": ["Mapper1"]
                }
            ]
        },
        {
            "DepartmentName": "Community",
            "Sections": [
                {
                    "SectionName": "Translators",
                    "Names": [
                        "Translator1 (Czech)",
                        "Translator2 (German)",
                        "Translator3 (Russian)"
                    ]
                },
                {
                    "SectionName": "Testers",
                    "Names": ["Tester1", "Tester2", "Tester3"]
                }
            ]
        },
        {
            "DepartmentName": "Legal Notices",
            "Sections": [
                {
                    "SectionName": "Licenses",
                    "Names": [
                        "Font Awesome - CC BY 4.0 License",
                        "Some assets licensed under ADPL-SA"
                    ]
                }
            ]
        }
    ]
}
```

---

## 实际示例

### MyMod Core

一个使用 `Names` 变体的最小但完整的制作人员文件：

```json
{
    "Header": "MyMod Core",
    "Departments": [
        {
            "DepartmentName": "Development",
            "Sections": [
                {
                    "SectionName": "Framework",
                    "Names": ["Documentation Team"]
                }
            ]
        }
    ]
}
```

### Community Online Tools (COT)

使用 `SectionLines` 变体，包含多个分类和致谢：

```json
{
    "Departments": [
        {
            "DepartmentName": "Community Online Tools",
            "Sections": [
                {
                    "SectionName": "Active Developers",
                    "SectionLines": [
                        "LieutenantMaster",
                        "LAVA (liquidrock)"
                    ]
                },
                {
                    "SectionName": "Inactive Developers",
                    "SectionLines": [
                        "Jacob_Mango",
                        "Arkensor",
                        "DannyDog68",
                        "Thurston",
                        "GrosTon1"
                    ]
                },
                {
                    "SectionName": "Thank you to the following communities",
                    "SectionLines": [
                        "PIPSI.NET AU/NZ",
                        "1SKGaming",
                        "AWG",
                        "Expansion Mod Team",
                        "Bohemia Interactive"
                    ]
                }
            ]
        }
    ]
}
```

值得注意的是：COT 完全省略了 `Header` 字段。Mod 名称来自其他元数据（config.cpp `CfgMods`）。

### DabsFramework

```json
{
    "Departments": [{
        "DepartmentName": "Development",
        "Sections": [{
                "SectionName": "Developers",
                "SectionLines": [
                    "InclementDab",
                    "Gormirn"
                ]
            },
            {
                "SectionName": "Translators",
                "SectionLines": [
                    "InclementDab",
                    "DanceOfJesus (French)",
                    "MarioE (Spanish)",
                    "Dubinek (Czech)",
                    "Steve AKA Salutesh (German)",
                    "Yuki (Russian)",
                    ".magik34 (Polish)",
                    "Daze (Hungarian)"
                ]
            }
        ]
    }]
}
```

### DayZ Expansion

Expansion 展示了 Credits.json 最复杂的用法，包括：
- 通过 stringtable 引用的本地化分类名称（`#STR_EXPANSION_CREDITS_SCRIPTERS`）
- 作为独立部门的法律声明
- 用于视觉间距的空部门和分类名称
- 包含数十个名称的支持者列表

---

## 常见错误

### 无效的 JSON 语法

最常见的问题。JSON 对以下内容很严格：
- **尾部逗号**：`["a", "b",]` 是无效的 JSON（`"b"` 后面的尾部逗号）
- **单引号**：使用 `"双引号"`，而不是 `'单引号'`
- **未加引号的键**：`DepartmentName` 必须写成 `"DepartmentName"`

在发布前使用 JSON 验证器。

### 文件名错误

文件必须准确命名为 `Credits.json`（大写 C）。在区分大小写的文件系统上，`credits.json` 或 `CREDITS.JSON` 将无法被找到。

### 混用 Names 和 SectionLines

在单个 section 内，只使用其中一种：

```json
{
    "SectionName": "Developers",
    "Names": ["Dev1"],
    "SectionLines": ["Dev2"]
}
```

这是模棱两可的。选择一种格式并在整个文件中一致使用。

### 编码问题

将文件保存为 UTF-8。非 ASCII 字符（重音名称、中日韩字符）需要 UTF-8 编码才能在游戏内正确显示。

---

## 最佳实践

- 在打包到 PBO 之前，使用外部工具验证你的 JSON——引擎对格式错误的 JSON 不会给出有用的错误消息。
- 使用 `SectionLines` 变体以保持一致性，因为这是 COT、Expansion 和 DabsFramework 使用的格式。
- 如果你的 Mod 捆绑了有署名要求的第三方资源（字体、图标、声音），请包含一个"法律声明"部门。
- 保持 `Header` 字段与你的 Mod 在 `mod.cpp` 和 `config.cpp` 中的 `name` 一致，以维护统一的身份标识。
- 谨慎使用空的 `DepartmentName` 和 `SectionName` 字符串来控制视觉间距——过度使用会使制作人员名单看起来支离破碎。

---

## 兼容性与影响

- **多 Mod 共存：** 每个 Mod 都有自己独立的 `Credits.json`。不存在冲突风险——引擎从每个 Mod 的 PBO 内分别读取文件。
- **性能：** 制作人员名单仅在玩家打开 Mod 详情屏幕时加载。文件大小对游戏性能没有影响。
