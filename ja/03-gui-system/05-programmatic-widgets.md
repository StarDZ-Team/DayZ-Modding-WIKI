# 第3.5章: プログラムによるウィジェット作成

[ホーム](../README.md) | [<< 前へ: コンテナウィジェット](04-containers.md) | **プログラムによるウィジェット作成** | [次へ: イベントハンドリング >>](06-event-handling.md)

---

`.layout` ファイルがUI構造を定義する標準的な方法ですが、コードからウィジェットを完全に作成・設定することもできます。これは動的なUI、手続き的に生成される要素、コンパイル時にレイアウトが不明な場合に有用です。

---

## 2つのアプローチ

DayZにはコードでウィジェットを作成する2つの方法があります:

1. **`CreateWidgets()`** -- `.layout` ファイルを読み込み、ウィジェットツリーをインスタンス化します
2. **`CreateWidget()`** -- 明示的なパラメータで単一のウィジェットを作成します

どちらのメソッドも `GetGame().GetWorkspace()` から取得した `WorkspaceWidget` で呼び出します。

---

## CreateWidgets() -- レイアウトファイルから

最も一般的なアプローチです。`.layout` ファイルを読み込み、ウィジェットツリー全体を作成して親ウィジェットにアタッチします。

```c
Widget root = GetGame().GetWorkspace().CreateWidgets(
    "MyMod/gui/layouts/MyPanel.layout",   // レイアウトファイルへのパス
    parentWidget                            // 親ウィジェット（またはルートの場合はnull）
);
```

返される `Widget` はレイアウトファイルのルートウィジェットです。その後、名前で子ウィジェットを検索できます:

```c
TextWidget title = TextWidget.Cast(root.FindAnyWidget("TitleText"));
title.SetText("Hello World");

ButtonWidget closeBtn = ButtonWidget.Cast(root.FindAnyWidget("CloseButton"));
```

### 複数インスタンスの作成

レイアウトテンプレートの複数インスタンスを作成するのは一般的なパターンです（例: リストアイテム）:

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

    container.Update();  // レイアウトの再計算を強制
}
```

---

## CreateWidget() -- プログラムによる作成

明示的な型、位置、サイズ、フラグ、親を指定して単一のウィジェットを作成します。

```c
Widget w = GetGame().GetWorkspace().CreateWidget(
    FrameWidgetTypeID,      // ウィジェット型ID定数
    0,                       // X位置
    0,                       // Y位置
    100,                     // 幅
    100,                     // 高さ
    WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE | WidgetFlags.EXACTPOS,
    -1,                      // 色（ARGB整数、-1 = 白/デフォルト）
    0,                       // ソート順（優先度）
    parentWidget             // 親ウィジェット
);
```

### パラメータ

| パラメータ | 型 | 説明 |
|---|---|---|
| typeID | int | ウィジェット型定数（例: `FrameWidgetTypeID`、`TextWidgetTypeID`） |
| x | float | X位置（フラグに基づいてプロポーショナルまたはピクセル） |
| y | float | Y位置 |
| width | float | ウィジェットの幅 |
| height | float | ウィジェットの高さ |
| flags | int | `WidgetFlags` 定数のビットOR |
| color | int | ARGB色整数（デフォルト/白の場合は-1） |
| sort | int | Z順序（値が大きいほど前面に描画） |
| parent | Widget | アタッチ先の親ウィジェット |

### ウィジェット型ID

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

フラグはプログラムで作成されたウィジェットの動作を制御します。ビットOR（`|`）で組み合わせます。

| フラグ | 効果 |
|---|---|
| `WidgetFlags.VISIBLE` | ウィジェットが表示状態で開始 |
| `WidgetFlags.IGNOREPOINTER` | ウィジェットがマウスイベントを受信しない |
| `WidgetFlags.DRAGGABLE` | ウィジェットがドラッグ可能 |
| `WidgetFlags.EXACTSIZE` | サイズ値がピクセル単位（プロポーショナルではない） |
| `WidgetFlags.EXACTPOS` | 位置値がピクセル単位（プロポーショナルではない） |
| `WidgetFlags.SOURCEALPHA` | ソースアルファチャンネルを使用 |
| `WidgetFlags.BLEND` | アルファブレンディングを有効化 |
| `WidgetFlags.FLIPU` | テクスチャを水平に反転 |
| `WidgetFlags.FLIPV` | テクスチャを垂直に反転 |

一般的なフラグの組み合わせ:

```c
// 表示、ピクセルサイズ、ピクセル位置、アルファブレンド
int FLAGS_EXACT = WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE | WidgetFlags.EXACTPOS | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;

// 表示、プロポーショナル、非インタラクティブ
int FLAGS_OVERLAY = WidgetFlags.VISIBLE | WidgetFlags.IGNOREPOINTER | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;
```

作成後、フラグを動的に変更できます:

```c
widget.SetFlags(WidgetFlags.VISIBLE);          // フラグを追加
widget.ClearFlags(WidgetFlags.IGNOREPOINTER);  // フラグを削除
int flags = widget.GetFlags();                  // 現在のフラグを読み取り
```

---

## 作成後のプロパティ設定

`CreateWidget()` でウィジェットを作成した後、設定が必要です。ウィジェットはベースの `Widget` 型として返されるため、特定の型にキャストする必要があります。

### 名前の設定

```c
Widget w = GetGame().GetWorkspace().CreateWidget(TextWidgetTypeID, ...);
w.SetName("MyTextWidget");
```

名前は `FindAnyWidget()` によるルックアップやデバッグに重要です。

### テキストの設定

```c
TextWidget tw = TextWidget.Cast(w);
tw.SetText("Hello World");
tw.SetTextExactSize(16);           // ピクセル単位のフォントサイズ
tw.SetOutline(1, ARGB(255, 0, 0, 0));  // 1pxの黒アウトライン
```

### 色の設定

DayZの色はARGB形式（アルファ、赤、緑、青）を使用し、単一の32ビット整数にパックされます:

```c
// ARGBヘルパー関数を使用（チャンネルごとに0-255）
int red    = ARGB(255, 255, 0, 0);       // 不透明な赤
int green  = ARGB(255, 0, 255, 0);       // 不透明な緑
int blue   = ARGB(200, 0, 0, 255);       // 半透明の青
int black  = ARGB(255, 0, 0, 0);         // 不透明な黒
int white  = ARGB(255, 255, 255, 255);   // 不透明な白（-1と同じ）

// float版を使用（チャンネルごとに0.0-1.0）
int color = ARGBF(1.0, 0.5, 0.25, 0.1);

// 色をfloatに分解
float a, r, g, b;
InverseARGBF(color, a, r, g, b);

// 任意のウィジェットに適用
widget.SetColor(ARGB(255, 100, 150, 200));
widget.SetAlpha(0.5);  // アルファのみをオーバーライド
```

16進数形式 `0xAARRGGBB` も一般的です:

```c
int color = 0xFF4B77BE;   // A=255, R=75, G=119, B=190
widget.SetColor(color);
```

### イベントハンドラの設定

```c
widget.SetHandler(myEventHandler);  // ScriptedWidgetEventHandlerインスタンス
```

### ユーザーデータの設定

後で取得するために任意のデータをウィジェットにアタッチします:

```c
widget.SetUserData(myDataObject);  // Managedを継承する必要があります

// 後で取得:
Managed data;
widget.GetUserData(data);
MyDataClass myData = MyDataClass.Cast(data);
```

---

## ウィジェットのクリーンアップ

不要になったウィジェットはメモリリークを避けるために適切にクリーンアップする必要があります。

### Unlink()

ウィジェットを親から削除し、それ（とすべての子）を破棄します:

```c
widget.Unlink();
```

`Unlink()` を呼び出した後、ウィジェット参照は無効になります。`null` に設定してください:

```c
widget.Unlink();
widget = null;
```

### すべての子の削除

コンテナウィジェットのすべての子をクリアするには:

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

**重要:** `Unlink()` を呼び出す**前に** `GetSibling()` を取得する必要があります。アンリンクするとウィジェットの兄弟チェーンが無効になるためです。

### Nullチェック

ウィジェットを使用する前に必ずnullチェックを行ってください。`FindAnyWidget()` はウィジェットが見つからない場合に `null` を返し、キャスト操作は型が一致しない場合に `null` を返します:

```c
TextWidget tw = TextWidget.Cast(root.FindAnyWidget("MaybeExists"));
if (tw)
{
    tw.SetText("Found it");
}
```

---

## ウィジェット階層のナビゲーション

コードからウィジェットツリーをナビゲートします:

```c
Widget parent = widget.GetParent();           // 親ウィジェット
Widget firstChild = widget.GetChildren();     // 最初の子
Widget nextSibling = widget.GetSibling();     // 次の兄弟
Widget found = widget.FindAnyWidget("Name");  // 名前による再帰検索

string name = widget.GetName();               // ウィジェット名
string typeName = widget.GetTypeName();       // 例: "TextWidget"
```

すべての子を反復処理するには:

```c
Widget child = parent.GetChildren();
while (child)
{
    // 子を処理
    Print("Child: " + child.GetName());

    child = child.GetSibling();
}
```

すべての子孫を再帰的に反復処理するには:

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

## 完全な例: コードでダイアログを作成する

以下は、レイアウトファイルなしでコードのみで簡単な情報ダイアログを作成する完全な例です:

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

        // ルートフレーム: 400x200ピクセル、画面中央
        m_Root = workspace.CreateWidget(
            FrameWidgetTypeID, 0, 0, 400, 200, FLAGS_EXACT,
            ARGB(230, 30, 30, 30), 100, null);

        // 手動で中央に配置
        int sw, sh;
        GetScreenSize(sw, sh);
        m_Root.SetScreenPos((sw - 400) / 2, (sh - 200) / 2);

        // タイトルテキスト: 全幅、高さ30px、上部に配置
        Widget titleW = workspace.CreateWidget(
            TextWidgetTypeID, 0, 0, 400, 30, FLAGS_EXACT,
            ARGB(255, 100, 160, 220), 0, m_Root);
        m_Title = TextWidget.Cast(titleW);
        m_Title.SetText(title);

        // メッセージテキスト: タイトルの下、残りのスペースを埋める
        Widget msgW = workspace.CreateWidget(
            TextWidgetTypeID, 10, 40, 380, 110, FLAGS_EXACT,
            ARGB(255, 200, 200, 200), 0, m_Root);
        m_Message = TextWidget.Cast(msgW);
        m_Message.SetText(message);

        // 閉じるボタン: 80x30ピクセル、右下エリア
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

// 使用方法:
SimpleCodeDialog dialog = new SimpleCodeDialog("Alert", "Server restart in 5 minutes.");
```

---

## ウィジェットプーリング

フレームごとにウィジェットを作成・破棄するとパフォーマンスの問題が発生します。代わりに、再利用可能なウィジェットのプールを維持します:

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

        // ウィジェットを事前作成
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

**プーリングを使用すべき場合:**
- 頻繁に更新されるリスト（キルフィード、チャット、プレイヤーリスト）
- 動的コンテンツのグリッド（インベントリ、マーケット）
- 毎秒10個以上のウィジェットを作成/破棄するUI

**プーリングを使用すべきでない場合:**
- 一度作成される静的パネル
- 表示/非表示されるダイアログ（Show/Hideを使用するだけ）

---

## レイアウトファイル vs プログラム: 使い分け

| 状況 | 推奨 |
|---|---|
| 静的なUI構造 | レイアウトファイル（`.layout`） |
| 複雑なウィジェットツリー | レイアウトファイル |
| 動的な数のアイテム | テンプレートレイアウトからの `CreateWidgets()` |
| シンプルなランタイム要素（デバッグテキスト、マーカー） | `CreateWidget()` |
| ラピッドプロトタイピング | `CreateWidget()` |
| 本番MODのUI | レイアウトファイル + コードによる設定 |

実際には、ほとんどのMODは構造に**レイアウトファイル**を使用し、データの入力、要素の表示/非表示、イベント処理に**コード**を使用します。完全にプログラム的なUIは、デバッグツール以外ではまれです。

---

## 次のステップ

- [3.6 イベントハンドリング](06-event-handling.md) -- クリック、変更、マウスイベントの処理
- [3.7 スタイル、フォント、画像](07-styles-fonts.md) -- ビジュアルスタイリングと画像リソース

---

## 理論と実践

| 概念 | 理論 | 実際 |
|---------|--------|---------|
| `CreateWidget()` は任意のウィジェット型を作成できる | すべてのTypeIDが `CreateWidget()` で動作する | `ScrollWidget` と `WrapSpacerWidget` はプログラムで作成すると、レイアウトファイルが自動的に処理する手動フラグ設定（`EXACTSIZE`、サイズ設定）が必要になることがよくあります |
| `Unlink()` がすべてのメモリを解放する | ウィジェットと子が破棄される | スクリプト変数に保持された参照がダングリングになります。`Unlink()` の後は常にウィジェット参照を `null` に設定しないとクラッシュのリスクがあります |
| `SetHandler()` がすべてのイベントをルーティングする | 1つのハンドラがすべてのウィジェットイベントを受信する | ハンドラは `SetHandler(this)` を呼び出したウィジェットのイベントのみを受信します。子は親からハンドラを継承しません |
| `CreateWidgets()` からのレイアウト読み込みは瞬時 | レイアウトは同期的に読み込まれる | 多くのネストされたウィジェットを含む大きなレイアウトはフレームスパイクを引き起こします。ゲームプレイ中ではなく、ロード画面中にレイアウトをプリロードしてください |
| プロポーショナルサイズ（0.0-1.0）が親にスケーリングする | 値は親の寸法に相対的 | `EXACTSIZE` フラグなしでは、`CreateWidget()` の `100` のような値もプロポーショナル（0-1の範囲）として扱われ、ウィジェットが親全体を埋めてしまいます |

---

## 互換性と影響

- **マルチMOD:** プログラムで作成されたウィジェットは作成したMODに固有です。`modded class` とは異なり、2つのMODが名前で同じバニラの親ウィジェットにウィジェットをアタッチしない限り、衝突のリスクはありません。
- **パフォーマンス:** `CreateWidgets()` の各呼び出しはディスクからレイアウトファイルを解析します。UIを開くたびにレイアウトから再作成するのではなく、ルートウィジェットをキャッシュして表示/非表示にしてください。

---

## 実際のMODで確認されたパターン

| パターン | MOD | 詳細 |
|---------|-----|--------|
| レイアウトテンプレート + コードによるデータ入力 | COT、Expansion | リストアイテムごとに `CreateWidgets()` で行の `.layout` テンプレートを読み込み、`FindAnyWidget()` でデータを入力 |
| キルフィードのウィジェットプーリング | Colorful UI | 20個のフィードエントリウィジェットを事前作成し、作成・破棄の代わりに表示/非表示を切り替え |
| 純粋なコードダイアログ | デバッグ/管理ツール | 追加の `.layout` ファイルの配布を避けるため、`CreateWidget()` で完全に構築されたシンプルなアラートダイアログ |
| すべてのインタラクティブな子に `SetHandler(this)` | VPP Admin Tools | レイアウト読み込み後にすべてのボタンを反復処理し、それぞれに個別に `SetHandler()` を呼び出す |
| `Unlink()` + nullパターン | DabsFramework | すべてのダイアログの `Close()` メソッドが一貫して `m_Root.Unlink(); m_Root = null;` を呼び出す |
