# 第1.6章: 文字列操作

[ホーム](../README.md) | [<< 前へ: 制御フロー](05-control-flow.md) | **文字列操作** | [次へ: 数学とベクトル >>](07-math-vectors.md)

---

## はじめに

Enforce Script の文字列は `int` や `float` と同様の**値型**です。値渡しされ、値で比較されます。`string` 型には、検索、スライス、変換、テキスト書式設定のための豊富なビルトインメソッドがあります。この章は、DayZ スクリプティングで利用可能なすべての文字列操作の完全なリファレンスであり、Mod 開発の実例を含みます。

---

## 文字列の基本

```c
// 宣言と初期化
string empty;                          // ""（デフォルトは空文字列）
string greeting = "Hello, Chernarus!";
string combined = "Player: " + "John"; // + で結合

// 文字列は値型 -- 代入するとコピーが作成される
string original = "DayZ";
string copy = original;
copy = "Arma";
Print(original); // まだ "DayZ"
```

---

## 完全な文字列メソッドリファレンス

### Length

文字列の文字数を返します。

```c
string s = "Hello";
int len = s.Length(); // 5

string empty = "";
int emptyLen = empty.Length(); // 0
```

### Substring

文字列の一部を抽出します。パラメータ: `start`（インデックス）、`length`（文字数）。

```c
string s = "Hello World";
string word = s.Substring(6, 5);  // "World"
string first = s.Substring(0, 5); // "Hello"

// ある位置から末尾まで抽出
string rest = s.Substring(6, s.Length() - 6); // "World"
```

### IndexOf

部分文字列の最初の出現位置を見つけます。インデックスを返し、見つからない場合は `-1` を返します。

```c
string s = "Hello World";
int idx = s.IndexOf("World");     // 6
int notFound = s.IndexOf("DayZ"); // -1
```

### IndexOfFrom

指定されたインデックスから開始して最初の出現位置を見つけます。

```c
string s = "one-two-one-two";
int first = s.IndexOf("one");        // 0
int second = s.IndexOfFrom(1, "one"); // 8
```

### LastIndexOf

部分文字列の最後の出現位置を見つけます。

```c
string path = "profiles/MyMod/Players/player.json";
int lastSlash = path.LastIndexOf("/"); // 23
```

### Contains

文字列が指定された部分文字列を含む場合に `true` を返します。

```c
string chatMsg = "!teleport 100 0 200";
if (chatMsg.Contains("!teleport"))
{
    Print("Teleport command detected");
}
```

### Replace

部分文字列のすべての出現を置換します。**文字列をその場で変更し**、置換回数を返します。

```c
string s = "Hello World World";
int count = s.Replace("World", "DayZ");
// s は "Hello DayZ DayZ" になる
// count は 2
```

### Split

デリミタで文字列を分割し、配列を埋めます。配列は事前に割り当てておく必要があります。

```c
string csv = "AK101,M4A1,UMP45,Mosin9130";
TStringArray weapons = new TStringArray;
csv.Split(",", weapons);
// weapons = ["AK101", "M4A1", "UMP45", "Mosin9130"]

// チャットコマンドをスペースで分割
string chatLine = "!spawn Barrel_Green 5";
TStringArray parts = new TStringArray;
chatLine.Split(" ", parts);
// parts = ["!spawn", "Barrel_Green", "5"]
string command = parts.Get(0);   // "!spawn"
string itemType = parts.Get(1);  // "Barrel_Green"
int amount = parts.Get(2).ToInt(); // 5
```

### Join（静的）

文字列配列をセパレータで結合します。

```c
TStringArray names = {"Alice", "Bob", "Charlie"};
string result = string.Join(", ", names);
// result = "Alice, Bob, Charlie"
```

### Format（静的）

番号付きプレースホルダー `%1` から `%9` を使用して文字列を構築します。これは Enforce Script でフォーマット済み文字列を構築する主要な方法です。

```c
string name = "John";
int kills = 15;
float distance = 342.5;

string msg = string.Format("Player %1 has %2 kills (best shot: %3m)", name, kills, distance);
// msg = "Player John has 15 kills (best shot: 342.5m)"
```

プレースホルダーは **1始まり**です（`%1` が最初の引数、`%0` ではありません）。最大9つのプレースホルダーを使用できます。

```c
string log = string.Format("[%1] %2 :: %3", "MyMod", "INFO", "Server started");
// log = "[MyMod] INFO :: Server started"
```

> **注意:** `printf` スタイルのフォーマット（`%d`, `%f`, `%s`）はありません。`%1` から `%9` のみです。

### ToLower

文字列を小文字に変換します。**その場で変更**します --- 新しい文字列を返しません。

```c
string s = "Hello WORLD";
s.ToLower();
Print(s); // "hello world"
```

### ToUpper

文字列を大文字に変換します。**その場で変更**します。

```c
string s = "Hello World";
s.ToUpper();
Print(s); // "HELLO WORLD"
```

### Trim / TrimInPlace

先頭と末尾の空白を除去します。**その場で変更**します。

```c
string s = "  Hello World  ";
s.TrimInPlace();
Print(s); // "Hello World"
```

トリミングされた新しい文字列を返す `Trim()` もあります（一部のエンジンバージョンで利用可能）:

```c
string raw = "  padded  ";
string clean = raw.Trim();
// clean = "padded"、raw は変更なし
```

### Get

インデックスの1文字を文字列として取得します。

```c
string s = "DayZ";
string ch = s.Get(0); // "D"
string ch2 = s.Get(3); // "Z"
```

### Set

インデックスの1文字を設定します。

```c
string s = "DayZ";
s.Set(0, "N");
Print(s); // "NayZ"
```

### ToInt

数値文字列を整数に変換します。

```c
string s = "42";
int num = s.ToInt(); // 42

string bad = "hello";
int zero = bad.ToInt(); // 0（数値でない文字列は 0 を返す）
```

### ToFloat

数値文字列を浮動小数点数に変換します。

```c
string s = "3.14";
float f = s.ToFloat(); // 3.14
```

### ToVector

スペース区切りの3つの数値の文字列をベクトルに変換します。

```c
string s = "100.5 0 200.3";
vector pos = s.ToVector(); // Vector(100.5, 0, 200.3)
```

---

## 文字列比較

文字列は標準的な演算子を使用して値で比較されます。比較は**大文字小文字を区別**し、辞書的（辞書順）な順序に従います。

```c
string a = "Apple";
string b = "Banana";
string c = "Apple";

bool equal    = (a == c);  // true
bool notEqual = (a != b);  // true
bool less     = (a < b);   // true（辞書順で "Apple" < "Banana"）
bool greater  = (b > a);   // true
```

### 大文字小文字を区別しない比較

ビルトインの大文字小文字を区別しない比較はありません。まず両方の文字列を小文字に変換してください:

```c
bool EqualsIgnoreCase(string a, string b)
{
    string lowerA = a;
    string lowerB = b;
    lowerA.ToLower();
    lowerB.ToLower();
    return lowerA == lowerB;
}
```

---

## 文字列の結合

`+` 演算子を使用して文字列を結合します。文字列でない型は自動的に変換されます。

```c
string name = "John";
int health = 75;
float distance = 42.5;

string msg = "Player " + name + " has " + health + " HP at " + distance + "m";
// "Player John has 75 HP at 42.5m"
```

複雑なフォーマットには、結合より `string.Format()` を優先してください --- より読みやすく、`+` 結合の型変換の落とし穴を避けられます。

```c
// こちらを優先:
string msg = string.Format("Player %1 has %2 HP at %3m", name, health, distance);

// こちらより:
string msg2 = "Player " + name + " has " + health + " HP at " + distance + "m";
```

---

## 実践的な例

### チャットコマンドの解析

```c
void ProcessChatMessage(string sender, string message)
{
    // 空白をトリム
    message.TrimInPlace();

    // ! で始まる必要がある
    if (message.Length() == 0 || message.Get(0) != "!")
        return;

    // パーツに分割
    TStringArray parts = new TStringArray;
    message.Split(" ", parts);

    if (parts.Count() == 0)
        return;

    string command = parts.Get(0);
    command.ToLower();

    switch (command)
    {
        case "!heal":
            Print(string.Format("[CMD] %1 used !heal", sender));
            break;

        case "!spawn":
            if (parts.Count() >= 2)
            {
                string itemType = parts.Get(1);
                int quantity = 1;
                if (parts.Count() >= 3)
                    quantity = parts.Get(2).ToInt();

                Print(string.Format("[CMD] %1 spawning %2 x%3", sender, itemType, quantity));
            }
            break;

        case "!tp":
            if (parts.Count() >= 4)
            {
                float x = parts.Get(1).ToFloat();
                float y = parts.Get(2).ToFloat();
                float z = parts.Get(3).ToFloat();
                vector pos = Vector(x, y, z);
                Print(string.Format("[CMD] %1 teleporting to %2", sender, pos.ToString()));
            }
            break;
    }
}
```

### 表示用のプレイヤー名のフォーマット

```c
string FormatPlayerTag(string name, string clanTag, bool isAdmin)
{
    string result = "";

    if (clanTag.Length() > 0)
    {
        result = "[" + clanTag + "] ";
    }

    result = result + name;

    if (isAdmin)
    {
        result = result + " (Admin)";
    }

    return result;
}
// FormatPlayerTag("John", "DZR", true) => "[DZR] John (Admin)"
// FormatPlayerTag("Jane", "", false)   => "Jane"
```

### ファイルパスの構築

```c
string BuildPlayerFilePath(string steamId)
{
    return "$profile:MyMod/Players/" + steamId + ".json";
}
```

### ログメッセージのサニタイズ

```c
string SanitizeForLog(string input)
{
    string safe = input;
    safe.Replace("\n", " ");
    safe.Replace("\r", "");
    safe.Replace("\t", " ");

    // 最大長に切り詰め
    if (safe.Length() > 200)
    {
        safe = safe.Substring(0, 197) + "...";
    }

    return safe;
}
```

### パスからファイル名を抽出

```c
string GetFileName(string path)
{
    int lastSlash = path.LastIndexOf("/");
    if (lastSlash == -1)
        lastSlash = path.LastIndexOf("\\");

    if (lastSlash >= 0 && lastSlash < path.Length() - 1)
    {
        return path.Substring(lastSlash + 1, path.Length() - lastSlash - 1);
    }

    return path;
}
// GetFileName("profiles/MyMod/config.json") => "config.json"
```

---

## ベストプラクティス

- すべてのフォーマット済み出力には `%1`..`%9` プレースホルダー付きの `string.Format()` を使用してください --- より読みやすく、`+` 結合の型変換の落とし穴を避けられます。
- `ToLower()`、`ToUpper()`、`Replace()` は文字列をその場で変更することを覚えておいてください --- 元の文字列を保持する必要がある場合は先にコピーしてください。
- `Split()` を呼ぶ前に必ず `new TStringArray` でターゲット配列を割り当ててください --- null 配列を渡すとクラッシュします。
- 単純な部分文字列チェックには `Contains()` を使用し、位置が必要な場合にのみ `IndexOf()` を使用してください。
- 大文字小文字を区別しない比較には、両方の文字列をコピーして比較前にそれぞれ `ToLower()` を呼び出してください --- ビルトインの大文字小文字を区別しない比較はありません。

---

## 実際の Mod で確認されたパターン

> プロフェッショナルな DayZ Mod のソースコードを研究して確認されたパターンです。

| パターン | Mod | 詳細 |
|---------|-----|--------|
| チャットコマンド解析のための `Split(" ", parts)` | VPP / COT | すべてのチャットコマンドシステムはスペースで分割し、`parts.Get(0)` で switch |
| `[TAG]` プレフィックス付き `string.Format` | Expansion / Dabs | ログメッセージは結合ではなく常に `string.Format("[%1] %2", tag, msg)` を使用 |
| `"$profile:ModName/"` パス規約 | COT / Expansion | `+` で構築されたファイルパスはバックスラッシュの問題を避けるためにスラッシュと `$profile:` プレフィックスを使用 |
| コマンドマッチング前の `ToLower()` | VPP Admin | 大文字小文字混在の入力を処理するため、`switch`/比較前にユーザー入力を小文字化 |

---

## 理論 vs 実践

| 概念 | 理論 | 現実 |
|---------|--------|---------|
| `ToLower()` / `Replace()` の戻り値 | 新しい文字列を返すことが期待される（C# のように） | その場で変更し、`void` またはカウントを返す --- 頻繁なバグの原因 |
| `string.Format` プレースホルダー | C の printf のような `%d`, `%f`, `%s` | `%1` から `%9` のみが動作; C スタイルの指定子は無視される |
| 文字列中のバックスラッシュ `\\` | 標準的なエスケープ文字 | JSON コンテキストで DayZ の CParser を壊す可能性がある --- パスにはスラッシュを優先 |

---

## よくある間違い

| 間違い | 問題 | 修正 |
|---------|---------|-----|
| `ToLower()` が新しい文字列を返すと期待 | `ToLower()` はその場で変更、`void` を返す | 先に文字列をコピーし、コピーに `ToLower()` を呼ぶ |
| `ToUpper()` が新しい文字列を返すと期待 | 同上 -- その場で変更 | 先にコピーし、コピーに `ToUpper()` を呼ぶ |
| `Replace()` が新しい文字列を返すと期待 | `Replace()` はその場で変更、置換回数を返す | 元が必要な場合は先に文字列をコピー |
| `string.Format()` で `%0` を使用 | プレースホルダーは1始まり（`%1` から `%9`） | `%1` から開始 |
| `%d`, `%f`, `%s` フォーマット指定子の使用 | C スタイルのフォーマット指定子は動作しない | `%1`, `%2` などを使用 |
| 大文字小文字を正規化せずに文字列を比較 | `"Hello" != "hello"` | 比較前に両方に `ToLower()` を呼ぶ |
| 文字列を参照型として扱う | 文字列は値型; 代入するとコピーが作成される | 通常は問題ない -- コピーの変更が元に影響しないことを認識すること |
| `Split()` 前に配列を作成し忘れ | null 配列に `Split()` を呼ぶとクラッシュ | 常に: `Split()` 前に `TStringArray parts = new TStringArray;` |

---

## クイックリファレンス

```c
// Length
int len = s.Length();

// 検索
int idx = s.IndexOf("sub");
int idx = s.IndexOfFrom(startIdx, "sub");
int idx = s.LastIndexOf("sub");
bool has = s.Contains("sub");

// 抽出
string sub = s.Substring(start, length);
string ch  = s.Get(index);

// 変更（その場で）
s.Set(index, "x");
int count = s.Replace("old", "new");
s.ToLower();
s.ToUpper();
s.TrimInPlace();

// 分割と結合
TStringArray parts = new TStringArray;
s.Split(delimiter, parts);
string joined = string.Join(sep, parts);

// Format（静的、%1-%9 プレースホルダー）
string msg = string.Format("Hello %1, you have %2 items", name, count);

// 変換
int n    = s.ToInt();
float f  = s.ToFloat();
vector v = s.ToVector();

// 比較（大文字小文字区別、辞書順）
bool eq = (a == b);
bool lt = (a < b);
```

---

[<< 1.5: 制御フロー](05-control-flow.md) | [ホーム](../README.md) | [1.7: 数学とベクトル >>](07-math-vectors.md)
