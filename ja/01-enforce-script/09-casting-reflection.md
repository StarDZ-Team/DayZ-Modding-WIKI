# 第1.9章: キャストとリフレクション

[ホーム](../README.md) | [<< 前へ: メモリ管理](08-memory-management.md) | **キャストとリフレクション** | [次へ: 列挙型とプリプロセッサ >>](10-enums-preprocessor.md)

---

> **目標:** 安全な型キャスト、ランタイム型チェック、動的プロパティアクセスのためのEnforce ScriptのリフレクションAPIをマスターします。

---

## 目次

- [キャストが重要な理由](#キャストが重要な理由)
- [Class.CastTo -- 安全なダウンキャスト](#classcastto----安全なダウンキャスト)
- [Type.Cast -- 代替キャスト](#typecast----代替キャスト)
- [CastTo vs Type.Cast -- 使い分け](#castto-vs-typecast----使い分け)
- [obj.IsInherited -- ランタイム型チェック](#obisinherited----ランタイム型チェック)
- [obj.IsKindOf -- 文字列ベースの型チェック](#obiskindof----文字列ベースの型チェック)
- [obj.Type -- ランタイム型の取得](#objtype----ランタイム型の取得)
- [typename -- 型参照の保存](#typename----型参照の保存)
- [リフレクションAPI](#リフレクションapi)
  - [変数の検査](#変数の検査)
  - [EnScript.GetClassVar / SetClassVar](#enscriptgetclassvar--setclassvar)
- [実践的な例](#実践的な例)
  - [ワールド内のすべての車両を見つける](#ワールド内のすべての車両を見つける)
  - [キャスト付き安全オブジェクトヘルパー](#キャスト付き安全オブジェクトヘルパー)
  - [リフレクションベースの設定システム](#リフレクションベースの設定システム)
  - [型安全なイベントディスパッチ](#型安全なイベントディスパッチ)
- [よくある間違い](#よくある間違い)
- [まとめ](#まとめ)
- [ナビゲーション](#ナビゲーション)

---

## キャストが重要な理由

DayZのエンティティ階層は深いです。ほとんどのエンジンAPIは汎用的な基底型（`Object`、`Man`、`Class`）を返しますが、特殊化されたメソッドにアクセスするには特定の型（`PlayerBase`、`ItemBase`、`CarScript`）が必要です。キャストは基底参照を派生参照に安全に変換します。

```
Class (ルート)
  └─ Object
       └─ Entity
            └─ EntityAI
                 ├─ InventoryItem → ItemBase
                 ├─ DayZCreatureAI
                 │    ├─ DayZInfected
                 │    └─ DayZAnimal
                 └─ Man
                      └─ DayZPlayer → PlayerBase
```

基底型に存在しないメソッドを呼び出すと**ランタイムクラッシュ**が発生します -- Enforce Scriptは仮想呼び出しをランタイムで解決するため、コンパイラエラーは出ません。

---

## Class.CastTo -- 安全なダウンキャスト

`Class.CastTo` はDayZにおける**推奨される**キャスト方法です。結果を `out` パラメータに書き込み、`bool` を返す静的メソッドです。

```c
// シグネチャ:
// static bool Class.CastTo(out Class target, Class source)

Object obj = GetSomeObject();
PlayerBase player;

if (Class.CastTo(player, obj))
{
    // キャスト成功 -- playerは有効
    string name = player.GetIdentity().GetName();
    Print("Found player: " + name);
}
else
{
    // キャスト失敗 -- objはPlayerBaseではない
    // playerはここではnull
}
```

**推奨される理由：**
- クラッシュする代わりに失敗時に `false` を返します
- 失敗時に `out` パラメータが `null` に設定されます -- チェックが安全です
- クラス階層全体で動作します（`Object` だけでなく）

### パターン: キャストして続行

ループ内では、キャスト失敗を使って無関係なオブジェクトをスキップします：

```c
array<Object> nearObjects = new array<Object>;
array<CargoBase> proxyCargos = new array<CargoBase>;
GetGame().GetObjectsAtPosition(pos, 50.0, nearObjects, proxyCargos);

foreach (Object obj : nearObjects)
{
    EntityAI entity;
    if (!Class.CastTo(entity, obj))
        continue;  // EntityAI以外のオブジェクト（建物、地形など）をスキップ

    // EntityAIメソッドを安全に呼び出せる
    if (entity.IsAlive())
    {
        Print(entity.GetType() + " is alive at " + entity.GetPosition().ToString());
    }
}
```

---

## Type.Cast -- 代替キャスト

すべてのクラスには、キャスト結果を直接返す静的 `Cast` メソッドがあります（失敗時は `null`）。

```c
// 構文: TargetType.Cast(source)

Object obj = GetSomeObject();
PlayerBase player = PlayerBase.Cast(obj);

if (player)
{
    player.DoSomething();
}
```

これはキャストと代入を1行で行いますが、結果のnullチェックは**必ず**行う必要があります。

### プリミティブとParamsのキャスト

`Type.Cast` は `Param` クラス（RPCやイベントで多用される）にも使用されます：

```c
override void OnEvent(EventType eventTypeId, Param params)
{
    if (eventTypeId == ClientReadyEventTypeID)
    {
        Param2<PlayerIdentity, Man> readyParams = Param2<PlayerIdentity, Man>.Cast(params);
        if (readyParams)
        {
            PlayerIdentity identity = readyParams.param1;
            Man player = readyParams.param2;
        }
    }
}
```

---

## CastTo vs Type.Cast -- 使い分け

| 機能 | `Class.CastTo` | `Type.Cast` |
|---------|----------------|-------------|
| 戻り値の型 | `bool` | ターゲット型または `null` |
| 失敗時のnull | はい（outパラメータがnullに設定される） | はい（nullを返す） |
| 最適な用途 | 分岐ロジックを持つifブロック | 1行代入 |
| DayZバニラでの使用 | 至る所で | 至る所で |
| Object以外で動作 | はい（任意の `Class`） | はい（任意の `Class`） |

**経験則:** 成功/失敗で分岐する場合は `Class.CastTo` を使用します。型付き参照が必要で後でnullチェックする場合は `Type.Cast` を使用します。

```c
// CastTo -- 結果で分岐
PlayerBase player;
if (Class.CastTo(player, obj))
{
    // プレイヤーを処理
}

// Type.Cast -- 代入して後でチェック
PlayerBase player = PlayerBase.Cast(obj);
if (!player) return;
```

---

## obj.IsInherited -- ランタイム型チェック

`IsInherited` はキャストを実行**せずに**、オブジェクトが指定された型のインスタンスかどうかをチェックします。`typename` 引数を取ります。

```c
Object obj = GetSomeObject();

if (obj.IsInherited(PlayerBase))
{
    Print("This is a player!");
}

if (obj.IsInherited(DayZInfected))
{
    Print("This is a zombie!");
}

if (obj.IsInherited(CarScript))
{
    Print("This is a vehicle!");
}
```

`IsInherited` は正確な型**および**階層内のすべての親型に対して `true` を返します。`PlayerBase` オブジェクトは `IsInherited(Man)`、`IsInherited(EntityAI)`、`IsInherited(Object)` などに対して `true` を返します。

---

## obj.IsKindOf -- 文字列ベースの型チェック

`IsKindOf` は同じチェックを**文字列**のクラス名で行います。型名をデータとして持っている場合（例：設定ファイルから）に便利です。

```c
Object obj = GetSomeObject();

if (obj.IsKindOf("ItemBase"))
{
    Print("This is an item");
}

if (obj.IsKindOf("DayZAnimal"))
{
    Print("This is an animal");
}
```

**重要:** `IsKindOf` は `IsInherited` と同様に、継承チェーン全体をチェックします。`Mag_STANAG_30Rnd` は `IsKindOf("Magazine_Base")`、`IsKindOf("InventoryItem")`、`IsKindOf("EntityAI")` などに対して `true` を返します。

### IsInherited vs IsKindOf

| 機能 | `IsInherited(typename)` | `IsKindOf(string)` |
|---------|------------------------|---------------------|
| 引数 | コンパイル時の型 | 文字列名 |
| 速度 | 高速（型比較） | 低速（文字列検索） |
| 使用場面 | コンパイル時に型がわかっている場合 | 型がデータ/設定から来る場合 |

---

## obj.Type -- ランタイム型の取得

`Type()` はオブジェクトの実際のランタイムクラスの `typename` を返します -- 宣言された変数の型ではありません。

```c
Object obj = GetSomeObject();
typename t = obj.Type();

Print(t.ToString());  // 例: "PlayerBase", "AK101", "LandRover"
```

ロギング、デバッグ、または動的な型比較に使用します：

```c
void ProcessEntity(EntityAI entity)
{
    typename t = entity.Type();
    Print("Processing entity of type: " + t.ToString());

    if (t == PlayerBase)
    {
        Print("It's a player");
    }
}
```

---

## typename -- 型参照の保存

`typename` はEnforce Scriptのファーストクラス型です。変数に格納し、パラメータとして渡し、比較することができます。

```c
// typename変数の宣言
typename playerType = PlayerBase;
typename vehicleType = CarScript;

// 比較
typename objType = obj.Type();
if (objType == playerType)
{
    Print("Match!");
}

// コレクションでの使用
array<typename> allowedTypes = new array<typename>;
allowedTypes.Insert(PlayerBase);
allowedTypes.Insert(DayZInfected);
allowedTypes.Insert(DayZAnimal);

// メンバーシップのチェック
foreach (typename t : allowedTypes)
{
    if (obj.IsInherited(t))
    {
        Print("Object matches allowed type: " + t.ToString());
        break;
    }
}
```

### typenameからインスタンスを作成

ランタイムで `typename` からオブジェクトを作成できます：

```c
typename t = PlayerBase;
Class instance = t.Spawn();  // 新しいインスタンスを作成

// または文字列ベースのアプローチ:
Class instance2 = GetGame().CreateObjectEx("AK101", pos, ECE_PLACE_ON_SURFACE);
```

> **注意:** `typename.Spawn()` はパラメータなしのコンストラクタを持つクラスでのみ動作します。DayZエンティティには `GetGame().CreateObject()` または `CreateObjectEx()` を使用してください。

---

## リフレクションAPI

Enforce Scriptは基本的なリフレクション -- コンパイル時に型を知らなくても、ランタイムでオブジェクトのプロパティを検査および変更する機能を提供します。

### 変数の検査

すべてのオブジェクトの `Type()` は変数メタデータを公開する `typename` を返します：

```c
void InspectObject(Class obj)
{
    typename t = obj.Type();

    int varCount = t.GetVariableCount();
    Print("Class: " + t.ToString() + " has " + varCount.ToString() + " variables");

    for (int i = 0; i < varCount; i++)
    {
        string varName = t.GetVariableName(i);
        typename varType = t.GetVariableType(i);

        Print("  [" + i.ToString() + "] " + varName + " : " + varType.ToString());
    }
}
```

**`typename` で利用可能なリフレクションメソッド：**

| メソッド | 戻り値 | 説明 |
|--------|---------|-------------|
| `GetVariableCount()` | `int` | メンバー変数の数 |
| `GetVariableName(int index)` | `string` | インデックスの変数名 |
| `GetVariableType(int index)` | `typename` | インデックスの変数型 |
| `ToString()` | `string` | クラス名を文字列として |

### EnScript.GetClassVar / SetClassVar

`EnScript.GetClassVar` と `EnScript.SetClassVar` はランタイムで**名前**によってメンバー変数を読み書きできます。これはEnforce Scriptの動的プロパティアクセスに相当します。

```c
// シグネチャ:
// static void EnScript.GetClassVar(Class instance, string varName, int index, out T value)
// static bool EnScript.SetClassVar(Class instance, string varName, int index, T value)
// 'index' は配列要素のインデックス -- 非配列フィールドには0を使用

class MyConfig
{
    int MaxSpawns = 10;
    float SpawnRadius = 100.0;
    string WelcomeMsg = "Hello!";
}

void DemoReflection()
{
    MyConfig cfg = new MyConfig();

    // 名前で値を読み取る
    int maxVal;
    EnScript.GetClassVar(cfg, "MaxSpawns", 0, maxVal);
    Print("MaxSpawns = " + maxVal.ToString());  // "MaxSpawns = 10"

    float radius;
    EnScript.GetClassVar(cfg, "SpawnRadius", 0, radius);
    Print("SpawnRadius = " + radius.ToString());  // "SpawnRadius = 100"

    string msg;
    EnScript.GetClassVar(cfg, "WelcomeMsg", 0, msg);
    Print("WelcomeMsg = " + msg);  // "WelcomeMsg = Hello!"

    // 名前で値を書き込む
    EnScript.SetClassVar(cfg, "MaxSpawns", 0, 50);
    EnScript.SetClassVar(cfg, "SpawnRadius", 0, 250.0);
    EnScript.SetClassVar(cfg, "WelcomeMsg", 0, "Welcome!");
}
```

> **警告:** `GetClassVar`/`SetClassVar` は変数名が間違っているか型が一致しない場合、暗黙的に失敗します。使用前に常に変数名を検証してください。

---

## 実践的な例

### ワールド内のすべての車両を見つける

```c
static array<CarScript> FindAllVehicles()
{
    array<CarScript> vehicles = new array<CarScript>;
    array<Object> allObjects = new array<Object>;
    array<CargoBase> proxyCargos = new array<CargoBase>;

    // 広いエリアを検索（またはミッション固有のロジックを使用）
    vector center = "7500 0 7500";
    GetGame().GetObjectsAtPosition(center, 15000.0, allObjects, proxyCargos);

    foreach (Object obj : allObjects)
    {
        CarScript car;
        if (Class.CastTo(car, obj))
        {
            vehicles.Insert(car);
        }
    }

    Print("Found " + vehicles.Count().ToString() + " vehicles");
    return vehicles;
}
```

### キャスト付き安全オブジェクトヘルパー

このパターンはDayZモディング全体で使用されています -- `Object` が生存しているかを `EntityAI` にキャストして安全にチェックするユーティリティ関数です：

```c
// Object.IsAlive()は基底Objectクラスには存在しません！
// 最初にEntityAIにキャストする必要があります。

static bool IsObjectAlive(Object obj)
{
    if (!obj)
        return false;

    EntityAI eai;
    if (Class.CastTo(eai, obj))
    {
        return eai.IsAlive();
    }

    return false;  // EntityAI以外のオブジェクト（建物など） -- 「生存していない」として扱う
}
```

### リフレクションベースの設定システム

このパターン（MyMod Coreで使用）は、フィールドを名前で読み書きする汎用設定システムを構築し、管理パネルが特定のクラスを知らなくても任意の設定を編集できるようにします：

```c
class ConfigBase
{
    // 名前でメンバー変数のインデックスを見つける
    protected int FindVarIndex(string fieldName)
    {
        typename t = Type();
        int count = t.GetVariableCount();
        for (int i = 0; i < count; i++)
        {
            if (t.GetVariableName(i) == fieldName)
                return i;
        }
        return -1;
    }

    // 任意のフィールド値を文字列として取得
    string GetFieldValue(string fieldName)
    {
        if (FindVarIndex(fieldName) == -1)
            return "";

        int iVal;
        EnScript.GetClassVar(this, fieldName, 0, iVal);
        return iVal.ToString();
    }

    // 文字列から任意のフィールド値を設定
    void SetFieldValue(string fieldName, string value)
    {
        if (FindVarIndex(fieldName) == -1)
            return;

        int iVal = value.ToInt();
        EnScript.SetClassVar(this, fieldName, 0, iVal);
    }
}

class MyModConfig : ConfigBase
{
    int MaxPlayers = 60;
    int RespawnTime = 300;
}

void AdminPanelSave(ConfigBase config, string fieldName, string newValue)
{
    // 任意のconfigサブクラスで動作 -- 型固有のコード不要
    config.SetFieldValue(fieldName, newValue);
}
```

### 型安全なイベントディスパッチ

`typename` を使用して、イベントを正しいハンドラにルーティングするディスパッチャーを構築します：

```c
class EventDispatcher
{
    protected ref map<typename, ref array<ref EventHandler>> m_Handlers;

    void EventDispatcher()
    {
        m_Handlers = new map<typename, ref array<ref EventHandler>>;
    }

    void Register(typename eventType, EventHandler handler)
    {
        if (!m_Handlers.Contains(eventType))
        {
            m_Handlers.Insert(eventType, new array<ref EventHandler>);
        }

        m_Handlers.Get(eventType).Insert(handler);
    }

    void Dispatch(EventBase event)
    {
        typename eventType = event.Type();

        array<ref EventHandler> handlers;
        if (m_Handlers.Find(eventType, handlers))
        {
            foreach (EventHandler handler : handlers)
            {
                handler.Handle(event);
            }
        }
    }
}
```

---

## ベストプラクティス

- すべてのキャスト後に必ずnullチェックを行ってください -- `Class.CastTo` と `Type.Cast` は両方とも失敗時にnullを返し、結果をチェックせずに使用するとクラッシュします。
- 成功/失敗で分岐する必要がある場合は `Class.CastTo` を使用し、nullチェックが続く簡潔な1行代入には `Type.Cast` を使用してください。
- コンパイル時に型がわかっている場合は `IsKindOf(string)` よりも `IsInherited(typename)` を優先してください -- 高速で、タイプミスをコンパイル時にキャッチできます。
- `IsAlive()` を呼び出す前に `EntityAI` にキャストしてください -- 基底 `Object` クラスにはこのメソッドがありません。
- `EnScript.GetClassVar` を使用する前に `GetVariableCount`/`GetVariableName` で変数名を検証してください -- 間違った名前では暗黙的に失敗します。

---

## 実際のModで確認されたパターン

> プロフェッショナルなDayZ Modのソースコードを調査して確認されたパターンです。

| パターン | Mod | 詳細 |
|---------|-----|--------|
| エンティティループでの `Class.CastTo` + `continue` | COT / Expansion | `Object` 配列上のすべてのループがキャストして続行パターンで不一致の型をスキップする |
| 設定駆動型チェックの `IsKindOf` | Expansion Market | JSONから読み込まれたアイテムカテゴリは型がデータであるため、文字列ベースの `IsKindOf` を使用する |
| 管理パネルの `EnScript.GetClassVar`/`SetClassVar` | Dabs Framework | 汎用設定エディタが名前でフィールドを読み書きし、1つのUIですべての設定クラスに対応する |
| ロギングの `obj.Type().ToString()` | VPP Admin | デバッグログには常に `entity.Type().ToString()` が含まれ、処理対象を特定する |

---

## 理論 vs 実践

| 概念 | 理論 | 現実 |
|---------|--------|---------|
| `Object.IsAlive()` | `Object` に存在することを期待する | `EntityAI` とサブクラスでのみ利用可能 -- `Object` で呼び出すとクラッシュする |
| `EnScript.SetClassVar` は `bool` を返す | 成功/失敗を示すはず | 間違ったフィールド名で暗黙的に `false` を返し、エラーメッセージなし -- 見逃しやすい |
| `typename.Spawn()` | 任意のクラスインスタンスを作成する | パラメータなしのコンストラクタを持つクラスでのみ動作する。ゲームエンティティには `CreateObject` を使用する |

---

## よくある間違い

### 1. キャスト後のnullチェック忘れ

```c
// 間違い -- objがPlayerBaseでない場合クラッシュ
PlayerBase player = PlayerBase.Cast(obj);
player.GetIdentity();  // キャスト失敗時にクラッシュ！

// 正しい
PlayerBase player = PlayerBase.Cast(obj);
if (player)
{
    player.GetIdentity();
}
```

### 2. 基底ObjectでIsAlive()を呼び出す

```c
// 間違い -- Object.IsAlive()は存在しない
Object obj = GetSomeObject();
if (obj.IsAlive())  // コンパイルエラーまたはランタイムクラッシュ！

// 正しい
EntityAI eai;
if (Class.CastTo(eai, obj) && eai.IsAlive())
{
    // 安全
}
```

### 3. 間違った変数名でリフレクションを使用

```c
// 暗黙的な失敗 -- エラーなし、ゼロ/空が返されるだけ
int val;
EnScript.GetClassVar(obj, "NonExistentField", 0, val);
// valは0、エラーはスローされない
```

常に `FindVarIndex` または `GetVariableCount`/`GetVariableName` で最初に検証してください。

### 4. Type()とtypenameリテラルの混同

```c
// Type() -- インスタンスのランタイム型を返す
typename t = myObj.Type();  // 例: PlayerBase

// typenameリテラル -- コンパイル時の型参照
typename t = PlayerBase;    // 常にPlayerBase

// 比較可能
if (myObj.Type() == PlayerBase)  // myObjがPlayerBaseの場合true
```

---

## まとめ

| 操作 | 構文 | 戻り値 |
|-----------|--------|---------|
| 安全なダウンキャスト | `Class.CastTo(out target, source)` | `bool` |
| インラインキャスト | `TargetType.Cast(source)` | ターゲットまたは `null` |
| 型チェック（typename） | `obj.IsInherited(typename)` | `bool` |
| 型チェック（文字列） | `obj.IsKindOf("ClassName")` | `bool` |
| ランタイム型の取得 | `obj.Type()` | `typename` |
| 変数の数 | `obj.Type().GetVariableCount()` | `int` |
| 変数名 | `obj.Type().GetVariableName(i)` | `string` |
| 変数の型 | `obj.Type().GetVariableType(i)` | `typename` |
| プロパティの読み取り | `EnScript.GetClassVar(obj, name, 0, out val)` | `void` |
| プロパティの書き込み | `EnScript.SetClassVar(obj, name, 0, val)` | `bool` |

---

## ナビゲーション

| 前へ | 上へ | 次へ |
|----------|----|------|
| [1.8 メモリ管理](08-memory-management.md) | [パート1: Enforce Script](../README.md) | [1.10 列挙型とプリプロセッサ](10-enums-preprocessor.md) |
