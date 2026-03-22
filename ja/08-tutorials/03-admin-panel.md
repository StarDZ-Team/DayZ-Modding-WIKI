# 第8.3章: 管理パネルモジュールの構築

[ホーム](../README.md) | [<< 前へ: カスタムアイテムの作成](02-custom-item.md) | **管理パネルの構築** | [次へ: チャットコマンドの追加 >>](04-chat-commands.md)

---

> **要約:** このチュートリアルでは、管理パネルモジュールをゼロから構築する手順を説明します。UIレイアウトの作成、スクリプトでのウィジェットバインド、ボタンクリックの処理、クライアントからサーバーへのRPC送信、サーバーでのリクエスト処理、レスポンスの返送、UIでの結果表示を行います。これは、すべてのネットワーク対応MODに必要なクライアント-サーバー-クライアントの完全な往復をカバーします。

---

## 目次

- [何を構築するか](#何を構築するか)
- [前提条件](#前提条件)
- [アーキテクチャ概要](#アーキテクチャ概要)
- [ステップ1: モジュールクラスの作成](#ステップ1-モジュールクラスの作成)
- [ステップ2: レイアウトファイルの作成](#ステップ2-レイアウトファイルの作成)
- [ステップ3: OnActivatedでウィジェットをバインド](#ステップ3-onactivatedでウィジェットをバインド)
- [ステップ4: ボタンクリックの処理](#ステップ4-ボタンクリックの処理)
- [ステップ5: サーバーにRPCを送信](#ステップ5-サーバーにrpcを送信)
- [ステップ6: サーバーサイドレスポンスの処理](#ステップ6-サーバーサイドレスポンスの処理)
- [ステップ7: 受信データでUIを更新](#ステップ7-受信データでuiを更新)
- [ステップ8: モジュールの登録](#ステップ8-モジュールの登録)
- [完全なファイルリファレンス](#完全なファイルリファレンス)
- [完全な往復の説明](#完全な往復の説明)
- [トラブルシューティング](#トラブルシューティング)
- [次のステップ](#次のステップ)

---

## 何を構築するか

以下の機能を持つ**管理プレイヤー情報**パネルを作成します:

1. シンプルなUIパネルに「更新」ボタンを表示
2. 管理者が更新をクリックすると、プレイヤー数データを要求するRPCをサーバーに送信
3. サーバーがリクエストを受信し、情報を収集して返送
4. クライアントがレスポンスを受信し、UIにプレイヤー数とリストを表示

これは、すべてのネットワーク対応管理ツール、MOD設定パネル、マルチプレイヤーUIで使用される基本パターンを実演します。

---

## 前提条件

- [第8.1章](01-first-mod.md)の動作するMOD、または標準構造の新しいMOD
- [5レイヤースクリプト階層](../02-mod-structure/01-five-layers.md)の理解（`3_Game`、`4_World`、`5_Mission` を使用）
- Enforce Scriptコードの基本的な読解力

### このチュートリアルのMOD構造

以下の新しいファイルを作成します:

```
AdminDemo/
    mod.cpp
    GUI/
        layouts/
            admin_player_info.layout
    Scripts/
        config.cpp
        3_Game/
            AdminDemo/
                AdminDemoRPC.c
        4_World/
            AdminDemo/
                AdminDemoServer.c
        5_Mission/
            AdminDemo/
                AdminDemoPanel.c
                AdminDemoMission.c
```

---

## アーキテクチャ概要

コードを書く前に、データフローを理解してください:

```
CLIENT                              SERVER
------                              ------

1. 管理者が「更新」をクリック
2. クライアントがRPCを送信 ------>  3. サーバーがRPCを受信
   (AdminDemo_RequestInfo)              プレイヤーデータを収集
                                 4. サーバーがRPCを送信 ------>  CLIENT
                                    (AdminDemo_ResponseInfo)
                                                         5. クライアントがRPCを受信
                                                            UIテキストを更新
```

RPC（リモートプロシージャコール）システムは、DayZでクライアントとサーバーが通信する方法です。エンジンはデータ送信用の `GetGame().RPCSingleParam()` と `GetGame().RPC()` メソッド、および受信用の `OnRPC()` オーバーライドを提供します。

**主な制約:**
- クライアントはサーバーサイドのデータ（プレイヤーリスト、サーバー状態）を直接読み取れない
- すべての境界を越える通信はRPCを経由する必要がある
- RPCメッセージは整数IDで識別される
- データは `Param` クラスを使用してシリアル化されたパラメータとして送信される

---

## ステップ1: モジュールクラスの作成

まず、`3_Game`（ゲーム型が利用可能な最も早いレイヤー）でRPC識別子を定義します。RPC IDは `3_Game` で定義する必要があります。`4_World`（サーバーハンドラ）と `5_Mission`（クライアントハンドラ）の両方がそれらを参照するためです。

### `Scripts/3_Game/AdminDemo/AdminDemoRPC.c` を作成

```c
class AdminDemoRPC
{
    // RPC ID -- 他のMODと衝突しないユニークな番号を選択
    // 高い番号を使用すると衝突リスクが減少
    static const int REQUEST_PLAYER_INFO  = 78001;
    static const int RESPONSE_PLAYER_INFO = 78002;
};
```

---

## ステップ2: レイアウトファイルの作成

レイアウトファイルはパネルの視覚的構造を定義します。DayZは `.layout` ファイルにカスタムテキストベース形式（XMLではない）を使用します。

### `GUI/layouts/admin_player_info.layout` を作成

```
FrameWidgetClass AdminDemoPanel {
 size 0.4 0.5
 position 0.3 0.25
 hexactpos 0
 vexactpos 0
 hexactsize 0
 vexactsize 0
 {
  ImageWidgetClass Background {
   size 1 1
   position 0 0
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   color 0.1 0.1 0.1 0.85
  }
  TextWidgetClass Title {
   size 1 0.08
   position 0 0.02
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Player Info Panel"
   "text halign" center
   "text valign" center
   color 1 1 1 1
   font "gui/fonts/MetronBook"
  }
  ButtonWidgetClass RefreshButton {
   size 0.3 0.08
   position 0.35 0.12
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Refresh"
   "text halign" center
   "text valign" center
   color 0.2 0.6 1.0 1.0
  }
  TextWidgetClass PlayerCountText {
   size 1 0.06
   position 0 0.22
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Player Count: --"
   "text halign" center
   "text valign" center
   color 0.9 0.9 0.9 1
   font "gui/fonts/MetronBook"
  }
  TextWidgetClass PlayerListText {
   size 0.9 0.55
   position 0.05 0.3
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Click Refresh to load player data..."
   "text halign" left
   "text valign" top
   color 0.8 0.8 0.8 1
   font "gui/fonts/MetronBook"
  }
  ButtonWidgetClass CloseButton {
   size 0.2 0.06
   position 0.4 0.9
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Close"
   "text halign" center
   "text valign" center
   color 1.0 0.3 0.3 1.0
  }
 }
}
```

すべてのサイズは比例座標（親に対して0.0から1.0）を使用しています。`hexactsize` と `vexactsize` が `0` に設定されているためです。

---

## ステップ3: OnActivatedでウィジェットをバインド

クライアントサイドのパネルスクリプトを作成し、レイアウトを読み込みウィジェットを変数に接続します。ステップ3〜5の完全なコードは[完全なファイルリファレンス](#完全なファイルリファレンス)を参照してください。

### 主要概念

**`CreateWidgets()`** は `.layout` ファイルを読み込み、メモリ内に実際のウィジェットオブジェクトを作成します。ルートウィジェットを返します。

**`FindAnyWidget("name")`** はウィジェットツリーを検索して指定された名前のウィジェットを見つけます。名前はレイアウトファイルのウィジェット名と正確に一致する必要があります。

**`Cast()`** はジェネリックな `Widget` 参照を特定の型（`ButtonWidget` など）に変換します。`FindAnyWidget` はベースの `Widget` 型を返すため必要です。

**`SetHandler(this)`** はこのクラスをウィジェットのイベントハンドラとして登録します。ボタンがクリックされると、エンジンはこのオブジェクトの `OnClick()` を呼び出します。

**`PlayerControlDisable` / `PlayerControlEnable`** はプレイヤーの移動とアクションを無効化/再有効化します。これがないと、ボタンをクリックしようとしている間にプレイヤーが歩き回ります。

---

## ステップ4: ボタンクリックの処理

### OnClickパターン

```c
override bool OnClick(Widget w, int x, int y, int button)
{
    if (w == m_RefreshButton)
    {
        OnRefreshClicked();
        return true;    // イベント消費 -- 伝播を停止
    }

    if (w == m_CloseButton)
    {
        Close();
        return true;
    }

    return false;        // イベント未消費 -- 伝播を許可
}
```

**パラメータ:**
- `w` -- クリックされたウィジェット
- `x`, `y` -- クリック時のマウス座標
- `button` -- どのマウスボタン（0 = 左、1 = 右、2 = 中）

**戻り値:**
- `true` はイベントを処理したことを意味します。親ウィジェットへの伝播が停止します。
- `false` は処理しなかったことを意味します。エンジンが次のハンドラに渡します。

---

## ステップ5: サーバーにRPCを送信

管理者が更新をクリックすると、クライアントからサーバーにメッセージを送信する必要があります。

### RPC送信（クライアントからサーバー）

```c
Man player = GetGame().GetPlayer();
if (player)
{
    Param1<bool> params = new Param1<bool>(true);
    GetGame().RPCSingleParam(player, AdminDemoRPC.REQUEST_PLAYER_INFO, params, true);
}
```

### Paramクラス

DayZはデータ送信用のテンプレート `Param` クラスを提供します:

| クラス | 使用法 |
|-------|-------|
| `Param1<T>` | 1つの値 |
| `Param2<T1, T2>` | 2つの値 |
| `Param3<T1, T2, T3>` | 3つの値 |

---

## ステップ6: サーバーサイドレスポンスの処理

サーバーがクライアントのRPCを受信し、データを収集してレスポンスを返送します。`modded class PlayerBase` で `OnRPC` をオーバーライドし、サーバーサイドでRPCを処理します。完全なコードは[完全なファイルリファレンス](#完全なファイルリファレンス)を参照してください。

### サーバーサイドRPC受信の仕組み

1. **`OnRPC()` がターゲットオブジェクトで呼び出されます。** クライアントが `target = player` でRPCを送信したため、サーバーサイドの `PlayerBase.OnRPC()` が発火します。
2. **常に `super.OnRPC()` を呼び出してください。** 他のMODやバニラコードもこのオブジェクトでRPCを処理する可能性があります。
3. **`GetGame().IsServer()` をチェックしてください。** このコードは `4_World` にあり、クライアントとサーバーの両方でコンパイルされます。`IsServer()` チェックにより、サーバーでのみリクエストを処理します。
4. **`rpc_type` でswitchします。** RPC ID定数と照合します。
5. **レスポンスを送信します。** 要求元プレイヤーのidentityを第5パラメータに設定した `RPCSingleParam` を使用します。

---

## ステップ7: 受信データでUIを更新

クライアントサイドで、サーバーのレスポンスRPCを傍受してパネルにルーティングする必要があります。`modded class MissionGameplay` で `OnRPC` をオーバーライドします。

### クライアントサイドRPC受信の仕組み

1. **`MissionGameplay.OnRPC()`** はクライアントで受信されるRPCのキャッチオールハンドラです。
2. **`ParamsReadContext ctx`** にはサーバーが送信したシリアル化データが含まれます。一致する `Param` 型で `ctx.Read()` を使用してデシリアル化する必要があります。
3. **Param型の一致が重要です。** サーバーが `Param2<int, string>` を送信した場合、クライアントは `Param2<int, string>` で読み取る必要があります。
4. **データをパネルにルーティングします。** デシリアル化後、パネルオブジェクトのメソッドを呼び出してUIを更新します。

---

## ステップ8: モジュールの登録

最後に、config.cppですべてを結び付けます。

### `AdminDemo/mod.cpp` を作成

```cpp
name = "Admin Demo";
author = "YourName";
version = "1.0";
overview = "Tutorial admin panel demonstrating the full RPC roundtrip pattern.";
```

### `AdminDemo/Scripts/config.cpp` を作成

```cpp
class CfgPatches
{
    class AdminDemo_Scripts
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
    class AdminDemo
    {
        dir = "AdminDemo";
        name = "Admin Demo";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "AdminDemo/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "AdminDemo/Scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "AdminDemo/Scripts/5_Mission" };
            };
        };
    };
};
```

### なぜ3つのレイヤーなのか?

| レイヤー | 含むもの | 理由 |
|-------|----------|--------|
| `3_Game` | `AdminDemoRPC.c` | RPC ID定数は `4_World` と `5_Mission` の両方から可視である必要がある |
| `4_World` | `AdminDemoServer.c` | `PlayerBase`（ワールドエンティティ）をmoddingするサーバーサイドハンドラ |
| `5_Mission` | `AdminDemoPanel.c`、`AdminDemoMission.c` | クライアントUIとミッションフック |

---

## 完全なファイルリファレンス

完全なソースコードについては、英語版の[Complete File Reference](../../en/08-tutorials/03-admin-panel.md#complete-file-reference)セクションを参照してください。各ファイルの完全なコードがコメント付きで提供されています。

---

## 完全な往復の説明

管理者がF5を押して更新をクリックしたときの正確なイベントシーケンス:

```
1. [CLIENT] 管理者がF5を押す
   --> MissionGameplay.OnKeyPress(KC_F5)が発火
   --> AdminDemoPanel.Toggle()が呼び出される
   --> パネルが開き、レイアウトが作成され、カーソルが表示

2. [CLIENT] 管理者が「Refresh」ボタンをクリック
   --> AdminDemoPanel.OnClick()が w == m_RefreshButton で発火
   --> OnRefreshClicked()が呼び出される
   --> UIに「Loading...」が表示
   --> RPCSingleParamがREQUEST_PLAYER_INFO (78001)をサーバーに送信

3. [NETWORK] RPCがクライアントからサーバーに伝送

4. [SERVER] PlayerBase.OnRPC()が発火
   --> rpc_typeがREQUEST_PLAYER_INFOと一致
   --> HandlePlayerInfoRequest(sender)が呼び出される
   --> サーバーが接続中の全プレイヤーを反復
   --> プレイヤー数と名前リストを構築
   --> RPCSingleParamがRESPONSE_PLAYER_INFO (78002)をクライアントに返送

5. [NETWORK] RPCがサーバーからクライアントに伝送

6. [CLIENT] MissionGameplay.OnRPC()が発火
   --> rpc_typeがRESPONSE_PLAYER_INFOと一致
   --> HandlePlayerInfoResponse(ctx)が呼び出される
   --> ParamsReadContextからデータがデシリアル化
   --> AdminDemoPanel.OnPlayerInfoReceived()が呼び出される
   --> UIがプレイヤー数と名前で更新

合計時間: ローカルネットワークでは通常100ms未満。
```

---

## トラブルシューティング

### F5を押してもパネルが開かない

- **OnKeyPressのオーバーライドを確認:** `super.OnKeyPress(key)` が最初に呼び出されていることを確認。
- **キーコードを確認:** `KeyCode.KC_F5` が正しい定数です。
- **初期化を確認:** `OnInit()` で `m_AdminDemoPanel` が作成されていることを確認。

### パネルは開くがボタンが動作しない

- **SetHandlerを確認:** すべてのボタンに `button.SetHandler(this)` が呼び出されている必要があります。
- **ウィジェット名を確認:** `FindAnyWidget("RefreshButton")` は大文字小文字を区別します。名前はレイアウトファイルと正確に一致する必要があります。
- **OnClickの戻り値を確認:** 処理されたボタンに対して `OnClick` が `true` を返していることを確認。

### RPCがサーバーに到達しない

- **RPC IDの一意性を確認:** 他のMODが同じRPC ID番号を使用している場合、競合が発生します。
- **プレイヤー参照を確認:** `GetGame().GetPlayer()` はプレイヤーが完全に初期化される前に呼び出すと `null` を返します。
- **サーバーコードがコンパイルされることを確認:** `4_World` コードのサーバースクリプトログで `SCRIPT (E)` エラーを確認。

### サーバーのレスポンスがクライアントに到達しない

- **受信者パラメータを確認:** `RPCSingleParam` の第5パラメータはターゲットクライアントの `PlayerIdentity` である必要があります。
- **Param型の一致を確認:** サーバーが `Param2<int, string>` を送信し、クライアントが `Param2<int, string>` で読み取ること。
- **MissionGameplay.OnRPCオーバーライドを確認:** `super.OnRPC()` を呼び出し、メソッドシグネチャが正しいことを確認。

---

## ベストプラクティス

- **実行前にサーバーですべてのRPCデータを検証してください。** クライアントからのデータを信頼しないでください --- サーバーアクションを実行する前に、常に権限をチェックし、パラメータを検証し、null値に対するガードを行ってください。
- **`FindAnyWidget` をフレームごとに呼び出す代わりに、ウィジェット参照をメンバー変数にキャッシュしてください。** ウィジェットルックアップは無料ではありません。`OnUpdate` や `OnClick` で繰り返し呼び出すとパフォーマンスが無駄になります。
- **インタラクティブウィジェットには常に `SetHandler(this)` を呼び出してください。** これがないと `OnClick()` は発火せず、エラーメッセージもありません --- ボタンは静かに何もしません。
- **高くユニークなRPC ID番号を使用してください。** バニラDayZは低いIDを使用します。70000以上の番号を使用してください。
- **`OnMissionFinish` でウィジェットをクリーンアップしてください。** リークしたウィジェットルートはサーバーホップを跨いで蓄積し、メモリを消費しゴーストUI要素を引き起こします。

---

## 理論と実践

| 概念 | 理論 | 実際 |
|---------|--------|---------|
| `RPCSingleParam` の配信 | `guaranteed=true` を設定するとRPCは常に到達する | プレイヤーが途中で切断したりサーバーがクラッシュした場合、RPCは失われる可能性があります。UIで「レスポンスなし」のケースを常に処理してください（例: タイムアウトメッセージ）。 |
| `OnClick` ウィジェットマッチング | `w == m_Button` でクリックを識別 | `FindAnyWidget` がNULLを返した場合（ウィジェット名のタイプミス）、`m_Button` はNULLで比較は静かに失敗します。`Open()` でウィジェットバインドが失敗した場合は常に警告をログに記録してください。 |
| Param型の一致 | クライアントとサーバーが同じ `Param2<int, string>` を使用 | 型や順序が正確に一致しない場合、`ctx.Read()` はfalseを返しデータは静かに失われます。ランタイムに型チェックエラーメッセージはありません。 |
| リッスンサーバーテスト | 素早い反復には十分 | リッスンサーバーはクライアントとサーバーを1つのプロセスで実行するため、RPCは即座に到着しネットワークを横断しません。タイミングバグ、パケットロス、権限の問題は実際の専用サーバーでのみ表れます。 |

---

## このチュートリアルで学んだこと

このチュートリアルでは以下を学びました:
- レイアウトファイルでUIパネルを作成し、スクリプトでウィジェットをバインドする方法
- `OnClick()` と `SetHandler()` でボタンクリックを処理する方法
- `RPCSingleParam` と `Param` クラスを使用してクライアントからサーバーへ、サーバーからクライアントへRPCを送信する方法
- すべてのネットワーク対応管理ツールで使用される完全なクライアント-サーバー-クライアント往復パターン
- `MissionGameplay` で適切なライフサイクル管理を行いパネルを登録する方法

**次へ:** [第8.4章: チャットコマンドの追加](04-chat-commands.md)

---

**前へ:** [第8.2章: カスタムアイテムの作成](02-custom-item.md)
**次へ:** [第8.4章: チャットコマンドの追加](04-chat-commands.md)
