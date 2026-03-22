# 3.5 Programmatic Widget Creation

While `.layout` files are the standard way to define UI structure, you can also create and configure widgets entirely from code. This is useful for dynamic UIs, procedurally generated elements, and situations where the layout is not known at compile time.

---

## Two Approaches

DayZ provides two ways to create widgets in code:

1. **`CreateWidgets()`** -- Load a `.layout` file and instantiate its widget tree
2. **`CreateWidget()`** -- Create a single widget with explicit parameters

Both methods are called on the `WorkspaceWidget` obtained from `GetGame().GetWorkspace()`.

---

## CreateWidgets() -- From Layout Files

The most common approach. Loads a `.layout` file and creates the entire widget tree, attaching it to a parent widget.

```c
Widget root = GetGame().GetWorkspace().CreateWidgets(
    "MyMod/gui/layouts/MyPanel.layout",   // Path to layout file
    parentWidget                            // Parent widget (or null for root)
);
```

The returned `Widget` is the root widget from the layout file. You can then find child widgets by name:

```c
TextWidget title = TextWidget.Cast(root.FindAnyWidget("TitleText"));
title.SetText("Hello World");

ButtonWidget closeBtn = ButtonWidget.Cast(root.FindAnyWidget("CloseButton"));
```

### Creating Multiple Instances

A common pattern is creating multiple instances of a layout template (e.g., list items):

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

    container.Update();  // Force layout recalculation
}
```

---

## CreateWidget() -- Programmatic Creation

Creates a single widget with explicit type, position, size, flags, and parent.

```c
Widget w = GetGame().GetWorkspace().CreateWidget(
    FrameWidgetTypeID,      // Widget type ID constant
    0,                       // X position
    0,                       // Y position
    100,                     // Width
    100,                     // Height
    WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE | WidgetFlags.EXACTPOS,
    -1,                      // Color (ARGB integer, -1 = white/default)
    0,                       // Sort order (priority)
    parentWidget             // Parent widget
);
```

### Parameters

| Parameter | Type | Description |
|---|---|---|
| typeID | int | Widget type constant (e.g., `FrameWidgetTypeID`, `TextWidgetTypeID`) |
| x | float | X position (proportional or pixel based on flags) |
| y | float | Y position |
| width | float | Widget width |
| height | float | Widget height |
| flags | int | Bitwise OR of `WidgetFlags` constants |
| color | int | ARGB color integer (-1 for default/white) |
| sort | int | Z-order (higher renders on top) |
| parent | Widget | Parent widget to attach to |

### Widget Type IDs

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

Flags control widget behavior when created programmatically. Combine them with bitwise OR (`|`).

| Flag | Effect |
|---|---|
| `WidgetFlags.VISIBLE` | Widget starts visible |
| `WidgetFlags.IGNOREPOINTER` | Widget does not receive mouse events |
| `WidgetFlags.DRAGGABLE` | Widget can be dragged |
| `WidgetFlags.EXACTSIZE` | Size values are in pixels (not proportional) |
| `WidgetFlags.EXACTPOS` | Position values are in pixels (not proportional) |
| `WidgetFlags.SOURCEALPHA` | Use source alpha channel |
| `WidgetFlags.BLEND` | Enable alpha blending |
| `WidgetFlags.FLIPU` | Flip texture horizontally |
| `WidgetFlags.FLIPV` | Flip texture vertically |

Common flag combinations:

```c
// Visible, pixel-sized, pixel-positioned, alpha-blended
int FLAGS_EXACT = WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE | WidgetFlags.EXACTPOS | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;

// Visible, proportional, non-interactive
int FLAGS_OVERLAY = WidgetFlags.VISIBLE | WidgetFlags.IGNOREPOINTER | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;
```

After creation, you can modify flags dynamically:

```c
widget.SetFlags(WidgetFlags.VISIBLE);          // Add a flag
widget.ClearFlags(WidgetFlags.IGNOREPOINTER);  // Remove a flag
int flags = widget.GetFlags();                  // Read current flags
```

---

## Setting Properties After Creation

After creating a widget with `CreateWidget()`, you need to configure it. The widget is returned as the base `Widget` type, so you must cast to the specific type.

### Setting Name

```c
Widget w = GetGame().GetWorkspace().CreateWidget(TextWidgetTypeID, ...);
w.SetName("MyTextWidget");
```

Names are important for `FindAnyWidget()` lookups and debugging.

### Setting Text

```c
TextWidget tw = TextWidget.Cast(w);
tw.SetText("Hello World");
tw.SetTextExactSize(16);           // Font size in pixels
tw.SetOutline(1, ARGB(255, 0, 0, 0));  // 1px black outline
```

### Setting Color

Colors in DayZ use ARGB format (Alpha, Red, Green, Blue), packed into a single 32-bit integer:

```c
// Using the ARGB helper function (0-255 per channel)
int red    = ARGB(255, 255, 0, 0);       // Opaque red
int green  = ARGB(255, 0, 255, 0);       // Opaque green
int blue   = ARGB(200, 0, 0, 255);       // Semi-transparent blue
int black  = ARGB(255, 0, 0, 0);         // Opaque black
int white  = ARGB(255, 255, 255, 255);   // Opaque white  (same as -1)

// Using the float version (0.0-1.0 per channel)
int color = ARGBF(1.0, 0.5, 0.25, 0.1);

// Decompose a color back to floats
float a, r, g, b;
InverseARGBF(color, a, r, g, b);

// Apply to any widget
widget.SetColor(ARGB(255, 100, 150, 200));
widget.SetAlpha(0.5);  // Override just the alpha
```

The hexadecimal format `0xAARRGGBB` is also common:

```c
int color = 0xFF4B77BE;   // A=255, R=75, G=119, B=190
widget.SetColor(color);
```

### Setting an Event Handler

```c
widget.SetHandler(myEventHandler);  // ScriptedWidgetEventHandler instance
```

### Setting User Data

Attach arbitrary data to a widget for later retrieval:

```c
widget.SetUserData(myDataObject);  // Must inherit from Managed

// Later retrieve it:
Managed data;
widget.GetUserData(data);
MyDataClass myData = MyDataClass.Cast(data);
```

---

## Widget Cleanup

Widgets that are no longer needed must be properly cleaned up to avoid memory leaks.

### Unlink()

Removes a widget from its parent and destroys it (and all its children):

```c
widget.Unlink();
```

After calling `Unlink()`, the widget reference becomes invalid. Set it to `null`:

```c
widget.Unlink();
widget = null;
```

### Removing All Children

To clear a container widget of all its children:

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

**Important:** You must get `GetSibling()` **before** calling `Unlink()`, because unlinking invalidates the widget's sibling chain.

### Null Checks

Always null-check widgets before using them. `FindAnyWidget()` returns `null` if the widget is not found, and cast operations return `null` if the type does not match:

```c
TextWidget tw = TextWidget.Cast(root.FindAnyWidget("MaybeExists"));
if (tw)
{
    tw.SetText("Found it");
}
```

---

## Widget Hierarchy Navigation

Navigate the widget tree from code:

```c
Widget parent = widget.GetParent();           // Parent widget
Widget firstChild = widget.GetChildren();     // First child
Widget nextSibling = widget.GetSibling();     // Next sibling
Widget found = widget.FindAnyWidget("Name");  // Recursive search by name

string name = widget.GetName();               // Widget name
string typeName = widget.GetTypeName();       // e.g., "TextWidget"
```

To iterate all children:

```c
Widget child = parent.GetChildren();
while (child)
{
    // Process child
    Print("Child: " + child.GetName());

    child = child.GetSibling();
}
```

To iterate all descendants recursively:

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

## Complete Example: Creating a Dialog in Code

Here is a complete example that creates a simple information dialog entirely in code, without any layout file:

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

        // Root frame: 400x200 pixels, centered on screen
        m_Root = workspace.CreateWidget(
            FrameWidgetTypeID, 0, 0, 400, 200, FLAGS_EXACT,
            ARGB(230, 30, 30, 30), 100, null);

        // Center it manually
        int sw, sh;
        GetScreenSize(sw, sh);
        m_Root.SetScreenPos((sw - 400) / 2, (sh - 200) / 2);

        // Title text: full width, 30px tall, at top
        Widget titleW = workspace.CreateWidget(
            TextWidgetTypeID, 0, 0, 400, 30, FLAGS_EXACT,
            ARGB(255, 100, 160, 220), 0, m_Root);
        m_Title = TextWidget.Cast(titleW);
        m_Title.SetText(title);

        // Message text: below title, fills remaining space
        Widget msgW = workspace.CreateWidget(
            TextWidgetTypeID, 10, 40, 380, 110, FLAGS_EXACT,
            ARGB(255, 200, 200, 200), 0, m_Root);
        m_Message = TextWidget.Cast(msgW);
        m_Message.SetText(message);

        // Close button: 80x30 pixels, bottom-right area
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

// Usage:
SimpleCodeDialog dialog = new SimpleCodeDialog("Alert", "Server restart in 5 minutes.");
```

---

## Widget Pooling

Creating and destroying widgets every frame causes performance issues. Instead, maintain a pool of reusable widgets:

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

        // Pre-create widgets
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

**When to use pooling:**
- Lists that update frequently (kill feed, chat, player list)
- Grids with dynamic content (inventory, market)
- Any UI that creates/destroys 10+ widgets per second

**When NOT to use pooling:**
- Static panels created once
- Dialogs shown/hidden (just use Show/Hide)

---

## Layout Files vs. Programmatic: When to Use Each

| Situation | Recommendation |
|---|---|
| Static UI structure | Layout file (`.layout`) |
| Complex widget trees | Layout file |
| Dynamic number of items | `CreateWidgets()` from a template layout |
| Simple runtime elements (debug text, markers) | `CreateWidget()` |
| Rapid prototyping | `CreateWidget()` |
| Production mod UI | Layout file + code configuration |

In practice, most mods use **layout files** for the structure and **code** for populating data, showing/hiding elements, and handling events. Purely programmatic UIs are rare outside of debug tools.

---

## Next Steps

- [3.6 Event Handling](06-event-handling.md) -- Handle clicks, changes, and mouse events
- [3.7 Styles, Fonts & Images](07-styles-fonts.md) -- Visual styling and image resources

---

## Theory vs Practice

| Concept | Theory | Reality |
|---------|--------|---------|
| `CreateWidget()` creates any widget type | All TypeIDs work with `CreateWidget()` | `ScrollWidget` and `WrapSpacerWidget` created programmatically often need manual flag setup (`EXACTSIZE`, sizing) that layout files handle automatically |
| `Unlink()` frees all memory | Widget and children are destroyed | References held in script variables become dangling. Always set widget refs to `null` after `Unlink()` or you risk crashes |
| `SetHandler()` routes all events | One handler receives all widget events | The handler only receives events for widgets that have called `SetHandler(this)`. Children do not inherit the handler from their parent |
| `CreateWidgets()` from layout is instant | Layout loads synchronously | Large layouts with many nested widgets cause a frame spike. Pre-load layouts during loading screens, not during gameplay |
| Proportional sizing (0.0-1.0) scales to parent | Values are relative to parent dimensions | Without `EXACTSIZE` flag, even `CreateWidget()` values like `100` are treated as proportional (0-1 range), causing widgets to fill the entire parent |

---

## Compatibility & Impact

- **Multi-Mod:** Programmatically created widgets are private to the creating mod. Unlike `modded class`, there is no collision risk unless two mods attach widgets to the same vanilla parent widget by name.
- **Performance:** Each `CreateWidgets()` call parses the layout file from disk. Cache the root widget and show/hide it rather than recreating from layout every time the UI opens.

---

## Observed in Real Mods

| Pattern | Mod | Detail |
|---------|-----|--------|
| Layout template + code population | COT, Expansion | Load a row `.layout` template via `CreateWidgets()` per list item, then populate via `FindAnyWidget()` |
| Widget pooling for kill feed | Colorful UI | Pre-creates 20 feed entry widgets, shows/hides them instead of creating and destroying |
| Pure code dialogs | Debug/admin tools | Simple alert dialogs built entirely with `CreateWidget()` to avoid shipping extra `.layout` files |
| `SetHandler(this)` on every interactive child | VPP Admin Tools | Iterates all buttons after layout load and calls `SetHandler()` on each one individually |
| `Unlink()` + null pattern | DabsFramework | Every dialog's `Close()` method calls `m_Root.Unlink(); m_Root = null;` consistently |
