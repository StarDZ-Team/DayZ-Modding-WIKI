# 第8.5章: DayZ Mod テンプレートの使い方

> **概要:** このチュートリアルでは、InclementDab のオープンソース DayZ Mod テンプレートを使用して、新しい Mod プロジェクトを数秒でブートストラップする方法を解説します。すべてのファイルをゼロから作成する代わりに、正しいフォルダ構造、config.cpp、mod.cpp、およびスクリプトレイヤーのスタブがすでに用意されたスケルトンをクローンします。いくつかの名前を変更するだけで、すぐにコードを書き始めることができます。

---

## 目次

- [DayZ Mod テンプレートとは？](#dayz-mod-テンプレートとは)
- [テンプレートが提供するもの](#テンプレートが提供するもの)
- [ステップ 1: テンプレートのクローンまたはダウンロード](#ステップ-1-テンプレートのクローンまたはダウンロード)
- [ステップ 2: ファイル構造の理解](#ステップ-2-ファイル構造の理解)
- [ステップ 3: Mod の名前変更](#ステップ-3-mod-の名前変更)
- [ステップ 4: config.cpp の更新](#ステップ-4-configcpp-の更新)
- [ステップ 5: mod.cpp の更新](#ステップ-5-modcpp-の更新)
- [ステップ 6: スクリプトフォルダとファイルのリネーム](#ステップ-6-スクリプトフォルダとファイルのリネーム)
- [ステップ 7: ビルドとテスト](#ステップ-7-ビルドとテスト)
- [DayZ Tools および Workbench との統合](#dayz-tools-および-workbench-との統合)
- [テンプレート vs 手動セットアップ](#テンプレート-vs-手動セットアップ)
- [次のステップ](#次のステップ)

---

## DayZ Mod テンプレートとは？

**DayZ Mod テンプレート**は、InclementDab がメンテナンスするオープンソースリポジトリで、DayZ 用の完全なすぐに使える Mod スケルトンを提供します。

**リポジトリ:** [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)

すべてのファイルを手動で作成する（[第8.1章: はじめての Mod](01-first-mod.md) で解説）代わりに、テンプレートはすべてのボイラープレートがすでに配置された、構築済みのディレクトリ構造を提供します。クローンして、いくつかの識別子を変更するだけで、ゲームロジックを書き始める準備が整います。

これは、Hello World Mod を作成済みで、より複雑なプロジェクトに進みたい方にとって推奨されるスタートポイントです。

---

## テンプレートが提供するもの

テンプレートには、DayZ Mod のコンパイルとロードに必要なすべてが含まれています。

| ファイル / フォルダ | 目的 |
|---------------|---------|
| `mod.cpp` | DayZ ランチャーに表示される Mod メタデータ（名前、作者、バージョン） |
| `config.cpp` | Mod をエンジンに登録する CfgPatches および CfgMods 宣言 |
| `Scripts/3_Game/` | Game レイヤーのスクリプトスタブ（列挙型、定数、設定クラス） |
| `Scripts/4_World/` | World レイヤーのスクリプトスタブ（エンティティ、マネージャー、ワールド操作） |
| `Scripts/5_Mission/` | Mission レイヤーのスクリプトスタブ（UI、ミッションフック） |
| `.gitignore` | DayZ 開発用に事前設定された無視設定（PBO、ログ、一時ファイル） |

テンプレートは [第2.1章: 5層スクリプト階層](../02-mod-structure/01-five-layers.md) で文書化されている標準の5層スクリプト階層に従います。3つのスクリプトレイヤーすべてが config.cpp で接続されているため、追加の設定なしにどのレイヤーにもすぐにコードを配置できます。

---

## ステップ 1: テンプレートのクローンまたはダウンロード

### オプション A: GitHub の「Use this template」機能を使用

1. [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template) にアクセスします
2. リポジトリ上部の緑色の **「Use this template」** ボタンをクリックします
3. **「Create a new repository」** を選択します
4. リポジトリに名前を付けます（例: `MyAwesomeMod`）
5. 新しいリポジトリを P: ドライブにクローンします：

```bash
cd P:\
git clone https://github.com/YourUsername/MyAwesomeMod.git
```

### オプション B: 直接クローン

自分の GitHub リポジトリが不要な場合は、テンプレートを直接クローンします：

```bash
cd P:\
git clone https://github.com/InclementDab/DayZ-Mod-Template.git MyAwesomeMod
```

### オプション C: ZIP としてダウンロード

1. リポジトリページにアクセスします
2. **Code** をクリックし、次に **Download ZIP** をクリックします
3. ZIP を `P:\MyAwesomeMod\` に展開します

---

## ステップ 2: ファイル構造の理解

クローン後、Mod ディレクトリは以下のようになります：

```
P:\MyAwesomeMod\
    mod.cpp
    Scripts\
        config.cpp
        3_Game\
            ModName\
                (game-layer scripts)
        4_World\
            ModName\
                (world-layer scripts)
        5_Mission\
            ModName\
                (mission-layer scripts)
```

### 各パーツの役割

**`mod.cpp`** は Mod のIDカードです。DayZ ランチャーの Mod リストでプレイヤーに表示される内容を制御します。利用可能なすべてのフィールドについては [第2.3章: mod.cpp と Workshop](../02-mod-structure/03-mod-cpp.md) を参照してください。

**`Scripts/config.cpp`** は最も重要なファイルです。DayZ エンジンに以下を伝えます：
- Mod が何に依存しているか（`CfgPatches.requiredAddons[]`）
- 各スクリプトレイヤーがどこにあるか（`CfgMods.class defs`）
- どのプリプロセッサ定義を設定するか（`defines[]`）

完全なリファレンスについては [第2.2章: config.cpp 詳解](../02-mod-structure/02-config-cpp.md) を参照してください。

**`Scripts/3_Game/`** が最初にロードされます。列挙型、定数、RPC ID、設定クラス、およびワールドエンティティを参照しないものをここに配置します。

**`Scripts/4_World/`** が2番目にロードされます。エンティティクラス（`modded class ItemBase`）、マネージャー、およびゲームオブジェクトと対話するものをここに配置します。

**`Scripts/5_Mission/`** が最後にロードされます。ミッションフック（`modded class MissionServer`）、UI パネル、および起動ロジックをここに配置します。このレイヤーは下位のすべてのレイヤーの型を参照できます。

---

## ステップ 3: Mod の名前変更

テンプレートにはプレースホルダー名が含まれています。Mod の実際の名前に置き換える必要があります。以下は体系的なアプローチです。

### 名前の決定

編集を始める前に、以下を決定してください：

| 識別子 | 例 | 使用場所 |
|------------|---------|---------|
| **Mod 表示名** | `"My Awesome Mod"` | mod.cpp、config.cpp |
| **ディレクトリ名** | `MyAwesomeMod` | フォルダ名、config.cpp パス |
| **CfgPatches クラス** | `MyAwesomeMod_Scripts` | config.cpp CfgPatches |
| **CfgMods クラス** | `MyAwesomeMod` | config.cpp CfgMods |
| **スクリプトサブフォルダ** | `MyAwesomeMod` | 3_Game/、4_World/、5_Mission/ 内 |
| **プリプロセッサ定義** | `MYAWESOMEMOD` | config.cpp defines[]、#ifdef チェック |

### 命名規則

- ディレクトリ名とクラス名には**スペースや特殊文字を使用しないでください**。PascalCase またはアンダースコアを使用してください。
- **CfgPatches クラス名はグローバルに一意でなければなりません。** 同じ CfgPatches クラス名を持つ2つの Mod は競合します。Mod 名をプレフィックスとして使用してください。
- 各レイヤー内の**スクリプトサブフォルダ名**は、一貫性のために Mod 名と一致させるべきです。

---

## ステップ 4: config.cpp の更新

`Scripts/config.cpp` を開いて、以下のセクションを更新します。

### CfgPatches

テンプレートのクラス名を自分のものに置き換えます：

```cpp
class CfgPatches
{
    class MyAwesomeMod_Scripts    // <-- Your unique patch name
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"            // Base game dependency
        };
    };
};
```

Mod が別の Mod に依存する場合は、その CfgPatches クラス名を `requiredAddons[]` に追加します：

```cpp
requiredAddons[] =
{
    "DZ_Data",
    "CF_Scripts"              // Depends on Community Framework
};
```

### CfgMods

Mod のアイデンティティとスクリプトパスを更新します：

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

**重要ポイント：**
- `dir` の値は Mod のルートフォルダ名と正確に一致する必要があります。
- 各 `files[]` パスは Mod ルートからの相対パスです。
- `dependencies[]` 配列には、フックするバニラのスクリプトモジュールをリストします。ほとんどの Mod は3つすべてを使用します：`"Game"`、`"World"`、`"Mission"`。

### プリプロセッサ定義（オプション）

他の Mod に自分の Mod の存在を検出させたい場合は、`defines[]` 配列を追加します：

```cpp
class MyAwesomeMod
{
    // ... (other fields above)

    class defs
    {
        class gameScriptModule
        {
            value = "";
            files[] = { "MyAwesomeMod/Scripts/3_Game" };
        };
        // ... other modules ...
    };

    // Enable cross-mod detection
    defines[] = { "MYAWESOMEMOD" };
};
```

他の Mod は `#ifdef MYAWESOMEMOD` を使用して、あなたの Mod と統合するコードを条件付きでコンパイルできます。

---

## ステップ 5: mod.cpp の更新

ルートディレクトリの `mod.cpp` を開いて、Mod の情報で更新します：

```cpp
name         = "My Awesome Mod";
author       = "YourName";
version      = "1.0.0";
overview     = "A brief description of what your mod does.";
picture      = "";             // Optional: path to a preview image
logo         = "";             // Optional: path to a logo
logoSmall    = "";             // Optional: path to a small logo
logoOver     = "";             // Optional: path to a logo hover state
tooltip      = "My Awesome Mod";
action       = "";             // Optional: URL to your mod's website
```

最低限、`name`、`author`、`overview` を設定してください。その他のフィールドはオプションですが、ランチャーでの表示を改善します。

---

## ステップ 6: スクリプトフォルダとファイルのリネーム

各レイヤー内のスクリプトサブフォルダを Mod 名に合わせてリネームします：

```
Scripts/3_Game/ModName/    -->  Scripts/3_Game/MyAwesomeMod/
Scripts/4_World/ModName/   -->  Scripts/4_World/MyAwesomeMod/
Scripts/5_Mission/ModName/ -->  Scripts/5_Mission/MyAwesomeMod/
```

これらのフォルダ内で、プレースホルダーの `.c` ファイルをリネームし、クラス名を更新します。たとえば、テンプレートに `ModInit` という名前のクラスを持つ `ModInit.c` のようなファイルが含まれている場合、`MyAwesomeModInit.c` にリネームしてクラスを更新します：

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

開発中の最速のテスト方法です：

```batch
DayZDiag_x64.exe -mod=P:\MyAwesomeMod -filePatching
```

これにより、PBO をパックせずにソースフォルダから直接スクリプトがロードされます。`.c` ファイルを編集し、ゲームを再起動するだけで、変更がすぐに反映されます。

### Addon Builder の使用（配布用）

配布の準備ができたら：

1. Steam から **DayZ Tools** を開きます
2. **Addon Builder** を起動します
3. **Source directory** を `P:\MyAwesomeMod\Scripts\` に設定します
4. **Output directory** を `P:\@MyAwesomeMod\Addons\` に設定します
5. **Prefix** を `MyAwesomeMod\Scripts` に設定します
6. **Pack** をクリックします

次に `mod.cpp` を `Addons` フォルダの隣にコピーします：

```
P:\@MyAwesomeMod\
    mod.cpp
    Addons\
        Scripts.pbo
```

### スクリプトログで確認

起動後、スクリプトログでメッセージを確認します：

```
%localappdata%\DayZ\script_<date>_<time>.log
```

Mod のプレフィックスタグ（例: `[MyAwesomeMod]`）を検索してください。

---

## DayZ Tools および Workbench との統合

### Workbench

DayZ Workbench はシンタックスハイライト付きで Mod のスクリプトを開いて編集できます：

1. DayZ Tools から **Workbench** を開きます
2. **File > Open** で Mod の `Scripts/` フォルダに移動します
3. 任意の `.c` ファイルを開いて、基本的な Enforce Script サポートで編集します

Workbench は `config.cpp` を読み取って、どのファイルがどのスクリプトモジュールに属しているかを理解するため、正しく設定された config.cpp が不可欠です。

### P: ドライブのセットアップ

テンプレートは P: ドライブから動作するよう設計されています。別の場所にクローンした場合は、ジャンクションを作成してください：

```batch
mklink /J P:\MyAwesomeMod "D:\Projects\MyAwesomeMod"
```

これにより、ファイルを移動せずに `P:\MyAwesomeMod` で Mod にアクセスできるようになります。

### Addon Builder の自動化

繰り返しビルド用に、Mod のルートにバッチファイルを作成できます：

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

| 観点 | テンプレート | 手動（第8.1章） |
|--------|----------|----------------------|
| **初回ビルドまでの時間** | 約2分 | 約15分 |
| **3つのスクリプトレイヤー** | 事前設定済み | 必要に応じて追加 |
| **config.cpp** | すべてのモジュール付きで完全 | 最小限（mission のみ） |
| **Git 対応** | .gitignore 付属 | 自分で作成 |
| **学習効果** | 低い（ファイルが事前作成済み） | 高い（すべて自分で構築） |
| **推奨対象** | 経験豊富なモッダー、新規プロジェクト | 基礎を学ぶ初心者モッダー |

**推奨事項:** 初めての DayZ Mod であれば、まず [第8.1章](01-first-mod.md) で各ファイルを理解してください。慣れたら、今後のプロジェクトにはすべてテンプレートを使用してください。

---

## 次のステップ

テンプレートベースの Mod が稼働したら、以下のことができます：

1. **カスタムアイテムの追加** -- [第8.2章: カスタムアイテムの作成](02-custom-item.md) に従って config.cpp でアイテムを定義します。
2. **管理パネルの構築** -- [第8.3章: 管理パネルの構築](03-admin-panel.md) でサーバー管理 UI を作成します。
3. **チャットコマンドの追加** -- [第8.4章: チャットコマンドの追加](04-chat-commands.md) でゲーム内テキストコマンドを実装します。
4. **config.cpp の詳細学習** -- [第2.2章: config.cpp 詳解](../02-mod-structure/02-config-cpp.md) ですべてのフィールドを理解します。
5. **mod.cpp オプションの学習** -- [第2.3章: mod.cpp と Workshop](../02-mod-structure/03-mod-cpp.md) で Workshop 公開について学びます。
6. **依存関係の追加** -- Mod が Community Framework または別の Mod を使用する場合、`requiredAddons[]` を更新して [第2.4章: 最小構成の Mod](../02-mod-structure/04-minimum-viable-mod.md) を参照してください。

---

**前へ:** [第8.4章: チャットコマンドの追加](04-chat-commands.md) | [ホーム](../../README.md)
