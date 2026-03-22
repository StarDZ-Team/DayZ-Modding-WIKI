# Chapter 7.5: パーミッションシステム

[ホーム](../README.md) | [<< 前: 設定の永続化](04-config-persistence.md) | **パーミッションシステム** | [次: イベント駆動アーキテクチャ >>](06-events.md)

---

## はじめに

DayZのすべての管理ツール、すべての特権アクション、すべてのモデレーション機能にはパーミッションシステムが必要です。問題はパーミッションをチェックするかどうかではなく、どのように構造化するかです。DayZ Moddingコミュニティは3つの主要パターンに落ち着きました：階層的なドット区切りパーミッション、ユーザーグループによるロール割り当て（VPP）、フレームワークレベルのロールベースアクセス（CF/COT）です。それぞれ粒度、複雑さ、サーバーオーナーの体験において異なるトレードオフがあります。

この章では3つすべてのパターン、パーミッションチェックフロー、ストレージフォーマット、ワイルドカード/スーパー管理者の処理を解説します。

---

## 目次

- [パーミッションが重要な理由](#why-permissions-matter)
- [階層的ドット区切り（MyModパターン）](#hierarchical-dot-separated-mymod-pattern)
- [VPP UserGroupパターン](#vpp-usergroup-pattern)
- [CFロールベースパターン（COT）](#cf-role-based-pattern-cot)
- [パーミッションチェックフロー](#permission-checking-flow)
- [ストレージフォーマット](#storage-formats)
- [ワイルドカードとスーパー管理者パターン](#wildcard-and-superadmin-patterns)
- [システム間のマイグレーション](#migration-between-systems)
- [ベストプラクティス](#best-practices)

---

## パーミッションが重要な理由

パーミッションシステムがなければ、2つの選択肢しかありません：すべてのプレイヤーがすべてを実行できる（カオス）か、スクリプトにSteam64 IDをハードコードする（メンテナンス不能）かです。パーミッションシステムにより、サーバーオーナーはコードを変更せずに、誰が何をできるかを定義できます。

3つのセキュリティルール：

1. **クライアントを決して信頼しない。** クライアントはリクエストを送信し、サーバーがそれを承認するかどうかを決定します。
2. **デフォルトで拒否。** プレイヤーに明示的にパーミッションが付与されていない場合、そのパーミッションはありません。
3. **クローズドで失敗。** パーミッションチェック自体が失敗した場合（null identity、破損データ）、アクションを拒否します。

---

## 階層的ドット区切り（MyModパターン）

MyModはツリー階層に編成されたドット区切りパーミッション文字列を使用します。各パーミッションは`"MyMod.Admin.Teleport"`や`"MyMod.Missions.Start"`のようなパスです。ワイルドカードによりサブツリー全体を付与できます。

### パーミッションフォーマット

```
MyMod                           (ルート名前空間)
├── Admin                        (管理ツール)
│   ├── Panel                    (管理パネルを開く)
│   ├── Teleport                 (自分/他者をテレポート)
│   ├── Kick                     (プレイヤーをキック)
│   ├── Ban                      (プレイヤーをBAN)
│   └── Weather                  (天気を変更)
├── Missions                     (ミッションシステム)
│   ├── Start                    (ミッションを手動で開始)
│   └── Stop                     (ミッションを停止)
└── AI                           (AIシステム)
    ├── Spawn                    (AIを手動でスポーン)
    └── Config                   (AI設定を編集)
```

### データモデル

各プレイヤー（Steam64 IDで識別）は、付与されたパーミッション文字列の配列を持ちます：

```c
class MyPermissionsData
{
    // キー: Steam64 ID、値: パーミッション文字列の配列
    ref map<string, ref TStringArray> Admins;

    void MyPermissionsData()
    {
        Admins = new map<string, ref TStringArray>();
    }
};
```

### パーミッションチェック

チェックはプレイヤーの付与されたパーミッションを走査し、3つのマッチタイプをサポートします：完全一致、フルワイルドカード（`"*"`）、プレフィックスワイルドカード（`"MyMod.Admin.*"`）：

```c
bool HasPermission(string plainId, string permission)
{
    if (plainId == "" || permission == "")
        return false;

    TStringArray perms;
    if (!m_Permissions.Find(plainId, perms))
        return false;

    for (int i = 0; i < perms.Count(); i++)
    {
        string granted = perms[i];

        // フルワイルドカード：スーパー管理者
        if (granted == "*")
            return true;

        // 完全一致
        if (granted == permission)
            return true;

        // プレフィックスワイルドカード：
        // "MyMod.Admin.*"は"MyMod.Admin.Teleport"にマッチする
        if (granted.IndexOf("*") > 0)
        {
            string prefix = granted.Substring(0, granted.Length() - 1);
            if (permission.IndexOf(prefix) == 0)
                return true;
        }
    }

    return false;
}
```

### JSONストレージ

```json
{
    "Admins": {
        "76561198000000001": ["*"],
        "76561198000000002": ["MyMod.Admin.Panel", "MyMod.Admin.Teleport"],
        "76561198000000003": ["MyMod.Missions.*"],
        "76561198000000004": ["MyMod.Admin.Kick", "MyMod.Admin.Ban"]
    }
}
```

### 長所

- **細粒度：** 各管理者に必要なパーミッションを正確に付与できます
- **階層的：** ワイルドカードにより、すべてのパーミッションをリストせずにサブツリー全体を付与できます
- **自己文書化：** パーミッション文字列が何を制御するかを示します
- **拡張可能：** 新しいパーミッションは新しい文字列 --- スキーマの変更は不要です

### 短所

- **名前付きロールなし：** 10人の管理者に同じセットが必要な場合、10回リストする必要があります
- **文字列ベース：** パーミッション文字列のタイポはサイレントに失敗します（マッチしないだけ）

---

## VPP UserGroupパターン

VPP Admin Toolsはグループベースのシステムを使用します。パーミッションのセットを持つ名前付きグループ（ロール）を定義し、プレイヤーをグループに割り当てます。

### 概念

```
グループ：
  "SuperAdmin"  → [すべてのパーミッション]
  "Moderator"   → [kick, ban, mute, teleport]
  "Builder"     → [spawn objects, teleport, ESP]

プレイヤー：
  "76561198000000001" → "SuperAdmin"
  "76561198000000002" → "Moderator"
  "76561198000000003" → "Builder"
```

### 実装パターン

```c
class VPPUserGroup
{
    string GroupName;
    ref array<string> Permissions;
    ref array<string> Members;  // Steam64 ID

    bool HasPermission(string permission)
    {
        if (!Permissions) return false;

        for (int i = 0; i < Permissions.Count(); i++)
        {
            if (Permissions[i] == permission)
                return true;
            if (Permissions[i] == "*")
                return true;
        }
        return false;
    }
};

class VPPPermissionManager
{
    ref array<ref VPPUserGroup> m_Groups;

    bool PlayerHasPermission(string plainId, string permission)
    {
        for (int i = 0; i < m_Groups.Count(); i++)
        {
            VPPUserGroup group = m_Groups[i];

            // プレイヤーがこのグループに属しているかチェックする
            if (group.Members.Find(plainId) == -1)
                continue;

            if (group.HasPermission(permission))
                return true;
        }
        return false;
    }
};
```

### 長所

- **ロールベース：** ロールを1回定義し、多くのプレイヤーに割り当てられます
- **馴染みやすい：** サーバーオーナーは他のゲームからグループ/ロールシステムを理解しています
- **一括変更が簡単：** グループのパーミッションを変更すると、すべてのメンバーが更新されます

### 短所

- **追加作業なしでは粒度が低い：** 特定の管理者に1つの追加パーミッションを与えるには、新しいグループを作成するかプレイヤーごとのオーバーライドを追加する必要があります
- **グループの継承が複雑：** VPPはネイティブにグループ階層（例：「Admin」が「Moderator」のすべてのパーミッションを継承）をサポートしていません

---

## CFロールベースパターン（COT）

Community Framework / COTは、明示的なパーミッションセットでロールが定義され、プレイヤーがロールに割り当てられるロールとパーミッションシステムを使用します。

### 概念

CFのパーミッションシステムはVPPのグループに似ていますが、フレームワーク層に統合されており、すべてのCFベースのModで利用可能です：

```c
// COTパターン（簡略化）
// ロールはAuthFile.jsonで定義される
// 各ロールには名前とパーミッションの配列がある
// プレイヤーはSteam64 IDでロールに割り当てられる

class CF_Permission
{
    string m_Name;
    ref array<ref CF_Permission> m_Children;
    int m_State;  // ALLOW, DENY, INHERIT
};
```

### パーミッションツリー

CFはパーミッションをツリー構造として表現し、各ノードは明示的に許可、拒否、または親から継承できます：

```
Root
├── Admin [ALLOW]
│   ├── Kick [INHERIT → ALLOW]
│   ├── Ban [INHERIT → ALLOW]
│   └── Teleport [DENY]        ← AdminがALLOWでも明示的に拒否
└── ESP [ALLOW]
```

この3状態システム（allow/deny/inherit）は、MyModやVPPで使用されるバイナリ（granted/not-granted）システムよりも表現力があります。広いカテゴリを付与してから例外を作ることができます。

### JSONストレージ

```json
{
    "Roles": {
        "Moderator": {
            "admin": {
                "kick": 2,
                "ban": 2,
                "teleport": 1
            }
        }
    },
    "Players": {
        "76561198000000001": {
            "Role": "SuperAdmin"
        }
    }
}
```

（`2 = ALLOW`、`1 = DENY`、`0 = INHERIT`）

### 長所

- **3状態パーミッション：** allow、deny、inheritにより最大の柔軟性を提供
- **ツリー構造：** パーミッションパスの階層的な性質を反映
- **フレームワークレベル：** すべてのCF Modが同じパーミッションシステムを共有

### 短所

- **複雑さ：** 3状態はシンプルな「付与済み」よりもサーバーオーナーにとって理解が難しい
- **CF依存：** Community Frameworkでのみ動作

---

## パーミッションチェックフロー

どのシステムを使用するかに関わらず、サーバーサイドのパーミッションチェックは同じパターンに従います：

```
クライアントがRPCリクエストを送信
        │
        ▼
サーバーRPCハンドラが受信
        │
        ▼
    ┌─────────────────────────────────┐
    │ 送信者のidentityがnon-nullか？    │
    │ （ネットワークレベルの検証）        │
    └───────────┬─────────────────────┘
                │ いいえ → return（サイレントにドロップ）
                │ はい ▼
    ┌─────────────────────────────────┐
    │ 送信者にこのアクションに必要な      │
    │ パーミッションがあるか？            │
    └───────────┬─────────────────────┘
                │ いいえ → 警告をログ、オプションでクライアントにエラーを送信、return
                │ はい ▼
    ┌─────────────────────────────────┐
    │ リクエストデータを検証              │
    │ （パラメータを読み取り、境界をチェック）│
    └───────────┬─────────────────────┘
                │ 無効 → クライアントにエラーを送信、return
                │ 有効 ▼
    ┌─────────────────────────────────┐
    │ 特権アクションを実行               │
    │ 管理者IDでアクションをログ          │
    │ 成功レスポンスを送信               │
    └─────────────────────────────────┘
```

### 実装

```c
void OnRPC_KickPlayer(PlayerIdentity sender, Object target, ParamsReadContext ctx)
{
    // ステップ1：送信者を検証する
    if (!sender) return;

    // ステップ2：パーミッションをチェックする
    if (!MyPermissions.GetInstance().HasPermission(sender.GetPlainId(), "MyMod.Admin.Kick"))
    {
        MyLog.Warning("Admin", "Unauthorized kick attempt: " + sender.GetName());
        return;
    }

    // ステップ3：データを読み取り検証する
    string targetUid;
    if (!ctx.Read(targetUid)) return;

    if (targetUid == sender.GetPlainId())
    {
        // 自分自身をキックすることはできない
        SendError(sender, "Cannot kick yourself");
        return;
    }

    // ステップ4：実行する
    PlayerIdentity targetIdentity = FindPlayerByUid(targetUid);
    if (!targetIdentity)
    {
        SendError(sender, "Player not found");
        return;
    }

    GetGame().DisconnectPlayer(targetIdentity);

    // ステップ5：ログとレスポンス
    MyLog.Info("Admin", sender.GetName() + " kicked " + targetIdentity.GetName());
    SendSuccess(sender, "Player kicked");
}
```

---

## ストレージフォーマット

3つすべてのシステムがJSONでパーミッションを保存します。違いは構造的なものです：

### フラットなプレイヤーごと

```json
{
    "Admins": {
        "STEAM64_ID": ["perm.a", "perm.b", "perm.c"]
    }
}
```

**ファイル：** すべてのプレイヤーで1つのファイル。
**長所：** シンプルで、手動編集が容易。
**短所：** 多くのプレイヤーが同じパーミッションを共有している場合は冗長。

### プレイヤーごとのファイル（Expansion / プレイヤーデータ）

```json
// ファイル: $profile:MyMod/Players/76561198xxxxx.json
{
    "UID": "76561198xxxxx",
    "Permissions": ["perm.a", "perm.b"],
    "LastLogin": "2025-01-15 14:30:00"
}
```

**長所：** 各プレイヤーが独立。ロッキングの問題なし。
**短所：** 多くの小さなファイル。「パーミッションXを持つのは誰か？」の検索にはすべてのファイルのスキャンが必要。

### グループベース（VPP）

```json
{
    "Groups": [
        {
            "GroupName": "RoleName",
            "Permissions": ["perm.a", "perm.b"],
            "Members": ["STEAM64_ID_1", "STEAM64_ID_2"]
        }
    ]
}
```

**長所：** ロールの変更がすべてのメンバーに即座に反映。
**短所：** 専用グループなしではプレイヤーごとのパーミッションオーバーライドが困難。

### フォーマットの選択

| 要因 | フラットなプレイヤーごと | プレイヤーごとのファイル | グループベース |
|--------|----------------|-----------------|-------------|
| **小規模サーバー（管理者1-5人）** | 最適 | 過剰 | 過剰 |
| **中規模サーバー（管理者5-20人）** | 良い | 良い | 最適 |
| **大規模コミュニティ（20以上のロール）** | 冗長 | ファイルが増加 | 最適 |
| **プレイヤーごとのカスタマイズ** | ネイティブ | ネイティブ | 回避策が必要 |
| **手動編集** | 容易 | プレイヤーごとに容易 | 中程度 |

---

## ワイルドカードとスーパー管理者パターン

```mermaid
graph TD
    ROOT["*  (superadmin)"] --> A["MyMod.*"]
    A --> B["MyMod.Admin.*"]
    B --> C["MyMod.Admin.Kick"]
    B --> D["MyMod.Admin.Ban"]
    B --> E["MyMod.Admin.Teleport"]
    A --> F["MyMod.Player.*"]
    F --> G["MyMod.Player.Shop"]
    F --> H["MyMod.Player.Trade"]

    style ROOT fill:#ff4444,color:#fff
    style A fill:#ff8844,color:#fff
    style B fill:#ffaa44,color:#fff
```

### フルワイルドカード：`"*"`

すべてのパーミッションを付与します。これはスーパー管理者パターンです。`"*"`を持つプレイヤーは何でもできます。

```c
if (granted == "*")
    return true;
```

**慣例：** DayZ Moddingコミュニティのすべてのパーミッションシステムはスーパー管理者に`"*"`を使用します。異なる慣例を発明しないでください。

### プレフィックスワイルドカード：`"MyMod.Admin.*"`

`"MyMod.Admin."`で始まるすべてのパーミッションを付与します。これにより、すべてのパーミッションをリストせずにサブシステム全体を付与できます：

```c
// "MyMod.Admin.*"がマッチするもの：
//   "MyMod.Admin.Teleport"  マッチ
//   "MyMod.Admin.Kick"      マッチ
//   "MyMod.Admin.Ban"       マッチ
//   "MyMod.Missions.Start"  不一致（異なるサブツリー）
```

### 実装

```c
if (granted.IndexOf("*") > 0)
{
    // "MyMod.Admin.*" → prefix = "MyMod.Admin."
    string prefix = granted.Substring(0, granted.Length() - 1);
    if (permission.IndexOf(prefix) == 0)
        return true;
}
```

### ネガティブパーミッションなし（ドット区切り / VPP）

ドット区切りシステムとVPPの両方は加算のみのパーミッションを使用します。パーミッションを付与できますが、明示的に拒否することはできません。パーミッションがプレイヤーのリストにない場合、拒否されます。

CF/COTはその3状態システム（ALLOW/DENY/INHERIT）による例外で、明示的な拒否をサポートします。

### スーパー管理者エスケープハッチ

特定のパーミッションをチェックせずにスーパー管理者かどうかを確認する方法を提供してください。これはバイパスロジックに便利です：

```c
bool IsSuperAdmin(string plainId)
{
    return HasPermission(plainId, "*");
}
```

---

## システム間のマイグレーション

Modが1つのパーミッションシステムから別のシステムへのサーバーマイグレーションをサポートする必要がある場合（例：フラットな管理者UIDリストから階層的パーミッションへ）、読み込み時に自動マイグレーションを実装してください：

```c
void Load()
{
    if (!FileExist(PERMISSIONS_FILE))
    {
        CreateDefaultFile();
        return;
    }

    // まず新しいフォーマットを試す
    if (LoadNewFormat())
        return;

    // レガシーフォーマットにフォールバックしてマイグレーションする
    LoadLegacyAndMigrate();
}

void LoadLegacyAndMigrate()
{
    // 古いフォーマットを読み取る: { "AdminUIDs": ["uid1", "uid2"] }
    LegacyPermissionData legacyData = new LegacyPermissionData();
    JsonFileLoader<LegacyPermissionData>.JsonLoadFile(PERMISSIONS_FILE, legacyData);

    // マイグレーション：各レガシー管理者を新システムのスーパー管理者にする
    for (int i = 0; i < legacyData.AdminUIDs.Count(); i++)
    {
        string uid = legacyData.AdminUIDs[i];
        GrantPermission(uid, "*");
    }

    // 新しいフォーマットで保存する
    Save();
    MyLog.Info("Permissions", "Migrated " + legacyData.AdminUIDs.Count().ToString()
        + " admin(s) from legacy format");
}
```

これは元のフラットな`AdminUIDs`配列から階層的な`Admins`マップにマイグレーションするために使用される一般的なパターンです。

---

## ベストプラクティス

1. **デフォルトで拒否。** パーミッションが明示的に付与されていない場合、答えは「いいえ」です。

2. **サーバーでチェックし、クライアントではチェックしない。** クライアントサイドのパーミッションチェックはUI上の利便性（ボタンの非表示）のみです。サーバーは常に再検証する必要があります。

3. **スーパー管理者には`"*"`を使用する。** これは普遍的な慣例です。`"all"`、`"admin"`、`"root"`を発明しないでください。

4. **拒否されたすべての特権アクションをログに記録する。** これはセキュリティ監査証跡です。

5. **プレースホルダー付きのデフォルトパーミッションファイルを提供する。** 新しいサーバーオーナーには明確な例が見えるべきです：

```json
{
    "Admins": {
        "PUT_STEAM64_ID_HERE": ["*"]
    }
}
```

6. **パーミッションに名前空間を付ける。** 他のModとの衝突を避けるために`"YourMod.Category.Action"`を使用してください。

7. **プレフィックスワイルドカードをサポートする。** サーバーオーナーは各管理者パーミッションを個別にリストするのではなく`"YourMod.Admin.*"`を付与できるべきです。

8. **パーミッションファイルを人間が編集可能に保つ。** サーバーオーナーは手動で編集します。明確なキー名、JSON内で1行ごとに1パーミッション、Modのドキュメントのどこかに利用可能なパーミッションを記載してください。

9. **初日からマイグレーションを実装する。** パーミッションフォーマットが変更されたとき（そしてそうなります）、自動マイグレーションがサポートチケットを防ぎます。

10. **接続時にパーミッションをクライアントに同期する。** クライアントはUI目的（管理ボタンの表示/非表示）のために自分のパーミッションを知る必要があります。接続時にサマリーを送信し、サーバー全体のパーミッションファイルを送信しないでください。

---

## 互換性と影響

- **マルチMod：** 各Modは独自のパーミッション名前空間を定義できます（`"ModA.Admin.Kick"`、`"ModB.Build.Spawn"`）。`"*"`ワイルドカードは同じパーミッションストアを共有する*すべての*Modでスーパー管理者を付与します。Modが独立したパーミッションファイルを使用する場合、`"*"`はそのModのスコープ内のみで適用されます。
- **読み込み順序：** パーミッションファイルはサーバー起動中に1回読み込まれます。各Modが独自のファイルを読む限り、クロスMod間の順序問題はありません。共有フレームワーク（CF/COT）がパーミッションを管理している場合、そのフレームワークを使用するすべてのModが同じパーミッションツリーを共有します。
- **リッスンサーバー：** パーミッションチェックは常にサーバーサイドで実行すべきです。リッスンサーバーでは、クライアントサイドのコードがUIゲーティング（管理ボタンの表示/非表示）のために`HasPermission()`を呼び出すことがありますが、サーバーサイドのチェックが権威あるものです。
- **パフォーマンス：** パーミッションチェックはプレイヤーごとの文字列配列の線形スキャンです。一般的な管理者数（1〜20人の管理者、各5〜30のパーミッション）では無視できます。非常に大きなパーミッションセットの場合、O(1)ルックアップのために配列の代わりに`set<string>`を検討してください。
- **マイグレーション：** 新しいパーミッション文字列の追加は非破壊的です --- 既存の管理者は付与されるまで新しいパーミッションを持ちません。パーミッションの名前変更は既存の付与をサイレントに壊します。名前変更されたパーミッション文字列を自動マイグレーションするために設定のバージョニングを使用してください。

---

## よくある間違い

| ミス | 影響 | 修正 |
|---------|--------|-----|
| クライアントが送信したパーミッションデータを信頼する | 悪用されたクライアントが「私は管理者です」を送信し、サーバーがそれを信じる。サーバーの完全な侵害 | RPCペイロードからパーミッションを読み取らない。常にサーバーサイドのパーミッションストアで`sender.GetPlainId()`をルックアップする |
| デフォルト拒否の欠如 | パーミッションチェックの欠落がすべての人にアクセスを付与する。意図しない権限昇格 | 特権アクションのすべてのRPCハンドラが`HasPermission()`をチェックし、失敗時に早期リターンする必要がある |
| パーミッション文字列のタイポがサイレントに失敗する | `"MyMod.Amin.Kick"`（タイポ）は決してマッチしない --- 管理者がキックできず、エラーもログされない | パーミッション文字列を`static const`変数として定義する。生の文字列リテラルではなく定数を参照する |
| フルパーミッションファイルをクライアントに送信する | すべての管理者のSteam64 IDとそのパーミッションセットが接続されたすべてのクライアントに公開される | 要求しているプレイヤー自身のパーミッションリストのみを送信し、フルサーバーファイルは送信しない |
| HasPermissionにワイルドカードサポートがない | サーバーオーナーが管理者ごとにすべてのパーミッションをリストする必要がある。面倒でエラーが発生しやすい | プレフィックスワイルドカード（`"MyMod.Admin.*"`）とフルワイルドカード（`"*"`）を初日から実装する |

---

## 理論と実践

| 教科書的な説明 | DayZの現実 |
|---------------|-------------|
| グループ継承付きのRBAC（ロールベースアクセス制御）を使用する | 3状態パーミッションをサポートするのはCF/COTのみ。ほとんどのModはシンプルさのためにフラットなプレイヤーごとの付与を使用する |
| パーミッションはデータベースに保存すべき | データベースアクセスなし。`$profile:`内のJSONファイルが唯一のオプション |
| 認可に暗号トークンを使用する | Enforce Scriptには暗号ライブラリがない。信頼はエンジンによって検証される`PlayerIdentity.GetPlainId()`（Steam64 ID）に基づく |

---

[ホーム](../README.md) | [<< 前: 設定の永続化](04-config-persistence.md) | **パーミッションシステム** | [次: イベント駆動アーキテクチャ >>](06-events.md)
