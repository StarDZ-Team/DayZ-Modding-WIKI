# 第6.6章: 通知システム

[ホーム](../README.md) | [<< 前へ: ポストプロセスエフェクト](05-ppe.md) | **通知** | [次へ: タイマーと CallQueue >>](07-timers.md)

---

## はじめに

DayZ には、プレイヤーにトースト形式のポップアップメッセージを表示するビルトインの通知システムが含まれています。`NotificationSystem` クラスは、ローカル（クライアントサイド）とサーバーからクライアントへの RPC の両方で通知を送信するための静的メソッドを提供します。この章では、通知の送信、カスタマイズ、管理の完全な API を解説します。

---

## NotificationSystem

**ファイル:** `3_Game/client/notifications/notificationsystem.c`（320行）

通知キューを管理する静的クラスです。通知は画面上部に小さなポップアップカードとして表示され、縦に積み重なり、表示時間が経過するとフェードアウトします。

### 定数

```c
const int   DEFAULT_TIME_DISPLAYED = 10;    // デフォルト表示時間（秒）
const float NOTIFICATION_FADE_TIME = 3.0;   // フェードアウト時間（秒）
static const int MAX_NOTIFICATIONS = 5;     // 最大表示通知数
```

---

## サーバーからクライアントへの通知

これらのメソッドはサーバーで呼び出されます。ターゲットプレイヤーのクライアントに RPC を送信し、ローカルで通知を表示します。

### SendNotificationToPlayerExtended

```c
static void SendNotificationToPlayerExtended(
    Man player,            // ターゲットプレイヤー（Man または PlayerBase）
    float show_time,       // 表示時間（秒）
    string title_text,     // 通知タイトル
    string detail_text = "",  // オプションの本文テキスト
    string icon = ""       // オプションのアイコンパス（例: "set:dayz_gui image:icon_info"）
);
```

**例 --- 特定のプレイヤーに通知する:**

```c
void NotifyPlayer(PlayerBase player, string message)
{
    if (!GetGame().IsServer())
        return;

    NotificationSystem.SendNotificationToPlayerExtended(
        player,
        8.0,                   // 8秒間表示
        "Server Notice",       // タイトル
        message,               // 本文
        ""                     // デフォルトアイコン
    );
}
```

### SendNotificationToPlayerIdentityExtended

```c
static void SendNotificationToPlayerIdentityExtended(
    PlayerIdentity player,   // ターゲット ID（null = 全プレイヤーにブロードキャスト）
    float show_time,
    string title_text,
    string detail_text = "",
    string icon = ""
);
```

**例 --- 全プレイヤーにブロードキャストする:**

```c
void BroadcastNotification(string title, string message)
{
    if (!GetGame().IsServer())
        return;

    NotificationSystem.SendNotificationToPlayerIdentityExtended(
        null,                  // null = 接続中の全プレイヤー
        10.0,                  // 10秒間表示
        title,
        message,
        ""
    );
}
```

### SendNotificationToPlayer（型付き）

```c
static void SendNotificationToPlayer(
    Man player,
    NotificationType type,    // 定義済み通知タイプ
    float show_time,
    string detail_text = ""
);
```

このバリアントは、ビルトインのタイトルとアイコンにマッピングされた定義済みの `NotificationType` 列挙値を使用します。`detail_text` は本文として追加されます。

---

## クライアントサイド（ローカル）通知

これらのメソッドはローカルクライアントにのみ通知を表示します。ネットワーキングは関与しません。

### AddNotificationExtended

```c
static void AddNotificationExtended(
    float show_time,
    string title_text,
    string detail_text = "",
    string icon = ""
);
```

**例 --- クライアントでのローカル通知:**

```c
void ShowLocalNotification(string title, string body)
{
    if (!GetGame().IsClient())
        return;

    NotificationSystem.AddNotificationExtended(
        5.0,
        title,
        body,
        "set:dayz_gui image:icon_info"
    );
}
```

### AddNotification（型付き）

```c
static void AddNotification(
    NotificationType type,
    float show_time,
    string detail_text = ""
);
```

タイトルとアイコンに定義済みの `NotificationType` を使用します。

---

## NotificationType 列挙

バニラゲームでは、関連するタイトルとアイコンを持つ通知タイプが定義されています。一般的な値は以下の通りです。

| タイプ | 説明 |
|------|-------------|
| `NotificationType.GENERIC` | 汎用通知 |
| `NotificationType.FRIENDLY_FIRE` | フレンドリーファイア警告 |
| `NotificationType.JOIN` | プレイヤー参加 |
| `NotificationType.LEAVE` | プレイヤー退出 |
| `NotificationType.STATUS` | ステータス更新 |

> **注意:** 利用可能なタイプはゲームバージョンによって異なります。最大限の柔軟性を得るには、カスタムのタイトルとアイコン文字列を受け付ける `Extended` バリアントを使用してください。

---

## アイコンパス

アイコンは DayZ イメージセット構文を使用します。

```
"set:dayz_gui image:icon_name"
```

一般的なアイコン名:

| アイコン | セットパス |
|------|----------|
| 情報 | `"set:dayz_gui image:icon_info"` |
| 警告 | `"set:dayz_gui image:icon_warning"` |
| ドクロ | `"set:dayz_gui image:icon_skull"` |

`.edds` 画像ファイルへの直接パスを渡すこともできます。

```c
"MyMod/GUI/notification_icon.edds"
```

アイコンなしの場合は空文字列 `""` を渡します。

---

## イベント

`NotificationSystem` は通知ライフサイクルに反応するためのスクリプトインボーカーを公開しています。

```c
ref ScriptInvoker m_OnNotificationAdded;
ref ScriptInvoker m_OnNotificationRemoved;
```

**例 --- 通知に反応する:**

```c
void Init()
{
    NotificationSystem notifSys = GetNotificationSystem();
    if (notifSys)
    {
        notifSys.m_OnNotificationAdded.Insert(OnNotifAdded);
        notifSys.m_OnNotificationRemoved.Insert(OnNotifRemoved);
    }
}

void OnNotifAdded()
{
    Print("A notification was added");
}

void OnNotifRemoved()
{
    Print("A notification was removed");
}
```

---

## 更新ループ

通知システムはフェードイン/フェードアウトアニメーションと期限切れ通知の削除を処理するために、毎フレームティックする必要があります。

```c
static void Update(float timeslice);
```

これはバニラミッションの `OnUpdate` メソッドによって自動的に呼び出されます。完全にカスタムのミッションを作成する場合は、必ず呼び出してください。

---

## サーバーからクライアントへの完全な例

サーバーコードから通知を送信する典型的な Mod パターンです。

```c
// サーバーサイド: ミッションイベントハンドラーまたはモジュール内
class MyServerModule
{
    void OnMissionStarted(string missionName, vector location)
    {
        if (!GetGame().IsServer())
            return;

        // 全プレイヤーにブロードキャスト
        string title = "Mission Started!";
        string body = string.Format("Go to %1!", missionName);

        NotificationSystem.SendNotificationToPlayerIdentityExtended(
            null,
            12.0,
            title,
            body,
            "set:dayz_gui image:icon_info"
        );
    }

    void OnPlayerEnteredZone(PlayerBase player, string zoneName)
    {
        if (!GetGame().IsServer())
            return;

        // このプレイヤーにのみ通知
        NotificationSystem.SendNotificationToPlayerExtended(
            player,
            5.0,
            "Zone Entered",
            string.Format("You have entered %1", zoneName),
            ""
        );
    }
}
```

---

## CommunityFramework（CF）の代替手段

CommunityFramework を使用している場合、独自の通知 API が提供されています。

```c
// CF 通知（内部的に別の RPC を使用）
NotificationSystem.Create(
    new StringLocaliser("Title"),
    new StringLocaliser("Body with param: %1", someValue),
    "set:dayz_gui image:icon_info",
    COLOR_GREEN,
    5,
    player.GetIdentity()
);
```

CF の API はカラーとローカライズのサポートを追加します。どちらのシステムを使用するかは、Mod スタックの要件に応じて決定してください --- 機能的には類似していますが、内部的に異なる RPC を使用します。

---

## まとめ

| 概念 | 要点 |
|---------|-----------|
| サーバーからプレイヤーへ | `SendNotificationToPlayerExtended(player, time, title, text, icon)` |
| サーバーから全員へ | `SendNotificationToPlayerIdentityExtended(null, time, title, text, icon)` |
| クライアントローカル | `AddNotificationExtended(time, title, text, icon)` |
| 型付き | `SendNotificationToPlayer(player, NotificationType, time, text)` |
| 最大表示数 | 5つの通知がスタック |
| デフォルト時間 | 10秒表示、3秒フェード |
| アイコン | `"set:dayz_gui image:icon_name"` または直接 `.edds` パス |
| イベント | `m_OnNotificationAdded`, `m_OnNotificationRemoved` |

---

## ベストプラクティス

- **カスタム通知には `Extended` バリアントを使用してください。** `SendNotificationToPlayerExtended` はタイトル、本文、アイコンを完全に制御できます。型付きの `NotificationType` バリアントはバニラのプリセットに限定されます。
- **5つの通知スタック制限を尊重してください。** 短時間に多くの通知を送信すると、プレイヤーが読む前に古い通知が画面から押し出されます。関連するメッセージをまとめるか、より長い表示時間を使用してください。
- **サーバー通知は必ず `GetGame().IsServer()` でガードしてください。** クライアントで `SendNotificationToPlayerExtended` を呼び出しても効果がなく、メソッド呼び出しの無駄になります。
- **真のブロードキャストには ID として `null` を渡してください。** `SendNotificationToPlayerIdentityExtended(null, ...)` は接続中の全プレイヤーに配信します。同じメッセージを送信するためにプレイヤーを手動でループしないでください。
- **通知テキストは簡潔に保ってください。** トーストポップアップの表示幅は限られています。長いタイトルや本文はクリップされます。タイトルは30文字以下、本文は80文字以下を目安にしてください。

---

## 互換性と影響

- **マルチ Mod:** バニラの `NotificationSystem` はすべての Mod で共有されます。複数の Mod が同時に通知を送信すると、5つの通知スタックがオーバーフローする可能性があります。CF は、バニラ通知と競合しない別の通知チャネルを提供します。
- **パフォーマンス:** 通知は軽量です（通知ごとに1つの RPC）。ただし、数秒ごとに全プレイヤーにブロードキャストすると、60人以上のプレイヤーがいるサーバーでは測定可能なネットワークトラフィックが発生します。
- **サーバー/クライアント:** `SendNotificationToPlayer*` メソッドはサーバーからクライアントへの RPC です。`AddNotificationExtended` はクライアントのみ（ローカル）です。`Update()` ティックはクライアントミッションループで実行されます。

---

[<< 前へ: ポストプロセスエフェクト](05-ppe.md) | **通知** | [次へ: タイマーと CallQueue >>](07-timers.md)
