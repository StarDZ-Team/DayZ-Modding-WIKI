# 第 3.1 章：控件类型

[首页](../README.md) | **控件类型** | [下一章：布局文件 >>](02-layout-files.md)

---

DayZ 的 GUI 系统基于控件构建——可复用的 UI 组件，从简单的容器到复杂的交互控件。屏幕上的每个可见元素都是一个控件，了解完整的控件目录对于构建模组 UI 至关重要。

本章提供 Enforce Script 中所有可用控件类型的完整参考。

---

## 控件的工作原理

DayZ 中的每个控件都继承自 `Widget` 基类。控件以父子树形结构组织，根通常是通过 `GetGame().GetWorkspace()` 获取的 `WorkspaceWidget`。

每种控件类型有三个关联标识符：

| 标识符 | 示例 | 用途 |
|---|---|---|
| **脚本类** | `TextWidget` | 代码引用、类型转换 |
| **布局类** | `TextWidgetClass` | `.layout` 文件声明 |
| **TypeID 常量** | `TextWidgetTypeID` | 使用 `CreateWidget()` 编程创建 |

在 `.layout` 文件中始终使用布局类名（以 `Class` 结尾）。在脚本中使用脚本类名。

---

## 容器 / 布局控件

容器控件用于容纳和组织子控件。它们本身不显示内容（`PanelWidget` 除外，它绘制一个有色矩形）。

| 脚本类 | 布局类 | 用途 |
|---|---|---|
| `Widget` | `WidgetClass` | 所有控件的抽象基类。永远不要直接实例化。 |
| `WorkspaceWidget` | `WorkspaceWidgetClass` | 根工作区。通过 `GetGame().GetWorkspace()` 获取。用于编程创建控件。 |
| `FrameWidget` | `FrameWidgetClass` | 通用容器。DayZ 中最常用的控件。 |
| `PanelWidget` | `PanelWidgetClass` | 纯色矩形。用于背景、分隔线、分隔符。 |
| `WrapSpacerWidget` | `WrapSpacerWidgetClass` | 流式布局。按顺序排列子控件，支持换行、内边距和外边距。 |
| `GridSpacerWidget` | `GridSpacerWidgetClass` | 网格布局。将子控件排列在由 `Columns` 和 `Rows` 定义的网格中。 |
| `ScrollWidget` | `ScrollWidgetClass` | 可滚动视口。启用子内容的垂直/水平滚动。 |
| `SpacerBaseWidget` | -- | `WrapSpacerWidget` 和 `GridSpacerWidget` 的抽象基类。 |

### FrameWidget

DayZ UI 的主力控件。当你需要将控件分组时，使用 `FrameWidget` 作为默认容器。它没有视觉外观——纯粹是结构性的。

**关键方法：**
- 所有基础 `Widget` 方法（位置、尺寸、颜色、子控件、标志）

**何时使用：** 几乎所有地方。包装相关控件组。用作对话框、面板和 HUD 元素的根。

```c
// 按名称查找框架控件
FrameWidget panel = FrameWidget.Cast(root.FindAnyWidget("MyPanel"));
panel.Show(true);
```

### PanelWidget

一个有纯色的可见矩形。与 `FrameWidget` 不同，`PanelWidget` 实际上在屏幕上绘制内容。

**关键方法：**
- `SetColor(int argb)` -- 设置背景颜色
- `SetAlpha(float alpha)` -- 设置透明度

**何时使用：** 文本背后的背景、有色分隔线、覆盖矩形、色调层。

```c
PanelWidget bg = PanelWidget.Cast(root.FindAnyWidget("Background"));
bg.SetColor(ARGB(200, 0, 0, 0));  // 半透明黑色
```

### WrapSpacerWidget

自动在流式布局中排列子控件。子控件依次排列，当空间不足时换行到下一行。

**关键布局属性：**
- `Padding` -- 内边距（像素）
- `Margin` -- 外边距（像素）
- `"Size To Content H" 1` -- 调整宽度以适应子控件
- `"Size To Content V" 1` -- 调整高度以适应子控件
- `content_halign` -- 内容水平对齐（`left`、`center`、`right`）
- `content_valign` -- 内容垂直对齐（`top`、`center`、`bottom`）

**何时使用：** 动态列表、标签云、按钮行，任何子控件大小不同的布局。

### GridSpacerWidget

在固定网格中排列子控件。每个单元格大小相等。

**关键布局属性：**
- `Columns` -- 列数
- `Rows` -- 行数
- `Margin` -- 单元格之间的间距
- `"Size To Content V" 1` -- 调整高度以适应内容

**何时使用：** 物品栏网格、图标画廊、带有统一行的设置面板。

### ScrollWidget

为超出可见区域的内容提供可滚动的视口。

**关键布局属性：**
- `"Scrollbar V" 1` -- 启用垂直滚动条
- `"Scrollbar H" 1` -- 启用水平滚动条

**关键方法：**
- `VScrollToPos(float pos)` -- 滚动到垂直位置
- `GetVScrollPos()` -- 获取当前垂直滚动位置
- `GetContentHeight()` -- 获取总内容高度
- `VScrollStep(int step)` -- 按步进量滚动

**何时使用：** 长列表、配置面板、聊天窗口、日志查看器。

---

## 显示控件

显示控件向用户展示内容，但不可交互。

| 脚本类 | 布局类 | 用途 |
|---|---|---|
| `TextWidget` | `TextWidgetClass` | 单行文本显示 |
| `MultilineTextWidget` | `MultilineTextWidgetClass` | 多行只读文本 |
| `RichTextWidget` | `RichTextWidgetClass` | 带嵌入图像的文本（`<image>` 标签） |
| `ImageWidget` | `ImageWidgetClass` | 图像显示（来自图像集或文件） |
| `CanvasWidget` | `CanvasWidgetClass` | 可编程绘图表面 |
| `VideoWidget` | `VideoWidgetClass` | 视频文件播放 |
| `RTTextureWidget` | `RTTextureWidgetClass` | 渲染到纹理的表面 |
| `RenderTargetWidget` | `RenderTargetWidgetClass` | 3D 场景渲染目标 |
| `ItemPreviewWidget` | `ItemPreviewWidgetClass` | 3D DayZ 物品预览 |
| `PlayerPreviewWidget` | `PlayerPreviewWidgetClass` | 3D 玩家角色预览 |
| `MapWidget` | `MapWidgetClass` | 交互式世界地图 |

### TextWidget

最常用的显示控件。显示一行文本。

**关键方法：**
```c
TextWidget tw;
tw.SetText("Hello World");
tw.GetText();                           // 返回 string
tw.GetTextSize(out int w, out int h);   // 渲染文本的像素尺寸
tw.SetTextExactSize(float size);        // 以像素设置字体大小
tw.SetOutline(int size, int color);     // 添加文本轮廓
tw.GetOutlineSize();                    // 返回 int
tw.GetOutlineColor();                   // 返回 int (ARGB)
tw.SetColor(int argb);                  // 文本颜色
```

**关键布局属性：** `text`、`font`、`"text halign"`、`"text valign"`、`"exact text"`、`"exact text size"`、`"bold text"`、`"size to text h"`、`"size to text v"`、`wrap`。

### MultilineTextWidget

显示多行只读文本。文本根据控件宽度自动换行。

**何时使用：** 描述面板、帮助文本、日志显示。

### RichTextWidget

支持使用 `<image>` 标签在文本中嵌入内联图像。也支持文本换行。

**关键布局属性：**
- `wrap 1` -- 启用自动换行

**文本中的用法：**
```
"Health: <image set:dayz_gui image:iconHealth0 /> OK"
```

**何时使用：** 带图标的状态文本、格式化消息、带内联图像的聊天。

### ImageWidget

显示来自图像集精灵表或从文件路径加载的图像。

**关键方法：**
```c
ImageWidget iw;
iw.SetImage(int index);                    // 在 image0、image1 等之间切换
iw.LoadImageFile(int slot, string path);   // 从文件加载图像
iw.LoadMaskTexture(string path);           // 加载遮罩纹理
iw.SetMaskProgress(float progress);        // 0-1 用于擦除/显示过渡
```

**关键布局属性：**
- `image0 "set:dayz_gui image:icon_refresh"` -- 来自图像集的图像
- `mode blend` -- 混合模式（`blend`、`additive`、`stretch`）
- `"src alpha" 1` -- 使用源 Alpha 通道
- `stretch 1` -- 拉伸图像以填充控件
- `"flip u" 1` -- 水平翻转
- `"flip v" 1` -- 垂直翻转

**何时使用：** 图标、标志、背景、地图标记、状态指示器。

### CanvasWidget

一个绘图表面，可以用代码渲染线条。

**关键方法：**
```c
CanvasWidget cw;
cw.DrawLine(float x1, float y1, float x2, float y2, float width, int color);
cw.Clear();
```

**何时使用：** 自定义图表、节点之间的连接线、调试覆盖层。

### MapWidget

完整的交互式世界地图。支持平移、缩放和坐标转换。

**关键方法：**
```c
MapWidget mw;
mw.SetMapPos(vector pos);              // 以世界位置为中心
mw.GetMapPos();                        // 当前中心位置
mw.SetScale(float scale);             // 缩放级别
mw.GetScale();                        // 当前缩放
mw.MapToScreen(vector world_pos);     // 世界坐标转屏幕坐标
mw.ScreenToMap(vector screen_pos);    // 屏幕坐标转世界坐标
```

**何时使用：** 任务地图、GPS 系统、位置选择器。

### ItemPreviewWidget

渲染任何 DayZ 物品栏物品的 3D 预览。

**何时使用：** 物品栏界面、战利品预览、商店界面。

### PlayerPreviewWidget

渲染玩家角色模型的 3D 预览。

**何时使用：** 角色创建界面、装备预览、换装系统。

### RTTextureWidget

将其子控件渲染到纹理表面而不是直接渲染到屏幕上。

**何时使用：** 小地图渲染、画中画效果、屏幕外 UI 合成。

---

## 交互控件

交互控件响应用户输入并触发事件。

| 脚本类 | 布局类 | 用途 |
|---|---|---|
| `ButtonWidget` | `ButtonWidgetClass` | 可点击按钮 |
| `CheckBoxWidget` | `CheckBoxWidgetClass` | 布尔复选框 |
| `EditBoxWidget` | `EditBoxWidgetClass` | 单行文本输入 |
| `MultilineEditBoxWidget` | `MultilineEditBoxWidgetClass` | 多行文本输入 |
| `PasswordEditBoxWidget` | `PasswordEditBoxWidgetClass` | 密码遮罩输入 |
| `SliderWidget` | `SliderWidgetClass` | 水平滑块控件 |
| `XComboBoxWidget` | `XComboBoxWidgetClass` | 下拉选择 |
| `TextListboxWidget` | `TextListboxWidgetClass` | 可选行列表 |
| `ProgressBarWidget` | `ProgressBarWidgetClass` | 进度指示器 |
| `SimpleProgressBarWidget` | `SimpleProgressBarWidgetClass` | 精简进度指示器 |

### ButtonWidget

主要的交互控件。支持瞬时点击和切换模式。

**关键方法：**
```c
ButtonWidget bw;
bw.SetText("Click Me");
bw.GetState();              // 返回 bool（仅限切换按钮）
bw.SetState(bool state);    // 设置切换状态
```

**关键布局属性：**
- `text "Label"` -- 按钮标签文本
- `switch toggle` -- 使其成为切换按钮
- `style Default` -- 视觉样式

**触发的事件：** `OnClick(Widget w, int x, int y, int button)`

### CheckBoxWidget

一个布尔切换控件。

**关键方法：**
```c
CheckBoxWidget cb;
cb.IsChecked();                 // 返回 bool
cb.SetChecked(bool checked);    // 设置状态
```

**触发的事件：** `OnChange(Widget w, int x, int y, bool finished)`

### EditBoxWidget

一个单行文本输入框。

**关键方法：**
```c
EditBoxWidget eb;
eb.GetText();               // 返回 string
eb.SetText("default");      // 设置文本内容
```

**触发的事件：** `OnChange(Widget w, int x, int y, bool finished)` -- 当按下回车键时 `finished` 为 `true`。

### SliderWidget

一个用于数值的水平滑块。

**关键方法：**
```c
SliderWidget sw;
sw.GetCurrent();            // 返回 float (0-1)
sw.SetCurrent(float val);   // 设置位置
```

**关键布局属性：**
- `"fill in" 1` -- 在滑块后面显示填充轨道
- `"listen to input" 1` -- 响应鼠标输入

**触发的事件：** `OnChange(Widget w, int x, int y, bool finished)` -- 当用户释放滑块时 `finished` 为 `true`。

### XComboBoxWidget

一个下拉选择列表。

**关键方法：**
```c
XComboBoxWidget xcb;
xcb.AddItem("Option A");
xcb.AddItem("Option B");
xcb.SetCurrentItem(0);         // 按索引选择
xcb.GetCurrentItem();          // 返回选中的索引
xcb.ClearAll();                // 移除所有项目
```

### TextListboxWidget

一个可滚动的文本行列表。支持选择和多列数据。

**关键方法：**
```c
TextListboxWidget tlb;
tlb.AddItem("Row text", null, 0);   // 文本、用户数据、列
tlb.GetSelectedRow();               // 返回 int（无选中时为 -1）
tlb.SetRow(int row);                // 选择一行
tlb.RemoveRow(int row);
tlb.ClearItems();
```

**触发的事件：** `OnItemSelected`

### ProgressBarWidget

显示一个进度指示器。

**关键方法：**
```c
ProgressBarWidget pb;
pb.SetCurrent(float value);    // 0-100
```

**何时使用：** 加载条、生命条、任务进度、冷却指示器。

---

## 完整 TypeID 参考

使用以下常量配合 `GetGame().GetWorkspace().CreateWidget()` 进行编程创建控件：

```
FrameWidgetTypeID
TextWidgetTypeID
MultilineTextWidgetTypeID
MultilineEditBoxWidgetTypeID
RichTextWidgetTypeID
RenderTargetWidgetTypeID
ImageWidgetTypeID
VideoWidgetTypeID
RTTextureWidgetTypeID
ButtonWidgetTypeID
CheckBoxWidgetTypeID
SimpleProgressBarWidgetTypeID
ProgressBarWidgetTypeID
SliderWidgetTypeID
TextListboxWidgetTypeID
EditBoxWidgetTypeID
PasswordEditBoxWidgetTypeID
WorkspaceWidgetTypeID
GridSpacerWidgetTypeID
WrapSpacerWidgetTypeID
ScrollWidgetTypeID
```

---

## 选择合适的控件

| 我需要... | 使用此控件 |
|---|---|
| 将控件分组（不可见） | `FrameWidget` |
| 绘制有色矩形 | `PanelWidget` |
| 显示文本 | `TextWidget` |
| 显示多行文本 | `MultilineTextWidget` 或带 `wrap 1` 的 `RichTextWidget` |
| 显示带内联图标的文本 | `RichTextWidget` |
| 显示图像/图标 | `ImageWidget` |
| 创建可点击按钮 | `ButtonWidget` |
| 创建切换（开/关） | `CheckBoxWidget` 或带 `switch toggle` 的 `ButtonWidget` |
| 接受文本输入 | `EditBoxWidget` |
| 接受多行文本输入 | `MultilineEditBoxWidget` |
| 接受密码 | `PasswordEditBoxWidget` |
| 让用户选择数值 | `SliderWidget` |
| 让用户从列表中选择 | `XComboBoxWidget`（下拉）或 `TextListboxWidget`（可见列表） |
| 显示进度 | `ProgressBarWidget` 或 `SimpleProgressBarWidget` |
| 以流式排列子控件 | `WrapSpacerWidget` |
| 以网格排列子控件 | `GridSpacerWidget` |
| 使内容可滚动 | `ScrollWidget` |
| 显示 3D 物品模型 | `ItemPreviewWidget` |
| 显示玩家模型 | `PlayerPreviewWidget` |
| 显示世界地图 | `MapWidget` |
| 绘制自定义线条/形状 | `CanvasWidget` |
| 渲染到纹理 | `RTTextureWidget` |

---

## 后续步骤

- [3.2 布局文件格式](02-layout-files.md)——学习如何在 `.layout` 文件中定义控件树
- [3.5 代码创建控件](05-programmatic-widgets.md)——通过代码而非布局文件创建控件

---

## 最佳实践

- 使用 `FrameWidget` 作为默认容器。仅在需要可见有色背景时使用 `PanelWidget`。
- 当以后可能需要内联图标时，优先使用 `RichTextWidget` 而非 `TextWidget`——在现有布局中切换类型很繁琐。
- 始终在 `FindAnyWidget()` 和 `Cast()` 之后进行空值检查。缺失的控件名称会静默返回 `null`，并在下一次方法调用时导致崩溃。
- 对动态列表使用 `WrapSpacerWidget`，对固定网格使用 `GridSpacerWidget`。不要在流式布局中手动定位子控件。
- 避免在正式 UI 中使用 `CanvasWidget`——它每帧重绘且没有批处理。仅用于调试覆盖层。

---

## 理论与实践

| 概念 | 理论 | 现实 |
|---------|--------|---------|
| `ScrollWidget` 自动滚动到内容 | 当内容超出边界时出现滚动条 | 你必须手动调用 `VScrollToPos()` 来滚动到新内容；控件在添加子控件时不会自动滚动 |
| `SliderWidget` 触发连续事件 | `OnChange` 在每个拖动像素上触发 | `finished` 参数在拖动期间为 `false`，在释放时为 `true`；仅在 `finished == true` 时更新繁重的逻辑 |
| `XComboBoxWidget` 支持大量项目 | 下拉框可以处理任意数量 | 100+ 项目时性能明显下降；对长列表使用 `TextListboxWidget` 代替 |
| `ItemPreviewWidget` 显示任何物品 | 传入任意类名进行 3D 预览 | 控件需要加载物品的 `.p3d` 模型；模组物品需要存在其 Data PBO |
| `MapWidget` 是简单的显示控件 | 只是显示地图 | 它默认拦截所有鼠标输入；你必须仔细管理 `IGNOREPOINTER` 标志，否则它会阻止重叠控件的点击 |

---

## 兼容性与影响

- **多模组兼容：** 控件类型 ID 是所有模组共享的引擎常量。两个模组在同一父控件下创建同名控件会发生冲突。使用带有模组前缀的唯一控件名称。
- **性能：** 拥有数百个子控件的 `TextListboxWidget` 和 `ScrollWidget` 会导致帧率下降。对超过 50 个项目的列表进行控件池化和回收。
