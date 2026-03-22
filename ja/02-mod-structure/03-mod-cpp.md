# 第2.3章: mod.cppとWorkshop

[ホーム](../README.md) | [<< 前へ: config.cpp詳細解説](02-config-cpp.md) | **mod.cppとWorkshop** | [次へ: 最小構成のMod >>](04-minimum-viable-mod.md)

---

> **概要:** `mod.cpp`ファイルは純粋なメタデータです。DayZランチャー、ゲーム内Modリスト、Steam Workshopでの表示方法を制御します。ゲームプレイ、スクリプト、読み込み順序には影響しません。`config.cpp`がエンジンだとすれば、`mod.cpp`は塗装のようなものです。

---

## 目次

- [概要](#概要)
- [mod.cppの配置場所](#modcppの配置場所)
- [全フィールドリファレンス](#全フィールドリファレンス)
- [フィールドの詳細](#フィールドの詳細)
- [クライアントModとサーバーMod](#クライアントmodとサーバーmod)
- [Workshopメタデータ](#workshopメタデータ)
- [必須フィールドと任意フィールド](#必須フィールドと任意フィールド)
- [実例](#実例)
- [ヒントとベストプラクティス](#ヒントとベストプラクティス)

---

## 概要

`mod.cpp`はModフォルダのルート（`Addons/`ディレクトリの隣）に配置されます。DayZランチャーはこのファイルを読み取り、Mod選択画面でModの名前、ロゴ、説明、作者を表示します。

**重要なポイント:** `mod.cpp`はコンパイルされません。Enforce Scriptではありません。ランチャーが読み取る単純なキーバリューファイルです。クラスもなく、閉じブレースの後のセミコロンもなく、`[]`構文の配列もありません（Workshopスクリプトモジュールに関する1つの例外を除く --- 以下を参照）。

---

## mod.cppの配置場所

```
@MyMod/                       <-- Workshop/起動フォルダ（@プレフィックス付き）
  mod.cpp                     <-- このファイル
  Addons/
    MyMod_Scripts.pbo
    MyMod_Data.pbo
  Keys/
    MyMod.bikey
  meta.cpp                    <-- Workshopパブリッシャーが自動生成
```

フォルダ名の`@`プレフィックスはSteam Workshopの慣例ですが、厳密には必須ではありません。

---

## 全フィールドリファレンス

| フィールド | 型 | 用途 | 必須 |
|-------|------|---------|----------|
| `name` | 文字列 | Mod表示名 | はい |
| `picture` | 文字列 | 展開された説明内の大きな画像 | いいえ |
| `logo` | 文字列 | ゲームメニュー下のロゴ | いいえ |
| `logoSmall` | 文字列 | Mod名の横の小さなアイコン（折りたたみ時） | いいえ |
| `logoOver` | 文字列 | マウスホバー時のロゴ | いいえ |
| `tooltip` | 文字列 | マウスホバー時のツールチップ | いいえ |
| `tooltipOwned` | 文字列 | Modがインストール済みの時のツールチップ | いいえ |
| `overview` | 文字列 | Mod詳細の長い説明文 | いいえ |
| `action` | 文字列 | URLリンク（ウェブサイト、Discord、GitHub） | いいえ |
| `actionURL` | 文字列 | `action`の代替（同じ目的） | いいえ |
| `author` | 文字列 | 作者名 | いいえ |
| `authorID` | 文字列 | 作者のSteam64 ID | いいえ |
| `version` | 文字列 | バージョン文字列 | いいえ |
| `type` | 文字列 | `"mod"`または`"servermod"` | いいえ |
| `extra` | int | 予約フィールド（常に0） | いいえ |

---

## フィールドの詳細

### name

DayZランチャーのModリストとゲーム内Mod画面に表示される表示名です。

```cpp
name = "My Framework";
```

ローカライズのために文字列テーブル参照を使用できます：

```cpp
name = "$STR_DF_NAME";    // stringtable.csvで解決されます
```

### picture

Modの説明が展開された時に表示される大きな画像へのパスです。`.paa`、`.edds`、`.tga`形式をサポートしています。

```cpp
picture = "MyMod/GUI/images/logo_large.edds";
```

パスはModルートからの相対パスです。空または省略した場合、画像は表示されません。

### logo

Modが読み込まれた時にゲームメニューの下に表示される主要ロゴです。

```cpp
logo = "MyMod/GUI/images/logo.edds";
```

### logoSmall

説明が折りたたまれている（展開されていない）時にMod名の横に表示される小さなアイコンです。

```cpp
logoSmall = "MyMod/GUI/images/logo_small.edds";
```

### logoOver

ユーザーがModロゴにマウスを合わせた時に表示されるロゴです。`logo`と同じものを使うことが多いですが、ハイライトされた/光るバリアントにすることもできます。

```cpp
logoOver = "MyMod/GUI/images/logo_hover.edds";
```

### tooltip / tooltipOwned

ランチャーでModにマウスを合わせた時に表示される短いテキストです。`tooltipOwned`はModがインストール済み（Workshopからダウンロード済み）の時に表示されます。

```cpp
tooltip = "MyMod Core - Admin Panel & Framework";
tooltipOwned = "My Framework - Central Admin Panel & Shared Library";
```

### overview

Mod詳細パネルに表示される長い説明文です。これが「概要」テキストになります。

```cpp
overview = "My Framework provides a centralized admin panel and shared library for all framework mods. Manage configurations, permissions, and mod integration from a single in-game interface.";
```

### action / actionURL

Modに関連付けられたクリック可能なURL（通常はウェブサイト、Discordの招待リンク、またはGitHubリポジトリ）です。両方のフィールドは同じ目的を果たします --- お好みの方を使用してください。

```cpp
action = "https://github.com/mymod/repo";
// または
actionURL = "https://discord.gg/mymod";
```

### author / authorID

作者名とそのSteam64 IDです。

```cpp
author = "Documentation Team";
authorID = "76561198000000000";
```

`authorID`はWorkshopで作者のSteamプロフィールへのリンクに使用されます。

### version

バージョン文字列です。任意のフォーマットが使えます --- エンジンはこれを解析したり検証したりしません。

```cpp
version = "1.0.0";
```

一部のModはconfig.cpp内のバージョンファイルを参照することもあります：

```cpp
versionPath = "MyMod/Scripts/Data/Version.hpp";   // これはmod.cppではなくconfig.cppに記述します
```

### type

これが通常のModかサーバー専用Modかを宣言します。省略した場合、デフォルトは`"mod"`です。

```cpp
type = "mod";           // -mod=で読み込み（クライアント＋サーバー）
type = "servermod";     // -servermod=で読み込み（サーバーのみ、クライアントには送信されない）
```

### extra

予約フィールドです。常に`0`に設定するか、完全に省略してください。

```cpp
extra = 0;
```

---

## クライアントModとサーバーMod

DayZは2つのMod読み込みメカニズムをサポートしています：

### クライアントMod (`-mod=`)

- クライアントがSteam Workshopからダウンロードします
- スクリプトはクライアントとサーバーの両方で実行されます
- UI、HUD、モデル、テクスチャ、サウンドを含めることができます
- サーバー参加時にキー署名（`.bikey`）が必要です

```
// 起動パラメータ:
-mod=@MyMod

// mod.cpp:
type = "mod";
```

### サーバーMod (`-servermod=`)

- 専用サーバーでのみ実行されます
- クライアントはダウンロードしません
- クライアント側のUIや`5_Mission`のクライアントコードを含めることはできません
- キー署名は不要です

```
// 起動パラメータ:
-servermod=@MyModServer

// mod.cpp:
type = "servermod";
```

### 分割Modパターン

多くのModは2つのパッケージとして出荷されます --- クライアントModとサーバーModです：

```
@MyMod_Missions/           <-- クライアントMod (-mod=)
  mod.cpp                   type = "mod"
  Addons/
    MyMod_Missions.pbo     スクリプト: UI、エンティティレンダリング、RPC受信

@MyMod_MissionsServer/     <-- サーバーMod (-servermod=)
  mod.cpp                   type = "servermod"
  Addons/
    MyMod_MissionsServer.pbo   スクリプト: スポーン、ロジック、状態管理
```

これにより、サーバー側のロジックが非公開に保たれ（クライアントに送信されない）、クライアントのダウンロードサイズが削減されます。

---

## Workshopメタデータ

### meta.cpp（自動生成）

Steam Workshopに公開する際、DayZツールは`meta.cpp`ファイルを自動生成します：

```cpp
protocol = 2;
publishedid = 2900000000;    // Steam WorkshopアイテムID
timestamp = 1711000000;       // 最終更新のUnixタイムスタンプ
```

`meta.cpp`を手動で編集しないでください。パブリッシングツールによって管理されます。

### Workshop連携

DayZランチャーは`mod.cpp`と`meta.cpp`の両方を読み取ります：

- `mod.cpp`はビジュアルメタデータ（名前、ロゴ、説明）を提供します
- `meta.cpp`はローカルファイルをSteam Workshopアイテムにリンクします
- Steam Workshopページには独自のタイトル、説明、画像があります（Steamのウェブインターフェースで管理）

`mod.cpp`のフィールドはプレイヤーが**ゲーム内**のModリストで見るものです。Workshopページは**Steam**で見るものです。一貫性を保ってください。

### Workshop画像の推奨事項

| 画像 | 用途 | 推奨サイズ |
|-------|---------|-----------------|
| `picture` | 展開されたMod説明 | 512x512または同様のサイズ |
| `logo` | メニューロゴ | 128x128〜256x256 |
| `logoSmall` | 折りたたみリストのアイコン | 64x64〜128x128 |

最良の互換性のために`.edds`形式を使用してください。`.paa`と`.tga`も動作します。PNGとJPGはmod.cppの画像フィールドでは動作しません。

---

## 必須フィールドと任意フィールド

### 最小限の必須項目

機能する`mod.cpp`には以下のみが必要です：

```cpp
name = "My Mod";
```

これだけです。1行です。Modは読み込まれ、機能します。それ以外はすべて装飾です。

### 推奨される最小項目

Workshop公開用のModには、少なくとも以下を含めてください：

```cpp
name = "My Mod Name";
author = "YourName";
version = "1.0";
overview = "What this mod does in one sentence.";
```

### 完全なプロフェッショナル設定

```cpp
name = "My Mod Name";
picture = "MyMod/GUI/images/logo_large.edds";
logo = "MyMod/GUI/images/logo.edds";
logoSmall = "MyMod/GUI/images/logo_small.edds";
logoOver = "MyMod/GUI/images/logo_hover.edds";
tooltip = "Short description";
overview = "Full description of your mod's features.";
action = "https://discord.gg/mymod";
author = "YourName";
authorID = "76561198000000000";
version = "1.2.3";
type = "mod";
```

---

## 実例

### フレームワークMod（クライアントMod）

```cpp
name = "My Framework";
picture = "";
actionURL = "";
tooltipOwned = "My Framework - Central Admin Panel & Shared Library";
overview = "My Framework provides a centralized admin panel and shared library for all framework mods. Manage configurations, permissions, and mod integration from a single in-game interface.";
author = "Documentation Team";
version = "1.0.0";
```

### フレームワークサーバーMod（最小）

```cpp
name = "My Framework Server";
author = "Documentation Team";
version = "1.0.0";
extra = 0;
type = "mod";
```

### Community Framework

```cpp
name = "Community Framework";
picture = "JM/CF/GUI/textures/cf_icon.edds";
logo = "JM/CF/GUI/textures/cf_icon.edds";
logoSmall = "JM/CF/GUI/textures/cf_icon.edds";
logoOver = "JM/CF/GUI/textures/cf_icon.edds";
tooltip = "Community Framework";
overview = "This is a Community Framework for DayZ SA. One notable feature is it aims to resolve the issue of conflicting RPC type ID's and mods.";
action = "https://github.com/Arkensor/DayZ-CommunityFramework";
author = "CF Mod Team";
authorID = "76561198103677868";
version = "1.5.8";
```

### VPP Admin Tools

```cpp
picture = "VPPAdminTools/data/vpp_logo_m.paa";
logoSmall = "VPPAdminTools/data/vpp_logo_ss.paa";
logo = "VPPAdminTools/data/vpp_logo_s.paa";
logoOver = "VPPAdminTools/data/vpp_logo_s.paa";
tooltip = "Tools helping in administrative DayZ server tasks";
overview = "V++ Admin Tools built for the DayZ community servers!";
action = "https://discord.dayzvpp.com";
```

注意：VPPは`name`と`author`を省略しています --- それでも動作しますが、ランチャーではMod名がフォルダ名にデフォルト設定されます。

### DabsFramework（ローカライズ付き）

```cpp
name = "$STR_DF_NAME";
picture = "DabsFramework/gui/images/dabs_framework_logo.paa";
logo = "DabsFramework/gui/images/dabs_framework_logo.paa";
logoSmall = "DabsFramework/gui/images/dabs_framework_logo.paa";
logoOver = "DabsFramework/gui/images/dabs_framework_logo.paa";
tooltip = "$STR_DF_TOOLTIP";
overview = "$STR_DF_DESCRIPTION";
action = "https://dab.dev";
author = "$STR_DF_AUTHOR";
authorID = "76561198247958888";
version = "1.0";
```

DabsFrameworkはすべてのテキストフィールドに`$STR_`文字列テーブル参照を使用しており、Modリスト自体の多言語サポートを実現しています。

### AI Mod（mod.cpp内にスクリプトモジュールを含むクライアントMod）

```cpp
name = "My AI Mod";
picture = "";
actionURL = "";
tooltipOwned = "My AI Mod - Intelligent Bot Framework for DayZ";
overview = "Advanced AI bot framework with human-like perception, combat tactics, and developer API";
author = "YourName";
version = "1.0.0";
type = "mod";
dependencies[] = {"Game", "World", "Mission"};
class Defs
{
    class gameScriptModule
    {
        value = "";
        files[] = {"MyMod_AI/Scripts/3_Game"};
    };
    class worldScriptModule
    {
        value = "";
        files[] = {"MyMod_AI/Scripts/4_World"};
    };
    class missionScriptModule
    {
        value = "";
        files[] = {"MyMod_AI/Scripts/5_Mission"};
    };
};
```

注意：このModはスクリプトモジュールの定義を`config.cpp`ではなく`mod.cpp`に配置しています。両方の場所で機能します --- エンジンは両方のファイルを読み取ります。ただし、標準的な慣例では`CfgMods`とスクリプトモジュールの定義は`config.cpp`に配置します。`mod.cpp`に配置するのは一部のModが使用する代替的なアプローチです。

---

## ヒントとベストプラクティス

### 1. mod.cppをシンプルに保つ

`mod.cpp`はメタデータのみです。ゲームロジック、クラス定義、その他複雑なものをここに配置しないでください。スクリプトモジュールが必要な場合は`config.cpp`に記述してください。

### 2. 画像には.eddsを使用する

`.edds`はUI要素の標準的なDayZテクスチャ形式です。DayZ Tools（TexView2）を使用してPNG/TGAから.eddsに変換してください。

### 3. Workshopページと一致させる

`name`、`overview`、`author`フィールドをSteam Workshopページと一致させてください。プレイヤーは両方を見ます。

### 4. バージョンを一貫させる

バージョン管理スキーム（例：`1.0.0`セマンティックバージョニング）を選び、各リリースで更新してください。一部のModはconfig.cppで参照される`Version.hpp`ファイルを使用して一元的なバージョン管理を行います。

### 5. 最初は画像なしでテスト

開発中は画像パスを空にしてください。すべてが動作した後にロゴを追加してください。画像がなくてもModの読み込みは妨げられません。

### 6. サーバーModはより少なくて済む

サーバー専用Modはプレイヤーがランチャーで見ることがないため、最小限のmod.cppで済みます：

```cpp
name = "My Server Mod";
author = "YourName";
version = "1.0.0";
type = "servermod";
```

---

## ベストプラクティス

- サーバーModであっても、常に少なくとも`name`と`author`を含めてください --- ログ出力や管理ツールでの識別に役立ちます。
- すべての画像フィールド（`picture`、`logo`、`logoSmall`、`logoOver`）には`.edds`形式を使用してください。PNGとJPGはサポートされていません。
- `mod.cpp`はメタデータのみにしてください。`CfgMods`、スクリプトモジュール、`defines[]`は代わりに`config.cpp`に配置してください。
- `version`フィールドにはセマンティックバージョニング（`1.2.3`）を使用し、Workshopリリースごとに更新してください。
- 機能が確認された後の最終的な仕上げステップとして、画像なしでModをテストしてからロゴを追加してください。

---

## 実際のModで確認されたパターン

| パターン | Mod | 詳細 |
|---------|-----|--------|
| ローカライズされた`name`フィールド | DabsFramework | 多言語Modリスト用に`$STR_DF_NAME` stringtable参照を使用 |
| mod.cpp内のスクリプトモジュール | 一部のAI Mod | config.cppの代わりにmod.cppにスクリプトモジュールパスを含む`class Defs`を直接配置 |
| `name`フィールドの欠落 | VPP Admin Tools | `name`を完全に省略。ランチャーはフォルダ名を表示テキストとしてフォールバック |
| すべての画像フィールドが同一 | Community Framework | `logo`、`logoSmall`、`logoOver`を同じ`.edds`ファイルに設定 |
| 空の画像パス | 多くの初期段階のMod | 開発中は`picture=""`のまま。Workshopへの公開前にブランディングを追加 |

---

## 理論と実際

| 概念 | 理論 | 実際 |
|---------|--------|---------|
| `mod.cpp`は必須 | すべてのModフォルダに必要 | なくてもModは正常に読み込まれますが、ランチャーに名前やメタデータが表示されません |
| `type`フィールドが読み込みを制御 | `"mod"`対`"servermod"` | 実際に読み込みを制御するのは起動パラメータ（`-mod=`対`-servermod=`）であり、`type`フィールドはメタデータのみです |
| 画像パスは一般的な形式をサポート | すべてのテクスチャ形式が動作 | `.edds`、`.paa`、`.tga`のみが動作し、`.png`と`.jpg`は無視されます |
| `authorID`がSteamにリンク | Steam64 IDがクリック可能なリンクを作成 | Workshopページでのみ機能し、ゲーム内Modリストではリンクとしてレンダリングされません |
| `version`が検証される | エンジンがバージョン形式をチェック | エンジンは生の文字列として扱います。`"banana"`も技術的には有効です |

---

## 互換性と影響

- **マルチMod:** `mod.cpp`は読み込み順序や依存関係に影響しません。同一のフィールド値を持つ2つのModは競合しません --- `config.cpp`の`CfgPatches`クラス名のみが衝突する可能性があります。
- **パフォーマンス:** `mod.cpp`は起動時に1回読み取られます。ここで参照される画像ファイルはランチャーUI用にメモリに読み込まれますが、ゲーム内のパフォーマンスには影響しません。

---

**前へ:** [第2.2章: config.cpp詳細解説](02-config-cpp.md)
**次へ:** [第2.4章: 最初のMod -- 最小構成](04-minimum-viable-mod.md)
