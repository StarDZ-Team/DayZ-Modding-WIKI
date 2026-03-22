# 第 3.2 章：布局文件格式（.layout）

[首页](../README.md) | [<< 上一章：控件类型](01-widget-types.md) | **布局文件格式** | [下一章：尺寸与定位 >>](03-sizing-positioning.md)

---

DayZ 使用一种自定义的文本格式来定义 UI 布局文件。这些 `.layout` 文件**不是 XML** —— 它们使用类似 config.cpp 的花括号分隔格式。DayZ Workbench 编辑器可以生成这些文件，但理解其格式可以让你手动编辑布局并调试问题。

---

## 基本结构

`.layout` 文件定义了一个控件树。每个文件恰好有一个根控件，其中包含嵌套的子控件。

```
 WidgetTypeClass WidgetName {
 attribute value
 attribute "quoted value"
 {
  ChildWidgetTypeClass ChildName {
   attribute value
  }
 }
}
```

关键规则：

1. 根元素始终是一个单独的控件（通常是 `FrameWidgetClass`）。
2. 控件类型名称使用**布局类**名，始终以 `Class` 结尾（例如 `FrameWidgetClass`、`TextWidgetClass`、`ButtonWidgetClass`）。
3. 每个控件在其类型类名之后都有一个唯一名称。
4. 属性是 `key value` 键值对，每行一个。
5. 包含空格的属性名必须加引号：`"text halign" center`。
6. 字符串值需要加引号：`text "Hello World"`。
7. 数字值不加引号：`size 0.5 0.3`。
8. 子控件嵌套在父控件属性之后的 `{ }` 块中。

---

## 属性参考

### 定位与尺寸

| 属性 | 值 | 描述 |
|---|---|---|
| `position` | `x y` | 控件位置（比例 0-1 或像素值） |
| `size` | `w h` | 控件尺寸（比例 0-1 或像素值） |
| `halign` | `left_ref`、`center_ref`、`right_ref` | 水平对齐参考点 |
| `valign` | `top_ref`、`center_ref`、`bottom_ref` | 垂直对齐参考点 |
| `hexactpos` | `0` 或 `1` | 0 = 比例 X 位置，1 = 像素 X 位置 |
| `vexactpos` | `0` 或 `1` | 0 = 比例 Y 位置，1 = 像素 Y 位置 |
| `hexactsize` | `0` 或 `1` | 0 = 比例宽度，1 = 像素宽度 |
| `vexactsize` | `0` 或 `1` | 0 = 比例高度，1 = 像素高度 |
| `fixaspect` | `fixwidth`、`fixheight` | 通过约束一个维度来保持宽高比 |
| `scaled` | `0` 或 `1` | 随 DayZ UI 缩放设置进行缩放 |
| `priority` | 整数 | Z 轴顺序（值越大越在上层渲染） |

`hexactpos`、`vexactpos`、`hexactsize` 和 `vexactsize` 标志是整个布局系统中最重要的属性。它们控制每个维度是使用比例（0.0 - 1.0，相对于父控件）还是像素（绝对屏幕像素）单位。参见 [3.3 尺寸与定位](03-sizing-positioning.md) 获取详细说明。

### 视觉属性

| 属性 | 值 | 描述 |
|---|---|---|
| `visible` | `0` 或 `1` | 初始可见性（0 = 隐藏） |
| `color` | `r g b a` | 颜色，四个浮点数，每个 0.0 到 1.0 |
| `style` | 样式名称 | 预定义视觉样式（例如 `Default`、`Colorable`） |
| `draggable` | `0` 或 `1` | 控件可被用户拖动 |
| `clipchildren` | `0` 或 `1` | 将子控件裁剪到此控件的边界内 |
| `inheritalpha` | `0` 或 `1` | 子控件继承此控件的透明度值 |
| `keepsafezone` | `0` 或 `1` | 将控件保持在屏幕安全区域内 |

### 行为属性

| 属性 | 值 | 描述 |
|---|---|---|
| `ignorepointer` | `0` 或 `1` | 控件忽略鼠标输入（点击穿透） |
| `disabled` | `0` 或 `1` | 控件被禁用 |
| `"no focus"` | `0` 或 `1` | 控件无法获得键盘焦点 |

### 文本属性

这些属性适用于 `TextWidgetClass`、`RichTextWidgetClass`、`MultilineTextWidgetClass`、`ButtonWidgetClass` 及其他带文本的控件。

| 属性 | 值 | 描述 |
|---|---|---|
| `text` | `"string"` | 默认文本内容 |
| `font` | `"path/to/font"` | 字体文件路径 |
| `"text halign"` | `left`、`center`、`right` | 控件内文本的水平对齐 |
| `"text valign"` | `top`、`center`、`bottom` | 控件内文本的垂直对齐 |
| `"bold text"` | `0` 或 `1` | 粗体渲染 |
| `"italic text"` | `0` 或 `1` | 斜体渲染 |
| `"exact text"` | `0` 或 `1` | 使用精确像素字体大小而非比例 |
| `"exact text size"` | 整数 | 像素字体大小（需要 `"exact text" 1`） |
| `"size to text h"` | `0` 或 `1` | 调整控件宽度以适应文本 |
| `"size to text v"` | `0` 或 `1` | 调整控件高度以适应文本 |
| `"text sharpness"` | 浮点数 | 文本渲染锐度 |
| `wrap` | `0` 或 `1` | 启用自动换行 |

### 图像属性

这些属性适用于 `ImageWidgetClass`。

| 属性 | 值 | 描述 |
|---|---|---|
| `image0` | `"set:name image:name"` | 来自图像集的主图像 |
| `mode` | `blend`、`additive`、`stretch` | 图像混合模式 |
| `"src alpha"` | `0` 或 `1` | 使用源 Alpha 通道 |
| `stretch` | `0` 或 `1` | 拉伸图像以填满控件 |
| `filter` | `0` 或 `1` | 启用纹理过滤 |
| `"flip u"` | `0` 或 `1` | 水平翻转图像 |
| `"flip v"` | `0` 或 `1` | 垂直翻转图像 |
| `"clamp mode"` | `clamp`、`wrap` | 纹理边缘行为 |
| `"stretch mode"` | `stretch_w_h` 等 | 拉伸模式 |

### 间距器属性

这些属性适用于 `WrapSpacerWidgetClass` 和 `GridSpacerWidgetClass`。

| 属性 | 值 | 描述 |
|---|---|---|
| `Padding` | 整数 | 内边距（像素） |
| `Margin` | 整数 | 子项之间的间距（像素） |
| `"Size To Content H"` | `0` 或 `1` | 调整宽度以匹配子控件 |
| `"Size To Content V"` | `0` 或 `1` | 调整高度以匹配子控件 |
| `content_halign` | `left`、`center`、`right` | 子内容水平对齐 |
| `content_valign` | `top`、`center`、`bottom` | 子内容垂直对齐 |
| `Columns` | 整数 | 网格列数（仅 GridSpacer） |
| `Rows` | 整数 | 网格行数（仅 GridSpacer） |

### 按钮属性

| 属性 | 值 | 描述 |
|---|---|---|
| `switch` | `toggle` | 使按钮成为切换按钮（保持按下状态） |
| `style` | 样式名称 | 按钮的视觉样式 |

### fixaspect 值

`fixaspect` 属性控制控件如何保持其宽高比：

| 值 | 行为 |
|-------|----------|
| `0` | 无宽高比约束（默认） |
| `1`（fixwidth） | 宽度根据高度调整以保持宽高比 |
| `2`（fixheight） | 高度根据宽度调整以保持宽高比 |
| `3`（inside） | 在给定尺寸内适配，保持宽高比 |
| `4`（outside） | 填满给定尺寸，保持宽高比（可能裁剪） |

### 滑块属性

| 属性 | 值 | 描述 |
|---|---|---|
| `"fill in"` | `0` 或 `1` | 用颜色填充滑块轨道至滑块位置 |
| `"listen to input"` | `0` 或 `1` | 滑块是否响应输入 |

在脚本中，配置滑块的范围和值：

```c
SliderWidget slider;
slider.SetMinMax(0, 100);
slider.SetCurrent(50);
float val = slider.GetCurrent();
```

### 滚动属性

| 属性 | 值 | 描述 |
|---|---|---|
| `"Scrollbar V"` | `0` 或 `1` | 显示垂直滚动条 |
| `"Scrollbar H"` | `0` 或 `1` | 显示水平滚动条 |

---

## 脚本集成

### `scriptclass` 属性

`scriptclass` 属性将控件绑定到一个 Enforce Script 类。当布局被加载时，引擎会创建该类的实例并调用其 `OnWidgetScriptInit(Widget w)` 方法。

```
FrameWidgetClass MyPanel {
 size 1 1
 scriptclass "MyPanelHandler"
}
```

脚本类必须继承自 `Managed` 并实现 `OnWidgetScriptInit`：

```c
class MyPanelHandler : Managed
{
    Widget m_Root;

    void OnWidgetScriptInit(Widget w)
    {
        m_Root = w;
    }
}
```

### ScriptParamsClass 块

可以通过 `ScriptParamsClass` 块将参数从布局传递给 `scriptclass`。此块作为控件子控件之后的第二个 `{ }` 子块出现。

```
ImageWidgetClass Logo {
 image0 "set:dayz_gui image:DayZLogo"
 scriptclass "Bouncer"
 {
  ScriptParamsClass {
   amount 0.1
   speed 1
  }
 }
}
```

脚本类在 `OnWidgetScriptInit` 中通过控件的脚本参数系统读取这些参数。

### DabsFramework ViewBinding

在使用 DabsFramework MVC 的模组中，`scriptclass "ViewBinding"` 模式将控件连接到 ViewController 的数据属性：

```
TextWidgetClass StatusLabel {
 scriptclass "ViewBinding"
 "text halign" center
 {
  ScriptParamsClass {
   Binding_Name "StatusText"
   Two_Way_Binding 0
  }
 }
}
```

| 参数 | 描述 |
|---|---|
| `Binding_Name` | 要绑定的 ViewController 属性名 |
| `Two_Way_Binding` | `1` = UI 更改会推送回控制器 |
| `Relay_Command` | 当控件被点击/更改时调用的控制器函数名 |
| `Selected_Item` | 将选中项绑定到的属性（用于列表） |
| `Debug_Logging` | `1` = 为此绑定启用详细日志 |

---

## 子控件嵌套

子控件放置在父控件属性之后的 `{ }` 块中。同一个块中可以存在多个子控件。

```
FrameWidgetClass Parent {
 size 1 1
 {
  TextWidgetClass Child1 {
   position 0 0
   size 1 0.1
   text "First"
  }
  TextWidgetClass Child2 {
   position 0 0.1
   size 1 0.1
   text "Second"
  }
 }
}
```

子控件始终相对于其父控件定位。位置为 `position 0 0`、尺寸为 `size 1 1`（比例）的子控件会完全填满其父控件。

---

## 完整注释示例

以下是一个通知面板的完整注释布局文件 —— 你在模组中可能会构建的 UI 类型：

```
// 根容器 -- 不可见的框架，覆盖屏幕宽度的 30%
// 水平居中，位于屏幕顶部
FrameWidgetClass NotificationPanel {

 // 初始隐藏（脚本将显示它）
 visible 0

 // 不阻挡此面板后面的鼠标点击
 ignorepointer 1

 // 蓝色色调（R=0.2, G=0.6, B=1.0, A=0.9）
 color 0.2 0.6 1.0 0.9

 // 位置：距离左侧 0 像素，距离顶部 0 像素
 position 0 0
 hexactpos 1
 vexactpos 1

 // 尺寸：父控件宽度的 30%，高 30 像素
 size 0.3 30
 hexactsize 0
 vexactsize 1

 // 在父控件内水平居中
 halign center_ref

 // 子控件块
 {
  // 文本标签填满整个通知面板
  TextWidgetClass NotificationText {

   // 同样忽略鼠标输入
   ignorepointer 1

   // 相对于父控件的原点位置
   position 0 0
   hexactpos 1
   vexactpos 1

   // 完全填满父控件（比例）
   size 1 1
   hexactsize 0
   vexactsize 0

   // 文本双向居中
   "text halign" center
   "text valign" center

   // 使用粗体字体
   font "gui/fonts/Metron-Bold"

   // 默认文本（将被脚本覆盖）
   text "Notification"
  }
 }
}
```

以下是一个更复杂的示例 —— 带有标题栏、可滚动内容和关闭按钮的对话框：

```
WrapSpacerWidgetClass MyDialog {
 clipchildren 1
 color 0.7059 0.7059 0.7059 0.7843
 size 0.35 0
 halign center_ref
 valign center_ref
 priority 998
 style Outline_1px_BlackBackground
 Padding 5
 "Size To Content H" 1
 "Size To Content V" 1
 content_halign center
 {
  // 标题栏行
  FrameWidgetClass TitleBarRow {
   size 1 26
   hexactsize 0
   vexactsize 1
   draggable 1
   {
    PanelWidgetClass TitleBar {
     color 0.4196 0.6471 1 0.9412
     size 1 25
     style rover_sim_colorable
     {
      TextWidgetClass TitleText {
       size 0.85 0.9
       text "My Dialog"
       font "gui/fonts/Metron"
       "text halign" center
       "text valign" center
      }
      ButtonWidgetClass CloseBtn {
       size 0.15 0.9
       halign right_ref
       text "X"
      }
     }
    }
   }
  }

  // 可滚动内容区域
  ScrollWidgetClass ContentScroll {
   size 0.97 235
   hexactsize 0
   vexactsize 1
   "Scrollbar V" 1
   {
    WrapSpacerWidgetClass ContentItems {
     size 1 0
     hexactsize 0
     "Size To Content V" 1
    }
   }
  }
 }
}
```

---

## 常见错误

1. **忘记 `Class` 后缀** —— 在布局中应写 `TextWidgetClass`，而不是 `TextWidget`。
2. **混淆比例值和像素值** —— 如果 `hexactsize 0`，尺寸值为 0.0-1.0 的比例值。如果 `hexactsize 1`，则为像素值。在比例模式下使用 `300` 意味着父控件宽度的 300 倍。
3. **未引用多词属性** —— 应写 `"text halign" center`，而不是 `text halign center`。
4. **将 ScriptParamsClass 放在错误的块中** —— 它必须在子控件块之后的单独 `{ }` 块中，而不是在子控件块内部。

---

## 最佳实践

- 始终在每个控件上显式设置所有四个精确标志（`hexactpos`、`vexactpos`、`hexactsize`、`vexactsize`）。依赖默认值会导致布局模糊不清，当父结构发生变化时容易出错。
- 谨慎使用 `scriptclass` —— 仅在确实需要脚本驱动行为的控件上使用。过度绑定会增加初始化开销。
- 使用描述性名称命名控件（`PlayerListScroll`、`TitleBarClose`），而不是通用名称（`Frame1`、`btn`）。脚本代码使用 `FindAnyWidget()` 按名称查找，名称冲突会导致静默失败。
- 保持布局文件在 200 行以内。将复杂的 UI 拆分为多个 `.layout` 文件，使用 `CreateWidgets()` 加载并以编程方式设置父级。
- 始终引用多词属性名（`"text halign"`、`"Size To Content V"`）。未加引号的多词属性会静默失败且不报错。

---

## 理论与实践

> 文档所说的与运行时实际表现的对比。

| 概念 | 理论 | 现实 |
|---------|--------|---------|
| `scriptclass` 初始化 | 布局加载时调用 `OnWidgetScriptInit` | 如果类没有继承 `Managed` 或构造函数出错，控件会加载但处理器静默为 null |
| `ScriptParamsClass` | 参数向脚本类传递任意数据 | 只有字符串和数字值能可靠工作；不支持嵌套对象或数组 |
| `color` 属性 | 四个浮点数 0.0-1.0（RGBA） | 某些控件类型会忽略 Alpha 通道，或需要父控件设置 `inheritalpha 1` 才能传播透明度 |
| 属性默认值 | 未记录的属性使用引擎默认值 | 默认值因控件类型而异 —— 在某些引擎版本中，`ButtonWidget` 的 `hexactsize` 默认值与 `FrameWidget` 不同 |
| `"no focus"` | 阻止键盘焦点 | 同时也会阻止手柄选择，如果在交互式控件上设置此属性，可能会破坏手柄导航 |

---

## 兼容性与影响

- **多模组：** 布局文件是每个模组隔离的 —— 不会直接冲突。但 `scriptclass` 名称必须全局唯一。两个模组使用 `scriptclass "PanelHandler"` 会导致其中一个静默失败。
- **性能：** 布局中的每个控件都是一个真实的引擎对象。包含 500+ 控件的布局会导致明显的帧率下降。对于大型列表，优先使用编程方式的对象池。
- **版本：** 布局格式自 DayZ 1.0 以来一直保持稳定。`ScriptParamsClass` 块和 `ViewBinding` scriptclass 是 DabsFramework 添加的，不是原版功能。

---

## 在真实模组中的观察

| 模式 | 模组 | 详情 |
|---------|-----|--------|
| `scriptclass "ViewBinding"` 与 `ScriptParamsClass` | DabsFramework / DayZ Editor | 通过 `Binding_Name` 参数在布局和 ViewController 之间进行双向数据绑定 |
| `WrapSpacerWidgetClass` 作为对话框根控件 | COT、Expansion | 启用 `Size To Content V/H` 以实现围绕动态内容的自动调整大小对话框 |
| 为每个列表行使用单独的 `.layout` | VPP Admin Tools | 每个玩家行是一个独立的布局，加载到 WrapSpacer 中，实现复用和对象池 |
| `priority 998-999` 用于模态叠加层 | DabsFramework、COT | 确保对话框渲染在所有其他 UI 元素之上 |

---

## 后续步骤

- [3.3 尺寸与定位](03-sizing-positioning.md) —— 掌握比例与像素坐标系统
- [3.4 容器控件](04-containers.md) —— 深入了解间距器和滚动控件
