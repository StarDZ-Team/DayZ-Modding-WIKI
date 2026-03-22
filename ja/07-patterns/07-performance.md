# Chapter 7.7: パフォーマンス最適化

[ホーム](../README.md) | [<< 前: イベント駆動アーキテクチャ](06-events.md) | **パフォーマンス最適化**

---

## はじめに

DayZはプレイヤー数、エンティティ負荷、Modの複雑さに応じて10〜60サーバーFPSで動作します。時間がかかりすぎるスクリプトサイクルはすべて、そのフレーム予算を食いつぶします。マップ上のすべての車両をスキャンしたり、UIリストを一から再構築したりする、書き方の悪い`OnUpdate`が1つあるだけで、サーバーパフォーマンスが目に見えて低下する可能性があります。プロフェッショナルなModは、より多くの機能を持つことではなく、同じ機能をより少ないムダで実装することで評価されます。

この章では、COT、VPP、Expansion、Dabs Frameworkで使用されている実戦で検証された最適化パターンを解説します。これらは早すぎる最適化ではなく、すべてのDayZモッダーが最初から知っておくべき標準的なエンジニアリングプラクティスです。

---

## 目次

- [遅延読み込みとバッチ処理](#lazy-loading-and-batched-processing)
- [ウィジェットプーリング](#widget-pooling)
- [検索デバウンス](#search-debouncing)
- [更新レート制限](#update-rate-limiting)
- [キャッシング](#caching)
- [車両レジストリパターン](#vehicle-registry-pattern)
- [ソートアルゴリズムの選択](#sort-algorithm-choice)
- [避けるべきこと](#things-to-avoid)
- [プロファイリング](#profiling)
- [チェックリスト](#checklist)

---

## 遅延読み込みとバッチ処理

DayZ Moddingにおいて最もインパクトのある最適化は、**必要になるまで作業を行わない**ことと、作業を行う必要がある場合に**複数フレームにわたって分散させる**ことです。

### 遅延読み込み

ユーザーが必要としないかもしれないデータを事前に計算したり事前読み込みしたりしないでください：

```c
class ItemDatabase
{
    protected ref map<string, ref ItemData> m_Cache;
    protected bool m_Loaded;

    // 悪い例：起動時にすべてを読み込む
    void OnInit()
    {
        LoadAllItems();  // 5000アイテム、起動時に200msの停止
    }

    // 良い例：初回アクセス時に読み込む
    ItemData GetItem(string className)
    {
        if (!m_Loaded)
        {
            LoadAllItems();
            m_Loaded = true;
        }

        ItemData data;
        m_Cache.Find(className, data);
        return data;
    }
};
```

### バッチ処理（フレームあたりN個）

大きなコレクションを処理する必要がある場合、一度にすべてを処理するのではなく、フレームあたり固定バッチを処理します：

```c
class LootCleanup : MyServerModule
{
    protected ref array<Object> m_DirtyItems;
    protected int m_ProcessIndex;

    static const int BATCH_SIZE = 50;  // フレームあたり50アイテムを処理

    override void OnUpdate(float dt)
    {
        if (!m_DirtyItems || m_DirtyItems.Count() == 0) return;

        int processed = 0;
        while (m_ProcessIndex < m_DirtyItems.Count() && processed < BATCH_SIZE)
        {
            Object item = m_DirtyItems[m_ProcessIndex];
            if (item)
            {
                ProcessItem(item);
            }
            m_ProcessIndex++;
            processed++;
        }

        // 完了したらリセット
        if (m_ProcessIndex >= m_DirtyItems.Count())
        {
            m_DirtyItems.Clear();
            m_ProcessIndex = 0;
        }
    }

    void ProcessItem(Object item) { ... }
};
```

### なぜ50なのか？

バッチサイズは各アイテムの処理コストに依存します。軽量な操作（nullチェック、位置の読み取り）の場合、フレームあたり100〜200で問題ありません。重い操作（エンティティのスポーン、パスファインディングクエリ、ファイルI/O）の場合、フレームあたり5〜10が限界かもしれません。50から始めて、観測されたフレーム時間への影響に基づいて調整してください。

---

## ウィジェットプーリング

UIウィジェットの作成と破棄はコストが高いです。エンジンはメモリの割り当て、ウィジェットツリーの構築、スタイルの適用、レイアウトの計算を行う必要があります。500エントリのスクロール可能なリストがある場合、リストが更新されるたびに500個のウィジェットを作成し、破棄し、新しい500個を作成することは、フレーム落ちが確実です。

### 問題

```c
// 悪い例：更新のたびに破棄して再作成する
void RefreshPlayerList(array<string> players)
{
    // 既存のすべてのウィジェットを破棄する
    Widget child = m_ListPanel.GetChildren();
    while (child)
    {
        Widget next = child.GetSibling();
        child.Unlink();  // 破棄
        child = next;
    }

    // すべてのプレイヤーに対して新しいウィジェットを作成する
    for (int i = 0; i < players.Count(); i++)
    {
        Widget row = GetGame().GetWorkspace().CreateWidgets("MyMod/layouts/PlayerRow.layout", m_ListPanel);
        TextWidget nameText = TextWidget.Cast(row.FindAnyWidget("NameText"));
        nameText.SetText(players[i]);
    }
}
```

### プールパターン

ウィジェット行のプールを事前作成します。更新時に既存の行を再利用します。データがある行を表示し、ない行を非表示にします。

```c
class WidgetPool
{
    protected ref array<Widget> m_Pool;
    protected Widget m_Parent;
    protected string m_LayoutPath;
    protected int m_ActiveCount;

    void WidgetPool(Widget parent, string layoutPath, int initialSize)
    {
        m_Parent = parent;
        m_LayoutPath = layoutPath;
        m_Pool = new array<Widget>();
        m_ActiveCount = 0;

        // プールを事前作成する
        for (int i = 0; i < initialSize; i++)
        {
            Widget w = GetGame().GetWorkspace().CreateWidgets(m_LayoutPath, m_Parent);
            w.Show(false);
            m_Pool.Insert(w);
        }
    }

    // プールからウィジェットを取得し、必要に応じて新しいものを作成する
    Widget Acquire()
    {
        if (m_ActiveCount < m_Pool.Count())
        {
            Widget w = m_Pool[m_ActiveCount];
            w.Show(true);
            m_ActiveCount++;
            return w;
        }

        // プールが枯渇 — 拡張する
        Widget newWidget = GetGame().GetWorkspace().CreateWidgets(m_LayoutPath, m_Parent);
        m_Pool.Insert(newWidget);
        m_ActiveCount++;
        return newWidget;
    }

    // すべてのアクティブなウィジェットを非表示にする（破棄はしない）
    void ReleaseAll()
    {
        for (int i = 0; i < m_ActiveCount; i++)
        {
            m_Pool[i].Show(false);
        }
        m_ActiveCount = 0;
    }

    // プール全体を破棄する（クリーンアップ時に呼び出す）
    void Destroy()
    {
        for (int i = 0; i < m_Pool.Count(); i++)
        {
            if (m_Pool[i]) m_Pool[i].Unlink();
        }
        m_Pool.Clear();
        m_ActiveCount = 0;
    }
};
```

### 使用方法

```c
void RefreshPlayerList(array<string> players)
{
    m_WidgetPool.ReleaseAll();  // すべて非表示 — 破棄なし

    for (int i = 0; i < players.Count(); i++)
    {
        Widget row = m_WidgetPool.Acquire();  // 再利用または作成
        TextWidget nameText = TextWidget.Cast(row.FindAnyWidget("NameText"));
        nameText.SetText(players[i]);
    }
}
```

最初の`RefreshPlayerList`呼び出しでウィジェットが作成されます。以降の呼び出しではそれらを再利用します。破棄も再作成もフレーム落ちもありません。

---

## 検索デバウンス

ユーザーが検索ボックスに入力すると、キーストロークごとに`OnChange`イベントが発火します。キーストロークごとにフィルターされたリストを再構築するのはムダです --- ユーザーはまだ入力中です。代わりに、ユーザーが一時停止するまで検索を遅延させます。

### デバウンスパターン

```c
class SearchableList
{
    protected const float DEBOUNCE_DELAY = 0.15;  // 150ms
    protected float m_SearchTimer;
    protected bool m_SearchPending;
    protected string m_PendingQuery;

    // キーストロークごとに呼び出される
    void OnSearchTextChanged(string text)
    {
        m_PendingQuery = text;
        m_SearchPending = true;
        m_SearchTimer = 0;  // 各キーストロークでタイマーをリセットする
    }

    // OnUpdateから毎フレーム呼び出される
    void Tick(float dt)
    {
        if (!m_SearchPending) return;

        m_SearchTimer += dt;
        if (m_SearchTimer >= DEBOUNCE_DELAY)
        {
            m_SearchPending = false;
            ExecuteSearch(m_PendingQuery);
        }
    }

    void ExecuteSearch(string query)
    {
        // ここで実際のフィルタリングを行う
        // これはキーストロークごとではなく、ユーザーが入力を停止した後に1回実行される
    }
};
```

### なぜ150msなのか？

150msは良いデフォルトです。連続入力中のほとんどのキーストロークが1回の検索にバッチ処理されるのに十分な長さですが、UIがレスポンシブに感じられるのに十分な短さです。検索が特にコストが高い場合は長い遅延を、ユーザーが即時フィードバックを期待する場合は短い遅延に調整してください。

---

## 更新レート制限

すべてが毎フレーム実行される必要はありません。多くのシステムは、目に見える影響なしにより低い頻度で更新できます。

### タイマーベースのスロットリング

```c
class EntityScanner : MyServerModule
{
    protected const float SCAN_INTERVAL = 5.0;  // 5秒ごと
    protected float m_ScanTimer;

    override void OnUpdate(float dt)
    {
        m_ScanTimer += dt;
        if (m_ScanTimer < SCAN_INTERVAL) return;
        m_ScanTimer = 0;

        // コストの高いスキャンが毎フレームではなく5秒ごとに実行される
        ScanEntities();
    }
};
```

### フレームカウントスロットリング

Nフレームごとに実行すべき操作の場合：

```c
class PositionSync
{
    protected int m_FrameCounter;
    protected const int SYNC_EVERY_N_FRAMES = 10;  // 10フレームごと

    void OnUpdate(float dt)
    {
        m_FrameCounter++;
        if (m_FrameCounter % SYNC_EVERY_N_FRAMES != 0) return;

        SyncPositions();
    }
};
```

### スタガード処理

複数のシステムが定期的な更新を必要とする場合、すべてが同じフレームで発火しないようにタイマーをずらします：

```c
// 悪い例：3つすべてがt=5.0、t=10.0、t=15.0で発火 — フレームスパイク
m_LootTimer   = 5.0;
m_VehicleTimer = 5.0;
m_WeatherTimer = 5.0;

// 良い例：スタガード — 作業が分散される
m_LootTimer    = 5.0;
m_VehicleTimer = 5.0 + 1.6;  // ルートの約1.6秒後に発火
m_WeatherTimer = 5.0 + 3.3;  // ルートの約3.3秒後に発火
```

または異なるオフセットでタイマーを開始します：

```c
m_LootTimer    = 0;
m_VehicleTimer = 1.6;
m_WeatherTimer = 3.3;
```

---

## キャッシング

同じデータの繰り返しルックアップは一般的なパフォーマンスの低下要因です。結果をキャッシュしてください。

### CfgVehiclesスキャンキャッシュ

`CfgVehicles`（すべてのアイテム/車両クラスのグローバル設定データベース）のスキャンはコストが高いです。数千の設定エントリを反復処理する必要があります。1回以上行わないでください：

```c
class WeaponRegistry
{
    private static ref array<string> s_AllWeapons;

    // 1回構築し、永久に使用する
    static array<string> GetAllWeapons()
    {
        if (s_AllWeapons) return s_AllWeapons;

        s_AllWeapons = new array<string>();

        int cfgCount = GetGame().ConfigGetChildrenCount("CfgVehicles");
        string className;
        for (int i = 0; i < cfgCount; i++)
        {
            GetGame().ConfigGetChildName("CfgVehicles", i, className);
            if (GetGame().IsKindOf(className, "Weapon_Base"))
            {
                s_AllWeapons.Insert(className);
            }
        }

        return s_AllWeapons;
    }

    static void Cleanup()
    {
        s_AllWeapons = null;
    }
};
```

### 文字列操作キャッシュ

同じ文字列変換を繰り返し計算する場合（例：大文字小文字を区別しない検索のための小文字化）、結果をキャッシュしてください：

```c
class ItemEntry
{
    string DisplayName;
    string SearchName;  // 検索マッチング用の事前計算された小文字

    void ItemEntry(string displayName)
    {
        DisplayName = displayName;
        SearchName = displayName;
        SearchName.ToLower();  // 1回だけ計算する
    }
};
```

### 位置キャッシュ

「プレイヤーがXの近くにいるか？」を頻繁にチェックする場合、チェックのたびに`GetPosition()`を呼び出すのではなく、プレイヤーの位置をキャッシュして定期的に更新してください：

```c
class ProximityChecker
{
    protected vector m_CachedPosition;
    protected float m_PositionAge;

    vector GetCachedPosition(EntityAI entity, float dt)
    {
        m_PositionAge += dt;
        if (m_PositionAge > 1.0)  // 毎秒リフレッシュ
        {
            m_CachedPosition = entity.GetPosition();
            m_PositionAge = 0;
        }
        return m_CachedPosition;
    }
};
```

---

## 車両レジストリパターン

一般的なニーズとして、マップ上のすべての車両（または特定のタイプのすべてのエンティティ）をトラッキングすることがあります。素朴なアプローチは`GetGame().GetObjectsAtPosition3D()`を巨大な半径で呼び出すことです。これは壊滅的にコストが高いです。

### 悪い例：ワールドスキャン

```c
// ひどい例：毎フレーム50km半径内のすべてのオブジェクトをスキャンする
void FindAllVehicles()
{
    array<Object> objects = new array<Object>();
    GetGame().GetObjectsAtPosition3D(Vector(7500, 0, 7500), 50000, objects);

    foreach (Object obj : objects)
    {
        CarScript car = CarScript.Cast(obj);
        if (car) { ... }
    }
}
```

### 良い例：登録ベースのレジストリ

エンティティの作成と破棄を追跡します：

```c
class VehicleRegistry
{
    private static ref array<CarScript> s_Vehicles = new array<CarScript>();

    static void Register(CarScript vehicle)
    {
        if (vehicle && s_Vehicles.Find(vehicle) == -1)
        {
            s_Vehicles.Insert(vehicle);
        }
    }

    static void Unregister(CarScript vehicle)
    {
        int idx = s_Vehicles.Find(vehicle);
        if (idx >= 0) s_Vehicles.Remove(idx);
    }

    static array<CarScript> GetAll()
    {
        return s_Vehicles;
    }

    static void Cleanup()
    {
        s_Vehicles.Clear();
    }
};

// 車両の構築/破棄にフックする：
modded class CarScript
{
    override void EEInit()
    {
        super.EEInit();
        if (GetGame().IsServer())
        {
            VehicleRegistry.Register(this);
        }
    }

    override void EEDelete(EntityAI parent)
    {
        if (GetGame().IsServer())
        {
            VehicleRegistry.Unregister(this);
        }
        super.EEDelete(parent);
    }
};
```

これで`VehicleRegistry.GetAll()`はすべての車両を即座に返します --- ワールドスキャンは不要です。

### Expansionのリンクリストパターン

Expansionはエンティティクラス自体に双方向リンクリストを使用して、配列操作のコストを回避しています：

```c
// Expansionパターン（概念的）：
class ExpansionVehicle
{
    ExpansionVehicle m_Next;
    ExpansionVehicle m_Prev;

    static ExpansionVehicle s_Head;

    void Register()
    {
        m_Next = s_Head;
        if (s_Head) s_Head.m_Prev = this;
        s_Head = this;
    }

    void Unregister()
    {
        if (m_Prev) m_Prev.m_Next = m_Next;
        if (m_Next) m_Next.m_Prev = m_Prev;
        if (s_Head == this) s_Head = m_Next;
        m_Next = null;
        m_Prev = null;
    }
};
```

これにより、操作あたりのメモリ割り当てゼロでO(1)の挿入と削除が実現されます。反復処理は`s_Head`からの単純なポインタウォークです。

---

## ソートアルゴリズムの選択

Enforce Scriptの配列には組み込みの`.Sort()`メソッドがありますが、基本的な型のみに対応し、デフォルトの比較を使用します。カスタムソート順にはソート関数が必要です。

### 組み込みソート

```c
array<int> numbers = {5, 2, 8, 1, 9, 3};
numbers.Sort();  // {1, 2, 3, 5, 8, 9}

array<string> names = {"Charlie", "Alice", "Bob"};
names.Sort();  // {"Alice", "Bob", "Charlie"} — 辞書順
```

### 比較関数によるカスタムソート

オブジェクトの配列を特定のフィールドでソートする場合、独自のソートを実装します。挿入ソートは小さな配列（約100要素以下）に適しています。大きな配列にはクイックソートの方がパフォーマンスが良いです。

```c
// シンプルな挿入ソート — 小さな配列に適している
void SortPlayersByScore(array<ref PlayerData> players)
{
    for (int i = 1; i < players.Count(); i++)
    {
        ref PlayerData key = players[i];
        int j = i - 1;

        while (j >= 0 && players[j].Score < key.Score)
        {
            players[j + 1] = players[j];
            j--;
        }
        players[j + 1] = key;
    }
}
```

### フレームごとのソートを避ける

ソートされたリストがUIに表示される場合、データが変更されたときに1回ソートし、毎フレームソートしないでください：

```c
// 悪い例：毎フレームソート
void OnUpdate(float dt)
{
    SortPlayersByScore(m_Players);
    RefreshUI();
}

// 良い例：データが変更されたときにのみソート
void OnPlayerScoreChanged()
{
    SortPlayersByScore(m_Players);
    RefreshUI();
}
```

---

## 避けるべきこと

### 1. 巨大な半径での`GetObjectsAtPosition3D`

これは指定された半径内のすべての物理オブジェクトをスキャンします。`50000`メートル（マップ全体）では、すべての木、岩、建物、アイテム、ゾンビ、プレイヤーを反復処理します。1回の呼び出しで50ms以上かかる可能性があります。

```c
// 絶対にやってはいけません
GetGame().GetObjectsAtPosition3D(Vector(7500, 0, 7500), 50000, results);
```

代わりに登録ベースのレジストリを使用してください（[車両レジストリパターン](#vehicle-registry-pattern)を参照）。

### 2. キーストロークごとの完全なリスト再構築

```c
// 悪い例：キーストロークごとに5000個のウィジェット行を再構築する
void OnSearchChanged(string text)
{
    DestroyAllRows();
    foreach (ItemData item : m_AllItems)
    {
        if (item.Name.Contains(text))
        {
            CreateWidgetRow(item);
        }
    }
}
```

代わりに[検索デバウンス](#search-debouncing)と[ウィジェットプーリング](#widget-pooling)を使用してください。

### 3. フレームごとの文字列アロケーション

文字列の連結は新しい文字列オブジェクトを作成します。フレームごとの関数では、毎フレームガーベジが生成されます：

```c
// 悪い例：エンティティあたり毎フレーム2つの新しい文字列アロケーション
void OnUpdate(float dt)
{
    for (int i = 0; i < m_Entities.Count(); i++)
    {
        string label = "Entity_" + i.ToString();  // 毎フレーム新しい文字列
        string info = label + " at " + m_Entities[i].GetPosition().ToString();  // もう1つの新しい文字列
    }
}
```

ログやUI用にフォーマットされた文字列が必要な場合は、毎フレームではなく状態変更時に行ってください。

### 4. ループ内での冗長なFileExistチェック

```c
// 悪い例：同じパスのFileExistを500回チェックする
for (int i = 0; i < m_Players.Count(); i++)
{
    if (FileExist("$profile:MyMod/Config.json"))  // 同じファイル、500回のチェック
    {
        // ...
    }
}

// 良い例：1回チェックする
bool configExists = FileExist("$profile:MyMod/Config.json");
for (int i = 0; i < m_Players.Count(); i++)
{
    if (configExists)
    {
        // ...
    }
}
```

### 5. GetGame()の繰り返し呼び出し

`GetGame()`はグローバル関数呼び出しです。タイトなループでは結果をキャッシュしてください：

```c
// 時々の使用には許容可能
if (GetGame().IsServer()) { ... }

// タイトなループではキャッシュする：
CGame game = GetGame();
for (int i = 0; i < 1000; i++)
{
    if (game.IsServer()) { ... }
}
```

### 6. タイトなループでのエンティティスポーン

エンティティのスポーンはコストが高いです（物理セットアップ、ネットワークレプリケーションなど）。1つのフレームで数十のエンティティをスポーンしないでください：

```c
// 悪い例：1フレームで100回のエンティティスポーン — 大規模なフレームスパイク
for (int i = 0; i < 100; i++)
{
    GetGame().CreateObjectEx("Zombie", randomPos, ECE_PLACE_ON_SURFACE);
}
```

バッチ処理を使用してください：20フレームにわたってフレームあたり5体をスポーンします。

---

## プロファイリング

### サーバーFPSモニタリング

最も基本的な指標はサーバーFPSです。Modがサーバーを低下させている場合、何か問題があります：

```c
// OnUpdate内で経過時間を測定する：
void OnUpdate(float dt)
{
    float startTime = GetGame().GetTickTime();

    // ... あなたのロジック ...

    float elapsed = GetGame().GetTickTime() - startTime;
    if (elapsed > 0.005)  // 5msを超える場合
    {
        MyLog.Warning("Perf", "OnUpdate took " + elapsed.ToString() + "s");
    }
}
```

### スクリプトログインジケータ

DayZサーバーのスクリプトログで以下のパフォーマンス警告を監視してください：

- `SCRIPT (W): Exceeded X ms` --- スクリプト実行がエンジンの時間予算を超えた
- ログタイムスタンプの長い一時停止 --- 何かがメインスレッドをブロックしている

### 実証的テスト

最適化が重要かどうかを知る唯一の信頼できる方法は、前後を測定することです：

1. 疑わしいコードの周りにタイミングを追加する
2. 再現可能なテストを実行する（例：50プレイヤー、1000エンティティ）
3. フレーム時間を比較する
4. 変更がフレームあたり1ms未満であれば、おそらく重要ではありません

---

## チェックリスト

パフォーマンスに敏感なコードをリリースする前に確認してください：

- [ ] フレームごとのコードで半径100m以上の`GetObjectsAtPosition3D`呼び出しがないこと
- [ ] すべてのコストの高いスキャン（CfgVehicles、エンティティ検索）がキャッシュされていること
- [ ] UIリストがウィジェットプーリングを使用しており、破棄/再作成ではないこと
- [ ] 検索入力がデバウンス（150ms以上）を使用していること
- [ ] OnUpdate操作がタイマーまたはバッチサイズで制限されていること
- [ ] 大きなコレクションがバッチで処理されていること（デフォルトでフレームあたり50アイテム）
- [ ] エンティティのスポーンがタイトなループではなくフレーム間でバッチ処理されていること
- [ ] タイトなループ内でフレームごとの文字列連結が行われていないこと
- [ ] ソート操作がフレームごとではなくデータ変更時に実行されていること
- [ ] 複数の定期的なシステムにスタガードタイマーがあること
- [ ] エンティティのトラッキングがワールドスキャンではなく登録を使用していること

---

## 互換性と影響

- **マルチMod：** パフォーマンスコストは累積的です。各Modの`OnUpdate`は毎フレーム実行されます。5つのModがそれぞれ2msかかると、スクリプトだけで毎フレーム10msになります。タイマーをずらし、重複したワールドスキャンを避けるために他のMod作者と調整してください。
- **読み込み順序：** 読み込み順序はパフォーマンスに直接影響しません。ただし、複数のModが同じエンティティを`modded class`している場合（例：`CarScript.EEInit`）、各オーバーライドがコールチェーンのコストに追加されます。moddedオーバーライドは最小限に保ってください。
- **リッスンサーバー：** リッスンサーバーはクライアントとサーバーの両方のスクリプトを同じプロセスで実行します。ウィジェットプーリング、UI更新、レンダリングコストがサーバーサイドのティックと合算されます。パフォーマンス予算はリッスンサーバーでは専用サーバーよりも厳しくなります。
- **パフォーマンス：** DayZサーバーの60 FPSでのフレーム予算は約16msです。20 FPS（負荷の高いサーバーで一般的）では約50msです。単一のModはフレームあたり2ms以下を目標にすべきです。`GetGame().GetTickTime()`を使用してプロファイリングし、確認してください。
- **マイグレーション：** パフォーマンスパターンはエンジンに依存せず、DayZのバージョンアップデートにも対応します。特定のAPIコスト（例：`GetObjectsAtPosition3D`）はエンジンバージョン間で変更される可能性があるため、主要なDayZアップデート後に再プロファイリングしてください。

---

## よくある間違い

| ミス | 影響 | 修正 |
|---------|--------|-----|
| 早すぎる最適化（起動時に1回だけ実行されるコードのマイクロ最適化） | 開発時間のムダ。測定可能な改善なし。読みにくいコード | まずプロファイリングしてください。毎フレーム実行されるか、大きなコレクションを処理するコードのみを最適化してください。起動コストは1回だけ支払います。 |
| `OnUpdate`でマップ全体の半径で`GetObjectsAtPosition3D`を使用する | 呼び出しあたり50〜200msの停止、マップ上のすべての物理オブジェクトをスキャン。サーバーFPSが一桁に低下 | 登録ベースのレジストリ（`EEInit`で登録、`EEDelete`で登録解除）を使用してください。フレームごとのワールドスキャンは絶対にしないでください。 |
| データ変更のたびにUIウィジェットツリーを再構築する | ウィジェットの作成/破棄によるフレームスパイク。プレイヤーに見えるスタッター | ウィジェットプーリングを使用してください：破棄して再作成する代わりに、既存のウィジェットを表示/非表示にします |
| 毎フレーム大きな配列をソートする | めったに変更されないデータに対してフレームあたりO(n log n)。不必要なCPUのムダ | データが変更されたときに1回ソートし（ダーティフラグ）、ソート結果をキャッシュし、変更時にのみ再ソートします |
| 毎`OnUpdate`ティックでコストの高いファイルI/O（JsonSaveFile）を実行する | ディスク書き込みがメインスレッドをブロック。ファイルサイズに応じて保存あたり5〜20ms | 自動保存タイマー（デフォルト300秒）とダーティフラグを使用してください。データが実際に変更された場合にのみ書き込みます。 |

---

## 理論と実践

| 教科書的な説明 | DayZの現実 |
|---------------|-------------|
| コストの高い操作には非同期処理を使用する | Enforce Scriptは非同期プリミティブのないシングルスレッドです。インデックスベースの処理を使用してフレーム間で作業をバッチ処理してください |
| オブジェクトプーリングは早すぎる最適化である | Enfusionではウィジェットの作成は本当にコストが高いです。プーリングはすべての主要Mod（COT、VPP、Expansion）での標準プラクティスです |
| 最適化する前にプロファイリングする | 正しいですが、一部のパターン（ワールドスキャン、フレームごとの文字列割り当て、キーストロークごとの再構築）はDayZでは*常に*間違いです。最初から避けてください。 |

---

[ホーム](../README.md) | [<< 前: イベント駆動アーキテクチャ](06-events.md) | **パフォーマンス最適化**
