# チャプター 8.4: チャットコマンドの追加

[ホーム](../../README.md) | [<< 前へ: 管理パネルの構築](03-admin-panel.md) | **チャットコマンドの追加** | [次へ: DayZ Modテンプレートの使用 >>](05-mod-template.md)

---

> **概要:** このチュートリアルでは、DayZ用のチャットコマンドシステムの作成方法を解説します。チャット入力へのフック、コマンドプレフィックスと引数の解析、管理者権限の確認、サーバーサイドアクションの実行、プレイヤーへのフィードバック送信を行います。最終的に、管理者のキャラクターを完全回復する `/heal` コマンドと、さらにコマンドを追加するためのフレームワークが完成します。

---

## 目次

- [構築するもの](#構築するもの)
- [前提条件](#前提条件)
- [アーキテクチャ概要](#アーキテクチャ概要)
- [ステップ1: チャット入力へのフック](#ステップ1-チャット入力へのフック)
- [ステップ2: コマンドプレフィックスと引数の解析](#ステップ2-コマンドプレフィックスと引数の解析)
- [ステップ3: 管理者権限の確認](#ステップ3-管理者権限の確認)
- [ステップ4: サーバーサイドアクションの実行](#ステップ4-サーバーサイドアクションの実行)
- [ステップ5: 管理者へのフィードバック送信](#ステップ5-管理者へのフィードバック送信)
- [ステップ6: コマンドの登録](#ステップ6-コマンドの登録)
- [ステップ7: 管理パネルのコマンドリストへの追加](#ステップ7-管理パネルのコマンドリストへの追加)
- [完全な動作コード: /heal コマンド](#完全な動作コード-heal-コマンド)
- [コマンドの追加](#コマンドの追加)
- [トラブルシューティング](#トラブルシューティング)
- [次のステップ](#次のステップ)

---

## 構築するもの

以下の機能を持つチャットコマンドシステムを構築します：

- **`/heal`** -- 管理者のキャラクターを完全回復（体力、血液、ショック、空腹、渇き）
- **`/heal PlayerName`** -- 名前で指定したプレイヤーを回復
- `/kill`、`/teleport`、`/time`、`/weather` など、任意のコマンドを追加できる再利用可能なフレームワーク
- 一般プレイヤーが管理者コマンドを使用できないようにする権限チェック
- チャットフィードバックメッセージ付きのサーバーサイド実行

---

## 前提条件

- 動作するMod構造（先に [チャプター 8.1](01-first-mod.md) を完了してください）
- チャプター 8.3 の [クライアント-サーバーRPCパターン](03-admin-panel.md) の理解

### このチュートリアルのMod構造

```
ChatCommands/
    mod.cpp
    Scripts/
        config.cpp
        3_Game/
            ChatCommands/
                CCmdRPC.c
                CCmdBase.c
                CCmdRegistry.c
        4_World/
            ChatCommands/
                CCmdServerHandler.c
                commands/
                    CCmdHeal.c
        5_Mission/
            ChatCommands/
                CCmdChatHook.c
```

---

## アーキテクチャ概要

チャットコマンドは以下のフローに従います：

```
クライアント                                サーバー
----------                                ------

1. 管理者がチャットで "/heal" と入力
2. チャットフックがメッセージを傍受
   （通常のチャットとして送信されるのを防ぐ）
3. クライアントがRPCでコマンドを送信 ---->  4. サーバーがRPCを受信
                                              管理者権限を確認
                                              コマンドハンドラーを検索
                                              コマンドを実行
                                          5. サーバーがフィードバックを送信 ----> クライアント
                                              （チャットメッセージRPC）
                                                                           6. 管理者がチャットで
                                                                              フィードバックを確認
```

**なぜサーバーでコマンドを処理するのか？** サーバーがゲーム状態に対する権限を持っているためです。プレイヤーの回復、天候の変更、キャラクターのテレポート、ワールド状態の変更を確実に行えるのはサーバーだけです。クライアントの役割はコマンドの検出と転送に限定されます。

---

## ステップ1: チャット入力へのフック

通常のチャットとして送信される前に、チャットメッセージを傍受する必要があります。DayZはこの目的のために `ChatInputMenu` クラスを提供しています。

### チャットフックのアプローチ

`MissionGameplay` クラスをmodして、チャット入力イベントを傍受します。プレイヤーが `/` で始まるチャットメッセージを送信すると、それを傍受し、通常のチャットとしての送信を防ぎ、代わりにコマンドRPCとしてサーバーに送信します。

### `Scripts/5_Mission/ChatCommands/CCmdChatHook.c` の作成

```c
modded class MissionGameplay
{
    // -------------------------------------------------------
    // / で始まるチャットメッセージを傍受する
    // -------------------------------------------------------
    override void OnEvent(EventType eventTypeId, Param params)
    {
        super.OnEvent(eventTypeId, params);

        // ChatMessageEventTypeID はプレイヤーがチャットメッセージを送信した時に発火する
        if (eventTypeId == ChatMessageEventTypeID)
        {
            Param3<int, string, string> chatParams;
            if (Class.CastTo(chatParams, params))
            {
                string message = chatParams.param3;

                // / で始まるかチェック
                if (message.Length() > 0 && message.Substring(0, 1) == "/")
                {
                    // これはコマンド -- サーバーに送信する
                    SendChatCommand(message);
                }
            }
        }
    }

    // -------------------------------------------------------
    // コマンド文字列をRPC経由でサーバーに送信する
    // -------------------------------------------------------
    protected void SendChatCommand(string fullCommand)
    {
        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        Print("[ChatCommands] Sending command to server: " + fullCommand);

        Param1<string> data = new Param1<string>(fullCommand);
        GetGame().RPCSingleParam(player, CCmdRPC.COMMAND_REQUEST, data, true);
    }

    // -------------------------------------------------------
    // サーバーからのコマンドフィードバックを受信する
    // -------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        if (rpc_type == CCmdRPC.COMMAND_FEEDBACK)
        {
            Param2<string, string> data = new Param2<string, string>("", "");
            if (ctx.Read(data))
            {
                string prefix = data.param1;
                string message = data.param2;

                // フィードバックをシステムチャットメッセージとして表示
                GetGame().Chat(prefix + " " + message, "colorStatusChannel");

                Print("[ChatCommands] Feedback: " + prefix + " " + message);
            }
        }
    }
};
```

### チャット傍受の仕組み

`MissionGameplay` の `OnEvent` メソッドは、様々なゲームイベントに対して呼び出されます。`eventTypeId` が `ChatMessageEventTypeID` の場合、プレイヤーがチャットメッセージを送信したことを意味します。`Param3` には以下が含まれます：

- `param1` -- チャンネル（int）：チャットチャンネル（グローバル、ダイレクトなど）
- `param2` -- 送信者名（string）
- `param3` -- メッセージテキスト（string）

メッセージが `/` で始まるかを確認します。該当する場合、文字列全体をRPC経由でサーバーに転送します。メッセージは通常のチャットとしても送信されます -- 本番のModでは、これを抑制する必要があります（末尾のノートで説明します）。

---

## ステップ2: コマンドプレフィックスと引数の解析

サーバー側では、`/heal PlayerName` のようなコマンド文字列をその構成要素（コマンド名 `heal` と引数 `["PlayerName"]`）に分解する必要があります。

### `Scripts/3_Game/ChatCommands/CCmdRPC.c` の作成

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST  = 79001;
    static const int COMMAND_FEEDBACK = 79002;
};
```

### `Scripts/3_Game/ChatCommands/CCmdBase.c` の作成

```c
// -------------------------------------------------------
// すべてのチャットコマンドの基底クラス
// -------------------------------------------------------
class CCmdBase
{
    // / プレフィックスを除いたコマンド名（例: "heal"）
    string GetName()
    {
        return "";
    }

    // ヘルプやコマンドリストに表示される短い説明
    string GetDescription()
    {
        return "";
    }

    // コマンドが正しく使用されなかった場合に表示される使用法
    string GetUsage()
    {
        return "/" + GetName();
    }

    // このコマンドが管理者権限を必要とするかどうか
    bool RequiresAdmin()
    {
        return true;
    }

    // サーバー上でコマンドを実行する
    // 成功した場合はtrue、失敗した場合はfalseを返す
    bool Execute(PlayerIdentity caller, array<string> args)
    {
        return false;
    }

    // -------------------------------------------------------
    // ヘルパー: コマンド呼び出し元にフィードバックメッセージを送信する
    // -------------------------------------------------------
    protected void SendFeedback(PlayerIdentity caller, string prefix, string message)
    {
        if (!caller)
            return;

        // 呼び出し元のプレイヤーオブジェクトを検索する
        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        Man callerPlayer = null;
        for (int i = 0; i < players.Count(); i++)
        {
            Man candidate = players.Get(i);
            if (candidate && candidate.GetIdentity())
            {
                if (candidate.GetIdentity().GetId() == caller.GetId())
                {
                    callerPlayer = candidate;
                    break;
                }
            }
        }

        if (callerPlayer)
        {
            Param2<string, string> data = new Param2<string, string>(prefix, message);
            GetGame().RPCSingleParam(callerPlayer, CCmdRPC.COMMAND_FEEDBACK, data, true, caller);
        }
    }

    // -------------------------------------------------------
    // ヘルパー: 部分名でプレイヤーを検索する
    // -------------------------------------------------------
    protected Man FindPlayerByName(string partialName)
    {
        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        string searchLower = partialName;
        searchLower.ToLower();

        for (int i = 0; i < players.Count(); i++)
        {
            Man man = players.Get(i);
            if (man && man.GetIdentity())
            {
                string playerName = man.GetIdentity().GetName();
                string playerNameLower = playerName;
                playerNameLower.ToLower();

                if (playerNameLower.Contains(searchLower))
                    return man;
            }
        }

        return null;
    }
};
```

### `Scripts/3_Game/ChatCommands/CCmdRegistry.c` の作成

```c
// -------------------------------------------------------
// 利用可能なすべてのコマンドを保持するレジストリ
// -------------------------------------------------------
class CCmdRegistry
{
    protected static ref map<string, ref CCmdBase> s_Commands;

    // -------------------------------------------------------
    // レジストリを初期化する（起動時に一度だけ呼び出す）
    // -------------------------------------------------------
    static void Init()
    {
        if (!s_Commands)
            s_Commands = new map<string, ref CCmdBase>;
    }

    // -------------------------------------------------------
    // コマンドインスタンスを登録する
    // -------------------------------------------------------
    static void Register(CCmdBase command)
    {
        if (!s_Commands)
            Init();

        if (!command)
            return;

        string name = command.GetName();
        name.ToLower();

        if (s_Commands.Contains(name))
        {
            Print("[ChatCommands] WARNING: Command '" + name + "' already registered, overwriting.");
        }

        s_Commands.Set(name, command);
        Print("[ChatCommands] Registered command: /" + name);
    }

    // -------------------------------------------------------
    // 名前でコマンドを検索する
    // -------------------------------------------------------
    static CCmdBase GetCommand(string name)
    {
        if (!s_Commands)
            return null;

        string nameLower = name;
        nameLower.ToLower();

        CCmdBase cmd;
        if (s_Commands.Find(nameLower, cmd))
            return cmd;

        return null;
    }

    // -------------------------------------------------------
    // 登録されているすべてのコマンド名を取得する
    // -------------------------------------------------------
    static array<string> GetCommandNames()
    {
        ref array<string> names = new array<string>;

        if (s_Commands)
        {
            for (int i = 0; i < s_Commands.Count(); i++)
            {
                names.Insert(s_Commands.GetKey(i));
            }
        }

        return names;
    }

    // -------------------------------------------------------
    // 生のコマンド文字列を名前と引数に解析する
    // 例: "/heal PlayerName" --> name="heal", args=["PlayerName"]
    // -------------------------------------------------------
    static void ParseCommand(string fullCommand, out string commandName, out array<string> args)
    {
        args = new array<string>;
        commandName = "";

        if (fullCommand.Length() == 0)
            return;

        // 先頭の / を除去する
        string raw = fullCommand;
        if (raw.Substring(0, 1) == "/")
            raw = raw.Substring(1, raw.Length() - 1);

        // スペースで分割する
        raw.Split(" ", args);

        if (args.Count() > 0)
        {
            commandName = args.Get(0);
            commandName.ToLower();
            args.RemoveOrdered(0);
        }
    }
};
```

### 解析ロジックの説明

入力 `/heal SomePlayer` に対して、`ParseCommand` は以下を行います：

1. 先頭の `/` を除去して `"heal SomePlayer"` を得る
2. スペースで分割して `["heal", "SomePlayer"]` を得る
3. 最初の要素をコマンド名として取得：`"heal"`
4. 配列からそれを削除し、引数として `["SomePlayer"]` を残す

コマンド名は小文字に変換されるため、`/Heal`、`/HEAL`、`/heal` のすべてが動作します。

---

## ステップ3: 管理者権限の確認

管理者権限の確認により、一般プレイヤーが管理者コマンドを実行することを防ぎます。DayZにはスクリプト内に組み込みの管理者権限システムがないため、シンプルな管理者リストに対してチェックを行います。

### サーバーハンドラーでの管理者チェック

最もシンプルなアプローチは、プレイヤーのSteam64 IDを既知の管理者IDリストと照合することです。本番のModでは、このリストを設定ファイルから読み込みます。

```c
// シンプルな管理者チェック -- 本番ではJSON設定ファイルから読み込むこと
static bool IsAdmin(PlayerIdentity identity)
{
    if (!identity)
        return false;

    // プレイヤーのプレーンID（Steam64 ID）を確認する
    string playerId = identity.GetPlainId();

    // ハードコードされた管理者リスト -- 本番では設定ファイルの読み込みに置き換えること
    ref array<string> adminIds = new array<string>;
    adminIds.Insert("76561198000000001");    // 実際のSteam64 IDに置き換えてください
    adminIds.Insert("76561198000000002");

    return (adminIds.Find(playerId) != -1);
}
```

### Steam64 IDの見つけ方

- ブラウザでSteamプロフィールを開きます
- URLにSteam64 IDが含まれています：`https://steamcommunity.com/profiles/76561198XXXXXXXXX`
- または https://steamid.io のようなツールを使用して任意のプレイヤーを検索できます

### 本番グレードの権限

実際のModでは、以下を行います：

1. 管理者IDをJSONファイル（`$profile:ChatCommands/admins.json`）に保存する
2. サーバー起動時にファイルを読み込む
3. 権限レベル（モデレーター、管理者、スーパー管理者）をサポートする
4. 階層的な権限のためにフレームワークの `Permissions` システムを使用する

---

## ステップ4: サーバーサイドアクションの実行

ここでは実際の `/heal` コマンドと、受信したコマンドRPCを処理するサーバーハンドラーを作成します。

### `Scripts/4_World/ChatCommands/commands/CCmdHeal.c` の作成

```c
class CCmdHeal extends CCmdBase
{
    override string GetName()
    {
        return "heal";
    }

    override string GetDescription()
    {
        return "Fully heals a player (health, blood, shock, hunger, thirst)";
    }

    override string GetUsage()
    {
        return "/heal [PlayerName]";
    }

    override bool RequiresAdmin()
    {
        return true;
    }

    // -------------------------------------------------------
    // healコマンドを実行する
    // /heal         --> 呼び出し元を回復する
    // /heal Name    --> 指定された名前のプレイヤーを回復する
    // -------------------------------------------------------
    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        if (!caller)
            return false;

        Man targetMan = null;
        string targetName = "";

        // ターゲットプレイヤーを決定する
        if (args.Count() > 0)
        {
            // 名前で指定されたプレイヤーを回復する
            string searchName = args.Get(0);
            targetMan = FindPlayerByName(searchName);

            if (!targetMan)
            {
                SendFeedback(caller, "[Heal]", "Player '" + searchName + "' not found.");
                return false;
            }

            targetName = targetMan.GetIdentity().GetName();
        }
        else
        {
            // 呼び出し元自身を回復する
            ref array<Man> allPlayers = new array<Man>;
            GetGame().GetPlayers(allPlayers);

            for (int i = 0; i < allPlayers.Count(); i++)
            {
                Man candidate = allPlayers.Get(i);
                if (candidate && candidate.GetIdentity())
                {
                    if (candidate.GetIdentity().GetId() == caller.GetId())
                    {
                        targetMan = candidate;
                        break;
                    }
                }
            }

            if (!targetMan)
            {
                SendFeedback(caller, "[Heal]", "Could not find your player object.");
                return false;
            }

            targetName = "yourself";
        }

        // 回復を実行する
        PlayerBase targetPlayer;
        if (!Class.CastTo(targetPlayer, targetMan))
        {
            SendFeedback(caller, "[Heal]", "Target is not a valid player.");
            return false;
        }

        HealPlayer(targetPlayer);

        // ログ出力とフィードバック送信
        Print("[ChatCommands] " + caller.GetName() + " healed " + targetName);
        SendFeedback(caller, "[Heal]", "Successfully healed " + targetName + ".");

        return true;
    }

    // -------------------------------------------------------
    // プレイヤーに完全回復を適用する
    // -------------------------------------------------------
    protected void HealPlayer(PlayerBase player)
    {
        if (!player)
            return;

        // 体力を最大値に回復する
        player.SetHealth("GlobalHealth", "Health", player.GetMaxHealth("GlobalHealth", "Health"));

        // 血液を最大値に回復する
        player.SetHealth("GlobalHealth", "Blood", player.GetMaxHealth("GlobalHealth", "Blood"));

        // ショックダメージを除去する
        player.SetHealth("GlobalHealth", "Shock", player.GetMaxHealth("GlobalHealth", "Shock"));

        // 空腹を満タンにする（エネルギー値）
        // PlayerBaseにはステータスシステムがある -- エネルギーステータスを設定する
        player.GetStatEnergy().Set(player.GetStatEnergy().GetMax());

        // 渇きを満タンにする（水分値）
        player.GetStatWater().Set(player.GetStatWater().GetMax());

        // すべての出血源を除去する
        player.GetBleedingManagerServer().RemoveAllSources();

        Print("[ChatCommands] Healed player: " + player.GetIdentity().GetName());
    }
};
```

### なぜ 4_World なのか？

healコマンドは `4_World` レイヤーで定義されている `PlayerBase` を参照します。また、ワールドエンティティでのみ利用可能なプレイヤーステータスメソッド（`GetStatEnergy`、`GetStatWater`、`GetBleedingManagerServer`）も使用します。コマンドは `4_World` 以上に配置する**必要があります**。

基底クラス `CCmdBase` はワールド型を参照しないため `3_Game` に配置します。ワールドエンティティに触れる具体的なコマンドクラスは `4_World` に配置します。

---

## ステップ5: 管理者へのフィードバック送信

フィードバックは `CCmdBase` の `SendFeedback()` メソッドで処理されます。完全なフィードバックパスをたどってみましょう：

### サーバーがフィードバックを送信

```c
// CCmdBase.SendFeedback() 内部
Param2<string, string> data = new Param2<string, string>(prefix, message);
GetGame().RPCSingleParam(callerPlayer, CCmdRPC.COMMAND_FEEDBACK, data, true, caller);
```

サーバーは、コマンドを発行した特定のクライアントに `COMMAND_FEEDBACK` RPCを送信します。データにはプレフィックス（`"[Heal]"` など）とメッセージテキストが含まれます。

### クライアントがフィードバックを受信して表示

ステップ1の `CCmdChatHook.c` に戻り、`OnRPC` ハンドラーがこれをキャッチします：

```c
if (rpc_type == CCmdRPC.COMMAND_FEEDBACK)
{
    // メッセージをデシリアライズする
    Param2<string, string> data = new Param2<string, string>("", "");
    if (ctx.Read(data))
    {
        string prefix = data.param1;
        string message = data.param2;

        // チャットウィンドウに表示する
        GetGame().Chat(prefix + " " + message, "colorStatusChannel");
    }
}
```

`GetGame().Chat()` はプレイヤーのチャットウィンドウにメッセージを表示します。第2パラメータはカラーチャンネルです：

| チャンネル | 色 | 一般的な用途 |
|---------|-------|-------------|
| `"colorStatusChannel"` | 黄色/オレンジ | システムメッセージ |
| `"colorAction"` | 白 | アクションフィードバック |
| `"colorFriendly"` | 緑 | ポジティブなフィードバック |
| `"colorImportant"` | 赤 | 警告/エラー |

---

## ステップ6: コマンドの登録

サーバーハンドラーはコマンドRPCを受信し、レジストリでコマンドを検索して実行します。

### `Scripts/4_World/ChatCommands/CCmdServerHandler.c` の作成

```c
modded class MissionServer
{
    // -------------------------------------------------------
    // サーバー起動時にすべてのコマンドを登録する
    // -------------------------------------------------------
    override void OnInit()
    {
        super.OnInit();

        CCmdRegistry.Init();

        // ここですべてのコマンドを登録する
        CCmdRegistry.Register(new CCmdHeal());

        // さらにコマンドを追加:
        // CCmdRegistry.Register(new CCmdKill());
        // CCmdRegistry.Register(new CCmdTeleport());
        // CCmdRegistry.Register(new CCmdTime());

        Print("[ChatCommands] Server initialized. Commands registered.");
    }
};

// -------------------------------------------------------
// 受信コマンドのサーバーサイドRPCハンドラー
// -------------------------------------------------------
modded class PlayerBase
{
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (!GetGame().IsServer())
            return;

        if (rpc_type == CCmdRPC.COMMAND_REQUEST)
        {
            HandleCommandRPC(sender, ctx);
        }
    }

    protected void HandleCommandRPC(PlayerIdentity sender, ParamsReadContext ctx)
    {
        if (!sender)
            return;

        // コマンド文字列を読み取る
        Param1<string> data = new Param1<string>("");
        if (!ctx.Read(data))
        {
            Print("[ChatCommands] ERROR: Failed to read command RPC data.");
            return;
        }

        string fullCommand = data.param1;
        Print("[ChatCommands] Received command from " + sender.GetName() + ": " + fullCommand);

        // コマンドを解析する
        string commandName;
        ref array<string> args;
        CCmdRegistry.ParseCommand(fullCommand, commandName, args);

        if (commandName == "")
            return;

        // コマンドを検索する
        CCmdBase command = CCmdRegistry.GetCommand(commandName);
        if (!command)
        {
            SendCommandFeedback(sender, "[Error]", "Unknown command: /" + commandName);
            return;
        }

        // 管理者権限を確認する
        if (command.RequiresAdmin() && !IsCommandAdmin(sender))
        {
            Print("[ChatCommands] Non-admin " + sender.GetName() + " tried to use /" + commandName);
            SendCommandFeedback(sender, "[Error]", "You do not have permission to use this command.");
            return;
        }

        // コマンドを実行する
        bool success = command.Execute(sender, args);

        if (success)
            Print("[ChatCommands] Command /" + commandName + " executed successfully by " + sender.GetName());
        else
            Print("[ChatCommands] Command /" + commandName + " failed for " + sender.GetName());
    }

    // -------------------------------------------------------
    // プレイヤーが管理者かどうかを確認する
    // -------------------------------------------------------
    protected bool IsCommandAdmin(PlayerIdentity identity)
    {
        if (!identity)
            return false;

        string playerId = identity.GetPlainId();

        // ----------------------------------------------------------
        // 重要: これらを実際の管理者Steam64 IDに置き換えてください
        // 本番ではハードコードではなくJSON設定ファイルから読み込んでください
        // ----------------------------------------------------------
        ref array<string> adminIds = new array<string>;
        adminIds.Insert("76561198000000001");
        adminIds.Insert("76561198000000002");

        return (adminIds.Find(playerId) != -1);
    }

    // -------------------------------------------------------
    // 特定のプレイヤーにフィードバックを送信する
    // -------------------------------------------------------
    protected void SendCommandFeedback(PlayerIdentity target, string prefix, string message)
    {
        if (!target)
            return;

        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        for (int i = 0; i < players.Count(); i++)
        {
            Man candidate = players.Get(i);
            if (candidate && candidate.GetIdentity())
            {
                if (candidate.GetIdentity().GetId() == target.GetId())
                {
                    Param2<string, string> data = new Param2<string, string>(prefix, message);
                    GetGame().RPCSingleParam(candidate, CCmdRPC.COMMAND_FEEDBACK, data, true, target);
                    return;
                }
            }
        }
    }
};
```

### 登録パターン

コマンドは `MissionServer.OnInit()` で登録されます：

```c
CCmdRegistry.Init();
CCmdRegistry.Register(new CCmdHeal());
```

各 `Register()` 呼び出しはコマンドクラスのインスタンスを作成し、コマンド名をキーとするマップに格納します。コマンドRPCが到着すると、ハンドラーはレジストリで名前を検索し、一致するコマンドオブジェクトの `Execute()` を呼び出します。

このパターンにより、新しいコマンドの追加が非常に簡単になります -- `CCmdBase` を継承する新しいクラスを作成し、`Execute()` を実装して、`Register()` の一行を追加するだけです。

---

## ステップ7: 管理パネルのコマンドリストへの追加

管理パネル（[チャプター 8.3](03-admin-panel.md) のもの）がある場合、利用可能なコマンドのリストをUIに表示できます。

### サーバーからコマンドリストをリクエストする

`CCmdRPC.c` に新しいRPC IDを追加します：

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST   = 79001;
    static const int COMMAND_FEEDBACK  = 79002;
    static const int COMMAND_LIST_REQ  = 79003;
    static const int COMMAND_LIST_RESP = 79004;
};
```

### サーバーサイド: コマンドリストの送信

サーバーサイドのコードに以下のハンドラーを追加します：

```c
// サーバーハンドラーに COMMAND_LIST_REQ のケースを追加する
if (rpc_type == CCmdRPC.COMMAND_LIST_REQ)
{
    HandleCommandListRequest(sender);
}

protected void HandleCommandListRequest(PlayerIdentity requestor)
{
    if (!requestor)
        return;

    // すべてのコマンドのフォーマットされた文字列を構築する
    array<string> names = CCmdRegistry.GetCommandNames();
    string commandList = "Available Commands:\n";

    for (int i = 0; i < names.Count(); i++)
    {
        CCmdBase cmd = CCmdRegistry.GetCommand(names.Get(i));
        if (cmd)
        {
            commandList = commandList + cmd.GetUsage() + " - " + cmd.GetDescription() + "\n";
        }
    }

    // クライアントに返送する
    ref array<Man> players = new array<Man>;
    GetGame().GetPlayers(players);

    for (int j = 0; j < players.Count(); j++)
    {
        Man candidate = players.Get(j);
        if (candidate && candidate.GetIdentity() && candidate.GetIdentity().GetId() == requestor.GetId())
        {
            Param1<string> data = new Param1<string>(commandList);
            GetGame().RPCSingleParam(candidate, CCmdRPC.COMMAND_LIST_RESP, data, true, requestor);
            return;
        }
    }
}
```

### クライアントサイド: パネルへの表示

クライアント側でレスポンスをキャッチしてテキストウィジェットに表示します：

```c
if (rpc_type == CCmdRPC.COMMAND_LIST_RESP)
{
    Param1<string> data = new Param1<string>("");
    if (ctx.Read(data))
    {
        string commandList = data.param1;
        // 管理パネルのテキストウィジェットに表示する
        // m_CommandListText.SetText(commandList);
        Print("[ChatCommands] Command list received:\n" + commandList);
    }
}
```

---

## 完全な動作コード: /heal コマンド

完全な動作システムに必要なすべてのファイルを以下に示します。これらのファイルを作成すれば、Modに機能する `/heal` コマンドが追加されます。

### config.cpp のセットアップ

```cpp
class CfgPatches
{
    class ChatCommands_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Scripts"
        };
    };
};

class CfgMods
{
    class ChatCommands
    {
        dir = "ChatCommands";
        name = "Chat Commands";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "ChatCommands/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "ChatCommands/Scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "ChatCommands/Scripts/5_Mission" };
            };
        };
    };
};
```

### 3_Game/ChatCommands/CCmdRPC.c

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST  = 79001;
    static const int COMMAND_FEEDBACK = 79002;
};
```

### 3_Game/ChatCommands/CCmdBase.c

```c
class CCmdBase
{
    string GetName()
    {
        return "";
    }

    string GetDescription()
    {
        return "";
    }

    string GetUsage()
    {
        return "/" + GetName();
    }

    bool RequiresAdmin()
    {
        return true;
    }

    bool Execute(PlayerIdentity caller, array<string> args)
    {
        return false;
    }

    protected void SendFeedback(PlayerIdentity caller, string prefix, string message)
    {
        if (!caller)
            return;

        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        Man callerPlayer = null;
        for (int i = 0; i < players.Count(); i++)
        {
            Man candidate = players.Get(i);
            if (candidate && candidate.GetIdentity())
            {
                if (candidate.GetIdentity().GetId() == caller.GetId())
                {
                    callerPlayer = candidate;
                    break;
                }
            }
        }

        if (callerPlayer)
        {
            Param2<string, string> data = new Param2<string, string>(prefix, message);
            GetGame().RPCSingleParam(callerPlayer, CCmdRPC.COMMAND_FEEDBACK, data, true, caller);
        }
    }

    protected Man FindPlayerByName(string partialName)
    {
        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        string searchLower = partialName;
        searchLower.ToLower();

        for (int i = 0; i < players.Count(); i++)
        {
            Man man = players.Get(i);
            if (man && man.GetIdentity())
            {
                string playerName = man.GetIdentity().GetName();
                string playerNameLower = playerName;
                playerNameLower.ToLower();

                if (playerNameLower.Contains(searchLower))
                    return man;
            }
        }

        return null;
    }
};
```

### 3_Game/ChatCommands/CCmdRegistry.c

```c
class CCmdRegistry
{
    protected static ref map<string, ref CCmdBase> s_Commands;

    static void Init()
    {
        if (!s_Commands)
            s_Commands = new map<string, ref CCmdBase>;
    }

    static void Register(CCmdBase command)
    {
        if (!s_Commands)
            Init();

        if (!command)
            return;

        string name = command.GetName();
        name.ToLower();

        s_Commands.Set(name, command);
        Print("[ChatCommands] Registered command: /" + name);
    }

    static CCmdBase GetCommand(string name)
    {
        if (!s_Commands)
            return null;

        string nameLower = name;
        nameLower.ToLower();

        CCmdBase cmd;
        if (s_Commands.Find(nameLower, cmd))
            return cmd;

        return null;
    }

    static array<string> GetCommandNames()
    {
        ref array<string> names = new array<string>;

        if (s_Commands)
        {
            for (int i = 0; i < s_Commands.Count(); i++)
            {
                names.Insert(s_Commands.GetKey(i));
            }
        }

        return names;
    }

    static void ParseCommand(string fullCommand, out string commandName, out array<string> args)
    {
        args = new array<string>;
        commandName = "";

        if (fullCommand.Length() == 0)
            return;

        string raw = fullCommand;
        if (raw.Substring(0, 1) == "/")
            raw = raw.Substring(1, raw.Length() - 1);

        raw.Split(" ", args);

        if (args.Count() > 0)
        {
            commandName = args.Get(0);
            commandName.ToLower();
            args.RemoveOrdered(0);
        }
    }
};
```

### 4_World/ChatCommands/commands/CCmdHeal.c

```c
class CCmdHeal extends CCmdBase
{
    override string GetName()
    {
        return "heal";
    }

    override string GetDescription()
    {
        return "Fully heals a player (health, blood, shock, hunger, thirst)";
    }

    override string GetUsage()
    {
        return "/heal [PlayerName]";
    }

    override bool RequiresAdmin()
    {
        return true;
    }

    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        if (!caller)
            return false;

        Man targetMan = null;
        string targetName = "";

        if (args.Count() > 0)
        {
            string searchName = args.Get(0);
            targetMan = FindPlayerByName(searchName);

            if (!targetMan)
            {
                SendFeedback(caller, "[Heal]", "Player '" + searchName + "' not found.");
                return false;
            }

            targetName = targetMan.GetIdentity().GetName();
        }
        else
        {
            ref array<Man> allPlayers = new array<Man>;
            GetGame().GetPlayers(allPlayers);

            for (int i = 0; i < allPlayers.Count(); i++)
            {
                Man candidate = allPlayers.Get(i);
                if (candidate && candidate.GetIdentity())
                {
                    if (candidate.GetIdentity().GetId() == caller.GetId())
                    {
                        targetMan = candidate;
                        break;
                    }
                }
            }

            if (!targetMan)
            {
                SendFeedback(caller, "[Heal]", "Could not find your player object.");
                return false;
            }

            targetName = "yourself";
        }

        PlayerBase targetPlayer;
        if (!Class.CastTo(targetPlayer, targetMan))
        {
            SendFeedback(caller, "[Heal]", "Target is not a valid player.");
            return false;
        }

        HealPlayer(targetPlayer);

        Print("[ChatCommands] " + caller.GetName() + " healed " + targetName);
        SendFeedback(caller, "[Heal]", "Successfully healed " + targetName + ".");

        return true;
    }

    protected void HealPlayer(PlayerBase player)
    {
        if (!player)
            return;

        player.SetHealth("GlobalHealth", "Health", player.GetMaxHealth("GlobalHealth", "Health"));
        player.SetHealth("GlobalHealth", "Blood", player.GetMaxHealth("GlobalHealth", "Blood"));
        player.SetHealth("GlobalHealth", "Shock", player.GetMaxHealth("GlobalHealth", "Shock"));

        player.GetStatEnergy().Set(player.GetStatEnergy().GetMax());
        player.GetStatWater().Set(player.GetStatWater().GetMax());

        player.GetBleedingManagerServer().RemoveAllSources();
    }
};
```

### 4_World/ChatCommands/CCmdServerHandler.c

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();

        CCmdRegistry.Init();
        CCmdRegistry.Register(new CCmdHeal());

        Print("[ChatCommands] Server initialized. Commands registered.");
    }
};

modded class PlayerBase
{
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (!GetGame().IsServer())
            return;

        if (rpc_type == CCmdRPC.COMMAND_REQUEST)
        {
            HandleCommandRPC(sender, ctx);
        }
    }

    protected void HandleCommandRPC(PlayerIdentity sender, ParamsReadContext ctx)
    {
        if (!sender)
            return;

        Param1<string> data = new Param1<string>("");
        if (!ctx.Read(data))
        {
            Print("[ChatCommands] ERROR: Failed to read command RPC data.");
            return;
        }

        string fullCommand = data.param1;
        Print("[ChatCommands] Received command from " + sender.GetName() + ": " + fullCommand);

        string commandName;
        ref array<string> args;
        CCmdRegistry.ParseCommand(fullCommand, commandName, args);

        if (commandName == "")
            return;

        CCmdBase command = CCmdRegistry.GetCommand(commandName);
        if (!command)
        {
            SendCommandFeedback(sender, "[Error]", "Unknown command: /" + commandName);
            return;
        }

        if (command.RequiresAdmin() && !IsCommandAdmin(sender))
        {
            Print("[ChatCommands] Non-admin " + sender.GetName() + " tried to use /" + commandName);
            SendCommandFeedback(sender, "[Error]", "You do not have permission to use this command.");
            return;
        }

        command.Execute(sender, args);
    }

    protected bool IsCommandAdmin(PlayerIdentity identity)
    {
        if (!identity)
            return false;

        string playerId = identity.GetPlainId();

        // これらを実際の管理者Steam64 IDに置き換えてください
        ref array<string> adminIds = new array<string>;
        adminIds.Insert("76561198000000001");
        adminIds.Insert("76561198000000002");

        return (adminIds.Find(playerId) != -1);
    }

    protected void SendCommandFeedback(PlayerIdentity target, string prefix, string message)
    {
        if (!target)
            return;

        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        for (int i = 0; i < players.Count(); i++)
        {
            Man candidate = players.Get(i);
            if (candidate && candidate.GetIdentity() && candidate.GetIdentity().GetId() == target.GetId())
            {
                Param2<string, string> data = new Param2<string, string>(prefix, message);
                GetGame().RPCSingleParam(candidate, CCmdRPC.COMMAND_FEEDBACK, data, true, target);
                return;
            }
        }
    }
};
```

### 5_Mission/ChatCommands/CCmdChatHook.c

```c
modded class MissionGameplay
{
    override void OnEvent(EventType eventTypeId, Param params)
    {
        super.OnEvent(eventTypeId, params);

        if (eventTypeId == ChatMessageEventTypeID)
        {
            Param3<int, string, string> chatParams;
            if (Class.CastTo(chatParams, params))
            {
                string message = chatParams.param3;

                if (message.Length() > 0 && message.Substring(0, 1) == "/")
                {
                    SendChatCommand(message);
                }
            }
        }
    }

    protected void SendChatCommand(string fullCommand)
    {
        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        Print("[ChatCommands] Sending command to server: " + fullCommand);

        Param1<string> data = new Param1<string>(fullCommand);
        GetGame().RPCSingleParam(player, CCmdRPC.COMMAND_REQUEST, data, true);
    }

    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        if (rpc_type == CCmdRPC.COMMAND_FEEDBACK)
        {
            Param2<string, string> data = new Param2<string, string>("", "");
            if (ctx.Read(data))
            {
                string prefix = data.param1;
                string message = data.param2;

                GetGame().Chat(prefix + " " + message, "colorStatusChannel");
                Print("[ChatCommands] Feedback: " + prefix + " " + message);
            }
        }
    }
};
```

---

## コマンドの追加

レジストリパターンにより、新しいコマンドの追加は簡単です。以下に例を示します：

### /kill コマンド

```c
class CCmdKill extends CCmdBase
{
    override string GetName()        { return "kill"; }
    override string GetDescription() { return "Kills a player"; }
    override string GetUsage()       { return "/kill [PlayerName]"; }

    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        Man targetMan = null;

        if (args.Count() > 0)
            targetMan = FindPlayerByName(args.Get(0));
        else
        {
            ref array<Man> players = new array<Man>;
            GetGame().GetPlayers(players);
            for (int i = 0; i < players.Count(); i++)
            {
                if (players.Get(i).GetIdentity() && players.Get(i).GetIdentity().GetId() == caller.GetId())
                {
                    targetMan = players.Get(i);
                    break;
                }
            }
        }

        if (!targetMan)
        {
            SendFeedback(caller, "[Kill]", "Player not found.");
            return false;
        }

        PlayerBase targetPlayer;
        if (Class.CastTo(targetPlayer, targetMan))
        {
            targetPlayer.SetHealth("GlobalHealth", "Health", 0);
            SendFeedback(caller, "[Kill]", "Killed " + targetMan.GetIdentity().GetName() + ".");
            return true;
        }

        return false;
    }
};
```

### /time コマンド

```c
class CCmdTime extends CCmdBase
{
    override string GetName()        { return "time"; }
    override string GetDescription() { return "Sets the server time (0-23)"; }
    override string GetUsage()       { return "/time <hour>"; }

    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        if (args.Count() < 1)
        {
            SendFeedback(caller, "[Time]", "Usage: " + GetUsage());
            return false;
        }

        int hour = args.Get(0).ToInt();
        if (hour < 0 || hour > 23)
        {
            SendFeedback(caller, "[Time]", "Hour must be between 0 and 23.");
            return false;
        }

        GetGame().GetWorld().SetDate(2024, 6, 15, hour, 0);
        SendFeedback(caller, "[Time]", "Server time set to " + hour.ToString() + ":00.");
        return true;
    }
};
```

### 新しいコマンドの登録

`MissionServer.OnInit()` にコマンドごとに一行追加します：

```c
CCmdRegistry.Register(new CCmdHeal());
CCmdRegistry.Register(new CCmdKill());
CCmdRegistry.Register(new CCmdTime());
```

---

## トラブルシューティング

### コマンドが認識されない（「Unknown command」）

- **登録の欠落:** `MissionServer.OnInit()` で `CCmdRegistry.Register(new CCmdYourCommand())` が呼び出されていることを確認してください。
- **GetName() のタイプミス:** `GetName()` が返す文字列は、プレイヤーが入力するもの（`/` なし）と一致する必要があります。
- **大文字小文字の不一致:** レジストリは名前を小文字に変換します。`/Heal`、`/HEAL`、`/heal` のすべてが動作するはずです。

### 管理者の権限が拒否される

- **Steam64 IDの誤り:** `IsCommandAdmin()` の管理者IDを再確認してください。正確なSteam64 ID（`7656` で始まる17桁の数字）である必要があります。
- **GetPlainId() と GetId() の違い:** `GetPlainId()` はSteam64 IDを返します。`GetId()` はDayZセッションIDを返します。管理者チェックには `GetPlainId()` を使用してください。

### フィードバックメッセージがチャットに表示されない

- **RPCがクライアントに到達していない:** サーバーに `Print()` 文を追加して、フィードバックRPCが送信されていることを確認してください。
- **クライアントの OnRPC がキャッチしていない:** RPC IDが一致していることを確認してください（`CCmdRPC.COMMAND_FEEDBACK`）。
- **GetGame().Chat() が動作しない:** この関数はチャットが利用可能な状態でゲームが実行されている必要があります。ロード画面では動作しない場合があります。

### /heal が実際に回復しない

- **サーバー専用実行:** `SetHealth()` とステータスの変更はサーバー上で実行する必要があります。`Execute()` の実行時に `GetGame().IsServer()` がtrueであることを確認してください。
- **PlayerBase のキャスト失敗:** `Class.CastTo(targetPlayer, targetMan)` がfalseを返す場合、ターゲットは有効な PlayerBase ではありません。AIまたは非プレイヤーエンティティの場合に発生することがあります。
- **ステータスゲッターがnullを返す:** `GetStatEnergy()` と `GetStatWater()` は、プレイヤーが死亡しているか完全に初期化されていない場合にnullを返すことがあります。本番コードではnullチェックを追加してください。

### コマンドが通常のメッセージとしてチャットに表示される

- `OnEvent` フックはメッセージを傍受しますが、チャットとしての送信は抑制しません。本番のModでこれを抑制するには、`ChatInputMenu` クラスをmodして `/` メッセージを送信前にフィルタリングする必要があります：

```c
modded class ChatInputMenu
{
    override void OnChatInputSend()
    {
        string text = "";
        // エディットウィジェットから現在のテキストを取得する
        // / で始まる場合、super を呼び出さない（superがチャットとして送信する）
        // 代わりにコマンドとして処理する

        // このアプローチはDayZのバージョンによって異なる -- バニラソースを確認すること
        super.OnChatInputSend();
    }
};
```

正確な実装は、DayZのバージョンと `ChatInputMenu` がテキストをどのように公開するかに依存します。このチュートリアルの `OnEvent` アプローチはよりシンプルで開発時に動作しますが、コマンドテキストがチャットメッセージとしても表示されるというトレードオフがあります。

---

## 次のステップ

1. **設定ファイルから管理者を読み込む** -- ハードコードの代わりに `JsonFileLoader` を使用してJSONファイルから管理者IDを読み込みます。
2. **/help コマンドを追加する** -- 利用可能なすべてのコマンドの説明と使用法を一覧表示します。
3. **ログ記録を追加する** -- 監査目的でコマンドの使用状況をログファイルに書き込みます。
4. **フレームワークと統合する** -- 階層的な権限のための `Permissions` システムと、整数ID衝突を回避する文字列ルーティングRPCのための `RPC` システムを提供するフレームワークを使用します。
5. **クールダウンを追加する** -- プレイヤーごとの最後の実行時間を追跡してコマンドスパムを防ぎます。
6. **コマンドパレットUIを構築する** -- クリック可能なボタンですべてのコマンドを一覧表示する管理パネルを作成します（このチュートリアルと [チャプター 8.3](03-admin-panel.md) を組み合わせます）。

---

## ベストプラクティス

- **管理者コマンドを実行する前に必ず権限を確認してください。** 権限チェックが欠落していると、任意のプレイヤーが誰でも `/heal` や `/kill` できてしまいます。処理前にサーバー上で呼び出し元のSteam64 ID（`GetPlainId()` 経由）を検証してください。
- **失敗したコマンドでも管理者にフィードバックを送信してください。** サイレントな失敗はデバッグを不可能にします。何が問題だったかを説明するチャットメッセージ（「Player not found」、「Permission denied」）を必ず送信してください。
- **管理者チェックには `GetId()` ではなく `GetPlainId()` を使用してください。** `GetId()` は再接続のたびに変わるセッション固有のDayZ IDを返します。`GetPlainId()` は永続的なSteam64 IDを返します。
- **管理者IDはコード内ではなくJSON設定ファイルに保存してください。** ハードコードされたIDは変更にPBOの再ビルドが必要です。`$profile:` のJSONファイルはModの知識がなくてもサーバー管理者が編集できます。
- **マッチング前にコマンド名を小文字に変換してください。** プレイヤーは `/Heal`、`/HEAL`、`/heal` と入力する可能性があります。小文字への正規化により、苛立たしい「unknown command」エラーを防ぎます。

---

## 理論と実践

| 概念 | 理論 | 現実 |
|---------|--------|---------|
| `OnEvent` によるチャットフック | メッセージを傍受してコマンドとして処理する | メッセージは依然としてすべてのプレイヤーのチャットに表示されます。抑制には `ChatInputMenu` のmodが必要ですが、DayZのバージョンによって異なります。 |
| `GetGame().Chat()` | プレイヤーのチャットウィンドウにメッセージを表示する | チャットUIがアクティブな場合にのみ動作します。ロード画面や特定のメニュー状態では、メッセージは静かに破棄されます。 |
| コマンドレジストリパターン | コマンドごとに1クラスのクリーンなアーキテクチャ | 各コマンドクラスファイルは正しいスクリプトレイヤーに配置する必要があります。`CCmdBase` は `3_Game` に、`PlayerBase` を参照する具体的なコマンドは `4_World` に。レイヤーの配置を誤ると、ロード時に「Undefined type」エラーが発生します。 |
| 名前によるプレイヤー検索 | `FindPlayerByName` が部分名にマッチする | 部分マッチングは、類似した名前のプレイヤーがいるサーバーでは誤ったプレイヤーをターゲットにする可能性があります。本番ではSteam64 IDによるターゲティングや確認ステップの追加を推奨します。 |

---

## 学んだこと

このチュートリアルで学んだことは以下のとおりです：
- `MissionGameplay.OnEvent` と `ChatMessageEventTypeID` を使用してチャット入力にフックする方法
- チャットテキストからコマンドプレフィックスと引数を解析する方法
- Steam64 IDを使用してサーバー上で管理者権限を確認する方法
- RPCと `GetGame().Chat()` を使用してプレイヤーにコマンドフィードバックを返送する方法
- 新しいコマンドを追加するための再利用可能なコマンドレジストリパターンの構築方法

**次へ:** [チャプター 8.6: デバッグとテスト](06-debugging-testing.md)

---

**前へ:** [チャプター 8.3: 管理パネルモジュールの構築](03-admin-panel.md)
