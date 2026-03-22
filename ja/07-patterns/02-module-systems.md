# 第7.2章: モジュール / プラグインシステム

[ホーム](../README.md) | [<< 前へ: シングルトンパターン](01-singletons.md) | **モジュール / プラグインシステム** | [次へ: RPCパターン >>](03-rpc-patterns.md)

---

## はじめに

すべての本格的なDayZ MODフレームワークは、定義されたライフサイクルフックを持つ自己完結型ユニットにコードを整理するために、モジュールまたはプラグインシステムを使用します。modded ミッションクラス全体に初期化ロジックを散らばらせるのではなく、モジュールは中央マネージャーに自身を登録し、そのマネージャーがライフサイクルイベント --- `OnInit`、`OnMissionStart`、`OnUpdate`、`OnMissionFinish` --- を予測可能な順序で各モジュールにディスパッチします。

この章では、4つの実際のアプローチを検討します: Community Frameworkの `CF_ModuleCore`、VPPの `PluginBase` / `ConfigurablePlugin`、Dabs Frameworkの属性ベースの登録、およびカスタム静的モジュールマネージャーです。それぞれが同じ問題を異なる方法で解決します。4つすべてを理解することで、独自のMODに適切なパターンを選択したり、既存のフレームワークにスムーズに統合したりできるようになります。

---

## 目次

- [なぜモジュールが必要か?](#なぜモジュールが必要か)
- [CF_ModuleCore (COT / Expansion)](#cf_modulecore-cot--expansion)
- [VPP PluginBase / ConfigurablePlugin](#vpp-pluginbase--configurableplugin)
- [Dabs 属性ベースの登録](#dabs-属性ベースの登録)
- [カスタム静的モジュールマネージャー](#カスタム静的モジュールマネージャー)
- [モジュールライフサイクル: ユニバーサルな契約](#モジュールライフサイクル-ユニバーサルな契約)
- [モジュール設計のベストプラクティス](#モジュール設計のベストプラクティス)
- [比較表](#比較表)

---

## なぜモジュールが必要か?

モジュールシステムがなければ、DayZ MODは通常、管理不能になるまで肥大化するモノリシックな modded `MissionServer` または `MissionGameplay` クラスになってしまいます:

```c
// 悪い例: すべてを1つのmoddedクラスに詰め込む
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        InitLootSystem();
        InitVehicleTracker();
        InitBanManager();
        InitWeatherController();
        InitAdminPanel();
        InitKillfeedHUD();
        // ... さらに20以上のシステム
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        TickLootSystem(timeslice);
        TickVehicleTracker(timeslice);
        TickWeatherController(timeslice);
        // ... さらに20以上のティック
    }
};
```

モジュールシステムはこれを単一の安定したフックポイントに置き換えます:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        MyModuleManager.Register(new LootModule());
        MyModuleManager.Register(new VehicleModule());
        MyModuleManager.Register(new WeatherModule());
    }

    override void OnMissionStart()
    {
        super.OnMissionStart();
        MyModuleManager.OnMissionStart();  // すべてのモジュールにディスパッチ
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        MyModuleManager.OnServerUpdate(timeslice);  // すべてのモジュールにディスパッチ
    }
};
```

各モジュールは独自のファイル、独自の状態、独自のライフサイクルフックを持つ独立したクラスです。新しい機能を追加するには、新しいモジュールを追加するだけで済みます --- 3000行のミッションクラスを編集する必要はありません。

---

## CF_ModuleCore (COT / Expansion)

Community Framework (CF) は、DayZ MODエコシステムで最も広く使用されているモジュールシステムを提供します。COTとExpansionの両方がこれをベースに構築されています。

### 仕組み

1. CFのモジュール基底クラスの1つを拡張するモジュールクラスを宣言します
2. `config.cpp` の `CfgPatches` / `CfgMods` に登録します
3. CFの `CF_ModuleCoreManager` が起動時にすべての登録されたモジュールクラスを自動検出してインスタンス化します
4. ライフサイクルイベントが自動的にディスパッチされます

### モジュール基底クラス

CFはDayZのスクリプトレイヤーに対応する3つの基底クラスを提供します:

| 基底クラス | レイヤー | 一般的な用途 |
|-----------|-------|-------------|
| `CF_ModuleGame` | 3_Game | 早期初期化、RPC登録、データクラス |
| `CF_ModuleWorld` | 4_World | エンティティ操作、ゲームプレイシステム |
| `CF_ModuleMission` | 5_Mission | UI、HUD、ミッションレベルのフック |

### 例: CFモジュール

```c
class MyLootModule : CF_ModuleWorld
{
    // CFはモジュールの初期化中にこれを1回呼び出します
    override void OnInit()
    {
        super.OnInit();
        // RPCハンドラを登録、データ構造を割り当て
    }

    // CFはミッション開始時にこれを呼び出します
    override void OnMissionStart(Class sender, CF_EventArgs args)
    {
        super.OnMissionStart(sender, args);
        // 設定を読み込み、初期ルートをスポーン
    }

    // CFはサーバー上でフレームごとにこれを呼び出します
    override void OnUpdate(Class sender, CF_EventArgs args)
    {
        super.OnUpdate(sender, args);
        // ルートリスポーンタイマーをティック
    }

    // CFはミッション終了時にこれを呼び出します
    override void OnMissionFinish(Class sender, CF_EventArgs args)
    {
        super.OnMissionFinish(sender, args);
        // 状態を保存、リソースを解放
    }
};
```

### CFモジュールへのアクセス

```c
// 型による実行中のモジュールへの参照を取得
MyLootModule lootMod;
CF_Modules<MyLootModule>.Get(lootMod);
if (lootMod)
{
    lootMod.ForceRespawn();
}
```

### 主な特徴

- **自動検出**: モジュールは `config.cpp` 宣言に基づいてCFによってインスタンス化されます --- 手動の `new` 呼び出しは不要
- **イベント引数**: ライフサイクルフックはコンテキストデータを含む `CF_EventArgs` を受け取ります
- **CFへの依存**: MODにはCommunity Frameworkが依存として必要
- **広くサポート**: MODの対象サーバーが既にCOTまたはExpansionを実行している場合、CFは既に存在します

---

## VPP PluginBase / ConfigurablePlugin

VPP Admin Toolsは、各管理ツールが中央マネージャーに登録されるプラグインクラスであるプラグインアーキテクチャを使用します。

### Plugin Base

```c
// VPPパターン（簡略化）
class PluginBase : Managed
{
    void OnInit();
    void OnUpdate(float dt);
    void OnDestroy();

    // プラグインのアイデンティティ
    string GetPluginName();
    bool IsServerOnly();
};
```

### ConfigurablePlugin

VPPは設定を自動的に読み込み/保存する設定対応のバリアントでベースを拡張します:

```c
class ConfigurablePlugin : PluginBase
{
    // VPPは初期化時にこれをJSONから自動読み込み
    ref PluginConfigBase m_Config;

    override void OnInit()
    {
        super.OnInit();
        LoadConfig();
    }

    void LoadConfig()
    {
        string path = "$profile:VPPAdminTools/" + GetPluginName() + ".json";
        if (FileExist(path))
        {
            JsonFileLoader<PluginConfigBase>.JsonLoadFile(path, m_Config);
        }
    }

    void SaveConfig()
    {
        string path = "$profile:VPPAdminTools/" + GetPluginName() + ".json";
        JsonFileLoader<PluginConfigBase>.JsonSaveFile(path, m_Config);
    }
};
```

### 登録

VPPは modded `MissionServer.OnInit()` でプラグインを登録します:

```c
// VPPパターン
GetPluginManager().RegisterPlugin(new VPPESPPlugin());
GetPluginManager().RegisterPlugin(new VPPTeleportPlugin());
GetPluginManager().RegisterPlugin(new VPPWeatherPlugin());
```

### 主な特徴

- **手動登録**: 各プラグインは明示的に `new` され、登録されます
- **設定の統合**: `ConfigurablePlugin` は設定管理とモジュールライフサイクルを統合します
- **自己完結型**: CFへの依存なし。VPPのプラグインマネージャーは独自のシステムです
- **明確な所有権**: プラグインマネージャーがすべてのプラグインへの `ref` を保持し、ライフタイムを制御します

---

## Dabs 属性ベースの登録

Dabs Framework (Dabs Framework Admin Toolsで使用) は、より現代的なアプローチを使用します: 自動登録のためのC#スタイルの属性です。

### コンセプト

モジュールを手動で登録する代わりに、クラスに属性を付与すると、フレームワークがリフレクションを使用して起動時にそれを検出します:

```c
// Dabsパターン（概念的）
[CF_RegisterModule(DabsAdminESP)]
class DabsAdminESP : CF_ModuleWorld
{
    override void OnInit()
    {
        super.OnInit();
        // ...
    }
};
```

`CF_RegisterModule` 属性は、CFのモジュールマネージャーにこのクラスを自動的にインスタンス化するよう指示します。手動の `Register()` 呼び出しは不要です。

### 検出の仕組み

起動時に、CFはすべての読み込まれたスクリプトクラスを登録属性でスキャンします。一致するものごとにインスタンスを作成し、モジュールマネージャーに追加します。これはどのモジュールでも `OnInit()` が呼び出される前に行われます。

### 主な特徴

- **ボイラープレートゼロ**: ミッションクラスに登録コードは不要
- **宣言的**: クラス自体がモジュールであることを宣言
- **CFに依存**: Community Frameworkの属性処理でのみ機能
- **発見しやすさ**: コードベースで属性を検索することですべてのモジュールを見つけることができます

---

## カスタム静的モジュールマネージャー

このアプローチは、静的マネージャークラスによる明示的な登録パターンを使用します。マネージャーのインスタンスはありません --- 完全に静的メソッドと静的ストレージです。外部フレームワークへの依存をゼロにしたい場合に便利です。

### モジュール基底クラス

```c
// ベース: ライフサイクルフック
class MyModuleBase : Managed
{
    bool IsServer();       // サブクラスでオーバーライド
    bool IsClient();       // サブクラスでオーバーライド
    string GetModuleName();
    void OnInit();
    void OnMissionStart();
    void OnMissionFinish();
};

// サーバーサイドモジュール: OnUpdate + プレイヤーイベントを追加
class MyServerModule : MyModuleBase
{
    void OnUpdate(float dt);
    void OnPlayerConnect(PlayerIdentity identity);
    void OnPlayerDisconnect(PlayerIdentity identity, string uid);
};

// クライアントサイドモジュール: OnUpdateを追加
class MyClientModule : MyModuleBase
{
    void OnUpdate(float dt);
};
```

### 登録

モジュールは明示的に自身を登録します。通常は modded ミッションクラスから:

```c
// modded MissionServer.OnInit()内:
MyModuleManager.Register(new MyMissionServerModule());
MyModuleManager.Register(new MyAIServerModule());
```

### ライフサイクルディスパッチ

modded ミッションクラスが各ライフサイクルポイントで `MyModuleManager` を呼び出します:

```c
modded class MissionServer
{
    override void OnMissionStart()
    {
        super.OnMissionStart();
        MyModuleManager.OnMissionStart();
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        MyModuleManager.OnServerUpdate(timeslice);
    }

    override void OnMissionFinish()
    {
        MyModuleManager.OnMissionFinish();
        MyModuleManager.Cleanup();
        super.OnMissionFinish();
    }
};
```

### リッスンサーバーの安全性

カスタムモジュールシステムのモジュール基底クラスは重要な不変条件を強制します: `MyServerModule` は `IsServer()` から `true` を返し、`IsClient()` から `false` を返します。`MyClientModule` はその逆です。マネージャーはこれらのフラグを使用して、リッスンサーバー（`MissionServer` と `MissionGameplay` が同じプロセスで実行される）でのライフサイクルイベントの二重ディスパッチを回避します。

ベースの `MyModuleBase` は両方から `true` を返します --- これが、コードベースでそれを直接サブクラス化しないよう警告している理由です。

### 主な特徴

- **依存ゼロ**: CF不要、外部フレームワーク不要
- **静的マネージャー**: `GetInstance()` は不要。純粋な静的API
- **明示的な登録**: 何がいつ登録されるかを完全に制御
- **リッスンサーバー安全**: 型付きサブクラスが二重ディスパッチを防止
- **一元化されたクリーンアップ**: `MyModuleManager.Cleanup()` がすべてのモジュールとコアタイマーを破棄

---

## モジュールライフサイクル: ユニバーサルな契約

実装の違いにもかかわらず、4つのフレームワークすべてが同じライフサイクル契約に従います:

```
┌─────────────────────────────────────────────────────┐
│  登録 / 検出                                         │
│  モジュールインスタンスが作成され、登録される             │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnInit()                                            │
│  1回限りのセットアップ: コレクション割り当て、RPC登録      │
│  登録後にモジュールごとに1回呼び出される                  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnMissionStart()                                    │
│  ミッションが開始: 設定読み込み、タイマー開始、           │
│  イベントへのサブスクライブ、初期エンティティのスポーン     │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnUpdate(float dt)         [フレームごとに繰り返し]     │
│  フレームごとのティック: キュー処理、タイマー更新、        │
│  条件チェック、ステートマシンの進行                       │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnMissionFinish()                                   │
│  破棄: 状態保存、イベントのサブスクライブ解除、           │
│  コレクションのクリア、参照のnull化                      │
└─────────────────────────────────────────────────────┘
```

### ルール

1. **OnInitはOnMissionStartの前に来ます。** `OnInit()` で設定を読み込んだりエンティティをスポーンしたりしないでください --- ワールドがまだ準備できていない可能性があります。
2. **OnUpdateはデルタタイムを受け取ります。** 固定フレームレートを仮定せず、時間ベースのロジックには常に `dt` を使用してください。
3. **OnMissionFinishですべてをクリーンアップする必要があります。** すべての `ref` コレクションをクリアする必要があります。すべてのイベントサブスクリプションを削除する必要があります。すべてのシングルトンを破棄する必要があります。これが唯一の信頼できる破棄ポイントです。
4. **モジュールは互いの初期化順序に依存すべきではありません。** モジュールAがモジュールBを必要とする場合、Bが先に登録されたと仮定するのではなく、遅延アクセス（`GetModule()`）を使用してください。

---

## モジュール設計のベストプラクティス

### 1. 1モジュール、1つの責任

モジュールは正確に1つのドメインを所有すべきです。`VehicleAndWeatherAndLootModule` と書いていることに気づいたら、分割してください。

```c
// 良い例: 焦点を絞ったモジュール
class MyLootModule : MyServerModule { ... }
class MyVehicleModule : MyServerModule { ... }
class MyWeatherModule : MyServerModule { ... }

// 悪い例: 神モジュール
class MyEverythingModule : MyServerModule { ... }
```

### 2. OnUpdateを軽量に保つ

`OnUpdate` はフレームごとに実行されます。モジュールが重い処理（ファイルI/O、ワールドスキャン、パスファインディング）を行う場合、タイマーで実行するか、フレーム間でバッチ処理してください:

```c
class MyCleanupModule : MyServerModule
{
    protected float m_CleanupTimer;
    protected const float CLEANUP_INTERVAL = 300.0;  // 5分ごと

    override void OnUpdate(float dt)
    {
        m_CleanupTimer += dt;
        if (m_CleanupTimer >= CLEANUP_INTERVAL)
        {
            m_CleanupTimer = 0;
            RunCleanup();
        }
    }
};
```

### 3. RPCはOnInitで登録し、OnMissionStartでは登録しない

RPCハンドラはクライアントがメッセージを送信する前に配置されている必要があります。`OnInit()` はモジュール登録中に実行され、ミッションセットアップの早い段階で発生します。`OnMissionStart()` はクライアントが素早く接続した場合に遅すぎる可能性があります。

```c
class MyModule : MyServerModule
{
    override void OnInit()
    {
        super.OnInit();
        MyRPC.Register("MyMod", "RPC_DoThing", this, MyRPCSide.SERVER);
    }

    void RPC_DoThing(PlayerIdentity sender, Object target, ParamsReadContext ctx)
    {
        // RPCを処理
    }
};
```

### 4. クロスモジュールアクセスにはモジュールマネージャーを使用する

他のモジュールへの直接参照を保持しないでください。マネージャーのルックアップを使用してください:

```c
// 良い例: マネージャーを介した疎結合
MyModuleBase mod = MyModuleManager.GetModule("MyAIServerModule");
MyAIServerModule aiMod;
if (Class.CastTo(aiMod, mod))
{
    aiMod.PauseSpawning();
}

// 悪い例: 直接の静的参照は密結合を作る
MyAIServerModule.s_Instance.PauseSpawning();
```

### 5. 依存関係の欠落に対するガード

すべてのサーバーがすべてのMODを実行するわけではありません。モジュールが別のMODとオプションで統合する場合、プリプロセッサチェックを使用してください:

```c
override void OnMissionStart()
{
    super.OnMissionStart();

    #ifdef MYMOD_AI
    MyEventBus.OnMissionStarted.Insert(OnAIMissionStarted);
    #endif
}
```

### 6. モジュールライフサイクルイベントをログに記録する

ログはデバッグを簡単にします。すべてのモジュールは初期化時とシャットダウン時にログを記録すべきです:

```c
override void OnInit()
{
    super.OnInit();
    MyLog.Info("MyModule", "Initialized");
}

override void OnMissionFinish()
{
    MyLog.Info("MyModule", "Shutting down");
    // クリーンアップ...
}
```

---

## 比較表

| 機能 | CF_ModuleCore | VPP Plugin | Dabs Attribute | カスタムモジュール |
|---------|--------------|------------|----------------|---------------|
| **検出** | config.cpp + 自動 | 手動 `Register()` | 属性スキャン | 手動 `Register()` |
| **基底クラス** | Game / World / Mission | PluginBase / ConfigurablePlugin | CF_ModuleWorld + 属性 | ServerModule / ClientModule |
| **依存関係** | CF必須 | 自己完結型 | CF必須 | 自己完結型 |
| **リッスンサーバー安全** | CFが処理 | 手動チェック | CFが処理 | 型付きサブクラス |
| **設定統合** | 別途 | ConfigurablePluginに組み込み | 別途 | MyConfigManager経由 |
| **更新ディスパッチ** | 自動 | マネージャーが `OnUpdate` を呼び出す | 自動 | マネージャーが `OnUpdate` を呼び出す |
| **クリーンアップ** | CFが処理 | 手動 `OnDestroy` | CFが処理 | `MyModuleManager.Cleanup()` |
| **クロスMODアクセス** | `CF_Modules<T>.Get()` | `GetPluginManager().Get()` | `CF_Modules<T>.Get()` | `MyModuleManager.GetModule()` |

MODの依存プロファイルに合ったアプローチを選択してください。既にCFに依存している場合は `CF_ModuleCore` を使用します。外部依存ゼロを望む場合は、カスタムマネージャーまたはVPPパターンに従って独自のシステムを構築してください。

---

## 互換性と影響

- **マルチMOD:** 複数のMODがそれぞれ同じマネージャー（CF、VPP、またはカスタム）に独自のモジュールを登録できます。名前の衝突は、2つのMODが同じクラス型を登録した場合にのみ発生します --- MODタグをプレフィックスとした一意のクラス名を使用してください。
- **読み込み順序:** CFは `config.cpp` からモジュールを自動検出するため、読み込み順序は `requiredAddons` に従います。カスタムマネージャーは `OnInit()` でモジュールを登録し、`modded class` チェーンが順序を決定します。モジュールは登録順序に依存すべきではありません --- 遅延アクセスパターンを使用してください。
- **リッスンサーバー:** リッスンサーバーでは、`MissionServer` と `MissionGameplay` が同じプロセスで実行されます。モジュールマネージャーが両方から `OnUpdate` をディスパッチすると、モジュールは二重ティックを受け取ります。`IsServer()` または `IsClient()` を返す型付きサブクラス（`ServerModule` / `ClientModule`）を使用してこれを防いでください。
- **パフォーマンス:** モジュールディスパッチは、ライフサイクル呼び出しごとに登録されたモジュール1つあたり1回のループ反復を追加します。10〜20モジュールでは無視できます。個々のモジュールの `OnUpdate` メソッドが軽量であることを確認してください（第7.7章参照）。
- **移行:** DayZバージョンをアップグレードする際、基底クラスAPI（`CF_ModuleWorld`、`PluginBase` など）が変更されない限り、モジュールシステムは安定しています。破損を避けるためにCF依存バージョンをピン留めしてください。

---

## よくある間違い

| 間違い | 影響 | 修正 |
|---------|--------|-----|
| モジュールに `OnMissionFinish` クリーンアップがない | コレクション、タイマー、イベントサブスクリプションがミッション再起動を跨いで残り、古いデータやクラッシュを引き起こす | `OnMissionFinish` をオーバーライドし、すべての `ref` コレクションをクリアし、すべてのイベントをサブスクライブ解除 |
| リッスンサーバーでライフサイクルイベントを2回ディスパッチ | サーバーモジュールがクライアントロジックを実行し、その逆も。重複スポーン、二重RPC送信 | `IsServer()` / `IsClient()` ガードまたは分割を強制する型付きモジュールサブクラスを使用 |
| `OnInit` ではなく `OnMissionStart` でRPCを登録 | ミッションセットアップ中に接続するクライアントがハンドラの準備前にRPCを送信できる --- メッセージが静かにドロップされる | 常に `OnInit()` でRPCハンドラを登録（クライアント接続前のモジュール登録中に実行される） |
| すべてを処理する「神モジュール」が1つ | デバッグ、テスト、拡張が不可能。複数の開発者が作業する際のマージ競合 | 単一の責任を持つ焦点を絞ったモジュールに分割 |
| 別のモジュールインスタンスへの直接 `ref` を保持 | 密結合とrefサイクルメモリリークの可能性を作る | クロスモジュールアクセスにはモジュールマネージャーのルックアップ（`GetModule()`、`CF_Modules<T>.Get()`）を使用 |

---

## 理論と実践

| 教科書の記述 | DayZの現実 |
|---------------|-------------|
| モジュール検出はリフレクションによって自動化されるべき | Enforce Scriptのリフレクションは限定的。`config.cpp` ベースの検出（CF）または明示的な `Register()` 呼び出しが唯一の信頼できるアプローチ |
| モジュールは実行時にホットスワップ可能であるべき | DayZはスクリプトのホットリロードをサポートしていない。モジュールはミッションライフサイクル全体にわたって存在 |
| モジュール契約にはインターフェースを使用 | Enforce Scriptには `interface` キーワードがない。代わりに基底クラスの仮想メソッド（`override`）を使用 |
| 依存性注入がモジュールを分離する | DIフレームワークは存在しない。オプションのクロスMOD依存にはマネージャールックアップと `#ifdef` ガードを使用 |

---

[ホーム](../README.md) | [<< 前へ: シングルトンパターン](01-singletons.md) | **モジュール / プラグインシステム** | [次へ: RPCパターン >>](03-rpc-patterns.md)
