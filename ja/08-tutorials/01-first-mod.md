# 第 8.1 章: はじめての Mod（Hello World）

[ホーム](../README.md) | **はじめての Mod** | [次: カスタムアイテムの作成 >>](02-custom-item.md)

---

> **概要：** このチュートリアルでは、ゼロから初めての DayZ Mod を作成する手順を解説します。ツールのインストール、ワークスペースの設定、3つのファイルの作成、PBO のパック、DayZ での Mod の読み込み、スクリプトログでの動作確認まで行います。DayZ Modding の経験は必要ありません。

---

## 目次

- [前提条件](#前提条件)
- [ステップ 1: DayZ Tools のインストール](#ステップ-1-dayz-tools-のインストール)
- [ステップ 2: P: ドライブ（Workdrive）の設定](#ステップ-2-p-ドライブworkdriveの設定)
- [ステップ 3: Mod ディレクトリ構造の作成](#ステップ-3-mod-ディレクトリ構造の作成)
- [ステップ 4: mod.cpp の作成](#ステップ-4-modcpp-の作成)
- [ステップ 5: config.cpp の作成](#ステップ-5-configcpp-の作成)
- [ステップ 6: 最初のスクリプトの作成](#ステップ-6-最初のスクリプトの作成)
- [ステップ 7: Addon Builder で PBO をパック](#ステップ-7-addon-builder-で-pbo-をパック)
- [ステップ 8: DayZ で Mod を読み込む](#ステップ-8-dayz-で-mod-を読み込む)
- [ステップ 9: スクリプトログで確認](#ステップ-9-スクリプトログで確認)
- [ステップ 10: よくある問題のトラブルシューティング](#ステップ-10-よくある問題のトラブルシューティング)
- [完全なファイルリファレンス](#完全なファイルリファレンス)
- [次のステップ](#次のステップ)

---

## 前提条件

始める前に、以下を確認してください：

- **Steam** がインストールされ、ログインしていること
- **DayZ** ゲームがインストールされていること（Steam の製品版）
- **テキストエディタ**（VS Code、Notepad++、またはメモ帳でも可）
- DayZ Tools 用の約 **15 GB の空きディスク容量**

以上で全てです。このチュートリアルではプログラミング経験は必要ありません --- すべてのコードを解説します。

---

## ステップ 1: DayZ Tools のインストール

DayZ Tools は Steam で無料配布されているアプリケーションで、Mod 作成に必要なすべてが含まれています：Workbench スクリプトエディタ、PBO パック用の Addon Builder、Terrain Builder、Object Builder。

### インストール方法

1. **Steam** を開く
2. **ライブラリ** に移動
3. 上部のドロップダウンフィルターで **ゲーム** を **ツール** に変更
4. **DayZ Tools** を検索
5. **インストール** をクリック
6. ダウンロード完了を待つ（約 12〜15 GB）

インストール後、DayZ Tools は Steam ライブラリのツールの下に表示されます。デフォルトのインストールパス：

```
C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\
```

### インストールされるもの

| ツール | 用途 |
|------|---------|
| **Addon Builder** | Mod ファイルを `.pbo` アーカイブにパック |
| **Workbench** | シンタックスハイライト付きスクリプトエディタ |
| **Object Builder** | `.p3d` ファイルの 3D モデルビューア/エディタ |
| **Terrain Builder** | マップ/地形エディタ |
| **TexView2** | テクスチャビューア/コンバータ（`.paa`、`.edds`） |

このチュートリアルでは **Addon Builder** のみ必要です。その他は後で役に立ちます。

---

## ステップ 2: P: ドライブ（Workdrive）の設定

DayZ Modding では仮想ドライブレター **P:** を共有ワークスペースとして使用します。すべての Mod とゲームデータは P: から始まるパスを参照するため、異なるマシン間でパスの一貫性を保ちます。

### P: ドライブの作成

1. Steam から **DayZ Tools** を開く
2. DayZ Tools のメインウィンドウで **P: Drive Management** をクリック（または「Mount P drive」/「Setup P drive」と表示されたボタンを探す）
3. **Create/Mount P: Drive** をクリック
4. P: ドライブデータの保存先を選択（デフォルトで問題ないか、十分な容量のあるドライブを選ぶ）
5. 処理の完了を待つ

### 動作確認

**エクスプローラー** を開き、`P:\` に移動します。DayZ ゲームデータを含むディレクトリが表示されるはずです。P: ドライブが存在し、ブラウズできれば、次に進む準備ができています。

### 代替方法：手動 P: ドライブ

DayZ Tools の GUI が動作しない場合、Windows コマンドプロンプト（管理者として実行）で手動で P: ドライブを作成できます：

```batch
subst P: "C:\DayZWorkdrive"
```

`C:\DayZWorkdrive` を任意のフォルダに置き換えてください。これにより再起動まで有効な一時的なドライブマッピングが作成されます。永続的なマッピングには `net use` または DayZ Tools の GUI を使用してください。

### P: ドライブを使いたくない場合は？

P: ドライブなしでも、Mod フォルダを DayZ のゲームディレクトリに直接配置し、`-filePatching` モードを使用して開発できます。ただし、P: ドライブは標準的なワークフローであり、すべての公式ドキュメントで前提とされています。設定することを強く推奨します。

---

## ステップ 3: Mod ディレクトリ構造の作成

すべての DayZ Mod は特定のフォルダ構造に従います。P: ドライブ上に以下のディレクトリとファイルを作成してください（P: を使用しない場合は DayZ ゲームディレクトリ内に）：

```
P:\MyFirstMod\
    mod.cpp
    Scripts\
        config.cpp
        5_Mission\
            MyFirstMod\
                MissionHello.c
```

### フォルダの作成

1. **エクスプローラー** を開く
2. `P:\` に移動
3. `MyFirstMod` という新しいフォルダを作成
4. `MyFirstMod` 内に `Scripts` フォルダを作成
5. `Scripts` 内に `5_Mission` フォルダを作成
6. `5_Mission` 内に `MyFirstMod` フォルダを作成

### 構造の解説

| パス | 用途 |
|------|---------|
| `MyFirstMod/` | Mod のルート |
| `mod.cpp` | DayZ ランチャーに表示されるメタデータ（名前、作成者） |
| `Scripts/config.cpp` | Mod の依存関係とスクリプトの場所をエンジンに伝える |
| `Scripts/5_Mission/` | ミッションスクリプトレイヤー（UI、起動フック） |
| `Scripts/5_Mission/MyFirstMod/` | Mod のミッションスクリプト用サブフォルダ |
| `Scripts/5_Mission/MyFirstMod/MissionHello.c` | 実際のスクリプトファイル |

必要なファイルは **3つ** だけです。1つずつ作成しましょう。

---

## ステップ 4: mod.cpp の作成

テキストエディタで `P:\MyFirstMod\mod.cpp` ファイルを作成し、以下の内容を貼り付けてください：

```cpp
name = "My First Mod";
author = "YourName";
version = "1.0";
overview = "My very first DayZ mod. Prints Hello World to the script log.";
```

### 各行の意味

- **`name`** -- DayZ ランチャーの Mod リストに表示される表示名。プレイヤーが Mod を選択する際に表示されます。
- **`author`** -- あなたの名前またはチーム名。
- **`version`** -- 任意のバージョン文字列。エンジンはこれをパースしません。
- **`overview`** -- Mod の詳細を展開したときに表示される説明。

ファイルを保存してください。これが Mod の ID カードです。

---

## ステップ 5: config.cpp の作成

`P:\MyFirstMod\Scripts\config.cpp` ファイルを作成し、以下の内容を貼り付けてください：

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### 各セクションの意味

**CfgPatches** は DayZ エンジンに Mod を宣言します：

- `class MyFirstMod_Scripts` -- Mod のスクリプトパッケージの一意の識別子。他の Mod と衝突してはいけません。
- `units[] = {}; weapons[] = {};` -- Mod が追加するエンティティと武器のリスト。今は空です。
- `requiredVersion = 0.1;` -- 最低ゲームバージョン。常に `0.1`。
- `requiredAddons[] = { "DZ_Data" };` -- 依存関係。`DZ_Data` はベースゲームデータです。Mod がベースゲームの**後に**読み込まれることを保証します。

**CfgMods** はエンジンにスクリプトの場所を伝えます：

- `dir = "MyFirstMod";` -- Mod のルートディレクトリ。
- `type = "mod";` -- これはクライアント+サーバー Mod です（サーバー専用の `"servermod"` とは異なる）。
- `dependencies[] = { "Mission" };` -- コードが Mission スクリプトモジュールにフックすることを示します。
- `class missionScriptModule` -- `MyFirstMod/Scripts/5_Mission/` 内のすべての `.c` ファイルをコンパイルするようエンジンに指示します。

**なぜ `5_Mission` だけ？** Hello World スクリプトはミッションの起動イベントにフックするためで、これはミッションレイヤーにあります。ほとんどの簡単な Mod はここから始めます。

---

## ステップ 6: 最初のスクリプトの作成

`P:\MyFirstMod\Scripts\5_Mission\MyFirstMod\MissionHello.c` ファイルを作成し、以下の内容を貼り付けてください：

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The CLIENT mission has started.");
    }
};
```

### 行ごとの解説

```c
modded class MissionServer
```
`modded` キーワードは DayZ Modding の核心です。「バニラゲームの既存の `MissionServer` クラスを取得し、その上に変更を追加する」ことを意味します。新しいクラスを作成するのではなく、既存のクラスを拡張しています。

```c
    override void OnInit()
```
`OnInit()` はミッション開始時にエンジンから呼び出されます。`override` は、このメソッドが親クラスに既に存在し、自分のバージョンで置き換えることをコンパイラに伝えます。

```c
        super.OnInit();
```
**この行は重要です。** `super.OnInit()` はバニラのオリジナル実装を呼び出します。これを省略すると、バニラのミッション初期化コードが実行されず、ゲームが壊れます。常に最初に `super` を呼び出してください。

```c
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
```
`Print()` は DayZ スクリプトログファイルにメッセージを書き込みます。`[MyFirstMod]` プレフィックスにより、ログ内でメッセージを簡単に見つけることができます。

```c
modded class MissionGameplay
```
`MissionGameplay` は `MissionServer` のクライアント側の対応物です。プレイヤーがサーバーに参加すると、そのマシンで `MissionGameplay.OnInit()` が発火します。両方のクラスを Mod することで、サーバーログとクライアントログの両方にメッセージが表示されます。

### `.c` ファイルについて

DayZ スクリプトは `.c` ファイル拡張子を使用します。C 言語のように見えますが、これは DayZ 独自のスクリプト言語 **Enforce Script** です。クラス、継承、配列、マップがありますが、C、C++、C# ではありません。IDE がシンタックスエラーを表示するかもしれませんが、それは正常で予想されることです。

---

## ステップ 7: Addon Builder で PBO をパック

DayZ は `.pbo` アーカイブファイル（.zip に似ていますが、エンジンが理解する形式）から Mod を読み込みます。`Scripts` フォルダを PBO にパックする必要があります。

### Addon Builder の使用（GUI）

1. Steam から **DayZ Tools** を開く
2. **Addon Builder** をクリックして起動
3. **Source directory** を `P:\MyFirstMod\Scripts\` に設定
4. **Output/Destination directory** を新しいフォルダ `P:\@MyFirstMod\Addons\` に設定

   `@MyFirstMod\Addons\` フォルダが存在しない場合は先に作成してください。

5. **Addon Builder Options** で：
   - **Prefix** を `MyFirstMod\Scripts` に設定
   - その他のオプションはデフォルトのまま
6. **Pack** をクリック

成功すると、以下のファイルが作成されます：

```
P:\@MyFirstMod\Addons\Scripts.pbo
```

### 最終的な Mod 構造の設定

`mod.cpp` を `Addons` フォルダの横にコピーします：

```
P:\@MyFirstMod\
    mod.cpp                         <-- P:\MyFirstMod\mod.cpp からコピー
    Addons\
        Scripts.pbo                 <-- Addon Builder で作成
```

フォルダ名の `@` プレフィックスは、配布可能な Mod の慣例です。サーバー管理者やランチャーに、これが Mod パッケージであることを示します。

### 代替方法：パックなしのテスト（File Patching）

開発中は、ファイルパッチングモードを使用して PBO パックを完全にスキップできます。これはソースフォルダからスクリプトを直接読み込みます：

```
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

ファイルパッチングは、`.c` ファイルを編集してゲームを再起動するだけで変更が反映されるため、イテレーションが高速です。パック手順は不要です。ただし、ファイルパッチングは診断用実行ファイル（`DayZDiag_x64.exe`）でのみ動作し、配布には適していません。

---

## ステップ 8: DayZ で Mod を読み込む

Mod を読み込むには2つの方法があります：ランチャー経由またはコマンドラインパラメータ経由。

### オプション A: DayZ ランチャー

1. Steam から **DayZ ランチャー** を開く
2. **Mods** タブに移動
3. **Add local mod**（または「Add mod from local storage」）をクリック
4. `P:\@MyFirstMod\` を参照
5. チェックボックスをチェックして Mod を有効化
6. **Play** をクリック（ローカル/オフラインサーバーに接続するか、シングルプレイヤーを起動していることを確認）

### オプション B: コマンドライン（開発推奨）

より高速なイテレーションのために、コマンドラインパラメータで DayZ を直接起動します。ショートカットまたはバッチファイルを作成してください：

**診断用実行ファイルを使用（ファイルパッチング付き、PBO 不要）：**

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ\DayZDiag_x64.exe" -mod=P:\MyFirstMod -filePatching -server -config=serverDZ.cfg -port=2302
```

**パック済み PBO を使用：**

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ\DayZDiag_x64.exe" -mod=P:\@MyFirstMod -server -config=serverDZ.cfg -port=2302
```

`-server` フラグはローカルリッスンサーバーを起動します。`-filePatching` フラグはアンパックされたフォルダからスクリプトを読み込むことを許可します。

### クイックテスト：オフラインモード

最も速いテスト方法は、DayZ をオフラインモードで起動することです：

```batch
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

メインメニューで **Play** をクリックし、**Offline Mode**（または **Community Offline**）を選択します。サーバーなしでローカルシングルプレイヤーセッションが開始されます。

---

## ステップ 9: スクリプトログで確認

Mod を読み込んで DayZ を起動すると、エンジンはすべての `Print()` 出力をログファイルに書き込みます。

### ログファイルの場所

DayZ はローカル AppData ディレクトリにログを保存します：

```
C:\Users\<Windowsユーザー名>\AppData\Local\DayZ\
```

素早くアクセスするには：
1. **Win + R** を押して「ファイル名を指定して実行」ダイアログを開く
2. `%localappdata%\DayZ` と入力して Enter を押す

以下のような名前の最新ファイルを探してください：

```
script_<日付>_<時間>.log
```

例：`script_2025-01-15_14-30-22.log`

### 検索する内容

テキストエディタでログファイルを開き、`[MyFirstMod]` を検索してください。以下のメッセージのいずれかが表示されるはずです：

```
[MyFirstMod] Hello World! The SERVER mission has started.
```

または（クライアントとして読み込んだ場合）：

```
[MyFirstMod] Hello World! The CLIENT mission has started.
```

**メッセージが表示されたら、おめでとうございます。** 初めての DayZ Mod が動作しています。以下を達成しました：

1. Mod ディレクトリ構造を作成
2. エンジンが読み取る config を作成
3. `modded class` でバニラゲームコードにフック
4. スクリプトログに出力

### エラーが表示された場合は？

ログに `SCRIPT (E):` で始まる行がある場合、何かが間違っています。次のセクションを読んでください。

---

## ステップ 10: よくある問題のトラブルシューティング

### 問題：ログ出力がまったくない（Mod が読み込まれていないようだ）

**起動パラメータを確認してください。** `-mod=` パスが正しいフォルダを指していること。ファイルパッチングを使用する場合、パスが `Scripts/config.cpp` を直接含むフォルダを指していること（`@` フォルダではない）を確認してください。

**config.cpp が正しいレベルにあることを確認してください。** Mod ルート内の `Scripts/config.cpp` にある必要があります。間違ったフォルダにある場合、エンジンは Mod を静かに無視します。

**CfgPatches クラス名を確認してください。** `CfgPatches` ブロックがない場合、または構文が間違っている場合、PBO 全体がスキップされます。

**メインの DayZ ログを確認してください**（スクリプトログだけでなく）。以下を確認：
```
C:\Users\<ユーザー名>\AppData\Local\DayZ\DayZ_<日付>_<時間>.RPT
```
Mod 名を検索してください。「Addon MyFirstMod_Scripts requires addon DZ_Data which is not loaded.」のようなメッセージが表示される場合があります。

### 問題：`SCRIPT (E): Undefined variable` または `Undefined type`

コードがエンジンが認識しないものを参照しています。一般的な原因：

- **クラス名のタイプミス。** `MisionServer`（`s` が1つ足りない）の代わりに `MissionServer`。
- **間違ったスクリプトレイヤー。** `5_Mission` から `PlayerBase` を参照する場合は動作するはずです。ただし、ファイルを `3_Game` に配置してミッション型を参照すると、このエラーが発生します。
- **`super.OnInit()` の呼び出し漏れ。** 省略すると連鎖的な失敗を引き起こす可能性があります。

### 問題：`SCRIPT (E): Member not found`

呼び出しているメソッドがクラスに存在しません。メソッド名を再確認し、バニラの実メソッドをオーバーライドしていることを確認してください。`OnInit` は `MissionServer` と `MissionGameplay` に存在しますが、すべてのクラスに存在するわけではありません。

### 問題：Mod は読み込まれるがスクリプトが実行されない

- **ファイル拡張子：** スクリプトファイルが `.c` で終わっていることを確認（`.c.txt` や `.cs` ではない）。Windows はデフォルトで拡張子を隠す場合があります。
- **スクリプトパスの不一致：** `config.cpp` の `files[]` パスが実際のディレクトリと一致している必要があります。`"MyFirstMod/Scripts/5_Mission"` は、エンジンが Mod ルートからの相対パスでそのフォルダを探すことを意味します。
- **クラス名：** `modded class MissionServer` は大文字小文字を区別します。バニラのクラス名と正確に一致する必要があります。

### 問題：PBO パッキングエラー

- `config.cpp` がパック対象（`Scripts/` フォルダ）のルートレベルにあることを確認してください。
- Addon Builder のプレフィックスが Mod パスと一致していることを確認してください。
- Scripts フォルダにテキスト以外のファイル（`.exe`、`.dll`、バイナリファイル）が混在していないことを確認してください。

### 問題：起動時にゲームがクラッシュする

- `config.cpp` のシンタックスエラーを確認してください。セミコロン、ブレース、引用符の欠落は config パーサーをクラッシュさせる可能性があります。
- `requiredAddons` が有効なアドオン名を列挙していることを確認してください。スペルミスのアドオン名はハードエラーを引き起こします。
- 起動パラメータから Mod を削除し、Mod なしでゲームが起動することを確認してください。次に Mod を戻して問題を分離してください。

---

## 完全なファイルリファレンス

簡単にコピーペーストできるように、3つのファイルすべてを完全な形で示します：

### ファイル 1: `MyFirstMod/mod.cpp`

```cpp
name = "My First Mod";
author = "YourName";
version = "1.0";
overview = "My very first DayZ mod. Prints Hello World to the script log.";
```

### ファイル 2: `MyFirstMod/Scripts/config.cpp`

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### ファイル 3: `MyFirstMod/Scripts/5_Mission/MyFirstMod/MissionHello.c`

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The CLIENT mission has started.");
    }
};
```

---

## 次のステップ

Mod が動作したので、以下が自然な進展です：

1. **[第 8.2 章: カスタムアイテムの作成](02-custom-item.md)** -- テクスチャとスポーンを備えた新しいゲーム内アイテムを定義します。
2. **スクリプトレイヤーの追加** -- `3_Game` と `4_World` フォルダを作成して、設定、データクラス、エンティティロジックを整理します。[第 2.1 章: 5 レイヤースクリプト階層](../02-mod-structure/01-five-layers.md) を参照してください。
3. **キーバインドの追加** -- `Inputs.xml` ファイルを作成してカスタムキーアクションを登録します。
4. **UI の作成** -- レイアウトファイルと `ScriptedWidgetEventHandler` を使用してゲーム内パネルを構築します。[第 3 章: GUI システム](../03-gui-system/01-widget-types.md) を参照してください。
5. **フレームワークの使用** -- Community Framework (CF) または独自の Mod Core と統合して、RPC、設定管理、管理パネルなどの高度な機能を使用します。

---

## ベストプラクティス

- **PBO を構築する前に、常に `-filePatching` でテストしてください。** パック→コピー→再起動のサイクルを省略し、イテレーション時間を数分から数秒に短縮します。
- **最速のイテレーションには `5_Mission` レイヤーから始めてください。** `OnInit()` のようなミッションフックは、Mod が読み込まれて実行されることを証明する最も簡単な方法です。実際に必要になったときにのみ `3_Game` と `4_World` を追加してください。
- **オーバーライドされたメソッドでは常に最初に `super` を呼び出してください。** `super.OnInit()` を省略すると、バニラの動作と同じメソッドにフックする他のすべての Mod が静かに壊れます。
- **Print 出力に一意のプレフィックスを使用してください**（例：`[MyFirstMod]`）。スクリプトログにはバニラや他の Mod からの数千行が含まれています --- プレフィックスがなければ出力を見つけることは不可能です。
- **`config.cpp` のシンタックスをシンプルかつ有効に保ってください。** config.cpp のセミコロンやブレースの欠落は、明確なエラーメッセージなしにハードクラッシュや Mod のサイレントスキップを引き起こします。

---

## 理論と実践

| 概念 | 理論 | 現実 |
|---------|--------|---------|
| `mod.cpp` フィールド | `version` は依存関係の解決に使用される | エンジンはバージョン文字列を完全に無視する --- ランチャー用の表示のみ。 |
| CfgPatches `requiredAddons` | Mod が正しい順序で読み込まれるよう依存関係をリスト | アドオン名をスペルミスすると、スクリプトログにエラーなしで PBO 全体が静かにスキップされる。代わりに `.RPT` ファイルを確認。 |
| ファイルパッチング | `.c` ファイルを編集して再接続すると即座に変更が反映 | `config.cpp` と新しく追加されたファイルはファイルパッチングの対象外。それらには PBO の再構築が必要。 |
| オフラインモードテスト | Mod の動作を確認する簡単な方法 | 一部の API（`GetGame().GetPlayer().GetIdentity()` など）はオフラインモードで NULL を返し、実サーバーでは発生しないクラッシュを引き起こす。 |

---

## 学んだこと

このチュートリアルで学んだこと：
- DayZ Tools のインストールと P: ドライブワークスペースの設定方法
- すべての Mod に必要な3つの必須ファイル：`mod.cpp`、`config.cpp`、少なくとも1つの `.c` スクリプト
- `modded class` がバニラクラスを置き換えずに拡張する仕組み
- PBO のパック、Mod の読み込み、スクリプトログの確認による動作検証の方法

**次：** [第 8.2 章: カスタムアイテムの作成](02-custom-item.md)
