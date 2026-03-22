# チャプター 8.9: プロフェッショナルModテンプレート

[ホーム](../README.md) | [<< 前へ: HUDオーバーレイの構築](08-hud-overlay.md) | **プロフェッショナルModテンプレート** | [次へ: カスタム車両の作成 >>](10-vehicle-mod.md)

---

> **概要:** このチャプターでは、プロフェッショナルなDayZ Modに必要なすべてのファイルを含む、完全なプロダクション対応のModテンプレートを提供します。スターターの骨格を紹介する [チャプター 8.5](05-mod-template.md) のInclementDabのテンプレートとは異なり、これは設定システム、シングルトンマネージャー、クライアント-サーバーRPC、UIパネル、キーバインド、ローカライゼーション、ビルド自動化を備えた本格的なテンプレートです。すべてのファイルはコピー&ペーストで使用でき、各行の存在理由を説明する詳細なコメント付きです。

---

## 目次

- [概要](#概要)
- [完全なディレクトリ構造](#完全なディレクトリ構造)
- [mod.cpp](#modcpp)
- [config.cpp](#configcpp)
- [定数ファイル (3_Game)](#定数ファイル-3_game)
- [設定データクラス (3_Game)](#設定データクラス-3_game)
- [RPC定義 (3_Game)](#rpc定義-3_game)
- [マネージャーシングルトン (4_World)](#マネージャーシングルトン-4_world)
- [プレイヤーイベントハンドラー (4_World)](#プレイヤーイベントハンドラー-4_world)
- [ミッションフック: サーバー (5_Mission)](#ミッションフック-サーバー-5_mission)
- [ミッションフック: クライアント (5_Mission)](#ミッションフック-クライアント-5_mission)
- [UIパネルスクリプト (5_Mission)](#uiパネルスクリプト-5_mission)
- [レイアウトファイル](#レイアウトファイル)
- [stringtable.csv](#stringtablecsv)
- [Inputs.xml](#inputsxml)
- [ビルドスクリプト](#ビルドスクリプト)
- [カスタマイズガイド](#カスタマイズガイド)
- [機能拡張ガイド](#機能拡張ガイド)
- [次のステップ](#次のステップ)

---

## 概要

「Hello World」Modはツールチェーンの動作を証明するものです。プロフェッショナルなModにはさらに多くのものが必要です：

| 関心事 | Hello World | プロフェッショナルテンプレート |
|---------|-------------|----------------------|
| 設定 | ハードコードされた値 | ロード/保存/デフォルト付きのJSON設定 |
| 通信 | Print文 | 文字列ルーティングRPC（クライアントからサーバーへ、およびその逆） |
| アーキテクチャ | 1ファイル、1関数 | シングルトンマネージャー、レイヤードスクリプト、クリーンなライフサイクル |
| ユーザーインターフェース | なし | 開閉機能付きのレイアウト駆動UIパネル |
| 入力バインド | なし | オプション > コントロールのカスタムキーバインド |
| ローカライゼーション | なし | 13言語対応のstringtable.csv |
| ビルドパイプライン | 手動のAddon Builder | ワンクリックバッチスクリプト |
| クリーンアップ | なし | ミッション終了時の適切なシャットダウン、リークなし |

このテンプレートはこれらすべてをすぐに使える状態で提供します。識別子を名前変更し、不要なシステムを削除して、堅実な基盤の上に実際の機能の構築を開始できます。

---

## 完全なディレクトリ構造

これは完全なソースレイアウトです。以下に記載されているすべてのファイルは、このチャプターで完全なテンプレートとして提供されます。

```
MyProfessionalMod/                          <-- ソースルート（P:ドライブに配置）
    mod.cpp                                 <-- ランチャーメタデータ
    Scripts/
        config.cpp                          <-- エンジン登録（CfgPatches + CfgMods）
        Inputs.xml                          <-- キーバインド定義
        stringtable.csv                     <-- ローカライズされた文字列（13言語）
        3_Game/
            MyMod/
                MyModConstants.c            <-- 列挙型、バージョン文字列、共有定数
                MyModConfig.c               <-- デフォルト付きのJSONシリアライズ可能な設定
                MyModRPC.c                  <-- RPCルート名と登録
        4_World/
            MyMod/
                MyModManager.c              <-- シングルトンマネージャー（ライフサイクル、設定、状態）
                MyModPlayerHandler.c        <-- プレイヤー接続/切断フック
        5_Mission/
            MyMod/
                MyModMissionServer.c        <-- modded MissionServer（サーバー初期化/シャットダウン）
                MyModMissionClient.c        <-- modded MissionGameplay（クライアント初期化/シャットダウン）
                MyModUI.c                   <-- UIパネルスクリプト（開閉/データ投入）
        GUI/
            layouts/
                MyModPanel.layout           <-- UIレイアウト定義
    build.bat                               <-- PBOパッキング自動化

ビルド後の配布可能なModフォルダは以下のようになります：

@MyProfessionalMod/                         <-- サーバー / Workshopに配置するもの
    mod.cpp
    addons/
        MyProfessionalMod_Scripts.pbo       <-- Scripts/ からパッキング
    keys/
        MyMod.bikey                         <-- 署名サーバー用のキー
    meta.cpp                                <-- Workshopメタデータ（自動生成）
```

---

## mod.cpp

このファイルはDayZランチャーでプレイヤーに表示される内容を制御します。Modルートに配置し、`Scripts/` 内には**配置しません**。

```cpp
// ==========================================================================
// mod.cpp - DayZランチャー用のMod識別情報
// このファイルはランチャーがModリストにMod情報を表示するために読み取ります。
// スクリプトエンジンではコンパイルされません -- 純粋なメタデータです。
// ==========================================================================

// ランチャーのModリストとゲーム内Mod画面に表示される表示名。
name         = "My Professional Mod";

// あなたの名前またはチーム名。「Author」列に表示されます。
author       = "YourName";

// セマンティックバージョン文字列。リリースごとに更新してください。
// ランチャーはこれを表示し、プレイヤーがどのバージョンを持っているかを確認できます。
version      = "1.0.0";

// ランチャーでModにカーソルを合わせたときに表示される短い説明。
// 読みやすさのため200文字以内に収めてください。
overview     = "A professional mod template with config, RPC, UI, and keybinds.";

// ホバー時に表示されるツールチップ。通常はMod名と一致させます。
tooltipOwned = "My Professional Mod";

// オプション: プレビュー画像のパス（Modルートからの相対パス）。
// 推奨サイズ: 256x256 または 512x512、PAAまたはEDDS形式。
// 画像がまだない場合は空にしておきます。
picture      = "";

// オプション: Mod詳細パネルに表示されるロゴ。
logo         = "";
logoSmall    = "";
logoOver     = "";

// オプション: プレイヤーがランチャーで「Website」をクリックしたときに開かれるURL。
action       = "";
actionURL    = "";
```

---

## config.cpp

これは最も重要なファイルです。エンジンにModを登録し、依存関係を宣言し、スクリプトレイヤーを接続し、オプションでプリプロセッサ定義とイメージセットを設定します。

`Scripts/config.cpp` に配置します。

```cpp
// ==========================================================================
// config.cpp - エンジン登録
// DayZエンジンはこれを読み取り、Modが提供するものを把握します。
// 2つのセクションが重要: CfgPatches（依存関係グラフ）と CfgMods（スクリプトの読み込み）。
// ==========================================================================

// --------------------------------------------------------------------------
// CfgPatches - 依存関係宣言
// エンジンはこれを使用してロード順序を決定します。Modが他のModに
// 依存する場合、そのModのCfgPatchesクラスをrequiredAddons[]に記載します。
// --------------------------------------------------------------------------
class CfgPatches
{
    // クラス名はすべてのMod間でグローバルに一意でなければなりません。
    // 規約: ModName_Scripts（PBO名と一致させる）。
    class MyMod_Scripts
    {
        // units[] と weapons[] はこのアドオンが定義する設定クラスを宣言します。
        // スクリプトのみのModでは、これらを空にしておきます。新しいアイテム、
        // 武器、車両をconfig.cppで定義するModで使用されます。
        units[] = {};
        weapons[] = {};

        // 最小エンジンバージョン。0.1は現在のすべてのDayZバージョンで動作します。
        requiredVersion = 0.1;

        // 依存関係: 他のModのCfgPatchesクラス名を記載します。
        // "DZ_Data" はベースゲーム -- すべてのModがこれに依存すべきです。
        // Community Frameworkを使用する場合は "CF_Scripts" を追加します。
        // 他のModを拡張する場合はそのModのパッチを追加します。
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

// --------------------------------------------------------------------------
// CfgMods - スクリプトモジュール登録
// 各スクリプトレイヤーの場所と設定する定義をエンジンに伝えます。
// --------------------------------------------------------------------------
class CfgMods
{
    // ここのクラス名はModの内部識別子です。
    // CfgPatchesと一致させる必要はありませんが、関連させておくと
    // コードベースの移動が容易になります。
    class MyMod
    {
        // dir: P:ドライブ上のフォルダ名（またはPBO内）。
        // 実際のルートフォルダ名と正確に一致する必要があります。
        dir = "MyProfessionalMod";

        // 表示名（WorkbenchおよびエンジンログのI一部に表示されます）。
        name = "My Professional Mod";

        // エンジンメタデータ用の作者と説明。
        author = "YourName";
        overview = "Professional mod template";

        // Modタイプ。スクリプトModでは常に "mod" です。
        type = "mod";

        // credits: オプションのCredits.jsonファイルへのパス。
        // creditsJson = "MyProfessionalMod/Scripts/Credits.json";

        // inputs: カスタムキーバインド用のInputs.xmlへのパス。
        // エンジンがキーバインドを読み込むためにはここで設定が必要です。
        inputs = "MyProfessionalMod/Scripts/Inputs.xml";

        // defines: Modがロードされたときに設定されるプリプロセッサシンボル。
        // 他のModは #ifdef MYMOD を使用してModの存在を検出し、
        // 条件付きでインテグレーションコードをコンパイルできます。
        defines[] = { "MYMOD" };

        // dependencies: Modがフックするバニラスクリプトモジュール。
        // "Game" = 3_Game, "World" = 4_World, "Mission" = 5_Mission。
        // ほとんどのModは3つすべてが必要です。1_Coreを使用する場合のみ "Core" を追加します。
        dependencies[] =
        {
            "Game", "World", "Mission"
        };

        // defs: 各スクリプトモジュールをディスク上のフォルダにマッピングします。
        // エンジンはこれらのパス内で再帰的に見つかったすべての.cファイルをコンパイルします。
        // Enforce Scriptには#includeがありません -- これがファイルの読み込み方法です。
        class defs
        {
            // imageSets: レイアウトで使用する.imagesetファイルを登録します。
            // UI用のカスタムアイコン/テクスチャがある場合にのみ必要です。
            // imagesetを追加する場合はコメント解除してパスを更新してください。
            //
            // class imageSets
            // {
            //     files[] =
            //     {
            //         "MyProfessionalMod/GUI/imagesets/mymod_icons.imageset"
            //     };
            // };

            // Gameレイヤー（3_Game）: 最初にロードされます。
            // 列挙型、定数、設定クラス、RPC定義をここに配置します。
            // 4_World や 5_Mission の型を参照できません。
            class gameScriptModule
            {
                value = "";
                files[] = { "MyProfessionalMod/Scripts/3_Game" };
            };

            // Worldレイヤー（4_World）: 2番目にロードされます。
            // マネージャー、エンティティ変更、ワールドインタラクションをここに配置します。
            // 3_Game の型を参照できます。5_Mission の型を参照できません。
            class worldScriptModule
            {
                value = "";
                files[] = { "MyProfessionalMod/Scripts/4_World" };
            };

            // Missionレイヤー（5_Mission）: 最後にロードされます。
            // ミッションフック、UIパネル、起動/シャットダウンロジックをここに配置します。
            // すべての下位レイヤーの型を参照できます。
            class missionScriptModule
            {
                value = "";
                files[] = { "MyProfessionalMod/Scripts/5_Mission" };
            };
        };
    };
};
```

---

## 定数ファイル (3_Game)

`Scripts/3_Game/MyMod/MyModConstants.c` に配置します。

このファイルはすべての共有定数、列挙型、バージョン文字列を定義します。すべての上位レイヤーがこれらの値にアクセスできるよう `3_Game` に配置します。

```c
// ==========================================================================
// MyModConstants.c - 共有定数と列挙型
// 3_Gameレイヤー: すべての上位レイヤー（4_World、5_Mission）で利用可能。
//
// このファイルが存在する理由:
//   定数を集中化することで、ファイル全体に散らばるマジックナンバーを防ぎます。
//   列挙型は生のint比較の代わりにコンパイル時の安全性を提供します。
//   バージョン文字列は一度だけ定義され、ログとUIで使用されます。
// ==========================================================================

// ---------------------------------------------------------------------------
// バージョン - リリースごとに更新する
// ---------------------------------------------------------------------------
const string MYMOD_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// ログタグ - このModからのすべてのPrint/ログメッセージのプレフィックス
// 一貫したタグを使用することで、スクリプトログのフィルタリングが容易になります。
// ---------------------------------------------------------------------------
const string MYMOD_TAG = "[MyMod]";

// ---------------------------------------------------------------------------
// ファイルパス - タイプミスが1箇所で検出されるよう集中化
// $profile: は実行時にサーバーのプロファイルディレクトリに解決されます。
// ---------------------------------------------------------------------------
const string MYMOD_CONFIG_DIR  = "$profile:MyMod";
const string MYMOD_CONFIG_PATH = "$profile:MyMod/config.json";

// ---------------------------------------------------------------------------
// 列挙型: 機能モード
// 可読性とコンパイル時チェックのため、生のintの代わりに列挙型を使用します。
// ---------------------------------------------------------------------------
enum MyModMode
{
    DISABLED = 0,    // 機能はオフ
    PASSIVE  = 1,    // 機能は動作するが干渉しない
    ACTIVE   = 2     // 機能は完全に有効
};

// ---------------------------------------------------------------------------
// 列挙型: 通知タイプ（UIがアイコン/色を選択するために使用）
// ---------------------------------------------------------------------------
enum MyModNotifyType
{
    INFO    = 0,
    SUCCESS = 1,
    WARNING = 2,
    ERROR   = 3
};
```

---

## 設定データクラス (3_Game)

`Scripts/3_Game/MyMod/MyModConfig.c` に配置します。

これはJSONシリアライズ可能な設定クラスです。サーバーは起動時にこれを読み込みます。ファイルが存在しない場合、デフォルト値が使用され、新しい設定がディスクに保存されます。

```c
// ==========================================================================
// MyModConfig.c - デフォルト付きのJSON設定
// 3_Gameレイヤー: 4_Worldのマネージャーと5_Missionのフックの両方が読み取れるように。
//
// 仕組み:
//   JsonFileLoader<MyModConfig> はEnforce Script組み込みのJSON
//   シリアライザーを使用します。デフォルト値を持つすべてのフィールドが
//   JSONファイルに書き込み/読み取りされます。新しいフィールドの追加は安全です
//   -- 古い設定ファイルでは不足フィールドにデフォルト値が使用されます。
//
// ENFORCE SCRIPTの注意点:
//   JsonFileLoader<T>.JsonLoadFile(path, obj) はVOIDを返します。
//   if (JsonFileLoader<T>.JsonLoadFile(...)) とすることはできません -- コンパイルできません。
//   必ず事前作成されたオブジェクトを参照で渡してください。
// ==========================================================================

class MyModConfig
{
    // --- 一般設定 ---

    // マスタースイッチ: falseの場合、Mod全体が無効になります。
    bool Enabled = true;

    // マネージャーが更新ティックを実行する頻度（秒）。
    // 低い値 = より応答性が高いがCPUコストが高くなります。
    float UpdateInterval = 5.0;

    // このModが同時に管理するアイテム/エンティティの最大数。
    int MaxItems = 100;

    // モード: 0 = DISABLED, 1 = PASSIVE, 2 = ACTIVE（MyModMode列挙型を参照）。
    int Mode = 2;

    // --- メッセージ ---

    // プレイヤーが接続したときに表示されるウェルカムメッセージ。
    // 空文字列 = メッセージなし。
    string WelcomeMessage = "Welcome to the server!";

    // ウェルカムメッセージを通知として表示するかチャットメッセージとして表示するか。
    bool WelcomeAsNotification = true;

    // --- ロギング ---

    // 詳細なデバッグログを有効にする。本番サーバーではオフにしてください。
    bool DebugLogging = false;

    // -----------------------------------------------------------------------
    // Load - ディスクから設定を読み取り、存在しない場合はデフォルトのインスタンスを返す
    // -----------------------------------------------------------------------
    static MyModConfig Load()
    {
        // まず新しいインスタンスを作成します。JSONファイルにフィールドが
        // 不足している場合（例: 新しい設定を追加したアップデート後）でも
        // すべてのデフォルトが設定されることを保証します。
        MyModConfig cfg = new MyModConfig();

        // 読み込みを試みる前に設定ファイルが存在するか確認します。
        // 初回実行時には存在しないため、デフォルトを使用して保存します。
        if (FileExist(MYMOD_CONFIG_PATH))
        {
            // JsonLoadFileは既存のオブジェクトにデータを投入します。
            // 新しいオブジェクトを返すものではありません。JSONに存在するフィールドは
            // デフォルトを上書きし、JSONにないフィールドはデフォルト値を保持します。
            JsonFileLoader<MyModConfig>.JsonLoadFile(MYMOD_CONFIG_PATH, cfg);
        }
        else
        {
            // 初回実行: 管理者が編集できるファイルとしてデフォルトを保存します。
            cfg.Save();
            Print(MYMOD_TAG + " No config found, created default at: " + MYMOD_CONFIG_PATH);
        }

        return cfg;
    }

    // -----------------------------------------------------------------------
    // Save - 現在の値をフォーマット済みJSONとしてディスクに書き込む
    // -----------------------------------------------------------------------
    void Save()
    {
        // ディレクトリが存在することを確認します。MakeDirectoryは
        // ディレクトリが既に存在しても安全に呼び出せます。
        if (!FileExist(MYMOD_CONFIG_DIR))
        {
            MakeDirectory(MYMOD_CONFIG_DIR);
        }

        // JsonSaveFileはすべてのフィールドをJSONオブジェクトとして書き込みます。
        // ファイルは完全に上書きされます -- マージはありません。
        JsonFileLoader<MyModConfig>.JsonSaveFile(MYMOD_CONFIG_PATH, this);
    }
};
```

ディスク上の `config.json` は以下のようになります：

```json
{
    "Enabled": true,
    "UpdateInterval": 5.0,
    "MaxItems": 100,
    "Mode": 2,
    "WelcomeMessage": "Welcome to the server!",
    "WelcomeAsNotification": true,
    "DebugLogging": false
}
```

管理者はこのファイルを編集し、サーバーを再起動すると新しい値が反映されます。

---

## RPC定義 (3_Game)

`Scripts/3_Game/MyMod/MyModRPC.c` に配置します。

RPC（Remote Procedure Call）はDayZでクライアントとサーバーが通信する方法です。このファイルはルート名を定義し、登録用のヘルパーメソッドを提供します。

```c
// ==========================================================================
// MyModRPC.c - RPCルート定義とヘルパー
// 3_Gameレイヤー: ルート名の定数はどこからでも利用可能でなければなりません。
//
// DAYZにおけるRPCの仕組み:
//   エンジンはデータの送受信にScriptRPCとOnRPCを提供します。
//   GetGame().RPCSingleParam() を呼び出すか、ScriptRPCを作成して
//   データを書き込み、送信します。受信側は同じ順序でデータを読み取ります。
//
//   DayZは整数のRPC IDを使用します。Mod間の衝突を避けるため、各Modは
//   一意のID範囲を選択するか、文字列ルーティングシステムを使用すべきです。
//   このテンプレートでは、各メッセージを処理するハンドラーを特定するために
//   文字列プレフィックスと一意のint IDを使用します。
//
// パターン:
//   1. クライアントがデータを要求 -> サーバーにリクエストRPCを送信
//   2. サーバーが処理 -> クライアントにレスポンスRPCを返送
//   3. クライアントが受信 -> UIまたは状態を更新
// ==========================================================================

// ---------------------------------------------------------------------------
// RPC ID - 他のModと衝突しにくい一意の番号を選択します。
// よく使用される範囲についてはDayZコミュニティWikiを確認してください。
// エンジン組み込みRPCは小さな番号（0-1000）を使用します。
// 規約: Mod名のハッシュに基づく5桁の番号を使用します。
// ---------------------------------------------------------------------------
const int MYMOD_RPC_ID = 74291;

// ---------------------------------------------------------------------------
// RPCルート名 - 各RPCエンドポイントの文字列識別子。
// 定数を使用することでタイプミスを防ぎ、IDE検索を可能にします。
// ---------------------------------------------------------------------------
const string MYMOD_RPC_CONFIG_SYNC     = "MyMod:ConfigSync";
const string MYMOD_RPC_WELCOME         = "MyMod:Welcome";
const string MYMOD_RPC_PLAYER_DATA     = "MyMod:PlayerData";
const string MYMOD_RPC_UI_REQUEST      = "MyMod:UIRequest";
const string MYMOD_RPC_UI_RESPONSE     = "MyMod:UIResponse";

// ---------------------------------------------------------------------------
// MyModRPCHelper - RPC送信用の静的ユーティリティクラス
// ScriptRPCの作成、ルート文字列の書き込み、ペイロードの書き込み、
// Send()の呼び出しというボイラープレートをラップします。
// ---------------------------------------------------------------------------
class MyModRPCHelper
{
    // サーバーから特定のクライアントに文字列メッセージを送信します。
    // identity: ターゲットプレイヤー。null = すべてにブロードキャスト。
    // routeName: 処理するハンドラーを指定（例: MYMOD_RPC_WELCOME）。
    // message: 文字列ペイロード。
    static void SendStringToClient(PlayerIdentity identity, string routeName, string message)
    {
        // RPCオブジェクトを作成します。これはエンベロープです。
        ScriptRPC rpc = new ScriptRPC();

        // 最初にルート名を書き込みます。受信側はこれを読み取り、
        // どのハンドラーを呼び出すかを決定します。常に同じ順序で書き込み/読み取りします。
        rpc.Write(routeName);

        // ペイロードデータを書き込みます。
        rpc.Write(message);

        // クライアントに送信します。パラメータ:
        //   null    = ターゲットオブジェクトなし（カスタムRPCにはプレイヤーエンティティ不要）
        //   MYMOD_RPC_ID = 一意のRPCチャンネル
        //   true    = 確実な配信（TCP的）。頻繁な更新にはfalseを使用。
        //   identity = ターゲットクライアント。nullはすべてのクライアントにブロードキャスト。
        rpc.Send(null, MYMOD_RPC_ID, true, identity);
    }

    // クライアントからサーバーにリクエストを送信する（ペイロードなし、ルートのみ）。
    static void SendRequestToServer(string routeName)
    {
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(routeName);
        // サーバーへの送信時、identityはnullです（サーバーにはPlayerIdentityがありません）。
        // guaranteed = true でメッセージの到着を保証します。
        rpc.Send(null, MYMOD_RPC_ID, true, null);
    }
};
```

---

## マネージャーシングルトン (4_World)

`Scripts/4_World/MyMod/MyModManager.c` に配置します。

これはサーバーサイドにおけるModの中枢です。設定を所有し、RPCを処理し、定期更新を実行します。

```c
// ==========================================================================
// MyModManager.c - サーバーサイドのシングルトンマネージャー
// 4_Worldレイヤー: 3_Gameの型（設定、定数、RPC）を参照できます。
//
// なぜシングルトンなのか:
//   マネージャーはミッション全体を通じて存続する正確に1つのインスタンスが必要です。
//   複数のインスタンスは重複処理と競合する状態を引き起こします。
//   シングルトンパターンは1つのインスタンスを保証し、
//   GetInstance()を通じてグローバルアクセスを提供します。
//
// ライフサイクル:
//   1. MissionServer.OnInit() が MyModManager.GetInstance().Init() を呼び出す
//   2. マネージャーが設定を読み込み、RPCを登録し、タイマーを開始する
//   3. マネージャーがゲームプレイ中にイベントを処理する
//   4. MissionServer.OnMissionFinish() が MyModManager.Cleanup() を呼び出す
//   5. シングルトンが破棄され、すべての参照が解放される
// ==========================================================================

class MyModManager
{
    // 単一インスタンス。'ref' はこのクラスがオブジェクトを所有することを意味します。
    // s_Instanceがnullに設定されると、オブジェクトが破棄されます。
    private static ref MyModManager s_Instance;

    // ディスクから読み込まれた設定。
    // 'ref' はマネージャーが設定オブジェクトの生存期間を所有するためです。
    protected ref MyModConfig m_Config;

    // 前回の更新ティックからの累積時間（秒）。
    protected float m_TimeSinceUpdate;

    // Init()が正常に呼び出されたかを追跡します。
    protected bool m_Initialized;

    // -----------------------------------------------------------------------
    // シングルトンアクセス
    // -----------------------------------------------------------------------

    static MyModManager GetInstance()
    {
        if (!s_Instance)
        {
            s_Instance = new MyModManager();
        }
        return s_Instance;
    }

    // ミッション終了時にこれを呼び出してシングルトンを破棄しメモリを解放します。
    // s_Instanceをnullに設定するとデストラクタがトリガーされます。
    static void Cleanup()
    {
        s_Instance = null;
    }

    // -----------------------------------------------------------------------
    // ライフサイクル
    // -----------------------------------------------------------------------

    // MissionServer.OnInit()から一度だけ呼び出されます。
    void Init()
    {
        if (m_Initialized) return;

        // ディスクから設定を読み込みます（初回実行時はデフォルトを作成）。
        m_Config = MyModConfig.Load();

        if (!m_Config.Enabled)
        {
            Print(MYMOD_TAG + " Mod is DISABLED in config. Skipping initialization.");
            return;
        }

        // 更新タイマーをリセットします。
        m_TimeSinceUpdate = 0;

        m_Initialized = true;

        Print(MYMOD_TAG + " Manager initialized (v" + MYMOD_VERSION + ")");

        if (m_Config.DebugLogging)
        {
            Print(MYMOD_TAG + " Debug logging enabled");
            Print(MYMOD_TAG + " Update interval: " + m_Config.UpdateInterval.ToString() + "s");
            Print(MYMOD_TAG + " Max items: " + m_Config.MaxItems.ToString());
        }
    }

    // MissionServer.OnUpdate()から毎フレーム呼び出されます。
    // timesliceは前回のフレームからの経過秒数です。
    void OnUpdate(float timeslice)
    {
        if (!m_Initialized || !m_Config.Enabled) return;

        // 時間を蓄積し、設定されたインターバルでのみ処理します。
        // これにより毎フレームでの高コストなロジックの実行を防ぎます。
        m_TimeSinceUpdate += timeslice;
        if (m_TimeSinceUpdate < m_Config.UpdateInterval) return;
        m_TimeSinceUpdate = 0;

        // --- 定期更新ロジックをここに記述 ---
        // 例: 追跡対象のエンティティを反復処理、条件の確認など。
        if (m_Config.DebugLogging)
        {
            Print(MYMOD_TAG + " Periodic update tick");
        }
    }

    // ミッション終了時に呼び出されます（サーバーシャットダウンまたは再起動）。
    void Shutdown()
    {
        if (!m_Initialized) return;

        Print(MYMOD_TAG + " Manager shutting down");

        // 必要に応じてランタイム状態を保存します。
        // m_Config.Save();

        m_Initialized = false;
    }

    // -----------------------------------------------------------------------
    // RPCハンドラー
    // -----------------------------------------------------------------------

    // クライアントがUIデータを要求したときに呼び出されます。
    // sender: リクエストを送信したプレイヤー。
    // ctx: データストリーム（ルート名の後の部分）。
    void OnUIRequest(PlayerIdentity sender, ParamsReadContext ctx)
    {
        if (!sender) return;

        if (m_Config.DebugLogging)
        {
            Print(MYMOD_TAG + " UI data requested by: " + sender.GetName());
        }

        // レスポンスデータを構築して返送します。
        // 実際のModでは、ここで実際のデータを収集します。
        string responseData = "Items: " + m_Config.MaxItems.ToString();
        MyModRPCHelper.SendStringToClient(sender, MYMOD_RPC_UI_RESPONSE, responseData);
    }

    // プレイヤーが接続したときに呼び出されます。設定されている場合はウェルカムメッセージを送信します。
    void OnPlayerConnected(PlayerIdentity identity)
    {
        if (!m_Initialized || !m_Config.Enabled) return;
        if (!identity) return;

        // 設定されている場合はウェルカムメッセージを送信します。
        if (m_Config.WelcomeMessage != "")
        {
            MyModRPCHelper.SendStringToClient(identity, MYMOD_RPC_WELCOME, m_Config.WelcomeMessage);

            if (m_Config.DebugLogging)
            {
                Print(MYMOD_TAG + " Sent welcome to: " + identity.GetName());
            }
        }
    }

    // -----------------------------------------------------------------------
    // アクセサ
    // -----------------------------------------------------------------------

    MyModConfig GetConfig()
    {
        return m_Config;
    }

    bool IsInitialized()
    {
        return m_Initialized;
    }
};
```

---

## プレイヤーイベントハンドラー (4_World)

`Scripts/4_World/MyMod/MyModPlayerHandler.c` に配置します。

`modded class` パターンを使用してバニラの `PlayerBase` エンティティにフックし、接続/切断イベントを検出します。

```c
// ==========================================================================
// MyModPlayerHandler.c - プレイヤーライフサイクルフック
// 4_Worldレイヤー: 接続/切断を傍受するためにPlayerBaseをmod。
//
// なぜ modded class なのか:
//   DayZには「プレイヤー接続」イベントのコールバックがありません。標準的な
//   パターンは、MissionServerのメソッドをオーバーライドする（新しい接続用）か、
//   PlayerBaseにフックする（死亡などのエンティティレベルイベント用）ことです。
//   ここではエンティティレベルのフックを示すためにmodded PlayerBaseを使用します。
//
// 重要:
//   オーバーライドでは必ず最初にsuper.MethodName()を呼び出してください。
//   これを怠ると、バニラの動作チェーンと同じメソッドをオーバーライドしている
//   他のModが壊れます。
// ==========================================================================

modded class PlayerBase
{
    // このプレイヤーの初期化イベントを送信したかを追跡します。
    // Init()が複数回呼び出された場合の重複処理を防ぎます。
    protected bool m_MyModPlayerReady;

    // -----------------------------------------------------------------------
    // プレイヤーエンティティが完全に作成されてレプリケートされた後に呼び出されます。
    // サーバー上では、プレイヤーがRPCを受信する「準備完了」となるタイミングです。
    // -----------------------------------------------------------------------
    override void Init()
    {
        super.Init();

        // サーバー上でのみ実行します。GetGame().IsServer() は専用サーバーと
        // リッスンサーバーのホストでtrueを返します。
        if (!GetGame().IsServer()) return;

        // 二重初期化のガード。
        if (m_MyModPlayerReady) return;
        m_MyModPlayerReady = true;

        // プレイヤーのネットワークIDを取得します。
        // サーバー上では、GetIdentity() はプレイヤーの名前、Steam ID（PlainId）、
        // UIDを含むPlayerIdentityオブジェクトを返します。
        PlayerIdentity identity = GetIdentity();
        if (!identity) return;

        // プレイヤーが接続したことをマネージャーに通知します。
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.OnPlayerConnected(identity);
        }
    }
};
```

---

## ミッションフック: サーバー (5_Mission)

`Scripts/5_Mission/MyMod/MyModMissionServer.c` に配置します。

`MissionServer` にフックして、サーバーサイドでModの初期化とシャットダウンを行います。

```c
// ==========================================================================
// MyModMissionServer.c - サーバーサイドのミッションフック
// 5_Missionレイヤー: 最後にロードされ、すべての下位レイヤーを参照できます。
//
// なぜ modded MissionServer なのか:
//   MissionServerはサーバーサイドロジックのエントリポイントです。OnInit()は
//   ミッション開始時（サーバー起動時）に一度だけ実行されます。OnMissionFinish()は
//   サーバーのシャットダウンまたは再起動時に実行されます。これらがModのシステムの
//   セットアップとティアダウンの正しい場所です。
//
// ライフサイクルの順序:
//   1. エンジンがすべてのスクリプトレイヤーをロード（3_Game -> 4_World -> 5_Mission）
//   2. エンジンがMissionServerインスタンスを作成
//   3. OnInit()が呼び出される -> ここでシステムを初期化
//   4. OnMissionStart()が呼び出される -> ワールドが準備完了、プレイヤーが参加可能
//   5. OnUpdate()が毎フレーム呼び出される
//   6. OnMissionFinish()が呼び出される -> サーバーがシャットダウン中
// ==========================================================================

modded class MissionServer
{
    // -----------------------------------------------------------------------
    // 初期化
    // -----------------------------------------------------------------------
    override void OnInit()
    {
        // 常にsuperを最初に呼び出します。チェーン内の他のModがこれに依存しています。
        super.OnInit();

        // マネージャーシングルトンを初期化します。ディスクから設定を読み込み、
        // RPCハンドラーを登録し、Modの動作を準備します。
        MyModManager.GetInstance().Init();

        Print(MYMOD_TAG + " Server mission initialized");
    }

    // -----------------------------------------------------------------------
    // フレームごとの更新
    // -----------------------------------------------------------------------
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        // マネージャーに委譲します。マネージャーは独自のレート
        // 制限（設定のUpdateInterval）を処理するため、これは軽量です。
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.OnUpdate(timeslice);
        }
    }

    // -----------------------------------------------------------------------
    // プレイヤー接続 - サーバーRPCディスパッチ
    // クライアントがサーバーにRPCを送信したときにエンジンから呼び出されます。
    // -----------------------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        // 自分のRPC IDのみを処理します。他のRPCはすべてパススルーします。
        if (rpc_type != MYMOD_RPC_ID) return;

        // ルート名を読み取ります（送信側が最初に書き込んだ文字列）。
        string routeName;
        if (!ctx.Read(routeName)) return;

        // ルート名に基づいて正しいハンドラーにディスパッチします。
        MyModManager mgr = MyModManager.GetInstance();
        if (!mgr) return;

        if (routeName == MYMOD_RPC_UI_REQUEST)
        {
            mgr.OnUIRequest(sender, ctx);
        }
        // Modが成長するにつれてここにルートを追加します:
        // else if (routeName == MYMOD_RPC_SOME_OTHER)
        // {
        //     mgr.OnSomeOther(sender, ctx);
        // }
    }

    // -----------------------------------------------------------------------
    // シャットダウン
    // -----------------------------------------------------------------------
    override void OnMissionFinish()
    {
        // superを呼ぶ前にマネージャーをシャットダウンします。
        // これにより、エンジンがミッションインフラストラクチャを
        // ティアダウンする前にクリーンアップが実行されることを保証します。
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.Shutdown();
        }

        // シングルトンを破棄してメモリを解放し、ミッンが再起動した場合
        // （プロセス終了なしのサーバー再起動など）の古い状態を防ぎます。
        MyModManager.Cleanup();

        Print(MYMOD_TAG + " Server mission finished");

        super.OnMissionFinish();
    }
};
```

---

## ミッションフック: クライアント (5_Mission)

`Scripts/5_Mission/MyMod/MyModMissionClient.c` に配置します。

クライアントサイドの初期化、入力処理、RPC受信のために `MissionGameplay` にフックします。

```c
// ==========================================================================
// MyModMissionClient.c - クライアントサイドのミッションフック
// 5_Missionレイヤー。
//
// なぜ MissionGameplay なのか:
//   クライアント上では、MissionGameplayがゲームプレイ中のアクティブなミッションクラスです。
//   毎フレームOnUpdate()を受信し（入力ポーリング用）、
//   受信サーバーメッセージ用のOnRPC()も受信します。
//
// リッスンサーバーに関する注意:
//   リッスンサーバー（ホスト + プレイ）では、MissionServerと
//   MissionGameplayの両方がアクティブです。クライアントコードは
//   サーバーコードと並行して実行されます。サイド固有のロジックが
//   必要な場合は GetGame().IsClient() または GetGame().IsServer() でガードします。
// ==========================================================================

modded class MissionGameplay
{
    // UIパネルへの参照。閉じているときはnull。
    protected ref MyModUI m_MyModPanel;

    // 初期化状態の追跡。
    protected bool m_MyModInitialized;

    // -----------------------------------------------------------------------
    // 初期化
    // -----------------------------------------------------------------------
    override void OnInit()
    {
        super.OnInit();

        m_MyModInitialized = true;

        Print(MYMOD_TAG + " Client mission initialized");
    }

    // -----------------------------------------------------------------------
    // フレームごとの更新: 入力ポーリングとUI管理
    // -----------------------------------------------------------------------
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (!m_MyModInitialized) return;

        // Inputs.xmlで定義されたキーバインドをポーリングします。
        // GetUApi() はUserActions APIを返します。
        // GetInputByName() はInputs.xmlの名前でアクションを検索します。
        // LocalPress() はキーが押下されたフレームでtrueを返します。
        UAInput panelInput = GetUApi().GetInputByName("UAMyModPanel");
        if (panelInput && panelInput.LocalPress())
        {
            TogglePanel();
        }
    }

    // -----------------------------------------------------------------------
    // RPCレシーバー: サーバーからのメッセージを処理する
    // -----------------------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        // 自分のRPC IDのみを処理します。
        if (rpc_type != MYMOD_RPC_ID) return;

        // ルート名を読み取ります。
        string routeName;
        if (!ctx.Read(routeName)) return;

        // ルートに基づいてディスパッチします。
        if (routeName == MYMOD_RPC_WELCOME)
        {
            string welcomeMsg;
            if (ctx.Read(welcomeMsg))
            {
                // プレイヤーにウェルカムメッセージを表示します。
                // GetGame().GetMission().OnEvent() で通知を表示できますが、
                // カスタムUIも使用できます。簡単のため、ここではチャットを使用します。
                GetGame().Chat(welcomeMsg, "");
                Print(MYMOD_TAG + " Welcome message: " + welcomeMsg);
            }
        }
        else if (routeName == MYMOD_RPC_UI_RESPONSE)
        {
            string responseData;
            if (ctx.Read(responseData))
            {
                // 受信したデータでUIパネルを更新します。
                if (m_MyModPanel)
                {
                    m_MyModPanel.SetData(responseData);
                }
            }
        }
    }

    // -----------------------------------------------------------------------
    // UIパネルのトグル
    // -----------------------------------------------------------------------
    protected void TogglePanel()
    {
        if (m_MyModPanel && m_MyModPanel.IsOpen())
        {
            m_MyModPanel.Close();
            m_MyModPanel = null;
        }
        else
        {
            // プレイヤーが生存中で他のメニューが表示されていない場合のみ開きます。
            PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
            if (!player || !player.IsAlive()) return;

            UIManager uiMgr = GetGame().GetUIManager();
            if (uiMgr && uiMgr.GetMenu()) return;

            m_MyModPanel = new MyModUI();
            m_MyModPanel.Open();

            // サーバーに最新データを要求します。
            MyModRPCHelper.SendRequestToServer(MYMOD_RPC_UI_REQUEST);
        }
    }

    // -----------------------------------------------------------------------
    // シャットダウン
    // -----------------------------------------------------------------------
    override void OnMissionFinish()
    {
        // UIパネルが開いている場合は閉じて破棄します。
        if (m_MyModPanel)
        {
            m_MyModPanel.Close();
            m_MyModPanel = null;
        }

        m_MyModInitialized = false;

        Print(MYMOD_TAG + " Client mission finished");

        super.OnMissionFinish();
    }
};
```

---

## UIパネルスクリプト (5_Mission)

`Scripts/5_Mission/MyMod/MyModUI.c` に配置します。

このスクリプトは `.layout` ファイルで定義されたUIパネルを制御します。ウィジェット参照を検索し、データで投入し、開閉を処理します。

```c
// ==========================================================================
// MyModUI.c - UIパネルコントローラー
// 5_Missionレイヤー: すべての下位レイヤーを参照できます。
//
// DayZ UIの仕組み:
//   1. .layoutファイルがウィジェット階層を定義する（HTMLのように）。
//   2. スクリプトクラスがレイアウトを読み込み、名前でウィジェットを見つけ、
//      操作する（テキスト設定、表示/非表示、クリックへの応答）。
//   3. スクリプトがルートウィジェットの表示/非表示と入力フォーカスを管理する。
//
// ウィジェットのライフサイクル:
//   GetGame().GetWorkspace().CreateWidgets() がレイアウトファイルを読み込み、
//   ルートウィジェットを返します。その後 FindAnyWidget() を使用して
//   名前付きの子ウィジェットへの参照を取得します。完了したら widget.Unlink()
//   を呼び出してウィジェットツリー全体を破棄します。
// ==========================================================================

class MyModUI
{
    // パネルのルートウィジェット（.layoutから読み込まれる）。
    protected ref Widget m_Root;

    // 名前付きの子ウィジェット。
    protected TextWidget m_TitleText;
    protected TextWidget m_DataText;
    protected TextWidget m_VersionText;
    protected ButtonWidget m_CloseButton;

    // 状態追跡。
    protected bool m_IsOpen;

    // -----------------------------------------------------------------------
    // コンストラクタ: レイアウトを読み込みウィジェット参照を検索する
    // -----------------------------------------------------------------------
    void MyModUI()
    {
        // CreateWidgetsは.layoutファイルを読み込み、すべてのウィジェットをインスタンス化します。
        // パスはModルートからの相対パスです（config.cppのパスと同じ）。
        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyProfessionalMod/Scripts/GUI/layouts/MyModPanel.layout"
        );

        // Open()が呼ばれるまで初期状態は非表示。
        if (m_Root)
        {
            m_Root.Show(false);

            // 名前付きウィジェットを検索します。これらの名前は.layoutファイルの
            // ウィジェット名と正確に一致する必要があります（大文字小文字区別）。
            m_TitleText   = TextWidget.Cast(m_Root.FindAnyWidget("TitleText"));
            m_DataText    = TextWidget.Cast(m_Root.FindAnyWidget("DataText"));
            m_VersionText = TextWidget.Cast(m_Root.FindAnyWidget("VersionText"));
            m_CloseButton = ButtonWidget.Cast(m_Root.FindAnyWidget("CloseButton"));

            // 静的コンテンツを設定します。
            if (m_TitleText)
                m_TitleText.SetText("My Professional Mod");

            if (m_VersionText)
                m_VersionText.SetText("v" + MYMOD_VERSION);
        }
    }

    // -----------------------------------------------------------------------
    // Open: パネルを表示し入力をキャプチャする
    // -----------------------------------------------------------------------
    void Open()
    {
        if (!m_Root) return;

        m_Root.Show(true);
        m_IsOpen = true;

        // パネルが開いている間、WASDがキャラクターを移動しないよう
        // プレイヤーコントロールをロックします。カーソルが表示されます。
        GetGame().GetMission().PlayerControlDisable(INPUT_EXCLUDE_ALL);
        GetGame().GetUIManager().ShowUICursor(true);

        Print(MYMOD_TAG + " UI panel opened");
    }

    // -----------------------------------------------------------------------
    // Close: パネルを非表示にし入力を解放する
    // -----------------------------------------------------------------------
    void Close()
    {
        if (!m_Root) return;

        m_Root.Show(false);
        m_IsOpen = false;

        // プレイヤーコントロールを再有効化します。
        GetGame().GetMission().PlayerControlEnable(true);
        GetGame().GetUIManager().ShowUICursor(false);

        Print(MYMOD_TAG + " UI panel closed");
    }

    // -----------------------------------------------------------------------
    // データ更新: サーバーがUIデータを送信したときに呼び出される
    // -----------------------------------------------------------------------
    void SetData(string data)
    {
        if (m_DataText)
        {
            m_DataText.SetText(data);
        }
    }

    // -----------------------------------------------------------------------
    // 状態クエリ
    // -----------------------------------------------------------------------
    bool IsOpen()
    {
        return m_IsOpen;
    }

    // -----------------------------------------------------------------------
    // デストラクタ: ウィジェットツリーをクリーンアップする
    // -----------------------------------------------------------------------
    void ~MyModUI()
    {
        // Unlinkはルートウィジェットとそのすべての子を破棄します。
        // ウィジェットツリーが使用するメモリを解放します。
        if (m_Root)
        {
            m_Root.Unlink();
        }
    }
};
```

---

## レイアウトファイル

`Scripts/GUI/layouts/MyModPanel.layout` に配置します。

UIパネルの視覚的な構造を定義します。DayZのレイアウトはカスタムテキスト形式（XMLではない）を使用します。

```
// ==========================================================================
// MyModPanel.layout - UIパネル構造
//
// サイジングルール:
//   hexactsize 1 + vexactsize 1 = サイズはピクセル単位（例: size 400 300）
//   hexactsize 0 + vexactsize 0 = サイズは比率（0.0から1.0）
//   halign/valign はアンカーポイントを制御:
//     left_ref/top_ref     = 親の左/上端に固定
//     center_ref           = 親の中央
//     right_ref/bottom_ref = 親の右/下端に固定
//
// 重要:
//   - 負のサイズは絶対に使用しないでください。代わりに配置と位置を使用します。
//   - ウィジェット名はスクリプトのFindAnyWidget()呼び出しと正確に一致する必要があります。
//   - 'ignorepointer 1' はウィジェットがマウスクリックを受信しないことを意味します。
//   - 'scriptclass' はイベント処理のためにウィジェットをスクリプトクラスにリンクします。
// ==========================================================================

// ルートパネル: 画面中央、400x300ピクセル、半透明の背景。
PanelWidgetClass MyModPanelRoot {
 position 0 0
 size 400 300
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 1
 vexactsize 1
 color 0.1 0.1 0.12 0.92
 priority 100
 {
  // タイトルバー: 全幅、36px高、上端。
  PanelWidgetClass TitleBar {
   position 0 0
   size 1 36
   hexactpos 1
   vexactpos 1
   hexactsize 0
   vexactsize 1
   color 0.15 0.15 0.18 1
   {
    // タイトルテキスト: パディング付きで左揃え。
    TextWidgetClass TitleText {
     position 12 0
     size 300 36
     hexactpos 1
     vexactpos 1
     hexactsize 1
     vexactsize 1
     valign center_ref
     ignorepointer 1
     text "My Mod"
     font "gui/fonts/metron2"
     "exact size" 16
     color 1 1 1 0.9
    }
    // バージョンテキスト: タイトルバーの右側。
    TextWidgetClass VersionText {
     position 0 0
     size 80 36
     halign right_ref
     hexactpos 1
     vexactpos 1
     hexactsize 1
     vexactsize 1
     valign center_ref
     ignorepointer 1
     text "v1.0.0"
     font "gui/fonts/metron2"
     "exact size" 12
     color 0.6 0.6 0.6 0.8
    }
   }
  }
  // コンテンツエリア: タイトルバーの下、残りのスペースを埋める。
  PanelWidgetClass ContentArea {
   position 0 40
   size 380 200
   halign center_ref
   hexactpos 1
   vexactpos 1
   hexactsize 1
   vexactsize 1
   color 0 0 0 0
   {
    // データテキスト: サーバーデータが表示される場所。
    TextWidgetClass DataText {
     position 12 12
     size 356 160
     hexactpos 1
     vexactpos 1
     hexactsize 1
     vexactsize 1
     ignorepointer 1
     text "Waiting for data..."
     font "gui/fonts/metron2"
     "exact size" 14
     color 0.85 0.85 0.85 1
    }
   }
  }
  // 閉じるボタン: 右下隅。
  ButtonWidgetClass CloseButton {
   position 0 0
   size 100 32
   halign right_ref
   valign bottom_ref
   hexactpos 1
   vexactpos 1
   hexactsize 1
   vexactsize 1
   text "Close"
   font "gui/fonts/metron2"
   "exact size" 14
  }
 }
}
```

---

## stringtable.csv

`Scripts/stringtable.csv` に配置します。

プレイヤーに表示されるすべてのテキストのローカライゼーションを提供します。エンジンはプレイヤーのゲーム言語に一致する列を読み取ります。`original` 列がフォールバックです。

DayZは13の言語列をサポートしています。すべての行に13列すべてが必要です（翻訳していない言語には英語テキストをプレースホルダーとして使用します）。

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_INPUT_GROUP","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod",
"STR_MYMOD_INPUT_PANEL","Open Panel","Open Panel","Otevrit Panel","Panel offnen","Otkryt Panel","Otworz Panel","Panel megnyitasa","Apri Pannello","Abrir Panel","Ouvrir Panneau","Open Panel","Open Panel","Abrir Painel","Open Panel",
"STR_MYMOD_TITLE","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod",
"STR_MYMOD_CLOSE","Close","Close","Zavrit","Schliessen","Zakryt","Zamknij","Bezaras","Chiudi","Cerrar","Fermer","Close","Close","Fechar","Close",
"STR_MYMOD_WELCOME","Welcome!","Welcome!","Vitejte!","Willkommen!","Dobro pozhalovat!","Witaj!","Udvozoljuk!","Benvenuto!","Bienvenido!","Bienvenue!","Welcome!","Welcome!","Bem-vindo!","Welcome!",
```

**重要:** 各行は最後の言語列の後に末尾のカンマが必要です。これはDayZのCSVパーサーの要件です。

---

## Inputs.xml

`Scripts/Inputs.xml` に配置します。

ゲームのオプション > コントロールメニューに表示されるカスタムキーバインドを定義します。`config.cpp` CfgModsの `inputs` フィールドがこのファイルを指す必要があります。

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<!--
    Inputs.xml - カスタムキーバインド定義

    構造:
    - <actions>:  入力アクション名とその表示文字列を宣言する
    - <sorting>:  コントロールメニューでアクションをカテゴリの下にグループ化する
    - <preset>:   デフォルトのキーバインドを設定する

    命名規約:
    - アクション名は "UA"（User Action）で始まり、その後にModプレフィックスが続きます。
    - "loc" 属性はstringtable.csvの文字列キーを参照します。

    キー名:
    - キーボード: kA から kZ、k0-k9、kInsert、kHome、kEnd、kDelete、
      kNumpad0-kNumpad9、kF1-kF12、kLControl、kRControl、kLShift、kRShift、
      kLAlt、kRAlt、kSpace、kReturn、kBack、kTab、kEscape
    - マウス: mouse1（左）、mouse2（右）、mouse3（中央）
    - コンボキー: 複数の <btn> 子要素を持つ <combo> 要素を使用
-->
<modded_inputs>
    <inputs>
        <!-- 入力アクションを宣言する。 -->
        <actions>
            <input name="UAMyModPanel" loc="STR_MYMOD_INPUT_PANEL" />
        </actions>

        <!-- オプション > コントロールでカテゴリの下にグループ化する。 -->
        <!-- "name" は内部ID、"loc" はstringtableからの表示名。 -->
        <sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
            <input name="UAMyModPanel"/>
        </sorting>
    </inputs>

    <!-- デフォルトのキープリセット。プレイヤーはオプション > コントロールで再バインドできます。 -->
    <preset>
        <!-- デフォルトでHomeキーにバインドする。 -->
        <input name="UAMyModPanel">
            <btn name="kHome"/>
        </input>

        <!--
        コンボキーの例（使用するにはコメントを解除）:
        単一のキーの代わりにCtrl+Hにバインドします。
        <input name="UAMyModPanel">
            <combo>
                <btn name="kLControl"/>
                <btn name="kH"/>
            </combo>
        </input>
        -->
    </preset>
</modded_inputs>
```

---

## ビルドスクリプト

Modルートの `build.bat` に配置します。

このバッチファイルはDayZ ToolsのAddon Builderを使用してPBOパッキングを自動化します。

```batch
@echo off
REM ==========================================================================
REM build.bat - MyProfessionalModの自動PBOパッキング
REM
REM このスクリプトが行うこと:
REM   1. Scripts/ フォルダをPBOファイルにパッキング
REM   2. PBOを配布可能な@modフォルダに配置
REM   3. mod.cppを配布可能なフォルダにコピー
REM
REM 前提条件:
REM   - Steam経由でDayZ Toolsがインストール済み
REM   - Modソースが P:\MyProfessionalMod\ に存在
REM
REM 使用方法:
REM   このファイルをダブルクリックするか、コマンドラインから実行: build.bat
REM ==========================================================================

REM --- 設定: あなたの環境に合わせてこれらのパスを更新してください ---

REM DayZ Toolsへのパス（Steamライブラリのパスを確認してください）。
set DAYZ_TOOLS=C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools

REM ソースフォルダ: PBOにパッキングされるScriptsディレクトリ。
set SOURCE=P:\MyProfessionalMod\Scripts

REM 出力フォルダ: パッキングされたPBOの配置先。
set OUTPUT=P:\@MyProfessionalMod\addons

REM プレフィックス: PBO内の仮想パス。config.cppのパスと一致する必要があります
REM （例: "MyProfessionalMod/Scripts/3_Game" が解決可能であること）。
set PREFIX=MyProfessionalMod\Scripts

REM --- ビルドステップ ---

echo ============================================
echo  Building MyProfessionalMod
echo ============================================

REM 出力ディレクトリが存在しない場合は作成。
if not exist "%OUTPUT%" mkdir "%OUTPUT%"

REM Addon Builderを実行。
REM   -clear  = パッキング前に古いPBOを削除
REM   -prefix = PBOプレフィックスを設定（スクリプトパスの解決に必要）
echo Packing PBO...
"%DAYZ_TOOLS%\Bin\AddonBuilder\AddonBuilder.exe" "%SOURCE%" "%OUTPUT%" -prefix=%PREFIX% -clear

REM Addon Builderが成功したか確認。
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: PBO packing failed! Check the output above for details.
    echo Common causes:
    echo   - DayZ Tools path is wrong
    echo   - Source folder does not exist
    echo   - A .c file has a syntax error that prevents packing
    pause
    exit /b 1
)

REM mod.cppを配布可能なフォルダにコピー。
echo Copying mod.cpp...
copy /Y "P:\MyProfessionalMod\mod.cpp" "P:\@MyProfessionalMod\mod.cpp" >nul

echo.
echo ============================================
echo  Build complete!
echo  Output: P:\@MyProfessionalMod\
echo ============================================
echo.
echo To test with file patching (no PBO needed):
echo   DayZDiag_x64.exe -mod=P:\MyProfessionalMod -filePatching
echo.
echo To test with the built PBO:
echo   DayZDiag_x64.exe -mod=P:\@MyProfessionalMod
echo.
pause
```

---

## カスタマイズガイド

このテンプレートを自分のModに使用する場合、プレースホルダー名のすべての出現箇所を名前変更する必要があります。以下に完全なチェックリストを示します。

### ステップ1: 名前を決定する

編集を行う前に、以下の識別子を決定します：

| 識別子 | 例 | ルール |
|------------|---------|-------|
| **Modフォルダ名** | `MyBountySystem` | スペースなし、PascalCaseまたはアンダースコア |
| **表示名** | `"My Bounty System"` | 人間が読める形式、mod.cppとconfig.cpp用 |
| **CfgPatchesクラス** | `MyBountySystem_Scripts` | すべてのMod間でグローバルに一意 |
| **CfgModsクラス** | `MyBountySystem` | エンジン内部識別子 |
| **スクリプトプレフィックス** | `MyBounty` | クラスの短いプレフィックス: `MyBountyManager`、`MyBountyConfig` |
| **タグ定数** | `MYBOUNTY_TAG` | ログメッセージ用: `"[MyBounty]"` |
| **プリプロセッサ定義** | `MYBOUNTYSYSTEM` | `#ifdef` によるクロスMod検出用 |
| **RPC ID** | `58432` | 他のModに使用されていない一意の5桁の番号 |
| **入力アクション名** | `UAMyBountyPanel` | `UA` で始まる一意の名前 |

### ステップ2: ファイルとフォルダの名前変更

"MyMod" または "MyProfessionalMod" を含むすべてのファイルとフォルダの名前を変更します：

```
MyProfessionalMod/           -> MyBountySystem/
  Scripts/3_Game/MyMod/      -> Scripts/3_Game/MyBounty/
    MyModConstants.c          -> MyBountyConstants.c
    MyModConfig.c             -> MyBountyConfig.c
    MyModRPC.c                -> MyBountyRPC.c
  Scripts/4_World/MyMod/     -> Scripts/4_World/MyBounty/
    MyModManager.c            -> MyBountyManager.c
    MyModPlayerHandler.c      -> MyBountyPlayerHandler.c
  Scripts/5_Mission/MyMod/   -> Scripts/5_Mission/MyBounty/
    MyModMissionServer.c      -> MyBountyMissionServer.c
    MyModMissionClient.c      -> MyBountyMissionClient.c
    MyModUI.c                 -> MyBountyUI.c
  Scripts/GUI/layouts/
    MyModPanel.layout          -> MyBountyPanel.layout
```

### ステップ3: すべてのファイルで検索と置換

**順番に**（部分一致を避けるため最も長い文字列から）以下の置換を行います：

| 検索 | 置換 | 影響を受けるファイル |
|------|---------|----------------|
| `MyProfessionalMod` | `MyBountySystem` | config.cpp、mod.cpp、build.bat、UIスクリプト |
| `MyModManager` | `MyBountyManager` | マネージャー、ミッションフック、プレイヤーハンドラー |
| `MyModConfig` | `MyBountyConfig` | 設定クラス、マネージャー |
| `MyModConstants` | `MyBountyConstants` | （ファイル名のみ） |
| `MyModRPCHelper` | `MyBountyRPCHelper` | RPCヘルパー、ミッションフック |
| `MyModUI` | `MyBountyUI` | UIスクリプト、クライアントミッションフック |
| `MyModPanel` | `MyBountyPanel` | レイアウトファイル、UIスクリプト |
| `MyMod_Scripts` | `MyBountySystem_Scripts` | config.cpp CfgPatches |
| `MYMOD_RPC_ID` | `MYBOUNTY_RPC_ID` | 定数、RPC、ミッションフック |
| `MYMOD_RPC_` | `MYBOUNTY_RPC_` | すべてのRPCルート定数 |
| `MYMOD_TAG` | `MYBOUNTY_TAG` | 定数、ログタグを使用するすべてのファイル |
| `MYMOD_CONFIG` | `MYBOUNTY_CONFIG` | 定数、設定クラス |
| `MYMOD_VERSION` | `MYBOUNTY_VERSION` | 定数、UIスクリプト |
| `MYMOD` | `MYBOUNTYSYSTEM` | config.cpp defines[] |
| `MyMod` | `MyBounty` | config.cpp CfgModsクラス、RPCルート文字列 |
| `My Mod` | `My Bounty System` | レイアウト内の文字列、stringtable |
| `mymod` | `mybounty` | Inputs.xmlソーティング名 |
| `STR_MYMOD_` | `STR_MYBOUNTY_` | stringtable.csv、Inputs.xml |
| `UAMyMod` | `UAMyBounty` | Inputs.xml、クライアントミッションフック |
| `m_MyMod` | `m_MyBounty` | クライアントミッションフックのメンバー変数 |
| `74291` | `58432` | RPC ID（選択した一意の番号） |

### ステップ4: 検証

名前変更後、プロジェクト全体で "MyMod" と "MyProfessionalMod" を検索して、見落としがないか確認します。その後ビルドしてテストします：

```batch
DayZDiag_x64.exe -mod=P:\MyBountySystem -filePatching
```

スクリプトログでタグ（例: `[MyBounty]`）を確認して、すべてが正常にロードされたことを確認します。

---

## 機能拡張ガイド

Modが動作するようになったら、一般的な機能の追加方法を以下に示します。

### 新しいRPCエンドポイントの追加

**1. ルート定数を定義する** - `MyModRPC.c`（3_Game）：

```c
const string MYMOD_RPC_BOUNTY_SET = "MyMod:BountySet";
```

**2. サーバーハンドラーを追加する** - `MyModManager.c`（4_World）：

```c
void OnBountySet(PlayerIdentity sender, ParamsReadContext ctx)
{
    // クライアントが書き込んだパラメータを読み取る。
    string targetName;
    int bountyAmount;
    if (!ctx.Read(targetName)) return;
    if (!ctx.Read(bountyAmount)) return;

    Print(MYMOD_TAG + " Bounty set on " + targetName + ": " + bountyAmount.ToString());
    // ... ロジックをここに記述 ...
}
```

**3. ディスパッチケースを追加する** - `MyModMissionServer.c`（5_Mission）の `OnRPC()` 内：

```c
else if (routeName == MYMOD_RPC_BOUNTY_SET)
{
    mgr.OnBountySet(sender, ctx);
}
```

**4. クライアントから送信する**（アクションがトリガーされる場所で）：

```c
ScriptRPC rpc = new ScriptRPC();
rpc.Write(MYMOD_RPC_BOUNTY_SET);
rpc.Write("PlayerName");
rpc.Write(5000);
rpc.Send(null, MYMOD_RPC_ID, true, null);
```

### 新しい設定フィールドの追加

**1. フィールドを追加する** - `MyModConfig.c` にデフォルト値とともに：

```c
// プレイヤーが設定できる最小賞金額。
int MinBountyAmount = 100;
```

これだけです。JSONシリアライザーはパブリックフィールドを自動的に取得します。ディスク上の既存の設定ファイルは、管理者が編集して保存するまで新しいフィールドにデフォルト値を使用します。

**2. マネージャーから参照する**：

```c
if (bountyAmount < m_Config.MinBountyAmount)
{
    // 拒否: 金額が低すぎる。
    return;
}
```

### 新しいUIパネルの追加

**1. レイアウトを作成する** - `Scripts/GUI/layouts/MyModBountyList.layout`：

```
PanelWidgetClass BountyListRoot {
 position 0 0
 size 500 400
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 1
 vexactsize 1
 color 0.1 0.1 0.12 0.92
 {
  TextWidgetClass BountyListTitle {
   position 12 8
   size 476 30
   hexactpos 1
   vexactpos 1
   hexactsize 1
   vexactsize 1
   text "Active Bounties"
   font "gui/fonts/metron2"
   "exact size" 18
   color 1 1 1 0.9
  }
 }
}
```

**2. スクリプトを作成する** - `Scripts/5_Mission/MyMod/MyModBountyListUI.c`：

```c
class MyModBountyListUI
{
    protected ref Widget m_Root;
    protected bool m_IsOpen;

    void MyModBountyListUI()
    {
        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyProfessionalMod/Scripts/GUI/layouts/MyModBountyList.layout"
        );
        if (m_Root)
            m_Root.Show(false);
    }

    void Open()  { if (m_Root) { m_Root.Show(true); m_IsOpen = true; } }
    void Close() { if (m_Root) { m_Root.Show(false); m_IsOpen = false; } }
    bool IsOpen() { return m_IsOpen; }

    void ~MyModBountyListUI()
    {
        if (m_Root) m_Root.Unlink();
    }
};
```

### 新しいキーバインドの追加

**1. アクションを追加する** - `Inputs.xml`：

```xml
<actions>
    <input name="UAMyModPanel" loc="STR_MYMOD_INPUT_PANEL" />
    <input name="UAMyModBountyList" loc="STR_MYMOD_INPUT_BOUNTYLIST" />
</actions>

<sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
    <input name="UAMyModPanel"/>
    <input name="UAMyModBountyList"/>
</sorting>
```

**2. デフォルトバインドを追加する** - `<preset>` セクション内：

```xml
<input name="UAMyModBountyList">
    <btn name="kEnd"/>
</input>
```

**3. ローカライゼーションを追加する** - `stringtable.csv`：

```csv
"STR_MYMOD_INPUT_BOUNTYLIST","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List",
```

**4. 入力をポーリングする** - `MyModMissionClient.c`：

```c
UAInput bountyInput = GetUApi().GetInputByName("UAMyModBountyList");
if (bountyInput && bountyInput.LocalPress())
{
    ToggleBountyList();
}
```

### 新しいstringtableエントリの追加

**1. 行を追加する** - `stringtable.csv`。すべての行に13の言語列と末尾のカンマが必要です：

```csv
"STR_MYMOD_BOUNTY_PLACED","Bounty placed!","Bounty placed!","Odměna vypsána!","Kopfgeld gesetzt!","Награда назначена!","Nagroda wyznaczona!","Fejpénz kiírva!","Taglia piazzata!","Recompensa puesta!","Prime placée!","Bounty placed!","Bounty placed!","Recompensa colocada!","Bounty placed!",
```

**2. スクリプトコードで使用する**：

```c
// Widget.SetText() はstringtableキーを自動解決しません。
// 解決された文字列を使用して Widget.SetText() を呼び出す必要があります:
string localizedText = Widget.TranslateString("#STR_MYMOD_BOUNTY_PLACED");
myTextWidget.SetText(localizedText);
```

または `.layout` ファイルでは、エンジンが `#STR_` キーを自動的に解決します：

```
text "#STR_MYMOD_BOUNTY_PLACED"
```

---

## 次のステップ

このプロフェッショナルテンプレートが動作するようになったら、以下のことができます：

1. **プロダクションModを研究する** -- [DayZ Expansion](https://github.com/salutesh/DayZ-Expansion-Scripts) と `StarDZ_Core` ソースを読み、大規模な実世界のパターンを学びます。
2. **カスタムアイテムを追加する** -- [チャプター 8.2: カスタムアイテムの作成](02-custom-item.md) に従い、マネージャーと統合します。
3. **管理パネルを構築する** -- 設定システムを使用して [チャプター 8.3: 管理パネルの構築](03-admin-panel.md) に従います。
4. **HUDオーバーレイを追加する** -- 常時表示のUI要素のために [チャプター 8.8: HUDオーバーレイの構築](08-hud-overlay.md) に従います。
5. **Workshopに公開する** -- Modの準備ができたら [チャプター 8.7: Workshopへの公開](07-publishing-workshop.md) に従います。
6. **デバッグを学ぶ** -- ログ分析とトラブルシューティングのために [チャプター 8.6: デバッグとテスト](06-debugging-testing.md) を読みます。

---

**前へ:** [チャプター 8.8: HUDオーバーレイの構築](08-hud-overlay.md) | [ホーム](../README.md)
