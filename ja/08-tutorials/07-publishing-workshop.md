# Chapter 8.7: Steam Workshopへの公開

[Home](../README.md) | [<< 前へ: デバッグとテスト](06-debugging-testing.md) | **Steam Workshopへの公開** | [次へ: HUDオーバーレイの構築 >>](08-hud-overlay.md)

---

> **概要:** Modのビルド、テストが完了し、世界に公開する準備が整いました。このチュートリアルでは、公開プロセスの全工程を最初から最後まで説明します：Modフォルダの準備、マルチプレイヤー互換性のためのPBO署名、Steam Workshopアイテムの作成、DayZ Toolsまたはコマンドラインを使用したアップロード、そして長期的なアップデートのメンテナンスです。最終的に、ModはWorkshop上でライブとなり、誰でもプレイ可能になります。

---

## 目次

- [はじめに](#introduction)
- [公開前チェックリスト](#pre-publishing-checklist)
- [Step 1: Modフォルダの準備](#step-1-prepare-your-mod-folder)
- [Step 2: 完全なmod.cppの作成](#step-2-write-a-complete-modcpp)
- [Step 3: ロゴとプレビュー画像の準備](#step-3-prepare-logo-and-preview-images)
- [Step 4: キーペアの生成](#step-4-generate-a-key-pair)
- [Step 5: PBOの署名](#step-5-sign-your-pbos)
- [Step 6: DayZ Tools Publisherでの公開](#step-6-publish-via-dayz-tools-publisher)
- [コマンドラインでの公開（代替方法）](#publishing-via-command-line-alternative)
- [Modのアップデート](#updating-your-mod)
- [バージョン管理のベストプラクティス](#version-management-best-practices)
- [Workshopページのベストプラクティス](#workshop-page-best-practices)
- [サーバー管理者向けガイド](#guide-for-server-operators)
- [Workshopを使用しない配布](#distribution-without-the-workshop)
- [よくある問題と解決策](#common-problems-and-solutions)
- [完全なModライフサイクル](#the-complete-mod-lifecycle)
- [次のステップ](#next-steps)

---

## はじめに

Steam Workshopへの公開は、DayZモッディングの最終ステップです。これまでの章で学んだすべてがここに集約されます。ModがWorkshop上に公開されると、あらゆるDayZプレイヤーがサブスクライブ、ダウンロード、プレイできるようになります。この章では、Modの準備、PBOの署名、アップロード、アップデートのメンテナンスまでの完全なプロセスを説明します。

---

## 公開前チェックリスト

アップロードする前に、このリストを確認してください。ここの項目をスキップすると、公開後の最も一般的な問題が発生します。

- [ ] すべての機能を**専用サーバー**でテスト済み（シングルプレイヤーだけでなく）
- [ ] マルチプレイヤーテスト済み：別のクライアントが参加してMod機能を使用可能
- [ ] スクリプトログ（`DayZDiag_x64.RPT` または `script_*.log`）にゲームブレイクエラーなし
- [ ] すべての `Print()` デバッグ文を削除、または `#ifdef DEVELOPER` でラップ済み
- [ ] ハードコードされたテスト値や残余の実験コードなし
- [ ] `stringtable.csv` にすべてのユーザー向け文字列と翻訳を含む
- [ ] `credits.json` に著者と貢献者情報を記入済み
- [ ] ロゴ画像の準備完了（サイズは [Step 3](#step-3-prepare-logo-and-preview-images) を参照）
- [ ] すべてのテクスチャを `.paa` フォーマットに変換済み（PBO内に生の `.png`/`.tga` はなし）
- [ ] Workshopの説明とインストール手順を作成済み
- [ ] 変更ログの作成開始（「1.0.0 - Initial release」だけでも可）

---

## Step 1: Modフォルダの準備

最終的なModフォルダはDayZの期待する構造に正確に従う必要があります。

### 必要な構成

```
@MyMod/
├── addons/
│   ├── MyMod_Scripts.pbo
│   ├── MyMod_Scripts.pbo.MyMod.bisign
│   ├── MyMod_Data.pbo
│   └── MyMod_Data.pbo.MyMod.bisign
├── keys/
│   └── MyMod.bikey
├── mod.cpp
└── meta.cpp  （DayZ Launcherが初回読み込み時に自動生成）
```

### フォルダの内訳

| フォルダ / ファイル | 目的 |
|---------------|---------|
| `addons/` | すべての `.pbo` ファイル（パックされたModコンテンツ）とその `.bisign` 署名ファイルを含む |
| `keys/` | サーバーがPBOを検証するために使用する公開鍵（`.bikey`）を含む |
| `mod.cpp` | Modメタデータ：名前、著者、バージョン、説明、アイコンパス |
| `meta.cpp` | DayZ Launcherが自動生成；公開後のWorkshop IDを含む |

### 重要なルール

- フォルダ名は `@` で**始まる必要があります**。DayZはこの方法でModディレクトリを識別します。
- `addons/` 内のすべての `.pbo` には、対応する `.bisign` ファイルが隣にある必要があります。
- `keys/` 内の `.bikey` ファイルは、`.bisign` ファイルの作成に使用された秘密鍵に対応している必要があります。
- アップロードフォルダにソースファイル（`.c` スクリプト、生テクスチャ、Workbenchプロジェクト）を**含めないでください**。パックされたPBOのみがここに属します。

---

## Step 2: 完全なmod.cppの作成

`mod.cpp` ファイルは、DayZとランチャーにModに関するすべてを伝えます。不完全な `mod.cpp` はアイコンの欠落、空白の説明、表示問題を引き起こします。

### 完全なmod.cppの例

```cpp
name         = "My Awesome Mod";
picture      = "MyMod/Data/Textures/logo_co.paa";
logo         = "MyMod/Data/Textures/logo_co.paa";
logoSmall    = "MyMod/Data/Textures/logo_small_co.paa";
logoOver     = "MyMod/Data/Textures/logo_co.paa";
tooltip      = "My Awesome Mod - Adds cool features to DayZ";
overview     = "A comprehensive mod that adds new items, mechanics, and UI elements to DayZ.";
author       = "YourName";
overviewPicture = "MyMod/Data/Textures/overview_co.paa";
action       = "https://steamcommunity.com/sharedfiles/filedetails/?id=YOUR_WORKSHOP_ID";
version      = "1.0.0";
versionPath  = "MyMod/Data/version.txt";
```

### フィールドリファレンス

| フィールド | 必須 | 説明 |
|-------|----------|-------------|
| `name` | はい | DayZ LauncherのModリストに表示される表示名 |
| `picture` | はい | メインロゴ画像へのパス（ランチャーに表示）。P:ドライブまたはModルートからの相対パス |
| `logo` | はい | ほとんどの場合pictureと同じ；一部のUIコンテキストで使用 |
| `logoSmall` | いいえ | コンパクト表示用のロゴの小型版 |
| `logoOver` | いいえ | ロゴのホバー状態（多くの場合 `logo` と同じ） |
| `tooltip` | はい | ランチャーでホバー時に表示される短い一行の説明 |
| `overview` | はい | Mod詳細パネルに表示される長い説明 |
| `author` | はい | あなたの名前またはチーム名 |
| `overviewPicture` | いいえ | Mod概要パネルに表示される大きな画像 |
| `action` | いいえ | プレイヤーが「Website」をクリックしたときに開くURL（通常Workshopページまたは GitHub） |
| `version` | はい | 現在のバージョン文字列（例：`"1.0.0"`） |
| `versionPath` | いいえ | バージョン番号を含むテキストファイルへのパス（自動ビルド用） |

### よくある間違い

- **行末のセミコロンの欠落。** すべての行は `;` で終わる必要があります。
- **間違った画像パス。** ビルド時、パスはP:ドライブルートからの相対パスです。パッキング後は、パスがPBOプレフィックスを反映する必要があります。アップロード前にModをローカルで読み込んでテストしてください。
- **再アップロード前のバージョン更新忘れ。** 常にバージョン文字列をインクリメントしてください。

---

## Step 3: ロゴとプレビュー画像の準備

### 画像要件

| 画像 | サイズ | フォーマット | 用途 |
|-------|------|--------|----------|
| Modロゴ（`picture` / `logo`） | 512 x 512 px | `.paa`（ゲーム内） | DayZ LauncherのModリスト |
| 小型ロゴ（`logoSmall`） | 128 x 128 px | `.paa`（ゲーム内） | ランチャーのコンパクト表示 |
| Steam Workshopプレビュー | 512 x 512 px | `.png` or `.jpg` | Workshopページのサムネイル |
| 概要画像 | 1024 x 512 px | `.paa`（ゲーム内） | Mod詳細パネル |

### 画像のPAA変換

DayZは内部的に `.paa` テクスチャを使用します。PNG/TGA画像を変換するには：

1. **TexView2**（DayZ Toolsに含まれる）を開く
2. File > Open で `.png` または `.tga` 画像を開く
3. File > Save As > `.paa` フォーマットを選択
4. Modの `Data/Textures/` ディレクトリに保存

Addon Builderもバイナライズ設定がされていれば、PBOパッキング時にテクスチャを自動変換できます。

### ヒント

- 小さいサイズでも読みやすい、明確で認識しやすいアイコンを使用してください。
- ロゴのテキストは最小限に -- 128x128では読めなくなります。
- Steam Workshopのプレビュー画像（`.png`/`.jpg`）はゲーム内ロゴ（`.paa`）とは別です。Publisherを通じてアップロードします。

---

## Step 4: キーペアの生成

キー署名はマルチプレイヤーに**不可欠**です。ほぼすべての公開サーバーが署名検証を有効にしているため、適切な署名がないとプレイヤーはModを使用してサーバーに参加した際にキックされます。

### キー署名の仕組み

- **キーペア**を作成します：`.biprivatekey`（秘密鍵）と `.bikey`（公開鍵）
- 各 `.pbo` を秘密鍵で署名し、`.bisign` ファイルを生成します
- `.bikey` をModと一緒に配布します；サーバー管理者はそれを `keys/` フォルダに配置します
- プレイヤーが参加すると、サーバーは `.bikey` を使用して各 `.pbo` を `.bisign` に照合します

### DayZ Toolsでのキー生成

1. Steamから **DayZ Tools** を開く
2. メインウィンドウで **DS Create Key** を見つけてクリック（ToolsまたはUtilitiesの下にリストされている場合あり）
3. **キー名**を入力 -- Mod名を使用します（例：`MyMod`）
4. ファイルの保存先を選択
5. 2つのファイルが作成されます：
   - `MyMod.bikey` -- **公開鍵**（これを配布します）
   - `MyMod.biprivatekey` -- **秘密鍵**（これは秘密にしてください）

### コマンドラインでのキー生成

ターミナルから `DSCreateKey` ツールを直接使用することもできます：

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSCreateKey.exe" MyMod
```

これにより、カレントディレクトリに `MyMod.bikey` と `MyMod.biprivatekey` が作成されます。

### 重要なセキュリティルール

> **`.biprivatekey` ファイルは決して共有しないでください。** 秘密鍵を持つ人は誰でも、サーバーが正当と認識する改変されたPBOに署名できます。安全に保管し、バックアップしてください。紛失した場合、新しいキーペアを生成し、すべてを再署名し、サーバー管理者はキーを更新する必要があります。

---

## Step 5: PBOの署名

Mod内のすべての `.pbo` ファイルを秘密鍵で署名する必要があります。これにより、PBOの横に配置される `.bisign` ファイルが生成されます。

### DayZ Toolsでの署名

1. **DayZ Tools** を開く
2. **DS Sign File** を見つけてクリック（ToolsまたはUtilitiesの下）
3. `.biprivatekey` ファイルを選択
4. 署名する `.pbo` ファイルを選択
5. `.bisign` ファイルがPBOの隣に作成されます（例：`MyMod_Scripts.pbo.MyMod.bisign`）
6. `addons/` フォルダ内のすべての `.pbo` に対して繰り返す

### コマンドラインでの署名

自動化や複数PBOの場合、コマンドラインを使用します：

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSSignFile.exe" MyMod.biprivatekey MyMod_Scripts.pbo
```

バッチスクリプトでフォルダ内のすべてのPBOを署名するには：

```batch
@echo off
set DSSIGN="C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSSignFile.exe"
set KEY="path\to\MyMod.biprivatekey"

for %%f in (addons\*.pbo) do (
    echo Signing %%f ...
    %DSSIGN% %KEY% "%%f"
)

echo All PBOs signed.
pause
```

### 署名後：フォルダの確認

`addons/` フォルダは次のようになるはずです：

```
addons/
├── MyMod_Scripts.pbo
├── MyMod_Scripts.pbo.MyMod.bisign
├── MyMod_Data.pbo
└── MyMod_Data.pbo.MyMod.bisign
```

すべての `.pbo` には対応する `.bisign` が必要です。`.bisign` が欠落していると、プレイヤーは署名検証サーバーからキックされます。

### 公開鍵の配置

`MyMod.bikey` を `@MyMod/keys/` フォルダにコピーします。これはサーバー管理者がModを許可するためにサーバーの `keys/` ディレクトリにコピーするものです。

---

## Step 6: DayZ Tools Publisherでの公開

DayZ ToolsにはビルトインのWorkshop Publisherが含まれています -- ModをSteamに公開する最も簡単な方法です。

### Publisherを開く

1. Steamから **DayZ Tools** を開く
2. メインウィンドウで **Publisher** をクリック（「Workshop Tool」とラベル付けされている場合もあり）
3. Mod詳細のフィールドを含むPublisherウィンドウが開く

### 詳細の入力

| フィールド | 入力内容 |
|-------|---------------|
| **Title** | Modの表示名（例：「My Awesome Mod」） |
| **Description** | Modの詳細な概要。SteamのBBコードフォーマットをサポート（以下参照） |
| **Preview Image** | 512 x 512の `.png` または `.jpg` プレビュー画像を参照 |
| **Mod Folder** | 完全な `@MyMod` フォルダを参照 |
| **Tags** | 関連タグを選択（例：Weapons, Vehicles, UI, Server, Gear, Maps） |
| **Visibility** | **Public**（誰でも検索可能）、**Friends Only**、または **Unlisted**（直接リンクでのみアクセス可能） |

### Steam BBコードクイックリファレンス

Workshopの説明はBBコードをサポートします：

```
[h1]Features[/h1]
[list]
[*] Feature one
[*] Feature two
[/list]

[b]Bold[/b]  [i]Italic[/i]  [code]Code[/code]
[url=https://example.com]Link text[/url]
[img]https://example.com/image.png[/img]
```

### 公開

1. すべてのフィールドを最終確認
2. **Publish**（または **Upload**）をクリック
3. アップロードの完了を待つ。大きなModは接続速度によっては数分かかる場合があります。
4. 完了すると、**Workshop ID**（`2345678901` のような長い数値ID）を含む確認が表示されます
5. **このWorkshop IDを保存してください。** 後でアップデートをプッシュする際に必要です。

### 公開後：確認

これをスキップしないでください。通常のプレイヤーと同じようにModをテストします：

1. `https://steamcommunity.com/sharedfiles/filedetails/?id=YOUR_ID` にアクセスし、タイトル、説明、プレビュー画像を確認
2. Workshop上で自分のModに**サブスクライブ**
3. DayZを起動し、ランチャーにModが表示されることを確認
4. 有効にし、ゲームを起動し、サーバーに参加（または自分のテストサーバーを実行）
5. すべての機能が動作することを確認
6. `mod.cpp` の `action` フィールドをWorkshopページのURLに更新

何か問題がある場合は、公開発表前にアップデートして再アップロードしてください。

---

## コマンドラインでの公開（代替方法）

自動化、CI/CD、バッチアップロードの場合、SteamCMDがコマンドライン代替手段を提供します。

### SteamCMDのインストール

[Valveのデベロッパーサイト](https://developer.valvesoftware.com/wiki/SteamCMD)からダウンロードし、`C:\SteamCMD\` のようなフォルダに展開します。

### VDFファイルの作成

SteamCMDは `.vdf` ファイルを使用してアップロード内容を記述します。`workshop_publish.vdf` というファイルを作成します：

```
"workshopitem"
{
    "appid"          "221100"
    "publishedfileid" "0"
    "contentfolder"  "C:\\Path\\To\\@MyMod"
    "previewfile"    "C:\\Path\\To\\preview.png"
    "visibility"     "0"
    "title"          "My Awesome Mod"
    "description"    "A comprehensive mod for DayZ."
    "changenote"     "Initial release"
}
```

### フィールドリファレンス

| フィールド | 値 |
|-------|-------|
| `appid` | DayZの場合は常に `221100` |
| `publishedfileid` | 新規アイテムの場合は `0`；アップデートの場合はWorkshop IDを使用 |
| `contentfolder` | `@MyMod` フォルダへの絶対パス |
| `previewfile` | プレビュー画像への絶対パス |
| `visibility` | `0` = 公開、`1` = フレンドのみ、`2` = 非公開リスト、`3` = プライベート |
| `title` | Mod名 |
| `description` | Modの説明（プレーンテキスト） |
| `changenote` | Workshopページの変更履歴に表示されるテキスト |

### SteamCMDの実行

```batch
C:\SteamCMD\steamcmd.exe +login YourSteamUsername +workshop_build_item "C:\Path\To\workshop_publish.vdf" +quit
```

SteamCMDは初回使用時にパスワードとSteam Guardコードの入力を求めます。認証後、ModがアップロードされWorkshop IDが表示されます。

### コマンドラインを使用するタイミング

- **自動ビルド：** PBOのパック、署名、アップロードを一つのステップで行うビルドスクリプトに統合
- **バッチ操作：** 複数のModを一度にアップロード
- **ヘッドレスサーバー：** GUIのない環境
- **CI/CDパイプライン：** GitHub Actionsなどから SteamCMDを呼び出し

---

## Modのアップデート

### ステップバイステップのアップデートプロセス

1. **コード変更を行い**、徹底的にテスト
2. `mod.cpp` の**バージョンをインクリメント**（例：`"1.0.0"` を `"1.0.1"` に）
3. Addon Builderまたはビルドスクリプトを使用して**すべてのPBOを再ビルド**
4. 最初に使用したのと**同じ秘密鍵**で**すべてのPBOを再署名**
5. **DayZ Tools Publisherを開く**
6. 既存の **Workshop ID** を入力（または既存アイテムを選択）
7. 更新された `@MyMod` フォルダを指定
8. 変更内容を記述した**変更ノート**を書く
9. **Publish / Update** をクリック

### SteamCMDでのアップデート

Workshop IDと新しい変更ノートでVDFファイルを更新します：

```
"workshopitem"
{
    "appid"          "221100"
    "publishedfileid" "2345678901"
    "contentfolder"  "C:\\Path\\To\\@MyMod"
    "changenote"     "v1.0.1 - Fixed item duplication bug, added French translation"
}
```

その後、以前と同様にSteamCMDを実行します。`publishedfileid` がSteamに新規作成ではなく既存アイテムの更新を指示します。

### 重要：同じキーを使用する

常にオリジナルリリースで使用した**同じ秘密鍵**でアップデートに署名してください。異なるキーで署名すると、サーバー管理者は古い `.bikey` を新しいものに置き換える必要があります -- つまりダウンタイムと混乱が生じます。秘密鍵が漏洩した場合のみ、新しいキーペアを生成してください。

---

## バージョン管理のベストプラクティス

### セマンティックバージョニング

**MAJOR.MINOR.PATCH** フォーマットを使用します：

| コンポーネント | インクリメントするタイミング | 例 |
|-----------|-------------------|---------|
| **MAJOR** | 破壊的変更：configフォーマット変更、機能削除、APIオーバーホール | `1.0.0` から `2.0.0` |
| **MINOR** | 後方互換性のある新機能 | `1.0.0` から `1.1.0` |
| **PATCH** | バグ修正、小さな調整、翻訳の更新 | `1.0.0` から `1.0.1` |

### 変更ログフォーマット

Workshopの説明または別ファイルに変更ログを維持します。きれいなフォーマット：

```
v1.2.0 (2025-06-15)
- Added: Night vision toggle keybind
- Added: German and Spanish translations
- Fixed: Inventory crash when dropping stacked items
- Changed: Reduced default spawn rate from 5 to 3

v1.1.0 (2025-05-01)
- Added: New crafting recipes for 4 items
- Fixed: Server crash on player disconnect during trade

v1.0.0 (2025-04-01)
- Initial release
```

### 後方互換性

Modが永続データ（JSON config、プレイヤーデータファイル）を保存する場合、フォーマット変更前に慎重に検討してください：

- **新しいフィールドの追加**は安全です。古いファイルの読み込み時に欠落フィールドにはデフォルト値を使用します。
- **フィールドの名前変更や削除**は破壊的変更です。MAJORバージョンをインクリメントしてください。
- **マイグレーションパターンを検討してください：** 古いフォーマットを検出し、新しいフォーマットに変換し、保存します。

Enforce Scriptでのマイグレーションチェックの例：

```csharp
// config読み込み関数内で
if (config.configVersion < 2)
{
    // v1からv2へマイグレーション：「oldField」を「newField」にリネーム
    config.newField = config.oldField;
    config.configVersion = 2;
    SaveConfig(config);
    SDZ_Log.Info("MyMod", "Config migrated from v1 to v2");
}
```

### Gitタグ付け

バージョン管理にGitを使用している場合（そうすべきです）、各リリースにタグを付けてください：

```bash
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

これにより、公開されたどのバージョンの正確なコードにもいつでも戻れる永続的な参照ポイントが作成されます。

---

## Workshopページのベストプラクティス

### 説明の構成

以下のセクションで説明を整理します：

1. **概要** -- Modの機能を2〜3文で
2. **機能** -- 主要機能の箇条書きリスト
3. **要件** -- WorkshopリンクとともにすべてのMod依存関係をリスト
4. **インストール** -- プレイヤー向けステップバイステップ（通常「サブスクライブして有効化」のみ）
5. **サーバーセットアップ** -- サーバー管理者向けの手順（キー配置、configファイル）
6. **FAQ** -- よくある質問に事前に回答
7. **既知の問題** -- 現在の制限について正直に
8. **サポート** -- Discord、GitHub issues、またはフォーラムスレッドへのリンク
9. **変更ログ** -- 最近のバージョン履歴
10. **ライセンス** -- 他者がどのようにあなたの作品を使用できるか（またはできないか）

### スクリーンショットとメディア

- Modの動作を示す **3〜5枚のゲーム内スクリーンショット** を含める
- ModがUIを追加する場合、UIパネルを明確に表示
- Modがアイテムを追加する場合、ゲーム内で表示（エディターだけでなく）
- 短いゲームプレイ動画はサブスクリプション数を大幅に増加させる

### 依存関係

Modが他のModを必要とする場合、Workshopリンクとともに明確にリストしてください。Steam Workshopの「Required Items」機能を使用して、ランチャーが依存関係を自動的に読み込むようにします。

### アップデートスケジュール

期待値を設定してください。毎週アップデートする場合はそう伝え、不定期の場合は「必要に応じてアップデート」と伝えてください。プレイヤーは何を期待すべきかがわかると、より理解を示します。

---

## サーバー管理者向けガイド

Workshop説明にサーバー管理者向けのこの情報を含めてください。

### 専用サーバーへのWorkshop Modのインストール

1. SteamCMDまたはSteamクライアントを使用して**Modをダウンロード**：
   ```batch
   steamcmd +login anonymous +workshop_download_item 221100 WORKSHOP_ID +quit
   ```
2. `@ModName` フォルダをDayZ Serverディレクトリに**コピー**（またはシンボリックリンク）
3. `@ModName/keys/` からサーバーの `keys/` フォルダに **`.bikey` ファイルをコピー**
4. `-mod=` 起動パラメータに**Modを追加**

### 起動パラメータの構文

Modは `-mod=` パラメータを通じて読み込まれ、セミコロンで区切ります：

```
-mod=@CF;@VPPAdminTools;@MyMod
```

サーバールートからの**完全な相対パス**を使用します。Linuxではパスは大文字小文字を区別します。

### 読み込み順序

Modは `-mod=` にリストされた順序で読み込まれます。Modが互いに依存している場合、これは重要です：

- **依存関係を先に。** `@MyMod` が `@CF` を必要とする場合、`@CF` を `@MyMod` の前にリストします。
- **一般的なルール：** フレームワークが先、コンテンツModが後。
- Modが `config.cpp` で `requiredAddons` を宣言している場合、DayZは読み込み順序を自動的に解決しようとしますが、`-mod=` での明示的な順序指定がより安全です。

### キー管理

- サーバーの `keys/` ディレクトリに**Modごとに1つの `.bikey`** を配置
- Modが同じキーでアップデートされた場合、アクション不要 -- 既存の `.bikey` は引き続き機能
- Mod作者がキーを変更した場合、古い `.bikey` を新しいものに置き換える必要あり
- `keys/` フォルダパスはサーバールートからの相対パス（例：`DayZServer/keys/`）

---

## Workshopを使用しない配布

### Workshopをスキップするタイミング

- 自分のサーバーコミュニティ向けの**プライベートMod**
- 公開リリース前の少人数での**ベータテスト**
- 他のチャネルで配布される**商用またはライセンスMod**
- 開発中の**迅速な反復**（毎回再アップロードするよりも高速）

### リリースZIPの作成

手動配布用にModをパッケージ化します：

```
MyMod_v1.0.0.zip
└── @MyMod/
    ├── addons/
    │   ├── MyMod_Scripts.pbo
    │   ├── MyMod_Scripts.pbo.MyMod.bisign
    │   ├── MyMod_Data.pbo
    │   └── MyMod_Data.pbo.MyMod.bisign
    ├── keys/
    │   └── MyMod.bikey
    └── mod.cpp
```

インストール手順を含む `README.txt` を含めます：

```
INSTALLATION:
1. Extract the @MyMod folder into your DayZ game directory
2. (Server operators) Copy MyMod.bikey from @MyMod/keys/ to your server's keys/ folder
3. Add @MyMod to your -mod= launch parameter
```

### GitHub Releases

Modがオープンソースの場合、GitHub Releasesを使用してバージョン付きダウンロードをホストします：

1. Gitでリリースにタグ付け（`git tag v1.0.0`）
2. PBOをビルド・署名
3. `@MyMod` フォルダのZIPを作成
4. GitHub Releaseを作成しZIPを添付
5. リリース説明にリリースノートを記述

これにより、バージョン履歴、ダウンロード数、各リリースの安定したURLが得られます。

---

## よくある問題と解決策

| 問題 | 原因 | 修正方法 |
|---------|-------|-----|
| 「Addon rejected by server」 | サーバーに `.bikey` がない、または `.bisign` が `.pbo` と一致しない | サーバーの `keys/` フォルダに `.bikey` があることを確認。正しい `.biprivatekey` でPBOを再署名。 |
| 「Signature check failed」 | 署名後にPBOが変更された、または間違ったキーで署名 | クリーンソースからPBOを再ビルド。サーバーの `.bikey` を生成した**同じキー**で再署名。 |
| DayZ LauncherにModが表示されない | 不正な `mod.cpp` またはフォルダ構造の誤り | `mod.cpp` の構文エラー（`;` の欠落）を確認。フォルダが `@` で始まることを確認。ランチャーを再起動。 |
| Publisherでアップロード失敗 | 認証、接続、またはファイルロックの問題 | Steamログインを確認。Workbench/Addon Builderを閉じる。DayZ Toolsを管理者として実行してみる。 |
| Workshop アイコンが間違い/欠落 | `mod.cpp` のパスが不正または画像フォーマットが間違い | `picture`/`logo` パスが実際の `.paa` ファイルを指していることを確認。Workshopプレビュー（`.png`）は別。 |
| 他のModとの競合 | バニラクラスをモッドではなく再定義している | `modded class` を使用し、オーバーライドで `super` を呼び出し、読み込み順序に `requiredAddons` を設定。 |
| プレイヤーが読み込み時にクラッシュ | スクリプトエラー、PBOの破損、または依存関係の欠落 | `.RPT` ログを確認。クリーンソースからPBOを再ビルド。依存関係が先に読み込まれることを確認。 |

---

## 完全なModライフサイクル

```
IDEA → SETUP (8.1) → STRUCTURE (8.1, 8.5) → CODE (8.2, 8.3, 8.4) → BUILD (8.1)
  → TEST → DEBUG (8.6) → POLISH → SIGN (8.7) → PUBLISH (8.7) → MAINTAIN (8.7)
                                    ↑                                    │
                                    └────── feedback loop ───────────────┘
```

公開後、プレイヤーのフィードバックがCODE、TEST、DEBUGに戻ります。公開→フィードバック→改善のサイクルが、優れたModの作り方です。

---

## 次のステップ

DayZモッディングチュートリアルシリーズの全工程を完了しました -- 空白のワークスペースからSteam Workshop上で公開、署名、メンテナンスされるModまで。ここからは：

- **リファレンス章**（Chapters 1-7）を探索し、GUIシステム、config.cpp、Enforce Scriptの深い知識を得る
- CF、Community Online Tools、Expansionなどの**オープンソースMod**を研究し、高度なパターンを学ぶ
- DiscordやBohemia Interactiveフォーラムの **DayZモッディングコミュニティ**に参加する
- **もっと大きく作る。** 最初のModはHello Worldでした。次のModは完全なゲームプレイオーバーホールかもしれません。

ツールはあなたの手の中にあります。素晴らしいものを作ってください。
