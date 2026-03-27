# 第1.13章: 関数とメソッド

[ホーム](../README.md) | [<< 前へ: 落とし穴](12-gotchas.md) | **関数とメソッド**

---

## はじめに

関数はEnforce Scriptにおける動作の基本単位です。MODが実行するすべてのアクション --- アイテムのスポーン、プレイヤーの体力チェック、RPCの送信、UI要素の描画 --- は関数の中にあります。関数の宣言方法、データの入出力方法、エンジンの特殊修飾子の使い方を理解することは、正しいDayZ MODを書くために不可欠です。

この章では、関数のメカニクスを詳しくカバーします: 宣言構文、パラメータの受け渡しモード、戻り値、デフォルトパラメータ、proto nativeバインディング、staticメソッドとインスタンスメソッド、オーバーライド、`thread` キーワード、`event` キーワードです。第1.3章（クラス）で関数がどこにあるかを学びましたが、この章では関数がどのように動作するかを教えます。

---

## 目次

- [関数宣言構文](#関数宣言構文)
- [パラメータ受け渡しモード](#パラメータ受け渡しモード)
- [戻り値](#戻り値)
- [デフォルトパラメータ値](#デフォルトパラメータ値)
- [パラメータ制限: 最大16個](#パラメータ制限-最大16個)
- [Proto Nativeメソッド（エンジンバインディング）](#proto-nativeメソッドエンジンバインディング)
- [Static vs インスタンスメソッド](#static-vs-インスタンスメソッド)
- [メソッドのオーバーライド](#メソッドのオーバーライド)
- [メソッドのオーバーロード（非サポート）](#メソッドのオーバーロード非サポート)
- [eventキーワード](#eventキーワード)
- [Threadメソッド（コルーチン）](#threadメソッドコルーチン)
- [CallLaterによる遅延呼び出し](#calllaterによる遅延呼び出し)
- [ベストプラクティス](#ベストプラクティス)
- [実際のMODで確認されたパターン](#実際のmodで確認されたパターン)
- [理論と実践](#理論と実践)
- [よくある間違い](#よくある間違い)
- [クイックリファレンステーブル](#クイックリファレンステーブル)

---

## 関数宣言構文

すべての関数には戻り値の型、名前、パラメータリストがあります。本体は波括弧で囲みます。

```
ReturnType FunctionName(ParamType paramName, ...)
{
    // 本体
}
```

### スタンドアロン関数

スタンドアロン（グローバル）関数はクラスの外に存在します。DayZ MODではまれです --- ほぼすべてのコードはクラス内にあります --- が、バニラスクリプトでいくつか見かけます。

```c
// スタンドアロン関数（グローバルスコープ）
void PrintPlayerCount()
{
    int count = GetGame().GetPlayers().Count();
    Print(string.Format("Players online: %1", count));
}
```

### インスタンスメソッド

DayZ MODの大部分の関数はインスタンスメソッドです --- クラスに属し、そのインスタンスのデータを操作します。

```c
class LootSpawner
{
    protected vector m_Position;
    protected float m_Radius;

    void SetPosition(vector pos)
    {
        m_Position = pos;
    }

    float GetRadius()
    {
        return m_Radius;
    }

    bool IsNearby(vector testPos)
    {
        return vector.Distance(m_Position, testPos) <= m_Radius;
    }
}
```

インスタンスメソッドは暗黙的に `this` --- 現在のオブジェクトへの参照 --- にアクセスできます。`this.` を明示的に書く必要はほとんどありませんが、パラメータが似た名前を持つ場合に曖昧さを解消するのに役立ちます。

### 静的メソッド

静的メソッドはインスタンスではなくクラス自体に属します。`ClassName.Method()` で呼び出します。インスタンスフィールドや `this` にアクセスできません。

```c
class MathHelper
{
    static float Clamp01(float value)
    {
        if (value < 0) return 0;
        if (value > 1) return 1;
        return value;
    }

    static float Lerp(float a, float b, float t)
    {
        return a + (b - a) * Clamp01(t);
    }
}

// 使用:
float result = MathHelper.Lerp(0, 100, 0.75);  // 75.0
```

---

## パラメータ受け渡しモード

Enforce Scriptは4つのパラメータ受け渡しモードをサポートしています。これらを理解することは重要です。間違ったモードを使うと、データが呼び出し側に到達しないサイレントバグが発生します。

### 値渡し（デフォルト）

修飾子が指定されていない場合、パラメータは**値渡し**されます。プリミティブ（`int`、`float`、`bool`、`string`、`vector`）の場合、コピーが作成されます。関数内での変更は呼び出し側の変数に影響しません。

```c
void DoubleValue(int x)
{
    x = x * 2;  // ローカルコピーのみを変更
}

// 使用:
int n = 5;
DoubleValue(n);
Print(n);  // まだ5 --- 元の値は変更されていない
```

### outパラメータ

`out` キーワードはパラメータを**出力専用**としてマークします。関数が値を書き込み、呼び出し側がその値を受け取ります。パラメータの初期値は未定義です --- 書き込む前に読み取らないでください。

```c
// outパラメータ — 関数が値を入力
bool TryFindPlayer(string name, out PlayerBase player)
{
    array<Man> players = new array<Man>;
    GetGame().GetPlayers(players);

    for (int i = 0; i < players.Count(); i++)
    {
        PlayerBase pb = PlayerBase.Cast(players[i]);
        if (pb && pb.GetIdentity() && pb.GetIdentity().GetName() == name)
        {
            player = pb;
            return true;
        }
    }

    player = null;
    return false;
}

// 使用:
PlayerBase result;
if (TryFindPlayer("John", result))
{
    Print(result.GetIdentity().GetName());
}
```

### inoutパラメータ

`inout` キーワードはパラメータを関数が**読み書き両方**を行うものとしてマークします。呼び出し側の値は関数内で利用可能であり、変更は呼び出し側に反映されます。

```c
// inout — 関数が現在の値を読み取り変更する
void ClampHealth(inout float health)
{
    if (health < 0)
        health = 0;
    if (health > 100)
        health = 100;
}

// 使用:
float hp = 150.0;
ClampHealth(hp);
Print(hp);  // 100.0
```

### notnullパラメータ

`notnull` キーワードはコンパイラ（およびエンジン）にパラメータが `null` であってはならないことを伝えます。null値が渡されると、サイレントに処理を続行するのではなく、エラーでクラッシュします。

```c
void ProcessEntity(notnull EntityAI entity)
{
    // entityはnullチェック不要で安全に使用可能 — エンジンが保証
    string name = entity.GetType();
    Print(name);
}
```

---

## 戻り値

### 単一の戻り値

関数は単一の値を返します。戻り値の型は関数名の前に宣言します。

```c
float GetDistanceBetween(vector a, vector b)
{
    return vector.Distance(a, b);
}
```

### void（戻り値なし）

データを返さずにアクションを実行する関数には `void` を使用します。

### outパラメータによる複数の戻り値

複数の値を返す必要がある場合、`out` パラメータを使用します。これはDayZスクリプティングのユニバーサルなパターンです。

```c
void GetTimeComponents(float totalSeconds, out int hours, out int minutes, out int seconds)
{
    hours = (int)(totalSeconds / 3600);
    minutes = (int)((totalSeconds % 3600) / 60);
    seconds = (int)(totalSeconds % 60);
}

// 使用:
int h, m, s;
GetTimeComponents(3725, h, m, s);
// h == 1, m == 2, s == 5
```

### 落とし穴: JsonFileLoaderはvoidを返す

一般的な罠: `JsonFileLoader<T>.JsonLoadFile()` は `void` を返し、読み込まれたオブジェクトを返しません。事前に作成されたオブジェクトを `ref` パラメータとして渡す必要があります。

```c
// 間違い — コンパイルされない
MyConfig config = JsonFileLoader<MyConfig>.JsonLoadFile(path);

// 正しい — refオブジェクトを渡す
MyConfig config = new MyConfig;
JsonFileLoader<MyConfig>.JsonLoadFile(path, config);
```

---

## デフォルトパラメータ値

Enforce Scriptはパラメータのデフォルト値をサポートします。デフォルト値を持つパラメータは、すべての必須パラメータの**後に**来る必要があります。

```c
void SpawnItem(string className, vector pos, float quantity = -1, bool withAttachments = true)
{
    // quantityはデフォルト-1（フル）、withAttachmentsはデフォルトtrue
    EntityAI item = EntityAI.Cast(GetGame().CreateObject(className, pos, false, false, true));
    if (item && quantity >= 0)
        item.SetQuantity(quantity);
}

// これらはすべて有効な呼び出し:
SpawnItem("AKM", myPos);                   // 両方のデフォルトを使用
SpawnItem("AKM", myPos, 0.5);             // カスタムquantity、デフォルトattachments
SpawnItem("AKM", myPos, -1, false);        // attachmentsに到達するにはquantityを指定必須
```

### 制限事項

1. **リテラル値のみ** --- 式、関数呼び出し、他の変数はデフォルトとして使用できません
2. **名前付きパラメータなし** --- 名前でパラメータをスキップできません
3. **クラス型のデフォルト値は `null` または `NULL` に制限**

---

## パラメータ制限: 最大16個

Enforce Script のメソッドは16個を超えるパラメータを持つことができません。DayZ 1.28 以降、この制限を超えると **ハードコンパイルエラー** が発生します（以前はサイレントなバッファオーバーフローとランダムなクラッシュを引き起こしていました）。

```c
// 1.28+ でコンパイルエラー — 17個のパラメータが制限を超過
void TooManyParams(int a, int b, int c, int d, int e, int f, int g, int h,
                   int i, int j, int k, int l, int m, int n, int o, int p,
                   int q)
{
}
```

**解決策：** 多くの個別パラメータの代わりにクラスまたは配列を渡してください。

```c
class MyParams
{
    int a, b, c, d, e;
    float x, y, z;
    string name;
}

void ProcessData(MyParams params)
{
    // params.a, params.b などにアクセス
}
```

---

## Proto Nativeメソッド（エンジンバインディング）

Proto nativeメソッドはスクリプトで宣言されますが、**C++エンジンで実装**されています。Enforce ScriptコードとDayZゲームエンジン間のブリッジを形成します。

### 修飾子リファレンス

| 修飾子 | 意味 | 例 |
|----------|---------|---------|
| `proto native` | C++エンジンコードで実装 | `proto native void SetPosition(vector pos);` |
| `proto native owned` | 呼び出し側が所有する値を返す（メモリ管理） | `proto native owned string GetType();` |
| `proto native external` | 別のモジュールで定義 | `proto native external bool AddSettings(typename cls);` |
| `proto volatile` | 副作用あり。コンパイラが最適化してはいけない | `proto volatile int Call(Class inst, string fn, void parm);` |
| `proto`（`native`なし） | 内部関数、ネイティブかどうかは不明 | `proto int ParseString(string input, out string tokens[]);` |

---

## Static vs インスタンスメソッド

### Staticの使用タイミング

関数がインスタンスデータを必要としない場合にstaticメソッドを使用します:

```c
class StringUtils
{
    // 純粋なユーティリティ — 状態不要
    static bool IsNullOrEmpty(string s)
    {
        return s == "" || s.Length() == 0;
    }
}
```

**一般的なstaticの使用ケース:**
- **ユーティリティ関数** --- 数学ヘルパー、文字列フォーマッタ、検証チェック
- **ファクトリメソッド** --- 設定済みの新しいインスタンスを返す `Create()`
- **シングルトンアクセサ** --- 単一インスタンスを返す `GetInstance()`
- **定数/ルックアップ** --- 静的データテーブルの `Init()` + `Cleanup()`

---

## メソッドのオーバーライド

子クラスが親メソッドの動作を変更する必要がある場合、`override` キーワードを使用します。

### 基本的なオーバーライド

```c
class BaseModule
{
    void OnInit()
    {
        Print("[BaseModule] Initialized");
    }
}

class CombatModule extends BaseModule
{
    override void OnInit()
    {
        super.OnInit();  // まず親を呼び出す
        Print("[CombatModule] Combat system ready");
    }
}
```

### オーバーライドのルール

1. **`override` キーワードが必須** --- なしでは、親のメソッドを置き換えるのではなく隠す新しいメソッドを作成
2. **シグネチャが正確に一致する必要がある** --- 同じ戻り値の型、同じパラメータ型、同じパラメータ数
3. **`super.MethodName()` で親を呼び出す** --- 動作を完全に置き換えるのではなく拡張するために使用
4. **privateメソッドはオーバーライドできない** --- 子クラスから不可視
5. **protectedメソッドはオーバーライド可能** --- 子クラスから可視でオーバーライド可能

---

## メソッドのオーバーロード（非サポート）

**Enforce Scriptはメソッドのオーバーロードをサポートしていません。** 同じ名前で異なるパラメータリストの2つのメソッドを持つことはできません。コンパイルエラーになります。

### 回避策1: 異なるメソッド名

```c
class Calculator
{
    int AddInt(int a, int b) { return a + b; }
    float AddFloat(float a, float b) { return a + b; }
}
```

### 回避策2: Ex()規則

DayZバニラとMODは、メソッドの拡張バージョンに `Ex` を追加する命名規則に従います。

### 回避策3: デフォルトパラメータ

違いがオプションのパラメータだけの場合、デフォルトを使用します。

---

## eventキーワード

`event` キーワードはメソッドを**エンジンイベントハンドラ**としてマークします --- C++エンジンが特定の瞬間（エンティティ作成、アニメーションイベント、物理コールバックなど）に呼び出す関数です。

```c
// Pawnから（3_game/entities/pawn.c）
protected event void OnPossess()
{
    // コントローラがこのポーンを操作するときにエンジンが呼び出す
}

event void GetTransform(inout vector transform[4])
{
    // エンティティのトランスフォームを取得するためにエンジンが呼び出す
}
```

`event` は宣言修飾子であり、呼び出すものではありません。エンジンが適切なタイミングでeventメソッドを呼び出します。

---

## Threadメソッド（コルーチン）

`thread` キーワードは**コルーチン**を作成します --- 実行を中断して後で再開できる関数です。名前にもかかわらず、Enforce Scriptは**シングルスレッド**です。Threadメソッドは協調コルーチンであり、OSレベルのスレッドではありません。

### スレッドの宣言と開始

```c
class Monitor
{
    void Start()
    {
        thread MonitorLoop();
    }

    void MonitorLoop()
    {
        while (true)
        {
            CheckStatus();
            Sleep(1000);  // 1000ミリ秒間実行を中断
        }
    }
}
```

`thread` キーワードは関数宣言ではなく**呼び出し**に付けます。

### スレッドの終了

```c
KillThread(this, "MonitorLoop");  // MonitorLoopコルーチンを停止
```

### スレッドの使用タイミング（使用しないタイミング）

**スレッドよりも `CallLater` とタイマーを優先してください。** スレッドコルーチンには制限があります:
- デバッグが困難（スタックトレースが不明確）
- 完了またはキルまで持続するコルーチンスロットを消費
- ネットワーク境界を超えてシリアル化や転送ができない

---

## CallLaterによる遅延呼び出し

`CallLater` は遅延後に関数呼び出しを実行するようにスケジュールします。スレッドコルーチンの主要な代替手段であり、バニラDayZで広く使用されています。

### 構文

```c
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(FunctionToCall, delayMs, repeat, ...params);
```

| パラメータ | 型 | 説明 |
|-----------|------|-------------|
| Function | `func` | 呼び出すメソッド |
| Delay | `int` | 呼び出しまでのミリ秒 |
| Repeat | `bool` | `true` で間隔繰り返し、`false` でワンショット |
| Params | 可変長 | 関数に渡すパラメータ |

### 呼び出しカテゴリ

| カテゴリ | 目的 |
|----------|---------|
| `CALL_CATEGORY_SYSTEM` | 汎用、フレームごとに実行 |
| `CALL_CATEGORY_GUI` | UI関連コールバック |
| `CALL_CATEGORY_GAMEPLAY` | ゲームプレイロジックコールバック |

### キュー内呼び出しの削除

```c
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).Remove(FunctionToCall);
```

---

## ベストプラクティス

1. **関数を短く保つ** --- 50行以下を目標に。長い場合はヘルパーメソッドに抽出。

2. **ガード句で早期リターン** --- 先頭で前提条件をチェックし早期にリターン。ネストを減らし「ハッピーパス」を読みやすく。

```c
void ProcessPlayer(PlayerBase player)
{
    if (!player) return;
    if (!player.IsAlive()) return;
    if (!player.GetIdentity()) return;

    // 実際のロジック、ネストなし
    string name = player.GetIdentity().GetName();
    // ...
}
```

3. **複雑な戻り値型よりoutパラメータを優先** --- 成功/失敗 + データを通信する必要がある場合、`out` パラメータ付きの `bool` 戻り値を使用。

4. **ステートレスユーティリティにはstaticを使用** --- メソッドが `this` にアクセスしない場合、`static` にする。意図を文書化し、インスタンスなしで呼び出しを可能に。

5. **スレッドコルーチンよりCallLaterを優先** --- `CallLater` はよりシンプルで、キャンセルしやすく、エラーが少ない。

6. **オーバーライドでは常にsuperを呼び出す** --- 親の動作を完全に置き換える意図がない限り。DayZの深い継承チェーンは `super` 呼び出しが階層を通じて伝播することに依存。

---

## 実際のMODで確認されたパターン

> プロフェッショナルなDayZ MODソースコードの調査で確認されたパターンです。

| パターン | MOD | 詳細 |
|---------|-----|--------|
| `out` パラメータ付きの `bool` を返す `TryGet___()` | COT / Expansion | nullable検索の一貫したパターン: `true`/`false` を返し、成功時に `out` パラメータを入力 |
| 拡張シグネチャの `MethodEx()` | バニラ / Expansion Market | APIがより多くのパラメータを必要とする場合、既存の呼び出し側を壊さずに `Ex` を追加 |
| 静的 `Init()` + `Cleanup()` クラスメソッド | Expansion / VPP | マネージャークラスが `Init()` で静的データを初期化し、`Cleanup()` で破棄、ミッションライフサイクルから呼び出し |
| メソッド先頭のガード句 `if (!GetGame()) return` | COT Admin Tools | エンジンに触れるすべてのメソッドがシャットダウン中のクラッシュを避けるためにnullチェックで開始 |
| 遅延作成のシングルトン `GetInstance()` | COT / Expansion / Dabs | マネージャーが `static ref` インスタンスと `GetInstance()` アクセサを公開、初回アクセス時に作成 |

---

## 理論と実践

| 概念 | 理論 | 実際 |
|---------|--------|---------|
| メソッドのオーバーロード | 標準的なOOP機能 | サポートされていない。`Ex()` サフィックスまたはデフォルトパラメータを使用 |
| `thread` がOSスレッドを作成 | キーワードが並列処理を示唆 | `Sleep()` による協調的なイールディングのシングルスレッドコルーチン |
| `out` パラメータは書き込み専用 | 初期値を読み取るべきではない | バニラコードの一部は書き込み前に `out` パラメータを読み取る。防御的に常に `inout` として扱う方が安全 |
| `override` はオプション | 推論可能 | 省略すると、オーバーライドではなく新しいメソッドを静かに作成。常に含める |
| デフォルトパラメータの式 | 関数呼び出しをサポートすべき | リテラル値（`42`、`true`、`null`、`""`）のみ許可。式は不可 |

---

## よくある間違い

### 1. 親メソッドを置き換える際のoverride忘れ

`override` なしでは、メソッドは親のものを隠す新しいメソッドになります。

```c
// 悪い例 — 静かに新しいメソッドを作成
class CustomPlayer extends PlayerBase
{
    void OnConnect() { Print("Custom!"); }
}

// 良い例 — 適切にオーバーライド
class CustomPlayer extends PlayerBase
{
    override void OnConnect() { Print("Custom!"); }
}
```

### 2. outパラメータが事前初期化されていることを期待

`out` パラメータの初期値は保証されていません。書き込む前に読み取らないでください。

### 3. メソッドのオーバーロードを試みる

Enforce Scriptはオーバーロードをサポートしません。同じ名前の2つのメソッドはコンパイルエラーです。

```c
// コンパイルエラー
void Process(int id) {}
void Process(string name) {}

// 正しい — 異なる名前を使用
void ProcessById(int id) {}
void ProcessByName(string name) {}
```

### 4. void関数の戻り値を代入

```c
// コンパイルエラー — JsonLoadFileはvoidを返す
MyConfig cfg = JsonFileLoader<MyConfig>.JsonLoadFile(path);

// 正しい
MyConfig cfg = new MyConfig;
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);
```

### 5. デフォルトパラメータに式を使用

デフォルトパラメータ値はコンパイル時リテラルでなければなりません。

```c
// コンパイルエラー — デフォルトに式
void SetTimeout(float seconds = GetDefaultTimeout()) {}
void SetAngle(float rad = Math.PI) {}

// 正しい — リテラル値のみ
void SetTimeout(float seconds = 30.0) {}
void SetAngle(float rad = 3.14159) {}
```

### 6. オーバーライドチェーンでsuperを忘れる

DayZのクラス階層は深いです。オーバーライドで `super` を省略すると、存在すら知らなかった数レベル上の機能が壊れる可能性があります。

```c
// 悪い例 — 親の初期化を壊す
class MyMission extends MissionServer
{
    override void OnInit()
    {
        // super.OnInit()を忘れた — バニラの初期化が実行されない!
        Print("My mission started");
    }
}

// 良い例
class MyMission extends MissionServer
{
    override void OnInit()
    {
        super.OnInit();  // バニラ + 他のMODを先に初期化させる
        Print("My mission started");
    }
}
```

---

## クイックリファレンステーブル

| 機能 | 構文 | 備考 |
|---------|--------|-------|
| インスタンスメソッド | `void DoWork()` | `this` にアクセス可能 |
| 静的メソッド | `static void DoWork()` | `ClassName.DoWork()` で呼び出し |
| 値渡しパラメータ | `void Fn(int x)` | プリミティブはコピー。オブジェクトは参照コピー |
| `out` パラメータ | `void Fn(out int x)` | 書き込み専用。呼び出し側が値を受け取る |
| `inout` パラメータ | `void Fn(inout float x)` | 読み書き。呼び出し側に変更が反映 |
| `notnull` パラメータ | `void Fn(notnull EntityAI e)` | nullでクラッシュ |
| デフォルト値 | `void Fn(int x = 5)` | リテラルのみ、式は不可 |
| オーバーライド | `override void Fn()` | 親のシグネチャと一致必須 |
| 親の呼び出し | `super.Fn()` | オーバーライド本体内で |
| Proto native | `proto native void Fn()` | C++で実装 |
| Owned戻り値 | `proto native owned string Fn()` | スクリプトが返されたメモリを管理 |
| External | `proto native external void Fn()` | 別のモジュールで定義 |
| Volatile | `proto volatile void Fn()` | スクリプトにコールバックする可能性 |
| Event | `event void Fn()` | エンジンが呼び出すコールバック |
| スレッド開始 | `thread MyFunc()` | コルーチンを開始（OSスレッドではない） |
| スレッド終了 | `KillThread(owner, "FnName")` | 実行中のコルーチンを停止 |
| 遅延呼び出し | `CallLater(Fn, delay, repeat)` | スレッドより推奨 |
| `Ex()` 規則 | `void FnEx(...)` | `Fn` の拡張バージョン |

---

## ナビゲーション

| 前 | 上 | 次 |
|----------|----|------|
| [1.12 落とし穴](12-gotchas.md) | [パート1: Enforce Script](../README.md) | -- |
