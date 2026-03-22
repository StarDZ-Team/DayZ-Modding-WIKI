# 第1.2章: 配列、マップ、セット

[ホーム](../../README.md) | [<< 前へ: 変数と型](01-variables-types.md) | **配列、マップ、セット** | [次へ: クラスと継承 >>](03-classes-inheritance.md)

---

## はじめに

実際のDayZモッドでは、さまざまなコレクションを扱います。プレイヤーのリスト、アイテムのインベントリ、プレイヤーIDから権限へのマッピング、アクティブゾーンのセットなどです。Enforce Scriptはこれらのニーズに対応する3つのコレクション型を提供しています。

- **`array<T>`** --- 動的な、順序付きの、リサイズ可能なリスト（最もよく使うコレクション）
- **`map<K,V>`** --- キーと値の連想コンテナ（ハッシュマップ）
- **`set<T>`** --- 値ベースの削除機能を持つ順序付きコレクション

また、コンパイル時にサイズが決まる固定サイズのデータには**静的配列**（`int arr[5]`）もあります。この章では、利用可能なすべてのメソッド、イテレーションパターン、そして実際のモッドでバグを引き起こす微妙な落とし穴を含め、これらすべてを詳しく解説します。

---

## 静的配列

静的配列はコンパイル時にサイズが決まる固定サイズの配列です。拡大・縮小はできません。小さな既知サイズのコレクションに適しており、動的配列よりもメモリ効率が良いです。

### 宣言と使用法

```c
void StaticArrayBasics()
{
    // リテラルサイズで宣言
    int numbers[5];
    numbers[0] = 10;
    numbers[1] = 20;
    numbers[2] = 30;
    numbers[3] = 40;
    numbers[4] = 50;

    // 初期化リストで宣言
    float damages[3] = {10.5, 25.0, 50.0};

    // constサイズで宣言
    const int GRID_SIZE = 4;
    string labels[GRID_SIZE];

    // 要素へのアクセス
    int first = numbers[0];     // 10
    float maxDmg = damages[2];  // 50.0

    // forループでイテレーション
    for (int i = 0; i < 5; i++)
    {
        Print(numbers[i]);
    }
}
```

### 静的配列のルール

1. サイズはコンパイル時定数でなければなりません（リテラルまたは`const int`）
2. 変数をサイズとして使うことは**できません**: `int arr[myVar]` はコンパイルエラーになります
3. 範囲外のインデックスにアクセスすると未定義動作になります（実行時の境界チェックなし）
4. 静的配列は関数に参照渡しされます（プリミティブとは異なります）

```c
// 関数パラメータとしての静的配列
void FillArray(int arr[3])
{
    arr[0] = 100;
    arr[1] = 200;
    arr[2] = 300;
}

void Test()
{
    int myArr[3];
    FillArray(myArr);
    Print(myArr[0]);  // 100 -- 元の配列が変更された（参照渡し）
}
```

### 静的配列を使うべき場合

静的配列は以下の場合に使用します:
- ベクトル/行列データ（3x3回転行列の`vector mat[3]`など）
- 小さな固定ルックアップテーブル
- アロケーションが重要なパフォーマンスクリティカルなホットパス

それ以外はすべて動的な`array<T>`を使用してください。

---

## 動的配列: `array<T>`

動的配列はDayZモッドで最もよく使われるコレクションです。実行時に拡大・縮小でき、ジェネリクスをサポートし、豊富なメソッドセットを提供します。

### 作成

```c
void CreateArrays()
{
    // 方法1: new演算子
    array<string> names = new array<string>;

    // 方法2: 初期化リスト
    array<int> scores = {100, 85, 92, 78};

    // 方法3: typedefを使用
    TStringArray items = new TStringArray;  // array<string>と同じ

    // あらゆる型の配列
    array<float> distances = new array<float>;
    array<bool> flags = new array<bool>;
    array<vector> positions = new array<vector>;
    array<PlayerBase> players = new array<PlayerBase>;
}
```

### 定義済みのtypedef

DayZは最もよく使う配列型の省略形typedefを提供しています:

```c
typedef array<string>  TStringArray;
typedef array<float>   TFloatArray;
typedef array<int>     TIntArray;
typedef array<bool>    TBoolArray;
typedef array<vector>  TVectorArray;
```

DayZのコードでは`TStringArray`を頻繁に見かけます --- 設定のパース、チャットメッセージ、ルートテーブルなどで使われます。

---

## 配列メソッド完全リファレンス

### 要素の追加

```c
void AddingElements()
{
    array<string> items = new array<string>;

    // Insert: 末尾に追加し、新しいインデックスを返す
    int idx = items.Insert("Bandage");     // idx == 0
    idx = items.Insert("Morphine");        // idx == 1
    idx = items.Insert("Saline");          // idx == 2
    // items: ["Bandage", "Morphine", "Saline"]

    // InsertAt: 特定のインデックスに挿入し、既存の要素を右にシフト
    items.InsertAt("Epinephrine", 1);
    // items: ["Bandage", "Epinephrine", "Morphine", "Saline"]

    // InsertAll: 別の配列のすべての要素を末尾に追加
    array<string> moreItems = {"Tetracycline", "Charcoal"};
    items.InsertAll(moreItems);
    // items: ["Bandage", "Epinephrine", "Morphine", "Saline", "Tetracycline", "Charcoal"]
}
```

### 要素へのアクセス

```c
void AccessingElements()
{
    array<string> items = {"Apple", "Banana", "Cherry", "Date"};

    // Get: インデックスでアクセス
    string first = items.Get(0);       // "Apple"
    string third = items.Get(2);       // "Cherry"

    // ブラケット演算子: Getと同じ
    string second = items[1];          // "Banana"

    // Set: インデックスの要素を置換
    items.Set(1, "Blueberry");         // items[1]が"Blueberry"になった

    // Count: 要素数
    int count = items.Count();         // 4

    // IsValidIndex: 境界チェック
    bool valid = items.IsValidIndex(3);   // true
    bool invalid = items.IsValidIndex(4); // false
    bool negative = items.IsValidIndex(-1); // false
}
```

### 検索

```c
void SearchingArrays()
{
    array<string> weapons = {"AKM", "M4A1", "Mosin", "IZH18", "AKM"};

    // Find: 要素の最初のインデックスを返す。見つからない場合は-1
    int idx = weapons.Find("Mosin");    // 2
    int notFound = weapons.Find("FAL");  // -1

    // 存在チェック
    if (weapons.Find("M4A1") != -1)
        Print("M4A1が見つかりました!");

    // GetRandomElement: ランダムな要素を返す
    string randomWeapon = weapons.GetRandomElement();

    // GetRandomIndex: ランダムな有効インデックスを返す
    int randomIdx = weapons.GetRandomIndex();
}
```

### 要素の削除

ここが最もよくあるバグが発生する箇所です。`Remove`と`RemoveOrdered`の違いに注意してください。

```c
void RemovingElements()
{
    array<string> items = {"A", "B", "C", "D", "E"};

    // Remove(index): 高速だが順序が変わる
    // インデックスの要素を最後の要素と入れ替えてから、配列を縮小する
    items.Remove(1);  // "B"を"E"と入れ替えて削除
    // itemsは現在: ["A", "E", "C", "D"]  -- 順序が変わった!

    // RemoveOrdered(index): 低速だが順序を保持
    // インデックス以降のすべての要素を左に1つシフト
    items = {"A", "B", "C", "D", "E"};
    items.RemoveOrdered(1);  // "B"を削除し、C,D,Eを左にシフト
    // itemsは現在: ["A", "C", "D", "E"]  -- 順序保持

    // RemoveItem(value): 要素を見つけて削除する（順序保持）
    items = {"A", "B", "C", "D", "E"};
    items.RemoveItem("C");
    // itemsは現在: ["A", "B", "D", "E"]

    // Clear: すべての要素を削除
    items.Clear();
    // items.Count() == 0
}
```

### サイズと容量

```c
void SizingArrays()
{
    array<int> data = new array<int>;

    // Reserve: 内部容量を事前確保（Countは変わらない）
    // 追加する要素数がわかっている場合に使用
    data.Reserve(100);
    // data.Count() == 0だが、内部バッファは100要素分確保済み

    // Resize: Countを変更し、新しいスロットをデフォルト値で埋める
    data.Resize(10);
    // data.Count() == 10、すべての要素は0

    // 小さくリサイズすると切り詰められる
    data.Resize(5);
    // data.Count() == 5
}
```

### 並べ替えとシャッフル

```c
void OrderingArrays()
{
    array<int> numbers = {5, 2, 8, 1, 9, 3};

    // 昇順ソート
    numbers.Sort();
    // numbers: [1, 2, 3, 5, 8, 9]

    // 降順ソート
    numbers.Sort(true);
    // numbers: [9, 8, 5, 3, 2, 1]

    // 配列を反転（逆順にする）
    numbers = {1, 2, 3, 4, 5};
    numbers.Invert();
    // numbers: [5, 4, 3, 2, 1]

    // ランダムにシャッフル
    numbers.ShuffleArray();
    // numbers: [3, 1, 5, 2, 4]  (ランダムな順序)
}
```

### コピー

```c
void CopyingArrays()
{
    array<string> original = {"A", "B", "C"};

    // Copy: すべての内容を別の配列のコピーで置換
    array<string> copy = new array<string>;
    copy.Copy(original);
    // copy: ["A", "B", "C"]
    // copyの変更はoriginalに影響しない

    // InsertAll: 追加する（置換ではない）
    array<string> combined = {"X", "Y"};
    combined.InsertAll(original);
    // combined: ["X", "Y", "A", "B", "C"]
}
```

### デバッグ

```c
void DebuggingArrays()
{
    array<string> items = {"Bandage", "Morphine", "Saline"};

    // Debug: すべての要素をスクリプトログに出力
    items.Debug();
    // 出力:
    // [0] => Bandage
    // [1] => Morphine
    // [2] => Saline
}
```

---

## 配列のイテレーション

### forループ（インデックスベース）

```c
void ForLoopIteration()
{
    array<string> items = {"AKM", "M4A1", "Mosin"};

    for (int i = 0; i < items.Count(); i++)
    {
        Print(string.Format("[%1] %2", i, items[i]));
    }
    // [0] AKM
    // [1] M4A1
    // [2] Mosin
}
```

### foreach（値のみ）

```c
void ForEachValue()
{
    array<string> items = {"AKM", "M4A1", "Mosin"};

    foreach (string weapon : items)
    {
        Print(weapon);
    }
    // AKM
    // M4A1
    // Mosin
}
```

### foreach（インデックス + 値）

```c
void ForEachIndexValue()
{
    array<string> items = {"AKM", "M4A1", "Mosin"};

    foreach (int i, string weapon : items)
    {
        Print(string.Format("[%1] %2", i, weapon));
    }
    // [0] AKM
    // [1] M4A1
    // [2] Mosin
}
```

### 実践例: 最も近いプレイヤーを見つける

```c
PlayerBase FindNearestPlayer(vector origin, float maxRange)
{
    array<Man> allPlayers = new array<Man>;
    GetGame().GetPlayers(allPlayers);

    PlayerBase nearest = null;
    float nearestDist = maxRange;

    foreach (Man man : allPlayers)
    {
        PlayerBase player;
        if (!Class.CastTo(player, man))
            continue;

        if (!player.IsAlive())
            continue;

        float dist = vector.Distance(origin, player.GetPosition());
        if (dist < nearestDist)
        {
            nearestDist = dist;
            nearest = player;
        }
    }

    return nearest;
}
```

---

## マップ: `map<K,V>`

マップはキーと値のペアを格納します。キーで値を検索する必要がある場合に使用します --- UIDによるプレイヤーデータ、クラス名によるアイテム価格、ロール名による権限などです。

### 作成

```c
void CreateMaps()
{
    // 標準的な作成方法
    map<string, int> prices = new map<string, int>;

    // さまざまな型のマップ
    map<string, float> multipliers = new map<string, float>;
    map<int, string> idToName = new map<int, string>;
    map<string, ref array<string>> categories = new map<string, ref array<string>>;
}
```

### 定義済みのマップtypedef

```c
typedef map<string, int>     TStringIntMap;
typedef map<string, string>  TStringStringMap;
typedef map<int, string>     TIntStringMap;
typedef map<string, float>   TStringFloatMap;
```

---

## マップメソッド完全リファレンス

### 挿入と更新

```c
void MapInsertUpdate()
{
    map<string, int> inventory = new map<string, int>;

    // Insert: 新しいキーと値のペアを追加
    // キーが新しい場合はtrueを返し、既に存在する場合はfalseを返す
    bool isNew = inventory.Insert("Bandage", 5);    // true（新しいキー）
    isNew = inventory.Insert("Bandage", 10);         // false（キーが存在する、値は更新されない）
    // inventory["Bandage"]はまだ5!

    // Set: 挿入または更新（通常はこちらを使う）
    inventory.Set("Bandage", 10);    // inventory["Bandage"] == 10 になった
    inventory.Set("Morphine", 3);    // 新しいキーが追加された
    inventory.Set("Morphine", 7);    // 既存のキーが7に更新された
}
```

**重要な区別:** `Insert()`は既存のキーを**更新しません**。`Set()`は更新します。迷ったら`Set()`を使ってください。

### 値へのアクセス

```c
void MapAccess()
{
    map<string, int> prices = new map<string, int>;
    prices.Set("AKM", 5000);
    prices.Set("M4A1", 7500);
    prices.Set("Mosin", 2000);

    // Get: 値を返す。キーが見つからない場合はデフォルト値（intの場合は0）
    int akmPrice = prices.Get("AKM");         // 5000
    int falPrice = prices.Get("FAL");          // 0（見つからない、デフォルト値を返す）

    // Find: 安全なアクセス。キーが存在する場合はtrueを返し、outパラメータに値を設定
    int price;
    bool found = prices.Find("M4A1", price);  // found == true, price == 7500
    bool notFound = prices.Find("SVD", price); // notFound == false, priceは変更なし

    // Contains: キーの存在チェック（値の取得なし）
    bool hasAKM = prices.Contains("AKM");     // true
    bool hasFAL = prices.Contains("FAL");     // false

    // Count: キーと値のペアの数
    int count = prices.Count();  // 3
}
```

### 削除

```c
void MapRemove()
{
    map<string, int> data = new map<string, int>;
    data.Set("a", 1);
    data.Set("b", 2);
    data.Set("c", 3);

    // Remove: キーで削除
    data.Remove("b");
    // dataは現在: {"a": 1, "c": 3}

    // Clear: すべてのエントリを削除
    data.Clear();
    // data.Count() == 0
}
```

### インデックスベースのアクセス

マップは位置ベースのアクセスをサポートしていますが、`O(n)`です --- イテレーション用であり、頻繁なルックアップには使わないでください。

```c
void MapIndexAccess()
{
    map<string, int> data = new map<string, int>;
    data.Set("alpha", 1);
    data.Set("beta", 2);
    data.Set("gamma", 3);

    // 内部インデックスでアクセス（O(n)、順序は挿入順）
    for (int i = 0; i < data.Count(); i++)
    {
        string key = data.GetKey(i);
        int value = data.GetElement(i);
        Print(string.Format("%1 = %2", key, value));
    }
}
```

### キーと値の抽出

```c
void MapExtraction()
{
    map<string, int> prices = new map<string, int>;
    prices.Set("AKM", 5000);
    prices.Set("M4A1", 7500);
    prices.Set("Mosin", 2000);

    // すべてのキーを配列として取得
    array<string> keys = prices.GetKeyArray();
    // keys: ["AKM", "M4A1", "Mosin"]

    // すべての値を配列として取得
    array<int> values = prices.GetValueArray();
    // values: [5000, 7500, 2000]
}
```

### 実践例: プレイヤートラッキング

```c
class PlayerTracker
{
    protected ref map<string, vector> m_LastPositions;  // UID -> 位置
    protected ref map<string, float> m_PlayTime;        // UID -> 秒数

    void PlayerTracker()
    {
        m_LastPositions = new map<string, vector>;
        m_PlayTime = new map<string, float>;
    }

    void OnPlayerConnect(string uid)
    {
        m_PlayTime.Set(uid, 0);
    }

    void OnPlayerDisconnect(string uid)
    {
        m_LastPositions.Remove(uid);
        m_PlayTime.Remove(uid);
    }

    void UpdatePlayer(string uid, vector pos, float deltaTime)
    {
        m_LastPositions.Set(uid, pos);

        float current = 0;
        m_PlayTime.Find(uid, current);
        m_PlayTime.Set(uid, current + deltaTime);
    }

    float GetPlayTime(string uid)
    {
        float time = 0;
        m_PlayTime.Find(uid, time);
        return time;
    }
}
```

---

## セット: `set<T>`

セットは配列に似た順序付きコレクションですが、値ベースの操作（値による検索と削除）に特化しています。配列やマップほど一般的には使われません。

```c
void SetExamples()
{
    set<string> activeZones = new set<string>;

    // Insert: 要素を追加
    activeZones.Insert("NWAF");
    activeZones.Insert("Tisy");
    activeZones.Insert("Balota");

    // Find: インデックスを返す、見つからない場合は-1
    int idx = activeZones.Find("Tisy");    // 1
    int missing = activeZones.Find("Zelenogorsk");  // -1

    // Get: インデックスでアクセス
    string first = activeZones.Get(0);     // "NWAF"

    // Count
    int count = activeZones.Count();       // 3

    // インデックスで削除
    activeZones.Remove(0);
    // activeZones: ["Tisy", "Balota"]

    // RemoveItem: 値で削除
    activeZones.RemoveItem("Tisy");
    // activeZones: ["Balota"]

    // Clear
    activeZones.Clear();
}
```

### セットと配列の使い分け

実際には、ほとんどのDayZモッダーはほぼすべてに`array<T>`を使います。理由は以下の通りです:
- `set<T>`は`array<T>`よりメソッドが少ない
- `array<T>`は検索用の`Find()`と値ベースの削除用の`RemoveItem()`を提供している
- 必要なAPIは通常すでに`array<T>`にある

`set<T>`は、コードが意味的にセットを表す場合（順序に意味がなく、メンバーシップテストに焦点を当てる場合）、またはバニラDayZコードで遭遇してインターフェースする必要がある場合に使用してください。

---

## マップのイテレーション

マップは便利なイテレーションのために`foreach`をサポートしています:

### foreachによるキーと値のイテレーション

```c
void IterateMap()
{
    map<string, int> scores = new map<string, int>;
    scores.Set("Alice", 150);
    scores.Set("Bob", 230);
    scores.Set("Charlie", 180);

    // foreachでキーと値を取得
    foreach (string name, int score : scores)
    {
        Print(string.Format("%1: %2 points", name, score));
    }
    // Alice: 150 points
    // Bob: 230 points
    // Charlie: 180 points
}
```

### インデックスベースのforループ

```c
void IterateMapByIndex()
{
    map<string, int> scores = new map<string, int>;
    scores.Set("Alice", 150);
    scores.Set("Bob", 230);

    for (int i = 0; i < scores.Count(); i++)
    {
        string key = scores.GetKey(i);
        int val = scores.GetElement(i);
        Print(string.Format("%1 = %2", key, val));
    }
}
```

---

## ネストされたコレクション

コレクションは他のコレクションを含むことができます。参照型（配列など）をマップ内に格納する場合、所有権管理のために`ref`を使用してください。

```c
class LootTable
{
    // カテゴリ名からクラス名リストへのマップ
    protected ref map<string, ref array<string>> m_Categories;

    void LootTable()
    {
        m_Categories = new map<string, ref array<string>>;

        // カテゴリ配列の作成
        ref array<string> medical = new array<string>;
        medical.Insert("Bandage");
        medical.Insert("Morphine");
        medical.Insert("Saline");

        ref array<string> weapons = new array<string>;
        weapons.Insert("AKM");
        weapons.Insert("M4A1");

        m_Categories.Set("medical", medical);
        m_Categories.Set("weapons", weapons);
    }

    string GetRandomFromCategory(string category)
    {
        array<string> items;
        if (!m_Categories.Find(category, items))
            return "";

        if (items.Count() == 0)
            return "";

        return items.GetRandomElement();
    }
}
```

---

## ベストプラクティス

- 使用前に必ず`new`でコレクションをインスタンス化してください -- `array<string> items;` は空ではなく`null`です。
- 更新には`map.Insert()`より`map.Set()`を使ってください -- `Insert`は既存のキーを暗黙に無視します。
- イテレーション中に要素を削除する場合、逆方向の`for`ループを使うか、別の削除リストを作成してください -- `foreach`の中でコレクションを変更しないでください。
- 予想される要素数がわかっている場合、`Reserve()`を使って内部の再アロケーションを繰り返さないようにしてください。
- すべての要素アクセスの前に`IsValidIndex()`または`Count() > 0`チェックで保護してください -- 範囲外アクセスはサイレントクラッシュを引き起こします。

---

## 実際のモッドでの使用例

> プロフェッショナルなDayZモッドのソースコード調査で確認されたパターンです。

| パターン | モッド | 詳細 |
|---------|-----|--------|
| 削除のための逆方向`for`ループ | Expansion / COT | フィルタされた要素を削除する際は常に`Count()-1`から`0`までイテレーション |
| レジストリでの`map<string, ref ClassName>` | Dabs Framework | すべてのマネージャーレジストリはマップ値に`ref`を使用してオブジェクトを存続させる |
| `TStringArray` typedefの多用 | Vanilla / VPP | 設定パース、チャットメッセージ、ルートテーブルはすべて`array<string>`の代わりに`TStringArray`を使用 |
| アクセス前のNull + 空チェック | Expansion Market | 配列を受け取るすべての関数は`if (!arr \|\| arr.Count() == 0) return;`で始まる |

---

## 理論と実践

| 概念 | 理論 | 現実 |
|---------|--------|---------|
| `Remove(index)`は「高速削除」 | 単に要素を削除するはず | まず最後の要素と入れ替えてから削除し、暗黙的に配列の順序を変更する |
| `map.Insert()`はキーを追加する | キーが存在する場合は更新されるはず | キーがすでに存在する場合は`false`を返し、何もしない |
| ユニークなコレクション用の`set<T>` | 数学的集合のように動作すべき | ほとんどのモッダーは`set`よりメソッドが多い`array<T>`と`Find()`を代わりに使う |

---

## よくある間違い

### 1. `Remove` vs `RemoveOrdered`: サイレントバグ

`Remove(index)`は高速ですが、最後の要素と入れ替えることで**順序が変わります**。前方にイテレーションしながら削除すると、要素がスキップされます:

```c
// 悪い例: Removeが順序を変えるため要素がスキップされる
array<int> nums = {1, 2, 3, 4, 5};
for (int i = 0; i < nums.Count(); i++)
{
    if (nums[i] % 2 == 0)
        nums.Remove(i);  // インデックス1を削除した後、インデックス1は"5"になり
                          // インデックス2に進むため、"5"をスキップしてしまう
}

// 良い例: 削除時は逆方向にイテレーション
array<int> nums2 = {1, 2, 3, 4, 5};
for (int j = nums2.Count() - 1; j >= 0; j--)
{
    if (nums2[j] % 2 == 0)
        nums2.Remove(j);  // 安全: 末尾から削除しても低いインデックスに影響しない
}

// これも良い例: 順序保持のためにRemoveOrderedと逆方向イテレーションを使用
array<int> nums3 = {1, 2, 3, 4, 5};
for (int k = nums3.Count() - 1; k >= 0; k--)
{
    if (nums3[k] % 2 == 0)
        nums3.RemoveOrdered(k);
}
// nums3: [1, 3, 5] 元の順序
```

### 2. 配列のインデックス範囲外

Enforce Scriptは範囲外アクセスに対して例外を投げません --- ゴミデータを返すかクラッシュします。常に境界をチェックしてください。

```c
// 悪い例: 境界チェックなし
array<string> items = {"A", "B", "C"};
string fourth = items[3];  // 未定義動作: インデックス3は存在しない

// 良い例: 境界をチェック
if (items.IsValidIndex(3))
{
    string fourth2 = items[3];
}

// 良い例: カウントをチェック
if (items.Count() > 0)
{
    string last = items[items.Count() - 1];
}
```

### 3. コレクションの作成忘れ

コレクションはオブジェクトであり、`new`でインスタンス化する必要があります:

```c
// 悪い例: null参照クラッシュ
array<string> items;
items.Insert("Test");  // クラッシュ: itemsはnull

// 良い例: まず作成
array<string> items2 = new array<string>;
items2.Insert("Test");

// これも良い例: 初期化リストは自動的に作成する
array<string> items3 = {"Test"};
```

### 4. マップでの`Insert`と`Set`

`Insert`は既存のキーを更新しません --- `false`を返し、値はそのままです:

```c
map<string, int> data = new map<string, int>;
data.Insert("key", 100);
data.Insert("key", 200);   // falseを返し、値はまだ100!

// Setを使って更新
data.Set("key", 200);      // 値が200になった
```

### 5. foreach中のコレクション変更

`foreach`でイテレーション中にコレクションの要素を追加・削除しないでください。削除する要素の別リストを作成し、後で削除してください。

```c
// 悪い例: イテレーション中の変更
array<string> items = {"A", "B", "C", "D"};
foreach (string item : items)
{
    if (item == "B")
        items.RemoveItem(item);  // 未定義: イテレータが無効化される
}

// 良い例: 収集してから削除
array<string> toRemove = new array<string>;
foreach (string item2 : items)
{
    if (item2 == "B")
        toRemove.Insert(item2);
}
foreach (string rem : toRemove)
{
    items.RemoveItem(rem);
}
```

### 6. 空の配列の安全性

要素にアクセスする前に、配列がnullでなく、かつ空でないことを常に確認してください:

```c
string GetFirstItem(array<string> items)
{
    // ガード句: nullチェック + 空チェック
    if (!items || items.Count() == 0)
        return "";

    return items[0];
}
```

---

## 練習問題

### 練習1: インベントリカウンター
アイテムクラス名の`array<string>`（重複あり）を受け取り、各アイテムの個数をカウントする`map<string, int>`を返す関数を作成してください。

例: `{"Bandage", "Morphine", "Bandage", "Saline", "Bandage"}` は `{"Bandage": 3, "Morphine": 1, "Saline": 1}` を生成するはずです。

### 練習2: 配列の重複削除
重複を削除し、最初の出現順序を保持した新しい配列を返す関数`array<string> RemoveDuplicates(array<string> input)`を書いてください。

### 練習3: リーダーボード
プレイヤー名からキル数への`map<string, int>`を作成してください。以下の関数を書いてください:
1. プレイヤーにキルを追加する（必要ならエントリを作成）
2. キル数でソートされた上位Nプレイヤーを取得する（ヒント: 配列に抽出してソート）
3. キル数がゼロのすべてのプレイヤーを削除する

### 練習4: 位置履歴
プレイヤーの直近10個の位置を格納するクラス（配列を使ったリングバッファ）を作成してください:
1. 新しい位置を追加する（容量に達したら最も古いものを破棄）
2. 格納されたすべての位置間の総移動距離を返す
3. 平均位置を返す

### 練習5: 双方向ルックアップ
両方向のルックアップを可能にする2つのマップを持つクラスを作成してください: プレイヤーUIDから名前を見つける、名前からUIDを見つける。`Register(uid, name)`、`GetNameByUID(uid)`、`GetUIDByName(name)`、`Unregister(uid)`を実装してください。

---

## まとめ

| コレクション | 型 | 用途 | 主な違い |
|-----------|------|----------|----------------|
| 静的配列 | `int arr[5]` | 固定サイズ、コンパイル時に決定 | リサイズ不可、メソッドなし |
| 動的配列 | `array<T>` | 汎用的な順序付きリスト | 豊富なAPI、リサイズ可能 |
| マップ | `map<K,V>` | キーと値のルックアップ | `Set()`で挿入/更新 |
| セット | `set<T>` | 値ベースのメンバーシップ | 配列よりシンプル、あまり使われない |

| 操作 | メソッド | 備考 |
|-----------|--------|-------|
| 末尾に追加 | `Insert(val)` | インデックスを返す |
| 位置に追加 | `InsertAt(val, idx)` | 右にシフト |
| 高速削除 | `Remove(idx)` | 最後と入れ替え、**順序なし** |
| 順序保持削除 | `RemoveOrdered(idx)` | 左にシフト、順序保持 |
| 値で削除 | `RemoveItem(val)` | 見つけてから削除（順序保持） |
| 検索 | `Find(val)` | インデックスまたは-1を返す |
| カウント | `Count()` | 要素数 |
| 境界チェック | `IsValidIndex(idx)` | boolを返す |
| ソート | `Sort()` / `Sort(true)` | 昇順 / 降順 |
| ランダム | `GetRandomElement()` | ランダムな値を返す |
| foreach | `foreach (T val : arr)` | 値のみ |
| foreach（インデックス付き） | `foreach (int i, T val : arr)` | インデックス + 値 |

---

[ホーム](../../README.md) | [<< 前へ: 変数と型](01-variables-types.md) | **配列、マップ、セット** | [次へ: クラスと継承 >>](03-classes-inheritance.md)
