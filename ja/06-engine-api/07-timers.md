# 第6.7章: タイマーとCallQueue

[ホーム](../../README.md) | [<< 前へ: 通知](06-notifications.md) | **タイマーとCallQueue** | [次へ: ファイルI/OとJSON >>](08-file-io.md)

---

## はじめに

DayZは遅延呼び出しおよび繰り返し関数呼び出しのためのいくつかのメカニズムを提供しています：`ScriptCallQueue`（主要なシステム）、`Timer`、`ScriptInvoker`、`WidgetFadeTimer`です。これらは、メインスレッドをブロックせずに遅延ロジックのスケジューリング、更新ループの作成、タイマーイベントの管理に不可欠です。この章では、各メカニズムの完全なAPIシグネチャと使用パターンをカバーします。

---

## コールカテゴリ

すべてのタイマーとコールキューシステムは、フレーム内での遅延呼び出しの実行タイミングを決定する**コールカテゴリ**を必要とします：

```c
const int CALL_CATEGORY_SYSTEM   = 0;   // システムレベルの操作
const int CALL_CATEGORY_GUI      = 1;   // UI更新
const int CALL_CATEGORY_GAMEPLAY = 2;   // ゲームプレイロジック
const int CALL_CATEGORY_COUNT    = 3;   // カテゴリの総数
```

カテゴリのキューにアクセスする方法：

```c
ScriptCallQueue  queue   = GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY);
ScriptInvoker    updater = GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY);
TimerQueue       timers  = GetGame().GetTimerQueue(CALL_CATEGORY_GAMEPLAY);
```

---

## ScriptCallQueue

**ファイル:** `3_Game/tools/utilityclasses.c`

遅延関数呼び出しの主要なメカニズムです。ワンショット遅延、繰り返し呼び出し、即時次フレーム実行をサポートしています。

### CallLater

```c
void CallLater(func fn, int delay = 0, bool repeat = false,
               void param1 = NULL, void param2 = NULL,
               void param3 = NULL, void param4 = NULL);
```

| パラメータ | 説明 |
|-----------|-------------|
| `fn` | 呼び出す関数（メソッド参照: `this.MyMethod`） |
| `delay` | ミリ秒単位の遅延（0 = 次のフレーム） |
| `repeat` | `true` = `delay`間隔で繰り返し呼び出し; `false` = 1回だけ呼び出し |
| `param1..4` | 関数に渡されるオプションパラメータ |

**例 --- ワンショット遅延：**

```c
// 5秒後にMyFunctionを1回呼び出す
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.MyFunction, 5000, false);
```

**例 --- 繰り返し呼び出し：**

```c
// 1秒ごとにUpdateLoopを繰り返し呼び出す
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.UpdateLoop, 1000, true);
```

**例 --- パラメータ付き：**

```c
void ShowMessage(string text, int color)
{
    Print(text);
}

// 2秒後にパラメータ付きで呼び出す
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(
    this.ShowMessage, 2000, false, "Hello!", ARGB(255, 255, 0, 0)
);
```

### Call

```c
void Call(func fn, void param1 = NULL, void param2 = NULL,
          void param3 = NULL, void param4 = NULL);
```

次のフレームで関数を実行します（delay = 0、繰り返しなし）。`CallLater(fn, 0, false)`の省略形です。

**例：**

```c
// 次のフレームで実行
GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM).Call(this.Initialize);
```

### CallByName

```c
void CallByName(Class obj, string fnName, int delay = 0, bool repeat = false,
                Param par = null);
```

文字列名でメソッドを呼び出します。メソッド参照が直接利用できない場合に便利です。

**例：**

```c
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallByName(
    myObject, "OnTimerExpired", 3000, false
);
```

### Remove

```c
void Remove(func fn);
```

スケジュールされた呼び出しを削除します。繰り返し呼び出しの停止や、破棄されたオブジェクトでの呼び出しを防ぐために不可欠です。

**例：**

```c
// 繰り返し呼び出しを停止する
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).Remove(this.UpdateLoop);
```

### RemoveByName

```c
void RemoveByName(Class obj, string fnName);
```

`CallByName`でスケジュールされた呼び出しを削除します。

### Tick

```c
void Tick(float timeslice);
```

エンジンによって各フレームで内部的に呼び出されます。手動で呼び出す必要はありません。

---

## Timer

**ファイル:** `3_Game/tools/utilityclasses.c`

明示的なスタート/ストップのライフサイクルを持つクラスベースのタイマーです。一時停止や再開が必要な長期間のタイマーに最適です。

### コンストラクタ

```c
void Timer(int category = CALL_CATEGORY_SYSTEM);
```

### Run

```c
void Run(float duration, Class obj, string fn_name, Param params = null, bool loop = false);
```

| パラメータ | 説明 |
|-----------|-------------|
| `duration` | 秒単位の時間（ミリ秒ではありません！） |
| `obj` | メソッドが呼び出されるオブジェクト |
| `fn_name` | 文字列としてのメソッド名 |
| `params` | パラメータを持つオプションの`Param`オブジェクト |
| `loop` | `true` = 各duration後に繰り返し |

**例 --- ワンショットタイマー：**

```c
ref Timer m_Timer;

void StartTimer()
{
    m_Timer = new Timer(CALL_CATEGORY_GAMEPLAY);
    m_Timer.Run(5.0, this, "OnTimerComplete", null, false);
}

void OnTimerComplete()
{
    Print("Timer finished!");
}
```

**例 --- 繰り返しタイマー：**

```c
ref Timer m_UpdateTimer;

void StartUpdateLoop()
{
    m_UpdateTimer = new Timer(CALL_CATEGORY_GAMEPLAY);
    m_UpdateTimer.Run(1.0, this, "OnUpdate", null, true);  // 1秒ごと
}

void StopUpdateLoop()
{
    if (m_UpdateTimer && m_UpdateTimer.IsRunning())
        m_UpdateTimer.Stop();
}
```

### Stop

```c
void Stop();
```

タイマーを停止します。別の`Run()`呼び出しで再開できます。

### IsRunning

```c
bool IsRunning();
```

タイマーが現在アクティブな場合に`true`を返します。

### Pause

```c
void Pause();
```

実行中のタイマーを一時停止し、残り時間を保持します。`Continue()`で再開できます。

### Continue

```c
void Continue();
```

一時停止されたタイマーを中断した場所から再開します。

### IsPaused

```c
bool IsPaused();
```

タイマーが現在一時停止中の場合に`true`を返します。

**例 --- 一時停止と再開：**

```c
ref Timer m_Timer;

void StartTimer()
{
    m_Timer = new Timer(CALL_CATEGORY_GAMEPLAY);
    m_Timer.Run(10.0, this, "OnTimerComplete", null, false);
}

void TogglePause()
{
    if (m_Timer.IsPaused())
        m_Timer.Continue();
    else
        m_Timer.Pause();
}
```

### GetRemaining

```c
float GetRemaining();
```

秒単位の残り時間を返します。

### GetDuration

```c
float GetDuration();
```

`Run()`で設定された総時間を返します。

---

## ScriptInvoker

**ファイル:** `3_Game/tools/utilityclasses.c`

イベント/デリゲートシステムです。`ScriptInvoker`はコールバック関数のリストを保持し、`Invoke()`が呼び出されるとすべてを実行します。これはDayZにおけるC#イベントやオブザーバーパターンに相当するものです。

### Insert

```c
void Insert(func fn);
```

コールバック関数を登録します。

### Remove

```c
void Remove(func fn);
```

コールバック関数の登録を解除します。

### Invoke

```c
void Invoke(void param1 = NULL, void param2 = NULL,
            void param3 = NULL, void param4 = NULL);
```

提供されたパラメータで登録されたすべての関数を呼び出します。

### Count

```c
int Count();
```

登録されたコールバックの数です。

### Clear

```c
void Clear();
```

登録されたすべてのコールバックを削除します。

**例 --- カスタムイベントシステム：**

```c
class MyModule
{
    ref ScriptInvoker m_OnMissionComplete = new ScriptInvoker();

    void CompleteMission()
    {
        // 完了ロジックを実行...

        // すべてのリスナーに通知
        m_OnMissionComplete.Invoke("MissionAlpha", 1500);
    }
}

class MyUI
{
    void Init(MyModule module)
    {
        // イベントをサブスクライブ
        module.m_OnMissionComplete.Insert(this.OnMissionComplete);
    }

    void OnMissionComplete(string name, int reward)
    {
        Print(string.Format("Mission %1 complete! Reward: %2", name, reward));
    }

    void Cleanup(MyModule module)
    {
        // ダングリング参照を防ぐため、常にサブスクライブを解除する
        module.m_OnMissionComplete.Remove(this.OnMissionComplete);
    }
}
```

### Update Queue

エンジンはフレームごとの`ScriptInvoker`キューを提供します：

```c
ScriptInvoker updater = GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY);
updater.Insert(this.OnFrame);

// 完了したら削除
updater.Remove(this.OnFrame);
```

更新キューに登録された関数は、パラメータなしで毎フレーム呼び出されます。これは`EntityEvent.FRAME`を使用せずにフレームごとのロジックに便利です。

---

## WidgetFadeTimer

**ファイル:** `3_Game/tools/utilityclasses.c`

ウィジェットのフェードイン/フェードアウト用の特殊なタイマーです。

```c
class WidgetFadeTimer
{
    void FadeIn(Widget w, float time, bool continue_from_current = false);
    void FadeOut(Widget w, float time, bool continue_from_current = false);
    bool IsFading();
    void Stop();
}
```

| パラメータ | 説明 |
|-----------|-------------|
| `w` | フェードするウィジェット |
| `time` | フェードの持続時間（秒） |
| `continue_from_current` | `true`の場合、現在のアルファから開始。それ以外の場合は0（フェードイン）または1（フェードアウト）から開始 |

**例：**

```c
ref WidgetFadeTimer m_FadeTimer;
Widget m_NotificationPanel;

void ShowNotification()
{
    m_NotificationPanel.Show(true);
    m_FadeTimer = new WidgetFadeTimer;
    m_FadeTimer.FadeIn(m_NotificationPanel, 0.3);

    // 5秒後に自動的に非表示
    GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(this.HideNotification, 5000, false);
}

void HideNotification()
{
    m_FadeTimer.FadeOut(m_NotificationPanel, 0.5);
}
```

---

## GetRemainingTime（CallQueue）

`ScriptCallQueue`は、スケジュールされた`CallLater`の残り時間を照会する方法も提供しています：

```c
float GetRemainingTime(Class obj, string fnName);
```

**例：**

```c
// CallLaterの残り時間を取得
float remaining = GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).GetRemainingTime(this, "MyCallback");
if (remaining > 0)
    Print(string.Format("Callback fires in %1 ms", remaining));
```

---

## 一般的なパターン

### タイマーアキュムレータ（スロットリングされたOnUpdate）

フレームごとのコールバックがあるが、より遅いレートでロジックを実行したい場合：

```c
class MyModule
{
    protected float m_UpdateAccumulator;
    protected const float UPDATE_INTERVAL = 2.0;  // 2秒ごと

    void OnUpdate(float timeslice)
    {
        m_UpdateAccumulator += timeslice;
        if (m_UpdateAccumulator < UPDATE_INTERVAL)
            return;
        m_UpdateAccumulator = 0;

        // スロットリングされたロジックをここに
        DoPeriodicWork();
    }
}
```

### クリーンアップパターン

クラッシュを防ぐために、オブジェクトが破棄される時に常にスケジュールされた呼び出しを削除してください：

```c
class MyManager
{
    void MyManager()
    {
        GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.Tick, 1000, true);
    }

    void ~MyManager()
    {
        GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).Remove(this.Tick);
    }

    void Tick()
    {
        // 定期的な作業
    }
}
```

### ワンショット遅延初期化

ワールドが完全に読み込まれた後にシステムを初期化するための一般的なパターンです：

```c
void OnMissionStart()
{
    // すべてが読み込まれたことを確認するために、初期化を1秒遅延
    GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(this.DelayedInit, 1000, false);
}

void DelayedInit()
{
    // ワールドオブジェクトに安全にアクセスできるようになりました
}
```

---

## まとめ

| メカニズム | 使用ケース | 時間単位 |
|-----------|----------|-----------|
| `CallLater` | ワンショットまたは繰り返しの遅延呼び出し | ミリ秒 |
| `Call` | 次のフレームで実行 | N/A（即時） |
| `Timer` | スタート/ストップ/残り時間を持つクラスベースのタイマー | 秒 |
| `ScriptInvoker` | イベント/デリゲート（オブザーバーパターン） | N/A（手動Invoke） |
| `WidgetFadeTimer` | ウィジェットのフェードイン/フェードアウト | 秒 |
| `GetUpdateQueue()` | フレームごとのコールバック登録 | N/A（毎フレーム） |

| 概念 | キーポイント |
|---------|-----------|
| カテゴリ | `CALL_CATEGORY_SYSTEM` (0)、`GUI` (1)、`GAMEPLAY` (2) |
| 呼び出しの削除 | ダングリング参照を防ぐため、常にデストラクタで`Remove()`を行う |
| Timer vs CallLater | Timerは秒＋クラスベース; CallLaterはミリ秒＋関数型 |
| ScriptInvoker | コールバックをInsert/Remove、Invokeですべて発火 |

---

## ベストプラクティス

- **デストラクタでスケジュールされた`CallLater`呼び出しを常に`Remove()`してください。** 所有オブジェクトが`CallLater`がまだ保留中の間に破棄されると、エンジンは削除されたオブジェクトのメソッドを呼び出してクラッシュします。すべての`CallLater`にはデストラクタで対応する`Remove()`が必要です。
- **一時停止/再開が必要な長期間のタイマーには`Timer`（秒）を、ファイア・アンド・フォーゲットの遅延には`CallLater`（ミリ秒）を使用してください。** これらを混同すると、`Timer.Run()`は秒を使用しますが`CallLater`はミリ秒を使用するため、1000倍のタイミングバグにつながります。
- **繰り返しの`CallLater`を登録する代わりに、タイマーアキュムレータで`OnUpdate`をスロットリングしてください。** repeatの`CallLater`はキューに別の追跡エントリを作成しますが、アキュムレータパターン（`m_Acc += timeslice; if (m_Acc >= INTERVAL)`）はオーバーヘッドがゼロで、チューニングが容易です。
- **リスナーが破棄される前に`ScriptInvoker`コールバックのサブスクライブを解除してください。** `ScriptInvoker`で`Remove()`の呼び出しを忘れると、`Invoke()`が発火した時にクラッシュするダングリング関数参照が残ります。
- **`ScriptCallQueue`の`Tick()`を手動で呼び出さないでください。** エンジンが各フレームで自動的に呼び出します。手動呼び出しはすべての保留中のコールバックを二重に発火させます。

---

## 互換性と影響

> **Modの互換性:** タイマーシステムはインスタンスごとであるため、Modがタイマーで直接競合することはほとんどありません。リスクは、複数のModがコールバックを登録する共有`ScriptInvoker`イベントにあります。

- **読み込み順序:** タイマーとCallQueueシステムは読み込み順序に依存しません。各Modが独自のタイマーを管理します。
- **modded classの競合:** 直接的な競合はありませんが、2つのModが同じクラス（例：`MissionServer`）の`OnUpdate()`をオーバーライドし、一方が`super`を忘れると、もう一方のアキュムレータベースのタイマーが停止します。
- **パフォーマンスへの影響:** `repeat = true`のアクティブな各`CallLater`は毎フレームチェックされます。数百の繰り返し呼び出しはサーバーのティックレートを低下させます。より長い間隔のタイマーを少なくするか、`OnUpdate`でアキュムレータパターンを使用してください。
- **サーバー/クライアント:** `CallLater`と`Timer`は両側で動作します。ゲームロジックには`CALL_CATEGORY_GAMEPLAY`、UI更新には`CALL_CATEGORY_GUI`（クライアントのみ）、低レベル操作には`CALL_CATEGORY_SYSTEM`を使用してください。

---

## 実際のModで確認されたパターン

> これらのパターンはプロのDayZ Modのソースコードを調査して確認されました。

| パターン | Mod | ファイル/場所 |
|---------|-----|---------------|
| すべての`CallLater`登録に対するデストラクタでの`Remove()`クリーンアップ | COT | モジュールマネージャーのライフサイクル |
| クロスモジュール通知用の`ScriptInvoker`イベントバス | Expansion | `ExpansionEventBus` |
| ログアウトカウントダウンでの`Pause()`/`Continue()`を持つ`Timer` | バニラ | `MissionServer`のログアウトシステム |
| 5秒周期チェック用の`OnUpdate`でのアキュムレータパターン | Dabs Framework | モジュールティックスケジューリング |

---

[<< 前へ: 通知](06-notifications.md) | **タイマーとCallQueue** | [次へ: ファイルI/OとJSON >>](08-file-io.md)
