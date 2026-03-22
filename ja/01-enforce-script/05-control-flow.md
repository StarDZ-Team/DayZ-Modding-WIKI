# 第1.5章: 制御フロー

[ホーム](../README.md) | [<< 前へ: Modded クラス](04-modded-classes.md) | **制御フロー** | [次へ: 文字列操作 >>](06-strings.md)

---

## はじめに

制御フローはコードが実行される順序を決定します。Enforce Script はおなじみの `if/else`、`for`、`while`、`foreach`、`switch` 構文を提供しますが、C/C++ とのいくつかの重要な違いがあり、準備していないと思わぬ落とし穴にはまります。この章では、DayZ のスクリプトエンジン固有の注意点を含む、利用可能なすべての制御フローメカニズムを解説します。

---

## if / else / else if

`if` 文はブーリアン式を評価し、結果が `true` の場合にコードブロックを実行します。`else if` で条件を連鎖させ、`else` でフォールバックを提供できます。

```c
void CheckHealth(PlayerBase player)
{
    float health = player.GetHealth("", "Health");

    if (health > 75)
    {
        Print("Player is healthy");
    }
    else if (health > 25)
    {
        Print("Player is wounded");
    }
    else
    {
        Print("Player is critical");
    }
}
```

### Null チェック

Enforce Script では、オブジェクト参照は null の場合に `false` と評価されます。これは null アクセスを防ぐための標準的な方法です。

```c
void ProcessItem(EntityAI item)
{
    if (!item)
        return;

    string name = item.GetType();
    Print("Processing: " + name);
}
```

### 論理演算子

`&&`（AND）と `||`（OR）で条件を結合します。短絡評価が適用されます: `&&` の左辺が `false` の場合、右辺は評価されません。

```c
void CheckPlayerState(PlayerBase player)
{
    if (player && player.IsAlive())
    {
        // 安全 -- IsAlive() を呼ぶ前に player の null チェックが行われる
        Print("Player is alive");
    }

    if (player.GetHealth("", "Blood") < 3000 || player.GetHealth("", "Health") < 25)
    {
        Print("Player is in danger");
    }
}
```

### 注意: else-if ブロックでの変数再宣言

これは最も一般的な Enforce Script エラーの1つです。ほとんどの言語では、1つの `if` ブランチ内で宣言された変数は兄弟の `else` ブランチ内の変数とは独立しています。**Enforce Script ではそうではありません。** 兄弟の `if`/`else if`/`else` ブロックで同じ変数名を宣言すると、コンパイル時に **多重宣言エラー** が発生します。

```c
// 間違い -- コンパイルエラー!
void BadExample(Object obj)
{
    if (obj.IsKindOf("Car"))
    {
        Car vehicle = Car.Cast(obj);
        vehicle.GetSpeedometer();
    }
    else if (obj.IsKindOf("ItemBase"))
    {
        ItemBase item = ItemBase.Cast(obj);    // OK -- 異なる名前
        item.GetQuantity();
    }
    else
    {
        string msg = "Unknown object";         // msg の最初の宣言
        Print(msg);
    }
}
```

上記は問題なさそうに見えますが、2つのブランチで**同じ変数名**を使用すると問題が発生します:

```c
// 間違い -- コンパイルエラー: 'result' の多重宣言
void ProcessObject(Object obj)
{
    if (obj.IsKindOf("Car"))
    {
        string result = "It's a car";
        Print(result);
    }
    else
    {
        string result = "It's something else";  // エラー! if ブロックと同じ名前
        Print(result);
    }
}
```

**修正方法:** if 文の**前に**変数を宣言するか、ブランチごとに一意の名前を使用します。

```c
// 正しい -- if の前に宣言
void ProcessObject(Object obj)
{
    string result;

    if (obj.IsKindOf("Car"))
    {
        result = "It's a car";
    }
    else
    {
        result = "It's something else";
    }

    Print(result);
}
```

---

## for ループ

`for` ループは C スタイルの構文と同一です: 初期化子、条件、インクリメント。

```c
// 0 から 9 までの数字を表示
void CountToTen()
{
    for (int i = 0; i < 10; i++)
    {
        Print(i);
    }
}
```

### for でのインデックスの配列イテレーション

```c
void ListInventory(PlayerBase player)
{
    array<EntityAI> items = new array<EntityAI>;
    player.GetInventory().EnumerateInventory(InventoryTraversalType.PREORDER, items);

    for (int i = 0; i < items.Count(); i++)
    {
        EntityAI item = items.Get(i);
        if (item)
        {
            Print(string.Format("[%1] %2", i, item.GetType()));
        }
    }
}
```

### ネストされた for ループ

```c
// オブジェクトのグリッドをスポーン
void SpawnGrid(vector origin, int rows, int cols, float spacing)
{
    for (int r = 0; r < rows; r++)
    {
        for (int c = 0; c < cols; c++)
        {
            vector pos = origin;
            pos[0] = pos[0] + (c * spacing);
            pos[2] = pos[2] + (r * spacing);
            pos[1] = GetGame().SurfaceY(pos[0], pos[2]);

            GetGame().CreateObject("Barrel_Green", pos, false, false, true);
        }
    }
}
```

> **注意:** 囲んでいるスコープにすでに `i` という名前の変数がある場合、ループ変数 `i` を再宣言しないでください。Enforce Script はネストされたスコープでもこれを多重宣言エラーとして扱います。

---

## while ループ

`while` ループは条件が `true` の間ブロックを繰り返します。条件は各反復の**前に**評価されます。

```c
// トラッキングリストからすべての死んだゾンビを除去
void CleanupDeadZombies(array<DayZInfected> zombieList)
{
    int i = 0;
    while (i < zombieList.Count())
    {
        EntityAI eai;
        if (Class.CastTo(eai, zombieList.Get(i)) && !eai.IsAlive())
        {
            zombieList.RemoveOrdered(i);
            // i をインクリメントしない -- 次の要素がこのインデックスにシフトしている
        }
        else
        {
            i++;
        }
    }
}
```

### 警告: Enforce Script には do...while が存在しません

`do...while` キーワードは存在しません。コンパイラはこれを拒否します。少なくとも1回は必ず実行するループが必要な場合は、以下で説明するフラグパターンを使用してください。

```c
// 間違い -- これはコンパイルされません
do
{
    // 本体
}
while (someCondition);
```

---

## フラグを使った do...while のシミュレーション

標準的な回避策は、最初の反復で `true` になる `bool` フラグを使用することです。

```c
void SimulateDoWhile()
{
    bool first = true;
    int attempts = 0;
    vector spawnPos;

    while (first || !IsPositionSafe(spawnPos))
    {
        first = false;
        attempts++;
        spawnPos = GetRandomPosition();

        if (attempts > 100)
            break;
    }

    Print(string.Format("Found safe position after %1 attempts", attempts));
}
```

`break` を使用した代替アプローチ:

```c
void AlternativeDoWhile()
{
    while (true)
    {
        // 本体は少なくとも1回実行される
        DoSomething();

        // 終了条件を末尾でチェック
        if (!ShouldContinue())
            break;
    }
}
```

---

## foreach

`foreach` 文は配列、マップ、静的配列をイテレートする最もクリーンな方法です。2つの形式があります。

### シンプルな foreach（値のみ）

```c
void AnnounceItems(array<string> itemNames)
{
    foreach (string name : itemNames)
    {
        Print("Found item: " + name);
    }
}
```

### インデックス付き foreach

配列をイテレートする場合、最初の変数にインデックスが入ります。

```c
void ListPlayers(array<Man> players)
{
    foreach (int idx, Man player : players)
    {
        Print(string.Format("Player #%1: %2", idx, player.GetIdentity().GetName()));
    }
}
```

### マップに対する foreach

マップの場合、最初の変数にキーが、2番目の変数に値が入ります。

```c
void PrintScoreboard(map<string, int> scores)
{
    foreach (string playerName, int score : scores)
    {
        Print(string.Format("%1: %2 kills", playerName, score));
    }
}
```

値のみでマップをイテレートすることもできます:

```c
void SumScores(map<string, int> scores)
{
    int total = 0;
    foreach (int score : scores)
    {
        total += score;
    }
    Print("Total kills: " + total);
}
```

### 静的配列に対する foreach

```c
void PrintStaticArray()
{
    int numbers[] = {10, 20, 30, 40, 50};

    foreach (int value : numbers)
    {
        Print(value);
    }
}
```

---

## switch / case

`switch` 文は値を `case` ラベルのリストと照合します。`int`、`string`、列挙値、定数で動作します。

### 重要: フォールスルーなし

C/C++ とは異なり、Enforce Script の `switch/case` はあるケースから次のケースにフォールスルー**しません**。各 `case` は独立しています。明確さのために `break` を含めることはできますが、フォールスルーを防ぐために必須ではありません。

```c
void HandleCommand(string command)
{
    switch (command)
    {
        case "heal":
            HealPlayer();
            break;

        case "kill":
            KillPlayer();
            break;

        case "teleport":
            TeleportPlayer();
            break;

        default:
            Print("Unknown command: " + command);
            break;
    }
}
```

### 列挙を使った switch

```c
enum EDifficulty
{
    EASY = 0,
    MEDIUM,
    HARD
};

void SetDifficulty(EDifficulty difficulty)
{
    float zombieMultiplier;

    switch (difficulty)
    {
        case EDifficulty.EASY:
            zombieMultiplier = 0.5;
            break;

        case EDifficulty.MEDIUM:
            zombieMultiplier = 1.0;
            break;

        case EDifficulty.HARD:
            zombieMultiplier = 2.0;
            break;

        default:
            zombieMultiplier = 1.0;
            break;
    }

    Print(string.Format("Zombie multiplier: %1", zombieMultiplier));
}
```

### 整数定数を使った switch

```c
void DescribeWeaponSlot(int slotId)
{
    const int SLOT_SHOULDER = 0;
    const int SLOT_MELEE = 1;
    const int SLOT_PISTOL = 2;

    switch (slotId)
    {
        case SLOT_SHOULDER:
            Print("Primary weapon");
            break;

        case SLOT_MELEE:
            Print("Melee weapon");
            break;

        case SLOT_PISTOL:
            Print("Sidearm");
            break;

        default:
            Print("Unknown slot");
            break;
    }
}
```

> **注意:** フォールスルーがないため、C のようにケースをスタックしてハンドラーを共有することはできません。各ケースには独自の本体が必要です。

---

## break と continue

### break

`break` は最も内側のループ（または switch case）を即座に終了します。

```c
// 100メートル以内の最初のプレイヤーを見つける
void FindNearbyPlayer(vector origin, array<Man> players)
{
    foreach (Man player : players)
    {
        float dist = vector.Distance(origin, player.GetPosition());
        if (dist < 100)
        {
            Print("Found nearby player: " + player.GetIdentity().GetName());
            break; // 検索を停止
        }
    }
}
```

### continue

`continue` は現在の反復の残りをスキップし、次の反復にジャンプします。

```c
// 生存しているプレイヤーのみを処理
void HealAllPlayers(array<Man> players)
{
    foreach (Man man : players)
    {
        PlayerBase player;
        if (!Class.CastTo(player, man))
            continue; // PlayerBase ではない、スキップ

        if (!player.IsAlive())
            continue; // 死亡、スキップ

        player.SetHealth("", "Health", 100);
        Print("Healed: " + player.GetIdentity().GetName());
    }
}
```

### ネストされたループでの break

`break` は最も内側のループのみを終了します。ネストされたループから抜けるには、フラグ変数を使用します。

```c
void FindItemInGrid(array<array<string>> grid, string target)
{
    bool found = false;

    for (int row = 0; row < grid.Count(); row++)
    {
        for (int col = 0; col < grid.Get(row).Count(); col++)
        {
            if (grid.Get(row).Get(col) == target)
            {
                Print(string.Format("Found '%1' at [%2, %3]", target, row, col));
                found = true;
                break; // 内側のループのみを終了
            }
        }

        if (found)
            break; // 外側のループを終了
    }
}
```

---

## thread キーワード

Enforce Script には非同期実行のための `thread` キーワードがあります。

```c
// スレッド関数を宣言
thread void LongOperation()
{
    // これは非同期で実行される
    Sleep(5000);  // ブロックせずに5秒待機
    Print("Done!");
}

// 呼び出し
thread LongOperation();  // 呼び出し元をブロックせずに開始
```

**重要:** Enforce Script の `thread` は OS スレッドとは**異なります**。コルーチンに近いものです --- 同じスレッドで実行されますが、ゲームをブロックせずに yield/sleep できます。ほとんどの Mod のユースケースでは `thread` の代わりに `CallLater` を使用してください --- よりシンプルで予測可能です。

### Thread vs CallLater

| 機能 | `thread` | `CallLater` |
|---------|----------|-------------|
| 構文 | `thread MyFunc();` | `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.MyFunc, delayMs, repeat);` |
| sleep/yield できるか | はい（`Sleep()`） | いいえ（1回実行またはインターバルで繰り返し） |
| キャンセル可能か | ビルトインのキャンセルなし | はい（`CallQueue.Remove()`） |
| ユースケース | 待機を含むシーケンシャルな非同期ロジック | 遅延または繰り返しコールバック |

ほとんどの DayZ Modding シナリオでは、タイマー付きの `CallLater` が推奨されるアプローチです。`thread` は、中間的な待機を含むシーケンシャルなロジックが本当に必要な場合（例: マルチステップのアニメーションシーケンス）にのみ使用してください。

---

## ベストプラクティス

- 深くネストされた `if` ブロックの代わりに、関数の先頭でガード句（`if (!x) return;`）を使用してください --- ハッピーパスをフラットで読みやすく保ちます。
- Enforce Script 固有の兄弟スコープ再宣言エラーを避けるため、`if`/`else` ブロックの前に共有変数を宣言してください。
- 単純なイテレーションには `foreach` を使用し、要素の削除や隣接要素へのアクセスが必要な場合にのみインデックス付き `for` を使用してください。
- `do...while` は `bool first = true` フラグを使用した `while (first || condition)` で置き換えてください --- これが標準的な Enforce Script の回避策です。
- 遅延または繰り返しアクションには `thread` より `CallLater` を優先してください --- キャンセル可能で、よりシンプルで予測可能です。

---

## 実際の Mod で確認されたパターン

> プロフェッショナルな DayZ Mod のソースコードを研究して確認されたパターンです。

| パターン | Mod | 詳細 |
|---------|-----|--------|
| ガード句 + ループ内 `continue` | COT / Expansion | プレイヤーをループする際、作業前にキャスト失敗や `!IsAlive()` で常に `continue` |
| 文字列コマンドでの `switch` | VPP Admin | チャットコマンドハンドラーは `"!heal"`, `"!tp"` のような文字列ケースで `switch(command)` を使用 |
| ネストされたループを抜けるフラグ変数 | Expansion Market | 外側のループを終了するために内側のループ後にチェックする `bool found = false` を使用 |
| 遅延スポーンのための `CallLater` | Dabs Framework | `thread` より `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater()` を優先 |

---

## 理論 vs 実践

| 概念 | 理論 | 現実 |
|---------|--------|---------|
| `do...while` ループ | ほとんどの C 系言語で標準 | Enforce Script には存在しない; わかりにくいコンパイルエラーが発生 |
| `switch` フォールスルー | C/C++ では `break` なしでケースがフォールスルー | Enforce Script のケースは独立 -- ケースのスタックでハンドラーを共有できない |
| `thread` キーワード | マルチスレッドのように聞こえる | 実際にはメインスレッド上のコルーチン; `Sleep()` は yield であり、ブロックではない |
| `if`/`else` での変数スコープ | 兄弟ブロックは独立したスコープを持つべき | Enforce Script は共有スコープとして扱う -- 両方のブロックで同じ変数名はコンパイルエラー |

---

## よくある間違い

| 間違い | 問題 | 修正 |
|---------|---------|-----|
| `do...while` の使用 | Enforce Script に存在しない | `bool first = true` フラグ付き `while` を使用 |
| `if` と `else` ブロックで同じ変数を宣言 | 多重宣言エラー | `if` の前に変数を宣言 |
| ネストされたスコープでループ変数 `i` を再宣言 | 多重宣言エラー | 異なる名前（`i`, `j`, `k`）を使用するか外で宣言 |
| `switch` のフォールスルーを期待 | ケースは独立、フォールスルーなし | 各ケースに完全なハンドラーが必要 |
| `foreach` でイテレート中に配列を変更 | 未定義動作、クラッシュの可能性 | 要素を削除する場合はインデックスベースの `for` ループを使用 |
| `break` なしの無限 `while` ループ | サーバーフリーズ / クライアントハング | 条件が最終的に `false` になることを保証するか、`break` を使用 |

---

## クイックリファレンス

```c
// if / else if / else
if (condition) { } else if (other) { } else { }

// for ループ
for (int i = 0; i < count; i++) { }

// while ループ
while (condition) { }

// do...while のシミュレーション
bool first = true;
while (first || condition) { first = false; /* 本体 */ }

// foreach（値のみ）
foreach (Type value : collection) { }

// foreach（インデックス + 値）
foreach (int i, Type value : array) { }

// foreach（マップのキー + 値）
foreach (KeyType key, ValueType val : someMap) { }

// switch/case（フォールスルーなし）
switch (value) { case X: /* ... */ break; default: break; }

// thread（コルーチンスタイルの非同期）
thread void MyFunc() { Sleep(1000); }
thread MyFunc();  // ノンブロッキング呼び出し
```

---

[<< 1.4: Modded クラス](04-modded-classes.md) | [ホーム](../README.md) | [1.6: 文字列操作 >>](06-strings.md)
