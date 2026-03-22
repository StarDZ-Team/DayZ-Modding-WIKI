# 第8.5章: DayZ Mod テンプレートの使い方

[ホーム](../README.md) | [<< 前へ: チャットコマンドの追加](04-chat-commands.md) | **DayZ Mod テンプレートの使い方** | [次へ: デバッグとテスト >>](06-debugging-testing.md)

---

> **概要:** このチュートリアルでは、InclementDab のオープンソース DayZ Mod テンプレートを使用して、数秒で新しい Mod プロジェクトをブートストラップする方法を説明します。すべてのファイルをゼロから作成する代わりに、正しいフォルダ構造、config.cpp、mod.cpp、スクリプトレイヤーのスタブがすでに用意されたスケルトンをクローンします。いくつかの名前を変更するだけで、すぐにコーディングを開始できます。

---

## 目次

- [DayZ Mod テンプレートとは？](#dayz-mod-テンプレートとは)
- [テンプレートが提供するもの](#テンプレートが提供するもの)
- [ステップ 1: テンプレートのクローンまたはダウンロード](#ステップ-1-テンプレートのクローンまたはダウンロード)
- [ステップ 2: ファイル構造の理解](#ステップ-2-ファイル構造の理解)
- [ステップ 3: Mod の名前変更](#ステップ-3-mod-の名前変更)
- [ステップ 4: config.cpp の更新](#ステップ-4-configcpp-の更新)
- [ステップ 5: mod.cpp の更新](#ステップ-5-modcpp-の更新)
- [ステップ 6: スクリプトフォルダとファイルの名前変更](#ステップ-6-スクリプトフォルダとファイルの名前変更)
- [ステップ 7: ビルドとテスト](#ステップ-7-ビルドとテスト)
- [DayZ Tools と Workbench との統合](#dayz-tools-と-workbench-との統合)
- [テンプレート vs 手動セットアップ](#テンプレート-vs-手動セットアップ)
- [次のステップ](#次のステップ)

---

## DayZ Mod テンプレートとは？

**DayZ Mod テンプレート** は、InclementDab がメンテナンスするオープンソースリポジトリで、DayZ 用の完全で即座に使用可能な Mod スケルトンを提供します。

**リポジトリ:** [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)

すべてのファイルを手動で作成する代わりに（[第8.1章: 初めての Mod](01-first-mod.md) で解説）、テンプレートはすべてのボイラープレートがすでに配置された事前ビルド済みのディレクトリ構造を提供します。クローンして、いくつかの識別子を変更するだけで、ゲームロジックを書く準備が整います。

Hello World Mod を作成したことがあり、より複雑なプロジェクトに進みたい方にとって、これが推奨される出発点です。

---

## テンプレートが提供するもの

テンプレートには、DayZ Mod のコンパイルとロードに必要なすべてが含まれています。

| ファイル / フォルダ | 目的 |
|---------------|---------|
| `mod.cpp` | DayZ ランチャーに表示される Mod メタデータ（名前、作者、バージョン） |
| `config.cpp` | Mod をエンジンに登録する CfgPatches と CfgMods 宣言 |
| `Scripts/3_Game/` | Game レイヤーのスクリプトスタブ（列挙、定数、設定クラス） |
| `Scripts/4_World/` | World レイヤーのスクリプトスタブ（エンティティ、マネージャー、ワールドインタラクション） |
| `Scripts/5_Mission/` | Mission レイヤーのスクリプトスタブ（UI、ミッションフック） |
| `.gitignore` | DayZ 開発用に事前設定された無視ファイル（PBO、ログ、一時ファイル） |

テンプレートは[第2.1章: 5レイヤースクリプト階層](../02-mod-structure/01-five-layers.md)で文書化されている標準的な5レイヤースクリプト階層に従っています。3つのスクリプトレイヤーすべてが config.cpp で配線済みなので、追加設定なしで任意のレイヤーにすぐにコードを配置できます。

---

## ステップ 1: テンプレートのクローンまたはダウンロード

### オプション A: GitHub の「Use this template」機能を使用

1. [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template) にアクセス
2. リポジトリ上部の緑色の **「Use this template」** ボタンをクリック
3. **「Create a new repository」** を選択
4. リポジトリに名前を付ける（例: `MyAwesomeMod`）
5. 新しいリポジトリを P: ドライブにクローン:

```bash
cd P:\
git clone https://github.com/YourUsername/MyAwesomeMod.git
```

### オプション B: 直接クローン

独自の GitHub リポジトリが不要な場合、テンプレートを直接クローンします。

```bash
cd P:\
git clone https://github.com/InclementDab/DayZ-Mod-Template.git MyAwesomeMod
```

### オプション C: ZIP としてダウンロード

1. リポジトリページにアクセス
2. **Code** → **Download ZIP** をクリック
3. ZIP を `P:\MyAwesomeMod\` に展開

---

## ステップ 2: ファイル構造の理解

クローン後の Mod ディレクトリは以下のようになります。

```
P:\MyAwesomeMod\
    mod.cpp
    Scripts\
        config.cpp
        3_Game\
            ModName\
                (game レイヤーのスクリプト)
        4_World\
            ModName\
                (world レイヤーのスクリプト)
        5_Mission\
            ModName\
                (mission レイヤーのスクリプト)
```

### 各パーツの関係

**`mod.cpp`** は Mod の ID カードです。DayZ ランチャーの Mod リストでプレイヤーに表示される内容を制御します。すべての利用可能なフィールドについては[第2.3章: mod.cpp と Workshop](../02-mod-structure/03-mod-cpp.md)を参照してください。

**`Scripts/config.cpp`** は最も重要なファイルです。DayZ エンジンに以下を伝えます:
- Mod が何に依存しているか（`CfgPatches.requiredAddons[]`）
- 各スクリプトレイヤーがどこにあるか（`CfgMods.class defs`）
- どのプリプロセッサ定義を設定するか（`defines[]`）

完全なリファレンスについては[第2.2章: config.cpp 詳細解説](../02-mod-structure/02-config-cpp.md)を参照してください。

**`Scripts/3_Game/`** は最初にロードされます。列挙、定数、RPC ID、設定クラス、ワールドエンティティを参照しないものをここに配置します。

**`Scripts/4_World/`** は2番目にロードされます。エンティティクラス（`modded class ItemBase`）、マネージャー、ゲームオブジェクトとインタラクションするものをここに配置します。

**`Scripts/5_Mission/`** は最後にロードされます。ミッションフック（`modded class MissionServer`）、UI パネル、スタートアップロジックをここに配置します。このレイヤーは下位のすべてのレイヤーの型を参照できます。

---

## ステップ 3: Mod の名前変更

テンプレートにはプレースホルダー名が付いています。これらを Mod の実際の名前に置き換える必要があります。以下に体系的なアプローチを示します。

### 名前の選択

編集を行う前に、以下を決定してください:

| 識別子 | 例 | 使用場所 |
|------------|---------|---------|
| **Mod 表示名** | `"My Awesome Mod"` | mod.cpp、config.cpp |
| **ディレクトリ名** | `MyAwesomeMod` | フォルダ名、config.cpp のパス |
| **CfgPatches クラス** | `MyAwesomeMod_Scripts` | config.cpp CfgPatches |
| **CfgMods クラス** | `MyAwesomeMod` | config.cpp CfgMods |
| **スクリプトサブフォルダ** | `MyAwesomeMod` | 3_Game/、4_World/、5_Mission/ の内部 |
| **プリプロセッサ定義** | `MYAWESOMEMOD` | config.cpp の defines[]、#ifdef チェック |

### 命名規則

- ディレクトリ名やクラス名に**スペースや特殊文字は使用しないでください**。PascalCase またはアンダースコアを使用してください。
- **CfgPatches クラス名はグローバルに一意でなければなりません。** 同じ CfgPatches クラス名を持つ2つの Mod は衝突します。Mod 名をプレフィックスとして使用してください。
- 各レイヤー内の**スクリプトサブフォルダ名**は一貫性のために Mod 名と一致させてください。

---

## ステップ 4: config.cpp の更新

`Scripts/config.cpp` を開き、以下のセクションを更新します。

### CfgPatches

テンプレートのクラス名を自分のものに置き換えます:

```cpp
class CfgPatches
{
    class MyAwesomeMod_Scripts    // <-- あなた固有のパッチ名
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"            // ベースゲームの依存関係
        };
    };
};
```

Mod が別の Mod に依存する場合、その CfgPatches クラス名を `requiredAddons[]` に追加します:

```cpp
requiredAddons[] =
{
    "DZ_Data",
    "CF_Scripts"              // Community Framework に依存
};
```

### CfgMods

Mod のアイデンティティとスクリプトパスを更新します:

```cpp
class CfgMods
{
    class MyAwesomeMod
    {
        dir = "MyAwesomeMod";
        name = "My Awesome Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/5_Mission" };
            };
        };
    };
};
```

**重要なポイント:**
- `dir` の値は Mod のルートフォルダ名と正確に一致する必要があります。
- 各 `files[]` パスは Mod ルートからの相対パスです。
- `dependencies[]` 配列にはフックするバニラスクリプトモジュールをリストします。ほとんどの Mod は3つすべてを使用します: `"Game"`, `"World"`, `"Mission"`。

### プリプロセッサ定義（オプション）

他の Mod があなたの Mod の存在を検出できるようにする場合は、`defines[]` 配列を追加します:

```cpp
class MyAwesomeMod
{
    // ... （上記の他のフィールド）

    class defs
    {
        class gameScriptModule
        {
            value = "";
            files[] = { "MyAwesomeMod/Scripts/3_Game" };
        };
        // ... 他のモジュール ...
    };

    // クロス Mod 検出を有効化
    defines[] = { "MYAWESOMEMOD" };
};
```

他の Mod は `#ifdef MYAWESOMEMOD` を使用して、あなたの Mod と統合するコードを条件付きでコンパイルできます。

---

## ステップ 5: mod.cpp の更新

ルートディレクトリの `mod.cpp` を開き、Mod の情報で更新します:

```cpp
name         = "My Awesome Mod";
author       = "YourName";
version      = "1.0.0";
overview     = "A brief description of what your mod does.";
picture      = "";             // オプション: プレビュー画像へのパス
logo         = "";             // オプション: ロゴへのパス
logoSmall    = "";             // オプション: 小さいロゴへのパス
logoOver     = "";             // オプション: ロゴのホバー状態へのパス
tooltip      = "My Awesome Mod";
action       = "";             // オプション: Mod のウェブサイトへの URL
```

最低限、`name`、`author`、`overview` を設定してください。他のフィールドはオプションですが、ランチャーでの表示を改善します。

---

## ステップ 6: スクリプトフォルダとファイルの名前変更

各レイヤー内のスクリプトサブフォルダを Mod 名に合わせて名前変更します:

```
Scripts/3_Game/ModName/    -->  Scripts/3_Game/MyAwesomeMod/
Scripts/4_World/ModName/   -->  Scripts/4_World/MyAwesomeMod/
Scripts/5_Mission/ModName/ -->  Scripts/5_Mission/MyAwesomeMod/
```

これらのフォルダ内で、プレースホルダーの `.c` ファイルを名前変更し、クラス名を更新します。例えば、テンプレートに `ModInit.c` というファイルが含まれていて `ModInit` というクラスがある場合、`MyAwesomeModInit.c` に名前変更してクラスを更新します:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyAwesomeMod] Server initialized!");
    }
};
```

---

## ステップ 7: ビルドとテスト

### ファイルパッチングの使用（高速イテレーション）

開発中のテストで最も速い方法です:

```batch
DayZDiag_x64.exe -mod=P:\MyAwesomeMod -filePatching
```

PBO をパッキングせずにソースフォルダから直接スクリプトをロードします。`.c` ファイルを編集し、ゲームを再起動すると、すぐに変更が反映されます。

### Addon Builder の使用（配布用）

配布する準備ができたら:

1. Steam から **DayZ Tools** を開く
2. **Addon Builder** を起動
3. **Source directory** を `P:\MyAwesomeMod\Scripts\` に設定
4. **Output directory** を `P:\@MyAwesomeMod\Addons\` に設定
5. **Prefix** を `MyAwesomeMod\Scripts` に設定
6. **Pack** をクリック

次に `mod.cpp` を `Addons` フォルダの隣にコピーします:

```
P:\@MyAwesomeMod\
    mod.cpp
    Addons\
        Scripts.pbo
```

### スクリプトログで確認

起動後、スクリプトログでメッセージを確認します:

```
%localappdata%\DayZ\script_<date>_<time>.log
```

Mod のプレフィックスタグ（例: `[MyAwesomeMod]`）を検索してください。

---

## DayZ Tools と Workbench との統合

### Workbench

DayZ Workbench はシンタックスハイライト付きで Mod のスクリプトを開いて編集できます:

1. DayZ Tools から **Workbench** を開く
2. **File > Open** で Mod の `Scripts/` フォルダに移動
3. 任意の `.c` ファイルを開いて基本的な Enforce Script サポート付きで編集

Workbench は `config.cpp` を読み取ってどのファイルがどのスクリプトモジュールに属するかを理解するため、正しく設定された config.cpp が不可欠です。

### P: ドライブのセットアップ

テンプレートは P: ドライブから動作するように設計されています。別の場所にクローンした場合は、ジャンクションを作成します:

```batch
mklink /J P:\MyAwesomeMod "D:\Projects\MyAwesomeMod"
```

これにより、ファイルを移動せずに `P:\MyAwesomeMod` で Mod にアクセスできるようになります。

### Addon Builder の自動化

繰り返しビルドのために、Mod のルートにバッチファイルを作成できます:

```batch
@echo off
set DAYZ_TOOLS="C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools"
set SOURCE=P:\MyAwesomeMod\Scripts
set OUTPUT=P:\@MyAwesomeMod\Addons
set PREFIX=MyAwesomeMod\Scripts

%DAYZ_TOOLS%\Bin\AddonBuilder\AddonBuilder.exe %SOURCE% %OUTPUT% -prefix=%PREFIX% -clear
echo Build complete.
pause
```

---

## テンプレート vs 手動セットアップ

| 項目 | テンプレート | 手動（第8.1章） |
|--------|----------|----------------------|
| **初回ビルドまでの時間** | 約2分 | 約15分 |
| **3つのスクリプトレイヤー** | 事前設定済み | 必要に応じて追加 |
| **config.cpp** | 全モジュール完備 | 最小限（mission のみ） |
| **Git 対応** | .gitignore 同梱 | 自分で作成 |
| **学習効果** | 低い（ファイルが事前作成済み） | 高い（すべてを自分で構築） |
| **推奨対象** | 経験豊富なモッダー、新規プロジェクト | Mod 開発を学ぶ初心者 |

**推奨:** DayZ Mod が初めての場合は、すべてのファイルを理解するために[第8.1章](01-first-mod.md)から始めてください。慣れたら、以降のすべてのプロジェクトでテンプレートを使用してください。

---

## 次のステップ

テンプレートベースの Mod が動作したら、以下のことができます:

1. **カスタムアイテムを追加** -- [第8.2章: カスタムアイテムの作成](02-custom-item.md)に従って config.cpp でアイテムを定義します。
2. **管理パネルを構築** -- [第8.3章: 管理パネルの構築](03-admin-panel.md)に従ってサーバー管理 UI を作成します。
3. **チャットコマンドを追加** -- [第8.4章: チャットコマンドの追加](04-chat-commands.md)に従ってゲーム内テキストコマンドを作成します。
4. **config.cpp を深く学ぶ** -- [第2.2章: config.cpp 詳細解説](../02-mod-structure/02-config-cpp.md)ですべてのフィールドを理解します。
5. **mod.cpp のオプションを学ぶ** -- [第2.3章: mod.cpp と Workshop](../02-mod-structure/03-mod-cpp.md)で Workshop 公開について学びます。
6. **依存関係を追加** -- Mod が Community Framework や他の Mod を使用する場合、`requiredAddons[]` を更新し、[第2.4章: 初めての Mod](../02-mod-structure/04-minimum-viable-mod.md)を参照してください。

---

**前へ:** [第8.4章: チャットコマンドの追加](04-chat-commands.md) | [ホーム](../README.md)
