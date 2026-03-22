# Chapter 7.6: イベント駆動アーキテクチャ

[ホーム](../README.md) | [<< 前: パーミッションシステム](05-permissions.md) | **イベント駆動アーキテクチャ** | [次: パフォーマンス最適化 >>](07-performance.md)

---

## はじめに

イベント駆動アーキテクチャは、イベントの発生元とその消費者を分離します。プレイヤーが接続したとき、接続ハンドラはキルフィード、管理パネル、ミッションシステム、ログモジュールについて知る必要はありません --- 「プレイヤーが接続した」イベントを発火し、関心のある各システムが独立してサブスクライブします。これが拡張可能なMod設計の基盤です：新機能はイベントを発火するコードを変更することなく、既存のイベントにサブスクライブします。

DayZは組み込みのイベントプリミティブとして`ScriptInvoker`を提供しています。プロフェッショナルなModでは、その上に名前付きトピック、型付きハンドラ、ライフサイクル管理を備えたイベントバスを構築しています。この章では3つの主要パターンすべてと、メモリリーク防止の重要な規律を解説します。

---

## 目次

- [ScriptInvokerパターン](#scriptinvoker-pattern)
- [EventBusパターン（文字列ルーティングトピック）](#eventbus-pattern-string-routed-topics)
- [CF_EventHandlerパターン](#cf_eventhandler-pattern)
- [イベントとダイレクトコールの使い分け](#when-to-use-events-vs-direct-calls)
- [メモリリーク防止](#memory-leak-prevention)
- [上級編：カスタムイベントデータ](#advanced-custom-event-data)
- [ベストプラクティス](#best-practices)

---

## ScriptInvokerパターン

`ScriptInvoker`はエンジン組み込みのpub/subプリミティブです。関数コールバックのリストを保持し、イベントが発火するとすべてを呼び出します。これはDayZにおける最も低レベルのイベントメカニズムです。

### イベントの作成

```c
class WeatherManager
{
    // イベント。天気が変わったときに通知を受けるために誰でもサブスクライブできます。
    ref ScriptInvoker OnWeatherChanged = new ScriptInvoker();

    protected string m_CurrentWeather;

    void SetWeather(string newWeather)
    {
        m_CurrentWeather = newWeather;

        // イベントを発火 — すべてのサブスクライバーに通知される
        OnWeatherChanged.Invoke(newWeather);
    }
};
```

### イベントへのサブスクライブ

```c
class WeatherUI
{
    void Init(WeatherManager mgr)
    {
        // サブスクライブ：天気が変わったらハンドラを呼び出す
        mgr.OnWeatherChanged.Insert(OnWeatherChanged);
    }

    void OnWeatherChanged(string newWeather)
    {
        // UIを更新する
        m_WeatherLabel.SetText("Weather: " + newWeather);
    }

    void Cleanup(WeatherManager mgr)
    {
        // 重要：完了したらサブスクライブを解除する
        mgr.OnWeatherChanged.Remove(OnWeatherChanged);
    }
};
```

### ScriptInvoker API

| メソッド | 説明 |
|--------|-------------|
| `Insert(func)` | サブスクライバーリストにコールバックを追加する |
| `Remove(func)` | 特定のコールバックを削除する |
| `Invoke(...)` | 指定された引数ですべてのサブスクライブ済みコールバックを呼び出す |
| `Clear()` | すべてのサブスクライバーを削除する |

### Insert/Removeの動作

```mermaid
graph TB
    PUB["Publisher<br/>(e.g., ConfigManager)"]

    PUB -->|"Invoke()"| INV["ScriptInvoker<br/>OnConfigChanged"]

    INV -->|"callback"| SUB1["Subscriber A<br/>AdminPanel.OnConfigChanged()"]
    INV -->|"callback"| SUB2["Subscriber B<br/>HUD.OnConfigChanged()"]
    INV -->|"callback"| SUB3["Subscriber C<br/>Logger.OnConfigChanged()"]

    SUB1 -.->|"Insert()"| INV
    SUB2 -.->|"Insert()"| INV
    SUB3 -.->|"Insert()"| INV

    style PUB fill:#D94A4A,color:#fff
    style INV fill:#FFD700,color:#000
    style SUB1 fill:#4A90D9,color:#fff
    style SUB2 fill:#4A90D9,color:#fff
    style SUB3 fill:#4A90D9,color:#fff
```

`Insert`は内部リストに関数リファレンスを追加します。`Remove`はリストを検索し一致するエントリを削除します。同じ関数で`Insert`を2回呼び出すと、`Invoke`ごとに2回呼び出されます。`Remove`を1回呼び出すと1つのエントリが削除されます。

```c
// 同じハンドラを2回サブスクライブするのはバグです：
mgr.OnWeatherChanged.Insert(OnWeatherChanged);
mgr.OnWeatherChanged.Insert(OnWeatherChanged);  // Invokeごとに2回呼び出される

// 1回のRemoveは1つのエントリのみを削除します：
mgr.OnWeatherChanged.Remove(OnWeatherChanged);
// まだInvokeごとに1回呼び出される — 2回目のInsertがまだ残っている
```

### 型付きシグネチャ

`ScriptInvoker`はコンパイル時にパラメータ型を強制しません。期待されるシグネチャをコメントに記述するのが慣例です：

```c
// シグネチャ: void(string weatherName, float temperature)
ref ScriptInvoker OnWeatherChanged = new ScriptInvoker();
```

サブスクライバーのシグネチャが間違っている場合、ランタイムの動作は未定義です --- クラッシュしたり、ガーベジ値を受け取ったり、サイレントに何もしなかったりする可能性があります。常にドキュメントに記載されたシグネチャを正確に一致させてください。

### バニラクラスのScriptInvoker

多くのバニラDayZクラスは`ScriptInvoker`イベントを公開しています：

```c
// UIScriptedMenuにはOnVisibilityChangedがあります
class UIScriptedMenu
{
    ref ScriptInvoker m_OnVisibilityChanged;
};

// MissionBaseにはイベントフックがあります
class MissionBase
{
    void OnUpdate(float timeslice);
    void OnEvent(EventType eventTypeId, Param params);
};
```

moddedクラスからこれらのバニライベントにサブスクライブして、エンジンレベルの状態変更に反応できます。

---

## EventBusパターン（文字列ルーティングトピック）

`ScriptInvoker`は単一のイベントチャンネルです。EventBusは名前付きチャンネルのコレクションであり、任意のモジュールがトピック名でイベントをパブリッシュまたはサブスクライブできる中央ハブを提供します。

### カスタムEventBusパターン

このパターンでは、EventBusをよく知られたイベント用の名前付き`ScriptInvoker`フィールドを持つ静的クラスとして実装し、さらにアドホックなトピック用の汎用`OnCustomEvent`チャンネルを提供します：

```c
class MyEventBus
{
    // よく知られたライフサイクルイベント
    static ref ScriptInvoker OnPlayerConnected;      // void(PlayerIdentity)
    static ref ScriptInvoker OnPlayerDisconnected;    // void(PlayerIdentity)
    static ref ScriptInvoker OnPlayerReady;           // void(PlayerBase, PlayerIdentity)
    static ref ScriptInvoker OnConfigChanged;         // void(string modId, string field, string value)
    static ref ScriptInvoker OnAdminPanelToggled;     // void(bool opened)
    static ref ScriptInvoker OnMissionStarted;        // void(MyInstance)
    static ref ScriptInvoker OnMissionCompleted;      // void(MyInstance, int reason)
    static ref ScriptInvoker OnAdminDataSynced;       // void()

    // 汎用カスタムイベントチャンネル
    static ref ScriptInvoker OnCustomEvent;           // void(string eventName, Param params)

    static void Init() { ... }   // すべてのinvokerを作成する
    static void Cleanup() { ... } // すべてのinvokerをnullにする

    // カスタムイベントを発火するヘルパー
    static void Fire(string eventName, Param params)
    {
        if (!OnCustomEvent) Init();
        OnCustomEvent.Invoke(eventName, params);
    }
};
```

### EventBusへのサブスクライブ

```c
class MyMissionModule : MyServerModule
{
    override void OnInit()
    {
        super.OnInit();

        // プレイヤーライフサイクルにサブスクライブする
        MyEventBus.OnPlayerConnected.Insert(OnPlayerJoined);
        MyEventBus.OnPlayerDisconnected.Insert(OnPlayerLeft);

        // 設定変更にサブスクライブする
        MyEventBus.OnConfigChanged.Insert(OnConfigChanged);
    }

    override void OnMissionFinish()
    {
        // シャットダウン時に常にサブスクライブを解除する
        MyEventBus.OnPlayerConnected.Remove(OnPlayerJoined);
        MyEventBus.OnPlayerDisconnected.Remove(OnPlayerLeft);
        MyEventBus.OnConfigChanged.Remove(OnConfigChanged);
    }

    void OnPlayerJoined(PlayerIdentity identity)
    {
        MyLog.Info("Missions", "Player joined: " + identity.GetName());
    }

    void OnPlayerLeft(PlayerIdentity identity)
    {
        MyLog.Info("Missions", "Player left: " + identity.GetName());
    }

    void OnConfigChanged(string modId, string field, string value)
    {
        if (modId == "MyMod_Missions")
        {
            // 設定を再読み込みする
            ReloadSettings();
        }
    }
};
```

### 名前付きフィールドとカスタムイベントの使い分け

| アプローチ | 使用する場合 |
|----------|----------|
| 名前付き`ScriptInvoker`フィールド | イベントがよく知られており、頻繁に使用され、安定したシグネチャを持つ場合 |
| `OnCustomEvent` + 文字列名 | イベントがMod固有、実験的、または単一のサブスクライバーのみが使用する場合 |

名前付きフィールドは慣例により型安全であり、クラスを読むことで発見可能です。カスタムイベントは柔軟ですが、文字列マッチングとキャストが必要です。

---

## CF_EventHandlerパターン

Community Frameworkは、型安全なイベント引数を持つより構造化されたイベントシステムとして`CF_EventHandler`を提供しています。

### 概念

```c
// CFイベントハンドラパターン（簡略化）：
class CF_EventArgs
{
    // すべてのイベント引数の基底クラス
};

class CF_EventPlayerArgs : CF_EventArgs
{
    PlayerIdentity Identity;
    PlayerBase Player;
};

// モジュールがイベントハンドラメソッドをオーバーライドする：
class MyModule : CF_ModuleWorld
{
    override void OnEvent(Class sender, CF_EventArgs args)
    {
        // 汎用イベントを処理する
    }

    override void OnClientReady(Class sender, CF_EventArgs args)
    {
        // クライアントの準備完了、UIを作成できる
    }
};
```

### ScriptInvokerとの主な違い

| 機能 | ScriptInvoker | CF_EventHandler |
|---------|--------------|-----------------|
| **型安全性** | 慣例のみ | 型付きEventArgsクラス |
| **発見方法** | コメントを読む | 名前付きメソッドをオーバーライドする |
| **サブスクリプション** | `Insert()` / `Remove()` | 仮想メソッドのオーバーライド |
| **カスタムデータ** | Paramラッパー | カスタムEventArgsサブクラス |
| **クリーンアップ** | 手動`Remove()` | 自動（メソッドオーバーライド、登録不要） |

CFのアプローチは手動でのサブスクライブとサブスクライブ解除の必要性を排除します --- ハンドラメソッドをオーバーライドするだけです。これにより、`Remove()`の呼び忘れというバグのクラス全体が排除されますが、CFに依存するというコストがかかります。

---

## イベントとダイレクトコールの使い分け

### イベントを使う場合：

1. **複数の独立した消費者**が同じ発生に反応する必要がある場合。プレイヤーが接続した？キルフィード、管理パネル、ミッションシステム、ログがすべて関心を持ちます。

2. **発生元が消費者を知るべきではない場合。** 接続ハンドラはキルフィードモジュールをインポートすべきではありません。

3. **消費者のセットがランタイムで変化する場合。** モジュールは動的にサブスクライブおよびサブスクライブ解除できます。

4. **クロスMod通信。** Mod Aがイベントを発火し、Mod Bがそれにサブスクライブします。どちらも相手をインポートしません。

### ダイレクトコールを使う場合：

1. **消費者が正確に1つ**であり、コンパイル時に既知の場合。ダメージ計算に関心があるのがヘルスシステムだけなら、直接呼び出してください。

2. **戻り値が必要な場合。** イベントはファイア・アンド・フォーゲットです。応答が必要な場合（「このアクションは許可されるべきか？」）、直接メソッド呼び出しを使用してください。

3. **順序が重要な場合。** イベントサブスクライバーはInsert順に呼び出されますが、この順序に依存するのは脆弱です。ステップBがステップAの後に発生しなければならない場合、AとBを明示的に呼び出してください。

4. **パフォーマンスが重要な場合。** イベントにはオーバーヘッド（サブスクライバーリストの反復、リフレクション経由の呼び出し）があります。フレームごと、エンティティごとのロジックでは、ダイレクトコールの方が高速です。

---

## メモリリーク防止

Enforce Scriptにおけるイベント駆動アーキテクチャの最も危険な側面は**サブスクライバーリーク**です。オブジェクトがイベントにサブスクライブし、サブスクライブを解除せずに破棄された場合、2つのことが起こります：

1. **オブジェクトが`Managed`を拡張している場合：** invoker内の弱参照は自動的にnullになります。invokerはnull関数を呼び出します --- 何も起きませんが、デッドエントリの反復でサイクルがムダになります。

2. **オブジェクトが`Managed`を拡張していない場合：** invokerはダングリング関数ポインタを保持します。イベントが発火すると、解放されたメモリに呼び出します。**クラッシュ。**

### ゴールデンルール

**すべての`Insert()`には対応する`Remove()`が必要です。** 例外はありません。

### パターン：OnInitでサブスクライブ、OnMissionFinishでサブスクライブ解除

```c
class MyModule : MyServerModule
{
    override void OnInit()
    {
        super.OnInit();
        MyEventBus.OnPlayerConnected.Insert(HandlePlayerConnect);
    }

    override void OnMissionFinish()
    {
        MyEventBus.OnPlayerConnected.Remove(HandlePlayerConnect);
        // 次にsuperを呼び出すか、他のクリーンアップを行う
    }

    void HandlePlayerConnect(PlayerIdentity identity) { ... }
};
```

### パターン：コンストラクタでサブスクライブ、デストラクタでサブスクライブ解除

明確な所有権ライフサイクルを持つオブジェクトの場合：

```c
class PlayerTracker : Managed
{
    void PlayerTracker()
    {
        MyEventBus.OnPlayerConnected.Insert(OnPlayerConnected);
        MyEventBus.OnPlayerDisconnected.Insert(OnPlayerDisconnected);
    }

    void ~PlayerTracker()
    {
        if (MyEventBus.OnPlayerConnected)
            MyEventBus.OnPlayerConnected.Remove(OnPlayerConnected);
        if (MyEventBus.OnPlayerDisconnected)
            MyEventBus.OnPlayerDisconnected.Remove(OnPlayerDisconnected);
    }

    void OnPlayerConnected(PlayerIdentity identity) { ... }
    void OnPlayerDisconnected(PlayerIdentity identity) { ... }
};
```

**デストラクタでのnullチェックに注目してください。** シャットダウン中、`MyEventBus.Cleanup()`がすでに実行され、すべてのinvokerを`null`に設定している可能性があります。`null`のinvokerで`Remove()`を呼び出すとクラッシュします。

### アンチパターン：匿名関数

```c
// 悪い例：匿名関数はRemoveできません
MyEventBus.OnPlayerConnected.Insert(function(PlayerIdentity id) {
    Print("Connected: " + id.GetName());
});
// これをどうRemoveしますか？参照できません。
```

常に名前付きメソッドを使用して、後でサブスクライブを解除できるようにしてください。

---

## 上級編：カスタムイベントデータ

複雑なペイロードを運ぶイベントの場合、`Param`ラッパーを使用します：

### Paramクラス

DayZは型付きデータをラップするための`Param1<T>`から`Param4<T1, T2, T3, T4>`を提供しています：

```c
// 構造化データでの発火：
Param2<string, int> data = new Param2<string, int>("AK74", 5);
MyEventBus.Fire("ItemSpawned", data);

// 受信：
void OnCustomEvent(string eventName, Param params)
{
    if (eventName == "ItemSpawned")
    {
        Param2<string, int> data;
        if (Class.CastTo(data, params))
        {
            string className = data.param1;
            int quantity = data.param2;
        }
    }
}
```

### カスタムイベントデータクラス

多くのフィールドを持つイベントには、専用のデータクラスを作成します：

```c
class KillEventData : Managed
{
    string KillerName;
    string VictimName;
    string WeaponName;
    float Distance;
    vector KillerPos;
    vector VictimPos;
};

// 発火：
KillEventData killData = new KillEventData();
killData.KillerName = killer.GetIdentity().GetName();
killData.VictimName = victim.GetIdentity().GetName();
killData.WeaponName = weapon.GetType();
killData.Distance = vector.Distance(killer.GetPosition(), victim.GetPosition());
OnKillEvent.Invoke(killData);
```

---

## ベストプラクティス

1. **すべての`Insert()`には対応する`Remove()`が必要です。** コードを監査してください：すべての`Insert`呼び出しを検索し、クリーンアップパスに対応する`Remove`があることを確認してください。

2. **デストラクタで`Remove()`の前にinvokerのnullチェックをしてください。** シャットダウン中、EventBusがすでにクリーンアップされている可能性があります。

3. **イベントシグネチャをドキュメントに記載してください。** すべての`ScriptInvoker`宣言の上に、期待されるコールバックシグネチャのコメントを書いてください：
   ```c
   // シグネチャ: void(PlayerBase player, float damage, string source)
   static ref ScriptInvoker OnPlayerDamaged;
   ```

4. **サブスクライバーの実行順序に依存しないでください。** 順序が重要な場合は、代わりにダイレクトコールを使用してください。

5. **イベントハンドラを高速に保ってください。** ハンドラがコストの高い作業を行う必要がある場合、他のすべてのサブスクライバーをブロックするのではなく、次のティックにスケジュールしてください。

6. **安定したAPIには名前付きイベントを、実験には汎用カスタムイベントを使用してください。** 名前付き`ScriptInvoker`フィールドは発見可能でドキュメント化されています。文字列ルーティングのカスタムイベントは柔軟ですが見つけにくいです。

7. **EventBusを早期に初期化してください。** イベントは`OnMissionStart()`の前に発火する可能性があります。`OnInit()`中に`Init()`を呼び出すか、遅延パターン（`Insert`の前に`null`をチェック）を使用してください。

8. **ミッション終了時にEventBusをクリーンアップしてください。** すべてのinvokerをnullにして、ミッション再起動間のステイル参照を防いでください。

9. **匿名関数をイベントサブスクライバーとして使用しないでください。** サブスクライブを解除できません。

10. **ポーリングよりイベントを使用してください。** 毎フレーム「設定が変更されたか？」をチェックする代わりに、`OnConfigChanged`にサブスクライブして発火時にのみ反応してください。

---

## 互換性と影響

- **マルチMod：** 複数のModが競合なく同じEventBusトピックにサブスクライブできます。各サブスクライバーは独立して呼び出されます。ただし、1つのサブスクライバーが回復不能なエラー（null参照など）をスローした場合、そのinvokerの後続のサブスクライバーが実行されない可能性があります。
- **読み込み順序：** サブスクリプション順序が`Invoke()`での呼び出し順序と等しくなります。先に読み込まれたModが先に登録され、先にイベントを受け取ります。この順序に依存しないでください --- 実行順序が重要な場合は、代わりにダイレクトコールを使用してください。
- **リッスンサーバー：** リッスンサーバーでは、サーバーサイドのコードから発火されたイベントは、同じ静的`ScriptInvoker`を共有している場合、クライアントサイドのサブスクライバーにも見えます。サーバー専用とクライアント専用のイベントには別々のEventBusフィールドを使用するか、ハンドラを`GetGame().IsServer()` / `GetGame().IsClient()`でガードしてください。
- **パフォーマンス：** `ScriptInvoker.Invoke()`はすべてのサブスクライバーを線形に反復します。イベントあたり5〜15のサブスクライバーでは無視できます。エンティティごとのサブスクライブ（100以上のエンティティがそれぞれ同じイベントにサブスクライブ）は避けてください --- 代わりにマネージャーパターンを使用してください。
- **マイグレーション：** `ScriptInvoker`はDayZのバージョン間で変更される可能性が低い安定したバニラAPIです。カスタムEventBusラッパーはあなたのコードであり、Modとともに移行します。

---

## よくある間違い

| ミス | 影響 | 修正 |
|---------|--------|-----|
| `Insert()`でサブスクライブしたが`Remove()`を呼び出さない | メモリリーク：invokerがデッドオブジェクトへの参照を保持。`Invoke()`時に解放されたメモリに呼び出す（クラッシュ）またはムダな反復でノーオペ | すべての`Insert()`に`OnMissionFinish`またはデストラクタでの`Remove()`をペアにする |
| シャットダウン中にnullのEventBus invokerで`Remove()`を呼び出す | `MyEventBus.Cleanup()`がすでにinvokerをnullにしている可能性がある。nullで`.Remove()`を呼び出すとクラッシュ | `Remove()`の前に常にinvokerのnullチェック：`if (MyEventBus.OnPlayerConnected) MyEventBus.OnPlayerConnected.Remove(handler);` |
| 同じハンドラの二重`Insert()` | `Invoke()`ごとにハンドラが2回呼び出される。1回の`Remove()`は1つのエントリのみ削除し、ステイルサブスクリプションが残る | Insert前にチェックするか、`Insert()`が1回のみ呼び出されることを確認する（例：ガードフラグ付きの`OnInit`で） |
| 匿名/ラムダ関数をハンドラとして使用する | `Remove()`に渡すリファレンスがないため削除できない | 常に名前付きメソッドをイベントハンドラとして使用する |
| 不一致の引数シグネチャでイベントを発火する | サブスクライバーがガーベジデータを受信するかランタイムでクラッシュ。コンパイル時チェックなし | すべての`ScriptInvoker`宣言の上に期待されるシグネチャをドキュメント化し、すべてのハンドラで正確に一致させる |

---

[ホーム](../README.md) | [<< 前: パーミッションシステム](05-permissions.md) | **イベント駆動アーキテクチャ** | [次: パフォーマンス最適化 >>](07-performance.md)
