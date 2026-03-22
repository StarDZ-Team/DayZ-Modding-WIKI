# チャプター 8.8: HUDオーバーレイの構築

[ホーム](../../README.md) | [<< 前へ: Steam Workshopへの公開](07-publishing-workshop.md) | **HUDオーバーレイの構築** | [次へ: プロフェッショナルModテンプレート >>](09-professional-template.md)

---

> **概要:** このチュートリアルでは、画面の右上隅にサーバー情報を表示するカスタムHUDオーバーレイの構築方法を解説します。レイアウトファイルの作成、コントローラークラスの記述、ミッションライフサイクルへのフック、RPC経由でのサーバーからのデータ要求、トグルキーバインドの追加、フェードアニメーションとスマートな表示/非表示による仕上げを行います。最終的に、サーバー名、プレイヤー数、現在のゲーム内時間を表示する控えめなServer Info HUDと、DayZにおけるHUDオーバーレイの仕組みについての確かな理解が得られます。

---

## 目次

- [構築するもの](#構築するもの)
- [前提条件](#前提条件)
- [Mod構造](#mod構造)
- [ステップ1: レイアウトファイルの作成](#ステップ1-レイアウトファイルの作成)
- [ステップ2: HUDコントローラークラスの作成](#ステップ2-hudコントローラークラスの作成)
- [ステップ3: MissionGameplayへのフック](#ステップ3-missiongameplayへのフック)
- [ステップ4: サーバーからのデータ要求](#ステップ4-サーバーからのデータ要求)
- [ステップ5: キーバインドによるトグルの追加](#ステップ5-キーバインドによるトグルの追加)
- [ステップ6: 仕上げ](#ステップ6-仕上げ)
- [完全なコードリファレンス](#完全なコードリファレンス)
- [HUDの拡張](#hudの拡張)
- [よくある間違い](#よくある間違い)
- [次のステップ](#次のステップ)

---

## 構築するもの

画面の右上隅に固定された、半透明の小さなパネルで、3行の情報を表示します：

```
  Aurora Survival [Official]
  Players: 24 / 60
  Time: 14:35
```

パネルはステータスインジケーターの下、クイックバーの上に配置されます。毎フレームではなく1秒に1回更新され、表示時にフェードイン、非表示時にフェードアウトし、インベントリやポーズメニューが開いているときは自動的に非表示になります。プレイヤーは設定可能なキー（デフォルト: **F7**）でオン/オフを切り替えることができます。

### 期待される結果

ロード後、画面の右上領域に暗い半透明の矩形が表示されます。白いテキストで1行目にサーバー名、2行目に現在のプレイヤー数、3行目にゲーム内ワールド時間が表示されます。F7を押すとスムーズにフェードアウトし、もう一度F7を押すとフェードインします。

---

## 前提条件

- 動作するMod構造（先に [チャプター 8.1](01-first-mod.md) を完了してください）
- Enforce Scriptの基本的な構文の理解
- DayZのクライアント-サーバーモデルへの理解（HUDはクライアントで動作し、プレイヤー数はサーバーから取得します）

---

## Mod構造

以下のディレクトリツリーを作成します：

```
ServerInfoHUD/
    mod.cpp
    Scripts/
        config.cpp
        data/
            inputs.xml
        3_Game/
            ServerInfoHUD/
                ServerInfoRPC.c
        4_World/
            ServerInfoHUD/
                ServerInfoServer.c
        5_Mission/
            ServerInfoHUD/
                ServerInfoHUD.c
                MissionHook.c
    GUI/
        layouts/
            ServerInfoHUD.layout
```

`3_Game` レイヤーは定数（RPC ID）を定義します。`4_World` レイヤーはサーバーサイドのレスポンスを処理します。`5_Mission` レイヤーにはHUDクラスとミッションフックが含まれます。レイアウトファイルはウィジェットツリーを定義します。

---

## ステップ1: レイアウトファイルの作成

レイアウトファイル（`.layout`）はXMLでウィジェット階層を定義します。DayZのGUIシステムは、各ウィジェットの位置とサイズを親に対する比率値（0.0から1.0）とピクセルオフセットで表現する座標モデルを使用します。

### `GUI/layouts/ServerInfoHUD.layout`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<layoutset>
  <children>
    <!-- ルートフレーム: 全画面をカバーし、入力を消費しない -->
    <Widget name="ServerInfoRoot" type="FrameWidgetClass">
      <Attribute name="position" value="0 0" />
      <Attribute name="size" value="1 1" />
      <Attribute name="halign" value="0" />
      <Attribute name="valign" value="0" />
      <Attribute name="hexactpos" value="0" />
      <Attribute name="vexactpos" value="0" />
      <Attribute name="hexactsize" value="0" />
      <Attribute name="vexactsize" value="0" />
      <children>
        <!-- 背景パネル: 右上隅 -->
        <Widget name="ServerInfoPanel" type="ImageWidgetClass">
          <Attribute name="position" value="1 0" />
          <Attribute name="size" value="220 70" />
          <Attribute name="halign" value="2" />
          <Attribute name="valign" value="0" />
          <Attribute name="hexactpos" value="0" />
          <Attribute name="vexactpos" value="1" />
          <Attribute name="hexactsize" value="1" />
          <Attribute name="vexactsize" value="1" />
          <Attribute name="color" value="0 0 0 0.55" />
          <children>
            <!-- サーバー名テキスト -->
            <Widget name="ServerNameText" type="TextWidgetClass">
              <Attribute name="position" value="8 6" />
              <Attribute name="size" value="204 20" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="14" />
              <Attribute name="text" value="Server Name" />
              <Attribute name="color" value="1 1 1 0.9" />
              <Attribute name="halign" value="0" />
              <Attribute name="valign" value="0" />
            </Widget>
            <!-- プレイヤー数テキスト -->
            <Widget name="PlayerCountText" type="TextWidgetClass">
              <Attribute name="position" value="8 28" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Players: - / -" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
              <Attribute name="halign" value="0" />
              <Attribute name="valign" value="0" />
            </Widget>
            <!-- ゲーム内時間テキスト -->
            <Widget name="TimeText" type="TextWidgetClass">
              <Attribute name="position" value="8 48" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Time: --:--" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
              <Attribute name="halign" value="0" />
              <Attribute name="valign" value="0" />
            </Widget>
          </children>
        </Widget>
      </children>
    </Widget>
  </children>
</layoutset>
```

### レイアウトの主要な概念

| 属性 | 意味 |
|-----------|---------|
| `halign="2"` | 水平方向の配置: **右**。ウィジェットは親の右端に固定されます。 |
| `valign="0"` | 垂直方向の配置: **上**。 |
| `hexactpos="0"` + `vexactpos="1"` | 水平位置は比率（1.0 = 右端）、垂直位置はピクセルです。 |
| `hexactsize="1"` + `vexactsize="1"` | 幅と高さはピクセル単位（220 x 70）です。 |
| `color="0 0 0 0.55"` | 浮動小数点としてのRGBA。背景パネルは55%の不透明度の黒です。 |

`ServerInfoPanel` は比率X=1.0（右端）と `halign="2"`（右揃え）で配置されているため、パネルの右端が画面の右側に接します。Y位置は上端から0ピクセルです。これによりHUDが右上隅に配置されます。

**なぜパネルにピクセルサイズを使用するのか？** 比率サイズにするとパネルが解像度に応じてスケーリングされますが、小さな情報ウィジェットでは、すべての解像度でテキストが読みやすくなるよう固定ピクセルサイズが望ましいです。

---

## ステップ2: HUDコントローラークラスの作成

コントローラークラスはレイアウトを読み込み、名前でウィジェットを検索し、表示テキストを更新するメソッドを公開します。後でウィジェットイベントを受信できるよう、`ScriptedWidgetEventHandler` を継承します。

### `Scripts/5_Mission/ServerInfoHUD/ServerInfoHUD.c`

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected Widget m_Panel;
    protected TextWidget m_ServerNameText;
    protected TextWidget m_PlayerCountText;
    protected TextWidget m_TimeText;

    protected bool m_IsVisible;
    protected float m_UpdateTimer;

    // 表示データの更新頻度（秒）
    static const float UPDATE_INTERVAL = 1.0;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
    }

    void ~ServerInfoHUD()
    {
        Destroy();
    }

    // HUDを作成して表示する
    void Init()
    {
        if (m_Root)
            return;

        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout"
        );

        if (!m_Root)
        {
            Print("[ServerInfoHUD] ERROR: Failed to load layout file.");
            return;
        }

        m_Panel = m_Root.FindAnyWidget("ServerInfoPanel");
        m_ServerNameText = TextWidget.Cast(
            m_Root.FindAnyWidget("ServerNameText")
        );
        m_PlayerCountText = TextWidget.Cast(
            m_Root.FindAnyWidget("PlayerCountText")
        );
        m_TimeText = TextWidget.Cast(
            m_Root.FindAnyWidget("TimeText")
        );

        m_Root.Show(true);
        m_IsVisible = true;

        // サーバーから初期データを要求する
        RequestServerInfo();
    }

    // すべてのウィジェットを削除する
    void Destroy()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = NULL;
        }
    }

    // MissionGameplay.OnUpdateから毎フレーム呼び出される
    void Update(float timeslice)
    {
        if (!m_Root)
            return;

        if (!m_IsVisible)
            return;

        m_UpdateTimer += timeslice;

        if (m_UpdateTimer >= UPDATE_INTERVAL)
        {
            m_UpdateTimer = 0;
            RefreshTime();
            RequestServerInfo();
        }
    }

    // ゲーム内時間表示を更新する（クライアントサイド、RPCは不要）
    protected void RefreshTime()
    {
        if (!m_TimeText)
            return;

        int year, month, day, hour, minute;
        GetGame().GetWorld().GetDate(year, month, day, hour, minute);

        string hourStr = hour.ToString();
        string minStr = minute.ToString();

        if (hour < 10)
            hourStr = "0" + hourStr;

        if (minute < 10)
            minStr = "0" + minStr;

        m_TimeText.SetText("Time: " + hourStr + ":" + minStr);
    }

    // プレイヤー数とサーバー名を要求するRPCをサーバーに送信する
    protected void RequestServerInfo()
    {
        if (!GetGame().IsMultiplayer())
        {
            // オフラインモード: ローカル情報のみ表示
            SetServerName("Offline Mode");
            SetPlayerCount(1, 1);
            return;
        }

        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        ScriptRPC rpc = new ScriptRPC();
        rpc.Send(player, SIH_RPC_REQUEST_INFO, true, NULL);
    }

    // --- データ到着時に呼び出されるセッター ---

    void SetServerName(string name)
    {
        if (m_ServerNameText)
            m_ServerNameText.SetText(name);
    }

    void SetPlayerCount(int current, int max)
    {
        if (m_PlayerCountText)
        {
            string text = "Players: " + current.ToString()
                + " / " + max.ToString();
            m_PlayerCountText.SetText(text);
        }
    }

    // 表示/非表示を切り替える
    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (m_Root)
            m_Root.Show(m_IsVisible);
    }

    // メニューが開いているときに非表示にする
    void SetMenuState(bool menuOpen)
    {
        if (!m_Root)
            return;

        if (menuOpen)
        {
            m_Root.Show(false);
        }
        else if (m_IsVisible)
        {
            m_Root.Show(true);
        }
    }

    bool IsVisible()
    {
        return m_IsVisible;
    }

    Widget GetRoot()
    {
        return m_Root;
    }
};
```

### 重要な詳細

1. **`CreateWidgets` のパス**: パスはModルートからの相対パスです。`GUI/` フォルダをPBO内にパッキングするため、エンジンはModプレフィックスを使用して `ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout` を解決します。
2. **`FindAnyWidget`**: ウィジェットツリーを名前で再帰的に検索します。キャスト後は必ずNULLチェックを行ってください。
3. **`Widget.Unlink()`**: ウィジェットとそのすべての子をUIツリーから適切に削除します。クリーンアップ時には必ずこれを呼び出してください。
4. **タイマー蓄積パターン**: 各フレームで `timeslice` を加算し、蓄積された時間が `UPDATE_INTERVAL` を超えた場合にのみ動作します。これにより、毎フレームでの処理が防止されます。

---

## ステップ3: MissionGameplayへのフック

`MissionGameplay` クラスはクライアントサイドのミッションコントローラーです。`modded class` を使用して、バニラファイルを置き換えることなくHUDをライフサイクルに注入します。

### `Scripts/5_Mission/ServerInfoHUD/MissionHook.c`

```c
modded class MissionGameplay
{
    protected ref ServerInfoHUD m_ServerInfoHUD;

    override void OnInit()
    {
        super.OnInit();

        // HUDオーバーレイを作成する
        m_ServerInfoHUD = new ServerInfoHUD();
        m_ServerInfoHUD.Init();
    }

    override void OnMissionFinish()
    {
        // superを呼ぶ前にクリーンアップする
        if (m_ServerInfoHUD)
        {
            m_ServerInfoHUD.Destroy();
            m_ServerInfoHUD = NULL;
        }

        super.OnMissionFinish();
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (!m_ServerInfoHUD)
            return;

        // インベントリやメニューが開いているときはHUDを非表示にする
        UIManager uiMgr = GetGame().GetUIManager();
        bool menuOpen = false;

        if (uiMgr)
        {
            UIScriptedMenu topMenu = uiMgr.GetMenu();
            if (topMenu)
                menuOpen = true;
        }

        m_ServerInfoHUD.SetMenuState(menuOpen);

        // HUDデータを更新する（内部でスロットリングされる）
        m_ServerInfoHUD.Update(timeslice);

        // トグルキーを確認する
        Input input = GetGame().GetInput();
        if (input)
        {
            if (GetUApi().GetInputByName("UAServerInfoToggle").LocalPress())
            {
                m_ServerInfoHUD.ToggleVisibility();
            }
        }
    }

    // RPCハンドラーがHUDにアクセスできるようにするアクセサ
    ServerInfoHUD GetServerInfoHUD()
    {
        return m_ServerInfoHUD;
    }
};
```

### このパターンが機能する理由

- **`OnInit`** はプレイヤーがゲームプレイに入ったときに一度だけ実行されます。ここでHUDを作成して初期化します。
- **`OnUpdate`** は毎フレーム実行されます。`timeslice` をHUDに渡し、HUD内部で1秒に1回にスロットリングされます。ここでトグルキーの押下とメニューの表示状態も確認します。
- **`OnMissionFinish`** はプレイヤーが切断したときやミッションが終了したときに実行されます。メモリリークを防ぐためにここでウィジェットを破棄します。

### 重要なルール: 必ずクリーンアップすること

`OnMissionFinish` でウィジェットを破棄し忘れると、ウィジェットルートが次のセッションにリークします。数回のサーバー移動の後、プレイヤーはメモリを消費する積み重なったゴーストウィジェットを抱えることになります。必ず `Init()` と `Destroy()` をペアにしてください。

---

## ステップ4: サーバーからのデータ要求

プレイヤー数はサーバーでのみ把握されています。シンプルなRPC（Remote Procedure Call）の往復が必要です：クライアントがリクエストを送信し、サーバーがデータを読み取って返送します。

### ステップ4a: RPC IDの定義

RPC IDはすべてのMod間で一意でなければなりません。クライアントとサーバーの両方のコードが参照できるよう、`3_Game` レイヤーで定義します。

### `Scripts/3_Game/ServerInfoHUD/ServerInfoRPC.c`

```c
// Server Info HUDのRPC ID。
// バニラや他のModとの衝突を避けるため大きな数値を使用する。

const int SIH_RPC_REQUEST_INFO = 72810;
const int SIH_RPC_RESPONSE_INFO = 72811;
```

**なぜ `3_Game` なのか？** 定数と列挙型は、クライアントとサーバーの両方がアクセスできる最も低いレイヤーに属します。`3_Game` レイヤーは `4_World` と `5_Mission` の前にロードされるため、両側からこれらの値を参照できます。

### ステップ4b: サーバーサイドハンドラー

サーバーは `SIH_RPC_REQUEST_INFO` を監視し、データを収集して `SIH_RPC_RESPONSE_INFO` で応答します。

### `Scripts/4_World/ServerInfoHUD/ServerInfoServer.c`

```c
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (!GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_REQUEST_INFO)
        {
            HandleServerInfoRequest(sender);
        }
    }

    protected void HandleServerInfoRequest(PlayerIdentity sender)
    {
        if (!sender)
            return;

        // サーバー情報を収集する
        string serverName = "";
        GetGame().GetHostName(serverName);

        int playerCount = 0;
        int maxPlayers = 0;

        // プレイヤーリストを取得する
        ref array<Man> players = new array<Man>();
        GetGame().GetPlayers(players);
        playerCount = players.Count();

        // サーバー設定から最大プレイヤー数を取得する
        maxPlayers = GetGame().GetMaxPlayers();

        // リクエスト元のクライアントにレスポンスを返送する
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(serverName);
        rpc.Write(playerCount);
        rpc.Write(maxPlayers);
        rpc.Send(this, SIH_RPC_RESPONSE_INFO, true, sender);
    }
};
```

### ステップ4c: クライアントサイドRPCレシーバー

クライアントがレスポンスを受信してHUDを更新します。

同じ `ServerInfoHUD.c` ファイルに追加するか（末尾、クラスの外側）、`5_Mission/ServerInfoHUD/` に別ファイルを作成します。

`ServerInfoHUD.c` の `ServerInfoHUD` クラスの**下**に以下を追加します：

```c
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_RESPONSE_INFO)
        {
            HandleServerInfoResponse(ctx);
        }
    }

    protected void HandleServerInfoResponse(ParamsReadContext ctx)
    {
        string serverName;
        int playerCount;
        int maxPlayers;

        if (!ctx.Read(serverName))
            return;
        if (!ctx.Read(playerCount))
            return;
        if (!ctx.Read(maxPlayers))
            return;

        // MissionGameplayを通じてHUDにアクセスする
        MissionGameplay mission = MissionGameplay.Cast(
            GetGame().GetMission()
        );

        if (!mission)
            return;

        ServerInfoHUD hud = mission.GetServerInfoHUD();
        if (!hud)
            return;

        hud.SetServerName(serverName);
        hud.SetPlayerCount(playerCount, maxPlayers);
    }
};
```

### RPCフローの仕組み

```
クライアント                      サーバー
  |                                |
  |--- SIH_RPC_REQUEST_INFO ----->|
  |                                | serverName, playerCount, maxPlayersを読み取る
  |<-- SIH_RPC_RESPONSE_INFO ----|
  |                                |
  | HUDテキストを更新              |
```

クライアントは1秒に1回リクエストを送信します（更新タイマーによるスロットリング）。サーバーはRPCコンテキストにパッキングされた3つの値で応答します。クライアントは書き込まれた順序と同じ順序でそれらを読み取ります。

**重要:** `rpc.Write()` と `ctx.Read()` は同じ型を同じ順序で使用する必要があります。サーバーが `string` を1つ、次に `int` 値を2つ書き込む場合、クライアントも `string` を1つ、次に `int` 値を2つ読み取る必要があります。

---

## ステップ5: キーバインドによるトグルの追加

### ステップ5a: `inputs.xml` での入力の定義

DayZは `inputs.xml` を使用してカスタムキーアクションを登録します。ファイルは `Scripts/data/inputs.xml` に配置し、`config.cpp` から参照する必要があります。

### `Scripts/data/inputs.xml`

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAServerInfoToggle" loc="Toggle Server Info HUD" />
        </actions>
    </inputs>
    <preset>
        <input name="UAServerInfoToggle">
            <btn name="kF7" />
        </input>
    </preset>
</modded_inputs>
```

| 要素 | 目的 |
|---------|---------|
| `<actions>` | 入力アクションを名前で宣言します。`loc` はキーバインド設定メニューに表示される表示文字列です。 |
| `<preset>` | デフォルトキーを割り当てます。`kF7` はF7キーに対応します。 |

### ステップ5b: `config.cpp` での `inputs.xml` の参照

`config.cpp` で入力ファイルの場所をエンジンに伝える必要があります。`defs` ブロック内に `inputs` エントリを追加します：

```cpp
class defs
{
    class gameScriptModule
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/3_Game" };
    };

    class worldScriptModule
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/4_World" };
    };

    class missionScriptModule
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/5_Mission" };
    };

    class inputs
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/data" };
    };
};
```

### ステップ5c: キー押下の読み取り

ステップ3の `MissionGameplay` フックで既にこれを処理しています：

```c
if (GetUApi().GetInputByName("UAServerInfoToggle").LocalPress())
{
    m_ServerInfoHUD.ToggleVisibility();
}
```

`GetUApi()` は入力APIシングルトンを返します。`GetInputByName` で登録済みのアクションを検索します。`LocalPress()` はキーが押下されたちょうど1フレームだけ `true` を返します。

### キー名リファレンス

`<btn>` の一般的なキー名：

| キー名 | キー |
|----------|-----|
| `kF1` から `kF12` | ファンクションキー |
| `kH`、`kI` など | アルファベットキー |
| `kNumpad0` から `kNumpad9` | テンキー |
| `kLControl` | 左Control |
| `kLShift` | 左Shift |
| `kLAlt` | 左Alt |

修飾キーの組み合わせはネストを使用します：

```xml
<input name="UAServerInfoToggle">
    <btn name="kLControl">
        <btn name="kH" />
    </btn>
</input>
```

これは「左Controlを押しながらHを押す」という意味です。

---

## ステップ6: 仕上げ

### 6a: フェードイン/フェードアウトアニメーション

DayZはスムーズなアルファ遷移のために `WidgetFadeTimer` を提供しています。`ServerInfoHUD` クラスを更新してこれを使用します：

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    // ... 既存のフィールド ...

    protected ref WidgetFadeTimer m_FadeTimer;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
        m_FadeTimer = new WidgetFadeTimer();
    }

    // ToggleVisibilityメソッドを置き換える:
    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (!m_Root)
            return;

        if (m_IsVisible)
        {
            m_Root.Show(true);
            m_FadeTimer.FadeIn(m_Root, 0.3);
        }
        else
        {
            m_FadeTimer.FadeOut(m_Root, 0.3);
        }
    }

    // ... クラスの残りの部分 ...
};
```

`FadeIn(widget, duration)` は指定された秒数でウィジェットのアルファを0から1にアニメーションします。`FadeOut` は1から0にアニメーションし、完了時にウィジェットを非表示にします。

### 6b: アルファ付き背景パネル

レイアウトで既にこれを設定しています（`color="0 0 0 0.55"`）。55%の不透明度のダークオーバーレイです。実行時にアルファを調整したい場合は：

```c
void SetBackgroundAlpha(float alpha)
{
    if (m_Panel)
    {
        int color = ARGB(
            (int)(alpha * 255),
            0, 0, 0
        );
        m_Panel.SetColor(color);
    }
}
```

`ARGB()` 関数はアルファ、赤、緑、青に対して0-255の整数値を受け取ります。

### 6c: フォントとカラーの選択

DayZにはレイアウトで参照できるいくつかのフォントが同梱されています：

| フォントパス | スタイル |
|-----------|-------|
| `gui/fonts/MetronBook` | クリーンなサンセリフ（バニラHUDで使用） |
| `gui/fonts/MetronMedium` | MetronBookのより太いバージョン |
| `gui/fonts/Metron` | 最も細いバリアント |
| `gui/fonts/luxuriousscript` | 装飾的なスクリプト体（HUDには不向き） |

実行時にテキストカラーを変更するには：

```c
void SetTextColor(TextWidget widget, int r, int g, int b, int a)
{
    if (widget)
        widget.SetColor(ARGB(a, r, g, b));
}
```

### 6d: 他のUIとの共存

`MissionHook.c` は既にメニューが開いていることを検出して `SetMenuState(true)` を呼び出します。インベントリを特に確認するより徹底したアプローチは以下のとおりです：

```c
// modded MissionGameplayのOnUpdateオーバーライド内:
bool menuOpen = false;

UIManager uiMgr = GetGame().GetUIManager();
if (uiMgr)
{
    UIScriptedMenu topMenu = uiMgr.GetMenu();
    if (topMenu)
        menuOpen = true;
}

// インベントリが開いているかも確認する
if (uiMgr && uiMgr.FindMenu(MENU_INVENTORY))
    menuOpen = true;

m_ServerInfoHUD.SetMenuState(menuOpen);
```

これにより、HUDはインベントリ画面、ポーズメニュー、オプション画面、その他のスクリプテッドメニューの背後に隠れます。

---

## 完全なコードリファレンス

以下はMod内のすべてのファイルの最終形です。すべての仕上げが適用されています。

### ファイル1: `ServerInfoHUD/mod.cpp`

```cpp
name = "Server Info HUD";
author = "YourName";
version = "1.0";
overview = "Displays server name, player count, and in-game time.";
```

### ファイル2: `ServerInfoHUD/Scripts/config.cpp`

```cpp
class CfgPatches
{
    class ServerInfoHUD_Scripts
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
    class ServerInfoHUD
    {
        dir = "ServerInfoHUD";
        name = "Server Info HUD";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/3_Game" };
            };

            class worldScriptModule
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/4_World" };
            };

            class missionScriptModule
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/5_Mission" };
            };

            class inputs
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/data" };
            };
        };
    };
};
```

### ファイル3: `ServerInfoHUD/Scripts/data/inputs.xml`

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAServerInfoToggle" loc="Toggle Server Info HUD" />
        </actions>
    </inputs>
    <preset>
        <input name="UAServerInfoToggle">
            <btn name="kF7" />
        </input>
    </preset>
</modded_inputs>
```

### ファイル4: `ServerInfoHUD/Scripts/3_Game/ServerInfoHUD/ServerInfoRPC.c`

```c
// Server Info HUDのRPC ID。
// バニラERPCや他のModとの衝突を避けるため大きな数値を使用する。

const int SIH_RPC_REQUEST_INFO = 72810;
const int SIH_RPC_RESPONSE_INFO = 72811;
```

### ファイル5: `ServerInfoHUD/Scripts/4_World/ServerInfoHUD/ServerInfoServer.c`

```c
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        // このRPCはサーバーのみが処理する
        if (!GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_REQUEST_INFO)
        {
            HandleServerInfoRequest(sender);
        }
    }

    protected void HandleServerInfoRequest(PlayerIdentity sender)
    {
        if (!sender)
            return;

        // サーバー名を取得する
        string serverName = "";
        GetGame().GetHostName(serverName);

        // プレイヤーを数える
        ref array<Man> players = new array<Man>();
        GetGame().GetPlayers(players);
        int playerCount = players.Count();

        // 最大プレイヤースロット数を取得する
        int maxPlayers = GetGame().GetMaxPlayers();

        // リクエスト元のクライアントにデータを返送する
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(serverName);
        rpc.Write(playerCount);
        rpc.Write(maxPlayers);
        rpc.Send(this, SIH_RPC_RESPONSE_INFO, true, sender);
    }
};
```

### ファイル6: `ServerInfoHUD/Scripts/5_Mission/ServerInfoHUD/ServerInfoHUD.c`

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected Widget m_Panel;
    protected TextWidget m_ServerNameText;
    protected TextWidget m_PlayerCountText;
    protected TextWidget m_TimeText;

    protected bool m_IsVisible;
    protected float m_UpdateTimer;
    protected ref WidgetFadeTimer m_FadeTimer;

    static const float UPDATE_INTERVAL = 1.0;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
        m_FadeTimer = new WidgetFadeTimer();
    }

    void ~ServerInfoHUD()
    {
        Destroy();
    }

    void Init()
    {
        if (m_Root)
            return;

        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout"
        );

        if (!m_Root)
        {
            Print("[ServerInfoHUD] ERROR: Failed to load layout.");
            return;
        }

        m_Panel = m_Root.FindAnyWidget("ServerInfoPanel");
        m_ServerNameText = TextWidget.Cast(
            m_Root.FindAnyWidget("ServerNameText")
        );
        m_PlayerCountText = TextWidget.Cast(
            m_Root.FindAnyWidget("PlayerCountText")
        );
        m_TimeText = TextWidget.Cast(
            m_Root.FindAnyWidget("TimeText")
        );

        m_Root.Show(true);
        m_IsVisible = true;

        RequestServerInfo();
    }

    void Destroy()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = NULL;
        }
    }

    void Update(float timeslice)
    {
        if (!m_Root || !m_IsVisible)
            return;

        m_UpdateTimer += timeslice;

        if (m_UpdateTimer >= UPDATE_INTERVAL)
        {
            m_UpdateTimer = 0;
            RefreshTime();
            RequestServerInfo();
        }
    }

    protected void RefreshTime()
    {
        if (!m_TimeText)
            return;

        int year, month, day, hour, minute;
        GetGame().GetWorld().GetDate(year, month, day, hour, minute);

        string hourStr = hour.ToString();
        string minStr = minute.ToString();

        if (hour < 10)
            hourStr = "0" + hourStr;

        if (minute < 10)
            minStr = "0" + minStr;

        m_TimeText.SetText("Time: " + hourStr + ":" + minStr);
    }

    protected void RequestServerInfo()
    {
        if (!GetGame().IsMultiplayer())
        {
            SetServerName("Offline Mode");
            SetPlayerCount(1, 1);
            return;
        }

        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        ScriptRPC rpc = new ScriptRPC();
        rpc.Send(player, SIH_RPC_REQUEST_INFO, true, NULL);
    }

    void SetServerName(string name)
    {
        if (m_ServerNameText)
            m_ServerNameText.SetText(name);
    }

    void SetPlayerCount(int current, int max)
    {
        if (m_PlayerCountText)
        {
            string text = "Players: " + current.ToString()
                + " / " + max.ToString();
            m_PlayerCountText.SetText(text);
        }
    }

    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (!m_Root)
            return;

        if (m_IsVisible)
        {
            m_Root.Show(true);
            m_FadeTimer.FadeIn(m_Root, 0.3);
        }
        else
        {
            m_FadeTimer.FadeOut(m_Root, 0.3);
        }
    }

    void SetMenuState(bool menuOpen)
    {
        if (!m_Root)
            return;

        if (menuOpen)
        {
            m_Root.Show(false);
        }
        else if (m_IsVisible)
        {
            m_Root.Show(true);
        }
    }

    bool IsVisible()
    {
        return m_IsVisible;
    }

    Widget GetRoot()
    {
        return m_Root;
    }
};

// -----------------------------------------------
// クライアントサイドRPCレシーバー
// -----------------------------------------------
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_RESPONSE_INFO)
        {
            HandleServerInfoResponse(ctx);
        }
    }

    protected void HandleServerInfoResponse(ParamsReadContext ctx)
    {
        string serverName;
        int playerCount;
        int maxPlayers;

        if (!ctx.Read(serverName))
            return;
        if (!ctx.Read(playerCount))
            return;
        if (!ctx.Read(maxPlayers))
            return;

        MissionGameplay mission = MissionGameplay.Cast(
            GetGame().GetMission()
        );
        if (!mission)
            return;

        ServerInfoHUD hud = mission.GetServerInfoHUD();
        if (!hud)
            return;

        hud.SetServerName(serverName);
        hud.SetPlayerCount(playerCount, maxPlayers);
    }
};
```

### ファイル7: `ServerInfoHUD/Scripts/5_Mission/ServerInfoHUD/MissionHook.c`

```c
modded class MissionGameplay
{
    protected ref ServerInfoHUD m_ServerInfoHUD;

    override void OnInit()
    {
        super.OnInit();

        m_ServerInfoHUD = new ServerInfoHUD();
        m_ServerInfoHUD.Init();
    }

    override void OnMissionFinish()
    {
        if (m_ServerInfoHUD)
        {
            m_ServerInfoHUD.Destroy();
            m_ServerInfoHUD = NULL;
        }

        super.OnMissionFinish();
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (!m_ServerInfoHUD)
            return;

        // 開いているメニューを検出する
        bool menuOpen = false;
        UIManager uiMgr = GetGame().GetUIManager();
        if (uiMgr)
        {
            UIScriptedMenu topMenu = uiMgr.GetMenu();
            if (topMenu)
                menuOpen = true;
        }

        m_ServerInfoHUD.SetMenuState(menuOpen);
        m_ServerInfoHUD.Update(timeslice);

        // トグルキー
        if (GetUApi().GetInputByName(
            "UAServerInfoToggle"
        ).LocalPress())
        {
            m_ServerInfoHUD.ToggleVisibility();
        }
    }

    ServerInfoHUD GetServerInfoHUD()
    {
        return m_ServerInfoHUD;
    }
};
```

### ファイル8: `ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<layoutset>
  <children>
    <Widget name="ServerInfoRoot" type="FrameWidgetClass">
      <Attribute name="position" value="0 0" />
      <Attribute name="size" value="1 1" />
      <Attribute name="halign" value="0" />
      <Attribute name="valign" value="0" />
      <Attribute name="hexactpos" value="0" />
      <Attribute name="vexactpos" value="0" />
      <Attribute name="hexactsize" value="0" />
      <Attribute name="vexactsize" value="0" />
      <children>
        <Widget name="ServerInfoPanel" type="ImageWidgetClass">
          <Attribute name="position" value="1 0" />
          <Attribute name="size" value="220 70" />
          <Attribute name="halign" value="2" />
          <Attribute name="valign" value="0" />
          <Attribute name="hexactpos" value="0" />
          <Attribute name="vexactpos" value="1" />
          <Attribute name="hexactsize" value="1" />
          <Attribute name="vexactsize" value="1" />
          <Attribute name="color" value="0 0 0 0.55" />
          <children>
            <Widget name="ServerNameText" type="TextWidgetClass">
              <Attribute name="position" value="8 6" />
              <Attribute name="size" value="204 20" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="14" />
              <Attribute name="text" value="Server Name" />
              <Attribute name="color" value="1 1 1 0.9" />
            </Widget>
            <Widget name="PlayerCountText" type="TextWidgetClass">
              <Attribute name="position" value="8 28" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Players: - / -" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
            </Widget>
            <Widget name="TimeText" type="TextWidgetClass">
              <Attribute name="position" value="8 48" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Time: --:--" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
            </Widget>
          </children>
        </Widget>
      </children>
    </Widget>
  </children>
</layoutset>
```

---

## HUDの拡張

基本的なHUDが動作するようになったら、以下は自然な拡張です。

### FPS表示の追加

FPSはRPCなしでクライアントサイドで読み取ることができます：

```c
// TextWidget m_FPSTextフィールドを追加し、Init()で検索する

protected void RefreshFPS()
{
    if (!m_FPSText)
        return;

    float fps = 1.0 / GetGame().GetDeltaT();
    m_FPSText.SetText("FPS: " + Math.Round(fps).ToString());
}
```

updateメソッドで `RefreshTime()` と一緒に `RefreshFPS()` を呼び出します。`GetDeltaT()` は現在のフレームの時間を返すため、FPS値は変動します。よりスムーズな表示のために、複数フレームにわたって平均化します：

```c
protected float m_FPSAccum;
protected int m_FPSFrames;

protected void RefreshFPS()
{
    if (!m_FPSText)
        return;

    m_FPSAccum += GetGame().GetDeltaT();
    m_FPSFrames++;

    float avgFPS = m_FPSFrames / m_FPSAccum;
    m_FPSText.SetText("FPS: " + Math.Round(avgFPS).ToString());

    // メインタイマーが発火するたびにリセットする（毎秒）
    m_FPSAccum = 0;
    m_FPSFrames = 0;
}
```

### プレイヤー位置の追加

```c
protected void RefreshPosition()
{
    if (!m_PositionText)
        return;

    Man player = GetGame().GetPlayer();
    if (!player)
        return;

    vector pos = player.GetPosition();
    string text = "Pos: " + Math.Round(pos[0]).ToString()
        + " / " + Math.Round(pos[2]).ToString();
    m_PositionText.SetText(text);
}
```

### 複数のHUDパネル

複数のパネル（コンパス、ステータス、ミニマップ）の場合、HUD要素の配列を保持する親マネージャークラスを作成します：

```c
class HUDManager
{
    protected ref array<ref ServerInfoHUD> m_Panels;

    void HUDManager()
    {
        m_Panels = new array<ref ServerInfoHUD>();
    }

    void AddPanel(ServerInfoHUD panel)
    {
        m_Panels.Insert(panel);
    }

    void UpdateAll(float timeslice)
    {
        int count = m_Panels.Count();
        int i = 0;
        while (i < count)
        {
            m_Panels.Get(i).Update(timeslice);
            i++;
        }
    }
};
```

### ドラッグ可能なHUD要素

ウィジェットをドラッグ可能にするには、`ScriptedWidgetEventHandler` を介してマウスイベントを処理する必要があります：

```c
class DraggableHUD : ScriptedWidgetEventHandler
{
    protected bool m_Dragging;
    protected float m_OffsetX;
    protected float m_OffsetY;
    protected Widget m_DragWidget;

    override bool OnMouseButtonDown(Widget w, int x, int y, int button)
    {
        if (w == m_DragWidget && button == 0)
        {
            m_Dragging = true;
            float wx, wy;
            m_DragWidget.GetScreenPos(wx, wy);
            m_OffsetX = x - wx;
            m_OffsetY = y - wy;
            return true;
        }
        return false;
    }

    override bool OnMouseButtonUp(Widget w, int x, int y, int button)
    {
        if (button == 0)
            m_Dragging = false;
        return false;
    }

    override bool OnUpdate(Widget w, int x, int y, int oldX, int oldY)
    {
        if (m_Dragging && m_DragWidget)
        {
            m_DragWidget.SetPos(x - m_OffsetX, y - m_OffsetY);
            return true;
        }
        return false;
    }
};
```

注意: ドラッグを機能させるには、イベントハンドラーがイベントを受信できるよう、ウィジェットに `SetHandler(this)` を呼び出す必要があります。また、カーソルが表示されている必要があるため、ドラッグ可能なHUDはメニューや編集モードがアクティブな状況に限定されます。

---

## よくある間違い

### 1. スロットリングせず毎フレーム更新する

**間違い:**

```c
override void OnUpdate(float timeslice)
{
    super.OnUpdate(timeslice);
    m_ServerInfoHUD.RefreshTime();      // 毎秒60回以上実行される！
    m_ServerInfoHUD.RequestServerInfo(); // 毎秒60回以上のRPCを送信！
}
```

**正しい方法:** チュートリアルで示したようにタイマー蓄積を使用して、高コストの操作を最大でも1秒に1回に制限します。毎フレーム変わるHUDテキスト（FPSカウンターなど）はフレームごとの更新で問題ありませんが、RPCリクエストは必ずスロットリングする必要があります。

### 2. OnMissionFinishでクリーンアップしない

**間違い:**

```c
modded class MissionGameplay
{
    ref ServerInfoHUD m_HUD;

    override void OnInit()
    {
        super.OnInit();
        m_HUD = new ServerInfoHUD();
        m_HUD.Init();
        // クリーンアップなし -- 切断時にウィジェットがリークする！
    }
};
```

**正しい方法:** 必ず `OnMissionFinish()` でウィジェットを破棄し参照をnullにしてください。デストラクタ（`~ServerInfoHUD`）はセーフティネットですが、それに頼らないでください -- `OnMissionFinish` が明示的なクリーンアップの正しい場所です。

### 3. HUDが他のUI要素の背後に表示される

後で作成されたウィジェットは、先に作成されたウィジェットの上にレンダリングされます。HUDがバニラUIの背後に表示される場合、作成タイミングが早すぎます。解決策：

- HUDを初期化シーケンスの後半で作成する（例: `OnInit` ではなく最初の `OnUpdate` 呼び出し時）。
- `m_Root.SetSort(100)` を使用してソート順序を強制的に高くし、ウィジェットを他の要素の上に押し上げる。

### 4. データの過剰な要求（RPCスパム）

毎フレームRPCを送信すると、接続されたプレイヤーごとに毎秒60以上のネットワークパケットが作成されます。60人のサーバーでは、毎秒3,600パケットの不要なトラフィックになります。RPCリクエストは必ずスロットリングしてください。重要でない情報には1秒に1回が妥当です。滅多に変わらないデータ（サーバー名など）は、初期化時に一度だけリクエストしてキャッシュすることもできます。

### 5. `super` 呼び出しの忘れ

```c
// 間違い: バニラHUDの機能が壊れる
override void OnInit()
{
    m_HUD = new ServerInfoHUD();
    m_HUD.Init();
    // super.OnInit()がない！バニラHUDが初期化されない。
}
```

必ず `super.OnInit()`（および `super.OnUpdate()`、`super.OnMissionFinish()`）を最初に呼び出してください。super呼び出しを省略すると、バニラの実装と同じメソッドをフックしている他のすべてのModが壊れます。

### 6. 間違ったスクリプトレイヤーの使用

`4_World` から `MissionGameplay` を参照しようとすると、`5_Mission` の型が `4_World` からは見えないため「Undefined type」エラーが発生します。RPC定数は `3_Game` に、サーバーハンドラーは `4_World` に（そこに存在する `PlayerBase` をmodする）、HUDクラスとミッションフックは `5_Mission` に配置します。

### 7. ハードコードされたレイアウトパス

`CreateWidgets()` のレイアウトパスはゲームの検索パスに対する相対パスです。PBOプレフィックスがパス文字列と一致しない場合、レイアウトはロードされず `CreateWidgets` はNULLを返します。`CreateWidgets` の後は必ずNULLチェックを行い、失敗した場合はエラーをログに記録してください。

---

## 次のステップ

HUDオーバーレイが動作するようになったら、以下の発展を検討してください：

1. **ユーザー設定の保存** -- HUDが表示されているかどうかをローカルJSONファイルに保存し、トグル状態がセッション間で持続するようにします。
2. **サーバーサイド設定の追加** -- サーバー管理者がJSON設定ファイルを通じてHUDの有効/無効や表示するフィールドを選択できるようにします。
3. **管理者オーバーレイの構築** -- HUDを拡張して、権限チェックを使用した管理者専用情報（サーバーパフォーマンス、エンティティ数、再起動タイマー）を表示します。
4. **コンパスHUDの作成** -- `GetGame().GetCurrentCameraDirection()` を使用して方角を計算し、画面上部にコンパスバーを表示します。
5. **既存のModを研究する** -- DayZ Expansionのクエストストから HUDやColorful UIのオーバーレイシステムを参考にして、プロダクション品質のHUD実装を学びます。

---

## ベストプラクティス

- **`OnUpdate` を最低1秒間隔にスロットリングしてください。** タイマー蓄積を使用して、高コストの操作（RPCリクエスト、テキストフォーマット）が毎秒60回以上実行されることを避けます。FPSカウンターのようなフレームごとの視覚要素のみ毎フレーム更新してください。
- **インベントリやメニューが開いているときはHUDを非表示にしてください。** 各更新で `GetGame().GetUIManager().GetMenu()` をチェックしてオーバーレイを抑制します。重複するUI要素はプレイヤーを混乱させ、インタラクションをブロックします。
- **必ず `OnMissionFinish` でウィジェットをクリーンアップしてください。** リークしたウィジェットルートはサーバー移動後も持続し、メモリを消費するゴーストパネルが積み重なり、最終的に視覚的な不具合を引き起こします。
- **`SetSort()` でレンダリング順序を制御してください。** HUDがバニラ要素の背後に表示される場合、`m_Root.SetSort(100)` を呼び出して上に押し上げます。明示的なソート順序がない場合、作成タイミングがレイヤリングを決定します。
- **滅多に変わらないサーバーデータをキャッシュしてください。** サーバー名はセッション中に変わりません。毎秒再リクエストするのではなく、初期化時に一度だけリクエストしてローカルにキャッシュしてください。

---

## 理論と実践

| 概念 | 理論 | 現実 |
|---------|--------|---------|
| `OnUpdate(float timeslice)` | フレームのデルタ時間とともに毎フレーム呼び出される | 144 FPSのクライアントでは、毎秒144回発火します。各呼び出しでRPCを送信すると、プレイヤーごとに毎秒144のネットワークパケットが作成されます。必ず `timeslice` を蓄積し、合計がインターバルを超えた場合にのみ動作してください。 |
| `CreateWidgets()` のレイアウトパス | 指定したパスからレイアウトを読み込む | パスはファイルシステムではなくPBOプレフィックスに対する相対パスです。PBOプレフィックスがパス文字列と一致しない場合、`CreateWidgets` はログにエラーを出さずにNULLを返します。 |
| `WidgetFadeTimer` | ウィジェットの不透明度をスムーズにアニメーションする | `FadeOut` はアニメーション完了後にウィジェットを非表示にしますが、`FadeIn` は最初に `Show(true)` を呼び出しません。`FadeIn` を呼ぶ前に手動でウィジェットを表示する必要があり、そうしないと何も表示されません。 |
| `GetUApi().GetInputByName()` | カスタムキーバインドの入力アクションを返す | `inputs.xml` が `config.cpp` の `class inputs` で参照されていない場合、アクション名は不明となり `GetInputByName` はnullを返し、`.LocalPress()` でクラッシュします。 |

---

## 学んだこと

このチュートリアルで学んだことは以下のとおりです：
- 固定された半透明パネルを持つHUDレイアウトの作成方法
- 固定間隔に更新をスロットリングするコントローラークラスの構築方法
- HUDライフサイクル管理（初期化、更新、クリーンアップ）のための `MissionGameplay` へのフック方法
- RPC経由でサーバーデータを要求しクライアントに表示する方法
- `inputs.xml` によるカスタムキーバインドの登録とフェードアニメーションによるHUD表示/非表示の切り替え方法

**前へ:** [チャプター 8.7: Steam Workshopへの公開](07-publishing-workshop.md)
