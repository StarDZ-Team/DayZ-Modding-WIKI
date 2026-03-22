# 第5.1章：stringtable.csv --- 本地化

[首页](../README.md) | **stringtable.csv** | [下一章：inputs.xml >>](02-inputs-xml.md)

---

> **概要：** `stringtable.csv` 文件为你的 DayZ 模组提供本地化文本。引擎在启动时读取此 CSV 文件，并根据玩家的语言设置解析翻译键。每个面向用户的字符串 --- UI 标签、输入绑定名称、物品描述、通知文本 --- 都应该放在 stringtable 中，而不是硬编码。

---

## 目录

- [概述](#overview)
- [CSV 格式](#csv-format)
- [列参考](#column-reference)
- [键命名规范](#key-naming-convention)
- [引用字符串](#referencing-strings)
- [创建新的 Stringtable](#creating-a-new-stringtable)
- [空单元格处理和回退行为](#empty-cell-handling-and-fallback-behavior)
- [多语言工作流](#multi-language-workflow)
- [模块化 Stringtable 方式（DayZ Expansion）](#modular-stringtable-approach-dayz-expansion)
- [实际示例](#real-examples)
- [常见错误](#common-mistakes)

---

## 概述

DayZ 使用基于 CSV 的本地化系统。当引擎遇到以 `#` 为前缀的字符串键（例如 `#STR_MYMOD_HELLO`）时，它会在所有已加载的 stringtable 文件中查找该键，并返回与玩家当前语言匹配的翻译。如果当前语言没有找到匹配项，引擎会按照预定义的链进行回退。

stringtable 文件必须精确命名为 `stringtable.csv`，并放置在模组的 PBO 结构内。引擎会自动发现它 --- 不需要在 config.cpp 中注册。

---

## CSV 格式

该文件是带引号字段的标准逗号分隔值文件。第一行是表头，后续每行定义一个翻译键。

### 表头行

表头行定义列。DayZ 最多识别 15 列：

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
```

### 数据行

每行以字符串键开头（CSV 中不带 `#` 前缀），后跟每种语言的翻译：

```csv
"STR_MYMOD_HELLO","Hello World","Hello World","Ahoj světe","Hallo Welt","Привет мир","Witaj świecie","Helló világ","Ciao mondo","Hola mundo","Bonjour le monde","你好世界","ハローワールド","Olá mundo","你好世界",
```

### 尾部逗号

许多 stringtable 文件在最后一列后包含尾部逗号。这是惯例且安全的 --- 引擎可以容忍它。

### 引号规则

- 如果字段包含逗号、换行符或双引号，则**必须**用双引号引起来。
- 实践中，大多数模组为了一致性会给每个字段加引号。
- 一些模组（如 MyMod Missions）完全省略引号；只要字段内容不包含逗号，引擎可以处理这两种风格。

---

## 列参考

DayZ 支持 13 种玩家可选语言。CSV 有 15 列，因为第一列是键名，第二列是 `original` 列（模组作者的母语或默认文本）。

| # | 列名 | 语言 | 备注 |
|---|------|------|------|
| 1 | `Language` | --- | 字符串键标识符（例如 `STR_MYMOD_HELLO`） |
| 2 | `original` | 作者母语 | 最后的回退；当没有其他列匹配时使用 |
| 3 | `english` | 英语 | 国际化模组最常用的主语言 |
| 4 | `czech` | 捷克语 | |
| 5 | `german` | 德语 | |
| 6 | `russian` | 俄语 | |
| 7 | `polish` | 波兰语 | |
| 8 | `hungarian` | 匈牙利语 | |
| 9 | `italian` | 意大利语 | |
| 10 | `spanish` | 西班牙语 | |
| 11 | `french` | 法语 | |
| 12 | `chinese` | 中文（繁体） | 繁体中文字符 |
| 13 | `japanese` | 日语 | |
| 14 | `portuguese` | 葡萄牙语 | |
| 15 | `chinesesimp` | 中文（简体） | 简体中文字符 |

### 列顺序很重要

引擎通过**表头名称**而非位置来识别列。然而，强烈建议按照上面显示的标准顺序排列，以确保兼容性和可读性。

### 可选列

你不需要包含所有 15 列。如果你的模组只支持英语，可以使用最小化的表头：

```csv
"Language","english"
"STR_MYMOD_HELLO","Hello World"
```

一些模组添加了非标准列，如 `korean`（MyMod Missions 就是这样做的）。引擎会忽略它不认识的语言列，但这些列可以作为文档或为未来语言支持做准备。

---

## 键命名规范

字符串键遵循层次化的命名模式：

```
STR_MODNAME_CATEGORY_ELEMENT
```

### 规则

1. **始终以 `STR_` 开头** --- 这是通用的 DayZ 惯例
2. **模组前缀** --- 唯一标识你的模组（例如 `MYMOD`、`COT`、`EXPANSION`、`VPP`）
3. **类别** --- 分组相关字符串（例如 `INPUT`、`TAB`、`CONFIG`、`DIR`）
4. **元素** --- 具体的字符串（例如 `ADMIN_PANEL`、`NORTH`、`SAVE`）
5. **使用大写** --- 所有主要模组的惯例
6. **使用下划线**作为分隔符，不要使用空格或连字符

### 来自真实模组的示例

```
STR_MYMOD_INPUT_ADMIN_PANEL       -- MyMod：按键绑定标签
STR_MYMOD_CLOSE                   -- MyMod：通用"关闭"按钮
STR_MYMOD_DIR_NORTH                  -- MyMod：指南针方向
STR_MYMOD_TAB_ONLINE                 -- MyMod：管理面板标签名称
STR_COT_ESP_MODULE_NAME            -- COT：模块显示名称
STR_COT_CAMERA_MODULE_BLUR         -- COT：相机工具标签
STR_EXPANSION_ATM                  -- Expansion：功能名称
STR_EXPANSION_AI_COMMAND_MENU      -- Expansion：输入标签
```

### 反模式

```
STR_hello_world          -- 错误：小写，没有模组前缀
MY_STRING                -- 错误：缺少 STR_ 前缀
STR_MYMOD Hello World    -- 错误：键中有空格
```

---

## 引用字符串

在三种不同的上下文中引用本地化字符串，每种使用略有不同的语法。

### 在布局文件中（.layout）

在键名前使用 `#` 前缀。引擎在控件创建时解析它。

```
TextWidgetClass MyLabel {
 text "#STR_MYMOD_CLOSE"
 size 100 30
}
```

`#` 前缀告诉布局解析器"这是一个本地化键，不是字面文本。"

### 在 Enforce Script 中（.c 文件）

使用 `Widget.TranslateString()` 在运行时解析键。参数中需要 `#` 前缀。

```c
string translated = Widget.TranslateString("#STR_MYMOD_CLOSE");
// translated == "Close"（如果玩家语言是英语）
// translated == "Fechar"（如果玩家语言是葡萄牙语）
```

你也可以直接设置控件文本：

```c
TextWidget label = TextWidget.Cast(layoutRoot.FindAnyWidget("MyLabel"));
label.SetText(Widget.TranslateString("#STR_MYMOD_ADMIN_PANEL"));
```

或者直接在控件文本属性中使用字符串键，引擎会自动解析：

```c
label.SetText("#STR_MYMOD_ADMIN_PANEL");  // 也可以 -- 引擎自动解析
```

### 在 inputs.xml 中

使用 `loc` 属性，**不带** `#` 前缀。

```xml
<input name="UAMyAction" loc="STR_MYMOD_INPUT_MY_ACTION" />
```

这是唯一省略 `#` 的地方。输入系统在内部自动添加它。

### 总结表

| 上下文 | 语法 | 示例 |
|--------|------|------|
| 布局文件 `text` 属性 | `#STR_KEY` | `text "#STR_MYMOD_CLOSE"` |
| 脚本 `TranslateString()` | `"#STR_KEY"` | `Widget.TranslateString("#STR_MYMOD_CLOSE")` |
| 脚本控件文本 | `"#STR_KEY"` | `label.SetText("#STR_MYMOD_CLOSE")` |
| inputs.xml `loc` 属性 | `STR_KEY`（无 #） | `loc="STR_MYMOD_INPUT_ADMIN_PANEL"` |

---

## 创建新的 Stringtable

### 第一步：创建文件

在模组 PBO 内容目录的根目录下创建 `stringtable.csv`。引擎会扫描所有已加载的 PBO，寻找名为 `stringtable.csv` 的文件。

典型放置位置：

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      config.cpp
      stringtable.csv        <-- 放在这里
      Scripts/
        3_Game/
        4_World/
        5_Mission/
```

### 第二步：编写表头

从完整的 15 列表头开始：

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
```

### 第三步：添加字符串

每个可翻译的字符串添加一行。先从英语开始，随着翻译的完成再填入其他语言：

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_TITLE","My Cool Mod","My Cool Mod","","","","","","","","","","","","",
"STR_MYMOD_OPEN","Open","Open","Otevřít","Öffnen","Открыть","Otwórz","Megnyitás","Apri","Abrir","Ouvrir","打开","開く","Abrir","打开",
```

### 第四步：打包和测试

构建你的 PBO。启动游戏。验证 `Widget.TranslateString("#STR_MYMOD_TITLE")` 在脚本日志中返回 "My Cool Mod"。在设置中更改游戏语言以验证回退行为。

---

## 空单元格处理和回退行为

当引擎为玩家当前语言查找字符串键并发现空单元格时，它会按照回退链进行：

1. **玩家所选的语言列** --- 首先检查
2. **`english` 列** --- 如果玩家的语言单元格为空
3. **`original` 列** --- 如果 `english` 也为空
4. **原始键名** --- 如果所有列都为空，引擎显示键本身（例如 `STR_MYMOD_TITLE`）

这意味着你可以在开发期间安全地将非英语列留空。说英语的玩家看到 `english` 列，其他玩家在适当的翻译添加之前看到英语回退。

### 实际影响

你不需要将英语文本复制到每一列作为占位符。将未翻译的单元格留空：

```csv
"STR_MYMOD_HELLO","Hello","Hello","","","","","","","","","","","","",
```

语言设置为德语的玩家会看到 "Hello"（英语回退），直到提供德语翻译。

---

## 多语言工作流

### 对于独立开发者

1. 用英语编写所有字符串（`original` 和 `english` 列都填写）。
2. 发布模组。英语作为通用回退。
3. 随着社区成员志愿提供翻译，填入其他列。
4. 重新构建并发布更新。

### 对于有翻译人员的团队

1. 在共享仓库或电子表格中维护 CSV。
2. 每种语言分配一名翻译人员。
3. 将 `original` 列用于作者的母语（例如巴西开发者用葡萄牙语）。
4. `english` 列始终填写 --- 它是国际化的基准。
5. 使用 diff 工具跟踪上次翻译以来添加了哪些键。

### 使用电子表格软件

CSV 文件可以在 Excel、Google Sheets 或 LibreOffice Calc 中直接打开。注意这些陷阱：

- **Excel 可能会添加 BOM（字节顺序标记）**到 UTF-8 文件。DayZ 可以处理 BOM，但它可能在某些工具中引起问题。保存为 "CSV UTF-8" 以确保安全。
- **Excel 自动格式化**可能会损坏看起来像日期或数字的字段。
- **行尾符**：DayZ 同时接受 `\r\n`（Windows）和 `\n`（Unix）。

---

## 模块化 Stringtable 方式（DayZ Expansion）

DayZ Expansion 展示了大型模组的最佳实践：将翻译按功能模块拆分到多个 stringtable 文件中。他们的结构在 `languagecore` 目录中使用了 20 个单独的 stringtable 文件：

```
DayZExpansion/
  languagecore/
    AI/stringtable.csv
    BaseBuilding/stringtable.csv
    Book/stringtable.csv
    Chat/stringtable.csv
    Core/stringtable.csv
    Garage/stringtable.csv
    Groups/stringtable.csv
    Hardline/stringtable.csv
    Licensed/stringtable.csv
    Main/stringtable.csv
    MapAssets/stringtable.csv
    Market/stringtable.csv
    Missions/stringtable.csv
    Navigation/stringtable.csv
    PersonalStorage/stringtable.csv
    PlayerList/stringtable.csv
    Quests/stringtable.csv
    SpawnSelection/stringtable.csv
    Vehicles/stringtable.csv
    Weapons/stringtable.csv
```

### 为什么要拆分？

- **可管理性**：大型模组的单个 stringtable 可能增长到数千行。按功能模块拆分使每个文件都可管理。
- **独立更新**：翻译人员可以一次处理一个模块，避免合并冲突。
- **条件包含**：每个子模组的 PBO 仅包含其自身功能的 stringtable，使 PBO 体积更小。

### 工作原理

引擎扫描每个已加载的 PBO 以查找 `stringtable.csv`。由于每个 Expansion 子模块都打包到自己的 PBO 中，每个 PBO 自然只包含自己的 stringtable。不需要特殊配置 --- 只需将文件命名为 `stringtable.csv` 并放在 PBO 内即可。

键名仍然使用全局前缀（`STR_EXPANSION_`）以避免冲突。

---

## 实际示例

### MyMod Core

MyMod Core 使用完整的 15 列格式，`original` 语言为葡萄牙语（开发团队的母语），并为所有 13 种支持的语言提供了全面的翻译：

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_INPUT_GROUP","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod",
"STR_MYMOD_INPUT_ADMIN_PANEL","Painel Admin","Open Admin Panel","Otevřít Admin Panel","Admin-Panel öffnen","Открыть Админ Панель","Otwórz Panel Admina","Admin Panel megnyitása","Apri Pannello Admin","Abrir Panel Admin","Ouvrir le Panneau Admin","打开管理面板","管理パネルを開く","Abrir Painel Admin","打开管理面板",
"STR_MYMOD_CLOSE","Fechar","Close","Zavřít","Schließen","Закрыть","Zamknij","Bezárás","Chiudi","Cerrar","Fermer","关闭","閉じる","Fechar","关闭",
"STR_MYMOD_SAVE","Salvar","Save","Uložit","Speichern","Сохранить","Zapisz","Mentés","Salva","Guardar","Sauvegarder","保存","保存","Salvar","保存",
```

值得注意的模式：
- `original` 包含葡萄牙语文本（团队的母语）
- `english` 始终作为国际化基准填写
- 所有 13 种语言列都已填充

### COT（Community Online Tools）

COT 使用相同的 15 列格式。其键遵循 `STR_COT_MODULE_CATEGORY_ELEMENT` 模式：

```csv
Language,original,english,czech,german,russian,polish,hungarian,italian,spanish,french,chinese,japanese,portuguese,chinesesimp,
STR_COT_CAMERA_MODULE_BLUR,Blur:,Blur:,Rozmazání:,Weichzeichner:,Размытие:,Rozmycie:,Elmosódás:,Sfocatura:,Desenfoque:,Flou:,模糊:,ぼかし:,Desfoque:,模糊:,
STR_COT_ESP_MODULE_NAME,Camera Tools,Camera Tools,Nástroje kamery,Kamera-Werkzeuge,Камера,Narzędzia Kamery,Kamera Eszközök,Strumenti Camera,Herramientas de Cámara,Outils Caméra,相機工具,カメラツール,Ferramentas da Câmera,相机工具,
```

### VPP Admin Tools

VPP 使用精简的列集（13 列，没有 `hungarian` 列），且键不以 `STR_` 为前缀：

```csv
"Language","original","english","czech","german","russian","polish","italian","spanish","french","chinese","japanese","portuguese","chinesesimp"
"vpp_focus_on_game","[Hold/2xTap] Focus On Game","[Hold/2xTap] Focus On Game","...","...","...","...","...","...","...","...","...","...","..."
```

这表明 `STR_` 前缀是惯例，不是要求。然而，省略它意味着你不能在布局文件中使用 `#` 前缀解析。VPP 仅通过脚本代码引用这些键。强烈建议所有新模组使用 `STR_` 前缀。

### MyMod Missions

MyMod Missions 使用不带引号的、无标准表头风格的 CSV（字段周围没有引号），并有一个额外的 `Korean` 列：

```csv
Language,English,Czech,German,Russian,Polish,Hungarian,Italian,Spanish,French,Chinese,Japanese,Portuguese,Korean
STR_MYMOD_MISSION_AVAILABLE,MISSION AVAILABLE,MISE K DISPOZICI,MISSION VERFÜGBAR,МИССИЯ ДОСТУПНА,...
```

值得注意：`original` 列不存在，且 `Korean` 作为额外语言添加。引擎忽略不认识的列名，所以 `Korean` 充当文档，直到官方韩语支持被添加。

---

## 常见错误

### 在脚本中忘记 `#` 前缀

```c
// 错误 -- 显示原始键，而不是翻译
label.SetText("STR_MYMOD_HELLO");

// 正确
label.SetText("#STR_MYMOD_HELLO");
```

### 在 inputs.xml 中使用 `#`

```xml
<!-- 错误 -- 输入系统在内部自动添加 # -->
<input name="UAMyAction" loc="#STR_MYMOD_MY_ACTION" />

<!-- 正确 -->
<input name="UAMyAction" loc="STR_MYMOD_MY_ACTION" />
```

### 跨模组的重复键

如果两个模组都定义了 `STR_CLOSE`，引擎使用最后加载的 PBO 中的那个。始终使用模组前缀：

```csv
"STR_MYMOD_CLOSE","Close","Close",...
```

### 列数不匹配

如果一行的列数少于表头，引擎可能会静默跳过它或为缺失的列分配空字符串。始终确保每行与表头具有相同数量的字段。

### BOM 问题

一些文本编辑器会在文件开头插入 UTF-8 BOM（字节顺序标记）。这可能导致 CSV 中的第一个键被静默破坏。如果你的第一个字符串键从未解析成功，请检查并删除 BOM。

### 在未加引号的字段中使用逗号

```csv
STR_MYMOD_MSG,Hello, World,Hello, World,...
```

这会破坏解析，因为 `Hello` 和 ` World` 被读取为不同的列。要么给字段加引号，要么避免在值中使用逗号：

```csv
"STR_MYMOD_MSG","Hello, World","Hello, World",...
```

---

## 最佳实践

- 始终为每个键使用 `STR_MODNAME_` 前缀。这可以防止多个模组同时加载时的冲突。
- 给 CSV 中的每个字段加引号，即使内容没有逗号。这可以防止其他语言的翻译包含逗号或特殊字符时出现微妙的解析错误。
- 为每个键填写 `english` 列，即使你的母语不同。英语是通用回退，也是社区翻译人员的基准。
- 小型模组每个 PBO 保持一个 stringtable。对于拥有 500 多个键的大型模组，按功能拆分到单独 PBO 中的 stringtable 文件（遵循 Expansion 模式）。
- 将文件保存为不带 BOM 的 UTF-8。如果使用 Excel，请在导出时明确选择 "CSV UTF-8" 格式。

---

## 理论与实践

> 文档所述与运行时实际工作方式的对比。

| 概念 | 理论 | 现实 |
|------|------|------|
| 列顺序无关紧要 | 引擎通过表头名称识别列 | 确实如此，但一些社区工具和电子表格导出会重新排序列。保持标准顺序可避免混乱 |
| 回退链：语言 > english > original > 原始键 | 文档记录的级联 | 如果 `english` 和 `original` 都为空，引擎显示去掉 `#` 前缀的原始键 -- 有助于在游戏中发现缺失的翻译 |
| `Widget.TranslateString()` | 在调用时解析 | 结果在每次会话中被缓存。更改游戏语言需要重启才能更新 stringtable 查找 |
| 多个模组使用相同的键 | 最后加载的 PBO 优先 | PBO 加载顺序在模组之间不保证。如果两个模组定义了 `STR_CLOSE`，显示的文本取决于哪个模组最后加载 -- 始终使用模组前缀 |
| `SetText()` 中的 `#` 前缀 | 引擎自动解析本地化键 | 可以正常工作，但仅在第一次调用时。如果你调用 `SetText("#STR_KEY")` 然后调用 `SetText("literal text")`，再切换回 `SetText("#STR_KEY")` 也能正常工作 -- 控件级别没有缓存问题 |

---

## 兼容性和影响

- **多模组：** 字符串键冲突是主要风险。两个模组定义 `STR_ADMIN_PANEL` 会静默冲突。始终用模组名称作为键的前缀（`STR_MYMOD_ADMIN_PANEL`）。
- **性能：** Stringtable 查找很快（基于哈希）。跨多个模组拥有数千个键对性能没有可测量的影响。整个 stringtable 在启动时加载到内存中。
- **版本：** 基于 CSV 的 stringtable 格式自 DayZ Standalone alpha 以来未曾改变。15 列布局和回退行为在所有版本中保持稳定。
