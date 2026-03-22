# Chapter 4.6: PBOパッキング

[ホーム](../README.md) | [<< 前: DayZ Toolsワークフロー](05-dayz-tools.md) | **PBOパッキング** | [次: Workbenchガイド >>](07-workbench-guide.md)

---

## はじめに

**PBO**（Packed Bank of Objects）はDayZのアーカイブフォーマットで、ゲームコンテンツ用の`.zip`ファイルに相当します。ゲームが読み込むすべてのModは、1つ以上のPBOファイルとして配布されます。プレイヤーがSteam WorkshopでModをサブスクライブすると、PBOをダウンロードします。サーバーがModを読み込むとき、PBOを読み取ります。PBOは、Moddingパイプライン全体の最終成果物です。

PBOを正しく作成する方法 --- いつバイナリ化するか、プレフィックスの設定方法、出力の構造化方法、プロセスの自動化方法 --- を理解することが、ソースファイルと動作するModの間の最後のステップです。この章では、基本概念から高度な自動化ビルドワークフローまで、すべてを扱います。

---

## 目次

- [PBOとは何か？](#what-is-a-pbo)
- [PBOの内部構造](#pbo-internal-structure)
- [AddonBuilder：パッキングツール](#addonbuilder-the-packing-tool)
- [-packonlyフラグ](#the--packonly-flag)
- [-prefixフラグ](#the--prefix-flag)
- [バイナリ化：必要な場合と不要な場合](#binarization-when-needed-vs-not)
- [キー署名](#key-signing)
- [@modフォルダ構造](#mod-folder-structure)
- [自動化ビルドスクリプト](#automated-build-scripts)
- [マルチPBO Modビルド](#multi-pbo-mod-builds)
- [一般的なビルドエラーと解決策](#common-build-errors-and-solutions)
- [テスト：ファイルパッチング vs PBOローディング](#testing-file-patching-vs-pbo-loading)
- [ベストプラクティス](#best-practices)

---

## PBOとは何か？

PBOは、ゲームアセットのディレクトリツリーを含むフラットアーカイブファイルです。圧縮はありません（ZIPとは異なり）--- 内部のファイルは元のサイズのまま保存されます。「パッキング」は純粋に組織的なものです：多くのファイルが内部パス構造を持つ1つのファイルになります。

### 主な特徴

- **圧縮なし：** ファイルはそのまま保存されます。PBOのサイズは、その内容の合計に小さなヘッダーを加えたものと等しくなります。
- **フラットヘッダー：** パス、サイズ、オフセットを含むファイルエントリのリストです。
- **プレフィックスメタデータ：** 各PBOは、エンジンの仮想ファイルシステムにその内容をマップする内部パスプレフィックスを宣言します。
- **ランタイムで読み取り専用：** エンジンはPBOから読み取りますが、書き込みはしません。
- **マルチプレイヤー用に署名：** PBOは、サーバーの署名検証用にBohemiaスタイルのキーペアで署名できます。

### ルーズファイルではなくPBOを使う理由

- **配布：** Modコンポーネントあたり1ファイルは、数千のルーズファイルよりもシンプルです。
- **整合性：** キー署名により、Modが改ざんされていないことが保証されます。
- **パフォーマンス：** エンジンのファイルI/OはPBOからの読み取りに最適化されています。
- **整理：** プレフィックスシステムにより、Mod間のパス衝突が防止されます。

---

## PBOの内部構造

PBOを開くと（PBO ManagerやMikeroToolsなどのツールを使用）、ディレクトリツリーが表示されます：

```
MyMod.pbo
  $PBOPREFIX$                    <-- プレフィックスパスを含むテキストファイル
  config.bin                      <-- バイナリ化されたconfig.cpp（-packonlyの場合はconfig.cpp）
  Scripts/
    3_Game/
      MyConstants.c
    4_World/
      MyManager.c
    5_Mission/
      MyUI.c
  data/
    models/
      my_item.p3d                 <-- バイナリ化されたODOL（-packonlyの場合はMLOD）
    textures/
      my_item_co.paa
      my_item_nohq.paa
      my_item_smdi.paa
    materials/
      my_item.rvmat
  sound/
    gunshot_01.ogg
  GUI/
    layouts/
      my_panel.layout
```

### $PBOPREFIX$

`$PBOPREFIX$`ファイルは、PBOのルートにあるModのパスプレフィックスを宣言する小さなテキストファイルです。例：

```
MyMod
```

これはエンジンに「何かが`MyMod\data\textures\my_item_co.paa`を参照した場合、このPBO内の`data\textures\my_item_co.paa`を探してください」と伝えます。

### config.bin vs. config.cpp

- **config.bin：** Binarizeによって作成されたconfig.cppのバイナリ化（バイナリ）バージョンです。読み込み時のパースが高速です。
- **config.cpp：** 元のテキストフォーマットの設定です。エンジンで動作しますが、パースがやや遅くなります。

バイナリ化付きでビルドすると、config.cppはconfig.binになります。`-packonly`を使用すると、config.cppがそのまま含まれます。

---

## AddonBuilder：パッキングツール

**AddonBuilder**は、DayZ Toolsに含まれるBohemia公式のPBOパッキングツールです。GUIモードまたはコマンドラインモードで操作できます。

### GUIモード

1. DayZ Tools LauncherからAddonBuilderを起動します。
2. **ソースディレクトリ：** P:上のModフォルダを参照します（例：`P:\MyMod`）。
3. **出力ディレクトリ：** 出力フォルダを参照します（例：`P:\output`）。
4. **オプション：**
   - **Binarize：** コンテンツに対してBinarizeを実行するにはチェックします（P3D、テクスチャ、configを変換）。
   - **Sign：** チェックしてPBOに署名するキーを選択します。
   - **Prefix：** Modプレフィックスを入力します（例：`MyMod`）。
5. **Pack**をクリックします。

### コマンドラインモード

自動化ビルドにはコマンドラインモードが推奨されます：

```bash
AddonBuilder.exe [source_path] [output_path] [options]
```

**完全な例：**
```bash
"P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe" ^
    "P:\MyMod" ^
    "P:\output" ^
    -prefix="MyMod" ^
    -sign="P:\keys\MyKey"
```

### コマンドラインオプション

| フラグ | 説明 |
|------|-------------|
| `-prefix=<path>` | PBOの内部プレフィックスを設定します（パス解決に不可欠） |
| `-packonly` | バイナリ化をスキップし、ファイルをそのままパックします |
| `-sign=<key_path>` | 指定されたBIキーでPBOに署名します（秘密鍵パス、拡張子なし） |
| `-include=<path>` | インクルードファイルリスト -- このフィルタに一致するファイルのみパックします |
| `-exclude=<path>` | 除外ファイルリスト -- このフィルタに一致するファイルをスキップします |
| `-binarize=<path>` | Binarize.exeへのパス（デフォルトの場所にない場合） |
| `-temp=<path>` | Binarize出力用の一時ディレクトリ |
| `-clear` | パッキング前に出力ディレクトリをクリアします |
| `-project=<path>` | プロジェクトドライブパス（通常`P:\`） |

---

## -packonlyフラグ

`-packonly`フラグは、AddonBuilderで最も重要なオプションの1つです。すべてのバイナリ化をスキップし、ソースファイルをそのままパックするようツールに指示します。

### -packonlyの使い分け

| Modコンテンツ | -packonlyを使用？ | 理由 |
|-------------|---------------|--------|
| スクリプトのみ（.cファイル） | **はい** | スクリプトはバイナリ化されません |
| UIレイアウト（.layout） | **はい** | レイアウトはバイナリ化されません |
| オーディオのみ（.ogg） | **はい** | OGGはすでにゲーム対応です |
| 変換済みテクスチャ（.paa） | **はい** | すでに最終フォーマットです |
| Config.cpp（CfgVehiclesなし） | **はい** | シンプルなconfigはバイナリ化なしで動作します |
| Config.cpp（CfgVehiclesあり） | **いいえ** | アイテム定義にはバイナリ化されたconfigが必要です |
| P3Dモデル（MLOD） | **いいえ** | パフォーマンスのためにODOLにバイナリ化すべきです |
| TGA/PNGテクスチャ（変換が必要） | **いいえ** | PAAに変換する必要があります |

### 実用的なガイダンス

**スクリプトのみのMod**（カスタムアイテムのないフレームワークやユーティリティMod）の場合：
```bash
AddonBuilder.exe "P:\MyScriptMod" "P:\output" -prefix="MyScriptMod" -packonly
```

**アイテムMod**（モデルとテクスチャを持つ武器、衣服、車両）の場合：
```bash
AddonBuilder.exe "P:\MyItemMod" "P:\output" -prefix="MyItemMod" -sign="P:\keys\MyKey"
```

> **ヒント：** 多くのModは、ビルドプロセスを最適化するためにまさに複数のPBOに分割しています。スクリプトPBOは`-packonly`を使用し（高速）、モデルとテクスチャを含むデータPBOはフルバイナリ化を行います（遅いが必要）。

---

## -prefixフラグ

`-prefix`フラグは、PBOの内部パスプレフィックスを設定し、PBO内の`$PBOPREFIX$`ファイルに書き込まれます。このプレフィックスは非常に重要です -- エンジンがPBO内のコンテンツへのパスをどのように解決するかを決定します。

### プレフィックスの仕組み

```
ソース：P:\MyMod\data\textures\item_co.paa
プレフィックス：MyMod
PBO内部パス：data\textures\item_co.paa

エンジン解決：MyMod\data\textures\item_co.paa
  --> MyMod.pbo内で検索：data\textures\item_co.paa
  --> 見つかりました！
```

### マルチレベルプレフィックス

サブフォルダ構造を使用するModでは、プレフィックスに複数のレベルを含めることができます：

```bash
# P:ドライブ上のソース
P:\MyMod\MyMod\Scripts\3_Game\MyClass.c

# プレフィックスが"MyMod\MyMod\Scripts"の場合
# PBO内部：3_Game\MyClass.c
# エンジンパス：MyMod\MyMod\Scripts\3_Game\MyClass.c
```

### プレフィックスは参照と一致する必要があります

config.cppが`MyMod\data\texture_co.paa`を参照する場合、そのテクスチャを含むPBOはプレフィックス`MyMod`を持ち、ファイルはPBO内で`data\texture_co.paa`にある必要があります。不一致があると、エンジンはファイルを見つけることができません。

### 一般的なプレフィックスパターン

| Mod構造 | ソースパス | プレフィックス | Config参照 |
|---------------|-------------|--------|-----------------|
| シンプルなMod | `P:\MyMod\` | `MyMod` | `MyMod\data\item.p3d` |
| 名前空間付きMod | `P:\MyWeapons\` | `MyWeapons` | `MyWeapons\data\rifle.p3d` |
| スクリプトサブパッケージ | `P:\MyFramework\MyMod\Scripts\` | `MyFramework\MyMod\Scripts` | （config.cppの`CfgMods`経由で参照） |

---

## バイナリ化：必要な場合と不要な場合

バイナリ化は、人間が読めるソースフォーマットをエンジン最適化されたバイナリフォーマットに変換することです。ビルドプロセスで最も時間のかかるステップであり、ビルドエラーの最も一般的な原因です。

### バイナリ化されるもの

| ファイルタイプ | バイナリ化先 | 必須？ |
|-----------|-------------|-----------|
| `config.cpp` | `config.bin` | アイテム定義Mod（CfgVehicles、CfgWeapons）には必須 |
| `.p3d`（MLOD） | `.p3d`（ODOL） | 推奨 -- ODOLは読み込みが速く、サイズが小さい |
| `.tga` / `.png` | `.paa` | 必須 -- エンジンはランタイムにPAAが必要 |
| `.edds` | `.paa` | 必須 -- 上記と同じ |
| `.rvmat` | `.rvmat`（処理済み） | パスが解決され、わずかな最適化 |
| `.wrp` | `.wrp`（最適化済み） | テレイン/マップModには必須 |

### バイナリ化されないもの

| ファイルタイプ | 理由 |
|-----------|--------|
| `.c`スクリプト | スクリプトはエンジンによってテキストとして読み込まれます |
| `.ogg`オーディオ | すでにゲーム対応フォーマットです |
| `.layout`ファイル | すでにゲーム対応フォーマットです |
| `.paa`テクスチャ | すでに最終フォーマットです（変換済み） |
| `.json`データ | スクリプトコードによってテキストとして読み取られます |

### Config.cppのバイナリ化の詳細

Config.cppのバイナリ化は、ほとんどのモッダーが問題に遭遇するステップです。バイナリ化ツールはconfig.cppテキストをパースし、その構造を検証し、継承チェーンを解決し、バイナリのconfig.binを出力します。

**config.cppのバイナリ化が必要な場合：**
- configが`CfgVehicles`エントリ（アイテム、武器、車両、建物）を定義する。
- configが`CfgWeapons`エントリを定義する。
- configがモデルやテクスチャを参照するエントリを定義する。

**バイナリ化が不要な場合：**
- configが`CfgPatches`と`CfgMods`のみを定義する（Mod登録）。
- configがサウンド設定のみを定義する。
- 最小限のconfigのスクリプトのみのMod。

> **経験則：** config.cppがゲームワールドに物理的なアイテムを追加する場合、バイナリ化が必要です。スクリプトの登録と非アイテムデータの定義のみの場合、`-packonly`で問題ありません。

---

## キー署名

PBOは暗号キーペアで署名できます。サーバーは署名検証を使用して、すべての接続クライアントが同じ（改変されていない）Modファイルを持っていることを確認します。

### キーペアの構成要素

| ファイル | 拡張子 | 目的 | 所有者 |
|------|-----------|---------|------------|
| 秘密鍵 | `.biprivatekey` | ビルド時にPBOに署名 | Mod作者のみ（秘密に保管） |
| 公開鍵 | `.bikey` | 署名を検証 | サーバー管理者、Modと共に配布 |

### キーの生成

DayZ Toolsの**DSSignFile**または**DSCreateKey**ユーティリティを使用します：

```bash
# キーペアの生成
DSCreateKey.exe MyModKey

# 以下が作成されます：
#   MyModKey.biprivatekey   （秘密に保管、配布しない）
#   MyModKey.bikey          （サーバー管理者に配布）
```

### ビルド時の署名

```bash
AddonBuilder.exe "P:\MyMod" "P:\output" ^
    -prefix="MyMod" ^
    -sign="P:\keys\MyModKey"
```

これにより以下が生成されます：
```
P:\output\
  MyMod.pbo
  MyMod.pbo.MyModKey.bisign    <-- 署名ファイル
```

### サーバー側のキーインストール

サーバー管理者は公開鍵（`.bikey`）をサーバーの`keys/`ディレクトリに配置します：

```
DayZServer/
  keys/
    MyModKey.bikey             <-- このModを持つクライアントの接続を許可
```

---

## @modフォルダ構造

DayZは`@`プレフィックス規約を使用した特定のディレクトリ構造でModが整理されていることを期待します：

```
@MyMod/
  addons/
    MyMod.pbo                  <-- パックされたModコンテンツ
    MyMod.pbo.MyKey.bisign     <-- PBO署名（オプション）
  keys/
    MyKey.bikey                <-- サーバー用公開鍵（オプション）
  mod.cpp                      <-- Modメタデータ
```

### mod.cpp

`mod.cpp`ファイルは、DayZランチャーに表示されるメタデータを提供します：

```cpp
name = "My Awesome Mod";
author = "ModAuthor";
version = "1.0.0";
url = "https://steamcommunity.com/sharedfiles/filedetails/?id=XXXXXXXXX";
```

### マルチPBO Mod

大規模なModは、単一の`@mod`フォルダ内で複数のPBOに分割されることがよくあります：

```
@MyFramework/
  addons/
    MyCore_Scripts.pbo        <-- スクリプトレイヤー
    MyCore_Data.pbo           <-- テクスチャ、モデル、マテリアル
    MyCore_GUI.pbo            <-- レイアウトファイル、イメージセット
  keys/
    MyMod.bikey
  mod.cpp
```

### Modの読み込み

Modは`-mod`パラメータで読み込まれます：

```bash
# 単一Mod
DayZDiag_x64.exe -mod="@MyMod"

# 複数Mod（セミコロン区切り）
DayZDiag_x64.exe -mod="@MyFramework;@MyWeapons;@MyMissions"
```

`@`フォルダはゲームのルートディレクトリにある必要があるか、絶対パスを指定する必要があります。

---

## 自動化ビルドスクリプト

AddonBuilderのGUIを通じた手動PBOパッキングは、小さくシンプルなModでは許容されます。複数のPBOを持つ大規模プロジェクトでは、自動化ビルドスクリプトが不可欠です。

### バッチスクリプトパターン

一般的な`build_pbos.bat`：

```batch
@echo off
setlocal

set TOOLS="P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe"
set OUTPUT="P:\@MyMod\addons"
set KEY="P:\keys\MyKey"

echo === スクリプトPBOをビルド中 ===
%TOOLS% "P:\MyMod\Scripts" %OUTPUT% -prefix="MyMod\Scripts" -packonly -clear

echo === データPBOをビルド中 ===
%TOOLS% "P:\MyMod\Data" %OUTPUT% -prefix="MyMod\Data" -sign=%KEY% -clear

echo === ビルド完了 ===
pause
```

### Pythonビルドスクリプトパターン（dev.py）

より洗練されたビルドには、Pythonスクリプトがより良いエラー処理、ログ記録、条件付きロジックを提供します：

```python
import subprocess
import os
import sys

ADDON_BUILDER = r"P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe"
OUTPUT_DIR = r"P:\@MyMod\addons"
KEY_PATH = r"P:\keys\MyKey"

PBOS = [
    {
        "name": "Scripts",
        "source": r"P:\MyMod\Scripts",
        "prefix": r"MyMod\Scripts",
        "packonly": True,
    },
    {
        "name": "Data",
        "source": r"P:\MyMod\Data",
        "prefix": r"MyMod\Data",
        "packonly": False,
    },
]

def build_pbo(pbo_config):
    """Build a single PBO."""
    cmd = [
        ADDON_BUILDER,
        pbo_config["source"],
        OUTPUT_DIR,
        f"-prefix={pbo_config['prefix']}",
    ]

    if pbo_config.get("packonly"):
        cmd.append("-packonly")
    else:
        cmd.append(f"-sign={KEY_PATH}")

    print(f"Building {pbo_config['name']}...")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"ERROR building {pbo_config['name']}:")
        print(result.stderr)
        return False

    print(f"  {pbo_config['name']} built successfully.")
    return True

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    success = True
    for pbo in PBOS:
        if not build_pbo(pbo):
            success = False

    if success:
        print("\nAll PBOs built successfully.")
    else:
        print("\nBuild completed with errors.")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### dev.pyとの統合

MyModプロジェクトでは`dev.py`を中央ビルドオーケストレーターとして使用しています：

```bash
python dev.py build          # すべてのPBOをビルド
python dev.py server         # ビルド + サーバー起動 + ログ監視
python dev.py full           # ビルド + サーバー + クライアント
```

このパターンは、すべてのマルチModワークスペースに推奨されます。単一のコマンドですべてをビルドし、サーバーを起動し、監視を開始します -- 手動ステップを排除し、ヒューマンエラーを削減します。

---

## マルチPBO Modビルド

大規模なModは、複数のPBOに分割することで恩恵を受けます。これにはいくつかの利点があります：

### 複数PBOに分割する理由

1. **高速リビルド。** スクリプトのみ変更した場合、スクリプトPBOのみリビルドします（`-packonly`使用で数秒）。データPBO（バイナリ化あり）は数分かかりますが、リビルド不要です。
2. **モジュラーローディング。** サーバー専用PBOをクライアントダウンロードから除外できます。
3. **クリーンな整理。** スクリプト、データ、GUIが明確に分離されます。
4. **パラレルビルド。** 独立したPBOは同時にビルドできます。

### 一般的な分割パターン

```
@MyMod/
  addons/
    MyMod_Core.pbo           <-- config.cpp、CfgPatches（バイナリ化）
    MyMod_Scripts.pbo         <-- すべての.cスクリプトファイル（-packonly）
    MyMod_Data.pbo            <-- モデル、テクスチャ、マテリアル（バイナリ化）
    MyMod_GUI.pbo             <-- レイアウト、イメージセット（-packonly）
    MyMod_Sounds.pbo          <-- OGGオーディオファイル（-packonly）
```

### PBO間の依存関係

あるPBOが別のPBOに依存する場合（例：スクリプトがconfig PBOで定義されたアイテムを参照する）、`CfgPatches`の`requiredAddons[]`が正しい読み込み順序を保証します：

```cpp
// MyMod_Scripts config.cpp内
class CfgPatches
{
    class MyMod_Scripts
    {
        requiredAddons[] = {"MyMod_Core"};   // コアPBOの後に読み込む
    };
};
```

---

## 一般的なビルドエラーと解決策

### エラー：「Include file not found」

**原因：** Config.cppが、期待されるパスに存在しないファイル（モデル、テクスチャ）を参照しています。
**解決策：** 参照されている正確なパスにファイルがP:上に存在することを確認してください。スペルと大文字小文字をチェックしてください。

### エラー：詳細なしの「Binarize failed」

**原因：** Binarizeが破損したまたは無効なソースファイルでクラッシュしました。
**解決策：**
1. Binarizeが処理していたファイルを確認します（ログ出力を確認）。
2. 問題のファイルを適切なツール（P3DにはObject Builder、テクスチャにはTexView2）で開きます。
3. ファイルを検証します。
4. よくある原因：2の累乗でないテクスチャ、破損したP3Dファイル、無効なconfig.cpp構文。

### エラー：「Addon requires addon X」

**原因：** CfgPatchesの`requiredAddons[]`に存在しないアドオンがリストされています。
**解決策：** 必要なアドオンをインストールするか、ビルドに追加するか、実際に必要でない場合は要件を削除してください。

### エラー：Config.cppパースエラー（行X）

**原因：** config.cppの構文エラーです。
**解決策：** config.cppをテキストエディタで開いて行Xを確認してください。よくある問題：
- クラス定義後のセミコロンの欠落。
- 閉じられていない中括弧`{}`。
- 文字列値のクォートの欠落。
- 行末のバックスラッシュ（行継続はサポートされていません）。

### エラー：PBOプレフィックスの不一致

**原因：** PBO内のプレフィックスが、config.cppやマテリアルで使用されているパスと一致しません。
**解決策：** `-prefix`がすべての参照で期待されるパス構造と一致していることを確認してください。config.cppが`MyMod\data\item.p3d`を参照する場合、PBOプレフィックスは`MyMod`で、ファイルはPBO内の`data\item.p3d`にある必要があります。

### エラー：サーバーでの「Signature check failed」

**原因：** クライアントのPBOがサーバーの期待する署名と一致しません。
**解決策：**
1. サーバーとクライアントの両方が同じPBOバージョンを持っていることを確認します。
2. 必要に応じて新しいキーでPBOに再署名します。
3. サーバーの`.bikey`を更新します。

### エラー：Binarize中の「Cannot open file」

**原因：** P:ドライブがマウントされていないか、ファイルパスが正しくありません。
**解決策：** P:ドライブをマウントし、ソースパスが存在することを確認してください。

---

## テスト：ファイルパッチング vs PBOローディング

開発には2つのテストモードがあります。各状況に適したものを選ぶことで、大幅な時間の節約になります。

### ファイルパッチング（開発）

| 側面 | 詳細 |
|--------|--------|
| **速度** | 即時 -- ファイルを編集、ゲームを再起動 |
| **セットアップ** | P:ドライブをマウント、`-filePatching`フラグ付きで起動 |
| **実行ファイル** | `DayZDiag_x64.exe`（Diagビルドが必要） |
| **署名** | 該当なし（署名するPBOがない） |
| **制限** | バイナリ化されたconfigなし、Diagビルドのみ |
| **最適な用途** | スクリプト開発、UIイテレーション、ラピッドプロトタイピング |

### PBOローディング（リリーステスト）

| 側面 | 詳細 |
|--------|--------|
| **速度** | 遅い -- 変更ごとにPBOをリビルドする必要あり |
| **セットアップ** | PBOをビルド、`@mod/addons/`に配置 |
| **実行ファイル** | `DayZDiag_x64.exe`またはリテール版`DayZ_x64.exe` |
| **署名** | サポート（マルチプレイヤーには必須） |
| **制限** | 変更ごとにリビルドが必要 |
| **最適な用途** | 最終テスト、マルチプレイヤーテスト、リリース検証 |

### 推奨ワークフロー

1. **ファイルパッチングで開発：** スクリプトを書き、レイアウトを調整し、テクスチャのイテレーションを行います。ゲームを再起動してテストします。ビルドステップは不要です。
2. **定期的にPBOをビルド：** バイナリ化固有の問題（configパースエラー、テクスチャ変換の問題）を検出するために、バイナリ化ビルドをテストします。
3. **最終テストはPBOのみで：** リリース前に、パックされたModがファイルパッチ版と同一に動作することを確認するために、PBOのみからテストします。
4. **PBOに署名して配布：** マルチプレイヤー互換性のために署名を生成します。

---

## ベストプラクティス

1. **スクリプトPBOには`-packonly`を使用してください。** スクリプトはバイナリ化されないため、`-packonly`は常に正しく、はるかに高速です。

2. **常にプレフィックスを設定してください。** プレフィックスがないと、エンジンはModのコンテンツへのパスを解決できません。すべてのPBOには正しい`-prefix`が必要です。

3. **ビルドを自動化してください。** 初日からビルドスクリプト（バッチまたはPython）を作成してください。手動パッキングはスケールせず、エラーが発生しやすいです。

4. **ソースと出力を分離してください。** ソースはP:に、ビルドされたPBOは別の出力ディレクトリまたは`@mod/addons/`に配置します。出力ディレクトリからパックしないでください。

5. **マルチプレイヤーテストにはPBOに署名してください。** 署名検証が有効なサーバーでは、署名されていないPBOは拒否されます。不要に見えても開発中に署名しておくことで、他の人がテストする際の「自分の環境では動く」問題を防ぎます。

6. **キーをバージョン管理してください。** 破壊的な変更を行う場合、新しいキーペアを生成してください。これにより、すべてのクライアントとサーバーが一緒にアップデートすることが強制されます。

7. **ファイルパッチングとPBOの両モードでテストしてください。** 一部のバグは1つのモードでのみ発生します。バイナリ化されたconfigはテキストconfigとエッジケースで異なる動作をします。

8. **出力ディレクトリを定期的にクリーンしてください。** 以前のビルドの古いPBOは紛らわしい動作を引き起こす可能性があります。`-clear`フラグを使用するか、ビルド前に手動でクリーンしてください。

9. **大規模なModを複数のPBOに分割してください。** インクリメンタルリビルドで節約される時間は、開発初日で元が取れます。

10. **ビルドログを読んでください。** BinarizeとAddonBuilderはログファイルを生成します。何か問題が起きた場合、答えはほぼ常にログにあります。`%TEMP%\AddonBuilder\`と`%TEMP%\Binarize\`で詳細な出力を確認してください。

---

## ナビゲーション

| 前 | 上 | 次 |
|----------|----|------|
| [4.5 DayZ Toolsワークフロー](05-dayz-tools.md) | [Part 4: ファイルフォーマットとDayZ Tools](01-textures.md) | [Part 5: 設定ファイル](07-workbench-guide.md) |
