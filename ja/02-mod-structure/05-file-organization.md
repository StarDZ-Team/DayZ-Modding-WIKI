# 第2.5章: ファイル構成のベストプラクティス

[ホーム](../README.md) | [<< 前へ: 最小限のMOD](04-minimum-viable-mod.md) | **ファイル構成** | [次へ: サーバーvsクライアントアーキテクチャ >>](06-server-client-split.md)

---

> **要約:** ファイルの構成方法は、10ファイルでも1,000ファイルでもMODが保守可能かどうかを決定します。この章では、標準的なディレクトリ構造、命名規則、コンテンツ型/スクリプト型/フレームワーク型MOD、クライアント-サーバー分割、プロフェッショナルなDayZ MODからの教訓をカバーします。

---

## 目次

- [標準的なディレクトリ構造](#標準的なディレクトリ構造)
- [命名規則](#命名規則)
- [3つのMODタイプ](#3つのmodタイプ)
- [クライアント-サーバー分割MOD](#クライアント-サーバー分割mod)
- [どこに何を置くか](#どこに何を置くか)
- [PBO命名と@modフォルダ命名](#pbo命名とmodフォルダ命名)
- [プロフェッショナルMODの実例](#プロフェッショナルmodの実例)
- [アンチパターン](#アンチパターン)

---

## 標準的なディレクトリ構造

これはプロフェッショナルなDayZ MODが使用する標準的なレイアウトです。すべてのフォルダが必須ではありません -- 必要なものだけ作成してください。

```
MyMod/                                    <-- プロジェクトルート（開発）
  mod.cpp                                 <-- ランチャーメタデータ
  stringtable.csv                         <-- ローカライゼーション（MODルートに配置、Scripts/内ではない）

  Scripts/                                <-- スクリプトPBOルート
    config.cpp                            <-- CfgPatches + CfgMods + スクリプトモジュール定義
    Inputs.xml                            <-- カスタムキーバインド（オプション）
    Data/
      Credits.json                        <-- 著者クレジット
      Version.hpp                         <-- バージョン文字列（オプション）

    1_Core/                               <-- engineScriptModule（まれ）
      MyMod/
        Constants.c

    3_Game/                               <-- gameScriptModule
      MyMod/
        MyModConfig.c                     <-- 設定クラス
        MyModRPCs.c                       <-- RPC識別子 / 登録
        Data/
          SomeDataClass.c                 <-- 純粋なデータ構造

    4_World/                              <-- worldScriptModule
      MyMod/
        Entities/
          MyCustomItem.c                  <-- カスタムアイテム
          MyCustomVehicle.c
        Managers/
          MyModManager.c                  <-- ワールド対応マネージャー
        Actions/
          ActionMyCustom.c                <-- カスタムプレイヤーアクション

    5_Mission/                            <-- missionScriptModule
      MyMod/
        MyModRegister.c                   <-- MOD登録（起動フック）
        GUI/
          MyModPanel.c                    <-- UIパネルスクリプト
          MyModHUD.c                      <-- HUDオーバーレイスクリプト

  GUI/                                    <-- GUI PBOルート（Scriptsとは別）
    config.cpp                            <-- GUI固有の設定（imageSet、スタイル）
    layouts/                              <-- .layoutファイル
      mymod_panel.layout
      mymod_hud.layout
    imagesets/                            <-- .imagesetファイル + テクスチャアトラス
      mymod_icons.imageset
      mymod_icons.edds
    looknfeel/                            <-- .stylesファイル
      mymod.styles

  Data/                                   <-- データPBOルート（モデル、テクスチャ、アイテム）
    config.cpp                            <-- CfgVehicles、CfgWeaponsなど
    Models/
      my_item.p3d                         <-- 3Dモデル
    Textures/
      my_item_co.paa                      <-- カラーテクスチャ
      my_item_nohq.paa                    <-- ノーマルマップ
    Materials/
      my_item.rvmat                       <-- マテリアル定義

  Sounds/                                 <-- サウンドファイル
    alert.ogg                             <-- オーディオファイル（常に.ogg）
    ambient.ogg

  ServerFiles/                            <-- サーバー管理者がコピーするファイル
    types.xml                             <-- Central Economyスポーン定義
    cfgspawnabletypes.xml                 <-- アタッチメントプリセット
    README.md                             <-- インストールガイド

  Keys/                                   <-- 署名キー
    MyMod.bikey                           <-- サーバー検証用公開キー
```

---

## 命名規則

### MOD/プロジェクト名

PascalCaseで明確なプレフィックスを使用します:

```
MyFramework          <-- フレームワーク、プレフィックス: MyFW_
MyMod_Missions      <-- 機能MOD
MyMod_Weapons       <-- コンテンツMOD
VPPAdminTools        <-- アンダースコアを省略するMODもある
DabsFramework        <-- セパレータなしのPascalCase
```

### クラス名

MODに固有の短いプレフィックスの後にアンダースコアとクラスの目的を続けます:

```c
// MyModパターン: MyMod_[サブシステム]_[名前]
class MyLog             // コアログ
class MyRPC             // コアRPC
class MyW_Config        // 武器設定
class MyM_MissionBase   // ミッションベース

// CFパターン: CF_[名前]
class CF_ModuleWorld
class CF_EventArgs

// COTパターン: JM_COT_[名前]
class JM_COT_Menu

// VPPパターン: [名前]（プレフィックスなし）
class ChatCommandBase
class WebhookManager
```

**ルール:**
- プレフィックスは他のMODとの衝突を防止
- 短く保つ（2-4文字）
- MOD内で一貫性を保つ

### ファイル名

各ファイルはそれが含む主要なクラスにちなんで命名します:

```
MyLog.c            <-- class MyLogを含む
MyRPC.c            <-- class MyRPCを含む
MyModConfig.c        <-- class MyModConfigを含む
ActionMyCustom.c     <-- class ActionMyCustomを含む
```

1ファイル1クラスが理想です。密に結合された複数の小さなヘルパークラスを1ファイルに含めることは許容されます。

### レイアウトファイル

MODプレフィックス付きの小文字を使用します:

```
my_admin_panel.layout
my_killfeed_overlay.layout
mymod_settings_dialog.layout
```

### 変数名

```c
// メンバー変数: m_プレフィックス
protected int m_Count;
protected ref array<string> m_Items;
protected ref MyConfig m_Config;

// 静的変数: s_プレフィックス
static int s_InstanceCount;
static ref MyLog s_Logger;

// 定数: ALL_CAPS
const int MAX_PLAYERS = 60;
const float UPDATE_INTERVAL = 0.5;
const string MOD_NAME = "MyMod";

// ローカル変数: camelCase（プレフィックスなし）
int count = 0;
string playerName = identity.GetName();
float deltaTime = timeArgs.DeltaTime;

// パラメータ: camelCase（プレフィックスなし）
void SetConfig(MyConfig config, bool forceReload)
```

---

## 3つのMODタイプ

DayZ MODは3つのカテゴリに分類されます。それぞれ異なる構造の重点があります。

### 1. コンテンツMOD

アイテム、武器、車両、建物を追加します -- 主に3Dアセットで、スクリプトは最小限です。

```
MyWeaponPack/
  mod.cpp
  Data/
    config.cpp                <-- CfgVehicles、CfgWeapons、CfgMagazines、CfgAmmo
    Weapons/
      MyRifle/
        MyRifle.p3d
        MyRifle_co.paa
        MyRifle_nohq.paa
        MyRifle.rvmat
    Ammo/
      MyAmmo/
        MyAmmo.p3d
  Scripts/                    <-- 最小限（存在しない場合もある）
    config.cpp
    4_World/
      MyWeaponPack/
        MyRifle.c             <-- 武器にカスタム動作が必要な場合のみ
  ServerFiles/
    types.xml
```

**特徴:**
- `Data/`（モデル、テクスチャ、マテリアル）が大部分
- `Data/config.cpp`（CfgVehicles、CfgWeapons定義）が重い
- スクリプトは最小限またはなし
- 設定で定義された以上のカスタム動作が必要な場合のみスクリプトを使用

### 2. スクリプトMOD

ゲームプレイ機能、管理ツール、システムを追加します -- 主にコードで、アセットは最小限です。

```
MyAdminTools/
  mod.cpp
  stringtable.csv
  Scripts/
    config.cpp
    3_Game/
      MyAdminTools/
        Config.c
        RPCHandler.c
        Permissions.c
    4_World/
      MyAdminTools/
        PlayerManager.c
        VehicleManager.c
    5_Mission/
      MyAdminTools/
        AdminMenu.c
        AdminHUD.c
  GUI/
    layouts/
      admin_menu.layout
      admin_hud.layout
    imagesets/
      admin_icons.imageset
```

**特徴:**
- `Scripts/`（3_Game、4_World、5_Missionのコードが大部分）が重い
- UI用のGUIレイアウトとimagesets
- `Data/`はほとんどまたはまったくなし（3Dモデルなし）
- 通常フレームワーク（CF、DabsFramework、またはカスタムフレームワーク）に依存

### 3. フレームワークMOD

他のMODに共有インフラストラクチャを提供します -- ログ、RPC、設定、UIシステムなど。

```
MyFramework/
  mod.cpp
  stringtable.csv
  Scripts/
    config.cpp
    Data/
      Credits.json
    1_Core/                     <-- フレームワークは1_Coreをよく使用
      MyFramework/
        Constants.c
        LogLevel.c
    3_Game/
      MyFramework/
        Config/
          ConfigManager.c
          ConfigBase.c
        RPC/
          RPCManager.c
        Events/
          EventBus.c
        Logging/
          Logger.c
        Permissions/
          PermissionManager.c
        UI/
          ViewBase.c
          DialogBase.c
    4_World/
      MyFramework/
        Module/
          ModuleManager.c
          ModuleBase.c
        Player/
          PlayerData.c
    5_Mission/
      MyFramework/
        MissionHooks.c
        ModRegistration.c
  GUI/
    config.cpp
    layouts/
    imagesets/
    icons/
    looknfeel/
```

**特徴:**
- すべてのスクリプトレイヤー（1_Coreから5_Mission）を使用
- 各レイヤーに深いサブディレクトリ階層
- 機能検出用の `defines[]` を定義
- 他のMODが `requiredAddons` 経由で依存
- 他のMODが拡張する基底クラスを提供

---

## クライアント-サーバー分割MOD

MODがクライアント可視の動作（UI、エンティティレンダリング）とサーバー専用のロジック（スポーン、AIブレイン、セキュアな状態）の両方を持つ場合、2つのパッケージに分割すべきです。

### ディレクトリ構造

```
MyMod/                                    <-- プロジェクトルート（開発リポジトリ）
  MyMod_Sub/                           <-- クライアントパッケージ（-mod=で読み込み）
    mod.cpp
    stringtable.csv
    Scripts/
      config.cpp                          <-- type = "mod"
      3_Game/MyMod/                       <-- 共有データクラス、RPC
      4_World/MyMod/                      <-- クライアントサイドエンティティレンダリング
      5_Mission/MyMod/                    <-- クライアントUI、HUD
    GUI/
      layouts/
    Sounds/

  MyMod_SubServer/                     <-- サーバーパッケージ（-servermod=で読み込み）
    mod.cpp
    Scripts/
      config.cpp                          <-- type = "servermod"
      3_Game/MyModServer/                 <-- サーバーサイドデータクラス
      4_World/MyModServer/                <-- スポーン、AIロジック、状態管理
      5_Mission/MyModServer/              <-- サーバー起動/シャットダウンフック
```

### 分割MODの主要ルール

1. **クライアントパッケージは全員が読み込む**（サーバーとすべてのクライアントが `-mod=` 経由で）
2. **サーバーパッケージはサーバーのみが読み込む**（`-servermod=` 経由で）
3. **サーバーパッケージはクライアントパッケージに依存**（`requiredAddons` 経由で）
4. **サーバーパッケージにUIコードを入れない** -- クライアントはそれを受け取らない
5. **セキュア/プライベートなロジックはサーバーパッケージに** -- クライアントには送信されない

### 依存チェーン

```cpp
// クライアントパッケージ config.cpp
class CfgPatches
{
    class MyMod_Sub_Scripts
    {
        requiredAddons[] = { "DZ_Scripts", "MyMod_Core_Scripts" };
    };
};

// サーバーパッケージ config.cpp
class CfgPatches
{
    class MyMod_SubServer_Scripts
    {
        requiredAddons[] = { "DZ_Scripts", "MyMod_Sub_Scripts", "MyMod_Core_Scripts" };
        //                                  ^^^ クライアントパッケージに依存
    };
};
```

---

## どこに何を置くか

### Data/ ディレクトリ

物理アセットとアイテム定義:

```
Data/
  config.cpp          <-- CfgVehicles、CfgWeapons、CfgMagazines、CfgAmmo
  Models/             <-- .p3d 3Dモデルファイル
  Textures/           <-- .paa、.eddsテクスチャファイル
  Materials/          <-- .rvmatマテリアル定義
  Animations/         <-- .animアニメーションファイル（まれ）
```

### Scripts/ ディレクトリ

すべてのEnforce Scriptコード:

```
Scripts/
  config.cpp          <-- CfgPatches、CfgMods、スクリプトモジュール定義
  Inputs.xml          <-- キーバインド定義
  Data/
    Credits.json      <-- 著者クレジット
    Version.hpp       <-- バージョン文字列
  1_Core/             <-- 基本定数とユーティリティ
  3_Game/             <-- 設定、RPC、データクラス
  4_World/            <-- エンティティ、マネージャー、ゲームプレイロジック
  5_Mission/          <-- UI、HUD、ミッションライフサイクル
```

### GUI/ ディレクトリ

ユーザーインターフェースリソース:

```
GUI/
  config.cpp          <-- GUI固有のCfgPatches（imageset/スタイル登録用）
  layouts/            <-- .layoutファイル（ウィジェットツリー）
  imagesets/          <-- .imageset XML + .eddsテクスチャアトラス
  icons/              <-- アイコンimagesets（一般imagesetとは別の場合もある）
  looknfeel/          <-- .stylesファイル（ウィジェットの視覚プロパティ）
  fonts/              <-- カスタムフォントファイル（まれ）
  sounds/             <-- UIサウンドファイル（クリック、ホバーなど）
```

### Sounds/ ディレクトリ

オーディオファイル:

```
Sounds/
  alert.ogg           <-- 常に.ogg形式
  ambient.ogg
  click.ogg
```

サウンド設定（CfgSoundSets、CfgSoundShaders）は `Scripts/config.cpp` に入れます。別のSounds設定には入れません。

### ServerFiles/ ディレクトリ

サーバー管理者がサーバーのミッションフォルダにコピーするファイル:

```
ServerFiles/
  types.xml                   <-- Central Economy用アイテムスポーン定義
  cfgspawnabletypes.xml       <-- アタッチメント/カーゴプリセット
  cfgeventspawns.xml          <-- イベントスポーン位置（まれ）
  README.md                   <-- インストール手順
```

---

## PBO命名と@modフォルダ命名

### PBO名

各PBOにはMODプレフィックス付きの説明的な名前を付けます:

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo         <-- スクリプトコード
    MyMod_Data.pbo            <-- モデル、テクスチャ、アイテム
    MyMod_GUI.pbo             <-- レイアウト、imagesets、スタイル
    MyMod_Sounds.pbo          <-- オーディオ（Dataにバンドルされることもある）
```

PBO名はCfgPatchesクラス名と一致する必要はありませんが、揃えておくと混乱を防げます。

### @modフォルダ名

`@` プレフィックスはSteam Workshop規則です。開発中は省略できます:

```
開発中:    MyMod/           <-- @プレフィックスなし
Workshop:  @MyMod/          <-- @プレフィックスあり
```

`@` はエンジンにとって技術的な意味はありません。純粋に組織的な規則です。

---

## プロフェッショナルMODの実例

### Community Online Tools (COT) -- 管理ツール

```
JM/COT/
  mod.cpp
  GUI/
    config.cpp
    layouts/
      cursors/
      uiactions/
      vehicles/
    textures/
  Objects/Debug/
    config.cpp                            <-- デバッグエンティティ定義
  Scripts/
    config.cpp
    Data/
      Credits.json
      Version.hpp
      Inputs.xml
    Common/                               <-- すべてのレイヤーで共有
    1_Core/
    3_Game/
    4_World/
    5_Mission/
  languagecore/
    config.cpp                            <-- 文字列テーブル設定
```

`Common/` フォルダパターンに注目してください: すべてのスクリプトモジュールの `files[]` に含まれ、すべてのレイヤーで共有型を可能にします。

### DabsFramework -- UIフレームワーク

```
DabsFramework/
  mod.cpp
  gui/
    config.cpp
    imagesets/
    icons/
      brands.imageset
      light.imageset
      regular.imageset
      solid.imageset
      thin.imageset
    looknfeel/
  scripts/
    config.cpp
    Credits.json
    Version.hpp
    1_core/
    2_GameLib/                            <-- レイヤー2を使用するまれなMODの1つ
    3_Game/
    4_World/
    5_Mission/
```

注: DabsFrameworkは小文字のフォルダ名（`scripts/`、`gui/`）を使用します。これはWindowsでは大文字小文字を区別しないため動作しますが、Linuxでは問題を引き起こす可能性があります。規則では標準的な大文字（`Scripts/`、`GUI/`）を使用します。

---

## アンチパターン

### 1. フラットなスクリプトダンプ

```
Scripts/
  3_Game/
    AllMyStuff.c            <-- 2000行、15クラス
    MoreStuff.c             <-- 1500行、12クラス
```

**修正:** 1ファイル1クラス、サブシステムごとのサブディレクトリで整理。

### 2. 間違ったレイヤー配置

```
Scripts/
  3_Game/
    MyMod/
      PlayerManager.c       <-- PlayerBase（4_Worldで定義）を参照
      MyPanel.c             <-- UIコード（5_Missionに属する）
      MyItem.c              <-- ItemBaseを拡張（4_Worldに属する）
```

**修正:** 第2.1章のレイヤールールに従ってください。エンティティコードを `4_World` に、UIコードを `5_Mission` に移動。

### 3. スクリプトレイヤーにMODサブディレクトリがない

```
Scripts/
  3_Game/
    Config.c                <-- 他のMODとの名前衝突リスク!
    RPCs.c
```

**修正:** 常にサブディレクトリで名前空間化:

```
Scripts/
  3_Game/
    MyMod/
      Config.c
      RPCs.c
```

### 4. Scripts/内のstringtable.csv

```
Scripts/
  stringtable.csv           <-- 間違った場所
  config.cpp
```

**修正:** `stringtable.csv` はMODルート（`mod.cpp` の横）に配置:

```
MyMod/
  mod.cpp
  stringtable.csv           <-- 正しい
  Scripts/
    config.cpp
```

### 5. 1つのPBOにアセットとスクリプトが混在

**修正:** 複数のPBOに分割してください。

### 6. 過度に深いサブディレクトリ

```
Scripts/3_Game/MyMod/Systems/Core/Config/Managers/Settings/PlayerSettings.c
```

**修正:** ネストは最大2-3レベルに保ってください。可能な場合はフラットに:

```
Scripts/3_Game/MyMod/Config/PlayerSettings.c
```

### 7. 一貫性のない命名

**修正:** 1つの規則を選んで一貫して使用:

```
MyModConfig.c
MyModRPC.c
MyModManager.c
MyModPanel.c
```

---

## サマリーチェックリスト

MODを公開する前に確認してください:

- [ ] `mod.cpp` がMODルートにある（`Addons/` または `Scripts/` の横）
- [ ] `stringtable.csv` がMODルートにある（`Scripts/` 内ではない）
- [ ] すべてのPBOルートに `config.cpp` が存在
- [ ] `requiredAddons[]` がすべての依存関係をリスト
- [ ] スクリプトモジュールの `files[]` パスが実際のディレクトリ構造と一致
- [ ] すべての `.c` ファイルがMOD名前空間サブディレクトリ内にある（例: `3_Game/MyMod/`）
- [ ] クラス名に衝突を避けるユニークなプレフィックスがある
- [ ] エンティティクラスは `4_World`、UIクラスは `5_Mission`、データクラスは `3_Game` にある
- [ ] 公開PBOにシークレットやデバッグコードがない
- [ ] サーバー専用ロジックが別の `-servermod` パッケージにある（該当する場合）

---

## 実際のMODで確認されたパターン

| パターン | MOD | 詳細 |
|---------|-----|--------|
| `3_Game` の深いサブシステムフォルダ | StarDZ Core | `3_Game/` 下に15以上のフォルダ（Config、RPC、Events、Logging、Permissionsなど） |
| `Common/` 共有フォルダ | COT | すべてのスクリプトモジュールの `files[]` に含まれ、レイヤー横断のユーティリティ型を提供 |
| 小文字のフォルダ名 | DabsFramework | `Scripts/`、`GUI/` の代わりに `scripts/`、`gui/` を使用 -- Windowsでは動作するがLinuxでは問題のリスク |
| 別のGUI PBO | Expansion、COT | GUIリソース（レイアウト、imagesets、スタイル）を独自のconfig.cppを持つ専用PBOにパック |
| コンテンツMODの最小限のScripts | 武器パック | `Data/` ディレクトリが支配的。`Scripts/` には薄いconfig.cppとオプションの動作オーバーライドのみ |

---

## 理論と実践

| 概念 | 理論 | 実際 |
|---------|--------|---------|
| 1ファイル1クラス | 各 `.c` ファイルに1つのクラスを含む | 小さなヘルパークラスと列挙型は、利便性のため親クラスと同じファイルに配置されることが多い |
| Scripts/Data/GUIの別PBO | 関心ごとのクリーンな分離 | 小さなMODはすべてを1つのPBOに統合して配布を簡素化することが多い |
| MODサブフォルダが衝突を防止 | `3_Game/MyMod/` がファイルを名前空間化 | 正しいが、クラス名は依然としてグローバルに衝突する -- サブフォルダはファイルレベルの競合のみを防止 |
| MODルートの `stringtable.csv` | エンジンが自動的に検出 | 読み込まれるPBOルートに配置する必要がある。`Scripts/` 内に配置すると静かに無視される |
| MODに同梱される ServerFiles/ | サーバー管理者がtypes.xmlをコピー | 多くのMOD作者がServerFilesの同梱を忘れ、管理者がtypes.xmlエントリを手動で作成する必要がある |

---

## 互換性と影響

- **マルチMOD:** ファイル構成自体は競合を引き起こしません。ただし、2つのMODがPBO内に同じパスのファイルを配置すると（例: 両方がMODサブフォルダなしで `3_Game/Config.c` を使用）、エンジンレベルで衝突し、一方が静かに他方を上書きします。
- **パフォーマンス:** ディレクトリの深さとファイル数は、スクリプトのコンパイル時間に測定可能な影響を与えません。エンジンはネストに関係なく、リストされたすべての `files[]` ディレクトリを再帰的にスキャンします。

---

**前へ:** [第2.4章: 最初のMOD -- 最小限のMOD](04-minimum-viable-mod.md)
**次へ:** [第2.6章: サーバーvsクライアントアーキテクチャ](06-server-client-split.md)
