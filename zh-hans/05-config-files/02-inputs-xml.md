# 第5.2章：inputs.xml --- 自定义按键绑定

[首页](../README.md) | [<< 上一章：stringtable.csv](01-stringtable.md) | **inputs.xml** | [下一章：Credits.json >>](03-credits-json.md)

---

> **概要：** `inputs.xml` 文件让你的模组注册自定义按键绑定，这些绑定会出现在玩家的控制设置菜单中。玩家可以像原版操作一样查看、重新绑定和切换这些输入。这是为 DayZ 模组添加快捷键的标准机制。

---

## 目录

- [概述](#overview)
- [文件位置](#file-location)
- [完整 XML 结构](#complete-xml-structure)
- [Actions 块](#actions-block)
- [Sorting 块](#sorting-block)
- [Preset 块（默认按键绑定）](#preset-block-default-keybindings)
- [修饰键组合](#modifier-combos)
- [隐藏输入](#hidden-inputs)
- [多个默认按键](#multiple-default-keys)
- [在脚本中访问输入](#accessing-inputs-in-script)
- [输入方法参考](#input-methods-reference)
- [抑制和禁用输入](#suppressing-and-disabling-inputs)
- [按键名称参考](#key-names-reference)
- [实际示例](#real-examples)
- [常见错误](#common-mistakes)

---

## 概述

当你的模组需要玩家按下按键 --- 打开菜单、切换功能、指挥 AI 单位 --- 你在 `inputs.xml` 中注册自定义输入动作。引擎在启动时读取此文件，并将你的动作集成到通用输入系统中。玩家可以在游戏的 设置 > 控制 菜单中看到你的按键绑定，分组在你定义的标题下。

自定义输入由唯一的动作名称标识（惯例以 `UA` 为前缀，代表 "User Action"），并且可以设置默认按键绑定，玩家可以自由重新绑定。

---

## 文件位置

将 `inputs.xml` 放在 Scripts 目录的 `data` 子文件夹中：

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      Scripts/
        data/
          inputs.xml        <-- 放在这里
        3_Game/
        4_World/
        5_Mission/
```

一些模组直接放在 `Scripts/` 文件夹中。两种位置都可以。引擎会自动发现该文件 --- 不需要在 config.cpp 中注册。

---

## 完整 XML 结构

`inputs.xml` 文件有三个部分，全部包裹在 `<modded_inputs>` 根元素中：

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <!-- 动作定义放在这里 -->
        </actions>

        <sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
            <!-- 设置菜单的排序顺序 -->
        </sorting>
    </inputs>
    <preset>
        <!-- 默认按键分配放在这里 -->
    </preset>
</modded_inputs>
```

三个部分 --- `<actions>`、`<sorting>` 和 `<preset>` --- 协同工作，但各自服务不同的目的。

---

## Actions 块

`<actions>` 块声明你的模组提供的每个输入动作。每个动作是一个 `<input>` 元素。

### 语法

```xml
<actions>
    <input name="UAMyModOpenMenu" loc="STR_MYMOD_INPUT_OPEN_MENU" />
    <input name="UAMyModToggleHUD" loc="STR_MYMOD_INPUT_TOGGLE_HUD" />
</actions>
```

### 属性

| 属性 | 必需 | 描述 |
|------|------|------|
| `name` | 是 | 唯一的动作标识符。惯例：以 `UA`（User Action）为前缀。在脚本中用于轮询此输入。 |
| `loc` | 否 | 控制菜单中显示名称的 stringtable 键。**不带 `#` 前缀** --- 系统会自动添加。 |
| `visible` | 否 | 设置为 `"false"` 以从控制菜单中隐藏。默认为 `true`。 |

### 命名规范

动作名称必须在所有已加载的模组中全局唯一。使用你的模组前缀：

```xml
<input name="UAMyModAdminPanel" loc="STR_MYMOD_INPUT_ADMIN_PANEL" />
<input name="UAExpansionBookToggle" loc="STR_EXPANSION_BOOK_TOGGLE" />
<input name="eAICommandMenu" loc="STR_EXPANSION_AI_COMMAND_MENU" />
```

`UA` 前缀是惯例但不是强制的。Expansion AI 使用 `eAI` 作为前缀，同样有效。

---

## Sorting 块

`<sorting>` 块控制你的输入在玩家的控制设置中如何显示。它定义一个命名组（成为区域标题）并按显示顺序列出输入。

### 语法

```xml
<sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
    <input name="UAMyModOpenMenu" />
    <input name="UAMyModToggleHUD" />
    <input name="UAMyModSpecialAction" />
</sorting>
```

### 属性

| 属性 | 必需 | 描述 |
|------|------|------|
| `name` | 是 | 此排序组的内部标识符 |
| `loc` | 是 | 设置 > 控制 中显示的组标题的 stringtable 键 |

### 显示效果

在控制设置中，玩家会看到：

```
[MyMod]                          <-- 来自 sorting 的 loc
  Open Menu .............. [Y]   <-- 来自 input 的 loc + preset
  Toggle HUD ............. [H]   <-- 来自 input 的 loc + preset
```

只有在 `<sorting>` 块中列出的输入才会出现在设置菜单中。在 `<actions>` 中定义但未在 `<sorting>` 中列出的输入会被静默注册但对玩家不可见（即使 `visible` 未明确设置为 `false`）。

---

## Preset 块（默认按键绑定）

`<preset>` 块为你的动作分配默认按键。这些是玩家在任何自定义之前的初始按键。

### 简单按键绑定

```xml
<preset>
    <input name="UAMyModOpenMenu">
        <btn name="kY"/>
    </input>
</preset>
```

这将 `Y` 键绑定为 `UAMyModOpenMenu` 的默认键。

### 无默认按键

如果你从 `<preset>` 块中省略一个动作，它就没有默认绑定。玩家必须在 设置 > 控制 中手动分配按键。这适用于可选或高级绑定。

---

## 修饰键组合

要要求修饰键（Ctrl、Shift、Alt），嵌套 `<btn>` 元素：

### Ctrl + 鼠标左键

```xml
<input name="eAISetWaypoint">
    <btn name="kLControl">
        <btn name="mBLeft"/>
    </btn>
</input>
```

外层 `<btn>` 是修饰键；内层 `<btn>` 是主键。玩家必须按住修饰键然后按主键。

### Shift + 按键

```xml
<input name="UAMyModQuickAction">
    <btn name="kLShift">
        <btn name="kQ"/>
    </btn>
</input>
```

### 嵌套规则

- **外层** `<btn>` 始终是修饰键（按住）
- **内层** `<btn>` 是触发键（按住修饰键时按下）
- 通常只使用一层嵌套；更深层的嵌套未经测试，不推荐

---

## 隐藏输入

使用 `visible="false"` 注册玩家无法在控制菜单中看到或重新绑定的输入。这对于模组代码使用的内部输入很有用，不应由玩家配置。

```xml
<actions>
    <input name="eAITestInput" visible="false" />
    <input name="UAExpansionConfirm" loc="" visible="false" />
</actions>
```

隐藏输入仍然可以在 `<preset>` 块中设置默认按键：

```xml
<preset>
    <input name="eAITestInput">
        <btn name="kY"/>
    </input>
</preset>
```

---

## 多个默认按键

一个动作可以有多个默认按键。将多个 `<btn>` 元素作为兄弟元素列出：

```xml
<input name="UAExpansionConfirm">
    <btn name="kReturn" />
    <btn name="kNumpadEnter" />
</input>
```

`Enter` 和 `Numpad Enter` 都将触发 `UAExpansionConfirm`。这对于多个物理按键应映射到同一逻辑动作的情况很有用。

---

## 在脚本中访问输入

### 获取输入 API

所有输入访问都通过 `GetUApi()` 进行，它返回全局用户动作 API：

```c
UAInput input = GetUApi().GetInputByName("UAMyModOpenMenu");
```

### 在 OnUpdate 中轮询

自定义输入通常在 `MissionGameplay.OnUpdate()` 或类似的每帧回调中轮询：

```c
modded class MissionGameplay
{
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        UAInput input = GetUApi().GetInputByName("UAMyModOpenMenu");

        if (input.LocalPress())
        {
            // 按键在此帧被按下
            OpenMyModMenu();
        }
    }
}
```

### 替代方式：直接使用输入名称

许多模组使用 `UAInputAPI` 方法和字符串名称内联检查输入：

```c
override void OnUpdate(float timeslice)
{
    super.OnUpdate(timeslice);

    Input input = GetGame().GetInput();

    if (input.LocalPress("UAMyModOpenMenu", false))
    {
        OpenMyModMenu();
    }
}
```

`LocalPress("name", false)` 中的 `false` 参数表示该检查不应消耗输入事件。

---

## 输入方法参考

一旦你有了 `UAInput` 引用（来自 `GetUApi().GetInputByName()`），或者直接使用 `Input` 类，这些方法可以检测不同的输入状态：

| 方法 | 返回值 | 何时为 True |
|------|--------|-------------|
| `LocalPress()` | `bool` | 按键在**此帧**被按下（按键按下时的单次触发） |
| `LocalRelease()` | `bool` | 按键在**此帧**被释放（按键释放时的单次触发） |
| `LocalClick()` | `bool` | 按键被快速按下和释放（点击） |
| `LocalHold()` | `bool` | 按键已被按住超过阈值时间 |
| `LocalDoubleClick()` | `bool` | 按键被快速点击两次 |
| `LocalValue()` | `float` | 当前模拟值（数字键为 0.0 或 1.0；模拟轴为可变值） |

### 使用模式

**按下切换：**
```c
if (input.LocalPress("UAMyModToggle", false))
{
    m_IsEnabled = !m_IsEnabled;
}
```

**按住激活，释放停用：**
```c
if (input.LocalPress("eAICommandMenu", false))
{
    ShowCommandWheel();
}

if (input.LocalRelease("eAICommandMenu", false) || input.LocalValue("eAICommandMenu", false) == 0)
{
    HideCommandWheel();
}
```

**双击动作：**
```c
if (input.LocalDoubleClick("UAMyModSpecial", false))
{
    PerformSpecialAction();
}
```

**长按扩展动作：**
```c
if (input.LocalHold("UAExpansionGPSToggle"))
{
    ToggleGPSMode();
}
```

---

## 抑制和禁用输入

### ForceDisable

临时禁用特定输入。通常在打开菜单时使用，以防止 UI 激活时触发游戏动作：

```c
// 菜单打开时禁用输入
GetUApi().GetInputByName("UAMyModToggle").ForceDisable(true);

// 菜单关闭时重新启用
GetUApi().GetInputByName("UAMyModToggle").ForceDisable(false);
```

### SupressNextFrame

抑制下一帧的所有输入处理。在输入上下文转换时使用（例如关闭菜单），以防止单帧输入泄漏：

```c
GetUApi().SupressNextFrame(true);
```

### UpdateControls

修改输入状态后，调用 `UpdateControls()` 以立即应用更改：

```c
GetUApi().GetInputByName("UAExpansionBookToggle").ForceDisable(false);
GetUApi().UpdateControls();
```

### 输入排除

原版任务系统提供排除组。当菜单激活时，你可以排除类别的输入：

```c
// 背包打开时抑制游戏输入
AddActiveInputExcludes({"inventory"});

// 关闭时恢复
RemoveActiveInputExcludes({"inventory"});
```

---

## 按键名称参考

在 `<btn name="">` 属性中使用的按键名称遵循特定的命名规范。以下是完整参考。

### 键盘按键

| 类别 | 按键名称 |
|------|----------|
| 字母 | `kA`, `kB`, `kC`, `kD`, `kE`, `kF`, `kG`, `kH`, `kI`, `kJ`, `kK`, `kL`, `kM`, `kN`, `kO`, `kP`, `kQ`, `kR`, `kS`, `kT`, `kU`, `kV`, `kW`, `kX`, `kY`, `kZ` |
| 数字（顶行） | `k0`, `k1`, `k2`, `k3`, `k4`, `k5`, `k6`, `k7`, `k8`, `k9` |
| 功能键 | `kF1`, `kF2`, `kF3`, `kF4`, `kF5`, `kF6`, `kF7`, `kF8`, `kF9`, `kF10`, `kF11`, `kF12` |
| 修饰键 | `kLControl`, `kRControl`, `kLShift`, `kRShift`, `kLAlt`, `kRAlt` |
| 导航 | `kUp`, `kDown`, `kLeft`, `kRight`, `kHome`, `kEnd`, `kPageUp`, `kPageDown` |
| 编辑 | `kReturn`, `kBackspace`, `kDelete`, `kInsert`, `kSpace`, `kTab`, `kEscape` |
| 数字键盘 | `kNumpad0` ... `kNumpad9`, `kNumpadEnter`, `kNumpadPlus`, `kNumpadMinus`, `kNumpadMultiply`, `kNumpadDivide`, `kNumpadDecimal` |
| 标点符号 | `kMinus`, `kEquals`, `kLBracket`, `kRBracket`, `kBackslash`, `kSemicolon`, `kApostrophe`, `kComma`, `kPeriod`, `kSlash`, `kGrave` |
| 锁定键 | `kCapsLock`, `kNumLock`, `kScrollLock` |

### 鼠标按钮

| 名称 | 按钮 |
|------|------|
| `mBLeft` | 鼠标左键 |
| `mBRight` | 鼠标右键 |
| `mBMiddle` | 鼠标中键（滚轮点击） |
| `mBExtra1` | 鼠标按钮 4（侧键后退） |
| `mBExtra2` | 鼠标按钮 5（侧键前进） |

### 鼠标轴

| 名称 | 轴 |
|------|------|
| `mAxisX` | 鼠标水平移动 |
| `mAxisY` | 鼠标垂直移动 |
| `mWheelUp` | 滚轮向上 |
| `mWheelDown` | 滚轮向下 |

### 命名模式

- **键盘**：`k` 前缀 + 键名（例如 `kT`、`kF5`、`kLControl`）
- **鼠标按钮**：`mB` 前缀 + 按钮名（例如 `mBLeft`、`mBRight`）
- **鼠标轴**：`m` 前缀 + 轴名（例如 `mAxisX`、`mWheelUp`）

---

## 实际示例

### DayZ Expansion AI

一个结构良好的 inputs.xml，包含可见的按键绑定、隐藏的调试输入和修饰键组合：

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="eAICommandMenu" loc="STR_EXPANSION_AI_COMMAND_MENU"/>
            <input name="eAISetWaypoint" loc="STR_EXPANSION_AI_SET_WAYPOINT"/>
            <input name="eAITestInput" visible="false" />
            <input name="eAITestLRIncrease" visible="false" />
            <input name="eAITestLRDecrease" visible="false" />
            <input name="eAITestUDIncrease" visible="false" />
            <input name="eAITestUDDecrease" visible="false" />
        </actions>

        <sorting name="expansion" loc="STR_EXPANSION_LABEL">
            <input name="eAICommandMenu" />
            <input name="eAISetWaypoint" />
            <input name="eAITestInput" />
            <input name="eAITestLRIncrease" />
            <input name="eAITestLRDecrease" />
            <input name="eAITestUDIncrease" />
            <input name="eAITestUDDecrease" />
        </sorting>
    </inputs>
    <preset>
        <input name="eAICommandMenu">
            <btn name="kT"/>
        </input>
        <input name="eAISetWaypoint">
            <btn name="kLControl">
                <btn name="mBLeft"/>
            </btn>
        </input>
        <input name="eAITestInput">
            <btn name="kY"/>
        </input>
        <input name="eAITestLRIncrease">
            <btn name="kRight"/>
        </input>
        <input name="eAITestLRDecrease">
            <btn name="kLeft"/>
        </input>
        <input name="eAITestUDIncrease">
            <btn name="kUp"/>
        </input>
        <input name="eAITestUDDecrease">
            <btn name="kDown"/>
        </input>
    </preset>
</modded_inputs>
```

关键观察：
- `eAICommandMenu` 绑定到 `T` --- 在设置中可见，玩家可以重新绑定
- `eAISetWaypoint` 使用 **Ctrl + 鼠标左键** 修饰键组合
- 测试输入设置为 `visible="false"` --- 对玩家隐藏但在代码中可访问

### DayZ Expansion Market

一个最小化的 inputs.xml，用于隐藏的实用输入，带有多个默认按键：

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAExpansionConfirm" loc="" visible="false" />
        </actions>
    </inputs>
    <preset>
        <input name="UAExpansionConfirm">
            <btn name="kReturn" />
            <btn name="kNumpadEnter" />
        </input>
    </preset>
</modded_inputs>
```

关键观察：
- 隐藏输入（`visible="false"`），`loc` 为空 --- 永不在设置中显示
- 两个默认按键：Enter 和 Numpad Enter 都触发同一动作
- 没有 `<sorting>` 块 --- 因为输入是隐藏的所以不需要

### 完整入门模板

一个最小但完整的新模组模板：

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAMyModOpenMenu" loc="STR_MYMOD_INPUT_OPEN_MENU" />
            <input name="UAMyModQuickAction" loc="STR_MYMOD_INPUT_QUICK_ACTION" />
        </actions>

        <sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
            <input name="UAMyModOpenMenu" />
            <input name="UAMyModQuickAction" />
        </sorting>
    </inputs>
    <preset>
        <input name="UAMyModOpenMenu">
            <btn name="kF6"/>
        </input>
        <!-- UAMyModQuickAction 没有默认按键；玩家必须自行绑定 -->
    </preset>
</modded_inputs>
```

配套的 stringtable.csv：

```csv
"Language","original","english"
"STR_MYMOD_INPUT_GROUP","My Mod","My Mod"
"STR_MYMOD_INPUT_OPEN_MENU","Open Menu","Open Menu"
"STR_MYMOD_INPUT_QUICK_ACTION","Quick Action","Quick Action"
```

---

## 常见错误

### 在 loc 属性中使用 `#`

```xml
<!-- 错误 -->
<input name="UAMyAction" loc="#STR_MYMOD_ACTION" />

<!-- 正确 -->
<input name="UAMyAction" loc="STR_MYMOD_ACTION" />
```

输入系统在内部自动添加 `#`。你自己添加会导致双前缀，查找失败。

### 动作名称冲突

如果两个模组定义了 `UAOpenMenu`，只有一个能工作。始终使用你的模组前缀：

```xml
<input name="UAMyModOpenMenu" />     <!-- 好 -->
<input name="UAOpenMenu" />          <!-- 有风险 -->
```

### 缺少 Sorting 条目

如果你在 `<actions>` 中定义了一个动作但忘记在 `<sorting>` 中列出，该动作在代码中可以工作但在控制菜单中不可见。玩家无法重新绑定它。

### 忘记在 Actions 中定义

如果你在 `<sorting>` 或 `<preset>` 中列出了一个输入但从未在 `<actions>` 中定义它，引擎会静默忽略它。

### 绑定冲突的按键

选择与原版绑定冲突的按键（如 `W`、`A`、`S`、`D`、`Tab`、`I`）会导致你的动作和原版动作同时触发。使用不太常用的按键（F5-F12、数字键盘按键）或修饰键组合以确保安全。

---

## 最佳实践

- 始终用 `UA` + 你的模组名称作为动作名称前缀（例如 `UAMyModOpenMenu`）。通用名称如 `UAOpenMenu` 会与其他模组冲突。
- 为每个可见输入提供 `loc` 属性并定义对应的 stringtable 键。没有它，控制菜单会显示原始动作名称。
- 选择不常用的默认按键（F5-F12、数字键盘）或修饰键组合（Ctrl+按键），以最大程度减少与原版和流行模组按键绑定的冲突。
- 始终在 `<sorting>` 块中列出可见的输入。在 `<actions>` 中定义但 `<sorting>` 中缺少的输入对玩家不可见，无法被重新绑定。
- 将 `GetUApi().GetInputByName()` 的 `UAInput` 引用缓存在成员变量中，而不是在 `OnUpdate` 中每帧都调用。字符串查找有开销。

---

## 理论与实践

> 文档所述与运行时实际工作方式的对比。

| 概念 | 理论 | 现实 |
|------|------|------|
| `visible="false"` 从控制菜单中隐藏 | 输入被注册但不可见 | 在某些 DayZ 版本中，隐藏输入仍然出现在 `<sorting>` 块列表中。从 `<sorting>` 中省略是隐藏输入的可靠方式 |
| `LocalPress()` 每次按键按下触发一次 | 在按键被按下的帧上的单次触发 | 如果游戏卡顿（低帧率），`LocalPress()` 可能完全被错过。对于关键操作，也检查 `LocalValue() > 0` 作为后备 |
| 通过嵌套 `<btn>` 实现修饰键组合 | 外层是修饰键，内层是触发键 | 修饰键本身也会在自己的输入上注册为按下（例如 `kLControl` 也是原版蹲下键）。玩家按住 Ctrl+点击 也会蹲下 |
| `ForceDisable(true)` 抑制输入 | 输入被完全忽略 | `ForceDisable` 持续到被明确重新启用。如果你的模组崩溃或 UI 关闭时没有调用 `ForceDisable(false)`，输入会保持禁用状态直到游戏重启 |
| 多个 `<btn>` 兄弟元素 | 两个按键触发同一动作 | 正常工作，但控制菜单只显示第一个按键。玩家可以看到并重新绑定第一个按键，但可能不知道第二个默认按键的存在 |

---

## 兼容性和影响

- **多模组：** 动作名称冲突是主要风险。如果两个模组定义了 `UAOpenMenu`，只有一个能工作，且冲突是静默的。对于跨模组的重复动作名称，引擎不会发出警告。
- **性能：** 通过 `GetUApi().GetInputByName()` 进行输入轮询涉及字符串哈希查找。每帧轮询 5-10 个输入的开销可以忽略不计，但对于有许多输入的模组，仍建议缓存 `UAInput` 引用。
- **版本：** `inputs.xml` 格式和 `<modded_inputs>` 结构自 DayZ 1.0 以来一直稳定。`visible` 属性是后来添加的（大约 1.08）-- 在旧版本中，所有输入始终在控制菜单中可见。

---

## 在真实模组中的应用

| 模式 | 模组 | 详情 |
|------|------|------|
| 修饰键组合 `Ctrl+点击` | Expansion AI | `eAISetWaypoint` 使用嵌套的 `<btn name="kLControl"><btn name="mBLeft"/>` 实现 Ctrl+左键点击放置 AI 路径点 |
| 隐藏实用输入 | Expansion Market | `UAExpansionConfirm` 设置为 `visible="false"`，带有双按键（Enter + Numpad Enter）用于内部确认逻辑 |
| 菜单打开时的 `ForceDisable` | COT、VPP | 管理面板打开时对游戏输入调用 `ForceDisable(true)`，关闭时调用 `ForceDisable(false)` 以防止打字时角色移动 |
| 在成员变量中缓存 `UAInput` | DabsFramework | 在初始化期间将 `GetUApi().GetInputByName()` 的结果存储在类字段中，在 `OnUpdate` 中轮询缓存的引用以避免每帧字符串查找 |
