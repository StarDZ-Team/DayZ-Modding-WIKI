# Chapter 5.4: ImageSetフォーマット

[ホーム](../README.md) | [<< 前: Credits.json](03-credits-json.md) | **ImageSetフォーマット** | [次: サーバー設定ファイル >>](05-server-configs.md)

---

> **概要：** ImageSetはテクスチャアトラス内の名前付きスプライト領域を定義します。レイアウトファイルやスクリプトからアイコン、UIグラフィックス、スプライトシートを参照するためのDayZの主要な仕組みです。数百の個別画像ファイルを読み込む代わりに、すべてのアイコンを1枚のテクスチャにパックし、各アイコンの位置とサイズをimagesetの定義ファイルに記述します。

---

## 目次

- [概要](#overview)
- [ImageSetの仕組み](#how-imagesets-work)
- [DayZネイティブImageSetフォーマット](#dayz-native-imageset-format)
- [XML ImageSetフォーマット](#xml-imageset-format)
- [config.cppでのImageSetの登録](#registering-imagesets-in-configcpp)
- [レイアウトでの画像参照](#referencing-images-in-layouts)
- [スクリプトでの画像参照](#referencing-images-in-scripts)
- [画像フラグ](#image-flags)
- [マルチ解像度テクスチャ](#multi-resolution-textures)
- [カスタムアイコンセットの作成](#creating-custom-icon-sets)
- [Font Awesome統合パターン](#font-awesome-integration-pattern)
- [実際の例](#real-examples)
- [よくある間違い](#common-mistakes)

---

## 概要

テクスチャアトラスは、多くの小さなアイコンをグリッドまたはフリーフォームレイアウトで配置した1枚の大きな画像（通常`.edds`フォーマット）です。imagesetファイルは、そのアトラス内の矩形領域に人間が読める名前をマッピングします。

例えば、1024x1024テクスチャに64x64ピクセルのアイコンが64個含まれているとします。imagesetファイルは「`arrow_down`という名前のアイコンは位置(128, 64)にあり、64x64ピクセルです」と記述します。レイアウトファイルとスクリプトは名前で`arrow_down`を参照し、エンジンはレンダリング時にアトラスから正しいサブ矩形を抽出します。

このアプローチは効率的です：1つのGPUテクスチャ読み込みですべてのアイコンに対応し、ドローコールとメモリオーバーヘッドを削減します。

---

## ImageSetの仕組み

データの流れは以下の通りです：

1. **テクスチャアトラス**（`.edds`ファイル） --- すべてのアイコンを含む1枚の画像
2. **ImageSet定義**（`.imageset`ファイル） --- アトラス内の領域に名前をマッピング
3. **config.cppでの登録** --- 起動時にimagesetを読み込むようエンジンに指示
4. **レイアウト/スクリプトからの参照** --- `set:name image:iconName`構文で特定のアイコンをレンダリング

一度登録すると、任意のレイアウトファイルの任意のウィジェットが、セットから名前で任意の画像を参照できます。

---

## DayZネイティブImageSetフォーマット

ネイティブフォーマットは、Enfusionエンジンのクラスベース構文（config.cppに類似）を使用します。これはバニラゲームとほとんどの確立されたModで使用されるフォーマットです。

### 構造

```
ImageSetClass {
 Name "my_icons"
 RefSize 1024 1024
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "MyMod/GUI/imagesets/my_icons.edds"
  }
 }
 Images {
  ImageSetDefClass icon_name {
   Name "icon_name"
   Pos 0 0
   Size 64 64
   Flags 0
  }
 }
}
```

### トップレベルフィールド

| フィールド | 説明 |
|-------|-------------|
| `Name` | セット名。画像参照の`set:`部分で使用されます。読み込まれたすべてのMod間で一意である必要があります。 |
| `RefSize` | テクスチャの参照寸法（幅 高さ）。座標マッピングに使用されます。 |
| `Textures` | 異なる解像度のミップレベル用に1つ以上の`ImageSetTextureClass`エントリを含みます。 |

### テクスチャエントリフィールド

| フィールド | 説明 |
|-------|-------------|
| `mpix` | 最小ピクセルレベル（ミップレベル）。`0` = 最低解像度、`1` = 標準解像度。 |
| `path` | `.edds`テクスチャファイルへのパス。Modルートからの相対パスです。Enfusion GUIDフォーマット（`{GUID}path`）またはプレーンな相対パスを使用できます。 |

### 画像エントリフィールド

各画像は`Images`ブロック内の`ImageSetDefClass`です：

| フィールド | 説明 |
|-------|-------------|
| クラス名 | `Name`フィールドと一致する必要があります（エンジンのルックアップに使用） |
| `Name` | 画像識別子。参照の`image:`部分で使用されます。 |
| `Pos` | アトラス内の左上角の位置（x y）、ピクセル単位 |
| `Size` | 寸法（幅 高さ）、ピクセル単位 |
| `Flags` | タイリング動作フラグ（[画像フラグ](#image-flags)を参照） |

### 完全な例（DayZバニラ）

```
ImageSetClass {
 Name "dayz_gui"
 RefSize 1024 1024
 Textures {
  ImageSetTextureClass {
   mpix 0
   path "{534691EE0479871C}Gui/imagesets/dayz_gui.edds"
  }
  ImageSetTextureClass {
   mpix 1
   path "{C139E49FD0ECAF9E}Gui/imagesets/dayz_gui@2x.edds"
  }
 }
 Images {
  ImageSetDefClass Gradient {
   Name "Gradient"
   Pos 0 317
   Size 75 5
   Flags ISVerticalTile
  }
  ImageSetDefClass Expand {
   Name "Expand"
   Pos 121 257
   Size 20 20
   Flags 0
  }
 }
}
```

---

## XML ImageSetフォーマット

代替のXMLベースフォーマットが存在し、一部のModで使用されています。よりシンプルですが、機能は少なくなります（マルチ解像度サポートなし）。

### 構造

```xml
<?xml version="1.0" encoding="utf-8"?>
<imageset name="mh_icons" file="MyMod/GUI/imagesets/mh_icons.edds">
  <image name="icon_store" pos="0 0" size="64 64" />
  <image name="icon_cart" pos="64 0" size="64 64" />
  <image name="icon_wallet" pos="128 0" size="64 64" />
</imageset>
```

### XML属性

**`<imageset>`要素：**

| 属性 | 説明 |
|-----------|-------------|
| `name` | セット名（ネイティブの`Name`に相当） |
| `file` | テクスチャファイルへのパス（ネイティブの`path`に相当） |

**`<image>`要素：**

| 属性 | 説明 |
|-----------|-------------|
| `name` | 画像識別子 |
| `pos` | `"x y"`としての左上位置 |
| `size` | `"幅 高さ"`としての寸法 |

### どちらのフォーマットを使うべきか

| 機能 | ネイティブフォーマット | XMLフォーマット |
|---------|---------------|------------|
| マルチ解像度（ミップレベル） | はい | いいえ |
| タイリングフラグ | はい | いいえ |
| Enfusion GUIDパス | はい | はい |
| シンプルさ | 低い | 高い |
| バニラDayZで使用 | はい | いいえ |
| Expansion、MyMod、VPPで使用 | はい | 時々 |

**推奨：** プロダクションModにはネイティブフォーマットを使用してください。タイリングやマルチ解像度サポートが不要なクイックプロトタイピングやシンプルなアイコンセットにはXMLフォーマットを使用してください。

---

## config.cppでのImageSetの登録

ImageSetファイルは、Modの`config.cpp`の`CfgMods` > `class defs` > `class imageSets`ブロックに登録する必要があります。この登録がないと、エンジンはimagesetを読み込まず、画像参照はサイレントに失敗します。

### 構文

```cpp
class CfgMods
{
    class MyMod
    {
        // ... その他のフィールド ...
        class defs
        {
            class imageSets
            {
                files[] =
                {
                    "MyMod/GUI/imagesets/my_icons.imageset",
                    "MyMod/GUI/imagesets/my_other_icons.imageset"
                };
            };
        };
    };
};
```

### 実際の例：MyFramework

MyFrameworkはFont Awesomeアイコンセットを含む7つのimagesetを登録しています：

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "MyFramework/GUI/imagesets/prefabs.imageset",
            "MyFramework/GUI/imagesets/CUI.imageset",
            "MyFramework/GUI/icons/thin.imageset",
            "MyFramework/GUI/icons/light.imageset",
            "MyFramework/GUI/icons/regular.imageset",
            "MyFramework/GUI/icons/solid.imageset",
            "MyFramework/GUI/icons/brands.imageset"
        };
    };
};
```

### 実際の例：VPP Admin Tools

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "VPPAdminTools/GUI/Textures/dayz_gui_vpp.imageset"
        };
    };
};
```

### 実際の例：DayZ Editor

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "DayZEditor/gui/imagesets/dayz_editor_gui.imageset"
        };
    };
};
```

---

## レイアウトでの画像参照

`.layout`ファイルでは、`image0`プロパティに`set:name image:imageName`構文を使用します：

```
ImageWidgetClass MyIcon {
 size 32 32
 hexactsize 1
 vexactsize 1
 image0 "set:dayz_gui image:icon_refresh"
}
```

### 構文の分解

```
set:SETNAME image:IMAGENAME
```

- `SETNAME` --- imageset定義の`Name`フィールド（例：`dayz_gui`、`solid`、`brands`）
- `IMAGENAME` --- 特定の`ImageSetDefClass`エントリの`Name`フィールド（例：`icon_refresh`、`arrow_down`）

### 複数の画像ステート

一部のウィジェットは複数の画像ステート（通常、ホバー、押下）をサポートします：

```
ImageWidgetClass icon {
 image0 "set:solid image:circle"
}

ButtonWidgetClass btn {
 image0 "set:dayz_gui image:icon_expand"
}
```

### 実際のModからの例

```
image0 "set:regular image:arrow_down_short_wide"     -- MyMod: Font Awesome regularアイコン
image0 "set:dayz_gui image:icon_minus"                -- MyMod: バニラDayZアイコン
image0 "set:dayz_gui image:icon_collapse"             -- MyMod: バニラDayZアイコン
image0 "set:dayz_gui image:circle"                    -- MyMod: バニラDayZ図形
image0 "set:dayz_editor_gui image:eye_open"           -- DayZ Editor: カスタムアイコン
```

---

## スクリプトでの画像参照

Enforce Scriptでは、`ImageWidget.LoadImageFile()`を使用するか、ウィジェットの画像プロパティを設定します：

### LoadImageFile

```c
ImageWidget icon = ImageWidget.Cast(layoutRoot.FindAnyWidget("MyIcon"));
icon.LoadImageFile(0, "set:solid image:circle");
```

`0`パラメータは画像インデックス（レイアウトの`image0`に対応）です。

### インデックスによる複数ステート

```c
ImageWidget collapseIcon;
collapseIcon.LoadImageFile(0, "set:regular image:square_plus");    // 通常ステート
collapseIcon.LoadImageFile(1, "set:solid image:square_minus");     // トグルステート
```

`SetImage(index)`を使用してステートを切り替えます：

```c
collapseIcon.SetImage(isExpanded ? 1 : 0);
```

### 文字列変数の使用

```c
// DayZ Editorから
string icon = "set:dayz_editor_gui image:search";
searchBarIcon.LoadImageFile(0, icon);

// 後で動的に変更
searchBarIcon.LoadImageFile(0, "set:dayz_gui image:icon_x");
```

---

## 画像フラグ

ネイティブフォーマットのimagesetエントリの`Flags`フィールドは、画像が自然なサイズを超えてストレッチされた場合のタイリング動作を制御します。

| フラグ | 値 | 説明 |
|------|-------|-------------|
| `0` | 0 | タイリングなし。画像はウィジェットを埋めるようにストレッチされます。 |
| `ISHorizontalTile` | 1 | ウィジェットが画像より広い場合、水平方向にタイリングします。 |
| `ISVerticalTile` | 2 | ウィジェットが画像より高い場合、垂直方向にタイリングします。 |
| 両方 | 3 | 両方向にタイリングします（`ISHorizontalTile` + `ISVerticalTile`）。 |

### 使用方法

```
ImageSetDefClass Gradient {
 Name "Gradient"
 Pos 0 317
 Size 75 5
 Flags ISVerticalTile
}
```

この`Gradient`画像は75x5ピクセルです。5ピクセルより高いウィジェットで使用すると、高さを埋めるために垂直にタイリングし、繰り返しグラデーションストライプを作成します。

ほとんどのアイコンは`Flags 0`（タイリングなし）を使用します。タイリングフラグは主にボーダー、ディバイダー、繰り返しパターンなどのUI要素に使用されます。

---

## マルチ解像度テクスチャ

ネイティブフォーマットは、同じimageset用の複数解像度テクスチャをサポートします。これにより、エンジンは高DPIディスプレイでより高解像度のアートワークを使用できます。

```
Textures {
 ImageSetTextureClass {
  mpix 0
  path "Gui/imagesets/dayz_gui.edds"
 }
 ImageSetTextureClass {
  mpix 1
  path "Gui/imagesets/dayz_gui@2x.edds"
 }
}
```

- `mpix 0` --- 低解像度（低品質設定または遠くのUI要素で使用）
- `mpix 1` --- 標準/高解像度（デフォルト）

`@2x`命名規則はAppleのRetinaディスプレイシステムから借用されていますが、強制ではありません --- ファイル名は何でも構いません。

### 実際の運用

ほとんどのModは`mpix 1`のみを含みます（単一解像度）。マルチ解像度サポートは主にバニラゲームで使用されています：

```
Textures {
 ImageSetTextureClass {
  mpix 1
  path "MyFramework/GUI/icons/solid.edds"
 }
}
```

---

## カスタムアイコンセットの作成

### ステップバイステップのワークフロー

**1. テクスチャアトラスの作成**

画像エディタ（Photoshop、GIMPなど）を使用して、1枚のキャンバスにアイコンを配置します：
- 2の累乗サイズを選択します（256x256、512x512、1024x1024など）
- 座標計算を容易にするためにアイコンをグリッドに配置します
- テクスチャブリーディングを防ぐためにアイコン間にパディングを残します
- `.tga`または`.png`として保存します

**2. EDDSに変換**

DayZはテクスチャに`.edds`（Enfusion DDS）フォーマットを使用します。DayZ WorkbenchまたはMikeroのツールで変換します：
- `.tga`をDayZ Workbenchにインポートします
- または`Pal2PacE.exe`を使用して`.paa`を`.edds`に変換します
- 出力は`.edds`ファイルである必要があります

**3. ImageSet定義の作成**

各アイコンを名前付き領域にマッピングします。アイコンが64ピクセルグリッドにある場合：

```
ImageSetClass {
 Name "mymod_icons"
 RefSize 512 512
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "MyMod/GUI/imagesets/mymod_icons.edds"
  }
 }
 Images {
  ImageSetDefClass settings {
   Name "settings"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass player {
   Name "player"
   Pos 64 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass map_marker {
   Name "map_marker"
   Pos 128 0
   Size 64 64
   Flags 0
  }
 }
}
```

**4. config.cppに登録**

Modのconfig.cppにimagesetパスを追加します：

```cpp
class imageSets
{
    files[] =
    {
        "MyMod/GUI/imagesets/mymod_icons.imageset"
    };
};
```

**5. レイアウトとスクリプトで使用**

```
ImageWidgetClass SettingsIcon {
 image0 "set:mymod_icons image:settings"
 size 32 32
 hexactsize 1
 vexactsize 1
}
```

---

## Font Awesome統合パターン

MyFramework（DabsFrameworkから継承）は、Font Awesomeアイコンフォントをdayzi imagesetに変換する強力なパターンを実演しています。これにより、カスタムアートワークを作成することなく、数千のプロフェッショナル品質のアイコンにアクセスできます。

### 仕組み

1. Font Awesomeアイコンが固定グリッドサイズ（アイコンあたり64x64）でテクスチャアトラスにレンダリングされます
2. 各アイコンスタイルが独自のimagesetを取得します：`solid`、`regular`、`light`、`thin`、`brands`
3. imageset内のアイコン名がFont Awesomeのアイコン名と一致します（例：`circle`、`arrow_down`、`discord`）
4. imagesetがconfig.cppに登録され、任意のレイアウトやスクリプトから利用可能になります

### MyFramework / DabsFrameworkアイコンセット

```
MyFramework/GUI/icons/
  solid.imageset       -- 塗りつぶしアイコン（3648x3712アトラス、アイコンあたり64x64）
  regular.imageset     -- アウトラインアイコン
  light.imageset       -- 軽量アウトラインアイコン
  thin.imageset        -- 超薄型アウトラインアイコン
  brands.imageset      -- ブランドロゴ（Discord、GitHubなど）
```

### レイアウトでの使用

```
image0 "set:solid image:circle"
image0 "set:solid image:gear"
image0 "set:regular image:arrow_down_short_wide"
image0 "set:brands image:discord"
image0 "set:brands image:500px"
```

### スクリプトでの使用

```c
// solidセットを使用するDayZ Editor
CollapseIcon.LoadImageFile(1, "set:solid image:square_minus");
CollapseIcon.LoadImageFile(0, "set:regular image:square_plus");
```

### このパターンがうまく機能する理由

- **大規模なアイコンライブラリ**：アートワーク作成なしで数千のアイコンが利用可能
- **一貫したスタイル**：すべてのアイコンが同じビジュアルウェイトとスタイルを共有
- **複数のウェイト**：異なるビジュアルコンテキストに応じてsolid、regular、light、thinを選択可能
- **ブランドアイコン**：Discord、Steam、GitHubなどの既製ロゴ
- **標準的な名前**：アイコン名がFont Awesomeの規約に従い、発見が容易

### アトラス構造

例えば、solidのimagesetは64ピクセル間隔で配置されたアイコンを持つ`RefSize`3648x3712です：

```
ImageSetClass {
 Name "solid"
 RefSize 3648 3712
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "MyFramework/GUI/icons/solid.edds"
  }
 }
 Images {
  ImageSetDefClass circle {
   Name "circle"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass 360_degrees {
   Name "360_degrees"
   Pos 320 0
   Size 64 64
   Flags 0
  }
  ...
 }
}
```

---

## 実際の例

### VPP Admin Tools

VPPはすべての管理ツールアイコンを、フリーフォームの配置（厳密なグリッドではない）で1枚の1920x1080アトラスにパックしています：

```
ImageSetClass {
 Name "dayz_gui_vpp"
 RefSize 1920 1080
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "{534691EE0479871E}VPPAdminTools/GUI/Textures/dayz_gui_vpp.edds"
  }
 }
 Images {
  ImageSetDefClass vpp_icon_cloud {
   Name "vpp_icon_cloud"
   Pos 1206 108
   Size 62 62
   Flags 0
  }
  ImageSetDefClass vpp_icon_players {
   Name "vpp_icon_players"
   Pos 391 112
   Size 62 62
   Flags 0
  }
 }
}
```

レイアウトでの参照：
```
image0 "set:dayz_gui_vpp image:vpp_icon_cloud"
```

### MyWeapons Mod

さまざまなアイコンサイズで大きなアトラスにパックされた武器とアタッチメントのアイコン：

```
ImageSetClass {
 Name "SNAFU_Weapons_Icons"
 RefSize 2048 2048
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "{7C781F3D4B1173D4}SNAFU_Guns_01/gui/Imagesets/SNAFU_Weapons_Icons.edds"
  }
 }
 Images {
  ImageSetDefClass SNAFUFGRIP {
   Name "SNAFUFGRIP"
   Pos 123 19
   Size 300 300
   Flags 0
  }
  ImageSetDefClass SNAFU_M14Optic {
   Name "SNAFU_M14Optic"
   Pos 426 20
   Size 300 300
   Flags 0
  }
 }
}
```

これは、アイコンが均一なサイズである必要がないことを示しています --- 武器のインベントリアイコンは300x300を使用し、UIアイコンは通常64x64を使用します。

### MyFramework Prefabs

小さな256x256アトラスにパックされたUIプリミティブ（角丸、アルファグラデーション）：

```
ImageSetClass {
 Name "prefabs"
 RefSize 256 256
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "{82F14D6B9D1AA1CE}MyFramework/GUI/imagesets/prefabs.edds"
  }
 }
 Images {
  ImageSetDefClass Round_Outline_TopLeft {
   Name "Round_Outline_TopLeft"
   Pos 24 21
   Size 8 8
   Flags 0
  }
  ImageSetDefClass "Alpha 10" {
   Name "Alpha 10"
   Pos 0 15
   Size 1 1
   Flags 0
  }
 }
}
```

注目点：画像名はクォートで囲むことでスペースを含むことができます（例：`"Alpha 10"`）。ただし、レイアウトでこれらを参照するにはスペースを含む正確な名前が必要です。

### MyMod Market Hub（XMLフォーマット）

マーケットハブモジュール用のよりシンプルなXML imageset：

```xml
<?xml version="1.0" encoding="utf-8"?>
<imageset name="mh_icons" file="DayZMarketHub/GUI/imagesets/mh_icons.edds">
  <image name="icon_store" pos="0 0" size="64 64" />
  <image name="icon_cart" pos="64 0" size="64 64" />
  <image name="icon_wallet" pos="128 0" size="64 64" />
  <image name="icon_vip" pos="192 0" size="64 64" />
  <image name="icon_weapons" pos="0 64" size="64 64" />
  <image name="icon_success" pos="0 192" size="64 64" />
  <image name="icon_error" pos="64 192" size="64 64" />
</imageset>
```

参照方法：
```
image0 "set:mh_icons image:icon_store"
```

---

## よくある間違い

### config.cppでの登録忘れ

最も一般的な問題です。imagesetファイルが存在していても、config.cppの`class imageSets { files[] = { ... }; };`にリストされていない場合、エンジンはそれを読み込みません。すべての画像参照はサイレントに失敗します（ウィジェットが空白で表示されます）。

### セット名の衝突

2つのModが同じ`Name`でimagesetを登録した場合、1つのみが読み込まれます（最後のものが優先）。一意のプレフィックスを使用してください：

```
Name "mymod_icons"     -- 良い
Name "icons"           -- リスクあり、一般的すぎる
```

### 間違ったテクスチャパス

`path`はPBOルートからの相対パス（パックされたPBO内でファイルがどのように表示されるか）である必要があります：

```
path "MyMod/GUI/imagesets/icons.edds"     -- PBOルートがMyMod/の場合は正しい
path "GUI/imagesets/icons.edds"            -- PBOルートがMyMod/の場合は間違い
path "C:/Users/dev/icons.edds"            -- 間違い：絶対パスは機能しません
```

### RefSizeの不一致

`RefSize`はテクスチャの実際のピクセル寸法と一致する必要があります。`RefSize 512 512`を指定しているがテクスチャが1024x1024の場合、すべてのアイコン位置が2倍ずれます。

### Pos座標の1ピクセルズレ

`Pos`はアイコン領域の左上角です。アイコンが64ピクセル間隔にあるが、誤って1ピクセルオフセットした場合、隣接するアイコンの薄いスライスが見えてしまいます。

### .pngや.tgaの直接使用

エンジンは、imagesetが参照するテクスチャアトラスに`.edds`フォーマットを必要とします。生の`.png`や`.tga`ファイルは読み込まれません。DayZ WorkbenchまたはMikeroのツールを使用して常に`.edds`に変換してください。

### 画像名のスペース

エンジンは画像名のスペースをサポートしていますが（例：`"Alpha 10"`）、一部のパースコンテキストで問題を引き起こす可能性があります。アンダースコアの使用を推奨します：`Alpha_10`。

---

## ベストプラクティス

- 常に一意のMod接頭辞付きセット名を使用してください（例：`"icons"`ではなく`"mymod_icons"`）。Mod間のセット名の衝突により、一方のセットがもう一方をサイレントに上書きします。
- 2の累乗のテクスチャ寸法を使用してください（256x256、512x512、1024x1024）。2の累乗でないテクスチャも動作しますが、一部のGPUでレンダリングパフォーマンスが低下する可能性があります。
- アトラス内のアイコン間に1〜2ピクセルのパディングを追加して、テクスチャがネイティブ以外のサイズで表示されたときのエッジでのテクスチャブリーディングを防いでください。
- プロダクションModにはXMLよりもネイティブ`.imageset`フォーマットを使用してください。XMLフォーマットにはないマルチ解像度テクスチャとタイリングフラグをサポートします。
- `RefSize`がテクスチャの実際の寸法と正確に一致することを確認してください。不一致があると、すべてのアイコン座標が比例係数分ずれます。

---

## 理論と実践

> ドキュメントに書かれていることと、実際のランタイムでの動作の比較。

| 概念 | 理論 | 現実 |
|---------|--------|---------|
| config.cppの登録が必要 | ImageSetは`class imageSets`にリストされる必要がある | 正しく、これが「空白のアイコン」バグの最も一般的な原因です。登録がない場合、エンジンはエラーを出しません --- ウィジェットは単に空でレンダリングされます |
| `RefSize`が座標をマッピング | 座標は`RefSize`空間にある | `RefSize`はテクスチャの実際のピクセル寸法と一致する必要があります。テクスチャが1024x1024なのに`RefSize`が512x512の場合、すべての`Pos`値は2倍のスケールで解釈されます |
| XMLフォーマットはよりシンプル | 機能は少ないが同じように動作する | XML imagesetではタイリングフラグやマルチ解像度ミップレベルを指定できません。アイコンには問題ありませんが、繰り返しUI要素（ボーダー、グラデーション）にはネイティブフォーマットが必要です |
| 複数の`mpix`エントリ | エンジンが品質設定で選択 | 実際には、ほとんどのModは`mpix 1`のみを同梱しています。ミップレベルが1つだけ提供された場合、エンジンは適切にフォールバックします --- 視覚的な不具合はなく、高DPI最適化がないだけです |
| 画像名は大文字小文字を区別 | `"MyIcon"`と`"myicon"`は異なる | imageset定義では正しいですが、スクリプトの`LoadImageFile()`は一部のエンジンビルドで大文字小文字を区別しないルックアップを行います。安全のため常に大文字小文字を正確に一致させてください |

---

## 互換性と影響

- **マルチMod：** セット名の衝突が主なリスクです。2つのModが`"icons"`という名前のimagesetを定義した場合、1つだけが読み込まれます（最後のPBOが優先）。負けたMod内の`set:icons`へのすべての参照がサイレントに壊れます。常にMod固有のプレフィックスを使用してください。
- **パフォーマンス：** 各ユニークなimagesetテクスチャは1つのGPUテクスチャ読み込みです。アイコンをより少数の大きなアトラスに統合することでドローコールが減少します。10個の個別64x64テクスチャを持つModは、10個のアイコンを持つ1つの512x512アトラスよりもパフォーマンスが悪くなります。
- **バージョン：** ネイティブ`.imageset`フォーマットと`set:name image:name`参照構文はDayZ 1.0以降安定しています。XMLフォーマットは初期バージョンから代替として利用可能ですが、Bohemiaによって公式にドキュメント化されていません。

---

## 実際のModでの観察

| パターン | Mod | 詳細 |
|---------|-----|--------|
| Font Awesomeアイコンアトラス | DabsFramework / StarDZ Core | Font Awesomeアイコンを大きなアトラス（3648x3712）にレンダリングし、`set:solid`、`set:regular`、`set:brands`で数千のプロフェッショナルアイコンを提供 |
| フリーフォームアトラスレイアウト | VPP Admin Tools | 1920x1080アトラスにさまざまなサイズのアイコンを不均一に配置し、テクスチャスペースの使用を最大化 |
| 機能ごとの小さなアトラス | Expansion | 各Expansionサブモジュールが1つの巨大なアトラスではなく独自の小さなimagesetを持ち、PBOサイズを最小限に保つ |
| 300x300インベントリアイコン | SNAFU Weapons | 詳細が重要な武器/アタッチメントインベントリスロット用の大きなアイコンサイズ（64x64のUIアイコンとは異なる） |
