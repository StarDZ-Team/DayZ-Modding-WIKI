# 第2.4章: はじめてのMod -- 最小構成

[ホーム](../README.md) | [<< 前へ: mod.cppとWorkshop](03-mod-cpp.md) | **最小構成Mod** | [次へ: ファイル構成 >>](05-file-organization.md)

---

> **概要:** この章では、最小限のDayZ Modをゼロから作成する手順を解説します。最終的に、ゲーム起動時にスクリプトログにメッセージを出力する動作するModが完成します。ファイル3つ、依存関係なし、5分以内で完了します。

---

## 目次

- [必要なもの](#必要なもの)
- [目標](#目標)
- [ステップ1: ディレクトリ構造の作成](#ステップ1-ディレクトリ構造の作成)
- [ステップ2: mod.cppの作成](#ステップ2-modcppの作成)
- [ステップ3: config.cppの作成](#ステップ3-configcppの作成)
- [ステップ4: 最初のスクリプトの作成](#ステップ4-最初のスクリプトの作成)
- [ステップ5: パックとテスト](#ステップ5-パックとテスト)
- [ステップ6: 動作確認](#ステップ6-動作確認)
- [何が起きたかを理解する](#何が起きたかを理解する)
- [次のステップ](#次のステップ)
- [トラブルシューティング](#トラブルシューティング)

---

## 必要なもの

- DayZがインストールされていること（リテール版またはDayZ Tools/Diag）
- テキストエディタ（VS Code、Notepad++、その他のプレーンテキストエディタ）
- DayZ Toolsがインストールされていること（PBOパッキング用）-- またはパッキングなしでテスト可能です（ステップ5参照）

---

## 目標

**HelloMod** というModを作成します。このModは：
1. エラーなくDayZに読み込まれます
2. スクリプトログに `"[HelloMod] Mission started!"` と出力します
3. 正しい標準構造を使用します

これはDayZ版の「Hello World」です。

---

## ステップ1: ディレクトリ構造の作成

以下のフォルダとファイルを作成します。必要なのは正確に**3ファイル**です：

```
HelloMod/
  mod.cpp
  Scripts/
    config.cpp
    5_Mission/
      HelloMod/
        HelloMission.c
```

これが完全な構造です。各ファイルを作成していきましょう。

---

## ステップ2: mod.cppの作成

以下の内容で `HelloMod/mod.cpp` を作成します：

```cpp
name = "Hello Mod";
author = "YourName";
version = "1.0";
overview = "My first DayZ mod - prints a message on mission start.";
```

これは最小限のメタデータです。DayZランチャーのMod一覧に「Hello Mod」と表示されます。

---

## ステップ3: config.cppの作成

以下の内容で `HelloMod/Scripts/config.cpp` を作成します：

```cpp
class CfgPatches
{
    class HelloMod_Scripts
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
    class HelloMod
    {
        dir = "HelloMod";
        name = "Hello Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "HelloMod/Scripts/5_Mission" };
            };
        };
    };
};
```

各部分の役割を説明します：

- **CfgPatches** はModをエンジンに宣言します。`requiredAddons` で `DZ_Data`（バニラDayZデータ）に依存していることを示し、ベースゲームの後に読み込まれることを保証します。
- **CfgMods** はスクリプトの場所をエンジンに伝えます。ミッションライフサイクルフックが利用可能な `5_Mission` のみ使用しています。
- **dependencies** はコードがミッションスクリプトモジュールにフックするため、`"Mission"` を記載します。

---

## ステップ4: 最初のスクリプトの作成

以下の内容で `HelloMod/Scripts/5_Mission/HelloMod/HelloMission.c` を作成します：

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[HelloMod] Mission started! Server is running.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[HelloMod] Mission started! Client is running.");
    }
};
```

このコードの動作：

- `modded class MissionServer` はバニラのサーバーミッションクラスを拡張します。サーバーがミッションを開始すると `OnInit()` が呼び出され、メッセージが出力されます。
- `modded class MissionGameplay` はクライアント側で同じことを行います。
- `super.OnInit()` は元の（バニラの）実装を最初に呼び出します -- これは非常に重要です。決してスキップしないでください。
- `Print()` はDayZのスクリプトログファイルに書き込みます。

---

## ステップ5: パックとテスト

テストには2つの方法があります：

### オプションA: ファイルパッチング（PBO不要 -- 開発専用）

DayZは開発中にアンパックされたModの読み込みをサポートしています。これが最も速い反復方法です。

1. `HelloMod/` フォルダをDayZのインストールディレクトリ内に配置します（またはWorkbenchでP:ドライブを使用します）
2. `-filePatching` パラメータを付けてDayZを起動し、Modを読み込みます：

```
DayZDiag_x64.exe -mod=HelloMod -filePatching
```

これによりPBOパッキングなしでフォルダから直接スクリプトが読み込まれます。

### オプションB: PBOパッキング（配布に必要）

Workshopへの公開やサーバーデプロイには、PBOにパックする必要があります：

1. **DayZ Tools**（Steamから）を開きます
2. **Addon Builder** を開きます
3. ソースディレクトリを `HelloMod/Scripts/` に設定します
4. 出力先を `@HelloMod/Addons/HelloMod_Scripts.pbo` に設定します
5. **Pack** をクリックします

または `PBOConsole` などのコマンドラインパッカーを使用します：

```
PBOConsole.exe -pack HelloMod/Scripts @HelloMod/Addons/HelloMod_Scripts.pbo
```

`mod.cpp` を `Addons/` フォルダの横に配置します：

```
@HelloMod/
  mod.cpp
  Addons/
    HelloMod_Scripts.pbo
```

その後DayZを起動します：

```
DayZDiag_x64.exe -mod=@HelloMod
```

---

## ステップ6: 動作確認

### スクリプトログの場所

DayZはプロファイルディレクトリのログファイルにスクリプト出力を書き込みます：

```
Windows: C:\Users\YourName\AppData\Local\DayZ\
```

最新の `.RPT` または `.log` ファイルを探してください。スクリプトログの名前は通常以下のようになります：

```
script_<date>_<time>.log
```

### 確認すべき内容

ログファイルを開いて `[HelloMod]` を検索します。以下のように表示されるはずです：

```
[HelloMod] Mission started! Server is running.
```

または（クライアントとして参加した場合）：

```
[HelloMod] Mission started! Client is running.
```

このメッセージが表示されていれば、おめでとうございます -- Modは正常に動作しています。

### エラーが表示された場合

ログに `SCRIPT (E):` で始まる行が含まれている場合、何かが問題です。以下の[トラブルシューティング](#トラブルシューティング)セクションを参照してください。

---

## 何が起きたかを理解する

DayZがModを読み込んだ際のイベントの順序は以下の通りです：

```
1. エンジンが起動し、すべてのPBOからconfig.cppファイルを読み取る
2. CfgPatches "HelloMod_Scripts" が登録される
   --> requiredAddonsにより、DZ_Dataの後に読み込まれることが保証される
3. CfgMods "HelloMod" が登録される
   --> エンジンがmissionScriptModuleのパスを認識する
4. エンジンがすべてのModの5_Missionスクリプトをコンパイルする
   --> HelloMission.cがコンパイルされる
   --> "modded class MissionServer"がバニラクラスにパッチされる
5. サーバーがミッションを開始する
   --> MissionServer.OnInit()が呼び出される
   --> オーバーライドが実行され、最初にsuper.OnInit()が呼び出される
   --> Print()がスクリプトログに書き込む
6. クライアントが接続して読み込む
   --> MissionGameplay.OnInit()が呼び出される
   --> オーバーライドが実行される
   --> Print()がクライアントログに書き込む
```

`modded` キーワードが重要なメカニズムです。これはエンジンに「既存のクラスを取得し、その上に変更を追加する」ことを伝えます。これがすべてのDayZ Modがバニラコードと統合する方法です。

---

## 次のステップ

動作するModができたので、ここからの自然な発展方向を紹介します：

### 3_Gameレイヤーの追加

ワールドエンティティに依存しない設定データや定数を追加します：

```
HelloMod/
  Scripts/
    config.cpp              <-- gameScriptModuleエントリを追加
    3_Game/
      HelloMod/
        HelloConfig.c       <-- 設定クラス
    5_Mission/
      HelloMod/
        HelloMission.c      <-- 既存のファイル
```

`config.cpp` を更新して新しいレイヤーを含めます：

```cpp
dependencies[] = { "Game", "Mission" };

class defs
{
    class gameScriptModule
    {
        value = "";
        files[] = { "HelloMod/Scripts/3_Game" };
    };
    class missionScriptModule
    {
        value = "";
        files[] = { "HelloMod/Scripts/5_Mission" };
    };
};
```

### 4_Worldレイヤーの追加

カスタムアイテムの作成、プレイヤーの拡張、ワールドマネージャーの追加：

```
HelloMod/
  Scripts/
    config.cpp              <-- worldScriptModuleエントリを追加
    3_Game/
      HelloMod/
        HelloConfig.c
    4_World/
      HelloMod/
        HelloManager.c      <-- ワールド対応ロジック
    5_Mission/
      HelloMod/
        HelloMission.c
```

### UIの追加

シンプルなゲーム内パネルの作成（このガイドのパート3で詳しく説明します）：

```
HelloMod/
  GUI/
    layouts/
      hello_panel.layout    <-- UIレイアウトファイル
  Scripts/
    5_Mission/
      HelloMod/
        HelloPanel.c        <-- UIスクリプト
```

### カスタムアイテムの追加

`Data/config.cpp` でアイテムを定義し、`4_World` でスクリプト動作を作成します：

```
HelloMod/
  Data/
    config.cpp              <-- アイテム定義を含むCfgVehicles
    Models/
      hello_item.p3d        <-- 3Dモデル
  Scripts/
    4_World/
      HelloMod/
        HelloItem.c         <-- アイテム動作スクリプト
```

### フレームワークへの依存

Community Framework（CF）の機能を使用したい場合は、依存関係を追加します：

```cpp
// config.cpp内
requiredAddons[] = { "DZ_Data", "JM_CF_Scripts" };
```

---

## トラブルシューティング

### "Addon HelloMod_Scripts requires addon DZ_Data which is not loaded"

`requiredAddons` が存在しないアドオンを参照しています。`DZ_Data` のスペルが正しいこと、DayZベースゲームが読み込まれていることを確認してください。

### ログ出力がない（Modが読み込まれていないように見える）

以下の順番で確認してください：

1. **起動パラメータにModが含まれていますか？** 起動コマンドに `-mod=HelloMod` または `-mod=@HelloMod` があることを確認してください。
2. **config.cppは正しい場所にありますか？** PBOのルート（またはファイルパッチング時の `Scripts/` フォルダのルート）に存在する必要があります。
3. **スクリプトパスは正しいですか？** `config.cpp` の `files[]` パスが実際のディレクトリ構造と一致している必要があります。`"HelloMod/Scripts/5_Mission"` はエンジンがその正確なパスを探すことを意味します。
4. **CfgPatchesクラスはありますか？** これがないとPBOは無視されます。

### SCRIPT (E): Undefined variable / Undefined type

コードがそのレイヤーに存在しないものを参照しています。一般的な原因：

- `3_Game` から `PlayerBase` を参照している（`4_World` で定義されている）
- クラス名や変数名のタイプミス
- `super.OnInit()` の呼び出し忘れ（連鎖的な失敗を引き起こす）

### SCRIPT (E): Member not found

呼び出しているメソッドやプロパティがそのクラスに存在しません。バニラAPIを再確認してください。よくある間違い：古いDayZバージョンを実行しているのに、新しいバージョンのメソッドを呼び出している場合です。

### Modは読み込まれるがスクリプトが実行されない

- `.c` ファイルが `files[]` に記載されたディレクトリ内にあることを確認してください
- ファイルの拡張子が `.c` であることを確認してください（`.txt` や `.cs` ではなく）
- `modded class` の名前がバニラクラスと完全に一致していることを確認してください（大文字小文字を区別します）

### PBOパッキングエラー

- `config.cpp` がPBO内のルートレベルにあることを確認してください
- PBO内のファイルパスはフォワードスラッシュ（`/`）を使用します。バックスラッシュではありません
- Scriptsフォルダにバイナリファイルがないことを確認してください（`.c` と `.cpp` のみ）

---

## ベストプラクティス

- moddedミッションクラスでは常にカスタムコードの前に `super.OnInit()` を呼び出してください -- スキップすると他のModの初期化が壊れます。
- `Print()` メッセージにはユニークなプレフィックス（例：`[HelloMod]`）を使用して、ログファイルを素早くgrepできるようにしてください。
- まず `5_Mission` のみから始めてください。Modが成長するにつれて `3_Game` と `4_World` レイヤーを段階的に追加してください。
- 開発中は `-filePatching` を使用して、変更のたびにPBOを再パックする必要を避けてください。
- 最初のModは動作するまで3ファイル以下に抑えてください。最小構成のデバッグははるかに簡単です。

---

## 理論 vs 実践

| 概念 | 理論 | 現実 |
|---------|--------|---------|
| `Print()` はログに出力する | メッセージがスクリプトログに表示される | 出力は別のスクリプトログではなく `.RPT` ファイルに書き込まれます。専用サーバーでは、プロファイルフォルダのサーバーRPTを確認してください |
| `-filePatching` はルーズファイルを読み込む | アンパックされたModが即座に動作する | 一部のアセット（モデル、テクスチャ）にはPBOパッキングが必要です。スクリプトはルーズで動作しますが、`.layout` ファイルはすべてのセットアップでアンパックフォルダから読み込めない場合があります |
| `modded class` はバニラをパッチする | オーバーライドが元のものを置き換える | 複数のModが同じクラスを `modded class` できます。ロード順に連鎖します。1つが `super.OnInit()` をスキップすると、後続のすべてのModが壊れます |
| `DZ_Data` が唯一必要な依存関係 | 最小限の `requiredAddons` | 純粋なスクリプトModには有効ですが、バニラの武器/アイテムクラスを参照する場合は `DZ_Scripts` または特定のバニラPBOも必要です |
| 3ファイルで十分 | mod.cpp + config.cpp + 1つの.cファイルでModが読み込まれる | スクリプトのみのModには当てはまりますが、アイテムやUIを追加するには追加のPBO（Data、GUI）が必要です |

---

## 完全なファイル一覧

参考として、3つのファイルすべての全内容を記載します：

### HelloMod/mod.cpp

```cpp
name = "Hello Mod";
author = "YourName";
version = "1.0";
overview = "My first DayZ mod - prints a message on mission start.";
```

### HelloMod/Scripts/config.cpp

```cpp
class CfgPatches
{
    class HelloMod_Scripts
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
    class HelloMod
    {
        dir = "HelloMod";
        name = "Hello Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "HelloMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### HelloMod/Scripts/5_Mission/HelloMod/HelloMission.c

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[HelloMod] Mission started! Server is running.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[HelloMod] Mission started! Client is running.");
    }
};
```

---

**前へ:** [第2.3章: mod.cppとWorkshop](03-mod-cpp.md)
**次へ:** [第2.5章: ファイル構成のベストプラクティス](05-file-organization.md)
