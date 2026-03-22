# 第1.10章: 列挙型とプリプロセッサ

[ホーム](../README.md) | [<< 前へ: キャストとリフレクション](09-casting-reflection.md) | **列挙型とプリプロセッサ** | [次へ: エラー処理 >>](11-error-handling.md)

---

> **目標:** 列挙型の宣言、列挙型リフレクションツール、ビットフラグパターン、定数、および条件付きコンパイルのためのプリプロセッサシステムを理解します。

---

## 目次

- [列挙型の宣言](#列挙型の宣言)
- [列挙型の使用](#列挙型の使用)
- [列挙型リフレクション](#列挙型リフレクション)
- [ビットフラグパターン](#ビットフラグパターン)
- [定数](#定数)
- [プリプロセッサディレクティブ](#プリプロセッサディレクティブ)
- [実践例](#実践例)
- [よくある間違い](#よくある間違い)
- [まとめ](#まとめ)
- [ナビゲーション](#ナビゲーション)

---

## 列挙型の宣言

Enforce Scriptの列挙型は、型名でグループ化された名前付き整数定数を定義します。内部的には`int`として動作します。

### 明示的な値

```c
enum EDamageState
{
    PRISTINE  = 0,
    WORN      = 1,
    DAMAGED   = 2,
    BADLY_DAMAGED = 3,
    RUINED    = 4
};
```

### 暗黙的な値

値を省略すると、前の値から自動インクリメントされます（0から開始）:

```c
enum EWeaponMode
{
    SEMI,       // 0
    BURST,      // 1
    AUTO,       // 2
    COUNT       // 3 — 合計数を取得するための一般的なテクニック
};
```

### 列挙型の継承

列挙型は他の列挙型を継承できます。値は親の最後の値から続きます:

```c
enum EBaseColor
{
    RED    = 0,
    GREEN  = 1,
    BLUE   = 2
};

enum EExtendedColor : EBaseColor
{
    YELLOW,   // 3
    CYAN,     // 4
    MAGENTA   // 5
};
```

すべての親の値は子の列挙型からアクセスできます:

```c
int c = EExtendedColor.RED;      // 0 — EBaseColorから継承
int d = EExtendedColor.YELLOW;   // 3 — EExtendedColorで定義
```

> **注意:** 列挙型の継承は、元の定義を変更せずにバニラの列挙型をmoddedコードで拡張する場合に便利です。

---

## 列挙型の使用

列挙型は`int`として動作します --- `int`変数に代入したり、比較したり、switch文で使用したりできます:

```c
EDamageState state = EDamageState.WORN;

// 比較
if (state == EDamageState.RUINED)
{
    Print("アイテムは壊れました!");
}

// switchで使用
switch (state)
{
    case EDamageState.PRISTINE:
        Print("完璧な状態");
        break;
    case EDamageState.WORN:
        Print("少し使用感あり");
        break;
    case EDamageState.DAMAGED:
        Print("損傷あり");
        break;
    case EDamageState.BADLY_DAMAGED:
        Print("大きく損傷");
        break;
    case EDamageState.RUINED:
        Print("壊れた!");
        break;
}

// intに代入
int stateInt = state;  // 1

// intから代入（検証なし — どんなint値でも受け入れられる!）
EDamageState fromInt = 99;  // エラーなし、99は有効な列挙値ではないが
```

> **警告:** Enforce Scriptは列挙型の代入を**検証しません**。範囲外の整数を列挙型変数に代入しても、エラーなくコンパイル・実行されます。

---

## 列挙型リフレクション

Enforce Scriptは列挙値と文字列を変換するための組み込み関数を提供しています。

### typename.EnumToString

列挙値を文字列名に変換します:

```c
EDamageState state = EDamageState.DAMAGED;
string name = typename.EnumToString(EDamageState, state);
Print(name);  // "DAMAGED"
```

これはロギングやUI表示に非常に便利です:

```c
void LogDamageState(EntityAI item, EDamageState state)
{
    string stateName = typename.EnumToString(EDamageState, state);
    Print(item.GetType() + " is " + stateName);
}
```

### typename.StringToEnum

文字列を列挙値に変換します:

```c
int value;
typename.StringToEnum(EDamageState, "RUINED", value);
Print(value.ToString());  // "4"
```

これは設定ファイルやJSONから列挙値を読み込む場合に使用されます:

```c
// 設定文字列からの読み込み
string configValue = "BURST";
int modeInt;
if (typename.StringToEnum(EWeaponMode, configValue, modeInt))
{
    EWeaponMode mode = modeInt;
    Print("武器モードを読み込み: " + typename.EnumToString(EWeaponMode, mode));
}
```

---

## ビットフラグパターン

2のべき乗値を持つ列挙型はビットフラグを作成します --- 単一の整数に複数のオプションを組み合わせることができます:

```c
enum ESpawnFlags
{
    NONE            = 0,
    PLACE_ON_GROUND = 1,     // 1 << 0
    CREATE_PHYSICS  = 2,     // 1 << 1
    UPDATE_NAVMESH  = 4,     // 1 << 2
    CREATE_LOCAL    = 8,     // 1 << 3
    NO_LIFETIME     = 16     // 1 << 4
};
```

ビットOR演算子で組み合わせ、ビットAND演算子でテストします:

```c
// フラグの組み合わせ
int flags = ESpawnFlags.PLACE_ON_GROUND | ESpawnFlags.CREATE_PHYSICS | ESpawnFlags.UPDATE_NAVMESH;

// 単一フラグのテスト
if (flags & ESpawnFlags.CREATE_PHYSICS)
{
    Print("物理が作成されます");
}

// フラグの削除
flags = flags & ~ESpawnFlags.CREATE_LOCAL;

// フラグの追加
flags = flags | ESpawnFlags.NO_LIFETIME;
```

DayZはオブジェクト作成フラグ（`ECE_PLACE_ON_SURFACE`、`ECE_CREATEPHYSICS`、`ECE_UPDATEPATHGRAPH`など）でこのパターンを広く使用しています。

---

## 定数

不変の値を宣言するには`const`を使用します。定数は宣言時に初期化する必要があります。

```c
// 整数定数
const int MAX_PLAYERS = 60;
const int INVALID_INDEX = -1;

// 浮動小数点定数
const float GRAVITY = 9.81;
const float SPAWN_RADIUS = 500.0;

// 文字列定数
const string MOD_NAME = "MyMod";
const string CONFIG_PATH = "$profile:MyMod/config.json";
const string LOG_PREFIX = "[MyMod] ";
```

定数はswitch caseの値や配列サイズとして使用できます:

```c
// constサイズの配列
const int BUFFER_SIZE = 256;
int buffer[BUFFER_SIZE];

// const値を使ったswitch
const int CMD_HELP = 1;
const int CMD_SPAWN = 2;
const int CMD_TELEPORT = 3;

switch (command)
{
    case CMD_HELP:
        ShowHelp();
        break;
    case CMD_SPAWN:
        SpawnItem();
        break;
    case CMD_TELEPORT:
        TeleportPlayer();
        break;
}
```

> **注意:** 参照型（オブジェクト）用の`const`はありません。オブジェクト参照を不変にすることはできません。

---

## プリプロセッサディレクティブ

Enforce Scriptのプリプロセッサはコンパイル前に実行され、条件付きのコード組み込みを可能にします。C/C++のプリプロセッサと似ていますが、機能は限られています。

### #ifdef / #ifndef / #endif

シンボルが定義されているかどうかに基づいてコードを条件付きで組み込みます:

```c
// DEVELOPERが定義されている場合のみコードを含める
#ifdef DEVELOPER
    Print("[DEBUG] 診断が有効です");
#endif

// シンボルが定義されていない場合のみコードを含める
#ifndef SERVER
    // クライアント専用コード
    CreateClientUI();
#endif

// if-elseパターン
#ifdef SERVER
    Print("サーバーで実行中");
#else
    Print("クライアントで実行中");
#endif
```

### #define

独自のシンボルを定義します（値なし — 存在のみ）:

```c
#define MY_MOD_DEBUG

#ifdef MY_MOD_DEBUG
    Print("デバッグモードが有効です");
#endif
```

> **注意:** Enforce Scriptの`#define`は存在フラグのみを作成します。マクロ置換はサポートして**いません**（`#define MAX_HP 100`のようなものは不可 --- 代わりに`const`を使用してください）。

### エンジンの共通定義

DayZはビルドタイプとプラットフォームに基づいて以下の組み込み定義を提供しています:

| 定義 | 利用可能な場合 | 用途 |
|--------|---------------|---------|
| `SERVER` | 専用サーバーで実行中 | サーバー専用ロジック |
| `DEVELOPER` | 開発ビルドのDayZ | 開発専用機能 |
| `DIAG_DEVELOPER` | 診断ビルド | 診断メニュー、デバッグツール |
| `PLATFORM_WINDOWS` | Windowsプラットフォーム | プラットフォーム固有のパス |
| `PLATFORM_XBOX` | Xboxプラットフォーム | コンソール固有のUI |
| `PLATFORM_PS4` | PlayStationプラットフォーム | コンソール固有のロジック |
| `BUILD_EXPERIMENTAL` | 実験ブランチ | 実験的機能 |

```c
void InitPlatform()
{
    #ifdef PLATFORM_WINDOWS
        Print("Windowsで実行中");
    #endif

    #ifdef PLATFORM_XBOX
        Print("Xboxで実行中");
    #endif

    #ifdef PLATFORM_PS4
        Print("PlayStationで実行中");
    #endif
}
```

### config.cppでのカスタム定義

モッドは`config.cpp`の`defines[]`配列を使用して独自のシンボルを定義できます。これらはこのモッドの後にロードされるすべてのスクリプトで利用可能になります:

```cpp
class CfgMods
{
    class MyMod_MissionSystem
    {
        // ...
        defines[] = { "MY_MISSIONS_LOADED" };
        // ...
    };
};
```

これで、他のモッドがあなたのミッションモッドがロードされているかどうかを検出できます:

```c
#ifdef MY_MISSIONS_LOADED
    // ミッションモッドがロードされている — そのAPIを使用
    MyMissionManager.Start();
#else
    // ミッションモッドがロードされていない — スキップまたはフォールバックを使用
    Print("ミッションシステムが検出されませんでした");
#endif
```

---

## 実践例

### プラットフォーム固有のコード

```c
string GetSavePath()
{
    #ifdef PLATFORM_WINDOWS
        return "$profile:MyMod/saves/";
    #else
        return "$saves:MyMod/";
    #endif
}
```

### オプションのモッド依存

```c
class MyModManager
{
    void Init()
    {
        Print("[MyMod] 初期化中...");

        // コア機能は常に利用可能
        LoadConfig();
        RegisterRPCs();

        // MyFrameworkとのオプション統合
        #ifdef MY_FRAMEWORK
            Print("[MyMod] フレームワークを検出 — 統合ロギングを使用");
            RegisterWithCore();
        #endif

        // Community Frameworkとのオプション統合
        #ifdef JM_CommunityFramework
            GetRPCManager().AddRPC("MyMod", "RPC_Handler", this, 2);
        #endif
    }
}
```

### デバッグ専用診断

```c
void ProcessAI(DayZInfected zombie)
{
    vector pos = zombie.GetPosition();
    float health = zombie.GetHealth("", "Health");

    // 重いデバッグログ — 診断ビルドのみ
    #ifdef DIAG_DEVELOPER
        Print(string.Format("[AI] ゾンビ %1 位置 %2, HP: %3",
            zombie.GetType(), pos.ToString(), health.ToString()));

        // デバッグ球体の描画（diagビルドでのみ動作）
        Debug.DrawSphere(pos, 1.0, Colors.RED, ShapeFlags.ONCE);
    #endif

    // 実際のロジックはすべてのビルドで実行
    if (health <= 0)
    {
        HandleZombieDeath(zombie);
    }
}
```

### サーバーとクライアントのロジック

```c
class MissionHandler
{
    void OnMissionStart()
    {
        #ifdef SERVER
            // サーバー: ミッションデータを読み込み、オブジェクトをスポーン
            LoadMissionData();
            SpawnMissionObjects();
            NotifyAllPlayers();
        #else
            // クライアント: UIをセットアップ、イベントに登録
            CreateMissionHUD();
            RegisterClientRPCs();
        #endif
    }
}
```

---

## ベストプラクティス

- 列挙型の最後のエントリとして`COUNT`センチネル値を追加して、簡単にイテレーションや範囲検証ができるようにしてください（例: `for (int i = 0; i < EMode.COUNT; i++)`）。
- ビットフラグ列挙型には2のべき乗値を使用し、`|`で組み合わせ、`&`でテストし、`& ~FLAG`で削除してください。
- 数値定数には`#define`の代わりに`const`を使用してください -- Enforce Scriptの`#define`は存在フラグのみを作成し、値マクロではありません。
- モッドの`config.cpp`に`defines[]`配列を定義して、クロスモッド検出シンボルを公開してください（例: `"STARDZ_CORE"`）。
- 外部データ（設定、RPC）から読み込んだ列挙値は常に検証してください -- Enforce Scriptはどんな`int`でも範囲チェックなしで列挙型として受け入れます。

---

## 実際のモッドでの使用例

> プロフェッショナルなDayZモッドのソースコード調査で確認されたパターンです。

| パターン | モッド | 詳細 |
|---------|-----|--------|
| オプションのモッド統合用`#ifdef` | Expansion / COT | クロスモッドAPIを呼び出す前に`#ifdef JM_CF`や`#ifdef EXPANSIONMOD`をチェック |
| スポーンオプション用ビットフラグ列挙型 | バニラDayZ | `ECE_PLACE_ON_SURFACE`、`ECE_CREATEPHYSICS`などを`CreateObjectEx`用に`\|`で結合 |
| ロギング用`typename.EnumToString` | Expansion / Dabs | ダメージ状態やイベントタイプを生のintではなく読みやすい文字列としてログ出力 |
| config.cppの`defines[]` | StarDZ Core / Expansion | 各モッドが独自のシンボルを宣言し、他のモッドが`#ifdef`で検出できるようにする |

---

## 理論と実践

| 概念 | 理論 | 現実 |
|---------|--------|---------|
| 列挙型の代入検証 | コンパイラが無効な値を拒否するはず | `EDamageState state = 999`は問題なくコンパイルされる -- 範囲チェックは一切ない |
| `#define MAX_HP 100` | C/C++マクロのように動作する | Enforce Scriptの`#define`は存在フラグのみ作成する; 値には`const int`を使用 |
| `switch` caseのスタック | 複数のcaseが1つのハンドラを共有 | Enforce Scriptではフォールスルーなし -- 各`case`は独立; 代わりに`if`/`\|\|`を使用 |

---

## よくある間違い

### 1. 列挙型を検証済みの型として使用

```c
// 問題 — 検証なし、どんなintでも受け入れられる
EDamageState state = 999;  // 問題なくコンパイルされるが、999は有効な状態ではない

// 解決策 — 外部データから読み込む場合は手動で検証
int rawValue = LoadFromConfig();
if (rawValue >= 0 && rawValue <= EDamageState.RUINED)
{
    EDamageState state = rawValue;
}
```

### 2. #defineで値置換を使おうとする

```c
// 間違い — Enforce Scriptの#defineは値をサポートしない
#define MAX_HEALTH 100
int hp = MAX_HEALTH;  // コンパイルエラー!

// 正しい — 代わりにconstを使用
const int MAX_HEALTH = 100;
int hp = MAX_HEALTH;
```

### 3. #ifdefの誤ったネスト

```c
// 正しい — ネストされたifdefは問題なし
#ifdef SERVER
    #ifdef MY_FRAMEWORK
        MyLog.Info("MyMod", "Server + Core");
    #endif
#endif

// 間違い — #endifの忘れは謎のコンパイルエラーを引き起こす
#ifdef SERVER
    DoServerStuff();
// ここで#endifを忘れた!
```

### 4. switch/caseにフォールスルーがないことを忘れる

```c
// C/C++では、breakなしのcaseはフォールスルーする。
// Enforce Scriptでは、各caseは独立 — フォールスルーなし。

switch (state)
{
    case EDamageState.PRISTINE:
    case EDamageState.WORN:
        Print("良好な状態");  // WORNの場合のみ到達し、PRISTINEでは到達しない!
        break;
}
```

複数のcaseで同じロジックを共有する必要がある場合、if/elseを使用してください:

```c
if (state == EDamageState.PRISTINE || state == EDamageState.WORN)
{
    Print("良好な状態");
}
```

---

## まとめ

### 列挙型

| 機能 | 構文 |
|---------|--------|
| 宣言 | `enum EName { A = 0, B = 1 };` |
| 暗黙的 | `enum EName { A, B, C };` (0, 1, 2) |
| 継承 | `enum EChild : EParent { D, E };` |
| 文字列へ | `typename.EnumToString(EName, value)` |
| 文字列から | `typename.StringToEnum(EName, "A", out val)` |
| ビットフラグ結合 | `flags = A | B` |
| ビットフラグテスト | `if (flags & A)` |

### プリプロセッサ

| ディレクティブ | 目的 |
|-----------|---------|
| `#ifdef SYMBOL` | シンボルが存在する場合にコンパイル |
| `#ifndef SYMBOL` | シンボルが存在しない場合にコンパイル |
| `#else` | 代替ブランチ |
| `#endif` | 条件ブロックの終了 |
| `#define SYMBOL` | シンボルを定義する（値なし） |

### 主要な定義

| 定義 | 意味 |
|--------|---------|
| `SERVER` | 専用サーバー |
| `DEVELOPER` | 開発ビルド |
| `DIAG_DEVELOPER` | 診断ビルド |
| `PLATFORM_WINDOWS` | Windows OS |
| カスタム: `defines[]` | モッドのconfig.cpp |

---

## ナビゲーション

| 前へ | 上へ | 次へ |
|----------|----|------|
| [1.9 キャストとリフレクション](09-casting-reflection.md) | [第1部: Enforce Script](../README.md) | [1.11 エラー処理](11-error-handling.md) |
