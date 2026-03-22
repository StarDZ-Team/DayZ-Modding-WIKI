# Chapter 7.4: 設定の永続化

[ホーム](../README.md) | [<< 前: RPCパターン](03-rpc-patterns.md) | **設定の永続化** | [次: パーミッションシステム >>](05-permissions.md)

---

## はじめに

ほぼすべてのDayZ Modは設定データの保存と読み込みが必要です：サーバー設定、スポーンテーブル、BANリスト、プレイヤーデータ、テレポート位置など。エンジンはシンプルなJSONシリアライゼーション用の`JsonFileLoader`と、その他すべて用の生のファイルI/O（`FileHandle`、`FPrintln`）を提供しています。プロフェッショナルなModでは、設定のバージョニングと自動マイグレーションをその上に構築しています。

この章では、基本的なJSON読み込み/保存からバージョン付きマイグレーションシステム、ディレクトリ管理、自動保存タイマーまで、設定永続化の標準パターンを解説します。

---

## 目次

- [JsonFileLoaderパターン](#jsonfileloader-pattern)
- [手動JSON書き込み（FPrintln）](#manual-json-writing-fprintln)
- [$profileパス](#the-profile-path)
- [ディレクトリの作成](#directory-creation)
- [設定データクラス](#config-data-classes)
- [設定のバージョニングとマイグレーション](#config-versioning-and-migration)
- [自動保存タイマー](#auto-save-timers)
- [よくある間違い](#common-mistakes)
- [ベストプラクティス](#best-practices)

---

## JsonFileLoaderパターン

`JsonFileLoader`はエンジン組み込みのシリアライザです。リフレクションを使用してEnforce ScriptオブジェクトとJSONファイル間の変換を行います --- クラスのpublicフィールドを読み取り、自動的にJSONキーにマッピングします。

### 重要な注意事項

**`JsonFileLoader<T>.JsonLoadFile()`と`JsonFileLoader<T>.JsonSaveFile()`は`void`を返します。** 戻り値をチェックすることはできません。`bool`に代入することもできません。`if`条件で使用することもできません。これはDayZ Moddingで最も一般的なミスの1つです。

```c
// 間違い — コンパイルできません
bool success = JsonFileLoader<MyConfig>.JsonLoadFile(path, config);

// 間違い — コンパイルできません
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, config))
{
    // ...
}

// 正しい — 呼び出してからオブジェクトの状態をチェックする
JsonFileLoader<MyConfig>.JsonLoadFile(path, config);
// データが実際にポピュレートされたかチェックする
if (config.m_ServerName != "")
{
    // データが正常に読み込まれた
}
```

### 基本的な読み込み/保存

```c
// データクラス — publicフィールドがJSONとの間でシリアライズされます
class ServerSettings
{
    string ServerName = "My DayZ Server";
    int MaxPlayers = 60;
    float RestartInterval = 14400.0;
    bool PvPEnabled = true;
};

class SettingsManager
{
    private static const string SETTINGS_PATH = "$profile:MyMod/ServerSettings.json";
    protected ref ServerSettings m_Settings;

    void Load()
    {
        m_Settings = new ServerSettings();

        if (FileExist(SETTINGS_PATH))
        {
            JsonFileLoader<ServerSettings>.JsonLoadFile(SETTINGS_PATH, m_Settings);
        }
        else
        {
            // 初回実行：デフォルトを保存する
            Save();
        }
    }

    void Save()
    {
        JsonFileLoader<ServerSettings>.JsonSaveFile(SETTINGS_PATH, m_Settings);
    }
};
```

### シリアライズされるもの

`JsonFileLoader`はオブジェクトの**すべてのpublicフィールド**をシリアライズします。以下はシリアライズされません：
- privateまたはprotectedフィールド
- メソッド
- staticフィールド
- 一時的な/ランタイム専用のフィールド（`[NonSerialized]`属性はありません --- アクセス修飾子を使用してください）

生成されるJSONは以下のようになります：

```json
{
    "ServerName": "My DayZ Server",
    "MaxPlayers": 60,
    "RestartInterval": 14400.0,
    "PvPEnabled": true
}
```

### サポートされるフィールド型

| 型 | JSON表現 |
|------|-------------------|
| `int` | 数値 |
| `float` | 数値 |
| `bool` | `true` / `false` |
| `string` | 文字列 |
| `vector` | 3つの数値の配列 |
| `array<T>` | JSON配列 |
| `map<string, T>` | JSONオブジェクト（文字列キーのみ） |
| ネストされたクラス | ネストされたJSONオブジェクト |

### ネストされたオブジェクト

```c
class SpawnPoint
{
    string Name;
    vector Position;
    float Radius;
};

class SpawnConfig
{
    ref array<ref SpawnPoint> SpawnPoints = new array<ref SpawnPoint>();
};
```

生成されるJSON：

```json
{
    "SpawnPoints": [
        {
            "Name": "Coast",
            "Position": [13000, 0, 3500],
            "Radius": 100.0
        },
        {
            "Name": "Airfield",
            "Position": [4500, 0, 9500],
            "Radius": 50.0
        }
    ]
}
```

---

## 手動JSON書き込み（FPrintln）

`JsonFileLoader`では十分でない場合があります：混合型の配列、カスタムフォーマット、非クラスデータ構造を扱えません。その場合は、生のファイルI/Oを使用します。

### 基本パターン

```c
void WriteCustomData(string path, array<string> lines)
{
    FileHandle file = OpenFile(path, FileMode.WRITE);
    if (!file) return;

    FPrintln(file, "{");
    FPrintln(file, "    \"entries\": [");

    for (int i = 0; i < lines.Count(); i++)
    {
        string comma = "";
        if (i < lines.Count() - 1) comma = ",";
        FPrintln(file, "        \"" + lines[i] + "\"" + comma);
    }

    FPrintln(file, "    ]");
    FPrintln(file, "}");

    CloseFile(file);
}
```

### 生ファイルの読み込み

```c
void ReadCustomData(string path)
{
    FileHandle file = OpenFile(path, FileMode.READ);
    if (!file) return;

    string line;
    while (FGets(file, line) >= 0)
    {
        line = line.Trim();
        if (line == "") continue;
        // 行を処理...
    }

    CloseFile(file);
}
```

### 手動I/Oの使い分け

- ログファイルの書き込み（追記モード）
- CSVまたはプレーンテキストエクスポートの書き込み
- `JsonFileLoader`では生成できないカスタムJSONフォーマット
- 非JSONファイルフォーマット（DayZの`.map`や`.xml`ファイルなど）のパース

標準的な設定ファイルには`JsonFileLoader`を使用することを推奨します。実装が速く、エラーが発生しにくく、ネストされたオブジェクトを自動的に処理します。

---

## $profileパス

DayZは`$profile:`パスプレフィックスを提供しており、サーバーのプロファイルディレクトリ（通常`DayZServer_x64.exe`を含むフォルダ、または`-profiles=`で指定されたプロファイルパス）に解決されます。

```c
// これらはプロファイルディレクトリに解決されます：
"$profile:MyMod/config.json"       // → C:/DayZServer/MyMod/config.json
"$profile:MyMod/Players/data.json" // → C:/DayZServer/MyMod/Players/data.json
```

### 常に$profileを使用する

絶対パスは決して使用しないでください。相対パスも使用しないでください。Modがランタイムで作成または読み取るすべてのファイルに対して、常に`$profile:`を使用してください：

```c
// 悪い例：絶対パス — 他のマシンでは動作しません
const string CONFIG_PATH = "C:/DayZServer/MyMod/config.json";

// 悪い例：相対パス — ワーキングディレクトリに依存し、環境によって異なります
const string CONFIG_PATH = "MyMod/config.json";

// 良い例：$profileはどこでも正しく解決されます
const string CONFIG_PATH = "$profile:MyMod/config.json";
```

### 標準的なディレクトリ構造

ほとんどのModは以下の規約に従います：

```
$profile:
  └── YourModName/
      ├── Config.json          (メインサーバー設定)
      ├── Permissions.json     (管理者パーミッション)
      ├── Logs/
      │   └── 2025-01-15.log   (日次ログファイル)
      └── Players/
          ├── 76561198xxxxx.json
          └── 76561198yyyyy.json
```

---

## ディレクトリの作成

ファイルを書き込む前に、親ディレクトリが存在することを確認する必要があります。DayZはディレクトリを自動作成しません。

### MakeDirectory

```c
void EnsureDirectories()
{
    string baseDir = "$profile:MyMod";
    if (!FileExist(baseDir))
    {
        MakeDirectory(baseDir);
    }

    string playersDir = baseDir + "/Players";
    if (!FileExist(playersDir))
    {
        MakeDirectory(playersDir);
    }

    string logsDir = baseDir + "/Logs";
    if (!FileExist(logsDir))
    {
        MakeDirectory(logsDir);
    }
}
```

### 重要：MakeDirectoryは再帰的ではない

`MakeDirectory`はパスの最後のディレクトリのみを作成します。親が存在しない場合、サイレントに失敗します。各レベルを作成する必要があります：

```c
// 間違い：親の"MyMod"がまだ存在しない
MakeDirectory("$profile:MyMod/Data/Players");  // サイレントに失敗

// 正しい：各レベルを作成する
MakeDirectory("$profile:MyMod");
MakeDirectory("$profile:MyMod/Data");
MakeDirectory("$profile:MyMod/Data/Players");
```

### パス定数パターン

フレームワークModではすべてのパスを専用クラスの定数として定義します：

```c
class MyModConst
{
    static const string PROFILE_DIR    = "$profile:MyMod";
    static const string CONFIG_DIR     = "$profile:MyMod/Configs";
    static const string LOG_DIR        = "$profile:MyMod/Logs";
    static const string PLAYERS_DIR    = "$profile:MyMod/Players";
    static const string PERMISSIONS_FILE = "$profile:MyMod/Permissions.json";
};
```

これにより、コードベース全体でパス文字列の重複を避け、Modが触れるすべてのファイルを簡単に見つけることができます。

---

## 設定データクラス

よく設計された設定データクラスは、デフォルト値、バージョントラッキング、各フィールドの明確なドキュメントを提供します。

### 基本パターン

```c
class MyModConfig
{
    // マイグレーション用のバージョントラッキング
    int ConfigVersion = 3;

    // 適切なデフォルト値を持つゲームプレイ設定
    bool EnableFeatureX = true;
    int MaxEntities = 50;
    float SpawnRadius = 500.0;
    string WelcomeMessage = "Welcome to the server!";

    // 複合的な設定
    ref array<string> AllowedWeapons = new array<string>();
    ref map<string, float> ZoneRadii = new map<string, float>();

    void MyModConfig()
    {
        // デフォルトでコレクションを初期化
        AllowedWeapons.Insert("AK74");
        AllowedWeapons.Insert("M4A1");

        ZoneRadii.Set("safe_zone", 100.0);
        ZoneRadii.Set("pvp_zone", 500.0);
    }
};
```

### リフレクティブConfigBaseパターン

このパターンでは、各設定クラスがフィールドをディスクリプタとして宣言するリフレクティブな設定システムを使用します。これにより、管理パネルがハードコードされたフィールド名なしで、任意の設定に対してUIを自動生成できます：

```c
// 概念的なパターン（リフレクティブ設定）：
class MyConfigBase
{
    // 各設定がバージョンを宣言する
    int ConfigVersion;
    string ModId;

    // サブクラスがフィールドを宣言するためにオーバーライドする
    void Init(string modId)
    {
        ModId = modId;
    }

    // リフレクション：すべての設定可能なフィールドを取得する
    array<ref MyConfigField> GetFields();

    // フィールド名による動的な取得/設定（管理パネル同期用）
    string GetFieldValue(string fieldName);
    void SetFieldValue(string fieldName, string value);

    // 読み込み/保存時のカスタムロジック用フック
    void OnAfterLoad() {}
    void OnBeforeSave() {}
};
```

### VPP ConfigurablePluginパターン

VPPは設定管理をプラグインのライフサイクルに直接統合しています：

```c
// VPPパターン（簡略化）：
class VPPESPConfig
{
    bool EnableESP = true;
    float MaxDistance = 1000.0;
    int RefreshRate = 5;
};

class VPPESPPlugin : ConfigurablePlugin
{
    ref VPPESPConfig m_ESPConfig;

    override void OnInit()
    {
        m_ESPConfig = new VPPESPConfig();
        // ConfigurablePlugin.LoadConfig()がJSON読み込みを処理する
        super.OnInit();
    }
};
```

---

## 設定のバージョニングとマイグレーション

Modが進化するにつれて、設定構造は変化します。フィールドの追加、削除、名前変更、デフォルト値の変更が行われます。バージョニングがなければ、古い設定ファイルを持つユーザーはサイレントに不正な値を取得したり、クラッシュしたりします。

### バージョンフィールド

すべての設定クラスには整数のバージョンフィールドを持たせるべきです：

```c
class MyModConfig
{
    int ConfigVersion = 5;  // 構造が変更されたときにインクリメントする
    // ...
};
```

### 読み込み時のマイグレーション

設定を読み込むとき、ディスク上のバージョンと現在のコードバージョンを比較します。異なる場合はマイグレーションを実行します：

```c
void LoadConfig()
{
    MyModConfig config = new MyModConfig();  // 現在のデフォルトを持つ

    if (FileExist(CONFIG_PATH))
    {
        JsonFileLoader<MyModConfig>.JsonLoadFile(CONFIG_PATH, config);

        if (config.ConfigVersion < CURRENT_VERSION)
        {
            MigrateConfig(config);
            config.ConfigVersion = CURRENT_VERSION;
            SaveConfig(config);  // 更新されたバージョンで再保存する
        }
    }
    else
    {
        SaveConfig(config);  // 初回実行：デフォルトを書き込む
    }

    m_Config = config;
}
```

### マイグレーション関数

```c
static const int CURRENT_VERSION = 5;

void MigrateConfig(MyModConfig config)
{
    // 各マイグレーションステップを順次実行する
    if (config.ConfigVersion < 2)
    {
        // v1 → v2: "SpawnDelay"が"RespawnInterval"に名前変更された
        // 古いフィールドは読み込み時に失われる。新しいデフォルトを設定する
        config.RespawnInterval = 300.0;
    }

    if (config.ConfigVersion < 3)
    {
        // v2 → v3: "EnableNotifications"フィールドが追加された
        config.EnableNotifications = true;
    }

    if (config.ConfigVersion < 4)
    {
        // v3 → v4: "MaxZombies"のデフォルトが100から200に変更された
        if (config.MaxZombies == 100)
        {
            config.MaxZombies = 200;  // ユーザーが変更していない場合のみ更新する
        }
    }

    if (config.ConfigVersion < 5)
    {
        // v4 → v5: "DifficultyMode"がintからstringに変更された
        // config.DifficultyMode = "Normal"; // 新しいデフォルトを設定する
    }

    MyLog.Info("Config", "Migrated config from v"
        + config.ConfigVersion.ToString() + " to v" + CURRENT_VERSION.ToString());
}
```

### Expansionのマイグレーション例

Expansionは積極的な設定進化で知られています。一部のExpansion設定は17以上のバージョンを経ています。そのパターンは以下の通りです：
1. 各バージョンバンプには専用のマイグレーション関数がある
2. マイグレーションは順番に実行される（1から2、次に2から3、次に3から4など）
3. 各マイグレーションはそのバージョンステップに必要な変更のみを行う
4. すべてのマイグレーションが完了した後、最終バージョン番号がディスクに書き込まれる

これはDayZ Modにおける設定バージョニングのゴールドスタンダードです。

---

## 自動保存タイマー

ランタイムで変更される設定（管理者の編集、プレイヤーデータの蓄積）には、クラッシュ時のデータ損失を防ぐための自動保存タイマーを実装してください。

### タイマーベースの自動保存

```c
class MyDataManager
{
    protected const float AUTOSAVE_INTERVAL = 300.0;  // 5分
    protected float m_AutosaveTimer;
    protected bool m_Dirty;  // 最後の保存以降にデータが変更されたか？

    void MarkDirty()
    {
        m_Dirty = true;
    }

    void OnUpdate(float dt)
    {
        m_AutosaveTimer += dt;
        if (m_AutosaveTimer >= AUTOSAVE_INTERVAL)
        {
            m_AutosaveTimer = 0;

            if (m_Dirty)
            {
                Save();
                m_Dirty = false;
            }
        }
    }

    void OnMissionFinish()
    {
        // タイマーが発火していなくても、シャットダウン時に常に保存する
        if (m_Dirty)
        {
            Save();
            m_Dirty = false;
        }
    }
};
```

### ダーティフラグの最適化

データが実際に変更された場合にのみディスクに書き込みます。ファイルI/Oはコストが高いです。何も変更がなければ保存をスキップしてください：

```c
void UpdateSetting(string key, string value)
{
    if (m_Settings.Get(key) == value) return;  // 変更なし、保存なし

    m_Settings.Set(key, value);
    MarkDirty();
}
```

### 重要なイベント時の保存

タイマー保存に加えて、重要な操作後には即座に保存します：

```c
void BanPlayer(string uid, string reason)
{
    m_BanList.Insert(uid);
    Save();  // 即時保存 — BANはクラッシュ後も維持される必要がある
}
```

---

## よくある間違い

### 1. JsonLoadFileが値を返すかのように扱う

```c
// 間違い — コンパイルできません
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, config)) { ... }
```

`JsonLoadFile`は`void`を返します。呼び出してからオブジェクトの状態をチェックしてください。

### 2. 読み込み前にFileExistをチェックしない

```c
// 間違い — クラッシュするか、診断なしで空のオブジェクトを生成する
JsonFileLoader<MyConfig>.JsonLoadFile("$profile:MyMod/Config.json", config);

// 正しい — 先にチェックし、見つからない場合はデフォルトを作成する
if (!FileExist("$profile:MyMod/Config.json"))
{
    SaveDefaults();
    return;
}
JsonFileLoader<MyConfig>.JsonLoadFile("$profile:MyMod/Config.json", config);
```

### 3. ディレクトリの作成を忘れる

ディレクトリが存在しない場合、`JsonSaveFile`はサイレントに失敗します。保存前に常にディレクトリを確認してください。

### 4. シリアライズを意図していないpublicフィールド

設定クラスのすべての`public`フィールドがJSONに含まれます。ランタイム専用のフィールドがある場合は、`protected`または`private`にしてください：

```c
class MyConfig
{
    // これらはJSONに出力される：
    int MaxPlayers = 60;
    string ServerName = "My Server";

    // これはJSONに出力されない（protected）：
    protected bool m_Loaded;
    protected float m_LastSaveTime;
};
```

### 5. JSON値のバックスラッシュとクォート文字

Enforce ScriptのCParserは`\\`と`\"`で問題が発生します。設定にバックスラッシュ付きのファイルパスを保存するのは避けてください。フォワードスラッシュを使用してください：

```c
// 悪い例 — バックスラッシュがパースを壊す可能性がある
string LogPath = "C:\\DayZ\\Logs\\server.log";

// 良い例 — フォワードスラッシュはどこでも動作する
string LogPath = "$profile:MyMod/Logs/server.log";
```

---

## ベストプラクティス

1. **すべてのファイルパスに`$profile:`を使用してください。** 絶対パスをハードコードしないでください。

2. **ファイルを書き込む前にディレクトリを作成してください。** `FileExist()`でチェックし、`MakeDirectory()`で一度に1レベルずつ作成します。

3. **設定クラスのコンストラクタまたはフィールド初期化子に常にデフォルト値を提供してください。** これにより初回実行時の設定が適切になります。

4. **初日から設定をバージョン管理してください。** `ConfigVersion`フィールドの追加はコストがかからず、後で何時間ものデバッグを節約します。

5. **設定データクラスとマネージャークラスを分離してください。** データクラスは単純なコンテナで、マネージャーが読み込み/保存/同期ロジックを処理します。

6. **ダーティフラグ付きの自動保存を使用してください。** 値が変更されるたびにディスクに書き込まないでください --- タイマーで書き込みをバッチ処理します。

7. **ミッション終了時に保存してください。** 自動保存タイマーはセーフティネットであり、主要な保存ではありません。常に`OnMissionFinish()`中に保存してください。

8. **パス定数を一箇所で定義してください。** すべてのパスを持つ`MyModConst`クラスにより文字列の重複を防ぎ、パスの変更を容易にします。

9. **読み込み/保存操作をログに記録してください。** 設定の問題をデバッグする際、「Loaded config v3 from $profile:MyMod/Config.json」というログ行は非常に価値があります。

10. **削除された設定ファイルでテストしてください。** Modは初回実行を適切に処理する必要があります：ディレクトリを作成し、デフォルトを書き込み、何を行ったかをログに記録します。

---

## 互換性と影響

- **マルチMod：** 各Modは独自の`$profile:ModName/`ディレクトリに書き込みます。2つのModが同じディレクトリ名を使用した場合にのみ競合が発生します。Modのフォルダには一意で認識しやすいプレフィックスを使用してください。
- **読み込み順序：** 設定の読み込みは`OnInit`または`OnMissionStart`で行われ、どちらもModのライフサイクルによって制御されます。2つのModが同じファイルを読み書きしようとしない限り（そうすべきではありません）、クロスMod間の読み込み順序の問題はありません。
- **リッスンサーバー：** 設定ファイルはサーバーサイドのみです（`$profile:`はサーバー上で解決されます）。リッスンサーバーでは、クライアントサイドのコードは技術的に`$profile:`にアクセスできますが、曖昧さを避けるために設定はサーバーモジュールのみが読み込むべきです。
- **パフォーマンス：** `JsonFileLoader`は同期的でメインスレッドをブロックします。大きな設定（100KB以上）の場合は、`OnInit`中（ゲームプレイ開始前）に読み込んでください。自動保存タイマーにより繰り返しの書き込みを防ぎ、ダーティフラグパターンによりデータが実際に変更された場合にのみディスクI/Oが発生します。
- **マイグレーション：** 設定クラスに新しいフィールドを追加することは安全です --- `JsonFileLoader`は存在しないJSONキーを無視し、クラスのデフォルト値を維持します。フィールドの削除や名前変更には、サイレントなデータ損失を避けるためにバージョン付きマイグレーションステップが必要です。

---

## 理論と実践

| 教科書的な説明 | DayZの現実 |
|---------------|-------------|
| ブロッキングを避けるために非同期ファイルI/Oを使用する | Enforce Scriptには非同期ファイルI/Oがありません。すべての読み書きは同期的です。起動時に読み込み、タイマーで保存してください。 |
| スキーマでJSONを検証する | JSONスキーマ検証は存在しません。`OnAfterLoad()`内またはロード後のガード句でフィールドを検証してください。 |
| 構造化データにはデータベースを使用する | Enforce Scriptからデータベースにアクセスすることはできません。`$profile:`内のJSONファイルが唯一の永続化メカニズムです。 |

---

[ホーム](../README.md) | [<< 前: RPCパターン](03-rpc-patterns.md) | **設定の永続化** | [次: パーミッションシステム >>](05-permissions.md)
