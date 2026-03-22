# Chapter 5.2: inputs.xml --- カスタムキーバインド

[ホーム](../../README.md) | [<< 前: stringtable.csv](01-stringtable.md) | **inputs.xml** | [次: Credits.json >>](03-credits-json.md)

---

> **概要：** `inputs.xml`ファイルを使用すると、Modはプレイヤーの設定 > コントロールメニューに表示されるカスタムキーバインドを登録できます。プレイヤーは、バニラアクションと同様にこれらの入力を表示、再バインド、切り替えできます。これはDayZ Modにホットキーを追加する標準的な仕組みです。

---

## 目次

- [概要](#overview)
- [ファイルの場所](#file-location)
- [完全なXML構造](#complete-xml-structure)
- [Actionsブロック](#actions-block)
- [Sortingブロック](#sorting-block)
- [Presetブロック（デフォルトキーバインド）](#preset-block-default-keybindings)
- [修飾キーコンボ](#modifier-combos)
- [非表示入力](#hidden-inputs)
- [複数のデフォルトキー](#multiple-default-keys)
- [スクリプトでの入力アクセス](#accessing-inputs-in-script)
- [入力メソッドリファレンス](#input-methods-reference)
- [入力の抑制と無効化](#suppressing-and-disabling-inputs)
- [キー名リファレンス](#key-names-reference)
- [実際の例](#real-examples)
- [よくある間違い](#common-mistakes)

---

## 概要

Modでプレイヤーにキーを押す必要がある場合 --- メニューを開く、機能を切り替える、AIユニットに指示を出す --- `inputs.xml`にカスタム入力アクションを登録します。エンジンは起動時にこのファイルを読み込み、あなたのアクションをユニバーサル入力システムに統合します。プレイヤーは、あなたが定義した見出しの下にグループ化されたキーバインドを、ゲームの設定 > コントロールメニューで確認できます。

カスタム入力は一意のアクション名（慣例として「User Action」の`UA`をプレフィックスとして付ける）で識別され、プレイヤーが自由に再バインドできるデフォルトキーバインドを持つことができます。

---

## ファイルの場所

`inputs.xml`はScriptsディレクトリの`data`サブフォルダ内に配置します：

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      Scripts/
        data/
          inputs.xml        <-- ここ
        3_Game/
        4_World/
        5_Mission/
```

一部のModでは`Scripts/`フォルダに直接配置しています。どちらの場所でも動作します。エンジンがファイルを自動的に検出するため、config.cppでの登録は不要です。

---

## 完全なXML構造

`inputs.xml`ファイルには3つのセクションがあり、すべて`<modded_inputs>`ルート要素でラップされています：

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <!-- アクション定義をここに記述 -->
        </actions>

        <sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
            <!-- 設定メニューのソート順 -->
        </sorting>
    </inputs>
    <preset>
        <!-- デフォルトキーバインドの割り当てをここに記述 -->
    </preset>
</modded_inputs>
```

3つのセクション --- `<actions>`、`<sorting>`、`<preset>` --- は連携して動作しますが、それぞれ異なる目的を持っています。

---

## Actionsブロック

`<actions>`ブロックは、Modが提供するすべての入力アクションを宣言します。各アクションは単一の`<input>`要素です。

### 構文

```xml
<actions>
    <input name="UAMyModOpenMenu" loc="STR_MYMOD_INPUT_OPEN_MENU" />
    <input name="UAMyModToggleHUD" loc="STR_MYMOD_INPUT_TOGGLE_HUD" />
</actions>
```

### 属性

| 属性 | 必須 | 説明 |
|-----------|----------|-------------|
| `name` | はい | 一意のアクション識別子。慣例：`UA`（User Action）をプレフィックスとして付けます。スクリプトでこの入力をポーリングするために使用されます。 |
| `loc` | いいえ | コントロールメニューの表示名のstringtableキー。**`#`プレフィックスなし** --- システムが内部で追加します。 |
| `visible` | いいえ | コントロールメニューから非表示にするには`"false"`に設定します。デフォルトは`true`です。 |

### 命名規則

アクション名は、読み込まれたすべてのMod間でグローバルに一意である必要があります。Modプレフィックスを使用してください：

```xml
<input name="UAMyModAdminPanel" loc="STR_MYMOD_INPUT_ADMIN_PANEL" />
<input name="UAExpansionBookToggle" loc="STR_EXPANSION_BOOK_TOGGLE" />
<input name="eAICommandMenu" loc="STR_EXPANSION_AI_COMMAND_MENU" />
```

`UA`プレフィックスは慣例であり強制ではありません。Expansion AIは`eAI`をプレフィックスとして使用しており、同様に動作します。

---

## Sortingブロック

`<sorting>`ブロックは、プレイヤーのコントロール設定で入力がどのように表示されるかを制御します。名前付きグループ（セクションヘッダーとなる）を定義し、入力を表示順にリストします。

### 構文

```xml
<sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
    <input name="UAMyModOpenMenu" />
    <input name="UAMyModToggleHUD" />
    <input name="UAMyModSpecialAction" />
</sorting>
```

### 属性

| 属性 | 必須 | 説明 |
|-----------|----------|-------------|
| `name` | はい | このソートグループの内部識別子 |
| `loc` | はい | 設定 > コントロールに表示されるグループヘッダーのstringtableキー |

### 表示のされ方

コントロール設定で、プレイヤーには以下のように表示されます：

```
[MyMod]                          <-- sortingのlocから
  Open Menu .............. [Y]   <-- inputのloc + presetから
  Toggle HUD ............. [H]   <-- inputのloc + presetから
```

`<sorting>`ブロックにリストされた入力のみが設定メニューに表示されます。`<actions>`で定義されていても`<sorting>`にリストされていない入力は、サイレントに登録されますがプレイヤーには非表示になります（`visible`が明示的に`false`に設定されていなくても）。

---

## Presetブロック（デフォルトキーバインド）

`<preset>`ブロックは、アクションにデフォルトキーを割り当てます。これらはカスタマイズ前にプレイヤーが最初に持つキーです。

### シンプルなキーバインド

```xml
<preset>
    <input name="UAMyModOpenMenu">
        <btn name="kY"/>
    </input>
</preset>
```

これにより`Y`キーが`UAMyModOpenMenu`のデフォルトとしてバインドされます。

### デフォルトキーなし

`<preset>`ブロックからアクションを省略すると、デフォルトバインドがありません。プレイヤーは設定 > コントロールで手動でキーを割り当てる必要があります。これはオプションまたは上級バインドに適切です。

---

## 修飾キーコンボ

修飾キー（Ctrl、Shift、Alt）を要求するには、`<btn>`要素をネストします：

### Ctrl + 左マウスボタン

```xml
<input name="eAISetWaypoint">
    <btn name="kLControl">
        <btn name="mBLeft"/>
    </btn>
</input>
```

外側の`<btn>`が修飾キーで、内側の`<btn>`が主キーです。プレイヤーは修飾キーを押したまま主キーを押す必要があります。

### Shift + キー

```xml
<input name="UAMyModQuickAction">
    <btn name="kLShift">
        <btn name="kQ"/>
    </btn>
</input>
```

### ネストのルール

- **外側**の`<btn>`は常に修飾キー（押し続ける）です
- **内側**の`<btn>`はトリガー（修飾キーを押している間に押す）です
- 1段階のネストが一般的です。より深いネストはテストされておらず、推奨されません

---

## 非表示入力

プレイヤーがコントロールメニューで確認したり再バインドしたりできない入力を登録するには、`visible="false"`を使用します。これは、Modのコードで使用される内部入力で、プレイヤーが設定変更すべきでない場合に便利です。

```xml
<actions>
    <input name="eAITestInput" visible="false" />
    <input name="UAExpansionConfirm" loc="" visible="false" />
</actions>
```

非表示入力でも`<preset>`ブロックでデフォルトキー割り当てを持つことができます：

```xml
<preset>
    <input name="eAITestInput">
        <btn name="kY"/>
    </input>
</preset>
```

---

## 複数のデフォルトキー

1つのアクションに複数のデフォルトキーを持たせることができます。複数の`<btn>`要素を兄弟としてリストします：

```xml
<input name="UAExpansionConfirm">
    <btn name="kReturn" />
    <btn name="kNumpadEnter" />
</input>
```

`Enter`と`Numpad Enter`の両方が`UAExpansionConfirm`をトリガーします。これは、複数の物理キーが同じ論理アクションにマップされるべき場合に便利です。

---

## スクリプトでの入力アクセス

### 入力APIの取得

すべての入力アクセスは、グローバルUser Action APIを返す`GetUApi()`を通じて行います：

```c
UAInput input = GetUApi().GetInputByName("UAMyModOpenMenu");
```

### OnUpdateでのポーリング

カスタム入力は通常、`MissionGameplay.OnUpdate()`またはそれに類似するフレームごとのコールバックでポーリングされます：

```c
modded class MissionGameplay
{
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        UAInput input = GetUApi().GetInputByName("UAMyModOpenMenu");

        if (input.LocalPress())
        {
            // このフレームでキーが押された
            OpenMyModMenu();
        }
    }
}
```

### 代替方法：入力名を直接使用する

多くのModでは、`UAInputAPI`メソッドを文字列名で使用してインラインで入力をチェックします：

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

`LocalPress("name", false)`の`false`パラメータは、チェックが入力イベントを消費すべきでないことを示します。

---

## 入力メソッドリファレンス

`UAInput`リファレンス（`GetUApi().GetInputByName()`から取得）を持っている場合、または`Input`クラスを直接使用している場合、以下のメソッドで異なる入力状態を検出できます：

| メソッド | 戻り値 | Trueになる条件 |
|--------|---------|-----------|
| `LocalPress()` | `bool` | キーが**このフレーム**で押された（キーダウン時の単一トリガー） |
| `LocalRelease()` | `bool` | キーが**このフレーム**で離された（キーアップ時の単一トリガー） |
| `LocalClick()` | `bool` | キーが素早く押して離された（タップ） |
| `LocalHold()` | `bool` | キーが閾値時間以上押し続けられた |
| `LocalDoubleClick()` | `bool` | キーが素早く2回タップされた |
| `LocalValue()` | `float` | 現在のアナログ値（デジタルキーは0.0または1.0、アナログ軸は可変） |

### 使用パターン

**押下でトグル：**
```c
if (input.LocalPress("UAMyModToggle", false))
{
    m_IsEnabled = !m_IsEnabled;
}
```

**押して有効化、離して無効化：**
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

**ダブルタップアクション：**
```c
if (input.LocalDoubleClick("UAMyModSpecial", false))
{
    PerformSpecialAction();
}
```

**長押しアクション：**
```c
if (input.LocalHold("UAExpansionGPSToggle"))
{
    ToggleGPSMode();
}
```

---

## 入力の抑制と無効化

### ForceDisable

特定の入力を一時的に無効にします。メニューを開いたときに、UIがアクティブな間にゲームアクションが発動するのを防ぐために一般的に使用されます：

```c
// メニューが開いている間、入力を無効にする
GetUApi().GetInputByName("UAMyModToggle").ForceDisable(true);

// メニューが閉じたときに再有効化する
GetUApi().GetInputByName("UAMyModToggle").ForceDisable(false);
```

### SupressNextFrame

次のフレームのすべての入力処理を抑制します。入力コンテキストの遷移時（メニューを閉じるなど）に、1フレームの入力リークを防ぐために使用されます：

```c
GetUApi().SupressNextFrame(true);
```

### UpdateControls

入力状態を変更した後、変更を即座に適用するために`UpdateControls()`を呼び出します：

```c
GetUApi().GetInputByName("UAExpansionBookToggle").ForceDisable(false);
GetUApi().UpdateControls();
```

### Input Excludes

バニラのミッションシステムは除外グループを提供しています。メニューがアクティブなとき、入力のカテゴリを除外できます：

```c
// インベントリが開いている間、ゲームプレイ入力を抑制する
AddActiveInputExcludes({"inventory"});

// 閉じたときに復元する
RemoveActiveInputExcludes({"inventory"});
```

---

## キー名リファレンス

`<btn name="">`属性で使用されるキー名は特定の命名規則に従います。以下は完全なリファレンスです。

### キーボードキー

| カテゴリ | キー名 |
|----------|-----------|
| 文字 | `kA`, `kB`, `kC`, `kD`, `kE`, `kF`, `kG`, `kH`, `kI`, `kJ`, `kK`, `kL`, `kM`, `kN`, `kO`, `kP`, `kQ`, `kR`, `kS`, `kT`, `kU`, `kV`, `kW`, `kX`, `kY`, `kZ` |
| 数字（上段） | `k0`, `k1`, `k2`, `k3`, `k4`, `k5`, `k6`, `k7`, `k8`, `k9` |
| ファンクションキー | `kF1`, `kF2`, `kF3`, `kF4`, `kF5`, `kF6`, `kF7`, `kF8`, `kF9`, `kF10`, `kF11`, `kF12` |
| 修飾キー | `kLControl`, `kRControl`, `kLShift`, `kRShift`, `kLAlt`, `kRAlt` |
| ナビゲーション | `kUp`, `kDown`, `kLeft`, `kRight`, `kHome`, `kEnd`, `kPageUp`, `kPageDown` |
| 編集 | `kReturn`, `kBackspace`, `kDelete`, `kInsert`, `kSpace`, `kTab`, `kEscape` |
| テンキー | `kNumpad0` ... `kNumpad9`, `kNumpadEnter`, `kNumpadPlus`, `kNumpadMinus`, `kNumpadMultiply`, `kNumpadDivide`, `kNumpadDecimal` |
| 記号 | `kMinus`, `kEquals`, `kLBracket`, `kRBracket`, `kBackslash`, `kSemicolon`, `kApostrophe`, `kComma`, `kPeriod`, `kSlash`, `kGrave` |
| ロック | `kCapsLock`, `kNumLock`, `kScrollLock` |

### マウスボタン

| 名前 | ボタン |
|------|--------|
| `mBLeft` | 左マウスボタン |
| `mBRight` | 右マウスボタン |
| `mBMiddle` | 中マウスボタン（スクロールホイールクリック） |
| `mBExtra1` | マウスボタン4（サイドボタン戻る） |
| `mBExtra2` | マウスボタン5（サイドボタン進む） |

### マウス軸

| 名前 | 軸 |
|------|------|
| `mAxisX` | マウス水平移動 |
| `mAxisY` | マウス垂直移動 |
| `mWheelUp` | スクロールホイール上 |
| `mWheelDown` | スクロールホイール下 |

### 命名パターン

- **キーボード**：`k`プレフィックス + キー名（例：`kT`、`kF5`、`kLControl`）
- **マウスボタン**：`mB`プレフィックス + ボタン名（例：`mBLeft`、`mBRight`）
- **マウス軸**：`m`プレフィックス + 軸名（例：`mAxisX`、`mWheelUp`）

---

## 実際の例

### DayZ Expansion AI

表示可能なキーバインド、非表示のデバッグ入力、修飾キーコンボを備えた、よく構成されたinputs.xmlです：

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

主なポイント：
- `eAICommandMenu`は`T`にバインド --- 設定に表示され、プレイヤーが再バインド可能
- `eAISetWaypoint`は**Ctrl + 左クリック**の修飾キーコンボを使用
- テスト入力は`visible="false"` --- プレイヤーからは非表示だがコードからはアクセス可能

### DayZ Expansion Market

複数のデフォルトキーを持つ非表示ユーティリティ入力の最小限のinputs.xmlです：

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

主なポイント：
- 空の`loc`を持つ非表示入力（`visible="false"`） --- 設定には表示されません
- 2つのデフォルトキー：EnterとNumpad Enterの両方が同じアクションをトリガーします
- `<sorting>`ブロックなし --- 入力が非表示のため不要です

### 完全なスターターテンプレート

新しいMod用の最小限だが完全なテンプレートです：

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
        <!-- UAMyModQuickActionにはデフォルトキーなし。プレイヤーがバインドする必要あり -->
    </preset>
</modded_inputs>
```

対応するstringtable.csv：

```csv
"Language","original","english"
"STR_MYMOD_INPUT_GROUP","My Mod","My Mod"
"STR_MYMOD_INPUT_OPEN_MENU","Open Menu","Open Menu"
"STR_MYMOD_INPUT_QUICK_ACTION","Quick Action","Quick Action"
```

---

## よくある間違い

### loc属性での`#`の使用

```xml
<!-- 間違い -->
<input name="UAMyAction" loc="#STR_MYMOD_ACTION" />

<!-- 正しい -->
<input name="UAMyAction" loc="STR_MYMOD_ACTION" />
```

入力システムは内部で`#`を前置します。自分で追加するとダブルプレフィックスになり、ルックアップが失敗します。

### アクション名の衝突

2つのModが`UAOpenMenu`を定義した場合、1つしか動作しません。常にModプレフィックスを使用してください：

```xml
<input name="UAMyModOpenMenu" />     <!-- 良い -->
<input name="UAOpenMenu" />          <!-- リスクあり -->
```

### Sortingエントリの欠落

`<actions>`でアクションを定義しても`<sorting>`にリストし忘れると、アクションはコードでは動作しますがコントロールメニューには表示されません。プレイヤーは再バインドする方法がありません。

### Actionsでの定義忘れ

`<sorting>`や`<preset>`に入力をリストしても`<actions>`で定義しなかった場合、エンジンはそれを黙って無視します。

### 競合するキーのバインド

バニラバインドと競合するキー（`W`、`A`、`S`、`D`、`Tab`、`I`など）を選択すると、あなたのアクションとバニラアクションが同時に発動します。安全のため、一般的でないキー（F5-F12、テンキー）または修飾キーコンボを使用してください。
