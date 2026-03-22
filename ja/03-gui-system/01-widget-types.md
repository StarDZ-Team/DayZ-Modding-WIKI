# 第3.1章: ウィジェットタイプ

[ホーム](../README.md) | **ウィジェットタイプ** | [次へ: レイアウトファイル >>](02-layout-files.md)

---

DayZ の GUI システムはウィジェット上に構築されています --- シンプルなコンテナから複雑なインタラクティブコントロールまでの再利用可能な UI コンポーネントです。画面上のすべての可視要素はウィジェットであり、完全なカタログを理解することは Mod UI の構築に不可欠です。

この章では、Enforce Script で利用可能なすべてのウィジェットタイプの完全なリファレンスを提供します。

---

## ウィジェットの仕組み

DayZ のすべてのウィジェットは `Widget` ベースクラスを継承しています。ウィジェットは親子ツリーで構成され、ルートは通常 `GetGame().GetWorkspace()` で取得される `WorkspaceWidget` です。

各ウィジェットタイプには3つの関連する識別子があります。

| 識別子 | 例 | 用途 |
|---|---|---|
| **スクリプトクラス** | `TextWidget` | コード参照、キャスト |
| **レイアウトクラス** | `TextWidgetClass` | `.layout` ファイルの宣言 |
| **TypeID 定数** | `TextWidgetTypeID` | `CreateWidget()` によるプログラム的な作成 |

`.layout` ファイルでは常にレイアウトクラス名（`Class` で終わる）を使用します。スクリプトではスクリプトクラス名を使用します。

---

## コンテナ / レイアウトウィジェット

コンテナウィジェットは子ウィジェットを保持し整理します。コンテンツ自体は表示しません（色付き矩形を描画する `PanelWidget` を除く）。

| スクリプトクラス | レイアウトクラス | 目的 |
|---|---|---|
| `Widget` | `WidgetClass` | すべてのウィジェットの抽象ベースクラス。直接インスタンス化しないでください。 |
| `WorkspaceWidget` | `WorkspaceWidgetClass` | ルートワークスペース。`GetGame().GetWorkspace()` で取得。プログラム的なウィジェット作成に使用。 |
| `FrameWidget` | `FrameWidgetClass` | 汎用コンテナ。DayZ で最も一般的に使用されるウィジェット。 |
| `PanelWidget` | `PanelWidgetClass` | ソリッドカラーの矩形。背景、仕切り、セパレータに使用。 |
| `WrapSpacerWidget` | `WrapSpacerWidgetClass` | フローレイアウト。折り返し、パディング、マージン付きで子を順次配置。 |
| `GridSpacerWidget` | `GridSpacerWidgetClass` | グリッドレイアウト。`Columns` と `Rows` で定義されたグリッドに子を配置。 |
| `ScrollWidget` | `ScrollWidgetClass` | スクロール可能なビューポート。子コンテンツの縦/横スクロールを有効化。 |
| `SpacerBaseWidget` | -- | `WrapSpacerWidget` と `GridSpacerWidget` の抽象ベースクラス。 |

### FrameWidget

DayZ UI の主力です。ウィジェットをグループ化する必要がある場合、デフォルトのコンテナとして `FrameWidget` を使用してください。視覚的な外観はありません --- 純粋に構造的です。

**主要メソッド:**
- すべてのベース `Widget` メソッド（位置、サイズ、色、子、フラグ）

**使用場面:** ほぼどこでも。関連するウィジェットのグループをラップします。ダイアログ、パネル、HUD 要素のルートとして使用します。

```c
// 名前でフレームウィジェットを検索
FrameWidget panel = FrameWidget.Cast(root.FindAnyWidget("MyPanel"));
panel.Show(true);
```

### PanelWidget

ソリッドカラーの可視矩形です。`FrameWidget` と異なり、`PanelWidget` は実際に画面上に何かを描画します。

**主要メソッド:**
- `SetColor(int argb)` -- 背景色を設定
- `SetAlpha(float alpha)` -- 透明度を設定

**使用場面:** テキストの背後の背景、色付き仕切り、オーバーレイ矩形、ティントレイヤー。

```c
PanelWidget bg = PanelWidget.Cast(root.FindAnyWidget("Background"));
bg.SetColor(ARGB(200, 0, 0, 0));  // 半透明の黒
```

### WrapSpacerWidget

フローレイアウトで子を自動配置します。子は1つずつ配置され、スペースがなくなると次の行に折り返されます。

**主要レイアウト属性:**
- `Padding` -- 内部パディング（ピクセル）
- `Margin` -- 外部マージン（ピクセル）
- `"Size To Content H" 1` -- 子に合わせて幅をリサイズ
- `"Size To Content V" 1` -- 子に合わせて高さをリサイズ
- `content_halign` -- コンテンツの水平配置（`left`, `center`, `right`）
- `content_valign` -- コンテンツの垂直配置（`top`, `center`, `bottom`）

**使用場面:** 動的リスト、タグクラウド、ボタン行、子のサイズが異なるレイアウト。

### GridSpacerWidget

固定グリッドに子を配置します。各セルは同じサイズです。

**主要レイアウト属性:**
- `Columns` -- 列数
- `Rows` -- 行数
- `Margin` -- セル間のスペース
- `"Size To Content V" 1` -- コンテンツに合わせて高さをリサイズ

**使用場面:** インベントリグリッド、アイコンギャラリー、均一な行を持つ設定パネル。

### ScrollWidget

可視領域を超えるコンテンツ用のスクロール可能なビューポートを提供します。

**主要レイアウト属性:**
- `"Scrollbar V" 1` -- 縦スクロールバーを有効化
- `"Scrollbar H" 1` -- 横スクロールバーを有効化

**主要メソッド:**
- `VScrollToPos(float pos)` -- 縦方向の位置にスクロール
- `GetVScrollPos()` -- 現在の縦スクロール位置を取得
- `GetContentHeight()` -- コンテンツ全体の高さを取得
- `VScrollStep(int step)` -- ステップ量だけスクロール

**使用場面:** 長いリスト、設定パネル、チャットウィンドウ、ログビューア。

---

## 表示ウィジェット

表示ウィジェットはユーザーにコンテンツを表示しますが、インタラクティブではありません。

| スクリプトクラス | レイアウトクラス | 目的 |
|---|---|---|
| `TextWidget` | `TextWidgetClass` | 単一行テキスト表示 |
| `MultilineTextWidget` | `MultilineTextWidgetClass` | 複数行読み取り専用テキスト |
| `RichTextWidget` | `RichTextWidgetClass` | 埋め込み画像付きテキスト（`<image>` タグ） |
| `ImageWidget` | `ImageWidgetClass` | 画像表示（イメージセットまたはファイルから） |
| `CanvasWidget` | `CanvasWidgetClass` | プログラム可能な描画サーフェス |
| `VideoWidget` | `VideoWidgetClass` | 動画ファイル再生 |
| `RTTextureWidget` | `RTTextureWidgetClass` | レンダーテクスチャサーフェス |
| `RenderTargetWidget` | `RenderTargetWidgetClass` | 3D シーンレンダーターゲット |
| `ItemPreviewWidget` | `ItemPreviewWidgetClass` | 3D DayZ アイテムプレビュー |
| `PlayerPreviewWidget` | `PlayerPreviewWidgetClass` | 3D プレイヤーキャラクタープレビュー |
| `MapWidget` | `MapWidgetClass` | インタラクティブワールドマップ |

### TextWidget

最も一般的な表示ウィジェットです。単一行のテキストを表示します。

**主要メソッド:**
```c
TextWidget tw;
tw.SetText("Hello World");
tw.GetText();                           // 文字列を返す
tw.GetTextSize(out int w, out int h);   // レンダリングされたテキストのピクセル寸法
tw.SetTextExactSize(float size);        // フォントサイズをピクセルで設定
tw.SetOutline(int size, int color);     // テキストアウトラインを追加
tw.GetOutlineSize();                    // int を返す
tw.GetOutlineColor();                   // int を返す（ARGB）
tw.SetColor(int argb);                  // テキスト色
```

**主要レイアウト属性:** `text`, `font`, `"text halign"`, `"text valign"`, `"exact text"`, `"exact text size"`, `"bold text"`, `"size to text h"`, `"size to text v"`, `wrap`。

### MultilineTextWidget

複数行の読み取り専用テキストを表示します。テキストはウィジェット幅に基づいて自動的に折り返されます。

**使用場面:** 説明パネル、ヘルプテキスト、ログ表示。

### RichTextWidget

`<image>` タグを使用してテキスト内にインライン画像を埋め込むことをサポートします。テキストの折り返しもサポートします。

**主要レイアウト属性:**
- `wrap 1` -- 単語の折り返しを有効化

**テキスト内での使用:**
```
"Health: <image set:dayz_gui image:iconHealth0 /> OK"
```

**使用場面:** アイコン付きステータステキスト、フォーマットされたメッセージ、インライン画像付きチャット。

### ImageWidget

イメージセットのスプライトシートまたはファイルパスからロードされた画像を表示します。

**主要メソッド:**
```c
ImageWidget iw;
iw.SetImage(int index);                    // image0, image1 などを切り替え
iw.LoadImageFile(int slot, string path);   // ファイルから画像をロード
iw.LoadMaskTexture(string path);           // マスクテクスチャをロード
iw.SetMaskProgress(float progress);        // ワイプ/リビールトランジション用の 0-1
```

**主要レイアウト属性:**
- `image0 "set:dayz_gui image:icon_refresh"` -- イメージセットからの画像
- `mode blend` -- ブレンドモード（`blend`, `additive`, `stretch`）
- `"src alpha" 1` -- ソースアルファチャネルを使用
- `stretch 1` -- ウィジェットに合わせて画像をストレッチ
- `"flip u" 1` -- 水平反転
- `"flip v" 1` -- 垂直反転

**使用場面:** アイコン、ロゴ、背景、マップマーカー、ステータスインジケータ。

### CanvasWidget

プログラム的にラインをレンダリングできる描画サーフェスです。

**主要メソッド:**
```c
CanvasWidget cw;
cw.DrawLine(float x1, float y1, float x2, float y2, float width, int color);
cw.Clear();
```

**使用場面:** カスタムグラフ、ノード間の接続線、デバッグオーバーレイ。

### MapWidget

完全なインタラクティブワールドマップです。パン、ズーム、座標変換をサポートします。

**主要メソッド:**
```c
MapWidget mw;
mw.SetMapPos(vector pos);              // ワールド位置を中心に
mw.GetMapPos();                        // 現在の中心位置
mw.SetScale(float scale);             // ズームレベル
mw.GetScale();                        // 現在のズーム
mw.MapToScreen(vector world_pos);     // ワールド座標をスクリーン座標に
mw.ScreenToMap(vector screen_pos);    // スクリーン座標をワールド座標に
```

**使用場面:** ミッションマップ、GPS システム、位置選択ツール。

### ItemPreviewWidget

任意の DayZ インベントリアイテムの 3D プレビューをレンダリングします。

**使用場面:** インベントリ画面、ルートプレビュー、ショップインターフェース。

### PlayerPreviewWidget

プレイヤーキャラクターモデルの 3D プレビューをレンダリングします。

**使用場面:** キャラクター作成画面、装備プレビュー、ワードローブシステム。

### RTTextureWidget

子を画面に直接ではなくテクスチャサーフェスにレンダリングします。

**使用場面:** ミニマップレンダリング、ピクチャインピクチャエフェクト、オフスクリーン UI 合成。

---

## インタラクティブウィジェット

インタラクティブウィジェットはユーザー入力に応答し、イベントを発行します。

| スクリプトクラス | レイアウトクラス | 目的 |
|---|---|---|
| `ButtonWidget` | `ButtonWidgetClass` | クリック可能なボタン |
| `CheckBoxWidget` | `CheckBoxWidgetClass` | ブーリアンチェックボックス |
| `EditBoxWidget` | `EditBoxWidgetClass` | 単一行テキスト入力 |
| `MultilineEditBoxWidget` | `MultilineEditBoxWidgetClass` | 複数行テキスト入力 |
| `PasswordEditBoxWidget` | `PasswordEditBoxWidgetClass` | マスクされたパスワード入力 |
| `SliderWidget` | `SliderWidgetClass` | 水平スライダーコントロール |
| `XComboBoxWidget` | `XComboBoxWidgetClass` | ドロップダウン選択 |
| `TextListboxWidget` | `TextListboxWidgetClass` | 選択可能な行リスト |
| `ProgressBarWidget` | `ProgressBarWidgetClass` | プログレスインジケータ |
| `SimpleProgressBarWidget` | `SimpleProgressBarWidgetClass` | 最小限のプログレスインジケータ |

### ButtonWidget

主要なインタラクティブコントロールです。瞬間クリックとトグルモードの両方をサポートします。

**主要メソッド:**
```c
ButtonWidget bw;
bw.SetText("Click Me");
bw.GetState();              // bool を返す（トグルボタンのみ）
bw.SetState(bool state);    // トグル状態を設定
```

**主要レイアウト属性:**
- `text "Label"` -- ボタンラベルテキスト
- `switch toggle` -- トグルボタンにする
- `style Default` -- ビジュアルスタイル

**発行されるイベント:** `OnClick(Widget w, int x, int y, int button)`

### CheckBoxWidget

ブーリアントグルコントロールです。

**主要メソッド:**
```c
CheckBoxWidget cb;
cb.IsChecked();                 // bool を返す
cb.SetChecked(bool checked);    // 状態を設定
```

**発行されるイベント:** `OnChange(Widget w, int x, int y, bool finished)`

### EditBoxWidget

単一行テキスト入力フィールドです。

**主要メソッド:**
```c
EditBoxWidget eb;
eb.GetText();               // 文字列を返す
eb.SetText("default");      // テキスト内容を設定
```

**発行されるイベント:** `OnChange(Widget w, int x, int y, bool finished)` -- Enter キーが押されると `finished` が `true` になります。

### SliderWidget

数値用の水平スライダーです。

**主要メソッド:**
```c
SliderWidget sw;
sw.GetCurrent();            // float を返す（0-1）
sw.SetCurrent(float val);   // 位置を設定
```

**主要レイアウト属性:**
- `"fill in" 1` -- ハンドルの背後に塗りつぶしトラックを表示
- `"listen to input" 1` -- マウス入力に応答

**発行されるイベント:** `OnChange(Widget w, int x, int y, bool finished)` -- ユーザーがスライダーを離すと `finished` が `true` になります。

### XComboBoxWidget

ドロップダウン選択リストです。

**主要メソッド:**
```c
XComboBoxWidget xcb;
xcb.AddItem("Option A");
xcb.AddItem("Option B");
xcb.SetCurrentItem(0);         // インデックスで選択
xcb.GetCurrentItem();          // 選択中のインデックスを返す
xcb.ClearAll();                // すべてのアイテムを削除
```

### TextListboxWidget

スクロール可能なテキスト行のリストです。選択と複数列データをサポートします。

**主要メソッド:**
```c
TextListboxWidget tlb;
tlb.AddItem("Row text", null, 0);   // テキスト、userData、列
tlb.GetSelectedRow();               // int を返す（選択なしの場合 -1）
tlb.SetRow(int row);                // 行を選択
tlb.RemoveRow(int row);
tlb.ClearItems();
```

**発行されるイベント:** `OnItemSelected`

### ProgressBarWidget

プログレスインジケータを表示します。

**主要メソッド:**
```c
ProgressBarWidget pb;
pb.SetCurrent(float value);    // 0-100
```

**使用場面:** ローディングバー、ヘルスバー、ミッション進捗、クールダウンインジケータ。

---

## 完全な TypeID リファレンス

プログラム的なウィジェット作成のために `GetGame().GetWorkspace().CreateWidget()` でこれらの定数を使用します。

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

## 適切なウィジェットの選択

| やりたいこと | 使用するウィジェット |
|---|---|
| ウィジェットをグループ化（不可視） | `FrameWidget` |
| 色付き矩形を描画 | `PanelWidget` |
| テキストを表示 | `TextWidget` |
| 複数行テキストを表示 | `MultilineTextWidget` または `wrap 1` 付き `RichTextWidget` |
| インラインアイコン付きテキストを表示 | `RichTextWidget` |
| 画像/アイコンを表示 | `ImageWidget` |
| クリック可能なボタンを作成 | `ButtonWidget` |
| トグル（オン/オフ）を作成 | `CheckBoxWidget` または `switch toggle` 付き `ButtonWidget` |
| テキスト入力を受け付け | `EditBoxWidget` |
| 複数行テキスト入力を受け付け | `MultilineEditBoxWidget` |
| パスワードを受け付け | `PasswordEditBoxWidget` |
| ユーザーに数値を選択させる | `SliderWidget` |
| ユーザーにリストから選択させる | `XComboBoxWidget`（ドロップダウン）または `TextListboxWidget`（可視リスト） |
| 進捗を表示 | `ProgressBarWidget` または `SimpleProgressBarWidget` |
| フローで子を配置 | `WrapSpacerWidget` |
| グリッドで子を配置 | `GridSpacerWidget` |
| コンテンツをスクロール可能にする | `ScrollWidget` |
| 3D アイテムモデルを表示 | `ItemPreviewWidget` |
| プレイヤーモデルを表示 | `PlayerPreviewWidget` |
| ワールドマップを表示 | `MapWidget` |
| カスタムの線/図形を描画 | `CanvasWidget` |
| テクスチャにレンダリング | `RTTextureWidget` |

---

## 次のステップ

- [3.2 レイアウトファイルフォーマット](02-layout-files.md) -- `.layout` ファイルでウィジェットツリーを定義する方法を学ぶ
- [3.5 プログラム的なウィジェット作成](05-programmatic-widgets.md) -- レイアウトファイルの代わりにコードからウィジェットを作成

---

## ベストプラクティス

- デフォルトのコンテナとして `FrameWidget` を使用してください。可視の色付き背景が必要な場合にのみ `PanelWidget` を使用してください。
- 後でインラインアイコンが必要になる可能性がある場合は `TextWidget` より `RichTextWidget` を優先してください --- 既存のレイアウトでタイプを切り替えるのは面倒です。
- `FindAnyWidget()` と `Cast()` の後は必ず null チェックしてください。欠落したウィジェット名は無言で `null` を返し、次のメソッド呼び出しでクラッシュを引き起こします。
- 動的リストには `WrapSpacerWidget` を、固定グリッドには `GridSpacerWidget` を使用してください。フローレイアウトで子を手動配置しないでください。
- 本番 UI には `CanvasWidget` を避けてください --- 毎フレーム再描画され、バッチ処理されません。デバッグオーバーレイにのみ使用してください。

---

## 理論 vs 実践

| 概念 | 理論 | 現実 |
|---------|--------|---------|
| `ScrollWidget` がコンテンツに自動スクロール | コンテンツが境界を超えるとスクロールバーが表示される | 新しいコンテンツにスクロールするには手動で `VScrollToPos()` を呼ぶ必要がある; 子の追加時に自動スクロールしない |
| `SliderWidget` が連続イベントを発行 | ドラッグの各ピクセルで `OnChange` が発行される | ドラッグ中は `finished` パラメータが `false` で、リリース時に `true` になる; 重い処理は `finished == true` の時のみ更新 |
| `XComboBoxWidget` が多くのアイテムをサポート | ドロップダウンは任意の数で動作 | 100以上のアイテムでパフォーマンスが顕著に低下する; 長いリストには代わりに `TextListboxWidget` を使用 |
| `ItemPreviewWidget` が任意のアイテムを表示 | 3D プレビュー用に任意のクラス名を渡す | ウィジェットはアイテムの `.p3d` モデルがロードされている必要がある; Mod アイテムには Data PBO が必要 |
| `MapWidget` は単純な表示 | マップを表示するだけ | デフォルトですべてのマウス入力をインターセプトする; 重なるウィジェットへのクリックをブロックしないよう `IGNOREPOINTER` フラグを慎重に管理する必要がある |

---

## 互換性と影響

- **マルチ Mod:** ウィジェットタイプ ID はすべての Mod で共有されるエンジン定数です。2つの Mod が同じ親の下で同じ名前のウィジェットを作成すると衝突します。Mod プレフィックス付きの一意なウィジェット名を使用してください。
- **パフォーマンス:** 数百の子を持つ `TextListboxWidget` と `ScrollWidget` はフレーム落ちを引き起こします。50アイテムを超えるリストにはウィジェットをプールしてリサイクルしてください。
