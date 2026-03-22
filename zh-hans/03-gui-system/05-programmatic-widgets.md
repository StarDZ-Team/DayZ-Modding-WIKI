# 第 3.5 章：编程式控件创建

[首页](../../README.md) | [<< 上一章：容器控件](04-containers.md) | **编程式控件创建** | [下一章：事件处理 >>](06-event-handling.md)

---

虽然 `.layout` 文件是定义 UI 结构的标准方式，但你也可以完全通过代码来创建和配置控件。这对于动态 UI、程序生成的元素以及编译时无法确定布局的情况非常有用。

---

## 两种方法

DayZ 提供两种在代码中创建控件的方式：

1. **`CreateWidgets()`** -- 加载 `.layout` 文件并实例化其控件树
2. **`CreateWidget()`** -- 使用显式参数创建单个控件

两种方法都通过 `GetGame().GetWorkspace()` 获取的 `WorkspaceWidget` 来调用。

---

## CreateWidgets() -- 从布局文件创建

最常用的方法。加载 `.layout` 文件并创建整个控件树，将其附加到父控件上。

```c
Widget root = GetGame().GetWorkspace().CreateWidgets(
    "MyMod/gui/layouts/MyPanel.layout",   // 布局文件路径
    parentWidget                            // 父控件（或 null 表示根）
);
```

返回的 `Widget` 是布局文件中的根控件。然后你可以按名称查找子控件：

```c
TextWidget title = TextWidget.Cast(root.FindAnyWidget("TitleText"));
title.SetText("Hello World");

ButtonWidget closeBtn = ButtonWidget.Cast(root.FindAnyWidget("CloseButton"));
```

### 创建多个实例

一个常见模式是创建布局模板的多个实例（例如列表项）：

```c
void PopulateList(WrapSpacerWidget container, array<string> items)
{
    foreach (string item : items)
    {
        Widget row = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/gui/layouts/ListRow.layout", container);

        TextWidget label = TextWidget.Cast(row.FindAnyWidget("Label"));
        label.SetText(item);
    }

    container.Update();  // 强制重新计算布局
}
```

---

## CreateWidget() -- 编程式创建

使用显式的类型、位置、大小、标志和父控件创建单个控件。

```c
Widget w = GetGame().GetWorkspace().CreateWidget(
    FrameWidgetTypeID,      // 控件类型 ID 常量
    0,                       // X 位置
    0,                       // Y 位置
    100,                     // 宽度
    100,                     // 高度
    WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE | WidgetFlags.EXACTPOS,
    -1,                      // 颜色（ARGB 整数，-1 = 白色/默认）
    0,                       // 排序顺序（优先级）
    parentWidget             // 父控件
);
```

### 参数

| 参数 | 类型 | 描述 |
|---|---|---|
| typeID | int | 控件类型常量（例如 `FrameWidgetTypeID`、`TextWidgetTypeID`） |
| x | float | X 位置（比例或像素，取决于标志） |
| y | float | Y 位置 |
| width | float | 控件宽度 |
| height | float | 控件高度 |
| flags | int | `WidgetFlags` 常量的按位或 |
| color | int | ARGB 颜色整数（-1 表示默认/白色） |
| sort | int | Z 轴顺序（值越大越在上层渲染） |
| parent | Widget | 要附加到的父控件 |

### 控件类型 ID

```c
FrameWidgetTypeID
TextWidgetTypeID
MultilineTextWidgetTypeID
RichTextWidgetTypeID
ImageWidgetTypeID
VideoWidgetTypeID
RTTextureWidgetTypeID
RenderTargetWidgetTypeID
ButtonWidgetTypeID
CheckBoxWidgetTypeID
EditBoxWidgetTypeID
PasswordEditBoxWidgetTypeID
MultilineEditBoxWidgetTypeID
SliderWidgetTypeID
SimpleProgressBarWidgetTypeID
ProgressBarWidgetTypeID
TextListboxWidgetTypeID
GridSpacerWidgetTypeID
WrapSpacerWidgetTypeID
ScrollWidgetTypeID
WorkspaceWidgetTypeID
```

---

## WidgetFlags

标志用于控制编程创建控件时的行为。使用按位或（`|`）组合它们。

| 标志 | 效果 |
|---|---|
| `WidgetFlags.VISIBLE` | 控件初始可见 |
| `WidgetFlags.IGNOREPOINTER` | 控件不接收鼠标事件 |
| `WidgetFlags.DRAGGABLE` | 控件可以被拖动 |
| `WidgetFlags.EXACTSIZE` | 尺寸值为像素（非比例） |
| `WidgetFlags.EXACTPOS` | 位置值为像素（非比例） |
| `WidgetFlags.SOURCEALPHA` | 使用源 Alpha 通道 |
| `WidgetFlags.BLEND` | 启用 Alpha 混合 |
| `WidgetFlags.FLIPU` | 水平翻转纹理 |
| `WidgetFlags.FLIPV` | 垂直翻转纹理 |

常用标志组合：

```c
// 可见、像素尺寸、像素位置、Alpha 混合
int FLAGS_EXACT = WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE | WidgetFlags.EXACTPOS | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;

// 可见、比例、非交互式
int FLAGS_OVERLAY = WidgetFlags.VISIBLE | WidgetFlags.IGNOREPOINTER | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;
```

创建后，你可以动态修改标志：

```c
widget.SetFlags(WidgetFlags.VISIBLE);          // 添加标志
widget.ClearFlags(WidgetFlags.IGNOREPOINTER);  // 移除标志
int flags = widget.GetFlags();                  // 读取当前标志
```

---

## 创建后设置属性

使用 `CreateWidget()` 创建控件后，你需要配置它。控件以基础 `Widget` 类型返回，因此你必须转换为特定类型。

### 设置名称

```c
Widget w = GetGame().GetWorkspace().CreateWidget(TextWidgetTypeID, ...);
w.SetName("MyTextWidget");
```

名称对于 `FindAnyWidget()` 查找和调试很重要。

### 设置文本

```c
TextWidget tw = TextWidget.Cast(w);
tw.SetText("Hello World");
tw.SetTextExactSize(16);           // 像素字体大小
tw.SetOutline(1, ARGB(255, 0, 0, 0));  // 1 像素黑色描边
```

### 设置颜色

DayZ 中的颜色使用 ARGB 格式（Alpha、Red、Green、Blue），打包成一个 32 位整数：

```c
// 使用 ARGB 辅助函数（每通道 0-255）
int red    = ARGB(255, 255, 0, 0);       // 不透明红色
int green  = ARGB(255, 0, 255, 0);       // 不透明绿色
int blue   = ARGB(200, 0, 0, 255);       // 半透明蓝色
int black  = ARGB(255, 0, 0, 0);         // 不透明黑色
int white  = ARGB(255, 255, 255, 255);   // 不透明白色（等同于 -1）

// 使用浮点版本（每通道 0.0-1.0）
int color = ARGBF(1.0, 0.5, 0.25, 0.1);

// 将颜色分解回浮点数
float a, r, g, b;
InverseARGBF(color, a, r, g, b);

// 应用到任何控件
widget.SetColor(ARGB(255, 100, 150, 200));
widget.SetAlpha(0.5);  // 仅覆盖 Alpha
```

十六进制格式 `0xAARRGGBB` 也很常用：

```c
int color = 0xFF4B77BE;   // A=255, R=75, G=119, B=190
widget.SetColor(color);
```

### 设置事件处理器

```c
widget.SetHandler(myEventHandler);  // ScriptedWidgetEventHandler 实例
```

### 设置用户数据

将任意数据附加到控件以便稍后检索：

```c
widget.SetUserData(myDataObject);  // 必须继承自 Managed

// 稍后检索：
Managed data;
widget.GetUserData(data);
MyDataClass myData = MyDataClass.Cast(data);
```

---

## 控件清理

不再需要的控件必须正确清理以避免内存泄漏。

### Unlink()

将控件从其父控件移除并销毁它（及其所有子控件）：

```c
widget.Unlink();
```

调用 `Unlink()` 后，控件引用变为无效。将其设为 `null`：

```c
widget.Unlink();
widget = null;
```

### 移除所有子控件

要清除容器控件的所有子控件：

```c
void ClearChildren(Widget parent)
{
    Widget child = parent.GetChildren();
    while (child)
    {
        Widget next = child.GetSibling();
        child.Unlink();
        child = next;
    }
}
```

**重要：** 你必须在调用 `Unlink()` **之前**获取 `GetSibling()`，因为取消链接会使控件的兄弟链无效。

### 空值检查

使用控件前始终进行空值检查。`FindAnyWidget()` 在找不到控件时返回 `null`，转换操作在类型不匹配时返回 `null`：

```c
TextWidget tw = TextWidget.Cast(root.FindAnyWidget("MaybeExists"));
if (tw)
{
    tw.SetText("Found it");
}
```

---

## 控件层次导航

通过代码导航控件树：

```c
Widget parent = widget.GetParent();           // 父控件
Widget firstChild = widget.GetChildren();     // 第一个子控件
Widget nextSibling = widget.GetSibling();     // 下一个兄弟控件
Widget found = widget.FindAnyWidget("Name");  // 按名称递归搜索

string name = widget.GetName();               // 控件名称
string typeName = widget.GetTypeName();       // 例如 "TextWidget"
```

遍历所有子控件：

```c
Widget child = parent.GetChildren();
while (child)
{
    // 处理子控件
    Print("Child: " + child.GetName());

    child = child.GetSibling();
}
```

递归遍历所有后代控件：

```c
void WalkWidgets(Widget w, int depth = 0)
{
    if (!w) return;

    string indent = "";
    for (int i = 0; i < depth; i++) indent += "  ";
    Print(indent + w.GetTypeName() + " " + w.GetName());

    WalkWidgets(w.GetChildren(), depth + 1);
    WalkWidgets(w.GetSibling(), depth);
}
```

---

## 完整示例：在代码中创建对话框

以下是一个完整的示例，完全用代码创建一个简单的信息对话框，不使用任何布局文件：

```c
class SimpleCodeDialog : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected TextWidget m_Title;
    protected TextWidget m_Message;
    protected ButtonWidget m_CloseBtn;

    void SimpleCodeDialog(string title, string message)
    {
        int FLAGS_EXACT = WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE
            | WidgetFlags.EXACTPOS | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;
        int FLAGS_PROP = WidgetFlags.VISIBLE | WidgetFlags.SOURCEALPHA
            | WidgetFlags.BLEND;

        WorkspaceWidget workspace = GetGame().GetWorkspace();

        // 根框架：400x200 像素，屏幕居中
        m_Root = workspace.CreateWidget(
            FrameWidgetTypeID, 0, 0, 400, 200, FLAGS_EXACT,
            ARGB(230, 30, 30, 30), 100, null);

        // 手动居中
        int sw, sh;
        GetScreenSize(sw, sh);
        m_Root.SetScreenPos((sw - 400) / 2, (sh - 200) / 2);

        // 标题文本：全宽，30 像素高，在顶部
        Widget titleW = workspace.CreateWidget(
            TextWidgetTypeID, 0, 0, 400, 30, FLAGS_EXACT,
            ARGB(255, 100, 160, 220), 0, m_Root);
        m_Title = TextWidget.Cast(titleW);
        m_Title.SetText(title);

        // 消息文本：在标题下方，填满剩余空间
        Widget msgW = workspace.CreateWidget(
            TextWidgetTypeID, 10, 40, 380, 110, FLAGS_EXACT,
            ARGB(255, 200, 200, 200), 0, m_Root);
        m_Message = TextWidget.Cast(msgW);
        m_Message.SetText(message);

        // 关闭按钮：80x30 像素，右下区域
        Widget btnW = workspace.CreateWidget(
            ButtonWidgetTypeID, 310, 160, 80, 30, FLAGS_EXACT,
            ARGB(255, 80, 130, 200), 0, m_Root);
        m_CloseBtn = ButtonWidget.Cast(btnW);
        m_CloseBtn.SetText("Close");
        m_CloseBtn.SetHandler(this);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_CloseBtn)
        {
            Close();
            return true;
        }
        return false;
    }

    void Close()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = null;
        }
    }

    void ~SimpleCodeDialog()
    {
        Close();
    }
}

// 用法：
SimpleCodeDialog dialog = new SimpleCodeDialog("Alert", "Server restart in 5 minutes.");
```

---

## 控件对象池

每帧创建和销毁控件会导致性能问题。相反，维护一个可重用控件的对象池：

```c
class WidgetPool
{
    protected ref array<Widget> m_Pool;
    protected ref array<Widget> m_Active;
    protected Widget m_Parent;
    protected string m_LayoutPath;

    void WidgetPool(Widget parent, string layoutPath, int initialSize = 10)
    {
        m_Pool = new array<Widget>();
        m_Active = new array<Widget>();
        m_Parent = parent;
        m_LayoutPath = layoutPath;

        // 预创建控件
        for (int i = 0; i < initialSize; i++)
        {
            Widget w = GetGame().GetWorkspace().CreateWidgets(m_LayoutPath, m_Parent);
            w.Show(false);
            m_Pool.Insert(w);
        }
    }

    Widget Acquire()
    {
        Widget w;
        if (m_Pool.Count() > 0)
        {
            w = m_Pool[m_Pool.Count() - 1];
            m_Pool.Remove(m_Pool.Count() - 1);
        }
        else
        {
            w = GetGame().GetWorkspace().CreateWidgets(m_LayoutPath, m_Parent);
        }
        w.Show(true);
        m_Active.Insert(w);
        return w;
    }

    void Release(Widget w)
    {
        w.Show(false);
        int idx = m_Active.Find(w);
        if (idx >= 0)
            m_Active.Remove(idx);
        m_Pool.Insert(w);
    }

    void ReleaseAll()
    {
        foreach (Widget w : m_Active)
        {
            w.Show(false);
            m_Pool.Insert(w);
        }
        m_Active.Clear();
    }
}
```

**何时使用对象池：**
- 频繁更新的列表（击杀通知、聊天、玩家列表）
- 具有动态内容的网格（物品栏、市场）
- 任何每秒创建/销毁 10 个以上控件的 UI

**何时不使用对象池：**
- 只创建一次的静态面板
- 显示/隐藏的对话框（直接使用 Show/Hide）

---

## 布局文件 vs 编程式：何时使用哪种

| 情况 | 建议 |
|---|---|
| 静态 UI 结构 | 布局文件（`.layout`） |
| 复杂的控件树 | 布局文件 |
| 动态数量的项目 | 使用 `CreateWidgets()` 从模板布局创建 |
| 简单的运行时元素（调试文本、标记） | `CreateWidget()` |
| 快速原型开发 | `CreateWidget()` |
| 生产模组 UI | 布局文件 + 代码配置 |

在实践中，大多数模组使用**布局文件**定义结构，使用**代码**填充数据、显示/隐藏元素和处理事件。纯编程式 UI 在调试工具之外很少见。

---

## 后续步骤

- [3.6 事件处理](06-event-handling.md) -- 处理点击、更改和鼠标事件
- [3.7 样式、字体与图像](07-styles-fonts.md) -- 视觉样式和图像资源

---

## 理论与实践

| 概念 | 理论 | 现实 |
|---------|--------|---------|
| `CreateWidget()` 可创建任何控件类型 | 所有 TypeID 都适用于 `CreateWidget()` | 编程创建的 `ScrollWidget` 和 `WrapSpacerWidget` 通常需要手动设置标志（`EXACTSIZE`、尺寸），而布局文件会自动处理这些 |
| `Unlink()` 释放所有内存 | 控件及其子控件被销毁 | 脚本变量中保持的引用变成悬空引用。`Unlink()` 后始终将控件引用设为 `null`，否则可能导致崩溃 |
| `SetHandler()` 路由所有事件 | 一个处理器接收所有控件事件 | 处理器只接收已调用 `SetHandler(this)` 的控件的事件。子控件不会从父控件继承处理器 |
| 从布局 `CreateWidgets()` 是即时的 | 布局同步加载 | 包含大量嵌套控件的大型布局会导致帧率峰值。在加载画面期间预加载布局，而不是在游戏过程中 |
| 比例尺寸（0.0-1.0）相对于父控件缩放 | 值相对于父控件尺寸 | 没有 `EXACTSIZE` 标志时，即使 `CreateWidget()` 中的值如 `100` 也会被当作比例值（0-1 范围），导致控件填满整个父控件 |

---

## 兼容性与影响

- **多模组：** 编程创建的控件是创建模组私有的。与 `modded class` 不同，除非两个模组按名称将控件附加到同一个原版父控件上，否则没有冲突风险。
- **性能：** 每次 `CreateWidgets()` 调用都会从磁盘解析布局文件。缓存根控件并使用显示/隐藏，而不是每次打开 UI 时都重新从布局创建。

---

## 在真实模组中的观察

| 模式 | 模组 | 详情 |
|---------|-----|--------|
| 布局模板 + 代码填充 | COT、Expansion | 通过 `CreateWidgets()` 为每个列表项加载行 `.layout` 模板，然后通过 `FindAnyWidget()` 填充数据 |
| 击杀通知的控件池 | Colorful UI | 预创建 20 个通知条目控件，显示/隐藏而不是创建和销毁 |
| 纯代码对话框 | 调试/管理工具 | 完全用 `CreateWidget()` 构建的简单警告对话框，避免额外的 `.layout` 文件 |
| 对每个交互子控件使用 `SetHandler(this)` | VPP Admin Tools | 布局加载后遍历所有按钮，逐个调用 `SetHandler()` |
| `Unlink()` + null 模式 | DabsFramework | 每个对话框的 `Close()` 方法一致地调用 `m_Root.Unlink(); m_Root = null;` |
