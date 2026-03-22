# Enforce Script チートシート

[ホーム](./README.md) | **チートシート**

---

> DayZ Enforce Script のシングルページクイックリファレンスです。ブックマークしておきましょう。

---

## 型

| 型 | 説明 | デフォルト値 | 例 |
|------|-------------|---------|---------|
| `int` | 32ビット符号付き整数 | `0` | `int x = 42;` |
| `float` | 32ビット浮動小数点数 | `0.0` | `float f = 3.14;` |
| `bool` | ブーリアン | `false` | `bool b = true;` |
| `string` | イミュータブルな値型 | `""` | `string s = "hello";` |
| `vector` | 3成分浮動小数点数 (x,y,z) | `"0 0 0"` | `vector v = "1 2 3";` |
| `typename` | 型参照 | `null` | `typename t = PlayerBase;` |
| `Class` | すべての参照型のルート | `null` | — |
| `void` | 戻り値なし | — | — |

**限界値:** `int.MAX` = 2147483647, `int.MIN` = -2147483648, `float.MAX`, `float.MIN`

---

## 配列メソッド (`array<T>`)

| メソッド | 戻り値 | 備考 |
|--------|---------|-------|
| `Insert(item)` | `int` (インデックス) | 末尾に追加 |
| `InsertAt(item, idx)` | `void` | 指定位置に挿入 |
| `Get(idx)` / `arr[idx]` | `T` | インデックスでアクセス |
| `Set(idx, item)` | `void` | インデックスで置換 |
| `Find(item)` | `int` | インデックスまたは -1 |
| `Count()` | `int` | 要素数 |
| `IsValidIndex(idx)` | `bool` | 範囲チェック |
| `Remove(idx)` | `void` | **順序なし**（最後の要素とスワップ！） |
| `RemoveOrdered(idx)` | `void` | 順序を保持 |
| `RemoveItem(item)` | `void` | 検索 + 削除（順序保持） |
| `Clear()` | `void` | すべて削除 |
| `Sort()` / `Sort(true)` | `void` | 昇順 / 降順 |
| `ShuffleArray()` | `void` | ランダム化 |
| `Invert()` | `void` | 逆順にする |
| `GetRandomElement()` | `T` | ランダムに選択 |
| `InsertAll(other)` | `void` | 他の配列からすべて追加 |
| `Copy(other)` | `void` | コピーで置換 |
| `Resize(n)` | `void` | リサイズ（デフォルト値で埋める） |
| `Reserve(n)` | `void` | 容量を事前確保 |

**型定義:** `TStringArray`, `TIntArray`, `TFloatArray`, `TBoolArray`, `TVectorArray`

---

## マップメソッド (`map<K,V>`)

| メソッド | 戻り値 | 備考 |
|--------|---------|-------|
| `Insert(key, val)` | `bool` | 新規追加 |
| `Set(key, val)` | `void` | 挿入または更新 |
| `Get(key)` | `V` | 存在しない場合はデフォルト値を返す |
| `Find(key, out val)` | `bool` | 安全な取得 |
| `Contains(key)` | `bool` | 存在チェック |
| `Remove(key)` | `void` | キーで削除 |
| `Count()` | `int` | エントリ数 |
| `GetKey(idx)` | `K` | インデックスのキー (O(n)) |
| `GetElement(idx)` | `V` | インデックスの値 (O(n)) |
| `GetKeyArray()` | `array<K>` | すべてのキー |
| `GetValueArray()` | `array<V>` | すべての値 |
| `Clear()` | `void` | すべて削除 |

---

## セットメソッド (`set<T>`)

| メソッド | 戻り値 |
|--------|---------|
| `Insert(item)` | `int` (インデックス) |
| `Find(item)` | `int` (インデックスまたは -1) |
| `Get(idx)` | `T` |
| `Remove(idx)` | `void` |
| `RemoveItem(item)` | `void` |
| `Count()` | `int` |
| `Clear()` | `void` |

---

## クラス構文

```c
class MyClass extends BaseClass
{
    protected int m_Value;                  // フィールド
    private ref array<string> m_List;       // 所有参照

    void MyClass() { m_List = new array<string>; }  // コンストラクタ
    void ~MyClass() { }                              // デストラクタ

    override void OnInit() { super.OnInit(); }       // オーバーライド
    static int GetCount() { return 0; }              // 静的メソッド
};
```

**アクセス修飾子:** `private` | `protected` | (デフォルトは public)
**修飾子:** `static` | `override` | `ref` | `const` | `out` | `notnull`
**Modded クラス:** `modded class MissionServer { override void OnInit() { super.OnInit(); } }`

---

## 制御フロー

```c
// if / else if / else
if (a > 0) { } else if (a == 0) { } else { }

// for
for (int i = 0; i < count; i++) { }

// foreach (値のみ)
foreach (string item : myArray) { }

// foreach (インデックス + 値)
foreach (int i, string item : myArray) { }

// foreach (マップ: キー + 値)
foreach (string key, int val : myMap) { }

// while
while (condition) { }

// switch (フォールスルーなし！)
switch (val) { case 0: Print("zero"); break; default: break; }
```

---

## 文字列メソッド

| メソッド | 戻り値 | 例 |
|--------|---------|---------|
| `s.Length()` | `int` | `"hello".Length()` = 5 |
| `s.Substring(start, len)` | `string` | `"hello".Substring(1,3)` = `"ell"` |
| `s.IndexOf(sub)` | `int` | 見つからない場合は -1 |
| `s.LastIndexOf(sub)` | `int` | 末尾から検索 |
| `s.Contains(sub)` | `bool` | |
| `s.Replace(old, new)` | `int` | その場で変更、置換回数を返す |
| `s.ToLower()` | `void` | **その場で変更！** |
| `s.ToUpper()` | `void` | **その場で変更！** |
| `s.TrimInPlace()` | `void` | **その場で変更！** |
| `s.Split(delim, out arr)` | `void` | TStringArray に分割 |
| `s.Get(idx)` | `string` | 1文字取得 |
| `s.Set(idx, ch)` | `void` | 文字を置換 |
| `s.ToInt()` | `int` | 整数にパース |
| `s.ToFloat()` | `float` | 浮動小数点にパース |
| `s.ToVector()` | `vector` | `"1 2 3"` をパース |
| `string.Format(fmt, ...)` | `string` | `%1`..`%9` プレースホルダー |
| `string.Join(sep, arr)` | `string` | 配列要素を結合 |

---

## 数学メソッド

| メソッド | 説明 |
|--------|-------------|
| `Math.RandomInt(min, max)` | `[min, max)` 最大値を含まない |
| `Math.RandomIntInclusive(min, max)` | `[min, max]` |
| `Math.RandomFloat01()` | `[0, 1]` |
| `Math.RandomBool()` | ランダムな true/false |
| `Math.Round(f)` / `Floor(f)` / `Ceil(f)` | 丸め |
| `Math.AbsFloat(f)` / `AbsInt(i)` | 絶対値 |
| `Math.Clamp(val, min, max)` | 範囲にクランプ |
| `Math.Min(a, b)` / `Max(a, b)` | 最小/最大 |
| `Math.Lerp(a, b, t)` | 線形補間 |
| `Math.InverseLerp(a, b, val)` | 逆線形補間 |
| `Math.Pow(base, exp)` / `Sqrt(f)` | べき乗/平方根 |
| `Math.Sin(r)` / `Cos(r)` / `Tan(r)` | 三角関数（ラジアン） |
| `Math.Atan2(y, x)` | 成分から角度を算出 |
| `Math.NormalizeAngle(deg)` | 0-360 に正規化 |
| `Math.SqrFloat(f)` / `SqrInt(i)` | 二乗 |

**定数:** `Math.PI`, `Math.PI2`, `Math.PI_HALF`, `Math.DEG2RAD`, `Math.RAD2DEG`

**ベクトル:** `vector.Distance(a,b)`, `vector.DistanceSq(a,b)`, `vector.Direction(a,b)`, `vector.Dot(a,b)`, `vector.Lerp(a,b,t)`, `v.Length()`, `v.Normalized()`

---

## よく使うパターン

### 安全なダウンキャスト

```c
PlayerBase player;
if (Class.CastTo(player, obj))
{
    player.DoSomething();
}
```

### インラインキャスト

```c
PlayerBase player = PlayerBase.Cast(obj);
if (player) player.DoSomething();
```

### Null ガード

```c
if (!player) return;
if (!player.GetIdentity()) return;
string name = player.GetIdentity().GetName();
```

### IsAlive チェック（EntityAI が必要）

```c
EntityAI eai;
if (Class.CastTo(eai, obj) && eai.IsAlive()) { }
```

### Foreach マップイテレーション

```c
foreach (string key, int value : myMap)
{
    Print(key + " = " + value.ToString());
}
```

### Enum 変換

```c
string name = typename.EnumToString(EDamageState, state);
int val; typename.StringToEnum(EDamageState, "RUINED", val);
```

### ビットフラグ

```c
int flags = FLAG_A | FLAG_B;       // 結合
if (flags & FLAG_A) { }           // テスト
flags = flags & ~FLAG_B;          // 除去
```

---

## 存在しない機能

| 存在しない機能 | 回避策 |
|----------------|------------|
| 三項演算子 `? :` | `if/else` |
| `do...while` | `while(true) { ... break; }` |
| `try/catch` | ガード句 + 早期リターン |
| 多重継承 | 単一継承 + コンポジション |
| 演算子オーバーロード | 名前付きメソッド（`[]` は Get/Set で可能） |
| ラムダ | 名前付きメソッド |
| `nullptr` | `null` / `NULL` |
| 文字列中の `\\` / `\"` | 使用禁止（CParser が壊れる） |
| `#include` | config.cpp の `files[]` |
| 名前空間 | 名前プレフィックス（`MyMod_`, `VPP_`） |
| インターフェース / abstract | 空のベースメソッド |
| switch フォールスルー | 各 case は独立 |
| `#define` の値 | `const` を使用 |
| デフォルト引数の式 | リテラル/NULL のみ |
| 可変長引数 | `string.Format` または配列 |
| else-if での変数再宣言 | ブランチごとに一意な名前 |

---

## ウィジェット作成（プログラム的）

```c
// ワークスペースの取得
WorkspaceWidget ws = GetGame().GetWorkspace();

// レイアウトから作成
Widget root = ws.CreateWidgets("MyMod/gui/layouts/MyPanel.layout");

// 子ウィジェットを検索
TextWidget title = TextWidget.Cast(root.FindAnyWidget("TitleText"));
if (title) title.SetText("Hello World");

// 表示/非表示
root.Show(true);
root.Show(false);
```

---

## RPC パターン

**登録（サーバー側）:**
```c
// 3_Game または 4_World の初期化で:
GetGame().RPCSingleParam(null, MY_RPC_ID, null, true, identity);  // エンジン RPC

// 文字列ルーティング RPC（MyRPC / CF）:
GetRPCManager().AddRPC("MyMod", "RPC_Handler", this, 2);  // CF
MyRPC.Register("MyMod", "MyRoute", this, MyRPCSide.SERVER);  // MyMod
```

**送信（クライアントからサーバーへ）:**
```c
Param2<string, int> data = new Param2<string, int>("itemName", 5);
GetGame().RPCSingleParam(null, MY_RPC_ID, data, true);
```

**受信（サーバー側ハンドラー）:**
```c
void RPC_Handler(CallType type, ParamsReadContext ctx, PlayerIdentity sender, Object target)
{
    if (type != CallType.Server) return;
    if (!sender) return;

    Param2<string, int> data;
    if (!ctx.Read(data)) return;

    string itemName = data.param1;
    int quantity = data.param2;
    // 処理...
}
```

---

## エラーハンドリング

```c
ErrorEx("message");                              // デフォルトの ERROR レベル
ErrorEx("info", ErrorExSeverity.INFO);           // 情報
ErrorEx("warning", ErrorExSeverity.WARNING);     // 警告
Print("debug output");                           // スクリプトログ
string stack = DumpStackString();                // コールスタックを取得
```

---

## ファイル I/O

```c
// パス: "$profile:", "$saves:", "$mission:", "$CurrentDir:"
bool exists = FileExist("$profile:MyMod/config.json");
MakeDirectory("$profile:MyMod");

// JSON
MyConfig cfg = new MyConfig();
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);  // VOID を返す！
JsonFileLoader<MyConfig>.JsonSaveFile(path, cfg);

// 生ファイル
FileHandle fh = OpenFile(path, FileMode.WRITE);
if (fh != 0) { FPrintln(fh, "line"); CloseFile(fh); }
```

---

## オブジェクト作成

```c
// 基本
Object obj = GetGame().CreateObject("AK101", pos, false, false, true);

// フラグ付き
Object obj = GetGame().CreateObjectEx("Barrel_Green", pos, ECE_PLACE_ON_SURFACE);

// プレイヤーのインベントリに作成
player.GetInventory().CreateInInventory("BandageDressing");

// アタッチメントとして
weapon.GetInventory().CreateAttachment("ACOGOptic");

// 削除
GetGame().ObjectDelete(obj);
```

---

## 主要なグローバル関数

```c
GetGame()                          // CGame インスタンス
GetGame().GetPlayer()              // ローカルプレイヤー（クライアントのみ、サーバーでは null！）
GetGame().GetPlayers(out arr)      // すべてのプレイヤー（サーバー）
GetGame().GetWorld()               // World インスタンス
GetGame().GetTickTime()            // サーバー時間 (float)
GetGame().GetWorkspace()           // UI ワークスペース
GetGame().SurfaceY(x, z)          // 地形の高さ
GetGame().IsServer()               // サーバーなら true
GetGame().IsClient()               // クライアントなら true
GetGame().IsMultiplayer()          // マルチプレイヤーなら true
```

---

*完全なドキュメント: [DayZ Modding Wiki](./README.md) | [注意点](01-enforce-script/12-gotchas.md) | [エラーハンドリング](01-enforce-script/11-error-handling.md)*
