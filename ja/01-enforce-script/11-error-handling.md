# 第1.11章: エラーハンドリング

[ホーム](../README.md) | [<< 前へ: 列挙型とプリプロセッサ](10-enums-preprocessor.md) | **エラーハンドリング** | [次へ: 注意点 >>](12-gotchas.md)

---

> **目標:** try/catchのない言語でエラーを処理する方法を学びます。ガード句、防御的コーディング、Modを安定させる構造化ログパターンをマスターします。

---

## 目次

- [基本ルール: try/catchは存在しない](#基本ルール-trycatchは存在しない)
- [ガード句パターン](#ガード句パターン)
  - [単一ガード](#単一ガード)
  - [複数ガード（スタック型）](#複数ガードスタック型)
  - [ログ付きガード](#ログ付きガード)
- [Nullチェック](#nullチェック)
  - [すべての操作の前に](#すべての操作の前に)
  - [連鎖Nullチェック](#連鎖nullチェック)
  - [notnullキーワード](#notnullキーワード)
- [ErrorEx -- エンジンエラーレポート](#errorex----エンジンエラーレポート)
  - [重大度レベル](#重大度レベル)
  - [各レベルの使い分け](#各レベルの使い分け)
- [DumpStackString -- スタックトレース](#dumpstackstring----スタックトレース)
- [デバッグ出力](#デバッグ出力)
  - [基本的なPrint](#基本的なprint)
  - [#ifdefによる条件付きデバッグ](#ifdefによる条件付きデバッグ)
- [構造化ログパターン](#構造化ログパターン)
  - [シンプルなプレフィックスパターン](#シンプルなプレフィックスパターン)
  - [レベルベースのロガークラス](#レベルベースのロガークラス)
  - [プロダクションロガーパターン](#プロダクションロガーパターン)
- [実践的な例](#実践的な例)
  - [複数ガード付き安全関数](#複数ガード付き安全関数)
  - [安全な設定読み込み](#安全な設定読み込み)
  - [安全なRPCハンドラ](#安全なrpcハンドラ)
  - [安全なインベントリ操作](#安全なインベントリ操作)
- [防御パターンのまとめ](#防御パターンのまとめ)
- [よくある間違い](#よくある間違い)
- [まとめ](#まとめ)
- [ナビゲーション](#ナビゲーション)

---

## 基本ルール: try/catchは存在しない

Enforce Scriptには**例外処理がありません**。`try`、`catch`、`throw`、`finally` は存在しません。ランタイムで問題が発生した場合（null参照、無効なキャスト、配列の範囲外アクセス）、エンジンは以下のいずれかを行います：

1. **暗黙的にクラッシュ** -- 関数が実行を停止し、エラーメッセージなし
2. **スクリプトエラーをログに記録** -- `.RPT` ログファイルで確認可能
3. **サーバー/クライアントをクラッシュ** -- 深刻な場合

これは**すべての潜在的な失敗ポイントを手動でガードする必要がある**ことを意味します。主要な防御手段は**ガード句パターン**です。

---

## ガード句パターン

ガード句は関数の先頭で前提条件をチェックし、失敗した場合は早期リターンします。これにより「ハッピーパス」がネストされず、読みやすくなります。

### 単一ガード

```c
void TeleportPlayer(PlayerBase player, vector destination)
{
    if (!player)
        return;

    player.SetPosition(destination);
}
```

### 複数ガード（スタック型）

関数の先頭にガードを積み重ねます -- 各ガードが1つの前提条件をチェックします：

```c
void GiveItemToPlayer(PlayerBase player, string className, int quantity)
{
    // ガード1: プレイヤーが存在する
    if (!player)
        return;

    // ガード2: プレイヤーが生存している
    if (!player.IsAlive())
        return;

    // ガード3: 有効なクラス名
    if (className == "")
        return;

    // ガード4: 有効な数量
    if (quantity <= 0)
        return;

    // すべての前提条件が満たされた -- 安全に続行
    for (int i = 0; i < quantity; i++)
    {
        player.GetInventory().CreateInInventory(className);
    }
}
```

### ログ付きガード

プロダクションコードでは、ガードがトリガーされた理由を常にログに記録します -- サイレント失敗はデバッグが困難です：

```c
void StartMission(PlayerBase initiator, string missionId)
{
    if (!initiator)
    {
        Print("[Missions] ERROR: StartMission called with null initiator");
        return;
    }

    if (missionId == "")
    {
        Print("[Missions] ERROR: StartMission called with empty missionId");
        return;
    }

    if (!initiator.IsAlive())
    {
        Print("[Missions] WARN: Player " + initiator.GetIdentity().GetName() + " is dead, cannot start mission");
        return;
    }

    // ミッション開始を続行
    Print("[Missions] Starting mission " + missionId);
    // ...
}
```

---

## Nullチェック

Null参照はDayZモディングで最も一般的なクラッシュ原因です。すべての参照型は `null` になり得ます。

### すべての操作の前に

```c
// 間違い -- player、identity、nameのいずれかがnullの場合クラッシュ
string name = player.GetIdentity().GetName();

// 正しい -- 各ステップでチェック
if (!player)
    return;

PlayerIdentity identity = player.GetIdentity();
if (!identity)
    return;

string name = identity.GetName();
```

### 連鎖Nullチェック

参照のチェーンを走査する必要がある場合、各リンクをチェックします：

```c
void PrintHandItemName(PlayerBase player)
{
    if (!player)
        return;

    HumanInventory inv = player.GetHumanInventory();
    if (!inv)
        return;

    EntityAI handItem = inv.GetEntityInHands();
    if (!handItem)
        return;

    Print("Player is holding: " + handItem.GetType());
}
```

### notnullキーワード

`notnull` はパラメータ修飾子で、コンパイラが呼び出し側で `null` 引数を拒否するようにします：

```c
void ProcessItem(notnull EntityAI item)
{
    // コンパイラがitemがnullでないことを保証する
    // 関数内でnullチェック不要
    Print(item.GetType());
}

// 使用方法:
EntityAI item = GetSomeItem();
if (item)
{
    ProcessItem(item);  // OK -- コンパイラはここでitemがnullでないことを知っている
}
ProcessItem(null);      // コンパイルエラー！
```

> **制限:** `notnull` はリテラルの `null` と明らかにnullの変数のみを呼び出し側でキャッチします。チェック時にnullでなかった変数がエンジンの削除によりnullになることは防げません。

---

## ErrorEx -- エンジンエラーレポート

`ErrorEx` はスクリプトログ（`.RPT` ファイル）にエラーメッセージを書き込みます。実行を停止したり例外をスローしたりは**しません**。

```c
ErrorEx("Something went wrong");
```

### 重大度レベル

`ErrorEx` は `ErrorExSeverity` 型のオプションの第2パラメータを受け取ります：

```c
// INFO -- 情報提供、エラーではない
ErrorEx("Config loaded successfully", ErrorExSeverity.INFO);

// WARNING -- 潜在的な問題、実行は継続
ErrorEx("Config file not found, using defaults", ErrorExSeverity.WARNING);

// ERROR -- 明確な問題（省略時のデフォルト重大度）
ErrorEx("Failed to create object: class not found");
ErrorEx("Critical failure in RPC handler", ErrorExSeverity.ERROR);
```

| 重大度 | 使用場面 |
|----------|-------------|
| `ErrorExSeverity.INFO` | エラーログに残したい情報メッセージ |
| `ErrorExSeverity.WARNING` | 回復可能な問題（設定が見つからない、フォールバックを使用） |
| `ErrorExSeverity.ERROR` | 明確なバグまたは回復不能な状態 |

### 各レベルの使い分け

```c
void LoadConfig(string path)
{
    if (!FileExist(path))
    {
        // WARNING -- 回復可能、デフォルトを使用する
        ErrorEx("Config not found at " + path + ", using defaults", ErrorExSeverity.WARNING);
        UseDefaultConfig();
        return;
    }

    MyConfig cfg = new MyConfig();
    JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);

    if (cfg.Version < EXPECTED_VERSION)
    {
        // INFO -- 問題ではないが注目に値する
        ErrorEx("Config version " + cfg.Version.ToString() + " is older than expected", ErrorExSeverity.INFO);
    }

    if (!cfg.Validate())
    {
        // ERROR -- 問題を引き起こす不正データ
        ErrorEx("Config validation failed for " + path);
        UseDefaultConfig();
        return;
    }
}
```

---

## DumpStackString -- スタックトレース

`DumpStackString` は現在のコールスタックを文字列としてキャプチャします。予期しない状態が発生した場所を診断するために重要です：

```c
void OnUnexpectedState(string context)
{
    string stack = DumpStackString();
    Print("[ERROR] Unexpected state in " + context);
    Print("[ERROR] Stack trace:");
    Print(stack);
}
```

ガード句で呼び出し元をトレースするために使用します：

```c
void CriticalFunction(PlayerBase player)
{
    if (!player)
    {
        string stack = DumpStackString();
        ErrorEx("CriticalFunction called with null player! Stack: " + stack);
        return;
    }

    // ...
}
```

---

## デバッグ出力

### 基本的なPrint

`Print()` はスクリプトログファイルに書き込みます。任意の型を受け取ります：

```c
Print("Hello World");                    // string
Print(42);                               // int
Print(3.14);                             // float
Print(player.GetPosition());             // vector

// フォーマット付き出力
Print(string.Format("Player %1 at position %2 with %3 HP",
    player.GetIdentity().GetName(),
    player.GetPosition().ToString(),
    player.GetHealth("", "Health").ToString()
));
```

### #ifdefによる条件付きデバッグ

デバッグ出力をプリプロセッサガードで囲み、リリースビルドからコンパイルアウトします：

```c
void ProcessAI(DayZInfected zombie)
{
    #ifdef DIAG_DEVELOPER
        Print(string.Format("[AI DEBUG] Processing %1 at %2",
            zombie.GetType(),
            zombie.GetPosition().ToString()
        ));
    #endif

    // 実際のロジック...
}
```

Mod固有のデバッグフラグには、独自のシンボルを定義します：

```c
// config.cpp内:
// defines[] = { "MYMOD_DEBUG" };

#ifdef MYMOD_DEBUG
    Print("[MyMod] Debug: item spawned at " + pos.ToString());
#endif
```

---

## 構造化ログパターン

### シンプルなプレフィックスパターン

最もシンプルなアプローチ -- すべてのPrint呼び出しにタグを前置します：

```c
class MissionManager
{
    static const string LOG_TAG = "[Missions] ";

    void Start()
    {
        Print(LOG_TAG + "Mission system starting");
    }

    void OnError(string msg)
    {
        Print(LOG_TAG + "ERROR: " + msg);
    }
}
```

### レベルベースのロガークラス

重大度レベル付きの再利用可能なロガー：

```c
class ModLogger
{
    protected string m_Prefix;

    void ModLogger(string prefix)
    {
        m_Prefix = "[" + prefix + "] ";
    }

    void Info(string msg)
    {
        Print(m_Prefix + "INFO: " + msg);
    }

    void Warning(string msg)
    {
        Print(m_Prefix + "WARN: " + msg);
        ErrorEx(m_Prefix + msg, ErrorExSeverity.WARNING);
    }

    void Error(string msg)
    {
        Print(m_Prefix + "ERROR: " + msg);
        ErrorEx(m_Prefix + msg, ErrorExSeverity.ERROR);
    }

    void Debug(string msg)
    {
        #ifdef DIAG_DEVELOPER
            Print(m_Prefix + "DEBUG: " + msg);
        #endif
    }
}

// 使用方法:
ref ModLogger g_MissionLog = new ModLogger("Missions");
g_MissionLog.Info("System started");
g_MissionLog.Error("Failed to load mission data");
```

### プロダクションロガーパターン

プロダクションModには、ファイル出力、日次ローテーション、複数の出力先を持つ静的ロギングクラスを使用します：

```c
// ログレベルの列挙型
enum MyLogLevel
{
    TRACE   = 0,
    DEBUG   = 1,
    INFO    = 2,
    WARNING = 3,
    ERROR   = 4,
    NONE    = 5
};

class MyLog
{
    private static MyLogLevel s_FileMinLevel = MyLogLevel.DEBUG;
    private static MyLogLevel s_ConsoleMinLevel = MyLogLevel.INFO;

    // 使用方法: MyLog.Info("ModuleName", "Something happened");
    static void Info(string source, string message)
    {
        Log(MyLogLevel.INFO, source, message);
    }

    static void Warning(string source, string message)
    {
        Log(MyLogLevel.WARNING, source, message);
    }

    static void Error(string source, string message)
    {
        Log(MyLogLevel.ERROR, source, message);
    }

    private static void Log(MyLogLevel level, string source, string message)
    {
        if (level < s_ConsoleMinLevel)
            return;

        string levelName = typename.EnumToString(MyLogLevel, level);
        string line = string.Format("[MyMod] [%1] [%2] %3", levelName, source, message);
        Print(line);

        // レベルがファイル閾値を満たす場合はファイルにも書き込む
        if (level >= s_FileMinLevel)
        {
            WriteToFile(line);
        }
    }

    private static void WriteToFile(string line)
    {
        // ファイルI/O実装...
    }
}
```

複数のモジュール間での使用：

```c
MyLog.Info("MissionServer", "MyMod Core initialized (server)");
MyLog.Warning("ServerWebhooksRPC", "Unauthorized request from: " + sender.GetName());
MyLog.Error("ConfigManager", "Failed to load config: " + path);
```

---

## 実践的な例

### 複数ガード付き安全関数

```c
void HealPlayer(PlayerBase player, float amount, string healerName)
{
    // ガード: nullプレイヤー
    if (!player)
    {
        MyLog.Error("HealSystem", "HealPlayer called with null player");
        return;
    }

    // ガード: プレイヤー生存
    if (!player.IsAlive())
    {
        MyLog.Warning("HealSystem", "Cannot heal dead player: " + player.GetIdentity().GetName());
        return;
    }

    // ガード: 有効な回復量
    if (amount <= 0)
    {
        MyLog.Warning("HealSystem", "Invalid heal amount: " + amount.ToString());
        return;
    }

    // ガード: 既にフルヘルスでない
    float currentHP = player.GetHealth("", "Health");
    float maxHP = player.GetMaxHealth("", "Health");
    if (currentHP >= maxHP)
    {
        MyLog.Info("HealSystem", player.GetIdentity().GetName() + " already at full health");
        return;
    }

    // すべてのガードを通過 -- 回復を実行
    float newHP = Math.Min(currentHP + amount, maxHP);
    player.SetHealth("", "Health", newHP);

    MyLog.Info("HealSystem", string.Format("%1 healed %2 for %3 HP (%4 -> %5)",
        healerName,
        player.GetIdentity().GetName(),
        amount.ToString(),
        currentHP.ToString(),
        newHP.ToString()
    ));
}
```

### 安全な設定読み込み

```c
class MyConfig
{
    int MaxPlayers = 60;
    float SpawnRadius = 100.0;
    string WelcomeMessage = "Welcome!";
}

static MyConfig LoadConfigSafe(string path)
{
    // ガード: ファイルが存在する
    if (!FileExist(path))
    {
        Print("[Config] File not found: " + path + " — creating defaults");
        MyConfig defaults = new MyConfig();
        JsonFileLoader<MyConfig>.JsonSaveFile(path, defaults);
        return defaults;
    }

    // 読み込みを試行（try/catchがないため、後で検証する）
    MyConfig cfg = new MyConfig();
    JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);

    // ガード: 読み込まれたオブジェクトが有効
    if (!cfg)
    {
        Print("[Config] ERROR: Failed to parse " + path + " — using defaults");
        return new MyConfig();
    }

    // ガード: 値の検証
    if (cfg.MaxPlayers < 1 || cfg.MaxPlayers > 128)
    {
        Print("[Config] WARN: MaxPlayers out of range (" + cfg.MaxPlayers.ToString() + "), clamping");
        cfg.MaxPlayers = Math.Clamp(cfg.MaxPlayers, 1, 128);
    }

    if (cfg.SpawnRadius < 0)
    {
        Print("[Config] WARN: SpawnRadius negative, using default");
        cfg.SpawnRadius = 100.0;
    }

    return cfg;
}
```

### 安全なRPCハンドラ

```c
void RPC_SpawnItem(CallType type, ParamsReadContext ctx, PlayerIdentity sender, Object target)
{
    // ガード: サーバーのみ
    if (type != CallType.Server)
        return;

    // ガード: 有効な送信者
    if (!sender)
    {
        Print("[RPC] SpawnItem: null sender identity");
        return;
    }

    // ガード: パラメータの読み取り
    Param2<string, vector> data;
    if (!ctx.Read(data))
    {
        Print("[RPC] SpawnItem: failed to read params from " + sender.GetName());
        return;
    }

    string className = data.param1;
    vector position = data.param2;

    // ガード: 有効なクラス名
    if (className == "")
    {
        Print("[RPC] SpawnItem: empty className from " + sender.GetName());
        return;
    }

    // ガード: パーミッションチェック
    if (!HasPermission(sender.GetPlainId(), "SpawnItem"))
    {
        Print("[RPC] SpawnItem: unauthorized by " + sender.GetName());
        return;
    }

    // すべてのガードを通過 -- 実行
    Object obj = GetGame().CreateObjectEx(className, position, ECE_PLACE_ON_SURFACE);
    if (!obj)
    {
        Print("[RPC] SpawnItem: CreateObjectEx returned null for " + className);
        return;
    }

    Print("[RPC] SpawnItem: " + sender.GetName() + " spawned " + className);
}
```

### 安全なインベントリ操作

```c
bool TransferItem(PlayerBase fromPlayer, PlayerBase toPlayer, EntityAI item)
{
    // ガード: すべての参照が有効
    if (!fromPlayer || !toPlayer || !item)
    {
        Print("[Inventory] TransferItem: null reference");
        return false;
    }

    // ガード: 両プレイヤーが生存
    if (!fromPlayer.IsAlive() || !toPlayer.IsAlive())
    {
        Print("[Inventory] TransferItem: one or both players are dead");
        return false;
    }

    // ガード: ソースが実際にアイテムを持っている
    EntityAI checkItem = fromPlayer.GetInventory().FindAttachment(
        fromPlayer.GetInventory().FindUserReservedLocationIndex(item)
    );

    // ガード: ターゲットにスペースがある
    InventoryLocation il = new InventoryLocation();
    if (!toPlayer.GetInventory().FindFreeLocationFor(item, FindInventoryLocationType.ANY, il))
    {
        Print("[Inventory] TransferItem: no free space in target inventory");
        return false;
    }

    // 移転を実行
    return toPlayer.GetInventory().TakeEntityToInventory(InventoryMode.SERVER, FindInventoryLocationType.ANY, item);
}
```

---

## 防御パターンのまとめ

| パターン | 目的 | 例 |
|---------|---------|---------|
| ガード句 | 無効な入力での早期リターン | `if (!player) return;` |
| Nullチェック | null参照の防止 | `if (obj) obj.DoThing();` |
| キャスト + チェック | 安全なダウンキャスト | `if (Class.CastTo(p, obj))` |
| 読み込み後の検証 | JSON読み込み後のデータチェック | `if (cfg.Value < 0) cfg.Value = default;` |
| 使用前の検証 | 範囲/境界チェック | `if (arr.IsValidIndex(i))` |
| 失敗時のログ | 問題の発生場所を追跡 | `Print("[Tag] Error: " + context);` |
| エンジン用ErrorEx | .RPTファイルに書き込み | `ErrorEx("msg", ErrorExSeverity.WARNING);` |
| DumpStackString | コールスタックのキャプチャ | `Print(DumpStackString());` |

---

## ベストプラクティス

- 深くネストされた `if` ブロックの代わりに、関数の先頭でフラットなガード句（`if (!x) return;`）を使用してください -- コードが読みやすくなり、ハッピーパスがネストされません。
- ガード句内では常にメッセージをログに記録してください -- サイレントな `return` は失敗を不可視にし、デバッグが極めて困難になります。
- `.RPT` ログに表示すべきメッセージには適切な重大度レベル（`INFO`、`WARNING`、`ERROR`）の `ErrorEx` を使用し、スクリプトログ出力には `Print` を使用してください。
- 大量のデバッグログは `#ifdef DIAG_DEVELOPER` またはカスタム定義で囲み、リリースビルドからコンパイルアウトしてパフォーマンスに影響しないようにしてください。
- `JsonFileLoader` で読み込んだ後の設定データを検証してください -- `void` を返し、パース失敗時にデフォルト値を暗黙的に残します。

---

## 実際のModで確認されたパターン

> プロフェッショナルなDayZ Modのソースコードを調査して確認されたパターンです。

| パターン | Mod | 詳細 |
|---------|-----|--------|
| ログメッセージ付きスタック型ガード句 | COT / VPP | すべてのRPCハンドラが送信者、パラメータ、パーミッションをチェックし、各失敗時にログを記録する |
| レベルフィルタリング付き静的ロガークラス | Expansion / Dabs | 単一の `Log` クラスが `Info`/`Warning`/`Error` をコンソール、ファイル、オプションでDiscordにルーティングする |
| 重要なガードでの `DumpStackString()` | COT Admin | 予期しないnull時にコールスタックをキャプチャし、どの呼び出し元が不正なデータを渡したかを追跡する |
| デバッグ出力を囲む `#ifdef DIAG_DEVELOPER` | Vanilla DayZ / Expansion | すべてのフレームごとのデバッグ出力がラップされ、リリースビルドでは実行されない |

---

## 理論 vs 実践

| 概念 | 理論 | 現実 |
|---------|--------|---------|
| `try`/`catch` | ほとんどの言語で標準 | Enforce Scriptには存在しない -- すべての失敗ポイントを手動でガードする必要がある |
| `JsonFileLoader.JsonLoadFile` | 成功/失敗を返すことが期待される | `void` を返す。不正なJSONの場合、オブジェクトはデフォルト値を保持しエラーなし |
| `ErrorEx` | エラーをスローするように聞こえる | `.RPT` ログに書き込むだけ -- 実行は通常通り継続される |

---

## よくある間違い

### 1. 関数が正常に実行されたと仮定する

```c
// 間違い -- JsonLoadFileはvoidを返し、成功インジケータではない
MyConfig cfg = new MyConfig();
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);
// ファイルに不正なJSONがあっても、cfgはデフォルト値のまま -- エラーなし

// 正しい -- 読み込み後に検証する
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);
if (cfg.SomeCriticalField == 0)
{
    Print("[Config] Warning: SomeCriticalField is zero — was the file loaded correctly?");
}
```

### 2. ガードの代わりに深くネストされたnullチェック

```c
// 間違い -- 地獄のピラミッド
void Process(PlayerBase player)
{
    if (player)
    {
        if (player.GetIdentity())
        {
            if (player.IsAlive())
            {
                // ようやく何かする
            }
        }
    }
}

// 正しい -- フラットなガード句
void Process(PlayerBase player)
{
    if (!player) return;
    if (!player.GetIdentity()) return;
    if (!player.IsAlive()) return;

    // 何かする
}
```

### 3. ガード句でのログ忘れ

```c
// 間違い -- サイレント失敗、デバッグ不可能
if (!player) return;

// 正しい -- 痕跡を残す
if (!player)
{
    Print("[MyMod] Process: null player");
    return;
}
```

### 4. ホットパスでのPrint使用

```c
// 間違い -- 毎フレームPrintするとパフォーマンスが低下
override void OnUpdate(float timeslice)
{
    Print("Updating...");  // 毎フレーム呼ばれる！
}

// 正しい -- デバッグガードを使用するかレート制限する
override void OnUpdate(float timeslice)
{
    #ifdef DIAG_DEVELOPER
        m_DebugTimer += timeslice;
        if (m_DebugTimer > 5.0)
        {
            Print("[DEBUG] Update tick: " + timeslice.ToString());
            m_DebugTimer = 0;
        }
    #endif
}
```

---

## まとめ

| ツール | 目的 | 構文 |
|------|---------|--------|
| ガード句 | 失敗時の早期リターン | `if (!x) return;` |
| Nullチェック | クラッシュ防止 | `if (obj) obj.Method();` |
| ErrorEx | .RPTログに書き込み | `ErrorEx("msg", ErrorExSeverity.WARNING);` |
| DumpStackString | コールスタックの取得 | `string s = DumpStackString();` |
| Print | スクリプトログに書き込み | `Print("message");` |
| string.Format | フォーマット付きログ | `string.Format("P %1 at %2", a, b)` |
| #ifdefガード | コンパイル時デバッグスイッチ | `#ifdef DIAG_DEVELOPER` |
| notnull | コンパイラnullチェック | `void Fn(notnull Class obj)` |

**黄金律:** Enforce Scriptでは、すべてがnullになり得ると仮定し、すべての操作が失敗し得ると仮定してください。最初にチェックし、次に実行し、常にログを記録してください。

---

## ナビゲーション

| 前へ | 上へ | 次へ |
|----------|----|------|
| [1.10 列挙型とプリプロセッサ](10-enums-preprocessor.md) | [パート1: Enforce Script](../README.md) | [1.12 存在しないもの](12-gotchas.md) |
